/**
 * Property-based tests for table format validity
 * 
 * **Feature: blind-evaluation-framework, Property 28: Table format validity**
 * **Validates: Requirements 12.2**
 * 
 * For any generated markdown table, the table SHALL use pipe-delimited format
 * with consistent column headers matching the specification.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { MarkdownSerializer } from '../../src/serialization/MarkdownSerializer';
import type { AgreementDocument } from '../../types/documents';
import type {
  CompletenessEvaluation,
  CodeQualityEvaluation,
  DocumentationEvaluation,
  ReliabilityEvaluation,
  PerformanceEvaluation,
  IntegrationEvaluation,
  MaintenanceEvaluation,
  StressCollapseEvaluation,
  FeatureEvaluation,
  FeatureIsolationClassification,
  ModificationEaseClassification,
  TestabilityClassification,
} from '../../types/dimensions';
import type { AtomicFeature, CodeEvidence, ExternalDependency } from '../../types/evaluation';

// ============================================================================
// Arbitrary Generators (reused from serialization.property.test.ts)
// ============================================================================

/**
 * Generate a safe string that won't break markdown parsing
 */
const safeString = (minLength = 1, maxLength = 50) =>
  fc.stringOf(
    fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 '.split('')),
    { minLength, maxLength }
  ).map(s => s.trim() || 'default');

/**
 * Generate a valid file path
 */
const filePath = () =>
  fc.tuple(
    fc.constantFrom('src', 'components', 'features', 'utils'),
    safeString(3, 20),
    fc.constantFrom('.ts', '.tsx', '.js', '.jsx')
  ).map(([dir, name, ext]) => `${dir}/${name}${ext}`);

/**
 * Generate valid line numbers
 */
const lineNumbers = () =>
  fc.tuple(
    fc.integer({ min: 1, max: 500 }),
    fc.integer({ min: 1, max: 100 })
  ).map(([start, offset]) => ({
    start,
    end: start + offset,
  }));

/**
 * Generate code evidence
 */
const codeEvidence = (): fc.Arbitrary<CodeEvidence> =>
  fc.record({
    filePath: filePath(),
    lineNumbers: lineNumbers(),
    codeSnippet: safeString(10, 100),
    language: fc.constantFrom('typescript', 'javascript', 'tsx', 'jsx'),
  });

/**
 * Generate an atomic feature
 */
const atomicFeature = (id: number): fc.Arbitrary<AtomicFeature> =>
  fc.record({
    id: fc.constant(id),
    name: safeString(5, 30),
    description: safeString(10, 80),
    linesOfCode: fc.integer({ min: 5, max: 500 }),
    primaryLocation: fc.record({
      file: filePath(),
      startLine: fc.integer({ min: 1, max: 500 }),
      endLine: fc.integer({ min: 1, max: 600 }),
    }).map(loc => ({
      ...loc,
      endLine: Math.max(loc.startLine + 1, loc.endLine),
    })),
    codeBlocks: fc.constant([]),
    stateManagement: fc.constant([]),
    eventHandlers: fc.constant([]),
  });

/**
 * Generate external dependency
 */
const externalDependency = (): fc.Arbitrary<ExternalDependency> =>
  fc.record({
    packageName: safeString(3, 20),
    purpose: safeString(10, 50),
    importPath: safeString(5, 30),
  });

/**
 * Generate completeness evaluation
 */
const completenessEvaluation = (): fc.Arbitrary<CompletenessEvaluation> =>
  fc.record({
    rating: fc.constantFrom('Not Implemented', 'Partial', 'Full', 'Enterprise-Level') as fc.Arbitrary<CompletenessEvaluation['rating']>,
    percentage: fc.integer({ min: 0, max: 100 }),
    implemented: fc.array(
      fc.record({
        capability: safeString(5, 40),
        status: fc.constant('implemented' as const),
        details: fc.constant(undefined),
      }),
      { minLength: 0, maxLength: 3 }
    ),
    missing: fc.array(
      fc.record({
        capability: safeString(5, 40),
        status: fc.constant('missing' as const),
        details: fc.constant(undefined),
      }),
      { minLength: 0, maxLength: 3 }
    ),
    incomplete: fc.array(
      fc.record({
        capability: safeString(5, 40),
        status: fc.constant('incomplete' as const),
        details: safeString(10, 30),
      }),
      { minLength: 0, maxLength: 2 }
    ),
    evidence: codeEvidence(),
    rationale: safeString(20, 100),
  });

