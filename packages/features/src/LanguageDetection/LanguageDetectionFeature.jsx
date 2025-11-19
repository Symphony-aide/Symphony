// LanguageDetectionFeature.jsx - Feature component for language detection

import React from 'react';
import { useLanguageDetection } from './hooks/useLanguageDetection';

/**
 * LanguageDetectionFeature - Manages programming language detection
 * 
 * This feature encapsulates all logic related to detecting programming languages
 * from file names, extensions, and code content.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.children - Render prop function receiving language detection API
 * @param {string} props.fileName - File name to detect language from
 * @param {string} props.explicitLanguage - Explicitly provided language
 * @param {string} props.code - Code content for content-based detection
 * @param {Function} props.onLanguageDetected - Callback when language is detected
 * @returns {React.Element} Rendered children with language detection API
 * 
 * @example
 * <LanguageDetectionFeature
 *   fileName="index.js"
 *   code={codeContent}
 *   onLanguageDetected={(result) => console.log(result)}
 * >
 *   {({ language, displayName, confidence }) => (
 *     <div>
 *       <span>Language: {displayName}</span>
 *       <span>Confidence: {confidence}</span>
 *     </div>
 *   )}
 * </LanguageDetectionFeature>
 */
export function LanguageDetectionFeature({
  children,
  fileName,
  explicitLanguage,
  code,
  onLanguageDetected
}) {
  const detectionAPI = useLanguageDetection({
    fileName,
    explicitLanguage,
    code
  });

  // Notify parent when language is detected
  React.useEffect(() => {
    if (onLanguageDetected && detectionAPI.language) {
      onLanguageDetected({
        language: detectionAPI.language,
        source: detectionAPI.source,
        confidence: detectionAPI.confidence,
        displayName: detectionAPI.displayName
      });
    }
  }, [detectionAPI.language, detectionAPI.source, detectionAPI.confidence, detectionAPI.displayName, onLanguageDetected]);

  return children(detectionAPI);
}

// Export hook for direct usage
export { useLanguageDetection } from './hooks/useLanguageDetection';
