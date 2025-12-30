//! Unit tests for message envelope system
//!
//! Tests message envelope creation, correlation ID generation,
//! metadata handling, and serialization round-trips.

use sy_ipc_protocol::{MessageEnvelope, MessageType, MessageMetadata, MessagePriority, CorrelationId};
use sy_commons::debug::duck;

#[cfg(feature = "unit")]
mod message_envelope_tests {
    use super::*;
    use rstest::*;

    #[fixture]
    fn sample_payload() -> String {
        "test payload".to_string()
    }

    #[fixture]
    fn sample_metadata() -> MessageMetadata {
        MessageMetadata {
            priority: MessagePriority::Normal,
            routing_hints: vec!["test_route".to_string()],
            timeout_ms: Some(5000),
            retry_count: 0,
            source_component: "test_source".to_string(),
            target_component: Some("test_target".to_string()),
        }
    }

    #[test]
    fn test_message_envelope_creation() {
        duck!("Testing message envelope creation");
        
        // This test will FAIL initially - no implementation exists
        let envelope = MessageEnvelope::new(
            MessageType::PitOperation,
            "test payload".to_string(),
        );
        
        assert_eq!(envelope.message_type, MessageType::PitOperation);
        assert_eq!(envelope.payload, "test payload");
        assert!(!envelope.correlation_id.to_string().is_empty());
        assert!(envelope.timestamp.timestamp() > 0);
    }

    #[test]
    fn test_correlation_id_uniqueness() {
        duck!("Testing correlation ID uniqueness");
        
        // This test will FAIL initially - no implementation exists
        let id1 = CorrelationId::new();
        let id2 = CorrelationId::new();
        
        assert_ne!(id1, id2);
        assert!(!id1.to_string().is_empty());
        assert!(!id2.to_string().is_empty());
    }

    #[test]
    fn test_correlation_id_from_string() {
        duck!("Testing correlation ID from string");
        
        // This test will FAIL initially - no implementation exists
        let uuid_str = "550e8400-e29b-41d4-a716-446655440000";
        let correlation_id = CorrelationId::from_request(uuid_str).unwrap();
        
        assert_eq!(correlation_id.to_string(), uuid_str);
    }

    #[test]
    fn test_message_envelope_with_metadata() {
        duck!("Testing message envelope with custom metadata");
        
        // This test will FAIL initially - no implementation exists
        let metadata = MessageMetadata {
            priority: MessagePriority::High,
            routing_hints: vec!["urgent".to_string()],
            timeout_ms: Some(1000),
            retry_count: 0,
            source_component: "test_source".to_string(),
            target_component: Some("test_target".to_string()),
        };
        
        let envelope = MessageEnvelope::with_metadata(
            MessageType::ExtensionCommand,
            "urgent payload".to_string(),
            metadata.clone(),
        );
        
        assert_eq!(envelope.message_type, MessageType::ExtensionCommand);
        assert_eq!(envelope.metadata.priority, MessagePriority::High);
        assert_eq!(envelope.metadata.routing_hints, vec!["urgent"]);
        assert_eq!(envelope.metadata.timeout_ms, Some(1000));
    }

    #[rstest]
    #[case(MessageType::PitOperation)]
    #[case(MessageType::ExtensionCommand)]
    #[case(MessageType::ConductorDecision)]
    #[case(MessageType::XiRequest)]
    fn test_message_types(#[case] message_type: MessageType) {
        duck!("Testing message type: {:?}", message_type);
        
        // This test will FAIL initially - no implementation exists
        let envelope = MessageEnvelope::new(message_type.clone(), "test".to_string());
        assert_eq!(envelope.message_type, message_type);
    }

    #[rstest]
    #[case(MessagePriority::Critical)]
    #[case(MessagePriority::High)]
    #[case(MessagePriority::Normal)]
    #[case(MessagePriority::Low)]
    fn test_message_priorities(#[case] priority: MessagePriority) {
        duck!("Testing message priority: {:?}", priority);
        
        // This test will FAIL initially - no implementation exists
        let metadata = MessageMetadata {
            priority: priority.clone(),
            routing_hints: vec![],
            timeout_ms: None,
            retry_count: 0,
            source_component: "test".to_string(),
            target_component: None,
        };
        
        assert_eq!(metadata.priority, priority);
    }
}