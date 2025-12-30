/**
 * @fileoverview Snapshot testing utilities for Symphony primitives
 * @module @symphony/primitives/__tests__/utils/snapshotHelpers
 *
 * Provides helper functions for snapshot testing of primitive renderers,
 * including serialization utilities and test primitive factories.
 *
 * @see Requirements 1.1, 1.2, 1.3
 */

import React from 'react';
import { BasePrimitive } from '../../src/core/BasePrimitive.js';

/**
 * @typedef {Object} SnapshotStructure
 * @property {string} type - Element type
 * @property {Object} props - Element props (excluding children)
 * @property {(SnapshotStructure|string)[]} children - Child elements or text
 */

/**
 * Converts a primitive to a serializable snapshot structure.
 * This structure captures the essential rendering information without
 * React-specific internals.
 *
 * @param {BasePrimitive} primitive - The primitive to convert
 * @returns {SnapshotStructure} Serializable snapshot structure
 *
 * @example
 * const button = Button({ variant: 'primary', onClick: 'handler_id' });
 * const snapshot = renderPrimitiveToSnapshot(button);
 * // { type: 'Button', props: { variant: 'primary', onClick: 'handler_id' }, renderStrategy: 'react', isLeafNode: false, children: [] }
 * // Note: Dynamic IDs like 'data-primitive-id' are excluded for stable snapshots
 */
/**
 * Recursively sanitizes a value, converting any BasePrimitive instances
 * to their snapshot representation and removing dynamic IDs.
 *
 * @param {*} value - The value to sanitize
 * @returns {*} Sanitized value
 */
function sanitizeValue(value) {
  if (value instanceof BasePrimitive) {
    // Convert nested primitives to their snapshot representation
    return renderPrimitiveToSnapshot(value);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === 'object') {
    const sanitized = {};
    for (const [key, val] of Object.entries(value)) {
      // Skip dynamic IDs
      if (key === 'id' && typeof val === 'string' && val.includes('-')) {
        continue;
      }
      sanitized[key] = sanitizeValue(val);
    }
    return sanitized;
  }
  return value;
}

export function renderPrimitiveToSnapshot(primitive) {
  if (!primitive || !(primitive instanceof BasePrimitive)) {
    return null;
  }

  // Create a copy of props, sanitizing any nested primitives and removing dynamic IDs
  // to ensure stable snapshots across test runs
  const sanitizedProps = {};
  for (const [key, value] of Object.entries(primitive.props)) {
    sanitizedProps[key] = sanitizeValue(value);
  }

  const structure = {
    type: primitive.type,
    props: sanitizedProps,
    renderStrategy: primitive.renderStrategy,
    isLeafNode: primitive.isLeafNode,
    children: [],
  };

  // Only include children for non-leaf nodes
  if (!primitive.isLeafNode && primitive.children.length > 0) {
    structure.children = primitive.children.map((child) =>
      renderPrimitiveToSnapshot(child)
    );
  }

  return structure;
}


/**
 * Factory function to create test primitives with common configurations.
 *
 * @param {string} type - The primitive type name
 * @param {Object} [props={}] - Properties for the primitive
 * @param {BasePrimitive[]} [children=[]] - Child primitives to append
 * @returns {BasePrimitive} The created primitive
 *
 * @example
 * const container = createTestPrimitive('Container', { direction: 'row' }, [
 *   createTestPrimitive('Button', { variant: 'primary' }),
 *   createTestPrimitive('Text', { content: 'Hello' }),
 * ]);
 */
export function createTestPrimitive(type, props = {}, children = []) {
  const primitive = new BasePrimitive(type, props);
  primitive.renderStrategy = 'react';

  for (const child of children) {
    if (child instanceof BasePrimitive) {
      primitive.appendChild(child);
    }
  }

  return primitive;
}

/**
 * Creates a test primitive marked as a leaf node (cannot have children rendered).
 *
 * @param {string} type - The primitive type name
 * @param {Object} [props={}] - Properties for the primitive
 * @returns {BasePrimitive} The created leaf primitive
 *
 * @example
 * const icon = createLeafPrimitive('Icon', { name: 'file', size: 16 });
 */
export function createLeafPrimitive(type, props = {}) {
  const primitive = new BasePrimitive(type, props);
  primitive.renderStrategy = 'react';
  primitive.isLeafNode = true;
  return primitive;
}

/**
 * Creates a nested primitive tree for testing hierarchical rendering.
 *
 * @param {number} [depth=2] - Maximum depth of the tree
 * @param {number} [childrenPerNode=2] - Number of children per non-leaf node
 * @returns {BasePrimitive} Root of the primitive tree
 *
 * @example
 * const tree = createNestedPrimitiveTree(3, 2);
 * // Creates a tree with depth 3 and 2 children per node
 */
export function createNestedPrimitiveTree(depth = 2, childrenPerNode = 2) {
  const types = ['Container', 'Flex', 'Panel'];
  const leafTypes = ['Text', 'Icon', 'Button'];

  const createNode = (currentDepth) => {
    if (currentDepth <= 0) {
      // Create a leaf node
      const leafType = leafTypes[currentDepth % leafTypes.length];
      return createLeafPrimitive(leafType, { content: `Leaf-${currentDepth}` });
    }

    const nodeType = types[currentDepth % types.length];
    const node = createTestPrimitive(nodeType, { level: currentDepth });

    for (let i = 0; i < childrenPerNode; i++) {
      const child = createNode(currentDepth - 1);
      node.appendChild(child);
    }

    return node;
  };

  return createNode(depth);
}

