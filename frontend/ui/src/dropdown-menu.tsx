import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  MenuGroup,
  MenuOptionGroup,
  MenuItemOption,
  MenuProps,
  MenuItemProps,
  Button,
  IconButton,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { throttle } from 'lodash-es';
import { ChevronDown, MoreVertical } from 'lucide-react';
import React, { useMemo, useCallback, useState } from 'react';
import { useLocalStorage } from 'react-use';

/**
 * Dropdown menu item types
 */
export type DropdownMenuItemType = 'item' | 'divider' | 'group' | 'checkbox' | 'radio';

/**
 * Dropdown menu item data
 */
export interface DropdownMenuItemData {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Item type */
  type?: DropdownMenuItemType;
  /** Icon element */
  icon?: React.ReactElement;
  /** Keyboard shortcut */
  shortcut?: string;
  /** Whether item is disabled */
  disabled?: boolean;
  /** Whether item is checked (for checkbox/radio) */
  checked?: boolean;
  /** Sub-items for groups */
  items?: DropdownMenuItemData[];
  /** Click handler */
  onClick?: () => void;
}

/**
 * Performance optimization options for dropdown menu
 */
export interface DropdownMenuPerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Throttle menu actions (ms) */
  throttleActions?: number;
  /** Enable animations */
  enableAnimations?: boolean;
  /** Persist menu state */
  persistState?: boolean;
  /** Close on item select */
  closeOnSelect?: boolean;
}

/**
 * Dropdown menu props
 */
export interface DropdownMenuProps extends Omit<MenuProps, 'children'> {
  /** Menu items */
  items?: DropdownMenuItemData[];
  /** Trigger element */
  trigger?: React.ReactElement;
  /** Trigger variant */
  triggerVariant?: 'button' | 'icon' | 'custom';
  /** Trigger text */
  triggerText?: string;
  /** Custom menu action handler */
  onMenuAction?: (item: DropdownMenuItemData) => void;
  /** Performance optimization settings */
  performance?: DropdownMenuPerformanceOptions;
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
  /** Menu content */
  children?: React.ReactNode;
}

/**
 * Optimized menu action handler factory
 * @param originalOnMenuAction
 * @param throttleMs
 * @param analytics
 */
const useOptimizedMenuActionHandler = (
  originalOnMenuAction?: (item: DropdownMenuItemData) => void,
  throttleMs?: number,
  analytics?: DropdownMenuProps['analytics']
) => {
  return useMemo(() => {
    if (!originalOnMenuAction) return undefined;

    let optimizedHandler = (item: DropdownMenuItemData) => {
      // Track analytics
      if (analytics && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', analytics.action || 'dropdown_menu_action', {
          event_category: analytics.category || 'dropdown_menu',
          event_label: `${analytics.label || 'menu'}_${item.id}`,
        });
      }
      
      originalOnMenuAction(item);
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
 * Animation variants for dropdown menu
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
 * @param checkedItems
 * @param onCheckedChange
 */
const renderMenuItems = (
  items: DropdownMenuItemData[],
  onAction?: (item: DropdownMenuItemData) => void,
  testId?: string,
  checkedItems?: Set<string>,
  onCheckedChange?: (itemId: string, checked: boolean) => void
) => {
  return items.map((item, index) => {
    if (item.type === 'divider') {
      return <MenuDivider key={`${item.id}-${index}`} />;
    }

    if (item.type === 'group' && item.items) {
      return (
        <MenuGroup key={`${item.id}-${index}`} title={item.label}>
          {renderMenuItems(item.items, onAction, testId, checkedItems, onCheckedChange)}
        </MenuGroup>
      );
    }

    if (item.type === 'checkbox' || item.type === 'radio') {
      const isChecked = item.checked ?? checkedItems?.has(item.id) ?? false;
      
      return (
        <MenuItemOption
          key={`${item.id}-${index}`}
          icon={item.icon}
          isDisabled={item.disabled}
          isChecked={isChecked}
          onClick={() => {
            const newChecked = !isChecked;
            onCheckedChange?.(item.id, newChecked);
            item.onClick?.();
            onAction?.(item);
          }}
          data-testid={`${testId}-item-${item.id}`}
        >
          {item.label}
        </MenuItemOption>
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
          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'gray' }}>
            {item.shortcut}
          </span>
        )}
      </MenuItem>
    );
  });
};

