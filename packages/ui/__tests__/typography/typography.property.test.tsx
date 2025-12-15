/**
 * @fileoverview Property-based tests for UI typography components (Text, Heading)
 *
 * These tests use fast-check to verify universal properties that should hold
 * across all valid inputs to the typography components.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import * as React from 'react';
import { Text } from '../../components/text';
import { Heading } from '../../components/heading';

// Arbitrary generators for Text component props
const textSizeArb = fc.constantFrom('xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', undefined);
const textWeightArb = fc.constantFrom('normal', 'medium', 'semibold', 'bold', undefined);
const textColorArb = fc.constantFrom('default', 'muted', 'accent', 'destructive', undefined);
const textAlignArb = fc.constantFrom('left', 'center', 'right', undefined);
const textAsArb = fc.constantFrom('p', 'span', 'div', 'label', undefined);

// Arbitrary generators for Heading component props
const headingAsArb = fc.constantFrom('h1', 'h2', 'h3', 'h4', 'h5', 'h6', undefined);
const headingSizeArb = fc.constantFrom('xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', undefined);
const headingWeightArb = fc.constantFrom('normal', 'medium', 'semibold', 'bold', undefined);

// Mapping from prop values to expected Tailwind classes for Text
const sizeClassMap: Record<string, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
};

const weightClassMap: Record<string, string> = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

const colorClassMap: Record<string, string> = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  accent: 'text-accent-foreground',
  destructive: 'text-destructive',
};

const alignClassMap: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

// Default size mapping for heading levels
const defaultHeadingSizeMap: Record<string, string> = {
  h1: '4xl',
  h2: '3xl',
  h3: '2xl',
  h4: 'xl',
  h5: 'lg',
  h6: 'base',
};

/**
 * **Feature: ui-components-migration, Property 9: Typography components render correct elements**
 *
 * For any Text component with a specified variant, the rendered output should use
 * the correct HTML element and apply consistent typography styles.
 *
 * **Validates: Requirements 5.1, 5.2**
 */
