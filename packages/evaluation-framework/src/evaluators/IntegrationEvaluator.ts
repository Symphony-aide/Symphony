/**
 * IntegrationEvaluator - Evaluates integration and extensibility (Dimension 6)
 * 
 * Analyzes configuration options, extensibility, toggle capability,
 * and feature interactions. Generates assessments with justification.
 * 
 * @module IntegrationEvaluator
 */

import type {
  AtomicFeature,
  CodeEvidence,
  IntegrationRatingString,
} from '../../types/evaluation';
import type {
  IntegrationEvaluation,
  ConfigurationOption,
  ExtensibilityAssessment,
} from '../../types/dimensions';

/**
 * Configuration options for integration evaluation
 */
export interface IntegrationEvaluatorOptions {
  /** Minimum score for Partial rating (default: 25) */
  partialMinScore?: number;
  /** Minimum score for Full rating (default: 60) */
  fullMinScore?: number;
  /** Minimum score for Enterprise-Level rating (default: 85) */
  enterpriseMinScore?: number;
}

/**
 * Default configuration for integration evaluation
 */
const DEFAULT_OPTIONS: Required<IntegrationEvaluatorOptions> = {
  partialMinScore: 25,
  fullMinScore: 60,
  enterpriseMinScore: 85,
};

/**
 * Result of analyzing integration in code
 */
export interface IntegrationAnalysisResult {
  /** Available configuration options */
  configurationOptions: ConfigurationOption[];
  /** Extensibility assessment */
  extensibility: ExtensibilityAssessment;
  /** Whether feature can be toggled on/off */
  toggleCapability: boolean;
  /** How feature works with other features */
  featureInteractions: string;
}

/**
 * IntegrationEvaluator class for evaluating integration and extensibility
 * 
 * @example
 * ```typescript
 * const evaluator = new IntegrationEvaluator();
 * const analysis = evaluator.analyzeCode(code, filePath);
 * const evaluation = evaluator.evaluate(feature, analysis);
 * ```
 */
export class IntegrationEvaluator {
  private options: Required<IntegrationEvaluatorOptions>;

