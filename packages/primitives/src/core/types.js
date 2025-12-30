/**
 * @fileoverview JSDoc type definitions for the Primitives package
 * @module @symphony/primitives/core/types
 */

/**
 * Properties that can be passed to any primitive
 * @typedef {Object.<string, *>} PrimitiveProps
 */

/**
 * Render strategy for primitives
 * @typedef {'react' | 'wasm' | 'direct'} RenderStrategy
 */

/**
 * Serialized component tree structure for IPC
 * @typedef {Object} ComponentTree
 * @property {string} id - Unique identifier
 * @property {string} type - Primitive type name
 * @property {PrimitiveProps} props - Component properties
 * @property {RenderStrategy} renderStrategy - How the component should be rendered
 * @property {ComponentTree[]} children - Child component trees
 */

/**
 * Modification payload for updating primitives
 * @typedef {Object} ModificationPayload
 * @property {Partial<PrimitiveProps>} [props] - Props to update
 */

/**
 * Layout primitive direction
 * @typedef {'row' | 'column'} Direction
 */

/**
 * Flex justify options
 * @typedef {'start' | 'center' | 'end' | 'between'} FlexJustify
 */

/**
 * Flex align options
 * @typedef {'start' | 'center' | 'end' | 'stretch'} FlexAlign
 */

/**
 * Divider orientation
 * @typedef {'horizontal' | 'vertical'} Orientation
 */

/**
 * Button variant options
 * @typedef {'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'} ButtonVariant
 */

/**
 * Button size options
 * @typedef {'default' | 'sm' | 'lg' | 'icon'} ButtonSize
 */

/**
 * Input type options
 * @typedef {'text' | 'password' | 'email' | 'number'} InputType
 */

/**
 * Text variant options
 * @typedef {'body' | 'heading' | 'caption' | 'code'} TextVariant
 */

/**
 * Text size options
 * @typedef {'xs' | 'sm' | 'md' | 'lg' | 'xl'} TextSize
 */

/**
 * Text weight options
 * @typedef {'normal' | 'medium' | 'semibold' | 'bold'} TextWeight
 */

/**
 * Tooltip position options
 * @typedef {'top' | 'bottom' | 'left' | 'right'} TooltipPosition
 */

/**
 * Terminal cursor style options
 * @typedef {'block' | 'underline' | 'bar'} CursorStyle
 */

/**
 * Modal size options
 * @typedef {'sm' | 'md' | 'lg' | 'xl' | 'full'} ModalSize
 */

// Export empty object to make this a module
export {};