/**
 * Generate code quality evaluation
 */
const codeQualityEvaluation = (): fc.Arbitrary<CodeQualityEvaluation> =>
  fc.record({
    rating: fc.constantFrom('Poor', 'Basic', 'Good', 'Excellent') as fc.Arbitrary<CodeQualityEvaluation['rating']>,
    featureIsolation: fc.constantFrom(
      'isolated_module',
      'same_file_separated',
      'mixed_with_other',
      'scattered_files'
    ) as fc.Arbitrary<FeatureIsolationClassification>,
    antiPatterns: fc.constant([]),
    goodPractices: fc.constant([]),
    assessment: safeString(20, 100),
  });

/**
 * Generate documentation evaluation
 */
const documentationEvaluation = (): fc.Arbitrary<DocumentationEvaluation> =>
  fc.record({
    rating: fc.constantFrom('None', 'Basic', 'Good', 'Excellent') as fc.Arbitrary<DocumentationEvaluation['rating']>,
    coverage: fc.record({
      hasJSDoc: fc.boolean(),
      hasInlineComments: fc.boolean(),
      hasSelfDocumentingNames: fc.boolean(),
      hasUsageExamples: fc.boolean(),
      hasEdgeCaseDocs: fc.boolean(),
    }),
    examples: fc.constant({ goodDocumentation: [], missingDocumentation: [] }),
    assessment: safeString(20, 100),
  });

/**
 * Generate reliability evaluation
 */
const reliabilityEvaluation = (): fc.Arbitrary<ReliabilityEvaluation> =>
  fc.record({
    rating: fc.constantFrom('Low', 'Medium', 'High', 'Enterprise-Level') as fc.Arbitrary<ReliabilityEvaluation['rating']>,
    presentErrorHandling: fc.constant([]),
    missingErrorHandling: fc.constant([]),
    defensiveCoding: fc.record({
      hasInputValidation: fc.boolean(),
      hasNullChecks: fc.boolean(),
      hasTypeGuards: fc.boolean(),
      description: safeString(10, 50),
    }),
    edgeCaseHandling: fc.record({
      handledCases: fc.constant([]),
      unhandledCases: fc.constant([]),
      description: safeString(10, 50),
    }),
    assessment: safeString(20, 100),
  });

/**
 * Generate performance evaluation
 */
const performanceEvaluation = (): fc.Arbitrary<PerformanceEvaluation> =>
  fc.record({
    rating: fc.constantFrom('Poor', 'Acceptable', 'Good', 'Excellent') as fc.Arbitrary<PerformanceEvaluation['rating']>,
    concerns: fc.constant([]),
    optimizations: fc.constant([]),
    complexityAnalysis: fc.record({
      algorithmicComplexity: fc.constantFrom('O(1)', 'O(n)', 'O(n log n)', 'O(n²)'),
      loopAnalysis: safeString(10, 50),
    }),
    reRenderAnalysis: fc.record({
      hasUnnecessaryReRenders: fc.boolean(),
      issues: fc.constant([]),
    }),
    assessment: safeString(20, 100),
  });

/**
 * Generate integration evaluation
 */
const integrationEvaluation = (): fc.Arbitrary<IntegrationEvaluation> =>
  fc.record({
    rating: fc.constantFrom('Not Compatible', 'Partial', 'Full', 'Enterprise-Level') as fc.Arbitrary<IntegrationEvaluation['rating']>,
    configurationOptions: fc.constant([]),
    extensibility: fc.record({
      hasHooksCallbacks: fc.boolean(),
      hasSomeExtensionPoints: fc.boolean(),
      isHardcoded: fc.boolean(),
      details: safeString(10, 50),
    }),
    toggleCapability: fc.boolean(),
    featureInteractions: safeString(10, 50),
    assessment: safeString(20, 100),
  });

/**
 * Generate maintenance evaluation
 */
