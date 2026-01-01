//! Error types for the transport layer
//!
//! Provides comprehensive error handling for all transport operations including
//! connection failures, timeouts, and transport-specific issues.

use sy_commons::error::SymphonyError;
use thiserror::Error;

/// Transport layer errors
#[derive(Debug, Error)]
pub enum TransportError {
    /// Connection establishment failed
    #[error("Connection failed: {message}")]
    ConnectionFailed { 
        /// Error message describing the connection failure
        message: String 
    },
    
    /// Connection timed out
    #[error("Connection timeout")]
    ConnectionTimeout,
    
    /// Send operation failed
    #[error("Send failed: {message}")]
    SendFailed { 
        /// Error message describing the send failure
        message: String 
    },
    
    /// Send operation timed out
    #[error("Send timeout")]
    SendTimeout,
    
    /// Receive operation failed
    #[error("Receive failed: {message}")]
    ReceiveFailed { 
        /// Error message describing the receive failure
        message: String 
    },
    
    /// Receive operation timed out
    #[error("Receive timeout")]
    ReceiveTimeout,
    
    /// Connection was closed
    #[error("Connection closed")]
    ConnectionClosed,
    
    /// Close operation failed
    #[error("Close failed: {message}")]
    CloseFailed { 
        /// Error message describing the close failure
        message: String 
    },
    
    /// Listen operation failed
    #[error("Listen failed: {message}")]
    ListenFailed { 
        /// Error message describing the listen failure
        message: String 
    },
    
    /// Buffer too small for received data
    #[error("Buffer too small")]
    BufferTooSmall,
    
    /// Transport not supported on this platform
    #[error("Unsupported platform: {message}")]
    UnsupportedPlatform { 
        /// Error message describing the platform limitation
        message: String 
    },
    
    /// Operation not supported by this transport
    #[error("Unsupported operation: {message}")]
    UnsupportedOperation { 
        /// Error message describing the unsupported operation
        message: String 
    },
    
    /// Configuration error
    #[error("Configuration error: {0}")]
    Config(#[from] ConfigError),
    
    /// I/O error
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),
}

/// Configuration errors
#[derive(Debug, Error)]
pub enum ConfigError {
    /// Invalid endpoint address
    #[error("Invalid endpoint: {message}")]
    InvalidEndpoint { 
        /// Error message describing the invalid endpoint
        message: String 
    },
    
    /// Invalid timeout value
    #[error("Invalid timeout: {message}")]
    InvalidTimeout { 
        /// Error message describing the invalid timeout
        message: String 
    },
    
    /// Invalid parameter value
    #[error("Invalid parameter: {message}")]
    InvalidParameter { 
        /// Error message describing the invalid parameter
        message: String 
    },
    
    /// Missing required parameter
    #[error("Missing parameter: {name}")]
    MissingParameter { 
        /// Name of the missing parameter
        name: String 
    },
}

impl From<TransportError> for SymphonyError {
    fn from(err: TransportError) -> Self {
        SymphonyError::Generic {
            message: format!("Transport layer operation failed: {}", err),
            source: Some(Box::new(err)),
        }
    }
}

impl From<ConfigError> for SymphonyError {
    fn from(err: ConfigError) -> Self {
        SymphonyError::Configuration {
            message: format!("Transport configuration error: {}", err),
            file: None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use sy_commons::SymphonyError;
    
    
    #[cfg(feature = "unit")]
    #[test]
    fn test_transport_error_display() {
        let error = TransportError::ConnectionFailed {
            message: "Network unreachable".to_string(),
        };
        assert!(error.to_string().contains("Connection failed"));
        assert!(error.to_string().contains("Network unreachable"));
    }
    
    #[cfg(feature = "unit")]
    #[test]
    fn test_config_error_display() {
        let error = ConfigError::InvalidEndpoint {
            message: "Empty endpoint".to_string(),
        };
        assert!(error.to_string().contains("Invalid endpoint"));
        assert!(error.to_string().contains("Empty endpoint"));
    }
    
    #[cfg(feature = "unit")]
    #[test]
    fn test_error_conversion_to_symphony_error() {
        let transport_error = TransportError::ConnectionTimeout;
        let symphony_error: SymphonyError = transport_error.into();
        
        match symphony_error {
            SymphonyError::Generic { message, .. } => {
                assert!(message.contains("Transport layer operation failed"));
            }
            _ => panic!("Expected Generic error variant"),
        }
    }
}