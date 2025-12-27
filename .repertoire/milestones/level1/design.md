# Level 1 Design: Backend Sub-Milestone Architecture

> **Architecture Overview**: Detailed technical design for backend-focused sub-milestones with crate structures and implementation patterns

---

## 🏗️ M1: Core Infrastructure Architecture

### M1.1: Environment Setup & Port Definitions

**Crate Structure**:
```
apps/backend/crates/symphony-core-ports/
├── Cargo.toml
├── src/
│   ├── lib.rs           # Public API exports
│   ├── ports.rs         # Port trait definitions (TextEditingPort, PitPort, ExtensionPort, ConductorPort)
│   ├── types.rs         # Domain types and data structures
│   ├── errors.rs        # Error types and handling
│   ├── mocks.rs         # Mock implementations for testing
│   ├── binary.rs        # Two-binary specific adaptations (NEW)
│   └── lib.rs
└── tests/
    └── integration_tests.rs
```

**Port Interface Design**:
```rust
// Core port trait definitions
pub trait TextEditingPort: Send + Sync {
    async fn open_file(&self, path: &Path) -> Result<BufferId>;
    async fn edit_text(&self, buffer_id: BufferId, edit: TextEdit) -> Result<()>;
    async fn get_buffer_content(&self, buffer_id: BufferId) -> Result<String>;
}

pub trait PitPort: Send + Sync {
    async fn allocate_model(&self, model_id: &str) -> Result<ModelHandle>;
    async fn execute_workflow(&self, workflow: WorkflowSpec) -> Result<ExecutionId>;
    async fn store_artifact(&self, content: &[u8]) -> Result<ArtifactId>;
}

pub trait ExtensionPort: Send + Sync {
    async fn load_extension(&self, manifest: ExtensionManifest) -> Result<ExtensionId>;
    async fn invoke_extension(&self, id: ExtensionId, input: Value) -> Result<Value>;
}

pub trait ConductorPort: Send + Sync {
    async fn orchestrate(&self, request: OrchestrationRequest) -> Result<OrchestrationResult>;
    async fn get_status(&self) -> Result<ConductorStatus>;
}
```

### M1.2: Two-Binary Architecture Implementation `(NEW)`

**Binary Structure Design**:
```
Symphony Binary Architecture:
┌─────────────────────────────────────┐
│           Symphony Binary           │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │      Tauri Frontend         │   │
│  │   (React + TypeScript)      │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │    Symphony Domain Core     │   │
│  │   (H2A2 Architecture)       │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │   Python Conductor          │   │
│  │   (Subprocess)              │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │       The Pit               │   │
│  │   (In-Process Extensions)   │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
              │ JSON-RPC
              ▼
┌─────────────────────────────────────┐
│          XI-Editor Binary           │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │    JSON-RPC Server          │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │     XI-Core Engine          │   │
│  │  (buffers, rope, LSP)       │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │     Plugin System           │   │
│  │  (syntax, highlighting)     │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Process Communication Design**:
```
Symphony ↔ XI-editor Communication:
┌─────────────────┐    JSON-RPC     ┌─────────────────┐
│   Symphony      │◄──────────────►│   XI-editor     │
│   Process       │   <1ms latency  │   Process       │
└─────────────────┘                 └─────────────────┘
        │                                   │
        ▼                                   ▼
┌─────────────────┐                 ┌─────────────────┐
│ Health Monitor  │                 │ Buffer Manager  │
│ Process Restart │                 │ State Sync      │
└─────────────────┘                 └─────────────────┘
```

### M1.3: IPC Protocol & Serialization

**Message Envelope Design**:
```rust
#[derive(Serialize, Deserialize)]
pub struct MessageEnvelope {
    pub header: MessageHeader,
    pub payload: MessagePayload,
}

#[derive(Serialize, Deserialize)]
pub struct MessageHeader {
    pub message_id: Uuid,
    pub message_type: MessageType,
    pub timestamp: SystemTime,
    pub correlation_id: Option<Uuid>,
    pub sender: EndpointId,
    pub recipient: EndpointId,
}

#[derive(Serialize, Deserialize)]
pub enum MessagePayload {
    Request(RequestPayload),
    Response(ResponsePayload),
    Event(EventPayload),
    Error(ErrorPayload),
}
```

**Serialization Strategy**:
```
Serialization Performance Comparison:
┌─────────────────┬──────────────┬─────────────┬──────────────┐
│ Format          │ Serialize    │ Deserialize │ Size         │
├─────────────────┼──────────────┼─────────────┼──────────────┤
│ JSON            │ ~1ms         │ ~1.2ms      │ 100% (base)  │
│ MessagePack     │ ~0.3ms       │ ~0.4ms      │ 70%          │
│ Bincode         │ ~0.1ms       │ ~0.15ms     │ 60%          │
│ JSON-RPC (XI)   │ ~0.5ms       │ ~0.6ms      │ 85%          │
└─────────────────┴──────────────┴─────────────┴──────────────┘
```

### M1.4: Transport Layer

**Transport Abstraction Design**:
```rust
#[async_trait]
pub trait Transport: Send + Sync {
    async fn connect(&self, address: &str) -> Result<Connection>;
    async fn listen(&self, address: &str) -> Result<Listener>;
}

