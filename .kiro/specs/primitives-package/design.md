# Design Document: Primitives Package

## Overview

The Primitives Package is a comprehensive UI extensibility system that transforms Symphony's UI architecture from traditional "black box" components into fully transparent, inspectable, and modifiable primitives. This enables Motif extensions to have complete control over every UI element, supporting Symphony's "Minimal Core, Infinite Intelligence" vision.

The system implements a three-layer architecture:
1. **Motif Extensions Layer** - Python/Rust/TypeScript extensions that inspect and modify components
2. **Component Registry Layer** - Central registry storing component trees and handling modifications
3. **Renderer Layer** - React and WASM renderers that convert primitives to actual UI

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   MOTIF EXTENSIONS                          │
│         (Python/Rust/TypeScript Extensions)                 │
│         Can inspect and modify any component                │
└────────────────────┬────────────────────────────────────────┘
                     │ IPC Bridge
┌────────────────────▼────────────────────────────────────────┐
│              COMPONENT REGISTRY                             │
│    - Stores all component trees                             │
│    - Provides inspection API                                │
│    - Handles modifications                                  │
│    - Notifies React of changes                              │
└────────────┬───────────────────────┬────────────────────────┘
             │                       │
    ┌────────▼────────┐    ┌────────▼────────┐
    │ REACT RENDERER  │    │  WASM RENDERER  │
    │  (Light UI)     │    │  (Heavy UI)     │
    │  - Buttons      │    │  - CodeEditor   │
    │  - Containers   │    │  - Terminal     │
    │  - Inputs       │    │  - Highlighter  │
    └─────────────────┘    └─────────────────┘
```

### Package Structure

```
packages/primitives/
├── src/
│   ├── core/
│   │   ├── BasePrimitive.js      # Base class for all primitives
│   │   ├── types.js              # JSDoc type definitions
│   │   └── utils.js              # ID generation, helpers
│   ├── primitives/
│   │   ├── layout.js             # Container, Flex, Grid, Panel, Divider
│   │   ├── interactive.js        # Button, Input, Icon, Text, Checkbox, Select
│   │   ├── complex.js            # List, Tabs, Dropdown, Modal, Tooltip
│   │   └── heavy.js              # CodeEditor, Terminal, SyntaxHighlighter, FileTree
│   ├── registry/
│   │   ├── ComponentRegistry.js  # Central registry
│   │   └── EventHandlerRegistry.js
│   ├── renderers/
│   │   ├── PrimitiveRenderer.jsx # React renderer
│   │   ├── WasmRenderer.jsx      # WASM renderer
│   │   ├── DirectRenderer.jsx    # Direct render escape hatch
│   │   └── ErrorBoundary.jsx     # Error handling
│   ├── hooks/
│   │   └── useRegisteredComponent.js
│   ├── monitoring/
│   │   └── PerformanceMonitor.js
│   └── index.js                  # Public exports
├── __tests__/
│   ├── BasePrimitive.test.js
│   ├── ComponentRegistry.test.js
│   ├── primitives.test.js
│   └── renderers.test.jsx
├── package.json
├── jsconfig.json
└── README.md
```

## Components and Interfaces

### BasePrimitive Class

```javascript
/**
 * @typedef {Object.<string, *>} PrimitiveProps
 */

/**
 * @typedef {Object} ComponentTree
 * @property {string} id
 * @property {string} type
 * @property {PrimitiveProps} props
 * @property {'react' | 'wasm' | 'direct'} renderStrategy
 * @property {ComponentTree[]} children
 */

/**
 * Base class for all primitives
 */
class BasePrimitive {
  /** @type {string} */
  id;
  /** @type {string} */
  type;
  /** @type {PrimitiveProps} */
  props;
  /** @type {BasePrimitive[]} */
  children;
  /** @type {BasePrimitive | null} */
  parent;
  
  /** @type {'react' | 'wasm' | 'direct'} */
  renderStrategy;
  /** @type {string | undefined} */
  wasmModule;
  /** @type {boolean} */
  isLeafNode;
  /** @type {boolean} */
  renderDirect;
  
