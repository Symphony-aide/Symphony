/**
 * ModalProgress - Modal dialog with progress bar and cancel button
 *
 * Displays a modal dialog with progress information and cancellation option.
 * Used for operations taking longer than 2 seconds (modal escalation level).
 *
 * @module feedback/components/ModalProgress
 *
 * **Validates: Requirements 1.5, 4.1, 7.1, 7.3**
 */

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@symphony/shared';
import type { ProgressState, FeedbackTheme, FeedbackColorVariant } from '../types';
import { useFeedbackTheme, mergeThemes, getSpinnerAnimationClass, getBorderRadiusClass, getAnimationClass } from '../FeedbackThemeContext';

export interface ModalProgressProps {
  /** Whether the modal is open */
  open: boolean;
  /** Title of the modal */
  title?: string;
  /** Progress state */
  progress: ProgressState;
  /** Callback when cancel button is clicked */
  onCancel: () => void;
  /** Whether cancellation is allowed */
  canCancel?: boolean;
  /** Additional class name for the modal */
  className?: string;
  /** Theme configuration for customization */
  theme?: Partial<FeedbackTheme>;
}

/**
 * Color class mapping for progress bar
 */
const progressBarColorClasses: Record<FeedbackColorVariant, string> = {
  default: 'bg-foreground',
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  muted: 'bg-muted-foreground',
  destructive: 'bg-destructive',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
};

/**
 * Color class mapping for progress bar background
 */
const progressBarBgClasses: Record<FeedbackColorVariant, string> = {
  default: 'bg-foreground/20',
  primary: 'bg-primary/20',
  secondary: 'bg-secondary/20',
  muted: 'bg-muted-foreground/20',
  destructive: 'bg-destructive/20',
  success: 'bg-green-500/20',
  warning: 'bg-yellow-500/20',
};

/**
 * Spinner color class mapping
 */
const spinnerColorClasses: Record<FeedbackColorVariant, string> = {
  default: 'border-foreground',
  primary: 'border-primary',
  secondary: 'border-secondary',
  muted: 'border-muted-foreground',
  destructive: 'border-destructive',
  success: 'border-green-500',
  warning: 'border-yellow-500',
};

/**
 * ModalProgress component for modal loading feedback.
 *
 * Displays a modal dialog with:
 * - Title (optional)
 * - Progress bar (determinate) or spinner (indeterminate)
 * - Percentage display (for determinate progress)
 * - Status message (optional)
 * - Cancel button (when canCancel is true)
 *
 * Supports theme customization for colors, sizes, and animations.
 *
 * @example
 * ```tsx
 * // Indeterminate progress
 * <ModalProgress
 *   open={isLoading}
 *   title="Processing"
 *   progress={{ type: 'indeterminate', message: 'Please wait...' }}
 *   onCancel={handleCancel}
 *   canCancel={true}
 * />
 *
 * // Determinate progress with theme
 * <ModalProgress
 *   open={isLoading}
 *   title="Uploading Files"
 *   progress={{
 *     type: 'determinate',
 *     value: 65,
 *     message: 'Uploading file 3 of 5...'
 *   }}
 *   onCancel={handleCancel}
 *   canCancel={true}
 *   theme={{
 *     color: 'success',
 *     progressBarHeight: 12,
 *     borderRadius: 'lg',
 *   }}
 * />
 * ```
 */
const ModalProgress = React.forwardRef<HTMLDivElement, ModalProgressProps>(
  (
    {
      open,
      title = 'Operation in Progress',
      progress,
      onCancel,
      canCancel = true,
      className,
      theme: componentTheme,
    },
    ref
  ) => {
    const { theme: globalTheme } = useFeedbackTheme();
    const mergedTheme = mergeThemes(globalTheme, componentTheme);

    const isDeterminate = progress.type === 'determinate';
    const progressValue = progress.value ?? 0;

    // Get theme-based classes
    const effectiveColor = mergedTheme.color ?? 'primary';
    const progressBarColor = progressBarColorClasses[effectiveColor];
    const progressBarBg = progressBarBgClasses[effectiveColor];
    const spinnerColor = spinnerColorClasses[effectiveColor];
    const borderRadiusClass = getBorderRadiusClass(mergedTheme.borderRadius);
    const spinnerAnimationClass = getSpinnerAnimationClass(mergedTheme);
    const transitionClass = getAnimationClass(mergedTheme.animationSpeed, mergedTheme.reducedMotion);

    // Progress bar height
    const progressBarHeight = mergedTheme.progressBarHeight ?? 8;

    return (
      <DialogPrimitive.Root open={open}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay
            className={cn(
              'fixed inset-0 z-50 bg-black/80',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              transitionClass
            )}
          />
          <DialogPrimitive.Content
            ref={ref}
            className={cn(
              'fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] border bg-background p-6 shadow-lg',
              borderRadiusClass,
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
              'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
              'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
              transitionClass,
              mergedTheme.customClass,
              className
            )}
            onEscapeKeyDown={(e) => {
              if (!canCancel) {
                e.preventDefault();
              }
            }}
            onPointerDownOutside={(e) => {
              // Prevent closing by clicking outside
              e.preventDefault();
            }}
          >
            {/* Title */}
            <DialogPrimitive.Title className="text-lg font-semibold leading-none tracking-tight mb-4">
              {title}
            </DialogPrimitive.Title>

            {/* Progress Section */}
            <div className="space-y-4">
              {/* Progress Bar or Spinner */}
              {isDeterminate ? (
                <div className="space-y-2">
                  {/* Progress Bar */}
                  <div
                    className={cn(
                      'relative w-full overflow-hidden rounded-full',
                      progressBarBg
                    )}
                    style={{ height: `${progressBarHeight}px` }}
                  >
                    <div
                      className={cn(
                        'h-full transition-all duration-300 ease-out',
                        progressBarColor
                      )}
                      style={{ width: `${progressValue}%` }}
                    />
                  </div>
                  {/* Percentage */}
                  <div className="text-right text-sm font-medium text-foreground">
                    {Math.round(progressValue)}%
                  </div>
                </div>
              ) : (
                <div className="flex justify-center py-2">
                  <div
                    className={cn(
                      'h-8 w-8 rounded-full border-2 border-solid border-r-transparent',
                      spinnerColor,
                      spinnerAnimationClass || 'animate-spin'
                    )}
                    role="status"
                    aria-label="Loading"
                  />
                </div>
              )}

              {/* Status Message */}
              {progress.message && (
                <DialogPrimitive.Description className="text-sm text-muted-foreground text-center">
                  {progress.message}
                </DialogPrimitive.Description>
              )}

              {/* Cancel Button */}
              {canCancel && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={onCancel}
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
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    );
  }
);
ModalProgress.displayName = 'ModalProgress';

export { ModalProgress };
