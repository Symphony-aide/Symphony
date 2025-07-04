import React, { useMemo, useCallback, useState } from 'react';
import {
  Select as ChakraSelect,
  SelectProps as ChakraSelectProps,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
} from '@chakra-ui/react';
import { throttle, debounce } from 'lodash-es';
import { useLocalStorage } from 'react-use';

/**
 * Select sizes
 */
export type SelectSize = 'xs' | 'sm' | 'md' | 'lg';

/**
 * Select variants
 */
export type SelectVariant = 'outline' | 'filled' | 'flushed' | 'unstyled';

/**
 * Select option data
 */
export interface SelectOptionData {
  /** Option value */
  value: string;
  /** Option label */
  label: string;
  /** Whether option is disabled */
  disabled?: boolean;
  /** Option group */
  group?: string;
}

/**
 * Performance optimization options for select
 */
export interface SelectPerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Throttle change events (ms) */
  throttleChange?: number;
  /** Debounce change events (ms) */
  debounceChange?: number;
  /** Enable value persistence */
  persistValue?: boolean;
  /** Enable search/filter */
  enableSearch?: boolean;
}

/**
 * Validation options for select
 */
export interface SelectValidationOptions {
  /** Required field */
  required?: boolean;
  /** Custom validation function */
  validator?: (value: string) => string | null;
  /** Validate on change */
  validateOnChange?: boolean;
}

/**
 * Extended Select props with optimization features
 */
export interface SelectProps extends Omit<ChakraSelectProps, 'size' | 'variant' | 'onChange'> {
  /** Select size */
  size?: SelectSize;
  /** Select variant */
  variant?: SelectVariant;
  /** Select options */
  options?: SelectOptionData[];
  /** Select label */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Error message */
  errorMessage?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Custom onChange handler */
  onChange?: (value: string, event: React.ChangeEvent<HTMLSelectElement>) => void;
  /** Performance optimization settings */
  performance?: SelectPerformanceOptions;
  /** Validation options */
  validation?: SelectValidationOptions;
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
  originalOnChange?: (value: string, event: React.ChangeEvent<HTMLSelectElement>) => void,
  throttleMs?: number,
  debounceMs?: number,
  analytics?: SelectProps['analytics']
) => {
  return useMemo(() => {
    if (!originalOnChange) return undefined;

    let optimizedHandler = (event: React.ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value;
      
      // Track analytics
      if (analytics && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', analytics.action || 'select_change', {
          event_category: analytics.category || 'select',
          event_label: analytics.label,
          value: value,
        });
      }
      
      originalOnChange(value, event);
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
 * Select validation hook
 */
const useSelectValidation = (
  value: string,
  validation?: SelectValidationOptions
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
 * Group options by group property
 */
const groupOptions = (options: SelectOptionData[]) => {
  const grouped = options.reduce((acc, option) => {
    const group = option.group || 'default';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(option);
    return acc;
  }, {} as Record<string, SelectOptionData[]>);

  return grouped;
};

/**
 * Optimized Select Component
 */
const SelectComponent = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      size = 'md',
      variant = 'outline',
      options = [],
      label,
      helperText,
      errorMessage,
      placeholder = 'Select an option',
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
      storageKey || 'select-value',
      defaultValue || ''
    );

    // Internal state
    const [internalValue, setInternalValue] = useState(
      controlledValue ?? (performance.persistValue && storageKey ? persistedValue : defaultValue || '')
    );

    // Determine current value
    const currentValue = controlledValue ?? internalValue;

    // Select validation
    const { error: validationError } = useSelectValidation(currentValue, validation);

    // Optimized change handler
    const optimizedChangeHandler = useOptimizedChangeHandler(
      onChange,
      performance.throttleChange,
      performance.debounceChange,
      analytics
    );

    // Combined change handler with persistence
    const handleChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value;
      
      if (controlledValue === undefined) {
        setInternalValue(value);
      }
      
      if (performance.persistValue && storageKey) {
        setPersistedValue(value);
      }
      
      optimizedChangeHandler?.(event);
    }, [controlledValue, optimizedChangeHandler, performance.persistValue, storageKey, setPersistedValue]);

    // Memoized select props
    const selectProps = useMemo(() => ({
      size,
      variant,
      value: currentValue,
      onChange: handleChange,
      'data-testid': testId,
      isInvalid: !!validationError || !!errorMessage,
      ...rest,
    }), [
      size,
      variant,
      currentValue,
      handleChange,
      testId,
      validationError,
      errorMessage,
      rest
    ]);

    // Memoized select options
    const selectOptions = useMemo(() => {
      if (children) return children;

      const groupedOptions = groupOptions(options);
      const groups = Object.keys(groupedOptions);

      if (groups.length === 1 && groups[0] === 'default') {
        // No groups, render options directly
        return [
          placeholder && (
            <option key="placeholder" value="" disabled>
              {placeholder}
            </option>
          ),
          ...options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))
        ].filter(Boolean);
      }

      // Render grouped options
      return [
        placeholder && (
          <option key="placeholder" value="" disabled>
            {placeholder}
          </option>
        ),
        ...groups.map((group) => {
          if (group === 'default') {
            return groupedOptions[group].map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ));
          }

          return (
            <optgroup key={group} label={group}>
              {groupedOptions[group].map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </option>
              ))}
            </optgroup>
          );
        })
      ].flat().filter(Boolean);
    }, [children, options, placeholder]);

    // Render select
    const selectElement = (
      <ChakraSelect ref={ref} {...selectProps}>
        {selectOptions}
      </ChakraSelect>
    );

    // Wrap with FormControl if label, helper text, or error message is provided
    if (label || helperText || validationError || errorMessage) {
      return (
        <FormControl isInvalid={!!validationError || !!errorMessage}>
          {label && <FormLabel>{label}</FormLabel>}
          {selectElement}
          {(validationError || errorMessage) && (
            <FormErrorMessage>{validationError || errorMessage}</FormErrorMessage>
          )}
          {helperText && !validationError && !errorMessage && (
            <FormHelperText>{helperText}</FormHelperText>
          )}
        </FormControl>
      );
    }

    return selectElement;
  }
);

SelectComponent.displayName = 'OptimizedSelect';

/**
 * Memoized OptimizedSelect export
 */
export const OptimizedSelect = React.memo(SelectComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof SelectProps)[] = [
    'size', 'variant', 'options', 'value', 'placeholder', 'label', 'errorMessage', 'children'
  ];
  
  return keysToCompare.every(key => {
    if (key === 'options') {
      return JSON.stringify(prevProps[key]) === JSON.stringify(nextProps[key]);
    }
    return prevProps[key] === nextProps[key];
  });
});

// Default export
export default OptimizedSelect;