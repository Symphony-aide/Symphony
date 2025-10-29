//! Production-grade log handlers
//!
//! Provides handlers for console, file with rotation, and multiple outputs.

use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use tracing_appender::non_blocking::WorkerGuard;
use tracing_subscriber::fmt;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::EnvFilter;

// ============================================================================
// Console Handler
// ============================================================================

/// Console handler configuration
#[derive(Debug, Clone)]
pub struct ConsoleHandler {
    /// Whether to use colored output
    pub colored: bool,
    /// Whether to show timestamps
    pub show_timestamps: bool,
    /// Whether to show targets
    pub show_targets: bool,
}

impl ConsoleHandler {
    /// Create a new console handler with default settings
    pub fn new() -> Self {
        Self {
            colored: true,
            show_timestamps: true,
            show_targets: false,
        }
    }

    /// Builder pattern: set colored output
    pub fn with_colors(mut self, colored: bool) -> Self {
        self.colored = colored;
        self
    }

    /// Builder pattern: set timestamp display
    pub fn with_timestamps(mut self, show: bool) -> Self {
        self.show_timestamps = show;
        self
    }

    /// Builder pattern: set target display
    pub fn with_targets(mut self, show: bool) -> Self {
        self.show_targets = show;
        self
    }

    /// Setup console logging with this handler
    pub fn setup(&self, env_filter: EnvFilter) {
        let fmt_layer = fmt::layer().with_target(self.show_targets).pretty();

        tracing_subscriber::registry()
            .with(env_filter)
            .with(fmt_layer)
            .init();
    }
}

impl Default for ConsoleHandler {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// Rotation Policy
// ============================================================================

/// Log rotation policy
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum RotationPolicy {
    /// Never rotate (single file)
    Never,
    /// Rotate daily at midnight
    #[default]
    Daily,
    /// Rotate hourly
    Hourly,
    /// Rotate when file reaches size (in bytes)
    Size(u64),
    /// Rotate daily AND when size is reached
    DailyAndSize(u64),
}

impl RotationPolicy {
    /// Convert to tracing_appender rotation
    pub fn to_tracing_rotation(&self) -> tracing_appender::rolling::Rotation {
        match self {
            RotationPolicy::Never => tracing_appender::rolling::Rotation::NEVER,
            RotationPolicy::Daily => tracing_appender::rolling::Rotation::DAILY,
            RotationPolicy::Hourly => tracing_appender::rolling::Rotation::HOURLY,
            RotationPolicy::Size(_) => tracing_appender::rolling::Rotation::NEVER,
            RotationPolicy::DailyAndSize(_) => tracing_appender::rolling::Rotation::DAILY,
        }
    }

    /// Parse rotation policy from string
    #[allow(clippy::should_implement_trait)]
    pub fn from_str(s: &str) -> Result<Self, String> {
        match s.to_lowercase().as_str() {
            "never" => Ok(RotationPolicy::Never),
            "daily" => Ok(RotationPolicy::Daily),
            "hourly" => Ok(RotationPolicy::Hourly),
            _ if s.starts_with("size:") => {
                let size_str = s.strip_prefix("size:").unwrap();
                let size = Self::parse_size(size_str)?;
                Ok(RotationPolicy::Size(size))
            }
            _ => Err(format!("Invalid rotation policy: {}", s)),
        }
    }

