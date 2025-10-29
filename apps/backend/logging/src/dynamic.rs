//! Dynamic reconfiguration with hot-reload support

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::{Arc, RwLock};
use std::time::{Duration, SystemTime};

// ============================================================================
// Dynamic Configuration
// ============================================================================

/// Dynamic configuration manager
pub struct DynamicConfig {
    /// Current configuration
    config: Arc<RwLock<crate::config::LoggingConfig>>,

    /// Configuration file path
    config_path: Option<PathBuf>,

    /// Last modification time
    last_modified: Arc<RwLock<Option<SystemTime>>>,

    /// Auto-reload enabled
    auto_reload: bool,

    /// Reload interval in seconds
    reload_interval_secs: u64,
}

impl DynamicConfig {
    /// Create a new dynamic configuration manager
    pub fn new(config: crate::config::LoggingConfig) -> Self {
        Self {
            config: Arc::new(RwLock::new(config)),
            config_path: None,
            last_modified: Arc::new(RwLock::new(None)),
            auto_reload: false,
            reload_interval_secs: 60,
        }
    }

    /// Create with file path for auto-reload
    pub fn with_file(mut self, path: PathBuf) -> Self {
        self.config_path = Some(path);
        self
    }

    /// Enable auto-reload
    pub fn with_auto_reload(mut self, enabled: bool) -> Self {
        self.auto_reload = enabled;
        self
    }

    /// Set reload interval
    pub fn with_reload_interval(mut self, secs: u64) -> Self {
        self.reload_interval_secs = secs;
        self
    }

    /// Get current configuration (read-only)
    pub fn get(&self) -> Result<crate::config::LoggingConfig, String> {
        self.config
            .read()
            .map(|c| c.clone())
            .map_err(|_| "Failed to read configuration".to_string())
    }

    /// Update configuration
    pub fn update(&self, new_config: crate::config::LoggingConfig) -> Result<(), String> {
        // Validate new configuration
        crate::config::ConfigValidator::validate_with_message(&new_config)?;

        // Update configuration
        let mut config = self
            .config
            .write()
            .map_err(|_| "Failed to acquire write lock".to_string())?;

        *config = new_config;

        tracing::info!("Configuration updated successfully");
        Ok(())
    }

    /// Reload configuration from file
    pub fn reload(&self) -> Result<(), String> {
        let path = self
            .config_path
            .as_ref()
            .ok_or_else(|| "No configuration file path set".to_string())?;

        // Load new configuration
        let new_config = crate::config::load_config(Some(path))?;

        // Update configuration
        self.update(new_config)?;

        // Update last modified time
        if let Ok(metadata) = std::fs::metadata(path) {
            if let Ok(modified) = metadata.modified() {
                *self.last_modified.write().unwrap() = Some(modified);
            }
        }

        Ok(())
    }

    /// Check if configuration file has been modified
    pub fn has_changed(&self) -> bool {
        if let Some(path) = &self.config_path {
            if let Ok(metadata) = std::fs::metadata(path) {
                if let Ok(modified) = metadata.modified() {
                    let last = self.last_modified.read().unwrap();
                    return last.map(|l| modified > l).unwrap_or(true);
                }
            }
        }
        false
    }

    /// Start auto-reload watcher
    pub fn start_watcher(&self) -> Result<(), String> {
        if !self.auto_reload {
            return Err("Auto-reload is not enabled".to_string());
        }

        let config_clone = Arc::clone(&self.config);
        let path_clone = self.config_path.clone();
        let last_modified_clone = Arc::clone(&self.last_modified);
        let interval = self.reload_interval_secs;

        std::thread::spawn(move || loop {
            std::thread::sleep(Duration::from_secs(interval));

            if let Some(path) = &path_clone {
                if let Ok(metadata) = std::fs::metadata(path) {
                    if let Ok(modified) = metadata.modified() {
                        let should_reload = {
                            let last = last_modified_clone.read().unwrap();
                            last.map(|l| modified > l).unwrap_or(true)
                        };

                        if should_reload {
                            match crate::config::load_config(Some(path)) {
                                Ok(new_config) => {
                                    if let Ok(mut config) = config_clone.write() {
                                        *config = new_config;
                                        *last_modified_clone.write().unwrap() = Some(modified);
                                        tracing::info!("Configuration reloaded automatically");
                                    }
                                }
                                Err(e) => {
                                    tracing::error!("Failed to reload configuration: {}", e);
                                }
                            }
                        }
                    }
                }
            }
        });

        Ok(())
    }
}

// ============================================================================
// Hot Reload Manager
// ============================================================================

