//! Unit tests for schema validation system
//!
//! Tests schema validation, JSON-RPC schema, message schema validation.

#[path = "../factory.rs"]
mod factory;

use serde_json::json;
use sy_commons::debug::duck;
use sy_ipc_protocol::{
	JsonRpcSchema, MessageSchema, SchemaValidator, ValidationError,
};

#[cfg(feature = "unit")]
mod schema_tests {
	use super::*;

	#[test]
	fn test_schema_validator_creation() {
		duck!("Testing SchemaValidator creation");

		let validator = SchemaValidator::new();
		
		// Validator should be created successfully and enabled by default
		assert!(validator.is_validation_enabled());
		assert_eq!(validator.schema_count(), 0);
	}

	#[test]
	fn test_jsonrpc_schema_creation() {
		duck!("Testing JsonRpcSchema creation");

		let schema = JsonRpcSchema;
		
		// Schema should have correct properties
		assert_eq!(schema.schema_version(), "2.0");
		assert_eq!(schema.message_type(), "jsonrpc");
	}

	#[test]
	fn test_jsonrpc_schema_validation() {
		duck!("Testing JsonRpcSchema validation");

		let schema = JsonRpcSchema;
		
		// Valid JSON-RPC request
		let valid_request = json!({
			"jsonrpc": "2.0",
			"method": "test_method",
			"params": {"test": "value"},
			"id": 1
		});
		
		assert!(schema.validate(&valid_request).is_ok());
		
		// Invalid JSON-RPC (missing jsonrpc field)
		let invalid_request = json!({
			"method": "test_method",
			"id": 1
		});
		
		assert!(schema.validate(&invalid_request).is_err());
	}

	#[test]
	fn test_validation_error_variants() {
		duck!("Testing ValidationError variants");

		let error1 = ValidationError::InvalidFormat("test error".to_string());
		match error1 {
			ValidationError::InvalidFormat(msg) => {
				assert_eq!(msg, "test error");
			},
			_ => panic!("Expected InvalidFormat variant"),
		}

		let error2 = ValidationError::SchemaNotFound("test_type".to_string());
		match error2 {
			ValidationError::SchemaNotFound(msg) => {
				assert_eq!(msg, "test_type");
			},
			_ => panic!("Expected SchemaNotFound variant"),
		}

		let error3 = ValidationError::MissingField("test_field".to_string());
		match error3 {
			ValidationError::MissingField(msg) => {
				assert_eq!(msg, "test_field");
			},
			_ => panic!("Expected MissingField variant"),
		}
	}

	#[tokio::test]
	async fn test_schema_validator_registration() {
		duck!("Testing schema validator registration");

		let mut validator = SchemaValidator::new();
		
		// Register JsonRpcSchema
		validator.register_schema(JsonRpcSchema);
		assert_eq!(validator.schema_count(), 1);
		
		// Test validation with registered schema
		let valid_message = json!({
			"jsonrpc": "2.0",
			"method": "test",
			"id": 1
		});
		
		let result = validator.validate_message("jsonrpc", &valid_message).await;
		assert!(result.is_ok());
		
		// Test validation with unregistered schema
		let result = validator.validate_message("unknown", &valid_message).await;
		assert!(result.is_err());
	}

	#[test]
	fn test_schema_validator_enable_disable() {
		duck!("Testing schema validator enable/disable");

		let mut validator = SchemaValidator::new();
		
		// Should be enabled by default
		assert!(validator.is_validation_enabled());
		
		// Disable validation
		validator.disable_validation();
		assert!(!validator.is_validation_enabled());
		
		// Re-enable validation
		validator.enable_validation();
		assert!(validator.is_validation_enabled());
	}
}