/**
 * @fileoverview Property-based tests for TauriProgressBridge
 *
 * Tests for Tauri progress event handling and mapping to OperationManager.
 *
 * **Feature: progressive-feedback-system, Property 16: Tauri progress event handling**
 * **Validates: Requirements 8.1**
 *
 * @module feedback/tests/tauriProgressBridge.property
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import {
	TauriProgressBridge,
	resetTauriProgressBridge,
	processTauriProgressEvent,
	type TauriEventAPI,
	type TauriEventCallback,
} from '../../feedback/TauriProgressBridge';
import {
	OperationManager,
	resetOperationManager,
} from '../../feedback/OperationManager';
import type { TauriProgressEvent } from '../../feedback/types';

/**
 * Create a mock Tauri event API for testing.
 */
function createMockTauriEventAPI(): {
	api: TauriEventAPI;
	triggerEvent: (event: TauriProgressEvent) => void;
	emittedEvents: Array<{ event: string; payload: unknown }>;
} {
	let eventHandler: TauriEventCallback<TauriProgressEvent> | null = null;
	const emittedEvents: Array<{ event: string; payload: unknown }> = [];

	const api: TauriEventAPI = {
		listen: async <T>(
			event: string,
			handler: TauriEventCallback<T>
		): Promise<() => void> => {
			eventHandler = handler as TauriEventCallback<TauriProgressEvent>;
			return () => {
				eventHandler = null;
			};
		},
		emit: async (event: string, payload?: unknown): Promise<void> => {
			emittedEvents.push({ event, payload });
		},
	};

	const triggerEvent = (event: TauriProgressEvent) => {
		if (eventHandler) {
			eventHandler({ payload: event });
		}
	};

	return { api, triggerEvent, emittedEvents };
}

/**
 * Generate valid operation IDs.
 */
const operationIdArb = fc
	.tuple(fc.string({ minLength: 1, maxLength: 10, unit: 'grapheme' }), fc.nat())
	.map(([prefix, num]) => `tauri_op_${prefix.replace(/[^a-zA-Z0-9]/g, '')}_${num}`);

/**
 * Generate valid progress values (current and total).
 */
const progressValuesArb = fc.record({
	current: fc.integer({ min: 0, max: 1000 }),
	total: fc.integer({ min: 1, max: 1000 }),
	message: fc.option(fc.string({ minLength: 0, maxLength: 50 }), { nil: undefined }),
});

/**
 * Generate valid Tauri progress events.
 */
const tauriProgressEventArb = fc.oneof(
	// Progress event
	fc.record({
		operationId: operationIdArb,
		type: fc.constant('progress' as const),
		progress: progressValuesArb,
	}),
	// Complete event
	fc.record({
		operationId: operationIdArb,
		type: fc.constant('complete' as const),
		result: fc.option(fc.jsonValue(), { nil: undefined }),
	}),
	// Error event
	fc.record({
		operationId: operationIdArb,
		type: fc.constant('error' as const),
		error: fc.string({ minLength: 1, maxLength: 100 }),
	}),
	// Cancelled event
	fc.record({
		operationId: operationIdArb,
		type: fc.constant('cancelled' as const),
	})
);

