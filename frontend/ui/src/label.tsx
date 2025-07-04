import React, { useMemo } from 'react';
import { FormLabel, FormLabelProps } from '@chakra-ui/react';

/**
 * Label variants
 */
export type LabelVariant = 'default' | 'required' | 'optional' | 'disabled';

/**
 * Label sizes
 */
export type LabelSize = 'xs' | 'sm' | 'md' | 'lg';

/**
 * Performance optimization options for label
 */
export interface LabelPerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Enable animations */
  enableAnimations?: boolean;
}

/**
 * Extended Label props with optimization features
 */
export interface LabelProps extends Omit<FormLabelProps, 'size'> {
  /** Label variant */
  variant?: LabelVariant;
  /** Label size */
  size?: LabelSize;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the field is optional */
  optional?: boolean;
  /** Performance optimization settings */
  performance?: LabelPerformanceOptions;
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
 * Get label styles based on variant and size
 */
const getLabelStyles = (variant: LabelVariant, size: LabelSize) => {
  const sizeStyles = {
    xs: { fontSize: 'xs', lineHeight: 'shorter' },
    sm: { fontSize: 'sm', lineHeight: 'short' },
    md: { fontSize: 'md', lineHeight: 'base' },
    lg: { fontSize: 'lg', lineHeight: 'tall' },
  };

  const variantStyles = {
    default: {
      color: 'gray.700',
      fontWeight: 'medium',
    },
    required: {
      color: 'gray.700',
      fontWeight: 'medium',
      _after: {
        content: '" *"',
        color: 'red.500',
      },
    },
    optional: {
      color: 'gray.600',
      fontWeight: 'normal',
      _after: {
        content: '" (optional)"',
        color: 'gray.500',
        fontSize: 'sm',
      },
    },
    disabled: {
      color: 'gray.400',
      fontWeight: 'normal',
      cursor: 'not-allowed',
    },
  };

  return {
    ...sizeStyles[size],
    ...variantStyles[variant],
  };
};

/**
 * Optimized Label Component
 */
const LabelComponent = React.forwardRef<HTMLLabelElement, LabelProps>(
  (
    {
      variant = 'default',
      size = 'md',
      required = false,
      optional = false,
      performance = { memoize: true, enableAnimations: true },
      testId,
      analytics,
      children,
      ...rest
    },
    ref
  ) => {
    // Track analytics on mount
    React.useEffect(() => {
      if (analytics && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', analytics.action || 'label_render', {
          event_category: analytics.category || 'label',
          event_label: analytics.label,
        });
      }
    }, [analytics]);

    // Determine variant based on props
    const effectiveVariant = useMemo(() => {
      if (required) return 'required';
      if (optional) return 'optional';
      return variant;
    }, [variant, required, optional]);

    // Memoized label styles
    const labelStyles = useMemo(() => {
      const styles = getLabelStyles(effectiveVariant, size);
      
      if (performance.enableAnimations) {
        return {
          ...styles,
          transition: 'all 0.2s ease-in-out',
          _hover: {
            ...styles._hover,
            transform: 'translateY(-1px)',
          },
        };
      }
      
      return styles;
    }, [effectiveVariant, size, performance.enableAnimations]);

    // Memoized label props
    const labelProps = useMemo(() => ({
      'data-testid': testId,
      'data-variant': effectiveVariant,
      'data-size': size,
      ...labelStyles,
      ...rest,
    }), [testId, effectiveVariant, size, labelStyles, rest]);

    return (
      <FormLabel ref={ref} {...labelProps}>
        {children}
      </FormLabel>
    );
  }
);

LabelComponent.displayName = 'OptimizedLabel';

/**
 * Memoized OptimizedLabel export
 */
export const OptimizedLabel = React.memo(LabelComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof LabelProps)[] = [
    'variant', 'size', 'required', 'optional', 'children'
  ];
  
  return keysToCompare.every(key => prevProps[key] === nextProps[key]);
});

// Default export
export default OptimizedLabel;