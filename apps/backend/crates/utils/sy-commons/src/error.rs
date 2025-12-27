//! Centralized error handling for Symphony
//!
//! This module provides the main `SymphonyError` type and context helpers
//! that should be used across all Symphony crates for consistent error handling.

use thiserror::Error;

/// Central error type for all Symphony operations
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
    /// Validation error with details
    #[error("Validation failed: {message}")]
    Validation { message: String },
    
    /// I/O error with context
    #[error("I/O error: {context}")]
    Io { 
        #[source]
        source: std::io::Error, 
        context: String 
    },
    
    /// Serialization/deserialization error with context
    #[error("Serialization error: {context}")]
    Serialization { 
        #[source]
        source: serde_json::Error, 
        context: String 
    },
    
    /// Generic error with context for any other error type
    #[error("Operation failed: {context}")]
    Generic { 
        #[source]
        source: Box<dyn std::error::Error + Send + Sync>, 
        context: String 
    },
}

impl SymphonyError {
    /// Create a validation error
    pub fn validation(message: impl Into<String>) -> Self {
        Self::Validation { message: message.into() }
    }
    
    /// Create an error with context from any error type
    pub fn with_context<E>(error: E, context: impl Into<String>) -> Self 
    where
        E: std::error::Error + Send + Sync + 'static,
    {
        // Try to downcast to specific error types for better categorization
        let boxed: Box<dyn std::error::Error + Send + Sync> = Box::new(error);
        
        // Check if it's an IO error
        if let Some(io_err) = boxed.downcast_ref::<std::io::Error>() {
            return Self::Io { 
                source: std::io::Error::new(io_err.kind(), io_err.to_string()), 
                context: context.into() 
            };
        }
        
        // Check if it's a serde_json error
        if let Some(serde_err) = boxed.downcast_ref::<serde_json::Error>() {
            // We can't move out of the box, so create a new error with the same message
            return Self::Serialization { 
                source: serde_json::Error::io(std::io::Error::new(
                    std::io::ErrorKind::InvalidData, 
                    serde_err.to_string()
                )), 
                context: context.into() 
            };
        }
        
        // Default to generic error
        Self::Generic { 
            source: boxed, 
            context: context.into() 
        }
    }
}

/// Extension trait for adding context to Result types
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
pub trait ResultContext<T, E> {
    /// Add static context to an error
    fn context(self, context: &str) -> Result<T, SymphonyError>;
    
    /// Add dynamic context to an error using a closure
    fn with_context<F>(self, f: F) -> Result<T, SymphonyError>
    where
        F: FnOnce() -> String;
}

impl<T, E> ResultContext<T, E> for Result<T, E>
where
    E: std::error::Error + Send + Sync + 'static,
{
    fn context(self, context: &str) -> Result<T, SymphonyError> {
        self.map_err(|e| SymphonyError::with_context(e, context.to_string()))
    }
    
    fn with_context<F>(self, f: F) -> Result<T, SymphonyError>
    where
        F: FnOnce() -> String,
    {
        self.map_err(|e| SymphonyError::with_context(e, f()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validation_error() {
        let error = SymphonyError::validation("Invalid input");
        assert!(matches!(error, SymphonyError::Validation { .. }));
        assert_eq!(error.to_string(), "Validation failed: Invalid input");
    }

    #[test]
    fn test_context_extension() {
        let result: Result<String, std::io::Error> = Err(std::io::Error::new(
            std::io::ErrorKind::NotFound,
            "File not found"
        ));
        
        let with_context = result.context("Failed to read config");
        assert!(with_context.is_err());
        
        let error = with_context.unwrap_err();
        assert!(matches!(error, SymphonyError::Io { .. }));
        assert!(error.to_string().contains("Failed to read config"));
    }

    #[test]
    fn test_with_context_closure() {
        let filename = "test.txt";
        let result: Result<String, std::io::Error> = Err(std::io::Error::new(
            std::io::ErrorKind::PermissionDenied,
            "Permission denied"
        ));
        
        let with_context = result.with_context(|| format!("Failed to access file: {}", filename));
        assert!(with_context.is_err());
        
        let error = with_context.unwrap_err();
        assert!(error.to_string().contains("Failed to access file: test.txt"));
    }
}