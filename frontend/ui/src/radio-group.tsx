import {
  RadioGroup as ChakraRadioGroup,
  Radio,
  RadioGroupProps as ChakraRadioGroupProps,
  Stack,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
} from '@chakra-ui/react';
import { throttle, debounce } from 'lodash-es';
import React, { useMemo, useCallback, useState } from 'react';
import { useLocalStorage } from 'react-use';

/**
 * Radio group sizes
 */
export type RadioGroupSize = 'sm' | 'md' | 'lg';

/**
 * Radio group orientation
 */
export type RadioGroupOrientation = 'horizontal' | 'vertical';

/**
 * Radio option data
 */
export interface RadioOptionData {
  /** Option value */
  value: string;
  /** Option label */
  label: React.ReactNode;
  /** Whether option is disabled */
  disabled?: boolean;
  /** Option description */
  description?: string;
}

/**
 * Performance optimization options for radio group
 */
export interface RadioGroupPerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Throttle change events (ms) */
  throttleChange?: number;
  /** Debounce change events (ms) */
  debounceChange?: number;
  /** Enable value persistence */
  persistValue?: boolean;
}

/**
 * Validation options for radio group
 */
export interface RadioGroupValidationOptions {
  /** Required field */
  required?: boolean;
  /** Custom validation function */
  validator?: (value: string) => string | null;
  /** Validate on change */
  validateOnChange?: boolean;
}

/**
 * Extended RadioGroup props with optimization features
 */
export interface RadioGroupProps extends Omit<ChakraRadioGroupProps, 'size' | 'onChange'> {
  /** Radio group size */
  size?: RadioGroupSize;
  /** Radio group orientation */
  orientation?: RadioGroupOrientation;
  /** Radio options */
  options?: RadioOptionData[];
  /** Radio group label */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Error message */
  errorMessage?: string;
  /** Stack spacing */
  spacing?: string | number;
  /** Custom onChange handler */
  onChange?: (value: string) => void;
  /** Performance optimization settings */
  performance?: RadioGroupPerformanceOptions;
  /** Validation options */
  validation?: RadioGroupValidationOptions;
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
 * @param originalOnChange
 * @param throttleMs
 * @param debounceMs
 * @param analytics
 */
const useOptimizedChangeHandler = (
  originalOnChange?: (value: string) => void,
  throttleMs?: number,
  debounceMs?: number,
  analytics?: RadioGroupProps['analytics']
) => {
  return useMemo(() => {
    if (!originalOnChange) return undefined;

    let optimizedHandler = (value: string) => {
      // Track analytics
      if (analytics && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', analytics.action || 'radio_group_change', {
          event_category: analytics.category || 'radio_group',
          event_label: analytics.label,
          value,
        });
      }
      
      originalOnChange(value);
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
 * Radio group validation hook
 * @param value
 * @param validation
 */
const useRadioGroupValidation = (
  value: string,
  validation?: RadioGroupValidationOptions
) => {
  const [error, setError] = useState<string | null>(null);

  const validateValue = useCallback((val: string) => {
    if (!validation) return null;

    if (validation.required && !val) {
      return 'Please select an option';
    }

    if (validation.validator) {
      return validation.validator(val);
    }

    return null;
  }, [validation]);

  React.useEffect(() => {
    if (validation?.validateOnChange) {
      const errorMessage = validateValue(value);
      setError(errorMessage);
    }
  }, [value, validateValue, validation]);

  return { error, isValid: !error };
};

/**
 * Optimized RadioGroup Component
 */
const RadioGroupComponent = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    {
      size = 'md',
      orientation = 'vertical',
      options = [],
      label,
      helperText,
      errorMessage,
      spacing = 2,
      onChange,
      performance = { memoize: true, throttleChange: 100 },
      validation,
      storageKey,
      testId,
      analytics,
      value: controlledValue,
      defaultValue,
      children,
      ...rest
    },
    ref
  ) => {
    // Value persistence
    const [persistedValue, setPersistedValue] = useLocalStorage<string>(
      storageKey || 'radio-group-value',
      defaultValue || ''
    );

    // Internal state
    const [internalValue, setInternalValue] = useState(
      controlledValue ?? (performance.persistValue && storageKey ? persistedValue : defaultValue || '')
    );

    // Determine current value
    const currentValue = controlledValue ?? internalValue;

    // Radio group validation
    const { error: validationError } = useRadioGroupValidation(currentValue, validation);

    // Optimized change handler
    const optimizedChangeHandler = useOptimizedChangeHandler(
      onChange,
      performance.throttleChange,
      performance.debounceChange,
      analytics
    );

    // Combined change handler with persistence
    const handleChange = useCallback((value: string) => {
      if (controlledValue === undefined) {
        setInternalValue(value);
      }
      
      if (performance.persistValue && storageKey) {
        setPersistedValue(value);
      }
      
      optimizedChangeHandler?.(value);
    }, [controlledValue, optimizedChangeHandler, performance.persistValue, storageKey, setPersistedValue]);

    // Memoized radio group props
    const radioGroupProps = useMemo(() => ({
      size,
      value: currentValue,
      onChange: handleChange,
      'data-testid': testId,
      isInvalid: !!validationError || !!errorMessage,
      ...rest,
    }), [
      size,
      currentValue,
      handleChange,
      testId,
      validationError,
      errorMessage,
      rest
    ]);

    // Memoized radio options
    const radioOptions = useMemo(() => {
      if (children) return children;

      return options.map((option) => (
        <Radio
          key={option.value}
          value={option.value}
          isDisabled={option.disabled}
          data-testid={`${testId}-option-${option.value}`}
        >
          <div>
            {option.label}
            {option.description && (
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                {option.description}
              </div>
            )}
          </div>
        </Radio>
      ));
    }, [children, options, testId]);

    // Render radio group
    const radioGroupElement = (
      <ChakraRadioGroup ref={ref} {...radioGroupProps}>
        <Stack direction={orientation === 'horizontal' ? 'row' : 'column'} spacing={spacing}>
          {radioOptions}
        </Stack>
      </ChakraRadioGroup>
    );

    // Wrap with FormControl if label, helper text, or error message is provided
    if (label || helperText || validationError || errorMessage) {
      return (
        <FormControl isInvalid={!!validationError || !!errorMessage}>
          {label && <FormLabel>{label}</FormLabel>}
          {radioGroupElement}
          {(validationError || errorMessage) && (
            <FormErrorMessage>{validationError || errorMessage}</FormErrorMessage>
          )}
          {helperText && !validationError && !errorMessage && (
            <FormHelperText>{helperText}</FormHelperText>
          )}
        </FormControl>
      );
    }

    return radioGroupElement;
  }
);

RadioGroupComponent.displayName = 'OptimizedRadioGroup';

/**
 * Memoized OptimizedRadioGroup export
 */
export const OptimizedRadioGroup = React.memo(RadioGroupComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof RadioGroupProps)[] = [
    'size', 'orientation', 'options', 'value', 'label', 'errorMessage', 'children'
  ];
  
  return keysToCompare.every(key => {
    if (key === 'options') {
      return JSON.stringify(prevProps[key]) === JSON.stringify(nextProps[key]);
    }
    return prevProps[key] === nextProps[key];
  });
});

// Default export
export default OptimizedRadioGroup;