import React, { useMemo, useCallback, useState } from 'react';
import {
  Popover as ChakraPopover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverFooter,
  PopoverArrow,
  PopoverCloseButton,
  PopoverProps as ChakraPopoverProps,
  Portal,
  useDisclosure,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { throttle, debounce } from 'lodash-es';

/**
 * Popover placement options
 */
export type PopoverPlacement = 
  | 'top' | 'bottom' | 'left' | 'right'
  | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end'
  | 'left-start' | 'left-end' | 'right-start' | 'right-end';

/**
 * Popover trigger types
 */
export type PopoverTrigger = 'click' | 'hover' | 'focus';

/**
 * Performance optimization options for popover
 */
export interface PopoverPerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Throttle trigger events (ms) */
  throttleTrigger?: number;
  /** Debounce hover events (ms) */
  debounceHover?: number;
  /** Enable animations */
  enableAnimations?: boolean;
  /** Lazy load popover content */
  lazyLoad?: boolean;
  /** Use portal */
  usePortal?: boolean;
  /** Close on blur */
  closeOnBlur?: boolean;
  /** Close on escape */
  closeOnEsc?: boolean;
}

/**
 * Extended Popover props with optimization features
 */
export interface PopoverProps extends Omit<ChakraPopoverProps, 'children' | 'trigger'> {
  /** Trigger element */
  trigger: React.ReactElement;
  /** Popover content */
  content: React.ReactNode;
  /** Popover header */
  header?: React.ReactNode;
  /** Popover footer */
  footer?: React.ReactNode;
  /** Popover placement */
  placement?: PopoverPlacement;
  /** Trigger type */
  triggerType?: PopoverTrigger;
  /** Show arrow */
  showArrow?: boolean;
  /** Show close button */
  showCloseButton?: boolean;
  /** Performance optimization settings */
  performance?: PopoverPerformanceOptions;
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
 * Optimized trigger handler factory
 */
const useOptimizedTriggerHandler = (
  originalHandler?: () => void,
  throttleMs?: number,
  debounceMs?: number,
  analytics?: PopoverProps['analytics']
) => {
  return useMemo(() => {
    if (!originalHandler) return undefined;

    let optimizedHandler = () => {
      // Track analytics
      if (analytics && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', analytics.action || 'popover_trigger', {
          event_category: analytics.category || 'popover',
          event_label: analytics.label,
        });
      }
      
      originalHandler();
    };

    // Apply throttling
    if (throttleMs) {
      optimizedHandler = throttle(optimizedHandler, throttleMs, { 
        leading: true, 
        trailing: false 
      });
    }

    // Apply debouncing
    if (debounceMs) {
      optimizedHandler = debounce(optimizedHandler, debounceMs);
    }

    return optimizedHandler;
  }, [originalHandler, throttleMs, debounceMs, analytics]);
};

/**
 * Hover popover hook
 */
const useHoverPopover = (
  isOpen: boolean,
  onOpen: () => void,
  onClose: () => void,
  hoverDelay: number = 200,
  hideDelay: number = 100
) => {
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout>();
  const hideTimeoutRef = React.useRef<NodeJS.Timeout>();

  const handleMouseEnter = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    
    if (!isOpen) {
      hoverTimeoutRef.current = setTimeout(onOpen, hoverDelay);
    }
  }, [isOpen, onOpen, hoverDelay]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    if (isOpen) {
      hideTimeoutRef.current = setTimeout(onClose, hideDelay);
    }
  }, [isOpen, onClose, hideDelay]);

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

  return { handleMouseEnter, handleMouseLeave };
};

/**
 * Animation variants for popover
 */
const popoverAnimationVariants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 10 },
};

/**
 * Optimized Popover Component
 */
