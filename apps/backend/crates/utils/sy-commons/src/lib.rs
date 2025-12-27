//! # Symphony Commons
//!
//! Common utilities and patterns shared across all Symphony crates.
//! This crate provides centralized error handling, debugging utilities,
//! and extension traits following the Open-Closed Principle.
//!
//! ## Features
//!
//! - **Centralized Error Handling** - Single `SymphonyError` type with context
//! - **Duck Debugging** - Loud, temporary debugging with consistent format
//! - **Extension Traits** - Add functionality without breaking existing APIs
//!
//! ## Usage
//!
//! ```rust
//! use sy_commons::error::{SymphonyError, ResultContext};
//! use sy_commons::duck;
//!
//! fn example() -> Result<String, SymphonyError> {
//!     duck!("Starting example function");
//!     
//!     let content = std::fs::read_to_string("config.toml")
//!         .context("Failed to read configuration file")?;
//!     
//!     Ok(content)
//! }
//! ```

pub mod error;
pub mod debug;
pub mod extensions;

// Re-export commonly used items
pub use error::{SymphonyError, ResultContext};