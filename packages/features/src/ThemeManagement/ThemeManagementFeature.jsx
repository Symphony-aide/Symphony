// ThemeManagementFeature.jsx - Feature component for theme management

import React from 'react';
import { useThemeManagement } from './hooks/useThemeManagement';

/**
 * ThemeManagementFeature - Manages syntax highlighting themes
 * 
 * This feature encapsulates all logic related to managing themes for syntax highlighting,
 * including built-in themes, custom themes, and token color resolution.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.children - Render prop function receiving theme management API
 * @param {string} props.themeName - Theme name ('dark', 'light', 'high-contrast')
 * @param {Object} props.customTheme - Custom theme object
 * @returns {React.Element} Rendered children with theme management API
 * 
 * @example
 * <ThemeManagementFeature themeName="dark">
 *   {({ themeData, isDarkTheme, getTokenColorWithFallback }) => (
 *     <div style={{ backgroundColor: themeData.background, color: themeData.foreground }}>
 *       <span style={{ color: getTokenColorWithFallback(['keyword']) }}>
 *         const
 *       </span>
 *     </div>
 *   )}
 * </ThemeManagementFeature>
 */
export function ThemeManagementFeature({
  children,
  themeName,
  customTheme
}) {
  const themeAPI = useThemeManagement({
    themeName,
    customTheme
  });

  return children(themeAPI);
}

// Export hook for direct usage
export { useThemeManagement } from './hooks/useThemeManagement';
