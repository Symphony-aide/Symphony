//! Default logging configuration with automatic initialization
//!
//! This module provides automatic logging initialization with sensible defaults
//! that can be overridden via environment variables or TOML configuration files.
//! 
//! ## Automatic Initialization
//! 
//! Logging is automatically initialized on first use of any logging macro:
//! 
//! ```rust
//! use sy_commons::{info, warn, duck}; // Auto-initializing macros
//! 
//! // No manual initialization needed!
//! info!("Application started");  // Automatically initializes logging
//! warn!("Warning message");
//! duck!("Debug info");
//! ```
//! 
//! ## Default Configuration
//! 
//! - **Level**: `info` (can be overridden with `SYMPHONY_LOGGING_LEVEL`)
//! - **Console**: Enabled with pretty formatting and colors
//! - **File**: Disabled by default (enable with `SYMPHONY_LOGGING_FILE_ENABLED=true`)
//! - **JSON**: Disabled by default (enable with `SYMPHONY_LOGGING_JSON_ENABLED=true`)
//! 
//! ## Environment Variable Overrides
//! 
//! All configuration can be overridden via environment variables in config files:
//! 
//! **config/development.toml:**
//! ```toml
//! [logging]
//! level = "debug"
//! 
//! [logging.console]
//! enabled = true
//! format = "pretty"
//! colors = true
//! 
//! [logging.file]
//! enabled = true
//! path = "logs/app.log"
//! rotation = "daily"
//! max_files = 7
//! 
//! [logging.json]
//! enabled = false
//! path = "logs/structured.json"
//! include_spans = false
//! ```
//! 
//! ## TOML Configuration Files
//! 
//! Configuration follows the pattern established in `config.rs`:
//! - **config/default.toml**: Base configuration
//! - **config/{environment}.toml**: Environment-specific overrides
//! - **Environment variables**: `SYMPHONY_*` prefixed variables

use crate::config::{load_config, DefaultConfig};
use crate::error::SymphonyError;
use std::sync::Once;

/// Global initialization flag to ensure logging is only initialized once
static INIT: Once = Once::new();

/// Automatically initialize logging with default configuration
/// 
/// This function is called automatically on first use of any logging macro.
/// It loads configuration from:
/// 1. Built-in defaults
/// 2. TOML files (config/default.toml, config/{environment}.toml)
/// 3. Environment variables (SYMPHONY_*)
/// 
/// The initialization only happens once per process.
pub fn auto_init_logging() {
    INIT.call_once(|| {
        if let Err(e) = try_init_logging() {
            // If initialization fails, fall back to basic stderr logging
            eprintln!("[LOGGING] Failed to initialize logging: {}", e);
            eprintln!("[LOGGING] Falling back to basic stderr output");
            
            // Try to initialize a basic console logger as fallback
            if let Err(fallback_err) = init_fallback_logging() {
                eprintln!("[LOGGING] Fallback initialization also failed: {}", fallback_err);
                eprintln!("[LOGGING] Logging may not work properly");
            }
        }
    });
}

/// Try to initialize logging with full configuration loading
fn try_init_logging() -> Result<(), SymphonyError> {
    // Determine environment from SYMPHONY_ENV or default to "development"
    let environment = std::env::var("SYMPHONY_ENV").unwrap_or_else(|_| "development".to_string());
    
    // Load configuration using the existing config system
    let config: DefaultConfig = load_config(&environment).unwrap_or_else(|_| {
        // If config loading fails, use built-in defaults
        crate::duck!("Failed to load config from files, using built-in defaults");
        create_default_config()
    });
    
    crate::logging::init_logging(&config.logging)
}

/// Create a default configuration when file loading fails
fn create_default_config() -> DefaultConfig {
    use crate::logging::{LoggingConfig, ConsoleConfig, ConsoleFormat};
    use crate::config::{FilesystemConfig, DebugConfig};
    
    DefaultConfig {
        logging: LoggingConfig {
            level: "info".to_string(),
            console: ConsoleConfig {
                enabled: true,
                format: ConsoleFormat::Pretty,
                colors: true,
            },
            file: None,
            json: None,
        },
        filesystem: FilesystemConfig {
            temp_dir: None,
            max_file_size: 100 * 1024 * 1024, // 100MB
            atomic_writes: true,
        },
        debug: DebugConfig {
            duck_debugging: true,
            performance_logging: false,
        },
    }
}

/// Initialize basic fallback logging if full initialization fails
fn init_fallback_logging() -> Result<(), SymphonyError> {
    use tracing_subscriber::fmt;
    
    fmt()
        .with_env_filter("info")
        .with_writer(std::io::stderr)
        .compact()
        .try_init()
        .map_err(|e| SymphonyError::Generic {
            message: format!("Failed to initialize fallback logging: {}", e),
            source: None, // tracing::subscriber::SetGlobalDefaultError doesn't implement std::error::Error + Send + Sync
        })
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_default_config_creation() {
        let config = create_default_config();
        assert_eq!(config.logging.level, "info");
        assert!(config.logging.console.enabled);
        assert!(config.logging.console.colors);
        assert!(config.logging.file.is_none());
        assert!(config.logging.json.is_none());
        assert!(config.debug.duck_debugging);
        assert!(!config.debug.performance_logging);
    }
    
    #[test]
    fn test_auto_init_is_safe_to_call_multiple_times() {
        // This should not panic or cause issues
        auto_init_logging();
        auto_init_logging();
        auto_init_logging();
    }
}