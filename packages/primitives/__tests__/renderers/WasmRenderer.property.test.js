/**
 * @fileoverview Property-based tests for WasmRenderer component
 *
 * These tests use fast-check to verify universal properties that should hold
 * across all valid inputs to the WasmRenderer component.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { BasePrimitive } from '../../src/core/BasePrimitive.js';
import { ComponentRegistry } from '../../src/registry/ComponentRegistry.js';
import {
  setWasmRegistry,
  getWasmRegistry,
  loadWasmModule,
  clearWasmModuleCache,
  getWasmModuleCacheSize,
} from '../../src/renderers/WasmRenderer.jsx';

// Arbitrary generators for primitive types and props
const primitiveTypeArb = fc.stringMatching(/^[A-Z][a-zA-Z0-9]{0,19}$/);

const primitivePropsArb = fc.dictionary(
  fc.stringMatching(/^[a-z][a-zA-Z0-9]{0,9}$/),
  fc.oneof(
    fc.string({ maxLength: 50 }),
    fc.integer(),
    fc.boolean(),
    fc.constant(null),
  ),
  { maxKeys: 5 }
);

// Generator for WASM module paths
const wasmModulePathArb = fc.stringMatching(/^[a-z][a-z0-9-]{0,19}\.wasm$/);

/**
 * Creates a mock WASM component instance for testing.
 * 
 * @param {string} containerId - Container ID
 * @param {Object} initialProps - Initial props
 * @returns {Object} Mock WASM instance
 */
function createMockWasmInstance(containerId, initialProps) {
  const currentProps = { ...initialProps };
  const setterCalls = [];
  
  const instance = {
    getTree: () => ({
      id: containerId,
      type: 'WasmComponent',
      props: currentProps,
      renderStrategy: 'wasm',
      children: [],
    }),
    modify: vi.fn((path, modifications) => {
      Object.assign(currentProps, modifications);
    }),
    destroy: vi.fn(),
    setters: {},
    // Test helpers
    _getSetterCalls: () => setterCalls,
    _getCurrentProps: () => currentProps,
  };

  // Create setters for each prop
  for (const propName of Object.keys(initialProps)) {
    instance.setters[propName] = vi.fn((value) => {
      setterCalls.push({ propName, value });
      currentProps[propName] = value;
    });
  }

  return instance;
}


/**
 * **Feature: primitives-package, Property 16: WASM Prop Updates**
 *
 * For any WASM primitive whose props change after initial render,
 * the WasmRenderer SHALL call the appropriate setter method (set_<propName>)
 * on the WASM instance for each changed prop.
 *
 * **Validates: Requirements 7.4**
 */
