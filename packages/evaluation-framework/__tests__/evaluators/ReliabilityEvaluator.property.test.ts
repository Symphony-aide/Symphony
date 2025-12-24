/**
 * Property-based tests for ReliabilityEvaluator
 * 
 * Tests for Properties 13 and 14 from the design document.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  ReliabilityEvaluator,
  ErrorHandlingAnalyzer,
  ReliabilityCodeExamplesGenerator,
  ErrorHandlingFormatter,
  EdgeCaseAnalyzer,
  getValidReliabilityRatings,
  createDefaultAnalysis,
  createErrorHandlingInstance,
  createErrorHandlingGap,
  isValidReliabilityEvaluation,
  type ErrorHandlingAnalysisResult,
} from '../../src/evaluators/ReliabilityEvaluator';
import type { AtomicFeature, CodeEvidence } from '../../types/evaluation';
import type {
  ErrorHandlingInstance,
  ErrorHandlingGap,
  DefensiveCodingAssessment,
  EdgeCaseAssessment,
} from '../../types/dimensions';

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
 * Generate an error handling instance
 */
const errorHandlingInstance = (): fc.Arbitrary<ErrorHandlingInstance> =>
  fc.record({
    description: safeString(10, 50),
    evidence: codeEvidence(),
  });

/**
 * Generate an error handling gap
 */
const errorHandlingGap = (): fc.Arbitrary<ErrorHandlingGap> =>
  fc.record({
    scenario: safeString(10, 50),
    location: fc.record({
      file: filePath(),
      line: fc.integer({ min: 1, max: 500 }),
    }),
    risk: fc.constantFrom('Low', 'Medium', 'High'),
  });

/**
 * Generate defensive coding assessment
 */
const defensiveCodingAssessment = (): fc.Arbitrary<DefensiveCodingAssessment> =>
  fc.record({
    hasInputValidation: fc.boolean(),
    hasNullChecks: fc.boolean(),
    hasTypeGuards: fc.boolean(),
    description: safeString(10, 100),
  });

/**
 * Generate edge case assessment
 */
const edgeCaseAssessment = (): fc.Arbitrary<EdgeCaseAssessment> =>
  fc.record({
    handledCases: fc.array(safeString(5, 20), { minLength: 0, maxLength: 5 }),
    unhandledCases: fc.array(safeString(5, 20), { minLength: 0, maxLength: 5 }),
    description: safeString(10, 100),
  });

/**
 * Generate error handling analysis result
 */
const errorHandlingAnalysisResult = (): fc.Arbitrary<ErrorHandlingAnalysisResult> =>
  fc.record({
    totalRiskyOperations: fc.integer({ min: 0, max: 20 }),
    handledOperations: fc.integer({ min: 0, max: 20 }),
    presentHandling: fc.array(errorHandlingInstance(), { minLength: 0, maxLength: 5 }),
    missingHandling: fc.array(errorHandlingGap(), { minLength: 0, maxLength: 5 }),
    defensiveCoding: defensiveCodingAssessment(),
    edgeCaseHandling: edgeCaseAssessment(),
  }).map(result => ({
    ...result,
    // Ensure handled operations don't exceed total
    handledOperations: Math.min(result.handledOperations, result.totalRiskyOperations),
  }));

// ============================================================================
// Property 13: Reliability Rating Validity Tests
// ============================================================================

