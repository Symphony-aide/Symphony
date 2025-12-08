# Requirements Document

## Introduction

The Primitives Package is a comprehensive UI extensibility system for Symphony IDE that transforms every UI element into an inspectable, modifiable primitive. This enables Motif extensions to have complete transparency and control over the entire UI, supporting Symphony's "Minimal Core, Infinite Intelligence" vision. The system provides a three-layer architecture: Motif Extensions at the top, a Component Registry in the middle, and React/WASM Renderers at the bottom.

## Glossary

- **Primitive**: A base UI element class that all Symphony components inherit from, providing a uniform interface for inspection and modification
- **Motif**: A Symphony extension that can inspect, modify, extend, or replace UI components
- **Component Registry**: Central registry storing all component trees, providing inspection APIs, handling modifications, and notifying renderers of changes
- **WASM Renderer**: Specialized renderer for performance-critical components (code editor, terminal, syntax highlighter)
- **React Renderer**: Renderer for lightweight UI components (buttons, containers, inputs)
- **Direct Renderer**: Performance escape hatch that bypasses the primitive system for maximum performance
- **Component Tree**: Hierarchical structure representing a component and all its children as serializable data
- **Extension Point**: A designated location in a component tree where Motifs can insert custom UI elements
- **IPC Bridge**: Inter-process communication layer enabling Motif extensions to interact with the Component Registry

## Requirements

### Requirement 1: Base Primitive System

**User Story:** As a Symphony core developer, I want a foundational primitive class that all UI elements inherit from, so that every component has a uniform interface for inspection and modification.

#### Acceptance Criteria

1. WHEN a primitive is instantiated THEN the Primitive System SHALL assign a unique identifier, store the type string, and initialize props, children array, and parent reference
2. WHEN a primitive's tree structure is queried THEN the Primitive System SHALL return the complete path from root to the current node
3. WHEN a child primitive is appended THEN the Primitive System SHALL update the child's parent reference and add the child to the children array
4. WHEN a child primitive is removed THEN the Primitive System SHALL remove the child from the children array and clear the child's parent reference
5. WHEN a primitive is serialized for IPC THEN the Primitive System SHALL produce a JSON structure containing id, type, props, renderStrategy, and children array
6. WHEN a primitive is serialized THEN the Primitive System SHALL provide a pretty-printer that converts the tree back to a readable format
7. WHEN a serialized primitive tree is parsed THEN the Primitive System SHALL reconstruct the original primitive hierarchy with all relationships intact

### Requirement 2: Component Registry

**User Story:** As a Motif developer, I want a central registry that stores all component trees, so that I can inspect and modify any component in the IDE.

#### Acceptance Criteria

1. WHEN a component is registered THEN the Component Registry SHALL store the root primitive by name and index all nodes in the tree by their unique IDs
2. WHEN a component is queried by name THEN the Component Registry SHALL return the root primitive of that component
3. WHEN a path query is executed with array indexing (e.g., "Button[0]") THEN the Component Registry SHALL resolve the path and return the correct primitive node
4. WHEN a component modification is applied THEN the Component Registry SHALL update the primitive's props and dispatch a change notification event
5. WHEN a new primitive is inserted THEN the Component Registry SHALL add the primitive to the specified parent at the given index and update all indices
6. WHEN a primitive is removed THEN the Component Registry SHALL remove the primitive from its parent and update the tree index
7. WHEN an event handler is registered THEN the Component Registry SHALL store the handler by ID and make it invocable across the IPC boundary

### Requirement 3: Layout Primitives

**User Story:** As a component developer, I want layout primitives (Container, Flex, Grid, Panel, Divider), so that I can structure UI components using a consistent primitive-based approach.

#### Acceptance Criteria

1. WHEN a Container primitive is created THEN the Primitive System SHALL support direction (row/column), gap, and className props with React rendering strategy
2. WHEN a Flex primitive is created THEN the Primitive System SHALL support justify, align, wrap, and className props
3. WHEN a Grid primitive is created THEN the Primitive System SHALL support columns, rows, gap, and className props
4. WHEN a Panel primitive is created THEN the Primitive System SHALL support title, collapsible, defaultCollapsed, and className props
5. WHEN a Divider primitive is created THEN the Primitive System SHALL mark it as a leaf node and support orientation (horizontal/vertical) prop

### Requirement 4: Interactive Primitives

