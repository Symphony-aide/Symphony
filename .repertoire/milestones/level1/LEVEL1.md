# Level 1 Milestone Guidemap: Backend Sub-Milestone Implementation

> **Implementation Strategy**: Detailed breakdown of backend-focused sub-milestones with concrete deliverables and crate structures

**Status**: Level 1 decomposition of M1, M5, M4, M3 into actionable 2-4 week sub-milestones  
**Ordering**: M1 → M5 → M4 → M3 (foundational to complex)  
**Architecture**: H2A2 + Two-Layer Data Architecture

---

## 📋 Glossary

**Terms and Definitions**:
- **OFB Python**: Out of Boundary Python - refers to Python API components that handle authoritative validation, RBAC, and data persistence outside the Rust boundary
- **Pre-validation**: Lightweight technical validation in Rust to prevent unnecessary HTTP requests (NOT business logic)
- **Authoritative Validation**: Complete validation including RBAC, business rules, and data constraints performed by OFB Python
- **Two-Layer Architecture**: Rust (orchestration + pre-validation) + OFB Python (validation + persistence)
- **H2A2**: Harmonic Hexagonal Actor Architecture
- **IPC**: Inter-Process Communication
- **DAG**: Directed Acyclic Graph
- **The Pit**: Five infrastructure extensions (Pool Manager, DAG Tracker, Artifact Store, Arbitration Engine, Stale Manager)
- **Orchestra Kit**: Extension ecosystem (Instruments, Operators, Addons/Motifs)

---

## 📋 Sub-Milestone Implementation Plan

### M1: Core Infrastructure (3-4 months)
**Status**: * [ ] - Next Priority
**Dependencies**: M0 Foundation

#### M1.1: Environment Setup & Port Definitions + Data Layer (2 weeks)
**Priority**: 🔴 Critical - Foundation for H2A2 architecture + Two-Layer Data Architecture

**Crate Structure**:
```
apps/backend/crates/symphony-core-ports/
├── Cargo.toml
├── src/
│   ├── lib.rs           # Public API exports
│   ├── ports.rs         # Port trait definitions (TextEditingPort, PitPort, ExtensionPort, ConductorPort, DataAccessPort)
│   ├── types.rs         # Domain types and data structures
│   ├── errors.rs        # Error types and handling
│   ├── mocks.rs         # Mock implementations for testing
│   ├── binary.rs        # Two-binary specific adaptations (NEW)
│   ├── prevalidation.rs # Pre-validation trait definitions (NEW)
│   └── data_contracts.rs # Data access contracts (NEW)
└── tests/
    └── integration_tests.rs
```

**Concrete Deliverables**:
- [ ] Core port trait definitions (TextEditingPort, PitPort, ExtensionPort, ConductorPort, DataAccessPort)
- [ ] Development environment setup for H2A2 architecture
- [ ] Domain types and error definitions
- [ ] Mock adapters for testing
- [ ] Pre-validation traits defined for technical validation only
- [ ] Data access contracts established for OFB Python integration
- [ ] Architecture documentation
- [ ] **Two-Binary Integration**: Port definitions adapted for inter-process communication `(NEW)`

#### M1.2: Two-Binary Architecture Implementation `(NEW)` (3 weeks)
**Priority**: 🔴 Critical - Core architectural decision

**Binary Structure Implementation**:
```
Symphony Binary (symphony.exe):
├── apps/backend/src/
│   ├── main.rs              # Symphony AIDE orchestration entry
│   ├── tauri_integration.rs # Tauri frontend integration  
│   ├── xi_client.rs         # JSON-RPC client to XI-editor
│   ├── process_manager.rs   # XI-editor process lifecycle
│   └── health_monitor.rs    # Process health monitoring

XI-editor Binary (xi-editor.exe):
├── apps/backend/xi-standalone/
│   ├── Cargo.toml
│   └── src/
│       ├── main.rs          # Standalone XI-editor entry
│       ├── jsonrpc_server.rs # JSON-RPC server implementation
│       ├── xi_integration.rs # XI-editor core integration
│       └── buffer_manager.rs # Buffer state management
```

**Concrete Deliverables**:
- [ ] Symphony binary with Tauri frontend integration
- [ ] XI-editor binary with JSON-RPC server
- [ ] Process lifecycle management and health monitoring
- [ ] Inter-process communication setup via JSON-RPC
- [ ] Binary synchronization framework for state consistency
#### M1.3: IPC Protocol & Serialization (3 weeks)
**Priority**: 🔴 Critical - Everything depends on this

**Crate Structure**:
```
apps/backend/crates/symphony-ipc-protocol/
├── src/
│   ├── lib.rs
│   ├── message.rs        # Message envelope types
│   ├── schema.rs         # Schema definitions
│   ├── serialize.rs      # MessagePack/Bincode impl
│   ├── validate.rs       # Schema validation
│   ├── registry.rs       # Message type registry
│   ├── jsonrpc.rs        # JSON-RPC for XI-editor (NEW)
│   └── xi_protocol.rs    # XI-editor specific messages (NEW)
```

**Concrete Deliverables**:
- [ ] Message envelope schema (header, payload, metadata)
- [ ] Binary serialization using MessagePack/Bincode
- [ ] Schema validation system
- [ ] Message type registry
- [ ] **JSON-RPC Implementation**: Specific protocol for Symphony ↔ XI-editor communication `(NEW)`
- [ ] **XI-editor Message Types**: Buffer ops, file ops, cursor movements `(NEW)`