  /**
   * @param {string} type
   * @param {PrimitiveProps} [props]
   */
  constructor(type, props) { }
  
  /** @returns {string[]} */
  getPath() { }
  /** @param {BasePrimitive} child */
  appendChild(child) { }
  /** @param {BasePrimitive} child */
  removeChild(child) { }
  /** @param {BasePrimitive} child @param {number} index */
  insertChild(child, index) { }
  /** @param {function(BasePrimitive): boolean} predicate @returns {BasePrimitive | null} */
  findChild(predicate) { }
  
  /** @returns {ComponentTree} */
  toTree() { }
  /** @param {ComponentTree} tree @returns {BasePrimitive} */
  static fromTree(tree) { }
  /** @param {number} [indent] @returns {string} */
  toPrettyString(indent) { }
}
```

### ComponentRegistry Class

```javascript
/**
 * @typedef {Object} ModificationPayload
 * @property {Partial<PrimitiveProps>} [props]
 */

/**
 * Central registry for all component trees
 */
class ComponentRegistry {
  /** @type {Map<string, BasePrimitive>} */
  #components;
  /** @type {Map<string, BasePrimitive>} */
  #nodeIndex;
  /** @type {Map<string, Function>} */
  #eventHandlers;
  /** @type {Map<string, WasmComponentInstance>} */
  #wasmInstances;
  
  /** @param {string} name @param {BasePrimitive} root */
  registerComponent(name, root) { }
  /** @param {string} name */
  unregisterComponent(name) { }
  /** @param {string} name @returns {BasePrimitive | undefined} */
  getComponent(name) { }
  /** @returns {string[]} */
  getComponentNames() { }
  /** @param {string} name @returns {ComponentTree | null} */
  getComponentTree(name) { }
  
  /** @param {string} componentName @param {string[]} path @returns {BasePrimitive | null} */
  findByPath(componentName, path) { }
  /** @param {string} name @param {string[]} path @param {ModificationPayload} mods */
  modifyComponent(name, path, mods) { }
  /** @param {string} name @param {string[]} parentPath @param {BasePrimitive} primitive @param {number} [index] */
  insertPrimitive(name, parentPath, primitive, index) { }
  /** @param {string} name @param {string[]} path */
  removePrimitive(name, path) { }
  
  /** @param {string} id @param {Function} handler */
  registerEventHandler(id, handler) { }
  /** @param {string} id */
  unregisterEventHandler(id) { }
  /** @param {string} id @param {...*} args @returns {Promise<*>} */
  invokeEventHandler(id, ...args) { }
  
  /** @param {string} id @param {WasmComponentInstance} instance */
  registerWasmComponent(id, instance) { }
  /** @param {string} id @returns {WasmComponentInstance | undefined} */
  getWasmComponent(id) { }
  
  /** @param {BasePrimitive} node */
  #indexTree(node) { }
  /** @param {string} componentName */
  #notifyChange(componentName) { }
}
```

### Primitive Types

```javascript
/**
 * Layout Primitives
 * @typedef {Object} ContainerProps
 * @property {'row' | 'column'} [direction]
 * @property {number} [gap]
 * @property {string} [className]
 */

/**
 * @typedef {Object} FlexProps
 * @property {'start' | 'center' | 'end' | 'between'} [justify]
 * @property {'start' | 'center' | 'end' | 'stretch'} [align]
 * @property {boolean} [wrap]
 * @property {string} [className]
 */

/**
 * @typedef {Object} GridProps
 * @property {number} [columns]
 * @property {number} [rows]
 * @property {number} [gap]
 * @property {string} [className]
 */

/**
 * @typedef {Object} PanelProps
 * @property {string} [title]
 * @property {boolean} [collapsible]
 * @property {boolean} [defaultCollapsed]
 * @property {string} [className]
 */

/**
 * @typedef {Object} DividerProps
 * @property {'horizontal' | 'vertical'} [orientation]
 * @property {string} [className]
 */

