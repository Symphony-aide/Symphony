# Requirements Document

## Introduction

This specification defines the integration between Symphony's Primitives Package and the UI component library (`packages/ui`). The goal is to register all 50+ UI components from `packages/ui` with the PrimitiveRenderer's component map, enabling the primitive system to render actual React components. This integration is essential for Symphony's UI extensibility vision, allowing Motif extensions to inspect and modify any UI element.

## Glossary

- **Primitive Registration**: The process of mapping a primitive type string (e.g., "Button") to its corresponding React component implementation
- **Component Map**: The internal Map structure in PrimitiveRenderer that stores type-to-component mappings
- **UI Component**: A React component from the `packages/ui` library (Shadcn/Radix-based)
- **Primitive Type**: A string identifier used to reference a component in the primitive system (e.g., "Button", "Input", "Dialog")
- **Registration Module**: A dedicated module that handles the registration of all UI components with the primitive system

## Requirements

### Requirement 1: Core Component Registration Module

**User Story:** As a Symphony developer, I want a centralized module that registers all UI components with the primitive system, so that primitives can be rendered as actual React components.

#### Acceptance Criteria

1. WHEN the registration module is imported THEN the Registration Module SHALL export a `registerAllUIComponents` function that registers all UI components with the PrimitiveRenderer
2. WHEN `registerAllUIComponents` is called THEN the Registration Module SHALL register each UI component type with its corresponding React component from `packages/ui`
3. WHEN a component is registered THEN the Registration Module SHALL use the component's display name or a standardized type string as the registration key
4. WHEN the registration module is initialized THEN the Registration Module SHALL provide a way to verify which components have been registered
5. WHEN a registration conflict occurs (same type already registered) THEN the Registration Module SHALL log a warning and optionally skip or override based on configuration

### Requirement 2: Layout Component Registration

**User Story:** As a component developer, I want layout-related UI components registered with the primitive system, so that layout primitives render correctly.

#### Acceptance Criteria

1. WHEN layout components are registered THEN the Registration Module SHALL map "Container" primitive type to a flex container component
2. WHEN layout components are registered THEN the Registration Module SHALL map "Flex" primitive type to a flexbox layout component
3. WHEN layout components are registered THEN the Registration Module SHALL map "Grid" primitive type to a CSS grid layout component
4. WHEN layout components are registered THEN the Registration Module SHALL map "Panel" primitive type to the Card component with collapsible support
5. WHEN layout components are registered THEN the Registration Module SHALL map "Divider" primitive type to the Separator component
6. WHEN layout components are registered THEN the Registration Module SHALL map "ResizablePanel" primitive type to the ResizablePanel component

### Requirement 3: Interactive Component Registration

**User Story:** As a component developer, I want interactive UI components registered with the primitive system, so that interactive primitives render correctly.

#### Acceptance Criteria

1. WHEN interactive components are registered THEN the Registration Module SHALL map "Button" primitive type to the Button component with all variant support
2. WHEN interactive components are registered THEN the Registration Module SHALL map "Input" primitive type to the Input component
3. WHEN interactive components are registered THEN the Registration Module SHALL map "Checkbox" primitive type to the Checkbox component
4. WHEN interactive components are registered THEN the Registration Module SHALL map "Select" primitive type to the Select component family
5. WHEN interactive components are registered THEN the Registration Module SHALL map "Switch" primitive type to the Switch component
6. WHEN interactive components are registered THEN the Registration Module SHALL map "Slider" primitive type to the Slider component
7. WHEN interactive components are registered THEN the Registration Module SHALL map "Toggle" primitive type to the Toggle component
8. WHEN interactive components are registered THEN the Registration Module SHALL map "RadioGroup" primitive type to the RadioGroup component

### Requirement 4: Complex Component Registration

**User Story:** As a component developer, I want complex UI components registered with the primitive system, so that complex primitives render correctly.

#### Acceptance Criteria

