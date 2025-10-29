//! Message types for IPC and internal communication

use crate::core::{EntityId, Priority, Timestamp};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Unique message identifier
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct MessageId(pub EntityId);

impl MessageId {
    /// Create a new message ID
    pub fn new() -> Self {
        Self(EntityId::new())
    }
}

impl Default for MessageId {
    fn default() -> Self {
        Self::new()
    }
}

/// Message types
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum MessageType {
    /// Request message
    Request,
    /// Response message
    Response,
    /// Notification (no response expected)
    Notification,
    /// Event broadcast
    Event,
}

/// Generic message envelope
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    /// Unique message ID
    pub id: MessageId,
    /// Message type
    pub msg_type: MessageType,
    /// Source entity
    pub source: EntityId,
    /// Destination entity (None for broadcasts)
    pub destination: Option<EntityId>,
    /// Priority
    pub priority: Priority,
    /// Timestamp
    pub timestamp: Timestamp,
    /// Payload (JSON-serialized)
    pub payload: serde_json::Value,
    /// Optional metadata
    pub metadata: HashMap<String, String>,
}

impl Message {
    /// Create a new request message
    pub fn request(source: EntityId, destination: EntityId, payload: serde_json::Value) -> Self {
        Self {
            id: MessageId::new(),
            msg_type: MessageType::Request,
            source,
            destination: Some(destination),
            priority: Priority::Normal,
            timestamp: Timestamp::now(),
            payload,
            metadata: HashMap::new(),
        }
    }

    /// Create a new response message
    pub fn response(source: EntityId, destination: EntityId, payload: serde_json::Value) -> Self {
        Self {
            id: MessageId::new(),
            msg_type: MessageType::Response,
            source,
            destination: Some(destination),
            priority: Priority::Normal,
            timestamp: Timestamp::now(),
            payload,
            metadata: HashMap::new(),
        }
    }

    /// Create a new notification message
    pub fn notification(source: EntityId, payload: serde_json::Value) -> Self {
        Self {
            id: MessageId::new(),
            msg_type: MessageType::Notification,
            source,
            destination: None,
            priority: Priority::Normal,
            timestamp: Timestamp::now(),
            payload,
            metadata: HashMap::new(),
        }
    }

    /// Create a new event message
    pub fn event(source: EntityId, payload: serde_json::Value) -> Self {
        Self {
            id: MessageId::new(),
            msg_type: MessageType::Event,
            source,
            destination: None,
            priority: Priority::Normal,
            timestamp: Timestamp::now(),
            payload,
            metadata: HashMap::new(),
        }
    }

    /// Set priority
    pub fn with_priority(mut self, priority: Priority) -> Self {
        self.priority = priority;
        self
    }

    /// Add metadata
    pub fn with_metadata(mut self, key: String, value: String) -> Self {
        self.metadata.insert(key, value);
        self
    }
}

/// RPC request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RpcRequest {
    pub id: MessageId,
    pub method: String,
    pub params: serde_json::Value,
}

/// RPC response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RpcResponse {
    pub id: MessageId,
    pub result: Option<serde_json::Value>,
    pub error: Option<RpcError>,
}

/// RPC error
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RpcError {
    pub code: i32,
    pub message: String,
    pub data: Option<serde_json::Value>,
}

impl RpcError {
    /// Create a new RPC error
    pub fn new(code: i32, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
            data: None,
        }
    }

    /// Add error data
    pub fn with_data(mut self, data: serde_json::Value) -> Self {
        self.data = Some(data);
        self
    }
}

/// Standard RPC error codes
pub mod error_codes {
    pub const PARSE_ERROR: i32 = -32700;
    pub const INVALID_REQUEST: i32 = -32600;
    pub const METHOD_NOT_FOUND: i32 = -32601;
    pub const INVALID_PARAMS: i32 = -32602;
    pub const INTERNAL_ERROR: i32 = -32603;
}
