/**
 * DocumentationEvaluator - Evaluates documentation and comments (Dimension 3)
 * 
 * Analyzes JSDoc/TSDoc comments, inline comments, naming quality,
 * and generates assessments with justification.
 * 
 * @module DocumentationEvaluator
 */

import type {
  AtomicFeature,
  CodeEvidence,
  DocumentationRatingString,
} from '../../types/evaluation';
import type {
  DocumentationEvaluation,
  DocumentationCoverage,
  DocumentationExamples,
} from '../../types/dimensions';

/**
 * Configuration options for documentation evaluation
 */
export interface DocumentationEvaluatorOptions {
  /** Minimum JSDoc coverage percentage for Good rating (default: 50) */
  goodJSDocCoverage?: number;
  /** Minimum JSDoc coverage percentage for Excellent rating (default: 80) */
  excellentJSDocCoverage?: number;
  /** Minimum function name length for self-documenting (default: 3) */
  minFunctionNameLength?: number;
}

/**
 * Default configuration for documentation evaluation
 */
const DEFAULT_OPTIONS: Required<DocumentationEvaluatorOptions> = {
  goodJSDocCoverage: 50,
  excellentJSDocCoverage: 80,
  minFunctionNameLength: 3,
};

/**
 * Result of analyzing documentation coverage
 */
export interface DocumentationAnalysisResult {
  /** Total number of functions/methods found */
  totalFunctions: number;
  /** Number of functions with JSDoc/TSDoc */
  documentedFunctions: number;
  /** Number of complex code blocks with inline comments */
  commentedComplexBlocks: number;
  /** Total complex code blocks */
  totalComplexBlocks: number;
  /** Functions with self-documenting names */
  selfDocumentingFunctions: number;
  /** Whether usage examples exist */
  hasUsageExamples: boolean;
  /** Whether edge cases are documented */
  hasEdgeCaseDocs: boolean;
  /** Examples of good documentation */
  goodExamples: CodeEvidence[];
  /** Examples of missing documentation */
  missingExamples: CodeEvidence[];
}

/**
 * DocumentationEvaluator class for evaluating documentation quality
 * 
 * @example
 * ```typescript
 * const evaluator = new DocumentationEvaluator();
 * const analysis = evaluator.analyzeCode(code, filePath);
 * const evaluation = evaluator.evaluate(feature, analysis);
 * ```
 */
export class DocumentationEvaluator {
  private options: Required<DocumentationEvaluatorOptions>;