1. WHEN complex components are registered THEN the Registration Module SHALL map "Dialog" primitive type to the Dialog component family
2. WHEN complex components are registered THEN the Registration Module SHALL map "Modal" primitive type to the Dialog component (alias)
3. WHEN complex components are registered THEN the Registration Module SHALL map "Dropdown" primitive type to the DropdownMenu component family
4. WHEN complex components are registered THEN the Registration Module SHALL map "Tabs" primitive type to the Tabs component family
5. WHEN complex components are registered THEN the Registration Module SHALL map "Tooltip" primitive type to the Tooltip component family
6. WHEN complex components are registered THEN the Registration Module SHALL map "Popover" primitive type to the Popover component family
7. WHEN complex components are registered THEN the Registration Module SHALL map "Sheet" primitive type to the Sheet component family
8. WHEN complex components are registered THEN the Registration Module SHALL map "Accordion" primitive type to the Accordion component family

### Requirement 5: Display Component Registration

**User Story:** As a component developer, I want display-related UI components registered with the primitive system, so that display primitives render correctly.

#### Acceptance Criteria

1. WHEN display components are registered THEN the Registration Module SHALL map "Text" primitive type to a text rendering component
2. WHEN display components are registered THEN the Registration Module SHALL map "Badge" primitive type to the Badge component
3. WHEN display components are registered THEN the Registration Module SHALL map "Avatar" primitive type to the Avatar component family
4. WHEN display components are registered THEN the Registration Module SHALL map "Progress" primitive type to the Progress component
5. WHEN display components are registered THEN the Registration Module SHALL map "Skeleton" primitive type to the Skeleton component
6. WHEN display components are registered THEN the Registration Module SHALL map "Alert" primitive type to the Alert component family
7. WHEN display components are registered THEN the Registration Module SHALL map "Card" primitive type to the Card component family

### Requirement 6: Navigation Component Registration

**User Story:** As a component developer, I want navigation-related UI components registered with the primitive system, so that navigation primitives render correctly.

#### Acceptance Criteria

1. WHEN navigation components are registered THEN the Registration Module SHALL map "NavigationMenu" primitive type to the NavigationMenu component family
2. WHEN navigation components are registered THEN the Registration Module SHALL map "Breadcrumb" primitive type to the Breadcrumb component family
3. WHEN navigation components are registered THEN the Registration Module SHALL map "Pagination" primitive type to the Pagination component family
4. WHEN navigation components are registered THEN the Registration Module SHALL map "Menubar" primitive type to the Menubar component family
5. WHEN navigation components are registered THEN the Registration Module SHALL map "ContextMenu" primitive type to the ContextMenu component family

### Requirement 7: Form Component Registration

**User Story:** As a component developer, I want form-related UI components registered with the primitive system, so that form primitives render correctly.

#### Acceptance Criteria

1. WHEN form components are registered THEN the Registration Module SHALL map "Label" primitive type to the Label component
2. WHEN form components are registered THEN the Registration Module SHALL map "Textarea" primitive type to the Textarea component
3. WHEN form components are registered THEN the Registration Module SHALL map "Form" primitive type to appropriate form wrapper components

### Requirement 8: Data Display Component Registration

**User Story:** As a component developer, I want data display UI components registered with the primitive system, so that data display primitives render correctly.

#### Acceptance Criteria

1. WHEN data display components are registered THEN the Registration Module SHALL map "Table" primitive type to the Table component family
2. WHEN data display components are registered THEN the Registration Module SHALL map "List" primitive type to a list rendering component
3. WHEN data display components are registered THEN the Registration Module SHALL map "ScrollArea" primitive type to the ScrollArea component

### Requirement 9: Auto-Registration on Import

**User Story:** As a Symphony developer, I want UI components to be automatically registered when the primitives package is used with UI, so that setup is seamless.

#### Acceptance Criteria

1. WHEN the registration module provides an auto-register option THEN the Registration Module SHALL export a function that can be called at application startup
2. WHEN auto-registration is enabled THEN the Registration Module SHALL register all components before any primitive rendering occurs
3. WHEN registration status is queried THEN the Registration Module SHALL provide a function to check if all components are registered

