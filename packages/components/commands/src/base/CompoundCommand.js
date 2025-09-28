/**
 * @fileoverview Compound command for grouping multiple commands into a single operation
 */

import { BaseCommand } from './BaseCommand.js';

/**
 * Compound command that executes multiple commands as a single operation
 * Useful for operations that span multiple components or complex multi-step operations
 */
export class CompoundCommand extends BaseCommand {
  /**
   * Create a compound command from multiple commands
   * @param {import('../types/Command.js').Command[]} commands - Array of commands to execute
   * @param {string} [description] - Optional custom description (auto-generated if not provided)
   * @param {string} [component='multiple'] - Component name (defaults to 'multiple')
   */
  constructor(commands, description, component = 'multiple') {
    if (!Array.isArray(commands) || commands.length === 0) {
      throw new Error('CompoundCommand requires a non-empty array of commands');
    }

    // Auto-generate description if not provided
    const autoDescription = description || `${commands.length} operations`;
    
    super('compound', autoDescription, component);

    this.commands = [...commands]; // Create a copy to avoid external mutations
    
    // Update timestamp to be the latest of all commands
    this.timestamp = Math.max(...commands.map(cmd => cmd.timestamp || Date.now()));
  }

  /**
   * Execute all commands in sequence
   * If any command fails, the entire operation fails
   * @returns {Promise<void>}
   * @throws {Error} If any command execution fails
   */
  async execute() {
    const executedCommands = [];
    
    try {
      for (const command of this.commands) {
        await command.execute();
        executedCommands.push(command);
      }
    } catch (error) {
      // If execution fails, undo all previously executed commands in reverse order
      console.error('CompoundCommand execution failed, rolling back:', error);
      
      for (let i = executedCommands.length - 1; i >= 0; i--) {
        try {
          await executedCommands[i].undo();
        } catch (undoError) {
          console.error('Failed to undo command during rollback:', undoError);
        }
      }
      
      throw new Error(`CompoundCommand execution failed: ${error.message}`);
    }
  }

  /**
   * Undo all commands in reverse order
   * @returns {Promise<void>}
   */
  async undo() {
    const errors = [];
    
    // Undo in reverse order
    for (let i = this.commands.length - 1; i >= 0; i--) {
      try {
        await this.commands[i].undo();
      } catch (error) {
        console.error(`Failed to undo command ${i} in compound operation:`, error);
        errors.push(error);
      }
    }
    
    if (errors.length > 0) {
      throw new Error(`CompoundCommand undo had ${errors.length} failures`);
    }
  }

  /**
   * Redo all commands in original order
   * @returns {Promise<void>}
   */
  async redo() {
    return this.execute();
  }

  /**
   * Check if this compound command can be merged with another
   * Currently compound commands are not mergeable for simplicity
   * @param {import('../types/Command.js').Command} command - Command to check
   * @returns {boolean} Always false
   */
  mergeableWith(command) {
    return false;
  }

  /**
   * Get serializable data including all sub-commands
   * @returns {*} Serializable data object
   */
  getSerializableData() {
    return {
      ...super.getSerializableData(),
      commands: this.commands.map(cmd => cmd.getSerializableData())
    };
  }

  /**
   * Get detailed description including sub-command info
   * @returns {string} Detailed description
   */
  getDetailedDescription() {
    const subDescriptions = this.commands.map(cmd => `  - ${cmd.description}`).join('\n');
    return `${this.description}:\n${subDescriptions}`;
  }

  /**
   * Get all component names involved in this compound command
   * @returns {string[]} Array of unique component names
   */
  getInvolvedComponents() {
    const components = new Set(this.commands.map(cmd => cmd.component));
    return Array.from(components);
  }

  /**
   * Validate that all sub-commands are valid
   * @returns {boolean} True if all commands are valid
   */
  isValid() {
    return super.isValid() && this.commands.every(cmd => cmd.isValid && cmd.isValid());
  }

  /**
   * Get string representation including sub-commands
   * @returns {string} String representation
   */
  toString() {
    const subCommands = this.commands.map(cmd => `    ${cmd.toString()}`).join('\n');
    return `${super.toString()}\n  Sub-commands:\n${subCommands}`;
  }
}
