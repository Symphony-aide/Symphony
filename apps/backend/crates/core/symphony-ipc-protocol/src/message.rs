//! Core message structures for Symphony's IPC protocol

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fmt::{self, Display, Formatter};
use std::str::FromStr;
use std::time::Duration;
use uuid::Uuid;

use crate::error::MessageError;

/// Unique identifier for messages using UUID v4
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct MessageId(Uuid);

impl MessageId {
    /// Generate a new unique message ID
    pub fn new() -> Self {
        #[cfg(debug_assertions)]
        log::debug!("[DUCK DEBUGGING]: Generating new MessageId with UUID v4");
        Self(Uuid::new_v4())
    }
    
    /// Create from existing UUID
    pub fn from_uuid(uuid: Uuid) -> Self {
        Self(uuid)
    }
    
    /// Get the underlying UUID
    pub fn as_uuid(&self) -> &Uuid {
        &self.0
    }
    
    /// Convert to string representation
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }
    
    /// Parse from string
    pub fn from_str(s: &str) -> Result<Self, MessageError> {
        let uuid = Uuid::parse_str(s)?;
        Ok(Self(uuid))
    }
}

impl Default for MessageId {
    fn default() -> Self {
        Self::new()
    }
}

impl Display for MessageId {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl FromStr for MessageId {
    type Err = MessageError;
    
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Self::from_str(s)
    }
}

/// Identifier for message endpoints
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct EndpointId(String);

impl EndpointId {
    pub fn new(id: impl Into<String>) -> Self {
        Self(id.into())
    }
    
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl Display for EndpointId {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

/// Types of messages supported by the protocol
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum MessageType {
    /// Request expecting a response
    Request,
    /// Response to a request
    Response,
    /// One-way event notification
    Event,
    /// Error notification
    Error,
    /// Keep-alive heartbeat
    Heartbeat,
}

impl MessageType {
    /// Check if this message type expects a response
    pub fn expects_response(&self) -> bool {
        matches!(self, MessageType::Request)
    }
    
    /// Get human-readable description
    pub fn description(&self) -> &'static str {
        match self {
            MessageType::Request => "Request expecting a response",
            MessageType::Response => "Response to a request",
            MessageType::Event => "One-way event notification",
            MessageType::Error => "Error notification",
            MessageType::Heartbeat => "Keep-alive heartbeat",
        }
    }
}

impl Display for MessageType {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        let name = match self {
            MessageType::Request => "Request",
            MessageType::Response => "Response",
            MessageType::Event => "Event",
            MessageType::Error => "Error",
            MessageType::Heartbeat => "Heartbeat",
        };
        write!(f, "{}", name)
    }
}

/// Message priority for routing and processing order
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
pub struct Priority(pub i32);

impl Priority {
    /// Critical system messages (highest priority)
    pub const CRITICAL: Priority = Priority(1000);
    /// High priority messages
    pub const HIGH: Priority = Priority(100);
    /// Normal priority messages (default)
    pub const NORMAL: Priority = Priority(0);
    /// Low priority messages
    pub const LOW: Priority = Priority(-100);
    /// Background processing messages (lowest priority)
    pub const BACKGROUND: Priority = Priority(-1000);
    
    /// Create custom priority level
    pub fn custom(level: i32) -> Self {
        Priority(level)
    }
    
    /// Get priority level as integer
    pub fn level(&self) -> i32 {
        self.0
    }
    
    /// Check if this is a system priority level
    pub fn is_system_level(&self) -> bool {
        matches!(self.0, 1000 | 100 | 0 | -100 | -1000)
    }
}

impl Default for Priority {
    fn default() -> Self {
        Self::NORMAL
    }
}

impl Display for Priority {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        let name = match self.0 {
            1000 => "Critical",
            100 => "High",
            0 => "Normal",
            -100 => "Low",
            -1000 => "Background",
            _ => "Custom",
        };
        write!(f, "{}({})", name, self.0)
    }
}

/// Protocol version for compatibility checking
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
pub struct ProtocolVersion {
    pub major: u16,
    pub minor: u16,
}

impl ProtocolVersion {
    /// Current protocol version
    pub const CURRENT: ProtocolVersion = ProtocolVersion { major: 1, minor: 0 };
    
    /// Create new version
    pub fn new(major: u16, minor: u16) -> Self {
        Self { major, minor }
    }
    
    /// Check compatibility with another version
    pub fn is_compatible(&self, other: &ProtocolVersion) -> bool {
        // Compatible if major versions match
        self.major == other.major
    }
}

