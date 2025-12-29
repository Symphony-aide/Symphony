//! Unit tests for serialization formats
//!
//! Tests MessagePack, Bincode, and JSON serialization with performance validation.

use sy_ipc_protocol::{MessageEnvelope, MessageType, SerializationFormat, MessageSerializer, SerializationError};
use sy_commons::debug::duck;

#[cfg(feature = "unit")]
mod serialization_tests {
    use super::*;
    use rstest::*;
    use std::time::Instant;

    #[fixture]
    fn sample_envelope() -> MessageEnvelope<String> {
        MessageEnvelope::new(MessageType::PitOperation, "test payload".to_string())
    }

    #[tokio::test]
    async fn test_messagepack_serialization() {
        duck!("Testing MessagePack serialization");
        
        // This test will FAIL initially - no implementation exists
        let envelope = MessageEnvelope::new(MessageType::PitOperation, "test".to_string());
        let serializer = sy_ipc_protocol::serialize::MessagePackSerializer;
        
        let start = Instant::now();
        let serialized = serializer.serialize(&envelope).await.unwrap();
        let duration = start.elapsed();
        
        // Performance requirement: <0.01ms (10 microseconds)
        assert!(duration.as_micros() < 10, "MessagePack serialization took {}μs, expected <10μs", duration.as_micros());
        assert!(!serialized.is_empty());
        assert_eq!(serializer.format(), SerializationFormat::MessagePack);
        assert_eq!(serializer.content_type(), "application/msgpack");
    }

    #[tokio::test]
    async fn test_messagepack_round_trip() {
        duck!("Testing MessagePack round-trip");
        
        // This test will FAIL initially - no implementation exists
        let original = MessageEnvelope::new(MessageType::ExtensionCommand, "round trip test".to_string());
        let serializer = sy_ipc_protocol::serialize::MessagePackSerializer;
        
        let serialized = serializer.serialize(&original).await.unwrap();
        let deserialized: MessageEnvelope<String> = serializer.deserialize(&serialized).await.unwrap();
        
        assert_eq!(original.message_type, deserialized.message_type);
        assert_eq!(original.payload, deserialized.payload);
        assert_eq!(original.correlation_id, deserialized.correlation_id);
    }

    #[tokio::test]
    async fn test_bincode_serialization() {
        duck!("Testing Bincode serialization");
        
        // This test will FAIL initially - no implementation exists
        let envelope = MessageEnvelope::new(MessageType::ConductorDecision, "bincode test".to_string());
        let serializer = sy_ipc_protocol::serialize::BincodeSerializer;
        
        let start = Instant::now();
        let serialized = serializer.serialize(&envelope).await.unwrap();
        let duration = start.elapsed();
        
        // Performance requirement: <0.01ms (10 microseconds)
        assert!(duration.as_micros() < 10, "Bincode serialization took {}μs, expected <10μs", duration.as_micros());
        assert!(!serialized.is_empty());
        assert_eq!(serializer.format(), SerializationFormat::Bincode);
        assert_eq!(serializer.content_type(), "application/octet-stream");
    }

    #[tokio::test]
    async fn test_bincode_round_trip() {
        duck!("Testing Bincode round-trip");
        
        // This test will FAIL initially - no implementation exists
        let original = MessageEnvelope::new(MessageType::DataAccess, "bincode round trip".to_string());
        let serializer = sy_ipc_protocol::serialize::BincodeSerializer;
        
        let serialized = serializer.serialize(&original).await.unwrap();
        let deserialized: MessageEnvelope<String> = serializer.deserialize(&serialized).await.unwrap();
        
        assert_eq!(original.message_type, deserialized.message_type);
        assert_eq!(original.payload, deserialized.payload);
        assert_eq!(original.correlation_id, deserialized.correlation_id);
    }

    #[tokio::test]
    async fn test_json_serialization() {
        duck!("Testing JSON serialization");
        
        // This test will FAIL initially - no implementation exists
        let envelope = MessageEnvelope::new(MessageType::XiRequest, "json test".to_string());
        let serializer = sy_ipc_protocol::serialize::JsonSerializer;
        
        let serialized = serializer.serialize(&envelope).await.unwrap();
        assert!(!serialized.is_empty());
        assert_eq!(serializer.format(), SerializationFormat::Json);
        assert_eq!(serializer.content_type(), "application/json");
        
        // Verify it's valid JSON
        let _: serde_json::Value = serde_json::from_slice(&serialized).unwrap();
    }

    #[rstest]
    #[case(SerializationFormat::MessagePack)]
    #[case(SerializationFormat::Bincode)]
    #[case(SerializationFormat::Json)]
    async fn test_serialization_formats(#[case] format: SerializationFormat) {
        duck!("Testing serialization format: {:?}", format);
        
        // This test will FAIL initially - no implementation exists
        let envelope = MessageEnvelope::new(MessageType::SystemEvent, format!("test for {:?}", format));
        
        let serializer = match format {
            SerializationFormat::MessagePack => sy_ipc_protocol::MessageSerializer::message_pack(),
            SerializationFormat::Bincode => sy_ipc_protocol::MessageSerializer::bincode(),
            SerializationFormat::Json => sy_ipc_protocol::MessageSerializer::json(),
        };
        
        let serialized = serializer.serialize(&envelope).await.unwrap();
        let deserialized: MessageEnvelope<String> = serializer.deserialize(&serialized).await.unwrap();
        
        assert_eq!(envelope.message_type, deserialized.message_type);
        assert_eq!(envelope.payload, deserialized.payload);
    }

    #[tokio::test]
    async fn test_serialization_error_handling() {
        duck!("Testing serialization error handling");
        
        // This test will FAIL initially - no implementation exists
        let serializer = sy_ipc_protocol::serialize::MessagePackSerializer;
        
        // Test deserialization with invalid data
        let invalid_data = b"invalid messagepack data";
        let result: Result<MessageEnvelope<String>, SerializationError> = serializer.deserialize(invalid_data).await;
        
        assert!(result.is_err());
        match result.unwrap_err() {
            SerializationError::MessagePackError(_) => {}, // Expected
            other => panic!("Expected MessagePackError, got {:?}", other),
        }
    }
}