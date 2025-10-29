//! Extension ecosystem with sandboxing and monitoring

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use std::time::{Duration, Instant};

// ============================================================================
// Extension Definition
// ============================================================================

/// Extension metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Extension {
    /// Extension ID
    pub id: String,

    /// Extension name
    pub name: String,

    /// Version
    pub version: String,

    /// Author
    pub author: String,

    /// Permissions required
    pub permissions: Vec<ExtensionPermission>,

    /// Enabled status
    pub enabled: bool,

    /// Installation timestamp
    pub installed_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ExtensionPermission {
    /// Can write logs
    WriteLogs,

    /// Can read configuration
    ReadConfig,

    /// Can access network
    Network,

    /// Can access file system
    FileSystem,

    /// Can execute commands
    Execute,
}

impl Extension {
    /// Create a new extension
    pub fn new(id: String, name: String, version: String, author: String) -> Self {
        Self {
            id,
            name,
            version,
            author,
            permissions: Vec::new(),
            enabled: true,
            installed_at: chrono::Utc::now().to_rfc3339(),
        }
    }

    /// Add permission
    pub fn with_permission(mut self, permission: ExtensionPermission) -> Self {
        self.permissions.push(permission);
        self
    }

    /// Check if extension has permission
    pub fn has_permission(&self, permission: &ExtensionPermission) -> bool {
        self.permissions.contains(permission)
    }
}

// ============================================================================
// Extension Sandbox
// ============================================================================

/// Sandboxed logging context for extensions
#[derive(Clone)]
pub struct ExtensionSandbox {
    /// Extension ID
    extension_id: String,

    /// Allowed permissions
    permissions: Vec<ExtensionPermission>,

    /// Resource limits
    limits: ResourceLimits,

    /// Current usage
    usage: Arc<RwLock<ResourceUsage>>,
}

/// Resource limits for extensions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceLimits {
    /// Maximum logs per second
    pub max_logs_per_second: u32,

    /// Maximum log size in bytes
    pub max_log_size_bytes: usize,

    /// Maximum memory usage in MB
    pub max_memory_mb: u64,

    /// Maximum CPU time in milliseconds
    pub max_cpu_time_ms: u64,
}

impl Default for ResourceLimits {
    fn default() -> Self {
        Self {
            max_logs_per_second: 100,
            max_log_size_bytes: 10240, // 10KB
            max_memory_mb: 50,
            max_cpu_time_ms: 1000,
        }
    }
}

/// Current resource usage
#[derive(Debug, Clone, Default)]
pub struct ResourceUsage {
    pub logs_count: u32,
    pub total_log_size: usize,
    pub memory_used_mb: u64,
    pub cpu_time_ms: u64,
    pub last_reset: Option<Instant>,
}

impl ExtensionSandbox {
    /// Create a new sandbox for extension
    pub fn new(extension_id: String, permissions: Vec<ExtensionPermission>) -> Self {
        Self {
            extension_id,
            permissions,
            limits: ResourceLimits::default(),
            usage: Arc::new(RwLock::new(ResourceUsage::default())),
        }
    }

    /// Set custom limits
    pub fn with_limits(mut self, limits: ResourceLimits) -> Self {
        self.limits = limits;
        self
    }

    /// Check if action is allowed
    pub fn check_permission(&self, permission: &ExtensionPermission) -> Result<(), String> {
        if self.permissions.contains(permission) {
            Ok(())
        } else {
            Err(format!(
                "Extension {} does not have {:?} permission",
                self.extension_id, permission
            ))
        }
    }

