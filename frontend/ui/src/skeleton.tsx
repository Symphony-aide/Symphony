import { Skeleton as ChakraSkeleton, SkeletonProps as ChakraSkeletonProps, VStack, HStack, Box } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import React, { useMemo } from 'react';

/**
 * Skeleton variants
 */
export type SkeletonVariant = 'pulse' | 'wave' | 'shimmer';

/**
 * Skeleton shapes
 */
export type SkeletonShape = 'rectangle' | 'circle' | 'text';

/**
 * Performance optimization options for skeleton
 */
export interface SkeletonPerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Enable animations */
  enableAnimations?: boolean;
  /** Animation speed */
  animationSpeed?: number;
}

/**
 * Extended Skeleton props with optimization features
 */
export interface SkeletonProps extends Omit<ChakraSkeletonProps, 'isLoaded'> {
  /** Skeleton variant */
  variant?: SkeletonVariant;
  /** Skeleton shape */
  shape?: SkeletonShape;
  /** Whether content is loaded */
  isLoaded?: boolean;
  /** Number of skeleton lines for text */
  lines?: number;
  /** Performance optimization settings */
  performance?: SkeletonPerformanceOptions;
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
 * Skeleton group props for multiple skeletons
 */
export interface SkeletonGroupProps {
  /** Whether content is loaded */
  isLoaded?: boolean;
  /** Skeleton configuration */
  skeletons?: Array<{
    width?: string | number;
    height?: string | number;
    shape?: SkeletonShape;
    variant?: SkeletonVariant;
  }>;
  /** Performance optimization settings */
  performance?: SkeletonPerformanceOptions;
  /** Custom test ID */
  testId?: string;
}

/**
 * Get skeleton styles based on variant and shape
 * @param variant
 * @param shape
 * @param enableAnimations
 * @param animationSpeed
 */
const getSkeletonStyles = (
  variant: SkeletonVariant,
  shape: SkeletonShape,
  enableAnimations: boolean,
  animationSpeed: number
) => {
  const baseStyles = {
    borderRadius: shape === 'circle' ? 'full' : shape === 'text' ? '4px' : '8px',
    bg: 'gray.200',
  };

  if (!enableAnimations) {
    return baseStyles;
  }

  const animationStyles = {
    pulse: {
      animation: `pulse ${animationSpeed}s ease-in-out infinite`,
      '@keyframes pulse': {
        '0%, 100%': { opacity: 1 },
        '50%': { opacity: 0.5 },
      },
    },
    wave: {
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      backgroundSize: '200% 100%',
      animation: `wave ${animationSpeed}s ease-in-out infinite`,
      '@keyframes wave': {
        '0%': { backgroundPosition: '200% 0' },
        '100%': { backgroundPosition: '-200% 0' },
      },
    },
    shimmer: {
      background: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%)',
      backgroundSize: '20px 20px',
      animation: `shimmer ${animationSpeed}s linear infinite`,
      '@keyframes shimmer': {
        '0%': { backgroundPosition: '0 0' },
        '100%': { backgroundPosition: '20px 20px' },
      },
    },
  };

  return {
    ...baseStyles,
    ...animationStyles[variant],
  };
};

/**
 * Animation variants for skeleton loading
 */
const skeletonLoadingVariants = {
  loading: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
  loaded: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
};

/**
 * Optimized Skeleton Component
 */
const SkeletonComponent = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      variant = 'pulse',
      shape = 'rectangle',
      isLoaded = false,
      lines = 1,
      performance = { memoize: true, enableAnimations: true, animationSpeed: 1.5 },
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
        (window as any).gtag('event', analytics.action || 'skeleton_render', {
          event_category: analytics.category || 'skeleton',
          event_label: analytics.label,
        });
      }
    }, [analytics]);

    // Memoized skeleton styles
    const skeletonStyles = useMemo(() => 
      getSkeletonStyles(variant, shape, performance.enableAnimations || false, performance.animationSpeed || 1.5),
      [variant, shape, performance.enableAnimations, performance.animationSpeed]
    );

    // Memoized skeleton props
    const skeletonProps = useMemo(() => ({
      isLoaded,
      'data-testid': testId,
      'data-variant': variant,
      'data-shape': shape,
      ...skeletonStyles,
      ...rest,
    }), [isLoaded, testId, variant, shape, skeletonStyles, rest]);

    // Render multiple lines for text skeleton
    if (shape === 'text' && lines > 1) {
      return (
        <VStack spacing={2} align="stretch" ref={ref}>
          {Array.from({ length: lines }, (_, index) => {
            const isLastLine = index === lines - 1;
            const lineWidth = isLastLine ? '75%' : '100%';
            
            if (performance.enableAnimations) {
              const MotionSkeleton = motion(ChakraSkeleton);
              
              return (
                <MotionSkeleton
                  key={index}
                  variants={skeletonLoadingVariants}
                  animate={isLoaded ? 'loaded' : 'loading'}
                  width={lineWidth}
                  height="20px"
                  data-testid={`${testId}-line-${index}`}
                  {...skeletonProps}
                >
                  {isLoaded && children}
                </MotionSkeleton>
              );
            }
            
            return (
              <ChakraSkeleton
                key={index}
                width={lineWidth}
                height="20px"
                data-testid={`${testId}-line-${index}`}
                {...skeletonProps}
              >
                {isLoaded && children}
              </ChakraSkeleton>
            );
          })}
        </VStack>
      );
    }

    // Single skeleton
    if (performance.enableAnimations) {
      const MotionSkeleton = motion(ChakraSkeleton);
      
      return (
        <MotionSkeleton
          ref={ref}
          variants={skeletonLoadingVariants}
          animate={isLoaded ? 'loaded' : 'loading'}
          {...skeletonProps}
        >
          {children}
        </MotionSkeleton>
      );
    }

    return (
      <ChakraSkeleton ref={ref} {...skeletonProps}>
        {children}
      </ChakraSkeleton>
    );
  }
);

