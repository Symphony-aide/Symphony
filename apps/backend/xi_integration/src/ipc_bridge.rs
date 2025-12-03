//! IPC Bridge for message translation between Symphony and Xi-Core
//!
//! This module provides the translation layer between Symphony's IPC protocol
//! and Xi-Core's operations. It acts as a bridge that receives Symphony IPC
//! messages and translates them into Xi-Core function calls.
//!
//! # Architecture
//!
//! ```text
//! Symphony IPC → IpcBridge → Xi-Core
//!                    ↓
//!              Translation
//! ```
//!
//! # Examples
//!
//! ```rust,no_run
//! use xi_integration::{IpcBridge, XiIntegration, XiConfig};
//! use xi_integration::types::SymphonyIpcRequest;
//! use std::sync::Arc;
//! use tokio::sync::Mutex;
//!
//! # async fn example() -> Result<(), Box<dyn std::error::Error>> {
//! // Create Xi integration
//! let xi = Arc::new(Mutex::new(XiIntegration::new(XiConfig::default())?));
//!
//! // Create IPC Bridge
//! let bridge = IpcBridge::new(xi);
//!
//! // Handle a request
//! let request = SymphonyIpcRequest::OpenFile {
//!     path: "example.txt".into(),
//! };
//! let response = bridge.handle_request(request).await?;
//! # Ok(())
//! # }
//! ```

use std::sync::Arc;
use tokio::sync::Mutex;

use crate::{XiIntegration, XiResult};
use crate::types::{SymphonyIpcRequest, SymphonyIpcResponse};

/// IPC Bridge for translating between Symphony IPC and Xi-Core
///
/// The `IpcBridge` acts as a translator between Symphony's IPC protocol and
/// Xi-Core's operations. It receives Symphony IPC messages, translates them
/// to Xi-Core function calls, and returns Symphony-compatible responses.
///
/// # Thread Safety
///
/// This struct is designed to be used across async tasks. The internal
/// `XiIntegration` is wrapped in `Arc<Mutex<>>` for safe concurrent access.
///
/// # Examples
///
/// ```rust,no_run
/// use xi_integration::{IpcBridge, XiIntegration, XiConfig};
/// use std::sync::Arc;
/// use tokio::sync::Mutex;
///
/// # async fn example() -> Result<(), Box<dyn std::error::Error>> {
/// let xi = Arc::new(Mutex::new(XiIntegration::new(XiConfig::default())?));
/// let bridge = IpcBridge::new(xi);
/// # Ok(())
/// # }
/// ```
pub struct IpcBridge {
    /// Reference to Xi-Core integration
    xi: Arc<Mutex<XiIntegration>>,
}

impl IpcBridge {
    /// Create a new IPC Bridge
    ///
    /// Initializes the IPC Bridge with a reference to the Xi-Core integration.
    ///
    /// # Arguments
    ///
    /// * `xi` - Shared reference to `XiIntegration`
    ///
    /// # Examples
    ///
    /// ```rust,no_run
    /// use xi_integration::{IpcBridge, XiIntegration, XiConfig};
    /// use std::sync::Arc;
    /// use tokio::sync::Mutex;
    ///
    /// # fn example() -> Result<(), Box<dyn std::error::Error>> {
    /// let xi = Arc::new(Mutex::new(XiIntegration::new(XiConfig::default())?));
    /// let bridge = IpcBridge::new(xi);
    /// # Ok(())
    /// # }
    /// ```
    pub fn new(xi: Arc<Mutex<XiIntegration>>) -> Self {
        tracing::info!("Initializing IPC Bridge");
        Self { xi }
    }

