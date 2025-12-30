/**
 * ReliabilityEvaluator - Evaluates reliability and fault-tolerance (Dimension 4)
 * 
 * Analyzes error handling patterns, defensive coding, fallback mechanisms,
 * and generates assessments with justification.
 * 
 * @module ReliabilityEvaluator
 */

import type {
  AtomicFeature,
  CodeEvidence,
  ReliabilityRatingString,
} from '../../types/evaluation';
import type {
  ReliabilityEvaluation,
  ErrorHandlingInstance,
  ErrorHandlingGap,
  DefensiveCodingAssessment,
  EdgeCaseAssessment,
} from '../../types/dimensions';

/**
 * Configuration options for reliability evaluation
 */
export interface ReliabilityEvaluatorOptions {
  /** Minimum error handling coverage for Medium rating (default: 30) */
  mediumMinCoverage?: number;
  /** Minimum error handling coverage for High rating (default: 60) */
  highMinCoverage?: number;
  /** Minimum error handling coverage for Enterprise rating (default: 90) */
  enterpriseMinCoverage?: number;
}

/**
 * Default configuration for reliability evaluation
 */
const DEFAULT_OPTIONS: Required<ReliabilityEvaluatorOptions> = {
  mediumMinCoverage: 30,
  highMinCoverage: 60,
  enterpriseMinCoverage: 90,
};

/**
 * Result of analyzing error handling in code
 */
export interface ErrorHandlingAnalysisResult {
  /** Total number of risky operations found */
  totalRiskyOperations: number;
  /** Number of risky operations with error handling */
  handledOperations: number;
  /** Present error handling instances */
  presentHandling: ErrorHandlingInstance[];
  /** Missing error handling gaps */
  missingHandling: ErrorHandlingGap[];
  /** Defensive coding assessment */
  defensiveCoding: DefensiveCodingAssessment;
  /** Edge case handling assessment */
  edgeCaseHandling: EdgeCaseAssessment;
}

/**
 * ReliabilityEvaluator class for evaluating reliability and fault-tolerance
 * 
 * @example
 * ```typescript
 * const evaluator = new ReliabilityEvaluator();
 * const analysis = evaluator.analyzeCode(code, filePath);
 * const evaluation = evaluator.evaluate(feature, analysis);
 * ```
 */
export class ReliabilityEvaluator {
  private options: Required<ReliabilityEvaluatorOptions>;

  constructor(options: ReliabilityEvaluatorOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Evaluates the reliability of an atomic feature
   * 
   * @param feature - The atomic feature being evaluated
   * @param analysis - Results of error handling analysis
   * @returns Complete reliability evaluation
   */
  evaluate(
    feature: AtomicFeature,
    analysis: ErrorHandlingAnalysisResult
  ): ReliabilityEvaluation {
    // Determine rating based on analysis
    const rating = this.determineRating(analysis);

    // Generate assessment
    const assessment = this.generateAssessment(feature, rating, analysis);

    return {
      rating,
      presentErrorHandling: analysis.presentHandling,
      missingErrorHandling: analysis.missingHandling,
      defensiveCoding: analysis.defensiveCoding,
      edgeCaseHandling: analysis.edgeCaseHandling,
      assessment,
    };
  }

  /**
   * Determines the reliability rating based on analysis results
   * 
   * @param analysis - Error handling analysis results
   * @returns Reliability rating string
   */
  determineRating(analysis: ErrorHandlingAnalysisResult): ReliabilityRatingString {
    // Calculate coverage percentage
    const coverage = analysis.totalRiskyOperations > 0
      ? (analysis.handledOperations / analysis.totalRiskyOperations) * 100
      : 100; // If no risky operations, consider it fully covered

    // Calculate a score based on various factors
    let score = coverage;

    // Defensive coding bonus
    if (analysis.defensiveCoding.hasInputValidation) score += 5;
    if (analysis.defensiveCoding.hasNullChecks) score += 5;
    if (analysis.defensiveCoding.hasTypeGuards) score += 5;

    // Edge case handling bonus
    const edgeCaseRatio = analysis.edgeCaseHandling.handledCases.length /
      Math.max(1, analysis.edgeCaseHandling.handledCases.length + analysis.edgeCaseHandling.unhandledCases.length);
    score += edgeCaseRatio * 10;

    // Penalty for high-risk gaps
    const highRiskGaps = analysis.missingHandling.filter(g => g.risk === 'High').length;
    score -= highRiskGaps * 10;

    // Clamp score to 0-100
    score = Math.max(0, Math.min(100, score));

    // Convert score to rating
    if (score >= this.options.enterpriseMinCoverage) {
      return 'Enterprise-Level';
    } else if (score >= this.options.highMinCoverage) {
      return 'High';
    } else if (score >= this.options.mediumMinCoverage) {
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
    rating: ReliabilityRatingString,
    analysis: ErrorHandlingAnalysisResult
  ): string {
    const parts: string[] = [];

    // Opening statement
    parts.push(`The ${feature.name} feature has ${rating.toLowerCase()} reliability.`);

    // Error handling coverage
    if (analysis.totalRiskyOperations > 0) {
      const coverage = Math.round((analysis.handledOperations / analysis.totalRiskyOperations) * 100);
      parts.push(`Error handling coverage: ${coverage}% (${analysis.handledOperations}/${analysis.totalRiskyOperations} risky operations handled).`);
    } else {
      parts.push('No risky operations identified requiring error handling.');
    }

    // Present error handling
    if (analysis.presentHandling.length > 0) {
      parts.push(`Present error handling: ${analysis.presentHandling.length} instance(s) found.`);
    }

    // Missing error handling
    if (analysis.missingHandling.length > 0) {
      const highRisk = analysis.missingHandling.filter(g => g.risk === 'High').length;
      const mediumRisk = analysis.missingHandling.filter(g => g.risk === 'Medium').length;
      parts.push(`Missing error handling: ${analysis.missingHandling.length} gap(s) (${highRisk} high-risk, ${mediumRisk} medium-risk).`);
    }

    // Defensive coding
    const defensiveItems: string[] = [];
    if (analysis.defensiveCoding.hasInputValidation) defensiveItems.push('input validation');
    if (analysis.defensiveCoding.hasNullChecks) defensiveItems.push('null checks');
    if (analysis.defensiveCoding.hasTypeGuards) defensiveItems.push('type guards');
    
    if (defensiveItems.length > 0) {
      parts.push(`Defensive coding: ${defensiveItems.join(', ')}.`);
    } else {
      parts.push('Limited defensive coding practices observed.');
    }

    // Rating-specific recommendations
    switch (rating) {
      case 'Enterprise-Level':
        parts.push('Comprehensive error handling and defensive coding practices are in place.');
        break;
      case 'High':
        parts.push('Good error handling with minor gaps that could be addressed.');
        break;
      case 'Medium':
        parts.push('Basic error handling exists but significant improvements are recommended.');
        break;
      case 'Low':
        parts.push('Error handling is insufficient. Adding try/catch blocks and input validation is strongly recommended.');
        break;
    }

    return parts.join(' ');
  }

  /**
   * Validates that a rating is one of the valid reliability ratings
   * 
   * @param rating - The rating to validate
   * @returns True if the rating is valid
   */
  isValidRating(rating: string): rating is ReliabilityRatingString {
    return ['Low', 'Medium', 'High', 'Enterprise-Level'].includes(rating);
  }

  /**
   * Gets the configuration options
   */
  getOptions(): Required<ReliabilityEvaluatorOptions> {
    return { ...this.options };
  }
}


// ============================================================================
// Error Handling Analyzer
// ============================================================================

/**
 * ErrorHandlingAnalyzer - Analyzes error handling patterns in code
 * 
 * Detects:
 * - try/catch blocks
 * - Error boundaries (React)
 * - .catch() handlers (Promises)
 * - Error callbacks
 */
export class ErrorHandlingAnalyzer {
  /**
   * Analyzes code for error handling patterns
   * 
   * @param code - Source code to analyze
   * @param filePath - Path to the file
   * @returns Error handling analysis result
   */
  analyze(code: string, filePath: string): ErrorHandlingAnalysisResult {
    const lines = code.split('\n');
    
    // Find risky operations
    const riskyOperations = this.findRiskyOperations(code, filePath);
    
    // Find error handling
    const errorHandling = this.findErrorHandling(code, filePath);
    
    // Match risky operations with error handling
    const { handled, unhandled } = this.matchOperationsWithHandling(
      riskyOperations,
      errorHandling,
      lines
    );
    
    // Analyze defensive coding
    const defensiveCoding = this.analyzeDefensiveCoding(code);
    
    // Analyze edge case handling
    const edgeCaseHandling = this.analyzeEdgeCases(code);

    return {
      totalRiskyOperations: riskyOperations.length,
      handledOperations: handled.length,
      presentHandling: errorHandling,
      missingHandling: unhandled,
      defensiveCoding,
      edgeCaseHandling,
    };
  }

  /**
   * Finds risky operations that should have error handling
   */
  private findRiskyOperations(
    code: string,
    filePath: string
  ): Array<{ line: number; type: string; snippet: string }> {
    const lines = code.split('\n');
    const operations: Array<{ line: number; type: string; snippet: string }> = [];
    
    // Patterns for risky operations
    const riskyPatterns = [
      { pattern: /fetch\s*\(/g, type: 'API call' },
      { pattern: /axios\.\w+\s*\(/g, type: 'API call' },
      { pattern: /JSON\.parse\s*\(/g, type: 'JSON parsing' },
      { pattern: /JSON\.stringify\s*\(/g, type: 'JSON serialization' },
      { pattern: /localStorage\.\w+\s*\(/g, type: 'localStorage access' },
      { pattern: /sessionStorage\.\w+\s*\(/g, type: 'sessionStorage access' },
      { pattern: /new\s+\w+\s*\(/g, type: 'object instantiation' },
      { pattern: /await\s+\w+/g, type: 'async operation' },
      { pattern: /\.then\s*\(/g, type: 'Promise chain' },
      { pattern: /parseInt\s*\(/g, type: 'number parsing' },
      { pattern: /parseFloat\s*\(/g, type: 'number parsing' },
      { pattern: /new\s+Date\s*\(/g, type: 'date parsing' },
      { pattern: /eval\s*\(/g, type: 'eval execution' },
      { pattern: /new\s+Function\s*\(/g, type: 'dynamic function' },
      { pattern: /document\.\w+/g, type: 'DOM access' },
      { pattern: /window\.\w+/g, type: 'window access' },
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (const { pattern, type } of riskyPatterns) {
        if (pattern.test(line)) {
          operations.push({
            line: i + 1,
            type,
            snippet: line.trim(),
          });
          break;
        }
        pattern.lastIndex = 0;
      }
    }
    
    return operations;
  }

  /**
   * Finds error handling patterns in code
   */
  private findErrorHandling(
    code: string,
    filePath: string
  ): ErrorHandlingInstance[] {
    const lines = code.split('\n');
    const instances: ErrorHandlingInstance[] = [];
    
    // Find try/catch blocks
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (/\btry\s*{/.test(line)) {
        // Find the corresponding catch
        let catchLine = -1;
        let braceCount = 0;
        for (let j = i; j < lines.length; j++) {
          braceCount += (lines[j].match(/{/g) || []).length;
          braceCount -= (lines[j].match(/}/g) || []).length;
          if (/\bcatch\s*\(/.test(lines[j])) {
            catchLine = j;
            break;
          }
        }
        
        if (catchLine > 0) {
          const snippet = lines.slice(i, Math.min(catchLine + 3, lines.length)).join('\n');
          instances.push({
            description: 'try/catch block for error handling',
            evidence: {
              filePath,
              lineNumbers: { start: i + 1, end: catchLine + 1 },
              codeSnippet: snippet,
              language: this.detectLanguage(filePath),
            },
          });
        }
      }
      
      // Find .catch() handlers
      if (/\.catch\s*\(/.test(line)) {
        instances.push({
          description: 'Promise .catch() handler',
          evidence: {
            filePath,
            lineNumbers: { start: i + 1, end: i + 1 },
            codeSnippet: line.trim(),
            language: this.detectLanguage(filePath),
          },
        });
      }
      
      // Find error boundaries
      if (/componentDidCatch|ErrorBoundary|getDerivedStateFromError/.test(line)) {
        instances.push({
          description: 'React Error Boundary',
          evidence: {
            filePath,
            lineNumbers: { start: i + 1, end: i + 1 },
            codeSnippet: line.trim(),
            language: this.detectLanguage(filePath),
          },
        });
      }
      
      // Find onError handlers
      if (/onError\s*[=:]/.test(line)) {
        instances.push({
          description: 'onError event handler',
          evidence: {
            filePath,
            lineNumbers: { start: i + 1, end: i + 1 },
            codeSnippet: line.trim(),
            language: this.detectLanguage(filePath),
          },
        });
      }
    }
    
    return instances;
  }

  /**
   * Matches risky operations with error handling
   */
  private matchOperationsWithHandling(
    operations: Array<{ line: number; type: string; snippet: string }>,
    handling: ErrorHandlingInstance[],
    lines: string[]
  ): {
    handled: Array<{ line: number; type: string }>;
    unhandled: ErrorHandlingGap[];
  } {
    const handled: Array<{ line: number; type: string }> = [];
    const unhandled: ErrorHandlingGap[] = [];
    
    for (const op of operations) {
      // Check if this operation is within a try block or has .catch()
      const isHandled = this.isOperationHandled(op.line, handling, lines);
      
      if (isHandled) {
        handled.push({ line: op.line, type: op.type });
      } else {
        unhandled.push({
          scenario: `${op.type} without error handling`,
          location: {
            file: '', // Will be set by caller
            line: op.line,
          },
          risk: this.assessRisk(op.type),
        });
      }
    }
    
    return { handled, unhandled };
  }

  /**
   * Checks if an operation is within error handling
   */
  private isOperationHandled(
    operationLine: number,
    handling: ErrorHandlingInstance[],
    lines: string[]
  ): boolean {
    // Check if within a try block
    for (const h of handling) {
      if (h.description.includes('try/catch')) {
        const { start, end } = h.evidence.lineNumbers;
        if (operationLine >= start && operationLine <= end) {
          return true;
        }
      }
    }
    
    // Check if the line has .catch() on the same line or next line
    const line = lines[operationLine - 1] || '';
    const nextLine = lines[operationLine] || '';
    if (/\.catch\s*\(/.test(line) || /\.catch\s*\(/.test(nextLine)) {
      return true;
    }
    
    return false;
  }

  /**
   * Assesses the risk level of an unhandled operation
   */
  private assessRisk(operationType: string): 'Low' | 'Medium' | 'High' {
    const highRiskTypes = ['API call', 'JSON parsing', 'eval execution', 'dynamic function'];
    const mediumRiskTypes = ['async operation', 'Promise chain', 'localStorage access', 'sessionStorage access'];
    
    if (highRiskTypes.includes(operationType)) {
      return 'High';
    } else if (mediumRiskTypes.includes(operationType)) {
      return 'Medium';
    }
    return 'Low';
  }

  /**
   * Analyzes defensive coding practices
   */
  private analyzeDefensiveCoding(code: string): DefensiveCodingAssessment {
    const hasInputValidation = this.hasInputValidation(code);
    const hasNullChecks = this.hasNullChecks(code);
    const hasTypeGuards = this.hasTypeGuards(code);
    
    const practices: string[] = [];
    if (hasInputValidation) practices.push('input validation');
    if (hasNullChecks) practices.push('null/undefined checks');
    if (hasTypeGuards) practices.push('type guards');
    
    const description = practices.length > 0
      ? `Defensive coding practices found: ${practices.join(', ')}.`
      : 'Limited defensive coding practices observed.';
    
    return {
      hasInputValidation,
      hasNullChecks,
      hasTypeGuards,
      description,
    };
  }

  /**
   * Checks for input validation patterns
   */
  private hasInputValidation(code: string): boolean {
    const patterns = [
      /if\s*\(\s*!?\w+\s*[=!]==?\s*['"`]|typeof\s+\w+\s*[=!]==?\s*['"`]/,
      /\.length\s*[><=]/,
      /isNaN\s*\(/,
      /Number\.isFinite\s*\(/,
      /Array\.isArray\s*\(/,
      /instanceof\s+/,
      /\.test\s*\(/,  // Regex validation
      /\.match\s*\(/,
      /validate\w*\s*\(/i,
      /isValid\w*\s*\(/i,
    ];
    
    return patterns.some(p => p.test(code));
  }

  /**
   * Checks for null/undefined checks
   */
  private hasNullChecks(code: string): boolean {
    const patterns = [
      /[=!]==?\s*(null|undefined)/,
      /\?\./,  // Optional chaining
      /\?\?/,  // Nullish coalescing
      /if\s*\(\s*!?\w+\s*\)/,  // Truthy/falsy checks
      /\|\|\s*['"`\d\[\{]/,  // Default value with ||
    ];
    
    return patterns.some(p => p.test(code));
  }

  /**
   * Checks for type guards
   */
  private hasTypeGuards(code: string): boolean {
    const patterns = [
      /typeof\s+\w+\s*[=!]==?\s*['"`]/,
      /instanceof\s+/,
      /Array\.isArray\s*\(/,
      /is\w+\s*\([^)]+\)\s*:\s*\w+\s+is\s+/,  // TypeScript type guards
      /as\s+\w+/,  // Type assertions
    ];
    
    return patterns.some(p => p.test(code));
  }

  /**
   * Analyzes edge case handling
   */
  private analyzeEdgeCases(code: string): EdgeCaseAssessment {
    const handledCases: string[] = [];
    const unhandledCases: string[] = [];
    
    // Check for common edge case handling
    const edgeCasePatterns = [
      { pattern: /\.length\s*[=!]==?\s*0|\.length\s*<\s*1|isEmpty/i, case: 'empty array/string' },
      { pattern: /[=!]==?\s*(null|undefined)|[?][?.]/i, case: 'null/undefined values' },
      { pattern: /[=!]==?\s*['"`]['"`]|\.trim\(\)\s*[=!]==?\s*['"`]['"`]/i, case: 'empty string' },
      { pattern: /isNaN|Number\.isFinite|!isFinite/i, case: 'invalid numbers' },
      { pattern: /\.catch\s*\(|try\s*{/i, case: 'async errors' },
      { pattern: /default\s*:/i, case: 'switch default' },
      { pattern: /else\s*{/i, case: 'else branch' },
      { pattern: /\?\s*[^:]+\s*:\s*[^;]+/i, case: 'ternary fallback' },
    ];
    
    for (const { pattern, case: edgeCase } of edgeCasePatterns) {
      if (pattern.test(code)) {
        handledCases.push(edgeCase);
      }
    }
    
    // Common unhandled edge cases to check for
    const potentialEdgeCases = [
      'empty array/string',
      'null/undefined values',
      'empty string',
      'invalid numbers',
      'async errors',
    ];
    
    for (const edgeCase of potentialEdgeCases) {
      if (!handledCases.includes(edgeCase)) {
        // Only add if the code seems to need this handling
        if (this.codeNeedsEdgeCaseHandling(code, edgeCase)) {
          unhandledCases.push(edgeCase);
        }
      }
    }
    
    const description = handledCases.length > 0
      ? `Edge cases handled: ${handledCases.join(', ')}.`
      : 'Limited edge case handling observed.';
    
    return {
      handledCases,
      unhandledCases,
      description,
    };
  }

  /**
   * Checks if code needs specific edge case handling
   */
  private codeNeedsEdgeCaseHandling(code: string, edgeCase: string): boolean {
    switch (edgeCase) {
      case 'empty array/string':
        return /\.\w+\s*\(|\.length|\.map|\.filter|\.reduce/.test(code);
      case 'null/undefined values':
        return /\.\w+\s*\(|props\.|state\./.test(code);
      case 'invalid numbers':
        return /parseInt|parseFloat|Number\(|\.toFixed/.test(code);
      case 'async errors':
        return /await\s|\.then\s*\(|fetch\s*\(/.test(code);
      default:
        return false;
    }
  }

  /**
   * Detects programming language from file path
   */
  private detectLanguage(filePath: string): string {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      return 'typescript';
    }
    if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
      return 'javascript';
    }
    return 'javascript';
  }
}


// ============================================================================
// Reliability Code Examples Generator
// ============================================================================

/**
 * ReliabilityCodeExamplesGenerator - Generates code examples for reliability evaluation
 * 
 * Generates:
 * - Code examples showing good error handling (// GOOD: Error handling present)
 * - Code examples showing bad error handling (// BAD: No error handling)
 */
export class ReliabilityCodeExamplesGenerator {
  /**
   * Formats good error handling examples
   * 
   * @param instances - Array of error handling instances
   * @returns Formatted markdown string
   */
  formatGoodExamples(instances: ErrorHandlingInstance[]): string {
    if (instances.length === 0) {
      return 'No good error handling examples found.';
    }

    const sections: string[] = [];
    
    for (const instance of instances.slice(0, 3)) { // Limit to 3 examples
      const { evidence } = instance;
      const lines: string[] = [];
      lines.push('```' + evidence.language);
      lines.push(`// GOOD: ${instance.description}`);
      lines.push(`// Lines [${evidence.lineNumbers.start}-${evidence.lineNumbers.end}] from ${evidence.filePath}`);
      lines.push(evidence.codeSnippet);
      lines.push('```');
      sections.push(lines.join('\n'));
    }

    return sections.join('\n\n');
  }

  /**
   * Formats bad error handling examples (missing error handling)
   * 
   * @param gaps - Array of error handling gaps
   * @param filePath - File path for the examples
   * @param code - Source code to extract snippets
   * @returns Formatted markdown string
   */
  formatBadExamples(
    gaps: ErrorHandlingGap[],
    filePath: string,
    code: string
  ): string {
    if (gaps.length === 0) {
      return 'No missing error handling issues found.';
    }

    const lines = code.split('\n');
    const sections: string[] = [];
    const language = this.detectLanguage(filePath);
    
    for (const gap of gaps.slice(0, 3)) { // Limit to 3 examples
      const lineIndex = gap.location.line - 1;
      const snippet = lines[lineIndex]?.trim() || '';
      
      const exampleLines: string[] = [];
      exampleLines.push('```' + language);
      exampleLines.push(`// BAD: ${gap.scenario}`);
      exampleLines.push(`// Line ${gap.location.line} from ${filePath}`);
      exampleLines.push(`// Risk: ${gap.risk}`);
      exampleLines.push(snippet);
      exampleLines.push('```');
      sections.push(exampleLines.join('\n'));
    }

    return sections.join('\n\n');
  }

  /**
   * Formats all reliability code examples
   * 
   * @param instances - Good error handling instances
   * @param gaps - Missing error handling gaps
   * @param filePath - File path
   * @param code - Source code
   * @returns Complete formatted markdown section
   */
  formatAllExamples(
    instances: ErrorHandlingInstance[],
    gaps: ErrorHandlingGap[],
    filePath: string,
    code: string
  ): string {
    const sections: string[] = [];

    sections.push('**Code Examples:**\n');

    if (instances.length > 0) {
      sections.push('**Good Error Handling:**');
      sections.push(this.formatGoodExamples(instances));
    }

    if (gaps.length > 0) {
      sections.push('\n**Missing Error Handling:**');
      sections.push(this.formatBadExamples(gaps, filePath, code));
    }

    if (instances.length === 0 && gaps.length === 0) {
      sections.push('No specific error handling examples to highlight.');
    }

    return sections.join('\n');
  }

  /**
   * Detects programming language from file path
   */
  private detectLanguage(filePath: string): string {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      return 'typescript';
    }
    if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
      return 'javascript';
    }
    return 'javascript';
  }
}


// ============================================================================
// Error Handling Formatter
// ============================================================================

/**
 * ErrorHandlingFormatter - Formats error handling documentation
 * 
 * Generates formatted lists with appropriate markers:
 * - ✅ for present error handling
 * - ❌ for missing error handling with risk assessment
 */
export class ErrorHandlingFormatter {
  /**
   * Formats present error handling with checkmarks
   * 
   * @param instances - Array of error handling instances
   * @returns Formatted markdown string
   */
  static formatPresent(instances: ErrorHandlingInstance[]): string {
    if (instances.length === 0) {
      return '';
    }

    const header = '✅ **Present:**';
    const items = instances.map(inst => `- ${inst.description}`);
    return [header, ...items].join('\n');
  }

  /**
   * Formats missing error handling with cross marks and risk
   * 
   * @param gaps - Array of error handling gaps
   * @returns Formatted markdown string
   */
  static formatMissing(gaps: ErrorHandlingGap[]): string {
    if (gaps.length === 0) {
      return '';
    }

    const header = '❌ **Missing:**';
    const items = gaps.map(gap => {
      const riskIndicator = gap.risk === 'High' ? '🔴' : gap.risk === 'Medium' ? '🟡' : '🟢';
      return `- ${gap.scenario} (${riskIndicator} ${gap.risk} risk) - Line ${gap.location.line}`;
    });
    return [header, ...items].join('\n');
  }

  /**
   * Formats complete error handling analysis section
   * 
   * @param instances - Present error handling
   * @param gaps - Missing error handling
   * @returns Complete formatted markdown section
   */
  static formatErrorHandlingAnalysis(
    instances: ErrorHandlingInstance[],
    gaps: ErrorHandlingGap[]
  ): string {
    const sections: string[] = [];

    sections.push('**Error Handling Analysis:**\n');

    const present = this.formatPresent(instances);
    if (present) {
      sections.push(present);
    }

    const missing = this.formatMissing(gaps);
    if (missing) {
      sections.push(missing);
    }

    if (!present && !missing) {
      sections.push('No error handling patterns analyzed.');
    }

    return sections.join('\n\n');
  }
}


// ============================================================================
// Edge Case Analyzer
// ============================================================================

/**
 * EdgeCaseAnalyzer - Analyzes edge case handling in code
 * 
 * Assesses:
 * - How edge cases are handled
 * - Defensive coding practices
 * - Fallback mechanisms
 */
export class EdgeCaseAnalyzer {
  /**
   * Analyzes edge case handling in code
   * 
   * @param code - Source code to analyze
   * @param filePath - Path to the file
   * @returns Edge case assessment
   */
  analyze(code: string, filePath: string): EdgeCaseAssessment {
    const handledCases: string[] = [];
    const unhandledCases: string[] = [];
    
    // Check for various edge case handling patterns
    const edgeCaseChecks = [
      { check: this.checksEmptyArray(code), case: 'empty arrays' },
      { check: this.checksEmptyString(code), case: 'empty strings' },
      { check: this.checksNullUndefined(code), case: 'null/undefined' },
      { check: this.checksInvalidNumbers(code), case: 'invalid numbers' },
      { check: this.checksBoundaryConditions(code), case: 'boundary conditions' },
      { check: this.checksAsyncErrors(code), case: 'async errors' },
      { check: this.checksDefaultValues(code), case: 'default values' },
    ];
    
    for (const { check, case: edgeCase } of edgeCaseChecks) {
      if (check.handled) {
        handledCases.push(edgeCase);
      } else if (check.needed) {
        unhandledCases.push(edgeCase);
      }
    }
    
    const description = this.generateDescription(handledCases, unhandledCases);
    
    return {
      handledCases,
      unhandledCases,
      description,
    };
  }

  /**
   * Checks if code handles empty arrays
   */
  private checksEmptyArray(code: string): { handled: boolean; needed: boolean } {
    const needed = /\.map\s*\(|\.filter\s*\(|\.reduce\s*\(|\.forEach\s*\(|\.length/.test(code);
    const handled = /\.length\s*[=!]==?\s*0|\.length\s*[<>]|isEmpty|!?\w+\.length/.test(code);
    return { handled, needed };
  }

  /**
   * Checks if code handles empty strings
   */
  private checksEmptyString(code: string): { handled: boolean; needed: boolean } {
    const needed = /\.trim\s*\(|\.split\s*\(|\.substring|\.slice/.test(code);
    const handled = /[=!]==?\s*['"`]['"`]|\.trim\(\)\s*[=!]==?\s*['"`]['"`]|\.length\s*[=!><=]/.test(code);
    return { handled, needed };
  }

  /**
   * Checks if code handles null/undefined
   */
  private checksNullUndefined(code: string): { handled: boolean; needed: boolean } {
    const needed = /\.\w+\s*\(|props\.|state\.|data\./.test(code);
    const handled = /[=!]==?\s*(null|undefined)|\?\.|[?][?]|if\s*\(\s*!?\w+\s*\)/.test(code);
    return { handled, needed };
  }

  /**
   * Checks if code handles invalid numbers
   */
  private checksInvalidNumbers(code: string): { handled: boolean; needed: boolean } {
    const needed = /parseInt|parseFloat|Number\(|\.toFixed|Math\./.test(code);
    const handled = /isNaN|Number\.isFinite|!isFinite|typeof\s+\w+\s*[=!]==?\s*['"`]number['"`]/.test(code);
    return { handled, needed };
  }

  /**
   * Checks if code handles boundary conditions
   */
  private checksBoundaryConditions(code: string): { handled: boolean; needed: boolean } {
    const needed = /\[\s*\w+\s*\]|\.slice\s*\(|\.substring\s*\(/.test(code);
    const handled = /[<>]=?\s*\d+|Math\.min|Math\.max|clamp/.test(code);
    return { handled, needed };
  }

  /**
   * Checks if code handles async errors
   */
  private checksAsyncErrors(code: string): { handled: boolean; needed: boolean } {
    const needed = /await\s|\.then\s*\(|fetch\s*\(|axios\./.test(code);
    const handled = /\.catch\s*\(|try\s*{[\s\S]*?catch/.test(code);
    return { handled, needed };
  }

  /**
   * Checks if code provides default values
   */
  private checksDefaultValues(code: string): { handled: boolean; needed: boolean } {
    const needed = /function\s+\w+\s*\(|=>\s*{|const\s+\w+\s*=\s*\(/.test(code);
    const handled = /=\s*[^=]|[?][?]|\|\|/.test(code);
    return { handled, needed };
  }

  /**
   * Generates description for edge case assessment
   */
  private generateDescription(handled: string[], unhandled: string[]): string {
    const parts: string[] = [];
    
    if (handled.length > 0) {
      parts.push(`Edge cases handled: ${handled.join(', ')}.`);
    }
    
    if (unhandled.length > 0) {
      parts.push(`Potential unhandled edge cases: ${unhandled.join(', ')}.`);
    }
    
    if (parts.length === 0) {
      return 'Edge case handling analysis inconclusive.';
    }
    
    return parts.join(' ');
  }

  /**
   * Formats edge case assessment as checkboxes
   * 
   * @param assessment - Edge case assessment
   * @returns Formatted markdown checkbox list
   */
  formatAsCheckboxes(assessment: EdgeCaseAssessment): string {
    const allCases = [
      'empty arrays',
      'empty strings',
      'null/undefined',
      'invalid numbers',
      'boundary conditions',
      'async errors',
      'default values',
    ];
    
    return allCases
      .map(edgeCase => {
        const isHandled = assessment.handledCases.includes(edgeCase);
        const marker = isHandled ? '✅' : '❌';
        return `- [${isHandled ? 'x' : ' '}] ${marker} ${edgeCase}`;
      })
      .join('\n');
  }
}


// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets all valid reliability ratings
 */
export function getValidReliabilityRatings(): ReliabilityRatingString[] {
  return ['Low', 'Medium', 'High', 'Enterprise-Level'];
}

/**
 * Creates a default error handling analysis result
 */
export function createDefaultAnalysis(): ErrorHandlingAnalysisResult {
  return {
    totalRiskyOperations: 0,
    handledOperations: 0,
    presentHandling: [],
    missingHandling: [],
    defensiveCoding: {
      hasInputValidation: false,
      hasNullChecks: false,
      hasTypeGuards: false,
      description: 'No defensive coding practices analyzed.',
    },
    edgeCaseHandling: {
      handledCases: [],
      unhandledCases: [],
      description: 'No edge case handling analyzed.',
    },
  };
}

/**
 * Creates an error handling instance
 */
export function createErrorHandlingInstance(
  description: string,
  filePath: string,
  startLine: number,
  endLine: number,
  codeSnippet: string,
  language: string = 'javascript'
): ErrorHandlingInstance {
  return {
    description,
    evidence: {
      filePath,
      lineNumbers: { start: startLine, end: endLine },
      codeSnippet,
      language,
    },
  };
}

/**
 * Creates an error handling gap
 */
export function createErrorHandlingGap(
  scenario: string,
  file: string,
  line: number,
  risk: 'Low' | 'Medium' | 'High'
): ErrorHandlingGap {
  return {
    scenario,
    location: { file, line },
    risk,
  };
}

/**
 * Validates that a reliability evaluation has all required fields
 */
export function isValidReliabilityEvaluation(evaluation: ReliabilityEvaluation): boolean {
  const validRatings = getValidReliabilityRatings();
  
  return (
    validRatings.includes(evaluation.rating) &&
    Array.isArray(evaluation.presentErrorHandling) &&
    Array.isArray(evaluation.missingErrorHandling) &&
    typeof evaluation.defensiveCoding.hasInputValidation === 'boolean' &&
    typeof evaluation.defensiveCoding.hasNullChecks === 'boolean' &&
    typeof evaluation.defensiveCoding.hasTypeGuards === 'boolean' &&
    typeof evaluation.defensiveCoding.description === 'string' &&
    Array.isArray(evaluation.edgeCaseHandling.handledCases) &&
    Array.isArray(evaluation.edgeCaseHandling.unhandledCases) &&
    typeof evaluation.edgeCaseHandling.description === 'string' &&
    typeof evaluation.assessment === 'string' &&
    evaluation.assessment.length > 0
  );
}