  constructor(options: DocumentationEvaluatorOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Evaluates the documentation quality of an atomic feature
   * 
   * @param feature - The atomic feature being evaluated
   * @param analysis - Results of documentation analysis
   * @returns Complete documentation evaluation
   */
  evaluate(
    feature: AtomicFeature,
    analysis: DocumentationAnalysisResult
  ): DocumentationEvaluation {
    // Build coverage assessment
    const coverage = this.buildCoverage(analysis);

    // Build examples
    const examples: DocumentationExamples = {
      goodDocumentation: analysis.goodExamples,
      missingDocumentation: analysis.missingExamples,
    };

    // Determine rating
    const rating = this.determineRating(coverage, analysis);

    // Generate assessment
    const assessment = this.generateAssessment(feature, rating, coverage, analysis);

    return {
      rating,
      coverage,
      examples,
      assessment,
    };
  }

  /**
   * Builds documentation coverage from analysis results
   */
  private buildCoverage(analysis: DocumentationAnalysisResult): DocumentationCoverage {
    const jsDocCoverage = analysis.totalFunctions > 0
      ? (analysis.documentedFunctions / analysis.totalFunctions) * 100
      : 0;

    const inlineCommentCoverage = analysis.totalComplexBlocks > 0
      ? (analysis.commentedComplexBlocks / analysis.totalComplexBlocks) * 100
      : 100; // If no complex blocks, consider it covered

    const selfDocCoverage = analysis.totalFunctions > 0
      ? (analysis.selfDocumentingFunctions / analysis.totalFunctions) * 100
      : 0;

    return {
      hasJSDoc: jsDocCoverage >= 50,
      hasInlineComments: inlineCommentCoverage >= 50,
      hasSelfDocumentingNames: selfDocCoverage >= 70,
      hasUsageExamples: analysis.hasUsageExamples,
      hasEdgeCaseDocs: analysis.hasEdgeCaseDocs,
    };
  }

  /**
   * Determines the documentation rating based on coverage
   * 
   * @param coverage - Documentation coverage assessment
   * @param analysis - Full analysis results
   * @returns Documentation rating string
   */
  determineRating(
    coverage: DocumentationCoverage,
    analysis: DocumentationAnalysisResult
  ): DocumentationRatingString {
    // Calculate a score based on coverage
    let score = 0;

    // JSDoc/TSDoc coverage (40 points max)
    if (analysis.totalFunctions > 0) {
      const jsDocPercent = (analysis.documentedFunctions / analysis.totalFunctions) * 100;
      score += Math.min(40, jsDocPercent * 0.4);
    }

    // Inline comments (20 points max)
    if (coverage.hasInlineComments) {
      score += 20;
    }

    // Self-documenting names (20 points max)
    if (coverage.hasSelfDocumentingNames) {
      score += 20;
    }

    // Usage examples (10 points)
    if (coverage.hasUsageExamples) {
      score += 10;
    }

    // Edge case documentation (10 points)
    if (coverage.hasEdgeCaseDocs) {
      score += 10;
    }

    // Convert score to rating
    if (score >= 80) {
      return 'Excellent';
    } else if (score >= 50) {
      return 'Good';
    } else if (score >= 20) {
      return 'Basic';
    } else {
      return 'None';
    }
  }

  /**
   * Generates a detailed assessment explaining the rating
   */
  generateAssessment(
    feature: AtomicFeature,
    rating: DocumentationRatingString,
    coverage: DocumentationCoverage,
    analysis: DocumentationAnalysisResult
  ): string {
    const parts: string[] = [];

    // Opening statement
    parts.push(`The ${feature.name} feature has ${rating.toLowerCase()} documentation quality.`);

    // JSDoc coverage
    if (analysis.totalFunctions > 0) {
      const jsDocPercent = Math.round((analysis.documentedFunctions / analysis.totalFunctions) * 100);
      parts.push(`JSDoc/TSDoc coverage: ${jsDocPercent}% (${analysis.documentedFunctions}/${analysis.totalFunctions} functions).`);
    }

    // Coverage details
    const coverageItems: string[] = [];
    if (coverage.hasJSDoc) coverageItems.push('JSDoc comments');
    if (coverage.hasInlineComments) coverageItems.push('inline comments');
    if (coverage.hasSelfDocumentingNames) coverageItems.push('self-documenting names');
    if (coverage.hasUsageExamples) coverageItems.push('usage examples');
    if (coverage.hasEdgeCaseDocs) coverageItems.push('edge case documentation');

    if (coverageItems.length > 0) {
      parts.push(`Present: ${coverageItems.join(', ')}.`);
    }

    // Missing items
    const missingItems: string[] = [];
    if (!coverage.hasJSDoc) missingItems.push('JSDoc comments');
    if (!coverage.hasInlineComments) missingItems.push('inline comments');
    if (!coverage.hasSelfDocumentingNames) missingItems.push('self-documenting names');
    if (!coverage.hasUsageExamples) missingItems.push('usage examples');
    if (!coverage.hasEdgeCaseDocs) missingItems.push('edge case documentation');

    if (missingItems.length > 0) {
      parts.push(`Missing: ${missingItems.join(', ')}.`);
    }

    // Rating-specific recommendations
    switch (rating) {
      case 'Excellent':
        parts.push('Documentation is comprehensive and well-maintained.');
        break;
      case 'Good':
        parts.push('Documentation covers most important aspects with room for improvement.');
        break;
      case 'Basic':
        parts.push('Documentation exists but is incomplete. Consider adding more JSDoc comments and examples.');
        break;
      case 'None':
        parts.push('Documentation is severely lacking. Adding JSDoc comments and inline explanations is recommended.');
        break;
    }

    return parts.join(' ');
  }

  /**
   * Validates that a rating is one of the valid documentation ratings
   * 
   * @param rating - The rating to validate
   * @returns True if the rating is valid
   */
  isValidRating(rating: string): rating is DocumentationRatingString {
    return ['None', 'Basic', 'Good', 'Excellent'].includes(rating);
  }

  /**
   * Gets the configuration options
   */
  getOptions(): Required<DocumentationEvaluatorOptions> {
    return { ...this.options };
  }
}


// ============================================================================
// Documentation Coverage Checker
// ============================================================================

/**
 * DocumentationCoverageChecker - Checks documentation coverage
 * 
 * Generates checkboxes for documentation coverage:
 * - [ ] JSDoc/TSDoc comments on feature functions
 * - [ ] Inline comments explaining complex logic
 * - [ ] Self-documenting variable/function names
 * - [ ] Usage examples
 * - [ ] Edge cases documented
 */
export class DocumentationCoverageChecker {
  private options: Required<DocumentationEvaluatorOptions>;

