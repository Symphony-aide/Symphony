/**
 * @fileoverview Command interface definitions and types for Symphony's global undo/redo system
 */

/**
 * Core Command interface - represents a reversible user action
 * @typedef {Object} Command
 * @property {string} id - Unique command identifier (e.g., 'editor.insert', 'file.create')
 * @property {number} timestamp - Command execution timestamp
 * @property {string} description - Human-readable description for UI display
 * @property {string} component - Component that created the command (e.g., 'editor', 'git', 'ui')
 * @property {function(): Promise<void>} execute - Execute the command
 * @property {function(): Promise<void>} undo - Undo the command
 * @property {function(): Promise<void>} redo - Redo the command (default: calls execute)
 * @property {function(Command): boolean} [mergeableWith] - Optional: Check if this command can be merged with another
 */

/**
 * Command execution result
 * @typedef {Object} CommandResult
 * @property {boolean} success - Whether the command executed successfully
 * @property {string} [error] - Error message if execution failed
 * @property {*} [data] - Optional result data
 */

/**
 * Command stack state for UI components
 * @typedef {Object} CommandStackState
 * @property {boolean} canUndo - Whether undo operation is available
 * @property {boolean} canRedo - Whether redo operation is available
 * @property {string|null} undoDescription - Description of the command that would be undone
 * @property {string|null} redoDescription - Description of the command that would be redone
 * @property {number} undoStackSize - Number of commands in undo stack
 * @property {number} redoStackSize - Number of commands in redo stack
 */

/**
 * Command history entry for persistence and analytics
 * @typedef {Object} CommandHistoryEntry
 * @property {string} id - Command identifier
 * @property {string} description - Command description
 * @property {string} component - Source component
 * @property {number} timestamp - Execution timestamp
 * @property {boolean} wasUndone - Whether this command was undone
 * @property {*} [metadata] - Optional metadata for analytics
 */

/**
 * Serialized command data for persistence
 * @typedef {Object} SerializedCommand
 * @property {string} id - Command identifier
 * @property {string} description - Command description
 * @property {string} component - Source component
 * @property {number} timestamp - Execution timestamp
 * @property {*} data - Serialized command-specific data
 */

export {
  // Export types for JSDoc (no runtime exports needed for type definitions)
};
