//! Xi-editor integration layer for Symphony IDE
//!
//! This crate provides the integration layer between xi-editor's proven text editing core
//! and Symphony IDE's architecture. It wraps xi-editor components and provides a
//! Symphony-compatible API for text editing operations.
//!
//! # Architecture
//!
//! The integration follows a layered approach:
//! - **Xi-Core Layer**: Direct usage of xi-editor crates (xi-rope, xi-core-lib, xi-rpc, xi-trace)
//! - **Integration Layer**: Translation between Symphony IPC and Xi-RPC protocols
//! - **Frontend Adaptation**: Connection to Monaco Editor for visual representation
//!
//! # Key Components
//!
//! - [`XiIntegration`]: Main integration point wrapping xi-core functionality
//! - [`error`]: Error types for xi-integration operations
//! - [`types`]: Type definitions for Symphony-Xi communication
//!
//! # Examples
//!
//! ```rust,no_run
//! use xi_integration::{XiIntegration, XiConfig};
//!
//! # async fn example() -> Result<(), Box<dyn std::error::Error>> {
//! // Initialize xi-core integration
//! let mut xi = XiIntegration::new(XiConfig::default())?;
//!
//! // Open a file
//! let view_id = xi.open_file("example.txt").await?;
//!
//! // Get file content
//! let content = xi.get_content(view_id).await?;
//! println!("File content: {}", content);
//! # Ok(())
//! # }
//! ```
//!
//! # Requirements
//!
//! This integration satisfies the following requirements from the xi-editor migration spec:
//! - Requirement 1.1: Use Xi-Editor's rope implementation directly
//! - Requirement 17.1: Use Xi-Editor code directly without migrating from scaffold packages
//! - Requirement 17.3: Reference xi-editor as the canonical implementation

// Re-export xi-editor types for convenience
pub use xi_rope::{Rope, RopeDelta, Interval};
pub use xi_core_lib;
pub use xi_rpc;
pub use xi_trace;

// Module declarations
pub mod error;
pub mod types;
pub mod ipc_bridge;
pub mod buffer_manager;
pub mod editor_wrapper;

// Re-export commonly used types
pub use error::{XiError, XiResult};
pub use types::{
    ViewId, EditOperation, BufferMetadata, XiConfig, LineEnding,
    SymphonyIpcRequest, SymphonyIpcResponse, SymphonyIpcMessage, SymphonyUpdateOp,
};
pub use ipc_bridge::IpcBridge;
pub use buffer_manager::BufferManager;
pub use editor_wrapper::EditorWrapper;

// Re-export xi-core Editor for advanced use cases
pub use xi_core_lib::editor::Editor;

use std::collections::HashMap;
use std::path::Path;

/// Main integration point for xi-editor within Symphony
///
/// `XiIntegration` wraps xi-core functionality and provides a Symphony-compatible
/// API for text editing operations. It manages buffer lifecycle, edit operations,
/// and synchronization with the frontend.
///
/// # Thread Safety
///
/// This struct is designed to be used with `Arc<Mutex<XiIntegration>>` for
/// safe concurrent access across async tasks.
///
/// # Examples
///
/// ```rust,no_run
/// use xi_integration::{XiIntegration, XiConfig};
/// use std::sync::Arc;
/// use tokio::sync::Mutex;
///
/// # async fn example() -> Result<(), Box<dyn std::error::Error>> {
/// let xi = Arc::new(Mutex::new(XiIntegration::new(XiConfig::default())?));
///
/// // Open a file
/// let view_id = xi.lock().await.open_file("example.txt").await?;
///
/// // Perform edit operation
/// let edit = xi_integration::EditOperation::Insert {
///     position: 0,
///     text: "Hello, World!".to_string(),
/// };
/// xi.lock().await.edit(view_id, edit).await?;
/// # Ok(())
/// # }
/// ```
pub struct XiIntegration {
    /// Active buffer views
    views: HashMap<ViewId, ViewState>,
    /// Configuration
    _config: XiConfig,
    /// Next view ID counter
    next_view_id: u64,
}

