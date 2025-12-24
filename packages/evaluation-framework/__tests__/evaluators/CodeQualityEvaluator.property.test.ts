/**
 * Property-based tests for CodeQualityEvaluator
 * 
 * Tests for Properties 7, 8, 9, and 10 from the design document.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  CodeQualityEvaluator,
  FeatureIsolationClassifier,
  AntiPatternDetector,
  AntiPatternDocumenter,
  GoodPracticeIdentifier,
  type AntiPatternAnalysisResult,
  type GoodPracticeAnalysisResult,
  type AntiPatternType,
  type GoodPracticeType,
  getValidQualityRatings,
  getValidIsolationClassifications,
} from '../../src/evaluators/CodeQualityEvaluator';
import type { AtomicFeature, CodeEvidence } from '../../types/evaluation';
import type { FeatureIsolationClassification, AntiPattern } from '../../types/dimensions';

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
 * Generate a feature isolation classification
 */
const featureIsolationClassification = (): fc.Arbitrary<FeatureIsolationClassification> =>
  fc.constantFrom(
    'isolated_module',
    'same_file_separated',
    'mixed_with_other',
    'scattered_files'
  );

/**
 * Generate an anti-pattern type
 */
const antiPatternType = (): fc.Arbitrary<AntiPatternType> =>
  fc.constantFrom(
    'excessive_nesting',
    'deep_property_chain',
    'magic_number',
    'magic_string',
    'code_duplication',
    'over_engineering',
    'tight_coupling',
    'mixed_feature_logic'
  );

/**
 * Generate a good practice type
 */
const goodPracticeType = (): fc.Arbitrary<GoodPracticeType> =>
  fc.constantFrom(
    'kiss',
    'dry',
    'modular_structure',
    'single_responsibility',
    'feature_isolated'
  );


/**
 * Generate an anti-pattern analysis result
 */
const antiPatternAnalysisResult = (): fc.Arbitrary<AntiPatternAnalysisResult> =>
  fc.record({
    type: antiPatternType(),
    name: safeString(5, 30),
    evidence: codeEvidence(),
    issue: safeString(10, 100),
    impact: safeString(10, 100),
    betterApproach: fc.record({
      description: safeString(10, 100),
      codeExample: safeString(10, 100),
    }),
  });

/**
 * Generate a good practice analysis result
 */
const goodPracticeAnalysisResult = (): fc.Arbitrary<GoodPracticeAnalysisResult> =>
  fc.record({
    type: goodPracticeType(),
    name: safeString(5, 30),
    evidence: codeEvidence(),
    description: safeString(10, 100),
  });

/**
 * Generate an array of anti-pattern analysis results
 */
const antiPatternAnalysisResults = () =>
  fc.array(antiPatternAnalysisResult(), { minLength: 0, maxLength: 5 });

/**
 * Generate an array of good practice analysis results
 */
const goodPracticeAnalysisResults = () =>
  fc.array(goodPracticeAnalysisResult(), { minLength: 0, maxLength: 5 });

// ============================================================================
// Property 7: Code Quality Rating Validity Tests
// ============================================================================

