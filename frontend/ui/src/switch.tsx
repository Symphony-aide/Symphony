import React, { useMemo, useCallback, useState } from 'react';
import {
  Switch as ChakraSwitch,
  SwitchProps as ChakraSwitchProps,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  HStack,
} from '@chakra-ui/react';
import { throttle, debounce } from 'lodash-es';
import { useLocalStorage } from 'react-use';

/**
 * Switch sizes
 */
export type SwitchSize = 'sm' | 'md' | 'lg';

/**
 * Switch variants
 */
export type SwitchVariant = 'default' | 'solid' | 'outline';

/**
 * Performance optimization options for switch
 */
export interface SwitchPerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Throttle change events (ms) */
  throttleChange?: number;
  /** Debounce change events (ms) */
  debounceChange?: number;
  /** Enable value persistence */
  persistValue?: boolean;
  /** Enable animations */
  enableAnimations?: boolean;
}

/**
 * Validation options for switch
 */
export interface SwitchValidationOptions {
  /** Required field */
  required?: boolean;
  /** Custom validation function */
  validator?: (checked: boolean) => string | null;
  /** Validate on change */
  validateOnChange?: boolean;
}

/**
 * Extended Switch props with optimization features
 */
export interface SwitchProps extends Omit<ChakraSwitchProps, 'size' | 'onChange'> {
  /** Switch size */
  size?: SwitchSize;
  /** Switch variant */
  variant?: SwitchVariant;
  /** Switch label */
  label?: React.ReactNode;
  /** Helper text */
  helperText?: string;
  /** Error message */
  errorMessage?: string;
  /** Label position */
  labelPosition?: 'left' | 'right';
  /** Custom onChange handler */
  onChange?: (checked: boolean, event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Performance optimization settings */
  performance?: SwitchPerformanceOptions;
  /** Validation options */
  validation?: SwitchValidationOptions;
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
 * Optimized change handler factory
 */
const useOptimizedChangeHandler = (
  originalOnChange?: (checked: boolean, event: React.ChangeEvent<HTMLInputElement>) => void,
  throttleMs?: number,
  debounceMs?: number,
  analytics?: SwitchProps['analytics']
) => {
  return useMemo(() => {
    if (!originalOnChange) return undefined;

    let optimizedHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
      const checked = event.target.checked;
      
      // Track analytics
      if (analytics && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', analytics.action || 'switch_toggle', {
          event_category: analytics.category || 'switch',
          event_label: analytics.label,
          value: checked ? 1 : 0,
        });
      }
      
      originalOnChange(checked, event);
    };

    // Apply throttling
    if (throttleMs) {
      optimizedHandler = throttle(optimizedHandler, throttleMs, { 
        leading: true, 
        trailing: true 
      });
    }

    // Apply debouncing
    if (debounceMs) {
      optimizedHandler = debounce(optimizedHandler, debounceMs);
    }

    return optimizedHandler;
  }, [originalOnChange, throttleMs, debounceMs, analytics]);
};

/**
 * Switch validation hook
 */
const useSwitchValidation = (
  checked: boolean,
  validation?: SwitchValidationOptions
) => {
  const [error, setError] = useState<string | null>(null);

  const validateValue = useCallback((isChecked: boolean) => {
    if (!validation) return null;

    if (validation.required && !isChecked) {
      return 'This field is required';
    }

    if (validation.validator) {
      return validation.validator(isChecked);
    }

    return null;
  }, [validation]);

  React.useEffect(() => {
    if (validation?.validateOnChange) {
      const errorMessage = validateValue(checked);
      setError(errorMessage);
    }
  }, [checked, validateValue, validation]);

  return { error, isValid: !error };
};

/**
 * Get switch styles based on variant and size
 */
const getSwitchStyles = (variant: SwitchVariant, size: SwitchSize, enableAnimations: boolean) => {
  const sizeStyles = {
    sm: { '--switch-track-width': '1.375rem', '--switch-track-height': '0.75rem' },
    md: { '--switch-track-width': '1.875rem', '--switch-track-height': '1rem' },
    lg: { '--switch-track-width': '2.875rem', '--switch-track-height': '1.5rem' },
  };

  const variantStyles = {
    default: {},
    solid: {
      '& .chakra-switch__track[data-checked]': {
        backgroundColor: 'blue.500',
      },
    },
    outline: {
      '& .chakra-switch__track': {
        border: '2px solid',
        borderColor: 'gray.300',
        backgroundColor: 'transparent',
      },
      '& .chakra-switch__track[data-checked]': {
        borderColor: 'blue.500',
        backgroundColor: 'blue.50',
      },
    },
  };

  const animationStyles = enableAnimations ? {
    '& .chakra-switch__track': {
      transition: 'all 0.2s ease-in-out',
    },
    '& .chakra-switch__thumb': {
      transition: 'all 0.2s ease-in-out',
    },
  } : {};

  return {
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...animationStyles,
  };
};

