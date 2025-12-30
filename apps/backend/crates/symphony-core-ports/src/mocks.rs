//! Mock implementations for all port traits
//!
//! This module provides deterministic mock implementations of all port traits
//! for isolated testing without external dependencies.

use async_trait::async_trait;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tokio::sync::broadcast;
use uuid::Uuid;

use crate::ports::*;
use crate::types::*;
use crate::Result;
use sy_commons::duck;

/// Mock implementation of TextEditingPort for testing
#[derive(Debug, Clone)]
pub struct MockTextEditingAdapter {
	buffers: Arc<Mutex<HashMap<BufferId, String>>>,
	views: Arc<Mutex<HashMap<ViewId, BufferId>>>,
	event_sender: Arc<Mutex<Option<broadcast::Sender<TextEditingEvent>>>>,
	error_mode: Arc<Mutex<Option<String>>>,
}

impl MockTextEditingAdapter {
	/// Creates a new mock text editing adapter
	pub fn new() -> Self {
		duck!("Creating new MockTextEditingAdapter");
		Self {
			buffers: Arc::new(Mutex::new(HashMap::new())),
			views: Arc::new(Mutex::new(HashMap::new())),
			event_sender: Arc::new(Mutex::new(None)),
			error_mode: Arc::new(Mutex::new(None)),
		}
	}

	/// Sets buffer content for testing
	pub fn set_buffer_content(&self, buffer_id: BufferId, content: String) {
		duck!("Setting buffer content for {:?}: {}", buffer_id, content);
		self.buffers.lock().unwrap().insert(buffer_id, content);
	}

	/// Simulates an error condition for testing
	pub fn simulate_error(&self, error_type: &str) {
		duck!("Simulating error: {}", error_type);
		*self.error_mode.lock().unwrap() = Some(error_type.to_string());
	}

	/// Clears error simulation
	pub fn clear_error(&self) {
		*self.error_mode.lock().unwrap() = None;
	}
}

impl Default for MockTextEditingAdapter {
	fn default() -> Self {
		Self::new()
	}
}

#[async_trait]
impl TextEditingPort for MockTextEditingAdapter {
	async fn create_buffer(&self, file_path: Option<PathBuf>) -> Result<BufferId> {
		duck!("MockTextEditingAdapter::create_buffer called with path: {:?}", file_path);

		if let Some(error) = self.error_mode.lock().unwrap().as_ref() {
			if error == "buffer_creation_failed" {
				return Err(crate::errors::PortError::TextEditingFailed {
					message: "Buffer creation failed".to_string(),
				}
				.into());
			}
		}

		let buffer_id = BufferId(Uuid::new_v4());
		self.buffers.lock().unwrap().insert(buffer_id, String::new());

		// Send event if sender exists
		if let Some(sender) = self.event_sender.lock().unwrap().as_ref() {
			let _ = sender.send(TextEditingEvent::BufferCreated {
				buffer_id,
				file_path,
			});
		}

		Ok(buffer_id)
	}

	async fn close_buffer(&self, buffer_id: BufferId) -> Result<()> {
		duck!("MockTextEditingAdapter::close_buffer called for {:?}", buffer_id);

		if self.buffers.lock().unwrap().remove(&buffer_id).is_none() {
			return Err(crate::errors::PortError::TextEditingFailed {
				message: "Buffer not found".to_string(),
			}
			.into());
		}

		Ok(())
	}

	async fn get_buffer_content(&self, buffer_id: BufferId) -> Result<String> {
		duck!("MockTextEditingAdapter::get_buffer_content called for {:?}", buffer_id);

		if let Some(error) = self.error_mode.lock().unwrap().as_ref() {
			if error == "buffer_not_found" {
				return Err(crate::errors::PortError::TextEditingFailed {
					message: "Buffer not found".to_string(),
				}
				.into());
			}
		}

		self.buffers.lock().unwrap().get(&buffer_id).cloned().ok_or_else(|| {
			crate::errors::PortError::TextEditingFailed {
				message: "Buffer not found".to_string(),
			}
			.into()
		})
	}

	async fn insert_text(&self, buffer_id: BufferId, position: Position, text: &str) -> Result<()> {
		duck!(
			"MockTextEditingAdapter::insert_text called for {:?} at {:?}: {}",
			buffer_id,
			position,
			text
		);

		let mut buffers = self.buffers.lock().unwrap();
		if let Some(content) = buffers.get_mut(&buffer_id) {
			// Simple insertion at the beginning for mock
			content.insert_str(0, text);

			// Send event if sender exists
			if let Some(sender) = self.event_sender.lock().unwrap().as_ref() {
				let _ = sender.send(TextEditingEvent::BufferModified {
					buffer_id,
					changes: vec![TextChange {
						range: Range {
							start: position,
							end: position,
						},
						text: text.to_string(),
						timestamp: chrono::Utc::now(),
					}],
				});
			}

			Ok(())
		} else {
			Err(crate::errors::PortError::TextEditingFailed {
				message: "Buffer not found".to_string(),
			}
			.into())
		}
	}