**User Story:** As a component developer, I want interactive primitives (Button, Input, Icon, Text, Checkbox, Select), so that I can build user-interactive components using the primitive system.

#### Acceptance Criteria

1. WHEN a Button primitive is created THEN the Primitive System SHALL support variant, size, onClick handler ID, disabled, and className props
2. WHEN an Input primitive is created THEN the Primitive System SHALL mark it as a leaf node and support type, value, onChange handler ID, placeholder, and disabled props
3. WHEN an Icon primitive is created THEN the Primitive System SHALL mark it as a leaf node and support name (Lucide icon), size, color, and className props
4. WHEN a Text primitive is created THEN the Primitive System SHALL mark it as a leaf node and support content, variant, size, weight, and className props
5. WHEN a Checkbox primitive is created THEN the Primitive System SHALL support checked, onChange handler ID, label, and disabled props
6. WHEN a Select primitive is created THEN the Primitive System SHALL support options array, value, onChange handler ID, placeholder, and disabled props

### Requirement 5: Complex Primitives

**User Story:** As a component developer, I want complex primitives (List, Tabs, Dropdown, Modal, Tooltip), so that I can build sophisticated UI patterns using the primitive system.

#### Acceptance Criteria

1. WHEN a List primitive is created THEN the Primitive System SHALL support items array, renderItem function ID, virtualized flag, and className props
2. WHEN a Tabs primitive is created THEN the Primitive System SHALL support tabs array with id/label/icon, activeTab, onTabChange handler ID, and className props
3. WHEN a Dropdown primitive is created THEN the Primitive System SHALL support trigger primitive, items array with id/label/icon/onClick, and className props
4. WHEN a Modal primitive is created THEN the Primitive System SHALL support title, open state, onClose handler ID, size, and className props
5. WHEN a Tooltip primitive is created THEN the Primitive System SHALL support content, position (top/bottom/left/right), and className props

### Requirement 6: React Renderer

**User Story:** As a Symphony user, I want primitives to render as actual React components, so that I can see and interact with the UI built from primitives.

#### Acceptance Criteria

1. WHEN a primitive is rendered THEN the React Renderer SHALL map the primitive type to the corresponding React component and pass converted props
2. WHEN a primitive has event handler ID props THEN the React Renderer SHALL convert them to functions that invoke the Component Registry's handler
3. WHEN a primitive has children and is not marked as leaf node THEN the React Renderer SHALL recursively render all child primitives
4. WHEN a primitive is marked with renderDirect flag THEN the React Renderer SHALL delegate to the Direct Renderer instead
5. WHEN a primitive rendering fails THEN the React Renderer SHALL catch the error in an error boundary and display a fallback UI
6. IF a primitive type is unknown THEN the React Renderer SHALL log a warning and return null without crashing

### Requirement 7: WASM Renderer

**User Story:** As a Symphony user, I want performance-critical components (editor, terminal) to render via WASM, so that I get near-native performance for heavy UI elements.

#### Acceptance Criteria

1. WHEN a WASM primitive is rendered THEN the WASM Renderer SHALL dynamically load the specified WASM module
2. WHEN a WASM module is loaded THEN the WASM Renderer SHALL create an instance with the container ID and initial props
3. WHEN a WASM component exposes get_tree() THEN the WASM Renderer SHALL register it with the Component Registry for inspection
4. WHEN WASM primitive props change THEN the WASM Renderer SHALL call the appropriate setter methods on the WASM instance
5. WHEN a WASM component unmounts THEN the WASM Renderer SHALL call the destroy() method to clean up resources
6. IF a WASM module fails to load THEN the WASM Renderer SHALL display an error message with retry option

### Requirement 8: Heavy WASM Primitives

**User Story:** As a Symphony user, I want heavy components (CodeEditor, Terminal, SyntaxHighlighter, FileTree) implemented in WASM, so that I get excellent performance for these critical components.

#### Acceptance Criteria

1. WHEN a CodeEditor primitive is created THEN the Primitive System SHALL set WASM rendering strategy and support language, value, onChange, theme, fontSize, lineNumbers, minimap, and readOnly props
2. WHEN a Terminal primitive is created THEN the Primitive System SHALL set WASM rendering strategy and support shellId, theme, fontSize, cursorStyle, and onCommand props
3. WHEN a SyntaxHighlighter primitive is created THEN the Primitive System SHALL set WASM rendering strategy, mark as leaf node, and support code, language, theme, and showLineNumbers props
4. WHEN a FileTree primitive is created THEN the Primitive System SHALL set WASM rendering strategy and support files array, onFileSelect, virtualized, and expandedPaths props

