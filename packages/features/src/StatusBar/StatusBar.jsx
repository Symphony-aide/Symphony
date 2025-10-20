import React, { useState, useEffect } from "react";
import { Terminal, GitBranch, Clock, Users, Zap } from "lucide-react";
import { Button } from "ui";

export default function StatusBar({ 
  activeFileName, 
  saved, 
  terminalVisible, 
  onToggleTerminal,
  lineCount = 0,
  cursorPosition = { line: 1, column: 1 },
  language = "JavaScript",
  lastSaved = null,
  collaborators = [],
  isOnline = true,
  gitBranch = "main"
}) {
	const [time, setTime] = useState("");

	useEffect(() => {
		const updateTime = () => {
			const now = new Date();
			setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
		};
		
		updateTime();
		const interval = setInterval(updateTime, 60000); // Update every minute
		
		return () => clearInterval(interval);
	}, []);

	const formatLastSaved = (timestamp) => {
		if (!timestamp) return '';
		const now = new Date();
		const saved = new Date(timestamp);
		const diffMs = now - saved;
		const diffMins = Math.floor(diffMs / 60000);
		
		if (diffMins < 1) return 'Just now';
		if (diffMins === 1) return '1 min ago';
		if (diffMins < 60) return `${diffMins} mins ago`;
		
		const diffHours = Math.floor(diffMins / 60);
		if (diffHours === 1) return '1 hour ago';
		return `${diffHours} hours ago`;
	};

  return (
    <div className='bg-symphony-primary text-white px-4 py-1 flex items-center justify-between text-sm border-t border-symphony-primary/20'>
      {/* Left side */}
      <div className='flex items-center space-x-4'>
        <span className='flex items-center space-x-1'>
          <GitBranch className='w-3 h-3' />
          <span>{gitBranch}</span>
        </span>

        {activeFileName && (
          <span className='text-symphony-light/80'>
            {activeFileName} • {lineCount} lines
          </span>
        )}

        <span className='flex items-center space-x-1 text-symphony-light/80'>
          <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
        </span>

        <span className='text-symphony-light/80'>{language}</span>

        {lastSaved && (
          <span className='flex items-center space-x-1 text-symphony-light/80'>
            <Clock className='w-3 h-3' />
            <span>{formatLastSaved(lastSaved)}</span>
          </span>
        )}
      </div>

      {/* Right side */}
      <div className='flex items-center space-x-4'>
        <Button 
          onClick={onToggleTerminal} 
          variant="ghost"
          size="sm"
          className='flex items-center space-x-1 hover:text-white text-symphony-light/80 hover:bg-symphony-primary/20'
        >
          <Terminal className='w-3 h-3' />
          <span>{terminalVisible ? "Hide Terminal" : "Show Terminal"}</span>
        </Button>

        {collaborators.length > 0 && (
          <span className='flex items-center space-x-1 text-symphony-light/80'>
            <Users className='w-3 h-3' />
            <span>{collaborators.length}</span>
          </span>
        )}

        <span className={`flex items-center space-x-1 ${isOnline ? "text-symphony-emerald" : "text-symphony-rose"}`}>
          <Zap className='w-3 h-3' />
          <span>{isOnline ? "Online" : "Offline"}</span>
        </span>

        <span className='text-symphony-light/60 text-xs'>
          {time}
        </span>
      </div>
    </div>
  );
}
