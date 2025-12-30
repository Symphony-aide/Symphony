/**
 * AGREEMENT.md Document Generator
 * 
 * Generates complete AGREEMENT.md files for component evaluations.
 * Writes evaluation documents to component directories.
 * 
 * @module generators/AgreementGenerator
 */

import type {
  AgreementDocument,
  AgreementHeader,
  FeatureIdentificationSection,
  ComponentSummary,
  ProductionReadinessStatus,
  PriorityAction,
} from '../../types/documents';
import type { FeatureEvaluation } from '../../types/dimensions';
import type { AtomicFeature, ExternalDependency, FeatureIdentificationResult } from '../../types/evaluation';
import { MarkdownSerializer } from '../serialization/MarkdownSerializer';

/**
 * Configuration for generating AGREEMENT.md
 */
export interface AgreementGeneratorConfig {
  /** Base path for writing files (defaults to process.cwd()) */
  basePath?: string;
  /** Whether to actually write files (false for testing) */
  writeFiles?: boolean;
}

/**
 * Result of AGREEMENT.md generation
 */
export interface AgreementGenerationResult {
  /** Whether generation was successful */
  success: boolean;
  /** Path where file was written (or would be written) */
  filePath: string;
  /** The generated markdown content */
  markdown: string;
  /** The document data structure */
  document: AgreementDocument;
  /** Any errors encountered */
  error?: string;
}

/**
 * Generates AGREEMENT.md documents for component evaluations
 */
export class AgreementGenerator {
  private config: Required<AgreementGeneratorConfig>;

  constructor(config: AgreementGeneratorConfig = {}) {
    this.config = {
      basePath: config.basePath ?? process.cwd(),
      writeFiles: config.writeFiles ?? true,
    };
  }

