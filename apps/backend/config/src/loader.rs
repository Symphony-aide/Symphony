//! Configuration file loader

use crate::SymphonyConfig;
use std::path::{Path, PathBuf};
use sytypes::{SymphonyError, SymphonyResult};
use tokio::fs;

/// Configuration file format
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ConfigFormat {
    /// TOML format
    Toml,
    /// JSON format
    Json,
    /// YAML format
    Yaml,
}

impl ConfigFormat {
    /// Detect format from file extension
    pub fn from_path(path: &Path) -> SymphonyResult<Self> {
        let extension = path
            .extension()
            .and_then(|e| e.to_str())
            .ok_or_else(|| SymphonyError::Config("No file extension".to_string()))?;

        match extension.to_lowercase().as_str() {
            "toml" => Ok(ConfigFormat::Toml),
            "json" => Ok(ConfigFormat::Json),
            "yaml" | "yml" => Ok(ConfigFormat::Yaml),
            _ => Err(SymphonyError::Config(format!(
                "Unsupported config format: {}",
                extension
            ))),
        }
    }
}

/// Configuration loader
pub struct ConfigLoader;

impl ConfigLoader {
    /// Create a new config loader
    pub fn new() -> Self {
        Self
    }

    /// Load configuration from file
    pub async fn load(&self, path: PathBuf) -> SymphonyResult<SymphonyConfig> {
        tracing::info!("Loading configuration from {:?}", path);

        let content = fs::read_to_string(&path)
            .await
            .map_err(|e| SymphonyError::Config(format!("Failed to read config file: {}", e)))?;

        let format = ConfigFormat::from_path(&path)?;
        self.parse(&content, format)
    }

    /// Parse configuration from string
    pub fn parse(&self, content: &str, format: ConfigFormat) -> SymphonyResult<SymphonyConfig> {
        match format {
            ConfigFormat::Toml => toml::from_str(content)
                .map_err(|e| SymphonyError::Config(format!("TOML parse error: {}", e))),
            ConfigFormat::Json => serde_json::from_str(content)
                .map_err(|e| SymphonyError::Config(format!("JSON parse error: {}", e))),
            ConfigFormat::Yaml => serde_yaml::from_str(content)
                .map_err(|e| SymphonyError::Config(format!("YAML parse error: {}", e))),
        }
    }

    /// Save configuration to file
    pub async fn save(&self, config: &SymphonyConfig, path: PathBuf) -> SymphonyResult<()> {
        tracing::info!("Saving configuration to {:?}", path);

        let format = ConfigFormat::from_path(&path)?;
        let content = self.serialize(config, format)?;

        // Create parent directory if it doesn't exist
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)
                .await
                .map_err(|e| SymphonyError::Config(format!("Failed to create directory: {}", e)))?;
        }

        fs::write(&path, content)
            .await
            .map_err(|e| SymphonyError::Config(format!("Failed to write config file: {}", e)))?;

        Ok(())
    }

    /// Serialize configuration to string
    pub fn serialize(&self, config: &SymphonyConfig, format: ConfigFormat) -> SymphonyResult<String> {
        match format {
            ConfigFormat::Toml => toml::to_string_pretty(config)
                .map_err(|e| SymphonyError::Config(format!("TOML serialize error: {}", e))),
            ConfigFormat::Json => serde_json::to_string_pretty(config)
                .map_err(|e| SymphonyError::Config(format!("JSON serialize error: {}", e))),
            ConfigFormat::Yaml => serde_yaml::to_string(config)
                .map_err(|e| SymphonyError::Config(format!("YAML serialize error: {}", e))),
        }
    }
}

impl Default for ConfigLoader {
    fn default() -> Self {
        Self::new()
    }
}
