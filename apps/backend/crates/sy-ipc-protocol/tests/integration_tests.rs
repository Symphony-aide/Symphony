//! Integration tests for sy-ipc-protocol
//!
//! Tests the complete message protocol functionality including
//! serialization, JSON-RPC compliance, and schema validation.

#![allow(clippy::similar_names)] // serializer/serialized is clear in context
#![allow(clippy::unwrap_used)] // Acceptable in tests for known good values
#![allow(clippy::redundant_clone)] // May be needed for test isolation
#![allow(clippy::panic)] // Acceptable in tests for assertion failures

mod factory;

#[cfg(feature = "unit")]
mod message_envelope_tests {
	use crate::factory;
	use sy_commons::debug::duck;
	use sy_ipc_protocol::{CorrelationId, MessagePriority, MessageType};

	#[test]
	fn test_message_envelope_creation() {
		duck!("Testing message envelope creation");

		let envelope = factory::MessageEnvelopeTestFactory::with_string_payload();

		assert_eq!(envelope.message_type, MessageType::PitOperation);
		assert!(!envelope.payload.is_empty());
		assert!(!envelope.correlation_id.to_string().is_empty());
		assert!(envelope.timestamp.timestamp() > 0);
	}

	#[test]
	fn test_correlation_id_uniqueness() {
		duck!("Testing correlation ID uniqueness");

		let id1 = factory::CorrelationIdTestFactory::valid();
		let id2 = factory::CorrelationIdTestFactory::valid();

		assert_ne!(id1, id2);
		assert!(!id1.to_string().is_empty());
		assert!(!id2.to_string().is_empty());
	}

	#[test]
	fn test_correlation_id_from_string() {
		duck!("Testing correlation ID from string");

		let uuid_str = factory::UUIDTestFactory::valid();
		let correlation_id = CorrelationId::from_request(&uuid_str).unwrap();

		assert_eq!(correlation_id.to_string(), uuid_str);
	}

	#[test]
	fn test_message_envelope_with_metadata() {
		duck!("Testing message envelope with custom metadata");

		let envelope = factory::MessageEnvelopeTestFactory::with_metadata();

		assert_eq!(envelope.message_type, MessageType::ExtensionCommand);
		assert_eq!(envelope.metadata.priority, MessagePriority::High);
		assert_eq!(envelope.metadata.routing_hints, vec!["urgent"]);
		assert_eq!(envelope.metadata.timeout_ms, Some(1000));
	}
}

#[cfg(feature = "unit")]
mod serialization_tests {
	use crate::factory;
	use std::time::Instant;
	use sy_commons::debug::duck;
	use sy_ipc_protocol::{MessageEnvelope, MessageSerializer, MessageType, SerializationFormat};

	#[tokio::test]
	async fn test_messagepack_serialization() {
		duck!("Testing MessagePack serialization");

		let envelope = factory::MessageEnvelopeTestFactory::with_type(MessageType::PitOperation);
		let serializer = MessageSerializer::message_pack();

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

		let original =
			factory::MessageEnvelopeTestFactory::with_type(MessageType::ExtensionCommand);
		let serializer = MessageSerializer::message_pack();

		let serialized = serializer.serialize(&original).await.unwrap();
		let deserialized: MessageEnvelope<String> =
			serializer.deserialize(&serialized).await.unwrap();

		assert_eq!(original.message_type, deserialized.message_type);
		assert_eq!(original.correlation_id, deserialized.correlation_id);
	}

	#[tokio::test]
	async fn test_bincode_serialization() {
		duck!("Testing Bincode serialization");

		let envelope =
			factory::MessageEnvelopeTestFactory::with_type(MessageType::ConductorDecision);
		let serializer = MessageSerializer::bincode();

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
	async fn test_json_serialization() {
		duck!("Testing JSON serialization");

		let envelope = factory::MessageEnvelopeTestFactory::with_type(MessageType::XiRequest);
		let serializer = MessageSerializer::json();

		let serialized = serializer.serialize(&envelope).await.unwrap();
		assert!(!serialized.is_empty());
		assert_eq!(serializer.format(), SerializationFormat::Json);
		assert_eq!(serializer.content_type(), "application/json");

		// Verify it's valid JSON
		let _: serde_json::Value = serde_json::from_slice(&serialized).unwrap();
	}
}

#[cfg(feature = "jsonrpc")]
mod jsonrpc_tests {
	use crate::factory;
	use sy_commons::debug::duck;
	use sy_ipc_protocol::JsonRpcMessage;

	#[test]
	fn test_jsonrpc_request_creation() {
		duck!("Testing JSON-RPC request creation");

		let request = factory::JsonRpcRequestTestFactory::valid();

		assert_eq!(request.jsonrpc, "2.0");
		assert!(!request.method.is_empty());
		assert!(request.params.is_some());
		assert!(!request.id.to_string().is_empty());
	}

	#[test]
	fn test_jsonrpc_message_serialization() {
		duck!("Testing JSON-RPC message serialization");

		let request = factory::JsonRpcRequestTestFactory::without_params();
		let message = JsonRpcMessage::Request(request.clone());
		let serialized = serde_json::to_string(&message).unwrap();
		let deserialized: JsonRpcMessage = serde_json::from_str(&serialized).unwrap();

		match deserialized {
			JsonRpcMessage::Request(req) => {
				assert_eq!(req.jsonrpc, "2.0");
				assert_eq!(req.method, request.method);
				assert_eq!(req.id, request.id);
			},
			_ => panic!("Expected Request variant"),
		}
	}
}

#[cfg(feature = "unit")]
mod registry_tests {
	use crate::factory;
	use sy_commons::debug::duck;
	use sy_ipc_protocol::{MessageEnvelope, MessageRegistry, SerializationFormat};

	#[test]
	fn test_message_registry_creation() {
		duck!("Testing message registry creation");

		let registry = MessageRegistry::new();

		assert!(registry.message_type_count() > 0);
		assert!(registry.serializer_count() > 0);
		assert!(registry.supports_format(SerializationFormat::MessagePack));
		assert!(registry.supports_format(SerializationFormat::Bincode));
		assert!(registry.supports_format(SerializationFormat::Json));
	}

	#[tokio::test]
	async fn test_registry_serialization() {
		duck!("Testing registry serialization");

		let registry = MessageRegistry::new();
		let envelope = factory::MessageEnvelopeTestFactory::with_string_payload();

		let serialized = registry
			.serialize_message(&envelope, SerializationFormat::MessagePack)
			.await
			.unwrap();
		let deserialized: MessageEnvelope<String> = registry
			.deserialize_message(&serialized, SerializationFormat::MessagePack)
			.await
			.unwrap();

		assert_eq!(envelope.message_type, deserialized.message_type);
	}
}
