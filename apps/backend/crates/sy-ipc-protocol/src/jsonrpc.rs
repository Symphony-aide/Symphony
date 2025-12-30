//! JSON-RPC 2.0 implementation for XI-editor communication
//!
//! Provides JSON-RPC 2.0 compliant message types and client functionality
//! for Symphony ↔ XI-editor communication.

use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use sy_commons::debug::duck;
use tokio::sync::oneshot;
use uuid::Uuid;

/// JSON-RPC 2.0 message types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum JsonRpcMessage {
    /// JSON-RPC request
    Request(JsonRpcRequest),
    /// JSON-RPC response
    Response(JsonRpcResponse),
    /// JSON-RPC notification
    Notification(JsonRpcNotification),
}

/// JSON-RPC 2.0 request message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonRpcRequest {
    /// JSON-RPC version (always "2.0")
    pub jsonrpc: String,
    /// Method name to call
    pub method: String,
    /// Optional parameters
    #[serde(skip_serializing_if = "Option::is_none")]
    pub params: Option<Value>,
    /// Request identifier
    pub id: Value,
}

/// JSON-RPC 2.0 response message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonRpcResponse {
    /// JSON-RPC version (always "2.0")
    pub jsonrpc: String,
    /// Result value (present on success)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result: Option<Value>,
    /// Error object (present on error)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<JsonRpcError>,
    /// Request identifier
    pub id: Value,
}

/// JSON-RPC 2.0 notification message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonRpcNotification {
    /// JSON-RPC version (always "2.0")
    pub jsonrpc: String,
    /// Method name
    pub method: String,
    /// Optional parameters
    #[serde(skip_serializing_if = "Option::is_none")]
    pub params: Option<Value>,
}

/// JSON-RPC 2.0 error object
#[derive(Debug, Clone, Serialize, Deserialize, thiserror::Error)]
#[error("JSON-RPC error {code}: {message}")]
pub struct JsonRpcError {
    /// Error code
    pub code: i32,
    /// Error message
    pub message: String,
    /// Optional additional error data
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<Value>,
}

/// JSON-RPC 2.0 standard error codes
pub mod error_codes {
    /// Parse error - Invalid JSON was received by the server
    pub const PARSE_ERROR: i32 = -32700;
    /// Invalid Request - The JSON sent is not a valid Request object
    pub const INVALID_REQUEST: i32 = -32600;
    /// Method not found - The method does not exist / is not available
    pub const METHOD_NOT_FOUND: i32 = -32601;
    /// Invalid params - Invalid method parameter(s)
    pub const INVALID_PARAMS: i32 = -32602;
    /// Internal error - Internal JSON-RPC error
    pub const INTERNAL_ERROR: i32 = -32603;
    // Server error range: -32099 to -32000
}

/// JSON-RPC client for Symphony ↔ XI-editor communication
///
/// Provides async request/response handling with correlation tracking
/// and timeout management.
pub struct JsonRpcClient {
    /// Correlation map for tracking pending requests
    correlation_map: Arc<Mutex<HashMap<Value, oneshot::Sender<JsonRpcResponse>>>>,
    /// Request timeout duration
    request_timeout: Duration,
}

impl JsonRpcClient {
    /// Creates a new JSON-RPC client
    ///
    /// # Arguments
    ///
    /// * `request_timeout` - Timeout duration for requests
    ///
    /// # Examples
    ///
    /// ```
    /// use sy_ipc_protocol::JsonRpcClient;
    /// use std::time::Duration;
    ///
    /// let client = JsonRpcClient::new(Duration::from_secs(5));
    /// ```
    pub fn new(request_timeout: Duration) -> Self {
        duck!("Creating JSON-RPC client with timeout: {:?}", request_timeout);
        Self {
            correlation_map: Arc::new(Mutex::new(HashMap::new())),
            request_timeout,
        }
    }

    /// Makes an async JSON-RPC call
    ///
    /// # Arguments
    ///
    /// * `method` - Method name to call
    /// * `params` - Optional parameters
    ///
    /// # Errors
    ///
    /// Returns `JsonRpcError` if the call fails or times out
    ///
    /// # Examples
    ///
    /// ```no_run
    /// # use sy_ipc_protocol::JsonRpcClient;
    /// # use std::time::Duration;
    /// # use serde_json::Value;
    /// # async fn example() -> Result<(), Box<dyn std::error::Error>> {
    /// let client = JsonRpcClient::new(Duration::from_secs(5));
    /// let result = client.call("subtract", Some(Value::Array(vec![
    ///     Value::Number(42.into()),
    ///     Value::Number(23.into()),
    /// ]))).await?;
    /// # Ok(())
    /// # }
    /// ```
    pub async fn call(&self, method: &str, params: Option<Value>) -> Result<Value, JsonRpcError> {
        duck!("Making JSON-RPC call to method: {}", method);
        
        let id = Value::String(Uuid::new_v4().to_string());
        let _request = JsonRpcRequest {
            jsonrpc: "2.0".to_string(),
            method: method.to_string(),
            params,
            id: id.clone(),
        };

        let (tx, rx) = oneshot::channel();
        self.correlation_map.lock().unwrap().insert(id.clone(), tx);

        // TODO: Send request via transport layer (will be implemented in F004)
        // For now, this is a stub that will be completed when transport layer is available
        duck!("Stub: Would send JSON-RPC request via transport layer");
        
        // Wait for response with timeout
        let response = tokio::time::timeout(self.request_timeout, rx)
            .await
            .map_err(|_| JsonRpcError {
                code: error_codes::INTERNAL_ERROR,
                message: "Request timeout".to_string(),
                data: None,
            })?
            .map_err(|_| JsonRpcError {
                code: error_codes::INTERNAL_ERROR,
                message: "Response channel closed".to_string(),
                data: None,
            })?;

        match response.error {
            Some(error) => Err(error),
            None => Ok(response.result.unwrap_or(Value::Null)),
        }
    }

    /// Sends a JSON-RPC notification (no response expected)
    ///
    /// # Arguments
    ///
    /// * `method` - Method name
    /// * `params` - Optional parameters
    ///
    /// # Errors
    ///
    /// Returns `JsonRpcError` if sending fails
    pub async fn notify(&self, method: &str, params: Option<Value>) -> Result<(), JsonRpcError> {
        duck!("Sending JSON-RPC notification to method: {}", method);
        
        let _notification = JsonRpcNotification {
            jsonrpc: "2.0".to_string(),
            method: method.to_string(),
            params,
        };

        // TODO: Send notification via transport layer (will be implemented in F004)
        duck!("Stub: Would send JSON-RPC notification via transport layer");
        
        Ok(())
    }

    /// Handles an incoming JSON-RPC response
    ///
    /// This method is called by the transport layer when a response is received.
    /// It correlates the response with the pending request and delivers it.
    pub fn handle_response(&self, response: JsonRpcResponse) {
        duck!("Handling JSON-RPC response for ID: {:?}", response.id);
        
        if let Some(tx) = self.correlation_map.lock().unwrap().remove(&response.id) {
            if tx.send(response).is_err() {
                duck!("Failed to deliver response - receiver dropped");
            }
        } else {
            duck!("Received response for unknown request ID: {:?}", response.id);
        }
    }
}

impl Default for JsonRpcClient {
    fn default() -> Self {
        Self::new(Duration::from_secs(30))
    }
}