/**
 * EvaluationOrchestrator - Coordinates the evaluation process for components
 * 
 * Orchestrates feature identification, runs all 8 evaluation dimensions,
 * generates AGREEMENT.md files, and aggregates results for SUMMARY_AGREEMENT.md.
 * 
 * @module cli/EvaluationOrchestrator
 */

import type { DiscoveredPackage } from './ComponentTraverser';
import type { ProgressEvent } from './ProgressReporter';
import type { 
  AtomicFeature, 
  FeatureIdentificationResult,
  CodeEvidence,
} from '../../types/evaluation';
import type { 
  FeatureEvaluation,
  CompletenessEvaluation,
  CodeQualityEvaluation,
  DocumentationEvaluation,
  ReliabilityEvaluation,
  PerformanceEvaluation,
  IntegrationEvaluation,
  MaintenanceEvaluation,
  StressCollapseEvaluation,
  FeatureIsolationClassification,
} from '../../types/dimensions';
import type { AgreementDocument } from '../../types/documents';

import { FeatureIdentifier } from '../identifier/FeatureIdentifier';
import { AgreementGenerator } from '../generators/AgreementGenerator';
import { SummaryGenerator } from '../generators/SummaryGenerator';

/**
 * Configuration for the evaluation orchestrator
 */
export interface OrchestratorConfig {
  /** Base path for the project */
  basePath: string;
  /** Whether to write files */
  writeFiles: boolean;
  /** Project name for summary */
  projectName: string;
  /** Progress callback */
  onProgress?: (event: ProgressEvent) => void;
}

/**
 * Result of evaluating a single component
 */
export interface ComponentEvaluationResult {
  /** Whether evaluation succeeded */
  success: boolean;
  /** Path to generated AGREEMENT.md */
  filePath: string;
  /** Number of features identified */
  featuresIdentified: number;
  /** The generated document */
  document?: AgreementDocument;
  /** Error message if failed */
  error?: string;
}

/**
 * Result of evaluating all components
 */
export interface AllEvaluationResult {
  /** Whether all evaluations succeeded */
  success: boolean;
  /** Number of components evaluated */
  componentsEvaluated: number;
  /** Total features identified across all components */
  totalFeaturesIdentified: number;
  /** All generated documents */
  documents: AgreementDocument[];
  /** Errors encountered */
  errors: string[];
}

/**
 * Result of generating summary
 */
export interface SummaryResult {
  /** Whether generation succeeded */
  success: boolean;
  /** Path to generated SUMMARY_AGREEMENT.md */
  filePath: string;
  /** Number of components aggregated */
  componentsAggregated: number;
  /** Total features in summary */
  totalFeatures: number;
  /** Error message if failed */
  error?: string;
}

/**
 * EvaluationOrchestrator class for coordinating evaluations
 */
export class EvaluationOrchestrator {
  private config: OrchestratorConfig;
  private featureIdentifier: FeatureIdentifier;
  private agreementGenerator: AgreementGenerator;
  private summaryGenerator: SummaryGenerator;
  private evaluatedDocuments: AgreementDocument[] = [];

  constructor(config: OrchestratorConfig) {
    this.config = config;
    this.featureIdentifier = new FeatureIdentifier({ minLinesOfCode: 3, includeUtilities: true });
    this.agreementGenerator = new AgreementGenerator({ basePath: config.basePath, writeFiles: config.writeFiles });
    this.summaryGenerator = new SummaryGenerator({ projectName: config.projectName, basePath: config.basePath, writeFiles: config.writeFiles });
  }

