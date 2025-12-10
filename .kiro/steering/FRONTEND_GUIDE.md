# Symphony Frontend Development Guide

This guide covers development practices for Symphony's React-based frontend system, following the **Page-Features-Components** architecture pattern within a monorepo structure.

## Architecture Overview

Symphony's frontend implements a **layered component architecture** with clear separation of concerns:

### Page-Features-Components Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                        PAGES LAYER                          │
│                    (apps/web/src/)                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  FEATURES LAYER                     │   │
│  │                 [To be implemented]                 │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │              COMPONENTS LAYER               │   │   │
│  │  │           (packages/components/)            │   │   │
│  │  │  ┌─────────────────────────────────────┐   │   │   │
│  │  │  │            UI LAYER                 │   │   │   │
│  │  │  │        (packages/ui/)               │   │   │   │
│  │  │  │     Primitive Components            │   │   │   │
│  │  │  └─────────────────────────────────────┘   │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Layer Definitions

### 1. UI Layer (packages/ui/) - Primitive Components
**Purpose**: Foundational design system components
**Technology**: Shadcn/ui-based component library with Tailwind CSS

```typescript
// Example: Button primitive component
/// Button component with comprehensive styling variants
///
/// Provides consistent button styling across Symphony IDE with support for
/// multiple variants, sizes, and states. Built on Radix UI primitives.
///
/// # Variants
///
/// - `default`: Standard button appearance
/// - `destructive`: For dangerous actions (delete, remove)
/// - `outline`: Outlined button style
/// - `secondary`: Secondary action button
/// - `ghost`: Minimal button without background
/// - `link`: Text-only link-style button
///
/// # Examples
///
/// ```tsx
/// import { Button } from "@symphony/ui";
///
/// // Standard button
/// <Button onClick={handleClick}>Save File</Button>
///
/// // Destructive action
/// <Button variant="destructive" onClick={handleDelete}>
///   Delete Project
/// </Button>
///
/// // Loading state
/// <Button disabled loading>
///   Processing...
/// </Button>
/// ```
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", loading, asChild = false, ...props }, ref) => {
    // Implementation with proper accessibility and styling
  }
);
```

**Standards for UI Components:**
- All components must be accessible (ARIA compliant)
- Use Radix UI primitives as foundation
- Comprehensive TypeScript interfaces
- Support for `asChild` pattern for composition
- Consistent naming: PascalCase for components
- Export from `packages/ui/index.ts`

### 2. Components Layer (packages/components/) - Block Components
**Purpose**: Specialized IDE functionality components
**Technology**: React with TypeScript, Monaco Editor, xterm.js

Current specialized components:
- **code-editor**: Monaco Editor integration with Symphony
- **terminal**: xterm.js terminal with command handling
- **file-explorer**: File system navigation with virtual FS
- **syntax-highlighting**: Language-aware highlighting
- **commands**: Command palette and execution system
- **settings**: Configuration UI components
- **statusbar**: IDE status information
- **outlineview**: Code structure navigation

```typescript
// Example: Code Editor component
/// High-performance code editor component for Symphony IDE
///
/// Integrates Monaco Editor with Symphony's orchestration system,
/// providing intelligent code editing with AI assistance.
///
/// # Features
///
/// - Multi-language syntax highlighting
/// - Intelligent autocomplete with AI suggestions
/// - Real-time error detection and diagnostics
/// - Command integration for undo/redo
/// - Theme synchronization with Symphony
///
/// # Performance
///
/// - Lazy loading of language definitions
/// - Virtualized rendering for large files
/// - Debounced change events to prevent excessive updates
///
/// # Examples
///
/// ```tsx
/// import { EditorPanel } from "@symphony/code-editor";
///
/// <EditorPanel
///   files={files}
///   activeFileName={activeFile}
///   onSelectFile={handleFileSelect}
///   onChange={handleContentChange}
///   themeSettings={{ theme: "vs-dark", fontSize: 14 }}
///   glyphMarginSettings={{ enabled: true }}
/// />
/// ```
export interface EditorPanelProps {
  files: Record<string, FileContent>;
  activeFileName: string | null;
  onSelectFile: (fileName: string) => void;
  openTabs: string[];
  onChange: (fileName: string, content: string) => void;
  terminalVisible: boolean;
  onCloseTab: (fileName: string) => void;
  editorRef: React.RefObject<monaco.editor.IStandaloneCodeEditor>;
  glyphMarginSettings: GlyphMarginSettings;
  modifiedTabs?: string[];
  themeSettings?: ThemeSettings;
  onLanguageDetected?: (language: string) => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  files,
  activeFileName,
  onSelectFile,
  // ... other props
}) => {
  // Component implementation with proper error boundaries
  // and performance optimizations
};
```

**Standards for Block Components:**
- Each component is a separate package with own `package.json`
- Comprehensive TypeScript interfaces for all props
- Integration with Symphony's command system
- Performance optimizations (memoization, virtualization)
- Error boundaries for fault isolation
- Storybook stories for component documentation

### 3. Features Layer [To be implemented]
**Purpose**: Business logic and feature orchestration
**Technology**: React with custom hooks and state management

```typescript
// Example: File Management feature
/// File management feature orchestrating file operations
///
/// Combines file-explorer, code-editor, and command components
/// to provide comprehensive file management capabilities.
///
/// # Responsibilities
///
/// - File CRUD operations with undo/redo support
/// - Integration with Symphony's IPC for file system access
/// - State synchronization between components
/// - Error handling and user feedback
///
/// # Examples
///
/// ```tsx
/// import { FileManagementFeature } from "@symphony/features";
///
/// <FileManagementFeature
///   workspace={currentWorkspace}
///   onFileChange={handleFileChange}
///   commandManager={commandManager}
/// />
/// ```
export interface FileManagementFeatureProps {
  workspace: WorkspaceConfig;
  onFileChange: (fileName: string, content: string) => void;
  commandManager: CommandManager;
  client: Client;
}

