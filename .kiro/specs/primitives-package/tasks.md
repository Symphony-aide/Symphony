# Implementation Plan

- [ ] 1. Set up package structure and core utilities
  - [x] 1.1 Create packages/primitives directory structure with src/, __tests__/, and config files





    - Create package.json with dependencies (react, fast-check for testing)
    - Create jsconfig.json for JavaScript with JSDoc type checking
    - Set up vitest configuration for testing
    --_Requirements: 1.1_

  - [x] 1.2 Implement core utility functions (ID generation, type helpers)




    - Create src/core/utils.js with generateId() using crypto.randomUUID or fallback
    - Add type validation helpers
    - _Requirements: 1.1_
  - [x] 1.3 Create JSDoc type definitions in src/core/types.js





    - Define PrimitiveProps, ComponentTree, ModificationPayload types
    - Define RenderStrategy enum type
    - _Requirements: 1.1, 1.5_

- [x] 2. Implement BasePrimitive class





  - [x] 2.1 Create BasePrimitive with constructor, properties, and child manipulation


    - Implement constructor with id, type, props, children, parent initialization
    - Implement appendChild, removeChild, insertChild methods
    - Implement findChild with predicate function
    - _Requirements: 1.1, 1.3, 1.4_
  - [x] 2.2 Write property test for primitive instantiation


    - **Property 1: Primitive Instantiation Correctness**
    - **Validates: Requirements 1.1**
  - [x] 2.3 Implement getPath() method for tree path calculation

    - Traverse parent chain to build path array
    - Return array of type strings from root to current node
    - _Requirements: 1.2_
  - [x] 2.4 Write property test for tree path calculation


    - **Property 2: Tree Path Calculation**
    - **Validates: Requirements 1.2**
  - [x] 2.5 Write property test for child manipulation consistency


    - **Property 3: Child Manipulation Consistency**
    - **Validates: Requirements 1.3, 1.4**
  - [x] 2.6 Implement toTree() serialization method

    - Recursively serialize primitive to ComponentTree JSON structure
    - Include id, type, props, renderStrategy, children
    - _Requirements: 1.5_
  - [x] 2.7 Implement static fromTree() deserialization method

    - Reconstruct primitive hierarchy from ComponentTree JSON
    - Restore all parent-child relationships
    - _Requirements: 1.7_
  - [x] 2.8 Implement toPrettyString() for readable output

    - Format tree as indented string representation
    - _Requirements: 1.6_
  - [x] 2.9 Write property test for serialization round-trip


    - **Property 4: Serialization Round-Trip**
    - **Validates: Requirements 1.5, 1.6, 1.7**

- [x] 3. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement ComponentRegistry





  - [x] 4.1 Create ComponentRegistry class with component storage


    - Implement #components Map for root primitives by name
    - Implement #nodeIndex Map for O(1) node lookup by ID
    - Implement registerComponent, unregisterComponent, getComponent, getComponentNames
    - _Requirements: 2.1, 2.2_
  - [x] 4.2 Write property test for registry registration and indexing


    - **Property 5: Registry Registration and Indexing**
    - **Validates: Requirements 2.1**
  - [x] 4.3 Implement findByPath with array index support

    - Parse path segments including array indices (e.g., "Button[0]")
    - Navigate tree matching types and indices
    - _Requirements: 2.3_
  - [x] 4.4 Write property test for path resolution with array indexing


    - **Property 6: Path Resolution with Array Indexing**
    - **Validates: Requirements 2.3**
  - [x] 4.5 Implement modifyComponent with change notification

    - Update primitive props at specified path
    - Dispatch 'component-tree-changed' CustomEvent
    - _Requirements: 2.4_
  - [x] 4.6 Write property test for component modification and notification


    - **Property 7: Component Modification and Notification**
    - **Validates: Requirements 2.4**
  - [x] 4.7 Implement insertPrimitive method

    - Insert primitive at parent path with optional index
    - Update tree index with new node
    - _Requirements: 2.5_
  - [x] 4.8 Write property test for primitive insertion


    - **Property 8: Primitive Insertion**
    - **Validates: Requirements 2.5**
  - [x] 4.9 Implement removePrimitive method

    - Remove primitive from parent's children
    - Remove from tree index
    - _Requirements: 2.6_
  - [x] 4.10 Write property test for primitive removal


    - **Property 9: Primitive Removal**
    - **Validates: Requirements 2.6**
  - [x] 4.11 Implement event handler registration and invocation

    - Implement registerEventHandler, unregisterEventHandler
    - Implement invokeEventHandler with async support
    - _Requirements: 2.7_
  - [x] 4.12 Write property test for event handler registration and invocation


    - **Property 10: Event Handler Registration and Invocation**
    - **Validates: Requirements 2.7**

