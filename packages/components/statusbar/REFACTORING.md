# StatusBar Package Refactoring Documentation

## Overview

The `@symphony/statusbar` package has been refactored to follow the **[Page, Feature, Component]** architecture pattern, separating business logic into reusable features and creating pure UI components.

## Documentation Date
January 13, 2025

## Refactoring Summary

### Before Refactoring
- **Single component**: `StatusBar.jsx` (108 lines)
- **Mixed concerns**: UI rendering + time tracking + status formatting
- **Hard to test**: Business logic embedded in component
- **Not reusable**: Time tracking logic locked in component

### After Refactoring
- **2 Features**: `StatusInfo`, `TimeTracking`
- **1 Pure UI Component**: `StatusBarUI`
- **1 Integrated Component**: `StatusBar` (uses features)
- **Clear separation**: Business logic in features, UI in components
- **Highly testable**: Features and UI can be tested independently
- **Reusable**: Features can be used in other components

## Architecture

### Component Hierarchy

```
StatusBar (Integrated Component)
├── StatusInfoFeature (Business Logic)
│   └── useStatusInfo hook
│       ├── Status state management
│       ├── Last saved formatting
│       └── Update methods
└── TimeTrackingFeature (Business Logic)
    └── useTimeTracking hook
        ├── Current time tracking
        ├── Relative time formatting
        └── Time utilities
    └── StatusBarUI (Pure UI)
        ├── File information display
        ├── Cursor position display
        ├── Terminal toggle button
        └── System status display
```

### Package Structure

```
packages/
├── features/
│   └── src/
│       ├── StatusInfo/
│       │   ├── hooks/
│       │   │   └── useStatusInfo.js
│       │   ├── StatusInfoFeature.jsx
│       │   └── index.js
│       └── TimeTracking/
│           ├── hooks/
│           │   └── useTimeTracking.js
│           ├── TimeTrackingFeature.jsx
│           └── index.js
└── components/
    └── statusbar/
        └── src/
            ├── components/
            │   └── StatusBarUI.jsx
            ├── StatusBar.jsx (original)
            ├── StatusBar.refactored.jsx (new)
            └── index.js
```

## Features Extracted

### 1. StatusInfo Feature

**Location**: `packages/features/src/StatusInfo/`

**Purpose**: Manages status bar information including file details, cursor position, language, git branch, collaborators, and online status.

**Exports**:
- `StatusInfoFeature` - Feature component with render props
- `useStatusInfo` - Hook for direct usage

**API**:
```javascript
const {
  statusInfo,              // Current status information object
  lastSavedText,          // Formatted last saved text
  updateCursorPosition,   // Update cursor position
  updateActiveFile,       // Update active file info
  updateLastSaved,        // Update last saved timestamp
  updateGitBranch,        // Update git branch
  updateCollaborators,    // Update collaborators list
  updateOnlineStatus,     // Update online status
  formatLastSaved         // Format timestamp to relative time
} = useStatusInfo(options);
```

**Features**:
- ✅ Status state management
- ✅ Last saved time formatting (relative)
- ✅ Cursor position tracking
- ✅ Active file information
- ✅ Git branch tracking
- ✅ Collaborators management
- ✅ Online/offline status

**Usage Example**:
```javascript
import { StatusInfoFeature } from '@symphony/features';

<StatusInfoFeature
  activeFileName="index.js"
  lineCount={100}
  cursorPosition={{ line: 10, column: 5 }}
  language="JavaScript"
  lastSaved={new Date()}
>
  {({ statusInfo, lastSavedText, updateCursorPosition }) => (
    <div>
      <span>{statusInfo.activeFileName}</span>
      <span>Last saved: {lastSavedText}</span>
    </div>
  )}
</StatusInfoFeature>
```

### 2. TimeTracking Feature

**Location**: `packages/features/src/TimeTracking/`

**Purpose**: Manages current time display and provides utilities for formatting timestamps in various formats.

**Exports**:
- `TimeTrackingFeature` - Feature component with render props
- `useTimeTracking` - Hook for direct usage

