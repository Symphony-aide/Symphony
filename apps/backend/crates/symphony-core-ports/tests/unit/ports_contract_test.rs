//! Port trait contract tests
//!
//! These tests verify that all port trait methods have correct signatures and contracts.
//! Following TDD principles, these tests are written FIRST and should FAIL initially.

// Alignment: Uncommented imports as ports and mocks are now implemented
use rstest::*;
use std::path::PathBuf;
use symphony_core_ports::mocks::*;
use symphony_core_ports::ports::*;
use symphony_core_ports::types::*;
use uuid::Uuid;

// Alignment: Import factory for proper test data generation
use crate::factory::*;

#[cfg(feature = "unit")]
mod text_editing_port_tests {
	use super::*;

	#[fixture]
	fn mock_text_editing() -> MockTextEditingAdapter {
		MockTextEditingAdapter::new()
	}

	#[rstest]
	#[tokio::test]
	async fn test_create_buffer_returns_valid_id(mock_text_editing: MockTextEditingAdapter) {
		// RED PHASE: This test should FAIL because MockTextEditingAdapter doesn't exist yet
		let result = mock_text_editing.create_buffer(None).await;
		assert!(result.is_ok());
		let buffer_id = result.unwrap();
		assert_ne!(buffer_id.0, Uuid::nil());
	}

	#[rstest]
	#[tokio::test]
	async fn test_create_buffer_with_file_path(mock_text_editing: MockTextEditingAdapter) {
		let file_path = PathBuf::from("test.txt");
		let result = mock_text_editing.create_buffer(Some(file_path)).await;
		assert!(result.is_ok());
	}

	#[rstest]
	#[tokio::test]
	async fn test_get_buffer_content_success(mock_text_editing: MockTextEditingAdapter) {
		let buffer_id = mock_text_editing.create_buffer(None).await.unwrap();
		let result = mock_text_editing.get_buffer_content(buffer_id).await;
		assert!(result.is_ok());
	}

	#[rstest]
	#[tokio::test]
	async fn test_get_nonexistent_buffer_returns_error(mock_text_editing: MockTextEditingAdapter) {
		let fake_id = BufferId(Uuid::new_v4());
		let result = mock_text_editing.get_buffer_content(fake_id).await;
		assert!(result.is_err());
	}

	#[rstest]
	#[tokio::test]
	async fn test_insert_text_success(mock_text_editing: MockTextEditingAdapter) {
		let buffer_id = mock_text_editing.create_buffer(None).await.unwrap();
		let position = Position { line: 0, column: 0 };
		let result = mock_text_editing.insert_text(buffer_id, position, "Hello").await;
		assert!(result.is_ok());
	}

	#[rstest]
	#[tokio::test]
	async fn test_delete_text_success(mock_text_editing: MockTextEditingAdapter) {
		let buffer_id = mock_text_editing.create_buffer(None).await.unwrap();
		let range = Range {
			start: Position { line: 0, column: 0 },
			end: Position { line: 0, column: 5 },
		};
		let result = mock_text_editing.delete_text(buffer_id, range).await;
		assert!(result.is_ok());
	}

	#[rstest]
	#[tokio::test]
	async fn test_save_buffer_success(mock_text_editing: MockTextEditingAdapter) {
		let buffer_id = mock_text_editing.create_buffer(None).await.unwrap();
		let result = mock_text_editing.save_buffer(buffer_id).await;
		assert!(result.is_ok());
	}

	#[rstest]
	#[tokio::test]
	async fn test_create_view_success(mock_text_editing: MockTextEditingAdapter) {
		let buffer_id = mock_text_editing.create_buffer(None).await.unwrap();
		let result = mock_text_editing.create_view(buffer_id).await;
		assert!(result.is_ok());
		let view_id = result.unwrap();
		assert_ne!(view_id.0, Uuid::nil());
	}
}

#[cfg(feature = "unit")]
mod pit_port_tests {
	use super::*;

	#[fixture]
	fn mock_pit() -> MockPitAdapter {
		MockPitAdapter::new()
	}

	#[rstest]
	#[tokio::test]
	async fn test_allocate_model_returns_handle(mock_pit: MockPitAdapter) {
		let spec = ModelSpecTestFactory::valid();

		let result = mock_pit.allocate_model(spec).await;
		assert!(result.is_ok());
	}

	#[rstest]
	#[tokio::test]
	async fn test_create_workflow_success(mock_pit: MockPitAdapter) {
		let definition = WorkflowDefinitionTestFactory::valid();

		let result = mock_pit.create_workflow(definition).await;
		assert!(result.is_ok());
	}

	#[rstest]
	#[tokio::test]
	async fn test_store_artifact_returns_id(mock_pit: MockPitAdapter) {
		let data = ArtifactDataTestFactory::valid();

		let result = mock_pit.store_artifact(data).await;
		assert!(result.is_ok());
	}
}

#[cfg(feature = "unit")]
mod extension_port_tests {
	use super::*;

	#[fixture]
	fn mock_extensions() -> MockExtensionAdapter {
		MockExtensionAdapter::new()
	}

	#[rstest]
	#[tokio::test]
	async fn test_load_extension_success(mock_extensions: MockExtensionAdapter) {
		let manifest = ExtensionManifestTestFactory::valid();

		let result = mock_extensions.load_extension(manifest).await;
		assert!(result.is_ok());
	}

	#[rstest]
	#[tokio::test]
	async fn test_list_extensions_returns_vec(mock_extensions: MockExtensionAdapter) {
		let result = mock_extensions.list_extensions().await;
		assert!(result.is_ok());
	}
}

#[cfg(feature = "unit")]
mod conductor_port_tests {
	use super::*;

	#[fixture]
	fn mock_conductor() -> MockConductorAdapter {
		MockConductorAdapter::new()
	}

	#[rstest]
	#[tokio::test]
	async fn test_start_conductor_success(mock_conductor: MockConductorAdapter) {
		let result = mock_conductor.start_conductor().await;
		assert!(result.is_ok());
	}

	#[rstest]
	#[tokio::test]
	async fn test_get_conductor_status(mock_conductor: MockConductorAdapter) {
		let result = mock_conductor.get_conductor_status().await;
		assert!(result.is_ok());
	}
}

#[cfg(feature = "unit")]
mod data_access_port_tests {
	use super::*;

	#[fixture]
	fn mock_data_access() -> MockDataAccessAdapter {
		MockDataAccessAdapter::new()
	}

	#[rstest]
	#[tokio::test]
	async fn test_pre_validate_workflow_success(mock_data_access: MockDataAccessAdapter) {
		let workflow = WorkflowSpecTestFactory::valid();

		let result = mock_data_access.pre_validate_workflow(&workflow).await;
		assert!(result.is_ok());
	}

	#[rstest]
	#[tokio::test]
	async fn test_create_workflow_returns_id(mock_data_access: MockDataAccessAdapter) {
		let workflow = WorkflowSpecTestFactory::valid();

		let result = mock_data_access.create_workflow(workflow).await;
		assert!(result.is_ok());
	}
}
