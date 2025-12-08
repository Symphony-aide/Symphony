/**
 * @fileoverview Complex primitive factory functions
 * @module @symphony/primitives/primitives/complex
 */

import { BasePrimitive } from '../core/BasePrimitive.js';

/**
 * @typedef {import('../core/types.js').TooltipPosition} TooltipPosition
 * @typedef {import('../core/types.js').ModalSize} ModalSize
 */

/**
 * List item type
 * @typedef {Object} ListItem
 * @property {string} id - Unique item identifier
 * @property {*} [data] - Item data
 */

/**
 * List props
 * @typedef {Object} ListProps
 * @property {ListItem[]} [items=[]] - Array of list items
 * @property {string} [renderItem] - Handler ID for rendering each item
 * @property {boolean} [virtualized=false] - Whether to use virtualized rendering
 * @property {string} [className] - CSS class name
 */

/**
 * Creates a List primitive for displaying collections of items.
 *
 * @param {ListProps} [props={}] - List properties
 * @returns {BasePrimitive} List primitive instance
 *
 * @example
 * const list = List({
 *   items: [{ id: '1', data: 'Item 1' }, { id: '2', data: 'Item 2' }],
 *   renderItem: 'render_list_item_handler',
 *   virtualized: true
 * });
 */
export function List(props = {}) {
  const defaultProps = {
    items: [],
    virtualized: false,
    ...props,
  };
  const primitive = new BasePrimitive('List', defaultProps);
  primitive.renderStrategy = 'react';
  return primitive;
}


/**
 * Tab definition
 * @typedef {Object} TabDefinition
 * @property {string} id - Unique tab identifier
 * @property {string} label - Tab display label
 * @property {string} [icon] - Optional icon name
 */

/**
 * Tabs props
 * @typedef {Object} TabsProps
 * @property {TabDefinition[]} [tabs=[]] - Array of tab definitions
 * @property {string} [activeTab] - Currently active tab ID
 * @property {string} [onTabChange] - Handler ID for tab change events
 * @property {string} [className] - CSS class name
 */

/**
 * Creates a Tabs primitive for tabbed navigation.
 *
 * @param {TabsProps} [props={}] - Tabs properties
 * @returns {BasePrimitive} Tabs primitive instance
 *
 * @example
 * const tabs = Tabs({
 *   tabs: [
 *     { id: 'tab1', label: 'First Tab', icon: 'file' },
 *     { id: 'tab2', label: 'Second Tab' }
 *   ],
 *   activeTab: 'tab1',
 *   onTabChange: 'tab_change_handler'
 * });
 */
export function Tabs(props = {}) {
  const defaultProps = {
    tabs: [],
    ...props,
  };
  const primitive = new BasePrimitive('Tabs', defaultProps);
  primitive.renderStrategy = 'react';
  return primitive;
}

/**
 * Dropdown item definition
 * @typedef {Object} DropdownItem
 * @property {string} id - Unique item identifier
 * @property {string} label - Item display label
 * @property {string} [icon] - Optional icon name
 * @property {string} [onClick] - Handler ID for click events
 */

/**
 * Dropdown props
 * @typedef {Object} DropdownProps
 * @property {BasePrimitive} [trigger] - Trigger primitive (e.g., Button)
 * @property {DropdownItem[]} [items=[]] - Array of dropdown items
 * @property {string} [className] - CSS class name
 */

/**
 * Creates a Dropdown primitive for dropdown menus.
 *
 * @param {DropdownProps} [props={}] - Dropdown properties
 * @returns {BasePrimitive} Dropdown primitive instance
 *
 * @example
 * const dropdown = Dropdown({
 *   trigger: Button({ variant: 'outline' }),
 *   items: [
 *     { id: 'edit', label: 'Edit', icon: 'pencil', onClick: 'edit_handler' },
 *     { id: 'delete', label: 'Delete', icon: 'trash', onClick: 'delete_handler' }
 *   ]
 * });
 */
export function Dropdown(props = {}) {
  const defaultProps = {
    items: [],
    ...props,
  };
  const primitive = new BasePrimitive('Dropdown', defaultProps);
  primitive.renderStrategy = 'react';
  return primitive;
}

/**
 * Modal props
 * @typedef {Object} ModalProps
 * @property {string} [title] - Modal title
 * @property {boolean} [open=false] - Whether the modal is open
 * @property {string} [onClose] - Handler ID for close events
 * @property {ModalSize} [size='md'] - Modal size
 * @property {string} [className] - CSS class name
 */

/**
 * Creates a Modal primitive for dialog windows.
 *
 * @param {ModalProps} [props={}] - Modal properties
 * @returns {BasePrimitive} Modal primitive instance
 *
 * @example
 * const modal = Modal({
 *   title: 'Confirm Action',
 *   open: true,
 *   onClose: 'close_modal_handler',
 *   size: 'lg'
 * });
 */
export function Modal(props = {}) {
  const defaultProps = {
    open: false,
    size: 'md',
    ...props,
  };
  const primitive = new BasePrimitive('Modal', defaultProps);
  primitive.renderStrategy = 'react';
  return primitive;
}

/**
 * Tooltip props
 * @typedef {Object} TooltipProps
 * @property {string} [content] - Tooltip content text
 * @property {TooltipPosition} [position='top'] - Tooltip position relative to trigger
 * @property {string} [className] - CSS class name
 */

/**
 * Creates a Tooltip primitive for hover information.
 *
 * @param {TooltipProps} [props={}] - Tooltip properties
 * @returns {BasePrimitive} Tooltip primitive instance
 *
 * @example
 * const tooltip = Tooltip({
 *   content: 'Click to save',
 *   position: 'bottom'
 * });
 */
export function Tooltip(props = {}) {
  const defaultProps = {
    position: 'top',
    ...props,
  };
  const primitive = new BasePrimitive('Tooltip', defaultProps);
  primitive.renderStrategy = 'react';
  return primitive;
}
