// useStatusInfo.js - Hook for managing status bar information

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for managing status bar information
 * @param {Object} options - Configuration options
 * @param {string} options.activeFileName - Currently active file name
 * @param {number} options.lineCount - Total number of lines in the file
 * @param {Object} options.cursorPosition - Cursor position { line, column }
 * @param {string} options.language - Programming language
 * @param {Date} options.lastSaved - Last saved timestamp
 * @param {string} options.gitBranch - Current git branch
 * @param {Array} options.collaborators - List of collaborators
 * @param {boolean} options.isOnline - Online status
 * @returns {Object} Status information and utilities
 */
export function useStatusInfo({
  activeFileName = null,
  lineCount = 0,
  cursorPosition = { line: 1, column: 1 },
  language = 'JavaScript',
  lastSaved = null,
  gitBranch = 'main',
  collaborators = [],
  isOnline = true
} = {}) {
  const [statusInfo, setStatusInfo] = useState({
    activeFileName,
    lineCount,
    cursorPosition,
    language,
    lastSaved,
    gitBranch,
    collaborators,
    isOnline
  });

  // Update status info when props change
  useEffect(() => {
    setStatusInfo({
      activeFileName,
      lineCount,
      cursorPosition,
      language,
      lastSaved,
      gitBranch,
      collaborators,
      isOnline
    });
  }, [activeFileName, lineCount, cursorPosition, language, lastSaved, gitBranch, collaborators, isOnline]);

  // Format last saved timestamp
  const formatLastSaved = useCallback((timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const saved = new Date(timestamp);
    const diffMs = now - saved;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 60) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  }, []);

  // Get formatted last saved text
  const lastSavedText = formatLastSaved(statusInfo.lastSaved);

  // Update cursor position
  const updateCursorPosition = useCallback((line, column) => {
    setStatusInfo(prev => ({
      ...prev,
      cursorPosition: { line, column }
    }));
  }, []);

  // Update active file
  const updateActiveFile = useCallback((fileName, language, lineCount) => {
    setStatusInfo(prev => ({
      ...prev,
      activeFileName: fileName,
      language: language || prev.language,
      lineCount: lineCount || prev.lineCount
    }));
  }, []);

  // Update last saved timestamp
  const updateLastSaved = useCallback((timestamp = new Date()) => {
    setStatusInfo(prev => ({
      ...prev,
      lastSaved: timestamp
    }));
  }, []);

  // Update git branch
  const updateGitBranch = useCallback((branch) => {
    setStatusInfo(prev => ({
      ...prev,
      gitBranch: branch
    }));
  }, []);

  // Update collaborators
  const updateCollaborators = useCallback((collaborators) => {
    setStatusInfo(prev => ({
      ...prev,
      collaborators
    }));
  }, []);

  // Update online status
  const updateOnlineStatus = useCallback((isOnline) => {
    setStatusInfo(prev => ({
      ...prev,
      isOnline
    }));
  }, []);

  return {
    statusInfo,
    lastSavedText,
    updateCursorPosition,
    updateActiveFile,
    updateLastSaved,
    updateGitBranch,
    updateCollaborators,
    updateOnlineStatus,
    formatLastSaved
  };
}
