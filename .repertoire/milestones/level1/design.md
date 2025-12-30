# Level 1 Design: Backend Sub-Milestone Architecture

> **Architecture Overview**: Detailed technical design for backend-focused sub-milestones with crate structures and implementation patterns

---

## 📖 Glossary

| Term | Definition |
|------|------------|
| **OFB Python** | Out of Boundary Python - refers to Python API components that handle authoritative validation, RBAC, and data persistence outside the Rust boundary |
| **Pre-validation** | Lightweight technical validation in Rust to prevent unnecessary HTTP requests (NOT business logic) |
| **Authoritative Validation** | Complete validation including RBAC, business rules, and data constraints performed by OFB Python |
| **Two-Layer Architecture** | Rust (orchestration + pre-validation) + OFB Python (validation + persistence) |
| **H2A2** | Harmonic Hexagonal Actor Architecture |
| **The Pit** | Five infrastructure extensions (Pool Manager, DAG Tracker, Artifact Store, Arbitration Engine, Stale Manager) |
| **Orchestra Kit** | Extension ecosystem (Instruments, Operators, Addons/Motifs) |
| **Mock-Based Contract Testing** | Testing approach using mock implementations to verify trait contracts and format validation without external dependencies |
| **WireMock Contract Verification** | Integration testing using WireMock to verify HTTP request/response format matches OFB Python API expectations |
| **Three-Layer Testing** | Unit tests (mocks), Integration tests (WireMock), Pre-validation tests (performance + logic) |

---

## 🏗️ M1: Core Infrastructure Architecture

### M1.0: sy-commons Foundation (PREREQUISITE)

**Core Rule**: "Common First" - Any functionality that can be shared across crates MUST be implemented in sy-commons first.

**Crate Structure**:
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
└── tests/
    ├── error_tests.rs
    ├── logging_tests.rs
    ├── config_tests.rs
    ├── filesystem_tests.rs
    ├── prevalidation_tests.rs
    └── debug_tests.rs
```

**Core Implementation Requirements**:
```rust
// SymphonyError - base error for ALL Symphony crates
#[derive(Debug, thiserror::Error)]
pub enum SymphonyError {
    #[error("Validation error: {message}")]
    Validation { message: String },
    
