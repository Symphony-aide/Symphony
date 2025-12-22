/**
 * @fileoverview Property-based tests for skeleton to content transition
 *
 * **Feature: progressive-feedback-system, Property 9: Skeleton to content transition**
 *
 * These tests verify that components displaying skeleton placeholders
 * correctly transition to actual content when loading completes.
 *
 * **Validates: Requirements 5.1, 5.3**
 */

import { describe, it, expect, afterEach } from 'vitest';
import * as fc from 'fast-check';
import * as React from 'react';
import { render, cleanup } from '@testing-library/react';
import {
  TreeSkeleton,
  TableSkeleton,
  ListSkeleton,
} from '../../feedback/components/skeletons';
import type { ListItemLayout } from '../../feedback/components/skeletons/ListSkeleton';

afterEach(() => {
  cleanup();
});

describe('Property 9: Skeleton to content transition', () => {
  describe('TreeSkeleton displays and transitions correctly', () => {
    it('should display skeleton with correct structure for any valid configuration', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 0, max: 2 }),
          fc.boolean(),
          (itemCount, maxDepth, showIcons) => {
            cleanup();

            const { container, queryByTestId } = render(
              <TreeSkeleton
                itemCount={itemCount}
                maxDepth={maxDepth}
                showIcons={showIcons}
              />
            );

            // Skeleton should be present
            const skeleton = queryByTestId('tree-skeleton');
            expect(skeleton).toBeTruthy();
            expect(skeleton?.getAttribute('data-skeleton-type')).toBe('tree');
            expect(skeleton?.getAttribute('role')).toBe('status');

            // Should have skeleton elements (animate-pulse class from base Skeleton)
            const skeletonElements = container.querySelectorAll('.animate-pulse');
            expect(skeletonElements.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should be replaced when content is rendered instead', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
          (itemCount, contentItems) => {
            cleanup();

            // Render skeleton first
            const { container, rerender, queryByTestId } = render(
              <TreeSkeleton itemCount={itemCount} />
            );

            // Verify skeleton is present
            expect(queryByTestId('tree-skeleton')).toBeTruthy();

            // Simulate loading complete - replace with actual content
            rerender(
              <div data-testid="tree-content">
                {contentItems.map((item, index) => (
                  <div key={index} className="tree-item">{item}</div>
                ))}
              </div>
            );

            // Skeleton should be gone
            expect(queryByTestId('tree-skeleton')).toBeNull();

            // Content should be present
            expect(queryByTestId('tree-content')).toBeTruthy();
            const items = container.querySelectorAll('.tree-item');
            expect(items.length).toBe(contentItems.length);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('TableSkeleton displays and transitions correctly', () => {
    it('should display skeleton with correct structure for any valid configuration', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }),
          fc.integer({ min: 1, max: 10 }),
          fc.boolean(),
          fc.boolean(),
          (rowCount, columnCount, showHeader, showCheckbox) => {
            cleanup();

            const { container, queryByTestId } = render(
              <TableSkeleton
                rowCount={rowCount}
                columnCount={columnCount}
                showHeader={showHeader}
                showCheckbox={showCheckbox}
              />
            );

            // Skeleton should be present
            const skeleton = queryByTestId('table-skeleton');
            expect(skeleton).toBeTruthy();
            expect(skeleton?.getAttribute('data-skeleton-type')).toBe('table');
            expect(skeleton?.getAttribute('role')).toBe('status');

            // Should have skeleton elements
            const skeletonElements = container.querySelectorAll('.animate-pulse');
            expect(skeletonElements.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should be replaced when table content is rendered instead', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 1, max: 5 }),
          fc.array(
            fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 5 }),
            { minLength: 1, maxLength: 10 }
          ),
          (rowCount, columnCount, tableData) => {
            cleanup();

            // Render skeleton first
            const { container, rerender, queryByTestId } = render(
              <TableSkeleton rowCount={rowCount} columnCount={columnCount} />
            );

            // Verify skeleton is present
            expect(queryByTestId('table-skeleton')).toBeTruthy();

            // Simulate loading complete - replace with actual table
            rerender(
              <table data-testid="table-content">
                <tbody>
                  {tableData.map((row, rowIndex) => (
                    <tr key={rowIndex} className="table-row">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="table-cell">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            );

            // Skeleton should be gone
            expect(queryByTestId('table-skeleton')).toBeNull();

            // Content should be present
            expect(queryByTestId('table-content')).toBeTruthy();
            const rows = container.querySelectorAll('.table-row');
            expect(rows.length).toBe(tableData.length);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('ListSkeleton displays and transitions correctly', () => {
    const layoutArbitrary = fc.constantFrom<ListItemLayout>('simple', 'detailed', 'avatar');

    it('should display skeleton with correct structure for any valid configuration', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }),
          layoutArbitrary,
          fc.boolean(),
          (itemCount, layout, showDividers) => {
            cleanup();

            const { container, queryByTestId } = render(
              <ListSkeleton
                itemCount={itemCount}
                layout={layout}
                showDividers={showDividers}
              />
            );

            // Skeleton should be present
            const skeleton = queryByTestId('list-skeleton');
            expect(skeleton).toBeTruthy();
            expect(skeleton?.getAttribute('data-skeleton-type')).toBe('list');
            expect(skeleton?.getAttribute('data-skeleton-layout')).toBe(layout);
            expect(skeleton?.getAttribute('role')).toBe('status');

            // Should have skeleton elements
            const skeletonElements = container.querySelectorAll('.animate-pulse');
            expect(skeletonElements.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should be replaced when list content is rendered instead', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          layoutArbitrary,
          fc.array(
            fc.record({
              title: fc.string({ minLength: 1, maxLength: 20 }),
              description: fc.string({ minLength: 0, maxLength: 50 }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (itemCount, layout, listItems) => {
            cleanup();

            // Render skeleton first
            const { container, rerender, queryByTestId } = render(
              <ListSkeleton itemCount={itemCount} layout={layout} />
            );

            // Verify skeleton is present
            expect(queryByTestId('list-skeleton')).toBeTruthy();

            // Simulate loading complete - replace with actual list
            rerender(
              <ul data-testid="list-content">
                {listItems.map((item, index) => (
                  <li key={index} className="list-item">
                    <span className="item-title">{item.title}</span>
                    {item.description && (
                      <span className="item-description">{item.description}</span>
                    )}
                  </li>
                ))}
              </ul>
            );

            // Skeleton should be gone
            expect(queryByTestId('list-skeleton')).toBeNull();

            // Content should be present
            expect(queryByTestId('list-content')).toBeTruthy();
            const items = container.querySelectorAll('.list-item');
            expect(items.length).toBe(listItems.length);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Skeleton accessibility', () => {
    it('all skeleton types should have proper accessibility attributes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('tree', 'table', 'list'),
          (skeletonType) => {
            cleanup();

            let skeleton: ReturnType<typeof render>;

            switch (skeletonType) {
              case 'tree':
                skeleton = render(<TreeSkeleton />);
                break;
              case 'table':
                skeleton = render(<TableSkeleton />);
                break;
              case 'list':
                skeleton = render(<ListSkeleton />);
                break;
              default:
                throw new Error(`Unknown skeleton type: ${skeletonType}`);
            }

            const element = skeleton.queryByTestId(`${skeletonType}-skeleton`);
            expect(element).toBeTruthy();

            // Should have role="status" for screen readers
            expect(element?.getAttribute('role')).toBe('status');

            // Should have aria-label
            expect(element?.getAttribute('aria-label')).toBeTruthy();

            // Should have sr-only text for screen readers
            const srOnly = skeleton.container.querySelector('.sr-only');
            expect(srOnly).toBeTruthy();
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Conditional skeleton rendering', () => {
    it('should correctly show/hide skeleton based on loading state', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
          (isLoading, contentItems) => {
            cleanup();

            // Component that conditionally renders skeleton or content
            const TestComponent = ({ loading, items }: { loading: boolean; items: string[] }) => {
              if (loading) {
                return <ListSkeleton itemCount={items.length || 3} />;
              }
              return (
                <ul data-testid="actual-content">
                  {items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              );
            };

            const { queryByTestId } = render(
              <TestComponent loading={isLoading} items={contentItems} />
            );

            if (isLoading) {
              // Skeleton should be visible
              expect(queryByTestId('list-skeleton')).toBeTruthy();
              expect(queryByTestId('actual-content')).toBeNull();
            } else {
              // Content should be visible
              expect(queryByTestId('list-skeleton')).toBeNull();
              expect(queryByTestId('actual-content')).toBeTruthy();
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
