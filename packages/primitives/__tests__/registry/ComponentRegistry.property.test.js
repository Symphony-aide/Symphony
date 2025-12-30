/**
 * @fileoverview Property-based tests for ComponentRegistry class
 *
 * These tests use fast-check to verify universal properties that should hold
 * across all valid inputs to the ComponentRegistry class.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { ComponentRegistry } from '../../src/registry/ComponentRegistry.js';
import { BasePrimitive } from '../../src/core/BasePrimitive.js';

// Arbitrary generators
const componentNameArb = fc.stringMatching(/^[a-z][a-zA-Z0-9-]*$/);
const primitiveTypeArb = fc.stringMatching(/^[A-Z][a-zA-Z0-9]*$/);

const primitivePropsArb = fc.dictionary(
  fc.stringMatching(/^[a-z][a-zA-Z0-9]*$/),
  fc.oneof(
    fc.string(),
    fc.integer(),
    fc.boolean(),
    fc.constant(null),
  ),
  { maxKeys: 5 }
);

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

// Helper to collect all nodes in a tree
const collectAllNodes = (root) => {
  const nodes = [root];
  for (const child of root.children) {
    nodes.push(...collectAllNodes(child));
  }
  return nodes;
};

/**
 * **Feature: primitives-package, Property 5: Registry Registration and Indexing**
 *
 * For any component tree registered with a name, the registry SHALL store the root
 * accessible by that name AND every node in the tree SHALL be indexed by its unique
 * ID for O(1) lookup.
 *
 * **Validates: Requirements 2.1**
 */
