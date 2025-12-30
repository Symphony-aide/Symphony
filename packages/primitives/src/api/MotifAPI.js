/**
 * @fileoverview MotifAPI - Extension API for Motif developers
 * @module @symphony/primitives/api/MotifAPI
 *
 * Provides a comprehensive API for Motif extensions to inspect and modify
 * Symphony's UI components. This is the primary interface for building
 * powerful extensions that customize any part of the UI.
 */

import { ComponentRegistry } from '../registry/ComponentRegistry.js';
import { BasePrimitive } from '../core/BasePrimitive.js';

/**
 * @typedef {import('../core/types.js').ComponentTree} ComponentTree
 * @typedef {import('../core/types.js').PrimitiveProps} PrimitiveProps
 * @typedef {import('../core/types.js').ModificationPayload} ModificationPayload
 */

/**
 * MotifAPI provides a comprehensive interface for Motif extensions to
 * inspect and modify Symphony's UI components.
 *
 * @example
 * ```javascript
 * const api = new MotifAPI(registry);
 *
 * // Get all registered components
 * const components = api.getComponentList();
 *
 * // Get a specific component tree
 * const tree = api.getComponent('ActivityBar');
 *
 * // Modify a component's props
 * api.modifyComponent('ActivityBar', ['Container', 'Button[0]'], {
 *   props: { variant: 'primary' }
 * });
 *
 * // Insert a new primitive
 * const newButton = new BasePrimitive('Button', { label: 'New' });
 * api.insertPrimitive('ActivityBar', ['Container'], newButton, 0);
 *
 * // Remove a primitive
 * api.removePrimitive('ActivityBar', ['Container', 'Button[1]']);
 *
 * // Register an event handler
 * api.registerEventHandler('my-handler', (event) => {
 *   console.log('Handler called:', event);
 * });
 * ```
 */
export class MotifAPI {
  /** @type {ComponentRegistry} The underlying component registry */
  #registry;

  /**
   * Creates a new MotifAPI instance.
   *
   * @param {ComponentRegistry} [registry] - The component registry to use.
   *   If not provided, a new registry will be created.
   */
  constructor(registry) {
    this.#registry = registry || new ComponentRegistry();
  }

  /**
   * Gets the underlying component registry.
   * This is useful for advanced use cases where direct registry access is needed.
   *
   * @returns {ComponentRegistry} The component registry
   */
  getRegistry() {
    return this.#registry;
  }

  /**
   * Returns an array of all registered component names.
   *
   * @returns {string[]} Array of component names
   *
   * @example
   * ```javascript
   * const components = api.getComponentList();
   * // ['ActivityBar', 'FileExplorer', 'Editor', ...]
   * ```
   *
   * @see Requirements 11.1
   */
  getComponentList() {
    return this.#registry.getComponentNames();
  }

  /**
   * Returns the complete component tree for a named component.
   *
   * @param {string} name - The name of the component
   * @returns {ComponentTree | null} The component tree, or null if not found
   *
   * @example
   * ```javascript
   * const tree = api.getComponent('ActivityBar');
   * if (tree) {
   *   console.log('Component type:', tree.type);
   *   console.log('Children count:', tree.children.length);
   * }
   * ```
   *
   * @see Requirements 11.2
   */
  getComponent(name) {
    return this.#registry.getComponentTree(name);
  }

  /**
   * Applies modifications to a primitive at the specified path.
   *
   * @param {string} name - The name of the component
   * @param {string[]} path - Path to the primitive to modify (e.g., ['Container', 'Button[0]'])
   * @param {ModificationPayload} modifications - The modifications to apply
   * @throws {Error} If component or path is not found
   *
   * @example
   * ```javascript
   * // Change a button's variant
   * api.modifyComponent('ActivityBar', ['Container', 'Button[0]'], {
   *   props: { variant: 'destructive', disabled: true }
   * });
   * ```
   *
   * @see Requirements 11.3
   */
  modifyComponent(name, path, modifications) {
    this.#registry.modifyComponent(name, path, modifications);
  }

  /**
   * Inserts a new primitive at the specified location.
   *
   * @param {string} name - The name of the component
   * @param {string[]} parentPath - Path to the parent primitive
   * @param {BasePrimitive} primitive - The primitive to insert
   * @param {number} [index] - Optional index at which to insert (appends if not specified)
   * @throws {Error} If component or parent path is not found
   *
   * @example
   * ```javascript
   * // Insert a new button at the beginning of a container
   * const newButton = new BasePrimitive('Button', {
   *   label: 'New Action',
   *   onClick: 'new-action-handler'
   * });
   * api.insertPrimitive('ActivityBar', ['Container'], newButton, 0);
   * ```
   *
   * @see Requirements 11.4
   */
  insertPrimitive(name, parentPath, primitive, index) {
    this.#registry.insertPrimitive(name, parentPath, primitive, index);
  }

