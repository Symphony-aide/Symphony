/**
 * @fileoverview Contract tests for IPCBridge
 * @module @symphony/primitives/__tests__/ipc/IPCBridge.contract.test
 *
 * Tests the IPC Bridge API contracts between frontend and backend.
 * Validates request/response schemas for all IPC methods.
 *
 * @see Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { IPCBridge, resetDefaultBridge } from '../../src/ipc/IPCBridge.js';
import { ComponentRegistry } from '../../src/registry/ComponentRegistry.js';
import { BasePrimitive } from '../../src/core/BasePrimitive.js';
import { Container } from '../../src/primitives/layout.js';
import { Button } from '../../src/primitives/interactive.js';
import {
  validateIPCSuccessResponse,
  validateIPCErrorResponse,
  validateComponentTree,
  IPC_CONTRACTS,
  COMPONENT_TREE_SCHEMA,
  validateSchema,
} from '../utils/contractValidators.js';

// ============================================
// Arbitrary Generators for Property Tests
// ============================================

// Valid component name generator
const componentNameArb = fc.stringMatching(/^[A-Z][a-zA-Z0-9]{2,20}$/);

// Valid primitive type generator
const primitiveTypeArb = fc.stringMatching(/^[A-Z][a-zA-Z0-9]{1,15}$/);

// Valid props generator
const propsArb = fc.dictionary(
  fc.stringMatching(/^[a-z][a-zA-Z0-9]{0,10}$/),
  fc.oneof(fc.string(), fc.integer(), fc.boolean()),
  { minKeys: 0, maxKeys: 5 }
);

// Valid render strategy generator
const renderStrategyArb = fc.constantFrom('react', 'wasm', 'direct');

// Valid component tree generator
const componentTreeArb = fc.letrec((tie) => ({
  tree: fc.record({
    id: fc.uuid(),
    type: primitiveTypeArb,
    props: propsArb,
    renderStrategy: renderStrategyArb,
    children: fc.array(tie('tree'), { minLength: 0, maxLength: 3 }),
  }),
})).tree;

// Valid path generator (array of type strings)
const pathArb = fc.array(primitiveTypeArb, { minLength: 1, maxLength: 5 });

// Valid handler ID generator
const handlerIdArb = fc.stringMatching(/^[a-z][a-zA-Z0-9_-]{2,30}$/);

// Valid args array generator
const argsArb = fc.array(
  fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null)),
  { minLength: 0, maxLength: 5 }
);

// ============================================
// Contract Tests for get_component_tree
// ============================================

/**
 * Contract tests for get_component_tree IPC method
 * @see Requirements 2.1
 */
describe('Contract: get_component_tree', () => {
  let registry;
  let bridge;

  beforeEach(() => {
    registry = new ComponentRegistry();
    bridge = new IPCBridge(registry);
    resetDefaultBridge();
  });

  describe('Success Response Schema', () => {
    it('returns response with success=true and data containing ComponentTree schema', async () => {
      const root = Container({ className: 'test-container' });
      root.appendChild(Button({ text: 'Click me' }));
      registry.registerComponent('TestComponent', root);

      const response = await bridge.handleRequest({
        method: 'get_component_tree',
        params: { name: 'TestComponent' },
      });

      // Validate response structure
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();

      // Validate ComponentTree schema
      const treeValidation = validateComponentTree(response.data);
      expect(treeValidation.valid).toBe(true);
      expect(treeValidation.errors).toEqual([]);
    });

    it('returns data with required fields: id, type, props, renderStrategy, children', async () => {
      const root = Container({ direction: 'column' });
      registry.registerComponent('TestComponent', root);

      const response = await bridge.handleRequest({
        method: 'get_component_tree',
        params: { name: 'TestComponent' },
      });

      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('type');
      expect(response.data).toHaveProperty('props');
      expect(response.data).toHaveProperty('renderStrategy');
      expect(response.data).toHaveProperty('children');

      // Validate types
      expect(typeof response.data.id).toBe('string');
      expect(typeof response.data.type).toBe('string');
      expect(typeof response.data.props).toBe('object');
      expect(typeof response.data.renderStrategy).toBe('string');
      expect(Array.isArray(response.data.children)).toBe(true);
    });

    it('returns renderStrategy as one of: react, wasm, direct', async () => {
      const root = Container({});
      registry.registerComponent('TestComponent', root);

      const response = await bridge.handleRequest({
        method: 'get_component_tree',
        params: { name: 'TestComponent' },
      });

      expect(response.success).toBe(true);
      expect(['react', 'wasm', 'direct']).toContain(response.data.renderStrategy);
    });

    it('includes requestId in response when provided in request', async () => {
      const root = Container({});
      registry.registerComponent('TestComponent', root);

      const response = await bridge.handleRequest({
        method: 'get_component_tree',
        params: { name: 'TestComponent' },
        requestId: 'req-12345',
      });

      expect(response.requestId).toBe('req-12345');
    });

    it('validates nested children follow ComponentTree schema', async () => {
      const root = Container({ className: 'parent' });
      const child1 = Container({ className: 'child1' });
      const child2 = Button({ text: 'button' });
      const grandchild = Button({ text: 'grandchild' });

      child1.appendChild(grandchild);
      root.appendChild(child1);
      root.appendChild(child2);
      registry.registerComponent('NestedComponent', root);

      const response = await bridge.handleRequest({
        method: 'get_component_tree',
        params: { name: 'NestedComponent' },
      });

      expect(response.success).toBe(true);

      // Validate entire tree recursively
      const treeValidation = validateComponentTree(response.data);
      expect(treeValidation.valid).toBe(true);

      // Verify nested structure
      expect(response.data.children).toHaveLength(2);
      expect(response.data.children[0].children).toHaveLength(1);
    });
  });

  describe('Error Response Schema', () => {
    it('returns error response for non-existent component', async () => {
      const response = await bridge.handleRequest({
        method: 'get_component_tree',
        params: { name: 'NonExistentComponent' },
      });

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.code).toBe('COMPONENT_NOT_FOUND');

      // Validate error response schema
      const validation = validateIPCErrorResponse('get_component_tree', response);
      expect(validation.valid).toBe(true);
    });

    it('returns error response for empty component name', async () => {
      const response = await bridge.handleRequest({
        method: 'get_component_tree',
        params: { name: '' },
      });

      expect(response.success).toBe(false);
      expect(response.code).toBe('INVALID_PARAMS');
      expect(response.error).toBeDefined();
      expect(typeof response.error).toBe('string');
      expect(response.error.length).toBeGreaterThan(0);
    });

    it('returns error response for missing name parameter', async () => {
      const response = await bridge.handleRequest({
        method: 'get_component_tree',
        params: {},
      });

      expect(response.success).toBe(false);
      expect(response.code).toBe('INVALID_PARAMS');
    });

    it('returns error response for non-string name parameter', async () => {
      const response = await bridge.handleRequest({
        method: 'get_component_tree',
        params: { name: 12345 },
      });

      expect(response.success).toBe(false);
      expect(response.code).toBe('INVALID_PARAMS');
    });

    it('includes requestId in error response when provided', async () => {
      const response = await bridge.handleRequest({
        method: 'get_component_tree',
        params: { name: 'NonExistent' },
        requestId: 'error-req-123',
      });

      expect(response.success).toBe(false);
      expect(response.requestId).toBe('error-req-123');
    });
  });
});


