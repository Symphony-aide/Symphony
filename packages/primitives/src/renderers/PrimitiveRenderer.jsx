/**
 * @fileoverview PrimitiveRenderer - React renderer for Symphony primitives
 * @module @symphony/primitives/renderers/PrimitiveRenderer
 */

import React from 'react';
import { BasePrimitive } from '../core/BasePrimitive.js';

/**
 * @typedef {import('../core/types.js').PrimitiveProps} PrimitiveProps
 */

/**
 * Map of primitive types to their React component implementations.
 * This map is used to resolve primitive types to actual React components.
 * @type {Map<string, React.ComponentType<any>>}
 */
const componentMap = new Map();

/**
 * Registers a React component for a primitive type.
 * 
 * @param {string} type - The primitive type name
 * @param {React.ComponentType<any>} component - The React component to render
 */
export function registerComponent(type, component) {
  componentMap.set(type, component);
}

/**
 * Unregisters a React component for a primitive type.
 * 
 * @param {string} type - The primitive type name to unregister
 * @returns {boolean} True if the component was found and removed
 */
export function unregisterComponent(type) {
  return componentMap.delete(type);
}

/**
 * Gets the registered component for a primitive type.
 * 
 * @param {string} type - The primitive type name
 * @returns {React.ComponentType<any> | undefined} The registered component or undefined
 */
export function getRegisteredComponent(type) {
  return componentMap.get(type);
}

/**
 * Gets all registered primitive types.
 * 
 * @returns {string[]} Array of registered type names
 */
export function getRegisteredTypes() {
  return Array.from(componentMap.keys());
}


/**
 * Default component registry instance for handler invocation.
 * Can be set via setPrimitiveRegistry.
 * @type {import('../registry/ComponentRegistry.js').ComponentRegistry | null}
 */
let registryInstance = null;

/**
 * Sets the component registry instance for handler invocation.
 * 
 * @param {import('../registry/ComponentRegistry.js').ComponentRegistry} registry - The registry instance
 */
export function setPrimitiveRegistry(registry) {
  registryInstance = registry;
}

/**
 * Gets the current component registry instance.
 * 
 * @returns {import('../registry/ComponentRegistry.js').ComponentRegistry | null} The registry instance
 */
export function getPrimitiveRegistry() {
  return registryInstance;
}

/**
 * Converts handler ID props to actual functions that invoke the registry.
 * Handler props are identified by starting with 'on' (e.g., onClick, onChange).
 * 
 * @param {PrimitiveProps} props - The primitive props
 * @returns {PrimitiveProps} Props with handler IDs converted to functions
 */
export function convertHandlerProps(props) {
  const converted = { ...props };
  
  for (const [key, value] of Object.entries(props)) {
    // Check if this is a handler prop (starts with 'on' and value is a string ID)
    if (key.startsWith('on') && typeof value === 'string') {
      const handlerId = value;
      converted[key] = async (...args) => {
        if (registryInstance) {
          return await registryInstance.invokeEventHandler(handlerId, ...args);
        } else {
          console.warn(`No registry set for handler invocation: ${handlerId}`);
        }
      };
    }
  }
  
  return converted;
}

/**
 * Props for the PrimitiveRenderer component.
 * @typedef {Object} PrimitiveRendererProps
 * @property {BasePrimitive} primitive - The primitive to render
 */

/**
 * PrimitiveRenderer component - Renders a primitive and its children as React components.
 * 
 * Maps primitive types to React components, converts handler IDs to functions,
 * and recursively renders children for non-leaf nodes.
 * 
 * @param {PrimitiveRendererProps} props - Component props
 * @returns {React.ReactElement | null} The rendered component or null
 * 
 * @example
 * const button = Button({ onClick: 'my_handler', variant: 'primary' });
 * <PrimitiveRenderer primitive={button} />
 */
export function PrimitiveRenderer({ primitive }) {
  // Validate primitive
  if (!primitive || !(primitive instanceof BasePrimitive)) {
    console.warn('PrimitiveRenderer: Invalid primitive provided');
    return null;
  }

  // Check for direct render delegation
  if (primitive.renderDirect || primitive.renderStrategy === 'direct') {
    // Import DirectRenderer dynamically to avoid circular dependencies
    const DirectRenderer = React.lazy(() => import('./DirectRenderer.jsx'));
    return (
      <React.Suspense fallback={null}>
        <DirectRenderer primitive={primitive} />
      </React.Suspense>
    );
  }

  // Get the component for this primitive type
  const Component = componentMap.get(primitive.type);
  
  if (!Component) {
    console.warn(`PrimitiveRenderer: Unknown primitive type "${primitive.type}"`);
    return null;
  }

  // Convert handler ID props to functions
  const convertedProps = convertHandlerProps(primitive.props);

  // Render children recursively if not a leaf node
  let children = null;
  if (!primitive.isLeafNode && primitive.children.length > 0) {
    children = primitive.children.map((child) => (
      <PrimitiveRenderer key={child.id} primitive={child} />
    ));
  }

  // Render the component with converted props and children
  return (
    <Component {...convertedProps} data-primitive-id={primitive.id}>
      {children}
    </Component>
  );
}

export default PrimitiveRenderer;
