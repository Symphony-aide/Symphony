# @symphony/ui

Symphony's design system and UI component library built on Shadcn/ui with Tailwind CSS.

## Overview

The UI package provides foundational components for Symphony IDE:

- **50+ UI Components**: Buttons, inputs, dialogs, menus, and more
- **Progressive Feedback System**: Adaptive loading states for async operations
- **Accessibility**: ARIA-compliant components built on Radix UI primitives
- **Theming**: Full theme customization support

## Installation

```bash
pnpm add @symphony/ui
```

## Components

### Core Components

```tsx
import {
  Button,
  Input,
  Card,
  Dialog,
  DropdownMenu,
  Tabs,
  // ... 50+ components
} from '@symphony/ui';
```

See `packages/ui/components/` for the full component list.

### Layout Components

```tsx
import { Box, Flex, Grid } from '@symphony/ui';

// Box - basic layout with padding/margin control
<Box padding="md" margin="sm">Content</Box>

// Flex - flexbox layout
<Flex justify="between" align="center" gap={4}>
  <span>Left</span>
  <span>Right</span>
</Flex>

// Grid - CSS grid layout
<Grid columns={3} gap={4}>
  <div>1</div>
  <div>2</div>
  <div>3</div>
</Grid>
```

### Typography Components

```tsx
import { Text, Heading, Code } from '@symphony/ui';

<Heading level={1}>Title</Heading>
<Text size="sm" color="muted">Description</Text>
<Code variant="inline">const x = 1;</Code>
<Code variant="block">{codeBlock}</Code>
```

### Feedback Components

```tsx
import { Spinner } from '@symphony/ui';

// Basic spinner
<Spinner />

// With size and label
<Spinner size="lg" label="Loading..." />
```

### Progressive Feedback UI Components

The Progressive Feedback System includes specialized UI components for each escalation level:

```tsx
import {
  InlineSpinner,
  OverlaySpinner,
  ModalProgress,
  OperationFeedback,
  useOperationState,
} from '@symphony/ui';

// InlineSpinner - Subtle inline loading indicator (200-500ms operations)
<InlineSpinner size="sm" />
<Button>
  <InlineSpinner size="xs" className="mr-2" />
  Loading...
</Button>

// OverlaySpinner - Semi-transparent overlay (500ms-2s operations)
<div className="relative">
  <Content />
  <OverlaySpinner
    visible={isLoading}
    message="Loading data..."
    progress={{ type: 'determinate', value: 50 }}
  />
</div>

// ModalProgress - Modal dialog with progress (>2s operations)
<ModalProgress
  open={isLoading}
  title="Uploading Files"
  progress={{ type: 'determinate', value: 65, message: 'Uploading file 3 of 5...' }}
  onCancel={handleCancel}
  canCancel={true}
/>

// OperationFeedback - Automatic feedback based on escalation level
<OperationFeedback
  operationId="file-upload"
  modalTitle="Uploading Files"
  onCancel={handleCancel}
>
  <FileUploader />
</OperationFeedback>
```

## Progressive Feedback System

A professional-grade feedback system for Symphony's desktop application that provides contextual, adaptive UI feedback for asynchronous operations. The system automatically escalates feedback intensity based on operation duration, following patterns from JetBrains IDEs and VSCode.

### Core Principles

1. **Localized Feedback**: Feedback appears on the component that triggered the operation
2. **Progressive Escalation**: Feedback intensity increases with operation duration
3. **Non-Blocking Architecture**: All operations execute asynchronously

### Escalation Levels

| Level | Duration | UI Feedback |
|-------|----------|-------------|
| `none` | < 200ms | No feedback (silent completion) |
| `inline` | 200-500ms | Subtle inline spinner |
| `overlay` | 500ms-2s | Semi-transparent overlay with spinner |
| `modal` | > 2s | Modal dialog with progress bar and cancel |

### Quick Start

#### Using the useOperation Hook

```tsx
import { useOperation } from '@symphony/ui/feedback';

function MyComponent() {
  const { execute, cancel, isLoading, error, result } = useOperation({
    operation: async (token) => {
      const response = await fetch('/api/data');
      if (token.isCancelled) throw new Error('Cancelled');
      return response.json();
    },
    onSuccess: (data) => console.log('Success:', data),
    onError: (err) => console.error('Error:', err),
  });

  return (
    <button onClick={execute} disabled={isLoading}>
      {isLoading ? 'Loading...' : 'Load Data'}
    </button>
  );
}
```

#### Using OperationFeedback Component