**API**:
```javascript
const {
  currentTime,           // Current time string (updates automatically)
  updateTime,           // Manually update time
  formatRelativeTime,   // Format to relative time (e.g., "5 mins ago")
  formatAbsoluteTime,   // Format to absolute time (e.g., "10:30 AM")
  formatDate,           // Format to date string
  formatDateTime,       // Format to full date and time
  getTimeDiff,          // Get time difference in milliseconds
  isToday,              // Check if timestamp is today
  isWithinMinutes       // Check if within N minutes
} = useTimeTracking(options);
```

**Features**:
- ✅ Auto-updating current time
- ✅ Configurable update interval
- ✅ Relative time formatting ("5 mins ago")
- ✅ Absolute time formatting ("10:30 AM")
- ✅ Date formatting
- ✅ Time difference calculations
- ✅ Time comparison utilities

**Usage Example**:
```javascript
import { TimeTrackingFeature } from '@symphony/features';

<TimeTrackingFeature updateInterval={60000}>
  {({ currentTime, formatRelativeTime }) => (
    <div>
      <span>Current: {currentTime}</span>
      <span>Last saved: {formatRelativeTime(lastSaved)}</span>
    </div>
  )}
</TimeTrackingFeature>
```

## Component Refactoring

### StatusBarUI Component

**Location**: `packages/components/statusbar/src/components/StatusBarUI.jsx`

**Purpose**: Pure presentational component for rendering the status bar UI.

**Characteristics**:
- ✅ **Pure UI**: No business logic
- ✅ **Stateless**: All state passed via props
- ✅ **Testable**: Easy to test with different props
- ✅ **Reusable**: Can be used with any data source

**Props**:
```javascript
{
  activeFileName: string,
  lineCount: number,
  cursorPosition: { line: number, column: number },
  language: string,
  lastSavedText: string,
  gitBranch: string,
  collaborators: Array,
  isOnline: boolean,
  currentTime: string,
  terminalVisible: boolean,
  onToggleTerminal: Function
}
```

### Integrated StatusBar Component

**Location**: `packages/components/statusbar/src/StatusBar.refactored.jsx`

**Purpose**: Integrated component that combines features with UI.

**Pattern**:
```javascript
StatusBar (Props) 
  → StatusInfoFeature (Business Logic)
    → TimeTrackingFeature (Business Logic)
      → StatusBarUI (Pure UI)
```

**Benefits**:
- ✅ Clean API for consumers
- ✅ Features handle all logic
- ✅ UI component is pure and testable
- ✅ Easy to extend with new features

## Migration Guide

### Option 1: Drop-in Replacement (Recommended)

Replace the old StatusBar with the refactored version:

```javascript
// Before
import StatusBar from '@symphony/statusbar';

// After
import StatusBar from '@symphony/statusbar/StatusBar.refactored';

// Usage stays the same
<StatusBar
  activeFileName={activeFileName}
  lineCount={lineCount}
  cursorPosition={cursorPosition}
  language={language}
  lastSaved={lastSaved}
  terminalVisible={terminalVisible}
  onToggleTerminal={handleToggleTerminal}
/>
```

### Option 2: Use Features Directly

For more control, use features directly:

```javascript
import { StatusInfoFeature, TimeTrackingFeature } from '@symphony/features';
import { StatusBarUI } from '@symphony/statusbar';

function MyStatusBar() {
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
              terminalVisible={terminalVisible}
              onToggleTerminal={handleToggleTerminal}
            />
          )}
        </TimeTrackingFeature>
      )}
    </StatusInfoFeature>
  );
}
```

### Option 3: Use Hooks Only

For maximum flexibility, use hooks directly:

```javascript
import { useStatusInfo, useTimeTracking } from '@symphony/features';
import { StatusBarUI } from '@symphony/statusbar';

function MyStatusBar() {
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
      terminalVisible={terminalVisible}
      onToggleTerminal={handleToggleTerminal}
    />
  );
}
```

## Benefits of Refactoring

### 1. Separation of Concerns
- **Before**: UI + business logic mixed in one component
- **After**: Features handle logic, UI component handles presentation

### 2. Reusability
- **Before**: Time tracking logic locked in StatusBar
- **After**: TimeTracking feature can be used anywhere

### 3. Testability
- **Before**: Hard to test time formatting without rendering UI
- **After**: Features and UI can be tested independently

### 4. Maintainability
- **Before**: Changes to logic require modifying UI component
- **After**: Logic changes isolated in features

### 5. Flexibility
- **Before**: Fixed implementation
- **After**: Multiple usage patterns (integrated, features, hooks)

