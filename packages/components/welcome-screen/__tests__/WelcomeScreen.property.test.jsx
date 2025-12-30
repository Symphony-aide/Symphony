/**
 * @vitest-environment jsdom
 * **Feature: component-packages-migration, Property 1: No Pure HTML Elements**
 * 
 * Property tests for WelcomeScreen component to verify it uses only UI components.
 * **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**
 */

import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import WelcomeScreen from '../src/WelcomeScreen.jsx';
import AnimatedLogo from '../src/components/AnimatedLogo.jsx';

describe('WelcomeScreen - Property 1: No Pure HTML Elements', () => {
  const defaultProps = {
    logoSrc: '/test-logo.png',
    onOpenFolder: vi.fn(),
    onNewFile: vi.fn(),
    onCloneRepo: vi.fn(),
    onAiOrchestra: vi.fn(),
    onRecent: vi.fn(),
    onGettingStarted: vi.fn(),
    onDocumentation: vi.fn(),
  };

  it('should use Flex component for main container instead of div', () => {
    const { container } = render(<WelcomeScreen {...defaultProps} />);

    // The main container should have flex classes from Flex component
    const mainContainer = container.firstChild;
    expect(mainContainer.className).toContain('flex');
    expect(mainContainer.className).toContain('items-center');
    expect(mainContainer.className).toContain('justify-center');
  });

  it('should use Box component for content wrapper', () => {
    const { container } = render(<WelcomeScreen {...defaultProps} />);

    // Should have Box with max-w-2xl class
    const contentWrapper = container.querySelector('.max-w-2xl');
    expect(contentWrapper).toBeTruthy();
  });

  it('should use Heading component for welcome title', () => {
    const { container } = render(<WelcomeScreen {...defaultProps} />);

    // Should have an h1 element (from Heading component with level={1})
    const heading = container.querySelector('h1');
    expect(heading).toBeTruthy();
    expect(heading.textContent).toContain('Welcome to');
    expect(heading.textContent).toContain('Symphony');
  });

  it('should use Text component for description', () => {
    const { container } = render(<WelcomeScreen {...defaultProps} />);

    // Should contain the description text
    expect(container.textContent).toContain('AI-First Development Environment');
  });

  it('should use Grid component for quick actions', () => {
    const { container } = render(<WelcomeScreen {...defaultProps} />);

    // Should have grid layout classes
    const gridElement = container.querySelector('.grid');
    expect(gridElement).toBeTruthy();
    expect(gridElement.className).toContain('grid-cols-2');
  });

  it('should use Flex component for footer links', () => {
    const { container } = render(<WelcomeScreen {...defaultProps} />);

    // Footer should have flex layout with gap
    const footerFlex = container.querySelector('.gap-6');
    expect(footerFlex).toBeTruthy();
  });

  it('should use Button components for footer actions', () => {
    const { container } = render(<WelcomeScreen {...defaultProps} />);

    // Should have multiple buttons for footer actions
    const buttons = container.querySelectorAll('button');
    // At least 3 footer buttons (Recent, Getting Started, Documentation)
    // Plus 4 quick action buttons
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });

  it('should use Text component with as="span" for separators', () => {
    const { container } = render(<WelcomeScreen {...defaultProps} />);

    // Should have bullet separators
    expect(container.textContent).toContain('•');
  });
});

describe('WelcomeScreen - Property 2: Layout Components Usage', () => {
  const defaultProps = {
    logoSrc: '/test-logo.png',
    onOpenFolder: vi.fn(),
    onNewFile: vi.fn(),
    onCloneRepo: vi.fn(),
    onAiOrchestra: vi.fn(),
    onRecent: vi.fn(),
    onGettingStarted: vi.fn(),
    onDocumentation: vi.fn(),
  };

  it('should use Flex with align="center" and justify="center" for main container', () => {
    const { container } = render(<WelcomeScreen {...defaultProps} />);

    const mainContainer = container.firstChild;
    expect(mainContainer.className).toContain('items-center');
    expect(mainContainer.className).toContain('justify-center');
  });

  it('should use Grid with cols={2} for quick actions', () => {
    const { container } = render(<WelcomeScreen {...defaultProps} />);

    const gridElement = container.querySelector('.grid-cols-2');
    expect(gridElement).toBeTruthy();
  });

  it('should use gap utility for spacing in footer', () => {
    const { container } = render(<WelcomeScreen {...defaultProps} />);

    const footerFlex = container.querySelector('[class*="gap-"]');
    expect(footerFlex).toBeTruthy();
  });
});

