import React, { useMemo, useCallback, useState, useRef } from 'react';
import {
  HStack,
  PinInput,
  PinInputField,
  PinInputProps,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
} from '@chakra-ui/react';
import { throttle, debounce } from 'lodash-es';
import { useLocalStorage } from 'react-use';

/**
 * OTP input sizes
 */
export type OTPInputSize = 'xs' | 'sm' | 'md' | 'lg';

/**
 * OTP input variants
 */
export type OTPInputVariant = 'outline' | 'filled' | 'flushed' | 'unstyled';

/**
 * Performance optimization options for OTP input
 */
export interface OTPInputPerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Debounce change events (ms) */
  debounceChange?: number;
  /** Throttle input events (ms) */
  throttleInput?: number;
  /** Enable value persistence */
  persistValue?: boolean;
  /** Auto-focus next field */
  autoFocus?: boolean;
}

/**
 * Validation options for OTP input
 */
export interface OTPInputValidationOptions {
  /** Required field */
  required?: boolean;
  /** Custom validation function */
  validator?: (value: string) => string | null;
  /** Validate on change */
  validateOnChange?: boolean;
  /** Validate on complete */
  validateOnComplete?: boolean;
}

/**
 * Extended OTP Input props with optimization features
 */
export interface OTPInputProps extends Omit<PinInputProps, 'onChange' | 'onComplete'> {
  /** Input size */
  size?: OTPInputSize;
  /** Input variant */
  variant?: OTPInputVariant;
  /** Number of input fields */
  length?: number;
  /** Input label */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Error message */
  errorMessage?: string;
  /** Custom onChange handler */
  onChange?: (value: string) => void;
  /** Custom onComplete handler */
  onComplete?: (value: string) => void;
  /** Performance optimization settings */
  performance?: OTPInputPerformanceOptions;
  /** Validation options */
  validation?: OTPInputValidationOptions;
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
  originalOnChange?: (value: string) => void,
  debounceMs?: number,
  analytics?: OTPInputProps['analytics']
) => {
  return useMemo(() => {
    if (!originalOnChange) return undefined;

    let optimizedHandler = (value: string) => {
      // Track analytics
      if (analytics && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', analytics.action || 'otp_input_change', {
          event_category: analytics.category || 'otp_input',
          event_label: analytics.label,
          value: value.length,
        });
      }
      
      originalOnChange(value);
    };

    // Apply debouncing
    if (debounceMs) {
      optimizedHandler = debounce(optimizedHandler, debounceMs);
    }

    return optimizedHandler;
  }, [originalOnChange, debounceMs, analytics]);
};

/**
 * Optimized complete handler factory
 */
const useOptimizedCompleteHandler = (
  originalOnComplete?: (value: string) => void,
  analytics?: OTPInputProps['analytics']
) => {
  return useMemo(() => {
    if (!originalOnComplete) return undefined;

    return (value: string) => {
      // Track analytics
      if (analytics && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', analytics.action || 'otp_input_complete', {
          event_category: analytics.category || 'otp_input',
          event_label: analytics.label,
        });
      }
      
      originalOnComplete(value);
    };
  }, [originalOnComplete, analytics]);
};

/**
 * OTP input validation hook
 */
