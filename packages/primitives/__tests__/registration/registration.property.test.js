/**
 * @fileoverview Property-based tests for UI Primitives Registration
 * @module @symphony/primitives/__tests__/registration/registration.property.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';

// Mock UI components before importing registration module
vi.mock('ui', () => ({
  // Layout
  Card: () => null,
  Separator: () => null,
  ResizablePanel: () => null,
  // Interactive
  Button: () => null,
  Input: () => null,
  Checkbox: () => null,
  Switch: () => null,
  Slider: () => null,
  Toggle: () => null,
  RadioGroup: () => null,
  // Complex
  Dialog: () => null,
  DialogContent: () => null,
  DialogDescription: () => null,
  DialogHeader: () => null,
  DialogTitle: () => null,
  DialogTrigger: () => null,
  DropdownMenu: () => null,
  Tabs: () => null,
  Popover: () => null,
  Sheet: () => null,
  Accordion: () => null,
  // Display
  Badge: () => null,
  Avatar: () => null,
  Progress: () => null,
  Skeleton: () => null,
  Alert: () => null,
  // Navigation
  NavigationMenu: () => null,
  Breadcrumb: () => null,
  Pagination: () => null,
  Menubar: () => null,
  ContextMenu: () => null,
  // Form
  Label: () => null,
  Textarea: () => null,
  // Data Display
  Table: () => null,
  ScrollArea: () => null,
  // Select components
  Select: () => null,
  SelectContent: () => null,
  SelectItem: () => null,
  SelectTrigger: () => null,
  SelectValue: () => null,
  // Tooltip components
  Tooltip: () => null,
  TooltipContent: () => null,
  TooltipProvider: () => null,
  TooltipTrigger: () => null,
}));

// Import after mocking
import {
  registerAllUIComponents,
  isFullyRegistered,
  getRegisteredUITypes,
  getExpectedUITypes,
} from '../../src/registration/index.js';
import {
  registerComponent,
  unregisterComponent,
  getRegisteredComponent,
  getRegisteredTypes,
} from '../../src/renderers/PrimitiveRenderer.jsx';

describe('UI Primitives Registration - Property Tests', () => {
  // Clear registrations before each test
  beforeEach(() => {
    const types = getRegisteredTypes();
    types.forEach((type) => unregisterComponent(type));
  });

  /**
   * **Feature: ui-primitives-registration, Property 1: Registration Completeness**
   * For any expected primitive type, after registration, the type should map to a valid React component
   * **Validates: Requirements 1.2, 2.1-2.6, 3.1-3.8, 4.1-4.8, 5.1-5.7, 6.1-6.5, 7.1-7.3, 8.1-8.3**
   */
  describe('Property 1: Registration Completeness', () => {
    it('should register all expected types after calling registerAllUIComponents', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const result = registerAllUIComponents();
          const expectedTypes = getExpectedUITypes();
          const registeredTypes = getRegisteredTypes();

          for (const type of expectedTypes) {
            expect(registeredTypes).toContain(type);
          }
          expect(result.failed).toHaveLength(0);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should return valid components for all registered types', () => {
      registerAllUIComponents();

      fc.assert(
        fc.property(
          fc.constantFrom(...getExpectedUITypes()),
          (type) => {
            const component = getRegisteredComponent(type);
            expect(component).toBeDefined();
            // React components can be functions or objects (forwardRef, memo, etc.)
            expect(['function', 'object'].includes(typeof component)).toBe(true);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * **Feature: ui-primitives-registration, Property 2: Registration Key Validity**
   * For any component registered via the registration module, the registration key
   * should be a non-empty string matching the expected primitive type name
   * **Validates: Requirements 1.3**
   */
  describe('Property 2: Registration Key Validity', () => {
    it('should use non-empty string keys for all registrations', () => {
      registerAllUIComponents();

      fc.assert(
        fc.property(
          fc.constantFrom(...getRegisteredUITypes()),
          (type) => {
            expect(typeof type).toBe('string');
            expect(type.length).toBeGreaterThan(0);
            expect(type.trim()).toBe(type);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use PascalCase naming convention for all types', () => {
      registerAllUIComponents();

      fc.assert(
        fc.property(
          fc.constantFrom(...getExpectedUITypes()),
          (type) => {
            expect(type[0]).toBe(type[0].toUpperCase());
            expect(/^[A-Z]/.test(type)).toBe(true);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: ui-primitives-registration, Property 3: Conflict Handling**
   * For any primitive type that is already registered, when registerAllUIComponents
   * is called with override=false, the existing registration should be preserved
   * **Validates: Requirements 1.5**
   */
  describe('Property 3: Conflict Handling', () => {
    it('should skip already registered types when override=false', () => {
      const mockComponent = () => null;
      registerComponent('Button', mockComponent);

      fc.assert(
        fc.property(fc.constant(null), () => {
          const result = registerAllUIComponents({ override: false, silent: true });
          expect(result.skipped).toContain('Button');
          const registered = getRegisteredComponent('Button');
          expect(registered).toBe(mockComponent);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should include skipped types in result.skipped array', () => {
      const mockComponent = () => null;
      registerComponent('Button', mockComponent);
      registerComponent('Input', mockComponent);

      fc.assert(
        fc.property(fc.constant(null), () => {
          const result = registerAllUIComponents({ override: false, silent: true });
          expect(result.skipped).toContain('Button');
          expect(result.skipped).toContain('Input');
          expect(result.skipped.length).toBeGreaterThanOrEqual(2);
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: ui-primitives-registration, Property 4: Override Behavior**
   * For any primitive type that is already registered, when registerAllUIComponents
   * is called with override=true, the new component should replace the existing registration
   * **Validates: Requirements 1.5**
   */
  describe('Property 4: Override Behavior', () => {
    it('should replace existing registrations when override=true', () => {
      const mockComponent = () => null;
      registerComponent('Button', mockComponent);

      fc.assert(
        fc.property(fc.constant(null), () => {
          const result = registerAllUIComponents({ override: true, silent: true });
          expect(result.registered).toContain('Button');
          expect(result.skipped).not.toContain('Button');
          const registered = getRegisteredComponent('Button');
          expect(registered).not.toBe(mockComponent);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should override all pre-registered types when override=true', () => {
      const mockComponent = () => null;
      const expectedTypes = getExpectedUITypes();
      expectedTypes.forEach((type) => registerComponent(type, mockComponent));

      fc.assert(
        fc.property(fc.constant(null), () => {
          const result = registerAllUIComponents({ override: true, silent: true });
          expect(result.registered.length).toBe(expectedTypes.length);
          expect(result.skipped).toHaveLength(0);
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: ui-primitives-registration, Property 5: Registration Status Accuracy**
   * isFullyRegistered() should return true if and only if all types in
   * getExpectedUITypes() are present in getRegisteredTypes()
   * **Validates: Requirements 1.4, 9.3**
   */
  describe('Property 5: Registration Status Accuracy', () => {
    it('should return false when no components are registered', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          expect(isFullyRegistered()).toBe(false);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should return true after all components are registered', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          registerAllUIComponents();
          expect(isFullyRegistered()).toBe(true);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should return false when some components are missing', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          (removeCount) => {
            registerAllUIComponents();
            const expectedTypes = getExpectedUITypes();
            const typesToRemove = expectedTypes.slice(0, removeCount);
            typesToRemove.forEach((type) => unregisterComponent(type));
            expect(isFullyRegistered()).toBe(false);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accurately reflect registration status', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          (shouldRegister) => {
            if (shouldRegister) {
              registerAllUIComponents();
            }
            const expectedTypes = getExpectedUITypes();
            const registeredTypes = getRegisteredTypes();
            const allRegistered = expectedTypes.every((type) =>
              registeredTypes.includes(type)
            );
            expect(isFullyRegistered()).toBe(allRegistered);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional property tests for registration result consistency
   */
  describe('Registration Result Consistency', () => {
    it('should have consistent result arrays (no duplicates)', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const result = registerAllUIComponents();
          expect(new Set(result.registered).size).toBe(result.registered.length);
          expect(new Set(result.skipped).size).toBe(result.skipped.length);
          expect(new Set(result.failed).size).toBe(result.failed.length);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should have mutually exclusive result arrays', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const result = registerAllUIComponents();
          const allTypes = [
            ...result.registered,
            ...result.skipped,
            ...result.failed,
          ];
          expect(new Set(allTypes).size).toBe(allTypes.length);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should account for all expected types in result', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const result = registerAllUIComponents();
          const expectedTypes = getExpectedUITypes();
          const totalProcessed =
            result.registered.length +
            result.skipped.length +
            result.failed.length;
          expect(totalProcessed).toBe(expectedTypes.length);
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });
});
