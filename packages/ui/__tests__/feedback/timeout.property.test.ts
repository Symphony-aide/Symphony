/**
 * @fileoverview Property-based tests for timeout handling
 *
 * Tests that operations with configured timeouts are properly cancelled
 * and display timeout-specific messages.
 *
 * @module feedback/tests/timeout.property
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import {
	OperationManager,
	resetOperationManager,
} from '../../feedback/OperationManager';
import { isTimeoutError } from '../../feedback/utils';

/**
 * Generate unique operation IDs
 */
const operationIdArb = fc
	.tuple(fc.string({ minLength: 1, maxLength: 10, unit: 'grapheme' }), fc.nat())
	.map(([prefix, num]) => `op_${prefix.replace(/[^a-zA-Z0-9]/g, '')}_${num}`);

/**
 * Generate valid timeout configurations
 */
const timeoutConfigArb = fc
	.tuple(
		fc.integer({ min: 50, max: 200 }),   // inlineThreshold
		fc.integer({ min: 50, max: 300 }),   // overlayDelta
		fc.integer({ min: 100, max: 500 }),  // modalDelta
		fc.integer({ min: 100, max: 2000 })  // timeout
	)
	.map(([inline, overlayDelta, modalDelta, timeout]) => ({
		inlineThreshold: inline,
		overlayThreshold: inline + overlayDelta,
		modalThreshold: inline + overlayDelta + modalDelta,
		timeout,
	}));

