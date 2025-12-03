//! Error types for xi-integration operations
//!
//! This module defines the error types used throughout the xi-integration crate.
//! All errors implement `std::error::Error` and can be converted to `anyhow::Error`.

use std::path::PathBuf;
use thiserror::Error;

use crate::types::ViewId;

/// Result type alias for xi-integration operations
pub type XiResult<T> = Result<T, XiError>;

/// Error types for xi-integration operations
///
/// This enum represents all possible errors that can occur during xi-core
/// integration operations. Each variant provides context-specific information
/// about the error.
///
/// # Examples
///
/// ```rust
/// use xi_integration::{XiError, ViewId};
///
/// let error = XiError::InvalidViewId(ViewId(42));
/// println!("Error: {}", error);
/// ```
#[derive(Debug, Error)]
pub enum XiError {
    /// File I/O error occurred
    ///
    /// This error occurs when reading or writing files fails.
    #[error("File I/O error for path {path:?}: {source}")]
    FileIo {
        /// The file path that caused the error
        path: PathBuf,
        /// The underlying I/O error
        #[source]
        source: std::io::Error,
    },

    /// Invalid view ID provided
    ///
    /// This error occurs when an operation references a view that doesn't exist.
    #[error("Invalid view ID: {0:?}")]
    InvalidViewId(ViewId),

    /// Edit operation out of bounds
    ///
    /// This error occurs when an edit operation references positions outside
    /// the valid range of the buffer.
    #[error("Edit operation out of bounds: position {position} in buffer of size {buffer_size}")]
    EditOutOfBounds {
        /// The position that was out of bounds
        position: usize,
        /// The actual size of the buffer
        buffer_size: usize,
    },

    /// Invalid UTF-8 in file content
    ///
    /// This error occurs when file content cannot be decoded as valid UTF-8.
    #[error("Invalid UTF-8 in file {path:?}: {source}")]
    InvalidUtf8 {
        /// The file path with invalid UTF-8
        path: PathBuf,
        /// The underlying UTF-8 error
        #[source]
        source: std::string::FromUtf8Error,
    },

    /// Configuration error
    ///
    /// This error occurs when xi-core configuration is invalid.
    #[error("Configuration error: {0}")]
    Configuration(String),

    /// IPC protocol error
    ///
    /// This error occurs when translating between Symphony IPC and Xi-RPC fails.
    #[error("IPC protocol error: {0}")]
    Protocol(String),

    /// Buffer corruption detected
    ///
    /// This error occurs when buffer state becomes inconsistent.
    #[error("Buffer corruption detected for view {view_id:?}: {details}")]
    BufferCorruption {
        /// The view with corrupted buffer
        view_id: ViewId,
        /// Details about the corruption
        details: String,
    },

    /// Generic error for other cases
    ///
    /// This error wraps any other error type using anyhow.
    #[error(transparent)]
    Other(#[from] anyhow::Error),
}

impl XiError {
    /// Create a configuration error
    ///
    /// # Examples
    ///
    /// ```rust
    /// use xi_integration::XiError;
    ///
    /// let error = XiError::config("Invalid tab size: must be positive");
    /// ```
    pub fn config<S: Into<String>>(msg: S) -> Self {
        XiError::Configuration(msg.into())
    }

    /// Create a protocol error
    ///
    /// # Examples
    ///
    /// ```rust
    /// use xi_integration::XiError;
    ///
    /// let error = XiError::protocol("Failed to serialize message");
    /// ```
    pub fn protocol<S: Into<String>>(msg: S) -> Self {
        XiError::Protocol(msg.into())
    }

    /// Create a buffer corruption error
    ///
    /// # Examples
    ///
    /// ```rust
    /// use xi_integration::{XiError, ViewId};
    ///
    /// let error = XiError::buffer_corruption(
    ///     ViewId(1),
    ///     "Rope invariant violated"
    /// );
    /// ```
    pub fn buffer_corruption<S: Into<String>>(view_id: ViewId, details: S) -> Self {
        XiError::BufferCorruption {
            view_id,
            details: details.into(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_display() {
        let error = XiError::InvalidViewId(ViewId(42));
        assert_eq!(error.to_string(), "Invalid view ID: ViewId(42)");
    }

    #[test]
    fn test_config_error() {
        let error = XiError::config("Test configuration error");
        assert!(matches!(error, XiError::Configuration(_)));
    }

    #[test]
    fn test_protocol_error() {
        let error = XiError::protocol("Test protocol error");
        assert!(matches!(error, XiError::Protocol(_)));
    }

    #[test]
    fn test_buffer_corruption_error() {
        let error = XiError::buffer_corruption(ViewId(1), "Test corruption");
        assert!(matches!(error, XiError::BufferCorruption { .. }));
    }
}
