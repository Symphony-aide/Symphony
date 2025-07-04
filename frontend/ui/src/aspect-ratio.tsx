import { AspectRatio as ChakraAspectRatio, AspectRatioProps as ChakraAspectRatioProps } from '@chakra-ui/react';
import React, { useMemo } from 'react';

/**
 * Common aspect ratios
 */
export type AspectRatioPreset = 
  | 'square' 
  | 'video' 
  | 'widescreen' 
  | 'portrait' 
  | 'golden' 
  | 'photo';

/**
 * Performance optimization options for aspect ratio
 */
export interface AspectRatioPerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Enable responsive behavior */
  responsive?: boolean;
}

/**
 * Extended AspectRatio props with optimization features
 */
export interface AspectRatioProps extends Omit<ChakraAspectRatioProps, 'ratio'> {
  /** Aspect ratio value or preset */
  ratio?: number | AspectRatioPreset;
  /** Performance optimization settings */
  performance?: AspectRatioPerformanceOptions;
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
 * Get numeric ratio from preset
 * @param ratio
 */
const getAspectRatioValue = (ratio: number | AspectRatioPreset): number => {
  if (typeof ratio === 'number') return ratio;
  
  const presets: Record<AspectRatioPreset, number> = {
    square: 1,
    video: 16 / 9,
    widescreen: 21 / 9,
    portrait: 3 / 4,
    golden: 1.618,
    photo: 4 / 3,
  };
  
  return presets[ratio] || 1;
};

/**
 * Optimized AspectRatio Component
 */
const AspectRatioComponent = React.forwardRef<HTMLDivElement, AspectRatioProps>(
  (
    {
      ratio = 'video',
      performance = { memoize: true, responsive: true },
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
        (window as any).gtag('event', analytics.action || 'aspect_ratio_render', {
          event_category: analytics.category || 'aspect_ratio',
          event_label: analytics.label || ratio.toString(),
        });
      }
    }, [analytics, ratio]);

    // Memoized aspect ratio value
    const aspectRatioValue = useMemo(() => getAspectRatioValue(ratio), [ratio]);

    // Memoized aspect ratio props
    const aspectRatioProps = useMemo(() => ({
      ratio: aspectRatioValue,
      'data-testid': testId,
      ...rest,
    }), [aspectRatioValue, testId, rest]);

    return (
      <ChakraAspectRatio ref={ref} {...aspectRatioProps}>
        {children}
      </ChakraAspectRatio>
    );
  }
);

AspectRatioComponent.displayName = 'OptimizedAspectRatio';

/**
 * Memoized OptimizedAspectRatio export
 */
export const OptimizedAspectRatio = React.memo(AspectRatioComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof AspectRatioProps)[] = ['ratio', 'children'];
  
  return keysToCompare.every(key => prevProps[key] === nextProps[key]);
});

// Default export
export default OptimizedAspectRatio;