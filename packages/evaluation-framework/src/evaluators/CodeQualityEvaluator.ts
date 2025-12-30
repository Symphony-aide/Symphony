/**
 * CodeQualityEvaluator - Evaluates code quality and maintainability (Dimension 2)
 * 
 * Analyzes code patterns for anti-patterns and good practices,
 * assigns ratings, and generates overall code quality assessments.
 * 
 * @module CodeQualityEvaluator
 */

import type {
  AtomicFeature,
  CodeEvidence,
  QualityRatingString,
} from '../../types/evaluation';
import type {
  CodeQualityEvaluation,
  FeatureIsolationClassification,
  AntiPattern,
  GoodPractice,
} from '../../types/dimensions';

/**
 * Anti-pattern types that can be detected
 */
export type AntiPatternType =
  | 'excessive_nesting'
  | 'deep_property_chain'
  | 'magic_number'
  | 'magic_string'
  | 'code_duplication'
  | 'over_engineering'
  | 'tight_coupling'
  | 'mixed_feature_logic';

/**
 * Good practice types that can be identified
 */
export type GoodPracticeType =
  | 'kiss'
  | 'dry'
  | 'modular_structure'
  | 'single_responsibility'
  | 'feature_isolated';

/**
 * Result of analyzing code for anti-patterns
 */
export interface AntiPatternAnalysisResult {
  /** Type of anti-pattern detected */
  type: AntiPatternType;
  /** Human-readable name */
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
 * Result of analyzing code for good practices
 */
export interface GoodPracticeAnalysisResult {
  /** Type of good practice identified */
  type: GoodPracticeType;
  /** Human-readable name */
  name: string;
  /** Code evidence showing the good practice */
  evidence: CodeEvidence;
  /** Description of why this is good */
  description: string;
}

/**
 * Configuration options for code quality evaluation
 */
export interface CodeQualityEvaluatorOptions {
  /** Maximum nesting depth before flagging (default: 3) */
  maxNestingDepth?: number;
  /** Maximum property chain depth before flagging (default: 3) */
  maxPropertyChainDepth?: number;
  /** Minimum code similarity percentage for duplication (default: 80) */
  duplicationThreshold?: number;
}

/**
 * Default configuration for code quality evaluation
 */
const DEFAULT_OPTIONS: Required<CodeQualityEvaluatorOptions> = {
  maxNestingDepth: 3,
  maxPropertyChainDepth: 3,
  duplicationThreshold: 80,
};

/**
 * Human-readable names for anti-pattern types
 */
const ANTI_PATTERN_NAMES: Record<AntiPatternType, string> = {
  excessive_nesting: 'Excessive Nesting',
  deep_property_chain: 'Deep Property Chain',
  magic_number: 'Magic Number',
  magic_string: 'Magic String',
  code_duplication: 'Code Duplication',
  over_engineering: 'Over-Engineering',
  tight_coupling: 'Tight Coupling',
  mixed_feature_logic: 'Mixed Feature Logic',
};

/**
 * Human-readable names for good practice types
 */
const GOOD_PRACTICE_NAMES: Record<GoodPracticeType, string> = {
  kiss: 'KISS (Keep It Simple)',
  dry: 'DRY (Don\'t Repeat Yourself)',
  modular_structure: 'Clear Modular Structure',
  single_responsibility: 'Single Responsibility Principle',
  feature_isolated: 'Feature Isolated/Extractable',
};



/**
 * CodeQualityEvaluator class for evaluating code quality and maintainability
 * 
 * @example
 * ```typescript
 * const evaluator = new CodeQualityEvaluator();
 * const antiPatterns = [
 *   { type: 'excessive_nesting', name: 'Excessive Nesting', ... }
 * ];
 * const goodPractices = [
 *   { type: 'kiss', name: 'KISS', ... }
 * ];
 * const evaluation = evaluator.evaluate(
 *   feature,
 *   'isolated_module',
 *   antiPatterns,
 *   goodPractices
 * );
 * ```
 */
export class CodeQualityEvaluator {
  private options: Required<CodeQualityEvaluatorOptions>;

  constructor(options: CodeQualityEvaluatorOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Evaluates the code quality of an atomic feature
   * 
   * @param feature - The atomic feature being evaluated
   * @param featureIsolation - Classification of feature isolation
   * @param antiPatterns - Detected anti-patterns
   * @param goodPractices - Identified good practices
   * @returns Complete code quality evaluation
   */
  evaluate(
    feature: AtomicFeature,
    featureIsolation: FeatureIsolationClassification,
    antiPatterns: AntiPatternAnalysisResult[],
    goodPractices: GoodPracticeAnalysisResult[]
  ): CodeQualityEvaluation {
    // Determine rating based on analysis
    const rating = this.determineRating(featureIsolation, antiPatterns, goodPractices);

    // Convert analysis results to evaluation format
    const formattedAntiPatterns = this.formatAntiPatterns(antiPatterns);
    const formattedGoodPractices = this.formatGoodPractices(goodPractices);

    // Generate assessment
    const assessment = this.generateAssessment(
      feature,
      rating,
      featureIsolation,
      antiPatterns,
      goodPractices
    );

    return {
      rating,
      featureIsolation,
      antiPatterns: formattedAntiPatterns,
      goodPractices: formattedGoodPractices,
      assessment,
    };
  }

  /**
   * Determines the code quality rating based on analysis results
   * 
   * @param featureIsolation - Feature isolation classification
   * @param antiPatterns - Detected anti-patterns
   * @param goodPractices - Identified good practices
   * @returns Quality rating string
   */
  determineRating(
    featureIsolation: FeatureIsolationClassification,
    antiPatterns: AntiPatternAnalysisResult[],
    goodPractices: GoodPracticeAnalysisResult[]
  ): QualityRatingString {
    // Calculate a score based on various factors
    let score = 50; // Start at middle

    // Feature isolation impact
    switch (featureIsolation) {
      case 'isolated_module':
        score += 20;
        break;
      case 'same_file_separated':
        score += 10;
        break;
      case 'mixed_with_other':
        score -= 15;
        break;
      case 'scattered_files':
        score -= 25;
        break;
    }

    // Anti-patterns impact (each anti-pattern reduces score)
    score -= antiPatterns.length * 10;

    // Good practices impact (each good practice increases score)
    score += goodPractices.length * 8;

    // Clamp score to 0-100
    score = Math.max(0, Math.min(100, score));

    // Convert score to rating
    if (score >= 80) {
      return 'Excellent';
    } else if (score >= 60) {
      return 'Good';
    } else if (score >= 40) {
      return 'Basic';
    } else {
      return 'Poor';
    }
  }

  /**
   * Generates a detailed assessment explaining the rating
   * 
   * @param feature - The atomic feature
   * @param rating - The assigned rating
   * @param featureIsolation - Feature isolation classification
   * @param antiPatterns - Detected anti-patterns
   * @param goodPractices - Identified good practices
   * @returns Assessment string
   */
  generateAssessment(
    feature: AtomicFeature,
    rating: QualityRatingString,
    featureIsolation: FeatureIsolationClassification,
    antiPatterns: AntiPatternAnalysisResult[],
    goodPractices: GoodPracticeAnalysisResult[]
  ): string {
    const parts: string[] = [];

    // Opening statement
    parts.push(`The ${feature.name} feature has ${rating.toLowerCase()} code quality.`);

    // Feature isolation assessment
    const isolationDescription = this.getIsolationDescription(featureIsolation);
    parts.push(isolationDescription);

    // Anti-patterns summary
    if (antiPatterns.length > 0) {
      const antiPatternNames = antiPatterns.map(ap => ap.name).join(', ');
      parts.push(`Detected anti-patterns: ${antiPatternNames}.`);
    } else {
      parts.push('No significant anti-patterns detected.');
    }

    // Good practices summary
    if (goodPractices.length > 0) {
      const practiceNames = goodPractices.map(gp => gp.name).join(', ');
      parts.push(`Good practices observed: ${practiceNames}.`);
    }

    // Rating-specific recommendations
    switch (rating) {
      case 'Excellent':
        parts.push('The code demonstrates high maintainability standards.');
        break;
      case 'Good':
        parts.push('The code is well-structured with minor improvements possible.');
        break;
      case 'Basic':
        parts.push('The code functions but has maintainability concerns that should be addressed.');
        break;
      case 'Poor':
        parts.push('Significant refactoring is recommended to improve maintainability.');
        break;
    }

    return parts.join(' ');
  }

  /**
   * Gets a human-readable description of feature isolation
   */
  private getIsolationDescription(isolation: FeatureIsolationClassification): string {
    switch (isolation) {
      case 'isolated_module':
        return 'The feature is well-isolated in a separate module/hook.';
      case 'same_file_separated':
        return 'The feature is in the same file but clearly separated from other logic.';
      case 'mixed_with_other':
        return 'The feature code is mixed with other logic, reducing maintainability.';
      case 'scattered_files':
        return 'The feature is scattered across multiple files, making it difficult to maintain.';
    }
  }

  /**
   * Formats anti-pattern analysis results to evaluation format
   */
  private formatAntiPatterns(results: AntiPatternAnalysisResult[]): AntiPattern[] {
    return results.map((result, index) => ({
      id: index + 1,
      name: result.name,
      evidence: result.evidence,
      issue: result.issue,
      impact: result.impact,
      betterApproach: result.betterApproach,
    }));
  }

  /**
   * Formats good practice analysis results to evaluation format
   */
  private formatGoodPractices(results: GoodPracticeAnalysisResult[]): GoodPractice[] {
    return results.map(result => ({
      name: result.name,
      evidence: result.evidence,
      description: result.description,
    }));
  }

  /**
   * Validates that a rating is one of the valid quality ratings
   * 
   * @param rating - The rating to validate
   * @returns True if the rating is valid
   */
  isValidRating(rating: string): rating is QualityRatingString {
    return ['Poor', 'Basic', 'Good', 'Excellent'].includes(rating);
  }

  /**
   * Validates that a feature isolation classification is valid
   * 
   * @param classification - The classification to validate
   * @returns True if the classification is valid
   */
  isValidIsolationClassification(
    classification: string
  ): classification is FeatureIsolationClassification {
    return [
      'isolated_module',
      'same_file_separated',
      'mixed_with_other',
      'scattered_files',
    ].includes(classification);
  }

  /**
   * Gets the configuration options
   */
  getOptions(): Required<CodeQualityEvaluatorOptions> {
    return { ...this.options };
  }
}


// ============================================================================
// Feature Isolation Classifier
// ============================================================================

/**
 * Information about feature code distribution
 */
export interface FeatureCodeDistribution {
  /** Primary file containing the feature */
  primaryFile: string;
  /** All files containing feature code */
  files: string[];
  /** Whether feature has its own module/hook */
  hasOwnModule: boolean;
  /** Whether feature code is clearly separated in the file */
  isClearlySeparated: boolean;
  /** Whether feature code is mixed with other feature logic */
  isMixedWithOther: boolean;
}

/**
 * FeatureIsolationClassifier - Classifies how feature code is organized
 * 
 * Generates checkboxes for feature isolation classification:
 * - ✅ Feature isolated in separate module/hook (Good)
 * - ⚠️ Feature in same file, clearly separated (Acceptable)
 * - ❌ Feature mixed with other logic (Bad)
 * - ❌ Feature scattered across multiple files (Very Bad)
 */
export class FeatureIsolationClassifier {
  /**
   * Classifies feature isolation based on code distribution
   * 
   * @param distribution - Information about feature code distribution
   * @returns Feature isolation classification
   */
  classify(distribution: FeatureCodeDistribution): FeatureIsolationClassification {
    // Check if scattered across multiple files (Very Bad)
    if (distribution.files.length > 1 && !distribution.hasOwnModule) {
      return 'scattered_files';
    }

    // Check if isolated in own module (Good)
    if (distribution.hasOwnModule) {
      return 'isolated_module';
    }

    // Check if mixed with other logic (Bad)
    if (distribution.isMixedWithOther) {
      return 'mixed_with_other';
    }

    // Check if clearly separated in same file (Acceptable)
    if (distribution.isClearlySeparated) {
      return 'same_file_separated';
    }

    // Default to mixed if unclear
    return 'mixed_with_other';
  }

