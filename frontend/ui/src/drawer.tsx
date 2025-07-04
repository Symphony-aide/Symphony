import {
  Drawer as ChakraDrawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerProps as ChakraDrawerProps,
  Button,
  useDisclosure,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { throttle } from 'lodash-es';
import React, { useMemo, useCallback, useState } from 'react';

/**
 * Drawer placement options
 */
export type DrawerPlacement = 'top' | 'right' | 'bottom' | 'left';

/**
 * Drawer sizes
 */
export type DrawerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

/**
 * Performance optimization options for drawer
 */
export interface DrawerPerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Throttle action events (ms) */
  throttleActions?: number;
  /** Enable animations */
  enableAnimations?: boolean;
  /** Lazy load drawer content */
  lazyLoad?: boolean;
  /** Close on overlay click */
  closeOnOverlayClick?: boolean;
  /** Close on escape key */
  closeOnEsc?: boolean;
}

/**
 * Extended Drawer props with optimization features
 */
export interface DrawerProps extends Omit<ChakraDrawerProps, 'children' | 'onClose'> {
  /** Drawer placement */
  placement?: DrawerPlacement;
  /** Drawer size */
  size?: DrawerSize;
  /** Drawer title */
  title?: React.ReactNode;
  /** Drawer description */
  description?: React.ReactNode;
  /** Footer actions */
  actions?: React.ReactNode;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Confirm button color scheme */
  confirmColorScheme?: string;
  /** Custom confirm handler */
  onConfirm?: () => void | Promise<void>;
  /** Custom cancel handler */
  onCancel?: () => void;
  /** Custom close handler */
  onClose?: () => void;
  /** Performance optimization settings */
  performance?: DrawerPerformanceOptions;
  /** Custom test ID */
  testId?: string;
  /** Analytics tracking */
  analytics?: {
    category?: string;
    action?: string;
    label?: string;
  };
  /** Drawer content */
  children?: React.ReactNode;
}

/**
 * Drawer trigger props
 */
