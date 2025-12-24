/**
 * Property-based tests for CompletenessEvaluator
 * 
 * **Feature: blind-evaluation-framework, Property 4: Completeness rating validity**
 * **Validates: Requirements 2.1**
 * 
 * For any feature completeness evaluation, the assigned rating SHALL be exactly
 * one of: "Not Implemented" (0%), "Partial" (1-49%), "Full" (50-99%), or
 * "Enterprise-Level" (100%), and the percentage SHALL fall within the
 * corresponding range.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  CompletenessEvaluator,
  createCapability,
  createCapabilityAnalysis,
  type Capability,
  type CapabilityAnalysisResult,
} from '../../src/evaluators/CompletenessEvaluator';
import type { AtomicFeature, CodeEvidence } from '../../types/evaluation';

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
 * Generate a capability
 */
const capability = (): fc.Arbitrary<Capability> =>
  fc.record({
    name: safeString(5, 30),
    description: fc.option(safeString(10, 50), { nil: undefined }),
    required: fc.boolean(),
    weight: fc.option(fc.integer({ min: 1, max: 5 }), { nil: undefined }),
  });

/**
 * Generate a capability status
 */
const capabilityStatus = () =>
  fc.constantFrom('implemented', 'missing', 'incomplete') as fc.Arbitrary<'implemented' | 'missing' | 'incomplete'>;

/**
 * Generate a capability analysis result
 */
const capabilityAnalysisResult = (): fc.Arbitrary<CapabilityAnalysisResult> =>
  fc.record({
    capability: capability(),
    status: capabilityStatus(),
    details: fc.option(safeString(10, 50), { nil: undefined }),
    evidence: fc.option(codeEvidence(), { nil: undefined }),
  });

/**
 * Generate an array of capability analysis results
 */
const capabilityAnalysisResults = () =>
  fc.array(capabilityAnalysisResult(), { minLength: 1, maxLength: 10 });

// ============================================================================
// Property Tests
// ============================================================================

