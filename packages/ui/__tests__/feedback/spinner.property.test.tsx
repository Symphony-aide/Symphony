/**
 * @fileoverview Property-based tests for Spinner component
 *
 * These tests use fast-check to verify universal properties that should hold
 * across all valid inputs to the Spinner component.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import * as React from 'react';
import { Spinner } from '../../components/spinner';

// Type definitions for Spinner props
type SpinnerSize = 'sm' | 'md' | 'lg' | undefined;
type SpinnerColor = 'default' | 'primary' | 'secondary' | undefined;

// Arbitrary generators for Spinner component props
const sizeArb = fc.constantFrom<SpinnerSize>('sm', 'md', 'lg', undefined);
const colorArb = fc.constantFrom<SpinnerColor>('default', 'primary', 'secondary', undefined);

// Mapping from prop values to expected Tailwind classes
const sizeClassMap: Record<string, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

const colorClassMap: Record<string, string> = {
  default: 'text-foreground',
  primary: 'text-primary',
  secondary: 'text-secondary',
};

/**
 * **Feature: ui-components-migration, Property 15: Spinner component renders loading animation**
 *
 * For any Spinner component, the rendered output should include animation styles
 * for the loading indicator.
 *
 * **Validates: Requirements 6.5**
 */
describe('Property 15: Spinner component renders loading animation', () => {
  it('should always have animate-spin class for animation', () => {
    fc.assert(
      fc.property(sizeArb, colorArb, (size, color) => {
        const { container } = render(<Spinner size={size} color={color} />);
        const element = container.firstChild as HTMLElement;

        expect(element.className).toContain('animate-spin');
      }),
      { numRuns: 100 }
    );
  });

  it('should have border styling for spinner visual', () => {
    fc.assert(
      fc.property(sizeArb, colorArb, (size, color) => {
        const { container } = render(<Spinner size={size} color={color} />);
        const element = container.firstChild as HTMLElement;

        expect(element.className).toContain('border-2');
        expect(element.className).toContain('border-solid');
        expect(element.className).toContain('border-current');
        expect(element.className).toContain('border-r-transparent');
      }),
      { numRuns: 100 }
    );
  });

  it('should have rounded-full class for circular shape', () => {
    fc.assert(
      fc.property(sizeArb, colorArb, (size, color) => {
        const { container } = render(<Spinner size={size} color={color} />);
        const element = container.firstChild as HTMLElement;

        expect(element.className).toContain('rounded-full');
      }),
      { numRuns: 100 }
    );
  });

  it('should apply size classes correctly', () => {
    fc.assert(
      fc.property(sizeArb, (size) => {
        const { container } = render(<Spinner size={size} />);
        const element = container.firstChild as HTMLElement;

        const expectedSize = size || 'md';
        const expectedClasses = sizeClassMap[expectedSize].split(' ');
        expectedClasses.forEach((cls) => {
          expect(element.className).toContain(cls);
        });
      }),
      { numRuns: 100 }
    );
  });

  it('should apply color classes correctly', () => {
    fc.assert(
      fc.property(colorArb, (color) => {
        const { container } = render(<Spinner color={color} />);
        const element = container.firstChild as HTMLElement;

        const expectedColor = color || 'default';
        expect(element.className).toContain(colorClassMap[expectedColor]);
      }),
      { numRuns: 100 }
    );
  });

  it('should apply all props together correctly', () => {
    fc.assert(
      fc.property(sizeArb, colorArb, (size, color) => {
        const { container } = render(<Spinner size={size} color={color} />);
        const element = container.firstChild as HTMLElement;

        // Check animation
        expect(element.className).toContain('animate-spin');

        // Check size
        const expectedSize = size || 'md';
        const expectedSizeClasses = sizeClassMap[expectedSize].split(' ');
        expectedSizeClasses.forEach((cls) => {
          expect(element.className).toContain(cls);
        });

        // Check color
        const expectedColor = color || 'default';
        expect(element.className).toContain(colorClassMap[expectedColor]);
      }),
      { numRuns: 100 }
    );
  });

  it('should have role="status" for accessibility', () => {
    fc.assert(
      fc.property(sizeArb, colorArb, (size, color) => {
        const { container } = render(<Spinner size={size} color={color} />);
        const element = container.firstChild as HTMLElement;

        expect(element.getAttribute('role')).toBe('status');
      }),
      { numRuns: 100 }
    );
  });

  it('should have aria-label for accessibility', () => {
    fc.assert(
      fc.property(sizeArb, colorArb, (size, color) => {
        const { container } = render(<Spinner size={size} color={color} />);
        const element = container.firstChild as HTMLElement;

        expect(element.getAttribute('aria-label')).toBe('Loading');
      }),
      { numRuns: 100 }
    );
  });

  it('should merge custom className with variant classes', () => {
    fc.assert(
      fc.property(
        sizeArb,
        fc.stringMatching(/^[a-z][a-z0-9-]*$/),
        (size, customClass) => {
          const { container } = render(<Spinner size={size} className={customClass} />);
          const element = container.firstChild as HTMLElement;

          expect(element.className).toContain(customClass);
          expect(element.className).toContain('animate-spin');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should support motion-reduce for accessibility', () => {
    fc.assert(
      fc.property(sizeArb, colorArb, (size, color) => {
        const { container } = render(<Spinner size={size} color={color} />);
        const element = container.firstChild as HTMLElement;

        // Check for motion-reduce class that provides alternative animation
        expect(element.className).toMatch(/motion-reduce:/);
      }),
      { numRuns: 100 }
    );
  });
});
