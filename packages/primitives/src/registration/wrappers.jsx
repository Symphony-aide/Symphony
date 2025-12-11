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
} from 'ui';

/**
 * Container wrapper component for flex layout
 * @param {import('./types.js').ContainerWrapperProps} props
 * @returns {React.ReactElement}
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
 * Flex wrapper component for flexbox layout
 * @param {import('./types.js').FlexWrapperProps} props
 * @returns {React.ReactElement}
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
 * Grid wrapper component for CSS grid layout
 * @param {import('./types.js').GridWrapperProps} props
 * @returns {React.ReactElement}
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
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
  };

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };

  const combinedClassName = [
    sizeClasses[size] || 'text-base',
    weightClasses[weight] || 'font-normal',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const Element = variant;

  return (
    <Element className={combinedClassName} {...props}>
      {content || children}
    </Element>
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
 * @param {Object} props
 * @param {Array<any>} [props.items=[]] - List items
 * @param {(item: any, index: number) => React.ReactNode} [props.renderItem] - Item renderer
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} [props.children] - Child elements
 * @returns {React.ReactElement}
 */
export function ListWrapper({
  items = [],
  renderItem,
  className = '',
  children,
  ...props
}) {
  return (
    <ul className={className} {...props}>
      {items.length > 0
        ? items.map((item, index) => (
            <li key={item.id || index}>
              {renderItem ? renderItem(item, index) : item}
            </li>
          ))
        : children}
    </ul>
  );
}

ListWrapper.displayName = 'List';

/**
 * Form wrapper component
 * @param {Object} props
 * @param {(e: React.FormEvent) => void} [props.onSubmit] - Submit handler
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} [props.children] - Child elements
 * @returns {React.ReactElement}
 */
export function FormWrapper({ onSubmit, className = '', children, ...props }) {
  /**
   * @param {React.FormEvent} e
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(e);
  };

  return (
    <form className={className} onSubmit={handleSubmit} {...props}>
      {children}
    </form>
  );
}

FormWrapper.displayName = 'Form';
