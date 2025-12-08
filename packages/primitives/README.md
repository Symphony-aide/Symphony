# @symphony/primitives

A comprehensive UI extensibility system for Symphony IDE that transforms every UI element into an inspectable, modifiable primitive. This enables Motif extensions to have complete transparency and control over the entire UI.

## Overview

The Primitives Package supports Symphony's "Minimal Core, Infinite Intelligence" vision by providing:

- **Full UI Transparency**: Every UI element is inspectable and modifiable
- **Extension-First Design**: Built for Motif extensions to customize any part of the UI
- **Performance Options**: React, WASM, and Direct rendering strategies
- **Type Safety**: Full JSDoc type definitions for IDE support

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   MOTIF EXTENSIONS                          │
│         (Python/Rust/TypeScript Extensions)                 │
└────────────────────┬────────────────────────────────────────┘
                     │ IPC Bridge
┌────────────────────▼────────────────────────────────────────┐
│              COMPONENT REGISTRY                             │
│    - Stores all component trees                             │
│    - Provides inspection API                                │
│    - Handles modifications                                  │
└────────────┬───────────────────────┬────────────────────────┘
             │                       │
    ┌────────▼────────┐    ┌────────▼────────┐
    │ REACT RENDERER  │    │  WASM RENDERER  │
    │  (Light UI)     │    │  (Heavy UI)     │
    └─────────────────┘    └─────────────────┘
```

## Installation

```bash
pnpm add @symphony/primitives
```

## Quick Start

```javascript
import {
  BasePrimitive,
  ComponentRegistry,
  Container,
  Button,
  Text,
  PrimitiveRenderer,
  useRegisteredComponent,
} from '@symphony/primitives';

// Create a component tree using factory functions
const myPanel = Container({ direction: 'column', gap: 8 });
myPanel.appendChild(Text({ content: 'Hello Symphony!' }));
myPanel.appendChild(Button({ variant: 'default', onClick: 'handleClick' }));

// Register with the registry
const registry = new ComponentRegistry();
registry.registerComponent('MyPanel', myPanel);

// Register event handlers
registry.registerEventHandler('handleClick', () => {
  console.log('Button clicked!');
});

// Use in React
function MyComponent() {
  const tree = useRegisteredComponent('MyPanel');
  if (!tree) return null;
  return <PrimitiveRenderer primitive={tree} />;
}
```


## Core Concepts

### BasePrimitive

The foundation class for all UI elements:

```javascript
import { BasePrimitive } from '@symphony/primitives';

// Create a primitive directly
const primitive = new BasePrimitive('CustomType', {
  customProp: 'value',
});

// Tree manipulation
primitive.appendChild(childPrimitive);
primitive.removeChild(childPrimitive);
primitive.insertChild(childPrimitive, 0);

// Path calculation
const path = primitive.getPath(); // ['ParentType', 'CustomType']

// Serialization
const tree = primitive.toTree();
const restored = BasePrimitive.fromTree(tree);

// Pretty printing
console.log(primitive.toPrettyString());
```

### ComponentRegistry

Central registry for managing component trees:

```javascript
import { ComponentRegistry } from '@symphony/primitives';

const registry = new ComponentRegistry();

// Register components
registry.registerComponent('ActivityBar', activityBarPrimitive);

// Query components
const component = registry.getComponent('ActivityBar');
const names = registry.getComponentNames();

// Path-based queries (supports array indexing)
const button = registry.findByPath('ActivityBar', ['Container', 'Button[0]']);

// Modify components
registry.modifyComponent('ActivityBar', ['Container', 'Button[0]'], {
  props: { disabled: true },
});

// Insert/remove primitives
registry.insertPrimitive('ActivityBar', ['Container'], newButton, 0);
registry.removePrimitive('ActivityBar', ['Container', 'Button[1]']);

// Event handlers
registry.registerEventHandler('myHandler', async (arg) => {
  return `Received: ${arg}`;
});
await registry.invokeEventHandler('myHandler', 'test');
```

## Primitive Types

### Layout Primitives

```javascript
import { Container, Flex, Grid, Panel, Divider } from '@symphony/primitives';

// Container - basic layout container
const container = Container({
  direction: 'column', // 'row' | 'column'
  gap: 8,
  className: 'my-container',
});

// Flex - flexbox layout
const flex = Flex({
  justify: 'between', // 'start' | 'center' | 'end' | 'between'
  align: 'center',    // 'start' | 'center' | 'end' | 'stretch'
  wrap: true,
});

// Grid - CSS grid layout
const grid = Grid({
  columns: 3,
  rows: 2,
  gap: 16,
});

// Panel - collapsible panel
const panel = Panel({
  title: 'Settings',
  collapsible: true,
  defaultCollapsed: false,
});

// Divider - separator (leaf node)
const divider = Divider({
  orientation: 'horizontal', // 'horizontal' | 'vertical'
});
```

### Interactive Primitives

```javascript
import { Button, Input, Icon, Text, Checkbox, Select } from '@symphony/primitives';

