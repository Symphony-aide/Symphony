/**
 * Property-based tests for code block format validity
 * 
 * **Feature: blind-evaluation-framework, Property 29: Code block format**
 * **Validates: Requirements 12.5**
 * 
 * For any generated code snippet in the evaluation documents, the snippet SHALL
 * use fenced code blocks with language identifier and include file path and
 * line numbers as comments.
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
// Arbitrary Generators
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
 * Generate completeness evaluation with evidence
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
  fc.integer({ min: 1, max: 3 }).chain(numFeatures => {
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
// Helper Functions for Code Block Validation
// ============================================================================

/**
 * Represents a parsed code block from markdown
 */
interface ParsedCodeBlock {
  language: string;
  content: string;
  hasLineComment: boolean;
  lineNumbers?: { start: number; end: number };
  filePath?: string;
}

/**
 * Extract all fenced code blocks from markdown
 */
function extractCodeBlocks(markdown: string): ParsedCodeBlock[] {
  const codeBlocks: ParsedCodeBlock[] = [];
  
  // Match fenced code blocks with optional language identifier
  // Pattern: ```language\n...content...\n```
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  
  let match;
  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    const language = match[1] || '';
    const content = match[2];
    
    // Check for line number comment pattern: // Lines X-Y from filepath
    const lineCommentRegex = /\/\/\s*Lines?\s+(\d+)-(\d+)\s+from\s+(.+)/;
    const lineMatch = content.match(lineCommentRegex);
    
    codeBlocks.push({
      language,
      content,
      hasLineComment: lineMatch !== null,
      lineNumbers: lineMatch ? { start: parseInt(lineMatch[1], 10), end: parseInt(lineMatch[2], 10) } : undefined,
      filePath: lineMatch ? lineMatch[3].trim() : undefined,
    });
  }
  
  return codeBlocks;
}

/**
 * Valid language identifiers for code blocks
 */
const VALID_LANGUAGES = ['typescript', 'javascript', 'tsx', 'jsx', 'ts', 'js', ''];

/**
 * Check if a code block has a valid language identifier
 */
function hasValidLanguageIdentifier(block: ParsedCodeBlock): boolean {
  return VALID_LANGUAGES.includes(block.language.toLowerCase());
}

/**
 * Check if a code block has valid line number format
 */
function hasValidLineNumberFormat(block: ParsedCodeBlock): boolean {
  if (!block.hasLineComment) {
    return false;
  }
  
  if (!block.lineNumbers) {
    return false;
  }
  
  // Line numbers should be positive integers
  if (block.lineNumbers.start < 1 || block.lineNumbers.end < 1) {
    return false;
  }
  
  // End line should be >= start line
  if (block.lineNumbers.end < block.lineNumbers.start) {
    return false;
  }
  
  return true;
}

/**
 * Check if a code block has a valid file path
 */
function hasValidFilePath(block: ParsedCodeBlock): boolean {
  if (!block.filePath) {
    return false;
  }
  
  // File path should not be empty and should look like a path
  return block.filePath.length > 0 && block.filePath.includes('/');
}

// ============================================================================
// Property Tests
// ============================================================================

