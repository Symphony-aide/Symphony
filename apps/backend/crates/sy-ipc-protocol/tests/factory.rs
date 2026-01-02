//! Factory-based test data generation for sy-ipc-protocol
//!
//! MANDATORY: All tests must use these factories instead of hardcoded data.
//! ZERO TOLERANCE for hardcoded test values.

#![allow(clippy::unwrap_used)] // Acceptable in test factories for known good values

use serde_json::Value;
use sy_commons::testing::safe_generator;
use sy_ipc_protocol::{
	CorrelationId, JsonRpcRequest, MessageEnvelope, MessageMetadata, MessagePriority, MessageType,
};
use uuid::Uuid;

/// Factory for generating correlation IDs
pub struct CorrelationIdTestFactory;

impl CorrelationIdTestFactory {
	/// Generates a valid correlation ID
	#[must_use]
	pub fn valid() -> CorrelationId {
		let _id = safe_generator().next_unique_id();
		CorrelationId(Uuid::new_v4())
	}
}

/// Factory for generating UUIDs
pub struct UUIDTestFactory;

impl UUIDTestFactory {
	/// Generates a valid UUID string
	#[must_use]
	pub fn valid() -> String {
		let id = safe_generator().next_unique_id();
		format!("550e8400-e29b-41d4-a716-{id:012x}")
	}
}

/// Factory for generating JSON-RPC requests
pub struct JsonRpcRequestTestFactory;

impl JsonRpcRequestTestFactory {
	/// Generates a valid JSON-RPC request
	#[must_use]
	pub fn valid() -> JsonRpcRequest {
		let id = safe_generator().next_unique_id();
		JsonRpcRequest {
			jsonrpc: "2.0".to_string(),
			method: format!("test_method_{id}"),
			params: Some(Value::String(format!("test_params_{id}"))),
			id: Value::String(format!("test_id_{id}")),
		}
	}

	/// Generates a JSON-RPC request without params
	#[must_use]
	pub fn without_params() -> JsonRpcRequest {
		let id = safe_generator().next_unique_id();
		JsonRpcRequest {
			jsonrpc: "2.0".to_string(),
			method: format!("method_{id}"),
			params: None,
			id: Value::Number(id.into()),
		}
	}
}

/// Factory for generating message envelopes
pub struct MessageEnvelopeTestFactory;

impl MessageEnvelopeTestFactory {
	/// Generates a message envelope with string payload
	#[must_use]
	pub fn with_string_payload() -> MessageEnvelope<String> {
		let id = safe_generator().next_unique_id();
		MessageEnvelope::new(MessageType::PitOperation, format!("test_payload_{id}"))
	}

	/// Generates a message envelope with specific type
	#[must_use]
	pub fn with_type(message_type: MessageType) -> MessageEnvelope<String> {
		let id = safe_generator().next_unique_id();
		MessageEnvelope::new(message_type, format!("payload_{id}"))
	}

	/// Generates a message envelope with custom metadata
	#[must_use]
	pub fn with_metadata() -> MessageEnvelope<String> {
		let id = safe_generator().next_unique_id();
		let metadata = MessageMetadataTestFactory::high_priority();
		MessageEnvelope::with_metadata(
			MessageType::ExtensionCommand,
			format!("urgent_payload_{id}"),
			metadata,
		)
	}
}

/// Factory for generating message metadata
pub struct MessageMetadataTestFactory;

impl MessageMetadataTestFactory {
	/// Generates high priority metadata
	#[must_use]
	pub fn high_priority() -> MessageMetadata {
		let id = safe_generator().next_unique_id();
		MessageMetadata {
			priority: MessagePriority::High,
			routing_hints: vec!["urgent".to_string()],
			timeout_ms: Some(1000),
			retry_count: 0,
			source_component: format!("source_{id}"),
			target_component: Some(format!("target_{id}")),
		}
	}
}
