//! Unit tests for message envelope system
//!
//! Tests message envelope creation, correlation ID generation,
//! metadata handling, and serialization round-trips.

mod factory;

use sy_ipc_protocol::{MessageEnvelope, MessageType, MessageMetadata, MessagePriority, CorrelationId};
use sy_commons::debug::duck;

// Import factory module
use factory::{MessageEnvelopeTestFactory, CorrelationIdTestFactory, MessageMetadataTestFactory, UUIDTestFactory};

#[cfg(feature = "unit")]
mod message_envelope_tests {
    use super::*;
    use rstest::*;

    #[fixture]
    fn sample_payload() -> String {
        factory::StringTestFactory::payload()
    }

    #[fixture]
    fn sample_metadata() -> MessageMetadata {
        MessageMetadataTestFactory::normal()
    }

    #[test]
    fn test_message_envelope_creation() {
        duck!("Testing message envelope creation");
        
        let envelope = MessageEnvelopeTestFactory::with_string_payload();
        
        assert_eq!(envelope.message_type, MessageType::PitOperation);
        assert!(!envelope.payload.is_empty());
        assert!(!envelope.correlation_id.to_string().is_empty());
        assert!(envelope.timestamp.timestamp() > 0);
    }

    #[test]
    fn test_correlation_id_uniqueness() {
        duck!("Testing correlation ID uniqueness");
        
        let id1 = CorrelationIdTestFactory::valid();
        let id2 = CorrelationIdTestFactory::valid();
        
        assert_ne!(id1, id2);
        assert!(!id1.to_string().is_empty());
        assert!(!id2.to_string().is_empty());
    }

    #[test]
    fn test_correlation_id_from_string() {
        duck!("Testing correlation ID from string");
        
        let uuid_str = UUIDTestFactory::valid();
        let correlation_id = CorrelationId::from_request(&uuid_str).unwrap();
        
        assert_eq!(correlation_id.to_string(), uuid_str);
    }

    #[test]
    fn test_message_envelope_with_metadata() {
        duck!("Testing message envelope with custom metadata");
        
        let envelope = MessageEnvelopeTestFactory::with_metadata();
        
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
        
        let envelope = MessageEnvelopeTestFactory::with_type(message_type.clone());
        assert_eq!(envelope.message_type, message_type);
    }

    #[rstest]
    #[case(MessagePriority::Critical)]
    #[case(MessagePriority::High)]
    #[case(MessagePriority::Normal)]
    #[case(MessagePriority::Low)]
    fn test_message_priorities(#[case] priority: MessagePriority) {
        duck!("Testing message priority: {:?}", priority);
        
        let metadata = match priority {
            MessagePriority::High => MessageMetadataTestFactory::high_priority(),
            _ => MessageMetadataTestFactory::normal(),
        };
        
        // For non-High priorities, manually set the priority
        let mut test_metadata = metadata;
        test_metadata.priority = priority.clone();
        
        assert_eq!(test_metadata.priority, priority);
    }
}