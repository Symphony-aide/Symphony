# Level 2 M1 Design: Core Infrastructure Architecture

> **Technical Architecture**: Detailed design and crate structures for M1 Core Infrastructure implementation

**Parent**: Level 1 M1 Core Infrastructure  
**Architecture**: H2A2 (Harmonic Hexagonal Actor Architecture) + Two-Layer Data Architecture  
**Implementation**: Two-Binary + Port-Adapter + Actor Model + Data Layer

---

## 📖 Glossary

| Term | Definition |
|------|------------|
| **OFB Python** | Out of Boundary Python - refers to Python API components that handle authoritative validation, RBAC, and data persistence outside the Rust boundary |
| **Pre-validation** | Lightweight technical validation in Rust to prevent unnecessary HTTP requests (NOT business logic) |
| **Authoritative Validation** | Complete validation including RBAC, business rules, and data constraints performed by OFB Python |
| **Two-Layer Architecture** | Rust (orchestration + pre-validation) + OFB Python (validation + persistence) |
| **H2A2** | Harmonic Hexagonal Actor Architecture |
| **Port** | Interface abstraction in hexagonal architecture |
| **Adapter** | Concrete implementation of a port interface |
| **Mock-Based Contract Testing** | Testing approach using mock implementations to verify trait contracts and format validation without external dependencies |
| **WireMock Contract Verification** | Integration testing using WireMock to verify HTTP request/response format matches OFB Python API expectations |
| **Three-Layer Testing** | Unit tests (mocks), Integration tests (WireMock), Pre-validation tests (performance + logic) |

---

## 🏗️ High-Level Architecture