describe('WelcomeScreen - Property 3: Typography Components Usage', () => {
  const defaultProps = {
    logoSrc: '/test-logo.png',
    onOpenFolder: vi.fn(),
    onNewFile: vi.fn(),
    onCloneRepo: vi.fn(),
    onAiOrchestra: vi.fn(),
    onRecent: vi.fn(),
    onGettingStarted: vi.fn(),
    onDocumentation: vi.fn(),
  };

  it('should use Heading component with level={1} for main title', () => {
    const { container } = render(<WelcomeScreen {...defaultProps} />);

    const h1 = container.querySelector('h1');
    expect(h1).toBeTruthy();
    expect(h1.className).toContain('text-4xl');
  });

  it('should use Text component for description paragraph', () => {
    const { container } = render(<WelcomeScreen {...defaultProps} />);

    // Description should be present
    expect(container.textContent).toContain('intelligent agents orchestrate software creation');
  });

  it('should use Text with as="span" for Symphony highlight', () => {
    const { container } = render(<WelcomeScreen {...defaultProps} />);

    // Symphony text should have primary color
    const symphonySpan = container.querySelector('.text-symphony-primary');
    expect(symphonySpan).toBeTruthy();
    expect(symphonySpan.textContent).toBe('Symphony');
  });
});

describe('WelcomeScreen - Property 5: Component Functionality Preservation', () => {
  it('should call onRecent when Recent button is clicked', () => {
    const onRecent = vi.fn();
    const { container } = render(
      <WelcomeScreen 
        logoSrc="/test-logo.png"
        onOpenFolder={vi.fn()}
        onNewFile={vi.fn()}
        onCloneRepo={vi.fn()}
        onAiOrchestra={vi.fn()}
        onRecent={onRecent}
        onGettingStarted={vi.fn()}
        onDocumentation={vi.fn()}
      />
    );

    // Find the Recent button by its text content
    const buttons = container.querySelectorAll('button');
    const recentButton = Array.from(buttons).find(btn => btn.textContent.includes('Recent'));
    expect(recentButton).toBeTruthy();
    
    fireEvent.click(recentButton);
    expect(onRecent).toHaveBeenCalled();
  });

  it('should call onGettingStarted when Getting Started button is clicked', () => {
    const onGettingStarted = vi.fn();
    const { container } = render(
      <WelcomeScreen 
        logoSrc="/test-logo.png"
        onOpenFolder={vi.fn()}
        onNewFile={vi.fn()}
        onCloneRepo={vi.fn()}
        onAiOrchestra={vi.fn()}
        onRecent={vi.fn()}
        onGettingStarted={onGettingStarted}
        onDocumentation={vi.fn()}
      />
    );

    const buttons = container.querySelectorAll('button');
    const gettingStartedButton = Array.from(buttons).find(btn => btn.textContent.includes('Getting Started'));
    expect(gettingStartedButton).toBeTruthy();
    
    fireEvent.click(gettingStartedButton);
    expect(onGettingStarted).toHaveBeenCalled();
  });

  it('should call onDocumentation when Documentation button is clicked', () => {
    const onDocumentation = vi.fn();
    const { container } = render(
      <WelcomeScreen 
        logoSrc="/test-logo.png"
        onOpenFolder={vi.fn()}
        onNewFile={vi.fn()}
        onCloneRepo={vi.fn()}
        onAiOrchestra={vi.fn()}
        onRecent={vi.fn()}
        onGettingStarted={vi.fn()}
        onDocumentation={onDocumentation}
      />
    );

    const buttons = container.querySelectorAll('button');
    const docButton = Array.from(buttons).find(btn => btn.textContent.includes('Documentation'));
    expect(docButton).toBeTruthy();
    
    fireEvent.click(docButton);
    expect(onDocumentation).toHaveBeenCalled();
  });

  it('should apply custom className to main container', () => {
    const { container } = render(
      <WelcomeScreen 
        logoSrc="/test-logo.png"
        onOpenFolder={vi.fn()}
        onNewFile={vi.fn()}
        onCloneRepo={vi.fn()}
        onAiOrchestra={vi.fn()}
        onRecent={vi.fn()}
        onGettingStarted={vi.fn()}
        onDocumentation={vi.fn()}
        className="custom-welcome-class"
      />
    );

    const mainContainer = container.firstChild;
    expect(mainContainer.className).toContain('custom-welcome-class');
  });

  it('should render default quick actions when quickActions prop is not provided', () => {
    const { container } = render(
      <WelcomeScreen 
        logoSrc="/test-logo.png"
        onOpenFolder={vi.fn()}
        onNewFile={vi.fn()}
        onCloneRepo={vi.fn()}
        onAiOrchestra={vi.fn()}
        onRecent={vi.fn()}
        onGettingStarted={vi.fn()}
        onDocumentation={vi.fn()}
      />
    );

    // Should have 4 default quick action cards
    expect(container.textContent).toContain('Open Folder');
    expect(container.textContent).toContain('New File');
    expect(container.textContent).toContain('Clone Repository');
    expect(container.textContent).toContain('AI Orchestra');
  });

  it('should render custom quick actions when provided', () => {
    const customActions = [
      {
        id: 'custom-1',
        icon: () => <span>Icon1</span>,
        title: 'Custom Action 1',
        description: 'Custom description 1',
        variant: 'primary',
        onClick: vi.fn()
      },
      {
        id: 'custom-2',
        icon: () => <span>Icon2</span>,
        title: 'Custom Action 2',
        description: 'Custom description 2',
        variant: 'light',
        onClick: vi.fn()
      }
    ];

    const { container } = render(
      <WelcomeScreen 
        logoSrc="/test-logo.png"
        onOpenFolder={vi.fn()}
        onNewFile={vi.fn()}
        onCloneRepo={vi.fn()}
        onAiOrchestra={vi.fn()}
        onRecent={vi.fn()}
        onGettingStarted={vi.fn()}
        onDocumentation={vi.fn()}
        quickActions={customActions}
      />
    );

    expect(container.textContent).toContain('Custom Action 1');
    expect(container.textContent).toContain('Custom Action 2');
    // Should not contain default actions
    expect(container.textContent).not.toContain('Open Folder');
  });
});

