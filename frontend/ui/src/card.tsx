import {
  Box,
  BoxProps,
  Heading,
  Text,
  Flex,
  Spacer,
} from '@chakra-ui/react';
import { motion, MotionProps } from 'framer-motion';
import React, { useMemo } from 'react';

/**
 * Card variants
 */
export type CardVariant = 'elevated' | 'outline' | 'filled' | 'subtle' | 'ghost';

/**
 * Card sizes
 */
export type CardSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Performance optimization options for card
 */
export interface CardPerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Enable hover animations */
  enableHoverAnimations?: boolean;
  /** Enable click animations */
  enableClickAnimations?: boolean;
  /** Lazy load card content */
  lazyLoad?: boolean;
}

/**
 * Extended Card props with optimization features
 */
export interface CardProps extends Omit<BoxProps, 'onClick'> {
  /** Card variant */
  variant?: CardVariant;
  /** Card size */
  size?: CardSize;
  /** Whether the card is clickable */
  clickable?: boolean;
  /** Click handler */
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  /** Performance optimization settings */
  performance?: CardPerformanceOptions;
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
 * Card Header props
 */
export interface CardHeaderProps extends BoxProps {
  /** Header title */
  title?: React.ReactNode;
  /** Header subtitle */
  subtitle?: React.ReactNode;
  /** Header actions */
  actions?: React.ReactNode;
  /** Custom test ID */
  testId?: string;
}

/**
 * Card Body props
 */
export interface CardBodyProps extends BoxProps {
  /** Custom test ID */
  testId?: string;
}

/**
 * Card Footer props
 */
export interface CardFooterProps extends BoxProps {
  /** Footer actions */
  actions?: React.ReactNode;
  /** Custom test ID */
  testId?: string;
}

/**
 * Get card styles based on variant and size
 * @param variant
 * @param size
 */
const getCardStyles = (variant: CardVariant, size: CardSize) => {
  const sizeStyles = {
    sm: { p: 3, borderRadius: 'md' },
    md: { p: 4, borderRadius: 'lg' },
    lg: { p: 6, borderRadius: 'xl' },
    xl: { p: 8, borderRadius: '2xl' },
  };

  const variantStyles = {
    elevated: {
      bg: 'white',
      boxShadow: 'md',
      border: 'none',
      _hover: { boxShadow: 'lg', transform: 'translateY(-2px)' },
    },
    outline: {
      bg: 'transparent',
      border: '1px solid',
      borderColor: 'gray.200',
      boxShadow: 'none',
      _hover: { borderColor: 'gray.300', boxShadow: 'sm' },
    },
    filled: {
      bg: 'gray.50',
      border: 'none',
      boxShadow: 'none',
      _hover: { bg: 'gray.100' },
    },
    subtle: {
      bg: 'gray.25',
      border: 'none',
      boxShadow: 'none',
      _hover: { bg: 'gray.50' },
    },
    ghost: {
      bg: 'transparent',
      border: 'none',
      boxShadow: 'none',
      _hover: { bg: 'gray.50' },
    },
  };

  return {
    ...sizeStyles[size],
    ...variantStyles[variant],
  };
};

/**
 * Animation variants for card
 */
const cardAnimationVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  hover: { y: -4, transition: { duration: 0.2 } },
  tap: { scale: 0.98, transition: { duration: 0.1 } },
};

/**
 * Optimized Card Component
 */
