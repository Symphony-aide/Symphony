/**
 * Evaluation dimension types for the Blind Evaluation Framework
 * 
 * These types define the 8 evaluation dimensions used to assess
 * each atomic feature.
 */

import type {
  CodeEvidence,
  CompletenessRatingString,
  QualityRatingString,
  DocumentationRatingString,
  ReliabilityRatingString,
  PerformanceRatingString,
  IntegrationRatingString,
  MaintenanceRatingString,
} from './evaluation';

// ============================================================================
// Dimension 1: Feature Completeness
// ============================================================================

/**
 * Status of a specific capability within a feature
 */
export interface CapabilityStatus {
  /** Name of the capability */
  capability: string;
  /** Implementation status */
  status: 'implemented' | 'missing' | 'incomplete';
  /** Additional details for incomplete capabilities */
  details?: string;
}

/**
 * Feature Completeness evaluation (Dimension 1)
 */
export interface CompletenessEvaluation {
  /** Rating string for display */
  rating: CompletenessRatingString;
  /** Percentage (0-100) */
  percentage: number;
  /** List of implemented capabilities */
  implemented: CapabilityStatus[];
  /** List of missing capabilities */
  missing: CapabilityStatus[];
  /** List of incomplete capabilities */
  incomplete: CapabilityStatus[];
  /** Code evidence supporting the rating */
  evidence: CodeEvidence;
  /** Written rationale explaining the rating */
  rationale: string;
}

// ============================================================================
// Dimension 2: Code Quality / Maintainability
// ============================================================================

/**
 * Classification of how feature code is organized
 */
export type FeatureIsolationClassification =
  | 'isolated_module'      // ✅ Good - Feature isolated in separate module/hook
  | 'same_file_separated'  // ⚠️ Acceptable - Feature in same file, clearly separated
  | 'mixed_with_other'     // ❌ Bad - Feature mixed with other logic
  | 'scattered_files';     // ❌ Very Bad - Feature scattered across multiple files

/**
 * Detected anti-pattern in the code
 */
export interface AntiPattern {
  /** Unique identifier within the evaluation */
  id: number;
  /** Name of the anti-pattern */
  name: string;
  /** Code evidence showing the anti-pattern */
  evidence: CodeEvidence;
  /** Description of the issue */
  issue: string;
  /** Impact assessment */
  impact: string;
  /** Suggested better approach */
  betterApproach: {
    description: string;
    codeExample: string;
  };
}

/**
 * Identified good practice in the code
 */
export interface GoodPractice {
  /** Name of the good practice (KISS, DRY, SRP, etc.) */
  name: string;
  /** Code evidence showing the good practice */
  evidence: CodeEvidence;
  /** Description of why this is good */
  description: string;
}

/**
 * Code Quality evaluation (Dimension 2)
 */
export interface CodeQualityEvaluation {
  /** Rating string for display */
  rating: QualityRatingString;
  /** Feature isolation classification */
  featureIsolation: FeatureIsolationClassification;
  /** List of detected anti-patterns */
  antiPatterns: AntiPattern[];
  /** List of identified good practices */
  goodPractices: GoodPractice[];
  /** Overall assessment with justification */
  assessment: string;
}

// ============================================================================
// Dimension 3: Documentation & Comments
// ============================================================================

/**
 * Documentation coverage assessment
 */
export interface DocumentationCoverage {
  /** Has JSDoc/TSDoc comments on feature functions */
  hasJSDoc: boolean;
  /** Has inline comments explaining complex logic */
  hasInlineComments: boolean;
  /** Has self-documenting variable/function names */
  hasSelfDocumentingNames: boolean;
  /** Has usage examples */
  hasUsageExamples: boolean;
  /** Has edge cases documented */
  hasEdgeCaseDocs: boolean;
}

/**
 * Documentation examples (good and missing)
 */
export interface DocumentationExamples {
  /** Examples of good documentation found */
  goodDocumentation: CodeEvidence[];
  /** Examples of missing documentation */
  missingDocumentation: CodeEvidence[];
}

/**
 * Documentation evaluation (Dimension 3)
 */
export interface DocumentationEvaluation {
  /** Rating string for display */
  rating: DocumentationRatingString;
  /** Documentation coverage checkboxes */
  coverage: DocumentationCoverage;
  /** Examples of good and missing documentation */
  examples: DocumentationExamples;
  /** Overall assessment with justification */
  assessment: string;
}