### Requirement 9: Direct Renderer (Performance Escape Hatch)

**User Story:** As a performance-conscious developer, I want a direct rendering option that bypasses the primitive system, so that I can integrate existing optimized components without overhead.

#### Acceptance Criteria

1. WHEN a primitive has renderDirect flag set THEN the Direct Renderer SHALL render the component directly without primitive wrapper overhead
2. WHEN a MonacoEditor direct primitive is rendered THEN the Direct Renderer SHALL render the existing Monaco Editor component with passed props
3. WHEN an XTermTerminal direct primitive is rendered THEN the Direct Renderer SHALL render the existing xterm.js component with passed props
4. IF an unknown direct render type is encountered THEN the Direct Renderer SHALL log a warning and return null

### Requirement 10: useRegisteredComponent Hook

**User Story:** As a React developer, I want a hook that connects components to the registry, so that my components automatically re-render when the tree changes.

#### Acceptance Criteria

1. WHEN the hook is called with a component name THEN the Hook SHALL return the current component tree from the registry
2. WHEN a component-tree-changed event is dispatched for the component THEN the Hook SHALL update its state and trigger a re-render
3. WHEN the hook unmounts THEN the Hook SHALL remove the event listener to prevent memory leaks
4. WHEN the component doesn't exist in the registry THEN the Hook SHALL return null

### Requirement 11: Motif Extension API

**User Story:** As a Motif developer, I want a comprehensive API to inspect and modify components, so that I can build powerful extensions that customize any part of the UI.

#### Acceptance Criteria

1. WHEN a Motif calls getComponentList() THEN the API SHALL return an array of all registered component names
2. WHEN a Motif calls getComponent(name) THEN the API SHALL return the complete component tree for that component
3. WHEN a Motif calls modifyComponent(name, path, modifications) THEN the API SHALL apply the modifications to the specified primitive
4. WHEN a Motif calls insertPrimitive(name, parentPath, primitive, index) THEN the API SHALL insert the new primitive at the specified location
5. WHEN a Motif calls removePrimitive(name, path) THEN the API SHALL remove the primitive at the specified path
6. WHEN a Motif calls registerEventHandler(id, handler) THEN the API SHALL register the handler for invocation via IPC

### Requirement 12: IPC Bridge Integration

**User Story:** As a backend Motif developer, I want IPC handlers for component operations, so that Python and Rust Motifs can interact with the UI.

#### Acceptance Criteria

1. WHEN a get_component_tree IPC request is received THEN the Backend SHALL serialize and return the component tree
2. WHEN a modify_component IPC request is received THEN the Backend SHALL apply modifications and sync with frontend
3. WHEN an insert_component IPC request is received THEN the Backend SHALL insert the primitive and notify frontend
4. WHEN a remove_component IPC request is received THEN the Backend SHALL remove the primitive and notify frontend
5. WHEN an invoke_motif_handler IPC request is received THEN the Backend SHALL invoke the registered handler with provided arguments

### Requirement 13: Performance Monitoring

**User Story:** As a Symphony developer, I want performance monitoring for the primitive system, so that I can identify and fix performance issues.

#### Acceptance Criteria

1. WHEN a component renders THEN the Performance Monitor SHALL measure and record the render time
2. WHEN performance metrics are queried THEN the Performance Monitor SHALL return average, min, max, and count for each component
3. WHEN a render exceeds 16ms THEN the Performance Monitor SHALL log a warning with the component name and duration
4. WHEN performance budgets are defined THEN the Performance Monitor SHALL alert when budgets are exceeded

### Requirement 14: Error Handling

**User Story:** As a Symphony user, I want graceful error handling throughout the primitive system, so that errors in one component don't crash the entire IDE.

#### Acceptance Criteria

1. WHEN a primitive rendering fails THEN the Error Handler SHALL display a fallback UI with error details and retry option
2. WHEN a path resolution fails THEN the Error Handler SHALL throw a descriptive error with the invalid path
3. WHEN a modification targets a non-existent component THEN the Error Handler SHALL throw an error with the component name
4. WHEN a WASM component fails to initialize THEN the Error Handler SHALL display an error message and allow retry
