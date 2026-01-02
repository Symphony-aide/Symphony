//! Type definitions for XI-editor adapter
//!
//! Provides XI-editor specific types and data structures used throughout
//! the adapter implementation.

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use symphony_core_ports::{BufferId, ViewId};

/// XI-editor process status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ProcessStatus {
    /// Process is stopped
    Stopped,
    /// Process is starting
    Starting,
    /// Process is running
    Running,
    /// Process has started successfully
    Started,
    /// Process is stopping
    Stopping,
    /// Process has died unexpectedly
    Died,
    /// Process restart failed
    RestartFailed,
    /// Process was restarted
    Restarted { 
        /// Number of times the process has been restarted
        count: usize 
    },
}

/// JSON-RPC request structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonRpcRequest {
    /// JSON-RPC version (always "2.0")
    pub jsonrpc: String,
    /// Method name
    pub method: String,
    /// Parameters (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub params: Option<serde_json::Value>,
    /// Request ID
    pub id: serde_json::Value,
}

/// JSON-RPC notification structure (no response expected)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonRpcNotification {
    /// JSON-RPC version (always "2.0")
    pub jsonrpc: String,
    /// Method name
    pub method: String,
    /// Parameters (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub params: Option<serde_json::Value>,
}

/// JSON-RPC response structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonRpcResponse {
    /// JSON-RPC version (always "2.0")
    pub jsonrpc: String,
    /// Result (present on success)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result: Option<serde_json::Value>,
    /// Error (present on failure)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<JsonRpcError>,
    /// Request ID
    pub id: serde_json::Value,
}

/// JSON-RPC error structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonRpcError {
    /// Error code
    pub code: i32,
    /// Error message
    pub message: String,
    /// Additional error data (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<serde_json::Value>,
}

/// XI-editor text delta for edit operations
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TextDelta {
    /// Operations in the delta
    pub ops: Vec<DeltaOp>,
}

/// Delta operation
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "op")]
pub enum DeltaOp {
    /// Retain characters
    #[serde(rename = "retain")]
    Retain { 
        /// Number of characters to retain
        n: usize 
    },
    /// Insert text
    #[serde(rename = "insert")]
    Insert { 
        /// Text to insert
        chars: String 
    },
    /// Delete characters
    #[serde(rename = "delete")]
    Delete { 
        /// Number of characters to delete
        n: usize 
    },
}

/// XI-editor view update structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ViewUpdate {
    /// Lines in the view
    pub lines: Vec<Line>,
    /// Whether the buffer is pristine (unsaved changes)
    pub pristine: bool,
    /// Cursor positions
    pub cursor: Vec<u64>,
    /// Selection ranges
    pub selection: Vec<Selection>,
}

/// Line in a view
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Line {
    /// Text content of the line
    pub text: String,
    /// Cursor positions on this line
    pub cursor: Vec<u64>,
    /// Style spans for syntax highlighting
    pub styles: Vec<StyleSpan>,
}

/// Selection range
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Selection {
    /// Start position
    pub start: u64,
    /// End position
    pub end: u64,
    /// Cursor position within selection
    pub cursor: u64,
}

/// Style span for syntax highlighting
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StyleSpan {
    /// Offset from line start
    pub offset: u64,
    /// Length of the span
    pub len: u64,
    /// Style ID
    pub style_id: u32,
}

/// Plugin description from XI-editor
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginDescription {
    /// Plugin name
    pub name: String,
    /// Plugin version
    pub version: String,
    /// Plugin description
    pub description: String,
}

/// XI-editor event types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "method")]
pub enum XiEvent {
    /// Buffer update event
    #[serde(rename = "update")]
    Update {
        /// Parameters containing `view_id`, update, and revision
        params: UpdateParams,
    },
    /// Scroll event
    #[serde(rename = "scroll_to")]
    ScrollTo {
        /// Parameters containing `view_id`, line, and column
        params: ScrollParams,
    },
    /// Configuration changed event
    #[serde(rename = "config_changed")]
    ConfigChanged {
        /// Parameters containing `view_id` and changes
        params: ConfigParams,
    },
    /// Theme changed event
    #[serde(rename = "theme_changed")]
    ThemeChanged {
        /// Parameters containing theme name and data
        params: ThemeParams,
    },
    /// Available plugins event
    #[serde(rename = "available_plugins")]
    AvailablePlugins {
        /// Parameters containing `view_id` and plugins
        params: PluginsParams,
    },
    /// Plugin started event
    #[serde(rename = "plugin_started")]
    PluginStarted {
        /// Parameters containing `view_id` and plugin name
        params: PluginStatusParams,
    },
    /// Plugin stopped event
    #[serde(rename = "plugin_stopped")]
    PluginStopped {
        /// Parameters containing `view_id`, plugin name, and exit code
        params: PluginStoppedParams,
    },
}

/// Parameters for update event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateParams {
    /// View ID
    pub view_id: String,
    /// View update data
    pub update: ViewUpdate,
    /// Revision number
    pub rev: u64,
}

/// Parameters for scroll event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScrollParams {
    /// View ID
    pub view_id: String,
    /// Line number
    pub line: u64,
    /// Column number
    pub col: u64,
}

/// Parameters for config changed event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfigParams {
    /// View ID
    pub view_id: String,
    /// Configuration changes
    pub changes: serde_json::Value,
}

/// Parameters for theme changed event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemeParams {
    /// Theme name
    pub name: String,
    /// Theme data
    pub theme: serde_json::Value,
}

/// Parameters for plugins event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginsParams {
    /// View ID
    pub view_id: String,
    /// Available plugins
    pub plugins: Vec<PluginDescription>,
}

