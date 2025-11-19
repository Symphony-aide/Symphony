// useThemeManagement.js - Hook for managing syntax highlighting themes

import { useMemo, useCallback } from 'react';

// Built-in themes
const BUILTIN_THEMES = {
  dark: {
    name: 'Dark Theme',
    type: 'dark',
    colors: {
      'editor.background': '#1e1e1e',
      'editor.foreground': '#d4d4d4',
      'editor.lineHighlightBackground': '#2d2d30',
      'editorLineNumber.foreground': '#858585',
      'editorLineNumber.activeForeground': '#c6c6c6',
    },
    tokenColors: [
      { scope: 'keyword', settings: { foreground: '#569cd6' } },
      { scope: 'keyword.control', settings: { foreground: '#c586c0' } },
      { scope: 'storage.type', settings: { foreground: '#569cd6' } },
      { scope: 'storage.modifier', settings: { foreground: '#569cd6' } },
      { scope: 'string', settings: { foreground: '#ce9178' } },
      { scope: 'string.quoted', settings: { foreground: '#ce9178' } },
      { scope: 'string.template', settings: { foreground: '#ce9178' } },
      { scope: 'comment', settings: { foreground: '#6a9955', fontStyle: 'italic' } },
      { scope: 'comment.line', settings: { foreground: '#6a9955', fontStyle: 'italic' } },
      { scope: 'comment.block', settings: { foreground: '#6a9955', fontStyle: 'italic' } },
      { scope: 'constant', settings: { foreground: '#b5cea8' } },
      { scope: 'constant.numeric', settings: { foreground: '#b5cea8' } },
      { scope: 'constant.language', settings: { foreground: '#569cd6' } },
      { scope: 'constant.character.escape', settings: { foreground: '#d7ba7d' } },
      { scope: 'entity.name.function', settings: { foreground: '#dcdcaa' } },
      { scope: 'entity.name.class', settings: { foreground: '#4ec9b0' } },
      { scope: 'entity.name.type', settings: { foreground: '#4ec9b0' } },
      { scope: 'entity.name.tag', settings: { foreground: '#569cd6' } },
      { scope: 'entity.other.attribute-name', settings: { foreground: '#9cdcfe' } },
      { scope: 'variable', settings: { foreground: '#9cdcfe' } },
      { scope: 'variable.other', settings: { foreground: '#9cdcfe' } },
      { scope: 'support.type.property-name', settings: { foreground: '#9cdcfe' } },
      { scope: 'support.constant', settings: { foreground: '#b5cea8' } },
    ]
  },
  
  light: {
    name: 'Light Theme',
    type: 'light',
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#000000',
      'editor.lineHighlightBackground': '#f0f0f0',
      'editorLineNumber.foreground': '#237893',
      'editorLineNumber.activeForeground': '#0b216f',
    },
    tokenColors: [
      { scope: 'keyword', settings: { foreground: '#0000ff' } },
      { scope: 'keyword.control', settings: { foreground: '#af00db' } },
      { scope: 'storage.type', settings: { foreground: '#0000ff' } },
      { scope: 'storage.modifier', settings: { foreground: '#0000ff' } },
      { scope: 'string', settings: { foreground: '#a31515' } },
      { scope: 'string.quoted', settings: { foreground: '#a31515' } },
      { scope: 'string.template', settings: { foreground: '#a31515' } },
      { scope: 'comment', settings: { foreground: '#008000', fontStyle: 'italic' } },
      { scope: 'comment.line', settings: { foreground: '#008000', fontStyle: 'italic' } },
      { scope: 'comment.block', settings: { foreground: '#008000', fontStyle: 'italic' } },
      { scope: 'constant', settings: { foreground: '#09885a' } },
      { scope: 'constant.numeric', settings: { foreground: '#09885a' } },
      { scope: 'constant.language', settings: { foreground: '#0000ff' } },
      { scope: 'constant.character.escape', settings: { foreground: '#ee0000' } },
      { scope: 'entity.name.function', settings: { foreground: '#795e26' } },
      { scope: 'entity.name.class', settings: { foreground: '#267f99' } },
      { scope: 'entity.name.type', settings: { foreground: '#267f99' } },
      { scope: 'entity.name.tag', settings: { foreground: '#800000' } },
      { scope: 'entity.other.attribute-name', settings: { foreground: '#ff0000' } },
      { scope: 'variable', settings: { foreground: '#001080' } },
      { scope: 'variable.other', settings: { foreground: '#001080' } },
      { scope: 'support.type.property-name', settings: { foreground: '#ff0000' } },
      { scope: 'support.constant', settings: { foreground: '#09885a' } },
    ]
  },

  'high-contrast': {
    name: 'High Contrast',
    type: 'dark',
    colors: {
      'editor.background': '#000000',
      'editor.foreground': '#ffffff',
      'editor.lineHighlightBackground': '#1a1a1a',
      'editorLineNumber.foreground': '#ffffff',
      'editorLineNumber.activeForeground': '#ffffff',
    },
    tokenColors: [
      { scope: 'keyword', settings: { foreground: '#00ffff' } },
      { scope: 'keyword.control', settings: { foreground: '#ff00ff' } },
      { scope: 'string', settings: { foreground: '#00ff00' } },
      { scope: 'comment', settings: { foreground: '#7f7f7f', fontStyle: 'italic' } },
      { scope: 'constant', settings: { foreground: '#ffff00' } },
      { scope: 'entity.name.function', settings: { foreground: '#ffff00' } },
      { scope: 'entity.name.class', settings: { foreground: '#00ffff' } },
      { scope: 'variable', settings: { foreground: '#ffffff' } },
    ]
  }
};

