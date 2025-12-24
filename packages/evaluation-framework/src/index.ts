/**
 * Blind Evaluation Framework
 * 
 * A systematic code quality assessment system for Symphony IDE's frontend packages.
 * Provides structured methodology to identify atomic features within components,
 * evaluate each feature across 8 quality dimensions, and generate standardized
 * evaluation artifacts (AGREEMENT.md and SUMMARY_AGREEMENT.md files).
 * 
 * @module @symphony/evaluation-framework
 * 
 * @example
 * ```typescript
 * import { 
 *   MarkdownSerializer,
 *   MarkdownParser,
 *   type AgreementDocument,
 * } from '@symphony/evaluation-framework';
 * 
 * // Serialize evaluation data to markdown
 * const markdown = MarkdownSerializer.serializeAgreement(document);
 * 
 * // Parse AGREEMENT.md back to data structure
 * const parsed = MarkdownParser.parseAgreement(markdown);
 * ```
 */

// Re-export types
export * from '../types/index';

// Serialization module
export * from './serialization';

// Feature Identifier module
export * from './identifier';

// Evaluators module
export * from './evaluators';

// Generators module
export * from './generators';

// CLI module
export * from './cli';
