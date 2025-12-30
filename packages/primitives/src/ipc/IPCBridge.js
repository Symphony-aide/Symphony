/**
 * @fileoverview IPCBridge - IPC handlers for component operations
 * @module @symphony/primitives/ipc/IPCBridge
 *
 * Provides IPC handlers that enable Python and Rust Motif extensions
 * to interact with the Component Registry through inter-process communication.
 *
 * @see Requirements 12.1, 12.2, 12.3, 12.4, 12.5
 */

import { ComponentRegistry } from '../registry/ComponentRegistry.js';
import { BasePrimitive } from '../core/BasePrimitive.js';

/**
 * @typedef {import('../core/types.js').ComponentTree} ComponentTree
 * @typedef {import('../core/types.js').PrimitiveProps} PrimitiveProps
 * @typedef {import('../core/types.js').ModificationPayload} ModificationPayload
 */

/**
 * @typedef {Object} IPCRequest
 * @property {string} method - The IPC method name
 * @property {Object} params - The method parameters
 * @property {string} [requestId] - Optional request ID for tracking
 */

/**
 * @typedef {Object} IPCResponse
 * @property {boolean} success - Whether the operation succeeded
 * @property {*} [data] - The response data (if successful)
 * @property {string} [error] - Error message (if failed)
 * @property {string} [code] - Error code (if failed)
 * @property {string} [requestId] - The request ID (if provided)
 */

/**
 * @typedef {Object} IPCHandler
 * @property {string} name - Handler name
 * @property {function(Object): Promise<IPCResponse>} handler - Handler function
 */

/**
 * IPCBridge provides IPC handlers for component operations, enabling
 * Python and Rust Motif extensions to interact with the UI.
 *
 * @example
 * ```javascript
 * const registry = new ComponentRegistry();
 * const bridge = new IPCBridge(registry);
 *
 * // Handle an IPC request
 * const response = await bridge.handleRequest({
 *   method: 'get_component_tree',
 *   params: { name: 'ActivityBar' }
 * });
 *
 * // Register handlers with an IPC transport
 * bridge.registerWithTransport(ipcTransport);
 * ```
 */
export class IPCBridge {
  /** @type {ComponentRegistry} The component registry */
  #registry;

  /** @type {Map<string, function(Object): Promise<IPCResponse>>} Registered handlers */
  #handlers;

  /** @type {function(string, Object): void | null} Optional notification callback */
  #notifyCallback;

  /**
   * Creates a new IPCBridge instance.
   *
   * @param {ComponentRegistry} [registry] - The component registry to use.
   *   If not provided, a new registry will be created.
   */
  constructor(registry) {
    this.#registry = registry || new ComponentRegistry();
    this.#handlers = new Map();
    this.#notifyCallback = null;

    // Register all IPC handlers
    this.#registerHandlers();
  }

  /**
   * Gets the underlying component registry.
   *
   * @returns {ComponentRegistry} The component registry
   */
  getRegistry() {
    return this.#registry;
  }

  /**
   * Sets a callback function to be called when the frontend should be notified
   * of changes. This is used to sync the frontend with backend modifications.
   *
   * @param {function(string, Object): void} callback - The notification callback
   *   First argument is the event type, second is the event data
   */
  setNotifyCallback(callback) {
    if (callback !== null && typeof callback !== 'function') {
      throw new Error('Notify callback must be a function or null');
    }
    this.#notifyCallback = callback;
  }

  /**
   * Registers all IPC handlers.
   * @private
   */
  #registerHandlers() {
    // Handler: get_component_tree
    // Requirement 12.1: Serialize and return the component tree
    this.#handlers.set('get_component_tree', this.#handleGetComponentTree.bind(this));

    // Handler: get_component_list
    // Additional helper for listing all components
    this.#handlers.set('get_component_list', this.#handleGetComponentList.bind(this));

    // Handler: modify_component
    // Requirement 12.2: Apply modifications and sync with frontend
    this.#handlers.set('modify_component', this.#handleModifyComponent.bind(this));

    // Handler: insert_component
    // Requirement 12.3: Insert primitive and notify frontend
    this.#handlers.set('insert_component', this.#handleInsertComponent.bind(this));

    // Handler: remove_component
    // Requirement 12.4: Remove primitive and notify frontend
    this.#handlers.set('remove_component', this.#handleRemoveComponent.bind(this));

