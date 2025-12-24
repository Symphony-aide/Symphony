/**
 * Property-based tests for PerformanceEvaluator
 * 
 * Tests for Properties 15, 16, and 17 from the design document.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  PerformanceEvaluator,
  PerformanceConcernDocumenter,
  ComplexityAnalyzer,
  ReRenderDetector,
  OptimizationDetector,
  PerformanceAnalyzer,
  getValidPerformanceRatings,
  createDefaultAnalysis,
  createPerformanceConcern,
  createOptimizationFound,
  isValidPerformanceEvaluation,
  type PerformanceAnalysisResult,
} from '../../src/evaluators/PerformanceEvaluator';
import type { AtomicFeature, CodeEvidence } from '../../types/evaluation';
import type {
  PerformanceConcern,
  OptimizationFound,
  ComplexityAnalysis,
  ReRenderAnalysis,
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
 * Generate a performance concern
 */
const performanceConcern = (): fc.Arbitrary<PerformanceConcern> =>
  fc.record({
    id: fc.integer({ min: 1, max: 20 }),
    evidence: codeEvidence(),
    issue: safeString(10, 50),
    impact: safeString(10, 50),
    recommendedFix: safeString(10, 80),
  });

/**
 * Generate an optimization found
 */
const optimizationFound = (): fc.Arbitrary<OptimizationFound> =>
  fc.record({
    technique: fc.constantFrom(
      'memoization', 'debouncing', 'virtualization', 
      'useMemo', 'useCallback', 'React.memo', 'throttling'
    ),
    evidence: codeEvidence(),
    description: safeString(10, 80),
  });

/**
 * Generate complexity analysis
 */
const complexityAnalysis = (): fc.Arbitrary<ComplexityAnalysis> =>
  fc.record({
    algorithmicComplexity: fc.constantFrom('O(1)', 'O(n)', 'O(n²)', 'O(n³)'),
    loopAnalysis: safeString(10, 100),
  });

/**
 * Generate re-render analysis
 */
const reRenderAnalysis = (): fc.Arbitrary<ReRenderAnalysis> =>
  fc.record({
    hasUnnecessaryReRenders: fc.boolean(),
    issues: fc.array(safeString(10, 50), { minLength: 0, maxLength: 5 }),
  }).map(result => ({
    ...result,
    // Ensure consistency: if no issues, hasUnnecessaryReRenders should be false
    hasUnnecessaryReRenders: result.issues.length > 0 ? result.hasUnnecessaryReRenders : false,
  }));

/**
 * Generate performance analysis result
 */
const performanceAnalysisResult = (): fc.Arbitrary<PerformanceAnalysisResult> =>
  fc.record({
    concerns: fc.array(performanceConcern(), { minLength: 0, maxLength: 5 }),
    optimizations: fc.array(optimizationFound(), { minLength: 0, maxLength: 5 }),
    complexityAnalysis: complexityAnalysis(),
    reRenderAnalysis: reRenderAnalysis(),
  });

// ============================================================================
// Property 15: Performance Rating Validity Tests
// ============================================================================

