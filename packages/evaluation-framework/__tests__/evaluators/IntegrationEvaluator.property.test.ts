/**
 * Property-based tests for IntegrationEvaluator
 * 
 * Tests for Property 18 from the design document.
 * 
 * **Feature: blind-evaluation-framework, Property 18: Integration rating validity**
 * **Validates: Requirements 7.1**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  IntegrationEvaluator,
  ConfigurationOptionsDocumenter,
  ToggleCapabilityChecker,
  ExtensibilityChecker,
  FeatureInteractionAnalyzer,
  IntegrationAnalyzer,
  getValidIntegrationRatings,
  createDefaultAnalysis,
  createConfigurationOption,
  createExtensibilityAssessment,
  isValidIntegrationEvaluation,
  type IntegrationAnalysisResult,
} from '../../src/evaluators/IntegrationEvaluator';
import type { AtomicFeature } from '../../types/evaluation';
import type {
  ConfigurationOption,
  ExtensibilityAssessment,
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
 * Generate a configuration option
 */
const configurationOption = (): fc.Arbitrary<ConfigurationOption> =>
  fc.record({
    name: safeString(3, 20),
    type: fc.constantFrom('string', 'number', 'boolean', '() => void', 'React.ReactNode'),
    present: fc.boolean(),
    description: fc.option(safeString(10, 50), { nil: undefined }),
  });

/**
 * Generate an extensibility assessment
 */
const extensibilityAssessment = (): fc.Arbitrary<ExtensibilityAssessment> =>
  fc.record({
    hasHooksCallbacks: fc.boolean(),
    hasSomeExtensionPoints: fc.boolean(),
    isHardcoded: fc.boolean(),
    details: safeString(10, 100),
  }).map(assessment => {
    // Ensure logical consistency: if has hooks/callbacks or extension points, not hardcoded
    if (assessment.hasHooksCallbacks || assessment.hasSomeExtensionPoints) {
      return { ...assessment, isHardcoded: false };
    }
    return assessment;
  });

/**
 * Generate integration analysis result
 */
const integrationAnalysisResult = (): fc.Arbitrary<IntegrationAnalysisResult> =>
  fc.record({
    configurationOptions: fc.array(configurationOption(), { minLength: 0, maxLength: 10 }),
    extensibility: extensibilityAssessment(),
    toggleCapability: fc.boolean(),
    featureInteractions: safeString(10, 100),
  });


// ============================================================================
// Property 18: Integration Rating Validity Tests
// ============================================================================

