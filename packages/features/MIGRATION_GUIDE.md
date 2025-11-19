# Migration Guide: [Page, Feature, Component] Architecture

## Overview
This guide helps you migrate from the old code-editor architecture to the new [Page, Feature, Component] pattern.

## Quick Start

### Install Dependencies
```bash
pnpm install
```

The new `@symphony/features` package is now available in your workspace.

## Migration Examples

### Example 1: Using FileManagement Feature

#### Before (Old Pattern)
```javascript
import { Editor } from '@symphony/code-editor';
import { useEditorState } from '@symphony/code-editor/hooks/useEditorState';
import { useFileOperations } from '@symphony/code-editor/hooks/useFileOperations';

function MyComponent() {
  const editorState = useEditorState();
  const fileOps = useFileOperations({
    ...editorState,
    updateOutline: () => {},
  });

  return (
    <div>
      <button onClick={fileOps.handleNewFile}>New File</button>
      <button onClick={() => fileOps.handleDeleteFile(editorState.activeFileName)}>
        Delete File
      </button>
    </div>
  );
}
```

#### After (New Pattern)
```javascript
import { useFileManagement } from '@symphony/features/FileManagement';

function MyComponent() {
  const fileManagement = useFileManagement({
    onFileChange: (file) => console.log('File changed:', file)
  });

  return (
    <div>
      <button onClick={() => fileManagement.createFile()}>New File</button>
      <button onClick={() => fileManagement.deleteFile(fileManagement.activeFileName)}>
        Delete File
      </button>
    </div>
  );
}
```

### Example 2: Using Settings Feature

#### Before (Old Pattern)
```javascript
import { useEditorSettings } from '@symphony/code-editor/hooks/useEditorSettings';

function SettingsButton() {
  const settings = useEditorSettings();

  return (
    <button onClick={() => {
      settings.setSettingsTab('shortcuts');
      settings.setShowSettings(true);
    }}>
      Open Settings
    </button>
  );
}
```

#### After (New Pattern)
```javascript
import { useSettingsFeature } from '@symphony/features/Settings';

function SettingsButton() {
  const settings = useSettingsFeature();

  return (
    <button onClick={() => settings.openSettings('shortcuts')}>
      Open Settings
    </button>
  );
}
```

### Example 3: Using AutoSave Feature

#### Before (Old Pattern)
```javascript
import { useAutoSave } from '@symphony/code-editor/hooks/useAutoSave';

function MyEditor() {
  const editorState = useEditorState();
  const settings = useEditorSettings();

  useAutoSave({
    autoSaveSettings: settings.autoSaveSettings,
    files: editorState.files,
    isSaved: editorState.isSaved,
    setIsSaved: editorState.setIsSaved,
    activeFileName: editorState.activeFileName,
    setModifiedTabs: editorState.setModifiedTabs,
  });

  return <div>Editor</div>;
}
```

#### After (New Pattern)
```javascript
import { useFileManagement } from '@symphony/features/FileManagement';
import { useSettingsFeature } from '@symphony/features/Settings';
import { AutoSaveFeature } from '@symphony/features/AutoSave';

function MyEditor() {
  const fileManagement = useFileManagement();
  const settings = useSettingsFeature();

  return (
    <AutoSaveFeature
      enabled={settings.autoSave.enabled}
      interval={settings.autoSave.interval}
      files={fileManagement.files}
      activeFileName={fileManagement.activeFileName}
      isSaved={fileManagement.isSaved}
      setIsSaved={fileManagement.setIsSaved}
      setModifiedTabs={fileManagement.setModifiedTabs}
      onAutoSave={(data) => console.log('Auto-saved:', data)}
    />
  );
}
```

### Example 4: Composing Multiple Features

#### New Pattern (Recommended)
```javascript
import { useFileManagement } from '@symphony/features/FileManagement';
import { useSettingsFeature } from '@symphony/features/Settings';
import { AutoSaveFeature } from '@symphony/features/AutoSave';

function EditorPage() {
  // Use features as hooks
  const fileManagement = useFileManagement({
    onFileChange: (file) => {
      console.log('File changed:', file.name);
    }
  });

  const settings = useSettingsFeature();

  return (
    <div className="editor-page">
      {/* Auto-save runs in background */}
      <AutoSaveFeature
        enabled={settings.autoSave.enabled}
        interval={settings.autoSave.interval}
        files={fileManagement.files}
        activeFileName={fileManagement.activeFileName}
        isSaved={fileManagement.isSaved}
        setIsSaved={fileManagement.setIsSaved}
        setModifiedTabs={fileManagement.setModifiedTabs}
      />

      {/* Your UI components */}
      <FileList 
        files={fileManagement.files}
        activeFile={fileManagement.activeFileName}
        onSelectFile={fileManagement.selectFile}
        onDeleteFile={fileManagement.deleteFile}
      />

      <MonacoEditor
        file={fileManagement.activeFile}
        theme={settings.theme}
        onChange={fileManagement.updateFileContent}
      />

      <SettingsModal
        isOpen={settings.isSettingsOpen}
        onClose={settings.closeSettings}
        settings={settings}
      />
    </div>
  );
}
```

