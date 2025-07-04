import React, { useMemo, useCallback, useState } from 'react';
import {
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  VStack,
  Button,
  Box,
  FormControlProps,
} from '@chakra-ui/react';
import { useForm, UseFormReturn, FieldValues, SubmitHandler, UseFormProps } from 'react-hook-form';
import { throttle, debounce } from 'lodash-es';
import { useLocalStorage } from 'react-use';

/**
 * Form field types
 */
export type FormFieldType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file';

/**
 * Form field configuration
 */
export interface FormFieldConfig {
  /** Field name */
  name: string;
  /** Field type */
  type: FormFieldType;
  /** Field label */
  label?: string;
  /** Field placeholder */
  placeholder?: string;
  /** Helper text */
  helperText?: string;
  /** Whether field is required */
  required?: boolean;
  /** Validation rules */
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | true;
  };
  /** Field options (for select, radio) */
  options?: Array<{ value: string; label: string }>;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Default value */
  defaultValue?: any;
}

/**
 * Performance optimization options for form
 */
export interface FormPerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Debounce validation (ms) */
  debounceValidation?: number;
  /** Throttle submit events (ms) */
  throttleSubmit?: number;
  /** Auto-save form data */
  autoSave?: boolean;
  /** Auto-save interval (ms) */
  autoSaveInterval?: number;
  /** Persist form data */
  persistData?: boolean;
}

/**
 * Form props
 */
export interface FormProps<T extends FieldValues = FieldValues> extends Omit<UseFormProps<T>, 'defaultValues'> {
  /** Form fields configuration */
  fields?: FormFieldConfig[];
  /** Form default values */
  defaultValues?: T;
  /** Submit handler */
  onSubmit?: SubmitHandler<T>;
  /** Form validation handler */
  onValidate?: (data: T) => Record<string, string> | void;
  /** Submit button text */
  submitText?: string;
  /** Reset button text */
  resetText?: string;
  /** Whether to show reset button */
  showReset?: boolean;
  /** Performance optimization settings */
  performance?: FormPerformanceOptions;
  /** Storage key for data persistence */
  storageKey?: string;
  /** Custom test ID */
  testId?: string;
  /** Analytics tracking */
  analytics?: {
    category?: string;
    action?: string;
    label?: string;
  };
  /** Form content */
  children?: (form: UseFormReturn<T>) => React.ReactNode;
}

/**
 * Form field props
 */
export interface FormFieldProps extends FormControlProps {
  /** Field configuration */
  field: FormFieldConfig;
  /** Form instance */
  form: UseFormReturn<any>;
  /** Custom test ID */
  testId?: string;
}

/**
 * Optimized submit handler factory
 */
const useOptimizedSubmitHandler = <T extends FieldValues>(
  originalOnSubmit?: SubmitHandler<T>,
  throttleMs?: number,
  analytics?: FormProps<T>['analytics']
) => {
  return useMemo(() => {
    if (!originalOnSubmit) return undefined;

    let optimizedHandler: SubmitHandler<T> = (data, event) => {
      // Track analytics
      if (analytics && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', analytics.action || 'form_submit', {
          event_category: analytics.category || 'form',
          event_label: analytics.label,
        });
      }
      
      originalOnSubmit(data, event);
    };

    // Apply throttling
    if (throttleMs) {
      optimizedHandler = throttle(optimizedHandler, throttleMs, { 
        leading: true, 
        trailing: false 
      });
    }

    return optimizedHandler;
  }, [originalOnSubmit, throttleMs, analytics]);
};

/**
 * Auto-save hook
 */
const useAutoSave = <T extends FieldValues>(
  form: UseFormReturn<T>,
  enabled: boolean = false,
  interval: number = 5000,
  storageKey?: string
) => {
  const [, setPersistedData] = useLocalStorage<T>(storageKey || 'form-data', {} as T);

  React.useEffect(() => {
    if (!enabled || !storageKey) return;

    const subscription = form.watch((data) => {
      const timer = setTimeout(() => {
        setPersistedData(data as T);
      }, interval);

      return () => clearTimeout(timer);
    });

    return () => subscription.unsubscribe();
  }, [form, enabled, interval, storageKey, setPersistedData]);
};

/**
 * Render form field based on type
 */
