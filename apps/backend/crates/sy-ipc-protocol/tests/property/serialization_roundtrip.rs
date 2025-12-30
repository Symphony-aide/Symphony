//! Property-based tests for serialization round-trips
//!
//! Uses proptest to verify that serialization preserves data integrity
//! across all supported formats with arbitrary inputs.

use sy_ipc_protocol::{MessageEnvelope, MessageType, SerializationFormat, MessageSerializer};
use sy_commons::debug::duck;

#[cfg(feature = "property")]
mod property_tests {
    use super::*;
    use proptest::prelude::*;

    // Property test strategy for MessageType
    prop_compose! {
        fn arb_message_type()(variant in 0..8u8) -> MessageType {
            match variant {
                0 => MessageType::PitOperation,
                1 => MessageType::ExtensionCommand,
                2 => MessageType::ConductorDecision,
                3 => MessageType::DataAccess,
                4 => MessageType::XiRequest,
                5 => MessageType::XiResponse,
                6 => MessageType::SystemEvent,
                _ => MessageType::HealthCheck,
            }
        }
    }

    // Property test strategy for message payloads
    prop_compose! {
        fn arb_string_payload()(s in ".*") -> String {
            s
        }
    }

    proptest! {
        #[test]
        fn messagepack_preserves_data(
            message_type in arb_message_type(),
            payload in arb_string_payload()
        ) {
            duck!("Property test: MessagePack preserves data for {:?}", message_type);
            
            // This test will FAIL initially - no implementation exists
            tokio_test::block_on(async {
                let original = MessageEnvelope::new(message_type.clone(), payload.clone());
                let serializer = sy_ipc_protocol::serialize::MessagePackSerializer;
                
                let serialized = serializer.serialize(&original).await.unwrap();
                let deserialized: MessageEnvelope<String> = serializer.deserialize(&serialized).await.unwrap();
                
                prop_assert_eq!(original.message_type, deserialized.message_type);
                prop_assert_eq!(original.payload, deserialized.payload);
                prop_assert_eq!(original.correlation_id, deserialized.correlation_id);
            });
        }

        #[test]
        fn bincode_preserves_data(
            message_type in arb_message_type(),
            payload in arb_string_payload()
        ) {
            duck!("Property test: Bincode preserves data for {:?}", message_type);
            
            // This test will FAIL initially - no implementation exists
            tokio_test::block_on(async {
                let original = MessageEnvelope::new(message_type.clone(), payload.clone());
                let serializer = sy_ipc_protocol::serialize::BincodeSerializer;
                
                let serialized = serializer.serialize(&original).await.unwrap();
                let deserialized: MessageEnvelope<String> = serializer.deserialize(&serialized).await.unwrap();
                
                prop_assert_eq!(original.message_type, deserialized.message_type);
                prop_assert_eq!(original.payload, deserialized.payload);
                prop_assert_eq!(original.correlation_id, deserialized.correlation_id);
            });
        }

        #[test]
        fn json_preserves_data(
            message_type in arb_message_type(),
            payload in arb_string_payload()
        ) {
            duck!("Property test: JSON preserves data for {:?}", message_type);
            
            // This test will FAIL initially - no implementation exists
            tokio_test::block_on(async {
                let original = MessageEnvelope::new(message_type.clone(), payload.clone());
                let serializer = sy_ipc_protocol::serialize::JsonSerializer;
                
                let serialized = serializer.serialize(&original).await.unwrap();
                let deserialized: MessageEnvelope<String> = serializer.deserialize(&serialized).await.unwrap();
                
                prop_assert_eq!(original.message_type, deserialized.message_type);
                prop_assert_eq!(original.payload, deserialized.payload);
                prop_assert_eq!(original.correlation_id, deserialized.correlation_id);
            });
        }

        #[test]
        fn correlation_ids_are_unique(
            _dummy in 0..100u32 // Generate multiple correlation IDs
        ) {
            duck!("Property test: Correlation IDs are unique");
            
            // This test will FAIL initially - no implementation exists
            let id1 = sy_ipc_protocol::CorrelationId::new();
            let id2 = sy_ipc_protocol::CorrelationId::new();
            
            prop_assert_ne!(id1, id2);
            prop_assert!(!id1.to_string().is_empty());
            prop_assert!(!id2.to_string().is_empty());
        }

        #[test]
        fn message_envelope_timestamps_are_recent(
            message_type in arb_message_type(),
            payload in arb_string_payload()
        ) {
            duck!("Property test: Message envelope timestamps are recent");
            
            // This test will FAIL initially - no implementation exists
            let before = chrono::Utc::now();
            let envelope = MessageEnvelope::new(message_type, payload);
            let after = chrono::Utc::now();
            
            prop_assert!(envelope.timestamp >= before);
            prop_assert!(envelope.timestamp <= after);
        }
    }
}