### H2A2 Architecture Overview
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SYMPHONY BACKEND ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                         DOMAIN CORE (Pure Rust)                        │ │
│  │                                                                        │ │
│  │   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │ │
│  │   │  Orchestration  │  │    Workflow     │  │    Extension    │      │ │
│  │   │     Engine      │  │   Definitions   │  │    Policies     │      │ │
│  │   └────────┬────────┘  └────────┬────────┘  └────────┬────────┘      │ │
│  │            │                    │                    │                │ │
│  │            └────────────────────┼────────────────────┘                │ │
│  │                                 │                                     │ │
│  └─────────────────────────────────┼─────────────────────────────────────┘ │
│                                    │                                       │
│  ┌─────────────────────────────────┼─────────────────────────────────────┐ │
│  │                           PORT INTERFACES                              │ │
│  │                                 │                                      │ │
│  │   ┌─────────────┐  ┌───────────┴───────────┐  ┌─────────────┐        │ │
│  │   │TextEditing- │  │       PitPort         │  │ Extension-  │        │ │
│  │   │    Port     │  │ (Pool, DAG, Artifact) │  │    Port     │        │ │
│  │   └──────┬──────┘  └───────────┬───────────┘  └──────┬──────┘        │ │
│  │          │                     │                     │                │ │
│  └──────────┼─────────────────────┼─────────────────────┼────────────────┘ │
│             │                     │                     │                  │
│  ┌──────────┼─────────────────────┼─────────────────────┼────────────────┐ │
│  │          │              ADAPTER LAYER                │                 │ │
│  │          │                     │                     │                 │ │
│  │   ┌──────┴──────┐  ┌───────────┴───────────┐  ┌──────┴──────┐        │ │
│  │   │  Xi-Core    │  │     Pit Adapter       │  │Actor-Based  │        │ │
│  │   │  Adapter    │  │  (Direct Rust calls)  │  │  Extension  │        │ │
│  │   │             │  │                       │  │   Adapter   │        │ │
│  │   └──────┬──────┘  └───────────┬───────────┘  └──────┬──────┘        │ │
│  │          │                     │                     │                │ │
│  └──────────┼─────────────────────┼─────────────────────┼────────────────┘ │
│             │                     │                     │                  │
│  ┌──────────┴──────┐  ┌───────────┴───────────┐  ┌──────┴──────────────┐  │
│  │    XI-EDITOR    │  │       THE PIT         │  │    GRAND STAGE      │  │
│  │   (xi-rope,     │  │  ┌─────────────────┐  │  │   (Actor System)    │  │
│  │  xi-core-lib,   │  │  │  Pool Manager   │  │  │                     │  │
│  │    xi-rpc)      │  │  │  DAG Tracker    │  │  │  ┌──────────────┐   │  │
│  │                 │  │  │  Artifact Store │  │  │  │ Instruments  │   │  │
│  │  ❌ xi-plugin   │  │  │  Arbitration    │  │  │  │  Operators   │   │  │
│  │  (NOT USED)     │  │  │  Stale Manager  │  │  │  │   Motifs     │   │  │
│  │                 │  │  └─────────────────┘  │  │  └──────────────┘   │  │
│  └─────────────────┘  └───────────────────────┘  └─────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Two-Binary Communication Architecture `(NEW)`
```
┌─────────────────────────────────────┐    ┌─────────────────────────────────────┐
│           SYMPHONY BINARY           │    │           XI-EDITOR BINARY          │
│         (symphony.exe)              │    │         (xi-editor.exe)             │
├─────────────────────────────────────┤    ├─────────────────────────────────────┤
│                                     │    │                                     │
│  ┌─────────────────────────────────┐│    │┌─────────────────────────────────┐  │
│  │        Tauri Frontend           ││    ││        JSON-RPC Server          │  │
│  │      (React + TypeScript)       ││    ││     (Stdio Transport)           │  │
│  └─────────────────────────────────┘│    │└─────────────────────────────────┘  │
│                 │                   │    │                 │                   │
│  ┌─────────────────────────────────┐│    │┌─────────────────────────────────┐  │
│  │       Symphony AIDE Core        ││    ││        XI-editor Core           │  │
│  │                                 ││    ││                                 │  │
│  │  ┌─────────────────────────────┐││    ││┌─────────────────────────────────┐│  │
│  │  │     Python Conductor        │││    │││       Text Editing Engine      ││  │
│  │  │    (subprocess in-process)   │││    │││        (xi-rope, xi-core)       ││  │
│  │  └─────────────────────────────┘││    ││└─────────────────────────────────┘│  │
│  │                                 ││    ││                                 │  │
│  │  ┌─────────────────────────────┐││    ││┌─────────────────────────────────┐│  │
│  │  │         The Pit             │││    │││      Buffer Management         ││  │
│  │  │   (5 infrastructure exts)    │││    │││     (BufferId, Revision)        ││  │
│  │  └─────────────────────────────┘││    ││└─────────────────────────────────┘│  │
│  │                                 ││    ││                                 │  │
│  │  ┌─────────────────────────────┐││    ││┌─────────────────────────────────┐│  │
│  │  │    Extension Manager        │││    │││    Legacy Plugin System         ││  │
│  │  │   (Actor-based isolation)    │││    │││   (Syntax, LSP, Languages)      ││  │
│  │  └─────────────────────────────┘││    ││└─────────────────────────────────┘│  │
│  └─────────────────────────────────┘│    │└─────────────────────────────────┘  │
│                 │                   │    │                 │                   │
│  ┌─────────────────────────────────┐│    │┌─────────────────────────────────┐  │
│  │      JSON-RPC Client            ││    ││       Event Streaming           │  │
│  │    (to XI-editor binary)        ││    ││    (STDIO stdout stream)        │  │
│  └─────────────────────────────────┘│    │└─────────────────────────────────┘  │
└─────────────────────────────────────┘    └─────────────────────────────────────┘
                 │                                           │
                 │         JSON-RPC over STDIO               │
                 │◄─────────────────────────────────────────►│
                 │                                           │
         ┌───────────────────────────────────────────────────────────┐
         │                Communication Protocol                     │
         │                                                           │
         │  Symphony → XI-editor (JSON-RPC via stdin):               │
         │  • file_changed, insert_text, delete_text                 │
         │  • new_view, close_view, save_file                        │
         │  • move_cursor, set_selection                             │
         │                                                           │
         │  XI-editor → Symphony (Events via stdout stream):         │
         │  • buffer_changed, cursor_moved, file_modified            │
         │  • view_closed, selection_changed                         │
         │                                                           │
         │  Format: Line-delimited JSON (like Server-Sent Events)    │
         │  Reliability: OS-level buffering, ordered delivery        │
         │  Performance: <1ms JSON-RPC, <10ms event streaming        │
         └───────────────────────────────────────────────────────────┘
```

