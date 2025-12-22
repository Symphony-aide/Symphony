/**
 * @fileoverview Property-based tests for progress transition consistency
 *
 * **Feature: progressive-feedback-system, Property 5: Progress transition consistency**
 *
 * These tests verify that operations transitioning from indeterminate to determinate
 * progress smoothly update from spinner to progress bar without losing state.
 *
 * **Validates: Requirements 3.3**
 */

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import * as React from 'react';
import { render, cleanup, act, waitFor } from '@testing-library/react';
import { OverlaySpinner } from '../../feedback/components/OverlaySpinner';
import { OperationManager, resetOperationManager } from '../../feedback/OperationManager';
import type { ProgressState } from '../../feedback/types';

afterEach(() => {
  cleanup();
  resetOperationManager();
  vi.useRealTimers();
});

describe('Property 5: Progress transition consistency', () => {
  describe('OverlaySpinner transitions', () => {
    it('should transition from indeterminate to determinate without losing visibility', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          (progressValue, message) => {
            cleanup();

            // Start with indeterminate progress
            const indeterminateProgress: ProgressState = {
              type: 'indeterminate',
              message,
            };

            const { container, rerender } = render(
              <OverlaySpinner visible={true} progress={indeterminateProgress} />
            );

            // Verify indeterminate state shows spinner
            let spinner = container.querySelector('.animate-spin');
            expect(spinner).toBeTruthy();

            // Transition to determinate progress
            const determinateProgress: ProgressState = {
              type: 'determinate',
              value: progressValue,
              message,
            };

            rerender(
              <OverlaySpinner visible={true} progress={determinateProgress} />
            );

            // Verify component is still visible
            const overlay = container.querySelector('[role="status"]');
            expect(overlay).toBeTruthy();

            // Verify percentage is now shown
            const percentageElement = container.querySelector('.font-medium');
            expect(percentageElement).toBeTruthy();
            expect(percentageElement?.textContent).toBe(`${Math.round(progressValue)}%`);

            // Verify message is preserved
            const messageElement = container.querySelector('.text-muted-foreground');
            expect(messageElement).toBeTruthy();
            expect(messageElement?.textContent).toBe(message);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should preserve message during progress type transition', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          fc.integer({ min: 0, max: 100 }),
          (message, progressValue) => {
            cleanup();

            // Start with indeterminate progress with message
            const indeterminateProgress: ProgressState = {
              type: 'indeterminate',
              message,
            };

            const { container, rerender } = render(
              <OverlaySpinner visible={true} progress={indeterminateProgress} />
            );

            // Verify message is shown
            let messageElement = container.querySelector('.text-muted-foreground');
            expect(messageElement?.textContent).toBe(message);

            // Transition to determinate with same message
            const determinateProgress: ProgressState = {
              type: 'determinate',
              value: progressValue,
              message,
            };

            rerender(
              <OverlaySpinner visible={true} progress={determinateProgress} />
            );

            // Verify message is still shown
            messageElement = container.querySelector('.text-muted-foreground');
            expect(messageElement?.textContent).toBe(message);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle multiple progress value updates smoothly', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 2, maxLength: 10 }),
          (progressValues) => {
            cleanup();

            const { container, rerender } = render(
              <OverlaySpinner
                visible={true}
                progress={{ type: 'determinate', value: progressValues[0] }}
              />
            );

            // Update progress multiple times
            for (const value of progressValues) {
              rerender(
                <OverlaySpinner
                  visible={true}
                  progress={{ type: 'determinate', value }}
                />
              );

              // Verify percentage is updated correctly
              const percentageElement = container.querySelector('.font-medium');
              expect(percentageElement?.textContent).toBe(`${Math.round(value)}%`);
            }
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('OperationManager progress transitions', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should update progress state from indeterminate to determinate', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          (progressValue) => {
            resetOperationManager();
            const manager = new OperationManager();

            // Start operation with indeterminate progress
            const handle = manager.startOperation({ id: 'test-op' });

            // Verify initial state is indeterminate
            let state = manager.getOperation('test-op');
            expect(state?.progress.type).toBe('indeterminate');

            // Update to determinate progress
            handle.updateProgress({ type: 'determinate', value: progressValue });

            // Advance timers to allow throttled update to apply
            vi.advanceTimersByTime(20);

            // Verify state is now determinate
            state = manager.getOperation('test-op');
            expect(state?.progress.type).toBe('determinate');
            expect(state?.progress.value).toBe(progressValue);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should preserve operation state during progress type change', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          fc.integer({ min: 0, max: 100 }),
          (message, progressValue) => {
            resetOperationManager();
            const manager = new OperationManager();

            // Start operation
            const handle = manager.startOperation({ id: 'test-op' });

            // Set message with indeterminate progress
            handle.updateProgress({ type: 'indeterminate', message });
            vi.advanceTimersByTime(20);

            let state = manager.getOperation('test-op');
            expect(state?.progress.message).toBe(message);
            expect(state?.status).toBe('running');

            // Transition to determinate
            handle.updateProgress({ type: 'determinate', value: progressValue, message });
            vi.advanceTimersByTime(20);

            state = manager.getOperation('test-op');
            expect(state?.progress.type).toBe('determinate');
            expect(state?.progress.value).toBe(progressValue);
            expect(state?.progress.message).toBe(message);
            expect(state?.status).toBe('running');
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});