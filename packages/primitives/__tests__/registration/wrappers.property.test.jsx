/**
 * @fileoverview Property-based tests for wrapper components UI integration
 * @module @symphony/primitives/__tests__/registration/wrappers.property.test
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as fc from 'fast-check';
import {
  ListWrapper,
  FormWrapper,
  TextWrapper,
} from '../../src/registration/wrappers.jsx';

// Mock UI components
vi.mock('ui', () => ({
  Select: ({ children, ...props }) => <div data-testid="select" {...props}>{children}</div>,
  SelectContent: ({ children }) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }) => <div data-testid="select-item" data-value={value}>{children}</div>,
  SelectTrigger: ({ children, className }) => <div data-testid="select-trigger" className={className}>{children}</div>,
  SelectValue: ({ placeholder }) => <span data-testid="select-value">{placeholder}</span>,
  Tooltip: ({ children }) => <div data-testid="tooltip">{children}</div>,
  TooltipContent: ({ children, side }) => <div data-testid="tooltip-content" data-side={side}>{children}</div>,
  TooltipProvider: ({ children }) => <div data-testid="tooltip-provider">{children}</div>,
  TooltipTrigger: ({ children }) => <div data-testid="tooltip-trigger">{children}</div>,
  Dialog: ({ children }) => <div data-testid="dialog">{children}</div>,
  DialogContent: ({ children }) => <div data-testid="dialog-content">{children}</div>,
  DialogDescription: ({ children }) => <div data-testid="dialog-description">{children}</div>,
  DialogHeader: ({ children }) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }) => <div data-testid="dialog-title">{children}</div>,
  DialogTrigger: ({ children }) => <div data-testid="dialog-trigger">{children}</div>,
  ScrollArea: ({ children, className, style, ...props }) => (
    <div
      data-testid="scroll-area"
      className={`scroll-area ${className || ''}`}
      style={style}
      {...props}
    >
      {children}
    </div>
  ),
  Text: ({ children, as: Component = 'p', size, weight, className, ...props }) => (
    <Component
      data-testid="ui-text"
      data-size={size}
      data-weight={weight}
      className={`text-component ${className || ''}`}
      {...props}
    >
      {children}
    </Component>
  ),
  Heading: ({ children, as: Component = 'h2', size, weight, className, ...props }) => (
    <Component
      data-testid="ui-heading"
      data-size={size}
      data-weight={weight}
      className={`heading-component ${className || ''}`}
      {...props}
    >
      {children}
    </Component>
  ),
}));

describe('Wrapper Components UI Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('ListWrapper', () => {
    /**
     * **Feature: ui-components-migration, Property 7: ListWrapper uses ScrollArea for scrollable content**
     * For any ListWrapper with scrollable=true, the component should use ScrollArea for scroll functionality.
     * **Validates: Requirements 3.4**
     */
    describe('Property 7: ListWrapper uses ScrollArea for scrollable content', () => {
      it('should wrap content in ScrollArea when scrollable is true', () => {
        fc.assert(
          fc.property(
            fc.array(fc.record({ id: fc.string(), label: fc.string() }), { minLength: 1, maxLength: 10 }),
            (items) => {
              cleanup();
              const { container } = render(
                <ListWrapper items={items} scrollable={true} renderItem={(item) => item.label} />
              );

              // Should have ScrollArea wrapper
              const scrollArea = screen.getByTestId('scroll-area');
              expect(scrollArea).toBeInTheDocument();
              expect(scrollArea.classList.contains('scroll-area')).toBe(true);

              // Should contain list items
              const listItems = container.querySelectorAll('li');
              expect(listItems.length).toBe(items.length);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should not use ScrollArea when scrollable is false', () => {
        fc.assert(
          fc.property(
            fc.array(fc.record({ id: fc.string(), label: fc.string() }), { minLength: 1, maxLength: 10 }),
            (items) => {
              cleanup();
              const { container } = render(
                <ListWrapper items={items} scrollable={false} renderItem={(item) => item.label} />
              );

              // Should not have ScrollArea wrapper
              expect(screen.queryByTestId('scroll-area')).not.toBeInTheDocument();

              // Should still contain list items
              const listItems = container.querySelectorAll('li');
              expect(listItems.length).toBe(items.length);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should apply maxHeight to ScrollArea when provided', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 100, max: 1000 }),
            (height) => {
              cleanup();
              render(
                <ListWrapper
                  items={[{ id: '1', label: 'Item 1' }]}
                  scrollable={true}
                  maxHeight={`${height}px`}
                  renderItem={(item) => item.label}
                />
              );

              const scrollArea = screen.getByTestId('scroll-area');
              expect(scrollArea.style.maxHeight).toBe(`${height}px`);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should pass className to ScrollArea when scrollable', () => {
        fc.assert(
          fc.property(
            fc.stringMatching(/^[a-z][a-z0-9-]*$/),
            (className) => {
              cleanup();
              render(
                <ListWrapper
                  items={[{ id: '1', label: 'Item 1' }]}
                  scrollable={true}
                  className={className}
                  renderItem={(item) => item.label}
                />
              );

              const scrollArea = screen.getByTestId('scroll-area');
              expect(scrollArea.classList.contains(className)).toBe(true);
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });

  describe('FormWrapper', () => {
    /**
     * **Feature: ui-components-migration, Property 8: FormWrapper integrates with UI form styling**
     * For any FormWrapper, the form element should integrate with UI component styling classes.
     * **Validates: Requirements 4.1**
     */
    describe('Property 8: FormWrapper integrates with UI form styling', () => {
      it('should apply layout classes based on layout prop', () => {
        fc.assert(
          fc.property(
            fc.constantFrom('default', 'inline', 'stacked'),
            (layout) => {
              cleanup();
              const { container } = render(
                <FormWrapper layout={layout}>
                  <input type="text" />
                </FormWrapper>
              );

              const form = container.querySelector('form');
              expect(form).toBeInTheDocument();

              // Check layout classes
              if (layout === 'inline') {
                expect(form.classList.contains('flex-row')).toBe(true);
                expect(form.classList.contains('flex-wrap')).toBe(true);
                expect(form.classList.contains('items-end')).toBe(true);
              } else {
                expect(form.classList.contains('flex-col')).toBe(true);
              }
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should apply spacing classes based on spacing prop', () => {
        fc.assert(
          fc.property(
            fc.constantFrom('sm', 'md', 'lg'),
            (spacing) => {
              cleanup();
              const { container } = render(
                <FormWrapper spacing={spacing}>
                  <input type="text" />
                </FormWrapper>
              );

              const form = container.querySelector('form');
              expect(form).toBeInTheDocument();

              // Check spacing classes
              const expectedGap = {
                sm: 'gap-2',
                md: 'gap-4',
                lg: 'gap-6',
              };
              expect(form.classList.contains(expectedGap[spacing])).toBe(true);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should combine layout, spacing, and custom className', () => {
        fc.assert(
          fc.property(
            fc.constantFrom('default', 'inline', 'stacked'),
            fc.constantFrom('sm', 'md', 'lg'),
            fc.stringMatching(/^[a-z][a-z0-9-]*$/),
            (layout, spacing, customClass) => {
              cleanup();
              const { container } = render(
                <FormWrapper layout={layout} spacing={spacing} className={customClass}>
                  <input type="text" />
                </FormWrapper>
              );

              const form = container.querySelector('form');
              expect(form).toBeInTheDocument();
              expect(form.classList.contains(customClass)).toBe(true);
              expect(form.classList.contains('flex')).toBe(true);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should prevent default form submission and call onSubmit', () => {
        fc.assert(
          fc.property(
            fc.boolean(),
            () => {
              cleanup();
              const onSubmit = vi.fn();
              const { container } = render(
                <FormWrapper onSubmit={onSubmit}>
                  <button type="submit">Submit</button>
                </FormWrapper>
              );

              const form = container.querySelector('form');
              const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
              form.dispatchEvent(submitEvent);

              expect(onSubmit).toHaveBeenCalled();
            }
          ),
          { numRuns: 50 }
        );
      });
    });
  });

  describe('TextWrapper', () => {
    /**
     * **Feature: ui-components-migration, Property 9: Typography components render correct elements**
     * For any Text component with a specified variant, the rendered output should use the correct HTML element.
     * **Validates: Requirements 5.1, 5.2**
     */
    describe('Property 9: TextWrapper uses Text and Heading components', () => {
      it('should use Heading component for h1-h6 variants', () => {
        fc.assert(
          fc.property(
            fc.constantFrom('h1', 'h2', 'h3', 'h4', 'h5', 'h6'),
            fc.string({ minLength: 1, maxLength: 50 }),
            (variant, content) => {
              cleanup();
              render(<TextWrapper variant={variant} content={content} />);

              const heading = screen.getByTestId('ui-heading');
              expect(heading).toBeInTheDocument();
              expect(heading.tagName.toLowerCase()).toBe(variant);
              expect(heading.textContent).toBe(content);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should use Text component for p, span, div, label variants', () => {
        fc.assert(
          fc.property(
            fc.constantFrom('p', 'span', 'div', 'label'),
            fc.string({ minLength: 1, maxLength: 50 }),
            (variant, content) => {
              cleanup();
              render(<TextWrapper variant={variant} content={content} />);

              const text = screen.getByTestId('ui-text');
              expect(text).toBeInTheDocument();
              expect(text.tagName.toLowerCase()).toBe(variant);
              expect(text.textContent).toBe(content);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should pass size and weight props to Text component', () => {
        fc.assert(
          fc.property(
            fc.constantFrom('xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl'),
            fc.constantFrom('normal', 'medium', 'semibold', 'bold'),
            (size, weight) => {
              cleanup();
              render(<TextWrapper variant="p" size={size} weight={weight} content="Test" />);

              const text = screen.getByTestId('ui-text');
              expect(text.getAttribute('data-size')).toBe(size);
              expect(text.getAttribute('data-weight')).toBe(weight);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should pass size and weight props to Heading component', () => {
        fc.assert(
          fc.property(
            fc.constantFrom('xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl'),
            fc.constantFrom('normal', 'medium', 'semibold', 'bold'),
            (size, weight) => {
              cleanup();
              render(<TextWrapper variant="h2" size={size} weight={weight} content="Test" />);

              const heading = screen.getByTestId('ui-heading');
              expect(heading.getAttribute('data-size')).toBe(size);
              expect(heading.getAttribute('data-weight')).toBe(weight);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should pass className to both Text and Heading components', () => {
        fc.assert(
          fc.property(
            fc.constantFrom('p', 'h2'),
            fc.stringMatching(/^[a-z][a-z0-9-]*$/),
            (variant, className) => {
              cleanup();
              render(<TextWrapper variant={variant} className={className} content="Test" />);

              const isHeading = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(variant);
              const element = screen.getByTestId(isHeading ? 'ui-heading' : 'ui-text');
              expect(element.classList.contains(className)).toBe(true);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should render children when content is not provided', () => {
        fc.assert(
          fc.property(
            fc.constantFrom('p', 'span', 'h1', 'h3'),
            fc.string({ minLength: 1, maxLength: 50 }),
            (variant, childText) => {
              cleanup();
              render(<TextWrapper variant={variant}>{childText}</TextWrapper>);

              const isHeading = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(variant);
              const element = screen.getByTestId(isHeading ? 'ui-heading' : 'ui-text');
              expect(element.textContent).toBe(childText);
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });
});
