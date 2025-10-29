//! Configuration: TOML/YAML loading, profiles, validation

use crate::core::LogLevel;
use crate::handlers::RotationPolicy;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

// ============================================================================
// Configuration Structures
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoggingConfig {
    #[serde(default = "default_level")]
    pub level: String,
    #[serde(default = "default_format")]
    pub format: String,
    #[serde(default)]
    pub console: ConsoleConfig,
    pub file: Option<FileConfig>,
    pub rotation: Option<RotationConfig>,
    #[serde(default)]
    pub performance: PerformanceConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConsoleConfig {
    #[serde(default = "default_true")]
    pub enabled: bool,
    #[serde(default = "default_true")]
    pub colored: bool,
    #[serde(default = "default_true")]
    pub timestamps: bool,
    #[serde(default)]
    pub targets: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileConfig {
    #[serde(default = "default_true")]
    pub enabled: bool,
    pub path: String,
    #[serde(default = "default_true")]
    pub json: bool,
    #[serde(default = "default_buffer_size")]
    pub buffer_size: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RotationConfig {
    #[serde(default = "default_rotation")]
    pub policy: String,
    #[serde(default = "default_max_files")]
    pub max_files: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceConfig {
    #[serde(default = "default_async_buffer")]
    pub async_buffer_size: usize,
    #[serde(default = "default_flush_interval")]
    pub flush_interval_ms: u64,
}

// Defaults
fn default_level() -> String {
    "info".to_string()
}
fn default_format() -> String {
    "console".to_string()
}
fn default_true() -> bool {
    true
}
fn default_buffer_size() -> usize {
    8192
}
fn default_rotation() -> String {
    "daily".to_string()
}
fn default_max_files() -> usize {
    7
}
fn default_async_buffer() -> usize {
    8192
}
fn default_flush_interval() -> u64 {
    100
}

impl Default for ConsoleConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            colored: true,
            timestamps: true,
            targets: false,
        }
    }
}

impl Default for PerformanceConfig {
    fn default() -> Self {
        Self {
            async_buffer_size: 8192,
            flush_interval_ms: 100,
        }
    }
}

impl LoggingConfig {
    pub fn from_toml_file<P: AsRef<Path>>(path: P) -> Result<Self, String> {
        let content =
            fs::read_to_string(path).map_err(|e| format!("Failed to read config file: {}", e))?;
        toml::from_str(&content).map_err(|e| format!("Failed to parse TOML: {}", e))
    }

    pub fn from_yaml_file<P: AsRef<Path>>(path: P) -> Result<Self, String> {
        let content =
            fs::read_to_string(path).map_err(|e| format!("Failed to read config file: {}", e))?;
        serde_yaml::from_str(&content).map_err(|e| format!("Failed to parse YAML: {}", e))
    }

    pub fn from_env() -> Self {
        let _ = dotenvy::dotenv();
        Self {
            level: std::env::var("SYMPHONY_LOG_LEVEL").unwrap_or_else(|_| "info".to_string()),
            format: std::env::var("SYMPHONY_LOG_FORMAT").unwrap_or_else(|_| "console".to_string()),
            console: ConsoleConfig::default(),
            file: std::env::var("SYMPHONY_LOG_FILE")
                .ok()
                .map(|path| FileConfig {
                    enabled: true,
                    path,
                    json: true,
                    buffer_size: 8192,
                }),
            rotation: None,
            performance: PerformanceConfig::default(),
        }
    }

    pub fn get_rotation_policy(&self) -> Result<RotationPolicy, String> {
        if let Some(rotation) = &self.rotation {
            RotationPolicy::from_str(&rotation.policy)
        } else {
            Ok(RotationPolicy::Never)
        }
    }
}

pub fn load_config<P: AsRef<Path>>(path: Option<P>) -> Result<LoggingConfig, String> {
    if let Some(config_path) = path {
        let path_ref = config_path.as_ref();
        if let Some(ext) = path_ref.extension() {
            match ext.to_str() {
                Some("toml") => LoggingConfig::from_toml_file(path_ref),
                Some("yaml") | Some("yml") => LoggingConfig::from_yaml_file(path_ref),
                _ => Err("Unsupported config file format. Use .toml or .yaml".to_string()),
            }
        } else {
            Err("Config file has no extension".to_string())
        }
    } else {
        Ok(LoggingConfig::from_env())
    }
}

// ============================================================================
// Profiles
// ============================================================================

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Profile {
    Development,
    Staging,
    Production,
}

impl Profile {
    #[allow(clippy::should_implement_trait)]
    pub fn from_str(s: &str) -> Result<Self, String> {
        match s.to_lowercase().as_str() {
            "development" | "dev" => Ok(Profile::Development),
            "staging" | "stage" => Ok(Profile::Staging),
            "production" | "prod" => Ok(Profile::Production),
            _ => Err(format!("Invalid profile: {}", s)),
        }
    }

    pub fn from_env() -> Self {
        std::env::var("SYMPHONY_ENV")
            .ok()
            .and_then(|s| Self::from_str(&s).ok())
            .unwrap_or(Profile::Development)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileConfig {
    pub development: LoggingConfig,
    pub staging: LoggingConfig,
    pub production: LoggingConfig,
}

impl ProfileConfig {
    pub fn get(&self, profile: Profile) -> &LoggingConfig {
        match profile {
            Profile::Development => &self.development,
            Profile::Staging => &self.staging,
            Profile::Production => &self.production,
        }
    }

    pub fn current(&self) -> &LoggingConfig {
        self.get(Profile::from_env())
    }

    pub fn default_profiles() -> Self {
        Self {
            development: LoggingConfig {
                level: "debug".to_string(),
                format: "console".to_string(),
                console: ConsoleConfig {
                    enabled: true,
                    colored: true,
                    timestamps: true,
                    targets: true,
                },
                file: None,
                rotation: None,
                performance: PerformanceConfig {
                    async_buffer_size: 4096,
                    flush_interval_ms: 50,
                },
            },
            staging: LoggingConfig {
                level: "info".to_string(),
                format: "json".to_string(),
                console: ConsoleConfig {
                    enabled: true,
                    colored: true,
                    timestamps: true,
                    targets: false,
                },
                file: Some(FileConfig {
                    enabled: true,
                    path: "logs/symphony-staging.log".to_string(),
                    json: true,
                    buffer_size: 8192,
                }),
                rotation: Some(RotationConfig {
                    policy: "daily".to_string(),
                    max_files: 7,
                }),
                performance: PerformanceConfig {
                    async_buffer_size: 8192,
                    flush_interval_ms: 100,
                },
            },
            production: LoggingConfig {
                level: "info".to_string(),
                format: "json".to_string(),
                console: ConsoleConfig {
                    enabled: false,
                    colored: false,
                    timestamps: true,
                    targets: false,
                },
                file: Some(FileConfig {
                    enabled: true,
                    path: "logs/symphony-production.log".to_string(),
                    json: true,
                    buffer_size: 16384,
                }),
                rotation: Some(RotationConfig {
                    policy: "daily".to_string(),
                    max_files: 30,
                }),
                performance: PerformanceConfig {
                    async_buffer_size: 16384,
                    flush_interval_ms: 200,
                },
            },
        }
    }
}

// ============================================================================
// Validation
// ============================================================================

pub struct ConfigValidator;

impl ConfigValidator {
    pub fn validate(config: &LoggingConfig) -> Result<(), Vec<String>> {
        let mut errors = Vec::new();

        if let Err(e) = LogLevel::from_str(&config.level) {
            errors.push(format!("Invalid log level: {}", e));
        }

        match config.format.as_str() {
            "console" | "json" => {}
            _ => errors.push(format!(
                "Invalid format '{}'. Must be 'console' or 'json'",
                config.format
            )),
        }

        if let Some(file_cfg) = &config.file {
            if file_cfg.enabled && file_cfg.path.is_empty() {
                errors.push("File path cannot be empty when file logging is enabled".to_string());
            }
            if file_cfg.buffer_size == 0 {
                errors.push("Buffer size must be greater than 0".to_string());
            }
            if file_cfg.buffer_size > 1024 * 1024 * 10 {
                errors.push("Buffer size should not exceed 10MB".to_string());
            }
        }

        if let Some(rotation_cfg) = &config.rotation {
            if let Err(e) = RotationPolicy::from_str(&rotation_cfg.policy) {
                errors.push(format!("Invalid rotation policy: {}", e));
            }
            if rotation_cfg.max_files == 0 {
                errors.push("max_files must be greater than 0".to_string());
            }
            if rotation_cfg.max_files > 365 {
                errors.push("max_files should not exceed 365 (1 year)".to_string());
            }
        }

        if config.performance.async_buffer_size == 0 {
            errors.push("async_buffer_size must be greater than 0".to_string());
        }
        if config.performance.flush_interval_ms == 0 {
            errors.push("flush_interval_ms must be greater than 0".to_string());
        }
        if config.performance.flush_interval_ms > 10000 {
            errors.push("flush_interval_ms should not exceed 10000ms (10 seconds)".to_string());
        }

        let console_enabled = config.console.enabled;
        let file_enabled = config.file.as_ref().map(|f| f.enabled).unwrap_or(false);
        if !console_enabled && !file_enabled {
            errors.push("At least one output (console or file) must be enabled".to_string());
        }

        if errors.is_empty() {
            Ok(())
        } else {
            Err(errors)
        }
    }

    pub fn validate_with_message(config: &LoggingConfig) -> Result<(), String> {
        Self::validate(config).map_err(|errors| {
            let mut msg = String::from("Configuration validation failed:\n");
            for (i, error) in errors.iter().enumerate() {
                msg.push_str(&format!("  {}. {}\n", i + 1, error));
            }
            msg
        })
    }
}

// Legacy compatibility
#[derive(Debug)]
pub struct LogConfig {
    pub level: String,
    pub format: String,
    pub file: Option<String>,
}

impl LogConfig {
    pub fn from_env() -> Self {
        let _ = dotenvy::dotenv();
        Self {
            level: std::env::var("SYMPHONY_LOG_LEVEL").unwrap_or_else(|_| "info".to_string()),
            format: std::env::var("SYMPHONY_LOG_FORMAT").unwrap_or_else(|_| "console".to_string()),
            file: std::env::var("SYMPHONY_LOG_FILE").ok(),
        }
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = LoggingConfig::from_env();
        assert_eq!(config.level, "info");
        assert_eq!(config.format, "console");
    }

    #[test]
    fn test_toml_parsing() {
        let toml_str = r#"
            level = "debug"
            format = "json"
            [console]
            enabled = true
            colored = true
        "#;
        let config: LoggingConfig = toml::from_str(toml_str).unwrap();
        assert_eq!(config.level, "debug");
        assert!(config.console.enabled);
    }

    #[test]
    fn test_profile_parsing() {
        assert_eq!(
            Profile::from_str("development").unwrap(),
            Profile::Development
        );
        assert_eq!(Profile::from_str("dev").unwrap(), Profile::Development);
        assert_eq!(
            Profile::from_str("PRODUCTION").unwrap(),
            Profile::Production
        );
    }

    #[test]
    fn test_profile_configs() {
        let profiles = ProfileConfig::default_profiles();
        assert_eq!(profiles.development.level, "debug");
        assert!(profiles.development.console.enabled);
        assert_eq!(profiles.production.level, "info");
        assert!(!profiles.production.console.enabled);
        assert!(profiles.production.file.is_some());
    }

    #[test]
    fn test_valid_config() {
        let config = LoggingConfig {
            level: "info".to_string(),
            format: "console".to_string(),
            console: ConsoleConfig::default(),
            file: None,
            rotation: None,
            performance: Default::default(),
        };
        assert!(ConfigValidator::validate(&config).is_ok());
    }

    #[test]
    fn test_invalid_level() {
        let config = LoggingConfig {
            level: "invalid".to_string(),
            format: "console".to_string(),
            console: ConsoleConfig::default(),
            file: None,
            rotation: None,
            performance: Default::default(),
        };
        assert!(ConfigValidator::validate(&config).is_err());
    }

    #[test]
    fn test_no_outputs() {
        let mut config = LoggingConfig {
            level: "info".to_string(),
            format: "console".to_string(),
            console: ConsoleConfig::default(),
            file: None,
            rotation: None,
            performance: Default::default(),
        };
        config.console.enabled = false;
        let result = ConfigValidator::validate(&config);
        assert!(result.is_err());
        let errors = result.unwrap_err();
        assert!(errors.iter().any(|e| e.contains("At least one output")));
    }
}
