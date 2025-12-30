/**
 * @fileoverview Component tree serialization utilities
 * @module @symphony/primitives/utils/serializer
 *
 * Provides utilities for serializing and parsing UI component trees
 * to enable round-trip testing and component structure validation.
 *
 * @see Requirements 8.1, 8.2, 8.3
 */

/**
 * Serialized component representation.
 * @typedef {Object} SerializedComponent
 * @property {string} type - Component type name
 * @property {Record<string, unknown>} props - Component props (excluding children)
 * @property {SerializedComponent[]} children - Serialized child components
 */

/**
 * Serialization options.
 * @typedef {Object} SerializeOptions
 * @property {boolean} [includeKeys=false] - Whether to include React keys in serialization
 * @property {boolean} [includeRefs=false] - Whether to include refs in serialization
 * @property {string[]} [excludeProps=[]] - Props to exclude from serialization
 */

/**
 * Default props to exclude from serialization (non-serializable values).
 * @type {string[]}
 */
const DEFAULT_EXCLUDED_PROPS = ['ref', 'key', 'children'];

/**
 * Checks if a value is a valid React element.
 *
 * @param {unknown} value - Value to check
 * @returns {boolean} True if value is a React element
 */
function isReactElement(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    '$$typeof' in value &&
    (value.$$typeof === Symbol.for('react.element') ||
      value.$$typeof === Symbol.for('react.transitional.element') ||
      // Handle numeric symbol representation in some environments
      typeof value.$$typeof === 'symbol')
  );
}

/**
 * Gets the display name of a React component type.
 *
 * @param {unknown} type - React component type
 * @returns {string} Display name or 'Unknown'
 */
function getComponentTypeName(type) {
  if (typeof type === 'string') {
    return type;
  }
  if (typeof type === 'function') {
    return type.displayName || type.name || 'Anonymous';
  }
  if (typeof type === 'object' && type !== null) {
    // Handle forwardRef, memo, etc.
    if (type.displayName) {
      return type.displayName;
    }
    if (type.render && type.render.displayName) {
      return type.render.displayName;
    }
    if (type.type) {
      return getComponentTypeName(type.type);
    }
  }
  return 'Unknown';
}

/**
 * Serializes a prop value to a JSON-safe representation.
 *
 * @param {unknown} value - Prop value to serialize
 * @returns {unknown} Serialized value
 */
function serializePropValue(value) {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'function') {
    return '[Function]';
  }

  if (typeof value === 'symbol') {
    return `[Symbol: ${value.description || 'unknown'}]`;
  }

  if (isReactElement(value)) {
    return serializeComponent(value);
  }

  if (Array.isArray(value)) {
    return value.map(serializePropValue);
  }

  if (typeof value === 'object') {
    const serialized = {};
    for (const [key, val] of Object.entries(value)) {
      serialized[key] = serializePropValue(val);
    }
    return serialized;
  }

  return value;
}

/**
 * Serializes a React component tree to a JSON-safe representation.
 *
 * @param {React.ReactElement} component - React element to serialize
 * @param {SerializeOptions} [options={}] - Serialization options
 * @returns {SerializedComponent} Serialized component representation
 *
 * @example
 * const element = <Button variant="primary">Click me</Button>;
 * const serialized = serializeComponent(element);
 * // { type: 'Button', props: { variant: 'primary' }, children: ['Click me'] }
 */
