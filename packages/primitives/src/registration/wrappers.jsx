/**
 * @fileoverview Component wrappers for UI primitives registration
 * @module @symphony/primitives/registration/wrappers
 */

import React from 'react';

// Import UI components
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  ScrollArea,
  Text,
  Heading,
} from 'ui';

/**
 * Container wrapper component for flex layout.
 * 
 * ## UI Component Exception Documentation
 * 
 * **EXCEPTION: This component uses a plain `<div>` element instead of UI components.**
 * 
 * ### Justification:
 * 
 * 1. **Performance-Critical Layout**: ContainerWrapper is a low-level layout primitive
 *    used extensively throughout the application. Using UI components would add
 *    unnecessary overhead for simple flex container operations.
 * 
 * 2. **Inline Style Requirements**: This component uses inline styles for dynamic
 *    flex properties (direction, gap) that change frequently based on props.
 *    UI components typically use class-based styling which would require
 *    additional className computation.
 * 
 * 3. **Minimal Abstraction**: As a primitive wrapper, this component should have
 *    minimal abstraction to allow maximum flexibility for consumers.
 * 
 * ### When to Use UI Components Instead:
 * - For application-level layouts, prefer the Flex component from packages/ui
 * - For complex layouts with consistent styling, use UI layout components
 * 
 * @param {import('./types.js').ContainerWrapperProps} props
 * @returns {React.ReactElement}
 * @see Requirements 7.3 (UI Component Exception Documentation)
 */
export function ContainerWrapper({
  direction = 'row',
  gap,
  className = '',
  children,
  ...props
}) {
  const style = {
    display: 'flex',
    flexDirection: direction,
    gap: typeof gap === 'number' ? `${gap}px` : gap,
  };

  return (
    <div className={className} style={style} {...props}>
      {children}
    </div>
  );
}

ContainerWrapper.displayName = 'Container';

/**
 * Flex wrapper component for flexbox layout.
 * 
 * ## UI Component Exception Documentation
 * 
 * **EXCEPTION: This component uses a plain `<div>` element instead of UI components.**
 * 
 * ### Justification:
 * 
 * 1. **Performance-Critical Layout**: FlexWrapper is a low-level layout primitive
 *    used for performance-sensitive rendering scenarios where UI component
 *    overhead would be noticeable.
 * 
 * 2. **Inline Style Requirements**: This component uses inline styles for all
 *    flexbox properties (direction, justify, align, wrap, gap) to support
 *    dynamic prop changes without className recalculation.
 * 
 * 3. **Primitive System Integration**: As part of the primitive rendering system,
 *    this wrapper needs to be as lightweight as possible to maintain the
 *    sub-16ms render budget for medium complexity trees.
 * 
 * ### When to Use UI Components Instead:
 * - For application-level layouts, prefer the Flex component from packages/ui
 * - For layouts that don't require dynamic style changes
 * 
 * @param {import('./types.js').FlexWrapperProps} props
 * @returns {React.ReactElement}
 * @see Requirements 7.3 (UI Component Exception Documentation)
 */
export function FlexWrapper({
  justify = 'flex-start',
  align = 'stretch',
  wrap = 'nowrap',
  direction = 'row',
  gap,
  className = '',
  children,
  ...props
}) {
  const style = {
    display: 'flex',
    flexDirection: direction,
    justifyContent: justify,
    alignItems: align,
    flexWrap: wrap,
    gap: typeof gap === 'number' ? `${gap}px` : gap,
  };

  return (
    <div className={className} style={style} {...props}>
      {children}
    </div>
  );
}

FlexWrapper.displayName = 'Flex';


/**
 * Grid wrapper component for CSS grid layout.
 * 
 * ## UI Component Exception Documentation
 * 
 * **EXCEPTION: This component uses a plain `<div>` element instead of UI components.**
 * 
 * ### Justification:
 * 
 * 1. **Performance-Critical Layout**: GridWrapper is a low-level layout primitive
 *    used for complex grid layouts where UI component overhead would impact
 *    rendering performance.
 * 
 * 2. **Dynamic Grid Configuration**: This component supports dynamic grid
 *    template configurations (columns, rows) that are computed at runtime.
 *    Using inline styles avoids the overhead of className generation.
 * 
 * 3. **Primitive System Integration**: As part of the primitive rendering system,
 *    this wrapper maintains compatibility with the performance budgets defined
 *    for the rendering pipeline.
 * 
 * ### When to Use UI Components Instead:
 * - For application-level layouts, prefer the Grid component from packages/ui
 * - For static grid layouts with predefined column/row configurations
 * 
 * @param {import('./types.js').GridWrapperProps} props
 * @returns {React.ReactElement}
 * @see Requirements 7.3 (UI Component Exception Documentation)
 */
export function GridWrapper({
  columns = 1,
  rows,
  gap,
  className = '',
  children,
  ...props
}) {
  const style = {
    display: 'grid',
    gridTemplateColumns:
      typeof columns === 'number' ? `repeat(${columns}, 1fr)` : columns,
    gridTemplateRows:
      rows !== undefined
        ? typeof rows === 'number'
          ? `repeat(${rows}, 1fr)`
          : rows
        : undefined,
    gap: typeof gap === 'number' ? `${gap}px` : gap,
  };

  return (
    <div className={className} style={style} {...props}>
      {children}
    </div>
  );
}