describe('Property 16: Tauri progress event handling', () => {
	let manager: OperationManager;
	let mockTauri: ReturnType<typeof createMockTauriEventAPI>;
	let bridge: TauriProgressBridge;

	beforeEach(() => {
		vi.useFakeTimers();
		resetOperationManager();
		resetTauriProgressBridge();
		manager = new OperationManager();
		mockTauri = createMockTauriEventAPI();
	});

	afterEach(() => {
		if (bridge) {
			bridge.dispose();
		}
		vi.useRealTimers();
	});

	/**
	 * **Feature: progressive-feedback-system, Property 16: Tauri progress event handling**
	 *
	 * For any Tauri command that emits progress events, the frontend should
	 * receive and process those events correctly.
	 *
	 * **Validates: Requirements 8.1**
	 */
	it('should correctly process progress events from Tauri backend', async () => {
		await fc.assert(
			fc.asyncProperty(
				operationIdArb,
				progressValuesArb,
				async (opId, progress) => {
					// Reset for each iteration
					resetOperationManager();
					const localManager = new OperationManager();
					const localMockTauri = createMockTauriEventAPI();

					const localBridge = new TauriProgressBridge({
						operationManager: localManager,
						tauriEventAPI: localMockTauri.api,
						autoStart: false,
					});

					await localBridge.start();

					// Trigger a progress event
					const event: TauriProgressEvent = {
						operationId: opId,
						type: 'progress',
						progress: {
							current: progress.current,
							total: progress.total,
							message: progress.message,
						},
					};

					localMockTauri.triggerEvent(event);

					// Flush any throttled updates
					vi.advanceTimersByTime(20);

					// Verify operation was created and progress was set
					const operation = localManager.getOperation(opId);
					expect(operation).toBeDefined();
					expect(operation?.status).toBe('running');

					// Verify progress calculation
					if (progress.total > 0) {
						expect(operation?.progress.type).toBe('determinate');
						const expectedValue = Math.round(
							(progress.current / progress.total) * 100
						);
						expect(operation?.progress.value).toBe(expectedValue);
					}

					if (progress.message) {
						expect(operation?.progress.message).toBe(progress.message);
					}

					localBridge.dispose();
				}
			),
			{ numRuns: 50 }
		);
	});

	/**
	 * Complete events should mark operations as completed with result.
	 */
	it('should correctly process complete events from Tauri backend', async () => {
		await fc.assert(
			fc.asyncProperty(
				operationIdArb,
				fc.option(
					fc.oneof(
						fc.string(),
						fc.integer(),
						fc.boolean(),
						fc.constant(null)
					),
					{ nil: undefined }
				),
				async (opId, result) => {
					// Reset for each iteration
					resetOperationManager();
					const localManager = new OperationManager();
					const localMockTauri = createMockTauriEventAPI();

					const localBridge = new TauriProgressBridge({
						operationManager: localManager,
						tauriEventAPI: localMockTauri.api,
						autoStart: false,
					});

					await localBridge.start();

					// First create the operation via a progress event
					localMockTauri.triggerEvent({
						operationId: opId,
						type: 'progress',
						progress: { current: 50, total: 100 },
					});

					vi.advanceTimersByTime(20);

					// Now send complete event
					localMockTauri.triggerEvent({
						operationId: opId,
						type: 'complete',
						result,
					});

					// Verify operation is completed
					const operation = localManager.getOperation(opId);
					expect(operation).toBeDefined();
					expect(operation?.status).toBe('completed');

					// For operations without children, result is returned directly
					// (not wrapped) by OperationManager._aggregateChildResults
					expect(operation?.result).toEqual(result);

					localBridge.dispose();
				}
			),
			{ numRuns: 50 }
		);
	});

	/**
	 * Error events should mark operations as failed with error message.
	 */
	it('should correctly process error events from Tauri backend', async () => {
		await fc.assert(
			fc.asyncProperty(
				operationIdArb,
				fc.string({ minLength: 1, maxLength: 100 }),
				async (opId, errorMessage) => {
					// Reset for each iteration
					resetOperationManager();
					const localManager = new OperationManager();
					const localMockTauri = createMockTauriEventAPI();

					const localBridge = new TauriProgressBridge({
						operationManager: localManager,
						tauriEventAPI: localMockTauri.api,
						autoStart: false,
					});

					await localBridge.start();

					// First create the operation via a progress event
					localMockTauri.triggerEvent({
						operationId: opId,
						type: 'progress',
						progress: { current: 25, total: 100 },
					});

					vi.advanceTimersByTime(20);

					// Now send error event
					localMockTauri.triggerEvent({
						operationId: opId,
						type: 'error',
						error: errorMessage,
					});

					// Verify operation is failed
					const operation = localManager.getOperation(opId);
					expect(operation).toBeDefined();
					expect(operation?.status).toBe('failed');
					expect(operation?.error).toBeDefined();
					expect(operation?.error?.message).toBe(errorMessage);

					localBridge.dispose();
				}
			),
			{ numRuns: 50 }
		);
	});

	/**
	 * Cancelled events should mark operations as cancelled.
	 */
	it('should correctly process cancelled events from Tauri backend', async () => {
		await fc.assert(
			fc.asyncProperty(operationIdArb, async (opId) => {
				// Reset for each iteration
				resetOperationManager();
				const localManager = new OperationManager();
				const localMockTauri = createMockTauriEventAPI();

				const localBridge = new TauriProgressBridge({
					operationManager: localManager,
					tauriEventAPI: localMockTauri.api,
					autoStart: false,
				});

				await localBridge.start();

				// First create the operation via a progress event
				localMockTauri.triggerEvent({
					operationId: opId,
					type: 'progress',
					progress: { current: 10, total: 100 },
				});

				vi.advanceTimersByTime(20);

				// Now send cancelled event
				localMockTauri.triggerEvent({
					operationId: opId,
					type: 'cancelled',
				});

				// Verify operation is cancelled
				const operation = localManager.getOperation(opId);
				expect(operation).toBeDefined();
				expect(operation?.status).toBe('cancelled');

				localBridge.dispose();
			}),
			{ numRuns: 50 }
		);
	});

	/**
	 * Progress events should create operations if they don't exist.
	 */
	it('should create operations automatically for new progress events', async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.array(operationIdArb, { minLength: 1, maxLength: 5 }),
				async (opIds) => {
					// Ensure unique IDs
					const uniqueIds = [...new Set(opIds)];

					// Reset for each iteration
					resetOperationManager();
					const localManager = new OperationManager();
					const localMockTauri = createMockTauriEventAPI();

					const localBridge = new TauriProgressBridge({
						operationManager: localManager,
						tauriEventAPI: localMockTauri.api,
						autoStart: false,
					});

					await localBridge.start();

					// Send progress events for each operation
					for (const opId of uniqueIds) {
						localMockTauri.triggerEvent({
							operationId: opId,
							type: 'progress',
							progress: { current: 0, total: 100 },
						});
					}

					vi.advanceTimersByTime(20);

					// Verify all operations were created
					for (const opId of uniqueIds) {
						const operation = localManager.getOperation(opId);
						expect(operation).toBeDefined();
						expect(operation?.id).toBe(opId);
						expect(operation?.status).toBe('running');
					}

					localBridge.dispose();
				}
			),
			{ numRuns: 50 }
		);
	});

	/**
	 * Multiple progress updates should be processed correctly.
	 */
	it('should handle multiple sequential progress updates', async () => {
		await fc.assert(
			fc.asyncProperty(
				operationIdArb,
				fc.array(fc.integer({ min: 0, max: 100 }), {
					minLength: 2,
					maxLength: 10,
				}),
				async (opId, progressValues) => {
					// Reset for each iteration
					resetOperationManager();
					const localManager = new OperationManager();
					const localMockTauri = createMockTauriEventAPI();

					const localBridge = new TauriProgressBridge({
						operationManager: localManager,
						tauriEventAPI: localMockTauri.api,
						autoStart: false,
					});

					await localBridge.start();

					// Send multiple progress updates
					for (const value of progressValues) {
						localMockTauri.triggerEvent({
							operationId: opId,
							type: 'progress',
							progress: { current: value, total: 100 },
						});
						vi.advanceTimersByTime(20); // Allow throttled updates
					}

					// Verify final progress value
					const operation = localManager.getOperation(opId);
					expect(operation).toBeDefined();

					const lastValue = progressValues[progressValues.length - 1];
					expect(operation?.progress.value).toBe(lastValue);

					localBridge.dispose();
				}
			),
			{ numRuns: 50 }
		);
	});

	/**
	 * Indeterminate progress should be set when total is 0.
	 */
	it('should set indeterminate progress when total is 0', async () => {
		await fc.assert(
			fc.asyncProperty(
				operationIdArb,
				fc.integer({ min: 0, max: 100 }),
				async (opId, current) => {
					// Reset for each iteration
					resetOperationManager();
					const localManager = new OperationManager();
					const localMockTauri = createMockTauriEventAPI();

					const localBridge = new TauriProgressBridge({
						operationManager: localManager,
						tauriEventAPI: localMockTauri.api,
						autoStart: false,
					});

					await localBridge.start();

					// Send progress event with total = 0 (indeterminate)
					localMockTauri.triggerEvent({
						operationId: opId,
						type: 'progress',
						progress: { current, total: 0 },
					});

					vi.advanceTimersByTime(20);

					// Verify indeterminate progress
					const operation = localManager.getOperation(opId);
					expect(operation).toBeDefined();
					expect(operation?.progress.type).toBe('indeterminate');

					localBridge.dispose();
				}
			),
			{ numRuns: 50 }
		);
	});
});

describe('TauriProgressBridge utility functions', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		resetOperationManager();
		resetTauriProgressBridge();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	/**
	 * processTauriProgressEvent should work without a bridge instance.
	 */
	it('should process events via utility function', () => {
		fc.assert(
			fc.property(operationIdArb, progressValuesArb, (opId, progress) => {
				resetOperationManager();
				const localManager = new OperationManager();

				// Use utility function to process event
				processTauriProgressEvent(
					{
						operationId: opId,
						type: 'progress',
						progress: {
							current: progress.current,
							total: progress.total,
							message: progress.message,
						},
					},
					localManager
				);

				vi.advanceTimersByTime(20);

				// Verify operation was created
				const operation = localManager.getOperation(opId);
				expect(operation).toBeDefined();
				expect(operation?.status).toBe('running');
			}),
			{ numRuns: 50 }
		);
	});
});
