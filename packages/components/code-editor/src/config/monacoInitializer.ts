/**
 * Monaco Editor Initializer for Symphony IDE
 * 
 * Handles Monaco Editor initialization including:
 * - TextMate grammar registration
 * - Theme configuration and registration
 * - Language configuration
 * - Performance monitoring
 * 
 * Requirements: 1.1, 1.3, 1.4
 */

import type * as Monaco from 'monaco-editor';
import {
  SUPPORTED_LANGUAGES,
  BUILT_IN_THEMES,
  DEFAULT_EDITOR_OPTIONS,
  type SupportedLanguage,
  type ThemeConfig,
} from './monacoConfig.js';

/**
 * Monaco initialization state
 */
let isInitialized = false;
let monacoInstance: typeof Monaco | null = null;

/**
 * Initialize Monaco Editor with TextMate grammars and themes
 * Requirement 1.1: Configure TextMate grammars for supported languages
 * Requirement 1.3: Support TypeScript, JavaScript, Python, Rust, Go
 * Requirement 1.4: Set up theme management
 */
export async function initializeMonaco(monaco: typeof Monaco): Promise<void> {
  if (isInitialized) {
    console.log('Monaco Editor already initialized');
    return;
  }

  monacoInstance = monaco;

  try {
    // Configure languages
    await configureLanguages(monaco);

    // Register custom themes
    registerThemes(monaco);

    // Set default editor options
    monaco.editor.EditorOptions.fontSize.defaultValue = DEFAULT_EDITOR_OPTIONS.fontSize!;
    monaco.editor.EditorOptions.fontFamily.defaultValue = DEFAULT_EDITOR_OPTIONS.fontFamily!;

    isInitialized = true;
    console.log('Monaco Editor initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Monaco Editor:', error);
    throw error;
  }
}

/**
 * Configure language support
 * Monaco Editor comes with built-in TextMate grammars for most languages
 * This function ensures they are properly registered
 */
async function configureLanguages(monaco: typeof Monaco): Promise<void> {
  // Monaco Editor has built-in support for these languages with TextMate grammars
  // We just need to ensure they are registered
  
  const languageConfigs: Array<{
    id: string;
    extensions: string[];
    aliases: string[];
    mimetypes?: string[];
  }> = [
    {
      id: SUPPORTED_LANGUAGES.typescript,
      extensions: ['.ts', '.tsx'],
      aliases: ['TypeScript', 'typescript', 'ts'],
      mimetypes: ['text/typescript'],
    },
    {
      id: SUPPORTED_LANGUAGES.javascript,
      extensions: ['.js', '.jsx', '.mjs', '.cjs'],
      aliases: ['JavaScript', 'javascript', 'js'],
      mimetypes: ['text/javascript'],
    },
    {
      id: SUPPORTED_LANGUAGES.python,
      extensions: ['.py', '.pyw', '.pyi'],
      aliases: ['Python', 'python', 'py'],
      mimetypes: ['text/x-python'],
    },
    {
      id: SUPPORTED_LANGUAGES.rust,
      extensions: ['.rs'],
      aliases: ['Rust', 'rust', 'rs'],
      mimetypes: ['text/x-rust'],
    },
    {
      id: SUPPORTED_LANGUAGES.go,
      extensions: ['.go'],
      aliases: ['Go', 'go'],
      mimetypes: ['text/x-go'],
    },
  ];

  // Register each language
  for (const config of languageConfigs) {
    try {
      // Check if language is already registered
      const languages = monaco.languages.getLanguages();
      const isRegistered = languages.some(lang => lang.id === config.id);

      if (!isRegistered) {
        monaco.languages.register({
          id: config.id,
          extensions: config.extensions,
          aliases: config.aliases,
          mimetypes: config.mimetypes,
        });
        console.log(`Registered language: ${config.id}`);
      }
    } catch (error) {
      console.warn(`Failed to register language ${config.id}:`, error);
    }
  }

  // Configure language-specific features
  configureTypeScript(monaco);
  configurePython(monaco);
  configureRust(monaco);
  configureGo(monaco);
}

/**
 * Configure TypeScript/JavaScript language features
 */
function configureTypeScript(monaco: typeof Monaco): void {
  // TypeScript configuration
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.Latest,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.CommonJS,
    noEmit: true,
    esModuleInterop: true,
    jsx: monaco.languages.typescript.JsxEmit.React,
    reactNamespace: 'React',
    allowJs: true,
    typeRoots: ['node_modules/@types'],
  });

  // JavaScript configuration
  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.Latest,
    allowNonTsExtensions: true,
    allowJs: true,
    checkJs: false,
  });

  // Enable diagnostics
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
  });

  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: false,
  });
}

