/**
 * useTauriOperation - Hook for Tauri backend operations with feedback integration
 *
 * Provides a convenient way to invoke Tauri commands with automatic
 * progress tracking, cancellation support, and feedback UI integration.
 *
 * @module feedback/hooks/useTauriOperation
 *
 * **Validates: Requirements 8.2, 8.4**
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
	CancellationToken,
	EscalationConfig,
	OperationState,
	TauriProgressEvent,
} from '../types';
import { getOperationManager, OperationManager } from '../OperationManager';
import {
	getTauriProgressBridge,
	TauriProgressBridge,
} from '../TauriProgressBridge';

/**
 * Type definition for Tauri invoke function.
 */
export type TauriInvokeFn = <T>(
	cmd: string,
	args?: Record<string, unknown>
) => Promise<T>;

/**
 * Interface for Tauri API with invoke capability.
 */
export interface TauriAPI {
	invoke: TauriInvokeFn;
}

/**
 * Options for useTauriOperation hook.
 */
export interface UseTauriOperationOptions<TArgs, TResult> {
	/** Tauri command name to invoke */
	command: string;
	/** Function to transform hook args to Tauri command args */
	argsTransformer?: (args: TArgs) => Record<string, unknown>;
	/** Custom escalation configuration */
	config?: Partial<EscalationConfig>;
	/** Parent operation ID for hierarchical operations */
	parentId?: string;
	/** Callback when operation succeeds */
	onSuccess?: (result: TResult) => void;
	/** Callback when operation fails */
	onError?: (error: Error) => void;
	/** Callback when operation is cancelled */
	onCancel?: () => void;
	/** Custom operation ID (auto-generated if not provided) */
	operationId?: string;
	/** Custom OperationManager instance */
	operationManager?: OperationManager;
	/** Custom TauriProgressBridge instance */
	progressBridge?: TauriProgressBridge;
	/** Custom Tauri API (for testing) */
	tauriAPI?: TauriAPI;
}

/**
 * Result returned by useTauriOperation hook.
 */
export interface UseTauriOperationResult<TArgs, TResult> {
	/** Execute the Tauri command */
	execute: (args: TArgs) => Promise<TResult | undefined>;
	/** Cancel the current operation */
	cancel: () => void;
	/** Retry the last operation */
	retry: () => Promise<TResult | undefined>;
	/** Current operation state */
	state: OperationState | null;
	/** Whether operation is currently loading */
	isLoading: boolean;
	/** Whether operation has failed */
	isError: boolean;
	/** Whether operation was cancelled */
	isCancelled: boolean;
	/** Error if operation failed */
	error: Error | undefined;
	/** Result if operation succeeded */
	result: TResult | undefined;
}

/**
 * Get the Tauri API from the window object.
 */
function getTauriAPI(): TauriAPI | null {
	if (
		typeof window !== 'undefined' &&
		(window as unknown as { __TAURI__?: TauriAPI }).__TAURI__
	) {
		return (window as unknown as { __TAURI__: TauriAPI }).__TAURI__;
	}
	return null;
}

/**
 * Hook for invoking Tauri commands with feedback integration.
 *
 * Provides automatic progress tracking, cancellation support, and
 * integration with the Progressive Feedback System.
 *
 * @example
 * ```tsx
 * const { execute, cancel, isLoading, error, result } = useTauriOperation<
 *   { path: string },
 *   FileContent
 * >({
 *   command: 'read_file',
 *   argsTransformer: (args) => ({ path: args.path }),
 *   onSuccess: (content) => console.log('File loaded:', content),
 *   onError: (err) => console.error('Failed to load file:', err),
 * });
 *
 * // Execute the command
 * await execute({ path: '/path/to/file.txt' });
 *
 * // Cancel if needed
 * cancel();
 * ```
 *
 * @param options - Configuration options
 * @returns Operation control functions and state
 */
