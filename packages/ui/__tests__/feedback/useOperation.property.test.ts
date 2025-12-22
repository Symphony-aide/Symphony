/**
 * @fileoverview Property-based tests for useOperation hook
 *
 * Tests for operation lifecycle, retry mechanism, cancellation,
 * and state management.
 *
 * @module feedback/tests/useOperation.property
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOperation } from '../../feedback/hooks/useOperation';
import { resetOperationManager } from '../../feedback/OperationManager';
import type { CancellationToken } from '../../feedback/types';

/**
 * Generate valid error messages for testing.
 */
const errorMessageArb = fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0);

/**
 * Generate valid result values for testing.
 */
const resultValueArb = fc.oneof(
	fc.string(),
	fc.integer(),
	fc.boolean(),
	fc.record({ data: fc.string(), count: fc.integer() })
);

describe('Property 11: Retry mechanism availability', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		resetOperationManager();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	/**
	 * **Feature: progressive-feedback-system, Property 11: Retry mechanism availability**
	 *
	 * For any failed operation, a retry mechanism should be available
	 * to re-execute the operation.
	 *
	 * **Validates: Requirements 6.3**
	 */
	it('should provide retry function that re-executes the operation after failure', async () => {
		await fc.assert(
			fc.asyncProperty(
				errorMessageArb,
				resultValueArb,
				async (errorMessage, successResult) => {
					let callCount = 0;

					// Create an operation that fails first, then succeeds
					const operation = vi.fn(async (_token: CancellationToken) => {
						callCount++;
						if (callCount === 1) {
							throw new Error(errorMessage);
						}
						return successResult;
					});

					const { result } = renderHook(() =>
						useOperation({
							operation,
						})
					);

					// Execute the operation (should fail)
					await act(async () => {
						await result.current.execute();
						vi.advanceTimersByTime(100);
					});

					// Verify operation failed
					expect(result.current.isError).toBe(true);
					expect(result.current.error?.message).toBe(errorMessage);

					// Retry should be available
					expect(typeof result.current.retry).toBe('function');

					// Execute retry (should succeed)
					await act(async () => {
						await result.current.retry();
						vi.advanceTimersByTime(100);
					});

					// Verify retry succeeded
					expect(result.current.isError).toBe(false);
					expect(result.current.error).toBeUndefined();
					expect(result.current.result).toEqual(successResult);

					// Operation should have been called twice
					expect(operation).toHaveBeenCalledTimes(2);
				}
			),
			{ numRuns: 50 }
		);
	});

	/**
	 * Retry should clear error state before re-executing.
	 */
	it('should clear error state when retry is called', async () => {
		await fc.assert(
			fc.asyncProperty(errorMessageArb, async (errorMessage) => {
				let callCount = 0;

				const operation = vi.fn(async (_token: CancellationToken) => {
					callCount++;
					if (callCount === 1) {
						throw new Error(errorMessage);
					}
					// Second call takes some time
					return new Promise((resolve) => {
						setTimeout(() => resolve('success'), 50);
					});
				});

				const { result } = renderHook(() =>
					useOperation({
						operation,
					})
				);

				// Execute and fail
				await act(async () => {
					await result.current.execute();
					vi.advanceTimersByTime(100);
				});

				expect(result.current.isError).toBe(true);
				expect(result.current.error?.message).toBe(errorMessage);

				// Start retry
				let retryPromise: Promise<unknown>;
				act(() => {
					retryPromise = result.current.retry();
				});

				// Error should be cleared immediately when retry starts
				expect(result.current.error).toBeUndefined();

				// Complete the retry
				await act(async () => {
					vi.advanceTimersByTime(100);
					await retryPromise;
				});

				expect(result.current.isError).toBe(false);
			}),
			{ numRuns: 50 }
		);
	});

	/**
	 * Retry should work multiple times for repeated failures.
	 */
	it('should allow multiple retries for repeated failures', async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.integer({ min: 2, max: 5 }),
				async (failureCount) => {
					let callCount = 0;

					const operation = vi.fn(async (_token: CancellationToken) => {
						callCount++;
						if (callCount <= failureCount) {
							throw new Error(`Failure ${callCount}`);
						}
						return 'success';
					});

					const { result } = renderHook(() =>
						useOperation({
							operation,
						})
					);

					// Execute and fail initially
					await act(async () => {
						await result.current.execute();
						vi.advanceTimersByTime(100);
					});

					expect(result.current.isError).toBe(true);

					// Retry until success
					for (let i = 1; i < failureCount; i++) {
						await act(async () => {
							await result.current.retry();
							vi.advanceTimersByTime(100);
						});
						expect(result.current.isError).toBe(true);
					}

					// Final retry should succeed
					await act(async () => {
						await result.current.retry();
						vi.advanceTimersByTime(100);
					});

					expect(result.current.isError).toBe(false);
					expect(result.current.result).toBe('success');
					expect(operation).toHaveBeenCalledTimes(failureCount + 1);
				}
			),
			{ numRuns: 20 }
		);
	});

	/**
	 * Retry should call onSuccess callback when successful.
	 */
	it('should call onSuccess callback when retry succeeds', async () => {
		await fc.assert(
			fc.asyncProperty(resultValueArb, async (successResult) => {
				let callCount = 0;
				const onSuccess = vi.fn();

				const operation = vi.fn(async (_token: CancellationToken) => {
					callCount++;
					if (callCount === 1) {
						throw new Error('First failure');
					}
					return successResult;
				});

				const { result } = renderHook(() =>
					useOperation({
						operation,
						onSuccess,
					})
				);

				// Execute and fail
				await act(async () => {
					await result.current.execute();
					vi.advanceTimersByTime(100);
				});

				expect(onSuccess).not.toHaveBeenCalled();

				// Retry and succeed
				await act(async () => {
					await result.current.retry();
					vi.advanceTimersByTime(100);
				});

				expect(onSuccess).toHaveBeenCalledTimes(1);
				expect(onSuccess).toHaveBeenCalledWith(successResult);
			}),
			{ numRuns: 50 }
		);
	});

	/**
	 * Retry should call onError callback when it fails again.
	 */
	it('should call onError callback when retry fails', async () => {
		await fc.assert(
			fc.asyncProperty(
				errorMessageArb,
				errorMessageArb,
				async (firstError, secondError) => {
					let callCount = 0;
					const onError = vi.fn();

					const operation = vi.fn(async (_token: CancellationToken) => {
						callCount++;
						if (callCount === 1) {
							throw new Error(firstError);
						}
						throw new Error(secondError);
					});

					const { result } = renderHook(() =>
						useOperation({
							operation,
							onError,
						})
					);

					// Execute and fail
					await act(async () => {
						await result.current.execute();
						vi.advanceTimersByTime(100);
					});

					expect(onError).toHaveBeenCalledTimes(1);
					expect(onError).toHaveBeenCalledWith(expect.objectContaining({
						message: firstError,
					}));

					// Retry and fail again
					await act(async () => {
						await result.current.retry();
						vi.advanceTimersByTime(100);
					});

					expect(onError).toHaveBeenCalledTimes(2);
					expect(onError).toHaveBeenLastCalledWith(expect.objectContaining({
						message: secondError,
					}));
				}
			),
			{ numRuns: 50 }
		);
	});
});

