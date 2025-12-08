/**
 * @fileoverview Contract validation utilities for IPC Bridge testing
 * @module @symphony/primitives/__tests__/utils/contractValidators
 *
 * Provides schema validation functions and contract definitions for
 * testing IPC Bridge API contracts between frontend and backend.
 *
 * @see Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

// ============================================
// Schema Validation Functions
// ============================================

/**
 * Validates that a value matches the expected type.
 *
 * @param {*} value - The value to validate
 * @param {string} expectedType - Expected type ('string', 'number', 'boolean', 'object', 'array')
 * @returns {boolean} True if the value matches the expected type
 */
export function validateType(value, expectedType) {
  switch (expectedType) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'object':
      return value !== null && typeof value === 'object' && !Array.isArray(value);
    case 'array':
      return Array.isArray(value);
    case 'any':
      return true;
    default:
      return false;
  }
}

/**
 * Validates an object against a schema definition.
 *
 * @param {Object} obj - The object to validate
 * @param {Object} schema - Schema definition with field types and requirements
 * @returns {{ valid: boolean, errors: string[] }} Validation result
 *
 * @example
 * const schema = {
 *   id: { type: 'string', required: true },
 *   count: { type: 'number', required: false }
 * };
 * const result = validateSchema({ id: 'test' }, schema);
 * // { valid: true, errors: [] }
 */
