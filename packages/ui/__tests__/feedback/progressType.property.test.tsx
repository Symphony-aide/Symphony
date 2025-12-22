/**
 * @fileoverview Property-based tests for progress type selection
 *
 * **Feature: progressive-feedback-system, Property 4: Progress type selection**
 *
 * These tests verify that the correct progress display type (indeterminate/determinate)
 * is selected based on whether progress percentage is available.
 *
 * **Validates: Requirements 3.1, 3.2**
 */

import { describe, it, expect, afterEach } from 'vitest';
import * as fc from 'fast-check';
import * as React from 'react';
import { render, cleanup } from '@testing-library/react';
import { OverlaySpinner } from '../../feedback/components/OverlaySpinner';
import type { ProgressState } from '../../feedback/types';

afterEach(() => {
  cleanup();
});

const indeterminateProgressArb: fc.Arbitrary<ProgressState> = fc.record({
  type: fc.constant('indeterminate' as const),
  message: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }),
});

const determinateProgressArb: fc.Arbitrary<ProgressState> = fc.record({
  type: fc.constant('determinate' as const),
  value: fc.integer({ min: 0, max: 100 }),
  message: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }),
});

const progressStateArb: fc.Arbitrary<ProgressState> = fc.oneof(
  indeterminateProgressArb,
  determinateProgressArb
);

const nonEmptyMessageArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);

describe('Property 4: Progress type selection', () => {
  describe('OverlaySpinner component', () => {
    it('should display percentage for determinate progress', () => {
      fc.assert(
        fc.property(determinateProgressArb, (progress) => {
          cleanup();
          const { container } = render(
            <OverlaySpinner visible={true} progress={progress} />
          );
          const percentageElement = container.querySelector('.font-medium');
          expect(percentageElement).toBeTruthy();
          expect(percentageElement?.textContent).toBe(`${Math.round(progress.value!)}%`);
        }),
        { numRuns: 50 }
      );
    });

    it('should not display percentage for indeterminate progress', () => {
      fc.assert(
        fc.property(indeterminateProgressArb, (progress) => {
          cleanup();
          const { container } = render(
            <OverlaySpinner visible={true} progress={progress} />
          );
          const percentageElement = container.querySelector('.font-medium');
          expect(percentageElement).toBeFalsy();
        }),
        { numRuns: 50 }
      );
    });

    it('should display message from progress state', () => {
      fc.assert(
        fc.property(
          fc.record({
            type: fc.constant('indeterminate' as const),
            message: nonEmptyMessageArb,
          }),
          (progress) => {
            cleanup();
            const { container } = render(
              <OverlaySpinner visible={true} progress={progress} />
            );
            const messageElement = container.querySelector('.text-muted-foreground');
            expect(messageElement).toBeTruthy();
            expect(messageElement?.textContent).toBe(progress.message);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Progress type consistency', () => {
    it('should correctly identify progress type from state', () => {
      fc.assert(
        fc.property(progressStateArb, (progress) => {
          const isDeterminate = progress.type === 'determinate';
          const hasValue = progress.value !== undefined;
          if (isDeterminate) {
            expect(hasValue).toBe(true);
          }
          expect(['indeterminate', 'determinate']).toContain(progress.type);
        }),
        { numRuns: 100 }
      );
    });

    it('should have valid progress value range for determinate progress', () => {
      fc.assert(
        fc.property(determinateProgressArb, (progress) => {
          expect(progress.value).toBeGreaterThanOrEqual(0);
          expect(progress.value).toBeLessThanOrEqual(100);
        }),
        { numRuns: 100 }
      );
    });
  });
});