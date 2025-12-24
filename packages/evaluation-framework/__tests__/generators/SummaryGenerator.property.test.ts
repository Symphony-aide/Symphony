/**
 * Property-based tests for SUMMARY_AGREEMENT.md Generator
 * 
 * **Feature: blind-evaluation-framework, Property 25: SUMMARY_AGREEMENT.md creation**
 * **Validates: Requirements 11.1**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { SummaryGenerator } from '../../src/generators/SummaryGenerator';
import type { AgreementDocument, ProductionReadinessStatus } from '../../types/documents';
import type { FeatureEvaluation } from '../../types/dimensions';
import type { AtomicFeature } from '../../types/evaluation';

// Helper functions to create minimal test data
function createMinimalFeature(id: number, name: string): AtomicFeature {
  return {
    id,
    name,
    description: `Test feature ${name}`,
    linesOfCode: 50,
    primaryLocation: { file: 'src/test.ts', startLine: 1, endLine: 50 },
    codeBlocks: [],
    stateManagement: [],
    eventHandlers: [],
  };
}

function createMinimalEvaluation(
  feature: AtomicFeature,
  completenessRating: 'Not Implemented' | 'Partial' | 'Full' | 'Enterprise-Level' = 'Full',
  codeQualityRating: 'Poor' | 'Basic' | 'Good' | 'Excellent' = 'Good',
  performanceRating: 'Poor' | 'Acceptable' | 'Good' | 'Excellent' = 'Good',
  reliabilityRating: 'Low' | 'Medium' | 'High' | 'Enterprise-Level' = 'Medium',
  isRobust: boolean = true
): FeatureEvaluation {
  const percentageMap = {
    'Not Implemented': 0,
    'Partial': 30,
    'Full': 75,
    'Enterprise-Level': 100,
  };

  return {
    feature,
    completeness: {
      rating: completenessRating,
      percentage: percentageMap[completenessRating],
      implemented: [],
      missing: [],
      incomplete: [],
      evidence: {
        filePath: 'src/test.ts',
        lineNumbers: { start: 1, end: 10 },
        codeSnippet: 'test code',
        language: 'typescript',
      },
      rationale: 'Test rationale',
    },
    codeQuality: {
      rating: codeQualityRating,
      featureIsolation: 'isolated_module',
      antiPatterns: codeQualityRating === 'Poor' ? [
        {
          id: 1,
          name: 'Test Anti-Pattern',
          evidence: {
            filePath: 'src/test.ts',
            lineNumbers: { start: 1, end: 5 },
            codeSnippet: 'bad code',
            language: 'typescript',
          },
          issue: 'Test issue',
          impact: 'Test impact',
          betterApproach: { description: 'Better way', codeExample: 'good code' },
        },
      ] : [],
      goodPractices: [],
      assessment: 'Test assessment',
    },
    documentation: {
      rating: 'Basic',
      coverage: {
        hasJSDoc: true,
        hasInlineComments: false,
        hasSelfDocumentingNames: true,
        hasUsageExamples: false,
        hasEdgeCaseDocs: false,
      },
      examples: { goodDocumentation: [], missingDocumentation: [] },
      assessment: 'Basic docs',
    },
    reliability: {
      rating: reliabilityRating,
      presentErrorHandling: [],
      missingErrorHandling: reliabilityRating === 'Low' ? [
        { scenario: 'Missing error handling', location: { file: 'test.ts', line: 10 }, risk: 'High' },
      ] : [],
      defensiveCoding: {
        hasInputValidation: true,
        hasNullChecks: true,
        hasTypeGuards: false,
        description: 'Some defensive coding',
      },
      edgeCaseHandling: {
        handledCases: [],
        unhandledCases: [],
        description: 'Edge cases handled',
      },
      assessment: 'Test reliability',
    },
    performance: {
      rating: performanceRating,
      concerns: performanceRating === 'Poor' ? [
        {
          id: 1,
          evidence: {
            filePath: 'src/test.ts',
            lineNumbers: { start: 1, end: 5 },
            codeSnippet: 'slow code',
            language: 'typescript',
          },
          issue: 'Performance issue',
          impact: 'Slow',
          recommendedFix: 'Optimize',
        },
      ] : [],
      optimizations: [],
      complexityAnalysis: { algorithmicComplexity: 'O(n)', loopAnalysis: 'Single loop' },
      reRenderAnalysis: { hasUnnecessaryReRenders: false, issues: [] },
      assessment: 'Test performance',
    },
    integration: {
      rating: 'Full',
      configurationOptions: [],
      extensibility: {
        hasHooksCallbacks: true,
        hasSomeExtensionPoints: true,
        isHardcoded: false,
        details: 'Extensible',
      },
      toggleCapability: true,
      featureInteractions: 'Works well',
      assessment: 'Full integration',
    },
    maintenance: {
      rating: 'High',
      modularity: { featureLOC: 50, complexity: 'Low', dependencies: [] },
      modificationEase: 'single_file',
      testability: 'isolated',
      dependencies: [],
      assessment: 'High maintainability',
    },
    stressCollapse: {
      conditions: isRobust ? [] : [
        {
          id: 1,
          threshold: '100 items',
          expectedBehavior: 'UI freezes',
          reasoning: ['No virtualization'],
          codePatternReferences: [],
        },
      ],
      isRobust,
      robustReason: isRobust ? 'Simple feature' : undefined,
    },
  };
}


function createMinimalAgreementDocument(
  componentName: string,
  componentType: 'Component' | 'Feature Package',
  featureCount: number,
  readiness: ProductionReadinessStatus = 'Production Ready'
): AgreementDocument {
  const features = Array.from({ length: featureCount }, (_, i) =>
    createMinimalFeature(i + 1, `Feature${i + 1}`)
  );
  const evaluations = features.map(f => createMinimalEvaluation(f));

  // Calculate statistics based on evaluations
  let enterprise = 0, full = 0, partial = 0, notImpl = 0;
  for (const eval_ of evaluations) {
    switch (eval_.completeness.rating) {
      case 'Enterprise-Level': enterprise++; break;
      case 'Full': full++; break;
      case 'Partial': partial++; break;
      case 'Not Implemented': notImpl++; break;
    }
  }

  return {
    header: {
      componentName,
      type: componentType,
      evaluatedDate: '2024-01-15',
      path: `packages/components/${componentName.toLowerCase()}`,
      linesOfCode: featureCount * 50,
    },
    featureIdentification: {
      methodology: [
        'Analyzed component code structure',
        'Identified distinct capabilities',
        'Verified no separate packages exist',
        'Listed smallest independent features',
      ],
      featuresTable: features,
      totalFeatures: featureCount,
      externalDependencies: [],
    },
    featureEvaluations: evaluations,
    componentSummary: {
      statistics: {
        totalFeatures: featureCount,
        enterpriseLevel: enterprise,
        fullImplementation: full,
        partialImplementation: partial,
        notImplemented: notImpl,
      },
      criticalIssues: [],
      strengths: ['Well-structured code'],
      recommendedActions: [
        { priority: 'Medium', action: 'Add more tests', feature: 'Feature1' },
      ],
      overallReadiness: readiness,
    },
  };
}

// Arbitraries for property tests
const componentNameArb = fc.constantFrom(
  'TabBar',
  'CodeEditor',
  'FileExplorer',
  'Terminal',
  'Settings'
);

const componentTypeArb = fc.constantFrom(
  'Component',
  'Feature Package'
) as fc.Arbitrary<'Component' | 'Feature Package'>;

const featureCountArb = fc.integer({ min: 1, max: 5 });

const documentCountArb = fc.integer({ min: 1, max: 5 });

/**
 * **Feature: blind-evaluation-framework, Property 25: SUMMARY_AGREEMENT.md creation**
 * **Validates: Requirements 11.1**
 */
