/**
 * ErrorFeedback - Error display component with dismiss and retry functionality
 *
 * Displays error feedback in the same context as loading feedback was displayed.
 * Provides dismissible error message and retry mechanism for failed operations.
 *
 * @module feedback/components/ErrorFeedback
 *
 * **Validates: Requirements 6.1, 6.2, 6.3, 7.3**
 */

import * as React from 'react';
import { cn } from '@symphony/shared';
import type { FeedbackTheme } from '../types';
import { useFeedbackTheme, mergeThemes, getBorderRadiusClass, getAnimationClass } from '../FeedbackThemeContext';

export interface ErrorFeedbackProps {
	/** Error to display */
	error: Error;
	/** Callback when dismiss button is clicked */
	onDismiss?: () => void;
	/** Callback when retry button is clicked */
	onRetry?: () => void;
	/** Whether retry is available */
	canRetry?: boolean;
	/** Additional class name */
	className?: string;
	/** Variant for display style */
	variant?: 'inline' | 'overlay' | 'modal';
	/** Title for the error (optional) */
	title?: string;
	/** Theme configuration for customization */
	theme?: Partial<FeedbackTheme>;
}

/**
 * ErrorFeedback component for displaying operation errors.
 *
 * Displays error feedback with:
 * - Error message display
 * - Dismiss button to clear the error
 * - Retry button to re-execute the failed operation
 *
 * The component appears in the same location as loading feedback,
 * maintaining context for the user. Supports theme customization.
 *
 * @example
 * ```tsx
 * // Inline error
 * <ErrorFeedback
 *   error={new Error('Failed to load data')}
 *   onDismiss={handleDismiss}
 *   onRetry={handleRetry}
 *   variant="inline"
 * />
 *
 * // Modal error with theme
 * <ErrorFeedback
 *   error={new Error('Network timeout')}
 *   onDismiss={handleDismiss}
 *   onRetry={handleRetry}
 *   variant="modal"
 *   title="Operation Failed"
 *   theme={{ borderRadius: 'lg', animationSpeed: 'fast' }}
 * />
 * ```
 */
