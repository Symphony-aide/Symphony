import React, { useMemo, useCallback, useState } from 'react';
import {
  Button,
  ButtonProps,
  IconButton,
  IconButtonProps,
} from '@chakra-ui/react';
import { throttle } from 'lodash-es';
import { useLocalStorage } from 'react-use';

/**
 * Toggle variants
 */
export type ToggleVariant = 'outline' | 'solid' | 'ghost' | 'subtle';

/**
 * Toggle sizes
 */
export type ToggleSize = 'xs' | 'sm' | 'md' | 'lg';

/**
 * Performance optimization options for toggle
 */
export interface TogglePerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Throttle toggle events (ms) */
  throttleToggle?: number;
  /** Enable value persistence */
  persistValue?: boolean;
  /** Enable animations */
  enableAnimations?: boolean;
}

/**
 * Extended Toggle props with optimization features
 */
export interface ToggleProps extends Omit<ButtonProps, 'onClick'> {
  /** Toggle variant */
  variant?: ToggleVariant;
  /** Toggle size */
  size?: ToggleSize;
  /** Whether toggle is pressed */
  pressed?: boolean;
  /** Default pressed state */
  defaultPressed?: boolean;
  /** Custom toggle handler */
  onToggle?: (pressed: boolean) => void;
  /** Performance optimization settings */
  performance?: TogglePerformanceOptions;
  /** Storage key for value persistence */
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
 * Extended IconToggle props
 */
export interface IconToggleProps extends Omit<IconButtonProps, 'onClick'> {
  /** Toggle variant */
  variant?: ToggleVariant;
  /** Toggle size */
  ToggleSize?: ToggleSize;
  /** Whether toggle is pressed */
  pressed?: boolean;
  /** Default pressed state */
  defaultPressed?: boolean;
  /** Icon when pressed */
  pressedIcon?: React.ReactElement;
  /** Icon when not pressed */
  unpressedIcon?: React.ReactElement;
  /** Custom toggle handler */
  onToggle?: (pressed: boolean) => void;
  /** Performance optimization settings */
  performance?: TogglePerformanceOptions;
  /** Storage key for value persistence */
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
 * Optimized toggle handler factory
 */
const useOptimizedToggleHandler = (
  originalOnToggle?: (pressed: boolean) => void,
  throttleMs?: number,
  analytics?: ToggleProps['analytics']
) => {
  return useMemo(() => {
    if (!originalOnToggle) return undefined;

    let optimizedHandler = (pressed: boolean) => {
      // Track analytics
      if (analytics && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', analytics.action || 'toggle_press', {
          event_category: analytics.category || 'toggle',
          event_label: analytics.label,
          value: pressed ? 1 : 0,
        });
      }
      
      originalOnToggle(pressed);
    };

    // Apply throttling
    if (throttleMs) {
      optimizedHandler = throttle(optimizedHandler, throttleMs, { 
        leading: true, 
        trailing: false 
      });
    }

    return optimizedHandler;
  }, [originalOnToggle, throttleMs, analytics]);
};

/**
 * Get toggle styles based on variant and pressed state
 */
const getToggleStyles = (
  variant: ToggleVariant,
  pressed: boolean,
  enableAnimations: boolean
) => {
  const baseStyles = {
    transition: enableAnimations ? 'all 0.2s ease-in-out' : 'none',
    _hover: {
      transform: enableAnimations ? 'translateY(-1px)' : 'none',
    },
    _active: {
      transform: enableAnimations ? 'translateY(0)' : 'none',
    },
  };

  const variantStyles = {
    outline: {
      variant: pressed ? 'solid' : 'outline',
      colorScheme: pressed ? 'blue' : 'gray',
    },
    solid: {
      variant: 'solid',
      colorScheme: pressed ? 'blue' : 'gray',
      bg: pressed ? 'blue.500' : 'gray.200',
      color: pressed ? 'white' : 'gray.700',
      _hover: {
        ...baseStyles._hover,
        bg: pressed ? 'blue.600' : 'gray.300',
      },
    },
    ghost: {
      variant: 'ghost',
      bg: pressed ? 'blue.100' : 'transparent',
      color: pressed ? 'blue.700' : 'gray.700',
      _hover: {
        ...baseStyles._hover,
        bg: pressed ? 'blue.200' : 'gray.100',
      },
    },
    subtle: {
      variant: 'ghost',
      bg: pressed ? 'blue.50' : 'gray.50',
      color: pressed ? 'blue.600' : 'gray.600',
      _hover: {
        ...baseStyles._hover,
        bg: pressed ? 'blue.100' : 'gray.100',
      },
    },
  };

  return {
    ...baseStyles,
    ...variantStyles[variant],
  };
};

/**
 * Optimized Toggle Component
 */
