/**
 * @fileoverview File operation commands for Symphony editor
 */

import { BaseCommand } from '@symphony/commands';

/**
 * Command for creating a new file
 */
export class FileCreateCommand extends BaseCommand {
  constructor(fileManager, fileName, content = '') {
    super('file.create', `Create file "${fileName}"`, 'editor');
    this.fileManager = fileManager;
    this.fileName = fileName;
    this.content = content;
  }

  async execute() {
    await this.fileManager.createFile(this.fileName, this.content);
  }

  async undo() {
    await this.fileManager.deleteFile(this.fileName);
  }

  getSerializableData() {
    return {
      ...super.getSerializableData(),
      fileName: this.fileName,
      content: this.content
    };
  }

  isValid() {
    return super.isValid() && this.fileManager && this.fileName;
  }
}

/**
 * Command for deleting a file
 */
export class FileDeleteCommand extends BaseCommand {
  constructor(fileManager, fileName, fileContent) {
    super('file.delete', `Delete file "${fileName}"`, 'editor');
    this.fileManager = fileManager;
    this.fileName = fileName;
    this.fileContent = fileContent;
  }

  async execute() {
    await this.fileManager.deleteFile(this.fileName);
  }

  async undo() {
    await this.fileManager.createFile(this.fileName, this.fileContent);
  }

  getSerializableData() {
    return {
      ...super.getSerializableData(),
      fileName: this.fileName,
      fileContent: this.fileContent
    };
  }

  isValid() {
    return super.isValid() && this.fileManager && this.fileName;
  }
}

/**
 * Command for renaming a file
 */
export class FileRenameCommand extends BaseCommand {
  constructor(fileManager, oldName, newName, editorStateManager) {
    super('file.rename', `Rename "${oldName}" to "${newName}"`, 'editor');
    this.fileManager = fileManager;
    this.oldName = oldName;
    this.newName = newName;
    this.editorStateManager = editorStateManager;
  }

  async execute() {
    await this.fileManager.renameFile(this.oldName, this.newName);
    
    // Update editor state if this file is currently active or in tabs
    if (this.editorStateManager) {
      this.editorStateManager.updateFileRename(this.oldName, this.newName);
    }
  }

  async undo() {
    await this.fileManager.renameFile(this.newName, this.oldName);
    
    // Update editor state back to original name
    if (this.editorStateManager) {
      this.editorStateManager.updateFileRename(this.newName, this.oldName);
    }
  }

  getSerializableData() {
    return {
      ...super.getSerializableData(),
      oldName: this.oldName,
      newName: this.newName
    };
  }

  isValid() {
    return super.isValid() && this.fileManager && this.oldName && this.newName;
  }
}

/**
 * Command for updating file content
 */
export class FileContentUpdateCommand extends BaseCommand {
  constructor(fileManager, fileName, newContent, oldContent) {
    super('file.update', `Update file "${fileName}"`, 'editor');
    this.fileManager = fileManager;
    this.fileName = fileName;
    this.newContent = newContent;
    this.oldContent = oldContent;
  }

  async execute() {
    await this.fileManager.updateFileContent(this.fileName, this.newContent);
  }

  async undo() {
    await this.fileManager.updateFileContent(this.fileName, this.oldContent);
  }

  mergeableWith(command) {
    if (command.id !== 'file.update') return false;
    
    // Only merge if it's the same file and within time window
    return this.fileName === command.fileName &&
           (command.timestamp - this.timestamp) < 2000; // 2 second window
  }

  mergeWith(command) {
    if (!this.mergeableWith(command)) {
      throw new Error('Commands cannot be merged');
    }

    // Create new merged command with the latest content
    const merged = new FileContentUpdateCommand(
      this.fileManager,
      this.fileName,
      command.newContent, // Use the latest new content
      this.oldContent     // Keep the original old content
    );
    
    merged.timestamp = Math.max(this.timestamp, command.timestamp);
    merged.description = `Update file "${this.fileName}"`;
    
    return merged;
  }

  getSerializableData() {
    return {
      ...super.getSerializableData(),
      fileName: this.fileName,
      newContent: this.newContent,
      oldContent: this.oldContent
    };
  }

  isValid() {
    return super.isValid() && 
           this.fileManager && 
           this.fileName && 
           typeof this.newContent === 'string' &&
           typeof this.oldContent === 'string';
  }
}
