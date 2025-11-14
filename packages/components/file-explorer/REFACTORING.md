# File-Explorer Refactoring Documentation

## Overview
This document outlines the refactoring of the `@symphony/file-explorer` package from a mixed architecture to a clean **[Page, Feature, Component]** pattern.

## Refactoring Date
October 13, 2025

## Motivation
The original file-explorer package had:
- Business logic mixed with UI components
- Folder operations and file tree logic tightly coupled
- Search and filter logic embedded in the main component
- Difficult to reuse features independently
- Hard to test business logic in isolation

## Architecture Pattern: [Page, Feature, Component]

### 🔵 Components Layer
**Purpose**: Pure, reusable UI components with no business logic

**Characteristics**:
- Receive data via props
- Emit events via callbacks
- No direct state management
- No API calls or side effects
- Highly reusable across features

### 🟡 Features Layer
**Purpose**: Self-contained business logic modules

**Characteristics**:
- Manage their own state
- Contain business logic and side effects
- Compose UI components
- Expose clean APIs to pages
- Can be used independently

### 🔴 Pages Layer
**Purpose**: High-level orchestration and routing

**Characteristics**:
- Compose multiple features
- Handle page-level routing
- Minimal business logic
- Coordinate feature interactions
- Provide page-level context

## Current Structure Analysis

### Existing Components
```
file-explorer/
├── src/
│   ├── FileExplorer.jsx              # Main component (291 lines)
│   ├── components/
│   │   ├── FileTreeNode.jsx          # Tree node rendering
│   │   ├── FilterControls.jsx        # Filter UI
│   │   ├── SearchTab.jsx             # Search UI
│   │   ├── ContextMenu.jsx           # Context menu
│   │   └── ActionButtons.jsx         # Action buttons
│   ├── hooks/
│   │   ├── useFolderOperations.js    # Folder CRUD + state
│   │   └── useFileTree.jsx           # Tree building + filtering
│   └── utils/
│       └── storageService.js         # Storage abstraction
```

### Identified Features

#### 1. **FolderManagement Feature**
- Folder CRUD operations (create, rename, delete)
- Folder expansion state
- User-created folders tracking
- Folder persistence

#### 2. **FileTree Feature**
- Tree building from files and folders
- Tree filtering (extension, size, status)
- Tree sorting
- Status management (modified, git status)

#### 3. **Search Feature**
- File search functionality
- Search term management
- Filtered results

#### 4. **DragDrop Feature**
- Drag and drop file/folder operations
- Move files between folders
- Folder reordering

## New Structure

```
file-explorer/
├── src/
│   ├── pages/
│   │   └── FileExplorerPage/
│   │       ├── FileExplorerPage.jsx     # Main page orchestrator
│   │       └── index.js
│   ├── components/
│   │   ├── FileTreeNode/
│   │   │   ├── FileTreeNode.jsx         # Pure tree node UI
│   │   │   └── index.js
│   │   ├── FilterControls/
│   │   │   ├── FilterControls.jsx       # Pure filter UI
│   │   │   └── index.js
│   │   ├── SearchInput/
│   │   │   ├── SearchInput.jsx          # Pure search UI
│   │   │   └── index.js
│   │   ├── ContextMenu/
│   │   │   ├── ContextMenu.jsx          # Pure context menu
│   │   │   └── index.js
│   │   └── ActionButtons/
│   │       ├── ActionButtons.jsx        # Pure action buttons
│   │       └── index.js
│   └── index.js
```

## Features to Extract (to @symphony/features)

```
packages/features/src/
├── FolderManagement/
│   ├── FolderManagementFeature.jsx
│   ├── hooks/
│   │   ├── useFolderState.js
│   │   └── useFolderOperations.js
│   ├── services/
│   │   └── storageService.js
│   └── index.js
├── FileTree/
│   ├── FileTreeFeature.jsx
│   ├── hooks/
│   │   ├── useTreeBuilder.js
│   │   ├── useTreeFilter.js
│   │   └── useTreeSort.js
│   ├── utils/
│   │   └── treeHelpers.js
│   └── index.js
├── FileSearch/
│   ├── FileSearchFeature.jsx
│   ├── hooks/
│   │   └── useFileSearch.js
│   └── index.js
└── DragDrop/
    ├── DragDropFeature.jsx
    ├── hooks/
    │   └── useDragDrop.js
    └── index.js
```

## Migration Map

### Old → New Structure

#### Components
| Old Location | New Location | Type |
|-------------|--------------|------|
| `FileExplorer.jsx` | `pages/FileExplorerPage/FileExplorerPage.jsx` | Page |
| `components/FileTreeNode.jsx` | `components/FileTreeNode/FileTreeNode.jsx` | Component |
| `components/FilterControls.jsx` | `components/FilterControls/FilterControls.jsx` | Component |
| `components/SearchTab.jsx` | `components/SearchInput/SearchInput.jsx` | Component |
| `components/ContextMenu.jsx` | `components/ContextMenu/ContextMenu.jsx` | Component |
| `components/ActionButtons.jsx` | `components/ActionButtons/ActionButtons.jsx` | Component |

