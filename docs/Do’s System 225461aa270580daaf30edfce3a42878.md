# Do’s System

# Symphony Global Undo/Redo System

## Overview

Symphony implements a comprehensive undo/redo system that works across the entire application, not just within the code editor. This system treats every user action as a reversible operation that can be undone or redone using standard keyboard shortcuts (Ctrl+Z/Ctrl+Y) or through the UI.

## Core Concepts

### 1. Command Pattern

The undo/redo system is built on the Command pattern, which encapsulates each user action as a discrete command object:

```tsx
// Command interface
interface Command {
  id: string;
  execute(): Promise<void>;
  undo(): Promise<void>;
  redo(): Promise<void>;

  // Metadata
  timestamp: number;
  description: string;
  component: string;

  mergeableWith?(command: Command): boolean;
}

```

### 2. Command Stack

The Command Stack maintains two stacks: an undo stack and a redo stack:

```tsx
// Command Stack implementation
class CommandStack {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];

  // Push a new command onto the undo stack and clear the redo stack
  async execute(command: Command): Promise<void> {
    // Execute the command
    await command.execute();

    // Push onto undo stack
    this.undoStack.push(command);

    // Clear redo stack when a new command is executed
    this.redoStack = [];

    // Notify listeners
    this.notifyStackChanged();
  }

  // Pop a command from the undo stack, undo it, and push it onto the redo stack
  async undo(): Promise<void> {
    if (this.undoStack.length === 0) return;

    const command = this.undoStack.pop()!;
    await command.undo();
    this.redoStack.push(command);

    this.notifyStackChanged();
  }

  // Pop a command from the redo stack, redo it, and push it onto the undo stack
  async redo(): Promise<void> {
    if (this.redoStack.length === 0) return;

    const command = this.redoStack.pop()!;
    await command.redo();
    this.undoStack.push(command);

    this.notifyStackChanged();
  }

  // Check if undo/redo operations are available
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  // Get stack information for UI display
  getUndoDescription(): string | null {
    return this.undoStack.length > 0
      ? this.undoStack[this.undoStack.length - 1].description
      : null;
  }

  getRedoDescription(): string | null {
    return this.redoStack.length > 0
      ? this.redoStack[this.redoStack.length - 1].description
      : null;
  }

  // Event listeners
  private listeners: Array<() => void> = [];

  addListener(listener: () => void): void {
    this.listeners.push(listener);
  }

  removeListener(listener: () => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notifyStackChanged(): void {
    this.listeners.forEach(listener => listener());
  }
}

```

### 3. Command Manager

The Command Manager coordinates the command system across the application:

```tsx
// Command Manager implementation
class CommandManager {
  private stack: CommandStack;
  private history: CommandHistory;
  private processor: CommandProcessor;

  constructor() {
    this.stack = new CommandStack();
    this.history = new CommandHistory();
    this.processor = new CommandProcessor();

    // Set up keyboard shortcuts
    this.setupKeyboardShortcuts();

    // Restore persisted stack if available
    this.restoreStack();
  }

  // Execute a command
  async executeCommand(command: Command): Promise<void> {
    // Pre-process command (e.g., merge with previous commands if appropriate)
    const processedCommand = this.processor.processCommand(command);

    // Execute the command and add to stack
    await this.stack.execute(processedCommand);

    // Add to history
    this.history.addCommand(processedCommand);

    // Persist stack
    this.persistStack();
  }

  // Undo the most recent command
  async undo(): Promise<void> {
    await this.stack.undo();
    this.persistStack();
  }

  // Redo the most recently undone command
  async redo(): Promise<void> {
    await this.stack.redo();
    this.persistStack();
  }

  // Set up keyboard shortcuts
  private setupKeyboardShortcuts(): void {
    // Register global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Undo: Ctrl+Z (or Cmd+Z on Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        this.undo();
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z (or Cmd+Y or Cmd+Shift+Z on Mac)
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'y' || (e.key === 'z' && e.shiftKey))
      ) {
        e.preventDefault();
        this.redo();
      }
    });
  }

  // Persist stack to storage
  private persistStack(): void {
    // Implement persistence logic
  }

  // Restore stack from storage
  private restoreStack(): void {
    // Implement restoration logic
  }
}

```