  constructor(options: DocumentationEvaluatorOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Analyzes code for documentation coverage
   * 
   * @param code - Source code to analyze
   * @param filePath - Path to the file
   * @returns Documentation analysis result
   */
  analyze(code: string, filePath: string): DocumentationAnalysisResult {
    const lines = code.split('\n');
    
    // Analyze JSDoc coverage
    const jsDocAnalysis = this.analyzeJSDoc(code, filePath);
    
    // Analyze inline comments
    const inlineAnalysis = this.analyzeInlineComments(code, filePath);
    
    // Analyze naming quality
    const namingAnalysis = this.analyzeNaming(code);
    
    // Check for usage examples
    const hasUsageExamples = this.hasUsageExamples(code);
    
    // Check for edge case documentation
    const hasEdgeCaseDocs = this.hasEdgeCaseDocs(code);

    return {
      totalFunctions: jsDocAnalysis.totalFunctions,
      documentedFunctions: jsDocAnalysis.documentedFunctions,
      commentedComplexBlocks: inlineAnalysis.commentedBlocks,
      totalComplexBlocks: inlineAnalysis.totalComplexBlocks,
      selfDocumentingFunctions: namingAnalysis.selfDocumentingCount,
      hasUsageExamples,
      hasEdgeCaseDocs,
      goodExamples: [...jsDocAnalysis.goodExamples, ...inlineAnalysis.goodExamples],
      missingExamples: [...jsDocAnalysis.missingExamples, ...inlineAnalysis.missingExamples],
    };
  }

  /**
   * Analyzes JSDoc/TSDoc coverage
   */
  private analyzeJSDoc(code: string, filePath: string): {
    totalFunctions: number;
    documentedFunctions: number;
    goodExamples: CodeEvidence[];
    missingExamples: CodeEvidence[];
  } {
    const lines = code.split('\n');
    let totalFunctions = 0;
    let documentedFunctions = 0;
    const goodExamples: CodeEvidence[] = [];
    const missingExamples: CodeEvidence[] = [];

    // Pattern to match function declarations
    const functionPatterns = [
      /^(export\s+)?(async\s+)?function\s+(\w+)/,
      /^(export\s+)?const\s+(\w+)\s*=\s*(async\s+)?\([^)]*\)\s*=>/,
      /^(export\s+)?const\s+(\w+)\s*=\s*(async\s+)?function/,
      /^\s*(async\s+)?(\w+)\s*\([^)]*\)\s*{/,  // Method in class
    ];

    // Pattern to match JSDoc comments
    const jsDocPattern = /\/\*\*[\s\S]*?\*\//;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (const pattern of functionPatterns) {
        const match = line.match(pattern);
        if (match) {
          totalFunctions++;
          
          // Check if there's a JSDoc comment before this function
          const prevLines = lines.slice(Math.max(0, i - 10), i).join('\n');
          const hasJSDoc = jsDocPattern.test(prevLines);
          
          if (hasJSDoc) {
            documentedFunctions++;
            // Find the JSDoc comment
            const jsDocMatch = prevLines.match(/\/\*\*[\s\S]*?\*\/\s*$/);
            if (jsDocMatch) {
              goodExamples.push({
                filePath,
                lineNumbers: { start: Math.max(1, i - 5), end: i + 1 },
                codeSnippet: jsDocMatch[0] + '\n' + line,
                language: this.detectLanguage(filePath),
              });
            }
          } else {
            missingExamples.push({
              filePath,
              lineNumbers: { start: i + 1, end: i + 1 },
              codeSnippet: line.trim(),
              language: this.detectLanguage(filePath),
            });
          }
          break;
        }
      }
    }

