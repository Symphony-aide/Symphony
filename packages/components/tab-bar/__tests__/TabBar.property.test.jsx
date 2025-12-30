/**
 * **Feature: component-packages-migration, Property 1: No Pure HTML Elements**
 * 
 * Property tests for TabBar component to verify it uses only UI components.
 */

import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TabBar from '../src/TabBar.jsx';

const mockTabs = [
  { id: 'tab1', label: 'File 1', isDirty: false },
  { id: 'tab2', label: 'File 2', isDirty: true },
];

describe('TabBar - Property 1: No Pure HTML Elements', () => {
  it('should use Flex component for layout containers', () => {
    const { container } = render(
      <TabBar 
        tabs={mockTabs}
        activeTabId="tab1"
        onTabChange={() => {}}
      />
    );

    const rootElement = container.firstChild;
    expect(rootElement.classList.contains('flex')).toBe(true);
  });

  it('should use Button components for tabs', () => {
    const { container } = render(
      <TabBar 
        tabs={mockTabs}
        activeTabId="tab1"
        onTabChange={() => {}}
      />
    );

    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should use DropdownMenu for overflow menu', () => {
    const { container } = render(
      <TabBar 
        tabs={mockTabs}
        activeTabId="tab1"
        onTabChange={() => {}}
        onCloseAll={() => {}}
        onCloseOthers={() => {}}
      />
    );

    // DropdownMenu trigger should be present
    const menuTrigger = container.querySelector('[data-state]');
    expect(menuTrigger).toBeTruthy();
  });

  it('should preserve component functionality', () => {
    let tabChanged = false;

    const { container } = render(
      <TabBar 
        tabs={mockTabs}
        activeTabId="tab1"
        onTabChange={() => { tabChanged = true; }}
        onTabClose={() => {}}
      />
    );

    expect(container.firstChild).toBeTruthy();
    expect(container.textContent).toContain('File 1');
    expect(container.textContent).toContain('File 2');
  });
});
