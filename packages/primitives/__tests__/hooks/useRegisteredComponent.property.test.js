/**
 * @fileoverview Property-based tests for useRegisteredComponent hook
 *
 * These tests use fast-check to verify universal properties that should hold
 * across all valid inputs to the useRegisteredComponent hook.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ComponentRegistry } from '../../src/registry/ComponentRegistry.js';
import { BasePrimitive } from '../../src/core/BasePrimitive.js';
import {
  useRegisteredComponent,
  setHookRegistry,
  getHookRegistry,
} from '../../src/hooks/useRegisteredComponent.js';

// Arbitrary generators
const componentNameArb = fc.stringMatching(/^[a-z][a-zA-Z0-9-]*$/);
const primitiveTypeArb = fc.stringMatching(/^[A-Z][a-zA-Z0-9]*$/);

const primitivePropsArb = fc.dictionary(
  fc.stringMatching(/^[a-z][a-zA-Z0-9]*$/),
  fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null)),
  { maxKeys: 5 }
);

// Generator for a tree of primitives with configurable depth
const primitiveTreeArb = (maxDepth = 2) => {
  const leafArb = fc.tuple(primitiveTypeArb, primitivePropsArb).map(([type, props]) => {
    return new BasePrimitive(type, props);
  });

  const nodeArb = (depth) => {
    if (depth <= 0) {
      return leafArb;
    }
    return fc
      .tuple(
        primitiveTypeArb,
        primitivePropsArb,
        fc.array(nodeArb(depth - 1), { minLength: 0, maxLength: 2 })
      )
      .map(([type, props, children]) => {
        const node = new BasePrimitive(type, props);
        for (const child of children) {
          node.appendChild(child);
        }
        return node;
      });
  };

  return nodeArb(maxDepth);
};

/**
 * **Feature: primitives-package, Property 17: Hook Component Retrieval**
 *
 * For any component name, useRegisteredComponent SHALL return the component tree
 * if it exists in the registry, or null if it does not exist.
 *
 * **Validates: Requirements 10.1, 10.4**
 */
describe('Property 17: Hook Component Retrieval', () => {
  let registry;

  beforeEach(() => {
    registry = new ComponentRegistry();
    setHookRegistry(registry);
  });

  afterEach(() => {
    setHookRegistry(null);
  });

  it('should return component tree when component exists in registry', () => {
    fc.assert(
      fc.property(componentNameArb, primitiveTreeArb(2), (name, root) => {
        registry.registerComponent(name, root);

        const { result } = renderHook(() => useRegisteredComponent(name));

        expect(result.current).not.toBeNull();
        expect(result.current.id).toBe(root.id);
        expect(result.current.type).toBe(root.type);
      }),
      { numRuns: 50 }
    );
  });

  it('should return null when component does not exist in registry', () => {
    fc.assert(
      fc.property(componentNameArb, (name) => {
        // Don't register any component
        const { result } = renderHook(() => useRegisteredComponent(name));

        expect(result.current).toBeNull();
      }),
      { numRuns: 50 }
    );
  });

  it('should return null when registry is not set', () => {
    setHookRegistry(null);

    fc.assert(
      fc.property(componentNameArb, (name) => {
        const { result } = renderHook(() => useRegisteredComponent(name));

        expect(result.current).toBeNull();
      }),
      { numRuns: 50 }
    );
  });

  it('should return null when component name is empty', () => {
    const { result } = renderHook(() => useRegisteredComponent(''));
    expect(result.current).toBeNull();
  });

  it('should use provided registry over global registry', () => {
    fc.assert(
      fc.property(componentNameArb, primitiveTreeArb(2), (name, root) => {
        const localRegistry = new ComponentRegistry();
        localRegistry.registerComponent(name, root);

        // Global registry doesn't have the component
        const { result } = renderHook(() => useRegisteredComponent(name, localRegistry));

        expect(result.current).not.toBeNull();
        expect(result.current.id).toBe(root.id);
      }),
      { numRuns: 50 }
    );
  });

  it('should return serialized tree structure with correct properties', () => {
    fc.assert(
      fc.property(componentNameArb, primitiveTreeArb(2), (name, root) => {
        registry.registerComponent(name, root);

        const { result } = renderHook(() => useRegisteredComponent(name));

        expect(result.current).toHaveProperty('id');
        expect(result.current).toHaveProperty('type');
        expect(result.current).toHaveProperty('props');
        expect(result.current).toHaveProperty('children');
        expect(result.current).toHaveProperty('renderStrategy');
      }),
      { numRuns: 50 }
    );
  });

  it('should update when component name changes', () => {
    fc.assert(
      fc.property(
        componentNameArb,
        componentNameArb,
        primitiveTreeArb(1),
        primitiveTreeArb(1),
        (name1, name2, root1, root2) => {
          // Ensure names are different
          const uniqueName1 = `${name1}_first`;
          const uniqueName2 = `${name2}_second`;

          registry.registerComponent(uniqueName1, root1);
          registry.registerComponent(uniqueName2, root2);

          const { result, rerender } = renderHook(
            ({ name }) => useRegisteredComponent(name),
            { initialProps: { name: uniqueName1 } }
          );

          expect(result.current.id).toBe(root1.id);

          rerender({ name: uniqueName2 });

          expect(result.current.id).toBe(root2.id);
        }
      ),
      { numRuns: 30 }
    );
  });
});

/**
 * **Feature: primitives-package, Property 18: Hook Event Subscription**
 *
 * For any component name where the hook is active, when a 'component-tree-changed'
 * event is dispatched for that component, the hook SHALL update its state and
 * trigger a React re-render.
 *
 * **Validates: Requirements 10.2**
 */
