//! Schema validation system for message integrity
//!
//! Provides runtime schema validation for messages to ensure data integrity
//! and catch malformed messages early in the communication pipeline.

use serde_json::Value as JsonValue;
use std::collections::HashMap;
use sy_commons::{debug::duck, error::SymphonyError};

/// Validation error types
#[derive(Debug, thiserror::Error)]
pub enum ValidationError {
	/// Schema not found for message type
	#[error("Schema not found for message type: {0}")]
	SchemaNotFound(String),

	/// Invalid message format
	#[error("Invalid message format: {0}")]
	InvalidFormat(String),

	/// Missing required field
	#[error("Missing required field: {0}")]
	MissingField(String),

	/// Invalid field value or type
	#[error("Invalid field: {0}")]
	InvalidField(String),

	/// Invalid value
	#[error("Invalid value: {0}")]
	InvalidValue(String),

	/// General validation failure
	#[error("Validation failed: {0}")]
	ValidationFailed(String),
}

impl From<ValidationError> for SymphonyError {
	fn from(err: ValidationError) -> Self {
		SymphonyError::Validation {
			message: format!("Schema validation error: {}", err),
			field: None,
			value: None,
		}
	}
}

/// Trait for message schema validation
pub trait MessageSchema: Send + Sync {
	/// Validates a message against this schema
	///
	/// # Arguments
	///
	/// * `message` - JSON value to validate
	///
	/// # Errors
	///
	/// Returns `ValidationError` if validation fails
	fn validate(&self, message: &JsonValue) -> Result<(), ValidationError>;

	/// Returns the schema version
	fn schema_version(&self) -> &str;

	/// Returns the message type this schema validates
	fn message_type(&self) -> &str;
}

/// Schema validator that manages multiple schemas
pub struct SchemaValidator {
	/// Registered schemas by message type
	schemas: HashMap<String, Box<dyn MessageSchema>>,
	/// Whether validation is enabled
	validation_enabled: bool,
}

impl SchemaValidator {
	/// Creates a new schema validator
	///
	/// # Examples
	///
	/// ```
	/// use sy_ipc_protocol::SchemaValidator;
	///
	/// let validator = SchemaValidator::new();
	/// ```
	pub fn new() -> Self {
		duck!("Creating new schema validator");
		Self {
			schemas: HashMap::new(),
			validation_enabled: true,
		}
	}

	/// Registers a schema for a message type
	///
	/// # Arguments
	///
	/// * `schema` - Schema implementation to register
	///
	/// # Examples
	///
	/// ```
	/// use sy_ipc_protocol::{SchemaValidator, JsonRpcSchema};
	///
	/// let mut validator = SchemaValidator::new();
	/// validator.register_schema(JsonRpcSchema);
	/// ```
	pub fn register_schema<S: MessageSchema + 'static>(&mut self, schema: S) {
		let message_type = schema.message_type().to_string();
		duck!("Registering schema for message type: {}", message_type);
		self.schemas.insert(message_type, Box::new(schema));
	}

	/// Validates a message against its registered schema
	///
	/// # Arguments
	///
	/// * `message_type` - Type of message to validate
	/// * `message` - JSON message to validate
	///
	/// # Errors
	///
	/// Returns `ValidationError` if validation fails or schema not found
	pub async fn validate_message(
		&self,
		message_type: &str,
		message: &JsonValue,
	) -> Result<(), ValidationError> {
		if !self.validation_enabled {
			duck!("Schema validation disabled, skipping validation");
			return Ok(());
		}

		duck!("Validating message of type: {}", message_type);
		let start = std::time::Instant::now();

		let schema = self
			.schemas
			.get(message_type)
			.ok_or_else(|| ValidationError::SchemaNotFound(message_type.to_string()))?;

		let result = schema.validate(message);

		let duration = start.elapsed();
		if duration.as_millis() > 0 {
			duck!("Schema validation took {}ms for {}", duration.as_millis(), message_type);
		}

		result
	}

	/// Disables schema validation
	///
	/// Useful for performance-critical paths where validation overhead
	/// is not acceptable.
	pub fn disable_validation(&mut self) {
		duck!("Disabling schema validation");
		self.validation_enabled = false;
	}

	/// Enables schema validation
	pub fn enable_validation(&mut self) {
		duck!("Enabling schema validation");
		self.validation_enabled = true;
	}

	/// Returns whether validation is enabled
	pub fn is_validation_enabled(&self) -> bool {
		self.validation_enabled
	}

	/// Returns the number of registered schemas
	pub fn schema_count(&self) -> usize {
		self.schemas.len()
	}
}

