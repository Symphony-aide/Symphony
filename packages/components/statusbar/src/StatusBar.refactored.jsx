// StatusBar.refactored.jsx - Refactored StatusBar using features

import React from 'react';
import { StatusInfoFeature, TimeTrackingFeature } from '@symphony/features';
import { StatusBarUI } from './components/StatusBarUI';

/**
 * StatusBar - Integrated status bar component using features
 * 
 * This component integrates StatusInfo and TimeTracking features
 * with the pure StatusBarUI component following the [Page, Feature, Component] pattern.
 * 
 * @param {Object} props - Component props
 * @param {string} props.activeFileName - Currently active file name
 * @param {boolean} props.saved - Whether the file is saved (deprecated, use lastSaved)
 * @param {boolean} props.terminalVisible - Terminal visibility state
 * @param {Function} props.onToggleTerminal - Terminal toggle callback
 * @param {number} props.lineCount - Total number of lines
 * @param {Object} props.cursorPosition - Cursor position { line, column }
 * @param {string} props.language - Programming language
 * @param {Date} props.lastSaved - Last saved timestamp
 * @param {Array} props.collaborators - List of collaborators
 * @param {boolean} props.isOnline - Online status
 * @param {string} props.gitBranch - Current git branch
 * @returns {React.Element} Status bar component
 * 
 * @example
 * <StatusBar
 *   activeFileName="index.js"
 *   lineCount={100}
 *   cursorPosition={{ line: 10, column: 5 }}
 *   language="JavaScript"
 *   lastSaved={new Date()}
 *   terminalVisible={false}
 *   onToggleTerminal={() => setTerminalVisible(!terminalVisible)}
 * />
 */
export default function StatusBar({
  activeFileName,
  saved, // Deprecated - kept for backward compatibility
  terminalVisible = false,
  onToggleTerminal,
  lineCount = 0,
  cursorPosition = { line: 1, column: 1 },
  language = 'JavaScript',
  lastSaved = null,
  collaborators = [],
  isOnline = true,
  gitBranch = 'main'
}) {
  return (
    <StatusInfoFeature
      activeFileName={activeFileName}
      lineCount={lineCount}
      cursorPosition={cursorPosition}
      language={language}
      lastSaved={lastSaved}
      gitBranch={gitBranch}
      collaborators={collaborators}
      isOnline={isOnline}
    >
      {({ statusInfo, lastSavedText }) => (
        <TimeTrackingFeature>
          {({ currentTime }) => (
            <StatusBarUI
              activeFileName={statusInfo.activeFileName}
              lineCount={statusInfo.lineCount}
              cursorPosition={statusInfo.cursorPosition}
              language={statusInfo.language}
              lastSavedText={lastSavedText}
              gitBranch={statusInfo.gitBranch}
              collaborators={statusInfo.collaborators}
              isOnline={statusInfo.isOnline}
              currentTime={currentTime}
              terminalVisible={terminalVisible}
              onToggleTerminal={onToggleTerminal}
            />
          )}
        </TimeTrackingFeature>
      )}
    </StatusInfoFeature>
  );
}

// Export UI component for custom usage
export { StatusBarUI } from './components/StatusBarUI';
