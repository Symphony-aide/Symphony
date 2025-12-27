# M1: Core Infrastructure - Level 2 Decomposition

> **Parent**: [MILESTONES_LEVEL1.md](../MILESTONES_LEVEL1.md)
> **Duration**: 4-5 months (Updated with Data Layer)
> **Goal**: Build the foundational communication and integration systems with two-layer data architecture  
> **PREREQUISITE**: M1.0 sy-commons Foundation MUST be complete before any M1 development

---

## 🚨 CRITICAL DEPENDENCY: sy-commons Foundation

**Core Rule**: "Common First" - Any functionality that can be shared across crates MUST be implemented in sy-commons first.

**All M1 sub-milestones MUST**:
- Use sy-commons::SymphonyError for ALL error handling
- Use sy-commons logging system for ALL logging
- Use sy-commons configuration system for ALL configuration
- Use sy-commons filesystem utilities for ALL file operations
- Use sy-commons pre-validation helpers for ALL technical validation
- Include sy-commons as dependency in ALL Cargo.toml files

---

## 📖 Glossary

| Term | Definition |
|------|------------|
| **OFB Python** | Out of Boundary Python - refers to Python API components that handle authoritative validation, RBAC, and data persistence outside the Rust boundary |
| **Pre-validation** | Lightweight technical validation in Rust to prevent unnecessary HTTP requests (NOT business logic) |
| **Authoritative Validation** | Complete validation including RBAC, business rules, and data constraints performed by OFB Python |
| **Two-Layer Architecture** | Rust (orchestration + pre-validation) + OFB Python (validation + persistence) |
| **H2A2** | Harmonic Hexagonal Actor Architecture |
| **IPC** | Inter-Process Communication |
| **Port** | Interface abstraction in hexagonal architecture |
| **Adapter** | Concrete implementation of a port interface |
| **Mock-Based Contract Testing** | Testing approach using mock implementations to verify trait contracts and format validation without external dependencies |
| **WireMock Contract Verification** | Integration testing using WireMock to verify HTTP request/response format matches OFB Python API expectations |
| **Three-Layer Testing** | Unit tests (mocks), Integration tests (WireMock), Pre-validation tests (performance + logic) |

---

## 📋 Overview

M1 establishes the Hexagonal Architecture foundation and communication backbone for Symphony's AIDE layer according to the H2A2 architecture. Every component depends on this infrastructure for port definitions, message passing, cross-language integration, and extension management.

```
M1: Core Infrastructure
├── M1.0: sy-commons Foundation (PREREQUISITE)
│   ├── M1.0.1: SymphonyError Base Error Type
│   ├── M1.0.2: Professional Logging System (tracing-based)
│   ├── M1.0.3: Environment Configuration (TOML + Figment)
│   ├── M1.0.4: Safe Filesystem Utilities
│   ├── M1.0.5: Pre-validation Rule Helpers
│   ├── M1.0.6: Duck Debugging Utilities
│   ├── M1.0.7: Complete lib.rs Guide
│   └── M1.0.8: Co-located Tests for All Functions
├── M1.1: Environment Setup & Port Definitions
│   ├── M1.1.1: Port Interface Definitions
│   ├── M1.1.2: Development Environment Setup
│   ├── M1.1.3: Domain Types & Errors
│   ├── M1.1.4: Mock Adapters for Testing
│   └── M1.1.5: Architecture Documentation
├── M1.2: Two-Binary Architecture Implementation (NEW)
│   ├── M1.2.1: Symphony Binary Structure
│   ├── M1.2.2: XI-editor Binary Structure
│   ├── M1.2.3: Process Lifecycle Management
│   ├── M1.2.4: Health Monitoring System
│   └── M1.2.5: Binary Synchronization Framework
├── M1.3: IPC Protocol & Serialization
│   ├── M1.3.1: Message Envelope Design
│   ├── M1.3.2: MessagePack Serialization
│   ├── M1.3.3: Bincode Serialization
│   ├── M1.3.4: Schema Validation
│   ├── M1.3.5: Message Registry
│   ├── M1.3.6: JSON-RPC Protocol (NEW)
│   ├── M1.3.7: XI-editor Message Types (NEW)
│   ├── M1.3.8: Pretty Printer
│   └── M1.3.9: Property Tests
├── M1.4: Transport Layer
│   ├── M1.4.1: Transport Trait
│   ├── M1.4.2: Unix Socket Transport
│   ├── M1.4.3: Named Pipe Transport
│   ├── M1.4.4: Shared Memory Transport
│   ├── M1.4.5: Stdio Transport (NEW)
│   ├── M1.4.6: Connection Pooling
│   ├── M1.4.7: Reconnection Logic
│   └── M1.4.8: Transport Tests
├── M1.5: Message Bus Core
│   ├── M1.5.1: Async Message Handler
│   ├── M1.5.2: Routing Engine
│   ├── M1.5.3: Endpoint Registration
│   ├── M1.5.4: Request/Response Correlation
│   ├── M1.5.5: Pub/Sub System
│   ├── M1.5.6: Health Monitoring
│   ├── M1.5.7: Binary Coordination (NEW)
│   ├── M1.5.8: XI-editor Bridge (NEW)
│   ├── M1.5.9: Message Batching
│   └── M1.5.10: Load Tests
├── M1.6: Python-Rust Bridge
│   ├── M1.6.1: PyO3 Setup
│   ├── M1.6.2: Primitive Conversions
│   ├── M1.6.3: Collection Conversions
│   ├── M1.6.4: Error Conversion
│   ├── M1.6.5: Async Support
│   ├── M1.6.6: IPC Bus API
│   ├── M1.6.7: Conductor Subprocess Management (NEW)
│   ├── M1.6.8: Direct Pit Access (NEW)
│   ├── M1.6.9: Python Tests
│   └── M1.6.10: Benchmarks
├── M1.7: Extension SDK Foundation
│   ├── M1.7.1: Manifest Schema
│   ├── M1.7.2: Manifest Parser
│   ├── M1.7.3: Lifecycle Trait
│   ├── M1.7.4: Permission Declaration
│   ├── M1.7.5: Extension Trait
│   ├── M1.7.6: Derive Macros
│   ├── M1.7.7: Actor-Based Isolation (NEW)
│   ├── M1.7.8: Extension Process Management (NEW)
│   ├── M1.7.9: Pretty Printer
│   └── M1.7.10: Property Tests
├── M1.8: Concrete Adapters Implementation (NEW)
│   ├── M1.8.1: XiEditorAdapter Implementation
│   ├── M1.8.2: PitAdapter Implementation
│   ├── M1.8.3: ActorExtensionAdapter Implementation
│   ├── M1.8.4: PythonConductorAdapter Implementation
│   ├── M1.8.5: Adapter Integration Tests
│   └── M1.8.6: Performance Validation
├── M1.9: Domain Core Orchestration (NEW)
│   ├── M1.9.1: SymphonyCore Implementation
│   ├── M1.9.2: State Synchronization
│   ├── M1.9.3: Event Streaming
│   ├── M1.9.4: Process Lifecycle Management
│   ├── M1.9.5: Workflow Coordination
│   └── M1.9.6: End-to-End Integration Tests
├── M1.10: Tauri Integration Layer (NEW)
│   ├── M1.10.1: Tauri Command Definitions
│   ├── M1.10.2: State Management Integration
│   ├── M1.10.3: Error Handling & Type Conversion
│   ├── M1.10.4: Event Streaming to Frontend
│   ├── M1.10.5: Frontend-Backend Synchronization
│   └── M1.10.6: Tauri Integration Tests
└── M1.11: Actor Layer Implementation (NEW)
    ├── M1.11.1: Actor Trait Implementation
    ├── M1.11.2: Process Spawning & Management
    ├── M1.11.3: Message Passing System
    ├── M1.11.4: Process Isolation & Sandboxing
    ├── M1.11.5: Crash Detection & Recovery
    └── M1.11.6: Actor System Tests
```

---

## 🚨 M1.0: sy-commons Foundation (PREREQUISITE)

**Crate**: `sy-commons`  
**Priority**: 🔴 Critical - PREREQUISITE for ALL Symphony development  
**Dependencies**: None

**Core Rule**: "Common First" - Any functionality that can be shared across crates MUST be implemented in sy-commons first.

### Crate Structure
```
apps/backend/crates/utils/sy-commons/
├── Cargo.toml
├── src/
│   ├── lib.rs           # Complete functionality guide + re-exports
│   ├── error.rs         # SymphonyError - base error for ALL crates
│   ├── logging.rs       # Professional logging (tracing-based)
│   ├── config.rs        # Environment configuration (TOML + Figment)
│   ├── filesystem.rs    # Safe filesystem utilities
│   ├── prevalidation.rs # Pre-validation rule helpers
│   └── debug.rs         # Duck debugging utilities
```

### Implementation Tasks

#### M1.0.1: SymphonyError Base Error Type
- [ ] Define SymphonyError enum with Validation, IO, Serialization, Generic variants
- [ ] Implement From traits for common error types
- [ ] Add context support with ResultContext trait
- [ ] Create error categorization system
- [ ] Write comprehensive error tests

##### Professional Logging System (tracing-based)
- [ ] Integrate tracing and tracing-subscriber
- [ ] Implement Console output formatter
- [ ] Implement File output with rotation
- [ ] Implement JSON output for cloud analysis
- [ ] Create LoggingConfig structure
- [ ] Add init_logging function
- [ ] Re-export logging macros (info!, warn!, error!)
- [ ] Write logging integration tests

##### Environment Configuration (TOML + Figment)
- [ ] Create Config structure with Deserialize
- [ ] Implement load_config function using Figment
- [ ] Support default.toml, test.toml, production.toml
- [ ] Create type-safe configuration parsing
- [ ] Write configuration tests for all TOML files

####  Safe Filesystem Utilities [use powerful crate if needed]
- [ ] Implement safe file reading with error handling
- [ ] Implement Option for platform dirs `use directories::ProjectDirs;`
- [ ] Implement safe file writing with atomic operations
- [ ] Add directory creation utilities
- [ ] Add file existence checking
- [ ] Implement path validation utilities
- [ ] Create filesystem operation tests

#### Pre-validation Rule Helpers
- [ ] Define PreValidationRule trait
- [ ] Implement common validation rules (non-empty, format, size)
- [ ] Create rule composition utilities
- [ ] Add performance-optimized validation (<1ms)
- [ ] Write pre-validation performance tests

#### Duck Debugging Utilities
- [ ] Implement duck! macro for temporary debugging
- [ ] Add searchable format with [DUCK DEBUGGING] prefix
- [ ] Write duck debugging tests

#### Complete lib.rs Guide
- [ ] Document all public APIs with examples
- [ ] Create comprehensive usage guide
- [ ] Add re-exports for all public functionality
- [ ] Write documentation tests

### Success Criteria
- [ ] All public functions have co-located tests
- [ ] SymphonyError is the base error for all error types
- [ ] Logging supports Console, File, and JSON outputs
- [ ] Configuration parsing works with all three TOML files
- [ ] Filesystem utilities are safe and convenient
- [ ] Pre-validation helpers support simple rule validation
- [ ] duck!() macro is re-exported and functional
- [ ] lib.rs serves as complete functionality guide
- [ ] OCP principles are followed (extensible but not modifiable)
- [ ] ALL other Symphony crates can depend on sy-commons

---

## 🏗️ M1.1: Environment Setup & Port Definitions

**Crate**: `symphony-core-ports`
**Duration**: 2 weeks
**Dependencies**: M1.0 (sy-commons Foundation)

**Goal**: Establish the Hexagonal Architecture foundation with port definitions and development environment setup according to H2A2 architecture.

### M1.1.1: Port Interface Definitions (3 days)

**Goal**: Define the core port interfaces for Hexagonal Architecture as specified in H2A2

**Deliverables**:
```rust
// src/ports.rs

/// Core editing operations port (Xi-editor abstraction)
#[async_trait]
pub trait TextEditingPort: Send + Sync {
    async fn insert(&self, buffer_id: BufferId, pos: usize, text: &str) -> Result<Revision>;
    async fn delete(&self, buffer_id: BufferId, range: Range<usize>) -> Result<Revision>;
    async fn get_content(&self, buffer_id: BufferId) -> Result<RopeSlice>;
    async fn undo(&self, buffer_id: BufferId) -> Result<Revision>;
    async fn redo(&self, buffer_id: BufferId) -> Result<Revision>;
    fn subscribe(&self, buffer_id: BufferId) -> Receiver<BufferEvent>;
}

/// High-performance Pit operations port
#[async_trait]
pub trait PitPort: Send + Sync {
    async fn allocate_model(&self, spec: ModelSpec) -> Result<ModelHandle>;
    async fn release_model(&self, handle: ModelHandle) -> Result<()>;
    async fn execute_dag_node(&self, node: DagNode) -> Result<NodeResult>;
    async fn store_artifact(&self, content: ArtifactContent) -> Result<ArtifactId>;
    async fn resolve_conflict(&self, conflict: Conflict) -> Result<Resolution>;
}

/// Extension lifecycle and communication port
#[async_trait]
pub trait ExtensionPort: Send + Sync {
    async fn load(&self, manifest: ExtensionManifest) -> Result<ExtensionId>;
    async fn unload(&self, id: ExtensionId) -> Result<()>;
    async fn invoke(&self, id: ExtensionId, request: Request) -> Result<Response>;
    fn events(&self, id: ExtensionId) -> Receiver<ExtensionEvent>;
}

/// Python Conductor bridge port
#[async_trait]
pub trait ConductorPort: Send + Sync {
    async fn submit_decision(&self, context: DecisionContext) -> Result<Decision>;
    async fn report_reward(&self, episode: EpisodeId, reward: f64) -> Result<()>;
    async fn get_policy(&self, context: &PolicyContext) -> Result<Policy>;
}
```

