/**
 * @fileoverview Property-based tests for graceful degradation
 *
 * Tests that the feedback system continues functioning with fallback
 * loading states when errors occur.
 *
 * @module feedback/tests/gracefulDegradation.property
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import * as React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import {
	FeedbackErrorBoundary,
	SimpleFallbackSpinner,
	logFeedbackError,
	getFeedbackErrorLogs,
	clearFeedbackErrorLogs,
	withFeedbackErrorBoundary,
} from '../../feedback/components/FeedbackErrorBoundary';

/**
 * Generate error messages
 */
const errorMessageArb = fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0);

/**
 * Component that throws an error
 */
const ThrowingComponent: React.FC<{ error: Error }> = ({ error }) => {
	throw error;
};

/**
 * Component that renders normally
 */
const NormalComponent: React.FC<{ text: string }> = ({ text }) => (
	<div data-testid="normal-content">{text}</div>
);

describe('Property 13: Graceful degradation', () => {
	beforeEach(() => {
		// Clear error logs before each test
		clearFeedbackErrorLogs();
		// Suppress console.error for cleaner test output
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		cleanup();
		vi.restoreAllMocks();
	});

	/**
	 * **Feature: progressive-feedback-system, Property 13: Graceful degradation**
	 *
	 * For any error in the feedback system itself, the application should
	 * continue functioning with fallback loading states.
	 *
	 * **Validates: Requirements 6.5**
	 */
	it('should render fallback when child component throws error', () => {
		fc.assert(
			fc.property(
				errorMessageArb,
				(errorMsg) => {
					cleanup(); // Clean up before each iteration
					const error = new Error(errorMsg);

					const { container } = render(
						<FeedbackErrorBoundary>
							<ThrowingComponent error={error} />
						</FeedbackErrorBoundary>
					);

					// Should render fallback spinner instead of crashing
					const spinner = container.querySelector('[role="status"]');
					expect(spinner).toBeTruthy();
				}
			),
			{ numRuns: 50 }
		);
	});

	/**
	 * Should render custom fallback when provided.
	 */
	it('should render custom fallback when provided', () => {
		fc.assert(
			fc.property(
				errorMessageArb,
				fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
				(errorMsg, fallbackText) => {
					cleanup(); // Clean up before each iteration
					const error = new Error(errorMsg);
					const customFallback = <div data-testid="custom-fallback">{fallbackText}</div>;

					render(
						<FeedbackErrorBoundary fallback={customFallback}>
							<ThrowingComponent error={error} />
						</FeedbackErrorBoundary>
					);

					// Should render custom fallback
					const fallback = screen.getByTestId('custom-fallback');
					expect(fallback).toBeTruthy();
					expect(fallback.textContent).toBe(fallbackText);
				}
			),
			{ numRuns: 50 }
		);
	});

	/**
	 * Should call onError callback when error occurs.
	 */
	it('should call onError callback when error occurs', () => {
		fc.assert(
			fc.property(
				errorMessageArb,
				(errorMsg) => {
					cleanup(); // Clean up before each iteration
					const error = new Error(errorMsg);
					let capturedErrorMessage: string | null = null;

					render(
						<FeedbackErrorBoundary
							onError={(err) => {
								capturedErrorMessage = err.message;
							}}
						>
							<ThrowingComponent error={error} />
						</FeedbackErrorBoundary>
					);

					// onError should have been called with the error
					expect(capturedErrorMessage).toBe(errorMsg);
				}
			),
			{ numRuns: 50 }
		);
	});

	/**
	 * Should render children normally when no error occurs.
	 */
	it('should render children normally when no error occurs', () => {
		fc.assert(
			fc.property(
				fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
				(text) => {
					cleanup(); // Clean up before each iteration
					render(
						<FeedbackErrorBoundary>
							<NormalComponent text={text} />
						</FeedbackErrorBoundary>
					);

					// Should render normal content
					const content = screen.getByTestId('normal-content');
					expect(content).toBeTruthy();
					expect(content.textContent).toBe(text);
				}
			),
			{ numRuns: 50 }
		);
	});

	/**
	 * SimpleFallbackSpinner should render with loading role.
	 */
	it('should render SimpleFallbackSpinner with correct accessibility attributes', () => {
		const { container } = render(<SimpleFallbackSpinner />);

		const spinner = container.querySelector('[role="status"]');
		expect(spinner).toBeTruthy();
		expect(spinner?.getAttribute('aria-label')).toBe('Loading');
	});

	/**
	 * withFeedbackErrorBoundary HOC should wrap component with error boundary.
	 */
	it('should wrap component with error boundary using HOC', () => {
		fc.assert(
			fc.property(
				errorMessageArb,
				(errorMsg) => {
					cleanup(); // Clean up before each iteration
					const error = new Error(errorMsg);
					const WrappedThrowing = withFeedbackErrorBoundary(ThrowingComponent);

					const { container } = render(<WrappedThrowing error={error} />);

					// Should render fallback instead of crashing
					const spinner = container.querySelector('[role="status"]');
					expect(spinner).toBeTruthy();
				}
			),
			{ numRuns: 50 }
		);
	});

	/**
	 * withFeedbackErrorBoundary HOC should allow custom fallback.
	 */
	it('should allow custom fallback in HOC', () => {
		fc.assert(
			fc.property(
				errorMessageArb,
				fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
				(errorMsg, fallbackText) => {
					cleanup(); // Clean up before each iteration
					const error = new Error(errorMsg);
					const customFallback = <div data-testid="hoc-fallback">{fallbackText}</div>;
					const WrappedThrowing = withFeedbackErrorBoundary(
						ThrowingComponent,
						customFallback
					);

					render(<WrappedThrowing error={error} />);

					// Should render custom fallback
					const fallback = screen.getByTestId('hoc-fallback');
					expect(fallback).toBeTruthy();
					expect(fallback.textContent).toBe(fallbackText);
				}
			),
			{ numRuns: 50 }
		);
	});
});

