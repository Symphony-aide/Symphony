/**
 * @fileoverview Text deletion command for editor operations
 */

import { BaseCommand } from '../base/BaseCommand.js';

/**
 * Command for deleting text in the editor
 */
export class TextDeleteCommand extends BaseCommand {
  /**
   * Create a text delete command
   * @param {Object} editor - Editor instance
   * @param {Object} startPosition - Start position {line, column}
   * @param {Object} endPosition - End position {line, column}
   * @param {string} deletedText - Text that will be deleted
   */
  constructor(editor, startPosition, endPosition, deletedText) {
    super('editor.delete', `Delete "${deletedText}"`, 'editor');
    
    this.editor = editor;
    this.startPosition = { ...startPosition };
    this.endPosition = { ...endPosition };
    this.deletedText = deletedText;
  }

  /**
   * Execute the text deletion
   * @returns {Promise<void>}
   */
  async execute() {
    if (!this.editor || typeof this.editor.deleteText !== 'function') {
      throw new Error('Editor instance with deleteText method is required');
    }

    await this.editor.deleteText(this.startPosition, this.endPosition);
  }

  /**
   * Undo the text deletion by inserting the deleted text back
   * @returns {Promise<void>}
   */
  async undo() {
    if (!this.editor || typeof this.editor.insertText !== 'function') {
      throw new Error('Editor instance with insertText method is required');
    }

    await this.editor.insertText(this.startPosition, this.deletedText);
  }

  /**
   * Check if this command can be merged with another delete command
   * @param {import('../types/Command.js').Command} command - Command to check
   * @returns {boolean} True if commands can be merged
   */
  mergeableWith(command) {
    if (command.id !== 'editor.delete') return false;
    
    const other = command;
    
    // Must be the same editor
    if (this.editor !== other.editor) return false;
    
    // Must be within reasonable time window
    const timeDiff = other.timestamp - this.timestamp;
    if (timeDiff > 1000) return false; // 1 second
    
    // Check if deletions are adjacent (backspace/delete key scenarios)
    const thisIsBackspace = this.endPosition.line === other.startPosition.line &&
                           this.endPosition.column === other.startPosition.column;
    
    const thisIsDelete = this.startPosition.line === other.endPosition.line &&
                        this.startPosition.column === other.endPosition.column;
    
    return thisIsBackspace || thisIsDelete;
  }

  /**
   * Merge this command with another delete command
   * @param {TextDeleteCommand} command - Command to merge with
   * @returns {TextDeleteCommand} New merged command
   */
  mergeWith(command) {
    if (!this.mergeableWith(command)) {
      throw new Error('Commands cannot be merged');
    }

    let mergedStart, mergedEnd, mergedText;
    
    // Determine merge direction
    const isBackspace = this.endPosition.line === command.startPosition.line &&
                       this.endPosition.column === command.startPosition.column;
    
    if (isBackspace) {
      // Backspace scenario: this command deleted text before the other
      mergedStart = this.startPosition;
      mergedEnd = command.endPosition;
      mergedText = this.deletedText + command.deletedText;
    } else {
      // Delete key scenario: this command deleted text after the other
      mergedStart = command.startPosition;
      mergedEnd = this.endPosition;
      mergedText = command.deletedText + this.deletedText;
    }

    const mergedCommand = new TextDeleteCommand(
      this.editor,
      mergedStart,
      mergedEnd,
      mergedText
    );
    
    // Use the timestamp of the newer command
    mergedCommand.timestamp = Math.max(this.timestamp, command.timestamp);
    mergedCommand.description = `Delete "${mergedText}"`;
    
    return mergedCommand;
  }

  /**
   * Get serializable data for persistence
   * @returns {Object} Serializable data
   */
  getSerializableData() {
    return {
      ...super.getSerializableData(),
      startPosition: this.startPosition,
      endPosition: this.endPosition,
      deletedText: this.deletedText
    };
  }

  /**
   * Validate command state
   * @returns {boolean} True if command is valid
   */
  isValid() {
    return super.isValid() && 
           this.editor && 
           this.startPosition && 
           this.endPosition &&
           typeof this.startPosition.line === 'number' &&
           typeof this.startPosition.column === 'number' &&
           typeof this.endPosition.line === 'number' &&
           typeof this.endPosition.column === 'number' &&
           typeof this.deletedText === 'string';
  }

  /**
   * Create command from serialized data
   * @static
   * @param {Object} data - Serialized command data
   * @param {Object} editor - Editor instance
   * @returns {TextDeleteCommand} Restored command
   */
  static fromSerializedData(data, editor) {
    const command = new TextDeleteCommand(
      editor,
      data.startPosition,
      data.endPosition,
      data.deletedText
    );
    command.timestamp = data.timestamp;
    return command;
  }
}
