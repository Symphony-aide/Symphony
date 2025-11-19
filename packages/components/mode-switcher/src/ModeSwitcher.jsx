import React, { useState } from 'react';
import { ToggleGroup, ToggleGroupItem } from 'ui';

export default function ModeSwitcher({ 
  mode = 'normal',
  onModeChange,
  className = ''
}) {
  const [currentMode, setCurrentMode] = useState(mode);

  const handleModeChange = (value) => {
    if (value) {
      setCurrentMode(value);
      onModeChange?.(value);
    }
  };

  return (
    <div className={`flex items-center ${className}`}>
      <ToggleGroup 
        type="single" 
        value={currentMode} 
        onValueChange={handleModeChange}
        className="bg-bg-tertiary rounded-lg p-1 gap-1"
      >
        <ToggleGroupItem 
          value="normal" 
          aria-label="Normal Mode"
          className="px-3 py-1.5 text-xs font-medium rounded-md transition-all data-[state=on]:bg-symphony-primary data-[state=on]:text-white data-[state=off]:text-text-tertiary hover:text-text-primary hover:bg-bg-secondary"
        >
          🎼 Normal
        </ToggleGroupItem>
        
        <ToggleGroupItem 
          value="maestro" 
          aria-label="Maestro Mode"
          className="px-3 py-1.5 text-xs font-medium rounded-md transition-all data-[state=on]:bg-symphony-primary data-[state=on]:text-white data-[state=off]:text-text-tertiary hover:text-text-primary hover:bg-bg-secondary"
        >
          🎩 Maestro
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