**Performance Targets**:
- [ ] Messages serialize/deserialize in <0.01ms
- [ ] **JSON-RPC latency <1ms for XI-editor operations** `(NEW)`
- [ ] Schema validation catches malformed messages
- [ ] Round-trip property tests pass for all message types

#### M1.4: Transport Layer (3 weeks)
**Priority**: 🔴 Critical - Platform-specific implementations

**Crate Structure**:
```
apps/backend/crates/symphony-ipc-transport/
├── src/
│   ├── lib.rs
│   ├── traits.rs         # Transport trait definitions
│   ├── unix_socket.rs    # Unix domain sockets
│   ├── named_pipe.rs     # Windows named pipes
│   ├── shared_memory.rs  # Shared memory for hot path
│   ├── stdio.rs          # Stdio transport for XI-editor (NEW)
│   └── config.rs         # Transport configuration
```

**Concrete Deliverables**:
- [ ] Unix domain socket transport (Linux/macOS)
- [ ] Named pipe transport (Windows)
- [ ] Shared memory transport (high-frequency)
- [ ] Transport abstraction trait
- [ ] **Stdio Transport**: For Symphony ↔ XI-editor JSON-RPC communication `(NEW)`
- [ ] Connection pooling and reuse
- [ ] Automatic reconnection with backoff

**Performance Targets**:
- [ ] Unix socket latency <0.1ms
- [ ] Named pipe latency <0.2ms
- [ ] Shared memory latency <0.01ms
- [ ] **Stdio transport latency <1ms for XI-editor operations** `(NEW)`
- [ ] Automatic reconnection works within 5 attempts
#### M1.5: Message Bus Core (3 weeks)
**Priority**: 🔴 Critical - Central message routing

**Crate Structure**:
```
apps/backend/crates/symphony-ipc-bus/
├── src/
│   ├── lib.rs
│   ├── bus.rs            # Core bus implementation
│   ├── router.rs         # Message routing logic
│   ├── endpoint.rs       # Endpoint management
│   ├── correlation.rs    # Request/response tracking
│   ├── pubsub.rs         # Publish/subscribe system
│   ├── health.rs         # Health monitoring
│   ├── binary_sync.rs    # Binary synchronization (NEW)
│   └── xi_bridge.rs      # XI-editor bridge (NEW)
```

**Concrete Deliverables**:
- [ ] Message bus with routing logic
- [ ] Endpoint registration and discovery
- [ ] Request/response correlation
- [ ] Pub/sub for broadcast messages
- [ ] Health monitoring
- [ ] **Binary Coordination**: Specialized routing for Symphony ↔ XI-editor communication `(NEW)`
- [ ] **XI-editor Bridge**: Seamless communication bridge `(NEW)`

**Performance Targets**:
- [ ] Handles 10,000+ messages/second
- [ ] Average routing latency <0.1ms
- [ ] Pub/sub delivers to all subscribers within 1ms
- [ ] Health checks detect failures within 100ms
- [ ] **Binary synchronization maintains consistent state** `(NEW)`

#### M1.6: Python-Rust Bridge (3 weeks)
**Priority**: 🔴 Critical - Conductor integration

**Crate Structure**:
```
apps/backend/crates/symphony-python-bridge/
├── Cargo.toml           # PyO3 dependencies
├── src/
│   ├── lib.rs
│   ├── bindings.rs      # PyO3 FFI bindings
│   ├── types.rs         # Rust ↔ Python type conversion
│   ├── errors.rs        # Cross-language error handling
│   ├── async_support.rs # Async/await bridge
│   ├── pit_api.rs       # Pit extension APIs
│   ├── conductor.rs     # Conductor subprocess management (NEW)
│   └── subprocess.rs    # Python subprocess integration (NEW)
└── python/
    └── symphony_bridge.py # Python interface
```

**Concrete Deliverables**:
- [ ] PyO3 bindings for IPC bus
- [ ] Type conversion layer
- [ ] Error handling across boundary
- [ ] Async support for Python
- [ ] **In-Process Integration**: Conductor subprocess within Symphony binary `(NEW)`
- [ ] **Direct Pit Access**: Conductor has direct access to The Pit components (no IPC overhead) `(NEW)`

**Performance Targets**:
- [ ] FFI call overhead <0.01ms
- [ ] All primitive types convert correctly
- [ ] Async calls work from Python asyncio
- [ ] Errors propagate with full context
- [ ] **Conductor has direct access to The Pit components** `(NEW)`

#### M1.7: Data Layer Implementation `(NEW)` (3 weeks)
**Priority**: 🔴 Critical - Two-Layer Data Architecture

