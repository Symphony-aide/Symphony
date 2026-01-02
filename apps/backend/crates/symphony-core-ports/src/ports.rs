//! Port trait definitions for Symphony's H2A2 architecture
//!
//! This module defines the core port interfaces that separate domain logic
//! from infrastructure concerns, enabling testability and maintainability.

use crate::types::*;
use crate::Result;
use async_trait::async_trait;
use std::path::PathBuf;

/// Core editing operations port (XI-editor abstraction)
///
/// This port provides an abstraction layer over XI-editor functionality,
/// enabling the domain core to perform text editing operations without
/// depending on XI-editor's specific implementation.
///
/// # Examples
///
/// ```rust
/// use symphony_core_ports::{TextEditingPort, Position};
///
/// async fn edit_text<T: TextEditingPort>(editor: &T) -> Result<(), Box<dyn std::error::Error>> {
///     let buffer_id = editor.create_buffer(None).await?;
///     let position = Position { line: 0, column: 0 };
///     editor.insert_text(buffer_id, position, "Hello, World!").await?;
///     Ok(())
/// }
/// ```
#[async_trait]
pub trait TextEditingPort: Send + Sync {
	// Buffer Management

	/// Creates a new buffer, optionally associated with a file
	///
	/// # Arguments
	/// * `file_path` - Optional file path to associate with the buffer
	///
	/// # Returns
	/// A unique buffer identifier
	///
	/// # Errors
	/// Returns an error if buffer creation fails
	async fn create_buffer(&self, file_path: Option<PathBuf>) -> Result<BufferId>;

	/// Closes a buffer and releases its resources
	///
	/// # Arguments
	/// * `buffer_id` - The buffer to close
	///
	/// # Errors
	/// Returns an error if the buffer doesn't exist or cannot be closed
	async fn close_buffer(&self, buffer_id: BufferId) -> Result<()>;

	/// Gets the current content of a buffer
	///
	/// # Arguments
	/// * `buffer_id` - The buffer to read from
	///
	/// # Returns
	/// The current buffer content as a string
	///
	/// # Errors
	/// Returns an error if the buffer doesn't exist
	async fn get_buffer_content(&self, buffer_id: BufferId) -> Result<String>;

	// Text Operations

	/// Inserts text at the specified position
	///
	/// # Arguments
	/// * `buffer_id` - The buffer to modify
	/// * `position` - Where to insert the text
	/// * `text` - The text to insert
	///
	/// # Errors
	/// Returns an error if the buffer doesn't exist or position is invalid
	async fn insert_text(&self, buffer_id: BufferId, position: Position, text: &str) -> Result<()>;

	/// Deletes text in the specified range
	///
	/// # Arguments
	/// * `buffer_id` - The buffer to modify
	/// * `range` - The range of text to delete
	///
	/// # Errors
	/// Returns an error if the buffer doesn't exist or range is invalid
	async fn delete_text(&self, buffer_id: BufferId, range: Range) -> Result<()>;

	/// Replaces text in the specified range
	///
	/// # Arguments
	/// * `buffer_id` - The buffer to modify
	/// * `range` - The range of text to replace
	/// * `text` - The replacement text
	///
	/// # Errors
	/// Returns an error if the buffer doesn't exist or range is invalid
	async fn replace_text(&self, buffer_id: BufferId, range: Range, text: &str) -> Result<()>;

	// File Operations

	/// Saves a buffer to its associated file
	///
	/// # Arguments
	/// * `buffer_id` - The buffer to save
	///
	/// # Errors
	/// Returns an error if the buffer has no associated file or save fails
	async fn save_buffer(&self, buffer_id: BufferId) -> Result<()>;

	/// Saves a buffer to a specific file path
	///
	/// # Arguments
	/// * `buffer_id` - The buffer to save
	/// * `path` - The file path to save to
	///
	/// # Errors
	/// Returns an error if the save operation fails
	async fn save_buffer_as(&self, buffer_id: BufferId, path: PathBuf) -> Result<()>;

	/// Reloads a buffer from its associated file
	///
	/// # Arguments
	/// * `buffer_id` - The buffer to reload
	///
	/// # Errors
	/// Returns an error if the buffer has no associated file or reload fails
	async fn reload_buffer(&self, buffer_id: BufferId) -> Result<()>;

	// View Management

