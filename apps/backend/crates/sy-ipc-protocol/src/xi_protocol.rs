//! XI-editor specific protocol messages
//!
//! Defines message types for Symphony ↔ XI-editor communication
//! including operations, events, and data structures.

use serde::{Deserialize, Serialize};
use serde_json::Value;
use sy_commons::debug::duck;

/// XI-editor operations that Symphony can request
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "method", content = "params")]
pub enum XiOperation {
	/// Create a new view (file buffer)
	#[serde(rename = "new_view")]
	NewView {
		/// Optional file path to open
		file_path: Option<String>,
	},

	/// Close an existing view
	#[serde(rename = "close_view")]
	CloseView {
		/// View identifier
		view_id: String,
	},

	/// Save a view to file
	#[serde(rename = "save")]
	Save {
		/// View identifier
		view_id: String,
		/// Optional file path (uses current path if None)
		file_path: Option<String>,
	},

	/// Edit text in a view
	#[serde(rename = "edit")]
	Edit {
		/// View identifier
		view_id: String,
		/// Text delta describing the change
		delta: TextDelta,
	},

	/// Insert text at cursor
	#[serde(rename = "insert")]
	Insert {
		/// View identifier
		view_id: String,
		/// Text to insert
		chars: String,
	},

	/// Delete character forward
	#[serde(rename = "delete_forward")]
	DeleteForward {
		/// View identifier
		view_id: String,
	},

	/// Delete character backward
	#[serde(rename = "delete_backward")]
	DeleteBackward {
		/// View identifier
		view_id: String,
	},

	/// Move cursor up
	#[serde(rename = "move_up")]
	MoveUp {
		/// View identifier
		view_id: String,
	},

	/// Move cursor down
	#[serde(rename = "move_down")]
	MoveDown {
		/// View identifier
		view_id: String,
	},

	/// Move cursor left
	#[serde(rename = "move_left")]
	MoveLeft {
		/// View identifier
		view_id: String,
	},

	/// Move cursor right
	#[serde(rename = "move_right")]
	MoveRight {
		/// View identifier
		view_id: String,
	},

	/// Click at specific position
	#[serde(rename = "click")]
	Click {
		/// View identifier
		view_id: String,
		/// Line number
		line: u64,
		/// Column number
		col: u64,
	},

	/// Select all text
	#[serde(rename = "select_all")]
	SelectAll {
		/// View identifier
		view_id: String,
	},

	/// Get selection for find operation
	#[serde(rename = "selection_for_find")]
	SelectionForFind {
		/// View identifier
		view_id: String,
		/// Case sensitive search
		case_sensitive: bool,
	},
}

/// Events that XI-editor sends to Symphony
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "method", content = "params")]
pub enum XiEvent {
	/// View update with new content
	#[serde(rename = "update")]
	Update {
		/// View identifier
		view_id: String,
		/// View update data
		update: ViewUpdate,
		/// Revision number
		rev: u64,
	},

	/// Scroll to specific position
	#[serde(rename = "scroll_to")]
	ScrollTo {
		/// View identifier
		view_id: String,
		/// Line number
		line: u64,
		/// Column number
		col: u64,
	},

	/// Configuration changed
	#[serde(rename = "config_changed")]
	ConfigChanged {
		/// View identifier
		view_id: String,
		/// Configuration changes
		changes: Value,
	},

	/// Theme changed
	#[serde(rename = "theme_changed")]
	ThemeChanged {
		/// Theme name
		name: String,
		/// Theme data
		theme: Value,
	},

	/// Available plugins list
	#[serde(rename = "available_plugins")]
	AvailablePlugins {
		/// View identifier
		view_id: String,
		/// Plugin descriptions
		plugins: Vec<PluginDescription>,
	},

	/// Plugin started
	#[serde(rename = "plugin_started")]
	PluginStarted {
		/// View identifier
		view_id: String,
		/// Plugin name
		plugin: String,
	},

	/// Plugin stopped
	#[serde(rename = "plugin_stopped")]
	PluginStopped {
		/// View identifier
		view_id: String,
		/// Plugin name
		plugin: String,
		/// Exit code
		code: i32,
	},
}

/// Text delta describing changes to a document
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TextDelta {
	/// Delta operations
	pub ops: Vec<DeltaOp>,
	/// Base document length
	pub base_len: usize,
	/// Target document length after applying delta
	pub target_len: usize,
}

/// Delta operation for text changes
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "op")]
pub enum DeltaOp {
	/// Retain n characters
	#[serde(rename = "retain")]
	Retain {
		/// Number of characters to retain
		n: usize,
	},