**Tasks**:
- [ ] Define `TextEditingPort` trait for Xi-editor abstraction
- [ ] Define `PitPort` trait for high-performance components
- [ ] Define `ExtensionPort` trait for extension system
- [ ] Define `ConductorPort` trait for Python bridge
- [ ] Add comprehensive documentation for each port
- [ ] Create mock implementations for testing
- [ ] Write port interface tests

**Acceptance Criteria**:
- ✅ All ports follow H2A2 architecture principles
- ✅ Ports are async-first with proper error handling
- ✅ Mock implementations enable isolated testing

**Status**: [ ] Not Started

---

### M1.1.2: Development Environment Setup (2 days)

**Goal**: Configure development environment for Hexagonal Architecture development

**Deliverables**:
- Cargo workspace configuration for ports and adapters
- Development tooling setup (clippy, rustfmt, tarpaulin)
- CI/CD pipeline configuration
- Documentation generation setup

**Tasks**:
- [ ] Create `symphony-core-ports` crate structure
- [ ] Configure Cargo.toml with proper dependencies
- [ ] Set up development tooling configuration
- [ ] Configure GitHub Actions for CI/CD
- [ ] Set up documentation generation
- [ ] Create development guidelines document

**Acceptance Criteria**:
- ✅ All development tools configured and working
- ✅ CI/CD pipeline runs successfully
- ✅ Documentation generates correctly

**Status**: [ ] Not Started

---

### M1.1.3: Domain Types & Errors (2 days)

**Goal**: Define core domain types used across all ports

**Deliverables**:
```rust
// src/types.rs

/// Buffer identifier for text editing operations
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct BufferId(pub Uuid);

/// Model specification for AI model allocation
#[derive(Debug, Clone)]
pub struct ModelSpec {
    pub model_id: String,
    pub version: Option<String>,
    pub config: HashMap<String, Value>,
}

/// Extension identifier
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct ExtensionId(pub String);

/// Extension manifest
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtensionManifest {
    pub id: String,
    pub name: String,
    pub version: Version,
    pub extension_type: ExtensionType,
}

/// Binary process identifier (NEW)
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct ProcessId(pub String);

/// Binary synchronization event (NEW)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SyncEvent {
    FileChanged { path: PathBuf, content: String },
    BufferUpdated { buffer_id: BufferId, revision: u64 },
    ProcessHealthCheck { process_id: ProcessId, status: HealthStatus },
}

// src/errors.rs

/// Core error types for all ports
#[derive(Debug, thiserror::Error)]
pub enum PortError {
    #[error("Operation failed: {message}")]
    OperationFailed { message: String },
    
    #[error("Resource not found: {resource}")]
    NotFound { resource: String },
    
    #[error("Permission denied: {operation}")]
    PermissionDenied { operation: String },
    
    #[error("Timeout occurred after {duration:?}")]
    Timeout { duration: Duration },
    
    #[error("Process communication failed: {process_id}")]
    ProcessCommunicationFailed { process_id: ProcessId }, // (NEW)
    
    #[error("Binary synchronization error: {details}")]
    SynchronizationError { details: String }, // (NEW)
}
```

**Tasks**:
- [ ] Define all core domain types
- [ ] Define comprehensive error types
- [ ] **Add binary process types (ProcessId, SyncEvent)** `(NEW)`
- [ ] **Add process communication error types** `(NEW)`
- [ ] Add serde support for serializable types
- [ ] Implement Display and Debug traits
- [ ] Write type conversion utilities
- [ ] Create type validation functions

**Acceptance Criteria**:
- ✅ All domain types are well-defined
- ✅ Error types cover all failure modes
- ✅ Types support serialization where needed
- ✅ **Binary process types support inter-process communication** `(NEW)`

**Status**: [ ] Not Started

---

### M1.1.4: Mock Adapters for Testing (3 days)

**Goal**: Create mock implementations of all ports for testing

**Deliverables**:
```rust
// src/mocks.rs

/// Mock text editing adapter for testing
pub struct MockTextEditingAdapter {
    buffers: Arc<RwLock<HashMap<BufferId, String>>>,
    events: broadcast::Sender<BufferEvent>,
}

impl TextEditingPort for MockTextEditingAdapter {
    async fn insert(&self, buffer_id: BufferId, pos: usize, text: &str) -> Result<Revision> {
        // Mock implementation
    }
    // ... other methods
}

/// Mock Pit adapter for testing
pub struct MockPitAdapter {
    models: Arc<RwLock<HashMap<ModelHandle, ModelSpec>>>,
    artifacts: Arc<RwLock<HashMap<ArtifactId, Vec<u8>>>>,
}

// Similar for other ports...
```

**Tasks**:
- [ ] Implement `MockTextEditingAdapter`
- [ ] Implement `MockPitAdapter`
- [ ] Implement `MockExtensionAdapter`
- [ ] Implement `MockConductorAdapter`
- [ ] Add configurable behavior for testing
- [ ] Create adapter test utilities
- [ ] Write comprehensive adapter tests

**Acceptance Criteria**:
- ✅ All ports have working mock implementations
- ✅ Mocks support configurable test scenarios
- ✅ Mock behavior is deterministic and testable

**Status**: [ ] Not Started

---

### M1.1.5: Architecture Documentation (2 days)

**Goal**: Document the Hexagonal Architecture implementation

**Deliverables**:
- Architecture overview document
- Port interface documentation
- Adapter implementation guidelines
- Testing strategy documentation

**Tasks**:
- [ ] Write architecture overview
- [ ] Document each port interface
- [ ] Create adapter implementation guide
- [ ] Document testing patterns
- [ ] Create code examples
- [ ] Set up rustdoc generation

**Acceptance Criteria**:
- ✅ Architecture is clearly documented
- ✅ All ports have comprehensive documentation
- ✅ Implementation guidelines are clear

**Status**: [ ] Not Started

---

## 🏗️ M1.2: Two-Binary Architecture Implementation `(NEW)`

**Duration**: 3 weeks
**Dependencies**: M1.0 (sy-commons Foundation), M1.1 (Port Definitions)

**Goal**: Implement Symphony and XI-editor as separate executable binaries with proper synchronization and communication.

### M1.2.1: Symphony Binary Structure (3 days)

**Goal**: Implement Symphony binary with Tauri frontend integration

**Deliverables**:
```
Symphony Binary Structure:
src-tauri/
├── Cargo.toml
└── src/
    ├── symphonyaide.rs    # Main AIDE orchestration
    ├── xi-editor.rs       # XI-editor process management  
    ├── process.rs         # Inter-process communication
    └── main.rs            # Tauri application entry
```

**Key Components**:
```rust
// src/symphonyaide.rs
pub struct SymphonyAide {
    conductor: ConductorEngine,
    pit: PitManager,
    xi_editor: XiEditorProcess,
    sync_manager: SyncManager,
}

impl SymphonyAide {
    pub async fn new() -> Result<Self, AideError>;
    pub async fn start(&mut self) -> Result<(), AideError>;
    pub async fn shutdown(&mut self) -> Result<(), AideError>;
}

// src/xi-editor.rs
pub struct XiEditorProcess {
    process: tokio::process::Child,
    rpc_client: JsonRpcClient,
    health_monitor: ProcessHealthMonitor,
}

// src/process.rs
pub struct ProcessManager {
    processes: HashMap<ProcessId, ProcessHandle>,
    health_checks: HashMap<ProcessId, HealthCheck>,
}
```

**Tasks**:
- [ ] Create Tauri project structure
- [ ] Implement SymphonyAide orchestration
- [ ] Create XI-editor process management
- [ ] Add process lifecycle management
- [ ] Implement health monitoring
- [ ] Add Tauri command handlers
- [ ] Write integration tests

**Acceptance Criteria**:
- ✅ Symphony binary starts successfully
- ✅ Tauri frontend integration works
- ✅ Process management is reliable

---

### M1.2.2: XI-editor Binary Structure (3 days)

**Goal**: Create standalone XI-editor binary with JSON-RPC server

**Deliverables**:
```
XI-editor Binary Structure:
apps/backend/xi-editor-standalone/
├── Cargo.toml
└── src/
    ├── jsonrpc.rs         # JSON-RPC server implementation
    ├── xicore.rs          # XI-editor core integration
    └── main.rs            # Standalone XI-editor entry
```

**Key Components**:
```rust
// src/jsonrpc.rs
pub struct JsonRpcServer {
    xi_core: XiCore,
    transport: StdioTransport,
    handlers: HashMap<String, Box<dyn RpcHandler>>,
}

// src/xicore.rs
pub struct XiCoreWrapper {
    core: XiCore,
    buffers: HashMap<BufferId, BufferState>,
}

// src/main.rs
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let server = JsonRpcServer::new()?;
    server.run()?;
    Ok(())
}
```

**Tasks**:
- [ ] Create standalone XI-editor project
- [ ] Implement JSON-RPC server
- [ ] Integrate XI-editor core
- [ ] Add stdio transport
- [ ] Implement RPC handlers
- [ ] Add buffer management
- [ ] Write XI-editor tests

**Acceptance Criteria**:
- ✅ XI-editor binary runs independently
- ✅ JSON-RPC server responds correctly
- ✅ All text editing operations work

---

### M1.2.3: Process Lifecycle Management (4 days)

**Goal**: Manage lifecycle of both binaries with proper startup/shutdown

**Deliverables**:
```rust
// Process lifecycle management
pub struct ProcessLifecycleManager {
    symphony_config: SymphonyConfig,
    xi_editor_config: XiEditorConfig,
    startup_sequence: Vec<StartupStep>,
    shutdown_sequence: Vec<ShutdownStep>,
}

pub enum ProcessState {
    Starting,
    Running,
    Stopping,
    Stopped,
    Failed { error: String },
}

pub struct ProcessHandle {
    id: ProcessId,
    state: ProcessState,
    process: tokio::process::Child,
    started_at: Instant,
}
```

**Tasks**:
- [ ] Implement ProcessLifecycleManager
- [ ] Define startup sequence (XI-editor first, then Symphony)
- [ ] Define shutdown sequence (graceful termination)
- [ ] Add process state tracking
- [ ] Implement restart logic
- [ ] Add configuration management
- [ ] Write lifecycle tests

**Acceptance Criteria**:
- ✅ Processes start in correct order
- ✅ Graceful shutdown works
- ✅ Failed processes restart automatically

---

### M1.2.4: Health Monitoring System (3 days)

**Goal**: Monitor health of both binaries and detect failures

**Deliverables**:
```rust
// Health monitoring system
pub struct BinaryHealthMonitor {
    symphony_health: HealthStatus,
    xi_editor_health: HealthStatus,
    heartbeat_interval: Duration,
    failure_threshold: u32,
}

pub enum HealthStatus {
    Healthy,
    Degraded { reason: String },
    Unhealthy { error: String },
    Unreachable,
}

pub struct HealthCheck {
    process_id: ProcessId,
    last_heartbeat: Instant,
    consecutive_failures: u32,
    check_interval: Duration,
}
```

**Tasks**:
- [ ] Implement BinaryHealthMonitor
- [ ] Add heartbeat mechanism
- [ ] Implement failure detection
- [ ] Add automatic recovery
- [ ] Create health metrics
- [ ] Add health reporting
- [ ] Write health monitoring tests

**Acceptance Criteria**:
- ✅ Health checks detect failures within 1 second
- ✅ Automatic recovery works
- ✅ Health metrics are accurate

---

### M1.2.5: Binary Synchronization Framework (3 days)

**Goal**: Ensure data consistency between Symphony and XI-editor

**Deliverables**:
```rust
// Binary synchronization framework
pub struct BinarySyncManager {
    symphony_state: Arc<RwLock<SymphonyState>>,
    xi_editor_state: Arc<RwLock<XiEditorState>>,
    sync_events: broadcast::Sender<SyncEvent>,
    conflict_resolver: ConflictResolver,
}

pub enum SyncEvent {
    // Symphony → XI-editor (via JSON-RPC)
    FileChanged { path: PathBuf, content: String },
    ProjectStructureChanged { changes: Vec<StructureChange> },
    WorkspaceReload { root_path: PathBuf },
    
    // XI-editor → Symphony (via STDIO streaming)
    BufferUpdated { buffer_id: BufferId, revision: u64, content: String },
    CursorMoved { buffer_id: BufferId, position: Position },
    FileModified { path: PathBuf, timestamp: SystemTime },
    ViewClosed { view_id: ViewId },
}

pub struct ConflictResolver {
    resolution_strategy: ResolutionStrategy,
    conflict_log: Vec<ConflictRecord>,
}
```

**Note**: See `design.md` for Synchronization Architecture diagram and STDIO Streaming Protocol details.

**Tasks**:
- [ ] Implement BinarySyncManager
- [ ] Define synchronization events (Symphony ↔ XI-editor)
- [ ] Implement STDIO streaming event handler
- [ ] Add JSON-RPC operation sender
- [ ] Add conflict detection and resolution
- [ ] Implement file system watcher integration
- [ ] Add state consistency checks
- [ ] Write synchronization tests with mock processes

**Acceptance Criteria**:
- ✅ State remains consistent between binaries
- ✅ STDIO streaming delivers events in real-time (<10ms latency)
- ✅ Conflicts are resolved automatically
- ✅ File system changes propagate to both processes
- ✅ Process failures detected and handled gracefully

---

## 🔌 M1.3: IPC Protocol & Serialization

**Crate**: `symphony-ipc-protocol`
**Duration**: 3 weeks
**Dependencies**: M1.1 (Port Definitions), M1.2 (Two-Binary Architecture)

### M1.3.1: Message Envelope Design (2 days)

**Goal**: Define message envelope structure for IPC communication

**Deliverables**:
```rust
// src/message.rs

/// Message envelope for IPC communication
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message<T> {
    pub id: MessageId,
    pub message_type: String,
    pub version: Version,
    pub timestamp: SystemTime,
    pub payload: T,
    pub metadata: HashMap<String, Value>,
}

/// Message identifier
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct MessageId(pub Uuid);
```

**Tasks**:
- [ ] Define `Message<T>` envelope structure
- [ ] Define `MessageId` type
- [ ] Add metadata support
- [ ] Implement message versioning
- [ ] Add timestamp handling
- [ ] Write envelope tests