// Button
const button = Button({
  variant: 'default', // 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size: 'default',    // 'default' | 'sm' | 'lg' | 'icon'
  onClick: 'handlerId',
  disabled: false,
});

// Input (leaf node)
const input = Input({
  type: 'text',       // 'text' | 'password' | 'email' | 'number'
  value: '',
  onChange: 'inputHandler',
  placeholder: 'Enter text...',
});

// Icon (leaf node)
const icon = Icon({
  name: 'settings',   // Lucide icon name
  size: 24,
  color: '#666',
});

// Text (leaf node)
const text = Text({
  content: 'Hello World',
  variant: 'body',    // 'body' | 'heading' | 'caption' | 'code'
  size: 'md',         // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  weight: 'normal',   // 'normal' | 'medium' | 'semibold' | 'bold'
});

// Checkbox
const checkbox = Checkbox({
  checked: false,
  onChange: 'checkHandler',
  label: 'Enable feature',
});

// Select
const select = Select({
  options: [
    { value: 'a', label: 'Option A' },
    { value: 'b', label: 'Option B' },
  ],
  value: 'a',
  onChange: 'selectHandler',
  placeholder: 'Choose...',
});
```


### Complex Primitives

```javascript
import { List, Tabs, Dropdown, Modal, Tooltip } from '@symphony/primitives';

// List - virtualized list
const list = List({
  items: ['item1', 'item2', 'item3'],
  renderItem: 'listItemRenderer',
  virtualized: true,
});

// Tabs - tabbed interface
const tabs = Tabs({
  tabs: [
    { id: 'tab1', label: 'First', icon: 'file' },
    { id: 'tab2', label: 'Second', icon: 'settings' },
  ],
  activeTab: 'tab1',
  onTabChange: 'tabChangeHandler',
});

// Dropdown - dropdown menu
const dropdown = Dropdown({
  trigger: triggerPrimitive,
  items: [
    { id: 'action1', label: 'Action 1', onClick: 'action1Handler' },
    { id: 'action2', label: 'Action 2', icon: 'edit' },
  ],
});

// Modal - dialog modal
const modal = Modal({
  title: 'Confirm Action',
  open: false,
  onClose: 'closeModalHandler',
  size: 'md', // 'sm' | 'md' | 'lg' | 'xl' | 'full'
});

// Tooltip - hover tooltip
const tooltip = Tooltip({
  content: 'Helpful information',
  position: 'top', // 'top' | 'bottom' | 'left' | 'right'
});
```

### Heavy WASM Primitives

Performance-critical components rendered via WASM:

```javascript
import { CodeEditor, Terminal, SyntaxHighlighter, FileTree } from '@symphony/primitives';

// CodeEditor - Monaco-based editor
const editor = CodeEditor({
  language: 'typescript',
  value: 'const x = 1;',
  onChange: 'editorChangeHandler',
  theme: 'vs-dark',
  fontSize: 14,
  lineNumbers: true,
  minimap: true,
  readOnly: false,
});

// Terminal - xterm.js terminal
const terminal = Terminal({
  shellId: 'main-shell',
  theme: 'dark',
  fontSize: 12,
  cursorStyle: 'block', // 'block' | 'underline' | 'bar'
  onCommand: 'commandHandler',
});

// SyntaxHighlighter (leaf node)
const highlighter = SyntaxHighlighter({
  code: 'function hello() {}',
  language: 'javascript',
  theme: 'github-dark',
  showLineNumbers: true,
});

// FileTree - virtualized file browser
const fileTree = FileTree({
  files: [
    { path: '/src', type: 'directory' },
    { path: '/src/index.js', type: 'file' },
  ],
  onFileSelect: 'fileSelectHandler',
  virtualized: true,
  expandedPaths: ['/src'],
});
```

## Renderers

### PrimitiveRenderer

React renderer for standard primitives:

```javascript
import { PrimitiveRenderer, registerComponent } from '@symphony/primitives';

// Register custom component mappings
registerComponent('CustomButton', MyCustomButtonComponent);

// Render a primitive tree
function App() {
  return <PrimitiveRenderer primitive={myPrimitive} />;
}
```

### DirectRenderer

Performance escape hatch for existing optimized components:

```javascript
import { DirectRenderer, registerDirectRenderer } from '@symphony/primitives';

// Register direct renderers
registerDirectRenderer('MonacoEditor', MonacoEditorComponent);
registerDirectRenderer('XTermTerminal', XTermComponent);

// Use with renderDirect flag
const directPrimitive = new BasePrimitive('MonacoEditor', { value: 'code' });
directPrimitive.renderDirect = true;
```

### WasmRenderer

For WASM-based components:

```javascript
import { WasmRenderer, loadWasmModule } from '@symphony/primitives';

// Load WASM module
const module = await loadWasmModule('/path/to/module.wasm');

// Render WASM primitive
function WasmComponent({ primitive }) {
  return <WasmRenderer primitive={primitive} />;
}
```


## Hooks

### useRegisteredComponent

React hook for connecting to the registry:

```javascript
import { useRegisteredComponent, setHookRegistry } from '@symphony/primitives';

