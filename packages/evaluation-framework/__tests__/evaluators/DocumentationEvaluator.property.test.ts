/**
 * Property-based tests for DocumentationEvaluator
 * 
 * Tests for Properties 11 and 12 from the design document.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  DocumentationEvaluator,
  DocumentationCoverageChecker,
  DocumentationExamplesGenerator,
  getValidDocumentationRatings,
  createDefaultAnalysis,
  createDocumentationCoverage,
  isValidDocumentationEvaluation,
  type DocumentationAnalysisResult,
} from '../../src/evaluators/DocumentationEvaluator';
import type { AtomicFeature, CodeEvidence } from '../../types/evaluation';
import type { DocumentationCoverage } from '../../types/dimensions';

// ============================================================================
// Arbitrary Generators
// ============================================================================

/**
 * Generate a safe string for names and descriptions
 */
const safeString = (minLength = 1, maxLength = 30) =>
  fc.string({ minLength, maxLength }).filter(s => s.trim().length > 0);

/**
 * Generate a valid file path
 */
const filePath = () =>
  fc.tuple(
    fc.constantFrom('src', 'components', 'features'),
    fc.string({ minLength: 3, maxLength: 15 }).filter(s => /^[a-zA-Z]+$/.test(s)),
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
    codeSnippet: fc.string({ minLength: 10, maxLength: 100 }),
    language: fc.constantFrom('typescript', 'javascript'),
  });

/**
 * Generate an atomic feature
 */