export function serializeComponent(component, options = {}) {
  if (!isReactElement(component)) {
    throw new Error('serializeComponent: Expected a React element');
  }

  const { includeKeys = false, includeRefs = false, excludeProps = [] } = options;

  const excludedProps = new Set([
    ...DEFAULT_EXCLUDED_PROPS,
    ...excludeProps,
    ...(includeKeys ? [] : ['key']),
    ...(includeRefs ? [] : ['ref']),
  ]);

  const type = getComponentTypeName(component.type);
  const props = {};
  const children = [];

  // Process props
  if (component.props) {
    for (const [key, value] of Object.entries(component.props)) {
      if (excludedProps.has(key)) {
        continue;
      }

      if (key === 'children') {
        // Handle children separately
        continue;
      }

      props[key] = serializePropValue(value);
    }

    // Process children
    const childrenProp = component.props.children;
    if (childrenProp !== undefined && childrenProp !== null) {
      if (Array.isArray(childrenProp)) {
        for (const child of childrenProp) {
          if (isReactElement(child)) {
            children.push(serializeComponent(child, options));
          } else if (child !== null && child !== undefined) {
            children.push(serializePropValue(child));
          }
        }
      } else if (isReactElement(childrenProp)) {
        children.push(serializeComponent(childrenProp, options));
      } else {
        children.push(serializePropValue(childrenProp));
      }
    }
  }

  return {
    type,
    props,
    children,
  };
}

/**
 * Serializes a React component tree to a JSON string.
 *
 * @param {React.ReactElement} component - React element to serialize
 * @param {SerializeOptions & { pretty?: boolean }} [options={}] - Serialization options
 * @returns {string} JSON string representation
 *
 * @example
 * const element = <Button variant="primary">Click me</Button>;
 * const json = serialize(element);
 * // '{"type":"Button","props":{"variant":"primary"},"children":["Click me"]}'
 */
export function serialize(component, options = {}) {
  const { pretty = false, ...serializeOptions } = options;
  const serialized = serializeComponent(component, serializeOptions);
  return pretty ? JSON.stringify(serialized, null, 2) : JSON.stringify(serialized);
}

/**
 * Parses a serialized component string back to a SerializedComponent object.
 *
 * @param {string} serialized - JSON string to parse
 * @returns {SerializedComponent} Parsed component representation
 * @throws {Error} If the string is not valid JSON or not a valid component structure
 *
 * @example
 * const json = '{"type":"Button","props":{"variant":"primary"},"children":["Click me"]}';
 * const parsed = parse(json);
 * // { type: 'Button', props: { variant: 'primary' }, children: ['Click me'] }
 */
export function parse(serialized) {
  if (typeof serialized !== 'string') {
    throw new Error('parse: Expected a string');
  }

  let parsed;
  try {
    parsed = JSON.parse(serialized);
  } catch (error) {
    throw new Error(`parse: Invalid JSON - ${error.message}`);
  }

  if (!isValidSerializedComponent(parsed)) {
    throw new Error('parse: Invalid component structure');
  }

  return parsed;
}

/**
 * Validates that an object is a valid SerializedComponent structure.
 *
 * @param {unknown} obj - Object to validate
 * @returns {boolean} True if valid SerializedComponent
 */
