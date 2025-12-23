# @symphony/file-explorer

A comprehensive file explorer component with advanced file management, search, filtering, and git integration capabilities.

## Overview

This package provides a feature-rich file explorer for the Symphony application, including file tree navigation, drag & drop support, context menus, search functionality, and git status integration.

## UI Component Integration

The FileExplorer component uses Symphony's design system components from `@symphony/ui`:

- **Flex** - Layout containers for header and file tree sections
- **Heading** - Explorer title with proper semantic markup
- **Text** - Empty state messages and labels
- **Button** - Settings button and interactive elements
- **ScrollArea** - Scrollable content area for file tree
- **Tabs, TabsList, TabsTrigger, TabsContent** - Tab navigation for files/search views

This ensures consistent styling, accessibility, and theming across the Symphony IDE.

## Exported Components

### `FileExplorer`
The main file explorer component that orchestrates all file management functionality.

**Features:**
- File tree navigation with expand/collapse
- Drag & drop file reordering
- File and folder operations (create, rename, delete)
- Search and filtering capabilities
- Git status integration
- Context menu support
- Tab management for files and search

**Usage:**
```tsx
import { FileExplorer } from "@symphony/file-explorer";

<FileExplorer
  files={files}
  activeFileName={activeFileName}
  onSelectFile={handleSelectFile}
  onNewFile={handleNewFile}
  onDeleteFile={handleDeleteFile}
  onRenameFile={handleRenameFile}
  gitStatusMap={gitStatusMap}
  onGitStage={handleGitStage}
/>
```

### `FileTreeNode`
Individual file/folder node component with drag & drop and context menu support.

**Features:**
- File/folder rendering with icons
- Drag & drop functionality
- Inline renaming
- Git status indicators
- Context menu integration

### `FilterControls`
Component for filtering files by extension, size, status, and sorting options.

**Features:**
- Extension-based filtering
- File size filtering
- Git status filtering
- Multiple sorting options (name, size, date)

### `SearchTab`
Search functionality component with file filtering capabilities.

**Features:**
- File content search
- Search result highlighting
- Filter integration
- Real-time search updates

### `ContextMenu`
Right-click context menu for file and folder operations.

**Features:**
- File operations (rename, delete, download)
- Folder operations (create, rename, delete)
- Git operations (stage, commit, revert)
- Context-sensitive menu items

### `ActionButtons`
Action buttons for creating new files, folders, and uploading files.

**Features:**
- New file creation
- New folder creation
- File upload functionality
- Accessible button design

## Exported Hooks

### `useFolderOperations`
Custom hook for managing folder state and operations.

**Features:**
- Folder expansion state management
- Folder creation, renaming, deletion
- localStorage persistence
- Folder hierarchy management

**Usage:**
```tsx
import { useFolderOperations } from "@symphony/file-explorer";

const {
  userFolders,
  expanded,
  toggleExpand,
  createFolder,
  renameFolder,
  deleteFolder
} = useFolderOperations(files, onRenameFile, onDeleteFile);
```

### `useFileTree`
Custom hook for building and managing the file tree structure.

**Features:**
- File tree construction
- Filtering and sorting
- Status management
- Tree optimization

**Usage:**
```tsx
import { useFileTree } from "@symphony/file-explorer";

const { filteredTree, fileStats } = useFileTree(
  files,
  userFolders,
  expanded,
  searchTerm,
  filters
);
```

## Installation

```bash
# Using pnpm
pnpm install @symphony/file-explorer
```

## Usage

```tsx
import {
  FileExplorer,
  FileTreeNode,
  FilterControls,
  SearchTab,
  ContextMenu,
  ActionButtons,
  useFolderOperations,
  useFileTree
} from "@symphony/file-explorer";

// Complete file explorer setup
const App = () => {
  const [files, setFiles] = useState([]);
  const [activeFileName, setActiveFileName] = useState(null);

  return (
    <FileExplorer
      files={files}
      activeFileName={activeFileName}
      onSelectFile={setActiveFileName}
      onNewFile={handleNewFile}
      onDeleteFile={handleDeleteFile}
      onRenameFile={handleRenameFile}
      onUploadFile={handleUploadFile}
      gitStatusMap={gitStatusMap}
      onGitStage={handleGitStage}
      onGitCommit={handleGitCommit}
      onGitRevert={handleGitRevert}
    />
  );
};
```

## Testing

The package includes a Vitest configuration for running unit and property-based tests.

### Running Tests

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Test File Conventions

| Pattern | Description |
|---------|-------------|
| `*.test.{js,jsx}` | Standard unit tests |
| `*.property.test.{js,jsx}` | Property-based tests using fast-check |

Test files should be placed in the `__tests__/` directory.

## Dependencies

- React
- @symphony/ui (Flex, Heading, Text, Button, ScrollArea, Tabs)
- Lucide React (icons)
- File system utilities
- Git integration libraries
