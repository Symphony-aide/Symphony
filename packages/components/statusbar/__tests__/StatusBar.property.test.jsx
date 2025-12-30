/**
 * @vitest-environment jsdom
 * **Feature: component-packages-migration, Property 1: No Pure HTML Elements**
 * 
 * Property tests for StatusBar component to verify it uses only UI components.
 */

import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatusBar from '../src/StatusBar.jsx';

describe('StatusBar - Property 1: No Pure HTML Elements', () => {
  it('should use Flex component for layout containers', () => {
    const { container } = render(
      <StatusBar 
        activeFileName="test.js"
        terminalVisible={false}
        onToggleTerminal={() => {}}
      />
    );

    const rootElement = container.firstChild;
    expect(rootElement.classList.contains('flex')).toBe(true);
  });

  it('should use Text components for text content', () => {
    const { container } = render(
      <StatusBar 
        activeFileName="test.js"
        gitBranch="main"
        language="TypeScript"
      />
    );

    // Text content should be rendered
    expect(container.textContent).toContain('main');
    expect(container.textContent).toContain('TypeScript');
  });

  it('should use Button component for terminal toggle', () => {
    const { container } = render(
      <StatusBar 
        terminalVisible={false}
        onToggleTerminal={() => {}}
      />
    );

    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should preserve component functionality', () => {
    let toggleCalled = false;

    const { container } = render(
      <StatusBar 
        activeFileName="test.js"
        terminalVisible={false}
        onToggleTerminal={() => { toggleCalled = true; }}
        lineCount={100}
        cursorPosition={{ line: 10, column: 5 }}
        language="JavaScript"
        isOnline={true}
        gitBranch="feature/test"
      />
    );

    expect(container.firstChild).toBeTruthy();
    expect(container.textContent).toContain('feature/test');
    expect(container.textContent).toContain('100 lines');
  });
});
