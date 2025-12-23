import React from 'react';
import { Avatar, AvatarFallback, Button, Box, Flex, Text, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'ui';
import { Settings } from 'lucide-react';

export default function UserSection({ 
  userName = 'User', 
  isOnline = true,
  onSettingsClick,
  onUserClick
}) {
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <Flex direction="column" gap={1}>
      {/* Settings Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onSettingsClick}
              className="p-2.5 rounded-lg text-text-tertiary hover:bg-bg-tertiary hover:text-text-primary transition-all"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <Text>Settings</Text>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* User Avatar */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onUserClick}
              className="relative group cursor-pointer p-0"
              aria-label="Account"
            >
              <Flex 
                align="center" 
                justify="center" 
                className="w-8 h-8 rounded-full bg-gradient-to-br from-symphony-primary to-symphony-accent text-white text-xs font-semibold shadow-lg ring-2 ring-bg-secondary hover:ring-symphony-primary/50 transition-all"
              >
                <Text className="font-bold">{initials}</Text>
              </Flex>
              
              {/* Online Status Indicator */}
              <Box className={`
                absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-bg-secondary
                ${isOnline ? 'bg-green-500' : 'bg-gray-500'}
              `} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <Text>{userName}</Text>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </Flex>
  );
}