```tsx
import { OperationFeedback, getOperationManager } from '@symphony/ui/feedback';

function FileExplorer() {
  const [operationId, setOperationId] = useState<string | null>(null);

  const loadFiles = async () => {
    const manager = getOperationManager();
    const handle = manager.startOperation({ id: 'load-files' });
    setOperationId(handle.id);

    try {
      const files = await fetchFiles();
      handle.complete(files);
    } catch (err) {
      handle.fail(err);
    }
  };

  return (
    <OperationFeedback operationId={operationId ?? ''}>
      <FileList />
    </OperationFeedback>
  );
}
```

#### Theme Customization

```tsx
import { FeedbackThemeProvider, InlineSpinner } from '@symphony/ui/feedback';

function App() {
  return (
    <FeedbackThemeProvider
      initialTheme={{
        color: 'primary',
        size: 'md',
        animationSpeed: 'normal',
      }}
    >
      <MyApp />
    </FeedbackThemeProvider>
  );
}
```

### Key Exports Summary

The Progressive Feedback System is organized into the following categories:

**Types**: `EscalationLevel`, `OperationState`, `ProgressState`, `EscalationConfig`, `FeedbackTheme`, `CancellationToken`

**Services**: `OperationManager`, `EscalationConfigManager`, `CancellationTokenSource`, `TauriProgressBridge`

**Components**: `InlineSpinner`, `OverlaySpinner`, `ModalProgress`, `OperationFeedback`, `ErrorFeedback`, `TreeSkeleton`, `TableSkeleton`, `ListSkeleton`

**Hooks**: `useOperation`, `useTauriOperation`, `useFeedbackTheme`, `useOperationState`

### Types

```tsx
import type {
  EscalationLevel,
  EscalationConfig,
  OperationState,
  ProgressState,
  CancellationToken,
} from '@symphony/ui';
```

### Utilities

```tsx
import {
  calculateEscalationLevel,
  generateOperationId,
  mergeEscalationConfig,
  validateEscalationConfig,
  DEFAULT_ESCALATION_CONFIG,
} from '@symphony/ui';

// Calculate escalation level based on duration
const level = calculateEscalationLevel(1500, DEFAULT_ESCALATION_CONFIG);
// Returns: 'overlay'

// Custom configuration
const customConfig = mergeEscalationConfig({
  inlineThreshold: 100,
  overlayThreshold: 300,
  modalThreshold: 1000,
});
```

### OperationManager

The `OperationManager` class provides centralized tracking of async operations with automatic escalation, progress updates, and hierarchical operation support.

```tsx
import {
  OperationManager,
  getOperationManager,
  resetOperationManager,
} from '@symphony/ui';

// Get the singleton instance
const manager = getOperationManager();

// Start tracking an operation
const handle = manager.startOperation({
  id: 'file-upload',
  config: {
    inlineThreshold: 200,
    overlayThreshold: 500,
    modalThreshold: 2000,
  },
});

// Update progress
handle.updateProgress({ type: 'determinate', value: 50, message: 'Uploading...' });

// Subscribe to state changes
const unsubscribe = manager.subscribe('file-upload', (state) => {
  console.log(`Status: ${state.status}, Level: ${state.escalationLevel}`);
});

// Complete the operation
handle.complete({ bytesUploaded: 1024 });

// Or handle failure
handle.fail(new Error('Upload failed'));

// Clean up subscription
unsubscribe();
```

#### Hierarchical Operations

Operations can have parent-child relationships for complex workflows:

```tsx
// Start parent operation
const parentHandle = manager.startOperation({ id: 'batch-process' });

// Start child operations
const child1 = manager.startOperation({ id: 'step-1', parentId: 'batch-process' });
const child2 = manager.startOperation({ id: 'step-2', parentId: 'batch-process' });

// Cancelling parent cancels all children
manager.cancelOperation('batch-process');

// Get child operations
const children = manager.getChildOperations('batch-process');
```

#### Progress Throttling

Progress updates are automatically throttled to 60fps to prevent excessive re-renders:

```tsx
// These rapid updates are automatically throttled
for (let i = 0; i <= 100; i++) {
  handle.updateProgress({ type: 'determinate', value: i });
  await doWork();
}
```

### CancellationToken

The `CancellationTokenSource` class provides a mechanism to signal that an operation should be aborted. It supports multiple callback registrations and hierarchical cancellation.

```tsx
import {
  CancellationTokenSource,
  createCancellationToken,
  createLinkedToken,
} from '@symphony/ui';

// Create a cancellation token
const token = new CancellationTokenSource();

// Register cleanup callbacks
const unsubscribe = token.onCancel(() => {
  console.log('Operation cancelled, cleaning up...');
});

// Check cancellation status in your operation
async function longRunningOperation(token: CancellationTokenSource) {
  for (let i = 0; i < 100; i++) {
    if (token.isCancelled) {
      return; // Exit early if cancelled
    }
    await doWork(i);
  }
}

// Request cancellation
token.cancel();

// Clean up when done
token.dispose();
```

