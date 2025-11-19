import React, { useState } from 'react';
import { FolderOpen, LayoutDashboard, GitBranch, Bot, Puzzle } from 'lucide-react';
import ActivityButton from './components/ActivityButton.jsx';
import UserSection from './components/UserSection.jsx';

export default function ActivityBar({ 
  activeSidebar = 'explorer',
  onSidebarChange,
  userName = 'User',
  isOnline = true,
  onSettingsClick,
  onUserClick
}) {
  const [activeId, setActiveId] = useState(activeSidebar);

  const handleButtonClick = (id) => {
    setActiveId(id);
    onSidebarChange?.(id);
  };

  const activities = [
    { id: 'explorer', icon: FolderOpen, label: 'Explorer' },
    { id: 'harmony', icon: LayoutDashboard, label: 'Harmony Board' },
    { id: 'source', icon: GitBranch, label: 'Source Control' },
    { id: 'orchestra', icon: Bot, label: 'AI Orchestra' },
    { id: 'extensions', icon: Puzzle, label: 'Extensions' }
  ];

  return (
    <aside className="w-14 bg-bg-secondary border-r border-border-subtle flex flex-col items-center py-4 gap-1">
      {/* Main Activities */}
      <div className="flex-1 flex flex-col gap-1">
        {activities.map((activity) => (
          <ActivityButton
            key={activity.id}
            icon={activity.icon}
            label={activity.label}
            isActive={activeId === activity.id}
            onClick={() => handleButtonClick(activity.id)}
          />
        ))}
      </div>

      {/* Bottom User Section */}
      <UserSection
        userName={userName}
        isOnline={isOnline}
        onSettingsClick={onSettingsClick}
        onUserClick={onUserClick}
      />
    </aside>
  );
}
