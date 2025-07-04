import { Button as ChakraButton, ButtonProps as ChakraButtonProps } from '@chakra-ui/react';
import { throttle, debounce } from 'lodash-es';
import React, { useMemo } from 'react';

/**
 * Custom button variants that extend Chakra's default variants
 */
export type ButtonVariant = 
  | 'solid' 
  | 'outline' 
  | 'ghost' 
  | 'subtle'
  | 'surface'
  | 'plain'
  | 'gradient'; // Custom variant example

/**
 * Button sizes following design system conventions
 */
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Color schemes available for the button
 */
export type ButtonColorScheme = 
  | 'gray' | 'red' | 'orange' | 'yellow' | 'green' 
  | 'teal' | 'blue' | 'cyan' | 'purple' | 'pink'
  | 'primary' | 'secondary'; // Custom color schemes

/**
 * Click handler optimization options
 */
export interface ClickOptimization {
  /** Throttle click events (ms) - prevents rapid clicking */
  throttle?: number;
  /** Debounce click events (ms) - waits for user to stop clicking */
  debounce?: number;
  /** Prevent double-click issues */
  preventDoubleClick?: boolean;
}

/**
 * Performance optimization options
 */
export interface PerformanceOptions {
  /** Skip re-renders when props haven't changed */
  memoize?: boolean;
  /** Lazy load heavy animations/effects */
  lazyAnimations?: boolean;
  /** Preload hover states for better UX */
  preloadHover?: boolean;
}

/**
 * Extended Button props interface with optimization features
 */
export interface ButtonProps extends Omit<ChakraButtonProps, 'variant' | 'size' | 'colorScheme' | 'onClick'> {
  /** Button variant style */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Color scheme for the button */
  colorScheme?: ButtonColorScheme;
  /** Whether the button should take full width of its container */
  fullWidth?: boolean;
  /** Icon to display on the left side of the button */
  leftIcon?: React.ReactElement;
  /** Icon to display on the right side of the button */
  rightIcon?: React.ReactElement;
  /** Custom data-testid for testing purposes */
  testId?: string;
  /** Click handler with optional optimization */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Click optimization settings */
  clickOptimization?: ClickOptimization;
  /** Performance optimization settings */
  performance?: PerformanceOptions;
  /** Analytics tracking data */
  analytics?: {
    event?: string;
    category?: string;
    label?: string;
  };
}

/**
 * Optimized click handler factory
 * @param originalOnClick
 * @param optimization
 * @param analytics
 */
const useOptimizedClickHandler = (
  originalOnClick?: (event: React.MouseEvent<HTMLButtonElement>) => void,
  optimization?: ClickOptimization,
  analytics?: ButtonProps['analytics']
) => {
  return useMemo(() => {
    if (!originalOnClick) return undefined;

    let optimizedHandler = originalOnClick;

    // Add analytics tracking
    if (analytics) {
      const trackingHandler = (event: React.MouseEvent<HTMLButtonElement>) => {
        // Track analytics (you can replace this with your analytics service)
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', analytics.event || 'click', {
            event_category: analytics.category || 'button',
            event_label: analytics.label,
          });
        }
        
        originalOnClick(event);
      };
      optimizedHandler = trackingHandler;
    }

    // Apply throttling
    if (optimization?.throttle) {
      optimizedHandler = throttle(optimizedHandler, optimization.throttle, { 
        leading: true, 
        trailing: false 
      });
    }

    // Apply debouncing
    if (optimization?.debounce) {
      optimizedHandler = debounce(optimizedHandler, optimization.debounce);
    }

    // Prevent double-click
    if (optimization?.preventDoubleClick) {
      let isProcessing = false;
      const doubleClickHandler = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (isProcessing) return;
        isProcessing = true;
        optimizedHandler(event);
        setTimeout(() => { isProcessing = false; }, 300);
      };
      optimizedHandler = doubleClickHandler;
    }

    return optimizedHandler;
  }, [originalOnClick, optimization, analytics]);
};

/**
 * Optimized Button Component
 */
const ButtonComponent = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'solid',
      size = 'md',
      colorScheme = 'gray',
      fullWidth = false,
      leftIcon,
      rightIcon,
      testId,
      onClick,
      clickOptimization,
      performance = { memoize: true },
      analytics,
      children,
      ...rest
    },
    ref
  ) => {
    // Optimized click handler
    const optimizedClickHandler = useOptimizedClickHandler(onClick, clickOptimization, analytics);
    
    // Memoized Chakra props to prevent object recreation
    const chakraProps = useMemo(() => {
      const colorPalette = ['primary', 'secondary'].includes(colorScheme) ? 'blue' : colorScheme;
      
      return {
        variant: variant === 'gradient' ? 'solid' : variant,
        size,
        colorScheme: colorPalette,
        width: fullWidth ? 'full' : 'auto',
        leftIcon,
        rightIcon,
        'data-testid': testId,
        onClick: optimizedClickHandler,
        ...rest,
      };
    }, [variant, size, colorScheme, fullWidth, leftIcon, rightIcon, testId, optimizedClickHandler, rest]);

    // Custom CSS for gradient variant
    const customStyle = variant === 'gradient' ? {
      bgGradient: 'linear(to-r, blue.400, purple.500)',
      color: 'white',
      _hover: {
        bgGradient: 'linear(to-r, blue.500, purple.600)',
        transform: 'translateY(-2px)',
        boxShadow: 'md',
      }
    } : {};

    return (
      <ChakraButton
        ref={ref}
        {...chakraProps}
        {...customStyle}
      >
        {children}
      </ChakraButton>
    );
  }
);

// Set display name for better debugging
ButtonComponent.displayName = 'OptimizedButton';

/**
 * Memoized OptimizedButton export for maximum performance
 * Only re-renders when props actually change
 */
export const OptimizedButton = React.memo(ButtonComponent, (prevProps, nextProps) => {
  // Custom comparison for better memoization
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false; // Always re-render if memoization is disabled
  }
  
  // Deep comparison for props that affect rendering
  const keysToCompare: (keyof ButtonProps)[] = [
    'variant', 'size', 'colorScheme', 'children', 'isLoading', 
    'isDisabled', 'leftIcon', 'rightIcon', 'fullWidth'
  ];
  
  return keysToCompare.every(key => prevProps[key] === nextProps[key]);
});

// Default export for convenience
export default OptimizedButton;