describe('useOperation hook - additional properties', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		resetOperationManager();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	/**
	 * Execute should return the result on success.
	 */
	it('should return result from execute on success', async () => {
		await fc.assert(
			fc.asyncProperty(resultValueArb, async (expectedResult) => {
				const operation = vi.fn(async (_token: CancellationToken) => {
					return expectedResult;
				});

				const { result } = renderHook(() =>
					useOperation({
						operation,
					})
				);

				let executeResult: unknown;
				await act(async () => {
					executeResult = await result.current.execute();
					vi.advanceTimersByTime(100);
				});

				expect(executeResult).toEqual(expectedResult);
				expect(result.current.result).toEqual(expectedResult);
			}),
			{ numRuns: 50 }
		);
	});

	/**
	 * Cancel should stop the operation and set isCancelled.
	 */
	it('should set isCancelled when operation is cancelled', async () => {
		const operation = vi.fn(async (token: CancellationToken) => {
			// Simulate a long-running operation
			return new Promise((resolve, reject) => {
				const checkCancellation = setInterval(() => {
					if (token.isCancelled) {
						clearInterval(checkCancellation);
						reject(new Error('Cancelled'));
					}
				}, 10);

				setTimeout(() => {
					clearInterval(checkCancellation);
					resolve('completed');
				}, 1000);
			});
		});

		const onCancel = vi.fn();

		const { result } = renderHook(() =>
			useOperation({
				operation,
				onCancel,
			})
		);

		// Start the operation
		act(() => {
			result.current.execute();
		});

		// Advance time a bit
		await act(async () => {
			vi.advanceTimersByTime(50);
		});

		// Cancel the operation
		act(() => {
			result.current.cancel();
		});

		// Advance time to let cancellation propagate
		await act(async () => {
			vi.advanceTimersByTime(100);
		});

		expect(result.current.isCancelled).toBe(true);
		expect(onCancel).toHaveBeenCalled();
	});

	/**
	 * isLoading should be true while operation is running.
	 */
	it('should set isLoading while operation is running', async () => {
		const operation = vi.fn(async (_token: CancellationToken) => {
			return new Promise((resolve) => {
				setTimeout(() => resolve('done'), 100);
			});
		});

		const { result } = renderHook(() =>
			useOperation({
				operation,
			})
		);

		expect(result.current.isLoading).toBe(false);

		// Start the operation
		let executePromise: Promise<unknown>;
		act(() => {
			executePromise = result.current.execute();
		});

		// Should be loading now
		expect(result.current.isLoading).toBe(true);

		// Complete the operation
		await act(async () => {
			vi.advanceTimersByTime(150);
			await executePromise;
		});

		expect(result.current.isLoading).toBe(false);
	});

	/**
	 * updateProgress should update the operation's progress state.
	 */
	it('should allow updating progress during operation', async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.integer({ min: 0, max: 100 }),
				fc.string({ minLength: 1, maxLength: 50 }),
				async (progressValue, progressMessage) => {
					let resolveOperation: (value: string) => void;

					const operation = vi.fn(async (_token: CancellationToken) => {
						return new Promise<string>((resolve) => {
							resolveOperation = resolve;
						});
					});

					const { result } = renderHook(() =>
						useOperation({
							operation,
						})
					);

					// Start the operation
					act(() => {
						result.current.execute();
					});

					// Update progress
					act(() => {
						result.current.updateProgress({
							type: 'determinate',
							value: progressValue,
							message: progressMessage,
						});
					});

					// Flush throttled updates
					await act(async () => {
						vi.advanceTimersByTime(50);
					});

					// Verify progress was updated
					expect(result.current.state?.progress.type).toBe('determinate');
					expect(result.current.state?.progress.value).toBe(progressValue);
					expect(result.current.state?.progress.message).toBe(progressMessage);

					// Complete the operation
					await act(async () => {
						resolveOperation!('done');
						vi.advanceTimersByTime(100);
					});
				}
			),
			{ numRuns: 30 }
		);
	});
});
