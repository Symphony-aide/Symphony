/**
 * @fileoverview Command stack implementation for undo/redo functionality
 */

/**
 * CommandStack manages the undo and redo stacks for Symphony's global undo/redo system
 * Provides core stack operations and state management
 */
export class CommandStack {
  /**
   * Create a new command stack
   * @param {number} [maxStackSize=1000] - Maximum number of commands to keep in stack
   */
  constructor(maxStackSize = 1000) {
    this.undoStack = [];
    this.redoStack = [];
    this.maxStackSize = maxStackSize;
    this.listeners = new Set();
  }

  /**
   * Execute a command and add it to the undo stack
   * Clears the redo stack as new commands invalidate redo history
   * @param {import('../types/Command.js').Command} command - Command to execute
   * @returns {Promise<void>}
   * @throws {Error} If command execution fails
   */
  async execute(command) {
    if (!command || typeof command.execute !== 'function') {
      throw new Error('Invalid command: must have an execute method');
    }

    if (!command.isValid || !command.isValid()) {
      throw new Error(`Invalid command: ${command.toString()}`);
    }

    try {
      // Execute the command
      await command.execute();

      // Add to undo stack
      this.undoStack.push(command);

      // Clear redo stack when new command is executed
      this.redoStack = [];

      // Trim stack if it exceeds maximum size
      this.trimStack();

      // Notify listeners of stack change
      this.notifyStackChanged();

    } catch (error) {
      console.error('Command execution failed:', error);
      throw new Error(`Failed to execute command "${command.description}": ${error.message}`);
    }
  }

  /**
   * Undo the most recent command
   * Moves command from undo stack to redo stack
   * @returns {Promise<boolean>} True if undo was successful, false if nothing to undo
   */
  async undo() {
    if (this.undoStack.length === 0) {
      return false;
    }

    const command = this.undoStack.pop();
    
    try {
      await command.undo();
      this.redoStack.push(command);
      this.notifyStackChanged();
      return true;
    } catch (error) {
      // If undo fails, put command back on undo stack
      this.undoStack.push(command);
      console.error('Command undo failed:', error);
      throw new Error(`Failed to undo command "${command.description}": ${error.message}`);
    }
  }

  /**
   * Redo the most recently undone command
   * Moves command from redo stack to undo stack
   * @returns {Promise<boolean>} True if redo was successful, false if nothing to redo
   */
  async redo() {
    if (this.redoStack.length === 0) {
      return false;
    }

    const command = this.redoStack.pop();
    
    try {
      await command.redo();
      this.undoStack.push(command);
      this.notifyStackChanged();
      return true;
    } catch (error) {
      // If redo fails, put command back on redo stack
      this.redoStack.push(command);
      console.error('Command redo failed:', error);
      throw new Error(`Failed to redo command "${command.description}": ${error.message}`);
    }
  }

  /**
   * Check if undo operation is available
   * @returns {boolean} True if there are commands to undo
   */
  canUndo() {
    return this.undoStack.length > 0;
  }

  /**
   * Check if redo operation is available
   * @returns {boolean} True if there are commands to redo
   */
  canRedo() {
    return this.redoStack.length > 0;
  }

  /**
   * Get description of the command that would be undone
   * @returns {string|null} Description or null if no undo available
   */
  getUndoDescription() {
    return this.undoStack.length > 0 
      ? this.undoStack[this.undoStack.length - 1].description 
      : null;
  }

  /**
   * Get description of the command that would be redone
   * @returns {string|null} Description or null if no redo available
   */
  getRedoDescription() {
    return this.redoStack.length > 0 
      ? this.redoStack[this.redoStack.length - 1].description 
      : null;
  }

  /**
   * Get current stack state for UI components
   * @returns {import('../types/Command.js').CommandStackState} Current stack state
   */
  getStackState() {
    return {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      undoDescription: this.getUndoDescription(),
      redoDescription: this.getRedoDescription(),
      undoStackSize: this.undoStack.length,
      redoStackSize: this.redoStack.length
    };
  }

  /**
   * Clear both undo and redo stacks
   * @param {boolean} [notify=true] - Whether to notify listeners
   */
  clear(notify = true) {
    this.undoStack = [];
    this.redoStack = [];
    
    if (notify) {
      this.notifyStackChanged();
    }
  }

  /**
   * Get recent commands for analysis or display
   * @param {number} [count=10] - Number of recent commands to return
   * @returns {import('../types/Command.js').Command[]} Array of recent commands
   */
  getRecentCommands(count = 10) {
    return this.undoStack.slice(-count);
  }

  /**
   * Trim stacks to maximum size, removing oldest commands
   * @private
   */
  trimStack() {
    if (this.undoStack.length > this.maxStackSize) {
      const excess = this.undoStack.length - this.maxStackSize;
      this.undoStack.splice(0, excess);
    }
    
    // Also trim redo stack if it gets too large
    if (this.redoStack.length > this.maxStackSize) {
      const excess = this.redoStack.length - this.maxStackSize;
      this.redoStack.splice(0, excess);
    }
  }

  /**
   * Add a listener for stack changes
   * @param {function(): void} listener - Function to call when stack changes
   */
  addListener(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Listener must be a function');
    }
    this.listeners.add(listener);
  }

  /**
   * Remove a stack change listener
   * @param {function(): void} listener - Listener function to remove
   */
  removeListener(listener) {
    this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of stack changes
   * @private
   */
  notifyStackChanged() {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in stack change listener:', error);
      }
    });
  }

  /**
   * Get stack statistics for debugging
   * @returns {Object} Stack statistics
   */
  getStatistics() {
    const undoComponents = new Set(this.undoStack.map(cmd => cmd.component));
    const redoComponents = new Set(this.redoStack.map(cmd => cmd.component));
    
    return {
      undoStackSize: this.undoStack.length,
      redoStackSize: this.redoStack.length,
      maxStackSize: this.maxStackSize,
      undoComponents: Array.from(undoComponents),
      redoComponents: Array.from(redoComponents),
      totalListeners: this.listeners.size,
      oldestUndoCommand: this.undoStack.length > 0 ? this.undoStack[0].timestamp : null,
      newestUndoCommand: this.undoStack.length > 0 ? this.undoStack[this.undoStack.length - 1].timestamp : null
    };
  }
}
