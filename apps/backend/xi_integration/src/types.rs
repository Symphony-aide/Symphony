//! Type definitions for Symphony-Xi communication
//!
//! This module defines the core types used for communication between Symphony
//! and xi-core, including view identifiers, edit operations, and configuration.

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// Unique identifier for a view (buffer)
///
/// Each open file or buffer in xi-core is associated with a unique `ViewId`.
/// This identifier is used to reference the buffer in all operations.
///
/// # Examples
///
/// ```rust
/// use xi_integration::ViewId;
///
/// let view_id = ViewId(1);
/// println!("View ID: {:?}", view_id);
/// ```
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct ViewId(pub u64);

/// Edit operation types
///
/// Represents the different types of edit operations that can be performed
/// on a buffer. All positions are byte offsets into the buffer.
///
/// # Examples
///
/// ```rust
/// use xi_integration::EditOperation;
///
/// // Insert text at position 0
/// let insert = EditOperation::Insert {
///     position: 0,
///     text: "Hello".to_string(),
/// };
///
/// // Delete text from position 5 to 10
/// let delete = EditOperation::Delete {
///     start: 5,
///     end: 10,
/// };
///
/// // Replace text from position 0 to 5 with new text
/// let replace = EditOperation::Replace {
///     start: 0,
///     end: 5,
///     text: "World".to_string(),
/// };
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EditOperation {
    /// Insert text at a specific position
    Insert {
        /// Byte offset where text should be inserted
        position: usize,
        /// Text to insert
        text: String,
    },

    /// Delete text in a range
    Delete {
        /// Start byte offset (inclusive)
        start: usize,
        /// End byte offset (exclusive)
        end: usize,
    },

    /// Replace text in a range with new text
    Replace {
        /// Start byte offset (inclusive)
        start: usize,
        /// End byte offset (exclusive)
        end: usize,
        /// New text to replace with
        text: String,
    },
}

/// Metadata about a buffer
///
/// Contains information about a buffer's state including file path,
/// dirty state, and size.
///
/// # Examples
///
/// ```rust
/// use xi_integration::BufferMetadata;
/// use std::path::PathBuf;
///
/// let metadata = BufferMetadata {
///     path: Some(PathBuf::from("example.txt")),
///     dirty: true,
///     size: 1024,
/// };
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BufferMetadata {
    /// File path if associated with a file
    pub path: Option<PathBuf>,
    /// Whether the buffer has unsaved changes
    pub dirty: bool,
    /// Size of the buffer in bytes
    pub size: usize,
}

/// Configuration for xi-core integration
///
/// Contains settings that control xi-core behavior. These settings are
/// synchronized with Symphony's configuration system.
///
/// # Examples
///
/// ```rust
/// use xi_integration::XiConfig;
///
/// let config = XiConfig {
///     tab_size: 4,
///     translate_tabs_to_spaces: true,
///     word_wrap: false,
///     auto_indent: true,
///     ..Default::default()
/// };
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct XiConfig {
    /// Tab size in spaces
    pub tab_size: usize,
    /// Whether to convert tabs to spaces
    pub translate_tabs_to_spaces: bool,
    /// Whether to enable word wrap
    pub word_wrap: bool,
    /// Whether to enable auto-indent
    pub auto_indent: bool,
    /// Font family for editor
    pub font_face: Option<String>,
    /// Font size in points
    pub font_size: Option<f32>,
    /// Whether to trim trailing whitespace on save
    pub trim_trailing_whitespace: bool,
    /// Line ending style preference
    pub line_ending: LineEnding,
}

impl Default for XiConfig {
    fn default() -> Self {
        Self {
            tab_size: 4,
            translate_tabs_to_spaces: true,
            word_wrap: false,
            auto_indent: true,
            font_face: None,
            font_size: None,
            trim_trailing_whitespace: false,
            line_ending: LineEnding::Lf,
        }
    }
}

/// Line ending style
///
/// Represents the different line ending conventions used across platforms.
///
/// # Examples
///
/// ```rust
/// use xi_integration::LineEnding;
///
/// let unix_style = LineEnding::Lf;
/// let windows_style = LineEnding::CrLf;
/// let classic_mac = LineEnding::Cr;
/// ```
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum LineEnding {
    /// Line Feed (Unix/Linux/macOS) - `\n`
    Lf,
    /// Carriage Return + Line Feed (Windows) - `\r\n`
    CrLf,
    /// Carriage Return (Classic Mac) - `\r`
    Cr,
}

/// IPC message types for Symphony-Xi communication
///
/// These types represent the messages exchanged between Symphony's IPC Bus
/// and xi-core's RPC protocol.
///
/// # Examples
///
/// ```rust
/// use xi_integration::{SymphonyIpcRequest, ViewId, EditOperation};
///
/// let request = SymphonyIpcRequest::Edit {
///     view_id: ViewId(1),
///     operation: EditOperation::Insert {
///         position: 0,
///         text: "Hello".to_string(),
///     },
/// };
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SymphonyIpcRequest {
    /// Open a file
    OpenFile {
        /// Path to the file
        path: PathBuf,
    },

    /// Close a view
    CloseView {
        /// View to close
        view_id: ViewId,
    },

    /// Perform an edit operation
    Edit {
        /// View to edit
        view_id: ViewId,
        /// Edit operation to perform
        operation: EditOperation,
    },

    /// Get buffer content
    GetContent {
        /// View to get content from
        view_id: ViewId,
    },

    /// Save buffer to file
    Save {
        /// View to save
        view_id: ViewId,
        /// Optional path (if different from current)
        path: Option<PathBuf>,
    },

    /// Undo last operation
    Undo {
        /// View to undo in
        view_id: ViewId,
    },

    /// Redo last undone operation
    Redo {
        /// View to redo in
        view_id: ViewId,
    },

    /// Search in buffer
    Search {
        /// View to search in
        view_id: ViewId,
        /// Search query
        query: String,
        /// Whether search is case-sensitive
        case_sensitive: bool,
        /// Whether to match whole words only
        whole_word: bool,
        /// Whether query is a regex
        is_regex: bool,
    },
}