  /**
   * Formats the classification as a checkbox list
   * 
   * @param classification - The feature isolation classification
   * @returns Formatted markdown checkbox list
   */
  formatAsCheckboxes(classification: FeatureIsolationClassification): string {
    const checkboxes = [
      {
        classification: 'isolated_module' as const,
        label: '✅ Feature isolated in separate module/hook',
        quality: 'Good',
      },
      {
        classification: 'same_file_separated' as const,
        label: '⚠️ Feature in same file, clearly separated',
        quality: 'Acceptable',
      },
      {
        classification: 'mixed_with_other' as const,
        label: '❌ Feature mixed with other logic',
        quality: 'Bad',
      },
      {
        classification: 'scattered_files' as const,
        label: '❌ Feature scattered across multiple files',
        quality: 'Very Bad',
      },
    ];

    return checkboxes
      .map(cb => {
        const checked = cb.classification === classification ? '[x]' : '[ ]';
        return `- ${checked} ${cb.label}`;
      })
      .join('\n');
  }

  /**
   * Gets the quality label for a classification
   * 
   * @param classification - The feature isolation classification
   * @returns Quality label (Good, Acceptable, Bad, Very Bad)
   */
  getQualityLabel(classification: FeatureIsolationClassification): string {
    switch (classification) {
      case 'isolated_module':
        return 'Good';
      case 'same_file_separated':
        return 'Acceptable';
      case 'mixed_with_other':
        return 'Bad';
      case 'scattered_files':
        return 'Very Bad';
    }
  }

  /**
   * Gets the marker emoji for a classification
   * 
   * @param classification - The feature isolation classification
   * @returns Marker emoji
   */
  getMarker(classification: FeatureIsolationClassification): string {
    switch (classification) {
      case 'isolated_module':
        return '✅';
      case 'same_file_separated':
        return '⚠️';
      case 'mixed_with_other':
      case 'scattered_files':
        return '❌';
    }
  }

  /**
   * Validates that a classification is valid
   * 
   * @param classification - The classification to validate
   * @returns True if valid
   */
  isValidClassification(
    classification: string
  ): classification is FeatureIsolationClassification {
    return [
      'isolated_module',
      'same_file_separated',
      'mixed_with_other',
      'scattered_files',
    ].includes(classification);
  }
}


// ============================================================================
// Anti-Pattern Detector
// ============================================================================

/**
 * Detection result for a specific anti-pattern
 */
export interface AntiPatternDetection {
  /** Whether the anti-pattern was detected */
  detected: boolean;
  /** Type of anti-pattern */
  type: AntiPatternType;
  /** Locations where the anti-pattern was found */
  locations: Array<{
    file: string;
    startLine: number;
    endLine: number;
    snippet: string;
  }>;
}

/**
 * AntiPatternDetector - Detects various anti-patterns in code
 * 
 * Detects:
 * - Excessive nesting (>3 levels of if-else)
 * - Deep property chains (ClassA.methodB.propertyC.value)
 * - Magic numbers/strings without named constants
 * - Code duplication
 * - Over-engineering and tight coupling
 * - Feature code mixed with other feature logic
 */
export class AntiPatternDetector {
  private options: Required<CodeQualityEvaluatorOptions>;

  constructor(options: CodeQualityEvaluatorOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Detects excessive nesting in code
   * 
   * @param code - Source code to analyze
   * @param filePath - Path to the file
   * @returns Detection result
   */
  detectExcessiveNesting(code: string, filePath: string): AntiPatternDetection {
    const lines = code.split('\n');
    const locations: AntiPatternDetection['locations'] = [];
    
    let currentDepth = 0;
    let maxDepthLine = 0;
    let maxDepth = 0;
    let detectedAtDepth = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Count only braces for nesting depth (more accurate)
      const openings = (line.match(/\{/g) || []).length;
      const closings = (line.match(/\}/g) || []).length;
      
      // Update depth after openings
      currentDepth += openings;
      
      if (currentDepth > maxDepth) {
        maxDepth = currentDepth;
        maxDepthLine = i + 1;
      }
      
      // Check if we exceeded the threshold (>3 means 4 or more levels)
      if (currentDepth > this.options.maxNestingDepth && !detectedAtDepth) {
        const startLine = Math.max(1, maxDepthLine - 2);
        const endLine = Math.min(lines.length, maxDepthLine + 2);
        const snippet = lines.slice(startLine - 1, endLine).join('\n');
        
        locations.push({
          file: filePath,
          startLine,
          endLine,
          snippet,
        });
        
        detectedAtDepth = true;
      }
      
      // Update depth after closings
      currentDepth -= closings;
      currentDepth = Math.max(0, currentDepth);
      
      // Reset detection flag when we exit the deeply nested block
      if (currentDepth <= this.options.maxNestingDepth) {
        detectedAtDepth = false;
      }
    }

    return {
      detected: locations.length > 0,
      type: 'excessive_nesting',
      locations,
    };
  }

  /**
   * Detects deep property chains in code
   * 
   * @param code - Source code to analyze
   * @param filePath - Path to the file
   * @returns Detection result
   */
  detectDeepPropertyChains(code: string, filePath: string): AntiPatternDetection {
    const lines = code.split('\n');
    const locations: AntiPatternDetection['locations'] = [];
    
    // Pattern to match property chains like a.b.c.d.e
    const chainPattern = /(\w+(?:\.\w+){3,})/g;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const matches = line.match(chainPattern);
      
      if (matches) {
        for (const match of matches) {
          const chainDepth = match.split('.').length;
          if (chainDepth > this.options.maxPropertyChainDepth) {
            locations.push({
              file: filePath,
              startLine: i + 1,
              endLine: i + 1,
              snippet: line.trim(),
            });
          }
        }
      }
    }

    return {
      detected: locations.length > 0,
      type: 'deep_property_chain',
      locations,
    };
  }

  /**
   * Detects magic numbers in code
   * 
   * @param code - Source code to analyze
   * @param filePath - Path to the file
   * @returns Detection result
   */
  detectMagicNumbers(code: string, filePath: string): AntiPatternDetection {
    const lines = code.split('\n');
    const locations: AntiPatternDetection['locations'] = [];
    
    // Pattern to match standalone numbers (excluding 0, 1, -1, and common values)
    const magicNumberPattern = /(?<![a-zA-Z_$])(?<!\.)\b(\d{2,}|\d+\.\d+)\b(?![a-zA-Z_$])/g;
    const allowedNumbers = new Set(['0', '1', '-1', '2', '100', '1000']);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip comments and const declarations
      if (line.trim().startsWith('//') || line.trim().startsWith('/*') || 
          line.includes('const ') || line.includes('= ')) {
        continue;
      }
      
      const matches = line.match(magicNumberPattern);
      
      if (matches) {
        for (const match of matches) {
          if (!allowedNumbers.has(match)) {
            locations.push({
              file: filePath,
              startLine: i + 1,
              endLine: i + 1,
              snippet: line.trim(),
            });
            break; // One detection per line is enough
          }
        }
      }
    }

    return {
      detected: locations.length > 0,
      type: 'magic_number',
      locations,
    };
  }

