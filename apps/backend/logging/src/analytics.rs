//! Business intelligence and analytics

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use std::time::Instant;

// ============================================================================
// Business Metrics
// ============================================================================

/// Business metrics tracker
pub struct BusinessMetrics {
    /// Extension usage metrics
    extension_usage: Arc<RwLock<HashMap<String, ExtensionUsage>>>,

    /// Workflow metrics
    workflow_metrics: Arc<RwLock<HashMap<String, WorkflowMetrics>>>,

    /// Start time
    start_time: Instant,
}

/// Extension usage statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtensionUsage {
    pub extension_id: String,
    pub total_invocations: u64,
    pub successful_invocations: u64,
    pub failed_invocations: u64,
    pub avg_execution_time_ms: f64,
    pub total_data_processed_mb: f64,
    pub last_used: String,
}

/// Workflow execution metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowMetrics {
    pub workflow_id: String,
    pub total_executions: u64,
    pub successful_executions: u64,
    pub failed_executions: u64,
    pub avg_duration_ms: f64,
    pub success_rate: f64,
    pub last_execution: String,
}

impl BusinessMetrics {
    /// Create a new business metrics tracker
    pub fn new() -> Self {
        Self {
            extension_usage: Arc::new(RwLock::new(HashMap::new())),
            workflow_metrics: Arc::new(RwLock::new(HashMap::new())),
            start_time: Instant::now(),
        }
    }

    /// Get uptime in seconds
    pub fn uptime_secs(&self) -> u64 {
        self.start_time.elapsed().as_secs()
    }

    /// Record extension invocation
    pub fn record_extension_usage(
        &self,
        extension_id: &str,
        success: bool,
        execution_time_ms: f64,
        data_size_mb: f64,
    ) {
        let mut usage = self.extension_usage.write().unwrap();

        let entry = usage
            .entry(extension_id.to_string())
            .or_insert(ExtensionUsage {
                extension_id: extension_id.to_string(),
                total_invocations: 0,
                successful_invocations: 0,
                failed_invocations: 0,
                avg_execution_time_ms: 0.0,
                total_data_processed_mb: 0.0,
                last_used: chrono::Utc::now().to_rfc3339(),
            });

        entry.total_invocations += 1;
        if success {
            entry.successful_invocations += 1;
        } else {
            entry.failed_invocations += 1;
        }

        // Update average execution time
        entry.avg_execution_time_ms = (entry.avg_execution_time_ms
            * (entry.total_invocations - 1) as f64
            + execution_time_ms)
            / entry.total_invocations as f64;

        entry.total_data_processed_mb += data_size_mb;
        entry.last_used = chrono::Utc::now().to_rfc3339();
    }

    /// Record workflow execution
    pub fn record_workflow(&self, workflow_id: &str, success: bool, duration_ms: f64) {
        let mut metrics = self.workflow_metrics.write().unwrap();

        let entry = metrics
            .entry(workflow_id.to_string())
            .or_insert(WorkflowMetrics {
                workflow_id: workflow_id.to_string(),
                total_executions: 0,
                successful_executions: 0,
                failed_executions: 0,
                avg_duration_ms: 0.0,
                success_rate: 0.0,
                last_execution: chrono::Utc::now().to_rfc3339(),
            });

        entry.total_executions += 1;
        if success {
            entry.successful_executions += 1;
        } else {
            entry.failed_executions += 1;
        }

        // Update average duration
        entry.avg_duration_ms = (entry.avg_duration_ms * (entry.total_executions - 1) as f64
            + duration_ms)
            / entry.total_executions as f64;

        // Calculate success rate
        entry.success_rate =
            (entry.successful_executions as f64 / entry.total_executions as f64) * 100.0;
        entry.last_execution = chrono::Utc::now().to_rfc3339();
    }

    /// Get extension usage statistics
    pub fn get_extension_usage(&self, extension_id: &str) -> Option<ExtensionUsage> {
        let usage = self.extension_usage.read().ok()?;
        usage.get(extension_id).cloned()
    }

    /// Get all extension usage
    pub fn get_all_extension_usage(&self) -> Vec<ExtensionUsage> {
        let usage = self.extension_usage.read().ok();
        usage
            .map(|u| u.values().cloned().collect())
            .unwrap_or_default()
    }

    /// Get workflow metrics
    pub fn get_workflow_metrics(&self, workflow_id: &str) -> Option<WorkflowMetrics> {
        let metrics = self.workflow_metrics.read().ok()?;
        metrics.get(workflow_id).cloned()
    }

    /// Get all workflow metrics
    pub fn get_all_workflow_metrics(&self) -> Vec<WorkflowMetrics> {
        let metrics = self.workflow_metrics.read().ok();
        metrics
            .map(|m| m.values().cloned().collect())
            .unwrap_or_default()
    }