  /**
   * Generate a complete AGREEMENT.md document from evaluation data
   * 
   * @param componentPath - Path to the component (e.g., 'packages/components/tab-bar')
   * @param componentName - Name of the component
   * @param componentType - Type of package ('Component' | 'Feature Package')
   * @param featureIdentification - Feature identification results
   * @param featureEvaluations - Evaluations for each feature
   * @returns Generation result with markdown and document
   */
  async generate(
    componentPath: string,
    componentName: string,
    componentType: 'Component' | 'Feature Package',
    featureIdentification: FeatureIdentificationResult,
    featureEvaluations: FeatureEvaluation[]
  ): Promise<AgreementGenerationResult> {
    try {
      // Build the document structure
      const document = this.buildDocument(
        componentPath,
        componentName,
        componentType,
        featureIdentification,
        featureEvaluations
      );

      // Serialize to markdown
      const markdown = MarkdownSerializer.serializeAgreement(document);

      // Determine output path
      const filePath = this.getOutputPath(componentPath);

      // Write file if configured
      if (this.config.writeFiles) {
        await this.writeFile(filePath, markdown);
      }

      return {
        success: true,
        filePath,
        markdown,
        document,
      };
    } catch (error) {
      return {
        success: false,
        filePath: this.getOutputPath(componentPath),
        markdown: '',
        document: this.createEmptyDocument(componentName, componentType, componentPath),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Build the complete AGREEMENT.md document structure
   */
  buildDocument(
    componentPath: string,
    componentName: string,
    componentType: 'Component' | 'Feature Package',
    featureIdentification: FeatureIdentificationResult,
    featureEvaluations: FeatureEvaluation[]
  ): AgreementDocument {
    const header = this.buildHeader(
      componentName,
      componentType,
      componentPath,
      featureIdentification.totalLinesOfCode
    );

    const featureIdentificationSection = this.buildFeatureIdentificationSection(
      featureIdentification
    );

    const componentSummary = this.buildComponentSummary(featureEvaluations);

    return {
      header,
      featureIdentification: featureIdentificationSection,
      featureEvaluations,
      componentSummary,
    };
  }

  /**
   * Build the header section
   */
  buildHeader(
    componentName: string,
    type: 'Component' | 'Feature Package',
    path: string,
    linesOfCode: number
  ): AgreementHeader {
    return {
      componentName,
      type,
      evaluatedDate: new Date().toISOString().split('T')[0],
      path,
      linesOfCode,
    };
  }

  /**
   * Build the feature identification section
   */
  buildFeatureIdentificationSection(
    result: FeatureIdentificationResult
  ): FeatureIdentificationSection {
    return {
      methodology: [
        'Analyzed component code structure',
        'Identified distinct capabilities',
        'Verified no separate packages exist for these capabilities',
        'Listed smallest independent features',
      ],
      featuresTable: result.identifiedFeatures,
      totalFeatures: result.identifiedFeatures.length,
      externalDependencies: result.externalDependencies,
    };
  }

  /**
   * Build the component summary with statistics and recommendations
   */
  buildComponentSummary(evaluations: FeatureEvaluation[]): ComponentSummary {
    const statistics = this.calculateStatistics(evaluations);
    const criticalIssues = this.identifyCriticalIssues(evaluations);
    const strengths = this.identifyStrengths(evaluations);
    const recommendedActions = this.generateRecommendedActions(evaluations);
    const overallReadiness = this.determineReadiness(statistics);

    return {
      statistics,
      criticalIssues,
      strengths,
      recommendedActions,
      overallReadiness,
    };
  }

  /**
   * Calculate statistics from evaluations
   */
  calculateStatistics(evaluations: FeatureEvaluation[]): ComponentSummary['statistics'] {
    let enterpriseLevel = 0;
    let fullImplementation = 0;
    let partialImplementation = 0;
    let notImplemented = 0;

    for (const eval_ of evaluations) {
      switch (eval_.completeness.rating) {
        case 'Enterprise-Level':
          enterpriseLevel++;
          break;
        case 'Full':
          fullImplementation++;
          break;
        case 'Partial':
          partialImplementation++;
          break;
        case 'Not Implemented':
          notImplemented++;
          break;
      }
    }

    return {
      totalFeatures: evaluations.length,
      enterpriseLevel,
      fullImplementation,
      partialImplementation,
      notImplemented,
    };
  }

  /**
   * Identify critical issues across all features
   */
  identifyCriticalIssues(evaluations: FeatureEvaluation[]): string[] {
    const issues: string[] = [];

    for (const eval_ of evaluations) {
      // Check for poor code quality
      if (eval_.codeQuality.rating === 'Poor') {
        issues.push(`${eval_.feature.name}: Poor code quality requires immediate attention`);
      }

      // Check for low reliability
      if (eval_.reliability.rating === 'Low') {
        issues.push(`${eval_.feature.name}: Low reliability with missing error handling`);
      }

      // Check for poor performance
      if (eval_.performance.rating === 'Poor') {
        issues.push(`${eval_.feature.name}: Performance issues detected`);
      }

      // Check for anti-patterns
      if (eval_.codeQuality.antiPatterns.length > 2) {
        issues.push(`${eval_.feature.name}: Multiple anti-patterns detected (${eval_.codeQuality.antiPatterns.length})`);
      }

      // Check for early stress collapse
      if (!eval_.stressCollapse.isRobust && eval_.stressCollapse.conditions.length > 0) {
        const threshold = eval_.stressCollapse.conditions[0].threshold;
        if (threshold.includes('10') || threshold.includes('100')) {
          issues.push(`${eval_.feature.name}: Early stress collapse at ${threshold}`);
        }
      }
    }

    return issues.slice(0, 10); // Limit to top 10 issues
  }

  /**
   * Identify strengths across all features
   */
  identifyStrengths(evaluations: FeatureEvaluation[]): string[] {
    const strengths: string[] = [];

    for (const eval_ of evaluations) {
      // Check for excellent code quality
      if (eval_.codeQuality.rating === 'Excellent') {
        strengths.push(`${eval_.feature.name}: Excellent code quality and maintainability`);
      }

      // Check for enterprise-level completeness
      if (eval_.completeness.rating === 'Enterprise-Level') {
        strengths.push(`${eval_.feature.name}: Enterprise-level implementation`);
      }

      // Check for good documentation
      if (eval_.documentation.rating === 'Excellent' || eval_.documentation.rating === 'Good') {
        strengths.push(`${eval_.feature.name}: Well-documented code`);
      }

      // Check for good practices
      if (eval_.codeQuality.goodPractices.length > 2) {
        strengths.push(`${eval_.feature.name}: Multiple good practices observed`);
      }

      // Check for robust features
      if (eval_.stressCollapse.isRobust) {
        strengths.push(`${eval_.feature.name}: Robust under stress conditions`);
      }
    }

    return strengths.slice(0, 10); // Limit to top 10 strengths
  }

  /**
   * Generate recommended priority actions
   */
  generateRecommendedActions(evaluations: FeatureEvaluation[]): PriorityAction[] {
    const actions: PriorityAction[] = [];

    for (const eval_ of evaluations) {
      // High priority: Poor reliability or code quality
      if (eval_.reliability.rating === 'Low') {
        actions.push({
          priority: 'High',
          action: 'Add error handling and defensive coding',
          feature: eval_.feature.name,
        });
      }

      if (eval_.codeQuality.rating === 'Poor') {
        actions.push({
          priority: 'High',
          action: 'Refactor to address anti-patterns',
          feature: eval_.feature.name,
        });
      }

      // Medium priority: Performance issues or missing documentation
      if (eval_.performance.rating === 'Poor') {
        actions.push({
          priority: 'Medium',
          action: 'Optimize performance bottlenecks',
          feature: eval_.feature.name,
        });
      }

      if (eval_.documentation.rating === 'None') {
        actions.push({
          priority: 'Medium',
          action: 'Add documentation and comments',
          feature: eval_.feature.name,
        });
      }

      // Low priority: Partial implementation or basic quality
      if (eval_.completeness.rating === 'Partial') {
        actions.push({
          priority: 'Low',
          action: 'Complete missing capabilities',
          feature: eval_.feature.name,
        });
      }
    }

    // Sort by priority and limit
    const priorityOrder = { High: 0, Medium: 1, Low: 2 };
    return actions
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
      .slice(0, 10);
  }

  /**
   * Determine overall production readiness status
   */
  determineReadiness(statistics: ComponentSummary['statistics']): ProductionReadinessStatus {
    const { totalFeatures, enterpriseLevel, fullImplementation } = statistics;
    
    if (totalFeatures === 0) {
      return 'Not Ready';
    }

    const readyFeatures = enterpriseLevel + fullImplementation;
    const readyPercentage = (readyFeatures / totalFeatures) * 100;

    if (readyPercentage >= 80) {
      return 'Production Ready';
    } else if (readyPercentage >= 60) {
      return 'Staging Ready';
    } else if (readyPercentage >= 40) {
      return 'Development';
    } else {
      return 'Not Ready';
    }
  }

  /**
   * Get the output file path for AGREEMENT.md
   */
  getOutputPath(componentPath: string): string {
    // Normalize path separators
    const normalizedPath = componentPath.replace(/\\/g, '/');
    return `${this.config.basePath}/${normalizedPath}/AGREEMENT.md`.replace(/\/+/g, '/');
  }

  /**
   * Write the markdown content to file
   */
  private async writeFile(filePath: string, content: string): Promise<void> {
    // Dynamic import for Node.js fs module
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    
    // Write file
    await fs.writeFile(filePath, content, 'utf-8');
  }

  /**
   * Create an empty document structure for error cases
   */
  private createEmptyDocument(
    componentName: string,
    componentType: 'Component' | 'Feature Package',
    componentPath: string
  ): AgreementDocument {
    return {
      header: {
        componentName,
        type: componentType,
        evaluatedDate: new Date().toISOString().split('T')[0],
        path: componentPath,
        linesOfCode: 0,
      },
      featureIdentification: {
        methodology: [],
        featuresTable: [],
        totalFeatures: 0,
        externalDependencies: [],
      },
      featureEvaluations: [],
      componentSummary: {
        statistics: {
          totalFeatures: 0,
          enterpriseLevel: 0,
          fullImplementation: 0,
          partialImplementation: 0,
          notImplemented: 0,
        },
        criticalIssues: [],
        strengths: [],
        recommendedActions: [],
        overallReadiness: 'Not Ready',
      },
    };
  }
}
