//! # Test Utilities for XI-editor Adapter
//!
//! This module provides testing utilities and mock implementations for the XI-editor adapter.
//! These utilities are only available when the `test` feature is enabled or during testing.

use std::time::Duration;

use crate::event_stream::StreamMetrics;

/// Test-specific wrapper around StreamMetrics that provides additional methods
/// for manipulating metrics during testing scenarios.
///
/// This struct should only be used in tests and provides methods to simulate
/// error conditions and metric states that would be difficult to trigger
/// through normal operation.
#[derive(Debug)]
pub struct TestStreamMetrics {
    /// The underlying production metrics instance
    inner: StreamMetrics,
}

impl TestStreamMetrics {
    /// Create a new test metrics wrapper
    ///
    /// # Returns
    ///
    /// New test metrics instance wrapping a production StreamMetrics
    ///
    /// # Example
    ///
    /// ```rust
    /// use sy_xi_adapter::test_utils::TestStreamMetrics;
    ///
    /// let test_metrics = TestStreamMetrics::new();
    /// test_metrics.simulate_parse_error();
    /// assert_eq!(test_metrics.parse_errors(), 1);
    /// ```
    pub fn new() -> Self {
        Self {
            inner: StreamMetrics::new(),
        }
    }

    /// Simulate a parse error for testing
    ///
    /// This method increments the parse error counter to simulate
    /// error conditions during testing.
    pub fn simulate_parse_error(&self) {
        self.inner.parse_errors.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
    }

    /// Simulate a read error for testing
    ///
    /// This method increments the read error counter to simulate
    /// I/O error conditions during testing.
    pub fn simulate_read_error(&self) {
        self.inner.read_errors.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
    }

    /// Simulate a delivery error for testing
    ///
    /// This method increments the delivery error counter to simulate
    /// event routing failures during testing.
    pub fn simulate_delivery_error(&self) {
        self.inner.delivery_errors.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
    }

    /// Simulate a delivery timeout for testing
    ///
    /// This method increments the delivery timeout counter to simulate
    /// slow event delivery scenarios during testing.
    pub fn simulate_delivery_timeout(&self) {
        self.inner.delivery_timeouts.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
    }

    /// Simulate successful event delivery for testing
    ///
    /// This method increments the events delivered counter to simulate
    /// successful event processing during testing.
    ///
    /// # Arguments
    ///
    /// * `count` - Number of events to simulate as delivered
    pub fn simulate_events_delivered(&self, count: usize) {
        self.inner.events_delivered.fetch_add(count as u64, std::sync::atomic::Ordering::Relaxed);
    }

    /// Simulate processing time for testing
    ///
    /// This method records a processing time measurement to simulate
    /// performance characteristics during testing.
    ///
    /// # Arguments
    ///
    /// * `duration` - Processing time to record
    pub fn simulate_processing_time(&self, duration: Duration) {
        self.inner.record_processing_time(duration);
    }

    /// Simulate delivery time for testing
    ///
    /// This method records a delivery time measurement to simulate
    /// event delivery performance during testing.
    ///
    /// # Arguments
    ///
    /// * `duration` - Delivery time to record
    pub fn simulate_delivery_time(&self, duration: Duration) {
        self.inner.record_delivery_time(duration);
    }

    // Delegate all read-only methods to the inner metrics
    
    /// Get total events processed
    pub fn events_processed(&self) -> u64 {
        self.inner.events_processed()
    }

    /// Get total events delivered
    pub fn events_delivered(&self) -> u64 {
        self.inner.events_delivered()
    }

    /// Get parse error count
    pub fn parse_errors(&self) -> u64 {
        self.inner.parse_errors()
    }

    /// Get delivery error count
    pub fn delivery_errors(&self) -> u64 {
        self.inner.delivery_errors()
    }

    /// Get read error count
    pub fn read_errors(&self) -> u64 {
        self.inner.read_errors.load(std::sync::atomic::Ordering::Relaxed)
    }

    /// Get delivery timeout count
    pub fn delivery_timeouts(&self) -> u64 {
        self.inner.delivery_timeouts.load(std::sync::atomic::Ordering::Relaxed)
    }

    /// Get average processing time
    pub async fn avg_processing_time(&self) -> Duration {
        self.inner.avg_processing_time().await
    }

    /// Get average delivery time
    pub async fn avg_delivery_time(&self) -> Duration {
        self.inner.avg_delivery_time().await
    }

    /// Get reference to inner metrics for advanced testing scenarios
    ///
    /// This method provides access to the underlying StreamMetrics instance
    /// for cases where test code needs to interact with the production API.
    pub fn inner(&self) -> &StreamMetrics {
        &self.inner
    }
}

impl Default for TestStreamMetrics {
    fn default() -> Self {
        Self::new()
    }
}

/// Convert TestStreamMetrics to StreamMetrics for use in production code
impl From<TestStreamMetrics> for StreamMetrics {
    fn from(test_metrics: TestStreamMetrics) -> Self {
        test_metrics.inner
    }
}

/// Convert reference to TestStreamMetrics to reference to StreamMetrics
impl AsRef<StreamMetrics> for TestStreamMetrics {
    fn as_ref(&self) -> &StreamMetrics {
        &self.inner
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;

    #[test]
    fn test_metrics_creation() {
        let test_metrics = TestStreamMetrics::new();
        assert_eq!(test_metrics.events_processed(), 0);
        assert_eq!(test_metrics.parse_errors(), 0);
        assert_eq!(test_metrics.delivery_errors(), 0);
    }

    #[test]
    fn test_error_simulation() {
        let test_metrics = TestStreamMetrics::new();
        
        // Simulate various error conditions
        test_metrics.simulate_parse_error();
        test_metrics.simulate_read_error();
        test_metrics.simulate_delivery_error();
        test_metrics.simulate_delivery_timeout();
        
        // Verify error counts
        assert_eq!(test_metrics.parse_errors(), 1);
        assert_eq!(test_metrics.read_errors(), 1);
        assert_eq!(test_metrics.delivery_errors(), 1);
        assert_eq!(test_metrics.delivery_timeouts(), 1);
    }

    #[test]
    fn test_event_delivery_simulation() {
        let test_metrics = TestStreamMetrics::new();
        
        // Simulate successful event delivery
        test_metrics.simulate_events_delivered(5);
        test_metrics.simulate_events_delivered(3);
        
        // Verify delivery count
        assert_eq!(test_metrics.events_delivered(), 8);
    }

    #[tokio::test]
    async fn test_timing_simulation() {
        let test_metrics = TestStreamMetrics::new();
        
        // Simulate processing and delivery times
        let processing_time = Duration::from_millis(2);
        let delivery_time = Duration::from_millis(5);
        
        test_metrics.simulate_processing_time(processing_time);
        test_metrics.simulate_delivery_time(delivery_time);
        
        // Allow async tasks to complete
        tokio::time::sleep(Duration::from_millis(10)).await;
        
        // Verify timing metrics are recorded
        let avg_processing = test_metrics.avg_processing_time().await;
        let avg_delivery = test_metrics.avg_delivery_time().await;
        
        assert!(avg_processing > Duration::ZERO);
        assert!(avg_delivery > Duration::ZERO);
    }

    #[test]
    fn test_inner_access() {
        let test_metrics = TestStreamMetrics::new();
        
        // Test access to inner metrics
        let inner_ref = test_metrics.inner();
        assert_eq!(inner_ref.events_processed(), 0);
        
        // Test AsRef trait
        let inner_as_ref: &StreamMetrics = test_metrics.as_ref();
        assert_eq!(inner_as_ref.events_processed(), 0);
    }
}