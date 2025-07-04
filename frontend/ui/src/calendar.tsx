import React, { useMemo, useCallback, useState } from 'react';
import { Box, Grid, Text, Button, Flex, IconButton } from '@chakra-ui/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { throttle, debounce } from 'lodash-es';
import { useLocalStorage } from 'react-use';

/**
 * Calendar view types
 */
export type CalendarView = 'month' | 'year' | 'decade';

/**
 * Calendar date selection mode
 */
export type CalendarSelectionMode = 'single' | 'multiple' | 'range';

/**
 * Performance optimization options for calendar
 */
export interface CalendarPerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Throttle navigation events (ms) */
  throttleNavigation?: number;
  /** Debounce date selection (ms) */
  debounceSelection?: number;
  /** Enable state persistence */
  persistState?: boolean;
  /** Enable animations */
  enableAnimations?: boolean;
}

/**
 * Calendar props
 */
export interface CalendarProps {
  /** Current selected date(s) */
  value?: Date | Date[] | { start: Date; end: Date };
  /** Default selected date(s) */
  defaultValue?: Date | Date[] | { start: Date; end: Date };
  /** Selection mode */
  selectionMode?: CalendarSelectionMode;
  /** Calendar view */
  view?: CalendarView;
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
  /** Disabled dates */
  disabledDates?: Date[];
  /** Custom date change handler */
  onChange?: (date: Date | Date[] | { start: Date; end: Date }) => void;
  /** Custom view change handler */
  onViewChange?: (view: CalendarView) => void;
  /** Performance optimization settings */
  performance?: CalendarPerformanceOptions;
  /** Storage key for state persistence */
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
 * Date utilities
 */
const dateUtils = {
  isSameDay: (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  },
  
  isSameMonth: (date1: Date, date2: Date) => {
    return date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  },
  
  addMonths: (date: Date, months: number) => {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + months);
    return newDate;
  },
  
  getDaysInMonth: (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  },
  
  getFirstDayOfMonth: (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  },
  
  isDateDisabled: (date: Date, minDate?: Date, maxDate?: Date, disabledDates?: Date[]) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    if (disabledDates?.some(disabled => dateUtils.isSameDay(date, disabled))) return true;
    return false;
  },
};

/**
 * Optimized navigation handler factory
 */
const useOptimizedNavigationHandler = (
  originalHandler?: (direction: 'prev' | 'next') => void,
  throttleMs?: number,
  analytics?: CalendarProps['analytics']
) => {
  return useMemo(() => {
    if (!originalHandler) return undefined;

    let optimizedHandler = (direction: 'prev' | 'next') => {
      // Track analytics
      if (analytics && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', analytics.action || 'calendar_navigate', {
          event_category: analytics.category || 'calendar',
          event_label: `${analytics.label || 'navigation'}_${direction}`,
        });
      }
      
      originalHandler(direction);
    };

    // Apply throttling
    if (throttleMs) {
      optimizedHandler = throttle(optimizedHandler, throttleMs, { 
        leading: true, 
        trailing: false 
      });
    }

    return optimizedHandler;
  }, [originalHandler, throttleMs, analytics]);
};

/**
 * Optimized date selection handler factory
 */
const useOptimizedSelectionHandler = (
  originalHandler?: (date: Date) => void,
  debounceMs?: number,
  analytics?: CalendarProps['analytics']
) => {
  return useMemo(() => {
    if (!originalHandler) return undefined;

    let optimizedHandler = (date: Date) => {
      // Track analytics
      if (analytics && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', analytics.action || 'calendar_select', {
          event_category: analytics.category || 'calendar',
          event_label: analytics.label,
        });
      }
      
      originalHandler(date);
    };

    // Apply debouncing
    if (debounceMs) {
      optimizedHandler = debounce(optimizedHandler, debounceMs);
    }

    return optimizedHandler;
  }, [originalHandler, debounceMs, analytics]);
};

/**
 * Optimized Calendar Component
 */
