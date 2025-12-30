/**
 * Utility functions for the Progressive Feedback System
 *
 * Provides helper functions for:
 * - Calculating escalation levels based on duration
 * - Generating unique operation IDs
 * - Merging and validating configuration
 * - Error type checking
 *
 * ## Key Functions
 *
 * ### calculateEscalationLevel
 * Determines the appropriate feedback level based on operation duration.
 *
 * ```typescript
 * import { calculateEscalationLevel, DEFAULT_ESCALATION_CONFIG } from '@symphony/ui/feedback';
 *
 * const level = calculateEscalationLevel(1500, DEFAULT_ESCALATION_CONFIG);
 * // Returns 'overlay' (between 500ms and 2000ms)
 * ```
 *
 * ### generateOperationId
 * Creates unique identifiers for operations.
 *
 * ```typescript
 * import { generateOperationId } from '@symphony/ui/feedback';
 *
 * const id = generateOperationId();
 * // Returns something like 'op_1703123456789_abc123'
 * ```
 *
 * ### mergeEscalationConfig
 * Merges partial config with defaults.
 *
 * ```typescript
 * import { mergeEscalationConfig } from '@symphony/ui/feedback';
 *
 * const config = mergeEscalationConfig({ modalThreshold: 5000 });
 * // Returns full config with custom modalThreshold
 * ```
 *
 * @module feedback/utils
 */

import type { EscalationLevel, EscalationConfig } from './types';
import { DEFAULT_ESCALATION_CONFIG } from './types';

/**
 * Calculate the escalation level based on operation duration.
 *
 * @param duration - Duration of the operation in milliseconds
 * @param config - Escalation configuration with thresholds
 * @returns The appropriate escalation level for the given duration
 *
 * @example
 * ```ts
 * // Fast operation - no feedback
 * calculateEscalationLevel(100, DEFAULT_ESCALATION_CONFIG); // 'none'
 *
 * // Medium operation - inline spinner
 * calculateEscalationLevel(300, DEFAULT_ESCALATION_CONFIG); // 'inline'
 *
 * // Longer operation - overlay
 * calculateEscalationLevel(1000, DEFAULT_ESCALATION_CONFIG); // 'overlay'
 *
 * // Long operation - modal
 * calculateEscalationLevel(3000, DEFAULT_ESCALATION_CONFIG); // 'modal'
 * ```
 */
export function calculateEscalationLevel(
  duration: number,
  config: EscalationConfig = DEFAULT_ESCALATION_CONFIG
): EscalationLevel {
  if (duration < config.inlineThreshold) {
    return 'none';
  }
  if (duration < config.overlayThreshold) {
    return 'inline';
  }
  if (duration < config.modalThreshold) {
    return 'overlay';
  }
  return 'modal';
}

/**
 * Generate a unique operation ID.
 *
 * @returns A unique string identifier for an operation
 */
export function generateOperationId(): string {
  return `op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Merge partial escalation config with defaults.
 *
 * @param partial - Partial configuration to merge
 * @returns Complete escalation configuration
 */
export function mergeEscalationConfig(
  partial?: Partial<EscalationConfig>
): EscalationConfig {
  return {
    ...DEFAULT_ESCALATION_CONFIG,
    ...partial,
  };
}

/**
 * Validate that escalation thresholds are in correct order.
 *
 * @param config - Configuration to validate
 * @returns True if thresholds are valid (inline < overlay < modal)
 */
export function validateEscalationConfig(config: EscalationConfig): boolean {
  return (
    config.inlineThreshold >= 0 &&
    config.overlayThreshold > config.inlineThreshold &&
    config.modalThreshold > config.overlayThreshold
  );
}

/**
 * Check if an error is a timeout error.
 *
 * @param error - Error to check
 * @returns True if the error is a timeout error
 */
export function isTimeoutError(error: Error | undefined): boolean {
  if (!error) return false;
  const message = error.message.toLowerCase();
  return message.includes('timed out') || message.includes('timeout');
}

/**
 * Create a timeout error with a specific message.
 *
 * @param timeoutMs - Timeout duration in milliseconds
 * @returns Error with timeout message
 */
export function createTimeoutError(timeoutMs: number): Error {
  return new Error(`Operation timed out after ${timeoutMs}ms`);
}