const ToggleComponent = React.forwardRef<HTMLButtonElement, ToggleProps>(
  (
    {
      variant = 'outline',
      size = 'md',
      pressed: controlledPressed,
      defaultPressed = false,
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
    // Value persistence
    const [persistedPressed, setPersistedPressed] = useLocalStorage<boolean>(
      storageKey || 'toggle-pressed',
      defaultPressed
    );

    // Internal state
    const [internalPressed, setInternalPressed] = useState(
      controlledPressed ?? (performance.persistValue && storageKey ? persistedPressed : defaultPressed)
    );

    // Determine current pressed state
    const currentPressed = controlledPressed ?? internalPressed;

    // Optimized toggle handler
    const optimizedToggleHandler = useOptimizedToggleHandler(
      onToggle,
      performance.throttleToggle,
      analytics
    );

    // Handle toggle
    const handleToggle = useCallback(() => {
      const newPressed = !currentPressed;
      
      if (controlledPressed === undefined) {
        setInternalPressed(newPressed);
      }
      
      if (performance.persistValue && storageKey) {
        setPersistedPressed(newPressed);
      }
      
      optimizedToggleHandler?.(newPressed);
    }, [
      currentPressed,
      controlledPressed,
      optimizedToggleHandler,
      performance.persistValue,
      storageKey,
      setPersistedPressed
    ]);

    // Memoized toggle styles
    const toggleStyles = useMemo(() => 
      getToggleStyles(variant, currentPressed, performance.enableAnimations || false),
      [variant, currentPressed, performance.enableAnimations]
    );

    // Memoized toggle props
    const toggleProps = useMemo(() => ({
      size,
      onClick: handleToggle,
      'data-testid': testId,
      'data-pressed': currentPressed,
      'aria-pressed': currentPressed,
      ...toggleStyles,
      ...rest,
    }), [size, handleToggle, testId, currentPressed, toggleStyles, rest]);

    return (
      <Button ref={ref} {...toggleProps}>
        {children}
      </Button>
    );
  }
);

ToggleComponent.displayName = 'OptimizedToggle';

/**
 * Optimized IconToggle Component
 */
const IconToggleComponent = React.forwardRef<HTMLButtonElement, IconToggleProps>(
  (
    {
      variant = 'outline',
      ToggleSize = 'md',
      pressed: controlledPressed,
      defaultPressed = false,
      pressedIcon,
      unpressedIcon,
      onToggle,
      performance = { memoize: true, throttleToggle: 100, enableAnimations: true },
      storageKey,
      testId,
      analytics,
      icon,
      ...rest
    },
    ref
  ) => {
    // Value persistence
    const [persistedPressed, setPersistedPressed] = useLocalStorage<boolean>(
      storageKey || 'icon-toggle-pressed',
      defaultPressed
    );

    // Internal state
    const [internalPressed, setInternalPressed] = useState(
      controlledPressed ?? (performance.persistValue && storageKey ? persistedPressed : defaultPressed)
    );

    // Determine current pressed state
    const currentPressed = controlledPressed ?? internalPressed;

    // Optimized toggle handler
    const optimizedToggleHandler = useOptimizedToggleHandler(
      onToggle,
      performance.throttleToggle,
      analytics
    );

    // Handle toggle
    const handleToggle = useCallback(() => {
      const newPressed = !currentPressed;
      
      if (controlledPressed === undefined) {
        setInternalPressed(newPressed);
      }
      
      if (performance.persistValue && storageKey) {
        setPersistedPressed(newPressed);
      }
      
      optimizedToggleHandler?.(newPressed);
    }, [
      currentPressed,
      controlledPressed,
      optimizedToggleHandler,
      performance.persistValue,
      storageKey,
      setPersistedPressed
    ]);

    // Memoized toggle styles
    const toggleStyles = useMemo(() => 
      getToggleStyles(variant, currentPressed, performance.enableAnimations || false),
      [variant, currentPressed, performance.enableAnimations]
    );

    // Determine current icon
    const currentIcon = useMemo(() => {
      if (pressedIcon && unpressedIcon) {
        return currentPressed ? pressedIcon : unpressedIcon;
      }
      return icon;
    }, [currentPressed, pressedIcon, unpressedIcon, icon]);

    // Memoized icon toggle props
    const iconToggleProps = useMemo(() => ({
      size: ToggleSize,
      icon: currentIcon,
      onClick: handleToggle,
      'data-testid': testId,
      'data-pressed': currentPressed,
      'aria-pressed': currentPressed,
      ...toggleStyles,
      ...rest,
    }), [ToggleSize, currentIcon, handleToggle, testId, currentPressed, toggleStyles, rest]);

    return (
      <IconButton ref={ref} {...iconToggleProps} />
    );
  }
);

IconToggleComponent.displayName = 'OptimizedIconToggle';

/**
 * Memoized exports
 */
export const OptimizedToggle = React.memo(ToggleComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof ToggleProps)[] = [
    'variant', 'size', 'pressed', 'children'
  ];
  
  return keysToCompare.every(key => prevProps[key] === nextProps[key]);
});

export const OptimizedIconToggle = React.memo(IconToggleComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof IconToggleProps)[] = [
    'variant', 'ToggleSize', 'pressed', 'pressedIcon', 'unpressedIcon', 'icon'
  ];
  
  return keysToCompare.every(key => prevProps[key] === nextProps[key]);
});

// Default exports
export default OptimizedToggle;
export { OptimizedIconToggle as IconToggle };