/**
 * PerformanceEvaluator - Evaluates performance and efficiency (Dimension 5)
 * 
 * Analyzes algorithmic complexity, re-render patterns, and optimization techniques.
 * Generates assessments with justification.
 * 
 * @module PerformanceEvaluator
 */

import type {
  AtomicFeature,
  CodeEvidence,
  PerformanceRatingString,
} from '../../types/evaluation';
import type {
  PerformanceEvaluation,
  PerformanceConcern,
  OptimizationFound,
  ComplexityAnalysis,
  ReRenderAnalysis,
} from '../../types/dimensions';

/**
 * Configuration options for performance evaluation
 */
export interface PerformanceEvaluatorOptions {
  /** Minimum score for Acceptable rating (default: 30) */
  acceptableMinScore?: number;
  /** Minimum score for Good rating (default: 60) */
  goodMinScore?: number;
  /** Minimum score for Excellent rating (default: 85) */
  excellentMinScore?: number;
}

/**
 * Default configuration for performance evaluation
 */
const DEFAULT_OPTIONS: Required<PerformanceEvaluatorOptions> = {
  acceptableMinScore: 30,
  goodMinScore: 60,
  excellentMinScore: 85,
};

/**
 * Result of analyzing performance in code
 */
export interface PerformanceAnalysisResult {
  /** List of performance concerns */
  concerns: PerformanceConcern[];
  /** List of found optimizations */
  optimizations: OptimizationFound[];
  /** Complexity analysis */
  complexityAnalysis: ComplexityAnalysis;
  /** Re-render analysis */
  reRenderAnalysis: ReRenderAnalysis;
}

/**
 * PerformanceEvaluator class for evaluating performance and efficiency
 * 
 * @example
 * ```typescript
 * const evaluator = new PerformanceEvaluator();
 * const analysis = evaluator.analyzeCode(code, filePath);
 * const evaluation = evaluator.evaluate(feature, analysis);
 * ```
 */
export class PerformanceEvaluator {
  private options: Required<PerformanceEvaluatorOptions>;