GridWrapper.displayName = 'Grid';

/**
 * Text wrapper component for typography
 * Uses Text component for paragraph/span content and Heading component for h1-h6
 * @param {import('./types.js').TextWrapperProps} props
 * @returns {React.ReactElement}
 */
export function TextWrapper({
  content,
  variant = 'p',
  size = 'base',
  weight = 'normal',
  className = '',
  children,
  ...props
}) {
  // Check if variant is a heading element
  const isHeading = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(variant);

  if (isHeading) {
    return (
      <Heading
        as={variant}
        size={size}
        weight={weight}
        className={className}
        {...props}
      >
        {content || children}
      </Heading>
    );
  }

  // Map variant to Text's as prop (p, span, div, label)
  const textAs = ['p', 'span', 'div', 'label'].includes(variant) ? variant : 'p';

  return (
    <Text
      as={textAs}
      size={size}
      weight={weight}
      className={className}
      {...props}
    >
      {content || children}
    </Text>
  );
}

TextWrapper.displayName = 'Text';

/**
 * Select wrapper component that composes Select components
 * @param {import('./types.js').SelectWrapperProps} props
 * @returns {React.ReactElement}
 */
export function SelectWrapper({
  options = [],
  value,
  placeholder = 'Select...',
  onValueChange,
  disabled,
  className = '',
  ...props
}) {
  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      {...props}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

SelectWrapper.displayName = 'Select';

/**
 * Tooltip wrapper component that composes Tooltip components
 * @param {import('./types.js').TooltipWrapperProps} props
 * @returns {React.ReactElement}
 */
export function TooltipWrapper({
  content,
  side = 'top',
  delayDuration = 200,
  children,
  ...props
}) {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip {...props}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side}>{content}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

TooltipWrapper.displayName = 'Tooltip';

/**
 * Dialog wrapper component that composes Dialog components
 * @param {import('./types.js').DialogWrapperProps} props
 * @returns {React.ReactElement}
 */
export function DialogWrapper({
  title,
  description,
  open,
  onOpenChange,
  trigger,
  children,
  ...props
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} {...props}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
}

DialogWrapper.displayName = 'Dialog';

/**
 * List wrapper component for rendering lists
 * Uses ScrollArea for scrollable content when scrollable prop is true
 * @param {Object} props
 * @param {Array<any>} [props.items=[]] - List items
 * @param {(item: any, index: number) => React.ReactNode} [props.renderItem] - Item renderer
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.scrollable=false] - Whether to wrap in ScrollArea
 * @param {string} [props.maxHeight] - Max height for scrollable area (e.g., '300px')
 * @param {React.ReactNode} [props.children] - Child elements
 * @returns {React.ReactElement}
 */
export function ListWrapper({
  items = [],
  renderItem,
  className = '',
  scrollable = false,
  maxHeight,
  children,
  ...props
}) {
  const listContent = (
    <ul className={scrollable ? '' : className} {...(scrollable ? {} : props)}>
      {items.length > 0
        ? items.map((item, index) => (
            <li key={item.id || index}>
              {renderItem ? renderItem(item, index) : item}
            </li>
          ))
        : children}
    </ul>
  );

  if (scrollable) {
    return (
      <ScrollArea
        className={className}
        style={maxHeight ? { maxHeight } : undefined}
        {...props}
      >
        {listContent}
      </ScrollArea>
    );
  }

  return listContent;
}

ListWrapper.displayName = 'List';

/**
 * Form wrapper component with UI styling integration
 * Applies consistent form styling classes from the design system
 * @param {Object} props
 * @param {(e: React.FormEvent) => void} [props.onSubmit] - Submit handler
 * @param {string} [props.className] - Additional CSS classes
 * @param {'default' | 'inline' | 'stacked'} [props.layout='default'] - Form layout variant
 * @param {'sm' | 'md' | 'lg'} [props.spacing='md'] - Spacing between form elements
 * @param {React.ReactNode} [props.children] - Child elements
 * @returns {React.ReactElement}
 */
export function FormWrapper({
  onSubmit,
  className = '',
  layout = 'default',
  spacing = 'md',
  children,
  ...props
}) {
  /**
   * @param {React.FormEvent} e
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(e);
  };

  // UI styling classes for form layouts
  const layoutClasses = {
    default: 'flex flex-col',
    inline: 'flex flex-row flex-wrap items-end',
    stacked: 'flex flex-col',
  };

  // Spacing classes for form elements
  const spacingClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  };

  const combinedClassName = [
    layoutClasses[layout] || layoutClasses.default,
    spacingClasses[spacing] || spacingClasses.md,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <form className={combinedClassName} onSubmit={handleSubmit} {...props}>
      {children}
    </form>
  );
}

FormWrapper.displayName = 'Form';
