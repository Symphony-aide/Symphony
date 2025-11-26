# Monaco Editor Configuration for Symphony IDE

This document describes the Monaco Editor configuration implemented for Symphony IDE as part of the syntax-highlighting-lsp feature.

## Overview

Monaco Editor is fully configured with:
- ✅ TextMate grammar support for multiple languages
- ✅ Theme management (vs-dark, vs-light, custom themes)
- ✅ Performance optimizations for large files
- ✅ Virtual scrolling (enabled by default)
- ✅ Language-specific editor settings

## Supported Languages

The following languages are configured with TextMate grammars:

### Primary Languages (Requirement 1.3)
- **TypeScript** (.ts, .tsx)
- **JavaScript** (.js, .jsx, .mjs, .cjs)
- **Python** (.py, .pyw, .pyi)
- **Rust** (.rs)
- **Go** (.go)

### Additional Languages
- HTML, CSS, JSON, Markdown, YAML, XML, SQL, Shell

## Configuration Files

### `src/config/monacoConfig.ts` (376 lines)
Core configuration module providing comprehensive Monaco Editor settings:

**Exported Constants:**
- `SUPPORTED_LANGUAGES` - Object mapping language names to Monaco identifiers
- `LANGUAGE_EXTENSIONS` - Record mapping file extensions to languages (20+ extensions)
- `BUILT_IN_THEMES` - Theme configurations (vs-dark, vs-light, hc-black)
- `DEFAULT_EDITOR_OPTIONS` - Comprehensive default editor settings
- `LANGUAGE_SPECIFIC_OPTIONS` - Per-language editor configurations
- `PERFORMANCE_CONFIG` - Large file optimization settings

**Exported Types:**
- `SupportedLanguage` - Union type of all supported languages
- `ThemeConfig` - Interface for theme configuration
- `PerformanceConfig` - Interface for performance settings

**Exported Functions:**
- `getLanguageFromFileName(fileName: string)` - Detect language from file name
- `getEditorOptionsForLanguage(language, lineCount)` - Get optimized options
- `verifyMonacoConfiguration()` - Verify Monaco setup and return status

**Key Features:**
- Language definitions and file extension mappings
- Default editor options optimized for Symphony (font, cursor, minimap, scrolling, etc.)
- Language-specific settings (tab size, indentation, formatting)
- Performance configuration for large files (10,000+ lines threshold)
- Theme configuration interfaces
- Utility functions for language detection and option generation

### `src/config/monacoInitializer.ts`
Initialization module handling Monaco setup and theme management:

**Responsibilities:**
- Monaco Editor initialization with TextMate grammars
- Theme registration and management
- Language configuration (brackets, comments, auto-closing pairs)
- TypeScript/JavaScript compiler options
- Custom Symphony Dark theme registration

## Theme Management (Requirement 1.4)

### Built-in Themes
- **vs-dark**: Dark theme (default)
- **vs-light**: Light theme
- **hc-black**: High contrast theme
- **symphony-dark**: Custom Symphony dark theme

### Theme Features
- Automatic theme application on editor mount
- Dynamic theme switching without editor reload
- Custom theme registration support
- Token-level color customization

### Usage
```typescript
import { 
  SUPPORTED_LANGUAGES, 
  LANGUAGE_EXTENSIONS,
  getLanguageFromFileName,
  getEditorOptionsForLanguage,
  verifyMonacoConfiguration 
} from './config/monacoConfig';
import { applyTheme, registerCustomTheme } from './config/monacoInitializer';

// Detect language from file name
const language = getLanguageFromFileName('example.ts');
// Returns: 'typescript'

// Get optimized options for a language and file size
const options = getEditorOptionsForLanguage('javascript', 15000);
// Returns: Monaco editor options with large file optimizations applied

// Apply built-in theme
applyTheme(monaco, 'vs-dark');

// Register and apply custom theme
registerCustomTheme(monaco, 'my-theme', customThemeData);
applyTheme(monaco, 'my-theme');

// Verify configuration
const config = verifyMonacoConfiguration();
console.log('Configured:', config.isConfigured);
console.log('Languages:', config.supportedLanguages);
console.log('Themes:', config.availableThemes);
```

## Performance Optimizations (Requirements 8.1, 8.2, 8.5)

### Virtual Scrolling
- **Enabled by default** in Monaco Editor
- Renders only visible lines for optimal performance
- Smooth scrolling with configurable sensitivity
- Minimap with virtual rendering

### Large File Handling (10,000+ lines)
When a file exceeds 10,000 lines, the following optimizations are automatically applied:

**Disabled Features:**
- Minimap rendering
- Whitespace rendering
- Control character rendering
- Indent guides
- Occurrence highlighting
- Selection highlighting
- Word-based suggestions

**Adjusted Limits:**
- Max tokenization line length: 10,000 characters
- Stop rendering after: 5,000 characters per line
- Quick suggestions: disabled

**Preserved Features:**
- Syntax highlighting (with limits)
- Line numbers
- Code folding
- Basic editing features
- Automatic layout

### Performance Targets
- **Syntax highlighting**: <100ms for 10,000 line files
- **Editor initialization**: <500ms
- **Theme switching**: <100ms
- **Memory usage**: Optimized for large files

## Language-Specific Settings

