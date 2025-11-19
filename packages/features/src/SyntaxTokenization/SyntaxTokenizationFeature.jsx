// SyntaxTokenizationFeature.jsx - Feature component for syntax tokenization

import React from 'react';
import { useSyntaxTokenization } from './hooks/useSyntaxTokenization';

/**
 * SyntaxTokenizationFeature - Manages syntax tokenization for code highlighting
 * 
 * This feature encapsulates all logic related to tokenizing code for syntax highlighting,
 * including grammar-based tokenization and fallback to plain text.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.children - Render prop function receiving tokenization API
 * @param {string} props.code - Code to tokenize
 * @param {Object} props.grammar - TextMate grammar object
 * @param {string} props.language - Programming language
 * @returns {React.Element} Rendered children with tokenization API
 * 
 * @example
 * <SyntaxTokenizationFeature
 *   code={codeContent}
 *   grammar={grammarObject}
 *   language="javascript"
 * >
 *   {({ tokens, getTokenClasses, lineCount }) => (
 *     <div>
 *       {tokens.map((line, index) => (
 *         <div key={index}>
 *           {line.map((token, tokenIndex) => (
 *             <span
 *               key={tokenIndex}
 *               className={getTokenClasses(token.scopes)}
 *             >
 *               {token.content}
 *             </span>
 *           ))}
 *         </div>
 *       ))}
 *     </div>
 *   )}
 * </SyntaxTokenizationFeature>
 */
export function SyntaxTokenizationFeature({
  children,
  code,
  grammar,
  language
}) {
  const tokenizationAPI = useSyntaxTokenization({
    code,
    grammar,
    language
  });

  return children(tokenizationAPI);
}

// Export hook for direct usage
export { useSyntaxTokenization } from './hooks/useSyntaxTokenization';
