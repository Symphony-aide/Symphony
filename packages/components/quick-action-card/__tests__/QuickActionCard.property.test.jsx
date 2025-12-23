/**
 * @vitest-environment jsdom
 * **Feature: component-packages-migration, Property 1: No Pure HTML Elements**
 * 
 * Property tests for QuickActionCard component to verify it uses only UI components.
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
 */

import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import QuickActionCard from '../src/QuickActionCard.jsx';

// Mock icon component
const MockIcon = ({ className }) => <svg className={className} data-testid="mock-icon" />;

describe('QuickActionCard - Property 1: No Pure HTML Elements', () => {
  const defaultProps = {
    icon: MockIcon,
    title: 'Test Action',
    description: 'Test description',
    onClick: vi.fn(),
  };

  it('should use Button component for main container instead of button', () => {
    const { container } = render(<QuickActionCard {...defaultProps} />);

    // The main container should be a button element (from Button component)
    const button = container.querySelector('button');
    expect(button).toBeTruthy();
    expect(button.className).toContain('group');
  });

  it('should use Flex component for content layout instead of div', () => {
    const { container } = render(<QuickActionCard {...defaultProps} />);

    // Should have flex layout classes
    const flexElements = container.querySelectorAll('.flex');
    expect(flexElements.length).toBeGreaterThan(0);
  });

  it('should use Box component for icon container instead of div', () => {
    const { container } = render(<QuickActionCard {...defaultProps} />);

    // Icon container should have proper styling
    const iconContainer = container.querySelector('.rounded-lg.transition-all');
    expect(iconContainer).toBeTruthy();
  });

  it('should use Heading component for title instead of h3', () => {
    const { container } = render(<QuickActionCard {...defaultProps} />);

    // Should have an h6 element (from Heading component with level={6})
    const heading = container.querySelector('h6');
    expect(heading).toBeTruthy();
    expect(heading.textContent).toBe('Test Action');
  });

  it('should use Text component for description instead of p', () => {
    const { container } = render(<QuickActionCard {...defaultProps} />);

    // Description should be present
    expect(container.textContent).toContain('Test description');
  });
});

describe('QuickActionCard - Property 2: Layout Components Usage', () => {
  const defaultProps = {
    icon: MockIcon,
    title: 'Test Action',
    description: 'Test description',
    onClick: vi.fn(),
  };

  it('should use Flex with direction="column" for main content', () => {
    const { container } = render(<QuickActionCard {...defaultProps} />);

    // Should have flex-col class
    const flexCol = container.querySelector('.flex-col');
    expect(flexCol).toBeTruthy();
  });

  it('should use Flex with align="center" for content alignment', () => {
    const { container } = render(<QuickActionCard {...defaultProps} />);

    // Should have items-center class
    const alignCenter = container.querySelector('.items-center');
    expect(alignCenter).toBeTruthy();
  });

  it('should use gap utility for spacing', () => {
    const { container } = render(<QuickActionCard {...defaultProps} />);

    // Should have gap class
    const gapElement = container.querySelector('[class*="gap-"]');
    expect(gapElement).toBeTruthy();
  });
});

describe('QuickActionCard - Property 3: Typography Components Usage', () => {
  const defaultProps = {
    icon: MockIcon,
    title: 'Test Action',
    description: 'Test description',
    onClick: vi.fn(),
  };

  it('should use Heading component for title', () => {
    const { container } = render(<QuickActionCard {...defaultProps} />);

    const heading = container.querySelector('h6');
    expect(heading).toBeTruthy();
    expect(heading.className).toContain('font-semibold');
  });

  it('should use Text component with size="sm" for description', () => {
    const { container } = render(<QuickActionCard {...defaultProps} />);

    // Description should have text-sm class
    const description = container.querySelector('.text-text-tertiary');
    expect(description).toBeTruthy();
    expect(description.textContent).toBe('Test description');
  });
});

describe('QuickActionCard - Property 4: Interactive Components Usage', () => {
  const defaultProps = {
    icon: MockIcon,
    title: 'Test Action',
    description: 'Test description',
    onClick: vi.fn(),
  };

  it('should use Button component with variant="ghost"', () => {
    const { container } = render(<QuickActionCard {...defaultProps} />);

    const button = container.querySelector('button');
    expect(button).toBeTruthy();
    // Button should have ghost-like styling
    expect(button.className).toContain('bg-bg-primary/70');
  });

  it('should have hover effects on button', () => {
    const { container } = render(<QuickActionCard {...defaultProps} />);

    const button = container.querySelector('button');
    expect(button.className).toContain('hover:bg-bg-tertiary/80');
    expect(button.className).toContain('hover:scale-105');
  });
});

describe('QuickActionCard - Property 5: Component Functionality Preservation', () => {
  it('should call onClick when card is clicked', () => {
    const onClick = vi.fn();
    const { container } = render(
      <QuickActionCard
        icon={MockIcon}
        title="Test Action"
        description="Test description"
        onClick={onClick}
      />
    );

    const button = container.querySelector('button');
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalled();
  });

  it('should render icon component', () => {
    const { container } = render(
      <QuickActionCard
        icon={MockIcon}
        title="Test Action"
        description="Test description"
        onClick={vi.fn()}
      />
    );

    const icon = container.querySelector('[data-testid="mock-icon"]');
    expect(icon).toBeTruthy();
  });

  it('should apply primary variant colors by default', () => {
    const { container } = render(
      <QuickActionCard
        icon={MockIcon}
        title="Test Action"
        description="Test description"
        onClick={vi.fn()}
      />
    );

    // Should have primary variant shadow
    const button = container.querySelector('button');
    expect(button.className).toContain('hover:shadow-symphony-primary/10');
  });

  it('should apply light variant colors when specified', () => {
    const { container } = render(
      <QuickActionCard
        icon={MockIcon}
        title="Test Action"
        description="Test description"
        onClick={vi.fn()}
        variant="light"
      />
    );

    const button = container.querySelector('button');
    expect(button.className).toContain('hover:shadow-symphony-light/10');
  });

  it('should apply dark variant colors when specified', () => {
    const { container } = render(
      <QuickActionCard
        icon={MockIcon}
        title="Test Action"
        description="Test description"
        onClick={vi.fn()}
        variant="dark"
      />
    );

    const button = container.querySelector('button');
    expect(button.className).toContain('hover:shadow-symphony-dark/10');
  });

  it('should apply accent variant colors when specified', () => {
    const { container } = render(
      <QuickActionCard
        icon={MockIcon}
        title="Test Action"
        description="Test description"
        onClick={vi.fn()}
        variant="accent"
      />
    );

    const button = container.querySelector('button');
    expect(button.className).toContain('hover:shadow-symphony-accent/10');
  });

  it('should apply custom className', () => {
    const { container } = render(
      <QuickActionCard
        icon={MockIcon}
        title="Test Action"
        description="Test description"
        onClick={vi.fn()}
        className="custom-card-class"
      />
    );

    const button = container.querySelector('button');
    expect(button.className).toContain('custom-card-class');
  });

  it('should apply icon color based on variant', () => {
    const { container } = render(
      <QuickActionCard
        icon={MockIcon}
        title="Test Action"
        description="Test description"
        onClick={vi.fn()}
        variant="primary"
      />
    );

    // The icon container should have the variant-specific background color
    const iconContainer = container.querySelector('.bg-symphony-primary\\/10');
    expect(iconContainer).toBeTruthy();
  });
});