## Component Integration

### 1. Editor Commands

```tsx
// Editor-specific commands

class TextInsertCommand implements Command {
  id = 'editor.insert';
  timestamp = Date.now();
  description = 'Insert Text';
  component = 'editor';

  constructor(
    private editor: Editor,
    private position: Position,
    private text: string,
    private oldText: string = ''
  ) {}

  async execute(): Promise<void> {
    this.editor.insertText(this.position, this.text);
  }

  async undo(): Promise<void> {
    this.editor.deleteText(
      this.position,
      this.position.translate(0, this.text.length)
    );
  }

  async redo(): Promise<void> {
    return this.execute();
  }

  // Merge consecutive text inserts for better undo experience
  mergeableWith(command: Command): boolean {
    if (command.id !== 'editor.insert') return false;
    const other = command as TextInsertCommand;

    // Check if this is a continuation of typing
    return (
      this.editor === other.editor &&
      this.position.line === other.position.line &&
      this.position.column + this.text.length === other.position.column &&
      Date.now() - other.timestamp < 1000 // Within 1 second
    );
  }
}

// Delete text command
class TextDeleteCommand implements Command {
  id = 'editor.delete';
  timestamp = Date.now();
  description = 'Delete Text';
  component = 'editor';

  constructor(
    private editor: Editor,
    private position: Position,
    private endPosition: Position,
    private deletedText: string
  ) {}

  async execute(): Promise<void> {
    this.editor.deleteText(this.position, this.endPosition);
  }

  async undo(): Promise<void> {
    this.editor.insertText(this.position, this.deletedText);
  }

  async redo(): Promise<void> {
    return this.execute();
  }
}

```

### 2. Git Commands

```tsx
// Git commit commandclass GitCommitCommand implements Command {
  id = 'git.commit';  timestamp = Date.now();  description = 'Git Commit';  component = 'git';  constructor(
    private gitService: GitService,    private message: string,    private stagedFiles: string[],    private commitHash: string = ''  ) {}
  async execute(): Promise<void> {
    this.commitHash = await this.gitService.commit(this.message);  }
  async undo(): Promise<void> {
    await this.gitService.revert(this.commitHash);  }
  async redo(): Promise<void> {
    // Re-apply the commit with the same message and files    this.commitHash = await this.gitService.commit(this.message, this.stagedFiles);  }
}
```

### 3. UI Commands

```tsx
// Panel layout change commandclass LayoutChangeCommand implements Command {
  id = 'ui.layoutChange';  timestamp = Date.now();  description = 'Change Layout';  component = 'ui';  constructor(
    private layoutManager: LayoutManager,    private newLayout: Layout,    private previousLayout: Layout
  ) {}
  async execute(): Promise<void> {
    this.layoutManager.applyLayout(this.newLayout);  }
  async undo(): Promise<void> {
    this.layoutManager.applyLayout(this.previousLayout);  }
  async redo(): Promise<void> {
    return this.execute();  }
}
```

## AI Integration

### 1. Intelligent Command Grouping

The AI system can analyze user actions and automatically group related commands:

```tsx
// AI-powered command processor
class AICommandProcessor implements CommandProcessor {
  constructor(private aiService: AIService) {}

  async processCommand(command: Command): Promise<Command> {
    // For simple commands, return as is
    if (!this.shouldAnalyze(command)) {
      return command;
    }

    // For complex operations, check if this should be part of a compound command
    const analysis = await this.aiService.analyzeUserIntent(command);

    if (analysis.isPartOfLargerOperation && analysis.operationId) {
      // Either create a new compound command or add to existing one
      return this.createOrUpdateCompoundCommand(command, analysis);
    }

    return command;
  }

  private shouldAnalyze(command: Command): boolean {
    // Determine if this command needs AI analysis
    // Skip analysis for simple, frequent commands like text edits
    return !['editor.insert', 'editor.delete'].includes(command.id);
  }

  private createOrUpdateCompoundCommand(
    command: Command,
    analysis: CommandAnalysis
  ): Command {
    // Logic to create or update compound commands
    // ...
    return command; // Placeholder
  }
}

```

