# Commands Package Refactoring Documentation

## Overview
This document outlines the refactoring of the `@symphony/commands` package from a mixed architecture to a clean **[Page, Feature, Component]** pattern.

## Refactoring Date
October 13, 2025

## Motivation
The original commands package had:
- Command execution and history management tightly coupled
- UI components mixed with core logic
- Command palette functionality embedded in examples
- Difficult to use command features independently
- Hard to extend with new command types

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

### Existing Structure
```
commands/
├── src/
│   ├── core/
│   │   ├── CommandManager.js          # Command execution & coordination
│   │   ├── CommandStack.js            # Undo/redo stack management
│   │   └── CommandProcessor.js        # Command processing logic
│   ├── base/
│   │   ├── BaseCommand.js             # Base command class
│   │   ├── CompoundCommand.js         # Compound command pattern
│   │   └── TransactionCommand.js      # Transaction command pattern
│   ├── commands/
│   │   ├── TextInsertCommand.js       # Built-in text commands
│   │   └── TextDeleteCommand.js
│   ├── hooks/
│   │   ├── useCommandManager.js       # Command manager hook
│   │   └── useCommandHistory.js       # History management hook
│   ├── components/
│   │   └── UndoRedoToolbar.jsx        # Undo/redo UI
│   ├── persistence/
│   │   ├── CommandSerializer.js       # Command serialization
│   │   └── StackPersistence.js        # Stack persistence
│   ├── utils/
│   │   └── commandFactory.js          # Command creation utilities
│   ├── CommandContext.jsx             # React context provider
│   └── examples/
│       └── EditorIntegration.jsx      # Example usage
```

### Identified Features

#### 1. **CommandExecution Feature**
- Command execution
- Command validation
- Command merging
- Error handling

#### 2. **CommandHistory Feature**
- Undo/redo stack management
- History navigation
- Stack state tracking
- History persistence

#### 3. **CommandPalette Feature**
- Command search and discovery
- Command execution from palette
- Keyboard shortcuts
- Command categories

## New Structure

```
commands/
├── src/
│   ├── pages/
│   │   └── CommandPalettePage/
│   │       ├── CommandPalettePage.jsx     # Command palette page
│   │       └── index.js
│   ├── components/
│   │   ├── UndoRedoToolbar/
│   │   │   ├── UndoRedoToolbar.jsx        # Pure undo/redo UI
│   │   │   └── index.js
│   │   ├── CommandInput/
│   │   │   ├── CommandInput.jsx           # Pure command input
│   │   │   └── index.js
│   │   └── CommandList/
│   │       ├── CommandList.jsx            # Pure command list
│   │       └── index.js
│   ├── core/
│   │   ├── CommandManager.js              # Core manager (kept)
│   │   ├── CommandStack.js                # Core stack (kept)
│   │   └── CommandProcessor.js            # Core processor (kept)
│   ├── base/
│   │   └── [Base command classes]         # Kept as-is
│   └── index.js
```

## Features to Extract (to @symphony/features)

```
packages/features/src/
├── CommandExecution/
│   ├── CommandExecutionFeature.jsx
│   ├── hooks/
│   │   ├── useCommandExecution.js
│   │   └── useCommandValidation.js
│   ├── services/
│   │   └── CommandService.js
│   └── index.js
├── CommandHistory/
│   ├── CommandHistoryFeature.jsx
│   ├── hooks/
│   │   ├── useCommandHistory.js
│   │   ├── useUndoRedo.js
│   │   └── useHistoryNavigation.js
│   ├── services/
│   │   ├── HistoryService.js
│   │   └── PersistenceService.js
│   └── index.js
└── CommandPalette/
    ├── CommandPaletteFeature.jsx
    ├── hooks/
    │   ├── useCommandSearch.js
    │   ├── useCommandRegistry.js
    │   └── useKeyboardShortcuts.js
    ├── services/
    │   └── CommandRegistryService.js
    └── index.js
```

## Migration Map

### Old → New Structure

#### Core Classes (Kept)
| Component | Status | Notes |
|-----------|--------|-------|
| `CommandManager.js` | ✅ Kept | Core functionality preserved |
| `CommandStack.js` | ✅ Kept | Core functionality preserved |
| `CommandProcessor.js` | ✅ Kept | Core functionality preserved |
| `BaseCommand.js` | ✅ Kept | Base class preserved |
| `CompoundCommand.js` | ✅ Kept | Pattern preserved |
| `TransactionCommand.js` | ✅ Kept | Pattern preserved |

