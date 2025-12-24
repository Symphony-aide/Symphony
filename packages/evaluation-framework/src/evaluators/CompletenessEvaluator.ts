/**
 * CompletenessEvaluator - Evaluates feature completeness (Dimension 1)
 * 
 * Analyzes implemented vs missing capabilities for each atomic feature,
 * calculates percentage based on capability coverage, and assigns ratings.
 * 
 * @module CompletenessEvaluator
 */

import type {
  AtomicFeature,
  CodeEvidence,
  CompletenessRatingString,
} from '../../types/evaluation';
import type {
  CompletenessEvaluation,
  CapabilityStatus,
} from '../../types/dimensions';

/**
 * Represents a capability that can be evaluated
 */
export interface Capability {
  /** Name of the capability */
  name: string;
  /** Description of what the capability does */
  description?: string;
  /** Whether this capability is required for full implementation */
  required: boolean;
  /** Weight for percentage calculation (default: 1) */
  weight?: number;
}

/**
 * Result of analyzing a capability's implementation status
 */
export interface CapabilityAnalysisResult {
  /** The capability being analyzed */
  capability: Capability;
  /** Implementation status */
  status: 'implemented' | 'missing' | 'incomplete';
  /** Details about the implementation or what's missing */
  details?: string;
  /** Code evidence if implemented or partially implemented */
  evidence?: CodeEvidence;
}

/**
 * Configuration options for completeness evaluation
 */
export interface CompletenessEvaluatorOptions {
  /** Minimum percentage for Partial rating (default: 1) */
  partialMinPercentage?: number;
  /** Minimum percentage for Full rating (default: 50) */
  fullMinPercentage?: number;
  /** Minimum percentage for Enterprise rating (default: 100) */
  enterpriseMinPercentage?: number;
}

/**
 * Default configuration for completeness evaluation
 */
const DEFAULT_OPTIONS: Required<CompletenessEvaluatorOptions> = {
  partialMinPercentage: 1,
  fullMinPercentage: 50,
  enterpriseMinPercentage: 100,
};

/**
 * CompletenessEvaluator class for evaluating feature completeness
 * 
 * @example
 * ```typescript
 * const evaluator = new CompletenessEvaluator();
 * const capabilities = [
 *   { name: 'Display time', required: true },
 *   { name: 'Format options', required: false },
 * ];
 * const analysisResults = [
 *   { capability: capabilities[0], status: 'implemented' },
 *   { capability: capabilities[1], status: 'missing' },
 * ];
 * const evaluation = evaluator.evaluate(feature, analysisResults, evidence);
 * ```
 */
export class CompletenessEvaluator {
  private options: Required<CompletenessEvaluatorOptions>;

