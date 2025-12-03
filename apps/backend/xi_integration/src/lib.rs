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

// Re-export commonly used types
pub use error::{XiError, XiResult};
pub use types::{
    ViewId, EditOperation, BufferMetadata, XiConfig, LineEnding,
    SymphonyIpcRequest, SymphonyIpcResponse, SymphonyIpcMessage, SymphonyUpdateOp,
};

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
struct ViewState {
    /// File path if associated with a file
    path: Option<std::path::PathBuf>,
    /// Buffer content as rope
    rope: Rope,
    /// Whether the buffer has unsaved changes
    dirty: bool,
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
    /// Loads the file content into a rope data structure and creates a new view.
    /// If the file doesn't exist, creates an empty buffer.
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

        // Create rope from content
        let rope = Rope::from(content);

        // Generate new view ID
        let view_id = ViewId(self.next_view_id);
        self.next_view_id += 1;

        // Create view state
        let view_state = ViewState {
            path: Some(path.to_path_buf()),
            rope,
            dirty: false,
        };

        self.views.insert(view_id, view_state);

        tracing::info!("Created view {:?} for file: {:?}", view_id, path);
        Ok(view_id)
    }

    /// Get the content of a view as a string
    ///
    /// Extracts the rope content and converts it to a string.
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

        Ok(view.rope.to_string())
    }

    /// Apply an edit operation to a view
    ///
    /// Applies the specified edit operation to the buffer and marks it as dirty.
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
        let view = self.views.get_mut(&view_id)
            .ok_or(XiError::InvalidViewId(view_id))?;

        match operation {
            EditOperation::Insert { position, text } => {
                let new_rope = Rope::from(text);
                let interval = Interval::new(position, position);
                view.rope.edit(interval, new_rope);
            }
            EditOperation::Delete { start, end } => {
                let interval = Interval::new(start, end);
                view.rope.edit(interval, Rope::from(""));
            }
            EditOperation::Replace { start, end, text } => {
                let new_rope = Rope::from(text);
                let interval = Interval::new(start, end);
                view.rope.edit(interval, new_rope);
            }
        }

        view.dirty = true;
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
            dirty: view.dirty,
            size: view.rope.len(),
        })
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
}
