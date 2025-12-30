/**
 * Document structure types for AGREEMENT.md and SUMMARY_AGREEMENT.md
 * 
 * These types define the structure of the generated evaluation documents.
 */

import type { AtomicFeature, ExternalDependency } from './evaluation';
import type { FeatureEvaluation } from './dimensions';

// ============================================================================
// AGREEMENT.md Document Structure
// ============================================================================

/**
 * Header section of AGREEMENT.md
 */
export interface AgreementHeader {
  /** Component or feature package name */
  componentName: string;
  /** Type of package */
  type: 'Component' | 'Feature Package';
  /** Date of evaluation (ISO format) */
  evaluatedDate: string;
  /** File path to the package */
  path: string;
  /** Approximate lines of code */
  linesOfCode: number;
}

/**
 * Feature identification section of AGREEMENT.md
 */
export interface FeatureIdentificationSection {
  /** Methodology steps used for identification */
  methodology: string[];
  /** Table of identified features */
  featuresTable: AtomicFeature[];
  /** Total number of features identified */
  totalFeatures: number;
  /** External dependencies (separate packages) */
  externalDependencies: ExternalDependency[];
}

/**
 * Priority action recommendation
 */
export interface PriorityAction {
  /** Priority level */
  priority: 'High' | 'Medium' | 'Low';
  /** Action description */
  action: string;
  /** Related feature name (optional) */
  feature?: string;
}

/**
 * Production readiness status
 */
export type ProductionReadinessStatus =
  | 'Production Ready'  // ✅ 80%+ features at Full/Enterprise
  | 'Staging Ready'     // 🟡 60-79%
  | 'Development'       // ⚠️ 40-59%
  | 'Not Ready';        // ❌ <40%

/**
 * Component-level summary statistics
 */
export interface ComponentSummary {
  /** Overall statistics */
  statistics: {
    totalFeatures: number;
    enterpriseLevel: number;
    fullImplementation: number;
    partialImplementation: number;
    notImplemented: number;
  };
  /** Critical issues across all features */
  criticalIssues: string[];
  /** Key strengths identified */
  strengths: string[];
  /** Recommended priority actions */
  recommendedActions: PriorityAction[];
  /** Overall production readiness status */
  overallReadiness: ProductionReadinessStatus;
}

/**
 * Complete AGREEMENT.md document structure
 */
export interface AgreementDocument {
  /** Header section */
  header: AgreementHeader;
  /** Feature identification section */
  featureIdentification: FeatureIdentificationSection;
  /** Feature-by-feature evaluations */
  featureEvaluations: FeatureEvaluation[];
  /** Component-level summary */
  componentSummary: ComponentSummary;
}

// ============================================================================
// SUMMARY_AGREEMENT.md Document Structure
// ============================================================================

/**
 * Executive summary section
 */
export interface ExecutiveSummary {
  /** Project name */
  projectName: string;
  /** Evaluation date */
  evaluationDate: string;
  /** Number of components/packages evaluated */
  componentsEvaluated: number;
  /** Total atomic features evaluated */
  totalFeaturesEvaluated: number;
  /** Key findings list */
  keyFindings: string[];
}

/**
 * Row in the detailed evaluation table
 */
export interface DetailedEvaluationRow {
  /** Component or package name */
  componentPackage: string;
  /** Type (Component, Feature Package, etc.) */
  type: string;
  /** Feature name */
  featureName: string;
  /** Completeness rating */
  completeness: string;
  /** Code quality rating */
  codeQuality: string;
  /** Documentation rating */
  docs: string;
  /** Reliability rating */
  reliability: string;
  /** Performance rating */
  performance: string;
  /** Integration rating */
  integration: string;
  /** Maintenance rating */
  maintenance: string;
  /** When collapse occurs */
  whenCollapse: string;
  /** Additional notes */
  notes: string;
}

/**
 * Statistics by category
 */