/// Callback type for configuration changes
type ConfigCallback = Box<dyn Fn(&crate::config::LoggingConfig) + Send + Sync>;

/// Hot reload manager for logging system
pub struct HotReloadManager {
    /// Dynamic configuration
    config: Arc<DynamicConfig>,

    /// Reload callbacks
    callbacks: Arc<RwLock<Vec<ConfigCallback>>>,
}

impl HotReloadManager {
    /// Create a new hot reload manager
    pub fn new(config: Arc<DynamicConfig>) -> Self {
        Self {
            config,
            callbacks: Arc::new(RwLock::new(Vec::new())),
        }
    }

    /// Register a callback for configuration changes
    pub fn on_reload<F>(&self, callback: F) -> Result<(), String>
    where
        F: Fn(&crate::config::LoggingConfig) + Send + Sync + 'static,
    {
        let mut callbacks = self
            .callbacks
            .write()
            .map_err(|_| "Failed to acquire write lock".to_string())?;

        callbacks.push(Box::new(callback));
        Ok(())
    }

    /// Trigger reload
    pub fn reload(&self) -> Result<(), String> {
        // Reload configuration
        self.config.reload()?;

        // Get new configuration
        let new_config = self.config.get()?;

        // Trigger callbacks
        let callbacks = self
            .callbacks
            .read()
            .map_err(|_| "Failed to acquire read lock".to_string())?;

        for callback in callbacks.iter() {
            callback(&new_config);
        }

        Ok(())
    }

    /// Get current configuration
    pub fn get_config(&self) -> Result<crate::config::LoggingConfig, String> {
        self.config.get()
    }
}

// ============================================================================
// Configuration Versioning
// ============================================================================

/// Configuration version for tracking changes
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfigVersion {
    /// Version number
    pub version: u32,

    /// Timestamp
    pub timestamp: String,

    /// Changed by (user/system)
    pub changed_by: String,

    /// Change description
    pub description: String,

    /// Configuration snapshot
    pub config: crate::config::LoggingConfig,
}

impl ConfigVersion {
    /// Create a new configuration version
    pub fn new(
        version: u32,
        changed_by: String,
        description: String,
        config: crate::config::LoggingConfig,
    ) -> Self {
        Self {
            version,
            timestamp: chrono::Utc::now().to_rfc3339(),
            changed_by,
            description,
            config,
        }
    }
}

/// Configuration history manager
pub struct ConfigHistory {
    /// Version history
    versions: Arc<RwLock<Vec<ConfigVersion>>>,

    /// Maximum versions to keep
    max_versions: usize,
}

impl ConfigHistory {
    /// Create a new configuration history manager
    pub fn new(max_versions: usize) -> Self {
        Self {
            versions: Arc::new(RwLock::new(Vec::new())),
            max_versions,
        }
    }

    /// Add a new version
    pub fn add_version(&self, version: ConfigVersion) -> Result<(), String> {
        let mut versions = self
            .versions
            .write()
            .map_err(|_| "Failed to acquire write lock".to_string())?;

        versions.push(version);

        // Keep only max_versions
        if versions.len() > self.max_versions {
            let len = versions.len();
            versions.drain(0..len - self.max_versions);
        }

        Ok(())
    }

    /// Get version by number
    pub fn get_version(&self, version: u32) -> Option<ConfigVersion> {
        let versions = self.versions.read().ok()?;
        versions.iter().find(|v| v.version == version).cloned()
    }

    /// Get latest version
    pub fn get_latest(&self) -> Option<ConfigVersion> {
        let versions = self.versions.read().ok()?;
        versions.last().cloned()
    }

    /// List all versions
    pub fn list_versions(&self) -> Vec<ConfigVersion> {
        let versions = self.versions.read().ok();
        versions.map(|v| v.clone()).unwrap_or_default()
    }

    /// Rollback to previous version
    pub fn rollback(&self, version: u32) -> Result<crate::config::LoggingConfig, String> {
        let config_version = self
            .get_version(version)
            .ok_or_else(|| format!("Version {} not found", version))?;

        Ok(config_version.config)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_dynamic_config() {
        let config = crate::config::LoggingConfig::from_env();
        let dynamic = DynamicConfig::new(config.clone());

        let retrieved = dynamic.get().unwrap();
        assert_eq!(retrieved.level, config.level);
    }

    #[test]
    fn test_config_history() {
        let history = ConfigHistory::new(10);

        let config = crate::config::LoggingConfig::from_env();
        let version =
            ConfigVersion::new(1, "test".to_string(), "Initial version".to_string(), config);

        assert!(history.add_version(version).is_ok());
        assert!(history.get_version(1).is_some());
        assert!(history.get_latest().is_some());
    }
}
