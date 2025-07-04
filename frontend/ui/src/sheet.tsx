import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerProps,
  Button,
  useDisclosure,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { throttle } from 'lodash-es';
import React, { useMemo, useCallback, useState } from 'react';

/**
 * Sheet placement options
 */
export type SheetPlacement = 'top' | 'right' | 'bottom' | 'left';

/**
 * Sheet sizes
 */
export type SheetSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

/**
 * Performance optimization options for sheet
 */
export interface SheetPerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Throttle action events (ms) */
  throttleActions?: number;
  /** Enable animations */
  enableAnimations?: boolean;
  /** Lazy load sheet content */
  lazyLoad?: boolean;
  /** Close on overlay click */
  closeOnOverlayClick?: boolean;
  /** Close on escape key */
  closeOnEsc?: boolean;
}

/**
 * Extended Sheet props with optimization features
 */
export interface SheetProps extends Omit<DrawerProps, 'children' | 'onClose'> {
  /** Sheet placement */
  placement?: SheetPlacement;
  /** Sheet size */
  size?: SheetSize;
  /** Sheet title */
  title?: React.ReactNode;
  /** Sheet description */
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
  performance?: SheetPerformanceOptions;
  /** Custom test ID */
  testId?: string;
  /** Analytics tracking */
  analytics?: {
    category?: string;
    action?: string;
    label?: string;
  };
  /** Sheet content */
  children?: React.ReactNode;
}

/**
 * Sheet trigger props
 */
export interface SheetTriggerProps {
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
  analytics?: SheetProps['analytics'],
  actionType?: string
) => {
  return useMemo(() => {
    if (!originalHandler) return undefined;

    let optimizedHandler = async () => {
      // Track analytics
      if (analytics && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', analytics.action || `sheet_${actionType}`, {
          event_category: analytics.category || 'sheet',
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
 * Animation variants for sheet based on placement
 * @param placement
 */
const getSheetAnimationVariants = (placement: SheetPlacement) => {
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
 * Sheet context
 */
interface SheetContextValue {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  performance: SheetPerformanceOptions;
}

const SheetContext = React.createContext<SheetContextValue | null>(null);

/**
 * Hook to use sheet context
 */
const useSheet = () => {
  const context = React.useContext(SheetContext);
  if (!context) {
    throw new Error('useSheet must be used within a Sheet component');
  }
  return context;
};

/**
 * Optimized Sheet Component
 */
const SheetComponent = React.forwardRef<HTMLDivElement, SheetProps>(
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
        console.error('Sheet confirm error:', error);
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

    // Memoized sheet props
    const sheetProps = useMemo(() => ({
      placement,
      size,
      isOpen,
      onClose: handleClose,
      closeOnOverlayClick: performance.closeOnOverlayClick,
      closeOnEsc: performance.closeOnEsc,
      'data-testid': testId,
      ...rest,
    }), [placement, size, isOpen, handleClose, performance, testId, rest]);

    // Render sheet content
    const sheetContent = useMemo(() => {
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
        const variants = getSheetAnimationVariants(placement);
        
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
      <SheetContext.Provider value={contextValue}>
        <Drawer ref={ref} {...sheetProps}>
          <DrawerOverlay />
          {sheetContent}
        </Drawer>
      </SheetContext.Provider>
    );
  }
);

SheetComponent.displayName = 'OptimizedSheet';

/**
 * Optimized SheetTrigger Component
 */
const SheetTriggerComponent = React.forwardRef<HTMLElement, SheetTriggerProps>(
  ({ children, testId }, ref) => {
    const { onOpen } = useSheet();

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

SheetTriggerComponent.displayName = 'OptimizedSheetTrigger';

/**
 * Memoized OptimizedSheet export
 */
export const OptimizedSheet = React.memo(SheetComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof SheetProps)[] = [
    'placement', 'size', 'title', 'description', 'isOpen', 'children'
  ];
  
  return keysToCompare.every(key => prevProps[key] === nextProps[key]);
});

export const OptimizedSheetTrigger = React.memo(SheetTriggerComponent);

// Default exports
export default OptimizedSheet;
export { OptimizedSheetTrigger as SheetTrigger };