    /// Handle a Symphony IPC request
    ///
    /// Translates a Symphony IPC request into Xi-Core operations and returns
    /// a Symphony-compatible response.
    ///
    /// # Arguments
    ///
    /// * `request` - The Symphony IPC request to handle
    ///
    /// # Returns
    ///
    /// Returns a `SymphonyIpcResponse` on success, or an error if the operation fails.
    ///
    /// # Errors
    ///
    /// Returns an error if:
    /// - The view ID is invalid
    /// - File operations fail
    /// - Edit operations are out of bounds
    ///
    /// # Examples
    ///
    /// ```rust,no_run
    /// # use xi_integration::{IpcBridge, XiIntegration, XiConfig};
    /// # use xi_integration::types::SymphonyIpcRequest;
    /// # use std::sync::Arc;
    /// # use tokio::sync::Mutex;
    /// # async fn example() -> Result<(), Box<dyn std::error::Error>> {
    /// # let xi = Arc::new(Mutex::new(XiIntegration::new(XiConfig::default())?));
    /// # let bridge = IpcBridge::new(xi);
    /// let request = SymphonyIpcRequest::OpenFile {
    ///     path: "example.txt".into(),
    /// };
    /// let response = bridge.handle_request(request).await?;
    /// # Ok(())
    /// # }
    /// ```
    pub async fn handle_request(
        &self,
        request: SymphonyIpcRequest,
    ) -> XiResult<SymphonyIpcResponse> {
        match request {
            SymphonyIpcRequest::OpenFile { path } => {
                tracing::info!("IPC Bridge: Opening file {:?}", path);
                let view_id = self.xi.lock().await.open_file(&path).await?;
                Ok(SymphonyIpcResponse::ViewOpened { view_id })
            }

            SymphonyIpcRequest::CloseView { view_id } => {
                tracing::info!("IPC Bridge: Closing view {:?}", view_id);
                self.xi.lock().await.close_view(view_id).await?;
                Ok(SymphonyIpcResponse::ViewClosed { view_id })
            }

            SymphonyIpcRequest::Edit { view_id, operation } => {
                tracing::info!("IPC Bridge: Editing view {:?}", view_id);
                self.xi.lock().await.edit(view_id, operation).await?;
                Ok(SymphonyIpcResponse::EditApplied { view_id })
            }

            SymphonyIpcRequest::GetContent { view_id } => {
                tracing::info!("IPC Bridge: Getting content for view {:?}", view_id);
                let content = self.xi.lock().await.get_content(view_id).await?;
                Ok(SymphonyIpcResponse::Content { view_id, content })
            }

            // Not implemented yet - will be added in later phases
            SymphonyIpcRequest::Save { .. } => {
                tracing::warn!("IPC Bridge: Save not implemented yet");
                Ok(SymphonyIpcResponse::Error {
                    message: "Save operation not implemented yet".to_string(),
                })
            }

            SymphonyIpcRequest::Undo { .. } => {
                tracing::warn!("IPC Bridge: Undo not implemented yet");
                Ok(SymphonyIpcResponse::Error {
                    message: "Undo operation not implemented yet".to_string(),
                })
            }

            SymphonyIpcRequest::Redo { .. } => {
                tracing::warn!("IPC Bridge: Redo not implemented yet");
                Ok(SymphonyIpcResponse::Error {
                    message: "Redo operation not implemented yet".to_string(),
                })
            }

            SymphonyIpcRequest::Search { .. } => {
                tracing::warn!("IPC Bridge: Search not implemented yet");
                Ok(SymphonyIpcResponse::Error {
                    message: "Search operation not implemented yet".to_string(),
                })
            }
        }
    }