**Crate Structure**:
```
apps/backend/crates/symphony-data-layer/
├── Cargo.toml
├── src/
│   ├── lib.rs
│   ├── prevalidation/   # Pre-validation implementations
│   │   ├── mod.rs
│   │   ├── workflow.rs  # Workflow pre-validation
│   │   ├── user.rs      # User pre-validation
│   │   ├── extension.rs # Extension pre-validation
│   │   └── project.rs   # Project pre-validation
│   ├── http_client/     # HTTP client for OFB Python
│   │   ├── mod.rs
│   │   ├── client.rs    # HTTP client implementation
│   │   ├── retry.rs     # Retry logic and error handling
│   │   └── config.rs    # Configuration and timeouts
│   ├── adapters/        # Data access adapters
│   │   ├── mod.rs
│   │   ├── workflow.rs  # Workflow data access
│   │   ├── user.rs      # User data access
│   │   ├── extension.rs # Extension data access
│   │   └── project.rs   # Project data access
│   └── use_cases/       # Domain use cases
│       ├── mod.rs
│       ├── workflow.rs  # Workflow use cases
│       ├── user.rs      # User use cases
│       └── extension.rs # Extension use cases
└── tests/
    ├── prevalidation_tests.rs
    ├── http_client_tests.rs
    └── integration_tests.rs
```

**Concrete Deliverables**:
- [ ] Pre-validation traits implemented for all domains (Workflow, User, Extension, Project)
- [ ] HTTP client for OFB Python with retry logic and error handling
- [ ] Data access adapters following two-layer architecture
- [ ] Domain use cases integrating pre-validation + OFB Python calls
- [ ] Error categorization (pre-validation vs authoritative validation)
- [ ] Performance benchmarks (<1ms pre-validation, single HTTP calls)
- [ ] Configuration system for OFB Python API endpoints

**Performance Targets**:
- [ ] Pre-validation completes in <1ms for all technical checks
- [ ] HTTP requests to OFB Python are single calls per operation
- [ ] Error categorization distinguishes pre-validation from authoritative validation
- [ ] All RBAC and business rule validation occurs in OFB Python only

#### M1.8: Data Contracts & Abstractions `(NEW)` (2 weeks)
**Priority**: 🔴 Critical - Clean Architecture Foundation

**Crate Structure**:
```
apps/backend/crates/symphony-data-contracts/
├── Cargo.toml
├── src/
│   ├── lib.rs
│   ├── traits.rs        # Core data access traits (DataStore, QueryableStore, TransactionalStore)
│   ├── domain/          # Domain-specific contracts
│   │   ├── mod.rs
│   │   ├── user.rs      # UserDataAccess trait
│   │   ├── workflow.rs  # WorkflowDataAccess trait
│   │   ├── extension.rs # ExtensionDataAccess trait
│   │   └── project.rs   # ProjectDataAccess trait
│   ├── errors.rs        # Data layer error types
│   ├── types.rs         # Common data types and IDs
│   └── prevalidation.rs # Pre-validation trait definitions
└── tests/
    └── contract_tests.rs
```

**Concrete Deliverables**:
- [ ] Core data access trait definitions (DataStore, QueryableStore, TransactionalStore)
- [ ] Domain-specific data access contracts (User, Workflow, Extension, Project)
- [ ] Pre-validation trait definitions for all domains
- [ ] Comprehensive error type hierarchy with pre-validation errors
- [ ] Common data types and ID types
- [ ] Mock implementations for testing

**Success Criteria**:
- [ ] All data access operations expressible through trait interfaces
- [ ] Pre-validation traits support <1ms technical validation
- [ ] Error types distinguish pre-validation from authoritative validation
- [ ] Mock implementations enable comprehensive unit testing

#### M1.8: Extension SDK Foundation (3 weeks)
**Priority**: 🟡 High - Extension development prerequisite

**Crate Structure**:
```
apps/backend/crates/symphony-extension-sdk/
├── src/
│   ├── lib.rs
│   ├── manifest.rs       # Extension manifest schema and parser
│   ├── lifecycle.rs      # Extension lifecycle hooks (load, activate, deactivate, unload)
│   ├── permissions.rs    # Permission system foundation
│   ├── registry.rs       # Extension registry and discovery
│   ├── traits.rs         # Extension traits
│   ├── macros.rs         # Derive macros for extensions
│   ├── actor.rs          # Actor-based process isolation (NEW)
│   └── process.rs        # Extension process management (NEW)
└── examples/
    ├── simple_instrument.rs
    ├── basic_operator.rs
    └── ui_addon.rs
```

**Concrete Deliverables**:
- [ ] Extension manifest schema and parser
- [ ] Lifecycle hook system
- [ ] Permission declaration framework
- [ ] Extension trait definitions
- [ ] **Actor-Based Isolation**: Extensions run as separate processes `(NEW)`
- [ ] **Extension Process Management**: Spawning and lifecycle management `(NEW)`
- [ ] Example extensions for each type (Instrument, Operator, Addon)

**Performance Targets**:
- [ ] Manifest parsing <1ms for typical manifests
- [ ] Invalid manifests rejected with clear errors
- [ ] Lifecycle hooks called in correct order
- [ ] Permission violations detected at declaration time
- [ ] **Extensions run in isolated processes with crash protection** `(NEW)`

#### M1.9: Concrete Adapters Implementation `(NEW)` (4 weeks)
**Priority**: 🔴 Critical - H2A2 architecture completion

**Crate Structure**:
```
apps/backend/crates/symphony-adapters/
├── src/
│   ├── lib.rs
│   ├── xi_editor.rs      # XiEditorAdapter implementing TextEditingPort (JSON-RPC)
│   ├── pit.rs            # PitAdapter implementing PitPort (in-process)
│   ├── extensions.rs     # ActorExtensionAdapter implementing ExtensionPort
│   ├── conductor.rs      # PythonConductorAdapter implementing ConductorPort
│   ├── data_access.rs    # DataAccessAdapter implementing DataAccessPort (NEW)
│   └── common.rs         # Shared adapter utilities
└── tests/
    ├── xi_editor_tests.rs
    ├── pit_tests.rs
    ├── extension_tests.rs
    ├── conductor_tests.rs
    └── data_access_tests.rs
```

