/**
 * FeatureTableGenerator - Generates markdown tables for identified features
 * 
 * Creates formatted markdown tables with feature information and
 * external dependencies sections.
 * 
 * @module FeatureTableGenerator
 */

import type { AtomicFeature, ExternalDependency } from '../../types/evaluation';

/**
 * Configuration for table generation
 */
export interface FeatureTableGeneratorConfig {
  /** Whether to include line numbers in location */
  includeLineNumbers?: boolean;
  /** Maximum description length before truncation */
  maxDescriptionLength?: number;
  /** Whether to sort features by ID */
  sortById?: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<FeatureTableGeneratorConfig> = {
  includeLineNumbers: true,
  maxDescriptionLength: 80,
  sortById: true,
};

/**
 * Result of table generation
 */
export interface FeatureTableResult {
  /** The markdown table string */
  table: string;
  /** The external dependencies section string */
  externalDependenciesSection: string;
  /** Total feature count */
  totalFeatures: number;
  /** Total lines of code across all features */
  totalLinesOfCode: number;
}

/**
 * FeatureTableGenerator class for creating markdown feature tables
 * 
 * @example
 * ```typescript
 * const generator = new FeatureTableGenerator();
 * const result = generator.generateTable(features, dependencies);
 * console.log(result.table);
 * console.log(result.externalDependenciesSection);
 * ```
 */
export class FeatureTableGenerator {
  private config: Required<FeatureTableGeneratorConfig>;

