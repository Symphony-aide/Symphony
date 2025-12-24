/**
 * MaintenanceEvaluator - Evaluates maintenance and support (Dimension 7)
 * 
 * Analyzes modularity, modification ease, testability, and dependencies.
 * Generates assessments with justification.
 * 
 * @module MaintenanceEvaluator
 */

import type {
  AtomicFeature,
  CodeEvidence,
  MaintenanceRatingString,
} from '../../types/evaluation';
import type {
  MaintenanceEvaluation,
  ModularityAssessment,
  ModificationEaseClassification,
  TestabilityClassification,
} from '../../types/dimensions';

/**
 * Configuration options for maintenance evaluation
 */
export interface MaintenanceEvaluatorOptions {
  /** Minimum score for Medium rating (default: 30) */
  mediumMinScore?: number;
  /** Minimum score for High rating (default: 60) */
  highMinScore?: number;
  /** Minimum score for Enterprise-Level rating (default: 85) */
  enterpriseMinScore?: number;
}

/**
 * Default configuration for maintenance evaluation
 */
const DEFAULT_OPTIONS: Required<MaintenanceEvaluatorOptions> = {
  mediumMinScore: 30,
  highMinScore: 60,
  enterpriseMinScore: 85,
};

/**
 * Result of analyzing maintenance characteristics in code
 */
export interface MaintenanceAnalysisResult {
  /** Modularity assessment */
  modularity: ModularityAssessment;
  /** Ease of modification classification */
  modificationEase: ModificationEaseClassification;
  /** Testability classification */
  testability: TestabilityClassification;
  /** List of feature-specific dependencies */
  dependencies: string[];
}

/**
 * MaintenanceEvaluator class for evaluating maintenance and support
 * 
 * @example
 * ```typescript
 * const evaluator = new MaintenanceEvaluator();
 * const analysis = evaluator.analyzeCode(code, filePath);
 * const evaluation = evaluator.evaluate(feature, analysis);
 * ```
 */
export class MaintenanceEvaluator {
  private options: Required<MaintenanceEvaluatorOptions>;

  constructor(options: MaintenanceEvaluatorOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }


  /**
   * Evaluates the maintenance characteristics of an atomic feature
   * 
   * @param feature - The atomic feature being evaluated
   * @param analysis - Results of maintenance analysis
   * @returns Complete maintenance evaluation
   */
  evaluate(
    feature: AtomicFeature,
    analysis: MaintenanceAnalysisResult
  ): MaintenanceEvaluation {
    const rating = this.determineRating(analysis);
    const assessment = this.generateAssessment(feature, rating, analysis);

    return {
      rating,
      modularity: analysis.modularity,
      modificationEase: analysis.modificationEase,
      testability: analysis.testability,
      dependencies: analysis.dependencies,
      assessment,
    };
  }

  /**
   * Determines the maintenance rating based on analysis results
   * 
   * @param analysis - Maintenance analysis results
   * @returns Maintenance rating string
   */
  determineRating(analysis: MaintenanceAnalysisResult): MaintenanceRatingString {
    let score = 0;

    // Score for modularity (up to 35 points)
    // Lower LOC and complexity = better maintainability
    const locScore = analysis.modularity.featureLOC <= 100 ? 15 :
                     analysis.modularity.featureLOC <= 300 ? 10 :
                     analysis.modularity.featureLOC <= 500 ? 5 : 0;
    score += locScore;

    const complexityScore = analysis.modularity.complexity === 'Low' ? 15 :
                           analysis.modularity.complexity === 'Medium' ? 10 : 5;
    score += complexityScore;

    // Fewer dependencies = better maintainability (up to 5 points)
    const depCount = analysis.modularity.dependencies.length;
    const depScore = depCount <= 3 ? 5 : depCount <= 6 ? 3 : 1;
    score += depScore;

    // Score for modification ease (up to 30 points)
    const modificationScore = analysis.modificationEase === 'single_file' ? 30 :
                              analysis.modificationEase === 'few_files' ? 18 : 5;
    score += modificationScore;

    // Score for testability (up to 35 points)
    const testabilityScore = analysis.testability === 'isolated' ? 35 :
                             analysis.testability === 'requires_mocking' ? 20 : 5;
    score += testabilityScore;

    // Clamp score to 0-100
    score = Math.max(0, Math.min(100, score));

    // Convert score to rating
    if (score >= this.options.enterpriseMinScore) {
      return 'Enterprise-Level';
    } else if (score >= this.options.highMinScore) {
      return 'High';
    } else if (score >= this.options.mediumMinScore) {
      return 'Medium';
    } else {
      return 'Low';
    }
  }

