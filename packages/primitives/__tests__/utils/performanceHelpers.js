/**
 * @fileoverview Performance testing utilities for Symphony primitives
 * @module @symphony/primitives/__tests__/utils/performanceHelpers
 *
 * Provides helper functions for measuring render times, generating
 * primitive trees of various sizes, and validating performance budgets.
 *
 * @see Requirements 3.1, 3.2, 3.3
 */

import { BasePrimitive } from '../../src/core/BasePrimitive.js';

// ============================================
// Performance Thresholds
// ============================================

/**
 * Performance thresholds by complexity level.
 * These values are based on the requirements specification.
 *
 * @type {Object<string, number>}
 */
export const PERFORMANCE_THRESHOLDS = {
  /** Simple primitive (Button, Text, Icon): < 5ms */
  simple: 5,
  /** Medium complexity tree (10-20 nodes): < 16ms (60fps frame budget) */
  medium: 16,
  /** Complex tree (50+ nodes): < 50ms */
  complex: 50,
  /** Warning threshold for PerformanceMonitor */
  warning: 16,
  /** Error threshold for PerformanceMonitor */
  error: 50,
};

/**
 * Simple primitive types for performance testing.
 * @type {string[]}
 */
export const SIMPLE_PRIMITIVE_TYPES = ['Button', 'Text', 'Icon', 'Input', 'Checkbox'];

/**
 * Layout primitive types for tree generation.
 * @type {string[]}
 */
export const LAYOUT_PRIMITIVE_TYPES = ['Container', 'Flex', 'Grid', 'Panel'];

/**
 * Leaf primitive types for tree generation.
 * @type {string[]}
 */
export const LEAF_PRIMITIVE_TYPES = ['Text', 'Icon', 'Input', 'Divider'];

// ============================================
// Timing Utilities
// ============================================

/**
 * Measures the execution time of a synchronous function.
 *
 * @param {function(): *} fn - The function to measure
 * @returns {{ result: *, duration: number }} Result and duration in milliseconds
 *
 * @example
 * const { result, duration } = measureRenderTime(() => renderPrimitive(button));
 * console.log(`Render took ${duration}ms`);
 */
export function measureRenderTime(fn) {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  return { result, duration };
}

/**
 * Measures the execution time of an async function.
 *
 * @param {function(): Promise<*>} fn - The async function to measure
 * @returns {Promise<{ result: *, duration: number }>} Result and duration in milliseconds
 */
export async function measureRenderTimeAsync(fn) {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
}

/**
 * Runs a function multiple times and returns timing statistics.
 *
 * @param {function(): *} fn - The function to benchmark
 * @param {number} [iterations=10] - Number of iterations
 * @param {number} [warmupRuns=2] - Number of warmup runs (not counted)
 * @returns {{ average: number, min: number, max: number, p95: number, p99: number, times: number[] }}
 *
 * @example
 * const stats = benchmarkFunction(() => renderPrimitive(tree), 100);
 * console.log(`Average: ${stats.average}ms, P95: ${stats.p95}ms`);
 */
export function benchmarkFunction(fn, iterations = 10, warmupRuns = 2) {
  // Warmup runs
  for (let i = 0; i < warmupRuns; i++) {
    fn();
  }

  // Measured runs
  const times = [];
  for (let i = 0; i < iterations; i++) {
    const { duration } = measureRenderTime(fn);
    times.push(duration);
  }

  // Calculate statistics
  times.sort((a, b) => a - b);
  const sum = times.reduce((acc, t) => acc + t, 0);
  const average = sum / times.length;
  const min = times[0];
  const max = times[times.length - 1];
  const p95Index = Math.floor(times.length * 0.95);
  const p99Index = Math.floor(times.length * 0.99);
  const p95 = times[p95Index] || max;
  const p99 = times[p99Index] || max;

  return { average, min, max, p95, p99, times };
}


// ============================================
// Primitive Tree Generators
// ============================================

/**
 * Generates a primitive tree with a specified number of nodes.
 *
 * @param {number} nodeCount - Target number of nodes in the tree
 * @param {Object} [options={}] - Generation options
 * @param {number} [options.maxChildrenPerNode=4] - Maximum children per node
 * @param {string[]} [options.layoutTypes] - Layout primitive types to use
 * @param {string[]} [options.leafTypes] - Leaf primitive types to use
 * @returns {BasePrimitive} Root of the generated tree
 *
 * @example
 * // Generate a tree with ~20 nodes
 * const tree = generatePrimitiveTree(20);
 *
 * // Generate a tree with custom options
 * const customTree = generatePrimitiveTree(50, { maxChildrenPerNode: 3 });
 */
