/**
 * @fileoverview Hook for tracking and analyzing command history
 */

import { useState, useEffect, useRef } from 'react';
import { useCommand } from '../CommandContext.jsx';

/**
 * Hook for tracking command execution history and analytics
 * Provides insights into user actions and command patterns
 * @param {Object} options - History tracking options
 * @returns {Object} History data and utilities
 */
export function useCommandHistory(options = {}) {
  const { commandManager } = useCommand();
  const {
    maxHistorySize = 100,
    trackComponents = true,
    trackTimings = true,
    enableAnalytics = false
  } = options;

  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalCommands: 0,
    componentStats: {},
    averageExecutionTime: 0,
    mostUsedCommands: {},
    undoRedoRatio: { undos: 0, redos: 0 }
  });

  const historyRef = useRef([]);
  const startTimeRef = useRef(null);

  // Track command executions
  useEffect(() => {
    if (!commandManager) return;

    const trackCommand = () => {
      const recentCommands = commandManager.getRecentCommands(1);
      if (recentCommands.length === 0) return;

      const command = recentCommands[0];
      const entry = {
        id: command.id,
        description: command.description,
        component: command.component,
        timestamp: command.timestamp,
        executionTime: trackTimings && startTimeRef.current 
          ? Date.now() - startTimeRef.current 
          : null
      };

      // Add to history
      historyRef.current.push(entry);
      
      // Trim history if needed
      if (historyRef.current.length > maxHistorySize) {
        historyRef.current = historyRef.current.slice(-maxHistorySize);
      }

      setHistory([...historyRef.current]);

      // Update analytics if enabled
      if (enableAnalytics) {
        updateAnalytics(entry);
      }

      startTimeRef.current = null;
    };

    // Track command start time
    const originalExecute = commandManager.executeCommand;
    commandManager.executeCommand = async (command) => {
      if (trackTimings) {
        startTimeRef.current = Date.now();
      }
      return originalExecute.call(commandManager, command);
    };

    commandManager.addListener(trackCommand);

    return () => {
      commandManager.removeListener(trackCommand);
      // Restore original execute method
      commandManager.executeCommand = originalExecute;
    };
  }, [commandManager, maxHistorySize, trackTimings, enableAnalytics]);

  // Update analytics data
  const updateAnalytics = (entry) => {
    setAnalytics(prev => {
      const newStats = { ...prev };
      
      // Total commands
      newStats.totalCommands++;
      
      // Component stats
      if (trackComponents) {
        newStats.componentStats[entry.component] = 
          (newStats.componentStats[entry.component] || 0) + 1;
      }
      
      // Most used commands
      newStats.mostUsedCommands[entry.id] = 
        (newStats.mostUsedCommands[entry.id] || 0) + 1;
      
      // Execution time average
      if (entry.executionTime) {
        const totalTime = prev.averageExecutionTime * (prev.totalCommands - 1);
        newStats.averageExecutionTime = (totalTime + entry.executionTime) / newStats.totalCommands;
      }
      
      // Undo/redo tracking
      if (entry.id === 'undo') {
        newStats.undoRedoRatio.undos++;
      } else if (entry.id === 'redo') {
        newStats.undoRedoRatio.redos++;
      }
      
      return newStats;
    });
  };

  // Get commands by component
  const getCommandsByComponent = (component) => {
    return history.filter(entry => entry.component === component);
  };

  // Get commands by time range
  const getCommandsByTimeRange = (startTime, endTime) => {
    return history.filter(entry => 
      entry.timestamp >= startTime && entry.timestamp <= endTime
    );
  };

  // Get most recent commands
  const getRecentCommands = (count = 10) => {
    return history.slice(-count);
  };

  // Get command frequency
  const getCommandFrequency = () => {
    const frequency = {};
    history.forEach(entry => {
      frequency[entry.id] = (frequency[entry.id] || 0) + 1;
    });
    return frequency;
  };

  // Get component usage
  const getComponentUsage = () => {
    const usage = {};
    history.forEach(entry => {
      usage[entry.component] = (usage[entry.component] || 0) + 1;
    });
    return usage;
  };

  // Clear history
  const clearHistory = () => {
    historyRef.current = [];
    setHistory([]);
    setAnalytics({
      totalCommands: 0,
      componentStats: {},
      averageExecutionTime: 0,
      mostUsedCommands: {},
      undoRedoRatio: { undos: 0, redos: 0 }
    });
  };

  // Export history data
  const exportHistory = (format = 'json') => {
    const data = {
      history,
      analytics,
      exportedAt: new Date().toISOString(),
      options: { maxHistorySize, trackComponents, trackTimings, enableAnalytics }
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else if (format === 'csv') {
      const headers = ['timestamp', 'id', 'description', 'component', 'executionTime'];
      const rows = history.map(entry => [
        new Date(entry.timestamp).toISOString(),
        entry.id,
        entry.description,
        entry.component,
        entry.executionTime || ''
      ]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return data;
  };

  return {
    // History data
    history,
    analytics,
    
    // Query methods
    getCommandsByComponent,
    getCommandsByTimeRange,
    getRecentCommands,
    getCommandFrequency,
    getComponentUsage,
    
    // Utility methods
    clearHistory,
    exportHistory,
    
    // Stats
    totalCommands: history.length,
    uniqueCommands: new Set(history.map(entry => entry.id)).size,
    uniqueComponents: new Set(history.map(entry => entry.component)).size
  };
}
