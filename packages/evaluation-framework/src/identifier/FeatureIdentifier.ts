/**
 * FeatureIdentifier - Identifies atomic features within component packages
 * 
 * Analyzes component files to identify distinct capabilities that serve
 * a single purpose and can be evaluated independently.
 * 
 * @module FeatureIdentifier
 */

import type {
  AtomicFeature,
  CodeBlock,
  StateUsage,
  EventHandler,
  FeatureIdentificationResult,
  ExternalDependency,
} from '../../types/evaluation';

/**
 * Represents a parsed code element that may be part of a feature
 */
interface ParsedElement {
  type: 'state' | 'effect' | 'handler' | 'function' | 'jsx-block';
  name: string;
  startLine: number;
  endLine: number;
  content: string;
  relatedState?: string[];
  relatedHandlers?: string[];
}

/**
 * Configuration options for feature identification
 */
export interface FeatureIdentifierOptions {
  /** Minimum lines of code to consider as a feature */
  minLinesOfCode?: number;
  /** Whether to include utility functions as features */
  includeUtilities?: boolean;
  /** Custom patterns to identify features */
  customPatterns?: RegExp[];
}

/**
 * Default configuration for feature identification
 */
const DEFAULT_OPTIONS: Required<FeatureIdentifierOptions> = {
  minLinesOfCode: 3,
  includeUtilities: false,
  customPatterns: [],
};

/**
 * FeatureIdentifier class for identifying atomic features in component code
 * 
 * @example
 * ```typescript
 * const identifier = new FeatureIdentifier();
 * const result = identifier.identifyFeatures(sourceCode, 'StatusBar.jsx');
 * console.log(result.identifiedFeatures);
 * ```
 */
export class FeatureIdentifier {
  private options: Required<FeatureIdentifierOptions>;

