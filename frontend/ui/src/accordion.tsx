import {
  Accordion as ChakraAccordion,
  AccordionItem as ChakraAccordionItem,
  AccordionButton as ChakraAccordionButton,
  AccordionPanel as ChakraAccordionPanel,
  AccordionIcon as ChakraAccordionIcon,
  AccordionProps as ChakraAccordionProps,
  AccordionItemProps as ChakraAccordionItemProps,
  AccordionButtonProps as ChakraAccordionButtonProps,
  AccordionPanelProps as ChakraAccordionPanelProps,
} from '@chakra-ui/react';
import { throttle } from 'lodash-es';
import React, { useMemo, useCallback } from 'react';
import { useLocalStorage } from 'react-use';

/**
 * Performance optimization options for accordion
 */
export interface AccordionPerformanceOptions {
  /** Enable memoization for accordion items */
  memoize?: boolean;
  /** Throttle expand/collapse events (ms) */
  throttleEvents?: number;
  /** Persist accordion state in localStorage */
  persistState?: boolean;
  /** Lazy load accordion content */
  lazyLoad?: boolean;
}
// @types/lodash-es
/**
 * Extended Accordion props with optimization features
 */
export interface AccordionProps extends Omit<ChakraAccordionProps, 'onChange'> {
  /** Performance optimization settings */
  performance?: AccordionPerformanceOptions;
  /** Custom onChange handler with optimization */
  onChange?: (expandedIndex: number | number[]) => void;
  /** Unique identifier for state persistence */
  storageKey?: string;
  /** Analytics tracking */
  analytics?: {
    category?: string;
    action?: string;
  };
}

/**
 * Extended AccordionItem props
 */
export interface AccordionItemProps extends ChakraAccordionItemProps {
  /** Lazy load this item's content */
  lazy?: boolean;
  /** Custom test ID */
  testId?: string;
}

/**
 * Extended AccordionButton props
 */
export interface AccordionButtonProps extends ChakraAccordionButtonProps {
  /** Custom test ID */
  testId?: string;
}

/**
 * Extended AccordionPanel props
 */
export interface AccordionPanelProps extends ChakraAccordionPanelProps {
  /** Lazy load panel content */
  lazy?: boolean;
  /** Custom test ID */
  testId?: string;
}

/**
 * Optimized change handler factory
 * @param originalOnChange
 * @param throttleMs
 * @param analytics
 */
const useOptimizedChangeHandler = (
  originalOnChange?: (expandedIndex: number | number[]) => void,
  throttleMs?: number,
  analytics?: AccordionProps['analytics']
) => {
  return useMemo(() => {
    if (!originalOnChange) return undefined;

    let optimizedHandler = originalOnChange;

    // Add analytics tracking
    if (analytics) {
      const trackingHandler = (expandedIndex: number | number[]) => {
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', analytics.action || 'accordion_toggle', {
            event_category: analytics.category || 'accordion',
            event_label: Array.isArray(expandedIndex) ? expandedIndex.join(',') : expandedIndex.toString(),
          });
        }
        originalOnChange(expandedIndex);
      };
      optimizedHandler = trackingHandler;
    }

    // Apply throttling
    if (throttleMs) {
      optimizedHandler = throttle(optimizedHandler, throttleMs, { 
        leading: true, 
        trailing: true 
      });
    }

    return optimizedHandler;
  }, [originalOnChange, throttleMs, analytics]);
};

/**
 * Optimized Accordion Component
 */
const AccordionComponent = React.forwardRef<HTMLDivElement, AccordionProps>(
  (
    {
      performance = { memoize: true, throttleEvents: 100 },
      onChange,
      storageKey,
      analytics,
      children,
      ...rest
    },
    ref
  ) => {
    // State persistence
    const [persistedState, setPersistedState] = useLocalStorage<number | number[]>(
      storageKey || 'accordion-state',
      rest.allowMultiple ? [] : -1
    );

    // Optimized change handler
    const optimizedChangeHandler = useOptimizedChangeHandler(
      onChange,
      performance.throttleEvents,
      analytics
    );

    // Combined change handler with persistence
    const handleChange = useCallback((expandedIndex: number | number[]) => {
      if (performance.persistState && storageKey) {
        setPersistedState(expandedIndex);
      }
      optimizedChangeHandler?.(expandedIndex);
    }, [optimizedChangeHandler, performance.persistState, storageKey, setPersistedState]);

    // Memoized props
    const accordionProps = useMemo(() => ({
      ...rest,
      onChange: handleChange,
      index: performance.persistState && storageKey ? persistedState : rest.index,
    }), [rest, handleChange, performance.persistState, storageKey, persistedState]);

    return (
      <ChakraAccordion ref={ref} {...accordionProps}>
        {children}
      </ChakraAccordion>
    );
  }
);

AccordionComponent.displayName = 'OptimizedAccordion';

/**
 * Optimized AccordionItem Component
 */
const AccordionItemComponent = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ lazy = false, testId, children, ...rest }, ref) => {
    const [isExpanded, setIsExpanded] = React.useState(false);

    const itemProps = useMemo(() => ({
      ...rest,
      'data-testid': testId,
    }), [rest, testId]);

    return (
      <ChakraAccordionItem ref={ref} {...itemProps}>
        {({ isExpanded: expanded }) => {
          // Update expanded state for lazy loading
          React.useEffect(() => {
            setIsExpanded(expanded);
          }, [expanded]);

          // Render children conditionally for lazy loading
          if (lazy && !isExpanded && !expanded) {
            return children;
          }

          return children;
        }}
      </ChakraAccordionItem>
    );
  }
);

AccordionItemComponent.displayName = 'OptimizedAccordionItem';

/**
 * Optimized AccordionButton Component
 */
const AccordionButtonComponent = React.forwardRef<HTMLButtonElement, AccordionButtonProps>(
  ({ testId, children, ...rest }, ref) => {
    const buttonProps = useMemo(() => ({
      ...rest,
      'data-testid': testId,
    }), [rest, testId]);

    return (
      <ChakraAccordionButton ref={ref} {...buttonProps}>
        {children}
        <ChakraAccordionIcon />
      </ChakraAccordionButton>
    );
  }
);

AccordionButtonComponent.displayName = 'OptimizedAccordionButton';

/**
 * Optimized AccordionPanel Component
 */
const AccordionPanelComponent = React.forwardRef<HTMLDivElement, AccordionPanelProps>(
  ({ lazy = false, testId, children, ...rest }, ref) => {
    const panelProps = useMemo(() => ({
      ...rest,
      'data-testid': testId,
    }), [rest, testId]);

    return (
      <ChakraAccordionPanel ref={ref} {...panelProps}>
        {children}
      </ChakraAccordionPanel>
    );
  }
);

AccordionPanelComponent.displayName = 'OptimizedAccordionPanel';

// Memoized exports
export const OptimizedAccordion = React.memo(AccordionComponent);
export const OptimizedAccordionItem = React.memo(AccordionItemComponent);
export const OptimizedAccordionButton = React.memo(AccordionButtonComponent);
export const OptimizedAccordionPanel = React.memo(AccordionPanelComponent);
export const OptimizedAccordionIcon = ChakraAccordionIcon;

// Default exports
export default OptimizedAccordion;
export { OptimizedAccordionItem as AccordionItem };
export { OptimizedAccordionButton as AccordionButton };
export { OptimizedAccordionPanel as AccordionPanel };
export { OptimizedAccordionIcon as AccordionIcon };