## Import Path Changes

### Old Imports
```javascript
// Old
import { useEditorState } from '@symphony/code-editor/hooks/useEditorState';
import { useFileOperations } from '@symphony/code-editor/hooks/useFileOperations';
import { useEditorSettings } from '@symphony/code-editor/hooks/useEditorSettings';
import { useAutoSave } from '@symphony/code-editor/hooks/useAutoSave';
```

### New Imports
```javascript
// New
import { useFileManagement } from '@symphony/features/FileManagement';
import { useSettingsFeature } from '@symphony/features/Settings';
import { useAutoSave } from '@symphony/features/AutoSave';
```

## API Changes

### FileManagement

| Old API | New API | Notes |
|---------|---------|-------|
| `handleNewFile()` | `createFile()` | Cleaner naming |
| `handleDeleteFile(name)` | `deleteFile(name)` | Cleaner naming |
| `handleRenameFile(old, new)` | `renameFile(old, new)` | Cleaner naming |
| `handleSelectFile(name)` | `selectFile(name)` | Cleaner naming |
| `handleChange(content)` | `updateFileContent(content)` | More descriptive |
| `handleCloseTab(name)` | `closeTab(name)` | Cleaner naming |
| `handleDownloadFile(name)` | `downloadFile(name)` | Cleaner naming |
| `handleUploadFile(file)` | `uploadFile(file)` | Cleaner naming |

### Settings

| Old API | New API | Notes |
|---------|---------|-------|
| `autoSaveSettings` | `autoSave` | Shorter name |
| `setAutoSaveSettings` | `setAutoSave` | Shorter name |
| `tabCompletionSettings` | `tabCompletion` | Shorter name |
| `glyphMarginSettings` | `glyphMargin` | Shorter name |
| `themeSettings` | `theme` | Shorter name |
| `terminalSettings` | `terminal` | Shorter name |
| `showSettings` | `isSettingsOpen` | More descriptive |
| N/A | `openSettings(tab)` | New helper method |
| N/A | `closeSettings()` | New helper method |
| N/A | `resetSettings()` | New helper method |

## Step-by-Step Migration

### Step 1: Install New Package
```bash
pnpm install
```

### Step 2: Update Imports
Replace old imports with new feature imports:
```javascript
// Replace this
import { useEditorState } from '@symphony/code-editor/hooks/useEditorState';

// With this
import { useFileManagement } from '@symphony/features/FileManagement';
```

### Step 3: Update Hook Usage
Replace old hook patterns with new feature hooks:
```javascript
// Old
const editorState = useEditorState();
const fileOps = useFileOperations({ ...editorState });

// New
const fileManagement = useFileManagement();
```

### Step 4: Update API Calls
Replace old API calls with new cleaner names:
```javascript
// Old
fileOps.handleNewFile();

// New
fileManagement.createFile();
```

### Step 5: Test Your Changes
Run your application and verify all functionality works as expected.

## Backward Compatibility

The old `@symphony/code-editor` package still exists and works, but is deprecated. You can gradually migrate components one at a time.

### Compatibility Layer (Temporary)
```javascript
// Old code still works (deprecated)
import { Editor } from '@symphony/code-editor';

// But you should migrate to:
import { EditorPage } from '@symphony/code-editor/pages/EditorPage';
// Or better yet, build your own page using features
```

## Benefits of New Architecture

### 1. **Cleaner APIs**
- Removed "handle" prefix from methods
- More descriptive names
- Consistent naming patterns

### 2. **Better Separation of Concerns**
- Features are self-contained
- Clear boundaries between features
- Easier to test and maintain

### 3. **Improved Reusability**
- Features can be used independently
- Easy to compose multiple features
- Flexible integration patterns

### 4. **Better Performance**
- Features can be lazy-loaded
- Smaller bundle sizes
- Tree-shakeable exports

### 5. **Easier Testing**
- Features can be tested in isolation
- Mock dependencies easily
- Clear test boundaries

## Common Issues

### Issue 1: Import Errors
**Problem**: `Cannot find module '@symphony/features'`

**Solution**: Run `pnpm install` to install the new package.

### Issue 2: API Not Found
**Problem**: `handleNewFile is not a function`

**Solution**: Update to new API name: `createFile()`

### Issue 3: State Not Updating
**Problem**: File state not updating after operations

**Solution**: Ensure you're using the returned state from the feature hook:
```javascript
const fileManagement = useFileManagement();
// Use fileManagement.files, not a separate state
```

## Getting Help

- **Documentation**: See `packages/features/README.md`
- **Examples**: Check `packages/features/src/*/README.md` for feature-specific examples
- **Issues**: Report issues on GitHub

## Next Steps

1. ✅ Migrate FileManagement usage
2. ✅ Migrate Settings usage
3. ✅ Migrate AutoSave usage
4. ⏳ Refactor page components to use features
5. ⏳ Extract pure UI components
6. ⏳ Remove old deprecated code

---

**Last Updated**: October 13, 2025
