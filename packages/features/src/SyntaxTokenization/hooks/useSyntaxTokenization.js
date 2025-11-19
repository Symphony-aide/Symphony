// useSyntaxTokenization.js - Hook for syntax tokenization

import { useMemo, useCallback } from 'react';

/**
 * Hook for tokenizing code with syntax highlighting
 * @param {Object} options - Configuration options
 * @param {string} options.code - Code to tokenize
 * @param {Object} options.grammar - TextMate grammar object
 * @param {string} options.language - Programming language
 * @returns {Object} Tokenization result and utilities
 */
export function useSyntaxTokenization({
  code = '',
  grammar = null,
  language = 'plaintext'
} = {}) {
  // Tokenize a single line
  const tokenizeLine = useCallback((line, grammar) => {
    if (!line) {
      return [{
        content: '\u00A0', // Non-breaking space for empty lines
        scopes: ['source'],
        startIndex: 0,
        endIndex: 0
      }];
    }
    
    const tokens = [];
    let currentIndex = 0;
    
    // Simple regex-based tokenization using grammar patterns
    while (currentIndex < line.length) {
      let matched = false;
      
      // Try to match each pattern in the grammar
      for (const pattern of grammar?.patterns || []) {
        const match = matchPattern(line, currentIndex, pattern);
        if (match) {
          // Add the matched token
          tokens.push({
            content: match.content,
            scopes: [pattern.name || 'source'],
            startIndex: match.startIndex,
            endIndex: match.endIndex
          });
          
          currentIndex = match.endIndex;
          matched = true;
          break;
        }
      }
      
      // If no pattern matched, add a single character as plain text
      if (!matched) {
        const nextChar = line[currentIndex];
        tokens.push({
          content: nextChar,
          scopes: ['source'],
          startIndex: currentIndex,
          endIndex: currentIndex + 1
        });
        currentIndex++;
      }
    }
    
    // Merge adjacent tokens with the same scope for efficiency
    return mergeAdjacentTokens(tokens);
  }, []);

  // Match a pattern against a line
  const matchPattern = useCallback((line, startIndex, pattern) => {
    const remainingLine = line.slice(startIndex);
    
    if (pattern.match) {
      // Simple regex match
      const regex = new RegExp(pattern.match);
      const match = remainingLine.match(regex);
      if (match && match.index === 0) {
        return {
          content: match[0],
          startIndex,
          endIndex: startIndex + match[0].length
        };
      }
    }
    
    return null;
  }, []);

  // Merge adjacent tokens with the same scope
  const mergeAdjacentTokens = useCallback((tokens) => {
    if (tokens.length === 0) return tokens;
    
    const merged = [tokens[0]];
    
    for (let i = 1; i < tokens.length; i++) {
      const current = tokens[i];
      const previous = merged[merged.length - 1];
      
      // Merge if scopes are identical
      if (
        previous.scopes.length === current.scopes.length &&
        previous.scopes.every((scope, index) => scope === current.scopes[index])
      ) {
        previous.content += current.content;
        previous.endIndex = current.endIndex;
      } else {
        merged.push(current);
      }
    }
    
    return merged;
  }, []);

  // Tokenize the entire code
  const tokenize = useCallback((code, grammar) => {
    if (!code) {
      return [];
    }
    
    const lines = code.split('\n');
    const tokenizedLines = [];
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const tokens = tokenizeLine(line, grammar);
      tokenizedLines.push(tokens);
    }
    
    return tokenizedLines;
  }, [tokenizeLine]);

  // Main tokenization logic
  const tokens = useMemo(() => {
    if (!code) {
      return [];
    }
    
    // If no grammar is available or language is plaintext, return simple tokens
    if (!grammar || language === 'plaintext') {
      return code.split('\n').map(line => [{
        content: line || '\u00A0',
        scopes: ['source.plaintext'],
        startIndex: 0,
        endIndex: line.length
      }]);
    }
    
    try {
      return tokenize(code, grammar);
    } catch (error) {
      console.warn(`Tokenization failed for language: ${language}`, error);
      // Fallback to plain text tokenization
      return code.split('\n').map(line => [{
        content: line || '\u00A0',
        scopes: ['source.plaintext'],
        startIndex: 0,
        endIndex: line.length
      }]);
    }
  }, [code, grammar, language, tokenize]);

  // Get token classes for styling
  const getTokenClasses = useCallback((scopes) => {
    if (!scopes || scopes.length === 0) return '';
    
    const scope = scopes[0];
    let classes = '';
    
    if (scope.includes('keyword')) classes += 'font-bold ';
    if (scope.includes('comment')) classes += 'italic opacity-80 ';
    if (scope.includes('constant')) classes += 'font-medium ';
    if (scope.includes('entity.name.function')) classes += 'font-semibold ';
    if (scope.includes('entity.name.class')) classes += 'font-semibold underline decoration-dotted ';
    if (scope.includes('string')) classes += 'font-normal ';
    if (scope.includes('variable')) classes += 'font-normal ';
    
    return classes.trim();
  }, []);

  // Get token statistics
  const getStatistics = useCallback(() => {
    const stats = {
      totalLines: tokens.length,
      totalTokens: 0,
      tokenTypes: new Set(),
      averageTokensPerLine: 0
    };

    tokens.forEach(line => {
      stats.totalTokens += line.length;
      line.forEach(token => {
        token.scopes.forEach(scope => stats.tokenTypes.add(scope));
      });
    });

    stats.averageTokensPerLine = stats.totalLines > 0 
      ? (stats.totalTokens / stats.totalLines).toFixed(2) 
      : 0;

    return {
      ...stats,
      tokenTypes: Array.from(stats.tokenTypes)
    };
  }, [tokens]);

  return {
    tokens,
    tokenize,
    tokenizeLine,
    getTokenClasses,
    getStatistics,
    hasTokens: tokens.length > 0,
    lineCount: tokens.length
  };
}