### Python
```typescript
{
  tabSize: 4,
  insertSpaces: true,
  detectIndentation: false,
  trimAutoWhitespace: true,
}
```

### JavaScript/TypeScript
```typescript
{
  tabSize: 2,
  insertSpaces: true,
  formatOnType: true,
  formatOnPaste: true,
}
```

### Go
```typescript
{
  tabSize: 4,
  insertSpaces: false, // Go uses tabs
  detectIndentation: false,
}
```

### Rust
```typescript
{
  tabSize: 4,
  insertSpaces: true,
  formatOnType: true,
}
```

## Editor Features

### Enabled by Default
- Syntax highlighting with TextMate grammars
- IntelliSense (completion, parameter hints, hover)
- Code folding with indentation strategy
- Bracket matching and guides
- Multi-cursor editing
- Mouse wheel zoom
- Smooth scrolling
- Automatic layout adjustment
- Format on type/paste
- Auto-closing brackets and quotes

### Advanced Features
- Go-to-definition (peek mode)
- Find references (peek mode)
- Rename symbol
- Format document
- Code actions
- Diagnostics display

## Integration with EditorPanel

The EditorPanel component integrates Monaco configuration through custom hooks:
1. **useEnhancedLanguageDetection**: Detects language from file extension and content
2. **useEnhancedThemeManager**: Manages theme data and application
3. **useEnhancedMonacoConfig**: Provides configuration utilities (registerCustomTheme, enhanceMonacoOptions, etc.)
4. Initializes Monaco with TextMate grammars via `handleEnhancedEditorMount`
5. Applies language-specific settings automatically
6. Optimizes for file size based on line count
7. Handles theme changes dynamically through hooks

### Architecture
The configuration is accessed through a hook-based architecture rather than direct imports, providing:
- Better separation of concerns
- Easier testing and mocking
- Cleaner component code
- Reactive configuration updates

### Usage Example
```jsx
<EditorPanel
  files={files}
  activeFileName="example.ts"
  themeSettings={{ theme: 'vs-dark', fontSize: 14 }}
  glyphMarginSettings={{ enabled: true }}
  onChange={handleChange}
  onLanguageDetected={handleLanguageDetected}
/>
```

## API Reference

### `getLanguageFromFileName(fileName: string)`
Detects the programming language from a file name based on its extension.

**Parameters:**
- `fileName` - The file name including extension

**Returns:** `SupportedLanguage | 'plaintext'`

**Example:**
```typescript
getLanguageFromFileName('app.tsx')  // Returns: 'typescript'
getLanguageFromFileName('main.py')  // Returns: 'python'
getLanguageFromFileName('readme.txt')  // Returns: 'plaintext'
```

### `getEditorOptionsForLanguage(language, lineCount?)`
Gets optimized Monaco Editor options for a specific language and file size.

**Parameters:**
- `language` - Language identifier or 'plaintext'
- `lineCount` - Optional line count for performance optimization (default: 0)

**Returns:** `Monaco.editor.IStandaloneEditorConstructionOptions`

**Example:**
```typescript
// Normal file
const options = getEditorOptionsForLanguage('javascript', 500);

// Large file (10,000+ lines) - applies performance optimizations
const largeFileOptions = getEditorOptionsForLanguage('python', 15000);
```

### `verifyMonacoConfiguration()`
Verifies that Monaco Editor is properly configured and available.

**Returns:** Object with:
- `isConfigured: boolean` - Whether Monaco is properly set up
- `supportedLanguages: string[]` - List of supported language identifiers
- `availableThemes: string[]` - List of available theme names
- `errors: string[]` - Any configuration errors

**Example:**
```typescript
const config = verifyMonacoConfiguration();
if (!config.isConfigured) {
  console.error('Monaco configuration errors:', config.errors);
}
```

## Testing

### Unit Tests
Located in `src/__tests__/largeFilePerformance.test.ts`:
- Performance configuration tests
- Virtual scrolling verification
- Language-specific optimization tests
- Tokenization limit tests
- Memory optimization tests

### Test Coverage
- ✅ Large file threshold (10,000 lines)
- ✅ Performance optimizations applied correctly
- ✅ Language-specific settings
- ✅ Virtual scrolling enabled
- ✅ Tokenization limits
- ✅ Memory optimization features

## Dependencies

- `@monaco-editor/react`: ^4.7.0 (Monaco Editor React wrapper)
- Monaco Editor includes built-in TextMate grammars for all supported languages

## Future Enhancements

Potential improvements for future iterations:
- Custom TextMate grammar loading
- Additional language support
- More custom themes
- Advanced performance profiling
- Syntax highlighting caching
- Incremental parsing optimizations

## Requirements Satisfied

- ✅ **1.1**: Verify Monaco Editor installation and dependencies
- ✅ **1.3**: Configure TextMate grammars for TypeScript, JavaScript, Python, Rust, Go
- ✅ **1.4**: Set up theme management (vs-dark, vs-light, custom themes)
- ✅ **8.1**: Performance with 10,000+ line files
- ✅ **8.2**: Incremental parsing and optimization
- ✅ **8.5**: Virtual scrolling enabled and verified

## References

- [Monaco Editor Documentation](https://microsoft.github.io/monaco-editor/)
- [TextMate Grammars](https://macromates.com/manual/en/language_grammars)
- [VS Code Themes](https://code.visualstudio.com/api/extension-guides/color-theme)
