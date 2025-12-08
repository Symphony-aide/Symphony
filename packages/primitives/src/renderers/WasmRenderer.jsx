/**
 * @fileoverview WasmRenderer - WASM renderer for performance-critical primitives
 * @module @symphony/primitives/renderers/WasmRenderer
 *
 * This renderer handles WASM-based primitives for near-native performance.
 * It dynamically loads WASM modules, creates instances, and manages their lifecycle.
 *
 * @see Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BasePrimitive } from '../core/BasePrimitive.js';

/**
 * @typedef {import('../core/types.js').PrimitiveProps} PrimitiveProps
 * @typedef {import('../core/types.js').ComponentTree} ComponentTree
 */

/**
 * WASM component instance interface.
 * @typedef {Object} WasmComponentInstance
 * @property {function(): ComponentTree} getTree - Returns the component tree
 * @property {function(string[], PrimitiveProps): void} modify - Modifies props at path
 * @property {function(): void} destroy - Cleans up resources
 * @property {Object.<string, function(*): void>} setters - Dynamic prop setters (set_<propName>)
 */

/**
 * WASM module interface.
 * @typedef {Object} WasmModule
 * @property {function(string, PrimitiveProps): WasmComponentInstance} create - Creates instance
 */

/**
 * Cache for loaded WASM modules.
 * @type {Map<string, WasmModule>}
 */
const wasmModuleCache = new Map();

/**
 * Registry instance for WASM component registration.
 * @type {import('../registry/ComponentRegistry.js').ComponentRegistry | null}
 */
let registryInstance = null;

/**
 * Sets the component registry instance for WASM component registration.
 *
 * @param {import('../registry/ComponentRegistry.js').ComponentRegistry} registry - The registry instance
 */
export function setWasmRegistry(registry) {
  registryInstance = registry;
}

/**
 * Gets the current component registry instance.
 *
 * @returns {import('../registry/ComponentRegistry.js').ComponentRegistry | null} The registry instance
 */
export function getWasmRegistry() {
  return registryInstance;
}


/**
 * Loads a WASM module dynamically.
 * Uses caching to avoid reloading the same module.
 *
 * @param {string} modulePath - Path to the WASM module
 * @returns {Promise<WasmModule>} The loaded WASM module
 * @throws {Error} If the module fails to load
 */
