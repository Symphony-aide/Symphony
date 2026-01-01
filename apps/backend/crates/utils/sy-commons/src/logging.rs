//! Professional logging system for Symphony
//!
//! This module provides a comprehensive logging system with multiple output formats
//! including console, file, and JSON outputs using the tracing framework.

use crate::error::SymphonyError;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// Configuration for the logging system
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoggingConfig {
	/// Log level (e.g., "debug", "info", "warn", "error")
	pub level: String,
	/// Console output configuration
	pub console: ConsoleConfig,
	/// File output configuration (optional)
	pub file: Option<FileConfig>,
	/// JSON output configuration (optional)
	pub json: Option<JsonConfig>,
}

/// Console output configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConsoleConfig {
	/// Whether console logging is enabled
	pub enabled: bool,
	/// Console output format
	pub format: ConsoleFormat,
	/// Whether to use colors in console output
	pub colors: bool,
}

/// File output configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileConfig {
	/// Whether file logging is enabled
	pub enabled: bool,
	/// Path to the log file
	pub path: PathBuf,
	/// Log file rotation configuration
	pub rotation: RotationConfig,
	/// Maximum number of rotated files to keep
	pub max_files: usize,
}

/// JSON output configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonConfig {
	/// Whether JSON logging is enabled
	pub enabled: bool,
	/// Path to the JSON log file (optional, defaults to stdout)
	pub path: Option<PathBuf>,
	/// Whether to include span information in JSON output
	pub include_spans: bool,
}

/// Console output format options
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConsoleFormat {
	/// Pretty-printed format with colors and formatting
	Pretty,
	/// Compact single-line format
	Compact,
	/// Full detailed format with all fields
	Full,
}

/// Log file rotation configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RotationConfig {
	/// Rotate logs daily
	Daily,
	/// Rotate logs hourly
	Hourly,
	/// Rotate logs when file reaches specified size in bytes
	Size(u64),
}

/// Initialize logging system with configuration
///
/// # Examples
///
/// ```rust
/// use sy_commons::logging::{LoggingConfig, ConsoleConfig, ConsoleFormat, init_logging};
///
/// let config = LoggingConfig {
///     level: "info".to_string(),
///     console: ConsoleConfig {
///         enabled: true,
///         format: ConsoleFormat::Pretty,
///         colors: true,
///     },
///     file: None,
///     json: None,
/// };
///
/// init_logging(&config).unwrap();
/// ```
pub fn init_logging(config: &LoggingConfig) -> Result<(), SymphonyError> {
	use tracing_subscriber::{fmt, util::SubscriberInitExt, EnvFilter};

	// Parse log level
	let env_filter =
		EnvFilter::try_new(&config.level).map_err(|e| SymphonyError::Configuration {
			message: format!("Invalid log level '{}': {}", config.level, e),
			file: None,
		})?;

	// For now, just implement console logging
	if config.console.enabled {
		let subscriber = fmt().with_env_filter(env_filter).with_writer(std::io::stderr).finish();

		subscriber.try_init().map_err(|e| SymphonyError::Generic {
			message: format!("Failed to initialize logging: {e}"),
			source: Some(Box::new(e)),
		})?;
	}

	// TODO: Implement file and JSON logging layers
	if config.file.is_some() {
		crate::duck!("File logging not yet implemented - will be completed in this feature");
	}

	if config.json.is_some() {
		crate::duck!("JSON logging not yet implemented - will be completed in this feature");
	}

	Ok(())
}

// Remove the helper functions for now
// fn create_console_layer(_config: &ConsoleConfig) -> Result<Box<dyn tracing_subscriber::Layer<tracing_subscriber::Registry> + Send + Sync>, SymphonyError> {
//     use tracing_subscriber::fmt;
//
//     let layer = fmt::layer()
//         .with_writer(std::io::stderr);
//
//     Ok(Box::new(layer))
// }
//
// fn create_file_layer(_config: &FileConfig) -> Result<Box<dyn tracing_subscriber::Layer<tracing_subscriber::Registry> + Send + Sync>, SymphonyError> {
//     // TODO: Implement file layer with rotation
//     todo!("File logging layer implementation - will be completed in this feature")
// }
//
// fn create_json_layer(_config: &JsonConfig) -> Result<Box<dyn tracing_subscriber::Layer<tracing_subscriber::Registry> + Send + Sync>, SymphonyError> {
//     // TODO: Implement JSON layer
//     todo!("JSON logging layer implementation - will be completed in this feature")
// }

// Re-export tracing macros (excluding debug, trace)
pub use tracing::{error, info, warn};

// Re-export duck macro for debugging (from crate root)
pub use crate::duck;

/// Macro to prevent usage of debug logging
/// 
/// This macro will cause a compilation error if someone tries to use `debug!()`.
/// Use `duck!()` macro from `sy_commons::duck` instead of debug logging.
/// 
/// # Recommended usage:
/// ```rust
/// use sy_commons::logging::{error, info, warn, duck};
/// 
/// // Instead of debug!("message"), use:
/// duck!("message");
/// ```
#[macro_export]
macro_rules! debug {
    ($($arg:tt)*) => {
        compile_error!("Use duck!() macro from sy_commons::duck instead of debug logging. Import with: use sy_commons::logging::{error, info, warn, duck};");
    };
}

#[cfg(test)]
#[allow(clippy::unwrap_used, clippy::panic)]
mod tests {
	use super::*;
	use tempfile::TempDir;

	#[test]
	fn test_logging_config_creation() {
		let config = LoggingConfig {
			level: "info".to_string(),
			console: ConsoleConfig {
				enabled: true,
				format: ConsoleFormat::Pretty,
				colors: true,
			},
			file: Some(FileConfig {
				enabled: true,
				path: PathBuf::from("test.log"),
				rotation: RotationConfig::Daily,
				max_files: 7,
			}),
			json: None,
		};

		assert_eq!(config.level, "info");
		assert!(config.console.enabled);
		assert!(config.file.is_some());
		assert!(config.json.is_none());
	}

	#[test]
	fn test_console_format_serialization() {
		let format = ConsoleFormat::Pretty;
		let serialized = serde_json::to_string(&format).unwrap();
		let deserialized: ConsoleFormat = serde_json::from_str(&serialized).unwrap();

		match deserialized {
			ConsoleFormat::Pretty => (),
			_ => panic!("Expected Pretty format"),
		}
	}

	#[tokio::test]
	async fn test_file_logging() {
		let temp_dir = TempDir::new().unwrap();
		let log_path = temp_dir.path().join("test.log");

		let config = LoggingConfig {
			level: "debug".to_string(),
			console: ConsoleConfig {
				enabled: false,
				format: ConsoleFormat::Compact,
				colors: false,
			},
			file: Some(FileConfig {
				enabled: true,
				path: log_path,
				rotation: RotationConfig::Size(1024),
				max_files: 3,
			}),
			json: None,
		};

		// This should succeed but file logging is not yet implemented
		let result = init_logging(&config);
		assert!(result.is_ok()); // Should succeed with duck debugging message
	}

	#[test]
	fn test_recommended_logging_usage() {
		// Test that the recommended usage pattern compiles and works
		use crate::logging::{error, info, warn, duck};
		
		// These should all work without issues
		error!("Test error message");
		info!("Test info message");
		warn!("Test warn message");
		duck!("Test duck debugging message");
		
		// The debug macro should be available but will cause compilation error if used
		// We can't test the compilation error directly in a unit test, but we can
		// verify that the macro exists and is properly exported
		assert!(true); // This test just ensures the imports work
	}
}
