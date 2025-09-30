/**
 * @fileoverview Global command manager for Symphony's undo/redo system
 */

import { CommandStack } from './CommandStack.js';
import { CommandProcessor } from './CommandProcessor.js';

/**
 * CommandManager coordinates the global command system across Symphony
 * Provides the main interface for executing commands and managing undo/redo
 */
export class CommandManager {
  /**
   * Create a new command manager
   * @param {Object} [options={}] - Configuration options
   * @param {number} [options.maxStackSize=1000] - Maximum commands in stack
   * @param {boolean} [options.enablePersistence=true] - Whether to persist stacks
   * @param {Object} [options.processorOptions] - Options for command processor
   */
  constructor(options = {}) {
    this.stack = new CommandStack(options.maxStackSize);
    this.processor = new CommandProcessor(options.processorOptions);
    this.enablePersistence = options.enablePersistence !== false;
    this.isInitialized = false;
    
    // Bind methods to preserve context
    this.executeCommand = this.executeCommand.bind(this);
    this.undo = this.undo.bind(this);
    this.redo = this.redo.bind(this);
    
    // Initialize keyboard shortcuts and persistence
    this.initialize();
  }

  /**
   * Initialize the command manager
   * @private
   */
  initialize() {
    if (this.isInitialized) return;

    this.setupKeyboardShortcuts();
    
    if (this.enablePersistence) {
      // Try to import storage service and set up persistence
      this.setupPersistenceWithStorageService();
      // Set up persistence on stack changes
      this.stack.addListener(() => this.persistStack());
    }

    this.isInitialized = true;
  }

  /**
   * Setup persistence with Symphony's storage service
   * @private
   */
  async setupPersistenceWithStorageService() {
    // Persistence will be set up externally by passing the storage service
    // This avoids circular dependencies between packages
    console.debug('Command persistence will be configured externally');
  }

  /**
   * Execute a command through the processing pipeline
   * @param {import('../types/Command.js').Command} command - Command to execute
   * @returns {Promise<void>}
   * @throws {Error} If command execution fails
   */
  async executeCommand(command) {
    if (!command) {
      throw new Error('Command is required');
    }

    try {
      // Pre-process the command (validation, merging, etc.)
      const recentCommands = this.stack.getRecentCommands(5);
      const processedCommand = await this.processor.processCommand(command, recentCommands);

      // Execute the command and add to stack
      await this.stack.execute(processedCommand);

      console.debug('Command executed successfully:', processedCommand.description);

    } catch (error) {
      console.error('Command execution failed:', error);
      throw error;
    }
  }

  /**
   * Undo the most recent command
   * @returns {Promise<boolean>} True if undo was successful
   */
  async undo() {
    try {
      const success = await this.stack.undo();
      if (success) {
        console.debug('Undo successful');
      }
      return success;
    } catch (error) {
      console.error('Undo failed:', error);
      throw error;
    }
  }

  /**
   * Redo the most recently undone command
   * @returns {Promise<boolean>} True if redo was successful
   */
  async redo() {
    try {
      const success = await this.stack.redo();
      if (success) {
        console.debug('Redo successful');
      }
      return success;
    } catch (error) {
      console.error('Redo failed:', error);
      throw error;
    }
  }

  /**
   * Check if undo operation is available
   * @returns {boolean} True if undo is available
   */
  canUndo() {
    return this.stack.canUndo();
  }

  /**
   * Check if redo operation is available
   * @returns {boolean} True if redo is available
   */
  canRedo() {
    return this.stack.canRedo();
  }

  /**
   * Get description of command that would be undone
   * @returns {string|null} Undo description or null
   */
  getUndoDescription() {
    return this.stack.getUndoDescription();
  }

  /**
   * Get description of command that would be redone
   * @returns {string|null} Redo description or null
   */
  getRedoDescription() {
    return this.stack.getRedoDescription();
  }

  /**
   * Get current stack state for UI components
   * @returns {import('../types/Command.js').CommandStackState} Stack state
   */
  getStackState() {
    return this.stack.getStackState();
  }

  /**
   * Add listener for stack state changes
   * @param {function(): void} listener - Listener function
   */
  addListener(listener) {
    this.stack.addListener(listener);
  }

  /**
   * Remove stack state change listener
   * @param {function(): void} listener - Listener function to remove
   */
  removeListener(listener) {
    this.stack.removeListener(listener);
  }

