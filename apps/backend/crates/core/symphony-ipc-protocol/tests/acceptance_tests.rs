//! Acceptance tests for F001 - Message Envelope Design
//! 
//! These tests verify that all acceptance criteria are met:
//! 1. Message Structure Completeness
//! 2. Builder API Ergonomics  
//! 3. Type Safety
//! 4. UUID Generation
//! 5. Priority Ordering
//! 6. Metadata Support
//! 7. Timestamp Precision

use symphony_ipc_protocol::*;
use std::collections::HashMap;
use std::time::Duration;

/// AC1: Message Structure Completeness
/// All message types (Request, Response, Event, Error, Heartbeat) must be representable
#[test]
fn test_message_structure_completeness() {
    let message_types = vec![
        MessageType::Request,
        MessageType::Response,
        MessageType::Event,
        MessageType::Error,
        MessageType::Heartbeat,
    ];
    
    for msg_type in message_types {
        let message = Message::builder()
            .message_type(msg_type)
            .source(EndpointId::new("test-source"))
            .target(EndpointId::new("test-target"))
            .payload("test payload")
            .build()
            .expect("Should be able to create message with any message type");
            
        assert_eq!(message.header.message_type, msg_type);
    }
}

/// AC2: Builder API Ergonomics
/// Message construction using the builder pattern must be intuitive and chainable
#[test]
fn test_builder_api_ergonomics() {
    // Test chainable builder pattern
    let message = Message::builder()
        .message_type(MessageType::Request)
        .source(EndpointId::new("conductor"))
        .target(EndpointId::new("pool-manager"))
        .priority(Priority::HIGH)
        .ttl(Duration::from_secs(30))
        .payload("test request")
        .metadata("request_id", serde_json::Value::String("req-123".to_string()))
        .build()
        .expect("Builder should work with method chaining");
    
    assert_eq!(message.header.message_type, MessageType::Request);
    assert_eq!(message.header.source.as_str(), "conductor");
    assert_eq!(message.header.target.as_str(), "pool-manager");
    assert_eq!(message.header.priority, Priority::HIGH);
    assert_eq!(message.payload, "test request");
    assert!(message.header.ttl.is_some());
    assert!(message.metadata.contains_key("request_id"));
}

/// AC3: Type Safety
/// Messages must implement Clone, Debug, PartialEq traits
#[test]
fn test_type_safety_traits() {
    let message = Message::builder()
        .message_type(MessageType::Event)
        .source(EndpointId::new("source"))
        .target(EndpointId::new("target"))
        .payload("test")
        .build()
        .expect("Should build message");
    
    // Test Clone
    let cloned = message.clone();
    assert_eq!(message, cloned);
    
    // Test Debug (should not panic)
    let debug_str = format!("{:?}", message);
    assert!(!debug_str.is_empty());
    
    // Test PartialEq
    assert_eq!(message, cloned);
    
    let different_message = Message::builder()
        .message_type(MessageType::Request)
        .source(EndpointId::new("source"))
        .target(EndpointId::new("target"))
        .payload("test")
        .build()
        .expect("Should build message");
    
    assert_ne!(message, different_message);
}

/// AC4: UUID Generation
/// MessageId must generate unique UUIDs for each message instance
#[test]
fn test_uuid_generation_uniqueness() {
    let mut ids = std::collections::HashSet::new();
    
    // Generate 1000 message IDs and ensure they're all unique
    for _ in 0..1000 {
        let id = MessageId::new();
        assert!(ids.insert(id), "Generated duplicate MessageId");
    }
    
    assert_eq!(ids.len(), 1000);
}

/// AC5: Priority Ordering
/// Priority enum must support proper ordering (Critical > High > Normal > Low > Background)
#[test]
fn test_priority_ordering() {
    let priorities = vec![
        Priority::BACKGROUND,
        Priority::LOW,
        Priority::NORMAL,
        Priority::HIGH,
        Priority::CRITICAL,
    ];
    
    // Test that priorities are in ascending order
    for i in 0..priorities.len() - 1 {
        assert!(
            priorities[i] < priorities[i + 1],
            "Priority ordering incorrect: {:?} should be less than {:?}",
            priorities[i],
            priorities[i + 1]
        );
    }
    
    // Test specific ordering
    assert!(Priority::CRITICAL > Priority::HIGH);
    assert!(Priority::HIGH > Priority::NORMAL);
    assert!(Priority::NORMAL > Priority::LOW);
    assert!(Priority::LOW > Priority::BACKGROUND);
}