  constructor(options: CompletenessEvaluatorOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Evaluates the completeness of an atomic feature
   * 
   * @param feature - The atomic feature being evaluated
   * @param analysisResults - Results of capability analysis
   * @param evidence - Code evidence supporting the evaluation
   * @returns Complete evaluation with rating, percentage, and rationale
   */
  evaluate(
    feature: AtomicFeature,
    analysisResults: CapabilityAnalysisResult[],
    evidence: CodeEvidence
  ): CompletenessEvaluation {
    // Categorize capabilities by status
    const implemented = this.filterByStatus(analysisResults, 'implemented');
    const missing = this.filterByStatus(analysisResults, 'missing');
    const incomplete = this.filterByStatus(analysisResults, 'incomplete');

    // Calculate percentage
    const percentage = this.calculatePercentage(analysisResults);

    // Determine rating based on percentage
    const rating = this.determineRating(percentage);

    // Generate rationale
    const rationale = this.generateRationale(
      feature,
      rating,
      percentage,
      implemented,
      missing,
      incomplete
    );

    return {
      rating,
      percentage,
      implemented: this.toCapabilityStatusList(implemented),
      missing: this.toCapabilityStatusList(missing),
      incomplete: this.toCapabilityStatusList(incomplete),
      evidence,
      rationale,
    };
  }

  /**
   * Calculates the completeness percentage based on capability analysis
   * 
   * @param analysisResults - Results of capability analysis
   * @returns Percentage (0-100)
   */
  calculatePercentage(analysisResults: CapabilityAnalysisResult[]): number {
    if (analysisResults.length === 0) {
      return 0;
    }

    let totalWeight = 0;
    let implementedWeight = 0;

    for (const result of analysisResults) {
      const weight = result.capability.weight ?? 1;
      totalWeight += weight;

      if (result.status === 'implemented') {
        implementedWeight += weight;
      } else if (result.status === 'incomplete') {
        // Incomplete capabilities count as 50% implemented
        implementedWeight += weight * 0.5;
      }
      // Missing capabilities contribute 0
    }

    if (totalWeight === 0) {
      return 0;
    }

    const percentage = Math.round((implementedWeight / totalWeight) * 100);
    return Math.min(100, Math.max(0, percentage));
  }

  /**
   * Determines the rating based on percentage
   * 
   * @param percentage - Completeness percentage (0-100)
   * @returns Rating string
   */
  determineRating(percentage: number): CompletenessRatingString {
    if (percentage >= this.options.enterpriseMinPercentage) {
      return 'Enterprise-Level';
    }
    if (percentage >= this.options.fullMinPercentage) {
      return 'Full';
    }
    if (percentage >= this.options.partialMinPercentage) {
      return 'Partial';
    }
    return 'Not Implemented';
  }

  /**
   * Generates a rationale explaining the rating
   * 
   * @param feature - The atomic feature being evaluated
   * @param rating - The assigned rating
   * @param percentage - The calculated percentage
   * @param implemented - List of implemented capabilities
   * @param missing - List of missing capabilities
   * @param incomplete - List of incomplete capabilities
   * @returns Rationale string
   */
  generateRationale(
    feature: AtomicFeature,
    rating: CompletenessRatingString,
    percentage: number,
    implemented: CapabilityAnalysisResult[],
    missing: CapabilityAnalysisResult[],
    incomplete: CapabilityAnalysisResult[]
  ): string {
    const parts: string[] = [];

    // Opening statement about the rating
    parts.push(
      `The ${feature.name} feature is rated as ${rating} (${percentage}%).`
    );

    // Describe implemented capabilities
    if (implemented.length > 0) {
      const implNames = implemented.map(r => r.capability.name).join(', ');
      parts.push(`Implemented capabilities include: ${implNames}.`);
    }

    // Describe missing capabilities
    if (missing.length > 0) {
      const missNames = missing.map(r => r.capability.name).join(', ');
      parts.push(`Missing capabilities: ${missNames}.`);
    }

    // Describe incomplete capabilities
    if (incomplete.length > 0) {
      const incompleteDescriptions = incomplete.map(r => {
        const details = r.details ? ` (${r.details})` : '';
        return `${r.capability.name}${details}`;
      });
      parts.push(`Partially implemented: ${incompleteDescriptions.join(', ')}.`);
    }

    // Add rating-specific context
    switch (rating) {
      case 'Enterprise-Level':
        parts.push('All expected capabilities are fully implemented.');
        break;
      case 'Full':
        parts.push('Core functionality is complete with some enhancements possible.');
        break;
      case 'Partial':
        parts.push('Basic functionality exists but significant gaps remain.');
        break;
      case 'Not Implemented':
        parts.push('The feature lacks implementation or has no functional capabilities.');
        break;
    }

    return parts.join(' ');
  }

  /**
   * Filters analysis results by status
   */
  private filterByStatus(
    results: CapabilityAnalysisResult[],
    status: 'implemented' | 'missing' | 'incomplete'
  ): CapabilityAnalysisResult[] {
    return results.filter(r => r.status === status);
  }

  /**
   * Converts analysis results to CapabilityStatus list
   */
  private toCapabilityStatusList(
    results: CapabilityAnalysisResult[]
  ): CapabilityStatus[] {
    return results.map(r => ({
      capability: r.capability.name,
      status: r.status,
      details: r.details,
    }));
  }

  /**
   * Creates a default evaluation for features with no capabilities defined
   * 
   * @param feature - The atomic feature
   * @param evidence - Code evidence
   * @returns Default evaluation
   */
  createDefaultEvaluation(
    feature: AtomicFeature,
    evidence: CodeEvidence
  ): CompletenessEvaluation {
    return {
      rating: 'Not Implemented',
      percentage: 0,
      implemented: [],
      missing: [],
      incomplete: [],
      evidence,
      rationale: `The ${feature.name} feature has no defined capabilities to evaluate.`,
    };
  }

  /**
   * Validates that a rating matches its percentage range
   * 
   * @param rating - The rating to validate
   * @param percentage - The percentage to check against
   * @returns True if the rating is valid for the percentage
   */
  isValidRatingForPercentage(
    rating: CompletenessRatingString,
    percentage: number
  ): boolean {
    const expectedRating = this.determineRating(percentage);
    return rating === expectedRating;
  }

  /**
   * Gets the percentage range for a given rating
   * 
   * @param rating - The rating to get the range for
   * @returns Object with min and max percentage values
   */
  getPercentageRangeForRating(
    rating: CompletenessRatingString
  ): { min: number; max: number } {
    switch (rating) {
      case 'Not Implemented':
        return { min: 0, max: 0 };
      case 'Partial':
        return { 
          min: this.options.partialMinPercentage, 
          max: this.options.fullMinPercentage - 1 
        };
      case 'Full':
        return { 
          min: this.options.fullMinPercentage, 
          max: this.options.enterpriseMinPercentage - 1 
        };
      case 'Enterprise-Level':
        return { min: this.options.enterpriseMinPercentage, max: 100 };
    }
  }
}

/**
 * Helper function to create a capability analysis result
 */
export function createCapabilityAnalysis(
  capability: Capability,
  status: 'implemented' | 'missing' | 'incomplete',
  details?: string,
  evidence?: CodeEvidence
): CapabilityAnalysisResult {
  return {
    capability,
    status,
    details,
    evidence,
  };
}

/**
 * Helper function to create a capability
 */
export function createCapability(
  name: string,
  required: boolean = true,
  weight: number = 1,
  description?: string
): Capability {
  return {
    name,
    description,
    required,
    weight,
  };
}

// ============================================================================
// Capability Status Markers
// ============================================================================

/**
 * Status marker constants for capability display
 */
export const STATUS_MARKERS = {
  IMPLEMENTED: '✅',
  MISSING: '❌',
  INCOMPLETE: '⚠️',
} as const;

/**
 * CapabilityStatusFormatter - Formats capability statuses with markers
 * 
 * Generates formatted lists with appropriate markers:
 * - ✅ **Implemented:** for implemented capabilities
 * - ❌ **Missing:** for missing capabilities
 * - ⚠️ **Incomplete:** for partially implemented capabilities
 */
export class CapabilityStatusFormatter {
  /**
   * Formats implemented capabilities list
   * 
   * @param capabilities - List of implemented capability statuses
   * @returns Formatted markdown string with ✅ markers
   */
  static formatImplemented(capabilities: CapabilityStatus[]): string {
    if (capabilities.length === 0) {
      return '';
    }

    const header = `${STATUS_MARKERS.IMPLEMENTED} **Implemented:**`;
    const items = capabilities.map(cap => `- ${cap.capability}`);
    return [header, ...items].join('\n');
  }

