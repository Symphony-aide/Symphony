/**
 * @fileoverview Command serialization for persistence and restoration
 */

import { TextInsertCommand } from '../commands/TextInsertCommand.js';
import { TextDeleteCommand } from '../commands/TextDeleteCommand.js';
import { CompoundCommand } from '../base/CompoundCommand.js';
import { TransactionCommand } from '../base/TransactionCommand.js';

/**
 * CommandSerializer handles serialization and deserialization of commands
 * Enables command stack persistence across browser sessions
 */
export class CommandSerializer {
  constructor() {
    // Registry of command classes for deserialization
    this.commandRegistry = new Map([
      ['editor.insert', TextInsertCommand],
      ['editor.delete', TextDeleteCommand],
      ['compound', CompoundCommand],
      ['transaction', TransactionCommand]
    ]);
  }

  /**
   * Serialize a command to a JSON-compatible object
   * @param {import('../types/Command.js').Command} command - Command to serialize
   * @returns {Object} Serialized command data
   */
  serializeCommand(command) {
    if (!command || typeof command.getSerializableData !== 'function') {
      throw new Error('Command must implement getSerializableData method');
    }

    const baseData = command.getSerializableData();
    
    return {
      ...baseData,
      className: command.constructor.name,
      version: '1.0' // For future compatibility
    };
  }

  /**
   * Serialize an array of commands
   * @param {import('../types/Command.js').Command[]} commands - Commands to serialize
   * @returns {Object[]} Array of serialized command data
   */
  serializeCommands(commands) {
    return commands.map(command => this.serializeCommand(command));
  }

  /**
   * Serialize command stacks for persistence
   * @param {import('../types/Command.js').Command[]} undoStack - Undo stack
   * @param {import('../types/Command.js').Command[]} redoStack - Redo stack
   * @returns {Object} Serialized stack data
   */
  serializeStacks(undoStack, redoStack) {
    return {
      undoStack: this.serializeCommands(undoStack),
      redoStack: this.serializeCommands(redoStack),
      serializedAt: Date.now(),
      version: '1.0'
    };
  }

  /**
   * Deserialize a command from serialized data
   * @param {Object} data - Serialized command data
   * @param {Object} [context] - Context for command restoration (e.g., editor instances)
   * @returns {import('../types/Command.js').Command} Restored command
   */
  deserializeCommand(data, context = {}) {
    if (!data || !data.id) {
      throw new Error('Invalid serialized command data');
    }

    const CommandClass = this.commandRegistry.get(data.id);
    if (!CommandClass) {
      console.warn(`Unknown command type: ${data.id}, skipping`);
      return null;
    }

    try {
      // Handle different command types
      switch (data.id) {
        case 'editor.insert':
        case 'editor.delete':
          if (!context.editor) {
            console.warn('Editor context required for text commands, skipping');
            return null;
          }
          return CommandClass.fromSerializedData(data, context.editor);

        case 'compound':
          return this.deserializeCompoundCommand(data, context);

        case 'transaction':
          return this.deserializeTransactionCommand(data, context);

        default:
          // Try generic deserialization
          if (CommandClass.fromSerializedData) {
            return CommandClass.fromSerializedData(data, context);
          }
          throw new Error(`No deserialization method for command: ${data.id}`);
      }
    } catch (error) {
      console.error(`Failed to deserialize command ${data.id}:`, error);
      return null;
    }
  }

  /**
   * Deserialize compound command with sub-commands
   * @private
   * @param {Object} data - Serialized compound command data
   * @param {Object} context - Restoration context
   * @returns {CompoundCommand} Restored compound command
   */
  deserializeCompoundCommand(data, context) {
    if (!data.commands || !Array.isArray(data.commands)) {
      throw new Error('Compound command must have commands array');
    }

    const commands = data.commands
      .map(cmdData => this.deserializeCommand(cmdData, context))
      .filter(cmd => cmd !== null); // Filter out failed deserializations

    if (commands.length === 0) {
      return null;
    }

    const compound = new CompoundCommand(commands, data.description);
    compound.timestamp = data.timestamp;
    return compound;
  }

