/**
 * @fileoverview Type definitions for UI primitives registration
 * @module @symphony/primitives/registration/types
 */

/**
 * Options for component registration
 * @typedef {Object} RegistrationOptions
 * @property {boolean} [override=false] - Whether to override existing registrations
 * @property {boolean} [silent=false] - Whether to suppress warning logs
 */

/**
 * Result of a registration operation
 * @typedef {Object} RegistrationResult
 * @property {string[]} registered - Types that were successfully registered
 * @property {string[]} skipped - Types that were skipped (already registered)
 * @property {string[]} failed - Types that failed to register
 */

/**
 * Component wrapper props for Container
 * @typedef {Object} ContainerWrapperProps
 * @property {'row' | 'column' | 'row-reverse' | 'column-reverse'} [direction='row'] - Flex direction
 * @property {string | number} [gap] - Gap between children
 * @property {string} [className] - Additional CSS classes
 * @property {React.ReactNode} [children] - Child elements
 */

/**
 * Component wrapper props for Flex
 * @typedef {Object} FlexWrapperProps
 * @property {'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'} [justify='flex-start'] - Justify content
 * @property {'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'} [align='stretch'] - Align items
 * @property {'nowrap' | 'wrap' | 'wrap-reverse'} [wrap='nowrap'] - Flex wrap
 * @property {'row' | 'column' | 'row-reverse' | 'column-reverse'} [direction='row'] - Flex direction
 * @property {string | number} [gap] - Gap between children
 * @property {string} [className] - Additional CSS classes
 * @property {React.ReactNode} [children] - Child elements
 */

/**
 * Component wrapper props for Grid
 * @typedef {Object} GridWrapperProps
 * @property {number | string} [columns=1] - Number of columns or grid-template-columns value
 * @property {number | string} [rows] - Number of rows or grid-template-rows value
 * @property {string | number} [gap] - Gap between grid items
 * @property {string} [className] - Additional CSS classes
 * @property {React.ReactNode} [children] - Child elements
 */

/**
 * Component wrapper props for Text
 * @typedef {Object} TextWrapperProps
 * @property {string} [content] - Text content to display
 * @property {'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span' | 'label'} [variant='p'] - HTML element variant
 * @property {'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'} [size='base'] - Text size
 * @property {'normal' | 'medium' | 'semibold' | 'bold'} [weight='normal'] - Font weight
 * @property {string} [className] - Additional CSS classes
 * @property {React.ReactNode} [children] - Child elements (alternative to content)
 */

/**
 * Component wrapper props for Select
 * @typedef {Object} SelectWrapperProps
 * @property {Array<{value: string, label: string}>} [options=[]] - Select options
 * @property {string} [value] - Selected value
 * @property {string} [placeholder] - Placeholder text
 * @property {(value: string) => void} [onValueChange] - Value change handler
 * @property {boolean} [disabled] - Whether select is disabled
 * @property {string} [className] - Additional CSS classes
 */

/**
 * Component wrapper props for Tooltip
 * @typedef {Object} TooltipWrapperProps
 * @property {string | React.ReactNode} [content] - Tooltip content
 * @property {'top' | 'right' | 'bottom' | 'left'} [side='top'] - Tooltip position
 * @property {number} [delayDuration=200] - Delay before showing tooltip
 * @property {React.ReactNode} [children] - Trigger element
 */

/**
 * Component wrapper props for Dialog
 * @typedef {Object} DialogWrapperProps
 * @property {string} [title] - Dialog title
 * @property {string} [description] - Dialog description
 * @property {boolean} [open] - Whether dialog is open
 * @property {(open: boolean) => void} [onOpenChange] - Open state change handler
 * @property {React.ReactNode} [trigger] - Trigger element
 * @property {React.ReactNode} [children] - Dialog content
 */

export {};