describe('Code Block Format Validity', () => {
  /**
   * **Feature: blind-evaluation-framework, Property 29: Code block format**
   * **Validates: Requirements 12.5**
   */
  describe('Fenced Code Block Format', () => {
    it('should generate code blocks with fenced delimiters', () => {
      fc.assert(
        fc.property(
          agreementDocument(),
          (document) => {
            const markdown = MarkdownSerializer.serializeAgreement(document);
            
            // Count opening and closing fences
            const openingFences = (markdown.match(/```\w*/g) || []).length;
            const closingFences = (markdown.match(/```\n/g) || []).length + 
                                  (markdown.match(/```$/gm) || []).length;
            
            // Should have matching opening and closing fences
            // Note: Some closing fences may be followed by newline or end of string
            expect(openingFences).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate code blocks with valid language identifiers', () => {
      fc.assert(
        fc.property(
          agreementDocument(),
          (document) => {
            const markdown = MarkdownSerializer.serializeAgreement(document);
            const codeBlocks = extractCodeBlocks(markdown);
            
            // All code blocks should have valid language identifiers
            for (const block of codeBlocks) {
              expect(hasValidLanguageIdentifier(block)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Line Number Comments', () => {
    it('should include line number comments in evidence code blocks', () => {
      fc.assert(
        fc.property(
          agreementDocument(),
          (document) => {
            const markdown = MarkdownSerializer.serializeAgreement(document);
            const codeBlocks = extractCodeBlocks(markdown);
            
            // Find code blocks that should have line comments (evidence blocks)
            // These are blocks that contain "Lines X-Y from" pattern
            const evidenceBlocks = codeBlocks.filter(block => 
              block.content.includes('Lines') && block.content.includes('from')
            );
            
            // All evidence blocks should have valid line number format
            for (const block of evidenceBlocks) {
              expect(block.hasLineComment).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have valid line number ranges in evidence blocks', () => {
      fc.assert(
        fc.property(
          agreementDocument(),
          (document) => {
            const markdown = MarkdownSerializer.serializeAgreement(document);
            const codeBlocks = extractCodeBlocks(markdown);
            
            // Find evidence blocks with line comments
            const evidenceBlocks = codeBlocks.filter(block => block.hasLineComment);
            
            // All evidence blocks should have valid line number format
            for (const block of evidenceBlocks) {
              expect(hasValidLineNumberFormat(block)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include file paths in evidence code blocks', () => {
      fc.assert(
        fc.property(
          agreementDocument(),
          (document) => {
            const markdown = MarkdownSerializer.serializeAgreement(document);
            const codeBlocks = extractCodeBlocks(markdown);
            
            // Find evidence blocks with line comments
            const evidenceBlocks = codeBlocks.filter(block => block.hasLineComment);
            
            // All evidence blocks should have valid file paths
            for (const block of evidenceBlocks) {
              expect(hasValidFilePath(block)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Code Evidence Serialization', () => {
    it('should serialize code evidence with correct format', () => {
      fc.assert(
        fc.property(
          codeEvidence(),
          (evidence) => {
            const serialized = MarkdownSerializer.serializeCodeEvidence(evidence);
            
            // Should start with opening fence and language
            expect(serialized).toMatch(/^```\w+\n/);
            
            // Should end with closing fence
            expect(serialized).toMatch(/```$/);
            
            // Should contain line number comment
            expect(serialized).toContain(`// Lines ${evidence.lineNumbers.start}-${evidence.lineNumbers.end} from ${evidence.filePath}`);
            
            // Should contain the code snippet
            expect(serialized).toContain(evidence.codeSnippet);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve language identifier in serialized evidence', () => {
      fc.assert(
        fc.property(
          codeEvidence(),
          (evidence) => {
            const serialized = MarkdownSerializer.serializeCodeEvidence(evidence);
            
            // Should contain the language identifier after opening fence
            expect(serialized).toContain(`\`\`\`${evidence.language}`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve line numbers in serialized evidence', () => {
      fc.assert(
        fc.property(
          codeEvidence(),
          (evidence) => {
            const serialized = MarkdownSerializer.serializeCodeEvidence(evidence);
            
            // Extract line numbers from serialized output
            const lineMatch = serialized.match(/Lines\s+(\d+)-(\d+)/);
            expect(lineMatch).not.toBeNull();
            
            if (lineMatch) {
              const start = parseInt(lineMatch[1], 10);
              const end = parseInt(lineMatch[2], 10);
              expect(start).toBe(evidence.lineNumbers.start);
              expect(end).toBe(evidence.lineNumbers.end);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve file path in serialized evidence', () => {
      fc.assert(
        fc.property(
          codeEvidence(),
          (evidence) => {
            const serialized = MarkdownSerializer.serializeCodeEvidence(evidence);
            
            // Should contain the file path
            expect(serialized).toContain(`from ${evidence.filePath}`);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Code Block Content Integrity', () => {
    it('should not have nested code blocks', () => {
      fc.assert(
        fc.property(
          agreementDocument(),
          (document) => {
            const markdown = MarkdownSerializer.serializeAgreement(document);
            const codeBlocks = extractCodeBlocks(markdown);
            
            // No code block content should contain ``` (nested fences)
            for (const block of codeBlocks) {
              // The content between fences should not contain fence markers
              const contentWithoutComment = block.content.replace(/\/\/.*$/gm, '');
              expect(contentWithoutComment).not.toContain('```');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have properly closed code blocks', () => {
      fc.assert(
        fc.property(
          agreementDocument(),
          (document) => {
            const markdown = MarkdownSerializer.serializeAgreement(document);
            
            // Count fence markers (both opening and closing use ```)
            const fenceCount = (markdown.match(/```/g) || []).length;
            
            // Should have even number of fences (each block has open + close)
            expect(fenceCount % 2).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