describe('AnimatedLogo - Property 1: No Pure HTML Elements', () => {
  it('should use Flex component for container', () => {
    const { container } = render(<AnimatedLogo logoSrc="/test-logo.png" />);

    // Should have flex and justify-center classes
    const flexContainer = container.firstChild;
    expect(flexContainer.className).toContain('flex');
    expect(flexContainer.className).toContain('justify-center');
  });

  it('should use Box component for logo wrapper', () => {
    const { container } = render(<AnimatedLogo logoSrc="/test-logo.png" />);

    // Should have relative and animate-float classes
    const logoWrapper = container.querySelector('.relative.animate-float');
    expect(logoWrapper).toBeTruthy();
  });

  it('should use Box component for glow effect', () => {
    const { container } = render(<AnimatedLogo logoSrc="/test-logo.png" />);

    // Should have glow effect element
    const glowEffect = container.querySelector('.blur-3xl');
    expect(glowEffect).toBeTruthy();
  });

  it('should render img element for logo', () => {
    const { container } = render(<AnimatedLogo logoSrc="/test-logo.png" alt="Test Logo" />);

    const img = container.querySelector('img');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('/test-logo.png');
    expect(img.getAttribute('alt')).toBe('Test Logo');
  });

  it('should apply custom size class to logo', () => {
    const { container } = render(<AnimatedLogo logoSrc="/test-logo.png" size="h-48 w-48" />);

    const img = container.querySelector('img');
    expect(img.className).toContain('h-48');
    expect(img.className).toContain('w-48');
  });

  it('should apply custom className', () => {
    const { container } = render(<AnimatedLogo logoSrc="/test-logo.png" className="custom-logo-class" />);

    const flexContainer = container.firstChild;
    expect(flexContainer.className).toContain('custom-logo-class');
  });
});
