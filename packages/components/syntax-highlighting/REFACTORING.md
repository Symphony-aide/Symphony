# Syntax Highlighting Package Refactoring Documentation

## Overview

The `@symphony/syntax-highlighting` package has been refactored to follow the **[Page, Feature, Component]** architecture pattern, separating business logic into three reusable features and creating a pure UI component.

## Documentation Date
January 13, 2025

## Refactoring Summary

### Before Refactoring
- **1 Main Component**: `SyntaxHighlighter.jsx` (120 lines)
- **4 Hooks**: useLanguageDetection, useTextMateGrammar, useTokenizer, useThemeManager
- **4 Utility Files**: languageMap, grammarRegistry, tokenTypes, themeParser
- **Mixed concerns**: Language detection + tokenization + theming + UI rendering

### After Refactoring
- **3 Features**: LanguageDetection, SyntaxTokenization, ThemeManagement
- **1 Pure UI Component**: SyntaxHighlighterUI
- **1 Integrated Component**: SyntaxHighlighter (refactored)
- **Clear separation**: Business logic in features, UI in components
- **Highly reusable**: Features can be used independently

## Architecture

### Component Hierarchy

```
SyntaxHighlighter (Integrated Component)
├── LanguageDetectionFeature (Business Logic)
│   └── useLanguageDetection hook
│       ├── Extension-based detection
│       ├── Content-based detection
│       └── Language display names
├── TextMate Grammar Loading (Original Hook)
│   └── useTextMateGrammar hook
├── ThemeManagementFeature (Business Logic)
│   └── useThemeManagement hook
│       ├── Built-in themes (dark, light, high-contrast)
│       ├── Custom theme support
│       └── Token color resolution
└── SyntaxTokenizationFeature (Business Logic)
    └── useSyntaxTokenization hook
        ├── Grammar-based tokenization
        ├── Token merging
        └── Fallback to plain text
    └── SyntaxHighlighterUI (Pure UI)
        ├── Token rendering
        ├── Line numbers
        └── Theme styling
```

### Package Structure

```
packages/
├── features/
│   └── src/
│       ├── LanguageDetection/
│       │   ├── hooks/useLanguageDetection.js
│       │   ├── LanguageDetectionFeature.jsx
│       │   └── index.js
│       ├── SyntaxTokenization/
│       │   ├── hooks/useSyntaxTokenization.js
│       │   ├── SyntaxTokenizationFeature.jsx
│       │   └── index.js
│       └── ThemeManagement/
│           ├── hooks/useThemeManagement.js
│           ├── ThemeManagementFeature.jsx
│           └── index.js
└── components/
    └── syntax-highlighting/
        └── src/
            ├── components/
            │   └── SyntaxHighlighterUI.jsx
            ├── hooks/
            │   ├── useLanguageDetection.js (original)
            │   ├── useTextMateGrammar.js (kept)
            │   ├── useTokenizer.js (original)
            │   └── useThemeManager.js (original)
            ├── utils/ (kept for backward compatibility)
            ├── SyntaxHighlighter.jsx (original)
            └── SyntaxHighlighter.refactored.jsx (new)
```

## Features Extracted

### 1. LanguageDetection Feature

**Location**: `packages/features/src/LanguageDetection/`

**Purpose**: Detects programming languages from file names, extensions, and code content.

**Exports**:
- `LanguageDetectionFeature` - Feature component with render props
- `useLanguageDetection` - Hook for direct usage

**API**:
```javascript
const {
  language,              // Detected language
  source,                // Detection source ('explicit', 'extension', 'content', 'default')
  confidence,            // Confidence level ('high', 'medium', 'low', 'none')
  alternatives,          // Alternative languages
  displayName,           // Human-readable language name
  isSupported,           // Whether language is supported
  detectFromExtension,   // Detect from file extension
  detectFromContent,     // Detect from code content
  getLanguageDisplayName,// Get display name for language
  isLanguageSupported,   // Check if language is supported
  getSupportedLanguages  // Get all supported languages
} = useLanguageDetection(options);
```

**Features**:
- ✅ 40+ language extensions supported
- ✅ Content-based detection with patterns
- ✅ Confidence levels for detection accuracy
- ✅ Alternative language suggestions
- ✅ Human-readable display names

**Supported Languages**:
JavaScript, TypeScript, Python, HTML, CSS, Java, C#, C++, C, Shell, PowerShell, PHP, Ruby, Go, Rust, Swift, Kotlin, Scala, SQL, R, MATLAB, Perl, Lua, and more.