    #[error("IO error: {source}")]
    Io { #[from] source: std::io::Error },
    
    #[error("Serialization error: {source}")]
    Serialization { #[from] source: serde_json::Error },
    
    #[error("{message}")]
    Generic { message: String },
}

// Professional logging system
pub fn init_logging(config: &LoggingConfig) -> Result<(), SymphonyError> {
    // tracing + tracing-subscriber implementation
    // Console, File, JSON outputs
}

// Environment configuration
#[derive(Deserialize)]
pub struct Config {
    pub database: DatabaseConfig,
    pub logging: LoggingConfig,
    pub symphony: SymphonyConfig,
}

pub fn load_config() -> Result<Config, SymphonyError> {
    use figment::{Figment, providers::Toml};
    
    Figment::new()
        .merge(Toml::file("default.toml"))
        .merge(Toml::file("production.toml"))
        .extract()
        .map_err(|e| SymphonyError::Generic { message: e.to_string() })
}

// Pre-validation helpers (NOT logging)
pub trait PreValidationRule<T> {
    fn validate(&self, input: &T) -> Result<(), SymphonyError>;
}

// Duck debugging
#[macro_export]
macro_rules! duck {
    ($($arg:tt)*) => {
        #[cfg(debug_assertions)]
        eprintln!("[DUCK DEBUGGING] {}", format!($($arg)*));
    };
}
```

### M1.1: Environment Setup & Port Definitions

**Dependencies**: M1.0 sy-commons Foundation MUST be complete

**Crate Structure**:
```
apps/backend/crates/symphony-core-ports/
├── Cargo.toml           # MUST depend on sy-commons
├── src/
│   ├── lib.rs           # Public API exports
│   ├── ports.rs         # Port trait definitions using sy-commons::SymphonyError
│   ├── types.rs         # Domain types using sy-commons error handling
│   ├── errors.rs        # Port-specific errors extending SymphonyError
│   ├── mocks.rs         # Mock implementations using sy-commons utilities
│   └── binary.rs        # Two-binary adaptations using sy-commons logging
└── tests/
    ├── integration_tests.rs
    ├── mock_contract_tests.rs      # Using sy-commons test utilities
    ├── pre_validation_tests.rs     # Using sy-commons pre-validation helpers
    └── wiremock_contract_tests.rs  # Using sy-commons error handling
```

**Port Interface Design**:
```rust
use sy_commons::error::SymphonyError;

// Core port trait definitions - ALL use SymphonyError
pub trait TextEditingPort: Send + Sync {
    async fn open_file(&self, path: &Path) -> Result<BufferId, SymphonyError>;
    async fn edit_text(&self, buffer_id: BufferId, edit: TextEdit) -> Result<(), SymphonyError>;
    async fn get_buffer_content(&self, buffer_id: BufferId) -> Result<String, SymphonyError>;
}

pub trait PitPort: Send + Sync {
    async fn allocate_model(&self, model_id: &str) -> Result<ModelHandle, SymphonyError>;
    async fn execute_workflow(&self, workflow: WorkflowSpec) -> Result<ExecutionId, SymphonyError>;
    async fn store_artifact(&self, content: &[u8]) -> Result<ArtifactId, SymphonyError>;
}

pub trait ExtensionPort: Send + Sync {
    async fn load_extension(&self, manifest: ExtensionManifest) -> Result<ExtensionId, SymphonyError>;
    async fn invoke_extension(&self, id: ExtensionId, input: Value) -> Result<Value, SymphonyError>;
}

pub trait ConductorPort: Send + Sync {
    async fn orchestrate(&self, request: OrchestrationRequest) -> Result<OrchestrationResult, SymphonyError>;
    async fn get_status(&self) -> Result<ConductorStatus, SymphonyError>;
}

// NEW: Two-Layer Data Architecture Ports - ALL use SymphonyError
pub trait DataAccessPort: Send + Sync {
    async fn create_workflow(&self, request: CreateWorkflowRequest) -> Result<Workflow, SymphonyError>;
    async fn get_workflow(&self, id: WorkflowId) -> Result<Option<Workflow>, SymphonyError>;
    async fn create_user(&self, request: CreateUserRequest) -> Result<User, SymphonyError>;
    async fn get_user(&self, id: UserId) -> Result<Option<User>, SymphonyError>;
}

pub trait PreValidationPort: Send + Sync {
    fn validate_workflow_request(&self, request: &CreateWorkflowRequest) -> Result<(), SymphonyError>;
    fn validate_user_request(&self, request: &CreateUserRequest) -> Result<(), SymphonyError>;
    fn validate_extension_manifest(&self, path: &Path) -> Result<(), SymphonyError>;
}

// NEW: Testing Support Traits
pub trait MockDataAccess: DataAccessPort {
    fn with_test_data(data: TestDataSet) -> Self;
    fn with_error(error: DataError) -> Self;
    fn reset(&mut self);
}

pub trait ContractTestable {
    fn verify_request_format(&self, request: &dyn serde::Serialize) -> Result<(), ContractError>;
    fn verify_response_format(&self, response: &dyn serde::de::DeserializeOwned) -> Result<(), ContractError>;
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

### M1.6: Two-Layer Data Architecture `(NEW)`

**Data Layer Architecture Design**:
```
Two-Layer Data Architecture:
┌─────────────────────────────────────────────────────────┐
│                    Rust Layer                           │
│              (Orchestration + Pre-validation)           │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │Pre-validation│ │ Use Cases   │ │HTTP Client  │      │
│  │(<1ms checks) │ │(Business    │ │(OFB Python) │      │
│  │             │ │ Logic)      │ │             │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
└─────────────────────────────────────────────────────────┘
              │ Single HTTP Calls
              ▼
┌─────────────────────────────────────────────────────────┐
│                  OFB Python Layer                       │
│            (Validation + Persistence)                   │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │    RBAC     │ │ Business    │ │  Database   │      │
│  │ Validation  │ │ Rules       │ │ Operations  │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
│  ┌─────────────┐ ┌─────────────┐                      │
│  │ Data        │ │ Audit       │                      │
│  │ Validation  │ │ Logging     │                      │
│  └─────────────┘ └─────────────┘                      │
└─────────────────────────────────────────────────────────┘
```

**Pre-validation Flow Design**:
```rust
// Pre-validation trait for technical checks only
pub trait PreValidator<T> {
    type Error: std::error::Error;
    
    /// Fast technical validation - NO business logic
    fn should_attempt_request(&self, input: &T) -> Result<(), Self::Error>;
}

// Example implementation
pub struct WorkflowPreValidator;

impl PreValidator<CreateWorkflowRequest> for WorkflowPreValidator {
    type Error = PreValidationError;
    
    fn should_attempt_request(&self, request: &CreateWorkflowRequest) -> Result<(), PreValidationError> {
        // 1. Basic field presence (NOT business validation)
        if request.spec.name.trim().is_empty() {
            return Err(PreValidationError::EmptyName);
        }
        
        // 2. Basic format validation (NOT content validation)
        if request.spec.name.len() > MAX_NAME_LENGTH {
            return Err(PreValidationError::NameTooLong);
        }
        
        // 3. Basic JSON serialization check
        serde_json::to_string(request)
            .map_err(|_| PreValidationError::SerializationFailed)?;
        
        Ok(())
    }
}
```

**Data Access Pattern Design**:
```rust
// Use case with two-layer architecture
pub struct CreateWorkflowUseCase<D, R, P> 
where
    D: WorkflowDataAccess,
    R: WorkflowBusinessRules,
    P: PreValidator<CreateWorkflowRequest>,
{
    data_access: D,
    business_rules: R,
    pre_validator: P,
}

impl<D, R, P> CreateWorkflowUseCase<D, R, P> {
    pub async fn execute(&self, request: CreateWorkflowRequest) -> Result<Workflow, UseCaseError> {
        // 1. Pre-validation (fast technical checks)
        self.pre_validator.should_attempt_request(&request)
            .map_err(UseCaseError::PreValidationFailed)?;
        
        // 2. Apply business logic (calculations, optimizations)
        let optimized_spec = self.business_rules.optimize_workflow_steps(&request.spec);
        
        // 3. Single HTTP call to OFB Python (handles complete validation + persistence)
        let enhanced_request = CreateWorkflowRequest {
            spec: optimized_spec,
            ..request
        };
        
        self.data_access.create_workflow(enhanced_request).await
            .map_err(UseCaseError::from)
    }
}
```

**Error Categorization Design**:
```rust
#[derive(Debug, thiserror::Error)]
pub enum DataError {
    #[error("Pre-validation failed: {0}")]
    PreValidationFailed(String),
    
    #[error("Validation failed: {0}")]
    ValidationFailed(String),
    
    #[error("Authorization failed: {0}")]
    AuthorizationFailed(String),
    
    #[error("Resource not found")]
    NotFound,
    
    #[error("Network error: {0}")]
    NetworkError(String),
}
```

**Performance Targets**:
```
Two-Layer Performance Targets:
┌─────────────────────┬──────────────────────────────┐
│ Operation           │ Target                       │
├─────────────────────┼──────────────────────────────┤
│ Pre-validation      │ <1ms for all technical checks│
│ HTTP to OFB Python  │ Single call per operation    │
│ Error categorization│ Immediate distinction        │
│ Business logic      │ Pure Rust performance        │
│ Unit tests (mocks)  │ <100ms per test suite        │
│ Integration tests   │ <5s per test suite           │
│ WireMock tests      │ <2s per contract test        │
└─────────────────────┴──────────────────────────────┘
```

---

## 🧪 M1.12: Testing Infrastructure Implementation `(NEW)`

### Three-Layer Testing Architecture

**Testing Philosophy**: Mock-Based Contract & Format Testing with clear OFB Python boundary separation.

**Testing Scope & Boundaries**:

**What We Test (Rust Layer)**:
- ✅ **Contract Compliance**: Rust implementations follow trait contracts correctly
- ✅ **Format Validation**: Request/response serialization works as expected
- ✅ **Pre-validation Logic**: Fast technical checks work correctly (<1ms)
- ✅ **Business Logic**: Rust domain calculations and transformations
- ✅ **Error Handling**: Proper error propagation and conversion
- ✅ **Integration Contracts**: HTTP requests match expected OFB Python API format

**What We DON'T Test (OFB Python Boundary)**:
- ❌ **OFB Python Business Rules**: RBAC, validation logic, database constraints
- ❌ **OFB Python API Implementation**: Handled by Python team's test suite
- ❌ **Database Operations**: OFB Python layer responsibility
- ❌ **Authentication/Authorization**: OFB Python API handles all security

### Testing Crate Structure

```
apps/backend/crates/symphony-testing/
├── Cargo.toml
├── src/
│   ├── lib.rs
│   ├── mock_framework/          # Mock-based contract testing
│   │   ├── mod.rs
│   │   ├── mock_data_access.rs  # Mock implementations for all data access traits
│   │   ├── mock_validators.rs   # Mock pre-validation implementations
│   │   └── test_data_builder.rs # Test data construction utilities
│   ├── wiremock_framework/      # WireMock contract verification
│   │   ├── mod.rs
│   │   ├── contract_server.rs   # WireMock server setup and management
│   │   ├── ofb_python_mocks.rs  # OFB Python API contract mocks
│   │   └── response_builders.rs # OFB Python response format builders
│   ├── performance_testing/     # Pre-validation performance tests
│   │   ├── mod.rs
│   │   ├── benchmarks.rs        # Performance benchmarking utilities
│   │   └── validators.rs        # Pre-validation performance validators
│   └── test_config/             # Environment-based test configuration
│       ├── mod.rs
│       └── config.rs            # Test mode configuration (mock/wiremock/integration)
└── tests/
    ├── mock_contract_tests.rs   # Unit tests with mock implementations
    ├── wiremock_contract_tests.rs # Integration tests with WireMock
    └── performance_tests.rs     # Pre-validation performance validation
```

### Layer 1: Unit Tests - Mock-Based Contract Testing

**Purpose**: Verify Rust business logic and contract compliance without external dependencies.

```rust
// Mock implementation example for testing
pub struct MockWorkflowDataAccess {
    workflows: Arc<RwLock<HashMap<WorkflowId, Workflow>>>,
    force_error: Option<DataError>,
}

impl MockWorkflowDataAccess {
    pub fn new() -> Self {
        Self {
            workflows: Arc::new(RwLock::new(HashMap::new())),
            force_error: None,
        }
    }
    
    pub fn with_test_workflow(workflow: Workflow) -> Self {
        let mock = Self::new();
        mock.workflows.write().unwrap().insert(workflow.id.clone(), workflow);
        mock
    }
    
    pub fn with_error(error: DataError) -> Self {
        Self {
            workflows: Arc::new(RwLock::new(HashMap::new())),
            force_error: Some(error),
        }
    }
}

impl WorkflowDataAccess for MockWorkflowDataAccess {
    async fn create_workflow(&self, request: CreateWorkflowRequest) -> Result<Workflow, DataError> {
        if let Some(error) = &self.force_error {
            return Err(error.clone());
        }
        
        let workflow = Workflow {
            id: WorkflowId::new(&format!("workflow-{}", uuid::Uuid::new_v4())),
            spec: request.spec,
            user_id: request.user_id,
            project_id: request.project_id,
            created_at: chrono::Utc::now(),
            status: WorkflowStatus::Created,
        };
        
        self.workflows.write().unwrap().insert(workflow.id.clone(), workflow.clone());
        Ok(workflow)
    }
}
```

### Layer 2: Integration Tests - WireMock Contract Verification

**Purpose**: Verify HTTP request/response format matches OFB Python API expectations.

```rust
// WireMock contract testing example
#[tokio::test]
async fn test_create_workflow_ofb_python_contract() {
    // Arrange - Start WireMock server
    let mock_server = MockServer::start().await;
    
    // Define expected contract (matches OFB Python API specification)
    let expected_request = serde_json::json!({
        "spec": {
            "name": "Contract Test Workflow",
            "steps": [{"name": "step1", "command": "echo test"}]
        },
        "user_id": "user-123",
        "project_id": "project-456",
        "estimated_cost": {
            "compute_units": 10,
            "estimated_duration_ms": 5000
        }
    });
    
    let expected_response = serde_json::json!({
        "id": "workflow-789",
        "spec": {
            "name": "Contract Test Workflow",
            "steps": [{"name": "step1", "command": "echo test"}]
        },
        "user_id": "user-123",
        "project_id": "project-456",
        "created_at": "2025-12-27T10:00:00Z",
        "status": "created"
    });
    
    // Mock OFB Python API response
    Mock::given(method("POST"))
        .and(path("/workflows"))
        .and(body_json(&expected_request))
        .respond_with(ResponseTemplate::new(201).set_body_json(&expected_response))
        .expect(1) // Verify exactly one call
        .mount(&mock_server)
        .await;
    
    // Configure HTTP adapter to use WireMock
    let config = DataSourceConfig::Http {
        base_url: mock_server.uri(),
        timeout: Duration::from_secs(5),
        retry_attempts: 1,
    };
    
    let workflow_access = DataAccessFactory::create_workflow_data_access(&config);
    
    // Act - Execute request
    let result = workflow_access.create_workflow(CreateWorkflowRequest {
        spec: WorkflowSpec {
            name: "Contract Test Workflow".to_string(),
            steps: vec![WorkflowStep::new("step1", "echo test")],
        },
        user_id: UserId::new("user-123"),
        project_id: ProjectId::new("project-456"),
        estimated_cost: WorkflowCost {
            compute_units: 10,
            estimated_duration_ms: 5000,
        },
    }).await;
    
    // Assert - Verify contract compliance
    assert!(result.is_ok());
    let workflow = result.unwrap();
    assert_eq!(workflow.id, WorkflowId::new("workflow-789"));
    assert_eq!(workflow.spec.name, "Contract Test Workflow");
    
    // WireMock automatically verifies the request format matched exactly
}
```

### Layer 3: Pre-validation Tests - Performance & Logic Validation

**Purpose**: Verify pre-validation logic works correctly and performs within time limits.

```rust
#[test]
fn test_pre_validation_performance_requirement() {
    let validator = WorkflowPreValidator::new();
    
    let request = CreateWorkflowRequest {
        spec: WorkflowSpec {
            name: "Performance Test Workflow".to_string(),
            steps: vec![WorkflowStep::new("step1", "echo hello")],
        },
        user_id: UserId::new("user-123"),
        project_id: ProjectId::new("project-456"),
    };
    
    // Measure performance - must be <1ms
    let start = std::time::Instant::now();
    let result = validator.should_attempt_request(&request);
    let duration = start.elapsed();
    
    assert!(result.is_ok());
    assert!(duration < std::time::Duration::from_millis(1), 
           "Pre-validation took {:?}, should be <1ms", duration);
}
```

### Environment-Based Test Configuration

```rust
impl DataSourceConfig {
    pub fn for_testing() -> Self {
        match std::env::var("SYMPHONY_TEST_MODE").as_deref() {
            Ok("mock") => Self::Mock,
            Ok("wiremock") => Self::Http {
                base_url: "http://localhost:8080".to_string(), // WireMock server
                timeout: Duration::from_secs(5),
                retry_attempts: 1,
            },
            Ok("integration") => Self::Http {
                base_url: std::env::var("TEST_OFB_PYTHON_API_URL")
                    .unwrap_or_else(|_| "http://localhost:8000".to_string()),
                timeout: Duration::from_secs(10),
                retry_attempts: 1,
            },
            _ => Self::Mock, // Default for unit tests
        }
    }
}
```

### Test Execution Commands

```bash
# Unit tests (fast, mock-based)
SYMPHONY_TEST_MODE=mock cargo test

# Integration tests (WireMock contract verification)
SYMPHONY_TEST_MODE=wiremock cargo test --features integration-tests

# Contract tests (verify OFB Python API compatibility)
SYMPHONY_TEST_MODE=wiremock cargo test ofb_python_contract_tests --features integration-tests

# Performance tests (pre-validation benchmarks)
cargo test pre_validation_performance --release

# Full test suite
cargo test --all-features
```

### Test Quality Requirements

**Reliability Measures**:
- ✅ **Deterministic**: All tests use controlled mock data or WireMock responses
- ✅ **Isolated**: Each test gets fresh mock instances, no shared state
- ✅ **Fast**: Unit tests complete in <100ms, integration tests in <5s
- ✅ **Consistent**: Same inputs always produce same outputs

**Coverage Requirements**:
- ✅ **Business Logic**: 90%+ coverage for use cases and business rules
- ✅ **Pre-validation**: 100% coverage for all validation paths
- ✅ **Error Handling**: All error types and conversion paths tested
- ✅ **Contract Compliance**: All HTTP endpoints and formats verified with OFB Python

**OFB Python API Boundary**:
- ✅ **Clear Separation**: We test request format, not OFB Python business logic
- ✅ **Contract Focus**: Verify our requests match OFB Python API expectations
- ✅ **Error Format**: Test error response parsing, not error generation logic
- ✅ **No Duplication**: Don't test what OFB Python team already tests

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
Crate Dependency Architecture (Updated with Testing Infrastructure):
┌─────────────────────────────────────────────────────────┐
│                 Core Foundation                         │
├─────────────────────────────────────────────────────────┤
│           symphony-core-ports                           │
└─────────────────┬───────────────────────────────────────┘
                  │
    ┌─────────────┼─────────────┬─────────────────────────┬─────────────────┐
    ▼             ▼             ▼                         ▼                 ▼
┌─────────┐ ┌─────────┐ ┌─────────────┐         ┌─────────────┐   ┌─────────────┐
│symphony-│ │symphony-│ │symphony-    │         │symphony-    │   │symphony-    │
│ipc-     │ │workflow-│ │extension-   │         │data-        │   │testing      │ (NEW)
│protocol │ │model    │ │sdk          │         │contracts    │   │             │
└─────────┘ └─────────┘ └─────────────┘         └─────────────┘   └─────────────┘
    │             │             │                         │                 │
    ▼             ▼             ▼                         ▼                 ▼
┌─────────┐ ┌─────────┐ ┌─────────────┐         ┌─────────────┐   ┌─────────────┐
│symphony-│ │symphony-│ │symphony-    │         │symphony-    │   │  wiremock   │
│ipc-     │ │workflow-│ │permissions  │         │data-layer   │   │  mockall    │
│transport│ │execution│ │             │         │             │   │  criterion  │
└─────────┘ └─────────┘ └─────────────┘         └─────────────┘   └─────────────┘
    │                           │                         │
    ▼                           ▼                         ▼
┌─────────┐                 ┌─────────────┐         ┌─────────────┐
│symphony-│                 │symphony-    │         │symphony-    │
│ipc-bus  │                 │sandbox      │         │adapters     │ (UPDATED)
└─────────┘                 └─────────────┘         └─────────────┘
    │                           │                         │
    ▼                           ▼                         ▼
┌─────────┐                 ┌─────────────┐         ┌─────────────┐
│symphony-│                 │symphony-    │         │symphony-    │
│python-  │                 │extension-   │         │domain       │ (NEW)
│bridge   │                 │loader       │         │             │
└─────────┘                 └─────────────┘         └─────────────┘
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
Component Performance Targets (Updated with Testing Infrastructure):
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
│ Pre-validation      │ Technical    │ <1ms        │
│ HTTP Client         │ OFB Python   │ Single call │
│ Data Access         │ Use Case     │ <10ms       │
│ Unit Tests (Mocks)  │ Test Suite   │ <100ms      │
│ Integration Tests   │ Test Suite   │ <5s         │
│ WireMock Tests      │ Contract     │ <2s         │
│ Performance Tests   │ Benchmark    │ <10s        │
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