	/// Creates a new view for a buffer
	///
	/// # Arguments
	/// * `buffer_id` - The buffer to create a view for
	///
	/// # Returns
	/// A unique view identifier
	///
	/// # Errors
	/// Returns an error if the buffer doesn't exist
	async fn create_view(&self, buffer_id: BufferId) -> Result<ViewId>;

	/// Closes a view
	///
	/// # Arguments
	/// * `view_id` - The view to close
	///
	/// # Errors
	/// Returns an error if the view doesn't exist
	async fn close_view(&self, view_id: ViewId) -> Result<()>;

	/// Sets the cursor position in a view
	///
	/// # Arguments
	/// * `view_id` - The view to modify
	/// * `position` - The new cursor position
	///
	/// # Errors
	/// Returns an error if the view doesn't exist or position is invalid
	async fn set_cursor(&self, view_id: ViewId, position: Position) -> Result<()>;

	/// Sets the selection range in a view
	///
	/// # Arguments
	/// * `view_id` - The view to modify
	/// * `range` - The selection range
	///
	/// # Errors
	/// Returns an error if the view doesn't exist or range is invalid
	async fn set_selection(&self, view_id: ViewId, range: Range) -> Result<()>;

	// Event Streaming

	/// Subscribes to text editing events
	///
	/// # Returns
	/// An event stream for receiving text editing events
	///
	/// # Errors
	/// Returns an error if event subscription fails
	async fn subscribe_to_events(&self) -> Result<EventStream<TextEditingEvent>>;
}
/// High-performance Pit operations port
///
/// This port provides access to Symphony's high-performance infrastructure
/// extensions (The Pit), including Pool Manager, DAG Tracker, Artifact Store,
/// Arbitration Engine, and Stale Manager.
///
/// # Performance Targets
/// - Pool Manager: 50-100ns allocation on cache hit
/// - Artifact Store: 1-5ms store, 0.5-2ms retrieve
/// - DAG Tracker: Handle 10,000-node workflows
///
/// # Examples
///
/// ```rust
/// use symphony_core_ports::{PitPort, ModelSpec, ModelType, ResourceRequirements};
/// use std::collections::HashMap;
///
/// async fn allocate_model<T: PitPort>(pit: &T) -> Result<(), Box<dyn std::error::Error>> {
///     let spec = ModelSpec {
///         name: "gpt-4".to_string(),
///         version: "1.0.0".to_string(),
///         model_type: ModelType::Language,
///         resource_requirements: ResourceRequirements {
///             memory_mb: 8192,
///             cpu_cores: 4.0,
///             gpu_memory_mb: Some(4096),
///             network_access: true,
///         },
///         configuration: HashMap::new(),
///     };
///     
///     let handle = pit.allocate_model(spec).await?;
///     duck!("Allocated model with handle: {:?}", handle);
///     Ok(())
/// }
/// ```
#[async_trait]
pub trait PitPort: Send + Sync {
	// Pool Manager Operations (50-100ns target)

	/// Allocates a model with the given specification
	///
	/// # Arguments
	/// * `spec` - The model specification including resource requirements
	///
	/// # Returns
	/// A handle to the allocated model
	///
	/// # Errors
	/// Returns an error if allocation fails due to insufficient resources
	/// or invalid specification
	async fn allocate_model(&self, spec: ModelSpec) -> Result<ModelHandle>;

	/// Deallocates a previously allocated model
	///
	/// # Arguments
	/// * `handle` - The model handle to deallocate
	///
	/// # Errors
	/// Returns an error if the handle is invalid or deallocation fails
	async fn deallocate_model(&self, handle: ModelHandle) -> Result<()>;

	/// Gets the current status of an allocated model
	///
	/// # Arguments
	/// * `handle` - The model handle to check
	///
	/// # Returns
	/// The current status of the model
	///
	/// # Errors
	/// Returns an error if the handle is invalid
	async fn get_model_status(&self, handle: ModelHandle) -> Result<ModelStatus>;

	// DAG Tracker Operations

	/// Creates a new workflow from a definition
	///
	/// # Arguments
	/// * `definition` - The workflow definition
	///
	/// # Returns
	/// A unique workflow identifier
	///
	/// # Errors
	/// Returns an error if the workflow definition is invalid
	async fn create_workflow(&self, definition: WorkflowDefinition) -> Result<WorkflowId>;