const PopoverComponent = React.forwardRef<HTMLDivElement, PopoverProps>(
  (
    {
      trigger,
      content,
      header,
      footer,
      placement = 'bottom',
      triggerType = 'click',
      showArrow = true,
      showCloseButton = true,
      performance = { 
        memoize: true, 
        throttleTrigger: 100,
        debounceHover: 200,
        enableAnimations: true,
        usePortal: true,
        closeOnBlur: true,
        closeOnEsc: true
      },
      testId,
      analytics,
      isOpen: controlledIsOpen,
      onOpen: controlledOnOpen,
      onClose: controlledOnClose,
      ...rest
    },
    ref
  ) => {
    const { isOpen: disclosureIsOpen, onOpen: disclosureOnOpen, onClose: disclosureOnClose } = useDisclosure();

    // Determine open state and handlers
    const isOpen = controlledIsOpen ?? disclosureIsOpen;
    const onOpen = controlledOnOpen ?? disclosureOnOpen;
    const onClose = controlledOnClose ?? disclosureOnClose;

    // Optimized trigger handlers
    const optimizedOpenHandler = useOptimizedTriggerHandler(
      onOpen,
      performance.throttleTrigger,
      undefined,
      analytics
    );

    const optimizedCloseHandler = useOptimizedTriggerHandler(
      onClose,
      performance.throttleTrigger,
      undefined,
      analytics
    );

    // Hover functionality
    const { handleMouseEnter, handleMouseLeave } = useHoverPopover(
      isOpen,
      optimizedOpenHandler || (() => {}),
      optimizedCloseHandler || (() => {}),
      200,
      100
    );

    // Memoized trigger element with event handlers
    const triggerElement = useMemo(() => {
      const triggerProps: any = {
        'data-testid': `${testId}-trigger`,
      };

      switch (triggerType) {
        case 'click':
          triggerProps.onClick = (event: React.MouseEvent) => {
            trigger.props.onClick?.(event);
            if (isOpen) {
              optimizedCloseHandler?.();
            } else {
              optimizedOpenHandler?.();
            }
          };
          break;
        case 'hover':
          triggerProps.onMouseEnter = (event: React.MouseEvent) => {
            trigger.props.onMouseEnter?.(event);
            handleMouseEnter();
          };
          triggerProps.onMouseLeave = (event: React.MouseEvent) => {
            trigger.props.onMouseLeave?.(event);
            handleMouseLeave();
          };
          break;
        case 'focus':
          triggerProps.onFocus = (event: React.FocusEvent) => {
            trigger.props.onFocus?.(event);
            optimizedOpenHandler?.();
          };
          triggerProps.onBlur = (event: React.FocusEvent) => {
            trigger.props.onBlur?.(event);
            if (performance.closeOnBlur) {
              optimizedCloseHandler?.();
            }
          };
          break;
      }

      return React.cloneElement(trigger, triggerProps);
    }, [
      trigger,
      triggerType,
      testId,
      isOpen,
      optimizedOpenHandler,
      optimizedCloseHandler,
      handleMouseEnter,
      handleMouseLeave,
      performance.closeOnBlur
    ]);

    // Memoized popover content
    const popoverContent = useMemo(() => {
      if (performance.lazyLoad && !isOpen) {
        return null;
      }

      const contentElement = (
        <PopoverContent
          data-testid={`${testId}-content`}
          onMouseEnter={triggerType === 'hover' ? handleMouseEnter : undefined}
          onMouseLeave={triggerType === 'hover' ? handleMouseLeave : undefined}
        >
          {showArrow && <PopoverArrow />}
          {showCloseButton && <PopoverCloseButton />}
          
          {header && (
            <PopoverHeader>
              {header}
            </PopoverHeader>
          )}
          
          <PopoverBody>
            {content}
          </PopoverBody>
          
          {footer && (
            <PopoverFooter>
              {footer}
            </PopoverFooter>
          )}
        </PopoverContent>
      );

      if (performance.enableAnimations) {
        const MotionPopoverContent = motion(PopoverContent);
        
        return (
          <AnimatePresence>
            {isOpen && (
              <MotionPopoverContent
                variants={popoverAnimationVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.15, ease: "easeOut" }}
                data-testid={`${testId}-content`}
                onMouseEnter={triggerType === 'hover' ? handleMouseEnter : undefined}
                onMouseLeave={triggerType === 'hover' ? handleMouseLeave : undefined}
              >
                {showArrow && <PopoverArrow />}
                {showCloseButton && <PopoverCloseButton />}
                
                {header && (
                  <PopoverHeader>
                    {header}
                  </PopoverHeader>
                )}
                
                <PopoverBody>
                  {content}
                </PopoverBody>
                
                {footer && (
                  <PopoverFooter>
                    {footer}
                  </PopoverFooter>
                )}
              </MotionPopoverContent>
            )}
          </AnimatePresence>
        );
      }

      return isOpen ? contentElement : null;
    }, [
      performance.lazyLoad,
      performance.enableAnimations,
      isOpen,
      testId,
      triggerType,
      handleMouseEnter,
      handleMouseLeave,
      showArrow,
      showCloseButton,
      header,
      content,
      footer
    ]);

    // Memoized popover props
    const popoverProps = useMemo(() => ({
      isOpen,
      onOpen,
      onClose,
      placement,
      closeOnBlur: performance.closeOnBlur,
      closeOnEsc: performance.closeOnEsc,
      'data-testid': testId,
      ...rest,
    }), [
      isOpen,
      onOpen,
      onClose,
      placement,
      performance.closeOnBlur,
      performance.closeOnEsc,
      testId,
      rest
    ]);

    const popoverElement = (
      <ChakraPopover ref={ref} {...popoverProps}>
        <PopoverTrigger>
          {triggerElement}
        </PopoverTrigger>
        {popoverContent}
      </ChakraPopover>
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

PopoverComponent.displayName = 'OptimizedPopover';

/**
 * Memoized OptimizedPopover export
 */
export const OptimizedPopover = React.memo(PopoverComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof PopoverProps)[] = [
    'trigger', 'content', 'header', 'footer', 'placement', 'triggerType', 'isOpen'
  ];
  
  return keysToCompare.every(key => prevProps[key] === nextProps[key]);
});

// Default export
export default OptimizedPopover;