# @symphony/syntax-highlighting

A powerful, extensible syntax highlighting component for Symphony IDE with TextMate grammar support, language detection, and customizable theming.

## Features

- ✨ **TextMate Grammar Support** - Compatible with VS Code language grammars
- 🔍 **Automatic Language Detection** - From file extensions and content analysis
- 🎨 **Customizable Theming** - Dark/light themes with VS Code compatibility
- ⚡ **Token-Based Highlighting** - Efficient parsing and rendering
- 📱 **Responsive Design** - Works on desktop and mobile with Tailwind CSS
- ♿ **Accessibility** - ARIA labels and keyboard navigation
- 🎯 **Performance Optimized** - Memoized rendering and lazy loading
- 🎨 **Tailwind Styled** - Uses Tailwind CSS classes for styling
- 🧩 **UI Component Integration** - Built with `@symphony/ui` components (Box, Flex, Text)

## Supported Languages

Built-in support for:
- JavaScript/TypeScript (`.js`, `.jsx`, `.ts`, `.tsx`)
- Python (`.py`)
- HTML (`.html`, `.htm`)
- CSS/SCSS/Sass (`.css`, `.scss`, `.sass`)
- And many more...

## Installation

```bash
npm install @symphony/syntax-highlighting
```

## Basic Usage

```jsx
import { SyntaxHighlighter } from '@symphony/syntax-highlighting';

function CodeViewer() {
  const code = `
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
  `;

  return (
    <SyntaxHighlighter
      code={code}
      language="javascript"
      theme="dark"
      showLineNumbers={true}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `code` | `string` | `""` | Source code to highlight |
| `language` | `string` | `null` | Language hint (auto-detected if not provided) |
| `theme` | `string` | `"dark"` | Theme name (`"dark"` or `"light"`) |
| `fileName` | `string` | `""` | File name for language detection |
| `showLineNumbers` | `boolean` | `false` | Show line numbers |
| `lineNumberStart` | `number` | `1` | Starting line number |
| `className` | `string` | `""` | Additional CSS classes |
| `onLanguageDetected` | `function` | `() => {}` | Callback when language is detected |

## Advanced Usage

### Custom Theme

```jsx
import { SyntaxHighlighter, createCustomTheme } from '@symphony/syntax-highlighting';

const customTheme = createCustomTheme('dark', {
  colors: {
    'editor.background': '#0d1117',
    'editor.foreground': '#c9d1d9',
  },
  tokenColors: [
    { scope: 'keyword', settings: { foreground: '#ff7b72' } }
  ]
});

<SyntaxHighlighter
  code={code}
  theme={customTheme}
/>
```

### Language Detection

```jsx
import { 
  SyntaxHighlighter, 
  getLanguageFromExtension,
  detectLanguageFromContent 
} from '@symphony/syntax-highlighting';

// Detect from file extension
const language = getLanguageFromExtension('example.py'); // 'python'

// Detect from content
const detectedLang = detectLanguageFromContent('def hello(): pass'); // 'python'

<SyntaxHighlighter
  code={code}
  onLanguageDetected={(lang) => console.log('Detected:', lang)}
/>
```

## Component Architecture

Following Symphony's refactored component patterns, the syntax highlighter is built with:

### UI Component Integration

The component uses `@symphony/ui` primitives for consistent styling and accessibility:

- **Box** - Container elements for layout structure
- **Flex** - Flexbox layout for line rendering with `align="start"`
- **Text** - Typography for line numbers and token content with `as="span"` prop

```jsx
// Example: Line rendering with UI components
<Flex align="start" className="min-h-[1.4em] relative hover:bg-white/5">
  {showLineNumbers && (
    <Text as="span" className="inline-block min-w-[2.5rem] pr-4 text-right select-none">
      {lineNumber}
    </Text>
  )}
  <Text as="span" className="flex-1 whitespace-pre break-words">
    {/* Token content */}
  </Text>
</Flex>
```

### Main Component
- `SyntaxHighlighter.jsx` - Main component (~120 lines)

### Custom Hooks
- `useLanguageDetection.js` - Language detection logic
- `useTextMateGrammar.js` - Grammar loading and caching
- `useTokenizer.js` - Token-based highlighting
- `useThemeManager.js` - Theme management and color resolution

### Utilities
- `grammarRegistry.js` - TextMate grammar registry
- `languageMap.js` - File extension to language mapping
- `tokenTypes.js` - Tokenization logic
- `themeParser.js` - Theme parsing and color extraction

## Performance

- **Memoized Rendering** - Lines are memoized for efficient re-renders
- **Lazy Grammar Loading** - Grammars loaded on-demand
- **Token Merging** - Adjacent tokens with same scope are merged
- **Efficient Updates** - Only re-tokenizes when code or language changes

## Accessibility

- ARIA labels for screen readers
- Keyboard navigation support
- High contrast mode support
- Semantic HTML structure

## Browser Support

- Modern browsers with ES6+ support
- Chrome 60+, Firefox 60+, Safari 12+, Edge 79+

## Contributing

This component follows Symphony's extension-first philosophy. To add new languages:

1. Add grammar definition to `grammarRegistry.js`
2. Update language mapping in `languageMap.js`
3. Add theme colors for new token types

## License

MIT License - Part of the Symphony IDE project.
