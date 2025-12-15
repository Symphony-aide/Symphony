# Implementation Plan

- [x] 1. Create new UI layout components





  - [x] 1.1 Create Box component in packages/ui


    - Create `packages/ui/components/box.tsx` with padding, margin, display props
    - Use class-variance-authority for variant styling
    - Export from `packages/ui/components/index.ts`
    - _Requirements: 6.1_
  - [x] 1.2 Write property test for Box component


    - **Property 11: Box component applies layout props correctly**
    - **Validates: Requirements 6.1**
  - [x] 1.3 Create Flex component in packages/ui


    - Create `packages/ui/components/flex.tsx` with direction, justify, align, wrap, gap props
    - Use Tailwind classes for flexbox styling
    - Export from `packages/ui/components/index.ts`
    - _Requirements: 6.2_
  - [x] 1.4 Write property test for Flex component


    - **Property 12: Flex component applies flexbox props correctly**
    - **Validates: Requirements 6.2**
  - [x] 1.5 Create Grid component in packages/ui


    - Create `packages/ui/components/grid.tsx` with columns, rows, gap props
    - Use Tailwind classes for CSS grid styling
    - Export from `packages/ui/components/index.ts`
    - _Requirements: 6.3_
  - [x] 1.6 Write property test for Grid component


    - **Property 13: Grid component applies grid props correctly**
    - **Validates: Requirements 6.3**

- [x] 2. Create new UI typography components





  - [x] 2.1 Create Text component in packages/ui


    - Create `packages/ui/components/text.tsx` with size, weight, color, align props
    - Support multiple element types via `as` prop
    - Export from `packages/ui/components/index.ts`
    - _Requirements: 6.4, 5.1_
  - [x] 2.2 Create Heading component in packages/ui


    - Create `packages/ui/components/heading.tsx` with h1-h6 support
    - Use consistent heading styles
    - Export from `packages/ui/components/index.ts`
    - _Requirements: 6.4, 5.2_
  - [x] 2.3 Write property test for Text and Heading components


    - **Property 9: Typography components render correct elements**
    - **Property 14: Text component applies typography props correctly**
    - **Validates: Requirements 5.1, 5.2, 6.4**
  - [x] 2.4 Create Code component in packages/ui


    - Create `packages/ui/components/code.tsx` with inline and block variants
    - Apply monospace font and appropriate background styling
    - Export from `packages/ui/components/index.ts`
    - _Requirements: 6.6, 5.3_
  - [x] 2.5 Write property test for Code component


    - **Property 10: Code component renders with monospace styling**
    - **Property 16: Code component applies code styling**
    - **Validates: Requirements 5.3, 6.6**

- [x] 3. Create Spinner loading component





  - [x] 3.1 Create Spinner component in packages/ui


    - Create `packages/ui/components/spinner.tsx` with size and color variants
    - Include CSS animation for spinning effect
    - Export from `packages/ui/components/index.ts`
    - _Requirements: 6.5_
  - [x] 3.2 Write property test for Spinner component


    - **Property 15: Spinner component renders loading animation**
    - **Validates: Requirements 6.5**

- [x] 4. Checkpoint - Ensure all new UI component tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Update ErrorBoundary to use UI components





  - [x] 5.1 Update DefaultFallback in ErrorBoundary.jsx


    - Import Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter from ui
    - Import Collapsible, CollapsibleTrigger, CollapsibleContent from ui
    - Import Button from ui
    - Import Code component for error stack display
    - Replace plain HTML elements with UI components
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 5.2 Write property tests for ErrorBoundary UI component usage


    - **Property 1: ErrorBoundary uses Card components for error container**
    - **Property 2: ErrorBoundary uses Collapsible for error details**
    - **Property 3: ErrorBoundary uses Button for retry action**
    - **Validates: Requirements 1.1, 1.2, 1.3**

- [x] 6. Update WasmRenderer to use UI components



  - [x] 6.1 Update DefaultWasmErrorFallback in WasmRenderer.jsx


    - Import Alert, AlertTitle, AlertDescription from ui
    - Import Button, Collapsible components from ui
    - Import Text, Code components from ui
    - Replace plain HTML elements with UI components
    - _Requirements: 1.4, 1.5_
  - [x] 6.2 Write property tests for WasmRenderer error fallback


    - **Property 4: WasmRenderer error uses Alert components**
    - **Property 5: WasmRenderer error uses Button for retry**
    - **Validates: Requirements 1.4, 1.5**

  - [x] 6.3 Update WasmLoadingIndicator in WasmRenderer.jsx
    - Import Card, CardContent from ui
    - Import Spinner, Text components from ui
    - Replace plain HTML elements with UI components
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 6.4 Write property test for WasmRenderer loading state

    - **Property 6: WasmRenderer loading state uses UI components**
    - **Validates: Requirements 2.1, 2.2, 2.3**

- [x] 7. Checkpoint - Ensure renderer component tests pass


  - All renderer component tests pass (WasmRendererUI, ErrorBoundaryUI, WasmRenderer.property, PrimitiveRenderer.snapshot)

- [x] 8. Update wrapper components to use UI components
  - [x] 8.1 Update ListWrapper to use ScrollArea
    - Import ScrollArea from ui
    - Wrap list content in ScrollArea for scrollable lists
    - Add scrollable prop to control ScrollArea usage
    - _Requirements: 3.4_
  - [x] 8.2 Write property test for ListWrapper ScrollArea usage
    - **Property 7: ListWrapper uses ScrollArea for scrollable content**
    - **Validates: Requirements 3.4**
  - [x] 8.3 Update FormWrapper to integrate with UI styling
    - Apply consistent form styling classes
    - Ensure form elements work with UI component styles
    - _Requirements: 4.1_
  - [x] 8.4 Write property test for FormWrapper UI integration
    - **Property 8: FormWrapper integrates with UI form styling**
    - **Validates: Requirements 4.1**
  - [x] 8.5 Update TextWrapper to use Text component
    - Import Text, Heading components from ui
    - Use Text component for paragraph content
    - Use Heading component for heading variants
    - _Requirements: 5.1, 5.2_

- [x] 9. Document exceptions for DirectRenderer
  - [x] 9.1 Add JSDoc documentation for MonacoEditorDirect exception
    - Document why plain div is required for Monaco Editor integration
    - Explain performance and DOM access requirements
    - _Requirements: 7.1_
  - [x] 9.2 Add JSDoc documentation for XTermTerminalDirect exception
    - Document why plain div is required for xterm.js integration
    - Explain performance and DOM access requirements
    - _Requirements: 7.2_
  - [x] 9.3 Add JSDoc documentation for layout wrapper exceptions
    - Document performance considerations for layout primitives
    - Explain when plain elements are justified
    - _Requirements: 7.3_

- [x] 10. Implement component tree serialization
  - [x] 10.1 Create ComponentTreeSerializer utility
    - Create `packages/primitives/src/utils/serializer.js`
    - Implement serialize function for component trees
    - Implement parse function for serialized strings
    - _Requirements: 8.1, 8.2_
  - [x] 10.2 Write property test for serialization round-trip
    - **Property 17: Component tree serialization round-trip**
    - **Validates: Requirements 8.1, 8.2, 8.3**

- [x] 11. Final Checkpoint - Ensure all tests pass
  - All 548 tests pass across 20 test files

