import {
  Textarea as ChakraTextarea,
  TextareaProps as ChakraTextareaProps,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Box,
  Text,
  HStack,
} from '@chakra-ui/react';
import { debounce, throttle } from 'lodash-es';
import React, { useMemo, useCallback, useState } from 'react';
import { useLocalStorage } from 'react-use';

/**
 * Textarea sizes
 */
export type TextareaSize = 'xs' | 'sm' | 'md' | 'lg';

/**
 * Textarea variants
 */
export type TextareaVariant = 'outline' | 'filled' | 'flushed' | 'unstyled';

/**
 * Textarea resize options
 */
export type TextareaResize = 'none' | 'both' | 'horizontal' | 'vertical';

/**
 * Performance optimization options for textarea
 */
export interface TextareaPerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Debounce change events (ms) */
  debounceChange?: number;
  /** Throttle input events (ms) */
  throttleInput?: number;
  /** Enable value persistence */
  persistValue?: boolean;
  /** Auto-resize textarea */
  autoResize?: boolean;
}

/**
 * Validation options for textarea
 */
export interface TextareaValidationOptions {
  /** Required field */
  required?: boolean;
  /** Minimum length */
  minLength?: number;
  /** Maximum length */
  maxLength?: number;
  /** Custom validation function */
  validator?: (value: string) => string | null;
  /** Validate on change */
  validateOnChange?: boolean;
  /** Validate on blur */
  validateOnBlur?: boolean;
}

/**
 * Extended Textarea props with optimization features
 */
export interface TextareaProps extends Omit<ChakraTextareaProps, 'size' | 'variant' | 'resize' | 'onChange' | 'onInput'> {
  /** Textarea size */
  size?: TextareaSize;
  /** Textarea variant */
  variant?: TextareaVariant;
  /** Textarea resize behavior */
  resize?: TextareaResize;
  /** Textarea label */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Error message */
  errorMessage?: string;
  /** Show character count */
  showCharacterCount?: boolean;
  /** Custom onChange handler */
  onChange?: (value: string, event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  /** Custom onInput handler */
  onInput?: (value: string, event: React.FormEvent<HTMLTextAreaElement>) => void;
  /** Performance optimization settings */
  performance?: TextareaPerformanceOptions;
  /** Validation options */
  validation?: TextareaValidationOptions;
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
  originalOnChange?: (value: string, event: React.ChangeEvent<HTMLTextAreaElement>) => void,
  debounceMs?: number,
  analytics?: TextareaProps['analytics']
) => {
  return useMemo(() => {
    if (!originalOnChange) return undefined;

    let optimizedHandler = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = event.target.value;
      
      // Track analytics
      if (analytics && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', analytics.action || 'textarea_change', {
          event_category: analytics.category || 'textarea',
          event_label: analytics.label,
          value: value.length,
        });
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
  originalOnInput?: (value: string, event: React.FormEvent<HTMLTextAreaElement>) => void,
  throttleMs?: number
) => {
  return useMemo(() => {
    if (!originalOnInput) return undefined;

    let optimizedHandler = (event: React.FormEvent<HTMLTextAreaElement>) => {
      const value = (event.target as HTMLTextAreaElement).value;
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
 * Textarea validation hook
 * @param value
 * @param validation
 */
const useTextareaValidation = (
  value: string,
  validation?: TextareaValidationOptions
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

  const handleBlur = useCallback(() => {
    setTouched(true);
    if (validation?.validateOnBlur) {
      const errorMessage = validateValue(value);
      setError(errorMessage);
    }
  }, [validation, validateValue, value]);

  return { error, handleBlur, isValid: !error, touched };
};

/**
 * Auto-resize hook for textarea
 * @param enabled
 */
const useAutoResize = (enabled: boolean = false) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    if (!enabled || !textareaRef.current) return;

    const textarea = textareaRef.current;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [enabled]);

  React.useEffect(() => {
    if (enabled) {
      adjustHeight();
    }
  }, [adjustHeight, enabled]);

  return { textareaRef, adjustHeight };
};

/**
 * Optimized Textarea Component
 */
const TextareaComponent = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      size = 'md',
      variant = 'outline',
      resize = 'vertical',
      label,
      helperText,
      errorMessage,
      showCharacterCount = false,
      onChange,
      onInput,
      performance = { memoize: true, debounceChange: 300 },
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
      storageKey || 'textarea-value',
      defaultValue || ''
    );

    // Internal state
    const [internalValue, setInternalValue] = useState(
      controlledValue ?? (performance.persistValue && storageKey ? persistedValue : defaultValue || '')
    );

    // Determine current value
    const currentValue = controlledValue ?? internalValue;

    // Textarea validation
    const { error: validationError, handleBlur: validationBlur } = useTextareaValidation(
      currentValue,
      validation
    );

    // Auto-resize functionality
    const { textareaRef, adjustHeight } = useAutoResize(performance.autoResize);

    // Combine refs
    const combinedRef = useCallback((node: HTMLTextAreaElement) => {
      textareaRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    }, [ref, textareaRef]);

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
    const handleChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = event.target.value;
      
      if (controlledValue === undefined) {
        setInternalValue(value);
      }
      
      if (performance.persistValue && storageKey) {
        setPersistedValue(value);
      }
      
      if (performance.autoResize) {
        adjustHeight();
      }
      
      optimizedChangeHandler?.(event);
    }, [
      controlledValue,
      optimizedChangeHandler,
      performance.persistValue,
      performance.autoResize,
      storageKey,
      setPersistedValue,
      adjustHeight
    ]);