describe('Property 9: Typography components render correct elements', () => {
  it('Text should render as paragraph by default', () => {
    fc.assert(
      fc.property(textSizeArb, textWeightArb, (size, weight) => {
        const { container } = render(<Text size={size} weight={weight}>Content</Text>);
        const element = container.firstChild as HTMLElement;

        expect(element.tagName.toLowerCase()).toBe('p');
      }),
      { numRuns: 100 }
    );
  });

  it('Text should render with custom element type via as prop', () => {
    fc.assert(
      fc.property(textAsArb, textSizeArb, (as, size) => {
        const { container } = render(<Text as={as} size={size}>Content</Text>);
        const element = container.firstChild as HTMLElement;

        const expectedElement = as || 'p';
        expect(element.tagName.toLowerCase()).toBe(expectedElement);
      }),
      { numRuns: 100 }
    );
  });

  it('Heading should render as h2 by default', () => {
    fc.assert(
      fc.property(headingSizeArb, headingWeightArb, (size, weight) => {
        const { container } = render(<Heading size={size} weight={weight}>Content</Heading>);
        const element = container.firstChild as HTMLElement;

        expect(element.tagName.toLowerCase()).toBe('h2');
      }),
      { numRuns: 100 }
    );
  });

  it('Heading should render with custom heading level via as prop', () => {
    fc.assert(
      fc.property(headingAsArb, headingSizeArb, (as, size) => {
        const { container } = render(<Heading as={as} size={size}>Content</Heading>);
        const element = container.firstChild as HTMLElement;

        const expectedElement = as || 'h2';
        expect(element.tagName.toLowerCase()).toBe(expectedElement);
      }),
      { numRuns: 100 }
    );
  });

  it('Heading should have tracking-tight class for consistent styling', () => {
    fc.assert(
      fc.property(headingAsArb, headingSizeArb, (as, size) => {
        const { container } = render(<Heading as={as} size={size}>Content</Heading>);
        const element = container.firstChild as HTMLElement;

        expect(element.className).toContain('tracking-tight');
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: ui-components-migration, Property 14: Text component applies typography props correctly**
 *
 * For any Text component with size, weight, or color props, the rendered output
 * should have the corresponding typography CSS classes applied.
 *
 * **Validates: Requirements 6.4**
 */
describe('Property 14: Text component applies typography props correctly', () => {
  it('should apply size classes correctly', () => {
    fc.assert(
      fc.property(textSizeArb, (size) => {
        const { container } = render(<Text size={size}>Content</Text>);
        const element = container.firstChild as HTMLElement;

        const expectedSize = size || 'base';
        expect(element.className).toContain(sizeClassMap[expectedSize]);
      }),
      { numRuns: 100 }
    );
  });

  it('should apply weight classes correctly', () => {
    fc.assert(
      fc.property(textWeightArb, (weight) => {
        const { container } = render(<Text weight={weight}>Content</Text>);
        const element = container.firstChild as HTMLElement;

        const expectedWeight = weight || 'normal';
        expect(element.className).toContain(weightClassMap[expectedWeight]);
      }),
      { numRuns: 100 }
    );
  });

  it('should apply color classes correctly', () => {
    fc.assert(
      fc.property(textColorArb, (color) => {
        const { container } = render(<Text color={color}>Content</Text>);
        const element = container.firstChild as HTMLElement;

        const expectedColor = color || 'default';
        expect(element.className).toContain(colorClassMap[expectedColor]);
      }),
      { numRuns: 100 }
    );
  });

  it('should apply align classes correctly', () => {
    fc.assert(
      fc.property(textAlignArb, (align) => {
        const { container } = render(<Text align={align}>Content</Text>);
        const element = container.firstChild as HTMLElement;

        const expectedAlign = align || 'left';
        expect(element.className).toContain(alignClassMap[expectedAlign]);
      }),
      { numRuns: 100 }
    );
  });

  it('should apply all typography props together correctly', () => {
    fc.assert(
      fc.property(
        textSizeArb,
        textWeightArb,
        textColorArb,
        textAlignArb,
        (size, weight, color, align) => {
          const { container } = render(
            <Text size={size} weight={weight} color={color} align={align}>
              Content
            </Text>
          );
          const element = container.firstChild as HTMLElement;

          // Check size
          const expectedSize = size || 'base';
          expect(element.className).toContain(sizeClassMap[expectedSize]);

          // Check weight
          const expectedWeight = weight || 'normal';
          expect(element.className).toContain(weightClassMap[expectedWeight]);

          // Check color
          const expectedColor = color || 'default';
          expect(element.className).toContain(colorClassMap[expectedColor]);

          // Check align
          const expectedAlign = align || 'left';
          expect(element.className).toContain(alignClassMap[expectedAlign]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should merge custom className with variant classes', () => {
    fc.assert(
      fc.property(
        textSizeArb,
        fc.stringMatching(/^[a-z][a-z0-9-]*$/),
        (size, customClass) => {
          const { container } = render(
            <Text size={size} className={customClass}>
              Content
            </Text>
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
        const { container } = render(<Text>{content}</Text>);
        const element = container.firstChild as HTMLElement;

        expect(element.textContent).toBe(content);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Additional tests for Heading component typography props
 */
describe('Heading component applies typography props correctly', () => {
  it('should apply size classes correctly', () => {
    fc.assert(
      fc.property(headingSizeArb, (size) => {
        const { container } = render(<Heading size={size}>Content</Heading>);
        const element = container.firstChild as HTMLElement;

        // Default heading is h2, which has default size '3xl' if no size provided
        const expectedSize = size || '3xl';
        expect(element.className).toContain(sizeClassMap[expectedSize]);
      }),
      { numRuns: 100 }
    );
  });

  it('should apply default size based on heading level when size not specified', () => {
    fc.assert(
      fc.property(headingAsArb.filter((as) => as !== undefined), (as) => {
        const { container } = render(<Heading as={as}>Content</Heading>);
        const element = container.firstChild as HTMLElement;

        const expectedSize = defaultHeadingSizeMap[as!];
        expect(element.className).toContain(sizeClassMap[expectedSize]);
      }),
      { numRuns: 100 }
    );
  });

  it('should apply weight classes correctly', () => {
    fc.assert(
      fc.property(headingWeightArb, (weight) => {
        const { container } = render(<Heading weight={weight}>Content</Heading>);
        const element = container.firstChild as HTMLElement;

        const expectedWeight = weight || 'semibold';
        expect(element.className).toContain(weightClassMap[expectedWeight]);
      }),
      { numRuns: 100 }
    );
  });

  it('should merge custom className with variant classes', () => {
    fc.assert(
      fc.property(
        headingAsArb,
        fc.stringMatching(/^[a-z][a-z0-9-]*$/),
        (as, customClass) => {
          const { container } = render(
            <Heading as={as} className={customClass}>
              Content
            </Heading>
          );
          const element = container.firstChild as HTMLElement;

          expect(element.className).toContain(customClass);
          expect(element.className).toContain('tracking-tight');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should render children correctly', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 100 }), (content) => {
        const { container } = render(<Heading>{content}</Heading>);
        const element = container.firstChild as HTMLElement;

        expect(element.textContent).toBe(content);
      }),
      { numRuns: 100 }
    );
  });
});