/**
 * Hook for managing syntax highlighting themes
 * @param {Object} options - Configuration options
 * @param {string} options.themeName - Theme name ('dark', 'light', 'high-contrast')
 * @param {Object} options.customTheme - Custom theme object
 * @returns {Object} Theme management utilities
 */
export function useThemeManagement({
  themeName = 'dark',
  customTheme = null
} = {}) {
  // Get theme object
  const getTheme = useCallback((name) => {
    return BUILTIN_THEMES[name] || BUILTIN_THEMES.dark;
  }, []);

  // Parse theme colors
  const parseThemeColors = useCallback((theme) => {
    const colors = theme.colors || {};
    const tokenColors = {};
    
    // Parse token colors
    if (theme.tokenColors) {
      for (const tokenColor of theme.tokenColors) {
        if (tokenColor.scope && tokenColor.settings) {
          const scopes = Array.isArray(tokenColor.scope) ? tokenColor.scope : [tokenColor.scope];
          for (const scope of scopes) {
            tokenColors[scope] = tokenColor.settings.foreground || colors['editor.foreground'] || '#d4d4d4';
          }
        }
      }
    }
    
    return {
      type: theme.type || 'dark',
      background: colors['editor.background'] || '#1e1e1e',
      foreground: colors['editor.foreground'] || '#d4d4d4',
      lineHighlight: colors['editor.lineHighlightBackground'] || '#2d2d30',
      lineNumber: colors['editorLineNumber.foreground'] || '#858585',
      lineNumberActive: colors['editorLineNumber.activeForeground'] || '#c6c6c6',
      tokenColors
    };
  }, []);

  // Get current theme data
  const themeData = useMemo(() => {
    const theme = customTheme || getTheme(themeName);
    const colors = parseThemeColors(theme);
    
    return {
      ...colors,
      name: theme.name,
      getTokenColor: (scopes) => {
        // Find the most specific color for the given scopes
        for (const scope of scopes) {
          if (colors.tokenColors[scope]) {
            return colors.tokenColors[scope];
          }
          
          // Try partial matches (e.g., 'keyword' matches 'keyword.control')
          const partialMatch = Object.keys(colors.tokenColors).find(key => 
            scope.startsWith(key) || key.startsWith(scope)
          );
          
          if (partialMatch) {
            return colors.tokenColors[partialMatch];
          }
        }
        
        // Return default foreground color
        return colors.foreground;
      }
    };
  }, [themeName, customTheme, getTheme, parseThemeColors]);

  // Get available themes
  const getAvailableThemes = useCallback(() => {
    return Object.keys(BUILTIN_THEMES).map(key => ({
      id: key,
      name: BUILTIN_THEMES[key].name,
      type: BUILTIN_THEMES[key].type
    }));
  }, []);

  // Create custom theme
  const createCustomTheme = useCallback((name, baseTheme, overrides) => {
    const base = getTheme(baseTheme);
    return {
      name,
      type: overrides.type || base.type,
      colors: {
        ...base.colors,
        ...overrides.colors
      },
      tokenColors: [
        ...(base.tokenColors || []),
        ...(overrides.tokenColors || [])
      ]
    };
  }, [getTheme]);

  // Get token color with fallback
  const getTokenColorWithFallback = useCallback((scopes, fallback) => {
    const color = themeData.getTokenColor(scopes);
    return color || fallback || themeData.foreground;
  }, [themeData]);

  // Check if theme is dark
  const isDarkTheme = themeData.type === 'dark';

  // Check if theme is light
  const isLightTheme = themeData.type === 'light';

  return {
    themeData,
    isDarkTheme,
    isLightTheme,
    getTheme,
    getAvailableThemes,
    createCustomTheme,
    getTokenColorWithFallback,
    parseThemeColors
  };
}
