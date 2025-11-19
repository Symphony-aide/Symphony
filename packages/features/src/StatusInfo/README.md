# StatusInfo Feature

## Overview

The `StatusInfo` feature manages status bar information including file details, cursor position, language detection, git branch, collaborators, and online status. It provides a clean API for tracking and formatting status information.

## Installation

```bash
# Already included in @symphony/features
import { StatusInfoFeature, useStatusInfo } from '@symphony/features';
```

## Features

- ✅ Status state management
- ✅ Last saved time formatting (relative)
- ✅ Cursor position tracking
- ✅ Active file information
- ✅ Git branch tracking
- ✅ Collaborators management
- ✅ Online/offline status
- ✅ Automatic updates

## Usage

### Using the Feature Component

```javascript
import { StatusInfoFeature } from '@symphony/features';

function MyComponent() {
  return (
    <StatusInfoFeature
      activeFileName="index.js"
      lineCount={100}
      cursorPosition={{ line: 10, column: 5 }}
      language="JavaScript"
      lastSaved={new Date()}
      gitBranch="main"
      collaborators={['user1', 'user2']}
      isOnline={true}
    >
      {({ statusInfo, lastSavedText, updateCursorPosition }) => (
        <div>
          <span>{statusInfo.activeFileName}</span>
          <span>{statusInfo.lineCount} lines</span>
          <span>Ln {statusInfo.cursorPosition.line}, Col {statusInfo.cursorPosition.column}</span>
          <span>{statusInfo.language}</span>
          <span>Last saved: {lastSavedText}</span>
          <span>Branch: {statusInfo.gitBranch}</span>
          <span>{statusInfo.collaborators.length} collaborators</span>
          <span>{statusInfo.isOnline ? 'Online' : 'Offline'}</span>
        </div>
      )}
    </StatusInfoFeature>
  );
}
```

### Using the Hook

```javascript
import { useStatusInfo } from '@symphony/features';

function MyComponent() {
  const {
    statusInfo,
    lastSavedText,
    updateCursorPosition,
    updateActiveFile,
    updateLastSaved,
    updateGitBranch,
    updateCollaborators,
    updateOnlineStatus
  } = useStatusInfo({
    activeFileName: 'index.js',
    lineCount: 100,
    cursorPosition: { line: 10, column: 5 },
    language: 'JavaScript',
    lastSaved: new Date(),
    gitBranch: 'main',
    collaborators: [],
    isOnline: true
  });

  // Update cursor position when editor cursor moves
  const handleCursorMove = (line, column) => {
    updateCursorPosition(line, column);
  };

  // Update file info when switching files
  const handleFileChange = (fileName, language, lineCount) => {
    updateActiveFile(fileName, language, lineCount);
  };

  // Update last saved when file is saved
  const handleSave = () => {
    updateLastSaved();
  };

  return (
    <div>
      <span>{statusInfo.activeFileName} • {statusInfo.lineCount} lines</span>
      <span>Ln {statusInfo.cursorPosition.line}, Col {statusInfo.cursorPosition.column}</span>
      <span>Last saved: {lastSavedText}</span>
    </div>
  );
}
```

## API Reference

### StatusInfoFeature Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | Function | Required | Render prop function |
| `activeFileName` | string | null | Currently active file name |
| `lineCount` | number | 0 | Total number of lines |
| `cursorPosition` | Object | { line: 1, column: 1 } | Cursor position |
| `language` | string | 'JavaScript' | Programming language |
| `lastSaved` | Date | null | Last saved timestamp |
| `gitBranch` | string | 'main' | Current git branch |
| `collaborators` | Array | [] | List of collaborators |
| `isOnline` | boolean | true | Online status |

### useStatusInfo Hook

**Parameters**:
```typescript
useStatusInfo(options?: {
  activeFileName?: string;
  lineCount?: number;
  cursorPosition?: { line: number; column: number };
  language?: string;
  lastSaved?: Date;
  gitBranch?: string;
  collaborators?: Array<any>;
  isOnline?: boolean;
})
```

**Returns**:
```typescript
{
  statusInfo: {
    activeFileName: string;
    lineCount: number;
    cursorPosition: { line: number; column: number };
    language: string;
    lastSaved: Date;
    gitBranch: string;
    collaborators: Array<any>;
    isOnline: boolean;
  };
  lastSavedText: string;
  updateCursorPosition: (line: number, column: number) => void;
  updateActiveFile: (fileName: string, language?: string, lineCount?: number) => void;
  updateLastSaved: (timestamp?: Date) => void;
  updateGitBranch: (branch: string) => void;
  updateCollaborators: (collaborators: Array<any>) => void;
  updateOnlineStatus: (isOnline: boolean) => void;
  formatLastSaved: (timestamp: Date) => string;
}
```

## Examples

### Example 1: Basic File Information

```javascript
import { useStatusInfo } from '@symphony/features';

function FileInfo({ fileName, lineCount, language }) {
  const { statusInfo } = useStatusInfo({
    activeFileName: fileName,
    lineCount,
    language
  });

  return (
    <div>
      <h3>{statusInfo.activeFileName}</h3>
      <p>{statusInfo.lineCount} lines of {statusInfo.language}</p>
    </div>
  );
}
```

### Example 2: Cursor Position Tracking