export function validateSchema(obj, schema) {
  const errors = [];

  if (!obj || typeof obj !== 'object') {
    return { valid: false, errors: ['Value must be an object'] };
  }

  for (const [field, definition] of Object.entries(schema)) {
    const value = obj[field];
    const { type, required, enum: enumValues, items } = definition;

    // Check required fields
    if (required && (value === undefined || value === null)) {
      errors.push(`Missing required field: ${field}`);
      continue;
    }

    // Skip validation for optional undefined fields
    if (value === undefined || value === null) {
      continue;
    }

    // Validate type
    if (!validateType(value, type)) {
      errors.push(`Field '${field}' expected type '${type}', got '${typeof value}'`);
      continue;
    }

    // Validate enum values
    if (enumValues && !enumValues.includes(value)) {
      errors.push(`Field '${field}' must be one of: ${enumValues.join(', ')}`);
    }

    // Validate array items
    if (type === 'array' && items) {
      for (let i = 0; i < value.length; i++) {
        const itemResult = validateSchema(value[i], items);
        if (!itemResult.valid) {
          errors.push(`Array item ${i} in '${field}': ${itemResult.errors.join(', ')}`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}


// ============================================
// IPC Contract Definitions
// ============================================

/**
 * Schema for ComponentTree structure returned by get_component_tree.
 * @type {Object}
 */
export const COMPONENT_TREE_SCHEMA = {
  id: { type: 'string', required: true },
  type: { type: 'string', required: true },
  props: { type: 'object', required: true },
  renderStrategy: {
    type: 'string',
    required: true,
    enum: ['react', 'wasm', 'direct'],
  },
  children: { type: 'array', required: true },
};

/**
 * Schema for successful IPC response.
 * @type {Object}
 */
export const SUCCESS_RESPONSE_SCHEMA = {
  success: { type: 'boolean', required: true },
  data: { type: 'any', required: false },
  requestId: { type: 'string', required: false },
};

/**
 * Schema for error IPC response.
 * @type {Object}
 */
export const ERROR_RESPONSE_SCHEMA = {
  success: { type: 'boolean', required: true },
  error: { type: 'string', required: true },
  code: { type: 'string', required: true },
  requestId: { type: 'string', required: false },
};

/**
 * Complete IPC contract definitions for all methods.
 * Each contract defines request schema, success response schema, and error response schema.
 *
 * @type {Object<string, { request: Object, successResponse: Object, errorResponse: Object }>}
 */
export const IPC_CONTRACTS = {
  /**
   * get_component_tree contract
   * @see Requirements 2.1
   */
  get_component_tree: {
    request: {
      name: { type: 'string', required: true },
    },
    successResponse: {
      success: { type: 'boolean', required: true },
      data: { type: 'object', required: true },
      requestId: { type: 'string', required: false },
    },
    successDataSchema: COMPONENT_TREE_SCHEMA,
    errorResponse: ERROR_RESPONSE_SCHEMA,
  },

  /**
   * modify_component contract
   * @see Requirements 2.2
   */
  modify_component: {
    request: {
      name: { type: 'string', required: true },
      path: { type: 'array', required: true },
      modifications: { type: 'object', required: true },
    },
    successResponse: {
      success: { type: 'boolean', required: true },
      data: { type: 'object', required: true },
      requestId: { type: 'string', required: false },
    },
    successDataSchema: {
      modified: { type: 'boolean', required: true },
    },
    errorResponse: ERROR_RESPONSE_SCHEMA,
  },

  /**
   * insert_component contract
   * @see Requirements 2.3
   */
  insert_component: {
    request: {
      name: { type: 'string', required: true },
      parentPath: { type: 'array', required: true },
      primitive: { type: 'object', required: true },
      index: { type: 'number', required: false },
    },
    successResponse: {
      success: { type: 'boolean', required: true },
      data: { type: 'object', required: true },
      requestId: { type: 'string', required: false },
    },
    successDataSchema: {
      inserted: { type: 'boolean', required: true },
      primitiveId: { type: 'string', required: true },
    },
    errorResponse: ERROR_RESPONSE_SCHEMA,
  },

  /**
   * remove_component contract
   * @see Requirements 2.4
   */
  remove_component: {
    request: {
      name: { type: 'string', required: true },
      path: { type: 'array', required: true },
    },
    successResponse: {
      success: { type: 'boolean', required: true },
      data: { type: 'object', required: true },
      requestId: { type: 'string', required: false },
    },
    successDataSchema: {
      removed: { type: 'boolean', required: true },
    },
    errorResponse: ERROR_RESPONSE_SCHEMA,
  },

  /**
   * invoke_motif_handler contract
   * @see Requirements 2.5
   */
  invoke_motif_handler: {
    request: {
      handlerId: { type: 'string', required: true },
      args: { type: 'array', required: false },
    },
    successResponse: {
      success: { type: 'boolean', required: true },
      data: { type: 'object', required: true },
      requestId: { type: 'string', required: false },
    },
    successDataSchema: {
      result: { type: 'any', required: false },
    },
    errorResponse: ERROR_RESPONSE_SCHEMA,
  },
};

// ============================================
// Contract Validation Functions
// ============================================

/**
 * Validates an IPC request against its contract.
 *
 * @param {string} method - The IPC method name
 * @param {Object} params - The request parameters
 * @returns {{ valid: boolean, errors: string[] }} Validation result
 *
 * @example
 * const result = validateIPCRequest('get_component_tree', { name: 'MyComponent' });
 * // { valid: true, errors: [] }
 */
export function validateIPCRequest(method, params) {
  const contract = IPC_CONTRACTS[method];
  if (!contract) {
    return { valid: false, errors: [`Unknown IPC method: ${method}`] };
  }

  return validateSchema(params, contract.request);
}

/**
 * Validates an IPC success response against its contract.
 *
 * @param {string} method - The IPC method name
 * @param {Object} response - The response object
 * @returns {{ valid: boolean, errors: string[] }} Validation result
 *
 * @example
 * const result = validateIPCSuccessResponse('get_component_tree', {
 *   success: true,
 *   data: { id: '123', type: 'Button', props: {}, renderStrategy: 'react', children: [] }
 * });
 */
export function validateIPCSuccessResponse(method, response) {
  const contract = IPC_CONTRACTS[method];
  if (!contract) {
    return { valid: false, errors: [`Unknown IPC method: ${method}`] };
  }

  // Validate response structure
  const responseResult = validateSchema(response, contract.successResponse);
  if (!responseResult.valid) {
    return responseResult;
  }

  // Validate success flag
  if (response.success !== true) {
    return { valid: false, errors: ['Success response must have success=true'] };
  }

  // Validate data schema if defined
  if (contract.successDataSchema && response.data) {
    const dataResult = validateSchema(response.data, contract.successDataSchema);
    if (!dataResult.valid) {
      return {
        valid: false,
        errors: dataResult.errors.map((e) => `data.${e}`),
      };
    }
  }

  return { valid: true, errors: [] };
}

/**
 * Validates an IPC error response against its contract.
 *
 * @param {string} method - The IPC method name
 * @param {Object} response - The response object
 * @returns {{ valid: boolean, errors: string[] }} Validation result
 *
 * @example
 * const result = validateIPCErrorResponse('get_component_tree', {
 *   success: false,
 *   error: 'Component not found',
 *   code: 'COMPONENT_NOT_FOUND'
 * });
 */
export function validateIPCErrorResponse(method, response) {
  const contract = IPC_CONTRACTS[method];
  if (!contract) {
    return { valid: false, errors: [`Unknown IPC method: ${method}`] };
  }

  // Validate response structure
  const responseResult = validateSchema(response, contract.errorResponse);
  if (!responseResult.valid) {
    return responseResult;
  }

  // Validate success flag
  if (response.success !== false) {
    return { valid: false, errors: ['Error response must have success=false'] };
  }

  // Validate error message is non-empty
  if (!response.error || response.error.trim() === '') {
    return { valid: false, errors: ['Error message must be non-empty'] };
  }

  // Validate error code is non-empty
  if (!response.code || response.code.trim() === '') {
    return { valid: false, errors: ['Error code must be non-empty'] };
  }

  return { valid: true, errors: [] };
}

/**
 * Validates a ComponentTree structure recursively.
 *
 * @param {Object} tree - The component tree to validate
 * @returns {{ valid: boolean, errors: string[] }} Validation result
 */
export function validateComponentTree(tree) {
  const result = validateSchema(tree, COMPONENT_TREE_SCHEMA);
  if (!result.valid) {
    return result;
  }

  // Recursively validate children
  const errors = [];
  if (Array.isArray(tree.children)) {
    for (let i = 0; i < tree.children.length; i++) {
      const childResult = validateComponentTree(tree.children[i]);
      if (!childResult.valid) {
        errors.push(`children[${i}]: ${childResult.errors.join(', ')}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// ============================================
// Test Data Generators
// ============================================

/**
 * Creates a valid component tree for testing.
 *
 * @param {Object} [overrides={}] - Properties to override
 * @returns {Object} Valid component tree
 */
export function createValidComponentTree(overrides = {}) {
  return {
    id: 'test-id-123',
    type: 'Container',
    props: { direction: 'column' },
    renderStrategy: 'react',
    children: [],
    ...overrides,
  };
}

/**
 * Creates a valid IPC request for testing.
 *
 * @param {string} method - The IPC method name
 * @param {Object} [overrides={}] - Properties to override
 * @returns {Object} Valid request parameters
 */
export function createValidIPCRequest(method, overrides = {}) {
  const defaults = {
    get_component_tree: { name: 'TestComponent' },
    modify_component: {
      name: 'TestComponent',
      path: ['Container'],
      modifications: { props: { direction: 'row' } },
    },
    insert_component: {
      name: 'TestComponent',
      parentPath: [],
      primitive: createValidComponentTree(),
    },
    remove_component: {
      name: 'TestComponent',
      path: ['Container', 'Button'],
    },
    invoke_motif_handler: {
      handlerId: 'test_handler',
      args: [],
    },
  };

  return { ...defaults[method], ...overrides };
}

/**
 * Creates a valid success response for testing.
 *
 * @param {string} method - The IPC method name
 * @param {Object} [dataOverrides={}] - Data properties to override
 * @returns {Object} Valid success response
 */
export function createValidSuccessResponse(method, dataOverrides = {}) {
  const dataDefaults = {
    get_component_tree: createValidComponentTree(),
    modify_component: { modified: true },
    insert_component: { inserted: true, primitiveId: 'new-id-456' },
    remove_component: { removed: true },
    invoke_motif_handler: { result: null },
  };

  return {
    success: true,
    data: { ...dataDefaults[method], ...dataOverrides },
  };
}

/**
 * Creates a valid error response for testing.
 *
 * @param {string} [error='Test error'] - Error message
 * @param {string} [code='TEST_ERROR'] - Error code
 * @returns {Object} Valid error response
 */
export function createValidErrorResponse(error = 'Test error', code = 'TEST_ERROR') {
  return {
    success: false,
    error,
    code,
  };
}
