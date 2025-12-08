/**
 * @fileoverview Snapshot tests for PrimitiveRenderer component
 *
 * These tests capture and compare rendered output of primitives to detect
 * unintended changes to component rendering and maintain UI consistency.
 *
 * @see Requirements 1.1, 1.2, 1.3, 1.4, 1.6
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { BasePrimitive } from '../../src/core/BasePrimitive.js';
import {
  registerComponent,
  unregisterComponent,
  PrimitiveRenderer,
} from '../../src/renderers/PrimitiveRenderer.jsx';
import { ErrorBoundary } from '../../src/renderers/ErrorBoundary.jsx';
import {
  renderPrimitiveToSnapshot,
  createTestPrimitive,
  createLeafPrimitive,
  registerAllMockComponents,
  unregisterAllMockComponents,
  serializeSnapshot,
} from '../utils/snapshotHelpers.js';

// Import primitive factory functions
import { Container, Flex, Grid, Panel, Divider } from '../../src/primitives/layout.js';
import { Button, Input, Icon, Text, Checkbox, Select } from '../../src/primitives/interactive.js';
import { List, Tabs, Dropdown, Modal, Tooltip } from '../../src/primitives/complex.js';

// ============================================
// Test Setup
// ============================================

describe('PrimitiveRenderer Snapshot Tests', () => {
  beforeEach(() => {
    // Register all mock components for testing
    registerAllMockComponents(registerComponent);
  });

  afterEach(() => {
    // Clean up registered components
    unregisterAllMockComponents(unregisterComponent);
  });

  // ============================================
  // Requirement 1.1: Layout Primitives Snapshot Tests
  // ============================================

  describe('Layout Primitives (Requirement 1.1)', () => {
    it('should capture Container primitive snapshot', () => {
      const container = Container({ direction: 'row', gap: 8, className: 'test-container' });
      const snapshot = renderPrimitiveToSnapshot(container);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture Container with default props snapshot', () => {
      const container = Container();
      const snapshot = renderPrimitiveToSnapshot(container);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture Flex primitive snapshot', () => {
      const flex = Flex({ justify: 'center', align: 'center', wrap: true, className: 'test-flex' });
      const snapshot = renderPrimitiveToSnapshot(flex);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture Flex with default props snapshot', () => {
      const flex = Flex();
      const snapshot = renderPrimitiveToSnapshot(flex);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture Grid primitive snapshot', () => {
      const grid = Grid({ columns: 3, gap: 16, className: 'test-grid' });
      const snapshot = renderPrimitiveToSnapshot(grid);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture Grid with rows snapshot', () => {
      const grid = Grid({ columns: 2, rows: 4, gap: 8 });
      const snapshot = renderPrimitiveToSnapshot(grid);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture Panel primitive snapshot', () => {
      const panel = Panel({ title: 'Settings', collapsible: true, defaultCollapsed: false });
      const snapshot = renderPrimitiveToSnapshot(panel);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture Panel collapsed snapshot', () => {
      const panel = Panel({ title: 'Collapsed Panel', collapsible: true, defaultCollapsed: true });
      const snapshot = renderPrimitiveToSnapshot(panel);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture Divider primitive snapshot', () => {
      const divider = Divider({ orientation: 'horizontal', className: 'test-divider' });
      const snapshot = renderPrimitiveToSnapshot(divider);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture vertical Divider snapshot', () => {
      const divider = Divider({ orientation: 'vertical' });
      const snapshot = renderPrimitiveToSnapshot(divider);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should render Container primitive to DOM', () => {
      const container = Container({ direction: 'row', gap: 8 });
      const { container: domContainer } = render(<PrimitiveRenderer primitive={container} />);
      
      expect(domContainer.firstChild).toMatchSnapshot();
    });

    it('should render Flex primitive to DOM', () => {
      const flex = Flex({ justify: 'space-between', align: 'center' });
      const { container: domContainer } = render(<PrimitiveRenderer primitive={flex} />);
      
      expect(domContainer.firstChild).toMatchSnapshot();
    });

    it('should render Grid primitive to DOM', () => {
      const grid = Grid({ columns: 4, gap: 12 });
      const { container: domContainer } = render(<PrimitiveRenderer primitive={grid} />);
      
      expect(domContainer.firstChild).toMatchSnapshot();
    });

    it('should render Panel primitive to DOM', () => {
      const panel = Panel({ title: 'Test Panel' });
      const { container: domContainer } = render(<PrimitiveRenderer primitive={panel} />);
      
      expect(domContainer.firstChild).toMatchSnapshot();
    });

    it('should render Divider primitive to DOM', () => {
      const divider = Divider({ orientation: 'horizontal' });
      const { container: domContainer } = render(<PrimitiveRenderer primitive={divider} />);
      
      expect(domContainer.firstChild).toMatchSnapshot();
    });
  });


  // ============================================
  // Requirement 1.2: Interactive Primitives Snapshot Tests
  // ============================================

  describe('Interactive Primitives (Requirement 1.2)', () => {
    it('should capture Button primitive snapshot', () => {
      const button = Button({ variant: 'primary', size: 'lg', onClick: 'click_handler' });
      const snapshot = renderPrimitiveToSnapshot(button);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture Button with default props snapshot', () => {
      const button = Button();
      const snapshot = renderPrimitiveToSnapshot(button);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture disabled Button snapshot', () => {
      const button = Button({ variant: 'destructive', disabled: true });
      const snapshot = renderPrimitiveToSnapshot(button);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture Input primitive snapshot', () => {
      const input = Input({ type: 'email', placeholder: 'Enter email', onChange: 'email_handler' });
      const snapshot = renderPrimitiveToSnapshot(input);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture Input with value snapshot', () => {
      const input = Input({ type: 'text', value: 'test value', disabled: false });
      const snapshot = renderPrimitiveToSnapshot(input);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture disabled Input snapshot', () => {
      const input = Input({ type: 'password', disabled: true });
      const snapshot = renderPrimitiveToSnapshot(input);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture Icon primitive snapshot', () => {
      const icon = Icon({ name: 'file', size: 16, color: '#333' });
      const snapshot = renderPrimitiveToSnapshot(icon);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture Icon with default size snapshot', () => {
      const icon = Icon({ name: 'folder' });
      const snapshot = renderPrimitiveToSnapshot(icon);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture Text primitive snapshot', () => {
      const text = Text({ content: 'Hello World', variant: 'heading', size: 'lg', weight: 'bold' });
      const snapshot = renderPrimitiveToSnapshot(text);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture Text with default props snapshot', () => {
      const text = Text({ content: 'Default text' });
      const snapshot = renderPrimitiveToSnapshot(text);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture Checkbox primitive snapshot', () => {
      const checkbox = Checkbox({ checked: true, label: 'Accept terms', onChange: 'terms_handler' });
      const snapshot = renderPrimitiveToSnapshot(checkbox);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture unchecked Checkbox snapshot', () => {
      const checkbox = Checkbox({ checked: false, label: 'Subscribe' });
      const snapshot = renderPrimitiveToSnapshot(checkbox);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture disabled Checkbox snapshot', () => {
      const checkbox = Checkbox({ checked: true, disabled: true });
      const snapshot = renderPrimitiveToSnapshot(checkbox);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture Select primitive snapshot', () => {
      const select = Select({
        options: [
          { value: 'a', label: 'Option A' },
          { value: 'b', label: 'Option B' },
        ],
        value: 'a',
        onChange: 'select_handler',
      });
      const snapshot = renderPrimitiveToSnapshot(select);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture Select with placeholder snapshot', () => {
      const select = Select({
        options: [{ value: '1', label: 'First' }],
        placeholder: 'Select an option',
      });
      const snapshot = renderPrimitiveToSnapshot(select);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture disabled Select snapshot', () => {
      const select = Select({ options: [], disabled: true });
      const snapshot = renderPrimitiveToSnapshot(select);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should render Button primitive to DOM', () => {
      const button = Button({ variant: 'outline', size: 'sm' });
      const { container: domContainer } = render(<PrimitiveRenderer primitive={button} />);
      
      expect(domContainer.firstChild).toMatchSnapshot();
    });

    it('should render Input primitive to DOM', () => {
      const input = Input({ type: 'text', placeholder: 'Type here' });
      const { container: domContainer } = render(<PrimitiveRenderer primitive={input} />);
      
      expect(domContainer.firstChild).toMatchSnapshot();
    });

    it('should render Icon primitive to DOM', () => {
      const icon = Icon({ name: 'star', size: 20 });
      const { container: domContainer } = render(<PrimitiveRenderer primitive={icon} />);
      
      expect(domContainer.firstChild).toMatchSnapshot();
    });

    it('should render Text primitive to DOM', () => {
      const text = Text({ content: 'Rendered text', variant: 'body' });
      const { container: domContainer } = render(<PrimitiveRenderer primitive={text} />);
      
      expect(domContainer.firstChild).toMatchSnapshot();
    });

    it('should render Checkbox primitive to DOM', () => {
      const checkbox = Checkbox({ checked: false, label: 'Test checkbox' });
      const { container: domContainer } = render(<PrimitiveRenderer primitive={checkbox} />);
      
      expect(domContainer.firstChild).toMatchSnapshot();
    });

    it('should render Select primitive to DOM', () => {
      const select = Select({
        options: [{ value: 'x', label: 'X' }],
        value: 'x',
      });
      const { container: domContainer } = render(<PrimitiveRenderer primitive={select} />);
      
      expect(domContainer.firstChild).toMatchSnapshot();
    });
  });


  // ============================================
  // Requirement 1.3: Complex Primitives Snapshot Tests
  // ============================================

  describe('Complex Primitives (Requirement 1.3)', () => {
    it('should capture List primitive snapshot', () => {
      const list = List({
        items: [
          { id: '1', data: 'Item 1' },
          { id: '2', data: 'Item 2' },
          { id: '3', data: 'Item 3' },
        ],
        renderItem: 'render_list_item_handler',
        virtualized: false,
      });
      const snapshot = renderPrimitiveToSnapshot(list);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture virtualized List snapshot', () => {
      const list = List({
        items: [{ id: 'a', data: 'A' }],
        virtualized: true,
      });
      const snapshot = renderPrimitiveToSnapshot(list);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture empty List snapshot', () => {
      const list = List({ items: [] });
      const snapshot = renderPrimitiveToSnapshot(list);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture Tabs primitive snapshot', () => {
      const tabs = Tabs({
        tabs: [
          { id: 'tab1', label: 'First Tab', icon: 'file' },
          { id: 'tab2', label: 'Second Tab' },
          { id: 'tab3', label: 'Third Tab', icon: 'settings' },
        ],
        activeTab: 'tab1',
        onTabChange: 'tab_change_handler',
      });
      const snapshot = renderPrimitiveToSnapshot(tabs);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture Tabs with different active tab snapshot', () => {
      const tabs = Tabs({
        tabs: [
          { id: 't1', label: 'Tab 1' },
          { id: 't2', label: 'Tab 2' },
        ],
        activeTab: 't2',
      });
      const snapshot = renderPrimitiveToSnapshot(tabs);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture empty Tabs snapshot', () => {
      const tabs = Tabs({ tabs: [] });
      const snapshot = renderPrimitiveToSnapshot(tabs);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture Dropdown primitive snapshot', () => {
      const dropdown = Dropdown({
        trigger: Button({ variant: 'outline' }),
        items: [
          { id: 'edit', label: 'Edit', icon: 'pencil', onClick: 'edit_handler' },
          { id: 'delete', label: 'Delete', icon: 'trash', onClick: 'delete_handler' },
        ],
      });
      const snapshot = renderPrimitiveToSnapshot(dropdown);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture Dropdown with single item snapshot', () => {
      const dropdown = Dropdown({
        items: [{ id: 'action', label: 'Action' }],
      });
      const snapshot = renderPrimitiveToSnapshot(dropdown);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture empty Dropdown snapshot', () => {
      const dropdown = Dropdown({ items: [] });
      const snapshot = renderPrimitiveToSnapshot(dropdown);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture Modal primitive snapshot', () => {
      const modal = Modal({
        title: 'Confirm Action',
        open: true,
        onClose: 'close_modal_handler',
        size: 'lg',
      });
      const snapshot = renderPrimitiveToSnapshot(modal);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture closed Modal snapshot', () => {
      const modal = Modal({
        title: 'Closed Modal',
        open: false,
        size: 'md',
      });
      const snapshot = renderPrimitiveToSnapshot(modal);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture small Modal snapshot', () => {
      const modal = Modal({
        title: 'Small Modal',
        open: true,
        size: 'sm',
      });
      const snapshot = renderPrimitiveToSnapshot(modal);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture Tooltip primitive snapshot', () => {
      const tooltip = Tooltip({
        content: 'Click to save',
        position: 'bottom',
      });
      const snapshot = renderPrimitiveToSnapshot(tooltip);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture Tooltip with different positions snapshot', () => {
      const tooltipTop = Tooltip({ content: 'Top tooltip', position: 'top' });
      const tooltipLeft = Tooltip({ content: 'Left tooltip', position: 'left' });
      const tooltipRight = Tooltip({ content: 'Right tooltip', position: 'right' });
      
      expect(renderPrimitiveToSnapshot(tooltipTop)).toMatchSnapshot();
      expect(renderPrimitiveToSnapshot(tooltipLeft)).toMatchSnapshot();
      expect(renderPrimitiveToSnapshot(tooltipRight)).toMatchSnapshot();
    });

    it('should render List primitive to DOM', () => {
      const list = List({
        items: [{ id: '1', data: 'Test' }],
      });
      const { container: domContainer } = render(<PrimitiveRenderer primitive={list} />);
      
      expect(domContainer.firstChild).toMatchSnapshot();
    });

    it('should render Tabs primitive to DOM', () => {
      const tabs = Tabs({
        tabs: [{ id: 'tab', label: 'Tab' }],
        activeTab: 'tab',
      });
      const { container: domContainer } = render(<PrimitiveRenderer primitive={tabs} />);
      
      expect(domContainer.firstChild).toMatchSnapshot();
    });

    it('should render Dropdown primitive to DOM', () => {
      const dropdown = Dropdown({
        items: [{ id: 'item', label: 'Item' }],
      });
      const { container: domContainer } = render(<PrimitiveRenderer primitive={dropdown} />);
      
      expect(domContainer.firstChild).toMatchSnapshot();
    });

    it('should render Modal primitive to DOM', () => {
      const modal = Modal({
        title: 'Test Modal',
        open: true,
      });
      const { container: domContainer } = render(<PrimitiveRenderer primitive={modal} />);
      
      expect(domContainer.firstChild).toMatchSnapshot();
    });

    it('should render Tooltip primitive to DOM', () => {
      const tooltip = Tooltip({
        content: 'Test tooltip',
        position: 'top',
      });
      const { container: domContainer } = render(<PrimitiveRenderer primitive={tooltip} />);
      
      expect(domContainer.firstChild).toMatchSnapshot();
    });
  });


  // ============================================
  // Requirement 1.4: Nested Primitive Trees Snapshot Tests
  // ============================================

  describe('Nested Primitive Trees (Requirement 1.4)', () => {
    it('should capture 2-level nested tree snapshot', () => {
      const container = Container({ direction: 'column', gap: 8 });
      const flex = Flex({ justify: 'space-between' });
      const button1 = Button({ variant: 'primary' });
      const button2 = Button({ variant: 'secondary' });
      
      flex.appendChild(button1);
      flex.appendChild(button2);
      container.appendChild(flex);
      
      const snapshot = renderPrimitiveToSnapshot(container);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture 3-level nested tree snapshot', () => {
      const panel = Panel({ title: 'Main Panel', collapsible: true });
      const container = Container({ direction: 'row', gap: 16 });
      const flex1 = Flex({ justify: 'start', align: 'center' });
      const flex2 = Flex({ justify: 'end', align: 'center' });
      const icon = Icon({ name: 'file', size: 16 });
      const text = Text({ content: 'File name', variant: 'body' });
      const button = Button({ variant: 'ghost', size: 'sm' });
      
      flex1.appendChild(icon);
      flex1.appendChild(text);
      flex2.appendChild(button);
      container.appendChild(flex1);
      container.appendChild(flex2);
      panel.appendChild(container);
      
      const snapshot = renderPrimitiveToSnapshot(panel);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture complex nested structure with mixed primitives', () => {
      const modal = Modal({ title: 'Settings', open: true, size: 'lg' });
      const container = Container({ direction: 'column', gap: 16 });
      
      // Form section
      const formFlex = Flex({ direction: 'column', gap: 8 });
      const input1 = Input({ type: 'text', placeholder: 'Username' });
      const input2 = Input({ type: 'email', placeholder: 'Email' });
      formFlex.appendChild(input1);
      formFlex.appendChild(input2);
      
      // Checkbox section
      const checkboxFlex = Flex({ direction: 'column', gap: 4 });
      const checkbox1 = Checkbox({ label: 'Option 1', checked: true });
      const checkbox2 = Checkbox({ label: 'Option 2', checked: false });
      checkboxFlex.appendChild(checkbox1);
      checkboxFlex.appendChild(checkbox2);
      
      // Button section
      const buttonFlex = Flex({ justify: 'end', gap: 8 });
      const cancelBtn = Button({ variant: 'outline' });
      const saveBtn = Button({ variant: 'primary' });
      buttonFlex.appendChild(cancelBtn);
      buttonFlex.appendChild(saveBtn);
      
      container.appendChild(formFlex);
      container.appendChild(checkboxFlex);
      container.appendChild(buttonFlex);
      modal.appendChild(container);
      
      const snapshot = renderPrimitiveToSnapshot(modal);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture grid with nested items snapshot', () => {
      const grid = Grid({ columns: 2, gap: 12 });
      
      for (let i = 0; i < 4; i++) {
        const panel = Panel({ title: `Panel ${i + 1}` });
        const text = Text({ content: `Content ${i + 1}` });
        panel.appendChild(text);
        grid.appendChild(panel);
      }
      
      const snapshot = renderPrimitiveToSnapshot(grid);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture tabs with nested content snapshot', () => {
      const tabs = Tabs({
        tabs: [
          { id: 'general', label: 'General' },
          { id: 'advanced', label: 'Advanced' },
        ],
        activeTab: 'general',
      });
      
      const generalContent = Container({ direction: 'column' });
      const advancedContent = Container({ direction: 'column' });
      
      generalContent.appendChild(Text({ content: 'General settings' }));
      generalContent.appendChild(Input({ placeholder: 'Name' }));
      
      advancedContent.appendChild(Text({ content: 'Advanced settings' }));
      advancedContent.appendChild(Checkbox({ label: 'Enable feature' }));
      
      tabs.appendChild(generalContent);
      tabs.appendChild(advancedContent);
      
      const snapshot = renderPrimitiveToSnapshot(tabs);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should render 2-level nested tree to DOM', () => {
      const container = Container({ direction: 'row' });
      const button = Button({ variant: 'primary' });
      const text = Text({ content: 'Click me' });
      
      container.appendChild(button);
      container.appendChild(text);
      
      const { container: domContainer } = render(<PrimitiveRenderer primitive={container} />);
      
      expect(domContainer.firstChild).toMatchSnapshot();
    });

    it('should render 3-level nested tree to DOM', () => {
      const panel = Panel({ title: 'Nested Panel' });
      const flex = Flex({ justify: 'center' });
      const icon = Icon({ name: 'star' });
      
      flex.appendChild(icon);
      panel.appendChild(flex);
      
      const { container: domContainer } = render(<PrimitiveRenderer primitive={panel} />);
      
      expect(domContainer.firstChild).toMatchSnapshot();
    });

    it('should verify complete tree structure is captured', () => {
      const root = Container({ direction: 'column', className: 'root' });
      const level1a = Flex({ justify: 'start', className: 'level1a' });
      const level1b = Flex({ justify: 'end', className: 'level1b' });
      const level2a = Button({ variant: 'primary', className: 'level2a' });
      const level2b = Text({ content: 'Text', className: 'level2b' });
      const level2c = Icon({ name: 'check', className: 'level2c' });
      
      level1a.appendChild(level2a);
      level1a.appendChild(level2b);
      level1b.appendChild(level2c);
      root.appendChild(level1a);
      root.appendChild(level1b);
      
      const snapshot = renderPrimitiveToSnapshot(root);
      
      // Verify structure
      expect(snapshot.type).toBe('Container');
      expect(snapshot.children).toHaveLength(2);
      expect(snapshot.children[0].type).toBe('Flex');
      expect(snapshot.children[0].children).toHaveLength(2);
      expect(snapshot.children[0].children[0].type).toBe('Button');
      expect(snapshot.children[0].children[1].type).toBe('Text');
      expect(snapshot.children[1].type).toBe('Flex');
      expect(snapshot.children[1].children).toHaveLength(1);
      expect(snapshot.children[1].children[0].type).toBe('Icon');
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should capture serialized snapshot for comparison', () => {
      const container = Container({ direction: 'row' });
      const button = Button({ variant: 'outline' });
      container.appendChild(button);
      
      const snapshot = renderPrimitiveToSnapshot(container);
      const serialized = serializeSnapshot(snapshot);
      
      // Serialized snapshot should be a valid JSON string
      expect(() => JSON.parse(serialized)).not.toThrow();
      
      // Serialized snapshot should not contain primitive IDs
      expect(serialized).not.toContain('data-primitive-id');
      
      expect(serialized).toMatchSnapshot();
    });
  });


  // ============================================
  // Requirement 1.6: ErrorBoundary Fallback Snapshot Tests
  // ============================================

  describe('ErrorBoundary Fallback (Requirement 1.6)', () => {
    // Component that throws an error
    const ThrowingComponent = () => {
      throw new Error('Test error for snapshot');
    };

    it('should capture ErrorBoundary default fallback snapshot', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = () => {};
      
      const { container: domContainer } = render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );
      
      console.error = originalError;
      
      expect(domContainer.firstChild).toMatchSnapshot();
    });

    it('should capture ErrorBoundary fallback with error details', () => {
      const originalError = console.error;
      console.error = () => {};
      
      const { container: domContainer, getByText } = render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );
      
      console.error = originalError;
      
      // Verify error message is displayed
      expect(getByText('Something went wrong')).toBeTruthy();
      expect(getByText('Test error for snapshot')).toBeTruthy();
      
      expect(domContainer.firstChild).toMatchSnapshot();
    });

    it('should capture ErrorBoundary with custom fallback snapshot', () => {
      const originalError = console.error;
      console.error = () => {};
      
      const CustomFallback = ({ error, retry }) => (
        <div className="custom-error-fallback">
          <h2>Custom Error UI</h2>
          <p>Error: {error.message}</p>
          <button onClick={retry}>Retry</button>
        </div>
      );
      
      const { container: domContainer } = render(
        <ErrorBoundary fallback={CustomFallback}>
          <ThrowingComponent />
        </ErrorBoundary>
      );
      
      console.error = originalError;
      
      expect(domContainer.firstChild).toMatchSnapshot();
    });

    it('should capture ErrorBoundary wrapping PrimitiveRenderer snapshot', () => {
      const originalError = console.error;
      console.error = () => {};
      
      // Create a primitive that will cause an error (unregistered type)
      // First unregister all components to ensure the type is unknown
      unregisterAllMockComponents(unregisterComponent);
      
      const unknownPrimitive = createTestPrimitive('UnknownType', { prop: 'value' });
      
      const { container: domContainer } = render(
        <ErrorBoundary>
          <PrimitiveRenderer primitive={unknownPrimitive} />
        </ErrorBoundary>
      );
      
      console.error = originalError;
      
      // Re-register components for other tests
      registerAllMockComponents(registerComponent);
      
      // PrimitiveRenderer returns null for unknown types, so no error boundary triggered
      // This tests that ErrorBoundary handles graceful degradation
      expect(domContainer).toMatchSnapshot();
    });

    it('should capture ErrorBoundary retry button snapshot', () => {
      const originalError = console.error;
      console.error = () => {};
      
      const { container: domContainer, getByText } = render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );
      
      console.error = originalError;
      
      // Verify retry button exists
      const retryButton = getByText('Try again');
      expect(retryButton).toBeTruthy();
      
      expect(domContainer.firstChild).toMatchSnapshot();
    });

    it('should capture ErrorBoundary with componentName prop snapshot', () => {
      const originalError = console.error;
      console.error = () => {};
      
      const { container: domContainer } = render(
        <ErrorBoundary componentName="TestComponent">
          <ThrowingComponent />
        </ErrorBoundary>
      );
      
      console.error = originalError;
      
      expect(domContainer.firstChild).toMatchSnapshot();
    });

    it('should capture ErrorBoundary error details section snapshot', () => {
      const originalError = console.error;
      console.error = () => {};
      
      const { container: domContainer, getByText } = render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );
      
      console.error = originalError;
      
      // Verify error details section exists
      const detailsSummary = getByText('Error details');
      expect(detailsSummary).toBeTruthy();
      
      expect(domContainer.firstChild).toMatchSnapshot();
    });
  });

  // ============================================
  // Additional Edge Cases
  // ============================================

  describe('Edge Cases', () => {
    it('should handle null primitive gracefully', () => {
      const { container: domContainer } = render(<PrimitiveRenderer primitive={null} />);
      
      expect(domContainer.firstChild).toBeNull();
    });

    it('should handle undefined primitive gracefully', () => {
      const { container: domContainer } = render(<PrimitiveRenderer primitive={undefined} />);
      
      expect(domContainer.firstChild).toBeNull();
    });

    it('should handle primitive with empty props', () => {
      const container = Container({});
      const snapshot = renderPrimitiveToSnapshot(container);
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should handle deeply nested structure (4 levels)', () => {
      const level1 = Container({ className: 'level-1' });
      const level2 = Flex({ className: 'level-2' });
      const level3 = Panel({ className: 'level-3' });
      const level4 = Button({ className: 'level-4' });
      
      level3.appendChild(level4);
      level2.appendChild(level3);
      level1.appendChild(level2);
      
      const snapshot = renderPrimitiveToSnapshot(level1);
      
      // Verify all 4 levels are captured
      expect(snapshot.type).toBe('Container');
      expect(snapshot.children[0].type).toBe('Flex');
      expect(snapshot.children[0].children[0].type).toBe('Panel');
      expect(snapshot.children[0].children[0].children[0].type).toBe('Button');
      
      expect(snapshot).toMatchSnapshot();
    });

    it('should handle sibling primitives at same level', () => {
      const container = Container({ direction: 'row' });
      
      // Add 5 sibling buttons
      for (let i = 0; i < 5; i++) {
        container.appendChild(Button({ variant: 'default', className: `btn-${i}` }));
      }
      
      const snapshot = renderPrimitiveToSnapshot(container);
      
      expect(snapshot.children).toHaveLength(5);
      expect(snapshot).toMatchSnapshot();
    });
  });
});
