// useEnhancedMonacoConfig.js - Enhanced Monaco configuration with custom token styling
import { useCallback, useEffect, useRef } from "react";

export function useEnhancedMonacoConfig() {
  const customThemeRegistered = useRef(new Set());

  const registerCustomTheme = useCallback((monaco, themeData, themeName) => {
    const themeId = `custom-${themeName}`;
    
    // Only register if not already registered
    if (customThemeRegistered.current.has(themeId)) {
      return themeId;
    }

    // Convert our theme format to Monaco theme format
    const monacoTheme = {
      base: themeData.type === 'dark' ? 'vs-dark' : 'vs',
      inherit: true,
      rules: Object.entries(themeData.tokenColors).map(([token, color]) => ({
        token: token.replace(/\./g, '.'),
        foreground: color.replace('#', ''),
        fontStyle: themeData.tokenStyles?.[token]?.fontStyle || '',
      })),
      colors: {
        'editor.background': themeData.background,
        'editor.foreground': themeData.foreground,
        'editor.lineHighlightBackground': themeData.type === 'dark' ? '#2a2d2e' : '#f0f0f0',
        'editor.selectionBackground': themeData.selection,
        'editorLineNumber.foreground': themeData.lineNumber,
        'editorLineNumber.activeForeground': themeData.foreground,
      }
    };

    monaco.editor.defineTheme(themeId, monacoTheme);
    customThemeRegistered.current.add(themeId);
    
    return themeId;
  }, []);

  const enhanceMonacoOptions = useCallback((baseOptions, themeData, languageInfo) => {
    return {
      ...baseOptions,
      // Enhanced readability options
      renderWhitespace: 'selection',
      renderControlCharacters: true,
      renderIndentGuides: true,
      renderValidationDecorations: 'on',
      
      // Enhanced editing experience
      wordBasedSuggestions: 'allDocuments',
      quickSuggestions: {
        other: true,
        comments: languageInfo?.detectedLanguage !== 'plaintext',
        strings: true
      },
      
      // Language-specific optimizations
      ...(languageInfo?.detectedLanguage === 'python' && {
        tabSize: 4,
        insertSpaces: true,
        detectIndentation: false,
      }),
      
      ...(languageInfo?.detectedLanguage === 'javascript' && {
        tabSize: 2,
        insertSpaces: true,
        formatOnType: true,
        formatOnPaste: true,
      }),
      
      ...(languageInfo?.detectedLanguage === 'typescript' && {
        tabSize: 2,
        insertSpaces: true,
        formatOnType: true,
        formatOnPaste: true,
        inlayHints: { enabled: 'on' },
      }),
      
      // Enhanced visual features
      fontLigatures: true,
      smoothScrolling: true,
      cursorSmoothCaretAnimation: 'on',
      cursorBlinking: 'smooth',
      
      // Better minimap
      minimap: {
        enabled: true,
        maxColumn: 120,
        renderCharacters: languageInfo?.detectedLanguage !== 'plaintext',
        showSlider: 'mouseover',
      },
      
      // Enhanced folding
      foldingStrategy: 'indentation',
      showFoldingControls: 'mouseover',
      foldingHighlight: true,
      
      // Better bracket matching
      matchBrackets: 'always',
      guides: {
        bracketPairs: true,
        bracketPairsHorizontal: true,
        highlightActiveBracketPair: true,
        indentation: true,
      },
    };
  }, []);

  const addCustomTokenProviders = useCallback((monaco, language) => {
    // Add custom token providers for enhanced highlighting
    try {
      if (language === 'javascript' || language === 'typescript') {
        // Enhanced JavaScript/TypeScript token recognition
        monaco.languages.setTokensProvider(language, {
          getInitialState: () => ({ 
            inComment: false,
            clone: function() {
              return { ...this, clone: this.clone, equals: this.equals };
            },
            equals: function(other) {
              return other && this.inComment === other.inComment;
            }
          }),
          tokenize: (line, state) => {
            try {
              const tokens = [];
              let currentIndex = 0;
              
              // Simple tokenization for demonstration
              // In a real implementation, you'd use a proper lexer
              const patterns = [
                { regex: /\/\*[\s\S]*?\*\/|\/\/.*$/g, type: 'comment' },
                { regex: /\b(function|class|const|let|var|if|else|for|while|return|import|export|default)\b/g, type: 'keyword' },
                { regex: /\b(true|false|null|undefined)\b/g, type: 'constant' },
                { regex: /"[^"]*"|'[^']*'|`[^`]*`/g, type: 'string' },
                { regex: /\b\d+(\.\d+)?\b/g, type: 'number' },
                { regex: /\b[A-Z][a-zA-Z0-9]*\b/g, type: 'type' },
              ];
              
              for (const pattern of patterns) {
                // Reset regex lastIndex to avoid issues with global regexes
                pattern.regex.lastIndex = 0;
                let match;
                while ((match = pattern.regex.exec(line)) !== null) {
                  if (match.index >= currentIndex) {
                    tokens.push({
                      startIndex: match.index,
                      scopes: pattern.type
                    });
                  }
                  // Prevent infinite loops with zero-width matches
                  if (match.index === pattern.regex.lastIndex) {
                    pattern.regex.lastIndex++;
                  }
                }
              }
              
              // Create a new state object that has a clone and equals method
              const newState = {
                ...state,
                clone: function() {
                  return { ...this, clone: this.clone, equals: this.equals };
                },
                equals: function(other) {
                  return other && this.inComment === other.inComment;
                }
              };
              
              return {
                tokens: tokens.sort((a, b) => a.startIndex - b.startIndex),
                endState: newState
              };
            } catch (error) {
              console.warn('Tokenization error:', error);
              const fallbackState = {
                inComment: false,
                clone: function() {
                  return { ...this, clone: this.clone, equals: this.equals };
                },
                equals: function(other) {
                  return other && this.inComment === other.inComment;
                }
              };
              return {
                tokens: [],
                endState: fallbackState
              };
            }
          }
        });
      }
    } catch (error) {
      console.warn('Failed to set custom token provider:', error);
    }
  }, []);

  const setupEnhancedFeatures = useCallback((editor, monaco, themeData, languageInfo) => {
    // Add custom commands
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD, () => {
      // Duplicate line
      const selection = editor.getSelection();
      const lineContent = editor.getModel().getLineContent(selection.startLineNumber);
      editor.executeEdits('duplicate-line', [{
        range: new monaco.Range(selection.endLineNumber, Number.MAX_VALUE, selection.endLineNumber, Number.MAX_VALUE),
        text: '\n' + lineContent
      }]);
    });

    // Add enhanced hover provider
    monaco.languages.registerHoverProvider(languageInfo.detectedLanguage, {
      provideHover: (model, position) => {
        const word = model.getWordAtPosition(position);
        if (!word) return null;

        // Provide enhanced hover information
        return {
          range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
          contents: [
            { value: `**${word.word}**` },
            { value: `Language: ${languageInfo.getLanguageDisplayName(languageInfo.detectedLanguage)}` },
            { value: `Confidence: ${languageInfo.confidence}` }
          ]
        };
      }
    });

    // Add custom token styling via CSS
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .monaco-editor .token.keyword { font-weight: bold !important; }
      .monaco-editor .token.comment { font-style: italic !important; opacity: 0.8 !important; }
      .monaco-editor .token.string { color: ${themeData.tokenColors.string || themeData.foreground} !important; }
      .monaco-editor .token.function { font-weight: 600 !important; }
      .monaco-editor .token.class { font-weight: 600 !important; text-decoration: underline dotted !important; }
    `;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return {
    registerCustomTheme,
    enhanceMonacoOptions,
    addCustomTokenProviders,
    setupEnhancedFeatures
  };
}
