/**
 * EscalationConfigManager - Configuration system for Progressive Feedback
 *
 * Provides a hierarchical configuration system with:
 * - Global defaults
 * - Per-operation-type overrides
 * - Per-component overrides
 *
 * Configuration precedence (highest to lowest):
 * 1. Per-component overrides
 * 2. Per-operation-type overrides
 * 3. Global defaults
 *
 * @module feedback/EscalationConfigManager
 */

import type { EscalationConfig } from './types';
import { DEFAULT_ESCALATION_CONFIG } from './types';
import { validateEscalationConfig } from './utils';

/**
 * Operation types that can have custom escalation configurations.
 *
 * Common operation types in an IDE context:
 * - 'file-operation': File read/write operations
 * - 'network': Network requests (API calls, downloads)
 * - 'search': Search and indexing operations
 * - 'build': Build and compilation tasks
 * - 'git': Version control operations
 * - 'ai': AI/ML model operations
 */
export type OperationType = string;

/**
 * Component identifiers that can have custom escalation configurations.
 *
 * Examples: 'file-explorer', 'code-editor', 'terminal', 'search-panel'
 */
export type ComponentId = string;

/**
 * Configuration entry with optional enabled flags for specific levels.
 */
export interface EscalationConfigEntry extends EscalationConfig {
  /** Whether inline escalation is enabled (default: true) */
  inlineEnabled?: boolean;
  /** Whether overlay escalation is enabled (default: true) */
  overlayEnabled?: boolean;
  /** Whether modal escalation is enabled (default: true) */
  modalEnabled?: boolean;
}

/**
 * Full configuration with all override layers.
 */
export interface FullEscalationConfig {
  /** Global default configuration */
  global: EscalationConfigEntry;
  /** Per-operation-type overrides */
  operationTypes: Map<OperationType, Partial<EscalationConfigEntry>>;
  /** Per-component overrides */
  components: Map<ComponentId, Partial<EscalationConfigEntry>>;
}

/**
 * Options for resolving configuration.
 */
export interface ResolveConfigOptions {
  /** Operation type for type-specific overrides */
  operationType?: OperationType;
  /** Component ID for component-specific overrides */
  componentId?: ComponentId;
}

/**
 * Default configuration entry with all levels enabled.
 */
export const DEFAULT_CONFIG_ENTRY: EscalationConfigEntry = {
  ...DEFAULT_ESCALATION_CONFIG,
  inlineEnabled: true,
  overlayEnabled: true,
  modalEnabled: true,
};

/**
 * EscalationConfigManager class for managing hierarchical configuration.
 *
 * Provides a centralized configuration system with support for:
 * - Global defaults that apply to all operations
 * - Per-operation-type overrides for different kinds of operations
 * - Per-component overrides for specific UI components
 *
 * @example
 * ```ts
 * const configManager = new EscalationConfigManager();
 *
 * // Set global defaults
 * configManager.setGlobalConfig({ inlineThreshold: 300 });
 *
 * // Set operation-type specific config
 * configManager.setOperationTypeConfig('network', {
 *   inlineThreshold: 100,
 *   modalThreshold: 5000,
 * });
 *
 * // Set component-specific config
 * configManager.setComponentConfig('file-explorer', {
 *   overlayThreshold: 1000,
 * });
 *
 * // Resolve final config with precedence
 * const config = configManager.resolveConfig({
 *   operationType: 'network',
 *   componentId: 'file-explorer',
 * });
 * ```
 */
export class EscalationConfigManager {
  private _config: FullEscalationConfig;

  constructor() {
    this._config = {
      global: { ...DEFAULT_CONFIG_ENTRY },
      operationTypes: new Map(),
      components: new Map(),
    };
  }

  /**
   * Get the current global configuration.
   *
   * @returns The global escalation configuration
   */
  getGlobalConfig(): EscalationConfigEntry {
    return { ...this._config.global };
  }

  /**
   * Set global configuration values.
   *
   * @param config - Partial configuration to merge with global defaults
   * @throws Error if resulting configuration is invalid
   */
  setGlobalConfig(config: Partial<EscalationConfigEntry>): void {
    const merged = this._mergeConfig(this._config.global, config);
    if (!validateEscalationConfig(merged)) {
      throw new Error(
        'Invalid escalation config: thresholds must be in order (inline < overlay < modal)'
      );
    }
    this._config.global = merged;
  }

  /**
   * Get configuration for a specific operation type.
   *
   * @param operationType - The operation type
   * @returns The operation type configuration or undefined
   */
  getOperationTypeConfig(
    operationType: OperationType
  ): Partial<EscalationConfigEntry> | undefined {
    return this._config.operationTypes.get(operationType);
  }

  /**
   * Set configuration for a specific operation type.
   *
   * @param operationType - The operation type
   * @param config - Partial configuration for this operation type
   */
  setOperationTypeConfig(
    operationType: OperationType,
    config: Partial<EscalationConfigEntry>
  ): void {
    this._config.operationTypes.set(operationType, config);
  }

  /**
   * Remove configuration for a specific operation type.
   *
   * @param operationType - The operation type to remove
   * @returns True if the configuration was removed
   */
  removeOperationTypeConfig(operationType: OperationType): boolean {
    return this._config.operationTypes.delete(operationType);
  }

