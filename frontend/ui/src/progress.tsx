import React, { useMemo, useCallback, useState, useEffect } from 'react';
import {
  Progress as ChakraProgress,
  CircularProgress,
  CircularProgressLabel,
  ProgressProps as ChakraProgressProps,
  Box,
  Text,
  Flex,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { throttle } from 'lodash-es';

/**
 * Progress variants
 */
export type ProgressVariant = 'linear' | 'circular';

/**
 * Progress sizes
 */
export type ProgressSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Progress color schemes
 */
export type ProgressColorScheme = 'blue' | 'green' | 'red' | 'orange' | 'yellow' | 'purple' | 'pink' | 'gray';

/**
 * Performance optimization options for progress
 */
export interface ProgressPerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Throttle value updates (ms) */
  throttleUpdates?: number;
  /** Enable animations */
  enableAnimations?: boolean;
  /** Smooth value transitions */
  smoothTransitions?: boolean;
  /** Update interval for smooth transitions (ms) */
  transitionInterval?: number;
}

/**
 * Extended Progress props with optimization features
 */
export interface ProgressProps extends Omit<ChakraProgressProps, 'size' | 'colorScheme'> {
  /** Progress variant */
  variant?: ProgressVariant;
  /** Progress size */
  size?: ProgressSize;
  /** Progress color scheme */
  colorScheme?: ProgressColorScheme;
  /** Current progress value (0-100) */
  value?: number;
  /** Maximum value */
  max?: number;
  /** Show progress label */
  showLabel?: boolean;
  /** Custom label format function */
  labelFormat?: (value: number, max: number) => string;
  /** Show percentage */
  showPercentage?: boolean;
  /** Progress label */
  label?: string;
  /** Custom value change handler */
  onValueChange?: (value: number) => void;
  /** Performance optimization settings */
  performance?: ProgressPerformanceOptions;
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
 * Optimized value change handler factory
 */
const useOptimizedValueChangeHandler = (
  originalOnValueChange?: (value: number) => void,
  throttleMs?: number,
  analytics?: ProgressProps['analytics']
) => {
  return useMemo(() => {
    if (!originalOnValueChange) return undefined;

    let optimizedHandler = (value: number) => {
      // Track analytics
      if (analytics && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', analytics.action || 'progress_value_change', {
          event_category: analytics.category || 'progress',
          event_label: analytics.label,
          value: Math.round(value),
        });
      }
      
      originalOnValueChange(value);
    };

    // Apply throttling
    if (throttleMs) {
      optimizedHandler = throttle(optimizedHandler, throttleMs, { 
        leading: true, 
        trailing: true 
      });
    }

    return optimizedHandler;
  }, [originalOnValueChange, throttleMs, analytics]);
};

/**
 * Smooth value transition hook
 */
