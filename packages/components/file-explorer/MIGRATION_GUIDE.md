# File-Explorer Migration Guide
## [Page, Feature, Component] Architecture

## Overview
This guide helps you migrate from the old file-explorer architecture to the new [Page, Feature, Component] pattern using extracted features.

## New Features Available

### 1. FolderManagement Feature
Handles folder operations and state management.

```javascript
import { useFolderManagement } from '@symphony/features/FolderManagement';

function MyExplorer() {
  const folderManagement = useFolderManagement({
    files,
    onRenameFile,
    onDeleteFile
  });

  return (
    <div>
      <button onClick={() => folderManagement.createFolder()}>
        New Folder
      </button>
      {folderManagement.userFolders.map(folder => (
        <div key={folder}>{folder}</div>
      ))}
    </div>
  );
}
```

### 2. FileTree Feature
Builds and manages file tree structure with filtering and sorting.

```javascript
import { useFileTree } from '@symphony/features/FileTree';

function MyTreeView() {
  const fileTree = useFileTree({
    files,
    userFolders,
    modifiedTabs,
    gitStatusMap
  });

  const filteredTree = fileTree.filterTree('all', 'all', 'all', searchTerm);

  return <TreeView tree={filteredTree} />;
}
```

### 3. FileSearch Feature
Provides file search functionality.

```javascript
import { useFileSearch } from '@symphony/features/FileSearch';

function MySearch() {
  const search = useFileSearch(files);

  return (
    <div>
      <input 
        value={search.searchTerm}
        onChange={(e) => search.setSearchTerm(e.target.value)}
      />
      <div>Found {search.resultCount} files</div>
      {search.results.map(file => (
        <div key={file.name}>{file.name}</div>
      ))}
    </div>
  );
}
```

## Migration Examples

### Before (Old Pattern)
```javascript
import FileExplorer from '@symphony/file-explorer';
import { useFolderOperations } from '@symphony/file-explorer/hooks/useFolderOperations';
import { useFileTree } from '@symphony/file-explorer/hooks/useFileTree';

function MyComponent() {
  const folderOps = useFolderOperations(files, onRenameFile, onDeleteFile);
  const fileTree = useFileTree(files, folderOps.userFolders, modifiedTabs, gitStatusMap);

  return (
    <FileExplorer
      files={files}
      onSelectFile={onSelectFile}
      // ... many props
    />
  );
}
```

### After (New Pattern)
```javascript
import { useFolderManagement } from '@symphony/features/FolderManagement';
import { useFileTree } from '@symphony/features/FileTree';
import { useFileSearch } from '@symphony/features/FileSearch';

function MyComponent() {
  const folderManagement = useFolderManagement({
    files,
    onRenameFile,
    onDeleteFile
  });

  const fileTree = useFileTree({
    files,
    userFolders: folderManagement.userFolders,
    modifiedTabs,
    gitStatusMap
  });

  const search = useFileSearch(files);

  return (
    <div>
      {/* Your custom UI using the features */}
    </div>
  );
}
```

## API Changes

### FolderManagement

| Old API | New API | Notes |
|---------|---------|-------|
| `useFolderOperations()` | `useFolderManagement()` | More descriptive name |
| `createFolder(parent)` | `createFolder(parent)` | Same |
| `renameFolder(old, new)` | `renameFolder(old, new)` | Same |
| `deleteFolder(path)` | `deleteFolder(path)` | Same |
| `toggleExpand(path)` | `toggleExpand(path)` | Same |
| N/A | `expandAll()` | New helper method |
| N/A | `collapseAll()` | New helper method |

### FileTree

| Old API | New API | Notes |
|---------|---------|-------|
| `useFileTree()` | `useFileTree()` | Same name, different structure |
| `tree` | `tree` | Same |
| `filterTree()` | `filterTree(ext, size, status, search)` | Cleaner parameters |
| `sortChildren()` | `sortChildren(children, sortBy)` | Same |
| `getStatus()` | `getStatus(file)` | Same |
| `statusBadge()` | `statusBadge(status)` | Same |

### FileSearch

| Old API | New API | Notes |
|---------|---------|-------|
| Local state | `useFileSearch()` | New feature |
| N/A | `searchTerm` | Search term state |
| N/A | `results` | Search results |
| N/A | `searchByName` | Name-only search |
| N/A | `searchByContent` | Content-only search |
| N/A | `clearSearch()` | Clear search |

## Step-by-Step Migration

### Step 1: Install New Features
```bash
pnpm install
```

### Step 2: Update Imports
```javascript
// Replace this
import { useFolderOperations } from '@symphony/file-explorer/hooks/useFolderOperations';
import { useFileTree } from '@symphony/file-explorer/hooks/useFileTree';

// With this
import { useFolderManagement } from '@symphony/features/FolderManagement';
import { useFileTree } from '@symphony/features/FileTree';
import { useFileSearch } from '@symphony/features/FileSearch';
```

### Step 3: Update Hook Usage
```javascript
// Old
const folderOps = useFolderOperations(files, onRenameFile, onDeleteFile);

// New
const folderManagement = useFolderManagement({
  files,
  onRenameFile,
  onDeleteFile
});
```

### Step 4: Update API Calls
```javascript
// Old
folderOps.createFolder(parentPath);

// New
folderManagement.createFolder(parentPath);
```

## Complete Example