  /**
   * Get all configured operation types.
   *
   * @returns Array of operation type names
   */
  getConfiguredOperationTypes(): OperationType[] {
    return Array.from(this._config.operationTypes.keys());
  }

  /**
   * Get configuration for a specific component.
   *
   * @param componentId - The component identifier
   * @returns The component configuration or undefined
   */
  getComponentConfig(
    componentId: ComponentId
  ): Partial<EscalationConfigEntry> | undefined {
    return this._config.components.get(componentId);
  }

  /**
   * Set configuration for a specific component.
   *
   * @param componentId - The component identifier
   * @param config - Partial configuration for this component
   */
  setComponentConfig(
    componentId: ComponentId,
    config: Partial<EscalationConfigEntry>
  ): void {
    this._config.components.set(componentId, config);
  }

  /**
   * Remove configuration for a specific component.
   *
   * @param componentId - The component to remove
   * @returns True if the configuration was removed
   */
  removeComponentConfig(componentId: ComponentId): boolean {
    return this._config.components.delete(componentId);
  }

  /**
   * Get all configured components.
   *
   * @returns Array of component identifiers
   */
  getConfiguredComponents(): ComponentId[] {
    return Array.from(this._config.components.keys());
  }

  /**
   * Resolve the final configuration with precedence rules.
   *
   * Precedence (highest to lowest):
   * 1. Per-component overrides
   * 2. Per-operation-type overrides
   * 3. Global defaults
   *
   * @param options - Options specifying operation type and/or component
   * @returns The resolved escalation configuration
   */
  resolveConfig(options: ResolveConfigOptions = {}): EscalationConfigEntry {
    // Start with global config
    let resolved: EscalationConfigEntry = { ...this._config.global };

    // Apply operation type overrides (lower precedence)
    if (options.operationType) {
      const typeConfig = this._config.operationTypes.get(options.operationType);
      if (typeConfig) {
        resolved = this._mergeConfig(resolved, typeConfig);
      }
    }

    // Apply component overrides (highest precedence)
    if (options.componentId) {
      const componentConfig = this._config.components.get(options.componentId);
      if (componentConfig) {
        resolved = this._mergeConfig(resolved, componentConfig);
      }
    }

    return resolved;
  }

  /**
   * Reset all configuration to defaults.
   */
  reset(): void {
    this._config = {
      global: { ...DEFAULT_CONFIG_ENTRY },
      operationTypes: new Map(),
      components: new Map(),
    };
  }

  /**
   * Export the full configuration for serialization.
   *
   * @returns Serializable configuration object
   */
  exportConfig(): {
    global: EscalationConfigEntry;
    operationTypes: Record<string, Partial<EscalationConfigEntry>>;
    components: Record<string, Partial<EscalationConfigEntry>>;
  } {
    const operationTypes: Record<string, Partial<EscalationConfigEntry>> = {};
    this._config.operationTypes.forEach((value, key) => {
      operationTypes[key] = value;
    });

    const components: Record<string, Partial<EscalationConfigEntry>> = {};
    this._config.components.forEach((value, key) => {
      components[key] = value;
    });

    return {
      global: { ...this._config.global },
      operationTypes,
      components,
    };
  }

  /**
   * Import configuration from a serialized object.
   *
   * @param config - Configuration object to import
   */
  importConfig(config: {
    global?: Partial<EscalationConfigEntry>;
    operationTypes?: Record<string, Partial<EscalationConfigEntry>>;
    components?: Record<string, Partial<EscalationConfigEntry>>;
  }): void {
    if (config.global) {
      this.setGlobalConfig(config.global);
    }

    if (config.operationTypes) {
      const typeKeys = Object.keys(config.operationTypes);
      for (const type of typeKeys) {
        this.setOperationTypeConfig(type, config.operationTypes[type]);
      }
    }

    if (config.components) {
      const componentKeys = Object.keys(config.components);
      for (const id of componentKeys) {
        this.setComponentConfig(id, config.components[id]);
      }
    }
  }

  /**
   * Merge two configurations, with partial overriding base.
   */
  private _mergeConfig(
    base: EscalationConfigEntry,
    partial: Partial<EscalationConfigEntry>
  ): EscalationConfigEntry {
    return {
      inlineThreshold: partial.inlineThreshold ?? base.inlineThreshold,
      overlayThreshold: partial.overlayThreshold ?? base.overlayThreshold,
      modalThreshold: partial.modalThreshold ?? base.modalThreshold,
      timeout: partial.timeout ?? base.timeout,
      inlineEnabled: partial.inlineEnabled ?? base.inlineEnabled,
      overlayEnabled: partial.overlayEnabled ?? base.overlayEnabled,
      modalEnabled: partial.modalEnabled ?? base.modalEnabled,
    };
  }
}

/**
 * Singleton instance of EscalationConfigManager.
 *
 * Use this for application-wide configuration management.
 */
let _defaultConfigManager: EscalationConfigManager | null = null;

/**
 * Get the default EscalationConfigManager instance.
 *
 * @returns The singleton EscalationConfigManager instance
 */
export function getEscalationConfigManager(): EscalationConfigManager {
  if (!_defaultConfigManager) {
    _defaultConfigManager = new EscalationConfigManager();
  }
  return _defaultConfigManager;
}

/**
 * Reset the default EscalationConfigManager instance.
 *
 * Useful for testing.
 */
export function resetEscalationConfigManager(): void {
  _defaultConfigManager = null;
}
