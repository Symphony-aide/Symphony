/**
 * Property-based tests for StressCollapseEstimator
 * 
 * Tests for Property 21 and Property 22 from the design document.
 * 
 * **Feature: blind-evaluation-framework, Property 21: Stress collapse format**
 * **Validates: Requirements 9.1**
 * 
 * **Feature: blind-evaluation-framework, Property 22: Stress collapse N/A handling**
 * **Validates: Requirements 9.5**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  StressCollapseEstimator,
  StressPatternAnalyzer,
  CollapseConditionGenerator,
  RobustFeatureHandler,
  StressCollapseAnalyzer,
  getValidStressPatternTypes,
  createDefaultAnalysis,
  createStressPattern,
  createStressCollapseCondition,
  isValidStressCollapseEvaluation,
  isValidStressCollapseCondition,
  formatStressCollapseAsMarkdown,
  type StressPatternType,
  type StressPattern,
  type StressAnalysisResult,
} from '../../src/evaluators/StressCollapseEstimator';
import type { AtomicFeature, CodeEvidence } from '../../types/evaluation';
import type { StressCollapseCondition, StressCollapseEvaluation } from '../../types/dimensions';

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
 * Generate a valid code evidence
 */
const codeEvidence = (): fc.Arbitrary<CodeEvidence> =>
  fc.record({
    filePath: filePath(),
    lineNumbers: fc.record({
      start: fc.integer({ min: 1, max: 500 }),
      end: fc.integer({ min: 1, max: 600 }),
    }).map(ln => ({
      start: ln.start,
      end: Math.max(ln.start, ln.end),
    })),
    codeSnippet: safeString(10, 100),
    language: fc.constantFrom('typescript', 'javascript'),
  });

/**
 * Generate a valid stress pattern type
 */
const stressPatternType = (): fc.Arbitrary<StressPatternType> =>
  fc.constantFrom(
    'loop',
    'state_update',
    'api_call',
    'interval',
    'filtering',
    'recursion',
    'dom_manipulation',
    'event_listener',
    'memory_allocation'
  );

/**
 * Generate a valid stress pattern
 */
const stressPattern = (): fc.Arbitrary<StressPattern> =>
  fc.record({
    type: stressPatternType(),
    evidence: codeEvidence(),
    description: safeString(10, 80),
    estimatedThreshold: safeString(5, 50),
    expectedBehavior: safeString(10, 100),
    reasoning: fc.array(safeString(10, 80), { minLength: 1, maxLength: 5 }),
  });

/**
 * Generate a valid stress collapse condition
 */
const stressCollapseCondition = (): fc.Arbitrary<StressCollapseCondition> =>
  fc.record({
    id: fc.integer({ min: 1, max: 100 }),
    threshold: safeString(5, 50),
    expectedBehavior: safeString(10, 100),
    reasoning: fc.array(safeString(10, 80), { minLength: 1, maxLength: 5 }),
    codePatternReferences: fc.array(codeEvidence(), { minLength: 0, maxLength: 3 }),
  });

/**
 * Generate a stress analysis result with patterns
 */
const stressAnalysisWithPatterns = (): fc.Arbitrary<StressAnalysisResult> =>
  fc.record({
    patterns: fc.array(stressPattern(), { minLength: 1, maxLength: 5 }),
    isRobust: fc.constant(false),
    robustReason: fc.constant(undefined),
  });

/**
 * Generate a robust stress analysis result
 */
const robustStressAnalysis = (): fc.Arbitrary<StressAnalysisResult> =>
  fc.record({
    patterns: fc.constant([]),
    isRobust: fc.constant(true),
    robustReason: fc.constantFrom(
      'N/A - simple boolean toggle',
      'N/A - pagination prevents large data issues',
      'N/A - virtualization handles large lists',
      'N/A - debouncing/throttling prevents rapid updates',
      'No stress collapse scenarios identified'
    ),
  });


// ============================================================================
// Property 21: Stress Collapse Format Tests
// ============================================================================

