import React, { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { Box, BoxProps } from '@chakra-ui/react';
import { throttle } from 'lodash-es';

/**
 * Scroll area orientation
 */
export type ScrollAreaOrientation = 'vertical' | 'horizontal' | 'both';

/**
 * Scrollbar visibility
 */
export type ScrollbarVisibility = 'auto' | 'always' | 'never' | 'hover';

/**
 * Performance optimization options for scroll area
 */
export interface ScrollAreaPerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Throttle scroll events (ms) */
  throttleScroll?: number;
  /** Enable smooth scrolling */
  smoothScrolling?: boolean;
  /** Virtual scrolling for large lists */
  virtualScrolling?: boolean;
  /** Scroll buffer size for virtual scrolling */
  scrollBuffer?: number;
}

/**
 * Scroll area props
 */
export interface ScrollAreaProps extends Omit<BoxProps, 'onScroll'> {
  /** Scroll orientation */
  orientation?: ScrollAreaOrientation;
  /** Scrollbar visibility */
  scrollbarVisibility?: ScrollbarVisibility;
  /** Custom scroll handler */
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
  /** Scroll to top handler */
  onScrollToTop?: () => void;
  /** Scroll to bottom handler */
  onScrollToBottom?: () => void;
  /** Performance optimization settings */
  performance?: ScrollAreaPerformanceOptions;
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
 * Optimized scroll handler factory
 */
const useOptimizedScrollHandler = (
  originalOnScroll?: (event: React.UIEvent<HTMLDivElement>) => void,
  throttleMs?: number,
  analytics?: ScrollAreaProps['analytics']
) => {
  return useMemo(() => {
    if (!originalOnScroll) return undefined;

    let optimizedHandler = (event: React.UIEvent<HTMLDivElement>) => {
      // Track analytics
      if (analytics && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', analytics.action || 'scroll_area_scroll', {
          event_category: analytics.category || 'scroll_area',
          event_label: analytics.label,
        });
      }
      
      originalOnScroll(event);
    };

    // Apply throttling
    if (throttleMs) {
      optimizedHandler = throttle(optimizedHandler, throttleMs, { 
        leading: true, 
        trailing: true 
      });
    }

    return optimizedHandler;
  }, [originalOnScroll, throttleMs, analytics]);
};

/**
 * Scroll position hook
 */
const useScrollPosition = (
  scrollRef: React.RefObject<HTMLDivElement>,
  onScrollToTop?: () => void,
  onScrollToBottom?: () => void
) => {
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);

  const updateScrollPosition = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const newPosition = { x: target.scrollLeft, y: target.scrollTop };
    
    setScrollPosition(newPosition);
    
    const atTop = target.scrollTop === 0;
    const atBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 1;
    
    if (atTop && !isAtTop) {
      setIsAtTop(true);
      onScrollToTop?.();
    } else if (!atTop && isAtTop) {
      setIsAtTop(false);
    }
    
    if (atBottom && !isAtBottom) {
      setIsAtBottom(true);
      onScrollToBottom?.();
    } else if (!atBottom && isAtBottom) {
      setIsAtBottom(false);
    }
  }, [isAtTop, isAtBottom, onScrollToTop, onScrollToBottom]);

  return { scrollPosition, isAtTop, isAtBottom, updateScrollPosition };
};

/**
 * Get scrollbar styles based on visibility
 */
const getScrollbarStyles = (visibility: ScrollbarVisibility, orientation: ScrollAreaOrientation) => {
  const baseStyles = {
    '&::-webkit-scrollbar': {
      width: orientation === 'vertical' || orientation === 'both' ? '8px' : '0',
      height: orientation === 'horizontal' || orientation === 'both' ? '8px' : '0',
    },
    '&::-webkit-scrollbar-track': {
      background: 'gray.100',
      borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'gray.400',
      borderRadius: '4px',
      '&:hover': {
        background: 'gray.500',
      },
    },
  };

  switch (visibility) {
    case 'never':
      return {
        '&::-webkit-scrollbar': {
          display: 'none',
        },
        scrollbarWidth: 'none' as const,
        msOverflowStyle: 'none' as const,
      };
    case 'always':
      return {
        ...baseStyles,
        overflow: orientation === 'both' ? 'auto' : 
                 orientation === 'vertical' ? 'auto hidden' : 'hidden auto',
      };
    case 'hover':
      return {
        ...baseStyles,
        '&::-webkit-scrollbar': {
          ...baseStyles['&::-webkit-scrollbar'],
          opacity: 0,
          transition: 'opacity 0.2s ease',
        },
        '&:hover::-webkit-scrollbar': {
          opacity: 1,
        },
        overflow: orientation === 'both' ? 'auto' : 
                 orientation === 'vertical' ? 'auto hidden' : 'hidden auto',
      };
    case 'auto':
    default:
      return {
        ...baseStyles,
        overflow: orientation === 'both' ? 'auto' : 
                 orientation === 'vertical' ? 'auto hidden' : 'hidden auto',
      };
  }
};

