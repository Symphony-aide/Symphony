/**
 * @fileoverview DirectRenderer - Performance escape hatch for direct rendering
 * @module @symphony/primitives/renderers/DirectRenderer
 * 
 * This renderer bypasses the primitive system for maximum performance,
 * rendering components directly without primitive wrapper overhead.
 * 
 * Supports:
 * - MonacoEditor: High-performance code editor (Monaco Editor)
 * - XTermTerminal: High-performance terminal emulator (xterm.js)
 * 
 * @see Requirements 9.1, 9.2, 9.3, 9.4
 */

import React, { useRef, useEffect } from 'react';
import { BasePrimitive } from '../core/BasePrimitive.js';

/**
 * Map of direct render types to their implementations.
 * @type {Map<string, React.ComponentType<any>>}
 */
const directRenderMap = new Map();

/**
 * @typedef {Object} ThemeConfig
 * @property {string} background
 * @property {string} foreground
 * @property {string} cursor
 * @property {string} cursorAccent
 * @property {string} selectionBackground
 */

/**
 * @type {Record<string, ThemeConfig>}
 */
const terminalThemes = {
  dark: {
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    cursor: '#d4d4d4',
    cursorAccent: '#1e1e1e',
    selectionBackground: '#264f78',
  },
  light: {
    background: '#ffffff',
    foreground: '#333333',
    cursor: '#333333',
    cursorAccent: '#ffffff',
    selectionBackground: '#add6ff',
  },
};

/**
 * Registers a direct render component for a type.
 * 
 * @param {string} type - The direct render type name
 * @param {React.ComponentType<any>} component - The component to render
 */
export function registerDirectRenderer(type, component) {
  directRenderMap.set(type, component);
}

/**
 * Unregisters a direct render component.
 * 
 * @param {string} type - The type to unregister
 * @returns {boolean} True if found and removed
 */
export function unregisterDirectRenderer(type) {
  return directRenderMap.delete(type);
}

/**
 * Gets a registered direct renderer.
 * 
 * @param {string} type - The type name
 * @returns {React.ComponentType<any> | undefined} The component or undefined
 */
export function getDirectRenderer(type) {
  return directRenderMap.get(type);
}

/**
 * Gets all registered direct renderer types.
 * 
 * @returns {string[]} Array of registered type names
 */
export function getRegisteredDirectTypes() {
  return Array.from(directRenderMap.keys());
}

/**
 * Monaco Editor props for direct rendering.
 * @typedef {Object} MonacoEditorDirectProps
 * @property {string} [language='plaintext'] - Programming language for syntax highlighting
 * @property {string} [value=''] - Editor content
 * @property {function(string): void} [onChange] - Callback when content changes
 * @property {string} [theme='vs-dark'] - Editor theme
 * @property {number} [fontSize=14] - Font size in pixels
 * @property {boolean} [lineNumbers=true] - Whether to show line numbers
 * @property {boolean} [minimap=true] - Whether to show minimap
 * @property {boolean} [readOnly=false] - Whether the editor is read-only
 * @property {string} [className] - CSS class name
 * @property {number} [width] - Editor width
 * @property {number} [height] - Editor height
 */

/**
 * MonacoEditorDirect - Direct Monaco Editor component without primitive overhead.
 * 
 * Renders the Monaco Editor directly for maximum performance.
 * This component bypasses the primitive system entirely.
 * 
 * @param {MonacoEditorDirectProps} props - Component props
 * @returns {React.ReactElement} The Monaco Editor element
 * 
 * @see Requirements 9.2
 */