const ErrorFeedback = React.forwardRef<HTMLDivElement, ErrorFeedbackProps>(
	(
		{
			error,
			onDismiss,
			onRetry,
			canRetry = true,
			className,
			variant = 'inline',
			title = 'Error',
			theme: componentTheme,
		},
		ref
	) => {
		const { theme: globalTheme } = useFeedbackTheme();
		const mergedTheme = mergeThemes(globalTheme, componentTheme);

		const isTimeout = error.message.toLowerCase().includes('timeout');
		const displayTitle = isTimeout ? 'Operation Timed Out' : title;

		// Get theme-based classes
		const borderRadiusClass = getBorderRadiusClass(mergedTheme.borderRadius);
		const transitionClass = getAnimationClass(mergedTheme.animationSpeed, mergedTheme.reducedMotion);

		if (variant === 'inline') {
			return (
				<div
					ref={ref}
					className={cn(
						'inline-flex items-center gap-2 text-sm text-destructive',
						mergedTheme.customClass,
						className
					)}
					role="alert"
					aria-live="polite"
				>
					<ErrorIcon className="h-4 w-4 flex-shrink-0" />
					<span className="truncate max-w-[200px]" title={error.message}>
						{error.message}
					</span>
					{canRetry && onRetry && (
						<button
							type="button"
							onClick={onRetry}
							className={cn(
								'text-xs underline hover:no-underline focus:outline-none focus:ring-1 focus:ring-ring',
								borderRadiusClass
							)}
							aria-label="Retry operation"
						>
							Retry
						</button>
					)}
					{onDismiss && (
						<button
							type="button"
							onClick={onDismiss}
							className={cn(
								'text-muted-foreground hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring',
								borderRadiusClass
							)}
							aria-label="Dismiss error"
						>
							<DismissIcon className="h-3 w-3" />
						</button>
					)}
				</div>
			);
		}

		if (variant === 'overlay') {
			// Calculate overlay opacity
			const overlayOpacity = mergedTheme.overlayOpacity ?? 80;
			const overlayBgClass = `bg-background/${overlayOpacity}`;

			return (
				<div
					ref={ref}
					className={cn(
						'absolute inset-0 flex items-center justify-center',
						overlayBgClass,
						'backdrop-blur-sm',
						transitionClass,
						mergedTheme.customClass,
						className
					)}
					role="alert"
					aria-live="polite"
				>
					<div className="flex flex-col items-center gap-3 p-4 max-w-xs text-center">
						<ErrorIcon className="h-8 w-8 text-destructive" />
						<div className="space-y-1">
							<p className="font-medium text-sm">{displayTitle}</p>
							<p className="text-xs text-muted-foreground">{error.message}</p>
						</div>
						<div className="flex gap-2">
							{canRetry && onRetry && (
								<button
									type="button"
									onClick={onRetry}
									className={cn(
										'inline-flex items-center justify-center text-xs font-medium',
										'h-7 px-3',
										'bg-primary text-primary-foreground shadow',
										'hover:bg-primary/90',
										'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
										'transition-colors',
										borderRadiusClass
									)}
								>
									Retry
								</button>
							)}
							{onDismiss && (
								<button
									type="button"
									onClick={onDismiss}
									className={cn(
										'inline-flex items-center justify-center text-xs font-medium',
										'h-7 px-3',
										'border border-input bg-background shadow-sm',
										'hover:bg-accent hover:text-accent-foreground',
										'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
										'transition-colors',
										borderRadiusClass
									)}
								>
									Dismiss
								</button>
							)}
						</div>
					</div>
				</div>
			);
		}

		// Modal variant
		return (
			<div
				ref={ref}
				className={cn(
					'fixed inset-0 z-50 flex items-center justify-center',
					'bg-black/80',
					transitionClass,
					className
				)}
				role="alertdialog"
				aria-modal="true"
				aria-labelledby="error-title"
				aria-describedby="error-description"
			>
				<div
					className={cn(
						'w-full max-w-md border bg-background p-6 shadow-lg',
						borderRadiusClass,
						'animate-in fade-in-0 zoom-in-95',
						mergedTheme.customClass
					)}
				>
					<div className="flex flex-col items-center gap-4 text-center">
						<div className={cn('bg-destructive/10 p-3', borderRadiusClass === 'rounded-full' ? 'rounded-full' : borderRadiusClass)}>
							<ErrorIcon className="h-6 w-6 text-destructive" />
						</div>
						<div className="space-y-2">
							<h2
								id="error-title"
								className="text-lg font-semibold leading-none tracking-tight"
							>
								{displayTitle}
							</h2>
							<p
								id="error-description"
								className="text-sm text-muted-foreground"
							>
								{error.message}
							</p>
						</div>
						<div className="flex gap-3 pt-2">
							{canRetry && onRetry && (
								<button
									type="button"
									onClick={onRetry}
									className={cn(
										'inline-flex items-center justify-center text-sm font-medium',
										'h-9 px-4 py-2',
										'bg-primary text-primary-foreground shadow',
										'hover:bg-primary/90',
										'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
										'transition-colors',
										borderRadiusClass
									)}
								>
									Try Again
								</button>
							)}
							{onDismiss && (
								<button
									type="button"
									onClick={onDismiss}
									className={cn(
										'inline-flex items-center justify-center text-sm font-medium',
										'h-9 px-4 py-2',
										'border border-input bg-background shadow-sm',
										'hover:bg-accent hover:text-accent-foreground',
										'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
										'transition-colors',
										borderRadiusClass
									)}
								>
									Dismiss
								</button>
							)}
						</div>
					</div>
				</div>
			</div>
		);
	}
);
ErrorFeedback.displayName = 'ErrorFeedback';

/**
 * Simple error icon component
 */
const ErrorIcon: React.FC<{ className?: string }> = ({ className }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className={className}
		aria-hidden="true"
	>
		<circle cx="12" cy="12" r="10" />
		<line x1="12" y1="8" x2="12" y2="12" />
		<line x1="12" y1="16" x2="12.01" y2="16" />
	</svg>
);

/**
 * Simple dismiss/close icon component
 */
const DismissIcon: React.FC<{ className?: string }> = ({ className }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className={className}
		aria-hidden="true"
	>
		<line x1="18" y1="6" x2="6" y2="18" />
		<line x1="6" y1="6" x2="18" y2="18" />
	</svg>
);

export { ErrorFeedback };