    /// Handle a Symphony IPC request safely
    ///
    /// This is a safe wrapper around `handle_request` that catches errors
    /// and converts them to error responses instead of propagating them.
    ///
    /// # Arguments
    ///
    /// * `request` - The Symphony IPC request to handle
    ///
    /// # Returns
    ///
    /// Always returns a `SymphonyIpcResponse`, either with the result or an error message.
    ///
    /// # Examples
    ///
    /// ```rust,no_run
    /// # use xi_integration::{IpcBridge, XiIntegration, XiConfig};
    /// # use xi_integration::types::SymphonyIpcRequest;
    /// # use std::sync::Arc;
    /// # use tokio::sync::Mutex;
    /// # async fn example() -> Result<(), Box<dyn std::error::Error>> {
    /// # let xi = Arc::new(Mutex::new(XiIntegration::new(XiConfig::default())?));
    /// # let bridge = IpcBridge::new(xi);
    /// let request = SymphonyIpcRequest::OpenFile {
    ///     path: "example.txt".into(),
    /// };
    /// // This will never panic, always returns a response
    /// let response = bridge.handle_request_safe(request).await;
    /// # Ok(())
    /// # }
    /// ```
    pub async fn handle_request_safe(&self, request: SymphonyIpcRequest) -> SymphonyIpcResponse {
        match self.handle_request(request).await {
            Ok(response) => response,
            Err(error) => {
                tracing::error!("IPC Bridge error: {}", error);
                SymphonyIpcResponse::Error {
                    message: error.to_string(),
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{XiConfig, EditOperation};

    #[tokio::test]
    async fn test_ipc_bridge_creation() {
        let xi = Arc::new(Mutex::new(XiIntegration::new(XiConfig::default()).unwrap()));
        let _bridge = IpcBridge::new(xi);
        // If we get here, creation succeeded
    }

    #[tokio::test]
    async fn test_ipc_bridge_open_file() {
        let xi = Arc::new(Mutex::new(XiIntegration::new(XiConfig::default()).unwrap()));
        let bridge = IpcBridge::new(xi);

        let request = SymphonyIpcRequest::OpenFile {
            path: "test.txt".into(),
        };

        let response = bridge.handle_request(request).await.unwrap();

        match response {
            SymphonyIpcResponse::ViewOpened { view_id } => {
                assert_eq!(view_id.0, 1);
            }
            _ => panic!("Expected ViewOpened response"),
        }
    }

    #[tokio::test]
    async fn test_ipc_bridge_edit() {
        let xi = Arc::new(Mutex::new(XiIntegration::new(XiConfig::default()).unwrap()));
        let bridge = IpcBridge::new(xi.clone());

        // Open file first
        let open_request = SymphonyIpcRequest::OpenFile {
            path: "test.txt".into(),
        };
        let open_response = bridge.handle_request(open_request).await.unwrap();

        let view_id = match open_response {
            SymphonyIpcResponse::ViewOpened { view_id } => view_id,
            _ => panic!("Expected ViewOpened"),
        };

        // Edit the file
        let edit_request = SymphonyIpcRequest::Edit {
            view_id,
            operation: EditOperation::Insert {
                position: 0,
                text: "Hello, World!".to_string(),
            },
        };

        let edit_response = bridge.handle_request(edit_request).await.unwrap();

        match edit_response {
            SymphonyIpcResponse::EditApplied { .. } => {
                // Success!
            }
            _ => panic!("Expected EditApplied response"),
        }

        // Verify content
        let content = xi.lock().await.get_content(view_id).await.unwrap();
        assert_eq!(content, "Hello, World!");
    }

    #[tokio::test]
    async fn test_ipc_bridge_get_content() {
        let xi = Arc::new(Mutex::new(XiIntegration::new(XiConfig::default()).unwrap()));
        let bridge = IpcBridge::new(xi.clone());

        // Open and edit file
        let open_request = SymphonyIpcRequest::OpenFile {
            path: "test.txt".into(),
        };
        let open_response = bridge.handle_request(open_request).await.unwrap();
        let view_id = match open_response {
            SymphonyIpcResponse::ViewOpened { view_id } => view_id,
            _ => panic!("Expected ViewOpened"),
        };

        let edit_request = SymphonyIpcRequest::Edit {
            view_id,
            operation: EditOperation::Insert {
                position: 0,
                text: "Test content".to_string(),
            },
        };
        bridge.handle_request(edit_request).await.unwrap();

        // Get content
        let get_request = SymphonyIpcRequest::GetContent { view_id };
        let get_response = bridge.handle_request(get_request).await.unwrap();

        match get_response {
            SymphonyIpcResponse::Content { content, .. } => {
                assert_eq!(content, "Test content");
            }
            _ => panic!("Expected Content response"),
        }
    }

    #[tokio::test]
    async fn test_ipc_bridge_close_view() {
        let xi = Arc::new(Mutex::new(XiIntegration::new(XiConfig::default()).unwrap()));
        let bridge = IpcBridge::new(xi.clone());

        // Open file
        let open_request = SymphonyIpcRequest::OpenFile {
            path: "test.txt".into(),
        };
        let open_response = bridge.handle_request(open_request).await.unwrap();
        let view_id = match open_response {
            SymphonyIpcResponse::ViewOpened { view_id } => view_id,
            _ => panic!("Expected ViewOpened"),
        };

        // Close view
        let close_request = SymphonyIpcRequest::CloseView { view_id };
        let close_response = bridge.handle_request(close_request).await.unwrap();

        match close_response {
            SymphonyIpcResponse::ViewClosed { .. } => {
                // Success!
            }
            _ => panic!("Expected ViewClosed response"),
        }
    }

    #[tokio::test]
    async fn test_ipc_bridge_safe_error_handling() {
        let xi = Arc::new(Mutex::new(XiIntegration::new(XiConfig::default()).unwrap()));
        let bridge = IpcBridge::new(xi);

        // Try to get content from invalid view
        let request = SymphonyIpcRequest::GetContent {
            view_id: crate::ViewId(999),
        };

        let response = bridge.handle_request_safe(request).await;

        match response {
            SymphonyIpcResponse::Error { message } => {
                assert!(message.contains("Invalid view ID"));
            }
            _ => panic!("Expected Error response"),
        }
    }
}