/**
 * Interactive Primitives
 * @typedef {Object} ButtonProps
 * @property {'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'} [variant]
 * @property {'default' | 'sm' | 'lg' | 'icon'} [size]
 * @property {string} [onClick] - Handler ID
 * @property {boolean} [disabled]
 * @property {string} [className]
 */

/**
 * @typedef {Object} InputProps
 * @property {'text' | 'password' | 'email' | 'number'} [type]
 * @property {string} [value]
 * @property {string} [onChange] - Handler ID
 * @property {string} [placeholder]
 * @property {boolean} [disabled]
 * @property {string} [className]
 */

/**
 * @typedef {Object} IconProps
 * @property {string} name - Lucide icon name
 * @property {number} [size]
 * @property {string} [color]
 * @property {string} [className]
 */

/**
 * @typedef {Object} TextProps
 * @property {string} content
 * @property {'body' | 'heading' | 'caption' | 'code'} [variant]
 * @property {'xs' | 'sm' | 'md' | 'lg' | 'xl'} [size]
 * @property {'normal' | 'medium' | 'semibold' | 'bold'} [weight]
 * @property {string} [className]
 */

/**
 * Heavy WASM Primitives
 * @typedef {Object} CodeEditorProps
 * @property {string} [language]
 * @property {string} [value]
 * @property {string} [onChange]
 * @property {string} [theme]
 * @property {number} [fontSize]
 * @property {boolean} [lineNumbers]
 * @property {boolean} [minimap]
 * @property {boolean} [readOnly]
 * @property {string} [className]
 */

/**
 * @typedef {Object} TerminalProps
 * @property {string} [shellId]
 * @property {string} [theme]
 * @property {number} [fontSize]
 * @property {'block' | 'underline' | 'bar'} [cursorStyle]
 * @property {string} [onCommand]
 * @property {string} [className]
 */
```

### Renderer Interfaces

```javascript
/**
 * @typedef {Object} PrimitiveRendererProps
 * @property {BasePrimitive} primitive
 */

/**
 * @typedef {Object} WasmComponentInstance
 * @property {function(): ComponentTree} getTree
 * @property {function(string[], PrimitiveProps): void} modify
 * @property {function(): void} destroy
 */

/**
 * @typedef {Object} WasmModule
 * @property {function(string, PrimitiveProps): WasmComponentInstance} constructor
 */
```

## Data Models

### Component Tree Structure

```javascript
/**
 * Serialized tree for IPC
 * @typedef {Object} ComponentTree
 * @property {string} id - Unique identifier
 * @property {string} type - Primitive type name
 * @property {Object.<string, *>} props - Component properties
 * @property {'react' | 'wasm' | 'direct'} renderStrategy
 * @property {ComponentTree[]} children
 */

// Example serialized tree
{
  "id": "activity-bar-root",
  "type": "Container",
  "props": { "direction": "column", "className": "activity-bar" },
  "renderStrategy": "react",
  "children": [
    {
      "id": "activity-bar-top",
      "type": "Flex",
      "props": { "direction": "column", "gap": 4 },
      "renderStrategy": "react",
      "children": [
        {
          "id": "files-button",
          "type": "Button",
          "props": { "variant": "ghost", "onClick": "open_files_handler" },
          "renderStrategy": "react",
          "children": []
        }
      ]
    }
  ]
}
```

### Path Resolution Format

```javascript
// Path format: ["RootType", "ChildType", "GrandchildType[index]"]
// Examples:
// ["Container", "Flex", "Button[0]"] - First button in Flex
// ["Panel", "List", "Text"] - Text inside List inside Panel
// ["Grid", "Container[2]", "Icon"] - Icon in third Grid cell
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Primitive Instantiation Correctness
*For any* valid type string and props object, when a primitive is instantiated, the primitive SHALL have a unique non-empty ID, the correct type, all provided props stored, an empty children array, and null parent reference.
**Validates: Requirements 1.1**

