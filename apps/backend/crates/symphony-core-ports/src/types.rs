//! Domain types and data structures for Symphony's core ports
//!
//! This module defines all the domain-specific types used across Symphony's port interfaces.
//! These types provide strong typing and ensure type safety across the entire system.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::time::Duration;
use uuid::Uuid;

/// Buffer identifier for text editing operations
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct BufferId(pub Uuid);

/// View identifier for text editing views
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct ViewId(pub Uuid);

/// Model identifier for AI models
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct ModelId(pub Uuid);

/// Extension identifier
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct ExtensionId(pub Uuid);

/// Process identifier for binary processes
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct ProcessId(pub Uuid);

/// Workflow identifier
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct WorkflowId(pub Uuid);

/// Model handle for allocated models
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct ModelHandle(pub Uuid);

/// Artifact identifier for stored artifacts
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct ArtifactId(pub Uuid);

/// Policy identifier for arbitration policies
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct PolicyId(pub Uuid);

/// Resource identifier for stale management
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct ResourceId(pub Uuid);

/// Decision identifier for conductor decisions
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct DecisionId(pub Uuid);

/// User identifier for data access
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct UserId(pub Uuid);

/// Position in a text buffer
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct Position {
	/// Line number (0-based)
	pub line: u32,
	/// Column number (0-based)
	pub column: u32,
}
/// Range in a text buffer
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct Range {
	/// Start position (inclusive)
	pub start: Position,
	/// End position (exclusive)
	pub end: Position,
}

/// Text change in a buffer
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TextChange {
	/// Range of the change
	pub range: Range,
	/// New text content
	pub text: String,
	/// Timestamp of the change
	pub timestamp: chrono::DateTime<chrono::Utc>,
}

/// Resource requirements for models and extensions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceRequirements {
	/// Memory requirement in MB
	pub memory_mb: u64,
	/// CPU cores required
	pub cpu_cores: f32,
	/// GPU memory requirement in MB (optional)
	pub gpu_memory_mb: Option<u64>,
	/// Whether network access is required
	pub network_access: bool,
}

/// Health status of a component
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum HealthStatus {
	/// Component is healthy
	Healthy,
	/// Component is degraded but functional
	Degraded { message: String },
	/// Component is unhealthy
	Unhealthy { error: String },
	/// Health status is unknown
	Unknown,
}

/// Type of extension
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ExtensionType {
	/// AI/ML model extension
	Instrument,
	/// Workflow utility extension
	Operator,
	/// UI enhancement extension
	Motif,
}

/// Type of AI model
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ModelType {
	/// Language model
	Language,
	/// Vision model
	Vision,
	/// Audio model
	Audio,
	/// Multimodal model
	Multimodal,
	/// Custom model type
	Custom,
}

/// Status of an allocated model
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ModelStatus {
	/// Model is loading
	Loading,
	/// Model is ready for use
	Ready,
	/// Model is busy processing
	Busy,
	/// Model has failed
	Failed,
	/// Model is being deallocated
	Deallocating,
}
/// Binary type for process identification
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum BinaryType {
	/// Symphony main binary
	Symphony,
	/// XI-editor binary
	XiEditor,
}

/// Permission type for extensions
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Permission {
	/// Read file system access
	FileRead,
	/// Write file system access
	FileWrite,
	/// Network access
	NetworkAccess,
	/// System command execution
	SystemExec,
	/// Inter-process communication
	IpcAccess,
}

/// Extension dependency specification
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Dependency {
	/// Name of the dependency
	pub name: String,
	/// Version requirement
	pub version: String,
	/// Whether the dependency is optional
	pub optional: bool,
}

/// Model specification for allocation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelSpec {
	/// Model name
	pub name: String,
	/// Model version
	pub version: String,
	/// Type of model
	pub model_type: ModelType,
	/// Resource requirements
	pub resource_requirements: ResourceRequirements,
	/// Model configuration parameters
	pub configuration: HashMap<String, serde_json::Value>,
}

