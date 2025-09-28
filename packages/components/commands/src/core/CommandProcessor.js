/**
 * @fileoverview Command processor for pre-processing commands before execution
 */

/**
 * CommandProcessor handles command pre-processing including merging and validation
 * Provides extensible processing pipeline for commands before they hit the stack
 */
export class CommandProcessor {
  /**
   * Create a new command processor
   * @param {Object} [options={}] - Processing options
   * @param {boolean} [options.enableMerging=true] - Whether to enable command merging
   * @param {number} [options.mergeTimeWindow=1000] - Time window for merging in milliseconds
   */
  constructor(options = {}) {
    this.enableMerging = options.enableMerging !== false;
    this.mergeTimeWindow = options.mergeTimeWindow || 1000;
    this.lastCommand = null;
    this.processors = new Map();
    
    // Register default processors
    this.registerProcessor('merge', this.mergeProcessor.bind(this));
    this.registerProcessor('validate', this.validateProcessor.bind(this));
  }

  /**
   * Process a command through the processing pipeline
   * @param {import('../types/Command.js').Command} command - Command to process
   * @param {import('../types/Command.js').Command[]} recentCommands - Recent commands for context
   * @returns {Promise<import('../types/Command.js').Command>} Processed command
   */
  async processCommand(command, recentCommands = []) {
    if (!command) {
      throw new Error('Command is required for processing');
    }

    let processedCommand = command;

    // Run through all registered processors
    for (const [name, processor] of this.processors) {
      try {
        processedCommand = await processor(processedCommand, recentCommands);
      } catch (error) {
        console.error(`Command processor '${name}' failed:`, error);
        // Continue with other processors even if one fails
      }
    }

    // Update last command for merging
    this.lastCommand = processedCommand;

    return processedCommand;
  }

  /**
   * Register a custom command processor
   * @param {string} name - Processor name
   * @param {function(Command, Command[]): Promise<Command>} processor - Processor function
   */
  registerProcessor(name, processor) {
    if (typeof processor !== 'function') {
      throw new Error('Processor must be a function');
    }
    this.processors.set(name, processor);
  }

  /**
   * Unregister a command processor
   * @param {string} name - Processor name to remove
   */
  unregisterProcessor(name) {
    this.processors.delete(name);
  }

  /**
   * Default merge processor - merges compatible commands
   * @private
   * @param {import('../types/Command.js').Command} command - Command to process
   * @param {import('../types/Command.js').Command[]} recentCommands - Recent commands
   * @returns {Promise<import('../types/Command.js').Command>} Processed command
   */
  async mergeProcessor(command, recentCommands) {
    if (!this.enableMerging || !this.lastCommand) {
      return command;
    }

    // Check if commands can be merged
    if (this.canMergeCommands(this.lastCommand, command)) {
      try {
        const mergedCommand = this.lastCommand.mergeWith(command);
        console.debug('Commands merged:', {
          original: this.lastCommand.description,
          new: command.description,
          merged: mergedCommand.description
        });
        return mergedCommand;
      } catch (error) {
        console.warn('Command merge failed, using original command:', error);
        return command;
      }
    }

    return command;
  }

  /**
   * Default validation processor - validates command before execution
   * @private
   * @param {import('../types/Command.js').Command} command - Command to validate
   * @param {import('../types/Command.js').Command[]} recentCommands - Recent commands
   * @returns {Promise<import('../types/Command.js').Command>} Validated command
   */
  async validateProcessor(command, recentCommands) {
    if (!command.isValid || !command.isValid()) {
      throw new Error(`Command validation failed: ${command.toString()}`);
    }

    // Check for required methods
    if (typeof command.execute !== 'function') {
      throw new Error('Command must have an execute method');
    }

    if (typeof command.undo !== 'function') {
      throw new Error('Command must have an undo method');
    }

    return command;
  }

  /**
   * Check if two commands can be merged
   * @private
   * @param {import('../types/Command.js').Command} lastCommand - Previous command
   * @param {import('../types/Command.js').Command} newCommand - New command
   * @returns {boolean} True if commands can be merged
   */
  canMergeCommands(lastCommand, newCommand) {
    // Check basic merge conditions
    if (!lastCommand.mergeableWith || !newCommand.mergeableWith) {
      return false;
    }

    // Check time window
    const timeDiff = newCommand.timestamp - lastCommand.timestamp;
    if (timeDiff > this.mergeTimeWindow) {
      return false;
    }

    // Check if commands are mergeable with each other
    return lastCommand.mergeableWith(newCommand) && newCommand.mergeableWith(lastCommand);
  }

  /**
   * Get processing statistics
   * @returns {Object} Processing statistics
   */
  getStatistics() {
    return {
      enableMerging: this.enableMerging,
      mergeTimeWindow: this.mergeTimeWindow,
      registeredProcessors: Array.from(this.processors.keys()),
      lastCommandTimestamp: this.lastCommand ? this.lastCommand.timestamp : null
    };
  }

  /**
   * Reset processor state
   */
  reset() {
    this.lastCommand = null;
  }

  /**
   * Configure processor options
   * @param {Object} options - New options
   * @param {boolean} [options.enableMerging] - Whether to enable merging
   * @param {number} [options.mergeTimeWindow] - Merge time window in milliseconds
   */
  configure(options) {
    if (options.enableMerging !== undefined) {
      this.enableMerging = options.enableMerging;
    }
    
    if (options.mergeTimeWindow !== undefined) {
      this.mergeTimeWindow = options.mergeTimeWindow;
    }
  }
}