  async evaluateComponent(componentPath: string): Promise<ComponentEvaluationResult> {
    try {
      this.reportProgress({ type: 'component-start', message: `Starting evaluation of ${componentPath}`, component: componentPath });
      const sourceCode = await this.readSourceFiles(componentPath);
      if (!sourceCode) {
        return { success: false, filePath: '', featuresIdentified: 0, error: `No source files found in ${componentPath}` };
      }
      this.reportProgress({ type: 'feature-identification', message: 'Identifying atomic features...', component: componentPath });
      const componentName = this.extractComponentName(componentPath);
      const componentType = this.determineComponentType(componentPath);
      const mainFileName = this.getMainFileName(componentPath);
      const identificationResult = this.featureIdentifier.identifyFeatures(sourceCode, mainFileName, componentPath);
      this.reportProgress({ type: 'features-found', message: `Found ${identificationResult.identifiedFeatures.length} atomic features`, component: componentPath, current: identificationResult.identifiedFeatures.length });
      const featureEvaluations: FeatureEvaluation[] = [];
      for (let i = 0; i < identificationResult.identifiedFeatures.length; i++) {
        const feature = identificationResult.identifiedFeatures[i];
        this.reportProgress({ type: 'feature-evaluation', message: `Evaluating feature ${i + 1}/${identificationResult.identifiedFeatures.length}: ${feature.name}`, component: componentPath, current: i + 1, total: identificationResult.identifiedFeatures.length });
        const evaluation = this.evaluateFeature(feature, sourceCode, componentPath);
        featureEvaluations.push(evaluation);
      }
      this.reportProgress({ type: 'generating', message: 'Generating AGREEMENT.md...', component: componentPath });
      const result = await this.agreementGenerator.generate(componentPath, componentName, componentType, identificationResult, featureEvaluations);
      if (result.success) {
        this.evaluatedDocuments.push(result.document);
        this.reportProgress({ type: 'component-complete', message: `Completed evaluation of ${componentName}`, component: componentPath });
        return { success: true, filePath: result.filePath, featuresIdentified: identificationResult.identifiedFeatures.length, document: result.document };
      }
      return { success: false, filePath: result.filePath, featuresIdentified: identificationResult.identifiedFeatures.length, error: result.error };
    } catch (error) {
      return { success: false, filePath: '', featuresIdentified: 0, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async evaluateAll(packages: DiscoveredPackage[]): Promise<AllEvaluationResult> {
    const documents: AgreementDocument[] = [];
    const errors: string[] = [];
    let totalFeatures = 0;
    for (let i = 0; i < packages.length; i++) {
      const pkg = packages[i];
      this.reportProgress({ type: 'progress', message: `Evaluating ${pkg.name} (${i + 1}/${packages.length})`, current: i + 1, total: packages.length });
      const result = await this.evaluateComponent(pkg.path);
      if (result.success && result.document) {
        documents.push(result.document);
        totalFeatures += result.featuresIdentified;
      } else if (result.error) {
        errors.push(`${pkg.name}: ${result.error}`);
      }
    }
    this.evaluatedDocuments = documents;
    return { success: errors.length === 0, componentsEvaluated: documents.length, totalFeaturesIdentified: totalFeatures, documents, errors };
  }

  async generateSummary(): Promise<SummaryResult> {
    try {
      let documents = this.evaluatedDocuments;
      if (documents.length === 0) documents = await this.loadExistingAgreements();
      if (documents.length === 0) {
        return { success: false, filePath: '', componentsAggregated: 0, totalFeatures: 0, error: 'No AGREEMENT.md files found to aggregate' };
      }
      this.reportProgress({ type: 'generating', message: `Generating summary from ${documents.length} components...` });
      const result = await this.summaryGenerator.generate(documents);
      const totalFeatures = documents.reduce((sum, doc) => sum + doc.featureEvaluations.length, 0);
      return { success: result.success, filePath: result.filePath, componentsAggregated: documents.length, totalFeatures, error: result.error };
    } catch (error) {
      return { success: false, filePath: '', componentsAggregated: 0, totalFeatures: 0, error: error instanceof Error ? error.message : String(error) };
    }
  }


  private evaluateFeature(feature: AtomicFeature, sourceCode: string, componentPath: string): FeatureEvaluation {
    const featureCode = this.extractFeatureCode(feature, sourceCode);
    const fileName = feature.primaryLocation.file;
    const evidence: CodeEvidence = {
      filePath: fileName,
      lineNumbers: { start: feature.primaryLocation.startLine, end: feature.primaryLocation.endLine },
      codeSnippet: featureCode.substring(0, 500),
      language: this.inferLanguage(fileName),
    };
    const hasErrorHandling = /try\s*\{|\.catch\(|catch\s*\(/.test(featureCode);
    const hasDocumentation = /\/\*\*[\s\S]*?\*\/|\/\/\s*\w+/.test(featureCode);
    const hasOptimizations = /useMemo|useCallback|React\.memo|memo\(/.test(featureCode);
    const antiPatterns = this.detectAntiPatterns(featureCode);
    const featureIsolation = this.classifyFeatureIsolation(feature);
    return {
      feature,
      completeness: this.createCompletenessEvaluation(feature, evidence),
      codeQuality: this.createCodeQualityEvaluation(feature, featureIsolation, antiPatterns),
      documentation: this.createDocumentationEvaluation(feature, hasDocumentation, evidence),
      reliability: this.createReliabilityEvaluation(feature, hasErrorHandling, evidence),
      performance: this.createPerformanceEvaluation(feature, hasOptimizations, featureCode, evidence),
      integration: this.createIntegrationEvaluation(feature, featureCode, evidence),
      maintenance: this.createMaintenanceEvaluation(feature, featureIsolation),
      stressCollapse: this.createStressCollapseEvaluation(feature, featureCode),
    };
  }

  private createCompletenessEvaluation(feature: AtomicFeature, evidence: CodeEvidence): CompletenessEvaluation {
    const hasState = feature.stateManagement.length > 0;
    const hasHandlers = feature.eventHandlers.length > 0;
    const hasCode = feature.linesOfCode > 5;
    let percentage = 0;
    if (hasCode) percentage += 40;
    if (hasState) percentage += 30;
    if (hasHandlers) percentage += 30;
    const rating = percentage >= 100 ? 'Enterprise-Level' : percentage >= 50 ? 'Full' : percentage >= 1 ? 'Partial' : 'Not Implemented';
    return {
      rating, percentage,
      implemented: hasCode ? [{ capability: 'Core functionality', status: 'implemented' }] : [],
      missing: !hasState ? [{ capability: 'State management', status: 'missing' }] : [],
      incomplete: [],
      evidence,
      rationale: `Feature has ${feature.linesOfCode} LOC with ${feature.stateManagement.length} state hooks and ${feature.eventHandlers.length} handlers.`,
    };
  }

  private createCodeQualityEvaluation(feature: AtomicFeature, featureIsolation: FeatureIsolationClassification, antiPatterns: Array<{ name: string; issue: string; impact: string }>): CodeQualityEvaluation {
    const rating = antiPatterns.length === 0 ? 'Excellent' : antiPatterns.length <= 1 ? 'Good' : antiPatterns.length <= 3 ? 'Basic' : 'Poor';
    return {
      rating, featureIsolation,
      antiPatterns: antiPatterns.map((ap, i) => ({
        id: i + 1, name: ap.name,
        evidence: { filePath: feature.primaryLocation.file, lineNumbers: { start: feature.primaryLocation.startLine, end: feature.primaryLocation.endLine }, codeSnippet: '', language: 'javascript' },
        issue: ap.issue, impact: ap.impact,
        betterApproach: { description: 'Refactor to improve code quality', codeExample: '' },
      })),
      goodPractices: [],
      assessment: `Code quality is ${rating.toLowerCase()} with ${antiPatterns.length} anti-patterns detected.`,
    };
  }

  private createDocumentationEvaluation(feature: AtomicFeature, hasDocumentation: boolean, evidence: CodeEvidence): DocumentationEvaluation {
    const rating = hasDocumentation ? 'Good' : 'None';
    return {
      rating,
      coverage: { hasJSDoc: hasDocumentation, hasInlineComments: hasDocumentation, hasSelfDocumentingNames: true, hasUsageExamples: false, hasEdgeCaseDocs: false },
      examples: { goodDocumentation: hasDocumentation ? [evidence] : [], missingDocumentation: hasDocumentation ? [] : [evidence] },
      assessment: hasDocumentation ? 'Feature has basic documentation coverage.' : 'Feature lacks documentation.',
    };
  }

  private createReliabilityEvaluation(feature: AtomicFeature, hasErrorHandling: boolean, evidence: CodeEvidence): ReliabilityEvaluation {
    const rating = hasErrorHandling ? 'High' : 'Low';
    return {
      rating,
      presentErrorHandling: hasErrorHandling ? [{ description: 'Error handling present', evidence }] : [],
      missingErrorHandling: hasErrorHandling ? [] : [{ scenario: 'General error handling', location: { file: feature.primaryLocation.file, line: feature.primaryLocation.startLine }, risk: 'Medium' }],
      defensiveCoding: { hasInputValidation: hasErrorHandling, hasNullChecks: hasErrorHandling, hasTypeGuards: false, description: hasErrorHandling ? 'Basic defensive coding' : 'Lacks defensive coding' },
      edgeCaseHandling: { handledCases: [], unhandledCases: ['Empty input'], description: 'Edge case handling needs improvement' },
      assessment: hasErrorHandling ? 'Feature has basic error handling.' : 'Feature lacks error handling.',
    };
  }

  private createPerformanceEvaluation(feature: AtomicFeature, hasOptimizations: boolean, code: string, evidence: CodeEvidence): PerformanceEvaluation {
    const hasLoops = /for\s*\(|while\s*\(|\.forEach|\.map|\.filter/.test(code);
    const rating = hasOptimizations ? 'Good' : (hasLoops ? 'Acceptable' : 'Good');
    return {
      rating,
      concerns: hasLoops && !hasOptimizations ? [{ id: 1, evidence, issue: 'Loop without memoization', impact: 'May cause re-renders', recommendedFix: 'Use useMemo or useCallback' }] : [],
      optimizations: hasOptimizations ? [{ technique: 'useMemo', evidence, description: 'Memoization detected' }] : [],
      complexityAnalysis: { algorithmicComplexity: hasLoops ? 'O(n)' : 'O(1)', loopAnalysis: hasLoops ? 'Contains iteration' : 'No loops' },
      reRenderAnalysis: { hasUnnecessaryReRenders: !hasOptimizations && hasLoops, issues: hasOptimizations ? [] : ['Potential re-renders'] },
      assessment: `Performance is ${rating.toLowerCase()}.`,
    };
  }

  private createIntegrationEvaluation(feature: AtomicFeature, code: string, evidence: CodeEvidence): IntegrationEvaluation {
    const hasProps = /props\.|\.props|function\s+\w+\s*\(\s*\{/.test(code);
    const hasCallbacks = /on[A-Z]\w+\s*[=:]|callback|onChange|onClick/.test(code);
    const rating = hasProps && hasCallbacks ? 'Full' : (hasProps ? 'Partial' : 'Not Compatible');
    return {
      rating,
      configurationOptions: hasProps ? [{ name: 'props', type: 'object', present: true }] : [],
      extensibility: { hasHooksCallbacks: hasCallbacks, hasSomeExtensionPoints: hasProps, isHardcoded: !hasProps && !hasCallbacks, details: hasCallbacks ? 'Provides callbacks' : 'Limited extensibility' },
      toggleCapability: hasProps,
      featureInteractions: 'Feature can interact with parent components through props',
      assessment: `Integration capability is ${rating.toLowerCase()}.`,
    };
  }

  private createMaintenanceEvaluation(feature: AtomicFeature, featureIsolation: FeatureIsolationClassification): MaintenanceEvaluation {
    const isIsolated = featureIsolation === 'isolated_module' || featureIsolation === 'same_file_separated';
    const rating = isIsolated ? 'High' : 'Medium';
    return {
      rating,
      modularity: { featureLOC: feature.linesOfCode, complexity: feature.linesOfCode > 100 ? 'High' : (feature.linesOfCode > 50 ? 'Medium' : 'Low'), dependencies: [] },
      modificationEase: isIsolated ? 'single_file' : 'few_files',
      testability: isIsolated ? 'isolated' : 'requires_mocking',
      dependencies: [],
      assessment: `Maintenance burden is ${rating.toLowerCase()}. Feature has ${feature.linesOfCode} LOC.`,
    };
  }

  private createStressCollapseEvaluation(feature: AtomicFeature, code: string): StressCollapseEvaluation {
    const hasLoop = /for\s*\(|while\s*\(|\.forEach|\.map|\.filter/.test(code);
    const hasInterval = /setInterval|setTimeout/.test(code);
    if (!hasLoop && !hasInterval) {
      return { conditions: [], isRobust: true, robustReason: 'Simple feature with no stress-sensitive patterns' };
    }
    const conditions = [];
    if (hasLoop) {
      conditions.push({
        id: 1, threshold: '>1000 items', expectedBehavior: 'UI may become unresponsive',
        reasoning: ['Contains iteration over data', 'No virtualization detected'],
        codePatternReferences: [{ filePath: feature.primaryLocation.file, lineNumbers: { start: feature.primaryLocation.startLine, end: feature.primaryLocation.endLine }, codeSnippet: '', language: 'javascript' }],
      });
    }
    return { conditions, isRobust: conditions.length === 0 };
  }

  private detectAntiPatterns(code: string): Array<{ name: string; issue: string; impact: string }> {
    const patterns: Array<{ name: string; issue: string; impact: string }> = [];
    if (/(\{[^{}]*){4,}/.test(code)) patterns.push({ name: 'Excessive Nesting', issue: 'Code has more than 3 levels of nesting', impact: 'Reduces readability' });
    if (/[^a-zA-Z0-9_](?:100|200|300|400|500|1000)\b/.test(code)) patterns.push({ name: 'Magic Number', issue: 'Hardcoded numeric values', impact: 'Makes code harder to maintain' });
    if (/\w+\.\w+\.\w+\.\w+/.test(code)) patterns.push({ name: 'Deep Property Chain', issue: 'Property access chain exceeds 3 levels', impact: 'Increases coupling' });
    return patterns;
  }

  private classifyFeatureIsolation(feature: AtomicFeature): FeatureIsolationClassification {
    const files = new Set(feature.codeBlocks.map(b => b.file)).size;
    if (files > 1) return 'scattered_files';
    if (feature.codeBlocks.length === 1 && feature.linesOfCode < 50) return 'isolated_module';
    if (feature.codeBlocks.length <= 2) return 'same_file_separated';
    return 'mixed_with_other';
  }

  private async readSourceFiles(componentPath: string): Promise<string | null> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const sourceFiles: string[] = [];
      const extensions = ['.js', '.jsx', '.ts', '.tsx'];
      const findFiles = async (dir: string) => {
        try {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== '__tests__') {
              await findFiles(fullPath);
            } else if (entry.isFile()) {
              const ext = path.extname(entry.name).toLowerCase();
              if (extensions.includes(ext)) sourceFiles.push(fullPath);
            }
          }
        } catch { /* ignore */ }
      };
      await findFiles(componentPath);
      if (sourceFiles.length === 0) return null;
      const contents: string[] = [];
      for (const file of sourceFiles) {
        try {
          const content = await fs.readFile(file, 'utf-8');
          contents.push(`// File: ${file}\n${content}`);
        } catch { /* skip */ }
      }
      return contents.join('\n\n');
    } catch { return null; }
  }

  private extractFeatureCode(feature: AtomicFeature, sourceCode: string): string {
    const lines = sourceCode.split('\n');
    const startLine = Math.max(0, feature.primaryLocation.startLine - 1);
    const endLine = Math.min(lines.length, feature.primaryLocation.endLine);
    return lines.slice(startLine, endLine).join('\n');
  }

  private extractComponentName(componentPath: string): string {
    const parts = componentPath.replace(/\\/g, '/').split('/');
    return parts[parts.length - 1] || 'Unknown';
  }

  private determineComponentType(componentPath: string): 'Component' | 'Feature Package' {
    return componentPath.includes('features/') ? 'Feature Package' : 'Component';
  }

  private getMainFileName(componentPath: string): string {
    return `${this.extractComponentName(componentPath)}.jsx`;
  }

  private inferLanguage(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return { 'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'tsx': 'typescript' }[ext || ''] || 'javascript';
  }

  private async loadExistingAgreements(): Promise<AgreementDocument[]> {
    return [];
  }

  private reportProgress(event: ProgressEvent): void {
    if (this.config.onProgress) this.config.onProgress(event);
  }
}