impl Default for ProtocolVersion {
    fn default() -> Self {
        Self::CURRENT
    }
}

impl Display for ProtocolVersion {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        write!(f, "{}.{}", self.major, self.minor)
    }
}

/// Message header containing routing and metadata information
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct MessageHeader {
    /// Unique message identifier
    pub id: MessageId,
    /// Optional correlation ID for request/response pairing
    pub correlation_id: Option<MessageId>,
    /// Type of message
    pub message_type: MessageType,
    /// Source endpoint identifier
    pub source: EndpointId,
    /// Target endpoint identifier
    pub target: EndpointId,
    /// Message creation timestamp
    pub timestamp: DateTime<Utc>,
    /// Optional time-to-live duration
    pub ttl: Option<Duration>,
    /// Message priority for routing
    pub priority: Priority,
    /// Protocol version
    pub version: ProtocolVersion,
}

impl MessageHeader {
    /// Create new header with required fields
    pub fn new(
        message_type: MessageType,
        source: EndpointId,
        target: EndpointId,
    ) -> Self {
        Self {
            id: MessageId::new(),
            correlation_id: None,
            message_type,
            source,
            target,
            timestamp: Utc::now(),
            ttl: None,
            priority: Priority::NORMAL,
            version: ProtocolVersion::CURRENT,
        }
    }
    
    /// Check if message has expired based on TTL
    pub fn is_expired(&self) -> bool {
        if let Some(ttl) = self.ttl {
            let age = Utc::now().signed_duration_since(self.timestamp);
            let ttl_chrono = chrono::Duration::from_std(ttl).unwrap_or(chrono::Duration::zero());
            age > ttl_chrono
        } else {
            false
        }
    }
    
    /// Get message age
    pub fn age(&self) -> Duration {
        let age = Utc::now().signed_duration_since(self.timestamp);
        age.to_std().unwrap_or(Duration::ZERO)
    }
    
    /// Set correlation ID for request/response pairing
    pub fn with_correlation_id(mut self, id: MessageId) -> Self {
        self.correlation_id = Some(id);
        self
    }
    
    /// Set TTL for message expiration
    pub fn with_ttl(mut self, ttl: Duration) -> Self {
        self.ttl = Some(ttl);
        self
    }
    
    /// Set message priority
    pub fn with_priority(mut self, priority: Priority) -> Self {
        self.priority = priority;
        self
    }
}

/// Complete message envelope containing header, payload, and metadata
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Message<T> {
    /// Message header with routing information
    pub header: MessageHeader,
    /// Message payload (generic type)
    pub payload: T,
    /// Optional metadata as key-value pairs
    pub metadata: HashMap<String, serde_json::Value>,
}

impl<T> Message<T> {
    /// Create new message with header and payload
    pub fn new(header: MessageHeader, payload: T) -> Self {
        Self {
            header,
            payload,
            metadata: HashMap::new(),
        }
    }
    
    /// Create message builder
    pub fn builder() -> crate::builder::MessageBuilder<T> {
        crate::builder::MessageBuilder::new()
    }
    
    /// Add metadata entry
    pub fn with_metadata(mut self, key: impl Into<String>, value: serde_json::Value) -> Self {
        self.metadata.insert(key.into(), value);
        self
    }
    
    /// Get metadata value
    pub fn get_metadata(&self, key: &str) -> Option<&serde_json::Value> {
        self.metadata.get(key)
    }
    
    /// Check if message has expired
    pub fn is_expired(&self) -> bool {
        self.header.is_expired()
    }
    
    /// Get message age
    pub fn age(&self) -> Duration {
        self.header.age()
    }
    
    /// Transform payload type
    pub fn map_payload<U, F>(self, f: F) -> Message<U>
    where
        F: FnOnce(T) -> U,
    {
        Message {
            header: self.header,
            payload: f(self.payload),
            metadata: self.metadata,
        }
    }
}

impl<T> Message<T>
where
    T: Serialize + for<'de> Deserialize<'de>,
{
    /// Serialize message to bytes
    pub fn to_bytes(&self) -> Result<Vec<u8>, MessageError> {
        let bytes = serde_json::to_vec(self)?;
        Ok(bytes)
    }
    
    /// Deserialize message from bytes
    pub fn from_bytes(bytes: &[u8]) -> Result<Self, MessageError> {
        let message = serde_json::from_slice(bytes)?;
        Ok(message)
    }
}