/// Internal state for a view
///
/// Uses EditorWrapper which wraps xi-core's Editor and provides undo/redo functionality.
/// The wrapper maintains its own undo/redo history until we have proper API access
/// to Editor's private methods.
struct ViewState {
    /// File path if associated with a file
    path: Option<std::path::PathBuf>,
    /// Editor wrapper with undo/redo support
    editor: EditorWrapper,
}

impl XiIntegration {
    /// Create a new Xi-Core integration instance
    ///
    /// Initializes the xi-core integration with the provided configuration.
    ///
    /// # Arguments
    ///
    /// * `config` - Configuration for xi-core behavior
    ///
    /// # Returns
    ///
    /// Returns a new `XiIntegration` instance or an error if initialization fails.
    ///
    /// # Examples
    ///
    /// ```rust
    /// use xi_integration::{XiIntegration, XiConfig};
    ///
    /// let xi = XiIntegration::new(XiConfig::default()).unwrap();
    /// ```
    pub fn new(config: XiConfig) -> XiResult<Self> {
        tracing::info!("Initializing Xi-Core integration");
        
        Ok(Self {
            views: HashMap::new(),
            _config: config,
            next_view_id: 1,
        })
    }

    /// Open a file and create a new view
    ///
    /// Loads the file content into xi-core's Editor and creates a new view.
    /// If the file doesn't exist, creates an empty buffer.
    ///
    /// Now uses xi-core's Editor which provides undo/redo, search, and other
    /// features automatically through the CRDT engine.
    ///
    /// # Arguments
    ///
    /// * `path` - Path to the file to open
    ///
    /// # Returns
    ///
    /// Returns the `ViewId` for the newly created view.
    ///
    /// # Errors
    ///
    /// Returns an error if the file cannot be read or if the content is invalid UTF-8.
    ///
    /// # Examples
    ///
    /// ```rust,no_run
    /// # use xi_integration::XiIntegration;
    /// # async fn example(xi: &mut XiIntegration) -> Result<(), Box<dyn std::error::Error>> {
    /// let view_id = xi.open_file("example.txt").await?;
    /// println!("Opened file with view ID: {:?}", view_id);
    /// # Ok(())
    /// # }
    /// ```
    pub async fn open_file<P: AsRef<Path>>(&mut self, path: P) -> XiResult<ViewId> {
        let path = path.as_ref();
        tracing::info!("Opening file: {:?}", path);

        // Read file content or create empty buffer
        let content = if path.exists() {
            tokio::fs::read_to_string(path)
                .await
                .map_err(|e| XiError::FileIo {
                    path: path.to_path_buf(),
                    source: e,
                })?
        } else {
            String::new()
        };

        // Create EditorWrapper with content (includes undo/redo support)
        let editor = EditorWrapper::with_text(&content);

        // Generate new view ID
        let view_id = ViewId(self.next_view_id);
        self.next_view_id += 1;

        // Create view state
        let view_state = ViewState {
            path: Some(path.to_path_buf()),
            editor,
        };

        self.views.insert(view_id, view_state);

        tracing::info!("Created view {:?} for file: {:?}", view_id, path);
        Ok(view_id)
    }

    /// Get the content of a view as a string
    ///
    /// Extracts the buffer content from the view.
    ///
    /// Note: Currently uses a content cache since Editor's get_buffer() is private.
    /// Once we have proper API access to Editor, we'll use editor.get_buffer() directly.
    ///
    /// # Arguments
    ///
    /// * `view_id` - The view to get content from
    ///
    /// # Returns
    ///
    /// Returns the buffer content as a `String`.
    ///
    /// # Errors
    ///
    /// Returns an error if the view ID is invalid.
    ///
    /// # Examples
    ///
    /// ```rust,no_run
    /// # use xi_integration::{XiIntegration, ViewId};
    /// # async fn example(xi: &XiIntegration, view_id: ViewId) -> Result<(), Box<dyn std::error::Error>> {
    /// let content = xi.get_content(view_id).await?;
    /// println!("Content: {}", content);
    /// # Ok(())
    /// # }
    /// ```
    pub async fn get_content(&self, view_id: ViewId) -> XiResult<String> {
        let view = self.views.get(&view_id)
            .ok_or(XiError::InvalidViewId(view_id))?;

        // Get content from editor wrapper
        Ok(view.editor.get_buffer().to_string())
    }

