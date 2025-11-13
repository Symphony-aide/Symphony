import React from 'react';
import { CheckCircle2, Puzzle, Bot, AlertCircle, Info } from 'lucide-react';

const iconMap = {
  success: CheckCircle2,
  extension: Puzzle,
  ai: Bot,
  warning: AlertCircle,
  info: Info
};

const colorMap = {
  success: {
    bg: 'bg-symphony-primary/10',
    text: 'text-symphony-primary'
  },
  extension: {
    bg: 'bg-symphony-light/10',
    text: 'text-symphony-light'
  },
  ai: {
    bg: 'bg-symphony-accent/10',
    text: 'text-symphony-accent'
  },
  warning: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-500'
  },
  info: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-500'
  }
};

export default function NotificationItem({ 
  id,
  title,
  message,
  timestamp,
  type = 'info',
  isRead = false,
  onClick
}) {
  const Icon = iconMap[type] || Info;
  const colors = colorMap[type] || colorMap.info;

  const formatTimestamp = (time) => {
    if (!time) return '';
    const now = new Date();
    const notifTime = new Date(time);
    const diffMs = now - notifTime;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  return (
    <button
      onClick={() => onClick?.(id)}
      className={`
        w-full px-4 py-3 
        hover:bg-bg-tertiary/50 
        border-b border-border-subtle 
        cursor-pointer 
        transition-colors
        text-left
        ${!isRead ? 'bg-symphony-primary/5' : ''}
      `}
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${colors.text}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${isRead ? 'text-text-secondary' : 'text-text-primary'}`}>
            {title}
          </p>
          <p className="text-xs text-text-tertiary mt-1 line-clamp-2">
            {message}
          </p>
          <p className="text-xs text-text-tertiary mt-1">
            {formatTimestamp(timestamp)}
          </p>
        </div>

        {/* Unread indicator */}
        {!isRead && (
          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-symphony-primary mt-1" />
        )}
      </div>
    </button>
  );
}
