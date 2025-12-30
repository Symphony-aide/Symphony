/**
 * @fileoverview Property-based tests for UI layout components (Box, Flex, Grid)
 *
 * These tests use fast-check to verify universal properties that should hold
 * across all valid inputs to the layout components.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import * as React from 'react';
import { Box } from '../../components/box';

// Arbitrary generators for Box component props
const paddingArb = fc.constantFrom('none', 'sm', 'md', 'lg', 'xl', undefined);
const marginArb = fc.constantFrom('none', 'sm', 'md', 'lg', 'xl', undefined);
const displayArb = fc.constantFrom('block', 'inline', 'inline-block', 'flex', 'inline-flex', 'grid', undefined);

// Mapping from prop values to expected Tailwind classes
const paddingClassMap: Record<string, string> = {
  none: 'p-0',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
};

const marginClassMap: Record<string, string> = {
  none: 'm-0',
  sm: 'm-2',
  md: 'm-4',
  lg: 'm-6',
  xl: 'm-8',
};

const displayClassMap: Record<string, string> = {
  block: 'block',
  inline: 'inline',
  'inline-block': 'inline-block',
  flex: 'flex',
  'inline-flex': 'inline-flex',
  grid: 'grid',
};

/**
 * **Feature: ui-components-migration, Property 11: Box component applies layout props correctly**
 *
 * For any Box component with padding, margin, or display props, the rendered output
 * should have the corresponding CSS styles applied.
 *
 * **Validates: Requirements 6.1**
 */
