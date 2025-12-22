/**
 * Feedback UI Components
 *
 * Visual components for the Progressive Feedback System. These components
 * provide the UI layer for displaying operation feedback at different
 * escalation levels.
 *
 * ## Component Overview
 *
 * ### Loading Indicators
 * - {@link InlineSpinner} - Subtle inline spinner for 200-500ms operations
 * - {@link OverlaySpinner} - Semi-transparent overlay for 500ms-2s operations
 * - {@link ModalProgress} - Modal dialog for operations > 2s
 *
 * ### Wrapper Components
 * - {@link OperationFeedback} - Automatically renders appropriate feedback based on escalation level
 * - {@link FeedbackErrorBoundary} - Error boundary for graceful degradation
 *
 * ### Error Handling
 * - {@link ErrorFeedback} - Error display with dismiss and retry functionality
 *
 * ### Skeleton Placeholders
 * - {@link TreeSkeleton} - Skeleton for tree view components
 * - {@link TableSkeleton} - Skeleton for table components
 * - {@link ListSkeleton} - Skeleton for list components
 *
 * ## Usage Examples
 *
 * ### Basic Spinner
 * ```tsx
 * import { InlineSpinner } from '@symphony/ui/feedback';
 *
 * <Button>
 *   <InlineSpinner size="xs" className="mr-2" />
 *   Loading...
 * </Button>
 * ```
 *
 * ### Overlay with Progress
 * ```tsx
 * import { OverlaySpinner } from '@symphony/ui/feedback';
 *
 * <div className="relative">
 *   <Content />
 *   <OverlaySpinner
 *     visible={isLoading}
 *     progress={{ type: 'determinate', value: 65, message: 'Processing...' }}
 *   />
 * </div>
 * ```
 *
 * ### Modal Progress
 * ```tsx
 * import { ModalProgress } from '@symphony/ui/feedback';
 *
 * <ModalProgress
 *   open={isLoading}
 *   title="Uploading Files"
 *   progress={{ type: 'determinate', value: 45, message: 'Uploading file 2 of 5...' }}
 *   onCancel={handleCancel}
 *   canCancel={true}
 * />
 * ```
 *
 * @module feedback/components
 */

export * from './InlineSpinner';
export * from './OverlaySpinner';
export * from './ModalProgress';
export * from './OperationFeedback';
export * from './ErrorFeedback';
export * from './FeedbackErrorBoundary';
export * from './skeletons';
