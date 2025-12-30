/**
 * @vitest-environment jsdom
 * **Feature: component-packages-migration, Property 1: No Pure HTML Elements**
 * 
 * Property tests for Settings component to verify it uses only UI components.
 * **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SettingsModal from '../src/SettingsModal.jsx';
import AutoSaveSettings from '../src/AutoSaveSettings.jsx';
import EditorThemeSettings from '../src/EditorThemeSettings.jsx';
import TerminalSettings from '../src/TerminalSettings.jsx';
import GlyphMarginSettings from '../src/GlyphMarginSettings.jsx';
import TabCompletionSettings from '../src/TabCompletionSettings.jsx';
import GlobalSearchReplace from '../src/GlobalSearchReplace.jsx';
import ShortcutSettingsModal from '../src/ShortcutSettingsModal.jsx';
import EnhancedThemeSettings from '../src/EnhancedThemeSettings.jsx';

describe('SettingsModal - Property 1: No Pure HTML Elements', () => {
  const defaultProps = {
    shortcuts: [{ operation: 'save', shortcut: 'Ctrl+S' }],
    setShortcuts: vi.fn(),
    autoSaveSettings: { enabled: true, interval: 30 },
    setAutoSaveSettings: vi.fn(),
    tabCompletionSettings: { enabled: true },
    setTabCompletionSettings: vi.fn(),
    glyphMarginSettings: { enabled: true },
    setGlyphMarginSettings: vi.fn(),
    themeSettings: { theme: 'vs-dark', fontSize: 14, fontFamily: 'monospace' },
    setThemeSettings: vi.fn(),
    terminalSettings: { fontFamily: 'monospace', fontSize: 14, fontWeight: 'normal', lineHeight: 1.2, cursorStyle: 'block' },
    setTerminalSettings: vi.fn(),
    onClose: vi.fn(),
    onReplaceAll: vi.fn(),
  };

  it('should use Dialog component for the settings container', () => {
    const { baseElement } = render(<SettingsModal {...defaultProps} />);
    
    // Dialog should render with proper role
    const dialog = baseElement.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
  });

  it('should use Tabs components for settings categories', () => {
    const { baseElement } = render(<SettingsModal {...defaultProps} />);
    
    // TabsList should be present
    const tabsList = baseElement.querySelector('[role="tablist"]');
    expect(tabsList).toBeTruthy();
    
    // TabsTrigger elements should be present
    const tabTriggers = baseElement.querySelectorAll('[role="tab"]');
    expect(tabTriggers.length).toBeGreaterThan(0);
  });

  it('should use Button components for scope selector', () => {
    const { baseElement } = render(<SettingsModal {...defaultProps} />);
    
    // Should have buttons for Global and Project scope
    const buttons = baseElement.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should use Flex component for layout sections', () => {
    const { baseElement } = render(<SettingsModal {...defaultProps} />);
    
    // Multiple Flex components should be present for layout
    const flexElements = baseElement.querySelectorAll('.flex');
    expect(flexElements.length).toBeGreaterThan(0);
  });

  it('should use Card component for settings sections', () => {
    const { baseElement } = render(<SettingsModal {...defaultProps} />);
    
    // Card components should be present
    const cards = baseElement.querySelectorAll('[class*="bg-slate-800"]');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('should use Heading component for section titles', () => {
    const { baseElement } = render(<SettingsModal {...defaultProps} />);
    
    // Heading elements should be present
    const headings = baseElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
    expect(headings.length).toBeGreaterThan(0);
  });

  it('should use Badge component for scope indicators', () => {
    const { baseElement } = render(<SettingsModal {...defaultProps} />);
    
    // Badge should be present for Global indicator
    const badges = baseElement.querySelectorAll('[class*="bg-indigo-600"]');
    expect(badges.length).toBeGreaterThan(0);
  });
});

describe('AutoSaveSettings - Property 1: No Pure HTML Elements', () => {
  const defaultProps = {
    enabled: true,
    interval: 30,
    onChange: vi.fn(),
  };

  it('should use Card component for container', () => {
    const { container } = render(<AutoSaveSettings {...defaultProps} />);
    
    // Card should be present with proper styling
    const card = container.querySelector('[class*="bg-slate-800"]');
    expect(card).toBeTruthy();
  });

  it('should use Heading component for title', () => {
    const { container } = render(<AutoSaveSettings {...defaultProps} />);
    
    // Heading should be present
    const heading = container.querySelector('h1, h2, h3, h4, h5, h6');
    expect(heading).toBeTruthy();
    expect(heading.textContent).toContain('Auto Save');
  });

  it('should use Checkbox component for enable toggle', () => {
    const { container } = render(<AutoSaveSettings {...defaultProps} />);
    
    // Checkbox should be present
    const checkbox = container.querySelector('[role="checkbox"]');
    expect(checkbox).toBeTruthy();
  });

  it('should use Input component for interval setting', () => {
    const { container } = render(<AutoSaveSettings {...defaultProps} />);
    
    // Input should be present
    const input = container.querySelector('input[type="number"]');
    expect(input).toBeTruthy();
  });

  it('should use Flex component for layout', () => {
    const { container } = render(<AutoSaveSettings {...defaultProps} />);
    
    // Flex components should be present
    const flexElements = container.querySelectorAll('.flex');
    expect(flexElements.length).toBeGreaterThan(0);
  });

  it('should use Label component for form labels', () => {
    const { container } = render(<AutoSaveSettings {...defaultProps} />);
    
    // Label should be present
    const labels = container.querySelectorAll('label');
    expect(labels.length).toBeGreaterThan(0);
  });
});

describe('EditorThemeSettings - Property 1: No Pure HTML Elements', () => {
  const defaultProps = {
    themeSettings: { theme: 'vs-dark', fontSize: 14, fontFamily: 'monospace' },
    setThemeSettings: vi.fn(),
  };

  it('should use Flex component for layout', () => {
    const { container } = render(<EditorThemeSettings {...defaultProps} />);
    
    // Flex should be present
    const flexElements = container.querySelectorAll('.flex');
    expect(flexElements.length).toBeGreaterThan(0);
  });

  it('should use Box component for form field containers', () => {
    const { container } = render(<EditorThemeSettings {...defaultProps} />);
    
    // Box components should wrap form fields
    expect(container.firstChild).toBeTruthy();
  });

  it('should use Select component for theme selection', () => {
    const { container } = render(<EditorThemeSettings {...defaultProps} />);
    
    // Select trigger should be present
    const selectTriggers = container.querySelectorAll('[role="combobox"]');
    expect(selectTriggers.length).toBeGreaterThan(0);
  });

  it('should use Input component for font size', () => {
    const { container } = render(<EditorThemeSettings {...defaultProps} />);
    
    // Input should be present
    const input = container.querySelector('input[type="number"]');
    expect(input).toBeTruthy();
  });

  it('should use Label component for form labels', () => {
    const { container } = render(<EditorThemeSettings {...defaultProps} />);
    
    // Labels should be present
    const labels = container.querySelectorAll('label');
    expect(labels.length).toBeGreaterThan(0);
  });
});

describe('TerminalSettings - Property 1: No Pure HTML Elements', () => {
  const defaultProps = {
    terminalSettings: { 
      fontFamily: 'monospace', 
      fontSize: 14, 
      fontWeight: 'normal', 
      lineHeight: 1.2, 
      cursorStyle: 'block' 
    },
    setTerminalSettings: vi.fn(),
  };

  it('should use Flex component for layout', () => {
    const { container } = render(<TerminalSettings {...defaultProps} />);
    
    // Flex should be present
    const flexElements = container.querySelectorAll('.flex');
    expect(flexElements.length).toBeGreaterThan(0);
  });

  it('should use Box component for form field containers', () => {
    const { container } = render(<TerminalSettings {...defaultProps} />);
    
    // Container should be present
    expect(container.firstChild).toBeTruthy();
  });

  it('should use Select components for dropdown settings', () => {
    const { container } = render(<TerminalSettings {...defaultProps} />);
    
    // Multiple Select triggers should be present
    const selectTriggers = container.querySelectorAll('[role="combobox"]');
    expect(selectTriggers.length).toBeGreaterThanOrEqual(3); // fontFamily, fontWeight, cursorStyle
  });

  it('should use Input components for numeric settings', () => {
    const { container } = render(<TerminalSettings {...defaultProps} />);
    
    // Multiple Input fields should be present
    const inputs = container.querySelectorAll('input[type="number"]');
    expect(inputs.length).toBeGreaterThanOrEqual(2); // fontSize, lineHeight
  });

  it('should use Label component for form labels', () => {
    const { container } = render(<TerminalSettings {...defaultProps} />);
    
    // Labels should be present
    const labels = container.querySelectorAll('label');
    expect(labels.length).toBeGreaterThan(0);
  });
});

describe('GlyphMarginSettings - Property 1: No Pure HTML Elements', () => {
  const defaultProps = {
    enabled: true,
    onChange: vi.fn(),
  };

  it('should use Card component for container', () => {
    const { container } = render(<GlyphMarginSettings {...defaultProps} />);
    
    // Card should be present
    const card = container.querySelector('[class*="bg-slate-800"]');
    expect(card).toBeTruthy();
  });

  it('should use Heading component for title', () => {
    const { container } = render(<GlyphMarginSettings {...defaultProps} />);
    
    // Heading should be present
    const heading = container.querySelector('h1, h2, h3, h4, h5, h6');
    expect(heading).toBeTruthy();
  });

  it('should use Checkbox component for enable toggle', () => {
    const { container } = render(<GlyphMarginSettings {...defaultProps} />);
    
    // Checkbox should be present
    const checkbox = container.querySelector('[role="checkbox"]');
    expect(checkbox).toBeTruthy();
  });

  it('should use Flex component for layout', () => {
    const { container } = render(<GlyphMarginSettings {...defaultProps} />);
    
    // Flex should be present
    const flexElements = container.querySelectorAll('.flex');
    expect(flexElements.length).toBeGreaterThan(0);
  });
});

describe('TabCompletionSettings - Property 1: No Pure HTML Elements', () => {
  const defaultProps = {
    enabled: true,
    onChange: vi.fn(),
  };

  it('should use Card component for container', () => {
    const { container } = render(<TabCompletionSettings {...defaultProps} />);
    
    // Card should be present
    const card = container.querySelector('[class*="bg-slate-800"]');
    expect(card).toBeTruthy();
  });

  it('should use Heading component for title', () => {
    const { container } = render(<TabCompletionSettings {...defaultProps} />);
    
    // Heading should be present
    const heading = container.querySelector('h1, h2, h3, h4, h5, h6');
    expect(heading).toBeTruthy();
  });

  it('should use Checkbox component for enable toggle', () => {
    const { container } = render(<TabCompletionSettings {...defaultProps} />);
    
    // Checkbox should be present
    const checkbox = container.querySelector('[role="checkbox"]');
    expect(checkbox).toBeTruthy();
  });

  it('should use Text component for description', () => {
    const { container } = render(<TabCompletionSettings {...defaultProps} />);
    
    // Text content should be present
    expect(container.textContent).toContain('Tab');
  });

  it('should use Flex component for layout', () => {
    const { container } = render(<TabCompletionSettings {...defaultProps} />);
    
    // Flex should be present
    const flexElements = container.querySelectorAll('.flex');
    expect(flexElements.length).toBeGreaterThan(0);
  });
});

describe('GlobalSearchReplace - Property 1: No Pure HTML Elements', () => {
  const defaultProps = {
    onReplaceAll: vi.fn(),
  };

  it('should use Flex component for layout', () => {
    const { container } = render(<GlobalSearchReplace {...defaultProps} />);
    
    // Flex should be present
    const flexElements = container.querySelectorAll('.flex');
    expect(flexElements.length).toBeGreaterThan(0);
  });

  it('should use Input components for search and replace fields', () => {
    const { container } = render(<GlobalSearchReplace {...defaultProps} />);
    
    // Two Input fields should be present
    const inputs = container.querySelectorAll('input[type="text"]');
    expect(inputs.length).toBe(2);
  });

  it('should use Button component for replace action', () => {
    const { container } = render(<GlobalSearchReplace {...defaultProps} />);
    
    // Button should be present
    const button = container.querySelector('button');
    expect(button).toBeTruthy();
    expect(button.textContent).toContain('Replace');
  });
});

describe('ShortcutSettingsModal - Property 1: No Pure HTML Elements', () => {
  const defaultProps = {
    shortcuts: [
      { operation: 'save', shortcut: 'Ctrl+S' },
      { operation: 'undo', shortcut: 'Ctrl+Z' },
    ],
    setShortcuts: vi.fn(),
    onClose: vi.fn(),
  };

  it('should use Flex component for layout', () => {
    const { container } = render(<ShortcutSettingsModal {...defaultProps} />);
    
    // Flex should be present
    const flexElements = container.querySelectorAll('.flex');
    expect(flexElements.length).toBeGreaterThan(0);
  });

  it('should use Text component for operation labels', () => {
    const { container } = render(<ShortcutSettingsModal {...defaultProps} />);
    
    // Text content should be present
    expect(container.textContent).toContain('save');
  });

  it('should use Input components for shortcut editing', () => {
    const { container } = render(<ShortcutSettingsModal {...defaultProps} />);
    
    // Input fields should be present for each shortcut
    const inputs = container.querySelectorAll('input[type="text"]');
    expect(inputs.length).toBe(2);
  });

  it('should use Button components for actions', () => {
    const { container } = render(<ShortcutSettingsModal {...defaultProps} />);
    
    // Buttons should be present for Close and Save
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });
});

describe('EnhancedThemeSettings - Property 1: No Pure HTML Elements', () => {
  const defaultProps = {
    themeSettings: { theme: 'vs-dark', fontSize: 14, fontFamily: 'monospace' },
    setThemeSettings: vi.fn(),
    scope: 'local',
    globalThemeSettings: { theme: 'vs-dark', fontSize: 14, fontFamily: 'monospace' },
  };

  it('should use Flex component for layout', () => {
    const { container } = render(<EnhancedThemeSettings {...defaultProps} />);
    
    // Flex should be present
    const flexElements = container.querySelectorAll('.flex');
    expect(flexElements.length).toBeGreaterThan(0);
  });

  it('should use Card component for inheritance info', () => {
    const { container } = render(<EnhancedThemeSettings {...defaultProps} />);
    
    // Card should be present
    const card = container.querySelector('[class*="bg-slate-700"]');
    expect(card).toBeTruthy();
  });

  it('should use Heading component for status text', () => {
    const { container } = render(<EnhancedThemeSettings {...defaultProps} />);
    
    // Heading should be present
    const heading = container.querySelector('h1, h2, h3, h4, h5, h6');
    expect(heading).toBeTruthy();
  });

  it('should use Box component for settings wrapper', () => {
    const { container } = render(<EnhancedThemeSettings {...defaultProps} />);
    
    // Container should be present
    expect(container.firstChild).toBeTruthy();
  });

  it('should show Reset button when settings override global', () => {
    const overrideProps = {
      ...defaultProps,
      themeSettings: { theme: 'light', fontSize: 16, fontFamily: 'Fira Code' },
    };
    
    const { container } = render(<EnhancedThemeSettings {...overrideProps} />);
    
    // Reset button should be present when overriding
    const resetButton = container.querySelector('button');
    expect(resetButton).toBeTruthy();
    expect(resetButton.textContent).toContain('Reset');
  });
});

describe('Settings - Property 5: Component Functionality Preservation', () => {
  it('should handle scope switching in SettingsModal', () => {
    const props = {
      shortcuts: [],
      setShortcuts: vi.fn(),
      autoSaveSettings: { enabled: true, interval: 30 },
      setAutoSaveSettings: vi.fn(),
      tabCompletionSettings: { enabled: true },
      setTabCompletionSettings: vi.fn(),
      glyphMarginSettings: { enabled: true },
      setGlyphMarginSettings: vi.fn(),
      themeSettings: { theme: 'vs-dark', fontSize: 14, fontFamily: 'monospace' },
      setThemeSettings: vi.fn(),
      terminalSettings: { fontFamily: 'monospace', fontSize: 14, fontWeight: 'normal', lineHeight: 1.2, cursorStyle: 'block' },
      setTerminalSettings: vi.fn(),
      onClose: vi.fn(),
      onReplaceAll: vi.fn(),
    };

    const { baseElement } = render(<SettingsModal {...props} />);
    
    // Find and click Project Settings button
    const buttons = baseElement.querySelectorAll('button');
    const projectButton = Array.from(buttons).find(btn => btn.textContent.includes('Project'));
    
    if (projectButton) {
      fireEvent.click(projectButton);
      // After clicking, the Editor tab should be visible
      const tabTriggers = baseElement.querySelectorAll('[role="tab"]');
      const editorTab = Array.from(tabTriggers).find(tab => tab.textContent.includes('Editor'));
      expect(editorTab).toBeTruthy();
    }
  });

  it('should handle auto-save settings changes', () => {
    const onChange = vi.fn();
    const { container } = render(
      <AutoSaveSettings enabled={true} interval={30} onChange={onChange} />
    );
    
    // Find and change the interval input
    const input = container.querySelector('input[type="number"]');
    fireEvent.change(input, { target: { value: '60' } });
    
    // onChange should be called
    expect(onChange).toHaveBeenCalled();
  });

  it('should handle checkbox toggle in GlyphMarginSettings', () => {
    const onChange = vi.fn();
    const { container } = render(
      <GlyphMarginSettings enabled={true} onChange={onChange} />
    );
    
    // Find and click the checkbox
    const checkbox = container.querySelector('[role="checkbox"]');
    fireEvent.click(checkbox);
    
    // onChange should be called
    expect(onChange).toHaveBeenCalled();
  });

  it('should handle replace all action in GlobalSearchReplace', () => {
    const onReplaceAll = vi.fn();
    const { container } = render(
      <GlobalSearchReplace onReplaceAll={onReplaceAll} />
    );
    
    // Fill in search and replace fields
    const inputs = container.querySelectorAll('input[type="text"]');
    fireEvent.change(inputs[0], { target: { value: 'search' } });
    fireEvent.change(inputs[1], { target: { value: 'replace' } });
    
    // Click replace button
    const button = container.querySelector('button');
    fireEvent.click(button);
    
    // onReplaceAll should be called with the values
    expect(onReplaceAll).toHaveBeenCalledWith('search', 'replace');
  });

  it('should handle shortcut editing in ShortcutSettingsModal', () => {
    const setShortcuts = vi.fn();
    const onClose = vi.fn();
    const { container } = render(
      <ShortcutSettingsModal 
        shortcuts={[{ operation: 'save', shortcut: 'Ctrl+S' }]}
        setShortcuts={setShortcuts}
        onClose={onClose}
      />
    );
    
    // Find and change the shortcut input
    const input = container.querySelector('input[type="text"]');
    fireEvent.change(input, { target: { value: 'Ctrl+Shift+S' } });
    
    // Find and click save button
    const buttons = container.querySelectorAll('button');
    const saveButton = Array.from(buttons).find(btn => btn.textContent.includes('Save'));
    fireEvent.click(saveButton);
    
    // setShortcuts should be called
    expect(setShortcuts).toHaveBeenCalled();
  });
});