describe('SUMMARY_AGREEMENT.md Creation', () => {
  it('should generate SUMMARY_AGREEMENT.md at the project root for any evaluation session', () => {
    fc.assert(
      fc.property(
        documentCountArb,
        (docCount) => {
          const documents = Array.from({ length: docCount }, (_, i) =>
            createMinimalAgreementDocument(`Component${i + 1}`, 'Component', 2)
          );

          const generator = new SummaryGenerator({
            projectName: 'Symphony IDE',
            basePath: '/test/project',
            writeFiles: false,
          });

          const document = generator.buildDocument(documents);
          const filePath = generator.getOutputPath();

          // Property 25: File should be created at project root
          expect(filePath).toBe('/test/project/SUMMARY_AGREEMENT.md');
          expect(document).toBeDefined();
          expect(document.executiveSummary).toBeDefined();
          expect(document.detailedTable).toBeDefined();
          expect(document.statistics).toBeDefined();
          expect(document.criticalIssues).toBeDefined();
          expect(document.commonAntiPatterns).toBeDefined();
          expect(document.productionReadiness).toBeDefined();
          expect(document.stressCollapseSummary).toBeDefined();
          expect(document.recommendations).toBeDefined();
          expect(document.heatmap).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should aggregate data from all AGREEMENT.md files correctly', () => {
    fc.assert(
      fc.property(
        documentCountArb,
        featureCountArb,
        (docCount, featureCount) => {
          const documents = Array.from({ length: docCount }, (_, i) =>
            createMinimalAgreementDocument(`Component${i + 1}`, 'Component', featureCount)
          );

          const generator = new SummaryGenerator({
            projectName: 'Symphony IDE',
            basePath: '/test/project',
            writeFiles: false,
          });

          const document = generator.buildDocument(documents);

          // Total features should be sum of all component features
          const expectedTotalFeatures = docCount * featureCount;
          expect(document.executiveSummary.totalFeaturesEvaluated).toBe(expectedTotalFeatures);
          expect(document.executiveSummary.componentsEvaluated).toBe(docCount);

          // Detailed table should have one row per feature
          expect(document.detailedTable.length).toBe(expectedTotalFeatures);

          // Production readiness should have one row per component
          expect(document.productionReadiness.length).toBe(docCount);

          // Heatmap should have one row per component
          expect(document.heatmap.rows.length).toBe(docCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty document array gracefully', () => {
    const generator = new SummaryGenerator({
      projectName: 'Symphony IDE',
      basePath: '/test/project',
      writeFiles: false,
    });

    const document = generator.buildDocument([]);

    expect(document.executiveSummary.componentsEvaluated).toBe(0);
    expect(document.executiveSummary.totalFeaturesEvaluated).toBe(0);
    expect(document.detailedTable.length).toBe(0);
    expect(document.productionReadiness.length).toBe(0);
    expect(document.heatmap.rows.length).toBe(0);
  });

  it('should use configured project name in executive summary', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (projectName) => {
          const documents = [createMinimalAgreementDocument('TestComponent', 'Component', 2)];

          const generator = new SummaryGenerator({
            projectName,
            basePath: '/test/project',
            writeFiles: false,
          });

          const document = generator.buildDocument(documents);

          expect(document.executiveSummary.projectName).toBe(projectName);
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: blind-evaluation-framework, Property 26: SUMMARY_AGREEMENT.md structure completeness**
 * **Validates: Requirements 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 11.10**
 */
describe('SUMMARY_AGREEMENT.md Structure Completeness', () => {
  /**
   * Requirements 11.2: Executive Summary
   */
  it('should contain complete executive summary section', () => {
    fc.assert(
      fc.property(
        documentCountArb,
        featureCountArb,
        (docCount, featureCount) => {
          const documents = Array.from({ length: docCount }, (_, i) =>
            createMinimalAgreementDocument(`Component${i + 1}`, 'Component', featureCount)
          );

          const generator = new SummaryGenerator({
            projectName: 'Symphony IDE',
            basePath: '/test/project',
            writeFiles: false,
          });

          const document = generator.buildDocument(documents);
          const summary = document.executiveSummary;

          // Verify executive summary completeness (Requirements 11.2)
          expect(summary.projectName).toBe('Symphony IDE');
          expect(summary.evaluationDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          expect(typeof summary.componentsEvaluated).toBe('number');
          expect(summary.componentsEvaluated).toBe(docCount);
          expect(typeof summary.totalFeaturesEvaluated).toBe('number');
          expect(summary.totalFeaturesEvaluated).toBe(docCount * featureCount);
          expect(Array.isArray(summary.keyFindings)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Requirements 11.3: Detailed Evaluation Table
   */
  it('should contain detailed evaluation table with all 11 columns', () => {
    fc.assert(
      fc.property(
        documentCountArb,
        featureCountArb,
        (docCount, featureCount) => {
          const documents = Array.from({ length: docCount }, (_, i) =>
            createMinimalAgreementDocument(`Component${i + 1}`, 'Component', featureCount)
          );

          const generator = new SummaryGenerator({
            projectName: 'Symphony IDE',
            basePath: '/test/project',
            writeFiles: false,
          });

          const document = generator.buildDocument(documents);

          // Verify detailed table (Requirements 11.3)
          expect(document.detailedTable.length).toBe(docCount * featureCount);

          for (const row of document.detailedTable) {
            // All 11 columns must be present
            expect(typeof row.componentPackage).toBe('string');
            expect(typeof row.type).toBe('string');
            expect(typeof row.featureName).toBe('string');
            expect(typeof row.completeness).toBe('string');
            expect(typeof row.codeQuality).toBe('string');
            expect(typeof row.docs).toBe('string');
            expect(typeof row.reliability).toBe('string');
            expect(typeof row.performance).toBe('string');
            expect(typeof row.integration).toBe('string');
            expect(typeof row.maintenance).toBe('string');
            expect(typeof row.whenCollapse).toBe('string');
            expect(typeof row.notes).toBe('string');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Requirements 11.4: Statistics by Category
   */
  it('should contain statistics by category section', () => {
    fc.assert(
      fc.property(
        documentCountArb,
        featureCountArb,
        (docCount, featureCount) => {
          const documents = Array.from({ length: docCount }, (_, i) =>
            createMinimalAgreementDocument(`Component${i + 1}`, 'Component', featureCount)
          );

          const generator = new SummaryGenerator({
            projectName: 'Symphony IDE',
            basePath: '/test/project',
            writeFiles: false,
          });

          const document = generator.buildDocument(documents);
          const stats = document.statistics;

          // Verify statistics (Requirements 11.4)
          // Completeness distribution
          expect(typeof stats.completenessDistribution.enterpriseLevel).toBe('number');
          expect(typeof stats.completenessDistribution.full).toBe('number');
          expect(typeof stats.completenessDistribution.partial).toBe('number');
          expect(typeof stats.completenessDistribution.notImplemented).toBe('number');

          // Code quality distribution
          expect(typeof stats.codeQualityDistribution.excellent).toBe('number');
          expect(typeof stats.codeQualityDistribution.good).toBe('number');
          expect(typeof stats.codeQualityDistribution.basic).toBe('number');
          expect(typeof stats.codeQualityDistribution.poor).toBe('number');

          // Performance issues
          expect(typeof stats.performanceIssues.critical).toBe('number');
          expect(typeof stats.performanceIssues.medium).toBe('number');
          expect(typeof stats.performanceIssues.good).toBe('number');

          // Statistics should sum correctly
          const completenessSum =
            stats.completenessDistribution.enterpriseLevel +
            stats.completenessDistribution.full +
            stats.completenessDistribution.partial +
            stats.completenessDistribution.notImplemented;
          expect(completenessSum).toBe(docCount * featureCount);

          const qualitySum =
            stats.codeQualityDistribution.excellent +
            stats.codeQualityDistribution.good +
            stats.codeQualityDistribution.basic +
            stats.codeQualityDistribution.poor;
          expect(qualitySum).toBe(docCount * featureCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Requirements 11.5: Critical Issues
   */
  it('should contain critical issues section with proper structure', () => {
    // Create documents with some poor quality features to generate critical issues
    const documents = [
      createMinimalAgreementDocument('Component1', 'Component', 2),
    ];
    
    // Add a feature with poor code quality
    const poorFeature = createMinimalFeature(3, 'PoorFeature');
    const poorEval = createMinimalEvaluation(poorFeature, 'Full', 'Poor', 'Poor', 'Low', false);
    documents[0].featureEvaluations.push(poorEval);

    const generator = new SummaryGenerator({
      projectName: 'Symphony IDE',
      basePath: '/test/project',
      writeFiles: false,
    });

    const document = generator.buildDocument(documents);

    // Verify critical issues structure (Requirements 11.5)
    expect(Array.isArray(document.criticalIssues)).toBe(true);
    
    for (const issue of document.criticalIssues) {
      expect(typeof issue.id).toBe('number');
      expect(typeof issue.componentName).toBe('string');
      expect(typeof issue.featureName).toBe('string');
      expect(typeof issue.issue).toBe('string');
      expect(typeof issue.impact).toBe('string');
      expect(typeof issue.evidence).toBe('string');
      expect(typeof issue.recommendation).toBe('string');
    }
  });

  /**
   * Requirements 11.6: Common Anti-Patterns
   */
  it('should contain common anti-patterns section', () => {
    fc.assert(
      fc.property(
        documentCountArb,
        (docCount) => {
          const documents = Array.from({ length: docCount }, (_, i) =>
            createMinimalAgreementDocument(`Component${i + 1}`, 'Component', 2)
          );

          const generator = new SummaryGenerator({
            projectName: 'Symphony IDE',
            basePath: '/test/project',
            writeFiles: false,
          });

          const document = generator.buildDocument(documents);

          // Verify anti-patterns structure (Requirements 11.6)
          expect(Array.isArray(document.commonAntiPatterns)).toBe(true);

          for (const pattern of document.commonAntiPatterns) {
            expect(typeof pattern.id).toBe('number');
            expect(typeof pattern.patternName).toBe('string');
            expect(Array.isArray(pattern.affectedComponents)).toBe(true);
            expect(typeof pattern.impact).toBe('string');
            expect(typeof pattern.recommendation).toBe('string');

            for (const affected of pattern.affectedComponents) {
              expect(typeof affected.component).toBe('string');
              expect(typeof affected.feature).toBe('string');
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Requirements 11.7: Production Readiness Table
   */
  it('should contain production readiness table with correct structure', () => {
    fc.assert(
      fc.property(
        documentCountArb,
        featureCountArb,
        (docCount, featureCount) => {
          const documents = Array.from({ length: docCount }, (_, i) =>
            createMinimalAgreementDocument(`Component${i + 1}`, 'Component', featureCount)
          );

          const generator = new SummaryGenerator({
            projectName: 'Symphony IDE',
            basePath: '/test/project',
            writeFiles: false,
          });

          const document = generator.buildDocument(documents);

          // Verify production readiness table (Requirements 11.7)
          expect(document.productionReadiness.length).toBe(docCount);

          const validStatuses: ProductionReadinessStatus[] = [
            'Production Ready',
            'Staging Ready',
            'Development',
            'Not Ready',
          ];

          for (const row of document.productionReadiness) {
            expect(typeof row.componentPackage).toBe('string');
            expect(typeof row.totalFeatures).toBe('number');
            expect(typeof row.enterprise).toBe('number');
            expect(typeof row.full).toBe('number');
            expect(typeof row.partial).toBe('number');
            expect(typeof row.notImplemented).toBe('number');
            expect(validStatuses).toContain(row.overallStatus);

            // Sum should equal total
            const sum = row.enterprise + row.full + row.partial + row.notImplemented;
            expect(sum).toBe(row.totalFeatures);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Requirements 11.8: Stress Collapse Summary
   */
  it('should contain stress collapse summary with fragile and robust features', () => {
    fc.assert(
      fc.property(
        documentCountArb,
        (docCount) => {
          const documents = Array.from({ length: docCount }, (_, i) =>
            createMinimalAgreementDocument(`Component${i + 1}`, 'Component', 2)
          );

          const generator = new SummaryGenerator({
            projectName: 'Symphony IDE',
            basePath: '/test/project',
            writeFiles: false,
          });

          const document = generator.buildDocument(documents);
          const summary = document.stressCollapseSummary;

          // Verify stress collapse summary (Requirements 11.8)
          expect(Array.isArray(summary.mostFragile)).toBe(true);
          expect(Array.isArray(summary.mostRobust)).toBe(true);

          for (const fragile of summary.mostFragile) {
            expect(typeof fragile.component).toBe('string');
            expect(typeof fragile.feature).toBe('string');
            expect(typeof fragile.collapsesAt).toBe('string');
            expect(typeof fragile.impact).toBe('string');
            expect(['HIGH', 'MEDIUM', 'LOW']).toContain(fragile.priority);
          }

          for (const robust of summary.mostRobust) {
            expect(typeof robust.component).toBe('string');
            expect(typeof robust.feature).toBe('string');
            expect(typeof robust.reason).toBe('string');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Requirements 11.9: Recommendations
   */
  it('should contain recommendations section with three priority levels', () => {
    fc.assert(
      fc.property(
        documentCountArb,
        (docCount) => {
          const documents = Array.from({ length: docCount }, (_, i) =>
            createMinimalAgreementDocument(`Component${i + 1}`, 'Component', 2)
          );

          const generator = new SummaryGenerator({
            projectName: 'Symphony IDE',
            basePath: '/test/project',
            writeFiles: false,
          });

          const document = generator.buildDocument(documents);
          const recs = document.recommendations;

          // Verify recommendations structure (Requirements 11.9)
          expect(Array.isArray(recs.immediateActions)).toBe(true);
          expect(Array.isArray(recs.shortTerm)).toBe(true);
          expect(Array.isArray(recs.longTerm)).toBe(true);

          for (const action of recs.immediateActions) {
            expect(typeof action.action).toBe('string');
            // effort is optional
          }

          for (const action of recs.shortTerm) {
            expect(typeof action.action).toBe('string');
          }

          for (const action of recs.longTerm) {
            expect(typeof action.action).toBe('string');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Requirements 11.10: Feature Quality Heatmap
   */
  it('should contain feature quality heatmap with scores', () => {
    fc.assert(
      fc.property(
        documentCountArb,
        featureCountArb,
        (docCount, featureCount) => {
          const documents = Array.from({ length: docCount }, (_, i) =>
            createMinimalAgreementDocument(`Component${i + 1}`, 'Component', featureCount)
          );

          const generator = new SummaryGenerator({
            projectName: 'Symphony IDE',
            basePath: '/test/project',
            writeFiles: false,
          });

          const document = generator.buildDocument(documents);
          const heatmap = document.heatmap;

          // Verify heatmap structure (Requirements 11.10)
          expect(heatmap.rows.length).toBe(docCount);

          for (const row of heatmap.rows) {
            expect(typeof row.component).toBe('string');
            expect(typeof row.enterprise).toBe('number');
            expect(typeof row.full).toBe('number');
            expect(typeof row.partial).toBe('number');
            expect(typeof row.notImplemented).toBe('number');
            expect(typeof row.score).toBe('number');
            expect(row.score).toBeGreaterThanOrEqual(0);
            expect(row.score).toBeLessThanOrEqual(10);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Verify markdown serialization contains all required sections
   */
  it('should generate valid markdown with all required sections', () => {
    fc.assert(
      fc.property(
        documentCountArb,
        featureCountArb,
        (docCount, featureCount) => {
          const documents = Array.from({ length: docCount }, (_, i) =>
            createMinimalAgreementDocument(`Component${i + 1}`, 'Component', featureCount)
          );

          const generator = new SummaryGenerator({
            projectName: 'Symphony IDE',
            basePath: '/test/project',
            writeFiles: false,
          });

          const document = generator.buildDocument(documents);
          const markdown = generator.serializeSummary(document);

          expect(markdown).toBeDefined();
          expect(markdown.length).toBeGreaterThan(0);

          // Check for required markdown sections
          expect(markdown).toContain('# Symphony IDE - Summary Evaluation Agreement');
          expect(markdown).toContain('## Executive Summary');
          expect(markdown).toContain('## Detailed Evaluation Table');
          expect(markdown).toContain('## Statistics by Category');
          expect(markdown).toContain('## Critical Issues');
          expect(markdown).toContain('## Common Anti-Patterns Across Project');
          expect(markdown).toContain('## Production Readiness by Component');
          expect(markdown).toContain('## Stress Collapse Summary');
          expect(markdown).toContain('## Recommendations');
          expect(markdown).toContain('## Feature Quality Heatmap');

          // Check for table headers
          expect(markdown).toContain('| Component/Package | Type | Feature Name |');
          expect(markdown).toContain('| Component/Package | Total Features | Enterprise |');
        }
      ),
      { numRuns: 100 }
    );
  });
});