const CalendarComponent = React.forwardRef<HTMLDivElement, CalendarProps>(
  (
    {
      value: controlledValue,
      defaultValue,
      selectionMode = 'single',
      view = 'month',
      minDate,
      maxDate,
      disabledDates = [],
      onChange,
      onViewChange,
      performance = { memoize: true, throttleNavigation: 200, debounceSelection: 100 },
      storageKey,
      testId,
      analytics,
    },
    ref
  ) => {
    // State persistence
    const [persistedValue, setPersistedValue] = useLocalStorage<any>(
      storageKey || 'calendar-value',
      defaultValue
    );

    // Internal state
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState(view);
    const [selectedValue, setSelectedValue] = useState(
      controlledValue ?? (performance.persistState && storageKey ? persistedValue : defaultValue)
    );

    // Navigation handler
    const handleNavigation = useCallback((direction: 'prev' | 'next') => {
      setCurrentDate(prev => {
        const months = direction === 'next' ? 1 : -1;
        return dateUtils.addMonths(prev, months);
      });
    }, []);

    // Date selection handler
    const handleDateSelect = useCallback((date: Date) => {
      let newValue: Date | Date[] | { start: Date; end: Date };

      switch (selectionMode) {
        case 'single':
          newValue = date;
          break;
        case 'multiple':
          const currentArray = Array.isArray(selectedValue) ? selectedValue : [];
          const existingIndex = currentArray.findIndex(d => dateUtils.isSameDay(d, date));
          if (existingIndex >= 0) {
            newValue = currentArray.filter((_, i) => i !== existingIndex);
          } else {
            newValue = [...currentArray, date];
          }
          break;
        case 'range':
          const currentRange = selectedValue as { start: Date; end: Date } | undefined;
          if (!currentRange?.start || (currentRange.start && currentRange.end)) {
            newValue = { start: date, end: date };
          } else {
            newValue = {
              start: date < currentRange.start ? date : currentRange.start,
              end: date > currentRange.start ? date : currentRange.start,
            };
          }
          break;
        default:
          newValue = date;
      }

      setSelectedValue(newValue);
      
      if (performance.persistState && storageKey) {
        setPersistedValue(newValue);
      }
      
      onChange?.(newValue);
    }, [selectionMode, selectedValue, onChange, performance.persistState, storageKey, setPersistedValue]);

    // Optimized handlers
    const optimizedNavigationHandler = useOptimizedNavigationHandler(
      handleNavigation,
      performance.throttleNavigation,
      analytics
    );

    const optimizedSelectionHandler = useOptimizedSelectionHandler(
      handleDateSelect,
      performance.debounceSelection,
      analytics
    );

    // Generate calendar days
    const calendarDays = useMemo(() => {
      const daysInMonth = dateUtils.getDaysInMonth(currentDate);
      const firstDay = dateUtils.getFirstDayOfMonth(currentDate);
      const days: (Date | null)[] = [];

      // Add empty cells for days before the first day of the month
      for (let i = 0; i < firstDay; i++) {
        days.push(null);
      }

      // Add days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
      }

      return days;
    }, [currentDate]);

    // Check if date is selected
    const isDateSelected = useCallback((date: Date) => {
      if (!selectedValue) return false;

      switch (selectionMode) {
        case 'single':
          return selectedValue instanceof Date && dateUtils.isSameDay(date, selectedValue);
        case 'multiple':
          return Array.isArray(selectedValue) && selectedValue.some(d => dateUtils.isSameDay(date, d));
        case 'range':
          const range = selectedValue as { start: Date; end: Date };
          return range.start && range.end && date >= range.start && date <= range.end;
        default:
          return false;
      }
    }, [selectedValue, selectionMode]);

    // Memoized calendar header
    const calendarHeader = useMemo(() => (
      <Flex justify="space-between" align="center" mb={4}>
        <IconButton
          aria-label="Previous month"
          icon={<ChevronLeft size={16} />}
          size="sm"
          variant="ghost"
          onClick={() => optimizedNavigationHandler?.('prev')}
        />
        <Text fontSize="lg" fontWeight="semibold">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>
        <IconButton
          aria-label="Next month"
          icon={<ChevronRight size={16} />}
          size="sm"
          variant="ghost"
          onClick={() => optimizedNavigationHandler?.('next')}
        />
      </Flex>
    ), [currentDate, optimizedNavigationHandler]);

    // Memoized weekday headers
    const weekdayHeaders = useMemo(() => {
      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return (
        <Grid templateColumns="repeat(7, 1fr)" gap={1} mb={2}>
          {weekdays.map(day => (
            <Text key={day} textAlign="center" fontSize="sm" fontWeight="medium" color="gray.600">
              {day}
            </Text>
          ))}
        </Grid>
      );
    }, []);

    // Memoized calendar grid
    const calendarGrid = useMemo(() => (
      <Grid templateColumns="repeat(7, 1fr)" gap={1}>
        {calendarDays.map((date, index) => (
          <Box key={index} aspectRatio={1}>
            {date ? (
              <Button
                size="sm"
                variant={isDateSelected(date) ? 'solid' : 'ghost'}
                colorScheme={isDateSelected(date) ? 'blue' : 'gray'}
                isDisabled={dateUtils.isDateDisabled(date, minDate, maxDate, disabledDates)}
                onClick={() => optimizedSelectionHandler?.(date)}
                w="full"
                h="full"
                fontSize="sm"
                data-testid={`${testId}-day-${date.getDate()}`}
              >
                {date.getDate()}
              </Button>
            ) : (
              <Box />
            )}
          </Box>
        ))}
      </Grid>
    ), [calendarDays, isDateSelected, minDate, maxDate, disabledDates, optimizedSelectionHandler, testId]);

    return (
      <Box ref={ref} data-testid={testId} p={4} bg="white" borderRadius="md" boxShadow="sm">
        {calendarHeader}
        {weekdayHeaders}
        {calendarGrid}
      </Box>
    );
  }
);

CalendarComponent.displayName = 'OptimizedCalendar';

/**
 * Memoized OptimizedCalendar export
 */
export const OptimizedCalendar = React.memo(CalendarComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof CalendarProps)[] = [
    'value', 'selectionMode', 'view', 'minDate', 'maxDate', 'disabledDates'
  ];
  
  return keysToCompare.every(key => prevProps[key] === nextProps[key]);
});

// Default export
export default OptimizedCalendar;