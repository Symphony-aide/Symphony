# Commands Package Migration Guide
## [Page, Feature, Component] Architecture

## Overview
This guide helps you migrate from using commands package hooks directly to the new CommandHistory feature in `@symphony/features`.

## What Changed

The commands package now focuses on **core functionality** (CommandManager, BaseCommand, etc.), while **feature-level abstractions** have been extracted to `@symphony/features/CommandHistory`.

### Core Package (`@symphony/commands`)
**Still contains**:
- `CommandManager` - Core command execution
- `CommandStack` - Stack management
- `CommandProcessor` - Command processing
- `BaseCommand` - Base command class
- `CompoundCommand` - Compound commands
- `TransactionCommand` - Transaction commands
- `CommandProvider` - React context
- `useCommand` - Basic command hook
- `UndoRedoToolbar` - UI component

### New Feature (`@symphony/features/CommandHistory`)
**Now provides**:
- `useCommandHistory` - Full history management
- `useUndoRedo` - Simplified undo/redo
- `useUndoRedoShortcuts` - Keyboard shortcuts
- `CommandHistoryFeature` - Feature component

## Migration Examples

### Example 1: Basic Undo/Redo

#### Before
```javascript
import { useCommand, useCommandState } from '@symphony/commands';

function MyEditor() {
  const { executeCommand, undo, redo } = useCommand();
  const { canUndo, canRedo } = useCommandState();

  return (
    <div>
      <button onClick={undo} disabled={!canUndo}>Undo</button>
      <button onClick={redo} disabled={!canRedo}>Redo</button>
    </div>
  );
}
```

#### After (Using Feature)
```javascript
import { useUndoRedo } from '@symphony/features/CommandHistory';

function MyEditor() {
  const { undo, redo, canUndo, canRedo, execute } = useUndoRedo();

  return (
    <div>
      <button onClick={undo} disabled={!canUndo}>Undo</button>
      <button onClick={redo} disabled={!canRedo}>Redo</button>
    </div>
  );
}
```

### Example 2: Command History with Persistence

#### Before
```javascript
import { CommandProvider } from '@symphony/commands';

function App() {
  return (
    <CommandProvider options={{ maxStackSize: 1000, enablePersistence: true }}>
      <MyApp />
    </CommandProvider>
  );
}
```

#### After (Using Feature)
```javascript
import { CommandProvider } from '@symphony/commands';
import { useCommandHistory } from '@symphony/features/CommandHistory';

function App() {
  return (
    <CommandProvider>
      <MyApp />
    </CommandProvider>
  );
}

function MyApp() {
  const history = useCommandHistory({
    maxStackSize: 1000,
    enablePersistence: true
  });

  // Use history.undo(), history.redo(), etc.
}
```

### Example 3: Keyboard Shortcuts

#### Before
```javascript
import { useCommand } from '@symphony/commands';

function MyEditor() {
  const { undo, redo, canUndo, canRedo } = useCommand();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
      } else if (e.ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (canRedo) redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  return <div>Editor</div>;
}
```

#### After (Using Feature)
```javascript
import { useUndoRedo, useUndoRedoShortcuts } from '@symphony/features/CommandHistory';

function MyEditor() {
  const undoRedo = useUndoRedo();
  const { handleKeyDown } = useUndoRedoShortcuts(undoRedo);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return <div>Editor</div>;
}
```

### Example 4: Feature Component Pattern

#### New Pattern (Render Prop)
```javascript
import { CommandHistoryFeature } from '@symphony/features/CommandHistory';

function MyApp() {
  return (
    <CommandHistoryFeature maxStackSize={1000} enablePersistence={true}>
      {(history) => (
        <div>
          <button onClick={history.undo} disabled={!history.canUndo}>
            Undo {history.undoDescription}
          </button>
          <button onClick={history.redo} disabled={!history.canRedo}>
            Redo {history.redoDescription}
          </button>
          <div>History: {history.undoStackSize} commands</div>
        </div>
      )}
    </CommandHistoryFeature>
  );
}
```