#### Hierarchical Cancellation

Parent-child token relationships enable cascading cancellation:

```tsx
// Create parent token
const parentToken = new CancellationTokenSource();

// Create child tokens that cancel when parent cancels
const childToken1 = parentToken.createChild();
const childToken2 = parentToken.createChild();

// Cancelling parent cancels all children
parentToken.cancel();
// childToken1.isCancelled === true
// childToken2.isCancelled === true

// Children can detach from parent
const detachableChild = parentToken.createChild();
detachableChild.detachFromParent();
// Now cancelling parent won't affect this child
```

#### Linked Tokens

Create a token that cancels when any of multiple tokens cancel:

```tsx
const token1 = createCancellationToken();
const token2 = createCancellationToken();

// Linked token cancels if either token1 or token2 cancels
const linkedToken = createLinkedToken(token1, token2);

token1.cancel();
// linkedToken.isCancelled === true
```

### EscalationConfigManager

The `EscalationConfigManager` class provides a hierarchical configuration system for escalation thresholds with support for global defaults, per-operation-type overrides, and per-component overrides.

```tsx
import {
  EscalationConfigManager,
  getEscalationConfigManager,
  resetEscalationConfigManager,
} from '@symphony/ui';

// Get the singleton instance
const configManager = getEscalationConfigManager();

// Set global defaults
configManager.setGlobalConfig({
  inlineThreshold: 300,
  overlayThreshold: 800,
  modalThreshold: 3000,
});

// Set operation-type specific config (e.g., network operations need faster feedback)
configManager.setOperationTypeConfig('network', {
  inlineThreshold: 100,
  modalThreshold: 5000,
});

// Set component-specific config
configManager.setComponentConfig('file-explorer', {
  overlayThreshold: 1000,
});

// Resolve final config with precedence rules
// Precedence: component > operationType > global
const config = configManager.resolveConfig({
  operationType: 'network',
  componentId: 'file-explorer',
});
```

#### Configuration Precedence

When resolving configuration, the manager applies overrides in this order (highest to lowest precedence):

1. **Per-component overrides** - Specific to a UI component
2. **Per-operation-type overrides** - Specific to operation categories
3. **Global defaults** - Base configuration

#### Operation Types

Common operation types for IDE contexts:
- `'file-operation'` - File read/write operations
- `'network'` - Network requests (API calls, downloads)
- `'search'` - Search and indexing operations
- `'build'` - Build and compilation tasks
- `'git'` - Version control operations
- `'ai'` - AI/ML model operations

#### Configuration Import/Export

```tsx
// Export configuration for persistence
const exported = configManager.exportConfig();
localStorage.setItem('escalation-config', JSON.stringify(exported));

// Import configuration
const saved = JSON.parse(localStorage.getItem('escalation-config') || '{}');
configManager.importConfig(saved);

// Reset to defaults
configManager.reset();
```

### TauriProgressBridge

The `TauriProgressBridge` class provides seamless integration between Tauri backend operations and the Progressive Feedback System. It listens for progress events from the Rust backend and automatically maps them to OperationManager updates.

```tsx
import {
  TauriProgressBridge,
  getTauriProgressBridge,
  resetTauriProgressBridge,
  processTauriProgressEvent,
} from '@symphony/ui';

// Get the singleton instance (auto-starts in Tauri environment)
const bridge = getTauriProgressBridge();

// Or create a custom instance with options
const customBridge = new TauriProgressBridge({
  operationManager: customManager,
  progressEventName: 'custom-progress',
  cancelEventName: 'custom-cancel',
  autoStart: true,
});

// Start listening for events (if autoStart is false)
await bridge.start();

// Check if Tauri API is available
if (bridge.isTauriAvailable) {
  console.log('Running in Tauri environment');
}

// Check if currently listening
if (bridge.isListening) {
  console.log('Bridge is active');
}

// Send cancellation signal to backend
await bridge.sendCancellation('operation-id');

// Stop listening and clean up
bridge.stop();
bridge.dispose();
```

#### Tauri Event Format

The bridge expects progress events from the Tauri backend in the following format:

```typescript
interface TauriProgressEvent {
  operationId: string;
  type: 'progress' | 'complete' | 'error' | 'cancelled';
  progress?: {
    current: number;
    total: number;
    message?: string;
  };
  error?: string;
  result?: unknown;
}
```

#### Automatic Operation Creation

When a progress event is received for an unknown operation ID, the bridge automatically creates a new operation in the OperationManager:

```tsx
// Backend sends progress event
// { operationId: 'file-copy', type: 'progress', progress: { current: 50, total: 100 } }

// Bridge automatically:
// 1. Creates operation 'file-copy' in OperationManager
// 2. Sets up cancellation bridge (frontend cancel → backend signal)
// 3. Updates progress to 50%
```

