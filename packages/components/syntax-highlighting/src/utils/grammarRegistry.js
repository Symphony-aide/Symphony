// grammarRegistry.js
// Simple TextMate grammar registry and loader

class GrammarRegistry {
	constructor() {
		this.grammars = new Map();
		this.loadingPromises = new Map();
	}
	
	getGrammar(language) {
		return this.grammars.get(language);
	}
	
	setGrammar(language, grammar) {
		this.grammars.set(language, grammar);
	}
	
	hasGrammar(language) {
		return this.grammars.has(language);
	}
	
	clear() {
		this.grammars.clear();
		this.loadingPromises.clear();
	}
}

// Global registry instance
const registry = new GrammarRegistry();

// Built-in grammar definitions for common languages
const BUILTIN_GRAMMARS = {
	javascript: {
		scopeName: 'source.js',
		patterns: [
			{ name: 'keyword.control.js', match: '\\b(if|else|for|while|do|switch|case|default|break|continue|return|try|catch|finally|throw|function|var|let|const|class|extends|import|export|from|as|async|await)\\b' },
			{ name: 'storage.type.js', match: '\\b(function|var|let|const|class)\\b' },
			{ name: 'string.quoted.single.js', begin: "'", end: "'", patterns: [{ name: 'constant.character.escape.js', match: '\\\\.' }] },
			{ name: 'string.quoted.double.js', begin: '"', end: '"', patterns: [{ name: 'constant.character.escape.js', match: '\\\\.' }] },
			{ name: 'string.template.js', begin: '`', end: '`', patterns: [{ name: 'meta.template.expression.js', begin: '\\${', end: '}' }] },
			{ name: 'comment.line.double-slash.js', match: '//.*$' },
			{ name: 'comment.block.js', begin: '/\\*', end: '\\*/' },
			{ name: 'constant.numeric.js', match: '\\b\\d+(\\.\\d+)?([eE][+-]?\\d+)?\\b' },
			{ name: 'constant.language.boolean.js', match: '\\b(true|false|null|undefined)\\b' },
			{ name: 'entity.name.function.js', match: '\\b([a-zA-Z_$][a-zA-Z0-9_$]*)\\s*(?=\\()' },
			{ name: 'variable.other.js', match: '\\b[a-zA-Z_$][a-zA-Z0-9_$]*\\b' },
		]
	},
	
	typescript: {
		scopeName: 'source.ts',
		patterns: [
			{ name: 'keyword.control.ts', match: '\\b(if|else|for|while|do|switch|case|default|break|continue|return|try|catch|finally|throw|function|var|let|const|class|extends|implements|interface|type|enum|namespace|module|import|export|from|as|async|await|public|private|protected|readonly|static)\\b' },
			{ name: 'storage.type.ts', match: '\\b(function|var|let|const|class|interface|type|enum|namespace|module)\\b' },
			{ name: 'storage.modifier.ts', match: '\\b(public|private|protected|readonly|static|abstract)\\b' },
			{ name: 'string.quoted.single.ts', begin: "'", end: "'", patterns: [{ name: 'constant.character.escape.ts', match: '\\\\.' }] },
			{ name: 'string.quoted.double.ts', begin: '"', end: '"', patterns: [{ name: 'constant.character.escape.ts', match: '\\\\.' }] },
			{ name: 'string.template.ts', begin: '`', end: '`', patterns: [{ name: 'meta.template.expression.ts', begin: '\\${', end: '}' }] },
			{ name: 'comment.line.double-slash.ts', match: '//.*$' },
			{ name: 'comment.block.ts', begin: '/\\*', end: '\\*/' },
			{ name: 'constant.numeric.ts', match: '\\b\\d+(\\.\\d+)?([eE][+-]?\\d+)?\\b' },
			{ name: 'constant.language.boolean.ts', match: '\\b(true|false|null|undefined)\\b' },
			{ name: 'entity.name.function.ts', match: '\\b([a-zA-Z_$][a-zA-Z0-9_$]*)\\s*(?=\\()' },
			{ name: 'entity.name.type.ts', match: '\\b[A-Z][a-zA-Z0-9_$]*\\b' },
		]
	},
	
	python: {
		scopeName: 'source.python',
		patterns: [
			{ name: 'keyword.control.python', match: '\\b(if|elif|else|for|while|break|continue|pass|return|yield|try|except|finally|raise|with|as|import|from|def|class|lambda|and|or|not|in|is|assert|del|global|nonlocal|async|await)\\b' },
			{ name: 'storage.type.python', match: '\\b(def|class|lambda)\\b' },
			{ name: 'string.quoted.single.python', begin: "'", end: "'", patterns: [{ name: 'constant.character.escape.python', match: '\\\\.' }] },
			{ name: 'string.quoted.double.python', begin: '"', end: '"', patterns: [{ name: 'constant.character.escape.python', match: '\\\\.' }] },
			{ name: 'string.quoted.triple.python', begin: "'''", end: "'''" },
			{ name: 'string.quoted.triple.python', begin: '"""', end: '"""' },
			{ name: 'comment.line.number-sign.python', match: '#.*$' },
			{ name: 'constant.numeric.python', match: '\\b\\d+(\\.\\d+)?([eE][+-]?\\d+)?\\b' },
			{ name: 'constant.language.python', match: '\\b(True|False|None|self|cls)\\b' },
			{ name: 'entity.name.function.python', match: '\\b([a-zA-Z_][a-zA-Z0-9_]*)\\s*(?=\\()' },
			{ name: 'entity.name.class.python', match: '\\bclass\\s+([a-zA-Z_][a-zA-Z0-9_]*)' },
		]
	},
	
	html: {
		scopeName: 'text.html.basic',
		patterns: [
			{ name: 'meta.tag.html', begin: '</?[a-zA-Z][a-zA-Z0-9]*', end: '>', patterns: [
				{ name: 'entity.other.attribute-name.html', match: '\\b[a-zA-Z-]+(?=\\s*=)' },
				{ name: 'string.quoted.double.html', begin: '"', end: '"' },
				{ name: 'string.quoted.single.html', begin: "'", end: "'" },
			]},
			{ name: 'comment.block.html', begin: '<!--', end: '-->' },
			{ name: 'entity.name.tag.html', match: '</?[a-zA-Z][a-zA-Z0-9]*' },
		]
	},
	
	css: {
		scopeName: 'source.css',
		patterns: [
			{ name: 'entity.name.tag.css', match: '\\b[a-zA-Z][a-zA-Z0-9-]*(?=\\s*{)' },
			{ name: 'entity.other.attribute-name.class.css', match: '\\.[a-zA-Z][a-zA-Z0-9-]*' },
			{ name: 'entity.other.attribute-name.id.css', match: '#[a-zA-Z][a-zA-Z0-9-]*' },
			{ name: 'support.type.property-name.css', match: '\\b[a-zA-Z-]+(?=\\s*:)' },
			{ name: 'string.quoted.double.css', begin: '"', end: '"' },
			{ name: 'string.quoted.single.css', begin: "'", end: "'" },
			{ name: 'comment.block.css', begin: '/\\*', end: '\\*/' },
			{ name: 'constant.numeric.css', match: '\\b\\d+(\\.\\d+)?(px|em|rem|%|vh|vw|pt|pc|in|cm|mm|ex|ch|fr)\\b' },
			{ name: 'support.constant.color.css', match: '#[0-9a-fA-F]{3,6}\\b' },
		]
	}
};

export async function loadGrammar(language) {
	// Check if already loading
	if (registry.loadingPromises.has(language)) {
		return registry.loadingPromises.get(language);
	}
	
	// Check if already loaded
	if (registry.hasGrammar(language)) {
		return { grammar: registry.getGrammar(language), language };
	}
	
	const loadPromise = (async () => {
		try {
			// Try to load built-in grammar first
			if (BUILTIN_GRAMMARS[language]) {
				const grammar = BUILTIN_GRAMMARS[language];
				registry.setGrammar(language, grammar);
				return { grammar, language };
			}
			
			// Try to load from external grammar files (future enhancement)
			// This could load from a grammars/ directory or external sources
			console.warn(`No grammar found for language: ${language}`);
			return { grammar: null, language };
			
		} catch (error) {
			console.error(`Failed to load grammar for ${language}:`, error);
			return { grammar: null, language };
		} finally {
			registry.loadingPromises.delete(language);
		}
	})();
	
	registry.loadingPromises.set(language, loadPromise);
	return loadPromise;
}

export function getGrammarRegistry() {
	return registry;
}

export function getSupportedLanguages() {
	return Object.keys(BUILTIN_GRAMMARS);
}
