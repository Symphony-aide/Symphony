import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

// Mock action function for Storybook
const action = (name: string) => (...args: any[]) => {
  console.log(`${name}:`, ...args);
};

// Define types for our simplified component
interface FileType {
  name: string;
  content: string;
}

interface ThemeSettings {
  theme: string;
  fontSize: number;
  fontFamily: string;
}

interface GlyphMarginSettings {
  enabled: boolean;
}

interface EditorPanelProps {
  files: FileType[];
  activeFileName?: string;
  openTabs: string[];
  modifiedTabs: string[];
  themeSettings: ThemeSettings;
  glyphMarginSettings: GlyphMarginSettings;
  terminalVisible: boolean;
  onSelectFile?: (fileName: string) => void;
  onChange?: (content: string) => void;
  onCloseTab?: (fileName: string) => void;
}

// Create a mock SyntaxHighlighter to avoid dependency issues
const MockSyntaxHighlighter: React.FC<{
  code: string;
  language: string;
  theme: string;
  fileName: string;
  showLineNumbers: boolean;
  className?: string;
}> = ({ code, language, theme, fileName, showLineNumbers, className }) => (
  <div className={className} style={{ 
    backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
    color: theme === 'dark' ? '#d4d4d4' : '#000000',
    padding: '16px',
    fontFamily: 'monospace',
    fontSize: '14px',
    overflow: 'auto',
    height: '100%'
  }}>
    <div style={{ marginBottom: '8px', fontSize: '12px', opacity: 0.7 }}>
      {fileName} ({language})
    </div>
    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
      {code}
    </pre>
  </div>
);

// Create a simplified EditorPanel that works without all dependencies
const SimpleEditorPanel: React.FC<EditorPanelProps> = ({ 
  files = [], 
  activeFileName, 
  openTabs = [], 
  modifiedTabs = [], 
  themeSettings = { theme: 'vs-dark', fontSize: 14, fontFamily: 'Consolas, monospace' },
  glyphMarginSettings = { enabled: true },
  terminalVisible = false,
  onSelectFile,
  onChange,
  onCloseTab
}) => {
  const [viewMode, setViewMode] = React.useState<'editor' | 'preview'>('editor');
  const [selectedFile, setSelectedFile] = React.useState<string | undefined>(activeFileName);
  
  const activeFile = files.find(f => f.name === selectedFile) || files.find(f => f.name === activeFileName);
  
  const handleFileSelect = (fileName: string) => {
    setSelectedFile(fileName);
    onSelectFile?.(fileName);
  };
  
  const handleContentChange = (content: string) => {
    onChange?.(content);
  };
  
  // Detect language from file extension
  const getLanguage = (fileName?: string): string => {
    if (!fileName) return 'plaintext';
    const ext = fileName.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'tsx': 'typescript',
      'py': 'python', 'css': 'css', 'html': 'html', 'json': 'json', 'md': 'markdown'
    };
    return langMap[ext || ''] || 'plaintext';
  };
  
  const language = getLanguage(activeFile?.name);
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      width: '100%', 
      padding: '8px', 
      backgroundColor: '#1e1e1e', 
      borderRadius: '8px', 
      border: '1px solid #444',
      color: 'white',
      fontFamily: 'monospace'
    }}>
      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        backgroundColor: '#2d2d30', 
        borderRadius: '4px 4px 0 0', 
        borderBottom: '1px solid #444' 
      }}>
        {openTabs.map(fileName => {
          const isModified = modifiedTabs.includes(fileName);
          const isActive = fileName === selectedFile;
          
          return (
            <div key={fileName} style={{ display: 'flex', alignItems: 'center' }}>
              <button
                onClick={() => handleFileSelect(fileName)}
                style={{
                  padding: '8px 12px',
                  fontSize: '14px',
                  backgroundColor: isActive ? '#007acc' : 'transparent',
                  color: isActive ? 'white' : '#cccccc',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '4px 4px 0 0'
                }}
              >
                {fileName}{isModified ? ' •' : ''}
              </button>
              {openTabs.length > 1 && (
                <button
                  onClick={() => onCloseTab?.(fileName)}
                  style={{
                    marginLeft: '4px',
                    padding: '2px 6px',
                    fontSize: '12px',
                    backgroundColor: 'transparent',
                    color: '#cccccc',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Language indicator and view toggle */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '4px 12px', 
        backgroundColor: '#2d2d30', 
        borderBottom: '1px solid #444',
        fontSize: '12px',
        color: '#cccccc'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>{language.charAt(0).toUpperCase() + language.slice(1)}</span>
          
          {/* View Mode Toggle */}
          <div style={{ display: 'flex', gap: '4px', backgroundColor: '#444', borderRadius: '4px', padding: '2px' }}>
            <button
              onClick={() => setViewMode('editor')}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                backgroundColor: viewMode === 'editor' ? '#007acc' : 'transparent',
                color: 'white',
                border: 'none',
                borderRadius: '2px',
                cursor: 'pointer'
              }}
            >
              ✏️ Edit
            </button>
            <button
              onClick={() => setViewMode('preview')}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                backgroundColor: viewMode === 'preview' ? '#007acc' : 'transparent',
                color: 'white',
                border: 'none',
                borderRadius: '2px',
                cursor: 'pointer'
              }}
            >
              👁️ Preview
            </button>
          </div>
        </div>
        
        <span>{activeFile?.content?.split('\n').length || 0} lines</span>
      </div>
      
      {/* Editor/Preview content */}
      <div style={{ flexGrow: 1, backgroundColor: '#1e1e1e', overflow: 'hidden' }}>
        {viewMode === 'editor' ? (
          <textarea
            value={activeFile?.content || ''}
            onChange={(e) => handleContentChange(e.target.value)}
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#1e1e1e',
              color: '#d4d4d4',
              border: 'none',
              outline: 'none',
              padding: '16px',
              fontFamily: themeSettings.fontFamily || 'Consolas, monospace',
              fontSize: `${themeSettings.fontSize || 14}px`,
              lineHeight: '1.5',
              resize: 'none'
            }}
            placeholder="Start typing..."
          />
        ) : (
          <MockSyntaxHighlighter
            code={activeFile?.content || ''}
            language={language}
            theme={themeSettings.theme === 'vs-light' ? 'light' : 'dark'}
            fileName={activeFile?.name || ''}
            showLineNumbers={true}
            className="w-full h-full"
          />
        )}
      </div>
      
      {/* Status bar */}
      <div style={{ 
        backgroundColor: '#007acc', 
        padding: '4px 12px', 
        fontSize: '12px', 
        color: 'white',
        borderTop: '1px solid #444' 
      }}>
        {activeFile ? `${activeFile.name} • ${language} • ${themeSettings.theme}` : 'No file selected'}
      </div>
    </div>
  );
};