export function isValidSerializedComponent(obj) {
  if (obj === null || typeof obj !== 'object') {
    return false;
  }

  const component = obj;

  // Must have type as string
  if (typeof component.type !== 'string') {
    return false;
  }

  // Must have props as object (can be empty)
  if (component.props === null || typeof component.props !== 'object' || Array.isArray(component.props)) {
    return false;
  }

  // Must have children as array
  if (!Array.isArray(component.children)) {
    return false;
  }

  // Recursively validate children that are objects (serialized components)
  for (const child of component.children) {
    if (child !== null && typeof child === 'object' && !Array.isArray(child)) {
      if (!isValidSerializedComponent(child)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Compares two SerializedComponent structures for equality.
 *
 * @param {SerializedComponent} a - First component
 * @param {SerializedComponent} b - Second component
 * @param {Object} [options={}] - Comparison options
 * @param {boolean} [options.ignoreOrder=false] - Whether to ignore children order
 * @returns {boolean} True if components are structurally equal
 *
 * @example
 * const a = { type: 'Button', props: { variant: 'primary' }, children: [] };
 * const b = { type: 'Button', props: { variant: 'primary' }, children: [] };
 * areEqual(a, b); // true
 */
export function areEqual(a, b, options = {}) {
  const { ignoreOrder = false } = options;

  // Check types
  if (a.type !== b.type) {
    return false;
  }

  // Check props
  const aProps = Object.keys(a.props).sort();
  const bProps = Object.keys(b.props).sort();

  if (aProps.length !== bProps.length) {
    return false;
  }

  for (let i = 0; i < aProps.length; i++) {
    if (aProps[i] !== bProps[i]) {
      return false;
    }
    if (!deepEqual(a.props[aProps[i]], b.props[bProps[i]])) {
      return false;
    }
  }

  // Check children
  if (a.children.length !== b.children.length) {
    return false;
  }

  if (ignoreOrder) {
    // Sort children by type for comparison
    const sortedA = [...a.children].sort(childComparator);
    const sortedB = [...b.children].sort(childComparator);
    for (let i = 0; i < sortedA.length; i++) {
      if (!childrenEqual(sortedA[i], sortedB[i], options)) {
        return false;
      }
    }
  } else {
    for (let i = 0; i < a.children.length; i++) {
      if (!childrenEqual(a.children[i], b.children[i], options)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Comparator for sorting children.
 * @param {unknown} a
 * @param {unknown} b
 * @returns {number}
 */
function childComparator(a, b) {
  const aType = typeof a === 'object' && a !== null && 'type' in a ? a.type : String(a);
  const bType = typeof b === 'object' && b !== null && 'type' in b ? b.type : String(b);
  return String(aType).localeCompare(String(bType));
}

/**
 * Compares two children for equality.
 * @param {unknown} a
 * @param {unknown} b
 * @param {Object} options
 * @returns {boolean}
 */
function childrenEqual(a, b, options) {
  if (isValidSerializedComponent(a) && isValidSerializedComponent(b)) {
    return areEqual(a, b, options);
  }
  return deepEqual(a, b);
}

/**
 * Deep equality check for values.
 * @param {unknown} a
 * @param {unknown} b
 * @returns {boolean}
 */
function deepEqual(a, b) {
  if (a === b) {
    return true;
  }

  if (typeof a !== typeof b) {
    return false;
  }

  if (a === null || b === null) {
    return a === b;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const aKeys = Object.keys(a).sort();
    const bKeys = Object.keys(b).sort();

    if (aKeys.length !== bKeys.length) {
      return false;
    }

    for (let i = 0; i < aKeys.length; i++) {
      if (aKeys[i] !== bKeys[i]) {
        return false;
      }
      if (!deepEqual(a[aKeys[i]], b[bKeys[i]])) {
        return false;
      }
    }
    return true;
  }

  return false;
}

/**
 * Creates a pretty-printed string representation of a component tree.
 *
 * @param {SerializedComponent} component - Serialized component
 * @param {number} [indent=0] - Current indentation level
 * @returns {string} Pretty-printed string
 *
 * @example
 * const serialized = { type: 'Button', props: { variant: 'primary' }, children: ['Click'] };
 * prettyPrint(serialized);
 * // '<Button variant="primary">\n  Click\n</Button>'
 */
export function prettyPrint(component, indent = 0) {
  const spaces = '  '.repeat(indent);
  const { type, props, children } = component;

  // Build props string
  const propsStr = Object.entries(props)
    .map(([key, value]) => {
      if (typeof value === 'string') {
        return `${key}="${value}"`;
      }
      return `${key}={${JSON.stringify(value)}}`;
    })
    .join(' ');

  const openTag = propsStr ? `<${type} ${propsStr}>` : `<${type}>`;

  if (children.length === 0) {
    return `${spaces}${openTag.slice(0, -1)} />`;
  }

  const childrenStr = children
    .map((child) => {
      if (isValidSerializedComponent(child)) {
        return prettyPrint(child, indent + 1);
      }
      return `${'  '.repeat(indent + 1)}${String(child)}`;
    })
    .join('\n');

  return `${spaces}${openTag}\n${childrenStr}\n${spaces}</${type}>`;
}

export default {
  serialize,
  serializeComponent,
  parse,
  isValidSerializedComponent,
  areEqual,
  prettyPrint,
};