### 2. SyntaxTokenization Feature

**Location**: `packages/features/src/SyntaxTokenization/`

**Purpose**: Tokenizes code for syntax highlighting using TextMate grammars.

**Exports**:
- `SyntaxTokenizationFeature` - Feature component with render props
- `useSyntaxTokenization` - Hook for direct usage

**API**:
```javascript
const {
  tokens,              // Tokenized code (array of lines)
  tokenize,            // Tokenize entire code
  tokenizeLine,        // Tokenize single line
  getTokenClasses,     // Get CSS classes for token scopes
  getStatistics,       // Get tokenization statistics
  hasTokens,           // Whether code has been tokenized
  lineCount            // Number of lines
} = useSyntaxTokenization(options);
```

**Features**:
- ✅ TextMate grammar-based tokenization
- ✅ Token merging for performance
- ✅ Fallback to plain text
- ✅ Scope-based styling
- ✅ Statistics and metrics

### 3. ThemeManagement Feature

**Location**: `packages/features/src/ThemeManagement/`

**Purpose**: Manages syntax highlighting themes and token colors.

**Exports**:
- `ThemeManagementFeature` - Feature component with render props
- `useThemeManagement` - Hook for direct usage

**API**:
```javascript
const {
  themeData,                   // Current theme data
  isDarkTheme,                 // Whether theme is dark
  isLightTheme,                // Whether theme is light
  getTheme,                    // Get theme by name
  getAvailableThemes,          // Get all available themes
  createCustomTheme,           // Create custom theme
  getTokenColorWithFallback,   // Get token color with fallback
  parseThemeColors             // Parse theme colors
} = useThemeManagement(options);
```

**Built-in Themes**:
- **dark**: VS Code Dark+ theme
- **light**: VS Code Light+ theme
- **high-contrast**: High contrast theme

**Features**:
- ✅ Built-in themes
- ✅ Custom theme support
- ✅ Token color resolution
- ✅ Scope-based coloring
- ✅ Fallback colors

## Component Refactoring

### SyntaxHighlighterUI Component

**Location**: `packages/components/syntax-highlighting/src/components/SyntaxHighlighterUI.jsx`

**Purpose**: Pure presentational component for rendering syntax-highlighted code.

**Characteristics**:
- ✅ **Pure UI**: No business logic
- ✅ **Stateless**: All state passed via props
- ✅ **Testable**: Easy to test with different props
- ✅ **Reusable**: Can be used with any data source

**Props**:
```javascript
{
  tokens: Array,              // Tokenized code
  themeData: Object,          // Theme data
  getTokenClasses: Function,  // Token class resolver
  language: string,           // Programming language
  showLineNumbers: boolean,   // Show line numbers
  lineNumberStart: number,    // Starting line number
  className: string,          // Additional CSS classes
  code: string                // Original code (fallback)
}
```

### Integrated SyntaxHighlighter Component

**Location**: `packages/components/syntax-highlighting/src/SyntaxHighlighter.refactored.jsx`

**Pattern**:
```
SyntaxHighlighter (Props)
  → LanguageDetectionFeature (Detect language)
    → useTextMateGrammar (Load grammar)
      → ThemeManagementFeature (Apply theme)
        → SyntaxTokenizationFeature (Tokenize code)
          → SyntaxHighlighterUI (Render UI)
```

## Migration Guide

### Option 1: Drop-in Replacement (Recommended)

Replace the old SyntaxHighlighter with the refactored version:

```javascript
// Before
import { SyntaxHighlighter } from '@symphony/syntax-highlighting';

// After
import { SyntaxHighlighterRefactored as SyntaxHighlighter } from '@symphony/syntax-highlighting';

// Usage stays the same
<SyntaxHighlighter
  code={codeContent}
  fileName="index.js"
  theme="dark"
  showLineNumbers={true}
/>
```

### Option 2: Use Features Directly

For more control, use features directly:

```javascript
import {
  LanguageDetectionFeature,
  SyntaxTokenizationFeature,
  ThemeManagementFeature
} from '@symphony/features';
import { SyntaxHighlighterUI } from '@symphony/syntax-highlighting';

function CustomHighlighter({ code, fileName }) {
  return (
    <LanguageDetectionFeature fileName={fileName} code={code}>
      {(languageAPI) => {
        const { grammar } = useTextMateGrammar(languageAPI.language);
        
        return (
          <ThemeManagementFeature themeName="dark">
            {(themeAPI) => (
              <SyntaxTokenizationFeature
                code={code}
                grammar={grammar}
                language={languageAPI.language}
              >
                {(tokenizationAPI) => (
                  <SyntaxHighlighterUI
                    tokens={tokenizationAPI.tokens}
                    themeData={themeAPI.themeData}
                    getTokenClasses={tokenizationAPI.getTokenClasses}
                    language={languageAPI.language}
                    showLineNumbers={true}
                    code={code}
                  />
                )}
              </SyntaxTokenizationFeature>
            )}
          </ThemeManagementFeature>
        );
      }}
    </LanguageDetectionFeature>
  );
}
```

