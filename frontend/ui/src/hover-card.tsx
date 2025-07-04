import React, { useMemo, useCallback, useState, useRef } from 'react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverProps,
  Portal,
  Box,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { throttle, debounce } from 'lodash-es';

/**
 * Hover card placement options
 */
export type HoverCardPlacement = 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';

/**
 * Performance optimization options for hover card
 */
export interface HoverCardPerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Debounce hover events (ms) */
  debounceHover?: number;
  /** Throttle hover events (ms) */
  throttleHover?: number;
  /** Enable animations */
  enableAnimations?: boolean;
  /** Hover delay (ms) */
  hoverDelay?: number;
  /** Hide delay (ms) */
  hideDelay?: number;
  /** Use portal */
  usePortal?: boolean;
}

/**
 * Hover card props
 */
export interface HoverCardProps extends Omit<PopoverProps, 'children'> {
  /** Trigger element */
  trigger: React.ReactElement;
  /** Card content */
  content: React.ReactNode;
  /** Card placement */
  placement?: HoverCardPlacement;
  /** Performance optimization settings */
  performance?: HoverCardPerformanceOptions;
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
 * Optimized hover handler factory
 */
const useOptimizedHoverHandler = (
  originalOnHover?: () => void,
  debounceMs?: number,
  throttleMs?: number,
  analytics?: HoverCardProps['analytics']
) => {
  return useMemo(() => {
    if (!originalOnHover) return undefined;

    let optimizedHandler = () => {
      // Track analytics
      if (analytics && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', analytics.action || 'hover_card_show', {
          event_category: analytics.category || 'hover_card',
          event_label: analytics.label,
        });
      }
      
      originalOnHover();
    };

    // Apply debouncing
    if (debounceMs) {
      optimizedHandler = debounce(optimizedHandler, debounceMs);
    }

    // Apply throttling
    if (throttleMs) {
      optimizedHandler = throttle(optimizedHandler, throttleMs, { 
        leading: true, 
        trailing: true 
      });
    }

    return optimizedHandler;
  }, [originalOnHover, debounceMs, throttleMs, analytics]);
};

/**
 * Hover card hook
 */
const useHoverCard = (
  hoverDelay: number = 300,
  hideDelay: number = 100
) => {
  const [isOpen, setIsOpen] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout>();
  const hideTimeoutRef = useRef<NodeJS.Timeout>();

  const handleMouseEnter = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    
    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, hoverDelay);
  }, [hoverDelay]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    hideTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, hideDelay);
  }, [hideDelay]);

  const handleContentMouseEnter = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
  }, []);

  const handleContentMouseLeave = useCallback(() => {
    hideTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, hideDelay);
  }, [hideDelay]);

  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  return {
    isOpen,
    handleMouseEnter,
    handleMouseLeave,
    handleContentMouseEnter,
    handleContentMouseLeave,
  };
};

/**
 * Animation variants for hover card
 */
const hoverCardVariants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 10 },
};

/**
 * Optimized HoverCard Component
 */
const HoverCardComponent = React.forwardRef<HTMLDivElement, HoverCardProps>(
  (
    {
      trigger,
      content,
      placement = 'bottom',
      performance = { 
        memoize: true, 
        hoverDelay: 300, 
        hideDelay: 100,
        enableAnimations: true,
        usePortal: true
      },
      testId,
      analytics,
      ...rest
    },
    ref
  ) => {
    const {
      isOpen,
      handleMouseEnter,
      handleMouseLeave,
      handleContentMouseEnter,
      handleContentMouseLeave,
    } = useHoverCard(performance.hoverDelay, performance.hideDelay);

    // Optimized hover handlers
    const optimizedMouseEnter = useOptimizedHoverHandler(
      handleMouseEnter,
      performance.debounceHover,
      performance.throttleHover,
      analytics
    );

    // Memoized trigger element with hover handlers
    const triggerElement = useMemo(() => {
      return React.cloneElement(trigger, {
        onMouseEnter: (event: React.MouseEvent) => {
          trigger.props.onMouseEnter?.(event);
          optimizedMouseEnter?.();
        },
        onMouseLeave: (event: React.MouseEvent) => {
          trigger.props.onMouseLeave?.(event);
          handleMouseLeave();
        },
        'data-testid': `${testId}-trigger`,
      });
    }, [trigger, optimizedMouseEnter, handleMouseLeave, testId]);

    // Memoized popover content
    const popoverContent = useMemo(() => {
      const contentElement = (
        <PopoverContent
          onMouseEnter={handleContentMouseEnter}
          onMouseLeave={handleContentMouseLeave}
          data-testid={`${testId}-content`}
          maxW="sm"
          border="1px solid"
          borderColor="gray.200"
          boxShadow="lg"
        >
          <PopoverBody>
            {content}
          </PopoverBody>
        </PopoverContent>
      );

      if (performance.enableAnimations) {
        const MotionPopoverContent = motion(PopoverContent);
        
        return (
          <AnimatePresence>
            {isOpen && (
              <MotionPopoverContent
                variants={hoverCardVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.15, ease: "easeOut" }}
                onMouseEnter={handleContentMouseEnter}
                onMouseLeave={handleContentMouseLeave}
                data-testid={`${testId}-content`}
                maxW="sm"
                border="1px solid"
                borderColor="gray.200"
                boxShadow="lg"
              >
                <PopoverBody>
                  {content}
                </PopoverBody>
              </MotionPopoverContent>
            )}
          </AnimatePresence>
        );
      }

      return isOpen ? contentElement : null;
    }, [
      performance.enableAnimations,
      isOpen,
      content,
      handleContentMouseEnter,
      handleContentMouseLeave,
      testId
    ]);

    // Memoized popover props
    const popoverProps = useMemo(() => ({
      isOpen,
      placement,
      trigger: 'hover' as const,
      'data-testid': testId,
      ...rest,
    }), [isOpen, placement, testId, rest]);

    const popoverElement = (
      <Popover ref={ref} {...popoverProps}>
        <PopoverTrigger>
          {triggerElement}
        </PopoverTrigger>
        {popoverContent}
      </Popover>
    );

    return performance.usePortal ? (
      <Portal>
        {popoverElement}
      </Portal>
    ) : (
      popoverElement
    );
  }
);

HoverCardComponent.displayName = 'OptimizedHoverCard';

/**
 * Memoized OptimizedHoverCard export
 */
export const OptimizedHoverCard = React.memo(HoverCardComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof HoverCardProps)[] = [
    'trigger', 'content', 'placement'
  ];
  
  return keysToCompare.every(key => prevProps[key] === nextProps[key]);
});

// Default export
export default OptimizedHoverCard;