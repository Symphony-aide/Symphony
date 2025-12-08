/**
 * @fileoverview ComponentRegistry - Central registry for all component trees
 * @module @symphony/primitives/registry/ComponentRegistry
 */

import { BasePrimitive } from '../core/BasePrimitive.js';

/**
 * @typedef {import('../core/types.js').PrimitiveProps} PrimitiveProps
 * @typedef {import('../core/types.js').ComponentTree} ComponentTree
 * @typedef {import('../core/types.js').ModificationPayload} ModificationPayload
 */

/**
 * Central registry for all component trees in Symphony's UI extensibility system.
 * Provides inspection APIs, handles modifications, and notifies renderers of changes.
 */
export class ComponentRegistry {
  /** @type {Map<string, BasePrimitive>} Map of component names to root primitives */
  #components;

  /** @type {Map<string, BasePrimitive>} Map of node IDs to primitives for O(1) lookup */
  #nodeIndex;

  /** @type {Map<string, Function>} Map of handler IDs to event handler functions */
  #eventHandlers;

  /**
   * Creates a new ComponentRegistry instance.
   */
  constructor() {
    this.#components = new Map();
    this.#nodeIndex = new Map();
    this.#eventHandlers = new Map();
  }

  /**
   * Registers a component tree with the registry.
   * Stores the root primitive by name and indexes all nodes by their IDs.
   *
   * @param {string} name - The name to register the component under
   * @param {BasePrimitive} root - The root primitive of the component tree
   * @throws {Error} If name is empty or root is not a BasePrimitive
   */
  registerComponent(name, root) {
    if (!name || typeof name !== 'string') {
      throw new Error('Component name must be a non-empty string');
    }
    if (!(root instanceof BasePrimitive)) {
      throw new Error('Root must be a BasePrimitive instance');
    }

    this.#components.set(name, root);
    this.#indexTree(root);
  }

  /**
   * Unregisters a component from the registry.
   * Removes the component and all its nodes from the index.
   *
   * @param {string} name - The name of the component to unregister
   * @returns {boolean} True if the component was found and removed
   */
  unregisterComponent(name) {
    const root = this.#components.get(name);
    if (!root) {
      return false;
    }

    this.#removeFromIndex(root);
    this.#components.delete(name);
    return true;
  }

  /**
   * Gets a component's root primitive by name.
   *
   * @param {string} name - The name of the component
   * @returns {BasePrimitive | undefined} The root primitive, or undefined if not found
   */
  getComponent(name) {
    return this.#components.get(name);
  }