    return { totalFunctions, documentedFunctions, goodExamples, missingExamples };
  }

  /**
   * Analyzes inline comments for complex code blocks
   */
  private analyzeInlineComments(code: string, filePath: string): {
    totalComplexBlocks: number;
    commentedBlocks: number;
    goodExamples: CodeEvidence[];
    missingExamples: CodeEvidence[];
  } {
    const lines = code.split('\n');
    let totalComplexBlocks = 0;
    let commentedBlocks = 0;
    const goodExamples: CodeEvidence[] = [];
    const missingExamples: CodeEvidence[] = [];

    // Patterns indicating complex code that should have comments
    const complexPatterns = [
      /if\s*\([^)]+&&[^)]+\)/,  // Complex conditions
      /\?\s*[^:]+\s*:\s*[^;]+\s*\?\s*/,  // Nested ternary
      /\.reduce\s*\(/,  // Reduce operations
      /\.map\s*\([^)]*=>[^)]*\.[^)]*\)/,  // Complex map
      /for\s*\([^)]+;[^)]+;[^)]+\)\s*{[\s\S]*?for\s*\(/,  // Nested loops
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (const pattern of complexPatterns) {
        if (pattern.test(line)) {
          totalComplexBlocks++;
          
          // Check if there's a comment nearby (within 2 lines before)
          const prevLines = lines.slice(Math.max(0, i - 2), i).join('\n');
          const hasComment = /\/\/|\/\*/.test(prevLines);
          
          if (hasComment) {
            commentedBlocks++;
            goodExamples.push({
              filePath,
              lineNumbers: { start: Math.max(1, i), end: i + 1 },
              codeSnippet: lines.slice(Math.max(0, i - 1), i + 1).join('\n'),
              language: this.detectLanguage(filePath),
            });
          } else {
            missingExamples.push({
              filePath,
              lineNumbers: { start: i + 1, end: i + 1 },
              codeSnippet: line.trim(),
              language: this.detectLanguage(filePath),
            });
          }
          break;
        }
      }
    }

    return { totalComplexBlocks, commentedBlocks, goodExamples, missingExamples };
  }

  /**
   * Analyzes naming quality for self-documenting code
   */
  private analyzeNaming(code: string): {
    selfDocumentingCount: number;
    totalNames: number;
  } {
    let selfDocumentingCount = 0;
    let totalNames = 0;

    // Pattern to extract function and variable names
    const namePatterns = [
      /(?:function|const|let|var)\s+(\w+)/g,
      /(\w+)\s*\([^)]*\)\s*{/g,
    ];

    // Words that indicate good naming
    const goodNameIndicators = [
      /^(get|set|is|has|can|should|will|did|handle|on|create|update|delete|fetch|load|save|validate|format|parse|render|display|show|hide|toggle|enable|disable)/i,
      /[A-Z][a-z]+[A-Z]/,  // camelCase with multiple words
    ];

    for (const pattern of namePatterns) {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        const name = match[1];
        if (name && name.length >= this.options.minFunctionNameLength) {
          totalNames++;
          
          // Check if name is self-documenting
          const isSelfDocumenting = goodNameIndicators.some(indicator => 
            indicator.test(name)
          ) || name.length >= 8; // Longer names tend to be more descriptive
          
          if (isSelfDocumenting) {
            selfDocumentingCount++;
          }
        }
      }
    }

    return { selfDocumentingCount, totalNames };
  }

  /**
   * Checks if code contains usage examples
   */
  private hasUsageExamples(code: string): boolean {
    const examplePatterns = [
      /@example/i,
      /\*\s*Example:/i,
      /\/\/\s*Example:/i,
      /\/\/\s*Usage:/i,
      /```[\s\S]*?```/,  // Code blocks in comments
    ];

    return examplePatterns.some(pattern => pattern.test(code));
  }

  /**
   * Checks if code documents edge cases
   */
  private hasEdgeCaseDocs(code: string): boolean {
    const edgeCasePatterns = [
      /edge\s*case/i,
      /corner\s*case/i,
      /special\s*case/i,
      /boundary/i,
      /empty\s*(array|string|object|input)/i,
      /null|undefined/i,
      /@throws/i,
      /error\s*handling/i,
    ];

    return edgeCasePatterns.some(pattern => pattern.test(code));
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

  /**
   * Formats coverage as checkbox list
   * 
   * @param coverage - Documentation coverage assessment
   * @returns Formatted markdown checkbox list
   */
  formatAsCheckboxes(coverage: DocumentationCoverage): string {
    const checkboxes = [
      {
        checked: coverage.hasJSDoc,
        label: 'JSDoc/TSDoc comments on feature functions',
      },
      {
        checked: coverage.hasInlineComments,
        label: 'Inline comments explaining complex logic',
      },
      {
        checked: coverage.hasSelfDocumentingNames,
        label: 'Self-documenting variable/function names',
      },
      {
        checked: coverage.hasUsageExamples,
        label: 'Usage examples',
      },
      {
        checked: coverage.hasEdgeCaseDocs,
        label: 'Edge cases documented',
      },
    ];

    return checkboxes
      .map(cb => `- [${cb.checked ? 'x' : ' '}] ${cb.label}`)
      .join('\n');
  }

  /**
   * Validates that coverage has all required boolean fields
   * 
   * @param coverage - The coverage to validate
   * @returns True if valid
   */
  isValidCoverage(coverage: DocumentationCoverage): boolean {
    return (
      typeof coverage.hasJSDoc === 'boolean' &&
      typeof coverage.hasInlineComments === 'boolean' &&
      typeof coverage.hasSelfDocumentingNames === 'boolean' &&
      typeof coverage.hasUsageExamples === 'boolean' &&
      typeof coverage.hasEdgeCaseDocs === 'boolean'
    );
  }
}


