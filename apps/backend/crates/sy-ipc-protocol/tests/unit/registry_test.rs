//! Unit tests for message registry functionality
//!
//! Tests MessageRegistry type-safe message routing.

#[path = "../factory.rs"]
mod factory;

use sy_commons::debug::duck;
use sy_ipc_protocol::{MessageRegistry, MessageType, SerializationFormat};

// Import factory for generating test data
use factory::MessageEnvelopeTestFactory;

#[cfg(feature = "unit")]
mod registry_tests {
	use super::*;

	#[test]
	fn test_message_registry_creation() {
		duck!("Testing MessageRegistry creation");

		let registry = MessageRegistry::new();
		
		// Registry should be created with default serializers and schemas
		assert!(registry.serializer_count() > 0);
		assert!(registry.message_type_count() > 0);
	}

	#[test]
	fn test_message_registry_default() {
		duck!("Testing MessageRegistry default");

		let registry = MessageRegistry::default();
		
		// Default registry should be same as new()
		assert!(registry.serializer_count() > 0);
		assert!(registry.message_type_count() > 0);
	}

	#[test]
	fn test_message_registry_register_message_type() {
		duck!("Testing MessageRegistry register_message_type");

		let mut registry = MessageRegistry::new();
		let initial_count = registry.message_type_count();
		
		registry.register_message_type("custom_type".to_string(), MessageType::PitOperation);
		
		assert_eq!(registry.message_type_count(), initial_count + 1);
		assert_eq!(registry.get_message_type("custom_type"), Some(&MessageType::PitOperation));
	}

	#[test]
	fn test_message_registry_supports_format() {
		duck!("Testing MessageRegistry supports_format");

		let registry = MessageRegistry::new();
		
		// Should support default formats
		assert!(registry.supports_format(SerializationFormat::MessagePack));
		assert!(registry.supports_format(SerializationFormat::Bincode));
		assert!(registry.supports_format(SerializationFormat::Json));
	}

	#[test]
	fn test_message_registry_supported_formats() {
		duck!("Testing MessageRegistry supported_formats");

		let registry = MessageRegistry::new();
		let formats = registry.supported_formats();
		
		// Should have at least the default formats
		assert!(formats.len() >= 3);
		assert!(formats.contains(&SerializationFormat::MessagePack));
		assert!(formats.contains(&SerializationFormat::Bincode));
		assert!(formats.contains(&SerializationFormat::Json));
	}

	#[test]
	fn test_message_registry_message_type_names() {
		duck!("Testing MessageRegistry message_type_names");

		let registry = MessageRegistry::new();
		let names = registry.message_type_names();
		
		// Should have default message type names
		assert!(names.len() > 0);
		assert!(names.contains(&&"pit_operation".to_string()));
		assert!(names.contains(&&"extension_command".to_string()));
	}

	#[test]
	fn test_message_registry_validator() {
		duck!("Testing MessageRegistry validator access");

		let registry = MessageRegistry::new();
		let validator = registry.validator();
		
		// Should have validator with registered schemas
		assert!(validator.schema_count() > 0);
		assert!(validator.is_validation_enabled());
	}

	#[test]
	fn test_message_registry_validator_mut() {
		duck!("Testing MessageRegistry validator_mut access");

		let mut registry = MessageRegistry::new();
		let initial_enabled = registry.validator().is_validation_enabled();
		
		// Modify validator through mutable reference
		registry.validator_mut().disable_validation();
		
		assert_ne!(registry.validator().is_validation_enabled(), initial_enabled);
	}

	#[tokio::test]
	async fn test_message_registry_serialize_message() {
		duck!("Testing MessageRegistry serialize_message");

		let registry = MessageRegistry::new();
		let envelope = MessageEnvelopeTestFactory::with_string_payload();
		
		let result = registry.serialize_message(&envelope, SerializationFormat::Json).await;
		assert!(result.is_ok());
		
		let serialized = result.unwrap();
		assert!(serialized.len() > 0);
	}

	#[tokio::test]
	async fn test_message_registry_deserialize_message() {
		duck!("Testing MessageRegistry deserialize_message");

		let registry = MessageRegistry::new();
		let envelope = MessageEnvelopeTestFactory::with_string_payload();
		
		// First serialize
		let serialized = registry.serialize_message(&envelope, SerializationFormat::Json).await.unwrap();
		
		// Then deserialize
		let result = registry.deserialize_message::<String>(&serialized, SerializationFormat::Json).await;
		assert!(result.is_ok());
		
		let deserialized = result.unwrap();
		assert_eq!(deserialized.message_type, envelope.message_type);
	}
}