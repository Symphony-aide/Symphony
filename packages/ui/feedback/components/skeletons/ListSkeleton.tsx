/**
 * @fileoverview ListSkeleton component for loading list views
 *
 * Displays a skeleton placeholder that mimics the layout of a list
 * while content is loading. Supports various list item layouts.
 *
 * @module feedback/components/skeletons/ListSkeleton
 *
 * **Validates: Requirements 5.1, 5.2, 7.3**
 */

import * as React from 'react';
import { cn } from '@symphony/shared';
import { Skeleton } from '../../../components/skeleton';
import type { FeedbackTheme } from '../../types';
import { useFeedbackTheme, mergeThemes, getBorderRadiusClass, getAnimationClass } from '../../FeedbackThemeContext';

/**
 * List item layout variants
 */
export type ListItemLayout = 'simple' | 'detailed' | 'avatar';

/**
 * Props for ListSkeleton component
 */
export interface ListSkeletonProps {
  /** Number of items to display */
  itemCount?: number;
  /** Layout variant for list items */
  layout?: ListItemLayout;
  /** Whether to show dividers between items */
  showDividers?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Test identifier */
  'data-testid'?: string;
  /** Theme configuration for customization */
  theme?: Partial<FeedbackTheme>;
}

/**
 * Width patterns for realistic list item appearance
 */
const TITLE_WIDTHS = ['w-32', 'w-40', 'w-36', 'w-28', 'w-44'];
const DESCRIPTION_WIDTHS = ['w-48', 'w-56', 'w-52', 'w-44', 'w-60'];

/**
 * Renders a simple list item skeleton (single line)
 */
function SimpleListItem({ index, borderRadiusClass }: { index: number; borderRadiusClass: string }) {
  const width = TITLE_WIDTHS[index % TITLE_WIDTHS.length];
  
  return (
    <div className="flex items-center py-2 px-3">
      <Skeleton className={cn('h-4', borderRadiusClass, width)} />
    </div>
  );
}

/**
 * Renders a detailed list item skeleton (title + description)
 */
function DetailedListItem({ index, borderRadiusClass }: { index: number; borderRadiusClass: string }) {
  const titleWidth = TITLE_WIDTHS[index % TITLE_WIDTHS.length];
  const descWidth = DESCRIPTION_WIDTHS[index % DESCRIPTION_WIDTHS.length];
  
  return (
    <div className="flex flex-col gap-2 py-3 px-3">
      <Skeleton className={cn('h-4', borderRadiusClass, titleWidth)} />
      <Skeleton className={cn('h-3', borderRadiusClass, descWidth)} />
    </div>
  );
}

/**
 * Renders an avatar list item skeleton (avatar + title + description)
 */
function AvatarListItem({ index, borderRadiusClass }: { index: number; borderRadiusClass: string }) {
  const titleWidth = TITLE_WIDTHS[index % TITLE_WIDTHS.length];
  const descWidth = DESCRIPTION_WIDTHS[index % DESCRIPTION_WIDTHS.length];
  
  return (
    <div className="flex items-start gap-3 py-3 px-3">
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      <div className="flex flex-col gap-2 flex-1">
        <Skeleton className={cn('h-4', borderRadiusClass, titleWidth)} />
        <Skeleton className={cn('h-3', borderRadiusClass, descWidth)} />
      </div>
    </div>
  );
}

/**
 * ListSkeleton component
 *
 * Displays a skeleton placeholder that mimics the layout of a list
 * component while content is loading. Supports theme customization.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ListSkeleton />
 *
 * // With avatar layout
 * <ListSkeleton layout="avatar" itemCount={5} />
 *
 * // Detailed layout with dividers
 * <ListSkeleton layout="detailed" showDividers />
 *
 * // With theme customization
 * <ListSkeleton
 *   layout="detailed"
 *   theme={{ borderRadius: 'lg', animationSpeed: 'slow' }}
 * />
 * ```
 */
export function ListSkeleton({
  itemCount = 5,
  layout = 'simple',
  showDividers = false,
  className,
  'data-testid': testId = 'list-skeleton',
  theme: componentTheme,
}: ListSkeletonProps) {
  const { theme: globalTheme } = useFeedbackTheme();
  const mergedTheme = mergeThemes(globalTheme, componentTheme);

  // Get theme-based classes
  const borderRadiusClass = getBorderRadiusClass(mergedTheme.borderRadius);
  const animationClass = getAnimationClass(mergedTheme.animationSpeed, mergedTheme.reducedMotion);

  const renderItem = (index: number) => {
    switch (layout) {
      case 'avatar':
        return <AvatarListItem index={index} borderRadiusClass={borderRadiusClass} />;
      case 'detailed':
        return <DetailedListItem index={index} borderRadiusClass={borderRadiusClass} />;
      case 'simple':
      default:
        return <SimpleListItem index={index} borderRadiusClass={borderRadiusClass} />;
    }
  };

  return (
    <div
      className={cn('w-full', animationClass, mergedTheme.customClass, className)}
      role="status"
      aria-label="Loading list content"
      data-testid={testId}
      data-skeleton-type="list"
      data-skeleton-layout={layout}
    >
      {Array.from({ length: itemCount }).map((_, index) => (
        <React.Fragment key={index}>
          {renderItem(index)}
          {showDividers && index < itemCount - 1 && (
            <div className="border-b mx-3" />
          )}
        </React.Fragment>
      ))}
      <span className="sr-only">Loading list content...</span>
    </div>
  );
}

export default ListSkeleton;