**Acceptance Criteria**:
- ✅ Message envelope supports all payload types
- ✅ Versioning enables backward compatibility
- ✅ Metadata extensible for future needs

---

### M1.3.2: MessagePack Serialization (3 days)

**Goal**: Implement efficient binary serialization using MessagePack

**Deliverables**:
```rust
// src/serialize.rs

use rmp_serde::{Deserializer, Serializer};

pub trait MessagePackSerialize: Serialize + DeserializeOwned {
    fn to_msgpack(&self) -> Result<Vec<u8>, SerializeError>;
    fn from_msgpack(bytes: &[u8]) -> Result<Self, DeserializeError>;
}

impl<T: Serialize + DeserializeOwned> MessagePackSerialize for Message<T> {
    fn to_msgpack(&self) -> Result<Vec<u8>, SerializeError> {
        rmp_serde::to_vec(self).map_err(SerializeError::from)
    }
    
    fn from_msgpack(bytes: &[u8]) -> Result<Self, DeserializeError> {
        rmp_serde::from_slice(bytes).map_err(DeserializeError::from)
    }
}
```

**Tasks**:
- [ ] Add `rmp-serde` dependency
- [ ] Implement `MessagePackSerialize` trait
- [ ] Add serde derives to all message types
- [ ] Handle nested types (HashMap, Vec, Option)
- [ ] Benchmark serialization performance
- [ ] Write round-trip tests

**Acceptance Criteria**:
- ✅ Serialization <0.01ms for typical messages
- ✅ Round-trip preserves all data
- ✅ Handles all Rust primitive types

---

### M1.3.3: Bincode Serialization (2 days)

**Goal**: Implement alternative binary serialization for maximum performance

**Deliverables**:
```rust
// src/serialize.rs (extended)

pub trait BincodeSerialize: Serialize + DeserializeOwned {
    fn to_bincode(&self) -> Result<Vec<u8>, SerializeError>;
    fn from_bincode(bytes: &[u8]) -> Result<Self, DeserializeError>;
}

/// Serialization format selection
pub enum SerializationFormat {
    MessagePack,
    Bincode,
}

pub fn serialize<T: Serialize>(value: &T, format: SerializationFormat) -> Result<Vec<u8>, SerializeError>;
pub fn deserialize<T: DeserializeOwned>(bytes: &[u8], format: SerializationFormat) -> Result<T, DeserializeError>;
```

**Tasks**:
- [ ] Add `bincode` dependency
- [ ] Implement `BincodeSerialize` trait
- [ ] Create unified serialization API
- [ ] Compare performance vs MessagePack
- [ ] Document when to use each format

**Acceptance Criteria**:
- ✅ Bincode 20-50% faster than MessagePack
- ✅ Both formats interchangeable via API
- ✅ Format selection configurable

---

### M1.3.4: Schema Validation (3 days)

**Goal**: Validate messages against schemas before processing

**Deliverables**:
```rust
// src/schema.rs

pub struct MessageSchema {
    pub message_type: String,
    pub version: Version,
    pub fields: Vec<FieldSchema>,
    pub required: Vec<String>,
}

pub struct FieldSchema {
    pub name: String,
    pub field_type: FieldType,
    pub constraints: Vec<Constraint>,
}

pub enum FieldType {
    String,
    Integer,
    Float,
    Boolean,
    Array(Box<FieldType>),
    Object(Vec<FieldSchema>),
}

pub trait Validate {
    fn validate(&self, schema: &MessageSchema) -> Result<(), ValidationError>;
}
```

**Tasks**:
- [ ] Define `MessageSchema` structure
- [ ] Define `FieldSchema` and `FieldType`
- [ ] Implement `Validate` trait
- [ ] Add constraint types (min, max, pattern, enum)
- [ ] Create schema registry
- [ ] Write validation tests

**Acceptance Criteria**:
- ✅ Invalid messages rejected with clear errors
- ✅ Schema validation <0.1ms
- ✅ Supports nested object validation

---

### M1.3.5: Message Registry (2 days)

**Goal**: Central registry for message types with versioning

**Deliverables**:
```rust
// src/registry.rs

pub struct MessageRegistry {
    schemas: HashMap<(String, Version), MessageSchema>,
    handlers: HashMap<String, Box<dyn MessageHandler>>,
}

impl MessageRegistry {
    pub fn register<T: MessageType>(&mut self) -> Result<(), RegistryError>;
    pub fn get_schema(&self, type_name: &str, version: Version) -> Option<&MessageSchema>;
    pub fn validate(&self, message: &Message<Value>) -> Result<(), ValidationError>;
    pub fn list_types(&self) -> Vec<&str>;
}
```

**Tasks**:
- [ ] Implement `MessageRegistry` struct
- [ ] Add type registration with version
- [ ] Implement schema lookup
- [ ] Add message validation via registry
- [ ] Support schema evolution (backward compatibility)

**Acceptance Criteria**:
- ✅ All message types registered at startup
- ✅ Version lookup O(1)
- ✅ Backward compatible schema changes work

---

### M1.3.6: JSON-RPC Protocol `(NEW)` (3 days)

**Goal**: Implement JSON-RPC protocol specifically for Symphony ↔ XI-editor communication

**Deliverables**:
```rust
// src/jsonrpc.rs

/// JSON-RPC message for XI-editor communication
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonRpcMessage {
    pub jsonrpc: String, // Always "2.0"
    pub method: Option<String>,
    pub params: Option<Value>,
    pub id: Option<Value>,
    pub result: Option<Value>,
    pub error: Option<JsonRpcError>,
}

/// JSON-RPC client for Symphony → XI-editor
pub struct JsonRpcClient {
    transport: StdioTransport,
    pending_requests: HashMap<RequestId, oneshot::Sender<JsonRpcMessage>>,
    request_counter: AtomicU64,
}

impl JsonRpcClient {
    pub async fn call(&self, method: &str, params: Value) -> Result<Value, JsonRpcError>;
    pub async fn notify(&self, method: &str, params: Value) -> Result<(), JsonRpcError>;
}

/// JSON-RPC server for XI-editor
pub struct JsonRpcServer {
    handlers: HashMap<String, Box<dyn JsonRpcHandler>>,
    xi_core: XiCore,
}
```

**Tasks**:
- [ ] Define JSON-RPC message structure
- [ ] Implement JsonRpcClient for Symphony
- [ ] Implement JsonRpcServer for XI-editor
- [ ] Add request/response correlation
- [ ] Implement notification support
- [ ] Add error handling
- [ ] Write JSON-RPC tests

**Acceptance Criteria**:
- ✅ JSON-RPC 2.0 compliant
- ✅ Request/response latency <1ms
- ✅ Notifications work correctly

---

### M1.3.7: XI-editor Message Types `(NEW)` (2 days)

**Goal**: Define specific message types for XI-editor operations

**Deliverables**:
```rust
// src/xi_protocol.rs

/// XI-editor specific operations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum XiOperation {
    // Buffer operations
    NewView { file_path: Option<PathBuf> },
    CloseView { view_id: ViewId },
    Insert { view_id: ViewId, chars: String },
    Delete { view_id: ViewId, range: Range<usize> },
    
    // File operations
    Open { path: PathBuf },
    Save { view_id: ViewId, path: Option<PathBuf> },
    
    // Cursor operations
    MoveCursor { view_id: ViewId, position: Position },
    SetSelection { view_id: ViewId, selection: Selection },
    
    // Synchronization
    FileChanged { path: PathBuf, content: String },
    BufferSync { view_id: ViewId, revision: u64 },
}

/// XI-editor events sent to Symphony
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum XiEvent {
    BufferChanged { view_id: ViewId, content: String, revision: u64 },
    CursorMoved { view_id: ViewId, position: Position },
    FileModified { path: PathBuf },
    ViewClosed { view_id: ViewId },
}
```

**Tasks**:
- [ ] Define XiOperation enum for all XI-editor operations
- [ ] Define XiEvent enum for XI-editor → Symphony events
- [ ] Add serialization support
- [ ] Create operation builders
- [ ] Add validation for operations
- [ ] Write message type tests

**Acceptance Criteria**:
- ✅ All XI-editor operations covered
- ✅ Events support real-time synchronization
- ✅ Message validation works

**Goal**: Human-readable message output for debugging

**Deliverables**:
```rust
// src/pretty.rs

pub trait PrettyPrint {
    fn pretty_print(&self) -> String;
    fn pretty_print_compact(&self) -> String;
}

---

### M1.3.8: Pretty Printer (1 day)

**Goal**: Human-readable message output for debugging

**Deliverables**:
```rust
// src/pretty.rs

pub trait PrettyPrint {
    fn pretty_print(&self) -> String;
    fn pretty_print_compact(&self) -> String;
}

impl<T: Serialize> PrettyPrint for Message<T> {
    fn pretty_print(&self) -> String {
        // Indented, colorized output
    }
}

impl PrettyPrint for JsonRpcMessage { // (NEW)
    fn pretty_print(&self) -> String {
        // JSON-RPC specific formatting
    }
}
```

**Tasks**:
- [ ] Implement `PrettyPrint` trait
- [ ] Add indentation and formatting
- [ ] Add optional colorization
- [ ] Create compact single-line format
- [ ] **Add JSON-RPC specific formatting** `(NEW)`
- [ ] Add to Debug impl

**Acceptance Criteria**:
- ✅ Output is human-readable
- ✅ Supports both verbose and compact modes
- ✅ Works in logs and terminals
- ✅ **JSON-RPC messages formatted correctly** `(NEW)`

---

### M1.3.9: Property Tests (2 days)

**Goal**: Ensure serialization correctness with property-based testing

**Deliverables**:
```rust
// tests/property_tests.rs

use proptest::prelude::*;

proptest! {
    #[test]
    fn msgpack_roundtrip(msg in arb_message()) {
        let bytes = msg.to_msgpack().unwrap();
        let decoded = Message::from_msgpack(&bytes).unwrap();
        prop_assert_eq!(msg, decoded);
    }
    
    #[test]
    fn bincode_roundtrip(msg in arb_message()) {
        let bytes = msg.to_bincode().unwrap();
        let decoded = Message::from_bincode(&bytes).unwrap();
        prop_assert_eq!(msg, decoded);
    }
    
    #[test] // (NEW)
    fn jsonrpc_roundtrip(msg in arb_jsonrpc_message()) {
        let json = serde_json::to_string(&msg).unwrap();
        let decoded: JsonRpcMessage = serde_json::from_str(&json).unwrap();
        prop_assert_eq!(msg, decoded);
    }
}
```

**Tasks**:
- [ ] Add `proptest` dependency
- [ ] Create arbitrary generators for all types
- [ ] Write round-trip property tests
- [ ] Write schema validation property tests
- [ ] **Add JSON-RPC property tests** `(NEW)`
- [ ] **Add XI-editor message property tests** `(NEW)`
- [ ] Run with 1000+ test cases

**Acceptance Criteria**:
- ✅ All property tests pass
- ✅ Edge cases covered (empty, max size, unicode)
- ✅ No panics on any input
- ✅ **JSON-RPC messages handle all edge cases** `(NEW)`


---

## 🔌 M1.4: Transport Layer

**Crate**: `symphony-ipc-transport`
**Duration**: 3 weeks
**Dependencies**: M1.3 (IPC Protocol)

### M1.4.1: Transport Trait (2 days)

**Goal**: Define abstract transport interface

**Deliverables**:
```rust
// src/traits.rs

#[async_trait]
pub trait Transport: Send + Sync {
    async fn connect(&mut self, address: &str) -> Result<(), TransportError>;
    async fn send(&self, data: &[u8]) -> Result<(), TransportError>;
    async fn receive(&self) -> Result<Vec<u8>, TransportError>;
    async fn close(&mut self) -> Result<(), TransportError>;
    fn is_connected(&self) -> bool;
}

pub trait TransportFactory: Send + Sync {
    fn create(&self, config: &TransportConfig) -> Box<dyn Transport>;
}
```

**Tasks**:
- [ ] Define `Transport` async trait
- [ ] Define `TransportFactory` trait
- [ ] Define `TransportConfig` struct
- [ ] Define `TransportError` enum
- [ ] Add connection state tracking

---

### M1.4.2: Unix Socket Transport (4 days)

**Goal**: High-performance transport for Linux/macOS

**Deliverables**:
```rust
// src/unix_socket.rs

pub struct UnixSocketTransport {
    socket: Option<UnixStream>,
    address: PathBuf,
    config: UnixSocketConfig,
}

pub struct UnixSocketConfig {
    pub buffer_size: usize,
    pub timeout: Duration,
    pub non_blocking: bool,
}
```

**Tasks**:
- [ ] Implement `UnixSocketTransport`
- [ ] Add async read/write with tokio
- [ ] Implement connection timeout
- [ ] Add buffer management
- [ ] Handle partial reads/writes
- [ ] Write integration tests

**Acceptance Criteria**:
- ✅ Latency <0.1ms for small messages
- ✅ Handles 10,000+ connections
- ✅ Graceful handling of disconnects

---

### M1.4.3: Named Pipe Transport (4 days)

**Goal**: Windows-native transport implementation

**Tasks**:
- [ ] Implement `NamedPipeTransport`
- [ ] Add async I/O with tokio
- [ ] Handle Windows-specific errors
- [ ] Test on Windows CI

---

### M1.4.4: Shared Memory Transport (3 days)

**Goal**: Ultra-low-latency for high-frequency data

**Tasks**:
- [ ] Implement `SharedMemoryTransport`
- [ ] Use memory-mapped files
- [ ] Add lock-free ring buffer
- [ ] Benchmark vs socket transport

**Acceptance Criteria**:
- ✅ Latency <0.01ms
- ✅ Zero-copy where possible

---

### M1.4.5: Stdio Transport `(NEW)` (3 days)

**Goal**: Implement stdio transport for Symphony ↔ XI-editor JSON-RPC communication

**Deliverables**:
```rust
// src/stdio.rs

