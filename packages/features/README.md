# @symphony/features

Business logic features for Symphony IDE following the [Page, Feature, Component] architecture pattern.

## Overview

This package contains self-contained feature modules that encapsulate business logic, state management, and feature-specific functionality. Features are designed to be:

- **Self-contained**: Each feature manages its own state and logic
- **Reusable**: Features can be used across different pages
- **Testable**: Business logic can be tested independently
- **Composable**: Features can be combined to create complex functionality

## Architecture

```
features/
├── FileManagement/      # File CRUD operations and state
├── EditorCore/          # Monaco editor integration and state
├── Settings/            # Settings management and persistence
└── AutoSave/            # Auto-save functionality
```

## Features

### FileManagement
Handles all file-related operations including creation, deletion, renaming, and content updates.

```javascript
import { FileManagementFeature, useFileManagement } from '@symphony/features/FileManagement';

// Use as a feature component
<FileManagementFeature>
  {({ files, createFile, updateFile, deleteFile }) => (
    // Your UI here
  )}
</FileManagementFeature>

// Or use the hook directly
const fileManagement = useFileManagement();
```

### EditorCore
Manages Monaco editor integration, language detection, and editor state.

```javascript
import { EditorCoreFeature, useEditorCore } from '@symphony/features/EditorCore';

const editorCore = useEditorCore({
  files,
  activeFileName,
  onFileChange: handleFileChange
});
```

### Settings
Handles application settings including themes, shortcuts, and preferences.

```javascript
import { SettingsFeature, useSettings } from '@symphony/features/Settings';

const settings = useSettings();
```

### AutoSave
Provides automatic file saving functionality with configurable intervals.

```javascript
import { AutoSaveFeature, useAutoSave } from '@symphony/features/AutoSave';

const autoSave = useAutoSave({
  files,
  activeFile,
  enabled: true,
  interval: 2000
});
```

## Usage Guidelines

### Feature Composition
Features should be composed at the page level:

```javascript
import { FileManagementFeature } from '@symphony/features/FileManagement';
import { EditorCoreFeature } from '@symphony/features/EditorCore';
import { SettingsFeature } from '@symphony/features/Settings';

function EditorPage() {
  return (
    <FileManagementFeature>
      {(fileManagement) => (
        <EditorCoreFeature files={fileManagement.files}>
          {(editorCore) => (
            <SettingsFeature>
              {(settings) => (
                // Your page UI
              )}
            </SettingsFeature>
          )}
        </EditorCoreFeature>
      )}
    </FileManagementFeature>
  );
}
```

### Feature Independence
Features should not directly depend on each other. Communication should happen through:
- Props passed from parent
- Callbacks for events
- Shared context when necessary

### State Management
Each feature manages its own state using:
- React hooks (useState, useReducer)
- Custom hooks for complex logic
- External state libraries when needed (Jotai, Zustand)

## Development

### Adding a New Feature

1. Create feature directory:
```bash
mkdir -p src/NewFeature/hooks
mkdir -p src/NewFeature/services
```

2. Create feature component:
```javascript
// src/NewFeature/NewFeature.jsx
export function NewFeatureFeature({ children }) {
  const featureState = useNewFeature();
  return children(featureState);
}
```

3. Create hooks:
```javascript
// src/NewFeature/hooks/useNewFeature.js
export function useNewFeature() {
  // Feature logic here
}
```

4. Export from index:
```javascript
// src/NewFeature/index.js
export { NewFeatureFeature } from './NewFeature';
export { useNewFeature } from './hooks/useNewFeature';
```

5. Update main index:
```javascript
// src/index.js
export * from './NewFeature';
```

## Testing

Features should be tested independently:

```javascript
import { renderHook } from '@testing-library/react-hooks';
import { useFileManagement } from '@symphony/features/FileManagement';

test('creates a new file', () => {
  const { result } = renderHook(() => useFileManagement());
  
  act(() => {
    result.current.createFile('test.js', 'console.log("test")');
  });
  
  expect(result.current.files).toHaveLength(1);
});
```

## Best Practices

1. **Single Responsibility**: Each feature should have one clear purpose
2. **Clean APIs**: Expose simple, intuitive APIs to consumers
3. **Error Handling**: Handle errors within features, expose error states
4. **Performance**: Use memoization and lazy loading where appropriate
5. **Documentation**: Document feature APIs and usage examples

## License

MIT