export const FileManagementFeature: React.FC<FileManagementFeatureProps> = ({
  workspace,
  onFileChange,
  commandManager,
  client,
}) => {
  // Feature implementation combining multiple components
  // with shared state and business logic
};
```

### 4. Pages Layer (apps/web/src/) - Application Pages
**Purpose**: Top-level application structure and routing
**Technology**: React with Jotai for state management

```typescript
// Example: Main IDE page
/// Main IDE application page
///
/// Orchestrates all features and provides the primary user interface
/// for Symphony's development environment.
///
/// # Architecture
///
/// - Uses Jotai atoms for global state management
/// - Integrates with Symphony's IPC client for backend communication
/// - Manages layout and feature composition
/// - Handles global keyboard shortcuts and commands
///
/// # State Management
///
/// - File system state via `filesAtom`
/// - Editor state via `editorStateAtom`
/// - Terminal state via `terminalAtom`
/// - Settings state via `settingsAtom`
///
/// # Examples
///
/// ```tsx
/// import { IDEPage } from "./pages/IDEPage";
///
/// <IDEPage
///   client={symphonyClient}
///   initialWorkspace={workspace}
/// />
/// ```
export interface IDEPageProps {
  client: Client;
  initialWorkspace?: WorkspaceConfig;
}

export const IDEPage: React.FC<IDEPageProps> = ({
  client,
  initialWorkspace,
}) => {
  // Page implementation with feature composition
  // and global state management
};
```

## State Management Architecture

### Jotai Atomic State Management

Symphony uses **Jotai** for atomic state management, providing fine-grained reactivity:

```typescript
// atoms/fileSystemAtoms.ts
/// File system state atoms for Symphony IDE
///
/// Manages file content, active files, and file operations state
/// using Jotai's atomic state management pattern.

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

/// Current files in the workspace
///
/// Maps file paths to their content and metadata.
/// Persisted to localStorage for session recovery.
export const filesAtom = atomWithStorage<Record<string, FileContent>>(
  'symphony-files',
  {}
);

/// Currently active file name
///
/// Tracks which file is currently being edited.
/// Used for editor focus and tab highlighting.
export const activeFileNameAtom = atom<string | null>(null);

/// Open editor tabs
///
/// Array of file names that have open editor tabs.
/// Maintains tab order and state.
export const openTabsAtom = atom<string[]>([]);

/// Modified files tracking
///
/// Files that have unsaved changes, used for
/// tab indicators and save prompts.
export const modifiedTabsAtom = atom<string[]>([]);

/// Derived atom for current file content
///
/// Automatically updates when active file changes.
/// Returns null if no file is active.
export const currentFileContentAtom = atom(
  (get) => {
    const files = get(filesAtom);
    const activeFileName = get(activeFileNameAtom);
    return activeFileName ? files[activeFileName] : null;
  }
);
```

### IPC Client Integration

```typescript
// hooks/useSymphonyClient.ts
/// Symphony IPC client integration hook
///
/// Provides typed access to Symphony's backend services
/// with automatic connection management and error handling.

import { useEffect, useState } from 'react';
import { Client } from '../services/clients/client.types';
import { HTTPClient } from '../services/clients/http';
import { TauriClient } from '../services/clients/tauri';