describe('Property 5: Registry Registration and Indexing', () => {
  it('should store root primitive accessible by name after registration', () => {
    fc.assert(
      fc.property(componentNameArb, primitiveTreeArb(3), (name, root) => {
        const registry = new ComponentRegistry();
        registry.registerComponent(name, root);

        const retrieved = registry.getComponent(name);
        expect(retrieved).toBe(root);
      }),
      { numRuns: 100 }
    );
  });

  it('should index all nodes in tree by their unique IDs', () => {
    fc.assert(
      fc.property(componentNameArb, primitiveTreeArb(3), (name, root) => {
        const registry = new ComponentRegistry();
        registry.registerComponent(name, root);

        const allNodes = collectAllNodes(root);
        for (const node of allNodes) {
          const indexed = registry.getNodeById(node.id);
          expect(indexed).toBe(node);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should have index size equal to total node count', () => {
    fc.assert(
      fc.property(componentNameArb, primitiveTreeArb(3), (name, root) => {
        const registry = new ComponentRegistry();
        registry.registerComponent(name, root);

        const allNodes = collectAllNodes(root);
        expect(registry.getIndexSize()).toBe(allNodes.length);
      }),
      { numRuns: 100 }
    );
  });

  it('should return component name in getComponentNames()', () => {
    fc.assert(
      fc.property(componentNameArb, primitiveTreeArb(2), (name, root) => {
        const registry = new ComponentRegistry();
        registry.registerComponent(name, root);

        const names = registry.getComponentNames();
        expect(names).toContain(name);
      }),
      { numRuns: 100 }
    );
  });

  it('should return serialized tree from getComponentTree()', () => {
    fc.assert(
      fc.property(componentNameArb, primitiveTreeArb(2), (name, root) => {
        const registry = new ComponentRegistry();
        registry.registerComponent(name, root);

        const tree = registry.getComponentTree(name);
        expect(tree).not.toBeNull();
        expect(tree.id).toBe(root.id);
        expect(tree.type).toBe(root.type);
      }),
      { numRuns: 100 }
    );
  });

  it('should remove all nodes from index on unregister', () => {
    fc.assert(
      fc.property(componentNameArb, primitiveTreeArb(3), (name, root) => {
        const registry = new ComponentRegistry();
        registry.registerComponent(name, root);
        const allNodes = collectAllNodes(root);

        registry.unregisterComponent(name);

        // All nodes should be removed from index
        for (const node of allNodes) {
          expect(registry.getNodeById(node.id)).toBeUndefined();
        }
        expect(registry.getComponent(name)).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  it('should handle multiple component registrations independently', () => {
    fc.assert(
      fc.property(
        fc.array(fc.tuple(componentNameArb, primitiveTreeArb(2)), { minLength: 2, maxLength: 5 }),
        (components) => {
          const registry = new ComponentRegistry();
          // Make names unique
          const uniqueComponents = components.map(([name, root], i) => [`${name}_${i}`, root]);

          for (const [name, root] of uniqueComponents) {
            registry.registerComponent(name, root);
          }

          // Each component should be independently accessible
          for (const [name, root] of uniqueComponents) {
            expect(registry.getComponent(name)).toBe(root);
          }

          // Total index size should be sum of all nodes
          const totalNodes = uniqueComponents.reduce(
            (sum, [, root]) => sum + collectAllNodes(root).length,
            0
          );
          expect(registry.getIndexSize()).toBe(totalNodes);
        }
      ),
      { numRuns: 50 }
    );
  });
});


/**
 * **Feature: primitives-package, Property 6: Path Resolution with Array Indexing**
 *
 * For any valid path including array indices (e.g., "Button[0]"), findByPath SHALL
 * return the correct primitive node by matching types and selecting the nth child
 * of that type when an index is specified.
 *
 * **Validates: Requirements 2.3**
 */
describe('Property 6: Path Resolution with Array Indexing', () => {
  it('should resolve path to root when path contains only root type', () => {
    fc.assert(
      fc.property(componentNameArb, primitiveTreeArb(3), (name, root) => {
        const registry = new ComponentRegistry();
        registry.registerComponent(name, root);

        const found = registry.findByPath(name, [root.type]);
        expect(found).toBe(root);
      }),
      { numRuns: 100 }
    );
  });

  it('should resolve path to direct child by type', () => {
    fc.assert(
      fc.property(
        componentNameArb,
        primitiveTypeArb,
        primitiveTypeArb,
        (name, parentType, childType) => {
          const registry = new ComponentRegistry();
          const parent = new BasePrimitive(parentType);
          const child = new BasePrimitive(childType);
          parent.appendChild(child);
          registry.registerComponent(name, parent);

          const found = registry.findByPath(name, [parentType, childType]);
          expect(found).toBe(child);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should resolve path with array index to correct child', () => {
    fc.assert(
      fc.property(
        componentNameArb,
        primitiveTypeArb,
        primitiveTypeArb,
        fc.integer({ min: 2, max: 5 }),
        fc.nat(),
        (name, parentType, childType, numChildren, targetIndexSeed) => {
          const registry = new ComponentRegistry();
          const parent = new BasePrimitive(parentType);
          const children = [];

          // Create multiple children of the same type
          for (let i = 0; i < numChildren; i++) {
            const child = new BasePrimitive(childType);
            parent.appendChild(child);
            children.push(child);
          }

          registry.registerComponent(name, parent);

          // Target a valid index
          const targetIndex = targetIndexSeed % numChildren;
          const found = registry.findByPath(name, [parentType, `${childType}[${targetIndex}]`]);
          expect(found).toBe(children[targetIndex]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return null for non-existent path', () => {
    fc.assert(
      fc.property(componentNameArb, primitiveTreeArb(2), primitiveTypeArb, (name, root, nonExistentType) => {
        const registry = new ComponentRegistry();
        registry.registerComponent(name, root);

        // Use a type that doesn't exist in the tree
        const found = registry.findByPath(name, [root.type, `NonExistent_${nonExistentType}`]);
        expect(found).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it('should return null for out-of-bounds array index', () => {
    fc.assert(
      fc.property(
        componentNameArb,
        primitiveTypeArb,
        primitiveTypeArb,
        fc.integer({ min: 1, max: 3 }),
        (name, parentType, childType, numChildren) => {
          const registry = new ComponentRegistry();
          const parent = new BasePrimitive(parentType);

          for (let i = 0; i < numChildren; i++) {
            parent.appendChild(new BasePrimitive(childType));
          }

          registry.registerComponent(name, parent);

          // Try to access an out-of-bounds index
          const found = registry.findByPath(name, [parentType, `${childType}[${numChildren + 10}]`]);
          expect(found).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return null for non-existent component', () => {
    fc.assert(
      fc.property(componentNameArb, primitiveTypeArb, (name, type) => {
        const registry = new ComponentRegistry();
        // Don't register any component

        const found = registry.findByPath(name, [type]);
        expect(found).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it('should resolve deep nested paths correctly', () => {
    fc.assert(
      fc.property(
        componentNameArb,
        fc.array(primitiveTypeArb, { minLength: 2, maxLength: 5 }),
        (name, types) => {
          const registry = new ComponentRegistry();

          // Build a linear chain of primitives
          const nodes = types.map((type) => new BasePrimitive(type));
          for (let i = 0; i < nodes.length - 1; i++) {
            nodes[i].appendChild(nodes[i + 1]);
          }

          registry.registerComponent(name, nodes[0]);

          // Resolve path to the deepest node
          const found = registry.findByPath(name, types);
          expect(found).toBe(nodes[nodes.length - 1]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return root for empty path', () => {
    fc.assert(
      fc.property(componentNameArb, primitiveTreeArb(2), (name, root) => {
        const registry = new ComponentRegistry();
        registry.registerComponent(name, root);

        const found = registry.findByPath(name, []);
        expect(found).toBe(root);
      }),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: primitives-package, Property 7: Component Modification and Notification**
 *
 * For any registered component and valid modification, after modifyComponent is called,
 * the target primitive's props SHALL be updated AND a 'component-tree-changed' event
 * SHALL be dispatched with the component name.
 *
 * **Validates: Requirements 2.4**
 */
describe('Property 7: Component Modification and Notification', () => {
  it('should update primitive props after modification', () => {
    fc.assert(
      fc.property(
        componentNameArb,
        primitiveTypeArb,
        primitivePropsArb,
        primitivePropsArb,
        (name, type, initialProps, newProps) => {
          const registry = new ComponentRegistry();
          const primitive = new BasePrimitive(type, initialProps);
          registry.registerComponent(name, primitive);

          registry.modifyComponent(name, [type], { props: newProps });

          // All new props should be applied
          for (const [key, value] of Object.entries(newProps)) {
            expect(primitive.props[key]).toEqual(value);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve existing props not in modification', () => {
    fc.assert(
      fc.property(
        componentNameArb,
        primitiveTypeArb,
        (name, type) => {
          const registry = new ComponentRegistry();
          const initialProps = { existingProp: 'original', anotherProp: 42 };
          const primitive = new BasePrimitive(type, initialProps);
          registry.registerComponent(name, primitive);

          registry.modifyComponent(name, [type], { props: { newProp: 'added' } });

          // Existing props should be preserved
          expect(primitive.props.existingProp).toBe('original');
          expect(primitive.props.anotherProp).toBe(42);
          expect(primitive.props.newProp).toBe('added');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should dispatch component-tree-changed event on modification', () => {
    fc.assert(
      fc.property(
        componentNameArb,
        primitiveTypeArb,
        primitivePropsArb,
        (name, type, newProps) => {
          const registry = new ComponentRegistry();
          const primitive = new BasePrimitive(type);
          registry.registerComponent(name, primitive);

          let eventFired = false;
          let eventDetail = null;

          const handler = (event) => {
            eventFired = true;
            eventDetail = event.detail;
          };

          // Add event listener
          if (typeof addEventListener !== 'undefined') {
            addEventListener('component-tree-changed', handler);
          }

          try {
            registry.modifyComponent(name, [type], { props: newProps });

            if (typeof addEventListener !== 'undefined') {
              expect(eventFired).toBe(true);
              expect(eventDetail.componentName).toBe(name);
            }
          } finally {
            if (typeof removeEventListener !== 'undefined') {
              removeEventListener('component-tree-changed', handler);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should throw error for non-existent component', () => {
    fc.assert(
      fc.property(componentNameArb, primitiveTypeArb, (name, type) => {
        const registry = new ComponentRegistry();
        // Don't register any component

        expect(() => {
          registry.modifyComponent(name, [type], { props: { test: 'value' } });
        }).toThrow();
      }),
      { numRuns: 100 }
    );
  });

  it('should throw error for invalid path', () => {
    fc.assert(
      fc.property(componentNameArb, primitiveTypeArb, primitiveTypeArb, (name, type, invalidType) => {
        const registry = new ComponentRegistry();
        const primitive = new BasePrimitive(type);
        registry.registerComponent(name, primitive);

        expect(() => {
          registry.modifyComponent(name, [type, `Invalid_${invalidType}`], { props: { test: 'value' } });
        }).toThrow();
      }),
      { numRuns: 100 }
    );
  });

  it('should modify nested primitive props', () => {
    fc.assert(
      fc.property(
        componentNameArb,
        primitiveTypeArb,
        primitiveTypeArb,
        primitivePropsArb,
        (name, parentType, childType, newProps) => {
          const registry = new ComponentRegistry();
          const parent = new BasePrimitive(parentType);
          const child = new BasePrimitive(childType, { original: 'value' });
          parent.appendChild(child);
          registry.registerComponent(name, parent);

          registry.modifyComponent(name, [parentType, childType], { props: newProps });

          // Child props should be updated
          for (const [key, value] of Object.entries(newProps)) {
            expect(child.props[key]).toEqual(value);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: primitives-package, Property 8: Primitive Insertion**
 *
 * For any registered component, valid parent path, and new primitive, after insertPrimitive
 * is called, the new primitive SHALL appear in the parent's children at the specified index
 * (or at the end if no index), and the tree index SHALL include the new primitive.
 *
 * **Validates: Requirements 2.5**
 */
describe('Property 8: Primitive Insertion', () => {
  it('should insert primitive at end when no index specified', () => {
    fc.assert(
      fc.property(
        componentNameArb,
        primitiveTypeArb,
        primitiveTypeArb,
        fc.integer({ min: 0, max: 3 }),
        (name, parentType, newChildType, existingChildCount) => {
          const registry = new ComponentRegistry();
          const parent = new BasePrimitive(parentType);

          // Add some existing children
          for (let i = 0; i < existingChildCount; i++) {
            parent.appendChild(new BasePrimitive('ExistingChild'));
          }

          registry.registerComponent(name, parent);

          const newChild = new BasePrimitive(newChildType);
          registry.insertPrimitive(name, [parentType], newChild);

          // New child should be at the end
          expect(parent.children[parent.children.length - 1]).toBe(newChild);
          expect(parent.children.length).toBe(existingChildCount + 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should insert primitive at specified index', () => {
    fc.assert(
      fc.property(
        componentNameArb,
        primitiveTypeArb,
        primitiveTypeArb,
        fc.integer({ min: 2, max: 5 }),
        fc.nat(),
        (name, parentType, newChildType, existingChildCount, indexSeed) => {
          const registry = new ComponentRegistry();
          const parent = new BasePrimitive(parentType);

          // Add existing children
          for (let i = 0; i < existingChildCount; i++) {
            parent.appendChild(new BasePrimitive('ExistingChild'));
          }

          registry.registerComponent(name, parent);

          const insertIndex = indexSeed % (existingChildCount + 1);
          const newChild = new BasePrimitive(newChildType);
          registry.insertPrimitive(name, [parentType], newChild, insertIndex);

          // New child should be at the specified index
          expect(parent.children[insertIndex]).toBe(newChild);
          expect(parent.children.length).toBe(existingChildCount + 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should index inserted primitive by ID', () => {
    fc.assert(
      fc.property(
        componentNameArb,
        primitiveTypeArb,
        primitiveTypeArb,
        (name, parentType, newChildType) => {
          const registry = new ComponentRegistry();
          const parent = new BasePrimitive(parentType);
          registry.registerComponent(name, parent);

          const newChild = new BasePrimitive(newChildType);
          registry.insertPrimitive(name, [parentType], newChild);

          // New child should be indexed
          expect(registry.getNodeById(newChild.id)).toBe(newChild);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should index all descendants of inserted primitive', () => {
    fc.assert(
      fc.property(
        componentNameArb,
        primitiveTypeArb,
        primitiveTreeArb(2),
        (name, parentType, newSubtree) => {
          const registry = new ComponentRegistry();
          const parent = new BasePrimitive(parentType);
          registry.registerComponent(name, parent);

          registry.insertPrimitive(name, [parentType], newSubtree);

          // All nodes in the subtree should be indexed
          const allNodes = collectAllNodes(newSubtree);
          for (const node of allNodes) {
            expect(registry.getNodeById(node.id)).toBe(node);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should set parent reference on inserted primitive', () => {
    fc.assert(
      fc.property(
        componentNameArb,
        primitiveTypeArb,
        primitiveTypeArb,
        (name, parentType, newChildType) => {
          const registry = new ComponentRegistry();
          const parent = new BasePrimitive(parentType);
          registry.registerComponent(name, parent);

          const newChild = new BasePrimitive(newChildType);
          registry.insertPrimitive(name, [parentType], newChild);

          expect(newChild.parent).toBe(parent);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should dispatch change event on insertion', () => {
    fc.assert(
      fc.property(
        componentNameArb,
        primitiveTypeArb,
        primitiveTypeArb,
        (name, parentType, newChildType) => {
          const registry = new ComponentRegistry();
          const parent = new BasePrimitive(parentType);
          registry.registerComponent(name, parent);

          let eventFired = false;
          const handler = (event) => {
            eventFired = true;
            expect(event.detail.componentName).toBe(name);
          };

          if (typeof addEventListener !== 'undefined') {
            addEventListener('component-tree-changed', handler);
          }

          try {
            const newChild = new BasePrimitive(newChildType);
            registry.insertPrimitive(name, [parentType], newChild);

            if (typeof addEventListener !== 'undefined') {
              expect(eventFired).toBe(true);
            }
          } finally {
            if (typeof removeEventListener !== 'undefined') {
              removeEventListener('component-tree-changed', handler);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should throw error for invalid parent path', () => {
    fc.assert(
      fc.property(componentNameArb, primitiveTypeArb, primitiveTypeArb, (name, parentType, newChildType) => {
        const registry = new ComponentRegistry();
        const parent = new BasePrimitive(parentType);
        registry.registerComponent(name, parent);

        const newChild = new BasePrimitive(newChildType);
        expect(() => {
          registry.insertPrimitive(name, [parentType, 'NonExistent'], newChild);
        }).toThrow();
      }),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: primitives-package, Property 9: Primitive Removal**
 *
 * For any registered component and valid path to a non-root primitive, after removePrimitive
 * is called, the primitive SHALL NOT be in its former parent's children AND SHALL NOT be
 * in the tree index.
 *
 * **Validates: Requirements 2.6**
 */
describe('Property 9: Primitive Removal', () => {
  it('should remove primitive from parent children', () => {
    fc.assert(
      fc.property(
        componentNameArb,
        primitiveTypeArb,
        primitiveTypeArb,
        (name, parentType, childType) => {
          const registry = new ComponentRegistry();
          const parent = new BasePrimitive(parentType);
          const child = new BasePrimitive(childType);
          parent.appendChild(child);
          registry.registerComponent(name, parent);

          registry.removePrimitive(name, [parentType, childType]);

          expect(parent.children).not.toContain(child);
          expect(parent.children.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should remove primitive from tree index', () => {
    fc.assert(
      fc.property(
        componentNameArb,
        primitiveTypeArb,
        primitiveTypeArb,
        (name, parentType, childType) => {
          const registry = new ComponentRegistry();
          const parent = new BasePrimitive(parentType);
          const child = new BasePrimitive(childType);
          parent.appendChild(child);
          registry.registerComponent(name, parent);

          const childId = child.id;
          registry.removePrimitive(name, [parentType, childType]);

          expect(registry.getNodeById(childId)).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should remove all descendants from tree index', () => {
    fc.assert(
      fc.property(
        componentNameArb,
        primitiveTypeArb,
        primitiveTreeArb(2),
        (name, parentType, subtree) => {
          const registry = new ComponentRegistry();
          const parent = new BasePrimitive(parentType);
          parent.appendChild(subtree);
          registry.registerComponent(name, parent);

          // Collect all node IDs before removal
          const allNodeIds = collectAllNodes(subtree).map((n) => n.id);

          registry.removePrimitive(name, [parentType, subtree.type]);

          // All nodes should be removed from index
          for (const id of allNodeIds) {
            expect(registry.getNodeById(id)).toBeUndefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should clear parent reference on removed primitive', () => {
    fc.assert(
      fc.property(
        componentNameArb,
        primitiveTypeArb,
        primitiveTypeArb,
        (name, parentType, childType) => {
          const registry = new ComponentRegistry();
          const parent = new BasePrimitive(parentType);
          const child = new BasePrimitive(childType);
          parent.appendChild(child);
          registry.registerComponent(name, parent);

          registry.removePrimitive(name, [parentType, childType]);

          expect(child.parent).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should dispatch change event on removal', () => {
    fc.assert(
      fc.property(
        componentNameArb,
        primitiveTypeArb,
        primitiveTypeArb,
        (name, parentType, childType) => {
          const registry = new ComponentRegistry();
          const parent = new BasePrimitive(parentType);
          const child = new BasePrimitive(childType);
          parent.appendChild(child);
          registry.registerComponent(name, parent);

          let eventFired = false;
          const handler = (event) => {
            eventFired = true;
            expect(event.detail.componentName).toBe(name);
          };

          if (typeof addEventListener !== 'undefined') {
            addEventListener('component-tree-changed', handler);
          }

          try {
            registry.removePrimitive(name, [parentType, childType]);

            if (typeof addEventListener !== 'undefined') {
              expect(eventFired).toBe(true);
            }
          } finally {
            if (typeof removeEventListener !== 'undefined') {
              removeEventListener('component-tree-changed', handler);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should throw error when trying to remove root', () => {
    fc.assert(
      fc.property(componentNameArb, primitiveTypeArb, (name, type) => {
        const registry = new ComponentRegistry();
        const root = new BasePrimitive(type);
        registry.registerComponent(name, root);

        expect(() => {
          registry.removePrimitive(name, [type]);
        }).toThrow();
      }),
      { numRuns: 100 }
    );
  });

  it('should throw error for empty path', () => {
    fc.assert(
      fc.property(componentNameArb, primitiveTypeArb, (name, type) => {
        const registry = new ComponentRegistry();
        const root = new BasePrimitive(type);
        registry.registerComponent(name, root);

        expect(() => {
          registry.removePrimitive(name, []);
        }).toThrow();
      }),
      { numRuns: 100 }
    );
  });

  it('should throw error for invalid path', () => {
    fc.assert(
      fc.property(componentNameArb, primitiveTypeArb, (name, type) => {
        const registry = new ComponentRegistry();
        const root = new BasePrimitive(type);
        registry.registerComponent(name, root);

        expect(() => {
          registry.removePrimitive(name, [type, 'NonExistent']);
        }).toThrow();
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve other siblings after removal', () => {
    fc.assert(
      fc.property(
        componentNameArb,
        primitiveTypeArb,
        fc.integer({ min: 2, max: 5 }),
        fc.nat(),
        (name, parentType, numChildren, removeIndexSeed) => {
          const registry = new ComponentRegistry();
          const parent = new BasePrimitive(parentType);
          const children = [];

          for (let i = 0; i < numChildren; i++) {
            const child = new BasePrimitive(`Child${i}`);
            parent.appendChild(child);
            children.push(child);
          }

          registry.registerComponent(name, parent);

          const removeIndex = removeIndexSeed % numChildren;
          const childToRemove = children[removeIndex];
          registry.removePrimitive(name, [parentType, childToRemove.type]);

          // Other children should still be present
          expect(parent.children.length).toBe(numChildren - 1);
          for (let i = 0; i < numChildren; i++) {
            if (i !== removeIndex) {
              expect(parent.children).toContain(children[i]);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: primitives-package, Property 10: Event Handler Registration and Invocation**
 *
 * For any handler ID and function, after registerEventHandler is called, invokeEventHandler
 * with that ID SHALL call the registered function with the provided arguments and return
 * its result.
 *
 * **Validates: Requirements 2.7**
 */
describe('Property 10: Event Handler Registration and Invocation', () => {
  const handlerIdArb = fc.stringMatching(/^[a-z][a-zA-Z0-9_-]*$/);

  it('should register and invoke handler with correct arguments', async () => {
    await fc.assert(
      fc.asyncProperty(
        handlerIdArb,
        fc.array(fc.oneof(fc.string(), fc.integer(), fc.boolean()), { maxLength: 5 }),
        async (handlerId, args) => {
          const registry = new ComponentRegistry();
          let receivedArgs = null;

          const handler = (...passedArgs) => {
            receivedArgs = passedArgs;
            return 'result';
          };

          registry.registerEventHandler(handlerId, handler);
          await registry.invokeEventHandler(handlerId, ...args);

          expect(receivedArgs).toEqual(args);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return handler result', async () => {
    await fc.assert(
      fc.asyncProperty(
        handlerIdArb,
        fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null)),
        async (handlerId, returnValue) => {
          const registry = new ComponentRegistry();

          const handler = () => returnValue;
          registry.registerEventHandler(handlerId, handler);

          const result = await registry.invokeEventHandler(handlerId);
          expect(result).toEqual(returnValue);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should support async handlers', async () => {
    await fc.assert(
      fc.asyncProperty(handlerIdArb, fc.string(), async (handlerId, returnValue) => {
        const registry = new ComponentRegistry();

        const asyncHandler = async () => {
          return returnValue;
        };

        registry.registerEventHandler(handlerId, asyncHandler);
        const result = await registry.invokeEventHandler(handlerId);

        expect(result).toBe(returnValue);
      }),
      { numRuns: 100 }
    );
  });

  it('should throw error for non-existent handler', async () => {
    await fc.assert(
      fc.asyncProperty(handlerIdArb, async (handlerId) => {
        const registry = new ComponentRegistry();
        // Don't register any handler

        await expect(registry.invokeEventHandler(handlerId)).rejects.toThrow();
      }),
      { numRuns: 100 }
    );
  });

  it('should unregister handler successfully', () => {
    fc.assert(
      fc.property(handlerIdArb, (handlerId) => {
        const registry = new ComponentRegistry();
        const handler = () => 'result';

        registry.registerEventHandler(handlerId, handler);
        expect(registry.hasEventHandler(handlerId)).toBe(true);

        const removed = registry.unregisterEventHandler(handlerId);
        expect(removed).toBe(true);
        expect(registry.hasEventHandler(handlerId)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should return false when unregistering non-existent handler', () => {
    fc.assert(
      fc.property(handlerIdArb, (handlerId) => {
        const registry = new ComponentRegistry();
        // Don't register any handler

        const removed = registry.unregisterEventHandler(handlerId);
        expect(removed).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should allow re-registration of handler with same ID', async () => {
    await fc.assert(
      fc.asyncProperty(handlerIdArb, async (handlerId) => {
        const registry = new ComponentRegistry();

        const handler1 = () => 'first';
        const handler2 = () => 'second';

        registry.registerEventHandler(handlerId, handler1);
        registry.registerEventHandler(handlerId, handler2);

        const result = await registry.invokeEventHandler(handlerId);
        expect(result).toBe('second');
      }),
      { numRuns: 100 }
    );
  });

  it('should handle multiple handlers independently', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(handlerIdArb, { minLength: 2, maxLength: 5 }),
        async (handlerIds) => {
          const registry = new ComponentRegistry();
          // Make IDs unique
          const uniqueIds = handlerIds.map((id, i) => `${id}_${i}`);

          for (const id of uniqueIds) {
            registry.registerEventHandler(id, () => id);
          }

          for (const id of uniqueIds) {
            const result = await registry.invokeEventHandler(id);
            expect(result).toBe(id);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should throw error for invalid handler ID', () => {
    fc.assert(
      fc.property(fc.constant(''), () => {
        const registry = new ComponentRegistry();

        expect(() => {
          registry.registerEventHandler('', () => {});
        }).toThrow();
      }),
      { numRuns: 10 }
    );
  });

  it('should throw error for non-function handler', () => {
    fc.assert(
      fc.property(handlerIdArb, fc.oneof(fc.string(), fc.integer(), fc.constant(null)), (handlerId, notAFunction) => {
        const registry = new ComponentRegistry();

        expect(() => {
          registry.registerEventHandler(handlerId, notAFunction);
        }).toThrow();
      }),
      { numRuns: 100 }
    );
  });
});