/// IPC response types from xi-core to Symphony
///
/// These types represent the responses sent from xi-core back to Symphony
/// after processing requests.
///
/// # Examples
///
/// ```rust
/// use xi_integration::{SymphonyIpcResponse, ViewId};
///
/// let response = SymphonyIpcResponse::ViewOpened {
///     view_id: ViewId(1),
/// };
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SymphonyIpcResponse {
    /// View was successfully opened
    ViewOpened {
        /// The new view ID
        view_id: ViewId,
    },

    /// View was successfully closed
    ViewClosed {
        /// The closed view ID
        view_id: ViewId,
    },

    /// Edit was successfully applied
    EditApplied {
        /// The view that was edited
        view_id: ViewId,
    },

    /// Buffer content
    Content {
        /// The view ID
        view_id: ViewId,
        /// The buffer content
        content: String,
    },

    /// File was successfully saved
    Saved {
        /// The view that was saved
        view_id: ViewId,
        /// The path it was saved to
        path: PathBuf,
    },

    /// Undo was successful
    UndoApplied {
        /// The view that was undone
        view_id: ViewId,
    },

    /// Redo was successful
    RedoApplied {
        /// The view that was redone
        view_id: ViewId,
    },

    /// Search results
    SearchResults {
        /// The view that was searched
        view_id: ViewId,
        /// List of match positions (start, end)
        matches: Vec<(usize, usize)>,
    },

    /// Error occurred
    Error {
        /// Error message
        message: String,
    },
}

/// Update operation types for incremental updates
///
/// These types represent the incremental update operations sent from xi-core
/// to the frontend to efficiently update the display.
///
/// # Examples
///
/// ```rust
/// use xi_integration::SymphonyUpdateOp;
///
/// let keep = SymphonyUpdateOp::Keep(10);
/// let delete = SymphonyUpdateOp::Delete(5);
/// let insert = SymphonyUpdateOp::Insert {
///     lines: vec!["Hello".to_string(), "World".to_string()],
/// };
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SymphonyUpdateOp {
    /// Keep N characters unchanged
    Keep(usize),
    /// Delete N characters
    Delete(usize),
    /// Insert new lines
    Insert {
        /// Lines to insert
        lines: Vec<String>,
    },
    /// Update N characters (for style changes)
    Update(usize),
}

/// Buffer update message
///
/// Represents an incremental update to a buffer, containing a sequence of
/// operations that describe how to transform the previous state to the new state.
///
/// # Examples
///
/// ```rust
/// use xi_integration::{SymphonyIpcMessage, ViewId, SymphonyUpdateOp};
///
/// let update = SymphonyIpcMessage::BufferUpdate {
///     view_id: ViewId(1),
///     operations: vec![
///         SymphonyUpdateOp::Keep(10),
///         SymphonyUpdateOp::Insert {
///             lines: vec!["new line".to_string()],
///         },
///     ],
///     pristine: false,
/// };
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SymphonyIpcMessage {
    /// Incremental buffer update
    BufferUpdate {
        /// View that was updated
        view_id: ViewId,
        /// Sequence of update operations
        operations: Vec<SymphonyUpdateOp>,
        /// Whether the buffer is now pristine (saved)
        pristine: bool,
    },

    /// Style update for syntax highlighting
    StyleUpdate {
        /// View that was updated
        view_id: ViewId,
        /// Style spans (start, end, style_id)
        spans: Vec<(usize, usize, u32)>,
    },
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_view_id_equality() {
        let id1 = ViewId(1);
        let id2 = ViewId(1);
        let id3 = ViewId(2);

        assert_eq!(id1, id2);
        assert_ne!(id1, id3);
    }

    #[test]
    fn test_edit_operation_serialization() {
        let op = EditOperation::Insert {
            position: 0,
            text: "Hello".to_string(),
        };

        let json = serde_json::to_string(&op).unwrap();
        let deserialized: EditOperation = serde_json::from_str(&json).unwrap();

        match deserialized {
            EditOperation::Insert { position, text } => {
                assert_eq!(position, 0);
                assert_eq!(text, "Hello");
            }
            _ => panic!("Wrong variant"),
        }
    }

    #[test]
    fn test_config_default() {
        let config = XiConfig::default();
        assert_eq!(config.tab_size, 4);
        assert!(config.translate_tabs_to_spaces);
        assert!(!config.word_wrap);
        assert!(config.auto_indent);
    }

    #[test]
    fn test_line_ending_types() {
        assert_eq!(LineEnding::Lf, LineEnding::Lf);
        assert_ne!(LineEnding::Lf, LineEnding::CrLf);
        assert_ne!(LineEnding::CrLf, LineEnding::Cr);
    }
}