/// Stdio transport for process communication
pub struct StdioTransport {
    stdin: tokio::process::ChildStdin,
    stdout: tokio::process::ChildStdout,
    buffer: Vec<u8>,
    line_reader: tokio::io::BufReader<tokio::process::ChildStdout>,
}

impl StdioTransport {
    pub fn new(stdin: tokio::process::ChildStdin, stdout: tokio::process::ChildStdout) -> Self;
    pub async fn send_line(&mut self, line: &str) -> Result<(), TransportError>;
    pub async fn receive_line(&mut self) -> Result<String, TransportError>;
    pub async fn stream_events(&mut self) -> impl Stream<Item = Result<String, TransportError>>;
}

impl Transport for StdioTransport {
    async fn connect(&mut self, _address: &str) -> Result<(), TransportError> {
        // Already connected via process spawn
        Ok(())
    }
    
    async fn send(&self, data: &[u8]) -> Result<(), TransportError> {
        // Send JSON-RPC message via stdin
    }
    
    async fn receive(&self) -> Result<Vec<u8>, TransportError> {
        // Receive JSON-RPC message via stdout
    }
}
```

**Note**: See `design.md` for STDIO Reliability & Streaming architecture details.

**Tasks**:
- [ ] Implement `StdioTransport` struct
- [ ] Add line-based message framing (newline-delimited JSON)
- [ ] Implement async read/write with tokio streams
- [ ] Handle process stdin/stdout with proper buffering
- [ ] Add continuous event streaming (like SSE)
- [ ] Implement graceful shutdown and cleanup
- [ ] Add error handling for broken pipes and process death
- [ ] Write stdio transport tests with mock processes

**Acceptance Criteria**:
- ✅ Stdio transport latency <1ms for single messages
- ✅ Streaming latency <10ms for continuous events
- ✅ Line-based framing works correctly with JSON
- ✅ Handles process termination gracefully
- ✅ OS-level reliability guarantees maintained
- ✅ Continuous streaming works like SSE

---

### M1.4.6: Connection Pooling (2 days)

**Goal**: Efficient connection reuse for high-throughput scenarios

**Deliverables**:
```rust
// src/pool.rs

/// Connection pool configuration
pub struct PoolConfig {
    pub min_connections: usize,
    pub max_connections: usize,
    pub idle_timeout: Duration,
    pub max_lifetime: Duration,
}

/// Connection pool
pub struct ConnectionPool<T: Transport> {
    connections: Vec<PooledConnection<T>>,
    config: PoolConfig,
    metrics: PoolMetrics,
}

impl<T: Transport> ConnectionPool<T> {
    pub fn new(factory: Box<dyn TransportFactory>, config: PoolConfig) -> Self;
    pub async fn acquire(&self) -> Result<PooledConnection<T>, PoolError>;
    pub fn release(&self, conn: PooledConnection<T>);
    pub fn metrics(&self) -> &PoolMetrics;
}
```

**Tasks**:
- [ ] Define `PoolConfig` struct
- [ ] Implement `ConnectionPool`
- [ ] Add connection lifecycle management
- [ ] Implement idle connection cleanup
- [ ] Add pool metrics
- [ ] Write pool tests

**Acceptance Criteria**:
- ✅ Connection reuse reduces latency
- ✅ Pool respects size limits
- ✅ Idle connections cleaned up

---

### M1.4.7: Reconnection Logic (2 days)

**Goal**: Automatic reconnection with exponential backoff

**Deliverables**:
```rust
// src/reconnect.rs

/// Reconnection strategy
pub struct ReconnectStrategy {
    pub initial_delay: Duration,
    pub max_delay: Duration,
    pub multiplier: f64,
    pub max_attempts: Option<u32>,
}

/// Reconnecting transport wrapper
pub struct ReconnectingTransport<T: Transport> {
    inner: T,
    strategy: ReconnectStrategy,
    state: ReconnectState,
}

impl<T: Transport> ReconnectingTransport<T> {
    pub fn new(transport: T, strategy: ReconnectStrategy) -> Self;
    pub async fn ensure_connected(&mut self) -> Result<(), TransportError>;
}
```

**Tasks**:
- [ ] Define `ReconnectStrategy` struct
- [ ] Implement exponential backoff
- [ ] Add jitter to prevent thundering herd
- [ ] Implement max attempts limit
- [ ] Write reconnection tests

**Acceptance Criteria**:
- ✅ Automatic reconnection works
- ✅ Backoff prevents server overload
- ✅ Max attempts respected

---

### M1.4.7: Transport Tests (2 days)

**Goal**: Comprehensive integration tests for all transports

**Tasks**:
- [ ] Write Unix socket integration tests
- [ ] Write Named pipe integration tests
- [ ] Write shared memory integration tests
- [ ] Add cross-platform CI testing
- [ ] Write performance benchmarks
- [ ] Test error handling scenarios

**Acceptance Criteria**:
- ✅ All transports tested
- ✅ CI passes on all platforms
- ✅ Performance benchmarks documented

---

## 🚌 M1.5: Message Bus Core

**Crate**: `symphony-ipc-bus`
**Duration**: 3 weeks
**Dependencies**: M1.3 (IPC Protocol), M1.4 (Transport Layer)


### M1.5.1: Async Message Handler (3 days)

**Goal**: Core async message processing with tokio

**Deliverables**:
```rust
// src/handler.rs

use tokio::sync::mpsc;

/// Message handler trait
#[async_trait]
pub trait MessageHandler: Send + Sync {
    async fn handle(&self, msg: Message<Value>) -> Result<Option<Message<Value>>, HandlerError>;
    fn message_types(&self) -> Vec<&str>;
}

/// Async message processor
pub struct MessageProcessor {
    handlers: HashMap<String, Box<dyn MessageHandler>>,
    inbox: mpsc::Receiver<Message<Value>>,
    outbox: mpsc::Sender<Message<Value>>,
}

impl MessageProcessor {
    pub fn new(buffer_size: usize) -> (Self, mpsc::Sender<Message<Value>>);
    pub fn register_handler(&mut self, handler: Box<dyn MessageHandler>);
    pub async fn run(&mut self);
    pub async fn process_one(&mut self) -> Result<(), ProcessError>;
}
```

**Tasks**:
- [ ] Define `MessageHandler` trait
- [ ] Implement `MessageProcessor`
- [ ] Add tokio channel integration
- [ ] Implement handler registration
- [ ] Add graceful shutdown
- [ ] Write handler tests

**Acceptance Criteria**:
- ✅ Async processing works
- ✅ Multiple handlers supported
- ✅ Graceful shutdown works

---

### M1.5.2: Routing Engine (3 days)

**Goal**: Pattern-based message routing

**Deliverables**:
```rust
// src/router.rs

/// Route pattern
pub struct RoutePattern {
    pub pattern: String,
    pub priority: i32,
}

/// Router for message routing
pub struct Router {
    routes: Vec<(RoutePattern, EndpointId)>,
    default_route: Option<EndpointId>,
}

impl Router {
    pub fn new() -> Self;
    pub fn add_route(&mut self, pattern: RoutePattern, endpoint: EndpointId);
    pub fn remove_route(&mut self, pattern: &str);
    pub fn route(&self, msg: &Message<Value>) -> Option<EndpointId>;
    pub fn route_all(&self, msg: &Message<Value>) -> Vec<EndpointId>;
}
```

**Tasks**:
- [ ] Define `RoutePattern` struct
- [ ] Implement `Router`
- [ ] Add glob pattern matching
- [ ] Add priority-based routing
- [ ] Implement default route
- [ ] Write routing tests

**Acceptance Criteria**:
- ✅ Pattern matching works
- ✅ Priority respected
- ✅ Routing is O(n) or better

---

### M1.5.3: Endpoint Registration (2 days)

**Goal**: Dynamic endpoint registration and discovery

**Deliverables**:
```rust
// src/endpoint.rs

/// Endpoint identifier
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct EndpointId(pub String);

/// Endpoint information
pub struct EndpointInfo {
    pub id: EndpointId,
    pub name: String,
    pub capabilities: Vec<String>,
    pub transport: TransportType,
    pub registered_at: Instant,
}

/// Endpoint registry
pub struct EndpointRegistry {
    endpoints: HashMap<EndpointId, EndpointInfo>,
    by_capability: HashMap<String, Vec<EndpointId>>,
}

impl EndpointRegistry {
    pub fn register(&mut self, info: EndpointInfo) -> Result<(), RegistryError>;
    pub fn unregister(&mut self, id: &EndpointId) -> Option<EndpointInfo>;
    pub fn get(&self, id: &EndpointId) -> Option<&EndpointInfo>;
    pub fn find_by_capability(&self, capability: &str) -> Vec<&EndpointInfo>;
    pub fn list(&self) -> Vec<&EndpointInfo>;
}
```

**Tasks**:
- [ ] Define `EndpointId` and `EndpointInfo`
- [ ] Implement `EndpointRegistry`
- [ ] Add capability-based lookup
- [ ] Add registration events
- [ ] Write registry tests

**Acceptance Criteria**:
- ✅ Registration works
- ✅ Capability lookup is fast
- ✅ Events emitted on changes

---

### M1.5.4: Request/Response Correlation (3 days)

**Goal**: Track request/response pairs with timeouts

**Deliverables**:
```rust
// src/correlation.rs

/// Pending request
struct PendingRequest {
    request_id: MessageId,
    sent_at: Instant,
    timeout: Duration,
    response_tx: oneshot::Sender<Message<Value>>,
}

/// Request correlator
pub struct RequestCorrelator {
    pending: HashMap<MessageId, PendingRequest>,
    default_timeout: Duration,
}

impl RequestCorrelator {
    pub fn new(default_timeout: Duration) -> Self;
    pub fn track(&mut self, request: &Message<Value>, timeout: Option<Duration>) -> oneshot::Receiver<Message<Value>>;
    pub fn correlate(&mut self, response: Message<Value>) -> Result<(), CorrelationError>;
    pub fn check_timeouts(&mut self) -> Vec<MessageId>;
}
```

**Tasks**:
- [ ] Implement `RequestCorrelator`
- [ ] Add oneshot channel for responses
- [ ] Implement timeout checking
- [ ] Add correlation by message ID
- [ ] Handle orphaned responses
- [ ] Write correlation tests

**Acceptance Criteria**:
- ✅ Responses matched to requests
- ✅ Timeouts handled correctly
- ✅ No memory leaks from orphans

---

### M1.5.5: Pub/Sub System (3 days)

**Goal**: Topic-based publish/subscribe messaging

**Deliverables**:
```rust
// src/pubsub.rs

/// Subscription
pub struct Subscription {
    pub id: SubscriptionId,
    pub topic: String,
    pub filter: Option<MessageFilter>,
    pub subscriber: EndpointId,
}

/// Pub/Sub manager
pub struct PubSubManager {
    subscriptions: HashMap<String, Vec<Subscription>>,
    by_subscriber: HashMap<EndpointId, Vec<SubscriptionId>>,
}

impl PubSubManager {
    pub fn subscribe(&mut self, topic: &str, subscriber: EndpointId, filter: Option<MessageFilter>) -> SubscriptionId;
    pub fn unsubscribe(&mut self, id: SubscriptionId);
    pub fn unsubscribe_all(&mut self, subscriber: &EndpointId);
    pub fn get_subscribers(&self, topic: &str) -> Vec<&Subscription>;
    pub fn matches(&self, topic: &str, msg: &Message<Value>) -> Vec<&Subscription>;
}
```

**Tasks**:
- [ ] Define `Subscription` struct
- [ ] Implement `PubSubManager`
- [ ] Add topic pattern matching (wildcards)
- [ ] Add message filtering
- [ ] Implement unsubscribe
- [ ] Write pub/sub tests

**Acceptance Criteria**:
- ✅ Subscribe/unsubscribe works
- ✅ Wildcards supported (*, #)
- ✅ Filtering reduces traffic

---

### M1.5.6: Health Monitoring (2 days)

**Goal**: Monitor bus and endpoint health

**Deliverables**:
```rust
// src/health.rs

/// Health status
#[derive(Debug, Clone)]
pub enum HealthStatus {
    Healthy,
    Degraded { reason: String },
    Unhealthy { error: String },
}

/// Bus health monitor
pub struct BusHealthMonitor {
    endpoint_health: HashMap<EndpointId, HealthStatus>,
    heartbeat_interval: Duration,
    timeout: Duration,
}

impl BusHealthMonitor {
    pub fn new(heartbeat_interval: Duration, timeout: Duration) -> Self;
    pub async fn check_endpoint(&mut self, id: &EndpointId) -> HealthStatus;
    pub fn update_health(&mut self, id: &EndpointId, status: HealthStatus);
    pub fn get_health(&self, id: &EndpointId) -> Option<&HealthStatus>;
    pub fn unhealthy_endpoints(&self) -> Vec<&EndpointId>;
}
```

**Tasks**:
- [ ] Define `HealthStatus` enum
- [ ] Implement `BusHealthMonitor`
- [ ] Add heartbeat mechanism
- [ ] Implement timeout detection
- [ ] Add health metrics
- [ ] Write health tests

**Acceptance Criteria**:
- ✅ Unhealthy endpoints detected
- ✅ Heartbeats work
- ✅ Metrics available

---

### M1.5.7: Binary Coordination `(NEW)` (3 days)

**Goal**: Specialized coordination for Symphony ↔ XI-editor communication

**Deliverables**:
```rust
// src/binary_sync.rs

/// Binary synchronization coordinator
pub struct BinarySyncCoordinator {
    symphony_endpoint: EndpointId,
    xi_editor_endpoint: EndpointId,
    sync_state: Arc<RwLock<SyncState>>,
    event_stream: broadcast::Sender<SyncEvent>,
}

/// Synchronization state between binaries
pub struct SyncState {
    pub file_states: HashMap<PathBuf, FileState>,
    pub buffer_states: HashMap<BufferId, BufferState>,
    pub last_sync: Instant,
    pub pending_operations: Vec<PendingOperation>,
}