describe('Property 12: Timeout handling', () => {
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
	 * **Feature: progressive-feedback-system, Property 12: Timeout handling**
	 *
	 * For any operation with a configured timeout that exceeds that timeout,
	 * the operation should be cancelled and a timeout message displayed.
	 *
	 * **Validates: Requirements 6.4**
	 */
	it('should fail operation with timeout error when timeout is exceeded', () => {
		fc.assert(
			fc.property(
				operationIdArb,
				timeoutConfigArb,
				(opId, config) => {
					// Start operation with timeout
					manager.startOperation({
						id: opId,
						config,
					});

					// Verify operation is running
					expect(manager.getOperation(opId)?.status).toBe('running');

					// Advance time past the timeout
					vi.advanceTimersByTime(config.timeout + 10);

					// Verify operation is failed
					const state = manager.getOperation(opId);
					expect(state?.status).toBe('failed');

					// Verify error is a timeout error
					expect(state?.error).toBeDefined();
					expect(isTimeoutError(state?.error)).toBe(true);
					expect(state?.error?.message).toContain('timed out');
					expect(state?.error?.message).toContain(String(config.timeout));
				}
			),
			{ numRuns: 100 }
		);
	});

	/**
	 * Operations completing before timeout should not be affected.
	 */
	it('should not timeout operations that complete before timeout', () => {
		fc.assert(
			fc.property(
				operationIdArb,
				timeoutConfigArb,
				(opId, config) => {
					const handle = manager.startOperation({
						id: opId,
						config,
					});

					// Advance time to just before timeout
					vi.advanceTimersByTime(config.timeout - 10);

					// Complete the operation
					handle.complete({ result: 'success' });

					// Verify operation is completed, not timed out
					const state = manager.getOperation(opId);
					expect(state?.status).toBe('completed');
					expect(state?.error).toBeUndefined();
				}
			),
			{ numRuns: 100 }
		);
	});

	/**
	 * Operations without timeout config should not timeout.
	 */
	it('should not timeout operations without timeout config', () => {
		fc.assert(
			fc.property(
				operationIdArb,
				fc.integer({ min: 1000, max: 10000 }),
				(opId, duration) => {
					// Start operation without timeout
					manager.startOperation({
						id: opId,
						config: {
							inlineThreshold: 200,
							overlayThreshold: 500,
							modalThreshold: 2000,
							// No timeout configured
						},
					});

					// Advance time significantly
					vi.advanceTimersByTime(duration);

					// Operation should still be running (not timed out)
					const state = manager.getOperation(opId);
					expect(state?.status).toBe('running');
				}
			),
			{ numRuns: 50 }
		);
	});

	/**
	 * Timeout should trigger at exactly the configured time.
	 */
	it('should timeout at exactly the configured timeout duration', () => {
		fc.assert(
			fc.property(
				operationIdArb,
				timeoutConfigArb,
				(opId, config) => {
					manager.startOperation({
						id: opId,
						config,
					});

					// Advance to 1ms before timeout
					vi.advanceTimersByTime(config.timeout - 1);

					// Should still be running
					expect(manager.getOperation(opId)?.status).toBe('running');

					// Advance past timeout
					vi.advanceTimersByTime(2);

					// Should now be failed
					expect(manager.getOperation(opId)?.status).toBe('failed');
				}
			),
			{ numRuns: 100 }
		);
	});

	/**
	 * Timeout error message should include the timeout duration.
	 */
	it('should include timeout duration in error message', () => {
		fc.assert(
			fc.property(
				operationIdArb,
				timeoutConfigArb,
				(opId, config) => {
					manager.startOperation({
						id: opId,
						config,
					});

					// Trigger timeout
					vi.advanceTimersByTime(config.timeout + 10);

					const state = manager.getOperation(opId);
					expect(state?.error?.message).toContain(String(config.timeout));
					expect(state?.error?.message).toContain('ms');
				}
			),
			{ numRuns: 100 }
		);
	});

	/**
	 * Subscribers should be notified of timeout failure.
	 */
	it('should notify subscribers when operation times out', () => {
		fc.assert(
			fc.property(
				operationIdArb,
				timeoutConfigArb,
				(opId, config) => {
					manager.startOperation({
						id: opId,
						config,
					});

					let notifiedStatus: string | null = null;
					let notifiedError: Error | undefined;

					manager.subscribe(opId, (state) => {
						if (state.status === 'failed') {
							notifiedStatus = state.status;
							notifiedError = state.error;
						}
					});

					// Trigger timeout
					vi.advanceTimersByTime(config.timeout + 10);

					// Verify subscriber was notified
					expect(notifiedStatus).toBe('failed');
					expect(notifiedError).toBeDefined();
					expect(isTimeoutError(notifiedError)).toBe(true);
				}
			),
			{ numRuns: 50 }
		);
	});

	/**
	 * Cancelled operations should not trigger timeout.
	 */
	it('should not trigger timeout for cancelled operations', () => {
		fc.assert(
			fc.property(
				operationIdArb,
				timeoutConfigArb,
				(opId, config) => {
					manager.startOperation({
						id: opId,
						config,
					});

					// Cancel before timeout
					vi.advanceTimersByTime(config.timeout / 2);
					manager.cancelOperation(opId);

					// Advance past timeout
					vi.advanceTimersByTime(config.timeout);

					// Should be cancelled, not timed out
					const state = manager.getOperation(opId);
					expect(state?.status).toBe('cancelled');
					// Error should not be a timeout error
					expect(state?.error).toBeUndefined();
				}
			),
			{ numRuns: 50 }
		);
	});

	/**
	 * Completed operations should not trigger timeout.
	 */
	it('should not trigger timeout for completed operations', () => {
		fc.assert(
			fc.property(
				operationIdArb,
				timeoutConfigArb,
				(opId, config) => {
					const handle = manager.startOperation({
						id: opId,
						config,
					});

					// Complete before timeout
					vi.advanceTimersByTime(config.timeout / 2);
					handle.complete({ result: 'done' });

					// Advance past timeout
					vi.advanceTimersByTime(config.timeout);

					// Should still be completed
					const state = manager.getOperation(opId);
					expect(state?.status).toBe('completed');
					expect(state?.error).toBeUndefined();
				}
			),
			{ numRuns: 50 }
		);
	});
});