  /**
   * Generates a detailed assessment explaining the rating
   */
  generateAssessment(
    feature: AtomicFeature,
    rating: MaintenanceRatingString,
    analysis: MaintenanceAnalysisResult
  ): string {
    const parts: string[] = [];

    parts.push(`The ${feature.name} feature has ${rating.toLowerCase()} maintainability.`);

    // Modularity assessment
    parts.push(`Modularity: ${analysis.modularity.featureLOC} LOC with ${analysis.modularity.complexity.toLowerCase()} complexity.`);

    // Dependencies
    if (analysis.modularity.dependencies.length > 0) {
      parts.push(`Dependencies: ${analysis.modularity.dependencies.length} (${analysis.modularity.dependencies.slice(0, 3).join(', ')}${analysis.modularity.dependencies.length > 3 ? '...' : ''}).`);
    } else {
      parts.push('No external dependencies.');
    }

    // Modification ease
    switch (analysis.modificationEase) {
      case 'single_file':
        parts.push('Modification requires editing only 1 file.');
        break;
      case 'few_files':
        parts.push('Modification requires editing 2-3 files.');
        break;
      case 'many_files':
        parts.push('Modification requires editing 4+ files.');
        break;
    }

    // Testability
    switch (analysis.testability) {
      case 'isolated':
        parts.push('Feature can be unit tested in isolation.');
        break;
      case 'requires_mocking':
        parts.push('Testing requires significant mocking.');
        break;
      case 'tightly_coupled':
        parts.push('Feature is tightly coupled, making testing difficult.');
        break;
    }

    // Rating-specific recommendations
    switch (rating) {
      case 'Enterprise-Level':
        parts.push('Excellent maintainability with clean modular structure and easy testability.');
        break;
      case 'High':
        parts.push('Good maintainability. Minor improvements could enhance testability or reduce coupling.');
        break;
      case 'Medium':
        parts.push('Moderate maintainability. Consider refactoring to improve modularity and reduce dependencies.');
        break;
      case 'Low':
        parts.push('Low maintainability. Significant refactoring recommended to improve code organization and testability.');
        break;
    }

    return parts.join(' ');
  }

  /**
   * Validates that a rating is one of the valid maintenance ratings
   */
  isValidRating(rating: string): rating is MaintenanceRatingString {
    return ['Low', 'Medium', 'High', 'Enterprise-Level'].includes(rating);
  }

  /**
   * Gets the configuration options
   */
  getOptions(): Required<MaintenanceEvaluatorOptions> {
    return { ...this.options };
  }
}



// ============================================================================
// Modularity Analyzer
// ============================================================================

/**
 * ModularityAnalyzer - Analyzes modularity characteristics
 * 
 * Calculates feature lines of code (LOC), determines complexity level,
 * and lists feature-specific dependencies.
 */
export class ModularityAnalyzer {
  /**
   * Analyzes modularity of the code
   * 
   * @param code - Source code to analyze
   * @param filePath - Path to the file
   * @returns Modularity assessment
   */
  analyze(code: string, filePath: string): ModularityAssessment {
    const featureLOC = this.calculateLOC(code);
    const complexity = this.determineComplexity(code);
    const dependencies = this.extractDependencies(code);

    return {
      featureLOC,
      complexity,
      dependencies,
    };
  }

  /**
   * Calculates lines of code (excluding empty lines and comments)
   */
  calculateLOC(code: string): number {
    const lines = code.split('\n');
    let loc = 0;
    let inBlockComment = false;

    for (const line of lines) {
      const trimmed = line.trim();

      // Handle block comments
      if (trimmed.startsWith('/*')) {
        inBlockComment = true;
      }
      if (trimmed.endsWith('*/')) {
        inBlockComment = false;
        continue;
      }
      if (inBlockComment) {
        continue;
      }

      // Skip empty lines and single-line comments
      if (trimmed.length === 0 || trimmed.startsWith('//')) {
        continue;
      }

      loc++;
    }

    return Math.max(1, loc); // Ensure at least 1 LOC
  }

