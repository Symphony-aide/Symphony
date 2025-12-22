/**
 * Skeleton Components for Progressive Feedback System
 *
 * Provides skeleton placeholder components that mimic the layout of
 * content being loaded. Skeletons improve perceived performance by
 * showing users what content is coming before it loads.
 *
 * ## Available Skeletons
 *
 * ### TreeSkeleton
 * Mimics a hierarchical tree view with expandable nodes.
 *
 * ```tsx
 * import { TreeSkeleton } from '@symphony/ui/feedback';
 *
 * <TreeSkeleton itemCount={5} maxDepth={3} showIcons />
 * ```
 *
 * ### TableSkeleton
 * Mimics a data table with rows and columns.
 *
 * ```tsx
 * import { TableSkeleton } from '@symphony/ui/feedback';
 *
 * <TableSkeleton rowCount={10} columnCount={5} showHeader showCheckbox />
 * ```
 *
 * ### ListSkeleton
 * Mimics a list with various item layouts.
 *
 * ```tsx
 * import { ListSkeleton } from '@symphony/ui/feedback';
 *
 * // Simple list
 * <ListSkeleton itemCount={5} layout="simple" />
 *
 * // Avatar list (like a contact list)
 * <ListSkeleton itemCount={5} layout="avatar" />
 *
 * // Detailed list (title + description)
 * <ListSkeleton itemCount={5} layout="detailed" showDividers />
 * ```
 *
 * ## Theme Support
 *
 * All skeleton components support theme customization:
 *
 * ```tsx
 * <TreeSkeleton
 *   theme={{
 *     borderRadius: 'lg',
 *     animationSpeed: 'slow',
 *     customClass: 'my-custom-class',
 *   }}
 * />
 * ```
 *
 * @module feedback/components/skeletons
 *
 * **Validates: Requirements 5.1, 5.2**
 */

export * from './TreeSkeleton';
export * from './TableSkeleton';
export * from './ListSkeleton';