describe('ReliabilityEvaluator Property Tests', () => {
  const evaluator = new ReliabilityEvaluator();

  /**
   * **Feature: blind-evaluation-framework, Property 13: Reliability rating validity**
   * **Validates: Requirements 5.1**
   */
  describe('Property 13: Reliability rating validity', () => {
    it('should assign valid reliability ratings from the allowed set', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          errorHandlingAnalysisResult(),
          (feature, analysis) => {
            const evaluation = evaluator.evaluate(feature, analysis);
            
            const validRatings = getValidReliabilityRatings();
            expect(validRatings).toContain(evaluation.rating);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return exactly one of: Low, Medium, High, or Enterprise-Level', () => {
      fc.assert(
        fc.property(
          errorHandlingAnalysisResult(),
          (analysis) => {
            const rating = evaluator.determineRating(analysis);
            
            expect(['Low', 'Medium', 'High', 'Enterprise-Level']).toContain(rating);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate ratings correctly via isValidRating', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('Low', 'Medium', 'High', 'Enterprise-Level'),
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
          fc.string().filter(s => !['Low', 'Medium', 'High', 'Enterprise-Level'].includes(s)),
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
          errorHandlingAnalysisResult(),
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
          errorHandlingAnalysisResult(),
          (feature, analysis) => {
            const evaluation = evaluator.evaluate(feature, analysis);
            
            expect(evaluation.assessment).toContain(feature.name);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve error handling instances in evaluation', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          errorHandlingAnalysisResult(),
          (feature, analysis) => {
            const evaluation = evaluator.evaluate(feature, analysis);
            
            expect(evaluation.presentErrorHandling.length).toBe(analysis.presentHandling.length);
            expect(evaluation.missingErrorHandling.length).toBe(analysis.missingHandling.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce valid evaluation via isValidReliabilityEvaluation', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          errorHandlingAnalysisResult(),
          (feature, analysis) => {
            const evaluation = evaluator.evaluate(feature, analysis);
            
            expect(isValidReliabilityEvaluation(evaluation)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include defensive coding assessment in evaluation', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          errorHandlingAnalysisResult(),
          (feature, analysis) => {
            const evaluation = evaluator.evaluate(feature, analysis);
            
            expect(typeof evaluation.defensiveCoding.hasInputValidation).toBe('boolean');
            expect(typeof evaluation.defensiveCoding.hasNullChecks).toBe('boolean');
            expect(typeof evaluation.defensiveCoding.hasTypeGuards).toBe('boolean');
            expect(typeof evaluation.defensiveCoding.description).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include edge case handling assessment in evaluation', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          errorHandlingAnalysisResult(),
          (feature, analysis) => {
            const evaluation = evaluator.evaluate(feature, analysis);
            
            expect(Array.isArray(evaluation.edgeCaseHandling.handledCases)).toBe(true);
            expect(Array.isArray(evaluation.edgeCaseHandling.unhandledCases)).toBe(true);
            expect(typeof evaluation.edgeCaseHandling.description).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


// ============================================================================
// Property 14: Error Handling Documentation Tests
// ============================================================================

describe('ErrorHandlingFormatter Property Tests', () => {
  /**
   * **Feature: blind-evaluation-framework, Property 14: Error handling documentation**
   * **Validates: Requirements 5.2, 5.3**
   */
  describe('Property 14: Error handling documentation', () => {
    it('should format present error handling with ✅ marker', () => {
      fc.assert(
        fc.property(
          fc.array(errorHandlingInstance(), { minLength: 1, maxLength: 5 }),
          (instances) => {
            const formatted = ErrorHandlingFormatter.formatPresent(instances);
            
            expect(formatted).toContain('✅');
            expect(formatted).toContain('**Present:**');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format missing error handling with ❌ marker', () => {
      fc.assert(
        fc.property(
          fc.array(errorHandlingGap(), { minLength: 1, maxLength: 5 }),
          (gaps) => {
            const formatted = ErrorHandlingFormatter.formatMissing(gaps);
            
            expect(formatted).toContain('❌');
            expect(formatted).toContain('**Missing:**');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include risk assessment in missing error handling', () => {
      fc.assert(
        fc.property(
          fc.array(errorHandlingGap(), { minLength: 1, maxLength: 5 }),
          (gaps) => {
            const formatted = ErrorHandlingFormatter.formatMissing(gaps);
            
            // Should contain at least one risk indicator
            const hasRiskIndicator = 
              formatted.includes('High risk') ||
              formatted.includes('Medium risk') ||
              formatted.includes('Low risk');
            
            expect(hasRiskIndicator).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include line numbers in missing error handling', () => {
      fc.assert(
        fc.property(
          fc.array(errorHandlingGap(), { minLength: 1, maxLength: 1 }),
          (gaps) => {
            const formatted = ErrorHandlingFormatter.formatMissing(gaps);
            const gap = gaps[0];
            
            expect(formatted).toContain(`Line ${gap.location.line}`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return empty string for empty present instances', () => {
      const formatted = ErrorHandlingFormatter.formatPresent([]);
      expect(formatted).toBe('');
    });

    it('should return empty string for empty missing gaps', () => {
      const formatted = ErrorHandlingFormatter.formatMissing([]);
      expect(formatted).toBe('');
    });

    it('should include description in present error handling', () => {
      fc.assert(
        fc.property(
          fc.array(errorHandlingInstance(), { minLength: 1, maxLength: 1 }),
          (instances) => {
            const formatted = ErrorHandlingFormatter.formatPresent(instances);
            const instance = instances[0];
            
            expect(formatted).toContain(instance.description);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include scenario in missing error handling', () => {
      fc.assert(
        fc.property(
          fc.array(errorHandlingGap(), { minLength: 1, maxLength: 1 }),
          (gaps) => {
            const formatted = ErrorHandlingFormatter.formatMissing(gaps);
            const gap = gaps[0];
            
            expect(formatted).toContain(gap.scenario);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format complete error handling analysis', () => {
      fc.assert(
        fc.property(
          fc.array(errorHandlingInstance(), { minLength: 1, maxLength: 3 }),
          fc.array(errorHandlingGap(), { minLength: 1, maxLength: 3 }),
          (instances, gaps) => {
            const formatted = ErrorHandlingFormatter.formatErrorHandlingAnalysis(instances, gaps);
            
            expect(formatted).toContain('**Error Handling Analysis:**');
            expect(formatted).toContain('✅');
            expect(formatted).toContain('❌');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


// ============================================================================
// Reliability Code Examples Generator Tests
// ============================================================================

describe('ReliabilityCodeExamplesGenerator Property Tests', () => {
  const generator = new ReliabilityCodeExamplesGenerator();

  describe('Reliability code examples generation', () => {
    it('should format good examples with GOOD marker', () => {
      fc.assert(
        fc.property(
          fc.array(errorHandlingInstance(), { minLength: 1, maxLength: 3 }),
          (instances) => {
            const formatted = generator.formatGoodExamples(instances);
            
            expect(formatted).toContain('// GOOD:');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format bad examples with BAD marker', () => {
      fc.assert(
        fc.property(
          fc.array(errorHandlingGap(), { minLength: 1, maxLength: 3 }),
          filePath(),
          (gaps, path) => {
            // Create simple code with enough lines
            const code = Array(Math.max(...gaps.map(g => g.location.line)) + 1)
              .fill('const x = 1;')
              .join('\n');
            
            const formatted = generator.formatBadExamples(gaps, path, code);
            
            expect(formatted).toContain('// BAD:');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include file path and line numbers in good examples', () => {
      fc.assert(
        fc.property(
          fc.array(errorHandlingInstance(), { minLength: 1, maxLength: 1 }),
          (instances) => {
            const formatted = generator.formatGoodExamples(instances);
            const instance = instances[0];
            
            expect(formatted).toContain(instance.evidence.filePath);
            expect(formatted).toContain(`${instance.evidence.lineNumbers.start}`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return appropriate message for empty good examples', () => {
      const formatted = generator.formatGoodExamples([]);
      expect(formatted).toBe('No good error handling examples found.');
    });

    it('should return appropriate message for empty bad examples', () => {
      const formatted = generator.formatBadExamples([], 'test.ts', '');
      expect(formatted).toBe('No missing error handling issues found.');
    });
  });
});


// ============================================================================
// Edge Case Analyzer Tests
// ============================================================================

describe('EdgeCaseAnalyzer Property Tests', () => {
  const analyzer = new EdgeCaseAnalyzer();

  describe('Edge case analysis', () => {
    it('should return valid edge case assessment structure', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 500 }),
          filePath(),
          (code, path) => {
            const assessment = analyzer.analyze(code, path);
            
            expect(Array.isArray(assessment.handledCases)).toBe(true);
            expect(Array.isArray(assessment.unhandledCases)).toBe(true);
            expect(typeof assessment.description).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format edge cases as checkboxes', () => {
      fc.assert(
        fc.property(
          edgeCaseAssessment(),
          (assessment) => {
            const formatted = analyzer.formatAsCheckboxes(assessment);
            
            // Should contain checkbox markers
            const hasCheckboxes = formatted.includes('[x]') || formatted.includes('[ ]');
            expect(hasCheckboxes).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include all standard edge case types in checkboxes', () => {
      fc.assert(
        fc.property(
          edgeCaseAssessment(),
          (assessment) => {
            const formatted = analyzer.formatAsCheckboxes(assessment);
            
            expect(formatted).toContain('empty arrays');
            expect(formatted).toContain('empty strings');
            expect(formatted).toContain('null/undefined');
            expect(formatted).toContain('invalid numbers');
            expect(formatted).toContain('boundary conditions');
            expect(formatted).toContain('async errors');
            expect(formatted).toContain('default values');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


// ============================================================================
// Error Handling Analyzer Tests
// ============================================================================

describe('ErrorHandlingAnalyzer Property Tests', () => {
  const analyzer = new ErrorHandlingAnalyzer();

  describe('Error handling analysis', () => {
    it('should return valid analysis result structure', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 500 }),
          filePath(),
          (code, path) => {
            const result = analyzer.analyze(code, path);
            
            expect(typeof result.totalRiskyOperations).toBe('number');
            expect(typeof result.handledOperations).toBe('number');
            expect(Array.isArray(result.presentHandling)).toBe(true);
            expect(Array.isArray(result.missingHandling)).toBe(true);
            expect(typeof result.defensiveCoding.hasInputValidation).toBe('boolean');
            expect(typeof result.defensiveCoding.hasNullChecks).toBe('boolean');
            expect(typeof result.defensiveCoding.hasTypeGuards).toBe('boolean');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect try/catch blocks as error handling', () => {
      const codeWithTryCatch = `
        function test() {
          try {
            riskyOperation();
          } catch (error) {
            handleError(error);
          }
        }
      `;
      
      const result = analyzer.analyze(codeWithTryCatch, 'test.ts');
      
      expect(result.presentHandling.length).toBeGreaterThan(0);
      expect(result.presentHandling.some(h => h.description.includes('try/catch'))).toBe(true);
    });

    it('should detect .catch() handlers as error handling', () => {
      const codeWithCatch = `
        fetch('/api/data')
          .then(response => response.json())
          .catch(error => console.error(error));
      `;
      
      const result = analyzer.analyze(codeWithCatch, 'test.ts');
      
      expect(result.presentHandling.some(h => h.description.includes('.catch()'))).toBe(true);
    });

    it('should detect null checks as defensive coding', () => {
      const codeWithNullChecks = `
        function test(value) {
          if (value === null || value === undefined) {
            return;
          }
          const result = value?.nested?.property ?? 'default';
        }
      `;
      
      const result = analyzer.analyze(codeWithNullChecks, 'test.ts');
      
      expect(result.defensiveCoding.hasNullChecks).toBe(true);
    });

    it('should detect input validation as defensive coding', () => {
      const codeWithValidation = `
        function test(value) {
          if (typeof value !== 'string') {
            throw new Error('Invalid input');
          }
          if (value.length === 0) {
            return null;
          }
        }
      `;
      
      const result = analyzer.analyze(codeWithValidation, 'test.ts');
      
      expect(result.defensiveCoding.hasInputValidation).toBe(true);
    });

    it('should ensure handled operations do not exceed total risky operations', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 500 }),
          filePath(),
          (code, path) => {
            const result = analyzer.analyze(code, path);
            
            expect(result.handledOperations).toBeLessThanOrEqual(result.totalRiskyOperations);
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

describe('Reliability Evaluator Helper Functions', () => {
  describe('getValidReliabilityRatings', () => {
    it('should return exactly 4 valid ratings', () => {
      const ratings = getValidReliabilityRatings();
      expect(ratings.length).toBe(4);
    });

    it('should include all expected ratings', () => {
      const ratings = getValidReliabilityRatings();
      expect(ratings).toContain('Low');
      expect(ratings).toContain('Medium');
      expect(ratings).toContain('High');
      expect(ratings).toContain('Enterprise-Level');
    });
  });

  describe('createDefaultAnalysis', () => {
    it('should create analysis with zero counts', () => {
      const analysis = createDefaultAnalysis();
      
      expect(analysis.totalRiskyOperations).toBe(0);
      expect(analysis.handledOperations).toBe(0);
    });

    it('should create analysis with empty arrays', () => {
      const analysis = createDefaultAnalysis();
      
      expect(analysis.presentHandling).toEqual([]);
      expect(analysis.missingHandling).toEqual([]);
    });

    it('should create analysis with false defensive coding booleans', () => {
      const analysis = createDefaultAnalysis();
      
      expect(analysis.defensiveCoding.hasInputValidation).toBe(false);
      expect(analysis.defensiveCoding.hasNullChecks).toBe(false);
      expect(analysis.defensiveCoding.hasTypeGuards).toBe(false);
    });
  });

  describe('createErrorHandlingInstance', () => {
    it('should create valid error handling instance', () => {
      fc.assert(
        fc.property(
          safeString(10, 50),
          filePath(),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          safeString(10, 50),
          fc.constantFrom('javascript', 'typescript'),
          (description, path, startLine, offset, snippet, language) => {
            const endLine = startLine + offset;
            const instance = createErrorHandlingInstance(
              description,
              path,
              startLine,
              endLine,
              snippet,
              language
            );
            
            expect(instance.description).toBe(description);
            expect(instance.evidence.filePath).toBe(path);
            expect(instance.evidence.lineNumbers.start).toBe(startLine);
            expect(instance.evidence.lineNumbers.end).toBe(endLine);
            expect(instance.evidence.codeSnippet).toBe(snippet);
            expect(instance.evidence.language).toBe(language);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('createErrorHandlingGap', () => {
    it('should create valid error handling gap', () => {
      fc.assert(
        fc.property(
          safeString(10, 50),
          filePath(),
          fc.integer({ min: 1, max: 500 }),
          fc.constantFrom('Low', 'Medium', 'High'),
          (scenario, file, line, risk) => {
            const gap = createErrorHandlingGap(scenario, file, line, risk);
            
            expect(gap.scenario).toBe(scenario);
            expect(gap.location.file).toBe(file);
            expect(gap.location.line).toBe(line);
            expect(gap.risk).toBe(risk);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
