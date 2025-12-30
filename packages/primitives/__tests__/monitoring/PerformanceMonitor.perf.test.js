/**
 * @fileoverview Performance tests for PerformanceMonitor warning and alert triggers
 *
 * Tests that the PerformanceMonitor correctly triggers warnings and alerts
 * when render times exceed defined thresholds.
 *
 * @see Requirements 3.5, 3.6
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  PerformanceMonitor,
  resetDefaultMonitor,
} from '../../src/monitoring/PerformanceMonitor.js';
import { PERFORMANCE_THRESHOLDS } from '../utils/performanceHelpers.js';

// ============================================
// Arbitrary Generators
// ============================================

const componentNameArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9-]*$/);

// Duration that exceeds warning threshold (16ms) but not error threshold (50ms)
const warningDurationArb = fc.float({
  min: Math.fround(PERFORMANCE_THRESHOLDS.warning + 0.1),
  max: Math.fround(PERFORMANCE_THRESHOLDS.error - 0.1),
  noNaN: true,
});

// Duration that exceeds error threshold (50ms)
const errorDurationArb = fc.float({
  min: Math.fround(PERFORMANCE_THRESHOLDS.error + 0.1),
  max: Math.fround(200),
  noNaN: true,
});

// Duration within budget (under 16ms)
const withinBudgetDurationArb = fc.float({
  min: Math.fround(0),
  max: Math.fround(PERFORMANCE_THRESHOLDS.warning - 0.1),
  noNaN: true,
});

// Custom budget thresholds
const customWarningThresholdArb = fc.float({ min: Math.fround(1), max: Math.fround(50), noNaN: true });
const customErrorThresholdArb = fc.float({ min: Math.fround(51), max: Math.fround(200), noNaN: true });

// ============================================
// Test Suite
// ============================================

describe('PerformanceMonitor Warning and Alert Triggers', () => {
  let monitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
    resetDefaultMonitor();
  });

  // ============================================
  // 6.7 Tests for PerformanceMonitor Warning Triggers
  // Requirements: 3.5
  // ============================================

  describe('Warning Trigger Tests', () => {
    /**
     * Test: Renders exceeding 16ms trigger warnings
     * _Requirements: 3.5_
     */
    it('should trigger warning for renders exceeding 16ms threshold', () => {
      const alerts = [];
      monitor.onBudgetExceeded((alert) => alerts.push(alert));

      // Record a render that exceeds warning threshold but not error
      monitor.recordRender('TestComponent', 20);

      expect(alerts.length).toBe(1);
      expect(alerts[0].level).toBe('warning');
      expect(alerts[0].componentName).toBe('TestComponent');
      expect(alerts[0].duration).toBe(20);
      expect(alerts[0].threshold).toBe(PERFORMANCE_THRESHOLDS.warning);
    });

    /**
     * Test: Warning callback receives correct data
     * _Requirements: 3.5_
     */
    it('should provide correct data in warning callback', () => {
      const alerts = [];
      monitor.onBudgetExceeded((alert) => alerts.push(alert));

      monitor.recordRender('MyButton', 25.5);

      expect(alerts.length).toBe(1);
      expect(alerts[0]).toMatchObject({
        componentName: 'MyButton',
        duration: 25.5,
        threshold: PERFORMANCE_THRESHOLDS.warning,
        level: 'warning',
      });
      expect(alerts[0].timestamp).toBeDefined();
      expect(typeof alerts[0].timestamp).toBe('number');
    });

    /**
     * Test: No warning for renders within budget
     * _Requirements: 3.5_
     */
    it('should not trigger warning for renders within 16ms budget', () => {
      const alerts = [];
      monitor.onBudgetExceeded((alert) => alerts.push(alert));

      monitor.recordRender('FastComponent', 10);

      expect(alerts.length).toBe(0);
    });

    /**
     * Test: Error level for renders exceeding error threshold
     * _Requirements: 3.5_
     */
    it('should trigger error level for renders exceeding 50ms threshold', () => {
      const alerts = [];
      monitor.onBudgetExceeded((alert) => alerts.push(alert));

      monitor.recordRender('SlowComponent', 60);

      expect(alerts.length).toBe(1);
      expect(alerts[0].level).toBe('error');
      expect(alerts[0].threshold).toBe(PERFORMANCE_THRESHOLDS.error);
    });
  });

  // ============================================
  // 6.8 Property Test: Performance Warning Trigger
  // **Property 10: Performance Warning Trigger**
  // **Validates: Requirements 3.5**
  // ============================================

  describe('Property 10: Performance Warning Trigger', () => {
    /**
     * **Feature: primitives-extended-testing, Property 10: Performance Warning Trigger**
     *
     * *For any* render that exceeds the 16ms warning threshold, the PerformanceMonitor
     * SHALL invoke the warning log callback with component name and duration.
     *
     * **Validates: Requirements 3.5**
     */
    it('should trigger warning callback for any render exceeding 16ms threshold', () => {
      fc.assert(
        fc.property(componentNameArb, warningDurationArb, (name, duration) => {
          const mon = new PerformanceMonitor();
          const alerts = [];

          mon.onBudgetExceeded((alert) => alerts.push(alert));
          mon.recordRender(name, duration);

          // Should trigger exactly one warning
          expect(alerts.length).toBe(1);
          expect(alerts[0].componentName).toBe(name);
          expect(alerts[0].duration).toBeCloseTo(duration, 5);
          expect(alerts[0].level).toBe('warning');
          expect(alerts[0].threshold).toBe(PERFORMANCE_THRESHOLDS.warning);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: No warning for renders within budget
     */
    it('should not trigger warning for any render within 16ms budget', () => {
      fc.assert(
        fc.property(componentNameArb, withinBudgetDurationArb, (name, duration) => {
          const mon = new PerformanceMonitor();
          const alerts = [];

          mon.onBudgetExceeded((alert) => alerts.push(alert));
          mon.recordRender(name, duration);

          // Should not trigger any alerts
          expect(alerts.length).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Error level for renders exceeding error threshold
     */
    it('should trigger error level for any render exceeding 50ms threshold', () => {
      fc.assert(
        fc.property(componentNameArb, errorDurationArb, (name, duration) => {
          const mon = new PerformanceMonitor();
          const alerts = [];

          mon.onBudgetExceeded((alert) => alerts.push(alert));
          mon.recordRender(name, duration);

          // Should trigger exactly one error
          expect(alerts.length).toBe(1);
          expect(alerts[0].componentName).toBe(name);
          expect(alerts[0].duration).toBeCloseTo(duration, 5);
          expect(alerts[0].level).toBe('error');
          expect(alerts[0].threshold).toBe(PERFORMANCE_THRESHOLDS.error);
        }),
        { numRuns: 100 }
      );
    });
  });

  // ============================================
  // 6.9 Tests for Budget Alert Triggers
  // Requirements: 3.6
  // ============================================

  describe('Budget Alert Trigger Tests', () => {
    /**
     * Test: Component-specific budget alerts
     * _Requirements: 3.6_
     */
    it('should trigger alert based on component-specific budget', () => {
      const alerts = [];
      monitor.onBudgetExceeded((alert) => alerts.push(alert));

      // Set a custom budget for a specific component
      monitor.setBudget('CustomComponent', { warning: 5, error: 10 });

      // Record a render that exceeds the custom warning threshold
      monitor.recordRender('CustomComponent', 7);

      expect(alerts.length).toBe(1);
      expect(alerts[0].componentName).toBe('CustomComponent');
      expect(alerts[0].threshold).toBe(5);
      expect(alerts[0].level).toBe('warning');
    });

    /**
     * Test: Alert callback receives all required fields
     * _Requirements: 3.6_
     */
    it('should provide componentName, duration, threshold, and level in alert', () => {
      const alerts = [];
      monitor.onBudgetExceeded((alert) => alerts.push(alert));

      monitor.setBudget('AlertTest', { warning: 8, error: 20 });
      monitor.recordRender('AlertTest', 15);

      expect(alerts.length).toBe(1);
      expect(alerts[0]).toHaveProperty('componentName', 'AlertTest');
      expect(alerts[0]).toHaveProperty('duration', 15);
      expect(alerts[0]).toHaveProperty('threshold', 8);
      expect(alerts[0]).toHaveProperty('level', 'warning');
    });

    /**
     * Test: Error level alert for exceeding error threshold
     * _Requirements: 3.6_
     */
    it('should trigger error level when exceeding component error threshold', () => {
      const alerts = [];
      monitor.onBudgetExceeded((alert) => alerts.push(alert));

      monitor.setBudget('ErrorTest', { warning: 5, error: 15 });
      monitor.recordRender('ErrorTest', 20);

      expect(alerts.length).toBe(1);
      expect(alerts[0].level).toBe('error');
      expect(alerts[0].threshold).toBe(15);
    });

    /**
     * Test: No alert when within component budget
     * _Requirements: 3.6_
     */
    it('should not trigger alert when within component budget', () => {
      const alerts = [];
      monitor.onBudgetExceeded((alert) => alerts.push(alert));

      monitor.setBudget('FastComponent', { warning: 10, error: 20 });
      monitor.recordRender('FastComponent', 5);

      expect(alerts.length).toBe(0);
    });
  });

  // ============================================
  // 6.10 Property Test: Budget Alert Trigger
  // **Property 11: Budget Alert Trigger**
  // **Validates: Requirements 3.6**
  // ============================================

  describe('Property 11: Budget Alert Trigger', () => {
    /**
     * **Feature: primitives-extended-testing, Property 11: Budget Alert Trigger**
     *
     * *For any* component with a defined performance budget, when a render exceeds
     * that budget, the PerformanceMonitor SHALL trigger an alert callback with the
     * component name, duration, threshold, and level.
     *
     * **Validates: Requirements 3.6**
     */
    it('should trigger alert with correct fields for any component exceeding its budget', () => {
      fc.assert(
        fc.property(
          componentNameArb,
          customWarningThresholdArb,
          (name, warningThreshold) => {
            const mon = new PerformanceMonitor();
            const alerts = [];

            mon.onBudgetExceeded((alert) => alerts.push(alert));

            // Set custom budget
            const errorThreshold = warningThreshold * 3;
            mon.setBudget(name, { warning: warningThreshold, error: errorThreshold });

            // Record a render that exceeds warning but not error
            const duration = warningThreshold + 1;
            mon.recordRender(name, duration);

            // Verify alert was triggered with correct fields
            expect(alerts.length).toBe(1);
            expect(alerts[0].componentName).toBe(name);
            expect(alerts[0].duration).toBeCloseTo(duration, 5);
            expect(alerts[0].threshold).toBeCloseTo(warningThreshold, 5);
            expect(alerts[0].level).toBe('warning');
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Error level alert for exceeding error threshold
     */
    it('should trigger error level alert when exceeding error threshold', () => {
      fc.assert(
        fc.property(
          componentNameArb,
          customWarningThresholdArb,
          (name, warningThreshold) => {
            const mon = new PerformanceMonitor();
            const alerts = [];

            mon.onBudgetExceeded((alert) => alerts.push(alert));

            // Set custom budget
            const errorThreshold = warningThreshold * 2;
            mon.setBudget(name, { warning: warningThreshold, error: errorThreshold });

            // Record a render that exceeds error threshold
            const duration = errorThreshold + 1;
            mon.recordRender(name, duration);

            // Verify error level alert
            expect(alerts.length).toBe(1);
            expect(alerts[0].level).toBe('error');
            expect(alerts[0].threshold).toBeCloseTo(errorThreshold, 5);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: No alert when within custom budget
     */
    it('should not trigger alert when render is within custom budget', () => {
      fc.assert(
        fc.property(
          componentNameArb,
          customWarningThresholdArb,
          (name, warningThreshold) => {
            const mon = new PerformanceMonitor();
            const alerts = [];

            mon.onBudgetExceeded((alert) => alerts.push(alert));

            // Set custom budget
            mon.setBudget(name, { warning: warningThreshold, error: warningThreshold * 2 });

            // Record a render within budget
            const duration = warningThreshold - 0.5;
            mon.recordRender(name, duration);

            // Should not trigger any alerts
            expect(alerts.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Alert timestamp is present and valid
     */
    it('should include valid timestamp in all alerts', () => {
      fc.assert(
        fc.property(
          componentNameArb,
          customWarningThresholdArb,
          (name, warningThreshold) => {
            const mon = new PerformanceMonitor();
            const alerts = [];
            const beforeTime = Date.now();

            mon.onBudgetExceeded((alert) => alerts.push(alert));
            mon.setBudget(name, { warning: warningThreshold, error: warningThreshold * 2 });
            mon.recordRender(name, warningThreshold + 1);

            const afterTime = Date.now();

            expect(alerts.length).toBe(1);
            expect(alerts[0].timestamp).toBeGreaterThanOrEqual(beforeTime);
            expect(alerts[0].timestamp).toBeLessThanOrEqual(afterTime);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ============================================
  // Additional Warning/Alert Tests
  // ============================================

  describe('Multiple Callbacks and Edge Cases', () => {
    /**
     * Test: Multiple alert callbacks all receive alerts
     */
    it('should notify all registered callbacks when budget exceeded', () => {
      const alerts1 = [];
      const alerts2 = [];
      const alerts3 = [];

      monitor.onBudgetExceeded((alert) => alerts1.push(alert));
      monitor.onBudgetExceeded((alert) => alerts2.push(alert));
      monitor.onBudgetExceeded((alert) => alerts3.push(alert));

      monitor.recordRender('MultiCallback', 25);

      expect(alerts1.length).toBe(1);
      expect(alerts2.length).toBe(1);
      expect(alerts3.length).toBe(1);
    });

    /**
     * Test: Unsubscribed callbacks don't receive alerts
     */
    it('should not notify unsubscribed callbacks', () => {
      const alerts = [];
      const unsubscribe = monitor.onBudgetExceeded((alert) => alerts.push(alert));

      monitor.recordRender('Test1', 25);
      expect(alerts.length).toBe(1);

      unsubscribe();

      monitor.recordRender('Test2', 25);
      expect(alerts.length).toBe(1); // Should still be 1
    });

    /**
     * Test: Custom logger receives warning messages
     */
    it('should use custom logger for warning messages', () => {
      const logs = [];
      monitor.setLogger((message, data) => logs.push({ message, data }));

      monitor.recordRender('LogTest', 25);

      expect(logs.length).toBe(1);
      expect(logs[0].message).toContain('Slow render');
      expect(logs[0].data.componentName).toBe('LogTest');
    });

    /**
     * Test: Disabled monitor doesn't trigger alerts
     */
    it('should not trigger alerts when monitor is disabled', () => {
      const alerts = [];
      monitor.onBudgetExceeded((alert) => alerts.push(alert));
      monitor.setEnabled(false);

      monitor.recordRender('DisabledTest', 100);

      expect(alerts.length).toBe(0);
    });
  });
});
