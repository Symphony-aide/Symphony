/**
 * @fileoverview Base command class providing common functionality for all commands
 */

/**
 * Abstract base class for all commands in Symphony's undo/redo system
 * Provides common functionality and enforces the Command interface
 * @abstract
 */
export class BaseCommand {
  /**
   * Create a new command
   * @param {string} id - Command identifier (e.g., 'editor.insert')
   * @param {string} description - Human-readable description
   * @param {string} component - Source component name
   */
  constructor(id, description, component) {
    if (this.constructor === BaseCommand) {
      throw new Error('BaseCommand is abstract and cannot be instantiated directly');
    }

    this.id = id;
    this.description = description;
    this.component = component;
    this.timestamp = Date.now();
  }

  /**
   * Execute the command - must be implemented by subclasses
   * @abstract
   * @returns {Promise<void>}
   * @throws {Error} If not implemented by subclass
   */
  async execute() {
    throw new Error(`execute() must be implemented by ${this.constructor.name}`);
  }

  /**
   * Undo the command - must be implemented by subclasses
   * @abstract
   * @returns {Promise<void>}
   * @throws {Error} If not implemented by subclass
   */
  async undo() {
    throw new Error(`undo() must be implemented by ${this.constructor.name}`);
  }

  /**
   * Redo the command - default implementation calls execute()
   * Override if different behavior is needed
   * @returns {Promise<void>}
   */
  async redo() {
    return this.execute();
  }

  /**
   * Check if this command can be merged with another command
   * Default implementation returns false - override for mergeable commands
   * @param {import('../types/Command.js').Command} command - Command to check mergeability with
   * @returns {boolean} True if commands can be merged
   */
  mergeableWith(command) {
    return false;
  }

  /**
   * Merge this command with another command
   * Only called if mergeableWith() returns true
   * Default implementation throws error - override for mergeable commands
   * @param {import('../types/Command.js').Command} command - Command to merge with
   * @returns {import('../types/Command.js').Command} New merged command
   * @throws {Error} If not implemented by subclass
   */
  mergeWith(command) {
    throw new Error(`mergeWith() must be implemented by ${this.constructor.name} if mergeableWith() returns true`);
  }

  /**
   * Get serializable data for persistence
   * Override to provide command-specific data for serialization
   * @returns {*} Serializable data object
   */
  getSerializableData() {
    return {
      id: this.id,
      description: this.description,
      component: this.component,
      timestamp: this.timestamp
    };
  }

  /**
   * Restore command from serialized data
   * Static method to be implemented by subclasses for deserialization
   * @static
   * @param {*} data - Serialized command data
   * @returns {import('../types/Command.js').Command} Restored command instance
   * @throws {Error} If not implemented by subclass
   */
  static fromSerializedData(data) {
    throw new Error(`fromSerializedData() must be implemented by ${this.name}`);
  }

  /**
   * Get a string representation of the command for debugging
   * @returns {string} String representation
   */
  toString() {
    return `${this.constructor.name}(${this.id}): ${this.description} [${new Date(this.timestamp).toISOString()}]`;
  }

  /**
   * Validate command state before execution
   * Override to add command-specific validation
   * @returns {boolean} True if command is valid
   */
  isValid() {
    return !!(this.id && this.description && this.component);
  }
}
