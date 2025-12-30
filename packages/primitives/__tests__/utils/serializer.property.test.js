/**
 * @fileoverview Property-based tests for component tree serialization
 * @module @symphony/primitives/__tests__/utils/serializer.property.test
 *
 * Tests the serialization round-trip property: serialize -> parse -> areEqual
 *
 * @see Requirements 8.1, 8.2, 8.3
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  serialize,
  serializeComponent,
  parse,
  isValidSerializedComponent,
  areEqual,
  prettyPrint,
} from '../../src/utils/serializer.js';

// ============================================
// Arbitraries for generating test data
// ============================================

/**
 * Arbitrary for generating valid component type names.
 */
const componentTypeArb = fc.constantFrom(
  'Button',
  'Text',
  'Box',
  'Flex',
  'Grid',
  'Card',
  'Alert',
  'Input',
  'Select',
  'Checkbox',
  'div',
  'span',
  'p',
  'h1',
  'h2',
  'h3'
);

/**
 * Arbitrary for generating valid prop values (JSON-serializable).
 */
const propValueArb = fc.oneof(
  fc.string(),
  fc.integer(),
  fc.boolean(),
  fc.constant(null),
  fc.array(fc.oneof(fc.string(), fc.integer(), fc.boolean()), { maxLength: 5 }),
  fc.dictionary(fc.string().filter((s) => s.length > 0 && /^[a-zA-Z]/.test(s)), fc.oneof(fc.string(), fc.integer(), fc.boolean()), { maxKeys: 3 })
);

/**
 * Arbitrary for generating valid prop names.
 */
const propNameArb = fc.constantFrom(
  'variant',
  'size',
  'color',
  'disabled',
  'className',
  'id',
  'label',
  'placeholder',
  'value',
  'type',
  'onClick',
  'onChange'
);

/**
 * Arbitrary for generating props objects.
 */
const propsArb = fc.dictionary(propNameArb, propValueArb, { maxKeys: 5 });

/**
 * Arbitrary for generating text children.
 */
const textChildArb = fc.string({ minLength: 0, maxLength: 50 });

/**
 * Recursive arbitrary for generating SerializedComponent trees.
 */
const serializedComponentArb = fc.letrec((tie) => ({
  component: fc.record({
    type: componentTypeArb,
    props: propsArb,
    children: fc.array(
      fc.oneof(
        { weight: 3, arbitrary: textChildArb },
        { weight: 1, arbitrary: tie('component') }
      ),
      { maxLength: 3 }
    ),
  }),
})).component;

/**
 * Arbitrary for generating simple React elements (without nested children).
 */
const simpleReactElementArb = fc.tuple(componentTypeArb, propsArb, fc.array(textChildArb, { maxLength: 3 })).map(
  ([type, props, children]) => {
    if (children.length === 0) {
      return React.createElement(type, props);
    }
    if (children.length === 1) {
      return React.createElement(type, props, children[0]);
    }
    return React.createElement(type, props, ...children);
  }
);

// ============================================
// Property Tests
// ============================================

