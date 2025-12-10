# FileManagement Feature

Self-contained feature for managing files in Symphony IDE.

## Overview

The FileManagement feature handles all file-related operations including:
- File CRUD operations (create, read, update, delete)
- File state management (active file, open tabs, modified tabs)
- File persistence using storage service
- Undo/redo support via command pattern

## Architecture

```
FileManagement/
├── FileManagementFeature.jsx    # Main feature component
├── hooks/
│   ├── useFileState.js          # File state management
│   └── useFileOperations.js     # File operation handlers
├── commands/
│   └── FileOperationCommands.js # Command pattern implementations
├── services/
│   └── storageService.js        # Storage abstraction
└── index.js                     # Public exports
```

## Usage

### As a Feature Component (Render Prop Pattern)

```javascript
import { FileManagementFeature } from '@symphony/features/FileManagement';

function MyEditor() {
  return (
    <FileManagementFeature onFileChange={(file) => console.log('File changed:', file)}>
      {(fileManagement) => (
        <div>
          <h1>Files: {fileManagement.files.length}</h1>
          <button onClick={() => fileManagement.createFile('new.txt', '')}>
            New File
          </button>
          
          {fileManagement.files.map(file => (
            <div key={file.name} onClick={() => fileManagement.selectFile(file.name)}>
              {file.name} {fileManagement.modifiedTabs.includes(file.name) && '*'}
            </div>
          ))}
        </div>
      )}
    </FileManagementFeature>
  );
}
```

### As a Hook

```javascript
import { useFileManagement } from '@symphony/features/FileManagement';

function MyEditor() {
  const fileManagement = useFileManagement({
    onFileChange: (file) => console.log('File changed:', file)
  });

  return (
    <div>
      <h1>Active File: {fileManagement.activeFileName}</h1>
      <button onClick={() => fileManagement.createFile()}>New File</button>
      <button onClick={() => fileManagement.deleteFile(fileManagement.activeFileName)}>
        Delete Active File
      </button>
    </div>
  );
}
```

## API Reference

### State

| Property | Type | Description |
|----------|------|-------------|
| `files` | `Array<{name: string, content: string}>` | All files |
| `activeFile` | `{name: string, content: string}` | Currently active file |
| `activeFileName` | `string` | Name of active file |
| `openTabs` | `string[]` | List of open tab names |
| `modifiedTabs` | `string[]` | List of modified tab names |
| `isSaved` | `boolean` | Whether active file is saved |

### Operations

#### `selectFile(name: string): void`
Selects a file and opens it in a tab.

```javascript
fileManagement.selectFile('index.js');
```

#### `createFile(fileName?: string, content?: string): Promise<void>`
Creates a new file. If fileName is not provided, prompts the user.

```javascript
await fileManagement.createFile('new.txt', 'Hello World');
```

#### `uploadFile(file: File): Promise<void>`
Uploads a file from the file system.

```javascript
const input = document.createElement('input');
input.type = 'file';
input.onchange = (e) => fileManagement.uploadFile(e.target.files[0]);
input.click();
```

#### `deleteFile(name: string): Promise<void>`
Deletes a file (supports undo).

```javascript
await fileManagement.deleteFile('old.txt');
```

#### `renameFile(oldName: string, newName?: string): Promise<void>`
Renames a file. If newName is not provided, prompts the user.

```javascript
await fileManagement.renameFile('old.txt', 'new.txt');
```

#### `downloadFile(name: string): void`
Downloads a file to the user's system.

```javascript
fileManagement.downloadFile('data.json');
```

#### `closeTab(name: string): void`
Closes a tab without deleting the file.

```javascript
fileManagement.closeTab('temp.txt');
```

#### `updateFileContent(newContent: string): Promise<void>`
Updates the content of the active file (supports undo).

```javascript
await fileManagement.updateFileContent('Updated content');
```

## Command Pattern Integration

All file operations use the command pattern for undo/redo support:

```javascript
import { FileCreateCommand } from '@symphony/features/FileManagement';
import { useCommand } from '@symphony/commands';

const { executeCommand, undo, redo } = useCommand();

// Create a file
const command = new FileCreateCommand(fileManager, 'test.js', '');
await executeCommand(command);

// Undo the creation
await undo();

// Redo the creation
await redo();
```

## Storage Persistence

Files are automatically persisted to storage:
- **Web**: localStorage
- **Desktop**: JSON files in platform-specific directories

Storage keys:
- `files` - Array of file objects
- `activeFileName` - Currently active file name
- `openTabs` - Array of open tab names

## Events

### `onFileChange(file: {name: string, content: string}): void`
Called when a file is selected or its content changes.

```javascript
<FileManagementFeature 
  onFileChange={(file) => {
    console.log('File changed:', file.name);
    updateOutline(file.content);
  }}
>
  {/* ... */}
</FileManagementFeature>
```

## Best Practices

1. **Use the hook for simple cases**: If you don't need render props, use `useFileManagement()`
2. **Handle file changes**: Always provide `onFileChange` callback to react to file updates
3. **Check for duplicates**: The feature checks for duplicate file names automatically
4. **Use commands for operations**: All operations use commands for undo/redo support
5. **Persist state**: File state is automatically persisted to storage

## Testing

```javascript
import { renderHook, act } from '@testing-library/react-hooks';
import { useFileManagement } from '@symphony/features/FileManagement';

test('creates a new file', async () => {
  const { result } = renderHook(() => useFileManagement());
  
  await act(async () => {
    await result.current.createFile('test.js', 'console.log("test")');
  });
  
  expect(result.current.files).toHaveLength(2); // Including default file
  expect(result.current.files[1].name).toBe('test.js');
});
```

## Migration from Old Code

### Before (Old Pattern)
```javascript
const { files, setFiles, activeFileName, setActiveFileName } = useEditorState();
const { handleNewFile, handleDeleteFile } = useFileOperations({...});
```

### After (New Pattern)
```javascript
const fileManagement = useFileManagement();
// Access: fileManagement.files, fileManagement.activeFileName
// Operations: fileManagement.createFile(), fileManagement.deleteFile()
```

## Dependencies

- `@symphony/commands` - Command pattern for undo/redo
- `react` - React hooks
- Storage service - Platform-agnostic storage

## License

MIT
