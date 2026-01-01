//! Configuration for XI-editor adapter
//!
//! Provides configuration structures for XI-editor process management,
//! communication settings, and performance tuning.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::time::Duration;

/// Configuration for XI-editor adapter
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct XiEditorConfig {
    /// Path to XI-editor binary
    pub xi_editor_path: PathBuf,
    
    /// Command line arguments for XI-editor
    pub args: Vec<String>,
    
    /// Working directory for XI-editor process
    pub working_directory: Option<PathBuf>,
    
    /// Environment variables for XI-editor process
    pub environment: HashMap<String, String>,
    
    /// Maximum number of automatic restarts
    pub max_restarts: usize,
    
    /// Timeout for XI-editor startup
    pub startup_timeout: Duration,
    
    /// Timeout for JSON-RPC requests
    pub request_timeout: Duration,
    
    /// Health check interval
    pub health_check_interval: Duration,
    
    /// Buffer cache configuration
    pub buffer_cache: BufferCacheConfig,
    
    /// File watching configuration
    pub file_watching: FileWatchingConfig,
}

impl Default for XiEditorConfig {
    fn default() -> Self {
        Self {
            xi_editor_path: PathBuf::from("xi-core"),
            args: vec!["--rpc".to_string()],
            working_directory: None,
            environment: HashMap::new(),
            max_restarts: 5,
            startup_timeout: Duration::from_secs(10),
            request_timeout: Duration::from_millis(1000), // 1s timeout, targeting <1ms
            health_check_interval: Duration::from_secs(5),
            buffer_cache: BufferCacheConfig::default(),
            file_watching: FileWatchingConfig::default(),
        }
    }
}

/// Configuration for buffer metadata cache
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BufferCacheConfig {
    /// Maximum number of buffers to cache
    pub max_entries: usize,
    
    /// Time-to-live for cache entries
    pub ttl: Duration,
    
    /// Enable LRU eviction
    pub enable_lru: bool,
}

impl Default for BufferCacheConfig {
    fn default() -> Self {
        Self {
            max_entries: 1000,
            ttl: Duration::from_secs(3600), // 1 hour
            enable_lru: true,
        }
    }
}

/// Configuration for file system watching
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileWatchingConfig {
    /// Enable file system watching
    pub enabled: bool,
    
    /// Debounce delay for file change events
    pub debounce_delay: Duration,
    
    /// Paths to watch (empty means watch all open files)
    pub watch_paths: Vec<PathBuf>,
    
    /// File patterns to ignore
    pub ignore_patterns: Vec<String>,
}

impl Default for FileWatchingConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            debounce_delay: Duration::from_millis(100),
            watch_paths: Vec::new(),
            ignore_patterns: vec![
                "*.tmp".to_string(),
                "*.swp".to_string(),
                "*.bak".to_string(),
                ".git/*".to_string(),
                "node_modules/*".to_string(),
                "target/*".to_string(),
            ],
        }
    }
}

impl XiEditorConfig {
    /// Create a new configuration with custom XI-editor path
    pub fn with_xi_editor_path<P: Into<PathBuf>>(mut self, path: P) -> Self {
        self.xi_editor_path = path.into();
        self
    }
    
    /// Set working directory
    pub fn with_working_directory<P: Into<PathBuf>>(mut self, dir: P) -> Self {
        self.working_directory = Some(dir.into());
        self
    }
    
    /// Add command line argument
    pub fn with_arg<S: Into<String>>(mut self, arg: S) -> Self {
        self.args.push(arg.into());
        self
    }
    
    /// Add environment variable
    pub fn with_env<K: Into<String>, V: Into<String>>(mut self, key: K, value: V) -> Self {
        self.environment.insert(key.into(), value.into());
        self
    }
    
    /// Set request timeout
    pub fn with_request_timeout(mut self, timeout: Duration) -> Self {
        self.request_timeout = timeout;
        self
    }
    
    /// Set maximum restarts
    pub fn with_max_restarts(mut self, max_restarts: usize) -> Self {
        self.max_restarts = max_restarts;
        self
    }
    
