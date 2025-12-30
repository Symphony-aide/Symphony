# F002 - Core Port Definitions - Design

**Feature ID**: F002  
**Design Date**: December 28, 2025  
**Architecture**: H2A2 (Harmonic Hexagonal Actor Architecture)  
**Implementation**: Async-first port traits with comprehensive error handling  

---

## System Architecture

### Port-Based Architecture Overview
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SYMPHONY CORE PORTS ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                         DOMAIN CORE LAYER                              │ │
│  │                    (Uses only port abstractions)                       │ │
│  │                                                                        │ │
│  │   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │ │
│  │   │  Orchestration  │  │    Workflow     │  │    Extension    │      │ │
│  │   │     Engine      │  │   Coordinator   │  │    Manager      │      │ │
│  │   └─────────┬───────┘  └─────────┬───────┘  └─────────┬───────┘      │ │
│  │             │                    │                    │                │ │
│  │             └────────────────────┼────────────────────┘                │ │
│  │                                  │                                     │ │
│  └──────────────────────────────────┼─────────────────────────────────────┘ │
│                                     │                                       │
│  ┌──────────────────────────────────┼─────────────────────────────────────┐ │
│  │                            PORT INTERFACES                              │ │
│  │                                  │                                      │ │
│  │  ┌──────────────┐ ┌─────────────┴─────────────┐ ┌──────────────┐      │ │
│  │  │TextEditing-  │ │        PitPort            │ │ Extension-   │      │ │
│  │  │    Port      │ │ (Pool, DAG, Artifact,     │ │    Port      │      │ │
│  │  │              │ │  Arbitration, Stale)      │ │              │      │ │
│  │  └──────┬───────┘ └─────────────┬─────────────┘ └──────┬───────┘      │ │
│  │         │                       │                      │                │ │
│  │  ┌──────┴───────┐ ┌─────────────┴─────────────┐ ┌──────┴───────┐      │ │
│  │  │ Conductor-   │ │      DataAccessPort       │ │    Mock      │      │ │
│  │  │    Port      │ │  (Pre-validation +        │ │ Implementations │   │ │
│  │  │              │ │   OFB Python)             │ │              │      │ │
│  │  └──────────────┘ └───────────────────────────┘ └──────────────┘      │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                        SUPPORTING SYSTEMS                               │ │
│  │                                                                         │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │ │
│  │  │ Domain Types │ │ Error System │ │ Binary Types │ │ Test Support │  │ │
│  │  │              │ │              │ │              │ │              │  │ │
│  │  │• BufferId    │ │• PortError   │ │• ProcessId   │ │• Mock Traits │  │ │
│  │  │• ViewId      │ │• SyncError   │ │• SyncEvent   │ │• Test Utils  │  │ │
│  │  │• ModelSpec   │ │• ValidationE │ │• BinaryState │ │• Fixtures    │  │ │
│  │  │• ExtensionId │ │• ContextError│ │• HealthCheck │ │• Scenarios   │  │ │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Module Design

### 1. Port Trait Definitions (`src/ports.rs`)

**MANDATORY**: You should compose them to apply SRP, but in these examples, just for demonstration

#### TextEditingPort - XI-editor Integration
```rust
#[async_trait]
pub trait TextEditingPort: Send + Sync {
    // Buffer Management
    // TextEditingPortBufferHelper::
    async fn create_buffer(&self, file_path: Option<PathBuf>) -> Result<BufferId, SymphonyError>;
    async fn close_buffer(&self, buffer_id: BufferId) -> Result<(), SymphonyError>;
    async fn get_buffer_content(&self, buffer_id: BufferId) -> Result<String, SymphonyError>;
    
    // Text Operations
    async fn insert_text(&self, buffer_id: BufferId, position: Position, text: &str) -> Result<(), SymphonyError>;
    async fn delete_text(&self, buffer_id: BufferId, range: Range) -> Result<(), SymphonyError>;
    async fn replace_text(&self, buffer_id: BufferId, range: Range, text: &str) -> Result<(), SymphonyError>;
    
    // File Operations
    async fn save_buffer(&self, buffer_id: BufferId) -> Result<(), SymphonyError>;
    async fn save_buffer_as(&self, buffer_id: BufferId, path: PathBuf) -> Result<(), SymphonyError>;
    async fn reload_buffer(&self, buffer_id: BufferId) -> Result<(), SymphonyError>;
    
    // View Management
    async fn create_view(&self, buffer_id: BufferId) -> Result<ViewId, SymphonyError>;
    async fn close_view(&self, view_id: ViewId) -> Result<(), SymphonyError>;
    async fn set_cursor(&self, view_id: ViewId, position: Position) -> Result<(), SymphonyError>;
    async fn set_selection(&self, view_id: ViewId, range: Range) -> Result<(), SymphonyError>;
    
    // Event Streaming
    async fn subscribe_to_events(&self) -> Result<EventStream<TextEditingEvent>, SymphonyError>;
}
```

