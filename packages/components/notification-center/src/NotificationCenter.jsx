import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { 
  Button, 
  Badge, 
  ScrollArea, 
  Box, 
  Flex, 
  Heading, 
  Text,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'ui';
import NotificationItem from './components/NotificationItem.jsx';

export default function NotificationCenter({ 
  notifications = [],
  onNotificationClick,
  onViewAll,
  onMarkAllRead,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = (id) => {
    onNotificationClick?.(id);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`relative p-2 rounded-lg hover:bg-bg-tertiary text-text-secondary hover:text-text-primary ${className}`}
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          
          {/* Notification Badge */}
          {unreadCount > 0 && (
            <Box className="absolute top-1 right-1 w-2 h-2 bg-symphony-primary rounded-full animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent 
        align="end" 
        className="w-80 p-0 bg-bg-secondary/95 backdrop-blur-md border-border-default rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <Flex 
          align="center" 
          justify="between" 
          className="bg-bg-secondary/80 px-4 py-3 border-b border-border-subtle"
        >
          <Heading level={6} className="text-sm font-semibold text-text-primary">
            Notifications
          </Heading>
          {unreadCount > 0 && (
            <Badge 
              variant="secondary" 
              className="bg-symphony-primary/10 text-symphony-primary border-symphony-primary/20"
            >
              {unreadCount}
            </Badge>
          )}
        </Flex>

        {/* Notification List */}
        {notifications.length > 0 ? (
          <>
            <ScrollArea className="max-h-96">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  {...notification}
                  onClick={handleNotificationClick}
                />
              ))}
            </ScrollArea>

            {/* Footer */}
            <Flex 
              align="center" 
              justify="between" 
              gap={2}
              className="px-4 py-2 bg-bg-secondary/80 border-t border-border-subtle"
            >
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMarkAllRead}
                  className="text-xs text-text-tertiary hover:text-symphony-primary h-auto py-1"
                >
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onViewAll}
                className="text-xs text-symphony-primary hover:text-symphony-light h-auto py-1 ml-auto"
              >
                View All Notifications
              </Button>
            </Flex>
          </>
        ) : (
          <Flex direction="column" align="center" className="px-4 py-8">
            <Bell className="w-8 h-8 mb-2 text-text-tertiary opacity-50" />
            <Text size="sm" className="text-text-tertiary">
              No notifications
            </Text>
          </Flex>
        )}
      </PopoverContent>
    </Popover>
  );
}