  /**
   * Gets all registered component names.
   *
   * @returns {string[]} Array of component names
   */
  getComponentNames() {
    return Array.from(this.#components.keys());
  }

  /**
   * Gets a component tree as a serialized ComponentTree structure.
   *
   * @param {string} name - The name of the component
   * @returns {ComponentTree | null} The serialized tree, or null if not found
   */
  getComponentTree(name) {
    const root = this.#components.get(name);
    if (!root) {
      return null;
    }
    return root.toTree();
  }

  /**
   * Gets a node by its unique ID.
   *
   * @param {string} id - The unique ID of the node
   * @returns {BasePrimitive | undefined} The primitive, or undefined if not found
   */
  getNodeById(id) {
    return this.#nodeIndex.get(id);
  }


  /**
   * Parses a path segment that may include an array index.
   * E.g., "Button[0]" returns { type: "Button", index: 0 }
   *
   * @param {string} segment - The path segment to parse
   * @returns {{ type: string, index: number | null }} Parsed segment
   */
  #parsePathSegment(segment) {
    const match = segment.match(/^([^[]+)(?:\[(\d+)\])?$/);
    if (!match) {
      return { type: segment, index: null };
    }
    return {
      type: match[1],
      index: match[2] !== undefined ? parseInt(match[2], 10) : null,
    };
  }

  /**
   * Finds a primitive by path within a component.
   * Supports array indexing (e.g., "Button[0]" for the first Button child).
   *
   * @param {string} componentName - The name of the component
   * @param {string[]} path - Array of path segments
   * @returns {BasePrimitive | null} The found primitive, or null if not found
   */
  findByPath(componentName, path) {
    const root = this.#components.get(componentName);
    if (!root) {
      return null;
    }

    if (path.length === 0) {
      return root;
    }

    // Check if first segment matches root
    const firstSegment = this.#parsePathSegment(path[0]);
    if (firstSegment.type !== root.type) {
      return null;
    }

    // Navigate through the tree
    let current = root;
    for (let i = 1; i < path.length; i++) {
      const { type, index } = this.#parsePathSegment(path[i]);

      // Find children of the specified type
      const matchingChildren = current.children.filter((c) => c.type === type);

      if (matchingChildren.length === 0) {
        return null;
      }

      // If index is specified, use it; otherwise use first match
      const targetIndex = index !== null ? index : 0;
      if (targetIndex >= matchingChildren.length) {
        return null;
      }

      current = matchingChildren[targetIndex];
    }

    return current;
  }

  /**
   * Modifies a component's primitive at the specified path.
   * Updates the primitive's props and dispatches a change notification.
   *
   * @param {string} name - The name of the component
   * @param {string[]} path - Path to the primitive to modify
   * @param {ModificationPayload} modifications - The modifications to apply
   * @throws {Error} If component or path is not found
   */
  modifyComponent(name, path, modifications) {
    const primitive = this.findByPath(name, path);
    if (!primitive) {
      throw new Error(
        `Path resolution failed for component "${name}" at path: ${path.join('/')}`
      );
    }

    // Apply prop modifications
    if (modifications.props) {
      Object.assign(primitive.props, modifications.props);
    }

    this.#notifyChange(name);
  }

  /**
   * Inserts a new primitive at the specified parent path.
   *
   * @param {string} name - The name of the component
   * @param {string[]} parentPath - Path to the parent primitive
   * @param {BasePrimitive} primitive - The primitive to insert
   * @param {number} [index] - Optional index at which to insert
   * @throws {Error} If component or parent path is not found
   */
  insertPrimitive(name, parentPath, primitive, index) {
    const parent = this.findByPath(name, parentPath);
    if (!parent) {
      throw new Error(
        `Path resolution failed for component "${name}" at path: ${parentPath.join('/')}`
      );
    }

    if (!(primitive instanceof BasePrimitive)) {
      throw new Error('Primitive must be a BasePrimitive instance');
    }

    if (index !== undefined) {
      parent.insertChild(primitive, index);
    } else {
      parent.appendChild(primitive);
    }

    // Index the new primitive and its descendants
    this.#indexTree(primitive);

    this.#notifyChange(name);
  }

  /**
   * Removes a primitive at the specified path.
   *
   * @param {string} name - The name of the component
   * @param {string[]} path - Path to the primitive to remove
   * @throws {Error} If component, path, or parent is not found
   */
  removePrimitive(name, path) {
    if (path.length === 0) {
      throw new Error('Cannot remove root primitive');
    }

    const primitive = this.findByPath(name, path);
    if (!primitive) {
      throw new Error(
        `Path resolution failed for component "${name}" at path: ${path.join('/')}`
      );
    }

    const parent = primitive.parent;
    if (!parent) {
      throw new Error('Cannot remove root primitive');
    }

    parent.removeChild(primitive);
    this.#removeFromIndex(primitive);

    this.#notifyChange(name);
  }


  /**
   * Registers an event handler by ID.
   *
   * @param {string} id - The unique ID for the handler
   * @param {Function} handler - The handler function
   */
  registerEventHandler(id, handler) {
    if (!id || typeof id !== 'string') {
      throw new Error('Handler ID must be a non-empty string');
    }
    if (typeof handler !== 'function') {
      throw new Error('Handler must be a function');
    }
    this.#eventHandlers.set(id, handler);
  }

  /**
   * Unregisters an event handler by ID.
   *
   * @param {string} id - The ID of the handler to unregister
   * @returns {boolean} True if the handler was found and removed
   */
  unregisterEventHandler(id) {
    return this.#eventHandlers.delete(id);
  }

  /**
   * Invokes an event handler by ID with the provided arguments.
   * Supports async handlers.
   *
   * @param {string} id - The ID of the handler to invoke
   * @param {...*} args - Arguments to pass to the handler
   * @returns {Promise<*>} The result of the handler
   * @throws {Error} If handler is not found
   */
  async invokeEventHandler(id, ...args) {
    const handler = this.#eventHandlers.get(id);
    if (!handler) {
      throw new Error(`Event handler not found: ${id}`);
    }
    return await handler(...args);
  }

  /**
   * Checks if an event handler is registered.
   *
   * @param {string} id - The ID of the handler
   * @returns {boolean} True if the handler is registered
   */
  hasEventHandler(id) {
    return this.#eventHandlers.has(id);
  }

  /**
   * Indexes all nodes in a tree for O(1) lookup by ID.
   *
   * @param {BasePrimitive} node - The root node to index
   * @private
   */
  #indexTree(node) {
    this.#nodeIndex.set(node.id, node);
    for (const child of node.children) {
      this.#indexTree(child);
    }
  }

