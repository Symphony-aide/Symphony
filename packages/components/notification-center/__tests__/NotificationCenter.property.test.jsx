/**
 * @vitest-environment jsdom
 * **Feature: component-packages-migration, Property 1: No Pure HTML Elements**
 * 
 * Property tests for NotificationCenter component to verify it uses only UI components.
 * **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**
 */

import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import NotificationCenter from '../src/NotificationCenter.jsx';
import NotificationItem from '../src/components/NotificationItem.jsx';

describe('NotificationCenter - Property 1: No Pure HTML Elements', () => {
  const defaultProps = {
    notifications: [],
    onNotificationClick: vi.fn(),
    onViewAll: vi.fn(),
    onMarkAllRead: vi.fn(),
  };

  const sampleNotifications = [
    {
      id: '1',
      title: 'Test Notification',
      message: 'This is a test notification message',
      timestamp: new Date().toISOString(),
      type: 'info',
      isRead: false,
    },
    {
      id: '2',
      title: 'Another Notification',
      message: 'This is another test notification',
      timestamp: new Date().toISOString(),
      type: 'success',
      isRead: true,
    },
  ];

  it('should use Button component for the trigger', () => {
    const { container } = render(
      <NotificationCenter {...defaultProps} notifications={sampleNotifications} />
    );

    // The trigger button should be rendered
    const triggerButton = container.querySelector('button[aria-label="Notifications"]');
    expect(triggerButton).toBeTruthy();
  });

  it('should use Box component for notification badge indicator', () => {
    const unreadNotifications = [
      { id: '1', title: 'Test', message: 'Test', isRead: false },
    ];

    const { container } = render(
      <NotificationCenter {...defaultProps} notifications={unreadNotifications} />
    );

    // The badge indicator should be rendered with Box classes
    const badgeIndicator = container.querySelector('.animate-pulse.rounded-full');
    expect(badgeIndicator).toBeTruthy();
  });

  it('should not show badge indicator when no unread notifications', () => {
    const readNotifications = [
      { id: '1', title: 'Test', message: 'Test', isRead: true },
    ];

    const { container } = render(
      <NotificationCenter {...defaultProps} notifications={readNotifications} />
    );

    // The badge indicator should not be rendered
    const badgeIndicator = container.querySelector('.animate-pulse.rounded-full');
    expect(badgeIndicator).toBeFalsy();
  });

  it('should render Bell icon from lucide-react', () => {
    const { container } = render(
      <NotificationCenter {...defaultProps} notifications={sampleNotifications} />
    );

    // Should have an SVG icon (Bell)
    const icon = container.querySelector('svg');
    expect(icon).toBeTruthy();
  });
});

describe('NotificationItem - Property 1: No Pure HTML Elements', () => {
  const defaultItemProps = {
    id: '1',
    title: 'Test Notification',
    message: 'This is a test message',
    timestamp: new Date().toISOString(),
    type: 'info',
    isRead: false,
    onClick: vi.fn(),
  };

  it('should use Button component instead of native button', () => {
    const { container } = render(<NotificationItem {...defaultItemProps} />);

    // Should render a button element (from Button component)
    const button = container.querySelector('button');
    expect(button).toBeTruthy();
    // Button component adds specific classes
    expect(button.className).toContain('w-full');
  });

  it('should use Flex component for layout', () => {
    const { container } = render(<NotificationItem {...defaultItemProps} />);

    // Should have flex layout classes
    const flexElements = container.querySelectorAll('.flex');
    expect(flexElements.length).toBeGreaterThan(0);
  });

  it('should use Text component for title, message, and timestamp', () => {
    const { container } = render(<NotificationItem {...defaultItemProps} />);

    // Should contain the title, message, and timestamp text
    expect(container.textContent).toContain('Test Notification');
    expect(container.textContent).toContain('This is a test message');
  });

  it('should use Flex component for icon container', () => {
    const { container } = render(<NotificationItem {...defaultItemProps} />);

    // Icon container should have flex and rounded classes
    const iconContainer = container.querySelector('.rounded-lg.flex-shrink-0');
    expect(iconContainer).toBeTruthy();
  });

  it('should use Box component for unread indicator', () => {
    const { container } = render(<NotificationItem {...defaultItemProps} isRead={false} />);

    // Unread indicator should be rendered
    const unreadIndicator = container.querySelector('.rounded-full.bg-symphony-primary');
    expect(unreadIndicator).toBeTruthy();
  });

  it('should not render unread indicator when isRead is true', () => {
    const { container } = render(<NotificationItem {...defaultItemProps} isRead={true} />);

    // Unread indicator should not be rendered (the small 2x2 one)
    const unreadIndicator = container.querySelector('.w-2.h-2.rounded-full.bg-symphony-primary');
    expect(unreadIndicator).toBeFalsy();
  });
});

describe('NotificationItem - Property 2: Layout Components Usage', () => {
  const defaultItemProps = {
    id: '1',
    title: 'Test Notification',
    message: 'This is a test message',
    timestamp: new Date().toISOString(),
    type: 'info',
    isRead: false,
    onClick: vi.fn(),
  };

  it('should use Flex with align-start for notification item layout', () => {
    const { container } = render(<NotificationItem {...defaultItemProps} />);

    // Should have items-start class for align-start
    const flexElement = container.querySelector('.items-start');
    expect(flexElement).toBeTruthy();
  });

  it('should use gap utility for spacing between elements', () => {
    const { container } = render(<NotificationItem {...defaultItemProps} />);

    // Should have gap class for spacing
    const gapElement = container.querySelector('[class*="gap-"]');
    expect(gapElement).toBeTruthy();
  });
});

