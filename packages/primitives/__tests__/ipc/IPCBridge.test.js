/**
 * @fileoverview Tests for IPCBridge
 * @module @symphony/primitives/__tests__/ipc/IPCBridge.test
 *
 * Tests the IPC handlers for component operations.
 * @see Requirements 12.1, 12.2, 12.3, 12.4, 12.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  IPCBridge,
  getDefaultBridge,
  setDefaultBridge,
  resetDefaultBridge,
} from '../../src/ipc/IPCBridge.js';
import { ComponentRegistry } from '../../src/registry/ComponentRegistry.js';
import { BasePrimitive } from '../../src/core/BasePrimitive.js';
import { Container } from '../../src/primitives/layout.js';
import { Button } from '../../src/primitives/interactive.js';

describe('IPCBridge', () => {
  let registry;
  let bridge;

  beforeEach(() => {
    registry = new ComponentRegistry();
    bridge = new IPCBridge(registry);
    resetDefaultBridge();
  });

  describe('constructor', () => {
    it('creates bridge with provided registry', () => {
      expect(bridge.getRegistry()).toBe(registry);
    });

    it('creates bridge with new registry if none provided', () => {
      const newBridge = new IPCBridge();
      expect(newBridge.getRegistry()).toBeInstanceOf(ComponentRegistry);
    });
  });

  describe('handler registration', () => {
    it('registers all required handlers', () => {
      const handlers = bridge.getHandlerNames();
      expect(handlers).toContain('get_component_tree');
      expect(handlers).toContain('get_component_list');
      expect(handlers).toContain('modify_component');
      expect(handlers).toContain('insert_component');
      expect(handlers).toContain('remove_component');
      expect(handlers).toContain('invoke_motif_handler');
    });

    it('hasHandler returns true for registered handlers', () => {
      expect(bridge.hasHandler('get_component_tree')).toBe(true);
      expect(bridge.hasHandler('unknown_handler')).toBe(false);
    });
  });

  describe('get_component_tree handler', () => {
    beforeEach(() => {
      const root = Container({ className: 'test' });
      root.appendChild(Button({ label: 'Click' }));
      registry.registerComponent('TestComponent', root);
    });

    it('returns component tree for valid component name', async () => {
      const response = await bridge.handleRequest({
        method: 'get_component_tree',
        params: { name: 'TestComponent' },
      });

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.type).toBe('Container');
      expect(response.data.children).toHaveLength(1);
      expect(response.data.children[0].type).toBe('Button');
    });

    it('returns error for non-existent component', async () => {
      const response = await bridge.handleRequest({
        method: 'get_component_tree',
        params: { name: 'NonExistent' },
      });

      expect(response.success).toBe(false);
      expect(response.code).toBe('COMPONENT_NOT_FOUND');
    });

    it('returns error for invalid component name', async () => {
      const response = await bridge.handleRequest({
        method: 'get_component_tree',
        params: { name: '' },
      });

      expect(response.success).toBe(false);
      expect(response.code).toBe('INVALID_PARAMS');
    });

    it('includes requestId in response when provided', async () => {
      const response = await bridge.handleRequest({
        method: 'get_component_tree',
        params: { name: 'TestComponent' },
        requestId: 'req-123',
      });

      expect(response.requestId).toBe('req-123');
    });
  });

  describe('get_component_list handler', () => {
    it('returns empty array when no components registered', async () => {
      const response = await bridge.handleRequest({
        method: 'get_component_list',
        params: {},
      });

      expect(response.success).toBe(true);
      expect(response.data).toEqual([]);
    });

    it('returns all registered component names', async () => {
      registry.registerComponent('Component1', Container({}));
      registry.registerComponent('Component2', Container({}));

      const response = await bridge.handleRequest({
        method: 'get_component_list',
        params: {},
      });

      expect(response.success).toBe(true);
      expect(response.data).toContain('Component1');
      expect(response.data).toContain('Component2');
    });
  });

  describe('modify_component handler', () => {
    beforeEach(() => {
      const root = Container({ className: 'original' });
      registry.registerComponent('TestComponent', root);
    });

    it('modifies component props successfully', async () => {
      const response = await bridge.handleRequest({
        method: 'modify_component',
        params: {
          name: 'TestComponent',
          path: ['Container'],
          modifications: { props: { className: 'modified' } },
        },
      });

      expect(response.success).toBe(true);
      expect(response.data.modified).toBe(true);

      const component = registry.getComponent('TestComponent');
      expect(component.props.className).toBe('modified');
    });

    it('calls notify callback on modification', async () => {
      const notifyCallback = vi.fn();
      bridge.setNotifyCallback(notifyCallback);

      await bridge.handleRequest({
        method: 'modify_component',
        params: {
          name: 'TestComponent',
          path: ['Container'],
          modifications: { props: { className: 'modified' } },
        },
      });

      expect(notifyCallback).toHaveBeenCalledWith('component_modified', {
        componentName: 'TestComponent',
        path: ['Container'],
        modifications: { props: { className: 'modified' } },
      });
    });

    it('returns error for invalid path', async () => {
      const response = await bridge.handleRequest({
        method: 'modify_component',
        params: {
          name: 'TestComponent',
          path: ['NonExistent'],
          modifications: { props: {} },
        },
      });

      expect(response.success).toBe(false);
      expect(response.code).toBe('MODIFICATION_FAILED');
    });

    it('returns error for invalid params', async () => {
      const response = await bridge.handleRequest({
        method: 'modify_component',
        params: {
          name: 'TestComponent',
          path: 'not-an-array',
          modifications: {},
        },
      });

      expect(response.success).toBe(false);
      expect(response.code).toBe('INVALID_PARAMS');
    });
  });

  describe('insert_component handler', () => {
    beforeEach(() => {
      const root = Container({ className: 'parent' });
      registry.registerComponent('TestComponent', root);
    });

    it('inserts primitive successfully', async () => {
      const primitiveTree = {
        type: 'Button',
        props: { label: 'New Button' },
        children: [],
        renderStrategy: 'react',
      };

      const response = await bridge.handleRequest({
        method: 'insert_component',
        params: {
          name: 'TestComponent',
          parentPath: ['Container'],
          primitive: primitiveTree,
        },
      });

      expect(response.success).toBe(true);
      expect(response.data.inserted).toBe(true);
      expect(response.data.primitiveId).toBeDefined();

      const component = registry.getComponent('TestComponent');
      expect(component.children).toHaveLength(1);
      expect(component.children[0].type).toBe('Button');
    });

    it('inserts primitive at specific index', async () => {
      // Add initial children
      const root = registry.getComponent('TestComponent');
      root.appendChild(Button({ label: 'First' }));
      root.appendChild(Button({ label: 'Third' }));

      const primitiveTree = {
        type: 'Button',
        props: { label: 'Second' },
        children: [],
        renderStrategy: 'react',
      };

      const response = await bridge.handleRequest({
        method: 'insert_component',
        params: {
          name: 'TestComponent',
          parentPath: ['Container'],
          primitive: primitiveTree,
          index: 1,
        },
      });

      expect(response.success).toBe(true);

      const component = registry.getComponent('TestComponent');
      expect(component.children[1].props.label).toBe('Second');
    });

    it('calls notify callback on insertion', async () => {
      const notifyCallback = vi.fn();
      bridge.setNotifyCallback(notifyCallback);

      const primitiveTree = {
        type: 'Button',
        props: { label: 'New' },
        children: [],
        renderStrategy: 'react',
      };

      await bridge.handleRequest({
        method: 'insert_component',
        params: {
          name: 'TestComponent',
          parentPath: ['Container'],
          primitive: primitiveTree,
        },
      });

      expect(notifyCallback).toHaveBeenCalledWith(
        'component_inserted',
        expect.objectContaining({
          componentName: 'TestComponent',
          parentPath: ['Container'],
        })
      );
    });

    it('returns error for invalid parent path', async () => {
      const response = await bridge.handleRequest({
        method: 'insert_component',
        params: {
          name: 'TestComponent',
          parentPath: ['NonExistent'],
          primitive: { type: 'Button', props: {}, children: [] },
        },
      });

      expect(response.success).toBe(false);
      expect(response.code).toBe('INSERTION_FAILED');
    });
  });

  describe('remove_component handler', () => {
    beforeEach(() => {
      const root = Container({ className: 'parent' });
      root.appendChild(Button({ label: 'ToRemove' }));
      registry.registerComponent('TestComponent', root);
    });

    it('removes primitive successfully', async () => {
      const response = await bridge.handleRequest({
        method: 'remove_component',
        params: {
          name: 'TestComponent',
          path: ['Container', 'Button'],
        },
      });

      expect(response.success).toBe(true);
      expect(response.data.removed).toBe(true);

      const component = registry.getComponent('TestComponent');
      expect(component.children).toHaveLength(0);
    });

    it('calls notify callback on removal', async () => {
      const notifyCallback = vi.fn();
      bridge.setNotifyCallback(notifyCallback);

      await bridge.handleRequest({
        method: 'remove_component',
        params: {
          name: 'TestComponent',
          path: ['Container', 'Button'],
        },
      });

      expect(notifyCallback).toHaveBeenCalledWith('component_removed', {
        componentName: 'TestComponent',
        path: ['Container', 'Button'],
      });
    });

    it('returns error when trying to remove root', async () => {
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

    it('returns error for invalid path', async () => {
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
  });

  describe('invoke_motif_handler handler', () => {
    it('invokes registered handler successfully', async () => {
      const handler = vi.fn().mockResolvedValue({ result: 'success' });
      registry.registerEventHandler('test-handler', handler);

      const response = await bridge.handleRequest({
        method: 'invoke_motif_handler',
        params: {
          handlerId: 'test-handler',
          args: ['arg1', 'arg2'],
        },
      });

      expect(response.success).toBe(true);
      expect(response.data.result).toEqual({ result: 'success' });
      expect(handler).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('handles async handlers', async () => {
      const handler = vi.fn().mockImplementation(async (value) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
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

    it('returns error for non-existent handler', async () => {
      const response = await bridge.handleRequest({
        method: 'invoke_motif_handler',
        params: {
          handlerId: 'non-existent',
          args: [],
        },
      });

      expect(response.success).toBe(false);
      expect(response.code).toBe('HANDLER_INVOCATION_FAILED');
    });

    it('returns error for invalid handler ID', async () => {
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

    it('uses empty array when args not provided', async () => {
      const handler = vi.fn().mockReturnValue('no-args');
      registry.registerEventHandler('no-args-handler', handler);

      const response = await bridge.handleRequest({
        method: 'invoke_motif_handler',
        params: {
          handlerId: 'no-args-handler',
        },
      });

      expect(response.success).toBe(true);
      expect(handler).toHaveBeenCalledWith();
    });
  });

  describe('unknown method handling', () => {
    it('returns error for unknown method', async () => {
      const response = await bridge.handleRequest({
        method: 'unknown_method',
        params: {},
      });

      expect(response.success).toBe(false);
      expect(response.code).toBe('UNKNOWN_METHOD');
      expect(response.error).toContain('unknown_method');
    });
  });

  describe('setNotifyCallback', () => {
    it('accepts function callback', () => {
      expect(() => bridge.setNotifyCallback(() => {})).not.toThrow();
    });

    it('accepts null to clear callback', () => {
      expect(() => bridge.setNotifyCallback(null)).not.toThrow();
    });

    it('throws for non-function values', () => {
      expect(() => bridge.setNotifyCallback('not-a-function')).toThrow();
    });
  });

  describe('transport integration', () => {
    it('registers handlers with transport', () => {
      const transport = {
        registerHandler: vi.fn(),
      };

      bridge.registerWithTransport(transport);

      expect(transport.registerHandler).toHaveBeenCalledTimes(6);
      expect(transport.registerHandler).toHaveBeenCalledWith(
        'get_component_tree',
        expect.any(Function)
      );
    });

    it('throws for invalid transport', () => {
      expect(() => bridge.registerWithTransport({})).toThrow();
      expect(() => bridge.registerWithTransport(null)).toThrow();
    });

    it('createHandler returns working handler function', async () => {
      registry.registerComponent('Test', Container({}));

      const handler = bridge.createHandler();
      const response = await handler('get_component_list', {});

      expect(response.success).toBe(true);
      expect(response.data).toContain('Test');
    });
  });

  describe('module-level functions', () => {
    it('getDefaultBridge creates singleton', () => {
      const bridge1 = getDefaultBridge();
      const bridge2 = getDefaultBridge();
      expect(bridge1).toBe(bridge2);
    });

    it('setDefaultBridge sets the singleton', () => {
      const customBridge = new IPCBridge();
      setDefaultBridge(customBridge);
      expect(getDefaultBridge()).toBe(customBridge);
    });

    it('resetDefaultBridge clears the singleton', () => {
      const bridge1 = getDefaultBridge();
      resetDefaultBridge();
      const bridge2 = getDefaultBridge();
      expect(bridge1).not.toBe(bridge2);
    });
  });
});