export interface DrawerTriggerProps {
  /** Trigger element */
  children: React.ReactElement;
  /** Custom test ID */
  testId?: string;
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
  analytics?: DrawerProps['analytics'],
  actionType?: string
) => {
  return useMemo(() => {
    if (!originalHandler) return undefined;

    let optimizedHandler = async () => {
      // Track analytics
      if (analytics && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', analytics.action || `drawer_${actionType}`, {
          event_category: analytics.category || 'drawer',
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
 * Animation variants for drawer based on placement
 * @param placement
 */
const getDrawerAnimationVariants = (placement: DrawerPlacement) => {
  const variants = {
    top: {
      initial: { y: '-100%', opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: '-100%', opacity: 0 },
    },
    right: {
      initial: { x: '100%', opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: '100%', opacity: 0 },
    },
    bottom: {
      initial: { y: '100%', opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: '100%', opacity: 0 },
    },
    left: {
      initial: { x: '-100%', opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: '-100%', opacity: 0 },
    },
  };

  return variants[placement];
};

/**
 * Drawer context
 */
interface DrawerContextValue {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  performance: DrawerPerformanceOptions;
}

const DrawerContext = React.createContext<DrawerContextValue | null>(null);

/**
 * Hook to use drawer context
 */
const useDrawer = () => {
  const context = React.useContext(DrawerContext);
  if (!context) {
    throw new Error('useDrawer must be used within a Drawer component');
  }
  return context;
};

/**
 * Optimized Drawer Component
 */
const DrawerComponent = React.forwardRef<HTMLDivElement, DrawerProps>(
  (
    {
      placement = 'right',
      size = 'md',
      title,
      description,
      actions,
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      confirmColorScheme = 'blue',
      onConfirm,
      onCancel,
      onClose,
      performance = { 
        memoize: true, 
        throttleActions: 300, 
        enableAnimations: true,
        closeOnOverlayClick: true,
        closeOnEsc: true
      },
      testId,
      analytics,
      children,
      isOpen: controlledIsOpen,
      ...rest
    },
    ref
  ) => {
    const { isOpen: disclosureIsOpen, onOpen, onClose: disclosureOnClose } = useDisclosure();
    const [isLoading, setIsLoading] = useState(false);

    // Determine open state
    const isOpen = controlledIsOpen ?? disclosureIsOpen;
    const handleClose = onClose || disclosureOnClose;

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
        handleClose();
      } catch (error) {
        console.error('Drawer confirm error:', error);
      } finally {
        setIsLoading(false);
      }
    }, [optimizedConfirmHandler, handleClose]);

    // Handle cancel
    const handleCancel = useCallback(() => {
      optimizedCancelHandler?.();
      handleClose();
    }, [optimizedCancelHandler, handleClose]);

    // Memoized context value
    const contextValue = useMemo(() => ({
      isOpen,
      onOpen,
      onClose: handleClose,
      performance,
    }), [isOpen, onOpen, handleClose, performance]);

    // Memoized drawer props
    const drawerProps = useMemo(() => ({
      placement,
      size,
      isOpen,
      onClose: handleClose,
      closeOnOverlayClick: performance.closeOnOverlayClick,
      closeOnEsc: performance.closeOnEsc,
      'data-testid': testId,
      ...rest,
    }), [placement, size, isOpen, handleClose, performance, testId, rest]);

    // Render drawer content
    const drawerContent = useMemo(() => {
      if (performance.lazyLoad && !isOpen) {
        return null;
      }

      const content = (
        <DrawerContent>
          {title && (
            <DrawerHeader>
              {title}
            </DrawerHeader>
          )}
          <DrawerCloseButton />
          
          <DrawerBody>
            {description && <p>{description}</p>}
            {children}
          </DrawerBody>

          {(actions || onConfirm || onCancel) && (
            <DrawerFooter>
              {actions || (
                <>
                  <Button
                    variant="outline"
                    mr={3}
                    onClick={handleCancel}
                    isDisabled={isLoading}
                  >
                    {cancelText}
                  </Button>
                  {onConfirm && (
                    <Button
                      colorScheme={confirmColorScheme}
                      onClick={handleConfirm}
                      isLoading={isLoading}
                    >
                      {confirmText}
                    </Button>
                  )}
                </>
              )}
            </DrawerFooter>
          )}
        </DrawerContent>
      );

      if (performance.enableAnimations) {
        const MotionDrawerContent = motion(DrawerContent);
        const variants = getDrawerAnimationVariants(placement);
        
        return (
          <MotionDrawerContent
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {title && (
              <DrawerHeader>
                {title}
              </DrawerHeader>
            )}
            <DrawerCloseButton />
            
            <DrawerBody>
              {description && <p>{description}</p>}
              {children}
            </DrawerBody>

            {(actions || onConfirm || onCancel) && (
              <DrawerFooter>
                {actions || (
                  <>
                    <Button
                      variant="outline"
                      mr={3}
                      onClick={handleCancel}
                      isDisabled={isLoading}
                    >
                      {cancelText}
                    </Button>
                    {onConfirm && (
                      <Button
                        colorScheme={confirmColorScheme}
                        onClick={handleConfirm}
                        isLoading={isLoading}
                      >
                        {confirmText}
                      </Button>
                    )}
                  </>
                )}
              </DrawerFooter>
            )}
          </MotionDrawerContent>
        );
      }

      return content;
    }, [
      performance.lazyLoad,
      performance.enableAnimations,
      isOpen,
      placement,
      title,
      description,
      children,
      actions,
      onConfirm,
      onCancel,
      handleCancel,
      handleConfirm,
      cancelText,
      confirmText,
      confirmColorScheme,
      isLoading
    ]);

    return (
      <DrawerContext.Provider value={contextValue}>
        <ChakraDrawer ref={ref} {...drawerProps}>
          <DrawerOverlay />
          {drawerContent}
        </ChakraDrawer>
      </DrawerContext.Provider>
    );
  }
);

DrawerComponent.displayName = 'OptimizedDrawer';

/**
 * Optimized DrawerTrigger Component
 */
const DrawerTriggerComponent = React.forwardRef<HTMLElement, DrawerTriggerProps>(
  ({ children, testId }, ref) => {
    const { onOpen } = useDrawer();

    return React.cloneElement(children, {
      ref,
      onClick: (event: React.MouseEvent) => {
        children.props.onClick?.(event);
        onOpen();
      },
      'data-testid': testId,
    });
  }
);

DrawerTriggerComponent.displayName = 'OptimizedDrawerTrigger';

/**
 * Memoized OptimizedDrawer export
 */
export const OptimizedDrawer = React.memo(DrawerComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof DrawerProps)[] = [
    'placement', 'size', 'title', 'description', 'isOpen', 'children'
  ];
  
  return keysToCompare.every(key => prevProps[key] === nextProps[key]);
});

export const OptimizedDrawerTrigger = React.memo(DrawerTriggerComponent);

// Default exports
export default OptimizedDrawer;
export { OptimizedDrawerTrigger as DrawerTrigger };