#### Hooks → Features
| Old Hook | New Feature | Location |
|----------|-------------|----------|
| `useFolderOperations.js` | FolderManagement | `@symphony/features/FolderManagement` |
| `useFileTree.jsx` | FileTree | `@symphony/features/FileTree` |

## Feature Boundaries

### FolderManagement Feature
**Responsibilities**:
- Folder CRUD operations
- Folder expansion state management
- User-created folders tracking
- Folder persistence to storage

**API**:
```javascript
const folderManagement = useFolderManagement();
// folderManagement.userFolders
// folderManagement.expanded
// folderManagement.createFolder(parentPath)
// folderManagement.renameFolder(oldPath, newName)
// folderManagement.deleteFolder(path)
// folderManagement.toggleExpand(path)
```

### FileTree Feature
**Responsibilities**:
- Build tree structure from files and folders
- Filter tree by extension, size, status
- Sort tree by various criteria
- Manage file status (modified, git status)

**API**:
```javascript
const fileTree = useFileTree({ files, folders, modifiedTabs, gitStatusMap });
// fileTree.tree
// fileTree.filteredTree
// fileTree.allExtensions
// fileTree.allStatuses
// fileTree.filterTree(filters)
// fileTree.sortTree(sortBy)
```

### FileSearch Feature
**Responsibilities**:
- Search files by name
- Search term management
- Filtered results

**API**:
```javascript
const search = useFileSearch({ files });
// search.searchTerm
// search.setSearchTerm(term)
// search.results
// search.clearSearch()
```

### DragDrop Feature
**Responsibilities**:
- Handle drag and drop operations
- Move files between folders
- Validate drop targets

**API**:
```javascript
const dragDrop = useDragDrop({ onMove });
// dragDrop.onDragStart(e, item)
// dragDrop.onDragOver(e)
// dragDrop.onDrop(e, target)
// dragDrop.isDragging
```

## Benefits of New Architecture

### 1. **Clear Separation of Concerns**
- UI components focus only on presentation
- Features encapsulate business logic
- Pages orchestrate high-level flows

### 2. **Improved Testability**
- Components can be tested in isolation
- Features can be tested without UI
- Pages can be tested with mocked features

### 3. **Better Reusability**
- Components are pure and reusable
- Features can be used in different contexts
- Clear APIs make integration easier

### 4. **Easier Maintenance**
- Changes are localized to specific layers
- Dependencies are explicit
- Code is easier to understand

### 5. **Scalability**
- New features can be added independently
- Components can be shared across features
- Pages can be composed from features

## Migration Strategy

### Phase 1: Extract Features
1. Extract FolderManagement feature
2. Extract FileTree feature
3. Extract FileSearch feature
4. Extract DragDrop feature

### Phase 2: Refactor Components
1. Extract pure UI components
2. Remove business logic
3. Create component APIs

### Phase 3: Create Page
1. Create FileExplorerPage
2. Compose features
3. Simplify orchestration

### Phase 4: Update Dependencies
1. Update imports across codebase
2. Update documentation
3. Create migration examples

## Breaking Changes

### Import Paths
```javascript
// Old
import FileExplorer from '@symphony/file-explorer';

// New
import { FileExplorerPage } from '@symphony/file-explorer';
// Or use features directly
import { useFolderManagement } from '@symphony/features/FolderManagement';
import { useFileTree } from '@symphony/features/FileTree';
```

## Backward Compatibility

A compatibility layer will be maintained:

```javascript
// Deprecated but still works
export { FileExplorerPage as default } from './pages/FileExplorerPage';
```

## Testing Strategy

### Component Tests
- Unit tests for each component
- Storybook stories for visual testing
- Accessibility tests

### Feature Tests
- Integration tests for feature logic
- Mock external dependencies
- Test feature APIs

### Page Tests
- End-to-end tests
- Feature integration tests
- User flow tests

## Performance Considerations

### Code Splitting
- Features can be lazy-loaded
- Components are tree-shakeable
- Reduced initial bundle size

### Memoization
- Components use React.memo where appropriate
- Feature hooks use useMemo/useCallback
- Prevent unnecessary re-renders

## Next Steps

1. ✅ Create documentation
2. ⏳ Extract FolderManagement feature
3. ⏳ Extract FileTree feature
4. ⏳ Extract FileSearch feature
5. ⏳ Extract DragDrop feature
6. ⏳ Refactor components layer
7. ⏳ Create FileExplorerPage
8. ⏳ Update workspace configuration
9. ⏳ Test and verify refactoring

---

**Last Updated**: October 13, 2025
**Author**: Symphony Development Team
