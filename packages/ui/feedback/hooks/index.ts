/**
 * Feedback System Hooks
 *
 * React hooks for integrating with the Progressive Feedback System.
 * These hooks provide convenient ways to manage async operations with
 * automatic feedback escalation, cancellation support, and retry functionality.
 *
 * ## Available Hooks
 *
 * ### useOperation
 * General-purpose hook for managing async operations with feedback.
 *
 * ```tsx
 * import { useOperation } from '@symphony/ui/feedback';
 *
 * const { execute, cancel, retry, isLoading, error, result } = useOperation({
 *   operation: async (token) => {
 *     const response = await fetch('/api/data');
 *     if (token.isCancelled) throw new Error('Cancelled');
 *     return response.json();
 *   },
 *   config: { modalThreshold: 5000 }, // Custom thresholds
 *   onSuccess: (data) => console.log('Success:', data),
 *   onError: (err) => console.error('Error:', err),
 * });
 * ```
 *
 * ### useTauriOperation
 * Specialized hook for Tauri backend commands with progress tracking.
 *
 * ```tsx
 * import { useTauriOperation } from '@symphony/ui/feedback';
 *
 * const { execute, cancel, isLoading, result } = useTauriOperation<
 *   { path: string },
 *   FileContent
 * >({
 *   command: 'read_file',
 *   argsTransformer: (args) => ({ path: args.path }),
 *   onSuccess: (content) => setFileContent(content),
 * });
 *
 * // Execute the command
 * await execute({ path: '/path/to/file.txt' });
 * ```
 *
 * ## Features
 *
 * - **Automatic Escalation**: Feedback automatically escalates based on duration
 * - **Cancellation Support**: Operations can be cancelled with cleanup
 * - **Retry Functionality**: Failed operations can be retried
 * - **Progress Tracking**: Support for both indeterminate and determinate progress
 * - **Hierarchical Operations**: Parent-child operation relationships
 *
 * @module feedback/hooks
 */

export * from './useOperation';
export * from './useTauriOperation';