### 2. Semantic Undo/Redo

The AI system can provide semantic understanding of undo/redo operations:

```tsx
// AI-enhanced undo/redo UI
class SemanticUndoUI {
  constructor(
    private commandManager: CommandManager,
    private aiService: AIService
  ) {}

  async getUndoDescription(): Promise<string> {
    const basicDescription = this.commandManager.getUndoDescription();
    if (!basicDescription) return 'Nothing to undo';

    // Enhance description with AI
    const enhancedDescription = await this.aiService.enhanceCommandDescription(basicDescription);
    return enhancedDescription || basicDescription;
  }

  async suggestRelatedActions(): Promise<string[]> {
    const recentCommands = this.commandManager.getRecentCommands(5);
    return this.aiService.suggestRelatedActions(recentCommands);
  }
}

```

## Persistence Layer

### 1. Stack Persistence

```tsx
// Persist undo/redo stacks
class StackPersistence {
  private readonly STORAGE_KEY = 'symphony-command-stack';

  constructor(private storage: StorageService) {}

  async saveStack(undoStack: Command[], redoStack: Command[]): Promise<void> {
    // Serialize commands
    const serializedUndo = this.serializeCommands(undoStack);
    const serializedRedo = this.serializeCommands(redoStack);

    // Save to storage
    await this.storage.set(this.STORAGE_KEY, {
      undo: serializedUndo,
      redo: serializedRedo,
      timestamp: Date.now(),
    });
  }

  async loadStack(): Promise<{ undoStack: Command[]; redoStack: Command[] } | null> {
    const data = await this.storage.get(this.STORAGE_KEY);
    if (!data) return null;

    // Deserialize commands
    const undoStack = this.deserializeCommands(data.undo);
    const redoStack = this.deserializeCommands(data.redo);

    return { undoStack, redoStack };
  }

  private serializeCommands(commands: Command[]): any[] {
    // Convert commands to serializable format
    return commands.map(cmd => ({
      id: cmd.id,
      component: cmd.component,
      description: cmd.description,
      timestamp: cmd.timestamp,
      data: this.extractCommandData(cmd),
    }));
  }

  private deserializeCommands(serialized: any[]): Command[] {
    // Recreate command objects from serialized data
    return serialized.map(data => this.createCommandFromData(data));
  }

  private extractCommandData(command: Command): any {
    // Extract serializable data from command
    // Implementation depends on command types
  }

  private createCommandFromData(data: any): Command {
    // Create appropriate command instance based on data
    // Implementation depends on command types
  }
}

```

### 2. Session History

```tsx
// Track command history across sessions
class CommandHistory {
  private readonly MAX_HISTORY_LENGTH = 1000;
  private history: CommandHistoryEntry[] = [];

  constructor(private storage: StorageService) {
    this.loadHistory();
  }

  addCommand(command: Command): void {
    this.history.push({
      id: command.id,
      description: command.description,
      component: command.component,
      timestamp: command.timestamp,
    });

    // Trim history if it gets too long
    if (this.history.length > this.MAX_HISTORY_LENGTH) {
      this.history = this.history.slice(-this.MAX_HISTORY_LENGTH);
    }

    this.saveHistory();
  }

  getHistory(): CommandHistoryEntry[] {
    return [...this.history];
  }

  private loadHistory(): void {
    const saved = this.storage.get('command-history');
    if (saved) {
      this.history = saved;
    }
  }

  private saveHistory(): void {
    this.storage.set('command-history', this.history);
  }
}

interface CommandHistoryEntry {
  id: string;
  description: string;
  component: string;
  timestamp: number;
}

```

## React Integration

### 1. Command Context Provider

