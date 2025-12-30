/**
 * Core evaluation types for the Blind Evaluation Framework
 * 
 * These types define the fundamental data structures used throughout
 * the evaluation system.
 */

/**
 * Represents a code block within a feature
 */
export interface CodeBlock {
  /** File path relative to package root */
  file: string;
  /** Starting line number */
  startLine: number;
  /** Ending line number */
  endLine: number;
  /** The actual code content */
  content: string;
  /** Programming language identifier */
  language: string;
}

/**
 * Represents state management usage within a feature
 */
export interface StateUsage {
  /** Type of state hook (useState, useReducer, etc.) */
  hookType: string;
  /** Variable name for the state */
  stateName: string;
  /** File location */
  file: string;
  /** Line number */
  line: number;
}

/**
 * Represents an event handler within a feature
 */
export interface EventHandler {
  /** Name of the handler function */
  handlerName: string;
  /** Event type (onClick, onChange, etc.) */
  eventType: string;
  /** File location */
  file: string;
  /** Line number */
  line: number;
}

/**
 * Represents the smallest independent capability within a component
 * that serves a single purpose and can be evaluated independently
 */
export interface AtomicFeature {
  /** Unique identifier within the component */
  id: number;
  /** Human-readable feature name */
  name: string;
  /** Brief one-line description */
  description: string;
  /** Approximate lines of code */
  linesOfCode: number;
  /** Primary file location with line range */
  primaryLocation: {
    file: string;
    startLine: number;
    endLine: number;
  };
  /** All code blocks belonging to this feature */
  codeBlocks: CodeBlock[];
  /** State management patterns used */
  stateManagement: StateUsage[];
  /** Event handlers belonging to this feature */
  eventHandlers: EventHandler[];
}

/**
 * Result of feature identification for a component
 */
export interface FeatureIdentificationResult {
  /** Path to the component package */
  componentPath: string;
  /** Type of package being evaluated */
  componentType: 'Component' | 'Feature Package';
  /** List of identified atomic features */
  identifiedFeatures: AtomicFeature[];
  /** External dependencies that are separate packages */
  externalDependencies: ExternalDependency[];
  /** Total lines of code in the component */
  totalLinesOfCode: number;
}

/**
 * Represents an external package dependency
 */
export interface ExternalDependency {
  /** Name of the external package */
  packageName: string;
  /** Purpose/usage of the dependency */
  purpose: string;
  /** Import path used */
  importPath: string;
}

/**
 * Result of checking if a capability is a separate package
 */
export interface PackageBoundaryCheck {
  /** Name of the capability being checked */
  capability: string;
  /** Whether it exists as a separate package */
  isSeparatePackage: boolean;
  /** Path to the package if it exists */
  packagePath?: string;
  /** Reason for the determination */
  reason: string;
}

/**
 * Code evidence supporting an evaluation rating
 */
export interface CodeEvidence {
  /** File path relative to package root */
  filePath: string;
  /** Line number range */
  lineNumbers: {
    start: number;
    end: number;
  };
  /** The actual code snippet */
  codeSnippet: string;
  /** Programming language identifier */
  language: string;
}

/**
 * Rating enums for type safety
 */

/** Feature completeness rating levels */
export enum CompletenessRating {
  NOT_IMPLEMENTED = 0,
  PARTIAL = 1,
  FULL = 2,
  ENTERPRISE = 3
}

/** Code quality rating levels */
export enum QualityRating {
  POOR = 0,
  BASIC = 1,
  GOOD = 2,
  EXCELLENT = 3
}

/** Documentation rating levels */
export enum DocumentationRating {
  NONE = 0,
  BASIC = 1,
  GOOD = 2,
  EXCELLENT = 3
}

/** Reliability rating levels */
export enum ReliabilityRating {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
  ENTERPRISE = 3
}

/** Performance rating levels */
export enum PerformanceRating {
  POOR = 0,
  ACCEPTABLE = 1,
  GOOD = 2,
  EXCELLENT = 3
}

/** Integration rating levels */
export enum IntegrationRating {
  NOT_COMPATIBLE = 0,
  PARTIAL = 1,
  FULL = 2,
  ENTERPRISE = 3
}

/** Maintenance rating levels */
export enum MaintenanceRating {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
  ENTERPRISE = 3
}

/**
 * String representations of ratings for display
 */
export type CompletenessRatingString = 'Not Implemented' | 'Partial' | 'Full' | 'Enterprise-Level';
export type QualityRatingString = 'Poor' | 'Basic' | 'Good' | 'Excellent';
export type DocumentationRatingString = 'None' | 'Basic' | 'Good' | 'Excellent';
export type ReliabilityRatingString = 'Low' | 'Medium' | 'High' | 'Enterprise-Level';
export type PerformanceRatingString = 'Poor' | 'Acceptable' | 'Good' | 'Excellent';
export type IntegrationRatingString = 'Not Compatible' | 'Partial' | 'Full' | 'Enterprise-Level';
export type MaintenanceRatingString = 'Low' | 'Medium' | 'High' | 'Enterprise-Level';

/**
 * Evaluation session containing all package evaluations
 */
export interface EvaluationSession {
  /** Project name */
  projectName: string;
  /** Date of evaluation */
  evaluationDate: string;
  /** All package evaluations */
  packages: PackageEvaluation[];
}

/**
 * Evaluation for a single package
 */
export interface PackageEvaluation {
  /** Path to the package */
  packagePath: string;
  /** Type of package */
  packageType: 'Component' | 'Feature Package' | 'UI' | 'Primitives';
  /** The generated AGREEMENT.md document data */
  agreementDocument: import('./documents').AgreementDocument;
}
