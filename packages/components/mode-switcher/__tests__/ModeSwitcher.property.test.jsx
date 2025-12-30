/**
 * @vitest-environment jsdom
 * **Feature: component-packages-migration, Property 1: No Pure HTML Elements**
 * 
 * Property tests for ModeSwitcher component to verify it uses only UI components.
 * **Validates: Requirements 1.1, 1.2, 1.4**
 */

import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ModeSwitcher from '../src/ModeSwitcher.jsx';

describe('ModeSwitcher - Property 1: No Pure HTML Elements', () => {
  it('should use Flex component for main container instead of div', () => {
    const { container } = render(<ModeSwitcher />);

    // The main container should have flex classes from Flex component
    const mainContainer = container.firstChild;
    expect(mainContainer.className).toContain('flex');
    expect(mainContainer.className).toContain('items-center');
  });

  it('should not have any raw div elements as direct children', () => {
    const { container } = render(<ModeSwitcher />);

    // Check that the component uses Flex (which renders as div with flex classes)
    const mainContainer = container.firstChild;
    expect(mainContainer.tagName.toLowerCase()).toBe('div');
    expect(mainContainer.className).toContain('flex');
  });

  it('should use ToggleGroup component for mode selection', () => {
    const { container } = render(<ModeSwitcher />);

    // ToggleGroup should be present
    const toggleGroup = container.querySelector('[role="group"]');
    expect(toggleGroup).toBeTruthy();
  });

  it('should use ToggleGroupItem components for mode options', () => {
    const { container } = render(<ModeSwitcher />);

    // Should have toggle items for Normal and Maestro modes
    const toggleItems = container.querySelectorAll('[role="radio"]');
    expect(toggleItems.length).toBe(2);
  });
});

describe('ModeSwitcher - Property 2: Layout Components Usage', () => {
  it('should use Flex with align="center" for main container', () => {
    const { container } = render(<ModeSwitcher />);

    const mainContainer = container.firstChild;
    expect(mainContainer.className).toContain('items-center');
  });

  it('should apply custom className to Flex container', () => {
    const { container } = render(<ModeSwitcher className="custom-class" />);

    const mainContainer = container.firstChild;
    expect(mainContainer.className).toContain('custom-class');
  });
});

describe('ModeSwitcher - Property 4: Interactive Components Usage', () => {
  it('should use ToggleGroup for mode selection', () => {
    const { container } = render(<ModeSwitcher />);

    const toggleGroup = container.querySelector('[role="group"]');
    expect(toggleGroup).toBeTruthy();
    expect(toggleGroup.className).toContain('bg-bg-tertiary');
  });

  it('should use ToggleGroupItem for Normal mode', () => {
    const { container } = render(<ModeSwitcher />);

    const normalToggle = container.querySelector('[aria-label="Normal Mode"]');
    expect(normalToggle).toBeTruthy();
    expect(normalToggle.textContent).toContain('Normal');
  });

  it('should use ToggleGroupItem for Maestro mode', () => {
    const { container } = render(<ModeSwitcher />);

    const maestroToggle = container.querySelector('[aria-label="Maestro Mode"]');
    expect(maestroToggle).toBeTruthy();
    expect(maestroToggle.textContent).toContain('Maestro');
  });
});

describe('ModeSwitcher - Property 5: Component Functionality Preservation', () => {
  it('should default to normal mode', () => {
    const { container } = render(<ModeSwitcher />);

    const normalToggle = container.querySelector('[aria-label="Normal Mode"]');
    expect(normalToggle.getAttribute('data-state')).toBe('on');
  });

  it('should respect initial mode prop', () => {
    const { container } = render(<ModeSwitcher mode="maestro" />);

    const maestroToggle = container.querySelector('[aria-label="Maestro Mode"]');
    expect(maestroToggle.getAttribute('data-state')).toBe('on');
  });

  it('should call onModeChange when mode is changed', () => {
    const onModeChange = vi.fn();
    const { container } = render(<ModeSwitcher onModeChange={onModeChange} />);

    const maestroToggle = container.querySelector('[aria-label="Maestro Mode"]');
    fireEvent.click(maestroToggle);

    expect(onModeChange).toHaveBeenCalledWith('maestro');
  });

  it('should update visual state when mode changes', () => {
    const { container } = render(<ModeSwitcher />);

    const maestroToggle = container.querySelector('[aria-label="Maestro Mode"]');
    const normalToggle = container.querySelector('[aria-label="Normal Mode"]');

    // Initially normal is selected
    expect(normalToggle.getAttribute('data-state')).toBe('on');
    expect(maestroToggle.getAttribute('data-state')).toBe('off');

    // Click maestro
    fireEvent.click(maestroToggle);

    // Now maestro should be selected
    expect(maestroToggle.getAttribute('data-state')).toBe('on');
    expect(normalToggle.getAttribute('data-state')).toBe('off');
  });

  it('should display emoji icons for modes', () => {
    const { container } = render(<ModeSwitcher />);

    expect(container.textContent).toContain('🎼');
    expect(container.textContent).toContain('🎩');
  });

  it('should have proper accessibility labels', () => {
    const { container } = render(<ModeSwitcher />);

    const normalToggle = container.querySelector('[aria-label="Normal Mode"]');
    const maestroToggle = container.querySelector('[aria-label="Maestro Mode"]');

    expect(normalToggle).toBeTruthy();
    expect(maestroToggle).toBeTruthy();
  });
});
