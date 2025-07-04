import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  MenuGroup,
  HStack,
  Button,
  Box,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { throttle } from 'lodash-es';
import { ChevronDown } from 'lucide-react';
import React, { useMemo, useCallback, useState } from 'react';

/**
 * Menubar item data
 */
export interface MenubarItemData {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Icon element */
  icon?: React.ReactElement;
  /** Keyboard shortcut */
  shortcut?: string;
  /** Whether item is disabled */
  disabled?: boolean;
  /** Item type */
  type?: 'item' | 'divider' | 'group';
  /** Sub-items for groups */
  items?: MenubarItemData[];
  /** Click handler */
  onClick?: () => void;
}

/**
 * Menubar menu data
 */
export interface MenubarMenuData {
  /** Unique identifier */
  id: string;
  /** Menu label */
  label: string;
  /** Menu items */
  items: MenubarItemData[];
  /** Whether menu is disabled */
  disabled?: boolean;
}

/**
 * Performance optimization options for menubar
 */
export interface MenubarPerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Throttle menu actions (ms) */
  throttleActions?: number;
  /** Enable animations */
  enableAnimations?: boolean;
  /** Close on item select */
  closeOnSelect?: boolean;
}

/**
 * Menubar props
 */
export interface MenubarProps {
  /** Menubar menus */
  menus?: MenubarMenuData[];
  /** Custom menu action handler */
  onMenuAction?: (item: MenubarItemData, menuId: string) => void;
  /** Performance optimization settings */
  performance?: MenubarPerformanceOptions;
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
 * Optimized menu action handler factory
 * @param originalOnMenuAction
 * @param throttleMs
 * @param analytics
 */
const useOptimizedMenuActionHandler = (
  originalOnMenuAction?: (item: MenubarItemData, menuId: string) => void,
  throttleMs?: number,
  analytics?: MenubarProps['analytics']
) => {
  return useMemo(() => {
    if (!originalOnMenuAction) return undefined;

    let optimizedHandler = (item: MenubarItemData, menuId: string) => {
      // Track analytics
      if (analytics && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', analytics.action || 'menubar_action', {
          event_category: analytics.category || 'menubar',
          event_label: `${analytics.label || 'menu'}_${menuId}_${item.id}`,
        });
      }
      
      originalOnMenuAction(item, menuId);
    };

    // Apply throttling
    if (throttleMs) {
      optimizedHandler = throttle(optimizedHandler, throttleMs, { 
        leading: true, 
        trailing: false 
      });
    }

    return optimizedHandler;
  }, [originalOnMenuAction, throttleMs, analytics]);
};

/**
 * Animation variants for menubar
 */
const menuVariants = {
  initial: { opacity: 0, scale: 0.95, y: -10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: -10 },
};

/**
 * Render menu items recursively
 * @param items
 * @param onAction
 * @param testId
 */
const renderMenuItems = (
  items: MenubarItemData[],
  onAction?: (item: MenubarItemData) => void,
  testId?: string
) => {
  return items.map((item, index) => {
    if (item.type === 'divider') {
      return <MenuDivider key={`${item.id}-${index}`} />;
    }

    if (item.type === 'group' && item.items) {
      return (
        <MenuGroup key={`${item.id}-${index}`} title={item.label}>
          {renderMenuItems(item.items, onAction, testId)}
        </MenuGroup>
      );
    }

    const handleClick = () => {
      item.onClick?.();
      onAction?.(item);
    };

    return (
      <MenuItem
        key={`${item.id}-${index}`}
        icon={item.icon}
        isDisabled={item.disabled}
        onClick={handleClick}
        data-testid={`${testId}-item-${item.id}`}
      >
        {item.label}
        {item.shortcut && (
          <Box ml="auto" fontSize="xs" color="gray.500">
            {item.shortcut}
          </Box>
        )}
      </MenuItem>
    );
  });
};

/**
 * Optimized MenubarMenu Component
 */
const MenubarMenuComponent = React.memo<{
  menu: MenubarMenuData;
  onAction?: (item: MenubarItemData) => void;
  performance: MenubarPerformanceOptions;
  testId?: string;
}>(({ menu, onAction, performance, testId }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleMenuAction = useCallback((item: MenubarItemData) => {
    onAction?.(item);
    if (performance.closeOnSelect) {
      setIsOpen(false);
    }
  }, [onAction, performance.closeOnSelect]);

  const menuContent = useMemo(() => {
    const content = renderMenuItems(menu.items, handleMenuAction, testId);

    if (performance.enableAnimations) {
      const MotionMenuList = motion(MenuList);
      
      return (
        <MotionMenuList
          variants={menuVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.15, ease: "easeOut" }}
          data-testid={`${testId}-menu-${menu.id}`}
        >
          {content}
        </MotionMenuList>
      );
    }

    return (
      <MenuList data-testid={`${testId}-menu-${menu.id}`}>
        {content}
      </MenuList>
    );
  }, [menu.items, handleMenuAction, testId, performance.enableAnimations, menu.id]);

  return (
    <Menu
      isOpen={isOpen}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
    >
      <MenuButton
        as={Button}
        variant="ghost"
        size="sm"
        rightIcon={<ChevronDown size={12} />}
        isDisabled={menu.disabled}
        data-testid={`${testId}-trigger-${menu.id}`}
        _hover={{ bg: 'gray.100' }}
        _active={{ bg: 'gray.200' }}
      >
        {menu.label}
      </MenuButton>
      {menuContent}
    </Menu>
  );
});

MenubarMenuComponent.displayName = 'MenubarMenu';

/**
 * Optimized Menubar Component
 */
const MenubarComponent = React.forwardRef<HTMLDivElement, MenubarProps>(
  (
    {
      menus = [],
      onMenuAction,
      performance = { 
        memoize: true, 
        throttleActions: 100, 
        enableAnimations: true,
        closeOnSelect: true
      },
      testId,
      analytics,
    },
    ref
  ) => {
    // Optimized menu action handler
    const optimizedMenuActionHandler = useOptimizedMenuActionHandler(
      onMenuAction,
      performance.throttleActions,
      analytics
    );

    // Handle menu action
    const handleMenuAction = useCallback((item: MenubarItemData, menuId: string) => {
      optimizedMenuActionHandler?.(item, menuId);
    }, [optimizedMenuActionHandler]);

    // Memoized menubar content
    const menubarContent = useMemo(() => {
      return menus.map((menu) => (
        <MenubarMenuComponent
          key={menu.id}
          menu={menu}
          onAction={(item) => handleMenuAction(item, menu.id)}
          performance={performance}
          testId={testId}
        />
      ));
    }, [menus, handleMenuAction, performance, testId]);

    return (
      <Box
        ref={ref}
        data-testid={testId}
        bg="white"
        borderBottom="1px solid"
        borderColor="gray.200"
        px={2}
        py={1}
      >
        <HStack spacing={0}>
          {menubarContent}
        </HStack>
      </Box>
    );
  }
);

MenubarComponent.displayName = 'OptimizedMenubar';

/**
 * Memoized OptimizedMenubar export
 */
export const OptimizedMenubar = React.memo(MenubarComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof MenubarProps)[] = ['menus'];
  
  return keysToCompare.every(key => {
    if (key === 'menus') {
      return JSON.stringify(prevProps[key]) === JSON.stringify(nextProps[key]);
    }
    return prevProps[key] === nextProps[key];
  });
});

// Default export
export default OptimizedMenubar;