    /// Apply an edit operation to a view
    ///
    /// Applies the specified edit operation to the buffer using xi-core's Editor.
    /// The Editor automatically tracks the edit in its CRDT engine for undo/redo.
    ///
    /// Note: Currently applies edits to both Editor (via reload) and content cache.
    /// Editor::reload() preserves undo state, so we're using xi-core's undo system.
    ///
    /// # Arguments
    ///
    /// * `view_id` - The view to edit
    /// * `operation` - The edit operation to apply
    ///
    /// # Errors
    ///
    /// Returns an error if the view ID is invalid or the operation is out of bounds.
    ///
    /// # Examples
    ///
    /// ```rust,no_run
    /// # use xi_integration::{XiIntegration, ViewId, EditOperation};
    /// # async fn example(xi: &mut XiIntegration, view_id: ViewId) -> Result<(), Box<dyn std::error::Error>> {
    /// let edit = EditOperation::Insert {
    ///     position: 0,
    ///     text: "Hello".to_string(),
    /// };
    /// xi.edit(view_id, edit).await?;
    /// # Ok(())
    /// # }
    /// ```
    pub async fn edit(&mut self, view_id: ViewId, operation: EditOperation) -> XiResult<()> {
        use xi_rope::DeltaBuilder;
        
        let view = self.views.get_mut(&view_id)
            .ok_or(XiError::InvalidViewId(view_id))?;

        // Get current buffer from editor wrapper
        let current_buffer = view.editor.get_buffer();
        let buffer_len = current_buffer.len();
        
        // Build delta based on operation type
        let delta = match operation {
            EditOperation::Insert { position, text } => {
                let mut builder = DeltaBuilder::new(buffer_len);
                builder.replace(position..position, text.into());
                builder.build()
            }
            EditOperation::Delete { start, end } => {
                let mut builder = DeltaBuilder::new(buffer_len);
                builder.replace(start..end, Rope::from(""));
                builder.build()
            }
            EditOperation::Replace { start, end, text } => {
                let mut builder = DeltaBuilder::new(buffer_len);
                builder.replace(start..end, text.into());
                builder.build()
            }
        };

        // Apply delta and reload editor (this adds to undo history!)
        let new_text = delta.apply(current_buffer);
        view.editor.reload(new_text);

        Ok(())
    }

    /// Close a view and cleanup resources
    ///
    /// Removes the view from the active views map.
    ///
    /// # Arguments
    ///
    /// * `view_id` - The view to close
    ///
    /// # Errors
    ///
    /// Returns an error if the view ID is invalid.
    pub async fn close_view(&mut self, view_id: ViewId) -> XiResult<()> {
        self.views.remove(&view_id)
            .ok_or(XiError::InvalidViewId(view_id))?;

        tracing::info!("Closed view {:?}", view_id);
        Ok(())
    }

    /// Get metadata for a view
    ///
    /// Returns information about the buffer including path and dirty state.
    ///
    /// Note: Dirty state tracking is currently simplified. Once we have proper
    /// access to Editor's is_pristine() method, we'll use xi-core's pristine
    /// revision tracking.
    ///
    /// # Arguments
    ///
    /// * `view_id` - The view to get metadata for
    ///
    /// # Errors
    ///
    /// Returns an error if the view ID is invalid.
    pub fn get_metadata(&self, view_id: ViewId) -> XiResult<BufferMetadata> {
        let view = self.views.get(&view_id)
            .ok_or(XiError::InvalidViewId(view_id))?;

        Ok(BufferMetadata {
            path: view.path.clone(),
            // Mark as dirty if there are any undo operations available
            // (meaning edits have been made)
            dirty: view.editor.can_undo(),
            size: view.editor.get_buffer().len(),
        })
    }
    
