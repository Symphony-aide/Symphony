//! Unit tests for XI protocol types
//!
//! Tests TextDelta, ViewUpdate, XiEvent, XiOperation and related types.

#[path = "../factory.rs"]
mod factory;

use serde_json::json;
use sy_commons::debug::duck;
use sy_ipc_protocol::{
	TextDelta, ViewUpdate, XiEvent, XiOperation,
};

// Import factory for generating test data
use factory::{StringTestFactory, UUIDTestFactory};

#[cfg(feature = "xi_protocol")]
mod xi_protocol_tests {
	use super::*;

	#[test]
	fn test_text_delta_creation() {
		duck!("Testing TextDelta creation");

		let delta = TextDelta::new();
		assert_eq!(delta.ops.len(), 0);
		assert_eq!(delta.base_len, 0);
		assert_eq!(delta.target_len, 0);
	}

	#[test]
	fn test_text_delta_default() {
		duck!("Testing TextDelta default");

		let delta = TextDelta::default();
		assert_eq!(delta.ops.len(), 0);
		assert_eq!(delta.base_len, 0);
		assert_eq!(delta.target_len, 0);
	}

	#[test]
	fn test_text_delta_with_ops() {
		duck!("Testing TextDelta with operations");

		use sy_ipc_protocol::xi_protocol::DeltaOp;

		let ops = vec![
			DeltaOp::Retain { n: 5 },
			DeltaOp::Insert { s: "hello".to_string() },
			DeltaOp::Delete { n: 3 },
		];

		let delta = TextDelta::with_ops(ops.clone(), 10, 12);
		assert_eq!(delta.ops.len(), 3);
		assert_eq!(delta.base_len, 10);
		assert_eq!(delta.target_len, 12);
	}

	#[test]
	fn test_xi_operation_method_names() {
		duck!("Testing XiOperation method names");

		let new_view = XiOperation::NewView { file_path: None };
		assert_eq!(new_view.method_name(), "new_view");

		let close_view = XiOperation::CloseView { 
			view_id: StringTestFactory::payload() 
		};
		assert_eq!(close_view.method_name(), "close_view");

		let save = XiOperation::Save { 
			view_id: StringTestFactory::payload(),
			file_path: None 
		};
		assert_eq!(save.method_name(), "save");

		let insert = XiOperation::Insert { 
			view_id: StringTestFactory::payload(),
			chars: "test".to_string() 
		};
		assert_eq!(insert.method_name(), "insert");
	}

	#[test]
	fn test_xi_event_method_names() {
		duck!("Testing XiEvent method names");

		let view_update = ViewUpdate {
			lines: vec![],
			pristine: true,
			cursor: vec![],
			selection: vec![],
		};

		let update = XiEvent::Update {
			view_id: StringTestFactory::payload(),
			update: view_update,
			rev: 1,
		};
		assert_eq!(update.method_name(), "update");

		let scroll_to = XiEvent::ScrollTo {
			view_id: StringTestFactory::payload(),
			line: 10,
			col: 5,
		};
		assert_eq!(scroll_to.method_name(), "scroll_to");

		let config_changed = XiEvent::ConfigChanged {
			view_id: StringTestFactory::payload(),
			changes: json!({"theme": "dark"}),
		};
		assert_eq!(config_changed.method_name(), "config_changed");
	}

	#[test]
	fn test_view_update_creation() {
		duck!("Testing ViewUpdate creation");

		use sy_ipc_protocol::xi_protocol::{Line, Selection, StyleSpan};

		let line = Line {
			text: "hello world".to_string(),
			cursor: vec![5],
			styles: vec![StyleSpan {
				offset: 0,
				len: 5,
				style_id: 1,
			}],
		};

		let selection = Selection {
			start: 0,
			end: 5,
			cursor: 5,
		};

		let view_update = ViewUpdate {
			lines: vec![line],
			pristine: false,
			cursor: vec![5],
			selection: vec![selection],
		};

		assert_eq!(view_update.lines.len(), 1);
		assert!(!view_update.pristine);
		assert_eq!(view_update.cursor, vec![5]);
		assert_eq!(view_update.selection.len(), 1);
	}

	#[test]
	fn test_xi_operation_serialization() {
		duck!("Testing XiOperation serialization");

		let op = XiOperation::NewView { 
			file_path: Some("/path/to/file.txt".to_string()) 
		};

		let serialized = serde_json::to_string(&op).expect("Failed to serialize");
		let deserialized: XiOperation = serde_json::from_str(&serialized).expect("Failed to deserialize");

		match deserialized {
			XiOperation::NewView { file_path } => {
				assert_eq!(file_path, Some("/path/to/file.txt".to_string()));
			},
			_ => panic!("Expected NewView operation"),
		}
	}

	#[test]
	fn test_xi_event_serialization() {
		duck!("Testing XiEvent serialization");

		let event = XiEvent::ScrollTo {
			view_id: UUIDTestFactory::valid(),
			line: 42,
			col: 10,
		};

		let serialized = serde_json::to_string(&event).expect("Failed to serialize");
		let deserialized: XiEvent = serde_json::from_str(&serialized).expect("Failed to deserialize");

		match deserialized {
			XiEvent::ScrollTo { view_id: _, line, col } => {
				assert_eq!(line, 42);
				assert_eq!(col, 10);
			},
			_ => panic!("Expected ScrollTo event"),
		}
	}

	#[test]
	fn test_text_delta_serialization() {
		duck!("Testing TextDelta serialization");

		use sy_ipc_protocol::xi_protocol::DeltaOp;

		let ops = vec![
			DeltaOp::Retain { n: 10 },
			DeltaOp::Insert { s: "inserted text".to_string() },
			DeltaOp::Delete { n: 5 },
		];

		let delta = TextDelta::with_ops(ops, 20, 28);

		let serialized = serde_json::to_string(&delta).expect("Failed to serialize");
		let deserialized: TextDelta = serde_json::from_str(&serialized).expect("Failed to deserialize");

		assert_eq!(deserialized.ops.len(), 3);
		assert_eq!(deserialized.base_len, 20);
		assert_eq!(deserialized.target_len, 28);
	}

	#[test]
	fn test_view_update_serialization() {
		duck!("Testing ViewUpdate serialization");

		use sy_ipc_protocol::xi_protocol::{Line, Selection, StyleSpan};

		let view_update = ViewUpdate {
			lines: vec![Line {
				text: "test line".to_string(),
				cursor: vec![4],
				styles: vec![StyleSpan {
					offset: 0,
					len: 4,
					style_id: 2,
				}],
			}],
			pristine: true,
			cursor: vec![4],
			selection: vec![Selection {
				start: 0,
				end: 4,
				cursor: 4,
			}],
		};

		let serialized = serde_json::to_string(&view_update).expect("Failed to serialize");
		let deserialized: ViewUpdate = serde_json::from_str(&serialized).expect("Failed to deserialize");

		assert_eq!(deserialized.lines.len(), 1);
		assert_eq!(deserialized.lines[0].text, "test line");
		assert!(deserialized.pristine);
		assert_eq!(deserialized.cursor, vec![4]);
		assert_eq!(deserialized.selection.len(), 1);
	}
}