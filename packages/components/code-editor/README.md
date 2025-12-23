# @symphony/code-editor

A comprehensive code editor package built with Monaco Editor and React, providing a full-featured IDE experience with file management, syntax highlighting, and layout management.

## Overview

This package provides the main code editor components for the Symphony application, featuring a flexible layout system with Monaco Editor integration, file management, and various editor panels.

The component uses Symphony's UI design system (`@symphony/ui`) for consistent styling and layout, including `Flex`, `Box`, `Text`, and `Button` components for the editor interface.

## Exported Components

### `Editor`
The main editor component that orchestrates the entire IDE experience with a flexible layout system.

**Features:**
- Monaco Editor integration with syntax highlighting
- Flexible layout management using FlexLayout
- File management and tab system
- Settings modal integration
- Terminal integration
- Outline view support
- Auto-save functionality
- Keyboard shortcuts support

**Usage:**
```tsx
import { Editor } from "@symphony/code-editor";

<Editor
  files={files}
  activeFileName={activeFileName}
  onFileChange={handleFileChange}
  onSave={handleSave}
/>
```

### `EditorPanel`
A panel component that wraps the Monaco Editor with additional functionality.

**Features:**
- Monaco Editor instance management
- File content editing
- Syntax highlighting with enhanced language detection
- Code completion
- Error highlighting
- Edit/Preview mode toggle
- Uses Symphony UI components (`Flex`, `Box`, `Text`, `Button`) for consistent styling
- Language confidence indicator
- Line count display

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `files` | `Array` | Array of file objects with name and content |
| `activeFileName` | `string` | Currently active file name |
| `onSelectFile` | `function` | Callback when a file is selected |
| `openTabs` | `Array` | Array of open tab names |
| `onChange` | `function` | Callback when content changes |
| `terminalVisible` | `boolean` | Whether terminal is visible |
| `onCloseTab` | `function` | Callback when a tab is closed |
| `editorRef` | `ref` | Ref to the Monaco editor instance |
| `glyphMarginSettings` | `object` | Glyph margin configuration |
| `modifiedTabs` | `Array` | Array of modified tab names |
| `themeSettings` | `object` | Theme configuration (theme, fontSize, fontFamily) |
| `onLanguageDetected` | `function` | Callback when language is detected |

### `FilesProvider`
A context provider for managing file state across the editor components.

**Features:**
- File state management
- Context-based file operations
- Centralized file data handling

### `monacoOptions`
Configuration object containing default Monaco Editor options.

**Features:**
- Pre-configured editor settings
- Theme configurations
- Language support settings
- Editor behavior options

## Installation

```bash
# Using pnpm
pnpm install @symphony/code-editor
```

## Usage

```tsx
import { Editor, EditorPanel, FilesProvider, monacoOptions } from "@symphony/code-editor";

// Basic editor setup
const App = () => (
  <FilesProvider>
    <Editor
      files={files}
      activeFileName={activeFileName}
      onFileChange={handleFileChange}
    />
  </FilesProvider>
);

// Custom Monaco options
const customOptions = {
  ...monacoOptions,
  theme: 'vs-dark',
  fontSize: 14
};
```

## Dependencies

- React
- Monaco Editor
- FlexLayout React
- Jotai (state management)
- Lodash
- Hotkeys-js
- Use-undo
- @symphony/ui (Flex, Box, Text, Button components)
- @symphony/commands
- @symphony/syntax-highlighting

## UI Component Integration

The EditorPanel component uses Symphony's UI design system for consistent styling:

```tsx
import { Flex, Box, Text, Button } from "ui";

// Layout structure
<Flex direction="column" className="h-full w-full">
  <EditorTabs ... />
  <Box className="flex-grow">
    <Flex align="center" justify="between">
      <Text size="xs">{languageInfo}</Text>
      <Button variant="ghost" size="sm">Edit</Button>
      <Button variant="ghost" size="sm">Preview</Button>
    </Flex>
    {/* Monaco Editor or Preview */}
  </Box>
</Flex>
```

This ensures visual consistency with other Symphony IDE components and follows the component migration pattern established in the `component-packages-migration` spec.