import React from 'react';
import { X } from 'lucide-react';
import { Button, Flex, Box, Text, Badge } from 'ui';

export default function Tab({ 
  id,
  icon: Icon,
  label,
  isActive = false,
  isDirty = false,
  onClick,
  onClose,
  className = ''
}) {
  const handleClose = (e) => {
    e.stopPropagation();
    onClose?.(id);
  };

  if (isActive) {
    return (
      <Button
        variant="ghost"
        onClick={() => onClick?.(id)}
        className={`
          blob-tab group relative flex items-center space-x-2 text-sm font-medium
          bg-bg-primary/70 backdrop-blur-md
          border border-symphony-primary/30 border-b-0
          rounded-t-lg px-4 py-1.5
          text-symphony-primary
          transition-all duration-300
          hover:bg-symphony-primary/20 hover:-translate-y-0.5
          ${className}
        `}
        style={{
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Bottom accent line */}
        <Box className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-symphony-primary to-symphony-light rounded-t" />
        
        {/* Bottom connector to hide border */}
        <Box className="absolute -bottom-px left-0 right-0 h-px bg-bg-primary z-10" />

        {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
        <Text className="truncate max-w-[150px]">{label}</Text>
        
        {/* Dirty indicator or close button */}
        {isDirty ? (
          <Box className="w-2 h-2 rounded-full bg-symphony-primary flex-shrink-0" />
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-symphony-primary/20 transition-opacity flex-shrink-0 h-auto w-auto"
            aria-label="Close tab"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      onClick={() => onClick?.(id)}
      className={`
        group relative flex items-center space-x-2 text-xs h-full px-4
        border-r border-border-subtle
        text-text-tertiary
        hover:bg-bg-tertiary/50 hover:text-text-primary
        transition-all
        ${className}
      `}
    >
      {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
      <Text className="truncate max-w-[120px]">{label}</Text>
      
      {/* Dirty indicator or close button */}
      {isDirty ? (
        <Box className="w-1.5 h-1.5 rounded-full bg-text-tertiary flex-shrink-0" />
      ) : (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-bg-secondary transition-opacity flex-shrink-0 h-auto w-auto"
          aria-label="Close tab"
        >
          <X className="w-3 h-3" />
        </Button>
      )}
    </Button>
  );
}