/// Hook for Symphony client integration
///
/// Automatically detects environment (web/desktop) and
/// initializes appropriate client implementation.
///
/// # Returns
///
/// - `client`: Typed client instance for backend communication
/// - `connected`: Connection status
/// - `error`: Connection error if any
///
/// # Examples
///
/// ```tsx
/// const { client, connected, error } = useSymphonyClient();
///
/// useEffect(() => {
///   if (connected) {
///     client.get_state_by_id().then(handleState);
///   }
/// }, [connected]);
/// ```
export const useSymphonyClient = () => {
  const [client, setClient] = useState<Client | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Initialize appropriate client based on environment
    const initializeClient = async () => {
      try {
        const clientInstance = window.__TAURI__ 
          ? new TauriClient(config)
          : new HTTPClient(config);
        
        await clientInstance.whenConnected();
        setClient(clientInstance);
        setConnected(true);
      } catch (err) {
        setError(err as Error);
      }
    };

    initializeClient();
  }, []);

  return { client, connected, error };
};
```

## Component Development Standards

### TypeScript Interface Design

```typescript
// types/components.ts
/// Comprehensive type definitions for Symphony components
///
/// Provides type safety and IntelliSense support across
/// the entire component hierarchy.

/// Base props for all Symphony components
export interface SymphonyComponentProps {
  /// CSS class name for styling customization
  className?: string;
  
  /// Test identifier for automated testing
  'data-testid'?: string;
  
  /// Accessibility label for screen readers
  'aria-label'?: string;
}

/// File content representation
export interface FileContent {
  /// File content as string
  content: string;
  
  /// Detected or explicit language
  language?: string;
  
  /// File modification timestamp
  lastModified: number;
  
  /// File size in bytes
  size: number;
  
  /// Whether file has unsaved changes
  isDirty: boolean;
}

/// Theme configuration
export interface ThemeSettings {
  /// Monaco editor theme name
  theme: 'vs-dark' | 'vs-light' | 'hc-black' | string;
  
  /// Editor font size
  fontSize: number;
  
  /// Editor font family
  fontFamily?: string;
  
  /// Line height multiplier
  lineHeight?: number;
  
  /// Custom theme overrides
  customTheme?: Partial<monaco.editor.IStandaloneThemeData>;
}
```

### Performance Optimization Patterns

```typescript
// hooks/useOptimizedCallback.ts
/// Performance-optimized callback hook
///
/// Provides stable callback references with dependency tracking
/// to prevent unnecessary re-renders in child components.

import { useCallback, useRef } from 'react';

/// Creates a stable callback that only updates when dependencies change
///
/// Unlike useCallback, this hook uses deep comparison for dependencies
/// and provides better performance for complex dependency arrays.
///
/// # Examples
///
/// ```tsx
/// const handleFileChange = useOptimizedCallback(
///   (fileName: string, content: string) => {
///     updateFile(fileName, content);
///     trackChange(fileName);
///   },
///   [updateFile, trackChange]
/// );
/// ```
export const useOptimizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  const callbackRef = useRef(callback);
  const depsRef = useRef(deps);
  
  // Deep comparison of dependencies
  const depsChanged = !deps.every((dep, index) => 
    Object.is(dep, depsRef.current[index])
  );
  
  if (depsChanged) {
    callbackRef.current = callback;
    depsRef.current = deps;
  }
  
  return useCallback(callbackRef.current, deps);
};
```

### Error Boundary Implementation

```typescript
// components/ErrorBoundary.tsx
/// Error boundary component for fault isolation
///
/// Catches JavaScript errors in component trees and displays
/// fallback UI instead of crashing the entire application.

import React from 'react';
import { Button } from '@symphony/ui';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/// Error boundary for Symphony components
///
/// Provides graceful error handling and recovery options
/// for component failures without crashing the entire IDE.
///
/// # Features
///
/// - Automatic error capture and logging
/// - Customizable fallback UI
/// - Error recovery mechanisms
/// - Integration with Symphony's logging system
///
/// # Examples
///
/// ```tsx
/// <ErrorBoundary
///   fallback={CustomErrorFallback}
///   onError={logErrorToSymphony}
/// >
///   <CodeEditor />
/// </ErrorBoundary>
/// ```
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to Symphony's logging system
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      
      if (FallbackComponent && this.state.error) {
        return <FallbackComponent error={this.state.error} retry={this.handleRetry} />;
      }

      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.stack}</pre>
          </details>
          <Button onClick={this.handleRetry}>Try again</Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Testing Standards

### Component Testing with React Testing Library