export function generatePrimitiveTree(nodeCount, options = {}) {
  const {
    maxChildrenPerNode = 4,
    layoutTypes = LAYOUT_PRIMITIVE_TYPES,
    leafTypes = LEAF_PRIMITIVE_TYPES,
  } = options;

  let currentNodeCount = 0;

  const createNode = (remainingNodes, depth = 0) => {
    if (remainingNodes <= 0) {
      return null;
    }

    currentNodeCount++;

    // Decide if this should be a leaf node
    const isLeaf = remainingNodes === 1 || depth > 5;

    if (isLeaf) {
      const leafType = leafTypes[currentNodeCount % leafTypes.length];
      const leaf = new BasePrimitive(leafType, {
        content: `Leaf-${currentNodeCount}`,
        nodeIndex: currentNodeCount,
      });
      leaf.renderStrategy = 'react';
      leaf.isLeafNode = true;
      return leaf;
    }

    // Create a layout node
    const layoutType = layoutTypes[currentNodeCount % layoutTypes.length];
    const node = new BasePrimitive(layoutType, {
      level: depth,
      nodeIndex: currentNodeCount,
    });
    node.renderStrategy = 'react';

    // Calculate children distribution
    const remainingForChildren = remainingNodes - 1;
    if (remainingForChildren > 0) {
      const numChildren = Math.min(
        maxChildrenPerNode,
        Math.max(1, Math.ceil(remainingForChildren / 2))
      );
      const nodesPerChild = Math.floor(remainingForChildren / numChildren);

      for (let i = 0; i < numChildren && currentNodeCount < nodeCount; i++) {
        const childNodes = i === numChildren - 1
          ? nodeCount - currentNodeCount
          : nodesPerChild;
        const child = createNode(childNodes, depth + 1);
        if (child) {
          node.appendChild(child);
        }
      }
    }

    return node;
  };

  return createNode(nodeCount);
}

/**
 * Generates a simple primitive for performance testing.
 *
 * @param {string} [type] - Primitive type (random if not specified)
 * @param {Object} [props={}] - Additional props
 * @returns {BasePrimitive} Simple primitive
 */
export function generateSimplePrimitive(type, props = {}) {
  const primitiveType = type || SIMPLE_PRIMITIVE_TYPES[
    Math.floor(Math.random() * SIMPLE_PRIMITIVE_TYPES.length)
  ];

  const defaultProps = {
    Button: { variant: 'default', size: 'default' },
    Text: { content: 'Test text', variant: 'body' },
    Icon: { name: 'file', size: 24 },
    Input: { type: 'text', placeholder: 'Enter text' },
    Checkbox: { checked: false, label: 'Test checkbox' },
  };

  const primitive = new BasePrimitive(primitiveType, {
    ...defaultProps[primitiveType],
    ...props,
  });
  primitive.renderStrategy = 'react';
  primitive.isLeafNode = ['Text', 'Icon', 'Input'].includes(primitiveType);

  return primitive;
}

/**
 * Generates a medium complexity tree (10-20 nodes).
 *
 * @param {number} [nodeCount=15] - Number of nodes (10-20 range)
 * @returns {BasePrimitive} Root of the tree
 */
export function generateMediumTree(nodeCount = 15) {
  const clampedCount = Math.max(10, Math.min(20, nodeCount));
  return generatePrimitiveTree(clampedCount);
}

/**
 * Generates a complex tree (50+ nodes).
 *
 * @param {number} [nodeCount=50] - Number of nodes (minimum 50)
 * @returns {BasePrimitive} Root of the tree
 */
export function generateComplexTree(nodeCount = 50) {
  const clampedCount = Math.max(50, nodeCount);
  return generatePrimitiveTree(clampedCount);
}

// ============================================
// Tree Analysis Utilities
// ============================================

/**
 * Counts the total number of nodes in a primitive tree.
 *
 * @param {BasePrimitive} root - Root of the tree
 * @returns {number} Total node count
 */
export function countTreeNodes(root) {
  if (!root) return 0;
  let count = 1;
  for (const child of root.children) {
    count += countTreeNodes(child);
  }
  return count;
}

