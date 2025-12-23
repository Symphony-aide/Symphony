/**
 * @vitest-environment jsdom
 * **Feature: component-packages-migration, Property 1: No Pure HTML Elements**
 * 
 * Property tests for CommandPalette component to verify it uses only UI components.
 * **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock UI components before importing the components under test
vi.mock('ui', () => ({
  CommandDialog: ({ children, open }) => (
    open ? <div data-testid="command-dialog">{children}</div> : null
  ),
  Command: ({ children, className }) => (
    <div data-testid="command" className={className}>{children}</div>
  ),
  CommandInput: ({ placeholder, value, onValueChange, className }) => (
    <input 
      data-testid="command-input" 
      placeholder={placeholder} 
      value={value || ''} 
      onChange={(e) => onValueChange?.(e.target.value)}
      className={className}
    />
  ),
  CommandList: ({ children, className }) => (
    <div data-testid="command-list" className={className}>{children}</div>
  ),
  CommandEmpty: ({ children, className }) => (
    <div data-testid="command-empty" className={className}>{children}</div>
  ),
  CommandGroup: ({ children, heading, className }) => (
    <div data-testid="command-group" data-heading={heading} className={className}>{children}</div>
  ),
  CommandItem: ({ children, value, onSelect, className }) => (
    <div 
      data-testid="command-item" 
      data-value={value} 
      onClick={onSelect}
      className={className}
    >
      {children}
    </div>
  ),
  CommandSeparator: ({ className }) => (
    <hr data-testid="command-separator" className={className} />
  ),
  CommandShortcut: ({ children, className }) => (
    <span data-testid="command-shortcut" className={className}>{children}</span>
  ),
  Flex: ({ children, className, align, justify, direction, gap, ...props }) => (
    <div 
      data-testid="flex" 
      className={`flex ${className || ''}`}
      data-align={align}
      data-justify={justify}
      data-direction={direction}
      data-gap={gap}
      {...props}
    >
      {children}
    </div>
  ),
  Box: ({ children, className, as: Component = 'div', ...props }) => (
    <Component data-testid="box" className={className} {...props}>{children}</Component>
  ),
  Text: ({ children, className, size, ...props }) => (
    <span data-testid="text" className={className} data-size={size} {...props}>{children}</span>
  ),
  Code: ({ children, className, ...props }) => (
    <code data-testid="code" className={className} {...props}>{children}</code>
  ),
  Input: ({ className, ...props }) => (
    <input data-testid="input" className={className} {...props} />
  ),
}));

// Import components after mocking
import CommandPalette from '../src/CommandPalette.jsx';
import CommandSearch from '../src/CommandSearch.jsx';

describe('CommandPalette - Property 1: No Pure HTML Elements', () => {
  const defaultProps = {
    isOpen: true,
    onOpenChange: vi.fn(),
    commands: [
      { id: '1', label: 'Open File', shortcut: '⌘O', category: 'File', description: 'Open a file' },
      { id: '2', label: 'Save File', shortcut: '⌘S', category: 'File' },
      { id: '3', label: 'Find', shortcut: '⌘F', category: 'Edit' },
    ],
    placeholder: 'Search commands...',
    emptyMessage: 'No commands found.',
    onCommandSelect: vi.fn(),
  };

  it('should use Command components from UI package', () => {
    const { getByTestId } = render(<CommandPalette {...defaultProps} />);

    // Should use CommandDialog
    expect(getByTestId('command-dialog')).toBeTruthy();
    
    // Should use Command
    expect(getByTestId('command')).toBeTruthy();
    
    // Should use CommandInput
    expect(getByTestId('command-input')).toBeTruthy();
    
    // Should use CommandList
    expect(getByTestId('command-list')).toBeTruthy();
  });

  it('should use Box component for command item content container', () => {
    const { getAllByTestId } = render(<CommandPalette {...defaultProps} />);

    // Should use Box for command item content
    const boxes = getAllByTestId('box');
    expect(boxes.length).toBeGreaterThan(0);
  });

  it('should use Flex component for layout within command items', () => {
    const { getAllByTestId } = render(<CommandPalette {...defaultProps} />);

    // Should use Flex for layout
    const flexElements = getAllByTestId('flex');
    expect(flexElements.length).toBeGreaterThan(0);
  });

  it('should use Text component for command labels', () => {
    const { getAllByTestId } = render(<CommandPalette {...defaultProps} />);

    // Should use Text for labels
    const textElements = getAllByTestId('text');
    expect(textElements.length).toBeGreaterThan(0);
  });

  it('should use Code component for keyboard shortcuts', () => {
    const { getAllByTestId } = render(<CommandPalette {...defaultProps} />);

    // Should use Code for shortcuts
    const codeElements = getAllByTestId('code');
    expect(codeElements.length).toBeGreaterThan(0);
  });

  it('should not render when isOpen is false', () => {
    const { queryByTestId } = render(
      <CommandPalette {...defaultProps} isOpen={false} />
    );

    expect(queryByTestId('command-dialog')).toBeFalsy();
  });
});

describe('CommandPalette - Property 2: Layout Components Usage', () => {
  const defaultProps = {
    isOpen: true,
    onOpenChange: vi.fn(),
    commands: [
      { id: '1', label: 'Test Command', shortcut: '⌘T', description: 'A test command' },
    ],
    onCommandSelect: vi.fn(),
  };

  it('should use Flex with align and justify props for command item layout', () => {
    const { getAllByTestId } = render(<CommandPalette {...defaultProps} />);

    const flexElements = getAllByTestId('flex');
    const flexWithAlign = flexElements.find(el => el.getAttribute('data-align') === 'center');
    const flexWithJustify = flexElements.find(el => el.getAttribute('data-justify') === 'between');
    
    expect(flexWithAlign).toBeTruthy();
    expect(flexWithJustify).toBeTruthy();
  });
});

describe('CommandPalette - Property 3: Typography Components Usage', () => {
  const defaultProps = {
    isOpen: true,
    onOpenChange: vi.fn(),
    commands: [
      { id: '1', label: 'Test Command', description: 'A test description' },
    ],
    onCommandSelect: vi.fn(),
  };

  it('should use Text component for command labels and descriptions', () => {
    const { getAllByTestId } = render(<CommandPalette {...defaultProps} />);

    const textElements = getAllByTestId('text');
    // Should have at least 2 Text elements (label + description)
    expect(textElements.length).toBeGreaterThanOrEqual(2);
  });

  it('should use Text with size prop for descriptions', () => {
    const { getAllByTestId } = render(<CommandPalette {...defaultProps} />);

    const textElements = getAllByTestId('text');
    const textWithSize = textElements.find(el => el.getAttribute('data-size') === 'xs');
    expect(textWithSize).toBeTruthy();
  });
});

describe('CommandPalette - Property 5: Component Functionality Preservation', () => {
  it('should call onCommandSelect when a command is selected', () => {
    const onCommandSelect = vi.fn();
    const onOpenChange = vi.fn();
    
    const { getAllByTestId } = render(
      <CommandPalette 
        isOpen={true}
        onOpenChange={onOpenChange}
        commands={[{ id: '1', label: 'Test', category: 'General' }]}
        onCommandSelect={onCommandSelect}
      />
    );

    const commandItems = getAllByTestId('command-item');
    fireEvent.click(commandItems[0]);

    expect(onCommandSelect).toHaveBeenCalledWith({ id: '1', label: 'Test', category: 'General' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should group commands by category', () => {
    const { getAllByTestId } = render(
      <CommandPalette 
        isOpen={true}
        onOpenChange={vi.fn()}
        commands={[
          { id: '1', label: 'Open', category: 'File' },
          { id: '2', label: 'Save', category: 'File' },
          { id: '3', label: 'Find', category: 'Edit' },
        ]}
        onCommandSelect={vi.fn()}
      />
    );

    const groups = getAllByTestId('command-group');
    expect(groups.length).toBe(2); // File and Edit groups
    
    const fileGroup = groups.find(g => g.getAttribute('data-heading') === 'File');
    const editGroup = groups.find(g => g.getAttribute('data-heading') === 'Edit');
    
    expect(fileGroup).toBeTruthy();
    expect(editGroup).toBeTruthy();
  });

  it('should display command shortcuts when provided', () => {
    const { getAllByTestId } = render(
      <CommandPalette 
        isOpen={true}
        onOpenChange={vi.fn()}
        commands={[
          { id: '1', label: 'Open', shortcut: '⌘O', category: 'File' },
        ]}
        onCommandSelect={vi.fn()}
      />
    );

    const codeElements = getAllByTestId('code');
    expect(codeElements.length).toBeGreaterThan(0);
    expect(codeElements[0].textContent).toBe('⌘O');
  });

  it('should display command descriptions when provided', () => {
    const { getAllByTestId } = render(
      <CommandPalette 
        isOpen={true}
        onOpenChange={vi.fn()}
        commands={[
          { id: '1', label: 'Open', description: 'Open a file', category: 'File' },
        ]}
        onCommandSelect={vi.fn()}
      />
    );

    const textElements = getAllByTestId('text');
    const descriptionText = textElements.find(el => el.textContent === 'Open a file');
    expect(descriptionText).toBeTruthy();
  });
});

describe('CommandSearch - Property 1: No Pure HTML Elements', () => {
  const defaultProps = {
    onFocus: vi.fn(),
    placeholder: 'Search...',
  };

  it('should use Box component for the container', () => {
    const { getByTestId } = render(<CommandSearch {...defaultProps} />);

    expect(getByTestId('box')).toBeTruthy();
  });

  it('should use Input component from UI package', () => {
    const { getByTestId } = render(<CommandSearch {...defaultProps} />);

    expect(getByTestId('input')).toBeTruthy();
  });

  it('should call onFocus when input is focused', () => {
    const onFocus = vi.fn();
    const { getByTestId } = render(<CommandSearch {...defaultProps} onFocus={onFocus} />);

    const input = getByTestId('input');
    fireEvent.focus(input);

    expect(onFocus).toHaveBeenCalled();
  });

  it('should apply custom className', () => {
    const { getByTestId } = render(
      <CommandSearch {...defaultProps} className="custom-class" />
    );

    const box = getByTestId('box');
    expect(box.className).toContain('custom-class');
  });
});
