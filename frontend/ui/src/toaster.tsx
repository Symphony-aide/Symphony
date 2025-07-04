import { Box, BoxProps } from '@chakra-ui/react';
import React, { useMemo } from 'react';

/**
 * Toaster position types
 */
export type ToasterPosition = 
  | 'top' | 'top-left' | 'top-right'
  | 'bottom' | 'bottom-left' | 'bottom-right';

/**
 * Performance optimization options for toaster
 */
export interface ToasterPerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Maximum number of toasts */
  maxToasts?: number;
  /** Auto-dismiss timeout (ms) */
  autoDismissTimeout?: number;
  /** Enable animations */
  enableAnimations?: boolean;
}

/**
 * Toaster props
 */
export interface ToasterProps extends BoxProps {
  /** Toaster position */
  position?: ToasterPosition;
  /** Theme */
  theme?: 'light' | 'dark' | 'system';
  /** Rich colors */
  richColors?: boolean;
  /** Expand toasts */
  expand?: boolean;
  /** Close button */
  closeButton?: boolean;
  /** Performance optimization settings */
  performance?: ToasterPerformanceOptions;
  /** Custom test ID */
  testId?: string;
}

/**
 * Get toaster position styles
 * @param position
 */
const getToasterPositionStyles = (position: ToasterPosition) => {
  const positionStyles = {
    'top': {
      position: 'fixed' as const,
      top: '1rem',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
    },
    'top-left': {
      position: 'fixed' as const,
      top: '1rem',
      left: '1rem',
      zIndex: 9999,
    },
    'top-right': {
      position: 'fixed' as const,
      top: '1rem',
      right: '1rem',
      zIndex: 9999,
    },
    'bottom': {
      position: 'fixed' as const,
      bottom: '1rem',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
    },
    'bottom-left': {
      position: 'fixed' as const,
      bottom: '1rem',
      left: '1rem',
      zIndex: 9999,
    },
    'bottom-right': {
      position: 'fixed' as const,
      bottom: '1rem',
      right: '1rem',
      zIndex: 9999,
    },
  };

  return positionStyles[position];
};

/**
 * Optimized Toaster Component
 */
const ToasterComponent = React.forwardRef<HTMLDivElement, ToasterProps>(
  (
    {
      position = 'bottom-right',
      theme = 'light',
      richColors = true,
      expand = false,
      closeButton = true,
      performance = { 
        memoize: true,
        maxToasts: 5, 
        autoDismissTimeout: 5000,
        enableAnimations: true
      },
      testId,
      children,
      ...rest
    },
    ref
  ) => {
    // Memoized position styles
    const positionStyles = useMemo(() => 
      getToasterPositionStyles(position), 
      [position]
    );

    // Memoized toaster props
    const toasterProps = useMemo(() => ({
      'data-testid': testId,
      'data-position': position,
      'data-theme': theme,
      'data-rich-colors': richColors,
      'data-expand': expand,
      'data-close-button': closeButton,
      ...positionStyles,
      ...rest,
    }), [
      testId,
      position,
      theme,
      richColors,
      expand,
      closeButton,
      positionStyles,
      rest
    ]);

    return (
      <Box ref={ref} {...toasterProps}>
        {children}
      </Box>
    );
  }
);

ToasterComponent.displayName = 'OptimizedToaster';

/**
 * Memoized OptimizedToaster export
 */
export const OptimizedToaster = React.memo(ToasterComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof ToasterProps)[] = [
    'position', 'theme', 'richColors', 'expand', 'closeButton', 'children'
  ];
  
  return keysToCompare.every(key => prevProps[key] === nextProps[key]);
});

// Default export
export default OptimizedToaster;