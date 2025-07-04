import React, { useMemo } from 'react';
import { Divider, DividerProps } from '@chakra-ui/react';

/**
 * Separator orientations
 */
export type SeparatorOrientation = 'horizontal' | 'vertical';

/**
 * Separator variants
 */
export type SeparatorVariant = 'solid' | 'dashed' | 'dotted';

/**
 * Performance optimization options for separator
 */
export interface SeparatorPerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Enable animations */
  enableAnimations?: boolean;
}

/**
 * Extended Separator props with optimization features
 */
export interface SeparatorProps extends Omit<DividerProps, 'orientation' | 'variant'> {
  /** Separator orientation */
  orientation?: SeparatorOrientation;
  /** Separator variant */
  variant?: SeparatorVariant;
  /** Separator thickness */
  thickness?: string | number;
  /** Separator color */
  color?: string;
  /** Performance optimization settings */
  performance?: SeparatorPerformanceOptions;
  /** Custom test ID */
  testId?: string;
  /** Analytics tracking */
  analytics?: {
    category?: string;
    action?: string;
    label?: string;
  };
}

/**
 * Get separator styles based on variant and orientation
 */
const getSeparatorStyles = (
  variant: SeparatorVariant,
  orientation: SeparatorOrientation,
  thickness?: string | number,
  color?: string
) => {
  const baseStyles = {
    borderColor: color || 'gray.200',
    borderWidth: thickness || '1px',
  };

  const variantStyles = {
    solid: {
      borderStyle: 'solid',
    },
    dashed: {
      borderStyle: 'dashed',
    },
    dotted: {
      borderStyle: 'dotted',
    },
  };

  const orientationStyles = {
    horizontal: {
      borderTopWidth: thickness || '1px',
      borderLeftWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      width: '100%',
      height: 0,
    },
    vertical: {
      borderLeftWidth: thickness || '1px',
      borderTopWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      height: '100%',
      width: 0,
    },
  };

  return {
    ...baseStyles,
    ...variantStyles[variant],
    ...orientationStyles[orientation],
  };
};

/**
 * Optimized Separator Component
 */
const SeparatorComponent = React.forwardRef<HTMLHRElement, SeparatorProps>(
  (
    {
      orientation = 'horizontal',
      variant = 'solid',
      thickness,
      color,
      performance = { memoize: true, enableAnimations: true },
      testId,
      analytics,
      ...rest
    },
    ref
  ) => {
    // Track analytics on mount
    React.useEffect(() => {
      if (analytics && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', analytics.action || 'separator_render', {
          event_category: analytics.category || 'separator',
          event_label: analytics.label,
        });
      }
    }, [analytics]);

    // Memoized separator styles
    const separatorStyles = useMemo(() => {
      const styles = getSeparatorStyles(variant, orientation, thickness, color);
      
      if (performance.enableAnimations) {
        return {
          ...styles,
          transition: 'all 0.2s ease-in-out',
          _hover: {
            opacity: 0.8,
          },
        };
      }
      
      return styles;
    }, [variant, orientation, thickness, color, performance.enableAnimations]);

    // Memoized separator props
    const separatorProps = useMemo(() => ({
      orientation,
      'data-testid': testId,
      'data-orientation': orientation,
      'data-variant': variant,
      ...separatorStyles,
      ...rest,
    }), [orientation, testId, variant, separatorStyles, rest]);

    return (
      <Divider ref={ref} {...separatorProps} />
    );
  }
);

SeparatorComponent.displayName = 'OptimizedSeparator';

/**
 * Memoized OptimizedSeparator export
 */
export const OptimizedSeparator = React.memo(SeparatorComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof SeparatorProps)[] = [
    'orientation', 'variant', 'thickness', 'color'
  ];
  
  return keysToCompare.every(key => prevProps[key] === nextProps[key]);
});

// Default export
export default OptimizedSeparator;