/**
 * CancellationToken implementation for the Progressive Feedback System
 *
 * Provides a mechanism to signal that an operation should be aborted.
 * Supports multiple callback registrations and hierarchical cancellation.
 *
 * @module feedback/CancellationToken
 */

import type { CancellationToken as ICancellationToken } from './types';

/**
 * Implementation of CancellationToken interface.
 *
 * Allows operations to be cancelled and provides a way to register
 * cleanup callbacks that are invoked when cancellation is requested.
 *
 * @example
 * ```ts
 * const token = new CancellationTokenSource();
 *
 * // Register cleanup callback
 * const unsubscribe = token.onCancel(() => {
 *   console.log('Operation cancelled, cleaning up...');
 * });
 *
 * // Check cancellation status
 * if (token.isCancelled) {
 *   return;
 * }
 *
 * // Request cancellation
 * token.cancel();
 * ```
 */
export class CancellationTokenSource implements ICancellationToken {
	private _isCancelled = false;
	private _callbacks: Set<() => void> = new Set();
	private _children: Set<CancellationTokenSource> = new Set();
	private _parent: CancellationTokenSource | null = null;

	/**
	 * Create a new CancellationTokenSource.
	 *
	 * @param parent - Optional parent token for hierarchical cancellation
	 */
	constructor(parent?: CancellationTokenSource) {
		if (parent) {
			this._parent = parent;
			parent._children.add(this);

			// If parent is already cancelled, cancel this token immediately
			if (parent.isCancelled) {
				this._isCancelled = true;
			}
		}
	}

	/**
	 * Whether cancellation has been requested.
	 */
	get isCancelled(): boolean {
		return this._isCancelled;
	}

	/**
	 * Register a callback to be called when cancellation is requested.
	 *
	 * If the token is already cancelled, the callback is invoked immediately.
	 *
	 * @param callback - Function to call when cancellation is requested
	 * @returns Unsubscribe function to remove the callback
	 */
	onCancel(callback: () => void): () => void {
		// If already cancelled, invoke callback immediately
		if (this._isCancelled) {
			try {
				callback();
			} catch {
				// Swallow errors from callbacks to prevent breaking other callbacks
			}
			return () => {};
		}

		this._callbacks.add(callback);

		// Return unsubscribe function
		return () => {
			this._callbacks.delete(callback);
		};
	}

	/**
	 * Request cancellation of the operation.
	 *
	 * This will:
	 * 1. Set isCancelled to true
	 * 2. Invoke all registered callbacks
	 * 3. Cancel all child tokens (hierarchical cancellation)
	 *
	 * Calling cancel() multiple times has no additional effect.
	 */
	cancel(): void {
		if (this._isCancelled) {
			return;
		}

		this._isCancelled = true;

		// Invoke all registered callbacks
		for (const callback of this._callbacks) {
			try {
				callback();
			} catch {
				// Swallow errors from callbacks to prevent breaking other callbacks
			}
		}

		// Cancel all child tokens (hierarchical cancellation)
		for (const child of this._children) {
			child.cancel();
		}
	}

	/**
	 * Create a child token that will be cancelled when this token is cancelled.
	 *
	 * @returns A new CancellationTokenSource linked to this parent
	 */
	createChild(): CancellationTokenSource {
		return new CancellationTokenSource(this);
	}

	/**
	 * Detach this token from its parent.
	 *
	 * After detaching, cancelling the parent will no longer cancel this token.
	 */
	detachFromParent(): void {
		if (this._parent) {
			this._parent._children.delete(this);
			this._parent = null;
		}
	}

	/**
	 * Dispose of this token and clean up resources.
	 *
	 * Detaches from parent and clears all callbacks and children references.
	 */
	dispose(): void {
		this.detachFromParent();
		this._callbacks.clear();
		this._children.clear();
	}
}

/**
 * Create a simple cancellation token without parent relationship.
 *
 * @returns A new CancellationTokenSource
 */
export function createCancellationToken(): CancellationTokenSource {
	return new CancellationTokenSource();
}

/**
 * Create a linked cancellation token that cancels when any of the provided tokens cancel.
 *
 * @param tokens - Tokens to link together
 * @returns A new token that cancels when any input token cancels
 */
export function createLinkedToken(
	...tokens: ICancellationToken[]
): CancellationTokenSource {
	const linked = new CancellationTokenSource();

	for (const token of tokens) {
		if (token.isCancelled) {
			linked.cancel();
			break;
		}

		token.onCancel(() => {
			linked.cancel();
		});
	}

	return linked;
}
