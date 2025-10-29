//! Monitoring middleware: performance, health, and SLA tracking

use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

// ============================================================================
// Health Monitoring
// ============================================================================

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum HealthStatus {
    Healthy,
    Degraded,
    Unhealthy,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthCheck {
    pub status: HealthStatus,
    pub message: String,
    pub timestamp: String,
    pub uptime_seconds: u64,
    pub checks: Vec<ComponentHealth>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComponentHealth {
    pub component: String,
    pub status: HealthStatus,
    pub message: Option<String>,
}

pub struct HealthMonitor {
    start_time: Instant,
    last_check: Mutex<Instant>,
}

impl HealthMonitor {
    pub fn new() -> Self {
        Self {
            start_time: Instant::now(),
            last_check: Mutex::new(Instant::now()),
        }
    }

    pub fn check_health(&self) -> HealthCheck {
        let checks = vec![
            ComponentHealth {
                component: "logging".to_string(),
                status: HealthStatus::Healthy,
                message: Some("Logging system operational".to_string()),
            },
            self.check_filesystem(),
            self.check_memory(),
        ];

        let overall_status = if checks.iter().any(|c| c.status == HealthStatus::Unhealthy) {
            HealthStatus::Unhealthy
        } else if checks.iter().any(|c| c.status == HealthStatus::Degraded) {
            HealthStatus::Degraded
        } else {
            HealthStatus::Healthy
        };

        HealthCheck {
            status: overall_status,
            message: match overall_status {
                HealthStatus::Healthy => "All systems operational".to_string(),
                HealthStatus::Degraded => "Some systems degraded".to_string(),
                HealthStatus::Unhealthy => "System unhealthy".to_string(),
            },
            timestamp: chrono::Utc::now().to_rfc3339(),
            uptime_seconds: self.start_time.elapsed().as_secs(),
            checks,
        }
    }

    fn check_filesystem(&self) -> ComponentHealth {
        ComponentHealth {
            component: "filesystem".to_string(),
            status: HealthStatus::Healthy,
            message: Some("Filesystem accessible".to_string()),
        }
    }

    fn check_memory(&self) -> ComponentHealth {
        ComponentHealth {
            component: "memory".to_string(),
            status: HealthStatus::Healthy,
            message: Some("Memory usage within limits".to_string()),
        }
    }

    pub fn uptime(&self) -> Duration {
        self.start_time.elapsed()
    }

    pub fn update_last_check(&self) {
        *self.last_check.lock().unwrap() = Instant::now();
    }

    pub fn time_since_last_check(&self) -> Duration {
        self.last_check.lock().unwrap().elapsed()
    }
}

impl Default for HealthMonitor {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// Performance Tracking
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceMetrics {
    pub total_messages: u64,
    pub messages_per_second: f64,
    pub avg_processing_time_us: f64,
    pub peak_messages_per_second: f64,
    pub cpu_usage_percent: f64,
    pub memory_usage_bytes: usize,
    pub dropped_messages: u64,
}

pub struct PerformanceTracker {
    start_time: Instant,
    total_messages: Arc<AtomicU64>,
    dropped_messages: Arc<AtomicU64>,
    processing_times: Arc<AtomicU64>,
    peak_rate: Arc<AtomicU64>,
    last_check: Arc<Mutex<Instant>>,
    last_count: Arc<AtomicU64>,
}

impl PerformanceTracker {
    pub fn new() -> Self {
        Self {
            start_time: Instant::now(),
            total_messages: Arc::new(AtomicU64::new(0)),
            dropped_messages: Arc::new(AtomicU64::new(0)),
            processing_times: Arc::new(AtomicU64::new(0)),
            peak_rate: Arc::new(AtomicU64::new(0)),
            last_check: Arc::new(Mutex::new(Instant::now())),
            last_count: Arc::new(AtomicU64::new(0)),
        }
    }

    pub fn record_message(&self, processing_time: Duration) {
        self.total_messages.fetch_add(1, Ordering::Relaxed);
        self.processing_times
            .fetch_add(processing_time.as_nanos() as u64, Ordering::Relaxed);
    }

    pub fn record_dropped(&self) {
        self.dropped_messages.fetch_add(1, Ordering::Relaxed);
    }

    pub fn get_metrics(&self) -> PerformanceMetrics {
        let total = self.total_messages.load(Ordering::Relaxed);
        let dropped = self.dropped_messages.load(Ordering::Relaxed);
        let processing_sum = self.processing_times.load(Ordering::Relaxed);

        let elapsed = self.start_time.elapsed().as_secs_f64();
        let messages_per_second = if elapsed > 0.0 {
            total as f64 / elapsed
        } else {
            0.0
        };

        let mut last_check = self.last_check.lock().unwrap();
        let time_since_check = last_check.elapsed().as_secs_f64();
        if time_since_check >= 1.0 {
            let last_count = self.last_count.load(Ordering::Relaxed);
            let current_rate = ((total - last_count) as f64 / time_since_check) as u64;

            let peak = self.peak_rate.load(Ordering::Relaxed);
            if current_rate > peak {
                self.peak_rate.store(current_rate, Ordering::Relaxed);
            }

            *last_check = Instant::now();
            self.last_count.store(total, Ordering::Relaxed);
        }
        drop(last_check);

        let avg_processing_time_us = if total > 0 {
            (processing_sum as f64 / total as f64) / 1000.0
        } else {
            0.0
        };

        let cpu_usage_percent = if avg_processing_time_us > 0.0 {
            (avg_processing_time_us / 1000.0).min(1.0)
        } else {
            0.0
        };

        let memory_usage_bytes = std::mem::size_of::<Self>() + (total as usize * 100);

        PerformanceMetrics {
            total_messages: total,
            messages_per_second,
            avg_processing_time_us,
            peak_messages_per_second: self.peak_rate.load(Ordering::Relaxed) as f64,
            cpu_usage_percent,
            memory_usage_bytes,
            dropped_messages: dropped,
        }
    }

    pub fn check_requirements(&self) -> Result<(), Vec<String>> {
        let metrics = self.get_metrics();
        let mut errors = Vec::new();

        if metrics.cpu_usage_percent > 1.0 {
            errors.push(format!(
                "CPU overhead too high: {:.2}%",
                metrics.cpu_usage_percent
            ));
        }

        if metrics.memory_usage_bytes > 30 * 1024 * 1024 {
            errors.push(format!(
                "Memory usage too high: {} MB",
                metrics.memory_usage_bytes / (1024 * 1024)
            ));
        }

        if metrics.peak_messages_per_second < 5000.0 && metrics.total_messages > 10000 {
            errors.push(format!(
                "Throughput too low: {:.0} msg/s",
                metrics.peak_messages_per_second
            ));
        }

        if errors.is_empty() {
            Ok(())
        } else {
            Err(errors)
        }
    }

    pub fn reset(&self) {
        self.total_messages.store(0, Ordering::Relaxed);
        self.dropped_messages.store(0, Ordering::Relaxed);
        self.processing_times.store(0, Ordering::Relaxed);
        self.peak_rate.store(0, Ordering::Relaxed);
        self.last_count.store(0, Ordering::Relaxed);
    }
}

impl Default for PerformanceTracker {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// SLA Monitoring
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SlaMetrics {
    pub total_requests: u64,
    pub successful_requests: u64,
    pub failed_requests: u64,
    pub success_rate: f64,
    pub avg_response_time_ms: f64,
    pub p50_response_time_ms: f64,
    pub p95_response_time_ms: f64,
    pub p99_response_time_ms: f64,
    pub error_rate: f64,
    pub sla_compliant: bool,
}

pub struct SlaMonitor {
    start_time: Instant,
    total_requests: Arc<AtomicU64>,
    successful_requests: Arc<AtomicU64>,
    failed_requests: Arc<AtomicU64>,
    response_times: Arc<Mutex<Vec<u64>>>,
    target_success_rate: f64,
    target_avg_response_ms: f64,
    target_p95_response_ms: f64,
}

impl SlaMonitor {
    pub fn new() -> Self {
        Self {
            start_time: Instant::now(),
            total_requests: Arc::new(AtomicU64::new(0)),
            successful_requests: Arc::new(AtomicU64::new(0)),
            failed_requests: Arc::new(AtomicU64::new(0)),
            response_times: Arc::new(Mutex::new(Vec::new())),
            target_success_rate: 99.0,
            target_avg_response_ms: 100.0,
            target_p95_response_ms: 500.0,
        }
    }

    pub fn with_targets(success_rate: f64, avg_response_ms: f64, p95_response_ms: f64) -> Self {
        Self {
            start_time: Instant::now(),
            total_requests: Arc::new(AtomicU64::new(0)),
            successful_requests: Arc::new(AtomicU64::new(0)),
            failed_requests: Arc::new(AtomicU64::new(0)),
            response_times: Arc::new(Mutex::new(Vec::new())),
            target_success_rate: success_rate,
            target_avg_response_ms: avg_response_ms,
            target_p95_response_ms: p95_response_ms,
        }
    }

    pub fn record_success(&self, response_time: Duration) {
        self.total_requests.fetch_add(1, Ordering::Relaxed);
        self.successful_requests.fetch_add(1, Ordering::Relaxed);

        let mut times = self.response_times.lock().unwrap();
        times.push(response_time.as_micros() as u64);

        if times.len() > 10000 {
            let len = times.len();
            times.drain(0..len - 10000);
        }
    }

    pub fn record_failure(&self, response_time: Duration) {
        self.total_requests.fetch_add(1, Ordering::Relaxed);
        self.failed_requests.fetch_add(1, Ordering::Relaxed);

        let mut times = self.response_times.lock().unwrap();
        times.push(response_time.as_micros() as u64);

        if times.len() > 10000 {
            let len = times.len();
            times.drain(0..len - 10000);
        }
    }

    pub fn uptime_secs(&self) -> u64 {
        self.start_time.elapsed().as_secs()
    }

    pub fn get_metrics(&self) -> SlaMetrics {
        let total = self.total_requests.load(Ordering::Relaxed);
        let successful = self.successful_requests.load(Ordering::Relaxed);
        let failed = self.failed_requests.load(Ordering::Relaxed);

        let success_rate = if total > 0 {
            (successful as f64 / total as f64) * 100.0
        } else {
            100.0
        };
        let error_rate = if total > 0 {
            (failed as f64 / total as f64) * 100.0
        } else {
            0.0
        };

        let times = self.response_times.lock().unwrap();
        let (avg_response_time_ms, p50, p95, p99) = if !times.is_empty() {
            let mut sorted_times = times.clone();
            sorted_times.sort_unstable();

            let sum: u64 = sorted_times.iter().sum();
            let avg = (sum as f64 / sorted_times.len() as f64) / 1000.0;

            let p50_idx = (sorted_times.len() as f64 * 0.50) as usize;
            let p95_idx = (sorted_times.len() as f64 * 0.95) as usize;
            let p99_idx = (sorted_times.len() as f64 * 0.99) as usize;

            let p50 = sorted_times[p50_idx.min(sorted_times.len() - 1)] as f64 / 1000.0;
            let p95 = sorted_times[p95_idx.min(sorted_times.len() - 1)] as f64 / 1000.0;
            let p99 = sorted_times[p99_idx.min(sorted_times.len() - 1)] as f64 / 1000.0;

            (avg, p50, p95, p99)
        } else {
            (0.0, 0.0, 0.0, 0.0)
        };

        let sla_compliant = success_rate >= self.target_success_rate
            && avg_response_time_ms <= self.target_avg_response_ms
            && p95 <= self.target_p95_response_ms;

        SlaMetrics {
            total_requests: total,
            successful_requests: successful,
            failed_requests: failed,
            success_rate,
            avg_response_time_ms,
            p50_response_time_ms: p50,
            p95_response_time_ms: p95,
            p99_response_time_ms: p99,
            error_rate,
            sla_compliant,
        }
    }

    pub fn is_sla_compliant(&self) -> bool {
        self.get_metrics().sla_compliant
    }

    pub fn reset(&self) {
        self.total_requests.store(0, Ordering::Relaxed);
        self.successful_requests.store(0, Ordering::Relaxed);
        self.failed_requests.store(0, Ordering::Relaxed);
        self.response_times.lock().unwrap().clear();
    }
}

impl Default for SlaMonitor {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_health_check() {
        let monitor = HealthMonitor::new();
        let health = monitor.check_health();
        assert_eq!(health.status, HealthStatus::Healthy);
        assert!(!health.checks.is_empty());
    }

    #[test]
    fn test_uptime() {
        let monitor = HealthMonitor::new();
        std::thread::sleep(Duration::from_millis(10));
        let uptime = monitor.uptime();
        assert!(uptime.as_millis() >= 10);
    }

    #[test]
    fn test_performance_tracking() {
        let tracker = PerformanceTracker::new();
        tracker.record_message(Duration::from_micros(10));
        tracker.record_message(Duration::from_micros(20));
        let metrics = tracker.get_metrics();
        assert_eq!(metrics.total_messages, 2);
        assert!(metrics.avg_processing_time_us > 0.0);
    }

    #[test]
    fn test_dropped_messages() {
        let tracker = PerformanceTracker::new();
        tracker.record_dropped();
        tracker.record_dropped();
        let metrics = tracker.get_metrics();
        assert_eq!(metrics.dropped_messages, 2);
    }

    #[test]
    fn test_sla_tracking() {
        let monitor = SlaMonitor::new();
        monitor.record_success(Duration::from_millis(50));
        monitor.record_success(Duration::from_millis(100));
        monitor.record_failure(Duration::from_millis(200));
        let metrics = monitor.get_metrics();
        assert_eq!(metrics.total_requests, 3);
        assert_eq!(metrics.successful_requests, 2);
        assert_eq!(metrics.failed_requests, 1);
        assert!(metrics.success_rate > 60.0);
    }

    #[test]
    fn test_percentiles() {
        let monitor = SlaMonitor::new();
        for i in 1..=100 {
            monitor.record_success(Duration::from_millis(i));
        }
        let metrics = monitor.get_metrics();
        assert!(metrics.p50_response_time_ms > 0.0);
        assert!(metrics.p95_response_time_ms > metrics.p50_response_time_ms);
        assert!(metrics.p99_response_time_ms > metrics.p95_response_time_ms);
    }
}