#### PitPort - High-Performance Infrastructure
```rust
#[async_trait]
pub trait PitPort: Send + Sync {
    // Pool Manager Operations (50-100ns target)
    async fn allocate_model(&self, spec: ModelSpec) -> Result<ModelHandle, SymphonyError>;
    async fn deallocate_model(&self, handle: ModelHandle) -> Result<(), SymphonyError>;
    async fn get_model_status(&self, handle: ModelHandle) -> Result<ModelStatus, SymphonyError>;
    
    // DAG Tracker Operations
    async fn create_workflow(&self, definition: WorkflowDefinition) -> Result<WorkflowId, SymphonyError>;
    async fn execute_workflow(&self, workflow_id: WorkflowId, context: ExecutionContext) -> Result<WorkflowResult, SymphonyError>;
    async fn get_workflow_status(&self, workflow_id: WorkflowId) -> Result<WorkflowStatus, SymphonyError>;
    
    // Artifact Store Operations
    async fn store_artifact(&self, data: ArtifactData) -> Result<ArtifactId, SymphonyError>;
    async fn retrieve_artifact(&self, artifact_id: ArtifactId) -> Result<ArtifactData, SymphonyError>;
    async fn delete_artifact(&self, artifact_id: ArtifactId) -> Result<(), SymphonyError>;
    
    // Arbitration Engine Operations
    async fn submit_decision(&self, context: DecisionContext) -> Result<Decision, SymphonyError>;
    async fn get_policy(&self, policy_id: PolicyId) -> Result<Policy, SymphonyError>;
    
    // Stale Manager Operations
    async fn mark_stale(&self, resource_id: ResourceId) -> Result<(), SymphonyError>;
    async fn cleanup_stale(&self, threshold: Duration) -> Result<CleanupReport, SymphonyError>;
}
```

#### ExtensionPort - Extension Lifecycle Management
```rust
#[async_trait]
pub trait ExtensionPort: Send + Sync {
    // Extension Lifecycle
    async fn load_extension(&self, manifest: ExtensionManifest) -> Result<ExtensionId, SymphonyError>;
    async fn unload_extension(&self, extension_id: ExtensionId) -> Result<(), SymphonyError>;
    async fn activate_extension(&self, extension_id: ExtensionId) -> Result<(), SymphonyError>;
    async fn deactivate_extension(&self, extension_id: ExtensionId) -> Result<(), SymphonyError>;
    
    // Extension Communication
    async fn send_message(&self, extension_id: ExtensionId, message: ExtensionMessage) -> Result<ExtensionResponse, SymphonyError>;
    async fn broadcast_message(&self, message: ExtensionMessage) -> Result<Vec<ExtensionResponse>, SymphonyError>;
    
    // Extension Discovery
    async fn list_extensions(&self) -> Result<Vec<ExtensionInfo>, SymphonyError>;
    async fn get_extension_info(&self, extension_id: ExtensionId) -> Result<ExtensionInfo, SymphonyError>;
    
    // Process Management
    async fn get_extension_health(&self, extension_id: ExtensionId) -> Result<HealthStatus, SymphonyError>;
    async fn restart_extension(&self, extension_id: ExtensionId) -> Result<(), SymphonyError>;
}
```

#### ConductorPort - Python Integration Bridge
```rust
#[async_trait]
pub trait ConductorPort: Send + Sync {
    // Conductor Lifecycle
    async fn start_conductor(&self) -> Result<(), SymphonyError>;
    async fn stop_conductor(&self) -> Result<(), SymphonyError>;
    async fn get_conductor_status(&self) -> Result<ConductorStatus, SymphonyError>;
    
    // Decision Making
    async fn submit_decision(&self, context: DecisionContext) -> Result<Decision, SymphonyError>;
    async fn get_decision_history(&self, limit: usize) -> Result<Vec<DecisionRecord>, SymphonyError>;
    
    // Policy Management
    async fn update_policy(&self, policy: Policy) -> Result<(), SymphonyError>;
    async fn get_active_policies(&self) -> Result<Vec<Policy>, SymphonyError>;
    
    // Learning Integration
    async fn submit_feedback(&self, decision_id: DecisionId, feedback: Feedback) -> Result<(), SymphonyError>;
    async fn get_learning_metrics(&self) -> Result<LearningMetrics, SymphonyError>;
}
```

