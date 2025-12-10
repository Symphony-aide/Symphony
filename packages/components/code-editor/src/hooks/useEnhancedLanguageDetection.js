// useEnhancedLanguageDetection.js - Enhanced language detection with content analysis
import { useMemo, useCallback } from "react";

// Language detection utilities
const getLanguageFromExtension = (fileName) => {
  if (!fileName) return null;

  const ext = fileName.split('.').pop()?.toLowerCase();
  const extensionMap = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'scss',
    'json': 'json',
    'xml': 'xml',
    'md': 'markdown',
    'yml': 'yaml',
    'yaml': 'yaml',
    'sh': 'shell',
    'bash': 'shell',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'cs': 'csharp',
    'php': 'php',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'sql': 'sql',
  };

  return extensionMap[ext] || null;
};

const detectLanguageFromContent = (code) => {
  if (!code || code.trim().length < 10) return null;

  const patterns = [
    { regex: /^\s*<\?php/i, language: 'php' },
    { regex: /^\s*<!DOCTYPE html/i, language: 'html' },
    { regex: /^\s*<html/i, language: 'html' },
    { regex: /import\s+.*\s+from\s+['"`]/i, language: 'javascript' },
    { regex: /export\s+(default\s+)?(class|function|const|let|var)/i, language: 'javascript' },
    { regex: /interface\s+\w+\s*{/i, language: 'typescript' },
    { regex: /type\s+\w+\s*=/i, language: 'typescript' },
    { regex: /def\s+\w+\s*\(/i, language: 'python' },
    { regex: /class\s+\w+(\s*\([^)]*\))?\s*:/i, language: 'python' },
    { regex: /import\s+\w+/i, language: 'python' },
    { regex: /from\s+\w+\s+import/i, language: 'python' },
    { regex: /public\s+(class|interface|enum)/i, language: 'java' },
    { regex: /package\s+[\w.]+;/i, language: 'java' },
    { regex: /#include\s*<[^>]+>/i, language: 'c' },
    { regex: /using\s+namespace\s+std;/i, language: 'cpp' },
    { regex: /namespace\s+\w+\s*{/i, language: 'csharp' },
    { regex: /using\s+System;/i, language: 'csharp' },
    { regex: /SELECT\s+.*\s+FROM/i, language: 'sql' },
    { regex: /CREATE\s+(TABLE|DATABASE|INDEX)/i, language: 'sql' },
  ];

  for (const { regex, language } of patterns) {
    if (regex.test(code)) {
      return language;
    }
  }

  return null;
};

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function useEnhancedLanguageDetection(fileName = "", explicitLanguage = null, code = "") {
  const detectedLanguage = useMemo(() => {
    // If language is explicitly provided, use it
    if (explicitLanguage) {
      return explicitLanguage;
    }

    // Try to detect from file extension first (most reliable)
    if (fileName) {
      const extensionLanguage = getLanguageFromExtension(fileName);
      if (extensionLanguage) {
        return extensionLanguage;
      }
    }

    // Try to detect from content
    if (code) {
      const contentLanguage = detectLanguageFromContent(code);
      if (contentLanguage) {
        return contentLanguage;
      }
    }

    // Default to plain text
    return "plaintext";
  }, [fileName, explicitLanguage, code]);

  const getLanguageDisplayName = useCallback((language) => {
    const displayNames = {
      'javascript': 'JavaScript',
      'typescript': 'TypeScript',
      'python': 'Python',
      'html': 'HTML',
      'css': 'CSS',
      'scss': 'SCSS',
      'json': 'JSON',
      'xml': 'XML',
      'markdown': 'Markdown',
      'yaml': 'YAML',
      'shell': 'Shell',
      'java': 'Java',
      'c': 'C',
      'cpp': 'C++',
      'csharp': 'C#',
      'php': 'PHP',
      'ruby': 'Ruby',
      'go': 'Go',
      'rust': 'Rust',
      'sql': 'SQL',
      'plaintext': 'Plain Text',
    };

    return displayNames[language] || language;
  }, []);

  const isLanguageSupported = useCallback((language) => {
    const supportedLanguages = [
      'javascript', 'typescript', 'python', 'html', 'css', 'scss',
      'json', 'xml', 'markdown', 'yaml', 'shell', 'java', 'c',
      'cpp', 'csharp', 'php', 'ruby', 'go', 'rust', 'sql'
    ];

    return supportedLanguages.includes(language);
  }, []);

  return {
    detectedLanguage,
    getLanguageDisplayName,
    isLanguageSupported,
    confidence: explicitLanguage ? 'high' : fileName ? 'medium' : code ? 'low' : 'none'
  };
}