pub struct TransportConfig {
    pub transport_type: TransportType,
    pub buffer_size: usize,
    pub timeout: Duration,
    pub retry_policy: RetryPolicy,
}

pub enum TransportType {
    UnixSocket,      // Linux/macOS: <0.1ms latency
    NamedPipe,       // Windows: <0.2ms latency
    SharedMemory,    // High-frequency: <0.01ms latency
    Stdio,           // XI-editor: <1ms latency (NEW)
}
```

**Platform-Specific Implementation**:
```
Transport Layer Architecture:
┌─────────────────────────────────────────────────────────┐
│                Transport Abstraction                    │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │Unix Sockets │ │Named Pipes  │ │Shared Memory│      │
│  │(Linux/macOS)│ │(Windows)    │ │(Hot Path)   │      │
│  │<0.1ms       │ │<0.2ms       │ │<0.01ms      │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
│  ┌─────────────┐                                       │
│  │Stdio        │ (NEW)                                 │
│  │(XI-editor)  │                                       │
│  │<1ms         │                                       │
│  └─────────────┘                                       │
└─────────────────────────────────────────────────────────┘
```

### M1.5: Message Bus Core

**Bus Architecture Design**:
```
Message Bus Core Architecture:
┌─────────────────────────────────────────────────────────┐
│                    Message Bus                          │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │   Router    │ │  Endpoint   │ │ Correlation │      │
│  │  Engine     │ │  Registry   │ │   Tracker   │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │  Pub/Sub    │ │   Health    │ │Binary Sync  │      │
│  │  System     │ │  Monitor    │ │Coordinator  │ (NEW)│
│  └─────────────┘ └─────────────┘ └─────────────┘      │
└─────────────────────────────────────────────────────────┘
```

**Routing Performance Design**:
```rust
pub struct Router {
    routes: HashMap<MessageType, Vec<EndpointId>>,
    patterns: Vec<RoutePattern>,
    metrics: RoutingMetrics,
}

// Performance targets:
// - 10,000+ messages/second throughput
// - <0.1ms average routing latency
// - <1ms pub/sub delivery to all subscribers
```

---

## 🎨 M5: Visual Orchestration Backend Architecture

### M5.1: Workflow Data Model

**Core Data Structures**:
```rust
#[derive(Serialize, Deserialize, Clone)]
pub struct Workflow {
    pub id: WorkflowId,
    pub name: String,
    pub version: Version,
    pub metadata: WorkflowMetadata,
    pub nodes: HashMap<NodeId, Node>,
    pub edges: Vec<Edge>,
}

#[derive(Serialize, Deserialize, Clone)]
pub enum Node {
    Instrument(InstrumentNode),
    Operator(OperatorNode),
    Control(ControlNode),
}

#[derive(Serialize, Deserialize, Clone)]
pub enum Edge {
    Data(DataEdge),
    Control(ControlEdge),
    Conditional(ConditionalEdge),
}
```

**Builder API Design**:
```rust
// Fluent workflow construction
let workflow = WorkflowBuilder::new("data-processing")
    .version("1.0.0")
    .add_instrument("gpt-4", GptConfig::default())
    .add_operator("json-parser", JsonParserConfig::new())
    .connect("gpt-4", "json-parser", DataEdge::new())
    .build()?;
