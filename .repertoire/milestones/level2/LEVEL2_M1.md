# M1: Core Infrastructure - Level 2 Decomposition

> **Parent**: [MILESTONES_LEVEL1.md](../MILESTONES_LEVEL1.md)
> **Duration**: 3-4 months
> **Goal**: Build the foundational communication and integration systems

---

## 📋 Overview

M1 establishes the communication backbone for Symphony's AIDE layer. Every component
depends on this infrastructure for message passing, cross-language integration, and
extension management.

```
M1: Core Infrastructure
├── M1.1: IPC Protocol & Serialization
│   ├── M1.1.1: Message Envelope Design
│   ├── M1.1.2: MessagePack Serialization
│   ├── M1.1.3: Bincode Serialization
│   ├── M1.1.4: Schema Validation
│   ├── M1.1.5: Message Registry
│   ├── M1.1.6: Pretty Printer
│   └── M1.1.7: Property Tests
├── M1.2: Transport Layer
│   ├── M1.2.1: Transport Trait
│   ├── M1.2.2: Unix Socket Transport
│   ├── M1.2.3: Named Pipe Transport
│   ├── M1.2.4: Shared Memory Transport
│   ├── M1.2.5: Connection Pooling
│   ├── M1.2.6: Reconnection Logic
│   └── M1.2.7: Transport Tests
├── M1.3: Message Bus Core
│   ├── M1.3.1: Async Message Handler
│   ├── M1.3.2: Routing Engine
│   ├── M1.3.3: Endpoint Registration
│   ├── M1.3.4: Request/Response Correlation
│   ├── M1.3.5: Pub/Sub System
│   ├── M1.3.6: Health Monitoring
│   ├── M1.3.7: Message Batching
│   └── M1.3.8: Load Tests
├── M1.4: Python-Rust Bridge
│   ├── M1.4.1: PyO3 Setup
│   ├── M1.4.2: Primitive Conversions
│   ├── M1.4.3: Collection Conversions
│   ├── M1.4.4: Error Conversion
│   ├── M1.4.5: Async Support
│   ├── M1.4.6: IPC Bus API
│   ├── M1.4.7: Python Tests
│   └── M1.4.8: Benchmarks
└── M1.5: Extension SDK Foundation
    ├── M1.5.1: Manifest Schema
    ├── M1.5.2: Manifest Parser
    ├── M1.5.3: Lifecycle Trait
    ├── M1.5.4: Permission Declaration
    ├── M1.5.5: Extension Trait
    ├── M1.5.6: Derive Macros
    ├── M1.5.7: Pretty Printer
    └── M1.5.8: Property Tests
```

---

## 🔧 M1.1: IPC Protocol & Serialization

**Crate**: `symphony-ipc-protocol`
**Duration**: 3 weeks
**Dependencies**: None (foundational)


### M1.1.1: Message Envelope Design (2 days)

**Goal**: Define the core message structure for all IPC communication

**Deliverables**:
```rust
// src/message.rs

/// Unique identifier for messages
pub struct MessageId(pub Uuid);

/// Message header with routing and metadata
pub struct MessageHeader {
    pub id: MessageId,
    pub correlation_id: Option<MessageId>,
    pub message_type: MessageType,
    pub source: EndpointId,
    pub target: EndpointId,
    pub timestamp: SystemTime,
    pub ttl: Option<Duration>,
    pub priority: Priority,
    pub version: ProtocolVersion,
}

/// Message types supported by the protocol
pub enum MessageType {
    Request,
    Response,
    Event,
    Error,
    Heartbeat,
}

/// Priority levels for message routing
pub enum Priority {
    Low = 0,
    Normal = 1,
    High = 2,
    Critical = 3,
}

/// Complete message envelope
pub struct Message<T> {
    pub header: MessageHeader,
    pub payload: T,
    pub metadata: HashMap<String, Value>,
}
```

**Tasks**:
- [x] Define `MessageId` with UUID generation
- [x] Define `MessageHeader` with all routing fields
- [x] Define `MessageType` enum
- [x] Define `Priority` enum
- [x] Define generic `Message<T>` envelope
- [x] Add builder pattern for message construction
- [x] Write unit tests for message creation

**Acceptance Criteria**:
- ✅ All message types representable
- ✅ Builder API is ergonomic
- ✅ Messages are `Clone`, `Debug`, `PartialEq`

**Status**: [x] Complete

---

### M1.1.2: MessagePack Serialization (3 days)

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

### M1.1.3: Bincode Serialization (2 days)

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

### M1.1.4: Schema Validation (3 days)

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

### M1.1.5: Message Registry (2 days)

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

### M1.1.6: Pretty Printer (1 day)

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
```

**Tasks**:
- [ ] Implement `PrettyPrint` trait
- [ ] Add indentation and formatting
- [ ] Add optional colorization
- [ ] Create compact single-line format
- [ ] Add to Debug impl

**Acceptance Criteria**:
- ✅ Output is human-readable
- ✅ Supports both verbose and compact modes
- ✅ Works in logs and terminals

---

### M1.1.7: Property Tests (2 days)

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
}
```