### Old Implementation
```javascript
import React, { useState } from 'react';
import FileExplorer from '@symphony/file-explorer';

function MyFileExplorer({ files, onSelectFile }) {
  return (
    <FileExplorer
      files={files}
      activeFileName={activeFile}
      onSelectFile={onSelectFile}
      onNewFile={handleNewFile}
      onUploadFile={handleUploadFile}
      onDeleteFile={handleDeleteFile}
      onRenameFile={handleRenameFile}
      modifiedTabs={modifiedTabs}
      gitStatusMap={gitStatusMap}
    />
  );
}
```

### New Implementation
```javascript
import React from 'react';
import { useFolderManagement } from '@symphony/features/FolderManagement';
import { useFileTree } from '@symphony/features/FileTree';
import { useFileSearch } from '@symphony/features/FileSearch';
import { FileTreeView } from './components/FileTreeView';
import { SearchBar } from './components/SearchBar';

function MyFileExplorer({ files, onSelectFile, onRenameFile, onDeleteFile }) {
  // Use features
  const folderManagement = useFolderManagement({
    files,
    onRenameFile,
    onDeleteFile
  });

  const fileTree = useFileTree({
    files,
    userFolders: folderManagement.userFolders,
    modifiedTabs,
    gitStatusMap
  });

  const search = useFileSearch(files);

  // Filter tree based on search
  const filteredTree = fileTree.filterTree(
    'all', // extension filter
    'all', // size filter
    'all', // status filter
    search.searchTerm
  );

  return (
    <div>
      <SearchBar
        value={search.searchTerm}
        onChange={search.setSearchTerm}
        resultCount={search.resultCount}
      />
      
      <FileTreeView
        tree={filteredTree}
        expanded={folderManagement.expanded}
        onToggleExpand={folderManagement.toggleExpand}
        onSelectFile={onSelectFile}
      />
    </div>
  );
}
```

## Benefits of New Architecture

### 1. **Modularity**
- Features can be used independently
- Mix and match features as needed
- Easy to add new features

### 2. **Testability**
- Test features in isolation
- Mock dependencies easily
- Clear test boundaries

### 3. **Reusability**
- Use features across different components
- Share logic between projects
- Build custom UIs with same features

### 4. **Maintainability**
- Changes localized to features
- Clear separation of concerns
- Easier to understand and debug

## UI Component Migration

The FileExplorer component has been migrated to use Symphony's design system components from `@symphony/ui` for consistent styling and accessibility.

### Component Replacements

| Old Element | New Component | Notes |
|-------------|---------------|-------|
| `<div>` (container) | `<Flex direction="column">` | Semantic layout |
| `<div>` (header) | `<Flex align="center" justify="between">` | Flexbox layout |
| `<h2>` | `<Heading level={6}>` | Proper heading hierarchy |
| `<p>` (empty state) | `<Text>` | Typography component |
| `<div>` (scrollable) | `<ScrollArea>` | Accessible scrolling |
| `<div>` (file list) | `<Flex direction="column" gap={1}>` | Consistent spacing |

### Example: Before and After

**Before:**
```jsx
<div className='bg-gray-800 text-white w-64 p-3 border-r border-gray-700 flex flex-col relative'>
  <div className='flex items-center justify-between mb-4 relative'>
    <h2 className='text-xs tracking-widest text-gray-300'>EXPLORER</h2>
    <button>⚙️</button>
  </div>
  <div className='flex-grow overflow-y-auto'>
    {/* content */}
  </div>
</div>
```

**After:**
```jsx
<Flex direction="column" className='bg-gray-800 text-white w-64 p-3 border-r border-gray-700 relative'>
  <Flex align="center" justify="between" className='mb-4 relative'>
    <Heading level={6} className='text-xs tracking-widest text-gray-300'>EXPLORER</Heading>
    <Button variant="ghost" size="sm">⚙️</Button>
  </Flex>
  <ScrollArea className='flex-grow overflow-y-auto'>
    {/* content */}
  </ScrollArea>
</Flex>
```

### Benefits of UI Component Migration

1. **Consistent Styling** - All components follow Symphony's design system
2. **Accessibility** - Built-in ARIA attributes and keyboard navigation
3. **Theming** - Automatic theme support across the IDE
4. **Type Safety** - Full TypeScript support with proper prop types
5. **Maintainability** - Centralized component updates

## Common Issues

### Issue 1: Import Errors
**Problem**: `Cannot find module '@symphony/features'`

**Solution**: Run `pnpm install` to install the new package.

### Issue 2: API Not Found
**Problem**: `createFolder is not a function`

**Solution**: Ensure you're using the correct feature hook:
```javascript
const folderManagement = useFolderManagement({ files, onRenameFile, onDeleteFile });
folderManagement.createFolder(); // ✅ Correct
```

### Issue 3: Tree Not Updating
**Problem**: Tree not updating after folder operations

**Solution**: Ensure you're passing the correct dependencies:
```javascript
const fileTree = useFileTree({
  files,
  userFolders: folderManagement.userFolders, // ✅ Use from feature
  modifiedTabs,
  gitStatusMap
});
```

## Next Steps

1. ✅ Migrate to FolderManagement feature
2. ✅ Migrate to FileTree feature
3. ✅ Migrate to FileSearch feature
4. ✅ Migrate main component to use @symphony/ui components (Flex, Heading, Text, ScrollArea)
5. ⏳ Migrate sub-components (FileTreeNode, FilterControls, ContextMenu, ActionButtons)
6. ⏳ Build custom UI components
7. ⏳ Remove old file-explorer dependencies

---

**Last Updated**: December 23, 2025
