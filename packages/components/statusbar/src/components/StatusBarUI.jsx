// StatusBarUI.jsx - Pure UI component for status bar

import React from 'react';
import { Terminal, GitBranch, Clock, Users, Zap } from 'lucide-react';
import { Button } from 'ui';

/**
 * StatusBarUI - Pure presentational component for the status bar
 * 
 * Displays file information, cursor position, language, git branch,
 * collaborators, online status, and current time.
 * 
 * @param {Object} props - Component props
 * @param {string} props.activeFileName - Currently active file name
 * @param {number} props.lineCount - Total number of lines
 * @param {Object} props.cursorPosition - Cursor position { line, column }
 * @param {string} props.language - Programming language
 * @param {string} props.lastSavedText - Formatted last saved text
 * @param {string} props.gitBranch - Current git branch
 * @param {Array} props.collaborators - List of collaborators
 * @param {boolean} props.isOnline - Online status
 * @param {string} props.currentTime - Current time string
 * @param {boolean} props.terminalVisible - Terminal visibility state
 * @param {Function} props.onToggleTerminal - Terminal toggle callback
 * @returns {React.Element} Status bar UI
 */
export function StatusBarUI({
  activeFileName,
  lineCount = 0,
  cursorPosition = { line: 1, column: 1 },
  language = 'JavaScript',
  lastSavedText = '',
  gitBranch = 'main',
  collaborators = [],
  isOnline = true,
  currentTime = '',
  terminalVisible = false,
  onToggleTerminal
}) {
  return (
    <div className='bg-symphony-primary text-white px-4 py-1 flex items-center justify-between text-sm border-t border-symphony-primary/20'>
      {/* Left side - File and editor information */}
      <div className='flex items-center space-x-4'>
        {/* Git branch */}
        <span className='flex items-center space-x-1'>
          <GitBranch className='w-3 h-3' />
          <span>{gitBranch}</span>
        </span>

        {/* Active file and line count */}
        {activeFileName && (
          <span className='text-symphony-light/80'>
            {activeFileName} • {lineCount} lines
          </span>
        )}

        {/* Cursor position */}
        <span className='flex items-center space-x-1 text-symphony-light/80'>
          <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
        </span>

        {/* Language */}
        <span className='text-symphony-light/80'>{language}</span>

        {/* Last saved */}
        {lastSavedText && (
          <span className='flex items-center space-x-1 text-symphony-light/80'>
            <Clock className='w-3 h-3' />
            <span>{lastSavedText}</span>
          </span>
        )}
      </div>

      {/* Right side - System information and controls */}
      <div className='flex items-center space-x-4'>
        {/* Terminal toggle */}
        <Button 
          onClick={onToggleTerminal} 
          variant="ghost"
          size="sm"
          className='flex items-center space-x-1 hover:text-white text-symphony-light/80 hover:bg-symphony-primary/20'
        >
          <Terminal className='w-3 h-3' />
          <span>{terminalVisible ? 'Hide Terminal' : 'Show Terminal'}</span>
        </Button>

        {/* Collaborators count */}
        {collaborators.length > 0 && (
          <span className='flex items-center space-x-1 text-symphony-light/80'>
            <Users className='w-3 h-3' />
            <span>{collaborators.length}</span>
          </span>
        )}

        {/* Online status */}
        <span className={`flex items-center space-x-1 ${isOnline ? 'text-symphony-emerald' : 'text-symphony-rose'}`}>
          <Zap className='w-3 h-3' />
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </span>

        {/* Current time */}
        <span className='text-symphony-light/60 text-xs'>
          {currentTime}
        </span>
      </div>
    </div>
  );
}
