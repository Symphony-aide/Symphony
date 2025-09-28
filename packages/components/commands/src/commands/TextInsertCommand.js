/**
 * @fileoverview Text insertion command for editor operations
 */

import { BaseCommand } from '../base/BaseCommand.js';

/**
 * Command for inserting text in the editor with merging support for continuous typing
 */
export class TextInsertCommand extends BaseCommand {
  /**
   * Create a text insert command
   * @param {Object} editor - Editor instance
   * @param {Object} position - Cursor position {line, column}
   * @param {string} text - Text to insert
   * @param {string} [oldText=''] - Text that was at this position (for undo)
   */
  constructor(editor, position, text, oldText = '') {
    super('editor.insert', `Insert "${text}"`, 'editor');
    
    this.editor = editor;
    this.position = { ...position }; // Copy to avoid mutations
    this.text = text;
    this.oldText = oldText;
    this.endPosition = {
      line: position.line,
      column: position.column + text.length
    };
  }

  /**
   * Execute the text insertion
   * @returns {Promise<void>}
   */
  async execute() {
    if (!this.editor || typeof this.editor.insertText !== 'function') {
      throw new Error('Editor instance with insertText method is required');
    }

    await this.editor.insertText(this.position, this.text);
  }

  /**
   * Undo the text insertion by deleting the inserted text
   * @returns {Promise<void>}
   */
  async undo() {
    if (!this.editor || typeof this.editor.deleteText !== 'function') {
      throw new Error('Editor instance with deleteText method is required');
    }

    await this.editor.deleteText(this.position, this.endPosition);
    
    // If there was old text, restore it
    if (this.oldText) {
      await this.editor.insertText(this.position, this.oldText);
    }
  }

  /**
   * Check if this command can be merged with another text insert command
   * Enables smooth undo for continuous typing
   * @param {import('../types/Command.js').Command} command - Command to check mergeability
   * @returns {boolean} True if commands can be merged
   */
  mergeableWith(command) {
    if (command.id !== 'editor.insert') return false;
    
    const other = command;
    
    // Must be the same editor
    if (this.editor !== other.editor) return false;
    
    // Must be continuous typing (same line, adjacent positions)
    if (this.position.line !== other.position.line) return false;
    if (this.endPosition.column !== other.position.column) return false;
    
    // Must be within reasonable time window (handled by processor)
    const timeDiff = other.timestamp - this.timestamp;
    if (timeDiff > 1000) return false; // 1 second
    
    // Don't merge if either text contains newlines (separate operations)
    if (this.text.includes('\n') || other.text.includes('\n')) return false;
    
    // Don't merge if text contains significant whitespace changes
    if (this.text.trim() === '' || other.text.trim() === '') return false;
    
    return true;
  }

  /**
   * Merge this command with another text insert command
   * @param {TextInsertCommand} command - Command to merge with
   * @returns {TextInsertCommand} New merged command
   */
  mergeWith(command) {
    if (!this.mergeableWith(command)) {
      throw new Error('Commands cannot be merged');
    }

    // Create new merged command
    const mergedText = this.text + command.text;
    const mergedCommand = new TextInsertCommand(
      this.editor,
      this.position,
      mergedText,
      this.oldText
    );
    
    // Use the timestamp of the newer command
    mergedCommand.timestamp = Math.max(this.timestamp, command.timestamp);
    mergedCommand.description = `Insert "${mergedText}"`;
    
    return mergedCommand;
  }

  /**
   * Get serializable data for persistence
   * @returns {Object} Serializable data
   */
  getSerializableData() {
    return {
      ...super.getSerializableData(),
      position: this.position,
      text: this.text,
      oldText: this.oldText,
      endPosition: this.endPosition
    };
  }

  /**
   * Validate command state
   * @returns {boolean} True if command is valid
   */
  isValid() {
    return super.isValid() && 
           this.editor && 
           this.position && 
           typeof this.position.line === 'number' &&
           typeof this.position.column === 'number' &&
           typeof this.text === 'string';
  }

  /**
   * Create command from serialized data
   * @static
   * @param {Object} data - Serialized command data
   * @param {Object} editor - Editor instance
   * @returns {TextInsertCommand} Restored command
   */
  static fromSerializedData(data, editor) {
    const command = new TextInsertCommand(
      editor,
      data.position,
      data.text,
      data.oldText
    );
    command.timestamp = data.timestamp;
    return command;
  }
}
