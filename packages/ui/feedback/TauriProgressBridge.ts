/**
 * TauriProgressBridge - Bridge between Tauri backend events and OperationManager
 *
 * Listens for Tauri progress events and maps them to OperationManager updates.
 * Provides seamless integration between Rust backend operations and the
 * Progressive Feedback System.
 *
 * @module feedback/TauriProgressBridge
 *
 * **Validates: Requirements 8.1, 8.3**
 */

import type { TauriProgressEvent, ProgressState } from './types';
import { OperationManager, getOperationManager } from './OperationManager';

/**
 * Type definition for Tauri event listener.
 * This matches the Tauri API signature for event listeners.
 */
export type TauriEventCallback<T> = (event: { payload: T }) => void;

/**
 * Type definition for Tauri unlisten function.
 */
export type TauriUnlistenFn = () => void;

/**
 * Interface for Tauri event API.
 * This allows for mocking in tests and provides type safety.
 */
export interface TauriEventAPI {
	listen: <T>(
		event: string,
		handler: TauriEventCallback<T>
	) => Promise<TauriUnlistenFn>;
	emit: (event: string, payload?: unknown) => Promise<void>;
}

/**
 * Configuration options for TauriProgressBridge.
 */
export interface TauriProgressBridgeOptions {
	/** Custom OperationManager instance (uses singleton if not provided) */
	operationManager?: OperationManager;
	/** Custom Tauri event API (uses window.__TAURI__ if not provided) */
	tauriEventAPI?: TauriEventAPI;
	/** Event name for progress updates (default: 'progress-update') */
	progressEventName?: string;
	/** Event name for cancellation requests (default: 'cancel-operation') */
	cancelEventName?: string;
	/** Whether to auto-start listening on construction (default: true) */
	autoStart?: boolean;
}

/**
 * Default event names for Tauri communication.
 */
export const DEFAULT_PROGRESS_EVENT_NAME = 'progress-update';
export const DEFAULT_CANCEL_EVENT_NAME = 'cancel-operation';

/**
 * TauriProgressBridge class for bridging Tauri events to OperationManager.
 *
 * Listens for progress events from the Tauri backend and updates the
 * corresponding operations in the OperationManager. Also provides
 * methods to send cancellation signals back to the backend.
 *
 * @example
 * ```ts
 * // Create and start the bridge
 * const bridge = new TauriProgressBridge();
 * await bridge.start();
 *
 * // The bridge will now automatically handle progress events
 * // from the Tauri backend
 *
 * // When done, stop the bridge
 * bridge.stop();
 * ```
 */
export class TauriProgressBridge {
	private _operationManager: OperationManager;
	private _tauriEventAPI: TauriEventAPI | null = null;
	private _progressEventName: string;
	private _cancelEventName: string;
	private _unlistenFn: TauriUnlistenFn | null = null;
	private _isListening = false;

	/**
	 * Create a new TauriProgressBridge.
	 *
	 * @param options - Configuration options
	 */
	constructor(options: TauriProgressBridgeOptions = {}) {
		this._operationManager =
			options.operationManager ?? getOperationManager();
		this._progressEventName =
			options.progressEventName ?? DEFAULT_PROGRESS_EVENT_NAME;
		this._cancelEventName =
			options.cancelEventName ?? DEFAULT_CANCEL_EVENT_NAME;

		// Use provided API or try to get from window
		if (options.tauriEventAPI) {
			this._tauriEventAPI = options.tauriEventAPI;
		} else {
			this._tauriEventAPI = this._getTauriEventAPI();
		}

		// Auto-start if configured (default: true)
		if (options.autoStart !== false && this._tauriEventAPI) {
			// Start asynchronously to not block constructor
			this.start().catch((err) => {
				console.error('Failed to auto-start TauriProgressBridge:', err);
			});
		}
	}

	/**
	 * Check if the bridge is currently listening for events.
	 */
	get isListening(): boolean {
		return this._isListening;
	}

	/**
	 * Check if Tauri API is available.
	 */
	get isTauriAvailable(): boolean {
		return this._tauriEventAPI !== null;
	}

	/**
	 * Start listening for Tauri progress events.
	 *
	 * @returns Promise that resolves when listening has started
	 * @throws Error if Tauri API is not available
	 */
	async start(): Promise<void> {
		if (this._isListening) {
			return;
		}

		if (!this._tauriEventAPI) {
			throw new Error(
				'Tauri API is not available. TauriProgressBridge requires a Tauri environment.'
			);
		}

		try {
			this._unlistenFn = await this._tauriEventAPI.listen<TauriProgressEvent>(
				this._progressEventName,
				(event) => this._handleProgressEvent(event.payload)
			);
			this._isListening = true;
		} catch (err) {
			throw new Error(
				`Failed to start listening for Tauri events: ${err instanceof Error ? err.message : String(err)}`
			);
		}
	}