**Concrete Deliverables**:
- [ ] XiEditorAdapter with JSON-RPC communication to XI-editor binary
- [ ] PitAdapter with direct in-process access to The Pit components
- [ ] ActorExtensionAdapter with process isolation for extensions
- [ ] PythonConductorAdapter with PyO3 bridge integration
- [ ] **DataAccessAdapter with two-layer architecture (pre-validation + OFB Python)** `(NEW)`
- [ ] Comprehensive test coverage for all adapters

**Success Criteria**:
- [ ] All six port interfaces have concrete implementations
- [ ] XiEditorAdapter communicates with XI-editor binary via JSON-RPC
- [ ] PitAdapter provides direct access to Pit components
- [ ] ActorExtensionAdapter isolates extensions in separate processes
- [ ] PythonConductorAdapter bridges to Python Conductor subprocess
- [ ] **DataAccessAdapter follows two-layer architecture principles** `(NEW)`
#### M1.9: Domain Core Orchestration `(NEW)` (3 weeks)
**Priority**: 🔴 Critical - Symphony AIDE heart

**Crate Structure**:
```
apps/backend/crates/symphony-domain/
├── src/
│   ├── lib.rs
│   ├── core.rs           # SymphonyCore orchestration engine using all six ports
│   ├── state.rs          # State management and synchronization
│   ├── sync.rs           # Binary synchronization coordination
│   ├── events.rs         # Event streaming and process lifecycle
│   ├── lifecycle.rs      # Process lifecycle management
│   ├── workflows.rs      # Workflow coordination
│   └── use_cases.rs      # Domain use cases with two-layer data integration (NEW)
└── tests/
    └── integration_tests.rs
```

**Concrete Deliverables**:
- [ ] SymphonyCore orchestration engine coordinating all components
- [ ] Business logic layer using the six port interfaces (including DataAccessPort)
- [ ] State management and synchronization between Symphony and XI-editor binaries
- [ ] Event streaming and process lifecycle management
- [ ] Workflow coordination logic
- [ ] **Domain use cases integrating two-layer data architecture** `(NEW)`
- [ ] End-to-end integration tests

**Success Criteria**:
- [ ] SymphonyCore orchestrates all components through port interfaces
- [ ] State remains synchronized between Symphony and XI-editor binaries
- [ ] Event streaming enables real-time coordination
- [ ] Process failures are detected and handled gracefully
- [ ] Workflows execute correctly across all components
- [ ] **Data operations follow two-layer architecture (pre-validation + OFB Python)** `(NEW)`

#### M1.10: Tauri Integration Layer `(NEW)` (3 weeks)
**Priority**: 🔴 Critical - Frontend-backend bridge

**Integration Structure**:
```
src-tauri/
├── src/
│   ├── main.rs          # Tauri application entry point
│   ├── commands/        # Tauri command handlers directory
│   │   ├── mod.rs
│   │   ├── conductor.rs  # Conductor operations
│   │   ├── text_editing.rs # Text editing operations
│   │   ├── extensions.rs # Extension operations
│   │   ├── workflows.rs  # Workflow operations
│   │   └── data.rs       # Data operations with two-layer architecture (NEW)
│   ├── state.rs         # Application state management
│   ├── events.rs        # Event handling and streaming
│   └── error.rs         # Error handling across Tauri boundary
```

**Concrete Deliverables**:
- [ ] Tauri command definitions for all Symphony operations
- [ ] State management integration with SymphonyCore
- [ ] Error handling across Tauri boundary with proper serialization
- [ ] Frontend-backend type synchronization
- [ ] Event streaming from backend to frontend
- [ ] **Data command handlers with pre-validation error handling** `(NEW)`

**Success Criteria**:
- [ ] All Symphony operations accessible via Tauri commands
- [ ] Frontend and backend state remain synchronized
- [ ] Error handling provides clear feedback to frontend
- [ ] Type safety maintained across Tauri boundary
- [ ] Event streaming enables real-time UI updates
- [ ] **Pre-validation errors provide immediate user feedback** `(NEW)`

### M1 Success Criteria Checklist
- [ ] H2A2 architecture fully implemented (Ports + Adapters + Domain + Actors)
- [ ] Two-binary architecture operational (Symphony + XI-editor)
- [ ] All concrete adapters implement their respective port interfaces
- [ ] Domain core orchestrates all components using ports only
- [ ] Actor layer provides extension process isolation
- [ ] Symphony and XI-editor maintain synchronized state
- [ ] Tauri frontend integrates seamlessly with Symphony backend
- [ ] JSON-RPC latency <1ms for XI-editor operations
- [ ] Python Conductor has direct access to The Pit components
- [ ] Extension system provides safe isolation via Actor model
- [ ] **Two-layer data architecture operational (Pre-validation + OFB Python)** `(NEW)`
- [ ] **Pre-validation completes in <1ms for all technical checks** `(NEW)`
- [ ] **HTTP requests to OFB Python are single calls per operation** `(NEW)`
- [ ] **All RBAC and business rule validation occurs in OFB Python** `(NEW)`
- [ ] **Error categorization distinguishes pre-validation from authoritative validation** `(NEW)`
- [ ] **Data access use cases follow clean architecture principles** `(NEW)`
- [ ] **Six port interfaces implemented: TextEditing, Pit, Extension, Conductor, DataAccess, PreValidation** `(NEW)`
- [ ] All tests passing with >80% code coverage
- [ ] Health monitoring detects and recovers from process failures
---