	/// Insert string
	#[serde(rename = "insert")]
	Insert {
		/// String to insert
		s: String,
	},

	/// Delete n characters
	#[serde(rename = "delete")]
	Delete {
		/// Number of characters to delete
		n: usize,
	},
}

/// View update data from XI-editor
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ViewUpdate {
	/// Lines in the view
	pub lines: Vec<Line>,
	/// Whether the document is pristine (unmodified)
	pub pristine: bool,
	/// Cursor positions
	pub cursor: Vec<u64>,
	/// Selection ranges
	pub selection: Vec<Selection>,
}

/// A line in the view
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Line {
	/// Line text content
	pub text: String,
	/// Cursor positions on this line
	pub cursor: Vec<u64>,
	/// Style spans for syntax highlighting
	pub styles: Vec<StyleSpan>,
}

/// Text selection range
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Selection {
	/// Selection start position
	pub start: u64,
	/// Selection end position
	pub end: u64,
	/// Cursor position within selection
	pub cursor: u64,
}

/// Style span for syntax highlighting
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StyleSpan {
	/// Offset from line start
	pub offset: u64,
	/// Length of styled text
	pub len: u64,
	/// Style identifier
	pub style_id: u32,
}

/// Plugin description
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginDescription {
	/// Plugin name
	pub name: String,
	/// Whether plugin is currently running
	pub running: bool,
}

impl XiOperation {
	/// Returns the method name for this operation
	///
	/// # Examples
	///
	/// ```
	/// use sy_ipc_protocol::XiOperation;
	///
	/// let op = XiOperation::NewView { file_path: None };
	/// assert_eq!(op.method_name(), "new_view");
	/// ```
	pub fn method_name(&self) -> &'static str {
		match self {
			XiOperation::NewView { .. } => "new_view",
			XiOperation::CloseView { .. } => "close_view",
			XiOperation::Save { .. } => "save",
			XiOperation::Edit { .. } => "edit",
			XiOperation::Insert { .. } => "insert",
			XiOperation::DeleteForward { .. } => "delete_forward",
			XiOperation::DeleteBackward { .. } => "delete_backward",
			XiOperation::MoveUp { .. } => "move_up",
			XiOperation::MoveDown { .. } => "move_down",
			XiOperation::MoveLeft { .. } => "move_left",
			XiOperation::MoveRight { .. } => "move_right",
			XiOperation::Click { .. } => "click",
			XiOperation::SelectAll { .. } => "select_all",
			XiOperation::SelectionForFind { .. } => "selection_for_find",
		}
	}
}

impl XiEvent {
	/// Returns the method name for this event
	///
	/// # Examples
	///
	/// ```
	/// use sy_ipc_protocol::{XiEvent, ViewUpdate};
	///
	/// let event = XiEvent::Update {
	///     view_id: "test".to_string(),
	///     update: ViewUpdate {
	///         lines: vec![],
	///         pristine: true,
	///         cursor: vec![],
	///         selection: vec![],
	///     },
	///     rev: 1,
	/// };
	/// assert_eq!(event.method_name(), "update");
	/// ```
	pub fn method_name(&self) -> &'static str {
		match self {
			XiEvent::Update { .. } => "update",
			XiEvent::ScrollTo { .. } => "scroll_to",
			XiEvent::ConfigChanged { .. } => "config_changed",
			XiEvent::ThemeChanged { .. } => "theme_changed",
			XiEvent::AvailablePlugins { .. } => "available_plugins",
			XiEvent::PluginStarted { .. } => "plugin_started",
			XiEvent::PluginStopped { .. } => "plugin_stopped",
		}
	}
}

impl TextDelta {
	/// Creates a new empty text delta
	///
	/// # Examples
	///
	/// ```
	/// use sy_ipc_protocol::TextDelta;
	///
	/// let delta = TextDelta::new();
	/// assert_eq!(delta.ops.len(), 0);
	/// assert_eq!(delta.base_len, 0);
	/// assert_eq!(delta.target_len, 0);
	/// ```
	pub fn new() -> Self {
		duck!("Creating new empty text delta");
		Self {
			ops: Vec::new(),
			base_len: 0,
			target_len: 0,
		}
	}

	/// Creates a text delta with operations
	///
	/// # Arguments
	///
	/// * `ops` - Delta operations
	/// * `base_len` - Base document length
	/// * `target_len` - Target document length
	pub fn with_ops(ops: Vec<DeltaOp>, base_len: usize, target_len: usize) -> Self {
		duck!("Creating text delta with {} operations", ops.len());
		Self {
			ops,
			base_len,
			target_len,
		}
	}
}

impl Default for TextDelta {
	fn default() -> Self {
		Self::new()
	}
}
