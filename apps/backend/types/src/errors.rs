//! Error types for Symphony

use thiserror::Error;

/// Main error type for Symphony
#[derive(Debug, Error)]
pub enum SymphonyError {
    /// IO errors
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    /// Serialization errors
    #[error("Serialization error: {0}")]
    Serialization(String),

    /// IPC communication errors
    #[error("IPC error: {0}")]
    Ipc(String),

    /// Extension errors
    #[error("Extension error: {0}")]
    Extension(String),

    /// Configuration errors
    #[error("Configuration error: {0}")]
    Config(String),

    /// Not found errors
    #[error("Not found: {0}")]
    NotFound(String),

    /// Permission denied
    #[error("Permission denied: {0}")]
    PermissionDenied(String),

    /// Invalid state
    #[error("Invalid state: {0}")]
    InvalidState(String),

    /// Timeout
    #[error("Operation timed out: {0}")]
    Timeout(String),

    /// Resource exhausted
    #[error("Resource exhausted: {0}")]
    ResourceExhausted(String),

    /// Internal error
    #[error("Internal error: {0}")]
    Internal(String),

    /// Generic error
    #[error("{0}")]
    Other(String),
}

impl From<serde_json::Error> for SymphonyError {
    fn from(err: serde_json::Error) -> Self {
        SymphonyError::Serialization(err.to_string())
    }
}

impl From<bincode::Error> for SymphonyError {
    fn from(err: bincode::Error) -> Self {
        SymphonyError::Serialization(err.to_string())
    }
}

impl From<rmp_serde::encode::Error> for SymphonyError {
    fn from(err: rmp_serde::encode::Error) -> Self {
        SymphonyError::Serialization(err.to_string())
    }
}

impl From<rmp_serde::decode::Error> for SymphonyError {
    fn from(err: rmp_serde::decode::Error) -> Self {
        SymphonyError::Serialization(err.to_string())
    }
}

/// Result type alias for Symphony operations
pub type SymphonyResult<T> = Result<T, SymphonyError>;

/// Error severity levels
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum ErrorSeverity {
    Info,
    Warning,
    Error,
    Critical,
}

/// Structured error with additional context
#[derive(Debug, Clone)]
pub struct StructuredError {
    pub error: String,
    pub severity: ErrorSeverity,
    pub context: Vec<(String, String)>,
    pub timestamp: crate::core::Timestamp,
}

impl StructuredError {
    /// Create a new structured error
    pub fn new(error: impl Into<String>, severity: ErrorSeverity) -> Self {
        Self {
            error: error.into(),
            severity,
            context: Vec::new(),
            timestamp: crate::core::Timestamp::now(),
        }
    }

    /// Add context to the error
    pub fn with_context(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        self.context.push((key.into(), value.into()));
        self
    }
}
