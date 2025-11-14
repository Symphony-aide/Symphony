// useLanguageDetection.js - Hook for detecting programming languages

import { useMemo, useCallback } from 'react';

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
  { pattern: /^#!/, languages: ['shellscript', 'python', 'ruby', 'perl'], confidence: 'high' },
  { pattern: /^\s*<\?php/, languages: ['php'], confidence: 'high' },
  { pattern: /^\s*<!DOCTYPE\s+html/i, languages: ['html'], confidence: 'high' },
  { pattern: /^\s*<html/i, languages: ['html'], confidence: 'high' },
  { pattern: /^\s*import\s+\w+\s+from/, languages: ['javascript', 'typescript'], confidence: 'medium' },
  { pattern: /^\s*from\s+\w+\s+import/, languages: ['python'], confidence: 'high' },
  { pattern: /^\s*package\s+\w+/, languages: ['java', 'go'], confidence: 'medium' },
  { pattern: /^\s*class\s+\w+\s*{/, languages: ['javascript', 'typescript', 'java', 'csharp'], confidence: 'low' },
  { pattern: /^\s*def\s+\w+\s*\(/, languages: ['python', 'ruby'], confidence: 'medium' },
  { pattern: /^\s*function\s+\w+\s*\(/, languages: ['javascript', 'typescript', 'php'], confidence: 'low' },
  { pattern: /^\s*SELECT\s+.*\s+FROM/i, languages: ['sql'], confidence: 'high' },
  { pattern: /^\s*const\s+\w+\s*=/, languages: ['javascript', 'typescript'], confidence: 'low' },
  { pattern: /^\s*let\s+\w+\s*=/, languages: ['javascript', 'typescript'], confidence: 'low' },
  { pattern: /^\s*#include\s*</, languages: ['c', 'cpp'], confidence: 'high' },
  { pattern: /^\s*using\s+System/, languages: ['csharp'], confidence: 'high' },
  { pattern: /^\s*fn\s+\w+\s*\(/, languages: ['rust'], confidence: 'high' },
];

/**
 * Hook for detecting programming languages from file names and content
 * @param {Object} options - Configuration options
 * @param {string} options.fileName - File name to detect language from
 * @param {string} options.explicitLanguage - Explicitly provided language
 * @param {string} options.code - Code content for content-based detection
 * @returns {Object} Language detection result
 */
export function useLanguageDetection({
  fileName = '',
  explicitLanguage = null,
  code = ''
} = {}) {
  // Detect language from file extension
  const detectFromExtension = useCallback((fileName) => {
    if (!fileName) return null;
    
    const extension = fileName.toLowerCase().match(/\.[^.]*$/)?.[0];
    if (!extension) return null;
    
    return EXTENSION_MAP[extension] || null;
  }, []);

  // Detect language from code content
  const detectFromContent = useCallback((code) => {
    if (!code) return null;
    
    for (const { pattern, languages, confidence } of CONTENT_PATTERNS) {
      if (pattern.test(code)) {
        return {
          language: languages[0],
          alternatives: languages.slice(1),
          confidence
        };
      }
    }
    
    return null;
  }, []);

  // Main detection logic
  const detectionResult = useMemo(() => {
    // Priority 1: Explicit language
    if (explicitLanguage) {
      return {
        language: explicitLanguage,
        source: 'explicit',
        confidence: 'high',
        alternatives: []
      };
    }
    
    // Priority 2: File extension
    if (fileName) {
      const extensionLanguage = detectFromExtension(fileName);
      if (extensionLanguage) {
        return {
          language: extensionLanguage,
          source: 'extension',
          confidence: 'high',
          alternatives: []
        };
      }
    }
    
    // Priority 3: Content analysis
    if (code) {
      const contentResult = detectFromContent(code);
      if (contentResult) {
        return {
          language: contentResult.language,
          source: 'content',
          confidence: contentResult.confidence,
          alternatives: contentResult.alternatives
        };
      }
    }
    
    // Default: plaintext
    return {
      language: 'plaintext',
      source: 'default',
      confidence: 'none',
      alternatives: []
    };
  }, [fileName, explicitLanguage, code, detectFromExtension, detectFromContent]);

  // Get language display name
  const getLanguageDisplayName = useCallback((language) => {
    const displayNames = {
      javascript: 'JavaScript',
      javascriptreact: 'JavaScript (React)',
      typescript: 'TypeScript',
      typescriptreact: 'TypeScript (React)',
      python: 'Python',
      html: 'HTML',
      css: 'CSS',
      scss: 'SCSS',
      sass: 'Sass',
      less: 'Less',
      json: 'JSON',
      xml: 'XML',
      java: 'Java',
      csharp: 'C#',
      cpp: 'C++',
      c: 'C',
      shellscript: 'Shell Script',
      powershell: 'PowerShell',
      yaml: 'YAML',
      toml: 'TOML',
      ini: 'INI',
      markdown: 'Markdown',
      restructuredtext: 'reStructuredText',
      plaintext: 'Plain Text',
      php: 'PHP',
      ruby: 'Ruby',
      go: 'Go',
      rust: 'Rust',
      swift: 'Swift',
      kotlin: 'Kotlin',
      scala: 'Scala',
      clojure: 'Clojure',
      sql: 'SQL',
      r: 'R',
      matlab: 'MATLAB',
      perl: 'Perl',
      lua: 'Lua',
      vim: 'Vim Script',
      dockerfile: 'Dockerfile',
      ignore: 'Ignore File',
    };
    
    return displayNames[language] || language.charAt(0).toUpperCase() + language.slice(1);
  }, []);

  // Check if language is supported
  const isLanguageSupported = useCallback((language) => {
    return Object.values(EXTENSION_MAP).includes(language) || language === 'plaintext';
  }, []);

  // Get all supported languages
  const getSupportedLanguages = useCallback(() => {
    const languages = new Set(Object.values(EXTENSION_MAP));
    languages.add('plaintext');
    return Array.from(languages).sort();
  }, []);

  return {
    language: detectionResult.language,
    source: detectionResult.source,
    confidence: detectionResult.confidence,
    alternatives: detectionResult.alternatives,
    displayName: getLanguageDisplayName(detectionResult.language),
    isSupported: isLanguageSupported(detectionResult.language),
    detectFromExtension,
    detectFromContent,
    getLanguageDisplayName,
    isLanguageSupported,
    getSupportedLanguages
  };
}