	async fn delete_text(&self, buffer_id: BufferId, range: Range) -> Result<()> {
		duck!(
			"MockTextEditingAdapter::delete_text called for {:?} range {:?}",
			buffer_id,
			range
		);

		let mut buffers = self.buffers.lock().unwrap();
		if buffers.contains_key(&buffer_id) {
			// Simple mock implementation - just clear the buffer
			buffers.insert(buffer_id, String::new());
			Ok(())
		} else {
			Err(crate::errors::PortError::TextEditingFailed {
				message: "Buffer not found".to_string(),
			}
			.into())
		}
	}

	async fn replace_text(&self, buffer_id: BufferId, range: Range, text: &str) -> Result<()> {
		duck!(
			"MockTextEditingAdapter::replace_text called for {:?} range {:?}: {}",
			buffer_id,
			range,
			text
		);

		let mut buffers = self.buffers.lock().unwrap();
		if let Some(content) = buffers.get_mut(&buffer_id) {
			*content = text.to_string();
			Ok(())
		} else {
			Err(crate::errors::PortError::TextEditingFailed {
				message: "Buffer not found".to_string(),
			}
			.into())
		}
	}

	async fn save_buffer(&self, buffer_id: BufferId) -> Result<()> {
		duck!("MockTextEditingAdapter::save_buffer called for {:?}", buffer_id);

		if !self.buffers.lock().unwrap().contains_key(&buffer_id) {
			return Err(crate::errors::PortError::TextEditingFailed {
				message: "Buffer not found".to_string(),
			}
			.into());
		}

		Ok(())
	}

	async fn save_buffer_as(&self, buffer_id: BufferId, path: PathBuf) -> Result<()> {
		duck!(
			"MockTextEditingAdapter::save_buffer_as called for {:?} to {:?}",
			buffer_id,
			path
		);

		if !self.buffers.lock().unwrap().contains_key(&buffer_id) {
			return Err(crate::errors::PortError::TextEditingFailed {
				message: "Buffer not found".to_string(),
			}
			.into());
		}

		Ok(())
	}

	async fn reload_buffer(&self, buffer_id: BufferId) -> Result<()> {
		duck!("MockTextEditingAdapter::reload_buffer called for {:?}", buffer_id);

		if !self.buffers.lock().unwrap().contains_key(&buffer_id) {
			return Err(crate::errors::PortError::TextEditingFailed {
				message: "Buffer not found".to_string(),
			}
			.into());
		}

		Ok(())
	}

	async fn create_view(&self, buffer_id: BufferId) -> Result<ViewId> {
		duck!("MockTextEditingAdapter::create_view called for buffer {:?}", buffer_id);

		if !self.buffers.lock().unwrap().contains_key(&buffer_id) {
			return Err(crate::errors::PortError::TextEditingFailed {
				message: "Buffer not found".to_string(),
			}
			.into());
		}

		let view_id = ViewId(Uuid::new_v4());
		self.views.lock().unwrap().insert(view_id, buffer_id);

		// Send event if sender exists
		if let Some(sender) = self.event_sender.lock().unwrap().as_ref() {
			let _ = sender.send(TextEditingEvent::ViewCreated { view_id, buffer_id });
		}

		Ok(view_id)
	}

	async fn close_view(&self, view_id: ViewId) -> Result<()> {
		duck!("MockTextEditingAdapter::close_view called for {:?}", view_id);

		if self.views.lock().unwrap().remove(&view_id).is_none() {
			return Err(crate::errors::PortError::TextEditingFailed {
				message: "View not found".to_string(),
			}
			.into());
		}

		Ok(())
	}

	async fn set_cursor(&self, view_id: ViewId, position: Position) -> Result<()> {
		duck!("MockTextEditingAdapter::set_cursor called for {:?} to {:?}", view_id, position);

		if !self.views.lock().unwrap().contains_key(&view_id) {
			return Err(crate::errors::PortError::TextEditingFailed {
				message: "View not found".to_string(),
			}
			.into());
		}

		// Send event if sender exists
		if let Some(sender) = self.event_sender.lock().unwrap().as_ref() {
			let _ = sender.send(TextEditingEvent::CursorMoved { view_id, position });
		}

		Ok(())
	}

	async fn set_selection(&self, view_id: ViewId, range: Range) -> Result<()> {
		duck!("MockTextEditingAdapter::set_selection called for {:?} to {:?}", view_id, range);

		if !self.views.lock().unwrap().contains_key(&view_id) {
			return Err(crate::errors::PortError::TextEditingFailed {
				message: "View not found".to_string(),
			}
			.into());
		}

		// Send event if sender exists
		if let Some(sender) = self.event_sender.lock().unwrap().as_ref() {
			let _ = sender.send(TextEditingEvent::SelectionChanged { view_id, range });
		}

		Ok(())
	}