    /// Get top extensions by usage
    pub fn get_top_extensions(&self, limit: usize) -> Vec<ExtensionUsage> {
        let usage = self.extension_usage.read().unwrap();
        let mut extensions: Vec<ExtensionUsage> = usage.values().cloned().collect();
        extensions.sort_by(|a, b| b.total_invocations.cmp(&a.total_invocations));
        extensions.truncate(limit);
        extensions
    }
}

impl Default for BusinessMetrics {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// User Journey Tracking
// ============================================================================

/// User journey tracker
pub struct UserJourneyTracker {
    /// Active journeys
    journeys: Arc<RwLock<HashMap<String, UserJourney>>>,

    /// Completed journeys
    completed: Arc<RwLock<Vec<UserJourney>>>,

    /// Maximum completed journeys to keep
    max_completed: usize,
}

/// User journey
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserJourney {
    pub journey_id: String,
    pub user_id: String,
    pub start_time: String,
    pub end_time: Option<String>,
    pub steps: Vec<JourneyStep>,
    pub status: JourneyStatus,
    pub total_duration_ms: Option<f64>,
}

/// Journey step
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JourneyStep {
    pub step_id: String,
    pub step_name: String,
    pub timestamp: String,
    pub duration_ms: Option<f64>,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum JourneyStatus {
    InProgress,
    Completed,
    Failed,
    Abandoned,
}

impl UserJourneyTracker {
    /// Create a new user journey tracker
    pub fn new() -> Self {
        Self {
            journeys: Arc::new(RwLock::new(HashMap::new())),
            completed: Arc::new(RwLock::new(Vec::new())),
            max_completed: 1000,
        }
    }

    /// Start a new journey
    pub fn start_journey(&self, journey_id: String, user_id: String) -> Result<(), String> {
        let mut journeys = self
            .journeys
            .write()
            .map_err(|_| "Failed to acquire write lock".to_string())?;

        let journey = UserJourney {
            journey_id: journey_id.clone(),
            user_id,
            start_time: chrono::Utc::now().to_rfc3339(),
            end_time: None,
            steps: Vec::new(),
            status: JourneyStatus::InProgress,
            total_duration_ms: None,
        };

        journeys.insert(journey_id, journey);
        Ok(())
    }

    /// Add step to journey
    pub fn add_step(
        &self,
        journey_id: &str,
        step_id: String,
        step_name: String,
        metadata: HashMap<String, String>,
    ) -> Result<(), String> {
        let mut journeys = self
            .journeys
            .write()
            .map_err(|_| "Failed to acquire write lock".to_string())?;

        let journey = journeys
            .get_mut(journey_id)
            .ok_or_else(|| format!("Journey {} not found", journey_id))?;

        let step = JourneyStep {
            step_id,
            step_name,
            timestamp: chrono::Utc::now().to_rfc3339(),
            duration_ms: None,
            metadata,
        };

        journey.steps.push(step);
        Ok(())
    }

    /// Complete journey
    pub fn complete_journey(&self, journey_id: &str, success: bool) -> Result<(), String> {
        let mut journeys = self
            .journeys
            .write()
            .map_err(|_| "Failed to acquire write lock".to_string())?;

        let mut journey = journeys
            .remove(journey_id)
            .ok_or_else(|| format!("Journey {} not found", journey_id))?;

        journey.end_time = Some(chrono::Utc::now().to_rfc3339());
        journey.status = if success {
            JourneyStatus::Completed
        } else {
            JourneyStatus::Failed
        };

        // Calculate total duration
        if let Ok(start) = chrono::DateTime::parse_from_rfc3339(&journey.start_time) {
            if let Some(end_str) = &journey.end_time {
                if let Ok(end) = chrono::DateTime::parse_from_rfc3339(end_str) {
                    let duration = end.signed_duration_since(start);
                    journey.total_duration_ms = Some(duration.num_milliseconds() as f64);
                }
            }
        }

        // Move to completed
        let mut completed = self
            .completed
            .write()
            .map_err(|_| "Failed to acquire write lock".to_string())?;

        completed.push(journey);

        // Keep only max_completed
        if completed.len() > self.max_completed {
            let len = completed.len();
            completed.drain(0..len - self.max_completed);
        }

        Ok(())
    }

    /// Get active journey
    pub fn get_journey(&self, journey_id: &str) -> Option<UserJourney> {
        let journeys = self.journeys.read().ok()?;
        journeys.get(journey_id).cloned()
    }

    /// Get completed journeys for user
    pub fn get_user_journeys(&self, user_id: &str) -> Vec<UserJourney> {
        let completed = self.completed.read().ok();
        completed
            .map(|c| c.iter().filter(|j| j.user_id == user_id).cloned().collect())
            .unwrap_or_default()
    }

    /// Get journey statistics
    pub fn get_statistics(&self) -> JourneyStatistics {
        let completed = self.completed.read().unwrap();

        let total = completed.len() as u64;
        let successful = completed
            .iter()
            .filter(|j| j.status == JourneyStatus::Completed)
            .count() as u64;

        let avg_duration = if !completed.is_empty() {
            completed
                .iter()
                .filter_map(|j| j.total_duration_ms)
                .sum::<f64>()
                / completed.len() as f64
        } else {
            0.0
        };

        JourneyStatistics {
            total_journeys: total,
            successful_journeys: successful,
            failed_journeys: total - successful,
            success_rate: if total > 0 {
                (successful as f64 / total as f64) * 100.0
            } else {
                0.0
            },
            avg_duration_ms: avg_duration,
        }
    }
}

impl Default for UserJourneyTracker {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JourneyStatistics {
    pub total_journeys: u64,
    pub successful_journeys: u64,
    pub failed_journeys: u64,
    pub success_rate: f64,
    pub avg_duration_ms: f64,
}

// ============================================================================
// Custom Metrics
// ============================================================================

/// Custom metrics collector
pub struct CustomMetrics {
    /// Metrics storage
    metrics: Arc<RwLock<HashMap<String, Vec<MetricPoint>>>>,

    /// Maximum points per metric
    max_points: usize,
}

/// Metric data point
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricPoint {
    pub timestamp: String,
    pub value: f64,
    pub tags: HashMap<String, String>,
}

impl CustomMetrics {
    /// Create a new custom metrics collector
    pub fn new() -> Self {
        Self {
            metrics: Arc::new(RwLock::new(HashMap::new())),
            max_points: 10000,
        }
    }

    /// Record a metric
    pub fn record(&self, metric_name: &str, value: f64, tags: HashMap<String, String>) {
        let mut metrics = self.metrics.write().unwrap();

        let points = metrics.entry(metric_name.to_string()).or_default();

        points.push(MetricPoint {
            timestamp: chrono::Utc::now().to_rfc3339(),
            value,
            tags,
        });

        // Keep only max_points
        if points.len() > self.max_points {
            points.drain(0..points.len() - self.max_points);
        }
    }

    /// Get metric points
    pub fn get_metric(&self, metric_name: &str) -> Vec<MetricPoint> {
        let metrics = self.metrics.read().unwrap();
        metrics.get(metric_name).cloned().unwrap_or_default()
    }

    /// Get metric statistics
    pub fn get_statistics(&self, metric_name: &str) -> Option<MetricStatistics> {
        let metrics = self.metrics.read().unwrap();
        let points = metrics.get(metric_name)?;

        if points.is_empty() {
            return None;
        }

        let values: Vec<f64> = points.iter().map(|p| p.value).collect();
        let sum: f64 = values.iter().sum();
        let count = values.len() as f64;

        let mut sorted = values.clone();
        sorted.sort_by(|a, b| a.partial_cmp(b).unwrap());

        Some(MetricStatistics {
            metric_name: metric_name.to_string(),
            count: count as u64,
            sum,
            avg: sum / count,
            min: *sorted.first().unwrap(),
            max: *sorted.last().unwrap(),
            p50: sorted[sorted.len() / 2],
            p95: sorted[(sorted.len() as f64 * 0.95) as usize],
            p99: sorted[(sorted.len() as f64 * 0.99) as usize],
        })
    }

    /// List all metrics
    pub fn list_metrics(&self) -> Vec<String> {
        let metrics = self.metrics.read().unwrap();
        metrics.keys().cloned().collect()
    }
}

impl Default for CustomMetrics {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricStatistics {
    pub metric_name: String,
    pub count: u64,
    pub sum: f64,
    pub avg: f64,
    pub min: f64,
    pub max: f64,
    pub p50: f64,
    pub p95: f64,
    pub p99: f64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_business_metrics() {
        let metrics = BusinessMetrics::new();

        metrics.record_extension_usage("ext1", true, 100.0, 1.5);
        metrics.record_extension_usage("ext1", true, 150.0, 2.0);

        let usage = metrics.get_extension_usage("ext1").unwrap();
        assert_eq!(usage.total_invocations, 2);
        assert_eq!(usage.successful_invocations, 2);
    }

    #[test]
    fn test_user_journey() {
        let tracker = UserJourneyTracker::new();

        tracker
            .start_journey("j1".to_string(), "user1".to_string())
            .ok();
        tracker
            .add_step(
                "j1",
                "step1".to_string(),
                "Login".to_string(),
                HashMap::new(),
            )
            .ok();
        tracker.complete_journey("j1", true).ok();

        let stats = tracker.get_statistics();
        assert_eq!(stats.total_journeys, 1);
        assert_eq!(stats.successful_journeys, 1);
    }
}