/**
 * Smooth scroll utility
 */
const smoothScrollTo = (
  element: HTMLElement,
  target: { x?: number; y?: number },
  duration: number = 300
) => {
  const start = {
    x: element.scrollLeft,
    y: element.scrollTop,
  };
  
  const change = {
    x: (target.x ?? start.x) - start.x,
    y: (target.y ?? start.y) - start.y,
  };
  
  const startTime = performance.now();
  
  const animateScroll = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function (ease-out)
    const easeOut = 1 - Math.pow(1 - progress, 3);
    
    element.scrollLeft = start.x + change.x * easeOut;
    element.scrollTop = start.y + change.y * easeOut;
    
    if (progress < 1) {
      requestAnimationFrame(animateScroll);
    }
  };
  
  requestAnimationFrame(animateScroll);
};

/**
 * Optimized ScrollArea Component
 */
const ScrollAreaComponent = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  (
    {
      orientation = 'vertical',
      scrollbarVisibility = 'auto',
      onScroll,
      onScrollToTop,
      onScrollToBottom,
      performance = { memoize: true, throttleScroll: 16, smoothScrolling: false },
      testId,
      analytics,
      children,
      ...rest
    },
    ref
  ) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    
    // Combine refs
    const combinedRef = useCallback((node: HTMLDivElement) => {
      scrollRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    }, [ref]);

    // Scroll position tracking
    const { scrollPosition, isAtTop, isAtBottom, updateScrollPosition } = useScrollPosition(
      scrollRef,
      onScrollToTop,
      onScrollToBottom
    );

    // Optimized scroll handler
    const optimizedScrollHandler = useOptimizedScrollHandler(
      onScroll,
      performance.throttleScroll,
      analytics
    );

    // Combined scroll handler
    const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
      updateScrollPosition(event);
      optimizedScrollHandler?.(event);
    }, [updateScrollPosition, optimizedScrollHandler]);

    // Scroll methods
    const scrollTo = useCallback((options: { x?: number; y?: number; behavior?: 'auto' | 'smooth' }) => {
      if (!scrollRef.current) return;
      
      if (performance.smoothScrolling || options.behavior === 'smooth') {
        smoothScrollTo(scrollRef.current, { x: options.x, y: options.y });
      } else {
        scrollRef.current.scrollTo(options);
      }
    }, [performance.smoothScrolling]);

    const scrollToTop = useCallback(() => {
      scrollTo({ y: 0, behavior: 'smooth' });
    }, [scrollTo]);

    const scrollToBottom = useCallback(() => {
      if (!scrollRef.current) return;
      scrollTo({ y: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [scrollTo]);

    // Expose scroll methods via ref
    React.useImperativeHandle(ref, () => ({
      ...scrollRef.current!,
      scrollTo,
      scrollToTop,
      scrollToBottom,
      scrollPosition,
      isAtTop,
      isAtBottom,
    }), [scrollTo, scrollToTop, scrollToBottom, scrollPosition, isAtTop, isAtBottom]);

    // Memoized scrollbar styles
    const scrollbarStyles = useMemo(() => 
      getScrollbarStyles(scrollbarVisibility, orientation), 
      [scrollbarVisibility, orientation]
    );

    // Memoized scroll area props
    const scrollAreaProps = useMemo(() => ({
      ref: combinedRef,
      onScroll: handleScroll,
      'data-testid': testId,
      'data-orientation': orientation,
      'data-at-top': isAtTop,
      'data-at-bottom': isAtBottom,
      ...scrollbarStyles,
      ...rest,
    }), [
      combinedRef,
      handleScroll,
      testId,
      orientation,
      isAtTop,
      isAtBottom,
      scrollbarStyles,
      rest
    ]);

    return (
      <Box {...scrollAreaProps}>
        {children}
      </Box>
    );
  }
);

ScrollAreaComponent.displayName = 'OptimizedScrollArea';

/**
 * Memoized OptimizedScrollArea export
 */
export const OptimizedScrollArea = React.memo(ScrollAreaComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof ScrollAreaProps)[] = [
    'orientation', 'scrollbarVisibility', 'children'
  ];
  
  return keysToCompare.every(key => prevProps[key] === nextProps[key]);
});

// Default export
export default OptimizedScrollArea;