# Welcome Screen Component

Elegant empty state with animated logo, quick actions, and footer links.

## Features

- Animated floating logo with glow effect
- Customizable quick action cards
- Four default actions (Open Folder, New File, Clone Repo, AI Orchestra)
- Footer links (Recent, Getting Started, Documentation)
- Symphony branding and color scheme
- Responsive grid layout
- Built with Symphony UI components (Flex, Box, Grid, Heading, Text)

## UI Component Architecture

This component uses Symphony's design system components from `@symphony/ui`:

| Element | UI Component | Purpose |
|---------|--------------|---------|
| Main container | `Flex` | Centers content with `align="center"` and `justify="center"` |
| Content wrapper | `Box` | Contains all welcome screen content |
| Welcome message section | `Box` | Groups title and description |
| Main title | `Heading level={1}` | "Welcome to Symphony" heading |
| Symphony highlight | `Text as="span"` | Styled "Symphony" text |
| Description | `Text size="lg"` | Subtitle description |
| Quick actions | `Grid cols={2}` | 2-column grid for action cards |
| Footer links | `Flex` | Horizontal layout with gap for footer buttons |
| Footer separators | `Text as="span"` | Bullet point separators |
| Footer button text | `Text as="span"` | Text inside footer buttons |

## Usage

```jsx
import { WelcomeScreen } from '@symphony/welcome-screen';

function App() {
  return (
    <WelcomeScreen
      onOpenFolder={() => console.log('Open folder')}
      onNewFile={() => console.log('New file')}
      onCloneRepo={() => console.log('Clone repo')}
      onAiOrchestra={() => console.log('AI Orchestra')}
      onRecent={() => console.log('Recent')}
      onGettingStarted={() => console.log('Getting Started')}
      onDocumentation={() => console.log('Documentation')}
    />
  );
}
```

### Custom Quick Actions

```jsx
import { WelcomeScreen } from '@symphony/welcome-screen';
import { FolderOpen, FileText, Terminal } from 'lucide-react';

function App() {
  const customActions = [
    {
      id: 'custom-1',
      icon: FolderOpen,
      title: 'Custom Action 1',
      description: 'Description here',
      variant: 'primary',
      onClick: () => console.log('Action 1')
    },
    {
      id: 'custom-2',
      icon: FileText,
      title: 'Custom Action 2',
      description: 'Description here',
      variant: 'light',
      onClick: () => console.log('Action 2')
    }
  ];

  return (
    <WelcomeScreen
      quickActions={customActions}
      onRecent={() => {}}
      onGettingStarted={() => {}}
      onDocumentation={() => {}}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `logoSrc` | `string` | `'../../assets/logo.png'` | Path to logo image |
| `onOpenFolder` | `function` | - | Open folder action |
| `onNewFile` | `function` | - | New file action |
| `onCloneRepo` | `function` | - | Clone repository action |
| `onAiOrchestra` | `function` | - | AI Orchestra action |
| `onRecent` | `function` | - | Recent projects action |
| `onGettingStarted` | `function` | - | Getting started action |
| `onDocumentation` | `function` | - | Documentation action |
| `quickActions` | `QuickAction[]` | Default 4 actions | Custom quick actions |
| `className` | `string` | `''` | Additional CSS classes |

### QuickAction Object

```typescript
{
  id: string;                                    // Unique identifier
  icon: LucideIcon;                             // Icon component
  title: string;                                // Action title
  description: string;                          // Action description
  variant: 'primary' | 'light' | 'dark' | 'accent'; // Color variant
  onClick: function;                            // Click handler
}
```

## Animations

- **Logo**: Floating animation with glow effect
- **Cards**: Scale and shadow on hover
- **Links**: Color transition on hover

## Components Used

- `@symphony/quick-action-card` - Action cards with glassmorphism
- `@symphony/ui` - Design system components:
  - `Button` - Footer action buttons
  - `Flex` - Flexbox layout for main container and footer
  - `Box` - Content wrapper and sections
  - `Grid` - Quick actions grid layout
  - `Heading` - Welcome title
  - `Text` - Description and inline text elements

## Migration Notes

This component was migrated from raw HTML elements to Symphony UI components as part of the component-packages-migration initiative. The migration replaced:

- `<div>` → `<Flex>`, `<Box>`, `<Grid>`
- `<h1>` → `<Heading level={1}>`
- `<p>` → `<Text>`
- `<span>` → `<Text as="span">`

All functionality and styling has been preserved while gaining the benefits of the design system's consistent API and theming support.
