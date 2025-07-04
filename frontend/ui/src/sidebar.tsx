import React, { useMemo, useCallback, useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  IconButton,
  Text,
  Flex,
  Collapse,
  useDisclosure,
  BoxProps,
} from '@chakra-ui/react';
import { ChevronLeft, ChevronRight, ChevronDown, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { throttle } from 'lodash-es';
import { useLocalStorage } from 'react-use';

/**
 * Sidebar placement options
 */
export type SidebarPlacement = 'left' | 'right';

/**
 * Sidebar variant types
 */
export type SidebarVariant = 'default' | 'floating' | 'overlay';

/**
 * Sidebar item data
 */
export interface SidebarItemData {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Item URL */
  href?: string;
  /** Icon element */
  icon?: React.ReactElement;
  /** Whether item is disabled */
  disabled?: boolean;
  /** Whether item is active */
  active?: boolean;
  /** Sub-items */
  items?: SidebarItemData[];
  /** Click handler */
  onClick?: () => void;
}

/**
 * Performance optimization options for sidebar
 */
export interface SidebarPerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Throttle navigation events (ms) */
  throttleNavigation?: number;
  /** Enable animations */
  enableAnimations?: boolean;
  /** Persist collapsed state */
  persistCollapsed?: boolean;
  /** Persist expanded items */
  persistExpanded?: boolean;
}

/**
 * Sidebar props
 */
export interface SidebarProps extends Omit<BoxProps, 'onNavigate'> {
  /** Sidebar items */
  items?: SidebarItemData[];
  /** Sidebar placement */
  placement?: SidebarPlacement;
  /** Sidebar variant */
  variant?: SidebarVariant;
  /** Whether sidebar is collapsed */
  collapsed?: boolean;
  /** Default collapsed state */
  defaultCollapsed?: boolean;
  /** Whether sidebar is collapsible */
  collapsible?: boolean;
  /** Sidebar width when expanded */
  width?: string | number;
  /** Sidebar width when collapsed */
  collapsedWidth?: string | number;
  /** Custom navigation handler */
  onNavigate?: (item: SidebarItemData) => void;
  /** Custom collapse handler */
  onCollapseChange?: (collapsed: boolean) => void;
  /** Performance optimization settings */
  performance?: SidebarPerformanceOptions;
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
 * Optimized navigation handler factory
 */
const useOptimizedNavigationHandler = (
  originalOnNavigate?: (item: SidebarItemData) => void,
  throttleMs?: number,
  analytics?: SidebarProps['analytics']
) => {
  return useMemo(() => {
    if (!originalOnNavigate) return undefined;

    let optimizedHandler = (item: SidebarItemData) => {
      // Track analytics
      if (analytics && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', analytics.action || 'sidebar_navigate', {
          event_category: analytics.category || 'sidebar',
          event_label: `${analytics.label || 'navigate'}_${item.id}`,
        });
      }
      
      originalOnNavigate(item);
    };

    // Apply throttling
    if (throttleMs) {
      optimizedHandler = throttle(optimizedHandler, throttleMs, { 
        leading: true, 
        trailing: false 
      });
    }

    return optimizedHandler;
  }, [originalOnNavigate, throttleMs, analytics]);
};

/**
 * Animation variants for sidebar
 */
const sidebarVariants = {
  expanded: { width: 'auto', opacity: 1 },
  collapsed: { width: 'auto', opacity: 1 },
};

const itemVariants = {
  initial: {
    opacity: 0,
    x: -20,
  },
  animate: {
    opacity: 1,
    x: 0,
  },
  exit: {
    opacity: 0,
    x: -20,
  },
};

/**
 * Sidebar item component
 */
