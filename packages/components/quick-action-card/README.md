# Quick Action Card Component

Glassmorphic action card with icon and hover effects for Symphony IDE.

## Features

- Glassmorphism design with backdrop blur
- Smooth scale and shadow transitions on hover
- Icon with color variant support
- Symphony color palette integration
- Responsive and accessible

## Usage

```jsx
import { QuickActionCard } from '@symphony/quick-action-card';
import { FolderOpen, FileText, GitBranch, Sparkles } from 'lucide-react';

function WelcomeScreen() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <QuickActionCard
        icon={FolderOpen}
        title="Open Folder"
        description="Start with an existing project"
        variant="primary"
        onClick={() => console.log('Open folder')}
      />
      
      <QuickActionCard
        icon={FileText}
        title="New File"
        description="Create a new file"
        variant="light"
        onClick={() => console.log('New file')}
      />
      
      <QuickActionCard
        icon={GitBranch}
        title="Clone Repository"
        description="Clone from Git"
        variant="dark"
        onClick={() => console.log('Clone repo')}
      />
      
      <QuickActionCard
        icon={Sparkles}
        title="AI Orchestra"
        description="Start with AI agents"
        variant="accent"
        onClick={() => console.log('AI Orchestra')}
      />
    </div>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `LucideIcon` | - | Icon component from lucide-react |
| `title` | `string` | - | Card title |
| `description` | `string` | - | Card description |
| `onClick` | `function` | - | Click handler |
| `variant` | `'primary' \| 'light' \| 'dark' \| 'accent'` | `'primary'` | Color variant |
| `className` | `string` | `''` | Additional CSS classes |

## Variants

- **primary**: Symphony blue (#5B8FF9)
- **light**: Light blue (#7BA5FA)
- **dark**: Dark blue (#4A7AD8)
- **accent**: Accent blue (#3B6DD8)
