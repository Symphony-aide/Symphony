/**
 * OverlaySpinner - Semi-transparent overlay with spinner
 *
 * Displays a semi-transparent overlay with a spinner over the component
 * that triggered the operation. Used for operations taking 500ms-2s
 * (overlay escalation level).
 *
 * @module feedback/components/OverlaySpinner
 *
 * **Validates: Requirements 1.4, 7.1, 7.3, 8.1**
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@symphony/shared';
import type { ProgressState, FeedbackTheme, FeedbackColorVariant, FeedbackSizeVariant } from '../types';
import { useFeedbackTheme, mergeThemes, getSpinnerAnimationClass, getAnimationClass } from '../FeedbackThemeContext';

const overlayVariants = cva(
  'absolute inset-0 flex flex-col items-center justify-center backdrop-blur-[1px] transition-opacity',
  {
    variants: {
      visible: {
        true: 'opacity-100',
        false: 'opacity-0 pointer-events-none',
      },
    },
    defaultVariants: {
      visible: true,
    },
  }
);

const spinnerVariants = cva(
  'rounded-full border-2 border-solid border-current border-r-transparent',
  {
    variants: {
      size: {
        xs: 'h-4 w-4',
        sm: 'h-6 w-6',
        md: 'h-8 w-8',
        lg: 'h-10 w-10',
        xl: 'h-12 w-12 border-[3px]',
      },
      color: {
        default: 'text-foreground',
        primary: 'text-primary',
        secondary: 'text-secondary',
        muted: 'text-muted-foreground',
        destructive: 'text-destructive',
        success: 'text-green-500',
        warning: 'text-yellow-500',
      },
    },
    defaultVariants: {
      size: 'md',
      color: 'primary',
    },
  }
);

export interface OverlaySpinnerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    VariantProps<typeof spinnerVariants> {
  /** Whether the overlay is visible */
  visible?: boolean;
  /** Optional progress message to display */
  message?: string;
  /** Progress state for displaying progress info */
  progress?: ProgressState;
  /** Theme configuration for customization */
  theme?: Partial<FeedbackTheme>;
}

/**
 * OverlaySpinner component for overlay loading feedback.
 *
 * Renders a semi-transparent overlay with a centered spinner.
 * The parent element should have `position: relative` for proper positioning.
 * Supports theme customization for colors, sizes, and animations.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <div className="relative">
 *   <Content />
 *   <OverlaySpinner visible={isLoading} />
 * </div>
 *
 * // With message
 * <div className="relative">
 *   <Content />
 *   <OverlaySpinner
 *     visible={isLoading}
 *     message="Loading data..."
 *   />
 * </div>
 *
 * // With theme customization
 * <div className="relative">
 *   <Content />
 *   <OverlaySpinner
 *     visible={isLoading}
 *     theme={{
 *       color: 'secondary',
 *       size: 'lg',
 *       overlayOpacity: 80,
 *       animationSpeed: 'fast',
 *     }}
 *   />
 * </div>
 * ```
 */
const OverlaySpinner = React.forwardRef<HTMLDivElement, OverlaySpinnerProps>(
  (
    {
      className,
      visible = true,
      message,
      progress,
      size,
      color,
      theme: componentTheme,
      ...props
    },
    ref
  ) => {
    const { theme: globalTheme } = useFeedbackTheme();
    const mergedTheme = mergeThemes(globalTheme, componentTheme);

    // Use theme values if not explicitly provided via props
    const effectiveSize = size ?? (mergedTheme.size as FeedbackSizeVariant | undefined);
    const effectiveColor = color ?? (mergedTheme.color as FeedbackColorVariant | undefined);

    // Get animation classes based on theme
    const spinnerAnimationClass = getSpinnerAnimationClass(mergedTheme);
    const transitionClass = getAnimationClass(mergedTheme.animationSpeed, mergedTheme.reducedMotion);

    // Calculate overlay opacity
    const overlayOpacity = mergedTheme.overlayOpacity ?? 60;
    const overlayBgClass = `bg-background/${overlayOpacity}`;

    // Determine the message to display
    const displayMessage = progress?.message ?? message;

    // Determine if we should show percentage
    const showPercentage =
      progress?.type === 'determinate' && progress.value !== undefined;

    return (
      <div
        ref={ref}
        role="status"
        aria-label={displayMessage ?? 'Loading'}
        aria-busy={visible}
        className={cn(
          overlayVariants({ visible }),
          overlayBgClass,
          transitionClass,
          mergedTheme.customClass,
          className
        )}
        {...props}
      >
        <div
          className={cn(
            spinnerVariants({ size: effectiveSize, color: effectiveColor }),
            spinnerAnimationClass || 'animate-spin'
          )}
        />
        {(displayMessage || showPercentage) && (
          <div className="mt-3 text-center">
            {showPercentage && (
              <div className="text-sm font-medium text-foreground">
                {Math.round(progress!.value!)}%
              </div>
            )}
            {displayMessage && (
              <div className="text-sm text-muted-foreground">
                {displayMessage}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);
OverlaySpinner.displayName = 'OverlaySpinner';

export { OverlaySpinner, overlayVariants, spinnerVariants };