### Property 2: Tree Path Calculation
*For any* primitive tree of arbitrary depth, when getPath() is called on any node, the returned path SHALL correctly trace from the root to that node, with each element being the type of the ancestor at that level.
**Validates: Requirements 1.2**

### Property 3: Child Manipulation Consistency
*For any* parent primitive and child primitive, after appendChild the child's parent SHALL reference the parent AND the parent's children SHALL contain the child; after removeChild the child's parent SHALL be null AND the parent's children SHALL NOT contain the child.
**Validates: Requirements 1.3, 1.4**

### Property 4: Serialization Round-Trip
*For any* valid primitive tree, serializing with toTree() then reconstructing with fromTree() SHALL produce a tree that is structurally equivalent to the original, with all IDs, types, props, and parent-child relationships preserved.
**Validates: Requirements 1.5, 1.6, 1.7**

### Property 5: Registry Registration and Indexing
*For any* component tree registered with a name, the registry SHALL store the root accessible by that name AND every node in the tree SHALL be indexed by its unique ID for O(1) lookup.
**Validates: Requirements 2.1**

### Property 6: Path Resolution with Array Indexing
*For any* valid path including array indices (e.g., "Button[0]"), findByPath SHALL return the correct primitive node by matching types and selecting the nth child of that type when an index is specified.
**Validates: Requirements 2.3**

### Property 7: Component Modification and Notification
*For any* registered component and valid modification, after modifyComponent is called, the target primitive's props SHALL be updated AND a 'component-tree-changed' event SHALL be dispatched with the component name.
**Validates: Requirements 2.4**

### Property 8: Primitive Insertion
*For any* registered component, valid parent path, and new primitive, after insertPrimitive is called, the new primitive SHALL appear in the parent's children at the specified index (or at the end if no index), and the tree index SHALL include the new primitive.
**Validates: Requirements 2.5**

### Property 9: Primitive Removal
*For any* registered component and valid path to a non-root primitive, after removePrimitive is called, the primitive SHALL NOT be in its former parent's children AND SHALL NOT be in the tree index.
**Validates: Requirements 2.6**

### Property 10: Event Handler Registration and Invocation
*For any* handler ID and function, after registerEventHandler is called, invokeEventHandler with that ID SHALL call the registered function with the provided arguments and return its result.
**Validates: Requirements 2.7**

### Property 11: Primitive Type Props Storage
*For any* primitive type (layout, interactive, complex, or heavy) and valid props for that type, the created primitive SHALL store all provided props accessible via the props property, with correct default values for omitted optional props.
**Validates: Requirements 3.1-3.5, 4.1-4.6, 5.1-5.5, 8.1-8.4**

### Property 12: React Renderer Type Mapping
*For any* primitive with renderStrategy 'react', the PrimitiveRenderer SHALL select the correct React component from the component map based on the primitive's type.
**Validates: Requirements 6.1**

### Property 13: Handler ID to Function Conversion
*For any* primitive prop that is a handler ID (props starting with 'on'), the React Renderer SHALL convert it to a function that invokes componentRegistry.invokeEventHandler with that ID.
**Validates: Requirements 6.2**

### Property 14: Recursive Child Rendering
*For any* primitive with isLeafNode=false and non-empty children array, the React Renderer SHALL recursively render all children; for primitives with isLeafNode=true, children SHALL NOT be rendered.
**Validates: Requirements 6.3**

### Property 15: Direct Render Delegation
*For any* primitive with renderDirect=true OR renderStrategy='direct', the PrimitiveRenderer SHALL delegate to DirectRenderer instead of rendering through the component map.
**Validates: Requirements 6.4, 9.1**

### Property 16: WASM Prop Updates
*For any* WASM primitive whose props change after initial render, the WasmRenderer SHALL call the appropriate setter method (set_<propName>) on the WASM instance for each changed prop.
**Validates: Requirements 7.4**

### Property 17: Hook Component Retrieval
*For any* component name, useRegisteredComponent SHALL return the component tree if it exists in the registry, or null if it does not exist.
**Validates: Requirements 10.1, 10.4**