    /// Undo the last edit operation
    ///
    /// Restores the buffer to its previous state using the EditorWrapper's
    /// undo functionality. The wrapper maintains its own undo history until
    /// we have proper API access to xi-core's internal undo system.
    ///
    /// # Arguments
    ///
    /// * `view_id` - The view to undo in
    ///
    /// # Returns
    ///
    /// Returns `Ok(())` if undo was successful, or an error if the view ID
    /// is invalid or there's nothing to undo.
    ///
    /// # Examples
    ///
    /// ```rust,no_run
    /// # use xi_integration::{XiIntegration, ViewId, EditOperation};
    /// # async fn example(xi: &mut XiIntegration, view_id: ViewId) -> Result<(), Box<dyn std::error::Error>> {
    /// // Make an edit
    /// xi.edit(view_id, EditOperation::Insert {
    ///     position: 0,
    ///     text: "Hello".to_string(),
    /// }).await?;
    ///
    /// // Undo the edit
    /// xi.undo(view_id).await?;
    /// # Ok(())
    /// # }
    /// ```
    pub async fn undo(&mut self, view_id: ViewId) -> XiResult<()> {
        let view = self.views.get_mut(&view_id)
            .ok_or(XiError::InvalidViewId(view_id))?;

        if view.editor.undo() {
            tracing::info!("Undo operation successful for view {:?}", view_id);
            Ok(())
        } else {
            tracing::warn!("No undo history available for view {:?}", view_id);
            Err(XiError::Protocol("No undo history available".to_string()))
        }
    }
    
