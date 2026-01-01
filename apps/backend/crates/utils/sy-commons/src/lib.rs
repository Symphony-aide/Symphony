//! # sy-commons: Symphony Common Utilities
//!
//! This crate provides foundational utilities for all Symphony Rust crates.
//!
//! ## Features
//!
//! - **Error Handling**: Standardized error types with context
//! - **Logging**: Professional logging with multiple output formats
//! - **Configuration**: Type-safe configuration management
//! - **Filesystem**: Safe filesystem operations
//! - **Pre-validation**: Performance-optimized validation rules
//! - **Debugging**: Temporary debugging utilities
//!
//! ## Quick Start
//!
//! ```rust
//! use sy_commons::{SymphonyError, init_logging, load_config};
//! use sy_commons::{error, info, warn, duck}; // Recommended logging imports
//!
//! fn example() -> Result<(), Box<dyn std::error::Error>> {
//!     // Initialize logging system
//!     let config = sy_commons::logging::LoggingConfig {
//!         level: "info".to_string(),
//!         console: sy_commons::logging::ConsoleConfig {
//!             enabled: true,
//!             format: sy_commons::logging::ConsoleFormat::Pretty,
//!             colors: true,
//!         },
//!         file: None,
//!         json: None,
//!     };
//!     init_logging(&config)?;
//!
//!     // Use logging throughout your application
//!     info!("Application started successfully");
//!     warn!("This is a warning message");
//!     duck!("Temporary debug info"); // Use instead of debug!()
//!
//!     Ok(())
//! }
//! ```
//!
//! ## Professional Logging (Auto-Initialized)
//!
//! Symphony provides automatic logging initialization - just use the macros directly:
//!
//! ```rust
//! use sy_commons::{error, info, warn, duck}; // Auto-initializing macros
//!
//! // ✅ No manual initialization needed!
//! info!("Application started successfully");    // Automatically initializes logging
//! warn!("High memory usage: {}MB", 1024);
//! error!("Database connection failed: {}", "timeout");
//! duck!("Temporary debug info");               // Use instead of debug!()
//! ```
//!
//! **Auto-Configuration:**
//! - **Default**: Console logging with pretty formatting and colors
//! - **Environment Variables**: Override with `SYMPHONY_LOG_*` variables
//! - **TOML Files**: Configure via `config/default.toml` or `config/{env}.toml`
//! - **Manual Override**: Call `init_logging()` before first macro use
//!
//! **Environment Variable Examples:**
//! ```bash
//! SYMPHONY_LOG_LEVEL=debug                    # Set log level
//! SYMPHONY_LOG_CONSOLE_COLORS=false          # Disable colors
//! SYMPHONY_LOG_FILE_ENABLED=true             # Enable file logging
//! SYMPHONY_LOG_FILE_PATH=logs/app.log        # Set file path
//! SYMPHONY_LOG_JSON_ENABLED=true             # Enable JSON logging
//! ```
//!
//! **Key Features:**
//! - **Smart Layer Management**: Console, file, and JSON outputs
//! - **Automatic Fallbacks**: Graceful handling of configuration issues
//! - **Debug Integration**: `duck!()` macro for temporary debugging
//! - **Production Ready**: Comprehensive error handling and rotation support
//!
//! ## Error Handling
//!
//! All Symphony crates should use `SymphonyError` for consistent error handling:
//!
//! ```rust
//! use sy_commons::error::{SymphonyError, ResultContext};
//!
//! fn read_config() -> Result<String, SymphonyError> {
//!     std::fs::read_to_string("config.toml")
//!         .context("Failed to read configuration file")
//! }
//! ```
//!
//! ## Duck Debugging
//!
//! Use the `duck!` macro for temporary debugging during development:
//!
//! ```rust
//! use sy_commons::duck;
//!
//! fn process_user(user_id: u64) {
//!     duck!("Processing user with ID: {}", user_id);
//!     // ... processing logic ...
//!     duck!("User processing completed successfully");
//! }
//! ```
//!
//! ## Configuration Management
//!
//! Load type-safe configuration from TOML files:
//!
//! ```rust
//! use sy_commons::config::{Config, load_config};
//! use serde::Deserialize;
//!
//! #[derive(Deserialize)]
//! struct AppConfig {
//!     database_url: String,
//!     log_level: String,
//! }
//!
//! impl Config for AppConfig {}
//!
//! fn example() -> Result<(), Box<dyn std::error::Error>> {
//!     // This would work with proper config files
//!     // let config: AppConfig = load_config("production")?;
//!     Ok(())
//! }
//! ```
//!
//! ## Filesystem Operations
//!
//! Safe filesystem operations with atomic writes:
//!
//! ```rust
//! use sy_commons::filesystem::{read_file, write_file};
//!
//! async fn example() -> Result<(), Box<dyn std::error::Error>> {
//!     // This would work with actual files:
//!     // let content = read_file("input.txt").await?;
//!     // let processed = content.to_uppercase();
//!     // write_file("output.txt", &processed).await?;
//!     Ok(())
//! }
//! ```
//!
//! ## Pre-validation
//!
//! Performance-optimized validation rules:
//!
//! ```rust
//! use sy_commons::prevalidation::{PreValidationRule, NonEmptyRule, validate_fast};
//!
//! fn example() -> Result<(), Box<dyn std::error::Error>> {
//!     let rule = NonEmptyRule;
//!     let value = "test".to_string();
//!     validate_fast(&value, &rule)?;
//!     Ok(())
//! }
//! ```

pub mod config;
pub mod debug;
pub mod error;
pub mod extensions;
pub mod filesystem;
pub mod logging;
pub mod _logging_default;
pub mod prevalidation;
pub mod testing;

// Re-export commonly used items
pub use config::{load_config, Config, DefaultConfig};
pub use error::{ResultContext, SymphonyError};
pub use filesystem::{create_dir_all, file_exists, get_project_dirs, read_file, write_file};
pub use logging::{init_logging, LoggingConfig};
pub use prevalidation::{
	validate_fast, MaxLengthRule, MinLengthRule, NonEmptyRule, PreValidationRule,
};
pub use testing::safe_generator;

// Note: Auto-initializing logging macros (error!, info!, warn!, duck!) are automatically
// available at crate root due to #[macro_export] in their respective modules