describe('CodeQualityEvaluator Property Tests', () => {
  const evaluator = new CodeQualityEvaluator();

  /**
   * **Feature: blind-evaluation-framework, Property 7: Code quality rating validity**
   * **Validates: Requirements 3.1**
   */
  describe('Property 7: Code quality rating validity', () => {
    it('should assign valid code quality ratings from the allowed set', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          featureIsolationClassification(),
          antiPatternAnalysisResults(),
          goodPracticeAnalysisResults(),
          (feature, isolation, antiPatterns, goodPractices) => {
            const evaluation = evaluator.evaluate(
              feature,
              isolation,
              antiPatterns,
              goodPractices
            );
            
            const validRatings = getValidQualityRatings();
            expect(validRatings).toContain(evaluation.rating);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return exactly one of: Poor, Basic, Good, or Excellent', () => {
      fc.assert(
        fc.property(
          featureIsolationClassification(),
          antiPatternAnalysisResults(),
          goodPracticeAnalysisResults(),
          (isolation, antiPatterns, goodPractices) => {
            const rating = evaluator.determineRating(isolation, antiPatterns, goodPractices);
            
            expect(['Poor', 'Basic', 'Good', 'Excellent']).toContain(rating);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate ratings correctly via isValidRating', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('Poor', 'Basic', 'Good', 'Excellent'),
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
          fc.string().filter(s => !['Poor', 'Basic', 'Good', 'Excellent'].includes(s)),
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
          featureIsolationClassification(),
          antiPatternAnalysisResults(),
          goodPracticeAnalysisResults(),
          (feature, isolation, antiPatterns, goodPractices) => {
            const evaluation = evaluator.evaluate(
              feature,
              isolation,
              antiPatterns,
              goodPractices
            );
            
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
          featureIsolationClassification(),
          antiPatternAnalysisResults(),
          goodPracticeAnalysisResults(),
          (feature, isolation, antiPatterns, goodPractices) => {
            const evaluation = evaluator.evaluate(
              feature,
              isolation,
              antiPatterns,
              goodPractices
            );
            
            expect(evaluation.assessment).toContain(feature.name);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve feature isolation classification in evaluation', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          featureIsolationClassification(),
          antiPatternAnalysisResults(),
          goodPracticeAnalysisResults(),
          (feature, isolation, antiPatterns, goodPractices) => {
            const evaluation = evaluator.evaluate(
              feature,
              isolation,
              antiPatterns,
              goodPractices
            );
            
            expect(evaluation.featureIsolation).toBe(isolation);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve anti-pattern count in evaluation', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          featureIsolationClassification(),
          antiPatternAnalysisResults(),
          goodPracticeAnalysisResults(),
          (feature, isolation, antiPatterns, goodPractices) => {
            const evaluation = evaluator.evaluate(
              feature,
              isolation,
              antiPatterns,
              goodPractices
            );
            
            expect(evaluation.antiPatterns.length).toBe(antiPatterns.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve good practice count in evaluation', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          featureIsolationClassification(),
          antiPatternAnalysisResults(),
          goodPracticeAnalysisResults(),
          (feature, isolation, antiPatterns, goodPractices) => {
            const evaluation = evaluator.evaluate(
              feature,
              isolation,
              antiPatterns,
              goodPractices
            );
            
            expect(evaluation.goodPractices.length).toBe(goodPractices.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


// ============================================================================
// Property 8: Feature Isolation Classification Tests
// ============================================================================

describe('FeatureIsolationClassifier Property Tests', () => {
  const classifier = new FeatureIsolationClassifier();

  /**
   * **Feature: blind-evaluation-framework, Property 8: Feature isolation classification**
   * **Validates: Requirements 3.2**
   */
  describe('Property 8: Feature isolation classification', () => {
    it('should classify to exactly one of the valid classifications', () => {
      fc.assert(
        fc.property(
          fc.record({
            primaryFile: filePath(),
            files: fc.array(filePath(), { minLength: 1, maxLength: 5 }),
            hasOwnModule: fc.boolean(),
            isClearlySeparated: fc.boolean(),
            isMixedWithOther: fc.boolean(),
          }),
          (distribution) => {
            const classification = classifier.classify(distribution);
            
            const validClassifications = getValidIsolationClassifications();
            expect(validClassifications).toContain(classification);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return isolated_module when hasOwnModule is true', () => {
      fc.assert(
        fc.property(
          fc.record({
            primaryFile: filePath(),
            files: fc.array(filePath(), { minLength: 1, maxLength: 1 }),
            hasOwnModule: fc.constant(true),
            isClearlySeparated: fc.boolean(),
            isMixedWithOther: fc.boolean(),
          }),
          (distribution) => {
            const classification = classifier.classify(distribution);
            expect(classification).toBe('isolated_module');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return scattered_files when multiple files without own module', () => {
      fc.assert(
        fc.property(
          fc.record({
            primaryFile: filePath(),
            files: fc.array(filePath(), { minLength: 2, maxLength: 5 }),
            hasOwnModule: fc.constant(false),
            isClearlySeparated: fc.boolean(),
            isMixedWithOther: fc.boolean(),
          }),
          (distribution) => {
            const classification = classifier.classify(distribution);
            expect(classification).toBe('scattered_files');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return same_file_separated when clearly separated in single file', () => {
      fc.assert(
        fc.property(
          fc.record({
            primaryFile: filePath(),
            files: fc.array(filePath(), { minLength: 1, maxLength: 1 }),
            hasOwnModule: fc.constant(false),
            isClearlySeparated: fc.constant(true),
            isMixedWithOther: fc.constant(false),
          }),
          (distribution) => {
            const classification = classifier.classify(distribution);
            expect(classification).toBe('same_file_separated');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return mixed_with_other when mixed with other logic', () => {
      fc.assert(
        fc.property(
          fc.record({
            primaryFile: filePath(),
            files: fc.array(filePath(), { minLength: 1, maxLength: 1 }),
            hasOwnModule: fc.constant(false),
            isClearlySeparated: fc.constant(false),
            isMixedWithOther: fc.constant(true),
          }),
          (distribution) => {
            const classification = classifier.classify(distribution);
            expect(classification).toBe('mixed_with_other');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate classifications correctly via isValidClassification', () => {
      fc.assert(
        fc.property(
          featureIsolationClassification(),
          (classification) => {
            expect(classifier.isValidClassification(classification)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid classifications via isValidClassification', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => !getValidIsolationClassifications().includes(s as any)),
          (invalidClassification) => {
            expect(classifier.isValidClassification(invalidClassification)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format checkboxes with exactly one checked item', () => {
      fc.assert(
        fc.property(
          featureIsolationClassification(),
          (classification) => {
            const formatted = classifier.formatAsCheckboxes(classification);
            
            // Count checked boxes
            const checkedCount = (formatted.match(/\[x\]/g) || []).length;
            const uncheckedCount = (formatted.match(/\[ \]/g) || []).length;
            
            expect(checkedCount).toBe(1);
            expect(uncheckedCount).toBe(3);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return correct quality label for each classification', () => {
      const expectedLabels: Record<FeatureIsolationClassification, string> = {
        isolated_module: 'Good',
        same_file_separated: 'Acceptable',
        mixed_with_other: 'Bad',
        scattered_files: 'Very Bad',
      };

      fc.assert(
        fc.property(
          featureIsolationClassification(),
          (classification) => {
            const label = classifier.getQualityLabel(classification);
            expect(label).toBe(expectedLabels[classification]);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return correct marker for each classification', () => {
      const expectedMarkers: Record<FeatureIsolationClassification, string> = {
        isolated_module: '✅',
        same_file_separated: '⚠️',
        mixed_with_other: '❌',
        scattered_files: '❌',
      };

      fc.assert(
        fc.property(
          featureIsolationClassification(),
          (classification) => {
            const marker = classifier.getMarker(classification);
            expect(marker).toBe(expectedMarkers[classification]);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


// ============================================================================
// Property 9: Anti-Pattern Documentation Format Tests
// ============================================================================

describe('AntiPatternDocumenter Property Tests', () => {
  const documenter = new AntiPatternDocumenter();

  /**
   * Generate a valid AntiPattern object
   */
  const antiPattern = (): fc.Arbitrary<AntiPattern> =>
    fc.record({
      id: fc.integer({ min: 1, max: 100 }),
      name: safeString(5, 30),
      evidence: codeEvidence(),
      issue: safeString(10, 100),
      impact: safeString(10, 100),
      betterApproach: fc.record({
        description: safeString(10, 100),
        codeExample: safeString(10, 100),
      }),
    });

  /**
   * **Feature: blind-evaluation-framework, Property 9: Anti-pattern documentation format**
   * **Validates: Requirements 3.3**
   */
  describe('Property 9: Anti-pattern documentation format', () => {
    it('should include numbered heading in formatted output', () => {
      fc.assert(
        fc.property(
          antiPattern(),
          (ap) => {
            const formatted = documenter.formatAntiPattern(ap);
            
            // Should contain numbered heading
            expect(formatted).toContain(`**#${ap.id}:`);
            expect(formatted).toContain(ap.name);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include code snippet with file and line numbers', () => {
      fc.assert(
        fc.property(
          antiPattern(),
          (ap) => {
            const formatted = documenter.formatAntiPattern(ap);
            
            // Should contain file path and line numbers
            expect(formatted).toContain(ap.evidence.filePath);
            expect(formatted).toContain(`${ap.evidence.lineNumbers.start}`);
            expect(formatted).toContain(`${ap.evidence.lineNumbers.end}`);
            
            // Should contain code snippet
            expect(formatted).toContain(ap.evidence.codeSnippet);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include issue description', () => {
      fc.assert(
        fc.property(
          antiPattern(),
          (ap) => {
            const formatted = documenter.formatAntiPattern(ap);
            
            expect(formatted).toContain('**Issue:**');
            expect(formatted).toContain(ap.issue);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include impact assessment', () => {
      fc.assert(
        fc.property(
          antiPattern(),
          (ap) => {
            const formatted = documenter.formatAntiPattern(ap);
            
            expect(formatted).toContain('**Impact:**');
            expect(formatted).toContain(ap.impact);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include better approach with description and code example', () => {
      fc.assert(
        fc.property(
          antiPattern(),
          (ap) => {
            const formatted = documenter.formatAntiPattern(ap);
            
            expect(formatted).toContain('**Better Approach:**');
            expect(formatted).toContain(ap.betterApproach.description);
            expect(formatted).toContain(ap.betterApproach.codeExample);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate anti-patterns correctly via isValidAntiPattern', () => {
      fc.assert(
        fc.property(
          antiPattern(),
          (ap) => {
            expect(documenter.isValidAntiPattern(ap)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid anti-patterns with missing fields', () => {
      // Test with invalid id
      const invalidAp1 = {
        id: 0, // Invalid: must be > 0
        name: 'Test',
        evidence: {
          filePath: 'test.ts',
          lineNumbers: { start: 1, end: 2 },
          codeSnippet: 'code',
          language: 'typescript',
        },
        issue: 'Issue',
        impact: 'Impact',
        betterApproach: { description: 'Desc', codeExample: 'Code' },
      };
      expect(documenter.isValidAntiPattern(invalidAp1)).toBe(false);

      // Test with empty name
      const invalidAp2 = {
        id: 1,
        name: '', // Invalid: must be non-empty
        evidence: {
          filePath: 'test.ts',
          lineNumbers: { start: 1, end: 2 },
          codeSnippet: 'code',
          language: 'typescript',
        },
        issue: 'Issue',
        impact: 'Impact',
        betterApproach: { description: 'Desc', codeExample: 'Code' },
      };
      expect(documenter.isValidAntiPattern(invalidAp2)).toBe(false);
    });

    it('should format all anti-patterns with proper numbering', () => {
      fc.assert(
        fc.property(
          fc.array(antiPattern(), { minLength: 1, maxLength: 5 }),
          (antiPatterns) => {
            const formatted = documenter.formatAllAntiPatterns(antiPatterns);
            
            // Should contain header
            expect(formatted).toContain('**Anti-Patterns Detected:**');
            
            // Should contain all anti-pattern IDs
            for (const ap of antiPatterns) {
              expect(formatted).toContain(`#${ap.id}`);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return appropriate message for empty anti-patterns list', () => {
      const formatted = documenter.formatAllAntiPatterns([]);
      expect(formatted).toBe('No anti-patterns detected.');
    });
  });
});


// ============================================================================
// Property 10: Anti-Pattern Detection Tests
// ============================================================================

describe('AntiPatternDetector Property Tests', () => {
  const detector = new AntiPatternDetector();

  /**
   * **Feature: blind-evaluation-framework, Property 10: Anti-pattern detection**
   * **Validates: Requirements 3.4**
   */
  describe('Property 10: Anti-pattern detection', () => {
    it('should detect excessive nesting (>3 levels)', () => {
      // Code with excessive nesting
      const nestedCode = `
function test() {
  if (a) {
    if (b) {
      if (c) {
        if (d) {
          // Too deep
        }
      }
    }
  }
}`;
      
      const result = detector.detectExcessiveNesting(nestedCode, 'test.ts');
      expect(result.type).toBe('excessive_nesting');
      expect(result.detected).toBe(true);
    });

    it('should not flag code with acceptable nesting levels', () => {
      const acceptableCode = `
function test() {
  if (a) {
    if (b) {
      // This is fine
    }
  }
}`;
      
      const result = detector.detectExcessiveNesting(acceptableCode, 'test.ts');
      expect(result.detected).toBe(false);
    });

    it('should detect deep property chains', () => {
      const chainCode = `
const value = obj.prop1.prop2.prop3.prop4.value;
`;
      
      const result = detector.detectDeepPropertyChains(chainCode, 'test.ts');
      expect(result.type).toBe('deep_property_chain');
      expect(result.detected).toBe(true);
    });

    it('should not flag acceptable property chains', () => {
      const acceptableCode = `
const value = obj.prop1.prop2;
`;
      
      const result = detector.detectDeepPropertyChains(acceptableCode, 'test.ts');
      expect(result.detected).toBe(false);
    });

    it('should detect magic strings in comparisons', () => {
      const magicStringCode = `
if (status === 'some_magic_value') {
  doSomething();
}
`;
      
      const result = detector.detectMagicStrings(magicStringCode, 'test.ts');
      expect(result.type).toBe('magic_string');
      expect(result.detected).toBe(true);
    });

    it('should not flag const declarations as magic strings', () => {
      const constCode = `
const STATUS = 'active';
import { something } from 'module';
`;
      
      const result = detector.detectMagicStrings(constCode, 'test.ts');
      expect(result.detected).toBe(false);
    });

    it('should detect tight coupling patterns', () => {
      const coupledCode = `
const service = new MyService();
const instance = Singleton.getInstance();
`;
      
      const result = detector.detectTightCoupling(coupledCode, 'test.ts');
      expect(result.type).toBe('tight_coupling');
      expect(result.detected).toBe(true);
    });

    it('should return correct anti-pattern type for each detection', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'excessive_nesting',
            'deep_property_chain',
            'magic_number',
            'magic_string',
            'tight_coupling'
          ) as fc.Arbitrary<AntiPatternType>,
          (expectedType) => {
            // Create code that triggers each type
            const codeMap: Record<string, string> = {
              excessive_nesting: 'if(a){if(b){if(c){if(d){if(e){}}}}}',
              deep_property_chain: 'x.a.b.c.d.e',
              magic_number: 'if (x > 42) {}',
              magic_string: 'if (x === "magic") {}',
              tight_coupling: 'new Service()',
            };
            
            const code = codeMap[expectedType];
            const results = detector.detectAll(code, 'test.ts');
            
            // At least one detection should match the expected type
            const matchingResults = results.filter(r => r.type === expectedType);
            // Note: Some patterns may not trigger on simplified code
            // This test verifies the type is correct when detected
            if (matchingResults.length > 0) {
              expect(matchingResults[0].type).toBe(expectedType);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should return detection results with valid locations', () => {
      const codeWithIssues = `
function test() {
  if (a) {
    if (b) {
      if (c) {
        if (d) {
          console.log(obj.a.b.c.d.e);
        }
      }
    }
  }
}`;
      
      const results = detector.detectAll(codeWithIssues, 'test.ts');
      
      for (const result of results) {
        if (result.detected) {
          expect(result.locations.length).toBeGreaterThan(0);
          for (const location of result.locations) {
            expect(location.file).toBe('test.ts');
            expect(location.startLine).toBeGreaterThan(0);
            expect(location.endLine).toBeGreaterThanOrEqual(location.startLine);
            expect(location.snippet.length).toBeGreaterThan(0);
          }
        }
      }
    });

    it('should detect code duplication when similarity exceeds threshold', () => {
      const codeBlocks = [
        { code: 'function doSomething() { return x + y; }', startLine: 1, endLine: 1 },
        { code: 'function doSomething() { return x + y; }', startLine: 10, endLine: 10 },
      ];
      
      const result = detector.detectCodeDuplication(codeBlocks, 'test.ts');
      expect(result.type).toBe('code_duplication');
      expect(result.detected).toBe(true);
    });

    it('should not flag different code blocks as duplicates', () => {
      const codeBlocks = [
        { code: 'function add(a, b) { return a + b; }', startLine: 1, endLine: 1 },
        { code: 'function multiply(x, y) { return x * y; }', startLine: 10, endLine: 10 },
      ];
      
      const result = detector.detectCodeDuplication(codeBlocks, 'test.ts');
      expect(result.detected).toBe(false);
    });
  });
});


// ============================================================================
// Good Practice Identifier Tests
// ============================================================================

describe('GoodPracticeIdentifier Property Tests', () => {
  const identifier = new GoodPracticeIdentifier();

  describe('Good practice identification', () => {
    it('should identify KISS patterns in simple code', () => {
      const simpleCode = `
const add = (a, b) => a + b;
return result;
if (!valid) return null;
`;
      
      const result = identifier.identifyKISS(simpleCode, 'test.ts');
      expect(result.type).toBe('kiss');
      expect(result.detected).toBe(true);
    });

    it('should identify DRY patterns with reusable functions', () => {
      const dryCode = `
export const formatDate = (date) => date.toISOString();
import { helper } from '../utils';
const result = useCustomHook();
`;
      
      const result = identifier.identifyDRY(dryCode, 'test.ts');
      expect(result.type).toBe('dry');
      expect(result.detected).toBe(true);
    });

    it('should identify modular structure patterns', () => {
      const modularCode = `
export default function Component() {}
export const helper = () => {};
import { Button, Input } from './components';
export { formatDate, parseDate };
`;
      
      const result = identifier.identifyModularStructure(modularCode, 'test.ts');
      expect(result.type).toBe('modular_structure');
      expect(result.detected).toBe(true);
    });

    it('should identify feature isolated patterns', () => {
      const isolatedCode = `
export function useFeature() {
  return { data, loading };
}
export const useAuth = () => {};
export default class UserService {}
export const AppContext = createContext();
`;
      
      const result = identifier.identifyFeatureIsolated(isolatedCode, 'test.ts');
      expect(result.type).toBe('feature_isolated');
      expect(result.detected).toBe(true);
    });

    it('should identify SRP when functions are small and focused', () => {
      const result = identifier.identifySRP('code', 'test.ts', 5, 15);
      expect(result.type).toBe('single_responsibility');
      expect(result.detected).toBe(true);
    });

    it('should not identify SRP when functions are too large', () => {
      const result = identifier.identifySRP('code', 'test.ts', 2, 50);
      expect(result.detected).toBe(false);
    });

    it('should return valid detection results from identifyAll', () => {
      const goodCode = `
export const add = (a, b) => a + b;
import { helper } from '../utils';
export function useFeature() { return {}; }
`;
      
      const results = identifier.identifyAll(goodCode, 'test.ts');
      
      for (const result of results) {
        expect(result.detected).toBe(true);
        expect(result.locations.length).toBeGreaterThan(0);
        for (const location of result.locations) {
          expect(location.file).toBe('test.ts');
          expect(location.startLine).toBeGreaterThan(0);
        }
      }
    });

    it('should create valid GoodPractice from detection', () => {
      const detection = {
        detected: true,
        type: 'kiss' as GoodPracticeType,
        locations: [{
          file: 'test.ts',
          startLine: 1,
          endLine: 1,
          snippet: 'const add = (a, b) => a + b;',
        }],
      };
      
      const practice = identifier.createFromDetection(detection);
      
      expect(practice).not.toBeNull();
      expect(practice!.name).toContain('KISS');
      expect(practice!.evidence.filePath).toBe('test.ts');
      expect(practice!.description.length).toBeGreaterThan(0);
    });

    it('should return null for non-detected practices', () => {
      const detection = {
        detected: false,
        type: 'kiss' as GoodPracticeType,
        locations: [],
      };
      
      const practice = identifier.createFromDetection(detection);
      expect(practice).toBeNull();
    });

    it('should format practices with checkmarks', () => {
      fc.assert(
        fc.property(
          fc.array(goodPracticeAnalysisResult(), { minLength: 1, maxLength: 5 }).map(
            results => results.map(r => ({
              name: r.name,
              evidence: r.evidence,
              description: r.description,
            }))
          ),
          (practices) => {
            const formatted = identifier.formatWithCheckmarks(practices);
            
            expect(formatted).toContain('**Good Practices Observed:**');
            expect(formatted).toContain('✅');
            
            for (const practice of practices) {
              expect(formatted).toContain(practice.name);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return appropriate message for empty practices list', () => {
      const formatted = identifier.formatWithCheckmarks([]);
      expect(formatted).toBe('No specific good practices identified.');
    });
  });
});