    /// Parse size string (e.g., "10MB", "1GB")
    fn parse_size(s: &str) -> Result<u64, String> {
        let s = s.trim().to_uppercase();

        if let Some(num) = s.strip_suffix("GB") {
            let n: u64 = num
                .trim()
                .parse()
                .map_err(|_| format!("Invalid size: {}", s))?;
            Ok(n * 1024 * 1024 * 1024)
        } else if let Some(num) = s.strip_suffix("MB") {
            let n: u64 = num
                .trim()
                .parse()
                .map_err(|_| format!("Invalid size: {}", s))?;
            Ok(n * 1024 * 1024)
        } else if let Some(num) = s.strip_suffix("KB") {
            let n: u64 = num
                .trim()
                .parse()
                .map_err(|_| format!("Invalid size: {}", s))?;
            Ok(n * 1024)
        } else {
            s.parse().map_err(|_| format!("Invalid size: {}", s))
        }
    }
}

/// Rotation handler configuration
#[derive(Debug, Clone)]
pub struct RotationHandler {
    /// Directory for log files
    pub directory: PathBuf,
    /// Base filename
    pub filename: String,
    /// Rotation policy
    pub policy: RotationPolicy,
    /// Maximum number of archived files to keep
    pub max_files: Option<usize>,
}

impl RotationHandler {
    /// Create a new rotation handler
    pub fn new(directory: PathBuf, filename: String) -> Self {
        Self {
            directory,
            filename,
            policy: RotationPolicy::Daily,
            max_files: Some(7),
        }
    }

    /// Set rotation policy
    pub fn with_policy(mut self, policy: RotationPolicy) -> Self {
        self.policy = policy;
        self
    }

    /// Set maximum archived files
    pub fn with_max_files(mut self, max: usize) -> Self {
        self.max_files = Some(max);
        self
    }

    /// Disable file limit
    pub fn unlimited_files(mut self) -> Self {
        self.max_files = None;
        self
    }
}

// ============================================================================
// File Handler
// ============================================================================

/// File handler configuration
#[derive(Debug, Clone)]
pub struct FileHandler {
    /// File path
    pub path: String,
    /// Whether to use JSON format
    pub json_format: bool,
    /// Buffer size (in bytes)
    pub buffer_size: Option<usize>,
}

impl FileHandler {
    /// Create a new file handler
    pub fn new(path: String) -> Self {
        Self {
            path,
            json_format: true,
            buffer_size: Some(8192),
        }
    }

    /// Set JSON format
    pub fn with_json(mut self, json: bool) -> Self {
        self.json_format = json;
        self
    }

    /// Set buffer size
    pub fn with_buffer_size(mut self, size: usize) -> Self {
        self.buffer_size = Some(size);
        self
    }

    /// Disable buffering
    pub fn unbuffered(mut self) -> Self {
        self.buffer_size = None;
        self
    }

    /// Setup file logging with this handler
    pub fn setup(&self, env_filter: EnvFilter) -> Result<WorkerGuard, String> {
        let path = Path::new(&self.path);

        let directory = path
            .parent()
            .ok_or_else(|| "Invalid file path".to_string())?;
        let filename = path
            .file_name()
            .and_then(|n| n.to_str())
            .ok_or_else(|| "Invalid filename".to_string())?;

        let file_appender = tracing_appender::rolling::never(directory, filename);
        let (non_blocking, guard) = tracing_appender::non_blocking(file_appender);

        if self.json_format {
            tracing_subscriber::registry()
                .with(env_filter)
                .with(fmt::layer().json().with_writer(non_blocking))
                .init();
        } else {
            tracing_subscriber::registry()
                .with(env_filter)
                .with(fmt::layer().with_writer(non_blocking))
                .init();
        }

        Ok(guard)
    }

    /// Setup file logging with rotation
    pub fn setup_with_rotation(
        &self,
        env_filter: EnvFilter,
        rotation: &RotationHandler,
    ) -> Result<WorkerGuard, String> {
        let rotation_policy = rotation.policy.to_tracing_rotation();

        let file_appender = tracing_appender::rolling::RollingFileAppender::new(
            rotation_policy,
            &rotation.directory,
            &rotation.filename,
        );

        let (non_blocking, guard) = tracing_appender::non_blocking(file_appender);

        if self.json_format {
            tracing_subscriber::registry()
                .with(env_filter)
                .with(fmt::layer().json().with_writer(non_blocking))
                .init();
        } else {
            tracing_subscriber::registry()
                .with(env_filter)
                .with(fmt::layer().with_writer(non_blocking))
                .init();
        }

        Ok(guard)
    }
}

// ============================================================================
// Multi-Output Handler
// ============================================================================

/// Multi-output handler configuration
#[derive(Debug)]
pub struct MultiHandler {
    /// Console handler (optional)
    pub console: Option<ConsoleHandler>,
    /// File handler (optional)
    pub file: Option<FileHandler>,
    /// Rotation handler (optional)
    pub rotation: Option<RotationHandler>,
}

impl MultiHandler {
    /// Create a new multi-handler
    pub fn new() -> Self {
        Self {
            console: None,
            file: None,
            rotation: None,
        }
    }