describe('Property 11: Box component applies layout props correctly', () => {
  it('should apply padding classes correctly', () => {
    fc.assert(
      fc.property(paddingArb, (padding) => {
        const { container } = render(<Box padding={padding}>Content</Box>);
        const element = container.firstChild as HTMLElement;

        if (padding && padding !== 'none') {
          expect(element.className).toContain(paddingClassMap[padding]);
        } else if (padding === 'none') {
          expect(element.className).toContain('p-0');
        } else {
          // Default is 'none', so p-0 should be applied
          expect(element.className).toContain('p-0');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should apply margin classes correctly', () => {
    fc.assert(
      fc.property(marginArb, (margin) => {
        const { container } = render(<Box margin={margin}>Content</Box>);
        const element = container.firstChild as HTMLElement;

        if (margin && margin !== 'none') {
          expect(element.className).toContain(marginClassMap[margin]);
        } else if (margin === 'none') {
          expect(element.className).toContain('m-0');
        } else {
          // Default is 'none', so m-0 should be applied
          expect(element.className).toContain('m-0');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should apply display classes correctly', () => {
    fc.assert(
      fc.property(displayArb, (display) => {
        const { container } = render(<Box display={display}>Content</Box>);
        const element = container.firstChild as HTMLElement;

        if (display) {
          expect(element.className).toContain(displayClassMap[display]);
        } else {
          // Default is 'block'
          expect(element.className).toContain('block');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should apply all layout props together correctly', () => {
    fc.assert(
      fc.property(
        paddingArb,
        marginArb,
        displayArb,
        (padding, margin, display) => {
          const { container } = render(
            <Box padding={padding} margin={margin} display={display}>
              Content
            </Box>
          );
          const element = container.firstChild as HTMLElement;

          // Check padding
          const expectedPadding = padding || 'none';
          expect(element.className).toContain(paddingClassMap[expectedPadding]);

          // Check margin
          const expectedMargin = margin || 'none';
          expect(element.className).toContain(marginClassMap[expectedMargin]);

          // Check display
          const expectedDisplay = display || 'block';
          expect(element.className).toContain(displayClassMap[expectedDisplay]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should render as div by default', () => {
    fc.assert(
      fc.property(paddingArb, marginArb, displayArb, (padding, margin, display) => {
        const { container } = render(
          <Box padding={padding} margin={margin} display={display}>
            Content
          </Box>
        );
        const element = container.firstChild as HTMLElement;

        expect(element.tagName.toLowerCase()).toBe('div');
      }),
      { numRuns: 100 }
    );
  });

  it('should render with custom element type via as prop', () => {
    const elementTypes = ['div', 'section', 'article', 'main', 'aside', 'header', 'footer', 'nav'] as const;
    const elementTypeArb = fc.constantFrom(...elementTypes);

    fc.assert(
      fc.property(elementTypeArb, paddingArb, (elementType, padding) => {
        const { container } = render(
          <Box as={elementType} padding={padding}>
            Content
          </Box>
        );
        const element = container.firstChild as HTMLElement;

        expect(element.tagName.toLowerCase()).toBe(elementType);
      }),
      { numRuns: 100 }
    );
  });

  it('should merge custom className with variant classes', () => {
    fc.assert(
      fc.property(
        paddingArb,
        fc.stringMatching(/^[a-z][a-z0-9-]*$/),
        (padding, customClass) => {
          const { container } = render(
            <Box padding={padding} className={customClass}>
              Content
            </Box>
          );
          const element = container.firstChild as HTMLElement;

          expect(element.className).toContain(customClass);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should render children correctly', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 100 }), (content) => {
        const { container } = render(<Box>{content}</Box>);
        const element = container.firstChild as HTMLElement;

        expect(element.textContent).toBe(content);
      }),
      { numRuns: 100 }
    );
  });
});


import { Flex } from '../../components/flex';

// Arbitrary generators for Flex component props
const directionArb = fc.constantFrom('row', 'row-reverse', 'column', 'column-reverse', undefined);
const justifyArb = fc.constantFrom('start', 'end', 'center', 'between', 'around', 'evenly', undefined);
const alignArb = fc.constantFrom('start', 'end', 'center', 'baseline', 'stretch', undefined);
const wrapArb = fc.constantFrom('nowrap', 'wrap', 'wrap-reverse', undefined);
const gapArb = fc.constantFrom('none', 'sm', 'md', 'lg', 'xl', undefined);

// Mapping from prop values to expected Tailwind classes for Flex
const directionClassMap: Record<string, string> = {
  row: 'flex-row',
  'row-reverse': 'flex-row-reverse',
  column: 'flex-col',
  'column-reverse': 'flex-col-reverse',
};

const justifyClassMap: Record<string, string> = {
  start: 'justify-start',
  end: 'justify-end',
  center: 'justify-center',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

const alignClassMap: Record<string, string> = {
  start: 'items-start',
  end: 'items-end',
  center: 'items-center',
  baseline: 'items-baseline',
  stretch: 'items-stretch',
};

const wrapClassMap: Record<string, string> = {
  nowrap: 'flex-nowrap',
  wrap: 'flex-wrap',
  'wrap-reverse': 'flex-wrap-reverse',
};

const gapClassMap: Record<string, string> = {
  none: 'gap-0',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
};

/**
 * **Feature: ui-components-migration, Property 12: Flex component applies flexbox props correctly**
 *
 * For any Flex component with direction, justify, align, wrap, or gap props, the rendered output
 * should have the corresponding flexbox CSS styles applied.
 *
 * **Validates: Requirements 6.2**
 */
describe('Property 12: Flex component applies flexbox props correctly', () => {
  it('should always have flex class', () => {
    fc.assert(
      fc.property(directionArb, justifyArb, alignArb, wrapArb, gapArb, (direction, justify, align, wrap, gap) => {
        const { container } = render(
          <Flex direction={direction} justify={justify} align={align} wrap={wrap} gap={gap}>
            Content
          </Flex>
        );
        const element = container.firstChild as HTMLElement;

        expect(element.className).toContain('flex');
      }),
      { numRuns: 100 }
    );
  });

  it('should apply direction classes correctly', () => {
    fc.assert(
      fc.property(directionArb, (direction) => {
        const { container } = render(<Flex direction={direction}>Content</Flex>);
        const element = container.firstChild as HTMLElement;

        const expectedDirection = direction || 'row';
        expect(element.className).toContain(directionClassMap[expectedDirection]);
      }),
      { numRuns: 100 }
    );
  });

  it('should apply justify classes correctly', () => {
    fc.assert(
      fc.property(justifyArb, (justify) => {
        const { container } = render(<Flex justify={justify}>Content</Flex>);
        const element = container.firstChild as HTMLElement;

        const expectedJustify = justify || 'start';
        expect(element.className).toContain(justifyClassMap[expectedJustify]);
      }),
      { numRuns: 100 }
    );
  });

  it('should apply align classes correctly', () => {
    fc.assert(
      fc.property(alignArb, (align) => {
        const { container } = render(<Flex align={align}>Content</Flex>);
        const element = container.firstChild as HTMLElement;

        const expectedAlign = align || 'stretch';
        expect(element.className).toContain(alignClassMap[expectedAlign]);
      }),
      { numRuns: 100 }
    );
  });

  it('should apply wrap classes correctly', () => {
    fc.assert(
      fc.property(wrapArb, (wrap) => {
        const { container } = render(<Flex wrap={wrap}>Content</Flex>);
        const element = container.firstChild as HTMLElement;

        const expectedWrap = wrap || 'nowrap';
        expect(element.className).toContain(wrapClassMap[expectedWrap]);
      }),
      { numRuns: 100 }
    );
  });

  it('should apply gap classes correctly', () => {
    fc.assert(
      fc.property(gapArb, (gap) => {
        const { container } = render(<Flex gap={gap}>Content</Flex>);
        const element = container.firstChild as HTMLElement;

        const expectedGap = gap || 'none';
        expect(element.className).toContain(gapClassMap[expectedGap]);
      }),
      { numRuns: 100 }
    );
  });

  it('should apply all flexbox props together correctly', () => {
    fc.assert(
      fc.property(
        directionArb,
        justifyArb,
        alignArb,
        wrapArb,
        gapArb,
        (direction, justify, align, wrap, gap) => {
          const { container } = render(
            <Flex direction={direction} justify={justify} align={align} wrap={wrap} gap={gap}>
              Content
            </Flex>
          );
          const element = container.firstChild as HTMLElement;

          // Check direction
          const expectedDirection = direction || 'row';
          expect(element.className).toContain(directionClassMap[expectedDirection]);

          // Check justify
          const expectedJustify = justify || 'start';
          expect(element.className).toContain(justifyClassMap[expectedJustify]);

          // Check align
          const expectedAlign = align || 'stretch';
          expect(element.className).toContain(alignClassMap[expectedAlign]);

          // Check wrap
          const expectedWrap = wrap || 'nowrap';
          expect(element.className).toContain(wrapClassMap[expectedWrap]);

          // Check gap
          const expectedGap = gap || 'none';
          expect(element.className).toContain(gapClassMap[expectedGap]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should merge custom className with variant classes', () => {
    fc.assert(
      fc.property(
        directionArb,
        fc.stringMatching(/^[a-z][a-z0-9-]*$/),
        (direction, customClass) => {
          const { container } = render(
            <Flex direction={direction} className={customClass}>
              Content
            </Flex>
          );
          const element = container.firstChild as HTMLElement;

          expect(element.className).toContain(customClass);
          expect(element.className).toContain('flex');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should render children correctly', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 100 }), (content) => {
        const { container } = render(<Flex>{content}</Flex>);
        const element = container.firstChild as HTMLElement;

        expect(element.textContent).toBe(content);
      }),
      { numRuns: 100 }
    );
  });
});


import { Grid } from '../../components/grid';

// Arbitrary generators for Grid component props
const columnsArb = fc.constantFrom(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, undefined);
const rowsArb = fc.constantFrom(1, 2, 3, 4, 5, 6, undefined);
const gridGapArb = fc.constantFrom('none', 'sm', 'md', 'lg', 'xl', undefined);
const gridAlignItemsArb = fc.constantFrom('start', 'end', 'center', 'stretch', undefined);
const gridJustifyItemsArb = fc.constantFrom('start', 'end', 'center', 'stretch', undefined);

// Mapping from prop values to expected Tailwind classes for Grid
const columnsClassMap: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  7: 'grid-cols-7',
  8: 'grid-cols-8',
  9: 'grid-cols-9',
  10: 'grid-cols-10',
  11: 'grid-cols-11',
  12: 'grid-cols-12',
};

const rowsClassMap: Record<number, string> = {
  1: 'grid-rows-1',
  2: 'grid-rows-2',
  3: 'grid-rows-3',
  4: 'grid-rows-4',
  5: 'grid-rows-5',
  6: 'grid-rows-6',
};

const gridAlignItemsClassMap: Record<string, string> = {
  start: 'items-start',
  end: 'items-end',
  center: 'items-center',
  stretch: 'items-stretch',
};

const gridJustifyItemsClassMap: Record<string, string> = {
  start: 'justify-items-start',
  end: 'justify-items-end',
  center: 'justify-items-center',
  stretch: 'justify-items-stretch',
};

/**
 * **Feature: ui-components-migration, Property 13: Grid component applies grid props correctly**
 *
 * For any Grid component with columns, rows, or gap props, the rendered output
 * should have the corresponding CSS grid styles applied.
 *
 * **Validates: Requirements 6.3**
 */
describe('Property 13: Grid component applies grid props correctly', () => {
  it('should always have grid class', () => {
    fc.assert(
      fc.property(columnsArb, rowsArb, gridGapArb, (columns, rows, gap) => {
        const { container } = render(
          <Grid columns={columns} rows={rows} gap={gap}>
            Content
          </Grid>
        );
        const element = container.firstChild as HTMLElement;

        expect(element.className).toContain('grid');
      }),
      { numRuns: 100 }
    );
  });

  it('should apply columns classes correctly', () => {
    fc.assert(
      fc.property(columnsArb, (columns) => {
        const { container } = render(<Grid columns={columns}>Content</Grid>);
        const element = container.firstChild as HTMLElement;

        const expectedColumns = columns || 1;
        expect(element.className).toContain(columnsClassMap[expectedColumns]);
      }),
      { numRuns: 100 }
    );
  });

  it('should apply rows classes correctly when specified', () => {
    fc.assert(
      fc.property(rowsArb.filter((r) => r !== undefined), (rows) => {
        const { container } = render(<Grid rows={rows}>Content</Grid>);
        const element = container.firstChild as HTMLElement;

        expect(element.className).toContain(rowsClassMap[rows!]);
      }),
      { numRuns: 100 }
    );
  });

  it('should apply gap classes correctly', () => {
    fc.assert(
      fc.property(gridGapArb, (gap) => {
        const { container } = render(<Grid gap={gap}>Content</Grid>);
        const element = container.firstChild as HTMLElement;

        const expectedGap = gap || 'none';
        expect(element.className).toContain(gapClassMap[expectedGap]);
      }),
      { numRuns: 100 }
    );
  });

  it('should apply alignItems classes correctly', () => {
    fc.assert(
      fc.property(gridAlignItemsArb, (alignItems) => {
        const { container } = render(<Grid alignItems={alignItems}>Content</Grid>);
        const element = container.firstChild as HTMLElement;

        const expectedAlignItems = alignItems || 'stretch';
        expect(element.className).toContain(gridAlignItemsClassMap[expectedAlignItems]);
      }),
      { numRuns: 100 }
    );
  });

  it('should apply justifyItems classes correctly', () => {
    fc.assert(
      fc.property(gridJustifyItemsArb, (justifyItems) => {
        const { container } = render(<Grid justifyItems={justifyItems}>Content</Grid>);
        const element = container.firstChild as HTMLElement;

        const expectedJustifyItems = justifyItems || 'stretch';
        expect(element.className).toContain(gridJustifyItemsClassMap[expectedJustifyItems]);
      }),
      { numRuns: 100 }
    );
  });

  it('should apply all grid props together correctly', () => {
    fc.assert(
      fc.property(
        columnsArb,
        rowsArb,
        gridGapArb,
        gridAlignItemsArb,
        gridJustifyItemsArb,
        (columns, rows, gap, alignItems, justifyItems) => {
          const { container } = render(
            <Grid columns={columns} rows={rows} gap={gap} alignItems={alignItems} justifyItems={justifyItems}>
              Content
            </Grid>
          );
          const element = container.firstChild as HTMLElement;

          // Check columns
          const expectedColumns = columns || 1;
          expect(element.className).toContain(columnsClassMap[expectedColumns]);

          // Check rows (only if specified)
          if (rows) {
            expect(element.className).toContain(rowsClassMap[rows]);
          }

          // Check gap
          const expectedGap = gap || 'none';
          expect(element.className).toContain(gapClassMap[expectedGap]);

          // Check alignItems
          const expectedAlignItems = alignItems || 'stretch';
          expect(element.className).toContain(gridAlignItemsClassMap[expectedAlignItems]);

          // Check justifyItems
          const expectedJustifyItems = justifyItems || 'stretch';
          expect(element.className).toContain(gridJustifyItemsClassMap[expectedJustifyItems]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should merge custom className with variant classes', () => {
    fc.assert(
      fc.property(
        columnsArb,
        fc.stringMatching(/^[a-z][a-z0-9-]*$/),
        (columns, customClass) => {
          const { container } = render(
            <Grid columns={columns} className={customClass}>
              Content
            </Grid>
          );
          const element = container.firstChild as HTMLElement;

          expect(element.className).toContain(customClass);
          expect(element.className).toContain('grid');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should render children correctly', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 100 }), (content) => {
        const { container } = render(<Grid>{content}</Grid>);
        const element = container.firstChild as HTMLElement;

        expect(element.textContent).toBe(content);
      }),
      { numRuns: 100 }
    );
  });
});
