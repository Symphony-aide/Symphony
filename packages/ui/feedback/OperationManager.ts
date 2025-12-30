/**
 * OperationManager - Central service for tracking async operations
 *
 * Manages operation lifecycle, escalation timers, progress updates,
 * and hierarchical operation relationships.
 *
 * @module feedback/OperationManager
 */

import type {
	OperationState,
	OperationHandle,
	OperationRegistry,
	StartOperationOptions,
	ProgressState,
	EscalationConfig,
	EscalationLevel,
} from './types';
import { CancellationTokenSource } from './CancellationToken';
import { generateOperationId, mergeEscalationConfig } from './utils';

/**
 * OperationManager class for managing async operation lifecycle.
 *
 * Provides centralized tracking of operations with:
 * - Automatic escalation based on duration thresholds
 * - Progress tracking with 60fps throttling
 * - Hierarchical operation support (parent-child relationships)
 * - Subscription mechanism for state changes
 *
 * @example
 * ```ts
 * const manager = new OperationManager();
 *
 * // Start an operation
 * const handle = manager.startOperation({ id: 'my-op' });
 *
 * // Update progress
 * handle.updateProgress({ type: 'determinate', value: 50 });
 *
 * // Complete the operation
 * handle.complete({ result: 'success' });
 * ```
 */
/** Timer ID type for cross-environment compatibility */
type TimerId = ReturnType<typeof setTimeout>;

export class OperationManager {
	private _registry: OperationRegistry = {
		operations: new Map(),
		timers: new Map(),
		subscriptions: new Map(),
	};

	/** Throttle interval for progress updates (60fps = ~16.67ms) */
	private static readonly PROGRESS_THROTTLE_MS = 1000 / 60;

	/** Map of operation ID to last progress update timestamp */
	private _lastProgressUpdate: Map<string, number> = new Map();

	/** Map of operation ID to pending progress update */
	private _pendingProgressUpdate: Map<string, Partial<ProgressState>> =
		new Map();

	/** Map of operation ID to pending progress timeout */
	private _progressTimeouts: Map<string, TimerId> = new Map();

	/** Map of operation ID to cancellation token */
	private _cancellationTokens: Map<string, CancellationTokenSource> =
		new Map();

	/**
	 * Start tracking a new operation.
	 *
	 * @param options - Options for the new operation
	 * @returns OperationHandle for controlling the operation
	 */
	startOperation(options: StartOperationOptions = {}): OperationHandle {
		const id = options.id ?? generateOperationId();
		const config = mergeEscalationConfig(options.config);
		const startTime = Date.now();

		// Create cancellation token, linked to parent if specified
		let cancellationToken: CancellationTokenSource;
		if (options.parentId) {
			const parentToken = this._cancellationTokens.get(options.parentId);
			cancellationToken = parentToken
				? parentToken.createChild()
				: new CancellationTokenSource();
		} else {
			cancellationToken = new CancellationTokenSource();
		}
		this._cancellationTokens.set(id, cancellationToken);

		// Create initial operation state
		const state: OperationState = {
			id,
			status: 'running',
			escalationLevel: 'none',
			progress: { type: 'indeterminate' },
			startTime,
			parentId: options.parentId,
			childIds: [],
			config,
		};

		// Register operation
		this._registry.operations.set(id, state);
		this._registry.subscriptions.set(id, new Set());

		// Register as child of parent if specified
		if (options.parentId) {
			const parentState = this._registry.operations.get(options.parentId);
			if (parentState) {
				parentState.childIds.push(id);
				this._notifySubscribers(options.parentId);
			}
		}

		// Set up escalation timers
		this._setupEscalationTimers(id, config);

		// Notify subscribers of initial state
		this._notifySubscribers(id);

		// Return operation handle
		return {
			id,
			cancellationToken,
			updateProgress: (progress: Partial<ProgressState>) =>
				this.updateProgress(id, progress),
			complete: (result?: unknown) => this.completeOperation(id, result),
			fail: (error: Error) => this.failOperation(id, error),
		};
	}

	/**
	 * Get the current state of an operation.
	 *
	 * @param id - Operation ID
	 * @returns Operation state or undefined if not found
	 */
	getOperation(id: string): OperationState | undefined {
		return this._registry.operations.get(id);
	}

