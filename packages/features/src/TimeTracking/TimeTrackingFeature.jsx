// TimeTrackingFeature.jsx - Feature component for time tracking

import React from 'react';
import { useTimeTracking } from './hooks/useTimeTracking';

/**
 * TimeTrackingFeature - Manages time tracking and formatting
 * 
 * This feature encapsulates all time-related logic including current time display,
 * relative time formatting, and timestamp utilities.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.children - Render prop function receiving time tracking API
 * @param {number} props.updateInterval - Update interval in milliseconds (default: 60000)
 * @param {Object} props.timeFormat - Time format options
 * @returns {React.Element} Rendered children with time tracking API
 * 
 * @example
 * <TimeTrackingFeature updateInterval={60000}>
 *   {({ currentTime, formatRelativeTime }) => (
 *     <div>
 *       <span>Current: {currentTime}</span>
 *       <span>Last saved: {formatRelativeTime(lastSaved)}</span>
 *     </div>
 *   )}
 * </TimeTrackingFeature>
 */
export function TimeTrackingFeature({
  children,
  updateInterval,
  timeFormat
}) {
  const timeTrackingAPI = useTimeTracking({
    updateInterval,
    timeFormat
  });

  return children(timeTrackingAPI);
}

// Export hook for direct usage
export { useTimeTracking } from './hooks/useTimeTracking';