const renderFormField = (field: FormFieldConfig, form: UseFormReturn<any>, testId?: string) => {
  const { register, formState: { errors } } = form;
  const error = errors[field.name];

  const fieldProps = {
    ...register(field.name, {
      required: field.required ? `${field.label || field.name} is required` : false,
      minLength: field.validation?.minLength ? {
        value: field.validation.minLength,
        message: `Minimum length is ${field.validation.minLength}`,
      } : undefined,
      maxLength: field.validation?.maxLength ? {
        value: field.validation.maxLength,
        message: `Maximum length is ${field.validation.maxLength}`,
      } : undefined,
      pattern: field.validation?.pattern ? {
        value: field.validation.pattern,
        message: 'Invalid format',
      } : undefined,
      validate: field.validation?.custom,
    }),
    placeholder: field.placeholder,
    disabled: field.disabled,
    'data-testid': `${testId}-field-${field.name}`,
  };

  switch (field.type) {
    case 'textarea':
      return (
        <textarea
          {...fieldProps}
          rows={4}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            fontSize: '16px',
            resize: 'vertical',
          }}
        />
      );

    case 'select':
      return (
        <select
          {...fieldProps}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            fontSize: '16px',
            backgroundColor: 'white',
          }}
        >
          <option value="">Select an option</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );

    case 'checkbox':
      return (
        <input
          {...fieldProps}
          type="checkbox"
          style={{ marginRight: '8px' }}
        />
      );

    case 'radio':
      return (
        <div>
          {field.options?.map((option) => (
            <label key={option.value} style={{ display: 'block', marginBottom: '8px' }}>
              <input
                {...register(field.name)}
                type="radio"
                value={option.value}
                style={{ marginRight: '8px' }}
              />
              {option.label}
            </label>
          ))}
        </div>
      );

    default:
      return (
        <input
          {...fieldProps}
          type={field.type}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            fontSize: '16px',
          }}
        />
      );
  }
};

/**
 * Optimized FormField Component
 */
const FormFieldComponent = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ field, form, testId, ...rest }, ref) => {
    const { formState: { errors } } = form;
    const error = errors[field.name];

    const fieldProps = useMemo(() => ({
      isInvalid: !!error,
      isRequired: field.required,
      'data-testid': testId,
      ...rest,
    }), [error, field.required, testId, rest]);

    return (
      <FormControl ref={ref} {...fieldProps}>
        {field.label && (
          <FormLabel htmlFor={field.name}>
            {field.label}
          </FormLabel>
        )}
        
        {renderFormField(field, form, testId)}
        
        {error && (
          <FormErrorMessage>
            {error.message}
          </FormErrorMessage>
        )}
        
        {field.helperText && !error && (
          <FormHelperText>
            {field.helperText}
          </FormHelperText>
        )}
      </FormControl>
    );
  }
);

FormFieldComponent.displayName = 'OptimizedFormField';

/**
 * Optimized Form Component
 */
const FormComponent = <T extends FieldValues = FieldValues>({
  fields = [],
  defaultValues,
  onSubmit,
  onValidate,
  submitText = 'Submit',
  resetText = 'Reset',
  showReset = false,
  performance = { 
    memoize: true, 
    throttleSubmit: 300,
    autoSave: false,
    autoSaveInterval: 5000,
    persistData: false
  },
  storageKey,
  testId,
  analytics,
  children,
  ...formOptions
}: FormProps<T>) => {
  // Data persistence
  const [persistedData] = useLocalStorage<T>(
    storageKey || 'form-data',
    defaultValues || {} as T
  );

  // Form instance
  const form = useForm<T>({
    defaultValues: performance.persistData && storageKey ? persistedData : defaultValues,
    mode: 'onChange',
    ...formOptions,
  });

  const { handleSubmit, reset, formState: { isSubmitting, isValid } } = form;

  // Auto-save functionality
  useAutoSave(
    form,
    performance.autoSave,
    performance.autoSaveInterval,
    storageKey
  );

  // Optimized submit handler
  const optimizedSubmitHandler = useOptimizedSubmitHandler(
    onSubmit,
    performance.throttleSubmit,
    analytics
  );

  // Handle form submission
  const handleFormSubmit = useCallback((data: T) => {
    // Custom validation
    if (onValidate) {
      const validationErrors = onValidate(data);
      if (validationErrors) {
        Object.entries(validationErrors).forEach(([field, message]) => {
          form.setError(field as any, { message });
        });
        return;
      }
    }

    optimizedSubmitHandler?.(data);
  }, [onValidate, optimizedSubmitHandler, form]);

  // Handle form reset
  const handleReset = useCallback(() => {
    reset(defaultValues);
  }, [reset, defaultValues]);

  // Memoized form content
  const formContent = useMemo(() => {
    if (children) {
      return children(form);
    }

    return (
      <VStack spacing={4} align="stretch">
        {fields.map((field) => (
          <FormFieldComponent
            key={field.name}
            field={field}
            form={form}
            testId={`${testId}-field-${field.name}`}
          />
        ))}
      </VStack>
    );
  }, [children, form, fields, testId]);

  return (
    <Box as="form" onSubmit={handleSubmit(handleFormSubmit)} data-testid={testId}>
      {formContent}
      
      <VStack spacing={3} mt={6}>
        <Button
          type="submit"
          colorScheme="blue"
          isLoading={isSubmitting}
          isDisabled={!isValid}
          width="full"
          data-testid={`${testId}-submit`}
        >
          {submitText}
        </Button>
        
        {showReset && (
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            width="full"
            data-testid={`${testId}-reset`}
          >
            {resetText}
          </Button>
        )}
      </VStack>
    </Box>
  );
};

/**
 * Memoized OptimizedForm export
 */
export const OptimizedForm = React.memo(FormComponent) as typeof FormComponent;
export const OptimizedFormField = React.memo(FormFieldComponent);

// Default exports
export default OptimizedForm;
export { OptimizedFormField as FormField };