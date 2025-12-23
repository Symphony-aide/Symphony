# TabBar Migration Guide

This document describes the migration of the TabBar component to use Symphony's UI primitives.

## Overview

The TabBar component has been migrated from raw HTML `<div>` elements to Symphony's UI primitive components (`Flex`, `Box`, `Text`, `Button`) for consistent styling and better maintainability.

## Changes Made

### TabBar.jsx

**Before:**
```jsx
import { Button } from 'ui';

<div className="bg-bg-secondary/30 border-b border-border-subtle flex items-center justify-between h-10">
  <div className="flex items-center h-full overflow-x-auto scrollbar-thin">
    {tabs.map((tab) => <Tab ... />)}
  </div>
  {/* More options */}
</div>
```

**After:**
```jsx
import { Button, Flex, Box } from 'ui';

<Flex align="center" justify="between" className="bg-bg-secondary/30 border-b border-border-subtle h-10">
  <Flex align="center" className="h-full overflow-x-auto scrollbar-thin">
    {tabs.map((tab) => <Tab ... />)}
  </Flex>
  {/* More options */}
</Flex>
```

### Tab.jsx (Sub-component)

**Before:**
```jsx
import { Button } from 'ui';

<Button variant="ghost" ...>
  <div className="absolute bottom-0 ..." /> {/* Accent line */}
  <span className="truncate">{label}</span>
  <div className="w-2 h-2 rounded-full ..." /> {/* Dirty indicator */}
</Button>
```

**After:**
```jsx
import { Button, Flex, Box, Text, Badge } from 'ui';

<Button variant="ghost" ...>
  <Box className="absolute bottom-0 ..." /> {/* Accent line */}
  <Text className="truncate">{label}</Text>
  <Box className="w-2 h-2 rounded-full ..." /> {/* Dirty indicator */}
</Button>
```

## Benefits

1. **Consistent Styling**: Uses Symphony's design system primitives
2. **Better Semantics**: `Flex` and `Box` provide clear layout intent
3. **Typography Consistency**: `Text` component ensures consistent text styling
4. **Maintainability**: Easier to update styling across all components
5. **Accessibility**: UI primitives include proper ARIA attributes

## Component Mapping

| Old Element | New Component | Purpose |
|-------------|---------------|---------|
| `<div>` with flex | `<Flex>` | Flexbox layout containers |
| `<div>` generic | `<Box>` | Generic layout/decorative elements |
| `<span>` text | `<Text>` | Text content with typography |
| `<button>` | `<Button>` | Interactive button elements |

## Testing

The migration includes property-based tests to verify UI component usage:

```jsx
// packages/components/tab-bar/__tests__/TabBar.property.test.jsx
describe('TabBar UI Component Usage', () => {
  it('should use Flex for main container layout', () => {
    // Verifies Flex component is used for layout
  });
  
  it('should use Box for decorative elements', () => {
    // Verifies Box component is used for accent lines, indicators
  });
});
```

## Backward Compatibility

This migration is backward compatible - no API changes were made to the component props. Existing usage will continue to work without modification.
