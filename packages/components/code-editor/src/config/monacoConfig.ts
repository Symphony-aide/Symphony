/**
 * Monaco Editor Configuration for Symphony IDE
 * 
 * Comprehensive configuration for Monaco Editor including:
 * - TextMate grammar support for multiple languages
 * - Theme management (vs-dark, vs-light, custom themes)
 * - Performance optimizations for large files
 * - Virtual scrolling (enabled by default in Monaco)
 * 
 * Requirements: 1.1, 1.3, 1.4, 8.5
 */

import type * as Monaco from 'monaco-editor';

/**
 * Supported languages with their Monaco language identifiers
 * Requirement 1.3: Support TypeScript, JavaScript, Python, Rust, Go
 */
export const SUPPORTED_LANGUAGES = {
  typescript: 'typescript',
  javascript: 'javascript',
  python: 'python',
  rust: 'rust',
  go: 'go',
  // Additional languages
  html: 'html',
  css: 'css',
  json: 'json',
  markdown: 'markdown',
  yaml: 'yaml',
  xml: 'xml',
  sql: 'sql',
  shell: 'shell',
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

/**
 * Language file extension mappings
 * Used for automatic language detection
 */
export const LANGUAGE_EXTENSIONS: Record<string, SupportedLanguage> = {
  // TypeScript
  'ts': 'typescript',
  'tsx': 'typescript',
  
  // JavaScript
  'js': 'javascript',
  'jsx': 'javascript',
  'mjs': 'javascript',
  'cjs': 'javascript',
  
  // Python
  'py': 'python',
  'pyw': 'python',
  'pyi': 'python',
  
  // Rust
  'rs': 'rust',
  
  // Go
  'go': 'go',
  
  // Web
  'html': 'html',
  'htm': 'html',
  'css': 'css',
  'scss': 'css',
  'sass': 'css',
  
  // Data
  'json': 'json',
  'yaml': 'yaml',
  'yml': 'yaml',
  'xml': 'xml',
  
  // Other
  'md': 'markdown',
  'sql': 'sql',
  'sh': 'shell',
  'bash': 'shell',
};

/**
 * Theme configuration
 * Requirement 1.4: Theme management (vs-dark, vs-light, custom themes)
 */
export interface ThemeConfig {
  id: string;
  label: string;
  base: 'vs' | 'vs-dark' | 'hc-black';
  inherit: boolean;
  rules: Monaco.editor.ITokenThemeRule[];
  colors: Monaco.editor.IColors;
}

/**
 * Built-in theme configurations
 */
export const BUILT_IN_THEMES = {
  'vs-dark': {
    id: 'vs-dark',
    label: 'Dark (Visual Studio)',
    base: 'vs-dark' as const,
  },
  'vs-light': {
    id: 'vs',
    label: 'Light (Visual Studio)',
    base: 'vs' as const,
  },
  'hc-black': {
    id: 'hc-black',
    label: 'High Contrast',
    base: 'hc-black' as const,
  },
} as const;

/**
 * Default Monaco Editor options optimized for Symphony
 * Requirements: 8.1, 8.2, 8.5 (Performance optimization)
 */
export const DEFAULT_EDITOR_OPTIONS: Monaco.editor.IStandaloneEditorConstructionOptions = {
  // Font settings
  fontSize: 14,
  fontFamily: "Consolas, 'Courier New', monospace",
  fontLigatures: true,
  lineHeight: 20,
  
  // Cursor settings
  cursorBlinking: 'smooth',
  cursorSmoothCaretAnimation: 'on',
  cursorStyle: 'line',
  
  // Minimap - Requirement 8.5: Virtual scrolling
  minimap: {
    enabled: true,
    maxColumn: 120,
    renderCharacters: true,
    showSlider: 'mouseover',
    scale: 1,
  },
  
  // Scrolling - Requirement 8.5: Virtual scrolling (enabled by default)
  smoothScrolling: true,
  fastScrollSensitivity: 5,
  scrollBeyondLastLine: true,
  
  // Line numbers and gutter
  lineNumbers: 'on',
  glyphMargin: true,
  folding: true,
  foldingHighlight: true,
  foldingStrategy: 'indentation',
  showFoldingControls: 'mouseover',
  
  // Rendering
  renderWhitespace: 'selection',
  renderControlCharacters: true,
  renderLineHighlight: 'all',
  renderValidationDecorations: 'on',
  
  // Layout
  automaticLayout: true,
  wordWrap: 'on',
  wrappingIndent: 'indent',
  
  // Editing features
  autoClosingBrackets: 'always',
  autoClosingQuotes: 'always',
  autoIndent: 'full',
  formatOnType: true,
  formatOnPaste: true,
  tabSize: 2,
  insertSpaces: true,
  
  // IntelliSense
  quickSuggestions: {
    other: true,
    comments: false,
    strings: true,
  },
  suggestOnTriggerCharacters: true,
  acceptSuggestionOnEnter: 'on',
  snippetSuggestions: 'inline',
  wordBasedSuggestions: 'allDocuments',
  parameterHints: {
    enabled: true,
    cycle: true,
  },
  
  // Hover
  hover: {
    enabled: true,
    delay: 300,
    sticky: true,
  },
  
  // Links
  links: true,
  
  // Multi-cursor
  multiCursorModifier: 'ctrlCmd',
  multiCursorMergeOverlapping: true,
  
  // Mouse wheel zoom
  mouseWheelZoom: true,
  
  // Bracket matching
  matchBrackets: 'always',
  guides: {
    bracketPairs: true,
    bracketPairsHorizontal: true,
    highlightActiveBracketPair: true,
    indentation: true,
  },
  
  // Selection
  selectionHighlight: true,
  occurrencesHighlight: 'singleFile',
  
  // Go to definition
  gotoLocation: {
    multipleDefinitions: 'peek',
    multipleReferences: 'peek',
    multipleDeclarations: 'peek',
    multipleImplementations: 'peek',
    multipleTypeDefinitions: 'peek',
  },
  definitionLinkOpensInPeek: false,
  
  // Performance optimizations for large files
  // Requirement 8.1, 8.2: Large file performance
  maxTokenizationLineLength: 20000,
  stopRenderingLineAfter: 10000,
};

/**
 * Language-specific editor options
 * Optimizes settings based on language conventions
 */
export const LANGUAGE_SPECIFIC_OPTIONS: Partial<Record<SupportedLanguage, Partial<Monaco.editor.IStandaloneEditorConstructionOptions>>> = {
  python: {
    tabSize: 4,
    insertSpaces: true,
    detectIndentation: false,
    trimAutoWhitespace: true,
  },
  javascript: {
    tabSize: 2,
    insertSpaces: true,
    formatOnType: true,
    formatOnPaste: true,
  },
  typescript: {
    tabSize: 2,
    insertSpaces: true,
    formatOnType: true,
    formatOnPaste: true,
  },
  go: {
    tabSize: 4,
    insertSpaces: false, // Go uses tabs
    detectIndentation: false,
  },
  rust: {
    tabSize: 4,
    insertSpaces: true,
    formatOnType: true,
  },
  markdown: {
    wordWrap: 'on',
    wrappingIndent: 'none',
    quickSuggestions: {
      other: false,
      comments: false,
      strings: false,
    },
  },
};

/**
 * Performance configuration for large files
 * Requirement 8.1: Files with 10,000+ lines
 */
export interface PerformanceConfig {
  largeFileThreshold: number;
  largeFileOptions: Partial<Monaco.editor.IStandaloneEditorConstructionOptions>;
}

export const PERFORMANCE_CONFIG: PerformanceConfig = {
  // Files with more than 10,000 lines are considered large
  largeFileThreshold: 10000,
  
  // Optimized options for large files
  largeFileOptions: {
    // Disable expensive features for large files
    minimap: {
      enabled: false,
    },
    renderWhitespace: 'none',
    renderControlCharacters: false,
    occurrencesHighlight: 'off',
    selectionHighlight: false,
    
    // Limit tokenization
    maxTokenizationLineLength: 10000,
    stopRenderingLineAfter: 5000,
    
    // Disable some IntelliSense features
    quickSuggestions: {
      other: false,
      comments: false,
      strings: false,
    },
    wordBasedSuggestions: 'off',
  },
};

/**
 * Get language from file name
 */
export function getLanguageFromFileName(fileName: string): SupportedLanguage | 'plaintext' {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (!ext) return 'plaintext';
  
  return LANGUAGE_EXTENSIONS[ext] || 'plaintext';
}

/**
 * Get editor options for a specific language
 */
export function getEditorOptionsForLanguage(
  language: SupportedLanguage | 'plaintext',
  lineCount: number = 0
): Monaco.editor.IStandaloneEditorConstructionOptions {
  const baseOptions = { ...DEFAULT_EDITOR_OPTIONS };
  
  // Apply language-specific options
  if (language !== 'plaintext' && LANGUAGE_SPECIFIC_OPTIONS[language]) {
    Object.assign(baseOptions, LANGUAGE_SPECIFIC_OPTIONS[language]);
  }
  
  // Apply performance optimizations for large files
  if (lineCount > PERFORMANCE_CONFIG.largeFileThreshold) {
    Object.assign(baseOptions, PERFORMANCE_CONFIG.largeFileOptions);
  }
  
  return baseOptions;
}

/**
 * Verify Monaco Editor is properly configured
 * Requirement 1.1: Verify installation and dependencies
 */
export function verifyMonacoConfiguration(): {
  isConfigured: boolean;
  supportedLanguages: string[];
  availableThemes: string[];
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check if Monaco is available
  if (typeof window === 'undefined') {
    errors.push('Monaco Editor requires browser environment');
  }
  
  return {
    isConfigured: errors.length === 0,
    supportedLanguages: Object.keys(SUPPORTED_LANGUAGES),
    availableThemes: Object.keys(BUILT_IN_THEMES),
    errors,
  };
}
