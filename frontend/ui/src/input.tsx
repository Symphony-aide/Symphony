import {
  Input as ChakraInput,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  InputProps as ChakraInputProps,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  IconButton,
} from '@chakra-ui/react';
import { debounce, throttle } from 'lodash-es';
import { Eye, EyeOff } from 'lucide-react';
import React, { useMemo, useCallback, useState } from 'react';
import { useLocalStorage } from 'react-use';

/**
 * Input variants
 */
export type InputVariant = 'outline' | 'filled' | 'flushed' | 'unstyled';

/**
 * Input sizes
 */
export type InputSize = 'xs' | 'sm' | 'md' | 'lg';

/**
 * Performance optimization options for input
 */
export interface InputPerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Debounce onChange events (ms) */
  debounceChange?: number;
  /** Throttle onInput events (ms) */
  throttleInput?: number;
  /** Enable value persistence */
  persistValue?: boolean;
  /** Lazy validation */
  lazyValidation?: boolean;
}

/**
 * Validation options
 */
export interface InputValidationOptions {
  /** Required field */
  required?: boolean;
  /** Minimum length */
  minLength?: number;
  /** Maximum length */
  maxLength?: number;
  /** Custom validation pattern */
  pattern?: RegExp;
  /** Custom validation function */
  validator?: (value: string) => string | null;
  /** Validate on blur */
  validateOnBlur?: boolean;
  /** Validate on change */
  validateOnChange?: boolean;
}

/**
 * Extended Input props with optimization features
 */
export interface InputProps extends Omit<ChakraInputProps, 'variant' | 'size' | 'onChange' | 'onInput'> {
  /** Input variant */
  variant?: InputVariant;
  /** Input size */
  size?: InputSize;
  /** Input label */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Error message */
  errorMessage?: string;
  /** Left icon element */
  leftIcon?: React.ReactElement;
  /** Right icon element */
  rightIcon?: React.ReactElement;
  /** Show password toggle for password inputs */
  showPasswordToggle?: boolean;
  /** Custom onChange handler */
  onChange?: (value: string, event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Custom onInput handler */
  onInput?: (value: string, event: React.FormEvent<HTMLInputElement>) => void;
  /** Performance optimization settings */
  performance?: InputPerformanceOptions;
  /** Validation options */
  validation?: InputValidationOptions;
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
 * @param debounceMs
 * @param analytics
 */
const useOptimizedChangeHandler = (
  originalOnChange?: (value: string, event: React.ChangeEvent<HTMLInputElement>) => void,
  debounceMs?: number,
  analytics?: InputProps['analytics']
) => {
  return useMemo(() => {
    if (!originalOnChange) return undefined;

    let optimizedHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      
      // Track analytics
      if (analytics) {
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', analytics.action || 'input_change', {
            event_category: analytics.category || 'input',
            event_label: analytics.label,
          });
        }
      }
      
      originalOnChange(value, event);
    };

    // Apply debouncing
    if (debounceMs) {
      optimizedHandler = debounce(optimizedHandler, debounceMs);
    }

    return optimizedHandler;
  }, [originalOnChange, debounceMs, analytics]);
};

/**
 * Optimized input handler factory
 * @param originalOnInput
 * @param throttleMs
 */
const useOptimizedInputHandler = (
  originalOnInput?: (value: string, event: React.FormEvent<HTMLInputElement>) => void,
  throttleMs?: number
) => {
  return useMemo(() => {
    if (!originalOnInput) return undefined;

    let optimizedHandler = (event: React.FormEvent<HTMLInputElement>) => {
      const value = (event.target as HTMLInputElement).value;
      originalOnInput(value, event);
    };

    // Apply throttling
    if (throttleMs) {
      optimizedHandler = throttle(optimizedHandler, throttleMs);
    }

    return optimizedHandler;
  }, [originalOnInput, throttleMs]);
};

/**
 * Input validation hook
 * @param value
 * @param validation
 * @param lazy
 */
const useInputValidation = (
  value: string,
  validation?: InputValidationOptions,
  lazy: boolean = false
) => {
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const validateValue = useCallback((val: string) => {
    if (!validation) return null;

    if (validation.required && !val.trim()) {
      return 'This field is required';
    }

    if (validation.minLength && val.length < validation.minLength) {
      return `Minimum length is ${validation.minLength} characters`;
    }

    if (validation.maxLength && val.length > validation.maxLength) {
      return `Maximum length is ${validation.maxLength} characters`;
    }

    if (validation.pattern && !validation.pattern.test(val)) {
      return 'Invalid format';
    }

    if (validation.validator) {
      return validation.validator(val);
    }

    return null;
  }, [validation]);

  React.useEffect(() => {
    if (lazy && !touched) return;
    
    const errorMessage = validateValue(value);
    setError(errorMessage);
  }, [value, validateValue, lazy, touched]);

  const handleBlur = useCallback(() => {
    setTouched(true);
    if (validation?.validateOnBlur) {
      const errorMessage = validateValue(value);
      setError(errorMessage);
    }
  }, [validation, validateValue, value]);

  return { error, handleBlur, isValid: !error };
};

