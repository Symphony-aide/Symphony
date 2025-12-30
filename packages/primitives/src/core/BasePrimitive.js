/**
 * @fileoverview BasePrimitive class - Foundation for all Symphony UI primitives
 * @module @symphony/primitives/core/BasePrimitive
 */

import { generateId } from './utils.js';

/**
 * @typedef {import('./types.js').PrimitiveProps} PrimitiveProps
 * @typedef {import('./types.js').RenderStrategy} RenderStrategy
 * @typedef {import('./types.js').ComponentTree} ComponentTree
 */

/**
 * Base class for all primitives in Symphony's UI extensibility system.
 * Provides a uniform interface for inspection and modification of UI elements.
 */
export class BasePrimitive {
  /** @type {string} Unique identifier for this primitive */
  id;

  /** @type {string} Type name of this primitive */
  type;

  /** @type {PrimitiveProps} Properties of this primitive */
  props;

  /** @type {BasePrimitive[]} Child primitives */
  children;

  /** @type {BasePrimitive | null} Parent primitive reference */
  parent;

  /** @type {RenderStrategy} How this primitive should be rendered */
  renderStrategy;

  /** @type {string | undefined} WASM module path for WASM-rendered primitives */
  wasmModule;

  /** @type {boolean} Whether this primitive is a leaf node (no children rendered) */
  isLeafNode;

  /** @type {boolean} Whether to use direct rendering (bypass primitive wrapper) */
  renderDirect;

  /**
   * Creates a new BasePrimitive instance.
   *
   * @param {string} type - The type name of this primitive
   * @param {PrimitiveProps} [props={}] - Initial properties
   */
  constructor(type, props = {}) {
    this.id = generateId();
    this.type = type;
    this.props = { ...props };
    this.children = [];
    this.parent = null;
    this.renderStrategy = 'react';
    this.wasmModule = undefined;
    this.isLeafNode = false;
    this.renderDirect = false;
  }


  /**
   * Appends a child primitive to this primitive's children array.
   * Updates the child's parent reference to this primitive.
   *
   * @param {BasePrimitive} child - The child primitive to append
   * @returns {BasePrimitive} This primitive (for chaining)
   */
  appendChild(child) {
    if (!(child instanceof BasePrimitive)) {
      throw new Error('Child must be a BasePrimitive instance');
    }
    child.parent = this;
    this.children.push(child);
    return this;
  }

  /**
   * Removes a child primitive from this primitive's children array.
   * Clears the child's parent reference.
   *
   * @param {BasePrimitive} child - The child primitive to remove
   * @returns {boolean} True if the child was found and removed
   */
  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      this.children.splice(index, 1);
      child.parent = null;
      return true;
    }
    return false;
  }

  /**
   * Inserts a child primitive at a specific index in the children array.
   * Updates the child's parent reference to this primitive.
   *
   * @param {BasePrimitive} child - The child primitive to insert
   * @param {number} index - The index at which to insert the child
   * @returns {BasePrimitive} This primitive (for chaining)
   */
  insertChild(child, index) {
    if (!(child instanceof BasePrimitive)) {
      throw new Error('Child must be a BasePrimitive instance');
    }
    child.parent = this;
    // Clamp index to valid range
    const clampedIndex = Math.max(0, Math.min(index, this.children.length));
    this.children.splice(clampedIndex, 0, child);
    return this;
  }

  /**
   * Finds a child primitive that matches the given predicate.
   *
   * @param {function(BasePrimitive): boolean} predicate - Function to test each child
   * @returns {BasePrimitive | null} The first matching child, or null if not found
   */
  findChild(predicate) {
    for (const child of this.children) {
      if (predicate(child)) {
        return child;
      }
    }
    return null;
  }

  /**
   * Recursively finds a descendant primitive that matches the given predicate.
   *
   * @param {function(BasePrimitive): boolean} predicate - Function to test each descendant
   * @returns {BasePrimitive | null} The first matching descendant, or null if not found
   */
  findDescendant(predicate) {
    for (const child of this.children) {
      if (predicate(child)) {
        return child;
      }
      const found = child.findDescendant(predicate);
      if (found) {
        return found;
      }
    }
    return null;
  }

  /**
   * Gets the path from the root to this primitive.
   * Returns an array of type strings representing the path.
   *
   * @returns {string[]} Array of type strings from root to this node
   */
  getPath() {
    const path = [];
    /** @type {BasePrimitive | null} */
    let current = this;

    while (current !== null) {
      path.unshift(current.type);
      current = current.parent;
    }

    return path;
  }

  /**
   * Serializes this primitive and its descendants to a ComponentTree JSON structure.
   *
   * @returns {ComponentTree} The serialized component tree
   */
  toTree() {
    return {
      id: this.id,
      type: this.type,
      props: { ...this.props },
      renderStrategy: this.renderStrategy,
      children: this.children.map((child) => child.toTree()),
    };
  }

  /**
   * Reconstructs a primitive hierarchy from a ComponentTree JSON structure.
   *
   * @param {ComponentTree} tree - The serialized component tree
   * @returns {BasePrimitive} The reconstructed primitive
   */
  static fromTree(tree) {
    const primitive = new BasePrimitive(tree.type, tree.props);
    // Only override the generated id if tree.id is provided
    if (tree.id) {
      primitive.id = tree.id;
    }
    primitive.renderStrategy = tree.renderStrategy || 'react';

    for (const childTree of tree.children || []) {
      const child = BasePrimitive.fromTree(childTree);
      primitive.appendChild(child);
    }

    return primitive;
  }

  /**
   * Converts the primitive tree to a readable string representation.
   *
   * @param {number} [indent=0] - Current indentation level
   * @returns {string} Formatted string representation
   */
  toPrettyString(indent = 0) {
    const spaces = '  '.repeat(indent);
    const propsStr = Object.keys(this.props).length > 0
      ? ` ${JSON.stringify(this.props)}`
      : '';

    let result = `${spaces}<${this.type}${propsStr}>`;

    if (this.children.length > 0) {
      result += '\n';
      for (const child of this.children) {
        result += child.toPrettyString(indent + 1) + '\n';
      }
      result += `${spaces}</${this.type}>`;
    } else {
      result += `</${this.type}>`;
    }

    return result;
  }
}