/**
 * Optimized Switch Component
 */
const SwitchComponent = React.forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      size = 'md',
      variant = 'default',
      label,
      helperText,
      errorMessage,
      labelPosition = 'right',
      onChange,
      performance = { memoize: true, throttleChange: 100, enableAnimations: true },
      validation,
      storageKey,
      testId,
      analytics,
      isChecked: controlledChecked,
      defaultChecked,
      ...rest
    },
    ref
  ) => {
    // Value persistence
    const [persistedChecked, setPersistedChecked] = useLocalStorage<boolean>(
      storageKey || 'switch-value',
      defaultChecked || false
    );

    // Internal state
    const [internalChecked, setInternalChecked] = useState(
      controlledChecked ?? (performance.persistValue && storageKey ? persistedChecked : defaultChecked || false)
    );

    // Determine current checked state
    const currentChecked = controlledChecked ?? internalChecked;

    // Switch validation
    const { error: validationError } = useSwitchValidation(currentChecked, validation);

    // Optimized change handler
    const optimizedChangeHandler = useOptimizedChangeHandler(
      onChange,
      performance.throttleChange,
      performance.debounceChange,
      analytics
    );

    // Combined change handler with persistence
    const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
      const checked = event.target.checked;
      
      if (controlledChecked === undefined) {
        setInternalChecked(checked);
      }
      
      if (performance.persistValue && storageKey) {
        setPersistedChecked(checked);
      }
      
      optimizedChangeHandler?.(event);
    }, [controlledChecked, optimizedChangeHandler, performance.persistValue, storageKey, setPersistedChecked]);

    // Memoized switch styles
    const switchStyles = useMemo(() => 
      getSwitchStyles(variant, size, performance.enableAnimations || false),
      [variant, size, performance.enableAnimations]
    );

    // Memoized switch props
    const switchProps = useMemo(() => ({
      size,
      isChecked: currentChecked,
      onChange: handleChange,
      'data-testid': testId,
      isInvalid: !!validationError || !!errorMessage,
      ...switchStyles,
      ...rest,
    }), [
      size,
      currentChecked,
      handleChange,
      testId,
      validationError,
      errorMessage,
      switchStyles,
      rest
    ]);

    // Render switch element
    const switchElement = (
      <ChakraSwitch ref={ref} {...switchProps} />
    );

    // Render switch with label
    const switchWithLabel = label ? (
      <HStack spacing={3} align="center">
        {labelPosition === 'left' && (
          <FormLabel htmlFor={rest.id} mb={0} cursor="pointer">
            {label}
          </FormLabel>
        )}
        {switchElement}
        {labelPosition === 'right' && (
          <FormLabel htmlFor={rest.id} mb={0} cursor="pointer">
            {label}
          </FormLabel>
        )}
      </HStack>
    ) : (
      switchElement
    );

    // Wrap with FormControl if helper text or error message is provided
    if (helperText || validationError || errorMessage) {
      return (
        <FormControl isInvalid={!!validationError || !!errorMessage}>
          {switchWithLabel}
          {(validationError || errorMessage) && (
            <FormErrorMessage>{validationError || errorMessage}</FormErrorMessage>
          )}
          {helperText && !validationError && !errorMessage && (
            <FormHelperText>{helperText}</FormHelperText>
          )}
        </FormControl>
      );
    }

    return switchWithLabel;
  }
);

SwitchComponent.displayName = 'OptimizedSwitch';

/**
 * Memoized OptimizedSwitch export
 */
export const OptimizedSwitch = React.memo(SwitchComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof SwitchProps)[] = [
    'size', 'variant', 'isChecked', 'label', 'labelPosition', 'errorMessage'
  ];
  
  return keysToCompare.every(key => prevProps[key] === nextProps[key]);
});

// Default export
export default OptimizedSwitch;