### Option 3: Use Hooks Only

For maximum flexibility, use hooks directly:

```javascript
import {
  useLanguageDetection,
  useSyntaxTokenization,
  useThemeManagement
} from '@symphony/features';
import { useTextMateGrammar } from '@symphony/syntax-highlighting';

function MinimalHighlighter({ code, fileName }) {
  const { language } = useLanguageDetection({ fileName, code });
  const { grammar } = useTextMateGrammar(language);
  const { themeData } = useThemeManagement({ themeName: 'dark' });
  const { tokens, getTokenClasses } = useSyntaxTokenization({
    code,
    grammar,
    language
  });

  return (
    <div style={{ backgroundColor: themeData.background, color: themeData.foreground }}>
      {tokens.map((line, lineIndex) => (
        <div key={lineIndex}>
          {line.map((token, tokenIndex) => (
            <span
              key={tokenIndex}
              className={getTokenClasses(token.scopes)}
              style={{ color: themeData.getTokenColor(token.scopes) }}
            >
              {token.content}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
```

## Benefits of Refactoring

### 1. Separation of Concerns ⭐⭐⭐⭐⭐
- **Before**: Language detection + tokenization + theming + UI mixed
- **After**: Each concern isolated in its own feature

### 2. Reusability ⭐⭐⭐⭐⭐
- **Before**: Logic locked in SyntaxHighlighter component
- **After**: Features can be used independently:
  - LanguageDetection in file explorers, editors
  - SyntaxTokenization in code analysis tools
  - ThemeManagement in any syntax-aware component

### 3. Testability ⭐⭐⭐⭐⭐
- **Before**: Hard to test individual concerns
- **After**: Each feature and UI component testable independently

### 4. Maintainability ⭐⭐⭐⭐⭐
- **Before**: Changes affect entire component
- **After**: Changes isolated to specific features

### 5. Flexibility ⭐⭐⭐⭐⭐
- **Before**: Fixed implementation
- **After**: Multiple usage patterns (integrated, features, hooks)

## Testing Strategy

### Feature Tests

```javascript
// Test LanguageDetection feature
import { renderHook } from '@testing-library/react-hooks';
import { useLanguageDetection } from '@symphony/features';

describe('useLanguageDetection', () => {
  it('should detect language from file extension', () => {
    const { result } = renderHook(() => useLanguageDetection({
      fileName: 'index.js'
    }));

    expect(result.current.language).toBe('javascript');
    expect(result.current.source).toBe('extension');
    expect(result.current.confidence).toBe('high');
  });

  it('should detect language from content', () => {
    const { result } = renderHook(() => useLanguageDetection({
      code: 'def hello():\n    print("Hello")'
    }));

    expect(result.current.language).toBe('python');
    expect(result.current.source).toBe('content');
  });
});

// Test SyntaxTokenization feature
import { useSyntaxTokenization } from '@symphony/features';

describe('useSyntaxTokenization', () => {
  it('should tokenize code', () => {
    const { result } = renderHook(() => useSyntaxTokenization({
      code: 'const x = 5;',
      grammar: mockGrammar,
      language: 'javascript'
    }));

    expect(result.current.tokens).toHaveLength(1);
    expect(result.current.hasTokens).toBe(true);
  });
});

// Test ThemeManagement feature
import { useThemeManagement } from '@symphony/features';

describe('useThemeManagement', () => {
  it('should load dark theme', () => {
    const { result } = renderHook(() => useThemeManagement({
      themeName: 'dark'
    }));

    expect(result.current.themeData.type).toBe('dark');
    expect(result.current.isDarkTheme).toBe(true);
  });
});
```

### UI Component Tests