**Tasks**:
- [ ] Add `proptest` dependency
- [ ] Create arbitrary generators for all types
- [ ] Write round-trip property tests
- [ ] Write schema validation property tests
- [ ] Run with 1000+ test cases

**Acceptance Criteria**:
- ✅ All property tests pass
- ✅ Edge cases covered (empty, max size, unicode)
- ✅ No panics on any input


---

## 🔌 M1.2: Transport Layer

**Crate**: `symphony-ipc-transport`
**Duration**: 3 weeks
**Dependencies**: M1.1

### M1.2.1: Transport Trait (2 days)

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

### M1.2.2: Unix Socket Transport (4 days)

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

### M1.2.3: Named Pipe Transport (4 days)

**Goal**: Windows-native transport implementation

**Tasks**:
- [ ] Implement `NamedPipeTransport`
- [ ] Add async I/O with tokio
- [ ] Handle Windows-specific errors
- [ ] Test on Windows CI

---

### M1.2.4: Shared Memory Transport (3 days)

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

### M1.2.5: Connection Pooling (2 days)

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

### M1.2.6: Reconnection Logic (2 days)

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

### M1.2.7: Transport Tests (2 days)

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

## 🚌 M1.3: Message Bus Core

**Crate**: `symphony-ipc-bus`
**Duration**: 3 weeks
**Dependencies**: M1.1, M1.2


### M1.3.1: Async Message Handler (3 days)

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

### M1.3.2: Routing Engine (3 days)

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

### M1.3.3: Endpoint Registration (2 days)

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

### M1.3.4: Request/Response Correlation (3 days)

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

### M1.3.5: Pub/Sub System (3 days)

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

### M1.3.6: Health Monitoring (2 days)

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

### M1.3.7: Message Batching (2 days)

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

### M1.3.8: Load Tests (2 days)

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

## 🐍 M1.4: Python-Rust Bridge

**Crate**: `symphony-python-bridge`
**Duration**: 3 weeks
**Dependencies**: M1.3

### M1.4.1-M1.4.8: PyO3 Integration

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

#[pymodule]
fn symphony_ipc(_py: Python, m: &PyModule) -> PyResult<()> {
    m.add_class::<IPCBus>()?;
    Ok(())
}
```

**Tasks** (summarized):
- [ ] M1.4.1: PyO3 project setup with maturin
- [ ] M1.4.2-M1.4.3: Type conversions (primitives, collections)
- [ ] M1.4.4: Error conversion to Python exceptions
- [ ] M1.4.5: Async support with pyo3-asyncio
- [ ] M1.4.6: Expose full IPC Bus API
- [ ] M1.4.7: Python integration tests
- [ ] M1.4.8: FFI overhead benchmarks (<0.01ms)

---

## 📦 M1.5: Extension SDK Foundation

**Crate**: `symphony-extension-sdk`
**Duration**: 3 weeks
**Dependencies**: M1.1

### M1.5.1-M1.5.8: SDK Implementation

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
```

**Tasks** (summarized):
- [ ] M1.5.1: TOML manifest schema definition
- [ ] M1.5.2: Manifest parser with validation
- [ ] M1.5.3: Lifecycle trait with hooks
- [ ] M1.5.4: Permission declaration system
- [ ] M1.5.5: Base Extension trait
- [ ] M1.5.6: Derive macros for boilerplate
- [ ] M1.5.7: Manifest pretty-printer
- [ ] M1.5.8: Property tests for manifest round-trip

---

## 📊 M1 Summary

| Sub-Milestone | Tasks | Duration | Status |
|---------------|-------|----------|--------|
| M1.1.1 Message Envelope | 7 | 2 days | 📋 |
| M1.1.2 MessagePack | 6 | 3 days | 📋 |
| M1.1.3 Bincode | 5 | 2 days | 📋 |
| M1.1.4 Schema Validation | 6 | 3 days | 📋 |
| M1.1.5 Message Registry | 5 | 2 days | 📋 |
| M1.1.6 Pretty Printer | 5 | 1 day | 📋 |
| M1.1.7 Property Tests | 5 | 2 days | 📋 |
| M1.2.x Transport Layer | 15 | 3 weeks | 📋 |
| M1.3.x Message Bus | 8 | 3 weeks | 📋 |
| M1.4.x Python Bridge | 8 | 3 weeks | 📋 |
| M1.5.x Extension SDK | 8 | 3 weeks | 📋 |

**Total Tasks**: ~78 detailed tasks
**Total Duration**: 15 weeks (with parallelization: ~10 weeks)

---

**Next**: [MILESTONE_LEVEL2_M5.md](./MILESTONE_LEVEL2_M5.md)
