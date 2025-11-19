// useInputHandling.js - Hook for terminal input handling

import { useRef, useCallback } from 'react';

/**
 * Hook for managing terminal input, keyboard events, and buffer
 * @param {Object} options - Configuration options
 * @param {Object} options.terminal - Terminal instance
 * @param {Object} options.commandHandler - Command execution handler
 * @param {string} options.prompt - Command prompt string
 * @returns {Object} Input handling API
 */
export function useInputHandling({
  terminal = null,
  commandHandler = null,
  prompt = '> '
} = {}) {
  const buffer = useRef('');

  // Replace current line with new content
  const replaceLine = useCallback((newBuffer) => {
    if (!terminal) return;
    // Clear current line and print prompt with new content
    terminal.write('\x1b[2K\r' + prompt + newBuffer);
  }, [terminal, prompt]);

  // Clear current buffer
  const clearBuffer = useCallback(() => {
    buffer.current = '';
  }, []);

  // Get current buffer
  const getBuffer = useCallback(() => {
    return buffer.current;
  }, []);

  // Set buffer content
  const setBuffer = useCallback((content) => {
    buffer.current = content;
  }, []);

  // Handle backspace
  const handleBackspace = useCallback(() => {
    if (!terminal || buffer.current.length === 0) return;
    
    buffer.current = buffer.current.slice(0, -1);
    terminal.write('\b \b');
  }, [terminal]);

  // Handle tab (autocomplete)
  const handleTab = useCallback(() => {
    if (!terminal || !commandHandler?.getAutocompleteSuggestion) return;
    
    const suggestion = commandHandler.getAutocompleteSuggestion(buffer.current);
    if (suggestion) {
      const completion = suggestion.slice(buffer.current.length);
      terminal.write(completion);
      buffer.current = suggestion;
    }
  }, [terminal, commandHandler]);

  // Handle enter (execute command)
  const handleEnter = useCallback(() => {
    if (!terminal || !commandHandler?.handleCommand) return;
    
    const command = buffer.current.trim();
    commandHandler.handleCommand(command, terminal, prompt);
    buffer.current = '';
  }, [terminal, commandHandler, prompt]);

  // Handle arrow up (history back)
  const handleArrowUp = useCallback(() => {
    if (!terminal || !commandHandler?.getHistoryCommand) return;
    
    const historyCommand = commandHandler.getHistoryCommand('up');
    if (historyCommand !== null) {
      buffer.current = historyCommand;
      replaceLine(buffer.current);
    }
  }, [terminal, commandHandler, replaceLine]);

  // Handle arrow down (history forward)
  const handleArrowDown = useCallback(() => {
    if (!terminal || !commandHandler?.getHistoryCommand) return;
    
    const historyCommand = commandHandler.getHistoryCommand('down');
    if (historyCommand !== null) {
      buffer.current = historyCommand;
      replaceLine(buffer.current);
    }
  }, [terminal, commandHandler, replaceLine]);

  // Handle regular character input
  const handleCharacter = useCallback((char) => {
    if (!terminal) return;
    
    buffer.current += char;
    terminal.write(char);
  }, [terminal]);

  // Main data handler for terminal input
  const handleData = useCallback((data) => {
    if (!terminal) return;
    
    const code = data.charCodeAt(0);

    // Enter key
    if (code === 13) {
      handleEnter();
    }
    // Backspace
    else if (code === 127) {
      handleBackspace();
    }
    // Tab
    else if (code === 9) {
      handleTab();
    }
    // Escape sequences (arrow keys)
    else if (code === 27) {
      if (data === '\x1b[A') {
        // Up arrow
        handleArrowUp();
      } else if (data === '\x1b[B') {
        // Down arrow
        handleArrowDown();
      } else if (data === '\x1b[C') {
        // Right arrow - ignore for now
      } else if (data === '\x1b[D') {
        // Left arrow - ignore for now
      }
    }
    // Regular text
    else if (code >= 32 && code <= 126) {
      handleCharacter(data);
    }
  }, [
    terminal,
    handleEnter,
    handleBackspace,
    handleTab,
    handleArrowUp,
    handleArrowDown,
    handleCharacter
  ]);

  // Handle paste event
  const handlePaste = useCallback((text) => {
    if (!terminal) return;
    
    buffer.current += text;
    terminal.write(text);
  }, [terminal]);

  // Clear input line
  const clearLine = useCallback(() => {
    if (!terminal) return;
    
    terminal.write('\x1b[2K\r' + prompt);
    buffer.current = '';
  }, [terminal, prompt]);

  return {
    handleData,
    handleBackspace,
    handleTab,
    handleEnter,
    handleArrowUp,
    handleArrowDown,
    handleCharacter,
    handlePaste,
    clearLine,
    clearBuffer,
    getBuffer,
    setBuffer,
    replaceLine,
    bufferLength: buffer.current.length
  };
}
