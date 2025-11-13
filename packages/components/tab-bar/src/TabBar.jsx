import React, { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import Tab from './components/Tab.jsx';
import { Button } from 'ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui';

export default function TabBar({ 
  tabs = [],
  activeTabId,
  onTabChange,
  onTabClose,
  onCloseAll,
  onCloseOthers,
  className = ''
}) {
  const handleTabClick = (tabId) => {
    onTabChange?.(tabId);
  };

  const handleTabClose = (tabId) => {
    onTabClose?.(tabId);
  };

  const handleCloseAll = () => {
    onCloseAll?.();
  };

  const handleCloseOthers = () => {
    onCloseOthers?.(activeTabId);
  };

  return (
    <div className={`bg-bg-secondary/30 border-b border-border-subtle flex items-center justify-between h-10 ${className}`}>
      {/* Tab List */}
      <div className="flex items-center h-full overflow-x-auto scrollbar-thin">
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            id={tab.id}
            icon={tab.icon}
            label={tab.label}
            isActive={tab.id === activeTabId}
            isDirty={tab.isDirty}
            onClick={handleTabClick}
            onClose={handleTabClose}
          />
        ))}
      </div>

      {/* More Options */}
      {tabs.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="p-1 mx-2 rounded hover:bg-bg-tertiary text-text-tertiary hover:text-text-primary h-6 w-6"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleCloseOthers}>
              Close Others
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCloseAll}>
              Close All
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
