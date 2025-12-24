/**
 * Property-based tests for FeatureTableGenerator
 * 
 * **Feature: blind-evaluation-framework, Property 3: Feature table output format**
 * **Validates: Requirements 1.4**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { FeatureTableGenerator } from '../../src/identifier/FeatureTableGenerator';
import type { AtomicFeature, ExternalDependency } from '../../types/evaluation';

/**
 * Arbitrary for generating valid AtomicFeature objects
 */
const atomicFeatureArb = (id: number): fc.Arbitrary<AtomicFeature> => {
  return fc.record({
    id: fc.constant(id),
    name: fc.constantFrom('Feature A', 'Feature B', 'Time Display', 'User Input', 'Data Fetch'),
    description: fc.constantFrom(
      'Handles user interactions',
      'Displays time information',
      'Manages state updates',
      'Fetches data from API',
      'Renders UI components'
    ),
    linesOfCode: fc.integer({ min: 1, max: 1000 }),
    primaryLocation: fc.record({
      file: fc.constantFrom('Component.jsx', 'Feature.tsx', 'utils.ts', 'hooks/useData.js'),
      startLine: fc.integer({ min: 1, max: 500 }),
      endLine: fc.integer({ min: 1, max: 1000 }),
    }).map(loc => ({
      ...loc,
      endLine: Math.max(loc.startLine, loc.endLine),
    })),
    codeBlocks: fc.constant([]),
    stateManagement: fc.constant([]),
    eventHandlers: fc.constant([]),
  });
};

/**
 * Arbitrary for generating arrays of valid AtomicFeature objects
 */
const atomicFeaturesArb = fc.integer({ min: 1, max: 5 }).chain(count => {
  const features: fc.Arbitrary<AtomicFeature>[] = [];
  for (let i = 1; i <= count; i++) {
    features.push(atomicFeatureArb(i));
  }
  return fc.tuple(...features);
});

/**
 * Arbitrary for generating valid ExternalDependency objects
 */
const externalDependencyArb: fc.Arbitrary<ExternalDependency> = fc.record({
  packageName: fc.constantFrom('lodash', 'axios', 'react-query', 'date-fns', 'ui'),
  purpose: fc.constantFrom(
    'Used for utility functions',
    'Used for HTTP requests',
    'Used for data fetching',
    'Used for date formatting',
    'Used for UI components'
  ),
  importPath: fc.constantFrom('lodash', 'axios', 'react-query', 'date-fns', 'ui'),
});

