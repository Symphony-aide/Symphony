import {
  Button,
  useDisclosure,
} from '@chakra-ui/react';
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
 * Extended AlertDialog props
 */
export interface AlertDialogProps {
  /** Dialog is open */
  isOpen?: boolean;
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
  cancelVariant?: 'solid' | 'outline' | 'ghost';
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
  /** Dialog children */
  children?: React.ReactNode;
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
 * NOTE: This component is a placeholder and needs to be implemented 
 * with the correct Dialog components from Chakra UI v3
 */
const AlertDialogComponent = React.forwardRef<HTMLDivElement, AlertDialogProps>(
  (
    {
      isOpen,
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
    },
    ref
  ) => {
    const [loading, setLoading] = React.useState(false);
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
      
      setLoading(true);
      try {
        await optimizedConfirmHandler();
        onClose?.();
      } catch (error) {
        console.error('Alert dialog confirm error:', error);
      } finally {
        setLoading(false);
      }
    }, [optimizedConfirmHandler, onClose]);

    // Handle cancel
    const handleCancel = useCallback(() => {
      optimizedCancelHandler?.();
      onClose?.();
    }, [optimizedCancelHandler, onClose]);

    // TEMPORARY IMPLEMENTATION: 
    // A proper Dialog component from Chakra UI v3 should be used
    if (!isOpen) return null;
    
    return (
      <div 
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
        }}
      >
        <div
          style={{
            background: 'white',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '100%',
            padding: '16px',
          }}
        >
          {title && <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{title}</div>}
          
          {description && <div style={{ marginTop: '8px' }}>{description}</div>}
          
          {children && <div style={{ marginTop: '16px' }}>{children}</div>}
          
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              ref={cancelRef}
              onClick={handleCancel}
              disabled={loading}
              variant={cancelVariant}
              mr={3}
            >
              {cancelText}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={loading}
              colorScheme={confirmColorScheme}
              loading={loading}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

// Set display name for better debugging
AlertDialogComponent.displayName = 'OptimizedAlertDialog';

/**
 * Memoized AlertDialog export for maximum performance
 */
export const OptimizedAlertDialog = React.memo(AlertDialogComponent);

/**
 * Hook to use an optimized alert dialog
 */
export const useAlertDialog = () => {
  const disclosure = useDisclosure();
  
  return {
    ...disclosure,
    AlertDialog: OptimizedAlertDialog,
  };
};

// Default export for convenience
export default OptimizedAlertDialog;