/**
 * Calculates the maximum depth of a primitive tree.
 *
 * @param {BasePrimitive} root - Root of the tree
 * @returns {number} Maximum depth (root = 1)
 */
export function getTreeDepth(root) {
  if (!root) return 0;
  if (root.children.length === 0) return 1;
  return 1 + Math.max(...root.children.map(getTreeDepth));
}

/**
 * Collects all unique primitive types in a tree.
 *
 * @param {BasePrimitive} root - Root of the tree
 * @returns {Set<string>} Set of primitive types
 */
export function collectTreeTypes(root) {
  const types = new Set();
  const traverse = (node) => {
    if (!node) return;
    types.add(node.type);
    for (const child of node.children) {
      traverse(child);
    }
  };
  traverse(root);
  return types;
}

// ============================================
// Performance Validation
// ============================================

/**
 * Validates that a duration is within the threshold for a complexity level.
 *
 * @param {number} duration - Measured duration in milliseconds
 * @param {'simple' | 'medium' | 'complex'} complexity - Complexity level
 * @returns {{ passed: boolean, threshold: number, margin: number }}
 */
export function validatePerformance(duration, complexity) {
  const threshold = PERFORMANCE_THRESHOLDS[complexity];
  const passed = duration < threshold;
  const margin = threshold - duration;

  return { passed, threshold, margin };
}

/**
 * Creates a performance test assertion helper.
 *
 * @param {function} expectFn - The expect function from the test framework
 * @returns {Object} Assertion helpers
 *
 * @example
 * const perf = createPerformanceAssertions(expect);
 * perf.assertSimpleRender(duration);
 * perf.assertMediumRender(duration);
 */
export function createPerformanceAssertions(expectFn) {
  return {
    assertSimpleRender(duration) {
      expectFn(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.simple);
    },
    assertMediumRender(duration) {
      expectFn(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.medium);
    },
    assertComplexRender(duration) {
      expectFn(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.complex);
    },
    assertWithinBudget(duration, budget) {
      expectFn(duration).toBeLessThan(budget);
    },
  };
}

// ============================================
// Memory Leak Detection
// ============================================

/**
 * Runs a function multiple times and checks for memory growth.
 * Note: This is a simplified check; actual memory leak detection
 * requires more sophisticated tooling.
 *
 * @param {function(): *} fn - Function to test
 * @param {number} [iterations=100] - Number of iterations
 * @returns {{ initialMemory: number, finalMemory: number, growth: number, hasLeak: boolean }}
 */
export function checkMemoryGrowth(fn, iterations = 100) {
  // Force garbage collection if available (Node.js with --expose-gc)
  if (typeof global !== 'undefined' && global.gc) {
    global.gc();
  }

  const getMemory = () => {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    if (typeof performance !== 'undefined' && performance.memory) {
      return performance.memory.usedJSHeapSize;
    }
    return 0;
  };

  const initialMemory = getMemory();

  // Run iterations
  for (let i = 0; i < iterations; i++) {
    fn();
  }

  // Force garbage collection if available
  if (typeof global !== 'undefined' && global.gc) {
    global.gc();
  }

  const finalMemory = getMemory();
  const growth = finalMemory - initialMemory;

  // Consider it a potential leak if memory grew by more than 10MB
  const hasLeak = growth > 10 * 1024 * 1024;

  return { initialMemory, finalMemory, growth, hasLeak };
}

/**
 * Runs sequential renders and checks for performance degradation.
 *
 * @param {function(): *} renderFn - Render function to test
 * @param {number} [iterations=100] - Number of iterations
 * @returns {{ times: number[], degradation: number, hasDegradation: boolean }}
 */
export function checkPerformanceDegradation(renderFn, iterations = 100) {
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const { duration } = measureRenderTime(renderFn);
    times.push(duration);
  }

  // Compare first 10% to last 10%
  const tenPercent = Math.floor(iterations * 0.1);
  const firstTimes = times.slice(0, tenPercent);
  const lastTimes = times.slice(-tenPercent);

  const firstAvg = firstTimes.reduce((a, b) => a + b, 0) / firstTimes.length;
  const lastAvg = lastTimes.reduce((a, b) => a + b, 0) / lastTimes.length;

  const degradation = ((lastAvg - firstAvg) / firstAvg) * 100;

  // Consider it degradation if performance dropped by more than 50%
  const hasDegradation = degradation > 50;

  return { times, degradation, hasDegradation };
}