	async fn subscribe_to_events(&self) -> Result<EventStream<TextEditingEvent>> {
		duck!("MockTextEditingAdapter::subscribe_to_events called");

		let (sender, receiver) = broadcast::channel(100);
		*self.event_sender.lock().unwrap() = Some(sender);
		Ok(receiver)
	}
}
/// Mock implementation of PitPort for testing
#[derive(Debug, Clone)]
pub struct MockPitAdapter {
	models: Arc<Mutex<HashMap<ModelHandle, (ModelSpec, ModelStatus)>>>,
	workflows: Arc<Mutex<HashMap<WorkflowId, (WorkflowDefinition, WorkflowStatus)>>>,
	artifacts: Arc<Mutex<HashMap<ArtifactId, ArtifactData>>>,
	policies: Arc<Mutex<HashMap<PolicyId, Policy>>>,
	error_mode: Arc<Mutex<Option<String>>>,
}

impl MockPitAdapter {
	/// Creates a new mock pit adapter
	pub fn new() -> Self {
		duck!("Creating new MockPitAdapter");
		Self {
			models: Arc::new(Mutex::new(HashMap::new())),
			workflows: Arc::new(Mutex::new(HashMap::new())),
			artifacts: Arc::new(Mutex::new(HashMap::new())),
			policies: Arc::new(Mutex::new(HashMap::new())),
			error_mode: Arc::new(Mutex::new(None)),
		}
	}

	/// Simulates an error condition for testing
	pub fn simulate_error(&self, error_type: &str) {
		duck!("MockPitAdapter simulating error: {}", error_type);
		*self.error_mode.lock().unwrap() = Some(error_type.to_string());
	}

	/// Clears error simulation
	pub fn clear_error(&self) {
		*self.error_mode.lock().unwrap() = None;
	}
}

impl Default for MockPitAdapter {
	fn default() -> Self {
		Self::new()
	}
}

#[async_trait]
impl PitPort for MockPitAdapter {
	async fn allocate_model(&self, spec: ModelSpec) -> Result<ModelHandle> {
		duck!("MockPitAdapter::allocate_model called for {}", spec.name);

		if let Some(error) = self.error_mode.lock().unwrap().as_ref() {
			if error == "insufficient_memory" {
				return Err(crate::errors::PortError::PitOperationFailed {
					operation: "allocate_model".to_string(),
					message: "Insufficient memory".to_string(),
				}
				.into());
			}
		}

		let handle = ModelHandle(Uuid::new_v4());
		self.models.lock().unwrap().insert(handle, (spec, ModelStatus::Ready));
		Ok(handle)
	}

	async fn deallocate_model(&self, handle: ModelHandle) -> Result<()> {
		duck!("MockPitAdapter::deallocate_model called for {:?}", handle);

		if self.models.lock().unwrap().remove(&handle).is_none() {
			return Err(crate::errors::PortError::PitOperationFailed {
				operation: "deallocate_model".to_string(),
				message: "Model handle not found".to_string(),
			}
			.into());
		}

		Ok(())
	}

	async fn get_model_status(&self, handle: ModelHandle) -> Result<ModelStatus> {
		duck!("MockPitAdapter::get_model_status called for {:?}", handle);

		self.models
			.lock()
			.unwrap()
			.get(&handle)
			.map(|(_, status)| *status)
			.ok_or_else(|| {
				crate::errors::PortError::PitOperationFailed {
					operation: "get_model_status".to_string(),
					message: "Model handle not found".to_string(),
				}
				.into()
			})
	}

	async fn create_workflow(&self, definition: WorkflowDefinition) -> Result<WorkflowId> {
		duck!("MockPitAdapter::create_workflow called for {}", definition.name);

		let workflow_id = WorkflowId(Uuid::new_v4());
		self.workflows
			.lock()
			.unwrap()
			.insert(workflow_id, (definition, WorkflowStatus::Pending));
		Ok(workflow_id)
	}

	async fn execute_workflow(
		&self,
		workflow_id: WorkflowId,
		_context: ExecutionContext,
	) -> Result<WorkflowResult> {
		duck!("MockPitAdapter::execute_workflow called for {:?}", workflow_id);

		if let Some((_definition, _)) = self.workflows.lock().unwrap().get(&workflow_id) {
			let result = WorkflowResult {
				workflow_id,
				status: WorkflowStatus::Completed,
				data: HashMap::new(),
				duration: std::time::Duration::from_millis(100),
			};

			// Update workflow status
			if let Some((_, status)) = self.workflows.lock().unwrap().get_mut(&workflow_id) {
				*status = WorkflowStatus::Completed;
			}

			Ok(result)
		} else {
			Err(crate::errors::PortError::PitOperationFailed {
				operation: "execute_workflow".to_string(),
				message: "Workflow not found".to_string(),
			}
			.into())
		}
	}

