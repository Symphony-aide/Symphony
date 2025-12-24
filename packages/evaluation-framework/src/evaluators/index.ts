/**
 * Evaluators module for the Blind Evaluation Framework
 * 
 * Provides evaluators for each of the 8 quality dimensions:
 * 1. Feature Completeness
 * 2. Code Quality / Maintainability
 * 3. Documentation & Comments
 * 4. Reliability / Fault-Tolerance
 * 5. Performance & Efficiency
 * 6. Integration & Extensibility
 * 7. Maintenance & Support
 * 8. Stress Collapse Estimation
 * 
 * @module evaluators
 */

// Dimension 1: Feature Completeness
export {
  CompletenessEvaluator,
  CapabilityStatusFormatter,
  STATUS_MARKERS,
  type Capability,
  type CapabilityAnalysisResult,
  type CompletenessEvaluatorOptions,
  createCapabilityAnalysis,
  createCapability,
} from './CompletenessEvaluator';

// Evidence Collection
export {
  EvidenceCollector,
  type EvidenceExtractionOptions,
  createCodeEvidence,
  formatEvidenceAsCodeBlock,
} from './EvidenceCollector';

// Dimension 2: Code Quality / Maintainability
export {
  CodeQualityEvaluator,
  FeatureIsolationClassifier,
  AntiPatternDetector,
  AntiPatternDocumenter,
  GoodPracticeIdentifier,
  type AntiPatternType,
  type GoodPracticeType,
  type AntiPatternAnalysisResult,
  type GoodPracticeAnalysisResult,
  type CodeQualityEvaluatorOptions,
  type FeatureCodeDistribution,
  type AntiPatternDetection,
  type GoodPracticeDetection,
  createAntiPatternAnalysis,
  createGoodPracticeAnalysis,
  getValidQualityRatings,
  getValidIsolationClassifications,
} from './CodeQualityEvaluator';

// Dimension 3: Documentation & Comments
export {
  DocumentationEvaluator,
  DocumentationCoverageChecker,
  DocumentationExamplesGenerator,
  type DocumentationEvaluatorOptions,
  type DocumentationAnalysisResult,
  getValidDocumentationRatings,
  createDefaultAnalysis as createDefaultDocumentationAnalysis,
  createDocumentationCoverage,
  isValidDocumentationEvaluation,
} from './DocumentationEvaluator';

// Dimension 4: Reliability / Fault-Tolerance
export {
  ReliabilityEvaluator,
  ErrorHandlingAnalyzer,
  ReliabilityCodeExamplesGenerator,
  ErrorHandlingFormatter,
  EdgeCaseAnalyzer,
  type ReliabilityEvaluatorOptions,
  type ErrorHandlingAnalysisResult,
  getValidReliabilityRatings,
  createDefaultAnalysis as createDefaultReliabilityAnalysis,
  createErrorHandlingInstance,
  createErrorHandlingGap,
  isValidReliabilityEvaluation,
} from './ReliabilityEvaluator';

// Dimension 5: Performance & Efficiency
export {
  PerformanceEvaluator,
  PerformanceConcernDocumenter,
  ComplexityAnalyzer,
  ReRenderDetector,
  OptimizationDetector,
  PerformanceAnalyzer,
  type PerformanceEvaluatorOptions,
  type PerformanceAnalysisResult,
  getValidPerformanceRatings,
  createDefaultAnalysis as createDefaultPerformanceAnalysis,
  createPerformanceConcern,
  createOptimizationFound,
  isValidPerformanceEvaluation,
} from './PerformanceEvaluator';

// Dimension 6: Integration & Extensibility
export {
  IntegrationEvaluator,
  ConfigurationOptionsDocumenter,
  ToggleCapabilityChecker,
  ExtensibilityChecker,
  FeatureInteractionAnalyzer,
  IntegrationAnalyzer,
  type IntegrationEvaluatorOptions,
  type IntegrationAnalysisResult,
  getValidIntegrationRatings,
  createDefaultAnalysis as createDefaultIntegrationAnalysis,
  createConfigurationOption,
  createExtensibilityAssessment,
  isValidIntegrationEvaluation,
} from './IntegrationEvaluator';

// Dimension 7: Maintenance & Support
export {
  MaintenanceEvaluator,
  ModularityAnalyzer,
  ModificationEaseClassifier,
  TestabilityClassifier,
  MaintenanceAnalyzer,
  type MaintenanceEvaluatorOptions,
  type MaintenanceAnalysisResult,
  getValidMaintenanceRatings,
  createDefaultAnalysis as createDefaultMaintenanceAnalysis,
  createModularityAssessment,
  isValidMaintenanceEvaluation,
  getValidModificationEaseClassifications,
  getValidTestabilityClassifications,
  getValidComplexityLevels,
} from './MaintenanceEvaluator';

// Dimension 8: Stress Collapse Estimation
export {
  StressCollapseEstimator,
  StressPatternAnalyzer,
  CollapseConditionGenerator,
  RobustFeatureHandler,
  StressCollapseAnalyzer,
  type StressPatternType,
  type StressPattern,
  type StressAnalysisResult,
  type StressCollapseEstimatorOptions,
  getValidStressPatternTypes,
  createDefaultAnalysis as createDefaultStressAnalysis,
  createStressPattern,
  createStressCollapseCondition,
  isValidStressCollapseEvaluation,
  isValidStressCollapseCondition,
  formatStressCollapseAsMarkdown,
} from './StressCollapseEstimator';