```javascript
// Test SyntaxHighlighterUI component
import { render, screen } from '@testing-library/react';
import { SyntaxHighlighterUI } from '@symphony/syntax-highlighting';

describe('SyntaxHighlighterUI', () => {
  it('should render tokens', () => {
    const tokens = [[
      { content: 'const', scopes: ['keyword'], startIndex: 0, endIndex: 5 },
      { content: ' x = 5;', scopes: ['source'], startIndex: 5, endIndex: 12 }
    ]];

    render(
      <SyntaxHighlighterUI
        tokens={tokens}
        themeData={mockThemeData}
        getTokenClasses={() => 'font-bold'}
        language="javascript"
      />
    );

    expect(screen.getByText('const')).toBeInTheDocument();
  });

  it('should show line numbers', () => {
    render(
      <SyntaxHighlighterUI
        tokens={[[{ content: 'test', scopes: ['source'], startIndex: 0, endIndex: 4 }]]}
        themeData={mockThemeData}
        getTokenClasses={() => ''}
        language="javascript"
        showLineNumbers={true}
        lineNumberStart={1}
      />
    );

    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
```

## Performance Considerations

### Tokenization Performance

- **Token Merging**: Adjacent tokens with same scope are merged for efficiency
- **Memoization**: Rendered lines are memoized to prevent unnecessary re-renders
- **Lazy Loading**: TextMate grammars loaded on demand

### Optimization Tips

1. **Use memoization for large files**:
```javascript
const memoizedTokens = useMemo(() => tokens, [code, grammar]);
```

2. **Debounce tokenization for live editing**:
```javascript
const debouncedCode = useDebounce(code, 300);
```

3. **Virtual scrolling for large files**:
```javascript
// Use react-window or react-virtualized for files > 1000 lines
```

## Backward Compatibility

The original `SyntaxHighlighter.jsx` is preserved for backward compatibility. To use the refactored version:

```javascript
// Old (still works)
import { SyntaxHighlighter } from '@symphony/syntax-highlighting';

// New (recommended)
import { SyntaxHighlighterRefactored as SyntaxHighlighter } from '@symphony/syntax-highlighting';
```

## UI Component Migration (December 2024)

The `SyntaxHighlighter.jsx` component has been updated to use `@symphony/ui` components instead of raw HTML elements, following Symphony's component migration initiative.

### Changes Made

| Before | After | Purpose |
|--------|-------|---------|
| `<div>` (outer container) | `<Box>` | Consistent layout primitive |
| `<div>` (line container) | `<Flex align="start">` | Flexbox layout for lines |
| `<span>` (line numbers) | `<Text as="span">` | Typography component |
| `<span>` (tokens) | `<Text as="span">` | Typography component |

### Benefits

- **Consistency**: Uses Symphony's design system primitives
- **Accessibility**: UI components include proper ARIA attributes
- **Maintainability**: Centralized styling through UI package
- **Type Safety**: Better TypeScript support through UI component props

### Example: Line Rendering

```jsx
// Before
<div className="flex items-start min-h-[1.4em] relative hover:bg-white/5">
  <span className="inline-block min-w-[2.5rem] pr-4 text-right select-none">
    {lineNumber}
  </span>
  <span className="flex-1 whitespace-pre break-words">
    {tokenContent}
  </span>
</div>

// After
<Flex align="start" className="min-h-[1.4em] relative hover:bg-white/5">
  <Text as="span" className="inline-block min-w-[2.5rem] pr-4 text-right select-none">
    {lineNumber}
  </Text>
  <Text as="span" className="flex-1 whitespace-pre break-words">
    {tokenContent}
  </Text>
</Flex>
```

## Future Enhancements

### Potential Features

1. **GrammarManagement Feature**
   - Dynamic grammar loading
   - Grammar caching
   - Custom grammar support

2. **CodeAnalysis Feature**
   - Syntax error detection
   - Code complexity metrics
   - Symbol extraction

3. **CodeFormatting Feature**
   - Auto-formatting
   - Indentation normalization
   - Code beautification

## Conclusion

The SyntaxHighlighting refactoring successfully demonstrates the [Page, Feature, Component] architecture pattern:

- ✅ **3 Features**: LanguageDetection, SyntaxTokenization, ThemeManagement
- ✅ **1 Pure UI Component**: SyntaxHighlighterUI
- ✅ **1 Integrated Component**: SyntaxHighlighter (refactored)
- ✅ **100% Pattern Compliance**: Follows architecture guidelines
- ✅ **Backward Compatible**: Original component preserved
- ✅ **Highly Reusable**: Features can be used independently
- ✅ **Well Tested**: Independent testing of features and UI
- ✅ **UI Component Migration**: Uses @symphony/ui primitives (Box, Flex, Text)

---

**Last Updated**: December 24, 2024  
**Author**: Symphony Development Team  
**Status**: Complete