  /**
   * Detects magic strings in code
   * 
   * @param code - Source code to analyze
   * @param filePath - Path to the file
   * @returns Detection result
   */
  detectMagicStrings(code: string, filePath: string): AntiPatternDetection {
    const lines = code.split('\n');
    const locations: AntiPatternDetection['locations'] = [];
    
    // Pattern to match string literals used in comparisons or conditions
    const magicStringPattern = /(?:===?|!==?)\s*['"`]([^'"`]{3,})['"`]/g;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip const declarations and imports
      if (line.includes('const ') || line.includes('import ')) {
        continue;
      }
      
      if (magicStringPattern.test(line)) {
        locations.push({
          file: filePath,
          startLine: i + 1,
          endLine: i + 1,
          snippet: line.trim(),
        });
      }
      
      // Reset regex lastIndex
      magicStringPattern.lastIndex = 0;
    }

    return {
      detected: locations.length > 0,
      type: 'magic_string',
      locations,
    };
  }

  /**
   * Detects potential code duplication
   * 
   * @param codeBlocks - Array of code blocks to compare
   * @param filePath - Path to the file
   * @returns Detection result
   */
  detectCodeDuplication(
    codeBlocks: Array<{ code: string; startLine: number; endLine: number }>,
    filePath: string
  ): AntiPatternDetection {
    const locations: AntiPatternDetection['locations'] = [];
    
    // Simple similarity check - compare normalized code blocks
    for (let i = 0; i < codeBlocks.length; i++) {
      for (let j = i + 1; j < codeBlocks.length; j++) {
        const similarity = this.calculateSimilarity(
          codeBlocks[i].code,
          codeBlocks[j].code
        );
        
        if (similarity >= this.options.duplicationThreshold) {
          locations.push({
            file: filePath,
            startLine: codeBlocks[i].startLine,
            endLine: codeBlocks[i].endLine,
            snippet: codeBlocks[i].code.substring(0, 100) + '...',
          });
        }
      }
    }

    return {
      detected: locations.length > 0,
      type: 'code_duplication',
      locations,
    };
  }

  /**
   * Calculates similarity between two code strings
   */
  private calculateSimilarity(code1: string, code2: string): number {
    const normalize = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
    const n1 = normalize(code1);
    const n2 = normalize(code2);
    
    if (n1 === n2) return 100;
    if (n1.length === 0 || n2.length === 0) return 0;
    
    // Simple Jaccard similarity on words
    const words1 = new Set(n1.split(' '));
    const words2 = new Set(n2.split(' '));
    
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    
    return Math.round((intersection.size / union.size) * 100);
  }

  /**
   * Detects tight coupling patterns
   * 
   * @param code - Source code to analyze
   * @param filePath - Path to the file
   * @returns Detection result
   */
  detectTightCoupling(code: string, filePath: string): AntiPatternDetection {
    const lines = code.split('\n');
    const locations: AntiPatternDetection['locations'] = [];
    
    // Patterns indicating tight coupling
    const couplingPatterns = [
      /new\s+\w+\s*\(/g,  // Direct instantiation
      /\w+\.getInstance\(\)/g,  // Singleton access
      /global\.\w+/g,  // Global access
      /window\.\w+/g,  // Window object access (in non-browser context)
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (const pattern of couplingPatterns) {
        if (pattern.test(line)) {
          locations.push({
            file: filePath,
            startLine: i + 1,
            endLine: i + 1,
            snippet: line.trim(),
          });
          break;
        }
        pattern.lastIndex = 0;
      }
    }

    return {
      detected: locations.length > 0,
      type: 'tight_coupling',
      locations,
    };
  }

  /**
   * Runs all anti-pattern detections on code
   * 
   * @param code - Source code to analyze
   * @param filePath - Path to the file
   * @returns Array of all detection results
   */
  detectAll(code: string, filePath: string): AntiPatternDetection[] {
    return [
      this.detectExcessiveNesting(code, filePath),
      this.detectDeepPropertyChains(code, filePath),
      this.detectMagicNumbers(code, filePath),
      this.detectMagicStrings(code, filePath),
      this.detectTightCoupling(code, filePath),
    ].filter(detection => detection.detected);
  }
}


// ============================================================================
// Anti-Pattern Documenter
// ============================================================================

/**
 * AntiPatternDocumenter - Generates formatted documentation for anti-patterns
 * 
 * Generates numbered anti-pattern sections (#1, #2, etc.) with:
 * - Code snippet with file and line numbers
 * - Issue description
 * - Impact assessment
 * - Better Approach with improved code example
 */
export class AntiPatternDocumenter {
  /**
   * Formats a single anti-pattern as a numbered section
   * 
   * @param antiPattern - The anti-pattern to document
   * @returns Formatted markdown section
   */
  formatAntiPattern(antiPattern: AntiPattern): string {
    const lines: string[] = [];
    
    // Numbered heading
    lines.push(`**#${antiPattern.id}: ${antiPattern.name}**`);
    
    // Code snippet with file and line numbers
    const { filePath, lineNumbers, codeSnippet, language } = antiPattern.evidence;
    lines.push('```' + language);
    lines.push(`// Lines [${lineNumbers.start}-${lineNumbers.end}] from ${filePath}`);
    lines.push(codeSnippet);
    lines.push('```');
    
    // Issue description
    lines.push(`- **Issue:** ${antiPattern.issue}`);
    
    // Impact assessment
    lines.push(`- **Impact:** ${antiPattern.impact}`);
    
    // Better approach
    lines.push('- **Better Approach:**');
    lines.push(antiPattern.betterApproach.description);
    lines.push('```' + language);
    lines.push(antiPattern.betterApproach.codeExample);
    lines.push('```');
    
    return lines.join('\n');
  }

  /**
   * Formats all anti-patterns as a complete section
   * 
   * @param antiPatterns - Array of anti-patterns to document
   * @returns Formatted markdown section
   */
  formatAllAntiPatterns(antiPatterns: AntiPattern[]): string {
    if (antiPatterns.length === 0) {
      return 'No anti-patterns detected.';
    }
    
    const header = '**Anti-Patterns Detected:**\n';
    const sections = antiPatterns.map(ap => this.formatAntiPattern(ap));
    
    return header + '\n' + sections.join('\n\n');
  }

  /**
   * Creates an AntiPattern from detection result
   * 
   * @param detection - The detection result
   * @param id - The anti-pattern ID
   * @param language - Programming language
   * @returns AntiPattern object
   */
  createFromDetection(
    detection: AntiPatternDetection,
    id: number,
    language: string = 'javascript'
  ): AntiPattern | null {
    if (!detection.detected || detection.locations.length === 0) {
      return null;
    }
    
    const location = detection.locations[0];
    const name = ANTI_PATTERN_NAMES[detection.type];
    
    return {
      id,
      name,
      evidence: {
        filePath: location.file,
        lineNumbers: {
          start: location.startLine,
          end: location.endLine,
        },
        codeSnippet: location.snippet,
        language,
      },
      issue: this.getIssueDescription(detection.type),
      impact: this.getImpactDescription(detection.type),
      betterApproach: this.getBetterApproach(detection.type),
    };
  }

  /**
   * Gets the issue description for an anti-pattern type
   */
  private getIssueDescription(type: AntiPatternType): string {
    const descriptions: Record<AntiPatternType, string> = {
      excessive_nesting: 'Code has too many levels of nesting, making it difficult to read and maintain.',
      deep_property_chain: 'Long property chains increase coupling and make code fragile to changes.',
      magic_number: 'Unexplained numeric literals make code harder to understand and maintain.',
      magic_string: 'Hardcoded string literals in conditions reduce code clarity and maintainability.',
      code_duplication: 'Duplicated code increases maintenance burden and risk of inconsistent changes.',
      over_engineering: 'Unnecessary complexity adds cognitive load without providing value.',
      tight_coupling: 'Direct dependencies between components reduce flexibility and testability.',
      mixed_feature_logic: 'Feature code mixed with other logic makes isolation and testing difficult.',
    };
    return descriptions[type];
  }

  /**
   * Gets the impact description for an anti-pattern type
   */
  private getImpactDescription(type: AntiPatternType): string {
    const impacts: Record<AntiPatternType, string> = {
      excessive_nesting: 'Reduces readability, increases cognitive load, and makes debugging harder.',
      deep_property_chain: 'Creates fragile code that breaks when intermediate objects change.',
      magic_number: 'Makes code intent unclear and increases risk of errors during modifications.',
      magic_string: 'Leads to typos, inconsistent behavior, and difficult refactoring.',
      code_duplication: 'Bug fixes must be applied in multiple places, increasing error risk.',
      over_engineering: 'Slows development, increases bugs, and makes onboarding harder.',
      tight_coupling: 'Makes unit testing difficult and changes ripple through the codebase.',
      mixed_feature_logic: 'Prevents feature extraction and increases risk of unintended side effects.',
    };
    return impacts[type];
  }

  /**
   * Gets the better approach for an anti-pattern type
   */
  private getBetterApproach(type: AntiPatternType): { description: string; codeExample: string } {
    const approaches: Record<AntiPatternType, { description: string; codeExample: string }> = {
      excessive_nesting: {
        description: 'Use early returns, extract functions, or use guard clauses to flatten nesting.',
        codeExample: `// Use early return
if (!condition) return;
// Main logic here`,
      },
      deep_property_chain: {
        description: 'Use destructuring or intermediate variables to break up long chains.',
        codeExample: `// Destructure or use intermediate variables
const { value } = obj.nested;
// Or use optional chaining with fallback
const value = obj?.nested?.value ?? defaultValue;`,
      },
      magic_number: {
        description: 'Extract magic numbers into named constants with descriptive names.',
        codeExample: `const MAX_RETRY_ATTEMPTS = 3;
const TIMEOUT_MS = 5000;`,
      },
      magic_string: {
        description: 'Use constants or enums for string literals used in comparisons.',
        codeExample: `const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};
if (status === STATUS.ACTIVE) { ... }`,
      },
      code_duplication: {
        description: 'Extract common logic into reusable functions or components.',
        codeExample: `// Extract to a reusable function
function processItem(item) {
  // Common logic here
}`,
      },
      over_engineering: {
        description: 'Simplify by removing unnecessary abstractions and following YAGNI principle.',
        codeExample: `// Keep it simple
function doThing(input) {
  return input.process();
}`,
      },
      tight_coupling: {
        description: 'Use dependency injection or interfaces to decouple components.',
        codeExample: `// Use dependency injection
function createService(dependency) {
  return { ... };
}`,
      },
      mixed_feature_logic: {
        description: 'Extract feature logic into separate modules or custom hooks.',
        codeExample: `// Extract to custom hook
function useFeature() {
  // Feature-specific logic
  return { ... };
}`,
      },
    };
    return approaches[type];
  }

  /**
   * Validates that an anti-pattern has all required fields
   * 
   * @param antiPattern - The anti-pattern to validate
   * @returns True if valid
   */
  isValidAntiPattern(antiPattern: AntiPattern): boolean {
    return (
      typeof antiPattern.id === 'number' &&
      antiPattern.id > 0 &&
      typeof antiPattern.name === 'string' &&
      antiPattern.name.length > 0 &&
      typeof antiPattern.issue === 'string' &&
      antiPattern.issue.length > 0 &&
      typeof antiPattern.impact === 'string' &&
      antiPattern.impact.length > 0 &&
      typeof antiPattern.betterApproach.description === 'string' &&
      antiPattern.betterApproach.description.length > 0 &&
      typeof antiPattern.betterApproach.codeExample === 'string' &&
      antiPattern.betterApproach.codeExample.length > 0 &&
      typeof antiPattern.evidence.filePath === 'string' &&
      antiPattern.evidence.filePath.length > 0 &&
      antiPattern.evidence.lineNumbers.start > 0 &&
      antiPattern.evidence.lineNumbers.end >= antiPattern.evidence.lineNumbers.start
    );
  }
}


// ============================================================================
// Good Practice Identifier
// ============================================================================

/**
 * Detection result for a good practice
 */
export interface GoodPracticeDetection {
  /** Whether the good practice was detected */
  detected: boolean;
  /** Type of good practice */
  type: GoodPracticeType;
  /** Locations where the good practice was found */
  locations: Array<{
    file: string;
    startLine: number;
    endLine: number;
    snippet: string;
  }>;
}

/**
 * GoodPracticeIdentifier - Identifies good coding practices
 * 
 * Identifies:
 * - KISS (Keep It Simple) patterns
 * - DRY (Don't Repeat Yourself) patterns
 * - Clear modular structure
 * - Single Responsibility Principle adherence
 * - Feature isolated/extractable patterns
 */
export class GoodPracticeIdentifier {
  /**
   * Identifies KISS patterns in code
   * 
   * @param code - Source code to analyze
   * @param filePath - Path to the file
   * @returns Detection result
   */
  identifyKISS(code: string, filePath: string): GoodPracticeDetection {
    const lines = code.split('\n');
    const locations: GoodPracticeDetection['locations'] = [];
    
    // Look for simple, straightforward patterns
    const kissPatterns = [
      /^const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*[^{]+;$/,  // Simple arrow functions
      /^return\s+[^;]+;$/,  // Direct returns
      /^\s*if\s*\([^)]+\)\s*return\s+[^;]+;$/,  // Guard clauses
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      for (const pattern of kissPatterns) {
        if (pattern.test(line)) {
          locations.push({
            file: filePath,
            startLine: i + 1,
            endLine: i + 1,
            snippet: line,
          });
          break;
        }
      }
    }

    return {
      detected: locations.length > 0,
      type: 'kiss',
      locations,
    };
  }