const CardComponent = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'elevated',
      size = 'md',
      clickable = false,
      onClick,
      performance = { memoize: true, enableHoverAnimations: true, enableClickAnimations: true },
      testId,
      analytics,
      children,
      ...rest
    },
    ref
  ) => {
    // Handle click with analytics
    const handleClick = React.useCallback((event: React.MouseEvent<HTMLDivElement>) => {
      if (analytics && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', analytics.action || 'card_click', {
          event_category: analytics.category || 'card',
          event_label: analytics.label,
        });
      }
      onClick?.(event);
    }, [onClick, analytics]);

    // Memoized card styles
    const cardStyles = useMemo(() => getCardStyles(variant, size), [variant, size]);

    // Memoized card props
    const cardProps = useMemo(() => ({
      ...cardStyles,
      cursor: clickable ? 'pointer' : 'default',
      transition: 'all 0.2s ease-in-out',
      'data-testid': testId,
      onClick: clickable ? handleClick : undefined,
      ...rest,
    }), [cardStyles, clickable, testId, handleClick, rest]);

    // Render with or without animations
    if (performance.enableHoverAnimations || performance.enableClickAnimations) {
      const motionProps: MotionProps = {
        initial: "initial",
        animate: "animate",
        variants: cardAnimationVariants,
        transition: { duration: 0.3, ease: "easeOut" },
      };

      if (performance.enableHoverAnimations && clickable) {
        motionProps.whileHover = "hover";
      }

      if (performance.enableClickAnimations && clickable) {
        motionProps.whileTap = "tap";
      }

      const MotionBox = motion(Box);
      
      return (
        <MotionBox ref={ref} {...cardProps} {...motionProps}>
          {children}
        </MotionBox>
      );
    }

    return (
      <Box ref={ref} {...cardProps}>
        {children}
      </Box>
    );
  }
);

CardComponent.displayName = 'OptimizedCard';

/**
 * Optimized CardHeader Component
 */
const CardHeaderComponent = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ title, subtitle, actions, testId, children, ...rest }, ref) => {
    const headerProps = useMemo(() => ({
      'data-testid': testId,
      ...rest,
    }), [testId, rest]);

    return (
      <Box ref={ref} {...headerProps}>
        {(title || subtitle || actions) ? (
          <Flex align="start" justify="space-between" mb={children ? 4 : 0}>
            <Box>
              {title && (
                <Heading size="md" mb={subtitle ? 1 : 0}>
                  {title}
                </Heading>
              )}
              {subtitle && (
                <Text color="gray.600" fontSize="sm">
                  {subtitle}
                </Text>
              )}
            </Box>
            {actions && (
              <Box ml={4}>
                {actions}
              </Box>
            )}
          </Flex>
        ) : null}
        {children}
      </Box>
    );
  }
);

CardHeaderComponent.displayName = 'OptimizedCardHeader';

/**
 * Optimized CardBody Component
 */
const CardBodyComponent = React.forwardRef<HTMLDivElement, CardBodyProps>(
  ({ testId, children, ...rest }, ref) => {
    const bodyProps = useMemo(() => ({
      'data-testid': testId,
      ...rest,
    }), [testId, rest]);

    return (
      <Box ref={ref} {...bodyProps}>
        {children}
      </Box>
    );
  }
);

CardBodyComponent.displayName = 'OptimizedCardBody';

/**
 * Optimized CardFooter Component
 */
const CardFooterComponent = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ actions, testId, children, ...rest }, ref) => {
    const footerProps = useMemo(() => ({
      'data-testid': testId,
      ...rest,
    }), [testId, rest]);

    return (
      <Box ref={ref} {...footerProps}>
        {children}
        {actions && (
          <Flex justify="flex-end" mt={children ? 4 : 0}>
            {actions}
          </Flex>
        )}
      </Box>
    );
  }
);

CardFooterComponent.displayName = 'OptimizedCardFooter';

// Memoized exports
export const OptimizedCard = React.memo(CardComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof CardProps)[] = [
    'variant', 'size', 'clickable', 'children'
  ];
  
  return keysToCompare.every(key => prevProps[key] === nextProps[key]);
});

export const OptimizedCardHeader = React.memo(CardHeaderComponent);
export const OptimizedCardBody = React.memo(CardBodyComponent);
export const OptimizedCardFooter = React.memo(CardFooterComponent);

// Default exports
export default OptimizedCard;
export { OptimizedCardHeader as CardHeader };
export { OptimizedCardBody as CardBody };
export { OptimizedCardFooter as CardFooter };