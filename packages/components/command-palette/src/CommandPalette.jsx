import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
  Flex,
  Box,
  Text,
  Code,
} from 'ui';

export default function CommandPalette({ 
  isOpen = false,
  onOpenChange,
  commands = [],
  placeholder = "Search or jump to... (⌘K)",
  emptyMessage = "No results found.",
  onCommandSelect,
  className = ''
}) {
  const [search, setSearch] = useState('');

  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange?.(!isOpen);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isOpen, onOpenChange]);

  const handleSelect = (command) => {
    onCommandSelect?.(command);
    onOpenChange?.(false);
    setSearch('');
  };

  // Group commands by category
  const groupedCommands = commands.reduce((acc, cmd) => {
    const category = cmd.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(cmd);
    return acc;
  }, {});

  return (
    <CommandDialog open={isOpen} onOpenChange={onOpenChange}>
      <Command className="rounded-lg border border-border-default shadow-md bg-bg-secondary">
        <CommandInput 
          placeholder={placeholder}
          value={search}
          onValueChange={setSearch}
          className="border-none focus:ring-0 text-text-primary placeholder:text-text-tertiary"
        />
        <CommandList className="max-h-[400px]">
          <CommandEmpty className="py-6 text-center text-sm text-text-tertiary">
            {emptyMessage}
          </CommandEmpty>
          
          {Object.entries(groupedCommands).map(([category, items], index) => (
            <React.Fragment key={category}>
              {index > 0 && <CommandSeparator className="bg-border-subtle" />}
              <CommandGroup 
                heading={category}
                className="text-text-secondary [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-text-tertiary"
              >
                {items.map((command) => (
                  <CommandItem
                    key={command.id}
                    value={command.label}
                    onSelect={() => handleSelect(command)}
                    className="flex items-center space-x-3 px-2 py-2 cursor-pointer rounded aria-selected:bg-symphony-primary/10 aria-selected:text-symphony-primary text-text-primary hover:bg-bg-tertiary"
                  >
                    {command.icon && (
                      <command.icon className="w-4 h-4 flex-shrink-0" />
                    )}
                    <Box className="flex-1 min-w-0">
                      <Flex align="center" justify="between">
                        <Text className="truncate">{command.label}</Text>
                        {command.shortcut && (
                          <Code className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border-default bg-bg-tertiary px-1.5 text-[10px] font-medium text-text-tertiary">
                            {command.shortcut}
                          </Code>
                        )}
                      </Flex>
                      {command.description && (
                        <Text size="xs" className="text-text-tertiary truncate mt-0.5">
                          {command.description}
                        </Text>
                      )}
                    </Box>
                  </CommandItem>
                ))}
              </CommandGroup>
            </React.Fragment>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