/**
 * Configure Python language features
 */
function configurePython(monaco: typeof Monaco): void {
  // Python-specific configuration
  monaco.languages.setLanguageConfiguration('python', {
    comments: {
      lineComment: '#',
      blockComment: ["'''", "'''"],
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')'],
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"', notIn: ['string'] },
      { open: "'", close: "'", notIn: ['string', 'comment'] },
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
    indentationRules: {
      increaseIndentPattern: /^\s*(def|class|for|if|elif|else|while|try|with|finally|except|async)\b.*:\s*$/,
      decreaseIndentPattern: /^\s*(return|pass|break|continue|raise)\b.*$/,
    },
  });
}

/**
 * Configure Rust language features
 */
function configureRust(monaco: typeof Monaco): void {
  monaco.languages.setLanguageConfiguration('rust', {
    comments: {
      lineComment: '//',
      blockComment: ['/*', '*/'],
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')'],
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"', notIn: ['string'] },
      { open: "'", close: "'", notIn: ['string', 'comment'] },
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
  });
}

/**
 * Configure Go language features
 */
function configureGo(monaco: typeof Monaco): void {
  monaco.languages.setLanguageConfiguration('go', {
    comments: {
      lineComment: '//',
      blockComment: ['/*', '*/'],
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')'],
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"', notIn: ['string'] },
      { open: "'", close: "'", notIn: ['string', 'comment'] },
      { open: '`', close: '`', notIn: ['string', 'comment'] },
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
      { open: '`', close: '`' },
    ],
  });
}

/**
 * Register custom themes
 * Requirement 1.4: Theme management (vs-dark, vs-light, custom themes)
 */
function registerThemes(monaco: typeof Monaco): void {
  // Built-in themes are already available in Monaco
  // We can register custom themes here if needed
  
  // Example: Register a custom Symphony dark theme
  const symphonyDarkTheme: Monaco.editor.IStandaloneThemeData = {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
      { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'type', foreground: '4EC9B0' },
      { token: 'function', foreground: 'DCDCAA' },
      { token: 'variable', foreground: '9CDCFE' },
      { token: 'constant', foreground: '4FC1FF' },
    ],
    colors: {
      'editor.background': '#1E1E1E',
      'editor.foreground': '#D4D4D4',
      'editor.lineHighlightBackground': '#2A2D2E',
      'editor.selectionBackground': '#264F78',
      'editorLineNumber.foreground': '#858585',
      'editorLineNumber.activeForeground': '#C6C6C6',
      'editorCursor.foreground': '#AEAFAD',
      'editor.findMatchBackground': '#515C6A',
      'editor.findMatchHighlightBackground': '#EA5C0055',
    },
  };

  try {
    monaco.editor.defineTheme('symphony-dark', symphonyDarkTheme);
    console.log('Registered custom theme: symphony-dark');
  } catch (error) {
    console.warn('Failed to register custom theme:', error);
  }
}

/**
 * Get Monaco instance
 */
export function getMonacoInstance(): typeof Monaco | null {
  return monacoInstance;
}

/**
 * Check if Monaco is initialized
 */
export function isMonacoInitialized(): boolean {
  return isInitialized;
}

/**
 * Register a custom theme
 * Requirement 1.4: Custom theme support
 */
export function registerCustomTheme(
  monaco: typeof Monaco,
  themeId: string,
  themeData: Monaco.editor.IStandaloneThemeData
): void {
  try {
    monaco.editor.defineTheme(themeId, themeData);
    console.log(`Registered custom theme: ${themeId}`);
  } catch (error) {
    console.error(`Failed to register theme ${themeId}:`, error);
    throw error;
  }
}

/**
 * Apply theme to editor
 * Requirement 1.4: Theme changes update all syntax colors
 */
export function applyTheme(monaco: typeof Monaco, themeId: string): void {
  try {
    monaco.editor.setTheme(themeId);
    console.log(`Applied theme: ${themeId}`);
  } catch (error) {
    console.error(`Failed to apply theme ${themeId}:`, error);
    // Fall back to default theme
    monaco.editor.setTheme('vs-dark');
  }
}

/**
 * Get available themes
 */
export function getAvailableThemes(): Array<{ id: string; label: string }> {
  const builtInThemes = Object.values(BUILT_IN_THEMES).map(theme => ({
    id: theme.id,
    label: theme.label,
  }));
  
  return [
    ...builtInThemes,
    { id: 'symphony-dark', label: 'Symphony Dark' },
  ];
}
