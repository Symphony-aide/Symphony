/**
 * @fileoverview Property-based tests for OperationManager
 *
 * Tests for operation lifecycle, escalation, progress throttling,
 * concurrent operations, and hierarchical operations.
 *
 * @module feedback/tests/operationManager.property
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import {
	OperationManager,
	resetOperationManager,
} from '../../feedback/OperationManager';
import type { EscalationConfig, ProgressState } from '../../feedback/types';

/**
 * Generate valid escalation configurations where thresholds are in correct order.
 * Ensures: inlineThreshold < overlayThreshold < modalThreshold
 */
const validEscalationConfigArb = fc
	.tuple(
		fc.integer({ min: 50, max: 500 }), // inlineThreshold
		fc.integer({ min: 50, max: 1000 }), // overlay delta
		fc.integer({ min: 100, max: 5000 }) // modal delta
	)
	.map(([inline, overlayDelta, modalDelta]) => ({
		inlineThreshold: inline,
		overlayThreshold: inline + overlayDelta,
		modalThreshold: inline + overlayDelta + modalDelta,
	}));

/**
 * Generate unique operation IDs
 */
const operationIdArb = fc
	.tuple(fc.string({ minLength: 1, maxLength: 10, unit: 'grapheme' }), fc.nat())
	.map(([prefix, num]) => `op_${prefix.replace(/[^a-zA-Z0-9]/g, '')}_${num}`);