    // Combined input handler
    const handleInput = useCallback((event: React.FormEvent<HTMLTextAreaElement>) => {
      if (performance.autoResize) {
        adjustHeight();
      }
      optimizedInputHandler?.(event);
    }, [optimizedInputHandler, performance.autoResize, adjustHeight]);

    // Combined blur handler
    const handleBlur = useCallback((event: React.FocusEvent<HTMLTextAreaElement>) => {
      validationBlur();
      rest.onBlur?.(event);
    }, [validationBlur, rest.onBlur]);

    // Memoized textarea props
    const textareaProps = useMemo(() => ({
      size,
      variant,
      resize,
      value: currentValue,
      onChange: handleChange,
      onInput: handleInput,
      onBlur: handleBlur,
      'data-testid': testId,
      isInvalid: !!validationError || !!errorMessage,
      ...rest,
    }), [
      size,
      variant,
      resize,
      currentValue,
      handleChange,
      handleInput,
      handleBlur,
      testId,
      validationError,
      errorMessage,
      rest
    ]);

    // Memoized character count
    const characterCount = useMemo(() => {
      if (!showCharacterCount) return null;

      const count = currentValue.length;
      const maxLength = validation?.maxLength;
      const isOverLimit = maxLength && count > maxLength;

      return (
        <HStack justify="space-between" mt={1}>
          <Box />
          <Text
            fontSize="xs"
            color={isOverLimit ? 'red.500' : 'gray.500'}
          >
            {count}{maxLength && ` / ${maxLength}`}
          </Text>
        </HStack>
      );
    }, [showCharacterCount, currentValue, validation?.maxLength]);

    // Render textarea
    const textareaElement = (
      <Box>
        <ChakraTextarea ref={combinedRef} {...textareaProps} />
        {characterCount}
      </Box>
    );

    // Wrap with FormControl if label, helper text, or error message is provided
    if (label || helperText || validationError || errorMessage) {
      return (
        <FormControl isInvalid={!!validationError || !!errorMessage}>
          {label && <FormLabel>{label}</FormLabel>}
          {textareaElement}
          {(validationError || errorMessage) && (
            <FormErrorMessage>{validationError || errorMessage}</FormErrorMessage>
          )}
          {helperText && !validationError && !errorMessage && (
            <FormHelperText>{helperText}</FormHelperText>
          )}
        </FormControl>
      );
    }

    return textareaElement;
  }
);

TextareaComponent.displayName = 'OptimizedTextarea';

/**
 * Memoized OptimizedTextarea export
 */
export const OptimizedTextarea = React.memo(TextareaComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof TextareaProps)[] = [
    'size', 'variant', 'resize', 'value', 'placeholder', 'label', 'errorMessage'
  ];
  
  return keysToCompare.every(key => prevProps[key] === nextProps[key]);
});

// Default export
export default OptimizedTextarea;