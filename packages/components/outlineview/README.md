# Outline View Component

Hierarchical document outline component for Symphony IDE with LSP document symbol support.

## Features

- **Hierarchical Display**: Shows document structure with nested symbols
- **Symbol Type Icons**: Visual icons for different symbol types (classes, functions, methods, etc.)
- **Color Coding**: Consistent color coding by symbol type
- **Expand/Collapse**: Interactive tree navigation for nested symbols
- **Click to Navigate**: Click any symbol to navigate to its location
- **Automatic Updates**: Updates when document content changes
- **Symbol Details**: Shows additional details like function signatures

## Usage

```tsx
import { OutlineView, outlineAtom } from '@symphony/outlineview';
import { useSetAtom } from 'jotai';

function MyComponent() {
  const setOutline = useSetAtom(outlineAtom);
  const editor = useMonacoEditor();

  // Update outline when document symbols are received
  useEffect(() => {
    const updateOutline = async () => {
      const symbols = await lspClient.documentSymbol({
        textDocument: { uri: currentFileUri }
      });
      setOutline(symbols);
    };
    
    updateOutline();
  }, [currentFileUri]);

  return (
    <OutlineView
      onSelectItem={(symbol) => {
        // Navigate to symbol location
        editor.setPosition(symbol.selectionRange.start);
        editor.revealPosition(symbol.selectionRange.start);
      }}
    />
  );
}
```

## Props

- `onSelectItem`: (symbol: DocumentSymbol) => void (optional) - Callback when a symbol is selected
- `className`: string (optional) - Additional CSS classes

## State Management

The component uses Jotai for state management:

```tsx
import { outlineAtom } from '@symphony/outlineview';
import { useSetAtom } from 'jotai';

// Update the outline
const setOutline = useSetAtom(outlineAtom);
setOutline(documentSymbols);
```

## Symbol Types

Supports all LSP symbol kinds with appropriate icons:

- **Classes/Interfaces/Structs**: Blue icons
- **Methods/Functions/Constructors**: Purple icons
- **Properties/Fields/Variables**: Cyan icons
- **Constants**: Orange icons
- **Enums**: Yellow icons
- **Modules/Namespaces**: Green icons

## Requirements

Validates requirements:
- 10.1: Request document symbols on file open
- 10.2: Display symbols hierarchically
- 10.3: Navigate to symbol on click
- 10.4: Update outline on content changes
- 10.5: Show symbol type icons
