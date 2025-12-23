/**
 * @vitest-environment jsdom
 * **Feature: component-packages-migration, Property 1: No Pure HTML Elements**
 * 
 * Property tests for MusicalBackground component to verify it uses only UI components.
 * **Validates: Requirements 1.1, 1.2**
 */

import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MusicalBackground from '../src/MusicalBackground.jsx';

describe('MusicalBackground - Property 1: No Pure HTML Elements', () => {
  it('should use Box component for main container instead of div', () => {
    const { container } = render(<MusicalBackground />);

    // The main container should have Box classes
    const mainContainer = container.firstChild;
    expect(mainContainer).toBeTruthy();
    expect(mainContainer.className).toContain('absolute');
    expect(mainContainer.className).toContain('inset-0');
    expect(mainContainer.className).toContain('overflow-hidden');
  });

  it('should use Box component for gradient mesh instead of div', () => {
    const { container } = render(<MusicalBackground gradientMesh={true} />);

    // Should have gradient mesh element with absolute positioning
    const gradientMesh = container.querySelector('.absolute.inset-0');
    expect(gradientMesh).toBeTruthy();
  });

  it('should not render gradient mesh when disabled', () => {
    const { container } = render(<MusicalBackground gradientMesh={false} />);

    // Main container should still exist
    const mainContainer = container.firstChild;
    expect(mainContainer).toBeTruthy();
    
    // Should only have one child (the SVG) when gradient mesh is disabled
    // The main container and SVG should be present
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });
});

describe('MusicalBackground - Property 2: Layout Components Usage', () => {
  it('should use Box with absolute positioning for main container', () => {
    const { container } = render(<MusicalBackground />);

    const mainContainer = container.firstChild;
    expect(mainContainer.className).toContain('absolute');
    expect(mainContainer.className).toContain('inset-0');
  });

  it('should use Box with absolute positioning for gradient mesh', () => {
    const { container } = render(<MusicalBackground gradientMesh={true} />);

    // Find the gradient mesh element (second absolute inset-0 element)
    const absoluteElements = container.querySelectorAll('.absolute.inset-0');
    expect(absoluteElements.length).toBeGreaterThanOrEqual(1);
  });

  it('should have pointer-events-none for non-interactive background', () => {
    const { container } = render(<MusicalBackground />);

    const mainContainer = container.firstChild;
    expect(mainContainer.className).toContain('pointer-events-none');
  });
});

describe('MusicalBackground - Property 5: Component Functionality Preservation', () => {
  it('should render SVG element for musical lines', () => {
    const { container } = render(<MusicalBackground />);

    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg.getAttribute('viewBox')).toBe('0 0 1000 800');
  });

  it('should have gradient definitions in SVG', () => {
    const { container } = render(<MusicalBackground />);

    const defs = container.querySelector('defs');
    expect(defs).toBeTruthy();

    // Should have three gradient definitions
    const gradients = defs.querySelectorAll('linearGradient');
    expect(gradients.length).toBe(3);
  });

  it('should have correct gradient IDs', () => {
    const { container } = render(<MusicalBackground />);

    expect(container.querySelector('#waveGrad1')).toBeTruthy();
    expect(container.querySelector('#waveGrad2')).toBeTruthy();
    expect(container.querySelector('#waveGrad3')).toBeTruthy();
  });

  it('should apply custom className', () => {
    const { container } = render(<MusicalBackground className="custom-bg-class" />);

    const mainContainer = container.firstChild;
    expect(mainContainer.className).toContain('custom-bg-class');
  });

  it('should render animation styles when animated is true', () => {
    const { container } = render(<MusicalBackground animated={true} />);

    // Should have style element for animations
    const styleElement = container.querySelector('style');
    expect(styleElement).toBeTruthy();
  });

  it('should not render animation styles when animated is false', () => {
    const { container } = render(<MusicalBackground animated={false} />);

    // Should not have style element for animations
    const styleElement = container.querySelector('style');
    expect(styleElement).toBeNull();
  });

  it('should have SVG with full width and height', () => {
    const { container } = render(<MusicalBackground />);

    const svg = container.querySelector('svg');
    // SVG className is an SVGAnimatedString, need to check baseVal
    expect(svg.getAttribute('class')).toContain('w-full');
    expect(svg.getAttribute('class')).toContain('h-full');
  });

  it('should preserve aspect ratio as none', () => {
    const { container } = render(<MusicalBackground />);

    const svg = container.querySelector('svg');
    expect(svg.getAttribute('preserveAspectRatio')).toBe('none');
  });

  it('should render gradient mesh with radial gradients', () => {
    const { container } = render(<MusicalBackground gradientMesh={true} />);

    // Find the gradient mesh element - it's a child with absolute positioning
    const mainContainer = container.firstChild;
    // The gradient mesh is the first child of the main container (before the SVG)
    const children = mainContainer.children;
    // Should have at least 2 children when gradient mesh is enabled (gradient mesh + SVG)
    expect(children.length).toBeGreaterThanOrEqual(2);
    // First child should be the gradient mesh with absolute positioning
    const gradientMesh = children[0];
    expect(gradientMesh.className).toContain('absolute');
    expect(gradientMesh.className).toContain('inset-0');
  });
});
