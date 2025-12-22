/**
 * @fileoverview Property-based tests for EscalationConfigManager
 *
 * **Feature: progressive-feedback-system, Property 14: Configuration override precedence**
 *
 * These tests verify that configuration is applied in the correct order:
 * global defaults < operation-type overrides < component-specific overrides
 *
 * **Validates: Requirements 10.1, 10.2, 10.3**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  EscalationConfigManager,
  resetEscalationConfigManager,
  DEFAULT_CONFIG_ENTRY,
} from '../../feedback/EscalationConfigManager';
import type { EscalationConfigEntry } from '../../feedback/EscalationConfigManager';

/**
 * Generate valid threshold values that maintain correct ordering.
 * Ensures: inlineThreshold < overlayThreshold < modalThreshold
 */
const validThresholdsArb = fc
  .tuple(
    fc.integer({ min: 50, max: 500 }),    // inlineThreshold
    fc.integer({ min: 1, max: 1000 }),    // overlay delta
    fc.integer({ min: 1, max: 5000 })     // modal delta
  )
  .map(([inline, overlayDelta, modalDelta]) => ({
    inlineThreshold: inline,
    overlayThreshold: inline + overlayDelta,
    modalThreshold: inline + overlayDelta + modalDelta,
  }));

/**
 * Generate partial config with optional threshold overrides.
 */
const partialConfigArb = fc.record({
  inlineThreshold: fc.option(fc.integer({ min: 50, max: 500 }), { nil: undefined }),
  overlayThreshold: fc.option(fc.integer({ min: 100, max: 1500 }), { nil: undefined }),
  modalThreshold: fc.option(fc.integer({ min: 500, max: 10000 }), { nil: undefined }),
  timeout: fc.option(fc.integer({ min: 1000, max: 30000 }), { nil: undefined }),
  inlineEnabled: fc.option(fc.boolean(), { nil: undefined }),
  overlayEnabled: fc.option(fc.boolean(), { nil: undefined }),
  modalEnabled: fc.option(fc.boolean(), { nil: undefined }),
}, { requiredKeys: [] });

/**
 * Generate operation type names.
 */
const operationTypeArb = fc.constantFrom(
  'file-operation',
  'network',
  'search',
  'build',
  'git',
  'ai'
);

/**
 * Generate component IDs.
 */
const componentIdArb = fc.constantFrom(
  'file-explorer',
  'code-editor',
  'terminal',
  'search-panel',
  'git-panel'
);