// Sample files for testing EditorPanel
const sampleFiles: FileType[] = [
  {
    name: 'App.jsx',
    content: `import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('Hello World!');

  useEffect(() => {
    document.title = \`Count: \${count}\`;
  }, [count]);

  const handleIncrement = () => {
    setCount(prev => prev + 1);
  };

  const handleReset = () => {
    setCount(0);
    setMessage('Reset!');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>{message}</h1>
        <p>Current count: {count}</p>
        <div>
          <button onClick={handleIncrement}>
            Increment
          </button>
          <button onClick={handleReset}>
            Reset
          </button>
        </div>
      </header>
    </div>
  );
}

export default App;`
  },
  {
    name: 'utils.py',
    content: `"""
Utility functions for data processing and analysis.
"""

import json
import datetime
from typing import List, Dict, Optional, Union

class DataProcessor:
    """A class for processing and analyzing data."""
    
    def __init__(self, config: Dict = None):
        self.config = config or {}
        self.processed_data = []
        
    def load_data(self, file_path: str) -> List[Dict]:
        """Load data from a JSON file."""
        try:
            with open(file_path, 'r') as file:
                data = json.load(file)
                return data
        except FileNotFoundError:
            print(f"File {file_path} not found")
            return []
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON: {e}")
            return []
    
    def process_records(self, records: List[Dict]) -> List[Dict]:
        """Process a list of records with transformations."""
        processed = []
        
        for record in records:
            # Add timestamp
            record['processed_at'] = datetime.datetime.now().isoformat()
            
            # Validate required fields
            if self._validate_record(record):
                processed.append(record)
            else:
                print(f"Invalid record: {record}")
        
        self.processed_data = processed
        return processed
    
    def _validate_record(self, record: Dict) -> bool:
        """Validate a single record."""
        required_fields = self.config.get('required_fields', [])
        return all(field in record for field in required_fields)
    
    def get_statistics(self) -> Dict:
        """Get basic statistics about processed data."""
        if not self.processed_data:
            return {'count': 0, 'message': 'No data processed'}
        
        return {
            'count': len(self.processed_data),
            'first_processed': self.processed_data[0].get('processed_at'),
            'last_processed': self.processed_data[-1].get('processed_at')
        }

def format_timestamp(timestamp: str) -> str:
    """Format ISO timestamp to readable string."""
    try:
        dt = datetime.datetime.fromisoformat(timestamp)
        return dt.strftime("%Y-%m-%d %H:%M:%S")
    except ValueError:
        return timestamp
`
  },
  {
    name: 'styles.css',
    content: `/* Global Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f5f5f5;
  color: #333;
}

/* App Container */
.App {
  text-align: center;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.App-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
  color: white;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* Typography */
h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  font-weight: 700;
}

p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

/* Buttons */
button {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 12px 24px;
  margin: 0 8px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

button:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
`
  },
  {
    name: 'config.json',
    content: `{
  "app": {
    "name": "Symphony Code Editor",
    "version": "1.0.0",
    "description": "A powerful code editor with advanced features"
  },
  "editor": {
    "themes": ["vs-dark", "vs-light", "high-contrast"],
    "defaultTheme": "vs-dark",
    "fontSize": 14,
    "fontFamily": "Fira Code, monospace",
    "tabSize": 2,
    "insertSpaces": true,
    "wordWrap": "on",
    "lineNumbers": "on",
    "minimap": {
      "enabled": true,
      "side": "right"
    }
  },
  "features": {
    "autoSave": {
      "enabled": false,
      "interval": 2000
    },
    "codeCompletion": false,
    "syntaxHighlighting": false,
    "errorChecking": false,
    "formatting": false,
    "folding": false,
    "bracketMatching": false
  }
}`
  }
];

