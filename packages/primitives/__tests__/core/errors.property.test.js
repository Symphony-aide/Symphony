/**
 * @fileoverview Property-based tests for error path resolution
 *
 * **Feature: primitives-package, Property 21: Error Path Resolution**
 *
 * For any invalid path (non-existent component or invalid path segment),
 * the error thrown SHALL contain the component name and/or the invalid path
 * for debugging purposes.
 *
 * **Validates: Requirements 14.2, 14.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ComponentRegistry } from '../../src/registry/ComponentRegistry.js';
import { BasePrimitive } from '../../src/core/BasePrimitive.js';

// Arbitrary generators
const componentNameArb = fc.stringMatching(/^[a-z][a-zA-Z0-9-]*$/);
const primitiveTypeArb = fc.stringMatching(/^[A-Z][a-zA-Z0-9]*$/);

const primitivePropsArb = fc.dictionary(
  fc.stringMatching(/^[a-z][a-zA-Z0-9]*$/),
  fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null)),
  { maxKeys: 5 }
);

// Generator for a tree of primitives with configurable depth
const primitiveTreeArb = (maxDepth = 3) => {
  const leafArb = fc.tuple(primitiveTypeArb, primitivePropsArb).map(([type, props]) => {
    return new BasePrimitive(type, props);
  });

  const nodeArb = (depth) => {
    if (depth <= 0) {
      return leafArb;
    }
    return fc
      .tuple(
        primitiveTypeArb,
        primitivePropsArb,
        fc.array(nodeArb(depth - 1), { minLength: 0, maxLength: 3 })
      )
      .map(([type, props, children]) => {
        const node = new BasePrimitive(type, props);
        for (const child of children) {
          node.appendChild(child);
        }
        return node;
      });
  };

  return nodeArb(maxDepth);
};


/**
 * **Feature: primitives-package, Property 21: Error Path Resolution**
 *
 * For any invalid path (non-existent component or invalid path segment),
 * the error thrown SHALL contain the component name and/or the invalid path
 * for debugging purposes.
 *
 * **Validates: Requirements 14.2, 14.3**
 */
