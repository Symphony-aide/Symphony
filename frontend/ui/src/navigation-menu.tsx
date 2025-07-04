import {
  Box,
  HStack,
  VStack,
  Button,
  Text,
  Flex,
  Collapse,
  useDisclosure,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { throttle } from 'lodash-es';
import { ChevronDown, ChevronRight } from 'lucide-react';
import React, { useMemo, useCallback, useState } from 'react';
import { useLocalStorage } from 'react-use';

/**
 * Navigation menu item data
 */
export interface NavigationMenuItemData {
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
  items?: NavigationMenuItemData[];
  /** Click handler */
  onClick?: () => void;
}

/**
 * Navigation menu orientation
 */
export type NavigationMenuOrientation = 'horizontal' | 'vertical';

/**
 * Performance optimization options for navigation menu
 */
export interface NavigationMenuPerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Throttle navigation events (ms) */
  throttleNavigation?: number;
  /** Enable animations */
  enableAnimations?: boolean;
  /** Persist expanded state */
  persistExpanded?: boolean;
  /** Auto-collapse siblings */
  autoCollapse?: boolean;
}

/**
 * Navigation menu props
 */
export interface NavigationMenuProps {
  /** Menu items */
  items?: NavigationMenuItemData[];
  /** Menu orientation */
  orientation?: NavigationMenuOrientation;
  /** Custom navigation handler */
  onNavigate?: (item: NavigationMenuItemData) => void;
  /** Performance optimization settings */
  performance?: NavigationMenuPerformanceOptions;
  /** Storage key for expanded state */
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
 * @param originalOnNavigate
 * @param throttleMs
 * @param analytics
 */
const useOptimizedNavigationHandler = (
  originalOnNavigate?: (item: NavigationMenuItemData) => void,
  throttleMs?: number,
  analytics?: NavigationMenuProps['analytics']
) => {
  return useMemo(() => {
    if (!originalOnNavigate) return undefined;

    let optimizedHandler = (item: NavigationMenuItemData) => {
      // Track analytics
      if (analytics && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', analytics.action || 'navigation_menu_navigate', {
          event_category: analytics.category || 'navigation_menu',
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
 * Animation variants for navigation menu
 */
const menuItemVariants = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -10 },
};

const submenuVariants = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 },
};

/**
 * Navigation menu item component
 */
const NavigationMenuItemComponent = React.memo<{
  item: NavigationMenuItemData;
  level: number;
  orientation: NavigationMenuOrientation;
  onNavigate?: (item: NavigationMenuItemData) => void;
  performance: NavigationMenuPerformanceOptions;
  expandedItems: Set<string>;
  onToggleExpanded: (itemId: string) => void;
  testId?: string;
}>(({ 
  item, 
  level, 
  orientation, 
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
        pl={level * 4 + 2}
        pr={2}
        py={2}
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
          hasSubItems ? (
            orientation === 'horizontal' ? (
              <ChevronDown size={16} />
            ) : (
              isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
            )
          ) : undefined
        }
      >
        <Flex align="center" gap={2} flex={1}>
          {item.icon}
          <Text fontSize="sm">{item.label}</Text>
        </Flex>
      </Button>
    );

    if (performance.enableAnimations) {
      const MotionBox = motion(Box);
      
      return (
        <MotionBox
          variants={menuItemVariants}
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
    orientation,
    isExpanded,
    handleClick,
    testId,
    performance.enableAnimations
  ]);

  const submenuContent = useMemo(() => {
    if (!hasSubItems || !item.items) return null;

    const submenu = (
      <VStack spacing={0} align="stretch">
        {item.items.map((subItem) => (
          <NavigationMenuItemComponent
            key={subItem.id}
            item={subItem}
            level={level + 1}
            orientation={orientation}
            onNavigate={onNavigate}
            performance={performance}
            expandedItems={expandedItems}
            onToggleExpanded={onToggleExpanded}
            testId={testId}
          />
        ))}
      </VStack>
    );

    if (orientation === 'vertical') {
      return (
        <Collapse in={isExpanded} animateOpacity>
          {submenu}
        </Collapse>
      );
    }

    if (performance.enableAnimations) {
      const MotionBox = motion(Box);
      
      return (
        <AnimatePresence>
          {isExpanded && (
            <MotionBox
              variants={submenuVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2, ease: "easeInOut" }}
              position="absolute"
              top="100%"
              left={0}
              bg="white"
              boxShadow="lg"
              borderRadius="md"
              border="1px solid"
              borderColor="gray.200"
              minW="200px"
              zIndex={10}
            >
              {submenu}
            </MotionBox>
          )}
        </AnimatePresence>
      );
    }

    return isExpanded ? (
      <Box
        position="absolute"
        top="100%"
        left={0}
        bg="white"
        boxShadow="lg"
        borderRadius="md"
        border="1px solid"
        borderColor="gray.200"
        minW="200px"
        zIndex={10}
      >
        {submenu}
      </Box>
    ) : null;
  }, [
    hasSubItems,
    item.items,
    isExpanded,
    orientation,
    level,
    onNavigate,
    performance,
    expandedItems,
    onToggleExpanded,
    testId
  ]);

  return (
    <Box position="relative">
      {itemContent}
      {submenuContent}
    </Box>
  );
});