describe('Component Tree Serialization', () => {
  /**
   * **Feature: ui-components-migration, Property 17: Component tree serialization round-trip**
   * For any valid UI component tree, serializing then parsing should produce an
   * equivalent component structure with preserved types and props.
   * **Validates: Requirements 8.1, 8.2, 8.3**
   */
  describe('Property 17: Component tree serialization round-trip', () => {
    it('should produce valid JSON when serializing any React element', () => {
      fc.assert(
        fc.property(simpleReactElementArb, (element) => {
          const serialized = serialize(element);

          // Should be valid JSON
          expect(() => JSON.parse(serialized)).not.toThrow();

          // Should be a non-empty string
          expect(typeof serialized).toBe('string');
          expect(serialized.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve component type through serialize/parse round-trip', () => {
      fc.assert(
        fc.property(simpleReactElementArb, (element) => {
          const serialized = serialize(element);
          const parsed = parse(serialized);

          // Type should be preserved
          const originalSerialized = serializeComponent(element);
          expect(parsed.type).toBe(originalSerialized.type);
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve props through serialize/parse round-trip', () => {
      fc.assert(
        fc.property(simpleReactElementArb, (element) => {
          const serialized = serialize(element);
          const parsed = parse(serialized);

          // Props should be preserved (excluding functions which become '[Function]')
          const originalSerialized = serializeComponent(element);
          expect(parsed.props).toEqual(originalSerialized.props);
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve children through serialize/parse round-trip', () => {
      fc.assert(
        fc.property(simpleReactElementArb, (element) => {
          const serialized = serialize(element);
          const parsed = parse(serialized);

          // Children should be preserved
          const originalSerialized = serializeComponent(element);
          expect(parsed.children).toEqual(originalSerialized.children);
        }),
        { numRuns: 100 }
      );
    });

    it('should produce structurally equal components through round-trip', () => {
      fc.assert(
        fc.property(simpleReactElementArb, (element) => {
          const serialized = serialize(element);
          const parsed = parse(serialized);
          const originalSerialized = serializeComponent(element);

          // Should be structurally equal
          expect(areEqual(originalSerialized, parsed)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle SerializedComponent objects through round-trip', () => {
      fc.assert(
        fc.property(serializedComponentArb, (component) => {
          const serialized = JSON.stringify(component);
          const parsed = parse(serialized);

          // Should be structurally equal
          expect(areEqual(component, parsed)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('isValidSerializedComponent', () => {
    it('should return true for valid SerializedComponent structures', () => {
      fc.assert(
        fc.property(serializedComponentArb, (component) => {
          expect(isValidSerializedComponent(component)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should return false for invalid structures', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(null),
            fc.constant(undefined),
            fc.string(),
            fc.integer(),
            fc.array(fc.string()),
            fc.record({ type: fc.integer() }), // type should be string
            fc.record({ type: fc.string(), props: fc.string() }), // props should be object
            fc.record({ type: fc.string(), props: fc.dictionary(fc.string(), fc.string()), children: fc.string() }) // children should be array
          ),
          (invalid) => {
            expect(isValidSerializedComponent(invalid)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('areEqual', () => {
    it('should return true for identical SerializedComponent structures', () => {
      fc.assert(
        fc.property(serializedComponentArb, (component) => {
          // Deep clone the component
          const clone = JSON.parse(JSON.stringify(component));
          expect(areEqual(component, clone)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should return false for different types', () => {
      fc.assert(
        fc.property(
          serializedComponentArb,
          componentTypeArb.filter((t) => t !== 'Button'),
          (component, differentType) => {
            const modified = { ...component, type: differentType };
            if (component.type !== differentType) {
              expect(areEqual(component, modified)).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return false for different props', () => {
      fc.assert(
        fc.property(serializedComponentArb, fc.string(), (component, extraValue) => {
          const modified = {
            ...component,
            props: { ...component.props, extraProp: extraValue },
          };
          expect(areEqual(component, modified)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should return false for different children count', () => {
      fc.assert(
        fc.property(serializedComponentArb, textChildArb, (component, extraChild) => {
          const modified = {
            ...component,
            children: [...component.children, extraChild],
          };
          expect(areEqual(component, modified)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('prettyPrint', () => {
    it('should produce a string representation for any SerializedComponent', () => {
      fc.assert(
        fc.property(serializedComponentArb, (component) => {
          const printed = prettyPrint(component);

          // Should be a non-empty string
          expect(typeof printed).toBe('string');
          expect(printed.length).toBeGreaterThan(0);

          // Should contain the component type
          expect(printed).toContain(component.type);
        }),
        { numRuns: 100 }
      );
    });

    it('should include props in the output', () => {
      fc.assert(
        fc.property(
          fc.record({
            type: componentTypeArb,
            props: fc.record({ variant: fc.constantFrom('primary', 'secondary') }),
            children: fc.constant([]),
          }),
          (component) => {
            const printed = prettyPrint(component);

            // Should contain the prop name
            expect(printed).toContain('variant');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use self-closing tags for components without children', () => {
      fc.assert(
        fc.property(
          fc.record({
            type: componentTypeArb,
            props: propsArb,
            children: fc.constant([]),
          }),
          (component) => {
            const printed = prettyPrint(component);

            // Should use self-closing tag
            expect(printed).toContain('/>');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('serialize options', () => {
    it('should produce pretty JSON when pretty option is true', () => {
      fc.assert(
        fc.property(simpleReactElementArb, (element) => {
          const pretty = serialize(element, { pretty: true });
          const compact = serialize(element, { pretty: false });

          // Pretty should be longer due to whitespace
          expect(pretty.length).toBeGreaterThanOrEqual(compact.length);

          // Pretty should contain newlines
          expect(pretty).toContain('\n');
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('error handling', () => {
    it('should throw for invalid JSON in parse', () => {
      fc.assert(
        fc.property(
          fc.string().filter((s) => {
            try {
              JSON.parse(s);
              return false;
            } catch {
              return true;
            }
          }),
          (invalidJson) => {
            expect(() => parse(invalidJson)).toThrow('Invalid JSON');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should throw for non-string input to parse', () => {
      fc.assert(
        fc.property(
          fc.oneof(fc.integer(), fc.boolean(), fc.constant(null), fc.constant(undefined), fc.array(fc.string())),
          (nonString) => {
            expect(() => parse(nonString)).toThrow('Expected a string');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should throw for non-React element input to serializeComponent', () => {
      fc.assert(
        fc.property(
          fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null), fc.dictionary(fc.string(), fc.string())),
          (nonElement) => {
            expect(() => serializeComponent(nonElement)).toThrow('Expected a React element');
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