	/**
	 * Update operation progress with 60fps throttling.
	 *
	 * @param id - Operation ID
	 * @param progress - Partial progress state to merge
	 */
	updateProgress(id: string, progress: Partial<ProgressState>): void {
		const state = this._registry.operations.get(id);
		if (!state || state.status !== 'running') {
			return;
		}

		const now = Date.now();
		const lastUpdate = this._lastProgressUpdate.get(id) ?? 0;
		const timeSinceLastUpdate = now - lastUpdate;

		if (timeSinceLastUpdate >= OperationManager.PROGRESS_THROTTLE_MS) {
			// Apply update immediately
			this._applyProgressUpdate(id, progress);
			this._lastProgressUpdate.set(id, now);

			// Clear any pending update
			const pendingTimeout = this._progressTimeouts.get(id);
			if (pendingTimeout !== undefined) {
				clearTimeout(pendingTimeout);
				this._progressTimeouts.delete(id);
			}
			this._pendingProgressUpdate.delete(id);
		} else {
			// Store pending update and schedule
			this._pendingProgressUpdate.set(id, {
				...this._pendingProgressUpdate.get(id),
				...progress,
			});

			// Schedule update if not already scheduled
			if (!this._progressTimeouts.has(id)) {
				const delay =
					OperationManager.PROGRESS_THROTTLE_MS - timeSinceLastUpdate;
				const timeout = setTimeout(() => {
					const pending = this._pendingProgressUpdate.get(id);
					if (pending) {
						this._applyProgressUpdate(id, pending);
						this._lastProgressUpdate.set(id, Date.now());
						this._pendingProgressUpdate.delete(id);
					}
					this._progressTimeouts.delete(id);
				}, delay);
				this._progressTimeouts.set(id, timeout);
			}
		}
	}

	/**
	 * Mark an operation as completed.
	 *
	 * @param id - Operation ID
	 * @param result - Optional result data
	 */
	completeOperation(id: string, result?: unknown): void {
		const state = this._registry.operations.get(id);
		if (!state || state.status !== 'running') {
			return;
		}

		// Aggregate child results if this operation has children
		const aggregatedResult = this._aggregateChildResults(id, result);

		// Update state
		state.status = 'completed';
		state.progress = { type: 'determinate', value: 100 };
		state.result = aggregatedResult;

		// Clean up timers and resources
		this._cleanupOperation(id);

		// Notify subscribers
		this._notifySubscribers(id);
	}

	/**
	 * Mark an operation as failed.
	 *
	 * @param id - Operation ID
	 * @param error - Error that caused the failure
	 */
	failOperation(id: string, error: Error): void {
		const state = this._registry.operations.get(id);
		if (!state || state.status !== 'running') {
			return;
		}

		// Update state
		state.status = 'failed';
		state.error = error;

		// Clean up timers and resources
		this._cleanupOperation(id);

		// Notify subscribers
		this._notifySubscribers(id);
	}

	/**
	 * Cancel an operation and all its children.
	 *
	 * @param id - Operation ID
	 */
	cancelOperation(id: string): void {
		const state = this._registry.operations.get(id);
		if (!state || state.status !== 'running') {
			return;
		}

		// Cancel the cancellation token (this will cascade to children)
		const token = this._cancellationTokens.get(id);
		if (token) {
			token.cancel();
		}

		// Update state
		state.status = 'cancelled';

		// Clean up timers and resources
		this._cleanupOperation(id);

		// Notify subscribers
		this._notifySubscribers(id);

		// Cancel all child operations
		for (const childId of state.childIds) {
			this.cancelOperation(childId);
		}
	}

	/**
	 * Subscribe to state changes for an operation.
	 *
	 * @param id - Operation ID
	 * @param callback - Function to call when state changes
	 * @returns Unsubscribe function
	 */
	subscribe(
		id: string,
		callback: (state: OperationState) => void
	): () => void {
		const subscriptions = this._registry.subscriptions.get(id);
		if (!subscriptions) {
			return () => {};
		}

		subscriptions.add(callback);

		// Immediately call with current state
		const state = this._registry.operations.get(id);
		if (state) {
			callback(state);
		}

		return () => {
			subscriptions.delete(callback);
		};
	}

	/**
	 * Get all active operations.
	 *
	 * @returns Array of active operation states
	 */
	getActiveOperations(): OperationState[] {
		return Array.from(this._registry.operations.values()).filter(
			(op) => op.status === 'running'
		);
	}

	/**
	 * Get child operations for a parent.
	 *
	 * @param parentId - Parent operation ID
	 * @returns Array of child operation states
	 */
	getChildOperations(parentId: string): OperationState[] {
		const parent = this._registry.operations.get(parentId);
		if (!parent) {
			return [];
		}

		return parent.childIds
			.map((id) => this._registry.operations.get(id))
			.filter((op): op is OperationState => op !== undefined);
	}

	/**
	 * Clean up completed/failed/cancelled operations.
	 *
	 * @param maxAge - Maximum age in ms for completed operations (default: 5000)
	 */
	cleanup(maxAge: number = 5000): void {
		const now = Date.now();
		for (const [id, state] of this._registry.operations) {
			if (
				state.status !== 'running' &&
				now - state.startTime > maxAge
			) {
				this._removeOperation(id);
			}
		}
	}