impl BinarySyncCoordinator {
    pub fn new(symphony_id: EndpointId, xi_editor_id: EndpointId) -> Self;
    pub async fn sync_file_state(&self, path: &Path) -> Result<(), SyncError>;
    pub async fn sync_buffer_state(&self, buffer_id: BufferId) -> Result<(), SyncError>;
    pub async fn handle_sync_event(&self, event: SyncEvent) -> Result<(), SyncError>;
}
```

**Tasks**:
- [ ] Implement `BinarySyncCoordinator`
- [ ] Add file state synchronization
- [ ] Add buffer state synchronization
- [ ] Implement event-driven sync
- [ ] Add conflict detection
- [ ] Handle sync failures
- [ ] Write binary sync tests

**Acceptance Criteria**:
- ✅ File states stay synchronized
- ✅ Buffer states stay synchronized
- ✅ Sync latency <10ms

---

### M1.5.8: XI-editor Bridge `(NEW)` (3 days)

**Goal**: Specialized bridge for XI-editor communication

**Deliverables**:
```rust
// src/xi_bridge.rs

/// Bridge for XI-editor communication
pub struct XiEditorBridge {
    rpc_client: JsonRpcClient,
    event_handler: XiEventHandler,
    buffer_manager: BufferManager,
    file_watcher: FileWatcher,
}

/// XI-editor event handler
pub struct XiEventHandler {
    event_tx: broadcast::Sender<XiEvent>,
    buffer_cache: Arc<RwLock<HashMap<ViewId, BufferInfo>>>,
}

impl XiEditorBridge {
    pub fn new(rpc_client: JsonRpcClient) -> Self;
    pub async fn send_operation(&self, op: XiOperation) -> Result<Value, XiError>;
    pub async fn handle_event(&self, event: XiEvent) -> Result<(), XiError>;
    pub fn subscribe_events(&self) -> broadcast::Receiver<XiEvent>;
}
```

**Tasks**:
- [ ] Implement `XiEditorBridge`
- [ ] Add operation sending
- [ ] Add event handling
- [ ] Implement buffer management
- [ ] Add file watching integration
- [ ] Handle XI-editor disconnection
- [ ] Write XI-editor bridge tests

**Acceptance Criteria**:
- ✅ All XI-editor operations work
- ✅ Events are handled correctly
- ✅ Disconnection recovery works

---

### M1.5.9: Message Batching (2 days)

**Goal**: Batch messages for improved throughput

**Deliverables**:
```rust
// src/batching.rs

/// Batch configuration
pub struct BatchConfig {
    pub max_size: usize,
    pub max_delay: Duration,
}

/// Message batcher
pub struct MessageBatcher {
    config: BatchConfig,
    pending: Vec<Message<Value>>,
    last_flush: Instant,
}

impl MessageBatcher {
    pub fn new(config: BatchConfig) -> Self;
    pub fn add(&mut self, msg: Message<Value>) -> Option<Vec<Message<Value>>>;
    pub fn flush(&mut self) -> Vec<Message<Value>>;
    pub fn should_flush(&self) -> bool;
}
```

**Tasks**:
- [ ] Define `BatchConfig` struct
- [ ] Implement `MessageBatcher`
- [ ] Add size-based flushing
- [ ] Add time-based flushing
- [ ] Write batching tests

**Acceptance Criteria**:
- ✅ Batching improves throughput
- ✅ Max delay respected
- ✅ No message loss

---

### M1.5.10: Load Tests (2 days)

**Goal**: Verify bus performance under load

**Tasks**:
- [ ] Write throughput benchmark (target: 10,000+ msg/sec)
- [ ] Write latency benchmark (target: <0.3ms average)
- [ ] Test with many endpoints (100+)
- [ ] Test with many subscriptions (1000+)
- [ ] Profile memory usage
- [ ] Document performance characteristics

**Acceptance Criteria**:
- ✅ 10,000+ messages/second
- ✅ <0.3ms average latency
- ✅ Stable under sustained load

---

## 🐍 M1.6: Python-Rust Bridge

**Crate**: `symphony-python-bridge`
**Duration**: 3 weeks
**Dependencies**: M1.5 (Message Bus Core)

### M1.6.1-M1.6.10: PyO3 Integration

**Key Components**:
```rust
// src/lib.rs
use pyo3::prelude::*;

#[pyclass]
pub struct IPCBus {
    inner: Arc<MessageBus>,
}

#[pymethods]
impl IPCBus {
    #[new]
    fn new() -> PyResult<Self>;
    
    fn send<'py>(&self, py: Python<'py>, msg: PyObject) -> PyResult<&'py PyAny>;
    fn request<'py>(&self, py: Python<'py>, msg: PyObject) -> PyResult<&'py PyAny>;
    fn subscribe(&self, topic: &str) -> PyResult<PyObject>;
}

// (NEW) Conductor subprocess management
#[pyclass]
pub struct ConductorManager {
    subprocess: Option<tokio::process::Child>,
    pit_access: Arc<PitManager>,
}

#[pymethods]
impl ConductorManager {
    fn start_conductor(&mut self) -> PyResult<()>;
    fn get_pit_access(&self) -> PyResult<PitAccess>; // Direct access, no IPC
}

#[pymodule]
fn symphony_ipc(_py: Python, m: &PyModule) -> PyResult<()> {
    m.add_class::<IPCBus>()?;
    m.add_class::<ConductorManager>()?; // (NEW)
    Ok(())
}
```

**Tasks** (updated):
- [ ] M1.6.1: PyO3 project setup with maturin
- [ ] M1.6.2-M1.6.3: Type conversions (primitives, collections)
- [ ] M1.6.4: Error conversion to Python exceptions
- [ ] M1.6.5: Async support with pyo3-asyncio
- [ ] M1.6.6: Expose full IPC Bus API
- [ ] M1.6.7: **Implement Conductor subprocess management within Symphony** `(NEW)`
- [ ] M1.6.8: **Create direct Pit access for Conductor (no IPC overhead)** `(NEW)`
- [ ] M1.6.9: Python integration tests
- [ ] M1.6.10: FFI overhead benchmarks (<0.01ms)

**Success Criteria**:
- ✅ FFI call overhead <0.01ms
- ✅ All primitive types convert correctly
- ✅ Async calls work from Python asyncio
- ✅ Errors propagate with full context
- ✅ **Conductor has direct access to The Pit components** `(NEW)`

---

## 📦 M1.7: Extension SDK Foundation

**Crate**: `symphony-extension-sdk`
**Duration**: 3 weeks
**Dependencies**: M1.3 (IPC Protocol)

### Extension System Architecture Overview `(NEW)`

**Note**: See `design.md` for Four-Tier Extension System diagram and Extension Distribution Strategy details.

### M1.7.1-M1.7.10: SDK Implementation

**Key Components**:
```rust
// src/manifest.rs
#[derive(Deserialize, Serialize)]
pub struct ExtensionManifest {
    pub id: String,
    pub name: String,
    pub version: Version,
    pub extension_type: ExtensionType,
    pub permissions: Vec<Permission>,
    pub dependencies: Vec<Dependency>,
    pub lifecycle: LifecycleConfig,
}

// src/lifecycle.rs
#[async_trait]
pub trait ExtensionLifecycle {
    async fn on_load(&mut self, ctx: &LoadContext) -> Result<(), LifecycleError>;
    async fn on_activate(&mut self) -> Result<(), LifecycleError>;
    async fn on_deactivate(&mut self) -> Result<(), LifecycleError>;
    async fn on_unload(&mut self) -> Result<(), LifecycleError>;
}

// src/traits.rs
pub trait Extension: ExtensionLifecycle + Send + Sync {
    fn manifest(&self) -> &ExtensionManifest;
    fn id(&self) -> &str;
}

// (NEW) Actor-based process isolation for Symphony extensions
// src/actor.rs
pub struct ExtensionActor {
    process: tokio::process::Child,
    message_tx: mpsc::Sender<ActorMessage>,
    message_rx: mpsc::Receiver<ActorMessage>,
    extension_type: ExtensionType,
}

pub enum ExtensionType {
    Instrument { model_spec: ModelSpec },
    Operator { capabilities: Vec<String> },
    Motif { ui_components: Vec<String> },
}

// src/process.rs
pub struct ExtensionProcessManager {
    processes: HashMap<ExtensionId, ExtensionActor>,
    isolation_config: IsolationConfig,
    xi_editor_bridge: Option<XiEditorBridge>, // For XI-editor plugin coordination
}

pub struct IsolationConfig {
    pub memory_limit: usize,
    pub cpu_limit: f64,
    pub network_access: bool,
    pub file_system_access: Vec<PathBuf>,
}

// (NEW) XI-editor plugin coordination
pub struct XiEditorBridge {
    pub available_plugins: Vec<XiPlugin>,
    pub plugin_capabilities: HashMap<String, Vec<String>>,
}

pub struct XiPlugin {
    pub name: String,
    pub version: String,
    pub capabilities: Vec<String>,
    pub language_support: Vec<String>,
}
```

**Extension Interaction Patterns**: `(NEW)`
```rust
// Pattern 1: Motif → Instrument → Operator → XI-editor
async fn ai_code_generation_workflow() {
    // 1. Motif (UI) receives user request
    let request = motif.get_user_request().await;
    
    // 2. Instrument (AI) generates code
    let generated_code = instrument.generate_code(request).await;
    
    // 3. Operator (Transform) formats code
    let formatted_code = operator.format_code(generated_code).await;
    
    // 4. XI-editor (via JSON-RPC) inserts code
    xi_editor.insert_text(buffer_id, formatted_code).await;
}

// Pattern 2: XI-editor → Symphony Extension Chain
async fn code_analysis_workflow() {
    // 1. XI-editor detects code change (via STDIO stream)
    let change_event = xi_editor_stream.next().await;
    
    // 2. Operator (Analyzer) processes change
    let analysis = operator.analyze_code(change_event.content).await;
    
    // 3. Instrument (AI) provides suggestions
    let suggestions = instrument.get_suggestions(analysis).await;
    
    // 4. Motif (UI) displays suggestions
    motif.show_suggestions(suggestions).await;
}
```
```

**Tasks** (updated):
- [ ] M1.7.1: TOML manifest schema definition
- [ ] M1.7.2: Manifest parser with validation
- [ ] M1.7.3: Lifecycle trait with hooks
- [ ] M1.7.4: Permission declaration system
- [ ] M1.7.5: Base Extension trait
- [ ] M1.7.6: Derive macros for boilerplate
- [ ] M1.7.7: **Implement Actor-based process isolation for Symphony extensions** `(NEW)`
- [ ] M1.7.8: **Create extension process spawning and management** `(NEW)`
- [ ] M1.7.9: **Implement XI-editor plugin coordination bridge** `(NEW)`
- [ ] M1.7.10: **Define extension interaction patterns (Motif→Instrument→Operator→XI-editor)** `(NEW)`
- [ ] M1.7.11: Manifest pretty-printer
- [ ] M1.7.12: Property tests for manifest round-trip

**Success Criteria**:
- ✅ Manifest parsing <1ms for typical manifests
- ✅ Invalid manifests rejected with clear errors
- ✅ Lifecycle hooks called in correct order
- ✅ Permission violations detected at declaration time
- ✅ **Symphony extensions run in isolated processes with crash protection** `(NEW)`
- ✅ **Four extension types (Instruments, Operators, Motifs, XI-plugins) work together** `(NEW)`
- ✅ **Extension interaction patterns enable complex AI workflows** `(NEW)`
- ✅ **XI-editor plugin capabilities discoverable from Symphony** `(NEW)`

---

## 📊 M1 Summary

| Sub-Milestone | Tasks | Duration | Status |
|---------------|-------|----------|--------|
| M1.1.1 Port Definitions | 7 | 3 days | 📋 |
| M1.1.2 Environment Setup | 6 | 2 days | 📋 |
| M1.1.3 Domain Types | 8 | 2 days | 📋 |
| M1.1.4 Mock Adapters | 7 | 3 days | 📋 |
| M1.1.5 Documentation | 6 | 2 days | 📋 |
| **M1.2.1 Symphony Binary** `(NEW)` | 7 | 3 days | 📋 |
| **M1.2.2 XI-editor Binary** `(NEW)` | 7 | 3 days | 📋 |
| **M1.2.3 Process Lifecycle** `(NEW)` | 7 | 4 days | 📋 |
| **M1.2.4 Health Monitoring** `(NEW)` | 7 | 3 days | 📋 |
| **M1.2.5 Binary Synchronization** `(NEW)` | 8 | 3 days | 📋 |
| M1.3.1 Message Envelope | 7 | 2 days | ✅ |
| M1.3.2 MessagePack | 6 | 3 days | 📋 |
| M1.3.3 Bincode | 5 | 2 days | 📋 |
| M1.3.4 Schema Validation | 6 | 3 days | 📋 |
| M1.3.5 Message Registry | 5 | 2 days | 📋 |
| **M1.3.6 JSON-RPC Protocol** `(NEW)` | 7 | 3 days | 📋 |
| **M1.3.7 XI-editor Messages** `(NEW)` | 6 | 2 days | 📋 |
| M1.3.8 Pretty Printer | 6 | 1 day | 📋 |
| M1.3.9 Property Tests | 9 | 2 days | 📋 |
| M1.4.x Transport Layer | 18 | 3 weeks | 📋 |
| **M1.4.5 Stdio Transport** `(NEW)` | 8 | 3 days | 📋 |
| M1.5.x Message Bus | 10 | 3 weeks | 📋 |
| **M1.5.7 Binary Coordination** `(NEW)` | 7 | 3 days | 📋 |
| **M1.5.8 XI-editor Bridge** `(NEW)` | 7 | 3 days | 📋 |
| M1.6.x Python Bridge | 10 | 3 weeks | 📋 |
| **M1.6.7 Conductor Subprocess** `(NEW)` | 1 | - | 📋 |
| **M1.6.8 Direct Pit Access** `(NEW)` | 1 | - | 📋 |
| M1.7.x Extension SDK | 12 | 3 weeks | 📋 |
| **M1.7.7-10 Four-Tier Extensions** `(NEW)` | 4 | - | 📋 |

