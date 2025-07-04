import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import {
  Box,
  Input,
  VStack,
  Text,
  Flex,
  Kbd,
  BoxProps,
  InputProps,
} from '@chakra-ui/react';
import { Search, Command as CommandIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { throttle, debounce } from 'lodash-es';
import { useLocalStorage } from 'react-use';

/**
 * Command item data
 */
export interface CommandItemData {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Search keywords */
  keywords?: string[];
  /** Icon element */
  icon?: React.ReactElement;
  /** Keyboard shortcut */
  shortcut?: string[];
  /** Whether item is disabled */
  disabled?: boolean;
  /** Custom data */
  data?: any;
}

/**
 * Performance optimization options for command
 */
export interface CommandPerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Debounce search input (ms) */
  debounceSearch?: number;
  /** Throttle keyboard navigation (ms) */
  throttleNavigation?: number;
  /** Enable animations */
  enableAnimations?: boolean;
  /** Virtual scrolling for large lists */
  virtualScrolling?: boolean;
}

/**
 * Command props
 */
export interface CommandProps extends Omit<BoxProps, 'onSelect'> {
  /** Command items */
  items?: CommandItemData[];
  /** Placeholder text */
  placeholder?: string;
  /** Empty state message */
  emptyMessage?: string;
  /** Custom filter function */
  filter?: (items: CommandItemData[], search: string) => CommandItemData[];
  /** Custom select handler */
  onSelect?: (item: CommandItemData) => void;
  /** Custom search change handler */
  onSearchChange?: (search: string) => void;
  /** Performance optimization settings */
  performance?: CommandPerformanceOptions;
  /** Storage key for recent items */
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
 * Command input props
 */
export interface CommandInputProps extends Omit<InputProps, 'onChange'> {
  /** Custom onChange handler */
  onChange?: (value: string) => void;
  /** Custom test ID */
  testId?: string;
}

/**
 * Command list props
 */
export interface CommandListProps extends BoxProps {
  /** Custom test ID */
  testId?: string;
}

/**
 * Command item props
 */
export interface CommandItemProps extends Omit<BoxProps, 'onSelect'> {
  /** Item data */
  item?: CommandItemData;
  /** Whether item is selected */
  selected?: boolean;
  /** Custom select handler */
  onSelect?: (item: CommandItemData) => void;
  /** Custom test ID */
  testId?: string;
}

/**
 * Default filter function
 */
const defaultFilter = (items: CommandItemData[], search: string): CommandItemData[] => {
  if (!search.trim()) return items;
  
  const searchLower = search.toLowerCase();
  return items.filter(item => {
    const labelMatch = item.label.toLowerCase().includes(searchLower);
    const keywordMatch = item.keywords?.some(keyword => 
      keyword.toLowerCase().includes(searchLower)
    );
    return labelMatch || keywordMatch;
  });
};

/**
 * Optimized search handler factory
 */
const useOptimizedSearchHandler = (
  originalOnSearch?: (search: string) => void,
  debounceMs?: number,
  analytics?: CommandProps['analytics']
) => {
  return useMemo(() => {
    if (!originalOnSearch) return undefined;

    let optimizedHandler = (search: string) => {
      // Track analytics
      if (analytics && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', analytics.action || 'command_search', {
          event_category: analytics.category || 'command',
          event_label: analytics.label,
        });
      }
      
      originalOnSearch(search);
    };

    // Apply debouncing
    if (debounceMs) {
      optimizedHandler = debounce(optimizedHandler, debounceMs);
    }

    return optimizedHandler;
  }, [originalOnSearch, debounceMs, analytics]);
};

/**
 * Keyboard navigation hook
 */
const useKeyboardNavigation = (
  items: CommandItemData[],
  onSelect?: (item: CommandItemData) => void,
  throttleMs?: number
) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        event.preventDefault();
        if (items[selectedIndex] && !items[selectedIndex].disabled) {
          onSelect?.(items[selectedIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        setSelectedIndex(0);
        break;
    }
  }, [items, selectedIndex, onSelect]);

  const optimizedKeyDown = useMemo(() => {
    return throttleMs ? throttle(handleKeyDown, throttleMs) : handleKeyDown;
  }, [handleKeyDown, throttleMs]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  return { selectedIndex, handleKeyDown: optimizedKeyDown };
};

