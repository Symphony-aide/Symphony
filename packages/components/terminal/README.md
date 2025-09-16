# @symphony/terminal

A terminal component built with xterm.js that provides a full-featured terminal experience with command history and autocomplete.

## Overview

This package provides a terminal component for the Symphony application, featuring a complete terminal emulator with command execution, history management, and customizable settings.

## Exported Components

### `Terminal`
The main terminal component that provides a full terminal experience.

**Features:**
- Full terminal emulator using xterm.js
- Command history with arrow key navigation
- Built-in command system with autocomplete
- Fit addon for responsive terminal sizing
- Customizable terminal settings
- Dark theme integration

**Usage:**
```tsx
import { Terminal } from "@symphony/terminal";

<Terminal
  terminalSettings={terminalSettings}
/>
```

**Props:**
- `terminalSettings`: Configuration object for terminal appearance and behavior

## Built-in Commands

The terminal comes with several built-in commands:

- `help`: Display available commands
- `clear`: Clear the terminal screen
- `echo [text]`: Echo text back to the terminal
- `date`: Display current date and time

## Features

### Command History
- Navigate through command history using up/down arrow keys
- Persistent command history during session
- History index management

### Terminal Customization
- Configurable through `terminalSettings` prop
- Font size and family customization
- Color scheme configuration
- Cursor style options

### Responsive Design
- Automatic terminal resizing with fit addon
- Responsive to container size changes
- Optimal character and line calculations

## Installation

```bash
# Using pnpm
pnpm install @symphony/terminal
```

## Usage

```tsx
import { Terminal } from "@symphony/terminal";
import { useState } from "react";

const App = () => {
  const [terminalSettings, setTerminalSettings] = useState({
    fontSize: 14,
    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
    theme: {
      background: '#1e1e1e',
      foreground: '#ffffff'
    }
  });

  return (
    <div className="terminal-container" style={{ height: '400px' }}>
      <Terminal terminalSettings={terminalSettings} />
    </div>
  );
};
```

## Terminal Settings

The `terminalSettings` object can include:

```typescript
interface TerminalSettings {
  fontSize?: number;
  fontFamily?: string;
  theme?: {
    background?: string;
    foreground?: string;
    cursor?: string;
    selection?: string;
  };
  cursorBlink?: boolean;
  cursorStyle?: 'block' | 'underline' | 'bar';
  scrollback?: number;
}
```

## Extending Commands

The terminal's command system can be extended by modifying the `commandsMap` object:

```javascript
const commandsMap = {
  help: () => "Available commands: help, clear, echo, date",
  clear: (terminal) => {
    terminal.clear();
    terminal.writeln("Welcome to Terminal Commander Pro 🚀");
    terminal.write("> ");
    return "__CLEAR__";
  },
  echo: (_, args) => args.join(" "),
  date: () => new Date().toString(),
  // Add custom commands here
};
```

## Dependencies

- React
- @xterm/xterm (terminal emulator)
- @xterm/addon-fit (responsive sizing)
- xterm.js CSS styles
