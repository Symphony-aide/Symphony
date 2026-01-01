//! Test factories for XI-editor adapter testing
//!
//! Provides factory structs for generating test data following the mandatory
//! factory-based testing pattern. All test data is generated using sy-commons
//! safe_generator to ensure thread-safety and uniqueness.

use sy_commons::testing::safe_generator;
use symphony_core_ports::{BufferId, ViewId, Position, Range, TextChange};
use std::path::PathBuf;
use uuid::Uuid;

/// Factory for generating BufferId test data
pub struct BufferIdTestFactory;

impl BufferIdTestFactory {
    /// Generate a valid BufferId
    pub fn valid() -> BufferId {
        let id = safe_generator().next_unique_id();
        BufferId(Uuid::from_u128(id as u128))
    }
    
    /// Generate multiple unique BufferIds
    pub fn multiple(count: usize) -> Vec<BufferId> {
        (0..count).map(|_| Self::valid()).collect()
    }
}

/// Factory for generating ViewId test data
pub struct ViewIdTestFactory;

impl ViewIdTestFactory {
    /// Generate a valid ViewId
    pub fn valid() -> ViewId {
        let id = safe_generator().next_unique_id();
        ViewId(Uuid::from_u128(id as u128))
    }
    
    /// Generate multiple unique ViewIds
    pub fn multiple(count: usize) -> Vec<ViewId> {
        (0..count).map(|_| Self::valid()).collect()
    }
}

/// Factory for generating Position test data
pub struct PositionTestFactory;

impl PositionTestFactory {
    /// Generate a valid position at origin
    pub fn origin() -> Position {
        Position { line: 0, column: 0 }
    }
    
    /// Generate a valid position with specific coordinates
    pub fn at(line: u32, column: u32) -> Position {
        Position { line, column }
    }
    
    /// Generate a random valid position
    pub fn valid() -> Position {
        let gen = safe_generator();
        Position {
            line: gen.number_in_range(0, 1000) as u32,
            column: gen.number_in_range(0, 100) as u32,
        }
    }
    
    /// Generate an end-of-line position
    pub fn end_of_line(line: u32) -> Position {
        Position { line, column: u32::MAX }
    }
}

/// Factory for generating Range test data
pub struct RangeTestFactory;

impl RangeTestFactory {
    /// Generate a valid range from origin
    pub fn from_origin(end_line: u32, end_column: u32) -> Range {
        Range {
            start: PositionTestFactory::origin(),
            end: Position { line: end_line, column: end_column },
        }
    }
    
    /// Generate a valid single-line range
    pub fn single_line(line: u32, start_col: u32, end_col: u32) -> Range {
        Range {
            start: Position { line, column: start_col },
            end: Position { line, column: end_col },
        }
    }
    
    /// Generate a valid multi-line range
    pub fn multi_line() -> Range {
        let gen = safe_generator();
        let start_line = gen.number_in_range(0, 50) as u32;
        let end_line = start_line + gen.number_in_range(1, 10) as u32;
        
        Range {
            start: Position { line: start_line, column: 0 },
            end: Position { line: end_line, column: gen.number_in_range(0, 50) as u32 },
        }
    }
    
    /// Generate an empty range (start == end)
    pub fn empty() -> Range {
        let pos = PositionTestFactory::valid();
        Range { start: pos, end: pos }
    }
    
    /// Generate an invalid range (end before start)
    pub fn invalid() -> Range {
        Range {
            start: Position { line: 10, column: 20 },
            end: Position { line: 5, column: 10 },
        }
    }
}

/// Factory for generating text content test data
pub struct TextTestFactory;

impl TextTestFactory {
    /// Generate valid single-line text
    pub fn single_line() -> String {
        let id = safe_generator().next_unique_id();
        format!("Test line content {}", id)
    }
    
    /// Generate valid multi-line text
    pub fn multi_line() -> String {
        let id = safe_generator().next_unique_id();
        format!("Line 1 content {}\nLine 2 content {}\nLine 3 content {}", id, id + 1, id + 2)
    }
    