#### Progress Type Detection

The bridge automatically determines progress type based on the `total` value:
- `total > 0`: Determinate progress (shows percentage)
- `total === 0`: Indeterminate progress (shows spinner)

#### Cancellation Bridge

When an operation is cancelled from the frontend, the bridge automatically sends a cancellation signal to the Tauri backend:

```tsx
// Frontend cancels operation
manager.cancelOperation('file-copy');

// Bridge automatically emits 'cancel-operation' event to Tauri
// { operationId: 'file-copy' }
```

#### Utility Function

For testing or manual event injection, use the `processTauriProgressEvent` utility:

```tsx
import { processTauriProgressEvent } from '@symphony/ui';

// Process an event without using the bridge's listener
processTauriProgressEvent({
  operationId: 'test-op',
  type: 'progress',
  progress: { current: 25, total: 100, message: 'Processing...' },
});
```

### Example Usage

```tsx
import { calculateEscalationLevel, DEFAULT_ESCALATION_CONFIG } from '@symphony/ui';

function useOperationFeedback(startTime: number) {
  const [level, setLevel] = useState<EscalationLevel>('none');

  useEffect(() => {
    const interval = setInterval(() => {
      const duration = Date.now() - startTime;
      setLevel(calculateEscalationLevel(duration, DEFAULT_ESCALATION_CONFIG));
    }, 50);

    return () => clearInterval(interval);
  }, [startTime]);

  return level;
}
```

## Testing

The package includes comprehensive property-based tests using fast-check:

```bash
# Run tests
pnpm test

# Run with coverage
pnpm test:coverage
```

### Test Categories

- **Property Tests**: Verify component behavior across all valid inputs
- **Layout Tests**: Validate Box, Flex, Grid components
- **Typography Tests**: Validate Text, Heading, Code components
- **Feedback Tests**: Validate escalation level calculation, cancellation token behavior, operation manager, configuration manager, and Tauri integration

## Development

```bash
# Start Storybook
pnpm storybook

# Build package
pnpm build

# Type check
pnpm type-check
```

### Storybook Stories

The Progressive Feedback System includes comprehensive Storybook stories for interactive component development and documentation:

**Feedback/InlineSpinner** - Stories for the inline spinner component:
- `Default` - Basic spinner with default settings
- `All Sizes` - Demonstrates xs, sm, md, lg, xl size variants
- `All Colors` - Shows all color variants (default, primary, secondary, muted, destructive, success, warning)
- `Inside Button` - Example of spinner usage within a button
- `With Text` - Example of spinner alongside text content

Run Storybook to explore these stories interactively:

```bash
pnpm storybook
```

## API Reference

### Feedback Types

| Type | Description |
|------|-------------|
| `EscalationLevel` | `'none' \| 'inline' \| 'overlay' \| 'modal'` |
| `OperationStatus` | `'pending' \| 'running' \| 'completed' \| 'failed' \| 'cancelled'` |
| `ProgressType` | `'indeterminate' \| 'determinate'` |
| `EscalationConfig` | Threshold configuration for escalation |
| `ProgressState` | Progress information (type, value, message) |
| `OperationState` | Full operation state including status and progress |
| `CancellationToken` | Interface for operation cancellation |

### Feedback Utilities

| Function | Description |
|----------|-------------|
| `calculateEscalationLevel(duration, config)` | Calculate escalation level for duration |
| `generateOperationId()` | Generate unique operation ID |
| `mergeEscalationConfig(partial)` | Merge partial config with defaults |
| `validateEscalationConfig(config)` | Validate threshold ordering |

### CancellationToken Classes and Functions

| Export | Description |
|--------|-------------|
| `CancellationTokenSource` | Class implementing cancellation token with hierarchical support |
| `createCancellationToken()` | Create a simple cancellation token |
| `createLinkedToken(...tokens)` | Create a token that cancels when any input token cancels |

#### CancellationTokenSource Methods

| Method | Description |
|--------|-------------|
| `isCancelled` | Property indicating if cancellation was requested |
| `onCancel(callback)` | Register callback for cancellation, returns unsubscribe function |
| `cancel()` | Request cancellation and invoke all callbacks |
| `createChild()` | Create a child token linked to this parent |
| `detachFromParent()` | Detach from parent token |
| `dispose()` | Clean up resources and detach from parent |

### OperationManager Classes and Functions

| Export | Description |
|--------|-------------|
| `OperationManager` | Class for centralized async operation tracking |
| `getOperationManager()` | Get the singleton OperationManager instance |
| `resetOperationManager()` | Reset the singleton instance (useful for testing) |

#### OperationManager Methods