    /// Check resource limits before logging
    pub fn check_limits(&self, log_size: usize) -> Result<(), String> {
        let mut usage = self
            .usage
            .write()
            .map_err(|_| "Failed to acquire write lock".to_string())?;

        // Reset counters if needed (every second)
        if let Some(last_reset) = usage.last_reset {
            if last_reset.elapsed() >= Duration::from_secs(1) {
                usage.logs_count = 0;
                usage.total_log_size = 0;
                usage.last_reset = Some(Instant::now());
            }
        } else {
            usage.last_reset = Some(Instant::now());
        }

        // Check rate limit
        if usage.logs_count >= self.limits.max_logs_per_second {
            return Err(format!(
                "Rate limit exceeded: {} logs/sec",
                self.limits.max_logs_per_second
            ));
        }

        // Check log size
        if log_size > self.limits.max_log_size_bytes {
            return Err(format!(
                "Log size {} exceeds limit {}",
                log_size, self.limits.max_log_size_bytes
            ));
        }

        // Update usage
        usage.logs_count += 1;
        usage.total_log_size += log_size;

        Ok(())
    }

    /// Log from extension (sandboxed)
    pub fn log(&self, level: &str, message: &str) -> Result<(), String> {
        // Check permission
        self.check_permission(&ExtensionPermission::WriteLogs)?;

        // Check limits
        self.check_limits(message.len())?;

        // Log with extension context
        tracing::info!(
            extension_id = %self.extension_id,
            level = level,
            "Extension log: {}",
            message
        );

        Ok(())
    }

    /// Get current usage
    pub fn get_usage(&self) -> ResourceUsage {
        self.usage.read().unwrap().clone()
    }
}

// ============================================================================
// Extension Manager
// ============================================================================

/// Extension manager
pub struct ExtensionManager {
    /// Registered extensions
    extensions: Arc<RwLock<HashMap<String, Extension>>>,

    /// Sandboxes for extensions
    sandboxes: Arc<RwLock<HashMap<String, ExtensionSandbox>>>,
}