	/// Executes a workflow with the given context
	///
	/// # Arguments
	/// * `workflow_id` - The workflow to execute
	/// * `context` - Execution context and variables
	///
	/// # Returns
	/// The workflow execution result
	///
	/// # Errors
	/// Returns an error if execution fails or workflow doesn't exist
	async fn execute_workflow(
		&self,
		workflow_id: WorkflowId,
		context: ExecutionContext,
	) -> Result<WorkflowResult>;

	/// Gets the current status of a workflow
	///
	/// # Arguments
	/// * `workflow_id` - The workflow to check
	///
	/// # Returns
	/// The current workflow status
	///
	/// # Errors
	/// Returns an error if the workflow doesn't exist
	async fn get_workflow_status(&self, workflow_id: WorkflowId) -> Result<WorkflowStatus>;

	// Artifact Store Operations

	/// Stores artifact data and returns an identifier
	///
	/// # Arguments
	/// * `data` - The artifact data to store
	///
	/// # Returns
	/// A unique artifact identifier
	///
	/// # Errors
	/// Returns an error if storage fails
	async fn store_artifact(&self, data: ArtifactData) -> Result<ArtifactId>;

	/// Retrieves artifact data by identifier
	///
	/// # Arguments
	/// * `artifact_id` - The artifact to retrieve
	///
	/// # Returns
	/// The artifact data
	///
	/// # Errors
	/// Returns an error if the artifact doesn't exist
	async fn retrieve_artifact(&self, artifact_id: ArtifactId) -> Result<ArtifactData>;

	/// Deletes an artifact
	///
	/// # Arguments
	/// * `artifact_id` - The artifact to delete
	///
	/// # Errors
	/// Returns an error if the artifact doesn't exist or deletion fails
	async fn delete_artifact(&self, artifact_id: ArtifactId) -> Result<()>;

	// Arbitration Engine Operations

	/// Submits a decision context for arbitration
	///
	/// # Arguments
	/// * `context` - The decision context
	///
	/// # Returns
	/// The arbitrated decision
	///
	/// # Errors
	/// Returns an error if arbitration fails
	async fn submit_decision(&self, context: DecisionContext) -> Result<Decision>;

	/// Gets a policy by identifier
	///
	/// # Arguments
	/// * `policy_id` - The policy to retrieve
	///
	/// # Returns
	/// The policy definition
	///
	/// # Errors
	/// Returns an error if the policy doesn't exist
	async fn get_policy(&self, policy_id: PolicyId) -> Result<Policy>;

	// Stale Manager Operations

	/// Marks a resource as stale
	///
	/// # Arguments
	/// * `resource_id` - The resource to mark as stale
	///
	/// # Errors
	/// Returns an error if the resource doesn't exist
	async fn mark_stale(&self, resource_id: ResourceId) -> Result<()>;

	/// Cleans up stale resources older than the threshold
	///
	/// # Arguments
	/// * `threshold` - Age threshold for cleanup
	///
	/// # Returns
	/// A report of the cleanup operation
	///
	/// # Errors
	/// Returns an error if cleanup fails
	async fn cleanup_stale(&self, threshold: std::time::Duration) -> Result<CleanupReport>;
}
/// Extension lifecycle and communication port
///
/// This port manages the lifecycle of extensions in Symphony's Orchestra Kit,
/// providing actor-based process isolation for safe extension execution.
///
/// # Extension Types
/// - **Instruments**: AI/ML models (🎻)
/// - **Operators**: Workflow utilities (⚙️)  
/// - **Motifs**: UI enhancements (🧩)
///
/// # Examples
///
/// ```rust
/// use symphony_core_ports::{ExtensionPort, ExtensionManifest, ExtensionType};
///
/// async fn load_extension<T: ExtensionPort>(ext_port: &T) -> Result<(), Box<dyn std::error::Error>> {
///     let manifest = ExtensionManifest {
///         name: "my-extension".to_string(),
///         version: "1.0.0".to_string(),
///         extension_type: ExtensionType::Instrument,
///         permissions: vec![],
///         dependencies: vec![],
///         entry_point: "main.py".to_string(),
///     };
///     
///     let extension_id = ext_port.load_extension(manifest).await?;
///     ext_port.activate_extension(extension_id).await?;
///     Ok(())
/// }
/// ```
#[async_trait]
pub trait ExtensionPort: Send + Sync {
	// Extension Lifecycle