/**
 * Optimized DropdownMenu Component
 */
const DropdownMenuComponent = React.forwardRef<HTMLDivElement, DropdownMenuProps>(
  (
    {
      items = [],
      trigger,
      triggerVariant = 'button',
      triggerText = 'Menu',
      onMenuAction,
      performance = { 
        memoize: true, 
        throttleActions: 100, 
        enableAnimations: true,
        closeOnSelect: true
      },
      storageKey,
      testId,
      analytics,
      children,
      ...rest
    },
    ref
  ) => {
    // State persistence for checked items
    const [checkedItems, setCheckedItems] = useLocalStorage<Set<string>>(
      storageKey || 'dropdown-menu-checked',
      new Set()
    );

    // Optimized menu action handler
    const optimizedMenuActionHandler = useOptimizedMenuActionHandler(
      onMenuAction,
      performance.throttleActions,
      analytics
    );

    // Handle checked item changes
    const handleCheckedChange = useCallback((itemId: string, checked: boolean) => {
      if (!performance.persistState || !storageKey) return;
      
      const newCheckedItems = new Set(checkedItems);
      if (checked) {
        newCheckedItems.add(itemId);
      } else {
        newCheckedItems.delete(itemId);
      }
      setCheckedItems(newCheckedItems);
    }, [checkedItems, setCheckedItems, performance.persistState, storageKey]);

    // Handle menu action
    const handleMenuAction = useCallback((item: DropdownMenuItemData) => {
      optimizedMenuActionHandler?.(item);
    }, [optimizedMenuActionHandler]);

    // Memoized trigger element
    const triggerElement = useMemo(() => {
      if (trigger) {
        return trigger;
      }

      switch (triggerVariant) {
        case 'icon':
          return (
            <IconButton
              aria-label="Menu"
              icon={<MoreVertical size={16} />}
              variant="ghost"
              size="sm"
            />
          );
        case 'button':
          return (
            <Button rightIcon={<ChevronDown size={16} />} variant="outline">
              {triggerText}
            </Button>
          );
        default:
          return (
            <Button rightIcon={<ChevronDown size={16} />} variant="outline">
              {triggerText}
            </Button>
          );
      }
    }, [trigger, triggerVariant, triggerText]);

    // Memoized menu content
    const menuContent = useMemo(() => {
      const content = children || renderMenuItems(
        items, 
        handleMenuAction, 
        testId, 
        checkedItems, 
        handleCheckedChange
      );

      if (performance.enableAnimations) {
        const MotionMenuList = motion(MenuList);
        
        return (
          <MotionMenuList
            variants={menuVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.15, ease: "easeOut" }}
            data-testid={`${testId}-menu`}
          >
            {content}
          </MotionMenuList>
        );
      }

      return (
        <MenuList data-testid={`${testId}-menu`}>
          {content}
        </MenuList>
      );
    }, [
      children,
      items,
      handleMenuAction,
      testId,
      checkedItems,
      handleCheckedChange,
      performance.enableAnimations
    ]);

    // Memoized menu props
    const menuProps = useMemo(() => ({
      closeOnSelect: performance.closeOnSelect,
      'data-testid': testId,
      ...rest,
    }), [performance.closeOnSelect, testId, rest]);

    return (
      <Menu ref={ref} {...menuProps}>
        <MenuButton as={React.Fragment}>
          {triggerElement}
        </MenuButton>
        {menuContent}
      </Menu>
    );
  }
);

DropdownMenuComponent.displayName = 'OptimizedDropdownMenu';

/**
 * Memoized OptimizedDropdownMenu export
 */
export const OptimizedDropdownMenu = React.memo(DropdownMenuComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof DropdownMenuProps)[] = [
    'items', 'triggerText', 'triggerVariant', 'children'
  ];
  
  return keysToCompare.every(key => {
    if (key === 'items') {
      return JSON.stringify(prevProps[key]) === JSON.stringify(nextProps[key]);
    }
    return prevProps[key] === nextProps[key];
  });
});

// Default export
export default OptimizedDropdownMenu;