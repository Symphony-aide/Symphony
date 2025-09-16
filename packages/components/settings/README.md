# @symphony/settings

A comprehensive settings management package providing various configuration components for the Symphony IDE.

## Overview

This package provides settings components for configuring different aspects of the Symphony application, including editor preferences, terminal settings, shortcuts, and various IDE behaviors.

## Exported Components

### `SettingsModal`
The main settings modal component that contains all configuration options.

**Features:**
- Tabbed interface for different setting categories
- Modal dialog with responsive design
- Save/cancel functionality
- Settings persistence

### `AutoSaveSettings`
Component for configuring automatic file saving behavior.

**Features:**
- Enable/disable auto-save
- Auto-save interval configuration
- Save on focus loss options

### `EditorThemeSettings`
Component for customizing editor appearance and themes.

**Features:**
- Theme selection (light/dark/custom)
- Font size and family configuration
- Color scheme customization
- Syntax highlighting preferences

### `GlobalSearchReplace`
Component for global search and replace functionality across files.

**Features:**
- Multi-file search and replace
- Regular expression support
- Case sensitivity options
- File type filtering

### `GlyphMarginSettings`
Component for configuring editor glyph margin display options.

**Features:**
- Line numbers visibility
- Folding controls
- Breakpoint indicators
- Git gutter settings

### `ShortcutSettingsModal`
Component for customizing keyboard shortcuts.

**Features:**
- Shortcut key assignment
- Conflict detection
- Default shortcuts restoration
- Custom shortcut creation

### `TabCompletionSettings`
Component for configuring code completion and IntelliSense behavior.

**Features:**
- Auto-completion enable/disable
- Suggestion trigger settings
- Completion item filtering
- Snippet configuration

### `TerminalSettings`
Component for configuring terminal appearance and behavior.

**Features:**
- Terminal theme selection
- Font configuration
- Shell selection
- Environment variables

## Exported Atoms

### `shortcutsAtom`
Jotai atom for managing keyboard shortcuts state.

**Features:**
- Global shortcuts state management
- localStorage persistence
- Default shortcuts fallback
- Reactive updates across components

**Usage:**
```tsx
import { shortcutsAtom } from "@symphony/settings";
import { useAtom } from "jotai";

const [shortcuts, setShortcuts] = useAtom(shortcutsAtom);

// Update shortcuts
setShortcuts([
  { operation: "save", shortcut: "ctrl+s" },
  { operation: "run", shortcut: "ctrl+r" }
]);
```

## Installation

```bash
# Using pnpm
pnpm install @symphony/settings
```

## Usage

```tsx
import {
  SettingsModal,
  AutoSaveSettings,
  EditorThemeSettings,
  ShortcutSettingsModal,
  shortcutsAtom
} from "@symphony/settings";

// Main settings modal
const App = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsSettingsOpen(true)}>
        Open Settings
      </button>
      
      {isSettingsOpen && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </>
  );
};

// Individual settings components
const CustomSettings = () => (
  <div>
    <AutoSaveSettings />
    <EditorThemeSettings />
    <TerminalSettings />
  </div>
);
```

## Default Shortcuts

The package comes with these default keyboard shortcuts:

- `ctrl+s`: Save file
- `ctrl+r`: Run code
- `ctrl+f`: Format code
- `ctrl+``: Toggle terminal

## Dependencies

- React
- Jotai (state management)
- Tailwind CSS (styling)
- Local storage utilities
