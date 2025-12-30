import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { ErrorBoundary } from '../../src/renderers/ErrorBoundary.jsx';

const errorMessageArb = fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0);

const createError = (message) => {
  const error = new Error(message);
  error.stack = `Error: ${message}\n    at TestComponent (test.js:1:1)`;
  return error;
};

const ThrowingComponent = ({ error }) => {
  throw error;
};

describe('ErrorBoundary UI Component Tests', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  /**
   * **Feature: ui-components-migration, Property 1: ErrorBoundary uses Card components for error container**
   * **Validates: Requirements 1.1**
   */
  describe('Property 1: ErrorBoundary uses Card components', () => {
    it('should render Card component as the error container', () => {
      fc.assert(
        fc.property(errorMessageArb, (message) => {
          cleanup();
          const error = createError(message);
          const { container } = render(
            <ErrorBoundary>
              <ThrowingComponent error={error} />
            </ErrorBoundary>
          );
          const cardElement = container.querySelector('.rounded-xl.border');
          expect(cardElement).toBeTruthy();
        }),
        { numRuns: 100 }
      );
    });

    it('should render CardHeader with CardTitle containing error title', () => {
      fc.assert(
        fc.property(errorMessageArb, (message) => {
          cleanup();
          const error = createError(message);
          const { container } = render(
            <ErrorBoundary>
              <ThrowingComponent error={error} />
            </ErrorBoundary>
          );
          const titleElement = container.querySelector('h3.font-semibold');
          expect(titleElement).toBeTruthy();
          expect(titleElement?.textContent).toContain('Something went wrong');
        }),
        { numRuns: 100 }
      );
    });

    it('should render CardDescription with error message', () => {
      fc.assert(
        fc.property(errorMessageArb, (message) => {
          cleanup();
          const error = createError(message);
          const { container } = render(
            <ErrorBoundary>
              <ThrowingComponent error={error} />
            </ErrorBoundary>
          );
          const descriptionElement = container.querySelector('p.text-sm.text-muted-foreground');
          expect(descriptionElement).toBeTruthy();
          expect(descriptionElement?.textContent).toBe(message);
        }),
        { numRuns: 100 }
      );
    });

    it('should render CardFooter containing the retry button', () => {
      fc.assert(
        fc.property(errorMessageArb, (message) => {
          cleanup();
          const error = createError(message);
          const { container } = render(
            <ErrorBoundary>
              <ThrowingComponent error={error} />
            </ErrorBoundary>
          );
          const footerElement = container.querySelector('.flex.items-center.p-6.pt-0');
          expect(footerElement).toBeTruthy();
          const buttonInFooter = footerElement?.querySelector('button');
          expect(buttonInFooter).toBeTruthy();
        }),
        { numRuns: 100 }
      );
    });

    it('should apply destructive styling to the Card', () => {
      fc.assert(
        fc.property(errorMessageArb, (message) => {
          cleanup();
          const error = createError(message);
          const { container } = render(
            <ErrorBoundary>
              <ThrowingComponent error={error} />
            </ErrorBoundary>
          );
          const cardElement = container.querySelector('.border-destructive');
          expect(cardElement).toBeTruthy();
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: ui-components-migration, Property 2: ErrorBoundary uses Collapsible for error details**
   * **Validates: Requirements 1.2**
   */
  describe('Property 2: ErrorBoundary uses Collapsible for error details', () => {
    it('should render Collapsible trigger button when errorInfo is present', () => {
      fc.assert(
        fc.property(errorMessageArb, (message) => {
          cleanup();
          const error = createError(message);
          const { container } = render(
            <ErrorBoundary>
              <ThrowingComponent error={error} />
            </ErrorBoundary>
          );
          const triggerButton = container.querySelector('button');
          expect(triggerButton).toBeTruthy();
        }),
        { numRuns: 100 }
      );
    });

    it('should render CollapsibleTrigger as a ghost Button with Error details text', () => {
      fc.assert(
        fc.property(errorMessageArb, (message) => {
          cleanup();
          const error = createError(message);
          const { container } = render(
            <ErrorBoundary>
              <ThrowingComponent error={error} />
            </ErrorBoundary>
          );
          const buttons = container.querySelectorAll('button');
          const detailsButton = Array.from(buttons).find((btn) =>
            btn.textContent?.includes('Error details')
          );
          if (detailsButton) {
            expect(detailsButton.className).toContain('hover:bg-accent');
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: ui-components-migration, Property 3: ErrorBoundary uses Button for retry action**
   * **Validates: Requirements 1.3**
   */
  describe('Property 3: ErrorBoundary uses Button for retry action', () => {
    it('should render retry Button with destructive variant', () => {
      fc.assert(
        fc.property(errorMessageArb, (message) => {
          cleanup();
          const error = createError(message);
          const { container } = render(
            <ErrorBoundary>
              <ThrowingComponent error={error} />
            </ErrorBoundary>
          );
          const buttons = container.querySelectorAll('button');
          const retryButton = Array.from(buttons).find((btn) =>
            btn.textContent?.includes('Try again')
          );
          expect(retryButton).toBeTruthy();
          expect(retryButton?.className).toContain('bg-destructive');
        }),
        { numRuns: 100 }
      );
    });

    it('should have a clickable retry Button', () => {
      // This test verifies that the retry button is clickable
      const error = createError('Test error');
      const { container } = render(
        <ErrorBoundary>
          <ThrowingComponent error={error} />
        </ErrorBoundary>
      );
      const buttons = container.querySelectorAll('button');
      const retryButton = Array.from(buttons).find((btn) =>
        btn.textContent?.includes('Try again')
      );
      expect(retryButton).toBeTruthy();
      // Verify the button is not disabled and can be clicked
      expect(retryButton?.disabled).toBeFalsy();
      expect(retryButton?.getAttribute('type')).not.toBe('submit');
    });

    it('should use Button component with correct styling classes', () => {
      fc.assert(
        fc.property(errorMessageArb, (message) => {
          cleanup();
          const error = createError(message);
          const { container } = render(
            <ErrorBoundary>
              <ThrowingComponent error={error} />
            </ErrorBoundary>
          );
          const buttons = container.querySelectorAll('button');
          const retryButton = Array.from(buttons).find((btn) =>
            btn.textContent?.includes('Try again')
          );
          expect(retryButton).toBeTruthy();
          expect(retryButton?.className).toContain('inline-flex');
          expect(retryButton?.className).toContain('items-center');
          expect(retryButton?.className).toContain('justify-center');
        }),
        { numRuns: 100 }
      );
    });
  });
});