const maintenanceEvaluation = (): fc.Arbitrary<MaintenanceEvaluation> =>
  fc.record({
    rating: fc.constantFrom('Low', 'Medium', 'High', 'Enterprise-Level') as fc.Arbitrary<MaintenanceEvaluation['rating']>,
    modularity: fc.record({
      featureLOC: fc.integer({ min: 10, max: 500 }),
      complexity: fc.constantFrom('Low', 'Medium', 'High') as fc.Arbitrary<'Low' | 'Medium' | 'High'>,
      dependencies: fc.array(safeString(3, 20), { minLength: 0, maxLength: 3 }),
    }),
    modificationEase: fc.constantFrom('single_file', 'few_files', 'many_files') as fc.Arbitrary<ModificationEaseClassification>,
    testability: fc.constantFrom('isolated', 'requires_mocking', 'tightly_coupled') as fc.Arbitrary<TestabilityClassification>,
    dependencies: fc.array(safeString(3, 20), { minLength: 0, maxLength: 3 }),
    assessment: safeString(20, 100),
  });

/**
 * Generate stress collapse evaluation
 */
const stressCollapseEvaluation = (): fc.Arbitrary<StressCollapseEvaluation> =>
  fc.oneof(
    fc.record({
      conditions: fc.constant([]),
      isRobust: fc.constant(true),
      robustReason: safeString(10, 50),
    }),
    fc.record({
      conditions: fc.array(
        fc.record({
          id: fc.integer({ min: 1, max: 5 }),
          threshold: safeString(10, 30),
          expectedBehavior: safeString(10, 50),
          reasoning: fc.array(safeString(10, 40), { minLength: 1, maxLength: 3 }),
          codePatternReferences: fc.constant([]),
        }),
        { minLength: 1, maxLength: 2 }
      ),
      isRobust: fc.constant(false),
      robustReason: fc.constant(undefined),
    })
  );

/**
 * Generate a complete feature evaluation
 */
const featureEvaluation = (feature: AtomicFeature): fc.Arbitrary<FeatureEvaluation> =>
  fc.record({
    feature: fc.constant(feature),
    completeness: completenessEvaluation(),
    codeQuality: codeQualityEvaluation(),
    documentation: documentationEvaluation(),
    reliability: reliabilityEvaluation(),
    performance: performanceEvaluation(),
    integration: integrationEvaluation(),
    maintenance: maintenanceEvaluation(),
    stressCollapse: stressCollapseEvaluation(),
  });

/**
 * Generate a complete AGREEMENT.md document
 */
const agreementDocument = (): fc.Arbitrary<AgreementDocument> =>
  fc.integer({ min: 1, max: 5 }).chain(numFeatures => {
    const featureIds = Array.from({ length: numFeatures }, (_, i) => i + 1);
    
    return fc.tuple(
      fc.record({
        componentName: safeString(5, 30),
        type: fc.constantFrom('Component', 'Feature Package') as fc.Arbitrary<'Component' | 'Feature Package'>,
        evaluatedDate: fc.constant(new Date().toISOString().split('T')[0]),
        path: filePath(),
        linesOfCode: fc.integer({ min: 100, max: 5000 }),
      }),
      fc.tuple(...featureIds.map(id => atomicFeature(id))),
      fc.array(externalDependency(), { minLength: 0, maxLength: 2 }),
    ).chain(([header, features, externalDeps]) => {
      return fc.tuple(
        ...features.map(f => featureEvaluation(f))
      ).map(evaluations => ({
        header,
        featureIdentification: {
          methodology: [
            'Analyzed component code structure',
            'Identified distinct capabilities',
            'Verified no separate packages exist',
            'Listed smallest independent features',
          ],
          featuresTable: features,
          totalFeatures: features.length,
          externalDependencies: externalDeps,
        },
        featureEvaluations: evaluations,
        componentSummary: {
          statistics: {
            totalFeatures: features.length,
            enterpriseLevel: evaluations.filter(e => e.completeness.rating === 'Enterprise-Level').length,
            fullImplementation: evaluations.filter(e => e.completeness.rating === 'Full').length,
            partialImplementation: evaluations.filter(e => e.completeness.rating === 'Partial').length,
            notImplemented: evaluations.filter(e => e.completeness.rating === 'Not Implemented').length,
          },
          criticalIssues: [],
          strengths: [],
          recommendedActions: [],
          overallReadiness: 'Development' as const,
        },
      }));
    });
  });