    /// Generate empty text
    pub fn empty() -> String {
        String::new()
    }
    
    /// Generate text with special characters
    pub fn with_special_chars() -> String {
        let id = safe_generator().next_unique_id();
        format!("Special chars: {}!@#$%^&*()_+-=[]{{}}|;':\",./<>?", id)
    }
    
    /// Generate text with unicode characters
    pub fn with_unicode() -> String {
        let id = safe_generator().next_unique_id();
        format!("Unicode test {}: 🚀 ñáéíóú 中文 русский", id)
    }
    
    /// Generate large text content
    pub fn large() -> String {
        let id = safe_generator().next_unique_id();
        let base_line = format!("Large content line {} with substantial text content", id);
        (0..100).map(|i| format!("{} {}", base_line, i)).collect::<Vec<_>>().join("\n")
    }
}

/// Factory for generating file path test data
pub struct FilePathTestFactory;

impl FilePathTestFactory {
    /// Generate a valid temporary file path
    pub fn valid_temp() -> PathBuf {
        let id = safe_generator().next_unique_id();
        PathBuf::from(format!("/tmp/test_file_{}.txt", id))
    }
    
    /// Generate a valid project file path
    pub fn valid_project() -> PathBuf {
        let id = safe_generator().next_unique_id();
        PathBuf::from(format!("src/test_module_{}.rs", id))
    }
    
    /// Generate an invalid file path (non-existent directory)
    pub fn invalid() -> PathBuf {
        let id = safe_generator().next_unique_id();
        PathBuf::from(format!("/non_existent_dir_{}/file.txt", id))
    }
    
    /// Generate a directory path (not a file)
    pub fn directory() -> PathBuf {
        let id = safe_generator().next_unique_id();
        PathBuf::from(format!("/tmp/test_dir_{}", id))
    }
}

/// Factory for generating TextChange test data
pub struct TextChangeTestFactory;

impl TextChangeTestFactory {
    /// Generate a valid text insertion
    pub fn insertion() -> TextChange {
        TextChange {
            range: RangeTestFactory::empty(),
            text: TextTestFactory::single_line(),
            timestamp: chrono::Utc::now(),
        }
    }
    
    /// Generate a valid text deletion
    pub fn deletion() -> TextChange {
        TextChange {
            range: RangeTestFactory::single_line(0, 0, 10),
            text: String::new(),
            timestamp: chrono::Utc::now(),
        }
    }
    
    /// Generate a valid text replacement
    pub fn replacement() -> TextChange {
        TextChange {
            range: RangeTestFactory::single_line(0, 0, 5),
            text: TextTestFactory::single_line(),
            timestamp: chrono::Utc::now(),
        }
    }
    
    /// Generate multiple text changes
    pub fn multiple(count: usize) -> Vec<TextChange> {
        (0..count).map(|i| {
            match i % 3 {
                0 => Self::insertion(),
                1 => Self::deletion(),
                _ => Self::replacement(),
            }
        }).collect()
    }
}

/// Factory for generating JSON-RPC test data
pub struct JsonRpcTestFactory;

impl JsonRpcTestFactory {
    /// Generate a valid JSON-RPC request ID
    pub fn request_id() -> serde_json::Value {
        let id = safe_generator().next_unique_id();
        serde_json::Value::Number(serde_json::Number::from(id))
    }
    
    /// Generate a valid JSON-RPC method name
    pub fn method_name() -> String {
        let id = safe_generator().next_unique_id();
        format!("test_method_{}", id)
    }
    
    /// Generate valid JSON-RPC parameters
    pub fn params() -> serde_json::Value {
        let id = safe_generator().next_unique_id();
        serde_json::json!({
            "test_param": format!("value_{}", id),
            "numeric_param": id
        })
    }
    
    /// Generate a valid JSON-RPC response
    pub fn response() -> serde_json::Value {
        let id = safe_generator().next_unique_id();
        serde_json::json!({
            "jsonrpc": "2.0",
            "result": format!("success_{}", id),
            "id": id
        })
    }
    
