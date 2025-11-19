import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

// Define types for terminal settings
interface TerminalSettings {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  lineHeight: number;
  cursorStyle: 'block' | 'bar' | 'underline';
}

interface MockTerminalProps {
  terminalSettings: TerminalSettings;
}

// Mock xterm.js for Storybook to avoid DOM issues
const MockTerminal: React.FC<MockTerminalProps> = ({ terminalSettings }) => {
  const [output, setOutput] = React.useState<string[]>(['Welcome to Terminal Commander Pro 🚀', '> ']);
  const [input, setInput] = React.useState<string>('');
  const [history, setHistory] = React.useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = React.useState<number>(-1);

  const commands: Record<string, (args?: string[]) => string> = {
    help: () => 'Available commands: help, clear, echo, date',
    clear: () => {
      setOutput(['Welcome to Terminal Commander Pro 🚀', '> ']);
      return '';
    },
    echo: (args: string[] = []) => args.join(' '),
    date: () => new Date().toString(),
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const command = input.trim();
      if (command) {
        const parts = command.split(' ');
        const base = parts[0];
        const args = parts.slice(1);
        
        let result = '';
        if (commands[base]) {
          if (base === 'clear') {
            commands[base]();
            setInput('');
            return;
          }
          result = commands[base](args);
        } else {
          result = `Command not found: ${base}`;
        }
        
        setOutput(prev => [...prev, command, result, '> ']);
        setHistory(prev => [...prev, command]);
        setHistoryIndex(history.length + 1);
      } else {
        setOutput(prev => [...prev, '', '> ']);
      }
      setInput('');
      // Mock action for Storybook
      console.log('Command executed:', command);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(history[newIndex] || '');
      } else {
        setHistoryIndex(history.length);
        setInput('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const matches = Object.keys(commands).filter(cmd => cmd.startsWith(input));
      if (matches.length === 1) {
        setInput(matches[0]);
      }
    }
  };

  return (
    <div className="bg-black rounded-lg border border-gray-700 h-[200px] w-full overflow-hidden">
      <div 
        className="p-2 h-full overflow-auto font-mono text-sm"
        style={{
          fontFamily: terminalSettings.fontFamily,
          fontSize: `${terminalSettings.fontSize}px`,
          fontWeight: terminalSettings.fontWeight,
          lineHeight: terminalSettings.lineHeight,
          color: '#ffffff',
          backgroundColor: '#1e1e1e'
        }}
      >
        <div className="whitespace-pre-wrap">
          {output.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
        <div className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-transparent border-none outline-none text-white flex-1"
            style={{
              fontFamily: terminalSettings.fontFamily,
              fontSize: `${terminalSettings.fontSize}px`,
              fontWeight: terminalSettings.fontWeight,
            }}
            placeholder="Type a command..."
            autoFocus
          />
          <span 
            className="animate-pulse"
            style={{
              display: terminalSettings.cursorStyle === 'block' ? 'inline-block' : 'inline',
              width: terminalSettings.cursorStyle === 'block' ? '8px' : '2px',
              height: '1em',
              backgroundColor: '#ffffff',
              marginLeft: '2px'
            }}
          />
        </div>
      </div>
    </div>
  );
};

// Default terminal settings
const defaultTerminalSettings: TerminalSettings = {
  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
  fontSize: 14,
  fontWeight: 'normal',
  lineHeight: 1.2,
  cursorStyle: 'block' as const
};

const meta: Meta<typeof MockTerminal> = {
  title: 'Components/Terminal',
  component: MockTerminal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Terminal - An interactive terminal component with command execution, history navigation, autocomplete, and customizable styling. Built with xterm.js and supports various terminal features like command history, tab completion, and cursor styles.'
      }
    }
  },
  argTypes: {
    terminalSettings: {
      description: 'Terminal configuration object',
      control: { type: 'object' }
    }
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof MockTerminal>;

export const Default: Story = {
  args: {
    terminalSettings: defaultTerminalSettings,
  },
};

export const CustomFont: Story = {
  args: {
    terminalSettings: {
      ...defaultTerminalSettings,
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: 16,
      fontWeight: 'bold',
    } as TerminalSettings,
  },
};

export const LargeFont: Story = {
  args: {
    terminalSettings: {
      ...defaultTerminalSettings,
      fontSize: 18,
      lineHeight: 1.4,
    } as TerminalSettings,
  },
};

export const SmallFont: Story = {
  args: {
    terminalSettings: {
      ...defaultTerminalSettings,
      fontSize: 12,
      lineHeight: 1.1,
    } as TerminalSettings,
  },
};

export const UnderlineCursor: Story = {
  args: {
    terminalSettings: {
      ...defaultTerminalSettings,
      cursorStyle: 'underline' as const,
    },
  },
};

export const BarCursor: Story = {
  args: {
    terminalSettings: {
      ...defaultTerminalSettings,
      cursorStyle: 'bar' as const,
    },
  },
};

export const BlockCursor: Story = {
  args: {
    terminalSettings: {
      ...defaultTerminalSettings,
      cursorStyle: 'block' as const,
    },
  },
};

export const CodeFont: Story = {
  args: {
    terminalSettings: {
      ...defaultTerminalSettings,
      fontFamily: '"Fira Code", "JetBrains Mono", monospace',
      fontSize: 15,
      fontWeight: '500',
      lineHeight: 1.3,
    } as TerminalSettings,
  },
};

export const RetroStyle: Story = {
  args: {
    terminalSettings: {
      ...defaultTerminalSettings,
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: 14,
      fontWeight: 'bold',
      lineHeight: 1.0,
      cursorStyle: 'block' as const,
    } as TerminalSettings,
  },
};

export const ModernStyle: Story = {
  args: {
    terminalSettings: {
      ...defaultTerminalSettings,
      fontFamily: '"SF Mono", "Monaco", "Inconsolata", monospace',
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 1.4,
      cursorStyle: 'bar' as const,
    } as TerminalSettings,
  },
};

export const CompactView: Story = {
  args: {
    terminalSettings: {
      ...defaultTerminalSettings,
      fontSize: 11,
      lineHeight: 1.0,
      fontWeight: 'normal',
    } as TerminalSettings,
  },
};

export const AccessibleView: Story = {
  args: {
    terminalSettings: {
      ...defaultTerminalSettings,
      fontSize: 20,
      lineHeight: 1.6,
      fontWeight: 'bold',
      cursorStyle: 'block' as const,
    } as TerminalSettings,
  },
};
