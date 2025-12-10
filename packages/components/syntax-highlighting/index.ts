// Main exports for the syntax highlighting component

// Original component (preserved for backward compatibility)
export { default as SyntaxHighlighter } from './src/SyntaxHighlighter.jsx';

// Refactored component (recommended)
export { default as SyntaxHighlighterRefactored } from './src/SyntaxHighlighter.refactored.jsx';

// Pure UI component
export { SyntaxHighlighterUI } from './src/components/SyntaxHighlighterUI.jsx';

// Hook exports (original - for backward compatibility)
export { useLanguageDetection } from './src/hooks/useLanguageDetection.js';
export { useTextMateGrammar } from './src/hooks/useTextMateGrammar.js';
export { useTokenizer } from './src/hooks/useTokenizer.js';
export { useThemeManager } from './src/hooks/useThemeManager.js';

// Utility exports
export { 
	getLanguageFromExtension, 
	detectLanguageFromContent, 
	getAllSupportedLanguages,
	getExtensionsForLanguage 
} from './src/utils/languageMap.js';

export { 
	loadGrammar, 
	getGrammarRegistry, 
	getSupportedLanguages 
} from './src/utils/grammarRegistry.js';

export { 
	tokenizeCode, 
	getTokenType, 
	isTokenType 
} from './src/utils/tokenTypes.js';

export { 
	getTheme, 
	parseThemeColors, 
	createCustomTheme, 
	getAvailableThemes, 
	isValidTheme 
} from './src/utils/themeParser.js';