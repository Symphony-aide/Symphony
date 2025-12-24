/**
 * SUMMARY_AGREEMENT.md Document Generator
 * 
 * Generates consolidated SUMMARY_AGREEMENT.md files that aggregate
 * evaluation data from all AGREEMENT.md files across the project.
 * 
 * @module generators/SummaryGenerator
 */

import type {
  AgreementDocument,
  SummaryAgreementDocument,
  ExecutiveSummary,
  DetailedEvaluationRow,
  StatisticsByCategory,
  CriticalIssue,
  CommonAntiPattern,
  ProductionReadinessRow,
  StressCollapseSummary,
  FragileFeature,
  RobustFeature,
  Recommendations,
  RecommendationItem,
  FeatureQualityHeatmap,
  HeatmapRow,
  ProductionReadinessStatus,
} from '../../types/documents';
import type { FeatureEvaluation, AntiPattern } from '../../types/dimensions';

/**
 * Configuration for generating SUMMARY_AGREEMENT.md
 */
export interface SummaryGeneratorConfig {
  /** Project name (defaults to 'Symphony IDE') */
  projectName?: string;
  /** Base path for writing files (defaults to process.cwd()) */
  basePath?: string;
  /** Whether to actually write files (false for testing) */
  writeFiles?: boolean;
}

/**
 * Result of SUMMARY_AGREEMENT.md generation
 */
export interface SummaryGenerationResult {
  /** Whether generation was successful */
  success: boolean;
  /** Path where file was written (or would be written) */
  filePath: string;
  /** The generated markdown content */
  markdown: string;
  /** The document data structure */
  document: SummaryAgreementDocument;
  /** Any errors encountered */
  error?: string;
}


/**
 * Generates SUMMARY_AGREEMENT.md documents aggregating all component evaluations
 */
export class SummaryGenerator {
  private config: Required<SummaryGeneratorConfig>;

  constructor(config: SummaryGeneratorConfig = {}) {
    this.config = {
      projectName: config.projectName ?? 'Symphony IDE',
      basePath: config.basePath ?? process.cwd(),
      writeFiles: config.writeFiles ?? true,
    };
  }