#### DataAccessPort - Two-Layer Data Architecture
```rust
#[async_trait]
pub trait DataAccessPort: Send + Sync {
    // Pre-validation Layer (Rust, <1ms)
    async fn pre_validate_workflow(&self, workflow: &WorkflowSpec) -> Result<(), SymphonyError>;
    async fn pre_validate_user(&self, user_data: &UserData) -> Result<(), SymphonyError>;
    async fn pre_validate_extension(&self, manifest: &ExtensionManifest) -> Result<(), SymphonyError>;
    
    // Authoritative Operations (OFB Python, single HTTP calls)
    async fn create_workflow(&self, workflow: WorkflowSpec) -> Result<WorkflowId, SymphonyError>;
    async fn get_workflow(&self, workflow_id: WorkflowId) -> Result<WorkflowSpec, SymphonyError>;
    async fn update_workflow(&self, workflow_id: WorkflowId, updates: WorkflowUpdates) -> Result<(), SymphonyError>;
    async fn delete_workflow(&self, workflow_id: WorkflowId) -> Result<(), SymphonyError>;
    
    // User Management (delegated to OFB Python)
    async fn authenticate_user(&self, credentials: UserCredentials) -> Result<UserSession, SymphonyError>;
    async fn authorize_action(&self, user_id: UserId, action: Action) -> Result<bool, SymphonyError>;
    async fn get_user_permissions(&self, user_id: UserId) -> Result<Vec<Permission>, SymphonyError>;
    
    // Extension Data Operations
    async fn register_extension(&self, manifest: ExtensionManifest) -> Result<ExtensionId, SymphonyError>;
    async fn get_extension_metadata(&self, extension_id: ExtensionId) -> Result<ExtensionMetadata, SymphonyError>;
    async fn update_extension_status(&self, extension_id: ExtensionId, status: ExtensionStatus) -> Result<(), SymphonyError>;
}
```

### 2. Domain Type System (`src/types.rs`)

#### Core Identifiers
```rust
// Strong typing for all identifiers
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct BufferId(pub Uuid);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct ViewId(pub Uuid);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct ModelId(pub Uuid);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct ExtensionId(pub Uuid);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct ProcessId(pub Uuid);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct WorkflowId(pub Uuid);
```

