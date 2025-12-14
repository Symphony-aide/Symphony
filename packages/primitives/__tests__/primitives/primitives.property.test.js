/**
 * @fileoverview Property-based tests for primitive type props storage
 *
 * These tests use fast-check to verify that all primitive types correctly
 * store their props with appropriate default values.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Layout primitives
import { Box, Container, Flex, Grid, Panel, Divider } from '../../src/primitives/layout.js';

// Interactive primitives
import { Button, Input, Icon, Text, Checkbox, Select } from '../../src/primitives/interactive.js';

// Complex primitives
import { List, Tabs, Dropdown, Modal, Tooltip } from '../../src/primitives/complex.js';

/**
 * **Feature: primitives-package, Property 11: Primitive Type Props Storage**
 *
 * For any primitive type (layout, interactive, complex, or heavy) and valid props
 * for that type, the created primitive SHALL store all provided props accessible
 * via the props property, with correct default values for omitted optional props.
 *
 * **Validates: Requirements 3.1-3.5, 4.1-4.6, 5.1-5.5, 8.1-8.4**
 */
describe('Property 11: Primitive Type Props Storage', () => {
  // Arbitrary generators for common prop types
  const classNameArb = fc.option(fc.stringMatching(/^[a-z][a-z0-9-]*$/), { nil: undefined });
  const handlerIdArb = fc.option(fc.stringMatching(/^[a-z_][a-z0-9_]*$/), { nil: undefined });

  describe('Layout Primitives (Requirements 3.0-3.5)', () => {
    describe('Box (Requirement 3.0)', () => {
      const paddingArb = fc.constantFrom('none', 'sm', 'md', 'lg', 'xl');
      const marginArb = fc.constantFrom('none', 'sm', 'md', 'lg', 'xl');
      const displayArb = fc.constantFrom('block', 'inline', 'inline-block', 'flex', 'inline-flex', 'grid');

      it('should store all provided props', () => {
        fc.assert(
          fc.property(paddingArb, marginArb, displayArb, classNameArb, (padding, margin, display, className) => {
            const props = { padding, margin, display, className };
            const box = Box(props);

            expect(box.props.padding).toBe(padding);
            expect(box.props.margin).toBe(margin);
            expect(box.props.display).toBe(display);
            if (className !== undefined) {
              expect(box.props.className).toBe(className);
            }
          }),
          { numRuns: 100 }
        );
      });

      it('should have correct default values', () => {
        const box = Box();
        expect(box.props.padding).toBe('none');
        expect(box.props.margin).toBe('none');
        expect(box.props.display).toBe('block');
        expect(box.renderStrategy).toBe('react');
      });
    });

    describe('Container (Requirement 3.1)', () => {
      const directionArb = fc.constantFrom('row', 'column');
      const gapArb = fc.nat({ max: 100 });

      it('should store all provided props', () => {
        fc.assert(
          fc.property(directionArb, gapArb, classNameArb, (direction, gap, className) => {
            const props = { direction, gap, className };
            const container = Container(props);

            expect(container.props.direction).toBe(direction);
            expect(container.props.gap).toBe(gap);
            if (className !== undefined) {
              expect(container.props.className).toBe(className);
            }
          }),
          { numRuns: 100 }
        );
      });

      it('should have correct default values', () => {
        const container = Container();
        expect(container.props.direction).toBe('column');
        expect(container.props.gap).toBe(0);
        expect(container.renderStrategy).toBe('react');
      });
    });


    describe('Flex (Requirement 3.2)', () => {
      const justifyArb = fc.constantFrom('start', 'center', 'end', 'between');
      const alignArb = fc.constantFrom('start', 'center', 'end', 'stretch');
      const wrapArb = fc.boolean();

      it('should store all provided props', () => {
        fc.assert(
          fc.property(justifyArb, alignArb, wrapArb, classNameArb, (justify, align, wrap, className) => {
            const props = { justify, align, wrap, className };
            const flex = Flex(props);

            expect(flex.props.justify).toBe(justify);
            expect(flex.props.align).toBe(align);
            expect(flex.props.wrap).toBe(wrap);
            if (className !== undefined) {
              expect(flex.props.className).toBe(className);
            }
          }),
          { numRuns: 100 }
        );
      });

      it('should have correct default values', () => {
        const flex = Flex();
        expect(flex.props.justify).toBe('start');
        expect(flex.props.align).toBe('stretch');
        expect(flex.props.wrap).toBe(false);
        expect(flex.renderStrategy).toBe('react');
      });
    });

    describe('Grid (Requirement 3.3)', () => {
      const columnsArb = fc.integer({ min: 1, max: 12 });
      const rowsArb = fc.option(fc.integer({ min: 1, max: 12 }), { nil: undefined });
      const gapArb = fc.nat({ max: 100 });

      it('should store all provided props', () => {
        fc.assert(
          fc.property(columnsArb, rowsArb, gapArb, classNameArb, (columns, rows, gap, className) => {
            const props = { columns, rows, gap, className };
            const grid = Grid(props);

            expect(grid.props.columns).toBe(columns);
            if (rows !== undefined) {
              expect(grid.props.rows).toBe(rows);
            }
            expect(grid.props.gap).toBe(gap);
            if (className !== undefined) {
              expect(grid.props.className).toBe(className);
            }
          }),
          { numRuns: 100 }
        );
      });

      it('should have correct default values', () => {
        const grid = Grid();
        expect(grid.props.columns).toBe(1);
        expect(grid.props.gap).toBe(0);
        expect(grid.renderStrategy).toBe('react');
      });
    });

    describe('Panel (Requirement 3.4)', () => {
      const titleArb = fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined });
      const collapsibleArb = fc.boolean();
      const defaultCollapsedArb = fc.boolean();

      it('should store all provided props', () => {
        fc.assert(
          fc.property(titleArb, collapsibleArb, defaultCollapsedArb, classNameArb, (title, collapsible, defaultCollapsed, className) => {
            const props = { title, collapsible, defaultCollapsed, className };
            const panel = Panel(props);

            if (title !== undefined) {
              expect(panel.props.title).toBe(title);
            }
            expect(panel.props.collapsible).toBe(collapsible);
            expect(panel.props.defaultCollapsed).toBe(defaultCollapsed);
            if (className !== undefined) {
              expect(panel.props.className).toBe(className);
            }
          }),
          { numRuns: 100 }
        );
      });

      it('should have correct default values', () => {
        const panel = Panel();
        expect(panel.props.collapsible).toBe(false);
        expect(panel.props.defaultCollapsed).toBe(false);
        expect(panel.renderStrategy).toBe('react');
      });
    });

    describe('Divider (Requirement 3.5)', () => {
      const orientationArb = fc.constantFrom('horizontal', 'vertical');

      it('should store all provided props', () => {
        fc.assert(
          fc.property(orientationArb, classNameArb, (orientation, className) => {
            const props = { orientation, className };
            const divider = Divider(props);

            expect(divider.props.orientation).toBe(orientation);
            if (className !== undefined) {
              expect(divider.props.className).toBe(className);
            }
          }),
          { numRuns: 100 }
        );
      });

      it('should have correct default values and be a leaf node', () => {
        const divider = Divider();
        expect(divider.props.orientation).toBe('horizontal');
        expect(divider.renderStrategy).toBe('react');
        expect(divider.isLeafNode).toBe(true);
      });
    });
  });


  describe('Interactive Primitives (Requirements 4.1-4.6)', () => {
    describe('Button (Requirement 4.1)', () => {
      const variantArb = fc.constantFrom('default', 'destructive', 'outline', 'secondary', 'ghost', 'link');
      const sizeArb = fc.constantFrom('default', 'sm', 'lg', 'icon');
      const disabledArb = fc.boolean();

      it('should store all provided props', () => {
        fc.assert(
          fc.property(variantArb, sizeArb, handlerIdArb, disabledArb, classNameArb, (variant, size, onClick, disabled, className) => {
            const props = { variant, size, onClick, disabled, className };
            const button = Button(props);

            expect(button.props.variant).toBe(variant);
            expect(button.props.size).toBe(size);
            if (onClick !== undefined) {
              expect(button.props.onClick).toBe(onClick);
            }
            expect(button.props.disabled).toBe(disabled);
            if (className !== undefined) {
              expect(button.props.className).toBe(className);
            }
          }),
          { numRuns: 100 }
        );
      });

      it('should have correct default values', () => {
        const button = Button();
        expect(button.props.variant).toBe('default');
        expect(button.props.size).toBe('default');
        expect(button.props.disabled).toBe(false);
        expect(button.renderStrategy).toBe('react');
      });
    });

    describe('Input (Requirement 4.2)', () => {
      const typeArb = fc.constantFrom('text', 'password', 'email', 'number');
      const valueArb = fc.string({ maxLength: 100 });
      const placeholderArb = fc.option(fc.string({ maxLength: 50 }), { nil: undefined });
      const disabledArb = fc.boolean();

      it('should store all provided props', () => {
        fc.assert(
          fc.property(typeArb, valueArb, handlerIdArb, placeholderArb, disabledArb, classNameArb, (type, value, onChange, placeholder, disabled, className) => {
            const props = { type, value, onChange, placeholder, disabled, className };
            const input = Input(props);

            expect(input.props.type).toBe(type);
            expect(input.props.value).toBe(value);
            if (onChange !== undefined) {
              expect(input.props.onChange).toBe(onChange);
            }
            if (placeholder !== undefined) {
              expect(input.props.placeholder).toBe(placeholder);
            }
            expect(input.props.disabled).toBe(disabled);
            if (className !== undefined) {
              expect(input.props.className).toBe(className);
            }
          }),
          { numRuns: 100 }
        );
      });

      it('should have correct default values and be a leaf node', () => {
        const input = Input();
        expect(input.props.type).toBe('text');
        expect(input.props.value).toBe('');
        expect(input.props.disabled).toBe(false);
        expect(input.renderStrategy).toBe('react');
        expect(input.isLeafNode).toBe(true);
      });
    });

    describe('Icon (Requirement 4.3)', () => {
      const nameArb = fc.stringMatching(/^[a-z][a-z-]*$/);
      const sizeArb = fc.integer({ min: 8, max: 128 });
      const colorArb = fc.option(fc.hexaString({ minLength: 6, maxLength: 6 }).map(s => `#${s}`), { nil: undefined });

      it('should store all provided props', () => {
        fc.assert(
          fc.property(nameArb, sizeArb, colorArb, classNameArb, (name, size, color, className) => {
            const props = { name, size, color, className };
            const icon = Icon(props);

            expect(icon.props.name).toBe(name);
            expect(icon.props.size).toBe(size);
            if (color !== undefined) {
              expect(icon.props.color).toBe(color);
            }
            if (className !== undefined) {
              expect(icon.props.className).toBe(className);
            }
          }),
          { numRuns: 100 }
        );
      });

      it('should have correct default values and be a leaf node', () => {
        const icon = Icon();
        expect(icon.props.size).toBe(24);
        expect(icon.renderStrategy).toBe('react');
        expect(icon.isLeafNode).toBe(true);
      });
    });

    describe('Text (Requirement 4.4)', () => {
      const contentArb = fc.string({ maxLength: 200 });
      const variantArb = fc.constantFrom('body', 'heading', 'caption', 'code');
      const sizeArb = fc.constantFrom('xs', 'sm', 'md', 'lg', 'xl');
      const weightArb = fc.constantFrom('normal', 'medium', 'semibold', 'bold');

      it('should store all provided props', () => {
        fc.assert(
          fc.property(contentArb, variantArb, sizeArb, weightArb, classNameArb, (content, variant, size, weight, className) => {
            const props = { content, variant, size, weight, className };
            const text = Text(props);

            expect(text.props.content).toBe(content);
            expect(text.props.variant).toBe(variant);
            expect(text.props.size).toBe(size);
            expect(text.props.weight).toBe(weight);
            if (className !== undefined) {
              expect(text.props.className).toBe(className);
            }
          }),
          { numRuns: 100 }
        );
      });

      it('should have correct default values and be a leaf node', () => {
        const text = Text();
        expect(text.props.content).toBe('');
        expect(text.props.variant).toBe('body');
        expect(text.props.size).toBe('md');
        expect(text.props.weight).toBe('normal');
        expect(text.renderStrategy).toBe('react');
        expect(text.isLeafNode).toBe(true);
      });
    });

    describe('Checkbox (Requirement 4.5)', () => {
      const checkedArb = fc.boolean();
      const labelArb = fc.option(fc.string({ maxLength: 50 }), { nil: undefined });
      const disabledArb = fc.boolean();

      it('should store all provided props', () => {
        fc.assert(
          fc.property(checkedArb, handlerIdArb, labelArb, disabledArb, classNameArb, (checked, onChange, label, disabled, className) => {
            const props = { checked, onChange, label, disabled, className };
            const checkbox = Checkbox(props);

            expect(checkbox.props.checked).toBe(checked);
            if (onChange !== undefined) {
              expect(checkbox.props.onChange).toBe(onChange);
            }
            if (label !== undefined) {
              expect(checkbox.props.label).toBe(label);
            }
            expect(checkbox.props.disabled).toBe(disabled);
            if (className !== undefined) {
              expect(checkbox.props.className).toBe(className);
            }
          }),
          { numRuns: 100 }
        );
      });

      it('should have correct default values', () => {
        const checkbox = Checkbox();
        expect(checkbox.props.checked).toBe(false);
        expect(checkbox.props.disabled).toBe(false);
        expect(checkbox.renderStrategy).toBe('react');
      });
    });

    describe('Select (Requirement 4.6)', () => {
      const optionArb = fc.record({
        value: fc.string({ minLength: 1, maxLength: 20 }),
        label: fc.string({ minLength: 1, maxLength: 50 }),
      });
      const optionsArb = fc.array(optionArb, { maxLength: 10 });
      const valueArb = fc.option(fc.string({ maxLength: 20 }), { nil: undefined });
      const placeholderArb = fc.option(fc.string({ maxLength: 50 }), { nil: undefined });
      const disabledArb = fc.boolean();

      it('should store all provided props', () => {
        fc.assert(
          fc.property(optionsArb, valueArb, handlerIdArb, placeholderArb, disabledArb, classNameArb, (options, value, onChange, placeholder, disabled, className) => {
            const props = { options, value, onChange, placeholder, disabled, className };
            const select = Select(props);

            expect(select.props.options).toEqual(options);
            if (value !== undefined) {
              expect(select.props.value).toBe(value);
            }
            if (onChange !== undefined) {
              expect(select.props.onChange).toBe(onChange);
            }
            if (placeholder !== undefined) {
              expect(select.props.placeholder).toBe(placeholder);
            }
            expect(select.props.disabled).toBe(disabled);
            if (className !== undefined) {
              expect(select.props.className).toBe(className);
            }
          }),
          { numRuns: 100 }
        );
      });

      it('should have correct default values', () => {
        const select = Select();
        expect(select.props.options).toEqual([]);
        expect(select.props.disabled).toBe(false);
        expect(select.renderStrategy).toBe('react');
      });
    });
  });


  describe('Complex Primitives (Requirements 5.1-5.5)', () => {
    describe('List (Requirement 5.1)', () => {
      const listItemArb = fc.record({
        id: fc.string({ minLength: 1, maxLength: 20 }),
        data: fc.oneof(fc.string(), fc.integer(), fc.boolean()),
      });
      const itemsArb = fc.array(listItemArb, { maxLength: 20 });
      const virtualizedArb = fc.boolean();

      it('should store all provided props', () => {
        fc.assert(
          fc.property(itemsArb, handlerIdArb, virtualizedArb, classNameArb, (items, renderItem, virtualized, className) => {
            const props = { items, renderItem, virtualized, className };
            const list = List(props);

            expect(list.props.items).toEqual(items);
            if (renderItem !== undefined) {
              expect(list.props.renderItem).toBe(renderItem);
            }
            expect(list.props.virtualized).toBe(virtualized);
            if (className !== undefined) {
              expect(list.props.className).toBe(className);
            }
          }),
          { numRuns: 100 }
        );
      });

      it('should have correct default values', () => {
        const list = List();
        expect(list.props.items).toEqual([]);
        expect(list.props.virtualized).toBe(false);
        expect(list.renderStrategy).toBe('react');
      });
    });

    describe('Tabs (Requirement 5.2)', () => {
      const tabArb = fc.record({
        id: fc.string({ minLength: 1, maxLength: 20 }),
        label: fc.string({ minLength: 1, maxLength: 50 }),
        icon: fc.option(fc.stringMatching(/^[a-z][a-z-]*$/), { nil: undefined }),
      });
      const tabsArb = fc.array(tabArb, { maxLength: 10 });
      const activeTabArb = fc.option(fc.string({ maxLength: 20 }), { nil: undefined });

      it('should store all provided props', () => {
        fc.assert(
          fc.property(tabsArb, activeTabArb, handlerIdArb, classNameArb, (tabs, activeTab, onTabChange, className) => {
            const props = { tabs, activeTab, onTabChange, className };
            const tabsComponent = Tabs(props);

            expect(tabsComponent.props.tabs).toEqual(tabs);
            if (activeTab !== undefined) {
              expect(tabsComponent.props.activeTab).toBe(activeTab);
            }
            if (onTabChange !== undefined) {
              expect(tabsComponent.props.onTabChange).toBe(onTabChange);
            }
            if (className !== undefined) {
              expect(tabsComponent.props.className).toBe(className);
            }
          }),
          { numRuns: 100 }
        );
      });

      it('should have correct default values', () => {
        const tabs = Tabs();
        expect(tabs.props.tabs).toEqual([]);
        expect(tabs.renderStrategy).toBe('react');
      });
    });

    describe('Dropdown (Requirement 5.3)', () => {
      const dropdownItemArb = fc.record({
        id: fc.string({ minLength: 1, maxLength: 20 }),
        label: fc.string({ minLength: 1, maxLength: 50 }),
        icon: fc.option(fc.stringMatching(/^[a-z][a-z-]*$/), { nil: undefined }),
        onClick: fc.option(fc.stringMatching(/^[a-z_][a-z0-9_]*$/), { nil: undefined }),
      });
      const itemsArb = fc.array(dropdownItemArb, { maxLength: 15 });

      it('should store all provided props', () => {
        fc.assert(
          fc.property(itemsArb, classNameArb, (items, className) => {
            const props = { items, className };
            const dropdown = Dropdown(props);

            expect(dropdown.props.items).toEqual(items);
            if (className !== undefined) {
              expect(dropdown.props.className).toBe(className);
            }
          }),
          { numRuns: 100 }
        );
      });

      it('should have correct default values', () => {
        const dropdown = Dropdown();
        expect(dropdown.props.items).toEqual([]);
        expect(dropdown.renderStrategy).toBe('react');
      });

      it('should accept trigger primitive', () => {
        const trigger = Button({ variant: 'outline' });
        const dropdown = Dropdown({ trigger, items: [] });

        expect(dropdown.props.trigger).toBe(trigger);
      });
    });

    describe('Modal (Requirement 5.4)', () => {
      const titleArb = fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined });
      const openArb = fc.boolean();
      const sizeArb = fc.constantFrom('sm', 'md', 'lg', 'xl', 'full');

      it('should store all provided props', () => {
        fc.assert(
          fc.property(titleArb, openArb, handlerIdArb, sizeArb, classNameArb, (title, open, onClose, size, className) => {
            const props = { title, open, onClose, size, className };
            const modal = Modal(props);

            if (title !== undefined) {
              expect(modal.props.title).toBe(title);
            }
            expect(modal.props.open).toBe(open);
            if (onClose !== undefined) {
              expect(modal.props.onClose).toBe(onClose);
            }
            expect(modal.props.size).toBe(size);
            if (className !== undefined) {
              expect(modal.props.className).toBe(className);
            }
          }),
          { numRuns: 100 }
        );
      });

      it('should have correct default values', () => {
        const modal = Modal();
        expect(modal.props.open).toBe(false);
        expect(modal.props.size).toBe('md');
        expect(modal.renderStrategy).toBe('react');
      });
    });

    describe('Tooltip (Requirement 5.5)', () => {
      const contentArb = fc.option(fc.string({ maxLength: 200 }), { nil: undefined });
      const positionArb = fc.constantFrom('top', 'bottom', 'left', 'right');

      it('should store all provided props', () => {
        fc.assert(
          fc.property(contentArb, positionArb, classNameArb, (content, position, className) => {
            const props = { content, position, className };
            const tooltip = Tooltip(props);

            if (content !== undefined) {
              expect(tooltip.props.content).toBe(content);
            }
            expect(tooltip.props.position).toBe(position);
            if (className !== undefined) {
              expect(tooltip.props.className).toBe(className);
            }
          }),
          { numRuns: 100 }
        );
      });

      it('should have correct default values', () => {
        const tooltip = Tooltip();
        expect(tooltip.props.position).toBe('top');
        expect(tooltip.renderStrategy).toBe('react');
      });
    });
  });
});
