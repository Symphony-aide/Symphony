# @symphony/outlineview

A code outline view component that displays symbols, functions, and variables from the active file for easy navigation.

## Overview

This package provides an outline view component for the Symphony application that shows a hierarchical view of code symbols, making it easy to navigate through large files.

## Architecture

OutlineView uses Symphony's UI component library (`@symphony/ui`) for consistent styling and accessibility:

- `ScrollArea` - Scrollable container for long symbol lists
- `Box` - Layout container with padding control
- `Flex` - Flexible layout for symbol rows
- `Heading` - Section title typography
- `Text` - Symbol type, name, and line number display

## Exported Components

### `OutlineView`
The main outline view component that displays code symbols in a navigable tree structure.

**Features:**
- Displays functions, variables, classes, and other code symbols
- Click-to-navigate functionality
- Symbol type indicators with color coding
- Line number references
- Scrollable container for large files
- Built with Symphony UI components for consistency

**Usage:**
```tsx
import { OutlineView } from "@symphony/outlineview";

<OutlineView
  onSelectItem={handleSymbolSelect}
/>
```

**Props:**
- `onSelectItem`: Callback function called when a symbol is clicked, receives the symbol object with `type`, `name`, and `line` properties

## Exported Atoms

### `outlineAtom`
Jotai atom for managing the outline data state across the application.

**Features:**
- Global state management for outline data
- Reactive updates when file content changes
- Integration with code analysis

**Usage:**
```tsx
import { outlineAtom } from "@symphony/outlineview";
import { useAtom } from "jotai";

const [outline, setOutline] = useAtom(outlineAtom);

// Update outline data
setOutline([
  { type: 'function', name: 'myFunction', line: 10 },
  { type: 'variable', name: 'myVar', line: 5 }
]);
```

## Data Structure

The outline data follows this structure:

```typescript
interface OutlineItem {
  type: string;    // Symbol type (function, variable, class, etc.)
  name: string;    // Symbol name
  line: number;    // Line number in the file
}
```

## Installation

```bash
# Using pnpm
pnpm install @symphony/outlineview
```

## Usage

```tsx
import { OutlineView, outlineAtom } from "@symphony/outlineview";
import { useSetAtom } from "jotai";

const App = () => {
  const setOutline = useSetAtom(outlineAtom);

  const handleSymbolSelect = (item) => {
    // Navigate to the selected symbol's line
    console.log(`Navigating to ${item.name} at line ${item.line}`);
  };

  // Update outline when file changes
  const updateOutline = (fileContent) => {
    const symbols = parseFileSymbols(fileContent);
    setOutline(symbols);
  };

  return (
    <OutlineView onSelectItem={handleSymbolSelect} />
  );
};
```

## UI Component Architecture

The component uses Symphony UI primitives instead of raw HTML elements:

| Element | UI Component | Purpose |
|---------|--------------|---------|
| Container | `ScrollArea` | Scrollable wrapper for symbol list |
| Content wrapper | `Box` | Padding and layout control |
| Title | `Heading` | "Outline" section header |
| Empty state | `Text` | "No symbols found" message |
| Symbol list | `Flex direction="column"` | Vertical list layout |
| Symbol row | `Flex` | Horizontal symbol display |
| Symbol parts | `Text as="span"` | Type, name, and line number |

## Dependencies

- React
- Jotai (state management)
- @symphony/ui (UI components)
- Tailwind CSS (styling)
