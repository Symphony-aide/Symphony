/**
 * @fileoverview Interactive primitive factory functions
 * @module @symphony/primitives/primitives/interactive
 */

import { BasePrimitive } from '../core/BasePrimitive.js';

/**
 * @typedef {import('../core/types.js').ButtonVariant} ButtonVariant
 * @typedef {import('../core/types.js').ButtonSize} ButtonSize
 * @typedef {import('../core/types.js').InputType} InputType
 * @typedef {import('../core/types.js').TextVariant} TextVariant
 * @typedef {import('../core/types.js').TextSize} TextSize
 * @typedef {import('../core/types.js').TextWeight} TextWeight
 */

/**
 * Button props
 * @typedef {Object} ButtonProps
 * @property {ButtonVariant} [variant='default'] - Button style variant
 * @property {ButtonSize} [size='default'] - Button size
 * @property {string} [onClick] - Handler ID for click events
 * @property {boolean} [disabled=false] - Whether the button is disabled
 * @property {string} [className] - CSS class name
 */

/**
 * Creates a Button primitive for user interactions.
 *
 * @param {ButtonProps} [props={}] - Button properties
 * @returns {BasePrimitive} Button primitive instance
 *
 * @example
 * const button = Button({ variant: 'destructive', size: 'lg', onClick: 'delete_handler' });
 */
export function Button(props = {}) {
  const defaultProps = {
    variant: 'default',
    size: 'default',
    disabled: false,
    ...props,
  };
  const primitive = new BasePrimitive('Button', defaultProps);
  primitive.renderStrategy = 'react';
  return primitive;
}

/**
 * Input props
 * @typedef {Object} InputProps
 * @property {InputType} [type='text'] - Input type
 * @property {string} [value=''] - Current input value
 * @property {string} [onChange] - Handler ID for change events
 * @property {string} [placeholder] - Placeholder text
 * @property {boolean} [disabled=false] - Whether the input is disabled
 * @property {string} [className] - CSS class name
 */


/**
 * Creates an Input primitive for text entry.
 * Marked as a leaf node (cannot have children).
 *
 * @param {InputProps} [props={}] - Input properties
 * @returns {BasePrimitive} Input primitive instance
 *
 * @example
 * const input = Input({ type: 'email', placeholder: 'Enter email', onChange: 'email_change_handler' });
 */
export function Input(props = {}) {
  const defaultProps = {
    type: 'text',
    value: '',
    disabled: false,
    ...props,
  };
  const primitive = new BasePrimitive('Input', defaultProps);
  primitive.renderStrategy = 'react';
  primitive.isLeafNode = true;
  return primitive;
}

/**
 * Icon props
 * @typedef {Object} IconProps
 * @property {string} [name] - Lucide icon name
 * @property {number} [size=24] - Icon size in pixels
 * @property {string} [color] - Icon color
 * @property {string} [className] - CSS class name
 */

/**
 * Creates an Icon primitive for displaying icons.
 * Marked as a leaf node (cannot have children).
 *
 * @param {IconProps} [props={}] - Icon properties
 * @returns {BasePrimitive} Icon primitive instance
 *
 * @example
 * const icon = Icon({ name: 'file', size: 16, color: '#333' });
 */
export function Icon(props = {}) {
  const defaultProps = {
    size: 24,
    ...props,
  };
  const primitive = new BasePrimitive('Icon', defaultProps);
  primitive.renderStrategy = 'react';
  primitive.isLeafNode = true;
  return primitive;
}

/**
 * Text props
 * @typedef {Object} TextProps
 * @property {string} [content=''] - Text content to display
 * @property {TextVariant} [variant='body'] - Text style variant
 * @property {TextSize} [size='md'] - Text size
 * @property {TextWeight} [weight='normal'] - Text weight
 * @property {string} [className] - CSS class name
 */

/**
 * Creates a Text primitive for displaying text content.
 * Marked as a leaf node (cannot have children).
 *
 * @param {TextProps} [props={}] - Text properties
 * @returns {BasePrimitive} Text primitive instance
 *
 * @example
 * const text = Text({ content: 'Hello World', variant: 'heading', size: 'lg', weight: 'bold' });
 */
export function Text(props = {}) {
  const defaultProps = {
    variant: 'body',
    size: 'md',
    weight: 'normal',
  };
  const mergedProps = { ...defaultProps, ...props };
  // Ensure content has a default value if not provided
  if (mergedProps.content === undefined) {
    mergedProps.content = '';
  }
  const primitive = new BasePrimitive('Text', mergedProps);
  primitive.renderStrategy = 'react';
  primitive.isLeafNode = true;
  return primitive;
}

/**
 * Checkbox props
 * @typedef {Object} CheckboxProps
 * @property {boolean} [checked=false] - Whether the checkbox is checked
 * @property {string} [onChange] - Handler ID for change events
 * @property {string} [label] - Label text for the checkbox
 * @property {boolean} [disabled=false] - Whether the checkbox is disabled
 * @property {string} [className] - CSS class name
 */

/**
 * Creates a Checkbox primitive for boolean input.
 *
 * @param {CheckboxProps} [props={}] - Checkbox properties
 * @returns {BasePrimitive} Checkbox primitive instance
 *
 * @example
 * const checkbox = Checkbox({ checked: true, label: 'Accept terms', onChange: 'terms_handler' });
 */
export function Checkbox(props = {}) {
  const defaultProps = {
    checked: false,
    disabled: false,
    ...props,
  };
  const primitive = new BasePrimitive('Checkbox', defaultProps);
  primitive.renderStrategy = 'react';
  return primitive;
}

/**
 * Select option
 * @typedef {Object} SelectOption
 * @property {string} value - Option value
 * @property {string} label - Option display label
 */

/**
 * Select props
 * @typedef {Object} SelectProps
 * @property {SelectOption[]} [options=[]] - Array of options
 * @property {string} [value] - Currently selected value
 * @property {string} [onChange] - Handler ID for change events
 * @property {string} [placeholder] - Placeholder text when no value selected
 * @property {boolean} [disabled=false] - Whether the select is disabled
 * @property {string} [className] - CSS class name
 */

/**
 * Creates a Select primitive for dropdown selection.
 *
 * @param {SelectProps} [props={}] - Select properties
 * @returns {BasePrimitive} Select primitive instance
 *
 * @example
 * const select = Select({
 *   options: [{ value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }],
 *   value: 'a',
 *   onChange: 'select_handler'
 * });
 */
export function Select(props = {}) {
  const defaultProps = {
    options: [],
    disabled: false,
    ...props,
  };
  const primitive = new BasePrimitive('Select', defaultProps);
  primitive.renderStrategy = 'react';
  return primitive;
}