/// Extension manifest
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtensionManifest {
	/// Extension name
	pub name: String,
	/// Extension version
	pub version: String,
	/// Type of extension
	pub extension_type: ExtensionType,
	/// Required permissions
	pub permissions: Vec<Permission>,
	/// Dependencies
	pub dependencies: Vec<Dependency>,
	/// Entry point file
	pub entry_point: String,
}

/// Workflow step definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowStep {
	/// Step name
	pub name: String,
	/// Step type
	pub step_type: String,
	/// Step configuration
	pub configuration: HashMap<String, serde_json::Value>,
}

/// Workflow dependency
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowDependency {
	/// Source step name
	pub from: String,
	/// Target step name
	pub to: String,
	/// Dependency type
	pub dependency_type: String,
}
/// Workflow definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowDefinition {
	/// Workflow name
	pub name: String,
	/// Workflow version
	pub version: String,
	/// Workflow steps
	pub steps: Vec<WorkflowStep>,
	/// Workflow dependencies
	pub dependencies: Vec<WorkflowDependency>,
	/// Execution timeout
	pub timeout: Duration,
}

/// Workflow specification for data access
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowSpec {
	/// Workflow name
	pub name: String,
	/// Workflow description
	pub description: String,
	/// Workflow steps
	pub steps: Vec<WorkflowStep>,
	/// Execution timeout
	pub timeout: Duration,
}

/// Workflow status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum WorkflowStatus {
	/// Workflow is pending execution
	Pending,
	/// Workflow is running
	Running,
	/// Workflow is paused
	Paused,
	/// Workflow completed successfully
	Completed,
	/// Workflow failed
	Failed,
	/// Workflow was cancelled
	Cancelled,
}

/// Workflow result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowResult {
	/// Workflow ID
	pub workflow_id: WorkflowId,
	/// Final status
	pub status: WorkflowStatus,
	/// Result data
	pub data: HashMap<String, serde_json::Value>,
	/// Execution duration
	pub duration: Duration,
}

/// Artifact data for storage
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArtifactData {
	/// Binary content
	pub content: Vec<u8>,
	/// Content type
	pub content_type: String,
	/// Metadata
	pub metadata: HashMap<String, String>,
}

/// Execution context for workflows
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionContext {
	/// Context variables
	pub variables: HashMap<String, serde_json::Value>,
	/// User ID executing the workflow
	pub user_id: Option<UserId>,
	/// Execution timeout
	pub timeout: Option<Duration>,
}

/// Decision context for conductor
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DecisionContext {
	/// Context type
	pub context_type: String,
	/// Context data
	pub data: HashMap<String, serde_json::Value>,
	/// Available options
	pub options: Vec<String>,
}

/// Decision made by conductor
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Decision {
	/// Decision ID
	pub id: DecisionId,
	/// Selected option
	pub choice: String,
	/// Confidence score (0.0 to 1.0)
	pub confidence: f64,
	/// Reasoning
	pub reasoning: Option<String>,
}
/// Policy for arbitration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Policy {
	/// Policy ID
	pub id: PolicyId,
	/// Policy name
	pub name: String,
	/// Policy rules
	pub rules: HashMap<String, serde_json::Value>,
}

/// Conductor status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ConductorStatus {
	/// Conductor is stopped
	Stopped,
	/// Conductor is starting
	Starting,
	/// Conductor is running
	Running,
	/// Conductor is stopping
	Stopping,
	/// Conductor has failed
	Failed,
}

/// Extension information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtensionInfo {
	/// Extension ID
	pub id: ExtensionId,
	/// Extension name
	pub name: String,
	/// Extension version
	pub version: String,
	/// Extension type
	pub extension_type: ExtensionType,
	/// Extension status
	pub status: ExtensionStatus,
}

/// Extension status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ExtensionStatus {
	/// Extension is loaded but not active
	Loaded,
	/// Extension is active
	Active,
	/// Extension is inactive
	Inactive,
	/// Extension has failed
	Failed,
}

/// Extension message for communication
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtensionMessage {
	/// Message type
	pub message_type: String,
	/// Message payload
	pub payload: serde_json::Value,
}

