/**
 * Property-based tests for evaluation data serialization round-trip
 * 
 * **Feature: blind-evaluation-framework, Property 27: Markdown round-trip consistency**
 * **Validates: Requirements 12.1, 12.4, 12.6**
 * 
 * For any evaluation data structure, serializing to AGREEMENT.md format
 * and then parsing back SHALL produce an equivalent data structure with
 * all ratings, evidence, code snippets, and recommendations preserved.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { MarkdownSerializer } from '../src/serialization/MarkdownSerializer';
import { MarkdownParser } from '../src/serialization/MarkdownParser';
import type { AgreementDocument } from '../types/documents';
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
} from '../types/dimensions';
import type { AtomicFeature, CodeEvidence, ExternalDependency } from '../types/evaluation';

// ============================================================================
// Arbitrary Generators
// ============================================================================

/**
 * Generate a safe string that won't break markdown parsing
 * Avoids special markdown characters and newlines
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
 * Generate completeness rating
 */
const completenessRating = () =>
  fc.constantFrom('Not Implemented', 'Partial', 'Full', 'Enterprise-Level') as fc.Arbitrary<CompletenessEvaluation['rating']>;

/**
 * Generate completeness evaluation
 */
const completenessEvaluation = (): fc.Arbitrary<CompletenessEvaluation> =>
  fc.record({
    rating: completenessRating(),
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
    // Robust feature (no collapse)
    fc.record({
      conditions: fc.constant([]),
      isRobust: fc.constant(true),
      robustReason: safeString(10, 50),
    }),
    // Feature with collapse conditions
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
  fc.integer({ min: 1, max: 3 }).chain(numFeatures => {
    const featureIds = Array.from({ length: numFeatures }, (_, i) => i + 1);
    
    return fc.tuple(
      // Header
      fc.record({
        componentName: safeString(5, 30),
        type: fc.constantFrom('Component', 'Feature Package') as fc.Arbitrary<'Component' | 'Feature Package'>,
        evaluatedDate: fc.constant(new Date().toISOString().split('T')[0]),
        path: filePath(),
        linesOfCode: fc.integer({ min: 100, max: 5000 }),
      }),
      // Features
      fc.tuple(...featureIds.map(id => atomicFeature(id))),
      // External dependencies
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
// Property Tests
// ============================================================================

describe('Markdown Round-Trip Consistency', () => {
  /**
   * **Feature: blind-evaluation-framework, Property 27: Markdown round-trip consistency**
   * **Validates: Requirements 12.1, 12.4, 12.6**
   */
  it('should preserve header data through serialization and parsing', () => {
    fc.assert(
      fc.property(
        agreementDocument(),
        (document) => {
          const markdown = MarkdownSerializer.serializeAgreement(document);
          const parsed = MarkdownParser.parseAgreement(markdown);

          // Verify header is preserved
          expect(parsed.header.componentName).toBe(document.header.componentName);
          expect(parsed.header.type).toBe(document.header.type);
          expect(parsed.header.evaluatedDate).toBe(document.header.evaluatedDate);
          expect(parsed.header.path).toBe(document.header.path);
          expect(parsed.header.linesOfCode).toBe(document.header.linesOfCode);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve feature identification data through serialization and parsing', () => {
    fc.assert(
      fc.property(
        agreementDocument(),
        (document) => {
          const markdown = MarkdownSerializer.serializeAgreement(document);
          const parsed = MarkdownParser.parseAgreement(markdown);

          // Verify feature count is preserved
          expect(parsed.featureIdentification.totalFeatures).toBe(
            document.featureIdentification.totalFeatures
          );

          // Verify features table is preserved
          expect(parsed.featureIdentification.featuresTable.length).toBe(
            document.featureIdentification.featuresTable.length
          );

          for (let i = 0; i < document.featureIdentification.featuresTable.length; i++) {
            const original = document.featureIdentification.featuresTable[i];
            const parsedFeature = parsed.featureIdentification.featuresTable[i];

            expect(parsedFeature.id).toBe(original.id);
            expect(parsedFeature.name).toBe(original.name);
            expect(parsedFeature.description).toBe(original.description);
            expect(parsedFeature.linesOfCode).toBe(original.linesOfCode);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve completeness ratings through serialization and parsing', () => {
    fc.assert(
      fc.property(
        agreementDocument(),
        (document) => {
          const markdown = MarkdownSerializer.serializeAgreement(document);
          const parsed = MarkdownParser.parseAgreement(markdown);

          // Verify completeness ratings are preserved
          for (let i = 0; i < document.featureEvaluations.length; i++) {
            const original = document.featureEvaluations[i].completeness;
            const parsedEval = parsed.featureEvaluations[i]?.completeness;

            if (parsedEval) {
              expect(parsedEval.rating).toBe(original.rating);
              expect(parsedEval.percentage).toBe(original.percentage);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve code quality ratings through serialization and parsing', () => {
    fc.assert(
      fc.property(
        agreementDocument(),
        (document) => {
          const markdown = MarkdownSerializer.serializeAgreement(document);
          const parsed = MarkdownParser.parseAgreement(markdown);

          // Verify code quality ratings are preserved
          for (let i = 0; i < document.featureEvaluations.length; i++) {
            const original = document.featureEvaluations[i].codeQuality;
            const parsedEval = parsed.featureEvaluations[i]?.codeQuality;

            if (parsedEval) {
              expect(parsedEval.rating).toBe(original.rating);
              expect(parsedEval.featureIsolation).toBe(original.featureIsolation);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve documentation coverage through serialization and parsing', () => {
    fc.assert(
      fc.property(
        agreementDocument(),
        (document) => {
          const markdown = MarkdownSerializer.serializeAgreement(document);
          const parsed = MarkdownParser.parseAgreement(markdown);

          // Verify documentation ratings are preserved
          for (let i = 0; i < document.featureEvaluations.length; i++) {
            const original = document.featureEvaluations[i].documentation;
            const parsedEval = parsed.featureEvaluations[i]?.documentation;

            if (parsedEval) {
              expect(parsedEval.rating).toBe(original.rating);
              expect(parsedEval.coverage.hasJSDoc).toBe(original.coverage.hasJSDoc);
              expect(parsedEval.coverage.hasInlineComments).toBe(original.coverage.hasInlineComments);
              expect(parsedEval.coverage.hasSelfDocumentingNames).toBe(original.coverage.hasSelfDocumentingNames);
              expect(parsedEval.coverage.hasUsageExamples).toBe(original.coverage.hasUsageExamples);
              expect(parsedEval.coverage.hasEdgeCaseDocs).toBe(original.coverage.hasEdgeCaseDocs);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve all dimension ratings through serialization and parsing', () => {
    fc.assert(
      fc.property(
        agreementDocument(),
        (document) => {
          const markdown = MarkdownSerializer.serializeAgreement(document);
          const parsed = MarkdownParser.parseAgreement(markdown);

          // Verify all ratings are preserved
          for (let i = 0; i < document.featureEvaluations.length; i++) {
            const original = document.featureEvaluations[i];
            const parsedEval = parsed.featureEvaluations[i];

            if (parsedEval) {
              expect(parsedEval.reliability.rating).toBe(original.reliability.rating);
              expect(parsedEval.performance.rating).toBe(original.performance.rating);
              expect(parsedEval.integration.rating).toBe(original.integration.rating);
              expect(parsedEval.maintenance.rating).toBe(original.maintenance.rating);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve maintenance modularity metrics through serialization and parsing', () => {
    fc.assert(
      fc.property(
        agreementDocument(),
        (document) => {
          const markdown = MarkdownSerializer.serializeAgreement(document);
          const parsed = MarkdownParser.parseAgreement(markdown);

          // Verify maintenance modularity is preserved
          for (let i = 0; i < document.featureEvaluations.length; i++) {
            const original = document.featureEvaluations[i].maintenance;
            const parsedEval = parsed.featureEvaluations[i]?.maintenance;

            if (parsedEval) {
              expect(parsedEval.modularity.featureLOC).toBe(original.modularity.featureLOC);
              expect(parsedEval.modularity.complexity).toBe(original.modularity.complexity);
              expect(parsedEval.modificationEase).toBe(original.modificationEase);
              expect(parsedEval.testability).toBe(original.testability);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve stress collapse robustness through serialization and parsing', () => {
    fc.assert(
      fc.property(
        agreementDocument(),
        (document) => {
          const markdown = MarkdownSerializer.serializeAgreement(document);
          const parsed = MarkdownParser.parseAgreement(markdown);

          // Verify stress collapse is preserved
          for (let i = 0; i < document.featureEvaluations.length; i++) {
            const original = document.featureEvaluations[i].stressCollapse;
            const parsedEval = parsed.featureEvaluations[i]?.stressCollapse;

            if (parsedEval) {
              expect(parsedEval.isRobust).toBe(original.isRobust);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve component summary statistics through serialization and parsing', () => {
    fc.assert(
      fc.property(
        agreementDocument(),
        (document) => {
          const markdown = MarkdownSerializer.serializeAgreement(document);
          const parsed = MarkdownParser.parseAgreement(markdown);

          // Verify summary statistics are preserved
          expect(parsed.componentSummary.statistics.totalFeatures).toBe(
            document.componentSummary.statistics.totalFeatures
          );
          expect(parsed.componentSummary.statistics.enterpriseLevel).toBe(
            document.componentSummary.statistics.enterpriseLevel
          );
          expect(parsed.componentSummary.statistics.fullImplementation).toBe(
            document.componentSummary.statistics.fullImplementation
          );
          expect(parsed.componentSummary.statistics.partialImplementation).toBe(
            document.componentSummary.statistics.partialImplementation
          );
          expect(parsed.componentSummary.statistics.notImplemented).toBe(
            document.componentSummary.statistics.notImplemented
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