  constructor(options: PerformanceEvaluatorOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Evaluates the performance of an atomic feature
   * 
   * @param feature - The atomic feature being evaluated
   * @param analysis - Results of performance analysis
   * @returns Complete performance evaluation
   */
  evaluate(
    feature: AtomicFeature,
    analysis: PerformanceAnalysisResult
  ): PerformanceEvaluation {
    const rating = this.determineRating(analysis);
    const assessment = this.generateAssessment(feature, rating, analysis);

    return {
      rating,
      concerns: analysis.concerns,
      optimizations: analysis.optimizations,
      complexityAnalysis: analysis.complexityAnalysis,
      reRenderAnalysis: analysis.reRenderAnalysis,
      assessment,
    };
  }

  /**
   * Determines the performance rating based on analysis results
   * 
   * @param analysis - Performance analysis results
   * @returns Performance rating string
   */
  determineRating(analysis: PerformanceAnalysisResult): PerformanceRatingString {
    let score = 100;

    // Deduct points for concerns based on severity
    for (const concern of analysis.concerns) {
      if (concern.impact.toLowerCase().includes('critical') || 
          concern.impact.toLowerCase().includes('severe')) {
        score -= 25;
      } else if (concern.impact.toLowerCase().includes('significant') ||
                 concern.impact.toLowerCase().includes('major')) {
        score -= 15;
      } else {
        score -= 10;
      }
    }

    // Deduct for poor complexity
    if (analysis.complexityAnalysis.algorithmicComplexity.includes('O(n³)') ||
        analysis.complexityAnalysis.algorithmicComplexity.includes('O(n^3)')) {
      score -= 30;
    } else if (analysis.complexityAnalysis.algorithmicComplexity.includes('O(n²)') ||
               analysis.complexityAnalysis.algorithmicComplexity.includes('O(n^2)')) {
      score -= 20;
    }

    // Deduct for re-render issues
    if (analysis.reRenderAnalysis.hasUnnecessaryReRenders) {
      score -= analysis.reRenderAnalysis.issues.length * 10;
    }

    // Add points for optimizations
    score += analysis.optimizations.length * 5;

    // Clamp score to 0-100
    score = Math.max(0, Math.min(100, score));

    // Convert score to rating
    if (score >= this.options.excellentMinScore) {
      return 'Excellent';
    } else if (score >= this.options.goodMinScore) {
      return 'Good';
    } else if (score >= this.options.acceptableMinScore) {
      return 'Acceptable';
    } else {
      return 'Poor';
    }
  }

  /**
   * Generates a detailed assessment explaining the rating
   */
  generateAssessment(
    feature: AtomicFeature,
    rating: PerformanceRatingString,
    analysis: PerformanceAnalysisResult
  ): string {
    const parts: string[] = [];

    parts.push(`The ${feature.name} feature has ${rating.toLowerCase()} performance.`);

    // Complexity analysis
    if (analysis.complexityAnalysis.algorithmicComplexity !== 'O(1)') {
      parts.push(`Algorithmic complexity: ${analysis.complexityAnalysis.algorithmicComplexity}.`);
    }

    if (analysis.complexityAnalysis.loopAnalysis) {
      parts.push(analysis.complexityAnalysis.loopAnalysis);
    }

    // Concerns
    if (analysis.concerns.length > 0) {
      parts.push(`Performance concerns: ${analysis.concerns.length} issue(s) identified.`);
    }

    // Re-render analysis
    if (analysis.reRenderAnalysis.hasUnnecessaryReRenders) {
      parts.push(`Re-render issues: ${analysis.reRenderAnalysis.issues.length} potential unnecessary re-render(s) detected.`);
    }

    // Optimizations
    if (analysis.optimizations.length > 0) {
      const techniques = analysis.optimizations.map(o => o.technique).join(', ');
      parts.push(`Optimizations found: ${techniques}.`);
    }

    // Rating-specific recommendations
    switch (rating) {
      case 'Excellent':
        parts.push('Code demonstrates excellent performance practices with proper optimizations.');
        break;
      case 'Good':
        parts.push('Good performance with minor optimization opportunities.');
        break;
      case 'Acceptable':
        parts.push('Performance is acceptable but could benefit from optimization.');
        break;
      case 'Poor':
        parts.push('Performance issues detected. Consider optimizing loops, adding memoization, and reducing re-renders.');
        break;
    }

    return parts.join(' ');
  }

  /**
   * Validates that a rating is one of the valid performance ratings
   */
  isValidRating(rating: string): rating is PerformanceRatingString {
    return ['Poor', 'Acceptable', 'Good', 'Excellent'].includes(rating);
  }

  /**
   * Gets the configuration options
   */
  getOptions(): Required<PerformanceEvaluatorOptions> {
    return { ...this.options };
  }
}



// ============================================================================
// Performance Concern Documenter
// ============================================================================

/**
 * PerformanceConcernDocumenter - Documents performance concerns
 * 
 * Generates numbered concerns with:
 * - Code snippet with file and line numbers
 * - Issue description
 * - Impact description
 * - Fix recommendation
 */
export class PerformanceConcernDocumenter {
  /**
   * Formats a single performance concern
   * 
   * @param concern - The performance concern to format
   * @returns Formatted markdown string
   */
  formatConcern(concern: PerformanceConcern): string {
    const lines: string[] = [];
    
    lines.push(`**#${concern.id}: ${concern.issue}**`);
    lines.push('```' + concern.evidence.language);
    lines.push(`// Lines [${concern.evidence.lineNumbers.start}-${concern.evidence.lineNumbers.end}] from ${concern.evidence.filePath}`);
    lines.push(concern.evidence.codeSnippet);
    lines.push('```');
    lines.push(`- **Issue:** ${concern.issue}`);
    lines.push(`- **Impact:** ${concern.impact}`);
    lines.push(`- **Fix:** ${concern.recommendedFix}`);
    
    return lines.join('\n');
  }