---

## 📦 Crate Structure and Dependencies

### Core Port Definitions
```
apps/backend/crates/symphony-core-ports/
├── Cargo.toml                    # async-trait, serde, uuid, thiserror
├── src/
│   ├── lib.rs                   # Public API exports
│   ├── ports.rs                 # Four port trait definitions
│   │   ├── TextEditingPort      # XI-editor abstraction
│   │   ├── PitPort              # High-performance Pit operations
│   │   ├── ExtensionPort        # Extension lifecycle and communication
│   │   └── ConductorPort        # Python Conductor bridge
│   ├── types.rs                 # Domain types and data structures
│   │   ├── BufferId, ViewId     # Text editing identifiers
│   │   ├── ModelSpec, ModelHandle # AI model specifications
│   │   ├── ExtensionId, ExtensionManifest # Extension metadata
│   │   ├── ProcessId, SyncEvent # Binary process types (NEW)
│   │   └── DecisionContext, Policy # Conductor types
│   ├── errors.rs                # Comprehensive error types
│   │   ├── PortError            # Base error for all ports
│   │   ├── ProcessCommunicationFailed # Binary sync errors (NEW)
│   │   └── SynchronizationError # State consistency errors (NEW)
│   ├── mocks.rs                 # Mock implementations for testing
│   │   ├── MockTextEditingAdapter
│   │   ├── MockPitAdapter
│   │   ├── MockExtensionAdapter
│   │   └── MockConductorAdapter
│   └── binary.rs                # Two-binary specific adaptations (NEW)
└── tests/
    └── integration_tests.rs     # Port interface tests
```

### IPC Communication Infrastructure
```
apps/backend/crates/symphony-ipc-protocol/
├── Cargo.toml                   # rmp-serde, bincode, serde_json, proptest
├── src/
│   ├── lib.rs
│   ├── message.rs               # Message envelope types
│   ├── serialize.rs             # MessagePack/Bincode implementations
│   ├── schema.rs                # Schema validation system
│   ├── registry.rs              # Message type registry
│   ├── jsonrpc.rs               # JSON-RPC for XI-editor (NEW)
│   │   ├── JsonRpcMessage       # JSON-RPC 2.0 compliant messages
│   │   ├── JsonRpcClient        # Symphony → XI-editor client
│   │   └── JsonRpcServer        # XI-editor server implementation
│   ├── xi_protocol.rs           # XI-editor specific messages (NEW)
│   │   ├── XiOperation          # Buffer, file, cursor operations
│   │   └── XiEvent              # XI-editor → Symphony events
│   └── pretty.rs                # Human-readable message output
└── tests/
    └── property_tests.rs        # Round-trip and validation tests

apps/backend/crates/symphony-ipc-transport/
├── Cargo.toml                   # tokio, async-trait
├── src/
│   ├── lib.rs
│   ├── traits.rs                # Transport trait definitions
│   ├── unix_socket.rs           # Unix domain sockets (Linux/macOS)
│   ├── named_pipe.rs            # Windows named pipes
│   ├── shared_memory.rs         # Ultra-low-latency transport
│   ├── stdio.rs                 # STDIO transport for XI-editor (NEW)
│   │   ├── StdioTransport       # Process stdin/stdout communication
│   │   ├── Line-based framing   # Newline-delimited JSON
│   │   └── Event streaming      # Continuous stream like SSE
│   ├── pool.rs                  # Connection pooling
│   └── reconnect.rs             # Automatic reconnection logic
└── benches/
    └── transport_bench.rs       # Performance benchmarks

apps/backend/crates/symphony-ipc-bus/
├── Cargo.toml                   # tokio, broadcast, dashmap
├── src/
│   ├── lib.rs
│   ├── bus.rs                   # Core message bus implementation
│   ├── router.rs                # Pattern-based message routing
│   ├── endpoint.rs              # Endpoint registration and discovery
│   ├── correlation.rs           # Request/response correlation
│   ├── pubsub.rs                # Topic-based publish/subscribe
│   ├── health.rs                # Bus and endpoint health monitoring
│   ├── binary_sync.rs           # Binary synchronization coordinator (NEW)
│   │   ├── BinarySyncCoordinator # Symphony ↔ XI-editor coordination
│   │   ├── SyncState            # File and buffer state management
│   │   └── ConflictResolver     # Conflict detection and resolution
│   ├── xi_bridge.rs             # XI-editor bridge (NEW)
│   │   ├── XiEditorBridge       # Specialized XI-editor communication
│   │   ├── XiEventHandler       # XI-editor event processing
│   │   └── BufferManager        # Buffer state management
│   └── batching.rs              # Message batching for throughput
└── tests/
    └── load_tests.rs            # Performance and scalability tests
```

