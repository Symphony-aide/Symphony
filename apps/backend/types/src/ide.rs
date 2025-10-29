//! IDE-specific types

use crate::core::{EntityId, FilePath};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Editor identifier
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct EditorId(pub EntityId);

impl EditorId {
    /// Create a new editor ID
    pub fn new() -> Self {
        Self(EntityId::new())
    }
}

impl Default for EditorId {
    fn default() -> Self {
        Self::new()
    }
}

/// Text position in a document
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct Position {
    /// Line number (0-indexed)
    pub line: u32,
    /// Column number (0-indexed)
    pub column: u32,
}

impl Position {
    /// Create a new position
    pub fn new(line: u32, column: u32) -> Self {
        Self { line, column }
    }
}

/// Text range in a document
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct Range {
    /// Start position
    pub start: Position,
    /// End position
    pub end: Position,
}

impl Range {
    /// Create a new range
    pub fn new(start: Position, end: Position) -> Self {
        Self { start, end }
    }
}

/// Text edit operation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TextEdit {
    /// Range to replace
    pub range: Range,
    /// New text
    pub new_text: String,
}

/// Document state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Document {
    /// Document ID
    pub id: EntityId,
    /// File path
    pub path: FilePath,
    /// Language ID
    pub language_id: String,
    /// Version number
    pub version: u32,
    /// Content
    pub content: String,
    /// Is dirty (unsaved changes)
    pub is_dirty: bool,
}

/// Cursor/selection
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Selection {
    /// Selection range
    pub range: Range,
    /// Cursor position (anchor)
    pub anchor: Position,
    /// Active position (head)
    pub active: Position,
}

/// Editor state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EditorState {
    /// Editor ID
    pub id: EditorId,
    /// Active document
    pub document: Document,
    /// Selections (multi-cursor support)
    pub selections: Vec<Selection>,
    /// Scroll position
    pub scroll_position: (u32, u32),
}

/// LSP (Language Server Protocol) types
pub mod lsp {
    use super::*;

    /// Diagnostic severity
    #[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
    pub enum DiagnosticSeverity {
        Error = 1,
        Warning = 2,
        Information = 3,
        Hint = 4,
    }

    /// Diagnostic
    #[derive(Debug, Clone, Serialize, Deserialize)]
    pub struct Diagnostic {
        /// Range
        pub range: Range,
        /// Severity
        pub severity: DiagnosticSeverity,
        /// Message
        pub message: String,
        /// Source (e.g., "rustc", "eslint")
        pub source: Option<String>,
        /// Code
        pub code: Option<String>,
    }

    /// Completion item kind
    #[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
    pub enum CompletionItemKind {
        Text = 1,
        Method = 2,
        Function = 3,
        Constructor = 4,
        Field = 5,
        Variable = 6,
        Class = 7,
        Interface = 8,
        Module = 9,
        Property = 10,
        Keyword = 14,
        Snippet = 15,
    }

    /// Completion item
    #[derive(Debug, Clone, Serialize, Deserialize)]
    pub struct CompletionItem {
        /// Label
        pub label: String,
        /// Kind
        pub kind: CompletionItemKind,
        /// Detail
        pub detail: Option<String>,
        /// Documentation
        pub documentation: Option<String>,
        /// Insert text
        pub insert_text: String,
    }
}

/// UI component types for Virtual DOM
pub mod ui {
    use super::*;

    /// Virtual DOM node
    #[derive(Debug, Clone, Serialize, Deserialize)]
    pub enum VirtualNode {
        /// Element node
        Element {
            tag: String,
            props: HashMap<String, serde_json::Value>,
            children: Vec<VirtualNode>,
        },
        /// Text node
        Text(String),
        /// Component node
        Component {
            name: String,
            props: HashMap<String, serde_json::Value>,
        },
    }

    /// UI event
    #[derive(Debug, Clone, Serialize, Deserialize)]
    pub struct UiEvent {
        /// Event type (e.g., "click", "change")
        pub event_type: String,
        /// Target element ID
        pub target: String,
        /// Event data
        pub data: HashMap<String, serde_json::Value>,
    }

    /// Panel position
    #[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
    pub enum PanelPosition {
        Left,
        Right,
        Bottom,
        Top,
    }

    /// Panel configuration
    #[derive(Debug, Clone, Serialize, Deserialize)]
    pub struct Panel {
        /// Panel ID
        pub id: String,
        /// Title
        pub title: String,
        /// Position
        pub position: PanelPosition,
        /// Is visible
        pub visible: bool,
        /// Content (Virtual DOM)
        pub content: VirtualNode,
    }
}

/// File explorer types
pub mod explorer {
    use super::*;

    /// File tree node
    #[derive(Debug, Clone, Serialize, Deserialize)]
    pub struct FileNode {
        /// Path
        pub path: FilePath,
        /// Name
        pub name: String,
        /// Is directory
        pub is_directory: bool,
        /// Is expanded (for directories)
        pub is_expanded: bool,
        /// Children (for directories)
        pub children: Vec<FileNode>,
    }
}