```javascript
import { useStatusInfo } from '@symphony/features';

function EditorStatus({ fileName, lineCount, language }) {
  const { statusInfo, updateCursorPosition } = useStatusInfo({
    activeFileName: fileName,
    lineCount,
    language
  });

  // Connect to Monaco Editor
  const handleCursorChange = (e) => {
    updateCursorPosition(e.position.lineNumber, e.position.column);
  };

  return (
    <div>
      <MonacoEditor onDidChangeCursorPosition={handleCursorChange} />
      <div>
        Ln {statusInfo.cursorPosition.line}, Col {statusInfo.cursorPosition.column}
      </div>
    </div>
  );
}
```

### Example 3: Last Saved Tracking

```javascript
import { useStatusInfo } from '@symphony/features';

function SaveStatus({ fileName }) {
  const { statusInfo, lastSavedText, updateLastSaved } = useStatusInfo({
    activeFileName: fileName,
    lastSaved: null
  });

  const handleSave = async () => {
    // Save file
    await saveFile(fileName);
    
    // Update last saved timestamp
    updateLastSaved();
  };

  return (
    <div>
      <button onClick={handleSave}>Save</button>
      {lastSavedText && <span>Last saved: {lastSavedText}</span>}
    </div>
  );
}
```

### Example 4: Git Integration

```javascript
import { useStatusInfo } from '@symphony/features';
import { useGitBranch } from './hooks/useGitBranch';

function GitStatus() {
  const { currentBranch, switchBranch } = useGitBranch();
  const { statusInfo, updateGitBranch } = useStatusInfo({
    gitBranch: currentBranch
  });

  useEffect(() => {
    updateGitBranch(currentBranch);
  }, [currentBranch, updateGitBranch]);

  return (
    <div>
      <span>Branch: {statusInfo.gitBranch}</span>
      <button onClick={() => switchBranch('develop')}>
        Switch to develop
      </button>
    </div>
  );
}
```

### Example 5: Collaboration Status

```javascript
import { useStatusInfo } from '@symphony/features';
import { useCollaboration } from './hooks/useCollaboration';

function CollaborationStatus() {
  const { collaborators, isOnline } = useCollaboration();
  const { statusInfo, updateCollaborators, updateOnlineStatus } = useStatusInfo({
    collaborators,
    isOnline
  });

  useEffect(() => {
    updateCollaborators(collaborators);
  }, [collaborators, updateCollaborators]);

  useEffect(() => {
    updateOnlineStatus(isOnline);
  }, [isOnline, updateOnlineStatus]);

  return (
    <div>
      <span>{statusInfo.collaborators.length} collaborators</span>
      <span>{statusInfo.isOnline ? 'Online' : 'Offline'}</span>
    </div>
  );
}
```

## Time Formatting

The `formatLastSaved` function formats timestamps to human-readable relative time:

| Time Difference | Output |
|----------------|--------|
| < 1 minute | "Just now" |
| 1 minute | "1 min ago" |
| 2-59 minutes | "X mins ago" |
| 1 hour | "1 hour ago" |
| 2-23 hours | "X hours ago" |
| 1 day | "1 day ago" |
| 2+ days | "X days ago" |

## Best Practices

### 1. Use Memoization for Updates

```javascript
const handleCursorMove = useCallback((line, column) => {
  updateCursorPosition(line, column);
}, [updateCursorPosition]);
```

### 2. Debounce Frequent Updates

```javascript
import { debounce } from 'lodash';

const debouncedCursorUpdate = debounce((line, column) => {
  updateCursorPosition(line, column);
}, 100);
```

### 3. Provide Default Values

```javascript
const { statusInfo } = useStatusInfo({
  activeFileName: fileName || 'Untitled',
  lineCount: lineCount || 0,
  language: language || 'Plain Text'
});
```

### 4. Update Only When Needed

```javascript
useEffect(() => {
  if (lastSaved) {
    updateLastSaved(lastSaved);
  }
}, [lastSaved, updateLastSaved]);
```

## Testing

```javascript
import { renderHook, act } from '@testing-library/react-hooks';
import { useStatusInfo } from '@symphony/features';

describe('useStatusInfo', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useStatusInfo());
    
    expect(result.current.statusInfo.activeFileName).toBeNull();
    expect(result.current.statusInfo.lineCount).toBe(0);
    expect(result.current.statusInfo.cursorPosition).toEqual({ line: 1, column: 1 });
  });

  it('should update cursor position', () => {
    const { result } = renderHook(() => useStatusInfo());
    
    act(() => {
      result.current.updateCursorPosition(10, 5);
    });
    
    expect(result.current.statusInfo.cursorPosition).toEqual({ line: 10, column: 5 });
  });

  it('should format last saved time', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60000);
    const { result } = renderHook(() => useStatusInfo({
      lastSaved: fiveMinutesAgo
    }));
    
    expect(result.current.lastSavedText).toBe('5 mins ago');
  });

  it('should update active file', () => {
    const { result } = renderHook(() => useStatusInfo());
    
    act(() => {
      result.current.updateActiveFile('test.js', 'JavaScript', 50);
    });
    
    expect(result.current.statusInfo.activeFileName).toBe('test.js');
    expect(result.current.statusInfo.language).toBe('JavaScript');
    expect(result.current.statusInfo.lineCount).toBe(50);
  });
});
```

## Related Features

- **TimeTracking**: For current time display and time utilities
- **AutoSave**: For automatic file saving
- **FileManagement**: For file operations

---

**Package**: @symphony/features  
**Feature**: StatusInfo  
**Version**: 1.0.0  
**Last Updated**: January 13, 2025
