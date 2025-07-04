import React, { useMemo, useCallback, useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  ModalProps,
  Button,
  useDisclosure,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { throttle } from 'lodash-es';

/**
 * Dialog sizes
 */
export type DialogSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | 'full';

/**
 * Performance optimization options for dialog
 */
export interface DialogPerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Throttle action events (ms) */
  throttleActions?: number;
  /** Enable animations */
  enableAnimations?: boolean;
  /** Lazy load dialog content */
  lazyLoad?: boolean;
  /** Close on overlay click */
  closeOnOverlayClick?: boolean;
  /** Close on escape key */
  closeOnEsc?: boolean;
}

/**
 * Extended Dialog props with optimization features
 */
export interface DialogProps extends Omit<ModalProps, 'children' | 'onClose'> {
  /** Dialog size */
  size?: DialogSize;
  /** Dialog title */
  title?: React.ReactNode;
  /** Dialog description */
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
  performance?: DialogPerformanceOptions;
  /** Custom test ID */
  testId?: string;
  /** Analytics tracking */
  analytics?: {
    category?: string;
    action?: string;
    label?: string;
  };
  /** Dialog content */
  children?: React.ReactNode;
}

/**
 * Dialog trigger props
 */
export interface DialogTriggerProps {
  /** Trigger element */
  children: React.ReactElement;
  /** Custom test ID */
  testId?: string;
}

/**
 * Optimized action handler factory
 */
const useOptimizedActionHandler = (
  originalHandler?: () => void | Promise<void>,
  throttleMs?: number,
  analytics?: DialogProps['analytics'],
  actionType?: string
) => {
  return useMemo(() => {
    if (!originalHandler) return undefined;

    let optimizedHandler = async () => {
      // Track analytics
      if (analytics && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', analytics.action || `dialog_${actionType}`, {
          event_category: analytics.category || 'dialog',
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
 * Animation variants for dialog
 */
const dialogAnimationVariants = {
  initial: { opacity: 0, scale: 0.9, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.9, y: 20 },
};

/**
 * Dialog context
 */
interface DialogContextValue {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  performance: DialogPerformanceOptions;
}

const DialogContext = React.createContext<DialogContextValue | null>(null);

/**
 * Hook to use dialog context
 */
const useDialog = () => {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a Dialog component');
  }
  return context;
};

/**
 * Optimized Dialog Component
 */
const DialogComponent = React.forwardRef<HTMLDivElement, DialogProps>(
  (
    {
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
        console.error('Dialog confirm error:', error);
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

    // Memoized dialog props
    const dialogProps = useMemo(() => ({
      size,
      isOpen,
      onClose: handleClose,
      closeOnOverlayClick: performance.closeOnOverlayClick,
      closeOnEsc: performance.closeOnEsc,
      'data-testid': testId,
      ...rest,
    }), [size, isOpen, handleClose, performance, testId, rest]);

    // Render dialog content
    const dialogContent = useMemo(() => {
      if (performance.lazyLoad && !isOpen) {
        return null;
      }

      const content = (
        <ModalContent>
          {title && (
            <ModalHeader>
              {title}
            </ModalHeader>
          )}
          <ModalCloseButton />
          
          <ModalBody>
            {description && <p>{description}</p>}
            {children}
          </ModalBody>

          {(actions || onConfirm || onCancel) && (
            <ModalFooter>
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
            </ModalFooter>
          )}
        </ModalContent>
      );

      if (performance.enableAnimations) {
        const MotionModalContent = motion(ModalContent);
        
        return (
          <MotionModalContent
            variants={dialogAnimationVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {title && (
              <ModalHeader>
                {title}
              </ModalHeader>
            )}
            <ModalCloseButton />
            
            <ModalBody>
              {description && <p>{description}</p>}
              {children}
            </ModalBody>

            {(actions || onConfirm || onCancel) && (
              <ModalFooter>
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
              </ModalFooter>
            )}
          </MotionModalContent>
        );
      }

      return content;
    }, [
      performance.lazyLoad,
      performance.enableAnimations,
      isOpen,
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
      <DialogContext.Provider value={contextValue}>
        <Modal ref={ref} {...dialogProps}>
          <ModalOverlay />
          {dialogContent}
        </Modal>
      </DialogContext.Provider>
    );
  }
);

DialogComponent.displayName = 'OptimizedDialog';

/**
 * Optimized DialogTrigger Component
 */
const DialogTriggerComponent = React.forwardRef<HTMLElement, DialogTriggerProps>(
  ({ children, testId }, ref) => {
    const { onOpen } = useDialog();

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

DialogTriggerComponent.displayName = 'OptimizedDialogTrigger';

/**
 * Memoized OptimizedDialog export
 */
export const OptimizedDialog = React.memo(DialogComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof DialogProps)[] = [
    'size', 'title', 'description', 'isOpen', 'children'
  ];
  
  return keysToCompare.every(key => prevProps[key] === nextProps[key]);
});

export const OptimizedDialogTrigger = React.memo(DialogTriggerComponent);

// Default exports
export default OptimizedDialog;
export { OptimizedDialogTrigger as DialogTrigger };