import React from 'react';
import { Avatar, AvatarFallback } from 'ui';
import { Settings } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'ui';

export default function UserSection({ 
  userName = 'User', 
  isOnline = true,
  onSettingsClick,
  onUserClick
}) {
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="flex flex-col gap-1">
      {/* Settings Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onSettingsClick}
              className="p-2.5 rounded-lg text-text-tertiary hover:bg-bg-tertiary hover:text-text-primary transition-all"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Settings</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* User Avatar */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onUserClick}
              className="relative group cursor-pointer"
              aria-label="Account"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-symphony-primary to-symphony-accent flex items-center justify-center text-white text-xs font-semibold shadow-lg ring-2 ring-bg-secondary hover:ring-symphony-primary/50 transition-all">
                <span className="font-bold">{initials}</span>
              </div>
              
              {/* Online Status Indicator */}
              <div className={`
                absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-bg-secondary
                ${isOnline ? 'bg-green-500' : 'bg-gray-500'}
              `} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{userName}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
