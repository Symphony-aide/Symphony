// SyntaxHighlighter.refactored.jsx - Refactored SyntaxHighlighter using features

import React from 'react';
import {
  LanguageDetectionFeature,
  SyntaxTokenizationFeature,
  ThemeManagementFeature
} from '@symphony/features';
import { SyntaxHighlighterUI } from './components/SyntaxHighlighterUI';
import { useTextMateGrammar } from './hooks/useTextMateGrammar';

/**
 * SyntaxHighlighter - Integrated syntax highlighting component using features
 * 
 * This component integrates LanguageDetection, SyntaxTokenization, and ThemeManagement features
 * with the pure SyntaxHighlighterUI component following the [Page, Feature, Component] pattern.
 * 
 * @param {Object} props - Component props
 * @param {string} props.code - Code to highlight
 * @param {string} props.language - Programming language (optional, will be detected)
 * @param {string} props.theme - Theme name ('dark', 'light', 'high-contrast')
 * @param {string} props.fileName - File name for language detection
 * @param {Function} props.onLanguageDetected - Callback when language is detected
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showLineNumbers - Whether to show line numbers
 * @param {number} props.lineNumberStart - Starting line number
 * @returns {React.Element} Syntax highlighter component
 * 
 * @example
 * <SyntaxHighlighter
 *   code={codeContent}
 *   fileName="index.js"
 *   theme="dark"
 *   showLineNumbers={true}
 *   onLanguageDetected={(result) => console.log(result)}
 * />
 */
export default function SyntaxHighlighter({
  code = '',
  language = null,
  theme = 'dark',
  fileName = '',
  onLanguageDetected = () => {},
  className = '',
  showLineNumbers = false,
  lineNumberStart = 1,
}) {
  return (
    <LanguageDetectionFeature
      fileName={fileName}
      explicitLanguage={language}
      code={code}
      onLanguageDetected={onLanguageDetected}
    >
      {(languageAPI) => {
        // Load TextMate grammar for the detected language
        const { grammar } = useTextMateGrammar(languageAPI.language);

        return (
          <ThemeManagementFeature themeName={theme}>
            {(themeAPI) => (
              <SyntaxTokenizationFeature
                code={code}
                grammar={grammar}
                language={languageAPI.language}
              >
                {(tokenizationAPI) => (
                  <SyntaxHighlighterUI
                    tokens={tokenizationAPI.tokens}
                    themeData={themeAPI.themeData}
                    getTokenClasses={tokenizationAPI.getTokenClasses}
                    language={languageAPI.language}
                    showLineNumbers={showLineNumbers}
                    lineNumberStart={lineNumberStart}
                    className={className}
                    code={code}
                  />
                )}
              </SyntaxTokenizationFeature>
            )}
          </ThemeManagementFeature>
        );
      }}
    </LanguageDetectionFeature>
  );
}

// Export UI component for custom usage
export { SyntaxHighlighterUI } from './components/SyntaxHighlighterUI';