#### Hooks → Features
| Old Hook | New Feature | Location |
|----------|-------------|----------|
| `useCommandManager.js` | CommandExecution | `@symphony/features/CommandExecution` |
| `useCommandHistory.js` | CommandHistory | `@symphony/features/CommandHistory` |
| N/A (new) | CommandPalette | `@symphony/features/CommandPalette` |

#### Components
| Old Location | New Location | Type |
|-------------|--------------|------|
| `components/UndoRedoToolbar.jsx` | `components/UndoRedoToolbar/UndoRedoToolbar.jsx` | Component |
| N/A | `components/CommandInput/CommandInput.jsx` | Component |
| N/A | `components/CommandList/CommandList.jsx` | Component |

## Feature Boundaries

### CommandExecution Feature
**Responsibilities**:
- Execute commands with validation
- Handle command errors
- Merge similar commands
- Provide execution state

**API**:
```javascript
const commandExecution = useCommandExecution();
// commandExecution.execute(command)
// commandExecution.isExecuting
// commandExecution.lastError
// commandExecution.canExecute(command)
```

### CommandHistory Feature
**Responsibilities**:
- Manage undo/redo stacks
- Track history state
- Persist history
- Navigate history

**API**:
```javascript
const history = useCommandHistory();
// history.undo()
// history.redo()
// history.canUndo
// history.canRedo
// history.undoStack
// history.redoStack
// history.clear()
```

### CommandPalette Feature
**Responsibilities**:
- Register available commands
- Search commands
- Execute from palette
- Manage keyboard shortcuts

**API**:
```javascript
const palette = useCommandPalette();
// palette.search(term)
// palette.results
// palette.execute(commandId)
// palette.registerCommand(command)
// palette.shortcuts
```

## Benefits of New Architecture

### 1. **Clear Separation of Concerns**
- UI components focus only on presentation
- Features encapsulate business logic
- Core classes remain pure and reusable

### 2. **Improved Testability**
- Components can be tested in isolation
- Features can be tested without UI
- Core logic can be tested independently

### 3. **Better Reusability**
- Components are pure and reusable
- Features can be used in different contexts
- Core classes work anywhere

### 4. **Easier Maintenance**
- Changes are localized to specific layers
- Dependencies are explicit
- Code is easier to understand

### 5. **Scalability**
- New features can be added independently
- Components can be shared across features
- Core system remains stable

## Migration Strategy

### Phase 1: Extract Features
1. Extract CommandExecution feature
2. Extract CommandHistory feature
3. Extract CommandPalette feature

### Phase 2: Refactor Components
1. Extract pure UI components
2. Remove business logic
3. Create component APIs

### Phase 3: Update Core
1. Ensure core classes are feature-agnostic
2. Update exports
3. Maintain backward compatibility

### Phase 4: Update Dependencies
1. Update imports across codebase
2. Update documentation
3. Create migration examples

## Breaking Changes

### Import Paths
```javascript
// Old
import { useCommandManager } from '@symphony/commands';

// New
import { useCommandExecution } from '@symphony/features/CommandExecution';
import { useCommandHistory } from '@symphony/features/CommandHistory';

// Core classes still available
import { CommandManager, BaseCommand } from '@symphony/commands';
```

## Backward Compatibility

Core classes and context remain in `@symphony/commands`:

```javascript
// Still works
import { CommandManager, CommandStack, BaseCommand } from '@symphony/commands';
import { CommandProvider, useCommand } from '@symphony/commands';
```

Features are new additions in `@symphony/features`.

## Testing Strategy

### Component Tests
- Unit tests for each component
- Storybook stories for visual testing
- Accessibility tests

### Feature Tests
- Integration tests for feature logic
- Mock external dependencies
- Test feature APIs

### Core Tests
- Unit tests for core classes
- Integration tests for command system
- Performance tests

## Performance Considerations

### Code Splitting
- Features can be lazy-loaded
- Components are tree-shakeable
- Core classes are always available

### Memoization
- Components use React.memo where appropriate
- Feature hooks use useMemo/useCallback
- Prevent unnecessary re-renders

## Next Steps

1. ✅ Create documentation
2. ⏳ Extract CommandExecution feature
3. ⏳ Extract CommandHistory feature
4. ⏳ Extract CommandPalette feature
5. ⏳ Refactor components layer
6. ⏳ Update workspace configuration
7. ⏳ Test and verify refactoring

---

**Last Updated**: October 13, 2025
**Author**: Symphony Development Team