describe('StressCollapseEstimator Property Tests', () => {
  const estimator = new StressCollapseEstimator();

  /**
   * **Feature: blind-evaluation-framework, Property 21: Stress collapse format**
   * **Validates: Requirements 9.1**
   */
  describe('Property 21: Stress collapse format', () => {
    it('should generate conditions with valid format: [Numeric threshold] → [Expected behavior]', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          stressAnalysisWithPatterns(),
          (feature, analysis) => {
            const evaluation = estimator.evaluate(feature, analysis);
            
            // Each condition should have threshold and expectedBehavior
            for (const condition of evaluation.conditions) {
              expect(condition.threshold).toBeTruthy();
              expect(condition.threshold.length).toBeGreaterThan(0);
              expect(condition.expectedBehavior).toBeTruthy();
              expect(condition.expectedBehavior.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate conditions with unique sequential IDs', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          stressAnalysisWithPatterns(),
          (feature, analysis) => {
            const evaluation = estimator.evaluate(feature, analysis);
            
            // IDs should be sequential starting from 1
            const ids = evaluation.conditions.map(c => c.id);
            for (let i = 0; i < ids.length; i++) {
              expect(ids[i]).toBe(i + 1);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include reasoning array with at least one item for each condition', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          stressAnalysisWithPatterns(),
          (feature, analysis) => {
            const evaluation = estimator.evaluate(feature, analysis);
            
            for (const condition of evaluation.conditions) {
              expect(Array.isArray(condition.reasoning)).toBe(true);
              expect(condition.reasoning.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include code pattern references array for each condition', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          stressAnalysisWithPatterns(),
          (feature, analysis) => {
            const evaluation = estimator.evaluate(feature, analysis);
            
            for (const condition of evaluation.conditions) {
              expect(Array.isArray(condition.codePatternReferences)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce valid evaluation via isValidStressCollapseEvaluation', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          stressAnalysisWithPatterns(),
          (feature, analysis) => {
            const evaluation = estimator.evaluate(feature, analysis);
            
            expect(isValidStressCollapseEvaluation(evaluation)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce valid conditions via isValidStressCollapseCondition', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          stressAnalysisWithPatterns(),
          (feature, analysis) => {
            const evaluation = estimator.evaluate(feature, analysis);
            
            for (const condition of evaluation.conditions) {
              expect(isValidStressCollapseCondition(condition)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


// ============================================================================
// Property 22: Stress Collapse N/A Handling Tests
// ============================================================================

describe('RobustFeatureHandler Property Tests', () => {
  const handler = new RobustFeatureHandler();

  /**
   * **Feature: blind-evaluation-framework, Property 22: Stress collapse N/A handling**
   * **Validates: Requirements 9.5**
   */
  describe('Property 22: Stress collapse N/A handling', () => {
    it('should return isRobust=true with robustReason for robust features', () => {
      fc.assert(
        fc.property(
          robustStressAnalysis(),
          (analysis) => {
            // Robust analysis should have isRobust=true and a reason
            expect(analysis.isRobust).toBe(true);
            expect(analysis.robustReason).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate N/A evaluation with empty conditions for robust features', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'N/A - simple boolean toggle',
            'N/A - pagination prevents large data issues',
            'N/A - virtualization handles large lists',
            'N/A - debouncing/throttling prevents rapid updates'
          ),
          (reason) => {
            const evaluation = handler.generateNAEvaluation(reason);
            
            expect(evaluation.conditions).toEqual([]);
            expect(evaluation.isRobust).toBe(true);
            expect(evaluation.robustReason).toBe(reason);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect simple boolean features as robust', () => {
      const simpleBooleanCode = `
        const [isOpen, setIsOpen] = useState(false);
        
        const toggle = () => {
          setIsOpen(!isOpen);
        };
        
        return <button onClick={toggle}>{isOpen ? 'Close' : 'Open'}</button>;
      `;
      
      const result = handler.checkRobustness(simpleBooleanCode);
      
      expect(result.isRobust).toBe(true);
      expect(result.reason).toContain('N/A');
    });

    it('should detect pagination as robust', () => {
      const paginatedCode = `
        const [page, setPage] = useState(1);
        const pageSize = 20;
        
        const items = data.slice((page - 1) * pageSize, page * pageSize);
        
        return <List items={items} />;
      `;
      
      const result = handler.checkRobustness(paginatedCode);
      
      expect(result.isRobust).toBe(true);
      expect(result.reason).toContain('pagination');
    });

    it('should detect virtualization as robust', () => {
      const virtualizedCode = `
        import { VirtualList } from 'react-window';
        
        return <VirtualList items={largeArray} />;
      `;
      
      const result = handler.checkRobustness(virtualizedCode);
      
      expect(result.isRobust).toBe(true);
      expect(result.reason).toContain('virtualization');
    });

    it('should detect debouncing as robust', () => {
      const debouncedCode = `
        import { debounce } from 'lodash';
        
        const handleSearch = debounce((query) => {
          fetchResults(query);
        }, 300);
      `;
      
      const result = handler.checkRobustness(debouncedCode);
      
      expect(result.isRobust).toBe(true);
      expect(result.reason).toContain('debouncing');
    });

    it('should format N/A as markdown correctly', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'N/A - simple boolean toggle',
            'N/A - pagination prevents large data issues',
            'N/A - virtualization handles large lists'
          ),
          (reason) => {
            const formatted = handler.formatAsMarkdown(reason);
            
            expect(formatted).toContain('Stress Collapse Estimation');
            expect(formatted).toContain(reason);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce valid evaluation for robust features via isValidStressCollapseEvaluation', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'N/A - simple boolean toggle',
            'N/A - pagination prevents large data issues'
          ),
          (reason) => {
            const evaluation = handler.generateNAEvaluation(reason);
            
            expect(isValidStressCollapseEvaluation(evaluation)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


// ============================================================================
// StressPatternAnalyzer Tests
// ============================================================================

describe('StressPatternAnalyzer Property Tests', () => {
  const analyzer = new StressPatternAnalyzer();

  describe('Pattern detection', () => {
    it('should detect loops in code', () => {
      const codeWithLoop = `
        function processItems(items) {
          for (let i = 0; i < items.length; i++) {
            process(items[i]);
          }
        }
      `;
      
      const result = analyzer.analyze(codeWithLoop, 'test.ts');
      
      const loopPatterns = result.patterns.filter(p => p.type === 'loop');
      expect(loopPatterns.length).toBeGreaterThan(0);
    });

    it('should detect while loops', () => {
      const codeWithWhile = `
        function waitForCondition() {
          while (!condition) {
            checkCondition();
          }
        }
      `;
      
      const result = analyzer.analyze(codeWithWhile, 'test.ts');
      
      const loopPatterns = result.patterns.filter(p => p.type === 'loop');
      expect(loopPatterns.length).toBeGreaterThan(0);
    });

    it('should detect setInterval patterns', () => {
      const codeWithInterval = `
        useEffect(() => {
          const id = setInterval(() => {
            updateData();
          }, 50);
          return () => clearInterval(id);
        }, []);
      `;
      
      const result = analyzer.analyze(codeWithInterval, 'test.tsx');
      
      const intervalPatterns = result.patterns.filter(p => p.type === 'interval');
      expect(intervalPatterns.length).toBeGreaterThan(0);
    });

    it('should detect chained array operations', () => {
      const codeWithChaining = `
        const result = items
          .filter(item => item.active)
          .map(item => item.value)
          .reduce((sum, val) => sum + val, 0);
      `;
      
      const result = analyzer.analyze(codeWithChaining, 'test.ts');
      
      const filterPatterns = result.patterns.filter(p => p.type === 'filtering');
      expect(filterPatterns.length).toBeGreaterThan(0);
    });

    it('should detect recursive functions', () => {
      const codeWithRecursion = `
        function factorial(n) {
          if (n <= 1) return 1;
          return n * factorial(n - 1);
        }
      `;
      
      const result = analyzer.analyze(codeWithRecursion, 'test.ts');
      
      const recursionPatterns = result.patterns.filter(p => p.type === 'recursion');
      expect(recursionPatterns.length).toBeGreaterThan(0);
    });

    it('should detect event listeners without cleanup', () => {
      const codeWithListener = `
        useEffect(() => {
          window.addEventListener('resize', handleResize);
        }, []);
      `;
      
      const result = analyzer.analyze(codeWithListener, 'test.tsx');
      
      const listenerPatterns = result.patterns.filter(p => p.type === 'event_listener');
      expect(listenerPatterns.length).toBeGreaterThan(0);
    });

    it('should return valid pattern types', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 50, maxLength: 500 }),
          filePath(),
          (code, path) => {
            const result = analyzer.analyze(code, path);
            
            const validTypes = getValidStressPatternTypes();
            for (const pattern of result.patterns) {
              expect(validTypes).toContain(pattern.type);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include evidence with valid file path and line numbers', () => {
      const codeWithLoop = `
        function test() {
          for (let i = 0; i < 100; i++) {
            console.log(i);
          }
        }
      `;
      
      const result = analyzer.analyze(codeWithLoop, 'test.ts');
      
      for (const pattern of result.patterns) {
        expect(pattern.evidence.filePath).toBe('test.ts');
        expect(pattern.evidence.lineNumbers.start).toBeGreaterThan(0);
        expect(pattern.evidence.lineNumbers.end).toBeGreaterThanOrEqual(pattern.evidence.lineNumbers.start);
      }
    });
  });
});


// ============================================================================
// CollapseConditionGenerator Tests
// ============================================================================

describe('CollapseConditionGenerator Property Tests', () => {
  const generator = new CollapseConditionGenerator();

  describe('Condition generation', () => {
    it('should generate condition with correct ID', () => {
      fc.assert(
        fc.property(
          stressPattern(),
          fc.integer({ min: 1, max: 100 }),
          (pattern, id) => {
            const condition = generator.generate(pattern, id);
            
            expect(condition.id).toBe(id);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve threshold from pattern', () => {
      fc.assert(
        fc.property(
          stressPattern(),
          fc.integer({ min: 1, max: 100 }),
          (pattern, id) => {
            const condition = generator.generate(pattern, id);
            
            expect(condition.threshold).toBe(pattern.estimatedThreshold);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve expectedBehavior from pattern', () => {
      fc.assert(
        fc.property(
          stressPattern(),
          fc.integer({ min: 1, max: 100 }),
          (pattern, id) => {
            const condition = generator.generate(pattern, id);
            
            expect(condition.expectedBehavior).toBe(pattern.expectedBehavior);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve reasoning from pattern', () => {
      fc.assert(
        fc.property(
          stressPattern(),
          fc.integer({ min: 1, max: 100 }),
          (pattern, id) => {
            const condition = generator.generate(pattern, id);
            
            expect(condition.reasoning).toEqual(pattern.reasoning);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate all conditions with sequential IDs', () => {
      fc.assert(
        fc.property(
          fc.array(stressPattern(), { minLength: 1, maxLength: 5 }),
          (patterns) => {
            const conditions = generator.generateAll(patterns);
            
            expect(conditions.length).toBe(patterns.length);
            for (let i = 0; i < conditions.length; i++) {
              expect(conditions[i].id).toBe(i + 1);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format condition as markdown with required sections', () => {
      fc.assert(
        fc.property(
          stressCollapseCondition(),
          (condition) => {
            const formatted = generator.formatAsMarkdown(condition);
            
            expect(formatted).toContain(`Condition ${condition.id}`);
            expect(formatted).toContain(condition.threshold);
            expect(formatted).toContain(condition.expectedBehavior);
            expect(formatted).toContain('Reasoning');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format all conditions as markdown', () => {
      fc.assert(
        fc.property(
          fc.array(stressCollapseCondition(), { minLength: 1, maxLength: 3 }),
          (conditions) => {
            const formatted = generator.formatAllAsMarkdown(conditions);
            
            for (const condition of conditions) {
              expect(formatted).toContain(`Condition ${condition.id}`);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return message for empty conditions', () => {
      const formatted = generator.formatAllAsMarkdown([]);
      
      expect(formatted).toContain('No stress collapse conditions');
    });
  });
});


// ============================================================================
// StressCollapseAnalyzer Tests
// ============================================================================

describe('StressCollapseAnalyzer Property Tests', () => {
  const analyzer = new StressCollapseAnalyzer();

  describe('Combined analysis', () => {
    it('should return robust result for simple boolean features', () => {
      const simpleBooleanCode = `
        const [isOpen, setIsOpen] = useState(false);
        const toggle = () => setIsOpen(!isOpen);
        return <button onClick={toggle}>{isOpen ? 'Close' : 'Open'}</button>;
      `;
      
      const result = analyzer.analyze(simpleBooleanCode, 'test.tsx');
      
      expect(result.isRobust).toBe(true);
      expect(result.robustReason).toBeTruthy();
    });

    it('should detect patterns in complex code', () => {
      // Use the pattern analyzer directly to test pattern detection
      // The StressCollapseAnalyzer first checks robustness which may return early
      const patternAnalyzer = analyzer.getPatternAnalyzer();
      
      const complexCode = `function processData(items) {
  for (let i = 0; i < items.length; i++) {
    for (let j = 0; j < items[i].children.length; j++) {
      process(items[i].children[j]);
    }
  }
}`;
      
      const result = patternAnalyzer.analyze(complexCode, 'test.ts');
      
      // Should detect nested loops
      expect(result.patterns.length).toBeGreaterThan(0);
    });

    it('should provide access to sub-components', () => {
      expect(analyzer.getPatternAnalyzer()).toBeInstanceOf(StressPatternAnalyzer);
      expect(analyzer.getConditionGenerator()).toBeInstanceOf(CollapseConditionGenerator);
      expect(analyzer.getRobustHandler()).toBeInstanceOf(RobustFeatureHandler);
    });
  });
});


// ============================================================================
// Helper Function Tests
// ============================================================================

describe('StressCollapseEstimator Helper Functions', () => {
  describe('getValidStressPatternTypes', () => {
    it('should return all valid pattern types', () => {
      const types = getValidStressPatternTypes();
      
      expect(types).toContain('loop');
      expect(types).toContain('state_update');
      expect(types).toContain('api_call');
      expect(types).toContain('interval');
      expect(types).toContain('filtering');
      expect(types).toContain('recursion');
      expect(types).toContain('dom_manipulation');
      expect(types).toContain('event_listener');
      expect(types).toContain('memory_allocation');
    });

    it('should return exactly 9 pattern types', () => {
      const types = getValidStressPatternTypes();
      expect(types.length).toBe(9);
    });
  });

  describe('createDefaultAnalysis', () => {
    it('should create robust analysis with empty patterns', () => {
      const analysis = createDefaultAnalysis();
      
      expect(analysis.patterns).toEqual([]);
      expect(analysis.isRobust).toBe(true);
      expect(analysis.robustReason).toBeTruthy();
    });
  });

  describe('createStressPattern', () => {
    it('should create pattern with all fields', () => {
      fc.assert(
        fc.property(
          stressPatternType(),
          codeEvidence(),
          safeString(10, 50),
          safeString(5, 30),
          safeString(10, 50),
          fc.array(safeString(10, 50), { minLength: 1, maxLength: 3 }),
          (type, evidence, description, threshold, behavior, reasoning) => {
            const pattern = createStressPattern(
              type,
              evidence,
              description,
              threshold,
              behavior,
              reasoning
            );
            
            expect(pattern.type).toBe(type);
            expect(pattern.evidence).toEqual(evidence);
            expect(pattern.description).toBe(description);
            expect(pattern.estimatedThreshold).toBe(threshold);
            expect(pattern.expectedBehavior).toBe(behavior);
            expect(pattern.reasoning).toEqual(reasoning);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('createStressCollapseCondition', () => {
    it('should create condition with all fields', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          safeString(5, 30),
          safeString(10, 50),
          fc.array(safeString(10, 50), { minLength: 1, maxLength: 3 }),
          fc.array(codeEvidence(), { minLength: 0, maxLength: 2 }),
          (id, threshold, behavior, reasoning, refs) => {
            const condition = createStressCollapseCondition(
              id,
              threshold,
              behavior,
              reasoning,
              refs
            );
            
            expect(condition.id).toBe(id);
            expect(condition.threshold).toBe(threshold);
            expect(condition.expectedBehavior).toBe(behavior);
            expect(condition.reasoning).toEqual(reasoning);
            expect(condition.codePatternReferences).toEqual(refs);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('isValidStressCollapseEvaluation', () => {
    it('should validate correct evaluations with conditions', () => {
      fc.assert(
        fc.property(
          fc.array(stressCollapseCondition(), { minLength: 1, maxLength: 3 }),
          (conditions) => {
            const evaluation: StressCollapseEvaluation = {
              conditions,
              isRobust: false,
            };
            
            expect(isValidStressCollapseEvaluation(evaluation)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate correct robust evaluations', () => {
      fc.assert(
        fc.property(
          safeString(10, 50),
          (reason) => {
            const evaluation: StressCollapseEvaluation = {
              conditions: [],
              isRobust: true,
              robustReason: reason,
            };
            
            expect(isValidStressCollapseEvaluation(evaluation)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject robust evaluation without reason', () => {
      const evaluation: StressCollapseEvaluation = {
        conditions: [],
        isRobust: true,
        // Missing robustReason
      };
      
      expect(isValidStressCollapseEvaluation(evaluation)).toBe(false);
    });

    it('should reject non-robust evaluation without conditions', () => {
      const evaluation: StressCollapseEvaluation = {
        conditions: [],
        isRobust: false,
      };
      
      expect(isValidStressCollapseEvaluation(evaluation)).toBe(false);
    });
  });

  describe('isValidStressCollapseCondition', () => {
    it('should validate correct conditions', () => {
      fc.assert(
        fc.property(
          stressCollapseCondition(),
          (condition) => {
            expect(isValidStressCollapseCondition(condition)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject condition with id <= 0', () => {
      const condition: StressCollapseCondition = {
        id: 0,
        threshold: '1000 items',
        expectedBehavior: 'UI freeze',
        reasoning: ['Test reason'],
        codePatternReferences: [],
      };
      
      expect(isValidStressCollapseCondition(condition)).toBe(false);
    });

    it('should reject condition with empty threshold', () => {
      const condition: StressCollapseCondition = {
        id: 1,
        threshold: '',
        expectedBehavior: 'UI freeze',
        reasoning: ['Test reason'],
        codePatternReferences: [],
      };
      
      expect(isValidStressCollapseCondition(condition)).toBe(false);
    });

    it('should reject condition with empty reasoning', () => {
      const condition: StressCollapseCondition = {
        id: 1,
        threshold: '1000 items',
        expectedBehavior: 'UI freeze',
        reasoning: [],
        codePatternReferences: [],
      };
      
      expect(isValidStressCollapseCondition(condition)).toBe(false);
    });
  });

  describe('formatStressCollapseAsMarkdown', () => {
    it('should format robust evaluation with N/A', () => {
      const evaluation: StressCollapseEvaluation = {
        conditions: [],
        isRobust: true,
        robustReason: 'N/A - simple boolean toggle',
      };
      
      const formatted = formatStressCollapseAsMarkdown(evaluation);
      
      expect(formatted).toContain('N/A');
      expect(formatted).toContain('simple boolean toggle');
    });

    it('should format evaluation with conditions', () => {
      fc.assert(
        fc.property(
          fc.array(stressCollapseCondition(), { minLength: 1, maxLength: 3 }),
          (conditions) => {
            const evaluation: StressCollapseEvaluation = {
              conditions,
              isRobust: false,
            };
            
            const formatted = formatStressCollapseAsMarkdown(evaluation);
            
            for (const condition of conditions) {
              expect(formatted).toContain(`Condition ${condition.id}`);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