export function useTauriOperation<TArgs = void, TResult = unknown>(
	options: UseTauriOperationOptions<TArgs, TResult>
): UseTauriOperationResult<TArgs, TResult> {
	const {
		command,
		argsTransformer,
		config,
		parentId,
		onSuccess,
		onError,
		onCancel,
		operationId: customOperationId,
		operationManager: customOperationManager,
		progressBridge: customProgressBridge,
		tauriAPI: customTauriAPI,
	} = options;

	// Get managers and APIs
	const operationManager = customOperationManager ?? getOperationManager();
	const progressBridge = customProgressBridge ?? getTauriProgressBridge();
	const tauriAPI = customTauriAPI ?? getTauriAPI();

	// State
	const [state, setState] = useState<OperationState | null>(null);
	const [result, setResult] = useState<TResult | undefined>(undefined);
	const [error, setError] = useState<Error | undefined>(undefined);

	// Refs for tracking current operation
	const currentOperationIdRef = useRef<string | null>(null);
	const lastArgsRef = useRef<TArgs | null>(null);
	const cancellationTokenRef = useRef<CancellationToken | null>(null);

	// Subscribe to operation state changes
	useEffect(() => {
		if (!currentOperationIdRef.current) {
			return;
		}

		const unsubscribe = operationManager.subscribe(
			currentOperationIdRef.current,
			(newState) => {
				setState(newState);

				// Update error state
				if (newState.status === 'failed' && newState.error) {
					setError(newState.error);
				}
			}
		);

		return unsubscribe;
	}, [operationManager]);

	/**
	 * Execute the Tauri command.
	 */
	const execute = useCallback(
		async (args: TArgs): Promise<TResult | undefined> => {
			if (!tauriAPI) {
				const err = new Error(
					'Tauri API is not available. This hook requires a Tauri environment.'
				);
				setError(err);
				onError?.(err);
				return undefined;
			}

			// Store args for retry
			lastArgsRef.current = args;

			// Reset state
			setError(undefined);
			setResult(undefined);

			// Start operation
			const handle = operationManager.startOperation({
				id: customOperationId,
				parentId,
				config,
			});

			currentOperationIdRef.current = handle.id;
			cancellationTokenRef.current = handle.cancellationToken;

			// Set up cancellation bridge to Tauri
			const unsubscribeCancel = handle.cancellationToken.onCancel(() => {
				progressBridge.sendCancellation(handle.id).catch((err) => {
					console.error(
						`Failed to send cancellation for ${handle.id}:`,
						err
					);
				});
			});

			try {
				// Transform args if transformer provided
				const tauriArgs = argsTransformer
					? argsTransformer(args)
					: (args as unknown as Record<string, unknown>);

				// Add operation ID to args for backend tracking
				const argsWithOpId = {
					...tauriArgs,
					operationId: handle.id,
				};

				// Invoke Tauri command
				const commandResult = await tauriAPI.invoke<TResult>(
					command,
					argsWithOpId
				);

				// Check if cancelled during execution
				if (handle.cancellationToken.isCancelled) {
					onCancel?.();
					return undefined;
				}

				// Complete operation
				handle.complete(commandResult);
				setResult(commandResult);
				onSuccess?.(commandResult);

				return commandResult;
			} catch (err) {
				// Check if this was a cancellation
				if (handle.cancellationToken.isCancelled) {
					onCancel?.();
					return undefined;
				}

				// Handle error
				const error =
					err instanceof Error ? err : new Error(String(err));
				handle.fail(error);
				setError(error);
				onError?.(error);

				return undefined;
			} finally {
				unsubscribeCancel();
			}
		},
		[
			tauriAPI,
			operationManager,
			progressBridge,
			command,
			argsTransformer,
			customOperationId,
			parentId,
			config,
			onSuccess,
			onError,
			onCancel,
		]
	);

	/**
	 * Cancel the current operation.
	 */
	const cancel = useCallback(() => {
		if (currentOperationIdRef.current) {
			operationManager.cancelOperation(currentOperationIdRef.current);
			onCancel?.();
		}
	}, [operationManager, onCancel]);

	/**
	 * Retry the last operation.
	 */
	const retry = useCallback(async (): Promise<TResult | undefined> => {
		if (lastArgsRef.current !== null) {
			return execute(lastArgsRef.current);
		}
		return undefined;
	}, [execute]);

	// Derived state
	const isLoading = state?.status === 'running';
	const isError = state?.status === 'failed';
	const isCancelled = state?.status === 'cancelled';

	return {
		execute,
		cancel,
		retry,
		state,
		isLoading,
		isError,
		isCancelled,
		error,
		result,
	};
}

/**
 * Create a cancellation-aware wrapper for Tauri commands.
 *
 * This utility creates a function that wraps a Tauri command invocation
 * with cancellation token support. The backend should check the
 * cancellation token periodically and abort gracefully.
 *
 * @param command - Tauri command name
 * @param tauriAPI - Tauri API instance
 * @returns Wrapped function that accepts args and cancellation token
 *
 * @example
 * ```ts
 * const readFile = createCancellableCommand<{ path: string }, string>(
 *   'read_file',
 *   tauriAPI
 * );
 *
 * const token = new CancellationTokenSource();
 * const content = await readFile({ path: '/file.txt' }, token);
 * ```
 */
export function createCancellableCommand<TArgs, TResult>(
	command: string,
	tauriAPI: TauriAPI
): (args: TArgs, token: CancellationToken) => Promise<TResult> {
	return async (args: TArgs, token: CancellationToken): Promise<TResult> => {
		// Check if already cancelled
		if (token.isCancelled) {
			throw new Error('Operation was cancelled before it started');
		}

		// Create a promise that rejects on cancellation
		const cancellationPromise = new Promise<never>((_, reject) => {
			token.onCancel(() => {
				reject(new Error('Operation was cancelled'));
			});
		});

		// Race between command execution and cancellation
		const commandPromise = tauriAPI.invoke<TResult>(
			command,
			args as unknown as Record<string, unknown>
		);

		return Promise.race([commandPromise, cancellationPromise]);
	};
}