    /// Generate an invalid JSON-RPC response (missing fields)
    pub fn invalid_response() -> serde_json::Value {
        let id = safe_generator().next_unique_id();
        serde_json::json!({
            "result": format!("invalid_{}", id)
            // Missing "jsonrpc" and "id" fields
        })
    }
}

/// Factory for generating XI-editor event test data
pub struct XiEventTestFactory;

impl XiEventTestFactory {
    /// Generate a buffer update event
    pub fn buffer_update() -> serde_json::Value {
        let buffer_id = BufferIdTestFactory::valid();
        let id = safe_generator().next_unique_id();
        
        serde_json::json!({
            "method": "update",
            "params": {
                "view_id": buffer_id.0.to_string(),
                "update": {
                    "lines": [
                        {
                            "text": format!("Updated line content {}", id),
                            "cursor": [],
                            "styles": []
                        }
                    ],
                    "pristine": false,
                    "cursor": [0],
                    "selection": []
                },
                "rev": id
            }
        })
    }
    
    /// Generate a scroll event
    pub fn scroll_event() -> serde_json::Value {
        let view_id = ViewIdTestFactory::valid();
        let gen = safe_generator();
        
        serde_json::json!({
            "method": "scroll_to",
            "params": {
                "view_id": view_id.0.to_string(),
                "line": gen.number_in_range(0, 100),
                "col": gen.number_in_range(0, 50)
            }
        })
    }
    
    /// Generate an invalid event (malformed JSON)
    pub fn invalid_event() -> String {
        let id = safe_generator().next_unique_id();
        format!(r#"{{"method": "invalid", "params": {{"incomplete": "data_{}"#, id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_buffer_id_factory() {
        let id1 = BufferIdTestFactory::valid();
        let id2 = BufferIdTestFactory::valid();
        
        // Should be different
        assert_ne!(id1, id2);
        
        // Multiple should generate unique IDs
        let ids = BufferIdTestFactory::multiple(5);
        assert_eq!(ids.len(), 5);
        
        // All should be unique
        for i in 0..ids.len() {
            for j in i+1..ids.len() {
                assert_ne!(ids[i], ids[j]);
            }
        }
    }
    
    #[test]
    fn test_position_factory() {
        let origin = PositionTestFactory::origin();
        assert_eq!(origin.line, 0);
        assert_eq!(origin.column, 0);
        
        let custom = PositionTestFactory::at(10, 20);
        assert_eq!(custom.line, 10);
        assert_eq!(custom.column, 20);
        
        let valid = PositionTestFactory::valid();
        assert!(valid.line < 1000);
        assert!(valid.column < 100);
    }
    
    #[test]
    fn test_range_factory() {
        let empty = RangeTestFactory::empty();
        assert_eq!(empty.start, empty.end);
        
        let single_line = RangeTestFactory::single_line(5, 10, 20);
        assert_eq!(single_line.start.line, 5);
        assert_eq!(single_line.end.line, 5);
        assert_eq!(single_line.start.column, 10);
        assert_eq!(single_line.end.column, 20);
        
        let invalid = RangeTestFactory::invalid();
        assert!(invalid.start.line > invalid.end.line || 
                (invalid.start.line == invalid.end.line && invalid.start.column > invalid.end.column));
    }
    
    #[test]
    fn test_text_factory() {
        let single = TextTestFactory::single_line();
        assert!(!single.is_empty());
        assert!(!single.contains('\n'));
        
        let multi = TextTestFactory::multi_line();
        assert!(multi.contains('\n'));
        
        let empty = TextTestFactory::empty();
        assert!(empty.is_empty());
        
        let large = TextTestFactory::large();
        assert!(large.len() > 1000);
    }
    
    #[test]
    fn test_json_rpc_factory() {
        let id = JsonRpcTestFactory::request_id();
        assert!(id.is_number());
        
        let method = JsonRpcTestFactory::method_name();
        assert!(method.starts_with("test_method_"));
        
        let response = JsonRpcTestFactory::response();
        assert_eq!(response["jsonrpc"], "2.0");
        assert!(response["result"].is_string());
        assert!(response["id"].is_number());
    }
}