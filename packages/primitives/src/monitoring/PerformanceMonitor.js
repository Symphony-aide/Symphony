/**
 * @fileoverview Performance monitoring for the primitives system
 *
 * Provides performance tracking, metrics calculation, and alerting
 * for component render times in the Symphony IDE.
 *
 * @module @symphony/primitives/monitoring
 */

/**
 * @typedef {Object} PerformanceMetrics
 * @property {number} average - Average render time in milliseconds
 * @property {number} min - Minimum render time in milliseconds
 * @property {number} max - Maximum render time in milliseconds
 * @property {number} count - Total number of renders recorded
 * @property {number} total - Total render time in milliseconds
 */

/**
 * @typedef {Object} PerformanceBudget
 * @property {number} [warning] - Warning threshold in milliseconds (default: 16ms)
 * @property {number} [error] - Error threshold in milliseconds (default: 50ms)
 */

/**
 * @typedef {Object} BudgetAlert
 * @property {string} componentName - Name of the component that exceeded budget
 * @property {number} duration - Actual render duration in milliseconds
 * @property {number} threshold - The threshold that was exceeded
 * @property {'warning' | 'error'} level - Alert severity level
 * @property {number} timestamp - When the alert was triggered
 */

/**
 * @callback AlertCallback
 * @param {BudgetAlert} alert - The budget alert details
 * @returns {void}
 */

/**
 * @callback LogCallback
 * @param {string} message - The log message
 * @param {Object} [data] - Additional data to log
 * @returns {void}
 */

// Default thresholds
const DEFAULT_WARNING_THRESHOLD = 16; // 16ms = 60fps frame budget
const DEFAULT_ERROR_THRESHOLD = 50;

/**
 * Performance monitor for tracking component render times
 *
 * Records render times per component, calculates metrics (average, min, max, count),
 * logs warnings for slow renders, and supports performance budget alerts.
 *
 * @example
 * ```javascript
 * const monitor = new PerformanceMonitor();
 *
 * // Record render times
 * monitor.recordRender('Button', 5.2);
 * monitor.recordRender('Button', 3.8);
 * monitor.recordRender('CodeEditor', 25.5);
 *
 * // Get metrics
 * const buttonMetrics = monitor.getMetrics('Button');
 * // { average: 4.5, min: 3.8, max: 5.2, count: 2, total: 9 }
 *
 * // Set up budget alerts
 * monitor.setBudget('CodeEditor', { warning: 16, error: 50 });
 * monitor.onBudgetExceeded((alert) => {
 *   console.warn(`${alert.componentName} exceeded ${alert.level} threshold`);
 * });
 * ```
 */
export class PerformanceMonitor {
  /** @type {Map<string, number[]>} */
  #renderTimes;

  /** @type {Map<string, PerformanceBudget>} */
  #budgets;

  /** @type {Set<AlertCallback>} */
  #alertCallbacks;

  /** @type {LogCallback | null} */
  #logCallback;

  /** @type {PerformanceBudget} */
  #defaultBudget;

  /** @type {boolean} */
  #enabled;

