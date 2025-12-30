import React, { useState, useEffect } from "react";
import { Terminal, GitBranch, Clock, Users, Zap } from "lucide-react";
import { Button, Flex, Text, Badge, Separator } from "ui";

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
    <Flex 
      as="footer"
      align="center" 
      justify="between" 
      className='bg-symphony-primary text-white px-4 py-1 text-sm border-t border-symphony-primary/20'
    >
      {/* Left side */}
      <Flex align="center" gap={4}>
        <Flex align="center" gap={1}>
          <GitBranch className='w-3 h-3' />
          <Text>{gitBranch}</Text>
        </Flex>

        {activeFileName && (
          <Text className='text-symphony-light/80'>
            {activeFileName} • {lineCount} lines
          </Text>
        )}

        <Flex align="center" gap={1} className='text-symphony-light/80'>
          <Text>Ln {cursorPosition.line}, Col {cursorPosition.column}</Text>
        </Flex>

        <Text className='text-symphony-light/80'>{language}</Text>

        {lastSaved && (
          <Flex align="center" gap={1} className='text-symphony-light/80'>
            <Clock className='w-3 h-3' />
            <Text>{formatLastSaved(lastSaved)}</Text>
          </Flex>
        )}
      </Flex>

      {/* Right side */}
      <Flex align="center" gap={4}>
        <Button 
          onClick={onToggleTerminal} 
          variant="ghost"
          size="sm"
          className='flex items-center space-x-1 hover:text-white text-symphony-light/80 hover:bg-symphony-primary/20'
        >
          <Terminal className='w-3 h-3' />
          <Text>{terminalVisible ? "Hide Terminal" : "Show Terminal"}</Text>
        </Button>

        {collaborators.length > 0 && (
          <Flex align="center" gap={1} className='text-symphony-light/80'>
            <Users className='w-3 h-3' />
            <Text>{collaborators.length}</Text>
          </Flex>
        )}

        <Flex align="center" gap={1} className={isOnline ? "text-symphony-emerald" : "text-symphony-rose"}>
          <Zap className='w-3 h-3' />
          <Text>{isOnline ? "Online" : "Offline"}</Text>
        </Flex>

        <Text className='text-symphony-light/60 text-xs'>
          {time}
        </Text>
      </Flex>
    </Flex>
  );
}