  /**
   * Identifies DRY patterns in code
   * 
   * @param code - Source code to analyze
   * @param filePath - Path to the file
   * @returns Detection result
   */
  identifyDRY(code: string, filePath: string): GoodPracticeDetection {
    const lines = code.split('\n');
    const locations: GoodPracticeDetection['locations'] = [];
    
    // Look for reusable function definitions and utility usage
    const dryPatterns = [
      /^(export\s+)?(const|function)\s+\w+\s*=?\s*\([^)]*\)\s*(=>|{)/,  // Function definitions
      /^import\s+.*\s+from\s+['"]\.\.?\//,  // Local imports (reusing code)
      /use\w+\(/,  // Custom hooks
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      for (const pattern of dryPatterns) {
        if (pattern.test(line)) {
          locations.push({
            file: filePath,
            startLine: i + 1,
            endLine: i + 1,
            snippet: line,
          });
          break;
        }
      }
    }

    return {
      detected: locations.length > 0,
      type: 'dry',
      locations,
    };
  }

  /**
   * Identifies clear modular structure
   * 
   * @param code - Source code to analyze
   * @param filePath - Path to the file
   * @returns Detection result
   */
  identifyModularStructure(code: string, filePath: string): GoodPracticeDetection {
    const lines = code.split('\n');
    const locations: GoodPracticeDetection['locations'] = [];
    
    // Look for modular patterns
    const modularPatterns = [
      /^export\s+(default\s+)?(function|const|class)\s+\w+/,  // Named exports
      /^import\s+\{[^}]+\}\s+from/,  // Named imports
      /^export\s+\{[^}]+\}/,  // Re-exports
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      for (const pattern of modularPatterns) {
        if (pattern.test(line)) {
          locations.push({
            file: filePath,
            startLine: i + 1,
            endLine: i + 1,
            snippet: line,
          });
          break;
        }
      }
    }

    return {
      detected: locations.length > 0,
      type: 'modular_structure',
      locations,
    };
  }