  /**
   * Formats missing capabilities list
   * 
   * @param capabilities - List of missing capability statuses
   * @returns Formatted markdown string with ❌ markers
   */
  static formatMissing(capabilities: CapabilityStatus[]): string {
    if (capabilities.length === 0) {
      return '';
    }

    const header = `${STATUS_MARKERS.MISSING} **Missing:**`;
    const items = capabilities.map(cap => `- ${cap.capability}`);
    return [header, ...items].join('\n');
  }

  /**
   * Formats incomplete capabilities list with details
   * 
   * @param capabilities - List of incomplete capability statuses
   * @returns Formatted markdown string with ⚠️ markers and details
   */
  static formatIncomplete(capabilities: CapabilityStatus[]): string {
    if (capabilities.length === 0) {
      return '';
    }

    const header = `${STATUS_MARKERS.INCOMPLETE} **Incomplete:**`;
    const items = capabilities.map(cap => {
      const details = cap.details ? ` (${cap.details})` : '';
      return `- ${cap.capability}${details}`;
    });
    return [header, ...items].join('\n');
  }

  /**
   * Formats all capability statuses into a complete implementation status section
   * 
   * @param evaluation - The completeness evaluation containing all capability lists
   * @returns Complete formatted markdown section
   */
  static formatImplementationStatus(evaluation: CompletenessEvaluation): string {
    const sections: string[] = [];

    const implemented = this.formatImplemented(evaluation.implemented);
    if (implemented) {
      sections.push(implemented);
    }

    const missing = this.formatMissing(evaluation.missing);
    if (missing) {
      sections.push(missing);
    }

    const incomplete = this.formatIncomplete(evaluation.incomplete);
    if (incomplete) {
      sections.push(incomplete);
    }

    if (sections.length === 0) {
      return 'No capabilities defined for evaluation.';
    }

    return sections.join('\n\n');
  }

  /**
   * Gets the appropriate marker for a capability status
   * 
   * @param status - The capability status
   * @returns The corresponding marker emoji
   */
  static getMarker(status: 'implemented' | 'missing' | 'incomplete'): string {
    switch (status) {
      case 'implemented':
        return STATUS_MARKERS.IMPLEMENTED;
      case 'missing':
        return STATUS_MARKERS.MISSING;
      case 'incomplete':
        return STATUS_MARKERS.INCOMPLETE;
    }
  }

  /**
   * Formats a single capability with its marker
   * 
   * @param capability - The capability status to format
   * @returns Formatted string with marker
   */
  static formatSingleCapability(capability: CapabilityStatus): string {
    const marker = this.getMarker(capability.status);
    const details = capability.details ? ` (${capability.details})` : '';
    return `${marker} ${capability.capability}${details}`;
  }
}
