// useTerminalSession.js - Hook for terminal session management

import { useEffect, useRef, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

/**
 * Hook for managing terminal sessions with xterm.js
 * @param {Object} options - Configuration options
 * @param {Object} options.settings - Terminal settings (font, cursor, theme)
 * @param {string} options.welcomeMessage - Welcome message to display
 * @param {string} options.prompt - Command prompt string
 * @returns {Object} Terminal session API
 */
export function useTerminalSession({
  settings = {},
  welcomeMessage = 'Welcome to Terminal 🚀',
  prompt = '> '
} = {}) {
  const terminalRef = useRef(null);
  const terminalInstance = useRef(null);
  const fitAddonInstance = useRef(null);

  // Default settings
  const defaultSettings = {
    fontFamily: 'Consolas, Monaco, monospace',
    fontSize: 14,
    fontWeight: 'normal',
    lineHeight: 1.2,
    cursorStyle: 'block',
    theme: {
      background: '#1e1e1e',
      foreground: '#ffffff',
      cursor: '#ffffff',
      selection: 'rgba(255, 255, 255, 0.3)'
    },
    scrollback: 1000,
    cursorBlink: true
  };

  const mergedSettings = { ...defaultSettings, ...settings };

  // Initialize terminal instance
  const initializeTerminal = useCallback(() => {
    if (!terminalRef.current || terminalInstance.current) return;

    const term = new Terminal({
      cursorBlink: mergedSettings.cursorBlink,
      fontFamily: mergedSettings.fontFamily,
      fontSize: mergedSettings.fontSize,
      fontWeight: mergedSettings.fontWeight,
      lineHeight: mergedSettings.lineHeight,
      cursorStyle: mergedSettings.cursorStyle,
      theme: mergedSettings.theme,
      scrollback: mergedSettings.scrollback,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    
    // Fit terminal to container
    setTimeout(() => fitAddon.fit(), 50);

    // Display welcome message and prompt
    if (welcomeMessage) {
      term.writeln(welcomeMessage);
    }
    if (prompt) {
      term.write(prompt);
    }

    terminalInstance.current = term;
    fitAddonInstance.current = fitAddon;

    return term;
  }, [mergedSettings, welcomeMessage, prompt]);

  // Update terminal settings
  const updateSettings = useCallback((newSettings) => {
    if (!terminalInstance.current) return;

    const term = terminalInstance.current;
    
    if (newSettings.fontFamily !== undefined) {
      term.options.fontFamily = newSettings.fontFamily;
    }
    if (newSettings.fontSize !== undefined) {
      term.options.fontSize = newSettings.fontSize;
    }
    if (newSettings.fontWeight !== undefined) {
      term.options.fontWeight = newSettings.fontWeight;
    }
    if (newSettings.lineHeight !== undefined) {
      term.options.lineHeight = newSettings.lineHeight;
    }
    if (newSettings.cursorStyle !== undefined) {
      term.options.cursorStyle = newSettings.cursorStyle;
    }
    if (newSettings.theme !== undefined) {
      term.options.theme = newSettings.theme;
    }

    // Refit after settings change
    fitAddonInstance.current?.fit();
  }, []);

  // Fit terminal to container
  const fit = useCallback(() => {
    fitAddonInstance.current?.fit();
  }, []);

  // Write text to terminal
  const write = useCallback((text) => {
    terminalInstance.current?.write(text);
  }, []);

  // Write line to terminal
  const writeln = useCallback((text) => {
    terminalInstance.current?.writeln(text);
  }, []);

  // Clear terminal
  const clear = useCallback(() => {
    terminalInstance.current?.clear();
    if (welcomeMessage) {
      terminalInstance.current?.writeln(welcomeMessage);
    }
    if (prompt) {
      terminalInstance.current?.write(prompt);
    }
  }, [welcomeMessage, prompt]);

  // Reset terminal
  const reset = useCallback(() => {
    terminalInstance.current?.reset();
    if (welcomeMessage) {
      terminalInstance.current?.writeln(welcomeMessage);
    }
    if (prompt) {
      terminalInstance.current?.write(prompt);
    }
  }, [welcomeMessage, prompt]);

  // Dispose terminal
  const dispose = useCallback(() => {
    terminalInstance.current?.dispose();
    terminalInstance.current = null;
    fitAddonInstance.current = null;
  }, []);

  // Get terminal dimensions
  const getDimensions = useCallback(() => {
    if (!terminalInstance.current) return { cols: 0, rows: 0 };
    return {
      cols: terminalInstance.current.cols,
      rows: terminalInstance.current.rows
    };
  }, []);

  // Register data handler
  const onData = useCallback((handler) => {
    if (!terminalInstance.current) return () => {};
    return terminalInstance.current.onData(handler);
  }, []);

  // Initialize terminal on mount
  useEffect(() => {
    initializeTerminal();

    // Handle window resize
    const handleResize = () => {
      fitAddonInstance.current?.fit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      dispose();
    };
  }, [initializeTerminal, dispose]);

  // Update settings when they change
  useEffect(() => {
    updateSettings(settings);
  }, [settings, updateSettings]);

  return {
    terminalRef,
    terminal: terminalInstance.current,
    fitAddon: fitAddonInstance.current,
    write,
    writeln,
    clear,
    reset,
    fit,
    dispose,
    getDimensions,
    onData,
    updateSettings,
    isInitialized: terminalInstance.current !== null
  };
}
