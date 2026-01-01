//! Centralized error handling for Symphony
//!
//! This module provides the main `SymphonyError` type and context helpers
//! that should be used across all Symphony crates for consistent error handling.

use std::path::PathBuf;
use thiserror::Error;

/// Base error type for all Symphony crates
///
/// This error type provides structured error handling with context information
/// to help with debugging and error reporting. All Symphony crates should use
/// this error type at their public boundaries.
///
/// # Examples
///
/// ```rust
/// use sy_commons::error::{SymphonyError, ResultContext};
///
/// fn read_config() -> Result<String, SymphonyError> {
///     std::fs::read_to_string("config.toml")
///         .context("Failed to read configuration file")
/// }
/// ```
#[derive(Debug, Error)]
pub enum SymphonyError {
	/// Validation error with field and value details
	#[error("Validation error: {message}")]
	Validation {
		/// The validation error message
		message: String,
		/// The field that failed validation (optional)
		field: Option<String>,
		/// The value that failed validation (optional)
		value: Option<String>,
	},

	/// IO error with context
	#[error("IO error: {source}")]
	Io {
		/// The underlying IO error
		source: std::io::Error,
		/// Additional context about the IO operation (optional)
		context: Option<String>,
	},

	/// Serialization error with format information
	#[error("Serialization error: {message}")]
	Serialization {
		/// The serialization error message
		message: String,
		/// The format being serialized (e.g., "JSON", "TOML")
		format: String,
	},

	/// Configuration error with file information
	#[error("Configuration error: {message}")]
	Configuration {
		/// The configuration error message
		message: String,
		/// The configuration file path (optional)
		file: Option<PathBuf>,
	},

	/// Generic error with context for any other error type
	#[error("Generic error: {message}")]
	Generic {
		/// The generic error message
		message: String,
		/// The underlying error source (optional)
		source: Option<Box<dyn std::error::Error + Send + Sync>>,
	},
}

impl From<std::io::Error> for SymphonyError {
	fn from(source: std::io::Error) -> Self {
		Self::Io {
			source,
			context: None,
		}
	}
}
///
/// This trait provides `.context()` and `.with_context()` methods
/// for any Result type, converting errors to `SymphonyError` with
/// meaningful context information.
///
/// # Examples
///
/// ```rust
/// use sy_commons::error::{SymphonyError, ResultContext};
///
/// fn process_file(path: &str) -> Result<String, SymphonyError> {
///     let content = std::fs::read_to_string(path)
///         .context("Failed to read input file")?;
///     
///     let processed = content.to_uppercase();
///     
///     std::fs::write("output.txt", &processed)
///         .with_context(|| format!("Failed to write output to file"))?;
///     
///     Ok(processed)
/// }
/// ```
pub trait ResultContext<T> {
	/// Add static context to an error
	fn context(self, context: &str) -> Result<T, SymphonyError>;

	/// Add dynamic context to an error using a closure
	fn with_context<F>(self, f: F) -> Result<T, SymphonyError>
	where
		F: FnOnce() -> String;

	/// Add field-specific context for validation errors
	fn with_field_context(self, field: &str, value: &str) -> Result<T, SymphonyError>;
}

impl<T, E> ResultContext<T> for Result<T, E>
where
	E: Into<SymphonyError>,
{
	fn context(self, context: &str) -> Result<T, SymphonyError> {
		self.map_err(|e| {
			let mut error = e.into();
			if let SymphonyError::Io {
				context: ref mut ctx,
				..
			} = &mut error
			{
				*ctx = Some(context.to_string());
			}
			error
		})
	}

	fn with_context<F>(self, f: F) -> Result<T, SymphonyError>
	where
		F: FnOnce() -> String,
	{
		self.map_err(|e| {
			let mut error = e.into();
			if let SymphonyError::Io {
				context: ref mut ctx,
				..
			} = &mut error
			{
				*ctx = Some(f());
			}
			error
		})
	}

	fn with_field_context(self, field: &str, value: &str) -> Result<T, SymphonyError> {
		self.map_err(|e| {
			// Convert the error to SymphonyError first
			let symphony_error = e.into();
			// Then transform it to a validation error with field context
			SymphonyError::Validation {
				message: format!("Validation failed: {symphony_error}"),
				field: Some(field.to_string()),
				value: Some(value.to_string()),
			}
		})
	}
}

#[cfg(test)]
#[allow(clippy::panic, clippy::manual_string_new, clippy::uninlined_format_args, clippy::unwrap_used)]
mod tests {
	use super::*;

	#[test]
	fn test_io_error_conversion() {
		let io_error = std::io::Error::new(std::io::ErrorKind::NotFound, "File not found");
		let symphony_error: SymphonyError = io_error.into();

		match symphony_error {
			SymphonyError::Io { source, context } => {
				assert_eq!(source.kind(), std::io::ErrorKind::NotFound);
				assert!(context.is_none());
			},
			_ => panic!("Expected Io error variant"),
		}
	}

	#[test]
	fn test_validation_error_with_context() {
		let result: Result<(), std::io::Error> =
			Err(std::io::Error::new(std::io::ErrorKind::InvalidInput, "Invalid"));
		let error = result.with_field_context("username", "").unwrap_err();

		match error {
			SymphonyError::Validation {
				message,
				field,
				value,
			} => {
				assert!(message.contains("Invalid"));
				assert_eq!(field, Some("username".to_string()));
				assert_eq!(value, Some("".to_string()));
			},
			_ => panic!("Expected Validation error variant"),
		}
	}

	#[test]
	fn test_error_display() {
		let error = SymphonyError::Validation {
			message: "Test error".to_string(),
			field: Some("test_field".to_string()),
			value: Some("test_value".to_string()),
		};

		let display = format!("{}", error);
		assert!(display.contains("Validation error"));
		assert!(display.contains("Test error"));
	}

	#[test]
	fn test_error_debug() {
		let error = SymphonyError::Generic {
			message: "Test error".to_string(),
			source: None,
		};

		let debug = format!("{:?}", error);
		assert!(debug.contains("Generic"));
		assert!(debug.contains("Test error"));
	}
}