impl ExtensionManager {
    /// Create a new extension manager
    pub fn new() -> Self {
        Self {
            extensions: Arc::new(RwLock::new(HashMap::new())),
            sandboxes: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Register an extension
    pub fn register(&self, extension: Extension) -> Result<(), String> {
        let mut extensions = self
            .extensions
            .write()
            .map_err(|_| "Failed to acquire write lock".to_string())?;

        if extensions.contains_key(&extension.id) {
            return Err(format!("Extension {} already registered", extension.id));
        }

        // Create sandbox
        let sandbox = ExtensionSandbox::new(extension.id.clone(), extension.permissions.clone());

        let mut sandboxes = self
            .sandboxes
            .write()
            .map_err(|_| "Failed to acquire write lock".to_string())?;

        sandboxes.insert(extension.id.clone(), sandbox);
        extensions.insert(extension.id.clone(), extension);

        Ok(())
    }

    /// Get extension
    pub fn get(&self, extension_id: &str) -> Option<Extension> {
        let extensions = self.extensions.read().ok()?;
        extensions.get(extension_id).cloned()
    }

    /// Get sandbox for extension
    pub fn get_sandbox(&self, extension_id: &str) -> Option<ExtensionSandbox> {
        let sandboxes = self.sandboxes.read().ok()?;
        sandboxes.get(extension_id).cloned()
    }

    /// Enable/disable extension
    pub fn set_enabled(&self, extension_id: &str, enabled: bool) -> Result<(), String> {
        let mut extensions = self
            .extensions
            .write()
            .map_err(|_| "Failed to acquire write lock".to_string())?;

        if let Some(extension) = extensions.get_mut(extension_id) {
            extension.enabled = enabled;
            Ok(())
        } else {
            Err(format!("Extension {} not found", extension_id))
        }
    }

    /// List all extensions
    pub fn list(&self) -> Vec<Extension> {
        let extensions = self.extensions.read().ok();
        extensions
            .map(|e| e.values().cloned().collect())
            .unwrap_or_default()
    }

    /// Unregister extension
    pub fn unregister(&self, extension_id: &str) -> Result<(), String> {
        let mut extensions = self
            .extensions
            .write()
            .map_err(|_| "Failed to acquire write lock".to_string())?;

        let mut sandboxes = self
            .sandboxes
            .write()
            .map_err(|_| "Failed to acquire write lock".to_string())?;

        extensions.remove(extension_id);
        sandboxes.remove(extension_id);

        Ok(())
    }
}

impl Default for ExtensionManager {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// Extension Monitoring
// ============================================================================

/// Extension performance metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtensionMetrics {
    pub extension_id: String,
    pub total_logs: u64,
    pub total_errors: u64,
    pub avg_log_size: f64,
    pub logs_per_second: f64,
    pub error_rate: f64,
    pub uptime_seconds: u64,
}

/// Extension monitor
pub struct ExtensionMonitor {
    /// Metrics per extension
    metrics: Arc<RwLock<HashMap<String, ExtensionMetrics>>>,

    /// Start time
    start_time: Instant,
}

impl ExtensionMonitor {
    /// Create a new extension monitor
    pub fn new() -> Self {
        Self {
            metrics: Arc::new(RwLock::new(HashMap::new())),
            start_time: Instant::now(),
        }
    }

    /// Record log from extension
    pub fn record_log(&self, extension_id: &str, log_size: usize, is_error: bool) {
        let mut metrics = self.metrics.write().unwrap();

        let metric = metrics
            .entry(extension_id.to_string())
            .or_insert(ExtensionMetrics {
                extension_id: extension_id.to_string(),
                total_logs: 0,
                total_errors: 0,
                avg_log_size: 0.0,
                logs_per_second: 0.0,
                error_rate: 0.0,
                uptime_seconds: 0,
            });

        metric.total_logs += 1;
        if is_error {
            metric.total_errors += 1;
        }

        // Update average log size
        metric.avg_log_size = (metric.avg_log_size * (metric.total_logs - 1) as f64
            + log_size as f64)
            / metric.total_logs as f64;

        // Calculate rates
        let elapsed = self.start_time.elapsed().as_secs_f64();
        if elapsed > 0.0 {
            metric.logs_per_second = metric.total_logs as f64 / elapsed;
        }

        if metric.total_logs > 0 {
            metric.error_rate = (metric.total_errors as f64 / metric.total_logs as f64) * 100.0;
        }

        metric.uptime_seconds = elapsed as u64;
    }

    /// Get metrics for extension
    pub fn get_metrics(&self, extension_id: &str) -> Option<ExtensionMetrics> {
        let metrics = self.metrics.read().ok()?;
        metrics.get(extension_id).cloned()
    }

    /// Get all metrics
    pub fn get_all_metrics(&self) -> Vec<ExtensionMetrics> {
        let metrics = self.metrics.read().ok();
        metrics
            .map(|m| m.values().cloned().collect())
            .unwrap_or_default()
    }
}

impl Default for ExtensionMonitor {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extension_creation() {
        let ext = Extension::new(
            "ext1".to_string(),
            "Test Extension".to_string(),
            "1.0.0".to_string(),
            "Author".to_string(),
        )
        .with_permission(ExtensionPermission::WriteLogs);

        assert!(ext.has_permission(&ExtensionPermission::WriteLogs));
        assert!(!ext.has_permission(&ExtensionPermission::Network));
    }

    #[test]
    fn test_sandbox_permissions() {
        let sandbox =
            ExtensionSandbox::new("ext1".to_string(), vec![ExtensionPermission::WriteLogs]);

        assert!(sandbox
            .check_permission(&ExtensionPermission::WriteLogs)
            .is_ok());
        assert!(sandbox
            .check_permission(&ExtensionPermission::Network)
            .is_err());
    }

    #[test]
    fn test_extension_manager() {
        let manager = ExtensionManager::new();

        let ext = Extension::new(
            "ext1".to_string(),
            "Test".to_string(),
            "1.0.0".to_string(),
            "Author".to_string(),
        );

        assert!(manager.register(ext).is_ok());
        assert!(manager.get("ext1").is_some());
        assert!(manager.get_sandbox("ext1").is_some());
    }
}
