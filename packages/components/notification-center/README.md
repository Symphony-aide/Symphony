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
