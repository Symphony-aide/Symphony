/**
 * @fileoverview React context and hooks for Symphony's global command system
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { CommandManager } from './core/CommandManager.js';

/**
 * @typedef {Object} CommandContextType
 * @property {function(import('./types/Command.js').Command): Promise<void>} executeCommand - Execute a command
 * @property {function(): Promise<boolean>} undo - Undo last command
 * @property {function(): Promise<boolean>} redo - Redo last undone command
 * @property {boolean} canUndo - Whether undo is available
 * @property {boolean} canRedo - Whether redo is available
 * @property {string|null} undoDescription - Description of command to undo
 * @property {string|null} redoDescription - Description of command to redo
 * @property {number} undoStackSize - Number of commands in undo stack
 * @property {number} redoStackSize - Number of commands in redo stack
 * @property {CommandManager} commandManager - Direct access to command manager
 */

const CommandContext = createContext(null);

/**
 * CommandProvider provides global command system access to all child components
 * Should be placed at the root of your application
 */
export function CommandProvider({ children, options = {} }) {
  const commandManagerRef = useRef(null);
  
  // Initialize command manager once
  if (!commandManagerRef.current) {
    commandManagerRef.current = new CommandManager(options);
    
    // Set up persistence with storage service if available
    if (typeof window !== 'undefined') {
      // Try to set up persistence after a brief delay to allow other modules to load
      setTimeout(async () => {
        try {
          // Try to access the storage service from the global scope or import it
          if (window.symphonyStorageService) {
            commandManagerRef.current.setupPersistence(window.symphonyStorageService);
          }
        } catch (error) {
          console.debug('Storage service not available for command persistence:', error);
        }
      }, 100);
    }
  }
  
  const commandManager = commandManagerRef.current;

  // Stack state for UI components
  const [stackState, setStackState] = useState(() => commandManager.getStackState());

  // Update stack state when commands are executed/undone/redone
  useEffect(() => {
    const updateStackState = () => {
      setStackState(commandManager.getStackState());
    };

    commandManager.addListener(updateStackState);

    return () => {
      commandManager.removeListener(updateStackState);
    };
  }, [commandManager]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (commandManagerRef.current) {
        commandManagerRef.current.destroy();
        commandManagerRef.current = null;
      }
    };
  }, []);

  const contextValue = {
    executeCommand: commandManager.executeCommand,
    undo: commandManager.undo,
    redo: commandManager.redo,
    canUndo: stackState.canUndo,
    canRedo: stackState.canRedo,
    undoDescription: stackState.undoDescription,
    redoDescription: stackState.redoDescription,
    undoStackSize: stackState.undoStackSize,
    redoStackSize: stackState.redoStackSize,
    commandManager: commandManager
  };

  return (
    <CommandContext.Provider value={contextValue}>
      {children}
    </CommandContext.Provider>
  );
}

/**
 * Hook to access command execution functionality
 * @returns {Object} Command execution functions
 */
export function useCommand() {
  const context = useContext(CommandContext);
  
  if (!context) {
    throw new Error('useCommand must be used within a CommandProvider');
  }

  return {
    executeCommand: context.executeCommand,
    undo: context.undo,
    redo: context.redo,
    commandManager: context.commandManager
  };
}

/**
 * Hook to access command stack state for UI components
 * @returns {import('./types/Command.js').CommandStackState} Current stack state
 */
export function useCommandState() {
  const context = useContext(CommandContext);
  
  if (!context) {
    throw new Error('useCommandState must be used within a CommandProvider');
  }

  return {
    canUndo: context.canUndo,
    canRedo: context.canRedo,
    undoDescription: context.undoDescription,
    redoDescription: context.redoDescription,
    undoStackSize: context.undoStackSize,
    redoStackSize: context.redoStackSize
  };
}