```typescript
// __tests__/EditorPanel.test.tsx
/// Comprehensive tests for EditorPanel component
///
/// Tests component behavior, user interactions, and integration
/// with Symphony's command system and IPC client.

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditorPanel } from '../EditorPanel';
import { CommandProvider } from '@symphony/commands';
import { mockClient } from '../__mocks__/client';

describe('EditorPanel', () => {
  const defaultProps = {
    files: {
      'test.ts': {
        content: 'console.log("Hello, World!");',
        language: 'typescript',
        lastModified: Date.now(),
        size: 32,
        isDirty: false,
      },
    },
    activeFileName: 'test.ts',
    onSelectFile: jest.fn(),
    openTabs: ['test.ts'],
    onChange: jest.fn(),
    terminalVisible: false,
    onCloseTab: jest.fn(),
    editorRef: { current: null },
    glyphMarginSettings: { enabled: true },
  };

  const renderWithProviders = (props = {}) => {
    return render(
      <CommandProvider>
        <EditorPanel {...defaultProps} {...props} />
      </CommandProvider>
    );
  };

  it('renders editor with file content', async () => {
    renderWithProviders();
    
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
    
    expect(screen.getByDisplayValue(/Hello, World/)).toBeInTheDocument();
  });

  it('handles file content changes', async () => {
    const onChange = jest.fn();
    renderWithProviders({ onChange });
    
    const editor = screen.getByRole('textbox');
    await userEvent.type(editor, '\nconsole.log("Modified");');
    
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        'test.ts',
        expect.stringContaining('Modified')
      );
    });
  });

  it('integrates with command system for undo/redo', async () => {
    renderWithProviders();
    
    // Simulate text change
    const editor = screen.getByRole('textbox');
    await userEvent.type(editor, 'new content');
    
    // Trigger undo command
    fireEvent.keyDown(editor, { key: 'z', ctrlKey: true });
    
    await waitFor(() => {
      expect(screen.queryByDisplayValue(/new content/)).not.toBeInTheDocument();
    });
  });
});
```

### Integration Testing

```typescript
// __tests__/integration/FileManagement.test.tsx
/// Integration tests for file management workflow
///
/// Tests the complete file management flow from UI interactions
/// to backend communication and state updates.

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileManagementFeature } from '../features/FileManagementFeature';
import { createMockClient } from '../__mocks__/client';
import { Provider } from 'jotai';

describe('File Management Integration', () => {
  let mockClient: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    mockClient = createMockClient();
  });

  it('creates new file and updates editor', async () => {
    render(
      <Provider>
        <FileManagementFeature client={mockClient} />
      </Provider>
    );

    // Create new file
    const newFileButton = screen.getByRole('button', { name: /new file/i });
    await userEvent.click(newFileButton);

    const fileNameInput = screen.getByLabelText(/file name/i);
    await userEvent.type(fileNameInput, 'newFile.ts');
    
    const createButton = screen.getByRole('button', { name: /create/i });
    await userEvent.click(createButton);

    // Verify file appears in explorer
    await waitFor(() => {
      expect(screen.getByText('newFile.ts')).toBeInTheDocument();
    });

    // Verify editor opens with new file
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    
    // Verify backend was called
    expect(mockClient.write_file_by_path).toHaveBeenCalledWith(
      'newFile.ts',
      '',
      'default'
    );
  });
});
```

## Build and Development Workflow

### Package Scripts

```json
// package.json for component packages
{
  "name": "@symphony/code-editor",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite build --watch",
    "build": "tsc && vite build",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "lint": "eslint src --ext .ts,.tsx",
    "type-check": "tsc --noEmit",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  },
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "@monaco-editor/react": "^4.7.0"
  },
  "devDependencies": {
    "@types/react": "^19.1.8",
    "@vitejs/plugin-react": "^4.0.3",
    "typescript": "^5.8.3",
    "vite": "latest",
    "vitest": "latest"
  }
}
```

### Development Commands

```bash
# Component development
cd packages/components/code-editor
pnpm dev                    # Watch mode development
pnpm test                   # Run component tests
pnpm storybook             # Start Storybook for component development

# Full application development
cd apps/web
pnpm dev                   # Start web application
pnpm build                 # Build for production
pnpm preview               # Preview production build

# Monorepo commands (from root)
pnpm dev                   # Start all packages in development
pnpm build                 # Build all packages
pnpm test                  # Run all tests
pnpm lint                  # Lint all packages
pnpm type-check           # Type check all packages
```

## Performance Best Practices

### Code Splitting and Lazy Loading

```typescript
// Lazy loading for large components
const CodeEditor = React.lazy(() => import('@symphony/code-editor'));
const Terminal = React.lazy(() => import('@symphony/terminal'));

const IDEPage: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <div className="ide-layout">
        <CodeEditor />
        <Terminal />
      </div>
    </Suspense>
  );
};
```

### Memoization Strategies

```typescript
// Memoize expensive computations
const MemoizedFileTree = React.memo(FileTree, (prevProps, nextProps) => {
  return (
    prevProps.files === nextProps.files &&
    prevProps.activeFile === nextProps.activeFile
  );
});

// Use useMemo for derived state
const sortedFiles = useMemo(() => {
  return Object.keys(files).sort((a, b) => a.localeCompare(b));
}, [files]);
```

This frontend guide ensures consistent, high-quality development practices across Symphony's React-based frontend while maintaining the performance and user experience standards expected from a professional IDE.