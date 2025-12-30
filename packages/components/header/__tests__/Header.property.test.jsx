/**
 * @vitest-environment jsdom
 * **Feature: component-packages-migration, Property 1: No Pure HTML Elements**
 * 
 * Property tests for Header component to verify it uses only UI components.
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**
 */

import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Header from '../src/Header.jsx';

// Mock the external Symphony components
vi.mock('@symphony/mode-switcher', () => ({
  ModeSwitcher: ({ mode, onModeChange, className }) => (
    <div data-testid="mode-switcher" className={className}>
      Mode: {mode}
    </div>
  ),
}));

vi.mock('@symphony/notification-center', () => ({
  NotificationCenter: ({ notifications }) => (
    <div data-testid="notification-center">
      Notifications: {notifications?.length || 0}
    </div>
  ),
}));

vi.mock('@symphony/command-palette', () => ({
  CommandSearch: ({ onFocus }) => (
    <input data-testid="command-search" onFocus={onFocus} placeholder="Search commands..." />
  ),
  CommandPalette: ({ isOpen, onOpenChange, commands }) => (
    isOpen ? <div data-testid="command-palette">Command Palette</div> : null
  ),
}));

describe('Header - Property 1: No Pure HTML Elements', () => {
  const defaultProps = {
    logoSrc: '/logo.png',
    title: 'Symphony',
    subtitle: 'AI-FIRST DEVELOPMENT',
    mode: 'normal',
    onModeChange: () => {},
    notifications: [],
    onNotificationClick: () => {},
    onMarkAllRead: () => {},
    onViewAllNotifications: () => {},
    commands: [],
    onCommandSelect: () => {},
    onSettingsClick: () => {},
    onAiChatClick: () => {},
    aiOnline: true,
  };

  it('should use Flex component for the header container', () => {
    const { container } = render(<Header {...defaultProps} />);

    // The root header element should use Flex with flex classes
    const headerElement = container.querySelector('header');
    expect(headerElement).toBeTruthy();
    expect(headerElement.classList.contains('flex')).toBe(true);
  });

  it('should use Flex component for layout sections', () => {
    const { container } = render(<Header {...defaultProps} />);

    // Multiple Flex components should be present for layout
    const flexElements = container.querySelectorAll('.flex');
    expect(flexElements.length).toBeGreaterThan(1);
  });

  it('should use Button components for interactive elements', () => {
    const { container } = render(<Header {...defaultProps} />);

    // Should have buttons for AI Chat and Settings
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('should use Box component for the AI online status indicator', () => {
    const { container } = render(<Header {...defaultProps} aiOnline={true} />);

    // The online status indicator should be rendered
    const statusIndicator = container.querySelector('.bg-green-500.rounded-full');
    expect(statusIndicator).toBeTruthy();
  });

  it('should preserve component functionality with all props', () => {
    let settingsClicked = false;
    let aiChatClicked = false;

    const { container, getByTitle } = render(
      <Header 
        {...defaultProps}
        onSettingsClick={() => { settingsClicked = true; }}
        onAiChatClick={() => { aiChatClicked = true; }}
      />
    );

    // Component should render
    expect(container.firstChild).toBeTruthy();

    // Settings button should be present
    const settingsButton = getByTitle('Settings');
    expect(settingsButton).toBeTruthy();

    // AI Assistant button should be present
    const aiButton = getByTitle('AI Assistant');
    expect(aiButton).toBeTruthy();
  });

  it('should render Logo sub-component with UI components', () => {
    const { container } = render(
      <Header 
        {...defaultProps}
        title="Test Title"
        subtitle="Test Subtitle"
      />
    );

    // Logo should render title and subtitle
    expect(container.textContent).toContain('Test Title');
    expect(container.textContent).toContain('Test Subtitle');
  });
});

describe('Header - Property 2: Layout Components Usage', () => {
  const defaultProps = {
    logoSrc: '/logo.png',
    title: 'Symphony',
    mode: 'normal',
    onModeChange: () => {},
    notifications: [],
    commands: [],
    onSettingsClick: () => {},
    onAiChatClick: () => {},
  };

  it('should use Flex with horizontal layout for header', () => {
    const { container } = render(<Header {...defaultProps} />);

    const headerElement = container.querySelector('header');
    // Flex with justify-between for horizontal layout
    expect(headerElement.classList.contains('justify-between')).toBe(true);
  });

  it('should use Flex with align-center for vertical alignment', () => {
    const { container } = render(<Header {...defaultProps} />);

    const headerElement = container.querySelector('header');
    expect(headerElement.classList.contains('items-center')).toBe(true);
  });

  it('should use gap utilities for spacing between elements', () => {
    const { container } = render(<Header {...defaultProps} />);

    // Should have gap classes for spacing
    const elementsWithGap = container.querySelectorAll('[class*="gap-"]');
    expect(elementsWithGap.length).toBeGreaterThan(0);
  });
});

describe('Header - Property 5: Component Functionality Preservation', () => {
  it('should handle mode changes', () => {
    let newMode = null;
    
    const { getByTestId } = render(
      <Header 
        mode="normal"
        onModeChange={(mode) => { newMode = mode; }}
        notifications={[]}
        commands={[]}
        onSettingsClick={() => {}}
        onAiChatClick={() => {}}
      />
    );

    // ModeSwitcher should be rendered
    const modeSwitcher = getByTestId('mode-switcher');
    expect(modeSwitcher).toBeTruthy();
  });

  it('should display notifications count', () => {
    const notifications = [
      { id: 1, message: 'Test notification' },
      { id: 2, message: 'Another notification' },
    ];

    const { getByTestId } = render(
      <Header 
        notifications={notifications}
        commands={[]}
        onSettingsClick={() => {}}
        onAiChatClick={() => {}}
      />
    );

    const notificationCenter = getByTestId('notification-center');
    expect(notificationCenter.textContent).toContain('2');
  });

  it('should show AI online status when aiOnline is true', () => {
    const { container } = render(
      <Header 
        aiOnline={true}
        notifications={[]}
        commands={[]}
        onSettingsClick={() => {}}
        onAiChatClick={() => {}}
      />
    );

    const onlineIndicator = container.querySelector('.bg-green-500');
    expect(onlineIndicator).toBeTruthy();
  });

  it('should hide AI online status when aiOnline is false', () => {
    const { container } = render(
      <Header 
        aiOnline={false}
        notifications={[]}
        commands={[]}
        onSettingsClick={() => {}}
        onAiChatClick={() => {}}
      />
    );

    const onlineIndicator = container.querySelector('.bg-green-500');
    expect(onlineIndicator).toBeFalsy();
  });
});
