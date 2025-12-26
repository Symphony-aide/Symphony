# F001: Core Port Definitions - Design

**Feature**: F001_core_port_definitions  
**Architecture Pattern**: Hexagonal Architecture (Ports & Adapters)  
**Design Complexity**: Medium

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SYMPHONY CORE PORTS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   PORT TRAIT DEFINITIONS                    ││
│  │                                                             ││
│  │   ┌─────────────────┐  ┌─────────────────┐                ││
│  │   │ TextEditingPort │  │    PitPort      │                ││
│  │   │                 │  │                 │                ││
│  │   │ + insert()      │  │ + allocate_     │                ││
│  │   │ + delete()      │  │   model()       │                ││
│  │   │ + get_content() │  │ + execute_dag_  │                ││
│  │   │ + undo/redo()   │  │   node()        │                ││
│  │   │ + subscribe()   │  │ + store_        │                ││
│  │   └─────────────────┘  │   artifact()    │                ││
│  │                        └─────────────────┘                ││
│  │                                                             ││
│  │   ┌─────────────────┐  ┌─────────────────┐                ││
│  │   │ ExtensionPort   │  │ ConductorPort   │                ││
│  │   │                 │  │                 │                ││
│  │   │ + load()        │  │ + submit_       │                ││
│  │   │ + unload()      │  │   decision()    │                ││
│  │   │ + invoke()      │  │ + report_       │                ││
│  │   │ + events()      │  │   reward()      │                ││
│  │   └─────────────────┘  │ + get_policy()  │                ││
│  │                        └─────────────────┘                ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    DOMAIN TYPES                             ││
│  │                                                             ││
│  │  BufferId • ModelSpec • ExtensionId • ExtensionManifest    ││
│  │  ModelHandle • ArtifactId • DecisionContext • Policy       ││
│  │  BufferEvent • NodeResult • ExtensionEvent • Decision      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    ERROR HANDLING                           ││
│  │                                                             ││
│  │  PortError::OperationFailed                                ││
│  │  PortError::NotFound                                       ││
│  │  PortError::PermissionDenied                               ││
│  │  PortError::Timeout                                        ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                  MOCK IMPLEMENTATIONS                       ││
│  │                                                             ││
│  │  MockTextEditingAdapter • MockPitAdapter                   ││
│  │  MockExtensionAdapter • MockConductorAdapter               ││
│  │                                                             ││
│  │  (In-memory HashMap-based with configurable behavior)      ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Module Design

### Core Ports Module (`src/ports.rs`)

