// useCommandExecution.js - Hook for command execution and history management

import { useRef, useCallback } from 'react';

/**
 * Built-in command definitions
 */
const DEFAULT_COMMANDS = {
  help: () => 'Available commands: help, clear, echo, date, history',
  clear: (terminal) => {
    terminal?.clear();
    return '__CLEAR__'; // Special marker
  },
  echo: (_, args) => args.join(' '),
  date: () => new Date().toString(),
  history: (_, __, context) => {
    const history = context.getHistory();
    return history.length > 0 
      ? history.map((cmd, i) => `${i + 1}  ${cmd}`).join('\n')
      : 'No command history';
  }
};

/**
 * Hook for managing command execution and history
 * @param {Object} options - Configuration options
 * @param {Object} options.customCommands - Custom command definitions
 * @param {number} options.maxHistorySize - Maximum history size
 * @param {boolean} options.enableAutocomplete - Enable tab autocomplete
 * @returns {Object} Command execution API
 */
export function useCommandExecution({
  customCommands = {},
  maxHistorySize = 100,
  enableAutocomplete = true
} = {}) {
  const history = useRef([]);
  const historyIndex = useRef(-1);
  const commands = useRef({ ...DEFAULT_COMMANDS, ...customCommands });

  // Execute a command
  const executeCommand = useCallback((commandString, terminal) => {
    const trimmedCommand = commandString.trim();
    
    if (!trimmedCommand) {
      return { success: true, output: '', shouldClear: false };
    }

    const parts = trimmedCommand.split(' ');
    const commandName = parts[0];
    const args = parts.slice(1);

    // Check if command exists
    if (commands.current[commandName]) {
      try {
        const context = {
          getHistory: () => history.current,
          getCommands: () => Object.keys(commands.current)
        };
        
        const result = commands.current[commandName](terminal, args, context);
        
        // Handle special clear marker
        if (result === '__CLEAR__') {
          return { success: true, output: '', shouldClear: true };
        }
        
        return { 
          success: true, 
          output: result || '', 
          shouldClear: false 
        };
      } catch (error) {
        return { 
          success: false, 
          output: `Error executing command: ${error.message}`, 
          shouldClear: false 
        };
      }
    } else {
      return { 
        success: false, 
        output: `Command not found: ${commandName}`, 
        shouldClear: false 
      };
    }
  }, []);

  // Add command to history
  const addToHistory = useCallback((command) => {
    const trimmedCommand = command.trim();
    if (!trimmedCommand) return;

    // Avoid duplicate consecutive entries
    if (history.current[history.current.length - 1] !== trimmedCommand) {
      history.current.push(trimmedCommand);
      
      // Limit history size
      if (history.current.length > maxHistorySize) {
        history.current.shift();
      }
    }
    
    historyIndex.current = history.current.length;
  }, [maxHistorySize]);

  // Get command from history
  const getHistoryCommand = useCallback((direction) => {
    if (direction === 'up' && historyIndex.current > 0) {
      historyIndex.current--;
      return history.current[historyIndex.current] || '';
    } else if (direction === 'down') {
      if (historyIndex.current < history.current.length - 1) {
        historyIndex.current++;
        return history.current[historyIndex.current] || '';
      } else {
        historyIndex.current = history.current.length;
        return '';
      }
    }
    return null;
  }, []);

  // Get autocomplete suggestion
  const getAutocompleteSuggestion = useCallback((buffer) => {
    if (!enableAutocomplete || !buffer) return null;
    
    const matches = Object.keys(commands.current).filter(cmd => 
      cmd.startsWith(buffer.toLowerCase())
    );
    
    return matches.length === 1 ? matches[0] : null;
  }, [enableAutocomplete]);

  // Register custom command
  const registerCommand = useCallback((name, handler) => {
    commands.current[name] = handler;
  }, []);

  // Unregister command
  const unregisterCommand = useCallback((name) => {
    delete commands.current[name];
  }, []);

  // Get all available commands
  const getAvailableCommands = useCallback(() => {
    return Object.keys(commands.current);
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    history.current = [];
    historyIndex.current = -1;
  }, []);

  // Get history
  const getHistory = useCallback(() => {
    return [...history.current];
  }, []);

  // Handle complete command execution with terminal output
  const handleCommand = useCallback((commandString, terminal, prompt = '> ') => {
    const trimmedCommand = commandString.trim();
    
    if (!trimmedCommand) {
      terminal?.writeln('');
      terminal?.write(prompt);
      return;
    }

    // Special handling for clear command
    if (trimmedCommand === 'clear') {
      terminal?.write('\x1b[2K\r');
      const result = executeCommand(trimmedCommand, terminal);
      addToHistory(trimmedCommand);
      return;
    }

    // For other commands, move to new line then execute
    terminal?.write('\r\n');
    const result = executeCommand(trimmedCommand, terminal);
    
    if (result.output) {
      terminal?.writeln(result.output);
    }
    
    terminal?.write(prompt);
    addToHistory(trimmedCommand);
  }, [executeCommand, addToHistory]);

  return {
    executeCommand,
    handleCommand,
    addToHistory,
    getHistoryCommand,
    getAutocompleteSuggestion,
    registerCommand,
    unregisterCommand,
    getAvailableCommands,
    clearHistory,
    getHistory,
    historySize: history.current.length
  };
}
