/**
 * @vitest-environment jsdom
 * **Feature: component-packages-migration, Property 1: No Pure HTML Elements**
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import ActivityBar from '../src/ActivityBar.jsx';

describe('ActivityBar - Property 1: No Pure HTML Elements', () => {
  it('should use Flex component for layout containers', () => {
    const { container } = render(
      <ActivityBar 
        activeSidebar="explorer"
        onSidebarChange={() => {}}
      />
    );

    const rootElement = container.firstChild;
    expect(rootElement.classList.contains('flex')).toBe(true);
    expect(rootElement.classList.contains('flex-col')).toBe(true);
  });

  it('should use Button components for interactive elements', () => {
    const { container } = render(
      <ActivityBar 
        activeSidebar="explorer"
        onSidebarChange={() => {}}
      />
    );

    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should use Separator component for dividers', () => {
    const { container } = render(
      <ActivityBar 
        activeSidebar="explorer"
        onSidebarChange={() => {}}
      />
    );

    const separators = container.querySelectorAll('[data-orientation]');
    expect(separators.length).toBeGreaterThan(0);
  });

  it('should preserve component functionality', () => {
    const { container } = render(
      <ActivityBar 
        activeSidebar="explorer"
        onSidebarChange={() => {}}
        userName="Test User"
        isOnline={true}
      />
    );

    expect(container.firstChild).toBeTruthy();
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(5);
  });
});
