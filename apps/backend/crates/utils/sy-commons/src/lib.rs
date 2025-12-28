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
//! 
//! fn example() -> Result<(), Box<dyn std::error::Error>> {
//!     // This example shows the API structure
//!     // In practice, you'd need proper config files
//!     Ok(())
//! }
//! ```
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

pub mod error;
pub mod debug;
pub mod extensions;
pub mod logging;
pub mod config;
pub mod filesystem;
pub mod prevalidation;

// Re-export commonly used items
pub use error::{SymphonyError, ResultContext};
pub use logging::{LoggingConfig, init_logging, debug, error, info, trace, warn};
pub use config::{Config, load_config, DefaultConfig};
pub use filesystem::{read_file, write_file, create_dir_all, file_exists, get_project_dirs};
pub use prevalidation::{PreValidationRule, NonEmptyRule, MinLengthRule, MaxLengthRule, validate_fast};