describe('Property 1: Silent completion for fast operations', () => {
	let manager: OperationManager;

	beforeEach(() => {
		vi.useFakeTimers();
		resetOperationManager();
		manager = new OperationManager();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	/**
	 * **Feature: progressive-feedback-system, Property 1: Silent completion for fast operations**
	 *
	 * For any operation that completes in less than the inline threshold (default 200ms),
	 * the system should not display any feedback UI (escalation level remains 'none').
	 *
	 * **Validates: Requirements 1.2**
	 */
	it('should keep escalation level at "none" for operations completing before inline threshold', () => {
		fc.assert(
			fc.property(
				validEscalationConfigArb,
				operationIdArb,
				(config, opId) => {
					// Start operation with custom config
					const handle = manager.startOperation({
						id: opId,
						config,
					});

					// Get initial state - should be 'none'
					const initialState = manager.getOperation(opId);
					expect(initialState?.escalationLevel).toBe('none');

					// Complete operation before inline threshold
					const completionTime = Math.floor(config.inlineThreshold * 0.9);
					vi.advanceTimersByTime(completionTime);

					// Complete the operation
					handle.complete({ result: 'success' });

					// Verify escalation level never changed from 'none'
					const finalState = manager.getOperation(opId);
					expect(finalState?.escalationLevel).toBe('none');
					expect(finalState?.status).toBe('completed');
				}
			),
			{ numRuns: 100 }
		);
	});

	/**
	 * Operations completing at exactly 0ms should have 'none' escalation.
	 */
	it('should have "none" escalation for immediate completion', () => {
		fc.assert(
			fc.property(operationIdArb, (opId) => {
				const handle = manager.startOperation({ id: opId });

				// Complete immediately
				handle.complete();

				const state = manager.getOperation(opId);
				expect(state?.escalationLevel).toBe('none');
				expect(state?.status).toBe('completed');
			}),
			{ numRuns: 100 }
		);
	});

	/**
	 * Operations completing just before inline threshold should remain at 'none'.
	 */
	it('should remain at "none" when completing 1ms before inline threshold', () => {
		fc.assert(
			fc.property(
				validEscalationConfigArb,
				operationIdArb,
				(config, opId) => {
					const handle = manager.startOperation({
						id: opId,
						config,
					});

					// Advance to 1ms before inline threshold
					vi.advanceTimersByTime(config.inlineThreshold - 1);

					// Complete the operation
					handle.complete();

					const state = manager.getOperation(opId);
					expect(state?.escalationLevel).toBe('none');
				}
			),
			{ numRuns: 100 }
		);
	});
});


describe('Property 6: Progress throttling', () => {
	let manager: OperationManager;

	beforeEach(() => {
		vi.useFakeTimers();
		resetOperationManager();
		manager = new OperationManager();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	/**
	 * **Feature: progressive-feedback-system, Property 6: Progress throttling**
	 *
	 * For any sequence of progress events, the UI should update at most 60 times
	 * per second regardless of event frequency.
	 *
	 * **Validates: Requirements 3.4**
	 */
	it('should throttle progress updates to maximum 60fps', () => {
		fc.assert(
			fc.property(
				operationIdArb,
				fc.integer({ min: 10, max: 100 }), // number of rapid updates
				(opId, updateCount) => {
					const handle = manager.startOperation({ id: opId });

					// Track how many times subscribers are notified
					let notificationCount = 0;
					manager.subscribe(opId, () => {
						notificationCount++;
					});

					// Reset count after initial subscription notification
					notificationCount = 0;

					// Send many rapid progress updates (faster than 60fps)
					for (let i = 0; i < updateCount; i++) {
						handle.updateProgress({
							type: 'determinate',
							value: (i / updateCount) * 100,
						});
						// Advance by 1ms (much faster than 16.67ms throttle)
						vi.advanceTimersByTime(1);
					}

					// Flush any pending throttled updates
					vi.advanceTimersByTime(20);

					// The number of notifications should be much less than updateCount
					// due to throttling (approximately updateCount * 1ms / 16.67ms)
					const expectedMaxUpdates = Math.ceil(
						(updateCount + 20) / (1000 / 60)
					);

					expect(notificationCount).toBeLessThanOrEqual(
						expectedMaxUpdates + 1
					);
				}
			),
			{ numRuns: 50 }
		);
	});

	/**
	 * Progress updates spaced at 60fps or slower should all be applied.
	 */
	it('should apply all updates when spaced at 60fps or slower', () => {
		fc.assert(
			fc.property(
				operationIdArb,
				fc.integer({ min: 5, max: 20 }), // number of updates
				(opId, updateCount) => {
					const handle = manager.startOperation({ id: opId });

					const progressValues: number[] = [];
					manager.subscribe(opId, (state) => {
						if (state.progress.value !== undefined) {
							progressValues.push(state.progress.value);
						}
					});

					// Send updates at exactly 60fps interval (16.67ms)
					const interval = Math.ceil(1000 / 60);
					for (let i = 1; i <= updateCount; i++) {
						handle.updateProgress({
							type: 'determinate',
							value: i * 10,
						});
						vi.advanceTimersByTime(interval);
					}

					// All updates should have been applied
					expect(progressValues.length).toBeGreaterThanOrEqual(updateCount);
				}
			),
			{ numRuns: 50 }
		);
	});

	/**
	 * The last progress value should always be applied eventually.
	 */
	it('should eventually apply the last progress value', () => {
		fc.assert(
			fc.property(
				operationIdArb,
				fc.integer({ min: 0, max: 100 }), // final progress value
				(opId, finalValue) => {
					const handle = manager.startOperation({ id: opId });

					// Send many rapid updates ending with finalValue
					for (let i = 0; i < 10; i++) {
						handle.updateProgress({
							type: 'determinate',
							value: i * 10,
						});
					}
					handle.updateProgress({
						type: 'determinate',
						value: finalValue,
					});

					// Flush all pending updates
					vi.advanceTimersByTime(50);

					const state = manager.getOperation(opId);
					expect(state?.progress.value).toBe(finalValue);
				}
			),
			{ numRuns: 100 }
		);
	});
});


describe('Property 3: Independent concurrent operation tracking', () => {
	let manager: OperationManager;

	beforeEach(() => {
		vi.useFakeTimers();
		resetOperationManager();
		manager = new OperationManager();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	/**
	 * **Feature: progressive-feedback-system, Property 3: Independent concurrent operation tracking**
	 *
	 * For any set of concurrent operations, each operation should have independent
	 * state tracking and feedback display.
	 *
	 * **Validates: Requirements 2.4**
	 */
	it('should track multiple concurrent operations independently', () => {
		fc.assert(
			fc.property(
				fc.array(operationIdArb, { minLength: 2, maxLength: 10 }),
				(opIds) => {
					// Ensure unique IDs
					const uniqueIds = [...new Set(opIds)];
					if (uniqueIds.length < 2) return true;

					// Start all operations
					const handles = uniqueIds.map((id) =>
						manager.startOperation({ id })
					);

					// Verify all operations are tracked independently
					for (const id of uniqueIds) {
						const state = manager.getOperation(id);
						expect(state).toBeDefined();
						expect(state?.id).toBe(id);
						expect(state?.status).toBe('running');
					}

					// Complete first operation
					handles[0].complete({ result: 'first' });

					// Verify first is completed, others still running
					expect(manager.getOperation(uniqueIds[0])?.status).toBe(
						'completed'
					);
					for (let i = 1; i < uniqueIds.length; i++) {
						expect(manager.getOperation(uniqueIds[i])?.status).toBe(
							'running'
						);
					}

					// Fail second operation
					handles[1].fail(new Error('test error'));

					// Verify second is failed, others unchanged
					expect(manager.getOperation(uniqueIds[1])?.status).toBe('failed');
					for (let i = 2; i < uniqueIds.length; i++) {
						expect(manager.getOperation(uniqueIds[i])?.status).toBe(
							'running'
						);
					}
				}
			),
			{ numRuns: 50 }
		);
	});

	/**
	 * Each concurrent operation should have independent progress tracking.
	 */
	it('should track progress independently for concurrent operations', () => {
		fc.assert(
			fc.property(
				fc.array(
					fc.tuple(operationIdArb, fc.integer({ min: 0, max: 100 })),
					{ minLength: 2, maxLength: 5 }
				),
				(opData) => {
					// Ensure unique IDs
					const uniqueData = opData.filter(
						(item, index, self) =>
							self.findIndex((t) => t[0] === item[0]) === index
					);
					if (uniqueData.length < 2) return true;

					// Start operations and set different progress values
					const handles = uniqueData.map(([id]) =>
						manager.startOperation({ id })
					);

					// Update each operation with its own progress value
					uniqueData.forEach(([id, progressValue], index) => {
						handles[index].updateProgress({
							type: 'determinate',
							value: progressValue,
						});
					});

					// Flush throttled updates
					vi.advanceTimersByTime(20);

					// Verify each operation has its own progress value
					uniqueData.forEach(([id, progressValue]) => {
						const state = manager.getOperation(id);
						expect(state?.progress.value).toBe(progressValue);
					});
				}
			),
			{ numRuns: 50 }
		);
	});

	/**
	 * Cancelling one operation should not affect other concurrent operations.
	 */
	it('should not affect other operations when one is cancelled', () => {
		fc.assert(
			fc.property(
				fc.array(operationIdArb, { minLength: 3, maxLength: 5 }),
				(opIds) => {
					// Ensure unique IDs
					const uniqueIds = [...new Set(opIds)];
					if (uniqueIds.length < 3) return true;

					// Start all operations
					uniqueIds.forEach((id) => manager.startOperation({ id }));

					// Cancel the first operation
					manager.cancelOperation(uniqueIds[0]);

					// Verify first is cancelled
					expect(manager.getOperation(uniqueIds[0])?.status).toBe(
						'cancelled'
					);

					// Verify others are still running
					for (let i = 1; i < uniqueIds.length; i++) {
						expect(manager.getOperation(uniqueIds[i])?.status).toBe(
							'running'
						);
					}
				}
			),
			{ numRuns: 50 }
		);
	});

	/**
	 * Each concurrent operation should have independent escalation.
	 */
	it('should escalate operations independently based on their own duration', () => {
		fc.assert(
			fc.property(
				fc.tuple(operationIdArb, operationIdArb),
				([id1, id2]) => {
					if (id1 === id2) return true;

					// Reset manager and timers for each iteration
					vi.clearAllTimers();
					resetOperationManager();
					const localManager = new OperationManager();

					// Start both operations with same config
					const config: Partial<EscalationConfig> = {
						inlineThreshold: 100,
						overlayThreshold: 200,
						modalThreshold: 300,
					};

					localManager.startOperation({ id: id1, config });

					// Advance time past inline threshold for first operation
					vi.advanceTimersByTime(150);

					// Start second operation (it starts fresh)
					localManager.startOperation({ id: id2, config });

					// First should be at inline, second at none
					expect(localManager.getOperation(id1)?.escalationLevel).toBe(
						'inline'
					);
					expect(localManager.getOperation(id2)?.escalationLevel).toBe(
						'none'
					);

					// Advance more time
					vi.advanceTimersByTime(100);

					// First should be at overlay, second at inline
					expect(localManager.getOperation(id1)?.escalationLevel).toBe(
						'overlay'
					);
					expect(localManager.getOperation(id2)?.escalationLevel).toBe(
						'inline'
					);
				}
			),
			{ numRuns: 50 }
		);
	});
});


describe('Property 17: Hierarchical progress independence', () => {
	let manager: OperationManager;

	beforeEach(() => {
		vi.useFakeTimers();
		resetOperationManager();
		manager = new OperationManager();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	/**
	 * **Feature: progressive-feedback-system, Property 17: Hierarchical progress independence**
	 *
	 * For any hierarchical operation structure, each operation should maintain
	 * its own progress state independently.
	 *
	 * **Validates: Requirements 9.3**
	 */
	it('should maintain independent progress for parent and child operations', () => {
		fc.assert(
			fc.property(
				operationIdArb,
				fc.array(operationIdArb, { minLength: 1, maxLength: 5 }),
				fc.integer({ min: 0, max: 100 }),
				fc.array(fc.integer({ min: 0, max: 100 }), {
					minLength: 1,
					maxLength: 5,
				}),
				(parentId, childIds, parentProgress, childProgresses) => {
					// Ensure unique IDs
					const uniqueChildIds = [...new Set(childIds)].filter(
						(id) => id !== parentId
					);
					if (uniqueChildIds.length === 0) return true;

					// Start parent operation
					const parentHandle = manager.startOperation({ id: parentId });

					// Start child operations
					const childHandles = uniqueChildIds.map((childId) =>
						manager.startOperation({ id: childId, parentId })
					);

					// Update parent progress
					parentHandle.updateProgress({
						type: 'determinate',
						value: parentProgress,
					});

					// Update each child with different progress
					childHandles.forEach((handle, index) => {
						const progress =
							childProgresses[index % childProgresses.length];
						handle.updateProgress({
							type: 'determinate',
							value: progress,
						});
					});

					// Flush throttled updates
					vi.advanceTimersByTime(20);

					// Verify parent has its own progress
					const parentState = manager.getOperation(parentId);
					expect(parentState?.progress.value).toBe(parentProgress);

					// Verify each child has its own progress
					uniqueChildIds.forEach((childId, index) => {
						const childState = manager.getOperation(childId);
						const expectedProgress =
							childProgresses[index % childProgresses.length];
						expect(childState?.progress.value).toBe(expectedProgress);
					});
				}
			),
			{ numRuns: 50 }
		);
	});

	/**
	 * Child progress updates should not affect parent progress.
	 */
	it('should not affect parent progress when child progress is updated', () => {
		fc.assert(
			fc.property(
				operationIdArb,
				operationIdArb,
				fc.integer({ min: 0, max: 100 }),
				fc.integer({ min: 0, max: 100 }),
				(parentId, childId, parentProgress, childProgress) => {
					if (parentId === childId) return true;

					// Start parent and set its progress
					const parentHandle = manager.startOperation({ id: parentId });
					parentHandle.updateProgress({
						type: 'determinate',
						value: parentProgress,
					});

					// Flush update
					vi.advanceTimersByTime(20);

					// Start child and set different progress
					const childHandle = manager.startOperation({
						id: childId,
						parentId,
					});
					childHandle.updateProgress({
						type: 'determinate',
						value: childProgress,
					});

					// Flush update
					vi.advanceTimersByTime(20);

					// Parent progress should be unchanged
					expect(manager.getOperation(parentId)?.progress.value).toBe(
						parentProgress
					);

					// Child should have its own progress
					expect(manager.getOperation(childId)?.progress.value).toBe(
						childProgress
					);
				}
			),
			{ numRuns: 50 }
		);
	});

	/**
	 * Parent progress updates should not affect child progress.
	 */
	it('should not affect child progress when parent progress is updated', () => {
		fc.assert(
			fc.property(
				operationIdArb,
				operationIdArb,
				fc.integer({ min: 0, max: 100 }),
				fc.integer({ min: 0, max: 100 }),
				(parentId, childId, initialParentProgress, newParentProgress) => {
					if (parentId === childId) return true;

					// Start parent
					const parentHandle = manager.startOperation({ id: parentId });

					// Start child and set its progress
					const childHandle = manager.startOperation({
						id: childId,
						parentId,
					});
					childHandle.updateProgress({
						type: 'determinate',
						value: 50,
					});

					// Flush update
					vi.advanceTimersByTime(20);

					// Update parent progress multiple times
					parentHandle.updateProgress({
						type: 'determinate',
						value: initialParentProgress,
					});
					vi.advanceTimersByTime(20);

					parentHandle.updateProgress({
						type: 'determinate',
						value: newParentProgress,
					});
					vi.advanceTimersByTime(20);

					// Child progress should be unchanged
					expect(manager.getOperation(childId)?.progress.value).toBe(50);

					// Parent should have new progress
					expect(manager.getOperation(parentId)?.progress.value).toBe(
						newParentProgress
					);
				}
			),
			{ numRuns: 50 }
		);
	});

	/**
	 * Each operation in a hierarchy should track its own progress type independently.
	 */
	it('should allow different progress types for parent and children', () => {
		fc.assert(
			fc.property(operationIdArb, operationIdArb, (parentId, childId) => {
				if (parentId === childId) return true;

				// Start parent with indeterminate progress
				const parentHandle = manager.startOperation({ id: parentId });
				// Parent starts as indeterminate by default

				// Start child with determinate progress
				const childHandle = manager.startOperation({
					id: childId,
					parentId,
				});
				childHandle.updateProgress({
					type: 'determinate',
					value: 75,
				});

				// Flush update
				vi.advanceTimersByTime(20);

				// Parent should still be indeterminate
				expect(manager.getOperation(parentId)?.progress.type).toBe(
					'indeterminate'
				);

				// Child should be determinate
				expect(manager.getOperation(childId)?.progress.type).toBe(
					'determinate'
				);
				expect(manager.getOperation(childId)?.progress.value).toBe(75);
			}),
			{ numRuns: 50 }
		);
	});
});