  constructor(options: IntegrationEvaluatorOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Evaluates the integration of an atomic feature
   * 
   * @param feature - The atomic feature being evaluated
   * @param analysis - Results of integration analysis
   * @returns Complete integration evaluation
   */
  evaluate(
    feature: AtomicFeature,
    analysis: IntegrationAnalysisResult
  ): IntegrationEvaluation {
    const rating = this.determineRating(analysis);
    const assessment = this.generateAssessment(feature, rating, analysis);

    return {
      rating,
      configurationOptions: analysis.configurationOptions,
      extensibility: analysis.extensibility,
      toggleCapability: analysis.toggleCapability,
      featureInteractions: analysis.featureInteractions,
      assessment,
    };
  }

  /**
   * Determines the integration rating based on analysis results
   * 
   * @param analysis - Integration analysis results
   * @returns Integration rating string
   */
  determineRating(analysis: IntegrationAnalysisResult): IntegrationRatingString {
    let score = 0;

    // Score for configuration options (up to 30 points)
    const presentOptions = analysis.configurationOptions.filter(o => o.present).length;
    const totalOptions = analysis.configurationOptions.length;
    if (totalOptions > 0) {
      score += Math.round((presentOptions / totalOptions) * 30);
    } else {
      // No configuration options defined - neutral
      score += 15;
    }

    // Score for extensibility (up to 35 points)
    if (analysis.extensibility.hasHooksCallbacks) {
      score += 35;
    } else if (analysis.extensibility.hasSomeExtensionPoints) {
      score += 20;
    } else if (!analysis.extensibility.isHardcoded) {
      score += 10;
    }
    // isHardcoded = 0 points

    // Score for toggle capability (up to 20 points)
    if (analysis.toggleCapability) {
      score += 20;
    }

    // Score for feature interactions (up to 15 points)
    if (analysis.featureInteractions && analysis.featureInteractions.length > 0) {
      if (analysis.featureInteractions.toLowerCase().includes('seamless') ||
          analysis.featureInteractions.toLowerCase().includes('well-integrated')) {
        score += 15;
      } else if (analysis.featureInteractions.toLowerCase().includes('works with') ||
                 analysis.featureInteractions.toLowerCase().includes('compatible')) {
        score += 10;
      } else {
        score += 5;
      }
    }

    // Clamp score to 0-100
    score = Math.max(0, Math.min(100, score));

    // Convert score to rating
    if (score >= this.options.enterpriseMinScore) {
      return 'Enterprise-Level';
    } else if (score >= this.options.fullMinScore) {
      return 'Full';
    } else if (score >= this.options.partialMinScore) {
      return 'Partial';
    } else {
      return 'Not Compatible';
    }
  }

  /**
   * Generates a detailed assessment explaining the rating
   */
  generateAssessment(
    feature: AtomicFeature,
    rating: IntegrationRatingString,
    analysis: IntegrationAnalysisResult
  ): string {
    const parts: string[] = [];

    parts.push(`The ${feature.name} feature has ${rating.toLowerCase()} integration capabilities.`);

    // Configuration options
    const presentOptions = analysis.configurationOptions.filter(o => o.present).length;
    const totalOptions = analysis.configurationOptions.length;
    if (totalOptions > 0) {
      parts.push(`Configuration: ${presentOptions}/${totalOptions} options available.`);
    } else {
      parts.push('No explicit configuration options defined.');
    }

    // Extensibility
    if (analysis.extensibility.hasHooksCallbacks) {
      parts.push('Extensibility: Provides hooks/callbacks for custom behavior.');
    } else if (analysis.extensibility.hasSomeExtensionPoints) {
      parts.push('Extensibility: Has some extension points.');
    } else if (analysis.extensibility.isHardcoded) {
      parts.push('Extensibility: Hardcoded implementation, not extensible.');
    }

    // Toggle capability
    if (analysis.toggleCapability) {
      parts.push('Feature can be toggled on/off via props or configuration.');
    } else {
      parts.push('Feature cannot be easily toggled on/off.');
    }

    // Feature interactions
    if (analysis.featureInteractions) {
      parts.push(`Feature interactions: ${analysis.featureInteractions}`);
    }

    // Rating-specific recommendations
    switch (rating) {
      case 'Enterprise-Level':
        parts.push('Excellent integration with comprehensive configuration and extensibility.');
        break;
      case 'Full':
        parts.push('Good integration with most configuration options and extension points available.');
        break;
      case 'Partial':
        parts.push('Partial integration. Consider adding more configuration options and extension points.');
        break;
      case 'Not Compatible':
        parts.push('Limited integration capabilities. Significant improvements needed for extensibility.');
        break;
    }

    return parts.join(' ');
  }

  /**
   * Validates that a rating is one of the valid integration ratings
   */
  isValidRating(rating: string): rating is IntegrationRatingString {
    return ['Not Compatible', 'Partial', 'Full', 'Enterprise-Level'].includes(rating);
  }

  /**
   * Gets the configuration options
   */
  getOptions(): Required<IntegrationEvaluatorOptions> {
    return { ...this.options };
  }
}



// ============================================================================
// Configuration Options Documenter
// ============================================================================

/**
 * ConfigurationOptionsDocumenter - Documents configuration options
 * 
 * Extracts props and configuration from component code.
 * Generates code snippet showing available options with types.
 * Marks present options with ✅ and missing options with ❌.
 */
export class ConfigurationOptionsDocumenter {
  /**
   * Extracts configuration options from code
   * 
   * @param code - Source code to analyze
   * @param filePath - Path to the file
   * @returns Array of configuration options
   */
  extractOptions(code: string, filePath: string): ConfigurationOption[] {
    const options: ConfigurationOption[] = [];
    const lines = code.split('\n');

    // Look for interface/type definitions for props
    const propsPattern = /interface\s+(\w*Props)\s*{|type\s+(\w*Props)\s*=\s*{/;
    let inPropsBlock = false;
    let braceDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for props interface/type start
      if (propsPattern.test(line)) {
        inPropsBlock = true;
        braceDepth = 0;
      }

      if (inPropsBlock) {
        braceDepth += (line.match(/{/g) || []).length;
        braceDepth -= (line.match(/}/g) || []).length;

        // Extract prop definitions
        const propMatch = line.match(/^\s*(\w+)\??:\s*([^;]+);?/);
        if (propMatch && !line.includes('interface') && !line.includes('type')) {
          const [, name, type] = propMatch;
          const isOptional = line.includes('?:');
          const description = this.extractDescription(lines, i);
          
          options.push({
            name,
            type: type.trim(),
            present: true,
            description: description || undefined,
          });
        }

        if (braceDepth === 0 && line.includes('}')) {
          inPropsBlock = false;
        }
      }
    }

    // Also look for destructured props in function parameters
    const destructuredPropsPattern = /function\s+\w+\s*\(\s*{\s*([^}]+)\s*}\s*(?::\s*\w+)?\s*\)/;
    const arrowPropsPattern = /(?:const|let)\s+\w+\s*=\s*\(\s*{\s*([^}]+)\s*}\s*(?::\s*\w+)?\s*\)\s*=>/;