	async fn get_workflow_status(&self, workflow_id: WorkflowId) -> Result<WorkflowStatus> {
		duck!("MockPitAdapter::get_workflow_status called for {:?}", workflow_id);

		self.workflows
			.lock()
			.unwrap()
			.get(&workflow_id)
			.map(|(_, status)| *status)
			.ok_or_else(|| {
				crate::errors::PortError::PitOperationFailed {
					operation: "get_workflow_status".to_string(),
					message: "Workflow not found".to_string(),
				}
				.into()
			})
	}

	async fn store_artifact(&self, data: ArtifactData) -> Result<ArtifactId> {
		duck!("MockPitAdapter::store_artifact called with {} bytes", data.content.len());

		let artifact_id = ArtifactId(Uuid::new_v4());
		self.artifacts.lock().unwrap().insert(artifact_id, data);
		Ok(artifact_id)
	}

	async fn retrieve_artifact(&self, artifact_id: ArtifactId) -> Result<ArtifactData> {
		duck!("MockPitAdapter::retrieve_artifact called for {:?}", artifact_id);

		self.artifacts.lock().unwrap().get(&artifact_id).cloned().ok_or_else(|| {
			crate::errors::PortError::PitOperationFailed {
				operation: "retrieve_artifact".to_string(),
				message: "Artifact not found".to_string(),
			}
			.into()
		})
	}

	async fn delete_artifact(&self, artifact_id: ArtifactId) -> Result<()> {
		duck!("MockPitAdapter::delete_artifact called for {:?}", artifact_id);

		if self.artifacts.lock().unwrap().remove(&artifact_id).is_none() {
			return Err(crate::errors::PortError::PitOperationFailed {
				operation: "delete_artifact".to_string(),
				message: "Artifact not found".to_string(),
			}
			.into());
		}

		Ok(())
	}

	async fn submit_decision(&self, context: DecisionContext) -> Result<Decision> {
		duck!(
			"MockPitAdapter::submit_decision called for context type: {}",
			context.context_type
		);

		let decision = Decision {
			id: DecisionId(Uuid::new_v4()),
			choice: context.options.first().unwrap_or(&"default".to_string()).clone(),
			confidence: 0.8,
			reasoning: Some("Mock decision".to_string()),
		};

		Ok(decision)
	}

	async fn get_policy(&self, policy_id: PolicyId) -> Result<Policy> {
		duck!("MockPitAdapter::get_policy called for {:?}", policy_id);

		self.policies.lock().unwrap().get(&policy_id).cloned().ok_or_else(|| {
			crate::errors::PortError::PitOperationFailed {
				operation: "get_policy".to_string(),
				message: "Policy not found".to_string(),
			}
			.into()
		})
	}

	async fn mark_stale(&self, resource_id: ResourceId) -> Result<()> {
		duck!("MockPitAdapter::mark_stale called for {:?}", resource_id);
		// Mock implementation - just succeed
		Ok(())
	}

	async fn cleanup_stale(&self, threshold: std::time::Duration) -> Result<CleanupReport> {
		duck!("MockPitAdapter::cleanup_stale called with threshold: {:?}", threshold);

		let report = CleanupReport {
			items_cleaned: 5,
			bytes_freed: 1024 * 1024, // 1MB
			duration: std::time::Duration::from_millis(50),
		};

		Ok(report)
	}
}
/// Mock implementation of ExtensionPort for testing
#[derive(Debug, Clone)]
pub struct MockExtensionAdapter {
	extensions: Arc<Mutex<HashMap<ExtensionId, (ExtensionManifest, ExtensionStatus)>>>,
	error_mode: Arc<Mutex<Option<String>>>,
}

impl MockExtensionAdapter {
	/// Creates a new mock extension adapter
	pub fn new() -> Self {
		duck!("Creating new MockExtensionAdapter");
		Self {
			extensions: Arc::new(Mutex::new(HashMap::new())),
			error_mode: Arc::new(Mutex::new(None)),
		}
	}

	/// Simulates an error condition for testing
	pub fn simulate_error(&self, error_type: &str) {
		duck!("MockExtensionAdapter simulating error: {}", error_type);
		*self.error_mode.lock().unwrap() = Some(error_type.to_string());
	}

	/// Clears error simulation
	pub fn clear_error(&self) {
		*self.error_mode.lock().unwrap() = None;
	}
}

impl Default for MockExtensionAdapter {
	fn default() -> Self {
		Self::new()
	}
}

#[async_trait]
impl ExtensionPort for MockExtensionAdapter {
	async fn load_extension(&self, manifest: ExtensionManifest) -> Result<ExtensionId> {
		duck!("MockExtensionAdapter::load_extension called for {}", manifest.name);

		if let Some(error) = self.error_mode.lock().unwrap().as_ref() {
			if error == "extension_load_failed" {
				return Err(crate::errors::PortError::ExtensionOperationFailed {
					extension_id: ExtensionId(Uuid::new_v4()),
					message: "Extension load failed".to_string(),
				}
				.into());
			}
		}

		let extension_id = ExtensionId(Uuid::new_v4());
		self.extensions
			.lock()
			.unwrap()
			.insert(extension_id, (manifest, ExtensionStatus::Loaded));
		Ok(extension_id)
	}

