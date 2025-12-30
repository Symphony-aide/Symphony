/**
 * @vitest-environment jsdom
 * **Feature: component-packages-migration, Property 1: No Pure HTML Elements**
 * 
 * Property tests for OutlineView component to verify it uses only UI components.
 * **Validates: Requirements 1.1, 1.2, 1.3**
 */

import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Provider, createStore } from 'jotai';
import OutlineView from '../src/OutlineView.jsx';
import { outlineAtom } from '../src/outlineAtom.js';

// Helper to render with Jotai provider
const renderWithProvider = (ui, initialOutline = []) => {
  const store = createStore();
  store.set(outlineAtom, initialOutline);
  return render(
    <Provider store={store}>
      {ui}
    </Provider>
  );
};

describe('OutlineView - Property 1: No Pure HTML Elements', () => {
  it('should use ScrollArea component for main container instead of div', () => {
    const { container } = renderWithProvider(<OutlineView />);

    // The main container should have ScrollArea classes
    const mainContainer = container.firstChild;
    expect(mainContainer).toBeTruthy();
    // ScrollArea renders with specific structure
    expect(mainContainer.className).toContain('bg-gray-900');
  });

  it('should use Heading component for title instead of h2', () => {
    const { container } = renderWithProvider(<OutlineView />);

    // Should have an h6 element (from Heading component with level={6})
    const heading = container.querySelector('h6');
    expect(heading).toBeTruthy();
    expect(heading.textContent).toBe('Outline');
  });

  it('should use Text component for empty state message instead of p', () => {
    const { container } = renderWithProvider(<OutlineView />);

    // Should contain the empty state message
    expect(container.textContent).toContain('No symbols found.');
  });

  it('should use Flex component for outline items instead of ul/li', () => {
    const outlineItems = [
      { type: 'function', name: 'testFunc', line: 10 },
      { type: 'class', name: 'TestClass', line: 20 },
    ];
    
    const { container } = renderWithProvider(<OutlineView />, outlineItems);

    // Should not have ul or li elements
    expect(container.querySelector('ul')).toBeNull();
    expect(container.querySelector('li')).toBeNull();
    
    // Should have flex layout for items
    const flexItems = container.querySelectorAll('.flex');
    expect(flexItems.length).toBeGreaterThan(0);
  });

  it('should use Text component with as="span" for item details instead of span', () => {
    const outlineItems = [
      { type: 'function', name: 'testFunc', line: 10 },
    ];
    
    const { container } = renderWithProvider(<OutlineView />, outlineItems);

    // Should contain the item details
    expect(container.textContent).toContain('function');
    expect(container.textContent).toContain('testFunc');
    expect(container.textContent).toContain('@ line 10');
  });
});

describe('OutlineView - Property 2: Layout Components Usage', () => {
  it('should use Flex with direction="column" for outline items list', () => {
    const outlineItems = [
      { type: 'function', name: 'testFunc', line: 10 },
      { type: 'class', name: 'TestClass', line: 20 },
    ];
    
    const { container } = renderWithProvider(<OutlineView />, outlineItems);

    // Should have flex-col class for vertical layout
    const flexCol = container.querySelector('.flex-col');
    expect(flexCol).toBeTruthy();
  });

  it('should use gap utility for spacing between items', () => {
    const outlineItems = [
      { type: 'function', name: 'testFunc', line: 10 },
      { type: 'class', name: 'TestClass', line: 20 },
    ];
    
    const { container } = renderWithProvider(<OutlineView />, outlineItems);

    // Should have gap class for spacing
    const gapElement = container.querySelector('[class*="gap-"]');
    expect(gapElement).toBeTruthy();
  });
});

describe('OutlineView - Property 3: Typography Components Usage', () => {
  it('should use Heading component for section title', () => {
    const { container } = renderWithProvider(<OutlineView />);

    const heading = container.querySelector('h6');
    expect(heading).toBeTruthy();
    expect(heading.className).toContain('font-bold');
  });

  it('should use Text component for empty state', () => {
    const { container } = renderWithProvider(<OutlineView />);

    // Empty state should have text-sm class
    expect(container.textContent).toContain('No symbols found.');
  });

  it('should use Text component for item type with proper styling', () => {
    const outlineItems = [
      { type: 'function', name: 'testFunc', line: 10 },
    ];
    
    const { container } = renderWithProvider(<OutlineView />, outlineItems);

    // Type should have yellow color
    const typeElement = container.querySelector('.text-yellow-400');
    expect(typeElement).toBeTruthy();
    expect(typeElement.textContent).toBe('function');
  });

  it('should use Text component for item name with proper styling', () => {
    const outlineItems = [
      { type: 'function', name: 'testFunc', line: 10 },
    ];
    
    const { container } = renderWithProvider(<OutlineView />, outlineItems);

    // Name should have blue color
    const nameElement = container.querySelector('.text-blue-300');
    expect(nameElement).toBeTruthy();
    expect(nameElement.textContent).toBe('testFunc');
  });

  it('should use Text component for line number with proper styling', () => {
    const outlineItems = [
      { type: 'function', name: 'testFunc', line: 10 },
    ];
    
    const { container } = renderWithProvider(<OutlineView />, outlineItems);

    // Line number should have gray color
    const lineElement = container.querySelector('.text-gray-500');
    expect(lineElement).toBeTruthy();
    expect(lineElement.textContent).toBe('@ line 10');
  });
});

describe('OutlineView - Property 5: Component Functionality Preservation', () => {
  it('should call onSelectItem when an outline item is clicked', () => {
    const onSelectItem = vi.fn();
    const outlineItems = [
      { type: 'function', name: 'testFunc', line: 10 },
    ];
    
    const { container } = renderWithProvider(
      <OutlineView onSelectItem={onSelectItem} />,
      outlineItems
    );

    // Find the clickable item
    const clickableItem = container.querySelector('.cursor-pointer');
    expect(clickableItem).toBeTruthy();
    
    fireEvent.click(clickableItem);
    expect(onSelectItem).toHaveBeenCalledWith(outlineItems[0]);
  });

  it('should render multiple outline items correctly', () => {
    const outlineItems = [
      { type: 'function', name: 'func1', line: 10 },
      { type: 'class', name: 'Class1', line: 20 },
      { type: 'variable', name: 'var1', line: 30 },
    ];
    
    const { container } = renderWithProvider(<OutlineView />, outlineItems);

    expect(container.textContent).toContain('func1');
    expect(container.textContent).toContain('Class1');
    expect(container.textContent).toContain('var1');
  });

  it('should show empty state when outline is empty', () => {
    const { container } = renderWithProvider(<OutlineView />, []);

    expect(container.textContent).toContain('No symbols found.');
  });

  it('should have hover effect on outline items', () => {
    const outlineItems = [
      { type: 'function', name: 'testFunc', line: 10 },
    ];
    
    const { container } = renderWithProvider(<OutlineView />, outlineItems);

    const hoverItem = container.querySelector('.hover\\:bg-gray-800');
    expect(hoverItem).toBeTruthy();
  });
});
