# Header Component

Complete header with logo, mode switcher, command palette, notifications, and actions.

## Features

- Symphony branding with logo and title
- Mode switcher (Normal/Maestro)
- Command palette with ⌘K shortcut
- Notification center with badge
- AI Assistant button with online status
- Settings button
- Glassmorphic design with backdrop blur

## Usage

```jsx
import { Header } from '@symphony/header';
import { useNotifications } from '@symphony/notification-center';

function App() {
  const [mode, setMode] = useState('normal');
  const { notifications, markAsRead, markAllAsRead } = useNotifications();

  const commands = [
    {
      id: 'open',
      label: 'Open Folder',
      icon: FolderOpen,
      category: 'File',
      action: () => console.log('Open')
    }
  ];

  return (
    <Header
      mode={mode}
      onModeChange={setMode}
      notifications={notifications}
      onNotificationClick={markAsRead}
      onMarkAllRead={markAllAsRead}
      onViewAllNotifications={() => console.log('View all')}
      commands={commands}
      onCommandSelect={(cmd) => cmd.action()}
      onSettingsClick={() => console.log('Settings')}
      onAiChatClick={() => console.log('AI Chat')}
      aiOnline={true}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `logoSrc` | `string` | `'../../assets/rounded.png'` | Path to logo image |
| `title` | `string` | `'Symphony'` | App title |
| `subtitle` | `string` | `'AI-FIRST DEVELOPMENT'` | App subtitle |
| `mode` | `'normal' \| 'maestro'` | `'normal'` | Current mode |
| `onModeChange` | `function` | - | Mode change callback |
| `notifications` | `Notification[]` | `[]` | Notifications array |
| `onNotificationClick` | `function` | - | Notification click handler |
| `onMarkAllRead` | `function` | - | Mark all read handler |
| `onViewAllNotifications` | `function` | - | View all handler |
| `commands` | `Command[]` | `[]` | Command palette items |
| `onCommandSelect` | `function` | - | Command select handler |
| `onSettingsClick` | `function` | - | Settings click handler |
| `onAiChatClick` | `function` | - | AI chat click handler |
| `aiOnline` | `boolean` | `true` | AI assistant online status |
| `className` | `string` | `''` | Additional CSS classes |

## Components Used

- `@symphony/mode-switcher` - Mode toggle
- `@symphony/notification-center` - Notifications
- `@symphony/command-palette` - Command search

## Keyboard Shortcuts

- **⌘K / Ctrl+K**: Open command palette
