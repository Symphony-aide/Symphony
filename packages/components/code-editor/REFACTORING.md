# Code-Editor Refactoring Documentation

## Overview
This document outlines the refactoring of the `@symphony/code-editor` package from a mixed architecture to a clean **[Page, Feature, Component]** pattern.

## Refactoring Date
October 13, 2025

## Motivation
The original code-editor package had mixed responsibilities with:
- Business logic scattered across multiple hooks
- Tight coupling between UI components and state management
- No clear separation between orchestration, features, and UI
- Difficult to maintain and extend

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

## New Structure

```
code-editor/
├── src/
│   ├── pages/
│   │   └── EditorPage/
│   │       ├── EditorPage.jsx           # Main page orchestrator
│   │       ├── EditorLayout.jsx         # Page layout wrapper
│   │       └── index.js
│   ├── features/
│   │   ├── FileManagement/
│   │   │   ├── FileManagementFeature.jsx
│   │   │   ├── hooks/
│   │   │   │   ├── useFileState.js
│   │   │   │   └── useFileOperations.js
│   │   │   ├── services/
│   │   │   │   └── FileService.js
│   │   │   └── index.js
│   │   ├── EditorCore/
│   │   │   ├── EditorCoreFeature.jsx
│   │   │   ├── hooks/
│   │   │   │   ├── useEditorState.js
│   │   │   │   ├── useMonacoEditor.js
│   │   │   │   └── useLanguageDetection.js
│   │   │   ├── services/
│   │   │   │   └── EditorService.js
│   │   │   └── index.js
│   │   ├── Settings/
│   │   │   ├── SettingsFeature.jsx
│   │   │   ├── hooks/
│   │   │   │   └── useSettings.js
│   │   │   ├── services/
│   │   │   │   └── SettingsService.js
│   │   │   └── index.js
│   │   └── AutoSave/
│   │       ├── AutoSaveFeature.jsx
│   │       ├── hooks/
│   │       │   └── useAutoSave.js
│   │       └── index.js
│   ├── components/
│   │   ├── EditorTabs/
│   │   │   ├── EditorTabs.jsx
│   │   │   └── index.js
│   │   ├── MonacoEditor/
│   │   │   ├── MonacoEditor.jsx
│   │   │   └── index.js
│   │   ├── LayoutManager/
│   │   │   ├── LayoutManager.jsx
│   │   │   └── index.js
│   │   └── StatusBar/
│   │       ├── StatusBar.jsx
│   │       └── index.js
│   ├── shared/
│   │   ├── utils/
│   │   ├── constants/
│   │   └── types/
│   └── index.js
```

## Migration Map

### Old → New Structure

#### Components
| Old Location | New Location | Type |
|-------------|--------------|------|
| `Editor.jsx` | `pages/EditorPage/EditorPage.jsx` | Page |
| `EditorPanel.jsx` | `components/MonacoEditor/MonacoEditor.jsx` | Component |
| `components/EditorTabs.jsx` | `components/EditorTabs/EditorTabs.jsx` | Component |
| `components/LayoutManager.jsx` | `components/LayoutManager/LayoutManager.jsx` | Component |
| `components/SettingsPanel.jsx` | `features/Settings/SettingsFeature.jsx` | Feature |

#### Hooks → Features
| Old Hook | New Feature | Location |
|----------|-------------|----------|
| `useEditorState.js` | EditorCore | `features/EditorCore/hooks/` |
| `useFileOperations.js` | FileManagement | `features/FileManagement/hooks/` |
| `useEditorSettings.js` | Settings | `features/Settings/hooks/` |
| `useAutoSave.js` | AutoSave | `features/AutoSave/hooks/` |
| `useKeyboardShortcuts.js` | EditorCore | `features/EditorCore/hooks/` |

## Feature Boundaries

### FileManagement Feature
**Responsibilities**:
- File CRUD operations (create, read, update, delete)
- File state management
- File persistence
- File validation

**API**:
```javascript
const fileManagement = useFileManagement();
// fileManagement.files
// fileManagement.createFile()
// fileManagement.updateFile()
// fileManagement.deleteFile()
// fileManagement.renameFile()
```

### EditorCore Feature
**Responsibilities**:
- Monaco editor integration
- Language detection
- Syntax highlighting
- Code lens and breakpoints
- Editor state management

**API**:
```javascript
const editorCore = useEditorCore();
// editorCore.activeFile
// editorCore.setActiveFile()
// editorCore.editorRef
// editorCore.languageInfo
```

### Settings Feature
**Responsibilities**:
- Settings state management
- Settings persistence
- Settings validation
- Settings UI

**API**:
```javascript
const settings = useSettings();
// settings.theme
// settings.shortcuts
// settings.updateSettings()
// settings.resetSettings()
```

### AutoSave Feature
**Responsibilities**:
- Auto-save functionality
- Save interval management
- Save state tracking

**API**:
```javascript
const autoSave = useAutoSave({ files, activeFile });
// autoSave.isSaving
// autoSave.lastSaved
// autoSave.enable()
// autoSave.disable()
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
- Features can be used in different pages
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

### Phase 1: Create New Structure
1. Create new directory structure
2. Set up package.json for features
3. Create index files for exports

### Phase 2: Extract Components
1. Extract pure UI components
2. Remove business logic
3. Create component APIs

### Phase 3: Create Features
1. Group related hooks into features
2. Create feature components
3. Implement feature APIs

### Phase 4: Refactor Pages
1. Simplify page components
2. Use feature APIs
3. Remove direct hook usage

### Phase 5: Update Dependencies
1. Update imports across codebase
2. Update workspace configuration
3. Update documentation

## Breaking Changes

### Import Paths
```javascript
// Old
import { Editor } from '@symphony/code-editor';

// New
import { EditorPage } from '@symphony/code-editor';
```

### Component Props
Some component props may change to align with new architecture. See individual component documentation for details.

## Backward Compatibility

A compatibility layer will be maintained for one major version to allow gradual migration:

```javascript
// Deprecated but still works
export { EditorPage as Editor } from './pages/EditorPage';
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
2. ✅ Migrate to Symphony UI components (Flex, Box, Text, Button)
3. ⏳ Create features package structure
4. ⏳ Extract FileManagement feature
5. ⏳ Extract EditorCore feature
6. ⏳ Extract Settings feature
7. ⏳ Extract AutoSave feature
8. ⏳ Refactor components layer
9. ⏳ Refactor EditorPage
10. ⏳ Update workspace configuration
11. ⏳ Test and verify refactoring

## UI Component Migration (Completed)

As part of the `component-packages-migration` spec, the code-editor package has been updated to use Symphony's UI design system components:

### EditorPanel.jsx
- Replaced raw `<div>` elements with `<Flex>` and `<Box>` components
- Replaced `<span>` elements with `<Text>` components
- Replaced `<button>` elements with `<Button>` components
- Added proper layout structure using `Flex` with `direction`, `align`, and `justify` props

### Benefits
- Consistent styling with other Symphony IDE components
- Better accessibility through UI component primitives
- Reduced CSS maintenance overhead
- Improved component composition patterns

## References

- [React Component Patterns](https://reactpatterns.com/)
- [Feature-Sliced Design](https://feature-sliced.design/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

**Last Updated**: December 23, 2025
**Author**: Symphony Development Team
