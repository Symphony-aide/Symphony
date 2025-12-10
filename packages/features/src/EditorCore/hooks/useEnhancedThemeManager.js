// useEnhancedThemeManager.js - Enhanced theme management with token-level customization
import { useMemo, useCallback } from "react";

// Enhanced theme definitions with token-specific styling
const themes = {
  'vs-dark': {
    type: 'dark',
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    lineNumber: '#858585',
    selection: '#264f78',
    tokenColors: {
      'comment': '#6a9955',
      'keyword': '#569cd6',
      'keyword.control': '#c586c0',
      'string': '#ce9178',
      'number': '#b5cea8',
      'constant': '#4fc1ff',
      'entity.name.function': '#dcdcaa',
      'entity.name.class': '#4ec9b0',
      'entity.name.type': '#4ec9b0',
      'variable': '#9cdcfe',
      'variable.parameter': '#9cdcfe',
      'support.function': '#dcdcaa',
      'support.class': '#4ec9b0',
      'storage.type': '#569cd6',
      'punctuation': '#d4d4d4',
      'operator': '#d4d4d4',
    },
    tokenStyles: {
      'keyword': { fontWeight: 'bold' },
      'keyword.control': { fontWeight: 'bold', fontStyle: 'italic' },
      'comment': { fontStyle: 'italic', opacity: 0.8 },
      'string': { fontStyle: 'normal' },
      'entity.name.function': { fontWeight: '600' },
      'entity.name.class': { fontWeight: '600', textDecoration: 'underline', textDecorationStyle: 'dotted' },
      'constant': { fontWeight: '500' },
      'variable.parameter': { fontStyle: 'italic' },
    }
  },
  'vs-light': {
    type: 'light',
    background: '#ffffff',
    foreground: '#000000',
    lineNumber: '#237893',
    selection: '#add6ff',
    tokenColors: {
      'comment': '#008000',
      'keyword': '#0000ff',
      'keyword.control': '#af00db',
      'string': '#a31515',
      'number': '#098658',
      'constant': '#0070c1',
      'entity.name.function': '#795e26',
      'entity.name.class': '#267f99',
      'entity.name.type': '#267f99',
      'variable': '#001080',
      'variable.parameter': '#001080',
      'support.function': '#795e26',
      'support.class': '#267f99',
      'storage.type': '#0000ff',
      'punctuation': '#000000',
      'operator': '#000000',
    },
    tokenStyles: {
      'keyword': { fontWeight: 'bold' },
      'keyword.control': { fontWeight: 'bold', fontStyle: 'italic' },
      'comment': { fontStyle: 'italic', opacity: 0.8 },
      'string': { fontStyle: 'normal' },
      'entity.name.function': { fontWeight: '600' },
      'entity.name.class': { fontWeight: '600', textDecoration: 'underline', textDecorationStyle: 'dotted' },
      'constant': { fontWeight: '500' },
      'variable.parameter': { fontStyle: 'italic' },
    }
  },
  'high-contrast': {
    type: 'dark',
    background: '#000000',
    foreground: '#ffffff',
    lineNumber: '#ffffff',
    selection: '#ffffff',
    tokenColors: {
      'comment': '#7ca668',
      'keyword': '#569cd6',
      'keyword.control': '#c586c0',
      'string': '#ce9178',
      'number': '#b5cea8',
      'constant': '#4fc1ff',
      'entity.name.function': '#ffff00',
      'entity.name.class': '#4ec9b0',
      'entity.name.type': '#4ec9b0',
      'variable': '#ffffff',
      'variable.parameter': '#ffffff',
      'support.function': '#ffff00',
      'support.class': '#4ec9b0',
      'storage.type': '#569cd6',
      'punctuation': '#ffffff',
      'operator': '#ffffff',
    },
    tokenStyles: {
      'keyword': { fontWeight: 'bold' },
      'keyword.control': { fontWeight: 'bold', fontStyle: 'italic' },
      'comment': { fontStyle: 'italic' },
      'string': { fontStyle: 'normal' },
      'entity.name.function': { fontWeight: 'bold' },
      'entity.name.class': { fontWeight: 'bold', textDecoration: 'underline' },
      'constant': { fontWeight: 'bold' },
      'variable.parameter': { fontStyle: 'italic' },
    }
  }
};

export function useEnhancedThemeManager(themeName = "vs-dark", customTheme = null) {
  const themeData = useMemo(() => {
    // Use custom theme if provided, otherwise use built-in theme
    const theme = customTheme || themes[themeName] || themes['vs-dark'];
    
    return {
      ...theme,
      name: themeName,
      getTokenColor: (scopes) => {
        if (!scopes || scopes.length === 0) return theme.foreground;
        
        // Find the most specific color for the given scopes
        for (const scope of scopes) {
          if (theme.tokenColors[scope]) {
            return theme.tokenColors[scope];
          }
          
          // Try partial matches (e.g., 'keyword' matches 'keyword.control')
          const partialMatch = Object.keys(theme.tokenColors).find(key => 
            scope.startsWith(key) || key.startsWith(scope)
          );
          
          if (partialMatch) {
            return theme.tokenColors[partialMatch];
          }
        }
        
        // Return default foreground color
        return theme.foreground;
      },
      getTokenStyle: (scopes) => {
        if (!scopes || scopes.length === 0) return {};
        
        // Find the most specific style for the given scopes
        for (const scope of scopes) {
          if (theme.tokenStyles && theme.tokenStyles[scope]) {
            return theme.tokenStyles[scope];
          }
          
          // Try partial matches
          const partialMatch = Object.keys(theme.tokenStyles || {}).find(key => 
            scope.startsWith(key) || key.startsWith(scope)
          );
          
          if (partialMatch) {
            return theme.tokenStyles[partialMatch];
          }
        }
        
        return {};
      }
    };
  }, [themeName, customTheme]);

  const getAvailableThemes = useCallback(() => {
    return Object.keys(themes).map(key => ({
      id: key,
      name: key.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '),
      type: themes[key].type
    }));
  }, []);

  const createCustomTheme = useCallback((baseTheme, overrides) => {
    const base = themes[baseTheme] || themes['vs-dark'];
    return {
      ...base,
      ...overrides,
      tokenColors: {
        ...base.tokenColors,
        ...(overrides.tokenColors || {})
      },
      tokenStyles: {
        ...base.tokenStyles,
        ...(overrides.tokenStyles || {})
      }
    };
  }, []);

  return {
    themeData,
    getAvailableThemes,
    createCustomTheme,
    isHighContrast: themeName === 'high-contrast'
  };
}
