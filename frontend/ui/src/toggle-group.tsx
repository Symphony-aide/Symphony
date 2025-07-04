import React, { useMemo, useCallback, useState } from 'react';
import {
  ButtonGroup,
  Button,
  ButtonGroupProps,
  ButtonProps,
} from '@chakra-ui/react';
import { throttle } from 'lodash-es';
import { useLocalStorage } from 'react-use';

/**
 * Toggle group types
 */
export type ToggleGroupType = 'single' | 'multiple';

/**
 * Toggle group sizes
 */
export type ToggleGroupSize = 'xs' | 'sm' | 'md' | 'lg';

/**
 * Toggle group variants
 */
export type ToggleGroupVariant = 'outline' | 'solid' | 'ghost';

/**
 * Toggle item data
 */
export interface ToggleItemData {
  /** Item value */
  value: string;
  /** Item label */
  label: React.ReactNode;
  /** Item icon */
  icon?: React.ReactElement;
  /** Whether item is disabled */
  disabled?: boolean;
  /** Custom aria label */
  ariaLabel?: string;
}

/**
 * Performance optimization options for toggle group
 */
export interface ToggleGroupPerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Throttle change events (ms) */
  throttleChange?: number;
  /** Enable value persistence */
  persistValue?: boolean;
  /** Enable animations */
  enableAnimations?: boolean;
}

/**
 * Toggle group props
 */
export interface ToggleGroupProps extends Omit<ButtonGroupProps, 'size' | 'variant' | 'onChange'> {
  /** Toggle group type */
  type?: ToggleGroupType;
  /** Toggle group size */
  size?: ToggleGroupSize;
  /** Toggle group variant */
  variant?: ToggleGroupVariant;
  /** Toggle items */
  items?: ToggleItemData[];
  /** Selected values */
  value?: string | string[];
  /** Default selected values */
  defaultValue?: string | string[];
  /** Custom change handler */
  onChange?: (value: string | string[]) => void;
  /** Performance optimization settings */
  performance?: ToggleGroupPerformanceOptions;
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
 * Toggle item props
 */
export interface ToggleItemProps extends Omit<ButtonProps, 'onClick'> {
  /** Item value */
  value: string;
  /** Whether item is selected */
  selected?: boolean;
  /** Custom click handler */
  onClick?: (value: string) => void;
  /** Performance optimization settings */
  performance?: ToggleGroupPerformanceOptions;
  /** Custom test ID */
  testId?: string;
}

/**
 * Optimized change handler factory
 */
const useOptimizedChangeHandler = (
  originalOnChange?: (value: string | string[]) => void,
  throttleMs?: number,
  analytics?: ToggleGroupProps['analytics']
) => {
  return useMemo(() => {
    if (!originalOnChange) return undefined;

    let optimizedHandler = (value: string | string[]) => {
      // Track analytics
      if (analytics && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', analytics.action || 'toggle_group_change', {
          event_category: analytics.category || 'toggle_group',
          event_label: analytics.label,
          value: Array.isArray(value) ? value.length : 1,
        });
      }
      
      originalOnChange(value);
    };

    // Apply throttling
    if (throttleMs) {
      optimizedHandler = throttle(optimizedHandler, throttleMs, { 
        leading: true, 
        trailing: false 
      });
    }

    return optimizedHandler;
  }, [originalOnChange, throttleMs, analytics]);
};

/**
 * Optimized ToggleItem Component
 */
const ToggleItemComponent = React.forwardRef<HTMLButtonElement, ToggleItemProps>(
  (
    {
      value,
      selected = false,
      onClick,
      performance = { enableAnimations: true },
      testId,
      children,
      ...rest
    },
    ref
  ) => {
    const handleClick = useCallback(() => {
      onClick?.(value);
    }, [onClick, value]);

    const itemProps = useMemo(() => ({
      variant: selected ? 'solid' : 'outline',
      colorScheme: selected ? 'blue' : 'gray',
      onClick: handleClick,
      'data-testid': testId,
      'data-selected': selected,
      'data-value': value,
      transition: performance.enableAnimations ? 'all 0.2s ease-in-out' : 'none',
      _hover: {
        transform: performance.enableAnimations ? 'translateY(-1px)' : 'none',
      },
      ...rest,
    }), [selected, handleClick, testId, value, performance.enableAnimations, rest]);

    return (
      <Button ref={ref} {...itemProps}>
        {children}
      </Button>
    );
  }
);