	/**
	 * Set up escalation timers for an operation.
	 */
	private _setupEscalationTimers(
		id: string,
		config: EscalationConfig
	): void {
		const timers: TimerId[] = [];

		// Check if this operation has a parent with shared timers
		const state = this._registry.operations.get(id);
		if (state?.parentId) {
			const parentTimers = this._registry.timers.get(state.parentId);
			if (parentTimers && parentTimers.length > 0) {
				// Share parent's escalation timers - don't create new ones
				this._registry.timers.set(id, []);
				return;
			}
		}

		// Timer for inline escalation
		const inlineTimer = setTimeout(() => {
			this._escalateTo(id, 'inline');
		}, config.inlineThreshold);
		timers.push(inlineTimer);

		// Timer for overlay escalation
		const overlayTimer = setTimeout(() => {
			this._escalateTo(id, 'overlay');
		}, config.overlayThreshold);
		timers.push(overlayTimer);

		// Timer for modal escalation
		const modalTimer = setTimeout(() => {
			this._escalateTo(id, 'modal');
		}, config.modalThreshold);
		timers.push(modalTimer);

		// Timer for timeout if configured
		if (config.timeout) {
			const timeoutTimer = setTimeout(() => {
				this.failOperation(
					id,
					new Error(`Operation timed out after ${config.timeout}ms`)
				);
			}, config.timeout);
			timers.push(timeoutTimer);
		}

		this._registry.timers.set(id, timers);
	}

	/**
	 * Escalate an operation to a new level.
	 */
	private _escalateTo(id: string, level: EscalationLevel): void {
		const state = this._registry.operations.get(id);
		if (!state || state.status !== 'running') {
			return;
		}

		// Only escalate if the new level is higher
		const levels: EscalationLevel[] = ['none', 'inline', 'overlay', 'modal'];
		const currentIndex = levels.indexOf(state.escalationLevel);
		const newIndex = levels.indexOf(level);

		if (newIndex > currentIndex) {
			state.escalationLevel = level;
			this._notifySubscribers(id);
		}
	}

	/**
	 * Apply a progress update to an operation.
	 */
	private _applyProgressUpdate(
		id: string,
		progress: Partial<ProgressState>
	): void {
		const state = this._registry.operations.get(id);
		if (!state || state.status !== 'running') {
			return;
		}

		// Merge progress update
		state.progress = {
			...state.progress,
			...progress,
		};

		// Notify subscribers
		this._notifySubscribers(id);
	}

	/**
	 * Notify all subscribers of an operation's state change.
	 */
	private _notifySubscribers(id: string): void {
		const state = this._registry.operations.get(id);
		const subscriptions = this._registry.subscriptions.get(id);

		if (state && subscriptions) {
			for (const callback of subscriptions) {
				try {
					callback(state);
				} catch {
					// Swallow errors from callbacks
				}
			}
		}
	}

	/**
	 * Clean up timers and resources for an operation.
	 */
	private _cleanupOperation(id: string): void {
		// Clear escalation timers
		const timers = this._registry.timers.get(id);
		if (timers) {
			for (const timer of timers) {
				clearTimeout(timer);
			}
			this._registry.timers.delete(id);
		}

		// Clear progress throttling state
		const progressTimeout = this._progressTimeouts.get(id);
		if (progressTimeout !== undefined) {
			clearTimeout(progressTimeout);
			this._progressTimeouts.delete(id);
		}
		this._lastProgressUpdate.delete(id);
		this._pendingProgressUpdate.delete(id);

		// Dispose cancellation token
		const token = this._cancellationTokens.get(id);
		if (token) {
			token.dispose();
			this._cancellationTokens.delete(id);
		}
	}

	/**
	 * Remove an operation from the registry.
	 */
	private _removeOperation(id: string): void {
		this._cleanupOperation(id);
		this._registry.operations.delete(id);
		this._registry.subscriptions.delete(id);
	}

	/**
	 * Aggregate results from child operations.
	 *
	 * @param parentId - Parent operation ID
	 * @param parentResult - Result from the parent operation itself
	 * @returns Aggregated result including child results
	 */
	private _aggregateChildResults(
		parentId: string,
		parentResult?: unknown
	): unknown {
		const parent = this._registry.operations.get(parentId);
		if (!parent || parent.childIds.length === 0) {
			return parentResult;
		}

		const childResults: Array<{
			id: string;
			status: string;
			result?: unknown;
			error?: string;
		}> = [];

		for (const childId of parent.childIds) {
			const child = this._registry.operations.get(childId);
			if (child) {
				childResults.push({
					id: child.id,
					status: child.status,
					result: child.result,
					error: child.error?.message,
				});
			}
		}

		return {
			result: parentResult,
			children: childResults,
		};
	}
}

/**
 * Singleton instance of OperationManager.
 *
 * Use this for application-wide operation tracking.
 */
let _defaultManager: OperationManager | null = null;

/**
 * Get the default OperationManager instance.
 *
 * @returns The singleton OperationManager instance
 */
export function getOperationManager(): OperationManager {
	if (!_defaultManager) {
		_defaultManager = new OperationManager();
	}
	return _defaultManager;
}

/**
 * Reset the default OperationManager instance.
 *
 * Useful for testing.
 */
export function resetOperationManager(): void {
	_defaultManager = null;
}
