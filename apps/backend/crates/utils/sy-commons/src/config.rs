//! Environment configuration system for Symphony
//!
//! This module provides type-safe configuration management with support for
//! multiple environments and TOML file parsing using Figment.

use std::path::PathBuf;
use figment::{Figment, providers::{Format, Toml, Env}};
use serde::{Deserialize, Serialize};
use crate::error::SymphonyError;
use crate::logging::LoggingConfig;

/// Trait for configuration types
///
/// # Examples
///
/// ```rust
/// use sy_commons::config::Config;
/// use serde::Deserialize;
///
/// #[derive(Deserialize)]
/// struct MyConfig {
///     name: String,
///     port: u16,
/// }
///
/// impl Config for MyConfig {}
///
/// // This would work with proper config files:
/// // let config: MyConfig = MyConfig::load("development").unwrap();
/// ```
pub trait Config: for<'de> Deserialize<'de> + Sized {
    /// Load configuration for the specified environment
    fn load(environment: &str) -> Result<Self, SymphonyError> {
        load_config(environment)
    }
    
    /// Load configuration with custom figment
    fn load_with_figment(figment: Figment) -> Result<Self, SymphonyError> {
        figment.extract().map_err(|e| SymphonyError::Configuration {
            message: format!("Failed to parse configuration: {}", e),
            file: None,
        })
    }
}

/// Load configuration for the specified environment
///
/// # Examples
///
/// ```rust
/// use sy_commons::config::load_config;
/// use serde::Deserialize;
///
/// #[derive(Deserialize)]
/// struct AppConfig {
///     database_url: String,
///     log_level: String,
/// }
///
/// // This would work with proper config files:
/// // let config: AppConfig = load_config("production").unwrap();
/// ```
pub fn load_config<T>(environment: &str) -> Result<T, SymphonyError>
where
    T: for<'de> Deserialize<'de>,
{
    let figment = Figment::new()
        .merge(Toml::file("config/default.toml"))
        .merge(Toml::file(format!("config/{}.toml", environment)))
        .merge(Env::prefixed("SYMPHONY_"));
    
    figment.extract().map_err(|e| SymphonyError::Configuration {
        message: format!("Failed to load {} configuration: {}", environment, e),
        file: Some(PathBuf::from(format!("config/{}.toml", environment))),
    })
}

/// Default configuration structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DefaultConfig {
    /// Logging system configuration
    pub logging: LoggingConfig,
    /// Filesystem operations configuration
    pub filesystem: FilesystemConfig,
    /// Debug and development configuration
    pub debug: DebugConfig,
}

/// Filesystem configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FilesystemConfig {
    /// Temporary directory path (optional, uses system default if None)
    pub temp_dir: Option<PathBuf>,
    /// Maximum file size in bytes for operations
    pub max_file_size: u64,
    /// Whether to use atomic writes for file operations
    pub atomic_writes: bool,
}

/// Debug configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DebugConfig {
    /// Whether duck debugging is enabled
    pub duck_debugging: bool,
    /// Whether performance logging is enabled
    pub performance_logging: bool,
}

impl Config for DefaultConfig {}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    use std::fs;

    #[derive(Debug, Deserialize, PartialEq)]
    struct TestConfig {
        name: String,
        value: i32,
        enabled: bool,
    }

    impl Config for TestConfig {}

    #[test]
    #[serial_test::serial]
    fn test_config_loading_with_defaults() {
        // Clear any existing environment variables that might interfere
        std::env::remove_var("SYMPHONY_NAME");
        std::env::remove_var("SYMPHONY_VALUE");
        std::env::remove_var("SYMPHONY_ENABLED");
        
        let temp_dir = TempDir::new().unwrap();
        let config_dir = temp_dir.path().join("config");
        fs::create_dir_all(&config_dir).unwrap();
        
        // Create default.toml
        let default_toml = r#"
            name = "default"
            value = 42
            enabled = true
        "#;
        fs::write(config_dir.join("default.toml"), default_toml).unwrap();
        
        // Create test.toml with override
        let test_toml = r#"
            name = "test"
            value = 100
        "#;
        fs::write(config_dir.join("test.toml"), test_toml).unwrap();
        
        // Change to temp directory for test
        let original_dir = std::env::current_dir().unwrap();
        std::env::set_current_dir(&temp_dir).unwrap();
        
        // Clear any environment variables that might interfere
        std::env::remove_var("SYMPHONY_NAME");
        std::env::remove_var("SYMPHONY_VALUE");
        std::env::remove_var("SYMPHONY_ENABLED");
        
        let config: TestConfig = load_config("test").unwrap();
        
        assert_eq!(config.name, "test"); // Overridden
        assert_eq!(config.value, 100);   // Overridden
        assert!(config.enabled); // From default
        
        // Restore original directory
        std::env::set_current_dir(original_dir).unwrap();
    }

    #[test]
    #[serial_test::serial]
    fn test_config_loading_with_env_override() {
        // Clear any existing environment variables first
        std::env::remove_var("SYMPHONY_NAME");
        std::env::remove_var("SYMPHONY_VALUE");
        std::env::remove_var("SYMPHONY_ENABLED");
        
        // Set environment variables for this test
        std::env::set_var("SYMPHONY_NAME", "env_override");
        std::env::set_var("SYMPHONY_VALUE", "999");
        
        let temp_dir = TempDir::new().unwrap();
        let config_dir = temp_dir.path().join("config");
        fs::create_dir_all(&config_dir).unwrap();
        
        let default_toml = r#"
            name = "default"
            value = 42
            enabled = true
        "#;
        fs::write(config_dir.join("default.toml"), default_toml).unwrap();
        
        let original_dir = std::env::current_dir().unwrap();
        std::env::set_current_dir(&temp_dir).unwrap();
        
        let config: TestConfig = load_config("default").unwrap();
        
        // Restore original directory first
        std::env::set_current_dir(original_dir).unwrap();
        
        // Clean up environment variables
        std::env::remove_var("SYMPHONY_NAME");
        std::env::remove_var("SYMPHONY_VALUE");
        
        // Now check the results
        assert_eq!(config.name, "env_override"); // From environment
        assert_eq!(config.value, 999);           // From environment
        assert!(config.enabled);        // From file
    }

    #[test]
    #[serial_test::serial]
    fn test_invalid_config_error() {
        // Clear any existing environment variables that might interfere
        std::env::remove_var("SYMPHONY_NAME");
        std::env::remove_var("SYMPHONY_VALUE");
        std::env::remove_var("SYMPHONY_ENABLED");
        
        let temp_dir = TempDir::new().unwrap();
        let config_dir = temp_dir.path().join("config");
        fs::create_dir_all(&config_dir).unwrap();
        
        let invalid_toml = r#"
            name = "test"
            value = [1, 2, 3]  # Array instead of i32
            enabled = "not_a_boolean"  # String instead of bool
        "#;
        fs::write(config_dir.join("default.toml"), invalid_toml).unwrap();
        
        let original_dir = std::env::current_dir().unwrap();
        std::env::set_current_dir(&temp_dir).unwrap();
        
        let result: Result<TestConfig, SymphonyError> = load_config("default");
        
        assert!(result.is_err());
        match result.unwrap_err() {
            SymphonyError::Configuration { message, file } => {
                assert!(message.contains("Failed to load"));
                assert!(file.is_some());
            }
            _ => panic!("Expected Configuration error"),
        }
        
        std::env::set_current_dir(original_dir).unwrap();
    }
}