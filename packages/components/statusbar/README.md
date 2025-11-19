# @symphony/statusbar

A refactored status bar component following the [Page, Feature, Component] architecture pattern, displaying file information, cursor position, language detection, git status, and system information.

## Overview

This package provides a status bar component for the Symphony IDE that shows essential information about the current editor state and system status. The package has been refactored to separate business logic into reusable features.

## Installation

```bash
# Using pnpm (already included in Symphony monorepo)
pnpm install @symphony/statusbar
```

## Exported Components

### `StatusBar` (Original)
The original status bar component (preserved for backward compatibility).

```javascript
import { StatusBar } from "@symphony/statusbar";

<StatusBar
  activeFileName={activeFileName}
  saved={isSaved}
  terminalVisible={isTerminalVisible}
  onToggleTerminal={handleToggleTerminal}
/>
```

### `StatusBarRefactored` (Recommended)
The refactored status bar component using features.

```javascript
import { StatusBarRefactored } from "@symphony/statusbar";

<StatusBarRefactored
  activeFileName={activeFileName}
  lastSaved={lastSavedTimestamp}
  lineCount={lineCount}
  cursorPosition={{ line: 10, column: 5 }}
  language="JavaScript"
  gitBranch="main"
  collaborators={['user1', 'user2']}
  isOnline={true}
  terminalVisible={terminalVisible}
  onToggleTerminal={handleToggleTerminal}
/>
```

### `StatusBarUI` (Pure UI Component)
Pure presentational component for custom implementations.

```javascript
import { StatusBarUI } from "@symphony/statusbar";
import { useStatusInfo, useTimeTracking } from "@symphony/features";

function CustomStatusBar() {
  const { statusInfo, lastSavedText } = useStatusInfo({
    activeFileName: 'index.js',
    lineCount: 100,
    cursorPosition: { line: 10, column: 5 },
    language: 'JavaScript',
    lastSaved: new Date()
  });

  const { currentTime } = useTimeTracking();

  return (
    <StatusBarUI
      {...statusInfo}
      lastSavedText={lastSavedText}
      currentTime={currentTime}
      terminalVisible={false}
      onToggleTerminal={() => {}}
    />
  );
}
```

## Features

### Refactored Architecture
- ✅ **StatusInfo Feature**: Manages file info, cursor position, language, git branch, collaborators
- ✅ **TimeTracking Feature**: Manages current time and timestamp formatting
- ✅ **Pure UI Component**: Stateless presentation component
- ✅ **Integrated Component**: Combines features with UI

### Display Information
- Active file name and line count
- Cursor position (line and column)
- Programming language detection
- Last saved timestamp (relative time)
- Git branch name
- Collaborators count
- Online/offline status
- Current time (auto-updating)
- Terminal visibility toggle

## Quick Start

### Basic Usage (Drop-in Replacement)

```javascript
import { StatusBarRefactored as StatusBar } from "@symphony/statusbar";

function Editor() {
  const [activeFile, setActiveFile] = useState("index.js");
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

### Using Features Directly

```javascript
import { StatusInfoFeature, TimeTrackingFeature } from "@symphony/features";
import { StatusBarUI } from "@symphony/statusbar";