const atomicFeature = (): fc.Arbitrary<AtomicFeature> =>
  fc.record({
    id: fc.integer({ min: 1, max: 100 }),
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
 * Generate documentation coverage
 */
const documentationCoverage = (): fc.Arbitrary<DocumentationCoverage> =>
  fc.record({
    hasJSDoc: fc.boolean(),
    hasInlineComments: fc.boolean(),
    hasSelfDocumentingNames: fc.boolean(),
    hasUsageExamples: fc.boolean(),
    hasEdgeCaseDocs: fc.boolean(),
  });

/**
 * Generate documentation analysis result
 */
const documentationAnalysisResult = (): fc.Arbitrary<DocumentationAnalysisResult> =>
  fc.record({
    totalFunctions: fc.integer({ min: 0, max: 50 }),
    documentedFunctions: fc.integer({ min: 0, max: 50 }),
    commentedComplexBlocks: fc.integer({ min: 0, max: 20 }),
    totalComplexBlocks: fc.integer({ min: 0, max: 20 }),
    selfDocumentingFunctions: fc.integer({ min: 0, max: 50 }),
    hasUsageExamples: fc.boolean(),
    hasEdgeCaseDocs: fc.boolean(),
    goodExamples: fc.array(codeEvidence(), { minLength: 0, maxLength: 3 }),
    missingExamples: fc.array(codeEvidence(), { minLength: 0, maxLength: 3 }),
  }).map(result => ({
    ...result,
    // Ensure documented functions don't exceed total
    documentedFunctions: Math.min(result.documentedFunctions, result.totalFunctions),
    // Ensure commented blocks don't exceed total
    commentedComplexBlocks: Math.min(result.commentedComplexBlocks, result.totalComplexBlocks),
    // Ensure self-documenting functions don't exceed total
    selfDocumentingFunctions: Math.min(result.selfDocumentingFunctions, result.totalFunctions),
  }));

// ============================================================================
// Property 11: Documentation Rating Validity Tests
// ============================================================================

describe('DocumentationEvaluator Property Tests', () => {
  const evaluator = new DocumentationEvaluator();

  /**
   * **Feature: blind-evaluation-framework, Property 11: Documentation rating validity**
   * **Validates: Requirements 4.1**
   */
  describe('Property 11: Documentation rating validity', () => {
    it('should assign valid documentation ratings from the allowed set', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          documentationAnalysisResult(),
          (feature, analysis) => {
            const evaluation = evaluator.evaluate(feature, analysis);
            
            const validRatings = getValidDocumentationRatings();
            expect(validRatings).toContain(evaluation.rating);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return exactly one of: None, Basic, Good, or Excellent', () => {
      fc.assert(
        fc.property(
          documentationCoverage(),
          documentationAnalysisResult(),
          (coverage, analysis) => {
            const rating = evaluator.determineRating(coverage, analysis);
            
            expect(['None', 'Basic', 'Good', 'Excellent']).toContain(rating);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate ratings correctly via isValidRating', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('None', 'Basic', 'Good', 'Excellent'),
          (rating) => {
            expect(evaluator.isValidRating(rating)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid ratings via isValidRating', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => !['None', 'Basic', 'Good', 'Excellent'].includes(s)),
          (invalidRating) => {
            expect(evaluator.isValidRating(invalidRating)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate non-empty assessment for any evaluation', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          documentationAnalysisResult(),
          (feature, analysis) => {
            const evaluation = evaluator.evaluate(feature, analysis);
            
            expect(evaluation.assessment).toBeTruthy();
            expect(evaluation.assessment.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include feature name in assessment', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          documentationAnalysisResult(),
          (feature, analysis) => {
            const evaluation = evaluator.evaluate(feature, analysis);
            
            expect(evaluation.assessment).toContain(feature.name);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve examples in evaluation', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          documentationAnalysisResult(),
          (feature, analysis) => {
            const evaluation = evaluator.evaluate(feature, analysis);
            
            expect(evaluation.examples.goodDocumentation.length).toBe(analysis.goodExamples.length);
            expect(evaluation.examples.missingDocumentation.length).toBe(analysis.missingExamples.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce valid evaluation via isValidDocumentationEvaluation', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          documentationAnalysisResult(),
          (feature, analysis) => {
            const evaluation = evaluator.evaluate(feature, analysis);
            
            expect(isValidDocumentationEvaluation(evaluation)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


// ============================================================================
// Property 12: Documentation Coverage Checkboxes Tests
// ============================================================================

describe('DocumentationCoverageChecker Property Tests', () => {
  const checker = new DocumentationCoverageChecker();

  /**
   * **Feature: blind-evaluation-framework, Property 12: Documentation coverage checkboxes**
   * **Validates: Requirements 4.2, 4.3, 4.4, 4.5**
   */
  describe('Property 12: Documentation coverage checkboxes', () => {
    it('should include all 5 boolean checkboxes in coverage', () => {
      fc.assert(
        fc.property(
          documentationCoverage(),
          (coverage) => {
            // Verify all 5 boolean fields exist
            expect(typeof coverage.hasJSDoc).toBe('boolean');
            expect(typeof coverage.hasInlineComments).toBe('boolean');
            expect(typeof coverage.hasSelfDocumentingNames).toBe('boolean');
            expect(typeof coverage.hasUsageExamples).toBe('boolean');
            expect(typeof coverage.hasEdgeCaseDocs).toBe('boolean');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate coverage correctly via isValidCoverage', () => {
      fc.assert(
        fc.property(
          documentationCoverage(),
          (coverage) => {
            expect(checker.isValidCoverage(coverage)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format checkboxes with exactly 5 items', () => {
      fc.assert(
        fc.property(
          documentationCoverage(),
          (coverage) => {
            const formatted = checker.formatAsCheckboxes(coverage);
            
            // Count checkbox lines
            const lines = formatted.split('\n').filter(line => line.startsWith('- ['));
            expect(lines.length).toBe(5);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format checkboxes with correct checked/unchecked state', () => {
      fc.assert(
        fc.property(
          documentationCoverage(),
          (coverage) => {
            const formatted = checker.formatAsCheckboxes(coverage);
            
            // Count checked and unchecked boxes
            const checkedCount = (formatted.match(/\[x\]/g) || []).length;
            const uncheckedCount = (formatted.match(/\[ \]/g) || []).length;
            
            // Total should be 5
            expect(checkedCount + uncheckedCount).toBe(5);
            
            // Count of true values should match checked count
            const trueCount = [
              coverage.hasJSDoc,
              coverage.hasInlineComments,
              coverage.hasSelfDocumentingNames,
              coverage.hasUsageExamples,
              coverage.hasEdgeCaseDocs,
            ].filter(Boolean).length;
            
            expect(checkedCount).toBe(trueCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include JSDoc checkbox label', () => {
      fc.assert(
        fc.property(
          documentationCoverage(),
          (coverage) => {
            const formatted = checker.formatAsCheckboxes(coverage);
            expect(formatted).toContain('JSDoc/TSDoc comments on feature functions');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include inline comments checkbox label', () => {
      fc.assert(
        fc.property(
          documentationCoverage(),
          (coverage) => {
            const formatted = checker.formatAsCheckboxes(coverage);
            expect(formatted).toContain('Inline comments explaining complex logic');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include self-documenting names checkbox label', () => {
      fc.assert(
        fc.property(
          documentationCoverage(),
          (coverage) => {
            const formatted = checker.formatAsCheckboxes(coverage);
            expect(formatted).toContain('Self-documenting variable/function names');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include usage examples checkbox label', () => {
      fc.assert(
        fc.property(
          documentationCoverage(),
          (coverage) => {
            const formatted = checker.formatAsCheckboxes(coverage);
            expect(formatted).toContain('Usage examples');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include edge cases checkbox label', () => {
      fc.assert(
        fc.property(
          documentationCoverage(),
          (coverage) => {
            const formatted = checker.formatAsCheckboxes(coverage);
            expect(formatted).toContain('Edge cases documented');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should create valid coverage via createDocumentationCoverage helper', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          fc.boolean(),
          fc.boolean(),
          fc.boolean(),
          fc.boolean(),
          (hasJSDoc, hasInlineComments, hasSelfDocumentingNames, hasUsageExamples, hasEdgeCaseDocs) => {
            const coverage = createDocumentationCoverage(
              hasJSDoc,
              hasInlineComments,
              hasSelfDocumentingNames,
              hasUsageExamples,
              hasEdgeCaseDocs
            );
            
            expect(checker.isValidCoverage(coverage)).toBe(true);
            expect(coverage.hasJSDoc).toBe(hasJSDoc);
            expect(coverage.hasInlineComments).toBe(hasInlineComments);
            expect(coverage.hasSelfDocumentingNames).toBe(hasSelfDocumentingNames);
            expect(coverage.hasUsageExamples).toBe(hasUsageExamples);
            expect(coverage.hasEdgeCaseDocs).toBe(hasEdgeCaseDocs);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


// ============================================================================
// Documentation Examples Generator Tests
// ============================================================================

describe('DocumentationExamplesGenerator Property Tests', () => {
  const generator = new DocumentationExamplesGenerator();

  describe('Documentation examples generation', () => {
    it('should format good examples with FOUND marker', () => {
      fc.assert(
        fc.property(
          fc.array(codeEvidence(), { minLength: 1, maxLength: 3 }),
          (examples) => {
            const formatted = generator.formatGoodExamples(examples);
            
            expect(formatted).toContain('// FOUND: Good documentation');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format missing examples with MISSING marker', () => {
      fc.assert(
        fc.property(
          fc.array(codeEvidence(), { minLength: 1, maxLength: 3 }),
          (examples) => {
            const formatted = generator.formatMissingExamples(examples);
            
            expect(formatted).toContain('// MISSING: No explanation');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include file path and line numbers in formatted examples', () => {
      fc.assert(
        fc.property(
          fc.array(codeEvidence(), { minLength: 1, maxLength: 1 }),
          (examples) => {
            const formatted = generator.formatGoodExamples(examples);
            const example = examples[0];
            
            expect(formatted).toContain(example.filePath);
            expect(formatted).toContain(`${example.lineNumbers.start}`);
            expect(formatted).toContain(`${example.lineNumbers.end}`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include code snippet in formatted examples', () => {
      fc.assert(
        fc.property(
          fc.array(codeEvidence(), { minLength: 1, maxLength: 1 }),
          (examples) => {
            const formatted = generator.formatGoodExamples(examples);
            const example = examples[0];
            
            expect(formatted).toContain(example.codeSnippet);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return appropriate message for empty good examples', () => {
      const formatted = generator.formatGoodExamples([]);
      expect(formatted).toBe('No good documentation examples found.');
    });

    it('should return appropriate message for empty missing examples', () => {
      const formatted = generator.formatMissingExamples([]);
      expect(formatted).toBe('No missing documentation issues found.');
    });

    it('should create valid good example via createGoodExample', () => {
      fc.assert(
        fc.property(
          filePath(),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          safeString(10, 50),
          fc.constantFrom('javascript', 'typescript'),
          (path, startLine, offset, snippet, language) => {
            const endLine = startLine + offset;
            const example = generator.createGoodExample(path, startLine, endLine, snippet, language);
            
            expect(example.filePath).toBe(path);
            expect(example.lineNumbers.start).toBe(startLine);
            expect(example.lineNumbers.end).toBe(endLine);
            expect(example.codeSnippet).toBe(snippet);
            expect(example.language).toBe(language);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should create valid missing example via createMissingExample', () => {
      fc.assert(
        fc.property(
          filePath(),
          fc.integer({ min: 1, max: 100 }),
          safeString(10, 50),
          fc.constantFrom('javascript', 'typescript'),
          (path, line, snippet, language) => {
            const example = generator.createMissingExample(path, line, snippet, language);
            
            expect(example.filePath).toBe(path);
            expect(example.lineNumbers.start).toBe(line);
            expect(example.lineNumbers.end).toBe(line);
            expect(example.codeSnippet).toBe(snippet);
            expect(example.language).toBe(language);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


// ============================================================================
// Helper Function Tests
// ============================================================================

describe('Documentation Evaluator Helper Functions', () => {
  describe('getValidDocumentationRatings', () => {
    it('should return exactly 4 valid ratings', () => {
      const ratings = getValidDocumentationRatings();
      expect(ratings.length).toBe(4);
    });

    it('should include all expected ratings', () => {
      const ratings = getValidDocumentationRatings();
      expect(ratings).toContain('None');
      expect(ratings).toContain('Basic');
      expect(ratings).toContain('Good');
      expect(ratings).toContain('Excellent');
    });
  });

  describe('createDefaultAnalysis', () => {
    it('should create analysis with zero counts', () => {
      const analysis = createDefaultAnalysis();
      
      expect(analysis.totalFunctions).toBe(0);
      expect(analysis.documentedFunctions).toBe(0);
      expect(analysis.commentedComplexBlocks).toBe(0);
      expect(analysis.totalComplexBlocks).toBe(0);
      expect(analysis.selfDocumentingFunctions).toBe(0);
    });

    it('should create analysis with false booleans', () => {
      const analysis = createDefaultAnalysis();
      
      expect(analysis.hasUsageExamples).toBe(false);
      expect(analysis.hasEdgeCaseDocs).toBe(false);
    });

    it('should create analysis with empty arrays', () => {
      const analysis = createDefaultAnalysis();
      
      expect(analysis.goodExamples).toEqual([]);
      expect(analysis.missingExamples).toEqual([]);
    });
  });
});