	/// Loads an extension from its manifest
	///
	/// # Arguments
	/// * `manifest` - The extension manifest containing metadata and requirements
	///
	/// # Returns
	/// A unique extension identifier
	///
	/// # Errors
	/// Returns an error if the manifest is invalid or loading fails
	async fn load_extension(&self, manifest: ExtensionManifest) -> Result<ExtensionId>;

	/// Unloads an extension and cleans up its resources
	///
	/// # Arguments
	/// * `extension_id` - The extension to unload
	///
	/// # Errors
	/// Returns an error if the extension doesn't exist or unloading fails
	async fn unload_extension(&self, extension_id: ExtensionId) -> Result<()>;

	/// Activates a loaded extension
	///
	/// # Arguments
	/// * `extension_id` - The extension to activate
	///
	/// # Errors
	/// Returns an error if the extension doesn't exist or activation fails
	async fn activate_extension(&self, extension_id: ExtensionId) -> Result<()>;

	/// Deactivates an active extension
	///
	/// # Arguments
	/// * `extension_id` - The extension to deactivate
	///
	/// # Errors
	/// Returns an error if the extension doesn't exist or deactivation fails
	async fn deactivate_extension(&self, extension_id: ExtensionId) -> Result<()>;

	// Extension Communication

	/// Sends a message to a specific extension
	///
	/// # Arguments
	/// * `extension_id` - The target extension
	/// * `message` - The message to send
	///
	/// # Returns
	/// The extension's response
	///
	/// # Errors
	/// Returns an error if the extension doesn't exist or communication fails
	async fn send_message(
		&self,
		extension_id: ExtensionId,
		message: ExtensionMessage,
	) -> Result<ExtensionResponse>;

	/// Broadcasts a message to all active extensions
	///
	/// # Arguments
	/// * `message` - The message to broadcast
	///
	/// # Returns
	/// Responses from all extensions that received the message
	///
	/// # Errors
	/// Returns an error if broadcasting fails
	async fn broadcast_message(&self, message: ExtensionMessage) -> Result<Vec<ExtensionResponse>>;

	// Extension Discovery

	/// Lists all loaded extensions
	///
	/// # Returns
	/// Information about all loaded extensions
	///
	/// # Errors
	/// Returns an error if the operation fails
	async fn list_extensions(&self) -> Result<Vec<ExtensionInfo>>;

	/// Gets information about a specific extension
	///
	/// # Arguments
	/// * `extension_id` - The extension to get information about
	///
	/// # Returns
	/// Detailed information about the extension
	///
	/// # Errors
	/// Returns an error if the extension doesn't exist
	async fn get_extension_info(&self, extension_id: ExtensionId) -> Result<ExtensionInfo>;

	// Process Management

	/// Gets the health status of an extension
	///
	/// # Arguments
	/// * `extension_id` - The extension to check
	///
	/// # Returns
	/// The current health status
	///
	/// # Errors
	/// Returns an error if the extension doesn't exist
	async fn get_extension_health(&self, extension_id: ExtensionId) -> Result<HealthStatus>;

	/// Restarts a failed or unresponsive extension
	///
	/// # Arguments
	/// * `extension_id` - The extension to restart
	///
	/// # Errors
	/// Returns an error if the extension doesn't exist or restart fails
	async fn restart_extension(&self, extension_id: ExtensionId) -> Result<()>;
}
/// Python Conductor integration bridge port
///
/// This port provides integration with Symphony's Python-based Conductor,
/// which handles AI orchestration and decision-making through reinforcement
/// learning trained via Function Quest Game (FQG).
///
/// # Examples
///
/// ```rust
/// use symphony_core_ports::{ConductorPort, DecisionContext};
/// use std::collections::HashMap;
///
/// async fn make_decision<T: ConductorPort>(conductor: &T) -> Result<(), Box<dyn std::error::Error>> {
///     conductor.start_conductor().await?;
///     
///     let context = DecisionContext {
///         context_type: "model_selection".to_string(),
///         data: HashMap::new(),
///         options: vec!["gpt-4".to_string(), "claude-3".to_string()],
///     };
///     
///     let decision = conductor.submit_decision(context).await?;
///     duck!("Conductor chose: {}", decision.choice);
///     Ok(())
/// }
/// ```
#[async_trait]
pub trait ConductorPort: Send + Sync {
	// Conductor Lifecycle

	/// Starts the Python Conductor subprocess
	///
	/// # Errors
	/// Returns an error if the Conductor fails to start
	async fn start_conductor(&self) -> Result<()>;

