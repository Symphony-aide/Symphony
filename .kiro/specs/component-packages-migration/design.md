# Design Document: Component Packages Migration

## Overview

This design document outlines the migration of Symphony's IDE component packages to use UI components exclusively from `packages/ui`. The migration eliminates all pure HTML elements (div, span, aside, etc.) and replaces them with UI package components (Box, Flex, Text, Button, etc.), ensuring consistent styling, theming, and maintainability across the IDE.

The approach is straightforward: component packages directly import and use UI components. No builder functions or primitive tree construction is needed in the component packages - they simply consume the UI components as regular React components.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      Component Packages Layer                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │ ActivityBar │ │  StatusBar  │ │FileExplorer │ │   TabBar    │       │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘       │
│         │               │               │               │               │
│  ┌──────┴───────────────┴───────────────┴───────────────┴──────┐       │
│  │                    Import UI Components                      │       │
│  └──────────────────────────────┬───────────────────────────────┘       │
└─────────────────────────────────┼───────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────────────────┐
│                         UI Package (packages/ui)                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        Layout Components                         │   │
│  │  Box, Flex, Grid, Card, ScrollArea, Separator, ResizablePanel   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      Typography Components                       │   │
│  │  Text, Heading, Code, Label                                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Interactive Components                       │   │
│  │  Button, Input, Select, Checkbox, Switch, Toggle, Slider        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                       Complex Components                         │   │
│  │  Tabs, Dialog, Sheet, DropdownMenu, ContextMenu, Command        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      Feedback Components                         │   │
│  │  Spinner, Alert, Badge, Skeleton, Progress, Toast               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### UI Component Mapping

The following table shows how pure HTML elements map to UI components:

| Pure HTML Element | UI Component Replacement |
|-------------------|-------------------------|
| `<div>` | `<Box>` or `<Flex>` or `<Grid>` |
| `<span>` | `<Text>` or `<Box as="span">` |
| `<aside>` | `<Box as="aside">` or `<Flex>` |
| `<section>` | `<Box as="section">` or `<Card>` |
| `<header>` | `<Box as="header">` or `<Flex>` |
| `<footer>` | `<Box as="footer">` or `<Flex>` |
| `<nav>` | `<Box as="nav">` or `<NavigationMenu>` |
| `<ul>`, `<li>` | `<Flex direction="column">` with children |
| `<p>` | `<Text>` |
| `<h1>`-`<h6>` | `<Heading level={1-6}>` |
| `<button>` | `<Button>` |
| `<input>` | `<Input>` |
| `<select>` | `<Select>` |
| `<textarea>` | `<Textarea>` |

### Component Migration Patterns

#### ActivityBar Component

```tsx
// Before (with pure HTML)
<aside className="w-14 bg-bg-secondary...">
  <div className="flex-1 flex flex-col gap-1">
    {activities.map(a => <ActivityButton key={a.id} {...a} />)}
  </div>
</aside>

// After (with UI components)
<Flex direction="column" className="w-14 bg-bg-secondary border-r">
  <Flex direction="column" gap={1} className="flex-1">
    {activities.map(a => (
      <Tooltip key={a.id}>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon">
            <a.icon className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">{a.label}</TooltipContent>
      </Tooltip>
    ))}
  </Flex>
  <Separator />
  <UserSection />
</Flex>
```

#### StatusBar Component

```tsx
// Before (with pure HTML)
<div className="bg-symphony-primary text-white px-4 py-1 flex...">
  <div className="flex items-center space-x-4">
    <span className="flex items-center space-x-1">...</span>
  </div>
</div>

// After (with UI components)
<Flex justify="between" align="center" className="bg-symphony-primary text-white px-4 py-1">
  <Flex gap={4} align="center">
    <Flex gap={1} align="center">
      <GitBranch className="w-3 h-3" />
      <Text size="sm">{gitBranch}</Text>
    </Flex>
    <Text size="sm" className="text-symphony-light/80">
      {activeFileName} • {lineCount} lines
    </Text>
  </Flex>
  <Flex gap={4} align="center">
    <Button variant="ghost" size="sm" onClick={onToggleTerminal}>
      <Terminal className="w-3 h-3 mr-1" />
      <Text size="sm">{terminalVisible ? "Hide" : "Show"} Terminal</Text>
    </Button>
    <Badge variant={isOnline ? "success" : "destructive"}>
      {isOnline ? "Online" : "Offline"}
    </Badge>
  </Flex>
</Flex>
```

#### FileExplorer Component