- [x] 5. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement Layout Primitives





  - [x] 6.1 Create layout primitive factory functions


    - Implement Container with direction, gap, className props
    - Implement Flex with justify, align, wrap, className props
    - Implement Grid with columns, rows, gap, className props
    - Implement Panel with title, collapsible, defaultCollapsed, className props
    - Implement Divider with orientation, className props (mark as leaf node)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 7. Implement Interactive Primitives





  - [x] 7.1 Create interactive primitive factory functions


    - Implement Button with variant, size, onClick, disabled, className props
    - Implement Input with type, value, onChange, placeholder, disabled props (leaf node)
    - Implement Icon with name, size, color, className props (leaf node)
    - Implement Text with content, variant, size, weight, className props (leaf node)
    - Implement Checkbox with checked, onChange, label, disabled props
    - Implement Select with options, value, onChange, placeholder, disabled props
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 8. Implement Complex Primitives





  - [x] 8.1 Create complex primitive factory functions


    - Implement List with items, renderItem, virtualized, className props
    - Implement Tabs with tabs, activeTab, onTabChange, className props
    - Implement Dropdown with trigger, items, className props
    - Implement Modal with title, open, onClose, size, className props
    - Implement Tooltip with content, position, className props
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  - [x] 8.2 Write property test for primitive type props storage


    - **Property 11: Primitive Type Props Storage**
    - **Validates: Requirements 3.1-3.5, 4.1-4.6, 5.1-5.5, 8.1-8.4**

- [x] 9. Implement Heavy WASM Primitives





  - [x] 9.1 Create heavy primitive factory functions with WASM render strategy


    - Implement CodeEditor with language, value, onChange, theme, fontSize, lineNumbers, minimap, readOnly props
    - Implement Terminal with shellId, theme, fontSize, cursorStyle, onCommand props
    - Implement SyntaxHighlighter with code, language, theme, showLineNumbers props (leaf node)
    - Implement FileTree with files, onFileSelect, virtualized, expandedPaths props
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 10. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement Error Types


  - [x] 11.1 Create custom error classes

    - Implement PrimitiveError base class with message and code
    - Implement ComponentNotFoundError with component name
    - Implement PathResolutionError with component name and path
    - Implement WasmLoadError with module path and cause
    - _Requirements: 14.2, 14.3_
  - [x] 11.2 Write property test for error path resolution





    - **Property 21: Error Path Resolution**
    - **Validates: Requirements 14.2, 14.3**

- [x] 12. Implement React Renderer





  - [x] 12.1 Create PrimitiveRenderer component


    - Map primitive types to React components
    - Handle unknown types with warning and null return
    - _Requirements: 6.1, 6.6_
  - [x] 12.2 Write property test for React renderer type mapping


    - **Property 12: React Renderer Type Mapping**
    - **Validates: Requirements 6.1**
  - [x] 12.3 Implement handler ID to function conversion


    - Convert onClick, onChange, etc. handler IDs to functions
    - Functions invoke componentRegistry.invokeEventHandler
    - _Requirements: 6.2_
  - [x] 12.4 Write property test for handler ID to function conversion


    - **Property 13: Handler ID to Function Conversion**
    - **Validates: Requirements 6.2**
  - [x] 12.5 Implement recursive child rendering with leaf node handling


    - Recursively render children for non-leaf nodes
    - Skip children rendering for leaf nodes
    - _Requirements: 6.3_
  - [x] 12.6 Write property test for recursive child rendering


    - **Property 14: Recursive Child Rendering**
    - **Validates: Requirements 6.3**
  - [x] 12.7 Implement direct render delegation


    - Check renderDirect flag or renderStrategy='direct'
    - Delegate to DirectRenderer component
    - _Requirements: 6.4_
  - [x] 12.8 Write property test for direct render delegation


    - **Property 15: Direct Render Delegation**
    - **Validates: Requirements 6.4, 9.1**
  - [x] 12.9 Create ErrorBoundary component


    - Catch rendering errors and display fallback UI
    - Provide retry functionality
    - _Requirements: 6.5, 14.1_

