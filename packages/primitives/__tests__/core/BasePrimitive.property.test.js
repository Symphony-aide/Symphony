/**
 * @fileoverview Property-based tests for BasePrimitive class
 *
 * These tests use fast-check to verify universal properties that should hold
 * across all valid inputs to the BasePrimitive class.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { BasePrimitive } from '../../src/core/BasePrimitive.js';

// Arbitrary generators for primitive types and props
const primitiveTypeArb = fc.stringMatching(/^[A-Z][a-zA-Z0-9]*$/);

const primitivePropsArb = fc.dictionary(
  fc.stringMatching(/^[a-z][a-zA-Z0-9]*$/),
  fc.oneof(
    fc.string(),
    fc.integer(),
    fc.boolean(),
    fc.constant(null),
    fc.array(fc.string(), { maxLength: 5 }),
  ),
  { maxKeys: 10 }
);

/**
 * **Feature: primitives-package, Property 1: Primitive Instantiation Correctness**
 *
 * For any valid type string and props object, when a primitive is instantiated,
 * the primitive SHALL have a unique non-empty ID, the correct type, all provided
 * props stored, an empty children array, and null parent reference.
 *
 * **Validates: Requirements 1.1**
 */
describe('Property 1: Primitive Instantiation Correctness', () => {
  it('should have a unique non-empty ID after instantiation', () => {
    fc.assert(
      fc.property(primitiveTypeArb, primitivePropsArb, (type, props) => {
        const primitive = new BasePrimitive(type, props);

        // ID should be a non-empty string
        expect(typeof primitive.id).toBe('string');
        expect(primitive.id.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should store the correct type', () => {
    fc.assert(
      fc.property(primitiveTypeArb, primitivePropsArb, (type, props) => {
        const primitive = new BasePrimitive(type, props);
        expect(primitive.type).toBe(type);
      }),
      { numRuns: 100 }
    );
  });

  it('should store all provided props', () => {
    fc.assert(
      fc.property(primitiveTypeArb, primitivePropsArb, (type, props) => {
        const primitive = new BasePrimitive(type, props);

        // All provided props should be stored
        for (const [key, value] of Object.entries(props)) {
          expect(primitive.props[key]).toEqual(value);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should have an empty children array', () => {
    fc.assert(
      fc.property(primitiveTypeArb, primitivePropsArb, (type, props) => {
        const primitive = new BasePrimitive(type, props);
        expect(Array.isArray(primitive.children)).toBe(true);
        expect(primitive.children.length).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should have null parent reference', () => {
    fc.assert(
      fc.property(primitiveTypeArb, primitivePropsArb, (type, props) => {
        const primitive = new BasePrimitive(type, props);
        expect(primitive.parent).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it('should generate unique IDs for different instances', () => {
    fc.assert(
      fc.property(
        fc.array(fc.tuple(primitiveTypeArb, primitivePropsArb), { minLength: 2, maxLength: 50 }),
        (typePropsArray) => {
          const ids = new Set();
          for (const [type, props] of typePropsArray) {
            const primitive = new BasePrimitive(type, props);
            ids.add(primitive.id);
          }
          // All IDs should be unique
          expect(ids.size).toBe(typePropsArray.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have default render strategy of react', () => {
    fc.assert(
      fc.property(primitiveTypeArb, primitivePropsArb, (type, props) => {
        const primitive = new BasePrimitive(type, props);
        expect(primitive.renderStrategy).toBe('react');
      }),
      { numRuns: 100 }
    );
  });

  it('should have isLeafNode default to false', () => {
    fc.assert(
      fc.property(primitiveTypeArb, primitivePropsArb, (type, props) => {
        const primitive = new BasePrimitive(type, props);
        expect(primitive.isLeafNode).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should have renderDirect default to false', () => {
    fc.assert(
      fc.property(primitiveTypeArb, primitivePropsArb, (type, props) => {
        const primitive = new BasePrimitive(type, props);
        expect(primitive.renderDirect).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: primitives-package, Property 2: Tree Path Calculation**
 *
 * For any primitive tree of arbitrary depth, when getPath() is called on any node,
 * the returned path SHALL correctly trace from the root to that node, with each
 * element being the type of the ancestor at that level.
 *
 * **Validates: Requirements 1.2**
 */
describe('Property 2: Tree Path Calculation', () => {
  // Generator for a tree of primitives with configurable depth
  const primitiveTreeArb = (maxDepth = 4) => {
    const leafArb = primitiveTypeArb.map((type) => new BasePrimitive(type));

    const nodeArb = (depth) => {
      if (depth <= 0) {
        return leafArb;
      }
      return fc.tuple(
        primitiveTypeArb,
        fc.array(nodeArb(depth - 1), { minLength: 0, maxLength: 3 })
      ).map(([type, children]) => {
        const node = new BasePrimitive(type);
        for (const child of children) {
          node.appendChild(child);
        }
        return node;
      });
    };

    return nodeArb(maxDepth);
  };

  // Helper to collect all nodes in a tree
  const collectAllNodes = (root) => {
    const nodes = [root];
    for (const child of root.children) {
      nodes.push(...collectAllNodes(child));
    }
    return nodes;
  };

  it('should return path with root type for root node', () => {
    fc.assert(
      fc.property(primitiveTypeArb, (type) => {
        const root = new BasePrimitive(type);
        const path = root.getPath();

        expect(path).toEqual([type]);
      }),
      { numRuns: 100 }
    );
  });

  it('should return correct path for any node in tree', () => {
    fc.assert(
      fc.property(primitiveTreeArb(4), (root) => {
        const allNodes = collectAllNodes(root);

        for (const node of allNodes) {
          const path = node.getPath();

          // Path should start with root type
          expect(path[0]).toBe(root.type);

          // Path should end with current node type
          expect(path[path.length - 1]).toBe(node.type);

          // Verify path by traversing from root
          let current = root;
          for (let i = 1; i < path.length; i++) {
            const expectedType = path[i];
            const nextChild = current.children.find((c) => c.type === expectedType);
            // If we can't find the child, the path might have multiple children of same type
            // In that case, we just verify the type matches
            if (nextChild) {
              current = nextChild;
            }
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should have path length equal to depth + 1', () => {
    fc.assert(
      fc.property(primitiveTreeArb(4), (root) => {
        const allNodes = collectAllNodes(root);

        for (const node of allNodes) {
          const path = node.getPath();

          // Calculate actual depth by traversing parent chain
          let depth = 0;
          let current = node;
          while (current.parent !== null) {
            depth++;
            current = current.parent;
          }

          expect(path.length).toBe(depth + 1);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should have each path element be the type of ancestor at that level', () => {
    fc.assert(
      fc.property(primitiveTreeArb(4), (root) => {
        const allNodes = collectAllNodes(root);

        for (const node of allNodes) {
          const path = node.getPath();

          // Build expected path by traversing parent chain
          const expectedPath = [];
          let current = node;
          while (current !== null) {
            expectedPath.unshift(current.type);
            current = current.parent;
          }

          expect(path).toEqual(expectedPath);
        }
      }),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: primitives-package, Property 3: Child Manipulation Consistency**
 *
 * For any parent primitive and child primitive, after appendChild the child's parent
 * SHALL reference the parent AND the parent's children SHALL contain the child;
 * after removeChild the child's parent SHALL be null AND the parent's children
 * SHALL NOT contain the child.
 *
 * **Validates: Requirements 1.3, 1.4**
 */
describe('Property 3: Child Manipulation Consistency', () => {
  it('appendChild should set child parent and add to children array', () => {
    fc.assert(
      fc.property(primitiveTypeArb, primitiveTypeArb, (parentType, childType) => {
        const parent = new BasePrimitive(parentType);
        const child = new BasePrimitive(childType);

        parent.appendChild(child);

        // Child's parent should reference the parent
        expect(child.parent).toBe(parent);

        // Parent's children should contain the child
        expect(parent.children).toContain(child);
        expect(parent.children.length).toBe(1);
      }),
      { numRuns: 100 }
    );
  });

  it('removeChild should clear child parent and remove from children array', () => {
    fc.assert(
      fc.property(primitiveTypeArb, primitiveTypeArb, (parentType, childType) => {
        const parent = new BasePrimitive(parentType);
        const child = new BasePrimitive(childType);

        parent.appendChild(child);
        const removed = parent.removeChild(child);

        // Should return true indicating successful removal
        expect(removed).toBe(true);

        // Child's parent should be null
        expect(child.parent).toBeNull();

        // Parent's children should not contain the child
        expect(parent.children).not.toContain(child);
        expect(parent.children.length).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it('removeChild should return false for non-existent child', () => {
    fc.assert(
      fc.property(primitiveTypeArb, primitiveTypeArb, (parentType, childType) => {
        const parent = new BasePrimitive(parentType);
        const child = new BasePrimitive(childType);

        // Don't add child to parent
        const removed = parent.removeChild(child);

        expect(removed).toBe(false);
        expect(child.parent).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it('insertChild should set child parent and insert at correct index', () => {
    fc.assert(
      fc.property(
        primitiveTypeArb,
        fc.array(primitiveTypeArb, { minLength: 1, maxLength: 5 }),
        fc.nat({ max: 10 }),
        (parentType, childTypes, insertIndex) => {
          const parent = new BasePrimitive(parentType);

          // Add initial children
          const initialChildren = childTypes.slice(0, -1).map((t) => {
            const c = new BasePrimitive(t);
            parent.appendChild(c);
            return c;
          });

          const newChild = new BasePrimitive(childTypes[childTypes.length - 1]);
          const clampedIndex = Math.min(insertIndex, initialChildren.length);

          parent.insertChild(newChild, insertIndex);

          // Child's parent should reference the parent
          expect(newChild.parent).toBe(parent);

          // Parent's children should contain the child at correct position
          expect(parent.children).toContain(newChild);
          expect(parent.children[clampedIndex]).toBe(newChild);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('multiple appendChild calls should maintain order', () => {
    fc.assert(
      fc.property(
        primitiveTypeArb,
        fc.array(primitiveTypeArb, { minLength: 1, maxLength: 10 }),
        (parentType, childTypes) => {
          const parent = new BasePrimitive(parentType);
          const children = childTypes.map((t) => new BasePrimitive(t));

          for (const child of children) {
            parent.appendChild(child);
          }

          // All children should be in order
          expect(parent.children.length).toBe(children.length);
          for (let i = 0; i < children.length; i++) {
            expect(parent.children[i]).toBe(children[i]);
            expect(children[i].parent).toBe(parent);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('appendChild should allow chaining', () => {
    fc.assert(
      fc.property(
        primitiveTypeArb,
        fc.array(primitiveTypeArb, { minLength: 2, maxLength: 5 }),
        (parentType, childTypes) => {
          const parent = new BasePrimitive(parentType);
          const children = childTypes.map((t) => new BasePrimitive(t));

          // Chain appendChild calls
          let result = parent;
          for (const child of children) {
            result = result.appendChild(child);
          }

          // Should return parent for chaining
          expect(result).toBe(parent);
          expect(parent.children.length).toBe(children.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: primitives-package, Property 4: Serialization Round-Trip**
 *
 * For any valid primitive tree, serializing with toTree() then reconstructing
 * with fromTree() SHALL produce a tree that is structurally equivalent to the
 * original, with all IDs, types, props, and parent-child relationships preserved.
 *
 * **Validates: Requirements 1.5, 1.6, 1.7**
 */
describe('Property 4: Serialization Round-Trip', () => {
  // Generator for a tree of primitives with configurable depth
  const primitiveTreeArb = (maxDepth = 3) => {
    const leafArb = fc.tuple(primitiveTypeArb, primitivePropsArb).map(([type, props]) => {
      return new BasePrimitive(type, props);
    });

    const nodeArb = (depth) => {
      if (depth <= 0) {
        return leafArb;
      }
      return fc.tuple(
        primitiveTypeArb,
        primitivePropsArb,
        fc.array(nodeArb(depth - 1), { minLength: 0, maxLength: 3 })
      ).map(([type, props, children]) => {
        const node = new BasePrimitive(type, props);
        for (const child of children) {
          node.appendChild(child);
        }
        return node;
      });
    };

    return nodeArb(maxDepth);
  };

  // Helper to compare two primitive trees structurally
  const treesAreEquivalent = (a, b) => {
    if (a.id !== b.id) return false;
    if (a.type !== b.type) return false;
    if (JSON.stringify(a.props) !== JSON.stringify(b.props)) return false;
    if (a.renderStrategy !== b.renderStrategy) return false;
    if (a.children.length !== b.children.length) return false;

    for (let i = 0; i < a.children.length; i++) {
      if (!treesAreEquivalent(a.children[i], b.children[i])) return false;
    }

    return true;
  };

  // Helper to verify parent-child relationships
  const verifyParentChildRelationships = (node, expectedParent = null) => {
    if (node.parent !== expectedParent) return false;

    for (const child of node.children) {
      if (!verifyParentChildRelationships(child, node)) return false;
    }

    return true;
  };

  it('toTree() then fromTree() should preserve IDs', () => {
    fc.assert(
      fc.property(primitiveTreeArb(3), (original) => {
        const tree = original.toTree();
        const reconstructed = BasePrimitive.fromTree(tree);

        expect(reconstructed.id).toBe(original.id);
      }),
      { numRuns: 100 }
    );
  });

  it('toTree() then fromTree() should preserve types', () => {
    fc.assert(
      fc.property(primitiveTreeArb(3), (original) => {
        const tree = original.toTree();
        const reconstructed = BasePrimitive.fromTree(tree);

        expect(reconstructed.type).toBe(original.type);
      }),
      { numRuns: 100 }
    );
  });

  it('toTree() then fromTree() should preserve props', () => {
    fc.assert(
      fc.property(primitiveTreeArb(3), (original) => {
        const tree = original.toTree();
        const reconstructed = BasePrimitive.fromTree(tree);

        expect(reconstructed.props).toEqual(original.props);
      }),
      { numRuns: 100 }
    );
  });

  it('toTree() then fromTree() should preserve tree structure', () => {
    fc.assert(
      fc.property(primitiveTreeArb(3), (original) => {
        const tree = original.toTree();
        const reconstructed = BasePrimitive.fromTree(tree);

        expect(treesAreEquivalent(original, reconstructed)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('toTree() then fromTree() should restore parent-child relationships', () => {
    fc.assert(
      fc.property(primitiveTreeArb(3), (original) => {
        const tree = original.toTree();
        const reconstructed = BasePrimitive.fromTree(tree);

        expect(verifyParentChildRelationships(reconstructed)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('toTree() should produce valid JSON structure', () => {
    fc.assert(
      fc.property(primitiveTreeArb(3), (original) => {
        const tree = original.toTree();

        // Should have required fields
        expect(typeof tree.id).toBe('string');
        expect(typeof tree.type).toBe('string');
        expect(typeof tree.props).toBe('object');
        expect(typeof tree.renderStrategy).toBe('string');
        expect(Array.isArray(tree.children)).toBe(true);

        // Should be JSON serializable
        const json = JSON.stringify(tree);
        const parsed = JSON.parse(json);
        expect(parsed).toEqual(tree);
      }),
      { numRuns: 100 }
    );
  });

  it('toPrettyString() should produce readable output', () => {
    fc.assert(
      fc.property(primitiveTreeArb(2), (original) => {
        const prettyString = original.toPrettyString();

        // Should be a non-empty string
        expect(typeof prettyString).toBe('string');
        expect(prettyString.length).toBeGreaterThan(0);

        // Should contain the type
        expect(prettyString).toContain(original.type);

        // Should have opening and closing tags
        expect(prettyString).toContain(`<${original.type}`);
        expect(prettyString).toContain(`</${original.type}>`);
      }),
      { numRuns: 100 }
    );
  });

  it('multiple round-trips should be idempotent', () => {
    fc.assert(
      fc.property(primitiveTreeArb(3), (original) => {
        // First round-trip
        const tree1 = original.toTree();
        const reconstructed1 = BasePrimitive.fromTree(tree1);

        // Second round-trip
        const tree2 = reconstructed1.toTree();
        const reconstructed2 = BasePrimitive.fromTree(tree2);

        // Both reconstructions should be equivalent
        expect(treesAreEquivalent(reconstructed1, reconstructed2)).toBe(true);
        expect(tree1).toEqual(tree2);
      }),
      { numRuns: 100 }
    );
  });
});
