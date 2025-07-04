import {
  AlertDialog as ChakraAlertDialog,
  AlertDialogBody as ChakraAlertDialogBody,
  AlertDialogFooter as ChakraAlertDialogFooter,
  AlertDialogHeader as ChakraAlertDialogHeader,
  AlertDialogContent as ChakraAlertDialogContent,
  AlertDialogOverlay as ChakraAlertDialogOverlay,
  AlertDialogCloseButton as ChakraAlertDialogCloseButton,
  AlertDialogProps as ChakraAlertDialogProps,
  useDisclosure,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { throttle } from 'lodash-es';
import React, { useMemo, useCallback } from 'react';

/**
 * Alert dialog sizes
 */
export type AlertDialogSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

/**
 * Performance optimization options for alert dialog
 */
export interface AlertDialogPerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Throttle action events (ms) */
  throttleActions?: number;
  /** Enable animations */
  enableAnimations?: boolean;
  /** Lazy load dialog content */
  lazyLoad?: boolean;
}

/**
 * Extended AlertDialog props with optimization features
 */
export interface AlertDialogProps extends Omit<ChakraAlertDialogProps, 'onClose'> {
  /** Dialog size */
  size?: AlertDialogSize;
  /** Dialog title */
  title?: React.ReactNode;
  /** Dialog description */
  description?: React.ReactNode;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Confirm button color scheme */
  confirmColorScheme?: string;
  /** Cancel button variant */
  cancelVariant?: string;
  /** Custom confirm handler */
  onConfirm?: () => void | Promise<void>;
  /** Custom cancel handler */
  onCancel?: () => void;
  /** Custom close handler */
  onClose?: () => void;
  /** Performance optimization settings */
  performance?: AlertDialogPerformanceOptions;
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
 * Optimized action handler factory
 * @param originalHandler
 * @param throttleMs
 * @param analytics
 * @param actionType
 */
const useOptimizedActionHandler = (
  originalHandler?: () => void | Promise<void>,
  throttleMs?: number,
  analytics?: AlertDialogProps['analytics'],
  actionType?: string
) => {
  return useMemo(() => {
    if (!originalHandler) return undefined;

    let optimizedHandler = async () => {
      // Track analytics
      if (analytics && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', analytics.action || `alert_dialog_${actionType}`, {
          event_category: analytics.category || 'alert_dialog',
          event_label: analytics.label,
        });
      }
      
      await originalHandler();
    };

    // Apply throttling
    if (throttleMs) {
      optimizedHandler = throttle(optimizedHandler, throttleMs, { 
        leading: true, 
        trailing: false 
      });
    }

    return optimizedHandler;
  }, [originalHandler, throttleMs, analytics, actionType]);
};

/**
 * Animation variants for alert dialog
 */
const alertDialogAnimationVariants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

/**
 * Optimized AlertDialog Component
 */
const AlertDialogComponent = React.forwardRef<HTMLDivElement, AlertDialogProps>(
  (
    {
      size = 'md',
      title,
      description,
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      confirmColorScheme = 'red',
      cancelVariant = 'outline',
      onConfirm,
      onCancel,
      onClose,
      performance = { memoize: true, throttleActions: 300, enableAnimations: true },
      testId,
      analytics,
      children,
      ...rest
    },
    ref
  ) => {
    const [isLoading, setIsLoading] = React.useState(false);
    const cancelRef = React.useRef<HTMLButtonElement>(null);

    // Optimized action handlers
    const optimizedConfirmHandler = useOptimizedActionHandler(
      onConfirm,
      performance.throttleActions,
      analytics,
      'confirm'
    );

    const optimizedCancelHandler = useOptimizedActionHandler(
      onCancel,
      performance.throttleActions,
      analytics,
      'cancel'
    );

    // Handle confirm with loading state
    const handleConfirm = useCallback(async () => {
      if (!optimizedConfirmHandler) return;
      
      setIsLoading(true);
      try {
        await optimizedConfirmHandler();
        onClose?.();
      } catch (error) {
        console.error('Alert dialog confirm error:', error);
      } finally {
        setIsLoading(false);
      }
    }, [optimizedConfirmHandler, onClose]);

    // Handle cancel
    const handleCancel = useCallback(() => {
      optimizedCancelHandler?.();
      onClose?.();
    }, [optimizedCancelHandler, onClose]);

    // Memoized dialog props
    const dialogProps = useMemo(() => ({
      size,
      leastDestructiveRef: cancelRef,
      onClose: onClose || (() => {}),
      'data-testid': testId,
      ...rest,
    }), [size, onClose, testId, rest]);

    // Render dialog content
    const dialogContent = useMemo(() => (
      <ChakraAlertDialogContent>
        {performance.enableAnimations ? (
          <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={alertDialogAnimationVariants}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <ChakraAlertDialogHeader fontSize="lg" fontWeight="bold">
              {title}
            </ChakraAlertDialogHeader>

            <ChakraAlertDialogBody>
              {description}
              {children}
            </ChakraAlertDialogBody>

            <ChakraAlertDialogFooter>
              <button
                ref={cancelRef}
                onClick={handleCancel}
                disabled={isLoading}
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                style={{ marginLeft: 8 }}
              >
                {isLoading ? 'Loading...' : confirmText}
              </button>
            </ChakraAlertDialogFooter>
          </motion.div>
        ) : (
          <>
            <ChakraAlertDialogHeader fontSize="lg" fontWeight="bold">
              {title}
            </ChakraAlertDialogHeader>

            <ChakraAlertDialogBody>
              {description}
              {children}
            </ChakraAlertDialogBody>

            <ChakraAlertDialogFooter>
              <button
                ref={cancelRef}
                onClick={handleCancel}
                disabled={isLoading}
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                style={{ marginLeft: 8 }}
              >
                {isLoading ? 'Loading...' : confirmText}
              </button>
            </ChakraAlertDialogFooter>
          </>
        )}
      </ChakraAlertDialogContent>
    ), [
      performance.enableAnimations,
      title,
      description,
      children,
      handleCancel,
      handleConfirm,
      cancelText,
      confirmText,
      isLoading
    ]);

    return (
      <ChakraAlertDialog ref={ref} {...dialogProps}>
        <ChakraAlertDialogOverlay>
          {dialogContent}
        </ChakraAlertDialogOverlay>
      </ChakraAlertDialog>
    );
  }
);

AlertDialogComponent.displayName = 'OptimizedAlertDialog';

/**
 * Memoized OptimizedAlertDialog export
 */
export const OptimizedAlertDialog = React.memo(AlertDialogComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof AlertDialogProps)[] = [
    'size', 'title', 'description', 'confirmText', 'cancelText', 'isOpen'
  ];
  
  return keysToCompare.every(key => prevProps[key] === nextProps[key]);
});

// Re-export Chakra components for convenience
export const AlertDialogBody = ChakraAlertDialogBody;
export const AlertDialogFooter = ChakraAlertDialogFooter;
export const AlertDialogHeader = ChakraAlertDialogHeader;
export const AlertDialogContent = ChakraAlertDialogContent;
export const AlertDialogOverlay = ChakraAlertDialogOverlay;
export const AlertDialogCloseButton = ChakraAlertDialogCloseButton;

// Default export
export default OptimizedAlertDialog;