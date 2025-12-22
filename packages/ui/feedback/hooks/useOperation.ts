/**
 * useOperation Hook - React hook for managing async operations with feedback
 *
 * Wraps async operations with OperationManager integration, providing
 * automatic feedback escalation, cancellation support, and retry functionality.
 *
 * @module feedback/hooks/useOperation
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
	OperationState,
	EscalationConfig,
	CancellationToken,
	ProgressState,
} from '../types';
import { getOperationManager } from '../OperationManager';
import { generateOperationId } from '../utils';

/**
 * Options for the useOperation hook.
 */
export interface UseOperationOptions<T> {
	/** The async operation to execute */
	operation: (token: CancellationToken) => Promise<T>;
	/** Custom escalation configuration */
	config?: Partial<EscalationConfig>;
	/** Parent operation ID for hierarchical operations */
	parentId?: string;
	/** Callback when operation succeeds */
	onSuccess?: (result: T) => void;
	/** Callback when operation fails */
	onError?: (error: Error) => void;
	/** Callback when operation is cancelled */
	onCancel?: () => void;
}

/**
 * Result returned by the useOperation hook.
 */
export interface UseOperationResult<T> {
	/** Execute the operation */
	execute: () => Promise<T | undefined>;
	/** Cancel the current operation */
	cancel: () => void;
	/** Retry the last failed operation */
	retry: () => Promise<T | undefined>;
	/** Current operation state */
	state: OperationState | null;
	/** Whether an operation is currently running */
	isLoading: boolean;
	/** Whether the last operation failed */
	isError: boolean;
	/** Whether the last operation was cancelled */
	isCancelled: boolean;
	/** Whether the last operation timed out */
	isTimeout: boolean;
	/** Error from the last failed operation */
	error?: Error;
	/** Result from the last successful operation */
	result?: T;
	/** Update progress for the current operation */
	updateProgress: (progress: Partial<ProgressState>) => void;
}

/**
 * Default operation state for when no operation is active.
 */
const createDefaultState = (): OperationState => ({
	id: '',
	status: 'pending',
	escalationLevel: 'none',
	progress: { type: 'indeterminate' },
	startTime: 0,
	childIds: [],
	config: {
		inlineThreshold: 200,
		overlayThreshold: 500,
		modalThreshold: 2000,
	},
});

/**
 * React hook for managing async operations with progressive feedback.
 *
 * Provides automatic integration with OperationManager for:
 * - Escalation-based feedback (inline → overlay → modal)
 * - Cancellation support with cleanup
 * - Retry functionality for failed operations
 * - Progress tracking
 *
 * @example
 * ```tsx
 * const { execute, cancel, retry, isLoading, error, result } = useOperation({
 *   operation: async (token) => {
 *     const response = await fetch('/api/data');
 *     if (token.isCancelled) throw new Error('Cancelled');
 *     return response.json();
 *   },
 *   onSuccess: (data) => console.log('Success:', data),
 *   onError: (err) => console.error('Error:', err),
 * });
 *
 * // Execute the operation
 * await execute();
 *
 * // Cancel if needed
 * cancel();
 *
 * // Retry after failure
 * await retry();
 * ```
 *
 * @param options - Configuration options for the operation
 * @returns Object with execute, cancel, retry functions and state
 */
export function useOperation<T>(
	options: UseOperationOptions<T>
): UseOperationResult<T> {
	const { operation, config, parentId, onSuccess, onError, onCancel } = options;

	// State for tracking operation
	const [state, setState] = useState<OperationState | null>(null);
	const [result, setResult] = useState<T | undefined>(undefined);
	const [error, setError] = useState<Error | undefined>(undefined);

	// Refs for stable references
	const currentOperationId = useRef<string | null>(null);
	const operationRef = useRef(operation);
	const configRef = useRef(config);
	const parentIdRef = useRef(parentId);
	const onSuccessRef = useRef(onSuccess);
	const onErrorRef = useRef(onError);
	const onCancelRef = useRef(onCancel);

	// Update refs when props change
	useEffect(() => {
		operationRef.current = operation;
		configRef.current = config;
		parentIdRef.current = parentId;
		onSuccessRef.current = onSuccess;
		onErrorRef.current = onError;
		onCancelRef.current = onCancel;
	}, [operation, config, parentId, onSuccess, onError, onCancel]);

	// Ref for update progress function
	const updateProgressRef = useRef<((progress: Partial<ProgressState>) => void) | null>(null);

	/**
	 * Execute the operation.
	 */
	const execute = useCallback(async (): Promise<T | undefined> => {
		const manager = getOperationManager();
		const operationId = generateOperationId();
		currentOperationId.current = operationId;

		// Clear previous state
		setError(undefined);
		setResult(undefined);

		// Start the operation
		const handle = manager.startOperation({
			id: operationId,
			config: configRef.current,
			parentId: parentIdRef.current,
		});

		// Store update progress function
		updateProgressRef.current = handle.updateProgress;

		// Subscribe to state changes
		const unsubscribe = manager.subscribe(operationId, (newState) => {
			setState({ ...newState });
		});

		try {
			// Execute the operation with cancellation token
			const operationResult = await operationRef.current(handle.cancellationToken);

			// Check if this operation is still current
			if (currentOperationId.current !== operationId) {
				return undefined;
			}

			// Check if cancelled during execution
			if (handle.cancellationToken.isCancelled) {
				handle.fail(new Error('Operation cancelled'));
				onCancelRef.current?.();
				return undefined;
			}

			// Complete the operation
			handle.complete(operationResult);
			setResult(operationResult);
			onSuccessRef.current?.(operationResult);

			return operationResult;
		} catch (err) {
			// Check if this operation is still current
			if (currentOperationId.current !== operationId) {
				return undefined;
			}

			const operationError = err instanceof Error ? err : new Error(String(err));

			// Check if this was a cancellation
			if (handle.cancellationToken.isCancelled) {
				handle.fail(new Error('Operation cancelled'));
				onCancelRef.current?.();
				return undefined;
			}

			// Fail the operation
			handle.fail(operationError);
			setError(operationError);
			onErrorRef.current?.(operationError);

			return undefined;
		} finally {
			// Clean up subscription after a delay to allow final state updates
			setTimeout(() => {
				unsubscribe();
			}, 100);
		}
	}, []);

	/**
	 * Cancel the current operation.
	 */
	const cancel = useCallback(() => {
		if (currentOperationId.current) {
			const manager = getOperationManager();
			manager.cancelOperation(currentOperationId.current);
			onCancelRef.current?.();
		}
	}, []);

	/**
	 * Retry the last operation.
	 */
	const retry = useCallback(async (): Promise<T | undefined> => {
		// Clear error state before retry
		setError(undefined);
		return execute();
	}, [execute]);

	/**
	 * Update progress for the current operation.
	 */
	const updateProgress = useCallback((progress: Partial<ProgressState>) => {
		if (updateProgressRef.current) {
			updateProgressRef.current(progress);
		}
	}, []);

	// Derived state
	const isLoading = state?.status === 'running';
	const isError = state?.status === 'failed';
	const isCancelled = state?.status === 'cancelled';
	const isTimeout = Boolean(isError && (error?.message.toLowerCase().includes('timed out') || error?.message.toLowerCase().includes('timeout')));

	return {
		execute,
		cancel,
		retry,
		state,
		isLoading,
		isError,
		isCancelled,
		isTimeout,
		error,
		result,
		updateProgress,
	};
}

export default useOperation;
