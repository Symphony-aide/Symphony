import React, { useState } from 'react';
import { Settings, BrainCircuit } from 'lucide-react';
import { Button, Badge, Flex, Box } from 'ui';
import Logo from './components/Logo.jsx';
import { ModeSwitcher } from '@symphony/mode-switcher';
import { NotificationCenter } from '@symphony/notification-center';
import { CommandSearch, CommandPalette } from '@symphony/command-palette';

export default function Header({ 
  logoSrc,
  title,
  subtitle,
  mode = 'normal',
  onModeChange,
  notifications = [],
  onNotificationClick,
  onMarkAllRead,
  onViewAllNotifications,
  commands = [],
  onCommandSelect,
  onSettingsClick,
  onAiChatClick,
  aiOnline = true,
  className = ''
}) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  return (
    <>
      <Flex 
        as="header"
        align="center" 
        justify="between" 
        className={`
          px-6 py-3 
          border-b border-border-subtle 
          bg-bg-secondary/50 backdrop-blur-sm
          ${className}
        `}
      >
        {/* Left Section: Logo + Mode Switcher */}
        <Flex align="center" gap={3}>
          <Logo 
            logoSrc={logoSrc}
            title={title}
            subtitle={subtitle}
          />

          {/* Mode Switcher */}
          <ModeSwitcher
            mode={mode}
            onModeChange={onModeChange}
            className="ml-24"
          />
        </Flex>

        {/* Center: Command Search */}
        <CommandSearch 
          onFocus={() => setCommandPaletteOpen(true)}
        />

        {/* Right Section: Actions */}
        <Flex align="center" gap={2} className="relative">
          {/* AI Chat Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onAiChatClick}
            className="relative p-2 rounded-lg hover:bg-bg-tertiary text-text-secondary hover:text-text-primary"
            title="AI Assistant"
          >
            <BrainCircuit className="w-5 h-5" />
            {/* Online Status */}
            {aiOnline && (
              <Box className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-bg-secondary" />
            )}
          </Button>

          {/* Notifications */}
          <NotificationCenter
            notifications={notifications}
            onNotificationClick={onNotificationClick}
            onMarkAllRead={onMarkAllRead}
            onViewAll={onViewAllNotifications}
          />

          {/* Settings */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onSettingsClick}
            className="p-2 rounded-lg hover:bg-bg-tertiary text-text-secondary hover:text-text-primary"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </Flex>
      </Flex>

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        commands={commands}
        onCommandSelect={onCommandSelect}
      />
    </>
  );
}
