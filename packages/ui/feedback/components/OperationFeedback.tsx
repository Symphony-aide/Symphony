/**
 * OperationFeedback - Wrapper component for automatic feedback rendering
 *
 * Automatically renders appropriate feedback based on operation escalation level.
 * Handles transitions between levels smoothly.
 *
 * @module feedback/components/OperationFeedback
 *
 * **Validates: Requirements 1.1, 1.3, 1.4, 1.5, 7.3**
 */

import * as React from 'react';
import { cn } from '@symphony/shared';
import { InlineSpinner } from './InlineSpinner';
import { OverlaySpinner } from './OverlaySpinner';
import { ModalProgress } from './ModalProgress';
import type { OperationState, EscalationLevel, FeedbackTheme } from '../types';
import { getOperationManager } from '../OperationManager';

export interface OperationFeedbackProps {
  /** Operation ID to track */
  operationId: string;
  /** Children to render */
  children: React.ReactNode;
  /** Fallback content to show during loading (optional) */
  fallback?: React.ReactNode;
  /** Additional class name for the wrapper */
  className?: string;
  /** Callback when cancel is requested */
  onCancel?: () => void;
  /** Title for modal progress (optional) */
  modalTitle?: string;
  /** Theme configuration for customization */
  theme?: Partial<FeedbackTheme>;
}

/**
 * OperationFeedback component that automatically renders appropriate feedback
 * based on the operation's escalation level.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <OperationFeedback operationId="my-operation">
 *   <MyComponent />
 * </OperationFeedback>
 *
 * // With custom modal title
 * <OperationFeedback
 *   operationId="file-upload"
 *   modalTitle="Uploading Files"
 *   onCancel={handleCancel}
 * >
 *   <FileUploader />
 * </OperationFeedback>
 *
 * // With theme customization
 * <OperationFeedback
 *   operationId="data-sync"
 *   theme={{ color: 'secondary', animationSpeed: 'fast' }}
 * >
 *   <DataSync />
 * </OperationFeedback>
 * ```
 */
export const OperationFeedback: React.FC<OperationFeedbackProps> = ({
  operationId,
  children,
  fallback,
  className,
  onCancel,
  modalTitle,
  theme,
}) => {
  const [operationState, setOperationState] = React.useState<OperationState | undefined>();
  const manager = getOperationManager();

  React.useEffect(() => {
    const unsubscribe = manager.subscribe(operationId, (state) => {
      setOperationState(state);
    });

    // Get initial state
    const initialState = manager.getOperation(operationId);
    if (initialState) {
      setOperationState(initialState);
    }

    return unsubscribe;
  }, [operationId, manager]);

  const handleCancel = React.useCallback(() => {
    manager.cancelOperation(operationId);
    onCancel?.();
  }, [operationId, manager, onCancel]);

  // Determine what to render based on escalation level
  const escalationLevel = operationState?.escalationLevel ?? 'none';
  const isRunning = operationState?.status === 'running';
  const progress = operationState?.progress ?? { type: 'indeterminate' as const };

  // If operation is not running or escalation is 'none', just render children
  if (!isRunning || escalationLevel === 'none') {
    return <>{children}</>;
  }

  // Render based on escalation level
  return (
    <div className={cn('relative', className)}>
      {children}

      {/* Inline spinner - shown at inline level */}
      {escalationLevel === 'inline' && (
        <div className="absolute top-1/2 right-2 -translate-y-1/2">
          <InlineSpinner size="sm" theme={theme} />
        </div>
      )}

      {/* Overlay spinner - shown at overlay level */}
      {escalationLevel === 'overlay' && (
        <OverlaySpinner
          visible={true}
          progress={progress}
          message={progress.message}
          theme={theme}
        />
      )}

      {/* Modal progress - shown at modal level */}
      {escalationLevel === 'modal' && (
        <ModalProgress
          open={true}
          title={modalTitle}
          progress={progress}
          onCancel={handleCancel}
          canCancel={true}
          theme={theme}
        />
      )}
    </div>
  );
};

OperationFeedback.displayName = 'OperationFeedback';

/**
 * Hook to get operation state for custom feedback rendering.
 *
 * @param operationId - Operation ID to track
 * @returns Current operation state or undefined
 */
export function useOperationState(operationId: string): OperationState | undefined {
  const [state, setState] = React.useState<OperationState | undefined>();
  const manager = getOperationManager();

  React.useEffect(() => {
    const unsubscribe = manager.subscribe(operationId, setState);
    const initialState = manager.getOperation(operationId);
    if (initialState) {
      setState(initialState);
    }
    return unsubscribe;
  }, [operationId, manager]);

  return state;
}

/**
 * Helper function to determine if feedback should be shown for an escalation level.
 *
 * @param level - Current escalation level
 * @returns True if feedback should be displayed
 */
export function shouldShowFeedback(level: EscalationLevel): boolean {
  return level !== 'none';
}

/**
 * Helper function to get the appropriate feedback component type for an escalation level.
 *
 * @param level - Current escalation level
 * @returns Component type string
 */
export function getFeedbackType(level: EscalationLevel): 'none' | 'inline' | 'overlay' | 'modal' {
  return level;
}