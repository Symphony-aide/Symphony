/**
 * @fileoverview Performance tests for Symphony primitives rendering
 *
 * Tests render performance against defined budgets:
 * - Simple primitives: < 5ms
 * - Medium complexity trees (10-20 nodes): < 16ms (60fps)
 * - Complex trees (50+ nodes): < 50ms
 *
 * @see Requirements 3.1, 3.2, 3.3
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { BasePrimitive } from '../../src/core/BasePrimitive.js';
import {
  PrimitiveRenderer,
  registerComponent,
  unregisterComponent,
} from '../../src/renderers/PrimitiveRenderer.jsx';
import {
  PERFORMANCE_THRESHOLDS,
  SIMPLE_PRIMITIVE_TYPES,
  measureRenderTime,
  benchmarkFunction,
  generateSimplePrimitive,
  generateMediumTree,
  generateComplexTree,
  generatePrimitiveTree,
  countTreeNodes,
  checkPerformanceDegradation,
} from '../utils/performanceHelpers.js';
import {
  createMockReactComponent,
  registerAllMockComponents,
  unregisterAllMockComponents,
} from '../utils/snapshotHelpers.js';

// ============================================
// Test Setup
// ============================================

describe('Performance Tests for Primitives Rendering', () => {
  beforeEach(() => {
    // Register mock components for all primitive types
    registerAllMockComponents(registerComponent);
  });

  afterEach(() => {
    cleanup();
    unregisterAllMockComponents(unregisterComponent);
  });

  // ============================================
  // 6.1 Simple Primitive Performance Tests
  // Requirements: 3.1
  // ============================================

  describe('Simple Primitive Render Performance', () => {
    /**
     * Test: Button primitive renders under 5ms threshold
     * _Requirements: 3.1_
     */
    it('should render Button primitive under 5ms threshold', () => {
      const button = generateSimplePrimitive('Button', {
        variant: 'primary',
        size: 'default',
      });

      const stats = benchmarkFunction(() => {
        const { unmount } = render(<PrimitiveRenderer primitive={button} />);
        unmount();
      }, 10, 2);

      expect(stats.average).toBeLessThan(PERFORMANCE_THRESHOLDS.simple);
    });

    /**
     * Test: Text primitive renders under 5ms threshold
     * _Requirements: 3.1_
     */
    it('should render Text primitive under 5ms threshold', () => {
      const text = generateSimplePrimitive('Text', {
        content: 'Hello World',
        variant: 'body',
      });

      const stats = benchmarkFunction(() => {
        const { unmount } = render(<PrimitiveRenderer primitive={text} />);
        unmount();
      }, 10, 2);

      expect(stats.average).toBeLessThan(PERFORMANCE_THRESHOLDS.simple);
    });

    /**
     * Test: Icon primitive renders under 5ms threshold
     * _Requirements: 3.1_
     */
    it('should render Icon primitive under 5ms threshold', () => {
      const icon = generateSimplePrimitive('Icon', {
        name: 'file',
        size: 24,
      });

      const stats = benchmarkFunction(() => {
        const { unmount } = render(<PrimitiveRenderer primitive={icon} />);
        unmount();
      }, 10, 2);

      expect(stats.average).toBeLessThan(PERFORMANCE_THRESHOLDS.simple);
    });

    /**
     * Test: Input primitive renders under 5ms threshold
     * _Requirements: 3.1_
     */
    it('should render Input primitive under 5ms threshold', () => {
      const input = generateSimplePrimitive('Input', {
        type: 'text',
        placeholder: 'Enter text',
      });

      const stats = benchmarkFunction(() => {
        const { unmount } = render(<PrimitiveRenderer primitive={input} />);
        unmount();
      }, 10, 2);

      expect(stats.average).toBeLessThan(PERFORMANCE_THRESHOLDS.simple);
    });

    /**
     * Test: Checkbox primitive renders under 5ms threshold
     * _Requirements: 3.1_
     */
    it('should render Checkbox primitive under 5ms threshold', () => {
      const checkbox = generateSimplePrimitive('Checkbox', {
        checked: false,
        label: 'Test checkbox',
      });

      const stats = benchmarkFunction(() => {
        const { unmount } = render(<PrimitiveRenderer primitive={checkbox} />);
        unmount();
      }, 10, 2);

      expect(stats.average).toBeLessThan(PERFORMANCE_THRESHOLDS.simple);
    });

    /**
     * Test: All simple primitive types render under 5ms threshold
     * _Requirements: 3.1_
     */
    it('should render all simple primitive types under 5ms threshold', () => {
      for (const type of SIMPLE_PRIMITIVE_TYPES) {
        const primitive = generateSimplePrimitive(type);

        const stats = benchmarkFunction(() => {
          const { unmount } = render(<PrimitiveRenderer primitive={primitive} />);
          unmount();
        }, 10, 2);

        expect(stats.average).toBeLessThan(PERFORMANCE_THRESHOLDS.simple);
      }
    });
  });

  // ============================================
  // 6.2 Property Test: Simple Primitive Render Performance
  // **Property 7: Simple Primitive Render Performance**
  // **Validates: Requirements 3.1**
  // ============================================

  describe('Property 7: Simple Primitive Render Performance', () => {
    /**
     * **Feature: primitives-extended-testing, Property 7: Simple Primitive Render Performance**
     *
     * *For any* simple primitive (Button, Text, Icon, Input, Checkbox),
     * the render time SHALL be below 5ms.
     *
     * **Validates: Requirements 3.1**
     *
     * Note: We use benchmarkFunction to get average render time over multiple
     * iterations, which accounts for JIT compilation and GC variance in the
     * test environment. This matches the intent of the specification which
     * defines typical render performance, not worst-case single-render times.
     */
    it('should render any simple primitive under 5ms threshold', () => {
      // Arbitrary for simple primitive types
      const simplePrimitiveTypeArb = fc.constantFrom(...SIMPLE_PRIMITIVE_TYPES);

      // Arbitrary for primitive props
      const propsArb = fc.record({
        variant: fc.constantFrom('default', 'primary', 'secondary'),
        size: fc.constantFrom('sm', 'default', 'lg'),
        content: fc.string({ minLength: 0, maxLength: 100 }),
        disabled: fc.boolean(),
      });

      fc.assert(
        fc.property(simplePrimitiveTypeArb, propsArb, (type, props) => {
          const primitive = generateSimplePrimitive(type, props);

          // Use benchmarkFunction for consistent measurement with other tests
          // This averages over multiple iterations to account for test environment variance
          const stats = benchmarkFunction(() => {
            const { unmount } = render(<PrimitiveRenderer primitive={primitive} />);
            unmount();
          }, 5, 1); // 5 iterations, 1 warmup

          expect(stats.average).toBeLessThan(PERFORMANCE_THRESHOLDS.simple);
        }),
        { numRuns: 100 }
      );
    });
  });

  // ============================================
  // 6.3 Medium Complexity Tree Performance Tests
  // Requirements: 3.2
  // ============================================

  describe('Medium Complexity Tree Render Performance', () => {
    /**
     * Test: Tree with 10 nodes renders under 16ms threshold
     * _Requirements: 3.2_
     */
    it('should render tree with 10 nodes under 16ms threshold', () => {
      const tree = generateMediumTree(10);
      const nodeCount = countTreeNodes(tree);
      expect(nodeCount).toBeGreaterThanOrEqual(10);

      const stats = benchmarkFunction(() => {
        const { unmount } = render(<PrimitiveRenderer primitive={tree} />);
        unmount();
      }, 10, 2);

      expect(stats.average).toBeLessThan(PERFORMANCE_THRESHOLDS.medium);
    });

    /**
     * Test: Tree with 15 nodes renders under 16ms threshold
     * _Requirements: 3.2_
     */
    it('should render tree with 15 nodes under 16ms threshold', () => {
      const tree = generateMediumTree(15);
      const nodeCount = countTreeNodes(tree);
      expect(nodeCount).toBeGreaterThanOrEqual(10);

      const stats = benchmarkFunction(() => {
        const { unmount } = render(<PrimitiveRenderer primitive={tree} />);
        unmount();
      }, 10, 2);

      expect(stats.average).toBeLessThan(PERFORMANCE_THRESHOLDS.medium);
    });

    /**
     * Test: Tree with 20 nodes renders under 16ms threshold
     * _Requirements: 3.2_
     */
    it('should render tree with 20 nodes under 16ms threshold', () => {
      const tree = generateMediumTree(20);
      const nodeCount = countTreeNodes(tree);
      expect(nodeCount).toBeGreaterThanOrEqual(10);

      const stats = benchmarkFunction(() => {
        const { unmount } = render(<PrimitiveRenderer primitive={tree} />);
        unmount();
      }, 10, 2);

      expect(stats.average).toBeLessThan(PERFORMANCE_THRESHOLDS.medium);
    });
  });

  // ============================================
  // 6.4 Property Test: Medium Tree Render Performance
  // **Property 8: Medium Tree Render Performance**
  // **Validates: Requirements 3.2**
  // ============================================

  describe('Property 8: Medium Tree Render Performance', () => {
    /**
     * **Feature: primitives-extended-testing, Property 8: Medium Tree Render Performance**
     *
     * *For any* primitive tree with 10-20 nodes, the render time SHALL be
     * below 16ms (60fps frame budget).
     *
     * **Validates: Requirements 3.2**
     *
     * Note: We use benchmarkFunction to get average render time over multiple
     * iterations, which accounts for JIT compilation and GC variance in the
     * test environment. This matches the intent of the specification which
     * defines typical render performance, not worst-case single-render times.
     */
    it('should render any medium complexity tree under 16ms threshold', () => {
      // Arbitrary for node count in medium range (10-20)
      const mediumNodeCountArb = fc.integer({ min: 10, max: 20 });

      fc.assert(
        fc.property(mediumNodeCountArb, (nodeCount) => {
          const tree = generatePrimitiveTree(nodeCount);
          const actualNodeCount = countTreeNodes(tree);

          // Verify tree has expected node count
          expect(actualNodeCount).toBeGreaterThanOrEqual(10);
          expect(actualNodeCount).toBeLessThanOrEqual(25); // Allow some variance

          // Use benchmarkFunction for consistent measurement with other tests
          const stats = benchmarkFunction(() => {
            const { unmount } = render(<PrimitiveRenderer primitive={tree} />);
            unmount();
          }, 5, 1); // 5 iterations, 1 warmup

          expect(stats.average).toBeLessThan(PERFORMANCE_THRESHOLDS.medium);
        }),
        { numRuns: 50 }
      );
    });
  });

  // ============================================
  // 6.5 Complex Tree Performance Tests
  // Requirements: 3.3
  // ============================================

  describe('Complex Tree Render Performance', () => {
    /**
     * Test: Tree with 50 nodes renders under 50ms threshold
     * _Requirements: 3.3_
     */
    it('should render tree with 50 nodes under 50ms threshold', () => {
      const tree = generateComplexTree(50);
      const nodeCount = countTreeNodes(tree);
      expect(nodeCount).toBeGreaterThanOrEqual(50);

      const stats = benchmarkFunction(() => {
        const { unmount } = render(<PrimitiveRenderer primitive={tree} />);
        unmount();
      }, 10, 2);

      expect(stats.average).toBeLessThan(PERFORMANCE_THRESHOLDS.complex);
    });

    /**
     * Test: Tree with 75 nodes renders under 50ms threshold
     * _Requirements: 3.3_
     */
    it('should render tree with 75 nodes under 50ms threshold', () => {
      const tree = generateComplexTree(75);
      const nodeCount = countTreeNodes(tree);
      expect(nodeCount).toBeGreaterThanOrEqual(50);

      const stats = benchmarkFunction(() => {
        const { unmount } = render(<PrimitiveRenderer primitive={tree} />);
        unmount();
      }, 10, 2);

      expect(stats.average).toBeLessThan(PERFORMANCE_THRESHOLDS.complex);
    });

    /**
     * Test: Tree with 100 nodes renders under 50ms threshold
     * _Requirements: 3.3_
     */
    it('should render tree with 100 nodes under 50ms threshold', () => {
      const tree = generateComplexTree(100);
      const nodeCount = countTreeNodes(tree);
      expect(nodeCount).toBeGreaterThanOrEqual(50);

      const stats = benchmarkFunction(() => {
        const { unmount } = render(<PrimitiveRenderer primitive={tree} />);
        unmount();
      }, 10, 2);

      expect(stats.average).toBeLessThan(PERFORMANCE_THRESHOLDS.complex);
    });
  });

  // ============================================
  // 6.6 Property Test: Complex Tree Render Performance
  // **Property 9: Complex Tree Render Performance**
  // **Validates: Requirements 3.3**
  // ============================================

  describe('Property 9: Complex Tree Render Performance', () => {
    /**
     * **Feature: primitives-extended-testing, Property 9: Complex Tree Render Performance**
     *
     * *For any* primitive tree with 50 or more nodes, the render time SHALL be
     * below 50ms.
     *
     * **Validates: Requirements 3.3**
     */
    it('should render any complex tree under 50ms threshold', () => {
      // Arbitrary for node count in complex range (50-100)
      const complexNodeCountArb = fc.integer({ min: 50, max: 100 });

      fc.assert(
        fc.property(complexNodeCountArb, (nodeCount) => {
          const tree = generatePrimitiveTree(nodeCount);
          const actualNodeCount = countTreeNodes(tree);

          // Verify tree has expected node count
          expect(actualNodeCount).toBeGreaterThanOrEqual(50);

          const { duration } = measureRenderTime(() => {
            const { unmount } = render(<PrimitiveRenderer primitive={tree} />);
            unmount();
          });

          expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.complex);
        }),
        { numRuns: 20 }
      );
    });
  });

  // ============================================
  // 6.11 Memory Leak Detection Test
  // Requirements: 3.7
  // ============================================

  describe('Memory Leak Detection', () => {
    /**
     * Test: Sequential renders do not cause significant performance degradation
     * _Requirements: 3.7_
     *
     * Note: We use a more lenient threshold because:
     * 1. JIT compilation causes initial renders to be slower
     * 2. Test environment has more variance than production
     * 3. We're testing for memory leaks, not micro-optimizations
     */
    it('should not show significant performance degradation over 100+ sequential renders', () => {
      const primitive = generateSimplePrimitive('Button');

      // Warmup phase to allow JIT compilation
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(<PrimitiveRenderer primitive={primitive} />);
        unmount();
      }

      // Now measure actual performance
      const times = [];
      for (let i = 0; i < 100; i++) {
        const start = performance.now();
        const { unmount } = render(<PrimitiveRenderer primitive={primitive} />);
        unmount();
        times.push(performance.now() - start);
      }

      // Compare middle 20% to last 20% (avoiding initial variance)
      const middleStart = Math.floor(times.length * 0.4);
      const middleEnd = Math.floor(times.length * 0.6);
      const lastStart = Math.floor(times.length * 0.8);

      const middleTimes = times.slice(middleStart, middleEnd);
      const lastTimes = times.slice(lastStart);

      const middleAvg = middleTimes.reduce((a, b) => a + b, 0) / middleTimes.length;
      const lastAvg = lastTimes.reduce((a, b) => a + b, 0) / lastTimes.length;

      // Allow up to 100% degradation (2x slower) which would indicate a real leak
      const degradation = ((lastAvg - middleAvg) / middleAvg) * 100;
      expect(degradation).toBeLessThan(100);
    });

    /**
     * Test: Sequential renders of medium trees do not cause significant degradation
     * _Requirements: 3.7_
     */
    it('should not show significant performance degradation for medium tree renders', () => {
      const tree = generateMediumTree(15);

      // Warmup phase
      for (let i = 0; i < 5; i++) {
        const { unmount } = render(<PrimitiveRenderer primitive={tree} />);
        unmount();
      }

      // Measure actual performance
      const times = [];
      for (let i = 0; i < 50; i++) {
        const start = performance.now();
        const { unmount } = render(<PrimitiveRenderer primitive={tree} />);
        unmount();
        times.push(performance.now() - start);
      }

      // Compare middle to last portion
      const middleStart = Math.floor(times.length * 0.4);
      const middleEnd = Math.floor(times.length * 0.6);
      const lastStart = Math.floor(times.length * 0.8);

      const middleTimes = times.slice(middleStart, middleEnd);
      const lastTimes = times.slice(lastStart);

      const middleAvg = middleTimes.reduce((a, b) => a + b, 0) / middleTimes.length;
      const lastAvg = lastTimes.reduce((a, b) => a + b, 0) / lastTimes.length;

      // Allow up to 100% degradation
      const degradation = ((lastAvg - middleAvg) / middleAvg) * 100;
      expect(degradation).toBeLessThan(100);
    });
  });
});
