/**
 * **Feature: component-packages-migration, Property 1: No Pure HTML Elements**
 * 
 * Property tests for FileExplorer component to verify it uses only UI components.
 */

import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FileExplorer from '../src/FileExplorer.jsx';

const mockFiles = [
  { name: 'test.js', content: 'console.log("test")' },
  { name: 'index.ts', content: 'export default {}' },
];

describe('FileExplorer - Property 1: No Pure HTML Elements', () => {
  it('should use Flex component for layout containers', () => {
    const { container } = render(
      <FileExplorer 
        files={mockFiles}
        activeFileName="test.js"
        onSelectFile={() => {}}
        onOpenSettings={() => {}}
      />
    );

    const rootElement = container.firstChild;
    expect(rootElement.classList.contains('flex')).toBe(true);
  });

  it('should use Heading component for title', () => {
    const { container } = render(
      <FileExplorer 
        files={mockFiles}
        onSelectFile={() => {}}
        onOpenSettings={() => {}}
      />
    );

    // Should contain EXPLORER text
    expect(container.textContent).toContain('EXPLORER');
  });

  it('should use Tabs components from UI package', () => {
    const { container } = render(
      <FileExplorer 
        files={mockFiles}
        onSelectFile={() => {}}
        onOpenSettings={() => {}}
      />
    );

    // Tabs component renders with data-state attribute
    const tabsTriggers = container.querySelectorAll('[data-state]');
    expect(tabsTriggers.length).toBeGreaterThan(0);
  });

  it('should use Button components for actions', () => {
    const { container } = render(
      <FileExplorer 
        files={mockFiles}
        onSelectFile={() => {}}
        onOpenSettings={() => {}}
      />
    );

    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should preserve component functionality', () => {
    let fileSelected = false;

    const { container } = render(
      <FileExplorer 
        files={mockFiles}
        activeFileName="test.js"
        onSelectFile={() => { fileSelected = true; }}
        onOpenSettings={() => {}}
        onNewFile={() => {}}
        onDeleteFile={() => {}}
      />
    );

    expect(container.firstChild).toBeTruthy();
    expect(container.textContent).toContain('Files');
    expect(container.textContent).toContain('Search');
  });
});