**Total Tasks**: ~165 detailed tasks (55 new tasks added)
**Total Duration**: 24 weeks (with parallelization: ~16 weeks)

**Key Architectural Clarifications Added**:

**Note**: See `design.md` for detailed architecture diagrams and `requirements.md` for acceptance criteria.

**Architecture Benefits**:
- ✅ **Best of Both Worlds**: XI-editor's proven text editing + Symphony's AI orchestration
- ✅ **Extension Compatibility**: Existing XI-editor plugins work unchanged
- ✅ **Innovation Space**: New Symphony extensions for AI workflows
- ✅ **Clean Boundaries**: Each system handles what it does best
- ✅ **Reliable Communication**: OS-level STDIO with SSE-like streaming

---

**Next**: [MILESTONE_LEVEL2_M5.md](./MILESTONE_LEVEL2_M5.md)

---

## 🔧 M1.8: Concrete Adapters Implementation `(NEW)`

**Crate**: `symphony-adapters`
**Duration**: 4 weeks
**Dependencies**: M1.1 (Port Definitions), M1.3 (IPC Protocol), M1.6 (Python Bridge)

**Goal**: Implement concrete adapters for all four ports to complete H2A2 architecture.

### M1.8.1: XiEditorAdapter Implementation (5 days)

**Goal**: Implement TextEditingPort adapter for XI-editor binary communication

**Deliverables**:
```rust
// src/xi_editor.rs
pub struct XiEditorAdapter {
    rpc_client: xi_rpc::RpcPeer,
    buffer_cache: Arc<RwLock<HashMap<BufferId, BufferMetadata>>>,
    event_stream: broadcast::Sender<BufferEvent>,
}

#[async_trait]
impl TextEditingPort for XiEditorAdapter {
    async fn insert(&self, buffer_id: BufferId, pos: usize, text: &str) -> PortResult<Revision> {
        let params = json!({
            "buffer_id": buffer_id,
            "pos": pos,
            "text": text
        });
        
        let result = self.rpc_client.send_rpc_request("insert", &params).await?;
        Ok(Revision::new(result["revision"].as_u64().unwrap()))
    }
    
    // ... other TextEditingPort methods
}
```

**Tasks**:
- [ ] M1.8.1.1: Implement JSON-RPC client for XI-editor communication
- [ ] M1.8.1.2: Create buffer metadata caching system
- [ ] M1.8.1.3: Implement all TextEditingPort methods
- [ ] M1.8.1.4: Add event streaming from XI-editor
- [ ] M1.8.1.5: Handle XI-editor process failures and reconnection

**Acceptance Criteria**:
- ✅ All TextEditingPort methods implemented
- ✅ JSON-RPC latency <1ms for text operations
- ✅ Buffer state synchronized with XI-editor
- ✅ Event streaming works correctly

---

### M1.8.2: PitAdapter Implementation (4 days)

**Goal**: Implement PitPort adapter for direct in-process Pit access

**Deliverables**:
```rust
// src/pit.rs
pub struct PitAdapter {
    pool_manager: Arc<PoolManager>,
    dag_tracker: Arc<DagTracker>,
    artifact_store: Arc<ArtifactStore>,
    arbitration_engine: Arc<ArbitrationEngine>,
    stale_manager: Arc<StaleManager>,
}

#[async_trait]
impl PitPort for PitAdapter {
    async fn allocate_model(&self, spec: ModelSpec) -> PortResult<ModelHandle> {
        // Direct in-process call - no IPC overhead
        self.pool_manager.allocate(spec).await
            .map_err(|e| PortError::operation_failed(e.to_string()))
    }
    
    // ... other PitPort methods
}
```

**Tasks**:
- [ ] M1.8.2.1: Implement direct Pit component access
- [ ] M1.8.2.2: Create PitAdapter with all five Pit modules
- [ ] M1.8.2.3: Implement all PitPort methods
- [ ] M1.8.2.4: Add performance monitoring and metrics

**Acceptance Criteria**:
- ✅ All PitPort methods implemented
- ✅ Direct access achieves 50-100ns performance targets
- ✅ No IPC overhead for Pit operations
- ✅ Performance metrics available

---

### M1.8.3: ActorExtensionAdapter Implementation (5 days)

**Goal**: Implement ExtensionPort adapter with Actor model process isolation

**Deliverables**:
```rust
// src/extensions.rs
pub struct ActorExtensionAdapter {
    extension_processes: HashMap<ExtensionId, ExtensionActor>,
    message_bus: MessageBus,
    isolation_config: IsolationConfig,
}

pub struct ExtensionActor {
    process: tokio::process::Child,
    stdin: tokio::process::ChildStdin,
    stdout: tokio::process::ChildStdout,
    extension_type: ExtensionType,
}

#[async_trait]
impl ExtensionPort for ActorExtensionAdapter {
    async fn load(&self, manifest: ExtensionManifest) -> PortResult<ExtensionId> {
        let actor = ExtensionActor::spawn(manifest).await?;
        let extension_id = ExtensionId::new(manifest.id);
        self.extension_processes.insert(extension_id.clone(), actor);
        Ok(extension_id)
    }
    
    // ... other ExtensionPort methods
}
```

**Tasks**:
- [ ] M1.8.3.1: Implement ExtensionActor for process management
- [ ] M1.8.3.2: Create process isolation and sandboxing
- [ ] M1.8.3.3: Implement message passing system
- [ ] M1.8.3.4: Add crash detection and recovery
- [ ] M1.8.3.5: Implement all ExtensionPort methods

**Acceptance Criteria**:
- ✅ Extensions run in isolated processes
- ✅ Message passing works reliably
- ✅ Extension crashes don't affect Symphony
- ✅ Automatic recovery from failures

---

### M1.8.4: PythonConductorAdapter Implementation (4 days)

**Goal**: Implement ConductorPort adapter for Python Conductor subprocess

**Deliverables**:
```rust
// src/conductor.rs
pub struct PythonConductorAdapter {
    python_process: tokio::process::Child,
    pyo3_bridge: PyO3Bridge,
    pit_access: Arc<PitAdapter>,
}

#[async_trait]
impl ConductorPort for PythonConductorAdapter {
    async fn submit_decision(&self, context: DecisionContext) -> PortResult<Decision> {
        // Call Python Conductor via PyO3
        let decision = self.pyo3_bridge.call_python_method(
            "submit_decision", 
            context
        ).await?;
        Ok(decision)
    }
    
    // ... other ConductorPort methods
}
```

**Tasks**:
- [ ] M1.8.4.1: Implement Python subprocess management
- [ ] M1.8.4.2: Create PyO3 bridge integration
- [ ] M1.8.4.3: Provide direct Pit access to Conductor
- [ ] M1.8.4.4: Implement all ConductorPort methods

**Acceptance Criteria**:
- ✅ Python Conductor runs as subprocess
- ✅ PyO3 bridge works correctly
- ✅ Conductor has direct Pit access
- ✅ FFI overhead <0.01ms

---

### M1.8.5: Adapter Integration Tests (3 days)

**Goal**: Comprehensive integration tests for all adapters

**Tasks**:
- [ ] M1.8.5.1: Write XiEditorAdapter integration tests
- [ ] M1.8.5.2: Write PitAdapter integration tests
- [ ] M1.8.5.3: Write ActorExtensionAdapter integration tests
- [ ] M1.8.5.4: Write PythonConductorAdapter integration tests
- [ ] M1.8.5.5: Write cross-adapter integration tests

**Acceptance Criteria**:
- ✅ All adapters tested in isolation
- ✅ Cross-adapter interactions tested
- ✅ Performance targets validated
- ✅ Error handling tested

---

### M1.8.6: Performance Validation (2 days)

**Goal**: Validate all adapters meet performance targets

**Tasks**:
- [ ] M1.8.6.1: Benchmark XiEditorAdapter latency
- [ ] M1.8.6.2: Benchmark PitAdapter performance
- [ ] M1.8.6.3: Benchmark ActorExtensionAdapter throughput
- [ ] M1.8.6.4: Benchmark PythonConductorAdapter FFI overhead

**Acceptance Criteria**:
- ✅ XiEditorAdapter: <1ms JSON-RPC latency
- ✅ PitAdapter: 50-100ns allocation time
- ✅ ActorExtensionAdapter: Reliable message passing
- ✅ PythonConductorAdapter: <0.01ms FFI overhead

---

## 🎯 M1.9: Domain Core Orchestration `(NEW)`

**Crate**: `symphony-domain`
**Duration**: 3 weeks
**Dependencies**: M1.8 (Concrete Adapters)

**Goal**: Implement Symphony's orchestration engine that coordinates all components through port interfaces.

### M1.9.1: SymphonyCore Implementation (5 days)

**Goal**: Create the main orchestration engine using all four ports

**Deliverables**:
```rust
// src/core.rs
pub struct SymphonyCore {
    text_editing: Arc<dyn TextEditingPort>,
    pit: Arc<dyn PitPort>,
    extensions: Arc<dyn ExtensionPort>,
    conductor: Arc<dyn ConductorPort>,
    state: Arc<RwLock<SymphonyState>>,
}

impl SymphonyCore {
    pub async fn new() -> Result<Self, SymphonyError> {
        let text_editing = Arc::new(XiEditorAdapter::new().await?);
        let pit = Arc::new(PitAdapter::new().await?);
        let extensions = Arc::new(ActorExtensionAdapter::new().await?);
        let conductor = Arc::new(PythonConductorAdapter::new().await?);
        
        Ok(Self {
            text_editing,
            pit,
            extensions,
            conductor,
            state: Arc::new(RwLock::new(SymphonyState::new())),
        })
    }
    
    pub async fn process_user_action(&self, action: UserAction) -> Result<ActionResult, SymphonyError> {
        // 1. Send to Conductor for AI decision making
        let decision_context = DecisionContext::from_action(&action);
        let decision = self.conductor.submit_decision(decision_context).await?;
        
        // 2. Use The Pit for infrastructure needs
        if decision.needs_model {
            let model = self.pit.allocate_model(decision.model_spec).await?;
        }
        
        // 3. Execute file operations via XI-editor
        for file_op in decision.file_operations {
            self.execute_file_operation(file_op).await?;
        }
        
        // 4. Update UI via extensions
        for ui_update in decision.ui_updates {
            self.update_ui_component(ui_update).await?;
        }
        
        Ok(ActionResult::from_decision(decision))
    }
}
```

**Tasks**:
- [ ] M1.9.1.1: Implement SymphonyCore struct with all four ports
- [ ] M1.9.1.2: Create user action processing workflow
- [ ] M1.9.1.3: Implement file operation coordination
- [ ] M1.9.1.4: Add UI update coordination
- [ ] M1.9.1.5: Create error handling and recovery

**Acceptance Criteria**:
- ✅ SymphonyCore uses all four port interfaces
- ✅ User actions processed through complete workflow
- ✅ File operations coordinated with XI-editor
- ✅ UI updates coordinated with extensions

---

### M1.9.2: State Synchronization (4 days)

**Goal**: Maintain synchronized state between Symphony and XI-editor binaries

**Deliverables**:
```rust
// src/sync.rs
pub struct StateSynchronizer {
    symphony_state: Arc<RwLock<SymphonyState>>,
    xi_editor_adapter: Arc<XiEditorAdapter>,
    sync_events: broadcast::Sender<SyncEvent>,
}

impl StateSynchronizer {
    pub async fn sync_file_state(&self, file_path: &Path) -> Result<(), SyncError> {
        let symphony_state = self.symphony_state.read().await;
        let file_info = symphony_state.get_file_info(file_path)?;
        
        if file_info.needs_update {
            self.xi_editor_adapter.update_file(file_path, &file_info.content).await?;
        }
        
        Ok(())
    }
    
    pub async fn handle_xi_editor_event(&self, event: XiEvent) -> Result<(), SyncError> {
        match event {
            XiEvent::BufferChanged { buffer_id, content, revision } => {
                let mut symphony_state = self.symphony_state.write().await;
                symphony_state.update_buffer(buffer_id, content, revision);
            }
            // ... other events
        }
        Ok(())
    }
}
```

**Tasks**:
- [ ] M1.9.2.1: Implement StateSynchronizer
- [ ] M1.9.2.2: Create file state synchronization
- [ ] M1.9.2.3: Create buffer state synchronization
- [ ] M1.9.2.4: Handle XI-editor events
- [ ] M1.9.2.5: Handle Symphony state changes

**Acceptance Criteria**:
- ✅ File states synchronized between binaries
- ✅ Buffer states synchronized in real-time
- ✅ Events handled correctly
- ✅ Sync latency <10ms

---

### M1.9.3: Event Streaming (4 days)

**Goal**: Implement bidirectional event streaming between Symphony and XI-editor

**Deliverables**:
```rust
// src/events.rs
pub struct EventStreamer {
    symphony_events: broadcast::Sender<SymphonyEvent>,
    xi_editor_events: broadcast::Receiver<XiEvent>,
    conductor: Arc<dyn ConductorPort>,
}

impl EventStreamer {
    pub async fn start_event_streaming(&self) -> Result<(), EventError> {
        // Stream Symphony events to XI-editor
        let symphony_events = self.symphony_events.subscribe();
        tokio::spawn(async move {
            while let Ok(event) = symphony_events.recv().await {
                match event {
                    SymphonyEvent::FileSystemChange { path, change } => {
                        // Send to XI-editor
                    }
                    SymphonyEvent::ProjectStructureUpdate { structure } => {
                        // Update XI-editor project view
                    }
                }
            }
        });
        
        // Stream XI-editor events to Symphony
        let xi_events = self.xi_editor_events.resubscribe();
        let conductor = self.conductor.clone();
        tokio::spawn(async move {
            while let Ok(event) = xi_events.recv().await {
                match event {
                    XiEvent::BufferChanged { buffer_id, content } => {
                        conductor.analyze_code_change(buffer_id, content).await;
                    }
                    XiEvent::CursorMoved { buffer_id, position } => {
                        conductor.update_context(buffer_id, position).await;
                    }
                }
            }
        });
        
        Ok(())
    }
}
```