### Python-Rust Integration Bridge
```
apps/backend/crates/symphony-python-bridge/
├── Cargo.toml                   # pyo3, pyo3-asyncio, tokio
├── src/
│   ├── lib.rs                   # PyO3 module definition
│   ├── bindings.rs              # PyO3 FFI bindings
│   ├── types.rs                 # Rust ↔ Python type conversion
│   ├── errors.rs                # Cross-language error handling
│   ├── async_support.rs         # Async/await bridge
│   ├── pit_api.rs               # Direct Pit extension APIs
│   ├── conductor.rs             # Conductor subprocess management (NEW)
│   │   ├── ConductorManager     # Python subprocess within Symphony
│   │   ├── Direct Pit access    # No IPC overhead for Pit operations
│   │   └── Process lifecycle    # Startup, health, shutdown
│   └── subprocess.rs            # Python subprocess integration (NEW)
├── python/
│   └── symphony_bridge.py       # Python interface module
└── benches/
    └── ffi_bench.rs             # FFI overhead benchmarks (<0.01ms target)
```

### Extension System Foundation
```
apps/backend/crates/symphony-extension-sdk/
├── Cargo.toml                   # tokio, serde, toml
├── src/
│   ├── lib.rs
│   ├── manifest.rs              # TOML manifest schema and parser
│   │   ├── ExtensionManifest    # Complete extension metadata
│   │   ├── Dependency specs     # Version ranges, optional deps
│   │   └── Permission declarations # Granular capability system
│   ├── lifecycle.rs             # Extension lifecycle hooks
│   │   ├── ExtensionLifecycle   # Load, activate, deactivate, unload
│   │   └── LoadContext          # Context provided during loading
│   ├── permissions.rs           # Permission system foundation
│   │   ├── Permission types     # File, network, system, model access
│   │   ├── Permission scopes    # Read, write, execute permissions
│   │   └── Runtime checking     # Permission enforcement
│   ├── registry.rs              # Extension registry and discovery
│   ├── traits.rs                # Base Extension trait
│   ├── macros.rs                # Derive macros for boilerplate
│   ├── actor.rs                 # Actor-based process isolation (NEW)
│   │   ├── ExtensionActor       # Process management for extensions
│   │   ├── ExtensionType        # Instrument, Operator, Motif types
│   │   └── IsolationConfig      # Memory, CPU, network limits
│   ├── process.rs               # Extension process management (NEW)
│   │   ├── ExtensionProcessManager # Process spawning and lifecycle
│   │   ├── Process isolation    # Sandboxing and security
│   │   └── Crash detection      # Recovery and restart logic
│   └── xi_bridge.rs             # XI-editor plugin coordination (NEW)
│       ├── XiEditorBridge       # Plugin capability discovery
│       ├── XiPlugin metadata    # Available XI-editor plugins
│       └── Interaction patterns # Extension workflow coordination
└── examples/
    ├── simple_instrument.rs     # AI model extension example
    ├── basic_operator.rs        # Utility extension example
    └── ui_addon.rs              # UI enhancement extension example
```

