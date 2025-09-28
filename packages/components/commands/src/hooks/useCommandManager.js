/**
 * @fileoverview Hook for managing command system lifecycle and configuration
 */

import { useRef, useEffect, useState } from 'react';
import { CommandManager } from '../core/CommandManager.js';

/**
 * Hook for creating and managing a CommandManager instance
 * Handles initialization, configuration, and cleanup
 * @param {Object} options - CommandManager options
 * @returns {Object} Command manager and utilities
 */
export function useCommandManager(options = {}) {
  const managerRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize command manager once
  if (!managerRef.current) {
    managerRef.current = new CommandManager(options);
    setIsInitialized(true);
  }

  const manager = managerRef.current;

  // Update configuration when options change
  useEffect(() => {
    if (manager && options.processorOptions) {
      manager.configureProcessor(options.processorOptions);
    }
  }, [manager, options.processorOptions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (managerRef.current) {
        managerRef.current.destroy();
        managerRef.current = null;
        setIsInitialized(false);
      }
    };
  }, []);

  return {
    commandManager: manager,
    isInitialized,
    
    // Utility methods
    executeCommand: manager.executeCommand,
    undo: manager.undo,
    redo: manager.redo,
    clear: manager.clear.bind(manager),
    
    // State methods
    canUndo: manager.canUndo.bind(manager),
    canRedo: manager.canRedo.bind(manager),
    getStackState: manager.getStackState.bind(manager),
    
    // Configuration methods
    configureProcessor: manager.configureProcessor.bind(manager),
    registerProcessor: manager.registerProcessor.bind(manager),
    
    // Debug methods
    getStatistics: manager.getStatistics.bind(manager),
    getRecentCommands: manager.getRecentCommands.bind(manager)
  };
}