// ============================================================================
// Documentation Examples Generator
// ============================================================================

/**
 * DocumentationExamplesGenerator - Generates code examples showing documentation quality
 * 
 * Generates:
 * - Code examples showing good documentation found (// FOUND: Good documentation)
 * - Code examples showing missing documentation (// MISSING: No explanation)
 */
export class DocumentationExamplesGenerator {
  /**
   * Formats good documentation examples
   * 
   * @param examples - Array of good documentation examples
   * @returns Formatted markdown string
   */
  formatGoodExamples(examples: CodeEvidence[]): string {
    if (examples.length === 0) {
      return 'No good documentation examples found.';
    }

    const sections: string[] = [];
    
    for (const example of examples.slice(0, 3)) { // Limit to 3 examples
      const lines: string[] = [];
      lines.push('```' + example.language);
      lines.push(`// FOUND: Good documentation`);
      lines.push(`// Lines [${example.lineNumbers.start}-${example.lineNumbers.end}] from ${example.filePath}`);
      lines.push(example.codeSnippet);
      lines.push('```');
      sections.push(lines.join('\n'));
    }

    return sections.join('\n\n');
  }

  /**
   * Formats missing documentation examples
   * 
   * @param examples - Array of missing documentation examples
   * @returns Formatted markdown string
   */
  formatMissingExamples(examples: CodeEvidence[]): string {
    if (examples.length === 0) {
      return 'No missing documentation issues found.';
    }

    const sections: string[] = [];
    
    for (const example of examples.slice(0, 3)) { // Limit to 3 examples
      const lines: string[] = [];
      lines.push('```' + example.language);
      lines.push(`// MISSING: No explanation`);
      lines.push(`// Lines [${example.lineNumbers.start}-${example.lineNumbers.end}] from ${example.filePath}`);
      lines.push(example.codeSnippet);
      lines.push('```');
      sections.push(lines.join('\n'));
    }

    return sections.join('\n\n');
  }