  /**
   * Formats all performance concerns
   * 
   * @param concerns - Array of performance concerns
   * @returns Formatted markdown string
   */
  formatAllConcerns(concerns: PerformanceConcern[]): string {
    if (concerns.length === 0) {
      return 'No performance concerns identified.';
    }

    const sections: string[] = [];
    sections.push('**Performance Concerns Identified:**\n');
    
    for (const concern of concerns) {
      sections.push(this.formatConcern(concern));
    }
    
    return sections.join('\n\n');
  }
}


// ============================================================================
// Complexity Analyzer
// ============================================================================

/**
 * ComplexityAnalyzer - Analyzes algorithmic complexity in code
 * 
 * Detects:
 * - O(n), O(n²), O(n³) patterns in loops
 * - Nested loops and their complexity
 */
export class ComplexityAnalyzer {
  /**
   * Analyzes code for algorithmic complexity
   * 
   * @param code - Source code to analyze
   * @param filePath - Path to the file
   * @returns Complexity analysis result
   */
  analyze(code: string, filePath: string): ComplexityAnalysis {
    const lines = code.split('\n');
    const loopInfo = this.findLoops(lines);
    
    const maxNesting = this.calculateMaxNesting(loopInfo);
    const algorithmicComplexity = this.determineComplexity(maxNesting);
    const loopAnalysis = this.generateLoopAnalysis(loopInfo, maxNesting);
    
    return {
      algorithmicComplexity,
      loopAnalysis,
    };
  }