    /// Add console output
    pub fn with_console(mut self, handler: ConsoleHandler) -> Self {
        self.console = Some(handler);
        self
    }

    /// Add file output
    pub fn with_file(mut self, handler: FileHandler) -> Self {
        self.file = Some(handler);
        self
    }

    /// Add rotation
    pub fn with_rotation(mut self, handler: RotationHandler) -> Self {
        self.rotation = Some(handler);
        self
    }

    /// Setup multi-output logging
    pub fn setup(&self, env_filter: EnvFilter) -> Result<Option<WorkerGuard>, String> {
        match (&self.console, &self.file, &self.rotation) {
            (Some(console_cfg), Some(file_cfg), Some(rotation_cfg)) => {
                let rotation_policy = rotation_cfg.policy.to_tracing_rotation();
                let file_appender = tracing_appender::rolling::RollingFileAppender::new(
                    rotation_policy,
                    &rotation_cfg.directory,
                    &rotation_cfg.filename,
                );
                let (non_blocking, guard) = tracing_appender::non_blocking(file_appender);

                let console_layer = fmt::layer()
                    .with_target(console_cfg.show_targets)
                    .pretty()
                    .with_writer(std::io::stdout);

                if file_cfg.json_format {
                    tracing_subscriber::registry()
                        .with(env_filter)
                        .with(console_layer)
                        .with(fmt::layer().json().with_writer(non_blocking))
                        .init();
                } else {
                    tracing_subscriber::registry()
                        .with(env_filter)
                        .with(console_layer)
                        .with(fmt::layer().with_writer(non_blocking))
                        .init();
                }

                Ok(Some(guard))
            }

            (Some(console_cfg), Some(file_cfg), None) => {
                let path = std::path::Path::new(&file_cfg.path);
                let directory = path
                    .parent()
                    .ok_or_else(|| "Invalid file path".to_string())?;
                let filename = path
                    .file_name()
                    .and_then(|n| n.to_str())
                    .ok_or_else(|| "Invalid filename".to_string())?;

                let file_appender = tracing_appender::rolling::never(directory, filename);
                let (non_blocking, guard) = tracing_appender::non_blocking(file_appender);

                let console_layer = fmt::layer()
                    .with_target(console_cfg.show_targets)
                    .pretty()
                    .with_writer(std::io::stdout);

                if file_cfg.json_format {
                    tracing_subscriber::registry()
                        .with(env_filter)
                        .with(console_layer)
                        .with(fmt::layer().json().with_writer(non_blocking))
                        .init();
                } else {
                    tracing_subscriber::registry()
                        .with(env_filter)
                        .with(console_layer)
                        .with(fmt::layer().with_writer(non_blocking))
                        .init();
                }

                Ok(Some(guard))
            }

            (Some(console_cfg), None, None) => {
                console_cfg.setup(env_filter);
                Ok(None)
            }

            (None, Some(file_cfg), rotation_opt) => {
                if let Some(rotation_cfg) = rotation_opt {
                    let guard = file_cfg.setup_with_rotation(env_filter, rotation_cfg)?;
                    Ok(Some(guard))
                } else {
                    let guard = file_cfg.setup(env_filter)?;
                    Ok(Some(guard))
                }
            }

            _ => Err("No handlers configured".to_string()),
        }
    }
}

impl Default for MultiHandler {
    fn default() -> Self {
        Self::new()
    }
}
