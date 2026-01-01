//! Test factories for sy-ipc-bus
//!
//! This module provides factory structs for generating test data following the mandatory
//! factory-based testing patterns. ZERO TOLERANCE for hardcoded test data.

#![allow(clippy::must_use_candidate)]
#![allow(clippy::missing_const_for_fn)]
#![allow(clippy::uninlined_format_args)]

use sy_commons::testing::safe_generator;
use sy_ipc_protocol::{MessageType, MessageMetadata, MessagePriority};
use sy_ipc_bus::MessageEnvelope;

/// Factory for generating correlation IDs
pub struct CorrelationIdTestFactory;

impl CorrelationIdTestFactory {
    /// Generate a valid correlation ID
    pub fn valid() -> String {
        let id = safe_generator().next_unique_id();
        format!("corr-{:016x}", id)
    }
    
    /// Generate an invalid correlation ID (empty)
    pub fn invalid() -> String {
        String::new()
    }
    
    /// Generate a unique correlation ID for each call
    pub fn unique() -> String {
        let id = safe_generator().next_unique_id();
        format!("unique-corr-{:016x}", id)
    }
}

/// Factory for generating routing keys
pub struct RoutingKeyTestFactory;

impl RoutingKeyTestFactory {
    /// Generate a valid routing key
    pub fn valid() -> String {
        let id = safe_generator().next_unique_id();
        format!("service.action.{}", id)
    }
    
    /// Generate a wildcard routing pattern
    pub fn wildcard_pattern() -> String {
        "service.*".to_string()
    }
    
    /// Generate a regex routing pattern
    pub fn regex_pattern() -> String {
        r"service\.[0-9]+".to_string()
    }
    
    /// Generate an invalid routing key (empty)
    pub fn invalid() -> String {
        String::new()
    }
    
    /// Generate a specific routing key for testing
    pub fn specific(service: &str, action: &str) -> String {
        format!("{}.{}", service, action)
    }
}

/// Factory for generating endpoint IDs
pub struct EndpointIdTestFactory;

impl EndpointIdTestFactory {
    /// Generate a valid endpoint ID
    pub fn valid() -> String {
        let id = safe_generator().next_unique_id();
        format!("endpoint-{:08x}", id)
    }
    
    /// Generate an invalid endpoint ID (empty)
    pub fn invalid() -> String {
        String::new()
    }
    
    /// Generate a specific endpoint ID
    pub fn specific(name: &str) -> String {
        let id = safe_generator().next_unique_id();
        format!("{}-{:08x}", name, id)
    }
}

/// Factory for generating message envelopes
pub struct MessageEnvelopeTestFactory;

impl MessageEnvelopeTestFactory {
    /// Generate a valid request message
    pub fn request() -> MessageEnvelope {
        let id = safe_generator().next_unique_id();
        let _metadata = MessageMetadata {
            priority: MessagePriority::Normal,
            routing_hints: vec![],
            timeout_ms: Some(30000),
            retry_count: 0,
            source_component: EndpointIdTestFactory::valid(),
            target_component: Some(EndpointIdTestFactory::valid()),
        };
        
        MessageEnvelope::new(
            MessageType::PitOperation,
            format!("request-payload-{}", id).into_bytes(),
        )
    }
    
    /// Generate a valid response message
    pub fn response() -> MessageEnvelope {
        let id = safe_generator().next_unique_id();
        MessageEnvelope::new(
            MessageType::SystemEvent,
            format!("response-payload-{}", id).into_bytes(),
        )
    }
    
    /// Generate a valid notification message
    pub fn notification() -> MessageEnvelope {
        let id = safe_generator().next_unique_id();
        MessageEnvelope::new(
            MessageType::ExtensionCommand,
            format!("notification-payload-{}", id).into_bytes(),
        )
    }
    
    /// Generate a valid event message
    pub fn event() -> MessageEnvelope {
        let id = safe_generator().next_unique_id();
        MessageEnvelope::new(
            MessageType::DataAccess,
            format!("event-payload-{}", id).into_bytes(),
        )
    }
    
    /// Generate a message with specific routing key
    pub fn with_routing_key(_routing_key: &str) -> MessageEnvelope {
        let id = safe_generator().next_unique_id();
        MessageEnvelope::new(
            MessageType::PitOperation,
            format!("payload-{}", id).into_bytes(),
        )
    }
    
    /// Generate a message with specific correlation ID
    pub fn with_correlation_id(_correlation_id: &str) -> MessageEnvelope {
        let id = safe_generator().next_unique_id();
        let metadata = MessageMetadata {
            priority: MessagePriority::Normal,
            routing_hints: vec![],
            timeout_ms: Some(30000),
            retry_count: 0,
            source_component: EndpointIdTestFactory::valid(),
            target_component: Some(EndpointIdTestFactory::valid()),
        };
        
        MessageEnvelope::with_correlation(
            sy_ipc_protocol::CorrelationId::new(),
            MessageType::PitOperation,
            format!("payload-{}", id).into_bytes(),
            metadata,
        )
    }
}

/// Factory for generating topic names
pub struct TopicTestFactory;

impl TopicTestFactory {
    /// Generate a valid topic name
    pub fn valid() -> String {
        let id = safe_generator().next_unique_id();
        format!("events.service.{}", id)
    }
    
    /// Generate a wildcard topic pattern
    pub fn wildcard_pattern() -> String {
        "events.*".to_string()
    }
    
    /// Generate a hierarchical topic
    pub fn hierarchical() -> String {
        let id = safe_generator().next_unique_id();
        format!("events.user.created.{}", id)
    }
    
    /// Generate an invalid topic (empty)
    pub fn invalid() -> String {
        String::new()
    }
}

/// Factory for generating route priorities
pub struct PriorityTestFactory;

impl PriorityTestFactory {
    /// Generate a high priority value
    pub fn high() -> u32 {
        100
    }
    
    /// Generate a medium priority value
    pub fn medium() -> u32 {
        50
    }
    
    /// Generate a low priority value
    pub fn low() -> u32 {
        10
    }
    
    /// Generate a random priority value
    pub fn random() -> u32 {
        let id = safe_generator().next_unique_id();
        (id % 1000) as u32
    }
}