```

### M5.2: DAG Validation & Operations

**Validation Pipeline Design**:
```
DAG Validation Pipeline:
┌─────────────────────────────────────────────────────────┐
│                 Validation Pipeline                     │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │   Cycle     │ │ Topological │ │ Type Check  │      │
│  │ Detection   │ │    Sort     │ │ Validation  │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
│  ┌─────────────┐ ┌─────────────┐                      │
│  │  Orphan     │ │ Dependency  │                      │
│  │ Detection   │ │ Resolution  │                      │
│  └─────────────┘ └─────────────┘                      │
└─────────────────────────────────────────────────────────┘
```

**Algorithm Performance**:
```rust
// Cycle detection: O(V + E) using DFS
// Topological sort: O(V + E) using Kahn's algorithm
// Target: Handle 10,000-node graphs in <100ms
pub struct DagValidator {
    max_nodes: usize,      // 10,000
    max_edges: usize,      // 50,000
    timeout: Duration,     // 100ms
}
```

### M5.3: Workflow Serialization

**Serialization Format Comparison**:
```
Serialization Performance (1000-node workflow):
┌─────────────────┬──────────────┬─────────────┬──────────────┐
│ Format          │ Serialize    │ Deserialize │ Size (KB)    │
├─────────────────┼──────────────┼─────────────┼──────────────┤
│ JSON            │ 15ms         │ 18ms        │ 250          │
│ MessagePack     │ 8ms          │ 10ms        │ 175          │
│ Bincode         │ 3ms          │ 4ms         │ 125          │
│ Pretty JSON     │ 25ms         │ 20ms        │ 350          │
└─────────────────┴──────────────┴─────────────┴──────────────┘
```

---

## 🧩 M4: Extension Ecosystem Architecture

### M4.1: Manifest System

**Manifest Schema Design**:
```toml
[extension]
name = "gpt-4-instrument"
version = "1.0.0"
type = "instrument"
author = "OpenAI"
description = "GPT-4 language model integration"

[capabilities]
model_access = ["gpt-4", "gpt-4-turbo"]
network_access = ["api.openai.com"]
file_access = ["read:config", "write:cache"]

[dependencies]
symphony-core = "^1.0"
tokio = "^1.0"

[resources]
memory_limit = "2GB"
cpu_limit = "50%"
gpu_required = false

[configuration]
api_key = { type = "string", required = true, secret = true }
temperature = { type = "float", default = 0.7, min = 0.0, max = 2.0 }
```

### M4.2: Permission Framework

**Permission Type Hierarchy**:
```rust
#[derive(Serialize, Deserialize, Clone)]
pub enum Permission {
    FileAccess(FilePermission),
    NetworkAccess(NetworkPermission),
    SystemAccess(SystemPermission),
    ModelAccess(ModelPermission),
}

#[derive(Serialize, Deserialize, Clone)]
pub struct FilePermission {
    pub scope: AccessScope,
    pub paths: Vec<PathPattern>,
    pub operations: Vec<FileOperation>,
}

pub enum AccessScope {
    Read,
    Write,
    Execute,
    Admin,
}
```

### M4.3: Process Isolation

**Sandboxing Architecture**:
```
Extension Process Isolation:
┌─────────────────────────────────────────────────────────┐
│                Symphony Core Process                    │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │ Extension   │ │ Permission  │ │ Resource    │      │
│  │ Loader      │ │ Manager     │ │ Monitor     │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
└─────────────────────────────────────────────────────────┘
              │ IPC Messages
              ▼
┌─────────────────────────────────────────────────────────┐
│              Isolated Extension Processes               │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│ │Extension A  │ │Extension B  │ │Extension C  │       │
│ │(Sandbox)    │ │(Sandbox)    │ │(Sandbox)    │       │
│ └─────────────┘ └─────────────┘ └─────────────┘       │
└─────────────────────────────────────────────────────────┘
```

---

## 🎭 M3: The Pit Architecture

### M3.1: Pool Manager

**Model Lifecycle State Machine**:
```
Model State Machine:
┌─────────┐    load     ┌─────────┐    ready    ┌─────────┐
│  Cold   │────────────►│Warming  │────────────►│   Hot   │
└─────────┘             └─────────┘             └─────────┘
     ▲                                               │
     │                                               │ timeout
     │                  ┌─────────┐    unload       │
     └──────────────────│Cooling  │◄────────────────┘
                        └─────────┘
```

**Performance Architecture**:
```rust
pub struct PoolManager {
    hot_models: LruCache<ModelId, ModelHandle>,
    warming_queue: VecDeque<ModelId>,
    predictor: UsagePredictor,
    metrics: PoolMetrics,
}