  /**
   * Removes a primitive at the specified path.
   *
   * @param {string} name - The name of the component
   * @param {string[]} path - Path to the primitive to remove
   * @throws {Error} If component, path, or parent is not found
   * @throws {Error} If attempting to remove the root primitive
   *
   * @example
   * ```javascript
   * // Remove the second button from a container
   * api.removePrimitive('ActivityBar', ['Container', 'Button[1]']);
   * ```
   *
   * @see Requirements 11.5
   */
  removePrimitive(name, path) {
    this.#registry.removePrimitive(name, path);
  }

  /**
   * Registers an event handler for invocation via IPC.
   *
   * @param {string} id - The unique ID for the handler
   * @param {Function} handler - The handler function
   * @throws {Error} If id is not a non-empty string
   * @throws {Error} If handler is not a function
   *
   * @example
   * ```javascript
   * // Register a click handler
   * api.registerEventHandler('my-button-click', async (event) => {
   *   console.log('Button clicked!', event);
   *   return { success: true };
   * });
   *
   * // Use the handler ID in a primitive's props
   * const button = new BasePrimitive('Button', {
   *   label: 'Click Me',
   *   onClick: 'my-button-click'
   * });
   * ```
   *
   * @see Requirements 11.6
   */
  registerEventHandler(id, handler) {
    this.#registry.registerEventHandler(id, handler);
  }

  /**
   * Unregisters an event handler by ID.
   *
   * @param {string} id - The ID of the handler to unregister
   * @returns {boolean} True if the handler was found and removed
   *
   * @example
   * ```javascript
   * const removed = api.unregisterEventHandler('my-button-click');
   * console.log('Handler removed:', removed);
   * ```
   */
  unregisterEventHandler(id) {
    return this.#registry.unregisterEventHandler(id);
  }

  /**
   * Invokes an event handler by ID with the provided arguments.
   * Supports async handlers.
   *
   * @param {string} id - The ID of the handler to invoke
   * @param {...*} args - Arguments to pass to the handler
   * @returns {Promise<*>} The result of the handler
   * @throws {Error} If handler is not found
   *
   * @example
   * ```javascript
   * const result = await api.invokeEventHandler('my-handler', { data: 'test' });
   * console.log('Handler result:', result);
   * ```
   */
  async invokeEventHandler(id, ...args) {
    return this.#registry.invokeEventHandler(id, ...args);
  }

  /**
   * Checks if an event handler is registered.
   *
   * @param {string} id - The ID of the handler
   * @returns {boolean} True if the handler is registered
   *
   * @example
   * ```javascript
   * if (api.hasEventHandler('my-handler')) {
   *   await api.invokeEventHandler('my-handler', data);
   * }
   * ```
   */
  hasEventHandler(id) {
    return this.#registry.hasEventHandler(id);
  }

  /**
   * Registers a component with the underlying registry.
   * This is a convenience method for registering components.
   *
   * @param {string} name - The name to register the component under
   * @param {BasePrimitive} root - The root primitive of the component tree
   */
  registerComponent(name, root) {
    this.#registry.registerComponent(name, root);
  }

  /**
   * Unregisters a component from the underlying registry.
   *
   * @param {string} name - The name of the component to unregister
   * @returns {boolean} True if the component was found and removed
   */
  unregisterComponent(name) {
    return this.#registry.unregisterComponent(name);
  }

  /**
   * Finds a primitive by path within a component.
   * Returns the actual BasePrimitive instance, not a serialized tree.
   *
   * @param {string} name - The name of the component
   * @param {string[]} path - Path to the primitive
   * @returns {BasePrimitive | null} The found primitive, or null if not found
   *
   * @example
   * ```javascript
   * const button = api.findByPath('ActivityBar', ['Container', 'Button[0]']);
   * if (button) {
   *   console.log('Button props:', button.props);
   * }
   * ```
   */
  findByPath(name, path) {
    return this.#registry.findByPath(name, path);
  }

  /**
   * Gets a node by its unique ID.
   *
   * @param {string} id - The unique ID of the node
   * @returns {BasePrimitive | undefined} The primitive, or undefined if not found
   */
  getNodeById(id) {
    return this.#registry.getNodeById(id);
  }
}