NavigationMenuItemComponent.displayName = 'NavigationMenuItem';

/**
 * Optimized NavigationMenu Component
 */
const NavigationMenuComponent = React.forwardRef<HTMLDivElement, NavigationMenuProps>(
  (
    {
      items = [],
      orientation = 'vertical',
      onNavigate,
      performance = { 
        memoize: true, 
        throttleNavigation: 100, 
        enableAnimations: true,
        persistExpanded: true,
        autoCollapse: false
      },
      storageKey,
      testId,
      analytics,
    },
    ref
  ) => {
    // Expanded state persistence
    const [persistedExpanded, setPersistedExpanded] = useLocalStorage<string[]>(
      storageKey || 'navigation-menu-expanded',
      []
    );

    // Expanded items state
    const [expandedItems, setExpandedItems] = useState<Set<string>>(
      new Set(performance.persistExpanded && storageKey ? persistedExpanded : [])
    );

    // Optimized navigation handler
    const optimizedNavigationHandler = useOptimizedNavigationHandler(
      onNavigate,
      performance.throttleNavigation,
      analytics
    );

    // Handle toggle expanded
    const handleToggleExpanded = useCallback((itemId: string) => {
      setExpandedItems(prev => {
        const newExpanded = new Set(prev);
        
        if (newExpanded.has(itemId)) {
          newExpanded.delete(itemId);
        } else {
          if (performance.autoCollapse) {
            newExpanded.clear();
          }
          newExpanded.add(itemId);
        }
        
        if (performance.persistExpanded && storageKey) {
          setPersistedExpanded(Array.from(newExpanded));
        }
        
        return newExpanded;
      });
    }, [performance.autoCollapse, performance.persistExpanded, storageKey, setPersistedExpanded]);

    // Handle navigation
    const handleNavigate = useCallback((item: NavigationMenuItemData) => {
      optimizedNavigationHandler?.(item);
    }, [optimizedNavigationHandler]);

    // Memoized navigation menu content
    const navigationContent = useMemo(() => {
      const Container = orientation === 'horizontal' ? HStack : VStack;
      
      return (
        <Container spacing={0} align="stretch">
          {items.map((item) => (
            <NavigationMenuItemComponent
              key={item.id}
              item={item}
              level={0}
              orientation={orientation}
              onNavigate={handleNavigate}
              performance={performance}
              expandedItems={expandedItems}
              onToggleExpanded={handleToggleExpanded}
              testId={testId}
            />
          ))}
        </Container>
      );
    }, [
      items,
      orientation,
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
        bg="white"
        border="1px solid"
        borderColor="gray.200"
        borderRadius="md"
        p={2}
      >
        {navigationContent}
      </Box>
    );
  }
);

NavigationMenuComponent.displayName = 'OptimizedNavigationMenu';

/**
 * Memoized OptimizedNavigationMenu export
 */
export const OptimizedNavigationMenu = React.memo(NavigationMenuComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof NavigationMenuProps)[] = [
    'items', 'orientation'
  ];
  
  return keysToCompare.every(key => {
    if (key === 'items') {
      return JSON.stringify(prevProps[key]) === JSON.stringify(nextProps[key]);
    }
    return prevProps[key] === nextProps[key];
  });
});

// Default export
export default OptimizedNavigationMenu;