	/// Stops the Python Conductor subprocess
	///
	/// # Errors
	/// Returns an error if the Conductor fails to stop gracefully
	async fn stop_conductor(&self) -> Result<()>;

	/// Gets the current status of the Conductor
	///
	/// # Returns
	/// The current Conductor status
	///
	/// # Errors
	/// Returns an error if status cannot be determined
	async fn get_conductor_status(&self) -> Result<ConductorStatus>;

	// Decision Making

	/// Submits a decision context to the Conductor for processing
	///
	/// # Arguments
	/// * `context` - The decision context including available options
	///
	/// # Returns
	/// The Conductor's decision with confidence score and reasoning
	///
	/// # Errors
	/// Returns an error if the Conductor is not running or decision fails
	async fn submit_decision(&self, context: DecisionContext) -> Result<Decision>;

	/// Gets the history of recent decisions
	///
	/// # Arguments
	/// * `limit` - Maximum number of decisions to return
	///
	/// # Returns
	/// A list of recent decision records
	///
	/// # Errors
	/// Returns an error if the operation fails
	async fn get_decision_history(&self, limit: usize) -> Result<Vec<DecisionRecord>>;

	// Policy Management

	/// Updates a policy in the Conductor
	///
	/// # Arguments
	/// * `policy` - The policy to update
	///
	/// # Errors
	/// Returns an error if the policy is invalid or update fails
	async fn update_policy(&self, policy: Policy) -> Result<()>;

	/// Gets all active policies
	///
	/// # Returns
	/// A list of all active policies
	///
	/// # Errors
	/// Returns an error if the operation fails
	async fn get_active_policies(&self) -> Result<Vec<Policy>>;

	// Learning Integration

	/// Submits feedback for a previous decision to improve learning
	///
	/// # Arguments
	/// * `decision_id` - The decision to provide feedback for
	/// * `feedback` - The feedback including score and optional message
	///
	/// # Errors
	/// Returns an error if the decision doesn't exist or feedback fails
	async fn submit_feedback(&self, decision_id: DecisionId, feedback: Feedback) -> Result<()>;

	/// Gets current learning metrics from the Conductor
	///
	/// # Returns
	/// Current learning metrics including success rate and confidence
	///
	/// # Errors
	/// Returns an error if metrics cannot be retrieved
	async fn get_learning_metrics(&self) -> Result<LearningMetrics>;
}
/// Two-layer data architecture port with pre-validation
///
/// This port implements Symphony's two-layer data architecture where:
/// - **Rust Layer**: Fast pre-validation (<1ms) for technical constraints
/// - **OFB Python Layer**: Authoritative validation with RBAC and business rules
///
/// # Architecture Principles
/// - Pre-validation prevents unnecessary HTTP requests
/// - Single HTTP calls to OFB Python for authoritative operations
/// - Error categorization distinguishes validation layers
/// - Clean separation between technical and business validation
///
/// # Examples
///
/// ```rust
/// use symphony_core_ports::{DataAccessPort, WorkflowSpec};
/// use std::time::Duration;
///
/// async fn create_workflow<T: DataAccessPort>(data_port: &T) -> Result<(), Box<dyn std::error::Error>> {
///     let workflow = WorkflowSpec {
///         name: "my-workflow".to_string(),
///         description: "A test workflow".to_string(),
///         steps: vec![],
///         timeout: Duration::from_secs(300),
///     };
///     
///     // Fast pre-validation in Rust (<1ms)
///     data_port.pre_validate_workflow(&workflow).await?;
///     
///     // Authoritative creation via OFB Python (single HTTP call)
///     let workflow_id = data_port.create_workflow(workflow).await?;
///     duck!("Created workflow: {:?}", workflow_id);
///     Ok(())
/// }
/// ```
#[async_trait]
pub trait DataAccessPort: Send + Sync {
	// Pre-validation Layer (Rust, <1ms)

	/// Pre-validates a workflow specification for technical constraints
	///
	/// This performs fast technical validation (name format, timeout ranges, etc.)
	/// without business logic or RBAC checks.
	///
	/// # Arguments
	/// * `workflow` - The workflow specification to validate
	///
	/// # Errors
	/// Returns a PreValidationError if technical constraints are violated
	async fn pre_validate_workflow(&self, workflow: &WorkflowSpec) -> Result<()>;