SkeletonComponent.displayName = 'OptimizedSkeleton';

/**
 * Optimized SkeletonGroup Component
 */
const SkeletonGroupComponent = React.forwardRef<HTMLDivElement, SkeletonGroupProps>(
  (
    {
      isLoaded = false,
      skeletons = [
        { width: '100%', height: '20px' },
        { width: '80%', height: '20px' },
        { width: '60%', height: '20px' },
      ],
      performance = { memoize: true, enableAnimations: true },
      testId,
    },
    ref
  ) => {
    // Memoized skeleton group content
    const skeletonGroupContent = useMemo(() => {
      return skeletons.map((skeleton, index) => (
        <SkeletonComponent
          key={index}
          isLoaded={isLoaded}
          variant={skeleton.variant}
          shape={skeleton.shape}
          width={skeleton.width}
          height={skeleton.height}
          performance={performance}
          testId={`${testId}-skeleton-${index}`}
        />
      ));
    }, [skeletons, isLoaded, performance, testId]);

    return (
      <VStack spacing={3} align="stretch" ref={ref} data-testid={testId}>
        {skeletonGroupContent}
      </VStack>
    );
  }
);

SkeletonGroupComponent.displayName = 'OptimizedSkeletonGroup';

/**
 * Predefined skeleton layouts
 */
export const SkeletonLayouts = {
  /**
   * Card layout with avatar, title, and description
   * @param isLoaded
   * @param testId
   */
  card: (isLoaded: boolean = false, testId?: string) => (
    <Box p={4} borderWidth="1px" borderRadius="lg">
      <HStack spacing={4} mb={4}>
        <SkeletonComponent
          isLoaded={isLoaded}
          shape="circle"
          width="50px"
          height="50px"
          testId={`${testId}-avatar`}
        />
        <VStack spacing={2} align="start" flex={1}>
          <SkeletonComponent
            isLoaded={isLoaded}
            width="150px"
            height="20px"
            testId={`${testId}-title`}
          />
          <SkeletonComponent
            isLoaded={isLoaded}
            width="100px"
            height="16px"
            testId={`${testId}-subtitle`}
          />
        </VStack>
      </HStack>
      <SkeletonComponent
        isLoaded={isLoaded}
        lines={3}
        shape="text"
        testId={`${testId}-description`}
      />
    </Box>
  ),

  /**
   * List item layout
   * @param isLoaded
   * @param testId
   */
  listItem: (isLoaded: boolean = false, testId?: string) => (
    <HStack spacing={3} p={3}>
      <SkeletonComponent
        isLoaded={isLoaded}
        shape="circle"
        width="40px"
        height="40px"
        testId={`${testId}-icon`}
      />
      <VStack spacing={1} align="start" flex={1}>
        <SkeletonComponent
          isLoaded={isLoaded}
          width="200px"
          height="18px"
          testId={`${testId}-primary`}
        />
        <SkeletonComponent
          isLoaded={isLoaded}
          width="150px"
          height="14px"
          testId={`${testId}-secondary`}
        />
      </VStack>
    </HStack>
  ),

  /**
   * Table row layout
   * @param isLoaded
   * @param columns
   * @param testId
   */
  tableRow: (isLoaded: boolean = false, columns: number = 4, testId?: string) => (
    <HStack spacing={4} p={3}>
      {Array.from({ length: columns }, (_, index) => (
        <SkeletonComponent
          key={index}
          isLoaded={isLoaded}
          width="100px"
          height="16px"
          testId={`${testId}-column-${index}`}
        />
      ))}
    </HStack>
  ),
};

/**
 * Memoized exports
 */
export const OptimizedSkeleton = React.memo(SkeletonComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof SkeletonProps)[] = [
    'variant', 'shape', 'isLoaded', 'lines', 'children'
  ];
  
  return keysToCompare.every(key => prevProps[key] === nextProps[key]);
});

export const OptimizedSkeletonGroup = React.memo(SkeletonGroupComponent);

// Default exports
export default OptimizedSkeleton;
export { OptimizedSkeletonGroup as SkeletonGroup };