### Concrete Adapter Implementations `(NEW)`
```
apps/backend/crates/symphony-adapters/
├── Cargo.toml                   # xi-rpc, tokio, async-trait
├── src/
│   ├── lib.rs
│   ├── xi_editor.rs             # XiEditorAdapter (TextEditingPort impl)
│   │   ├── JSON-RPC client      # Communication with XI-editor binary
│   │   ├── Buffer metadata cache # Local buffer state management
│   │   ├── Event streaming      # XI-editor → Symphony events
│   │   └── Process failure handling # Reconnection and recovery
│   ├── pit.rs                   # PitAdapter (PitPort impl)
│   │   ├── Direct in-process access # No IPC overhead
│   │   ├── All five Pit modules # Pool, DAG, Artifact, Arbitration, Stale
│   │   ├── Performance monitoring # 50-100ns allocation targets
│   │   └── Metrics collection   # Usage analytics and optimization
│   ├── extensions.rs            # ActorExtensionAdapter (ExtensionPort impl)
│   │   ├── Process isolation    # Extensions in separate processes
│   │   ├── Message passing      # Actor-based communication
│   │   ├── Crash detection      # Extension failure handling
│   │   └── Resource monitoring  # Memory, CPU, network limits
│   ├── conductor.rs             # PythonConductorAdapter (ConductorPort impl)
│   │   ├── Python subprocess    # Conductor within Symphony binary
│   │   ├── PyO3 bridge integration # FFI with <0.01ms overhead
│   │   ├── Direct Pit access    # No IPC for infrastructure operations
│   │   └── Error handling       # Cross-language error propagation
│   └── common.rs                # Shared adapter utilities
└── tests/
    ├── xi_editor_tests.rs       # XiEditorAdapter integration tests
    ├── pit_tests.rs             # PitAdapter performance tests
    ├── extension_tests.rs       # ActorExtensionAdapter isolation tests
    └── conductor_tests.rs       # PythonConductorAdapter FFI tests
```

### Domain Core Orchestration `(NEW)`
```
apps/backend/crates/symphony-domain/
├── Cargo.toml                   # tokio, async-trait
├── src/
│   ├── lib.rs
│   ├── core.rs                  # SymphonyCore orchestration engine
│   │   ├── Uses all four ports  # TextEditing, Pit, Extension, Conductor
│   │   ├── User action processing # Complete workflow coordination
│   │   ├── File operation coordination # XI-editor integration
│   │   └── UI update coordination # Extension system integration
│   ├── state.rs                 # State management and synchronization
│   │   ├── SymphonyState        # Application state structure
│   │   ├── File state tracking  # File system state management
│   │   └── Buffer state sync    # XI-editor buffer synchronization
│   ├── sync.rs                  # Binary synchronization coordination
│   │   ├── StateSynchronizer    # Symphony ↔ XI-editor state sync
│   │   ├── File state sync      # File system change propagation
│   │   └── Buffer state sync    # Real-time buffer synchronization
│   ├── events.rs                # Event streaming and process lifecycle
│   │   ├── EventStreamer        # Bidirectional event streaming
│   │   ├── Symphony → XI-editor # File system and project events
│   │   └── XI-editor → Symphony # Buffer and cursor events
│   ├── lifecycle.rs             # Process lifecycle management
│   │   ├── ProcessLifecycleManager # XI-editor process management
│   │   ├── Health monitoring    # Process health checks
│   │   └── Automatic restart    # Process failure recovery
│   └── workflows.rs             # Workflow coordination
│       ├── WorkflowCoordinator  # Complex workflow execution
│       ├── Step-by-step coordination # Component orchestration
│       └── Error handling       # Workflow rollback and recovery
└── tests/
    └── integration_tests.rs     # End-to-end integration tests
```

