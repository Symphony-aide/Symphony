/**
 * @fileoverview Stack persistence for command system using Symphony's storage service
 */

import { CommandSerializer } from './CommandSerializer.js';

/**
 * StackPersistence handles saving and loading command stacks
 * Integrates with Symphony's storage abstraction layer
 */
export class StackPersistence {
  /**
   * Create a new stack persistence manager
   * @param {Object} storageService - Symphony's storage service
   * @param {Object} [options={}] - Persistence options
   */
  constructor(storageService, options = {}) {
    this.storage = storageService;
    this.serializer = new CommandSerializer();
    
    this.options = {
      storageKey: 'symphony-command-stacks',
      maxStackSize: 1000,
      autoSave: true,
      saveDelay: 1000, // Debounce saves by 1 second
      ...options
    };

    this.saveTimeout = null;
  }

  /**
   * Save command stacks to storage
   * @param {import('../types/Command.js').Command[]} undoStack - Undo stack
   * @param {import('../types/Command.js').Command[]} redoStack - Redo stack
   * @returns {Promise<boolean>} True if save was successful
   */
  async saveStacks(undoStack, redoStack) {
    try {
      // Trim stacks to maximum size before saving
      const trimmedUndoStack = this.trimStack(undoStack);
      const trimmedRedoStack = this.trimStack(redoStack);

      // Serialize the stacks
      const serializedData = this.serializer.serializeStacks(trimmedUndoStack, trimmedRedoStack);
      
      // Add metadata
      serializedData.metadata = {
        savedAt: Date.now(),
        version: '1.0',
        totalCommands: trimmedUndoStack.length + trimmedRedoStack.length
      };

      // Save to storage
      await this.storage.set(this.options.storageKey, serializedData);
      
      console.debug('Command stacks saved successfully', {
        undoCount: trimmedUndoStack.length,
        redoCount: trimmedRedoStack.length
      });

      return true;
    } catch (error) {
      console.error('Failed to save command stacks:', error);
      return false;
    }
  }

  /**
   * Save stacks with debouncing to avoid excessive writes
   * @param {import('../types/Command.js').Command[]} undoStack - Undo stack
   * @param {import('../types/Command.js').Command[]} redoStack - Redo stack
   * @returns {Promise<void>}
   */
  async debouncedSave(undoStack, redoStack) {
    if (!this.options.autoSave) return;

    // Clear existing timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // Set new timeout
    this.saveTimeout = setTimeout(async () => {
      await this.saveStacks(undoStack, redoStack);
      this.saveTimeout = null;
    }, this.options.saveDelay);
  }

  /**
   * Load command stacks from storage
   * @param {Object} [context={}] - Context for command restoration
   * @returns {Promise<Object>} Restored stacks {undoStack, redoStack, metadata}
   */
  async loadStacks(context = {}) {
    try {
      const serializedData = await this.storage.get(this.options.storageKey);
      
      if (!serializedData) {
        console.debug('No saved command stacks found');
        return { undoStack: [], redoStack: [], metadata: null };
      }

      // Validate the data
      if (!this.validateStackData(serializedData)) {
        console.warn('Invalid stack data found, starting fresh');
        return { undoStack: [], redoStack: [], metadata: null };
      }

      // Deserialize the stacks
      const { undoStack, redoStack } = this.serializer.deserializeStacks(serializedData, context);
      
      console.debug('Command stacks loaded successfully', {
        undoCount: undoStack.length,
        redoCount: redoStack.length,
        savedAt: serializedData.metadata?.savedAt
      });

      return {
        undoStack,
        redoStack,
        metadata: serializedData.metadata
      };
    } catch (error) {
      console.error('Failed to load command stacks:', error);
      return { undoStack: [], redoStack: [], metadata: null };
    }
  }

  /**
   * Clear saved command stacks
   * @returns {Promise<boolean>} True if clear was successful
   */
  async clearStacks() {
    try {
      await this.storage.remove(this.options.storageKey);
      console.debug('Command stacks cleared from storage');
      return true;
    } catch (error) {
      console.error('Failed to clear command stacks:', error);
      return false;
    }
  }