export function MonacoEditorDirect({
  language = 'plaintext',
  value = '',
  onChange,
  theme = 'vs-dark',
  fontSize = 14,
  lineNumbers = true,
  minimap = true,
  readOnly = false,
  className = '',
  width = '100%',
  height = '100%',
}) {
  /** @type {React.RefObject<HTMLDivElement>} */
  const containerRef = useRef(null);
  /** @type {React.MutableRefObject<any>} */
  const editorRef = useRef(null);
  /** @type {React.MutableRefObject<any>} */
  const monacoRef = useRef(null);

  // Initialize Monaco Editor
  useEffect(() => {
    let disposed = false;

    const initMonaco = async () => {
      try {
        // Dynamically import Monaco to avoid bundling issues
        const monaco = await import('monaco-editor');
        
        if (disposed || !containerRef.current) return;
        
        monacoRef.current = monaco;
        
        // Create editor instance
        editorRef.current = monaco.editor.create(containerRef.current, {
          value,
          language,
          theme,
          fontSize,
          lineNumbers: lineNumbers ? 'on' : 'off',
          minimap: { enabled: minimap },
          readOnly,
          automaticLayout: true,
          scrollBeyondLastLine: false,
          wordWrap: 'on',
        });

        // Set up change listener
        if (onChange) {
          editorRef.current.onDidChangeModelContent(() => {
            const newValue = editorRef.current?.getValue() || '';
            onChange(newValue);
          });
        }
      } catch (error) {
        console.warn('MonacoEditorDirect: Failed to load Monaco Editor', error);
      }
    };

    initMonaco();

    return () => {
      disposed = true;
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
  }, []); // Only run once on mount

  // Update editor options when props change
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        fontSize,
        lineNumbers: lineNumbers ? 'on' : 'off',
        minimap: { enabled: minimap },
        readOnly,
      });
    }
  }, [fontSize, lineNumbers, minimap, readOnly]);

  // Update theme
  useEffect(() => {
    if (monacoRef.current && editorRef.current) {
      monacoRef.current.editor.setTheme(theme);
    }
  }, [theme]);

  // Update language
  useEffect(() => {
    if (monacoRef.current && editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monacoRef.current.editor.setModelLanguage(model, language);
      }
    }
  }, [language]);

  // Update value (only if different from current)
  useEffect(() => {
    if (editorRef.current) {
      const currentValue = editorRef.current.getValue();
      if (currentValue !== value) {
        editorRef.current.setValue(value);
      }
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width, height }}
      data-testid="monaco-editor-direct"
    />
  );
}

/**
 * XTerm Terminal props for direct rendering.
 * @typedef {Object} XTermTerminalDirectProps
 * @property {string} [shellId] - Shell session identifier
 * @property {string} [theme='dark'] - Terminal theme
 * @property {number} [fontSize=14] - Font size in pixels
 * @property {'block' | 'underline' | 'bar'} [cursorStyle='block'] - Cursor style
 * @property {function(string): void} [onCommand] - Callback when command is executed
 * @property {function(string): void} [onData] - Callback when data is received
 * @property {string} [className] - CSS class name
 * @property {number} [rows=24] - Number of rows
 * @property {number} [cols=80] - Number of columns
 */

/**
 * XTermTerminalDirect - Direct xterm.js component without primitive overhead.
 * 
 * Renders the xterm.js terminal directly for maximum performance.
 * This component bypasses the primitive system entirely.
 * 
 * @param {XTermTerminalDirectProps} props - Component props
 * @returns {React.ReactElement} The xterm.js terminal element
 * 
 * @see Requirements 9.3
 */