## 🎨 M5: Visual Orchestration Backend (2-3 months)
**Status**: * [ ] - Depends on M1.1 (Protocol), M1.3 (Bus)
**Dependencies**: M1 Core Infrastructure

### Implementation Breakdown

#### M5.1: Workflow Data Model (2 weeks)
**Priority**: 🟡 High - Foundation for visual workflows

**Crate Structure**:
```
apps/backend/crates/symphony-workflow-model/
├── src/
│   ├── lib.rs
│   ├── workflow.rs       # Workflow struct
│   ├── node.rs           # Node types
│   ├── edge.rs           # Edge types
│   ├── builder.rs        # Fluent builder API
│   └── metadata.rs       # Workflow metadata
```

**Concrete Deliverables**:
- [ ] Workflow struct with metadata
- [ ] Node types (Instrument, Operator, Control)
- [ ] Edge types (Data, Control, Conditional)
- [ ] Workflow builder API
- [ ] Metadata support (author, created, modified, tags)

**Success Criteria**:
- [ ] All node types representable
- [ ] Builder API is ergonomic and type-safe
- [ ] Metadata supports arbitrary key-value pairs

#### M5.2: DAG Validation & Operations (2 weeks)
**Priority**: 🔴 Critical - Workflow integrity

**Concrete Deliverables**:
- [ ] Cycle detection algorithm (Kahn's or DFS-based)
- [ ] Topological sorting for execution order
- [ ] Dependency resolution
- [ ] Graph traversal utilities (BFS, DFS, ancestors, descendants)
- [ ] Validation pipeline (cycles, orphans, type mismatches)

**Success Criteria**:
- [ ] Cycle detection works for graphs up to 10,000 nodes
- [ ] Topological sort is deterministic
- [ ] Validation catches all invalid graphs

#### M5.3: Workflow Serialization (2 weeks)
**Priority**: 🟡 High - Persistence and portability

**Concrete Deliverables**:
- [ ] JSON serialization for interchange
- [ ] Binary serialization for performance (MessagePack)
- [ ] Pretty-printer for human readability
- [ ] Schema versioning to serialized format
- [ ] Migration system for schema changes

**Success Criteria**:
- [ ] JSON round-trip preserves all data
- [ ] Binary format is 50%+ smaller than JSON
- [ ] Pretty-printer output is human-readable
- [ ] Old versions can be migrated to new schema

#### M5.4: Template System (2 weeks)
**Priority**: 🟢 Medium - Workflow reusability

**Crate Structure**:
```
apps/backend/crates/symphony-workflow-templates/
├── src/
│   ├── lib.rs
│   ├── template.rs       # Template definition
│   ├── parameters.rs     # Parameter schema
│   ├── instantiate.rs    # Template instantiation
│   └── library.rs        # Template library
```

**Concrete Deliverables**:
- [ ] Template definition format
- [ ] Parameter schema and validation
- [ ] Template instantiation with parameter binding
- [ ] Template library management with search/filter
- [ ] Template versioning

**Success Criteria**:
- [ ] Templates can parameterize any workflow property
- [ ] Invalid parameters rejected with clear errors
- [ ] Template library supports 1000+ templates
#### M5.5: Execution State API (3 weeks)
**Priority**: 🟡 High - Workflow execution control

**Crate Structure**:
```
apps/backend/crates/symphony-workflow-execution/
├── src/
│   ├── lib.rs
│   ├── state.rs          # Execution state machine
│   ├── progress.rs       # Progress tracking
│   ├── control.rs        # Control commands
│   ├── events.rs         # Event streaming
│   └── api.rs            # Public API
```

**Concrete Deliverables**:
- [ ] Execution state machine (Pending, Running, Paused, Completed, Failed)
- [ ] Progress tracking (node completion, percentage)
- [ ] Control commands (pause, resume, cancel, retry)
- [ ] Event streaming for UI updates
- [ ] Execution history/audit log

**Success Criteria**:
- [ ] State transitions are atomic and consistent
- [ ] Progress updates within 10ms of node completion
- [ ] Control commands take effect within 100ms
- [ ] Event stream delivers updates to all subscribers

### M5 Success Criteria Checklist
- [ ] Workflow data model supports all visual workflow requirements
- [ ] DAG validation ensures workflow integrity
- [ ] Serialization enables portable workflow storage
- [ ] Template system provides workflow reusability
- [ ] Execution API enables real-time workflow control and monitoring

---

## 🧩 M4: Extension Ecosystem (4-5 months)
**Status**: * [ ] - Depends on M1 (Core Infrastructure), M5.1 (Workflow Model)
**Dependencies**: M1 Core Infrastructure, M5 Workflow Model

### Implementation Breakdown

#### M4.1: Manifest System (3 weeks)
**Priority**: 🔴 Critical - Extension metadata foundation

**Concrete Deliverables**:
- [ ] Full manifest schema with capability declarations
- [ ] Dependency specification (version ranges, optional)
- [ ] Configuration schema definition
- [ ] Resource requirements (memory, CPU, GPU)
- [ ] Manifest inheritance for extension families
- [ ] Marketplace metadata (description, screenshots, pricing)
- [ ] Comprehensive manifest validation

**Success Criteria**:
- [ ] All extension metadata expressible in manifest
- [ ] Dependency resolution handles complex graphs
- [ ] Configuration schema generates UI automatically

#### M4.2: Permission Framework (3 weeks)
**Priority**: 🔴 Critical - Extension security

**Crate Structure**:
```
apps/backend/crates/symphony-permissions/
├── src/
│   ├── lib.rs
│   ├── types.rs          # Permission types
│   ├── scopes.rs         # Permission scopes
│   ├── checker.rs        # Runtime checking
│   ├── policy.rs         # Permission policies
│   └── ui.rs             # UI generation for approval
```

**Concrete Deliverables**:
- [ ] Permission types (file, network, system, model)
- [ ] Permission scopes (read, write, execute)
- [ ] Runtime permission checking
- [ ] Permission UI generation
- [ ] Permission audit logging

**Success Criteria**:
- [ ] All operations checked against permissions
- [ ] Permission violations blocked and logged
- [ ] UI clearly shows what permissions are requested
- [ ] Audit log captures all permission decisions
#### M4.3: Process Isolation (4 weeks)
**Priority**: 🔴 Critical - Extension sandboxing

**Crate Structure**:
```
apps/backend/crates/symphony-sandbox/
├── src/
│   ├── lib.rs
│   ├── process.rs        # Process management
│   ├── limits.rs         # Resource limits
│   ├── filesystem.rs     # FS sandboxing
│   ├── network.rs        # Network sandboxing
│   └── platform/         # Platform-specific impl
│       ├── linux.rs
│       ├── macos.rs
│       └── windows.rs
```

**Concrete Deliverables**:
- [ ] Process spawning with isolation
- [ ] Resource limits (memory, CPU)
- [ ] Filesystem sandboxing
- [ ] Network sandboxing
- [ ] Process health monitoring
- [ ] Graceful and forced termination

**Success Criteria**:
- [ ] Extensions cannot access files outside sandbox
- [ ] Memory limits enforced within 10% accuracy
- [ ] CPU limits enforced within 20% accuracy
- [ ] Network access blocked unless permitted

#### M4.4: Extension Loader (3 weeks)
**Priority**: 🟡 High - Extension lifecycle management

**Crate Structure**:
```
apps/backend/crates/symphony-extension-loader/
├── src/
│   ├── lib.rs
│   ├── discovery.rs      # Extension discovery
│   ├── loader.rs         # Loading logic
│   ├── resolver.rs       # Dependency resolution
│   ├── hot_reload.rs     # Hot reload support
│   └── state.rs          # Extension state
```

**Concrete Deliverables**:
- [ ] Extension discovery and loading
- [ ] Dependency resolution and ordering
- [ ] Hot reload support
- [ ] Extension state management
- [ ] Extension health checks
- [ ] Extension crash recovery

**Success Criteria**:
- [ ] Extensions load within 100ms
- [ ] Dependency conflicts detected before loading
- [ ] Hot reload works without system restart
- [ ] Crashed extensions auto-recover

#### M4.5: Registry & Discovery (3 weeks)
**Priority**: 🟡 High - Extension catalog

**Crate Structure**:
```
apps/backend/crates/symphony-extension-registry/
├── src/
│   ├── lib.rs
│   ├── registry.rs       # Local registry
│   ├── marketplace.rs    # Remote marketplace client
│   ├── search.rs         # Search and filter
│   ├── versions.rs       # Version management
│   └── signatures.rs     # Signature verification
```

**Concrete Deliverables**:
- [ ] Local extension registry
- [ ] Remote marketplace client
- [ ] Search and filtering
- [ ] Version management
- [ ] Signature verification for security
- [ ] Extension rating/review system

**Success Criteria**:
- [ ] Search returns results in <100ms
- [ ] Version rollback works reliably
- [ ] Signature verification catches tampering
- [ ] Registry handles 10,000+ extensions
#### M4.6: Extension Types (4 weeks)
**Priority**: 🟡 High - Extension implementation framework

**Crate Structure**:
```
apps/backend/crates/symphony-extension-types/
├── src/
│   ├── lib.rs
│   ├── instrument.rs     # AI/ML model extensions
│   ├── operator.rs       # Workflow utility extensions
│   ├── addon.rs          # UI enhancement extensions
│   └── common.rs         # Shared functionality
```

**Concrete Deliverables**:
- [ ] Instrument trait and base implementation
- [ ] Operator trait and base implementation
- [ ] Addon trait and base implementation
- [ ] Example extensions for each type
- [ ] Extension integration with workflow system
- [ ] Documentation for extension developers

**Success Criteria**:
- [ ] All three extension types fully functional
- [ ] Example extensions demonstrate best practices
- [ ] Extensions integrate with workflow system
- [ ] Documentation complete for extension developers

### M4 Success Criteria Checklist
- [ ] Extension system loads and runs extensions safely
- [ ] All three extension types (Instruments, Operators, Addons) functional
- [ ] Marketplace operational with at least 5 example extensions
- [ ] Developer documentation complete with tutorials
- [ ] Security scanning catches common vulnerabilities
- [ ] Extension crashes don't affect Symphony core
- [ ] Resource limits prevent system resource exhaustion

---

## 🎭 M3: The Pit - Infrastructure Extensions (3-4 months)
**Status**: * [ ] - Depends on M1 (Core Infrastructure), M4.1-M4.4 (Extension basics)
**Dependencies**: M1 Core Infrastructure, M4 Extension Basics

### Implementation Breakdown

#### M3.1: Pool Manager (4 weeks)
**Priority**: 🔴 Critical - AI model lifecycle

**Crate Structure**:
```
apps/backend/crates/symphony-pool-manager/
├── Cargo.toml
├── src/
│   ├── lib.rs
│   ├── lifecycle.rs      # Model state machine (cold→warming→hot→cooling)
│   ├── prewarming.rs     # Predictive loading
│   ├── cache.rs          # Model caching (LRU)
│   ├── health.rs         # Health monitoring
│   ├── metrics.rs        # Performance metrics
│   └── config.rs         # Configuration
└── benches/
    └── allocation_bench.rs # 50-100ns allocation benchmarking
```

**Concrete Deliverables**:
- [ ] Model state machine with all transitions implemented
- [ ] Predictive prewarming system based on usage patterns
- [ ] Model caching with intelligent memory management
- [ ] Performance monitoring achieving 50-100ns targets
- [ ] Usage analytics and optimization recommendations
- [ ] Health monitoring with heartbeats
- [ ] Graceful model shutdown

**Performance Target**: 50-100ns allocation on cache hit

**Success Criteria**:
- [ ] Model allocation <100μs on cache hit
- [ ] Prewarming reduces cold starts by 50%+
- [ ] Health checks detect failures within 1s
- [ ] Memory usage stays within configured limits
#### M3.2: DAG Tracker (4 weeks)
**Priority**: 🔴 Critical - Workflow execution

**Crate Structure**:
```
apps/backend/crates/symphony-dag-tracker/
├── src/
│   ├── lib.rs
│   ├── executor.rs       # Execution engine
│   ├── scheduler.rs      # Node scheduling
│   ├── parallel.rs       # Parallel execution
│   ├── checkpoint.rs     # State checkpointing
│   ├── recovery.rs       # Failure recovery
│   └── metrics.rs        # Execution metrics
└── tests/
    └── large_dag_tests.rs # 10,000-node workflow testing
```

**Concrete Deliverables**:
- [ ] DAG representation for complex workflows
- [ ] Parallel execution engine with optimal resource utilization
- [ ] Dependency resolution with cycle detection
- [ ] State checkpointing and recovery mechanisms
- [ ] Scalability testing with 10,000+ node workflows
- [ ] Execution metrics (duration, throughput, errors)
- [ ] Execution timeout handling

**Performance Target**: Handle 10,000-node workflows

**Success Criteria**:
- [ ] Handles 10,000-node workflows
- [ ] Parallel execution utilizes available cores
- [ ] Recovery from checkpoint <1s
- [ ] Execution metrics accurate within 1%

#### M3.3: Artifact Store (4 weeks)
**Priority**: 🔴 Critical - Content-addressable storage

**Crate Structure**:
```
apps/backend/crates/symphony-artifact-store/
├── src/
│   ├── lib.rs
│   ├── storage.rs        # Content-addressable storage
│   ├── versioning.rs     # Version management
│   ├── search.rs         # Tantivy integration
│   ├── quality.rs        # Quality scoring
│   ├── encryption.rs     # AES-256 encryption
│   └── metadata.rs       # Artifact metadata
└── benches/
    └── storage_bench.rs # 1-5ms store, 0.5-2ms retrieve benchmarking
```

**Concrete Deliverables**:
- [ ] Content-addressable storage system with deduplication
- [ ] Artifact versioning with complete history tracking
- [ ] Full-text search via Tantivy integration
- [ ] Quality scoring and metadata management
- [ ] Performance optimization meeting latency targets
- [ ] AES-256 encryption at rest
- [ ] Artifact relationship tracking

**Performance Targets**: 1-5ms store, 0.5-2ms retrieve

**Success Criteria**:
- [ ] Store latency <5ms, retrieve <2ms
- [ ] Deduplication saves 30%+ storage
- [ ] Search returns results in <100ms
- [ ] Encryption transparent to users

#### M3.4: Arbitration Engine (3 weeks)
**Priority**: 🟡 High - Conflict resolution

**Crate Structure**:
```
apps/backend/crates/symphony-arbitration-engine/
├── src/
│   ├── lib.rs
│   ├── conflicts.rs      # Conflict detection
│   ├── resolution.rs     # Resolution strategies
│   ├── routing.rs        # Priority-based routing
│   ├── fairness.rs       # Fairness monitoring
│   ├── queue.rs          # Request queuing
│   └── audit.rs          # Decision audit log
```

**Concrete Deliverables**:
- [ ] Conflict detection and classification system
- [ ] Multiple resolution strategies (priority, quality, resource-based)
- [ ] Quality-based routing for optimal resource utilization
- [ ] Resource allocation arbitration with fairness guarantees
- [ ] Configurable policies for different use cases
- [ ] Request queuing with wait time estimation
- [ ] Decision audit log

**Success Criteria**:
- [ ] Conflict resolution <1ms
- [ ] Fairness deviation <10% over time
- [ ] Priority ordering respected
- [ ] Audit log captures all decisions
#### M3.5: Stale Manager (3 weeks)
**Priority**: 🟡 High - System cleanup and optimization

**Crate Structure**:
```
apps/backend/crates/symphony-stale-manager/
├── src/
│   ├── lib.rs
│   ├── retention.rs      # Retention policies
│   ├── preservation.rs   # Training data preservation
│   ├── archival.rs       # Cloud archival
│   ├── cleanup.rs        # Cleanup execution
│   ├── scoring.rs        # Value scoring
│   └── lifecycle.rs      # Storage lifecycle
```

**Concrete Deliverables**:
- [ ] Training data preservation with intelligent curation
- [ ] Cloud archival system for long-term storage
- [ ] Storage lifecycle management with automated policies
- [ ] Cleanup execution with safety guarantees
- [ ] Usage analytics for system optimization
- [ ] Storage tier management (hot, warm, cold)
- [ ] Cleanup scheduling and throttling

**Success Criteria**:
- [ ] High-value data never deleted
- [ ] Archival preserves retrieval capability
- [ ] Cleanup runs without impacting performance
- [ ] Storage costs reduced by 40%+ over time

### M3 Success Criteria Checklist
- [ ] All five Pit extensions operational and integrated
- [ ] Performance targets met (Pool Manager 50-100ns, Artifact Store 1-5ms/0.5-2ms)
- [ ] Conductor successfully uses all Pit extensions
- [ ] In-process execution stable with no crashes
- [ ] Scalability targets achieved (10,000-node DAG workflows)
- [ ] Resource management and cleanup working effectively

---

## 📊 Implementation Timeline Summary

| Sub-Milestone | Duration | Dependencies | Crate | Status |
|---------------|----------|--------------|-------|--------|
| **M1.1** Environment Setup | 2 weeks | - | `symphony-core-ports` | * [ ] |
| **M1.2** Two-Binary Architecture | 3 weeks | M1.1 | Symphony + XI binaries | * [ ] |
| **M1.3** IPC Protocol | 3 weeks | M1.1 | `symphony-ipc-protocol` | * [ ] |
| **M1.4** Transport Layer | 3 weeks | M1.3 | `symphony-ipc-transport` | * [ ] |
| **M1.5** Message Bus | 3 weeks | M1.3, M1.4 | `symphony-ipc-bus` | * [ ] |
| **M1.6** Python Bridge | 3 weeks | M1.5 | `symphony-python-bridge` | * [ ] |
| **M1.7** Data Layer | 3 weeks | M1.1 | `symphony-data-layer` | * [ ] |
| **M1.8** Data Contracts | 2 weeks | M1.1 | `symphony-data-contracts` | * [ ] |
| **M1.9** Extension SDK | 3 weeks | M1.1 | `symphony-extension-sdk` | * [ ] |
| **M1.10** Concrete Adapters | 4 weeks | M1.1-M1.9 | `symphony-adapters` | * [ ] |
| **M1.11** Domain Core | 3 weeks | M1.10 | `symphony-domain` | * [ ] |
| **M1.12** Tauri Integration | 3 weeks | M1.11 | Tauri commands | * [ ] |

**Total M1 Duration**: 4-5 months with parallel work opportunities

---

## 🔄 Parallel Work Opportunities

### Phase 1 (Weeks 1-6)
Can work in parallel:
- M1.1 Environment Setup + M5.1 Workflow Model
- M1.2 Two-Binary Architecture (after M1.1)
- M1.7 Data Layer + M1.8 Data Contracts (after M1.1)
- M5.2 DAG Validation + M5.3 Serialization (after M5.1)

### Phase 2 (Weeks 7-12)
Can work in parallel:
- M1.3 IPC Protocol + M1.9 Extension SDK
- M5.4 Templates + M5.5 Execution API
- M4.1 Manifest (after M1.9)

### Phase 3 (Weeks 13-20)
Can work in parallel:
- M1.4 Transport + M1.5 Message Bus
- M4.2 Permissions + M4.3 Isolation
- M4.4 Loader + M4.5 Registry

### Phase 4 (Weeks 21-28)
Can work in parallel:
- M1.6 Python Bridge + M1.10 Concrete Adapters
- M4.6 Extension Types
- M3.1 Pool Manager + M3.3 Artifact Store

### Phase 5 (Weeks 29-36)
Can work in parallel:
- M1.11 Domain Core + M1.12 Tauri Integration
- M3.2 DAG Tracker
- M3.4 Arbitration + M3.5 Stale Manager

---

## 🎯 Implementation Strategy

### Development Approach
1. **Incremental Implementation**: Each sub-milestone builds on previous foundations
2. **Parallel Development**: Utilize team members on independent components
3. **Continuous Testing**: Maintain >80% test coverage throughout
4. **Performance First**: Meet performance targets before adding features
5. **Crate-Based Architecture**: Each sub-milestone produces a focused crate

### Quality Assurance
1. **Code Quality**: Automated linting, formatting, and quality gates
2. **Security**: Security review at each sub-milestone, automated scanning
3. **Documentation**: Complete rustdoc for all public APIs
4. **Testing**: Property tests for all serialization and state machines

---

**Next Action**: Begin M1.1 Environment Setup & Port Definitions - create `symphony-core-ports` crate with H2A2 architecture foundation.