describe('Property 14: Configuration override precedence', () => {
  let configManager: EscalationConfigManager;

  beforeEach(() => {
    resetEscalationConfigManager();
    configManager = new EscalationConfigManager();
  });

  /**
   * **Feature: progressive-feedback-system, Property 14: Configuration override precedence**
   *
   * For any operation, configuration should be applied in order:
   * global defaults < operation-type overrides < component-specific overrides
   *
   * **Validates: Requirements 10.1, 10.2, 10.3**
   */
  it('should apply configuration in correct precedence order', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 300 }),   // global inline
        fc.integer({ min: 150, max: 350 }),   // type inline
        fc.integer({ min: 200, max: 400 }),   // component inline
        operationTypeArb,
        componentIdArb,
        (globalInline, typeInline, componentInline, opType, compId) => {
          // Reset for each test
          configManager.reset();

          // Set global config
          configManager.setGlobalConfig({
            inlineThreshold: globalInline,
            overlayThreshold: globalInline + 500,
            modalThreshold: globalInline + 2000,
          });

          // Set operation type config
          configManager.setOperationTypeConfig(opType, {
            inlineThreshold: typeInline,
          });

          // Set component config
          configManager.setComponentConfig(compId, {
            inlineThreshold: componentInline,
          });

          // Resolve with no options - should get global
          const globalOnly = configManager.resolveConfig({});
          expect(globalOnly.inlineThreshold).toBe(globalInline);

          // Resolve with operation type - should get type override
          const withType = configManager.resolveConfig({ operationType: opType });
          expect(withType.inlineThreshold).toBe(typeInline);

          // Resolve with component - should get component override
          const withComponent = configManager.resolveConfig({ componentId: compId });
          expect(withComponent.inlineThreshold).toBe(componentInline);

          // Resolve with both - component should win
          const withBoth = configManager.resolveConfig({
            operationType: opType,
            componentId: compId,
          });
          expect(withBoth.inlineThreshold).toBe(componentInline);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Component overrides should take precedence over operation type overrides.
   */
  it('should prioritize component config over operation type config', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 500 }),   // type timeout
        fc.integer({ min: 600, max: 1000 }),  // component timeout
        operationTypeArb,
        componentIdArb,
        (typeTimeout, componentTimeout, opType, compId) => {
          configManager.reset();

          // Set operation type timeout
          configManager.setOperationTypeConfig(opType, {
            timeout: typeTimeout,
          });

          // Set component timeout
          configManager.setComponentConfig(compId, {
            timeout: componentTimeout,
          });

          // Resolve with both - component should win
          const resolved = configManager.resolveConfig({
            operationType: opType,
            componentId: compId,
          });

          expect(resolved.timeout).toBe(componentTimeout);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Operation type overrides should take precedence over global defaults.
   */
  it('should prioritize operation type config over global config', () => {
    fc.assert(
      fc.property(
        fc.boolean(),  // global modalEnabled
        fc.boolean(),  // type modalEnabled
        operationTypeArb,
        (globalEnabled, typeEnabled, opType) => {
          configManager.reset();

          // Set global modalEnabled
          configManager.setGlobalConfig({
            modalEnabled: globalEnabled,
          });

          // Set operation type modalEnabled
          configManager.setOperationTypeConfig(opType, {
            modalEnabled: typeEnabled,
          });

          // Resolve with operation type - should get type override
          const resolved = configManager.resolveConfig({ operationType: opType });

          expect(resolved.modalEnabled).toBe(typeEnabled);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Unset override values should fall through to lower precedence levels.
   */
  it('should fall through to lower precedence for unset values', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 300 }),   // global inline
        fc.integer({ min: 500, max: 1000 }),  // global overlay
        fc.integer({ min: 200, max: 400 }),   // type inline (override)
        operationTypeArb,
        componentIdArb,
        (globalInline, globalOverlay, typeInline, opType, compId) => {
          configManager.reset();

          // Set global config with both values
          configManager.setGlobalConfig({
            inlineThreshold: globalInline,
            overlayThreshold: globalOverlay,
            modalThreshold: globalOverlay + 1500,
          });

          // Set operation type with only inline override
          configManager.setOperationTypeConfig(opType, {
            inlineThreshold: typeInline,
            // overlayThreshold not set - should fall through
          });

          // Set component with no threshold overrides
          configManager.setComponentConfig(compId, {
            // No threshold overrides - should fall through
          });

          // Resolve with both
          const resolved = configManager.resolveConfig({
            operationType: opType,
            componentId: compId,
          });

          // inlineThreshold should come from operation type
          expect(resolved.inlineThreshold).toBe(typeInline);
          // overlayThreshold should fall through to global
          expect(resolved.overlayThreshold).toBe(globalOverlay);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Global defaults should be used when no overrides are configured.
   */
  it('should use global defaults when no overrides exist', () => {
    fc.assert(
      fc.property(
        validThresholdsArb,
        operationTypeArb,
        componentIdArb,
        (thresholds, opType, compId) => {
          configManager.reset();

          // Set only global config
          configManager.setGlobalConfig(thresholds);

          // Resolve with operation type and component that have no overrides
          const resolved = configManager.resolveConfig({
            operationType: opType,
            componentId: compId,
          });

          // Should get global values
          expect(resolved.inlineThreshold).toBe(thresholds.inlineThreshold);
          expect(resolved.overlayThreshold).toBe(thresholds.overlayThreshold);
          expect(resolved.modalThreshold).toBe(thresholds.modalThreshold);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Default config entry should have all levels enabled.
   */
  it('should have all escalation levels enabled by default', () => {
    expect(DEFAULT_CONFIG_ENTRY.inlineEnabled).toBe(true);
    expect(DEFAULT_CONFIG_ENTRY.overlayEnabled).toBe(true);
    expect(DEFAULT_CONFIG_ENTRY.modalEnabled).toBe(true);
  });

  /**
   * Enabling/disabling specific levels should be configurable per layer.
   */
  it('should allow enabling/disabling escalation levels per layer', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.boolean(),
        fc.boolean(),
        operationTypeArb,
        componentIdArb,
        (globalInline, typeOverlay, componentModal, opType, compId) => {
          configManager.reset();

          // Set global with inline enabled/disabled
          configManager.setGlobalConfig({
            inlineEnabled: globalInline,
          });

          // Set operation type with overlay enabled/disabled
          configManager.setOperationTypeConfig(opType, {
            overlayEnabled: typeOverlay,
          });

          // Set component with modal enabled/disabled
          configManager.setComponentConfig(compId, {
            modalEnabled: componentModal,
          });

          // Resolve with both
          const resolved = configManager.resolveConfig({
            operationType: opType,
            componentId: compId,
          });

          // Each level should reflect its respective layer
          expect(resolved.inlineEnabled).toBe(globalInline);
          expect(resolved.overlayEnabled).toBe(typeOverlay);
          expect(resolved.modalEnabled).toBe(componentModal);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Export and import should preserve configuration.
   */
  it('should preserve configuration through export/import cycle', () => {
    fc.assert(
      fc.property(
        validThresholdsArb,
        operationTypeArb,
        componentIdArb,
        fc.integer({ min: 1000, max: 10000 }),
        (thresholds, opType, compId, timeout) => {
          configManager.reset();

          // Set up configuration
          configManager.setGlobalConfig(thresholds);
          configManager.setOperationTypeConfig(opType, { timeout });
          configManager.setComponentConfig(compId, { inlineEnabled: false });

          // Export
          const exported = configManager.exportConfig();

          // Create new manager and import
          const newManager = new EscalationConfigManager();
          newManager.importConfig(exported);

          // Verify global config
          const newGlobal = newManager.getGlobalConfig();
          expect(newGlobal.inlineThreshold).toBe(thresholds.inlineThreshold);
          expect(newGlobal.overlayThreshold).toBe(thresholds.overlayThreshold);
          expect(newGlobal.modalThreshold).toBe(thresholds.modalThreshold);

          // Verify operation type config
          const newTypeConfig = newManager.getOperationTypeConfig(opType);
          expect(newTypeConfig?.timeout).toBe(timeout);

          // Verify component config
          const newCompConfig = newManager.getComponentConfig(compId);
          expect(newCompConfig?.inlineEnabled).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
