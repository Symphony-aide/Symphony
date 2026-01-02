//! Unit tests for JSON-RPC 2.0 compliance
//!
//! Tests JSON-RPC message types, client functionality, and specification compliance.

//! Unit tests for JSON-RPC 2.0 compliance
//!
//! Tests JSON-RPC message types, client functionality, and specification compliance.

mod factory;

use sy_commons::debug::duck;
use sy_ipc_protocol::{
	JsonRpcClient, JsonRpcError, JsonRpcMessage, JsonRpcRequest, JsonRpcResponse,
};

// Import factory module
use factory::{
	JsonRpcErrorTestFactory, JsonRpcNotificationTestFactory, JsonRpcRequestTestFactory,
	JsonRpcResponseTestFactory,
};

#[cfg(feature = "jsonrpc")]
mod jsonrpc_tests {
	use super::*;
	use rstest::*;
	use std::time::Duration;

	#[test]
	fn test_jsonrpc_request_creation() {
		duck!("Testing JSON-RPC request creation");

		let request = JsonRpcRequestTestFactory::valid();

		assert_eq!(request.jsonrpc, "2.0");
		assert!(!request.method.is_empty());
		assert!(request.params.is_some());
		assert!(!request.id.to_string().is_empty());
	}

	#[test]
	fn test_jsonrpc_response_success() {
		duck!("Testing JSON-RPC success response");

		let response = JsonRpcResponseTestFactory::success();

		assert_eq!(response.jsonrpc, "2.0");
		assert!(response.result.is_some());
		assert!(response.error.is_none());
	}

	#[test]
	fn test_jsonrpc_response_error() {
		duck!("Testing JSON-RPC error response");

		let response = JsonRpcResponseTestFactory::error();

		assert_eq!(response.jsonrpc, "2.0");
		assert!(response.result.is_none());
		assert!(response.error.is_some());
		assert_eq!(response.error.unwrap().code, -32600);
	}

	#[test]
	fn test_jsonrpc_notification() {
		duck!("Testing JSON-RPC notification");

		let notification = JsonRpcNotificationTestFactory::valid();

		assert_eq!(notification.jsonrpc, "2.0");
		assert!(!notification.method.is_empty());
		assert!(notification.params.is_some());
	}

	#[test]
	fn test_jsonrpc_message_serialization() {
		duck!("Testing JSON-RPC message serialization");

		let request = JsonRpcRequestTestFactory::without_params();
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

	#[test]
	fn test_jsonrpc_error_creation() {
		duck!("Testing JsonRpcError direct creation");

		let error = JsonRpcError {
			code: -32600,
			message: "Invalid Request".to_string(),
			data: None,
		};

		assert_eq!(error.code, -32600);
		assert_eq!(error.message, "Invalid Request");
		assert!(error.data.is_none());
	}

	#[rstest]
	#[case(-32700, "Parse error")]
	#[case(-32600, "Invalid Request")]
	#[case(-32601, "Method not found")]
	#[case(-32602, "Invalid params")]
	#[case(-32603, "Internal error")]
	fn test_jsonrpc_error_codes(#[case] code: i32, #[case] message: &str) {
		duck!("Testing JSON-RPC error code: {}", code);

		let error = match code {
			-32700 => JsonRpcErrorTestFactory::parse_error(),
			-32600 => JsonRpcErrorTestFactory::invalid_request(),
			-32601 => JsonRpcErrorTestFactory::method_not_found(),
			-32602 => JsonRpcErrorTestFactory::invalid_params(),
			-32603 => JsonRpcErrorTestFactory::internal_error(),
			_ => panic!("Unexpected error code"),
		};

		assert_eq!(error.code, code);
		assert_eq!(error.message, message);
	}

	#[tokio::test]
	async fn test_jsonrpc_client_creation() {
		duck!("Testing JSON-RPC client creation");

		// This test will FAIL initially - no implementation exists
		let timeout = Duration::from_secs(5);
		let _client = JsonRpcClient::new(timeout);

		// Client should be created successfully
		// We can't test much without transport layer, but we can verify it doesn't panic
		assert!(true); // Placeholder - will be expanded when implementation exists
	}

	#[test]
	fn test_jsonrpc_specification_compliance() {
		duck!("Testing JSON-RPC 2.0 specification compliance");

		// Test request parsing
		let request_json = r#"{"jsonrpc":"2.0","method":"subtract","params":[42,23],"id":1}"#;
		let request: JsonRpcRequest = serde_json::from_str(request_json).unwrap();

		assert_eq!(request.jsonrpc, "2.0");
		assert_eq!(request.method, "subtract");
		assert!(request.params.is_some());

		// Test response parsing
		let response_json = r#"{"jsonrpc":"2.0","result":19,"id":1}"#;
		let response: JsonRpcResponse = serde_json::from_str(response_json).unwrap();

		assert_eq!(response.jsonrpc, "2.0");
		assert!(response.result.is_some());
		assert!(response.error.is_none());
	}
}
