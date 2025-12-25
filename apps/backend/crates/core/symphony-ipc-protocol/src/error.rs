//! Error types for message operations

use thiserror::Error;

/// Errors that can occur during message operations
#[derive(Debug, Error)]
pub enum MessageError {
    #[error("Invalid message type: {0}")]
    InvalidMessageType(String),
    
    #[error("Missing required field: {0}")]
    MissingField(&'static str),
    
    #[error("Invalid endpoint ID: {0}")]
    InvalidEndpointId(String),
    
    #[error("Invalid priority value: {0}")]
    InvalidPriority(i32),
    
    #[error("Message has expired (TTL exceeded)")]
    TtlExpired,
    
    #[error("Invalid protocol version: {major}.{minor}")]
    InvalidProtocolVersion { major: u16, minor: u16 },
    
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
    
    #[error("UUID parsing error: {0}")]
    UuidParse(#[from] uuid::Error),
    
    #[error("Invalid metadata key: {0}")]
    InvalidMetadataKey(String),
}

impl MessageError {
    /// Check if error is recoverable
    pub fn is_recoverable(&self) -> bool {
        match self {
            MessageError::TtlExpired => false,
            MessageError::InvalidProtocolVersion { .. } => false,
            MessageError::UuidParse(_) => false,
            _ => true,
        }
    }
    
    /// Get error category for metrics
    pub fn category(&self) -> &'static str {
        match self {
            MessageError::InvalidMessageType(_) => "validation",
            MessageError::MissingField(_) => "validation",
            MessageError::InvalidEndpointId(_) => "validation",
            MessageError::InvalidPriority(_) => "validation",
            MessageError::TtlExpired => "expiration",
            MessageError::InvalidProtocolVersion { .. } => "compatibility",
            MessageError::Serialization(_) => "serialization",
            MessageError::UuidParse(_) => "parsing",
            MessageError::InvalidMetadataKey(_) => "validation",
        }
    }
}