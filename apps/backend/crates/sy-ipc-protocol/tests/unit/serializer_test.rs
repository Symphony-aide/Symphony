//! Unit tests for serialization functionality
//!
//! Tests MessageSerializer, SerializationError, SerializationFormat.

#[path = "../factory.rs"]
mod factory;

use sy_commons::debug::duck;
use sy_ipc_protocol::{MessageSerializer, SerializationError, SerializationFormat};

// Import factory for generating test data
use factory::MessageEnvelopeTestFactory;

#[cfg(feature = "unit")]
mod serializer_tests {
	use super::*;

	#[test]
	fn test_serialization_format_variants() {
		duck!("Testing SerializationFormat variants");

		let messagepack = SerializationFormat::MessagePack;
		let bincode = SerializationFormat::Bincode;
		let json = SerializationFormat::Json;
		
		// Test equality
		assert_eq!(messagepack, SerializationFormat::MessagePack);
		assert_eq!(bincode, SerializationFormat::Bincode);
		assert_eq!(json, SerializationFormat::Json);
		
		// Test inequality
		assert_ne!(messagepack, bincode);
		assert_ne!(bincode, json);
		assert_ne!(json, messagepack);
	}

	#[test]
	fn test_serialization_error_variants() {
		duck!("Testing SerializationError variants");

		let messagepack_error = SerializationError::MessagePackError("test error".to_string());
		let bincode_error = SerializationError::BincodeError("test error".to_string());
		let json_error = SerializationError::JsonError("test error".to_string());
		let unsupported_error = SerializationError::UnsupportedFormat(SerializationFormat::MessagePack);
		let performance_error = SerializationError::PerformanceViolation {
			operation: "test".to_string(),
			duration_ms: 100,
			target_ms: 50,
		};
		
		// Test error messages
		assert!(messagepack_error.to_string().contains("MessagePack error"));
		assert!(bincode_error.to_string().contains("Bincode error"));
		assert!(json_error.to_string().contains("JSON error"));
		assert!(unsupported_error.to_string().contains("Unsupported format"));
		assert!(performance_error.to_string().contains("Performance target violated"));
	}

	#[test]
	fn test_message_serializer_creation() {
		duck!("Testing MessageSerializer creation methods");

		let messagepack = MessageSerializer::message_pack();
		let bincode = MessageSerializer::bincode();
		let json = MessageSerializer::json();
		
		// Test format methods
		assert_eq!(messagepack.format(), SerializationFormat::MessagePack);
		assert_eq!(bincode.format(), SerializationFormat::Bincode);
		assert_eq!(json.format(), SerializationFormat::Json);
	}

	#[test]
	fn test_message_serializer_content_types() {
		duck!("Testing MessageSerializer content types");

		let messagepack = MessageSerializer::message_pack();
		let bincode = MessageSerializer::bincode();
		let json = MessageSerializer::json();
		
		// Test content type methods
		assert_eq!(messagepack.content_type(), "application/msgpack");
		assert_eq!(bincode.content_type(), "application/octet-stream");
		assert_eq!(json.content_type(), "application/json");
	}

	#[tokio::test]
	async fn test_message_serializer_messagepack_roundtrip() {
		duck!("Testing MessageSerializer MessagePack roundtrip");

		let serializer = MessageSerializer::message_pack();
		let envelope = MessageEnvelopeTestFactory::with_string_payload();
		
		// Serialize
		let serialized = serializer.serialize(&envelope).await;
		assert!(serialized.is_ok());
		
		let bytes = serialized.unwrap();
		assert!(bytes.len() > 0);
		
		// Deserialize
		let deserialized = serializer.deserialize::<sy_ipc_protocol::MessageEnvelope<String>>(&bytes).await;
		assert!(deserialized.is_ok());
		
		let result = deserialized.unwrap();
		assert_eq!(result.message_type, envelope.message_type);
	}

	#[tokio::test]
	async fn test_message_serializer_bincode_roundtrip() {
		duck!("Testing MessageSerializer Bincode roundtrip");

		let serializer = MessageSerializer::bincode();
		let envelope = MessageEnvelopeTestFactory::with_string_payload();
		
		// Serialize
		let serialized = serializer.serialize(&envelope).await;
		assert!(serialized.is_ok());
		
		let bytes = serialized.unwrap();
		assert!(bytes.len() > 0);
		
		// Deserialize
		let deserialized = serializer.deserialize::<sy_ipc_protocol::MessageEnvelope<String>>(&bytes).await;
		assert!(deserialized.is_ok());
		
		let result = deserialized.unwrap();
		assert_eq!(result.message_type, envelope.message_type);
	}

	#[tokio::test]
	async fn test_message_serializer_json_roundtrip() {
		duck!("Testing MessageSerializer JSON roundtrip");

		let serializer = MessageSerializer::json();
		let envelope = MessageEnvelopeTestFactory::with_string_payload();
		
		// Serialize
		let serialized = serializer.serialize(&envelope).await;
		assert!(serialized.is_ok());
		
		let bytes = serialized.unwrap();
		assert!(bytes.len() > 0);
		
		// Deserialize
		let deserialized = serializer.deserialize::<sy_ipc_protocol::MessageEnvelope<String>>(&bytes).await;
		assert!(deserialized.is_ok());
		
		let result = deserialized.unwrap();
		assert_eq!(result.message_type, envelope.message_type);
	}

	#[tokio::test]
	async fn test_message_serializer_error_handling() {
		duck!("Testing MessageSerializer error handling");

		let serializer = MessageSerializer::json();
		
		// Test deserialization with invalid data
		let invalid_data = b"invalid json data";
		let result = serializer.deserialize::<sy_ipc_protocol::MessageEnvelope<String>>(invalid_data).await;
		
		assert!(result.is_err());
		match result.unwrap_err() {
			SerializationError::JsonError(_) => {
				// Expected error type
			},
			other => panic!("Expected JsonError, got: {:?}", other),
		}
	}
}