	async fn unload_extension(&self, extension_id: ExtensionId) -> Result<()> {
		duck!("MockExtensionAdapter::unload_extension called for {:?}", extension_id);

		if self.extensions.lock().unwrap().remove(&extension_id).is_none() {
			return Err(crate::errors::PortError::ExtensionOperationFailed {
				extension_id,
				message: "Extension not found".to_string(),
			}
			.into());
		}

		Ok(())
	}

	async fn activate_extension(&self, extension_id: ExtensionId) -> Result<()> {
		duck!("MockExtensionAdapter::activate_extension called for {:?}", extension_id);

		if let Some((_, status)) = self.extensions.lock().unwrap().get_mut(&extension_id) {
			*status = ExtensionStatus::Active;
			Ok(())
		} else {
			Err(crate::errors::PortError::ExtensionOperationFailed {
				extension_id,
				message: "Extension not found".to_string(),
			}
			.into())
		}
	}

	async fn deactivate_extension(&self, extension_id: ExtensionId) -> Result<()> {
		duck!("MockExtensionAdapter::deactivate_extension called for {:?}", extension_id);

		if let Some((_, status)) = self.extensions.lock().unwrap().get_mut(&extension_id) {
			*status = ExtensionStatus::Inactive;
			Ok(())
		} else {
			Err(crate::errors::PortError::ExtensionOperationFailed {
				extension_id,
				message: "Extension not found".to_string(),
			}
			.into())
		}
	}

	async fn send_message(
		&self,
		extension_id: ExtensionId,
		_message: ExtensionMessage,
	) -> Result<ExtensionResponse> {
		duck!("MockExtensionAdapter::send_message called for {:?}", extension_id);

		if !self.extensions.lock().unwrap().contains_key(&extension_id) {
			return Err(crate::errors::PortError::ExtensionOperationFailed {
				extension_id,
				message: "Extension not found".to_string(),
			}
			.into());
		}

		let response = ExtensionResponse {
			extension_id,
			payload: serde_json::json!({"response": "mock_response"}),
			success: true,
		};

		Ok(response)
	}

	async fn broadcast_message(
		&self,
		_message: ExtensionMessage,
	) -> Result<Vec<ExtensionResponse>> {
		duck!("MockExtensionAdapter::broadcast_message called");

		let extensions = self.extensions.lock().unwrap();
		let responses = extensions
			.keys()
			.map(|&extension_id| ExtensionResponse {
				extension_id,
				payload: serde_json::json!({"response": "mock_broadcast_response"}),
				success: true,
			})
			.collect();

		Ok(responses)
	}

	async fn list_extensions(&self) -> Result<Vec<ExtensionInfo>> {
		duck!("MockExtensionAdapter::list_extensions called");

		let extensions = self.extensions.lock().unwrap();
		let info_list = extensions
			.iter()
			.map(|(&id, (manifest, status))| ExtensionInfo {
				id,
				name: manifest.name.clone(),
				version: manifest.version.clone(),
				extension_type: manifest.extension_type,
				status: *status,
			})
			.collect();

		Ok(info_list)
	}

	async fn get_extension_info(&self, extension_id: ExtensionId) -> Result<ExtensionInfo> {
		duck!("MockExtensionAdapter::get_extension_info called for {:?}", extension_id);

		if let Some((manifest, status)) = self.extensions.lock().unwrap().get(&extension_id) {
			Ok(ExtensionInfo {
				id: extension_id,
				name: manifest.name.clone(),
				version: manifest.version.clone(),
				extension_type: manifest.extension_type,
				status: *status,
			})
		} else {
			Err(crate::errors::PortError::ExtensionOperationFailed {
				extension_id,
				message: "Extension not found".to_string(),
			}
			.into())
		}
	}

	async fn get_extension_health(&self, extension_id: ExtensionId) -> Result<HealthStatus> {
		duck!("MockExtensionAdapter::get_extension_health called for {:?}", extension_id);

		if self.extensions.lock().unwrap().contains_key(&extension_id) {
			Ok(HealthStatus::Healthy)
		} else {
			Err(crate::errors::PortError::ExtensionOperationFailed {
				extension_id,
				message: "Extension not found".to_string(),
			}
			.into())
		}
	}

