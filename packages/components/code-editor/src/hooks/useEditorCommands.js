/**
 * @fileoverview Hook for managing editor operations through the command system
 */

import { useState, useEffect, useCallback } from "react";
import { useCommand } from "@symphony/commands";
import { storageService } from "../utils/storageService.js";
import { 
  FileCreateCommand, 
  FileDeleteCommand, 
  FileRenameCommand, 
  FileContentUpdateCommand 
} from "../commands/FileOperationCommands.js";

/**
 * Hook that replaces use-undo with the global command system
 * Provides file management operations through commands
 */
export function useEditorCommands() {
  const { executeCommand } = useCommand();
  
  // Initialize files from storage
  const [files, setFilesState] = useState(() => {
    const savedFiles = storageService.getSync("files");
    return savedFiles || [{ name: "untitled.txt", content: "" }];
  });

  // File manager interface for commands
  const fileManager = {
    async createFile(fileName, content = '') {
      setFilesState(prevFiles => {
        const newFiles = [...prevFiles, { name: fileName, content }];
        storageService.setSync("files", newFiles);
        return newFiles;
      });
    },

    async deleteFile(fileName) {
      setFilesState(prevFiles => {
        const newFiles = prevFiles.filter(f => f.name !== fileName);
        storageService.setSync("files", newFiles);
        return newFiles;
      });
    },

    async renameFile(oldName, newName) {
      setFilesState(prevFiles => {
        const newFiles = prevFiles.map(f => 
          f.name === oldName ? { ...f, name: newName } : f
        );
        storageService.setSync("files", newFiles);
        return newFiles;
      });
    },

    async updateFileContent(fileName, content) {
      setFilesState(prevFiles => {
        const newFiles = prevFiles.map(f => 
          f.name === fileName ? { ...f, content } : f
        );
        storageService.setSync("files", newFiles);
        return newFiles;
      });
    }
  };

  // Command-based file operations
  const createFile = useCallback(async (fileName, content = '') => {
    const command = new FileCreateCommand(fileManager, fileName, content);
    await executeCommand(command);
  }, [executeCommand]);

  const deleteFile = useCallback(async (fileName) => {
    const file = files.find(f => f.name === fileName);
    if (!file) return;
    
    const command = new FileDeleteCommand(fileManager, fileName, file.content);
    await executeCommand(command);
  }, [files, executeCommand]);

  const renameFile = useCallback(async (oldName, newName) => {
    const command = new FileRenameCommand(fileManager, oldName, newName);
    await executeCommand(command);
  }, [executeCommand]);

  const updateFileContent = useCallback(async (fileName, newContent) => {
    const file = files.find(f => f.name === fileName);
    if (!file || file.content === newContent) return;
    
    const command = new FileContentUpdateCommand(
      fileManager, 
      fileName, 
      newContent, 
      file.content
    );
    await executeCommand(command);
  }, [files, executeCommand]);

  // Batch file operations
  const setFiles = useCallback(async (newFiles) => {
    // For compatibility with existing code, we'll create individual commands
    // In practice, you might want to create a compound command for this
    const currentFiles = files;
    
    // Simple implementation: just update the state directly for now
    // In a full implementation, you'd analyze the differences and create appropriate commands
    setFilesState(newFiles);
    storageService.setSync("files", newFiles);
  }, [files]);

  // Persist files to storage when they change
  useEffect(() => {
    storageService.setSync("files", files);
  }, [files]);

  return {
    files,
    setFiles, // Keep for compatibility
    
    // Command-based operations
    createFile,
    deleteFile,
    renameFile,
    updateFileContent,
    
    // File manager for direct access if needed
    fileManager
  };
}