const useOTPInputValidation = (
  value: string,
  length: number,
  validation?: OTPInputValidationOptions
) => {
  const [error, setError] = useState<string | null>(null);

  const validateValue = useCallback((val: string) => {
    if (!validation) return null;

    if (validation.required && !val.trim()) {
      return 'This field is required';
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

  React.useEffect(() => {
    if (validation?.validateOnComplete && value.length === length) {
      const errorMessage = validateValue(value);
      setError(errorMessage);
    }
  }, [value, length, validateValue, validation]);

  return { error, isValid: !error };
};

/**
 * Auto-focus hook for OTP input
 */
const useAutoFocus = (enabled: boolean = true) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const setInputRef = useCallback((index: number) => (ref: HTMLInputElement | null) => {
    inputRefs.current[index] = ref;
  }, []);

  const focusInput = useCallback((index: number) => {
    if (enabled && inputRefs.current[index]) {
      inputRefs.current[index]?.focus();
    }
  }, [enabled]);

  return { setInputRef, focusInput };
};

/**
 * Optimized OTPInput Component
 */
const OTPInputComponent = React.forwardRef<HTMLDivElement, OTPInputProps>(
  (
    {
      size = 'md',
      variant = 'outline',
      length = 6,
      label,
      helperText,
      errorMessage,
      onChange,
      onComplete,
      performance = { memoize: true, debounceChange: 100, autoFocus: true },
      validation,
      storageKey,
      testId,
      analytics,
      value: controlledValue,
      defaultValue,
      ...rest
    },
    ref
  ) => {
    // Value persistence
    const [persistedValue, setPersistedValue] = useLocalStorage<string>(
      storageKey || 'otp-input-value',
      defaultValue || ''
    );

    // Internal state
    const [internalValue, setInternalValue] = useState(
      controlledValue ?? (performance.persistValue && storageKey ? persistedValue : defaultValue || '')
    );

    // Determine current value
    const currentValue = controlledValue ?? internalValue;

    // OTP input validation
    const { error: validationError } = useOTPInputValidation(currentValue, length, validation);

    // Auto-focus functionality
    const { setInputRef, focusInput } = useAutoFocus(performance.autoFocus);

    // Optimized handlers
    const optimizedChangeHandler = useOptimizedChangeHandler(
      onChange,
      performance.debounceChange,
      analytics
    );

    const optimizedCompleteHandler = useOptimizedCompleteHandler(
      onComplete,
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

    // Combined complete handler
    const handleComplete = useCallback((value: string) => {
      optimizedCompleteHandler?.(value);
    }, [optimizedCompleteHandler]);

    // Memoized pin input props
    const pinInputProps = useMemo(() => ({
      size,
      variant,
      value: currentValue,
      onChange: handleChange,
      onComplete: handleComplete,
      'data-testid': testId,
      isInvalid: !!validationError || !!errorMessage,
      ...rest,
    }), [
      size,
      variant,
      currentValue,
      handleChange,
      handleComplete,
      testId,
      validationError,
      errorMessage,
      rest
    ]);

    // Render OTP input fields
    const inputFields = useMemo(() => {
      return Array.from({ length }, (_, index) => (
        <PinInputField
          key={index}
          ref={setInputRef(index)}
          data-testid={`${testId}-field-${index}`}
        />
      ));
    }, [length, setInputRef, testId]);

    // Render OTP input
    const otpInputElement = (
      <HStack spacing={2}>
        <PinInput {...pinInputProps}>
          {inputFields}
        </PinInput>
      </HStack>
    );

    // Wrap with FormControl if label, helper text, or error message is provided
    if (label || helperText || validationError || errorMessage) {
      return (
        <FormControl ref={ref} isInvalid={!!validationError || !!errorMessage}>
          {label && <FormLabel>{label}</FormLabel>}
          {otpInputElement}
          {(validationError || errorMessage) && (
            <FormErrorMessage>{validationError || errorMessage}</FormErrorMessage>
          )}
          {helperText && !validationError && !errorMessage && (
            <FormHelperText>{helperText}</FormHelperText>
          )}
        </FormControl>
      );
    }

    return (
      <div ref={ref}>
        {otpInputElement}
      </div>
    );
  }
);

OTPInputComponent.displayName = 'OptimizedOTPInput';

/**
 * Memoized OptimizedOTPInput export
 */
export const OptimizedOTPInput = React.memo(OTPInputComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof OTPInputProps)[] = [
    'size', 'variant', 'length', 'value', 'label', 'errorMessage'
  ];
  
  return keysToCompare.every(key => prevProps[key] === nextProps[key]);
});

// Default export
export default OptimizedOTPInput;