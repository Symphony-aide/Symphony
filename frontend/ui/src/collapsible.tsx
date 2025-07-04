import { Box, Collapse, BoxProps } from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { throttle, debounce } from 'lodash-es';
import React, { useMemo, useCallback, useState } from 'react';
import { useLocalStorage } from 'react-use';

/**
 * Collapsible animation types
 */
export type CollapsibleAnimation = 'slide' | 'fade' | 'scale' | 'none';

/**
 * Performance optimization options for collapsible
 */
export interface CollapsiblePerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Throttle toggle events (ms) */
  throttleToggle?: number;
  /** Debounce toggle events (ms) */
  debounceToggle?: number;
  /** Enable animations */
  enableAnimations?: boolean;
  /** Persist state */
  persistState?: boolean;
}

/**
 * Extended Collapsible props with optimization features
 */
export interface CollapsibleProps extends Omit<BoxProps, 'onToggle'> {
  /** Whether the collapsible is open */
  isOpen?: boolean;
  /** Default open state */
  defaultOpen?: boolean;
  /** Animation type */
  animation?: CollapsibleAnimation;
  /** Custom toggle handler */
  onToggle?: (isOpen: boolean) => void;
  /** Performance optimization settings */
  performance?: CollapsiblePerformanceOptions;
  /** Storage key for state persistence */
  storageKey?: string;
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
 * Collapsible trigger props
 */
export interface CollapsibleTriggerProps extends BoxProps {
  /** Custom test ID */
  testId?: string;
}

/**
 * Collapsible content props
 */
export interface CollapsibleContentProps extends BoxProps {
  /** Custom test ID */
  testId?: string;
}

/**
 * Optimized toggle handler factory
 * @param originalOnToggle
 * @param throttleMs
 * @param debounceMs
 * @param analytics
 */
const useOptimizedToggleHandler = (
  originalOnToggle?: (isOpen: boolean) => void,
  throttleMs?: number,
  debounceMs?: number,
  analytics?: CollapsibleProps['analytics']
) => {
  return useMemo(() => {
    if (!originalOnToggle) return undefined;

    let optimizedHandler = (isOpen: boolean) => {
      // Track analytics
      if (analytics && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', analytics.action || 'collapsible_toggle', {
          event_category: analytics.category || 'collapsible',
          event_label: analytics.label,
          value: isOpen ? 1 : 0,
        });
      }
      
      originalOnToggle(isOpen);
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
  }, [originalOnToggle, throttleMs, debounceMs, analytics]);
};

/**
 * Animation variants for collapsible content
 */
const collapsibleVariants = {
  slide: {
    initial: { height: 0, opacity: 0 },
    animate: { height: 'auto', opacity: 1 },
    exit: { height: 0, opacity: 0 },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  scale: {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.95, opacity: 0 },
  },
  none: {
    initial: {},
    animate: {},
    exit: {},
  },
};

/**
 * Collapsible context
 */