const SidebarItemComponent = React.memo<{
  item: SidebarItemData;
  level: number;
  collapsed: boolean;
  onNavigate?: (item: SidebarItemData) => void;
  performance: SidebarPerformanceOptions;
  expandedItems: Set<string>;
  onToggleExpanded: (itemId: string) => void;
  testId?: string;
}>(({ 
  item, 
  level, 
  collapsed, 
  onNavigate, 
  performance, 
  expandedItems, 
  onToggleExpanded, 
  testId 
}) => {
  const hasSubItems = item.items && item.items.length > 0;
  const isExpanded = expandedItems.has(item.id);

  const handleClick = useCallback(() => {
    if (hasSubItems) {
      onToggleExpanded(item.id);
    } else {
      item.onClick?.();
      onNavigate?.(item);
    }
  }, [hasSubItems, item, onNavigate, onToggleExpanded]);

  const itemContent = useMemo(() => {
    const content = (
      <Button
        variant="ghost"
        justifyContent="flex-start"
        width="full"
        pl={level * 4 + 4}
        pr={4}
        py={3}
        h="auto"
        fontWeight={item.active ? 'semibold' : 'normal'}
        bg={item.active ? 'blue.50' : 'transparent'}
        color={item.active ? 'blue.600' : 'gray.700'}
        isDisabled={item.disabled}
        onClick={handleClick}
        data-testid={`${testId}-item-${item.id}`}
        _hover={{
          bg: item.active ? 'blue.100' : 'gray.50',
        }}
        rightIcon={
          hasSubItems && !collapsed ? (
            isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
          ) : undefined
        }
      >
        <HStack spacing={3} flex={1}>
          {item.icon}
          {!collapsed && <Text fontSize="sm">{item.label}</Text>}
        </HStack>
      </Button>
    );

    if (performance.enableAnimations) {
      const MotionBox = motion(Box);
      
      return (
        <MotionBox
          variants={itemVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          {content}
        </MotionBox>
      );
    }

    return content;
  }, [
    level,
    item,
    hasSubItems,
    collapsed,
    isExpanded,
    handleClick,
    testId,
    performance.enableAnimations
  ]);

  const submenuContent = useMemo(() => {
    if (!hasSubItems || !item.items || collapsed) return null;

    return (
      <Collapse in={isExpanded} animateOpacity>
        <VStack spacing={0} align="stretch">
          {item.items.map((subItem) => (
            <SidebarItemComponent
              key={subItem.id}
              item={subItem}
              level={level + 1}
              collapsed={collapsed}
              onNavigate={onNavigate}
              performance={performance}
              expandedItems={expandedItems}
              onToggleExpanded={onToggleExpanded}
              testId={testId}
            />
          ))}
        </VStack>
      </Collapse>
    );
  }, [
    hasSubItems,
    item.items,
    collapsed,
    isExpanded,
    level,
    onNavigate,
    performance,
    expandedItems,
    onToggleExpanded,
    testId
  ]);

  return (
    <Box>
      {itemContent}
      {submenuContent}
    </Box>
  );
});

SidebarItemComponent.displayName = 'SidebarItem';

/**
 * Optimized Sidebar Component
 */
const SidebarComponent = React.forwardRef<HTMLDivElement, SidebarProps>(
  (
    {
      items = [],
      placement = 'left',
      variant = 'default',
      collapsed: controlledCollapsed,
      defaultCollapsed = false,
      collapsible = true,
      width = '280px',
      collapsedWidth = '80px',
      onNavigate,
      onCollapseChange,
      performance = { 
        memoize: true, 
        throttleNavigation: 100, 
        enableAnimations: true,
        persistCollapsed: true,
        persistExpanded: true
      },
      storageKey,
      testId,
      analytics,
      children,
      ...rest
    },
    ref
  ) => {
    // Collapsed state persistence
    const [persistedCollapsed, setPersistedCollapsed] = useLocalStorage<boolean>(
      `${storageKey || 'sidebar'}-collapsed`,
      defaultCollapsed
    );

    // Expanded items persistence
    const [persistedExpanded, setPersistedExpanded] = useLocalStorage<string[]>(
      `${storageKey || 'sidebar'}-expanded`,
      []
    );

    // Internal state
    const [internalCollapsed, setInternalCollapsed] = useState(
      controlledCollapsed ?? (performance.persistCollapsed && storageKey ? persistedCollapsed : defaultCollapsed)
    );

    const [expandedItems, setExpandedItems] = useState<Set<string>>(
      new Set(performance.persistExpanded && storageKey ? persistedExpanded : [])
    );

    // Determine current collapsed state
    const isCollapsed = controlledCollapsed ?? internalCollapsed;

    // Optimized navigation handler
    const optimizedNavigationHandler = useOptimizedNavigationHandler(
      onNavigate,
      performance.throttleNavigation,
      analytics
    );

    // Handle collapse toggle
    const handleCollapseToggle = useCallback(() => {
      const newCollapsed = !isCollapsed;
      
      if (controlledCollapsed === undefined) {
        setInternalCollapsed(newCollapsed);
      }
      
      if (performance.persistCollapsed && storageKey) {
        setPersistedCollapsed(newCollapsed);
      }
      
      onCollapseChange?.(newCollapsed);
    }, [
      isCollapsed,
      controlledCollapsed,
      onCollapseChange,
      performance.persistCollapsed,
      storageKey,
      setPersistedCollapsed
    ]);

    // Handle toggle expanded
    const handleToggleExpanded = useCallback((itemId: string) => {
      setExpandedItems(prev => {
        const newExpanded = new Set(prev);
        
        if (newExpanded.has(itemId)) {
          newExpanded.delete(itemId);
        } else {
          newExpanded.add(itemId);
        }
        
        if (performance.persistExpanded && storageKey) {
          setPersistedExpanded(Array.from(newExpanded));
        }
        
        return newExpanded;
      });
    }, [performance.persistExpanded, storageKey, setPersistedExpanded]);

    // Handle navigation
    const handleNavigate = useCallback((item: SidebarItemData) => {
      optimizedNavigationHandler?.(item);
    }, [optimizedNavigationHandler]);

    // Memoized sidebar styles
    const sidebarStyles = useMemo(() => {
      const baseStyles = {
        width: isCollapsed ? collapsedWidth : width,
        minWidth: isCollapsed ? collapsedWidth : width,
        height: '100vh',
        bg: 'white',
        borderRight: variant !== 'floating' ? '1px solid' : 'none',
        borderColor: 'gray.200',
        boxShadow: variant === 'floating' ? 'lg' : 'none',
        position: variant === 'overlay' ? 'fixed' : 'relative',
        zIndex: variant === 'overlay' ? 1000 : 'auto',
        [placement]: variant === 'overlay' ? 0 : 'auto',
        transition: performance.enableAnimations ? 'all 0.3s ease-in-out' : 'none',
      };

      return baseStyles;
    }, [
      isCollapsed,
      collapsedWidth,
      width,
      variant,
      placement,
      performance.enableAnimations
    ]);

    // Memoized sidebar content
    const sidebarContent = useMemo(() => {
      const content = children || (
        <VStack spacing={1} align="stretch" p={2}>
          {items.map((item) => (
            <SidebarItemComponent
              key={item.id}
              item={item}
              level={0}
              collapsed={isCollapsed}
              onNavigate={handleNavigate}
              performance={performance}
              expandedItems={expandedItems}
              onToggleExpanded={handleToggleExpanded}
              testId={testId}
            />
          ))}
        </VStack>
      );

      if (performance.enableAnimations) {
        const MotionBox = motion(Box);
        
        return (
          <MotionBox
            variants={sidebarVariants}
            animate={isCollapsed ? 'collapsed' : 'expanded'}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {content}
          </MotionBox>
        );
      }

      return content;
    }, [
      children,
      items,
      isCollapsed,
      handleNavigate,
      performance,
      expandedItems,
      handleToggleExpanded,
      testId
    ]);

    return (
      <Box
        ref={ref}
        data-testid={testId}
        data-collapsed={isCollapsed}
        data-placement={placement}
        data-variant={variant}
        {...sidebarStyles}
        {...rest}
      >
        {/* Header with collapse toggle */}
        {collapsible && (
          <Flex
            justify={isCollapsed ? 'center' : 'space-between'}
            align="center"
            p={4}
            borderBottom="1px solid"
            borderColor="gray.200"
          >
            {!isCollapsed && (
              <Text fontSize="lg" fontWeight="semibold">
                Menu
              </Text>
            )}
            <IconButton
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              icon={
                isCollapsed ? (
                  placement === 'left' ? <ChevronRight size={16} /> : <ChevronLeft size={16} />
                ) : (
                  placement === 'left' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />
                )
              }
              size="sm"
              variant="ghost"
              onClick={handleCollapseToggle}
              data-testid={`${testId}-collapse-toggle`}
            />
          </Flex>
        )}

        {/* Sidebar content */}
        <Box flex={1} overflowY="auto">
          {sidebarContent}
        </Box>
      </Box>
    );
  }
);

SidebarComponent.displayName = 'OptimizedSidebar';

/**
 * Memoized OptimizedSidebar export
 */
export const OptimizedSidebar = React.memo(SidebarComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof SidebarProps)[] = [
    'items', 'placement', 'variant', 'collapsed', 'width', 'collapsedWidth', 'children'
  ];
  
  return keysToCompare.every(key => {
    if (key === 'items') {
      return JSON.stringify(prevProps[key]) === JSON.stringify(nextProps[key]);
    }
    return prevProps[key] === nextProps[key];
  });
});

// Default export
export default OptimizedSidebar;