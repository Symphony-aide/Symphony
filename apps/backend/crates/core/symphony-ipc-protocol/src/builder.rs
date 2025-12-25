//! Builder pattern implementation for message construction

use std::collections::HashMap;
use std::time::Duration;

use crate::error::MessageError;
use crate::message::{
    EndpointId, Message, MessageHeader, MessageId, MessageType, Priority, ProtocolVersion,
};

/// Fluent builder for constructing messages
#[derive(Debug)]
pub struct MessageBuilder<T> {
    message_type: Option<MessageType>,
    source: Option<EndpointId>,
    target: Option<EndpointId>,
    correlation_id: Option<MessageId>,
    ttl: Option<Duration>,
    priority: Priority,
    version: ProtocolVersion,
    payload: Option<T>,
    metadata: HashMap<String, serde_json::Value>,
}

impl<T> MessageBuilder<T> {
    /// Create new builder
    pub fn new() -> Self {
        Self {
            message_type: None,
            source: None,
            target: None,
            correlation_id: None,
            ttl: None,
            priority: Priority::NORMAL,
            version: ProtocolVersion::CURRENT,
            payload: None,
            metadata: HashMap::new(),
        }
    }
    
    /// Set message type
    pub fn message_type(mut self, msg_type: MessageType) -> Self {
        self.message_type = Some(msg_type);
        self
    }
    
    /// Set source endpoint
    pub fn source(mut self, source: impl Into<EndpointId>) -> Self {
        self.source = Some(source.into());
        self
    }
    
    /// Set target endpoint
    pub fn target(mut self, target: impl Into<EndpointId>) -> Self {
        self.target = Some(target.into());
        self
    }
    
    /// Set correlation ID
    pub fn correlation_id(mut self, id: MessageId) -> Self {
        self.correlation_id = Some(id);
        self
    }
    
    /// Set TTL
    pub fn ttl(mut self, ttl: Duration) -> Self {
        self.ttl = Some(ttl);
        self
    }
    
    /// Set priority
    pub fn priority(mut self, priority: Priority) -> Self {
        self.priority = priority;
        self
    }
    
    /// Set protocol version
    pub fn version(mut self, version: ProtocolVersion) -> Self {
        self.version = version;
        self
    }
    
    /// Set payload
    pub fn payload(mut self, payload: T) -> Self {
        self.payload = Some(payload);
        self
    }
    
    /// Add metadata entry
    pub fn metadata(mut self, key: impl Into<String>, value: serde_json::Value) -> Self {
        self.metadata.insert(key.into(), value);
        self
    }
    
    /// Build the message
    pub fn build(self) -> Result<Message<T>, MessageError> {
        #[cfg(debug_assertions)]
        log::debug!("[DUCK DEBUGGING]: Building message with type {:?}", self.message_type);
        
        // Validate required fields
        let message_type = self.message_type.ok_or(MessageError::MissingField("message_type"))?;
        let source = self.source.ok_or(MessageError::MissingField("source"))?;
        let target = self.target.ok_or(MessageError::MissingField("target"))?;
        let payload = self.payload.ok_or(MessageError::MissingField("payload"))?;
        
        #[cfg(debug_assertions)]
        log::debug!("[DUCK DEBUGGING]: Message validation passed, creating header");
        
        // Create header
        let mut header = MessageHeader::new(message_type, source, target);
        
        // Apply optional fields
        if let Some(correlation_id) = self.correlation_id {
            header = header.with_correlation_id(correlation_id);
        }
        
        if let Some(ttl) = self.ttl {
            header = header.with_ttl(ttl);
        }
        
        header = header.with_priority(self.priority);
        header.version = self.version;
        
        // Create message
        let mut message = Message::new(header, payload);
        message.metadata = self.metadata;
        
        #[cfg(debug_assertions)]
        log::debug!("[DUCK DEBUGGING]: Message built successfully with ID {}", message.header.id);
        
        Ok(message)
    }
}

impl<T> Default for MessageBuilder<T> {
    fn default() -> Self {
        Self::new()
    }
}

// Convenience implementations for common endpoint types
impl From<&str> for EndpointId {
    fn from(s: &str) -> Self {
        EndpointId::new(s)
    }
}

impl From<String> for EndpointId {
    fn from(s: String) -> Self {
        EndpointId::new(s)
    }
}