  /**
   * Get information about saved stacks without loading them
   * @returns {Promise<Object|null>} Stack metadata or null if no data
   */
  async getStackInfo() {
    try {
      const serializedData = await this.storage.get(this.options.storageKey);
      
      if (!serializedData) {
        return null;
      }

      return {
        ...serializedData.metadata,
        stats: this.serializer.getSerializationStats(serializedData)
      };
    } catch (error) {
      console.error('Failed to get stack info:', error);
      return null;
    }
  }

  /**
   * Export command stacks to a downloadable format
   * @param {import('../types/Command.js').Command[]} undoStack - Undo stack
   * @param {import('../types/Command.js').Command[]} redoStack - Redo stack
   * @param {string} [format='json'] - Export format ('json' or 'csv')
   * @returns {Promise<string>} Exported data
   */
  async exportStacks(undoStack, redoStack, format = 'json') {
    const serializedData = this.serializer.serializeStacks(undoStack, redoStack);
    
    if (format === 'json') {
      return JSON.stringify(serializedData, null, 2);
    } else if (format === 'csv') {
      return this.convertToCsv(serializedData);
    }
    
    throw new Error(`Unsupported export format: ${format}`);
  }

  /**
   * Import command stacks from exported data
   * @param {string} data - Exported stack data
   * @param {string} [format='json'] - Import format
   * @param {Object} [context={}] - Context for restoration
   * @returns {Promise<Object>} Imported stacks {undoStack, redoStack}
   */
  async importStacks(data, format = 'json', context = {}) {
    let serializedData;
    
    if (format === 'json') {
      serializedData = JSON.parse(data);
    } else {
      throw new Error(`Unsupported import format: ${format}`);
    }

    if (!this.validateStackData(serializedData)) {
      throw new Error('Invalid stack data format');
    }

    return this.serializer.deserializeStacks(serializedData, context);
  }

  /**
   * Trim stack to maximum size, keeping most recent commands
   * @private
   * @param {import('../types/Command.js').Command[]} stack - Stack to trim
   * @returns {import('../types/Command.js').Command[]} Trimmed stack
   */
  trimStack(stack) {
    if (stack.length <= this.options.maxStackSize) {
      return stack;
    }
    
    return stack.slice(-this.options.maxStackSize);
  }

  /**
   * Validate serialized stack data
   * @private
   * @param {Object} data - Data to validate
   * @returns {boolean} True if data is valid
   */
  validateStackData(data) {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Check for required structure
    if (!Array.isArray(data.undoStack) || !Array.isArray(data.redoStack)) {
      return false;
    }

    // Check version compatibility
    if (data.version && data.version !== '1.0') {
      console.warn(`Unsupported stack data version: ${data.version}`);
      return false;
    }

    return true;
  }

  /**
   * Convert serialized data to CSV format
   * @private
   * @param {Object} serializedData - Serialized stack data
   * @returns {string} CSV formatted data
   */
  convertToCsv(serializedData) {
    const allCommands = [
      ...serializedData.undoStack.map(cmd => ({ ...cmd, stack: 'undo' })),
      ...serializedData.redoStack.map(cmd => ({ ...cmd, stack: 'redo' }))
    ];

    const headers = ['stack', 'id', 'description', 'component', 'timestamp'];
    const rows = allCommands.map(cmd => [
      cmd.stack,
      cmd.id,
      `"${cmd.description.replace(/"/g, '""')}"`, // Escape quotes
      cmd.component,
      new Date(cmd.timestamp).toISOString()
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Configure persistence options
   * @param {Object} newOptions - New options to merge
   */
  configure(newOptions) {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Register a custom command for serialization
   * @param {string} commandId - Command identifier
   * @param {Function} CommandClass - Command class
   */
  registerCommand(commandId, CommandClass) {
    this.serializer.registerCommand(commandId, CommandClass);
  }

  /**
   * Get persistence statistics
   * @returns {Promise<Object>} Persistence statistics
   */
  async getStatistics() {
    const info = await this.getStackInfo();
    
    return {
      hasPersistedData: info !== null,
      lastSaved: info?.savedAt || null,
      totalCommands: info?.stats?.totalCommands || 0,
      dataSize: info?.stats?.dataSize || 0,
      registeredCommands: this.serializer.getRegisteredCommands(),
      options: { ...this.options }
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
  }
}