  constructor(options: FeatureIdentifierOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Identifies atomic features within a component's source code
   * 
   * @param sourceCode - The source code to analyze
   * @param fileName - The name of the file being analyzed
   * @param componentPath - Path to the component package
   * @returns Feature identification result with all identified features
   */
  identifyFeatures(
    sourceCode: string,
    fileName: string,
    componentPath: string = ''
  ): FeatureIdentificationResult {
    const lines = sourceCode.split('\n');
    const totalLinesOfCode = lines.length;

    // Parse the source code for various elements
    const stateUsages = this.parseStateUsages(sourceCode, fileName);
    const eventHandlers = this.parseEventHandlers(sourceCode, fileName);
    const effects = this.parseEffects(sourceCode, fileName);
    const functions = this.parseFunctions(sourceCode, fileName);
    const imports = this.parseImports(sourceCode);

    // Group related elements into features
    const features = this.groupIntoFeatures(
      sourceCode,
      fileName,
      stateUsages,
      eventHandlers,
      effects,
      functions
    );

    // Extract external dependencies from imports
    const externalDependencies = this.extractExternalDependencies(imports);

    // Determine component type
    const componentType = this.determineComponentType(componentPath);

    return {
      componentPath,
      componentType,
      identifiedFeatures: features,
      externalDependencies,
      totalLinesOfCode,
    };
  }

  /**
   * Parses useState and useReducer hooks from source code
   */
  parseStateUsages(sourceCode: string, fileName: string): StateUsage[] {
    const stateUsages: StateUsage[] = [];
    const lines = sourceCode.split('\n');

    // Pattern for useState: const [name, setName] = useState(...)
    const useStatePattern = /const\s+\[(\w+),\s*set(\w+)\]\s*=\s*useState/g;
    // Pattern for useReducer: const [state, dispatch] = useReducer(...)
    const useReducerPattern = /const\s+\[(\w+),\s*(\w+)\]\s*=\s*useReducer/g;

    lines.forEach((line, index) => {
      let match;

      // Check for useState
      useStatePattern.lastIndex = 0;
      while ((match = useStatePattern.exec(line)) !== null) {
        stateUsages.push({
          hookType: 'useState',
          stateName: match[1],
          file: fileName,
          line: index + 1,
        });
      }

      // Check for useReducer
      useReducerPattern.lastIndex = 0;
      while ((match = useReducerPattern.exec(line)) !== null) {
        stateUsages.push({
          hookType: 'useReducer',
          stateName: match[1],
          file: fileName,
          line: index + 1,
        });
      }
    });

    return stateUsages;
  }

  /**
   * Parses event handlers from source code
   */
  parseEventHandlers(sourceCode: string, fileName: string): EventHandler[] {
    const handlers: EventHandler[] = [];
    const lines = sourceCode.split('\n');

    // Patterns for event handlers
    const handlerPatterns = [
      // Arrow function handlers: const handleClick = () => ...
      /const\s+(handle\w+|on\w+)\s*=\s*(?:\([^)]*\)|[^=])\s*=>/,
      // Function declaration handlers: function handleClick() ...
      /function\s+(handle\w+|on\w+)\s*\(/,
      // JSX event handlers: onClick={...}
      /\b(on[A-Z]\w+)\s*=\s*\{/,
    ];

    lines.forEach((line, index) => {
      for (const pattern of handlerPatterns) {
        const match = pattern.exec(line);
        if (match) {
          const handlerName = match[1];
          // Determine event type from handler name
          const eventType = this.inferEventType(handlerName);
          
          // Avoid duplicates
          if (!handlers.some(h => h.handlerName === handlerName && h.line === index + 1)) {
            handlers.push({
              handlerName,
              eventType,
              file: fileName,
              line: index + 1,
            });
          }
        }
      }
    });

    return handlers;
  }

  /**
   * Parses useEffect hooks from source code
   */
  parseEffects(sourceCode: string, fileName: string): ParsedElement[] {
    const effects: ParsedElement[] = [];
    const lines = sourceCode.split('\n');
    
    let inEffect = false;
    let effectStart = 0;
    let braceCount = 0;
    let effectContent: string[] = [];

    lines.forEach((line, index) => {
      if (line.includes('useEffect(') || line.includes('useLayoutEffect(')) {
        inEffect = true;
        effectStart = index + 1;
        braceCount = 0;
        effectContent = [];
      }

      if (inEffect) {
        effectContent.push(line);
        braceCount += (line.match(/\{/g) || []).length;
        braceCount -= (line.match(/\}/g) || []).length;

        // Check for closing of useEffect
        if (braceCount <= 0 && effectContent.length > 1) {
          const content = effectContent.join('\n');
          const relatedState = this.extractRelatedState(content);
          
          effects.push({
            type: 'effect',
            name: `Effect at line ${effectStart}`,
            startLine: effectStart,
            endLine: index + 1,
            content,
            relatedState,
          });
          
          inEffect = false;
          effectContent = [];
        }
      }
    });

    return effects;
  }

  /**
   * Parses function declarations and expressions
   */
  parseFunctions(sourceCode: string, fileName: string): ParsedElement[] {
    const functions: ParsedElement[] = [];
    const lines = sourceCode.split('\n');

    // Pattern for function declarations and arrow functions
    const functionPatterns = [
      /^[\t ]*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/,
      /^[\t ]*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?function/,
      /^[\t ]*(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/,
    ];

    let currentFunction: { name: string; startLine: number; content: string[] } | null = null;
    let braceCount = 0;

    lines.forEach((line, index) => {
      // Check for function start
      if (!currentFunction) {
        for (const pattern of functionPatterns) {
          const match = pattern.exec(line);
          if (match) {
            currentFunction = {
              name: match[1],
              startLine: index + 1,
              content: [line],
            };
            braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
            break;
          }
        }
      } else {
        currentFunction.content.push(line);
        braceCount += (line.match(/\{/g) || []).length;
        braceCount -= (line.match(/\}/g) || []).length;

        // Check for function end
        if (braceCount <= 0) {
          const content = currentFunction.content.join('\n');
          functions.push({
            type: 'function',
            name: currentFunction.name,
            startLine: currentFunction.startLine,
            endLine: index + 1,
            content,
            relatedState: this.extractRelatedState(content),
            relatedHandlers: this.extractRelatedHandlers(content),
          });
          currentFunction = null;
          braceCount = 0;
        }
      }
    });

    return functions;
  }

  /**
   * Parses import statements from source code
   */
  parseImports(sourceCode: string): Array<{ source: string; imports: string[] }> {
    const imports: Array<{ source: string; imports: string[] }> = [];
    const lines = sourceCode.split('\n');

    const importPattern = /import\s+(?:\{([^}]+)\}|(\w+))\s+from\s+['"]([^'"]+)['"]/;

    for (const line of lines) {
      const match = importPattern.exec(line);
      if (match) {
        const namedImports = match[1] ? match[1].split(',').map(s => s.trim()) : [];
        const defaultImport = match[2] ? [match[2]] : [];
        const source = match[3];

        imports.push({
          source,
          imports: [...namedImports, ...defaultImport],
        });
      }
    }

    return imports;
  }

  /**
   * Groups parsed elements into atomic features
   */
  private groupIntoFeatures(
    sourceCode: string,
    fileName: string,
    stateUsages: StateUsage[],
    eventHandlers: EventHandler[],
    effects: ParsedElement[],
    functions: ParsedElement[]
  ): AtomicFeature[] {
    const features: AtomicFeature[] = [];
    const usedElements = new Set<string>();
    let featureId = 1;

    // Group state with related effects and handlers
    for (const state of stateUsages) {
      const relatedEffects = effects.filter(e => 
        e.relatedState?.includes(state.stateName)
      );
      const relatedHandlers = eventHandlers.filter(h =>
        this.isHandlerRelatedToState(sourceCode, h.handlerName, state.stateName)
      );

      if (relatedEffects.length > 0 || relatedHandlers.length > 0) {
        const featureName = this.generateFeatureName(state.stateName, relatedEffects, relatedHandlers);
        const description = this.generateFeatureDescription(state, relatedEffects, relatedHandlers);
        
        // Calculate line range
        const allLines = [
          state.line,
          ...relatedEffects.flatMap(e => [e.startLine, e.endLine]),
          ...relatedHandlers.map(h => h.line),
        ];
        const startLine = Math.min(...allLines);
        const endLine = Math.max(...allLines);
        const linesOfCode = this.calculateLinesOfCode(sourceCode, startLine, endLine);

        // Build code blocks
        const codeBlocks = this.buildCodeBlocks(
          sourceCode,
          fileName,
          state,
          relatedEffects,
          relatedHandlers
        );

        features.push({
          id: featureId++,
          name: featureName,
          description,
          linesOfCode,
          primaryLocation: {
            file: fileName,
            startLine,
            endLine,
          },
          codeBlocks,
          stateManagement: [state],
          eventHandlers: relatedHandlers,
        });

        // Mark elements as used
        usedElements.add(`state:${state.stateName}`);
        relatedEffects.forEach(e => usedElements.add(`effect:${e.startLine}`));
        relatedHandlers.forEach(h => usedElements.add(`handler:${h.handlerName}`));
      }
    }

    // Add standalone effects as features
    for (const effect of effects) {
      if (!usedElements.has(`effect:${effect.startLine}`)) {
        const featureName = this.inferEffectFeatureName(effect.content);
        const description = this.inferEffectDescription(effect.content);
        const linesOfCode = effect.endLine - effect.startLine + 1;

        features.push({
          id: featureId++,
          name: featureName,
          description,
          linesOfCode,
          primaryLocation: {
            file: fileName,
            startLine: effect.startLine,
            endLine: effect.endLine,
          },
          codeBlocks: [{
            file: fileName,
            startLine: effect.startLine,
            endLine: effect.endLine,
            content: effect.content,
            language: this.inferLanguage(fileName),
          }],
          stateManagement: [],
          eventHandlers: [],
        });

        usedElements.add(`effect:${effect.startLine}`);
      }
    }

    // Add standalone handlers as features
    for (const handler of eventHandlers) {
      if (!usedElements.has(`handler:${handler.handlerName}`)) {
        const handlerFunction = functions.find(f => f.name === handler.handlerName);
        if (handlerFunction) {
          const linesOfCode = handlerFunction.endLine - handlerFunction.startLine + 1;
          
          if (linesOfCode >= this.options.minLinesOfCode) {
            features.push({
              id: featureId++,
              name: this.formatHandlerName(handler.handlerName),
              description: `Handles ${handler.eventType} events`,
              linesOfCode,
              primaryLocation: {
                file: fileName,
                startLine: handlerFunction.startLine,
                endLine: handlerFunction.endLine,
              },
              codeBlocks: [{
                file: fileName,
                startLine: handlerFunction.startLine,
                endLine: handlerFunction.endLine,
                content: handlerFunction.content,
                language: this.inferLanguage(fileName),
              }],
              stateManagement: [],
              eventHandlers: [handler],
            });
          }
        }
        usedElements.add(`handler:${handler.handlerName}`);
      }
    }

    // Add significant utility functions as features if configured
    if (this.options.includeUtilities) {
      for (const func of functions) {
        const funcKey = `function:${func.name}`;
        if (!usedElements.has(funcKey) && !this.isComponentFunction(func.name)) {
          const linesOfCode = func.endLine - func.startLine + 1;
          
          if (linesOfCode >= this.options.minLinesOfCode) {
            features.push({
              id: featureId++,
              name: this.formatFunctionName(func.name),
              description: this.inferFunctionDescription(func.content),
              linesOfCode,
              primaryLocation: {
                file: fileName,
                startLine: func.startLine,
                endLine: func.endLine,
              },
              codeBlocks: [{
                file: fileName,
                startLine: func.startLine,
                endLine: func.endLine,
                content: func.content,
                language: this.inferLanguage(fileName),
              }],
              stateManagement: [],
              eventHandlers: [],
            });
          }
        }
      }
    }

    return features;
  }

  /**
   * Extracts external dependencies from imports
   */
  private extractExternalDependencies(
    imports: Array<{ source: string; imports: string[] }>
  ): ExternalDependency[] {
    const dependencies: ExternalDependency[] = [];

    for (const imp of imports) {
      // Skip relative imports (local files)
      if (imp.source.startsWith('.') || imp.source.startsWith('/')) {
        continue;
      }

      // Skip React itself
      if (imp.source === 'react' || imp.source === 'react-dom') {
        continue;
      }

      dependencies.push({
        packageName: imp.source,
        purpose: `Used for ${imp.imports.join(', ')}`,
        importPath: imp.source,
      });
    }

    return dependencies;
  }

  /**
   * Determines the component type based on path
   */
  private determineComponentType(componentPath: string): 'Component' | 'Feature Package' {
    if (componentPath.includes('features/')) {
      return 'Feature Package';
    }
    return 'Component';
  }

  /**
   * Infers event type from handler name
   */
  private inferEventType(handlerName: string): string {
    const eventMap: Record<string, string> = {
      click: 'onClick',
      change: 'onChange',
      submit: 'onSubmit',
      focus: 'onFocus',
      blur: 'onBlur',
      keydown: 'onKeyDown',
      keyup: 'onKeyUp',
      keypress: 'onKeyPress',
      mouseover: 'onMouseOver',
      mouseout: 'onMouseOut',
      mouseenter: 'onMouseEnter',
      mouseleave: 'onMouseLeave',
      scroll: 'onScroll',
      toggle: 'onClick',
    };

    const lowerName = handlerName.toLowerCase();
    for (const [key, value] of Object.entries(eventMap)) {
      if (lowerName.includes(key)) {
        return value;
      }
    }

    return 'unknown';
  }

  /**
   * Extracts state variable names referenced in code
   */
  private extractRelatedState(content: string): string[] {
    const statePattern = /\b(set[A-Z]\w+)\b/g;
    const matches = content.match(statePattern) || [];
    return [...new Set(matches.map(m => m.replace(/^set/, '').toLowerCase()))];
  }

  /**
   * Extracts handler names referenced in code
   */
  private extractRelatedHandlers(content: string): string[] {
    const handlerPattern = /\b(handle\w+|on[A-Z]\w+)\b/g;
    const matches = content.match(handlerPattern) || [];
    return [...new Set(matches)];
  }

  /**
   * Checks if a handler is related to a state variable
   */
  private isHandlerRelatedToState(
    sourceCode: string,
    handlerName: string,
    stateName: string
  ): boolean {
    // Find the handler function body
    const handlerPattern = new RegExp(
      `(?:const|function)\\s+${handlerName}[^{]*\\{([^}]+)\\}`,
      's'
    );
    const match = handlerPattern.exec(sourceCode);
    
    if (match) {
      const body = match[1];
      const setterName = `set${stateName.charAt(0).toUpperCase()}${stateName.slice(1)}`;
      return body.includes(setterName) || body.includes(stateName);
    }
    
    return false;
  }

  /**
   * Generates a feature name from state and related elements
   */
  private generateFeatureName(
    stateName: string,
    effects: ParsedElement[],
    handlers: EventHandler[]
  ): string {
    // Convert camelCase to Title Case with spaces
    const formatted = stateName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();

    if (effects.some(e => e.content.includes('setInterval'))) {
      return `${formatted} Auto-Update`;
    }

    if (handlers.length > 0) {
      return `${formatted} Management`;
    }

    return `${formatted} Display`;
  }

  /**
   * Generates a description for a feature
   */
  private generateFeatureDescription(
    state: StateUsage,
    effects: ParsedElement[],
    handlers: EventHandler[]
  ): string {
    const parts: string[] = [];

    if (effects.some(e => e.content.includes('setInterval'))) {
      parts.push('Auto-updating');
    }

    parts.push(state.stateName);

    if (handlers.length > 0) {
      parts.push('with user interaction');
    }

    return parts.join(' ');
  }

  /**
   * Calculates lines of code between two line numbers
   */
  private calculateLinesOfCode(
    sourceCode: string,
    startLine: number,
    endLine: number
  ): number {
    const lines = sourceCode.split('\n').slice(startLine - 1, endLine);
    // Count non-empty, non-comment lines
    return lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 0 && !trimmed.startsWith('//');
    }).length;
  }