interface CollapsibleContextValue {
  isOpen: boolean;
  toggle: () => void;
  animation: CollapsibleAnimation;
  enableAnimations: boolean;
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(null);

/**
 * Hook to use collapsible context
 */
const useCollapsible = () => {
  const context = React.useContext(CollapsibleContext);
  if (!context) {
    throw new Error('useCollapsible must be used within a Collapsible component');
  }
  return context;
};

/**
 * Optimized Collapsible Component
 */
const CollapsibleComponent = React.forwardRef<HTMLDivElement, CollapsibleProps>(
  (
    {
      isOpen: controlledIsOpen,
      defaultOpen = false,
      animation = 'slide',
      onToggle,
      performance = { memoize: true, throttleToggle: 100, enableAnimations: true },
      storageKey,
      testId,
      analytics,
      children,
      ...rest
    },
    ref
  ) => {
    // State persistence
    const [persistedOpen, setPersistedOpen] = useLocalStorage<boolean>(
      storageKey || 'collapsible-open',
      defaultOpen
    );

    // Internal state
    const [internalIsOpen, setInternalIsOpen] = useState(
      controlledIsOpen ?? (performance.persistState && storageKey ? persistedOpen : defaultOpen)
    );

    // Determine current open state
    const isOpen = controlledIsOpen ?? internalIsOpen;

    // Optimized toggle handler
    const optimizedToggleHandler = useOptimizedToggleHandler(
      onToggle,
      performance.throttleToggle,
      performance.debounceToggle,
      analytics
    );

    // Toggle function
    const toggle = useCallback(() => {
      const newIsOpen = !isOpen;
      
      if (controlledIsOpen === undefined) {
        setInternalIsOpen(newIsOpen);
      }
      
      if (performance.persistState && storageKey) {
        setPersistedOpen(newIsOpen);
      }
      
      optimizedToggleHandler?.(newIsOpen);
    }, [isOpen, controlledIsOpen, optimizedToggleHandler, performance.persistState, storageKey, setPersistedOpen]);

    // Memoized context value
    const contextValue = useMemo(() => ({
      isOpen,
      toggle,
      animation,
      enableAnimations: performance.enableAnimations || false,
    }), [isOpen, toggle, animation, performance.enableAnimations]);

    // Memoized collapsible props
    const collapsibleProps = useMemo(() => ({
      'data-testid': testId,
      'data-state': isOpen ? 'open' : 'closed',
      ...rest,
    }), [testId, isOpen, rest]);

    return (
      <CollapsibleContext.Provider value={contextValue}>
        <Box ref={ref} {...collapsibleProps}>
          {children}
        </Box>
      </CollapsibleContext.Provider>
    );
  }
);

CollapsibleComponent.displayName = 'OptimizedCollapsible';

/**
 * Optimized CollapsibleTrigger Component
 */
const CollapsibleTriggerComponent = React.forwardRef<HTMLDivElement, CollapsibleTriggerProps>(
  ({ testId, children, onClick, ...rest }, ref) => {
    const { toggle, isOpen } = useCollapsible();

    const handleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
      toggle();
      onClick?.(event);
    }, [toggle, onClick]);

    const triggerProps = useMemo(() => ({
      'data-testid': testId,
      'data-state': isOpen ? 'open' : 'closed',
      'aria-expanded': isOpen,
      role: 'button',
      tabIndex: 0,
      cursor: 'pointer',
      onClick: handleClick,
      onKeyDown: (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggle();
        }
      },
      ...rest,
    }), [testId, isOpen, handleClick, toggle, rest]);

    return (
      <Box ref={ref} {...triggerProps}>
        {children}
      </Box>
    );
  }
);

CollapsibleTriggerComponent.displayName = 'OptimizedCollapsibleTrigger';

/**
 * Optimized CollapsibleContent Component
 */
const CollapsibleContentComponent = React.forwardRef<HTMLDivElement, CollapsibleContentProps>(
  ({ testId, children, ...rest }, ref) => {
    const { isOpen, animation, enableAnimations } = useCollapsible();

    const contentProps = useMemo(() => ({
      'data-testid': testId,
      'data-state': isOpen ? 'open' : 'closed',
      ...rest,
    }), [testId, isOpen, rest]);

    if (enableAnimations && animation !== 'none') {
      const variants = collapsibleVariants[animation];
      const MotionBox = motion(Box);

      return (
        <AnimatePresence initial={false}>
          {isOpen && (
            <MotionBox
              ref={ref}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={variants}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              {...contentProps}
            >
              {children}
            </MotionBox>
          )}
        </AnimatePresence>
      );
    }

    // Fallback to Chakra's Collapse for non-animated version
    return (
      <Collapse in={isOpen} animateOpacity>
        <Box ref={ref} {...contentProps}>
          {children}
        </Box>
      </Collapse>
    );
  }
);

CollapsibleContentComponent.displayName = 'OptimizedCollapsibleContent';

// Memoized exports
export const OptimizedCollapsible = React.memo(CollapsibleComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof CollapsibleProps)[] = [
    'isOpen', 'animation', 'children'
  ];
  
  return keysToCompare.every(key => prevProps[key] === nextProps[key]);
});

export const OptimizedCollapsibleTrigger = React.memo(CollapsibleTriggerComponent);
export const OptimizedCollapsibleContent = React.memo(CollapsibleContentComponent);

// Default exports
export default OptimizedCollapsible;
export { OptimizedCollapsibleTrigger as CollapsibleTrigger };
export { OptimizedCollapsibleContent as CollapsibleContent };