describe('IntegrationEvaluator Property Tests', () => {
  const evaluator = new IntegrationEvaluator();

  /**
   * **Feature: blind-evaluation-framework, Property 18: Integration rating validity**
   * **Validates: Requirements 7.1**
   */
  describe('Property 18: Integration rating validity', () => {
    it('should assign valid integration ratings from the allowed set', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          integrationAnalysisResult(),
          (feature, analysis) => {
            const evaluation = evaluator.evaluate(feature, analysis);
            
            const validRatings = getValidIntegrationRatings();
            expect(validRatings).toContain(evaluation.rating);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return exactly one of: Not Compatible, Partial, Full, or Enterprise-Level', () => {
      fc.assert(
        fc.property(
          integrationAnalysisResult(),
          (analysis) => {
            const rating = evaluator.determineRating(analysis);
            
            expect(['Not Compatible', 'Partial', 'Full', 'Enterprise-Level']).toContain(rating);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate ratings correctly via isValidRating', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('Not Compatible', 'Partial', 'Full', 'Enterprise-Level'),
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
          fc.string().filter(s => !['Not Compatible', 'Partial', 'Full', 'Enterprise-Level'].includes(s)),
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
          integrationAnalysisResult(),
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
          integrationAnalysisResult(),
          (feature, analysis) => {
            const evaluation = evaluator.evaluate(feature, analysis);
            
            expect(evaluation.assessment).toContain(feature.name);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve configuration options in evaluation', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          integrationAnalysisResult(),
          (feature, analysis) => {
            const evaluation = evaluator.evaluate(feature, analysis);
            
            expect(evaluation.configurationOptions.length).toBe(analysis.configurationOptions.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve extensibility assessment in evaluation', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          integrationAnalysisResult(),
          (feature, analysis) => {
            const evaluation = evaluator.evaluate(feature, analysis);
            
            expect(evaluation.extensibility.hasHooksCallbacks).toBe(analysis.extensibility.hasHooksCallbacks);
            expect(evaluation.extensibility.hasSomeExtensionPoints).toBe(analysis.extensibility.hasSomeExtensionPoints);
            expect(evaluation.extensibility.isHardcoded).toBe(analysis.extensibility.isHardcoded);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve toggle capability in evaluation', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          integrationAnalysisResult(),
          (feature, analysis) => {
            const evaluation = evaluator.evaluate(feature, analysis);
            
            expect(evaluation.toggleCapability).toBe(analysis.toggleCapability);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce valid evaluation via isValidIntegrationEvaluation', () => {
      fc.assert(
        fc.property(
          atomicFeature(),
          integrationAnalysisResult(),
          (feature, analysis) => {
            const evaluation = evaluator.evaluate(feature, analysis);
            
            expect(isValidIntegrationEvaluation(evaluation)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


// ============================================================================
// Configuration Options Documenter Tests
// ============================================================================

describe('ConfigurationOptionsDocumenter Property Tests', () => {
  const documenter = new ConfigurationOptionsDocumenter();

  describe('Configuration options extraction', () => {
    it('should return array of configuration options', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 500 }),
          filePath(),
          (code, path) => {
            const options = documenter.extractOptions(code, path);
            
            expect(Array.isArray(options)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should extract props from interface definitions', () => {
      const codeWithInterface = `
        interface ButtonProps {
          onClick: () => void;
          disabled?: boolean;
          label: string;
        }
      `;
      
      const options = documenter.extractOptions(codeWithInterface, 'Button.tsx');
      
      expect(options.length).toBeGreaterThan(0);
      expect(options.some(o => o.name === 'onClick')).toBe(true);
      expect(options.some(o => o.name === 'disabled')).toBe(true);
      expect(options.some(o => o.name === 'label')).toBe(true);
    });

    it('should extract props from type definitions', () => {
      const codeWithType = `
        type InputProps = {
          value: string;
          onChange: (value: string) => void;
          placeholder?: string;
        }
      `;
      
      const options = documenter.extractOptions(codeWithType, 'Input.tsx');
      
      expect(options.length).toBeGreaterThan(0);
      expect(options.some(o => o.name === 'value')).toBe(true);
      expect(options.some(o => o.name === 'onChange')).toBe(true);
    });

    it('should format options as code snippet', () => {
      fc.assert(
        fc.property(
          fc.array(configurationOption(), { minLength: 1, maxLength: 5 }),
          (options) => {
            const formatted = documenter.formatAsCodeSnippet(options);
            
            expect(formatted).toContain('```typescript');
            expect(formatted).toContain('```');
            
            // Each option should be present
            for (const option of options) {
              expect(formatted).toContain(option.name);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format options as checkboxes', () => {
      fc.assert(
        fc.property(
          fc.array(configurationOption(), { minLength: 1, maxLength: 5 }),
          (options) => {
            const formatted = documenter.formatAsCheckboxes(options);
            
            // Should contain checkbox markers
            const hasCheckboxes = formatted.includes('[x]') || formatted.includes('[ ]');
            expect(hasCheckboxes).toBe(true);
            
            // Each option should be present
            for (const option of options) {
              expect(formatted).toContain(option.name);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return appropriate message for empty options', () => {
      const formatted = documenter.formatAsCodeSnippet([]);
      expect(formatted).toBe('No configuration options found.');
    });
  });
});


// ============================================================================
// Toggle Capability Checker Tests
// ============================================================================

describe('ToggleCapabilityChecker Property Tests', () => {
  const checker = new ToggleCapabilityChecker();

  describe('Toggle capability detection', () => {
    it('should return boolean for any code', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 500 }),
          filePath(),
          (code, path) => {
            const result = checker.check(code, path);
            
            expect(typeof result).toBe('boolean');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect enabled prop', () => {
      const codeWithEnabled = `
        interface Props {
          enabled: boolean;
        }
        function Component({ enabled }: Props) {
          if (!enabled) return null;
          return <div>Content</div>;
        }
      `;
      
      expect(checker.check(codeWithEnabled, 'test.tsx')).toBe(true);
    });

    it('should detect disabled prop', () => {
      const codeWithDisabled = `
        interface Props {
          disabled?: boolean;
        }
        function Component({ disabled }: Props) {
          return <button disabled={disabled}>Click</button>;
        }
      `;
      
      expect(checker.check(codeWithDisabled, 'test.tsx')).toBe(true);
    });

    it('should detect visible prop', () => {
      const codeWithVisible = `
        interface Props {
          visible: boolean;
        }
        function Component({ visible }: Props) {
          return visible ? <div>Content</div> : null;
        }
      `;
      
      expect(checker.check(codeWithVisible, 'test.tsx')).toBe(true);
    });

    it('should detect conditional rendering', () => {
      const codeWithConditional = `
        function Component({ show }) {
          return (
            <div>
              {show && <span>Visible</span>}
            </div>
          );
        }
      `;
      
      expect(checker.check(codeWithConditional, 'test.tsx')).toBe(true);
    });

    it('should document toggle capability', () => {
      const code = `
        interface Props {
          enabled: boolean;
        }
      `;
      
      const doc = checker.document(true, code);
      
      expect(doc.length).toBeGreaterThan(0);
      expect(doc).toContain('enabled');
    });
  });
});


// ============================================================================
// Extensibility Checker Tests
// ============================================================================

describe('ExtensibilityChecker Property Tests', () => {
  const checker = new ExtensibilityChecker();

  describe('Extensibility detection', () => {
    it('should return valid extensibility assessment structure', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 500 }),
          filePath(),
          (code, path) => {
            const assessment = checker.check(code, path);
            
            expect(typeof assessment.hasHooksCallbacks).toBe('boolean');
            expect(typeof assessment.hasSomeExtensionPoints).toBe('boolean');
            expect(typeof assessment.isHardcoded).toBe('boolean');
            expect(typeof assessment.details).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect callback props', () => {
      const codeWithCallbacks = `
        interface Props {
          onClick: () => void;
          onChange: (value: string) => void;
          onSubmit: () => void;
        }
      `;
      
      const assessment = checker.check(codeWithCallbacks, 'test.tsx');
      
      expect(assessment.hasHooksCallbacks).toBe(true);
    });

    it('should detect render props', () => {
      const codeWithRenderProps = `
        interface Props {
          renderItem: (item: any) => React.ReactNode;
          renderHeader?: () => React.ReactNode;
        }
      `;
      
      const assessment = checker.check(codeWithRenderProps, 'test.tsx');
      
      expect(assessment.hasHooksCallbacks).toBe(true);
    });

    it('should detect className and style props as extension points', () => {
      const codeWithStyling = `
        interface Props {
          className?: string;
          style?: React.CSSProperties;
        }
      `;
      
      const assessment = checker.check(codeWithStyling, 'test.tsx');
      
      expect(assessment.hasSomeExtensionPoints).toBe(true);
    });

    it('should detect forwardRef as extension point', () => {
      const codeWithForwardRef = `
        const Component = forwardRef((props, ref) => {
          return <div ref={ref}>Content</div>;
        });
      `;
      
      const assessment = checker.check(codeWithForwardRef, 'test.tsx');
      
      expect(assessment.hasSomeExtensionPoints).toBe(true);
    });

    it('should format extensibility as checkboxes', () => {
      fc.assert(
        fc.property(
          extensibilityAssessment(),
          (assessment) => {
            const formatted = checker.formatAsCheckboxes(assessment);
            
            // Should contain checkbox markers
            expect(formatted).toContain('[');
            expect(formatted).toContain(']');
            
            // Should contain all three categories
            expect(formatted).toContain('Hooks/callbacks');
            expect(formatted).toContain('extension points');
            expect(formatted).toContain('Hardcoded');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not mark as hardcoded if has hooks/callbacks', () => {
      const codeWithCallbacks = `
        interface Props {
          onClick: () => void;
          onChange: (value: string) => void;
        }
      `;
      
      const assessment = checker.check(codeWithCallbacks, 'test.tsx');
      
      if (assessment.hasHooksCallbacks) {
        expect(assessment.isHardcoded).toBe(false);
      }
    });
  });
});



// ============================================================================
// Feature Interaction Analyzer Tests
// ============================================================================

describe('FeatureInteractionAnalyzer Property Tests', () => {
  const analyzer = new FeatureInteractionAnalyzer();

  describe('Feature interaction analysis', () => {
    it('should return string for any code', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 500 }),
          filePath(),
          safeString(5, 20),
          (code, path, featureName) => {
            const result = analyzer.analyze(code, path, featureName);
            
            expect(typeof result).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect context usage', () => {
      const codeWithContext = `
        import { useContext } from 'react';
        import { ThemeContext } from './ThemeContext';
        
        function Component() {
          const theme = useContext(ThemeContext);
          return <div style={{ color: theme.primary }}>Content</div>;
        }
      `;
      
      const result = analyzer.analyze(codeWithContext, 'test.tsx', 'TestFeature');
      
      expect(result).toContain('context');
    });

    it('should detect Redux usage', () => {
      const codeWithRedux = `
        import { useSelector, useDispatch } from 'react-redux';
        
        function Component() {
          const data = useSelector(state => state.data);
          const dispatch = useDispatch();
          return <div>{data}</div>;
        }
      `;
      
      const result = analyzer.analyze(codeWithRedux, 'test.tsx', 'TestFeature');
      
      expect(result).toContain('Redux');
    });

    it('should detect children composition', () => {
      const codeWithChildren = `
        function Component({ children }) {
          return <div className="wrapper">{children}</div>;
        }
      `;
      
      const result = analyzer.analyze(codeWithChildren, 'test.tsx', 'TestFeature');
      
      expect(result).toContain('Children');
    });

    it('should document feature interactions', () => {
      const interactions = 'Uses contexts: ThemeContext. State sharing: Redux state management.';
      
      const doc = analyzer.document(interactions);
      
      expect(doc).toContain('Feature Interactions');
      expect(doc).toContain(interactions);
    });

    it('should handle self-contained features', () => {
      const selfContainedCode = `
        function Component() {
          const [count, setCount] = useState(0);
          return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
        }
      `;
      
      const result = analyzer.analyze(selfContainedCode, 'test.tsx', 'Counter');
      
      expect(result.length).toBeGreaterThan(0);
    });
  });
});


// ============================================================================
// Integration Analyzer Tests
// ============================================================================

describe('IntegrationAnalyzer Property Tests', () => {
  const analyzer = new IntegrationAnalyzer();

  describe('Integration analysis', () => {
    it('should return valid analysis result structure', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 500 }),
          filePath(),
          safeString(5, 20),
          (code, path, featureName) => {
            const result = analyzer.analyze(code, path, featureName);
            
            expect(Array.isArray(result.configurationOptions)).toBe(true);
            expect(typeof result.extensibility.hasHooksCallbacks).toBe('boolean');
            expect(typeof result.extensibility.hasSomeExtensionPoints).toBe('boolean');
            expect(typeof result.extensibility.isHardcoded).toBe('boolean');
            expect(typeof result.extensibility.details).toBe('string');
            expect(typeof result.toggleCapability).toBe('boolean');
            expect(typeof result.featureInteractions).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should combine all analysis components', () => {
      const comprehensiveCode = `
        interface ButtonProps {
          onClick: () => void;
          disabled?: boolean;
          className?: string;
          children: React.ReactNode;
        }
        
        function Button({ onClick, disabled, className, children }: ButtonProps) {
          const theme = useContext(ThemeContext);
          
          if (disabled) return null;
          
          return (
            <button 
              onClick={onClick} 
              className={className}
              style={{ color: theme.primary }}
            >
              {children}
            </button>
          );
        }
      `;
      
      const result = analyzer.analyze(comprehensiveCode, 'Button.tsx', 'Button');
      
      // Should detect configuration options
      expect(result.configurationOptions.length).toBeGreaterThan(0);
      
      // Should detect extensibility (callbacks)
      expect(result.extensibility.hasHooksCallbacks).toBe(true);
      
      // Should detect toggle capability (disabled prop)
      expect(result.toggleCapability).toBe(true);
      
      // Should detect feature interactions (context)
      expect(result.featureInteractions).toContain('context');
    });

    it('should provide access to sub-analyzers', () => {
      expect(analyzer.getConfigDocumenter()).toBeInstanceOf(ConfigurationOptionsDocumenter);
      expect(analyzer.getToggleChecker()).toBeInstanceOf(ToggleCapabilityChecker);
      expect(analyzer.getExtensibilityChecker()).toBeInstanceOf(ExtensibilityChecker);
      expect(analyzer.getInteractionAnalyzer()).toBeInstanceOf(FeatureInteractionAnalyzer);
    });
  });
});


// ============================================================================
// Helper Function Tests
// ============================================================================

describe('Integration Evaluator Helper Functions', () => {
  describe('getValidIntegrationRatings', () => {
    it('should return exactly 4 valid ratings', () => {
      const ratings = getValidIntegrationRatings();
      expect(ratings.length).toBe(4);
    });

    it('should include all expected ratings', () => {
      const ratings = getValidIntegrationRatings();
      expect(ratings).toContain('Not Compatible');
      expect(ratings).toContain('Partial');
      expect(ratings).toContain('Full');
      expect(ratings).toContain('Enterprise-Level');
    });
  });

  describe('createDefaultAnalysis', () => {
    it('should create analysis with empty configuration options', () => {
      const analysis = createDefaultAnalysis();
      
      expect(analysis.configurationOptions).toEqual([]);
    });

    it('should create analysis with hardcoded extensibility', () => {
      const analysis = createDefaultAnalysis();
      
      expect(analysis.extensibility.isHardcoded).toBe(true);
      expect(analysis.extensibility.hasHooksCallbacks).toBe(false);
      expect(analysis.extensibility.hasSomeExtensionPoints).toBe(false);
    });

    it('should create analysis with no toggle capability', () => {
      const analysis = createDefaultAnalysis();
      
      expect(analysis.toggleCapability).toBe(false);
    });

    it('should create analysis with empty feature interactions', () => {
      const analysis = createDefaultAnalysis();
      
      expect(analysis.featureInteractions).toBe('');
    });
  });

  describe('createConfigurationOption', () => {
    it('should create configuration option with all fields', () => {
      fc.assert(
        fc.property(
          safeString(3, 20),
          fc.constantFrom('string', 'number', 'boolean'),
          fc.boolean(),
          fc.option(safeString(10, 50), { nil: undefined }),
          (name, type, present, description) => {
            const option = createConfigurationOption(name, type, present, description);
            
            expect(option.name).toBe(name);
            expect(option.type).toBe(type);
            expect(option.present).toBe(present);
            expect(option.description).toBe(description);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('createExtensibilityAssessment', () => {
    it('should create extensibility assessment with all fields', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          fc.boolean(),
          fc.boolean(),
          safeString(10, 100),
          (hasHooksCallbacks, hasSomeExtensionPoints, isHardcoded, details) => {
            const assessment = createExtensibilityAssessment(
              hasHooksCallbacks,
              hasSomeExtensionPoints,
              isHardcoded,
              details
            );
            
            expect(assessment.hasHooksCallbacks).toBe(hasHooksCallbacks);
            expect(assessment.hasSomeExtensionPoints).toBe(hasSomeExtensionPoints);
            expect(assessment.isHardcoded).toBe(isHardcoded);
            expect(assessment.details).toBe(details);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('isValidIntegrationEvaluation', () => {
    it('should validate correct evaluations', () => {
      const evaluator = new IntegrationEvaluator();
      
      fc.assert(
        fc.property(
          atomicFeature(),
          integrationAnalysisResult(),
          (feature, analysis) => {
            const evaluation = evaluator.evaluate(feature, analysis);
            
            expect(isValidIntegrationEvaluation(evaluation)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject evaluations with invalid ratings', () => {
      const invalidEvaluation = {
        rating: 'Invalid Rating' as any,
        configurationOptions: [],
        extensibility: {
          hasHooksCallbacks: false,
          hasSomeExtensionPoints: false,
          isHardcoded: true,
          details: 'Test',
        },
        toggleCapability: false,
        featureInteractions: 'Test',
        assessment: 'Test assessment',
      };
      
      expect(isValidIntegrationEvaluation(invalidEvaluation)).toBe(false);
    });

    it('should reject evaluations with empty assessment', () => {
      const invalidEvaluation = {
        rating: 'Partial' as const,
        configurationOptions: [],
        extensibility: {
          hasHooksCallbacks: false,
          hasSomeExtensionPoints: false,
          isHardcoded: true,
          details: 'Test',
        },
        toggleCapability: false,
        featureInteractions: 'Test',
        assessment: '',
      };
      
      expect(isValidIntegrationEvaluation(invalidEvaluation)).toBe(false);
    });
  });
});