// Set the registry for hooks (typically done once at app startup)
setHookRegistry(registry);

function MyComponent() {
  // Automatically re-renders when component tree changes
  const tree = useRegisteredComponent('ActivityBar');
  
  if (!tree) {
    return <div>Component not found</div>;
  }
  
  return <PrimitiveRenderer primitive={tree} />;
}
```

## Motif Extension API

The MotifAPI provides a high-level interface for extensions:

```javascript
import { MotifAPI } from '@symphony/primitives';

const api = new MotifAPI(registry);

// List all components
const components = api.getComponentList();

// Get a component tree
const tree = api.getComponent('ActivityBar');

// Modify a component
api.modifyComponent('ActivityBar', ['Container', 'Button[0]'], {
  disabled: true,
  variant: 'secondary',
});

// Insert a new primitive
api.insertPrimitive('ActivityBar', ['Container'], newButton, 0);

// Remove a primitive
api.removePrimitive('ActivityBar', ['Container', 'OldButton']);

// Register event handlers
api.registerEventHandler('myExtensionHandler', async (data) => {
  // Handle events from the UI
  return processData(data);
});
```

## IPC Bridge

For backend Motif extensions (Python/Rust):

```javascript
import { IPCBridge, getDefaultBridge } from '@symphony/primitives';

// Create bridge with registry
const bridge = new IPCBridge(registry);

// Handle IPC requests
const handlers = {
  get_component_tree: (name) => bridge.getComponentTree(name),
  modify_component: (name, path, mods) => bridge.modifyComponent(name, path, mods),
  insert_component: (name, path, primitive, index) => bridge.insertPrimitive(name, path, primitive, index),
  remove_component: (name, path) => bridge.removePrimitive(name, path),
  invoke_handler: (id, args) => bridge.invokeHandler(id, ...args),
};
```

## Performance Monitoring

Track render performance:

```javascript
import { PerformanceMonitor, getDefaultMonitor } from '@symphony/primitives';

const monitor = new PerformanceMonitor({
  warningThreshold: 16,  // Log warning if render > 16ms
  errorThreshold: 50,    // Log error if render > 50ms
});

// Record render times
monitor.recordRender('MyComponent', 12.5);

// Get metrics
const metrics = monitor.getMetrics('MyComponent');
console.log(metrics);
// { average: 12.5, min: 12.5, max: 12.5, count: 1 }

// Get all metrics
const allMetrics = monitor.getAllMetrics();

// Clear metrics
monitor.clearMetrics();
```

## Error Handling

Custom error types for better debugging:

```javascript
import {
  PrimitiveError,
  ComponentNotFoundError,
  PathResolutionError,
  WasmLoadError,
} from '@symphony/primitives';

try {
  registry.getComponent('NonExistent');
} catch (error) {
  if (error instanceof ComponentNotFoundError) {
    console.log(`Component "${error.componentName}" not found`);
  }
}

try {
  registry.findByPath('MyComponent', ['Invalid', 'Path']);
} catch (error) {
  if (error instanceof PathResolutionError) {
    console.log(`Path failed: ${error.path.join('/')}`);
  }
}
```

## Error Boundaries

Graceful error handling in React:

```javascript
import { ErrorBoundary, withErrorBoundary } from '@symphony/primitives';

// Using component
function App() {
  return (
    <ErrorBoundary
      fallback={({ error, retry }) => (
        <div>
          <p>Error: {error.message}</p>
          <button onClick={retry}>Retry</button>
        </div>
      )}
      onError={(error, info) => console.error(error)}
    >
      <MyComponent />
    </ErrorBoundary>
  );
}

// Using HOC
const SafeComponent = withErrorBoundary(MyComponent, {
  fallback: ErrorFallback,
});
```

## Development

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Lint code
pnpm lint

# Type check
pnpm type-check
```

## API Reference

### Exports

| Export | Description |
|--------|-------------|
| `BasePrimitive` | Base class for all primitives |
| `ComponentRegistry` | Central registry for component trees |
| `MotifAPI` | High-level API for Motif extensions |
| `IPCBridge` | IPC handlers for backend extensions |
| `PerformanceMonitor` | Render performance tracking |
| `PrimitiveRenderer` | React renderer for primitives |
| `DirectRenderer` | Direct rendering escape hatch |
| `WasmRenderer` | WASM component renderer |
| `ErrorBoundary` | React error boundary |
| `useRegisteredComponent` | React hook for registry |
| `Container`, `Flex`, `Grid`, `Panel`, `Divider` | Layout primitives |
| `Button`, `Input`, `Icon`, `Text`, `Checkbox`, `Select` | Interactive primitives |
| `List`, `Tabs`, `Dropdown`, `Modal`, `Tooltip` | Complex primitives |
| `CodeEditor`, `Terminal`, `SyntaxHighlighter`, `FileTree` | Heavy WASM primitives |
| `PrimitiveError`, `ComponentNotFoundError`, `PathResolutionError`, `WasmLoadError` | Error types |

## License

MIT
