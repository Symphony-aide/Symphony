/**
 * @fileoverview Property-based tests for UI Code component
 *
 * These tests use fast-check to verify universal properties that should hold
 * across all valid inputs to the Code component.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import * as React from 'react';
import { Code } from '../../components/code';

// Arbitrary generators for Code component props
const variantArb = fc.constantFrom('inline', 'block', undefined);

// Mapping from prop values to expected Tailwind classes
const variantClassMap: Record<string, string[]> = {
  inline: ['bg-muted', 'px-1.5', 'py-0.5', 'rounded', 'text-sm'],
  block: ['bg-muted', 'p-4', 'rounded-lg', 'text-sm', 'overflow-x-auto', 'block', 'whitespace-pre-wrap'],
};

/**
 * **Feature: ui-components-migration, Property 10: Code component renders with monospace styling**
 *
 * For any Code component, the rendered output should apply monospace font styling
 * and appropriate background.
 *
 * **Validates: Requirements 5.3**
 */
describe('Property 10: Code component renders with monospace styling', () => {
  it('should always have font-mono class for monospace styling', () => {
    fc.assert(
      fc.property(variantArb, (variant) => {
        const { container } = render(<Code variant={variant}>const x = 1;</Code>);
        const element = container.firstChild as HTMLElement;

        expect(element.className).toContain('font-mono');
      }),
      { numRuns: 100 }
    );
  });

  it('should always have bg-muted class for background styling', () => {
    fc.assert(
      fc.property(variantArb, (variant) => {
        const { container } = render(<Code variant={variant}>const x = 1;</Code>);
        const element = container.firstChild as HTMLElement;

        expect(element.className).toContain('bg-muted');
      }),
      { numRuns: 100 }
    );
  });

  it('should render as code element', () => {
    fc.assert(
      fc.property(variantArb, (variant) => {
        const { container } = render(<Code variant={variant}>const x = 1;</Code>);
        const element = container.firstChild as HTMLElement;

        expect(element.tagName.toLowerCase()).toBe('code');
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: ui-components-migration, Property 16: Code component applies code styling**
 *
 * For any Code component with inline or block variant, the rendered output should
 * apply appropriate code styling (monospace font, background).
 *
 * **Validates: Requirements 6.6**
 */
describe('Property 16: Code component applies code styling', () => {
  it('should apply inline variant classes correctly', () => {
    fc.assert(
      fc.property(fc.constant('inline'), (variant) => {
        const { container } = render(<Code variant={variant}>const x = 1;</Code>);
        const element = container.firstChild as HTMLElement;

        // Check all inline variant classes
        for (const cls of variantClassMap.inline) {
          expect(element.className).toContain(cls);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should apply block variant classes correctly', () => {
    fc.assert(
      fc.property(fc.constant('block'), (variant) => {
        const { container } = render(<Code variant={variant}>const x = 1;</Code>);
        const element = container.firstChild as HTMLElement;

        // Check all block variant classes
        for (const cls of variantClassMap.block) {
          expect(element.className).toContain(cls);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should default to inline variant when not specified', () => {
    fc.assert(
      fc.property(fc.constant(undefined), () => {
        const { container } = render(<Code>const x = 1;</Code>);
        const element = container.firstChild as HTMLElement;

        // Check inline variant classes (default)
        for (const cls of variantClassMap.inline) {
          expect(element.className).toContain(cls);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should apply correct variant classes based on prop', () => {
    fc.assert(
      fc.property(variantArb, (variant) => {
        const { container } = render(<Code variant={variant}>const x = 1;</Code>);
        const element = container.firstChild as HTMLElement;

        const expectedVariant = variant || 'inline';
        for (const cls of variantClassMap[expectedVariant]) {
          expect(element.className).toContain(cls);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should merge custom className with variant classes', () => {
    fc.assert(
      fc.property(
        variantArb,
        fc.stringMatching(/^[a-z][a-z0-9-]*$/),
        (variant, customClass) => {
          const { container } = render(
            <Code variant={variant} className={customClass}>
              const x = 1;
            </Code>
          );
          const element = container.firstChild as HTMLElement;

          expect(element.className).toContain(customClass);
          expect(element.className).toContain('font-mono');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should render children correctly', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 100 }), (content) => {
        const { container } = render(<Code>{content}</Code>);
        const element = container.firstChild as HTMLElement;

        expect(element.textContent).toBe(content);
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve code content with special characters', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom('a', 'b', '1', '2', ' ', '\n', '\t', '=', ';', '(', ')', '{', '}')),
        (content) => {
          // Filter out empty strings
          if (content.length === 0) return true;
          
          const { container } = render(<Code>{content}</Code>);
          const element = container.firstChild as HTMLElement;

          expect(element.textContent).toBe(content);
        }
      ),
      { numRuns: 100 }
    );
  });
});