// ============================================================================
// Helper Functions for Table Validation
// ============================================================================

/**
 * Extract all markdown tables from a markdown string
 */
function extractMarkdownTables(markdown: string): string[][] {
  const tables: string[][] = [];
  const lines = markdown.split('\n');
  let currentTable: string[] = [];
  let inTable = false;

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Check if line is a table row (starts and ends with |)
    if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
      if (!inTable) {
        inTable = true;
        currentTable = [];
      }
      currentTable.push(trimmedLine);
    } else {
      if (inTable && currentTable.length > 0) {
        tables.push(currentTable);
        currentTable = [];
      }
      inTable = false;
    }
  }

  // Don't forget the last table if markdown ends with a table
  if (inTable && currentTable.length > 0) {
    tables.push(currentTable);
  }

  return tables;
}

/**
 * Validate that a table row is pipe-delimited
 */
function isValidPipeDelimitedRow(row: string): boolean {
  // Must start and end with |
  if (!row.startsWith('|') || !row.endsWith('|')) {
    return false;
  }
  
  // Must have at least one cell (at least 3 pipes: |cell|)
  const pipeCount = (row.match(/\|/g) || []).length;
  return pipeCount >= 2;
}

/**
 * Validate that a table has a proper separator row
 */
function hasValidSeparatorRow(table: string[]): boolean {
  if (table.length < 2) {
    return false;
  }
  
  // Second row should be the separator (contains only |, -, :, and spaces)
  const separatorRow = table[1];
  const separatorPattern = /^\|[\s\-:|]+\|$/;
  return separatorPattern.test(separatorRow);
}

/**
 * Get column count from a table row
 */
function getColumnCount(row: string): number {
  // Split by | and filter out empty strings from start/end
  const cells = row.split('|').filter((_, index, arr) => index > 0 && index < arr.length - 1);
  return cells.length;
}

/**
 * Validate that all rows in a table have consistent column count
 */
function hasConsistentColumnCount(table: string[]): boolean {
  if (table.length === 0) {
    return true;
  }
  
  const headerColumnCount = getColumnCount(table[0]);
  return table.every(row => getColumnCount(row) === headerColumnCount);
}

// ============================================================================
// Property Tests
// ============================================================================

