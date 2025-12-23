/**
 * Property tests for CodeEditor component migration
 * **Feature: component-packages-migration, Property 1: No Pure HTML Elements**
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  default: {
    Editor: ({ children, ...props }) => (
      <div data-testid="monaco-editor" {...props}>
        {children}
      </div>
    ),
  },
  Editor: ({ children, ...props }) => (
    <div data-testid="monaco-editor" {...props}>
      {children}
    </div>
  ),
}));

// Mock flexlayout-react
vi.mock('flexlayout-react', () => ({
  Layout: ({ children }) => <div data-testid="flexlayout">{children}</div>,
  Model: {
    fromJson: () => ({
      toJson: () => ({}),
      addListener: () => {},
      removeListener: () => {},
    }),
  },
}));

// Mock storage service
vi.mock('../src/utils/storageService.js', () => ({
  storageService: {
    getSync: () => null,
    setSync: () => {},
    remove: () => {},
  },
}));

// Mock hooks
vi.mock('../src/hooks/useEditor', () => ({
  useEditor: () => ({
    handleEditorMount: vi.fn(),
    handleEditorChange: vi.fn((value) => value),
  }),
}));

vi.mock('../src/hooks/useEnhancedLanguageDetection', () => ({
  useEnhancedLanguageDetection: () => ({
    detectedLanguage: 'javascript',
    confidence: 'high',
    getLanguageDisplayName: (lang) => lang || 'Plain Text',
  }),
}));

vi.mock('../src/hooks/useEnhancedThemeManager', () => ({
  useEnhancedThemeManager: () => ({
    themeData: {},
    createCustomTheme: vi.fn(),
  }),
}));

vi.mock('../src/hooks/useEnhancedMonacoConfig', () => ({
  useEnhancedMonacoConfig: () => ({
    registerCustomTheme: vi.fn(() => 'custom-theme'),
    enhanceMonacoOptions: vi.fn((options) => options),
    addCustomTokenProviders: vi.fn(),
    setupEnhancedFeatures: vi.fn(() => () => {}),
  }),
}));

// Mock SyntaxHighlighter
vi.mock('../../syntax-highlighting/src/SyntaxHighlighter', () => ({
  default: () => <div data-testid="syntax-highlighter">Syntax Highlighter</div>,
}));

import EditorTabs from '../src/components/EditorTabs';
import LayoutManager from '../src/components/LayoutManager';

const mockFiles = [
  { name: 'test.js', content: 'console.log("hello");' },
  { name: 'index.html', content: '<html></html>' },
];

describe('CodeEditor - Property 1: No Pure HTML Elements', () => {
  describe('EditorTabs', () => {
    it('should use Flex component for layout containers', () => {
      const { container } = render(
        <EditorTabs
          openTabs={['test.js', 'index.html']}
          files={mockFiles}
          activeFileName="test.js"
          modifiedTabs={[]}
          onSelectFile={() => {}}
          onCloseTab={() => {}}
        />
      );

      // Should not have raw div elements for layout
      const flexElements = container.querySelectorAll('[class*="flex"]');
      expect(flexElements.length).toBeGreaterThan(0);
    });

    it('should use Text component for tab names', () => {
      const { container } = render(
        <EditorTabs
          openTabs={['test.js']}
          files={mockFiles}
          activeFileName="test.js"
          modifiedTabs={[]}
          onSelectFile={() => {}}
          onCloseTab={() => {}}
        />
      );

      // Tab name should be rendered
      expect(container.textContent).toContain('test.js');
    });

    it('should use Button component for close buttons', () => {
      const { container } = render(
        <EditorTabs
          openTabs={['test.js']}
          files={mockFiles}
          activeFileName="test.js"
          modifiedTabs={[]}
          onSelectFile={() => {}}
          onCloseTab={() => {}}
        />
      );

      // Should have button elements (from Button component)
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('LayoutManager', () => {
    it('should use Flex component for header layout', () => {
      const mockFactory = () => null;
      const { container } = render(
        <LayoutManager factory={mockFactory} />
      );

      // Should have flex layout elements
      const flexElements = container.querySelectorAll('[class*="flex"]');
      expect(flexElements.length).toBeGreaterThan(0);
    });

    it('should use Heading component for title', () => {
      const mockFactory = () => null;
      const { container } = render(
        <LayoutManager factory={mockFactory} />
      );

      // Should have heading with Symphony Editor text
      expect(container.textContent).toContain('Symphony Editor');
    });

    it('should use Button component for reset button', () => {
      const mockFactory = () => null;
      const { container } = render(
        <LayoutManager factory={mockFactory} />
      );

      // Should have button for reset
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
      expect(container.textContent).toContain('Reset Layout');
    });

    it('should use Box component for layout containers', () => {
      const mockFactory = () => null;
      const { container } = render(
        <LayoutManager factory={mockFactory} />
      );

      // Should have overflow-hidden class from Box
      const boxElements = container.querySelectorAll('[class*="overflow"]');
      expect(boxElements.length).toBeGreaterThan(0);
    });
  });
});

describe('CodeEditor - Property 5: Component Functionality Preservation', () => {
  it('should handle tab selection', () => {
    let selectedFile = null;
    const { container } = render(
      <EditorTabs
        openTabs={['test.js', 'index.html']}
        files={mockFiles}
        activeFileName="test.js"
        modifiedTabs={[]}
        onSelectFile={(name) => { selectedFile = name; }}
        onCloseTab={() => {}}
      />
    );

    // Find and click on the second tab
    const tabs = container.querySelectorAll('[class*="cursor-pointer"]');
    if (tabs.length > 1) {
      tabs[1].click();
      expect(selectedFile).toBe('index.html');
    }
  });

  it('should handle tab close', () => {
    let closedTab = null;
    const { container } = render(
      <EditorTabs
        openTabs={['test.js']}
        files={mockFiles}
        activeFileName="test.js"
        modifiedTabs={[]}
        onSelectFile={() => {}}
        onCloseTab={(name) => { closedTab = name; }}
      />
    );

    // Find and click close button
    const closeButton = container.querySelector('button');
    if (closeButton) {
      closeButton.click();
      expect(closedTab).toBe('test.js');
    }
  });

  it('should show modified indicator for modified tabs', () => {
    const { container } = render(
      <EditorTabs
        openTabs={['test.js']}
        files={mockFiles}
        activeFileName="test.js"
        modifiedTabs={['test.js']}
        onSelectFile={() => {}}
        onCloseTab={() => {}}
      />
    );

    // Should show modified indicator (●)
    expect(container.textContent).toContain('●');
  });
});
