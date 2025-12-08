/**
 * @fileoverview Core utility functions for the Primitives package
 * @module @symphony/primitives/core/utils
 */

/**
 * Generates a unique identifier for primitives.
 * Uses crypto.randomUUID when available, falls back to a custom implementation.
 *
 * @returns {string} A unique identifier string
 */
export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Validates that a value is a non-empty string
 *
 * @param {*} value - The value to validate
 * @returns {boolean} True if value is a non-empty string
 */
export function isNonEmptyString(value) {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Validates that a value is a plain object
 *
 * @param {*} value - The value to validate
 * @returns {boolean} True if value is a plain object
 */
export function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Validates that a value is an array
 *
 * @param {*} value - The value to validate
 * @returns {boolean} True if value is an array
 */
export function isArray(value) {
  return Array.isArray(value);
}

/**
 * Deep clones a value (for serializable data only)
 *
 * @template T
 * @param {T} value - The value to clone
 * @returns {T} A deep clone of the value
 */
export function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}