describe('CompletenessEvaluator Property Tests', () => {
  const evaluator = new CompletenessEvaluator();

  /**
   * **Feature: blind-evaluation-framework, Property 4: Completeness rating validity**
   * **Validates: Requirements 2.1**
   */
  describe('Property 4: Completeness rating validity', () => {
    it('should assign valid completeness ratings from the allowed set', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          capabilityAnalysisResults(),
          codeEvidence(),
          (feature, analysisResults, evidence) => {
            const evaluation = evaluator.evaluate(feature, analysisResults, evidence);
            
            const validRatings = ['Not Implemented', 'Partial', 'Full', 'Enterprise-Level'];
            expect(validRatings).toContain(evaluation.rating);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should assign percentage within 0-100 range', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          capabilityAnalysisResults(),
          codeEvidence(),
          (feature, analysisResults, evidence) => {
            const evaluation = evaluator.evaluate(feature, analysisResults, evidence);
            
            expect(evaluation.percentage).toBeGreaterThanOrEqual(0);
            expect(evaluation.percentage).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should assign "Not Implemented" rating when percentage is 0', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          codeEvidence(),
          (feature, evidence) => {
            // Create analysis results with all missing capabilities
            const capabilities = [
              createCapability('Capability 1', true),
              createCapability('Capability 2', true),
            ];
            const analysisResults = capabilities.map(cap =>
              createCapabilityAnalysis(cap, 'missing')
            );

            const evaluation = evaluator.evaluate(feature, analysisResults, evidence);
            
            expect(evaluation.rating).toBe('Not Implemented');
            expect(evaluation.percentage).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should assign "Partial" rating when percentage is 1-49', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          codeEvidence(),
          fc.integer({ min: 1, max: 49 }),
          (feature, evidence, targetPercentage) => {
            // Create capabilities to achieve approximately the target percentage
            const totalCaps = 100;
            const implementedCount = targetPercentage;
            
            const capabilities: Capability[] = [];
            const analysisResults: CapabilityAnalysisResult[] = [];
            
            for (let i = 0; i < totalCaps; i++) {
              const cap = createCapability(`Capability ${i}`, true, 1);
              capabilities.push(cap);
              analysisResults.push(
                createCapabilityAnalysis(
                  cap,
                  i < implementedCount ? 'implemented' : 'missing'
                )
              );
            }

            const evaluation = evaluator.evaluate(feature, analysisResults, evidence);
            
            expect(evaluation.rating).toBe('Partial');
            expect(evaluation.percentage).toBeGreaterThanOrEqual(1);
            expect(evaluation.percentage).toBeLessThanOrEqual(49);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should assign "Full" rating when percentage is 50-99', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          codeEvidence(),
          fc.integer({ min: 50, max: 99 }),
          (feature, evidence, targetPercentage) => {
            // Create capabilities to achieve approximately the target percentage
            const totalCaps = 100;
            const implementedCount = targetPercentage;
            
            const capabilities: Capability[] = [];
            const analysisResults: CapabilityAnalysisResult[] = [];
            
            for (let i = 0; i < totalCaps; i++) {
              const cap = createCapability(`Capability ${i}`, true, 1);
              capabilities.push(cap);
              analysisResults.push(
                createCapabilityAnalysis(
                  cap,
                  i < implementedCount ? 'implemented' : 'missing'
                )
              );
            }

            const evaluation = evaluator.evaluate(feature, analysisResults, evidence);
            
            expect(evaluation.rating).toBe('Full');
            expect(evaluation.percentage).toBeGreaterThanOrEqual(50);
            expect(evaluation.percentage).toBeLessThanOrEqual(99);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should assign "Enterprise-Level" rating when percentage is 100', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          codeEvidence(),
          (feature, evidence) => {
            // Create analysis results with all implemented capabilities
            const capabilities = [
              createCapability('Capability 1', true),
              createCapability('Capability 2', true),
              createCapability('Capability 3', true),
            ];
            const analysisResults = capabilities.map(cap =>
              createCapabilityAnalysis(cap, 'implemented')
            );

            const evaluation = evaluator.evaluate(feature, analysisResults, evidence);
            
            expect(evaluation.rating).toBe('Enterprise-Level');
            expect(evaluation.percentage).toBe(100);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have rating consistent with percentage range', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          capabilityAnalysisResults(),
          codeEvidence(),
          (feature, analysisResults, evidence) => {
            const evaluation = evaluator.evaluate(feature, analysisResults, evidence);
            
            // Verify rating matches percentage range
            if (evaluation.percentage === 0) {
              expect(evaluation.rating).toBe('Not Implemented');
            } else if (evaluation.percentage >= 1 && evaluation.percentage <= 49) {
              expect(evaluation.rating).toBe('Partial');
            } else if (evaluation.percentage >= 50 && evaluation.percentage <= 99) {
              expect(evaluation.rating).toBe('Full');
            } else if (evaluation.percentage === 100) {
              expect(evaluation.rating).toBe('Enterprise-Level');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate rating-percentage consistency via isValidRatingForPercentage', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          (percentage) => {
            const rating = evaluator.determineRating(percentage);
            expect(evaluator.isValidRatingForPercentage(rating, percentage)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Percentage calculation', () => {
    it('should calculate percentage correctly based on weights', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              weight: fc.integer({ min: 1, max: 10 }),
              status: capabilityStatus(),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (items) => {
            const analysisResults: CapabilityAnalysisResult[] = items.map((item, i) => ({
              capability: createCapability(`Cap ${i}`, true, item.weight),
              status: item.status,
            }));

            const percentage = evaluator.calculatePercentage(analysisResults);
            
            // Calculate expected percentage
            let totalWeight = 0;
            let implementedWeight = 0;
            for (const item of items) {
              totalWeight += item.weight;
              if (item.status === 'implemented') {
                implementedWeight += item.weight;
              } else if (item.status === 'incomplete') {
                implementedWeight += item.weight * 0.5;
              }
            }
            const expected = Math.round((implementedWeight / totalWeight) * 100);
            
            expect(percentage).toBe(expected);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 0 for empty analysis results', () => {
      const percentage = evaluator.calculatePercentage([]);
      expect(percentage).toBe(0);
    });

    it('should treat incomplete capabilities as 50% implemented', () => {
      const cap = createCapability('Test', true, 2);
      const analysisResults = [createCapabilityAnalysis(cap, 'incomplete')];
      
      const percentage = evaluator.calculatePercentage(analysisResults);
      expect(percentage).toBe(50);
    });
  });

  describe('Rationale generation', () => {
    it('should generate non-empty rationale for any evaluation', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          capabilityAnalysisResults(),
          codeEvidence(),
          (feature, analysisResults, evidence) => {
            const evaluation = evaluator.evaluate(feature, analysisResults, evidence);
            
            expect(evaluation.rationale).toBeTruthy();
            expect(evaluation.rationale.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include feature name in rationale', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          capabilityAnalysisResults(),
          codeEvidence(),
          (feature, analysisResults, evidence) => {
            const evaluation = evaluator.evaluate(feature, analysisResults, evidence);
            
            expect(evaluation.rationale).toContain(feature.name);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include rating in rationale', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          capabilityAnalysisResults(),
          codeEvidence(),
          (feature, analysisResults, evidence) => {
            const evaluation = evaluator.evaluate(feature, analysisResults, evidence);
            
            expect(evaluation.rationale).toContain(evaluation.rating);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


// ============================================================================
// Property 5: Capability Status Markers Consistency Tests
// ============================================================================

import {
  CapabilityStatusFormatter,
  STATUS_MARKERS,
} from '../../src/evaluators/CompletenessEvaluator';
import type { CapabilityStatus } from '../../types/dimensions';

/**
 * Generate a capability status
 */
const capabilityStatusObject = (): fc.Arbitrary<CapabilityStatus> =>
  fc.record({
    capability: safeString(5, 30),
    status: capabilityStatus(),
    details: fc.option(safeString(10, 50), { nil: undefined }),
  });

describe('CapabilityStatusFormatter Property Tests', () => {
  /**
   * **Feature: blind-evaluation-framework, Property 5: Capability status markers consistency**
   * **Validates: Requirements 2.2, 2.3, 2.4**
   */
  describe('Property 5: Capability status markers consistency', () => {
    it('should mark all implemented capabilities with ✅', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              capability: safeString(5, 30),
              status: fc.constant('implemented' as const),
              details: fc.constant(undefined),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (capabilities) => {
            const formatted = CapabilityStatusFormatter.formatImplemented(capabilities);
            
            // Should contain the implemented marker
            expect(formatted).toContain(STATUS_MARKERS.IMPLEMENTED);
            expect(formatted).toContain('**Implemented:**');
            
            // Should contain all capability names
            for (const cap of capabilities) {
              expect(formatted).toContain(cap.capability);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should mark all missing capabilities with ❌', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              capability: safeString(5, 30),
              status: fc.constant('missing' as const),
              details: fc.constant(undefined),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (capabilities) => {
            const formatted = CapabilityStatusFormatter.formatMissing(capabilities);
            
            // Should contain the missing marker
            expect(formatted).toContain(STATUS_MARKERS.MISSING);
            expect(formatted).toContain('**Missing:**');
            
            // Should contain all capability names
            for (const cap of capabilities) {
              expect(formatted).toContain(cap.capability);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should mark all incomplete capabilities with ⚠️ and include details', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              capability: safeString(5, 30),
              status: fc.constant('incomplete' as const),
              details: safeString(10, 30),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (capabilities) => {
            const formatted = CapabilityStatusFormatter.formatIncomplete(capabilities);
            
            // Should contain the incomplete marker
            expect(formatted).toContain(STATUS_MARKERS.INCOMPLETE);
            expect(formatted).toContain('**Incomplete:**');
            
            // Should contain all capability names and details
            for (const cap of capabilities) {
              expect(formatted).toContain(cap.capability);
              if (cap.details) {
                expect(formatted).toContain(cap.details);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return empty string for empty capability lists', () => {
      expect(CapabilityStatusFormatter.formatImplemented([])).toBe('');
      expect(CapabilityStatusFormatter.formatMissing([])).toBe('');
      expect(CapabilityStatusFormatter.formatIncomplete([])).toBe('');
    });

    it('should correctly categorize capabilities in evaluation output', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          capabilityAnalysisResults(),
          codeEvidence(),
          (feature, analysisResults, evidence) => {
            const evaluator = new CompletenessEvaluator();
            const evaluation = evaluator.evaluate(feature, analysisResults, evidence);
            
            // All implemented capabilities should have 'implemented' status
            for (const cap of evaluation.implemented) {
              expect(cap.status).toBe('implemented');
            }
            
            // All missing capabilities should have 'missing' status
            for (const cap of evaluation.missing) {
              expect(cap.status).toBe('missing');
            }
            
            // All incomplete capabilities should have 'incomplete' status
            for (const cap of evaluation.incomplete) {
              expect(cap.status).toBe('incomplete');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve capability count across categorization', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          capabilityAnalysisResults(),
          codeEvidence(),
          (feature, analysisResults, evidence) => {
            const evaluator = new CompletenessEvaluator();
            const evaluation = evaluator.evaluate(feature, analysisResults, evidence);
            
            // Total capabilities should equal sum of all categories
            const totalInEvaluation = 
              evaluation.implemented.length + 
              evaluation.missing.length + 
              evaluation.incomplete.length;
            
            expect(totalInEvaluation).toBe(analysisResults.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return correct marker for each status type', () => {
      expect(CapabilityStatusFormatter.getMarker('implemented')).toBe('✅');
      expect(CapabilityStatusFormatter.getMarker('missing')).toBe('❌');
      expect(CapabilityStatusFormatter.getMarker('incomplete')).toBe('⚠️');
    });

    it('should format single capability with correct marker', () => {
      fc.assert(
        fc.property(
          capabilityStatusObject(),
          (capability) => {
            const formatted = CapabilityStatusFormatter.formatSingleCapability(capability);
            const expectedMarker = CapabilityStatusFormatter.getMarker(capability.status);
            
            expect(formatted).toContain(expectedMarker);
            expect(formatted).toContain(capability.capability);
            
            if (capability.details) {
              expect(formatted).toContain(capability.details);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format complete implementation status section correctly', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          capabilityAnalysisResults(),
          codeEvidence(),
          (feature, analysisResults, evidence) => {
            const evaluator = new CompletenessEvaluator();
            const evaluation = evaluator.evaluate(feature, analysisResults, evidence);
            
            const formatted = CapabilityStatusFormatter.formatImplementationStatus(evaluation);
            
            // Should be non-empty
            expect(formatted.length).toBeGreaterThan(0);
            
            // If there are implemented capabilities, should contain ✅
            if (evaluation.implemented.length > 0) {
              expect(formatted).toContain(STATUS_MARKERS.IMPLEMENTED);
            }
            
            // If there are missing capabilities, should contain ❌
            if (evaluation.missing.length > 0) {
              expect(formatted).toContain(STATUS_MARKERS.MISSING);
            }
            
            // If there are incomplete capabilities, should contain ⚠️
            if (evaluation.incomplete.length > 0) {
              expect(formatted).toContain(STATUS_MARKERS.INCOMPLETE);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
