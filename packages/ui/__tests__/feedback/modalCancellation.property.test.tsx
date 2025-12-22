/**
 * @fileoverview Property-based tests for modal cancellation availability
 *
 * **Feature: progressive-feedback-system, Property 7: Modal cancellation availability**
 *
 * These tests verify that operations at modal escalation level have a cancel button
 * that is present and functional.
 *
 * **Validates: Requirements 4.1, 4.2**
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import * as React from 'react';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { ModalProgress } from '../../feedback/components/ModalProgress';
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

describe('Property 7: Modal cancellation availability', () => {
  it('should display cancel button when canCancel is true', () => {
    fc.assert(
      fc.property(progressStateArb, (progress) => {
        cleanup();
        render(
          <ModalProgress
            open={true}
            progress={progress}
            onCancel={() => {}}
            canCancel={true}
          />
        );
        const cancelButton = document.body.querySelector('button');
        expect(cancelButton).toBeTruthy();
        expect(cancelButton?.textContent).toContain('Cancel');
      }),
      { numRuns: 20 }
    );
  }, 15000);

  it('should not display cancel button when canCancel is false', () => {
    fc.assert(
      fc.property(progressStateArb, (progress) => {
        cleanup();
        render(
          <ModalProgress
            open={true}
            progress={progress}
            onCancel={() => {}}
            canCancel={false}
          />
        );
        const cancelButton = document.body.querySelector('button');
        expect(cancelButton).toBeFalsy();
      }),
      { numRuns: 20 }
    );
  }, 15000);

  it('should call onCancel when cancel button is clicked', () => {
    fc.assert(
      fc.property(progressStateArb, (progress) => {
        cleanup();
        const onCancel = vi.fn();
        render(
          <ModalProgress
            open={true}
            progress={progress}
            onCancel={onCancel}
            canCancel={true}
          />
        );
        const cancelButton = document.body.querySelector('button');
        expect(cancelButton).toBeTruthy();
        fireEvent.click(cancelButton!);
        expect(onCancel).toHaveBeenCalledTimes(1);
      }),
      { numRuns: 20 }
    );
  }, 15000);

  it('should display cancel button by default (canCancel defaults to true)', () => {
    fc.assert(
      fc.property(progressStateArb, (progress) => {
        cleanup();
        render(
          <ModalProgress
            open={true}
            progress={progress}
            onCancel={() => {}}
          />
        );
        const cancelButton = document.body.querySelector('button');
        expect(cancelButton).toBeTruthy();
      }),
      { numRuns: 20 }
    );
  }, 15000);
});