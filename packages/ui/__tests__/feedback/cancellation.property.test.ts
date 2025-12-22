/**
 * @fileoverview Property-based tests for CancellationToken
 *
 * **Feature: progressive-feedback-system, Property 8: Hierarchical cancellation propagation**
 *
 * These tests verify that cancellation tokens correctly propagate cancellation
 * from parent to child tokens in hierarchical operation structures.
 *
 * **Validates: Requirements 4.5**
 */

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import {
	CancellationTokenSource,
	createCancellationToken,
	createLinkedToken,
} from '../../feedback/CancellationToken';

describe('CancellationToken', () => {
	describe('Basic functionality', () => {
		it('should start with isCancelled = false', () => {
			const token = createCancellationToken();
			expect(token.isCancelled).toBe(false);
		});

		it('should set isCancelled = true after cancel()', () => {
			const token = createCancellationToken();
			token.cancel();
			expect(token.isCancelled).toBe(true);
		});

		it('should invoke registered callbacks on cancel', () => {
			const token = createCancellationToken();
			const callback = vi.fn();

			token.onCancel(callback);
			token.cancel();

			expect(callback).toHaveBeenCalledTimes(1);
		});

		it('should support multiple callback registrations', () => {
			fc.assert(
				fc.property(fc.integer({ min: 1, max: 20 }), (numCallbacks) => {
					const token = createCancellationToken();
					const callbacks = Array.from({ length: numCallbacks }, () => vi.fn());

					callbacks.forEach((cb) => token.onCancel(cb));
					token.cancel();

					callbacks.forEach((cb) => {
						expect(cb).toHaveBeenCalledTimes(1);
					});
				}),
				{ numRuns: 100 }
			);
		});

		it('should invoke callback immediately if already cancelled', () => {
			const token = createCancellationToken();
			token.cancel();

			const callback = vi.fn();
			token.onCancel(callback);

			expect(callback).toHaveBeenCalledTimes(1);
		});

		it('should allow unsubscribing callbacks', () => {
			const token = createCancellationToken();
			const callback = vi.fn();

			const unsubscribe = token.onCancel(callback);
			unsubscribe();
			token.cancel();

			expect(callback).not.toHaveBeenCalled();
		});

		it('should be idempotent - multiple cancel() calls have no additional effect', () => {
			fc.assert(
				fc.property(fc.integer({ min: 1, max: 10 }), (numCancels) => {
					const token = createCancellationToken();
					const callback = vi.fn();

					token.onCancel(callback);

					for (let i = 0; i < numCancels; i++) {
						token.cancel();
					}

					expect(callback).toHaveBeenCalledTimes(1);
					expect(token.isCancelled).toBe(true);
				}),
				{ numRuns: 100 }
			);
		});
	});

	describe('Property 8: Hierarchical cancellation propagation', () => {
		/**
		 * **Feature: progressive-feedback-system, Property 8: Hierarchical cancellation propagation**
		 *
		 * For any parent operation that is cancelled, all child operations should also be cancelled.
		 *
		 * **Validates: Requirements 4.5**
		 */
		it('should cancel all direct children when parent is cancelled', () => {
			fc.assert(
				fc.property(fc.integer({ min: 1, max: 10 }), (numChildren) => {
					const parent = createCancellationToken();
					const children = Array.from({ length: numChildren }, () =>
						parent.createChild()
					);

					// All children should start uncancelled
					children.forEach((child) => {
						expect(child.isCancelled).toBe(false);
					});

					// Cancel parent
					parent.cancel();

					// All children should now be cancelled
					children.forEach((child) => {
						expect(child.isCancelled).toBe(true);
					});
				}),
				{ numRuns: 100 }
			);
		});

		it('should propagate cancellation through multiple levels of hierarchy', () => {
			fc.assert(
				fc.property(
					fc.integer({ min: 1, max: 5 }), // depth
					fc.integer({ min: 1, max: 3 }), // children per level
					(depth, childrenPerLevel) => {
						const root = createCancellationToken();
						const allTokens: CancellationTokenSource[] = [root];

						// Build tree structure
						let currentLevel = [root];
						for (let level = 0; level < depth; level++) {
							const nextLevel: CancellationTokenSource[] = [];
							for (const parent of currentLevel) {
								for (let i = 0; i < childrenPerLevel; i++) {
									const child = parent.createChild();
									nextLevel.push(child);
									allTokens.push(child);
								}
							}
							currentLevel = nextLevel;
						}

						// All tokens should start uncancelled
						allTokens.forEach((token) => {
							expect(token.isCancelled).toBe(false);
						});

						// Cancel root
						root.cancel();

						// All tokens should now be cancelled
						allTokens.forEach((token) => {
							expect(token.isCancelled).toBe(true);
						});
					}
				),
				{ numRuns: 50 }
			);
		});

		it('should invoke child callbacks when parent is cancelled', () => {
			fc.assert(
				fc.property(fc.integer({ min: 1, max: 5 }), (numChildren) => {
					const parent = createCancellationToken();
					const childCallbacks = Array.from({ length: numChildren }, () =>
						vi.fn()
					);
					const children = Array.from({ length: numChildren }, (_, i) => {
						const child = parent.createChild();
						child.onCancel(childCallbacks[i]);
						return child;
					});

					parent.cancel();

					childCallbacks.forEach((cb) => {
						expect(cb).toHaveBeenCalledTimes(1);
					});
				}),
				{ numRuns: 100 }
			);
		});

		it('should not cancel parent when child is cancelled', () => {
			const parent = createCancellationToken();
			const child = parent.createChild();

			child.cancel();

			expect(child.isCancelled).toBe(true);
			expect(parent.isCancelled).toBe(false);
		});

		it('should not affect siblings when one child is cancelled', () => {
			fc.assert(
				fc.property(fc.integer({ min: 2, max: 10 }), (numChildren) => {
					const parent = createCancellationToken();
					const children = Array.from({ length: numChildren }, () =>
						parent.createChild()
					);

					// Cancel first child
					children[0].cancel();

					// First child should be cancelled
					expect(children[0].isCancelled).toBe(true);

					// Other children should not be cancelled
					for (let i = 1; i < numChildren; i++) {
						expect(children[i].isCancelled).toBe(false);
					}

					// Parent should not be cancelled
					expect(parent.isCancelled).toBe(false);
				}),
				{ numRuns: 100 }
			);
		});

		it('should handle child created from already-cancelled parent', () => {
			const parent = createCancellationToken();
			parent.cancel();

			const child = parent.createChild();

			// Child should be immediately cancelled
			expect(child.isCancelled).toBe(true);
		});

		it('should allow detaching child from parent', () => {
			const parent = createCancellationToken();
			const child = parent.createChild();

			child.detachFromParent();
			parent.cancel();

			expect(parent.isCancelled).toBe(true);
			expect(child.isCancelled).toBe(false);
		});
	});

	describe('Linked tokens', () => {
		it('should cancel linked token when any source token cancels', () => {
			fc.assert(
				fc.property(
					fc.integer({ min: 2, max: 5 }),
					fc.integer({ min: 0, max: 4 }),
					(numTokens, cancelIndex) => {
						const tokens = Array.from({ length: numTokens }, () =>
							createCancellationToken()
						);
						const linked = createLinkedToken(...tokens);

						const indexToCancel = cancelIndex % numTokens;
						tokens[indexToCancel].cancel();

						expect(linked.isCancelled).toBe(true);
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should be immediately cancelled if any source is already cancelled', () => {
			const token1 = createCancellationToken();
			const token2 = createCancellationToken();
			token1.cancel();

			const linked = createLinkedToken(token1, token2);

			expect(linked.isCancelled).toBe(true);
		});
	});

	describe('Error handling', () => {
		it('should continue invoking callbacks even if one throws', () => {
			const token = createCancellationToken();
			const callback1 = vi.fn(() => {
				throw new Error('Test error');
			});
			const callback2 = vi.fn();
			const callback3 = vi.fn();

			token.onCancel(callback1);
			token.onCancel(callback2);
			token.onCancel(callback3);

			// Should not throw
			expect(() => token.cancel()).not.toThrow();

			// All callbacks should have been attempted
			expect(callback1).toHaveBeenCalledTimes(1);
			expect(callback2).toHaveBeenCalledTimes(1);
			expect(callback3).toHaveBeenCalledTimes(1);
		});
	});

	describe('Dispose', () => {
		it('should clean up resources on dispose', () => {
			const parent = createCancellationToken();
			const child = parent.createChild();
			const callback = vi.fn();

			child.onCancel(callback);
			child.dispose();

			// After dispose, cancelling parent should not affect disposed child
			parent.cancel();

			// The child was detached, so it shouldn't be cancelled by parent
			expect(child.isCancelled).toBe(false);
		});
	});
});
