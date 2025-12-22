/**
 * @fileoverview Property-based tests for escalation level calculation
 *
 * **Feature: progressive-feedback-system, Property 2: Escalation level matches duration**
 *
 * These tests verify that the escalation level is correctly determined based on
 * operation duration and configuration thresholds.
 *
 * **Validates: Requirements 1.3, 1.4, 1.5**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateEscalationLevel } from '../../feedback/utils';
import type { EscalationConfig, EscalationLevel } from '../../feedback/types';

/**
 * Generate valid escalation configurations where thresholds are in correct order.
 * Ensures: inlineThreshold < overlayThreshold < modalThreshold
 */
const validEscalationConfigArb = fc
  .tuple(
    fc.integer({ min: 0, max: 1000 }),      // inlineThreshold
    fc.integer({ min: 1, max: 2000 }),      // overlay delta
    fc.integer({ min: 1, max: 10000 })      // modal delta
  )
  .map(([inline, overlayDelta, modalDelta]) => ({
    inlineThreshold: inline,
    overlayThreshold: inline + overlayDelta,
    modalThreshold: inline + overlayDelta + modalDelta,
  }));

/**
 * Generate duration values within a reasonable range.
 */
const durationArb = fc.integer({ min: 0, max: 20000 });

describe('Property 2: Escalation level matches duration', () => {
  /**
   * **Feature: progressive-feedback-system, Property 2: Escalation level matches duration**
   *
   * For any operation with duration D, the escalation level should be:
   * - 'none' if D < inlineThreshold
   * - 'inline' if inlineThreshold ≤ D < overlayThreshold
   * - 'overlay' if overlayThreshold ≤ D < modalThreshold
   * - 'modal' if D ≥ modalThreshold
   *
   * **Validates: Requirements 1.3, 1.4, 1.5**
   */
  it('should return correct escalation level for any duration and valid config', () => {
    fc.assert(
      fc.property(durationArb, validEscalationConfigArb, (duration, config) => {
        const level = calculateEscalationLevel(duration, config);

        // Determine expected level based on thresholds
        let expectedLevel: EscalationLevel;
        if (duration < config.inlineThreshold) {
          expectedLevel = 'none';
        } else if (duration < config.overlayThreshold) {
          expectedLevel = 'inline';
        } else if (duration < config.modalThreshold) {
          expectedLevel = 'overlay';
        } else {
          expectedLevel = 'modal';
        }

        expect(level).toBe(expectedLevel);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Operations below inline threshold should always return 'none'.
   * This validates Requirement 1.2: silent completion for fast operations.
   */
  it('should return "none" for durations below inline threshold', () => {
    fc.assert(
      fc.property(validEscalationConfigArb, (config) => {
        // Generate duration strictly below inline threshold
        if (config.inlineThreshold === 0) return true; // Skip edge case

        const duration = Math.floor(Math.random() * config.inlineThreshold);
        const level = calculateEscalationLevel(duration, config);

        expect(level).toBe('none');
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Operations at or above inline threshold but below overlay should return 'inline'.
   * This validates Requirement 1.3: inline spinner for 200-500ms operations.
   */
  it('should return "inline" for durations in inline range', () => {
    fc.assert(
      fc.property(validEscalationConfigArb, (config) => {
        // Generate duration in inline range
        const rangeSize = config.overlayThreshold - config.inlineThreshold;
        if (rangeSize <= 0) return true; // Skip invalid configs

        const duration = config.inlineThreshold + Math.floor(Math.random() * rangeSize);
        const level = calculateEscalationLevel(duration, config);

        expect(level).toBe('inline');
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Operations at or above overlay threshold but below modal should return 'overlay'.
   * This validates Requirement 1.4: overlay spinner for 500ms-2s operations.
   */
  it('should return "overlay" for durations in overlay range', () => {
    fc.assert(
      fc.property(validEscalationConfigArb, (config) => {
        // Generate duration in overlay range
        const rangeSize = config.modalThreshold - config.overlayThreshold;
        if (rangeSize <= 0) return true; // Skip invalid configs

        const duration = config.overlayThreshold + Math.floor(Math.random() * rangeSize);
        const level = calculateEscalationLevel(duration, config);

        expect(level).toBe('overlay');
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Operations at or above modal threshold should return 'modal'.
   * This validates Requirement 1.5: modal dialog for >2s operations.
   */
  it('should return "modal" for durations at or above modal threshold', () => {
    fc.assert(
      fc.property(validEscalationConfigArb, fc.integer({ min: 0, max: 10000 }), (config, extra) => {
        const duration = config.modalThreshold + extra;
        const level = calculateEscalationLevel(duration, config);

        expect(level).toBe('modal');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Escalation levels should be monotonically increasing with duration.
   * If duration1 < duration2, then level1 <= level2 (in terms of escalation order).
   */
  it('should have monotonically increasing escalation with duration', () => {
    const levelOrder: Record<EscalationLevel, number> = {
      none: 0,
      inline: 1,
      overlay: 2,
      modal: 3,
    };

    fc.assert(
      fc.property(
        validEscalationConfigArb,
        fc.integer({ min: 0, max: 10000 }),
        fc.integer({ min: 0, max: 10000 }),
        (config, d1, d2) => {
          const duration1 = Math.min(d1, d2);
          const duration2 = Math.max(d1, d2);

          const level1 = calculateEscalationLevel(duration1, config);
          const level2 = calculateEscalationLevel(duration2, config);

          expect(levelOrder[level1]).toBeLessThanOrEqual(levelOrder[level2]);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Boundary test: exact threshold values should escalate to the next level.
   */
  it('should escalate at exact threshold boundaries', () => {
    fc.assert(
      fc.property(validEscalationConfigArb, (config) => {
        // At inline threshold, should be 'inline'
        expect(calculateEscalationLevel(config.inlineThreshold, config)).toBe('inline');

        // At overlay threshold, should be 'overlay'
        expect(calculateEscalationLevel(config.overlayThreshold, config)).toBe('overlay');

        // At modal threshold, should be 'modal'
        expect(calculateEscalationLevel(config.modalThreshold, config)).toBe('modal');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Zero duration should always return 'none' (unless inline threshold is 0).
   */
  it('should return "none" for zero duration when inline threshold > 0', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 2000 }),
        fc.integer({ min: 1, max: 10000 }),
        (inline, overlayDelta, modalDelta) => {
          const config: EscalationConfig = {
            inlineThreshold: inline,
            overlayThreshold: inline + overlayDelta,
            modalThreshold: inline + overlayDelta + modalDelta,
          };

          const level = calculateEscalationLevel(0, config);
          expect(level).toBe('none');
        }
      ),
      { numRuns: 100 }
    );
  });
});