const useSmoothTransition = (
  targetValue: number,
  enabled: boolean = false,
  interval: number = 50
) => {
  const [currentValue, setCurrentValue] = useState(targetValue);

  useEffect(() => {
    if (!enabled) {
      setCurrentValue(targetValue);
      return;
    }

    const difference = targetValue - currentValue;
    if (Math.abs(difference) < 0.1) {
      setCurrentValue(targetValue);
      return;
    }

    const step = difference / 10; // Adjust speed
    const timer = setInterval(() => {
      setCurrentValue(prev => {
        const next = prev + step;
        if (Math.abs(targetValue - next) < Math.abs(step)) {
          return targetValue;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [targetValue, currentValue, enabled, interval]);

  return currentValue;
};

/**
 * Get progress size styles
 */
const getProgressSize = (size: ProgressSize, variant: ProgressVariant) => {
  if (variant === 'circular') {
    const circularSizes = {
      xs: '32px',
      sm: '48px',
      md: '64px',
      lg: '80px',
      xl: '96px',
    };
    return { size: circularSizes[size] };
  }

  const linearSizes = {
    xs: { height: '4px' },
    sm: { height: '6px' },
    md: { height: '8px' },
    lg: { height: '12px' },
    xl: { height: '16px' },
  };
  
  return linearSizes[size];
};

/**
 * Default label format function
 */
const defaultLabelFormat = (value: number, max: number) => {
  const percentage = Math.round((value / max) * 100);
  return `${percentage}%`;
};

/**
 * Optimized Progress Component
 */
const ProgressComponent = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      variant = 'linear',
      size = 'md',
      colorScheme = 'blue',
      value = 0,
      max = 100,
      showLabel = false,
      labelFormat = defaultLabelFormat,
      showPercentage = false,
      label,
      onValueChange,
      performance = { 
        memoize: true, 
        throttleUpdates: 100,
        enableAnimations: true,
        smoothTransitions: false,
        transitionInterval: 50
      },
      testId,
      analytics,
      ...rest
    },
    ref
  ) => {
    // Smooth value transition
    const displayValue = useSmoothTransition(
      value,
      performance.smoothTransitions,
      performance.transitionInterval
    );

    // Optimized value change handler
    const optimizedValueChangeHandler = useOptimizedValueChangeHandler(
      onValueChange,
      performance.throttleUpdates,
      analytics
    );

    // Handle value changes
    useEffect(() => {
      optimizedValueChangeHandler?.(displayValue);
    }, [displayValue, optimizedValueChangeHandler]);

    // Memoized progress size styles
    const sizeStyles = useMemo(() => getProgressSize(size, variant), [size, variant]);

    // Memoized progress props
    const progressProps = useMemo(() => ({
      value: displayValue,
      max,
      colorScheme,
      'data-testid': testId,
      'data-variant': variant,
      'data-size': size,
      ...sizeStyles,
      ...rest,
    }), [displayValue, max, colorScheme, testId, variant, size, sizeStyles, rest]);

    // Memoized label content
    const labelContent = useMemo(() => {
      if (!showLabel && !showPercentage && !label) return null;

      const formattedValue = labelFormat(displayValue, max);
      const displayText = label || (showPercentage ? formattedValue : `${Math.round(displayValue)}/${max}`);

      return (
        <Text fontSize="sm" color="gray.600" textAlign="center">
          {displayText}
        </Text>
      );
    }, [showLabel, showPercentage, label, labelFormat, displayValue, max]);

    // Render progress based on variant
    const progressElement = useMemo(() => {
      if (variant === 'circular') {
        const percentage = (displayValue / max) * 100;
        
        const circularProgress = (
          <CircularProgress
            value={percentage}
            color={`${colorScheme}.400`}
            size={sizeStyles.size}
            data-testid={testId}
          >
            {(showLabel || showPercentage) && (
              <CircularProgressLabel>
                {labelFormat(displayValue, max)}
              </CircularProgressLabel>
            )}
          </CircularProgress>
        );

        if (performance.enableAnimations) {
          const MotionBox = motion(Box);
          
          return (
            <MotionBox
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {circularProgress}
            </MotionBox>
          );
        }

        return circularProgress;
      }

      // Linear progress
      const linearProgress = (
        <ChakraProgress ref={ref} {...progressProps} />
      );

      if (performance.enableAnimations) {
        const MotionProgress = motion(ChakraProgress);
        
        return (
          <MotionProgress
            ref={ref}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            transformOrigin="left"
            {...progressProps}
          />
        );
      }

      return linearProgress;
    }, [
      variant,
      displayValue,
      max,
      colorScheme,
      sizeStyles,
      testId,
      showLabel,
      showPercentage,
      labelFormat,
      performance.enableAnimations,
      progressProps,
      ref
    ]);

    return (
      <Box data-testid={testId}>
        {label && variant === 'linear' && (
          <Flex justify="space-between" align="center" mb={2}>
            <Text fontSize="sm" fontWeight="medium">
              {label}
            </Text>
            {(showLabel || showPercentage) && (
              <Text fontSize="sm" color="gray.600">
                {labelFormat(displayValue, max)}
              </Text>
            )}
          </Flex>
        )}
        
        {progressElement}
        
        {variant === 'circular' && label && (
          <Box mt={2}>
            <Text fontSize="sm" fontWeight="medium" textAlign="center">
              {label}
            </Text>
          </Box>
        )}
      </Box>
    );
  }
);

ProgressComponent.displayName = 'OptimizedProgress';

/**
 * Memoized OptimizedProgress export
 */
export const OptimizedProgress = React.memo(ProgressComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof ProgressProps)[] = [
    'variant', 'size', 'colorScheme', 'value', 'max', 'label', 'showLabel', 'showPercentage'
  ];
  
  return keysToCompare.every(key => prevProps[key] === nextProps[key]);
});

// Default export
export default OptimizedProgress;