# Implementation Plan

- [x] 1. Set up testing infrastructure





  - [x] 1.1 Create test utility helpers for snapshot testing


    - Create `packages/primitives/__tests__/utils/snapshotHelpers.js`
    - Implement `renderPrimitiveToSnapshot()` function
    - Implement `createTestPrimitive()` factory function
    - Add mock React components for testing
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 1.2 Create contract validation utilities


    - Create `packages/primitives/__tests__/utils/contractValidators.js`
    - Implement schema validation functions for IPC contracts
    - Define IPC_CONTRACTS object with all method schemas
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 1.3 Create performance testing utilities


    - Create `packages/primitives/__tests__/utils/performanceHelpers.js`
    - Implement `measureRenderTime()` function
    - Implement `generatePrimitiveTree()` for creating trees of various sizes
    - Define PERFORMANCE_THRESHOLDS constants
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 2. Implement Snapshot Tests for Renderers





  - [x] 2.1 Create snapshot tests for layout primitives


    - Create `packages/primitives/__tests__/renderers/PrimitiveRenderer.snapshot.test.jsx`
    - Write snapshot tests for Container, Flex, Grid, Panel, Divider
    - _Requirements: 1.1_

  - [x] 2.2 Add snapshot tests for interactive primitives

    - Add snapshot tests for Button, Input, Icon, Text, Checkbox, Select
    - _Requirements: 1.2_

  - [x] 2.3 Add snapshot tests for complex primitives

    - Add snapshot tests for List, Tabs, Dropdown, Modal, Tooltip
    - _Requirements: 1.3_


  - [x] 2.4 Add snapshot tests for nested primitive trees
    - Create test cases with 2-3 levels of nesting
    - Verify complete tree structure is captured
    - _Requirements: 1.4_

  - [x] 2.5 Add snapshot test for ErrorBoundary fallback

    - Create test that triggers error boundary
    - Capture fallback UI snapshot
    - _Requirements: 1.6_

- [x] 3. Checkpoint - Ensure all snapshot tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement Contract Tests for IPC Bridge





  - [x] 4.1 Create contract tests for get_component_tree


    - Create `packages/primitives/__tests__/ipc/IPCBridge.contract.test.js`
    - Test success response schema (id, type, props, renderStrategy, children)
    - Test error response for non-existent component
    - _Requirements: 2.1_


  - [x] 4.2 Write property test for IPC response schema compliance

    - **Property 1: IPC Response Schema Compliance**
    - **Validates: Requirements 2.1**

  - [x] 4.3 Add contract tests for modify_component


    - Test request validation (name, path, modifications)
    - Test success response with modified=true
    - Test error responses for invalid requests
    - _Requirements: 2.2_

  - [x] 4.4 Write property test for IPC modification contract


    - **Property 2: IPC Modification Contract**
    - **Validates: Requirements 2.2**

  - [x] 4.5 Add contract tests for insert_component


    - Test request validation (name, parentPath, primitive, index)
    - Test success response with inserted=true and primitiveId
    - Test error responses for invalid requests
    - _Requirements: 2.3_

  - [x] 4.6 Write property test for IPC insertion contract

    - **Property 3: IPC Insertion Contract**
    - **Validates: Requirements 2.3**


  - [x] 4.7 Add contract tests for remove_component
    - Test request validation (name, path)
    - Test success response with removed=true
    - Test error responses for invalid requests
    - _Requirements: 2.4_


  - [x] 4.8 Write property test for IPC removal contract
    - **Property 4: IPC Removal Contract**
    - **Validates: Requirements 2.4**

  - [x] 4.9 Add contract tests for invoke_motif_handler

    - Test request validation (handlerId, args)
    - Test success response with result field
    - Test error responses for invalid requests
    - _Requirements: 2.5_


  - [x] 4.10 Write property test for IPC handler invocation contract
    - **Property 5: IPC Handler Invocation Contract**
    - **Validates: Requirements 2.5**

  - [x] 4.11 Add contract tests for error responses

    - Test all methods return proper error format
    - Verify error code and message are present
    - _Requirements: 2.6_


  - [x] 4.12 Write property test for IPC error response contract
    - **Property 6: IPC Error Response Contract**
    - **Validates: Requirements 2.6**

- [x] 5. Checkpoint - Ensure all contract tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement Performance Tests


  - [x] 6.1 Create performance tests for simple primitives


    - Create `packages/primitives/__tests__/performance/render.perf.test.js`
    - Test Button, Text, Icon, Input, Checkbox render times
    - Verify all render under 5ms threshold
    - _Requirements: 3.1_

  - [x] 6.2 Write property test for simple primitive render performance


    - **Property 7: Simple Primitive Render Performance**
    - **Validates: Requirements 3.1**


  - [x] 6.3 Add performance tests for medium complexity trees

    - Generate trees with 10-20 nodes
    - Verify render under 16ms threshold
    - _Requirements: 3.2_


  - [x] 6.4 Write property test for medium tree render performance

    - **Property 8: Medium Tree Render Performance**
    - **Validates: Requirements 3.2**



  - [x] 6.5 Add performance tests for complex trees
    - Generate trees with 50+ nodes
    - Verify render under 50ms threshold
    - _Requirements: 3.3_


  - [x] 6.6 Write property test for complex tree render performance

    - **Property 9: Complex Tree Render Performance**
    - **Validates: Requirements 3.3**



  - [x] 6.7 Add tests for PerformanceMonitor warning triggers
    - Create `packages/primitives/__tests__/monitoring/PerformanceMonitor.perf.test.js`
    - Test that renders exceeding 16ms trigger warnings
    - Verify warning callback receives correct data
    - _Requirements: 3.5_


  - [x] 6.8 Write property test for performance warning trigger

    - **Property 10: Performance Warning Trigger**
    - **Validates: Requirements 3.5**

  - [x] 6.9 Add tests for budget alert triggers

    - Test component-specific budget alerts
    - Verify alert callback receives componentName, duration, threshold, level
    - _Requirements: 3.6_

  - [x] 6.10 Write property test for budget alert trigger


    - **Property 11: Budget Alert Trigger**
    - **Validates: Requirements 3.6**



  - [x] 6.11 Add memory leak detection test

    - Run 100+ sequential renders
    - Verify no significant memory growth or performance degradation
    - _Requirements: 3.7_

- [x] 7. Final Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