    for (const line of lines) {
      let match = line.match(destructuredPropsPattern) || line.match(arrowPropsPattern);
      if (match) {
        const propsStr = match[1];
        const props = propsStr.split(',').map(p => p.trim()).filter(p => p);
        
        for (const prop of props) {
          const propName = prop.split('=')[0].split(':')[0].trim();
          if (propName && !options.some(o => o.name === propName)) {
            options.push({
              name: propName,
              type: 'unknown',
              present: true,
            });
          }
        }
      }
    }

    return options;
  }

  /**
   * Extracts JSDoc description for a prop
   */
  private extractDescription(lines: string[], propLineIndex: number): string | null {
    // Look for JSDoc comment above the prop
    for (let i = propLineIndex - 1; i >= 0 && i >= propLineIndex - 5; i--) {
      const line = lines[i].trim();
      if (line.startsWith('/**') || line.startsWith('*') || line.startsWith('//')) {
        const descMatch = line.match(/\*\s*(.+)$/) || line.match(/\/\/\s*(.+)$/);
        if (descMatch) {
          return descMatch[1].trim();
        }
      }
      if (line && !line.startsWith('*') && !line.startsWith('//')) {
        break;
      }
    }
    return null;
  }

  /**
   * Formats configuration options as a code snippet
   * 
   * @param options - Array of configuration options
   * @returns Formatted markdown string
   */
  formatAsCodeSnippet(options: ConfigurationOption[]): string {
    if (options.length === 0) {
      return 'No configuration options found.';
    }

    const lines: string[] = [];
    lines.push('```typescript');
    lines.push('{');
    
    for (const option of options) {
      const marker = option.present ? '✅' : '❌';
      const desc = option.description ? ` // ${option.description}` : '';
      lines.push(`  ${option.name}: ${option.type};  ${marker}${desc}`);
    }
    
    lines.push('}');
    lines.push('```');
    
    return lines.join('\n');
  }

  /**
   * Formats configuration options as checkboxes
   * 
   * @param options - Array of configuration options
   * @returns Formatted markdown string
   */
  formatAsCheckboxes(options: ConfigurationOption[]): string {
    if (options.length === 0) {
      return 'No configuration options defined.';
    }

    return options
      .map(option => {
        const marker = option.present ? '✅' : '❌';
        const checked = option.present ? 'x' : ' ';
        return `- [${checked}] ${marker} ${option.name}: ${option.type}`;
      })
      .join('\n');
  }
}


// ============================================================================
// Toggle Capability Checker
// ============================================================================

/**
 * ToggleCapabilityChecker - Checks if feature can be toggled on/off
 * 
 * Determines if the feature can be toggled via props or configuration.
 */