  /**
   * Determines complexity level based on code patterns
   */
  determineComplexity(code: string): 'Low' | 'Medium' | 'High' {
    let complexityScore = 0;

    // Count control flow statements
    const ifCount = (code.match(/\bif\s*\(/g) || []).length;
    const forCount = (code.match(/\bfor\s*\(/g) || []).length;
    const whileCount = (code.match(/\bwhile\s*\(/g) || []).length;
    const switchCount = (code.match(/\bswitch\s*\(/g) || []).length;
    const ternaryCount = (code.match(/\?[^?:]+:/g) || []).length;

    complexityScore += ifCount * 1;
    complexityScore += forCount * 2;
    complexityScore += whileCount * 2;
    complexityScore += switchCount * 3;
    complexityScore += ternaryCount * 1;

    // Count nested structures (rough estimate)
    const nestedBraces = this.countMaxNesting(code);
    complexityScore += nestedBraces * 2;

    // Count function definitions
    const functionCount = (code.match(/function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\(/g) || []).length;
    complexityScore += functionCount * 0.5;

    // Count callback chains
    const callbackChains = (code.match(/\.\w+\s*\([^)]*\)\s*\.\w+/g) || []).length;
    complexityScore += callbackChains * 1;

    // Normalize by LOC
    const loc = this.calculateLOC(code);
    const normalizedScore = complexityScore / Math.max(loc / 50, 1);

    if (normalizedScore <= 5) {
      return 'Low';
    } else if (normalizedScore <= 15) {
      return 'Medium';
    } else {
      return 'High';
    }
  }

  /**
   * Counts maximum nesting depth of braces
   */
  private countMaxNesting(code: string): number {
    let maxDepth = 0;
    let currentDepth = 0;

    for (const char of code) {
      if (char === '{') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (char === '}') {
        currentDepth = Math.max(0, currentDepth - 1);
      }
    }

    return maxDepth;
  }

  /**
   * Extracts dependencies from import statements
   */
  extractDependencies(code: string): string[] {
    const dependencies: string[] = [];
    const importPattern = /import\s+(?:{[^}]+}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;
    const requirePattern = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

    let match;

    // Extract from import statements
    while ((match = importPattern.exec(code)) !== null) {
      const dep = match[1];
      // Skip relative imports for dependency counting
      if (!dep.startsWith('.') && !dependencies.includes(dep)) {
        dependencies.push(dep);
      }
    }

    // Extract from require statements
    while ((match = requirePattern.exec(code)) !== null) {
      const dep = match[1];
      if (!dep.startsWith('.') && !dependencies.includes(dep)) {
        dependencies.push(dep);
      }
    }

    return dependencies;
  }

  /**
   * Formats modularity assessment as markdown
   */
  formatAsMarkdown(assessment: ModularityAssessment): string {
    const lines: string[] = [];
    
    lines.push('**Modularity:**');
    lines.push(`- Feature LOC: ~${assessment.featureLOC} lines`);
    lines.push(`- Complexity: ${assessment.complexity}`);
    
    if (assessment.dependencies.length > 0) {
      lines.push(`- Dependencies: ${assessment.dependencies.join(', ')}`);
    } else {
      lines.push('- Dependencies: None');
    }

    return lines.join('\n');
  }
}



// ============================================================================
// Modification Ease Classifier
// ============================================================================

/**
 * ModificationEaseClassifier - Classifies ease of modification
 * 
 * Counts files requiring changes for feature modification and
 * generates checkboxes for classification.
 */
export class ModificationEaseClassifier {
  /**
   * Classifies modification ease based on code analysis
   * 
   * @param code - Source code to analyze
   * @param filePath - Path to the file
   * @param relatedFiles - Optional array of related file paths
   * @returns Modification ease classification
   */
  classify(
    code: string,
    filePath: string,
    relatedFiles: string[] = []
  ): ModificationEaseClassification {
    // Count files that would need modification
    const fileCount = this.countAffectedFiles(code, filePath, relatedFiles);

    if (fileCount <= 1) {
      return 'single_file';
    } else if (fileCount <= 3) {
      return 'few_files';
    } else {
      return 'many_files';
    }
  }

  /**
   * Counts files that would be affected by a modification
   */
  countAffectedFiles(
    code: string,
    filePath: string,
    relatedFiles: string[]
  ): number {
    // Start with the main file
    let fileCount = 1;

    // Check for imports from local files (relative imports)
    const relativeImports = this.extractRelativeImports(code);
    fileCount += relativeImports.length;

    // Check for exports that might be used elsewhere
    const hasExports = this.hasSignificantExports(code);
    if (hasExports && relatedFiles.length > 0) {
      // Estimate files that might import this module
      fileCount += Math.min(relatedFiles.length, 3);
    }

    // Check for context providers/consumers
    if (this.hasContextUsage(code)) {
      fileCount += 1; // Context definition file
    }

    // Check for state management patterns
    if (this.hasStateManagementPatterns(code)) {
      fileCount += 1; // Store/reducer file
    }

    return fileCount;
  }

  /**
   * Extracts relative imports from code
   */
  private extractRelativeImports(code: string): string[] {
    const imports: string[] = [];
    const importPattern = /import\s+(?:{[^}]+}|\w+)\s+from\s+['"](\.[^'"]+)['"]/g;

    let match;
    while ((match = importPattern.exec(code)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  /**
   * Checks if code has significant exports
   */
  private hasSignificantExports(code: string): boolean {
    const exportPatterns = [
      /export\s+(?:default\s+)?(?:function|class|const|let|var)/,
      /export\s*{/,
      /module\.exports/,
    ];

    return exportPatterns.some(pattern => pattern.test(code));
  }

  /**
   * Checks for React context usage
   */
  private hasContextUsage(code: string): boolean {
    return /createContext|useContext|\.Provider|\.Consumer/.test(code);
  }

  /**
   * Checks for state management patterns
   */
  private hasStateManagementPatterns(code: string): boolean {
    return /useSelector|useDispatch|useStore|useAtom|useRecoilState|connect\s*\(/.test(code);
  }

  /**
   * Formats modification ease as checkboxes
   * 
   * @param classification - The modification ease classification
   * @returns Formatted markdown string
   */
  formatAsCheckboxes(classification: ModificationEaseClassification): string {
    const lines: string[] = [];

    lines.push('**Ease of Modification:**');

    if (classification === 'single_file') {
      lines.push('- [x] ✅ Change requires editing 1 file');
      lines.push('- [ ] ⚠️ Change requires editing 2-3 files');
      lines.push('- [ ] ❌ Change requires editing 4+ files');
    } else if (classification === 'few_files') {
      lines.push('- [ ] ✅ Change requires editing 1 file');
      lines.push('- [x] ⚠️ Change requires editing 2-3 files');
      lines.push('- [ ] ❌ Change requires editing 4+ files');
    } else {
      lines.push('- [ ] ✅ Change requires editing 1 file');
      lines.push('- [ ] ⚠️ Change requires editing 2-3 files');
      lines.push('- [x] ❌ Change requires editing 4+ files');
    }

    return lines.join('\n');
  }
}



// ============================================================================
// Testability Classifier
// ============================================================================

/**
 * TestabilityClassifier - Classifies testability of code
 * 
 * Assesses isolation, mocking requirements, and coupling to
 * determine how easily the code can be tested.
 */
export class TestabilityClassifier {
  /**
   * Classifies testability based on code analysis
   * 
   * @param code - Source code to analyze
   * @param filePath - Path to the file
   * @returns Testability classification
   */
  classify(code: string, filePath: string): TestabilityClassification {
    const isolationScore = this.assessIsolation(code);
    const mockingRequirements = this.assessMockingRequirements(code);
    const couplingLevel = this.assessCoupling(code);

    // Calculate overall testability score
    const totalScore = isolationScore + mockingRequirements + couplingLevel;

    if (totalScore >= 70) {
      return 'isolated';
    } else if (totalScore >= 40) {
      return 'requires_mocking';
    } else {
      return 'tightly_coupled';
    }
  }

  /**
   * Assesses how isolated the code is (0-40 points)
   */
  private assessIsolation(code: string): number {
    let score = 40;

    // Deduct for global state access
    if (/window\.|document\.|localStorage|sessionStorage/.test(code)) {
      score -= 10;
    }

    // Deduct for direct DOM manipulation
    if (/getElementById|querySelector|createElement/.test(code)) {
      score -= 10;
    }

    // Deduct for side effects in render
    if (/useEffect\s*\(\s*\(\)\s*=>\s*{[^}]*fetch|useEffect\s*\(\s*\(\)\s*=>\s*{[^}]*axios/.test(code)) {
      score -= 5;
    }

    // Deduct for singleton patterns
    if (/getInstance|\.instance\s*=/.test(code)) {
      score -= 10;
    }

    // Bonus for pure functions
    const functionCount = (code.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || []).length;
    const pureIndicators = (code.match(/return\s+[^;]+;/g) || []).length;
    if (functionCount > 0 && pureIndicators >= functionCount) {
      score += 5;
    }

    return Math.max(0, Math.min(40, score));
  }

  /**
   * Assesses mocking requirements (0-30 points, higher = less mocking needed)
   */
  private assessMockingRequirements(code: string): number {
    let score = 30;

    // Deduct for external API calls
    if (/fetch\s*\(|axios\.|\.get\s*\(|\.post\s*\(/.test(code)) {
      score -= 10;
    }

    // Deduct for file system operations
    if (/fs\.|readFile|writeFile/.test(code)) {
      score -= 10;
    }

    // Deduct for database operations
    if (/\.query\s*\(|\.find\s*\(|\.save\s*\(|\.delete\s*\(/.test(code)) {
      score -= 10;
    }

    // Deduct for timers
    if (/setTimeout|setInterval|Date\.now/.test(code)) {
      score -= 5;
    }

    // Deduct for complex context dependencies
    if (/useContext/.test(code)) {
      score -= 5;
    }

    // Bonus for dependency injection patterns
    if (/constructor\s*\([^)]+\)|props\.\w+Service|props\.\w+Client/.test(code)) {
      score += 5;
    }

    return Math.max(0, Math.min(30, score));
  }

  /**
   * Assesses coupling level (0-30 points, higher = less coupling)
   */
  private assessCoupling(code: string): number {
    let score = 30;

    // Deduct for many imports
    const importCount = (code.match(/import\s+/g) || []).length;
    if (importCount > 10) {
      score -= 15;
    } else if (importCount > 5) {
      score -= 8;
    }

    // Deduct for deep property access
    const deepAccess = (code.match(/\w+\.\w+\.\w+\.\w+/g) || []).length;
    if (deepAccess > 5) {
      score -= 10;
    } else if (deepAccess > 2) {
      score -= 5;
    }

    // Deduct for circular dependency indicators
    if (/require\s*\(\s*['"]\.\.\//.test(code) && /module\.exports/.test(code)) {
      score -= 5;
    }

    // Deduct for tight coupling to specific implementations
    if (/new\s+\w+\s*\(/.test(code)) {
      const newCount = (code.match(/new\s+\w+\s*\(/g) || []).length;
      score -= Math.min(newCount * 3, 10);
    }

    // Bonus for interface usage
    if (/interface\s+\w+|type\s+\w+\s*=/.test(code)) {
      score += 5;
    }

    return Math.max(0, Math.min(30, score));
  }

  /**
   * Formats testability as checkboxes
   * 
   * @param classification - The testability classification
   * @returns Formatted markdown string
   */
  formatAsCheckboxes(classification: TestabilityClassification): string {
    const lines: string[] = [];

    lines.push('**Testability:**');

    if (classification === 'isolated') {
      lines.push('- [x] ✅ Feature can be unit tested in isolation');
      lines.push('- [ ] ⚠️ Requires significant mocking');
      lines.push('- [ ] ❌ Tightly coupled, hard to test');
    } else if (classification === 'requires_mocking') {
      lines.push('- [ ] ✅ Feature can be unit tested in isolation');
      lines.push('- [x] ⚠️ Requires significant mocking');
      lines.push('- [ ] ❌ Tightly coupled, hard to test');
    } else {
      lines.push('- [ ] ✅ Feature can be unit tested in isolation');
      lines.push('- [ ] ⚠️ Requires significant mocking');
      lines.push('- [x] ❌ Tightly coupled, hard to test');
    }

    return lines.join('\n');
  }
}



// ============================================================================
// Maintenance Analyzer (Main Entry Point)
// ============================================================================

/**
 * MaintenanceAnalyzer - Main class for analyzing maintenance characteristics
 * 
 * Combines all maintenance analysis components:
 * - Modularity analysis
 * - Modification ease classification
 * - Testability classification
 */
export class MaintenanceAnalyzer {
  private modularityAnalyzer: ModularityAnalyzer;
  private modificationClassifier: ModificationEaseClassifier;
  private testabilityClassifier: TestabilityClassifier;

  constructor() {
    this.modularityAnalyzer = new ModularityAnalyzer();
    this.modificationClassifier = new ModificationEaseClassifier();
    this.testabilityClassifier = new TestabilityClassifier();
  }

  /**
   * Analyzes code for maintenance characteristics
   * 
   * @param code - Source code to analyze
   * @param filePath - Path to the file
   * @param relatedFiles - Optional array of related file paths
   * @returns Complete maintenance analysis result
   */
  analyze(
    code: string,
    filePath: string,
    relatedFiles: string[] = []
  ): MaintenanceAnalysisResult {
    const modularity = this.modularityAnalyzer.analyze(code, filePath);
    const modificationEase = this.modificationClassifier.classify(code, filePath, relatedFiles);
    const testability = this.testabilityClassifier.classify(code, filePath);

    return {
      modularity,
      modificationEase,
      testability,
      dependencies: modularity.dependencies,
    };
  }

  /**
   * Gets the modularity analyzer
   */
  getModularityAnalyzer(): ModularityAnalyzer {
    return this.modularityAnalyzer;
  }

  /**
   * Gets the modification ease classifier
   */
  getModificationClassifier(): ModificationEaseClassifier {
    return this.modificationClassifier;
  }

  /**
   * Gets the testability classifier
   */
  getTestabilityClassifier(): TestabilityClassifier {
    return this.testabilityClassifier;
  }
}


// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets all valid maintenance ratings
 */
export function getValidMaintenanceRatings(): MaintenanceRatingString[] {
  return ['Low', 'Medium', 'High', 'Enterprise-Level'];
}

/**
 * Creates a default maintenance analysis result
 */
export function createDefaultAnalysis(): MaintenanceAnalysisResult {
  return {
    modularity: {
      featureLOC: 0,
      complexity: 'Low',
      dependencies: [],
    },
    modificationEase: 'single_file',
    testability: 'isolated',
    dependencies: [],
  };
}

/**
 * Creates a modularity assessment
 */
export function createModularityAssessment(
  featureLOC: number,
  complexity: 'Low' | 'Medium' | 'High',
  dependencies: string[]
): ModularityAssessment {
  return {
    featureLOC,
    complexity,
    dependencies,
  };
}

/**
 * Validates that a maintenance evaluation has all required fields
 */
export function isValidMaintenanceEvaluation(evaluation: MaintenanceEvaluation): boolean {
  const validRatings = getValidMaintenanceRatings();
  const validModificationEase: ModificationEaseClassification[] = ['single_file', 'few_files', 'many_files'];
  const validTestability: TestabilityClassification[] = ['isolated', 'requires_mocking', 'tightly_coupled'];
  const validComplexity: Array<'Low' | 'Medium' | 'High'> = ['Low', 'Medium', 'High'];

  return (
    validRatings.includes(evaluation.rating) &&
    typeof evaluation.modularity.featureLOC === 'number' &&
    evaluation.modularity.featureLOC > 0 &&
    validComplexity.includes(evaluation.modularity.complexity) &&
    Array.isArray(evaluation.modularity.dependencies) &&
    validModificationEase.includes(evaluation.modificationEase) &&
    validTestability.includes(evaluation.testability) &&
    Array.isArray(evaluation.dependencies) &&
    typeof evaluation.assessment === 'string' &&
    evaluation.assessment.length > 0
  );
}

/**
 * Gets valid modification ease classifications
 */
export function getValidModificationEaseClassifications(): ModificationEaseClassification[] {
  return ['single_file', 'few_files', 'many_files'];
}

/**
 * Gets valid testability classifications
 */
export function getValidTestabilityClassifications(): TestabilityClassification[] {
  return ['isolated', 'requires_mocking', 'tightly_coupled'];
}

/**
 * Gets valid complexity levels
 */
export function getValidComplexityLevels(): Array<'Low' | 'Medium' | 'High'> {
  return ['Low', 'Medium', 'High'];
}