const meta: Meta<typeof SimpleEditorPanel> = {
  title: 'Components/EditorPanel',
  component: SimpleEditorPanel,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'EditorPanel - A Monaco Editor-based code editing component with enhanced features including syntax highlighting, theme management, language detection, and dual view modes (editor/preview).'
      }
    }
  },
  argTypes: {
    files: {
      control: 'object',
      description: 'Array of file objects with name and content properties'
    },
    activeFileName: {
      control: 'text',
      description: 'Name of the currently active/selected file'
    },
    openTabs: {
      control: 'object',
      description: 'Array of file names that are currently open in tabs'
    },
    modifiedTabs: {
      control: 'object',
      description: 'Array of file names that have unsaved modifications'
    },
    terminalVisible: {
      control: 'boolean',
      description: 'Whether the terminal is visible (affects editor layout)'
    },
    themeSettings: {
      control: 'object',
      description: 'Theme configuration object with theme, fontSize, and fontFamily'
    },
    glyphMarginSettings: {
      control: 'object',
      description: 'Glyph margin settings for breakpoints and annotations'
    },
    // Actions
    onSelectFile: { action: 'file-selected' },
    onChange: { action: 'content-changed' },
    onCloseTab: { action: 'tab-closed' },
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof SimpleEditorPanel>;

export const Default: Story = {
  args: {
    files: [sampleFiles[0]],
    activeFileName: 'App.jsx',
    openTabs: ['App.jsx'],
    modifiedTabs: [],
    terminalVisible: false,
    themeSettings: { theme: 'vs-dark', fontSize: 14, fontFamily: 'Fira Code, monospace' },
    glyphMarginSettings: { enabled: true },
    onSelectFile: action('file-selected'),
    onChange: action('content-changed'),
    onCloseTab: action('tab-closed'),
  },
};

export const MultipleFiles: Story = {
  args: {
    files: sampleFiles,
    activeFileName: 'utils.py',
    openTabs: ['App.jsx', 'utils.py', 'styles.css'],
    modifiedTabs: ['App.jsx'],
    terminalVisible: false,
    themeSettings: { theme: 'vs-dark', fontSize: 14, fontFamily: 'Fira Code, monospace' },
    glyphMarginSettings: { enabled: true },
    onSelectFile: action('file-selected'),
    onChange: action('content-changed'),
    onCloseTab: action('tab-closed'),
  },
};

export const LightTheme: Story = {
  args: {
    files: [sampleFiles[2]],
    activeFileName: 'styles.css',
    openTabs: ['styles.css'],
    modifiedTabs: [],
    terminalVisible: false,
    themeSettings: { theme: 'vs-light', fontSize: 16, fontFamily: 'Monaco, monospace' },
    glyphMarginSettings: { enabled: true },
    onSelectFile: action('file-selected'),
    onChange: action('content-changed'),
    onCloseTab: action('tab-closed'),
  },
};

export const HighContrast: Story = {
  args: {
    files: [sampleFiles[3]],
    activeFileName: 'config.json',
    openTabs: ['config.json'],
    modifiedTabs: [],
    terminalVisible: false,
    themeSettings: { theme: 'hc-black', fontSize: 15, fontFamily: 'Consolas, monospace' },
    glyphMarginSettings: { enabled: true },
    onSelectFile: action('file-selected'),
    onChange: action('content-changed'),
    onCloseTab: action('tab-closed'),
  },
};

export const SmallFont: Story = {
  args: {
    files: [sampleFiles[1]],
    activeFileName: 'utils.py',
    openTabs: ['utils.py'],
    modifiedTabs: [],
    terminalVisible: false,
    themeSettings: { theme: 'vs-dark', fontSize: 12, fontFamily: 'Monaco, monospace' },
    glyphMarginSettings: { enabled: false },
    onSelectFile: action('file-selected'),
    onChange: action('content-changed'),
    onCloseTab: action('tab-closed'),
  },
};

export const LargeFont: Story = {
  args: {
    files: [sampleFiles[0]],
    activeFileName: 'App.jsx',
    openTabs: ['App.jsx'],
    modifiedTabs: [],
    terminalVisible: false,
    themeSettings: { theme: 'vs-light', fontSize: 18, fontFamily: 'Source Code Pro, monospace' },
    glyphMarginSettings: { enabled: true },
    onSelectFile: action('file-selected'),
    onChange: action('content-changed'),
    onCloseTab: action('tab-closed'),
  },
};

export const WithModifiedTabs: Story = {
  args: {
    files: sampleFiles,
    activeFileName: 'App.jsx',
    openTabs: ['App.jsx', 'utils.py', 'styles.css', 'config.json'],
    modifiedTabs: ['App.jsx', 'utils.py', 'styles.css'],
    terminalVisible: false,
    themeSettings: { theme: 'vs-dark', fontSize: 14, fontFamily: 'Fira Code, monospace' },
    glyphMarginSettings: { enabled: true },
    onSelectFile: action('file-selected'),
    onChange: action('content-changed'),
    onCloseTab: action('tab-closed'),
  },
};

export const TerminalVisible: Story = {
  args: {
    files: [sampleFiles[0]],
    activeFileName: 'App.jsx',
    openTabs: ['App.jsx'],
    modifiedTabs: [],
    terminalVisible: true,
    themeSettings: { theme: 'vs-dark', fontSize: 14, fontFamily: 'Fira Code, monospace' },
    glyphMarginSettings: { enabled: true },
    onSelectFile: action('file-selected'),
    onChange: action('content-changed'),
    onCloseTab: action('tab-closed'),
  },
};

export const NoGlyphMargin: Story = {
  args: {
    files: [sampleFiles[1]],
    activeFileName: 'utils.py',
    openTabs: ['utils.py'],
    modifiedTabs: [],
    terminalVisible: false,
    themeSettings: { theme: 'vs-dark', fontSize: 14, fontFamily: 'Fira Code, monospace' },
    glyphMarginSettings: { enabled: false },
    onSelectFile: action('file-selected'),
    onChange: action('content-changed'),
    onCloseTab: action('tab-closed'),
  },
};

export const CustomFontFamily: Story = {
  args: {
    files: [sampleFiles[2]],
    activeFileName: 'styles.css',
    openTabs: ['styles.css'],
    modifiedTabs: [],
    terminalVisible: false,
    themeSettings: { theme: 'vs-dark', fontSize: 14, fontFamily: 'JetBrains Mono, monospace' },
    glyphMarginSettings: { enabled: true },
    onSelectFile: action('file-selected'),
    onChange: action('content-changed'),
    onCloseTab: action('tab-closed'),
  },
};