    // Handler: invoke_motif_handler
    // Requirement 12.5: Invoke registered handler with arguments
    this.#handlers.set('invoke_motif_handler', this.#handleInvokeMotifHandler.bind(this));
  }

  /**
   * Handles an IPC request by routing it to the appropriate handler.
   *
   * @param {IPCRequest} request - The IPC request
   * @returns {Promise<IPCResponse>} The response
   */
  async handleRequest(request) {
    const { method, params, requestId } = request;

    const handler = this.#handlers.get(method);
    if (!handler) {
      return this.#errorResponse(
        `Unknown IPC method: ${method}`,
        'UNKNOWN_METHOD',
        requestId
      );
    }

    try {
      const response = await handler(params || {});
      if (requestId) {
        response.requestId = requestId;
      }
      return response;
    } catch (error) {
      return this.#errorResponse(
        error.message || 'Unknown error',
        error.code || 'INTERNAL_ERROR',
        requestId
      );
    }
  }

  /**
   * Gets all registered handler names.
   *
   * @returns {string[]} Array of handler names
   */
  getHandlerNames() {
    return Array.from(this.#handlers.keys());
  }

  /**
   * Checks if a handler is registered.
   *
   * @param {string} name - The handler name
   * @returns {boolean} True if the handler is registered
   */
  hasHandler(name) {
    return this.#handlers.has(name);
  }

  /**
   * Creates a success response.
   *
   * @param {*} data - The response data
   * @param {string} [requestId] - Optional request ID
   * @returns {IPCResponse} The success response
   * @private
   */
  #successResponse(data, requestId) {
    const response = { success: true, data };
    if (requestId) {
      response.requestId = requestId;
    }
    return response;
  }

  /**
   * Creates an error response.
   *
   * @param {string} error - The error message
   * @param {string} code - The error code
   * @param {string} [requestId] - Optional request ID
   * @returns {IPCResponse} The error response
   * @private
   */
  #errorResponse(error, code, requestId) {
    const response = { success: false, error, code };
    if (requestId) {
      response.requestId = requestId;
    }
    return response;
  }

  /**
   * Notifies the frontend of a change.
   *
   * @param {string} eventType - The event type
   * @param {Object} eventData - The event data
   * @private
   */
  #notifyFrontend(eventType, eventData) {
    if (this.#notifyCallback) {
      this.#notifyCallback(eventType, eventData);
    }
  }

  // ============================================
  // IPC Handler Implementations
  // ============================================

  /**
   * Handler: get_component_tree
   * Serializes and returns the component tree for a named component.
   *
   * @param {Object} params - The request parameters
   * @param {string} params.name - The component name
   * @returns {Promise<IPCResponse>} The response with component tree
   *
   * @see Requirements 12.1
   * @private
   */
  async #handleGetComponentTree(params) {
    const { name } = params;

    if (!name || typeof name !== 'string') {
      return this.#errorResponse(
        'Component name must be a non-empty string',
        'INVALID_PARAMS'
      );
    }

    const tree = this.#registry.getComponentTree(name);
    if (!tree) {
      return this.#errorResponse(
        `Component not found: ${name}`,
        'COMPONENT_NOT_FOUND'
      );
    }

    return this.#successResponse(tree);
  }

  /**
   * Handler: get_component_list
   * Returns a list of all registered component names.
   *
   * @param {Object} params - The request parameters (unused)
   * @returns {Promise<IPCResponse>} The response with component names
   * @private
   */
  async #handleGetComponentList(params) {
    const names = this.#registry.getComponentNames();
    return this.#successResponse(names);
  }

  /**
   * Handler: modify_component
   * Applies modifications to a component and syncs with frontend.
   *
   * @param {Object} params - The request parameters
   * @param {string} params.name - The component name
   * @param {string[]} params.path - Path to the primitive to modify
   * @param {ModificationPayload} params.modifications - The modifications to apply
   * @returns {Promise<IPCResponse>} The response
   *
   * @see Requirements 12.2
   * @private
   */
  async #handleModifyComponent(params) {
    const { name, path, modifications } = params;

    if (!name || typeof name !== 'string') {
      return this.#errorResponse(
        'Component name must be a non-empty string',
        'INVALID_PARAMS'
      );
    }

    if (!Array.isArray(path)) {
      return this.#errorResponse(
        'Path must be an array',
        'INVALID_PARAMS'
      );
    }

    if (!modifications || typeof modifications !== 'object') {
      return this.#errorResponse(
        'Modifications must be an object',
        'INVALID_PARAMS'
      );
    }

    try {
      this.#registry.modifyComponent(name, path, modifications);

      // Notify frontend of the change
      this.#notifyFrontend('component_modified', {
        componentName: name,
        path,
        modifications,
      });

      return this.#successResponse({ modified: true });
    } catch (error) {
      return this.#errorResponse(
        error.message,
        'MODIFICATION_FAILED'
      );
    }
  }

  /**
   * Handler: insert_component
   * Inserts a new primitive and notifies the frontend.
   *
   * @param {Object} params - The request parameters
   * @param {string} params.name - The component name
   * @param {string[]} params.parentPath - Path to the parent primitive
   * @param {ComponentTree} params.primitive - The primitive tree to insert
   * @param {number} [params.index] - Optional index at which to insert
   * @returns {Promise<IPCResponse>} The response
   *
   * @see Requirements 12.3
   * @private
   */
  async #handleInsertComponent(params) {
    const { name, parentPath, primitive, index } = params;

    if (!name || typeof name !== 'string') {
      return this.#errorResponse(
        'Component name must be a non-empty string',
        'INVALID_PARAMS'
      );
    }

    if (!Array.isArray(parentPath)) {
      return this.#errorResponse(
        'Parent path must be an array',
        'INVALID_PARAMS'
      );
    }

    if (!primitive || typeof primitive !== 'object') {
      return this.#errorResponse(
        'Primitive must be an object',
        'INVALID_PARAMS'
      );
    }

    try {
      // Reconstruct the primitive from the serialized tree
      const newPrimitive = BasePrimitive.fromTree(primitive);

      this.#registry.insertPrimitive(name, parentPath, newPrimitive, index);

      // Notify frontend of the insertion
      this.#notifyFrontend('component_inserted', {
        componentName: name,
        parentPath,
        primitive: newPrimitive.toTree(),
        index,
      });

      return this.#successResponse({
        inserted: true,
        primitiveId: newPrimitive.id,
      });
    } catch (error) {
      return this.#errorResponse(
        error.message,
        'INSERTION_FAILED'
      );
    }
  }

  /**
   * Handler: remove_component
   * Removes a primitive and notifies the frontend.
   *
   * @param {Object} params - The request parameters
   * @param {string} params.name - The component name
   * @param {string[]} params.path - Path to the primitive to remove
   * @returns {Promise<IPCResponse>} The response
   *
   * @see Requirements 12.4
   * @private
   */
  async #handleRemoveComponent(params) {
    const { name, path } = params;

    if (!name || typeof name !== 'string') {
      return this.#errorResponse(
        'Component name must be a non-empty string',
        'INVALID_PARAMS'
      );
    }

    if (!Array.isArray(path)) {
      return this.#errorResponse(
        'Path must be an array',
        'INVALID_PARAMS'
      );
    }

    try {
      this.#registry.removePrimitive(name, path);

      // Notify frontend of the removal
      this.#notifyFrontend('component_removed', {
        componentName: name,
        path,
      });

      return this.#successResponse({ removed: true });
    } catch (error) {
      return this.#errorResponse(
        error.message,
        'REMOVAL_FAILED'
      );
    }
  }

  /**
   * Handler: invoke_motif_handler
   * Invokes a registered event handler with the provided arguments.
   *
   * @param {Object} params - The request parameters
   * @param {string} params.handlerId - The handler ID to invoke
   * @param {Array} [params.args] - Arguments to pass to the handler
   * @returns {Promise<IPCResponse>} The response with handler result
   *
   * @see Requirements 12.5
   * @private
   */
  async #handleInvokeMotifHandler(params) {
    const { handlerId, args = [] } = params;

    if (!handlerId || typeof handlerId !== 'string') {
      return this.#errorResponse(
        'Handler ID must be a non-empty string',
        'INVALID_PARAMS'
      );
    }

    if (!Array.isArray(args)) {
      return this.#errorResponse(
        'Args must be an array',
        'INVALID_PARAMS'
      );
    }

    try {
      const result = await this.#registry.invokeEventHandler(handlerId, ...args);
      return this.#successResponse({ result });
    } catch (error) {
      return this.#errorResponse(
        error.message,
        'HANDLER_INVOCATION_FAILED'
      );
    }
  }

  // ============================================
  // Transport Integration
  // ============================================

  /**
   * Registers all handlers with an IPC transport.
   * The transport should have a `registerHandler(name, handler)` method.
   *
   * @param {Object} transport - The IPC transport
   * @param {function(string, function): void} transport.registerHandler - Handler registration method
   */
  registerWithTransport(transport) {
    if (!transport || typeof transport.registerHandler !== 'function') {
      throw new Error('Transport must have a registerHandler method');
    }

    for (const [name, handler] of this.#handlers) {
      transport.registerHandler(name, async (params) => {
        const response = await this.handleRequest({ method: name, params });
        return response;
      });
    }
  }

  /**
   * Creates a handler function suitable for use with various IPC systems.
   * Returns a function that takes (method, params) and returns a Promise.
   *
   * @returns {function(string, Object): Promise<IPCResponse>} The handler function
   */
  createHandler() {
    return async (method, params) => {
      return this.handleRequest({ method, params });
    };
  }
}

// ============================================
// Module-level singleton for convenience
// ============================================

/** @type {IPCBridge | null} */
let defaultBridge = null;

/**
 * Gets or creates the default IPCBridge instance.
 *
 * @param {ComponentRegistry} [registry] - Optional registry to use
 * @returns {IPCBridge} The default bridge instance
 */
export function getDefaultBridge(registry) {
  if (!defaultBridge) {
    defaultBridge = new IPCBridge(registry);
  }
  return defaultBridge;
}

/**
 * Sets the default IPCBridge instance.
 *
 * @param {IPCBridge | null} bridge - The bridge to set as default
 */
export function setDefaultBridge(bridge) {
  defaultBridge = bridge;
}

/**
 * Resets the default bridge (useful for testing).
 */
export function resetDefaultBridge() {
  defaultBridge = null;
}
