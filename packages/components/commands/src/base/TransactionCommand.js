/**
 * @fileoverview Transaction command for atomic operations with rollback capability
 */

import { BaseCommand } from './BaseCommand.js';

/**
 * Transaction command ensures all-or-nothing execution of multiple commands
 * If any command fails, all previously executed commands are automatically rolled back
 * Provides stronger guarantees than CompoundCommand for critical operations
 */
export class TransactionCommand extends BaseCommand {
  /**
   * Create a transaction command
   * @param {import('../types/Command.js').Command[]} commands - Array of commands to execute atomically
   * @param {string} [description] - Optional custom description
   * @param {string} [component='transaction'] - Component name
   */
  constructor(commands, description, component = 'transaction') {
    if (!Array.isArray(commands) || commands.length === 0) {
      throw new Error('TransactionCommand requires a non-empty array of commands');
    }

    const autoDescription = description || `Transaction: ${commands.length} operations`;
    
    super('transaction', autoDescription, component);

    this.commands = [...commands]; // Create a copy
    this.executedCommands = []; // Track which commands have been executed
    this.isCommitted = false; // Track transaction state
    
    // Update timestamp to be the latest of all commands
    this.timestamp = Math.max(...commands.map(cmd => cmd.timestamp || Date.now()));
  }

  /**
   * Execute all commands atomically
   * If any command fails, automatically rollback all previously executed commands
   * @returns {Promise<void>}
   * @throws {Error} If transaction fails (after rollback)
   */
  async execute() {
    this.executedCommands = [];
    this.isCommitted = false;
    
    try {
      // Execute all commands in sequence
      for (let i = 0; i < this.commands.length; i++) {
        const command = this.commands[i];
        
        try {
          await command.execute();
          this.executedCommands.push(command);
        } catch (commandError) {
          // Command failed - rollback and throw
          await this.rollback();
          throw new Error(
            `Transaction failed at command ${i + 1}/${this.commands.length} (${command.description}): ${commandError.message}`
          );
        }
      }
      
      // All commands executed successfully
      this.isCommitted = true;
      
    } catch (error) {
      // Ensure rollback happened and re-throw
      if (!this.executedCommands.length === 0) {
        await this.rollback();
      }
      throw error;
    }
  }

  /**
   * Rollback all executed commands in reverse order
   * @private
   * @returns {Promise<void>}
   */
  async rollback() {
    const rollbackErrors = [];
    
    // Undo executed commands in reverse order
    for (let i = this.executedCommands.length - 1; i >= 0; i--) {
      const command = this.executedCommands[i];
      
      try {
        await command.undo();
      } catch (undoError) {
        console.error(`Failed to rollback command during transaction failure:`, {
          command: command.toString(),
          error: undoError
        });
        rollbackErrors.push({
          command: command.description,
          error: undoError.message
        });
      }
    }
    
    // Clear executed commands list
    this.executedCommands = [];
    
    if (rollbackErrors.length > 0) {
      console.warn(`Transaction rollback had ${rollbackErrors.length} failures:`, rollbackErrors);
    }
  }

  /**
   * Undo the entire transaction
   * Only works if the transaction was previously committed
   * @returns {Promise<void>}
   * @throws {Error} If transaction was not committed
   */
  async undo() {
    if (!this.isCommitted) {
      throw new Error('Cannot undo a transaction that was not successfully committed');
    }
    
    const errors = [];
    
    // Undo all commands in reverse order
    for (let i = this.commands.length - 1; i >= 0; i--) {
      try {
        await this.commands[i].undo();
      } catch (error) {
        console.error(`Failed to undo command in transaction:`, error);
        errors.push(error);
      }
    }
    
    this.isCommitted = false;
    
    if (errors.length > 0) {
      throw new Error(`Transaction undo had ${errors.length} failures`);
    }
  }

  /**
   * Redo the entire transaction
   * @returns {Promise<void>}
   */
  async redo() {
    return this.execute();
  }

  /**
   * Transaction commands are not mergeable for safety
   * @param {import('../types/Command.js').Command} command - Command to check
   * @returns {boolean} Always false
   */
  mergeableWith(command) {
    return false;
  }

  /**
   * Get serializable data including transaction state
   * @returns {*} Serializable data object
   */
  getSerializableData() {
    return {
      ...super.getSerializableData(),
      commands: this.commands.map(cmd => cmd.getSerializableData()),
      isCommitted: this.isCommitted
    };
  }

  /**
   * Get transaction status information
   * @returns {Object} Transaction status
   */
  getTransactionStatus() {
    return {
      totalCommands: this.commands.length,
      executedCommands: this.executedCommands.length,
      isCommitted: this.isCommitted,
      isPartiallyExecuted: this.executedCommands.length > 0 && !this.isCommitted
    };
  }

  /**
   * Get detailed description including transaction status
   * @returns {string} Detailed description
   */
  getDetailedDescription() {
    const status = this.getTransactionStatus();
    const subDescriptions = this.commands.map((cmd, i) => {
      const executed = i < this.executedCommands.length ? '✓' : '○';
      return `  ${executed} ${cmd.description}`;
    }).join('\n');
    
    return `${this.description} (${status.executedCommands}/${status.totalCommands} executed, committed: ${status.isCommitted}):\n${subDescriptions}`;
  }

  /**
   * Validate transaction and all sub-commands
   * @returns {boolean} True if transaction is valid
   */
  isValid() {
    return super.isValid() && 
           this.commands.length > 0 && 
           this.commands.every(cmd => cmd.isValid && cmd.isValid());
  }

  /**
   * Get string representation including transaction status
   * @returns {string} String representation
   */
  toString() {
    const status = this.getTransactionStatus();
    return `${super.toString()} [Transaction: ${status.executedCommands}/${status.totalCommands}, committed: ${status.isCommitted}]`;
  }
}
