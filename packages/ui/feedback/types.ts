/**
 * Core types for the Progressive Feedback System
 *
 * These types define the data structures used throughout the feedback system
 * for tracking operations, managing escalation, and handling progress.
 *
 * ## Type Categories
 *
 * ### Escalation Types
 * - {@link EscalationLevel} - Feedback intensity levels (none, inline, overlay, modal)
 * - {@link EscalationConfig} - Threshold configuration for escalation timing
 *
 * ### Operation Types
 * - {@link OperationState} - Complete state of a tracked operation
 * - {@link OperationStatus} - Status values (pending, running, completed, failed, cancelled)
 * - {@link OperationHandle} - Handle for controlling an operation
 * - {@link StartOperationOptions} - Options for starting new operations
 *
 * ### Progress Types
 * - {@link ProgressState} - Progress information (type, value, message)
 * - {@link ProgressType} - Progress display type (indeterminate, determinate)
 *
 * ### Cancellation Types
 * - {@link CancellationToken} - Interface for cancellation signaling
 *
 * ### Theme Types
 * - {@link FeedbackTheme} - Theme configuration for visual customization
 * - {@link FeedbackColorVariant} - Color options for components
 * - {@link FeedbackSizeVariant} - Size options for components
 * - {@link FeedbackAnimationSpeed} - Animation speed options
 *
 * ### Tauri Integration Types
 * - {@link TauriProgressEvent} - Event payload from Tauri backend
 *
 * ## Usage Example
 *
 * ```typescript
 * import type {
 *   EscalationConfig,
 *   OperationState,
 *   ProgressState,
 *   FeedbackTheme,
 * } from '@symphony/ui/feedback';
 *
 * // Custom escalation config
 * const config: EscalationConfig = {
 *   inlineThreshold: 300,
 *   overlayThreshold: 800,
 *   modalThreshold: 3000,
 *   timeout: 30000,
 * };
 *
 * // Progress state
 * const progress: ProgressState = {
 *   type: 'determinate',
 *   value: 65,
 *   message: 'Processing files...',
 * };
 *
 * // Theme customization
 * const theme: FeedbackTheme = {
 *   color: 'primary',
 *   size: 'md',
 *   animationSpeed: 'normal',
 * };
 * ```
 *
 * @module feedback/types
 */

/**
 * Escalation levels based on operation duration.
 *
 * - 'none': Operation completed quickly, no feedback shown (< inlineThreshold)
 * - 'inline': Subtle inline spinner within the component (inlineThreshold to overlayThreshold)
 * - 'overlay': Semi-transparent overlay with spinner (overlayThreshold to modalThreshold)
 * - 'modal': Modal panel with progress bar and cancel button (>= modalThreshold)
 */
export type EscalationLevel = 'none' | 'inline' | 'overlay' | 'modal';

/**
 * Operation status values.
 *
 * - 'pending': Operation created but not yet started
 * - 'running': Operation is currently executing
 * - 'completed': Operation finished successfully
 * - 'failed': Operation encountered an error
 * - 'cancelled': Operation was cancelled by user or parent
 */
export type OperationStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * Progress type for operations.
 *
 * - 'indeterminate': Duration unknown, shown as spinner
 * - 'determinate': Progress can be measured (0-100%), shown as progress bar
 */
export type ProgressType = 'indeterminate' | 'determinate';

/**
 * Progress information for an operation.
 */
export interface ProgressState {
  /** Type of progress display */
  type: ProgressType;
  /** Progress value (0-100) for determinate progress */
  value?: number;
  /** Optional status message to display */
  message?: string;
}

/**
 * Escalation threshold configuration.
 *
 * Defines the duration thresholds (in milliseconds) at which
 * feedback escalates to the next level.
 */
export interface EscalationConfig {
  /** Threshold for inline spinner (default: 200ms) */
  inlineThreshold: number;
  /** Threshold for overlay spinner (default: 500ms) */
  overlayThreshold: number;
  /** Threshold for modal dialog (default: 2000ms) */
  modalThreshold: number;
  /** Optional operation timeout in milliseconds */
  timeout?: number;
}

/**
 * Default escalation configuration values.
 */
export const DEFAULT_ESCALATION_CONFIG: EscalationConfig = {
  inlineThreshold: 200,
  overlayThreshold: 500,
  modalThreshold: 2000,
};

/**
 * Operation state tracked by OperationManager.
 */
