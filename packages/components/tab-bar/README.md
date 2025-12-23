# Tab Bar Component

Elegant tab management with fluid "blob" design for active tabs in Symphony IDE.

## Features

- Active tab with glassmorphic "blob" style
- Inactive tabs with hover effects
- Close buttons on hover
- Dirty/unsaved indicators
- Scrollable tab list for many tabs
- Context menu (Close Others, Close All)
- Icons with labels
- Symphony primary color theming
- **Built with Symphony UI primitives** (`Flex`, `Box`, `Text`, `Button`)

## Architecture

The TabBar component uses Symphony's UI primitive components for consistent styling and layout:

- `Flex` - Used for the main container layout and tab list alignment
- `Box` - Used for decorative elements (accent lines, dirty indicators)
- `Text` - Used for tab labels with proper typography
- `Button` - Used for tabs and close buttons with consistent interaction states

## Usage

```jsx
import { TabBar } from '@symphony/tab-bar';
import { FileText, Code, HelpCircle } from 'lucide-react';

function Editor() {
  const [tabs, setTabs] = useState([
    { id: 'welcome', label: 'Welcome', icon: FileText, isDirty: false },
    { id: 'main', label: 'main.js', icon: Code, isDirty: true },
    { id: 'docs', label: 'Documentation', icon: HelpCircle, isDirty: false }
  ]);
  const [activeTab, setActiveTab] = useState('welcome');

  return (
    <TabBar
      tabs={tabs}
      activeTabId={activeTab}
      onTabChange={setActiveTab}
      onTabClose={(id) => setTabs(tabs.filter(t => t.id !== id))}
      onCloseAll={() => setTabs([])}
      onCloseOthers={(activeId) => setTabs(tabs.filter(t => t.id === activeId))}
    />
  );
}
```

## Props

### TabBar

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tabs` | `Tab[]` | `[]` | Array of tab objects |
| `activeTabId` | `string` | - | Currently active tab ID |
| `onTabChange` | `function` | - | Callback when tab is clicked |
| `onTabClose` | `function` | - | Callback when tab is closed |
| `onCloseAll` | `function` | - | Callback to close all tabs |
| `onCloseOthers` | `function` | - | Callback to close other tabs |
| `className` | `string` | `''` | Additional CSS classes |

### Tab Object

```typescript
{
  id: string;           // Unique identifier
  label: string;        // Tab display text
  icon?: LucideIcon;    // Optional icon
  isDirty?: boolean;    // Show unsaved indicator
}
```

## Styling

The active tab features:
- Glassmorphic background with backdrop blur
- Symphony primary color border
- Gradient bottom accent line
- Smooth scale-up on hover
- Higher z-index for layering effect

## UI Component Usage

This component has been migrated to use Symphony's UI primitives for consistent styling:

```jsx
// Main TabBar layout uses Flex for alignment
<Flex align="center" justify="between" className="...">
  {/* Tab list container */}
  <Flex align="center" className="h-full overflow-x-auto">
    {tabs.map((tab) => <Tab key={tab.id} {...tab} />)}
  </Flex>
  
  {/* More options dropdown */}
  <DropdownMenu>...</DropdownMenu>
</Flex>

// Tab component uses Box for decorative elements
<Button variant="ghost" ...>
  <Box className="..." /> {/* Accent line */}
  <Text>{label}</Text>
  <Box className="..." /> {/* Dirty indicator */}
</Button>
```

## Dependencies

- `ui` (workspace) - Symphony UI primitives (`Flex`, `Box`, `Text`, `Button`, `DropdownMenu`)
- `lucide-react` - Icons
- `@symphony/shared` - Shared utilities
