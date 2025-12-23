# Requirements Document

## Introduction

This document defines requirements for migrating Symphony's IDE component packages (activity-bar, code-editor, file-explorer, statusbar, etc.) to use UI components exclusively from `packages/ui`. The migration ensures all components use the design system components with zero pure HTML elements, providing consistent styling and theming across the IDE. The primitives system and extensibility logic remain internal to the UI package - component packages simply consume UI components directly.

## Glossary

- **Component_Package**: A package in `packages/components/` containing a specific IDE component (e.g., activity-bar, file-explorer)
- **UI_Package**: The `packages/ui` package containing reusable UI components (Button, Card, Tabs, Box, Flex, Text, etc.)
- **Pure_HTML_Element**: Native HTML elements like div, span, aside, section, header, footer, ul, li, p, h1-h6
- **UI_Component**: A React component exported from the UI_Package that wraps styling and behavior

## Requirements

### Requirement 1

**User Story:** As a developer, I want each component package to use ONLY UI components from packages/ui with zero pure HTML elements, so that the IDE has consistent styling and theming.

#### Acceptance Criteria

1. WHEN rendering any element THEN the Component_Package SHALL NOT use any Pure_HTML_Elements (div, span, aside, section, header, footer, ul, li, p, h1-h6, etc.)
2. WHEN rendering layout containers THEN the Component_Package SHALL use Box, Flex, Grid components from the UI_Package
3. WHEN rendering text content THEN the Component_Package SHALL use Text, Heading, Code components from the UI_Package
4. WHEN rendering interactive elements THEN the Component_Package SHALL use Button, Input, Select, Checkbox, Switch, Toggle components from the UI_Package
5. WHEN rendering complex structures THEN the Component_Package SHALL use Card, Tabs, ScrollArea, Separator, Accordion, Collapsible components from the UI_Package
6. WHEN rendering feedback states THEN the Component_Package SHALL use Spinner, Alert, Badge, Skeleton, Progress components from the UI_Package
7. WHEN rendering icons THEN the Component_Package SHALL use icons from lucide-react with appropriate UI wrapper components
8. IF a required UI component does not exist in the UI_Package THEN the developer SHALL create the component in the UI_Package before using it in the Component_Package

### Requirement 2

**User Story:** As a developer, I want the ActivityBar component to use UI components exclusively, so that it has consistent styling with the rest of the IDE.

#### Acceptance Criteria

1. WHEN rendering the ActivityBar container THEN the ActivityBar SHALL use Flex component with vertical direction from the UI_Package
2. WHEN rendering activity buttons THEN the ActivityBar SHALL use Button component with icon variant from the UI_Package
3. WHEN rendering the user section THEN the ActivityBar SHALL use Avatar, Button, and Tooltip components from the UI_Package
4. WHEN rendering dividers between sections THEN the ActivityBar SHALL use Separator component from the UI_Package
5. WHEN displaying tooltips on hover THEN the ActivityBar SHALL use Tooltip component from the UI_Package

### Requirement 3

**User Story:** As a developer, I want the StatusBar component to use UI components exclusively, so that status information is displayed consistently.

#### Acceptance Criteria

1. WHEN rendering the StatusBar container THEN the StatusBar SHALL use Flex component with horizontal layout from the UI_Package
2. WHEN rendering status items THEN the StatusBar SHALL use Text component with appropriate size variant from the UI_Package
3. WHEN rendering the terminal toggle THEN the StatusBar SHALL use Button component with ghost variant from the UI_Package
4. WHEN rendering status indicators THEN the StatusBar SHALL use Badge component from the UI_Package
5. WHEN rendering separators between items THEN the StatusBar SHALL use Separator component from the UI_Package

### Requirement 4

**User Story:** As a developer, I want the FileExplorer component to use UI components exclusively, so that file navigation has consistent styling.

#### Acceptance Criteria

1. WHEN rendering the FileExplorer container THEN the FileExplorer SHALL use Flex component with vertical layout from the UI_Package
2. WHEN rendering the header THEN the FileExplorer SHALL use Flex, Text, and Button components from the UI_Package
3. WHEN rendering tabs THEN the FileExplorer SHALL use Tabs, TabsList, TabsTrigger, TabsContent components from the UI_Package
4. WHEN rendering the file tree THEN the FileExplorer SHALL use ScrollArea and nested Flex components from the UI_Package
5. WHEN rendering file items THEN the FileExplorer SHALL use Button or Flex with Text and icon components from the UI_Package
6. WHEN rendering context menus THEN the FileExplorer SHALL use ContextMenu components from the UI_Package
7. WHEN rendering action buttons THEN the FileExplorer SHALL use Button components from the UI_Package

### Requirement 5

**User Story:** As a developer, I want the TabBar component to use UI components exclusively, so that editor tabs have consistent styling.

#### Acceptance Criteria

