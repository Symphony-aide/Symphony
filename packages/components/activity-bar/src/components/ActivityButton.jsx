import React from 'react';
import { Button, Box, Text, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'ui';

export default function ActivityButton({ 
  icon: Icon, 
  label, 
  isActive = false, 
  onClick 
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            className={`
              group relative p-2.5 rounded-lg transition-all
              ${isActive 
                ? 'bg-symphony-primary/10 text-symphony-primary' 
                : 'text-text-tertiary hover:bg-bg-tertiary hover:text-text-primary'
              }
            `}
            aria-label={label}
          >
            <Icon className="w-5 h-5" />
            
            {/* Active Indicator */}
            {isActive && (
              <Box className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-6 bg-symphony-primary rounded-t" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <Text>{label}</Text>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