  /**
   * Finds all loops in the code
   */
  private findLoops(lines: string[]): Array<{ line: number; type: string; depth: number }> {
    const loops: Array<{ line: number; type: string; depth: number }> = [];
    let currentDepth = 0;
    
    const loopPatterns = [
      { pattern: /\bfor\s*\(/, type: 'for' },
      { pattern: /\bwhile\s*\(/, type: 'while' },
      { pattern: /\bdo\s*{/, type: 'do-while' },
      { pattern: /\.forEach\s*\(/, type: 'forEach' },
      { pattern: /\.map\s*\(/, type: 'map' },
      { pattern: /\.filter\s*\(/, type: 'filter' },
      { pattern: /\.reduce\s*\(/, type: 'reduce' },
      { pattern: /\.find\s*\(/, type: 'find' },
      { pattern: /\.some\s*\(/, type: 'some' },
      { pattern: /\.every\s*\(/, type: 'every' },
      { pattern: /for\s*\.\.\.\s*of/, type: 'for-of' },
      { pattern: /for\s*\.\.\.\s*in/, type: 'for-in' },
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Track brace depth for nesting
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      
      for (const { pattern, type } of loopPatterns) {
        if (pattern.test(line)) {
          loops.push({
            line: i + 1,
            type,
            depth: currentDepth,
          });
          break;
        }
      }
      
      currentDepth += openBraces - closeBraces;
    }
    
    return loops;
  }

  /**
   * Calculates maximum nesting level of loops
   */
  private calculateMaxNesting(loops: Array<{ line: number; type: string; depth: number }>): number {
    if (loops.length === 0) return 0;
    
    // Group loops by their depth to find nested loops
    let maxNesting = 1;
    
    for (let i = 0; i < loops.length; i++) {
      let nesting = 1;
      const baseDepth = loops[i].depth;
      
      // Look for loops at deeper depths that follow this one
      for (let j = i + 1; j < loops.length; j++) {
        if (loops[j].depth > baseDepth) {
          nesting++;
        } else if (loops[j].depth <= baseDepth) {
          break;
        }
      }
      
      maxNesting = Math.max(maxNesting, nesting);
    }
    
    return maxNesting;
  }

  /**
   * Determines algorithmic complexity based on nesting
   */
  private determineComplexity(maxNesting: number): string {
    if (maxNesting === 0) return 'O(1)';
    if (maxNesting === 1) return 'O(n)';
    if (maxNesting === 2) return 'O(n²)';
    if (maxNesting >= 3) return 'O(n³)';
    return 'O(n)';
  }

  /**
   * Generates loop analysis description
   */
  private generateLoopAnalysis(
    loops: Array<{ line: number; type: string; depth: number }>,
    maxNesting: number
  ): string {
    if (loops.length === 0) {
      return 'No loops detected in the code.';
    }
    
    const loopTypes = [...new Set(loops.map(l => l.type))];
    const parts: string[] = [];
    
    parts.push(`Found ${loops.length} loop(s) using: ${loopTypes.join(', ')}.`);
    
    if (maxNesting > 1) {
      parts.push(`Maximum nesting depth: ${maxNesting} levels.`);
      if (maxNesting >= 3) {
        parts.push('Warning: Deep nesting may cause performance issues with large datasets.');
      }
    }
    
    return parts.join(' ');
  }
}


// ============================================================================
// Re-Render Detector
// ============================================================================

/**
 * ReRenderDetector - Detects unnecessary re-renders in React code
 * 
 * Detects:
 * - useEffect without debouncing
 * - Missing memoization (useMemo, useCallback, React.memo)
 * - State updates that cause unnecessary re-renders
 */
export class ReRenderDetector {
  /**
   * Analyzes code for re-render issues
   * 
   * @param code - Source code to analyze
   * @param filePath - Path to the file
   * @returns Re-render analysis result
   */
  analyze(code: string, filePath: string): ReRenderAnalysis {
    const issues: string[] = [];
    
    // Check for useEffect without debouncing
    if (this.hasUseEffectWithoutDebounce(code)) {
      issues.push('useEffect without debouncing may cause excessive re-renders');
    }
    
    // Check for inline object/array creation in JSX
    if (this.hasInlineObjectsInJSX(code)) {
      issues.push('Inline object/array creation in JSX causes re-renders on every render');
    }
    
    // Check for missing useCallback on event handlers
    if (this.hasMissingUseCallback(code)) {
      issues.push('Event handlers without useCallback may cause child component re-renders');
    }
    
    // Check for missing useMemo on expensive computations
    if (this.hasMissingUseMemo(code)) {
      issues.push('Expensive computations without useMemo may cause performance issues');
    }
    
    // Check for state updates in render
    if (this.hasStateUpdateInRender(code)) {
      issues.push('State updates during render cause infinite re-render loops');
    }
    
    return {
      hasUnnecessaryReRenders: issues.length > 0,
      issues,
    };
  }

  /**
   * Checks for useEffect without debouncing
   */
  private hasUseEffectWithoutDebounce(code: string): boolean {
    // Look for useEffect with frequent triggers (like input changes) without debounce
    const hasUseEffect = /useEffect\s*\(\s*\(\s*\)\s*=>\s*{/.test(code);
    const hasDebounce = /debounce|throttle|setTimeout|useDebounce|useThrottle/.test(code);
    const hasFrequentTrigger = /onChange|onInput|onScroll|onResize|onMouseMove/.test(code);
    
    return hasUseEffect && hasFrequentTrigger && !hasDebounce;
  }

  /**
   * Checks for inline object/array creation in JSX
   */
  private hasInlineObjectsInJSX(code: string): boolean {
    // Look for patterns like style={{...}} or data={[...]} in JSX
    const inlineObjectPattern = /=\s*{\s*{[^}]+}\s*}/;
    const inlineArrayPattern = /=\s*{\s*\[[^\]]+\]\s*}/;
    
    return inlineObjectPattern.test(code) || inlineArrayPattern.test(code);
  }

  /**
   * Checks for missing useCallback on event handlers
   */
  private hasMissingUseCallback(code: string): boolean {
    // Look for arrow functions defined in component body that are passed as props
    const hasInlineHandlers = /on\w+\s*=\s*{\s*\(\s*\w*\s*\)\s*=>/i.test(code);
    const hasUseCallback = /useCallback\s*\(/.test(code);
    
    return hasInlineHandlers && !hasUseCallback;
  }

  /**
   * Checks for missing useMemo on expensive computations
   */
  private hasMissingUseMemo(code: string): boolean {
    // Look for expensive operations without useMemo
    const hasExpensiveOps = /\.filter\s*\([^)]+\)\.map\s*\(|\.sort\s*\(|\.reduce\s*\(/.test(code);
    const hasUseMemo = /useMemo\s*\(/.test(code);
    
    return hasExpensiveOps && !hasUseMemo;
  }

  /**
   * Checks for state updates during render
   */
  private hasStateUpdateInRender(code: string): boolean {
    // Look for setState calls outside of event handlers or useEffect
    const lines = code.split('\n');
    let inUseEffect = false;
    let inEventHandler = false;
    let braceDepth = 0;
    
    for (const line of lines) {
      if (/useEffect\s*\(/.test(line)) {
        inUseEffect = true;
      }
      if (/on\w+\s*=\s*{|handle\w+\s*=/.test(line)) {
        inEventHandler = true;
      }
      
      braceDepth += (line.match(/{/g) || []).length;
      braceDepth -= (line.match(/}/g) || []).length;
      
      if (braceDepth === 0) {
        inUseEffect = false;
        inEventHandler = false;
      }
      
      // Check for setState outside of useEffect or event handlers
      if (/set\w+\s*\(/.test(line) && !inUseEffect && !inEventHandler) {
        // This is a simplified check - in reality we'd need more context
        if (!/const\s+\[\s*\w+\s*,\s*set\w+\s*\]/.test(line)) {
          return true;
        }
      }
    }
    
    return false;
  }
}



// ============================================================================
// Optimization Detector
// ============================================================================

/**
 * OptimizationDetector - Detects optimization techniques in code
 * 
 * Detects:
 * - useMemo usage
 * - useCallback usage
 * - React.memo usage
 * - Debouncing/throttling
 * - Virtualization
 */
export class OptimizationDetector {
  /**
   * Detects optimization techniques in code
   * 
   * @param code - Source code to analyze
   * @param filePath - Path to the file
   * @returns Array of found optimizations
   */
  detect(code: string, filePath: string): OptimizationFound[] {
    const optimizations: OptimizationFound[] = [];
    const lines = code.split('\n');
    const language = this.detectLanguage(filePath);
    
    // Detect useMemo
    const useMemoMatches = this.findPattern(lines, /useMemo\s*\(/);
    for (const match of useMemoMatches) {
      optimizations.push({
        technique: 'useMemo',
        evidence: this.createEvidence(match, filePath, language),
        description: 'useMemo used to memoize expensive computation',
      });
    }
    
    // Detect useCallback
    const useCallbackMatches = this.findPattern(lines, /useCallback\s*\(/);
    for (const match of useCallbackMatches) {
      optimizations.push({
        technique: 'useCallback',
        evidence: this.createEvidence(match, filePath, language),
        description: 'useCallback used to memoize callback function',
      });
    }
    
    // Detect React.memo
    const memoMatches = this.findPattern(lines, /React\.memo\s*\(|memo\s*\(/);
    for (const match of memoMatches) {
      optimizations.push({
        technique: 'React.memo',
        evidence: this.createEvidence(match, filePath, language),
        description: 'React.memo used to prevent unnecessary re-renders',
      });
    }
    
    // Detect debouncing
    const debounceMatches = this.findPattern(lines, /debounce\s*\(|useDebounce/);
    for (const match of debounceMatches) {
      optimizations.push({
        technique: 'debouncing',
        evidence: this.createEvidence(match, filePath, language),
        description: 'Debouncing used to limit function execution frequency',
      });
    }
    
    // Detect throttling
    const throttleMatches = this.findPattern(lines, /throttle\s*\(|useThrottle/);
    for (const match of throttleMatches) {
      optimizations.push({
        technique: 'throttling',
        evidence: this.createEvidence(match, filePath, language),
        description: 'Throttling used to limit function execution rate',
      });
    }
    
    // Detect virtualization
    const virtualizationMatches = this.findPattern(
      lines, 
      /VirtualList|Virtualized|react-window|react-virtualized|useVirtual/
    );
    for (const match of virtualizationMatches) {
      optimizations.push({
        technique: 'virtualization',
        evidence: this.createEvidence(match, filePath, language),
        description: 'Virtualization used for efficient rendering of large lists',
      });
    }
    
    // Detect memoization (general)
    const memoizationMatches = this.findPattern(lines, /memoize\s*\(|_.memoize/);
    for (const match of memoizationMatches) {
      optimizations.push({
        technique: 'memoization',
        evidence: this.createEvidence(match, filePath, language),
        description: 'Memoization used to cache function results',
      });
    }
    
    return optimizations;
  }

  /**
   * Formats found optimizations as checkboxes
   * 
   * @param optimizations - Array of found optimizations
   * @returns Formatted markdown string
   */
  formatAsCheckboxes(optimizations: OptimizationFound[]): string {
    const allTechniques = [
      'useMemo',
      'useCallback',
      'React.memo',
      'debouncing',
      'throttling',
      'virtualization',
      'memoization',
    ];
    
    const foundTechniques = new Set(optimizations.map(o => o.technique));
    
    return allTechniques
      .map(technique => {
        const isFound = foundTechniques.has(technique as OptimizationFound['technique']);
        const marker = isFound ? '✅' : '❌';
        return `- [${isFound ? 'x' : ' '}] ${marker} ${technique}`;
      })
      .join('\n');
  }

  /**
   * Finds pattern matches in code lines
   */
  private findPattern(
    lines: string[],
    pattern: RegExp
  ): Array<{ line: number; snippet: string }> {
    const matches: Array<{ line: number; snippet: string }> = [];
    
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        matches.push({
          line: i + 1,
          snippet: lines[i].trim(),
        });
      }
    }
    
    return matches;
  }

  /**
   * Creates code evidence from a match
   */
  private createEvidence(
    match: { line: number; snippet: string },
    filePath: string,
    language: string
  ): CodeEvidence {
    return {
      filePath,
      lineNumbers: { start: match.line, end: match.line },
      codeSnippet: match.snippet,
      language,
    };
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
// Performance Analyzer (Main Entry Point)
// ============================================================================

/**
 * PerformanceAnalyzer - Main class for analyzing performance in code
 * 
 * Combines all performance analysis components:
 * - Complexity analysis
 * - Re-render detection
 * - Optimization detection
 * - Concern identification
 */
export class PerformanceAnalyzer {
  private complexityAnalyzer: ComplexityAnalyzer;
  private reRenderDetector: ReRenderDetector;
  private optimizationDetector: OptimizationDetector;

  constructor() {
    this.complexityAnalyzer = new ComplexityAnalyzer();
    this.reRenderDetector = new ReRenderDetector();
    this.optimizationDetector = new OptimizationDetector();
  }

  /**
   * Analyzes code for performance characteristics
   * 
   * @param code - Source code to analyze
   * @param filePath - Path to the file
   * @returns Complete performance analysis result
   */
  analyze(code: string, filePath: string): PerformanceAnalysisResult {
    const complexityAnalysis = this.complexityAnalyzer.analyze(code, filePath);
    const reRenderAnalysis = this.reRenderDetector.analyze(code, filePath);
    const optimizations = this.optimizationDetector.detect(code, filePath);
    const concerns = this.identifyConcerns(code, filePath, complexityAnalysis, reRenderAnalysis);

    return {
      concerns,
      optimizations,
      complexityAnalysis,
      reRenderAnalysis,
    };
  }

  /**
   * Identifies performance concerns based on analysis
   */
  private identifyConcerns(
    code: string,
    filePath: string,
    complexity: ComplexityAnalysis,
    reRender: ReRenderAnalysis
  ): PerformanceConcern[] {
    const concerns: PerformanceConcern[] = [];
    const lines = code.split('\n');
    const language = this.detectLanguage(filePath);
    let concernId = 1;

    // Add concerns for high complexity
    if (complexity.algorithmicComplexity.includes('O(n²)') ||
        complexity.algorithmicComplexity.includes('O(n^2)')) {
      const loopLine = this.findFirstNestedLoop(lines);
      concerns.push({
        id: concernId++,
        evidence: {
          filePath,
          lineNumbers: { start: loopLine, end: loopLine },
          codeSnippet: lines[loopLine - 1]?.trim() || '',
          language,
        },
        issue: 'Nested loops with O(n²) complexity',
        impact: 'Significant performance degradation with large datasets',
        recommendedFix: 'Consider using a Map/Set for O(1) lookups or restructuring the algorithm',
      });
    }

    if (complexity.algorithmicComplexity.includes('O(n³)') ||
        complexity.algorithmicComplexity.includes('O(n^3)')) {
      const loopLine = this.findFirstNestedLoop(lines);
      concerns.push({
        id: concernId++,
        evidence: {
          filePath,
          lineNumbers: { start: loopLine, end: loopLine },
          codeSnippet: lines[loopLine - 1]?.trim() || '',
          language,
        },
        issue: 'Deeply nested loops with O(n³) complexity',
        impact: 'Critical performance issue - will be extremely slow with moderate datasets',
        recommendedFix: 'Restructure algorithm to reduce nesting or use more efficient data structures',
      });
    }

    // Add concerns for re-render issues
    for (const issue of reRender.issues) {
      const issueLine = this.findIssueLocation(lines, issue);
      concerns.push({
        id: concernId++,
        evidence: {
          filePath,
          lineNumbers: { start: issueLine, end: issueLine },
          codeSnippet: lines[issueLine - 1]?.trim() || '',
          language,
        },
        issue: issue,
        impact: 'May cause unnecessary component re-renders affecting UI performance',
        recommendedFix: this.getReRenderFix(issue),
      });
    }

    return concerns;
  }

  /**
   * Finds the first nested loop in code
   */
  private findFirstNestedLoop(lines: string[]): number {
    const loopPattern = /\bfor\s*\(|\bwhile\s*\(|\.forEach\s*\(|\.map\s*\(/;
    let depth = 0;
    
    for (let i = 0; i < lines.length; i++) {
      if (loopPattern.test(lines[i])) {
        if (depth > 0) {
          return i + 1;
        }
        depth++;
      }
      
      depth += (lines[i].match(/{/g) || []).length;
      depth -= (lines[i].match(/}/g) || []).length;
      depth = Math.max(0, depth);
    }
    
    return 1;
  }

  /**
   * Finds the location of a specific issue
   */
  private findIssueLocation(lines: string[], issue: string): number {
    if (issue.includes('useEffect')) {
      for (let i = 0; i < lines.length; i++) {
        if (/useEffect\s*\(/.test(lines[i])) {
          return i + 1;
        }
      }
    }
    
    if (issue.includes('inline')) {
      for (let i = 0; i < lines.length; i++) {
        if (/=\s*{\s*{/.test(lines[i]) || /=\s*{\s*\[/.test(lines[i])) {
          return i + 1;
        }
      }
    }
    
    if (issue.includes('useCallback')) {
      for (let i = 0; i < lines.length; i++) {
        if (/on\w+\s*=\s*{\s*\(/.test(lines[i])) {
          return i + 1;
        }
      }
    }
    
    return 1;
  }

  /**
   * Gets recommended fix for re-render issues
   */
  private getReRenderFix(issue: string): string {
    if (issue.includes('useEffect')) {
      return 'Add debouncing or throttling to the useEffect callback';
    }
    if (issue.includes('inline')) {
      return 'Move object/array creation outside JSX or use useMemo';
    }
    if (issue.includes('useCallback')) {
      return 'Wrap event handlers with useCallback to prevent re-renders';
    }
    if (issue.includes('useMemo')) {
      return 'Wrap expensive computations with useMemo';
    }
    if (issue.includes('infinite')) {
      return 'Move state updates into useEffect or event handlers';
    }
    return 'Review and optimize the component rendering logic';
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
// Helper Functions
// ============================================================================

/**
 * Gets all valid performance ratings
 */
export function getValidPerformanceRatings(): PerformanceRatingString[] {
  return ['Poor', 'Acceptable', 'Good', 'Excellent'];
}

/**
 * Creates a default performance analysis result
 */
export function createDefaultAnalysis(): PerformanceAnalysisResult {
  return {
    concerns: [],
    optimizations: [],
    complexityAnalysis: {
      algorithmicComplexity: 'O(1)',
      loopAnalysis: 'No loops detected.',
    },
    reRenderAnalysis: {
      hasUnnecessaryReRenders: false,
      issues: [],
    },
  };
}

/**
 * Creates a performance concern
 */
export function createPerformanceConcern(
  id: number,
  filePath: string,
  startLine: number,
  endLine: number,
  codeSnippet: string,
  issue: string,
  impact: string,
  recommendedFix: string,
  language: string = 'javascript'
): PerformanceConcern {
  return {
    id,
    evidence: {
      filePath,
      lineNumbers: { start: startLine, end: endLine },
      codeSnippet,
      language,
    },
    issue,
    impact,
    recommendedFix,
  };
}

/**
 * Creates an optimization found entry
 */
export function createOptimizationFound(
  technique: OptimizationFound['technique'],
  filePath: string,
  line: number,
  codeSnippet: string,
  description: string,
  language: string = 'javascript'
): OptimizationFound {
  return {
    technique,
    evidence: {
      filePath,
      lineNumbers: { start: line, end: line },
      codeSnippet,
      language,
    },
    description,
  };
}

/**
 * Validates that a performance evaluation has all required fields
 */
export function isValidPerformanceEvaluation(evaluation: PerformanceEvaluation): boolean {
  const validRatings = getValidPerformanceRatings();
  
  return (
    validRatings.includes(evaluation.rating) &&
    Array.isArray(evaluation.concerns) &&
    Array.isArray(evaluation.optimizations) &&
    typeof evaluation.complexityAnalysis.algorithmicComplexity === 'string' &&
    typeof evaluation.complexityAnalysis.loopAnalysis === 'string' &&
    typeof evaluation.reRenderAnalysis.hasUnnecessaryReRenders === 'boolean' &&
    Array.isArray(evaluation.reRenderAnalysis.issues) &&
    typeof evaluation.assessment === 'string' &&
    evaluation.assessment.length > 0
  );
}
