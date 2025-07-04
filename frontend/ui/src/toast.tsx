import {
  useToast as useChakraToast,
  UseToastOptions as ChakraToastOptions,
  ToastId,
} from '@chakra-ui/react';
import { throttle } from 'lodash-es';
import React, { useMemo, useCallback } from 'react';

/**
 * Toast status types
 */
export type ToastStatus = 'success' | 'error' | 'warning' | 'info' | 'loading';

/**
 * Toast position types
 */
export type ToastPosition = 
  | 'top' | 'top-left' | 'top-right'
  | 'bottom' | 'bottom-left' | 'bottom-right';

/**
 * Performance optimization options for toast
 */
export interface ToastPerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Throttle toast events (ms) */
  throttleToasts?: number;
  /** Maximum number of toasts */
  maxToasts?: number;
  /** Auto-dismiss timeout (ms) */
  autoDismissTimeout?: number;
  /** Group similar toasts */
  groupSimilar?: boolean;
}

/**
 * Extended toast options with optimization features
 */
export interface ToastOptions extends Omit<ChakraToastOptions, 'status' | 'position' | 'duration'> {
  /** Toast status */
  status?: ToastStatus;
  /** Toast position */
  position?: ToastPosition;
  /** Toast duration (ms) */
  duration?: number;
  /** Performance optimization settings */
  performance?: ToastPerformanceOptions;
  /** Analytics tracking */
  analytics?: {
    category?: string;
    action?: string;
    label?: string;
  };
}

/**
 * Toast hook return type
 */
export interface UseToastReturn {
  /** Show a toast */
  toast: (options: ToastOptions) => ToastId;
  /** Show success toast */
  success: (title: string, options?: Omit<ToastOptions, 'status'>) => ToastId;
  /** Show error toast */
  error: (title: string, options?: Omit<ToastOptions, 'status'>) => ToastId;
  /** Show warning toast */
  warning: (title: string, options?: Omit<ToastOptions, 'status'>) => ToastId;
  /** Show info toast */
  info: (title: string, options?: Omit<ToastOptions, 'status'>) => ToastId;
  /** Show loading toast */
  loading: (title: string, options?: Omit<ToastOptions, 'status'>) => ToastId;
  /** Close a specific toast */
  close: (id: ToastId) => void;
  /** Close all toasts */
  closeAll: () => void;
  /** Update a toast */
  update: (id: ToastId, options: Partial<ToastOptions>) => void;
  /** Check if toast is active */
  isActive: (id: ToastId) => boolean;
}

/**
 * Optimized toast handler factory
 * @param originalToast
 * @param throttleMs
 * @param analytics
 */
const useOptimizedToastHandler = (
  originalToast: ReturnType<typeof useChakraToast>,
  throttleMs?: number,
  analytics?: ToastOptions['analytics']
) => {
  return useMemo(() => {
    let optimizedHandler = (options: ToastOptions) => {
      // Track analytics
      if (analytics && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', analytics.action || 'toast_show', {
          event_category: analytics.category || 'toast',
          event_label: analytics.label || options.status || 'default',
        });
      }

      const { performance, analytics: _, ...toastOptions } = options;
      
      // Apply performance settings
      const finalOptions = {
        ...toastOptions,
        duration: toastOptions.duration ?? performance?.autoDismissTimeout ?? 5000,
        isClosable: toastOptions.isClosable ?? true,
      };

      return originalToast(finalOptions);
    };

    // Apply throttling
    if (throttleMs) {
      optimizedHandler = throttle(optimizedHandler, throttleMs, { 
        leading: true, 
        trailing: false 
      });
    }

    return optimizedHandler;
  }, [originalToast, throttleMs, analytics]);
};

/**
 * Toast deduplication hook
 * @param groupSimilar
 */
const useToastDeduplication = (groupSimilar: boolean = false) => {
  const activeToasts = React.useRef<Map<string, ToastId>>(new Map());

  const getToastKey = useCallback((options: ToastOptions) => {
    return `${options.status || 'default'}-${options.title}-${options.description || ''}`;
  }, []);

  const shouldShowToast = useCallback((options: ToastOptions) => {
    if (!groupSimilar) return true;
    
    const key = getToastKey(options);
    return !activeToasts.current.has(key);
  }, [groupSimilar, getToastKey]);

  const registerToast = useCallback((options: ToastOptions, id: ToastId) => {
    if (!groupSimilar) return;
    
    const key = getToastKey(options);
    activeToasts.current.set(key, id);
    
    // Clean up after toast duration
    const duration = options.duration ?? options.performance?.autoDismissTimeout ?? 5000;
    setTimeout(() => {
      activeToasts.current.delete(key);
    }, duration);
  }, [groupSimilar, getToastKey]);

  return { shouldShowToast, registerToast };
};

/**
 * Optimized useToast hook
 * @param defaultOptions
 */