describe('Error logging for graceful degradation', () => {
	beforeEach(() => {
		clearFeedbackErrorLogs();
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	/**
	 * logFeedbackError should store errors for debugging.
	 */
	it('should store errors in session storage', () => {
		fc.assert(
			fc.property(
				errorMessageArb,
				(errorMsg) => {
					clearFeedbackErrorLogs();
					const error = new Error(errorMsg);

					logFeedbackError(error);

					const logs = getFeedbackErrorLogs();
					expect(logs.length).toBeGreaterThan(0);

					const lastLog = logs[logs.length - 1] as Record<string, unknown>;
					expect(lastLog.message).toBe(errorMsg);
				}
			),
			{ numRuns: 20 }
		);
	});

	/**
	 * Error logs should be limited to 10 entries.
	 */
	it('should limit error logs to 10 entries', () => {
		// Log 15 errors
		for (let i = 0; i < 15; i++) {
			logFeedbackError(new Error(`Error ${i}`));
		}

		const logs = getFeedbackErrorLogs();
		expect(logs.length).toBeLessThanOrEqual(10);
	});

	/**
	 * clearFeedbackErrorLogs should clear all logs.
	 */
	it('should clear all error logs', () => {
		logFeedbackError(new Error('Test error'));
		expect(getFeedbackErrorLogs().length).toBeGreaterThan(0);

		clearFeedbackErrorLogs();
		expect(getFeedbackErrorLogs().length).toBe(0);
	});

	/**
	 * Error logs should include timestamp.
	 */
	it('should include timestamp in error logs', () => {
		fc.assert(
			fc.property(
				errorMessageArb,
				(errorMsg) => {
					clearFeedbackErrorLogs();
					const error = new Error(errorMsg);

					logFeedbackError(error);

					const logs = getFeedbackErrorLogs();
					const lastLog = logs[logs.length - 1] as { timestamp: string };
					expect(lastLog.timestamp).toBeDefined();
					// Should be a valid ISO date string
					expect(() => new Date(lastLog.timestamp)).not.toThrow();
				}
			),
			{ numRuns: 20 }
		);
	});

	/**
	 * Error logs should include error type.
	 */
	it('should include error type in logs', () => {
		fc.assert(
			fc.property(
				errorMessageArb,
				(errorMsg) => {
					clearFeedbackErrorLogs();
					const error = new Error(errorMsg);

					logFeedbackError(error);

					const logs = getFeedbackErrorLogs();
					const lastLog = logs[logs.length - 1] as { type: string };
					expect(lastLog.type).toBe('feedback-system-error');
				}
			),
			{ numRuns: 20 }
		);
	});
});