export class ToggleCapabilityChecker {
  /**
   * Checks if the feature can be toggled on/off
   * 
   * @param code - Source code to analyze
   * @param filePath - Path to the file
   * @returns Whether the feature can be toggled
   */
  check(code: string, filePath: string): boolean {
    // Look for common toggle patterns
    const togglePatterns = [
      /enabled\s*[?:]?\s*:\s*boolean/i,
      /disabled\s*[?:]?\s*:\s*boolean/i,
      /visible\s*[?:]?\s*:\s*boolean/i,
      /hidden\s*[?:]?\s*:\s*boolean/i,
      /show\w*\s*[?:]?\s*:\s*boolean/i,
      /hide\w*\s*[?:]?\s*:\s*boolean/i,
      /active\s*[?:]?\s*:\s*boolean/i,
      /isEnabled/i,
      /isDisabled/i,
      /isVisible/i,
      /isHidden/i,
      /isActive/i,
      /toggle\w*/i,
    ];

    for (const pattern of togglePatterns) {
      if (pattern.test(code)) {
        return true;
      }
    }

    // Check for conditional rendering patterns
    const conditionalPatterns = [
      /{\s*\w+\s*&&\s*</,  // {condition && <Component />}
      /{\s*\w+\s*\?\s*</,  // {condition ? <Component /> : null}
      /if\s*\(\s*!?\w+\s*\)\s*return\s*null/,  // if (!condition) return null
    ];

    for (const pattern of conditionalPatterns) {
      if (pattern.test(code)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Documents the toggle capability
   * 
   * @param hasToggle - Whether toggle capability exists
   * @param code - Source code for additional context
   * @returns Documentation string
   */
  document(hasToggle: boolean, code: string): string {
    if (!hasToggle) {
      return 'Feature cannot be toggled on/off via props or configuration.';
    }

    const toggleProps: string[] = [];
    
    // Find specific toggle props
    const propPatterns = [
      { pattern: /enabled/i, name: 'enabled' },
      { pattern: /disabled/i, name: 'disabled' },
      { pattern: /visible/i, name: 'visible' },
      { pattern: /hidden/i, name: 'hidden' },
      { pattern: /show\w*/i, name: 'show*' },
      { pattern: /isActive/i, name: 'isActive' },
    ];

    for (const { pattern, name } of propPatterns) {
      if (pattern.test(code)) {
        toggleProps.push(name);
      }
    }

    if (toggleProps.length > 0) {
      return `Feature can be toggled via: ${toggleProps.join(', ')}`;
    }

    return 'Feature can be toggled via conditional rendering.';
  }
}


// ============================================================================
// Extensibility Checker
// ============================================================================

/**
 * ExtensibilityChecker - Checks for hooks and callbacks for custom behavior
 * 
 * Detects extension points and classifies extensibility level.
 */
export class ExtensibilityChecker {
  /**
   * Checks extensibility of the code
   * 
   * @param code - Source code to analyze
   * @param filePath - Path to the file
   * @returns Extensibility assessment
   */
  check(code: string, filePath: string): ExtensibilityAssessment {
    const hasHooksCallbacks = this.hasHooksOrCallbacks(code);
    const hasSomeExtensionPoints = this.hasSomeExtensionPoints(code);
    const isHardcoded = this.isHardcoded(code, hasHooksCallbacks, hasSomeExtensionPoints);
    const details = this.generateDetails(code, hasHooksCallbacks, hasSomeExtensionPoints, isHardcoded);

    return {
      hasHooksCallbacks,
      hasSomeExtensionPoints,
      isHardcoded,
      details,
    };
  }

  /**
   * Checks for hooks and callbacks
   */
  private hasHooksOrCallbacks(code: string): boolean {
    const patterns = [
      /on\w+\s*[?:]?\s*:\s*\([^)]*\)\s*=>/,  // onEvent: () => void
      /on\w+\s*[?:]?\s*:\s*\w*Function/,      // onEvent: Function
      /callback\s*[?:]?\s*:/i,                 // callback prop
      /handler\s*[?:]?\s*:/i,                  // handler prop
      /render\w+\s*[?:]?\s*:/,                 // renderItem, renderHeader, etc.
      /\w+Render\s*[?:]?\s*:/,                 // customRender, itemRender, etc.
      /children\s*[?:]?\s*:/,                  // children prop (render prop pattern)
      /component\s*[?:]?\s*:/i,                // component prop
      /as\s*[?:]?\s*:/,                        // as prop (polymorphic)
    ];

    for (const pattern of patterns) {
      if (pattern.test(code)) {
        return true;
      }
    }

    // Check for multiple callback props (strong indicator)
    const callbackCount = (code.match(/on[A-Z]\w*\s*[?:]?\s*:/g) || []).length;
    return callbackCount >= 2;
  }

  /**
   * Checks for some extension points
   */
  private hasSomeExtensionPoints(code: string): boolean {
    const patterns = [
      /className\s*[?:]?\s*:/,                 // className prop
      /style\s*[?:]?\s*:/,                     // style prop
      /ref\s*[?:]?\s*:/,                       // ref forwarding
      /\.\.\.\w+/,                             // spread props
      /forwardRef/,                            // forwardRef usage
      /useImperativeHandle/,                   // imperative handle
      /data-\w+/,                              // data attributes
      /aria-\w+/,                              // aria attributes
    ];

    for (const pattern of patterns) {
      if (pattern.test(code)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Determines if code is hardcoded
   */
  private isHardcoded(
    code: string,
    hasHooksCallbacks: boolean,
    hasSomeExtensionPoints: boolean
  ): boolean {
    // If it has hooks/callbacks or extension points, it's not hardcoded
    if (hasHooksCallbacks || hasSomeExtensionPoints) {
      return false;
    }

    // Check for hardcoded indicators
    const hardcodedPatterns = [
      /const\s+\w+\s*=\s*['"][^'"]+['"]/,     // Hardcoded strings
      /style\s*=\s*{\s*{[^}]+}\s*}/,          // Inline styles without props
    ];

    let hardcodedCount = 0;
    for (const pattern of hardcodedPatterns) {
      if (pattern.test(code)) {
        hardcodedCount++;
      }
    }

    // Check for lack of props
    const hasProps = /props\.|{\s*\w+\s*}/.test(code);
    
    return !hasProps || hardcodedCount > 2;
  }

  /**
   * Generates details about extensibility
   */
  private generateDetails(
    code: string,
    hasHooksCallbacks: boolean,
    hasSomeExtensionPoints: boolean,
    isHardcoded: boolean
  ): string {
    const details: string[] = [];

    if (hasHooksCallbacks) {
      const callbacks = code.match(/on[A-Z]\w*\s*[?:]?\s*:/g) || [];
      if (callbacks.length > 0) {
        details.push(`Callbacks found: ${callbacks.map(c => c.replace(/[?:]/g, '').trim()).join(', ')}`);
      }
      
      if (/render\w+\s*[?:]?\s*:/.test(code)) {
        details.push('Render props pattern available');
      }
      
      if (/children\s*[?:]?\s*:/.test(code)) {
        details.push('Children prop for composition');
      }
    }

    if (hasSomeExtensionPoints) {
      const extensionPoints: string[] = [];
      if (/className\s*[?:]?\s*:/.test(code)) extensionPoints.push('className');
      if (/style\s*[?:]?\s*:/.test(code)) extensionPoints.push('style');
      if (/forwardRef/.test(code)) extensionPoints.push('ref forwarding');
      if (/\.\.\.\w+/.test(code)) extensionPoints.push('spread props');
      
      if (extensionPoints.length > 0) {
        details.push(`Extension points: ${extensionPoints.join(', ')}`);
      }
    }

    if (isHardcoded) {
      details.push('Implementation appears hardcoded with limited customization options');
    }

    return details.length > 0 ? details.join('. ') : 'No specific extensibility details found.';
  }

  /**
   * Formats extensibility as checkboxes
   * 
   * @param assessment - Extensibility assessment
   * @returns Formatted markdown string
   */
  formatAsCheckboxes(assessment: ExtensibilityAssessment): string {
    const lines: string[] = [];

    if (assessment.hasHooksCallbacks) {
      lines.push('- [x] ✅ Hooks/callbacks for custom behavior');
    } else {
      lines.push('- [ ] ❌ Hooks/callbacks for custom behavior');
    }

    if (assessment.hasSomeExtensionPoints) {
      lines.push('- [x] ⚠️ Some extension points');
    } else {
      lines.push('- [ ] ⚠️ Some extension points');
    }

    if (assessment.isHardcoded) {
      lines.push('- [x] ❌ Hardcoded, not extensible');
    } else {
      lines.push('- [ ] ❌ Hardcoded, not extensible');
    }

    return lines.join('\n');
  }
}



// ============================================================================
// Feature Interaction Analyzer
// ============================================================================

/**
 * FeatureInteractionAnalyzer - Analyzes how feature works with other features
 * 
 * Examines imports, dependencies, and integration patterns to understand
 * how the feature interacts with other features in the component.
 */
export class FeatureInteractionAnalyzer {
  /**
   * Analyzes feature interactions
   * 
   * @param code - Source code to analyze
   * @param filePath - Path to the file
   * @param featureName - Name of the feature being analyzed
   * @returns Description of feature interactions
   */
  analyze(code: string, filePath: string, featureName: string): string {
    const interactions: string[] = [];

    // Analyze imports for dependencies
    const importedFeatures = this.analyzeImports(code);
    if (importedFeatures.length > 0) {
      interactions.push(`Imports from: ${importedFeatures.join(', ')}`);
    }

    // Analyze context usage
    const contextUsage = this.analyzeContextUsage(code);
    if (contextUsage.length > 0) {
      interactions.push(`Uses contexts: ${contextUsage.join(', ')}`);
    }

    // Analyze state sharing patterns
    const stateSharing = this.analyzeStateSharing(code);
    if (stateSharing) {
      interactions.push(stateSharing);
    }

    // Analyze event propagation
    const eventPropagation = this.analyzeEventPropagation(code);
    if (eventPropagation) {
      interactions.push(eventPropagation);
    }

    // Analyze component composition
    const composition = this.analyzeComposition(code);
    if (composition) {
      interactions.push(composition);
    }

    if (interactions.length === 0) {
      return 'Feature appears to be self-contained with minimal external interactions.';
    }

    return interactions.join('. ') + '.';
  }

  /**
   * Analyzes imports for feature dependencies
   */
  private analyzeImports(code: string): string[] {
    const features: string[] = [];
    const importPattern = /import\s+(?:{[^}]+}|\w+)\s+from\s+['"]([^'"]+)['"]/g;
    
    let match;
    while ((match = importPattern.exec(code)) !== null) {
      const importPath = match[1];
      
      // Skip node_modules and relative utils
      if (importPath.startsWith('.') && !importPath.includes('utils')) {
        const featureName = importPath.split('/').pop()?.replace(/\.\w+$/, '');
        if (featureName && !features.includes(featureName)) {
          features.push(featureName);
        }
      }
      
      // Check for package imports that might be features
      if (importPath.startsWith('@') && importPath.includes('/')) {
        const packageName = importPath.split('/').slice(0, 2).join('/');
        if (!features.includes(packageName)) {
          features.push(packageName);
        }
      }
    }

    return features;
  }

  /**
   * Analyzes React context usage
   */
  private analyzeContextUsage(code: string): string[] {
    const contexts: string[] = [];
    
    // Look for useContext calls
    const useContextPattern = /useContext\s*\(\s*(\w+)\s*\)/g;
    let match;
    while ((match = useContextPattern.exec(code)) !== null) {
      const contextName = match[1];
      if (!contexts.includes(contextName)) {
        contexts.push(contextName);
      }
    }

    // Look for Context.Provider or Context.Consumer
    const providerPattern = /(\w+)\.Provider|(\w+)\.Consumer/g;
    while ((match = providerPattern.exec(code)) !== null) {
      const contextName = match[1] || match[2];
      if (contextName && !contexts.includes(contextName)) {
        contexts.push(contextName);
      }
    }

    return contexts;
  }

  /**
   * Analyzes state sharing patterns
   */
  private analyzeStateSharing(code: string): string | null {
    const patterns: string[] = [];

    // Check for Redux
    if (/useSelector|useDispatch|connect\s*\(/.test(code)) {
      patterns.push('Redux state management');
    }

    // Check for Zustand
    if (/useStore|create\s*\(\s*\(set\)/.test(code)) {
      patterns.push('Zustand store');
    }

    // Check for Jotai
    if (/useAtom|atom\s*\(/.test(code)) {
      patterns.push('Jotai atoms');
    }

    // Check for Recoil
    if (/useRecoilState|useRecoilValue/.test(code)) {
      patterns.push('Recoil state');
    }

    // Check for prop drilling (passing many props)
    const propCount = (code.match(/\w+\s*=\s*{\s*\w+\s*}/g) || []).length;
    if (propCount > 5) {
      patterns.push('Prop-based state sharing');
    }

    if (patterns.length > 0) {
      return `State sharing: ${patterns.join(', ')}`;
    }

    return null;
  }

  /**
   * Analyzes event propagation patterns
   */
  private analyzeEventPropagation(code: string): string | null {
    const eventPatterns: string[] = [];

    // Check for custom events
    if (/dispatchEvent|CustomEvent/.test(code)) {
      eventPatterns.push('Custom DOM events');
    }

    // Check for event emitters
    if (/emit\s*\(|EventEmitter|on\s*\(\s*['"]/.test(code)) {
      eventPatterns.push('Event emitter pattern');
    }

    // Check for callback chains
    const callbackCount = (code.match(/on[A-Z]\w*\s*\(/g) || []).length;
    if (callbackCount > 3) {
      eventPatterns.push('Callback-based communication');
    }

    if (eventPatterns.length > 0) {
      return `Event propagation: ${eventPatterns.join(', ')}`;
    }

    return null;
  }

  /**
   * Analyzes component composition patterns
   */
  private analyzeComposition(code: string): string | null {
    const compositionPatterns: string[] = [];

    // Check for children rendering
    if (/\{children\}|props\.children/.test(code)) {
      compositionPatterns.push('Children composition');
    }

    // Check for render props
    if (/render\w+\s*\(|render\s*=\s*{/.test(code)) {
      compositionPatterns.push('Render props');
    }

    // Check for HOC patterns
    if (/with\w+\s*\(|export\s+default\s+\w+\s*\(\s*\w+\s*\)/.test(code)) {
      compositionPatterns.push('Higher-order component');
    }

    // Check for compound components
    if (/\w+\.\w+\s*=/.test(code)) {
      compositionPatterns.push('Compound component pattern');
    }

    if (compositionPatterns.length > 0) {
      return `Composition: ${compositionPatterns.join(', ')}`;
    }

    return null;
  }

  /**
   * Documents feature interactions
   * 
   * @param interactions - Description of interactions
   * @returns Formatted documentation string
   */
  document(interactions: string): string {
    if (!interactions || interactions.length === 0) {
      return 'No significant feature interactions detected.';
    }

    return `**Feature Interactions:**\n${interactions}`;
  }
}


// ============================================================================
// Integration Analyzer (Main Entry Point)
// ============================================================================

/**
 * IntegrationAnalyzer - Main class for analyzing integration in code
 * 
 * Combines all integration analysis components:
 * - Configuration options extraction
 * - Toggle capability checking
 * - Extensibility assessment
 * - Feature interaction analysis
 */
export class IntegrationAnalyzer {
  private configDocumenter: ConfigurationOptionsDocumenter;
  private toggleChecker: ToggleCapabilityChecker;
  private extensibilityChecker: ExtensibilityChecker;
  private interactionAnalyzer: FeatureInteractionAnalyzer;

  constructor() {
    this.configDocumenter = new ConfigurationOptionsDocumenter();
    this.toggleChecker = new ToggleCapabilityChecker();
    this.extensibilityChecker = new ExtensibilityChecker();
    this.interactionAnalyzer = new FeatureInteractionAnalyzer();
  }

  /**
   * Analyzes code for integration characteristics
   * 
   * @param code - Source code to analyze
   * @param filePath - Path to the file
   * @param featureName - Name of the feature being analyzed
   * @returns Complete integration analysis result
   */
  analyze(code: string, filePath: string, featureName: string = 'Feature'): IntegrationAnalysisResult {
    const configurationOptions = this.configDocumenter.extractOptions(code, filePath);
    const toggleCapability = this.toggleChecker.check(code, filePath);
    const extensibility = this.extensibilityChecker.check(code, filePath);
    const featureInteractions = this.interactionAnalyzer.analyze(code, filePath, featureName);

    return {
      configurationOptions,
      extensibility,
      toggleCapability,
      featureInteractions,
    };
  }

  /**
   * Gets the configuration options documenter
   */
  getConfigDocumenter(): ConfigurationOptionsDocumenter {
    return this.configDocumenter;
  }

  /**
   * Gets the toggle capability checker
   */
  getToggleChecker(): ToggleCapabilityChecker {
    return this.toggleChecker;
  }

  /**
   * Gets the extensibility checker
   */
  getExtensibilityChecker(): ExtensibilityChecker {
    return this.extensibilityChecker;
  }

  /**
   * Gets the feature interaction analyzer
   */
  getInteractionAnalyzer(): FeatureInteractionAnalyzer {
    return this.interactionAnalyzer;
  }
}


// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets all valid integration ratings
 */
export function getValidIntegrationRatings(): IntegrationRatingString[] {
  return ['Not Compatible', 'Partial', 'Full', 'Enterprise-Level'];
}

/**
 * Creates a default integration analysis result
 */
export function createDefaultAnalysis(): IntegrationAnalysisResult {
  return {
    configurationOptions: [],
    extensibility: {
      hasHooksCallbacks: false,
      hasSomeExtensionPoints: false,
      isHardcoded: true,
      details: 'No extensibility analysis performed.',
    },
    toggleCapability: false,
    featureInteractions: '',
  };
}

/**
 * Creates a configuration option
 */
export function createConfigurationOption(
  name: string,
  type: string,
  present: boolean,
  description?: string
): ConfigurationOption {
  return {
    name,
    type,
    present,
    description,
  };
}

/**
 * Creates an extensibility assessment
 */
export function createExtensibilityAssessment(
  hasHooksCallbacks: boolean,
  hasSomeExtensionPoints: boolean,
  isHardcoded: boolean,
  details: string
): ExtensibilityAssessment {
  return {
    hasHooksCallbacks,
    hasSomeExtensionPoints,
    isHardcoded,
    details,
  };
}

/**
 * Validates that an integration evaluation has all required fields
 */
export function isValidIntegrationEvaluation(evaluation: IntegrationEvaluation): boolean {
  const validRatings = getValidIntegrationRatings();
  
  return (
    validRatings.includes(evaluation.rating) &&
    Array.isArray(evaluation.configurationOptions) &&
    typeof evaluation.extensibility.hasHooksCallbacks === 'boolean' &&
    typeof evaluation.extensibility.hasSomeExtensionPoints === 'boolean' &&
    typeof evaluation.extensibility.isHardcoded === 'boolean' &&
    typeof evaluation.extensibility.details === 'string' &&
    typeof evaluation.toggleCapability === 'boolean' &&
    typeof evaluation.featureInteractions === 'string' &&
    typeof evaluation.assessment === 'string' &&
    evaluation.assessment.length > 0
  );
}