| Method | Description |
|--------|-------------|
| `startOperation(options)` | Start tracking a new operation, returns OperationHandle |
| `getOperation(id)` | Get current state of an operation |
| `updateProgress(id, progress)` | Update operation progress (60fps throttled) |
| `completeOperation(id, result)` | Mark operation as completed |
| `failOperation(id, error)` | Mark operation as failed |
| `cancelOperation(id)` | Cancel operation and all children |
| `subscribe(id, callback)` | Subscribe to state changes, returns unsubscribe function |
| `getActiveOperations()` | Get all currently running operations |
| `getChildOperations(parentId)` | Get child operations for a parent |
| `cleanup(maxAge)` | Clean up old completed/failed/cancelled operations |

#### OperationHandle Interface

| Property/Method | Description |
|-----------------|-------------|
| `id` | Unique identifier for the operation |
| `cancellationToken` | CancellationTokenSource for this operation |
| `updateProgress(progress)` | Update operation progress |
| `complete(result)` | Mark operation as completed |
| `fail(error)` | Mark operation as failed |

### EscalationConfigManager Classes and Functions

| Export | Description |
|--------|-------------|
| `EscalationConfigManager` | Class for hierarchical escalation configuration management |
| `getEscalationConfigManager()` | Get the singleton EscalationConfigManager instance |
| `resetEscalationConfigManager()` | Reset the singleton instance (useful for testing) |
| `DEFAULT_CONFIG_ENTRY` | Default configuration entry with all levels enabled |

#### EscalationConfigManager Methods

| Method | Description |
|--------|-------------|
| `getGlobalConfig()` | Get the current global configuration |
| `setGlobalConfig(config)` | Set global configuration values |
| `getOperationTypeConfig(type)` | Get configuration for a specific operation type |
| `setOperationTypeConfig(type, config)` | Set configuration for a specific operation type |
| `removeOperationTypeConfig(type)` | Remove configuration for an operation type |
| `getConfiguredOperationTypes()` | Get all configured operation types |
| `getComponentConfig(id)` | Get configuration for a specific component |
| `setComponentConfig(id, config)` | Set configuration for a specific component |
| `removeComponentConfig(id)` | Remove configuration for a component |
| `getConfiguredComponents()` | Get all configured components |
| `resolveConfig(options)` | Resolve final config with precedence rules |
| `reset()` | Reset all configuration to defaults |
| `exportConfig()` | Export configuration for serialization |
| `importConfig(config)` | Import configuration from serialized object |

#### EscalationConfigEntry Interface

| Property | Description |
|----------|-------------|
| `inlineThreshold` | Threshold for inline spinner (ms) |
| `overlayThreshold` | Threshold for overlay spinner (ms) |
| `modalThreshold` | Threshold for modal dialog (ms) |
| `timeout` | Optional operation timeout (ms) |
| `inlineEnabled` | Whether inline escalation is enabled (default: true) |
| `overlayEnabled` | Whether overlay escalation is enabled (default: true) |
| `modalEnabled` | Whether modal escalation is enabled (default: true) |

### Constants

| Constant | Description |
|----------|-------------|
| `DEFAULT_ESCALATION_CONFIG` | Default thresholds: inline=200ms, overlay=500ms, modal=2000ms |
| `DEFAULT_CONFIG_ENTRY` | Default config entry with all escalation levels enabled |
| `DEFAULT_PROGRESS_EVENT_NAME` | Default Tauri event name for progress updates (`'progress-update'`) |
| `DEFAULT_CANCEL_EVENT_NAME` | Default Tauri event name for cancellation requests (`'cancel-operation'`) |

### TauriProgressBridge Classes and Functions

| Export | Description |
|--------|-------------|
| `TauriProgressBridge` | Class for bridging Tauri backend events to OperationManager |
| `getTauriProgressBridge()` | Get the singleton TauriProgressBridge instance |
| `resetTauriProgressBridge()` | Reset the singleton instance (useful for testing) |
| `processTauriProgressEvent(event, manager?)` | Process a Tauri event directly without using the bridge listener |

#### TauriProgressBridge Constructor Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `operationManager` | `OperationManager` | singleton | Custom OperationManager instance |
| `tauriEventAPI` | `TauriEventAPI` | `window.__TAURI__` | Custom Tauri event API (for testing) |
| `progressEventName` | `string` | `'progress-update'` | Event name for progress updates |
| `cancelEventName` | `string` | `'cancel-operation'` | Event name for cancellation requests |
| `autoStart` | `boolean` | `true` | Whether to auto-start listening on construction |

#### TauriProgressBridge Properties

| Property | Type | Description |
|----------|------|-------------|
| `isListening` | `boolean` | Whether the bridge is currently listening for events |
| `isTauriAvailable` | `boolean` | Whether the Tauri API is available |