export const useToast = (defaultOptions?: Partial<ToastOptions>): UseToastReturn => {
  const chakraToast = useChakraToast();
  
  // Toast deduplication
  const { shouldShowToast, registerToast } = useToastDeduplication(
    defaultOptions?.performance?.groupSimilar
  );

  // Optimized toast handler
  const optimizedToastHandler = useOptimizedToastHandler(
    chakraToast,
    defaultOptions?.performance?.throttleToasts,
    defaultOptions?.analytics
  );

  // Main toast function
  const toast = useCallback((options: ToastOptions) => {
    const finalOptions = { ...defaultOptions, ...options };
    
    if (!shouldShowToast(finalOptions)) {
      return '' as ToastId; // Return empty ID for deduplicated toasts
    }
    
    const id = optimizedToastHandler(finalOptions);
    registerToast(finalOptions, id);
    
    return id;
  }, [defaultOptions, optimizedToastHandler, shouldShowToast, registerToast]);

  // Convenience methods
  const success = useCallback((title: string, options?: Omit<ToastOptions, 'status'>) => {
    return toast({ ...options, title, status: 'success' });
  }, [toast]);

  const error = useCallback((title: string, options?: Omit<ToastOptions, 'status'>) => {
    return toast({ ...options, title, status: 'error' });
  }, [toast]);

  const warning = useCallback((title: string, options?: Omit<ToastOptions, 'status'>) => {
    return toast({ ...options, title, status: 'warning' });
  }, [toast]);

  const info = useCallback((title: string, options?: Omit<ToastOptions, 'status'>) => {
    return toast({ ...options, title, status: 'info' });
  }, [toast]);

  const loading = useCallback((title: string, options?: Omit<ToastOptions, 'status'>) => {
    return toast({ ...options, title, status: 'loading' });
  }, [toast]);

  // Toast management methods
  const close = useCallback((id: ToastId) => {
    chakraToast.close(id);
  }, [chakraToast]);

  const closeAll = useCallback(() => {
    chakraToast.closeAll();
  }, [chakraToast]);

  const update = useCallback((id: ToastId, options: Partial<ToastOptions>) => {
    const { performance, analytics, ...updateOptions } = options;
    chakraToast.update(id, updateOptions);
  }, [chakraToast]);

  const isActive = useCallback((id: ToastId) => {
    return chakraToast.isActive(id);
  }, [chakraToast]);

  return {
    toast,
    success,
    error,
    warning,
    info,
    loading,
    close,
    closeAll,
    update,
    isActive,
  };
};

/**
 * Promise-based toast utilities
 */
export const promiseToast = {
  /**
   * Show a loading toast that updates based on promise resolution
   * @param promise
   * @param options
   * @param options.loading
   * @param options.success
   * @param options.error
   * @param options.toastOptions
   */
  promise: async <T,>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
      toastOptions?: Partial<ToastOptions>;
    }
  ): Promise<T> => {
    const { toast, close, update } = useToast();
    
    const loadingId = toast({
      title: options.loading,
      status: 'loading',
      duration: null, // Keep loading toast until resolved
      ...options.toastOptions,
    });

    try {
      const result = await promise;
      
      const successMessage = typeof options.success === 'function' 
        ? options.success(result) 
        : options.success;
      
      update(loadingId, {
        title: successMessage,
        status: 'success',
        duration: 5000,
      });
      
      return result;
    } catch (error) {
      const errorMessage = typeof options.error === 'function' 
        ? options.error(error) 
        : options.error;
      
      update(loadingId, {
        title: errorMessage,
        status: 'error',
        duration: 5000,
      });
      
      throw error;
    }
  },
};

/**
 * Batch toast utilities
 */
export const batchToast = {
  /**
   * Show multiple toasts with a delay between them
   * @param toasts
   * @param delay
   */
  sequence: async (
    toasts: Array<{ title: string; options?: ToastOptions }>,
    delay: number = 500
  ) => {
    const { toast } = useToast();
    
    for (const { title, options } of toasts) {
      toast({ title, ...options });
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  },

  /**
   * Show a group of related toasts
   * @param toasts
   * @param groupOptions
   * @param groupOptions.title
   * @param groupOptions.clearExisting
   * @param groupOptions.staggerDelay
   */
  group: (
    toasts: Array<{ title: string; options?: ToastOptions }>,
    groupOptions?: { 
      title?: string; 
      clearExisting?: boolean;
      staggerDelay?: number;
    }
  ) => {
    const { toast, closeAll } = useToast();
    
    if (groupOptions?.clearExisting) {
      closeAll();
    }
    
    if (groupOptions?.title) {
      toast({ title: groupOptions.title, status: 'info' });
    }
    
    toasts.forEach(({ title, options }, index) => {
      const delay = (groupOptions?.staggerDelay || 0) * index;
      
      if (delay > 0) {
        setTimeout(() => {
          toast({ title, ...options });
        }, delay);
      } else {
        toast({ title, ...options });
      }
    });
  },
};

/**
 * Toast context for global configuration
 */
interface ToastContextValue {
  defaultOptions: Partial<ToastOptions>;
  setDefaultOptions: (options: Partial<ToastOptions>) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

/**
 * Toast provider component
 * @param root0
 * @param root0.children
 * @param root0.defaultOptions
 */
export const ToastProvider: React.FC<{
  children: React.ReactNode;
  defaultOptions?: Partial<ToastOptions>;
}> = ({ children, defaultOptions: initialDefaultOptions = {} }) => {
  const [defaultOptions, setDefaultOptions] = React.useState(initialDefaultOptions);

  const contextValue = useMemo(() => ({
    defaultOptions,
    setDefaultOptions,
  }), [defaultOptions]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  );
};

/**
 * Hook to use toast context
 */
export const useToastContext = () => {
  const context = React.useContext(ToastContext);
  return context;
};

// Default export
export default useToast;