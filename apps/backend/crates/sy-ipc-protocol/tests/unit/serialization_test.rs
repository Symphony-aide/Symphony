//! Unit tests for serialization formats
//!
//! Tests MessagePack, Bincode, and JSON serialization with performance validation.

mod factory;

use sy_commons::debug::duck;
use sy_ipc_protocol::{
	MessageEnvelope, MessageSerializer, MessageType, SerializationError, SerializationFormat,
};

// Import factory module
use factory::MessageEnvelopeTestFactory;

#[cfg(feature = "unit")]
mod serialization_tests {
	use super::*;
	use rstest::*;
	use std::time::Instant;

	#[fixture]
	fn sample_envelope() -> MessageEnvelope<String> {
		MessageEnvelopeTestFactory::with_string_payload()
	}

	#[test]
	fn test_message_serializer_creation() {
		duck!("Testing MessageSerializer creation");

		let messagepack_serializer = MessageSerializer::message_pack();
		let bincode_serializer = MessageSerializer::bincode();
		let json_serializer = MessageSerializer::json();

		assert_eq!(messagepack_serializer.format(), SerializationFormat::MessagePack);
		assert_eq!(bincode_serializer.format(), SerializationFormat::Bincode);
		assert_eq!(json_serializer.format(), SerializationFormat::Json);

		assert_eq!(messagepack_serializer.content_type(), "application/msgpack");
		assert_eq!(bincode_serializer.content_type(), "application/octet-stream");
		assert_eq!(json_serializer.content_type(), "application/json");
	}

	#[tokio::test]
	async fn test_messagepack_serialization() {
		duck!("Testing MessagePack serialization");

		let envelope = MessageEnvelopeTestFactory::with_type(MessageType::PitOperation);
		let serializer = sy_ipc_protocol::serialize::MessagePackSerializer;

		let start = Instant::now();
		let serialized = serializer.serialize(&envelope).await.unwrap();
		let duration = start.elapsed();

		// Performance requirement: Allow more time for debug builds
		assert!(
			duration.as_micros() < 5000,
			"MessagePack serialization took {}μs, expected <5000μs",
			duration.as_micros()
		);
		assert!(!serialized.is_empty());
		assert_eq!(serializer.format(), SerializationFormat::MessagePack);
		assert_eq!(serializer.content_type(), "application/msgpack");
	}

	#[tokio::test]
	async fn test_messagepack_round_trip() {
		duck!("Testing MessagePack round-trip");

		let original = MessageEnvelopeTestFactory::with_type(MessageType::ExtensionCommand);
		let serializer = sy_ipc_protocol::serialize::MessagePackSerializer;

		let serialized = serializer.serialize(&original).await.unwrap();
		let deserialized: MessageEnvelope<String> =
			serializer.deserialize(&serialized).await.unwrap();

		assert_eq!(original.message_type, deserialized.message_type);
		assert_eq!(original.correlation_id, deserialized.correlation_id);
	}

	#[tokio::test]
	async fn test_bincode_serialization() {
		duck!("Testing Bincode serialization");

		let envelope = MessageEnvelopeTestFactory::with_type(MessageType::ConductorDecision);
		let serializer = sy_ipc_protocol::serialize::BincodeSerializer;

		let start = Instant::now();
		let serialized = serializer.serialize(&envelope).await.unwrap();
		let duration = start.elapsed();

		// Performance requirement: Allow more time for debug builds
		assert!(
			duration.as_micros() < 5000,
			"Bincode serialization took {}μs, expected <5000μs",
			duration.as_micros()
		);
		assert!(!serialized.is_empty());
		assert_eq!(serializer.format(), SerializationFormat::Bincode);
		assert_eq!(serializer.content_type(), "application/octet-stream");
	}

	#[tokio::test]
	async fn test_bincode_round_trip() {
		duck!("Testing Bincode round-trip");

		let original = MessageEnvelopeTestFactory::with_type(MessageType::DataAccess);
		let serializer = sy_ipc_protocol::serialize::BincodeSerializer;

		let serialized = serializer.serialize(&original).await.unwrap();
		let deserialized: MessageEnvelope<String> =
			serializer.deserialize(&serialized).await.unwrap();

		assert_eq!(original.message_type, deserialized.message_type);
		assert_eq!(original.correlation_id, deserialized.correlation_id);
	}

	#[tokio::test]
	async fn test_json_serialization() {
		duck!("Testing JSON serialization");

		let envelope = MessageEnvelopeTestFactory::with_type(MessageType::XiRequest);
		let serializer = sy_ipc_protocol::serialize::JsonSerializer;

		let serialized = serializer.serialize(&envelope).await.unwrap();
		assert!(!serialized.is_empty());
		assert_eq!(serializer.format(), SerializationFormat::Json);
		assert_eq!(serializer.content_type(), "application/json");

		// Verify it's valid JSON
		let _: serde_json::Value = serde_json::from_slice(&serialized).unwrap();
	}

	#[tokio::test]
	async fn test_serialization_formats_messagepack() {
		duck!("Testing serialization format: MessagePack");

		let envelope = MessageEnvelopeTestFactory::with_type(MessageType::SystemEvent);

		let serializer = sy_ipc_protocol::MessageSerializer::message_pack();

		let serialized = serializer.serialize(&envelope).await.unwrap();
		let deserialized: MessageEnvelope<String> =
			serializer.deserialize(&serialized).await.unwrap();

		assert_eq!(envelope.message_type, deserialized.message_type);
	}

	#[tokio::test]
	async fn test_serialization_formats_bincode() {
		duck!("Testing serialization format: Bincode");

		let envelope = MessageEnvelopeTestFactory::with_type(MessageType::SystemEvent);

		let serializer = sy_ipc_protocol::MessageSerializer::bincode();

		let serialized = serializer.serialize(&envelope).await.unwrap();
		let deserialized: MessageEnvelope<String> =
			serializer.deserialize(&serialized).await.unwrap();

		assert_eq!(envelope.message_type, deserialized.message_type);
	}

	#[tokio::test]
	async fn test_serialization_formats_json() {
		duck!("Testing serialization format: Json");

		let envelope = MessageEnvelopeTestFactory::with_type(MessageType::SystemEvent);

		let serializer = sy_ipc_protocol::MessageSerializer::json();

		let serialized = serializer.serialize(&envelope).await.unwrap();
		let deserialized: MessageEnvelope<String> =
			serializer.deserialize(&serialized).await.unwrap();

		assert_eq!(envelope.message_type, deserialized.message_type);
	}

	#[tokio::test]
	async fn test_serialization_error_handling() {
		duck!("Testing serialization error handling");

		let serializer = sy_ipc_protocol::serialize::MessagePackSerializer;

		// Test deserialization with invalid data
		let invalid_data = b"invalid messagepack data";
		let result: Result<MessageEnvelope<String>, SerializationError> =
			serializer.deserialize(invalid_data).await;

		assert!(result.is_err());
		match result.unwrap_err() {
			SerializationError::MessagePackError(_) => {}, // Expected
			other => panic!("Expected MessagePackError, got {:?}", other),
		}
	}
}
