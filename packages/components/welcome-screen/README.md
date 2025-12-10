# Welcome Screen Component

Elegant empty state with animated logo, quick actions, and footer links.

## Features

- Animated floating logo with glow effect
- Customizable quick action cards
- Four default actions (Open Folder, New File, Clone Repo, AI Orchestra)
- Footer links (Recent, Getting Started, Documentation)
- Symphony branding and color scheme
- Responsive grid layout

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
