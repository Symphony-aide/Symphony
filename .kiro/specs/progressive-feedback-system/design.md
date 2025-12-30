# Design Document: Progressive Feedback System

## Overview

The Progressive Feedback System provides contextual, adaptive UI feedback for asynchronous operations in Symphony's desktop application. It follows patterns from JetBrains IDEs and VSCode, automatically escalating feedback intensity based on operation duration—from silent completion for fast operations to modal dialogs with cancellation for long-running tasks.

The system is built on three core principles:
1. **Localized Feedback**: Feedback appears on the component that triggered the operation
2. **Progressive Escalation**: Feedback intensity increases with operation duration
3. **Non-Blocking Architecture**: All operations execute asynchronously, keeping the UI responsive

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Application Layer                                │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    useOperation Hook                             │   │
│  │  - Wraps async operations with feedback management               │   │
│  │  - Returns operation state and trigger function                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                  │                                       │
│                                  ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    OperationManager                              │   │
│  │  - Tracks active operations                                      │   │
│  │  - Manages escalation timers                                     │   │
│  │  - Handles hierarchical operations                               │   │
│  │  - Coordinates cancellation                                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                  │                                       │
│         ┌────────────────────────┼────────────────────────┐             │
│         ▼                        ▼                        ▼             │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐       │
│  │   Spinner   │         │ProgressBar  │         │ModalProgress│       │
│  │  (Inline)   │         │  (Overlay)  │         │  (Modal)    │       │
│  └─────────────┘         └─────────────┘         └─────────────┘       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Backend Layer (Tauri)                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Progress Event Emitter                        │   │
│  │  - Emits progress updates via Tauri events                       │   │
│  │  - Supports cancellation tokens                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Core Types

```typescript
// Escalation levels based on operation duration
type EscalationLevel = 'none' | 'inline' | 'overlay' | 'modal';

// Operation state tracked by OperationManager
interface OperationState {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  escalationLevel: EscalationLevel;
  progress: ProgressState;
  error?: Error;
  startTime: number;
  parentId?: string;
  childIds: string[];
}

// Progress information
interface ProgressState {
  type: 'indeterminate' | 'determinate';
  value?: number;        // 0-100 for determinate
  message?: string;      // Optional status message
}

// Escalation threshold configuration
interface EscalationConfig {
  inlineThreshold: number;   // Default: 200ms
  overlayThreshold: number;  // Default: 500ms
  modalThreshold: number;    // Default: 2000ms
  timeout?: number;          // Optional operation timeout
}

// Cancellation token interface
interface CancellationToken {
  isCancelled: boolean;
  onCancel: (callback: () => void) => void;
  cancel: () => void;
}
```

### OperationManager Service

```typescript
interface OperationManager {
  // Start tracking an operation
  startOperation(options: {
    id?: string;
    parentId?: string;
    config?: Partial<EscalationConfig>;
  }): OperationHandle;

  // Get current operation state
  getOperation(id: string): OperationState | undefined;

  // Update operation progress
  updateProgress(id: string, progress: Partial<ProgressState>): void;

  // Complete operation
  completeOperation(id: string, result?: unknown): void;

  // Fail operation
  failOperation(id: string, error: Error): void;

  // Cancel operation and children
  cancelOperation(id: string): void;

  // Subscribe to operation state changes
  subscribe(id: string, callback: (state: OperationState) => void): () => void;
}

interface OperationHandle {
  id: string;
  cancellationToken: CancellationToken;
  updateProgress: (progress: Partial<ProgressState>) => void;
  complete: (result?: unknown) => void;
  fail: (error: Error) => void;
}
```

### useOperation Hook

```typescript
interface UseOperationOptions<T> {
  operation: (token: CancellationToken) => Promise<T>;
  config?: Partial<EscalationConfig>;
  parentId?: string;
  onSuccess?: (result: T) => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;
}

interface UseOperationResult<T> {
  execute: () => Promise<T | undefined>;
  cancel: () => void;
  retry: () => Promise<T | undefined>;
  state: OperationState;
  isLoading: boolean;
  isError: boolean;
  isCancelled: boolean;
  error?: Error;
  result?: T;
}

function useOperation<T>(options: UseOperationOptions<T>): UseOperationResult<T>;
```

### Feedback Components

```typescript
// Inline spinner for 200-500ms operations
interface InlineSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Overlay spinner for 500ms-2s operations
interface OverlaySpinnerProps {
  message?: string;
  progress?: ProgressState;
  className?: string;
}

// Modal progress for >2s operations
interface ModalProgressProps {
  title?: string;
  message?: string;
  progress: ProgressState;
  onCancel: () => void;
  canCancel?: boolean;
}

// Wrapper component that handles escalation automatically
interface OperationFeedbackProps {
  operationId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;  // Shown during loading
}
```

## Data Models

### Operation Registry

```typescript
// Internal state structure for OperationManager
interface OperationRegistry {
  operations: Map<string, OperationState>;
  timers: Map<string, NodeJS.Timeout[]>;
  subscriptions: Map<string, Set<(state: OperationState) => void>>;
}
```

### Progress Event (Tauri)