	async fn restart_extension(&self, extension_id: ExtensionId) -> Result<()> {
		duck!("MockExtensionAdapter::restart_extension called for {:?}", extension_id);

		if let Some((_, status)) = self.extensions.lock().unwrap().get_mut(&extension_id) {
			*status = ExtensionStatus::Active;
			Ok(())
		} else {
			Err(crate::errors::PortError::ExtensionOperationFailed {
				extension_id,
				message: "Extension not found".to_string(),
			}
			.into())
		}
	}
}
/// Mock implementation of ConductorPort for testing
#[derive(Debug, Clone)]
pub struct MockConductorAdapter {
	status: Arc<Mutex<ConductorStatus>>,
	decisions: Arc<Mutex<HashMap<DecisionId, (DecisionContext, Decision)>>>,
	policies: Arc<Mutex<HashMap<PolicyId, Policy>>>,
	metrics: Arc<Mutex<LearningMetrics>>,
	error_mode: Arc<Mutex<Option<String>>>,
}

impl MockConductorAdapter {
	/// Creates a new mock conductor adapter
	pub fn new() -> Self {
		duck!("Creating new MockConductorAdapter");
		Self {
			status: Arc::new(Mutex::new(ConductorStatus::Stopped)),
			decisions: Arc::new(Mutex::new(HashMap::new())),
			policies: Arc::new(Mutex::new(HashMap::new())),
			metrics: Arc::new(Mutex::new(LearningMetrics {
				total_decisions: 0,
				average_confidence: 0.0,
				success_rate: 0.0,
				learning_rate: 0.1,
			})),
			error_mode: Arc::new(Mutex::new(None)),
		}
	}

	/// Simulates an error condition for testing
	pub fn simulate_error(&self, error_type: &str) {
		duck!("MockConductorAdapter simulating error: {}", error_type);
		*self.error_mode.lock().unwrap() = Some(error_type.to_string());
	}

	/// Clears error simulation
	pub fn clear_error(&self) {
		*self.error_mode.lock().unwrap() = None;
	}
}

impl Default for MockConductorAdapter {
	fn default() -> Self {
		Self::new()
	}
}

#[async_trait]
impl ConductorPort for MockConductorAdapter {
	async fn start_conductor(&self) -> Result<()> {
		duck!("MockConductorAdapter::start_conductor called");

		if let Some(error) = self.error_mode.lock().unwrap().as_ref() {
			if error == "python_subprocess_failed" {
				return Err(crate::errors::PortError::ConductorOperationFailed {
					message: "Python subprocess failed to start".to_string(),
				}
				.into());
			}
		}

		*self.status.lock().unwrap() = ConductorStatus::Running;
		Ok(())
	}

	async fn stop_conductor(&self) -> Result<()> {
		duck!("MockConductorAdapter::stop_conductor called");
		*self.status.lock().unwrap() = ConductorStatus::Stopped;
		Ok(())
	}

	async fn get_conductor_status(&self) -> Result<ConductorStatus> {
		duck!("MockConductorAdapter::get_conductor_status called");
		Ok(*self.status.lock().unwrap())
	}

	async fn submit_decision(&self, context: DecisionContext) -> Result<Decision> {
		duck!(
			"MockConductorAdapter::submit_decision called for context type: {}",
			context.context_type
		);

		let decision = Decision {
			id: DecisionId(Uuid::new_v4()),
			choice: context.options.first().unwrap_or(&"default".to_string()).clone(),
			confidence: 0.85,
			reasoning: Some("Mock conductor decision based on first available option".to_string()),
		};

		// Store decision for history
		self.decisions.lock().unwrap().insert(decision.id, (context, decision.clone()));

		// Update metrics
		let mut metrics = self.metrics.lock().unwrap();
		metrics.total_decisions += 1;
		metrics.average_confidence = (metrics.average_confidence
			* (metrics.total_decisions - 1) as f64
			+ decision.confidence)
			/ metrics.total_decisions as f64;

		Ok(decision)
	}

	async fn get_decision_history(&self, limit: usize) -> Result<Vec<DecisionRecord>> {
		duck!("MockConductorAdapter::get_decision_history called with limit: {}", limit);

		let decisions = self.decisions.lock().unwrap();
		let records: Vec<DecisionRecord> = decisions
			.iter()
			.take(limit)
			.map(|(_, (context, decision))| DecisionRecord {
				id: decision.id,
				context: context.clone(),
				decision: decision.clone(),
				timestamp: chrono::Utc::now(),
			})
			.collect();

		Ok(records)
	}

	async fn update_policy(&self, policy: Policy) -> Result<()> {
		duck!("MockConductorAdapter::update_policy called for policy: {}", policy.name);
		self.policies.lock().unwrap().insert(policy.id, policy);
		Ok(())
	}

	async fn get_active_policies(&self) -> Result<Vec<Policy>> {
		duck!("MockConductorAdapter::get_active_policies called");
		let policies = self.policies.lock().unwrap();
		Ok(policies.values().cloned().collect())
	}

	async fn submit_feedback(&self, decision_id: DecisionId, feedback: Feedback) -> Result<()> {
		duck!(
			"MockConductorAdapter::submit_feedback called for decision {:?} with score: {}",
			decision_id,
			feedback.score
		);

		if !self.decisions.lock().unwrap().contains_key(&decision_id) {
			return Err(crate::errors::PortError::ConductorOperationFailed {
				message: "Decision not found".to_string(),
			}
			.into());
		}

		// Update learning metrics based on feedback
		let mut metrics = self.metrics.lock().unwrap();
		if feedback.score > 0.0 {
			metrics.success_rate = (metrics.success_rate * 0.9) + (0.1 * feedback.score);
		}

		Ok(())
	}