  /**
   * Formats all documentation examples
   * 
   * @param examples - Documentation examples (good and missing)
   * @returns Complete formatted markdown section
   */
  formatAllExamples(examples: DocumentationExamples): string {
    const sections: string[] = [];

    sections.push('**Examples:**\n');

    if (examples.goodDocumentation.length > 0) {
      sections.push(this.formatGoodExamples(examples.goodDocumentation));
    }

    if (examples.missingDocumentation.length > 0) {
      sections.push(this.formatMissingExamples(examples.missingDocumentation));
    }

    if (examples.goodDocumentation.length === 0 && examples.missingDocumentation.length === 0) {
      sections.push('No specific documentation examples to highlight.');
    }

    return sections.join('\n\n');
  }

  /**
   * Creates a code evidence for a documented function
   * 
   * @param filePath - Path to the file
   * @param startLine - Starting line number
   * @param endLine - Ending line number
   * @param snippet - Code snippet
   * @param language - Programming language
   * @returns CodeEvidence object
   */
  createGoodExample(
    filePath: string,
    startLine: number,
    endLine: number,
    snippet: string,
    language: string = 'javascript'
  ): CodeEvidence {
    return {
      filePath,
      lineNumbers: { start: startLine, end: endLine },
      codeSnippet: snippet,
      language,
    };
  }

  /**
   * Creates a code evidence for an undocumented function
   * 
   * @param filePath - Path to the file
   * @param line - Line number
   * @param snippet - Code snippet
   * @param language - Programming language
   * @returns CodeEvidence object
   */
  createMissingExample(
    filePath: string,
    line: number,
    snippet: string,
    language: string = 'javascript'
  ): CodeEvidence {
    return {
      filePath,
      lineNumbers: { start: line, end: line },
      codeSnippet: snippet,
      language,
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets all valid documentation ratings
 */
export function getValidDocumentationRatings(): DocumentationRatingString[] {
  return ['None', 'Basic', 'Good', 'Excellent'];
}

/**
 * Creates a default documentation analysis result
 */
export function createDefaultAnalysis(): DocumentationAnalysisResult {
  return {
    totalFunctions: 0,
    documentedFunctions: 0,
    commentedComplexBlocks: 0,
    totalComplexBlocks: 0,
    selfDocumentingFunctions: 0,
    hasUsageExamples: false,
    hasEdgeCaseDocs: false,
    goodExamples: [],
    missingExamples: [],
  };
}

/**
 * Creates a documentation coverage object
 */
export function createDocumentationCoverage(
  hasJSDoc: boolean,
  hasInlineComments: boolean,
  hasSelfDocumentingNames: boolean,
  hasUsageExamples: boolean,
  hasEdgeCaseDocs: boolean
): DocumentationCoverage {
  return {
    hasJSDoc,
    hasInlineComments,
    hasSelfDocumentingNames,
    hasUsageExamples,
    hasEdgeCaseDocs,
  };
}

/**
 * Validates that a documentation evaluation has all required fields
 */
export function isValidDocumentationEvaluation(evaluation: DocumentationEvaluation): boolean {
  const validRatings = getValidDocumentationRatings();
  
  return (
    validRatings.includes(evaluation.rating) &&
    typeof evaluation.coverage.hasJSDoc === 'boolean' &&
    typeof evaluation.coverage.hasInlineComments === 'boolean' &&
    typeof evaluation.coverage.hasSelfDocumentingNames === 'boolean' &&
    typeof evaluation.coverage.hasUsageExamples === 'boolean' &&
    typeof evaluation.coverage.hasEdgeCaseDocs === 'boolean' &&
    Array.isArray(evaluation.examples.goodDocumentation) &&
    Array.isArray(evaluation.examples.missingDocumentation) &&
    typeof evaluation.assessment === 'string' &&
    evaluation.assessment.length > 0
  );
}