  constructor(config: FeatureTableGeneratorConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generates a complete feature table with external dependencies section
   * 
   * @param features - Array of identified atomic features
   * @param externalDependencies - Array of external dependencies
   * @returns Feature table result with table and dependencies section
   */
  generateTable(
    features: AtomicFeature[],
    externalDependencies: ExternalDependency[] = []
  ): FeatureTableResult {
    const sortedFeatures = this.config.sortById
      ? [...features].sort((a, b) => a.id - b.id)
      : features;

    const table = this.generateMarkdownTable(sortedFeatures);
    const externalDependenciesSection = this.generateExternalDependenciesSection(externalDependencies);
    const totalLinesOfCode = features.reduce((sum, f) => sum + f.linesOfCode, 0);

    return {
      table,
      externalDependenciesSection,
      totalFeatures: features.length,
      totalLinesOfCode,
    };
  }

  /**
   * Generates the markdown table for features
   * 
   * Table format:
   * | # | Feature Name | Description | LOC | Primary Location |
   */
  generateMarkdownTable(features: AtomicFeature[]): string {
    if (features.length === 0) {
      return '| # | Feature Name | Description | LOC | Primary Location |\n|---|-------------|-------------|-----|------------------|\n| - | No features identified | - | - | - |';
    }

    const header = '| # | Feature Name | Description | LOC | Primary Location |';
    const separator = '|---|-------------|-------------|-----|------------------|';
    
    const rows = features.map(feature => this.generateTableRow(feature));

    return [header, separator, ...rows].join('\n');
  }

  /**
   * Generates a single table row for a feature
   */
  private generateTableRow(feature: AtomicFeature): string {
    const id = feature.id.toString();
    const name = this.escapeMarkdown(feature.name);
    const description = this.truncateDescription(feature.description);
    const loc = `~${feature.linesOfCode}`;
    const location = this.formatLocation(feature.primaryLocation);

    return `| ${id} | ${name} | ${description} | ${loc} | ${location} |`;
  }

  /**
   * Formats the primary location as [File:line-range]
   */
  formatLocation(location: AtomicFeature['primaryLocation']): string {
    const { file, startLine, endLine } = location;
    
    if (!this.config.includeLineNumbers) {
      return file;
    }

    if (startLine === endLine) {
      return `${file}:${startLine}`;
    }

    return `${file}:${startLine}-${endLine}`;
  }

  /**
   * Generates the external dependencies section
   */
  generateExternalDependenciesSection(dependencies: ExternalDependency[]): string {
    if (dependencies.length === 0) {
      return '**External Dependencies (Separate Packages):**\n- None identified';
    }

    const header = '**External Dependencies (Separate Packages):**';
    const items = dependencies.map(dep => this.formatDependencyItem(dep));

    return [header, ...items].join('\n');
  }

  /**
   * Formats a single dependency item
   */
  private formatDependencyItem(dependency: ExternalDependency): string {
    const { packageName, purpose } = dependency;
    return `- **${packageName}** - ${purpose} (NOT evaluated as feature here)`;
  }

  /**
   * Truncates description to max length
   */
  private truncateDescription(description: string): string {
    const escaped = this.escapeMarkdown(description);
    
    if (escaped.length <= this.config.maxDescriptionLength) {
      return escaped;
    }

    return escaped.substring(0, this.config.maxDescriptionLength - 3) + '...';
  }

  /**
   * Escapes markdown special characters in text
   */
  private escapeMarkdown(text: string): string {
    return text
      .replace(/\|/g, '\\|')
      .replace(/\n/g, ' ')
      .replace(/\r/g, '');
  }

  /**
   * Generates a summary line for the feature count
   */
  generateSummaryLine(totalFeatures: number): string {
    return `**Total Atomic Features Identified:** ${totalFeatures}`;
  }

  /**
   * Generates the complete feature identification section
   * 
   * @param features - Array of identified atomic features
   * @param externalDependencies - Array of external dependencies
   * @param methodology - Array of methodology steps
   * @returns Complete markdown section
   */
  generateFeatureIdentificationSection(
    features: AtomicFeature[],
    externalDependencies: ExternalDependency[] = [],
    methodology: string[] = []
  ): string {
    const result = this.generateTable(features, externalDependencies);
    
    const sections: string[] = [];

    // Methodology section
    if (methodology.length > 0) {
      sections.push('**Methodology:**');
      methodology.forEach((step, index) => {
        sections.push(`${index + 1}. ${step}`);
      });
      sections.push('');
    }

    // Features table
    sections.push('**Identified Atomic Features:**');
    sections.push('');
    sections.push(result.table);
    sections.push('');

    // Summary
    sections.push(this.generateSummaryLine(result.totalFeatures));
    sections.push('');

    // External dependencies
    sections.push(result.externalDependenciesSection);

    return sections.join('\n');
  }

  /**
   * Validates that a feature has all required fields for table generation
   */
  validateFeature(feature: AtomicFeature): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (typeof feature.id !== 'number' || feature.id <= 0) {
      errors.push('Feature ID must be a positive number');
    }

    if (!feature.name || typeof feature.name !== 'string') {
      errors.push('Feature name is required');
    }

    if (!feature.description || typeof feature.description !== 'string') {
      errors.push('Feature description is required');
    }

    if (typeof feature.linesOfCode !== 'number' || feature.linesOfCode < 0) {
      errors.push('Lines of code must be a non-negative number');
    }

    if (!feature.primaryLocation) {
      errors.push('Primary location is required');
    } else {
      if (!feature.primaryLocation.file) {
        errors.push('Primary location file is required');
      }
      if (typeof feature.primaryLocation.startLine !== 'number' || feature.primaryLocation.startLine <= 0) {
        errors.push('Primary location start line must be a positive number');
      }
      if (typeof feature.primaryLocation.endLine !== 'number' || feature.primaryLocation.endLine <= 0) {
        errors.push('Primary location end line must be a positive number');
      }
      if (feature.primaryLocation.endLine < feature.primaryLocation.startLine) {
        errors.push('Primary location end line must be >= start line');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates all features and returns validation results
   */
  validateFeatures(features: AtomicFeature[]): {
    valid: boolean;
    invalidFeatures: Array<{ feature: AtomicFeature; errors: string[] }>;
  } {
    const invalidFeatures: Array<{ feature: AtomicFeature; errors: string[] }> = [];

    for (const feature of features) {
      const result = this.validateFeature(feature);
      if (!result.valid) {
        invalidFeatures.push({ feature, errors: result.errors });
      }
    }

    return {
      valid: invalidFeatures.length === 0,
      invalidFeatures,
    };
  }
}