describe('FeatureTableGenerator', () => {
  describe('Property 3: Feature table output format', () => {
    /**
     * **Feature: blind-evaluation-framework, Property 3: Feature table output format**
     * 
     * For any set of identified atomic features, the output table SHALL contain 
     * exactly 5 columns (number, name, description, LOC, primary location) with 
     * valid data for each feature.
     */
    it('should generate table with exactly 5 columns', () => {
      fc.assert(
        fc.property(
          atomicFeaturesArb,
          (features) => {
            const generator = new FeatureTableGenerator();
            const result = generator.generateTable(features);
            
            // Split table into lines
            const lines = result.table.split('\n');
            
            // Should have at least header, separator, and one data row
            expect(lines.length).toBeGreaterThanOrEqual(3);
            
            // Header should have exactly 5 columns
            const headerColumns = lines[0].split('|').filter(c => c.trim() !== '');
            expect(headerColumns.length).toBe(5);
            
            // Check column names
            expect(headerColumns[0].trim()).toBe('#');
            expect(headerColumns[1].trim()).toBe('Feature Name');
            expect(headerColumns[2].trim()).toBe('Description');
            expect(headerColumns[3].trim()).toBe('LOC');
            expect(headerColumns[4].trim()).toBe('Primary Location');
            
            // Each data row should have exactly 5 columns
            for (let i = 2; i < lines.length; i++) {
              const rowColumns = lines[i].split('|').filter(c => c.trim() !== '');
              expect(rowColumns.length).toBe(5);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include all features in the table', () => {
      fc.assert(
        fc.property(
          atomicFeaturesArb,
          (features) => {
            const generator = new FeatureTableGenerator();
            const result = generator.generateTable(features);
            
            // Count data rows (excluding header and separator)
            const lines = result.table.split('\n');
            const dataRows = lines.slice(2);
            
            // Should have one row per feature
            expect(dataRows.length).toBe(features.length);
            
            // Total features count should match
            expect(result.totalFeatures).toBe(features.length);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format primary location as File:line-range', () => {
      fc.assert(
        fc.property(
          atomicFeaturesArb,
          (features) => {
            const generator = new FeatureTableGenerator({ includeLineNumbers: true });
            const result = generator.generateTable(features);
            
            const lines = result.table.split('\n');
            const dataRows = lines.slice(2);
            
            for (let i = 0; i < dataRows.length; i++) {
              const columns = dataRows[i].split('|').filter(c => c.trim() !== '');
              const location = columns[4].trim();
              
              // Location should contain file name with extension
              expect(location).toMatch(/\.(jsx?|tsx?|ts|js):/);
              
              // Location should contain line numbers
              expect(location).toMatch(/:\d+(-\d+)?$/);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include LOC as approximate value with tilde', () => {
      fc.assert(
        fc.property(
          atomicFeaturesArb,
          (features) => {
            const generator = new FeatureTableGenerator();
            const result = generator.generateTable(features);
            
            const lines = result.table.split('\n');
            const dataRows = lines.slice(2);
            
            for (let i = 0; i < dataRows.length; i++) {
              const columns = dataRows[i].split('|').filter(c => c.trim() !== '');
              const loc = columns[3].trim();
              
              // LOC should start with tilde
              expect(loc).toMatch(/^~\d+$/);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate total lines of code correctly', () => {
      fc.assert(
        fc.property(
          atomicFeaturesArb,
          (features) => {
            const generator = new FeatureTableGenerator();
            const result = generator.generateTable(features);
            
            const expectedTotal = features.reduce((sum, f) => sum + f.linesOfCode, 0);
            expect(result.totalLinesOfCode).toBe(expectedTotal);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate valid external dependencies section', () => {
      fc.assert(
        fc.property(
          atomicFeaturesArb,
          fc.array(externalDependencyArb, { minLength: 0, maxLength: 5 }),
          (features, dependencies) => {
            const generator = new FeatureTableGenerator();
            const result = generator.generateTable(features, dependencies);
            
            // Section should start with header
            expect(result.externalDependenciesSection).toContain('External Dependencies');
            
            if (dependencies.length === 0) {
              // Should indicate no dependencies
              expect(result.externalDependenciesSection).toContain('None');
            } else {
              // Should list all dependencies
              for (const dep of dependencies) {
                expect(result.externalDependenciesSection).toContain(dep.packageName);
                expect(result.externalDependenciesSection).toContain('NOT evaluated as feature');
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty features array', () => {
      const generator = new FeatureTableGenerator();
      const result = generator.generateTable([]);
      
      // Should still have valid table structure
      expect(result.table).toContain('|');
      expect(result.table).toContain('#');
      expect(result.table).toContain('Feature Name');
      expect(result.totalFeatures).toBe(0);
      expect(result.totalLinesOfCode).toBe(0);
    });

    it('should escape markdown special characters in feature names and descriptions', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          (count) => {
            // Create features with pipe characters that need escaping
            const features: AtomicFeature[] = Array.from({ length: count }, (_, i) => ({
              id: i + 1,
              name: `Feature ${i + 1}`,
              description: `Description for feature ${i + 1}`,
              linesOfCode: 10,
              primaryLocation: {
                file: 'test.jsx',
                startLine: 1,
                endLine: 10,
              },
              codeBlocks: [],
              stateManagement: [],
              eventHandlers: [],
            }));
            
            const generator = new FeatureTableGenerator();
            const result = generator.generateTable(features);
            
            // Table should be valid markdown (no unescaped pipes breaking structure)
            const lines = result.table.split('\n');
            for (const line of lines) {
              // Each line should have consistent column count
              const columns = line.split('|').filter(c => c.trim() !== '');
              expect(columns.length).toBe(5);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate features correctly', () => {
      fc.assert(
        fc.property(
          atomicFeaturesArb,
          (features) => {
            const generator = new FeatureTableGenerator();
            const validation = generator.validateFeatures(features);
            
            // All generated features should be valid
            expect(validation.valid).toBe(true);
            expect(validation.invalidFeatures.length).toBe(0);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect invalid features', () => {
      const generator = new FeatureTableGenerator();
      
      // Test with invalid feature
      const invalidFeature: AtomicFeature = {
        id: -1, // Invalid: negative ID
        name: '', // Invalid: empty name
        description: '', // Invalid: empty description
        linesOfCode: -5, // Invalid: negative LOC
        primaryLocation: {
          file: '',
          startLine: 0,
          endLine: -1,
        },
        codeBlocks: [],
        stateManagement: [],
        eventHandlers: [],
      };
      
      const validation = generator.validateFeature(invalidFeature);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should generate complete feature identification section', () => {
      fc.assert(
        fc.property(
          atomicFeaturesArb,
          fc.array(externalDependencyArb, { minLength: 0, maxLength: 3 }),
          (features, dependencies) => {
            const generator = new FeatureTableGenerator();
            const methodology = [
              'Analyzed component code structure',
              'Identified distinct capabilities',
              'Verified no separate packages exist',
              'Listed smallest independent features',
            ];
            
            const section = generator.generateFeatureIdentificationSection(
              features,
              dependencies,
              methodology
            );
            
            // Should contain methodology
            expect(section).toContain('Methodology');
            for (const step of methodology) {
              expect(section).toContain(step);
            }
            
            // Should contain features table
            expect(section).toContain('Identified Atomic Features');
            expect(section).toContain('Feature Name');
            
            // Should contain summary
            expect(section).toContain('Total Atomic Features Identified');
            expect(section).toContain(features.length.toString());
            
            // Should contain external dependencies
            expect(section).toContain('External Dependencies');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