// ============================================
// Property Test: IPC Response Schema Compliance
// ============================================

/**
 * **Feature: primitives-extended-testing, Property 1: IPC Response Schema Compliance**
 *
 * For any valid IPC request to get_component_tree, the response SHALL contain
 * success boolean, and when successful, data SHALL contain id (string), type (string),
 * props (object), renderStrategy (string), and children (array).
 *
 * **Validates: Requirements 2.1**
 */
describe('Property 1: IPC Response Schema Compliance', () => {
  let registry;
  let bridge;

  beforeEach(() => {
    registry = new ComponentRegistry();
    bridge = new IPCBridge(registry);
    resetDefaultBridge();
  });

  it('for any registered component, get_component_tree response contains all required fields', async () => {
    await fc.assert(
      fc.asyncProperty(componentNameArb, propsArb, async (name, props) => {
        const registry = new ComponentRegistry();
        const bridge = new IPCBridge(registry);

        // Create and register a component
        const root = new BasePrimitive('TestRoot', props);
        registry.registerComponent(name, root);

        // Make the request
        const response = await bridge.handleRequest({
          method: 'get_component_tree',
          params: { name },
        });

        // Verify success response structure
        expect(response).toHaveProperty('success');
        expect(typeof response.success).toBe('boolean');
        expect(response.success).toBe(true);

        // Verify data contains all required ComponentTree fields
        expect(response.data).toHaveProperty('id');
        expect(response.data).toHaveProperty('type');
        expect(response.data).toHaveProperty('props');
        expect(response.data).toHaveProperty('renderStrategy');
        expect(response.data).toHaveProperty('children');

        // Verify field types
        expect(typeof response.data.id).toBe('string');
        expect(typeof response.data.type).toBe('string');
        expect(typeof response.data.props).toBe('object');
        expect(typeof response.data.renderStrategy).toBe('string');
        expect(Array.isArray(response.data.children)).toBe(true);

        // Verify renderStrategy is valid enum value
        expect(['react', 'wasm', 'direct']).toContain(response.data.renderStrategy);
      }),
      { numRuns: 100 }
    );
  });

  it('for any component tree, nested children also comply with ComponentTree schema', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentNameArb,
        fc.integer({ min: 1, max: 4 }),
        async (name, depth) => {
          const registry = new ComponentRegistry();
          const bridge = new IPCBridge(registry);

          // Build a tree with specified depth
          const buildTree = (currentDepth) => {
            const node = new BasePrimitive(`Level${currentDepth}`);
            if (currentDepth < depth) {
              node.appendChild(buildTree(currentDepth + 1));
            }
            return node;
          };

          const root = buildTree(0);
          registry.registerComponent(name, root);

          const response = await bridge.handleRequest({
            method: 'get_component_tree',
            params: { name },
          });

          expect(response.success).toBe(true);

          // Recursively validate all nodes
          const validateNode = (node) => {
            expect(node).toHaveProperty('id');
            expect(node).toHaveProperty('type');
            expect(node).toHaveProperty('props');
            expect(node).toHaveProperty('renderStrategy');
            expect(node).toHaveProperty('children');

            expect(typeof node.id).toBe('string');
            expect(typeof node.type).toBe('string');
            expect(typeof node.props).toBe('object');
            expect(['react', 'wasm', 'direct']).toContain(node.renderStrategy);
            expect(Array.isArray(node.children)).toBe(true);

            for (const child of node.children) {
              validateNode(child);
            }
          };

          validateNode(response.data);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('for any non-existent component name, error response contains success=false, error, and code', async () => {
    await fc.assert(
      fc.asyncProperty(componentNameArb, async (name) => {
        const registry = new ComponentRegistry();
        const bridge = new IPCBridge(registry);
        // Don't register any component

        const response = await bridge.handleRequest({
          method: 'get_component_tree',
          params: { name },
        });

        // Verify error response structure
        expect(response.success).toBe(false);
        expect(response).toHaveProperty('error');
        expect(response).toHaveProperty('code');

        // Verify field types
        expect(typeof response.error).toBe('string');
        expect(typeof response.code).toBe('string');

        // Verify non-empty
        expect(response.error.length).toBeGreaterThan(0);
        expect(response.code.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('for any request with requestId, response includes the same requestId', async () => {
    await fc.assert(
      fc.asyncProperty(componentNameArb, fc.uuid(), async (name, requestId) => {
        const registry = new ComponentRegistry();
        const bridge = new IPCBridge(registry);

        const root = new BasePrimitive('TestRoot');
        registry.registerComponent(name, root);

        const response = await bridge.handleRequest({
          method: 'get_component_tree',
          params: { name },
          requestId,
        });

        expect(response.requestId).toBe(requestId);
      }),
      { numRuns: 100 }
    );
  });
});


// ============================================
// Contract Tests for modify_component
// ============================================

/**
 * Contract tests for modify_component IPC method
 * @see Requirements 2.2
 */
describe('Contract: modify_component', () => {
  let registry;
  let bridge;

  beforeEach(() => {
    registry = new ComponentRegistry();
    bridge = new IPCBridge(registry);
    resetDefaultBridge();
  });

  describe('Request Validation', () => {
    it('accepts valid request with name, path, and modifications', async () => {
      const root = Container({ className: 'original' });
      registry.registerComponent('TestComponent', root);

      const response = await bridge.handleRequest({
        method: 'modify_component',
        params: {
          name: 'TestComponent',
          path: ['Container'],
          modifications: { props: { className: 'modified' } },
        },
      });

      expect(response.success).toBe(true);
    });

    it('returns error for missing name parameter', async () => {
      const response = await bridge.handleRequest({
        method: 'modify_component',
        params: {
          path: ['Container'],
          modifications: { props: {} },
        },
      });

      expect(response.success).toBe(false);
      expect(response.code).toBe('INVALID_PARAMS');
    });

    it('returns error for missing path parameter', async () => {
      const root = Container({});
      registry.registerComponent('TestComponent', root);

      const response = await bridge.handleRequest({
        method: 'modify_component',
        params: {
          name: 'TestComponent',
          modifications: { props: {} },
        },
      });

      expect(response.success).toBe(false);
      expect(response.code).toBe('INVALID_PARAMS');
    });

    it('returns error for missing modifications parameter', async () => {
      const root = Container({});
      registry.registerComponent('TestComponent', root);

      const response = await bridge.handleRequest({
        method: 'modify_component',
        params: {
          name: 'TestComponent',
          path: ['Container'],
        },
      });

      expect(response.success).toBe(false);
      expect(response.code).toBe('INVALID_PARAMS');
    });

    it('returns error when path is not an array', async () => {
      const root = Container({});
      registry.registerComponent('TestComponent', root);

      const response = await bridge.handleRequest({
        method: 'modify_component',
        params: {
          name: 'TestComponent',
          path: 'Container',
          modifications: { props: {} },
        },
      });

      expect(response.success).toBe(false);
      expect(response.code).toBe('INVALID_PARAMS');
    });

    it('returns error when modifications is not an object', async () => {
      const root = Container({});
      registry.registerComponent('TestComponent', root);

      const response = await bridge.handleRequest({
        method: 'modify_component',
        params: {
          name: 'TestComponent',
          path: ['Container'],
          modifications: 'invalid',
        },
      });

      expect(response.success).toBe(false);
      expect(response.code).toBe('INVALID_PARAMS');
    });
  });

  describe('Success Response Schema', () => {
    it('returns success response with modified=true', async () => {
      const root = Container({ className: 'original' });
      registry.registerComponent('TestComponent', root);

      const response = await bridge.handleRequest({
        method: 'modify_component',
        params: {
          name: 'TestComponent',
          path: ['Container'],
          modifications: { props: { className: 'modified' } },
        },
      });

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.modified).toBe(true);

      // Validate response schema
      const validation = validateIPCSuccessResponse('modify_component', response);
      expect(validation.valid).toBe(true);
    });

    it('includes requestId in success response when provided', async () => {
      const root = Container({});
      registry.registerComponent('TestComponent', root);

      const response = await bridge.handleRequest({
        method: 'modify_component',
        params: {
          name: 'TestComponent',
          path: ['Container'],
          modifications: { props: { newProp: 'value' } },
        },
        requestId: 'modify-req-123',
      });

      expect(response.success).toBe(true);
      expect(response.requestId).toBe('modify-req-123');
    });
  });

  describe('Error Response Schema', () => {
    it('returns error response for non-existent component', async () => {
      const response = await bridge.handleRequest({
        method: 'modify_component',
        params: {
          name: 'NonExistent',
          path: ['Container'],
          modifications: { props: {} },
        },
      });

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.code).toBeDefined();
      expect(typeof response.error).toBe('string');
      expect(typeof response.code).toBe('string');
    });

    it('returns error response for invalid path', async () => {
      const root = Container({});
      registry.registerComponent('TestComponent', root);

      const response = await bridge.handleRequest({
        method: 'modify_component',
        params: {
          name: 'TestComponent',
          path: ['Container', 'NonExistent'],
          modifications: { props: {} },
        },
      });

      expect(response.success).toBe(false);
      expect(response.code).toBe('MODIFICATION_FAILED');

      // Validate error response schema
      const validation = validateIPCErrorResponse('modify_component', response);
      expect(validation.valid).toBe(true);
    });

    it('includes requestId in error response when provided', async () => {
      const response = await bridge.handleRequest({
        method: 'modify_component',
        params: {
          name: 'NonExistent',
          path: ['Container'],
          modifications: { props: {} },
        },
        requestId: 'error-modify-123',
      });

      expect(response.success).toBe(false);
      expect(response.requestId).toBe('error-modify-123');
    });
  });
});


// ============================================
// Property Test: IPC Modification Contract
// ============================================

/**
 * **Feature: primitives-extended-testing, Property 2: IPC Modification Contract**
 *
 * For any valid modify_component request with name (string), path (array), and
 * modifications (object), the response SHALL indicate success with modified=true,
 * or failure with error code and message.
 *
 * **Validates: Requirements 2.2**
 */
describe('Property 2: IPC Modification Contract', () => {
  it('for any valid modification request, response indicates success with modified=true', async () => {
    await fc.assert(
      fc.asyncProperty(componentNameArb, propsArb, propsArb, async (name, initialProps, newProps) => {
        const registry = new ComponentRegistry();
        const bridge = new IPCBridge(registry);

        // Create and register a component
        const root = new BasePrimitive('TestRoot', initialProps);
        registry.registerComponent(name, root);

        // Make the modification request
        const response = await bridge.handleRequest({
          method: 'modify_component',
          params: {
            name,
            path: ['TestRoot'],
            modifications: { props: newProps },
          },
        });

        // Verify success response
        expect(response.success).toBe(true);
        expect(response.data).toBeDefined();
        expect(response.data.modified).toBe(true);
        expect(typeof response.data.modified).toBe('boolean');
      }),
      { numRuns: 100 }
    );
  });

  it('for any invalid modification request (non-existent component), response contains error code and message', async () => {
    await fc.assert(
      fc.asyncProperty(componentNameArb, propsArb, async (name, props) => {
        const registry = new ComponentRegistry();
        const bridge = new IPCBridge(registry);
        // Don't register any component

        const response = await bridge.handleRequest({
          method: 'modify_component',
          params: {
            name,
            path: ['TestRoot'],
            modifications: { props },
          },
        });

        // Verify error response
        expect(response.success).toBe(false);
        expect(response).toHaveProperty('error');
        expect(response).toHaveProperty('code');
        expect(typeof response.error).toBe('string');
        expect(typeof response.code).toBe('string');
        expect(response.error.length).toBeGreaterThan(0);
        expect(response.code.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('for any modification with invalid path, response contains error code and message', async () => {
    await fc.assert(
      fc.asyncProperty(componentNameArb, primitiveTypeArb, propsArb, async (name, invalidType, props) => {
        const registry = new ComponentRegistry();
        const bridge = new IPCBridge(registry);

        // Register a component
        const root = new BasePrimitive('TestRoot');
        registry.registerComponent(name, root);

        // Try to modify with invalid path
        const response = await bridge.handleRequest({
          method: 'modify_component',
          params: {
            name,
            path: ['TestRoot', `Invalid_${invalidType}`],
            modifications: { props },
          },
        });

        // Verify error response
        expect(response.success).toBe(false);
        expect(response).toHaveProperty('error');
        expect(response).toHaveProperty('code');
        expect(response.code).toBe('MODIFICATION_FAILED');
      }),
      { numRuns: 100 }
    );
  });
});


// ============================================
// Contract Tests for insert_component
// ============================================

/**
 * Contract tests for insert_component IPC method
 * @see Requirements 2.3
 */
describe('Contract: insert_component', () => {
  let registry;
  let bridge;

  beforeEach(() => {
    registry = new ComponentRegistry();
    bridge = new IPCBridge(registry);
    resetDefaultBridge();
  });

  describe('Request Validation', () => {
    it('accepts valid request with name, parentPath, primitive, and optional index', async () => {
      const root = Container({});
      registry.registerComponent('TestComponent', root);

      const response = await bridge.handleRequest({
        method: 'insert_component',
        params: {
          name: 'TestComponent',
          parentPath: ['Container'],
          primitive: { type: 'Button', props: { text: 'Click' }, children: [], renderStrategy: 'react' },
          index: 0,
        },
      });

      expect(response.success).toBe(true);
    });

    it('returns error for missing name parameter', async () => {
      const response = await bridge.handleRequest({
        method: 'insert_component',
        params: {
          parentPath: ['Container'],
          primitive: { type: 'Button', props: {}, children: [] },
        },
      });

      expect(response.success).toBe(false);
      expect(response.code).toBe('INVALID_PARAMS');
    });

    it('returns error for missing parentPath parameter', async () => {
      const root = Container({});
      registry.registerComponent('TestComponent', root);

      const response = await bridge.handleRequest({
        method: 'insert_component',
        params: {
          name: 'TestComponent',
          primitive: { type: 'Button', props: {}, children: [] },
        },
      });

      expect(response.success).toBe(false);
      expect(response.code).toBe('INVALID_PARAMS');
    });

    it('returns error for missing primitive parameter', async () => {
      const root = Container({});
      registry.registerComponent('TestComponent', root);

      const response = await bridge.handleRequest({
        method: 'insert_component',
        params: {
          name: 'TestComponent',
          parentPath: ['Container'],
        },
      });

      expect(response.success).toBe(false);
      expect(response.code).toBe('INVALID_PARAMS');
    });

    it('returns error when parentPath is not an array', async () => {
      const root = Container({});
      registry.registerComponent('TestComponent', root);

      const response = await bridge.handleRequest({
        method: 'insert_component',
        params: {
          name: 'TestComponent',
          parentPath: 'Container',
          primitive: { type: 'Button', props: {}, children: [] },
        },
      });

      expect(response.success).toBe(false);
      expect(response.code).toBe('INVALID_PARAMS');
    });
  });

  describe('Success Response Schema', () => {
    it('returns success response with inserted=true and primitiveId', async () => {
      const root = Container({});
      registry.registerComponent('TestComponent', root);

      const response = await bridge.handleRequest({
        method: 'insert_component',
        params: {
          name: 'TestComponent',
          parentPath: ['Container'],
          primitive: { type: 'Button', props: { text: 'New' }, children: [], renderStrategy: 'react' },
        },
      });

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.inserted).toBe(true);
      expect(response.data.primitiveId).toBeDefined();
      expect(typeof response.data.primitiveId).toBe('string');
      expect(response.data.primitiveId.length).toBeGreaterThan(0);

      // Validate response schema
      const validation = validateIPCSuccessResponse('insert_component', response);
      expect(validation.valid).toBe(true);
    });

    it('includes requestId in success response when provided', async () => {
      const root = Container({});
      registry.registerComponent('TestComponent', root);

      const response = await bridge.handleRequest({
        method: 'insert_component',
        params: {
          name: 'TestComponent',
          parentPath: ['Container'],
          primitive: { type: 'Button', props: {}, children: [], renderStrategy: 'react' },
        },
        requestId: 'insert-req-123',
      });

      expect(response.success).toBe(true);
      expect(response.requestId).toBe('insert-req-123');
    });
  });

  describe('Error Response Schema', () => {
    it('returns error response for non-existent component', async () => {
      const response = await bridge.handleRequest({
        method: 'insert_component',
        params: {
          name: 'NonExistent',
          parentPath: ['Container'],
          primitive: { type: 'Button', props: {}, children: [] },
        },
      });

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.code).toBeDefined();

      // Validate error response schema
      const validation = validateIPCErrorResponse('insert_component', response);
      expect(validation.valid).toBe(true);
    });

    it('returns error response for invalid parent path', async () => {
      const root = Container({});
      registry.registerComponent('TestComponent', root);

      const response = await bridge.handleRequest({
        method: 'insert_component',
        params: {
          name: 'TestComponent',
          parentPath: ['Container', 'NonExistent'],
          primitive: { type: 'Button', props: {}, children: [] },
        },
      });

      expect(response.success).toBe(false);
      expect(response.code).toBe('INSERTION_FAILED');
    });
  });
});

// ============================================
// Property Test: IPC Insertion Contract
// ============================================

/**
 * **Feature: primitives-extended-testing, Property 3: IPC Insertion Contract**
 *
 * For any valid insert_component request with name, parentPath, and primitive tree,
 * the successful response SHALL include inserted=true and a non-empty primitiveId string.
 *
 * **Validates: Requirements 2.3**
 */
describe('Property 3: IPC Insertion Contract', () => {
  it('for any valid insertion request, response includes inserted=true and non-empty primitiveId', async () => {
    await fc.assert(
      fc.asyncProperty(componentNameArb, primitiveTypeArb, propsArb, async (name, childType, childProps) => {
        const registry = new ComponentRegistry();
        const bridge = new IPCBridge(registry);

        // Create and register a component
        const root = new BasePrimitive('TestRoot');
        registry.registerComponent(name, root);

        // Make the insertion request
        const response = await bridge.handleRequest({
          method: 'insert_component',
          params: {
            name,
            parentPath: ['TestRoot'],
            primitive: { type: childType, props: childProps, children: [], renderStrategy: 'react' },
          },
        });

        // Verify success response
        expect(response.success).toBe(true);
        expect(response.data).toBeDefined();
        expect(response.data.inserted).toBe(true);
        expect(typeof response.data.primitiveId).toBe('string');
        expect(response.data.primitiveId.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('for any insertion with invalid parent path, response contains error code and message', async () => {
    await fc.assert(
      fc.asyncProperty(componentNameArb, primitiveTypeArb, async (name, invalidType) => {
        const registry = new ComponentRegistry();
        const bridge = new IPCBridge(registry);

        // Register a component
        const root = new BasePrimitive('TestRoot');
        registry.registerComponent(name, root);

        // Try to insert with invalid parent path
        const response = await bridge.handleRequest({
          method: 'insert_component',
          params: {
            name,
            parentPath: ['TestRoot', `Invalid_${invalidType}`],
            primitive: { type: 'Button', props: {}, children: [], renderStrategy: 'react' },
          },
        });

        // Verify error response
        expect(response.success).toBe(false);
        expect(response).toHaveProperty('error');
        expect(response).toHaveProperty('code');
        expect(response.code).toBe('INSERTION_FAILED');
      }),
      { numRuns: 100 }
    );
  });
});


// ============================================
// Contract Tests for remove_component
// ============================================

/**
 * Contract tests for remove_component IPC method
 * @see Requirements 2.4
 */
describe('Contract: remove_component', () => {
  let registry;
  let bridge;

  beforeEach(() => {
    registry = new ComponentRegistry();
    bridge = new IPCBridge(registry);
    resetDefaultBridge();
  });

  describe('Request Validation', () => {
    it('accepts valid request with name and path', async () => {
      const root = Container({});
      root.appendChild(Button({ text: 'ToRemove' }));
      registry.registerComponent('TestComponent', root);

      const response = await bridge.handleRequest({
        method: 'remove_component',
        params: {
          name: 'TestComponent',
          path: ['Container', 'Button'],
        },
      });

      expect(response.success).toBe(true);
    });

    it('returns error for missing name parameter', async () => {
      const response = await bridge.handleRequest({
        method: 'remove_component',
        params: {
          path: ['Container', 'Button'],
        },
      });

      expect(response.success).toBe(false);
      expect(response.code).toBe('INVALID_PARAMS');
    });

    it('returns error for missing path parameter', async () => {
      const root = Container({});
      registry.registerComponent('TestComponent', root);

      const response = await bridge.handleRequest({
        method: 'remove_component',
        params: {
          name: 'TestComponent',
        },
      });

      expect(response.success).toBe(false);
      expect(response.code).toBe('INVALID_PARAMS');
    });

    it('returns error when path is not an array', async () => {
      const root = Container({});
      registry.registerComponent('TestComponent', root);

      const response = await bridge.handleRequest({
        method: 'remove_component',
        params: {
          name: 'TestComponent',
          path: 'Container',
        },
      });

      expect(response.success).toBe(false);
      expect(response.code).toBe('INVALID_PARAMS');
    });
  });

  describe('Success Response Schema', () => {
    it('returns success response with removed=true', async () => {
      const root = Container({});
      root.appendChild(Button({ text: 'ToRemove' }));
      registry.registerComponent('TestComponent', root);

      const response = await bridge.handleRequest({
        method: 'remove_component',
        params: {
          name: 'TestComponent',
          path: ['Container', 'Button'],
        },
      });

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.removed).toBe(true);

      // Validate response schema
      const validation = validateIPCSuccessResponse('remove_component', response);
      expect(validation.valid).toBe(true);
    });

    it('includes requestId in success response when provided', async () => {
      const root = Container({});
      root.appendChild(Button({ text: 'ToRemove' }));
      registry.registerComponent('TestComponent', root);

      const response = await bridge.handleRequest({
        method: 'remove_component',
        params: {
          name: 'TestComponent',
          path: ['Container', 'Button'],
        },
        requestId: 'remove-req-123',
      });

      expect(response.success).toBe(true);
      expect(response.requestId).toBe('remove-req-123');
    });
  });

  describe('Error Response Schema', () => {
    it('returns error response for non-existent component', async () => {
      const response = await bridge.handleRequest({
        method: 'remove_component',
        params: {
          name: 'NonExistent',
          path: ['Container', 'Button'],
        },
      });

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.code).toBeDefined();

      // Validate error response schema
      const validation = validateIPCErrorResponse('remove_component', response);
      expect(validation.valid).toBe(true);
    });

    it('returns error response for invalid path', async () => {
      const root = Container({});
      registry.registerComponent('TestComponent', root);

      const response = await bridge.handleRequest({
        method: 'remove_component',
        params: {
          name: 'TestComponent',
          path: ['Container', 'NonExistent'],
        },
      });

      expect(response.success).toBe(false);
      expect(response.code).toBe('REMOVAL_FAILED');
    });

    it('returns error when trying to remove root', async () => {
      const root = Container({});
      registry.registerComponent('TestComponent', root);

      const response = await bridge.handleRequest({
        method: 'remove_component',
        params: {
          name: 'TestComponent',
          path: [],
        },
      });

      expect(response.success).toBe(false);
      expect(response.code).toBe('REMOVAL_FAILED');
    });
  });
});

// ============================================
// Property Test: IPC Removal Contract
// ============================================

/**
 * **Feature: primitives-extended-testing, Property 4: IPC Removal Contract**
 *
 * For any valid remove_component request with name and path, the successful
 * response SHALL include removed=true.
 *
 * **Validates: Requirements 2.4**
 */
describe('Property 4: IPC Removal Contract', () => {
  it('for any valid removal request, response includes removed=true', async () => {
    await fc.assert(
      fc.asyncProperty(componentNameArb, primitiveTypeArb, async (name, childType) => {
        const registry = new ComponentRegistry();
        const bridge = new IPCBridge(registry);

        // Create and register a component with a child
        const root = new BasePrimitive('TestRoot');
        const child = new BasePrimitive(childType);
        root.appendChild(child);
        registry.registerComponent(name, root);

        // Make the removal request
        const response = await bridge.handleRequest({
          method: 'remove_component',
          params: {
            name,
            path: ['TestRoot', childType],
          },
        });

        // Verify success response
        expect(response.success).toBe(true);
        expect(response.data).toBeDefined();
        expect(response.data.removed).toBe(true);
        expect(typeof response.data.removed).toBe('boolean');
      }),
      { numRuns: 100 }
    );
  });

  it('for any removal with invalid path, response contains error code and message', async () => {
    await fc.assert(
      fc.asyncProperty(componentNameArb, primitiveTypeArb, async (name, invalidType) => {
        const registry = new ComponentRegistry();
        const bridge = new IPCBridge(registry);

        // Register a component without children
        const root = new BasePrimitive('TestRoot');
        registry.registerComponent(name, root);

        // Try to remove with invalid path
        const response = await bridge.handleRequest({
          method: 'remove_component',
          params: {
            name,
            path: ['TestRoot', `Invalid_${invalidType}`],
          },
        });

        // Verify error response
        expect(response.success).toBe(false);
        expect(response).toHaveProperty('error');
        expect(response).toHaveProperty('code');
        expect(response.code).toBe('REMOVAL_FAILED');
      }),
      { numRuns: 100 }
    );
  });
});


// ============================================
// Contract Tests for invoke_motif_handler
// ============================================

/**
 * Contract tests for invoke_motif_handler IPC method
 * @see Requirements 2.5
 */
describe('Contract: invoke_motif_handler', () => {
  let registry;
  let bridge;

  beforeEach(() => {
    registry = new ComponentRegistry();
    bridge = new IPCBridge(registry);
    resetDefaultBridge();
  });

  describe('Request Validation', () => {
    it('accepts valid request with handlerId and args', async () => {
      const handler = vi.fn().mockReturnValue('success');
      registry.registerEventHandler('test-handler', handler);

      const response = await bridge.handleRequest({
        method: 'invoke_motif_handler',
        params: {
          handlerId: 'test-handler',
          args: ['arg1', 'arg2'],
        },
      });

      expect(response.success).toBe(true);
    });

    it('returns error for missing handlerId parameter', async () => {
      const response = await bridge.handleRequest({
        method: 'invoke_motif_handler',
        params: {
          args: [],
        },
      });

      expect(response.success).toBe(false);
      expect(response.code).toBe('INVALID_PARAMS');
    });

    it('returns error for empty handlerId', async () => {
      const response = await bridge.handleRequest({
        method: 'invoke_motif_handler',
        params: {
          handlerId: '',
          args: [],
        },
      });

      expect(response.success).toBe(false);
      expect(response.code).toBe('INVALID_PARAMS');
    });

    it('returns error when args is not an array', async () => {
      const handler = vi.fn().mockReturnValue('success');
      registry.registerEventHandler('test-handler', handler);

      const response = await bridge.handleRequest({
        method: 'invoke_motif_handler',
        params: {
          handlerId: 'test-handler',
          args: 'not-an-array',
        },
      });

      expect(response.success).toBe(false);
      expect(response.code).toBe('INVALID_PARAMS');
    });

    it('accepts request without args (defaults to empty array)', async () => {
      const handler = vi.fn().mockReturnValue('no-args-result');
      registry.registerEventHandler('test-handler', handler);

      const response = await bridge.handleRequest({
        method: 'invoke_motif_handler',
        params: {
          handlerId: 'test-handler',
        },
      });

      expect(response.success).toBe(true);
      expect(handler).toHaveBeenCalledWith();
    });
  });

  describe('Success Response Schema', () => {
    it('returns success response with result field', async () => {
      const handler = vi.fn().mockReturnValue({ data: 'test-result' });
      registry.registerEventHandler('test-handler', handler);

      const response = await bridge.handleRequest({
        method: 'invoke_motif_handler',
        params: {
          handlerId: 'test-handler',
          args: [],
        },
      });

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data).toHaveProperty('result');
      expect(response.data.result).toEqual({ data: 'test-result' });

      // Validate response schema
      const validation = validateIPCSuccessResponse('invoke_motif_handler', response);
      expect(validation.valid).toBe(true);
    });

    it('includes requestId in success response when provided', async () => {
      const handler = vi.fn().mockReturnValue('result');
      registry.registerEventHandler('test-handler', handler);

      const response = await bridge.handleRequest({
        method: 'invoke_motif_handler',
        params: {
          handlerId: 'test-handler',
          args: [],
        },
        requestId: 'invoke-req-123',
      });

      expect(response.success).toBe(true);
      expect(response.requestId).toBe('invoke-req-123');
    });

    it('handles async handlers correctly', async () => {
      const handler = vi.fn().mockImplementation(async (value) => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return value * 2;
      });
      registry.registerEventHandler('async-handler', handler);

      const response = await bridge.handleRequest({
        method: 'invoke_motif_handler',
        params: {
          handlerId: 'async-handler',
          args: [21],
        },
      });

      expect(response.success).toBe(true);
      expect(response.data.result).toBe(42);
    });
  });

  describe('Error Response Schema', () => {
    it('returns error response for non-existent handler', async () => {
      const response = await bridge.handleRequest({
        method: 'invoke_motif_handler',
        params: {
          handlerId: 'non-existent-handler',
          args: [],
        },
      });

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.code).toBe('HANDLER_INVOCATION_FAILED');

      // Validate error response schema
      const validation = validateIPCErrorResponse('invoke_motif_handler', response);
      expect(validation.valid).toBe(true);
    });

    it('returns error response when handler throws', async () => {
      const handler = vi.fn().mockImplementation(() => {
        throw new Error('Handler error');
      });
      registry.registerEventHandler('error-handler', handler);

      const response = await bridge.handleRequest({
        method: 'invoke_motif_handler',
        params: {
          handlerId: 'error-handler',
          args: [],
        },
      });

      expect(response.success).toBe(false);
      expect(response.code).toBe('HANDLER_INVOCATION_FAILED');
    });

    it('includes requestId in error response when provided', async () => {
      const response = await bridge.handleRequest({
        method: 'invoke_motif_handler',
        params: {
          handlerId: 'non-existent',
          args: [],
        },
        requestId: 'error-invoke-123',
      });

      expect(response.success).toBe(false);
      expect(response.requestId).toBe('error-invoke-123');
    });
  });
});

// ============================================
// Property Test: IPC Handler Invocation Contract
// ============================================

/**
 * **Feature: primitives-extended-testing, Property 5: IPC Handler Invocation Contract**
 *
 * For any valid invoke_motif_handler request with handlerId and args, the successful
 * response SHALL include the result field containing the handler's return value.
 *
 * **Validates: Requirements 2.5**
 */
describe('Property 5: IPC Handler Invocation Contract', () => {
  it('for any valid handler invocation, response includes result field with handler return value', async () => {
    await fc.assert(
      fc.asyncProperty(handlerIdArb, argsArb, async (handlerId, args) => {
        const registry = new ComponentRegistry();
        const bridge = new IPCBridge(registry);

        // Create a handler that returns a predictable result
        const expectedResult = { handlerId, argsCount: args.length };
        const handler = vi.fn().mockReturnValue(expectedResult);
        registry.registerEventHandler(handlerId, handler);

        // Make the invocation request
        const response = await bridge.handleRequest({
          method: 'invoke_motif_handler',
          params: {
            handlerId,
            args,
          },
        });

        // Verify success response
        expect(response.success).toBe(true);
        expect(response.data).toBeDefined();
        expect(response.data).toHaveProperty('result');
        expect(response.data.result).toEqual(expectedResult);
      }),
      { numRuns: 100 }
    );
  });

  it('for any non-existent handler, response contains error code and message', async () => {
    await fc.assert(
      fc.asyncProperty(handlerIdArb, argsArb, async (handlerId, args) => {
        const registry = new ComponentRegistry();
        const bridge = new IPCBridge(registry);
        // Don't register any handler

        const response = await bridge.handleRequest({
          method: 'invoke_motif_handler',
          params: {
            handlerId,
            args,
          },
        });

        // Verify error response
        expect(response.success).toBe(false);
        expect(response).toHaveProperty('error');
        expect(response).toHaveProperty('code');
        expect(response.code).toBe('HANDLER_INVOCATION_FAILED');
      }),
      { numRuns: 100 }
    );
  });
});


// ============================================
// Contract Tests for Error Responses
// ============================================

/**
 * Contract tests for error responses across all IPC methods
 * @see Requirements 2.6
 */
describe('Contract: Error Responses', () => {
  let registry;
  let bridge;

  beforeEach(() => {
    registry = new ComponentRegistry();
    bridge = new IPCBridge(registry);
    resetDefaultBridge();
  });

  describe('All methods return proper error format', () => {
    it('get_component_tree returns proper error format', async () => {
      const response = await bridge.handleRequest({
        method: 'get_component_tree',
        params: { name: 'NonExistent' },
      });

      expect(response.success).toBe(false);
      expect(response).toHaveProperty('error');
      expect(response).toHaveProperty('code');
      expect(typeof response.error).toBe('string');
      expect(typeof response.code).toBe('string');
      expect(response.error.length).toBeGreaterThan(0);
      expect(response.code.length).toBeGreaterThan(0);
    });

    it('modify_component returns proper error format', async () => {
      const response = await bridge.handleRequest({
        method: 'modify_component',
        params: {
          name: 'NonExistent',
          path: ['Container'],
          modifications: { props: {} },
        },
      });

      expect(response.success).toBe(false);
      expect(response).toHaveProperty('error');
      expect(response).toHaveProperty('code');
      expect(typeof response.error).toBe('string');
      expect(typeof response.code).toBe('string');
    });

    it('insert_component returns proper error format', async () => {
      const response = await bridge.handleRequest({
        method: 'insert_component',
        params: {
          name: 'NonExistent',
          parentPath: ['Container'],
          primitive: { type: 'Button', props: {}, children: [] },
        },
      });

      expect(response.success).toBe(false);
      expect(response).toHaveProperty('error');
      expect(response).toHaveProperty('code');
      expect(typeof response.error).toBe('string');
      expect(typeof response.code).toBe('string');
    });

    it('remove_component returns proper error format', async () => {
      const response = await bridge.handleRequest({
        method: 'remove_component',
        params: {
          name: 'NonExistent',
          path: ['Container', 'Button'],
        },
      });

      expect(response.success).toBe(false);
      expect(response).toHaveProperty('error');
      expect(response).toHaveProperty('code');
      expect(typeof response.error).toBe('string');
      expect(typeof response.code).toBe('string');
    });

    it('invoke_motif_handler returns proper error format', async () => {
      const response = await bridge.handleRequest({
        method: 'invoke_motif_handler',
        params: {
          handlerId: 'non-existent',
          args: [],
        },
      });

      expect(response.success).toBe(false);
      expect(response).toHaveProperty('error');
      expect(response).toHaveProperty('code');
      expect(typeof response.error).toBe('string');
      expect(typeof response.code).toBe('string');
    });

    it('unknown method returns proper error format', async () => {
      const response = await bridge.handleRequest({
        method: 'unknown_method',
        params: {},
      });

      expect(response.success).toBe(false);
      expect(response).toHaveProperty('error');
      expect(response).toHaveProperty('code');
      expect(response.code).toBe('UNKNOWN_METHOD');
    });
  });

  describe('Error code and message are present', () => {
    it('error code is a non-empty string', async () => {
      const response = await bridge.handleRequest({
        method: 'get_component_tree',
        params: { name: '' },
      });

      expect(response.success).toBe(false);
      expect(typeof response.code).toBe('string');
      expect(response.code.trim().length).toBeGreaterThan(0);
    });

    it('error message is a non-empty string', async () => {
      const response = await bridge.handleRequest({
        method: 'get_component_tree',
        params: { name: '' },
      });

      expect(response.success).toBe(false);
      expect(typeof response.error).toBe('string');
      expect(response.error.trim().length).toBeGreaterThan(0);
    });

    it('error response preserves requestId when provided', async () => {
      const response = await bridge.handleRequest({
        method: 'get_component_tree',
        params: { name: 'NonExistent' },
        requestId: 'test-request-id',
      });

      expect(response.success).toBe(false);
      expect(response.requestId).toBe('test-request-id');
    });
  });
});

// ============================================
// Property Test: IPC Error Response Contract
// ============================================

/**
 * **Feature: primitives-extended-testing, Property 6: IPC Error Response Contract**
 *
 * For any invalid IPC request (missing required fields, invalid types), the error
 * response SHALL contain success=false, a non-empty error message, and a non-empty error code.
 *
 * **Validates: Requirements 2.6**
 */
describe('Property 6: IPC Error Response Contract', () => {
  const ipcMethods = [
    'get_component_tree',
    'modify_component',
    'insert_component',
    'remove_component',
    'invoke_motif_handler',
  ];

  it('for any IPC method with invalid params, error response contains success=false, error, and code', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...ipcMethods),
        async (method) => {
          const registry = new ComponentRegistry();
          const bridge = new IPCBridge(registry);

          // Send request with empty params (invalid for all methods)
          const response = await bridge.handleRequest({
            method,
            params: {},
          });

          // Verify error response structure
          expect(response.success).toBe(false);
          expect(response).toHaveProperty('error');
          expect(response).toHaveProperty('code');

          // Verify non-empty strings
          expect(typeof response.error).toBe('string');
          expect(typeof response.code).toBe('string');
          expect(response.error.length).toBeGreaterThan(0);
          expect(response.code.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('for any unknown method, error response contains UNKNOWN_METHOD code', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.stringMatching(/^unknown_[a-z]{3,10}$/),
        async (unknownMethod) => {
          const registry = new ComponentRegistry();
          const bridge = new IPCBridge(registry);

          const response = await bridge.handleRequest({
            method: unknownMethod,
            params: {},
          });

          // Verify error response
          expect(response.success).toBe(false);
          expect(response.code).toBe('UNKNOWN_METHOD');
          expect(response.error).toContain(unknownMethod);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('for any error response with requestId, the requestId is preserved', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...ipcMethods),
        fc.uuid(),
        async (method, requestId) => {
          const registry = new ComponentRegistry();
          const bridge = new IPCBridge(registry);

          // Send invalid request with requestId
          const response = await bridge.handleRequest({
            method,
            params: {},
            requestId,
          });

          // Verify requestId is preserved in error response
          expect(response.success).toBe(false);
          expect(response.requestId).toBe(requestId);
        }
      ),
      { numRuns: 50 }
    );
  });
});
