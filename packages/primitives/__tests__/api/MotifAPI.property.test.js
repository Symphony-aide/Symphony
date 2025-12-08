/**
 * @fileoverview Property-based tests for MotifAPI class
 *
 * These tests use fast-check to verify universal properties that should hold
 * across all valid inputs to the MotifAPI class.
 *
 * **Feature: primitives-package, Property 19: Motif API Operations**
 *
 * For any sequence of Motif API operations (getComponentList, getComponent,
 * modifyComponent, insertPrimitive, removePrimitive), the operations SHALL
 * correctly reflect the current state of the registry and modifications SHALL
 * be immediately visible to subsequent queries.
 *
 * **Validates: Requirements 11.1-11.6**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { MotifAPI } from '../../src/api/MotifAPI.js';
import { ComponentRegistry } from '../../src/registry/ComponentRegistry.js';
import { BasePrimitive } from '../../src/core/BasePrimitive.js';

// Arbitrary generators
const componentNameArb = fc.stringMatching(/^[a-z][a-zA-Z0-9-]*$/);
const primitiveTypeArb = fc.stringMatching(/^[A-Z][a-zA-Z0-9]*$/);
const handlerIdArb = fc.stringMatching(/^[a-z][a-zA-Z0-9-]*$/);

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

describe('Property 19: Motif API Operations', () => {
  /**
   * Test: getComponentList() returns all registered component names
   * **Validates: Requirements 11.1**
   */
  describe('getComponentList()', () => {
    it('should return empty array when no components registered', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const api = new MotifAPI();
          const list = api.getComponentList();
          expect(list).toEqual([]);
        }),
        { numRuns: 10 }
      );
    });

    it('should return all registered component names', () => {
      fc.assert(
        fc.property(
          fc.array(fc.tuple(componentNameArb, primitiveTreeArb(2)), { minLength: 1, maxLength: 5 }),
          (components) => {
            const api = new MotifAPI();
            // Make names unique
            const uniqueComponents = components.map(([name, root], i) => [`${name}_${i}`, root]);

            for (const [name, root] of uniqueComponents) {
              api.registerComponent(name, root);
            }

            const list = api.getComponentList();
            for (const [name] of uniqueComponents) {
              expect(list).toContain(name);
            }
            expect(list.length).toBe(uniqueComponents.length);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should reflect unregistered components immediately', () => {
      fc.assert(
        fc.property(
          componentNameArb,
          primitiveTreeArb(2),
          (name, root) => {
            const api = new MotifAPI();
            api.registerComponent(name, root);

            expect(api.getComponentList()).toContain(name);

            api.unregisterComponent(name);

            expect(api.getComponentList()).not.toContain(name);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Test: getComponent() returns complete component tree
   * **Validates: Requirements 11.2**
   */
  describe('getComponent()', () => {
    it('should return null for non-existent component', () => {
      fc.assert(
        fc.property(componentNameArb, (name) => {
          const api = new MotifAPI();
          const tree = api.getComponent(name);
          expect(tree).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should return complete component tree for registered component', () => {
      fc.assert(
        fc.property(componentNameArb, primitiveTreeArb(3), (name, root) => {
          const api = new MotifAPI();
          api.registerComponent(name, root);

          const tree = api.getComponent(name);
          expect(tree).not.toBeNull();
          expect(tree.id).toBe(root.id);
          expect(tree.type).toBe(root.type);
          expect(tree.children.length).toBe(root.children.length);
        }),
        { numRuns: 100 }
      );
    });

    it('should return serialized tree with all props', () => {
      fc.assert(
        fc.property(componentNameArb, primitiveTypeArb, primitivePropsArb, (name, type, props) => {
          const api = new MotifAPI();
          const root = new BasePrimitive(type, props);
          api.registerComponent(name, root);

          const tree = api.getComponent(name);
          expect(tree.props).toEqual(props);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Test: modifyComponent() applies modifications correctly
   * **Validates: Requirements 11.3**
   */
  describe('modifyComponent()', () => {
    it('should update primitive props', () => {
      fc.assert(
        fc.property(
          componentNameArb,
          primitiveTypeArb,
          primitivePropsArb,
          primitivePropsArb,
          (name, type, initialProps, newProps) => {
            const api = new MotifAPI();
            const root = new BasePrimitive(type, initialProps);
            api.registerComponent(name, root);

            api.modifyComponent(name, [type], { props: newProps });

            // Verify modifications are immediately visible
            const tree = api.getComponent(name);
            for (const [key, value] of Object.entries(newProps)) {
              expect(tree.props[key]).toEqual(value);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should modify nested primitives', () => {
      fc.assert(
        fc.property(
          componentNameArb,
          primitiveTypeArb,
          primitiveTypeArb,
          primitivePropsArb,
          (name, parentType, childType, newProps) => {
            const api = new MotifAPI();
            const parent = new BasePrimitive(parentType);
            const child = new BasePrimitive(childType, { original: 'value' });
            parent.appendChild(child);
            api.registerComponent(name, parent);

            api.modifyComponent(name, [parentType, childType], { props: newProps });

            // Verify via findByPath
            const modifiedChild = api.findByPath(name, [parentType, childType]);
            for (const [key, value] of Object.entries(newProps)) {
              expect(modifiedChild.props[key]).toEqual(value);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should throw error for non-existent component', () => {
      fc.assert(
        fc.property(componentNameArb, primitiveTypeArb, (name, type) => {
          const api = new MotifAPI();

          expect(() => {
            api.modifyComponent(name, [type], { props: { test: 'value' } });
          }).toThrow();
        }),
        { numRuns: 100 }
      );
    });

    it('should throw error for invalid path', () => {
      fc.assert(
        fc.property(componentNameArb, primitiveTypeArb, (name, type) => {
          const api = new MotifAPI();
          const root = new BasePrimitive(type);
          api.registerComponent(name, root);

          expect(() => {
            api.modifyComponent(name, [type, 'NonExistent'], { props: { test: 'value' } });
          }).toThrow();
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Test: insertPrimitive() inserts at correct location
   * **Validates: Requirements 11.4**
   */
  describe('insertPrimitive()', () => {
    it('should insert primitive at end when no index specified', () => {
      fc.assert(
        fc.property(
          componentNameArb,
          primitiveTypeArb,
          primitiveTypeArb,
          fc.integer({ min: 0, max: 3 }),
          (name, parentType, newChildType, existingChildCount) => {
            const api = new MotifAPI();
            const parent = new BasePrimitive(parentType);

            for (let i = 0; i < existingChildCount; i++) {
              parent.appendChild(new BasePrimitive('ExistingChild'));
            }

            api.registerComponent(name, parent);

            const newChild = new BasePrimitive(newChildType);
            api.insertPrimitive(name, [parentType], newChild);

            // Verify insertion is immediately visible
            const tree = api.getComponent(name);
            expect(tree.children.length).toBe(existingChildCount + 1);
            expect(tree.children[tree.children.length - 1].type).toBe(newChildType);
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
            const api = new MotifAPI();
            const parent = new BasePrimitive(parentType);

            for (let i = 0; i < existingChildCount; i++) {
              parent.appendChild(new BasePrimitive('ExistingChild'));
            }

            api.registerComponent(name, parent);

            const insertIndex = indexSeed % (existingChildCount + 1);
            const newChild = new BasePrimitive(newChildType);
            api.insertPrimitive(name, [parentType], newChild, insertIndex);

            // Verify insertion at correct index
            const foundChild = api.findByPath(name, [parentType]);
            expect(foundChild.children[insertIndex]).toBe(newChild);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should throw error for invalid parent path', () => {
      fc.assert(
        fc.property(componentNameArb, primitiveTypeArb, primitiveTypeArb, (name, parentType, newChildType) => {
          const api = new MotifAPI();
          const parent = new BasePrimitive(parentType);
          api.registerComponent(name, parent);

          const newChild = new BasePrimitive(newChildType);
          expect(() => {
            api.insertPrimitive(name, [parentType, 'NonExistent'], newChild);
          }).toThrow();
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Test: removePrimitive() removes correctly
   * **Validates: Requirements 11.5**
   */
  describe('removePrimitive()', () => {
    it('should remove primitive from parent', () => {
      fc.assert(
        fc.property(
          componentNameArb,
          primitiveTypeArb,
          primitiveTypeArb,
          (name, parentType, childType) => {
            const api = new MotifAPI();
            const parent = new BasePrimitive(parentType);
            const child = new BasePrimitive(childType);
            parent.appendChild(child);
            api.registerComponent(name, parent);

            api.removePrimitive(name, [parentType, childType]);

            // Verify removal is immediately visible
            const tree = api.getComponent(name);
            expect(tree.children.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should throw error when trying to remove root', () => {
      fc.assert(
        fc.property(componentNameArb, primitiveTypeArb, (name, type) => {
          const api = new MotifAPI();
          const root = new BasePrimitive(type);
          api.registerComponent(name, root);

          expect(() => {
            api.removePrimitive(name, [type]);
          }).toThrow();
        }),
        { numRuns: 100 }
      );
    });

    it('should throw error for invalid path', () => {
      fc.assert(
        fc.property(componentNameArb, primitiveTypeArb, (name, type) => {
          const api = new MotifAPI();
          const root = new BasePrimitive(type);
          api.registerComponent(name, root);

          expect(() => {
            api.removePrimitive(name, [type, 'NonExistent']);
          }).toThrow();
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Test: registerEventHandler() and handler invocation
   * **Validates: Requirements 11.6**
   */
  describe('registerEventHandler()', () => {
    it('should register and invoke handler', async () => {
      await fc.assert(
        fc.asyncProperty(handlerIdArb, fc.string(), async (id, testArg) => {
          const api = new MotifAPI();
          let handlerCalled = false;
          let receivedArg = null;

          api.registerEventHandler(id, (arg) => {
            handlerCalled = true;
            receivedArg = arg;
            return 'result';
          });

          const result = await api.invokeEventHandler(id, testArg);

          expect(handlerCalled).toBe(true);
          expect(receivedArg).toBe(testArg);
          expect(result).toBe('result');
        }),
        { numRuns: 100 }
      );
    });

    it('should support async handlers', async () => {
      await fc.assert(
        fc.asyncProperty(handlerIdArb, fc.integer(), async (id, value) => {
          const api = new MotifAPI();

          api.registerEventHandler(id, async (x) => {
            return x * 2;
          });

          const result = await api.invokeEventHandler(id, value);
          expect(result).toBe(value * 2);
        }),
        { numRuns: 100 }
      );
    });

    it('should throw error for non-existent handler', async () => {
      await fc.assert(
        fc.asyncProperty(handlerIdArb, async (id) => {
          const api = new MotifAPI();

          await expect(api.invokeEventHandler(id)).rejects.toThrow();
        }),
        { numRuns: 100 }
      );
    });

    it('should unregister handler correctly', () => {
      fc.assert(
        fc.property(handlerIdArb, (id) => {
          const api = new MotifAPI();

          api.registerEventHandler(id, () => 'test');
          expect(api.hasEventHandler(id)).toBe(true);

          const removed = api.unregisterEventHandler(id);
          expect(removed).toBe(true);
          expect(api.hasEventHandler(id)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should throw error for invalid handler ID', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const api = new MotifAPI();

          expect(() => {
            api.registerEventHandler('', () => {});
          }).toThrow();

          expect(() => {
            api.registerEventHandler(null, () => {});
          }).toThrow();
        }),
        { numRuns: 10 }
      );
    });

    it('should throw error for non-function handler', () => {
      fc.assert(
        fc.property(handlerIdArb, fc.string(), (id, notAFunction) => {
          const api = new MotifAPI();

          expect(() => {
            api.registerEventHandler(id, notAFunction);
          }).toThrow();
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Test: Operations are immediately visible to subsequent queries
   */
  describe('Operation Visibility', () => {
    it('should make modifications immediately visible to getComponent', () => {
      fc.assert(
        fc.property(
          componentNameArb,
          primitiveTypeArb,
          fc.string(),
          (name, type, newValue) => {
            const api = new MotifAPI();
            const root = new BasePrimitive(type, { value: 'original' });
            api.registerComponent(name, root);

            api.modifyComponent(name, [type], { props: { value: newValue } });

            const tree = api.getComponent(name);
            expect(tree.props.value).toBe(newValue);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should make insertions immediately visible to getComponent', () => {
      fc.assert(
        fc.property(
          componentNameArb,
          primitiveTypeArb,
          primitiveTypeArb,
          (name, parentType, childType) => {
            const api = new MotifAPI();
            const parent = new BasePrimitive(parentType);
            api.registerComponent(name, parent);

            const child = new BasePrimitive(childType);
            api.insertPrimitive(name, [parentType], child);

            const tree = api.getComponent(name);
            expect(tree.children.length).toBe(1);
            expect(tree.children[0].type).toBe(childType);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should make removals immediately visible to getComponent', () => {
      fc.assert(
        fc.property(
          componentNameArb,
          primitiveTypeArb,
          primitiveTypeArb,
          (name, parentType, childType) => {
            const api = new MotifAPI();
            const parent = new BasePrimitive(parentType);
            const child = new BasePrimitive(childType);
            parent.appendChild(child);
            api.registerComponent(name, parent);

            api.removePrimitive(name, [parentType, childType]);

            const tree = api.getComponent(name);
            expect(tree.children.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should support sequence of operations', () => {
      fc.assert(
        fc.property(
          componentNameArb,
          primitiveTypeArb,
          fc.array(primitiveTypeArb, { minLength: 1, maxLength: 5 }),
          (name, rootType, childTypes) => {
            const api = new MotifAPI();
            const root = new BasePrimitive(rootType);
            api.registerComponent(name, root);

            // Insert multiple children
            for (const childType of childTypes) {
              const child = new BasePrimitive(childType);
              api.insertPrimitive(name, [rootType], child);
            }

            // Verify all children are visible
            let tree = api.getComponent(name);
            expect(tree.children.length).toBe(childTypes.length);

            // Modify first child
            if (childTypes.length > 0) {
              api.modifyComponent(name, [rootType, `${childTypes[0]}[0]`], {
                props: { modified: true }
              });

              tree = api.getComponent(name);
              expect(tree.children[0].props.modified).toBe(true);
            }

            // Remove last child
            if (childTypes.length > 0) {
              const lastChildType = childTypes[childTypes.length - 1];
              const lastIndex = childTypes.filter(t => t === lastChildType).length - 1;
              api.removePrimitive(name, [rootType, `${lastChildType}[${lastIndex}]`]);

              tree = api.getComponent(name);
              expect(tree.children.length).toBe(childTypes.length - 1);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Test: API uses provided registry or creates new one
   */
  describe('Registry Integration', () => {
    it('should use provided registry', () => {
      fc.assert(
        fc.property(componentNameArb, primitiveTreeArb(2), (name, root) => {
          const registry = new ComponentRegistry();
          registry.registerComponent(name, root);

          const api = new MotifAPI(registry);

          // API should see the component registered in the provided registry
          expect(api.getComponentList()).toContain(name);
          expect(api.getComponent(name)).not.toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should create new registry when none provided', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const api = new MotifAPI();
          const registry = api.getRegistry();

          expect(registry).toBeInstanceOf(ComponentRegistry);
        }),
        { numRuns: 10 }
      );
    });

    it('should return the underlying registry via getRegistry()', () => {
      fc.assert(
        fc.property(componentNameArb, primitiveTreeArb(2), (name, root) => {
          const registry = new ComponentRegistry();
          const api = new MotifAPI(registry);

          expect(api.getRegistry()).toBe(registry);
        }),
        { numRuns: 100 }
      );
    });
  });
});