describe('Property 21: Error Path Resolution', () => {
  describe('Path resolution errors contain component name and path', () => {
    it('should include component name in error when modifying non-existent component', () => {
      fc.assert(
        fc.property(componentNameArb, primitiveTypeArb, (name, type) => {
          const registry = new ComponentRegistry();
          // Don't register any component

          let thrownError = null;
          try {
            registry.modifyComponent(name, [type], { props: { test: 'value' } });
          } catch (error) {
            thrownError = error;
          }

          expect(thrownError).not.toBeNull();
          expect(thrownError.message).toContain(name);
        }),
        { numRuns: 100 }
      );
    });

    it('should include path in error when modifying with invalid path', () => {
      fc.assert(
        fc.property(
          componentNameArb,
          primitiveTypeArb,
          primitiveTypeArb,
          (name, rootType, invalidChildType) => {
            const registry = new ComponentRegistry();
            const root = new BasePrimitive(rootType);
            registry.registerComponent(name, root);

            const invalidPath = [rootType, `Invalid_${invalidChildType}`];
            let thrownError = null;
            try {
              registry.modifyComponent(name, invalidPath, { props: { test: 'value' } });
            } catch (error) {
              thrownError = error;
            }

            expect(thrownError).not.toBeNull();
            expect(thrownError.message).toContain(name);
            // The error message should contain the path information
            expect(thrownError.message).toContain(invalidPath.join('/'));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include component name in error when inserting at invalid parent path', () => {
      fc.assert(
        fc.property(
          componentNameArb,
          primitiveTypeArb,
          primitiveTypeArb,
          primitiveTypeArb,
          (name, rootType, invalidParentType, newChildType) => {
            const registry = new ComponentRegistry();
            const root = new BasePrimitive(rootType);
            registry.registerComponent(name, root);

            const invalidPath = [rootType, `Invalid_${invalidParentType}`];
            const newChild = new BasePrimitive(newChildType);

            let thrownError = null;
            try {
              registry.insertPrimitive(name, invalidPath, newChild);
            } catch (error) {
              thrownError = error;
            }

            expect(thrownError).not.toBeNull();
            expect(thrownError.message).toContain(name);
            expect(thrownError.message).toContain(invalidPath.join('/'));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include component name in error when removing at invalid path', () => {
      fc.assert(
        fc.property(
          componentNameArb,
          primitiveTypeArb,
          primitiveTypeArb,
          (name, rootType, invalidChildType) => {
            const registry = new ComponentRegistry();
            const root = new BasePrimitive(rootType);
            registry.registerComponent(name, root);

            const invalidPath = [rootType, `Invalid_${invalidChildType}`];

            let thrownError = null;
            try {
              registry.removePrimitive(name, invalidPath);
            } catch (error) {
              thrownError = error;
            }

            expect(thrownError).not.toBeNull();
            expect(thrownError.message).toContain(name);
            expect(thrownError.message).toContain(invalidPath.join('/'));
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Error messages are descriptive for debugging', () => {
    it('should provide descriptive error for deeply nested invalid paths', () => {
      fc.assert(
        fc.property(
          componentNameArb,
          fc.array(primitiveTypeArb, { minLength: 2, maxLength: 5 }),
          primitiveTypeArb,
          (name, validTypes, invalidType) => {
            const registry = new ComponentRegistry();

            // Build a valid chain of primitives
            const nodes = validTypes.map((type) => new BasePrimitive(type));
            for (let i = 0; i < nodes.length - 1; i++) {
              nodes[i].appendChild(nodes[i + 1]);
            }
            registry.registerComponent(name, nodes[0]);

            // Try to access an invalid path beyond the valid chain
            const invalidPath = [...validTypes, `Invalid_${invalidType}`];

            let thrownError = null;
            try {
              registry.modifyComponent(name, invalidPath, { props: { test: 'value' } });
            } catch (error) {
              thrownError = error;
            }

            expect(thrownError).not.toBeNull();
            expect(thrownError.message).toContain(name);
            expect(thrownError.message).toContain(invalidPath.join('/'));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide descriptive error for invalid array index paths', () => {
      fc.assert(
        fc.property(
          componentNameArb,
          primitiveTypeArb,
          primitiveTypeArb,
          fc.integer({ min: 1, max: 3 }),
          fc.integer({ min: 10, max: 100 }),
          (name, parentType, childType, numChildren, outOfBoundsIndex) => {
            const registry = new ComponentRegistry();
            const parent = new BasePrimitive(parentType);

            // Add some children
            for (let i = 0; i < numChildren; i++) {
              parent.appendChild(new BasePrimitive(childType));
            }
            registry.registerComponent(name, parent);

            // Try to access an out-of-bounds index
            const invalidPath = [parentType, `${childType}[${outOfBoundsIndex}]`];

            let thrownError = null;
            try {
              registry.modifyComponent(name, invalidPath, { props: { test: 'value' } });
            } catch (error) {
              thrownError = error;
            }

            expect(thrownError).not.toBeNull();
            expect(thrownError.message).toContain(name);
            expect(thrownError.message).toContain(invalidPath.join('/'));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide descriptive error when root type does not match', () => {
      fc.assert(
        fc.property(
          componentNameArb,
          primitiveTypeArb,
          primitiveTypeArb,
          (name, actualRootType, wrongRootType) => {
            // Ensure the types are different
            fc.pre(actualRootType !== wrongRootType);

            const registry = new ComponentRegistry();
            const root = new BasePrimitive(actualRootType);
            registry.registerComponent(name, root);

            // Try to access with wrong root type
            const invalidPath = [wrongRootType];

            let thrownError = null;
            try {
              registry.modifyComponent(name, invalidPath, { props: { test: 'value' } });
            } catch (error) {
              thrownError = error;
            }

            expect(thrownError).not.toBeNull();
            expect(thrownError.message).toContain(name);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Non-existent component errors', () => {
    it('should include component name when component does not exist for modification', () => {
      fc.assert(
        fc.property(
          componentNameArb,
          primitiveTypeArb,
          primitivePropsArb,
          (name, type, props) => {
            const registry = new ComponentRegistry();
            // Registry is empty - no components registered

            let thrownError = null;
            try {
              registry.modifyComponent(name, [type], { props });
            } catch (error) {
              thrownError = error;
            }

            expect(thrownError).not.toBeNull();
            expect(thrownError.message).toContain(name);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include component name when component does not exist for insertion', () => {
      fc.assert(
        fc.property(componentNameArb, primitiveTypeArb, primitiveTypeArb, (name, parentType, childType) => {
          const registry = new ComponentRegistry();
          // Registry is empty - no components registered

          const newChild = new BasePrimitive(childType);

          let thrownError = null;
          try {
            registry.insertPrimitive(name, [parentType], newChild);
          } catch (error) {
            thrownError = error;
          }

          expect(thrownError).not.toBeNull();
          expect(thrownError.message).toContain(name);
        }),
        { numRuns: 100 }
      );
    });

    it('should include component name when component does not exist for removal', () => {
      fc.assert(
        fc.property(componentNameArb, primitiveTypeArb, primitiveTypeArb, (name, parentType, childType) => {
          const registry = new ComponentRegistry();
          // Registry is empty - no components registered

          let thrownError = null;
          try {
            registry.removePrimitive(name, [parentType, childType]);
          } catch (error) {
            thrownError = error;
          }

          expect(thrownError).not.toBeNull();
          expect(thrownError.message).toContain(name);
        }),
        { numRuns: 100 }
      );
    });
  });
});