### Property 18: Hook Event Subscription
*For any* component name where the hook is active, when a 'component-tree-changed' event is dispatched for that component, the hook SHALL update its state and trigger a React re-render.
**Validates: Requirements 10.2**

### Property 19: Motif API Operations
*For any* sequence of Motif API operations (getComponentList, getComponent, modifyComponent, insertPrimitive, removePrimitive), the operations SHALL correctly reflect the current state of the registry and modifications SHALL be immediately visible to subsequent queries.
**Validates: Requirements 11.1-11.6**

### Property 20: Performance Metrics Calculation
*For any* component that renders one or more times, the PerformanceMonitor SHALL correctly calculate and return the average, minimum, maximum render times and total render count.
**Validates: Requirements 13.1, 13.2**

### Property 21: Error Path Resolution
*For any* invalid path (non-existent component or invalid path segment), the error thrown SHALL contain the component name and/or the invalid path for debugging purposes.
**Validates: Requirements 14.2, 14.3**

## Error Handling

### Error Types

```javascript
class PrimitiveError extends Error {
  /**
   * @param {string} message
   * @param {string} code
   */
  constructor(message, code) {
    super(message);
    this.name = 'PrimitiveError';
    this.code = code;
  }
}

class ComponentNotFoundError extends PrimitiveError {
  /**
   * @param {string} componentName
   */
  constructor(componentName) {
    super(`Component not found: ${componentName}`, 'COMPONENT_NOT_FOUND');
  }
}

class PathResolutionError extends PrimitiveError {
  /**
   * @param {string} componentName
   * @param {string[]} path
   */
  constructor(componentName, path) {
    super(
      `Path resolution failed for component "${componentName}" at path: ${path.join('/')}`,
      'PATH_RESOLUTION_FAILED'
    );
  }
}

class WasmLoadError extends PrimitiveError {
  /**
   * @param {string} modulePath
   * @param {Error} [cause]
   */
  constructor(modulePath, cause) {
    super(`Failed to load WASM module: ${modulePath}`, 'WASM_LOAD_FAILED');
    this.cause = cause;
  }
}
```

### Error Boundary Component

```javascript
/**
 * @typedef {Object} ErrorBoundaryProps
 * @property {React.ReactNode} children
 * @property {React.ComponentType<{ error: Error, retry: function(): void }>} [fallback]
 * @property {function(Error, React.ErrorInfo): void} [onError]
 */

// Catches rendering errors and displays fallback UI
// Provides retry functionality
// Logs errors for debugging
```

## Testing Strategy

### Dual Testing Approach

The primitives package uses both unit tests and property-based tests:

1. **Unit Tests** - Verify specific examples and edge cases
2. **Property-Based Tests** - Verify universal properties across all inputs

### Property-Based Testing Framework

**Library**: fast-check (JavaScript property-based testing library)

**Configuration**: Minimum 100 iterations per property test

**Test File Naming**: `*.property.test.js`

### Test Categories

1. **BasePrimitive Tests**
   - Instantiation with various props
   - Tree manipulation (append, remove, insert)
   - Path calculation
   - Serialization round-trip

2. **ComponentRegistry Tests**
   - Registration and retrieval
   - Path resolution with array indices
   - Modification and notification
   - Event handler management

3. **Primitive Type Tests**
   - All layout primitives with various props
   - All interactive primitives with handlers
   - All complex primitives
   - All heavy WASM primitives

4. **Renderer Tests**
   - React renderer type mapping
   - Handler conversion
   - Child rendering
   - Direct render delegation
   - WASM renderer lifecycle

5. **Hook Tests**
   - Component retrieval
   - Event subscription
   - Cleanup on unmount

6. **Integration Tests**
   - Full flow from Motif API to UI update
   - IPC round-trip
   - Performance under load

### Property Test Annotation Format

Each property-based test MUST include a comment in this format:
```javascript
/**
 * **Feature: primitives-package, Property 4: Serialization Round-Trip**
 * For any valid primitive tree, serializing then parsing produces equivalent tree
 */
```