// ============================================================================
// Dimension 4: Reliability / Fault-Tolerance
// ============================================================================

/**
 * Instance of error handling found in the code
 */
export interface ErrorHandlingInstance {
  /** Description of the error handling */
  description: string;
  /** Code evidence showing the error handling */
  evidence: CodeEvidence;
}

/**
 * Gap in error handling (missing error handling)
 */
export interface ErrorHandlingGap {
  /** Scenario where error handling is missing */
  scenario: string;
  /** Location of the gap */
  location: {
    file: string;
    line: number;
  };
  /** Risk level of the gap */
  risk: 'Low' | 'Medium' | 'High';
}

/**
 * Assessment of defensive coding practices
 */
export interface DefensiveCodingAssessment {
  /** Has input validation */
  hasInputValidation: boolean;
  /** Has null/undefined checks */
  hasNullChecks: boolean;
  /** Has type guards */
  hasTypeGuards: boolean;
  /** Description of defensive coding practices */
  description: string;
}

/**
 * Assessment of edge case handling
 */
export interface EdgeCaseAssessment {
  /** List of handled edge cases */
  handledCases: string[];
  /** List of unhandled edge cases */
  unhandledCases: string[];
  /** Description of edge case handling */
  description: string;
}

/**
 * Reliability evaluation (Dimension 4)
 */
export interface ReliabilityEvaluation {
  /** Rating string for display */
  rating: ReliabilityRatingString;
  /** Present error handling instances */
  presentErrorHandling: ErrorHandlingInstance[];
  /** Missing error handling gaps */
  missingErrorHandling: ErrorHandlingGap[];
  /** Defensive coding assessment */
  defensiveCoding: DefensiveCodingAssessment;
  /** Edge case handling assessment */
  edgeCaseHandling: EdgeCaseAssessment;
  /** Overall assessment with justification */
  assessment: string;
}

// ============================================================================
// Dimension 5: Performance & Efficiency
// ============================================================================

/**
 * Identified performance concern
 */
export interface PerformanceConcern {
  /** Unique identifier within the evaluation */
  id: number;
  /** Code evidence showing the concern */
  evidence: CodeEvidence;
  /** Description of the issue */
  issue: string;
  /** Impact description */
  impact: string;
  /** Recommended fix */
  recommendedFix: string;
}

/**
 * Found optimization technique
 */
export interface OptimizationFound {
  /** Type of optimization technique */
  technique: 'memoization' | 'debouncing' | 'virtualization' | 'useMemo' | 'useCallback' | 'React.memo' | 'throttling';
  /** Code evidence showing the optimization */
  evidence: CodeEvidence;
  /** Description of the optimization */
  description: string;
}

/**
 * Algorithmic complexity analysis
 */
export interface ComplexityAnalysis {
  /** Algorithmic complexity (e.g., "O(n)", "O(n²)") */
  algorithmicComplexity: string;
  /** Analysis of loops and their complexity */
  loopAnalysis: string;
}

/**
 * Re-render analysis for React components
 */
export interface ReRenderAnalysis {
  /** Whether unnecessary re-renders were detected */
  hasUnnecessaryReRenders: boolean;
  /** List of re-render issues */
  issues: string[];
}

/**
 * Performance evaluation (Dimension 5)
 */
export interface PerformanceEvaluation {
  /** Rating string for display */
  rating: PerformanceRatingString;
  /** List of performance concerns */
  concerns: PerformanceConcern[];
  /** List of found optimizations */
  optimizations: OptimizationFound[];
  /** Complexity analysis */
  complexityAnalysis: ComplexityAnalysis;
  /** Re-render analysis */
  reRenderAnalysis: ReRenderAnalysis;
  /** Overall assessment with justification */
  assessment: string;
}

// ============================================================================
// Dimension 6: Integration & Extensibility
// ============================================================================

/**
 * Configuration option for a feature
 */
export interface ConfigurationOption {
  /** Name of the option */
  name: string;
  /** Type of the option */
  type: string;
  /** Whether the option is present */
  present: boolean;
  /** Description of the option */
  description?: string;
}

/**
 * Extensibility assessment
 */