ToggleItemComponent.displayName = 'OptimizedToggleItem';

/**
 * Optimized ToggleGroup Component
 */
const ToggleGroupComponent = React.forwardRef<HTMLDivElement, ToggleGroupProps>(
  (
    {
      type = 'single',
      size = 'md',
      variant = 'outline',
      items = [],
      value: controlledValue,
      defaultValue,
      onChange,
      performance = { memoize: true, throttleChange: 100, enableAnimations: true },
      storageKey,
      testId,
      analytics,
      children,
      ...rest
    },
    ref
  ) => {
    // Value persistence
    const [persistedValue, setPersistedValue] = useLocalStorage<string | string[]>(
      storageKey || 'toggle-group-value',
      defaultValue || (type === 'multiple' ? [] : '')
    );

    // Internal state
    const [internalValue, setInternalValue] = useState<string | string[]>(
      controlledValue ?? (performance.persistValue && storageKey ? persistedValue : defaultValue || (type === 'multiple' ? [] : ''))
    );

    // Determine current value
    const currentValue = controlledValue ?? internalValue;

    // Optimized change handler
    const optimizedChangeHandler = useOptimizedChangeHandler(
      onChange,
      performance.throttleChange,
      analytics
    );

    // Handle item toggle
    const handleItemToggle = useCallback((itemValue: string) => {
      let newValue: string | string[];

      if (type === 'single') {
        newValue = currentValue === itemValue ? '' : itemValue;
      } else {
        const currentArray = Array.isArray(currentValue) ? currentValue : [];
        if (currentArray.includes(itemValue)) {
          newValue = currentArray.filter(v => v !== itemValue);
        } else {
          newValue = [...currentArray, itemValue];
        }
      }

      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }

      if (performance.persistValue && storageKey) {
        setPersistedValue(newValue);
      }

      optimizedChangeHandler?.(newValue);
    }, [
      type,
      currentValue,
      controlledValue,
      optimizedChangeHandler,
      performance.persistValue,
      storageKey,
      setPersistedValue
    ]);

    // Check if item is selected
    const isItemSelected = useCallback((itemValue: string) => {
      if (type === 'single') {
        return currentValue === itemValue;
      } else {
        return Array.isArray(currentValue) && currentValue.includes(itemValue);
      }
    }, [type, currentValue]);

    // Memoized toggle group props
    const toggleGroupProps = useMemo(() => ({
      size,
      variant,
      isAttached: true,
      'data-testid': testId,
      'data-type': type,
      ...rest,
    }), [size, variant, testId, type, rest]);

    // Memoized toggle items
    const toggleItems = useMemo(() => {
      if (children) return children;

      return items.map((item) => (
        <ToggleItemComponent
          key={item.value}
          value={item.value}
          selected={isItemSelected(item.value)}
          onClick={handleItemToggle}
          isDisabled={item.disabled}
          performance={performance}
          testId={`${testId}-item-${item.value}`}
          aria-label={item.ariaLabel || item.label?.toString()}
        >
          {item.icon && <span style={{ marginRight: '8px' }}>{item.icon}</span>}
          {item.label}
        </ToggleItemComponent>
      ));
    }, [children, items, isItemSelected, handleItemToggle, performance, testId]);

    return (
      <ButtonGroup ref={ref} {...toggleGroupProps}>
        {toggleItems}
      </ButtonGroup>
    );
  }
);

ToggleGroupComponent.displayName = 'OptimizedToggleGroup';

/**
 * Memoized exports
 */
export const OptimizedToggleGroup = React.memo(ToggleGroupComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof ToggleGroupProps)[] = [
    'type', 'size', 'variant', 'items', 'value', 'children'
  ];
  
  return keysToCompare.every(key => {
    if (key === 'items') {
      return JSON.stringify(prevProps[key]) === JSON.stringify(nextProps[key]);
    }
    return prevProps[key] === nextProps[key];
  });
});

export const OptimizedToggleItem = React.memo(ToggleItemComponent);

// Default exports
export default OptimizedToggleGroup;
export { OptimizedToggleItem as ToggleItem };