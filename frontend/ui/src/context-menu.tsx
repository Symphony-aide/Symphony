import React, { useMemo, useCallback, useState, useRef } from 'react';
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  MenuGroup,
  MenuProps,
  MenuItemProps,
  Portal,
  Box,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { throttle } from 'lodash-es';

/**
 * Context menu item data
 */
export interface ContextMenuItemData {
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
  items?: ContextMenuItemData[];
  /** Click handler */
  onClick?: () => void;
}

/**
 * Performance optimization options for context menu
 */
export interface ContextMenuPerformanceOptions {
  /** Enable memoization */
  memoize?: boolean;
  /** Throttle context menu events (ms) */
  throttleEvents?: number;
  /** Enable animations */
  enableAnimations?: boolean;
  /** Portal the menu */
  usePortal?: boolean;
}

/**
 * Context menu props
 */
export interface ContextMenuProps {
  /** Menu items */
  items?: ContextMenuItemData[];
  /** Trigger element */
  children: React.ReactNode;
  /** Custom menu handler */
  onMenuAction?: (item: ContextMenuItemData) => void;
  /** Performance optimization settings */
  performance?: ContextMenuPerformanceOptions;
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
 */
const useOptimizedMenuActionHandler = (
  originalOnMenuAction?: (item: ContextMenuItemData) => void,
  throttleMs?: number,
  analytics?: ContextMenuProps['analytics']
) => {
  return useMemo(() => {
    if (!originalOnMenuAction) return undefined;

    let optimizedHandler = (item: ContextMenuItemData) => {
      // Track analytics
      if (analytics && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', analytics.action || 'context_menu_action', {
          event_category: analytics.category || 'context_menu',
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
 * Context menu hook
 */
const useContextMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setPosition({ x: event.clientX, y: event.clientY });
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    position,
    triggerRef,
    handleContextMenu,
    handleClose,
  };
};

/**
 * Animation variants for context menu
 */
const menuVariants = {
  initial: { opacity: 0, scale: 0.95, y: -10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: -10 },
};

/**
 * Render menu items recursively
 */
const renderMenuItems = (
  items: ContextMenuItemData[],
  onAction?: (item: ContextMenuItemData) => void,
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
 * Optimized ContextMenu Component
 */
const ContextMenuComponent = React.forwardRef<HTMLDivElement, ContextMenuProps>(
  (
    {
      items = [],
      children,
      onMenuAction,
      performance = { memoize: true, throttleEvents: 100, enableAnimations: true, usePortal: true },
      testId,
      analytics,
    },
    ref
  ) => {
    const { isOpen, position, triggerRef, handleContextMenu, handleClose } = useContextMenu();

    // Optimized menu action handler
    const optimizedMenuActionHandler = useOptimizedMenuActionHandler(
      onMenuAction,
      performance.throttleEvents,
      analytics
    );

    // Handle menu action
    const handleMenuAction = useCallback((item: ContextMenuItemData) => {
      optimizedMenuActionHandler?.(item);
      handleClose();
    }, [optimizedMenuActionHandler, handleClose]);

    // Memoized menu content
    const menuContent = useMemo(() => {
      if (performance.enableAnimations) {
        const MotionMenuList = motion(MenuList);
        
        return (
          <AnimatePresence>
            {isOpen && (
              <MotionMenuList
                variants={menuVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.15, ease: "easeOut" }}
                style={{
                  position: 'fixed',
                  left: position.x,
                  top: position.y,
                  zIndex: 9999,
                }}
                data-testid={`${testId}-menu`}
              >
                {renderMenuItems(items, handleMenuAction, testId)}
              </MotionMenuList>
            )}
          </AnimatePresence>
        );
      }

      return (
        <MenuList
          style={{
            position: 'fixed',
            left: position.x,
            top: position.y,
            zIndex: 9999,
          }}
          data-testid={`${testId}-menu`}
        >
          {renderMenuItems(items, handleMenuAction, testId)}
        </MenuList>
      );
    }, [performance.enableAnimations, isOpen, position, items, handleMenuAction, testId]);

    return (
      <>
        <Box
          ref={ref}
          onContextMenu={handleContextMenu}
          data-testid={testId}
        >
          {children}
        </Box>
        
        {/* Invisible menu for positioning */}
        <Menu isOpen={isOpen} onClose={handleClose}>
          <MenuButton style={{ display: 'none' }} />
          {performance.usePortal ? (
            <Portal>
              {menuContent}
            </Portal>
          ) : (
            menuContent
          )}
        </Menu>

        {/* Backdrop to close menu */}
        {isOpen && (
          <Box
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            zIndex={9998}
            onClick={handleClose}
            onContextMenu={(e) => e.preventDefault()}
          />
        )}
      </>
    );
  }
);

ContextMenuComponent.displayName = 'OptimizedContextMenu';

/**
 * Memoized OptimizedContextMenu export
 */
export const OptimizedContextMenu = React.memo(ContextMenuComponent, (prevProps, nextProps) => {
  if (!prevProps.performance?.memoize && !nextProps.performance?.memoize) {
    return false;
  }

  const keysToCompare: (keyof ContextMenuProps)[] = ['items', 'children'];
  
  return keysToCompare.every(key => {
    if (key === 'items') {
      return JSON.stringify(prevProps[key]) === JSON.stringify(nextProps[key]);
    }
    return prevProps[key] === nextProps[key];
  });
});

// Default export
export default OptimizedContextMenu;