describe('Table Format Validity', () => {
  /**
   * **Feature: blind-evaluation-framework, Property 28: Table format validity**
   * **Validates: Requirements 12.2**
   */
  describe('Pipe-Delimited Format', () => {
    it('should generate tables with pipe-delimited rows', () => {
      fc.assert(
        fc.property(
          agreementDocument(),
          (document) => {
            const markdown = MarkdownSerializer.serializeAgreement(document);
            const tables = extractMarkdownTables(markdown);

            // Should have at least one table (the features table)
            expect(tables.length).toBeGreaterThanOrEqual(1);

            // All table rows should be pipe-delimited
            for (const table of tables) {
              for (const row of table) {
                expect(isValidPipeDelimitedRow(row)).toBe(true);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate tables with valid separator rows', () => {
      fc.assert(
        fc.property(
          agreementDocument(),
          (document) => {
            const markdown = MarkdownSerializer.serializeAgreement(document);
            const tables = extractMarkdownTables(markdown);

            // All tables should have valid separator rows
            for (const table of tables) {
              if (table.length >= 2) {
                expect(hasValidSeparatorRow(table)).toBe(true);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate tables with consistent column counts', () => {
      fc.assert(
        fc.property(
          agreementDocument(),
          (document) => {
            const markdown = MarkdownSerializer.serializeAgreement(document);
            const tables = extractMarkdownTables(markdown);

            // All tables should have consistent column counts
            for (const table of tables) {
              expect(hasConsistentColumnCount(table)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Feature Table Column Headers', () => {
    it('should have correct column headers for feature identification table', () => {
      fc.assert(
        fc.property(
          agreementDocument(),
          (document) => {
            const markdown = MarkdownSerializer.serializeAgreement(document);
            const tables = extractMarkdownTables(markdown);

            // Find the features table (should be the first table with 5 columns)
            const featuresTable = tables.find(table => {
              if (table.length < 2) return false;
              const headerRow = table[0];
              return headerRow.includes('Feature Name') && 
                     headerRow.includes('Description') && 
                     headerRow.includes('LOC') && 
                     headerRow.includes('Primary Location');
            });

            // Features table should exist
            expect(featuresTable).toBeDefined();

            if (featuresTable) {
              const headerRow = featuresTable[0];
              
              // Verify all required columns are present
              expect(headerRow).toContain('#');
              expect(headerRow).toContain('Feature Name');
              expect(headerRow).toContain('Description');
              expect(headerRow).toContain('LOC');
              expect(headerRow).toContain('Primary Location');

              // Verify column count is exactly 5
              expect(getColumnCount(headerRow)).toBe(5);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have data rows matching the number of features', () => {
      fc.assert(
        fc.property(
          agreementDocument(),
          (document) => {
            const markdown = MarkdownSerializer.serializeAgreement(document);
            const tables = extractMarkdownTables(markdown);

            // Find the features table
            const featuresTable = tables.find(table => {
              if (table.length < 2) return false;
              const headerRow = table[0];
              return headerRow.includes('Feature Name') && 
                     headerRow.includes('Description');
            });

            if (featuresTable) {
              // Data rows = total rows - header row - separator row
              const dataRowCount = featuresTable.length - 2;
              expect(dataRowCount).toBe(document.featureIdentification.featuresTable.length);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Table Data Integrity', () => {
    it('should preserve feature IDs in table rows', () => {
      fc.assert(
        fc.property(
          agreementDocument(),
          (document) => {
            const markdown = MarkdownSerializer.serializeAgreement(document);
            const tables = extractMarkdownTables(markdown);

            // Find the features table
            const featuresTable = tables.find(table => {
              if (table.length < 2) return false;
              return table[0].includes('Feature Name');
            });

            if (featuresTable && featuresTable.length > 2) {
              // Check each data row contains the correct feature ID
              for (let i = 2; i < featuresTable.length; i++) {
                const row = featuresTable[i];
                const expectedId = document.featureIdentification.featuresTable[i - 2].id;
                const cells = row.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
                const actualId = parseInt(cells[0].trim(), 10);
                expect(actualId).toBe(expectedId);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve feature names in table rows', () => {
      fc.assert(
        fc.property(
          agreementDocument(),
          (document) => {
            const markdown = MarkdownSerializer.serializeAgreement(document);
            const tables = extractMarkdownTables(markdown);

            // Find the features table
            const featuresTable = tables.find(table => {
              if (table.length < 2) return false;
              return table[0].includes('Feature Name');
            });

            if (featuresTable && featuresTable.length > 2) {
              // Check each data row contains the correct feature name
              for (let i = 2; i < featuresTable.length; i++) {
                const row = featuresTable[i];
                const expectedName = document.featureIdentification.featuresTable[i - 2].name;
                const cells = row.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
                const actualName = cells[1].trim();
                expect(actualName).toBe(expectedName);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include LOC values with tilde prefix', () => {
      fc.assert(
        fc.property(
          agreementDocument(),
          (document) => {
            const markdown = MarkdownSerializer.serializeAgreement(document);
            const tables = extractMarkdownTables(markdown);

            // Find the features table
            const featuresTable = tables.find(table => {
              if (table.length < 2) return false;
              return table[0].includes('LOC');
            });

            if (featuresTable && featuresTable.length > 2) {
              // Check each data row has LOC with tilde prefix
              for (let i = 2; i < featuresTable.length; i++) {
                const row = featuresTable[i];
                const cells = row.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
                const locCell = cells[3].trim();
                expect(locCell).toMatch(/^~\d+$/);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include valid location format in table rows', () => {
      fc.assert(
        fc.property(
          agreementDocument(),
          (document) => {
            const markdown = MarkdownSerializer.serializeAgreement(document);
            const tables = extractMarkdownTables(markdown);

            // Find the features table
            const featuresTable = tables.find(table => {
              if (table.length < 2) return false;
              return table[0].includes('Primary Location');
            });

            if (featuresTable && featuresTable.length > 2) {
              // Check each data row has valid location format (file:start-end)
              for (let i = 2; i < featuresTable.length; i++) {
                const row = featuresTable[i];
                const cells = row.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
                const locationCell = cells[4].trim();
                // Location should match pattern: path/file.ext:start-end
                expect(locationCell).toMatch(/^.+:\d+-\d+$/);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