/// Parameters for plugin status event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginStatusParams {
    /// View ID
    pub view_id: String,
    /// Plugin name
    pub plugin: String,
}

/// Parameters for plugin stopped event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginStoppedParams {
    /// View ID
    pub view_id: String,
    /// Plugin name
    pub plugin: String,
    /// Exit code
    pub code: i32,
}

/// Buffer metadata for caching
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BufferMetadata {
    /// Buffer ID
    pub buffer_id: BufferId,
    /// Associated file path
    pub file_path: Option<PathBuf>,
    /// Current revision number
    pub revision: u64,
    /// Whether buffer has unsaved changes
    pub pristine: bool,
    /// Current cursor positions
    pub cursor_positions: Vec<u64>,
    /// Current selections
    pub selections: Vec<Selection>,
    /// Last update timestamp
    pub last_updated: chrono::DateTime<chrono::Utc>,
    /// Associated views
    pub views: Vec<ViewId>,
}

impl BufferMetadata {
    /// Create new buffer metadata
    #[must_use]
    pub fn new(buffer_id: BufferId) -> Self {
        Self {
            buffer_id,
            file_path: None,
            revision: 0,
            pristine: true,
            cursor_positions: Vec::new(),
            selections: Vec::new(),
            last_updated: chrono::Utc::now(),
            views: Vec::new(),
        }
    }
    
    /// Update metadata from view update
    pub fn update_from_view_update(&mut self, update: &ViewUpdate, revision: u64) {
        self.revision = revision;
        self.pristine = update.pristine;
        self.cursor_positions.clone_from(&update.cursor);
        self.selections.clone_from(&update.selection);
        self.last_updated = chrono::Utc::now();
    }
    
    /// Check if buffer is dirty (has unsaved changes)
    #[must_use]
    pub const fn is_dirty(&self) -> bool {
        !self.pristine
    }
}

/// File system synchronization event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SyncEvent {
    /// File was changed externally
    FileChanged { 
        /// Path to the changed file
        path: PathBuf 
    },
    /// File was created
    FileCreated { 
        /// Path to the created file
        path: PathBuf 
    },
    /// File was deleted
    FileDeleted { 
        /// Path to the deleted file
        path: PathBuf 
    },
}

#[cfg(test)]
mod tests {
    use super::*;
    use uuid::Uuid;

    #[test]
    fn test_process_status() {
        assert_eq!(ProcessStatus::Stopped, ProcessStatus::Stopped);
        assert_ne!(ProcessStatus::Running, ProcessStatus::Stopped);
    }
    
    #[test]
    fn test_json_rpc_request_serialization() {
        let request = JsonRpcRequest {
            jsonrpc: "2.0".to_string(),
            method: "test_method".to_string(),
            params: Some(serde_json::json!({"key": "value"})),
            id: serde_json::Value::Number(serde_json::Number::from(1)),
        };
        
        let json = serde_json::to_string(&request);
        assert!(json.is_ok());
        let json = json.unwrap();
        assert!(json.contains("\"jsonrpc\":\"2.0\""));
        assert!(json.contains("\"method\":\"test_method\""));
        assert!(json.contains("\"id\":1"));
    }
    
    #[test]
    fn test_json_rpc_response_serialization() {
        let response = JsonRpcResponse {
            jsonrpc: "2.0".to_string(),
            result: Some(serde_json::Value::String("success".to_string())),
            error: None,
            id: serde_json::Value::Number(serde_json::Number::from(1)),
        };
        
        let json = serde_json::to_string(&response);
        assert!(json.is_ok());
        let json = json.unwrap();
        assert!(json.contains("\"result\":\"success\""));
        assert!(!json.contains("\"error\""));
    }
    
    #[test]
    fn test_buffer_metadata_creation() {
        let buffer_id = BufferId(Uuid::new_v4());
        let metadata = BufferMetadata::new(buffer_id);
        
        assert_eq!(metadata.buffer_id, buffer_id);
        assert!(metadata.file_path.is_none());
        assert_eq!(metadata.revision, 0);
        assert!(metadata.pristine);
        assert!(metadata.cursor_positions.is_empty());
        assert!(metadata.selections.is_empty());
        assert!(metadata.views.is_empty());
    }
    
    #[test]
    fn test_buffer_metadata_update() {
        let buffer_id = BufferId(Uuid::new_v4());
        let mut metadata = BufferMetadata::new(buffer_id);
        
        let update = ViewUpdate {
            lines: vec![],
            pristine: false,
            cursor: vec![10, 20],
            selection: vec![Selection { start: 0, end: 5, cursor: 5 }],
        };
        
        metadata.update_from_view_update(&update, 42);
        
        assert_eq!(metadata.revision, 42);
        assert!(!metadata.pristine);
        assert_eq!(metadata.cursor_positions, vec![10, 20]);
        assert_eq!(metadata.selections.len(), 1);
        assert!(metadata.is_dirty());
    }
    
    #[test]
    fn test_xi_event_deserialization() {
        let json = r#"{
            "method": "update",
            "params": {
                "view_id": "test-view",
                "update": {
                    "lines": [],
                    "pristine": true,
                    "cursor": [0],
                    "selection": []
                },
                "rev": 1
            }
        }"#;
        
        let event: Result<XiEvent, _> = serde_json::from_str(json);
        assert!(event.is_ok());
        let event = event.unwrap();
        
        match event {
            XiEvent::Update { params } => {
                assert_eq!(params.view_id, "test-view");
                assert_eq!(params.rev, 1);
                assert!(params.update.pristine);
            }
            _ => unreachable!("Expected Update event"),
        }
    }
}