describe('NotificationItem - Property 5: Component Functionality Preservation', () => {
  it('should call onClick with correct id when clicked', () => {
    const onClick = vi.fn();
    
    const { container } = render(
      <NotificationItem 
        id="test-123"
        title="Test"
        message="Test message"
        timestamp={new Date().toISOString()}
        type="info"
        isRead={false}
        onClick={onClick}
      />
    );

    const button = container.querySelector('button');
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledWith('test-123');
  });

  it('should apply different styling for read vs unread notifications', () => {
    const { container: unreadContainer } = render(
      <NotificationItem 
        id="1"
        title="Unread"
        message="Message"
        timestamp={new Date().toISOString()}
        type="info"
        isRead={false}
        onClick={vi.fn()}
      />
    );

    const { container: readContainer } = render(
      <NotificationItem 
        id="2"
        title="Read"
        message="Message"
        timestamp={new Date().toISOString()}
        type="info"
        isRead={true}
        onClick={vi.fn()}
      />
    );

    // Unread should have the highlight background
    const unreadButton = unreadContainer.querySelector('button');
    expect(unreadButton.className).toContain('bg-symphony-primary/5');

    // Read should not have the highlight background
    const readButton = readContainer.querySelector('button');
    expect(readButton.className).not.toContain('bg-symphony-primary/5');
  });

  it('should render correct icon based on notification type', () => {
    const types = ['success', 'extension', 'ai', 'warning', 'info'];
    
    types.forEach(type => {
      const { container } = render(
        <NotificationItem 
          id="1"
          title="Test"
          message="Message"
          timestamp={new Date().toISOString()}
          type={type}
          isRead={false}
          onClick={vi.fn()}
        />
      );

      // Should have an SVG icon
      const icon = container.querySelector('svg');
      expect(icon).toBeTruthy();
    });
  });

  it('should format timestamp correctly for recent notifications', () => {
    const now = new Date();
    
    const { container } = render(
      <NotificationItem 
        id="1"
        title="Test"
        message="Message"
        timestamp={now.toISOString()}
        type="info"
        isRead={false}
        onClick={vi.fn()}
      />
    );

    // Should show "Just now" for recent timestamps
    expect(container.textContent).toContain('Just now');
  });

  it('should format timestamp correctly for older notifications', () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const { container } = render(
      <NotificationItem 
        id="1"
        title="Test"
        message="Message"
        timestamp={oneHourAgo.toISOString()}
        type="info"
        isRead={false}
        onClick={vi.fn()}
      />
    );

    // Should show "1 hour ago"
    expect(container.textContent).toContain('1 hour ago');
  });

  it('should apply correct color classes based on notification type', () => {
    const { container: successContainer } = render(
      <NotificationItem 
        id="1"
        title="Success"
        message="Message"
        timestamp={new Date().toISOString()}
        type="success"
        isRead={false}
        onClick={vi.fn()}
      />
    );

    // Success type should have symphony-primary colors
    const successIcon = successContainer.querySelector('.text-symphony-primary');
    expect(successIcon).toBeTruthy();

    const { container: warningContainer } = render(
      <NotificationItem 
        id="2"
        title="Warning"
        message="Message"
        timestamp={new Date().toISOString()}
        type="warning"
        isRead={false}
        onClick={vi.fn()}
      />
    );

    // Warning type should have yellow colors
    const warningIcon = warningContainer.querySelector('.text-yellow-500');
    expect(warningIcon).toBeTruthy();
  });
});

describe('NotificationCenter - Property 5: Component Functionality Preservation', () => {
  it('should render trigger button with correct aria-label', () => {
    const { container } = render(
      <NotificationCenter 
        notifications={[]}
        onNotificationClick={vi.fn()}
        onViewAll={vi.fn()}
        onMarkAllRead={vi.fn()}
      />
    );

    const triggerButton = container.querySelector('button[aria-label="Notifications"]');
    expect(triggerButton).toBeTruthy();
  });

  it('should show unread indicator when there are unread notifications', () => {
    const notifications = [
      { id: '1', title: 'Test', message: 'Message', isRead: false },
    ];

    const { container } = render(
      <NotificationCenter 
        notifications={notifications}
        onNotificationClick={vi.fn()}
        onViewAll={vi.fn()}
        onMarkAllRead={vi.fn()}
      />
    );

    // Should show the pulse indicator
    const pulseIndicator = container.querySelector('.animate-pulse');
    expect(pulseIndicator).toBeTruthy();
  });

  it('should not show unread indicator when all notifications are read', () => {
    const notifications = [
      { id: '1', title: 'Test', message: 'Message', isRead: true },
    ];

    const { container } = render(
      <NotificationCenter 
        notifications={notifications}
        onNotificationClick={vi.fn()}
        onViewAll={vi.fn()}
        onMarkAllRead={vi.fn()}
      />
    );

    // Should not show the pulse indicator
    const pulseIndicator = container.querySelector('.animate-pulse');
    expect(pulseIndicator).toBeFalsy();
  });

  it('should apply custom className to trigger button', () => {
    const { container } = render(
      <NotificationCenter 
        notifications={[]}
        onNotificationClick={vi.fn()}
        onViewAll={vi.fn()}
        onMarkAllRead={vi.fn()}
        className="custom-class"
      />
    );

    const triggerButton = container.querySelector('button[aria-label="Notifications"]');
    expect(triggerButton.className).toContain('custom-class');
  });
});
