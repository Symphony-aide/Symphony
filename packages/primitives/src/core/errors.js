/**
 * @fileoverview Custom error types for the Primitives package
 * @module @symphony/primitives/core/errors
 */

/**
 * Base error class for all primitive-related errors.
 * Provides a consistent error interface with error codes.
 */
export class PrimitiveError extends Error {
  /** @type {string} Error code for programmatic handling */
  code;

  /**
   * Creates a new PrimitiveError.
   *
   * @param {string} message - Human-readable error message
   * @param {string} code - Error code for programmatic handling
   */
  constructor(message, code) {
    super(message);
    this.name = 'PrimitiveError';
    this.code = code;
  }
}

/**
 * Error thrown when a component is not found in the registry.
 */
export class ComponentNotFoundError extends PrimitiveError {
  /** @type {string} The name of the component that was not found */
  componentName;

  /**
   * Creates a new ComponentNotFoundError.
   *
   * @param {string} componentName - The name of the component that was not found
   */
  constructor(componentName) {
    super(`Component not found: ${componentName}`, 'COMPONENT_NOT_FOUND');
    this.name = 'ComponentNotFoundError';
    this.componentName = componentName;
  }
}

/**
 * Error thrown when path resolution fails in a component tree.
 */
export class PathResolutionError extends PrimitiveError {
  /** @type {string} The name of the component where resolution failed */
  componentName;

  /** @type {string[]} The path that failed to resolve */
  path;

  /**
   * Creates a new PathResolutionError.
   *
   * @param {string} componentName - The name of the component
   * @param {string[]} path - The path that failed to resolve
   */
  constructor(componentName, path) {
    super(
      `Path resolution failed for component "${componentName}" at path: ${path.join('/')}`,
      'PATH_RESOLUTION_FAILED'
    );
    this.name = 'PathResolutionError';
    this.componentName = componentName;
    this.path = path;
  }
}

/**
 * Error thrown when a WASM module fails to load.
 */
export class WasmLoadError extends PrimitiveError {
  /** @type {string} The path to the WASM module that failed to load */
  modulePath;

  /** @type {Error | undefined} The underlying cause of the load failure */
  cause;

  /**
   * Creates a new WasmLoadError.
   *
   * @param {string} modulePath - The path to the WASM module
   * @param {Error} [cause] - The underlying error that caused the load failure
   */
  constructor(modulePath, cause) {
    super(`Failed to load WASM module: ${modulePath}`, 'WASM_LOAD_FAILED');
    this.name = 'WasmLoadError';
    this.modulePath = modulePath;
    this.cause = cause;
  }
}