export async function loadWasmModule(modulePath) {
  // Check cache first
  const cached = wasmModuleCache.get(modulePath);
  if (cached) {
    return cached;
  }

  try {
    // Dynamically import the WASM module
    // In a real implementation, this would use WebAssembly.instantiateStreaming
    // For now, we simulate the module loading pattern
    const response = await fetch(modulePath);

    if (!response.ok) {
      throw new Error(`Failed to fetch WASM module: ${response.status} ${response.statusText}`);
    }

    const wasmBytes = await response.arrayBuffer();
    const wasmModule = await WebAssembly.compile(wasmBytes);
    const wasmInstance = await WebAssembly.instantiate(wasmModule);

    // Create a module wrapper that provides the expected interface
    /** @type {WasmModule} */
    const module = {
      create: (containerId, props) => {
        // Call the WASM module's create function
        const exports = wasmInstance.exports;

        // Create instance with container and props
        /** @type {WasmComponentInstance} */
        const instance = {
          getTree: () => {
            const getTreeFn = exports.get_tree;
            if (typeof getTreeFn === 'function') {
              // Call the WASM get_tree function
              getTreeFn();
              // In real implementation, decode the tree from WASM memory
              return { id: containerId, type: 'WasmComponent', props, renderStrategy: 'wasm', children: [] };
            }
            return { id: containerId, type: 'WasmComponent', props, renderStrategy: 'wasm', children: [] };
          },
          modify: (path, modifications) => {
            const modifyFn = exports.modify;
            if (typeof modifyFn === 'function') {
              modifyFn(JSON.stringify(path), JSON.stringify(modifications));
            }
          },
          destroy: () => {
            const destroyFn = exports.destroy;
            if (typeof destroyFn === 'function') {
              destroyFn();
            }
          },
          setters: {},
        };

        // Create dynamic setters for props
        for (const propName of Object.keys(props)) {
          const setterName = `set_${propName}`;
          const setterFn = exports[setterName];
          if (typeof setterFn === 'function') {
            instance.setters[propName] = (value) => {
              setterFn(value);
            };
          }
        }

        return instance;
      },
    };

    // Cache the module
    wasmModuleCache.set(modulePath, module);

    return module;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to load WASM module "${modulePath}": ${errorMessage}`);
  }
}

/**
 * Clears the WASM module cache.
 * Useful for testing or when modules need to be reloaded.
 */
export function clearWasmModuleCache() {
  wasmModuleCache.clear();
}

/**
 * Gets the number of cached WASM modules.
 *
 * @returns {number} The number of cached modules
 */
export function getWasmModuleCacheSize() {
  return wasmModuleCache.size;
}


/**
 * Props for the WasmRenderer component.
 * @typedef {Object} WasmRendererProps
 * @property {BasePrimitive} primitive - The WASM primitive to render
 * @property {function(Error): void} [onError] - Error callback
 * @property {React.ComponentType<WasmErrorFallbackProps>} [fallback] - Custom error fallback
 */

/**
 * Props for the WASM error fallback component.
 * @typedef {Object} WasmErrorFallbackProps
 * @property {Error} error - The error that occurred
 * @property {function(): void} retry - Function to retry loading
 * @property {string} modulePath - The WASM module path that failed
 */

/**
 * Loading state for WASM components.
 * @typedef {'idle' | 'loading' | 'loaded' | 'error'} WasmLoadingState
 */

/**
 * Default error fallback component for WASM load failures.
 *
 * @param {WasmErrorFallbackProps} props - Component props
 * @returns {React.ReactElement} The fallback UI
 */
function DefaultWasmErrorFallback({ error, retry, modulePath }) {
  return (
    <div
      style={{
        padding: '16px',
        border: '1px solid #f59e0b',
        borderRadius: '8px',
        backgroundColor: '#fffbeb',
        color: '#92400e',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600 }}>
        WASM Component Failed to Load
      </h3>
      <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
        Module: <code style={{ backgroundColor: '#fef3c7', padding: '2px 4px', borderRadius: '2px' }}>{modulePath}</code>
      </p>
      <p style={{ margin: '0 0 12px 0', fontSize: '14px' }}>
        {error.message || 'An unexpected error occurred while loading the WASM module'}
      </p>
      <details style={{ marginBottom: '12px' }}>
        <summary style={{ cursor: 'pointer', fontSize: '12px' }}>
          Error details
        </summary>
        <pre
          style={{
            fontSize: '11px',
            overflow: 'auto',
            maxHeight: '150px',
            padding: '8px',
            backgroundColor: '#fef3c7',
            borderRadius: '4px',
            marginTop: '8px',
          }}
        >
          {error.stack}
        </pre>
      </details>
      <button
        onClick={retry}
        style={{
          padding: '8px 16px',
          backgroundColor: '#f59e0b',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        Retry
      </button>
    </div>
  );
}

/**
 * Loading indicator component for WASM modules.
 *
 * @param {{ modulePath: string }} props - Component props
 * @returns {React.ReactElement} The loading UI
 */
function WasmLoadingIndicator({ modulePath }) {
  return (
    <div
      style={{
        padding: '16px',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        backgroundColor: '#f9fafb',
        color: '#6b7280',
        fontFamily: 'system-ui, sans-serif',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '24px',
          height: '24px',
          border: '3px solid #e5e7eb',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 8px',
        }}
      />
      <p style={{ margin: 0, fontSize: '14px' }}>
        Loading WASM module...
      </p>
      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#9ca3af' }}>
        {modulePath}
      </p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}


/**
 * WasmRenderer component - Renders WASM-based primitives.
 *
 * Handles the complete lifecycle of WASM components:
 * 1. Dynamically loads WASM modules (Requirement 7.1)
 * 2. Creates instances with container ID and props (Requirement 7.2)
 * 3. Registers component's get_tree() with ComponentRegistry (Requirement 7.3)
 * 4. Updates props via set_<propName> methods (Requirement 7.4)
 * 5. Cleans up via destroy() on unmount (Requirement 7.5)
 * 6. Handles load errors with retry option (Requirement 7.6)
 *
 * @param {WasmRendererProps} props - Component props
 * @returns {React.ReactElement | null} The rendered component or null
 *
 * @example
 * const codeEditor = CodeEditor({ language: 'typescript', value: 'const x = 1;' });
 * <WasmRenderer primitive={codeEditor} />
 */
export function WasmRenderer({ primitive, onError, fallback: FallbackComponent }) {
  // Validate primitive
  if (!primitive || !(primitive instanceof BasePrimitive)) {
    console.warn('WasmRenderer: Invalid primitive provided');
    return null;
  }

  if (primitive.renderStrategy !== 'wasm') {
    console.warn(`WasmRenderer: Primitive has renderStrategy "${primitive.renderStrategy}", expected "wasm"`);
    return null;
  }

  const modulePath = primitive.wasmModule;
  if (!modulePath) {
    console.warn('WasmRenderer: Primitive has no wasmModule specified');
    return null;
  }

  const containerRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const instanceRef = useRef(/** @type {WasmComponentInstance | null} */ (null));
  const prevPropsRef = useRef(/** @type {PrimitiveProps} */ (primitive.props));

  const [loadingState, setLoadingState] = useState(/** @type {WasmLoadingState} */ ('idle'));
  const [error, setError] = useState(/** @type {Error | null} */ (null));
  const [retryCount, setRetryCount] = useState(0);

  /**
   * Loads the WASM module and creates an instance.
   */
  const loadAndCreateInstance = useCallback(async () => {
    if (!containerRef.current) return;

    setLoadingState('loading');
    setError(null);

    try {
      // Load the WASM module (Requirement 7.1)
      const module = await loadWasmModule(modulePath);

      // Create instance with container ID and props (Requirement 7.2)
      const containerId = primitive.id;
      const instance = module.create(containerId, primitive.props);

      instanceRef.current = instance;

      // Register with ComponentRegistry if available (Requirement 7.3)
      if (registryInstance && typeof instance.getTree === 'function') {
        registryInstance.registerWasmComponent(primitive.id, instance);
      }

      setLoadingState('loaded');
    } catch (err) {
      const loadError = err instanceof Error ? err : new Error(String(err));
      setError(loadError);
      setLoadingState('error');

      // Call error callback if provided
      if (onError) {
        onError(loadError);
      }

      console.error(`WasmRenderer: Failed to load WASM module "${modulePath}"`, loadError);
    }
  }, [modulePath, primitive.id, primitive.props, onError, retryCount]);

  // Load WASM module on mount
  useEffect(() => {
    loadAndCreateInstance();
  }, [loadAndCreateInstance]);

  // Update props when they change (Requirement 7.4)
  useEffect(() => {
    const instance = instanceRef.current;
    if (!instance || loadingState !== 'loaded') return;

    const currentProps = primitive.props;
    const prevProps = prevPropsRef.current;

    // Find changed props and call setters
    for (const [propName, value] of Object.entries(currentProps)) {
      if (prevProps[propName] !== value) {
        // Call set_<propName> method if available
        if (instance.setters && typeof instance.setters[propName] === 'function') {
          try {
            instance.setters[propName](value);
          } catch (err) {
            console.warn(`WasmRenderer: Failed to set prop "${propName}"`, err);
          }
        }
      }
    }

    prevPropsRef.current = { ...currentProps };
  }, [primitive.props, loadingState]);

  // Cleanup on unmount (Requirement 7.5)
  useEffect(() => {
    const primitiveId = primitive.id;
    return () => {
      // Unregister from ComponentRegistry
      if (registryInstance) {
        registryInstance.unregisterWasmComponent(primitiveId);
      }

      const instance = instanceRef.current;
      if (instance && typeof instance.destroy === 'function') {
        try {
          instance.destroy();
        } catch (err) {
          console.warn('WasmRenderer: Error during cleanup', err);
        }
        instanceRef.current = null;
      }
    };
  }, [primitive.id]);

  /**
   * Retry loading the WASM module.
   */
  const handleRetry = useCallback(() => {
    setRetryCount((count) => count + 1);
  }, []);

  // Render loading state
  if (loadingState === 'loading' || loadingState === 'idle') {
    return <WasmLoadingIndicator modulePath={modulePath} />;
  }

  // Render error state with retry option (Requirement 7.6)
  if (loadingState === 'error' && error) {
    const Fallback = FallbackComponent || DefaultWasmErrorFallback;
    return <Fallback error={error} retry={handleRetry} modulePath={modulePath} />;
  }

  // Render the WASM component container
  return (
    <div
      ref={containerRef}
      id={primitive.id}
      className={primitive.props.className || ''}
      data-primitive-id={primitive.id}
      data-primitive-type={primitive.type}
      data-wasm-module={modulePath}
      style={{ width: '100%', height: '100%' }}
    />
  );
}

export default WasmRenderer;
