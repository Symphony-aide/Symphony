// useTimeTracking.js - Hook for tracking and formatting time

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for tracking current time and formatting timestamps
 * @param {Object} options - Configuration options
 * @param {number} options.updateInterval - Update interval in milliseconds (default: 60000 = 1 minute)
 * @param {string} options.timeFormat - Time format options for toLocaleTimeString
 * @returns {Object} Time tracking utilities
 */
export function useTimeTracking({
  updateInterval = 60000,
  timeFormat = { hour: '2-digit', minute: '2-digit' }
} = {}) {
  const [currentTime, setCurrentTime] = useState('');

  // Update current time
  const updateTime = useCallback(() => {
    const now = new Date();
    setCurrentTime(now.toLocaleTimeString([], timeFormat));
  }, [timeFormat]);

  // Set up interval for time updates
  useEffect(() => {
    updateTime();
    const interval = setInterval(updateTime, updateInterval);
    
    return () => clearInterval(interval);
  }, [updateTime, updateInterval]);

  // Format a timestamp to relative time
  const formatRelativeTime = useCallback((timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const target = new Date(timestamp);
    const diffMs = now - target;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffSecs < 10) return 'Just now';
    if (diffSecs < 60) return `${diffSecs} seconds ago`;
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }, []);

  // Format a timestamp to absolute time
  const formatAbsoluteTime = useCallback((timestamp, options = {}) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], options);
  }, []);

  // Format a timestamp to date string
  const formatDate = useCallback((timestamp, options = {}) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleDateString([], options);
  }, []);

  // Format a timestamp to full date and time
  const formatDateTime = useCallback((timestamp, options = {}) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleString([], options);
  }, []);

  // Get time difference in milliseconds
  const getTimeDiff = useCallback((timestamp1, timestamp2 = new Date()) => {
    const date1 = new Date(timestamp1);
    const date2 = new Date(timestamp2);
    return date2 - date1;
  }, []);

  // Check if timestamp is today
  const isToday = useCallback((timestamp) => {
    if (!timestamp) return false;
    
    const date = new Date(timestamp);
    const today = new Date();
    
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }, []);

  // Check if timestamp is within last N minutes
  const isWithinMinutes = useCallback((timestamp, minutes) => {
    if (!timestamp) return false;
    
    const diffMs = getTimeDiff(timestamp);
    return diffMs < minutes * 60000;
  }, [getTimeDiff]);

  return {
    currentTime,
    updateTime,
    formatRelativeTime,
    formatAbsoluteTime,
    formatDate,
    formatDateTime,
    getTimeDiff,
    isToday,
    isWithinMinutes
  };
}