## Testing Strategy

### Feature Tests

```javascript
// Test StatusInfo feature
import { renderHook, act } from '@testing-library/react-hooks';
import { useStatusInfo } from '@symphony/features';

describe('useStatusInfo', () => {
  it('should format last saved time correctly', () => {
    const { result } = renderHook(() => useStatusInfo({
      lastSaved: new Date(Date.now() - 5 * 60000) // 5 minutes ago
    }));

    expect(result.current.lastSavedText).toBe('5 mins ago');
  });

  it('should update cursor position', () => {
    const { result } = renderHook(() => useStatusInfo());

    act(() => {
      result.current.updateCursorPosition(10, 5);
    });

    expect(result.current.statusInfo.cursorPosition).toEqual({
      line: 10,
      column: 5
    });
  });
});

// Test TimeTracking feature
import { useTimeTracking } from '@symphony/features';

describe('useTimeTracking', () => {
  it('should format relative time correctly', () => {
    const { result } = renderHook(() => useTimeTracking());
    const timestamp = new Date(Date.now() - 10 * 60000); // 10 minutes ago

    expect(result.current.formatRelativeTime(timestamp)).toBe('10 minutes ago');
  });

  it('should update current time', () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useTimeTracking({
      updateInterval: 1000
    }));

    const initialTime = result.current.currentTime;

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.currentTime).not.toBe(initialTime);

    jest.useRealTimers();
  });
});
```

### UI Component Tests

```javascript
// Test StatusBarUI component
import { render, screen } from '@testing-library/react';
import { StatusBarUI } from '@symphony/statusbar';

describe('StatusBarUI', () => {
  it('should render file information', () => {
    render(
      <StatusBarUI
        activeFileName="index.js"
        lineCount={100}
        cursorPosition={{ line: 10, column: 5 }}
        language="JavaScript"
      />
    );

    expect(screen.getByText(/index.js/)).toBeInTheDocument();
    expect(screen.getByText(/100 lines/)).toBeInTheDocument();
    expect(screen.getByText(/Ln 10, Col 5/)).toBeInTheDocument();
    expect(screen.getByText(/JavaScript/)).toBeInTheDocument();
  });

  it('should call onToggleTerminal when button clicked', () => {
    const handleToggle = jest.fn();
    render(
      <StatusBarUI
        terminalVisible={false}
        onToggleTerminal={handleToggle}
      />
    );

    const button = screen.getByText(/Show Terminal/);
    button.click();

    expect(handleToggle).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Tests

```javascript
// Test integrated StatusBar component
import { render, screen } from '@testing-library/react';
import StatusBar from '@symphony/statusbar/StatusBar.refactored';

describe('StatusBar (integrated)', () => {
  it('should render with all features', () => {
    render(
      <StatusBar
        activeFileName="index.js"
        lineCount={100}
        cursorPosition={{ line: 10, column: 5 }}
        language="JavaScript"
        lastSaved={new Date(Date.now() - 5 * 60000)}
        gitBranch="main"
        isOnline={true}
        terminalVisible={false}
        onToggleTerminal={() => {}}
      />
    );

    expect(screen.getByText(/index.js/)).toBeInTheDocument();
    expect(screen.getByText(/5 mins ago/)).toBeInTheDocument();
    expect(screen.getByText(/main/)).toBeInTheDocument();
    expect(screen.getByText(/Online/)).toBeInTheDocument();
  });
});
```

## Performance Considerations

### Time Updates

The TimeTracking feature updates every minute by default. This can be configured:

```javascript
// Update every 30 seconds
<TimeTrackingFeature updateInterval={30000}>
  {({ currentTime }) => <span>{currentTime}</span>}
</TimeTrackingFeature>

// Update every 5 minutes
<TimeTrackingFeature updateInterval={300000}>
  {({ currentTime }) => <span>{currentTime}</span>}
</TimeTrackingFeature>
```

### Memoization

The features use `useCallback` to memoize functions and prevent unnecessary re-renders:

```javascript
// In useStatusInfo
const updateCursorPosition = useCallback((line, column) => {
  setStatusInfo(prev => ({
    ...prev,
    cursorPosition: { line, column }
  }));
}, []);
```

### Optimization Tips

1. **Debounce cursor updates**: If cursor position updates frequently
```javascript
import { debounce } from 'lodash';