  /**
   * Removes a node and its descendants from the index.
   *
   * @param {BasePrimitive} node - The root node to remove from index
   * @private
   */
  #removeFromIndex(node) {
    this.#nodeIndex.delete(node.id);
    for (const child of node.children) {
      this.#removeFromIndex(child);
    }
  }

  /**
   * Dispatches a change notification event for a component.
   *
   * @param {string} componentName - The name of the changed component
   * @private
   */
  #notifyChange(componentName) {
    // Use CustomEvent for browser environments, or a simple event emitter pattern
    if (typeof CustomEvent !== 'undefined' && typeof dispatchEvent !== 'undefined') {
      const event = new CustomEvent('component-tree-changed', {
        detail: { componentName },
      });
      dispatchEvent(event);
    }
  }

  /**
   * Gets the total number of indexed nodes.
   * Useful for testing and debugging.
   *
   * @returns {number} The number of indexed nodes
   */
  getIndexSize() {
    return this.#nodeIndex.size;
  }

  // ============================================
  // WASM Component Registration (Requirement 7.3)
  // ============================================

  /** @type {Map<string, WasmComponentInstance>} Map of WASM component IDs to instances */
  #wasmInstances = new Map();

  /**
   * Registers a WASM component instance with the registry.
   * This enables Motif extensions to inspect WASM components via get_tree().
   *
   * @param {string} id - The unique ID of the WASM component
   * @param {WasmComponentInstance} instance - The WASM component instance
   */
  registerWasmComponent(id, instance) {
    if (!id || typeof id !== 'string') {
      throw new Error('WASM component ID must be a non-empty string');
    }
    if (!instance || typeof instance.getTree !== 'function') {
      throw new Error('WASM instance must have a getTree() method');
    }
    this.#wasmInstances.set(id, instance);
  }

  /**
   * Unregisters a WASM component instance from the registry.
   *
   * @param {string} id - The ID of the WASM component to unregister
   * @returns {boolean} True if the component was found and removed
   */
  unregisterWasmComponent(id) {
    return this.#wasmInstances.delete(id);
  }

  /**
   * Gets a WASM component instance by ID.
   *
   * @param {string} id - The ID of the WASM component
   * @returns {WasmComponentInstance | undefined} The WASM instance, or undefined if not found
   */
  getWasmComponent(id) {
    return this.#wasmInstances.get(id);
  }

  /**
   * Gets all registered WASM component IDs.
   *
   * @returns {string[]} Array of WASM component IDs
   */
  getWasmComponentIds() {
    return Array.from(this.#wasmInstances.keys());
  }

  /**
   * Gets the component tree from a WASM component.
   * This enables Motif extensions to inspect WASM components.
   *
   * @param {string} id - The ID of the WASM component
   * @returns {ComponentTree | null} The component tree, or null if not found
   */
  getWasmComponentTree(id) {
    const instance = this.#wasmInstances.get(id);
    if (!instance) {
      return null;
    }
    return instance.getTree();
  }
}

/**
 * WASM component instance interface for registry.
 * @typedef {Object} WasmComponentInstance
 * @property {function(): ComponentTree} getTree - Returns the component tree
 * @property {function(string[], Object): void} modify - Modifies props at path
 * @property {function(): void} destroy - Cleans up resources
 */
