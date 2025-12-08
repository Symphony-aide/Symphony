/**
 * @fileoverview Layout primitive factory functions
 * @module @symphony/primitives/primitives/layout
 */

import { BasePrimitive } from '../core/BasePrimitive.js';

/**
 * @typedef {import('../core/types.js').Direction} Direction
 * @typedef {import('../core/types.js').FlexJustify} FlexJustify
 * @typedef {import('../core/types.js').FlexAlign} FlexAlign
 * @typedef {import('../core/types.js').Orientation} Orientation
 */

/**
 * Container props
 * @typedef {Object} ContainerProps
 * @property {Direction} [direction='column'] - Layout direction (row/column)
 * @property {number} [gap=0] - Gap between children
 * @property {string} [className] - CSS class name
 */

/**
 * Creates a Container primitive for structuring UI with direction and gap.
 *
 * @param {ContainerProps} [props={}] - Container properties
 * @returns {BasePrimitive} Container primitive instance
 *
 * @example
 * const container = Container({ direction: 'row', gap: 8, className: 'my-container' });
 */
export function Container(props = {}) {
  const defaultProps = {
    direction: 'column',
    gap: 0,
    ...props,
  };
  const primitive = new BasePrimitive('Container', defaultProps);
  primitive.renderStrategy = 'react';
  return primitive;
}


/**
 * Flex props
 * @typedef {Object} FlexProps
 * @property {FlexJustify} [justify='start'] - Justify content alignment
 * @property {FlexAlign} [align='stretch'] - Align items alignment
 * @property {boolean} [wrap=false] - Whether to wrap children
 * @property {string} [className] - CSS class name
 */

/**
 * Creates a Flex primitive for flexible box layout.
 *
 * @param {FlexProps} [props={}] - Flex properties
 * @returns {BasePrimitive} Flex primitive instance
 *
 * @example
 * const flex = Flex({ justify: 'center', align: 'center', wrap: true });
 */
export function Flex(props = {}) {
  const defaultProps = {
    justify: 'start',
    align: 'stretch',
    wrap: false,
    ...props,
  };
  const primitive = new BasePrimitive('Flex', defaultProps);
  primitive.renderStrategy = 'react';
  return primitive;
}

/**
 * Grid props
 * @typedef {Object} GridProps
 * @property {number} [columns=1] - Number of columns
 * @property {number} [rows] - Number of rows (optional)
 * @property {number} [gap=0] - Gap between grid items
 * @property {string} [className] - CSS class name
 */

/**
 * Creates a Grid primitive for grid-based layout.
 *
 * @param {GridProps} [props={}] - Grid properties
 * @returns {BasePrimitive} Grid primitive instance
 *
 * @example
 * const grid = Grid({ columns: 3, gap: 16, className: 'my-grid' });
 */
export function Grid(props = {}) {
  const defaultProps = {
    columns: 1,
    gap: 0,
    ...props,
  };
  const primitive = new BasePrimitive('Grid', defaultProps);
  primitive.renderStrategy = 'react';
  return primitive;
}

/**
 * Panel props
 * @typedef {Object} PanelProps
 * @property {string} [title] - Panel title
 * @property {boolean} [collapsible=false] - Whether the panel can be collapsed
 * @property {boolean} [defaultCollapsed=false] - Initial collapsed state
 * @property {string} [className] - CSS class name
 */

/**
 * Creates a Panel primitive for collapsible content sections.
 *
 * @param {PanelProps} [props={}] - Panel properties
 * @returns {BasePrimitive} Panel primitive instance
 *
 * @example
 * const panel = Panel({ title: 'Settings', collapsible: true, defaultCollapsed: false });
 */
export function Panel(props = {}) {
  const defaultProps = {
    collapsible: false,
    defaultCollapsed: false,
    ...props,
  };
  const primitive = new BasePrimitive('Panel', defaultProps);
  primitive.renderStrategy = 'react';
  return primitive;
}

/**
 * Divider props
 * @typedef {Object} DividerProps
 * @property {Orientation} [orientation='horizontal'] - Divider orientation
 * @property {string} [className] - CSS class name
 */

/**
 * Creates a Divider primitive for visual separation.
 * Marked as a leaf node (cannot have children).
 *
 * @param {DividerProps} [props={}] - Divider properties
 * @returns {BasePrimitive} Divider primitive instance
 *
 * @example
 * const divider = Divider({ orientation: 'vertical', className: 'my-divider' });
 */
export function Divider(props = {}) {
  const defaultProps = {
    orientation: 'horizontal',
    ...props,
  };
  const primitive = new BasePrimitive('Divider', defaultProps);
  primitive.renderStrategy = 'react';
  primitive.isLeafNode = true;
  return primitive;
}
