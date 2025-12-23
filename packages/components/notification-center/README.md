# Notification Center Component

Dropdown notification panel with unread badges and multiple notification types.

## Features

- Popover dropdown with glassmorphic design
- Unread badge with pulse animation
- Multiple notification types (success, extension, ai, warning, info)
- Timestamp formatting (relative time)
- Mark as read functionality
- Scrollable list for many notifications
- Empty state
- Custom hook for state management

## Architecture

This component uses Symphony's semantic UI components from `@symphony/ui`:

| Element | UI Component | Purpose |
|---------|--------------|---------|
| Layout containers | `Box`, `Flex` | Semantic layout with flexbox support |
| Headers | `Heading` | Accessible heading hierarchy |
| Text content | `Text` | Consistent typography with size variants |
| Notification items | `Button` | Accessible clickable items |
| Badges | `Badge` | Unread count display |
| Scrolling | `ScrollArea` | Virtualized scrollable content |
| Dropdown | `Popover` | Accessible dropdown panel |

### Component Structure

```
NotificationCenter
├── PopoverTrigger (Button with Bell icon)
│   └── Box (unread indicator dot)
├── PopoverContent
│   ├── Flex (header with Heading + Badge)
│   ├── ScrollArea (notification list)
│   │   └── NotificationItem[] (Button-based items)
│   │       ├── Flex (icon container)
│   │       ├── Box (content wrapper)
│   │       │   └── Text (title, message, timestamp)
│   │       └── Box (unread dot)
│   └── Flex (footer with action buttons)
```

## Usage

```jsx
import { NotificationCenter, useNotifications } from '@symphony/notification-center';

function App() {
  const {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    unreadCount
  } = useNotifications();

  // Add a notification
  const handleBuildComplete = () => {
    addNotification({
      title: 'Build Successful',
      message: 'Your project compiled without errors',
      type: 'success'
    });
  };

  return (
    <div>
      <NotificationCenter
        notifications={notifications}
        onNotificationClick={markAsRead}
        onMarkAllRead={markAllAsRead}
        onViewAll={() => console.log('View all')}
      />
      
      <button onClick={handleBuildComplete}>
        Trigger Notification
      </button>
    </div>
  );
}
```

## Props

### NotificationCenter

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `notifications` | `Notification[]` | `[]` | Array of notification objects |
| `onNotificationClick` | `function` | - | Callback when notification is clicked |
| `onViewAll` | `function` | - | Callback for "View All" button |
| `onMarkAllRead` | `function` | - | Callback for "Mark all read" button |
| `className` | `string` | `''` | Additional CSS classes |

### Notification Object

```typescript
{
  id: string;           // Unique identifier
  title: string;        // Notification title
  message: string;      // Notification message
  timestamp: string;    // ISO timestamp
  type: 'success' | 'extension' | 'ai' | 'warning' | 'info';
  isRead: boolean;      // Read status
}
```

## useNotifications Hook

```jsx
const {
  notifications,        // Array of notifications
  addNotification,      // (notification) => id
  markAsRead,          // (id) => void
  markAllAsRead,       // () => void
  removeNotification,  // (id) => void
  clearAll,            // () => void
  unreadCount          // number
} = useNotifications(initialNotifications);
```

## Notification Types

- **success**: Green - Build complete, operation success
- **extension**: Light blue - Extension updates
- **ai**: Accent blue - AI agent status
- **warning**: Yellow - Warnings and cautions
- **info**: Blue - General information


## UI Component Migration

This component has been migrated to use Symphony's semantic UI components as part of the component-packages-migration initiative. The migration replaces raw HTML elements with their UI component equivalents:

### Before/After Mapping

| Before | After | Notes |
|--------|-------|-------|
| `<div>` | `<Box>` or `<Flex>` | Use `Flex` for flexbox layouts |
| `<h3>` | `<Heading level={6}>` | Semantic heading with proper hierarchy |
| `<p>` | `<Text>` | Typography component with size variants |
| `<span>` | `<Text>` | Inline text with consistent styling |

### Benefits

- **Accessibility**: UI components include proper ARIA attributes
- **Consistency**: Unified styling across all Symphony components
- **Maintainability**: Centralized component definitions
- **Theme Support**: Automatic theme integration

### NotificationItem Component

The `NotificationItem` sub-component uses:
- `Button` (variant="ghost") for the clickable notification row
- `Flex` for icon and content layout
- `Box` for content wrapper and unread indicator
- `Text` with size variants for title, message, and timestamp