#### Specification Types
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelSpec {
    pub name: String,
    pub version: String,
    pub model_type: ModelType,
    pub resource_requirements: ResourceRequirements,
    pub configuration: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtensionManifest {
    pub name: String,
    pub version: String,
    pub extension_type: ExtensionType,
    pub permissions: Vec<Permission>,
    pub dependencies: Vec<Dependency>,
    pub entry_point: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowDefinition {
    pub name: String,
    pub version: String,
    pub steps: Vec<WorkflowStep>,
    pub dependencies: Vec<WorkflowDependency>,
    pub timeout: Duration,
}
```

#### Event Types
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TextEditingEvent {
    BufferCreated { buffer_id: BufferId, file_path: Option<PathBuf> },
    BufferModified { buffer_id: BufferId, changes: Vec<TextChange> },
    BufferSaved { buffer_id: BufferId, file_path: PathBuf },
    ViewCreated { view_id: ViewId, buffer_id: BufferId },
    CursorMoved { view_id: ViewId, position: Position },
    SelectionChanged { view_id: ViewId, range: Range },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SyncEvent {
    ProcessStarted { process_id: ProcessId, binary_type: BinaryType },
    ProcessStopped { process_id: ProcessId, exit_code: Option<i32> },
    StateChanged { component: String, state: serde_json::Value },
    HealthCheck { process_id: ProcessId, status: HealthStatus },
}
```

### 3. Error Handling System (`src/errors.rs`)

```rust
use thiserror::Error;
use sy_commons::SymphonyError;

#[derive(Error, Debug)]
pub enum PortError {
    #[error("Text editing operation failed: {message}")]
    TextEditingFailed { message: String },
    
    #[error("Pit operation failed: {operation} - {message}")]
    PitOperationFailed { operation: String, message: String },
    
    #[error("Extension operation failed: {extension_id} - {message}")]
    ExtensionOperationFailed { extension_id: ExtensionId, message: String },
    
    #[error("Conductor operation failed: {message}")]
    ConductorOperationFailed { message: String },
    
    #[error("Data access operation failed: {operation} - {message}")]
    DataAccessFailed { operation: String, message: String },
    
    #[error("Process communication failed: {process_id} - {message}")]
    ProcessCommunicationFailed { process_id: ProcessId, message: String },
    
    #[error("State synchronization failed: {component} - {message}")]
    SynchronizationError { component: String, message: String },
    
    #[error("Pre-validation failed: {field} - {message}")]
    PreValidationError { field: String, message: String },
    
    #[error("Authoritative validation failed: {message}")]
    AuthoritativeValidationError { message: String },
}

// Conversion to sy-commons::SymphonyError
impl From<PortError> for SymphonyError {
    fn from(err: PortError) -> Self {
        SymphonyError::PortOperation(err.to_string())
    }
}
```

### 4. Mock Implementations (`src/mocks.rs`)

```rust
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use async_trait::async_trait;

#[derive(Debug, Clone)]
pub struct MockTextEditingAdapter {
    buffers: Arc<Mutex<HashMap<BufferId, String>>>,
    views: Arc<Mutex<HashMap<ViewId, BufferId>>>,
    event_sender: Arc<Mutex<Option<tokio::sync::broadcast::Sender<TextEditingEvent>>>>,
}

impl MockTextEditingAdapter {
    pub fn new() -> Self {
        Self {
            buffers: Arc::new(Mutex::new(HashMap::new())),
            views: Arc::new(Mutex::new(HashMap::new())),
            event_sender: Arc::new(Mutex::new(None)),
        }
    }
    
    pub fn set_buffer_content(&self, buffer_id: BufferId, content: String) {
        self.buffers.lock().unwrap().insert(buffer_id, content);
    }
    
    pub fn simulate_error(&self, error_type: &str) {
        // Configure mock to return specific errors for testing
    }
}

#[async_trait]
impl TextEditingPort for MockTextEditingAdapter {
    async fn create_buffer(&self, file_path: Option<PathBuf>) -> Result<BufferId, SymphonyError> {
        let buffer_id = BufferId(Uuid::new_v4());
        self.buffers.lock().unwrap().insert(buffer_id, String::new());
        Ok(buffer_id)
    }
    
    async fn get_buffer_content(&self, buffer_id: BufferId) -> Result<String, SymphonyError> {
        self.buffers.lock().unwrap()
            .get(&buffer_id)
            .cloned()
            .ok_or_else(|| SymphonyError::PortOperation("Buffer not found".to_string()))
    }
    
    // ... implement all other methods with deterministic behavior
}
```

## Data Structures

### Position and Range Types
```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct Position {
    pub line: u32,
    pub column: u32,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct Range {
    pub start: Position,
    pub end: Position,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TextChange {
    pub range: Range,
    pub text: String,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}
```

### Resource and Status Types
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceRequirements {
    pub memory_mb: u64,
    pub cpu_cores: f32,
    pub gpu_memory_mb: Option<u64>,
    pub network_access: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum HealthStatus {
    Healthy,
    Degraded { message: String },
    Unhealthy { error: String },
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ExtensionType {
    Instrument,  // AI models
    Operator,    // Utilities
    Motif,       // UI enhancements
}
```

## Performance Considerations

### Async Trait Overhead
- **Expected Impact**: 1-2ns per trait method call due to vtable indirection
- **Mitigation**: Acceptable for port abstraction benefits
- **Monitoring**: Benchmark suite to detect performance regressions

### Memory Usage
- **Mock Storage**: In-memory HashMap storage for deterministic testing
- **Event Streaming**: Bounded channels to prevent memory leaks
- **Type Sizes**: Keep domain types small and efficient

### Error Handling Performance
- **Error Creation**: Use static strings where possible to avoid allocations
- **Error Propagation**: Minimize error chain depth
- **Context Preservation**: Balance detail with performance

## Error Handling Strategy

### Error Categories
1. **Technical Errors**: Network failures, serialization errors, resource exhaustion
2. **Business Logic Errors**: Validation failures, permission denied, resource not found
3. **System Errors**: Process crashes, communication failures, timeout errors

### Error Context Preservation
- Maintain error chains for debugging
- Include actionable error messages for users
- Preserve stack traces across async boundaries
- Log errors at appropriate levels using sy-commons logging

### Recovery Strategies
- **Transient Errors**: Automatic retry with exponential backoff
- **Permanent Errors**: Fail fast with clear error messages
- **Resource Errors**: Graceful degradation when possible

---

**Design Complete**: Ready for TESTING phase  
**Next Phase**: TESTING.md - Comprehensive testing strategy and implementation