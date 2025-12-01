# Symbol Search Component

Workspace-wide symbol search component for Symphony IDE with fuzzy matching and LSP integration.

## Features

- **Workspace Symbol Search**: Search for symbols across the entire workspace
- **Fuzzy Matching**: Intelligent fuzzy matching for quick symbol location
- **Symbol Type Icons**: Visual icons for different symbol types (classes, functions, variables, etc.)
- **Color Coding**: Consistent color coding by symbol type
- **File Location Display**: Shows which file contains each symbol
- **Container Context**: Displays parent container (class, namespace) for symbols
- **Keyboard Shortcuts**: Cmd/Ctrl + Shift + O to open search
- **Debounced Search**: Optimized search with 300ms debounce

## Usage

```tsx
import { SymbolSearch } from '@symphony/symbol-search';
import { LSPClient } from '@symphony/code-editor/lsp';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const lspClient = useLSPClient();

  return (
    <SymbolSearch
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      onSearch={async (query) => {
        return await lspClient.workspaceSymbol({ query });
      }}
      onSymbolSelect={(symbol) => {
        // Navigate to symbol location
        navigateToLocation(symbol.location);
      }}
    />
  );
}
```

## Props

- `isOpen`: boolean - Whether the search dialog is open
- `onOpenChange`: (open: boolean) => void - Callback when open state changes
- `onSearch`: (query: string) => Promise<SymbolInformation[]> - Callback to search for symbols
- `onSymbolSelect`: (symbol: SymbolInformation) => void - Callback when a symbol is selected
- `placeholder`: string (optional) - Placeholder text for search input
- `emptyMessage`: string (optional) - Message to show when no results found

## Symbol Types

The component supports all LSP symbol kinds with appropriate icons:

- File, Module, Namespace, Package
- Class, Interface, Struct
- Method, Function, Constructor
- Property, Field, Variable, Constant
- Enum, EnumMember
- And more...

## Requirements

Validates requirements:
- 6.1: Workspace symbol search interface
- 6.2: Symbol search requests to LSP server
- 6.3: Symbol results display with metadata
- 6.4: Symbol selection navigation
- 6.5: Fuzzy matching support