/**
 * Command context
 */
interface CommandContextValue {
  search: string;
  setSearch: (search: string) => void;
  filteredItems: CommandItemData[];
  selectedIndex: number;
  onSelect?: (item: CommandItemData) => void;
  performance: CommandPerformanceOptions;
}

const CommandContext = React.createContext<CommandContextValue | null>(null);

/**
 * Hook to use command context
 */
const useCommand = () => {
  const context = React.useContext(CommandContext);
  if (!context) {
    throw new Error('useCommand must be used within a Command component');
  }
  return context;
};

/**
 * Animation variants for command items
 */
const itemVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

/**
 * Optimized Command Component
 */
const CommandComponent = React.forwardRef<HTMLDivElement, CommandProps>(
  (
    {
      items = [],
      placeholder = 'Type a command or search...',
      emptyMessage = 'No results found.',
      filter = defaultFilter,
      onSelect,
      onSearchChange,
      performance = { memoize: true, debounceSearch: 200, enableAnimations: true },
      storageKey,
      testId,
      analytics,
      children,
      ...rest
    },
    ref
  ) => {
    // Recent items persistence
    const [recentItems, setRecentItems] = useLocalStorage<CommandItemData[]>(
      storageKey || 'command-recent',
      []
    );

    // Search state
    const [search, setSearch] = useState('');

    // Optimized search handler
    const optimizedSearchHandler = useOptimizedSearchHandler(
      onSearchChange,
      performance.debounceSearch,
      analytics
    );

    // Handle search change
    const handleSearchChange = useCallback((value: string) => {
      setSearch(value);
      optimizedSearchHandler?.(value);
    }, [optimizedSearchHandler]);

    // Filter items
    const filteredItems = useMemo(() => {
      const filtered = filter(items, search);
      
      // Add recent items if no search
      if (!search.trim() && recentItems && recentItems.length > 0) {
        const recentFiltered = recentItems.filter(recent => 
          items.some(item => item.id === recent.id)
        );
        return [...recentFiltered, ...filtered.filter(item => 
          !recentFiltered.some(recent => recent.id === item.id)
        )];
      }
      
      return filtered;
    }, [items, search, filter, recentItems]);

    // Keyboard navigation
    const { selectedIndex, handleKeyDown } = useKeyboardNavigation(
      filteredItems,
      onSelect,
      performance.throttleNavigation
    );

    // Handle item selection
    const handleSelect = useCallback((item: CommandItemData) => {
      // Add to recent items
      if (storageKey) {
        const newRecent = [item, ...(recentItems || []).filter(r => r.id !== item.id)].slice(0, 5);
        setRecentItems(newRecent);
      }
      
      onSelect?.(item);
    }, [onSelect, storageKey, recentItems, setRecentItems]);

    // Memoized context value
    const contextValue = useMemo(() => ({
      search,
      setSearch: handleSearchChange,
      filteredItems,
      selectedIndex,
      onSelect: handleSelect,
      performance,
    }), [search, handleSearchChange, filteredItems, selectedIndex, handleSelect, performance]);

    // Memoized command props
    const commandProps = useMemo(() => ({
      'data-testid': testId,
      onKeyDown: handleKeyDown,
      tabIndex: 0,
      outline: 'none',
      ...rest,
    }), [testId, handleKeyDown, rest]);

    return (
      <CommandContext.Provider value={contextValue}>
        <Box ref={ref} {...commandProps}>
          {children}
        </Box>
      </CommandContext.Provider>
    );
  }
);

CommandComponent.displayName = 'OptimizedCommand';

/**
 * Optimized CommandInput Component
 */
