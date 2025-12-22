/**
 * @fileoverview TreeSkeleton component for loading tree views
 *
 * Displays a skeleton placeholder that mimics the layout of a tree view
 * while content is loading. Supports configurable depth and item count.
 *
 * @module feedback/components/skeletons/TreeSkeleton
 *
 * **Validates: Requirements 5.1, 5.2, 7.3**
 */

import * as React from 'react';
import { cn } from '@symphony/shared';
import { Skeleton } from '../../../components/skeleton';
import type { FeedbackTheme } from '../../types';
import { useFeedbackTheme, mergeThemes, getBorderRadiusClass, getAnimationClass } from '../../FeedbackThemeContext';

/**
 * Props for TreeSkeleton component
 */
export interface TreeSkeletonProps {
  /** Number of root-level items to display */
  itemCount?: number;
  /** Maximum depth of nested items */
  maxDepth?: number;
  /** Whether to show expand/collapse icons */
  showIcons?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Test identifier */
  'data-testid'?: string;
  /** Theme configuration for customization */
  theme?: Partial<FeedbackTheme>;
}

/**
 * Generates a deterministic pattern of children for skeleton items
 * based on index to create a realistic tree appearance
 */
function getChildPattern(index: number, depth: number, maxDepth: number): number[] {
  if (depth >= maxDepth) return [];
  
  // Create a varied but deterministic pattern
  const patterns = [
    [2, 1],
    [3],
    [1, 2],
    [2],
    [],
  ];
  
  return patterns[index % patterns.length] || [];
}

/**
 * Renders a single skeleton tree item with optional children
 */
function TreeSkeletonItem({
  depth,
  maxDepth,
  index,
  showIcons,
  borderRadiusClass,
}: {
  depth: number;
  maxDepth: number;
  index: number;
  showIcons: boolean;
  borderRadiusClass: string;
}) {
  const childPattern = getChildPattern(index, depth, maxDepth);
  const hasChildren = childPattern.length > 0;
  const indent = depth * 16;
  
  // Vary the width of skeleton items for realism
  const widths = ['w-24', 'w-32', 'w-28', 'w-20', 'w-36'];
  const width = widths[(index + depth) % widths.length];

  return (
    <div className="space-y-1">
      <div
        className="flex items-center gap-2 py-1"
        style={{ paddingLeft: `${indent}px` }}
      >
        {showIcons && (
          <Skeleton className={cn('h-4 w-4 flex-shrink-0', borderRadiusClass === 'rounded-full' ? 'rounded-full' : 'rounded-sm')} />
        )}
        {hasChildren && (
          <Skeleton className={cn('h-3 w-3 flex-shrink-0', borderRadiusClass === 'rounded-full' ? 'rounded-full' : 'rounded-sm')} />
        )}
        <Skeleton className={cn('h-4', borderRadiusClass, width)} />
      </div>
      {childPattern.map((childCount, childIndex) => (
        <React.Fragment key={childIndex}>
          {Array.from({ length: childCount }).map((_, i) => (
            <TreeSkeletonItem
              key={`${depth}-${childIndex}-${i}`}
              depth={depth + 1}
              maxDepth={maxDepth}
              index={i}
              showIcons={showIcons}
              borderRadiusClass={borderRadiusClass}
            />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}

/**
 * TreeSkeleton component
 *
 * Displays a skeleton placeholder that mimics the layout of a tree view
 * component while content is loading. Supports theme customization.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <TreeSkeleton />
 *
 * // Custom configuration
 * <TreeSkeleton itemCount={5} maxDepth={3} showIcons />
 *
 * // With theme customization
 * <TreeSkeleton
 *   itemCount={4}
 *   theme={{ borderRadius: 'lg', animationSpeed: 'slow' }}
 * />
 * ```
 */
export function TreeSkeleton({
  itemCount = 4,
  maxDepth = 2,
  showIcons = true,
  className,
  'data-testid': testId = 'tree-skeleton',
  theme: componentTheme,
}: TreeSkeletonProps) {
  const { theme: globalTheme } = useFeedbackTheme();
  const mergedTheme = mergeThemes(globalTheme, componentTheme);

  // Get theme-based classes
  const borderRadiusClass = getBorderRadiusClass(mergedTheme.borderRadius);
  const animationClass = getAnimationClass(mergedTheme.animationSpeed, mergedTheme.reducedMotion);

  return (
    <div
      className={cn('space-y-1 p-2', animationClass, mergedTheme.customClass, className)}
      role="status"
      aria-label="Loading tree content"
      data-testid={testId}
      data-skeleton-type="tree"
    >
      {Array.from({ length: itemCount }).map((_, index) => (
        <TreeSkeletonItem
          key={index}
          depth={0}
          maxDepth={maxDepth}
          index={index}
          showIcons={showIcons}
          borderRadiusClass={borderRadiusClass}
        />
      ))}
      <span className="sr-only">Loading tree content...</span>
    </div>
  );
}

export default TreeSkeleton;
