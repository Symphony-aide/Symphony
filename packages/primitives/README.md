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
import { Box, Container, Flex, Grid, Panel, Divider } from '@symphony/primitives';

// Box - basic layout box with padding, margin, and display control
const box = Box({
  padding: 'md',      // 'none' | 'sm' | 'md' | 'lg' | 'xl'
  margin: 'sm',       // 'none' | 'sm' | 'md' | 'lg' | 'xl'
  display: 'block',   // 'block' | 'inline' | 'inline-block' | 'flex' | 'inline-flex' | 'grid'
  as: 'section',      // Render as different HTML element
  className: 'my-box',
});

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

Graceful error handling in React with Symphony UI integration:

The ErrorBoundary component uses UI components from the `ui` package for consistent styling:
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` for layout
- `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` for expandable error details
- `Button` for retry actions
- `Code` for displaying stack traces

```javascript
import { ErrorBoundary, withErrorBoundary } from '@symphony/primitives';

// Using component with default fallback (uses Symphony UI components)
function App() {
  return (
    <ErrorBoundary
      onError={(error, info) => console.error(error)}
    >
      <MyComponent />
    </ErrorBoundary>
  );
}

// Using component with custom fallback
function App() {
  return (
    <ErrorBoundary
      fallback={({ error, errorInfo, retry }) => (
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
  onError: (error) => console.error(error),
});
```

## Performance Testing

The primitives package includes comprehensive performance tests to ensure render performance meets defined budgets.

### Performance Budgets

| Complexity | Threshold | Description |
|------------|-----------|-------------|
| Simple | < 5ms | Single primitives (Button, Text, Icon, Input, Checkbox) |
| Medium | < 16ms | Trees with 10-20 nodes (60fps frame budget) |
| Complex | < 50ms | Trees with 50+ nodes |

### Running Performance Tests

```bash
# Run all tests including performance tests
pnpm test

# Run only performance tests
pnpm test -- --grep "Performance"
```

### Performance Test Properties

The performance tests verify three key properties:

- **Property 7: Simple Primitive Render Performance** - Any simple primitive renders under 5ms (average)
- **Property 8: Medium Tree Render Performance** - Any tree with 10-20 nodes renders under 16ms (average)
- **Property 9: Complex Tree Render Performance** - Any tree with 50+ nodes renders under 50ms

### Testing Methodology

Performance tests use `benchmarkFunction` to measure average render time over multiple iterations. This approach:

- Accounts for JIT compilation warmup in the JavaScript engine
- Reduces variance from garbage collection pauses
- Provides consistent, reproducible measurements across test runs
- Matches the specification intent of measuring typical render performance, not worst-case single-render times

```javascript
// Example: benchmarkFunction usage
const stats = benchmarkFunction(() => {
  const { unmount } = render(<PrimitiveRenderer primitive={primitive} />);
  unmount();
}, 5, 1); // 5 iterations, 1 warmup

expect(stats.average).toBeLessThan(PERFORMANCE_THRESHOLDS.simple);
```

### Using Performance Helpers

```javascript
import {
  measureRenderTime,
  benchmarkFunction,
  generatePrimitiveTree,
  validatePerformance,
  PERFORMANCE_THRESHOLDS,
} from '@symphony/primitives/__tests__/utils/performanceHelpers';

// Measure single render (useful for quick checks)
const { result, duration } = measureRenderTime(() => renderPrimitive(button));

// Benchmark with statistics (recommended for performance tests)
// Parameters: function, iterations, warmup runs
const stats = benchmarkFunction(() => renderPrimitive(tree), 10, 2);
console.log(`Average: ${stats.average}ms, P95: ${stats.p95}ms`);

// For property-based tests, use fewer iterations for speed
const quickStats = benchmarkFunction(() => renderPrimitive(primitive), 5, 1);
expect(quickStats.average).toBeLessThan(PERFORMANCE_THRESHOLDS.simple);

// Generate test trees
const mediumTree = generatePrimitiveTree(15);
const complexTree = generatePrimitiveTree(75);

// Validate against thresholds
const validation = validatePerformance(duration, 'medium');
if (!validation.passed) {
  console.warn(`Exceeded threshold by ${-validation.margin}ms`);
}
```

### Memory Leak Detection

```javascript
import { checkPerformanceDegradation } from '@symphony/primitives/__tests__/utils/performanceHelpers';

// Check for performance degradation over 100 renders
const { degradation, hasDegradation } = checkPerformanceDegradation(() => {
  const { unmount } = render(<PrimitiveRenderer primitive={primitive} />);
  unmount();
}, 100);

// Performance should not degrade by more than 50%
expect(hasDegradation).toBe(false);
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

## Test File Naming Conventions

The primitives package uses a structured test file naming convention to organize different types of tests:

| Pattern | Description | Example |
|---------|-------------|---------|
| `*.test.{js,jsx}` | Standard unit tests | `utils.test.js` |
| `*.property.test.{js,jsx}` | Property-based tests using fast-check | `BasePrimitive.property.test.js` |
| `*.perf.test.{js,jsx}` | Performance benchmark tests | `render.perf.test.jsx` |
| `*.contract.test.{js,jsx}` | IPC contract validation tests | `IPCBridge.contract.test.js` |
| `*.snapshot.test.{js,jsx}` | Snapshot tests for UI consistency | `PrimitiveRenderer.snapshot.test.jsx` |

All test files should be placed in the `__tests__/` directory, organized by module:

```
__tests__/
├── api/                    # MotifAPI tests
├── core/                   # BasePrimitive, errors, utils tests
├── hooks/                  # React hook tests
├── ipc/                    # IPC bridge tests
├── monitoring/             # Performance monitor tests
├── performance/            # Render performance benchmarks
├── primitives/             # Primitive factory tests
├── registration/           # UI component registration tests
├── registry/               # ComponentRegistry tests
├── renderers/              # Renderer component tests
└── utils/                  # Test utility helpers
```

## Testing Utilities

The package includes comprehensive testing utilities for property-based testing, performance validation, and snapshot testing.

### Snapshot Helpers

Convert primitives to serializable snapshot structures for testing:

```javascript
import {
  renderPrimitiveToSnapshot,
  createTestPrimitive,
  createLeafPrimitive,
  createNestedPrimitiveTree,
  createMockReactComponent,
  registerAllMockComponents,
  unregisterAllMockComponents,
  compareSnapshots,
  serializeSnapshot,
  MOCK_COMPONENTS,
} from '@symphony/primitives/__tests__/utils/snapshotHelpers';

// Convert a primitive to a snapshot structure
// Note: Dynamic IDs (like 'data-primitive-id') are automatically excluded
// to ensure stable snapshots across test runs
const button = Button({ variant: 'primary', onClick: 'handler_id' });
const snapshot = renderPrimitiveToSnapshot(button);
// {
//   type: 'Button',
//   props: { variant: 'primary', onClick: 'handler_id' },
//   renderStrategy: 'react',
//   isLeafNode: false,
//   children: []
// }

// Works recursively for primitive trees
const container = Container({ direction: 'column' });
container.appendChild(button);
const treeSnapshot = renderPrimitiveToSnapshot(container);

// Create test primitives with common configurations
const testContainer = createTestPrimitive('Container', { direction: 'row' }, [
  createTestPrimitive('Button', { variant: 'primary' }),
  createTestPrimitive('Text', { content: 'Hello' }),
]);

// Create leaf primitives (cannot have children rendered)
const icon = createLeafPrimitive('Icon', { name: 'file', size: 16 });

// Create nested primitive trees for hierarchical testing
const tree = createNestedPrimitiveTree(3, 2); // depth=3, 2 children per node

// Register mock components for testing
import { registerComponent, unregisterComponent } from '@symphony/primitives';

beforeEach(() => {
  registerAllMockComponents(registerComponent);
});

afterEach(() => {
  unregisterAllMockComponents(unregisterComponent);
});

// Compare snapshots with options
const areEqual = compareSnapshots(snapshotA, snapshotB, { ignoreIds: true });

// Serialize snapshot to stable JSON (removes volatile IDs)
const stableJson = serializeSnapshot(snapshot);
```

### Performance Helpers

Measure render times and validate performance budgets:

```javascript
import {
  measureRenderTime,
  benchmarkFunction,
  generatePrimitiveTree,
  generateSimplePrimitive,
  validatePerformance,
  PERFORMANCE_THRESHOLDS,
} from '@symphony/primitives/__tests__/utils/performanceHelpers';

// Measure single render
const { result, duration } = measureRenderTime(() => renderPrimitive(button));
console.log(`Render took ${duration}ms`);

// Benchmark with statistics
const stats = benchmarkFunction(() => renderPrimitive(tree), 100);
console.log(`Average: ${stats.average}ms, P95: ${stats.p95}ms`);

// Generate test trees of various sizes
const simpleTree = generateSimplePrimitive('Button');
const mediumTree = generatePrimitiveTree(15);  // 10-20 nodes
const complexTree = generatePrimitiveTree(50); // 50+ nodes

// Validate against performance thresholds
const validation = validatePerformance(duration, 'simple');
// { passed: true, threshold: 5, margin: 3.5 }
```

### Contract Validators

Validate IPC contracts and component tree structures:

```javascript
import {
  validateSchema,
  validateType,
  validateIPCRequest,
  validateIPCSuccessResponse,
  validateIPCErrorResponse,
  validateComponentTree,
  createValidComponentTree,
  createValidIPCRequest,
  createValidSuccessResponse,
  createValidErrorResponse,
  IPC_CONTRACTS,
  COMPONENT_TREE_SCHEMA,
  SUCCESS_RESPONSE_SCHEMA,
  ERROR_RESPONSE_SCHEMA,
} from '@symphony/primitives/__tests__/utils/contractValidators';

// Validate IPC request parameters
const requestResult = validateIPCRequest('get_component_tree', { name: 'MyComponent' });
// { valid: true, errors: [] }

// Validate IPC success response
const successResult = validateIPCSuccessResponse('get_component_tree', {
  success: true,
  data: { id: '123', type: 'Button', props: {}, renderStrategy: 'react', children: [] }
});

// Validate IPC error response
const errorResult = validateIPCErrorResponse('get_component_tree', {
  success: false,
  error: 'Component not found',
  code: 'COMPONENT_NOT_FOUND'
});

// Validate component tree structure recursively
const treeResult = validateComponentTree(tree);

// Create valid test data for contract testing
const testTree = createValidComponentTree({ type: 'CustomType' });
const testRequest = createValidIPCRequest('modify_component', { name: 'MyComponent' });
const testSuccess = createValidSuccessResponse('get_component_tree');
const testError = createValidErrorResponse('Test error', 'TEST_ERROR');

// Access IPC contract definitions
const contract = IPC_CONTRACTS.get_component_tree;
// { request: {...}, successResponse: {...}, successDataSchema: {...}, errorResponse: {...} }
```

#### IPC Contract Methods

The following IPC methods have defined contracts:

| Method | Description | Request Schema | Success Data Schema |
|--------|-------------|----------------|---------------------|
| `get_component_tree` | Get serialized component tree | `{ name: string }` | `ComponentTree` |
| `modify_component` | Modify component props | `{ name, path, modifications }` | `{ modified: boolean }` |
| `insert_component` | Insert new primitive | `{ name, parentPath, primitive, index? }` | `{ inserted, primitiveId }` |
| `remove_component` | Remove primitive | `{ name, path }` | `{ removed: boolean }` |
| `invoke_motif_handler` | Invoke event handler | `{ handlerId, args? }` | `{ result: any }` |

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
| `ErrorBoundary` | React error boundary with Symphony UI integration |
| `withErrorBoundary` | HOC to wrap components with ErrorBoundary |
| `useRegisteredComponent` | React hook for registry |
| `Box`, `Container`, `Flex`, `Grid`, `Panel`, `Divider` | Layout primitives |
| `Button`, `Input`, `Icon`, `Text`, `Checkbox`, `Select` | Interactive primitives |
| `List`, `Tabs`, `Dropdown`, `Modal`, `Tooltip` | Complex primitives |
| `CodeEditor`, `Terminal`, `SyntaxHighlighter`, `FileTree` | Heavy WASM primitives |
| `PrimitiveError`, `ComponentNotFoundError`, `PathResolutionError`, `WasmLoadError` | Error types |

### Testing Utilities (from `__tests__/utils/`)

#### Snapshot Helpers (`snapshotHelpers.js`)

| Export | Description |
|--------|-------------|
| `renderPrimitiveToSnapshot` | Convert primitives to serializable snapshot structures |
| `createTestPrimitive` | Factory for creating test primitives with children |
| `createLeafPrimitive` | Factory for creating leaf node primitives |
| `createNestedPrimitiveTree` | Generate nested primitive trees for testing |
| `createMockReactComponent` | Create mock React components for primitive types |
| `registerAllMockComponents` | Register all standard mock components |
| `unregisterAllMockComponents` | Clean up registered mock components |
| `compareSnapshots` | Compare two snapshot structures for equality |
| `serializeSnapshot` | Serialize snapshot to stable JSON string |
| `MOCK_COMPONENTS` | Map of all standard primitive types to mock components |

#### Performance Helpers (`performanceHelpers.js`)

| Export | Description |
|--------|-------------|
| `measureRenderTime` | Measures execution time of a synchronous function (single run) |
| `measureRenderTimeAsync` | Measures execution time of an async function (single run) |
| `benchmarkFunction` | Runs function multiple times and returns timing statistics (avg, min, max, p95, p99). Accepts iterations and warmup count parameters for consistent measurements. |
| `generatePrimitiveTree` | Generates a primitive tree with specified node count |
| `generateSimplePrimitive` | Generates a simple primitive (Button, Text, Icon, Input, Checkbox) |
| `generateMediumTree` | Generates a medium complexity tree (10-20 nodes) |
| `generateComplexTree` | Generates a complex tree (50+ nodes) |
| `countTreeNodes` | Counts total nodes in a primitive tree |
| `getTreeDepth` | Calculates maximum depth of a primitive tree |
| `collectTreeTypes` | Collects all unique primitive types in a tree |
| `validatePerformance` | Validates duration against complexity threshold |
| `createPerformanceAssertions` | Creates assertion helpers for performance tests |
| `checkMemoryGrowth` | Checks for memory growth over iterations |
| `checkPerformanceDegradation` | Checks for performance degradation over sequential renders |
| `PERFORMANCE_THRESHOLDS` | Performance budgets: simple (<5ms), medium (<16ms), complex (<50ms) |
| `SIMPLE_PRIMITIVE_TYPES` | Array of simple primitive types for testing |
| `LAYOUT_PRIMITIVE_TYPES` | Array of layout primitive types for tree generation |
| `LEAF_PRIMITIVE_TYPES` | Array of leaf primitive types for tree generation |

#### Contract Validators (`contractValidators.js`)

| Export | Description |
|--------|-------------|
| `validateType` | Validate value matches expected type |
| `validateSchema` | Validate object against schema definition |
| `validateIPCRequest` | Validate IPC request parameters against contract |
| `validateIPCSuccessResponse` | Validate IPC success response against contract |
| `validateIPCErrorResponse` | Validate IPC error response against contract |
| `validateComponentTree` | Recursively validate ComponentTree structure |
| `createValidComponentTree` | Create valid component tree for testing |
| `createValidIPCRequest` | Create valid IPC request for testing |
| `createValidSuccessResponse` | Create valid success response for testing |
| `createValidErrorResponse` | Create valid error response for testing |
| `IPC_CONTRACTS` | Complete IPC contract definitions for all methods |
| `COMPONENT_TREE_SCHEMA` | Schema for ComponentTree structure |
| `SUCCESS_RESPONSE_SCHEMA` | Schema for successful IPC response |
| `ERROR_RESPONSE_SCHEMA` | Schema for error IPC response |

## UI Component Registration

The primitives package includes a registration module that maps primitive types to actual React components from the `ui` package. This enables the primitive system to render real UI components.

### Quick Start

```javascript
import { registerAllUIComponents, isFullyRegistered } from '@symphony/primitives';

// Register all UI components at application startup
const result = registerAllUIComponents();
console.log(`Registered ${result.registered.length} components`);

// Verify registration
if (isFullyRegistered()) {
  console.log('All UI components are registered');
}
```

### Registration Functions

```javascript
import {
  registerAllUIComponents,
  isFullyRegistered,
  getRegisteredUITypes,
  getExpectedUITypes,
} from '@symphony/primitives';

// Register all UI components with options
const result = registerAllUIComponents({
  override: false,  // Don't replace existing registrations
  silent: true,     // Suppress warning logs
});

// Result structure
// {
//   registered: ['Button', 'Input', ...],  // Successfully registered
//   skipped: ['CustomButton'],              // Already registered (skipped)
//   failed: []                              // Failed to register
// }

// Check if all expected components are registered
const fullyRegistered = isFullyRegistered();

// Get list of registered UI types
const registeredTypes = getRegisteredUITypes();
// ['Container', 'Flex', 'Grid', 'Button', 'Input', ...]

// Get list of expected UI types
const expectedTypes = getExpectedUITypes();
// ['Container', 'Flex', 'Grid', 'Panel', 'Divider', ...]
```

### Registered Component Types

The registration module maps the following primitive types to UI components:

| Category | Primitive Types |
|----------|-----------------|
| Layout | Box, Container, Flex, Grid, Panel, Divider, ResizablePanel |
| Interactive | Button, Input, Checkbox, Select, Switch, Slider, Toggle, RadioGroup |
| Complex | Dialog, Modal, Dropdown, Tabs, Tooltip, Popover, Sheet, Accordion |
| Display | Text, Badge, Avatar, Progress, Skeleton, Alert, Card |
| Navigation | NavigationMenu, Breadcrumb, Pagination, Menubar, ContextMenu |
| Form | Label, Textarea, Form |
| Data Display | Table, List, ScrollArea |

### Component Wrappers

Some primitive types use wrapper components to provide a simplified API:

```javascript
import {
  ContainerWrapper,
  FlexWrapper,
  GridWrapper,
  TextWrapper,
  SelectWrapper,
  TooltipWrapper,
  DialogWrapper,
} from '@symphony/primitives';

// ContainerWrapper - Flex container with direction and gap
<ContainerWrapper direction="column" gap={8}>
  {children}
</ContainerWrapper>

// FlexWrapper - Full flexbox control
<FlexWrapper justify="space-between" align="center" wrap="wrap">
  {children}
</FlexWrapper>

// GridWrapper - CSS Grid layout
<GridWrapper columns={3} rows={2} gap={16}>
  {children}
</GridWrapper>

// TextWrapper - Typography with variants
<TextWrapper variant="h1" size="2xl" weight="bold">
  Heading Text
</TextWrapper>

// SelectWrapper - Simplified select with options array
<SelectWrapper
  options={[
    { value: 'a', label: 'Option A' },
    { value: 'b', label: 'Option B' },
  ]}
  value="a"
  onValueChange={handleChange}
/>

// TooltipWrapper - Tooltip with content and position
<TooltipWrapper content="Helpful tip" side="top">
  <Button>Hover me</Button>
</TooltipWrapper>

// DialogWrapper - Dialog with title and description
<DialogWrapper
  title="Confirm Action"
  description="Are you sure?"
  open={isOpen}
  onOpenChange={setIsOpen}
>
  <DialogContent />
</DialogWrapper>
```

### Custom Component Registration

You can register custom components alongside the UI components:

```javascript
import { registerComponent, registerAllUIComponents } from '@symphony/primitives';

// First register all UI components
registerAllUIComponents();

// Then register custom components
registerComponent('CustomWidget', MyCustomWidgetComponent);
registerComponent('SpecialButton', MySpecialButtonComponent);
```

### Override Existing Registrations

To replace existing component registrations:

```javascript
// Override all UI components (useful for theming)
registerAllUIComponents({ override: true });

// Or override specific components
import { registerComponent } from '@symphony/primitives';
registerComponent('Button', MyThemedButton);
```

## License

MIT