function CustomStatusBar() {
  return (
    <StatusInfoFeature
      activeFileName="index.js"
      lineCount={100}
      cursorPosition={{ line: 10, column: 5 }}
      language="JavaScript"
      lastSaved={new Date()}
    >
      {({ statusInfo, lastSavedText }) => (
        <TimeTrackingFeature>
          {({ currentTime }) => (
            <StatusBarUI
              {...statusInfo}
              lastSavedText={lastSavedText}
              currentTime={currentTime}
              terminalVisible={false}
              onToggleTerminal={() => {}}
            />
          )}
        </TimeTrackingFeature>
      )}
    </StatusInfoFeature>
  );
}
```

## API Reference

### StatusBarRefactored Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `activeFileName` | string | null | Currently active file name |
| `lineCount` | number | 0 | Total number of lines |
| `cursorPosition` | Object | { line: 1, column: 1 } | Cursor position |
| `language` | string | 'JavaScript' | Programming language |
| `lastSaved` | Date | null | Last saved timestamp |
| `gitBranch` | string | 'main' | Current git branch |
| `collaborators` | Array | [] | List of collaborators |
| `isOnline` | boolean | true | Online status |
| `terminalVisible` | boolean | false | Terminal visibility state |
| `onToggleTerminal` | Function | Required | Terminal toggle callback |

### StatusBarUI Props

Same as StatusBarRefactored, but with pre-formatted values:
- `lastSavedText` (string) instead of `lastSaved` (Date)
- `currentTime` (string) for current time display

## Migration from Original

### Before (Original Component)

```javascript
import { StatusBar } from "@symphony/statusbar";

<StatusBar
  activeFileName="index.js"
  saved={true}
  terminalVisible={false}
  onToggleTerminal={() => {}}
/>
```

### After (Refactored Component)

```javascript
import { StatusBarRefactored as StatusBar } from "@symphony/statusbar";

<StatusBar
  activeFileName="index.js"
  lastSaved={new Date()}  // Use timestamp instead of boolean
  lineCount={100}
  cursorPosition={{ line: 1, column: 1 }}
  language="JavaScript"
  terminalVisible={false}
  onToggleTerminal={() => {}}
/>
```

**Key Changes**:
- Replace `saved` (boolean) with `lastSaved` (Date timestamp)
- Add `lineCount`, `cursorPosition`, `language` props
- Optionally add `gitBranch`, `collaborators`, `isOnline` props

## Documentation

- **[REFACTORING.md](./REFACTORING.md)**: Comprehensive refactoring documentation
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)**: Step-by-step migration guide
- **[STATUSBAR_REFACTORING_SUMMARY.md](./STATUSBAR_REFACTORING_SUMMARY.md)**: Executive summary

## Related Features

- **[@symphony/features/StatusInfo](../../features/src/StatusInfo/README.md)**: Status information management
- **[@symphony/features/TimeTracking](../../features/src/TimeTracking/README.md)**: Time tracking and formatting

## Styling

The component uses Tailwind CSS classes and is designed to work with dark themes:

- Dark background (`bg-symphony-primary`)
- Light text (`text-white`)
- Hover effects for interactive elements
- Responsive spacing and typography

## Dependencies

- React
- Lucide React (icons)
- @symphony/features (StatusInfo, TimeTracking)
- ui (Button component)

## Examples

### Example 1: With Git Integration

```javascript
<StatusBar
  activeFileName="index.js"
  lineCount={100}
  cursorPosition={{ line: 10, column: 5 }}
  language="JavaScript"
  lastSaved={new Date()}
  gitBranch="feature/new-feature"
  terminalVisible={false}
  onToggleTerminal={() => {}}
/>
```

### Example 2: With Collaboration

```javascript
<StatusBar
  activeFileName="index.js"
  lineCount={100}
  cursorPosition={{ line: 10, column: 5 }}
  language="JavaScript"
  lastSaved={new Date()}
  collaborators={['user1', 'user2', 'user3']}
  isOnline={true}
  terminalVisible={false}
  onToggleTerminal={() => {}}
/>
```

### Example 3: Custom UI with Hooks

```javascript
import { useStatusInfo, useTimeTracking } from "@symphony/features";

function MinimalStatusBar() {
  const { statusInfo, lastSavedText } = useStatusInfo({
    activeFileName: 'index.js',
    lineCount: 100,
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

## Testing

```javascript
import { render, screen } from '@testing-library/react';
import { StatusBarRefactored } from '@symphony/statusbar';

describe('StatusBar', () => {
  it('should render file information', () => {
    render(
      <StatusBarRefactored
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

---

**Package**: @symphony/statusbar  
**Version**: 0.1.0  
**Last Updated**: January 13, 2025  
**Architecture**: [Page, Feature, Component]