/// Extension response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtensionResponse {
	/// Response from extension ID
	pub extension_id: ExtensionId,
	/// Response payload
	pub payload: serde_json::Value,
	/// Whether the response indicates success
	pub success: bool,
}

/// User credentials for authentication
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserCredentials {
	/// Username
	pub username: String,
	/// Password (should be hashed)
	pub password: String,
}

/// User session information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserSession {
	/// Session ID
	pub session_id: String,
	/// User ID
	pub user_id: UserId,
	/// Session expiry
	pub expires_at: chrono::DateTime<chrono::Utc>,
}

/// User data for validation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserData {
	/// Username
	pub username: String,
	/// Email address
	pub email: String,
	/// Additional user properties
	pub properties: HashMap<String, serde_json::Value>,
}

/// Action for authorization
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Action {
	/// Action type
	pub action_type: String,
	/// Resource being acted upon
	pub resource: String,
	/// Additional context
	pub context: HashMap<String, serde_json::Value>,
}
/// Workflow updates for modification
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowUpdates {
	/// New name (optional)
	pub name: Option<String>,
	/// New description (optional)
	pub description: Option<String>,
	/// New steps (optional)
	pub steps: Option<Vec<WorkflowStep>>,
	/// New timeout (optional)
	pub timeout: Option<Duration>,
}

/// Extension metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtensionMetadata {
	/// Extension ID
	pub id: ExtensionId,
	/// Metadata properties
	pub metadata: HashMap<String, serde_json::Value>,
	/// Last updated timestamp
	pub updated_at: chrono::DateTime<chrono::Utc>,
}

/// Cleanup report from stale manager
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanupReport {
	/// Number of items cleaned up
	pub items_cleaned: u64,
	/// Total size freed in bytes
	pub bytes_freed: u64,
	/// Cleanup duration
	pub duration: Duration,
}

/// Decision record for history
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DecisionRecord {
	/// Decision ID
	pub id: DecisionId,
	/// Decision context
	pub context: DecisionContext,
	/// Decision made
	pub decision: Decision,
	/// Timestamp
	pub timestamp: chrono::DateTime<chrono::Utc>,
}

/// Feedback for conductor learning
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Feedback {
	/// Decision ID this feedback is for
	pub decision_id: DecisionId,
	/// Feedback score (-1.0 to 1.0)
	pub score: f64,
	/// Optional feedback message
	pub message: Option<String>,
}

/// Learning metrics from conductor
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LearningMetrics {
	/// Total decisions made
	pub total_decisions: u64,
	/// Average confidence score
	pub average_confidence: f64,
	/// Success rate (0.0 to 1.0)
	pub success_rate: f64,
	/// Learning rate
	pub learning_rate: f64,
}

/// Text editing events
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TextEditingEvent {
	/// Buffer was created
	BufferCreated {
		buffer_id: BufferId,
		file_path: Option<PathBuf>,
	},
	/// Buffer was modified
	BufferModified {
		buffer_id: BufferId,
		changes: Vec<TextChange>,
	},
	/// Buffer was saved
	BufferSaved {
		buffer_id: BufferId,
		file_path: PathBuf,
	},
	/// View was created
	ViewCreated {
		view_id: ViewId,
		buffer_id: BufferId,
	},
	/// Cursor moved
	CursorMoved { view_id: ViewId, position: Position },
	/// Selection changed
	SelectionChanged { view_id: ViewId, range: Range },
}

/// Binary synchronization events
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SyncEvent {
	/// Process started
	ProcessStarted {
		process_id: ProcessId,
		binary_type: BinaryType,
	},
	/// Process stopped
	ProcessStopped {
		process_id: ProcessId,
		exit_code: Option<i32>,
	},
	/// State changed
	StateChanged {
		component: String,
		state: serde_json::Value,
	},
	/// Health check
	HealthCheck {
		process_id: ProcessId,
		status: HealthStatus,
	},
}

/// Event stream type alias
pub type EventStream<T> = tokio::sync::broadcast::Receiver<T>;