// ============================================
// Mock React Components for Testing
// ============================================

/**
 * Creates a mock React component for a primitive type.
 * Used for testing renderer behavior without actual UI rendering.
 *
 * @param {string} type - The primitive type name
 * @returns {React.ComponentType} Mock React component
 *
 * @example
 * const MockButton = createMockReactComponent('Button');
 * registerComponent('Button', MockButton);
 */
export function createMockReactComponent(type) {
  const MockComponent = React.forwardRef(({ children, ...props }, ref) => {
    // Filter out the dynamic primitive ID to ensure stable snapshots
    const { 'data-primitive-id': _primitiveId, ...stableProps } = props;
    
    return React.createElement(
      'div',
      {
        ref,
        'data-testid': `mock-${type.toLowerCase()}`,
        'data-type': type,
        ...stableProps,
      },
      children
    );
  });
  MockComponent.displayName = `Mock${type}`;
  return MockComponent;
}

/**
 * Map of all standard primitive types to their mock components.
 * @type {Map<string, React.ComponentType>}
 */
export const MOCK_COMPONENTS = new Map([
  // Layout primitives
  ['Container', createMockReactComponent('Container')],
  ['Flex', createMockReactComponent('Flex')],
  ['Grid', createMockReactComponent('Grid')],
  ['Panel', createMockReactComponent('Panel')],
  ['Divider', createMockReactComponent('Divider')],
  // Interactive primitives
  ['Button', createMockReactComponent('Button')],
  ['Input', createMockReactComponent('Input')],
  ['Icon', createMockReactComponent('Icon')],
  ['Text', createMockReactComponent('Text')],
  ['Checkbox', createMockReactComponent('Checkbox')],
  ['Select', createMockReactComponent('Select')],
  // Complex primitives
  ['List', createMockReactComponent('List')],
  ['Tabs', createMockReactComponent('Tabs')],
  ['Dropdown', createMockReactComponent('Dropdown')],
  ['Modal', createMockReactComponent('Modal')],
  ['Tooltip', createMockReactComponent('Tooltip')],
]);

/**
 * Registers all mock components with the PrimitiveRenderer.
 * Call this in beforeEach to set up the test environment.
 *
 * @param {function(string, React.ComponentType): void} registerFn - Registration function
 * @returns {string[]} Array of registered type names
 *
 * @example
 * import { registerComponent } from '../../src/renderers/PrimitiveRenderer.jsx';
 * beforeEach(() => {
 *   registerAllMockComponents(registerComponent);
 * });
 */
export function registerAllMockComponents(registerFn) {
  const registeredTypes = [];
  for (const [type, component] of MOCK_COMPONENTS) {
    registerFn(type, component);
    registeredTypes.push(type);
  }
  return registeredTypes;
}

/**
 * Unregisters all mock components from the PrimitiveRenderer.
 * Call this in afterEach to clean up the test environment.
 *
 * @param {function(string): boolean} unregisterFn - Unregistration function
 *
 * @example
 * import { unregisterComponent } from '../../src/renderers/PrimitiveRenderer.jsx';
 * afterEach(() => {
 *   unregisterAllMockComponents(unregisterComponent);
 * });
 */
export function unregisterAllMockComponents(unregisterFn) {
  for (const type of MOCK_COMPONENTS.keys()) {
    unregisterFn(type);
  }
}

// ============================================
// Snapshot Comparison Utilities
// ============================================

/**
 * Compares two snapshot structures for equality.
 * Useful for custom snapshot assertions.
 *
 * @param {SnapshotStructure} a - First snapshot
 * @param {SnapshotStructure} b - Second snapshot
 * @param {Object} [options={}] - Comparison options
 * @param {boolean} [options.ignoreIds=true] - Whether to ignore primitive IDs
 * @returns {boolean} True if snapshots are equivalent
 */
export function compareSnapshots(a, b, options = { ignoreIds: true }) {
  if (!a && !b) return true;
  if (!a || !b) return false;

  // Compare types
  if (a.type !== b.type) return false;

  // Compare props (optionally ignoring IDs)
  const propsA = { ...a.props };
  const propsB = { ...b.props };

  if (options.ignoreIds) {
    delete propsA['data-primitive-id'];
    delete propsB['data-primitive-id'];
  }

  if (JSON.stringify(propsA) !== JSON.stringify(propsB)) return false;

  // Compare render strategy and leaf status
  if (a.renderStrategy !== b.renderStrategy) return false;
  if (a.isLeafNode !== b.isLeafNode) return false;

  // Compare children
  if (a.children.length !== b.children.length) return false;

  for (let i = 0; i < a.children.length; i++) {
    if (!compareSnapshots(a.children[i], b.children[i], options)) {
      return false;
    }
  }

  return true;
}

/**
 * Serializes a snapshot structure to a stable JSON string for comparison.
 * Removes volatile fields like IDs for consistent snapshots.
 *
 * @param {SnapshotStructure} snapshot - The snapshot to serialize
 * @returns {string} Stable JSON string
 */
export function serializeSnapshot(snapshot) {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    const result = { ...obj };

    // Remove volatile ID field
    if (result.props) {
      const sanitizedProps = { ...result.props };
      delete sanitizedProps['data-primitive-id'];
      result.props = sanitizedProps;
    }

    // Recursively sanitize children
    if (Array.isArray(result.children)) {
      result.children = result.children.map(sanitize);
    }

    return result;
  };

  return JSON.stringify(sanitize(snapshot), null, 2);
}
