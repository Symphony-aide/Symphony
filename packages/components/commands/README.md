# Symphony Commands System

A comprehensive global undo/redo command system for Symphony IDE that provides reversible operations across all components.

## Features

- **Global Undo/Redo**: Works across all Symphony components, not just the editor
- **Command Pattern**: Clean, extensible architecture using the Command pattern
- **Smart Merging**: Automatically merges related commands (e.g., continuous typing)
- **React Integration**: Seamless integration with React components via context and hooks
- **Persistence Ready**: Built for command stack persistence across sessions
- **Cross-Component**: Support for operations spanning multiple components
- **Keyboard Shortcuts**: Global Ctrl+Z/Ctrl+Y keyboard shortcuts

## Quick Start

### 1. Wrap your app with CommandProvider

```jsx
import { CommandProvider } from '@symphony/commands';

function App() {
  return (
    <CommandProvider>
      <YourAppComponents />
    </CommandProvider>
  );
}
```

### 2. Use commands in components

```jsx
import { useCommand } from '@symphony/commands';
import { TextInsertCommand } from '@symphony/commands';

function EditorComponent() {
  const { executeCommand } = useCommand();
  
  const handleTextInput = async (text, position) => {
    const command = new TextInsertCommand(editor, position, text);
    await executeCommand(command);
  };
  
  return <div>Your editor UI</div>;
}
```

### 3. Add undo/redo UI

```jsx
import { UndoRedoToolbar } from '@symphony/commands';

function Toolbar() {
  return (
    <div className="toolbar">
      <UndoRedoToolbar />
    </div>
  );
}
```

## Architecture

### Core Components

- **CommandStack**: Manages undo/redo stacks with size limits and listeners
- **CommandManager**: Global coordinator with keyboard shortcuts and persistence
- **CommandProcessor**: Pre-processes commands (validation, merging, etc.)
- **BaseCommand**: Abstract base class for all commands
- **CompoundCommand**: Groups multiple commands into atomic operations
- **TransactionCommand**: Ensures all-or-nothing execution with rollback

### React Integration

- **CommandProvider**: React context provider for global command access
- **useCommand()**: Hook for executing commands
- **useCommandState()**: Hook for accessing stack state (canUndo, canRedo, etc.)
- **UndoRedoToolbar**: Ready-to-use undo/redo UI component

## Creating Custom Commands

### Basic Command

```jsx
import { BaseCommand } from '@symphony/commands';

class MyCustomCommand extends BaseCommand {
  constructor(data) {
    super('my.command', 'My Custom Operation', 'my-component');
    this.data = data;
  }

  async execute() {
    // Perform the operation
    await this.performOperation();
  }

  async undo() {
    // Reverse the operation
    await this.reverseOperation();
  }

  // Optional: Enable command merging
  mergeableWith(command) {
    return command.id === 'my.command' && /* your merge logic */;
  }

  mergeWith(command) {
    return new MyCustomCommand(/* merged data */);
  }
}
```

### Using Your Command

```jsx
function MyComponent() {
  const { executeCommand } = useCommand();
  
  const handleAction = async () => {
    const command = new MyCustomCommand(data);
    await executeCommand(command);
  };
  
  return <button onClick={handleAction}>Do Something</button>;
}
```

## Built-in Commands

### Text Commands

- **TextInsertCommand**: Insert text with smart merging for continuous typing
- **TextDeleteCommand**: Delete text with backspace/delete key merging

### Usage Example

```jsx
import { TextInsertCommand, TextDeleteCommand } from '@symphony/commands';

// Insert text
const insertCommand = new TextInsertCommand(
  editor,           // Editor instance
  { line: 1, column: 5 },  // Position
  'Hello World',    // Text to insert
  ''               // Previous text (for undo)
);

// Delete text
const deleteCommand = new TextDeleteCommand(
  editor,           // Editor instance
  { line: 1, column: 5 },  // Start position
  { line: 1, column: 16 }, // End position
  'Hello World'     // Text being deleted
);
```