describe('Property 18: Hook Event Subscription', () => {
  let registry;

  beforeEach(() => {
    registry = new ComponentRegistry();
    setHookRegistry(registry);
  });

  afterEach(() => {
    setHookRegistry(null);
  });

  it('should update when component-tree-changed event is dispatched for watched component', async () => {
    fc.assert(
      await fc.asyncProperty(
        componentNameArb,
        primitiveTypeArb,
        primitivePropsArb,
        async (name, type, newProps) => {
          const root = new BasePrimitive(type, { initial: 'value' });
          registry.registerComponent(name, root);

          const { result } = renderHook(() => useRegisteredComponent(name));

          // Wait for initial state to be set
          await waitFor(() => {
            expect(result.current).not.toBeNull();
          });

          // Initial state
          expect(result.current.props.initial).toBe('value');

          // Modify the component (this dispatches the event)
          await act(async () => {
            registry.modifyComponent(name, [type], { props: newProps });
          });

          // Wait for state update
          await waitFor(() => {
            // Check that new props are reflected
            for (const [key, value] of Object.entries(newProps)) {
              expect(result.current.props[key]).toEqual(value);
            }
          });
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should not update when event is for different component', async () => {
    fc.assert(
      await fc.asyncProperty(
        componentNameArb,
        componentNameArb,
        primitiveTypeArb,
        primitiveTypeArb,
        async (name1, name2, type1, type2) => {
          // Ensure names are different
          const watchedName = `${name1}_watched`;
          const otherName = `${name2}_other`;

          const watchedRoot = new BasePrimitive(type1, { watched: true });
          const otherRoot = new BasePrimitive(type2, { other: true });

          registry.registerComponent(watchedName, watchedRoot);
          registry.registerComponent(otherName, otherRoot);

          const { result } = renderHook(() => useRegisteredComponent(watchedName));

          // Wait for initial state to be set
          await waitFor(() => {
            expect(result.current).not.toBeNull();
          });

          const initialTree = result.current;

          // Modify the OTHER component
          await act(async () => {
            registry.modifyComponent(otherName, [type2], { props: { modified: true } });
          });

          // The watched component's tree reference should remain the same
          // (no re-render triggered for unrelated component)
          expect(result.current.id).toBe(initialTree.id);
          expect(result.current.props.watched).toBe(true);
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should update when primitive is inserted into watched component', async () => {
    fc.assert(
      await fc.asyncProperty(componentNameArb, primitiveTypeArb, primitiveTypeArb, async (name, parentType, childType) => {
        const root = new BasePrimitive(parentType);
        registry.registerComponent(name, root);

        const { result } = renderHook(() => useRegisteredComponent(name));

        // Wait for initial state to be set
        await waitFor(() => {
          expect(result.current).not.toBeNull();
        });

        // Initial state - no children
        expect(result.current.children.length).toBe(0);

        // Insert a child
        await act(async () => {
          const newChild = new BasePrimitive(childType);
          registry.insertPrimitive(name, [parentType], newChild);
        });

        // Wait for state update
        await waitFor(() => {
          expect(result.current.children.length).toBe(1);
          expect(result.current.children[0].type).toBe(childType);
        });
      }),
      { numRuns: 30 }
    );
  });

  it('should update when primitive is removed from watched component', async () => {
    fc.assert(
      await fc.asyncProperty(componentNameArb, primitiveTypeArb, primitiveTypeArb, async (name, parentType, childType) => {
        const root = new BasePrimitive(parentType);
        const child = new BasePrimitive(childType);
        root.appendChild(child);
        registry.registerComponent(name, root);

        const { result } = renderHook(() => useRegisteredComponent(name));

        // Wait for initial state to be set
        await waitFor(() => {
          expect(result.current).not.toBeNull();
        });

        // Initial state - has child
        expect(result.current.children.length).toBe(1);

        // Remove the child
        await act(async () => {
          registry.removePrimitive(name, [parentType, childType]);
        });

        // Wait for state update
        await waitFor(() => {
          expect(result.current.children.length).toBe(0);
        });
      }),
      { numRuns: 30 }
    );
  });

  it('should cleanup event listener on unmount', () => {
    fc.assert(
      fc.property(componentNameArb, primitiveTypeArb, (name, type) => {
        const root = new BasePrimitive(type);
        registry.registerComponent(name, root);

        const removeEventListenerSpy = vi.spyOn(globalThis, 'removeEventListener');

        const { unmount } = renderHook(() => useRegisteredComponent(name));

        unmount();

        // Verify removeEventListener was called with 'component-tree-changed'
        expect(removeEventListenerSpy).toHaveBeenCalledWith(
          'component-tree-changed',
          expect.any(Function)
        );

        removeEventListenerSpy.mockRestore();
      }),
      { numRuns: 30 }
    );
  });

  it('should handle rapid successive updates', async () => {
    fc.assert(
      await fc.asyncProperty(
        componentNameArb,
        primitiveTypeArb,
        fc.integer({ min: 2, max: 5 }),
        async (name, type, updateCount) => {
          const root = new BasePrimitive(type, { counter: 0 });
          registry.registerComponent(name, root);

          const { result } = renderHook(() => useRegisteredComponent(name));

          // Wait for initial state to be set
          await waitFor(() => {
            expect(result.current).not.toBeNull();
          });

          // Perform multiple rapid updates
          for (let i = 1; i <= updateCount; i++) {
            await act(async () => {
              registry.modifyComponent(name, [type], { props: { counter: i } });
            });
          }

          // Final state should reflect the last update
          await waitFor(() => {
            expect(result.current.props.counter).toBe(updateCount);
          });
        }
      ),
      { numRuns: 20 }
    );
  });
});