1. WHEN rendering the TabBar container THEN the TabBar SHALL use Flex component with horizontal layout from the UI_Package
2. WHEN rendering individual tabs THEN the TabBar SHALL use Button or custom Tab component from the UI_Package
3. WHEN rendering close buttons THEN the TabBar SHALL use Button component with icon-only variant from the UI_Package
4. WHEN rendering modified indicators THEN the TabBar SHALL use Badge or styled Box component from the UI_Package
5. WHEN rendering tab overflow menu THEN the TabBar SHALL use DropdownMenu components from the UI_Package

### Requirement 6

**User Story:** As a developer, I want the Header component to use UI components exclusively, so that the application header has consistent styling.

#### Acceptance Criteria

1. WHEN rendering the Header container THEN the Header SHALL use Flex component with horizontal layout from the UI_Package
2. WHEN rendering the logo THEN the Header SHALL use Box or appropriate container from the UI_Package
3. WHEN rendering the title THEN the Header SHALL use Heading or Text component from the UI_Package
4. WHEN rendering menu buttons THEN the Header SHALL use Button components from the UI_Package
5. WHEN rendering dropdown menus THEN the Header SHALL use DropdownMenu components from the UI_Package

### Requirement 7

**User Story:** As a developer, I want the Settings component to use UI components exclusively, so that configuration UI has consistent styling.

#### Acceptance Criteria

1. WHEN rendering the Settings container THEN the Settings SHALL use Dialog or Sheet component from the UI_Package
2. WHEN rendering settings categories THEN the Settings SHALL use Tabs components from the UI_Package
3. WHEN rendering form fields THEN the Settings SHALL use Input, Select, Switch, Checkbox components from the UI_Package
4. WHEN rendering labels THEN the Settings SHALL use Label and Text components from the UI_Package
5. WHEN rendering action buttons THEN the Settings SHALL use Button components from the UI_Package

### Requirement 8

**User Story:** As a developer, I want the CommandPalette component to use UI components exclusively, so that command search has consistent styling.

#### Acceptance Criteria

1. WHEN rendering the CommandPalette THEN the CommandPalette SHALL use Command component (cmdk) from the UI_Package
2. WHEN rendering the search input THEN the CommandPalette SHALL use CommandInput from the UI_Package
3. WHEN rendering command groups THEN the CommandPalette SHALL use CommandGroup from the UI_Package
4. WHEN rendering command items THEN the CommandPalette SHALL use CommandItem from the UI_Package
5. WHEN rendering keyboard shortcuts THEN the CommandPalette SHALL use Kbd or Badge component from the UI_Package

### Requirement 9

**User Story:** As a developer, I want the NotificationCenter component to use UI components exclusively, so that notifications have consistent styling.

#### Acceptance Criteria

1. WHEN rendering notifications THEN the NotificationCenter SHALL use Toast components from the UI_Package
2. WHEN rendering notification content THEN the NotificationCenter SHALL use Text, Heading components from the UI_Package
3. WHEN rendering action buttons THEN the NotificationCenter SHALL use Button components from the UI_Package
4. WHEN rendering dismiss buttons THEN the NotificationCenter SHALL use Button with icon variant from the UI_Package
5. WHEN rendering notification icons THEN the NotificationCenter SHALL use appropriate icon with Alert styling from the UI_Package

### Requirement 10

**User Story:** As a developer, I want the WelcomeScreen component to use UI components exclusively, so that the welcome page has consistent styling.

#### Acceptance Criteria

1. WHEN rendering the WelcomeScreen container THEN the WelcomeScreen SHALL use Flex or Grid component from the UI_Package
2. WHEN rendering the welcome message THEN the WelcomeScreen SHALL use Heading and Text components from the UI_Package
3. WHEN rendering quick action cards THEN the WelcomeScreen SHALL use Card components from the UI_Package
4. WHEN rendering recent projects list THEN the WelcomeScreen SHALL use ScrollArea and Flex components from the UI_Package
5. WHEN rendering action buttons THEN the WelcomeScreen SHALL use Button components from the UI_Package

### Requirement 11

**User Story:** As a developer, I want missing UI components to be created in the UI package before migration, so that all component packages have the components they need.

#### Acceptance Criteria

1. WHEN a component package needs a layout component not in UI_Package THEN the developer SHALL create it in packages/ui/components/
2. WHEN a component package needs a specialized component THEN the developer SHALL evaluate if it belongs in UI_Package or as a local component
3. WHEN creating new UI components THEN the developer SHALL follow the existing UI_Package patterns and styling
4. WHEN creating new UI components THEN the developer SHALL export them from packages/ui/index.ts
5. WHEN creating new UI components THEN the developer SHALL add appropriate TypeScript types

### Requirement 12

**User Story:** As a developer, I want comprehensive tests for each migrated component, so that I can ensure the migration doesn't break functionality.

#### Acceptance Criteria

1. WHEN a component is migrated THEN the Component_Package SHALL include tests verifying UI component usage
2. WHEN testing the component THEN the tests SHALL verify no Pure_HTML_Elements are rendered
3. WHEN testing interactions THEN the tests SHALL verify event handlers work correctly
4. WHEN testing styling THEN the tests SHALL verify components receive correct props
5. WHEN testing accessibility THEN the tests SHALL verify ARIA attributes are present

