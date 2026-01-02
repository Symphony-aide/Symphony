//! Unit tests for JSON-RPC client functionality
//!
//! Tests JsonRpcClient and JsonRpcMessage types.

#[path = "../factory.rs"]
mod factory;

use std::time::Duration;
use sy_commons::debug::duck;
use sy_ipc_protocol::{JsonRpcClient, JsonRpcMessage};

// Import factory for generating test data
use factory::{JsonRpcRequestTestFactory, JsonRpcResponseTestFactory, JsonRpcNotificationTestFactory};

#[cfg(feature = "jsonrpc")]
mod jsonrpc_client_tests {
	use super::*;

	#[test]
	fn test_jsonrpc_client_creation() {
		duck!("Testing JsonRpcClient creation");

		let timeout = Duration::from_secs(5);
		let _client = JsonRpcClient::new(timeout);
		
		// Client should be created successfully
		// Note: We can't test internal state directly due to private fields
		assert!(true); // Basic creation test
	}

	#[test]
	fn test_jsonrpc_client_default() {
		duck!("Testing JsonRpcClient default");

		let _client = JsonRpcClient::default();
		
		// Default client should be created successfully
		assert!(true); // Basic creation test
	}

	#[test]
	fn test_jsonrpc_message_request_variant() {
		duck!("Testing JsonRpcMessage Request variant");

		let request = JsonRpcRequestTestFactory::valid();
		let message = JsonRpcMessage::Request(request.clone());
		
		match message {
			JsonRpcMessage::Request(req) => {
				assert_eq!(req.jsonrpc, request.jsonrpc);
				assert_eq!(req.method, request.method);
				assert_eq!(req.id, request.id);
			},
			_ => panic!("Expected Request variant"),
		}
	}

	#[test]
	fn test_jsonrpc_message_response_variant() {
		duck!("Testing JsonRpcMessage Response variant");

		let response = JsonRpcResponseTestFactory::success();
		let message = JsonRpcMessage::Response(response.clone());
		
		match message {
			JsonRpcMessage::Response(resp) => {
				assert_eq!(resp.jsonrpc, response.jsonrpc);
				assert_eq!(resp.id, response.id);
				assert!(resp.result.is_some());
				assert!(resp.error.is_none());
			},
			_ => panic!("Expected Response variant"),
		}
	}

	#[test]
	fn test_jsonrpc_message_notification_variant() {
		duck!("Testing JsonRpcMessage Notification variant");

		let notification = JsonRpcNotificationTestFactory::valid();
		let message = JsonRpcMessage::Notification(notification.clone());
		
		match message {
			JsonRpcMessage::Notification(notif) => {
				assert_eq!(notif.jsonrpc, notification.jsonrpc);
				assert_eq!(notif.method, notification.method);
			},
			_ => panic!("Expected Notification variant"),
		}
	}

	#[test]
	fn test_jsonrpc_message_serialization() {
		duck!("Testing JsonRpcMessage serialization");

		let request = JsonRpcRequestTestFactory::valid();
		let message = JsonRpcMessage::Request(request);
		
		let serialized = serde_json::to_string(&message).expect("Failed to serialize");
		let deserialized: JsonRpcMessage = serde_json::from_str(&serialized).expect("Failed to deserialize");
		
		match deserialized {
			JsonRpcMessage::Request(req) => {
				assert_eq!(req.jsonrpc, "2.0");
			},
			_ => panic!("Expected Request variant after deserialization"),
		}
	}

	#[tokio::test]
	async fn test_jsonrpc_client_notify() {
		duck!("Testing JsonRpcClient notify method");

		let client = JsonRpcClient::new(Duration::from_secs(1));
		
		// Test notification (this is a stub implementation)
		let result = client.notify("test_method", None).await;
		assert!(result.is_ok());
	}
}