  /**
   * Builds code blocks for a feature
   */
  private buildCodeBlocks(
    sourceCode: string,
    fileName: string,
    state: StateUsage,
    effects: ParsedElement[],
    handlers: EventHandler[]
  ): CodeBlock[] {
    const blocks: CodeBlock[] = [];
    const lines = sourceCode.split('\n');
    const language = this.inferLanguage(fileName);

    // Add state declaration block
    blocks.push({
      file: fileName,
      startLine: state.line,
      endLine: state.line,
      content: lines[state.line - 1],
      language,
    });

    // Add effect blocks
    for (const effect of effects) {
      blocks.push({
        file: fileName,
        startLine: effect.startLine,
        endLine: effect.endLine,
        content: effect.content,
        language,
      });
    }

    return blocks;
  }

  /**
   * Infers feature name from effect content
   */
  private inferEffectFeatureName(content: string): string {
    if (content.includes('setInterval')) {
      if (content.includes('Time') || content.includes('time')) {
        return 'Time Display';
      }
      return 'Periodic Update';
    }
    if (content.includes('addEventListener')) {
      return 'Event Listener Setup';
    }
    if (content.includes('fetch') || content.includes('axios')) {
      return 'Data Fetching';
    }
    return 'Side Effect';
  }

  /**
   * Infers description from effect content
   */
  private inferEffectDescription(content: string): string {
    if (content.includes('setInterval')) {
      return 'Periodic update using setInterval';
    }
    if (content.includes('addEventListener')) {
      return 'Sets up event listeners';
    }
    if (content.includes('fetch') || content.includes('axios')) {
      return 'Fetches data from external source';
    }
    return 'Performs side effects';
  }

  /**
   * Formats handler name for display
   */
  private formatHandlerName(name: string): string {
    return name
      .replace(/^handle/, '')
      .replace(/^on/, '')
      .replace(/([A-Z])/g, ' $1')
      .trim();
  }

  /**
   * Formats function name for display
   */
  private formatFunctionName(name: string): string {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Infers function description from content
   */
  private inferFunctionDescription(content: string): string {
    if (content.includes('format')) {
      return 'Formats data for display';
    }
    if (content.includes('validate')) {
      return 'Validates input data';
    }
    if (content.includes('calculate')) {
      return 'Performs calculations';
    }
    return 'Utility function';
  }

  /**
   * Checks if a function is the main component function
   */
  private isComponentFunction(name: string): boolean {
    // Component functions typically start with uppercase
    return /^[A-Z]/.test(name);
  }

  /**
   * Infers programming language from file extension
   */
  private inferLanguage(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'mjs': 'javascript',
      'cjs': 'javascript',
    };
    return languageMap[ext || ''] || 'javascript';
  }
}
