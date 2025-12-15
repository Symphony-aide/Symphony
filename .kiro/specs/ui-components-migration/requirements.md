# Requirements Document

## Introduction

This document specifies the requirements for migrating all plain HTML elements in the Symphony primitives package to use the established UI component library (`packages/ui`). The goal is to ensure consistent styling, accessibility, and maintainability across the codebase by prohibiting direct use of plain HTML elements like `<div>`, `<button>`, `<p>`, `<h3>`, etc., and instead requiring the use of Symphony's UI components.

## Glossary

- **UI Component**: A reusable React component from the `packages/ui` library that provides consistent styling, accessibility, and behavior
- **Plain HTML Element**: Native HTML elements used directly in JSX (e.g., `<div>`, `<button>`, `<span>`, `<p>`)
- **Primitives Package**: The `packages/primitives` package containing Symphony's primitive rendering system
- **Design System**: The collection of UI components in `packages/ui` that define Symphony's visual language
- **Wrapper Component**: A component that composes UI components to provide simplified APIs for common patterns

## Requirements

### Requirement 1

**User Story:** As a developer, I want all error fallback components to use UI components, so that error states have consistent styling and accessibility across the application.

#### Acceptance Criteria

1. WHEN the ErrorBoundary displays a fallback UI THEN the system SHALL use Card, CardHeader, CardTitle, CardDescription, and CardContent components for the error container
2. WHEN the ErrorBoundary displays error details THEN the system SHALL use Collapsible, CollapsibleTrigger, and CollapsibleContent components for expandable sections
3. WHEN the ErrorBoundary displays a retry button THEN the system SHALL use the Button component with appropriate variant
4. WHEN the WasmRenderer displays an error fallback THEN the system SHALL use Alert, AlertTitle, and AlertDescription components for error messaging
5. WHEN the WasmRenderer displays a retry button THEN the system SHALL use the Button component with appropriate variant

### Requirement 2

**User Story:** As a developer, I want all loading indicators to use UI components, so that loading states are visually consistent throughout the application.


### Requirement 3

**User Story:** As a developer, I want layout wrapper components to use UI components where applicable, so that layout primitives integrate with the design system.



### Requirement 4

**User Story:** As a developer, I want form-related wrapper components to use UI components, so that forms have consistent styling and accessibility.

#### Acceptance Criteria

1. WHEN the FormWrapper renders a form THEN the system SHALL integrate with UI form components for consistent styling
2. WHEN form validation errors are displayed THEN the system SHALL use Alert or inline error components from the UI library

### Requirement 5

**User Story:** As a developer, I want text and typography to use UI components, so that text styling is consistent across the application.

#### Acceptance Criteria

1. WHEN the TextWrapper renders text content THEN the system SHALL use typography-aware components that integrate with the design system
2. WHEN headings are rendered THEN the system SHALL use consistent heading styles from the UI library
3. WHEN code snippets are displayed THEN the system SHALL use a Code or monospace text component

### Requirement 6

**User Story:** As a developer, I want new UI primitive components created where gaps exist, so that all common patterns have UI component coverage.

#### Acceptance Criteria

1. WHEN a Box layout component is needed THEN the system SHALL provide a Box component in the UI library for basic container layouts
2. WHEN a Flex layout component is needed THEN the system SHALL provide a Flex component in the UI library for flexbox layouts
3. WHEN a Grid layout component is needed THEN the system SHALL provide a Grid component in the UI library for CSS grid layouts
4. WHEN a Text/Typography component is needed THEN the system SHALL provide Text and Heading components in the UI library
5. WHEN a Spinner/Loading component is needed THEN the system SHALL provide a Spinner component in the UI library for loading states
6. WHEN a Code display component is needed THEN the system SHALL provide a Code component in the UI library for inline code

### Requirement 7

**User Story:** As a developer, I want the DirectRenderer components to document any necessary exceptions, so that performance-critical components can use plain elements when justified.



### Requirement 8

**User Story:** As a developer, I want a pretty-printer for UI component trees, so that component structures can be serialized and validated.

#### Acceptance Criteria

1. WHEN a UI component tree is serialized THEN the system SHALL produce a consistent string representation
2. WHEN a serialized component tree is parsed THEN the system SHALL reconstruct the equivalent component structure
3. WHEN round-tripping a component tree through serialize/parse THEN the system SHALL preserve all component types and props