  /**
   * Generate a complete SUMMARY_AGREEMENT.md document from all AGREEMENT.md data
   * 
   * @param agreementDocuments - Array of all AGREEMENT.md document data
   * @returns Generation result with markdown and document
   */
  async generate(
    agreementDocuments: AgreementDocument[]
  ): Promise<SummaryGenerationResult> {
    try {
      // Build the document structure
      const document = this.buildDocument(agreementDocuments);

      // Serialize to markdown
      const markdown = this.serializeSummary(document);

      // Determine output path
      const filePath = this.getOutputPath();

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
        filePath: this.getOutputPath(),
        markdown: '',
        document: this.createEmptyDocument(),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Build the complete SUMMARY_AGREEMENT.md document structure
   */
  buildDocument(agreementDocuments: AgreementDocument[]): SummaryAgreementDocument {
    const executiveSummary = this.buildExecutiveSummary(agreementDocuments);
    const detailedTable = this.buildDetailedTable(agreementDocuments);
    const statistics = this.buildStatistics(agreementDocuments);
    const criticalIssues = this.buildCriticalIssues(agreementDocuments);
    const commonAntiPatterns = this.buildCommonAntiPatterns(agreementDocuments);
    const productionReadiness = this.buildProductionReadiness(agreementDocuments);
    const stressCollapseSummary = this.buildStressCollapseSummary(agreementDocuments);
    const recommendations = this.buildRecommendations(agreementDocuments);
    const heatmap = this.buildHeatmap(agreementDocuments);

    return {
      executiveSummary,
      detailedTable,
      statistics,
      criticalIssues,
      commonAntiPatterns,
      productionReadiness,
      stressCollapseSummary,
      recommendations,
      heatmap,
    };
  }

  /**
   * Build executive summary section
   * Requirements: 11.2
   */
  buildExecutiveSummary(documents: AgreementDocument[]): ExecutiveSummary {
    const totalFeatures = documents.reduce(
      (sum, doc) => sum + doc.featureEvaluations.length,
      0
    );

    const keyFindings = this.generateKeyFindings(documents);

    return {
      projectName: this.config.projectName,
      evaluationDate: new Date().toISOString().split('T')[0],
      componentsEvaluated: documents.length,
      totalFeaturesEvaluated: totalFeatures,
      keyFindings,
    };
  }

  /**
   * Generate key findings from all documents
   */
  private generateKeyFindings(documents: AgreementDocument[]): string[] {
    const findings: string[] = [];
    
    // Calculate overall statistics
    let totalEnterprise = 0;
    let totalFull = 0;
    let totalPartial = 0;
    let totalNotImpl = 0;
    let totalPoorQuality = 0;
    let totalExcellentQuality = 0;

    for (const doc of documents) {
      totalEnterprise += doc.componentSummary.statistics.enterpriseLevel;
      totalFull += doc.componentSummary.statistics.fullImplementation;
      totalPartial += doc.componentSummary.statistics.partialImplementation;
      totalNotImpl += doc.componentSummary.statistics.notImplemented;

      for (const eval_ of doc.featureEvaluations) {
        if (eval_.codeQuality.rating === 'Poor') totalPoorQuality++;
        if (eval_.codeQuality.rating === 'Excellent') totalExcellentQuality++;
      }
    }

    const totalFeatures = totalEnterprise + totalFull + totalPartial + totalNotImpl;
    
    if (totalFeatures > 0) {
      const readyPercent = Math.round(((totalEnterprise + totalFull) / totalFeatures) * 100);
      findings.push(`${readyPercent}% of features are at Full or Enterprise-Level implementation`);
    }

    if (totalExcellentQuality > 0) {
      findings.push(`${totalExcellentQuality} features demonstrate excellent code quality`);
    }

    if (totalPoorQuality > 0) {
      findings.push(`${totalPoorQuality} features require immediate code quality improvements`);
    }

    if (totalPartial > 0) {
      findings.push(`${totalPartial} features have partial implementation requiring completion`);
    }

    // Count production-ready components
    const productionReady = documents.filter(
      doc => doc.componentSummary.overallReadiness === 'Production Ready'
    ).length;
    
    if (productionReady > 0) {
      findings.push(`${productionReady} of ${documents.length} components are production-ready`);
    }

    return findings.slice(0, 5); // Limit to 5 key findings
  }


  /**
   * Build detailed evaluation table with one row per atomic feature
   * Requirements: 11.3
   */
  buildDetailedTable(documents: AgreementDocument[]): DetailedEvaluationRow[] {
    const rows: DetailedEvaluationRow[] = [];

    for (const doc of documents) {
      for (const eval_ of doc.featureEvaluations) {
        const collapseText = eval_.stressCollapse.isRobust
          ? 'N/A'
          : eval_.stressCollapse.conditions[0]?.threshold || 'Unknown';

        rows.push({
          componentPackage: doc.header.componentName,
          type: doc.header.type,
          featureName: eval_.feature.name,
          completeness: `${eval_.completeness.rating} (${eval_.completeness.percentage}%)`,
          codeQuality: eval_.codeQuality.rating,
          docs: eval_.documentation.rating,
          reliability: eval_.reliability.rating,
          performance: eval_.performance.rating,
          integration: eval_.integration.rating,
          maintenance: eval_.maintenance.rating,
          whenCollapse: collapseText,
          notes: this.generateFeatureNotes(eval_),
        });
      }
    }

    return rows;
  }

  /**
   * Generate notes for a feature based on its evaluation
   */
  private generateFeatureNotes(eval_: FeatureEvaluation): string {
    const notes: string[] = [];

    if (eval_.codeQuality.antiPatterns.length > 0) {
      notes.push(`${eval_.codeQuality.antiPatterns.length} anti-patterns`);
    }

    if (eval_.reliability.missingErrorHandling.length > 0) {
      notes.push('Missing error handling');
    }

    if (eval_.performance.concerns.length > 0) {
      notes.push('Performance concerns');
    }

    return notes.join('; ') || '-';
  }

  /**
   * Build statistics by category section
   * Requirements: 11.4
   */
  buildStatistics(documents: AgreementDocument[]): StatisticsByCategory {
    const completeness = { enterpriseLevel: 0, full: 0, partial: 0, notImplemented: 0 };
    const quality = { excellent: 0, good: 0, basic: 0, poor: 0 };
    const performance = { critical: 0, medium: 0, good: 0 };

    for (const doc of documents) {
      for (const eval_ of doc.featureEvaluations) {
        // Completeness distribution
        switch (eval_.completeness.rating) {
          case 'Enterprise-Level': completeness.enterpriseLevel++; break;
          case 'Full': completeness.full++; break;
          case 'Partial': completeness.partial++; break;
          case 'Not Implemented': completeness.notImplemented++; break;
        }

        // Code quality distribution
        switch (eval_.codeQuality.rating) {
          case 'Excellent': quality.excellent++; break;
          case 'Good': quality.good++; break;
          case 'Basic': quality.basic++; break;
          case 'Poor': quality.poor++; break;
        }

        // Performance issues
        switch (eval_.performance.rating) {
          case 'Poor': performance.critical++; break;
          case 'Acceptable': performance.medium++; break;
          case 'Good':
          case 'Excellent': performance.good++; break;
        }
      }
    }

    return {
      completenessDistribution: completeness,
      codeQualityDistribution: quality,
      performanceIssues: performance,
    };
  }

  /**
   * Build critical issues section
   * Requirements: 11.5
   */
  buildCriticalIssues(documents: AgreementDocument[]): CriticalIssue[] {
    const issues: CriticalIssue[] = [];
    let issueId = 1;

    for (const doc of documents) {
      for (const eval_ of doc.featureEvaluations) {
        // Poor code quality is critical
        if (eval_.codeQuality.rating === 'Poor') {
          issues.push({
            id: issueId++,
            componentName: doc.header.componentName,
            featureName: eval_.feature.name,
            issue: 'Poor code quality with multiple anti-patterns',
            impact: 'High maintenance burden and potential bugs',
            evidence: `${eval_.codeQuality.antiPatterns.length} anti-patterns detected`,
            recommendation: 'Refactor to address anti-patterns and improve code organization',
          });
        }

        // Low reliability is critical
        if (eval_.reliability.rating === 'Low') {
          issues.push({
            id: issueId++,
            componentName: doc.header.componentName,
            featureName: eval_.feature.name,
            issue: 'Low reliability with missing error handling',
            impact: 'Application crashes and poor user experience',
            evidence: `${eval_.reliability.missingErrorHandling.length} error handling gaps`,
            recommendation: 'Add comprehensive error handling and defensive coding',
          });
        }

        // Poor performance is critical
        if (eval_.performance.rating === 'Poor') {
          issues.push({
            id: issueId++,
            componentName: doc.header.componentName,
            featureName: eval_.feature.name,
            issue: 'Poor performance with identified bottlenecks',
            impact: 'Slow user experience and potential timeouts',
            evidence: `${eval_.performance.concerns.length} performance concerns`,
            recommendation: 'Optimize algorithms and add memoization where needed',
          });
        }

        // Early stress collapse is critical
        if (!eval_.stressCollapse.isRobust && eval_.stressCollapse.conditions.length > 0) {
          const threshold = eval_.stressCollapse.conditions[0].threshold;
          if (this.isEarlyCollapse(threshold)) {
            issues.push({
              id: issueId++,
              componentName: doc.header.componentName,
              featureName: eval_.feature.name,
              issue: `Early stress collapse at ${threshold}`,
              impact: 'Feature fails under moderate load',
              evidence: eval_.stressCollapse.conditions[0].expectedBehavior,
              recommendation: 'Implement pagination, virtualization, or lazy loading',
            });
          }
        }
      }
    }

    return issues.slice(0, 20); // Limit to top 20 critical issues
  }

  /**
   * Check if a collapse threshold indicates early collapse
   */
  private isEarlyCollapse(threshold: string): boolean {
    const match = threshold.match(/(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      return num <= 100;
    }
    return false;
  }


  /**
   * Build common anti-patterns section
   * Requirements: 11.6
   */
  buildCommonAntiPatterns(documents: AgreementDocument[]): CommonAntiPattern[] {
    // Group anti-patterns by name
    const patternMap = new Map<string, {
      affected: Array<{ component: string; feature: string }>;
      sample: AntiPattern;
    }>();

    for (const doc of documents) {
      for (const eval_ of doc.featureEvaluations) {
        for (const ap of eval_.codeQuality.antiPatterns) {
          const existing = patternMap.get(ap.name);
          if (existing) {
            existing.affected.push({
              component: doc.header.componentName,
              feature: eval_.feature.name,
            });
          } else {
            patternMap.set(ap.name, {
              affected: [{
                component: doc.header.componentName,
                feature: eval_.feature.name,
              }],
              sample: ap,
            });
          }
        }
      }
    }

    // Convert to array and sort by frequency
    const patterns: CommonAntiPattern[] = [];
    let patternId = 1;

    const sortedPatterns = Array.from(patternMap.entries())
      .sort((a, b) => b[1].affected.length - a[1].affected.length);

    for (const [name, data] of sortedPatterns) {
      patterns.push({
        id: patternId++,
        patternName: name,
        affectedComponents: data.affected,
        impact: data.sample.impact,
        recommendation: data.sample.betterApproach.description,
      });
    }

    return patterns.slice(0, 10); // Limit to top 10 patterns
  }

  /**
   * Build production readiness table
   * Requirements: 11.7
   */
  buildProductionReadiness(documents: AgreementDocument[]): ProductionReadinessRow[] {
    return documents.map(doc => ({
      componentPackage: doc.header.componentName,
      totalFeatures: doc.componentSummary.statistics.totalFeatures,
      enterprise: doc.componentSummary.statistics.enterpriseLevel,
      full: doc.componentSummary.statistics.fullImplementation,
      partial: doc.componentSummary.statistics.partialImplementation,
      notImplemented: doc.componentSummary.statistics.notImplemented,
      overallStatus: doc.componentSummary.overallReadiness,
    }));
  }

  /**
   * Build stress collapse summary
   * Requirements: 11.8
   */
  buildStressCollapseSummary(documents: AgreementDocument[]): StressCollapseSummary {
    const fragile: FragileFeature[] = [];
    const robust: RobustFeature[] = [];

    for (const doc of documents) {
      for (const eval_ of doc.featureEvaluations) {
        if (eval_.stressCollapse.isRobust) {
          robust.push({
            component: doc.header.componentName,
            feature: eval_.feature.name,
            reason: eval_.stressCollapse.robustReason || 'No collapse scenario identified',
          });
        } else if (eval_.stressCollapse.conditions.length > 0) {
          const condition = eval_.stressCollapse.conditions[0];
          fragile.push({
            component: doc.header.componentName,
            feature: eval_.feature.name,
            collapsesAt: condition.threshold,
            impact: condition.expectedBehavior,
            priority: this.determineCollapsePriority(condition.threshold),
          });
        }
      }
    }

    // Sort fragile by priority and threshold
    fragile.sort((a, b) => {
      const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return {
      mostFragile: fragile.slice(0, 10),
      mostRobust: robust.slice(0, 10),
    };
  }

  /**
   * Determine priority based on collapse threshold
   */
  private determineCollapsePriority(threshold: string): 'HIGH' | 'MEDIUM' | 'LOW' {
    const match = threshold.match(/(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num <= 50) return 'HIGH';
      if (num <= 500) return 'MEDIUM';
    }
    return 'LOW';
  }

  /**
   * Build recommendations section
   * Requirements: 11.9
   */
  buildRecommendations(documents: AgreementDocument[]): Recommendations {
    const immediate: RecommendationItem[] = [];
    const shortTerm: RecommendationItem[] = [];
    const longTerm: RecommendationItem[] = [];

    // Collect all recommended actions from components
    for (const doc of documents) {
      for (const action of doc.componentSummary.recommendedActions) {
        const item: RecommendationItem = {
          action: `${doc.header.componentName}: ${action.action}${action.feature ? ` (${action.feature})` : ''}`,
          effort: this.estimateEffort(action.priority),
        };

        switch (action.priority) {
          case 'High':
            immediate.push(item);
            break;
          case 'Medium':
            shortTerm.push(item);
            break;
          case 'Low':
            longTerm.push(item);
            break;
        }
      }
    }

    // Add general recommendations based on statistics
    const stats = this.buildStatistics(documents);
    
    if (stats.codeQualityDistribution.poor > 0) {
      immediate.push({
        action: `Address ${stats.codeQualityDistribution.poor} features with poor code quality`,
        effort: '2-4 hours per feature',
      });
    }

    if (stats.performanceIssues.critical > 0) {
      immediate.push({
        action: `Fix ${stats.performanceIssues.critical} critical performance issues`,
        effort: '1-3 hours per issue',
      });
    }

    if (stats.completenessDistribution.partial > 0) {
      shortTerm.push({
        action: `Complete ${stats.completenessDistribution.partial} partially implemented features`,
        effort: '4-8 hours per feature',
      });
    }

    longTerm.push({
      action: 'Establish automated code quality gates in CI/CD pipeline',
    });

    longTerm.push({
      action: 'Implement comprehensive documentation standards',
    });

    return {
      immediateActions: immediate.slice(0, 10),
      shortTerm: shortTerm.slice(0, 10),
      longTerm: longTerm.slice(0, 5),
    };
  }

  /**
   * Estimate effort based on priority
   */
  private estimateEffort(priority: 'High' | 'Medium' | 'Low'): string {
    switch (priority) {
      case 'High': return '1-2 hours';
      case 'Medium': return '2-4 hours';
      case 'Low': return '4-8 hours';
    }
  }


  /**
   * Build feature quality heatmap
   * Requirements: 11.10
   */
  buildHeatmap(documents: AgreementDocument[]): FeatureQualityHeatmap {
    const rows: HeatmapRow[] = documents.map(doc => {
      const stats = doc.componentSummary.statistics;
      const total = stats.totalFeatures || 1; // Avoid division by zero
      
      // Calculate score: Enterprise=10, Full=7.5, Partial=4, NotImpl=0
      const score = (
        (stats.enterpriseLevel * 10) +
        (stats.fullImplementation * 7.5) +
        (stats.partialImplementation * 4) +
        (stats.notImplemented * 0)
      ) / total;

      return {
        component: doc.header.componentName,
        enterprise: stats.enterpriseLevel,
        full: stats.fullImplementation,
        partial: stats.partialImplementation,
        notImplemented: stats.notImplemented,
        score: Math.round(score * 10) / 10, // Round to 1 decimal
      };
    });

    // Sort by score descending
    rows.sort((a, b) => b.score - a.score);

    return { rows };
  }

  /**
   * Serialize the complete SUMMARY_AGREEMENT.md document to markdown
   */
  serializeSummary(document: SummaryAgreementDocument): string {
    const sections: string[] = [];

    // Title
    sections.push(`# ${document.executiveSummary.projectName} - Summary Evaluation Agreement\n`);

    // Executive Summary
    sections.push(this.serializeExecutiveSummary(document.executiveSummary));
    sections.push('---\n');

    // Detailed Evaluation Table
    sections.push(this.serializeDetailedTable(document.detailedTable));
    sections.push('---\n');

    // Statistics
    sections.push(this.serializeStatistics(document.statistics));
    sections.push('---\n');

    // Critical Issues
    sections.push(this.serializeCriticalIssues(document.criticalIssues));
    sections.push('---\n');

    // Common Anti-Patterns
    sections.push(this.serializeCommonAntiPatterns(document.commonAntiPatterns));
    sections.push('---\n');

    // Production Readiness
    sections.push(this.serializeProductionReadiness(document.productionReadiness));
    sections.push('---\n');

    // Stress Collapse Summary
    sections.push(this.serializeStressCollapseSummary(document.stressCollapseSummary));
    sections.push('---\n');

    // Recommendations
    sections.push(this.serializeRecommendations(document.recommendations));
    sections.push('---\n');

    // Heatmap
    sections.push(this.serializeHeatmap(document.heatmap));

    return sections.join('\n');
  }

  /**
   * Serialize executive summary section
   */
  private serializeExecutiveSummary(summary: ExecutiveSummary): string {
    const lines: string[] = [];

    lines.push('## Executive Summary\n');
    lines.push(`**Project:** ${summary.projectName}`);
    lines.push(`**Evaluation Date:** ${summary.evaluationDate}`);
    lines.push(`**Components/Packages Evaluated:** ${summary.componentsEvaluated}`);
    lines.push(`**Total Atomic Features Evaluated:** ${summary.totalFeaturesEvaluated}`);
    lines.push('');

    if (summary.keyFindings.length > 0) {
      lines.push('**Key Findings:**');
      for (const finding of summary.keyFindings) {
        lines.push(`- ${finding}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Serialize detailed evaluation table
   */
  private serializeDetailedTable(rows: DetailedEvaluationRow[]): string {
    const lines: string[] = [];

    lines.push('## Detailed Evaluation Table\n');
    lines.push('| Component/Package | Type | Feature Name | Completeness | Code Quality | Docs | Reliability | Performance | Integration | Maintenance | When Collapse | Notes |');
    lines.push('|-------------------|------|--------------|--------------|--------------|------|-------------|-------------|-------------|-------------|---------------|-------|');

    for (const row of rows) {
      lines.push(`| ${row.componentPackage} | ${row.type} | ${row.featureName} | ${row.completeness} | ${row.codeQuality} | ${row.docs} | ${row.reliability} | ${row.performance} | ${row.integration} | ${row.maintenance} | ${row.whenCollapse} | ${row.notes} |`);
    }

    return lines.join('\n');
  }

  /**
   * Serialize statistics section
   */
  private serializeStatistics(stats: StatisticsByCategory): string {
    const lines: string[] = [];

    lines.push('## Statistics by Category\n');

    lines.push('### Feature Completeness Distribution');
    lines.push(`- Enterprise-Level: ${stats.completenessDistribution.enterpriseLevel}`);
    lines.push(`- Full: ${stats.completenessDistribution.full}`);
    lines.push(`- Partial: ${stats.completenessDistribution.partial}`);
    lines.push(`- Not Implemented: ${stats.completenessDistribution.notImplemented}`);
    lines.push('');

    lines.push('### Code Quality Distribution');
    lines.push(`- Excellent: ${stats.codeQualityDistribution.excellent}`);
    lines.push(`- Good: ${stats.codeQualityDistribution.good}`);
    lines.push(`- Basic: ${stats.codeQualityDistribution.basic}`);
    lines.push(`- Poor: ${stats.codeQualityDistribution.poor}`);
    lines.push('');

    lines.push('### Performance Issues');
    lines.push(`- Critical: ${stats.performanceIssues.critical}`);
    lines.push(`- Medium: ${stats.performanceIssues.medium}`);
    lines.push(`- Good: ${stats.performanceIssues.good}`);

    return lines.join('\n');
  }

  /**
   * Serialize critical issues section
   */
  private serializeCriticalIssues(issues: CriticalIssue[]): string {
    const lines: string[] = [];

    lines.push('## Critical Issues\n');

    if (issues.length === 0) {
      lines.push('No critical issues identified.');
      return lines.join('\n');
    }

    for (const issue of issues) {
      lines.push(`### ${issue.id}. ${issue.componentName} - ${issue.featureName}\n`);
      lines.push(`**Issue:** ${issue.issue}`);
      lines.push(`**Impact:** ${issue.impact}`);
      lines.push(`**Evidence:** ${issue.evidence}`);
      lines.push(`**Recommendation:** ${issue.recommendation}`);
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Serialize common anti-patterns section
   */
  private serializeCommonAntiPatterns(patterns: CommonAntiPattern[]): string {
    const lines: string[] = [];

    lines.push('## Common Anti-Patterns Across Project\n');

    if (patterns.length === 0) {
      lines.push('No common anti-patterns identified.');
      return lines.join('\n');
    }

    for (const pattern of patterns) {
      lines.push(`### ${pattern.id}. ${pattern.patternName}\n`);
      lines.push('**Affected Components/Features:**');
      for (const affected of pattern.affectedComponents) {
        lines.push(`- ${affected.component}: ${affected.feature}`);
      }
      lines.push('');
      lines.push(`**Impact:** ${pattern.impact}`);
      lines.push(`**Recommendation:** ${pattern.recommendation}`);
      lines.push('');
    }

    return lines.join('\n');
  }


  /**
   * Serialize production readiness table
   */
  private serializeProductionReadiness(rows: ProductionReadinessRow[]): string {
    const lines: string[] = [];

    lines.push('## Production Readiness by Component\n');
    lines.push('| Component/Package | Total Features | Enterprise | Full | Partial | Not Impl | Overall Status |');
    lines.push('|-------------------|----------------|------------|------|---------|----------|----------------|');

    const statusEmoji: Record<ProductionReadinessStatus, string> = {
      'Production Ready': '✅',
      'Staging Ready': '🟡',
      'Development': '⚠️',
      'Not Ready': '❌',
    };

    for (const row of rows) {
      const emoji = statusEmoji[row.overallStatus];
      lines.push(`| ${row.componentPackage} | ${row.totalFeatures} | ${row.enterprise} | ${row.full} | ${row.partial} | ${row.notImplemented} | ${emoji} ${row.overallStatus} |`);
    }

    lines.push('');
    lines.push('**Legend:**');
    lines.push('- ✅ Production Ready: 80%+ features at Full/Enterprise-Level');
    lines.push('- 🟡 Staging Ready: 60-79% features at Full/Enterprise-Level');
    lines.push('- ⚠️ Development: 40-59% features at Full/Enterprise-Level');
    lines.push('- ❌ Not Ready: <40% features at Full/Enterprise-Level');

    return lines.join('\n');
  }

  /**
   * Serialize stress collapse summary
   */
  private serializeStressCollapseSummary(summary: StressCollapseSummary): string {
    const lines: string[] = [];

    lines.push('## Stress Collapse Summary\n');

    lines.push('### Most Fragile Features (Earliest Collapse)\n');
    if (summary.mostFragile.length === 0) {
      lines.push('No fragile features identified.');
    } else {
      lines.push('| Component | Feature | Collapses At | Impact | Priority |');
      lines.push('|-----------|---------|--------------|--------|----------|');
      for (const f of summary.mostFragile) {
        lines.push(`| ${f.component} | ${f.feature} | ${f.collapsesAt} | ${f.impact} | ${f.priority} |`);
      }
    }
    lines.push('');

    lines.push('### Most Robust Features (High Stress Tolerance)\n');
    if (summary.mostRobust.length === 0) {
      lines.push('No robust features identified.');
    } else {
      lines.push('| Component | Feature | Reason |');
      lines.push('|-----------|---------|--------|');
      for (const r of summary.mostRobust) {
        lines.push(`| ${r.component} | ${r.feature} | ${r.reason} |`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Serialize recommendations section
   */
  private serializeRecommendations(recommendations: Recommendations): string {
    const lines: string[] = [];

    lines.push('## Recommendations\n');

    lines.push('### Immediate Actions (This Sprint)\n');
    if (recommendations.immediateActions.length === 0) {
      lines.push('No immediate actions required.');
    } else {
      for (const action of recommendations.immediateActions) {
        const effort = action.effort ? ` (Effort: ${action.effort})` : '';
        lines.push(`- ${action.action}${effort}`);
      }
    }
    lines.push('');

    lines.push('### Short-term (Next 2-4 Weeks)\n');
    if (recommendations.shortTerm.length === 0) {
      lines.push('No short-term actions identified.');
    } else {
      for (const action of recommendations.shortTerm) {
        const effort = action.effort ? ` (Effort: ${action.effort})` : '';
        lines.push(`- ${action.action}${effort}`);
      }
    }
    lines.push('');

    lines.push('### Long-term Improvements\n');
    if (recommendations.longTerm.length === 0) {
      lines.push('No long-term improvements identified.');
    } else {
      for (const action of recommendations.longTerm) {
        lines.push(`- ${action.action}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Serialize feature quality heatmap
   */
  private serializeHeatmap(heatmap: FeatureQualityHeatmap): string {
    const lines: string[] = [];

    lines.push('## Feature Quality Heatmap\n');
    lines.push('```');
    lines.push('Component                    | E | F | P | N | Score');
    lines.push('-----------------------------|---|---|---|---|------');

    for (const row of heatmap.rows) {
      const name = row.component.padEnd(28).substring(0, 28);
      const e = this.getHeatmapChar(row.enterprise);
      const f = this.getHeatmapChar(row.full);
      const p = this.getHeatmapChar(row.partial);
      const n = this.getHeatmapChar(row.notImplemented);
      lines.push(`${name} | ${e} | ${f} | ${p} | ${n} | ${row.score.toFixed(1)}/10`);
    }

    lines.push('```');
    lines.push('');
    lines.push('**Legend:** E=Enterprise, F=Full, P=Partial, N=Not Implemented');
    lines.push('**Symbols:** ▓ (3+), ▒ (1-2), ░ (0)');

    return lines.join('\n');
  }

  /**
   * Get heatmap character based on count
   */
  private getHeatmapChar(count: number): string {
    if (count >= 3) return '▓';
    if (count >= 1) return '▒';
    return '░';
  }

  /**
   * Get the output file path for SUMMARY_AGREEMENT.md
   */
  getOutputPath(): string {
    return `${this.config.basePath}/SUMMARY_AGREEMENT.md`.replace(/\/+/g, '/');
  }

  /**
   * Write the markdown content to file
   */
  private async writeFile(filePath: string, content: string): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
  }

  /**
   * Create an empty document structure for error cases
   */
  private createEmptyDocument(): SummaryAgreementDocument {
    return {
      executiveSummary: {
        projectName: this.config.projectName,
        evaluationDate: new Date().toISOString().split('T')[0],
        componentsEvaluated: 0,
        totalFeaturesEvaluated: 0,
        keyFindings: [],
      },
      detailedTable: [],
      statistics: {
        completenessDistribution: { enterpriseLevel: 0, full: 0, partial: 0, notImplemented: 0 },
        codeQualityDistribution: { excellent: 0, good: 0, basic: 0, poor: 0 },
        performanceIssues: { critical: 0, medium: 0, good: 0 },
      },
      criticalIssues: [],
      commonAntiPatterns: [],
      productionReadiness: [],
      stressCollapseSummary: { mostFragile: [], mostRobust: [] },
      recommendations: { immediateActions: [], shortTerm: [], longTerm: [] },
      heatmap: { rows: [] },
    };
  }
}
