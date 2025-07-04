import React, { useMemo, useCallback } from 'react';
import {
  Alert as ChakraAlert,
  AlertIcon as ChakraAlertIcon,
  AlertTitle as ChakraAlertTitle,
  AlertDescription as ChakraAlertDescription,
  AlertProps as ChakraAlertProps,
  CloseButton,
  Box,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { throttle } from 'lodash-es';

/**
 * Alert status types
 */
export type AlertStatus = 'success' | 'error' | 'warning' | 'info' | 'loading';

/**
 * Alert variants
 */
export type AlertVariant = 'subtle' | 'solid' | 'left-accent' | 'top-accent' | 'outline';

/**
 * Performance optimization options for alert
 */
export interface AlertPerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Throttle dismiss events (ms) */
  throttleDismiss?: number;
  /** Enable animations */
  enableAnimations?: boolean;
  /** Auto-dismiss timeout (ms) */
  autoDismissTimeout?: number;
}

/**
 * Extended Alert props with optimization features
 */
export interface AlertProps extends Omit<ChakraAlertProps, 'status' | 'variant' | 'onClose'> {
  /** Alert status */
  status?: AlertStatus;
  /** Alert variant */
  variant?: AlertVariant;
  /** Whether the alert can be dismissed */
  dismissible?: boolean;
  /** Custom dismiss handler */
  onDismiss?: () => void;
  /** Performance optimization settings */
  performance?: AlertPerformanceOptions;
  /** Custom test ID */
  testId?: string;
  /** Alert title */
  title?: React.ReactNode;
  /** Alert description */
  description?: React.ReactNode;
  /** Custom icon */
  icon?: React.ReactElement;
  /** Analytics tracking */
  analytics?: {
    category?: string;
    action?: string;
    label?: string;
  };
}

/**
 * Optimized dismiss handler factory
 */
const useOptimizedDismissHandler = (
  originalOnDismiss?: () => void,
  throttleMs?: number,
  analytics?: AlertProps['analytics']
) => {
  return useMemo(() => {
    if (!originalOnDismiss) return undefined;

    let optimizedHandler = originalOnDismiss;

    // Add analytics tracking
    if (analytics) {
      const trackingHandler = () => {
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', analytics.action || 'alert_dismiss', {
            event_category: analytics.category || 'alert',
            event_label: analytics.label,
          });
        }
        originalOnDismiss();
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
  }, [originalOnDismiss, throttleMs, analytics]);
};

/**
 * Auto-dismiss hook
 */
const useAutoDismiss = (
  onDismiss?: () => void,
  timeout?: number,
  enabled: boolean = false
) => {
  React.useEffect(() => {
    if (!enabled || !onDismiss || !timeout) return;

    const timer = setTimeout(onDismiss, timeout);
    return () => clearTimeout(timer);
  }, [onDismiss, timeout, enabled]);
};

/**
 * Animation variants for alert
 */
const alertAnimationVariants = {
  initial: { opacity: 0, y: -20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.95 },
};

/**
 * Optimized Alert Component
 */
const AlertComponent = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      status = 'info',
      variant = 'subtle',
      dismissible = false,
      onDismiss,
      performance = { memoize: true, throttleDismiss: 300, enableAnimations: true },
      testId,
      title,
      description,
      icon,
      analytics,
      children,
      ...rest
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = React.useState(true);

    // Optimized dismiss handler
    const optimizedDismissHandler = useOptimizedDismissHandler(
      onDismiss,
      performance.throttleDismiss,
      analytics
    );

    // Internal dismiss handler
    const handleDismiss = useCallback(() => {
      setIsVisible(false);
      // Delay calling onDismiss to allow exit animation
      setTimeout(() => {
        optimizedDismissHandler?.();
      }, performance.enableAnimations ? 200 : 0);
    }, [optimizedDismissHandler, performance.enableAnimations]);

    // Auto-dismiss functionality
    useAutoDismiss(
      handleDismiss,
      performance.autoDismissTimeout,
      !!performance.autoDismissTimeout
    );

    // Memoized alert props
    const alertProps = useMemo(() => ({
      status: status === 'loading' ? 'info' : status,
      variant,
      'data-testid': testId,
      ...rest,
    }), [status, variant, testId, rest]);

    // Render alert content
    const alertContent = useMemo(() => (
      <ChakraAlert ref={ref} {...alertProps}>
        {icon || <ChakraAlertIcon />}
        <Box flex="1">
          {title && (
            <ChakraAlertTitle>
              {title}
            </ChakraAlertTitle>
          )}
          {description && (
            <ChakraAlertDescription>
              {description}
            </ChakraAlertDescription>
          )}
          {children}
        </Box>
        {dismissible && (
          <CloseButton
            alignSelf="flex-start"
            position="relative"
            right={-1}
            top={-1}
            onClick={handleDismiss}
            aria-label="Dismiss alert"
          />
        )}
      </ChakraAlert>
    ), [ref, alertProps, icon, title, description, children, dismissible, handleDismiss]);

    // Render with or without animations
    if (performance.enableAnimations) {
      return (
        <AnimatePresence mode="wait">
          {isVisible && (
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={alertAnimationVariants}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              {alertContent}
            </motion.div>
          )}
        </AnimatePresence>
      );
    }

    return isVisible ? alertContent : null;
  }
);

AlertComponent.displayName = 'OptimizedAlert';

/**
 * Memoized OptimizedAlert export for maximum performance
 */
export const OptimizedAlert = React.memo(AlertComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof AlertProps)[] = [
    'status', 'variant', 'title', 'description', 'dismissible', 'children'
  ];
  
  return keysToCompare.every(key => prevProps[key] === nextProps[key]);
});

// Re-export Chakra components for convenience
export const AlertIcon = ChakraAlertIcon;
export const AlertTitle = ChakraAlertTitle;
export const AlertDescription = ChakraAlertDescription;

// Default export
export default OptimizedAlert;