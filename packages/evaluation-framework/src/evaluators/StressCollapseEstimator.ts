/**
 * StressCollapseEstimator - Estimates stress collapse conditions (Dimension 8)
 * 
 * Analyzes code patterns for failure thresholds, identifies loops, state updates,
 * API calls, setInterval, and filtering operations. Generates condition scenarios
 * with numeric thresholds.
 * 
 * @module StressCollapseEstimator
 */

import type {
  AtomicFeature,
  CodeEvidence,
} from '../../types/evaluation';
import type {
  StressCollapseEvaluation,
  StressCollapseCondition,
} from '../../types/dimensions';

/**
 * Types of code patterns that can cause stress collapse
 */
export type StressPatternType =
  | 'loop'
  | 'state_update'
  | 'api_call'
  | 'interval'
  | 'filtering'
  | 'recursion'
  | 'dom_manipulation'
  | 'event_listener'
  | 'memory_allocation';

/**
 * Detected stress pattern in the code
 */
export interface StressPattern {
  /** Type of stress pattern */
  type: StressPatternType;
  /** Code evidence showing the pattern */
  evidence: CodeEvidence;
  /** Description of the pattern */
  description: string;
  /** Estimated threshold before collapse */
  estimatedThreshold: string;
  /** Expected behavior when threshold is exceeded */
  expectedBehavior: string;
  /** Reasoning for the estimation */
  reasoning: string[];
}

/**
 * Result of stress pattern analysis
 */
export interface StressAnalysisResult {
  /** Detected stress patterns */
  patterns: StressPattern[];
  /** Whether the feature is robust (no collapse scenario) */
  isRobust: boolean;
  /** Reason why feature is robust (if applicable) */
  robustReason?: string;
}

/**
 * Configuration options for stress collapse estimation
 */
export interface StressCollapseEstimatorOptions {
  /** Default threshold for loops without explicit limits */
  defaultLoopThreshold?: number;
  /** Default threshold for state updates per second */
  defaultStateUpdateThreshold?: number;
  /** Default threshold for concurrent API calls */
  defaultApiCallThreshold?: number;
  /** Default threshold for interval frequency (ms) */
  defaultIntervalThreshold?: number;
  /** Default threshold for array filtering operations */
  defaultFilteringThreshold?: number;
}

/**
 * Default configuration for stress collapse estimation
 */
const DEFAULT_OPTIONS: Required<StressCollapseEstimatorOptions> = {
  defaultLoopThreshold: 10000,
  defaultStateUpdateThreshold: 60,
  defaultApiCallThreshold: 100,
  defaultIntervalThreshold: 16,
  defaultFilteringThreshold: 50000,
};


/**
 * StressCollapseEstimator class for estimating stress collapse conditions
 * 
 * @example
 * ```typescript
 * const estimator = new StressCollapseEstimator();
 * const analysis = estimator.analyzeCode(code, filePath);
 * const evaluation = estimator.evaluate(feature, analysis);
 * ```
 */
export class StressCollapseEstimator {
  private options: Required<StressCollapseEstimatorOptions>;

  constructor(options: StressCollapseEstimatorOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Evaluates stress collapse conditions for an atomic feature
   * 
   * @param feature - The atomic feature being evaluated
   * @param analysis - Results of stress pattern analysis
   * @returns Complete stress collapse evaluation
   */
  evaluate(
    feature: AtomicFeature,
    analysis: StressAnalysisResult
  ): StressCollapseEvaluation {
    if (analysis.isRobust) {
      return {
        conditions: [],
        isRobust: true,
        robustReason: analysis.robustReason,
      };
    }

    const conditions = this.generateConditions(analysis.patterns);

    return {
      conditions,
      isRobust: conditions.length === 0,
      robustReason: conditions.length === 0 ? 'No stress collapse scenarios identified' : undefined,
    };
  }

  /**
   * Generates stress collapse conditions from detected patterns
   */
  private generateConditions(patterns: StressPattern[]): StressCollapseCondition[] {
    return patterns.map((pattern, index) => ({
      id: index + 1,
      threshold: pattern.estimatedThreshold,
      expectedBehavior: pattern.expectedBehavior,
      reasoning: pattern.reasoning,
      codePatternReferences: [pattern.evidence],
    }));
  }

  /**
   * Gets the configuration options
   */
  getOptions(): Required<StressCollapseEstimatorOptions> {
    return { ...this.options };
  }
}


// ============================================================================
// Stress Pattern Analyzer
// ============================================================================

/**
 * StressPatternAnalyzer - Analyzes code for stress-inducing patterns
 * 
 * Identifies loops, state updates, API calls, setInterval, filtering operations,
 * and other patterns that could cause performance degradation under load.
 */
export class StressPatternAnalyzer {
  private options: Required<StressCollapseEstimatorOptions>;