```tsx
// After (with UI components)
<Flex direction="column" className="bg-gray-800 text-white w-64 p-3 border-r">
  <Flex justify="between" align="center" className="mb-4">
    <Heading level={6} className="tracking-widest text-gray-300">EXPLORER</Heading>
    <Button variant="ghost" size="sm" onClick={() => onOpenSettings("shortcuts")}>
      ⚙️
    </Button>
  </Flex>
  
  <Tabs value={activeTab} onValueChange={setActiveTab}>
    <TabsList className="w-full">
      <TabsTrigger value="files" className="flex-1">Files</TabsTrigger>
      <TabsTrigger value="search" className="flex-1">Search</TabsTrigger>
    </TabsList>
    
    <ScrollArea className="flex-grow">
      <TabsContent value="files">
        <FilterControls {...filterProps} />
        <FileTreeNode {...treeProps} />
        <ActionButtons {...actionProps} />
      </TabsContent>
      <TabsContent value="search">
        <SearchTab {...searchProps} />
      </TabsContent>
    </ScrollArea>
  </Tabs>
</Flex>
```

## Data Models

### Component Props Interfaces

Each migrated component maintains its existing props interface. The migration only changes the internal implementation, not the public API.

```typescript
// ActivityBar props (unchanged)
interface ActivityBarProps {
  activeSidebar?: string;
  onSidebarChange?: (id: string) => void;
  userName?: string;
  isOnline?: boolean;
  onSettingsClick?: () => void;
  onUserClick?: () => void;
}

// StatusBar props (unchanged)
interface StatusBarProps {
  activeFileName?: string;
  saved?: boolean;
  terminalVisible?: boolean;
  onToggleTerminal?: () => void;
  lineCount?: number;
  cursorPosition?: { line: number; column: number };
  language?: string;
  gitBranch?: string;
  isOnline?: boolean;
}

// FileExplorer props (unchanged)
interface FileExplorerProps {
  files: FileItem[];
  activeFileName?: string;
  onSelectFile?: (name: string) => void;
  onNewFile?: () => void;
  onDeleteFile?: (name: string) => void;
  // ... other existing props
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: No Pure HTML Elements
*For any* migrated component, when rendered, the output should contain zero pure HTML elements (div, span, aside, section, header, footer, ul, li, p, h1-h6) that are not wrapped by UI components.
**Validates: Requirements 1.1**

### Property 2: Layout Components Usage
*For any* layout container in a migrated component, the container should be rendered using Box, Flex, or Grid components from the UI package.
**Validates: Requirements 1.2**

### Property 3: Typography Components Usage
*For any* text content in a migrated component, the text should be rendered using Text, Heading, or Code components from the UI package.
**Validates: Requirements 1.3**

### Property 4: Interactive Components Usage
*For any* interactive element in a migrated component, the element should be rendered using Button, Input, Select, or other interactive components from the UI package.
**Validates: Requirements 1.4**

### Property 5: Component Functionality Preservation
*For any* migrated component, all existing functionality (event handlers, state management, props) should work identically to the pre-migration version.
**Validates: Requirements 2.1-10.5**

## Error Handling

### Migration Errors

1. **Missing UI Component**: If a required UI component doesn't exist, create it in packages/ui before proceeding with migration.

2. **Styling Inconsistencies**: If migrated component looks different, adjust Tailwind classes or component props to match original appearance.

3. **Event Handler Issues**: If events don't fire correctly, verify that UI components properly forward event handlers (onClick, onChange, etc.).

4. **Accessibility Regressions**: If accessibility is broken, ensure UI components include proper ARIA attributes.

## Testing Strategy

### Property-Based Testing Library

The system will use **fast-check** for property-based testing in TypeScript/JavaScript.

### Unit Tests

Unit tests will cover:
- Each migrated component renders without errors
- Event handlers are called correctly
- Props are passed through to UI components
- Conditional rendering works correctly

### Property-Based Tests

Property tests will verify:
- No pure HTML elements in rendered output
- All layout containers use UI layout components
- All text uses UI typography components
- All interactive elements use UI interactive components

```typescript
// Example: Property 1 - No Pure HTML Elements
// **Feature: component-packages-migration, Property 1: No Pure HTML Elements**
describe('Property 1: No Pure HTML Elements', () => {
  it('ActivityBar should not render pure HTML elements', () => {
    const { container } = render(<ActivityBar />);
    
    const pureHtmlElements = container.querySelectorAll(
      'div:not([class*="ui-"]), span:not([class*="ui-"]), aside, section, header, footer'
    );
    
    // All elements should be UI components (which add specific classes)
    expect(pureHtmlElements.length).toBe(0);
  });
});
```

### Integration Tests

Integration tests will verify:
- Components work together correctly
- Theme changes propagate to all components
- Responsive behavior works correctly

### Test Configuration

- Property tests: minimum 100 iterations per property
- Each property test tagged with: `**Feature: component-packages-migration, Property {number}: {property_text}**`

