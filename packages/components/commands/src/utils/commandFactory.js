/**
 * @fileoverview Factory utilities for creating common commands
 */

import { TextInsertCommand } from '../commands/TextInsertCommand.js';
import { TextDeleteCommand } from '../commands/TextDeleteCommand.js';
import { CompoundCommand } from '../base/CompoundCommand.js';
import { TransactionCommand } from '../base/TransactionCommand.js';

/**
 * Factory for creating common editor commands
 * Provides convenient methods for creating frequently used commands
 */
export class CommandFactory {
  /**
   * Create a text insert command
   * @param {Object} editor - Editor instance
   * @param {Object} position - Position {line, column}
   * @param {string} text - Text to insert
   * @param {string} [oldText=''] - Previous text for undo
   * @returns {TextInsertCommand} Text insert command
   */
  static createTextInsert(editor, position, text, oldText = '') {
    return new TextInsertCommand(editor, position, text, oldText);
  }

  /**
   * Create a text delete command
   * @param {Object} editor - Editor instance
   * @param {Object} startPosition - Start position
   * @param {Object} endPosition - End position
   * @param {string} deletedText - Text being deleted
   * @returns {TextDeleteCommand} Text delete command
   */
  static createTextDelete(editor, startPosition, endPosition, deletedText) {
    return new TextDeleteCommand(editor, startPosition, endPosition, deletedText);
  }

  /**
   * Create a text replace command (delete + insert as compound)
   * @param {Object} editor - Editor instance
   * @param {Object} startPosition - Start position
   * @param {Object} endPosition - End position
   * @param {string} oldText - Text being replaced
   * @param {string} newText - New text to insert
   * @returns {CompoundCommand} Compound replace command
   */
  static createTextReplace(editor, startPosition, endPosition, oldText, newText) {
    const deleteCommand = new TextDeleteCommand(editor, startPosition, endPosition, oldText);
    const insertCommand = new TextInsertCommand(editor, startPosition, newText);
    
    return new CompoundCommand(
      [deleteCommand, insertCommand],
      `Replace "${oldText}" with "${newText}"`
    );
  }

  /**
   * Create a multi-cursor insert command
   * @param {Object} editor - Editor instance
   * @param {Array} positions - Array of positions
   * @param {string} text - Text to insert at each position
   * @returns {CompoundCommand} Multi-cursor insert command
   */
  static createMultiCursorInsert(editor, positions, text) {
    const commands = positions.map(position => 
      new TextInsertCommand(editor, position, text)
    );
    
    return new CompoundCommand(
      commands,
      `Multi-cursor insert "${text}" at ${positions.length} positions`
    );
  }

  /**
   * Create a line operation command (insert/delete entire lines)
   * @param {Object} editor - Editor instance
   * @param {number} lineNumber - Line number
   * @param {string} operation - 'insert' or 'delete'
   * @param {string} [content=''] - Content for insert operations
   * @returns {Command} Line operation command
   */
  static createLineOperation(editor, lineNumber, operation, content = '') {
    if (operation === 'insert') {
      const position = { line: lineNumber, column: 0 };
      return new TextInsertCommand(editor, position, content + '\n');
    } else if (operation === 'delete') {
      const startPosition = { line: lineNumber, column: 0 };
      const endPosition = { line: lineNumber + 1, column: 0 };
      return new TextDeleteCommand(editor, startPosition, endPosition, content);
    }
    
    throw new Error(`Unknown line operation: ${operation}`);
  }

  /**
   * Create a selection-based command
   * @param {Object} editor - Editor instance
   * @param {Object} selection - Selection {start, end}
   * @param {string} operation - Operation type
   * @param {*} [data] - Additional operation data
   * @returns {Command} Selection-based command
   */
  static createSelectionCommand(editor, selection, operation, data) {
    const { start, end } = selection;
    
    switch (operation) {
      case 'delete':
        return new TextDeleteCommand(editor, start, end, data.selectedText);
      
      case 'replace':
        return this.createTextReplace(editor, start, end, data.selectedText, data.newText);
      
      case 'wrap':
        const wrapStart = data.prefix || '';
        const wrapEnd = data.suffix || '';
        return this.createTextReplace(
          editor, 
          start, 
          end, 
          data.selectedText, 
          wrapStart + data.selectedText + wrapEnd
        );
      
      default:
        throw new Error(`Unknown selection operation: ${operation}`);
    }
  }

  /**
   * Create a transaction for atomic file operations
   * @param {Array} commands - Commands to execute atomically
   * @param {string} [description] - Transaction description
   * @returns {TransactionCommand} Transaction command
   */
  static createTransaction(commands, description) {
    return new TransactionCommand(commands, description);
  }

  /**
   * Create a batch operation for multiple related commands
   * @param {Array} commands - Commands to group
   * @param {string} [description] - Batch description
   * @returns {CompoundCommand} Compound command
   */
  static createBatch(commands, description) {
    return new CompoundCommand(commands, description);
  }
}

/**
 * Utility functions for command creation
 */
export const CommandUtils = {
  /**
   * Calculate end position after text insertion
   * @param {Object} startPosition - Start position {line, column}
   * @param {string} text - Inserted text
   * @returns {Object} End position {line, column}
   */
  calculateEndPosition(startPosition, text) {
    const lines = text.split('\n');
    
    if (lines.length === 1) {
      // Single line insertion
      return {
        line: startPosition.line,
        column: startPosition.column + text.length
      };
    } else {
      // Multi-line insertion
      return {
        line: startPosition.line + lines.length - 1,
        column: lines[lines.length - 1].length
      };
    }
  },

  /**
   * Calculate text length between two positions
   * @param {Object} startPosition - Start position
   * @param {Object} endPosition - End position
   * @param {string} text - Full text content
   * @returns {number} Character count between positions
   */
  calculateTextLength(startPosition, endPosition, text) {
    const lines = text.split('\n');
    let length = 0;
    
    for (let line = startPosition.line; line <= endPosition.line; line++) {
      if (line === startPosition.line && line === endPosition.line) {
        // Same line
        length += endPosition.column - startPosition.column;
      } else if (line === startPosition.line) {
        // First line
        length += lines[line].length - startPosition.column + 1; // +1 for newline
      } else if (line === endPosition.line) {
        // Last line
        length += endPosition.column;
      } else {
        // Middle lines
        length += lines[line].length + 1; // +1 for newline
      }
    }
    
    return length;
  },

  /**
   * Validate position object
   * @param {Object} position - Position to validate
   * @returns {boolean} True if valid position
   */
  isValidPosition(position) {
    return position && 
           typeof position.line === 'number' && 
           typeof position.column === 'number' &&
           position.line >= 0 && 
           position.column >= 0;
  },

  /**
   * Compare two positions
   * @param {Object} pos1 - First position
   * @param {Object} pos2 - Second position
   * @returns {number} -1 if pos1 < pos2, 0 if equal, 1 if pos1 > pos2
   */
  comparePositions(pos1, pos2) {
    if (pos1.line < pos2.line) return -1;
    if (pos1.line > pos2.line) return 1;
    if (pos1.column < pos2.column) return -1;
    if (pos1.column > pos2.column) return 1;
    return 0;
  },

  /**
   * Create a position range
   * @param {Object} start - Start position
   * @param {Object} end - End position
   * @returns {Object} Range object {start, end}
   */
  createRange(start, end) {
    return {
      start: { ...start },
      end: { ...end },
      isEmpty: this.comparePositions(start, end) === 0
    };
  }
};