export interface OperationState {
  /** Unique identifier for the operation */
  id: string;
  /** Current status of the operation */
  status: OperationStatus;
  /** Current escalation level based on duration */
  escalationLevel: EscalationLevel;
  /** Progress information */
  progress: ProgressState;
  /** Error if operation failed */
  error?: Error;
  /** Timestamp when operation started (ms since epoch) */
  startTime: number;
  /** Parent operation ID for hierarchical operations */
  parentId?: string;
  /** Child operation IDs */
  childIds: string[];
  /** Escalation configuration for this operation */
  config: EscalationConfig;
  /** Result data when operation completes */
  result?: unknown;
}

/**
 * Cancellation token interface.
 *
 * Provides a mechanism to signal that an operation should be aborted.
 * Supports multiple callback registrations for cleanup.
 */
export interface CancellationToken {
  /** Whether cancellation has been requested */
  readonly isCancelled: boolean;
  /** Register a callback to be called when cancellation is requested */
  onCancel: (callback: () => void) => () => void;
  /** Request cancellation of the operation */
  cancel: () => void;
}

/**
 * Handle returned when starting an operation.
 *
 * Provides methods to update progress, complete, or fail the operation.
 */
export interface OperationHandle {
  /** Unique identifier for the operation */
  id: string;
  /** Cancellation token for this operation */
  cancellationToken: CancellationToken;
  /** Update operation progress */
  updateProgress: (progress: Partial<ProgressState>) => void;
  /** Mark operation as completed */
  complete: (result?: unknown) => void;
  /** Mark operation as failed */
  fail: (error: Error) => void;
}

/**
 * Internal state structure for OperationManager.
 */
export interface OperationRegistry {
  /** Map of operation ID to operation state */
  operations: Map<string, OperationState>;
  /** Map of operation ID to escalation timers */
  timers: Map<string, ReturnType<typeof setTimeout>[]>;
  /** Map of operation ID to state change subscribers */
  subscriptions: Map<string, Set<(state: OperationState) => void>>;
}

/**
 * Options for starting a new operation.
 */
export interface StartOperationOptions {
  /** Custom operation ID (auto-generated if not provided) */
  id?: string;
  /** Parent operation ID for hierarchical operations */
  parentId?: string;
  /** Custom escalation configuration */
  config?: Partial<EscalationConfig>;
}

/**
 * Event payload from Tauri backend for progress updates.
 */
export interface TauriProgressEvent {
  /** Operation ID this event relates to */
  operationId: string;
  /** Type of event */
  type: 'progress' | 'complete' | 'error' | 'cancelled';
  /** Progress information */
  progress?: {
    current: number;
    total: number;
    message?: string;
  };
  /** Error message if type is 'error' */
  error?: string;
  /** Result data if type is 'complete' */
  result?: unknown;
}

/**
 * Color variants for feedback components.
 *
 * Maps to Tailwind CSS color classes in the Symphony theme system.
 */
export type FeedbackColorVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'destructive'
  | 'success'
  | 'warning';

/**
 * Size variants for feedback components.
 */
export type FeedbackSizeVariant = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Animation speed variants for feedback components.
 */
export type FeedbackAnimationSpeed = 'slow' | 'normal' | 'fast' | 'none';

/**
 * Theme configuration for feedback components.
 *
 * Allows customization of colors, sizes, and animations
 * to integrate with the Symphony theme system.
 *
 * **Validates: Requirements 7.3**
 */
export interface FeedbackTheme {
  /** Color variant for spinners and progress indicators */
  color?: FeedbackColorVariant;
  /** Size variant for components */
  size?: FeedbackSizeVariant;
  /** Animation speed for spinners and transitions */
  animationSpeed?: FeedbackAnimationSpeed;
  /** Custom CSS class for additional styling */
  customClass?: string;
  /** Whether to use reduced motion (accessibility) */
  reducedMotion?: boolean;
  /** Border radius variant */
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  /** Overlay opacity (0-100) for overlay components */
  overlayOpacity?: number;
  /** Progress bar height in pixels */
  progressBarHeight?: number;
}

/**
 * Default theme configuration for feedback components.
 */
export const DEFAULT_FEEDBACK_THEME: FeedbackTheme = {
  color: 'primary',
  size: 'md',
  animationSpeed: 'normal',
  reducedMotion: false,
  borderRadius: 'md',
  overlayOpacity: 60,
  progressBarHeight: 8,
};

/**
 * Props interface for theme-aware feedback components.
 *
 * Components implementing this interface accept theme customization.
 */
export interface ThemeableComponentProps {
  /** Theme configuration for the component */
  theme?: Partial<FeedbackTheme>;
}
