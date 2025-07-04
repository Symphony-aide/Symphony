import React, { useMemo, useCallback } from 'react';
import {
  Checkbox as ChakraCheckbox,
  CheckboxGroup as ChakraCheckboxGroup,
  CheckboxProps as ChakraCheckboxProps,
  CheckboxGroupProps as ChakraCheckboxGroupProps,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Stack,
} from '@chakra-ui/react';
import { throttle, debounce } from 'lodash-es';
import { useLocalStorage } from 'react-use';

/**
 * Checkbox sizes
 */
export type CheckboxSize = 'sm' | 'md' | 'lg';

/**
 * Checkbox variants
 */
export type CheckboxVariant = 'outline' | 'solid';

/**
 * Performance optimization options for checkbox
 */
export interface CheckboxPerformanceOptions {
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
 * Validation options for checkbox
 */
export interface CheckboxValidationOptions {
  /** Required field */
  required?: boolean;
  /** Custom validation function */
  validator?: (checked: boolean) => string | null;
  /** Validate on change */
  validateOnChange?: boolean;
}

/**
 * Extended Checkbox props with optimization features
 */
export interface CheckboxProps extends Omit<ChakraCheckboxProps, 'size' | 'variant' | 'onChange'> {
  /** Checkbox size */
  size?: CheckboxSize;
  /** Checkbox variant */
  variant?: CheckboxVariant;
  /** Checkbox label */
  label?: React.ReactNode;
  /** Helper text */
  helperText?: string;
  /** Error message */
  errorMessage?: string;
  /** Custom onChange handler */
  onChange?: (checked: boolean, event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Performance optimization settings */
  performance?: CheckboxPerformanceOptions;
  /** Validation options */
  validation?: CheckboxValidationOptions;
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
 * Extended CheckboxGroup props
 */
export interface CheckboxGroupProps extends Omit<ChakraCheckboxGroupProps, 'onChange'> {
  /** Group label */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Error message */
  errorMessage?: string;
  /** Checkbox options */
  options?: Array<{
    value: string;
    label: React.ReactNode;
    disabled?: boolean;
  }>;
  /** Custom onChange handler */
  onChange?: (values: string[]) => void;
  /** Performance optimization settings */
  performance?: CheckboxPerformanceOptions;
  /** Storage key for value persistence */
  storageKey?: string;
  /** Custom test ID */
  testId?: string;
  /** Stack direction */
  direction?: 'row' | 'column';
  /** Stack spacing */
  spacing?: string | number;
}

/**
 * Optimized change handler factory for single checkbox
 */
const useOptimizedCheckboxChangeHandler = (
  originalOnChange?: (checked: boolean, event: React.ChangeEvent<HTMLInputElement>) => void,
  throttleMs?: number,
  debounceMs?: number,
  analytics?: CheckboxProps['analytics']
) => {
  return useMemo(() => {
    if (!originalOnChange) return undefined;

    let optimizedHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
      const checked = event.target.checked;
      
      // Track analytics
      if (analytics && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', analytics.action || 'checkbox_toggle', {
          event_category: analytics.category || 'checkbox',
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
 * Checkbox validation hook
 */
const useCheckboxValidation = (
  checked: boolean,
  validation?: CheckboxValidationOptions
) => {
  const [error, setError] = React.useState<string | null>(null);

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
 * Optimized Checkbox Component
 */
const CheckboxComponent = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      size = 'md',
      variant = 'outline',
      label,
      helperText,
      errorMessage,
      onChange,
      performance = { memoize: true, throttleChange: 100 },
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
      storageKey || 'checkbox-value',
      defaultChecked || false
    );

    // Determine current checked state
    const currentChecked = controlledChecked ?? (performance.persistValue && storageKey ? persistedChecked : defaultChecked || false);

    // Checkbox validation
    const { error: validationError } = useCheckboxValidation(currentChecked, validation);

    // Optimized change handler
    const optimizedChangeHandler = useOptimizedCheckboxChangeHandler(
      onChange,
      performance.throttleChange,
      performance.debounceChange,
      analytics
    );

    // Combined change handler with persistence
    const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
      const checked = event.target.checked;
      
      if (performance.persistValue && storageKey) {
        setPersistedChecked(checked);
      }
      
      optimizedChangeHandler?.(event);
    }, [optimizedChangeHandler, performance.persistValue, storageKey, setPersistedChecked]);

    // Memoized checkbox props
    const checkboxProps = useMemo(() => ({
      size,
      variant,
      isChecked: currentChecked,
      onChange: handleChange,
      'data-testid': testId,
      isInvalid: !!validationError || !!errorMessage,
      ...rest,
    }), [size, variant, currentChecked, handleChange, testId, validationError, errorMessage, rest]);

    // Render checkbox with optional form control wrapper
    const checkboxElement = (
      <ChakraCheckbox ref={ref} {...checkboxProps}>
        {label}
      </ChakraCheckbox>
    );

    // Wrap with FormControl if helper text or error message is provided
    if (helperText || validationError || errorMessage) {
      return (
        <FormControl isInvalid={!!validationError || !!errorMessage}>
          {checkboxElement}
          {(validationError || errorMessage) && (
            <FormErrorMessage>{validationError || errorMessage}</FormErrorMessage>
          )}
          {helperText && !validationError && !errorMessage && (
            <FormHelperText>{helperText}</FormHelperText>
          )}
        </FormControl>
      );
    }

    return checkboxElement;
  }
);

CheckboxComponent.displayName = 'OptimizedCheckbox';

/**
 * Optimized CheckboxGroup Component
 */
const CheckboxGroupComponent = React.forwardRef<HTMLDivElement, CheckboxGroupProps>(
  (
    {
      label,
      helperText,
      errorMessage,
      options = [],
      onChange,
      performance = { memoize: true },
      storageKey,
      testId,
      direction = 'column',
      spacing = 2,
      value: controlledValue,
      defaultValue,
      children,
      ...rest
    },
    ref
  ) => {
    // Value persistence
    const [persistedValue, setPersistedValue] = useLocalStorage<string[]>(
      storageKey || 'checkbox-group-value',
      defaultValue || []
    );

    // Determine current value
    const currentValue = controlledValue ?? (performance.persistValue && storageKey ? persistedValue : defaultValue || []);

    // Combined change handler with persistence
    const handleChange = useCallback((values: string[]) => {
      if (performance.persistValue && storageKey) {
        setPersistedValue(values);
      }
      onChange?.(values);
    }, [onChange, performance.persistValue, storageKey, setPersistedValue]);

    // Memoized group props
    const groupProps = useMemo(() => ({
      value: currentValue,
      onChange: handleChange,
      'data-testid': testId,
      ...rest,
    }), [currentValue, handleChange, testId, rest]);

    // Render options or children
    const content = options.length > 0 ? (
      <Stack direction={direction} spacing={spacing}>
        {options.map((option) => (
          <ChakraCheckbox
            key={option.value}
            value={option.value}
            isDisabled={option.disabled}
          >
            {option.label}
          </ChakraCheckbox>
        ))}
      </Stack>
    ) : (
      children
    );

    // Render with optional form control wrapper
    const groupElement = (
      <ChakraCheckboxGroup ref={ref} {...groupProps}>
        {content}
      </ChakraCheckboxGroup>
    );

    if (label || helperText || errorMessage) {
      return (
        <FormControl isInvalid={!!errorMessage}>
          {label && <FormLabel>{label}</FormLabel>}
          {groupElement}
          {errorMessage && <FormErrorMessage>{errorMessage}</FormErrorMessage>}
          {helperText && !errorMessage && <FormHelperText>{helperText}</FormHelperText>}
        </FormControl>
      );
    }

    return groupElement;
  }
);

CheckboxGroupComponent.displayName = 'OptimizedCheckboxGroup';

// Memoized exports
export const OptimizedCheckbox = React.memo(CheckboxComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof CheckboxProps)[] = [
    'size', 'variant', 'isChecked', 'isDisabled', 'label', 'errorMessage'
  ];
  
  return keysToCompare.every(key => prevProps[key] === nextProps[key]);
});

export const OptimizedCheckboxGroup = React.memo(CheckboxGroupComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof CheckboxGroupProps)[] = [
    'value', 'options', 'direction', 'spacing', 'label', 'errorMessage'
  ];
  
  return keysToCompare.every(key => prevProps[key] === nextProps[key]);
});

// Default exports
export default OptimizedCheckbox;
export { OptimizedCheckboxGroup as CheckboxGroup };