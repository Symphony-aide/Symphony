/**
 * @fileoverview Property-based tests for error context preservation
 *
 * Tests that error feedback appears in the same location as loading feedback.
 *
 * @module feedback/tests/errorContext.property
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import {
	OperationManager,
	resetOperationManager,
} from '../../feedback/OperationManager';
import type { EscalationLevel } from '../../feedback/types';

/**
 * Generate unique operation IDs
 */
const operationIdArb = fc
	.tuple(fc.string({ minLength: 1, maxLength: 10, unit: 'grapheme' }), fc.nat())
	.map(([prefix, num]) => `op_${prefix.replace(/[^a-zA-Z0-9]/g, '')}_${num}`);

/**
 * Generate error messages
 */
const errorMessageArb = fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0);

/**
 * Generate valid escalation configurations
 */
const validEscalationConfigArb = fc
	.tuple(
		fc.integer({ min: 50, max: 200 }),
		fc.integer({ min: 50, max: 300 }),
		fc.integer({ min: 100, max: 500 })
	)
	.map(([inline, overlayDelta, modalDelta]) => ({
		inlineThreshold: inline,
		overlayThreshold: inline + overlayDelta,
		modalThreshold: inline + overlayDelta + modalDelta,
	}));

describe('Property 10: Error context preservation', () => {
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
	 * **Feature: progressive-feedback-system, Property 10: Error context preservation**
	 *
	 * For any failed operation, error feedback should appear in the same location
	 * as loading feedback was displayed. This means the operation's escalation level
	 * at the time of failure should be preserved in the final state.
	 *
	 * **Validates: Requirements 6.1**
	 */
	it('should preserve escalation level when operation fails', () => {
		fc.assert(
			fc.property(
				operationIdArb,
				errorMessageArb,
				validEscalationConfigArb,
				(opId, errorMsg, config) => {
					// Start operation
					const handle = manager.startOperation({
						id: opId,
						config,
					});

					// Advance time to reach inline escalation
					vi.advanceTimersByTime(config.inlineThreshold + 10);

					// Get escalation level before failure
					const stateBeforeFailure = manager.getOperation(opId);
					const escalationBeforeFailure = stateBeforeFailure?.escalationLevel;

					// Fail the operation
					handle.fail(new Error(errorMsg));

					// Get state after failure
					const stateAfterFailure = manager.getOperation(opId);

					// Verify error is stored
					expect(stateAfterFailure?.status).toBe('failed');
					expect(stateAfterFailure?.error).toBeDefined();
					expect(stateAfterFailure?.error?.message).toBe(errorMsg);

					// Verify escalation level is preserved (context is maintained)
					expect(stateAfterFailure?.escalationLevel).toBe(escalationBeforeFailure);
				}
			),
			{ numRuns: 100 }
		);
	});

	/**
	 * Error should preserve overlay escalation level context.
	 */
	it('should preserve overlay escalation level on failure', () => {
		fc.assert(
			fc.property(
				operationIdArb,
				errorMessageArb,
				validEscalationConfigArb,
				(opId, errorMsg, config) => {
					const handle = manager.startOperation({
						id: opId,
						config,
					});

					// Advance to overlay level
					vi.advanceTimersByTime(config.overlayThreshold + 10);

					const stateBeforeFailure = manager.getOperation(opId);
					expect(stateBeforeFailure?.escalationLevel).toBe('overlay');

					// Fail the operation
					handle.fail(new Error(errorMsg));

					const stateAfterFailure = manager.getOperation(opId);
					expect(stateAfterFailure?.status).toBe('failed');
					expect(stateAfterFailure?.escalationLevel).toBe('overlay');
				}
			),
			{ numRuns: 100 }
		);
	});

	/**
	 * Error should preserve modal escalation level context.
	 */
	it('should preserve modal escalation level on failure', () => {
		fc.assert(
			fc.property(
				operationIdArb,
				errorMessageArb,
				validEscalationConfigArb,
				(opId, errorMsg, config) => {
					const handle = manager.startOperation({
						id: opId,
						config,
					});

					// Advance to modal level
					vi.advanceTimersByTime(config.modalThreshold + 10);

					const stateBeforeFailure = manager.getOperation(opId);
					expect(stateBeforeFailure?.escalationLevel).toBe('modal');

					// Fail the operation
					handle.fail(new Error(errorMsg));

					const stateAfterFailure = manager.getOperation(opId);
					expect(stateAfterFailure?.status).toBe('failed');
					expect(stateAfterFailure?.escalationLevel).toBe('modal');
				}
			),
			{ numRuns: 100 }
		);
	});

	/**
	 * Error should preserve 'none' escalation level for fast failures.
	 */
	it('should preserve none escalation level for immediate failures', () => {
		fc.assert(
			fc.property(
				operationIdArb,
				errorMessageArb,
				(opId, errorMsg) => {
					const handle = manager.startOperation({ id: opId });

					// Fail immediately (no time advancement)
					handle.fail(new Error(errorMsg));

					const state = manager.getOperation(opId);
					expect(state?.status).toBe('failed');
					expect(state?.escalationLevel).toBe('none');
					expect(state?.error?.message).toBe(errorMsg);
				}
			),
			{ numRuns: 100 }
		);
	});

	/**
	 * Operation ID should be preserved in error state for context tracking.
	 */
	it('should preserve operation ID in error state', () => {
		fc.assert(
			fc.property(
				operationIdArb,
				errorMessageArb,
				(opId, errorMsg) => {
					const handle = manager.startOperation({ id: opId });

					handle.fail(new Error(errorMsg));

					const state = manager.getOperation(opId);
					expect(state?.id).toBe(opId);
					expect(state?.status).toBe('failed');
				}
			),
			{ numRuns: 100 }
		);
	});

	/**
	 * Subscribers should be notified of error state with preserved context.
	 */
	it('should notify subscribers with error state and preserved context', () => {
		fc.assert(
			fc.property(
				operationIdArb,
				errorMessageArb,
				validEscalationConfigArb,
				(opId, errorMsg, config) => {
					const handle = manager.startOperation({
						id: opId,
						config,
					});

					let notifiedStatus: string | null = null;
					let notifiedEscalationLevel: EscalationLevel | null = null;
					let notifiedErrorMessage: string | null = null;

					manager.subscribe(opId, (state) => {
						if (state.status === 'failed') {
							notifiedStatus = state.status;
							notifiedEscalationLevel = state.escalationLevel;
							notifiedErrorMessage = state.error?.message ?? null;
						}
					});

					// Advance to inline level
					vi.advanceTimersByTime(config.inlineThreshold + 10);

					// Fail the operation
					handle.fail(new Error(errorMsg));

					// Verify subscriber was notified with correct context
					expect(notifiedStatus).toBe('failed');
					expect(notifiedEscalationLevel).toBe('inline');
					expect(notifiedErrorMessage).toBe(errorMsg);
				}
			),
			{ numRuns: 50 }
		);
	});
});