### Tauri Integration Layer `(NEW)`
```
src-tauri/
├── Cargo.toml                   # tauri, tokio, serde
├── src/
│   ├── main.rs                  # Tauri application entry point
│   ├── commands/                # Tauri command handlers
│   │   ├── mod.rs
│   │   ├── conductor.rs         # Conductor operation commands
│   │   │   ├── submit_decision  # AI decision making
│   │   │   ├── execute_workflow # Workflow execution
│   │   │   └── get_policy       # Policy retrieval
│   │   ├── text_editing.rs      # Text editing operation commands
│   │   │   ├── insert_text      # Text insertion
│   │   │   ├── delete_text      # Text deletion
│   │   │   ├── get_buffer_content # Buffer content retrieval
│   │   │   └── buffer_operations # Undo, redo, selection
│   │   ├── extensions.rs        # Extension operation commands
│   │   │   ├── load_extension   # Extension loading
│   │   │   ├── unload_extension # Extension unloading
│   │   │   └── invoke_extension # Extension invocation
│   │   └── workflows.rs         # Workflow operation commands
│   │       ├── create_workflow  # Workflow creation
│   │       ├── execute_workflow # Workflow execution
│   │       └── monitor_workflow # Workflow monitoring
│   ├── state.rs                 # Application state management
│   │   ├── AppState             # Tauri application state
│   │   ├── SymphonyCore integration # Backend integration
│   │   └── State cleanup        # Shutdown handling
│   ├── events.rs                # Event handling and streaming
│   │   ├── EventStreamer        # Backend → Frontend events
│   │   ├── Event filtering      # Event routing and filtering
│   │   └── Real-time updates    # UI synchronization
│   └── error.rs                 # Error handling across Tauri boundary
│       ├── TauriError types     # Comprehensive error handling
│       ├── Type conversion      # Safe type conversions
│       └── Error serialization  # User-friendly error messages
└── tauri.conf.json              # Tauri configuration
```

---

## 🔄 Communication Patterns and Data Flow

### Binary Communication Protocol `(NEW)`
```
Symphony Process                    XI-editor Process
      │                                   │
      ├─ File System Watcher              │
      │  (detects external changes)       │
      │                                   │
      ├─ JSON-RPC: file_changed ────────► │
      │                                   ├─ Updates buffer
      │                                   │
      │ ◄─── STDIO Stream: buffer_updated ─┤
      │                                   │
      ├─ AI Analysis                      │
      │  (processes for suggestions)      │
      │                                   │
      ├─ JSON-RPC: insert_suggestion ───► │
      │                                   ├─ Shows suggestion
      │                                   │
      │ ◄─── STDIO Stream: cursor_moved ───┤
      │                                   │
      ├─ Context Update                   │
```

### Extension Interaction Patterns `(NEW)`
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SYMPHONY EXTENSION ECOSYSTEM                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────┐ │
│  │  🧩 Motifs      │  │  🎻 Instruments │  │  ⚙️ Operators   │  │🔧 XI-   │ │
│  │  (UI Enhance)   │  │  (AI Models)    │  │  (Utilities)    │  │plugins  │ │
│  │                 │  │                 │  │                 │  │         │ │
│  │ • Status Bar    │  │ • GPT-4         │  │ • JSON Transform│  │• Syntax │ │
│  │ • Minimap       │  │ • Claude        │  │ • File Watcher  │  │• LSP    │ │
│  │ • Themes        │  │ • Local Models  │  │ • Code Format   │  │• Lang   │ │
│  │ • Panels        │  │ • Custom AI     │  │ • Data Process  │  │Support  │ │
│  └─────────┬───────┘  └─────────┬───────┘  └─────────┬───────┘  └────┬────┘ │
│            │                    │                    │                │      │
│            └────────────────────┼────────────────────┼────────────────┘      │
│                                 │                    │                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                    Extension Interaction Patterns                       │ │
│  │                                                                         │ │
│  │  Pattern 1: AI Code Generation Workflow                                │ │
│  │  Motif → Instrument → Operator → XI-editor                             │ │
│  │  (UI) → (AI Gen) → (Format) → (Insert)                                 │ │
│  │                                                                         │ │
│  │  Pattern 2: Code Analysis Workflow                                     │ │
│  │  XI-editor → Operator → Instrument → Motif                             │ │
│  │  (Change) → (Analyze) → (AI Suggest) → (Display)                       │ │
│  │                                                                         │ │
│  │  Pattern 3: Real-time Assistance                                       │ │
│  │  XI-editor ↔ Symphony Extensions ↔ Motif                               │ │
│  │  (Continuous feedback loop)                                            │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Performance Characteristics and Targets

| Component | Performance Target | Measurement Method |
|-----------|-------------------|-------------------|
| **Port Interface Calls** | <0.01ms overhead | Trait vtable benchmarks |
| **JSON-RPC (Symphony ↔ XI-editor)** | <1ms latency | Request/response timing |
| **STDIO Event Streaming** | <10ms delivery | Event timestamp tracking |
| **PyO3 FFI Bridge** | <0.01ms overhead | Cross-language call timing |
| **Pit Operations** | 50-100ns allocation | Cache hit benchmarks |
| **Extension Message Passing** | <1ms actor communication | Process IPC timing |
| **State Synchronization** | <10ms consistency | Binary state comparison |
| **Tauri Command Execution** | <5ms frontend response | Command handler timing |

