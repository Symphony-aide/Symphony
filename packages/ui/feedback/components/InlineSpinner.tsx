/**
 * InlineSpinner - Subtle inline loading indicator
 *
 * Displays a small spinner within the component that triggered the operation.
 * Used for operations taking 200-500ms (inline escalation level).
 *
 * @module feedback/components/InlineSpinner
 *
 * **Validates: Requirements 1.3, 7.1, 7.3**
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@symphony/shared';
import type { FeedbackTheme, FeedbackColorVariant, FeedbackSizeVariant } from '../types';
import { useFeedbackTheme, mergeThemes, getSpinnerAnimationClass } from '../FeedbackThemeContext';

const inlineSpinnerVariants = cva(
  'inline-flex items-center justify-center rounded-full border-2 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]',
  {
    variants: {
      size: {
        xs: 'h-3 w-3 border',
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
        xl: 'h-8 w-8 border-[3px]',
      },
      color: {
        default: 'text-foreground/70',
        primary: 'text-primary',
        secondary: 'text-secondary',
        muted: 'text-muted-foreground',
        destructive: 'text-destructive',
        success: 'text-green-500',
        warning: 'text-yellow-500',
      },
    },
    defaultVariants: {
      size: 'sm',
      color: 'default',
    },
  }
);

export interface InlineSpinnerProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'color'>,
    VariantProps<typeof inlineSpinnerVariants> {
  /** Optional label for accessibility */
  label?: string;
  /** Theme configuration for customization */
  theme?: Partial<FeedbackTheme>;
}

/**
 * InlineSpinner component for subtle inline loading feedback.
 *
 * Designed to be placed inline with text or within buttons/icons
 * without disrupting the layout. Supports theme customization.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <InlineSpinner />
 *
 * // With size variant
 * <InlineSpinner size="xs" />
 *
 * // Inside a button
 * <Button>
 *   <InlineSpinner size="xs" className="mr-2" />
 *   Loading...
 * </Button>
 *
 * // With theme customization
 * <InlineSpinner
 *   theme={{ color: 'primary', animationSpeed: 'fast' }}
 * />
 * ```
 */
const InlineSpinner = React.forwardRef<HTMLSpanElement, InlineSpinnerProps>(
  ({ className, size, color, label = 'Loading', theme: componentTheme, ...props }, ref) => {
    const { theme: globalTheme } = useFeedbackTheme();
    const mergedTheme = mergeThemes(globalTheme, componentTheme);

    // Use theme values if not explicitly provided via props
    const effectiveSize = size ?? (mergedTheme.size as FeedbackSizeVariant | undefined);
    const effectiveColor = color ?? (mergedTheme.color as FeedbackColorVariant | undefined);

    // Get animation class based on theme
    const animationClass = getSpinnerAnimationClass(mergedTheme);

    return (
      <span
        ref={ref}
        role="status"
        aria-label={label}
        className={cn(
          inlineSpinnerVariants({ size: effectiveSize, color: effectiveColor }),
          animationClass || 'animate-spin',
          mergedTheme.customClass,
          className
        )}
        {...props}
      />
    );
  }
);
InlineSpinner.displayName = 'InlineSpinner';

export { InlineSpinner, inlineSpinnerVariants };