export function XTermTerminalDirect({
  shellId,
  theme = 'dark',
  fontSize = 14,
  cursorStyle = 'block',
  onCommand,
  onData,
  className = '',
  rows = 24,
  cols = 80,
}) {
  /** @type {React.RefObject<HTMLDivElement>} */
  const containerRef = useRef(null);
  /** @type {React.MutableRefObject<any>} */
  const terminalRef = useRef(null);
  /** @type {React.MutableRefObject<any>} */
  const fitAddonRef = useRef(null);

  // Initialize xterm.js
  useEffect(() => {
    let disposed = false;

    const initTerminal = async () => {
      try {
        // Dynamically import xterm to avoid bundling issues
        const { Terminal } = await import('@xterm/xterm');
        const { FitAddon } = await import('@xterm/addon-fit');
        
        if (disposed || !containerRef.current) return;

        const themeConfig = terminalThemes[theme] || terminalThemes.dark;

        // Create terminal instance
        terminalRef.current = new Terminal({
          fontSize,
          cursorStyle,
          cursorBlink: true,
          rows,
          cols,
          theme: themeConfig,
          allowTransparency: true,
          fontFamily: "Consolas, 'Courier New', monospace",
        });

        // Create and load fit addon
        fitAddonRef.current = new FitAddon();
        terminalRef.current.loadAddon(fitAddonRef.current);

        // Open terminal in container
        terminalRef.current.open(containerRef.current);
        
        // Fit terminal to container
        fitAddonRef.current.fit();

        // Set up data handler
        if (onData) {
          terminalRef.current.onData((/** @type {string} */ data) => {
            onData(data);
          });
        }

        // Set up command handler (on Enter key)
        let currentLine = '';
        terminalRef.current.onData((/** @type {string} */ data) => {
          if (data === '\r' || data === '\n') {
            if (onCommand && currentLine.trim()) {
              onCommand(currentLine.trim());
            }
            currentLine = '';
          } else if (data === '\x7f') {
            // Backspace
            currentLine = currentLine.slice(0, -1);
          } else {
            currentLine += data;
          }
        });

        // Write initial prompt
        terminalRef.current.write('$ ');

      } catch (error) {
        console.warn('XTermTerminalDirect: Failed to load xterm.js', error);
      }
    };

    initTerminal();

    return () => {
      disposed = true;
      if (terminalRef.current) {
        terminalRef.current.dispose();
        terminalRef.current = null;
      }
    };
  }, []); // Only run once on mount

  // Update font size
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.options.fontSize = fontSize;
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    }
  }, [fontSize]);

  // Update cursor style
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.options.cursorStyle = cursorStyle;
    }
  }, [cursorStyle]);

  // Update theme
  useEffect(() => {
    if (terminalRef.current) {
      const themeConfig = terminalThemes[theme] || terminalThemes.dark;
      terminalRef.current.options.theme = themeConfig;
    }
  }, [theme]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`${className} bg-black rounded-lg border border-gray-700 overflow-hidden`}
      style={{ minHeight: '200px' }}
      data-testid="xterm-terminal-direct"
      data-shell-id={shellId}
    />
  );
}

/**
 * Props for the DirectRenderer component.
 * @typedef {Object} DirectRendererProps
 * @property {BasePrimitive} primitive - The primitive to render directly
 */

/**
 * DirectRenderer component - Renders primitives directly without wrapper overhead.
 * 
 * Used for performance-critical components like Monaco Editor and xterm.js
 * that need direct DOM access without the primitive abstraction layer.
 * 
 * Supports built-in types:
 * - 'MonacoEditor': Renders MonacoEditorDirect component
 * - 'XTermTerminal': Renders XTermTerminalDirect component
 * 
 * Custom types can be registered using registerDirectRenderer().
 * 
 * @param {DirectRendererProps} props - Component props
 * @returns {React.ReactElement | null} The rendered component or null
 * 
 * @see Requirements 9.1, 9.2, 9.3, 9.4
 */
export function DirectRenderer({ primitive }) {
  if (!primitive || !(primitive instanceof BasePrimitive)) {
    console.warn('DirectRenderer: Invalid primitive provided');
    return null;
  }

  // Check for built-in direct render types first
  if (primitive.type === 'MonacoEditor') {
    return <MonacoEditorDirect {...primitive.props} />;
  }

  if (primitive.type === 'XTermTerminal') {
    return <XTermTerminalDirect {...primitive.props} />;
  }

  // Check for custom registered types
  const DirectComponent = directRenderMap.get(primitive.type);
  
  if (!DirectComponent) {
    // Requirement 9.4: Log warning for unknown types
    console.warn(`DirectRenderer: Unknown direct render type "${primitive.type}"`);
    return null;
  }

  return <DirectComponent {...primitive.props} />;
}

export default DirectRenderer;