**Tasks**:
- [ ] M1.9.3.1: Implement EventStreamer
- [ ] M1.9.3.2: Create Symphony → XI-editor event streaming
- [ ] M1.9.3.3: Create XI-editor → Symphony event streaming
- [ ] M1.9.3.4: Add event filtering and routing
- [ ] M1.9.3.5: Handle event streaming failures

**Acceptance Criteria**:
- ✅ Bidirectional event streaming works
- ✅ Events delivered in real-time (<10ms)
- ✅ Event filtering works correctly
- ✅ Streaming failures handled gracefully

---

### M1.9.4: Process Lifecycle Management (3 days)

**Goal**: Manage lifecycle of Symphony and XI-editor processes

**Deliverables**:
```rust
// src/lifecycle.rs
pub struct ProcessLifecycleManager {
    symphony_config: SymphonyConfig,
    xi_editor_process: Option<XiEditorProcess>,
    health_monitor: HealthMonitor,
}

impl ProcessLifecycleManager {
    pub async fn start_xi_editor(&mut self) -> Result<(), LifecycleError> {
        let process = XiEditorProcess::spawn(&self.symphony_config.xi_editor).await?;
        self.xi_editor_process = Some(process);
        Ok(())
    }
    
    pub async fn ensure_processes_healthy(&mut self) -> Result<(), LifecycleError> {
        if let Some(ref mut xi_editor) = self.xi_editor_process {
            if !xi_editor.is_healthy().await {
                xi_editor.restart().await?;
            }
        }
        Ok(())
    }
}
```

**Tasks**:
- [ ] M1.9.4.1: Implement ProcessLifecycleManager
- [ ] M1.9.4.2: Create XI-editor process management
- [ ] M1.9.4.3: Add health monitoring
- [ ] M1.9.4.4: Implement process restart logic
- [ ] M1.9.4.5: Handle graceful shutdown

**Acceptance Criteria**:
- ✅ XI-editor process managed correctly
- ✅ Health monitoring detects failures
- ✅ Process restart works automatically
- ✅ Graceful shutdown implemented

---

### M1.9.5: Workflow Coordination (3 days)

**Goal**: Coordinate complex workflows across all components

**Deliverables**:
```rust
// src/workflows.rs
pub struct WorkflowCoordinator {
    symphony_core: Arc<SymphonyCore>,
    active_workflows: HashMap<WorkflowId, WorkflowExecution>,
}

impl WorkflowCoordinator {
    pub async fn execute_workflow(&mut self, workflow: Workflow) -> Result<WorkflowResult, WorkflowError> {
        let execution = WorkflowExecution::new(workflow);
        
        for step in execution.steps() {
            match step.component {
                WorkflowComponent::Conductor => {
                    let result = self.symphony_core.conductor.execute_step(step).await?;
                    execution.record_result(step.id, result);
                }
                WorkflowComponent::Pit => {
                    let result = self.symphony_core.pit.execute_step(step).await?;
                    execution.record_result(step.id, result);
                }
                WorkflowComponent::XiEditor => {
                    let result = self.symphony_core.text_editing.execute_step(step).await?;
                    execution.record_result(step.id, result);
                }
                WorkflowComponent::Extensions => {
                    let result = self.symphony_core.extensions.execute_step(step).await?;
                    execution.record_result(step.id, result);
                }
            }
        }
        
        Ok(execution.finalize())
    }
}
```

**Tasks**:
- [ ] M1.9.5.1: Implement WorkflowCoordinator
- [ ] M1.9.5.2: Create workflow execution engine
- [ ] M1.9.5.3: Add step-by-step coordination
- [ ] M1.9.5.4: Implement error handling and rollback
- [ ] M1.9.5.5: Add workflow monitoring

**Acceptance Criteria**:
- ✅ Complex workflows execute correctly
- ✅ All components coordinated properly
- ✅ Error handling and rollback work
- ✅ Workflow monitoring available

---

### M1.9.6: End-to-End Integration Tests (2 days)

**Goal**: Comprehensive integration tests for the complete system

**Tasks**:
- [ ] M1.9.6.1: Write complete user workflow tests
- [ ] M1.9.6.2: Write cross-component integration tests
- [ ] M1.9.6.3: Write failure scenario tests
- [ ] M1.9.6.4: Write performance integration tests

**Acceptance Criteria**:
- ✅ Complete user workflows tested
- ✅ All component interactions tested
- ✅ Failure scenarios handled correctly
- ✅ Performance targets met in integration

---

## 🖥️ M1.10: Tauri Integration Layer `(NEW)`

**Integration Structure**: `src-tauri/`
**Duration**: 3 weeks
**Dependencies**: M1.9 (Domain Core)

**Goal**: Integrate Symphony backend with Tauri frontend for complete application.

### M1.10.1: Tauri Command Definitions (5 days)

**Goal**: Define Tauri commands for all Symphony operations

**Deliverables**:
```rust
// src-tauri/src/commands/conductor.rs
#[tauri::command]
async fn submit_decision(
    state: tauri::State<'_, SymphonyCore>,
    context: DecisionContext
) -> Result<Decision, String> {
    state.conductor.submit_decision(context).await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn execute_workflow(
    state: tauri::State<'_, SymphonyCore>,
    workflow: Workflow
) -> Result<WorkflowResult, String> {
    state.execute_workflow(workflow).await
        .map_err(|e| e.to_string())
}

// src-tauri/src/commands/text_editing.rs
#[tauri::command]
async fn insert_text(
    state: tauri::State<'_, SymphonyCore>,
    buffer_id: String,
    pos: usize,
    text: String
) -> Result<u64, String> {
    let buffer_id = BufferId::new(buffer_id);
    let revision = state.text_editing.insert(buffer_id, pos, &text).await
        .map_err(|e| e.to_string())?;
    Ok(revision.0)
}

#[tauri::command]
async fn get_buffer_content(
    state: tauri::State<'_, SymphonyCore>,
    buffer_id: String
) -> Result<String, String> {
    let buffer_id = BufferId::new(buffer_id);
    let content = state.text_editing.get_content(buffer_id).await
        .map_err(|e| e.to_string())?;
    Ok(content.to_string())
}
```

**Tasks**:
- [ ] M1.10.1.1: Define Conductor operation commands
- [ ] M1.10.1.2: Define text editing operation commands
- [ ] M1.10.1.3: Define extension operation commands
- [ ] M1.10.1.4: Define workflow operation commands
- [ ] M1.10.1.5: Add command validation and error handling

**Acceptance Criteria**:
- ✅ All Symphony operations accessible via Tauri
- ✅ Type safety maintained across boundary
- ✅ Error handling provides clear feedback
- ✅ Command validation works correctly

---

### M1.10.2: State Management Integration (4 days)

**Goal**: Integrate Tauri state management with SymphonyCore

**Deliverables**:
```rust
// src-tauri/src/state.rs
pub struct AppState {
    symphony_core: Arc<SymphonyCore>,
    event_listeners: HashMap<String, EventListener>,
}

impl AppState {
    pub async fn new() -> Result<Self, AppError> {
        let symphony_core = Arc::new(SymphonyCore::new().await?);
        
        Ok(Self {
            symphony_core,
            event_listeners: HashMap::new(),
        })
    }
    
    pub fn symphony_core(&self) -> &Arc<SymphonyCore> {
        &self.symphony_core
    }
}

// src-tauri/src/main.rs
fn main() {
    let app_state = AppState::new().await.expect("Failed to initialize Symphony");
    
    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            submit_decision,
            execute_workflow,
            insert_text,
            get_buffer_content,
            // ... other commands
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Tasks**:
- [ ] M1.10.2.1: Implement AppState with SymphonyCore
- [ ] M1.10.2.2: Create state initialization
- [ ] M1.10.2.3: Add state management utilities
- [ ] M1.10.2.4: Implement state cleanup on shutdown

**Acceptance Criteria**:
- ✅ AppState manages SymphonyCore correctly
- ✅ State initialization works reliably
- ✅ State cleanup on shutdown works
- ✅ Thread safety maintained

---

### M1.10.3: Error Handling & Type Conversion (3 days)

**Goal**: Robust error handling and type conversion across Tauri boundary

**Deliverables**:
```rust
// src-tauri/src/errors.rs
#[derive(Debug, thiserror::Error)]
pub enum TauriError {
    #[error("Symphony error: {0}")]
    Symphony(#[from] SymphonyError),
    
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
    
    #[error("Invalid input: {0}")]
    InvalidInput(String),
}

impl From<TauriError> for String {
    fn from(error: TauriError) -> Self {
        error.to_string()
    }
}

// src-tauri/src/types.rs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TauriDecisionContext {
    pub situation: String,
    pub available_actions: Vec<String>,
    pub constraints: HashMap<String, serde_json::Value>,
}

impl From<TauriDecisionContext> for DecisionContext {
    fn from(tauri_context: TauriDecisionContext) -> Self {
        DecisionContext {
            situation: tauri_context.situation,
            available_actions: tauri_context.available_actions,
            constraints: tauri_context.constraints,
        }
    }
}
```

**Tasks**:
- [ ] M1.10.3.1: Implement comprehensive error types
- [ ] M1.10.3.2: Create type conversion utilities
- [ ] M1.10.3.3: Add input validation
- [ ] M1.10.3.4: Implement error serialization

**Acceptance Criteria**:
- ✅ All errors handled gracefully
- ✅ Type conversion works correctly
- ✅ Input validation prevents crashes
- ✅ Error messages are user-friendly

---

### M1.10.4: Event Streaming to Frontend (4 days)

**Goal**: Stream events from Symphony backend to Tauri frontend

**Deliverables**:
```rust
// src-tauri/src/events.rs
pub struct EventStreamer {
    app_handle: tauri::AppHandle,
    symphony_events: broadcast::Receiver<SymphonyEvent>,
}

impl EventStreamer {
    pub async fn start_streaming(&mut self) -> Result<(), EventError> {
        while let Ok(event) = self.symphony_events.recv().await {
            match event {
                SymphonyEvent::BufferChanged { buffer_id, content } => {
                    self.app_handle.emit_all("buffer-changed", BufferChangedPayload {
                        buffer_id: buffer_id.to_string(),
                        content,
                    })?;
                }
                SymphonyEvent::WorkflowProgress { workflow_id, progress } => {
                    self.app_handle.emit_all("workflow-progress", WorkflowProgressPayload {
                        workflow_id: workflow_id.to_string(),
                        progress,
                    })?;
                }
                // ... other events
            }
        }
        Ok(())
    }
}

#[tauri::command]
async fn subscribe_to_events(
    app_handle: tauri::AppHandle,
    state: tauri::State<'_, AppState>
) -> Result<(), String> {
    let events = state.symphony_core().subscribe_to_events().await
        .map_err(|e| e.to_string())?;
    
    let mut streamer = EventStreamer {
        app_handle,
        symphony_events: events,
    };
    
    tokio::spawn(async move {
        streamer.start_streaming().await;
    });
    
    Ok(())
}
```

**Tasks**:
- [ ] M1.10.4.1: Implement EventStreamer
- [ ] M1.10.4.2: Create event subscription system
- [ ] M1.10.4.3: Add event filtering and routing
- [ ] M1.10.4.4: Handle event streaming failures

**Acceptance Criteria**:
- ✅ Events streamed to frontend in real-time
- ✅ Event filtering works correctly
- ✅ Streaming failures handled gracefully
- ✅ Frontend receives all relevant events

---

### M1.10.5: Frontend-Backend Synchronization (3 days)

**Goal**: Maintain synchronization between frontend and backend state

**Deliverables**:
```rust
// src-tauri/src/sync.rs
pub struct FrontendSynchronizer {
    app_handle: tauri::AppHandle,
    symphony_core: Arc<SymphonyCore>,
    sync_interval: Duration,
}

impl FrontendSynchronizer {
    pub async fn start_sync_loop(&self) -> Result<(), SyncError> {
        let mut interval = tokio::time::interval(self.sync_interval);
        
        loop {
            interval.tick().await;
            
            // Sync application state
            let app_state = self.symphony_core.get_application_state().await?;
            self.app_handle.emit_all("app-state-sync", app_state)?;
            
            // Sync buffer states
            let buffer_states = self.symphony_core.get_all_buffer_states().await?;
            self.app_handle.emit_all("buffer-states-sync", buffer_states)?;
            
            // Sync workflow states
            let workflow_states = self.symphony_core.get_workflow_states().await?;
            self.app_handle.emit_all("workflow-states-sync", workflow_states)?;
        }
    }
}

#[tauri::command]
async fn sync_frontend_state(
    state: tauri::State<'_, AppState>
) -> Result<FrontendState, String> {
    let symphony_state = state.symphony_core().get_complete_state().await
        .map_err(|e| e.to_string())?;
    
    Ok(FrontendState::from(symphony_state))
}
```

**Tasks**:
- [ ] M1.10.5.1: Implement FrontendSynchronizer
- [ ] M1.10.5.2: Create periodic state synchronization
- [ ] M1.10.5.3: Add on-demand synchronization
- [ ] M1.10.5.4: Handle synchronization conflicts

**Acceptance Criteria**:
- ✅ Frontend and backend state synchronized
- ✅ Periodic sync works correctly
- ✅ On-demand sync available
- ✅ Sync conflicts resolved properly

---

### M1.10.6: Tauri Integration Tests (2 days)

**Goal**: Comprehensive tests for Tauri integration

**Tasks**:
- [ ] M1.10.6.1: Write Tauri command tests
- [ ] M1.10.6.2: Write event streaming tests
- [ ] M1.10.6.3: Write state synchronization tests
- [ ] M1.10.6.4: Write error handling tests

**Acceptance Criteria**:
- ✅ All Tauri commands tested
- ✅ Event streaming tested
- ✅ State synchronization tested
- ✅ Error scenarios tested

---

## 🎭 M1.11: Actor Layer Implementation `(NEW)`

**Crate**: `symphony-actors`
**Duration**: 3 weeks
**Dependencies**: M1.7 (Extension SDK), M1.8 (Concrete Adapters)

**Goal**: Implement Actor model for extension process isolation and management.

### M1.11.1: Actor Trait Implementation (4 days)

**Goal**: Define and implement core Actor trait for extension processes

**Deliverables**:
```rust
// src/actor.rs
#[async_trait]
pub trait Actor: Send + Sync {
    async fn start(&mut self) -> Result<(), ActorError>;
    async fn stop(&mut self) -> Result<(), ActorError>;
    async fn send_message(&self, message: ActorMessage) -> Result<(), ActorError>;
    async fn receive_message(&mut self) -> Result<ActorMessage, ActorError>;
    fn is_running(&self) -> bool;
    fn actor_id(&self) -> &ActorId;
}

