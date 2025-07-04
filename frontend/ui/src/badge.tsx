import React, { useMemo } from 'react';
import { Badge as ChakraBadge, BadgeProps as ChakraBadgeProps } from '@chakra-ui/react';

/**
 * Badge variants
 */
export type BadgeVariant = 'solid' | 'subtle' | 'outline' | 'surface';

/**
 * Badge sizes
 */
export type BadgeSize = 'sm' | 'md' | 'lg';

/**
 * Badge color schemes
 */
export type BadgeColorScheme = 
  | 'gray' | 'red' | 'orange' | 'yellow' | 'green' 
  | 'teal' | 'blue' | 'cyan' | 'purple' | 'pink'
  | 'primary' | 'secondary' | 'success' | 'warning' | 'error';

/**
 * Performance optimization options for badge
 */
export interface BadgePerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Enable animations */
  enableAnimations?: boolean;
}

/**
 * Extended Badge props with optimization features
 */
export interface BadgeProps extends Omit<ChakraBadgeProps, 'variant' | 'colorScheme'> {
  /** Badge variant */
  variant?: BadgeVariant;
  /** Badge size */
  size?: BadgeSize;
  /** Badge color scheme */
  colorScheme?: BadgeColorScheme;
  /** Badge content */
  children?: React.ReactNode;
  /** Performance optimization settings */
  performance?: BadgePerformanceOptions;
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
 * Get badge size styles
 */
const getBadgeSize = (size: BadgeSize) => {
  const sizeStyles = {
    sm: { fontSize: 'xs', px: 2, py: 0.5, minH: 4 },
    md: { fontSize: 'sm', px: 2.5, py: 1, minH: 5 },
    lg: { fontSize: 'md', px: 3, py: 1.5, minH: 6 },
  };
  
  return sizeStyles[size];
};

/**
 * Optimized Badge Component
 */
const BadgeComponent = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'subtle',
      size = 'md',
      colorScheme = 'gray',
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
        (window as any).gtag('event', analytics.action || 'badge_render', {
          event_category: analytics.category || 'badge',
          event_label: analytics.label,
        });
      }
    }, [analytics]);

    // Memoized badge styles
    const badgeStyles = useMemo(() => {
      const sizeStyles = getBadgeSize(size);
      const animationStyles = performance.enableAnimations ? {
        transition: 'all 0.2s ease-in-out',
        _hover: { transform: 'scale(1.05)' },
      } : {};

      return {
        ...sizeStyles,
        ...animationStyles,
      };
    }, [size, performance.enableAnimations]);

    // Memoized badge props
    const badgeProps = useMemo(() => ({
      variant,
      colorScheme: colorScheme === 'primary' ? 'blue' : 
                   colorScheme === 'secondary' ? 'gray' :
                   colorScheme === 'success' ? 'green' :
                   colorScheme === 'warning' ? 'yellow' :
                   colorScheme === 'error' ? 'red' : colorScheme,
      'data-testid': testId,
      ...badgeStyles,
      ...rest,
    }), [variant, colorScheme, testId, badgeStyles, rest]);

    return (
      <ChakraBadge ref={ref} {...badgeProps}>
        {children}
      </ChakraBadge>
    );
  }
);

BadgeComponent.displayName = 'OptimizedBadge';

/**
 * Memoized OptimizedBadge export
 */
export const OptimizedBadge = React.memo(BadgeComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof BadgeProps)[] = [
    'variant', 'size', 'colorScheme', 'children'
  ];
  
  return keysToCompare.every(key => prevProps[key] === nextProps[key]);
});

// Default export
export default OptimizedBadge;