    /// Redo the last undone edit operation
    ///
    /// Restores the buffer to the next state using the EditorWrapper's
    /// redo functionality. The wrapper maintains its own redo history until
    /// we have proper API access to xi-core's internal undo system.
    ///
    /// # Arguments
    ///
    /// * `view_id` - The view to redo in
    ///
    /// # Returns
    ///
    /// Returns `Ok(())` if redo was successful, or an error if the view ID
    /// is invalid or there's nothing to redo.
    ///
    /// # Examples
    ///
    /// ```rust,no_run
    /// # use xi_integration::{XiIntegration, ViewId, EditOperation};
    /// # async fn example(xi: &mut XiIntegration, view_id: ViewId) -> Result<(), Box<dyn std::error::Error>> {
    /// // Make an edit
    /// xi.edit(view_id, EditOperation::Insert {
    ///     position: 0,
    ///     text: "Hello".to_string(),
    /// }).await?;
    ///
    /// // Undo the edit
    /// xi.undo(view_id).await?;
    ///
    /// // Redo the edit
    /// xi.redo(view_id).await?;
    /// # Ok(())
    /// # }
    /// ```
    pub async fn redo(&mut self, view_id: ViewId) -> XiResult<()> {
        let view = self.views.get_mut(&view_id)
            .ok_or(XiError::InvalidViewId(view_id))?;

        if view.editor.redo() {
            tracing::info!("Redo operation successful for view {:?}", view_id);
            Ok(())
        } else {
            tracing::warn!("No redo history available for view {:?}", view_id);
            Err(XiError::Protocol("No redo history available".to_string()))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_create_integration() {
        let xi = XiIntegration::new(XiConfig::default());
        assert!(xi.is_ok());
    }

    #[tokio::test]
    async fn test_open_nonexistent_file() {
        let mut xi = XiIntegration::new(XiConfig::default()).unwrap();
        let view_id = xi.open_file("nonexistent.txt").await.unwrap();
        
        let content = xi.get_content(view_id).await.unwrap();
        assert_eq!(content, "");
    }

    #[tokio::test]
    async fn test_edit_operations() {
        let mut xi = XiIntegration::new(XiConfig::default()).unwrap();
        let view_id = xi.open_file("test.txt").await.unwrap();

        // Insert text
        xi.edit(view_id, EditOperation::Insert {
            position: 0,
            text: "Hello, World!".to_string(),
        }).await.unwrap();

        let content = xi.get_content(view_id).await.unwrap();
        assert_eq!(content, "Hello, World!");

        // Check dirty state
        let metadata = xi.get_metadata(view_id).unwrap();
        assert!(metadata.dirty);
    }

    #[tokio::test]
    async fn test_undo_redo() {
        let mut xi = XiIntegration::new(XiConfig::default()).unwrap();
        let view_id = xi.open_file("test.txt").await.unwrap();

        // Initial state: empty
        let content = xi.get_content(view_id).await.unwrap();
        assert_eq!(content, "");

        // Edit 1: Insert "Hello"
        xi.edit(view_id, EditOperation::Insert {
            position: 0,
            text: "Hello".to_string(),
        }).await.unwrap();
        assert_eq!(xi.get_content(view_id).await.unwrap(), "Hello");

        // Edit 2: Insert ", World!"
        xi.edit(view_id, EditOperation::Insert {
            position: 5,
            text: ", World!".to_string(),
        }).await.unwrap();
        assert_eq!(xi.get_content(view_id).await.unwrap(), "Hello, World!");

        // Undo: Should go back to "Hello"
        xi.undo(view_id).await.unwrap();
        assert_eq!(xi.get_content(view_id).await.unwrap(), "Hello");

        // Undo again: Should go back to empty
        xi.undo(view_id).await.unwrap();
        assert_eq!(xi.get_content(view_id).await.unwrap(), "");

        // Redo: Should restore "Hello"
        xi.redo(view_id).await.unwrap();
        assert_eq!(xi.get_content(view_id).await.unwrap(), "Hello");

        // Redo again: Should restore "Hello, World!"
        xi.redo(view_id).await.unwrap();
        assert_eq!(xi.get_content(view_id).await.unwrap(), "Hello, World!");
    }

    #[tokio::test]
    async fn test_undo_clears_redo() {
        let mut xi = XiIntegration::new(XiConfig::default()).unwrap();
        let view_id = xi.open_file("test.txt").await.unwrap();

        // Make two edits
        xi.edit(view_id, EditOperation::Insert {
            position: 0,
            text: "A".to_string(),
        }).await.unwrap();
        
        xi.edit(view_id, EditOperation::Insert {
            position: 1,
            text: "B".to_string(),
        }).await.unwrap();

        // Undo once
        xi.undo(view_id).await.unwrap();
        assert_eq!(xi.get_content(view_id).await.unwrap(), "A");

        // Make a new edit - this should clear redo history
        xi.edit(view_id, EditOperation::Insert {
            position: 1,
            text: "C".to_string(),
        }).await.unwrap();
        assert_eq!(xi.get_content(view_id).await.unwrap(), "AC");

        // Redo should fail (no redo history)
        let result = xi.redo(view_id).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_undo_without_edits() {
        let mut xi = XiIntegration::new(XiConfig::default()).unwrap();
        let view_id = xi.open_file("test.txt").await.unwrap();

        // Try to undo without any edits
        let result = xi.undo(view_id).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_redo_without_undo() {
        let mut xi = XiIntegration::new(XiConfig::default()).unwrap();
        let view_id = xi.open_file("test.txt").await.unwrap();

        // Make an edit
        xi.edit(view_id, EditOperation::Insert {
            position: 0,
            text: "Hello".to_string(),
        }).await.unwrap();

        // Try to redo without undo
        let result = xi.redo(view_id).await;
        assert!(result.is_err());
    }
}
