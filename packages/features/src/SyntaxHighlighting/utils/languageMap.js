// languageMap.js
// File extension to language mapping
const EXTENSION_MAP = {
	// JavaScript/TypeScript
	'.js': 'javascript',
	'.jsx': 'javascriptreact',
	'.ts': 'typescript',
	'.tsx': 'typescriptreact',
	'.mjs': 'javascript',
	'.cjs': 'javascript',
	
	// Web technologies
	'.html': 'html',
	'.htm': 'html',
	'.css': 'css',
	'.scss': 'scss',
	'.sass': 'sass',
	'.less': 'less',
	'.json': 'json',
	'.xml': 'xml',
	'.svg': 'xml',
	
	// Python
	'.py': 'python',
	'.pyx': 'python',
	'.pyi': 'python',
	'.pyw': 'python',
	
	// Java/C#/C++
	'.java': 'java',
	'.cs': 'csharp',
	'.cpp': 'cpp',
	'.cc': 'cpp',
	'.cxx': 'cpp',
	'.c': 'c',
	'.h': 'c',
	'.hpp': 'cpp',
	
	// Shell/Config
	'.sh': 'shellscript',
	'.bash': 'shellscript',
	'.zsh': 'shellscript',
	'.fish': 'shellscript',
	'.ps1': 'powershell',
	'.yaml': 'yaml',
	'.yml': 'yaml',
	'.toml': 'toml',
	'.ini': 'ini',
	
	// Markdown/Documentation
	'.md': 'markdown',
	'.markdown': 'markdown',
	'.rst': 'restructuredtext',
	'.txt': 'plaintext',
	
	// Other languages
	'.php': 'php',
	'.rb': 'ruby',
	'.go': 'go',
	'.rs': 'rust',
	'.swift': 'swift',
	'.kt': 'kotlin',
	'.scala': 'scala',
	'.clj': 'clojure',
	'.sql': 'sql',
	'.r': 'r',
	'.R': 'r',
	'.m': 'matlab',
	'.pl': 'perl',
	'.lua': 'lua',
	'.vim': 'vim',
	'.dockerfile': 'dockerfile',
	'.dockerignore': 'ignore',
	'.gitignore': 'ignore',
};

// Content-based language detection patterns
const CONTENT_PATTERNS = [
	{ pattern: /^#!/, languages: ['shellscript', 'python', 'ruby', 'perl'] },
	{ pattern: /^\s*<\?php/, languages: ['php'] },
	{ pattern: /^\s*<!DOCTYPE\s+html/i, languages: ['html'] },
	{ pattern: /^\s*<html/i, languages: ['html'] },
	{ pattern: /^\s*import\s+\w+\s+from/, languages: ['javascript', 'typescript'] },
	{ pattern: /^\s*from\s+\w+\s+import/, languages: ['python'] },
	{ pattern: /^\s*package\s+\w+/, languages: ['java', 'go'] },
	{ pattern: /^\s*class\s+\w+\s*{/, languages: ['javascript', 'typescript', 'java', 'csharp'] },
	{ pattern: /^\s*def\s+\w+\s*\(/, languages: ['python', 'ruby'] },
	{ pattern: /^\s*function\s+\w+\s*\(/, languages: ['javascript', 'typescript', 'php'] },
	{ pattern: /^\s*SELECT\s+.*\s+FROM/i, languages: ['sql'] },
];

export function getLanguageFromExtension(fileName) {
	if (!fileName) return null;
	
	const extension = fileName.toLowerCase().match(/\.[^.]*$/)?.[0];
	if (!extension) return null;
	
	return EXTENSION_MAP[extension] || null;
}

export function detectLanguageFromContent(code) {
	if (!code || typeof code !== 'string') return null;
	
	const lines = code.split('\n').slice(0, 10); // Check first 10 lines
	const content = lines.join('\n');
	
	for (const { pattern, languages } of CONTENT_PATTERNS) {
		if (pattern.test(content)) {
			// Return the first language that matches
			return languages[0];
		}
	}
	
	return null;
}

export function getAllSupportedLanguages() {
	const languages = new Set(Object.values(EXTENSION_MAP));
	CONTENT_PATTERNS.forEach(({ languages: patternLangs }) => {
		patternLangs.forEach(lang => languages.add(lang));
	});
	return Array.from(languages).sort();
}

export function getExtensionsForLanguage(language) {
	return Object.entries(EXTENSION_MAP)
		.filter(([, lang]) => lang === language)
		.map(([ext]) => ext);
}
