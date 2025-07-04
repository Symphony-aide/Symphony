import React, { useMemo, useCallback, useState } from 'react';
import {
  Slider as ChakraSlider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  SliderProps as ChakraSliderProps,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Box,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import { throttle, debounce } from 'lodash-es';
import { useLocalStorage } from 'react-use';

/**
 * Slider sizes
 */
export type SliderSize = 'sm' | 'md' | 'lg';

/**
 * Slider orientations
 */
export type SliderOrientation = 'horizontal' | 'vertical';

/**
 * Performance optimization options for slider
 */
export interface SliderPerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Throttle change events (ms) */
  throttleChange?: number;
  /** Debounce change events (ms) */
  debounceChange?: number;
  /** Enable value persistence */
  persistValue?: boolean;
  /** Show tooltip on hover */
  showTooltip?: boolean;
}

/**
 * Validation options for slider
 */
export interface SliderValidationOptions {
  /** Required field */
  required?: boolean;
  /** Custom validation function */
  validator?: (value: number | number[]) => string | null;
  /** Validate on change */
  validateOnChange?: boolean;
}

/**
 * Extended Slider props with optimization features
 */
export interface SliderProps extends Omit<ChakraSliderProps, 'size' | 'orientation' | 'onChange' | 'onChangeEnd'> {
  /** Slider size */
  size?: SliderSize;
  /** Slider orientation */
  orientation?: SliderOrientation;
  /** Slider label */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Error message */
  errorMessage?: string;
  /** Show value label */
  showValue?: boolean;
  /** Value formatter function */
  valueFormatter?: (value: number) => string;
  /** Show marks */
  showMarks?: boolean;
  /** Mark positions */
  marks?: number[];
  /** Mark labels */
  markLabels?: Record<number, string>;
  /** Custom onChange handler */
  onChange?: (value: number | number[]) => void;
  /** Custom onChangeEnd handler */
  onChangeEnd?: (value: number | number[]) => void;
  /** Performance optimization settings */
  performance?: SliderPerformanceOptions;
  /** Validation options */
  validation?: SliderValidationOptions;
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
  originalOnChange?: (value: number | number[]) => void,
  throttleMs?: number,
  debounceMs?: number,
  analytics?: SliderProps['analytics']
) => {
  return useMemo(() => {
    if (!originalOnChange) return undefined;

    let optimizedHandler = (value: number | number[]) => {
      // Track analytics
      if (analytics && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', analytics.action || 'slider_change', {
          event_category: analytics.category || 'slider',
          event_label: analytics.label,
          value: Array.isArray(value) ? value[0] : value,
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
 * Slider validation hook
 */
const useSliderValidation = (
  value: number | number[],
  validation?: SliderValidationOptions
) => {
  const [error, setError] = useState<string | null>(null);

  const validateValue = useCallback((val: number | number[]) => {
    if (!validation) return null;

    if (validation.required && (Array.isArray(val) ? val.length === 0 : val === undefined)) {
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

  return { error, isValid: !error };
};

/**
 * Default value formatter
 */
const defaultValueFormatter = (value: number) => value.toString();

/**
 * Optimized Slider Component
 */
const SliderComponent = React.forwardRef<HTMLDivElement, SliderProps>(
  (
    {
      size = 'md',
      orientation = 'horizontal',
      label,
      helperText,
      errorMessage,
      showValue = false,
      valueFormatter = defaultValueFormatter,
      showMarks = false,
      marks = [],
      markLabels = {},
      onChange,
      onChangeEnd,
      performance = { memoize: true, throttleChange: 16, showTooltip: true },
      validation,
      storageKey,
      testId,
      analytics,
      value: controlledValue,
      defaultValue,
      min = 0,
      max = 100,
      step = 1,
      ...rest
    },
    ref
  ) => {
    // Value persistence
    const [persistedValue, setPersistedValue] = useLocalStorage<number | number[]>(
      storageKey || 'slider-value',
      defaultValue || min
    );

    // Internal state
    const [internalValue, setInternalValue] = useState<number | number[]>(
      controlledValue ?? (performance.persistValue && storageKey ? persistedValue : defaultValue || min)
    );

    // Tooltip state
    const [showTooltip, setShowTooltip] = useState(false);

    // Determine current value
    const currentValue = controlledValue ?? internalValue;

    // Slider validation
    const { error: validationError } = useSliderValidation(currentValue, validation);

    // Optimized change handlers
    const optimizedChangeHandler = useOptimizedChangeHandler(
      onChange,
      performance.throttleChange,
      performance.debounceChange,
      analytics
    );

    const optimizedChangeEndHandler = useOptimizedChangeHandler(
      onChangeEnd,
      undefined,
      undefined,
      analytics
    );

    // Combined change handler with persistence
    const handleChange = useCallback((value: number | number[]) => {
      if (controlledValue === undefined) {
        setInternalValue(value);
      }
      
      if (performance.persistValue && storageKey) {
        setPersistedValue(value);
      }
      
      optimizedChangeHandler?.(value);
    }, [controlledValue, optimizedChangeHandler, performance.persistValue, storageKey, setPersistedValue]);

    // Handle change end
    const handleChangeEnd = useCallback((value: number | number[]) => {
      optimizedChangeEndHandler?.(value);
    }, [optimizedChangeEndHandler]);

    // Memoized slider props
    const sliderProps = useMemo(() => ({
      size,
      orientation,
      value: currentValue,
      min,
      max,
      step,
      onChange: handleChange,
      onChangeEnd: handleChangeEnd,
      'data-testid': testId,
      isInvalid: !!validationError || !!errorMessage,
      ...rest,
    }), [
      size,
      orientation,
      currentValue,
      min,
      max,
      step,
      handleChange,
      handleChangeEnd,
      testId,
      validationError,
      errorMessage,
      rest
    ]);

    // Memoized slider marks
    const sliderMarks = useMemo(() => {
      if (!showMarks || marks.length === 0) return null;

      return marks.map((mark) => (
        <SliderMark
          key={mark}
          value={mark}
          mt={orientation === 'horizontal' ? '1' : undefined}
          ml={orientation === 'vertical' ? '1' : undefined}
          fontSize="sm"
          color="gray.500"
        >
          {markLabels[mark] || mark}
        </SliderMark>
      ));
    }, [showMarks, marks, markLabels, orientation]);

    // Memoized value display
    const valueDisplay = useMemo(() => {
      if (!showValue) return null;

      const displayValue = Array.isArray(currentValue) 
        ? currentValue.map(valueFormatter).join(' - ')
        : valueFormatter(currentValue as number);

      return (
        <Text fontSize="sm" color="gray.600" textAlign="right">
          {displayValue}
        </Text>
      );
    }, [showValue, currentValue, valueFormatter]);

    // Render slider
    const sliderElement = (
      <Box position="relative">
        <ChakraSlider
          ref={ref}
          {...sliderProps}
          onMouseEnter={() => performance.showTooltip && setShowTooltip(true)}
          onMouseLeave={() => performance.showTooltip && setShowTooltip(false)}
        >
          {sliderMarks}
          <SliderTrack>
            <SliderFilledTrack />
          </SliderTrack>
          <Tooltip
            hasArrow
            bg="blue.500"
            color="white"
            placement="top"
            isOpen={showTooltip && performance.showTooltip}
            label={
              Array.isArray(currentValue)
                ? currentValue.map(valueFormatter).join(' - ')
                : valueFormatter(currentValue as number)
            }
          >
            <SliderThumb />
          </Tooltip>
        </ChakraSlider>
      </Box>
    );

    // Wrap with FormControl if label, helper text, or error message is provided
    if (label || helperText || validationError || errorMessage || showValue) {
      return (
        <FormControl isInvalid={!!validationError || !!errorMessage}>
          {(label || showValue) && (
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              {label && <FormLabel mb={0}>{label}</FormLabel>}
              {valueDisplay}
            </Box>
          )}
          {sliderElement}
          {(validationError || errorMessage) && (
            <FormErrorMessage>{validationError || errorMessage}</FormErrorMessage>
          )}
          {helperText && !validationError && !errorMessage && (
            <FormHelperText>{helperText}</FormHelperText>
          )}
        </FormControl>
      );
    }

    return sliderElement;
  }
);

SliderComponent.displayName = 'OptimizedSlider';

/**
 * Memoized OptimizedSlider export
 */
export const OptimizedSlider = React.memo(SliderComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof SliderProps)[] = [
    'size', 'orientation', 'value', 'min', 'max', 'step', 'label', 'errorMessage', 'marks'
  ];
  
  return keysToCompare.every(key => {
    if (key === 'marks') {
      return JSON.stringify(prevProps[key]) === JSON.stringify(nextProps[key]);
    }
    return prevProps[key] === nextProps[key];
  });
});

// Default export
export default OptimizedSlider;