const debouncedUpdate = debounce(updateCursorPosition, 100);
```

2. **Memoize StatusBarUI**: Prevent re-renders when props don't change
```javascript
export const StatusBarUI = React.memo(function StatusBarUI(props) {
  // ... component code
});
```

3. **Lazy load features**: Only load features when needed
```javascript
const StatusInfoFeature = React.lazy(() => 
  import('@symphony/features').then(m => ({ default: m.StatusInfoFeature }))
);
```

## Future Enhancements

### Potential Features to Extract

1. **TerminalControl Feature**
   - Terminal visibility state
   - Terminal toggle logic
   - Terminal history

2. **CollaborationStatus Feature**
   - Real-time collaborator tracking
   - Presence indicators
   - Collaboration events

3. **GitStatus Feature**
   - Branch management
   - Commit status
   - Git operations

4. **NetworkStatus Feature**
   - Online/offline detection
   - Connection quality
   - Reconnection logic

### Extensibility

The refactored architecture makes it easy to add new features:

```javascript
// Add a new feature
import { StatusInfoFeature, TimeTrackingFeature, GitStatusFeature } from '@symphony/features';

<StatusInfoFeature {...statusProps}>
  {(statusAPI) => (
    <TimeTrackingFeature>
      {(timeAPI) => (
        <GitStatusFeature>
          {(gitAPI) => (
            <StatusBarUI
              {...statusAPI.statusInfo}
              {...timeAPI}
              {...gitAPI}
            />
          )}
        </GitStatusFeature>
      )}
    </TimeTrackingFeature>
  )}
</StatusInfoFeature>
```

## UI Component Migration (December 2025)

As part of the component-packages-migration initiative, the StatusBar has been updated to use UI components from `@symphony/ui` instead of raw HTML elements.

### Changes Made

| Before | After |
|--------|-------|
| `<div>` (outer container) | `<Flex as="footer">` |
| `<div>` (section containers) | `<Flex>` with `align` and `gap` props |
| `<span>` (text content) | `<Text>` |
| Raw HTML structure | Semantic UI components |

### Benefits

1. **Consistency**: Uses the same UI primitives as other Symphony components
2. **Accessibility**: UI components include proper ARIA attributes
3. **Maintainability**: Centralized styling through the UI package
4. **Semantic HTML**: `<Flex as="footer">` renders as `<footer>` element
5. **Type Safety**: UI components provide TypeScript support

### Example Migration

```jsx
// Before
<div className='flex items-center space-x-4'>
  <span className='flex items-center space-x-1'>
    <GitBranch className='w-3 h-3' />
    <span>{gitBranch}</span>
  </span>
</div>

// After
<Flex align="center" gap={4}>
  <Flex align="center" gap={1}>
    <GitBranch className='w-3 h-3' />
    <Text>{gitBranch}</Text>
  </Flex>
</Flex>
```

### UI Components Used

- **Flex**: Layout container with flexbox properties (`align`, `justify`, `gap`)
- **Text**: Typography component for consistent text rendering
- **Button**: Interactive button component (already in use)
- **Badge**: Status indicators (planned)
- **Separator**: Visual dividers between sections (planned)

---

## Backward Compatibility

The original `StatusBar.jsx` is preserved for backward compatibility. To use the refactored version:

```javascript
// Old (still works)
import StatusBar from '@symphony/statusbar';

// New (recommended)
import StatusBar from '@symphony/statusbar/StatusBar.refactored';
```

Once all consumers are migrated, `StatusBar.refactored.jsx` can be renamed to `StatusBar.jsx`.

## Conclusion

The StatusBar refactoring successfully demonstrates the [Page, Feature, Component] architecture pattern:

- ✅ **Features**: StatusInfo and TimeTracking encapsulate business logic
- ✅ **Components**: StatusBarUI is a pure presentational component
- ✅ **Integration**: StatusBar combines features and UI seamlessly
- ✅ **Reusability**: Features can be used in other components
- ✅ **Testability**: Clear separation enables comprehensive testing
- ✅ **Maintainability**: Changes are isolated and easy to implement
- ✅ **UI Components**: Uses `@symphony/ui` primitives (Flex, Text, Button) for consistency

---

**Last Updated**: December 23, 2025  
**Author**: Symphony Development Team  
**Status**: Complete (UI component migration in progress)
