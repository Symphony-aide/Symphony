# Command Palette Component

Searchable command palette with keyboard shortcuts for Symphony IDE.

## Features

- ⌘K/Ctrl+K keyboard shortcut to open
- Fuzzy search with cmdk
- Grouped commands by category
- Icon support
- Keyboard shortcut hints
- Description support
- Accessible with keyboard navigation
- Search input component for header

## Usage

### Full Command Palette

```jsx
import { CommandPalette } from '@symphony/command-palette';
import { FolderOpen, FileText, Settings, Search } from 'lucide-react';
import { useState } from 'react';

function App() {
  const [open, setOpen] = useState(false);

  const commands = [
    {
      id: 'open-folder',
      label: 'Open Folder',
      description: 'Open an existing project folder',
      icon: FolderOpen,
      category: 'File',
      shortcut: '⌘O',
      action: () => console.log('Open folder')
    },
    {
      id: 'new-file',
      label: 'New File',
      description: 'Create a new file',
      icon: FileText,
      category: 'File',
      shortcut: '⌘N',
      action: () => console.log('New file')
    },
    {
      id: 'settings',
      label: 'Open Settings',
      icon: Settings,
      category: 'Preferences',
      shortcut: '⌘,',
      action: () => console.log('Settings')
    }
  ];

  return (
    <CommandPalette
      isOpen={open}
      onOpenChange={setOpen}
      commands={commands}
      onCommandSelect={(cmd) => cmd.action()}
    />
  );
}
```

### Search Input (for Header)

```jsx
import { CommandSearch, CommandPalette } from '@symphony/command-palette';
import { useState } from 'react';

function Header() {
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <>
      <CommandSearch onFocus={() => setPaletteOpen(true)} />
      <CommandPalette
        isOpen={paletteOpen}
        onOpenChange={setPaletteOpen}
        commands={commands}
      />
    </>
  );
}
```

## Props

### CommandPalette

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | `false` | Control palette visibility |
| `onOpenChange` | `function` | - | Callback when visibility changes |
| `commands` | `Command[]` | `[]` | Array of command objects |
| `placeholder` | `string` | `"Search or jump to... (⌘K)"` | Search input placeholder |
| `emptyMessage` | `string` | `"No results found."` | Empty state message |
| `onCommandSelect` | `function` | - | Callback when command is selected |
| `className` | `string` | `''` | Additional CSS classes |

### CommandSearch

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onFocus` | `function` | - | Callback when input is focused |
| `placeholder` | `string` | `"Search or jump to... (⌘K)"` | Input placeholder |
| `className` | `string` | `''` | Additional CSS classes |

### Command Object

```typescript
{
  id: string;              // Unique identifier
  label: string;           // Display text
  description?: string;    // Optional description
  icon?: LucideIcon;       // Optional icon
  category?: string;       // Group category (default: "General")
  shortcut?: string;       // Keyboard shortcut hint
  action?: function;       // Command action handler
}
```

## Keyboard Shortcuts

- **⌘K / Ctrl+K**: Open/close palette
- **↑ / ↓**: Navigate commands
- **Enter**: Execute selected command
- **Esc**: Close palette
