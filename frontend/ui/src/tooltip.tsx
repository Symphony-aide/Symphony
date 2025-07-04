import {
  Tooltip as ChakraTooltip,
  TooltipProps as ChakraTooltipProps,
  Portal,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { throttle, debounce } from 'lodash-es';
import React, { useMemo, useCallback, useState } from 'react';

/**
 * Tooltip placement options
 */
export type TooltipPlacement = 
  | 'top' | 'bottom' | 'left' | 'right'
  | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end'
  | 'left-start' | 'left-end' | 'right-start' | 'right-end';

/**
 * Performance optimization options for tooltip
 */
export interface TooltipPerformanceOptions {
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
 * Extended Tooltip props with optimization features
 */
export interface TooltipProps extends Omit<ChakraTooltipProps, 'placement'> {
  /** Tooltip content */
  content: React.ReactNode;
  /** Tooltip placement */
  placement?: TooltipPlacement;
  /** Show arrow */
  showArrow?: boolean;
  /** Performance optimization settings */
  performance?: TooltipPerformanceOptions;
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
 * @param originalHandler
 * @param debounceMs
 * @param throttleMs
 * @param analytics
 */
const useOptimizedHoverHandler = (
  originalHandler?: () => void,
  debounceMs?: number,
  throttleMs?: number,
  analytics?: TooltipProps['analytics']
) => {
  return useMemo(() => {
    if (!originalHandler) return undefined;

    let optimizedHandler = () => {
      // Track analytics
      if (analytics && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', analytics.action || 'tooltip_show', {
          event_category: analytics.category || 'tooltip',
          event_label: analytics.label,
        });
      }
      
      originalHandler();
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
  }, [originalHandler, debounceMs, throttleMs, analytics]);
};

/**
 * Tooltip hover hook
 * @param hoverDelay
 * @param hideDelay
 */
const useTooltipHover = (
  hoverDelay: number = 500,
  hideDelay: number = 100
) => {
  const [isOpen, setIsOpen] = useState(false);
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout>();
  const hideTimeoutRef = React.useRef<NodeJS.Timeout>();

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

  const handleTooltipMouseEnter = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
  }, []);

  const handleTooltipMouseLeave = useCallback(() => {
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
    handleTooltipMouseEnter,
    handleTooltipMouseLeave,
  };
};

/**
 * Animation variants for tooltip
 */
const tooltipAnimationVariants = {
  initial: { opacity: 0, scale: 0.95, y: 5 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 5 },
};

/**
 * Optimized Tooltip Component
 */
const TooltipComponent = React.forwardRef<HTMLDivElement, TooltipProps>(
  (
    {
      content,
      placement = 'top',
      showArrow = true,
      performance = { 
        memoize: true, 
        hoverDelay: 500, 
        hideDelay: 100,
        enableAnimations: true,
        usePortal: true
      },
      testId,
      analytics,
      children,
      isOpen: controlledIsOpen,
      onOpen: controlledOnOpen,
      onClose: controlledOnClose,
      ...rest
    },
    ref
  ) => {
    const {
      isOpen: hoverIsOpen,
      handleMouseEnter,
      handleMouseLeave,
      handleTooltipMouseEnter,
      handleTooltipMouseLeave,
    } = useTooltipHover(performance.hoverDelay, performance.hideDelay);

    // Determine open state
    const isOpen = controlledIsOpen ?? hoverIsOpen;

    // Optimized hover handlers
    const optimizedMouseEnter = useOptimizedHoverHandler(
      handleMouseEnter,
      performance.debounceHover,
      performance.throttleHover,
      analytics
    );

    // Memoized trigger element with hover handlers
    const triggerElement = useMemo(() => {
      if (!React.isValidElement(children)) {
        return children;
      }

      return React.cloneElement(children, {
        onMouseEnter: (event: React.MouseEvent) => {
          children.props.onMouseEnter?.(event);
          if (controlledIsOpen === undefined) {
            optimizedMouseEnter?.();
          }
          controlledOnOpen?.();
        },
        onMouseLeave: (event: React.MouseEvent) => {
          children.props.onMouseLeave?.(event);
          if (controlledIsOpen === undefined) {
            handleMouseLeave();
          }
          controlledOnClose?.();
        },
        'data-testid': `${testId}-trigger`,
      });
    }, [
      children,
      controlledIsOpen,
      optimizedMouseEnter,
      handleMouseLeave,
      controlledOnOpen,
      controlledOnClose,
      testId
    ]);

    // Memoized tooltip content
    const tooltipContent = useMemo(() => {
      if (!content || !isOpen) return null;

      const tooltipElement = (
        <div
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
          data-testid={`${testId}-content`}
        >
          {content}
        </div>
      );

      if (performance.enableAnimations) {
        const MotionDiv = motion.div;
        
        return (
          <AnimatePresence>
            <MotionDiv
              variants={tooltipAnimationVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.15, ease: "easeOut" }}
              onMouseEnter={handleTooltipMouseEnter}
              onMouseLeave={handleTooltipMouseLeave}
              data-testid={`${testId}-content`}
            >
              {content}
            </MotionDiv>
          </AnimatePresence>
        );
      }

      return tooltipElement;
    }, [
      content,
      isOpen,
      performance.enableAnimations,
      handleTooltipMouseEnter,
      handleTooltipMouseLeave,
      testId
    ]);

    // Memoized tooltip props
    const tooltipProps = useMemo(() => ({
      isOpen,
      placement,
      hasArrow: showArrow,
      label: tooltipContent,
      'data-testid': testId,
      ...rest,
    }), [isOpen, placement, showArrow, tooltipContent, testId, rest]);

    const tooltipElement = (
      <ChakraTooltip ref={ref} {...tooltipProps}>
        {triggerElement}
      </ChakraTooltip>
    );

    return performance.usePortal ? (
      <Portal>
        {tooltipElement}
      </Portal>
    ) : (
      tooltipElement
    );
  }
);

TooltipComponent.displayName = 'OptimizedTooltip';

/**
 * Memoized OptimizedTooltip export
 */
export const OptimizedTooltip = React.memo(TooltipComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof TooltipProps)[] = [
    'content', 'placement', 'showArrow', 'children', 'isOpen'
  ];
  
  return keysToCompare.every(key => prevProps[key] === nextProps[key]);
});

// Default export
export default OptimizedTooltip;