```typescript
// Event payload from Tauri backend
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

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing the acceptance criteria, the following redundancies were identified and consolidated:
- Properties 1.3, 1.4, 1.5 can be combined into a single escalation level property
- Properties 3.1 and 3.2 can be combined into a progress type selection property
- Properties 10.1, 10.2, 10.3 can be combined into a configuration override property

### Correctness Properties

Property 1: Silent completion for fast operations
*For any* operation that completes in less than 200 milliseconds, the system should not display any feedback UI
**Validates: Requirements 1.2**

Property 2: Escalation level matches duration
*For any* operation with duration D, the escalation level should be:
- 'none' if D < inlineThreshold
- 'inline' if inlineThreshold ≤ D < overlayThreshold
- 'overlay' if overlayThreshold ≤ D < modalThreshold
- 'modal' if D ≥ modalThreshold
**Validates: Requirements 1.3, 1.4, 1.5**

Property 3: Independent concurrent operation tracking
*For any* set of concurrent operations, each operation should have independent state tracking and feedback display
**Validates: Requirements 2.4**

Property 4: Progress type selection
*For any* operation, if progress percentage is available the system should display determinate progress, otherwise indeterminate progress
**Validates: Requirements 3.1, 3.2**

Property 5: Progress transition consistency
*For any* operation that transitions from indeterminate to determinate progress, the UI should smoothly update from spinner to progress bar without losing state
**Validates: Requirements 3.3**

Property 6: Progress throttling
*For any* sequence of progress events, the UI should update at most 60 times per second regardless of event frequency
**Validates: Requirements 3.4**

Property 7: Modal cancellation availability
*For any* operation at modal escalation level, a cancel button should be present and functional
**Validates: Requirements 4.1, 4.2**

Property 8: Hierarchical cancellation propagation
*For any* parent operation that is cancelled, all child operations should also be cancelled
**Validates: Requirements 4.5**

Property 9: Skeleton to content transition
*For any* component displaying skeleton placeholders, when loading completes the skeleton should be replaced with actual content
**Validates: Requirements 5.1, 5.3**

Property 10: Error context preservation
*For any* failed operation, error feedback should appear in the same location as loading feedback was displayed
**Validates: Requirements 6.1**

Property 11: Retry mechanism availability
*For any* failed operation, a retry mechanism should be available to re-execute the operation
**Validates: Requirements 6.3**

Property 12: Timeout handling
*For any* operation with a configured timeout that exceeds that timeout, the operation should be cancelled and a timeout message displayed
**Validates: Requirements 6.4**

Property 13: Graceful degradation
*For any* error in the feedback system itself, the application should continue functioning with fallback loading states
**Validates: Requirements 6.5**

Property 14: Configuration override precedence
*For any* operation, configuration should be applied in order: global defaults < operation-type overrides < component-specific overrides
**Validates: Requirements 10.1, 10.2, 10.3**

Property 15: Theme customization acceptance
*For any* feedback component, theme customization props should be accepted and applied to styling
**Validates: Requirements 7.3**

Property 16: Tauri progress event handling
*For any* Tauri command that emits progress events, the frontend should receive and process those events correctly
**Validates: Requirements 8.1**

Property 17: Hierarchical progress independence
*For any* hierarchical operation structure, each operation should maintain its own progress state independently
**Validates: Requirements 9.3**

Property 18: Parent completion aggregation
*For any* parent operation with children, when the parent completes it should aggregate results from all child operations
**Validates: Requirements 9.4**

## Error Handling

### Error Categories

1. **Operation Errors**: Errors from the async operation itself
   - Display error in feedback context
   - Provide retry mechanism
   - Log error with operation context

2. **Timeout Errors**: Operations exceeding configured timeout
   - Cancel operation automatically
   - Display timeout-specific message
   - Offer retry option

3. **Cancellation**: User-initiated or parent-propagated cancellation
   - Display cancellation confirmation
   - Clean up resources
   - No retry offered (user chose to cancel)

4. **System Errors**: Errors in the feedback system itself
   - Fall back to simple loading state
   - Log error for debugging
   - Never crash the application

### Error State Flow

```
Operation Running
       │
       ├──► Success ──► Complete (clear feedback)
       │
       ├──► Error ──► Show Error Feedback
       │                    │
       │                    ├──► Retry ──► Operation Running
       │                    │
       │                    └──► Dismiss ──► Clear Feedback
       │
       ├──► Timeout ──► Show Timeout Message ──► Clear Feedback
       │
       └──► Cancel ──► Show Cancellation Message ──► Clear Feedback
```

## Testing Strategy

### Property-Based Testing Library

The system will use **fast-check** for property-based testing in TypeScript/JavaScript.

### Unit Tests

Unit tests will cover:
- OperationManager state transitions
- Escalation timer logic
- Progress throttling implementation
- Cancellation token behavior
- Configuration merging

### Property-Based Tests

Each correctness property will be implemented as a property-based test:

```typescript
// Example: Property 2 - Escalation level matches duration
// **Feature: progressive-feedback-system, Property 2: Escalation level matches duration**
fc.assert(
  fc.property(
    fc.integer({ min: 0, max: 10000 }), // duration in ms
    fc.record({
      inlineThreshold: fc.integer({ min: 100, max: 500 }),
      overlayThreshold: fc.integer({ min: 300, max: 1000 }),
      modalThreshold: fc.integer({ min: 1000, max: 5000 }),
    }),
    (duration, config) => {
      const level = calculateEscalationLevel(duration, config);
      if (duration < config.inlineThreshold) {
        return level === 'none';
      } else if (duration < config.overlayThreshold) {
        return level === 'inline';
      } else if (duration < config.modalThreshold) {
        return level === 'overlay';
      } else {
        return level === 'modal';
      }
    }
  )
);
```

### Integration Tests

Integration tests will verify:
- Hook integration with OperationManager
- UI rendering at each escalation level
- Concurrent operations handling
- Tauri event integration (mocked)

### Test Configuration

- Property tests: minimum 100 iterations per property
- Each property test tagged with: `**Feature: progressive-feedback-system, Property {number}: {property_text}**`
