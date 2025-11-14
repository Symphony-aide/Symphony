// StatusInfoFeature.jsx - Feature component for status bar information

import React from 'react';
import { useStatusInfo } from './hooks/useStatusInfo';

/**
 * StatusInfoFeature - Manages status bar information state and logic
 * 
 * This feature encapsulates all business logic related to status bar information,
 * including file info, cursor position, language detection, and collaboration status.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.children - Render prop function receiving status info API
 * @param {string} props.activeFileName - Currently active file name
 * @param {number} props.lineCount - Total number of lines
 * @param {Object} props.cursorPosition - Cursor position { line, column }
 * @param {string} props.language - Programming language
 * @param {Date} props.lastSaved - Last saved timestamp
 * @param {string} props.gitBranch - Current git branch
 * @param {Array} props.collaborators - List of collaborators
 * @param {boolean} props.isOnline - Online status
 * @returns {React.Element} Rendered children with status info API
 * 
 * @example
 * <StatusInfoFeature
 *   activeFileName="index.js"
 *   lineCount={100}
 *   cursorPosition={{ line: 10, column: 5 }}
 *   language="JavaScript"
 * >
 *   {({ statusInfo, lastSavedText, updateCursorPosition }) => (
 *     <StatusBarUI 
 *       statusInfo={statusInfo}
 *       lastSavedText={lastSavedText}
 *       onCursorMove={updateCursorPosition}
 *     />
 *   )}
 * </StatusInfoFeature>
 */
export function StatusInfoFeature({
  children,
  activeFileName,
  lineCount,
  cursorPosition,
  language,
  lastSaved,
  gitBranch,
  collaborators,
  isOnline
}) {
  const statusInfoAPI = useStatusInfo({
    activeFileName,
    lineCount,
    cursorPosition,
    language,
    lastSaved,
    gitBranch,
    collaborators,
    isOnline
  });

  return children(statusInfoAPI);
}

// Export hook for direct usage
export { useStatusInfo } from './hooks/useStatusInfo';
