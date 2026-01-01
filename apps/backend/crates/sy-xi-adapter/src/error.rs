//! Error types for XI-editor adapter
//!
//! Provides specific error types for XI-editor adapter operations while
//! integrating with Symphony's centralized error handling system.

use thiserror::Error;

/// XI-editor adapter specific errors
///
/// These errors are converted to `SymphonyError` at adapter boundaries
/// to maintain consistency with Symphony's error handling patterns.
#[derive(Error, Debug)]
pub enum XiAdapterError {
    /// XI-editor process management errors
    #[error("Process error: {message}")]
    Process { 
        /// Error message describing the process issue
        message: String 
    },

    /// JSON-RPC communication errors
    #[error("JSON-RPC error: {message}")]
    JsonRpc { 
        /// Error message describing the JSON-RPC issue
        message: String 
    },

    /// Event streaming errors
    #[error("Event stream error: {message}")]
    EventStream { 
        /// Error message describing the event stream issue
        message: String 
    },

    /// State synchronization errors
    #[error("State sync error: {message}")]
    StateSync { 
        /// Error message describing the state sync issue
        message: String 
    },

    /// Configuration errors
    #[error("Configuration error: {message}")]
    Configuration { 
        /// Error message describing the configuration issue
        message: String 
    },

    /// XI-editor binary not found or invalid
    #[error("XI-editor binary error: {message}")]
    BinaryError { 
        /// Error message describing the binary issue
        message: String 
    },

    /// Timeout errors
    #[error("Operation timed out: {operation} after {timeout_ms}ms")]
    Timeout { 
        /// Name of the operation that timed out
        operation: String, 
        /// Timeout duration in milliseconds
        timeout_ms: u64 
    },

    /// Buffer or view not found
    #[error("Resource not found: {resource_type} with ID {id}")]
    NotFound { 
        /// Type of resource that was not found
        resource_type: String, 
        /// ID of the resource that was not found
        id: String 
    },

    /// Invalid operation state
    #[error("Invalid state: {message}")]
    InvalidState { 
        /// Error message describing the invalid state
        message: String 
    },
}

impl XiAdapterError {
    /// Create a process error
    pub fn process<S: Into<String>>(message: S) -> Self {
        Self::Process { message: message.into() }
    }

    /// Create a JSON-RPC error
    pub fn jsonrpc<S: Into<String>>(message: S) -> Self {
        Self::JsonRpc { message: message.into() }
    }

    /// Create an event stream error
    pub fn event_stream<S: Into<String>>(message: S) -> Self {
        Self::EventStream { message: message.into() }
    }

    /// Create a state sync error
    pub fn state_sync<S: Into<String>>(message: S) -> Self {
        Self::StateSync { message: message.into() }
    }

    /// Create a configuration error
    pub fn configuration<S: Into<String>>(message: S) -> Self {
        Self::Configuration { message: message.into() }
    }

    /// Create a binary error
    pub fn binary<S: Into<String>>(message: S) -> Self {
        Self::BinaryError { message: message.into() }
    }

    /// Create a timeout error
    pub fn timeout<S: Into<String>>(operation: S, timeout_ms: u64) -> Self {
        Self::Timeout {
            operation: operation.into(),
            timeout_ms,
        }
    }

    /// Create a not found error
    pub fn not_found<S: Into<String>>(resource_type: S, id: S) -> Self {
        Self::NotFound {
            resource_type: resource_type.into(),
            id: id.into(),
        }
    }

    /// Create an invalid state error
    pub fn invalid_state<S: Into<String>>(message: S) -> Self {
        Self::InvalidState { message: message.into() }
    }
}

/// Convert `XiAdapterError` to `SymphonyError`
impl From<XiAdapterError> for sy_commons::SymphonyError {
    fn from(err: XiAdapterError) -> Self {
        Self::Generic {
            message: format!("XI-editor adapter error: {err}"),
            source: Some(Box::new(err)),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_creation() {
        let process_err = XiAdapterError::process("Process failed");
        assert!(matches!(process_err, XiAdapterError::Process { .. }));

        let jsonrpc_err = XiAdapterError::jsonrpc("RPC failed");
        assert!(matches!(jsonrpc_err, XiAdapterError::JsonRpc { .. }));

        let timeout_err = XiAdapterError::timeout("test_operation", 1000);
        assert!(matches!(timeout_err, XiAdapterError::Timeout { .. }));

        let not_found_err = XiAdapterError::not_found("buffer", "123");
        assert!(matches!(not_found_err, XiAdapterError::NotFound { .. }));
    }

    #[test]
    fn test_error_display() {
        let err = XiAdapterError::process("Test process error");
        let display = format!("{err}");
        assert!(display.contains("Process error"));
        assert!(display.contains("Test process error"));
    }

    #[test]
    fn test_symphony_error_conversion() {
        let xi_err = XiAdapterError::jsonrpc("Test RPC error");
        let symphony_err: sy_commons::SymphonyError = xi_err.into();
        
        let display = format!("{symphony_err}");
        assert!(display.contains("XI-editor adapter error"));
    }
}