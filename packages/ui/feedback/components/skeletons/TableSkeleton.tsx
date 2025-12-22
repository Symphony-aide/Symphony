/**
 * @fileoverview TableSkeleton component for loading table views
 *
 * Displays a skeleton placeholder that mimics the layout of a table
 * while content is loading. Supports configurable rows and columns.
 *
 * @module feedback/components/skeletons/TableSkeleton
 *
 * **Validates: Requirements 5.1, 5.2, 7.3**
 */

import * as React from 'react';
import { cn } from '@symphony/shared';
import { Skeleton } from '../../../components/skeleton';
import type { FeedbackTheme } from '../../types';
import { useFeedbackTheme, mergeThemes, getBorderRadiusClass, getAnimationClass } from '../../FeedbackThemeContext';

/**
 * Props for TableSkeleton component
 */
export interface TableSkeletonProps {
  /** Number of rows to display */
  rowCount?: number;
  /** Number of columns to display */
  columnCount?: number;
  /** Whether to show a header row */
  showHeader?: boolean;
  /** Whether to show row selection checkboxes */
  showCheckbox?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Test identifier */
  'data-testid'?: string;
  /** Theme configuration for customization */
  theme?: Partial<FeedbackTheme>;
}

/**
 * Column width patterns for realistic table appearance
 */
const COLUMN_WIDTHS = ['w-16', 'w-24', 'w-32', 'w-20', 'w-28', 'w-36'];

/**
 * Gets a deterministic width class for a column
 */
function getColumnWidth(columnIndex: number): string {
  return COLUMN_WIDTHS[columnIndex % COLUMN_WIDTHS.length];
}

/**
 * TableSkeleton component
 *
 * Displays a skeleton placeholder that mimics the layout of a table
 * component while content is loading. Supports theme customization.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <TableSkeleton />
 *
 * // Custom configuration
 * <TableSkeleton rowCount={10} columnCount={5} showHeader showCheckbox />
 *
 * // With theme customization
 * <TableSkeleton
 *   rowCount={5}
 *   theme={{ borderRadius: 'lg', animationSpeed: 'slow' }}
 * />
 * ```
 */
export function TableSkeleton({
  rowCount = 5,
  columnCount = 4,
  showHeader = true,
  showCheckbox = false,
  className,
  'data-testid': testId = 'table-skeleton',
  theme: componentTheme,
}: TableSkeletonProps) {
  const { theme: globalTheme } = useFeedbackTheme();
  const mergedTheme = mergeThemes(globalTheme, componentTheme);

  // Get theme-based classes
  const borderRadiusClass = getBorderRadiusClass(mergedTheme.borderRadius);
  const animationClass = getAnimationClass(mergedTheme.animationSpeed, mergedTheme.reducedMotion);

  const totalColumns = showCheckbox ? columnCount + 1 : columnCount;

  return (
    <div
      className={cn('w-full', animationClass, mergedTheme.customClass, className)}
      role="status"
      aria-label="Loading table content"
      data-testid={testId}
      data-skeleton-type="table"
    >
      <div className={cn('border', borderRadiusClass)}>
        {/* Header row */}
        {showHeader && (
          <div className="flex items-center gap-4 p-3 border-b bg-muted/50">
            {showCheckbox && (
              <Skeleton className={cn('h-4 w-4 flex-shrink-0', borderRadiusClass === 'rounded-full' ? 'rounded-full' : 'rounded-sm')} />
            )}
            {Array.from({ length: columnCount }).map((_, colIndex) => (
              <Skeleton
                key={`header-${colIndex}`}
                className={cn('h-4', borderRadiusClass, getColumnWidth(colIndex))}
              />
            ))}
          </div>
        )}

        {/* Data rows */}
        {Array.from({ length: rowCount }).map((_, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className={cn(
              'flex items-center gap-4 p-3',
              rowIndex < rowCount - 1 && 'border-b'
            )}
          >
            {showCheckbox && (
              <Skeleton className={cn('h-4 w-4 flex-shrink-0', borderRadiusClass === 'rounded-full' ? 'rounded-full' : 'rounded-sm')} />
            )}
            {Array.from({ length: columnCount }).map((_, colIndex) => {
              // Vary row content widths slightly for realism
              const baseWidth = getColumnWidth(colIndex);
              const widthVariant = (rowIndex + colIndex) % 3 === 0 ? 'w-3/4' : '';
              
              return (
                <div key={`cell-${rowIndex}-${colIndex}`} className={cn('flex-1', baseWidth)}>
                  <Skeleton
                    className={cn(
                      'h-4',
                      borderRadiusClass,
                      widthVariant || 'w-full'
                    )}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <span className="sr-only">Loading table content...</span>
    </div>
  );
}

export default TableSkeleton;