pub struct ExtensionActor {
    id: ActorId,
    process: Option<tokio::process::Child>,
    stdin: Option<tokio::process::ChildStdin>,
    stdout: Option<tokio::process::ChildStdout>,
    manifest: ExtensionManifest,
    state: ActorState,
}

#[async_trait]
impl Actor for ExtensionActor {
    async fn start(&mut self) -> Result<(), ActorError> {
        let mut cmd = tokio::process::Command::new("symphony-extension-runner");
        cmd.arg("--manifest").arg(&self.manifest.path);
        cmd.stdin(Stdio::piped());
        cmd.stdout(Stdio::piped());
        cmd.stderr(Stdio::piped());
        
        let mut process = cmd.spawn()?;
        self.stdin = process.stdin.take();
        self.stdout = process.stdout.take();
        self.process = Some(process);
        self.state = ActorState::Running;
        
        Ok(())
    }
    
    // ... other Actor methods
}
```

**Tasks**:
- [ ] M1.11.1.1: Define Actor trait interface
- [ ] M1.11.1.2: Implement ExtensionActor struct
- [ ] M1.11.1.3: Create actor lifecycle management
- [ ] M1.11.1.4: Add actor state tracking
- [ ] M1.11.1.5: Implement actor message handling

**Acceptance Criteria**:
- ✅ Actor trait well-defined and flexible
- ✅ ExtensionActor implements all methods
- ✅ Lifecycle management works correctly
- ✅ State tracking is accurate

---

### M1.11.2: Process Spawning & Management (4 days)

**Goal**: Robust process spawning and management for extension actors

**Deliverables**:
```rust
// src/process.rs
pub struct ProcessManager {
    actors: HashMap<ActorId, Box<dyn Actor>>,
    process_configs: HashMap<ExtensionType, ProcessConfig>,
    resource_monitor: ResourceMonitor,
}

pub struct ProcessConfig {
    pub memory_limit: usize,
    pub cpu_limit: f64,
    pub timeout: Duration,
    pub restart_policy: RestartPolicy,
}

impl ProcessManager {
    pub async fn spawn_extension(&mut self, manifest: ExtensionManifest) -> Result<ActorId, ProcessError> {
        let config = self.process_configs.get(&manifest.extension_type)
            .cloned()
            .unwrap_or_default();
        
        let mut actor = ExtensionActor::new(manifest, config);
        actor.start().await?;
        
        let actor_id = actor.actor_id().clone();
        self.actors.insert(actor_id.clone(), Box::new(actor));
        
        // Start resource monitoring
        self.resource_monitor.start_monitoring(&actor_id).await?;
        
        Ok(actor_id)
    }
    
    pub async fn terminate_extension(&mut self, actor_id: &ActorId) -> Result<(), ProcessError> {
        if let Some(mut actor) = self.actors.remove(actor_id) {
            actor.stop().await?;
            self.resource_monitor.stop_monitoring(actor_id).await?;
        }
        Ok(())
    }
}
```

**Tasks**:
- [ ] M1.11.2.1: Implement ProcessManager
- [ ] M1.11.2.2: Create process configuration system
- [ ] M1.11.2.3: Add resource monitoring
- [ ] M1.11.2.4: Implement process termination
- [ ] M1.11.2.5: Add restart policies

**Acceptance Criteria**:
- ✅ Process spawning works reliably
- ✅ Resource limits enforced
- ✅ Process termination is clean
- ✅ Restart policies work correctly

---

### M1.11.3: Message Passing System (5 days)

**Goal**: Reliable message passing between Symphony and extension actors

**Deliverables**:
```rust
// src/messaging.rs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ActorMessage {
    Request {
        id: MessageId,
        method: String,
        params: serde_json::Value,
    },
    Response {
        id: MessageId,
        result: Result<serde_json::Value, String>,
    },
    Notification {
        method: String,
        params: serde_json::Value,
    },
    Heartbeat,
    Shutdown,
}

pub struct MessageBus {
    actors: HashMap<ActorId, mpsc::Sender<ActorMessage>>,
    pending_requests: HashMap<MessageId, oneshot::Sender<ActorMessage>>,
    message_timeout: Duration,
}

impl MessageBus {
    pub async fn send_request(&self, actor_id: &ActorId, method: String, params: serde_json::Value) -> Result<serde_json::Value, MessageError> {
        let message_id = MessageId::new();
        let (tx, rx) = oneshot::channel();
        
        self.pending_requests.insert(message_id.clone(), tx);
        
        let message = ActorMessage::Request {
            id: message_id,
            method,
            params,
        };
        
        if let Some(sender) = self.actors.get(actor_id) {
            sender.send(message).await?;
        } else {
            return Err(MessageError::ActorNotFound(actor_id.clone()));
        }
        
        let response = tokio::time::timeout(self.message_timeout, rx).await??;
        
        match response {
            ActorMessage::Response { result, .. } => result.map_err(MessageError::RemoteError),
            _ => Err(MessageError::InvalidResponse),
        }
    }
}
```

**Tasks**:
- [ ] M1.11.3.1: Define ActorMessage types
- [ ] M1.11.3.2: Implement MessageBus
- [ ] M1.11.3.3: Add request/response correlation
- [ ] M1.11.3.4: Implement message timeouts
- [ ] M1.11.3.5: Add message serialization

**Acceptance Criteria**:
- ✅ Message passing works reliably
- ✅ Request/response correlation works
- ✅ Timeouts prevent hanging
- ✅ Serialization handles all types

---

### M1.11.4: Process Isolation & Sandboxing (4 days)

**Goal**: Secure process isolation and sandboxing for extension actors

**Deliverables**:
```rust
// src/isolation.rs
pub struct ProcessSandbox {
    filesystem_restrictions: Vec<PathBuf>,
    network_restrictions: NetworkPolicy,
    resource_limits: ResourceLimits,
}

pub struct ResourceLimits {
    pub max_memory: usize,
    pub max_cpu_percent: f64,
    pub max_file_descriptors: u32,
    pub max_execution_time: Duration,
}

impl ProcessSandbox {
    pub fn apply_restrictions(&self, cmd: &mut tokio::process::Command) -> Result<(), SandboxError> {
        // Apply filesystem restrictions
        for restricted_path in &self.filesystem_restrictions {
            // Platform-specific implementation
            #[cfg(unix)]
            self.apply_unix_restrictions(cmd, restricted_path)?;
            
            #[cfg(windows)]
            self.apply_windows_restrictions(cmd, restricted_path)?;
        }
        
        // Apply resource limits
        self.apply_resource_limits(cmd)?;
        
        // Apply network restrictions
        self.apply_network_restrictions(cmd)?;
        
        Ok(())
    }
    
    #[cfg(unix)]
    fn apply_unix_restrictions(&self, cmd: &mut tokio::process::Command, path: &Path) -> Result<(), SandboxError> {
        // Use chroot, namespaces, or similar
        // Implementation depends on platform capabilities
        Ok(())
    }
    
    #[cfg(windows)]
    fn apply_windows_restrictions(&self, cmd: &mut tokio::process::Command, path: &Path) -> Result<(), SandboxError> {
        // Use Job Objects or similar Windows mechanisms
        Ok(())
    }
}
```

**Tasks**:
- [ ] M1.11.4.1: Implement ProcessSandbox
- [ ] M1.11.4.2: Add filesystem restrictions
- [ ] M1.11.4.3: Add network restrictions
- [ ] M1.11.4.4: Add resource limits
- [ ] M1.11.4.5: Platform-specific implementations

**Acceptance Criteria**:
- ✅ Extensions cannot access restricted files
- ✅ Network access controlled properly
- ✅ Resource limits enforced
- ✅ Platform-specific features work

---

### M1.11.5: Crash Detection & Recovery (3 days)

**Goal**: Detect extension crashes and implement recovery mechanisms

**Deliverables**:
```rust
// src/recovery.rs
pub struct CrashDetector {
    monitored_actors: HashMap<ActorId, ActorMonitor>,
    recovery_policies: HashMap<ExtensionType, RecoveryPolicy>,
}

pub struct ActorMonitor {
    actor_id: ActorId,
    last_heartbeat: Instant,
    crash_count: u32,
    health_check_interval: Duration,
}

pub enum RecoveryPolicy {
    Restart { max_attempts: u32, backoff: Duration },
    Disable,
    Notify,
}

impl CrashDetector {
    pub async fn start_monitoring(&mut self) -> Result<(), RecoveryError> {
        let mut interval = tokio::time::interval(Duration::from_secs(1));
        
        loop {
            interval.tick().await;
            
            for (actor_id, monitor) in &mut self.monitored_actors {
                if monitor.last_heartbeat.elapsed() > monitor.health_check_interval {
                    self.handle_potential_crash(actor_id.clone()).await?;
                }
            }
        }
    }
    
    async fn handle_potential_crash(&mut self, actor_id: ActorId) -> Result<(), RecoveryError> {
        if let Some(monitor) = self.monitored_actors.get_mut(&actor_id) {
            monitor.crash_count += 1;
            
            // Get recovery policy for this extension type
            if let Some(policy) = self.recovery_policies.get(&monitor.extension_type) {
                match policy {
                    RecoveryPolicy::Restart { max_attempts, backoff } => {
                        if monitor.crash_count <= *max_attempts {
                            tokio::time::sleep(*backoff).await;
                            self.restart_actor(&actor_id).await?;
                        } else {
                            self.disable_actor(&actor_id).await?;
                        }
                    }
                    RecoveryPolicy::Disable => {
                        self.disable_actor(&actor_id).await?;
                    }
                    RecoveryPolicy::Notify => {
                        self.notify_crash(&actor_id).await?;
                    }
                }
            }
        }
        
        Ok(())
    }
}
```

**Tasks**:
- [ ] M1.11.5.1: Implement CrashDetector
- [ ] M1.11.5.2: Add heartbeat monitoring
- [ ] M1.11.5.3: Implement recovery policies
- [ ] M1.11.5.4: Add crash notification system
- [ ] M1.11.5.5: Create crash logging and metrics

**Acceptance Criteria**:
- ✅ Crashes detected within 5 seconds
- ✅ Recovery policies work correctly
- ✅ Restart attempts respect limits
- ✅ Crash metrics collected

---

### M1.11.6: Actor System Tests (2 days)

**Goal**: Comprehensive tests for the actor system

**Tasks**:
- [ ] M1.11.6.1: Write actor lifecycle tests
- [ ] M1.11.6.2: Write message passing tests
- [ ] M1.11.6.3: Write isolation and sandboxing tests
- [ ] M1.11.6.4: Write crash recovery tests
- [ ] M1.11.6.5: Write performance tests

**Acceptance Criteria**:
- ✅ All actor functionality tested
- ✅ Message passing reliability verified
- ✅ Isolation effectiveness tested
- ✅ Recovery mechanisms validated
- ✅ Performance targets met

---

## 📊 Updated M1 Summary

| Sub-Milestone | Tasks | Duration | Status |
|---------------|-------|----------|--------|
| **Original M1 Components** | | | |
| M1.1.x Port Definitions | 34 | 2 weeks | 🚧 |
| M1.2.x Two-Binary Architecture | 36 | 3 weeks | 📋 |
| M1.3.x IPC Protocol | 63 | 3 weeks | 📋 |
| M1.4.x Transport Layer | 26 | 3 weeks | 📋 |
| M1.5.x Message Bus | 30 | 3 weeks | 📋 |
| M1.6.x Python Bridge | 30 | 3 weeks | 📋 |
| M1.7.x Extension SDK | 30 | 3 weeks | 📋 |
| **NEW H2A2 Components** | | | |
| **M1.8.x Concrete Adapters** | **23** | **4 weeks** | **📋** |
| **M1.9.x Domain Core** | **21** | **3 weeks** | **📋** |
| **M1.10.x Tauri Integration** | **21** | **3 weeks** | **📋** |
| **M1.11.x Actor Layer** | **24** | **3 weeks** | **📋** |

**Total Tasks**: ~350 detailed tasks (including M1.0 sy-commons Foundation)
**Total Duration**: 36 weeks (with parallelization: ~22 weeks)

**Critical Path**: M1.0 sy-commons Foundation → M1.1-M1.11 (all other M1 sub-milestones depend on M1.0)

**H2A2 Architecture Now Complete**:
- ✅ **Hexagonal Ports**: Defined in M1.1 (symphony-core-ports)
- ✅ **Concrete Adapters**: Implemented in M1.8 (symphony-adapters)
- ✅ **Domain Core**: Orchestration in M1.9 (symphony-domain)
- ✅ **Actor Layer**: Process isolation in M1.11 (symphony-actors)

**Two-Binary Architecture Fully Specified**:
- ✅ **Symphony Binary**: Tauri + Conductor + Pit + Domain Core + Adapters
- ✅ **XI-editor Binary**: Standalone text editor with JSON-RPC
- ✅ **Synchronization**: Bidirectional event streaming and state sync
- ✅ **Integration**: Complete Tauri frontend integration

The milestone structure now fully addresses the H2A2 architecture gaps and provides a complete implementation path for Symphony's two-binary architecture with proper frontend-backend integration.