impl Default for SchemaValidator {
	fn default() -> Self {
		Self::new()
	}
}

/// JSON-RPC 2.0 schema validator
pub struct JsonRpcSchema;

impl MessageSchema for JsonRpcSchema {
	fn validate(&self, message: &JsonValue) -> Result<(), ValidationError> {
		duck!("Validating JSON-RPC 2.0 message");

		// Must be a JSON object
		let obj = message.as_object().ok_or_else(|| {
			ValidationError::InvalidFormat("Message must be JSON object".to_string())
		})?;

		// Check jsonrpc field
		let jsonrpc = obj
			.get("jsonrpc")
			.and_then(|v| v.as_str())
			.ok_or_else(|| ValidationError::MissingField("jsonrpc".to_string()))?;

		if jsonrpc != "2.0" {
			return Err(ValidationError::InvalidValue("jsonrpc must be '2.0'".to_string()));
		}

		// Check method field (for requests and notifications)
		if obj.contains_key("method") {
			let method = obj.get("method").and_then(|v| v.as_str()).ok_or_else(|| {
				ValidationError::InvalidField("method must be string".to_string())
			})?;

			if method.is_empty() {
				return Err(ValidationError::InvalidValue("method cannot be empty".to_string()));
			}
		}

		// Check id field (required for requests and responses)
		if obj.contains_key("id") {
			let id = obj.get("id").unwrap();
			if !id.is_string() && !id.is_number() && !id.is_null() {
				return Err(ValidationError::InvalidField(
					"id must be string, number, or null".to_string(),
				));
			}
		}

		// Validate response structure
		if obj.contains_key("result") || obj.contains_key("error") {
			if !obj.contains_key("id") {
				return Err(ValidationError::MissingField("id required for responses".to_string()));
			}

			let has_result = obj.contains_key("result");
			let has_error = obj.contains_key("error");

			if has_result && has_error {
				return Err(ValidationError::InvalidFormat(
					"response cannot have both result and error".to_string(),
				));
			}

			if !has_result && !has_error {
				return Err(ValidationError::InvalidFormat(
					"response must have either result or error".to_string(),
				));
			}
		}

		duck!("JSON-RPC 2.0 message validation passed");
		Ok(())
	}

	fn schema_version(&self) -> &str {
		"2.0"
	}

	fn message_type(&self) -> &str {
		"jsonrpc"
	}
}

/// Message envelope schema validator
pub struct MessageEnvelopeSchema;

impl MessageSchema for MessageEnvelopeSchema {
	fn validate(&self, message: &JsonValue) -> Result<(), ValidationError> {
		duck!("Validating message envelope");

		let obj = message.as_object().ok_or_else(|| {
			ValidationError::InvalidFormat("Message envelope must be JSON object".to_string())
		})?;

		// Check required fields
		let required_fields = [
			"correlation_id",
			"message_type",
			"metadata",
			"payload",
			"timestamp",
		];
		for field in &required_fields {
			if !obj.contains_key(*field) {
				return Err(ValidationError::MissingField(field.to_string()));
			}
		}

		// Validate correlation_id is a string (UUID)
		let correlation_id =
			obj.get("correlation_id").and_then(|v| v.as_str()).ok_or_else(|| {
				ValidationError::InvalidField("correlation_id must be string".to_string())
			})?;

		// Basic UUID format check (36 characters with hyphens)
		if correlation_id.len() != 36 || correlation_id.chars().filter(|&c| c == '-').count() != 4 {
			return Err(ValidationError::InvalidValue(
				"correlation_id must be valid UUID format".to_string(),
			));
		}

		// Validate message_type is a string
		if !obj.get("message_type").unwrap().is_string() {
			return Err(ValidationError::InvalidField("message_type must be string".to_string()));
		}

		// Validate metadata is an object
		if !obj.get("metadata").unwrap().is_object() {
			return Err(ValidationError::InvalidField("metadata must be object".to_string()));
		}

		// Validate timestamp is a string (ISO 8601)
		if !obj.get("timestamp").unwrap().is_string() {
			return Err(ValidationError::InvalidField("timestamp must be string".to_string()));
		}

		duck!("Message envelope validation passed");
		Ok(())
	}

	fn schema_version(&self) -> &str {
		"1.0"
	}

	fn message_type(&self) -> &str {
		"message_envelope"
	}
}
