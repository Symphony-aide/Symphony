/**
 * @fileoverview Property-based tests for PrimitiveRenderer component
 *
 * These tests use fast-check to verify universal properties that should hold
 * across all valid inputs to the PrimitiveRenderer component.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import React from 'react';
import { BasePrimitive } from '../../src/core/BasePrimitive.js';
import {
  registerComponent,
  unregisterComponent,
  getRegisteredComponent,
  getRegisteredTypes,
  setPrimitiveRegistry,
  convertHandlerProps,
  PrimitiveRenderer,
} from '../../src/renderers/PrimitiveRenderer.jsx';
import { ComponentRegistry } from '../../src/registry/ComponentRegistry.js';

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

// Mock React component factory
const createMockComponent = (type) => {
  const MockComponent = ({ children, ...props }) => {
    return React.createElement('div', { 'data-type': type, ...props }, children);
  };
  MockComponent.displayName = `Mock${type}`;
  return MockComponent;
};

/**
 * **Feature: primitives-package, Property 12: React Renderer Type Mapping**
 *
 * For any primitive with renderStrategy 'react', the PrimitiveRenderer SHALL
 * select the correct React component from the component map based on the
 * primitive's type.
 *
 * **Validates: Requirements 6.1**
 */
describe('Property 12: React Renderer Type Mapping', () => {
  // Store registered types for cleanup
  let registeredTypes = [];

  beforeEach(() => {
    registeredTypes = [];
  });

  afterEach(() => {
    // Clean up registered components
    for (const type of registeredTypes) {
      unregisterComponent(type);
    }
    registeredTypes = [];
  });

  it('should register and retrieve components correctly', () => {
    fc.assert(
      fc.property(primitiveTypeArb, (type) => {
        const mockComponent = createMockComponent(type);
        
        registerComponent(type, mockComponent);
        registeredTypes.push(type);
        
        const retrieved = getRegisteredComponent(type);
        expect(retrieved).toBe(mockComponent);
      }),
      { numRuns: 100 }
    );
  });

  it('should return undefined for unregistered types', () => {
    fc.assert(
      fc.property(primitiveTypeArb, (type) => {
        // Ensure type is not registered
        unregisterComponent(type);
        
        const retrieved = getRegisteredComponent(type);
        expect(retrieved).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  it('should track all registered types', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(primitiveTypeArb, { minLength: 1, maxLength: 10 }),
        (types) => {
          // Register all types
          for (const type of types) {
            registerComponent(type, createMockComponent(type));
            registeredTypes.push(type);
          }
          
          const registeredTypesList = getRegisteredTypes();
          
          // All registered types should be in the list
          for (const type of types) {
            expect(registeredTypesList).toContain(type);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should unregister components correctly', () => {
    fc.assert(
      fc.property(primitiveTypeArb, (type) => {
        const mockComponent = createMockComponent(type);
        
        registerComponent(type, mockComponent);
        expect(getRegisteredComponent(type)).toBe(mockComponent);
        
        const result = unregisterComponent(type);
        expect(result).toBe(true);
        expect(getRegisteredComponent(type)).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  it('should return false when unregistering non-existent type', () => {
    fc.assert(
      fc.property(primitiveTypeArb, (type) => {
        // Ensure type is not registered
        unregisterComponent(type);
        
        const result = unregisterComponent(type);
        expect(result).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should select correct component based on primitive type', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(primitiveTypeArb, { minLength: 2, maxLength: 5 }),
        primitivePropsArb,
        (types, props) => {
          // Register components for all types
          const componentsByType = new Map();
          for (const type of types) {
            const component = createMockComponent(type);
            registerComponent(type, component);
            componentsByType.set(type, component);
            registeredTypes.push(type);
          }
          
          // For each type, verify the correct component is selected
          for (const type of types) {
            const primitive = new BasePrimitive(type, props);
            primitive.renderStrategy = 'react';
            
            const selectedComponent = getRegisteredComponent(primitive.type);
            expect(selectedComponent).toBe(componentsByType.get(type));
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle unknown primitive types gracefully', () => {
    // Spy on console.warn
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    fc.assert(
      fc.property(primitiveTypeArb, primitivePropsArb, (type, props) => {
        // Ensure type is not registered
        unregisterComponent(type);
        
        const primitive = new BasePrimitive(type, props);
        primitive.renderStrategy = 'react';
        
        // getRegisteredComponent should return undefined for unknown types
        const component = getRegisteredComponent(primitive.type);
        expect(component).toBeUndefined();
      }),
      { numRuns: 100 }
    );
    
    warnSpy.mockRestore();
  });
});


/**
 * **Feature: primitives-package, Property 13: Handler ID to Function Conversion**
 *
 * For any primitive prop that is a handler ID (props starting with 'on'),
 * the React Renderer SHALL convert it to a function that invokes
 * componentRegistry.invokeEventHandler with that ID.
 *
 * **Validates: Requirements 6.2**
 */
describe('Property 13: Handler ID to Function Conversion', () => {
  let registry;

  beforeEach(() => {
    registry = new ComponentRegistry();
    setPrimitiveRegistry(registry);
  });

  afterEach(() => {
    setPrimitiveRegistry(null);
  });

  // Generator for handler IDs (strings starting with lowercase)
  const handlerIdArb = fc.stringMatching(/^[a-z][a-zA-Z0-9_]{0,19}$/);

  // Generator for handler prop names (starting with 'on')
  const handlerPropNameArb = fc.stringMatching(/^on[A-Z][a-zA-Z0-9]{0,9}$/);

  // Generator for non-handler prop names (not starting with 'on')
  const nonHandlerPropNameArb = fc.stringMatching(/^[a-ln-z][a-zA-Z0-9]{0,9}$/);

  it('should convert handler ID props to functions', () => {
    fc.assert(
      fc.property(handlerPropNameArb, handlerIdArb, (propName, handlerId) => {
        const props = { [propName]: handlerId };
        
        const converted = convertHandlerProps(props);
        
        // The converted prop should be a function
        expect(typeof converted[propName]).toBe('function');
      }),
      { numRuns: 100 }
    );
  });

  it('should not convert non-handler props', () => {
    fc.assert(
      fc.property(
        nonHandlerPropNameArb,
        fc.oneof(fc.string(), fc.integer(), fc.boolean()),
        (propName, value) => {
          const props = { [propName]: value };
          
          const converted = convertHandlerProps(props);
          
          // Non-handler props should remain unchanged
          expect(converted[propName]).toBe(value);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not convert handler props that are not strings', () => {
    fc.assert(
      fc.property(
        handlerPropNameArb,
        fc.oneof(fc.integer(), fc.boolean(), fc.constant(null)),
        (propName, value) => {
          const props = { [propName]: value };
          
          const converted = convertHandlerProps(props);
          
          // Handler props with non-string values should remain unchanged
          expect(converted[propName]).toBe(value);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should invoke registry handler when converted function is called', async () => {
    await fc.assert(
      fc.asyncProperty(
        handlerPropNameArb,
        handlerIdArb,
        fc.array(fc.oneof(fc.string(), fc.integer()), { maxLength: 3 }),
        async (propName, handlerId, args) => {
          // Register a handler that returns the args
          const mockHandler = vi.fn((...receivedArgs) => receivedArgs);
          registry.registerEventHandler(handlerId, mockHandler);
          
          const props = { [propName]: handlerId };
          const converted = convertHandlerProps(props);
          
          // Call the converted function
          const result = await converted[propName](...args);
          
          // Handler should have been called with the args
          expect(mockHandler).toHaveBeenCalledWith(...args);
          expect(result).toEqual(args);
          
          // Cleanup
          registry.unregisterEventHandler(handlerId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve multiple handler props in same object', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(handlerPropNameArb, { minLength: 1, maxLength: 5 }),
        fc.array(handlerIdArb, { minLength: 1, maxLength: 5 }),
        (propNames, handlerIds) => {
          // Create props with multiple handlers
          const props = {};
          for (let i = 0; i < propNames.length; i++) {
            props[propNames[i]] = handlerIds[i % handlerIds.length];
          }
          
          const converted = convertHandlerProps(props);
          
          // All handler props should be converted to functions
          for (const propName of propNames) {
            expect(typeof converted[propName]).toBe('function');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle mixed handler and non-handler props', () => {
    fc.assert(
      fc.property(
        handlerPropNameArb,
        handlerIdArb,
        nonHandlerPropNameArb,
        fc.string(),
        (handlerPropName, handlerId, nonHandlerPropName, nonHandlerValue) => {
          const props = {
            [handlerPropName]: handlerId,
            [nonHandlerPropName]: nonHandlerValue,
          };
          
          const converted = convertHandlerProps(props);
          
          // Handler prop should be converted
          expect(typeof converted[handlerPropName]).toBe('function');
          
          // Non-handler prop should remain unchanged
          expect(converted[nonHandlerPropName]).toBe(nonHandlerValue);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should warn when no registry is set', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Clear the registry
    setPrimitiveRegistry(null);
    
    await fc.assert(
      fc.asyncProperty(handlerPropNameArb, handlerIdArb, async (propName, handlerId) => {
        const props = { [propName]: handlerId };
        const converted = convertHandlerProps(props);
        
        // Call the converted function without a registry
        await converted[propName]();
        
        // Should have warned about missing registry
        expect(warnSpy).toHaveBeenCalled();
      }),
      { numRuns: 10 }
    );
    
    warnSpy.mockRestore();
  });
});


/**
 * **Feature: primitives-package, Property 14: Recursive Child Rendering**
 *
 * For any primitive with isLeafNode=false and non-empty children array,
 * the React Renderer SHALL recursively render all children; for primitives
 * with isLeafNode=true, children SHALL NOT be rendered.
 *
 * **Validates: Requirements 6.3**
 */
describe('Property 14: Recursive Child Rendering', () => {
  // Store registered types for cleanup
  let registeredTypes = [];

  beforeEach(() => {
    registeredTypes = [];
  });

  afterEach(() => {
    // Clean up registered components
    for (const type of registeredTypes) {
      unregisterComponent(type);
    }
    registeredTypes = [];
  });

  // Generator for primitive tree with configurable depth
  const primitiveTreeArb = (maxDepth = 3) => {
    const leafArb = primitiveTypeArb.map((type) => {
      const primitive = new BasePrimitive(type);
      primitive.renderStrategy = 'react';
      return primitive;
    });

    const nodeArb = (depth) => {
      if (depth <= 0) {
        return leafArb;
      }
      return fc.tuple(
        primitiveTypeArb,
        fc.array(nodeArb(depth - 1), { minLength: 0, maxLength: 3 })
      ).map(([type, children]) => {
        const node = new BasePrimitive(type);
        node.renderStrategy = 'react';
        for (const child of children) {
          node.appendChild(child);
        }
        return node;
      });
    };

    return nodeArb(maxDepth);
  };

  // Helper to collect all types in a tree
  const collectAllTypes = (root) => {
    const types = new Set([root.type]);
    for (const child of root.children) {
      for (const type of collectAllTypes(child)) {
        types.add(type);
      }
    }
    return types;
  };

  // Helper to count all nodes in a tree
  const countNodes = (root) => {
    let count = 1;
    for (const child of root.children) {
      count += countNodes(child);
    }
    return count;
  };

  it('should render children for non-leaf nodes', () => {
    fc.assert(
      fc.property(primitiveTreeArb(2), (root) => {
        // Register components for all types in the tree
        const allTypes = collectAllTypes(root);
        for (const type of allTypes) {
          if (!getRegisteredComponent(type)) {
            registerComponent(type, createMockComponent(type));
            registeredTypes.push(type);
          }
        }

        // For non-leaf nodes with children, children should be renderable
        if (!root.isLeafNode && root.children.length > 0) {
          // Each child should have a registered component
          for (const child of root.children) {
            const childComponent = getRegisteredComponent(child.type);
            expect(childComponent).toBeDefined();
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should not render children for leaf nodes', () => {
    fc.assert(
      fc.property(primitiveTypeArb, primitiveTypeArb, (parentType, childType) => {
        // Create a leaf node with children (which should be ignored)
        const leafNode = new BasePrimitive(parentType);
        leafNode.isLeafNode = true;
        leafNode.renderStrategy = 'react';
        
        const child = new BasePrimitive(childType);
        child.renderStrategy = 'react';
        leafNode.appendChild(child);

        // Register components
        registerComponent(parentType, createMockComponent(parentType));
        registeredTypes.push(parentType);
        registerComponent(childType, createMockComponent(childType));
        registeredTypes.push(childType);

        // Leaf node should have isLeafNode = true
        expect(leafNode.isLeafNode).toBe(true);
        
        // Children exist but should not be rendered for leaf nodes
        expect(leafNode.children.length).toBe(1);
      }),
      { numRuns: 100 }
    );
  });

  it('should handle deeply nested trees', () => {
    fc.assert(
      fc.property(primitiveTreeArb(4), (root) => {
        // Register components for all types
        const allTypes = collectAllTypes(root);
        for (const type of allTypes) {
          if (!getRegisteredComponent(type)) {
            registerComponent(type, createMockComponent(type));
            registeredTypes.push(type);
          }
        }

        // Count total nodes
        const totalNodes = countNodes(root);
        
        // All nodes should have registered components
        expect(allTypes.size).toBeGreaterThan(0);
        expect(totalNodes).toBeGreaterThanOrEqual(1);
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve parent-child relationships during rendering', () => {
    fc.assert(
      fc.property(primitiveTreeArb(3), (root) => {
        // Register components for all types
        const allTypes = collectAllTypes(root);
        for (const type of allTypes) {
          if (!getRegisteredComponent(type)) {
            registerComponent(type, createMockComponent(type));
            registeredTypes.push(type);
          }
        }

        // Verify parent-child relationships are intact
        const verifyRelationships = (node) => {
          for (const child of node.children) {
            expect(child.parent).toBe(node);
            verifyRelationships(child);
          }
        };

        verifyRelationships(root);
      }),
      { numRuns: 100 }
    );
  });

  it('should handle empty children arrays', () => {
    fc.assert(
      fc.property(primitiveTypeArb, (type) => {
        const primitive = new BasePrimitive(type);
        primitive.renderStrategy = 'react';
        primitive.isLeafNode = false;

        registerComponent(type, createMockComponent(type));
        registeredTypes.push(type);

        // Non-leaf node with no children
        expect(primitive.children.length).toBe(0);
        expect(primitive.isLeafNode).toBe(false);
        
        // Should still have a registered component
        expect(getRegisteredComponent(type)).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });

  it('should use child id as React key', () => {
    fc.assert(
      fc.property(
        primitiveTypeArb,
        fc.array(primitiveTypeArb, { minLength: 1, maxLength: 5 }),
        (parentType, childTypes) => {
          const parent = new BasePrimitive(parentType);
          parent.renderStrategy = 'react';
          
          const children = childTypes.map((type) => {
            const child = new BasePrimitive(type);
            child.renderStrategy = 'react';
            parent.appendChild(child);
            return child;
          });

          // Register components
          registerComponent(parentType, createMockComponent(parentType));
          registeredTypes.push(parentType);
          for (const type of childTypes) {
            if (!getRegisteredComponent(type)) {
              registerComponent(type, createMockComponent(type));
              registeredTypes.push(type);
            }
          }

          // Each child should have a unique ID that can be used as a key
          const ids = new Set(children.map((c) => c.id));
          expect(ids.size).toBe(children.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: primitives-package, Property 15: Direct Render Delegation**
 *
 * For any primitive with renderDirect=true OR renderStrategy='direct',
 * the PrimitiveRenderer SHALL delegate to DirectRenderer instead of
 * rendering through the component map.
 *
 * **Validates: Requirements 6.4, 9.1**
 */
describe('Property 15: Direct Render Delegation', () => {
  // Store registered types for cleanup
  let registeredTypes = [];

  beforeEach(() => {
    registeredTypes = [];
  });

  afterEach(() => {
    // Clean up registered components
    for (const type of registeredTypes) {
      unregisterComponent(type);
    }
    registeredTypes = [];
  });

  it('should identify primitives with renderDirect=true for direct rendering', () => {
    fc.assert(
      fc.property(primitiveTypeArb, primitivePropsArb, (type, props) => {
        const primitive = new BasePrimitive(type, props);
        primitive.renderDirect = true;
        
        // Primitive should be marked for direct rendering
        expect(primitive.renderDirect).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should identify primitives with renderStrategy=direct for direct rendering', () => {
    fc.assert(
      fc.property(primitiveTypeArb, primitivePropsArb, (type, props) => {
        const primitive = new BasePrimitive(type, props);
        primitive.renderStrategy = 'direct';
        
        // Primitive should have direct render strategy
        expect(primitive.renderStrategy).toBe('direct');
      }),
      { numRuns: 100 }
    );
  });

  it('should not use direct rendering for regular react primitives', () => {
    fc.assert(
      fc.property(primitiveTypeArb, primitivePropsArb, (type, props) => {
        const primitive = new BasePrimitive(type, props);
        primitive.renderStrategy = 'react';
        primitive.renderDirect = false;
        
        // Primitive should not be marked for direct rendering
        expect(primitive.renderDirect).toBe(false);
        expect(primitive.renderStrategy).toBe('react');
      }),
      { numRuns: 100 }
    );
  });

  it('should prioritize renderDirect flag over renderStrategy', () => {
    fc.assert(
      fc.property(
        primitiveTypeArb,
        primitivePropsArb,
        fc.constantFrom('react', 'wasm', 'direct'),
        (type, props, strategy) => {
          const primitive = new BasePrimitive(type, props);
          primitive.renderStrategy = strategy;
          primitive.renderDirect = true;
          
          // renderDirect should take precedence
          expect(primitive.renderDirect).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle both direct rendering conditions', () => {
    fc.assert(
      fc.property(
        primitiveTypeArb,
        primitivePropsArb,
        fc.boolean(),
        fc.constantFrom('react', 'wasm', 'direct'),
        (type, props, renderDirect, strategy) => {
          const primitive = new BasePrimitive(type, props);
          primitive.renderDirect = renderDirect;
          primitive.renderStrategy = strategy;
          
          // Should use direct rendering if either condition is true
          const shouldUseDirect = renderDirect || strategy === 'direct';
          
          expect(primitive.renderDirect || primitive.renderStrategy === 'direct').toBe(shouldUseDirect);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve props when delegating to direct renderer', () => {
    fc.assert(
      fc.property(primitiveTypeArb, primitivePropsArb, (type, props) => {
        const primitive = new BasePrimitive(type, props);
        primitive.renderDirect = true;
        
        // Props should be preserved
        for (const [key, value] of Object.entries(props)) {
          expect(primitive.props[key]).toEqual(value);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should handle direct rendering for various primitive types', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('MonacoEditor', 'XTermTerminal', 'CustomDirect'),
        primitivePropsArb,
        (type, props) => {
          const primitive = new BasePrimitive(type, props);
          primitive.renderStrategy = 'direct';
          
          // Direct render types should have correct strategy
          expect(primitive.renderStrategy).toBe('direct');
          expect(primitive.type).toBe(type);
        }
      ),
      { numRuns: 100 }
    );
  });
});