    /// Validate configuration
    pub fn validate(&self) -> Result<(), crate::error::XiAdapterError> {
        // Check XI-editor binary exists
        if !self.xi_editor_path.exists() {
            return Err(crate::error::XiAdapterError::configuration(
                format!("XI-editor binary not found: {}", self.xi_editor_path.display())
            ));
        }
        
        // Check working directory exists if specified
        if let Some(ref dir) = self.working_directory {
            if !dir.exists() {
                return Err(crate::error::XiAdapterError::configuration(
                    format!("Working directory not found: {}", dir.display())
                ));
            }
        }
        
        // Validate timeouts
        if self.startup_timeout.as_millis() == 0 {
            return Err(crate::error::XiAdapterError::configuration(
                "Startup timeout must be greater than 0"
            ));
        }
        
        if self.request_timeout.as_millis() == 0 {
            return Err(crate::error::XiAdapterError::configuration(
                "Request timeout must be greater than 0"
            ));
        }
        
        // Validate cache configuration
        if self.buffer_cache.max_entries == 0 {
            return Err(crate::error::XiAdapterError::configuration(
                "Buffer cache max_entries must be greater than 0"
            ));
        }
        
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = XiEditorConfig::default();
        
        assert_eq!(config.xi_editor_path, PathBuf::from("xi-core"));
        assert_eq!(config.args, vec!["--rpc"]);
        assert_eq!(config.max_restarts, 5);
        assert_eq!(config.startup_timeout, Duration::from_secs(10));
        assert_eq!(config.request_timeout, Duration::from_millis(1000));
    }
    
    #[test]
    fn test_config_builder() {
        let config = XiEditorConfig::default()
            .with_xi_editor_path("/usr/bin/xi-core")
            .with_working_directory("/tmp")
            .with_arg("--verbose")
            .with_env("XI_LOG", "debug")
            .with_request_timeout(Duration::from_millis(500))
            .with_max_restarts(3);
        
        assert_eq!(config.xi_editor_path, PathBuf::from("/usr/bin/xi-core"));
        assert_eq!(config.working_directory, Some(PathBuf::from("/tmp")));
        assert!(config.args.contains(&"--verbose".to_string()));
        assert_eq!(config.environment.get("XI_LOG"), Some(&"debug".to_string()));
        assert_eq!(config.request_timeout, Duration::from_millis(500));
        assert_eq!(config.max_restarts, 3);
    }
    
    #[test]
    fn test_buffer_cache_config_default() {
        let config = BufferCacheConfig::default();
        
        assert_eq!(config.max_entries, 1000);
        assert_eq!(config.ttl, Duration::from_secs(3600));
        assert!(config.enable_lru);
    }
    
    #[test]
    fn test_file_watching_config_default() {
        let config = FileWatchingConfig::default();
        
        assert!(config.enabled);
        assert_eq!(config.debounce_delay, Duration::from_millis(100));
        assert!(config.watch_paths.is_empty());
        assert!(!config.ignore_patterns.is_empty());
        assert!(config.ignore_patterns.contains(&"*.tmp".to_string()));
    }
    
    #[test]
    fn test_config_validation_invalid_binary() {
        let config = XiEditorConfig::default()
            .with_xi_editor_path("/non/existent/binary");
        
        let result = config.validate();
        assert!(result.is_err());
        
        if let Err(err) = result {
            assert!(matches!(err, crate::error::XiAdapterError::Configuration { .. }));
        }
    }
    
    #[test]
    fn test_config_validation_zero_timeout() {
        let mut config = XiEditorConfig::default();
        config.startup_timeout = Duration::from_millis(0);
        
        let result = config.validate();
        assert!(result.is_err());
    }
    
    #[test]
    fn test_config_validation_zero_cache_entries() {
        let mut config = XiEditorConfig::default();
        config.buffer_cache.max_entries = 0;
        
        let result = config.validate();
        assert!(result.is_err());
    }
}