  /**
   * Clear all commands from stacks
   */
  clear() {
    this.stack.clear();
    this.processor.reset();
  }

  /**
   * Get recent commands for analysis
   * @param {number} [count=10] - Number of commands to return
   * @returns {import('../types/Command.js').Command[]} Recent commands
   */
  getRecentCommands(count = 10) {
    return this.stack.getRecentCommands(count);
  }

  /**
   * Set up global keyboard shortcuts for undo/redo
   * @private
   */
  setupKeyboardShortcuts() {
    // Only set up if we're in a browser environment
    if (typeof document === 'undefined') return;

    const handleKeydown = (event) => {
      // Check for Ctrl+Z (or Cmd+Z on Mac) - Undo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        this.undo().catch(error => {
          console.error('Keyboard undo failed:', error);
        });
        return;
      }

      // Check for Ctrl+Y or Ctrl+Shift+Z (or Cmd+Y or Cmd+Shift+Z on Mac) - Redo
      if (
        (event.ctrlKey || event.metaKey) &&
        (event.key === 'y' || (event.key === 'z' && event.shiftKey))
      ) {
        event.preventDefault();
        this.redo().catch(error => {
          console.error('Keyboard redo failed:', error);
        });
        return;
      }
    };

    // Add global keyboard listener
    document.addEventListener('keydown', handleKeydown);

    // Store reference for cleanup
    this._keydownHandler = handleKeydown;
  }

  /**
   * Set up persistence layer
   * @param {Object} storageService - Symphony's storage service
   */
  setupPersistence(storageService) {
    if (!storageService) {
      console.warn('No storage service provided, persistence disabled');
      return;
    }

    // Import StackPersistence dynamically to avoid circular dependencies
    import('../persistence/StackPersistence.js').then(({ StackPersistence }) => {
      this.persistence = new StackPersistence(storageService, {
        storageKey: 'symphony-command-stacks',
        maxStackSize: this.stack.maxStackSize,
        autoSave: true
      });

      // Restore stacks on initialization
      this.restoreStack();
    }).catch(error => {
      console.error('Failed to initialize persistence:', error);
    });
  }

  /**
   * Persist command stack to storage
   * @private
   */
  persistStack() {
    if (!this.persistence) return;

    const stackState = this.stack.getStackState();
    const undoStack = this.stack.getRecentCommands(stackState.undoStackSize);
    const redoStack = []; // TODO: Get redo stack from CommandStack

    this.persistence.debouncedSave(undoStack, redoStack).catch(error => {
      console.error('Failed to persist command stacks:', error);
    });
  }

  /**
   * Restore command stack from storage
   * @private
   */
  async restoreStack() {
    if (!this.persistence) return;

    try {
      const context = {
        // Add context for command restoration
        // This would include editor instances, etc.
      };

      const { undoStack, redoStack } = await this.persistence.loadStacks(context);
      
      // Restore commands to stack
      // Note: This is a simplified implementation
      // In practice, you'd need to carefully restore the stack state
      if (undoStack.length > 0 || redoStack.length > 0) {
        console.debug('Restored command stacks', {
          undoCount: undoStack.length,
          redoCount: redoStack.length
        });
      }
    } catch (error) {
      console.error('Failed to restore command stacks:', error);
    }
  }

  /**
   * Configure command processor options
   * @param {Object} options - Processor options
   */
  configureProcessor(options) {
    this.processor.configure(options);
  }

  /**
   * Register a custom command processor
   * @param {string} name - Processor name
   * @param {function} processor - Processor function
   */
  registerProcessor(name, processor) {
    this.processor.registerProcessor(name, processor);
  }

  /**
   * Get manager statistics for debugging
   * @returns {Object} Manager statistics
   */
  getStatistics() {
    return {
      stack: this.stack.getStatistics(),
      processor: this.processor.getStatistics(),
      enablePersistence: this.enablePersistence,
      isInitialized: this.isInitialized
    };
  }

  /**
   * Cleanup resources when manager is destroyed
   */
  destroy() {
    // Remove keyboard listener
    if (this._keydownHandler && typeof document !== 'undefined') {
      document.removeEventListener('keydown', this._keydownHandler);
      this._keydownHandler = null;
    }

    // Clear stacks
    this.stack.clear(false); // Don't notify listeners during cleanup
    this.processor.reset();
    
    this.isInitialized = false;
  }
}