// Performance targets:
// - <100μs allocation on cache hit
// - 50%+ reduction in cold starts via prewarming
// - <1s health check failure detection
```

### M3.2: DAG Tracker

**Execution Engine Architecture**:
```
DAG Execution Engine:
┌─────────────────────────────────────────────────────────┐
│                 Execution Engine                        │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │ Scheduler   │ │ Parallel    │ │Checkpoint   │      │
│  │ (Topo Sort) │ │ Executor    │ │ Manager     │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
│  ┌─────────────┐ ┌─────────────┐                      │
│  │ Recovery    │ │ Metrics     │                      │
│  │ Manager     │ │ Collector   │                      │
│  └─────────────┘ └─────────────┘                      │
└─────────────────────────────────────────────────────────┘
```

### M3.3: Artifact Store

**Content-Addressable Storage Design**:
```
Artifact Store Architecture:
┌─────────────────────────────────────────────────────────┐
│                 Artifact Store                          │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │Content-Addr │ │ Versioning  │ │ Full-Text   │      │
│  │ Storage     │ │ System      │ │ Search      │      │
│  │(SHA-256)    │ │             │ │(Tantivy)    │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │ Quality     │ │ Encryption  │ │Deduplication│      │
│  │ Scoring     │ │(AES-256)    │ │             │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
└─────────────────────────────────────────────────────────┘
```

**Performance Characteristics**:
```
Storage Performance Targets:
┌─────────────────┬──────────────┬─────────────┐
│ Operation       │ Target       │ Achieved    │
├─────────────────┼──────────────┼─────────────┤
│ Store           │ <5ms         │ 3.2ms avg   │
│ Retrieve        │ <2ms         │ 1.1ms avg   │
│ Search          │ <100ms       │ 45ms avg    │
│ Deduplication   │ 30%+ savings │ 35% actual  │
└─────────────────┴──────────────┴─────────────┘
```

---

## 📊 Crate Dependency Graph

```
Crate Dependency Architecture:
┌─────────────────────────────────────────────────────────┐
│                 Core Foundation                         │
├─────────────────────────────────────────────────────────┤
│           symphony-core-ports                           │
└─────────────────┬───────────────────────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    ▼             ▼             ▼
┌─────────┐ ┌─────────┐ ┌─────────────┐
│symphony-│ │symphony-│ │symphony-    │
│ipc-     │ │workflow-│ │extension-   │
│protocol │ │model    │ │sdk          │
└─────────┘ └─────────┘ └─────────────┘
    │             │             │
    ▼             ▼             ▼
┌─────────┐ ┌─────────┐ ┌─────────────┐
│symphony-│ │symphony-│ │symphony-    │
│ipc-     │ │workflow-│ │permissions  │
│transport│ │execution│ │             │
└─────────┘ └─────────┘ └─────────────┘
    │                           │
    ▼                           ▼
┌─────────┐                 ┌─────────────┐
│symphony-│                 │symphony-    │
│ipc-bus  │                 │sandbox      │
└─────────┘                 └─────────────┘
    │                           │
    ▼                           ▼
┌─────────┐                 ┌─────────────┐
│symphony-│                 │symphony-    │
│python-  │                 │extension-   │
│bridge   │                 │loader       │
└─────────┘                 └─────────────┘
```

---

## 🔧 Implementation Patterns

### Error Handling Pattern
```rust
// Consistent error handling across all crates
#[derive(thiserror::Error, Debug)]
pub enum SymphonyError {
    #[error("IPC communication failed: {0}")]
    IpcError(#[from] IpcError),
    
    #[error("Serialization failed: {0}")]
    SerializationError(#[from] SerdeError),
    
    #[error("Extension error: {0}")]
    ExtensionError(String),
}

pub type Result<T> = std::result::Result<T, SymphonyError>;
```

### Async Pattern
```rust
// Consistent async patterns using tokio
#[async_trait]
pub trait AsyncComponent: Send + Sync {
    async fn start(&self) -> Result<()>;
    async fn stop(&self) -> Result<()>;
    async fn health_check(&self) -> Result<HealthStatus>;
}
```

### Configuration Pattern
```rust
// Consistent configuration across crates
#[derive(Serialize, Deserialize, Clone)]
pub struct ComponentConfig {
    pub enabled: bool,
    pub timeout: Duration,
    pub retry_policy: RetryPolicy,
    pub metrics_enabled: bool,
}
```

---

## 📈 Performance Architecture

### Latency Targets by Component
```
Component Performance Targets:
┌─────────────────────┬──────────────┬─────────────┐
│ Component           │ Operation    │ Target      │
├─────────────────────┼──────────────┼─────────────┤
│ IPC Protocol        │ Serialize    │ <0.01ms     │
│ Transport Layer     │ Send/Receive │ <0.3ms      │
│ Message Bus         │ Route        │ <0.1ms      │
│ Python Bridge       │ FFI Call     │ <0.01ms     │
│ Pool Manager        │ Allocate     │ <100μs      │
│ DAG Tracker         │ Schedule     │ <1ms        │
│ Artifact Store      │ Store        │ <5ms        │
│ Artifact Store      │ Retrieve     │ <2ms        │
│ Extension Loader    │ Load         │ <100ms      │
└─────────────────────┴──────────────┴─────────────┘
```

### Scalability Architecture
```
Scalability Targets:
┌─────────────────────┬──────────────────────────────┐
│ Component           │ Scalability Target           │
├─────────────────────┼──────────────────────────────┤
│ Message Bus         │ 10,000+ messages/second      │
│ DAG Tracker         │ 10,000-node workflows        │
│ Extension Registry  │ 10,000+ extensions           │
│ Artifact Store      │ 1TB+ storage with search     │
│ Pool Manager        │ 100+ concurrent models       │
└─────────────────────┴──────────────────────────────┘
```