#### TauriProgressBridge Methods

| Method | Description |
|--------|-------------|
| `start()` | Start listening for Tauri progress events (async) |
| `stop()` | Stop listening for Tauri progress events |
| `sendCancellation(operationId)` | Send a cancellation signal to the Tauri backend (async) |
| `dispose()` | Stop listening and clean up resources |

#### TauriProgressEvent Interface

| Property | Type | Description |
|----------|------|-------------|
| `operationId` | `string` | Unique identifier for the operation |
| `type` | `'progress' \| 'complete' \| 'error' \| 'cancelled'` | Event type |
| `progress` | `{ current: number; total: number; message?: string }` | Progress info (for `'progress'` type) |
| `error` | `string` | Error message (for `'error'` type) |
| `result` | `unknown` | Result data (for `'complete'` type) |

### Feedback Hooks

| Hook | Description |
|------|-------------|
| `useOperation<T>(options)` | React hook for managing async operations with progressive feedback |
| `useOperationState(operationId)` | Hook to get operation state for custom feedback rendering |
| `useTauriOperation<TArgs, TResult>(options)` | Hook for Tauri backend operations with automatic feedback integration |

#### useOperation Options and Result

See the [useOperation Hook](#useOperation-hook) section above for detailed documentation of options and return values.

#### useTauriOperation Hook

React hook for invoking Tauri commands with automatic progress tracking, cancellation support, and feedback UI integration.

```tsx
import { useTauriOperation } from '@symphony/ui';

function FileLoader() {
  const { execute, cancel, isLoading, error, result } = useTauriOperation<
    { path: string },
    FileContent
  >({
    command: 'read_file',
    argsTransformer: (args) => ({ path: args.path }),
    config: {
      inlineThreshold: 100,
      overlayThreshold: 500,
      modalThreshold: 2000,
    },
    onSuccess: (content) => console.log('File loaded:', content),
    onError: (err) => console.error('Failed to load file:', err),
    onCancel: () => console.log('Load cancelled'),
  });

  return (
    <div>
      <button onClick={() => execute({ path: '/path/to/file.txt' })} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Load File'}
      </button>
      {isLoading && <button onClick={cancel}>Cancel</button>}
      {error && <p>Error: {error.message}</p>}
      {result && <pre>{result.content}</pre>}
    </div>
  );
}
```

##### UseTauriOperationOptions

| Property | Type | Description |
|----------|------|-------------|
| `command` | `string` | Tauri command name to invoke (required) |
| `argsTransformer` | `(args: TArgs) => Record<string, unknown>` | Transform hook args to Tauri command args |
| `config` | `Partial<EscalationConfig>` | Custom escalation configuration |
| `parentId` | `string` | Parent operation ID for hierarchical operations |
| `onSuccess` | `(result: TResult) => void` | Callback when operation succeeds |
| `onError` | `(error: Error) => void` | Callback when operation fails |
| `onCancel` | `() => void` | Callback when operation is cancelled |
| `operationId` | `string` | Custom operation ID (auto-generated if not provided) |
| `operationManager` | `OperationManager` | Custom OperationManager instance |
| `progressBridge` | `TauriProgressBridge` | Custom TauriProgressBridge instance |
| `tauriAPI` | `TauriAPI` | Custom Tauri API (for testing) |

##### UseTauriOperationResult

| Property/Method | Type | Description |
|-----------------|------|-------------|
| `execute` | `(args: TArgs) => Promise<TResult \| undefined>` | Execute the Tauri command |
| `cancel` | `() => void` | Cancel the current operation |
| `retry` | `() => Promise<TResult \| undefined>` | Retry the last operation |
| `state` | `OperationState \| null` | Current operation state |
| `isLoading` | `boolean` | Whether operation is currently running |
| `isError` | `boolean` | Whether operation has failed |
| `isCancelled` | `boolean` | Whether operation was cancelled |
| `error` | `Error \| undefined` | Error from failed operation |
| `result` | `TResult \| undefined` | Result from successful operation |

##### createCancellableCommand Utility

Create a cancellation-aware wrapper for Tauri commands:

```tsx
import { createCancellableCommand, CancellationTokenSource } from '@symphony/ui';

const readFile = createCancellableCommand<{ path: string }, string>(
  'read_file',
  tauriAPI
);

const token = new CancellationTokenSource();
try {
  const content = await readFile({ path: '/file.txt' }, token);
  console.log(content);
} catch (err) {
  if (err.message === 'Operation was cancelled') {
    console.log('User cancelled the operation');
  }
}

// Cancel from elsewhere
token.cancel();
```

### Feedback UI Components

#### InlineSpinner

Subtle inline loading indicator for operations taking 200-500ms.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'sm'` | Spinner size |
| `color` | `'default' \| 'primary' \| 'secondary' \| 'muted'` | `'default'` | Spinner color |
| `label` | `string` | `'Loading'` | Accessibility label |
| `className` | `string` | - | Additional CSS classes |

#### OverlaySpinner

Semi-transparent overlay with spinner for operations taking 500ms-2s.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `visible` | `boolean` | `true` | Whether the overlay is visible |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Spinner size |
| `color` | `'default' \| 'primary' \| 'secondary'` | `'primary'` | Spinner color |
| `message` | `string` | - | Optional status message |
| `progress` | `ProgressState` | - | Progress state for displaying progress info |
| `className` | `string` | - | Additional CSS classes |

#### ModalProgress

Modal dialog with progress bar and cancel button for operations taking >2s.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | - | Whether the modal is open |
| `title` | `string` | `'Operation in Progress'` | Modal title |
| `progress` | `ProgressState` | - | Progress state (required) |
| `onCancel` | `() => void` | - | Cancel button callback (required) |
| `canCancel` | `boolean` | `true` | Whether cancellation is allowed |
| `className` | `string` | - | Additional CSS classes |

#### OperationFeedback

Wrapper component that automatically renders appropriate feedback based on operation escalation level.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `operationId` | `string` | - | Operation ID to track (required) |
| `children` | `React.ReactNode` | - | Content to wrap (required) |
| `fallback` | `React.ReactNode` | - | Fallback content during loading |
| `modalTitle` | `string` | - | Title for modal progress |
| `onCancel` | `() => void` | - | Cancel callback |
| `className` | `string` | - | Additional CSS classes |

#### ErrorFeedback

Error display component with dismiss and retry functionality. Displays error feedback in the same context as loading feedback was displayed. Supports theme customization for consistent styling across the application.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `error` | `Error` | - | Error to display (required) |
| `onDismiss` | `() => void` | - | Callback when dismiss button is clicked |
| `onRetry` | `() => void` | - | Callback when retry button is clicked |
| `canRetry` | `boolean` | `true` | Whether retry is available |
| `variant` | `'inline' \| 'overlay' \| 'modal'` | `'inline'` | Display style variant |
| `title` | `string` | `'Error'` | Title for the error |
| `theme` | `Partial<FeedbackTheme>` | - | Theme configuration for customization |
| `className` | `string` | - | Additional CSS classes |

```tsx
import { ErrorFeedback } from '@symphony/ui';

// Inline error (subtle, for minor issues)
<ErrorFeedback
  error={new Error('Failed to load data')}
  onDismiss={handleDismiss}
  onRetry={handleRetry}
  variant="inline"
/>

// Overlay error (for component-level failures)
<div className="relative">
  <Content />
  <ErrorFeedback
    error={new Error('Network timeout')}
    onDismiss={handleDismiss}
    onRetry={handleRetry}
    variant="overlay"
  />
</div>

// Modal error (for critical failures)
<ErrorFeedback
  error={new Error('Operation failed')}
  onDismiss={handleDismiss}
  onRetry={handleRetry}
  variant="modal"
  title="Operation Failed"
/>

// With theme customization
<ErrorFeedback
  error={new Error('Custom styled error')}
  onDismiss={handleDismiss}
  onRetry={handleRetry}
  variant="modal"
  theme={{
    borderRadius: 'lg',
    animationSpeed: 'fast',
    overlayOpacity: 70,
    customClass: 'my-custom-error',
  }}
/>
```

The component automatically detects timeout errors and displays an appropriate title ("Operation Timed Out" instead of the generic title). Theme settings are merged with the global `FeedbackThemeProvider` context, allowing both global and per-component customization.

#### useOperationState Hook

Hook to get operation state for custom feedback rendering.

```tsx
const state = useOperationState('my-operation');
// Returns: OperationState | undefined
```

#### useOperation Hook

React hook for managing async operations with progressive feedback. Wraps async operations with OperationManager integration, providing automatic feedback escalation, cancellation support, and retry functionality.

```tsx
import { useOperation } from '@symphony/ui';

function FileUploader() {
  const { execute, cancel, retry, isLoading, error, result, updateProgress } = useOperation({
    operation: async (token) => {
      const response = await fetch('/api/upload', { signal: createAbortSignal(token) });
      if (token.isCancelled) throw new Error('Cancelled');
      return response.json();
    },
    config: {
      inlineThreshold: 200,
      overlayThreshold: 500,
      modalThreshold: 2000,
    },
    onSuccess: (data) => console.log('Upload complete:', data),
    onError: (err) => console.error('Upload failed:', err),
    onCancel: () => console.log('Upload cancelled'),
  });

  return (
    <div>
      <button onClick={execute} disabled={isLoading}>
        {isLoading ? 'Uploading...' : 'Upload File'}
      </button>
      {isLoading && <button onClick={cancel}>Cancel</button>}
      {error && <button onClick={retry}>Retry</button>}
      {result && <p>Uploaded: {result.filename}</p>}
    </div>
  );
}
```

##### UseOperationOptions

| Property | Type | Description |
|----------|------|-------------|
| `operation` | `(token: CancellationToken) => Promise<T>` | The async operation to execute (required) |
| `config` | `Partial<EscalationConfig>` | Custom escalation configuration |
| `parentId` | `string` | Parent operation ID for hierarchical operations |
| `onSuccess` | `(result: T) => void` | Callback when operation succeeds |
| `onError` | `(error: Error) => void` | Callback when operation fails |
| `onCancel` | `() => void` | Callback when operation is cancelled |

##### UseOperationResult

| Property/Method | Type | Description |
|-----------------|------|-------------|
| `execute` | `() => Promise<T \| undefined>` | Execute the operation |
| `cancel` | `() => void` | Cancel the current operation |
| `retry` | `() => Promise<T \| undefined>` | Retry the last failed operation |
| `state` | `OperationState \| null` | Current operation state |
| `isLoading` | `boolean` | Whether an operation is currently running |
| `isError` | `boolean` | Whether the last operation failed |
| `isCancelled` | `boolean` | Whether the last operation was cancelled |
| `error` | `Error \| undefined` | Error from the last failed operation |
| `result` | `T \| undefined` | Result from the last successful operation |
| `updateProgress` | `(progress: Partial<ProgressState>) => void` | Update progress for the current operation |

##### Progress Updates

The hook provides a `updateProgress` function to report progress during long-running operations:

```tsx
const { execute, updateProgress } = useOperation({
  operation: async (token) => {
    const files = await getFiles();
    for (let i = 0; i < files.length; i++) {
      if (token.isCancelled) break;
      await uploadFile(files[i]);
      updateProgress({
        type: 'determinate',
        value: ((i + 1) / files.length) * 100,
        message: `Uploading file ${i + 1} of ${files.length}...`,
      });
    }
    return { uploaded: files.length };
  },
});
```

##### Hierarchical Operations

Use `parentId` to create child operations that are automatically cancelled when the parent is cancelled:

```tsx
const parentOp = useOperation({
  operation: async (token) => {
    // Parent operation logic
  },
});

const childOp = useOperation({
  operation: async (token) => {
    // Child operation logic
  },
  parentId: parentOp.state?.id,
});

// Cancelling parentOp will also cancel childOp
```

#### Skeleton Components

Skeleton components provide placeholder UI that mimics the layout of content being loaded. They're useful for showing loading states that match the expected content structure.

```tsx
import { ListSkeleton, TableSkeleton, TreeSkeleton } from '@symphony/ui';

// List skeleton with different layouts
<ListSkeleton itemCount={5} layout="simple" />
<ListSkeleton itemCount={3} layout="avatar" showDividers />
<ListSkeleton itemCount={4} layout="detailed" />

// Table skeleton
<TableSkeleton rowCount={5} columnCount={4} showHeader showCheckbox />

// Tree skeleton for hierarchical content
<TreeSkeleton itemCount={4} maxDepth={2} showIcons />
```

##### ListSkeleton

Displays a skeleton placeholder that mimics the layout of a list.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `itemCount` | `number` | `5` | Number of items to display |
| `layout` | `'simple' \| 'detailed' \| 'avatar'` | `'simple'` | Layout variant for list items |
| `showDividers` | `boolean` | `false` | Whether to show dividers between items |
| `className` | `string` | - | Additional CSS classes |

##### TableSkeleton

Displays a skeleton placeholder that mimics the layout of a table.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `rowCount` | `number` | `5` | Number of rows to display |
| `columnCount` | `number` | `4` | Number of columns to display |
| `showHeader` | `boolean` | `true` | Whether to show a header row |
| `showCheckbox` | `boolean` | `false` | Whether to show row selection checkboxes |
| `className` | `string` | - | Additional CSS classes |

##### TreeSkeleton

Displays a skeleton placeholder that mimics the layout of a tree view with nested items.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `itemCount` | `number` | `4` | Number of root-level items to display |
| `maxDepth` | `number` | `2` | Maximum depth of nested items |
| `showIcons` | `boolean` | `true` | Whether to show expand/collapse icons |
| `className` | `string` | - | Additional CSS classes |

#### Helper Functions

| Function | Description |
|----------|-------------|
| `shouldShowFeedback(level)` | Returns true if feedback should be displayed for the level |
| `getFeedbackType(level)` | Returns the feedback component type for the level |
