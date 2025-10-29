//! Real-time alerting system

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use std::time::{Duration, Instant};

// ============================================================================
// Alert Definition
// ============================================================================

/// Alert rule
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertRule {
    /// Rule ID
    pub id: String,

    /// Rule name
    pub name: String,

    /// Condition
    pub condition: AlertCondition,

    /// Severity
    pub severity: AlertSeverity,

    /// Notification channels
    pub channels: Vec<NotificationChannel>,

    /// Enabled status
    pub enabled: bool,

    /// Cooldown period in seconds
    pub cooldown_secs: u64,
}

/// Alert condition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AlertCondition {
    /// Error rate exceeds threshold
    ErrorRate { threshold: f64, window_secs: u64 },

    /// Log volume exceeds threshold
    LogVolume { threshold: u64, window_secs: u64 },

    /// Specific log pattern detected
    Pattern {
        pattern: String,
        count: u64,
        window_secs: u64,
    },

    /// Response time exceeds threshold
    ResponseTime { threshold_ms: f64, percentile: f64 },

    /// Service health check failed
    HealthCheck {
        service: String,
        consecutive_failures: u32,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
pub enum AlertSeverity {
    Info,
    Warning,
    Error,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NotificationChannel {
    Email(String),
    Slack(String),
    Webhook(String),
    SMS(String),
}

impl AlertRule {
    /// Create a new alert rule
    pub fn new(
        id: String,
        name: String,
        condition: AlertCondition,
        severity: AlertSeverity,
    ) -> Self {
        Self {
            id,
            name,
            condition,
            severity,
            channels: Vec::new(),
            enabled: true,
            cooldown_secs: 300, // 5 minutes default
        }
    }

    /// Add notification channel
    pub fn with_channel(mut self, channel: NotificationChannel) -> Self {
        self.channels.push(channel);
        self
    }

    /// Set cooldown period
    pub fn with_cooldown(mut self, secs: u64) -> Self {
        self.cooldown_secs = secs;
        self
    }
}

// ============================================================================
// Alert Instance
// ============================================================================

/// Triggered alert
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Alert {
    /// Alert ID
    pub id: String,

    /// Rule ID that triggered this alert
    pub rule_id: String,

    /// Rule name
    pub rule_name: String,

    /// Severity
    pub severity: AlertSeverity,

    /// Timestamp
    pub timestamp: String,

    /// Message
    pub message: String,

    /// Additional context
    pub context: HashMap<String, String>,

    /// Status
    pub status: AlertStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AlertStatus {
    Triggered,
    Acknowledged,
    Resolved,
}

impl Alert {
    /// Create a new alert
    pub fn new(rule: &AlertRule, message: String) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            rule_id: rule.id.clone(),
            rule_name: rule.name.clone(),
            severity: rule.severity.clone(),
            timestamp: chrono::Utc::now().to_rfc3339(),
            message,
            context: HashMap::new(),
            status: AlertStatus::Triggered,
        }
    }

    /// Add context
    pub fn with_context(mut self, key: String, value: String) -> Self {
        self.context.insert(key, value);
        self
    }

    /// Acknowledge alert
    pub fn acknowledge(&mut self) {
        self.status = AlertStatus::Acknowledged;
    }

    /// Resolve alert
    pub fn resolve(&mut self) {
        self.status = AlertStatus::Resolved;
    }
}

// ============================================================================
// Alert Manager
// ============================================================================

/// Alert manager
pub struct AlertManager {
    /// Alert rules
    rules: Arc<RwLock<HashMap<String, AlertRule>>>,

    /// Active alerts
    active_alerts: Arc<RwLock<HashMap<String, Alert>>>,

    /// Alert history
    history: Arc<RwLock<Vec<Alert>>>,

    /// Last trigger time per rule (for cooldown)
    last_trigger: Arc<RwLock<HashMap<String, Instant>>>,

    /// Maximum history size
    max_history: usize,
}

impl AlertManager {
    /// Create a new alert manager
    pub fn new() -> Self {
        Self {
            rules: Arc::new(RwLock::new(HashMap::new())),
            active_alerts: Arc::new(RwLock::new(HashMap::new())),
            history: Arc::new(RwLock::new(Vec::new())),
            last_trigger: Arc::new(RwLock::new(HashMap::new())),
            max_history: 1000,
        }
    }

    /// Add alert rule
    pub fn add_rule(&self, rule: AlertRule) -> Result<(), String> {
        let mut rules = self
            .rules
            .write()
            .map_err(|_| "Failed to acquire write lock".to_string())?;

        rules.insert(rule.id.clone(), rule);
        Ok(())
    }

    /// Remove alert rule
    pub fn remove_rule(&self, rule_id: &str) -> Result<(), String> {
        let mut rules = self
            .rules
            .write()
            .map_err(|_| "Failed to acquire write lock".to_string())?;

        rules.remove(rule_id);
        Ok(())
    }

    /// Enable/disable rule
    pub fn set_rule_enabled(&self, rule_id: &str, enabled: bool) -> Result<(), String> {
        let mut rules = self
            .rules
            .write()
            .map_err(|_| "Failed to acquire write lock".to_string())?;

        if let Some(rule) = rules.get_mut(rule_id) {
            rule.enabled = enabled;
            Ok(())
        } else {
            Err(format!("Rule {} not found", rule_id))
        }
    }

    /// Check if rule is in cooldown
    fn is_in_cooldown(&self, rule_id: &str, cooldown_secs: u64) -> bool {
        let last_trigger = self.last_trigger.read().unwrap();

        if let Some(last) = last_trigger.get(rule_id) {
            last.elapsed() < Duration::from_secs(cooldown_secs)
        } else {
            false
        }
    }

    /// Trigger an alert
    pub fn trigger_alert(
        &self,
        rule_id: &str,
        message: String,
        context: HashMap<String, String>,
    ) -> Result<Alert, String> {
        let rules = self
            .rules
            .read()
            .map_err(|_| "Failed to acquire read lock".to_string())?;

        let rule = rules
            .get(rule_id)
            .ok_or_else(|| format!("Rule {} not found", rule_id))?;

        if !rule.enabled {
            return Err("Rule is disabled".to_string());
        }

        // Check cooldown
        if self.is_in_cooldown(rule_id, rule.cooldown_secs) {
            return Err("Rule is in cooldown period".to_string());
        }

        // Create alert
        let mut alert = Alert::new(rule, message);
        for (k, v) in context {
            alert = alert.with_context(k, v);
        }

        // Update last trigger time
        let mut last_trigger = self.last_trigger.write().unwrap();
        last_trigger.insert(rule_id.to_string(), Instant::now());

        // Add to active alerts
        let mut active = self.active_alerts.write().unwrap();
        active.insert(alert.id.clone(), alert.clone());

        // Send notifications
        self.send_notifications(rule, &alert);

        // Log alert
        tracing::warn!(
            alert_id = %alert.id,
            rule_id = %rule_id,
            severity = ?alert.severity,
            "Alert triggered: {}",
            alert.message
        );

        Ok(alert)
    }

    /// Send notifications for alert
    fn send_notifications(&self, rule: &AlertRule, _alert: &Alert) {
        for channel in &rule.channels {
            match channel {
                NotificationChannel::Email(email) => {
                    tracing::info!("Sending email notification to {}", email);
                    // Implementation would send actual email
                }
                NotificationChannel::Slack(webhook) => {
                    tracing::info!("Sending Slack notification to {}", webhook);
                    // Implementation would send to Slack
                }
                NotificationChannel::Webhook(url) => {
                    tracing::info!("Sending webhook notification to {}", url);
                    // Implementation would POST to webhook
                }
                NotificationChannel::SMS(number) => {
                    tracing::info!("Sending SMS notification to {}", number);
                    // Implementation would send SMS
                }
            }
        }
    }

    /// Acknowledge alert
    pub fn acknowledge_alert(&self, alert_id: &str) -> Result<(), String> {
        let mut active = self
            .active_alerts
            .write()
            .map_err(|_| "Failed to acquire write lock".to_string())?;

        if let Some(alert) = active.get_mut(alert_id) {
            alert.acknowledge();
            Ok(())
        } else {
            Err(format!("Alert {} not found", alert_id))
        }
    }

    /// Resolve alert
    pub fn resolve_alert(&self, alert_id: &str) -> Result<(), String> {
        let mut active = self
            .active_alerts
            .write()
            .map_err(|_| "Failed to acquire write lock".to_string())?;

        if let Some(mut alert) = active.remove(alert_id) {
            alert.resolve();

            // Move to history
            let mut history = self.history.write().unwrap();
            history.push(alert);

            // Keep only max_history
            if history.len() > self.max_history {
                let len = history.len();
                history.drain(0..len - self.max_history);
            }

            Ok(())
        } else {
            Err(format!("Alert {} not found", alert_id))
        }
    }

    /// Get active alerts
    pub fn get_active_alerts(&self) -> Vec<Alert> {
        let active = self.active_alerts.read().unwrap();
        active.values().cloned().collect()
    }

    /// Get alert history
    pub fn get_history(&self, limit: usize) -> Vec<Alert> {
        let history = self.history.read().unwrap();
        let start = if history.len() > limit {
            history.len() - limit
        } else {
            0
        };
        history[start..].to_vec()
    }

    /// Get alert statistics
    #[must_use]
    pub fn get_statistics(&self) -> AlertStatistics {
        let active = self.active_alerts.read().unwrap();
        let active_count = active.len();
        let critical_count = active
            .values()
            .filter(|a| a.severity == AlertSeverity::Critical)
            .count();
        drop(active);

        let history = self.history.read().unwrap();
        let resolved_count = history
            .iter()
            .filter(|a| a.status == AlertStatus::Resolved)
            .count();
        let total_alerts = active_count + history.len();
        drop(history);

        AlertStatistics {
            total_alerts: total_alerts as u64,
            active_alerts: active_count as u64,
            resolved_alerts: resolved_count as u64,
            critical_alerts: critical_count as u64,
        }
    }
}

impl Default for AlertManager {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertStatistics {
    pub total_alerts: u64,
    pub active_alerts: u64,
    pub resolved_alerts: u64,
    pub critical_alerts: u64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_alert_rule() {
        let rule = AlertRule::new(
            "rule1".to_string(),
            "High Error Rate".to_string(),
            AlertCondition::ErrorRate {
                threshold: 5.0,
                window_secs: 60,
            },
            AlertSeverity::Critical,
        )
        .with_channel(NotificationChannel::Email("admin@example.com".to_string()));

        assert_eq!(rule.id, "rule1");
        assert_eq!(rule.channels.len(), 1);
    }

    #[test]
    fn test_alert_manager() {
        let manager = AlertManager::new();

        let rule = AlertRule::new(
            "rule1".to_string(),
            "Test Rule".to_string(),
            AlertCondition::LogVolume {
                threshold: 1000,
                window_secs: 60,
            },
            AlertSeverity::Warning,
        );

        manager.add_rule(rule).ok();

        let alert = manager
            .trigger_alert("rule1", "Log volume exceeded".to_string(), HashMap::new())
            .unwrap();

        assert_eq!(alert.status, AlertStatus::Triggered);
        assert_eq!(manager.get_active_alerts().len(), 1);
    }
}