## Advanced Features

### Compound Commands

Group multiple operations into a single undoable action:

```jsx
import { CompoundCommand } from '@symphony/commands';

const commands = [
  new TextInsertCommand(/* ... */),
  new FileCreateCommand(/* ... */),
  new LayoutChangeCommand(/* ... */)
];

const compoundCommand = new CompoundCommand(
  commands,
  'Multi-step Operation'
);

await executeCommand(compoundCommand);
```

### Transaction Commands

Ensure atomic operations with automatic rollback on failure:

```jsx
import { TransactionCommand } from '@symphony/commands';

const transaction = new TransactionCommand([
  new DatabaseUpdateCommand(/* ... */),
  new FileWriteCommand(/* ... */),
  new UIUpdateCommand(/* ... */)
], 'Save Project');

await executeCommand(transaction);
// If any command fails, all previous commands are automatically undone
```

## Configuration

### CommandProvider Options

```jsx
<CommandProvider 
  options={{
    maxStackSize: 1000,        // Maximum commands in stack
    enablePersistence: true,   // Enable stack persistence
    processorOptions: {
      enableMerging: true,     // Enable command merging
      mergeTimeWindow: 1000    // Merge window in milliseconds
    }
  }}
>
  <App />
</CommandProvider>
```

### Custom Processors

Register custom command processors:

```jsx
const { commandManager } = useCommand();

commandManager.registerProcessor('myProcessor', async (command, recentCommands) => {
  // Your custom processing logic
  return processedCommand;
});
```

## Keyboard Shortcuts

The system automatically registers global keyboard shortcuts:

- **Ctrl+Z** (Cmd+Z on Mac): Undo
- **Ctrl+Y** or **Ctrl+Shift+Z** (Cmd+Y or Cmd+Shift+Z on Mac): Redo

## API Reference

### Hooks

#### useCommand()

```jsx
const {
  executeCommand,  // (command: Command) => Promise<void>
  undo,           // () => Promise<boolean>
  redo,           // () => Promise<boolean>
  commandManager  // CommandManager instance
} = useCommand();
```

#### useCommandState()

```jsx
const {
  canUndo,          // boolean
  canRedo,          // boolean
  undoDescription,  // string | null
  redoDescription,  // string | null
  undoStackSize,    // number
  redoStackSize     // number
} = useCommandState();
```

### Components

#### UndoRedoToolbar

```jsx
<UndoRedoToolbar 
  className="my-toolbar"
  showDescriptions={true}
  iconSize={16}
  variant="default"
/>
```

## Best Practices

1. **Keep Commands Small**: Each command should represent a single logical operation
2. **Implement Proper Validation**: Use `isValid()` to ensure command integrity
3. **Handle Errors Gracefully**: Commands should fail safely and provide clear error messages
4. **Use Merging Wisely**: Only merge commands that represent continuous user actions
5. **Provide Clear Descriptions**: Use descriptive names for better user experience
6. **Test Undo/Redo**: Always test both execution and reversal of your commands

## Integration with Existing Code

The command system is designed to work alongside existing undo/redo implementations:

1. **Gradual Migration**: Start by wrapping existing operations in commands
2. **Adapter Pattern**: Create adapters for existing undo/redo systems
3. **Component-Specific**: Begin with one component and expand gradually

## Performance Considerations

- Commands are lightweight and fast to execute
- Stack size is configurable to manage memory usage
- Command merging reduces stack size for rapid operations
- Lazy serialization for persistence minimizes overhead

## Future Enhancements

- **AI Integration**: Intelligent command grouping and semantic descriptions
- **Persistence Layer**: Automatic stack persistence across browser sessions
- **Command History**: Long-term command analytics and history tracking
- **Selective Undo**: Advanced undo operations for specific command types
