/**
 * Property-based tests for AGREEMENT.md Generator
 * 
 * **Feature: blind-evaluation-framework, Property 23: AGREEMENT.md creation**
 * **Validates: Requirements 10.1**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { AgreementGenerator } from '../../src/generators/AgreementGenerator';
import { MarkdownSerializer } from '../../src/serialization/MarkdownSerializer';
import type { FeatureIdentificationResult, AtomicFeature } from '../../types/evaluation';
import type { FeatureEvaluation } from '../../types/dimensions';

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

function createMinimalEvaluation(feature: AtomicFeature): FeatureEvaluation {
  return {
    feature,
    completeness: {
      rating: 'Full',
      percentage: 75,
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
      rating: 'Good',
      featureIsolation: 'isolated_module',
      antiPatterns: [],
      goodPractices: [],
      assessment: 'Good quality',
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
      rating: 'Medium',
      presentErrorHandling: [],
      missingErrorHandling: [],
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
      assessment: 'Medium reliability',
    },
    performance: {
      rating: 'Good',
      concerns: [],
      optimizations: [],
      complexityAnalysis: {
        algorithmicComplexity: 'O(n)',
        loopAnalysis: 'Single loop',
      },
      reRenderAnalysis: {
        hasUnnecessaryReRenders: false,
        issues: [],
      },
      assessment: 'Good performance',
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
      modularity: {
        featureLOC: 50,
        complexity: 'Low',
        dependencies: [],
      },
      modificationEase: 'single_file',
      testability: 'isolated',
      dependencies: [],
      assessment: 'High maintainability',
    },
    stressCollapse: {
      conditions: [],
      isRobust: true,
      robustReason: 'Simple feature',
    },
  };
}

function createMinimalFeatureIdResult(
  componentPath: string,
  componentType: 'Component' | 'Feature Package',
  featureCount: number
): FeatureIdentificationResult {
  const features = Array.from({ length: featureCount }, (_, i) => 
    createMinimalFeature(i + 1, `Feature${i + 1}`)
  );
  return {
    componentPath,
    componentType,
    identifiedFeatures: features,
    externalDependencies: [],
    totalLinesOfCode: featureCount * 50,
  };
}

const componentPathArb = fc.constantFrom(
  'packages/components/tab-bar',
  'packages/components/code-editor',
  'packages/features/src/AutoSave',
  'packages/ui/components'
);

const componentTypeArb = fc.constantFrom(
  'Component', 
  'Feature Package'
) as fc.Arbitrary<'Component' | 'Feature Package'>;

const featureCountArb = fc.integer({ min: 1, max: 5 });


describe('AGREEMENT.md Creation', () => {
  /**
   * **Feature: blind-evaluation-framework, Property 23: AGREEMENT.md creation**
   * **Validates: Requirements 10.1**
   */
  it('should generate AGREEMENT.md at the correct path for any component evaluation', () => {
    fc.assert(
      fc.property(
        componentPathArb,
        componentTypeArb,
        featureCountArb,
        (componentPath, componentType, featureCount) => {
          const featureIdResult = createMinimalFeatureIdResult(componentPath, componentType, featureCount);
          const evaluations = featureIdResult.identifiedFeatures.map(f => createMinimalEvaluation(f));

          const generator = new AgreementGenerator({
            basePath: '/test/base',
            writeFiles: false,
          });

          const document = generator.buildDocument(
            componentPath,
            componentPath.split('/').pop() || 'component',
            componentType,
            featureIdResult,
            evaluations
          );

          const filePath = generator.getOutputPath(componentPath);

          expect(filePath).toContain(componentPath);
          expect(filePath.endsWith('/AGREEMENT.md')).toBe(true);
          expect(filePath).toBe(`/test/base/${componentPath}/AGREEMENT.md`);
          expect(document).toBeDefined();
          expect(document.header).toBeDefined();
          expect(document.featureIdentification).toBeDefined();
          expect(document.featureEvaluations).toBeDefined();
          expect(document.componentSummary).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should create document with correct header for any component', () => {
    fc.assert(
      fc.property(
        componentPathArb,
        componentTypeArb,
        featureCountArb,
        (componentPath, componentType, featureCount) => {
          const featureIdResult = createMinimalFeatureIdResult(componentPath, componentType, featureCount);
          const evaluations = featureIdResult.identifiedFeatures.map(f => createMinimalEvaluation(f));

          const generator = new AgreementGenerator({
            basePath: '/test/base',
            writeFiles: false,
          });

          const componentName = componentPath.split('/').pop() || 'component';
          const document = generator.buildDocument(
            componentPath,
            componentName,
            componentType,
            featureIdResult,
            evaluations
          );

          expect(document.header.componentName).toBe(componentName);
          expect(document.header.type).toBe(componentType);
          expect(document.header.path).toBe(componentPath);
          expect(document.header.linesOfCode).toBe(featureIdResult.totalLinesOfCode);
          expect(document.header.evaluatedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include all identified features in the document', () => {
    fc.assert(
      fc.property(
        componentPathArb,
        componentTypeArb,
        featureCountArb,
        (componentPath, componentType, featureCount) => {
          const featureIdResult = createMinimalFeatureIdResult(componentPath, componentType, featureCount);
          const evaluations = featureIdResult.identifiedFeatures.map(f => createMinimalEvaluation(f));

          const generator = new AgreementGenerator({
            basePath: '/test/base',
            writeFiles: false,
          });

          const document = generator.buildDocument(
            componentPath,
            componentPath.split('/').pop() || 'component',
            componentType,
            featureIdResult,
            evaluations
          );

          expect(document.featureIdentification.totalFeatures).toBe(featureCount);
          expect(document.featureIdentification.featuresTable.length).toBe(featureCount);
          expect(document.featureEvaluations.length).toBe(featureCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate component summary with correct statistics', () => {
    fc.assert(
      fc.property(
        componentPathArb,
        componentTypeArb,
        featureCountArb,
        (componentPath, componentType, featureCount) => {
          const featureIdResult = createMinimalFeatureIdResult(componentPath, componentType, featureCount);
          const evaluations = featureIdResult.identifiedFeatures.map(f => createMinimalEvaluation(f));

          const generator = new AgreementGenerator({
            basePath: '/test/base',
            writeFiles: false,
          });

          const document = generator.buildDocument(
            componentPath,
            componentPath.split('/').pop() || 'component',
            componentType,
            featureIdResult,
            evaluations
          );

          expect(document.componentSummary.statistics.totalFeatures).toBe(featureCount);
          
          const { enterpriseLevel, fullImplementation, partialImplementation, notImplemented } = 
            document.componentSummary.statistics;
          expect(enterpriseLevel + fullImplementation + partialImplementation + notImplemented).toBe(featureCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle various component path formats correctly', () => {
    const pathVariants = [
      'packages/components/tab-bar',
      'packages/features/src/AutoSave',
      'packages/ui/components',
      'packages/primitives/src/core',
    ];

    for (const path of pathVariants) {
      const generator = new AgreementGenerator({
        basePath: '/project',
        writeFiles: false,
      });

      const filePath = generator.getOutputPath(path);
      expect(filePath).toBe(`/project/${path}/AGREEMENT.md`);
    }
  });

  it('should determine correct production readiness status', () => {
    fc.assert(
      fc.property(
        componentPathArb,
        componentTypeArb,
        featureCountArb,
        (componentPath, componentType, featureCount) => {
          const featureIdResult = createMinimalFeatureIdResult(componentPath, componentType, featureCount);
          const evaluations = featureIdResult.identifiedFeatures.map(f => createMinimalEvaluation(f));

          const generator = new AgreementGenerator({
            basePath: '/test/base',
            writeFiles: false,
          });

          const document = generator.buildDocument(
            componentPath,
            componentPath.split('/').pop() || 'component',
            componentType,
            featureIdResult,
            evaluations
          );

          const validStatuses = ['Production Ready', 'Staging Ready', 'Development', 'Not Ready'];
          expect(validStatuses).toContain(document.componentSummary.overallReadiness);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: blind-evaluation-framework, Property 24: AGREEMENT.md structure completeness**
 * **Validates: Requirements 10.2, 10.3, 10.4, 10.5**
 */
describe('AGREEMENT.md Structure Completeness', () => {
  /**
   * Property 24: AGREEMENT.md structure completeness
   * For any generated AGREEMENT.md file, the document SHALL contain:
   * - header section (component name, type, date, path, LOC)
   * - atomic feature identification section (methodology, features table, total count, external dependencies)
   * - feature-by-feature evaluation section (all 8 dimensions for each feature)
   * - component-level summary section (statistics, issues, strengths, actions, readiness status)
   */
  it('should contain complete header section for any component', () => {
    fc.assert(
      fc.property(
        componentPathArb,
        componentTypeArb,
        featureCountArb,
        (componentPath, componentType, featureCount) => {
          const featureIdResult = createMinimalFeatureIdResult(componentPath, componentType, featureCount);
          const evaluations = featureIdResult.identifiedFeatures.map(f => createMinimalEvaluation(f));

          const generator = new AgreementGenerator({
            basePath: '/test/base',
            writeFiles: false,
          });

          const componentName = componentPath.split('/').pop() || 'component';
          const document = generator.buildDocument(
            componentPath,
            componentName,
            componentType,
            featureIdResult,
            evaluations
          );

          // Verify header section completeness (Requirements 10.2)
          expect(document.header).toBeDefined();
          expect(document.header.componentName).toBe(componentName);
          expect(['Component', 'Feature Package']).toContain(document.header.type);
          expect(document.header.evaluatedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          expect(document.header.path).toBe(componentPath);
          expect(typeof document.header.linesOfCode).toBe('number');
          expect(document.header.linesOfCode).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should contain complete atomic feature identification section', () => {
    fc.assert(
      fc.property(
        componentPathArb,
        componentTypeArb,
        featureCountArb,
        (componentPath, componentType, featureCount) => {
          const featureIdResult = createMinimalFeatureIdResult(componentPath, componentType, featureCount);
          const evaluations = featureIdResult.identifiedFeatures.map(f => createMinimalEvaluation(f));

          const generator = new AgreementGenerator({
            basePath: '/test/base',
            writeFiles: false,
          });

          const document = generator.buildDocument(
            componentPath,
            componentPath.split('/').pop() || 'component',
            componentType,
            featureIdResult,
            evaluations
          );

          // Verify feature identification section completeness (Requirements 10.3)
          const featureId = document.featureIdentification;
          expect(featureId).toBeDefined();
          
          // Methodology should have 4 steps
          expect(featureId.methodology).toBeDefined();
          expect(Array.isArray(featureId.methodology)).toBe(true);
          expect(featureId.methodology.length).toBe(4);
          
          // Features table should have all features
          expect(featureId.featuresTable).toBeDefined();
          expect(Array.isArray(featureId.featuresTable)).toBe(true);
          expect(featureId.featuresTable.length).toBe(featureCount);
          
          // Each feature in table should have required fields
          for (const feature of featureId.featuresTable) {
            expect(typeof feature.id).toBe('number');
            expect(typeof feature.name).toBe('string');
            expect(typeof feature.description).toBe('string');
            expect(typeof feature.linesOfCode).toBe('number');
            expect(feature.primaryLocation).toBeDefined();
            expect(typeof feature.primaryLocation.file).toBe('string');
            expect(typeof feature.primaryLocation.startLine).toBe('number');
            expect(typeof feature.primaryLocation.endLine).toBe('number');
          }
          
          // Total features count
          expect(featureId.totalFeatures).toBe(featureCount);
          
          // External dependencies should be an array
          expect(Array.isArray(featureId.externalDependencies)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should contain all 8 evaluation dimensions for each feature', () => {
    fc.assert(
      fc.property(
        componentPathArb,
        componentTypeArb,
        featureCountArb,
        (componentPath, componentType, featureCount) => {
          const featureIdResult = createMinimalFeatureIdResult(componentPath, componentType, featureCount);
          const evaluations = featureIdResult.identifiedFeatures.map(f => createMinimalEvaluation(f));

          const generator = new AgreementGenerator({
            basePath: '/test/base',
            writeFiles: false,
          });

          const document = generator.buildDocument(
            componentPath,
            componentPath.split('/').pop() || 'component',
            componentType,
            featureIdResult,
            evaluations
          );

          // Verify feature-by-feature evaluation section (Requirements 10.4)
          expect(document.featureEvaluations).toBeDefined();
          expect(document.featureEvaluations.length).toBe(featureCount);

          for (const evaluation of document.featureEvaluations) {
            // Dimension 1: Completeness
            expect(evaluation.completeness).toBeDefined();
            expect(['Not Implemented', 'Partial', 'Full', 'Enterprise-Level']).toContain(evaluation.completeness.rating);
            expect(typeof evaluation.completeness.percentage).toBe('number');
            
            // Dimension 2: Code Quality
            expect(evaluation.codeQuality).toBeDefined();
            expect(['Poor', 'Basic', 'Good', 'Excellent']).toContain(evaluation.codeQuality.rating);
            expect(['isolated_module', 'same_file_separated', 'mixed_with_other', 'scattered_files']).toContain(evaluation.codeQuality.featureIsolation);
            
            // Dimension 3: Documentation
            expect(evaluation.documentation).toBeDefined();
            expect(['None', 'Basic', 'Good', 'Excellent']).toContain(evaluation.documentation.rating);
            expect(evaluation.documentation.coverage).toBeDefined();
            
            // Dimension 4: Reliability
            expect(evaluation.reliability).toBeDefined();
            expect(['Low', 'Medium', 'High', 'Enterprise-Level']).toContain(evaluation.reliability.rating);
            
            // Dimension 5: Performance
            expect(evaluation.performance).toBeDefined();
            expect(['Poor', 'Acceptable', 'Good', 'Excellent']).toContain(evaluation.performance.rating);
            
            // Dimension 6: Integration
            expect(evaluation.integration).toBeDefined();
            expect(['Not Compatible', 'Partial', 'Full', 'Enterprise-Level']).toContain(evaluation.integration.rating);
            
            // Dimension 7: Maintenance
            expect(evaluation.maintenance).toBeDefined();
            expect(['Low', 'Medium', 'High', 'Enterprise-Level']).toContain(evaluation.maintenance.rating);
            
            // Dimension 8: Stress Collapse
            expect(evaluation.stressCollapse).toBeDefined();
            expect(typeof evaluation.stressCollapse.isRobust).toBe('boolean');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should contain complete component-level summary section', () => {
    fc.assert(
      fc.property(
        componentPathArb,
        componentTypeArb,
        featureCountArb,
        (componentPath, componentType, featureCount) => {
          const featureIdResult = createMinimalFeatureIdResult(componentPath, componentType, featureCount);
          const evaluations = featureIdResult.identifiedFeatures.map(f => createMinimalEvaluation(f));

          const generator = new AgreementGenerator({
            basePath: '/test/base',
            writeFiles: false,
          });

          const document = generator.buildDocument(
            componentPath,
            componentPath.split('/').pop() || 'component',
            componentType,
            featureIdResult,
            evaluations
          );

          // Verify component-level summary section (Requirements 10.5)
          const summary = document.componentSummary;
          expect(summary).toBeDefined();
          
          // Statistics
          expect(summary.statistics).toBeDefined();
          expect(typeof summary.statistics.totalFeatures).toBe('number');
          expect(typeof summary.statistics.enterpriseLevel).toBe('number');
          expect(typeof summary.statistics.fullImplementation).toBe('number');
          expect(typeof summary.statistics.partialImplementation).toBe('number');
          expect(typeof summary.statistics.notImplemented).toBe('number');
          
          // Statistics should sum to total features
          const statsSum = summary.statistics.enterpriseLevel + 
                          summary.statistics.fullImplementation + 
                          summary.statistics.partialImplementation + 
                          summary.statistics.notImplemented;
          expect(statsSum).toBe(summary.statistics.totalFeatures);
          
          // Critical issues (array)
          expect(Array.isArray(summary.criticalIssues)).toBe(true);
          
          // Strengths (array)
          expect(Array.isArray(summary.strengths)).toBe(true);
          
          // Recommended actions (array with priority)
          expect(Array.isArray(summary.recommendedActions)).toBe(true);
          for (const action of summary.recommendedActions) {
            expect(['High', 'Medium', 'Low']).toContain(action.priority);
            expect(typeof action.action).toBe('string');
          }
          
          // Overall readiness status
          expect(['Production Ready', 'Staging Ready', 'Development', 'Not Ready']).toContain(summary.overallReadiness);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate valid markdown with all required sections', () => {
    fc.assert(
      fc.property(
        componentPathArb,
        componentTypeArb,
        featureCountArb,
        (componentPath, componentType, featureCount) => {
          const featureIdResult = createMinimalFeatureIdResult(componentPath, componentType, featureCount);
          const evaluations = featureIdResult.identifiedFeatures.map(f => createMinimalEvaluation(f));

          const generator = new AgreementGenerator({
            basePath: '/test/base',
            writeFiles: false,
          });

          // Use synchronous buildDocument and serialize directly
          const document = generator.buildDocument(
            componentPath,
            componentPath.split('/').pop() || 'component',
            componentType,
            featureIdResult,
            evaluations
          );

          const markdown = MarkdownSerializer.serializeAgreement(document);

          expect(markdown).toBeDefined();
          expect(markdown.length).toBeGreaterThan(0);
          
          // Check for required markdown sections
          // Header section
          expect(markdown).toContain('# ');
          expect(markdown).toContain('**Type:**');
          expect(markdown).toContain('**Evaluated:**');
          expect(markdown).toContain('**Path:**');
          expect(markdown).toContain('**Lines of Code:**');
          
          // Feature identification section
          expect(markdown).toContain('## Atomic Feature Identification');
          expect(markdown).toContain('**Methodology:**');
          expect(markdown).toContain('**Identified Atomic Features:**');
          expect(markdown).toContain('| # | Feature Name | Description | LOC | Primary Location |');
          expect(markdown).toContain('**Total Atomic Features Identified:**');
          
          // Feature evaluation section
          expect(markdown).toContain('## Feature-by-Feature Evaluation');
          
          // Each feature should have all 8 dimensions
          for (let i = 1; i <= featureCount; i++) {
            expect(markdown).toContain(`### Feature ${i}:`);
            expect(markdown).toContain(`#### ${i}.1 Feature Completeness:`);
            expect(markdown).toContain(`#### ${i}.2 Code Quality / Maintainability:`);
            expect(markdown).toContain(`#### ${i}.3 Documentation & Comments:`);
            expect(markdown).toContain(`#### ${i}.4 Reliability / Fault-Tolerance:`);
            expect(markdown).toContain(`#### ${i}.5 Performance & Efficiency:`);
            expect(markdown).toContain(`#### ${i}.6 Integration & Extensibility:`);
            expect(markdown).toContain(`#### ${i}.7 Maintenance & Support:`);
            expect(markdown).toContain(`#### ${i}.8 Stress Collapse Estimation:`);
          }
          
          // Component summary section
          expect(markdown).toContain('## Component-Level Summary');
          expect(markdown).toContain('**Overall Statistics:**');
          expect(markdown).toContain('**Overall Component Readiness:**');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use proper heading hierarchy in generated markdown', () => {
    fc.assert(
      fc.property(
        componentPathArb,
        componentTypeArb,
        featureCountArb,
        (componentPath, componentType, featureCount) => {
          const featureIdResult = createMinimalFeatureIdResult(componentPath, componentType, featureCount);
          const evaluations = featureIdResult.identifiedFeatures.map(f => createMinimalEvaluation(f));

          const generator = new AgreementGenerator({
            basePath: '/test/base',
            writeFiles: false,
          });

          // Use synchronous buildDocument and serialize directly
          const document = generator.buildDocument(
            componentPath,
            componentPath.split('/').pop() || 'component',
            componentType,
            featureIdResult,
            evaluations
          );

          const markdown = MarkdownSerializer.serializeAgreement(document);
          
          // Check heading hierarchy (Requirements 10.6)
          // # for title
          expect(markdown).toMatch(/^# .+ - Evaluation Agreement/m);
          
          // ## for major sections
          expect(markdown).toMatch(/^## Atomic Feature Identification/m);
          expect(markdown).toMatch(/^## Feature-by-Feature Evaluation/m);
          expect(markdown).toMatch(/^## Component-Level Summary/m);
          
          // ### for features
          for (let i = 1; i <= featureCount; i++) {
            expect(markdown).toMatch(new RegExp(`^### Feature ${i}:`, 'm'));
          }
          
          // #### for dimensions
          expect(markdown).toMatch(/^#### \d+\.1 Feature Completeness:/m);
          expect(markdown).toMatch(/^#### \d+\.2 Code Quality/m);
          expect(markdown).toMatch(/^#### \d+\.3 Documentation/m);
          expect(markdown).toMatch(/^#### \d+\.4 Reliability/m);
          expect(markdown).toMatch(/^#### \d+\.5 Performance/m);
          expect(markdown).toMatch(/^#### \d+\.6 Integration/m);
          expect(markdown).toMatch(/^#### \d+\.7 Maintenance/m);
          expect(markdown).toMatch(/^#### \d+\.8 Stress Collapse/m);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include horizontal rules between features', () => {
    fc.assert(
      fc.property(
        componentPathArb,
        componentTypeArb,
        fc.integer({ min: 2, max: 5 }), // Need at least 2 features to check rules between them
        (componentPath, componentType, featureCount) => {
          const featureIdResult = createMinimalFeatureIdResult(componentPath, componentType, featureCount);
          const evaluations = featureIdResult.identifiedFeatures.map(f => createMinimalEvaluation(f));

          const generator = new AgreementGenerator({
            basePath: '/test/base',
            writeFiles: false,
          });

          // Use synchronous buildDocument and serialize directly
          const document = generator.buildDocument(
            componentPath,
            componentPath.split('/').pop() || 'component',
            componentType,
            featureIdResult,
            evaluations
          );

          const markdown = MarkdownSerializer.serializeAgreement(document);
          
          // Count horizontal rules (---)
          const hrCount = (markdown.match(/^---$/gm) || []).length;
          
          // Should have horizontal rules:
          // - After header
          // - After feature identification
          // - Before each feature
          // - Between dimensions within features
          // - Before component summary
          // Minimum expected: at least 2 (after header, after feature id) + featureCount (before each feature)
          expect(hrCount).toBeGreaterThanOrEqual(2 + featureCount);
        }
      ),
      { numRuns: 100 }
    );
  });
});
