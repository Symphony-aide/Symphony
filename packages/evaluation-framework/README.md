# @symphony/evaluation-framework

A systematic code quality assessment system for Symphony IDE's frontend packages. The Blind Evaluation Framework provides structured methodology to identify atomic features within components, evaluate each feature across 8 quality dimensions, and generate standardized evaluation artifacts.

## Overview

The framework enables developers to:

1. **Identify** atomic features within components using defined criteria
2. **Verify** package boundaries to exclude separate packages from feature lists
3. **Evaluate** each feature across 8 quality dimensions with evidence-based assessments
4. **Generate** per-component AGREEMENT.md files with detailed evaluations
5. **Consolidate** into project-wide SUMMARY_AGREEMENT.md with cross-component analysis

## Installation

```bash
pnpm add @symphony/evaluation-framework
```

## 8 Evaluation Dimensions

| # | Dimension | Rating Scale |
|---|-----------|--------------|
| 1 | **Feature Completeness** | Not Implemented (0%) / Partial (1-49%) / Full (50-99%) / Enterprise-Level (100%) |
| 2 | **Code Quality / Maintainability** | Poor / Basic / Good / Excellent |
| 3 | **Documentation & Comments** | None / Basic / Good / Excellent |
| 4 | **Reliability / Fault-Tolerance** | Low / Medium / High / Enterprise-Level |
| 5 | **Performance & Efficiency** | Poor / Acceptable / Good / Excellent |
| 6 | **Integration & Extensibility** | Not Compatible / Partial / Full / Enterprise-Level |
| 7 | **Maintenance & Support** | Low / Medium / High / Enterprise-Level |
| 8 | **Stress Collapse Estimation** | Specific threshold → Expected failure behavior |

## Target Packages

The framework evaluates Symphony's frontend architecture:

- **packages/components/** - 17 specialized IDE components
- **packages/features/** - 21 feature packages
- **packages/ui/** - Design system (50+ components, feedback system)
- **packages/primitives/** - Core primitive system

## Quick Start

### CLI Usage

The fastest way to evaluate components is using the CLI:

```bash
# Evaluate a single component
npx evaluation-framework evaluate packages/components/tab-bar

# Evaluate all components in the project
npx evaluation-framework evaluate-all --verbose

# Generate summary from existing evaluations
npx evaluation-framework summary
```

### Programmatic Usage

```typescript
import { 
  MarkdownSerializer,
  MarkdownParser,
  FeatureIdentifier,
  PackageBoundaryChecker,
  FeatureTableGenerator,
  CompletenessEvaluator,
  EvidenceCollector,
  DocumentationEvaluator,
  DocumentationCoverageChecker,
  IntegrationEvaluator,
  IntegrationAnalyzer,
  createCapability,
  createCapabilityAnalysis,
  type AgreementDocument,
  type FeatureEvaluation,
} from '@symphony/evaluation-framework';

// Identify features in component source code
const identifier = new FeatureIdentifier();
const result = identifier.identifyFeatures(sourceCode, 'StatusBar.jsx', 'packages/components/statusbar');
console.log(result.identifiedFeatures);

// Check if capabilities are separate packages
const checker = new PackageBoundaryChecker();
const check = checker.checkCapability('Button', '@symphony/ui');
if (check.isSeparatePackage) {
  console.log(`${check.capability} is a separate package`);
}

// Generate markdown feature tables
const generator = new FeatureTableGenerator();
const tableResult = generator.generateTable(result.identifiedFeatures, result.externalDependencies);
console.log(tableResult.table);

// Evaluate feature completeness
const evaluator = new CompletenessEvaluator();
const capabilities = [
  createCapability('Display time', true),
  createCapability('Format options', false),
];
const analysisResults = [
  createCapabilityAnalysis(capabilities[0], 'implemented'),
  createCapabilityAnalysis(capabilities[1], 'missing'),
];
const collector = new EvidenceCollector();
const evidence = collector.extractEvidence(sourceCode, { fileName: 'StatusBar.jsx' });
const completenessEval = evaluator.evaluate(result.identifiedFeatures[0], analysisResults, evidence);
console.log(`Rating: ${completenessEval.rating} (${completenessEval.percentage}%)`);

// Evaluate documentation quality
const docEvaluator = new DocumentationEvaluator();
const docChecker = new DocumentationCoverageChecker();
const docAnalysis = docChecker.analyze(sourceCode, 'StatusBar.jsx');
const docEval = docEvaluator.evaluate(result.identifiedFeatures[0], docAnalysis);
console.log(`Documentation: ${docEval.rating}`);
console.log(docChecker.formatAsCheckboxes(docEval.coverage));

// Evaluate integration and extensibility
const integrationEvaluator = new IntegrationEvaluator();
const integrationAnalyzer = new IntegrationAnalyzer();
const integrationAnalysis = integrationAnalyzer.analyze(sourceCode, 'StatusBar.jsx', 'Status Display');
const integrationEval = integrationEvaluator.evaluate(result.identifiedFeatures[0], integrationAnalysis);
console.log(`Integration: ${integrationEval.rating}`);
console.log(`Toggle capability: ${integrationEval.toggleCapability}`);

// Serialize evaluation data to markdown
const markdown = MarkdownSerializer.serializeAgreement(document);

// Parse AGREEMENT.md back to data structure
const parsed = MarkdownParser.parseAgreement(markdown);
```

## API Reference

### Types

#### Core Evaluation Types

```typescript
import type {
  // Feature identification
  AtomicFeature,
  FeatureIdentificationResult,
  ExternalDependency,
  PackageBoundaryCheck,
  CodeEvidence,
  CodeBlock,
  StateUsage,
  EventHandler,
  
  // Rating enums
  CompletenessRating,
  QualityRating,
  DocumentationRating,
  ReliabilityRating,
  PerformanceRating,
  IntegrationRating,
  MaintenanceRating,
} from '@symphony/evaluation-framework';
```

#### Feature Identifier Types

```typescript
import type {
  // FeatureIdentifier options
  FeatureIdentifierOptions,
  
  // PackageBoundaryChecker types
  PackageBoundaryCheckerConfig,
  FileSystemInterface,
  PackageJson,
  
  // FeatureTableGenerator types
  FeatureTableGeneratorConfig,
  FeatureTableResult,
} from '@symphony/evaluation-framework';
```

#### Evaluator Types

```typescript
import type {
  // CompletenessEvaluator types
  Capability,
  CapabilityAnalysisResult,
  CompletenessEvaluatorOptions,
  
  // CodeQualityEvaluator types
  AntiPatternType,
  GoodPracticeType,
  AntiPatternAnalysisResult,
  GoodPracticeAnalysisResult,
  CodeQualityEvaluatorOptions,
  
  // DocumentationEvaluator types
  DocumentationEvaluatorOptions,
  DocumentationAnalysisResult,
  
  // IntegrationEvaluator types
  IntegrationEvaluatorOptions,
  IntegrationAnalysisResult,
  
  // EvidenceCollector types
  EvidenceExtractionOptions,
} from '@symphony/evaluation-framework';
```

#### Dimension Evaluation Types

```typescript
import type {
  // Dimension 1: Feature Completeness
  CompletenessEvaluation,
  CapabilityStatus,
  
  // Dimension 2: Code Quality
  CodeQualityEvaluation,
  FeatureIsolationClassification,
  AntiPattern,
  GoodPractice,
  
  // Dimension 3: Documentation
  DocumentationEvaluation,
  DocumentationCoverage,
  
  // Dimension 4: Reliability
  ReliabilityEvaluation,
  ErrorHandlingInstance,
  ErrorHandlingGap,
  
  // Dimension 5: Performance
  PerformanceEvaluation,
  PerformanceConcern,
  OptimizationFound,
  ComplexityAnalysis,
  
  // Dimension 6: Integration
  IntegrationEvaluation,
  ConfigurationOption,
  ExtensibilityAssessment,
  
  // Dimension 7: Maintenance
  MaintenanceEvaluation,
  ModularityAssessment,
  ModificationEaseClassification,
  TestabilityClassification,
  
  // Dimension 8: Stress Collapse
  StressCollapseEvaluation,
  StressCollapseCondition,
  
  // Combined
  FeatureEvaluation,
} from '@symphony/evaluation-framework';
```

#### Document Types

```typescript
import type {
  // AGREEMENT.md structure
  AgreementDocument,
  AgreementHeader,
  FeatureIdentificationSection,
  ComponentSummary,
  ProductionReadinessStatus,
  PriorityAction,
  
  // SUMMARY_AGREEMENT.md structure
  SummaryAgreementDocument,
  ExecutiveSummary,
  DetailedEvaluationRow,
  StatisticsByCategory,
  CriticalIssue,
  CommonAntiPattern,
  ProductionReadinessRow,
  StressCollapseSummary,
  Recommendations,
  FeatureQualityHeatmap,
} from '@symphony/evaluation-framework';
```

### Serialization

#### MarkdownSerializer

Serializes evaluation data structures to valid markdown format.

```typescript
import { MarkdownSerializer } from '@symphony/evaluation-framework';

// Serialize complete AGREEMENT.md document
const markdown = MarkdownSerializer.serializeAgreement(document);

// Serialize individual sections
const header = MarkdownSerializer.serializeHeader(document.header);
const features = MarkdownSerializer.serializeFeatureIdentification(document.featureIdentification);
const evaluation = MarkdownSerializer.serializeFeatureEvaluation(featureEval);
const summary = MarkdownSerializer.serializeComponentSummary(document.componentSummary);

// Serialize individual dimensions
const completeness = MarkdownSerializer.serializeCompleteness(eval.completeness, featureId);
const codeQuality = MarkdownSerializer.serializeCodeQuality(eval.codeQuality, featureId);
const documentation = MarkdownSerializer.serializeDocumentation(eval.documentation, featureId);
const reliability = MarkdownSerializer.serializeReliability(eval.reliability, featureId);
const performance = MarkdownSerializer.serializePerformance(eval.performance, featureId);
const integration = MarkdownSerializer.serializeIntegration(eval.integration, featureId);
const maintenance = MarkdownSerializer.serializeMaintenance(eval.maintenance, featureId);
const stressCollapse = MarkdownSerializer.serializeStressCollapse(eval.stressCollapse, featureId);

// Serialize code evidence
const evidence = MarkdownSerializer.serializeCodeEvidence(codeEvidence);
```

### Feature Identifier Module

The Feature Identifier module provides functionality to identify atomic features within components, check package boundaries, and generate feature tables.

#### FeatureIdentifier

Analyzes component source code to identify distinct capabilities that serve a single purpose and can be evaluated independently.

```typescript
import { FeatureIdentifier } from '@symphony/evaluation-framework';

// Create identifier with default options
const identifier = new FeatureIdentifier();

// Or with custom options
const customIdentifier = new FeatureIdentifier({
  minLinesOfCode: 5,        // Minimum lines to consider as a feature
  includeUtilities: true,   // Include utility functions as features
  customPatterns: [],       // Custom regex patterns for feature detection
});

// Identify features in source code
const result = identifier.identifyFeatures(
  sourceCode,               // Source code string
  'StatusBar.jsx',          // File name
  'packages/components/statusbar'  // Component path
);

// Result structure
console.log(result.componentPath);        // Path to component
console.log(result.componentType);        // 'Component' | 'Feature Package'
console.log(result.identifiedFeatures);   // Array of AtomicFeature
console.log(result.externalDependencies); // Array of ExternalDependency
console.log(result.totalLinesOfCode);     // Total lines analyzed

// Parse specific elements
const stateUsages = identifier.parseStateUsages(sourceCode, fileName);
const eventHandlers = identifier.parseEventHandlers(sourceCode, fileName);
const imports = identifier.parseImports(sourceCode);
```

#### PackageBoundaryChecker

Verifies whether a potential feature is actually a separate package in the codebase, which should be excluded from the atomic features list.

```typescript
import { PackageBoundaryChecker, InMemoryFileSystem } from '@symphony/evaluation-framework';

// Create checker with default Symphony packages
const checker = new PackageBoundaryChecker();

// Or with custom configuration
const customChecker = new PackageBoundaryChecker({
  projectRoot: '/path/to/project',
  packageDirectories: ['packages/components', 'packages/ui'],
  fileSystem: new InMemoryFileSystem(),  // For testing
});

// Check if a capability is a separate package
const result = checker.checkCapability('Button', '@symphony/ui');
console.log(result.capability);        // 'Button'
console.log(result.isSeparatePackage); // true
console.log(result.packagePath);       // 'packages/ui'
console.log(result.reason);            // Explanation

// Check multiple capabilities at once
const results = checker.checkCapabilities([
  { name: 'Button', importSource: '@symphony/ui' },
  { name: 'formatDate', importSource: './utils' },
]);

// Filter dependencies into separate packages vs embedded capabilities
const { separatePackages, embeddedCapabilities } = checker.filterDependencies(dependencies);

// Add custom known packages
checker.addKnownPackage('my-package', 'packages/my-package');

// Get all known packages
const knownPackages = checker.getKnownPackages();
```

#### FeatureTableGenerator

Creates formatted markdown tables with feature information and external dependencies sections.

```typescript
import { FeatureTableGenerator } from '@symphony/evaluation-framework';

// Create generator with default options
const generator = new FeatureTableGenerator();

// Or with custom configuration
const customGenerator = new FeatureTableGenerator({
  includeLineNumbers: true,    // Include line numbers in location
  maxDescriptionLength: 80,    // Max description length before truncation
  sortById: true,              // Sort features by ID
});

// Generate complete table with dependencies section
const result = generator.generateTable(features, externalDependencies);
console.log(result.table);                      // Markdown table string
console.log(result.externalDependenciesSection); // Dependencies section
console.log(result.totalFeatures);              // Feature count
console.log(result.totalLinesOfCode);           // Total LOC

// Generate just the markdown table
const table = generator.generateMarkdownTable(features);

// Generate just the dependencies section
const depsSection = generator.generateExternalDependenciesSection(dependencies);

// Generate complete feature identification section with methodology
const section = generator.generateFeatureIdentificationSection(
  features,
  externalDependencies,
  [
    'Analyzed component code structure',
    'Identified distinct capabilities',
    'Verified no separate packages exist',
  ]
);

// Validate features before generation
const validation = generator.validateFeatures(features);
if (!validation.valid) {
  console.log('Invalid features:', validation.invalidFeatures);
}
```

### Evaluators Module

The Evaluators module provides classes for evaluating features across the 8 quality dimensions.

#### CompletenessEvaluator

Evaluates feature completeness (Dimension 1) by analyzing implemented vs missing capabilities, calculating percentage based on capability coverage, and assigning ratings.

```typescript
import { 
  CompletenessEvaluator,
  createCapability,
  createCapabilityAnalysis,
  type Capability,
  type CapabilityAnalysisResult,
} from '@symphony/evaluation-framework';

// Create evaluator with default options
const evaluator = new CompletenessEvaluator();

// Or with custom thresholds
const customEvaluator = new CompletenessEvaluator({
  partialMinPercentage: 1,      // Minimum % for Partial rating (default: 1)
  fullMinPercentage: 50,        // Minimum % for Full rating (default: 50)
  enterpriseMinPercentage: 100, // Minimum % for Enterprise rating (default: 100)
});

// Define capabilities for a feature
const capabilities: Capability[] = [
  createCapability('Display time', true, 1, 'Shows current time'),
  createCapability('Format options', false, 0.5, 'Time format customization'),
  createCapability('Timezone support', false, 0.5),
];

// Analyze each capability's implementation status
const analysisResults: CapabilityAnalysisResult[] = [
  createCapabilityAnalysis(capabilities[0], 'implemented', 'Fully working'),
  createCapabilityAnalysis(capabilities[1], 'incomplete', 'Only 12h format'),
  createCapabilityAnalysis(capabilities[2], 'missing'),
];

// Evaluate the feature
const evaluation = evaluator.evaluate(feature, analysisResults, codeEvidence);

console.log(evaluation.rating);      // 'Full' | 'Partial' | 'Not Implemented' | 'Enterprise-Level'
console.log(evaluation.percentage);  // 0-100
console.log(evaluation.implemented); // Array of implemented capabilities
console.log(evaluation.missing);     // Array of missing capabilities
console.log(evaluation.incomplete);  // Array of incomplete capabilities
console.log(evaluation.rationale);   // Human-readable explanation

// Calculate percentage directly
const percentage = evaluator.calculatePercentage(analysisResults);

// Determine rating from percentage
const rating = evaluator.determineRating(75); // 'Full'

// Validate rating matches percentage
const isValid = evaluator.isValidRatingForPercentage('Full', 75); // true

// Get percentage range for a rating
const range = evaluator.getPercentageRangeForRating('Full');
console.log(range); // { min: 50, max: 99 }

// Create default evaluation for features with no capabilities
const defaultEval = evaluator.createDefaultEvaluation(feature, evidence);
```

**Rating Scale:**
- **Not Implemented (0%)**: No functional capabilities
- **Partial (1-49%)**: Basic functionality with significant gaps
- **Full (50-99%)**: Core functionality complete with enhancements possible
- **Enterprise-Level (100%)**: All expected capabilities fully implemented

**Capability Weighting:**
- Each capability can have a custom weight (default: 1)
- Incomplete capabilities count as 50% of their weight
- Missing capabilities contribute 0 to the total

#### EvidenceCollector

Collects and formats code evidence to support evaluations.

```typescript
import { 
  EvidenceCollector,
  createCodeEvidence,
  formatEvidenceAsCodeBlock,
} from '@symphony/evaluation-framework';

// Create collector
const collector = new EvidenceCollector();

// Extract evidence from source code
const evidence = collector.extractEvidence(sourceCode, {
  fileName: 'StatusBar.jsx',
  startLine: 10,
  endLine: 25,
  language: 'jsx',
});

// Create evidence manually
const manualEvidence = createCodeEvidence(
  'StatusBar.jsx',
  'const [time, setTime] = useState(new Date());',
  10,
  10,
  'jsx'
);

// Format evidence as markdown code block
const formatted = formatEvidenceAsCodeBlock(evidence);
```

#### CodeQualityEvaluator (In Progress)

Evaluates code quality and maintainability (Dimension 2) by analyzing code patterns for anti-patterns and good practices.

```typescript
import type {
  AntiPatternType,
  GoodPracticeType,
  AntiPatternAnalysisResult,
  GoodPracticeAnalysisResult,
  CodeQualityEvaluatorOptions,
} from '@symphony/evaluation-framework';

// Anti-pattern types that can be detected
type AntiPatternType =
  | 'excessive_nesting'      // >3 levels of if-else
  | 'deep_property_chain'    // ClassA.methodB.propertyC.value
  | 'magic_number'           // Hardcoded numbers without constants
  | 'magic_string'           // Hardcoded strings without constants
  | 'code_duplication'       // Repeated code blocks
  | 'over_engineering'       // Unnecessary complexity
  | 'tight_coupling'         // High interdependency
  | 'mixed_feature_logic';   // Feature code mixed with other logic

// Good practice types that can be identified
type GoodPracticeType =
  | 'kiss'                   // Keep It Simple
  | 'dry'                    // Don't Repeat Yourself
  | 'modular_structure'      // Clear module organization
  | 'single_responsibility'  // SRP adherence
  | 'feature_isolated';      // Feature isolated/extractable

// Configuration options
const options: CodeQualityEvaluatorOptions = {
  maxNestingDepth: 3,        // Flag nesting deeper than this
  maxPropertyChainDepth: 3,  // Flag property chains longer than this
  duplicationThreshold: 80,  // Minimum similarity % for duplication
};
```

**Rating Scale:**
- **Poor**: Multiple anti-patterns, no good practices
- **Basic**: Some anti-patterns, minimal good practices
- **Good**: Few anti-patterns, several good practices
- **Excellent**: No anti-patterns, comprehensive good practices

**Anti-Pattern Analysis Result:**
```typescript
interface AntiPatternAnalysisResult {
  type: AntiPatternType;           // Type of anti-pattern detected
  name: string;                    // Human-readable name
  evidence: CodeEvidence;          // Code showing the anti-pattern
  issue: string;                   // Description of the issue
  impact: string;                  // Impact assessment
  betterApproach: {
    description: string;           // How to fix it
    codeExample: string;           // Improved code example
  };
}
```

**Good Practice Analysis Result:**
```typescript
interface GoodPracticeAnalysisResult {
  type: GoodPracticeType;          // Type of good practice
  name: string;                    // Human-readable name
  evidence: CodeEvidence;          // Code showing the practice
  description: string;             // Why this is good
}
```

#### DocumentationEvaluator

Evaluates documentation and comments quality (Dimension 3) by analyzing JSDoc/TSDoc comments, inline comments, naming quality, and generating assessments with justification.

```typescript
import { 
  DocumentationEvaluator,
  DocumentationCoverageChecker,
  DocumentationExamplesGenerator,
  createDefaultDocumentationAnalysis,
  createDocumentationCoverage,
  getValidDocumentationRatings,
  isValidDocumentationEvaluation,
  type DocumentationEvaluatorOptions,
  type DocumentationAnalysisResult,
} from '@symphony/evaluation-framework';

// Create evaluator with default options
const evaluator = new DocumentationEvaluator();

// Or with custom configuration
const customEvaluator = new DocumentationEvaluator({
  goodJSDocCoverage: 50,        // Minimum % for Good rating
  excellentJSDocCoverage: 80,   // Minimum % for Excellent rating
  minFunctionNameLength: 3,     // Minimum name length for self-documenting
});

// Analyze code for documentation coverage
const checker = new DocumentationCoverageChecker();
const analysis = checker.analyze(sourceCode, 'StatusBar.jsx');

// Evaluate the feature
const evaluation = evaluator.evaluate(feature, analysis);

console.log(evaluation.rating);      // 'None' | 'Basic' | 'Good' | 'Excellent'
console.log(evaluation.coverage);    // DocumentationCoverage object
console.log(evaluation.examples);    // Good and missing documentation examples
console.log(evaluation.assessment);  // Human-readable assessment

// Format coverage as checkbox list
const checkboxes = checker.formatAsCheckboxes(evaluation.coverage);
// - [x] JSDoc/TSDoc comments on feature functions
// - [ ] Inline comments explaining complex logic
// - [x] Self-documenting variable/function names
// - [ ] Usage examples
// - [ ] Edge cases documented

// Generate formatted examples
const examplesGenerator = new DocumentationExamplesGenerator();
const formattedExamples = examplesGenerator.formatAllExamples(evaluation.examples);

// Validate evaluation
const isValid = isValidDocumentationEvaluation(evaluation);
```

**Rating Scale:**
- **None**: No documentation, severely lacking
- **Basic**: Documentation exists but incomplete
- **Good**: Covers most important aspects with room for improvement
- **Excellent**: Comprehensive and well-maintained documentation

**Documentation Coverage Assessment:**
```typescript
interface DocumentationCoverage {
  hasJSDoc: boolean;              // JSDoc/TSDoc comments on functions
  hasInlineComments: boolean;     // Inline comments for complex logic
  hasSelfDocumentingNames: boolean; // Self-documenting variable/function names
  hasUsageExamples: boolean;      // Usage examples in comments
  hasEdgeCaseDocs: boolean;       // Edge cases documented
}
```

**Documentation Analysis Result:**
```typescript
interface DocumentationAnalysisResult {
  totalFunctions: number;           // Total functions found
  documentedFunctions: number;      // Functions with JSDoc/TSDoc
  commentedComplexBlocks: number;   // Complex blocks with comments
  totalComplexBlocks: number;       // Total complex code blocks
  selfDocumentingFunctions: number; // Functions with descriptive names
  hasUsageExamples: boolean;        // Whether examples exist
  hasEdgeCaseDocs: boolean;         // Whether edge cases documented
  goodExamples: CodeEvidence[];     // Examples of good documentation
  missingExamples: CodeEvidence[];  // Examples of missing documentation
}
```

**Scoring System:**
- JSDoc/TSDoc coverage: 40 points max (based on percentage)
- Inline comments: 20 points (if present)
- Self-documenting names: 20 points (if 70%+ functions have good names)
- Usage examples: 10 points (if present)
- Edge case documentation: 10 points (if present)

Score thresholds: Excellent (≥80), Good (≥50), Basic (≥20), None (<20)

#### IntegrationEvaluator

Evaluates integration and extensibility (Dimension 6) by analyzing configuration options, extensibility patterns, toggle capability, and feature interactions.

```typescript
import { 
  IntegrationEvaluator,
  IntegrationAnalyzer,
  ConfigurationOptionsDocumenter,
  ToggleCapabilityChecker,
  ExtensibilityChecker,
  FeatureInteractionAnalyzer,
  createDefaultIntegrationAnalysis,
  createConfigurationOption,
  createExtensibilityAssessment,
  getValidIntegrationRatings,
  isValidIntegrationEvaluation,
  type IntegrationEvaluatorOptions,
  type IntegrationAnalysisResult,
} from '@symphony/evaluation-framework';

// Create evaluator with default options
const evaluator = new IntegrationEvaluator();

// Or with custom thresholds
const customEvaluator = new IntegrationEvaluator({
  partialMinScore: 25,      // Minimum score for Partial rating
  fullMinScore: 60,         // Minimum score for Full rating
  enterpriseMinScore: 85,   // Minimum score for Enterprise-Level rating
});

// Analyze code for integration characteristics
const analyzer = new IntegrationAnalyzer();
const analysis = analyzer.analyze(sourceCode, 'StatusBar.jsx', 'Status Display');

// Evaluate the feature
const evaluation = evaluator.evaluate(feature, analysis);

console.log(evaluation.rating);              // 'Not Compatible' | 'Partial' | 'Full' | 'Enterprise-Level'
console.log(evaluation.configurationOptions); // Array of ConfigurationOption
console.log(evaluation.extensibility);        // ExtensibilityAssessment
console.log(evaluation.toggleCapability);     // boolean
console.log(evaluation.featureInteractions);  // string description
console.log(evaluation.assessment);           // Human-readable assessment

// Use individual analyzers
const configDocumenter = new ConfigurationOptionsDocumenter();
const options = configDocumenter.extractOptions(sourceCode, 'StatusBar.jsx');
console.log(configDocumenter.formatAsCodeSnippet(options));
console.log(configDocumenter.formatAsCheckboxes(options));

const toggleChecker = new ToggleCapabilityChecker();
const hasToggle = toggleChecker.check(sourceCode, 'StatusBar.jsx');
console.log(toggleChecker.document(hasToggle, sourceCode));

const extensibilityChecker = new ExtensibilityChecker();
const extensibility = extensibilityChecker.check(sourceCode, 'StatusBar.jsx');
console.log(extensibilityChecker.formatAsCheckboxes(extensibility));

const interactionAnalyzer = new FeatureInteractionAnalyzer();
const interactions = interactionAnalyzer.analyze(sourceCode, 'StatusBar.jsx', 'Status Display');
console.log(interactionAnalyzer.document(interactions));

// Validate evaluation
const isValid = isValidIntegrationEvaluation(evaluation);
```

**Rating Scale:**
- **Not Compatible**: Limited integration capabilities, significant improvements needed
- **Partial**: Some configuration options and extension points available
- **Full**: Good integration with most configuration options and extension points
- **Enterprise-Level**: Excellent integration with comprehensive configuration and extensibility

**Scoring System:**
- Configuration options: 30 points max (based on percentage of present options)
- Extensibility: 35 points max (hooks/callbacks: 35, some extension points: 20, not hardcoded: 10)
- Toggle capability: 20 points (if feature can be toggled on/off)
- Feature interactions: 15 points max (based on interaction quality)

Score thresholds: Enterprise-Level (≥85), Full (≥60), Partial (≥25), Not Compatible (<25)

**Configuration Option:**
```typescript
interface ConfigurationOption {
  name: string;           // Option name
  type: string;           // TypeScript type
  present: boolean;       // Whether option is available
  description?: string;   // Optional description
}
```

**Extensibility Assessment:**
```typescript
interface ExtensibilityAssessment {
  hasHooksCallbacks: boolean;      // Has hooks/callbacks for custom behavior
  hasSomeExtensionPoints: boolean; // Has some extension points (className, style, ref)
  isHardcoded: boolean;            // Implementation is hardcoded
  details: string;                 // Detailed explanation
}
```

**Integration Analysis Result:**
```typescript
interface IntegrationAnalysisResult {
  configurationOptions: ConfigurationOption[];  // Available configuration options
  extensibility: ExtensibilityAssessment;       // Extensibility assessment
  toggleCapability: boolean;                    // Whether feature can be toggled
  featureInteractions: string;                  // How feature works with others
}
```

#### MarkdownParser

Parses AGREEMENT.md files back to evaluation data structures.

```typescript
import { MarkdownParser } from '@symphony/evaluation-framework';

// Parse complete AGREEMENT.md document
const document = MarkdownParser.parseAgreement(markdown);

// Parse individual sections
const header = MarkdownParser.parseHeader(headerText);
const features = MarkdownParser.parseFeatureIdentification(sectionText);
const evaluations = MarkdownParser.parseFeatureEvaluations(sectionText, features);
const summary = MarkdownParser.parseComponentSummary(sectionText);

// Parse individual dimensions
const completeness = MarkdownParser.parseCompleteness(sectionText, featureId);
const codeQuality = MarkdownParser.parseCodeQuality(sectionText, featureId);
const documentation = MarkdownParser.parseDocumentation(sectionText, featureId);
const reliability = MarkdownParser.parseReliability(sectionText, featureId);
const performance = MarkdownParser.parsePerformance(sectionText, featureId);
const integration = MarkdownParser.parseIntegration(sectionText, featureId);
const maintenance = MarkdownParser.parseMaintenance(sectionText, featureId);
const stressCollapse = MarkdownParser.parseStressCollapse(sectionText, featureId);
```

### Generators Module

The Generators module provides classes for creating evaluation documents.

#### AgreementGenerator

Generates complete AGREEMENT.md documents for component evaluations, including feature identification, evaluations across all 8 dimensions, and component summaries.

```typescript
import { AgreementGenerator } from '@symphony/evaluation-framework';

// Create generator with default options (writes to current directory)
const generator = new AgreementGenerator();

// Or with custom configuration
const customGenerator = new AgreementGenerator({
  basePath: '/path/to/project',  // Base path for output files
  writeFiles: false,              // Set to false for testing (no file I/O)
});

// Generate AGREEMENT.md from evaluation data
const result = await generator.generate(
  'packages/components/tab-bar',   // Component path
  'TabBar',                        // Component name
  'Component',                     // Type: 'Component' | 'Feature Package'
  featureIdentificationResult,     // From FeatureIdentifier
  featureEvaluations               // Array of FeatureEvaluation
);

console.log(result.success);       // Whether generation succeeded
console.log(result.filePath);      // Output path (e.g., '/path/to/project/packages/components/tab-bar/AGREEMENT.md')
console.log(result.markdown);      // Generated markdown content
console.log(result.document);      // AgreementDocument data structure
console.log(result.error);         // Error message if failed

// Build document structure without writing (useful for testing)
const document = generator.buildDocument(
  componentPath,
  componentName,
  componentType,
  featureIdentificationResult,
  featureEvaluations
);

// Access document sections
console.log(document.header.componentName);
console.log(document.header.evaluatedDate);  // Format: 'YYYY-MM-DD'
console.log(document.header.linesOfCode);
console.log(document.featureIdentification.totalFeatures);
console.log(document.featureIdentification.featuresTable);
console.log(document.featureEvaluations.length);
console.log(document.componentSummary.overallReadiness);
console.log(document.componentSummary.statistics);

// Get output path for a component
const outputPath = generator.getOutputPath('packages/components/tab-bar');
// Returns: '/path/to/project/packages/components/tab-bar/AGREEMENT.md'
```

**Configuration Options:**
```typescript
interface AgreementGeneratorConfig {
  basePath?: string;    // Base path for writing files (default: process.cwd())
  writeFiles?: boolean; // Whether to write files (default: true, set false for testing)
}
```

**Generation Result:**
```typescript
interface AgreementGenerationResult {
  success: boolean;           // Whether generation succeeded
  filePath: string;           // Output file path
  markdown: string;           // Generated markdown content
  document: AgreementDocument; // Document data structure
  error?: string;             // Error message if failed
}
```

**Component Summary Statistics:**
```typescript
interface ComponentSummaryStatistics {
  totalFeatures: number;        // Total atomic features identified
  enterpriseLevel: number;      // Features with Enterprise-Level completeness
  fullImplementation: number;   // Features with Full completeness
  partialImplementation: number; // Features with Partial completeness
  notImplemented: number;       // Features with Not Implemented completeness
}
```

**Production Readiness Status:**
- **Production Ready**: ≥80% of features are Full or Enterprise-Level
- **Staging Ready**: ≥60% of features are Full or Enterprise-Level
- **Development**: ≥40% of features are Full or Enterprise-Level
- **Not Ready**: <40% of features are Full or Enterprise-Level

## CLI Interface

The Blind Evaluation Framework provides a command-line interface for evaluating Symphony IDE components and generating evaluation artifacts.

### Installation

The CLI is available as part of the `@symphony/evaluation-framework` package:

```bash
# Run directly with npx
npx evaluation-framework <command> [options]

# Or use package scripts
pnpm evaluate packages/components/tab-bar
pnpm evaluate:all
pnpm summary
```

### Commands

#### `evaluate <path>`

Evaluate a single component at the specified path.

```bash
# Evaluate a specific component
npx evaluation-framework evaluate packages/components/tab-bar

# With verbose output
npx evaluation-framework evaluate packages/components/tab-bar --verbose

# Dry run (don't write files)
npx evaluation-framework evaluate packages/components/tab-bar --dry-run
```

#### `evaluate-all`

Evaluate all components in the project. Discovers and evaluates:
- `packages/components/` (17 specialized IDE components)
- `packages/features/src/` (21 feature packages)
- `packages/ui/` (components, feedback)
- `packages/primitives/src/` (core, registry, renderers, api, hooks, ipc, monitoring)

```bash
# Evaluate all components
npx evaluation-framework evaluate-all

# With verbose output
npx evaluation-framework evaluate-all --verbose
```

#### `summary`

Generate `SUMMARY_AGREEMENT.md` from existing `AGREEMENT.md` files.

```bash
# Generate summary
npx evaluation-framework summary

# With custom project name
npx evaluation-framework summary --project-name "My Project"
```

#### `help`

Display help information.

```bash
npx evaluation-framework help
npx evaluation-framework --help
npx evaluation-framework -h
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--base-path <path>` | Base path for the project | Current directory |
| `--dry-run` | Don't write files, just show what would be done | `false` |
| `--verbose`, `-v` | Show detailed progress information | `false` |
| `--project-name <name>` | Project name for summary | `"Symphony IDE"` |

### Programmatic Usage

The CLI can also be used programmatically:

```typescript
import { CLI, parseArgs, showHelp } from '@symphony/evaluation-framework/cli';

// Create CLI instance with options
const cli = new CLI({
  basePath: '/path/to/project',
  writeFiles: true,
  verbose: true,
  projectName: 'My Project',
});

// Run with arguments
const result = await cli.run(['evaluate', 'packages/components/tab-bar']);

console.log(result.success);  // Whether command succeeded
console.log(result.message);  // Result message
console.log(result.errors);   // Any errors encountered
console.log(result.stats);    // Statistics about the operation

// Parse arguments manually
const { command, componentPath, options } = parseArgs(process.argv.slice(2));

// Show help
console.log(showHelp());
```

### CLI Components

#### ComponentTraverser

Discovers all evaluatable packages in the project structure.

```typescript
import { ComponentTraverser } from '@symphony/evaluation-framework/cli';

const traverser = new ComponentTraverser('/path/to/project');
const result = await traverser.traverse();

console.log(result.totalPackages);  // Total packages found
console.log(result.byType);         // Breakdown by type
console.log(result.packages);       // Array of DiscoveredPackage
console.log(result.errors);         // Any errors encountered

// Get summary
console.log(traverser.getSummary(result));
```

#### EvaluationOrchestrator

Coordinates the evaluation process for components.

```typescript
import { EvaluationOrchestrator } from '@symphony/evaluation-framework/cli';

const orchestrator = new EvaluationOrchestrator({
  basePath: '/path/to/project',
  writeFiles: true,
  projectName: 'Symphony IDE',
  onProgress: (event) => console.log(event.message),
});

// Evaluate single component
const result = await orchestrator.evaluateComponent('packages/components/tab-bar');

// Evaluate all packages
const allResult = await orchestrator.evaluateAll(packages);

// Generate summary
const summaryResult = await orchestrator.generateSummary();
```

#### ProgressReporter

Reports evaluation progress during CLI execution.

```typescript
import { ProgressReporter, Spinner } from '@symphony/evaluation-framework/cli';

// Create reporter
const reporter = new ProgressReporter(true); // verbose mode

// Report progress
reporter.start('Starting evaluation...');
reporter.report({
  type: 'progress',
  message: 'Processing component...',
  current: 1,
  total: 10,
});
reporter.complete('Done!');

// Create summary
const summary = reporter.createSummary({
  componentsEvaluated: 10,
  featuresIdentified: 50,
  filesGenerated: 10,
  errors: [],
});

// Use spinner for long operations
const spinner = new Spinner();
spinner.start('Loading...');
spinner.update('Still loading...');
spinner.stop('Complete!');
```

### CLI Types

```typescript
import type {
  // CLI types
  CLICommand,
  CLIOptions,
  CLIResult,
  
  // ComponentTraverser types
  PackageType,
  DiscoveredPackage,
  TraversalResult,
  TraverserConfig,
  
  // EvaluationOrchestrator types
  OrchestratorConfig,
  ComponentEvaluationResult,
  AllEvaluationResult,
  SummaryResult,
  
  // ProgressReporter types
  ProgressEventType,
  ProgressEvent,
  ProgressReporterConfig,
} from '@symphony/evaluation-framework/cli';
```

## AGREEMENT.md Structure

Each component evaluation generates an AGREEMENT.md file with this structure:

```markdown
# [Component Name] - Evaluation Agreement

**Type:** Component | Feature Package
**Evaluated:** [Date]
**Path:** [File path]
**Lines of Code:** [Count]

---

## Atomic Feature Identification

**Methodology:**
1. Analyzed component code structure
2. Identified distinct capabilities
3. Verified no separate packages exist
4. Listed smallest independent features

**Identified Atomic Features:**

| # | Feature Name | Description | LOC | Primary Location |
|---|-------------|-------------|-----|------------------|
| 1 | [Name] | [Description] | ~[X] | [File:line-range] |

**Total Atomic Features Identified:** [Count]

**External Dependencies (Separate Packages):**
- [Package] - [Purpose] (NOT evaluated as feature here)

---

## Feature-by-Feature Evaluation

### Feature 1: [Name]

#### 1.1 Feature Completeness: [Rating] - [X]%
#### 1.2 Code Quality / Maintainability: [Rating]
#### 1.3 Documentation & Comments: [Rating]
#### 1.4 Reliability / Fault-Tolerance: [Rating]
#### 1.5 Performance & Efficiency: [Rating]
#### 1.6 Integration & Extensibility: [Rating]
#### 1.7 Maintenance & Support: [Rating]
#### 1.8 Stress Collapse Estimation: [Threshold]

---

## Component-Level Summary

**Overall Statistics:**
- Total Atomic Features: [Count]
- Enterprise-Level: [Count]
- Full Implementation: [Count]
- Partial Implementation: [Count]
- Not Implemented: [Count]

**Overall Component Readiness:** [Status]
```

## Testing

The package uses property-based testing with fast-check to verify correctness:

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Type check
pnpm type-check
```

### Property Tests

The framework includes property-based tests validating:

- **Property 27**: Markdown round-trip consistency - serializing to AGREEMENT.md format and parsing back produces equivalent data structures
- **Property 28**: Feature identification correctness - FeatureIdentifier correctly parses state, handlers, and effects from source code
- **Property 29**: Package boundary detection - PackageBoundaryChecker correctly identifies Symphony packages and external dependencies
- **Property 30**: Feature table generation - FeatureTableGenerator produces valid markdown tables with correct formatting
- **Property 31**: Completeness percentage calculation - CompletenessEvaluator correctly calculates weighted percentages from capability analysis
- **Property 32**: Rating determination - CompletenessEvaluator assigns correct ratings based on percentage thresholds
- **Property 33**: Evidence collection - EvidenceCollector correctly extracts and formats code evidence
- **Property 7**: Code quality rating validity - CodeQualityEvaluator assigns valid ratings (Poor/Basic/Good/Excellent)
- **Property 8**: Feature isolation classification - CodeQualityEvaluator correctly classifies feature isolation patterns
- **Property 9**: Anti-pattern documentation format - Anti-patterns are documented with issue, impact, and better approach
- **Property 10**: Anti-pattern detection - CodeQualityEvaluator detects excessive nesting, deep chains, magic values, etc.
- **Property 11**: Documentation rating validity - DocumentationEvaluator assigns valid ratings (None/Basic/Good/Excellent)
- **Property 12**: Documentation coverage assessment - DocumentationCoverageChecker correctly analyzes JSDoc, inline comments, and naming quality
- **Property 13**: Documentation examples generation - DocumentationExamplesGenerator formats good and missing documentation examples correctly
- **Property 14**: Integration rating validity - IntegrationEvaluator assigns valid ratings (Not Compatible/Partial/Full/Enterprise-Level)
- **Property 15**: Configuration options extraction - ConfigurationOptionsDocumenter correctly extracts props and configuration from code
- **Property 16**: Extensibility assessment - ExtensibilityChecker correctly identifies hooks, callbacks, and extension points
- **Property 17**: Toggle capability detection - ToggleCapabilityChecker correctly identifies toggle patterns in code
- **Property 23**: AGREEMENT.md creation - AgreementGenerator creates documents at correct paths with proper structure, headers, feature identification, and component summaries
- **Property 24**: AGREEMENT.md structure completeness - Generated documents contain complete header section (component name, type, date, path, LOC), atomic feature identification section (methodology, features table, total count, external dependencies), feature-by-feature evaluation section (all 8 dimensions for each feature), and component-level summary section (statistics, issues, strengths, actions, readiness status)

## Development

```bash
# Build the package
pnpm build

# Lint code
pnpm lint

# Type check
pnpm type-check
```

## Implementation Status

### Completed ✅

- [x] Package infrastructure (package.json, tsconfig, vitest config)
- [x] Core type definitions (evaluation.ts, dimensions.ts, documents.ts)
- [x] Markdown serialization (MarkdownSerializer)
- [x] Markdown parsing (MarkdownParser)
- [x] Property-based tests for round-trip consistency
- [x] Feature Identifier module (FeatureIdentifier, PackageBoundaryChecker, FeatureTableGenerator)
- [x] Completeness Evaluator (Dimension 1)
- [x] Evidence Collector for code evidence extraction
- [x] Code Quality Evaluator (Dimension 2)
- [x] Documentation Evaluator (Dimension 3)
- [x] Reliability Evaluator (Dimension 4)
- [x] Performance Evaluator (Dimension 5)
- [x] Integration Evaluator (Dimension 6)
- [x] Maintenance Evaluator (Dimension 7)
- [x] Stress Collapse Estimator (Dimension 8)
- [x] AGREEMENT.md Generator

### In Progress 🚧

- [ ] SUMMARY_AGREEMENT.md Generator (partial implementation)

### Completed ✅ (CLI)

- [x] CLI Entry Point with command parsing
- [x] ComponentTraverser for package discovery
- [x] EvaluationOrchestrator for coordinating evaluations
- [x] ProgressReporter for visual feedback

## Related Documentation

- [Requirements](.kiro/specs/blind-evaluation-framework/requirements.md)
- [Design Document](.kiro/specs/blind-evaluation-framework/design.md)
- [Implementation Tasks](.kiro/specs/blind-evaluation-framework/tasks.md)

## License

Private - Symphony IDE