export interface StatisticsByCategory {
  /** Feature completeness distribution */
  completenessDistribution: {
    enterpriseLevel: number;
    full: number;
    partial: number;
    notImplemented: number;
  };
  /** Code quality distribution */
  codeQualityDistribution: {
    excellent: number;
    good: number;
    basic: number;
    poor: number;
  };
  /** Performance issues count */
  performanceIssues: {
    critical: number;
    medium: number;
    good: number;
  };
}

/**
 * Critical issue entry
 */
export interface CriticalIssue {
  /** Issue number */
  id: number;
  /** Component name */
  componentName: string;
  /** Feature name */
  featureName: string;
  /** Issue description */
  issue: string;
  /** Impact description */
  impact: string;
  /** Evidence (code reference) */
  evidence: string;
  /** Recommendation */
  recommendation: string;
}

/**
 * Common anti-pattern across project
 */
export interface CommonAntiPattern {
  /** Pattern number */
  id: number;
  /** Pattern name */
  patternName: string;
  /** Affected components and features */
  affectedComponents: Array<{
    component: string;
    feature: string;
  }>;
  /** Impact description */
  impact: string;
  /** Recommendation */
  recommendation: string;
}

/**
 * Production readiness row for a component
 */
export interface ProductionReadinessRow {
  /** Component or package name */
  componentPackage: string;
  /** Total features count */
  totalFeatures: number;
  /** Enterprise-level features count */
  enterprise: number;
  /** Full implementation features count */
  full: number;
  /** Partial implementation features count */
  partial: number;
  /** Not implemented features count */
  notImplemented: number;
  /** Overall status */
  overallStatus: ProductionReadinessStatus;
}

/**
 * Fragile feature entry
 */
export interface FragileFeature {
  /** Component name */
  component: string;
  /** Feature name */
  feature: string;
  /** Collapse threshold */
  collapsesAt: string;
  /** Impact description */
  impact: string;
  /** Priority level */
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Robust feature entry
 */
export interface RobustFeature {
  /** Component name */
  component: string;
  /** Feature name */
  feature: string;
  /** Reason for robustness */
  reason: string;
}

/**
 * Stress collapse summary
 */
export interface StressCollapseSummary {
  /** Most fragile features (earliest collapse) */
  mostFragile: FragileFeature[];
  /** Most robust features (high stress tolerance) */
  mostRobust: RobustFeature[];
}

/**
 * Recommendation with effort estimate
 */
export interface RecommendationItem {
  /** Action description */
  action: string;
  /** Effort estimate (optional) */
  effort?: string;
}

/**
 * Recommendations section
 */
export interface Recommendations {
  /** Immediate actions (this sprint) */
  immediateActions: RecommendationItem[];
  /** Short-term actions (next 2-4 weeks) */
  shortTerm: RecommendationItem[];
  /** Long-term improvements */
  longTerm: RecommendationItem[];
}

/**
 * Heatmap row for a component
 */
export interface HeatmapRow {
  /** Component name */
  component: string;
  /** Enterprise-level count */
  enterprise: number;
  /** Full implementation count */
  full: number;
  /** Partial implementation count */
  partial: number;
  /** Not implemented count */
  notImplemented: number;
  /** Score out of 10 */
  score: number;
}

/**
 * Feature quality heatmap
 */
export interface FeatureQualityHeatmap {
  /** Rows for each component */
  rows: HeatmapRow[];
}

/**
 * Complete SUMMARY_AGREEMENT.md document structure
 */
export interface SummaryAgreementDocument {
  /** Executive summary */
  executiveSummary: ExecutiveSummary;
  /** Detailed evaluation table (one row per atomic feature) */
  detailedTable: DetailedEvaluationRow[];
  /** Statistics by category */
  statistics: StatisticsByCategory;
  /** Critical issues list */
  criticalIssues: CriticalIssue[];
  /** Common anti-patterns across project */
  commonAntiPatterns: CommonAntiPattern[];
  /** Production readiness by component */
  productionReadiness: ProductionReadinessRow[];
  /** Stress collapse summary */
  stressCollapseSummary: StressCollapseSummary;
  /** Recommendations */
  recommendations: Recommendations;
  /** Feature quality heatmap */
  heatmap: FeatureQualityHeatmap;
}
