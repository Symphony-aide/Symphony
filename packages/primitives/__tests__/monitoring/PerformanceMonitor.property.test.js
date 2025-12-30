/**
 * @fileoverview Property-based tests for PerformanceMonitor class
 *
 * These tests use fast-check to verify universal properties that should hold
 * across all valid inputs to the PerformanceMonitor class.
 *
 * **Feature: primitives-package, Property 20: Performance Metrics Calculation**
 *
 * For any component that renders one or more times, the PerformanceMonitor SHALL
 * correctly calculate and return the average, minimum, maximum render times and
 * total render count.
 *
 * **Validates: Requirements 13.1, 13.2**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  PerformanceMonitor,
  getDefaultMonitor,
  setDefaultMonitor,
  resetDefaultMonitor,
} from '../../src/monitoring/PerformanceMonitor.js';

// Arbitrary generators
const componentNameArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9-]*$/);
const durationArb = fc.float({ min: 0, max: 1000, noNaN: true });
const durationsArb = fc.array(durationArb, { minLength: 1, maxLength: 100 });

describe('Property 20: Performance Metrics Calculation', () => {
  let monitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
    resetDefaultMonitor();
  });

  /**
   * Test: Recording render times
   * **Validates: Requirements 13.1**
   */
  describe('recordRender()', () => {
    it('should record render times for any valid component name and duration', () => {
      fc.assert(
        fc.property(componentNameArb, durationArb, (name, duration) => {
          const mon = new PerformanceMonitor();
          mon.recordRender(name, duration);

          const metrics = mon.getMetrics(name);
          expect(metrics).not.toBeNull();
          expect(metrics.count).toBe(1);
          expect(metrics.total).toBeCloseTo(duration, 5);
        }),
        { numRuns: 100 }
      );
    });

    it('should accumulate multiple render times for the same component', () => {
      fc.assert(
        fc.property(componentNameArb, durationsArb, (name, durations) => {
          const mon = new PerformanceMonitor();

          for (const duration of durations) {
            mon.recordRender(name, duration);
          }

          const metrics = mon.getMetrics(name);
          expect(metrics).not.toBeNull();
          expect(metrics.count).toBe(durations.length);
        }),
        { numRuns: 100 }
      );
    });

    it('should track multiple components independently', () => {
      fc.assert(
        fc.property(
          fc.array(fc.tuple(componentNameArb, durationsArb), { minLength: 1, maxLength: 10 }),
          (componentData) => {
            const mon = new PerformanceMonitor();
            // Make names unique
            const uniqueData = componentData.map(([name, durations], i) => [
              `${name}_${i}`,
              durations,
            ]);

            for (const [name, durations] of uniqueData) {
              for (const duration of durations) {
                mon.recordRender(name, duration);
              }
            }

            for (const [name, durations] of uniqueData) {
              const metrics = mon.getMetrics(name);
              expect(metrics).not.toBeNull();
              expect(metrics.count).toBe(durations.length);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should throw error for invalid component name', () => {
      fc.assert(
        fc.property(durationArb, (duration) => {
          const mon = new PerformanceMonitor();

          expect(() => mon.recordRender('', duration)).toThrow();
          expect(() => mon.recordRender(null, duration)).toThrow();
          expect(() => mon.recordRender(undefined, duration)).toThrow();
        }),
        { numRuns: 10 }
      );
    });

    it('should throw error for invalid duration', () => {
      fc.assert(
        fc.property(componentNameArb, (name) => {
          const mon = new PerformanceMonitor();

          expect(() => mon.recordRender(name, -1)).toThrow();
          expect(() => mon.recordRender(name, NaN)).toThrow();
          expect(() => mon.recordRender(name, Infinity)).toThrow();
          expect(() => mon.recordRender(name, 'not a number')).toThrow();
        }),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Test: Metrics calculation correctness
   * **Validates: Requirements 13.2**
   */
  describe('getMetrics()', () => {
    it('should return null for non-existent component', () => {
      fc.assert(
        fc.property(componentNameArb, (name) => {
          const mon = new PerformanceMonitor();
          const metrics = mon.getMetrics(name);
          expect(metrics).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should correctly calculate average render time', () => {
      fc.assert(
        fc.property(componentNameArb, durationsArb, (name, durations) => {
          const mon = new PerformanceMonitor();

          for (const duration of durations) {
            mon.recordRender(name, duration);
          }

          const metrics = mon.getMetrics(name);
          const expectedAverage = durations.reduce((a, b) => a + b, 0) / durations.length;

          expect(metrics.average).toBeCloseTo(expectedAverage, 5);
        }),
        { numRuns: 100 }
      );
    });

    it('should correctly calculate minimum render time', () => {
      fc.assert(
        fc.property(componentNameArb, durationsArb, (name, durations) => {
          const mon = new PerformanceMonitor();

          for (const duration of durations) {
            mon.recordRender(name, duration);
          }

          const metrics = mon.getMetrics(name);
          const expectedMin = Math.min(...durations);

          expect(metrics.min).toBeCloseTo(expectedMin, 5);
        }),
        { numRuns: 100 }
      );
    });

    it('should correctly calculate maximum render time', () => {
      fc.assert(
        fc.property(componentNameArb, durationsArb, (name, durations) => {
          const mon = new PerformanceMonitor();

          for (const duration of durations) {
            mon.recordRender(name, duration);
          }

          const metrics = mon.getMetrics(name);
          const expectedMax = Math.max(...durations);

          expect(metrics.max).toBeCloseTo(expectedMax, 5);
        }),
        { numRuns: 100 }
      );
    });

    it('should correctly calculate total render count', () => {
      fc.assert(
        fc.property(componentNameArb, durationsArb, (name, durations) => {
          const mon = new PerformanceMonitor();

          for (const duration of durations) {
            mon.recordRender(name, duration);
          }

          const metrics = mon.getMetrics(name);
          expect(metrics.count).toBe(durations.length);
        }),
        { numRuns: 100 }
      );
    });

    it('should correctly calculate total render time', () => {
      fc.assert(
        fc.property(componentNameArb, durationsArb, (name, durations) => {
          const mon = new PerformanceMonitor();

          for (const duration of durations) {
            mon.recordRender(name, duration);
          }

          const metrics = mon.getMetrics(name);
          const expectedTotal = durations.reduce((a, b) => a + b, 0);

          expect(metrics.total).toBeCloseTo(expectedTotal, 5);
        }),
        { numRuns: 100 }
      );
    });

    it('should return consistent metrics for single render', () => {
      fc.assert(
        fc.property(componentNameArb, durationArb, (name, duration) => {
          const mon = new PerformanceMonitor();
          mon.recordRender(name, duration);

          const metrics = mon.getMetrics(name);

          // For a single render, average = min = max = total = duration
          expect(metrics.average).toBeCloseTo(duration, 5);
          expect(metrics.min).toBeCloseTo(duration, 5);
          expect(metrics.max).toBeCloseTo(duration, 5);
          expect(metrics.total).toBeCloseTo(duration, 5);
          expect(metrics.count).toBe(1);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Test: getAllMetrics returns metrics for all tracked components
   */
  describe('getAllMetrics()', () => {
    it('should return empty map when no components tracked', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const mon = new PerformanceMonitor();
          const allMetrics = mon.getAllMetrics();
          expect(allMetrics.size).toBe(0);
        }),
        { numRuns: 10 }
      );
    });

    it('should return metrics for all tracked components', () => {
      fc.assert(
        fc.property(
          fc.array(fc.tuple(componentNameArb, durationsArb), { minLength: 1, maxLength: 10 }),
          (componentData) => {
            const mon = new PerformanceMonitor();
            // Make names unique
            const uniqueData = componentData.map(([name, durations], i) => [
              `${name}_${i}`,
              durations,
            ]);

            for (const [name, durations] of uniqueData) {
              for (const duration of durations) {
                mon.recordRender(name, duration);
              }
            }

            const allMetrics = mon.getAllMetrics();
            expect(allMetrics.size).toBe(uniqueData.length);

            for (const [name] of uniqueData) {
              expect(allMetrics.has(name)).toBe(true);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Test: Slow render warnings
   * **Validates: Requirements 13.3**
   */
  describe('Slow render warnings', () => {
    it('should trigger warning callback for renders exceeding warning threshold', () => {
      fc.assert(
        fc.property(
          componentNameArb,
          fc.float({ min: 17, max: 49, noNaN: true }),
          (name, duration) => {
            const mon = new PerformanceMonitor();
            const alerts = [];

            mon.onBudgetExceeded((alert) => {
              alerts.push(alert);
            });

            mon.recordRender(name, duration);

            expect(alerts.length).toBe(1);
            expect(alerts[0].componentName).toBe(name);
            expect(alerts[0].level).toBe('warning');
            expect(alerts[0].duration).toBeCloseTo(duration, 5);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should trigger error callback for renders exceeding error threshold', () => {
      fc.assert(
        fc.property(
          componentNameArb,
          fc.float({ min: 51, max: 1000, noNaN: true }),
          (name, duration) => {
            const mon = new PerformanceMonitor();
            const alerts = [];

            mon.onBudgetExceeded((alert) => {
              alerts.push(alert);
            });

            mon.recordRender(name, duration);

            expect(alerts.length).toBe(1);
            expect(alerts[0].componentName).toBe(name);
            expect(alerts[0].level).toBe('error');
            expect(alerts[0].duration).toBeCloseTo(duration, 5);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not trigger callback for renders within budget', () => {
      fc.assert(
        fc.property(
          componentNameArb,
          fc.float({ min: 0, max: 15, noNaN: true }),
          (name, duration) => {
            const mon = new PerformanceMonitor();
            const alerts = [];

            mon.onBudgetExceeded((alert) => {
              alerts.push(alert);
            });

            mon.recordRender(name, duration);

            expect(alerts.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Test: Performance budgets
   * **Validates: Requirements 13.4**
   */
  describe('Performance budgets', () => {
    it('should use component-specific budget when set', () => {
      fc.assert(
        fc.property(
          componentNameArb,
          fc.float({ min: 1, max: 100, noNaN: true }),
          fc.float({ min: 101, max: 200, noNaN: true }),
          (name, warningThreshold, errorThreshold) => {
            const mon = new PerformanceMonitor();
            mon.setBudget(name, { warning: warningThreshold, error: errorThreshold });

            const budget = mon.getBudget(name);
            expect(budget.warning).toBe(warningThreshold);
            expect(budget.error).toBe(errorThreshold);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use default budget when no component-specific budget set', () => {
      fc.assert(
        fc.property(componentNameArb, (name) => {
          const mon = new PerformanceMonitor();

          const budget = mon.getBudget(name);
          expect(budget.warning).toBe(16);
          expect(budget.error).toBe(50);
        }),
        { numRuns: 100 }
      );
    });

    it('should respect custom default budget', () => {
      fc.assert(
        fc.property(
          componentNameArb,
          fc.float({ min: 1, max: 100, noNaN: true }),
          fc.float({ min: 101, max: 200, noNaN: true }),
          (name, warningThreshold, errorThreshold) => {
            const mon = new PerformanceMonitor({
              defaultBudget: { warning: warningThreshold, error: errorThreshold },
            });

            const budget = mon.getBudget(name);
            expect(budget.warning).toBe(warningThreshold);
            expect(budget.error).toBe(errorThreshold);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should trigger alerts based on component-specific budget', () => {
      fc.assert(
        fc.property(
          componentNameArb,
          fc.float({ min: 5, max: 10, noNaN: true }),
          (name, threshold) => {
            const mon = new PerformanceMonitor();
            mon.setBudget(name, { warning: threshold, error: threshold * 2 });

            const alerts = [];
            mon.onBudgetExceeded((alert) => {
              alerts.push(alert);
            });

            // Record a render that exceeds the custom warning threshold
            mon.recordRender(name, threshold + 1);

            expect(alerts.length).toBe(1);
            expect(alerts[0].level).toBe('warning');
            expect(alerts[0].threshold).toBe(threshold);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Test: Clearing metrics
   */
  describe('clearMetrics()', () => {
    it('should clear metrics for a specific component', () => {
      fc.assert(
        fc.property(componentNameArb, durationsArb, (name, durations) => {
          const mon = new PerformanceMonitor();

          for (const duration of durations) {
            mon.recordRender(name, duration);
          }

          expect(mon.getMetrics(name)).not.toBeNull();

          mon.clearMetrics(name);

          expect(mon.getMetrics(name)).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should not affect other components when clearing one', () => {
      fc.assert(
        fc.property(
          componentNameArb,
          componentNameArb,
          durationsArb,
          durationsArb,
          (name1, name2, durations1, durations2) => {
            // Ensure names are different
            const uniqueName1 = `${name1}_1`;
            const uniqueName2 = `${name2}_2`;

            const mon = new PerformanceMonitor();

            for (const duration of durations1) {
              mon.recordRender(uniqueName1, duration);
            }
            for (const duration of durations2) {
              mon.recordRender(uniqueName2, duration);
            }

            mon.clearMetrics(uniqueName1);

            expect(mon.getMetrics(uniqueName1)).toBeNull();
            expect(mon.getMetrics(uniqueName2)).not.toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Test: Enable/disable monitoring
   */
  describe('setEnabled()', () => {
    it('should not record renders when disabled', () => {
      fc.assert(
        fc.property(componentNameArb, durationsArb, (name, durations) => {
          const mon = new PerformanceMonitor();
          mon.setEnabled(false);

          for (const duration of durations) {
            mon.recordRender(name, duration);
          }

          expect(mon.getMetrics(name)).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should resume recording when re-enabled', () => {
      fc.assert(
        fc.property(componentNameArb, durationsArb, (name, durations) => {
          const mon = new PerformanceMonitor();
          mon.setEnabled(false);
          mon.recordRender(name, 10);
          mon.setEnabled(true);

          for (const duration of durations) {
            mon.recordRender(name, duration);
          }

          const metrics = mon.getMetrics(name);
          expect(metrics).not.toBeNull();
          expect(metrics.count).toBe(durations.length);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Test: Singleton pattern
   */
  describe('Singleton pattern', () => {
    it('should return same instance from getDefaultMonitor', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          resetDefaultMonitor();
          const mon1 = getDefaultMonitor();
          const mon2 = getDefaultMonitor();
          expect(mon1).toBe(mon2);
        }),
        { numRuns: 10 }
      );
    });

    it('should allow setting custom default monitor', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          resetDefaultMonitor();
          const customMonitor = new PerformanceMonitor();
          setDefaultMonitor(customMonitor);
          expect(getDefaultMonitor()).toBe(customMonitor);
        }),
        { numRuns: 10 }
      );
    });

    it('should throw error when setting invalid default monitor', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          expect(() => setDefaultMonitor({})).toThrow();
          expect(() => setDefaultMonitor(null)).toThrow();
          expect(() => setDefaultMonitor('not a monitor')).toThrow();
        }),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Test: Timer helper
   */
  describe('createTimer()', () => {
    it('should create a timer that records render time', () => {
      fc.assert(
        fc.property(componentNameArb, (name) => {
          const mon = new PerformanceMonitor();
          const timer = mon.createTimer(name);

          timer.start();
          // Simulate some work
          let sum = 0;
          for (let i = 0; i < 1000; i++) {
            sum += i;
          }
          const duration = timer.end();

          const metrics = mon.getMetrics(name);
          expect(metrics).not.toBeNull();
          expect(metrics.count).toBe(1);
          expect(duration).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Test: measure() helper
   */
  describe('measure()', () => {
    it('should measure and record function execution time', () => {
      fc.assert(
        fc.property(componentNameArb, fc.integer({ min: 1, max: 100 }), (name, value) => {
          const mon = new PerformanceMonitor();

          const result = mon.measure(name, () => {
            return value * 2;
          });

          expect(result).toBe(value * 2);

          const metrics = mon.getMetrics(name);
          expect(metrics).not.toBeNull();
          expect(metrics.count).toBe(1);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Test: measureAsync() helper
   */
  describe('measureAsync()', () => {
    it('should measure and record async function execution time', async () => {
      await fc.assert(
        fc.asyncProperty(componentNameArb, fc.integer({ min: 1, max: 100 }), async (name, value) => {
          const mon = new PerformanceMonitor();

          const result = await mon.measureAsync(name, async () => {
            return value * 2;
          });

          expect(result).toBe(value * 2);

          const metrics = mon.getMetrics(name);
          expect(metrics).not.toBeNull();
          expect(metrics.count).toBe(1);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Test: Alert callback management
   */
  describe('onBudgetExceeded()', () => {
    it('should support multiple alert callbacks', () => {
      fc.assert(
        fc.property(
          componentNameArb,
          fc.float({ min: 51, max: 100, noNaN: true }),
          (name, duration) => {
            const mon = new PerformanceMonitor();
            const alerts1 = [];
            const alerts2 = [];

            mon.onBudgetExceeded((alert) => alerts1.push(alert));
            mon.onBudgetExceeded((alert) => alerts2.push(alert));

            mon.recordRender(name, duration);

            expect(alerts1.length).toBe(1);
            expect(alerts2.length).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return unsubscribe function', () => {
      fc.assert(
        fc.property(
          componentNameArb,
          fc.float({ min: 51, max: 100, noNaN: true }),
          (name, duration) => {
            const mon = new PerformanceMonitor();
            const alerts = [];

            const unsubscribe = mon.onBudgetExceeded((alert) => alerts.push(alert));

            mon.recordRender(name, duration);
            expect(alerts.length).toBe(1);

            unsubscribe();

            mon.recordRender(name, duration);
            expect(alerts.length).toBe(1); // Should not increase
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Test: Custom logger
   */
  describe('setLogger()', () => {
    it('should use custom logger for warnings', () => {
      fc.assert(
        fc.property(
          componentNameArb,
          fc.float({ min: 51, max: 100, noNaN: true }),
          (name, duration) => {
            const mon = new PerformanceMonitor();
            const logs = [];

            mon.setLogger((message, data) => {
              logs.push({ message, data });
            });

            mon.recordRender(name, duration);

            expect(logs.length).toBe(1);
            expect(logs[0].message).toContain('Slow render');
            expect(logs[0].data.componentName).toBe(name);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