  /**
   * Deserialize transaction command with sub-commands
   * @private
   * @param {Object} data - Serialized transaction command data
   * @param {Object} context - Restoration context
   * @returns {TransactionCommand} Restored transaction command
   */
  deserializeTransactionCommand(data, context) {
    if (!data.commands || !Array.isArray(data.commands)) {
      throw new Error('Transaction command must have commands array');
    }

    const commands = data.commands
      .map(cmdData => this.deserializeCommand(cmdData, context))
      .filter(cmd => cmd !== null);

    if (commands.length === 0) {
      return null;
    }

    const transaction = new TransactionCommand(commands, data.description);
    transaction.timestamp = data.timestamp;
    transaction.isCommitted = data.isCommitted || false;
    return transaction;
  }

  /**
   * Deserialize an array of commands
   * @param {Object[]} commandsData - Array of serialized command data
   * @param {Object} [context] - Restoration context
   * @returns {import('../types/Command.js').Command[]} Array of restored commands
   */
  deserializeCommands(commandsData, context = {}) {
    if (!Array.isArray(commandsData)) {
      return [];
    }

    return commandsData
      .map(data => this.deserializeCommand(data, context))
      .filter(command => command !== null);
  }

  /**
   * Deserialize command stacks from persisted data
   * @param {Object} stackData - Serialized stack data
   * @param {Object} [context] - Restoration context
   * @returns {Object} Restored stacks {undoStack, redoStack}
   */
  deserializeStacks(stackData, context = {}) {
    if (!stackData || typeof stackData !== 'object') {
      return { undoStack: [], redoStack: [] };
    }

    const undoStack = this.deserializeCommands(stackData.undoStack || [], context);
    const redoStack = this.deserializeCommands(stackData.redoStack || [], context);

    return { undoStack, redoStack };
  }

  /**
   * Register a custom command class for serialization
   * @param {string} commandId - Command identifier
   * @param {Function} CommandClass - Command class constructor
   */
  registerCommand(commandId, CommandClass) {
    if (typeof CommandClass !== 'function') {
      throw new Error('CommandClass must be a constructor function');
    }

    if (!CommandClass.fromSerializedData) {
      throw new Error('CommandClass must implement static fromSerializedData method');
    }

    this.commandRegistry.set(commandId, CommandClass);
  }

  /**
   * Unregister a command class
   * @param {string} commandId - Command identifier to remove
   */
  unregisterCommand(commandId) {
    this.commandRegistry.delete(commandId);
  }

  /**
   * Get list of registered command types
   * @returns {string[]} Array of registered command IDs
   */
  getRegisteredCommands() {
    return Array.from(this.commandRegistry.keys());
  }

  /**
   * Validate serialized command data
   * @param {Object} data - Data to validate
   * @returns {boolean} True if data appears valid
   */
  validateSerializedData(data) {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Check required fields
    if (!data.id || !data.description || !data.component || !data.timestamp) {
      return false;
    }

    // Check version compatibility
    if (data.version && data.version !== '1.0') {
      console.warn(`Unsupported command version: ${data.version}`);
      return false;
    }

    return true;
  }

  /**
   * Get serialization statistics
   * @param {Object} stackData - Serialized stack data
   * @returns {Object} Statistics about the serialized data
   */
  getSerializationStats(stackData) {
    if (!stackData) {
      return { totalCommands: 0, commandTypes: {}, dataSize: 0 };
    }

    const allCommands = [
      ...(stackData.undoStack || []),
      ...(stackData.redoStack || [])
    ];

    const commandTypes = {};
    allCommands.forEach(cmd => {
      commandTypes[cmd.id] = (commandTypes[cmd.id] || 0) + 1;
    });

    return {
      totalCommands: allCommands.length,
      undoStackSize: (stackData.undoStack || []).length,
      redoStackSize: (stackData.redoStack || []).length,
      commandTypes,
      dataSize: JSON.stringify(stackData).length,
      serializedAt: stackData.serializedAt,
      version: stackData.version
    };
  }
}