  /**
   * Creates a new PerformanceMonitor instance
   *
   * @param {Object} [options] - Configuration options
   * @param {PerformanceBudget} [options.defaultBudget] - Default budget for all components
   * @param {LogCallback} [options.logger] - Custom logging function
   * @param {boolean} [options.enabled=true] - Whether monitoring is enabled
   */
  constructor(options = {}) {
    this.#renderTimes = new Map();
    this.#budgets = new Map();
    this.#alertCallbacks = new Set();
    this.#logCallback = options.logger || null;
    this.#enabled = options.enabled !== false;
    this.#defaultBudget = {
      warning: options.defaultBudget?.warning ?? DEFAULT_WARNING_THRESHOLD,
      error: options.defaultBudget?.error ?? DEFAULT_ERROR_THRESHOLD,
    };
  }

  /**
   * Records a render time for a component
   *
   * @param {string} componentName - Name of the component
   * @param {number} duration - Render duration in milliseconds
   * @throws {Error} If componentName is not a non-empty string
   * @throws {Error} If duration is not a non-negative number
   */
  recordRender(componentName, duration) {
    if (!componentName || typeof componentName !== 'string') {
      throw new Error('componentName must be a non-empty string');
    }
    if (typeof duration !== 'number' || duration < 0 || !Number.isFinite(duration)) {
      throw new Error('duration must be a non-negative finite number');
    }

    if (!this.#enabled) {
      return;
    }

    // Store the render time
    if (!this.#renderTimes.has(componentName)) {
      this.#renderTimes.set(componentName, []);
    }
    const times = this.#renderTimes.get(componentName);
    if (times) {
      times.push(duration);
    }

    // Check for slow renders and log warnings
    const budget = this.#getBudgetForComponent(componentName);
    const errorThreshold = budget.error ?? DEFAULT_ERROR_THRESHOLD;
    const warningThreshold = budget.warning ?? DEFAULT_WARNING_THRESHOLD;

    if (duration > errorThreshold) {
      this.#logWarning(
        `Slow render: ${componentName} took ${duration.toFixed(2)}ms (exceeds error threshold of ${errorThreshold}ms)`,
        { componentName, duration, threshold: errorThreshold, level: 'error' }
      );
      this.#triggerAlert(componentName, duration, errorThreshold, 'error');
    } else if (duration > warningThreshold) {
      this.#logWarning(
        `Slow render: ${componentName} took ${duration.toFixed(2)}ms (exceeds warning threshold of ${warningThreshold}ms)`,
        { componentName, duration, threshold: warningThreshold, level: 'warning' }
      );
      this.#triggerAlert(componentName, duration, warningThreshold, 'warning');
    }
  }

  /**
   * Gets performance metrics for a component
   *
   * @param {string} componentName - Name of the component
   * @returns {PerformanceMetrics | null} Metrics object or null if no data
   */
  getMetrics(componentName) {
    if (!componentName || typeof componentName !== 'string') {
      return null;
    }

    const times = this.#renderTimes.get(componentName);
    if (!times || times.length === 0) {
      return null;
    }

    const total = times.reduce((sum, t) => sum + t, 0);
    const count = times.length;
    const average = total / count;
    const min = Math.min(...times);
    const max = Math.max(...times);

    return {
      average,
      min,
      max,
      count,
      total,
    };
  }

  /**
   * Gets metrics for all tracked components
   *
   * @returns {Map<string, PerformanceMetrics>} Map of component names to metrics
   */
  getAllMetrics() {
    const allMetrics = new Map();

    for (const componentName of this.#renderTimes.keys()) {
      const metrics = this.getMetrics(componentName);
      if (metrics) {
        allMetrics.set(componentName, metrics);
      }
    }

    return allMetrics;
  }

  /**
   * Gets list of all tracked component names
   *
   * @returns {string[]} Array of component names
   */
  getTrackedComponents() {
    return Array.from(this.#renderTimes.keys());
  }

  /**
   * Sets a performance budget for a specific component
   *
   * @param {string} componentName - Name of the component
   * @param {PerformanceBudget} budget - Budget thresholds
   * @throws {Error} If componentName is not a non-empty string
   */
  setBudget(componentName, budget) {
    if (!componentName || typeof componentName !== 'string') {
      throw new Error('componentName must be a non-empty string');
    }

    this.#budgets.set(componentName, {
      warning: budget.warning ?? this.#defaultBudget.warning,
      error: budget.error ?? this.#defaultBudget.error,
    });
  }

  /**
   * Gets the budget for a component
   *
   * @param {string} componentName - Name of the component
   * @returns {PerformanceBudget} The budget (component-specific or default)
   */
  getBudget(componentName) {
    return this.#getBudgetForComponent(componentName);
  }

  /**
   * Removes the budget for a specific component (falls back to default)
   *
   * @param {string} componentName - Name of the component
   * @returns {boolean} True if a budget was removed
   */
  removeBudget(componentName) {
    return this.#budgets.delete(componentName);
  }

  /**
   * Sets the default budget for all components without specific budgets
   *
   * @param {PerformanceBudget} budget - Default budget thresholds
   */
  setDefaultBudget(budget) {
    this.#defaultBudget = {
      warning: budget.warning ?? DEFAULT_WARNING_THRESHOLD,
      error: budget.error ?? DEFAULT_ERROR_THRESHOLD,
    };
  }

  /**
   * Registers a callback for budget exceeded alerts
   *
   * @param {AlertCallback} callback - Function to call when budget is exceeded
   * @returns {function(): void} Unsubscribe function
   */
  onBudgetExceeded(callback) {
    if (typeof callback !== 'function') {
      throw new Error('callback must be a function');
    }

    this.#alertCallbacks.add(callback);

    return () => {
      this.#alertCallbacks.delete(callback);
    };
  }

  /**
   * Sets a custom logger for warnings
   *
   * @param {LogCallback} logger - Custom logging function
   */
  setLogger(logger) {
    if (logger !== null && typeof logger !== 'function') {
      throw new Error('logger must be a function or null');
    }
    this.#logCallback = logger;
  }

  /**
   * Clears all recorded metrics for a component
   *
   * @param {string} componentName - Name of the component
   * @returns {boolean} True if metrics were cleared
   */
  clearMetrics(componentName) {
    return this.#renderTimes.delete(componentName);
  }

  /**
   * Clears all recorded metrics
   */
  clearAllMetrics() {
    this.#renderTimes.clear();
  }

  /**
   * Enables or disables monitoring
   *
   * @param {boolean} enabled - Whether monitoring should be enabled
   */
  setEnabled(enabled) {
    this.#enabled = Boolean(enabled);
  }

  /**
   * Checks if monitoring is enabled
   *
   * @returns {boolean} True if monitoring is enabled
   */
  isEnabled() {
    return this.#enabled;
  }

  /**
   * Creates a timing helper for measuring render duration
   *
   * @param {string} componentName - Name of the component
   * @returns {{ start: function(): void, end: function(): number }} Timing helper
   */
  createTimer(componentName) {
    let startTime = 0;

    return {
      start: () => {
        startTime = performance.now();
      },
      end: () => {
        const duration = performance.now() - startTime;
        this.recordRender(componentName, duration);
        return duration;
      },
    };
  }

  /**
   * Wraps a function to automatically measure its execution time
   *
   * @template T
   * @param {string} componentName - Name of the component
   * @param {function(): T} fn - Function to wrap
   * @returns {T} Result of the function
   */
  measure(componentName, fn) {
    const start = performance.now();
    try {
      return fn();
    } finally {
      const duration = performance.now() - start;
      this.recordRender(componentName, duration);
    }
  }

  /**
   * Wraps an async function to automatically measure its execution time
   *
   * @template T
   * @param {string} componentName - Name of the component
   * @param {function(): Promise<T>} fn - Async function to wrap
   * @returns {Promise<T>} Result of the function
   */
  async measureAsync(componentName, fn) {
    const start = performance.now();
    try {
      return await fn();
    } finally {
      const duration = performance.now() - start;
      this.recordRender(componentName, duration);
    }
  }

  /**
   * Gets the budget for a component (component-specific or default)
   *
   * @private
   * @param {string} componentName - Name of the component
   * @returns {PerformanceBudget} The applicable budget
   */
  #getBudgetForComponent(componentName) {
    return this.#budgets.get(componentName) || this.#defaultBudget;
  }

  /**
   * Logs a warning message
   *
   * @private
   * @param {string} message - Warning message
   * @param {Object} [data] - Additional data
   */
  #logWarning(message, data) {
    if (this.#logCallback) {
      this.#logCallback(message, data);
    } else {
      console.warn(`[PerformanceMonitor] ${message}`, data);
    }
  }

  /**
   * Triggers budget exceeded alerts
   *
   * @private
   * @param {string} componentName - Name of the component
   * @param {number} duration - Actual duration
   * @param {number} threshold - Exceeded threshold
   * @param {'warning' | 'error'} level - Alert level
   */
  #triggerAlert(componentName, duration, threshold, level) {
    /** @type {BudgetAlert} */
    const alert = {
      componentName,
      duration,
      threshold,
      level,
      timestamp: Date.now(),
    };

    for (const callback of this.#alertCallbacks) {
      try {
        callback(alert);
      } catch (error) {
        console.error('[PerformanceMonitor] Alert callback error:', error);
      }
    }
  }
}

// Singleton instance for global use
/** @type {PerformanceMonitor | null} */
let defaultMonitor = null;

/**
 * Gets the default PerformanceMonitor instance
 *
 * @returns {PerformanceMonitor} The default monitor instance
 */
export function getDefaultMonitor() {
  if (!defaultMonitor) {
    defaultMonitor = new PerformanceMonitor();
  }
  return defaultMonitor;
}

/**
 * Sets the default PerformanceMonitor instance
 *
 * @param {PerformanceMonitor} monitor - The monitor to use as default
 */
export function setDefaultMonitor(monitor) {
  if (!(monitor instanceof PerformanceMonitor)) {
    throw new Error('monitor must be an instance of PerformanceMonitor');
  }
  defaultMonitor = monitor;
}

/**
 * Resets the default PerformanceMonitor instance
 */
export function resetDefaultMonitor() {
  defaultMonitor = null;
}
