/**
 * Progressive Feedback System
 *
 * A professional-grade feedback system for Symphony's desktop application that provides
 * contextual, adaptive UI feedback for asynchronous operations. The system automatically
 * escalates feedback intensity based on operation duration, following patterns from
 * JetBrains IDEs and VSCode.
 *
 * ## Core Principles
 *
 * 1. **Localized Feedback**: Feedback appears on the component that triggered the operation
 * 2. **Progressive Escalation**: Feedback intensity increases with operation duration
 * 3. **Non-Blocking Architecture**: All operations execute asynchronously
 *
 * ## Escalation Levels
 *
 * - **None** (< 200ms): Operation completes silently
 * - **Inline** (200-500ms): Subtle inline spinner within the component
 * - **Overlay** (500ms-2s): Semi-transparent overlay with spinner
 * - **Modal** (> 2s): Modal dialog with progress bar and cancel button
 *
 * ## Quick Start
 *
 * ### Using the useOperation Hook
 *
 * ```tsx
 * import { useOperation } from '@symphony/ui/feedback';
 *
 * function MyComponent() {
 *   const { execute, cancel, isLoading, error, result } = useOperation({
 *     operation: async (token) => {
 *       const response = await fetch('/api/data');
 *       if (token.isCancelled) throw new Error('Cancelled');
 *       return response.json();
 *     },
 *     onSuccess: (data) => console.log('Success:', data),
 *     onError: (err) => console.error('Error:', err),
 *   });
 *
 *   return (
 *     <button onClick={execute} disabled={isLoading}>
 *       {isLoading ? 'Loading...' : 'Load Data'}
 *     </button>
 *   );
 * }
 * ```
 *
 * ### Using OperationFeedback Component
 *
 * ```tsx
 * import { OperationFeedback, getOperationManager } from '@symphony/ui/feedback';
 *
 * function FileExplorer() {
 *   const [operationId, setOperationId] = useState<string | null>(null);
 *
 *   const loadFiles = async () => {
 *     const manager = getOperationManager();
 *     const handle = manager.startOperation({ id: 'load-files' });
 *     setOperationId(handle.id);
 *
 *     try {
 *       const files = await fetchFiles();
 *       handle.complete(files);
 *     } catch (err) {
 *       handle.fail(err);
 *     }
 *   };
 *
 *   return (
 *     <OperationFeedback operationId={operationId ?? ''}>
 *       <FileList />
 *     </OperationFeedback>
 *   );
 * }
 * ```
 *
 * ### Theme Customization
 *
 * ```tsx
 * import { FeedbackThemeProvider, InlineSpinner } from '@symphony/ui/feedback';
 *
 * function App() {
 *   return (
 *     <FeedbackThemeProvider
 *       initialTheme={{
 *         color: 'primary',
 *         size: 'md',
 *         animationSpeed: 'normal',
 *       }}
 *     >
 *       <MyApp />
 *     </FeedbackThemeProvider>
 *   );
 * }
 * ```
 *
 * ## Key Exports
 *
 * ### Types
 * - {@link EscalationLevel} - Feedback intensity levels
 * - {@link OperationState} - Operation tracking state
 * - {@link ProgressState} - Progress information
 * - {@link EscalationConfig} - Threshold configuration
 * - {@link FeedbackTheme} - Theme customization options
 *
 * ### Services
 * - {@link OperationManager} - Central operation tracking service
 * - {@link EscalationConfigManager} - Configuration management
 * - {@link CancellationTokenSource} - Cancellation token implementation
 * - {@link TauriProgressBridge} - Tauri backend integration
 *
 * ### Components
 * - {@link InlineSpinner} - Subtle inline loading indicator
 * - {@link OverlaySpinner} - Semi-transparent overlay with spinner
 * - {@link ModalProgress} - Modal dialog with progress bar
 * - {@link OperationFeedback} - Automatic feedback wrapper
 * - {@link ErrorFeedback} - Error display with retry
 * - {@link TreeSkeleton} - Tree view skeleton placeholder
 * - {@link TableSkeleton} - Table skeleton placeholder
 * - {@link ListSkeleton} - List skeleton placeholder
 *
 * ### Hooks
 * - {@link useOperation} - React hook for async operations
 * - {@link useTauriOperation} - Hook for Tauri commands
 * - {@link useFeedbackTheme} - Access theme configuration
 *
 * @module feedback
 * @see {@link https://github.com/symphony/docs/feedback-system} Documentation
 */

// Core types - Defines all TypeScript interfaces and type definitions
export * from './types';

// Utility functions - Helper functions for escalation calculation and validation
export * from './utils';

// CancellationToken - Mechanism for signaling operation cancellation
export * from './CancellationToken';

// OperationManager - Central service for tracking async operations
export * from './OperationManager';

// Configuration Manager - Hierarchical configuration system
export * from './EscalationConfigManager';

// Theme Context - React context for theme customization
export * from './FeedbackThemeContext';

// Tauri Integration - Bridge between Tauri backend and feedback system
export * from './TauriProgressBridge';

// UI Components - Visual feedback components (spinners, progress, skeletons)
export * from './components';

// Hooks - React hooks for operation management
export * from './hooks';