```tsx
// CommandContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface CommandContextType {
  executeCommand: (command: Command) => Promise<void>;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  canUndo: boolean;
  canRedo: boolean;
  undoDescription: string | null;
  redoDescription: string | null;
}

const CommandContext = createContext<CommandContextType | null>(null);

export const CommandProvider: React.FC = ({ children }) => {
  const commandManager = useCommandManager();
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [undoDescription, setUndoDescription] = useState<string | null>(null);
  const [redoDescription, setRedoDescription] = useState<string | null>(null);

  useEffect(() => {
    const updateState = () => {
      setCanUndo(commandManager.canUndo());
      setCanRedo(commandManager.canRedo());
      setUndoDescription(commandManager.getUndoDescription());
      setRedoDescription(commandManager.getRedoDescription());
    };

    commandManager.addListener(updateState);
    updateState(); // Initial state

    return () => commandManager.removeListener(updateState);
  }, [commandManager]);

  return (
    <CommandContext.Provider
      value={{
        executeCommand: (command) => commandManager.executeCommand(command),
        undo: () => commandManager.undo(),
        redo: () => commandManager.redo(),
        canUndo,
        canRedo,
        undoDescription,
        redoDescription
      }}
    >
      {children}
    </CommandContext.Provider>
  );
};

export const useCommand = () => {
  const context = useContext(CommandContext);
  if (!context) {
    throw new Error('useCommand must be used within a CommandProvider');
  }
  return context;
};
```

### 2. Command Hook Usage

```tsx
// Using the command system in a component
import React, { useState } from 'react';
import { useCommand } from './CommandContext';
import { TextInsertCommand } from './commands/EditorCommands';

const EditorComponent: React.FC = () => {
  const [editor] = useState(new Editor());
  const { executeCommand } = useCommand();

  const handleTextInput = (text: string, position: Position) => {
    const command = new TextInsertCommand(editor, position, text);
    executeCommand(command);
  };

  return (
    <div className="editor">
      {/* Editor implementation */}
    </div>
  );
};
```

### 3. Undo/Redo UI Component

```tsx
// UndoRedoToolbar.tsx
import React from 'react';
import { useCommand } from './CommandContext';

export const UndoRedoToolbar: React.FC = () => {
  const { undo, redo, canUndo, canRedo, undoDescription, redoDescription } = useCommand();

  return (
    <div className="undo-redo-toolbar">
      <button
        onClick={() => undo()}
        disabled={!canUndo}
        title={undoDescription ? `Undo ${undoDescription}` : 'Undo'}
      >
        <UndoIcon />
      </button>

      <button
        onClick={() => redo()}
        disabled={!canRedo}
        title={redoDescription ? `Redo ${redoDescription}` : 'Redo'}
      >
        <RedoIcon />
      </button>
    </div>
  );
};
```

## Integration with AI Conductor

The undo/redo system integrates with Symphony’s AI Conductor to provide intelligent command management:

```tsx
// AI Conductor integration
class AIConductorCommandIntegration {
  constructor(
    private commandManager: CommandManager,
    private conductorClient: ConductorClient
  ) {
    this.setupIntegration();
  }

  private setupIntegration(): void {
    // Listen for command execution
    this.commandManager.addCommandListener(async (command) => {
      // Inform AI Conductor about user actions
      await this.conductorClient.trackUserAction({
        type: command.id,
        component: command.component,
        description: command.description,
        timestamp: command.timestamp,
        context: this.getCommandContext(command),
      });
    });

    // Get intelligent grouping suggestions
    this.commandManager.setCommandProcessor(async (command) => {
      const analysis = await this.conductorClient.analyzeCommand(command);
      if (analysis.shouldGroup && analysis.groupId) {
        // Group related commands
        return this.createOrUpdateCompoundCommand(command, analysis);
      }
      return command;
    });
  }

  private getCommandContext(command: Command): any {
    // Extract relevant context based on command type
    // ...
  }

  private createOrUpdateCompoundCommand(command: Command, analysis: any): Command {
    // Create compound command based on AI analysis
    // ...
    return command; // Placeholder
  }
}

```