- [x] 13. Implement Direct Renderer






  - [x] 13.1 Create DirectRenderer component

    - Render MonacoEditor for code editor direct type
    - Render xterm.js for terminal direct type
    - Handle unknown types with warning
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 14. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Implement WASM Renderer





  - [x] 15.1 Create WasmRenderer component


    - Dynamically load WASM modules
    - Create instances with container ID and props
    - _Requirements: 7.1, 7.2_

  - [x] 15.2 Implement WASM component registration with registry

    - Register WASM component's get_tree() with ComponentRegistry
    - _Requirements: 7.3_

  - [x] 15.3 Implement WASM prop updates

    - Call set_<propName> methods on prop changes
    - _Requirements: 7.4_
  - [x] 15.4 Write property test for WASM prop updates


    - **Property 16: WASM Prop Updates**
    - **Validates: Requirements 7.4**
  - [x] 15.5 Implement WASM cleanup on unmount


    - Call destroy() method on component unmount
    - _Requirements: 7.5_


  - [x] 15.6 Implement WASM load error handling
    - Display error message with retry option on load failure
    - _Requirements: 7.6, 14.4_

- [x] 16. Implement useRegisteredComponent Hook





  - [x] 16.1 Create useRegisteredComponent hook


    - Return component tree from registry by name
    - Return null if component doesn't exist
    - _Requirements: 10.1, 10.4_

  - [x] 16.2 Write property test for hook component retrieval

    - **Property 17: Hook Component Retrieval**
    - **Validates: Requirements 10.1, 10.4**
  - [x] 16.3 Implement event subscription for tree changes

    - Subscribe to 'component-tree-changed' events
    - Update state and trigger re-render on change
    - _Requirements: 10.2_
  - [x] 16.4 Write property test for hook event subscription

    - **Property 18: Hook Event Subscription**
    - **Validates: Requirements 10.2**
  - [x] 16.5 Implement cleanup on unmount

    - Remove event listener to prevent memory leaks
    - _Requirements: 10.3_

- [x] 17. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 18. Implement Motif Extension API






  - [x] 18.1 Create MotifAPI class with component operations

    - Implement getComponentList() returning all component names
    - Implement getComponent(name) returning component tree
    - Implement modifyComponent(name, path, modifications)
    - Implement insertPrimitive(name, parentPath, primitive, index)
    - Implement removePrimitive(name, path)
    - Implement registerEventHandler(id, handler)
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [x] 18.2 Write property test for Motif API operations

    - **Property 19: Motif API Operations**
    - **Validates: Requirements 11.1-11.6**

- [x] 19. Implement IPC Bridge Integration






  - [x] 19.1 Create IPC handlers for component operations

    - Implement get_component_tree handler
    - Implement modify_component handler
    - Implement insert_component handler
    - Implement remove_component handler
    - Implement invoke_motif_handler handler
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 20. Implement Performance Monitoring





  - [x] 20.1 Create PerformanceMonitor class


    - Record render times per component
    - Calculate average, min, max, count metrics
    - Log warnings for renders exceeding 16ms
    - Support performance budget alerts
    - _Requirements: 13.1, 13.2, 13.3, 13.4_
  - [x] 20.2 Write property test for performance metrics calculation


    - **Property 20: Performance Metrics Calculation**
    - **Validates: Requirements 13.1, 13.2**

- [x] 21. Create public exports and documentation




  - [x] 21.1 Create src/index.js with all public exports


    - Export BasePrimitive, all primitive factories
    - Export ComponentRegistry, MotifAPI
    - Export PrimitiveRenderer, WasmRenderer, DirectRenderer
    - Export useRegisteredComponent hook
    - Export PerformanceMonitor
    - Export error types
    - _Requirements: All_
  - [x] 21.2 Create README.md with usage documentation


    - Document package installation and setup
    - Provide usage examples for each component
    - Document Motif extension development
    - _Requirements: All_

- [x] 22. Final Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.
