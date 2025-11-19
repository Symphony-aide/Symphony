# StatusBar Migration Guide

## Overview

This guide helps you migrate from the original StatusBar component to the refactored version that follows the [Page, Feature, Component] architecture pattern.

## Table of Contents

1. [Quick Migration](#quick-migration)
2. [Migration Options](#migration-options)
3. [API Changes](#api-changes)
4. [Usage Patterns](#usage-patterns)
5. [Common Scenarios](#common-scenarios)
6. [Troubleshooting](#troubleshooting)

## Quick Migration

### Minimal Changes (Drop-in Replacement)

The refactored StatusBar maintains the same API, so migration is straightforward:

```javascript
// Before
import StatusBar from '@symphony/statusbar';

<StatusBar
  activeFileName={activeFileName}
  saved={isSaved}
  terminalVisible={terminalVisible}
  onToggleTerminal={handleToggleTerminal}
  lineCount={lineCount}
  cursorPosition={cursorPosition}
  language={language}
/>

// After - Just change the import
import StatusBar from '@symphony/statusbar/StatusBar.refactored';

<StatusBar
  activeFileName={activeFileName}
  lastSaved={lastSavedTimestamp}  // Use lastSaved instead of saved
  terminalVisible={terminalVisible}
  onToggleTerminal={handleToggleTerminal}
  lineCount={lineCount}
  cursorPosition={cursorPosition}
  language={language}
/>
```

**Key Change**: Replace `saved` boolean with `lastSaved` timestamp for better accuracy.

## Migration Options

### Option 1: Drop-in Replacement (Easiest)

**When to use**: You want minimal code changes and the same API.

**Steps**:
1. Update import path
2. Replace `saved` prop with `lastSaved`
3. Test the component

```javascript
// Old
import StatusBar from '@symphony/statusbar';

<StatusBar
  activeFileName="index.js"
  saved={true}
  terminalVisible={false}
  onToggleTerminal={() => setTerminalVisible(!terminalVisible)}
/>

// New
import StatusBar from '@symphony/statusbar/StatusBar.refactored';

<StatusBar
  activeFileName="index.js"
  lastSaved={new Date()}
  terminalVisible={false}
  onToggleTerminal={() => setTerminalVisible(!terminalVisible)}
/>
```

### Option 2: Use Features + UI Component (Recommended)

**When to use**: You want more control and flexibility.

**Steps**:
1. Import features and UI component
2. Compose them together
3. Customize as needed

```javascript
import { StatusInfoFeature, TimeTrackingFeature } from '@symphony/features';
import { StatusBarUI } from '@symphony/statusbar';

function MyStatusBar({ activeFileName, lineCount, cursorPosition, language, lastSaved }) {
  const [terminalVisible, setTerminalVisible] = useState(false);

  return (
    <StatusInfoFeature
      activeFileName={activeFileName}
      lineCount={lineCount}
      cursorPosition={cursorPosition}
      language={language}
      lastSaved={lastSaved}
    >
      {({ statusInfo, lastSavedText }) => (
        <TimeTrackingFeature>
          {({ currentTime }) => (
            <StatusBarUI
              {...statusInfo}
              lastSavedText={lastSavedText}
              currentTime={currentTime}
              terminalVisible={terminalVisible}
              onToggleTerminal={() => setTerminalVisible(!terminalVisible)}
            />
          )}
        </TimeTrackingFeature>
      )}
    </StatusInfoFeature>
  );
}
```

### Option 3: Use Hooks Only (Maximum Flexibility)

**When to use**: You need complete control or custom UI.

**Steps**:
1. Import hooks
2. Use hooks in your component
3. Build custom UI

```javascript
import { useStatusInfo, useTimeTracking } from '@symphony/features';

function MyCustomStatusBar({ activeFileName, lineCount, cursorPosition, language, lastSaved }) {
  const { statusInfo, lastSavedText, updateCursorPosition } = useStatusInfo({
    activeFileName,
    lineCount,
    cursorPosition,
    language,
    lastSaved
  });

  const { currentTime, formatRelativeTime } = useTimeTracking();

  return (
    <div className="custom-status-bar">
      <span>{statusInfo.activeFileName}</span>
      <span>{statusInfo.lineCount} lines</span>
      <span>Ln {statusInfo.cursorPosition.line}, Col {statusInfo.cursorPosition.column}</span>
      <span>{lastSavedText}</span>
      <span>{currentTime}</span>
    </div>
  );
}
```

## API Changes

### Props Comparison

| Old Prop | New Prop | Type | Notes |
|----------|----------|------|-------|
| `activeFileName` | `activeFileName` | string | No change |
| `saved` | `lastSaved` | boolean → Date | Changed to timestamp for accuracy |
| `terminalVisible` | `terminalVisible` | boolean | No change |
| `onToggleTerminal` | `onToggleTerminal` | Function | No change |
| `lineCount` | `lineCount` | number | No change |
| `cursorPosition` | `cursorPosition` | Object | No change |
| `language` | `language` | string | No change |
| N/A | `gitBranch` | string | New prop (optional) |
| N/A | `collaborators` | Array | New prop (optional) |
| N/A | `isOnline` | boolean | New prop (optional) |

### New Props

```javascript
<StatusBar
  // ... existing props
  gitBranch="main"                    // Git branch name
  collaborators={['user1', 'user2']}  // List of collaborators
  isOnline={true}                     // Online status
/>
```

### Deprecated Props

- `saved` (boolean) - Use `lastSaved` (Date) instead

```javascript
// Old
<StatusBar saved={true} />

// New
<StatusBar lastSaved={new Date()} />

// Or if not saved yet
<StatusBar lastSaved={null} />
```

## Usage Patterns

### Pattern 1: Basic Usage

```javascript
import StatusBar from '@symphony/statusbar/StatusBar.refactored';

function Editor() {
  const [activeFile, setActiveFile] = useState('index.js');
  const [lineCount, setLineCount] = useState(100);
  const [cursorPos, setCursorPos] = useState({ line: 1, column: 1 });
  const [lastSaved, setLastSaved] = useState(null);
  const [terminalVisible, setTerminalVisible] = useState(false);

  const handleSave = () => {
    // Save logic
    setLastSaved(new Date());
  };

  return (
    <div>
      {/* Editor content */}
      <StatusBar
        activeFileName={activeFile}
        lineCount={lineCount}
        cursorPosition={cursorPos}
        language="JavaScript"
        lastSaved={lastSaved}
        terminalVisible={terminalVisible}
        onToggleTerminal={() => setTerminalVisible(!terminalVisible)}
      />
    </div>
  );
}
```

### Pattern 2: With Git Integration

```javascript
import StatusBar from '@symphony/statusbar/StatusBar.refactored';
import { useGitBranch } from './hooks/useGitBranch';

function Editor() {
  const { currentBranch } = useGitBranch();

  return (
    <StatusBar
      activeFileName="index.js"
      lineCount={100}
      cursorPosition={{ line: 1, column: 1 }}
      language="JavaScript"
      lastSaved={new Date()}
      gitBranch={currentBranch}
      terminalVisible={false}
      onToggleTerminal={() => {}}
    />
  );
}
```

### Pattern 3: With Collaboration

```javascript
import StatusBar from '@symphony/statusbar/StatusBar.refactored';
import { useCollaboration } from './hooks/useCollaboration';

function Editor() {
  const { collaborators, isOnline } = useCollaboration();

  return (
    <StatusBar
      activeFileName="index.js"
      lineCount={100}
      cursorPosition={{ line: 1, column: 1 }}
      language="JavaScript"
      lastSaved={new Date()}
      collaborators={collaborators}
      isOnline={isOnline}
      terminalVisible={false}
      onToggleTerminal={() => {}}
    />
  );
}
```

### Pattern 4: Custom UI with Features

```javascript
import { StatusInfoFeature, TimeTrackingFeature } from '@symphony/features';

function CustomStatusBar() {
  return (
    <StatusInfoFeature
      activeFileName="index.js"
      lineCount={100}
      cursorPosition={{ line: 1, column: 1 }}
      language="JavaScript"
      lastSaved={new Date()}
    >
      {({ statusInfo, lastSavedText }) => (
        <TimeTrackingFeature>
          {({ currentTime }) => (
            <div className="my-custom-status-bar">
              <div className="left">
                <span>{statusInfo.activeFileName}</span>
                <span>{statusInfo.lineCount} lines</span>
              </div>
              <div className="right">
                <span>{lastSavedText}</span>
                <span>{currentTime}</span>
              </div>
            </div>
          )}
        </TimeTrackingFeature>
      )}
    </StatusInfoFeature>
  );
}
```

### Pattern 5: Hooks Only

```javascript
import { useStatusInfo, useTimeTracking } from '@symphony/features';

function MinimalStatusBar() {
  const { statusInfo, lastSavedText } = useStatusInfo({
    activeFileName: 'index.js',
    lineCount: 100,
    cursorPosition: { line: 1, column: 1 },
    language: 'JavaScript',
    lastSaved: new Date()
  });

  const { currentTime } = useTimeTracking();

  return (
    <div className="status-bar">
      <span>{statusInfo.activeFileName} • {statusInfo.lineCount} lines</span>
      <span>{lastSavedText}</span>
      <span>{currentTime}</span>
    </div>
  );
}
```

## Common Scenarios

### Scenario 1: Tracking File Changes

```javascript
import { useState, useEffect } from 'react';
import StatusBar from '@symphony/statusbar/StatusBar.refactored';

function Editor() {
  const [content, setContent] = useState('');
  const [lastSaved, setLastSaved] = useState(new Date());
  const [lineCount, setLineCount] = useState(0);

  useEffect(() => {
    // Update line count when content changes
    setLineCount(content.split('\n').length);
  }, [content]);

  const handleSave = () => {
    // Save logic
    setLastSaved(new Date());
  };

  return (
    <>
      <textarea value={content} onChange={(e) => setContent(e.target.value)} />
      <StatusBar
        activeFileName="index.js"
        lineCount={lineCount}
        lastSaved={lastSaved}
        language="JavaScript"
        cursorPosition={{ line: 1, column: 1 }}
        terminalVisible={false}
        onToggleTerminal={() => {}}
      />
    </>
  );
}
```

### Scenario 2: Tracking Cursor Position

```javascript
import { useState } from 'react';
import StatusBar from '@symphony/statusbar/StatusBar.refactored';

function Editor() {
  const [cursorPos, setCursorPos] = useState({ line: 1, column: 1 });

  const handleCursorMove = (line, column) => {
    setCursorPos({ line, column });
  };

  return (
    <>
      <MonacoEditor
        onCursorPositionChange={handleCursorMove}
      />
      <StatusBar
        activeFileName="index.js"
        lineCount={100}
        cursorPosition={cursorPos}
        language="JavaScript"
        lastSaved={new Date()}
        terminalVisible={false}
        onToggleTerminal={() => {}}
      />
    </>
  );
}
```

### Scenario 3: Auto-save Integration

```javascript
import { useState, useEffect } from 'react';
import { useAutoSave } from '@symphony/features';
import StatusBar from '@symphony/statusbar/StatusBar.refactored';

function Editor() {
  const [content, setContent] = useState('');
  const [lastSaved, setLastSaved] = useState(null);

  const { enableAutoSave } = useAutoSave({
    data: content,
    onSave: (data) => {
      // Save logic
      console.log('Auto-saving:', data);
      setLastSaved(new Date());
    },
    interval: 2000
  });

  useEffect(() => {
    enableAutoSave();
  }, [enableAutoSave]);

  return (
    <>
      <textarea value={content} onChange={(e) => setContent(e.target.value)} />
      <StatusBar
        activeFileName="index.js"
        lineCount={content.split('\n').length}
        lastSaved={lastSaved}
        language="JavaScript"
        cursorPosition={{ line: 1, column: 1 }}
        terminalVisible={false}
        onToggleTerminal={() => {}}
      />
    </>
  );
}
```

### Scenario 4: Multiple Files

```javascript
import { useState } from 'react';
import StatusBar from '@symphony/statusbar/StatusBar.refactored';

function MultiFileEditor() {
  const [files, setFiles] = useState([
    { name: 'index.js', content: '', lastSaved: new Date(), language: 'JavaScript' },
    { name: 'styles.css', content: '', lastSaved: new Date(), language: 'CSS' }
  ]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);

  const activeFile = files[activeFileIndex];

  return (
    <>
      <div className="tabs">
        {files.map((file, index) => (
          <button key={index} onClick={() => setActiveFileIndex(index)}>
            {file.name}
          </button>
        ))}
      </div>
      <textarea value={activeFile.content} onChange={(e) => {
        const newFiles = [...files];
        newFiles[activeFileIndex].content = e.target.value;
        setFiles(newFiles);
      }} />
      <StatusBar
        activeFileName={activeFile.name}
        lineCount={activeFile.content.split('\n').length}
        lastSaved={activeFile.lastSaved}
        language={activeFile.language}
        cursorPosition={{ line: 1, column: 1 }}
        terminalVisible={false}
        onToggleTerminal={() => {}}
      />
    </>
  );
}
```

## Troubleshooting

### Issue 1: "saved" prop not working

**Problem**: The `saved` boolean prop is deprecated.

**Solution**: Use `lastSaved` timestamp instead.

```javascript
// Old
<StatusBar saved={true} />

// New
<StatusBar lastSaved={new Date()} />
```

### Issue 2: Time not updating

**Problem**: Current time is not updating automatically.

**Solution**: Ensure TimeTrackingFeature is being used (it's included in the refactored StatusBar).

```javascript
// If using hooks directly
const { currentTime } = useTimeTracking({
  updateInterval: 60000 // Update every minute
});
```

### Issue 3: Last saved time shows "Just now" forever

**Problem**: `lastSaved` is being set to a string instead of a Date object.

**Solution**: Always use Date objects for `lastSaved`.

```javascript
// Wrong
<StatusBar lastSaved="2025-01-13" />

// Correct
<StatusBar lastSaved={new Date('2025-01-13')} />
<StatusBar lastSaved={new Date()} />
```

### Issue 4: Features not found

**Problem**: Import error for features.

**Solution**: Ensure `@symphony/features` package is installed and exported.

```javascript
// Check package.json
{
  "dependencies": {
    "@symphony/features": "workspace:*"
  }
}

// Check features/src/index.js exports
export { StatusInfoFeature, useStatusInfo } from "./StatusInfo";
export { TimeTrackingFeature, useTimeTracking } from "./TimeTracking";
```

### Issue 5: Cursor position not updating

**Problem**: Cursor position stays at (1, 1).

**Solution**: Ensure you're passing updated cursor position from your editor.

```javascript
// Monaco Editor example
const handleCursorChange = (e) => {
  const position = e.position;
  setCursorPosition({
    line: position.lineNumber,
    column: position.column
  });
};

<MonacoEditor
  onDidChangeCursorPosition={handleCursorChange}
/>
```

### Issue 6: Terminal toggle not working

**Problem**: Terminal doesn't show/hide when button is clicked.

**Solution**: Ensure `onToggleTerminal` callback is properly implemented.

```javascript
const [terminalVisible, setTerminalVisible] = useState(false);

<StatusBar
  terminalVisible={terminalVisible}
  onToggleTerminal={() => setTerminalVisible(!terminalVisible)}
/>

{terminalVisible && <Terminal />}
```

## Testing

### Testing the Refactored Component

```javascript
import { render, screen } from '@testing-library/react';
import StatusBar from '@symphony/statusbar/StatusBar.refactored';

describe('StatusBar', () => {
  it('should render file information', () => {
    render(
      <StatusBar
        activeFileName="index.js"
        lineCount={100}
        cursorPosition={{ line: 10, column: 5 }}
        language="JavaScript"
        lastSaved={new Date()}
        terminalVisible={false}
        onToggleTerminal={() => {}}
      />
    );

    expect(screen.getByText(/index.js/)).toBeInTheDocument();
    expect(screen.getByText(/100 lines/)).toBeInTheDocument();
    expect(screen.getByText(/Ln 10, Col 5/)).toBeInTheDocument();
  });
});
```

### Testing with Features

```javascript
import { renderHook } from '@testing-library/react-hooks';
import { useStatusInfo, useTimeTracking } from '@symphony/features';

describe('Features', () => {
  it('should format last saved time', () => {
    const { result } = renderHook(() => useStatusInfo({
      lastSaved: new Date(Date.now() - 5 * 60000)
    }));

    expect(result.current.lastSavedText).toBe('5 mins ago');
  });

  it('should track current time', () => {
    const { result } = renderHook(() => useTimeTracking());
    expect(result.current.currentTime).toBeTruthy();
  });
});
```

## Summary

### Migration Checklist

- [ ] Update import path to refactored version
- [ ] Replace `saved` prop with `lastSaved` timestamp
- [ ] Test all StatusBar functionality
- [ ] Update tests if needed
- [ ] Consider using features directly for more control
- [ ] Add new props (gitBranch, collaborators, isOnline) if needed

### Key Takeaways

1. **Minimal changes required** - The refactored version maintains API compatibility
2. **Use `lastSaved` instead of `saved`** - More accurate and flexible
3. **Three usage patterns** - Choose based on your needs (integrated, features, hooks)
4. **Features are reusable** - StatusInfo and TimeTracking can be used elsewhere
5. **Backward compatible** - Original component still available during migration

---

**Last Updated**: January 13, 2025  
**Package**: @symphony/statusbar v0.1.0
