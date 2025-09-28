//index.js

// Core command system
export { CommandManager } from "./core/CommandManager.js";
export { CommandStack } from "./core/CommandStack.js";
export { CommandProcessor } from "./core/CommandProcessor.js";

// Base command classes
export { BaseCommand } from "./base/BaseCommand.js";
export { CompoundCommand } from "./base/CompoundCommand.js";
export { TransactionCommand } from "./base/TransactionCommand.js";

// React integration
export { CommandProvider, useCommand, useCommandState } from "./CommandContext.jsx";

// UI components
export { default as UndoRedoToolbar } from "./components/UndoRedoToolbar.jsx";

// Built-in commands
export { TextInsertCommand } from "./commands/TextInsertCommand.js";
export { TextDeleteCommand } from "./commands/TextDeleteCommand.js";

// Utilities
export { CommandFactory, CommandUtils } from "./utils/commandFactory.js";

// Hooks
export { useCommandManager } from "./hooks/useCommandManager.js";
export { useCommandHistory } from "./hooks/useCommandHistory.js";

// Persistence
export { CommandSerializer } from "./persistence/CommandSerializer.js";
export { StackPersistence } from "./persistence/StackPersistence.js";

// Examples
export { EditorIntegration, ExampleApp } from "./examples/EditorIntegration.jsx";