	/// Pre-validates user data for technical constraints
	///
	/// # Arguments
	/// * `user_data` - The user data to validate
	///
	/// # Errors
	/// Returns a PreValidationError if technical constraints are violated
	async fn pre_validate_user(&self, user_data: &UserData) -> Result<()>;

	/// Pre-validates an extension manifest for technical constraints
	///
	/// # Arguments
	/// * `manifest` - The extension manifest to validate
	///
	/// # Errors
	/// Returns a PreValidationError if technical constraints are violated
	async fn pre_validate_extension(&self, manifest: &ExtensionManifest) -> Result<()>;

	// Authoritative Operations (OFB Python, single HTTP calls)

	/// Creates a new workflow after full validation
	///
	/// This performs authoritative validation including RBAC and business rules
	/// via a single HTTP call to OFB Python.
	///
	/// # Arguments
	/// * `workflow` - The workflow specification to create
	///
	/// # Returns
	/// A unique workflow identifier
	///
	/// # Errors
	/// Returns an AuthoritativeValidationError if business validation fails
	async fn create_workflow(&self, workflow: WorkflowSpec) -> Result<WorkflowId>;

	/// Gets a workflow by identifier
	///
	/// # Arguments
	/// * `workflow_id` - The workflow to retrieve
	///
	/// # Returns
	/// The workflow specification
	///
	/// # Errors
	/// Returns an error if the workflow doesn't exist or access is denied
	async fn get_workflow(&self, workflow_id: WorkflowId) -> Result<WorkflowSpec>;

	/// Updates an existing workflow
	///
	/// # Arguments
	/// * `workflow_id` - The workflow to update
	/// * `updates` - The updates to apply
	///
	/// # Errors
	/// Returns an error if the workflow doesn't exist, updates are invalid,
	/// or access is denied
	async fn update_workflow(
		&self,
		workflow_id: WorkflowId,
		updates: WorkflowUpdates,
	) -> Result<()>;

	/// Deletes a workflow
	///
	/// # Arguments
	/// * `workflow_id` - The workflow to delete
	///
	/// # Errors
	/// Returns an error if the workflow doesn't exist or access is denied
	async fn delete_workflow(&self, workflow_id: WorkflowId) -> Result<()>;

	// User Management (delegated to OFB Python)

	/// Authenticates a user with credentials
	///
	/// # Arguments
	/// * `credentials` - The user credentials
	///
	/// # Returns
	/// A user session if authentication succeeds
	///
	/// # Errors
	/// Returns an error if authentication fails
	async fn authenticate_user(&self, credentials: UserCredentials) -> Result<UserSession>;

	/// Authorizes a user action
	///
	/// # Arguments
	/// * `user_id` - The user requesting the action
	/// * `action` - The action to authorize
	///
	/// # Returns
	/// True if the action is authorized, false otherwise
	///
	/// # Errors
	/// Returns an error if authorization check fails
	async fn authorize_action(&self, user_id: UserId, action: Action) -> Result<bool>;

	/// Gets a user's permissions
	///
	/// # Arguments
	/// * `user_id` - The user to get permissions for
	///
	/// # Returns
	/// A list of the user's permissions
	///
	/// # Errors
	/// Returns an error if the user doesn't exist or access is denied
	async fn get_user_permissions(&self, user_id: UserId) -> Result<Vec<Permission>>;

	// Extension Data Operations

	/// Registers a new extension
	///
	/// # Arguments
	/// * `manifest` - The extension manifest
	///
	/// # Returns
	/// A unique extension identifier
	///
	/// # Errors
	/// Returns an error if registration fails or manifest is invalid
	async fn register_extension(&self, manifest: ExtensionManifest) -> Result<ExtensionId>;

	/// Gets extension metadata
	///
	/// # Arguments
	/// * `extension_id` - The extension to get metadata for
	///
	/// # Returns
	/// The extension metadata
	///
	/// # Errors
	/// Returns an error if the extension doesn't exist
	async fn get_extension_metadata(&self, extension_id: ExtensionId) -> Result<ExtensionMetadata>;

	/// Updates extension status
	///
	/// # Arguments
	/// * `extension_id` - The extension to update
	/// * `status` - The new status
	///
	/// # Errors
	/// Returns an error if the extension doesn't exist or update fails
	async fn update_extension_status(
		&self,
		extension_id: ExtensionId,
		status: ExtensionStatus,
	) -> Result<()>;
}
