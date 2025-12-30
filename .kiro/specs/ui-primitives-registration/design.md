# Design Document: UI Primitives Registration

## Overview

This design document describes the integration layer between Symphony's Primitives Package (`packages/primitives`) and the UI component library (`packages/ui`). The registration module maps primitive type strings to actual React components, enabling the primitive system to render UI elements.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   PRIMITIVE SYSTEM                          │
│              (packages/primitives)                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              PrimitiveRenderer                       │   │
│  │         componentMap: Map<string, Component>         │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       │                                     │
│                       │ registerComponent(type, component)  │
│                       │                                     │
└───────────────────────┼─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│              UI REGISTRATION MODULE                         │
│         (packages/primitives/src/registration)              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           registerAllUIComponents()                  │   │
│  │                                                      │   │
│  │  - Layout Components (Container, Flex, Grid, etc.)  │   │
│  │  - Interactive Components (Button, Input, etc.)     │   │
│  │  - Complex Components (Dialog, Tabs, etc.)          │   │
│  │  - Display Components (Badge, Avatar, etc.)         │   │
│  │  - Navigation Components (Breadcrumb, etc.)         │   │
│  │  - Form Components (Label, Textarea, etc.)          │   │
│  │  - Data Display Components (Table, List, etc.)      │   │
│  └─────────────────────────────────────────────────────┘   │
│                       │                                     │
└───────────────────────┼─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    UI LIBRARY                               │
│                  (packages/ui)                              │
│                                                             │
│  Button, Input, Dialog, Tabs, Card, Badge, Table, etc.     │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Registration Module

```javascript
/**
 * @typedef {Object} RegistrationOptions
 * @property {boolean} [override=false] - Whether to override existing registrations
 * @property {boolean} [silent=false] - Whether to suppress warning logs
 */

/**
 * @typedef {Object} RegistrationResult
 * @property {string[]} registered - Types that were successfully registered
 * @property {string[]} skipped - Types that were skipped (already registered)
 * @property {string[]} failed - Types that failed to register
 */

/**
 * Registers all UI components with the primitive system
 * @param {RegistrationOptions} [options] - Registration options
 * @returns {RegistrationResult} Result of the registration
 */
function registerAllUIComponents(options) { }

/**
 * Checks if all expected UI components are registered
 * @returns {boolean} True if all components are registered
 */
function isFullyRegistered() { }

/**
 * Gets the list of registered UI component types
 * @returns {string[]} Array of registered type names
 */
function getRegisteredUITypes() { }

/**
 * Gets the list of expected UI component types
 * @returns {string[]} Array of expected type names
 */
function getExpectedUITypes() { }
```

### Component Wrapper Functions

For components that need prop transformation or composition:

```javascript
/**
 * Creates a Container component wrapper for flex layout
 * @param {Object} props - Container props
 * @returns {React.ReactElement}
 */
function ContainerWrapper({ direction, gap, className, children, ...props }) { }

/**
 * Creates a Text component wrapper for typography
 * @param {Object} props - Text props
 * @returns {React.ReactElement}
 */
function TextWrapper({ content, variant, size, weight, className, ...props }) { }
```

## Data Models

### Component Registration Map

```javascript
/**
 * Mapping of primitive types to UI components
 * @type {Array<[string, React.ComponentType]>}
 */
const UI_COMPONENT_MAP = [
  // Layout
  ['Container', ContainerWrapper],
  ['Flex', FlexWrapper],
  ['Grid', GridWrapper],
  ['Panel', Card],
  ['Divider', Separator],
  ['ResizablePanel', ResizablePanel],
  
  // Interactive
  ['Button', Button],
  ['Input', Input],
  ['Checkbox', Checkbox],
  ['Select', SelectWrapper],
  ['Switch', Switch],
  ['Slider', Slider],
  ['Toggle', Toggle],
  ['RadioGroup', RadioGroup],
  
  // Complex
  ['Dialog', Dialog],
  ['Modal', Dialog],
  ['Dropdown', DropdownMenu],
  ['Tabs', Tabs],
  ['Tooltip', TooltipWrapper],
  ['Popover', Popover],
  ['Sheet', Sheet],
  ['Accordion', Accordion],
  
  // Display
  ['Text', TextWrapper],
  ['Badge', Badge],
  ['Avatar', Avatar],
  ['Progress', Progress],
  ['Skeleton', Skeleton],
  ['Alert', Alert],
  ['Card', Card],
  
  // Navigation
  ['NavigationMenu', NavigationMenu],
  ['Breadcrumb', Breadcrumb],
  ['Pagination', Pagination],
  ['Menubar', Menubar],
  ['ContextMenu', ContextMenu],
  
  // Form
  ['Label', Label],
  ['Textarea', Textarea],
  
  // Data Display
  ['Table', Table],
  ['ScrollArea', ScrollArea],
];
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Registration Completeness
*For any* expected primitive type in the UI_COMPONENT_MAP, after calling `registerAllUIComponents()`, the type SHALL be retrievable via `getRegisteredComponent(type)` and return a valid React component.
**Validates: Requirements 1.2, 2.1-2.6, 3.1-3.8, 4.1-4.8, 5.1-5.7, 6.1-6.5, 7.1-7.3, 8.1-8.3**

### Property 2: Registration Key Validity
*For any* component registered via the registration module, the registration key SHALL be a non-empty string matching the expected primitive type name.
**Validates: Requirements 1.3**

### Property 3: Conflict Handling
*For any* primitive type that is already registered, when `registerAllUIComponents()` is called with `override=false`, the existing registration SHALL be preserved and the type SHALL appear in the `skipped` result array.
**Validates: Requirements 1.5**

### Property 4: Override Behavior
*For any* primitive type that is already registered, when `registerAllUIComponents()` is called with `override=true`, the new component SHALL replace the existing registration.
**Validates: Requirements 1.5**

### Property 5: Registration Status Accuracy
*For any* state of the registration system, `isFullyRegistered()` SHALL return true if and only if all types in `getExpectedUITypes()` are present in `getRegisteredTypes()`.
**Validates: Requirements 1.4, 9.3**

## Error Handling

### Error Types

```javascript
class RegistrationError extends Error {
  constructor(message, type) {
    super(message);
    this.name = 'RegistrationError';
    this.type = type;
  }
}
```

### Error Scenarios

1. **Invalid Component**: If a component in the map is undefined or not a valid React component, log a warning and add to `failed` array
2. **Registration Conflict**: If `override=false` and type exists, log warning (unless `silent=true`) and add to `skipped` array
3. **Import Failure**: If UI package import fails, throw RegistrationError with details

## Testing Strategy

### Dual Testing Approach

1. **Unit Tests** - Verify specific registration scenarios
2. **Property-Based Tests** - Verify universal properties across all component types

### Property-Based Testing Framework

**Library**: fast-check (JavaScript property-based testing library)

**Configuration**: Minimum 100 iterations per property test

**Test File Naming**: `*.property.test.js`

### Test Categories

1. **Registration Tests**
   - All expected types registered after `registerAllUIComponents()`
   - Registration keys match expected patterns
   - Conflict handling works correctly

2. **Component Wrapper Tests**
   - ContainerWrapper renders with correct flex properties
   - TextWrapper renders with correct typography
   - SelectWrapper composes Select components correctly

3. **Integration Tests**
   - Primitives render correctly with registered components
   - Handler props work through the primitive system

### Property Test Annotation Format

Each property-based test MUST include a comment in this format:
```javascript
/**
 * **Feature: ui-primitives-registration, Property 1: Registration Completeness**
 * For any expected primitive type, after registration, the type should map to a valid React component
 */
```

