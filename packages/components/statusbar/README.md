# @symphony/statusbar

A status bar component that displays current file information, language detection, save status, and system information.

## Overview

This package provides a status bar component for the Symphony application that shows essential information about the current editor state and system status.

## Exported Components

### `StatusBar`
The main status bar component that displays file and system information.

**Features:**
- Active file name display
- Language detection based on file extension
- Save status indicator with visual feedback
- Terminal visibility toggle
- Current time display
- Responsive design with dark theme

**Usage:**
```tsx
import { StatusBar } from "@symphony/statusbar";

<StatusBar
  activeFileName={activeFileName}
  saved={isSaved}
  terminalVisible={isTerminalVisible}
  onToggleTerminal={handleToggleTerminal}
/>
```

**Props:**
- `activeFileName`: Currently active file name (string)
- `saved`: Whether the current file is saved (boolean)
- `terminalVisible`: Whether the terminal is currently visible (boolean)
- `onToggleTerminal`: Callback function to toggle terminal visibility

## Language Detection

The StatusBar automatically detects and displays the programming language based on file extensions:

- `.js` → JavaScript
- `.jsx` → React (JSX)
- `.ts` → TypeScript
- `.tsx` → React (TSX)
- `.py` → Python
- `.html` → HTML
- `.css` → CSS
- `.json` → JSON
- `.md` → Markdown
- `.txt` → Plain Text

## Visual Indicators

- **Save Status**: Green checkmark for saved files, orange alert for unsaved changes
- **Terminal Toggle**: Interactive button with terminal icon
- **Language Badge**: Color-coded language indicator
- **Time Display**: Updates every minute

## Installation

```bash
# Using pnpm
pnpm install @symphony/statusbar
```

## Usage

```tsx
import { StatusBar } from "@symphony/statusbar";
import { useState } from "react";

const App = () => {
  const [activeFile, setActiveFile] = useState("index.js");
  const [isSaved, setIsSaved] = useState(true);
  const [terminalVisible, setTerminalVisible] = useState(false);

  return (
    <div className="editor-container">
      {/* Your editor content */}
      
      <StatusBar
        activeFileName={activeFile}
        saved={isSaved}
        terminalVisible={terminalVisible}
        onToggleTerminal={() => setTerminalVisible(!terminalVisible)}
      />
    </div>
  );
};
```

## Styling

The component uses Tailwind CSS classes and is designed to work with dark themes. It features:

- Dark background (`bg-gray-800`)
- Light text (`text-white`)
- Hover effects for interactive elements
- Responsive spacing and typography

## Dependencies

- React
- Lucide React (icons)
- Tailwind CSS (styling)