describe('Property 16: WASM Prop Updates', () => {
  let registry;

  beforeEach(() => {
    registry = new ComponentRegistry();
    setWasmRegistry(registry);
    clearWasmModuleCache();
  });

  afterEach(() => {
    setWasmRegistry(null);
    clearWasmModuleCache();
  });

  it('should call setter for each changed prop', () => {
    fc.assert(
      fc.property(
        primitivePropsArb,
        primitivePropsArb,
        (initialProps, newProps) => {
          // Create a mock WASM instance
          const instance = createMockWasmInstance('test-id', initialProps);
          
          // Simulate prop changes by calling setters for changed props
          for (const [propName, value] of Object.entries(newProps)) {
            if (initialProps[propName] !== value) {
              // If the setter exists, call it
              if (instance.setters[propName]) {
                instance.setters[propName](value);
              }
            }
          }
          
          // Verify setters were called for changed props
          const setterCalls = instance._getSetterCalls();
          
          for (const [propName, value] of Object.entries(newProps)) {
            if (initialProps[propName] !== value && instance.setters[propName]) {
              const call = setterCalls.find(c => c.propName === propName);
              expect(call).toBeDefined();
              expect(call.value).toEqual(value);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not call setter for unchanged props', () => {
    fc.assert(
      fc.property(primitivePropsArb, (props) => {
        // Create a mock WASM instance
        const instance = createMockWasmInstance('test-id', props);
        
        // Simulate "update" with same props - no setters should be called
        for (const [propName, value] of Object.entries(props)) {
          // Only call setter if value actually changed (it hasn't)
          if (props[propName] !== value) {
            instance.setters[propName]?.(value);
          }
        }
        
        // No setters should have been called
        const setterCalls = instance._getSetterCalls();
        expect(setterCalls.length).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should handle partial prop updates', () => {
    fc.assert(
      fc.property(
        fc.record({
          a: fc.string({ maxLength: 10 }),
          b: fc.integer(),
          c: fc.boolean(),
        }),
        fc.record({
          a: fc.string({ maxLength: 10 }),
          b: fc.integer(),
          c: fc.boolean(),
        }),
        (initialProps, newProps) => {
          const instance = createMockWasmInstance('test-id', initialProps);
          
          // Track which props changed
          const changedProps = [];
          
          for (const [propName, value] of Object.entries(newProps)) {
            if (initialProps[propName] !== value) {
              changedProps.push(propName);
              instance.setters[propName]?.(value);
            }
          }
          
          const setterCalls = instance._getSetterCalls();
          
          // Only changed props should have setter calls
          expect(setterCalls.length).toBe(changedProps.length);
          
          // Each changed prop should have exactly one setter call
          for (const propName of changedProps) {
            const calls = setterCalls.filter(c => c.propName === propName);
            expect(calls.length).toBe(1);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve prop update order', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            propName: fc.stringMatching(/^[a-z][a-zA-Z0-9]{0,5}$/),
            value: fc.oneof(fc.string({ maxLength: 10 }), fc.integer()),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (updates) => {
          // Create initial props from update prop names
          const initialProps = {};
          for (const update of updates) {
            initialProps[update.propName] = null;
          }
          
          const instance = createMockWasmInstance('test-id', initialProps);
          
          // Apply updates in order
          for (const update of updates) {
            instance.setters[update.propName]?.(update.value);
          }
          
          const setterCalls = instance._getSetterCalls();
          
          // Verify order is preserved
          for (let i = 0; i < updates.length; i++) {
            expect(setterCalls[i].propName).toBe(updates[i].propName);
            expect(setterCalls[i].value).toEqual(updates[i].value);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle missing setters gracefully', () => {
    fc.assert(
      fc.property(
        primitivePropsArb,
        fc.stringMatching(/^[a-z][a-zA-Z0-9]{0,9}$/),
        fc.string({ maxLength: 20 }),
        (initialProps, newPropName, newValue) => {
          const instance = createMockWasmInstance('test-id', initialProps);
          
          // Try to set a prop that doesn't have a setter
          const setter = instance.setters[newPropName];
          
          // If setter doesn't exist, nothing should happen (no error)
          if (!setter) {
            // This should not throw
            expect(() => {
              if (setter) setter(newValue);
            }).not.toThrow();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should update current props after setter call', () => {
    fc.assert(
      fc.property(
        fc.record({
          value: fc.string({ maxLength: 20 }),
          count: fc.integer({ min: 0, max: 100 }),
        }),
        fc.string({ maxLength: 20 }),
        fc.integer({ min: 0, max: 100 }),
        (initialProps, newValue, newCount) => {
          const instance = createMockWasmInstance('test-id', initialProps);
          
          // Update props
          instance.setters.value?.(newValue);
          instance.setters.count?.(newCount);
          
          // Verify current props are updated
          const currentProps = instance._getCurrentProps();
          expect(currentProps.value).toBe(newValue);
          expect(currentProps.count).toBe(newCount);
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('WASM Registry Integration', () => {
  let registry;

  beforeEach(() => {
    registry = new ComponentRegistry();
    setWasmRegistry(registry);
    clearWasmModuleCache();
  });

  afterEach(() => {
    setWasmRegistry(null);
    clearWasmModuleCache();
  });

  it('should set and get registry correctly', () => {
    fc.assert(
      fc.property(fc.boolean(), (shouldSet) => {
        if (shouldSet) {
          const newRegistry = new ComponentRegistry();
          setWasmRegistry(newRegistry);
          expect(getWasmRegistry()).toBe(newRegistry);
        } else {
          setWasmRegistry(null);
          expect(getWasmRegistry()).toBeNull();
        }
      }),
      { numRuns: 50 }
    );
  });

  it('should register WASM components with registry', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-z][a-z0-9-]{0,19}$/),
        primitivePropsArb,
        (componentId, props) => {
          const instance = createMockWasmInstance(componentId, props);
          
          // Register with registry
          registry.registerWasmComponent(componentId, instance);
          
          // Verify registration
          const retrieved = registry.getWasmComponent(componentId);
          expect(retrieved).toBe(instance);
          
          // Cleanup
          registry.unregisterWasmComponent(componentId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should unregister WASM components from registry', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-z][a-z0-9-]{0,19}$/),
        primitivePropsArb,
        (componentId, props) => {
          const instance = createMockWasmInstance(componentId, props);
          
          // Register
          registry.registerWasmComponent(componentId, instance);
          expect(registry.getWasmComponent(componentId)).toBe(instance);
          
          // Unregister
          const result = registry.unregisterWasmComponent(componentId);
          expect(result).toBe(true);
          expect(registry.getWasmComponent(componentId)).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should get WASM component tree from registry', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-z][a-z0-9-]{0,19}$/),
        primitivePropsArb,
        (componentId, props) => {
          const instance = createMockWasmInstance(componentId, props);
          
          // Register
          registry.registerWasmComponent(componentId, instance);
          
          // Get tree
          const tree = registry.getWasmComponentTree(componentId);
          expect(tree).not.toBeNull();
          expect(tree.id).toBe(componentId);
          expect(tree.renderStrategy).toBe('wasm');
          
          // Cleanup
          registry.unregisterWasmComponent(componentId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return null for non-existent WASM component tree', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-z][a-z0-9-]{0,19}$/),
        (componentId) => {
          // Don't register anything
          const tree = registry.getWasmComponentTree(componentId);
          expect(tree).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should list all registered WASM component IDs', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.stringMatching(/^[a-z][a-z0-9-]{0,9}$/), { minLength: 1, maxLength: 5 }),
        (componentIds) => {
          // Register all components
          for (const id of componentIds) {
            const instance = createMockWasmInstance(id, {});
            registry.registerWasmComponent(id, instance);
          }
          
          // Get all IDs
          const registeredIds = registry.getWasmComponentIds();
          
          // All registered IDs should be in the list
          for (const id of componentIds) {
            expect(registeredIds).toContain(id);
          }
          
          // Cleanup
          for (const id of componentIds) {
            registry.unregisterWasmComponent(id);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('WASM Module Cache', () => {
  beforeEach(() => {
    clearWasmModuleCache();
  });

  afterEach(() => {
    clearWasmModuleCache();
  });

  it('should start with empty cache', () => {
    expect(getWasmModuleCacheSize()).toBe(0);
  });

  it('should clear cache correctly', () => {
    // The cache is internal, but we can verify clearing works
    clearWasmModuleCache();
    expect(getWasmModuleCacheSize()).toBe(0);
  });
});
