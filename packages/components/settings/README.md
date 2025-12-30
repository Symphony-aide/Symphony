# @symphony/settings

A comprehensive settings management package providing various configuration components for the Symphony IDE.

## Overview

This package provides settings components for configuring different aspects of the Symphony application, including editor preferences, terminal settings, shortcuts, and various IDE behaviors.

## Architecture

All settings components are built using Symphony's UI component library (`@symphony/ui`) to ensure:

- **Consistent Design**: Unified look and feel across all settings interfaces
- **Accessibility**: ARIA-compliant components built on Radix UI primitives
- **Maintainability**: No pure HTML elements - all UI rendered through design system components
- **Theming**: Full theme support through the UI component system

### UI Components Used

| Component | UI Components |
|-----------|---------------|
| `SettingsModal` | Dialog, Tabs, TabsList, TabsTrigger, TabsContent, Button, Badge, Flex, Heading |
| `AutoSaveSettings` | Card, Heading, Text, Checkbox, Input, Label, Flex |
| `EditorThemeSettings` | Flex, Box, Select, Input, Label |
| `TerminalSettings` | Flex, Box, Select, Input, Label |
| `GlyphMarginSettings` | Card, Heading, Checkbox, Flex |
| `TabCompletionSettings` | Card, Heading, Text, Checkbox, Flex |
| `GlobalSearchReplace` | Flex, Input, Button |
| `ShortcutSettingsModal` | Flex, Text, Input, Button |
| `EnhancedThemeSettings` | Flex, Card, Heading, Box, Button |

## Exported Components

### `SettingsModal`
The main settings modal component that contains all configuration options.

**Features:**
- Tabbed interface for different setting categories (Editor, Terminal, Shortcuts, Search)
- Scope selector (Global vs Project settings)
- Modal dialog with responsive design
- Settings persistence with scope inheritance

### `AutoSaveSettings`
Component for configuring automatic file saving behavior.

**Features:**
- Enable/disable auto-save via Checkbox component
- Auto-save interval configuration via Input component
- Card-based layout with clear visual hierarchy

### `EditorThemeSettings`
Component for customizing editor appearance and themes.

**Features:**
- Theme selection via Select component (vs-dark, vs-light, hc-black)
- Font size configuration via Input component
- Font family selection via Select component

### `EnhancedThemeSettings`
Extended theme settings with scope awareness and inheritance display.

**Features:**
- Shows inheritance status from global settings
- Reset to global defaults functionality
- Visual indicator for overridden settings

### `GlobalSearchReplace`
Component for global search and replace functionality across files.

**Features:**
- Search and replace Input fields
- Replace All Button action
- Flex-based responsive layout

### `GlyphMarginSettings`
Component for configuring editor glyph margin display options.

**Features:**
- Enable/disable glyph margin via Checkbox
- Card-based container with Heading

### `ShortcutSettingsModal`
Component for customizing keyboard shortcuts.

**Features:**
- Editable shortcut Input fields
- Save and Close Button actions
- Dynamic shortcut list rendering

### `TabCompletionSettings`
Component for configuring code completion and IntelliSense behavior.

**Features:**
- Enable/disable tab completion via Checkbox
- Descriptive Text component for explanation
- Card-based layout

### `TerminalSettings`
Component for configuring terminal appearance and behavior.

**Features:**
- Font family selection via Select component
- Font size and line height via Input components
- Font weight and cursor style via Select components

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
      <Button onClick={() => setIsSettingsOpen(true)}>
        Open Settings
      </Button>
      
      <SettingsModal
        shortcuts={shortcuts}
        setShortcuts={setShortcuts}
        autoSaveSettings={autoSaveSettings}
        setAutoSaveSettings={setAutoSaveSettings}
        // ... other props
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};

// Individual settings components
const CustomSettings = () => (
  <Flex direction="column" gap={4}>
    <AutoSaveSettings 
      enabled={true} 
      interval={30} 
      onChange={handleChange} 
    />
    <EditorThemeSettings 
      themeSettings={themeSettings}
      setThemeSettings={setThemeSettings}
    />
    <TerminalSettings 
      terminalSettings={terminalSettings}
      setTerminalSettings={setTerminalSettings}
    />
  </Flex>
);
```

## Testing

The package includes comprehensive property-based tests to verify UI component usage:

```bash
# Run settings tests
pnpm test

# Run with coverage
pnpm test:coverage
```

### Test Categories

- **Property 1: No Pure HTML Elements** - Verifies all components use UI components
- **Property 5: Component Functionality Preservation** - Verifies all interactions work correctly

## Default Shortcuts

The package comes with these default keyboard shortcuts:

- `ctrl+s`: Save file
- `ctrl+r`: Run code
- `ctrl+f`: Format code
- `ctrl+``: Toggle terminal

## Dependencies

- React
- @symphony/ui (design system)
- Jotai (state management)
- Tailwind CSS (styling)