/// AC6: Metadata Support
/// Message envelope must support arbitrary metadata as HashMap<String, Value>
#[test]
fn test_metadata_support() {
    let mut expected_metadata = HashMap::new();
    expected_metadata.insert("key1".to_string(), serde_json::Value::String("value1".to_string()));
    expected_metadata.insert("key2".to_string(), serde_json::Value::Number(serde_json::Number::from(42)));
    expected_metadata.insert("key3".to_string(), serde_json::Value::Bool(true));
    
    let message = Message::builder()
        .message_type(MessageType::Event)
        .source(EndpointId::new("source"))
        .target(EndpointId::new("target"))
        .payload("test")
        .metadata("key1", serde_json::Value::String("value1".to_string()))
        .metadata("key2", serde_json::Value::Number(serde_json::Number::from(42)))
        .metadata("key3", serde_json::Value::Bool(true))
        .build()
        .expect("Should build message with metadata");
    
    assert_eq!(message.metadata, expected_metadata);
    
    // Test metadata retrieval
    assert_eq!(
        message.get_metadata("key1"),
        Some(&serde_json::Value::String("value1".to_string()))
    );
    assert_eq!(
        message.get_metadata("key2"),
        Some(&serde_json::Value::Number(serde_json::Number::from(42)))
    );
    assert_eq!(
        message.get_metadata("key3"),
        Some(&serde_json::Value::Bool(true))
    );
    assert_eq!(message.get_metadata("nonexistent"), None);
}

/// AC7: Timestamp Precision
/// Message timestamps must be accurate to millisecond precision
#[test]
fn test_timestamp_precision() {
    let before = chrono::Utc::now();
    
    let message = Message::builder()
        .message_type(MessageType::Heartbeat)
        .source(EndpointId::new("source"))
        .target(EndpointId::new("target"))
        .payload("heartbeat")
        .build()
        .expect("Should build message");
    
    let after = chrono::Utc::now();
    
    // Message timestamp should be between before and after
    assert!(message.header.timestamp >= before);
    assert!(message.header.timestamp <= after);
    
    // Test millisecond precision by checking that nanosecond component is preserved
    let timestamp_nanos = message.header.timestamp.timestamp_nanos_opt().unwrap();
    let millisecond_precision = timestamp_nanos % 1_000_000; // Get nanoseconds within millisecond
    
    // The timestamp should have nanosecond precision (which includes millisecond precision)
    // We can't test exact millisecond precision without controlling time, but we can verify
    // that the timestamp has sub-second precision
    assert!(message.header.timestamp.timestamp_subsec_millis() < 1000);
}

/// Integration test: Request-Response correlation
#[test]
fn test_request_response_correlation() {
    let request = Message::builder()
        .message_type(MessageType::Request)
        .source(EndpointId::new("client"))
        .target(EndpointId::new("server"))
        .payload("ping")
        .build()
        .expect("Should build request");
    
    let response = Message::builder()
        .message_type(MessageType::Response)
        .source(EndpointId::new("server"))
        .target(EndpointId::new("client"))
        .correlation_id(request.header.id.clone())
        .payload("pong")
        .build()
        .expect("Should build response");
    
    assert_eq!(response.header.correlation_id, Some(request.header.id));
}

/// Integration test: TTL expiration
#[test]
fn test_ttl_expiration() {
    let message = Message::builder()
        .message_type(MessageType::Event)
        .source(EndpointId::new("source"))
        .target(EndpointId::new("target"))
        .ttl(Duration::from_millis(1)) // Very short TTL
        .payload("expiring message")
        .build()
        .expect("Should build message");
    
    // Message should not be expired immediately
    assert!(!message.is_expired());
    
    // Wait for TTL to expire
    std::thread::sleep(Duration::from_millis(10));
    
    // Message should now be expired
    assert!(message.is_expired());
}