```rust
use async_trait::async_trait;
use tokio::sync::broadcast;
use std::ops::Range;

/// Core editing operations port (Xi-editor abstraction)
#[async_trait]
pub trait TextEditingPort: Send + Sync {
    /// Insert text at the specified position
    async fn insert(&self, buffer_id: BufferId, pos: usize, text: &str) -> Result<Revision, PortError>;
    
    /// Delete text in the specified range
    async fn delete(&self, buffer_id: BufferId, range: Range<usize>) -> Result<Revision, PortError>;
    
    /// Get the current content of a buffer
    async fn get_content(&self, buffer_id: BufferId) -> Result<RopeSlice, PortError>;
    
    /// Undo the last operation
    async fn undo(&self, buffer_id: BufferId) -> Result<Revision, PortError>;
    
    /// Redo the last undone operation
    async fn redo(&self, buffer_id: BufferId) -> Result<Revision, PortError>;
    
    /// Subscribe to buffer events
    fn subscribe(&self, buffer_id: BufferId) -> broadcast::Receiver<BufferEvent>;
}

/// High-performance Pit operations port
#[async_trait]
pub trait PitPort: Send + Sync {
    /// Allocate an AI model with the given specification
    async fn allocate_model(&self, spec: ModelSpec) -> Result<ModelHandle, PortError>;
    
    /// Release a previously allocated model
    async fn release_model(&self, handle: ModelHandle) -> Result<(), PortError>;
    
    /// Execute a single DAG node
    async fn execute_dag_node(&self, node: DagNode) -> Result<NodeResult, PortError>;
    
    /// Store an artifact in the content-addressable store
    async fn store_artifact(&self, content: ArtifactContent) -> Result<ArtifactId, PortError>;
    
    /// Resolve a conflict using the arbitration engine
    async fn resolve_conflict(&self, conflict: Conflict) -> Result<Resolution, PortError>;
}

/// Extension lifecycle and communication port
#[async_trait]
pub trait ExtensionPort: Send + Sync {
    /// Load an extension from its manifest
    async fn load(&self, manifest: ExtensionManifest) -> Result<ExtensionId, PortError>;
    
    /// Unload a previously loaded extension
    async fn unload(&self, id: ExtensionId) -> Result<(), PortError>;
    
    /// Invoke an extension method
    async fn invoke(&self, id: ExtensionId, request: Request) -> Result<Response, PortError>;
    
    /// Get event stream for an extension
    fn events(&self, id: ExtensionId) -> broadcast::Receiver<ExtensionEvent>;
}

/// Python Conductor bridge port
#[async_trait]
pub trait ConductorPort: Send + Sync {
    /// Submit a decision context to the Conductor for AI-driven decision making
    async fn submit_decision(&self, context: DecisionContext) -> Result<Decision, PortError>;
    
    /// Report reward for reinforcement learning
    async fn report_reward(&self, episode: EpisodeId, reward: f64) -> Result<(), PortError>;
    
    /// Get the current policy for a given context
    async fn get_policy(&self, context: &PolicyContext) -> Result<Policy, PortError>;
}
```

### Domain Types Module (`src/types.rs`)

```rust
use uuid::Uuid;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Buffer identifier for text editing operations
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct BufferId(pub Uuid);

impl BufferId {
    pub fn new() -> Self {
        Self(Uuid::new_v4())
    }
}

/// Model specification for AI model allocation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelSpec {
    pub model_id: String,
    pub version: Option<String>,
    pub config: HashMap<String, serde_json::Value>,
    pub resource_limits: ResourceLimits,
}

/// Resource limits for model allocation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceLimits {
    pub max_memory_mb: Option<u64>,
    pub max_cpu_cores: Option<u32>,
    pub timeout_seconds: Option<u64>,
}

/// Handle to an allocated AI model
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct ModelHandle(pub Uuid);

/// Extension identifier
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct ExtensionId(pub String);

/// Extension manifest
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtensionManifest {
    pub id: String,
    pub name: String,
    pub version: semver::Version,
    pub extension_type: ExtensionType,
    pub permissions: Vec<Permission>,
    pub dependencies: Vec<Dependency>,
}

/// Extension type classification
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ExtensionType {
    Instrument,  // AI/ML models
    Operator,    // Workflow utilities
    Motif,       // UI enhancements
}

/// Permission declaration for extensions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Permission {
    pub name: String,
    pub description: String,
    pub required: bool,
}

/// Extension dependency
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Dependency {
    pub id: String,
    pub version_req: semver::VersionReq,
    pub optional: bool,
}

/// Buffer event for text editing subscriptions
#[derive(Debug, Clone)]
pub enum BufferEvent {
    TextInserted { pos: usize, text: String },
    TextDeleted { range: Range<usize> },
    BufferSaved,
    BufferClosed,
}

/// Extension event for extension subscriptions
#[derive(Debug, Clone)]
pub enum ExtensionEvent {
    Loaded,
    Activated,
    Deactivated,
    Unloaded,
    Error { message: String },
}
```

### Error Handling Module (`src/errors.rs`)

