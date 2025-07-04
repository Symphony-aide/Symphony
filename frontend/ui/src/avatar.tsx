import React, { useMemo, useState, useCallback } from 'react';
import {
  Avatar as ChakraAvatar,
  AvatarBadge as ChakraAvatarBadge,
  AvatarGroup as ChakraAvatarGroup,
  AvatarProps as ChakraAvatarProps,
  AvatarGroupProps as ChakraAvatarGroupProps,
} from '@chakra-ui/react';
import { throttle } from 'lodash-es';

/**
 * Avatar sizes
 */
export type AvatarSize = '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * Avatar variants
 */
export type AvatarVariant = 'circular' | 'square' | 'rounded';

/**
 * Performance optimization options for avatar
 */
export interface AvatarPerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Throttle click events (ms) */
  throttleClick?: number;
  /** Enable lazy loading for images */
  lazyLoad?: boolean;
  /** Enable image caching */
  enableCaching?: boolean;
}

/**
 * Extended Avatar props with optimization features
 */
export interface AvatarProps extends Omit<ChakraAvatarProps, 'size' | 'onClick'> {
  /** Avatar size */
  size?: AvatarSize;
  /** Avatar variant */
  variant?: AvatarVariant;
  /** Avatar image source */
  src?: string;
  /** Fallback image source */
  fallbackSrc?: string;
  /** Avatar name for initials */
  name?: string;
  /** Custom click handler */
  onClick?: (event: React.MouseEvent<HTMLSpanElement>) => void;
  /** Performance optimization settings */
  performance?: AvatarPerformanceOptions;
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
 * Extended AvatarGroup props
 */
export interface AvatarGroupProps extends ChakraAvatarGroupProps {
  /** Maximum number of avatars to show */
  max?: number;
  /** Performance optimization settings */
  performance?: AvatarPerformanceOptions;
  /** Custom test ID */
  testId?: string;
}

/**
 * Optimized click handler factory
 */
const useOptimizedClickHandler = (
  originalOnClick?: (event: React.MouseEvent<HTMLSpanElement>) => void,
  throttleMs?: number,
  analytics?: AvatarProps['analytics']
) => {
  return useMemo(() => {
    if (!originalOnClick) return undefined;

    let optimizedHandler = originalOnClick;

    // Add analytics tracking
    if (analytics) {
      const trackingHandler = (event: React.MouseEvent<HTMLSpanElement>) => {
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', analytics.action || 'avatar_click', {
            event_category: analytics.category || 'avatar',
            event_label: analytics.label,
          });
        }
        originalOnClick(event);
      };
      optimizedHandler = trackingHandler;
    }

    // Apply throttling
    if (throttleMs) {
      optimizedHandler = throttle(optimizedHandler, throttleMs, { 
        leading: true, 
        trailing: false 
      });
    }

    return optimizedHandler;
  }, [originalOnClick, throttleMs, analytics]);
};

/**
 * Image loading hook with caching
 */
const useImageLoading = (src?: string, fallbackSrc?: string, enableCaching: boolean = true) => {
  const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src);

  const handleImageLoad = useCallback(() => {
    setImageStatus('loaded');
  }, []);

  const handleImageError = useCallback(() => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setImageStatus('loading');
    } else {
      setImageStatus('error');
    }
  }, [fallbackSrc, currentSrc]);

  React.useEffect(() => {
    if (!src) {
      setImageStatus('error');
      return;
    }

    setCurrentSrc(src);
    setImageStatus('loading');

    // Preload image if caching is enabled
    if (enableCaching) {
      const img = new Image();
      img.onload = handleImageLoad;
      img.onerror = handleImageError;
      img.src = src;
    }
  }, [src, enableCaching, handleImageLoad, handleImageError]);

  return { imageStatus, currentSrc };
};

/**
 * Optimized Avatar Component
 */
const AvatarComponent = React.forwardRef<HTMLSpanElement, AvatarProps>(
  (
    {
      size = 'md',
      variant = 'circular',
      src,
      fallbackSrc,
      name,
      onClick,
      performance = { memoize: true, throttleClick: 300, enableCaching: true },
      testId,
      analytics,
      children,
      ...rest
    },
    ref
  ) => {
    // Image loading with caching
    const { imageStatus, currentSrc } = useImageLoading(src, fallbackSrc, performance.enableCaching);

    // Optimized click handler
    const optimizedClickHandler = useOptimizedClickHandler(onClick, performance.throttleClick, analytics);

    // Memoized avatar props
    const avatarProps = useMemo(() => {
      const borderRadius = variant === 'circular' ? 'full' : variant === 'square' ? 'none' : 'md';
      
      return {
        size,
        src: imageStatus === 'loaded' ? currentSrc : undefined,
        name,
        onClick: optimizedClickHandler,
        borderRadius,
        cursor: onClick ? 'pointer' : 'default',
        'data-testid': testId,
        ...rest,
      };
    }, [size, imageStatus, currentSrc, name, optimizedClickHandler, variant, onClick, testId, rest]);

    return (
      <ChakraAvatar ref={ref} {...avatarProps}>
        {children}
      </ChakraAvatar>
    );
  }
);

AvatarComponent.displayName = 'OptimizedAvatar';

/**
 * Optimized AvatarGroup Component
 */
const AvatarGroupComponent = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  (
    {
      max = 3,
      performance = { memoize: true },
      testId,
      children,
      ...rest
    },
    ref
  ) => {
    // Memoized group props
    const groupProps = useMemo(() => ({
      max,
      'data-testid': testId,
      ...rest,
    }), [max, testId, rest]);

    return (
      <ChakraAvatarGroup ref={ref} {...groupProps}>
        {children}
      </ChakraAvatarGroup>
    );
  }
);

AvatarGroupComponent.displayName = 'OptimizedAvatarGroup';

// Memoized exports
export const OptimizedAvatar = React.memo(AvatarComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof AvatarProps)[] = [
    'size', 'variant', 'src', 'name', 'children'
  ];
  
  return keysToCompare.every(key => prevProps[key] === nextProps[key]);
});

export const OptimizedAvatarGroup = React.memo(AvatarGroupComponent);

// Re-export Chakra components
export const AvatarBadge = ChakraAvatarBadge;

// Default exports
export default OptimizedAvatar;
export { OptimizedAvatarGroup as AvatarGroup };