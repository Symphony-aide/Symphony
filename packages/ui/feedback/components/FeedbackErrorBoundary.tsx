/**
 * FeedbackErrorBoundary - Error boundary for graceful degradation
 *
 * Catches errors in the feedback system and falls back to simple loading states.
 * Logs errors for debugging while keeping the application functional.
 *
 * @module feedback/components/FeedbackErrorBoundary
 *
 * **Validates: Requirements 6.5, 7.3**
 */

import * as React from 'react';
import { cn } from '@symphony/shared';
import type { FeedbackTheme } from '../types';

export interface FeedbackErrorBoundaryProps {
	/** Children to render */
	children: React.ReactNode;
	/** Fallback content to show when an error occurs */
	fallback?: React.ReactNode;
	/** Callback when an error is caught */
	onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
	/** Additional class name */
	className?: string;
	/** Theme configuration for customization */
	theme?: Partial<FeedbackTheme>;
}

interface FeedbackErrorBoundaryState {
	hasError: boolean;
	error?: Error;
}

/**
 * Simple fallback spinner for graceful degradation.
 * Used when the feedback system encounters an error.
 */
const SimpleFallbackSpinner: React.FC<{ className?: string }> = ({ className }) => (
	<div
		className={cn('inline-flex items-center justify-center', className)}
		role="status"
		aria-label="Loading"
	>
		<div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
	</div>
);

/**
 * FeedbackErrorBoundary component for graceful degradation.
 *
 * Catches errors in the feedback system and:
 * - Falls back to a simple loading state
 * - Logs errors for debugging
 * - Keeps the application functional
 *
 * @example
 * ```tsx
 * <FeedbackErrorBoundary
 *   onError={(error) => console.error('Feedback error:', error)}
 *   fallback={<SimpleSpinner />}
 * >
 *   <OperationFeedback operationId="my-op">
 *     <MyComponent />
 *   </OperationFeedback>
 * </FeedbackErrorBoundary>
 * ```
 */
export class FeedbackErrorBoundary extends React.Component<
	FeedbackErrorBoundaryProps,
	FeedbackErrorBoundaryState
> {
	constructor(props: FeedbackErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): FeedbackErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
		// Log error for debugging
		logFeedbackError(error, errorInfo);

		// Call optional error callback
		this.props.onError?.(error, errorInfo);
	}

	render(): React.ReactNode {
		if (this.state.hasError) {
			// Render fallback or simple spinner
			return this.props.fallback ?? (
				<SimpleFallbackSpinner className={this.props.className} />
			);
		}

		return this.props.children;
	}
}

/**
 * Log feedback system errors for debugging.
 *
 * @param error - The error that occurred
 * @param errorInfo - React error info with component stack
 */
export function logFeedbackError(error: Error, errorInfo?: React.ErrorInfo): void {
	// Log to console (always log errors for debugging)
	console.error('[FeedbackSystem] Error caught:', error);
	if (errorInfo?.componentStack) {
		console.error('[FeedbackSystem] Component stack:', errorInfo.componentStack);
	}

	// Store error for potential reporting
	try {
		const errorLog = {
			timestamp: new Date().toISOString(),
			message: error.message,
			stack: error.stack,
			componentStack: errorInfo?.componentStack,
			type: 'feedback-system-error',
		};

		// Store in session storage for debugging (limited to last 10 errors)
		const existingLogs = JSON.parse(
			sessionStorage.getItem('feedback-error-logs') ?? '[]'
		) as unknown[];
		existingLogs.push(errorLog);
		if (existingLogs.length > 10) {
			existingLogs.shift();
		}
		sessionStorage.setItem('feedback-error-logs', JSON.stringify(existingLogs));
	} catch {
		// Silently fail if storage is not available
	}
}

/**
 * Get stored feedback error logs for debugging.
 *
 * @returns Array of error logs
 */
export function getFeedbackErrorLogs(): unknown[] {
	try {
		return JSON.parse(sessionStorage.getItem('feedback-error-logs') ?? '[]') as unknown[];
	} catch {
		return [];
	}
}

/**
 * Clear stored feedback error logs.
 */
export function clearFeedbackErrorLogs(): void {
	try {
		sessionStorage.removeItem('feedback-error-logs');
	} catch {
		// Silently fail if storage is not available
	}
}

/**
 * Higher-order component for wrapping components with feedback error boundary.
 *
 * @param Component - Component to wrap
 * @param fallback - Optional fallback content
 * @returns Wrapped component with error boundary
 */
export function withFeedbackErrorBoundary<P extends object>(
	Component: React.ComponentType<P>,
	fallback?: React.ReactNode
): React.FC<P> {
	const WrappedComponent: React.FC<P> = (props) => (
		<FeedbackErrorBoundary fallback={fallback}>
			<Component {...props} />
		</FeedbackErrorBoundary>
	);

	WrappedComponent.displayName = `withFeedbackErrorBoundary(${
		Component.displayName ?? Component.name ?? 'Component'
	})`;

	return WrappedComponent;
}

export { SimpleFallbackSpinner };