	async fn get_learning_metrics(&self) -> Result<LearningMetrics> {
		duck!("MockConductorAdapter::get_learning_metrics called");
		Ok(self.metrics.lock().unwrap().clone())
	}
}

/// Mock implementation of DataAccessPort for testing
#[derive(Debug, Clone)]
pub struct MockDataAccessAdapter {
	workflows: Arc<Mutex<HashMap<WorkflowId, WorkflowSpec>>>,
	_users: Arc<Mutex<HashMap<UserId, UserData>>>,
	extensions: Arc<Mutex<HashMap<ExtensionId, ExtensionMetadata>>>,
	sessions: Arc<Mutex<HashMap<String, UserSession>>>,
	error_mode: Arc<Mutex<Option<String>>>,
}

impl MockDataAccessAdapter {
	/// Creates a new mock data access adapter
	pub fn new() -> Self {
		duck!("Creating new MockDataAccessAdapter");
		Self {
			workflows: Arc::new(Mutex::new(HashMap::new())),
			_users: Arc::new(Mutex::new(HashMap::new())),
			extensions: Arc::new(Mutex::new(HashMap::new())),
			sessions: Arc::new(Mutex::new(HashMap::new())),
			error_mode: Arc::new(Mutex::new(None)),
		}
	}

	/// Simulates an error condition for testing
	pub fn simulate_error(&self, error_type: &str) {
		duck!("MockDataAccessAdapter simulating error: {}", error_type);
		*self.error_mode.lock().unwrap() = Some(error_type.to_string());
	}

	/// Clears error simulation
	pub fn clear_error(&self) {
		*self.error_mode.lock().unwrap() = None;
	}
}

impl Default for MockDataAccessAdapter {
	fn default() -> Self {
		Self::new()
	}
}

#[async_trait]
impl DataAccessPort for MockDataAccessAdapter {
	async fn pre_validate_workflow(&self, workflow: &WorkflowSpec) -> Result<()> {
		duck!("MockDataAccessAdapter::pre_validate_workflow called for: {}", workflow.name);

		if let Some(error) = self.error_mode.lock().unwrap().as_ref() {
			if error == "validation_failed" {
				return Err(crate::errors::PortError::PreValidationError {
					field: "name".to_string(),
					message: "Workflow name cannot be empty".to_string(),
				}
				.into());
			}
		}

		// Basic pre-validation checks
		if workflow.name.is_empty() {
			return Err(crate::errors::PortError::PreValidationError {
				field: "name".to_string(),
				message: "Workflow name cannot be empty".to_string(),
			}
			.into());
		}

		if workflow.timeout.as_secs() == 0 {
			return Err(crate::errors::PortError::PreValidationError {
				field: "timeout".to_string(),
				message: "Workflow timeout must be greater than 0".to_string(),
			}
			.into());
		}

		Ok(())
	}

	async fn pre_validate_user(&self, user_data: &UserData) -> Result<()> {
		duck!("MockDataAccessAdapter::pre_validate_user called for: {}", user_data.username);

		if user_data.username.is_empty() {
			return Err(crate::errors::PortError::PreValidationError {
				field: "username".to_string(),
				message: "Username cannot be empty".to_string(),
			}
			.into());
		}

		if !user_data.email.contains('@') {
			return Err(crate::errors::PortError::PreValidationError {
				field: "email".to_string(),
				message: "Email must contain @ symbol".to_string(),
			}
			.into());
		}

		Ok(())
	}

	async fn pre_validate_extension(&self, manifest: &ExtensionManifest) -> Result<()> {
		duck!("MockDataAccessAdapter::pre_validate_extension called for: {}", manifest.name);

		if manifest.name.is_empty() {
			return Err(crate::errors::PortError::PreValidationError {
				field: "name".to_string(),
				message: "Extension name cannot be empty".to_string(),
			}
			.into());
		}

		if manifest.entry_point.is_empty() {
			return Err(crate::errors::PortError::PreValidationError {
				field: "entry_point".to_string(),
				message: "Extension entry point cannot be empty".to_string(),
			}
			.into());
		}

		Ok(())
	}

	async fn create_workflow(&self, workflow: WorkflowSpec) -> Result<WorkflowId> {
		duck!("MockDataAccessAdapter::create_workflow called for: {}", workflow.name);

		// Pre-validate first
		self.pre_validate_workflow(&workflow).await?;

		let workflow_id = WorkflowId(Uuid::new_v4());
		self.workflows.lock().unwrap().insert(workflow_id, workflow);
		Ok(workflow_id)
	}

