/**
 * @fileoverview Heavy WASM primitive factory functions
 * @module @symphony/primitives/primitives/heavy
 *
 * These primitives are designed for performance-critical components that
 * benefit from WASM rendering for near-native performance.
 */

import { BasePrimitive } from '../core/BasePrimitive.js';

/**
 * @typedef {import('../core/types.js').CursorStyle} CursorStyle
 */

/**
 * File node for FileTree
 * @typedef {Object} FileNode
 * @property {string} path - File path
 * @property {string} name - File name
 * @property {'file' | 'directory'} type - Node type
 * @property {FileNode[]} [children] - Child nodes for directories
 */

/**
 * CodeEditor props
 * @typedef {Object} CodeEditorProps
 * @property {string} [language='plaintext'] - Programming language for syntax highlighting
 * @property {string} [value=''] - Editor content
 * @property {string} [onChange] - Handler ID for content change events
 * @property {string} [theme='vs-dark'] - Editor theme
 * @property {number} [fontSize=14] - Font size in pixels
 * @property {boolean} [lineNumbers=true] - Whether to show line numbers
 * @property {boolean} [minimap=true] - Whether to show minimap
 * @property {boolean} [readOnly=false] - Whether the editor is read-only
 * @property {string} [className] - CSS class name
 */

/**
 * Creates a CodeEditor primitive for high-performance code editing.
 * Uses WASM rendering strategy for near-native performance.
 *
 * @param {CodeEditorProps} [props={}] - CodeEditor properties
 * @returns {BasePrimitive} CodeEditor primitive instance
 *
 * @example
 * const editor = CodeEditor({
 *   language: 'typescript',
 *   value: 'const x = 1;',
 *   onChange: 'editor_change_handler',
 *   theme: 'vs-dark',
 *   fontSize: 14,
 *   lineNumbers: true,
 *   minimap: false
 * });
 */
export function CodeEditor(props = {}) {
  const defaultProps = {
    language: 'plaintext',
    value: '',
    theme: 'vs-dark',
    fontSize: 14,
    lineNumbers: true,
    minimap: true,
    readOnly: false,
    ...props,
  };
  const primitive = new BasePrimitive('CodeEditor', defaultProps);
  primitive.renderStrategy = 'wasm';
  primitive.wasmModule = 'code-editor.wasm';
  return primitive;
}


/**
 * Terminal props
 * @typedef {Object} TerminalProps
 * @property {string} [shellId] - Shell session identifier
 * @property {string} [theme='dark'] - Terminal theme
 * @property {number} [fontSize=14] - Font size in pixels
 * @property {CursorStyle} [cursorStyle='block'] - Cursor style
 * @property {string} [onCommand] - Handler ID for command execution events
 * @property {string} [className] - CSS class name
 */

/**
 * Creates a Terminal primitive for high-performance terminal emulation.
 * Uses WASM rendering strategy for near-native performance.
 *
 * @param {TerminalProps} [props={}] - Terminal properties
 * @returns {BasePrimitive} Terminal primitive instance
 *
 * @example
 * const terminal = Terminal({
 *   shellId: 'shell-1',
 *   theme: 'dark',
 *   fontSize: 14,
 *   cursorStyle: 'block',
 *   onCommand: 'terminal_command_handler'
 * });
 */
export function Terminal(props = {}) {
  const defaultProps = {
    theme: 'dark',
    fontSize: 14,
    cursorStyle: 'block',
    ...props,
  };
  const primitive = new BasePrimitive('Terminal', defaultProps);
  primitive.renderStrategy = 'wasm';
  primitive.wasmModule = 'terminal.wasm';
  return primitive;
}

/**
 * SyntaxHighlighter props
 * @typedef {Object} SyntaxHighlighterProps
 * @property {string} [code=''] - Code to highlight
 * @property {string} [language='plaintext'] - Programming language
 * @property {string} [theme='vs-dark'] - Highlighting theme
 * @property {boolean} [showLineNumbers=false] - Whether to show line numbers
 * @property {string} [className] - CSS class name
 */

/**
 * Creates a SyntaxHighlighter primitive for high-performance syntax highlighting.
 * Uses WASM rendering strategy for near-native performance.
 * Marked as a leaf node (cannot have children).
 *
 * @param {SyntaxHighlighterProps} [props={}] - SyntaxHighlighter properties
 * @returns {BasePrimitive} SyntaxHighlighter primitive instance
 *
 * @example
 * const highlighter = SyntaxHighlighter({
 *   code: 'const x = 1;',
 *   language: 'javascript',
 *   theme: 'monokai',
 *   showLineNumbers: true
 * });
 */
export function SyntaxHighlighter(props = {}) {
  const defaultProps = {
    code: '',
    language: 'plaintext',
    theme: 'vs-dark',
    showLineNumbers: false,
    ...props,
  };
  const primitive = new BasePrimitive('SyntaxHighlighter', defaultProps);
  primitive.renderStrategy = 'wasm';
  primitive.wasmModule = 'syntax-highlighter.wasm';
  primitive.isLeafNode = true;
  return primitive;
}

/**
 * FileTree props
 * @typedef {Object} FileTreeProps
 * @property {FileNode[]} [files=[]] - Array of file/directory nodes
 * @property {string} [onFileSelect] - Handler ID for file selection events
 * @property {boolean} [virtualized=false] - Whether to use virtualized rendering
 * @property {string[]} [expandedPaths=[]] - Array of expanded directory paths
 * @property {string} [className] - CSS class name
 */

/**
 * Creates a FileTree primitive for high-performance file tree display.
 * Uses WASM rendering strategy for near-native performance.
 *
 * @param {FileTreeProps} [props={}] - FileTree properties
 * @returns {BasePrimitive} FileTree primitive instance
 *
 * @example
 * const fileTree = FileTree({
 *   files: [
 *     { path: '/src', name: 'src', type: 'directory', children: [
 *       { path: '/src/index.js', name: 'index.js', type: 'file' }
 *     ]}
 *   ],
 *   onFileSelect: 'file_select_handler',
 *   virtualized: true,
 *   expandedPaths: ['/src']
 * });
 */
export function FileTree(props = {}) {
  const defaultProps = {
    files: [],
    virtualized: false,
    expandedPaths: [],
    ...props,
  };
  const primitive = new BasePrimitive('FileTree', defaultProps);
  primitive.renderStrategy = 'wasm';
  primitive.wasmModule = 'file-tree.wasm';
  return primitive;
}