  /**
   * Identifies Single Responsibility Principle adherence
   * 
   * @param code - Source code to analyze
   * @param filePath - Path to the file
   * @param functionCount - Number of functions in the file
   * @param avgFunctionLength - Average function length
   * @returns Detection result
   */
  identifySRP(
    code: string,
    filePath: string,
    functionCount: number = 0,
    avgFunctionLength: number = 0
  ): GoodPracticeDetection {
    const locations: GoodPracticeDetection['locations'] = [];
    
    // SRP is indicated by:
    // - Multiple small, focused functions
    // - Average function length < 30 lines
    // - Clear separation of concerns
    
    if (functionCount > 1 && avgFunctionLength < 30) {
      locations.push({
        file: filePath,
        startLine: 1,
        endLine: 1,
        snippet: `File contains ${functionCount} focused functions with avg length ${avgFunctionLength} lines`,
      });
    }

    return {
      detected: locations.length > 0,
      type: 'single_responsibility',
      locations,
    };
  }

  /**
   * Identifies feature isolated/extractable patterns
   * 
   * @param code - Source code to analyze
   * @param filePath - Path to the file
   * @returns Detection result
   */
  identifyFeatureIsolated(code: string, filePath: string): GoodPracticeDetection {
    const lines = code.split('\n');
    const locations: GoodPracticeDetection['locations'] = [];
    
    // Look for patterns indicating feature isolation
    const isolationPatterns = [
      /^export\s+(default\s+)?function\s+use\w+/,  // Custom hooks
      /^export\s+const\s+use\w+\s*=/,  // Custom hooks as const
      /^export\s+(default\s+)?class\s+\w+Service/,  // Service classes
      /^export\s+(default\s+)?const\s+\w+Context/,  // Context definitions
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      for (const pattern of isolationPatterns) {
        if (pattern.test(line)) {
          locations.push({
            file: filePath,
            startLine: i + 1,
            endLine: i + 1,
            snippet: line,
          });
          break;
        }
      }
    }

    return {
      detected: locations.length > 0,
      type: 'feature_isolated',
      locations,
    };
  }