describe('PerformanceEvaluator Property Tests', () => {
  const evaluator = new PerformanceEvaluator();

  /**
   * **Feature: blind-evaluation-framework, Property 15: Performance rating validity**
   * **Validates: Requirements 6.1**
   */
  describe('Property 15: Performance rating validity', () => {
    it('should assign valid performance ratings from the allowed set', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          performanceAnalysisResult(),
          (feature, analysis) => {
            const evaluation = evaluator.evaluate(feature, analysis);
            
            const validRatings = getValidPerformanceRatings();
            expect(validRatings).toContain(evaluation.rating);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return exactly one of: Poor, Acceptable, Good, or Excellent', () => {
      fc.assert(
        fc.property(
          performanceAnalysisResult(),
          (analysis) => {
            const rating = evaluator.determineRating(analysis);
            
            expect(['Poor', 'Acceptable', 'Good', 'Excellent']).toContain(rating);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate ratings correctly via isValidRating', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('Poor', 'Acceptable', 'Good', 'Excellent'),
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
          fc.string().filter(s => !['Poor', 'Acceptable', 'Good', 'Excellent'].includes(s)),
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
          performanceAnalysisResult(),
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
          performanceAnalysisResult(),
          (feature, analysis) => {
            const evaluation = evaluator.evaluate(feature, analysis);
            
            expect(evaluation.assessment).toContain(feature.name);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve concerns and optimizations in evaluation', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          performanceAnalysisResult(),
          (feature, analysis) => {
            const evaluation = evaluator.evaluate(feature, analysis);
            
            expect(evaluation.concerns.length).toBe(analysis.concerns.length);
            expect(evaluation.optimizations.length).toBe(analysis.optimizations.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce valid evaluation via isValidPerformanceEvaluation', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          performanceAnalysisResult(),
          (feature, analysis) => {
            const evaluation = evaluator.evaluate(feature, analysis);
            
            expect(isValidPerformanceEvaluation(evaluation)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include complexity analysis in evaluation', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          performanceAnalysisResult(),
          (feature, analysis) => {
            const evaluation = evaluator.evaluate(feature, analysis);
            
            expect(typeof evaluation.complexityAnalysis.algorithmicComplexity).toBe('string');
            expect(typeof evaluation.complexityAnalysis.loopAnalysis).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include re-render analysis in evaluation', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          performanceAnalysisResult(),
          (feature, analysis) => {
            const evaluation = evaluator.evaluate(feature, analysis);
            
            expect(typeof evaluation.reRenderAnalysis.hasUnnecessaryReRenders).toBe('boolean');
            expect(Array.isArray(evaluation.reRenderAnalysis.issues)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});



// ============================================================================
// Property 16: Performance Concern Documentation Format Tests
// ============================================================================

describe('PerformanceConcernDocumenter Property Tests', () => {
  const documenter = new PerformanceConcernDocumenter();

  /**
   * **Feature: blind-evaluation-framework, Property 16: Performance concern documentation format**
   * **Validates: Requirements 6.2**
   */
  describe('Property 16: Performance concern documentation format', () => {
    it('should format concerns with numbered heading', () => {
      fc.assert(
        fc.property(
          performanceConcern(),
          (concern) => {
            const formatted = documenter.formatConcern(concern);
            
            expect(formatted).toContain(`**#${concern.id}:`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include code snippet with file and line numbers', () => {
      fc.assert(
        fc.property(
          performanceConcern(),
          (concern) => {
            const formatted = documenter.formatConcern(concern);
            
            expect(formatted).toContain(concern.evidence.filePath);
            expect(formatted).toContain(`${concern.evidence.lineNumbers.start}`);
            expect(formatted).toContain(`${concern.evidence.lineNumbers.end}`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include issue description', () => {
      fc.assert(
        fc.property(
          performanceConcern(),
          (concern) => {
            const formatted = documenter.formatConcern(concern);
            
            expect(formatted).toContain('**Issue:**');
            expect(formatted).toContain(concern.issue);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include impact description', () => {
      fc.assert(
        fc.property(
          performanceConcern(),
          (concern) => {
            const formatted = documenter.formatConcern(concern);
            
            expect(formatted).toContain('**Impact:**');
            expect(formatted).toContain(concern.impact);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include fix recommendation', () => {
      fc.assert(
        fc.property(
          performanceConcern(),
          (concern) => {
            const formatted = documenter.formatConcern(concern);
            
            expect(formatted).toContain('**Fix:**');
            expect(formatted).toContain(concern.recommendedFix);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include code block with language identifier', () => {
      fc.assert(
        fc.property(
          performanceConcern(),
          (concern) => {
            const formatted = documenter.formatConcern(concern);
            
            expect(formatted).toContain('```' + concern.evidence.language);
            expect(formatted).toContain('```');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format all concerns with proper structure', () => {
      fc.assert(
        fc.property(
          fc.array(performanceConcern(), { minLength: 1, maxLength: 5 }),
          (concerns) => {
            const formatted = documenter.formatAllConcerns(concerns);
            
            expect(formatted).toContain('**Performance Concerns Identified:**');
            
            // Each concern should have its numbered heading
            for (const concern of concerns) {
              expect(formatted).toContain(`**#${concern.id}:`);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return appropriate message for empty concerns', () => {
      const formatted = documenter.formatAllConcerns([]);
      expect(formatted).toBe('No performance concerns identified.');
    });
  });
});


// ============================================================================
// Property 17: Complexity Analysis Presence Tests
// ============================================================================

describe('ComplexityAnalyzer Property Tests', () => {
  const analyzer = new ComplexityAnalyzer();

  /**
   * **Feature: blind-evaluation-framework, Property 17: Complexity analysis presence**
   * **Validates: Requirements 6.3**
   */
  describe('Property 17: Complexity analysis presence', () => {
    it('should return valid complexity analysis structure', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 500 }),
          filePath(),
          (code, path) => {
            const analysis = analyzer.analyze(code, path);
            
            expect(typeof analysis.algorithmicComplexity).toBe('string');
            expect(typeof analysis.loopAnalysis).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include algorithmic complexity notation (O notation)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 500 }),
          filePath(),
          (code, path) => {
            const analysis = analyzer.analyze(code, path);
            
            // Should contain O notation
            expect(analysis.algorithmicComplexity).toMatch(/O\([^)]+\)/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect O(n) for single loops', () => {
      const codeWithSingleLoop = `
        function test(arr) {
          for (let i = 0; i < arr.length; i++) {
            console.log(arr[i]);
          }
        }
      `;
      
      const analysis = analyzer.analyze(codeWithSingleLoop, 'test.ts');
      
      expect(analysis.algorithmicComplexity).toBe('O(n)');
    });

    it('should detect O(n²) for nested loops', () => {
      const codeWithNestedLoops = `
        function test(arr) {
          for (let i = 0; i < arr.length; i++) {
            for (let j = 0; j < arr.length; j++) {
              console.log(arr[i], arr[j]);
            }
          }
        }
      `;
      
      const analysis = analyzer.analyze(codeWithNestedLoops, 'test.ts');
      
      expect(analysis.algorithmicComplexity).toBe('O(n²)');
    });

    it('should detect O(1) for code without loops', () => {
      const codeWithoutLoops = `
        function test(a, b) {
          const sum = a + b;
          return sum * 2;
        }
      `;
      
      const analysis = analyzer.analyze(codeWithoutLoops, 'test.ts');
      
      expect(analysis.algorithmicComplexity).toBe('O(1)');
    });

    it('should include loop analysis description', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 500 }),
          filePath(),
          (code, path) => {
            const analysis = analyzer.analyze(code, path);
            
            expect(analysis.loopAnalysis.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect forEach as a loop', () => {
      const codeWithForEach = `
        function test(arr) {
          arr.forEach(item => {
            console.log(item);
          });
        }
      `;
      
      const analysis = analyzer.analyze(codeWithForEach, 'test.ts');
      
      expect(analysis.algorithmicComplexity).toBe('O(n)');
      expect(analysis.loopAnalysis).toContain('forEach');
    });

    it('should detect map as a loop', () => {
      const codeWithMap = `
        function test(arr) {
          return arr.map(item => item * 2);
        }
      `;
      
      const analysis = analyzer.analyze(codeWithMap, 'test.ts');
      
      expect(analysis.algorithmicComplexity).toBe('O(n)');
      expect(analysis.loopAnalysis).toContain('map');
    });

    it('should detect filter as a loop', () => {
      const codeWithFilter = `
        function test(arr) {
          return arr.filter(item => item > 0);
        }
      `;
      
      const analysis = analyzer.analyze(codeWithFilter, 'test.ts');
      
      expect(analysis.algorithmicComplexity).toBe('O(n)');
      expect(analysis.loopAnalysis).toContain('filter');
    });
  });
});


// ============================================================================
// Re-Render Detector Tests
// ============================================================================

describe('ReRenderDetector Property Tests', () => {
  const detector = new ReRenderDetector();

  describe('Re-render detection', () => {
    it('should return valid re-render analysis structure', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 500 }),
          filePath(),
          (code, path) => {
            const analysis = detector.analyze(code, path);
            
            expect(typeof analysis.hasUnnecessaryReRenders).toBe('boolean');
            expect(Array.isArray(analysis.issues)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect inline objects in JSX', () => {
      const codeWithInlineObjects = `
        function Component() {
          return <div style={{ color: 'red' }}>Hello</div>;
        }
      `;
      
      const analysis = detector.analyze(codeWithInlineObjects, 'test.tsx');
      
      expect(analysis.hasUnnecessaryReRenders).toBe(true);
      expect(analysis.issues.some(i => i.includes('inline') || i.includes('Inline'))).toBe(true);
    });

    it('should detect missing useCallback', () => {
      const codeWithMissingUseCallback = `
        function Component() {
          const handleClick = (e) => {
            console.log(e);
          };
          return <button onClick={(e) => handleClick(e)}>Click</button>;
        }
      `;
      
      const analysis = detector.analyze(codeWithMissingUseCallback, 'test.tsx');
      
      expect(analysis.hasUnnecessaryReRenders).toBe(true);
      expect(analysis.issues.some(i => i.includes('useCallback'))).toBe(true);
    });

    it('should not flag code with useCallback', () => {
      const codeWithUseCallback = `
        function Component() {
          const handleClick = useCallback((e) => {
            console.log(e);
          }, []);
          return <button onClick={handleClick}>Click</button>;
        }
      `;
      
      const analysis = detector.analyze(codeWithUseCallback, 'test.tsx');
      
      // Should not have useCallback-related issues
      expect(analysis.issues.filter(i => i.includes('useCallback')).length).toBe(0);
    });

    it('should have consistent hasUnnecessaryReRenders with issues array', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 500 }),
          filePath(),
          (code, path) => {
            const analysis = detector.analyze(code, path);
            
            // If there are issues, hasUnnecessaryReRenders should be true
            if (analysis.issues.length > 0) {
              expect(analysis.hasUnnecessaryReRenders).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


// ============================================================================
// Optimization Detector Tests
// ============================================================================

describe('OptimizationDetector Property Tests', () => {
  const detector = new OptimizationDetector();

  describe('Optimization detection', () => {
    it('should return array of optimizations', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 500 }),
          filePath(),
          (code, path) => {
            const optimizations = detector.detect(code, path);
            
            expect(Array.isArray(optimizations)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect useMemo', () => {
      const codeWithUseMemo = `
        function Component({ items }) {
          const sortedItems = useMemo(() => {
            return items.sort((a, b) => a - b);
          }, [items]);
          return <div>{sortedItems}</div>;
        }
      `;
      
      const optimizations = detector.detect(codeWithUseMemo, 'test.tsx');
      
      expect(optimizations.some(o => o.technique === 'useMemo')).toBe(true);
    });

    it('should detect useCallback', () => {
      const codeWithUseCallback = `
        function Component() {
          const handleClick = useCallback(() => {
            console.log('clicked');
          }, []);
          return <button onClick={handleClick}>Click</button>;
        }
      `;
      
      const optimizations = detector.detect(codeWithUseCallback, 'test.tsx');
      
      expect(optimizations.some(o => o.technique === 'useCallback')).toBe(true);
    });

    it('should detect React.memo', () => {
      const codeWithMemo = `
        const MemoizedComponent = React.memo(function Component({ value }) {
          return <div>{value}</div>;
        });
      `;
      
      const optimizations = detector.detect(codeWithMemo, 'test.tsx');
      
      expect(optimizations.some(o => o.technique === 'React.memo')).toBe(true);
    });

    it('should detect debouncing', () => {
      const codeWithDebounce = `
        function Component() {
          const debouncedSearch = debounce((query) => {
            search(query);
          }, 300);
          return <input onChange={debouncedSearch} />;
        }
      `;
      
      const optimizations = detector.detect(codeWithDebounce, 'test.tsx');
      
      expect(optimizations.some(o => o.technique === 'debouncing')).toBe(true);
    });

    it('should detect throttling', () => {
      const codeWithThrottle = `
        function Component() {
          const throttledScroll = throttle(() => {
            updatePosition();
          }, 100);
          return <div onScroll={throttledScroll} />;
        }
      `;
      
      const optimizations = detector.detect(codeWithThrottle, 'test.tsx');
      
      expect(optimizations.some(o => o.technique === 'throttling')).toBe(true);
    });

    it('should detect virtualization', () => {
      const codeWithVirtualization = `
        import { VirtualList } from 'react-window';
        function Component({ items }) {
          return <VirtualList items={items} />;
        }
      `;
      
      const optimizations = detector.detect(codeWithVirtualization, 'test.tsx');
      
      expect(optimizations.some(o => o.technique === 'virtualization')).toBe(true);
    });

    it('should format optimizations as checkboxes', () => {
      fc.assert(
        fc.property(
          fc.array(optimizationFound(), { minLength: 0, maxLength: 5 }),
          (optimizations) => {
            const formatted = detector.formatAsCheckboxes(optimizations);
            
            // Should contain checkbox markers
            const hasCheckboxes = formatted.includes('[x]') || formatted.includes('[ ]');
            expect(hasCheckboxes).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include all optimization techniques in checkboxes', () => {
      const formatted = detector.formatAsCheckboxes([]);
      
      expect(formatted).toContain('useMemo');
      expect(formatted).toContain('useCallback');
      expect(formatted).toContain('React.memo');
      expect(formatted).toContain('debouncing');
      expect(formatted).toContain('throttling');
      expect(formatted).toContain('virtualization');
      expect(formatted).toContain('memoization');
    });
  });
});


// ============================================================================
// Performance Analyzer Tests
// ============================================================================

describe('PerformanceAnalyzer Property Tests', () => {
  const analyzer = new PerformanceAnalyzer();

  describe('Performance analysis', () => {
    it('should return valid analysis result structure', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 500 }),
          filePath(),
          (code, path) => {
            const result = analyzer.analyze(code, path);
            
            expect(Array.isArray(result.concerns)).toBe(true);
            expect(Array.isArray(result.optimizations)).toBe(true);
            expect(typeof result.complexityAnalysis.algorithmicComplexity).toBe('string');
            expect(typeof result.complexityAnalysis.loopAnalysis).toBe('string');
            expect(typeof result.reRenderAnalysis.hasUnnecessaryReRenders).toBe('boolean');
            expect(Array.isArray(result.reRenderAnalysis.issues)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should identify concerns for nested loops', () => {
      const codeWithNestedLoops = `
        function test(arr) {
          for (let i = 0; i < arr.length; i++) {
            for (let j = 0; j < arr.length; j++) {
              console.log(arr[i], arr[j]);
            }
          }
        }
      `;
      
      const result = analyzer.analyze(codeWithNestedLoops, 'test.ts');
      
      expect(result.concerns.length).toBeGreaterThan(0);
      expect(result.concerns.some(c => c.issue.includes('O(n²)') || c.issue.includes('Nested'))).toBe(true);
    });

    it('should combine all analysis components', () => {
      const codeWithMultiplePatterns = `
        function Component({ items }) {
          const sortedItems = useMemo(() => {
            return items.filter(i => i > 0).map(i => i * 2);
          }, [items]);
          
          return <div style={{ color: 'red' }}>{sortedItems}</div>;
        }
      `;
      
      const result = analyzer.analyze(codeWithMultiplePatterns, 'test.tsx');
      
      // Should detect useMemo optimization
      expect(result.optimizations.some(o => o.technique === 'useMemo')).toBe(true);
      
      // Should detect inline style issue
      expect(result.reRenderAnalysis.hasUnnecessaryReRenders).toBe(true);
    });
  });
});


// ============================================================================
// Helper Function Tests
// ============================================================================

describe('Performance Evaluator Helper Functions', () => {
  describe('getValidPerformanceRatings', () => {
    it('should return exactly 4 valid ratings', () => {
      const ratings = getValidPerformanceRatings();
      expect(ratings.length).toBe(4);
    });

    it('should include all expected ratings', () => {
      const ratings = getValidPerformanceRatings();
      expect(ratings).toContain('Poor');
      expect(ratings).toContain('Acceptable');
      expect(ratings).toContain('Good');
      expect(ratings).toContain('Excellent');
    });
  });

  describe('createDefaultAnalysis', () => {
    it('should create analysis with empty arrays', () => {
      const analysis = createDefaultAnalysis();
      
      expect(analysis.concerns).toEqual([]);
      expect(analysis.optimizations).toEqual([]);
    });

    it('should create analysis with O(1) complexity', () => {
      const analysis = createDefaultAnalysis();
      
      expect(analysis.complexityAnalysis.algorithmicComplexity).toBe('O(1)');
    });

    it('should create analysis with no re-render issues', () => {
      const analysis = createDefaultAnalysis();
      
      expect(analysis.reRenderAnalysis.hasUnnecessaryReRenders).toBe(false);
      expect(analysis.reRenderAnalysis.issues).toEqual([]);
    });
  });

  describe('createPerformanceConcern', () => {
    it('should create valid performance concern', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }),
          filePath(),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          safeString(10, 50),
          safeString(10, 50),
          safeString(10, 50),
          safeString(10, 80),
          fc.constantFrom('javascript', 'typescript'),
          (id, path, startLine, offset, snippet, issue, impact, fix, language) => {
            const endLine = startLine + offset;
            const concern = createPerformanceConcern(
              id, path, startLine, endLine, snippet, issue, impact, fix, language
            );
            
            expect(concern.id).toBe(id);
            expect(concern.evidence.filePath).toBe(path);
            expect(concern.evidence.lineNumbers.start).toBe(startLine);
            expect(concern.evidence.lineNumbers.end).toBe(endLine);
            expect(concern.evidence.codeSnippet).toBe(snippet);
            expect(concern.issue).toBe(issue);
            expect(concern.impact).toBe(impact);
            expect(concern.recommendedFix).toBe(fix);
            expect(concern.evidence.language).toBe(language);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('createOptimizationFound', () => {
    it('should create valid optimization found', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('memoization', 'debouncing', 'virtualization', 'useMemo', 'useCallback', 'React.memo', 'throttling'),
          filePath(),
          fc.integer({ min: 1, max: 500 }),
          safeString(10, 50),
          safeString(10, 80),
          fc.constantFrom('javascript', 'typescript'),
          (technique, path, line, snippet, description, language) => {
            const optimization = createOptimizationFound(
              technique as OptimizationFound['technique'],
              path, line, snippet, description, language
            );
            
            expect(optimization.technique).toBe(technique);
            expect(optimization.evidence.filePath).toBe(path);
            expect(optimization.evidence.lineNumbers.start).toBe(line);
            expect(optimization.evidence.lineNumbers.end).toBe(line);
            expect(optimization.evidence.codeSnippet).toBe(snippet);
            expect(optimization.description).toBe(description);
            expect(optimization.evidence.language).toBe(language);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('isValidPerformanceEvaluation', () => {
    it('should validate correct evaluations', () => {
      const evaluator = new PerformanceEvaluator();
      
      fc.assert(
        fc.property(
          atomicFeature(),
          performanceAnalysisResult(),
          (feature, analysis) => {
            const evaluation = evaluator.evaluate(feature, analysis);
            
            expect(isValidPerformanceEvaluation(evaluation)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject evaluations with invalid ratings', () => {
      const invalidEvaluation = {
        rating: 'Invalid' as any,
        concerns: [],
        optimizations: [],
        complexityAnalysis: { algorithmicComplexity: 'O(1)', loopAnalysis: '' },
        reRenderAnalysis: { hasUnnecessaryReRenders: false, issues: [] },
        assessment: 'Test assessment',
      };
      
      expect(isValidPerformanceEvaluation(invalidEvaluation)).toBe(false);
    });

    it('should reject evaluations with empty assessment', () => {
      const invalidEvaluation = {
        rating: 'Good' as const,
        concerns: [],
        optimizations: [],
        complexityAnalysis: { algorithmicComplexity: 'O(1)', loopAnalysis: '' },
        reRenderAnalysis: { hasUnnecessaryReRenders: false, issues: [] },
        assessment: '',
      };
      
      expect(isValidPerformanceEvaluation(invalidEvaluation)).toBe(false);
    });
  });
});