  constructor(options: StressCollapseEstimatorOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Analyzes code for stress patterns
   * 
   * @param code - Source code to analyze
   * @param filePath - Path to the file
   * @returns Stress analysis result
   */
  analyze(code: string, filePath: string): StressAnalysisResult {
    const patterns: StressPattern[] = [];

    // Detect various stress patterns
    patterns.push(...this.detectLoops(code, filePath));
    patterns.push(...this.detectStateUpdates(code, filePath));
    patterns.push(...this.detectApiCalls(code, filePath));
    patterns.push(...this.detectIntervals(code, filePath));
    patterns.push(...this.detectFiltering(code, filePath));
    patterns.push(...this.detectRecursion(code, filePath));
    patterns.push(...this.detectDomManipulation(code, filePath));
    patterns.push(...this.detectEventListeners(code, filePath));

    // Check if feature is robust
    const robustCheck = this.checkRobustness(code, patterns);

    return {
      patterns,
      isRobust: robustCheck.isRobust,
      robustReason: robustCheck.reason,
    };
  }


  /**
   * Detects loop patterns that could cause stress
   */
  private detectLoops(code: string, filePath: string): StressPattern[] {
    const patterns: StressPattern[] = [];
    const lines = code.split('\n');

    // Detect for loops
    const forLoopPattern = /\bfor\s*\(/g;
    let match;
    while ((match = forLoopPattern.exec(code)) !== null) {
      const lineNumber = this.getLineNumber(code, match.index);
      const lineContent = lines[lineNumber - 1]?.trim() || '';
      
      // Check for nested loops
      const isNested = this.isNestedLoop(code, match.index);
      const threshold = isNested 
        ? `${Math.sqrt(this.options.defaultLoopThreshold).toFixed(0)} × ${Math.sqrt(this.options.defaultLoopThreshold).toFixed(0)} iterations`
        : `${this.options.defaultLoopThreshold} iterations`;

      patterns.push({
        type: 'loop',
        evidence: {
          filePath,
          lineNumbers: { start: lineNumber, end: lineNumber + 3 },
          codeSnippet: lineContent,
          language: this.detectLanguage(filePath),
        },
        description: isNested ? 'Nested loop detected' : 'Loop detected',
        estimatedThreshold: threshold,
        expectedBehavior: isNested 
          ? 'UI freeze, potential browser tab crash'
          : 'Noticeable lag, potential UI freeze',
        reasoning: [
          `Loop found at line ${lineNumber}`,
          isNested ? 'Nested loops multiply iteration count' : 'Single loop iteration',
          'No explicit iteration limit detected',
        ],
      });
    }

    // Detect while loops
    const whileLoopPattern = /\bwhile\s*\(/g;
    while ((match = whileLoopPattern.exec(code)) !== null) {
      const lineNumber = this.getLineNumber(code, match.index);
      const lineContent = lines[lineNumber - 1]?.trim() || '';

      patterns.push({
        type: 'loop',
        evidence: {
          filePath,
          lineNumbers: { start: lineNumber, end: lineNumber + 3 },
          codeSnippet: lineContent,
          language: this.detectLanguage(filePath),
        },
        description: 'While loop detected - potential infinite loop risk',
        estimatedThreshold: `${this.options.defaultLoopThreshold} iterations`,
        expectedBehavior: 'UI freeze, potential infinite loop',
        reasoning: [
          `While loop found at line ${lineNumber}`,
          'While loops have higher infinite loop risk',
          'Termination condition may not be guaranteed',
        ],
      });
    }

    return patterns;
  }


  /**
   * Detects state update patterns that could cause stress
   */
  private detectStateUpdates(code: string, filePath: string): StressPattern[] {
    const patterns: StressPattern[] = [];
    const lines = code.split('\n');

    // Detect useState with rapid updates
    const setStatePattern = /\bset\w+\s*\(/g;
    let match;
    while ((match = setStatePattern.exec(code)) !== null) {
      const lineNumber = this.getLineNumber(code, match.index);
      const lineContent = lines[lineNumber - 1]?.trim() || '';

      // Check if inside a loop or event handler
      const context = this.getCodeContext(code, match.index);
      if (context.inLoop || context.inEventHandler) {
        patterns.push({
          type: 'state_update',
          evidence: {
            filePath,
            lineNumbers: { start: lineNumber, end: lineNumber },
            codeSnippet: lineContent,
            language: this.detectLanguage(filePath),
          },
          description: `State update ${context.inLoop ? 'inside loop' : 'in event handler'}`,
          estimatedThreshold: `${this.options.defaultStateUpdateThreshold} updates/second`,
          expectedBehavior: 'Excessive re-renders, UI lag, potential memory issues',
          reasoning: [
            `State setter found at line ${lineNumber}`,
            context.inLoop ? 'State update inside loop causes multiple re-renders' : 'Rapid event firing causes excessive updates',
            'React batching may not prevent all re-renders',
          ],
        });
      }
    }

    return patterns;
  }

  /**
   * Detects API call patterns that could cause stress
   */
  private detectApiCalls(code: string, filePath: string): StressPattern[] {
    const patterns: StressPattern[] = [];
    const lines = code.split('\n');

    // Detect fetch/axios calls
    const apiPatterns = [
      /\bfetch\s*\(/g,
      /\baxios\.\w+\s*\(/g,
      /\.get\s*\(['"]/g,
      /\.post\s*\(['"]/g,
    ];

    for (const apiPattern of apiPatterns) {
      let match;
      while ((match = apiPattern.exec(code)) !== null) {
        const lineNumber = this.getLineNumber(code, match.index);
        const lineContent = lines[lineNumber - 1]?.trim() || '';

        const context = this.getCodeContext(code, match.index);
        if (context.inLoop || context.inMap) {
          patterns.push({
            type: 'api_call',
            evidence: {
              filePath,
              lineNumbers: { start: lineNumber, end: lineNumber },
              codeSnippet: lineContent,
              language: this.detectLanguage(filePath),
            },
            description: 'API call inside loop/map - potential request flood',
            estimatedThreshold: `${this.options.defaultApiCallThreshold} concurrent requests`,
            expectedBehavior: 'Network congestion, rate limiting, server overload',
            reasoning: [
              `API call found at line ${lineNumber}`,
              'Multiple concurrent requests can overwhelm server',
              'No request batching or throttling detected',
            ],
          });
        }
      }
    }

    return patterns;
  }


  /**
   * Detects setInterval patterns that could cause stress
   */
  private detectIntervals(code: string, filePath: string): StressPattern[] {
    const patterns: StressPattern[] = [];
    const lines = code.split('\n');

    const intervalPattern = /\bsetInterval\s*\(/g;
    let match;
    while ((match = intervalPattern.exec(code)) !== null) {
      const lineNumber = this.getLineNumber(code, match.index);
      const lineContent = lines[lineNumber - 1]?.trim() || '';

      // Try to extract interval duration
      const durationMatch = code.slice(match.index).match(/setInterval\s*\([^,]+,\s*(\d+)/);
      const duration = durationMatch ? parseInt(durationMatch[1], 10) : 1000;

      if (duration < 100) {
        patterns.push({
          type: 'interval',
          evidence: {
            filePath,
            lineNumbers: { start: lineNumber, end: lineNumber },
            codeSnippet: lineContent,
            language: this.detectLanguage(filePath),
          },
          description: `High-frequency interval (${duration}ms)`,
          estimatedThreshold: `${this.options.defaultIntervalThreshold}ms interval`,
          expectedBehavior: 'CPU saturation, battery drain, UI jank',
          reasoning: [
            `setInterval found at line ${lineNumber} with ${duration}ms interval`,
            'Intervals faster than 16ms exceed 60fps refresh rate',
            'Accumulated callbacks can cause memory pressure',
          ],
        });
      }
    }

    return patterns;
  }

  /**
   * Detects filtering/mapping operations on large arrays
   */
  private detectFiltering(code: string, filePath: string): StressPattern[] {
    const patterns: StressPattern[] = [];
    const lines = code.split('\n');

    const filterPatterns = [
      /\.filter\s*\(/g,
      /\.map\s*\(/g,
      /\.reduce\s*\(/g,
      /\.find\s*\(/g,
      /\.some\s*\(/g,
      /\.every\s*\(/g,
    ];

    for (const filterPattern of filterPatterns) {
      let match;
      while ((match = filterPattern.exec(code)) !== null) {
        const lineNumber = this.getLineNumber(code, match.index);
        const lineContent = lines[lineNumber - 1]?.trim() || '';

        // Check for chained operations
        const isChained = this.isChainedOperation(code, match.index);
        if (isChained) {
          patterns.push({
            type: 'filtering',
            evidence: {
              filePath,
              lineNumbers: { start: lineNumber, end: lineNumber },
              codeSnippet: lineContent,
              language: this.detectLanguage(filePath),
            },
            description: 'Chained array operations detected',
            estimatedThreshold: `${this.options.defaultFilteringThreshold} items`,
            expectedBehavior: 'Memory allocation spikes, GC pauses, UI freeze',
            reasoning: [
              `Chained array operation at line ${lineNumber}`,
              'Each operation creates intermediate arrays',
              'Large arrays multiply memory usage',
            ],
          });
        }
      }
    }

    return patterns;
  }


  /**
   * Detects recursion patterns that could cause stack overflow
   */
  private detectRecursion(code: string, filePath: string): StressPattern[] {
    const patterns: StressPattern[] = [];
    const lines = code.split('\n');

    // Find function definitions and check for self-calls
    const functionPattern = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>)/g;
    let match;
    while ((match = functionPattern.exec(code)) !== null) {
      const funcName = match[1] || match[2];
      if (!funcName) continue;

      // Check if function calls itself
      const funcBody = this.extractFunctionBody(code, match.index);
      const selfCallPattern = new RegExp(`\\b${funcName}\\s*\\(`, 'g');
      if (selfCallPattern.test(funcBody)) {
        const lineNumber = this.getLineNumber(code, match.index);
        const lineContent = lines[lineNumber - 1]?.trim() || '';

        patterns.push({
          type: 'recursion',
          evidence: {
            filePath,
            lineNumbers: { start: lineNumber, end: lineNumber + 5 },
            codeSnippet: lineContent,
            language: this.detectLanguage(filePath),
          },
          description: `Recursive function: ${funcName}`,
          estimatedThreshold: '10000 recursion depth',
          expectedBehavior: 'Stack overflow, browser crash',
          reasoning: [
            `Recursive function ${funcName} at line ${lineNumber}`,
            'Deep recursion can exceed call stack limit',
            'No tail-call optimization in JavaScript',
          ],
        });
      }
    }

    return patterns;
  }

  /**
   * Detects DOM manipulation patterns that could cause stress
   */
  private detectDomManipulation(code: string, filePath: string): StressPattern[] {
    const patterns: StressPattern[] = [];
    const lines = code.split('\n');

    const domPatterns = [
      /document\.createElement/g,
      /\.appendChild\s*\(/g,
      /\.innerHTML\s*=/g,
      /\.insertBefore\s*\(/g,
    ];

    for (const domPattern of domPatterns) {
      let match;
      while ((match = domPattern.exec(code)) !== null) {
        const lineNumber = this.getLineNumber(code, match.index);
        const lineContent = lines[lineNumber - 1]?.trim() || '';

        const context = this.getCodeContext(code, match.index);
        if (context.inLoop) {
          patterns.push({
            type: 'dom_manipulation',
            evidence: {
              filePath,
              lineNumbers: { start: lineNumber, end: lineNumber },
              codeSnippet: lineContent,
              language: this.detectLanguage(filePath),
            },
            description: 'DOM manipulation inside loop',
            estimatedThreshold: '1000 DOM operations',
            expectedBehavior: 'Layout thrashing, UI freeze, high memory usage',
            reasoning: [
              `DOM manipulation at line ${lineNumber}`,
              'Each DOM change triggers reflow/repaint',
              'Batch DOM operations recommended',
            ],
          });
        }
      }
    }

    return patterns;
  }


  /**
   * Detects event listener patterns that could cause stress
   */
  private detectEventListeners(code: string, filePath: string): StressPattern[] {
    const patterns: StressPattern[] = [];
    const lines = code.split('\n');

    // Detect addEventListener without cleanup
    const addListenerPattern = /\.addEventListener\s*\(/g;
    let match;
    while ((match = addListenerPattern.exec(code)) !== null) {
      const lineNumber = this.getLineNumber(code, match.index);
      const lineContent = lines[lineNumber - 1]?.trim() || '';

      // Check for corresponding removeEventListener
      const hasCleanup = /\.removeEventListener\s*\(/.test(code);
      if (!hasCleanup) {
        patterns.push({
          type: 'event_listener',
          evidence: {
            filePath,
            lineNumbers: { start: lineNumber, end: lineNumber },
            codeSnippet: lineContent,
            language: this.detectLanguage(filePath),
          },
          description: 'Event listener without cleanup',
          estimatedThreshold: '100 component mounts',
          expectedBehavior: 'Memory leak, duplicate handlers, degraded performance',
          reasoning: [
            `addEventListener at line ${lineNumber}`,
            'No corresponding removeEventListener found',
            'Listeners accumulate on each mount/unmount cycle',
          ],
        });
      }
    }

    return patterns;
  }

  /**
   * Checks if the feature is robust (no collapse scenario)
   */
  private checkRobustness(code: string, patterns: StressPattern[]): { isRobust: boolean; reason?: string } {
    // If no patterns detected, check for simple features
    if (patterns.length === 0) {
      // Check for simple boolean/toggle features
      if (this.isSimpleBooleanFeature(code)) {
        return { isRobust: true, reason: 'N/A - simple boolean toggle' };
      }

      // Check for pagination
      if (this.hasPagination(code)) {
        return { isRobust: true, reason: 'N/A - pagination prevents large data issues' };
      }

      // Check for virtualization
      if (this.hasVirtualization(code)) {
        return { isRobust: true, reason: 'N/A - virtualization handles large lists' };
      }

      // Check for debouncing/throttling
      if (this.hasDebouncing(code)) {
        return { isRobust: true, reason: 'N/A - debouncing/throttling prevents rapid updates' };
      }

      return { isRobust: true, reason: 'No stress collapse scenarios identified' };
    }

    return { isRobust: false };
  }


  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Gets line number from character index
   */
  private getLineNumber(code: string, index: number): number {
    return code.slice(0, index).split('\n').length;
  }

  /**
   * Detects programming language from file path
   */
  private detectLanguage(filePath: string): string {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) return 'typescript';
    if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) return 'javascript';
    if (filePath.endsWith('.py')) return 'python';
    return 'javascript';
  }

  /**
   * Checks if a loop is nested
   */
  private isNestedLoop(code: string, index: number): boolean {
    const before = code.slice(0, index);
    const openBraces = (before.match(/{/g) || []).length;
    const closeBraces = (before.match(/}/g) || []).length;
    const depth = openBraces - closeBraces;

    // Check if there's another loop in the outer scope
    const outerCode = before.slice(-500);
    return /\b(for|while)\s*\([^)]*\)\s*{/.test(outerCode) && depth > 1;
  }

  /**
   * Gets context information about code location
   */
  private getCodeContext(code: string, index: number): {
    inLoop: boolean;
    inEventHandler: boolean;
    inMap: boolean;
  } {
    const before = code.slice(Math.max(0, index - 500), index);
    
    return {
      inLoop: /\b(for|while)\s*\([^)]*\)\s*{[^}]*$/.test(before),
      inEventHandler: /\bon\w+\s*=\s*{?\s*\(?[^}]*$/.test(before) || 
                      /addEventListener\s*\([^)]+,\s*[^)]*$/.test(before),
      inMap: /\.map\s*\([^)]*$/.test(before),
    };
  }

  /**
   * Checks if array operation is chained
   */
  private isChainedOperation(code: string, index: number): boolean {
    const after = code.slice(index, index + 100);
    return /\)\s*\.\s*(filter|map|reduce|find|some|every)\s*\(/.test(after);
  }

  /**
   * Extracts function body from code
   */
  private extractFunctionBody(code: string, startIndex: number): string {
    let braceCount = 0;
    let started = false;
    let bodyStart = startIndex;
    let bodyEnd = startIndex;

    for (let i = startIndex; i < code.length; i++) {
      if (code[i] === '{') {
        if (!started) {
          started = true;
          bodyStart = i;
        }
        braceCount++;
      } else if (code[i] === '}') {
        braceCount--;
        if (started && braceCount === 0) {
          bodyEnd = i;
          break;
        }
      }
    }

    return code.slice(bodyStart, bodyEnd + 1);
  }


  /**
   * Checks if feature is a simple boolean toggle
   */
  private isSimpleBooleanFeature(code: string): boolean {
    // Check for simple boolean state
    const hasBooleanState = /useState\s*<?\s*boolean\s*>?\s*\(\s*(true|false)\s*\)/.test(code) ||
                           /useState\s*\(\s*(true|false)\s*\)/.test(code);
    
    // Check for simple toggle logic
    const hasToggle = /set\w+\s*\(\s*!\w+\s*\)/.test(code) ||
                     /set\w+\s*\(\s*prev\s*=>\s*!prev\s*\)/.test(code);

    // Check code is small
    const loc = code.split('\n').filter(l => l.trim().length > 0).length;
    
    return hasBooleanState && hasToggle && loc < 30;
  }

  /**
   * Checks if code has pagination
   */
  private hasPagination(code: string): boolean {
    return /page|pageSize|pageNumber|offset|limit|pagination/i.test(code);
  }

  /**
   * Checks if code has virtualization
   */
  private hasVirtualization(code: string): boolean {
    return /VirtualList|react-window|react-virtualized|useVirtual|virtualize/i.test(code);
  }

  /**
   * Checks if code has debouncing/throttling
   */
  private hasDebouncing(code: string): boolean {
    return /debounce|throttle|useDebouncedValue|useThrottle/i.test(code);
  }
}


// ============================================================================
// Collapse Condition Generator
// ============================================================================

/**
 * CollapseConditionGenerator - Generates formatted collapse conditions
 * 
 * Generates format: [Numeric threshold] → [Expected behavior]
 * Includes Reasoning section with bullet points and code pattern references.
 */
export class CollapseConditionGenerator {
  /**
   * Generates a formatted collapse condition
   * 
   * @param pattern - The stress pattern to generate condition for
   * @param id - Condition ID
   * @returns Formatted stress collapse condition
   */
  generate(pattern: StressPattern, id: number): StressCollapseCondition {
    return {
      id,
      threshold: pattern.estimatedThreshold,
      expectedBehavior: pattern.expectedBehavior,
      reasoning: pattern.reasoning,
      codePatternReferences: [pattern.evidence],
    };
  }

  /**
   * Generates multiple conditions from patterns
   * 
   * @param patterns - Array of stress patterns
   * @returns Array of stress collapse conditions
   */
  generateAll(patterns: StressPattern[]): StressCollapseCondition[] {
    return patterns.map((pattern, index) => this.generate(pattern, index + 1));
  }

  /**
   * Formats a condition as markdown
   * 
   * @param condition - The condition to format
   * @returns Formatted markdown string
   */
  formatAsMarkdown(condition: StressCollapseCondition): string {
    const lines: string[] = [];

    lines.push(`**Condition ${condition.id}:**`);
    lines.push('```');
    lines.push(`${condition.threshold} → ${condition.expectedBehavior}`);
    lines.push('```');
    lines.push('**Reasoning:**');
    for (const reason of condition.reasoning) {
      lines.push(`- ${reason}`);
    }

    if (condition.codePatternReferences.length > 0) {
      const ref = condition.codePatternReferences[0];
      lines.push(`\n**Code Reference:** \`${ref.filePath}\`, lines ${ref.lineNumbers.start}-${ref.lineNumbers.end}`);
    }

    return lines.join('\n');
  }

  /**
   * Formats all conditions as markdown
   * 
   * @param conditions - Array of conditions
   * @returns Formatted markdown string
   */
  formatAllAsMarkdown(conditions: StressCollapseCondition[]): string {
    if (conditions.length === 0) {
      return 'No stress collapse conditions identified.';
    }

    return conditions.map(c => this.formatAsMarkdown(c)).join('\n\n');
  }
}


// ============================================================================
// N/A Handler
// ============================================================================

/**
 * RobustFeatureHandler - Handles robust features with no collapse scenario
 * 
 * Detects robust features and generates "N/A" with explanation.
 */
export class RobustFeatureHandler {
  /**
   * Checks if a feature is robust based on code analysis
   * 
   * @param code - Source code to analyze
   * @returns Object with isRobust flag and reason
   */
  checkRobustness(code: string): { isRobust: boolean; reason?: string } {
    // Check for simple boolean features
    if (this.isSimpleBooleanFeature(code)) {
      return { isRobust: true, reason: 'N/A - simple boolean toggle' };
    }

    // Check for pagination
    if (this.hasPagination(code)) {
      return { isRobust: true, reason: 'N/A - pagination prevents large data issues' };
    }

    // Check for virtualization
    if (this.hasVirtualization(code)) {
      return { isRobust: true, reason: 'N/A - virtualization handles large lists efficiently' };
    }

    // Check for debouncing/throttling
    if (this.hasDebouncing(code)) {
      return { isRobust: true, reason: 'N/A - debouncing/throttling prevents rapid updates' };
    }

    // Check for memoization
    if (this.hasMemoization(code)) {
      return { isRobust: true, reason: 'N/A - memoization prevents unnecessary recalculations' };
    }

    // Check for static content
    if (this.isStaticContent(code)) {
      return { isRobust: true, reason: 'N/A - static content with no dynamic operations' };
    }

    // Check for bounded operations
    if (this.hasBoundedOperations(code)) {
      return { isRobust: true, reason: 'N/A - operations are bounded by explicit limits' };
    }

    return { isRobust: false };
  }

  /**
   * Generates N/A evaluation for robust features
   * 
   * @param reason - Reason why feature is robust
   * @returns Stress collapse evaluation with N/A
   */
  generateNAEvaluation(reason: string): StressCollapseEvaluation {
    return {
      conditions: [],
      isRobust: true,
      robustReason: reason,
    };
  }

  /**
   * Formats N/A as markdown
   * 
   * @param reason - Reason for N/A
   * @returns Formatted markdown string
   */
  formatAsMarkdown(reason: string): string {
    return `**Stress Collapse Estimation:** ${reason}`;
  }


  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private isSimpleBooleanFeature(code: string): boolean {
    const hasBooleanState = /useState\s*<?\s*boolean\s*>?\s*\(\s*(true|false)\s*\)/.test(code) ||
                           /useState\s*\(\s*(true|false)\s*\)/.test(code);
    const hasToggle = /set\w+\s*\(\s*!\w+\s*\)/.test(code) ||
                     /set\w+\s*\(\s*prev\s*=>\s*!prev\s*\)/.test(code);
    const loc = code.split('\n').filter(l => l.trim().length > 0).length;
    return hasBooleanState && hasToggle && loc < 30;
  }

  private hasPagination(code: string): boolean {
    return /page|pageSize|pageNumber|offset|limit|pagination/i.test(code);
  }

  private hasVirtualization(code: string): boolean {
    return /VirtualList|react-window|react-virtualized|useVirtual|virtualize/i.test(code);
  }

  private hasDebouncing(code: string): boolean {
    return /debounce|throttle|useDebouncedValue|useThrottle/i.test(code);
  }

  private hasMemoization(code: string): boolean {
    return /useMemo|useCallback|React\.memo|memo\s*\(/.test(code);
  }

  private isStaticContent(code: string): boolean {
    // No state, no effects, no event handlers
    const hasState = /useState|useReducer|useRef/.test(code);
    const hasEffects = /useEffect|useLayoutEffect/.test(code);
    const hasHandlers = /onClick|onChange|onSubmit|on\w+\s*=/.test(code);
    return !hasState && !hasEffects && !hasHandlers;
  }

  private hasBoundedOperations(code: string): boolean {
    // Check for explicit limits in loops
    return /\.slice\s*\(\s*\d+\s*,\s*\d+\s*\)/.test(code) ||
           /\.take\s*\(\s*\d+\s*\)/.test(code) ||
           /limit\s*[:=]\s*\d+/.test(code) ||
           /maxItems?\s*[:=]\s*\d+/.test(code);
  }
}


// ============================================================================
// Main Stress Collapse Analyzer
// ============================================================================

/**
 * StressCollapseAnalyzer - Main class for stress collapse analysis
 * 
 * Combines pattern analysis, condition generation, and N/A handling.
 */
export class StressCollapseAnalyzer {
  private patternAnalyzer: StressPatternAnalyzer;
  private conditionGenerator: CollapseConditionGenerator;
  private robustHandler: RobustFeatureHandler;

  constructor(options: StressCollapseEstimatorOptions = {}) {
    this.patternAnalyzer = new StressPatternAnalyzer(options);
    this.conditionGenerator = new CollapseConditionGenerator();
    this.robustHandler = new RobustFeatureHandler();
  }

  /**
   * Analyzes code for stress collapse conditions
   * 
   * @param code - Source code to analyze
   * @param filePath - Path to the file
   * @returns Stress analysis result
   */
  analyze(code: string, filePath: string): StressAnalysisResult {
    // First check for robust features
    const robustCheck = this.robustHandler.checkRobustness(code);
    if (robustCheck.isRobust) {
      return {
        patterns: [],
        isRobust: true,
        robustReason: robustCheck.reason,
      };
    }

    // Analyze for stress patterns
    return this.patternAnalyzer.analyze(code, filePath);
  }

  /**
   * Gets the pattern analyzer
   */
  getPatternAnalyzer(): StressPatternAnalyzer {
    return this.patternAnalyzer;
  }

  /**
   * Gets the condition generator
   */
  getConditionGenerator(): CollapseConditionGenerator {
    return this.conditionGenerator;
  }

  /**
   * Gets the robust feature handler
   */
  getRobustHandler(): RobustFeatureHandler {
    return this.robustHandler;
  }
}


// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets all valid stress pattern types
 */
export function getValidStressPatternTypes(): StressPatternType[] {
  return [
    'loop',
    'state_update',
    'api_call',
    'interval',
    'filtering',
    'recursion',
    'dom_manipulation',
    'event_listener',
    'memory_allocation',
  ];
}

/**
 * Creates a default stress analysis result
 */
export function createDefaultAnalysis(): StressAnalysisResult {
  return {
    patterns: [],
    isRobust: true,
    robustReason: 'No stress collapse scenarios identified',
  };
}

/**
 * Creates a stress pattern
 */
export function createStressPattern(
  type: StressPatternType,
  evidence: CodeEvidence,
  description: string,
  estimatedThreshold: string,
  expectedBehavior: string,
  reasoning: string[]
): StressPattern {
  return {
    type,
    evidence,
    description,
    estimatedThreshold,
    expectedBehavior,
    reasoning,
  };
}

/**
 * Creates a stress collapse condition
 */
export function createStressCollapseCondition(
  id: number,
  threshold: string,
  expectedBehavior: string,
  reasoning: string[],
  codePatternReferences: CodeEvidence[]
): StressCollapseCondition {
  return {
    id,
    threshold,
    expectedBehavior,
    reasoning,
    codePatternReferences,
  };
}

/**
 * Validates that a stress collapse evaluation has valid format
 */
export function isValidStressCollapseEvaluation(evaluation: StressCollapseEvaluation): boolean {
  // Must have conditions array
  if (!Array.isArray(evaluation.conditions)) {
    return false;
  }

  // Must have isRobust boolean
  if (typeof evaluation.isRobust !== 'boolean') {
    return false;
  }

  // If robust, must have robustReason
  if (evaluation.isRobust && !evaluation.robustReason) {
    return false;
  }

  // If not robust, must have at least one condition
  if (!evaluation.isRobust && evaluation.conditions.length === 0) {
    return false;
  }

  // Validate each condition
  for (const condition of evaluation.conditions) {
    if (!isValidStressCollapseCondition(condition)) {
      return false;
    }
  }

  return true;
}

/**
 * Validates that a stress collapse condition has valid format
 */
export function isValidStressCollapseCondition(condition: StressCollapseCondition): boolean {
  return (
    typeof condition.id === 'number' &&
    condition.id > 0 &&
    typeof condition.threshold === 'string' &&
    condition.threshold.length > 0 &&
    typeof condition.expectedBehavior === 'string' &&
    condition.expectedBehavior.length > 0 &&
    Array.isArray(condition.reasoning) &&
    condition.reasoning.length > 0 &&
    Array.isArray(condition.codePatternReferences)
  );
}

/**
 * Formats stress collapse evaluation as markdown
 */
export function formatStressCollapseAsMarkdown(evaluation: StressCollapseEvaluation): string {
  if (evaluation.isRobust) {
    return `**Stress Collapse Estimation:** ${evaluation.robustReason}`;
  }

  const generator = new CollapseConditionGenerator();
  return generator.formatAllAsMarkdown(evaluation.conditions);
}

