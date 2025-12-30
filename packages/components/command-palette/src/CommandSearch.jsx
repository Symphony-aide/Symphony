import React from 'react';
import { Search } from 'lucide-react';
import { Input, Box } from 'ui';

export default function CommandSearch({ 
  onFocus,
  placeholder = "Search or jump to... (⌘K)",
  className = ''
}) {
  return (
    <Box className={`relative w-96 ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
      <Input
        type="search"
        placeholder={placeholder}
        onFocus={onFocus}
        readOnly
        className="w-full bg-bg-tertiary border-border-default rounded-lg py-2 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-symphony-primary/50 focus:border-symphony-primary cursor-pointer"
      />
    </Box>
  );
}