/**
 * Optimized Input Component
 */
const InputComponent = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = 'outline',
      size = 'md',
      label,
      helperText,
      errorMessage,
      leftIcon,
      rightIcon,
      showPasswordToggle = false,
      onChange,
      onInput,
      performance = { memoize: true, debounceChange: 300 },
      validation,
      storageKey,
      testId,
      analytics,
      type = 'text',
      value: controlledValue,
      defaultValue,
      ...rest
    },
    ref
  ) => {
    // Password visibility state
    const [showPassword, setShowPassword] = useState(false);
    
    // Value persistence
    const [persistedValue, setPersistedValue] = useLocalStorage<string>(
      storageKey || 'input-value',
      defaultValue || ''
    );

    // Determine current value
    const currentValue = controlledValue ?? (performance.persistValue && storageKey ? persistedValue : defaultValue || '');

    // Input validation
    const { error: validationError, handleBlur: validationBlur, isValid } = useInputValidation(
      currentValue || '',
      validation,
      performance.lazyValidation
    );

    // Optimized handlers
    const optimizedChangeHandler = useOptimizedChangeHandler(
      onChange,
      performance.debounceChange,
      analytics
    );

    const optimizedInputHandler = useOptimizedInputHandler(
      onInput,
      performance.throttleInput
    );

    // Combined change handler with persistence
    const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      
      if (performance.persistValue && storageKey) {
        setPersistedValue(value);
      }
      
      optimizedChangeHandler?.(event);
    }, [optimizedChangeHandler, performance.persistValue, storageKey, setPersistedValue]);

    // Combined blur handler
    const handleBlur = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
      validationBlur();
      rest.onBlur?.(event);
    }, [validationBlur, rest.onBlur]);

    // Password toggle handler
    const togglePasswordVisibility = useCallback(() => {
      setShowPassword(prev => !prev);
    }, []);

    // Determine input type
    const inputType = type === 'password' && showPassword ? 'text' : type;

    // Memoized input props
    const inputProps = useMemo(() => ({
      variant,
      size,
      type: inputType,
      value: currentValue,
      onChange: handleChange,
      onInput: optimizedInputHandler,
      onBlur: handleBlur,
      'data-testid': testId,
      isInvalid: !!validationError || !!errorMessage,
      ...rest,
    }), [
      variant,
      size,
      inputType,
      currentValue,
      handleChange,
      optimizedInputHandler,
      handleBlur,
      testId,
      validationError,
      errorMessage,
      rest
    ]);

    // Render password toggle button
    const passwordToggle = showPasswordToggle && type === 'password' && (
      <IconButton
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        icon={showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        size="sm"
        variant="ghost"
        onClick={togglePasswordVisibility}
      />
    );

    // Render input with optional form control wrapper
    const inputElement = (
      <InputGroup size={size}>
        {leftIcon && <InputLeftElement>{leftIcon}</InputLeftElement>}
        <ChakraInput ref={ref} {...inputProps} />
        {(rightIcon || passwordToggle) && (
          <InputRightElement>
            {passwordToggle || rightIcon}
          </InputRightElement>
        )}
      </InputGroup>
    );

    // Wrap with FormControl if label, helper text, or error message is provided
    if (label || helperText || validationError || errorMessage) {
      return (
        <FormControl isInvalid={!!validationError || !!errorMessage}>
          {label && <FormLabel>{label}</FormLabel>}
          {inputElement}
          {(validationError || errorMessage) && (
            <FormErrorMessage>{validationError || errorMessage}</FormErrorMessage>
          )}
          {helperText && !validationError && !errorMessage && (
            <FormHelperText>{helperText}</FormHelperText>
          )}
        </FormControl>
      );
    }

    return inputElement;
  }
);

InputComponent.displayName = 'OptimizedInput';

/**
 * Memoized OptimizedInput export for maximum performance
 */
export const OptimizedInput = React.memo(InputComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof InputProps)[] = [
    'variant', 'size', 'value', 'placeholder', 'isDisabled', 'isReadOnly', 'label', 'errorMessage'
  ];
  
  return keysToCompare.every(key => prevProps[key] === nextProps[key]);
});

// Default export
export default OptimizedInput;