## API Changes

### CommandHistory Feature

| Feature | Description |
|---------|-------------|
| `useCommandHistory()` | Full history management with all features |
| `useUndoRedo()` | Simplified undo/redo interface |
| `useUndoRedoShortcuts()` | Keyboard shortcut integration |
| `CommandHistoryFeature` | Render prop component |

### useCommandHistory API

```javascript
const history = useCommandHistory({
  maxStackSize: 1000,
  enablePersistence: true
});

// State
history.canUndo          // boolean
history.canRedo          // boolean
history.undoDescription  // string | null
history.redoDescription  // string | null
history.undoStackSize    // number
history.redoStackSize    // number

// Operations
await history.push(command)        // Add command to history
await history.undo()               // Undo last command
await history.redo()               // Redo last undone command
history.clear()                    // Clear all history
history.getSnapshot()              // Get history snapshot
await history.navigateTo(index)    // Navigate to specific point
```

### useUndoRedo API (Simplified)

```javascript
const undoRedo = useUndoRedo({
  maxStackSize: 1000,
  enablePersistence: true
});

// State
undoRedo.canUndo          // boolean
undoRedo.canRedo          // boolean
undoRedo.undoDescription  // string | null
undoRedo.redoDescription  // string | null

// Operations
await undoRedo.execute(command)  // Execute command
await undoRedo.undo()            // Undo
await undoRedo.redo()            // Redo
```

## When to Use What

### Use Core Package (`@symphony/commands`)
- When you need the `CommandProvider` context
- When creating custom command classes
- When using `BaseCommand`, `CompoundCommand`, etc.
- When you need low-level command execution

### Use Feature Package (`@symphony/features/CommandHistory`)
- When you need undo/redo functionality
- When you need history management
- When you need keyboard shortcuts
- When you want a higher-level API

## Step-by-Step Migration

### Step 1: Install/Update Packages
```bash
pnpm install
```

### Step 2: Update Imports
```javascript
// Change this
import { useCommand, useCommandState } from '@symphony/commands';

// To this
import { useUndoRedo } from '@symphony/features/CommandHistory';
```

### Step 3: Update Hook Usage
```javascript
// Old
const { executeCommand, undo, redo } = useCommand();
const { canUndo, canRedo } = useCommandState();

// New
const { execute, undo, redo, canUndo, canRedo } = useUndoRedo();
```

### Step 4: Update Command Execution
```javascript
// Old
await executeCommand(new MyCommand());

// New
await execute(new MyCommand());
```

## Common Issues

### Issue 1: Import Errors
**Problem**: `Cannot find module '@symphony/features/CommandHistory'`

**Solution**: Run `pnpm install` to ensure features package is installed.

### Issue 2: History Not Persisting
**Problem**: Command history not saved between sessions

**Solution**: Ensure persistence is enabled:
```javascript
const history = useCommandHistory({ enablePersistence: true });
```

### Issue 3: Keyboard Shortcuts Not Working
**Problem**: Undo/redo shortcuts not responding

**Solution**: Use the shortcuts hook:
```javascript
const undoRedo = useUndoRedo();
const { handleKeyDown } = useUndoRedoShortcuts(undoRedo);

useEffect(() => {
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [handleKeyDown]);
```

## Benefits of New Architecture

### 1. **Cleaner API**
- Simplified hooks for common use cases
- Clear separation between core and features
- Better TypeScript support

### 2. **Better Reusability**
- Use history feature in any component
- Share history across different contexts
- Compose with other features

### 3. **Improved Testability**
- Test history logic independently
- Mock history for component tests
- Clear test boundaries

### 4. **Enhanced Flexibility**
- Choose between full or simplified API
- Customize persistence behavior
- Add custom keyboard shortcuts

## Next Steps

1. ✅ Update imports to use CommandHistory feature
2. ✅ Migrate to simplified undo/redo API
3. ✅ Add keyboard shortcuts if needed
4. ⏳ Test history persistence
5. ⏳ Remove old command hooks

---

**Last Updated**: October 13, 2025