```rust
use thiserror::Error;
use std::time::Duration;

/// Core error types for all ports
#[derive(Debug, Error)]
pub enum PortError {
    #[error("Operation failed: {message}")]
    OperationFailed { message: String },
    
    #[error("Resource not found: {resource}")]
    NotFound { resource: String },
    
    #[error("Permission denied: {operation}")]
    PermissionDenied { operation: String },
    
    #[error("Timeout occurred after {duration:?}")]
    Timeout { duration: Duration },
    
    #[error("Invalid input: {details}")]
    InvalidInput { details: String },
    
    #[error("Resource exhausted: {resource}")]
    ResourceExhausted { resource: String },
    
    #[error("Internal error: {source}")]
    Internal { source: Box<dyn std::error::Error + Send + Sync> },
}

impl PortError {
    pub fn operation_failed(message: impl Into<String>) -> Self {
        Self::OperationFailed { message: message.into() }
    }
    
    pub fn not_found(resource: impl Into<String>) -> Self {
        Self::NotFound { resource: resource.into() }
    }
    
    pub fn permission_denied(operation: impl Into<String>) -> Self {
        Self::PermissionDenied { operation: operation.into() }
    }
    
    pub fn timeout(duration: Duration) -> Self {
        Self::Timeout { duration }
    }
}

/// Result type alias for port operations
pub type PortResult<T> = Result<T, PortError>;
```

## Data Structures

### Buffer Management
- **BufferId**: UUID-based unique identifier for text buffers
- **Revision**: Monotonic counter for tracking buffer changes
- **RopeSlice**: Reference to rope-based text content (from xi-rope)

### Model Management  
- **ModelSpec**: Complete specification for AI model allocation
- **ModelHandle**: Opaque handle to allocated model instance
- **ResourceLimits**: Constraints for model resource usage

### Extension System
- **ExtensionManifest**: Complete extension metadata and requirements
- **Permission**: Granular capability declarations
- **Dependency**: Version-constrained extension dependencies

## Error Handling Strategy

### Error Categories
1. **OperationFailed**: Recoverable operation failures
2. **NotFound**: Missing resources (buffers, models, extensions)
3. **PermissionDenied**: Security policy violations
4. **Timeout**: Operation exceeded time limits
5. **InvalidInput**: Malformed input data
6. **ResourceExhausted**: System resource limits exceeded
7. **Internal**: Unexpected system errors

### Error Propagation
- All port methods return `Result<T, PortError>`
- Errors include contextual information for debugging
- Error conversion traits for seamless error propagation
- Structured error data for programmatic handling

### Failure Modes
- **Network failures**: Handled by transport layer, not ports
- **Serialization failures**: Converted to InvalidInput errors
- **Resource allocation failures**: Mapped to ResourceExhausted
- **Permission violations**: Explicit PermissionDenied errors

## Performance Considerations

### Async Design
- All port methods are async to prevent blocking
- Uses `#[async_trait]` for clean API design
- Minimal async overhead (~10-50ns per call)

### Memory Management
- Zero-copy where possible (RopeSlice references)
- Efficient UUID-based identifiers
- Minimal heap allocations in hot paths

### Trait Object Overhead
- Acceptable 1-2ns vtable dispatch cost
- Enables runtime polymorphism for adapters
- Alternative: compile-time generics (more complex)

### Mock Performance
- In-memory HashMap operations (<1μs)
- Deterministic behavior for testing
- Configurable delays for timeout testing

## Testing Strategy

### Unit Tests
```rust
#[tokio::test]
async fn test_text_editing_port_insert() {
    let mock = MockTextEditingAdapter::new();
    let buffer_id = BufferId::new();
    
    let result = mock.insert(buffer_id, 0, "Hello").await;
    assert!(result.is_ok());
}
```

### Property Tests
```rust
use proptest::prelude::*;

proptest! {
    #[test]
    fn buffer_id_roundtrip(id in any::<Uuid>()) {
        let buffer_id = BufferId(id);
        let serialized = serde_json::to_string(&buffer_id).unwrap();
        let deserialized: BufferId = serde_json::from_str(&serialized).unwrap();
        prop_assert_eq!(buffer_id, deserialized);
    }
}
```

### Integration Tests
- Mock adapter behavior validation
- Error handling across port boundaries
- Async runtime integration
- Event subscription mechanisms