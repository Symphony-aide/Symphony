//! Factory-based test data generation for sy-ipc-protocol
//!
//! MANDATORY: All tests must use these factories instead of hardcoded data.
//! ZERO TOLERANCE for hardcoded test values.

#![allow(clippy::unwrap_used)] // Acceptable in test factories for known good values

use serde_json::Value;
use sy_commons::testing::safe_generator;
use sy_ipc_protocol::jsonrpc::JsonRpcNotification;
use sy_ipc_protocol::{
	CorrelationId, JsonRpcError, JsonRpcRequest, JsonRpcResponse, MessageEnvelope, MessageMetadata,
	MessagePriority, MessageType,
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

	/// Generates normal priority metadata
	#[must_use]
	pub fn normal() -> MessageMetadata {
		let id = safe_generator().next_unique_id();
		MessageMetadata {
			priority: MessagePriority::Normal,
			routing_hints: vec![],
			timeout_ms: None,
			retry_count: 0,
			source_component: format!("source_{id}"),
			target_component: None,
		}
	}
}

/// Factory for generating JSON-RPC responses
pub struct JsonRpcResponseTestFactory;

impl JsonRpcResponseTestFactory {
	/// Generates a successful JSON-RPC response
	#[must_use]
	pub fn success() -> JsonRpcResponse {
		let id = safe_generator().next_unique_id();
		JsonRpcResponse {
			jsonrpc: "2.0".to_string(),
			result: Some(Value::String(format!("success_result_{id}"))),
			error: None,
			id: Value::Number(id.into()),
		}
	}

	/// Generates an error JSON-RPC response
	#[must_use]
	pub fn error() -> JsonRpcResponse {
		let id = safe_generator().next_unique_id();
		JsonRpcResponse {
			jsonrpc: "2.0".to_string(),
			result: None,
			error: Some(JsonRpcErrorTestFactory::invalid_request()),
			id: Value::Number(id.into()),
		}
	}
}

/// Factory for generating JSON-RPC errors
pub struct JsonRpcErrorTestFactory;

impl JsonRpcErrorTestFactory {
	/// Generates a parse error
	#[must_use]
	pub fn parse_error() -> JsonRpcError {
		JsonRpcError {
			code: -32700,
			message: "Parse error".to_string(),
			data: None,
		}
	}

	/// Generates an invalid request error
	#[must_use]
	pub fn invalid_request() -> JsonRpcError {
		JsonRpcError {
			code: -32600,
			message: "Invalid Request".to_string(),
			data: None,
		}
	}

	/// Generates a method not found error
	#[must_use]
	pub fn method_not_found() -> JsonRpcError {
		JsonRpcError {
			code: -32601,
			message: "Method not found".to_string(),
			data: None,
		}
	}

	/// Generates an invalid params error
	#[must_use]
	pub fn invalid_params() -> JsonRpcError {
		JsonRpcError {
			code: -32602,
			message: "Invalid params".to_string(),
			data: None,
		}
	}

	/// Generates an internal error
	#[must_use]
	pub fn internal_error() -> JsonRpcError {
		JsonRpcError {
			code: -32603,
			message: "Internal error".to_string(),
			data: None,
		}
	}
}

/// Factory for generating JSON-RPC notifications
pub struct JsonRpcNotificationTestFactory;

impl JsonRpcNotificationTestFactory {
	/// Generates a valid JSON-RPC notification
	#[must_use]
	pub fn valid() -> JsonRpcNotification {
		let id = safe_generator().next_unique_id();
		JsonRpcNotification {
			jsonrpc: "2.0".to_string(),
			method: format!("notification_method_{id}"),
			params: Some(Value::String(format!("notification_params_{id}"))),
		}
	}
}

/// Factory for generating string test data
pub struct StringTestFactory;

impl StringTestFactory {
	/// Generates a test payload string
	#[must_use]
	pub fn payload() -> String {
		let id = safe_generator().next_unique_id();
		format!("test_payload_{id}")
	}
}
