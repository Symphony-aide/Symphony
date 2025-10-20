// SyntaxHighlighterUI.jsx - Pure UI component for syntax highlighting

import React, { useMemo } from 'react';

/**
 * SyntaxHighlighterUI - Pure presentational component for syntax highlighting
 * 
 * Displays tokenized code with syntax highlighting, line numbers, and theming.
 * 
 * @param {Object} props - Component props
 * @param {Array} props.tokens - Tokenized code (array of lines, each line is array of tokens)
 * @param {Object} props.themeData - Theme data with colors and styles
 * @param {Function} props.getTokenClasses - Function to get CSS classes for token scopes
 * @param {string} props.language - Programming language
 * @param {boolean} props.showLineNumbers - Whether to show line numbers
 * @param {number} props.lineNumberStart - Starting line number
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.code - Original code (fallback if no tokens)
 * @returns {React.Element} Syntax highlighter UI
 */
export function SyntaxHighlighterUI({
  tokens = [],
  themeData,
  getTokenClasses,
  language = 'plaintext',
  showLineNumbers = false,
  lineNumberStart = 1,
  className = '',
  code = ''
}) {
  // Memoize the rendered lines for performance
  const renderedLines = useMemo(() => {
    if (!tokens || tokens.length === 0) {
      // Fallback to plain text rendering
      return code.split('\n').map((line, index) => (
        <div key={index} className="flex items-start min-h-[1.4em] relative hover:bg-white/5">
          {showLineNumbers && (
            <span 
              className="inline-block min-w-[2.5rem] pr-4 text-right select-none opacity-70 flex-shrink-0 tabular-nums"
              style={{ color: themeData.lineNumber }}
            >
              {lineNumberStart + index}
            </span>
          )}
          <span className="flex-1 whitespace-pre break-words">{line || '\u00A0'}</span>
        </div>
      ));
    }
    
    return tokens.map((line, lineIndex) => (
      <div key={lineIndex} className="flex items-start min-h-[1.4em] relative hover:bg-white/5">
        {showLineNumbers && (
          <span 
            className="inline-block min-w-[2.5rem] pr-4 text-right select-none opacity-70 flex-shrink-0 tabular-nums"
            style={{ color: themeData.lineNumber }}
          >
            {lineNumberStart + lineIndex}
          </span>
        )}
        <span className="flex-1 whitespace-pre break-words">
          {line.map((token, tokenIndex) => {
            const tokenClasses = getTokenClasses(token.scopes);
            return (
              <span
                key={tokenIndex}
                className={`relative ${tokenClasses}`}
                style={{ color: themeData.getTokenColor(token.scopes) }}
              >
                {token.content}
              </span>
            );
          })}
        </span>
      </div>
    ));
  }, [tokens, code, showLineNumbers, lineNumberStart, themeData, getTokenClasses]);

  return (
    <div 
      className={`font-mono text-sm leading-relaxed whitespace-pre overflow-auto rounded border-0 relative p-2 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2 ${className}`}
      data-language={language}
      data-theme={themeData.type}
      style={{
        backgroundColor: themeData.background,
        color: themeData.foreground,
        colorScheme: themeData.type,
      }}
      tabIndex={0}
      role="textbox"
      aria-label={`Code editor for ${language}`}
      aria-readonly="true"
    >
      <div className="min-h-full">
        {renderedLines}
      </div>
    </div>
  );
}