  /**
   * Runs all good practice identifications on code
   * 
   * @param code - Source code to analyze
   * @param filePath - Path to the file
   * @returns Array of all detection results
   */
  identifyAll(code: string, filePath: string): GoodPracticeDetection[] {
    return [
      this.identifyKISS(code, filePath),
      this.identifyDRY(code, filePath),
      this.identifyModularStructure(code, filePath),
      this.identifyFeatureIsolated(code, filePath),
    ].filter(detection => detection.detected);
  }

  /**
   * Creates a GoodPractice from detection result
   * 
   * @param detection - The detection result
   * @param language - Programming language
   * @returns GoodPractice object
   */
  createFromDetection(
    detection: GoodPracticeDetection,
    language: string = 'javascript'
  ): GoodPractice | null {
    if (!detection.detected || detection.locations.length === 0) {
      return null;
    }
    
    const location = detection.locations[0];
    const name = GOOD_PRACTICE_NAMES[detection.type];
    
    return {
      name,
      evidence: {
        filePath: location.file,
        lineNumbers: {
          start: location.startLine,
          end: location.endLine,
        },
        codeSnippet: location.snippet,
        language,
      },
      description: this.getDescription(detection.type),
    };
  }

  /**
   * Gets the description for a good practice type
   */
  private getDescription(type: GoodPracticeType): string {
    const descriptions: Record<GoodPracticeType, string> = {
      kiss: 'Code follows the Keep It Simple principle with straightforward, readable implementations.',
      dry: 'Code avoids repetition by extracting reusable functions and components.',
      modular_structure: 'Code is organized into clear, well-defined modules with explicit exports.',
      single_responsibility: 'Functions and components have focused, single responsibilities.',
      feature_isolated: 'Feature logic is isolated and can be easily extracted or tested independently.',
    };
    return descriptions[type];
  }

  /**
   * Formats good practices with checkmarks
   * 
   * @param practices - Array of good practices
   * @returns Formatted markdown string
   */
  formatWithCheckmarks(practices: GoodPractice[]): string {
    if (practices.length === 0) {
      return 'No specific good practices identified.';
    }
    
    const lines = ['**Good Practices Observed:**'];
    
    for (const practice of practices) {
      lines.push(`- ✅ ${practice.name}: ${practice.description}`);
    }
    
    return lines.join('\n');
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Creates an anti-pattern analysis result
 */
export function createAntiPatternAnalysis(
  type: AntiPatternType,
  evidence: CodeEvidence,
  issue: string,
  impact: string,
  betterApproach: { description: string; codeExample: string }
): AntiPatternAnalysisResult {
  return {
    type,
    name: ANTI_PATTERN_NAMES[type],
    evidence,
    issue,
    impact,
    betterApproach,
  };
}

/**
 * Creates a good practice analysis result
 */
export function createGoodPracticeAnalysis(
  type: GoodPracticeType,
  evidence: CodeEvidence,
  description: string
): GoodPracticeAnalysisResult {
  return {
    type,
    name: GOOD_PRACTICE_NAMES[type],
    evidence,
    description,
  };
}

/**
 * Gets all valid quality ratings
 */
export function getValidQualityRatings(): QualityRatingString[] {
  return ['Poor', 'Basic', 'Good', 'Excellent'];
}

/**
 * Gets all valid feature isolation classifications
 */
export function getValidIsolationClassifications(): FeatureIsolationClassification[] {
  return ['isolated_module', 'same_file_separated', 'mixed_with_other', 'scattered_files'];
}