const CommandInputComponent = React.forwardRef<HTMLInputElement, CommandInputProps>(
  ({ onChange, testId, ...rest }, ref) => {
    const { search, setSearch } = useCommand();

    const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setSearch(value);
      onChange?.(value);
    }, [setSearch, onChange]);

    const inputProps = useMemo(() => ({
      value: search,
      onChange: handleChange,
      'data-testid': testId,
      ...rest,
    }), [search, handleChange, testId, rest]);

    return (
      <Flex align="center" gap={2} p={3} borderBottom="1px solid" borderColor="gray.200">
        <Search size={16} color="gray.500" />
        <Input
          ref={ref}
          variant="unstyled"
          flex={1}
          {...inputProps}
        />
        <Kbd fontSize="xs">⌘K</Kbd>
      </Flex>
    );
  }
);

CommandInputComponent.displayName = 'OptimizedCommandInput';

/**
 * Optimized CommandList Component
 */
const CommandListComponent = React.forwardRef<HTMLDivElement, CommandListProps>(
  ({ testId, children, ...rest }, ref) => {
    const { filteredItems } = useCommand();

    const listProps = useMemo(() => ({
      'data-testid': testId,
      maxH: '300px',
      overflowY: 'auto' as const,
      ...rest,
    }), [testId, rest]);

    return (
      <Box ref={ref} {...listProps}>
        {filteredItems.length === 0 ? (
          <Text p={4} color="gray.500" textAlign="center" fontSize="sm">
            No results found.
          </Text>
        ) : (
          children
        )}
      </Box>
    );
  }
);

CommandListComponent.displayName = 'OptimizedCommandList';

/**
 * Optimized CommandItem Component
 */
const CommandItemComponent = React.forwardRef<HTMLDivElement, CommandItemProps>(
  ({ item, selected, onSelect, testId, children, ...rest }, ref) => {
    const { selectedIndex, filteredItems, onSelect: contextOnSelect, performance } = useCommand();
    
    const itemIndex = item ? filteredItems.findIndex(i => i.id === item.id) : -1;
    const isSelected = selected ?? (itemIndex === selectedIndex);
    const isDisabled = item?.disabled || false;

    const handleClick = useCallback(() => {
      if (item && !isDisabled) {
        onSelect?.(item);
        contextOnSelect?.(item);
      }
    }, [item, isDisabled, onSelect, contextOnSelect]);

    const itemProps = useMemo(() => ({
      'data-testid': testId,
      'data-selected': isSelected,
      'data-disabled': isDisabled,
      p: 2,
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      bg: isSelected ? 'gray.100' : 'transparent',
      _hover: isDisabled ? {} : { bg: 'gray.50' },
      opacity: isDisabled ? 0.5 : 1,
      onClick: handleClick,
      ...rest,
    }), [testId, isSelected, isDisabled, handleClick, rest]);

    const content = children || (item && (
      <Flex align="center" gap={3}>
        {item.icon}
        <Text flex={1}>{item.label}</Text>
        {item.shortcut && (
          <Flex gap={1}>
            {item.shortcut.map((key, index) => (
              <Kbd key={index} fontSize="xs">{key}</Kbd>
            ))}
          </Flex>
        )}
      </Flex>
    ));

    if (performance.enableAnimations) {
      const MotionBox = motion(Box);
      
      return (
        <MotionBox
          ref={ref}
          variants={itemVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.1 }}
          {...itemProps}
        >
          {content}
        </MotionBox>
      );
    }

    return (
      <Box ref={ref} {...itemProps}>
        {content}
      </Box>
    );
  }
);

CommandItemComponent.displayName = 'OptimizedCommandItem';

// Memoized exports
export const OptimizedCommand = React.memo(CommandComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof CommandProps)[] = [
    'items', 'placeholder', 'emptyMessage', 'children'
  ];
  
  return keysToCompare.every(key => {
    if (key === 'items') {
      return JSON.stringify(prevProps[key]) === JSON.stringify(nextProps[key]);
    }
    return prevProps[key] === nextProps[key];
  });
});

export const OptimizedCommandInput = React.memo(CommandInputComponent);
export const OptimizedCommandList = React.memo(CommandListComponent);
export const OptimizedCommandItem = React.memo(CommandItemComponent);

// Default exports
export default OptimizedCommand;
export { OptimizedCommandInput as CommandInput };
export { OptimizedCommandList as CommandList };
export { OptimizedCommandItem as CommandItem };