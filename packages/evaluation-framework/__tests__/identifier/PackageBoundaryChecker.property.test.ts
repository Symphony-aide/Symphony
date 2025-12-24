/**
 * Property-based tests for PackageBoundaryChecker
 * 
 * **Feature: blind-evaluation-framework, Property 2: Package boundary check correctness**
 * **Validates: Requirements 1.2**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { PackageBoundaryChecker, InMemoryFileSystem } from '../../src/identifier/PackageBoundaryChecker';

/**
 * Known Symphony packages for testing
 */
const SYMPHONY_PACKAGES = [
  'ui',
  'activity-bar',
  'code-editor',
  'command-palette',
  'commands',
  'file-explorer',
  'header',
  'mode-switcher',
  'musical-background',
  'notification-center',
  'outlineview',
  'quick-action-card',
  'settings',
  'statusbar',
  'syntax-highlighting',
  'tab-bar',
  'terminal',
  'welcome-screen',
  'primitives',
  'shared',
  'features',
];

/**
 * External npm packages for testing
 */
const EXTERNAL_NPM_PACKAGES = [
  'react',
  'react-dom',
  'lodash',
  'axios',
  'date-fns',
  'lucide-react',
  'clsx',
  'tailwind-merge',
  'jotai',
];

describe('PackageBoundaryChecker', () => {
  describe('Property 2: Package boundary check correctness', () => {
    /**
     * **Feature: blind-evaluation-framework, Property 2: Package boundary check correctness**
     * 
     * For any capability identified during feature analysis, if that capability 
     * exists as a separate package in the codebase (verified by checking packages/ 
     * directory structure), the system SHALL exclude it from the atomic features 
     * list and document it as an external dependency.
     */
    it('should identify known Symphony packages as separate packages', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...SYMPHONY_PACKAGES),
          (packageName) => {
            const checker = new PackageBoundaryChecker();
            const result = checker.checkCapability(packageName, packageName);
            
            // Known Symphony packages should be identified as separate packages
            expect(result.isSeparatePackage).toBe(true);
            expect(result.capability).toBe(packageName);
            expect(result.reason).toBeTruthy();
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should identify scoped @symphony packages as separate packages', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...SYMPHONY_PACKAGES),
          (packageName) => {
            const checker = new PackageBoundaryChecker();
            const scopedImport = `@symphony/${packageName}`;
            const result = checker.checkCapability(packageName, scopedImport);
            
            // Scoped Symphony packages should be identified as separate packages
            expect(result.isSeparatePackage).toBe(true);
            expect(result.capability).toBe(packageName);
            expect(result.packagePath).toBeTruthy();
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should identify external npm packages as separate packages', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...EXTERNAL_NPM_PACKAGES),
          (packageName) => {
            const checker = new PackageBoundaryChecker();
            const result = checker.checkCapability(packageName, packageName);
            
            // External npm packages should be identified as separate packages
            expect(result.isSeparatePackage).toBe(true);
            expect(result.capability).toBe(packageName);
            expect(result.reason).toContain('external');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should identify relative imports as NOT separate packages', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant('./utils'),
            fc.constant('./components/Button'),
            fc.constant('../shared/helpers'),
            fc.constant('./hooks/useFeature'),
            fc.constant('../types'),
          ),
          (relativeImport) => {
            const checker = new PackageBoundaryChecker();
            const result = checker.checkCapability('SomeCapability', relativeImport);
            
            // Relative imports should NOT be identified as separate packages
            expect(result.isSeparatePackage).toBe(false);
            expect(result.reason).toContain('relative');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return valid PackageBoundaryCheck structure for any input', () => {
      // Generate valid identifier-like strings
      const identifierArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9-]*$/);
      
      fc.assert(
        fc.property(
          identifierArb,
          fc.oneof(
            identifierArb,
            fc.constant('./local'),
            fc.constant('../parent'),
            fc.constant('@scope/package'),
          ),
          (capability, importSource) => {
            const checker = new PackageBoundaryChecker();
            const result = checker.checkCapability(capability, importSource);
            
            // Result should always have required properties
            expect(result.capability).toBe(capability);
            expect(typeof result.isSeparatePackage).toBe('boolean');
            expect(result.reason).toBeTruthy();
            expect(typeof result.reason).toBe('string');
            
            // packagePath should only be present if it's a separate package
            if (result.isSeparatePackage && result.packagePath) {
              expect(typeof result.packagePath).toBe('string');
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly filter dependencies into separate and embedded', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              packageName: fc.oneof(
                fc.constantFrom(...SYMPHONY_PACKAGES),
                fc.constantFrom(...EXTERNAL_NPM_PACKAGES),
                fc.constant('localModule'),
              ),
              purpose: fc.string({ minLength: 1, maxLength: 50 }),
              importPath: fc.oneof(
                fc.constantFrom(...SYMPHONY_PACKAGES),
                fc.constantFrom(...EXTERNAL_NPM_PACKAGES),
                fc.constant('./local'),
              ),
            }),
            { minLength: 0, maxLength: 10 }
          ),
          (dependencies) => {
            const checker = new PackageBoundaryChecker();
            const result = checker.filterDependencies(dependencies);
            
            // All dependencies should be categorized
            expect(result.separatePackages.length + result.embeddedCapabilities.length)
              .toBe(dependencies.length);
            
            // Separate packages should all be identified as separate
            for (const pkg of result.separatePackages) {
              const check = checker.checkCapability(pkg.packageName, pkg.importPath);
              expect(check.isSeparatePackage).toBe(true);
            }
            
            // Embedded capabilities should all be identified as NOT separate
            for (const cap of result.embeddedCapabilities) {
              const check = checker.checkCapability(cap.packageName, cap.importPath);
              expect(check.isSeparatePackage).toBe(false);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle scoped external packages correctly', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('@radix-ui/react-dialog', '@radix-ui/react-popover', '@types/node'),
          (scopedPackage) => {
            const checker = new PackageBoundaryChecker();
            const result = checker.checkCapability('SomeComponent', scopedPackage);
            
            // Scoped external packages (not @symphony) should be separate packages
            expect(result.isSeparatePackage).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow adding custom known packages', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-z][a-z0-9-]*$/),
          fc.stringMatching(/^packages\/[a-z][a-z0-9-]*$/),
          (packageName, packagePath) => {
            const checker = new PackageBoundaryChecker();
            
            // Before adding, it might not be recognized
            const beforeResult = checker.checkCapability(packageName, packageName);
            
            // Add the custom package
            checker.addKnownPackage(packageName, packagePath);
            
            // After adding, it should be recognized
            const afterResult = checker.checkCapability(packageName, packageName);
            expect(afterResult.isSeparatePackage).toBe(true);
            expect(afterResult.packagePath).toBe(packagePath);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain consistency across multiple checks of the same capability', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...SYMPHONY_PACKAGES, ...EXTERNAL_NPM_PACKAGES, './local'),
          fc.integer({ min: 2, max: 5 }),
          (importSource, checkCount) => {
            const checker = new PackageBoundaryChecker();
            const results: boolean[] = [];
            
            // Check the same capability multiple times
            for (let i = 0; i < checkCount; i++) {
              const result = checker.checkCapability('TestCapability', importSource);
              results.push(result.isSeparatePackage);
            }
            
            // All results should be the same
            const allSame = results.every(r => r === results[0]);
            expect(allSame).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