export interface ExtensibilityAssessment {
  /** Has hooks/callbacks for custom behavior */
  hasHooksCallbacks: boolean;
  /** Has some extension points */
  hasSomeExtensionPoints: boolean;
  /** Is hardcoded and not extensible */
  isHardcoded: boolean;
  /** Details about extensibility */
  details: string;
}

/**
 * Integration evaluation (Dimension 6)
 */
export interface IntegrationEvaluation {
  /** Rating string for display */
  rating: IntegrationRatingString;
  /** Available configuration options */
  configurationOptions: ConfigurationOption[];
  /** Extensibility assessment */
  extensibility: ExtensibilityAssessment;
  /** Whether feature can be toggled on/off */
  toggleCapability: boolean;
  /** How feature works with other features */
  featureInteractions: string;
  /** Overall assessment with justification */
  assessment: string;
}

// ============================================================================
// Dimension 7: Maintenance & Support
// ============================================================================

/**
 * Modularity assessment
 */
export interface ModularityAssessment {
  /** Feature lines of code */
  featureLOC: number;
  /** Complexity level */
  complexity: 'Low' | 'Medium' | 'High';
  /** List of dependencies */
  dependencies: string[];
}

/**
 * Classification of ease of modification
 */
export type ModificationEaseClassification =
  | 'single_file'    // ✅ Change requires editing 1 file
  | 'few_files'      // ⚠️ Change requires editing 2-3 files
  | 'many_files';    // ❌ Change requires editing 4+ files

/**
 * Classification of testability
 */
export type TestabilityClassification =
  | 'isolated'           // ✅ Can be unit tested in isolation
  | 'requires_mocking'   // ⚠️ Requires significant mocking
  | 'tightly_coupled';   // ❌ Tightly coupled, hard to test

/**
 * Maintenance evaluation (Dimension 7)
 */
export interface MaintenanceEvaluation {
  /** Rating string for display */
  rating: MaintenanceRatingString;
  /** Modularity assessment */
  modularity: ModularityAssessment;
  /** Ease of modification classification */
  modificationEase: ModificationEaseClassification;
  /** Testability classification */
  testability: TestabilityClassification;
  /** List of feature-specific dependencies */
  dependencies: string[];
  /** Overall assessment with justification */
  assessment: string;
}

// ============================================================================
// Dimension 8: Stress Collapse Estimation
// ============================================================================

/**
 * A specific stress collapse condition
 */
export interface StressCollapseCondition {
  /** Unique identifier within the evaluation */
  id: number;
  /** Numeric threshold (e.g., "1000 items", "50 concurrent users") */
  threshold: string;
  /** Expected behavior when threshold is exceeded */
  expectedBehavior: string;
  /** Reasoning bullet points */
  reasoning: string[];
  /** Code pattern references supporting the estimation */
  codePatternReferences: CodeEvidence[];
}

/**
 * Stress Collapse evaluation (Dimension 8)
 */
export interface StressCollapseEvaluation {
  /** List of collapse conditions (empty if robust) */
  conditions: StressCollapseCondition[];
  /** Whether the feature is robust (no collapse scenario) */
  isRobust: boolean;
  /** Reason why feature is robust (if applicable) */
  robustReason?: string;
}

// ============================================================================
// Combined Feature Evaluation
// ============================================================================

/**
 * Complete evaluation of a single atomic feature across all 8 dimensions
 */
export interface FeatureEvaluation {
  /** The atomic feature being evaluated */
  feature: import('./evaluation').AtomicFeature;
  /** Dimension 1: Feature Completeness */
  completeness: CompletenessEvaluation;
  /** Dimension 2: Code Quality / Maintainability */
  codeQuality: CodeQualityEvaluation;
  /** Dimension 3: Documentation & Comments */
  documentation: DocumentationEvaluation;
  /** Dimension 4: Reliability / Fault-Tolerance */
  reliability: ReliabilityEvaluation;
  /** Dimension 5: Performance & Efficiency */
  performance: PerformanceEvaluation;
  /** Dimension 6: Integration & Extensibility */
  integration: IntegrationEvaluation;
  /** Dimension 7: Maintenance & Support */
  maintenance: MaintenanceEvaluation;
  /** Dimension 8: Stress Collapse Estimation */
  stressCollapse: StressCollapseEvaluation;
}