	async fn get_workflow(&self, workflow_id: WorkflowId) -> Result<WorkflowSpec> {
		duck!("MockDataAccessAdapter::get_workflow called for: {:?}", workflow_id);

		self.workflows.lock().unwrap().get(&workflow_id).cloned().ok_or_else(|| {
			crate::errors::PortError::DataAccessFailed {
				operation: "get_workflow".to_string(),
				message: "Workflow not found".to_string(),
			}
			.into()
		})
	}

	async fn update_workflow(
		&self,
		workflow_id: WorkflowId,
		updates: WorkflowUpdates,
	) -> Result<()> {
		duck!("MockDataAccessAdapter::update_workflow called for: {:?}", workflow_id);

		let mut workflows = self.workflows.lock().unwrap();
		if let Some(workflow) = workflows.get_mut(&workflow_id) {
			if let Some(name) = updates.name {
				workflow.name = name;
			}
			if let Some(description) = updates.description {
				workflow.description = description;
			}
			if let Some(steps) = updates.steps {
				workflow.steps = steps;
			}
			if let Some(timeout) = updates.timeout {
				workflow.timeout = timeout;
			}
			Ok(())
		} else {
			Err(crate::errors::PortError::DataAccessFailed {
				operation: "update_workflow".to_string(),
				message: "Workflow not found".to_string(),
			}
			.into())
		}
	}

	async fn delete_workflow(&self, workflow_id: WorkflowId) -> Result<()> {
		duck!("MockDataAccessAdapter::delete_workflow called for: {:?}", workflow_id);

		if self.workflows.lock().unwrap().remove(&workflow_id).is_none() {
			return Err(crate::errors::PortError::DataAccessFailed {
				operation: "delete_workflow".to_string(),
				message: "Workflow not found".to_string(),
			}
			.into());
		}

		Ok(())
	}

	async fn authenticate_user(&self, credentials: UserCredentials) -> Result<UserSession> {
		duck!("MockDataAccessAdapter::authenticate_user called for: {}", credentials.username);

		// Mock authentication - always succeed for non-empty credentials
		if credentials.username.is_empty() || credentials.password.is_empty() {
			return Err(crate::errors::PortError::AuthoritativeValidationError {
				message: "Invalid credentials".to_string(),
			}
			.into());
		}

		let user_id = UserId(Uuid::new_v4());
		let session_id = Uuid::new_v4().to_string();
		let session = UserSession {
			session_id: session_id.clone(),
			user_id,
			expires_at: chrono::Utc::now() + chrono::Duration::hours(24),
		};

		self.sessions.lock().unwrap().insert(session_id, session.clone());
		Ok(session)
	}

	async fn authorize_action(&self, user_id: UserId, action: Action) -> Result<bool> {
		duck!(
			"MockDataAccessAdapter::authorize_action called for user {:?} action: {}",
			user_id,
			action.action_type
		);

		// Mock authorization - always allow for simplicity
		Ok(true)
	}

	async fn get_user_permissions(&self, user_id: UserId) -> Result<Vec<Permission>> {
		duck!("MockDataAccessAdapter::get_user_permissions called for: {:?}", user_id);

		// Mock permissions - return basic permissions
		Ok(vec![Permission::FileRead, Permission::FileWrite])
	}

	async fn register_extension(&self, manifest: ExtensionManifest) -> Result<ExtensionId> {
		duck!("MockDataAccessAdapter::register_extension called for: {}", manifest.name);

		// Pre-validate first
		self.pre_validate_extension(&manifest).await?;

		let extension_id = ExtensionId(Uuid::new_v4());
		let metadata = ExtensionMetadata {
			id: extension_id,
			metadata: std::collections::HashMap::new(),
			updated_at: chrono::Utc::now(),
		};

		self.extensions.lock().unwrap().insert(extension_id, metadata);
		Ok(extension_id)
	}

	async fn get_extension_metadata(&self, extension_id: ExtensionId) -> Result<ExtensionMetadata> {
		duck!("MockDataAccessAdapter::get_extension_metadata called for: {:?}", extension_id);

		self.extensions.lock().unwrap().get(&extension_id).cloned().ok_or_else(|| {
			crate::errors::PortError::DataAccessFailed {
				operation: "get_extension_metadata".to_string(),
				message: "Extension not found".to_string(),
			}
			.into()
		})
	}

	async fn update_extension_status(
		&self,
		extension_id: ExtensionId,
		status: ExtensionStatus,
	) -> Result<()> {
		duck!(
			"MockDataAccessAdapter::update_extension_status called for: {:?} status: {:?}",
			extension_id,
			status
		);

		if let Some(metadata) = self.extensions.lock().unwrap().get_mut(&extension_id) {
			metadata.updated_at = chrono::Utc::now();
			// In a real implementation, we'd store the status in metadata
			Ok(())
		} else {
			Err(crate::errors::PortError::DataAccessFailed {
				operation: "update_extension_status".to_string(),
				message: "Extension not found".to_string(),
			}
			.into())
		}
	}
}