---

## 🔒 Security and Isolation Architecture

### Extension Isolation Model `(NEW)`
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        EXTENSION SECURITY ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                    SYMPHONY MAIN PROCESS                               │ │
│  │                                                                        │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │ │
│  │  │                Extension Security Manager                        │  │ │
│  │  │                                                                 │  │ │
│  │  │  • Permission validation and enforcement                        │  │ │
│  │  │  • Resource limit monitoring (CPU, memory, network)             │  │ │
│  │  │  • Process lifecycle management                                 │  │ │
│  │  │  • Crash detection and recovery                                 │  │ │
│  │  │  • Audit logging and security events                           │  │ │
│  │  └─────────────────────────────────────────────────────────────────┘  │ │
│  │                                │                                       │ │
│  └────────────────────────────────┼───────────────────────────────────────┘ │
│                                   │                                         │
│                            Actor Messages                                   │
│                          (IPC via channels)                                 │
│                                   │                                         │
│  ┌────────────────────┬───────────┼───────────┬────────────────────────────┐ │
│  │   Extension        │           │           │        Extension           │ │
│  │   Process 1        │           │           │        Process N           │ │
│  │                    │           │           │                            │ │
│  │ ┌────────────────┐ │           │           │ ┌────────────────────────┐ │ │
│  │ │   Instrument   │ │           │           │ │       Motif            │ │ │
│  │ │   (AI Model)   │ │           │           │ │    (UI Component)      │ │ │
│  │ └────────────────┘ │           │           │ └────────────────────────┘ │ │
│  │                    │           │           │                            │ │
│  │ Resource Limits:   │           │           │ Resource Limits:           │ │
│  │ • Memory: 512MB    │           │           │ • Memory: 128MB            │ │
│  │ • CPU: 50%         │           │           │ • CPU: 25%                 │ │
│  │ • Network: Limited │           │           │ • Network: None            │ │
│  │ • Files: Sandboxed │           │           │ • Files: Read-only         │ │
│  └────────────────────┘           │           └────────────────────────────┘ │
│                                   │                                         │
│                                   │                                         │
│  ┌────────────────────────────────┼─────────────────────────────────────────┐ │
│  │                    XI-EDITOR PROCESS                                    │ │
│  │                                │                                         │ │
│  │  ┌─────────────────────────────┼─────────────────────────────────────┐  │ │
│  │  │              XI-editor Plugin System (Legacy)                    │  │ │
│  │  │                             │                                     │  │ │
│  │  │  • Trusted plugins only (syntax highlighting, LSP)               │  │ │
│  │  │  • No network access                                             │  │ │
│  │  │  • File system access limited to project                        │  │ │
│  │  │  • Memory and CPU managed by XI-editor                          │  │ │
│  │  └─────────────────────────────┼─────────────────────────────────────┘  │ │
│  └────────────────────────────────┼─────────────────────────────────────────┘ │
│                                   │                                         │
│                            JSON-RPC over STDIO                              │
│                          (Controlled communication)                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Permission System Architecture
```
Permission Types:
├── File System Access
│   ├── Read permissions (specific paths)
│   ├── Write permissions (sandboxed directories)
│   └── Execute permissions (limited binaries)
├── Network Access
│   ├── HTTP/HTTPS requests (specific domains)
│   ├── WebSocket connections (approved endpoints)
│   └── Local network access (disabled by default)
├── System Resources
│   ├── Memory limits (enforced by OS)
│   ├── CPU limits (process scheduling)
│   └── GPU access (AI model extensions only)
└── Symphony Integration
    ├── Pit access (infrastructure extensions only)
    ├── XI-editor communication (controlled via ports)
    └── Extension interaction (message passing only)
```

This design provides a comprehensive technical architecture for M1 Core Infrastructure, ensuring clean separation of concerns, high performance, and robust security while maintaining the flexibility needed for Symphony's AI-first development environment.