# Activity Bar Component

Vertical navigation bar for Symphony IDE with activity buttons and user section.

## Features

- 5 main activity buttons (Explorer, Harmony Board, Source Control, AI Orchestra, Extensions)
- Active state with visual indicator
- Hover tooltips
- Settings button
- User avatar with online status indicator
- Glassmorphic design with Symphony branding

## Usage

```jsx
import { ActivityBar } from '@symphony/activity-bar';

function App() {
  const [activeSidebar, setActiveSidebar] = useState('explorer');

  return (
    <ActivityBar
      activeSidebar={activeSidebar}
      onSidebarChange={setActiveSidebar}
      userName="John Doe"
      isOnline={true}
      onSettingsClick={() => console.log('Settings')}
      onUserClick={() => console.log('User profile')}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `activeSidebar` | `string` | `'explorer'` | Currently active sidebar ID |
| `onSidebarChange` | `function` | - | Callback when sidebar changes |
| `userName` | `string` | `'User'` | User display name |
| `isOnline` | `boolean` | `true` | User online status |
| `onSettingsClick` | `function` | - | Settings button click handler |
| `onUserClick` | `function` | - | User avatar click handler |

## Sidebar IDs

- `explorer` - File Explorer
- `harmony` - Harmony Board
- `source` - Source Control
- `orchestra` - AI Orchestra
- `extensions` - Extensions Marketplace