	/**
	 * Stop listening for Tauri progress events.
	 */
	stop(): void {
		if (this._unlistenFn) {
			this._unlistenFn();
			this._unlistenFn = null;
		}
		this._isListening = false;
	}

	/**
	 * Send a cancellation signal to the Tauri backend.
	 *
	 * @param operationId - ID of the operation to cancel
	 * @returns Promise that resolves when the signal has been sent
	 */
	async sendCancellation(operationId: string): Promise<void> {
		if (!this._tauriEventAPI) {
			throw new Error(
				'Tauri API is not available. Cannot send cancellation signal.'
			);
		}

		await this._tauriEventAPI.emit(this._cancelEventName, { operationId });
	}

	/**
	 * Handle a progress event from Tauri.
	 *
	 * Maps the Tauri event to the appropriate OperationManager method.
	 *
	 * @param event - The progress event from Tauri
	 */
	private _handleProgressEvent(event: TauriProgressEvent): void {
		const { operationId, type, progress, error, result } = event;

		// Get or create the operation
		let operation = this._operationManager.getOperation(operationId);

		// If operation doesn't exist and this is a progress event, create it
		if (!operation && type === 'progress') {
			const handle = this._operationManager.startOperation({
				id: operationId,
			});
			operation = this._operationManager.getOperation(operationId);

			// Set up cancellation bridge for this operation
			handle.cancellationToken.onCancel(() => {
				this.sendCancellation(operationId).catch((err) => {
					console.error(
						`Failed to send cancellation for ${operationId}:`,
						err
					);
				});
			});
		}

		if (!operation) {
			// Operation not found and not a progress event - ignore
			return;
		}

		switch (type) {
			case 'progress':
				if (progress) {
					const progressState: Partial<ProgressState> = {
						message: progress.message,
					};

					// Determine progress type based on total
					if (progress.total > 0) {
						progressState.type = 'determinate';
						progressState.value = Math.round(
							(progress.current / progress.total) * 100
						);
					} else {
						progressState.type = 'indeterminate';
					}

					this._operationManager.updateProgress(operationId, progressState);
				}
				break;

			case 'complete':
				this._operationManager.completeOperation(operationId, result);
				break;

			case 'error':
				this._operationManager.failOperation(
					operationId,
					new Error(error ?? 'Unknown error from backend')
				);
				break;

			case 'cancelled':
				this._operationManager.cancelOperation(operationId);
				break;
		}
	}

	/**
	 * Try to get the Tauri event API from the window object.
	 *
	 * @returns Tauri event API or null if not available
	 */
	private _getTauriEventAPI(): TauriEventAPI | null {
		// Check if we're in a Tauri environment
		if (
			typeof window !== 'undefined' &&
			(window as unknown as { __TAURI__?: { event?: TauriEventAPI } })
				.__TAURI__?.event
		) {
			return (
				window as unknown as { __TAURI__: { event: TauriEventAPI } }
			).__TAURI__.event;
		}
		return null;
	}

	/**
	 * Dispose of the bridge and clean up resources.
	 */
	dispose(): void {
		this.stop();
		this._tauriEventAPI = null;
	}
}

/**
 * Singleton instance of TauriProgressBridge.
 */
let _defaultBridge: TauriProgressBridge | null = null;

/**
 * Get the default TauriProgressBridge instance.
 *
 * Creates a new instance if one doesn't exist.
 * Note: The bridge will only work in a Tauri environment.
 *
 * @returns The singleton TauriProgressBridge instance
 */
export function getTauriProgressBridge(): TauriProgressBridge {
	if (!_defaultBridge) {
		_defaultBridge = new TauriProgressBridge({ autoStart: false });
	}
	return _defaultBridge;
}

/**
 * Reset the default TauriProgressBridge instance.
 *
 * Useful for testing.
 */
export function resetTauriProgressBridge(): void {
	if (_defaultBridge) {
		_defaultBridge.dispose();
		_defaultBridge = null;
	}
}

/**
 * Process a Tauri progress event directly.
 *
 * Utility function for handling events without using the bridge's
 * event listener. Useful for testing or manual event injection.
 *
 * @param event - The progress event to process
 * @param operationManager - Optional OperationManager instance
 */
export function processTauriProgressEvent(
	event: TauriProgressEvent,
	operationManager?: OperationManager
): void {
	const manager = operationManager ?? getOperationManager();
	const bridge = new TauriProgressBridge({
		operationManager: manager,
		autoStart: false,
	});

	// Access private method through type assertion for utility function
	(bridge as unknown as { _handleProgressEvent: (e: TauriProgressEvent) => void })._handleProgressEvent(event);
}
