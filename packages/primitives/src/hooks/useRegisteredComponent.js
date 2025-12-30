/**
 * @fileoverview useRegisteredComponent Hook - React hook for connecting components to the registry
 * @module @symphony/primitives/hooks/useRegisteredComponent
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * @typedef {import('../core/types.js').ComponentTree} ComponentTree
 * @typedef {import('../registry/ComponentRegistry.js').ComponentRegistry} ComponentRegistry
 */

/** @type {ComponentRegistry | null} */
let globalRegistry = null;

/**
 * Sets the global ComponentRegistry instance for the hook to use.
 *
 * @param {ComponentRegistry | null} registry - The registry instance
 */
export function setHookRegistry(registry) {
  globalRegistry = registry;
}

/**
 * Gets the current global ComponentRegistry instance.
 *
 * @returns {ComponentRegistry | null} The registry instance
 */
export function getHookRegistry() {
  return globalRegistry;
}

/**
 * React hook that connects a component to the ComponentRegistry.
 * Returns the component tree from the registry by name and automatically
 * re-renders when the component tree changes.
 *
 * **Feature: primitives-package, Property 17: Hook Component Retrieval**
 * For any component name, useRegisteredComponent SHALL return the component tree
 * if it exists in the registry, or null if it does not exist.
 * **Validates: Requirements 10.1, 10.4**
 *
 * **Feature: primitives-package, Property 18: Hook Event Subscription**
 * For any component name where the hook is active, when a 'component-tree-changed'
 * event is dispatched for that component, the hook SHALL update its state and
 * trigger a React re-render.
 * **Validates: Requirements 10.2**
 *
 * @param {string} componentName - The name of the component to retrieve
 * @param {ComponentRegistry} [registry] - Optional registry instance (uses global if not provided)
 * @returns {ComponentTree | null} The component tree, or null if not found
 *
 * @example
 * ```jsx
 * import { useRegisteredComponent } from '@symphony/primitives';
 *
 * function MyComponent() {
 *   const tree = useRegisteredComponent('activity-bar');
 *
 *   if (!tree) {
 *     return <div>Component not found</div>;
 *   }
 *
 *   return <PrimitiveRenderer primitive={tree} />;
 * }
 * ```
 */
export function useRegisteredComponent(componentName, registry) {
  const activeRegistry = registry || globalRegistry;

  // Get initial component tree
  const getComponentTree = useCallback(() => {
    if (!activeRegistry || !componentName) {
      return null;
    }
    return activeRegistry.getComponentTree(componentName);
  }, [activeRegistry, componentName]);

  const [componentTree, setComponentTree] = useState(getComponentTree);

  useEffect(() => {
    // Update state if registry or component name changes
    setComponentTree(getComponentTree());

    // If no registry or component name, nothing to subscribe to
    if (!activeRegistry || !componentName) {
      return;
    }

    /**
     * Event handler for component-tree-changed events.
     * Updates state and triggers re-render when the watched component changes.
     *
     * @param {CustomEvent} event - The change event
     */
    const handleTreeChange = (event) => {
      const { componentName: changedComponent } = event.detail || {};

      // Only update if this is the component we're watching
      if (changedComponent === componentName) {
        setComponentTree(activeRegistry.getComponentTree(componentName));
      }
    };

    // Subscribe to component-tree-changed events
    // Requirements 10.2: Subscribe to 'component-tree-changed' events
    if (typeof addEventListener !== 'undefined') {
      addEventListener('component-tree-changed', handleTreeChange);
    }

    // Cleanup function - Requirements 10.3: Remove event listener to prevent memory leaks
    return () => {
      if (typeof removeEventListener !== 'undefined') {
        removeEventListener('component-tree-changed', handleTreeChange);
      }
    };
  }, [activeRegistry, componentName, getComponentTree]);

  return componentTree;
}

export default useRegisteredComponent;