## Cross-Component Undo/Redo

### 1. Compound Commands

For operations that span multiple components:

```tsx
// Compound command that affects multiple components
class CompoundCommand implements Command {
  id = 'compound';
  timestamp = Date.now();
  description: string;
  component = 'multiple';

  constructor(
    private commands: Command[],
    description?: string
  ) {
    this.description = description || `${commands.length} actions`;
    this.timestamp = Math.max(...commands.map(cmd => cmd.timestamp));
  }

  async execute(): Promise<void> {
    for (const command of this.commands) {
      await command.execute();
    }
  }

  async undo(): Promise<void> {
    // Undo in reverse order
    for (let i = this.commands.length - 1; i >= 0; i--) {
      await this.commands[i].undo();
    }
  }

  async redo(): Promise<void> {
    for (const command of this.commands) {
      await command.redo();
    }
  }
}

```

### 2. Transaction Commands

For ensuring atomic operations:

```tsx
// Transaction command ensures all-or-nothing execution
class TransactionCommand implements Command {
  id = 'transaction';
  timestamp = Date.now();
  description: string;
  component = 'multiple';

  constructor(
    private commands: Command[],
    description?: string
  ) {
    this.description = description || 'Transaction';
    this.timestamp = Math.max(...commands.map(cmd => cmd.timestamp));
  }

  async execute(): Promise<void> {
    try {
      for (const command of this.commands) {
        await command.execute();
      }
    } catch (error) {
      // If any command fails, undo all previously executed commands
      for (let i = this.commands.length - 1; i >= 0; i--) {
        try {
          await this.commands[i].undo();
        } catch (undoError) {
          console.error(
            'Failed to undo command during transaction rollback',
            undoError
          );
        }
      }
      throw error;
    }
  }

  async undo(): Promise<void> {
    // Undo in reverse order
    for (let i = this.commands.length - 1; i >= 0; i--) {
      await this.commands[i].undo();
    }
  }

  async redo(): Promise<void> {
    return this.execute();
  }
}

```

## Best Practices

### 1. Command Design Guidelines

1. **Atomicity**: Each command should represent a single logical action
2. **Idempotency**: Executing a command multiple times should have the same effect as executing it once
3. **Reversibility**: Every command must be fully reversible
4. **Serializability**: Commands should be serializable for persistence
5. **Performance**: Commands should be lightweight and fast to execute
6. **Descriptive**: Commands should have clear, user-friendly descriptions

### 2. Component Integration Guidelines

1. **Register Commands**: All user actions should create and register commands
2. **Preserve State**: Store necessary state for undo/redo operations
3. **Avoid Side Effects**: Commands should not have side effects outside their scope
4. **Handle Dependencies**: Consider dependencies between components
5. **Use Compound Commands**: Group related actions into compound commands
6. **Provide Context**: Include sufficient context for AI analysis

### 3. Performance Considerations

1. **Lazy Execution**: Defer expensive operations until necessary
2. **Command Merging**: Merge rapid, similar commands (e.g., consecutive typing)
3. **Memory Management**: Limit undo/redo stack size
4. **Async Operations**: Use async/await for potentially slow operations
5. **Selective Persistence**: Only persist essential commands
6. **Optimized Serialization**: Minimize serialized command size

## Implementation Roadmap

1. **Core System**: Implement CommandStack and CommandManager
2. **Component Integration**: Add command support to each component
3. **UI Integration**: Add undo/redo buttons and keyboard shortcuts
4. **Persistence**: Implement stack persistence
5. **AI Integration**: Add intelligent command grouping
6. **Cross-Component Commands**: Implement compound and transaction commands
7. **Performance Optimization**: Optimize for large projects and complex operations

## Conclusion

Symphony’s global undo/redo system provides a consistent, reliable way for users to reverse and replay actions across the entire application. By treating every user action as a command and leveraging Symphony’s AI capabilities, the system offers an intuitive and powerful experience that goes beyond traditional text-based undo/redo systems.