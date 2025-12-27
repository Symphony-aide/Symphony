# M5: Visual Orchestration Backend - Design

> **Parent**: [LEVEL2_M5.md](./LEVEL2_M5.md)
> **Type**: Technical Architecture & Design Specifications  
> **PREREQUISITE**: M1.0 sy-commons Foundation MUST be complete before any M5 development

---

## 🚨 CRITICAL DEPENDENCY: sy-commons Foundation

**All M5 crates MUST**:
- Use sy-commons::SymphonyError for ALL error handling
- Use sy-commons logging system for ALL workflow monitoring and logging
- Use sy-commons configuration system for ALL workflow configuration
- Use sy-commons filesystem utilities for ALL template and workflow file operations
- Use sy-commons pre-validation helpers for ALL workflow and template validation
- Include sy-commons as dependency in ALL Cargo.toml files

---

## 📖 Glossary

| Term | Definition |
|------|------------|
| **OFB Python** | Out of Boundary Python - refers to Python API components that handle authoritative validation, RBAC, and data persistence outside the Rust boundary |
| **Pre-validation** | Lightweight technical validation in Rust to prevent unnecessary HTTP requests (NOT business logic) |
| **Authoritative Validation** | Complete validation including RBAC, business rules, and data constraints performed by OFB Python |
| **Two-Layer Architecture** | Rust (orchestration + pre-validation) + OFB Python (validation + persistence) |
| **DAG** | Directed Acyclic Graph |
| **Harmony Board** | Visual workflow composer interface |
| **Template System** | Reusable workflow patterns with parameterization |
| **State Machine** | Finite state machine for workflow execution states |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    M5: VISUAL ORCHESTRATION BACKEND                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    symphony-workflow-model                           │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │   │
│  │  │  Workflow   │  │    Node     │  │    Edge     │                 │   │
│  │  │   Struct    │  │   Types     │  │   Types     │                 │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                 │   │
│  │         │                │                │                         │   │
│  │  ┌──────┴────────────────┴────────────────┴──────┐                 │   │
│  │  │              Workflow Builder                  │                 │   │
│  │  └───────────────────────┬───────────────────────┘                 │   │
│  │                          │                                          │   │
│  │  ┌───────────────────────┴───────────────────────┐                 │   │
│  │  │           DAG Validation & Operations          │                 │   │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐         │                 │   │
│  │  │  │ Cycles  │ │  Topo   │ │  Deps   │         │                 │   │
│  │  │  │ Detect  │ │  Sort   │ │ Resolve │         │                 │   │
│  │  │  └─────────┘ └─────────┘ └─────────┘         │                 │   │
│  │  └───────────────────────────────────────────────┘                 │   │
│  │                                                                     │   │
│  │  ┌───────────────────────────────────────────────┐                 │   │
│  │  │              Serialization Layer               │                 │   │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐         │                 │   │
│  │  │  │  JSON   │ │ Binary  │ │ Version │         │                 │   │
│  │  │  │ Serde   │ │ MsgPack │ │ Migrate │         │                 │   │
│  │  │  └─────────┘ └─────────┘ └─────────┘         │                 │   │
│  │  └───────────────────────────────────────────────┘                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                  symphony-workflow-templates                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │   │
│  │  │  Template   │  │  Parameter  │  │  Template   │                 │   │
│  │  │ Definition  │  │   Schema    │  │   Library   │                 │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                  symphony-workflow-execution                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │   │
│  │  │   State     │  │  Progress   │  │   Event     │                 │   │
│  │  │  Machine    │  │  Tracking   │  │  Streaming  │                 │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                 │   │
│  │  ┌─────────────┐  ┌─────────────┐                                  │   │
│  │  │  Control    │  │   Audit     │                                  │   │
│  │  │  Commands   │  │    Log      │                                  │   │
│  │  └─────────────┘  └─────────────┘                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Crate Structure

### symphony-workflow-model

```
symphony-workflow-model/
├── Cargo.toml
├── src/
│   ├── lib.rs
│   ├── workflow.rs          # Core Workflow struct
│   ├── node.rs              # Node types (Instrument, Operator, Control, etc.)
│   ├── edge.rs              # Edge types (Data, Control, Conditional)
│   ├── builder.rs           # Fluent WorkflowBuilder API
│   ├── metadata.rs          # Workflow and node metadata
│   ├── validation/
│   │   ├── mod.rs
│   │   ├── cycles.rs        # Cycle detection (DFS)
│   │   ├── topo_sort.rs     # Topological sorting (Kahn's algorithm)
│   │   ├── dependencies.rs  # Dependency resolution
│   │   ├── traversal.rs     # Graph traversal utilities
│   │   └── pipeline.rs      # Validation pipeline
│   ├── serialize/
│   │   ├── mod.rs
│   │   ├── json.rs          # JSON serialization
│   │   ├── binary.rs        # MessagePack/Bincode
│   │   ├── pretty.rs        # Pretty printer
│   │   ├── versioning.rs    # Schema versioning
│   │   └── migration.rs     # Version migration
│   └── types.rs             # Common types (DataType, Value, Expression)
└── tests/
    ├── workflow_tests.rs
    ├── validation_tests.rs
    ├── serialization_tests.rs
    └── property_tests.rs
```

### symphony-workflow-templates

```
symphony-workflow-templates/
├── Cargo.toml
├── src/
│   ├── lib.rs
│   ├── template.rs          # WorkflowTemplate struct
│   ├── parameters.rs        # ParameterDefinition, constraints
│   ├── instantiate.rs       # Template instantiation
│   ├── library.rs           # TemplateLibrary management
│   └── versioning.rs        # Template versioning
└── tests/
    ├── template_tests.rs
    └── instantiation_tests.rs
```

### symphony-workflow-execution

```
symphony-workflow-execution/
├── Cargo.toml
├── src/
│   ├── lib.rs
│   ├── state.rs             # ExecutionState, NodeState
│   ├── transitions.rs       # State machine transitions
│   ├── progress.rs          # Progress tracking
│   ├── control.rs           # Control commands
│   ├── events.rs            # Event streaming (broadcast)
│   └── audit.rs             # Audit logging
└── tests/
    ├── state_tests.rs
    ├── event_tests.rs
    └── integration_tests.rs
```

---

## 🔗 Integration Points

### M5 ↔ M1 Integration

```
┌─────────────────────┐     ┌─────────────────────┐
│   M5: Workflow      │     │   M1: IPC Protocol  │
│   Serialization     │────▶│   Message Format    │
│                     │     │                     │
│ - JSON format       │     │ - Workflow messages │
│ - Binary format     │     │ - Event streaming   │
└─────────────────────┘     └─────────────────────┘
         │
         │ Uses M1.3 Message Bus
         ▼
┌─────────────────────┐
│   Execution Events  │
│   via Message Bus   │
└─────────────────────┘
```

### M5 ↔ M3 Integration

```
┌─────────────────────┐     ┌─────────────────────┐
│   M5.1: Workflow    │     │   M3.2: DAG         │
│   Data Model        │────▶│   Tracker           │
│                     │     │                     │
│ - Workflow struct   │     │ - Uses workflow     │
│ - Node/Edge types   │     │   model for DAGs    │
└─────────────────────┘     └─────────────────────┘

┌─────────────────────┐     ┌─────────────────────┐
│   M5.5: Execution   │     │   M3.2: DAG         │
│   State API         │────▶│   Tracker           │
│                     │     │                     │
│ - State machine     │     │ - Execution state   │
│ - Progress tracking │     │   integration       │
└─────────────────────┘     └─────────────────────┘
```

### M5 ↔ M4 Integration

```
┌─────────────────────┐     ┌─────────────────────┐
│   M5.1: Node Types  │     │   M4.6: Extension   │
│                     │────▶│   Types             │
│ - InstrumentNode    │     │                     │
│ - OperatorNode      │     │ - Instruments ref   │
│ - ControlNode       │     │   node types        │
└─────────────────────┘     └─────────────────────┘

┌─────────────────────┐     ┌─────────────────────┐
│   M5.4: Templates   │     │   M4: Extensions    │
│                     │────▶│                     │
│ - Template configs  │     │ - Extension configs │
│   can include       │     │   in templates      │
│   extension refs    │     │                     │
└─────────────────────┘     └─────────────────────┘
```

---

## ⚡ Performance Targets

| Operation | Target | Measurement |
|-----------|--------|-------------|
| Node lookup | O(1) | HashMap-based storage |
| Cycle detection | O(V + E) | DFS with coloring |
| Topological sort | O(V + E) | Kahn's algorithm |
| Validation pipeline | <10ms | Typical workflow (100 nodes) |
| JSON serialization | <1ms | Typical workflow |
| Binary serialization | <0.5ms | MessagePack/Bincode |
| Binary size | 50%+ smaller | vs JSON |
| Compression | 30%+ additional | LZ4/Zstd |
| Template search | <100ms | 1000+ templates |
| Progress update | <10ms | After node completion |
| Event delivery | <1ms | Broadcast to subscribers |
| Audit query | <100ms | Time range + filters |

---

## 🧪 Testing Strategy

### Three-Layer Testing Architecture

**Layer 1: Unit Tests (Rust) - <100ms**
- **Mock-Based Contract Testing**: All external dependencies mocked using mockall
- **Boundary Separation**: Rust tests focus on workflow data structures, DAG algorithms, and serialization
- **Coverage**: Workflow creation/modification, node/edge types, builder API, validation algorithms
- **Property Tests**: Topological sort correctness, cycle detection, serialization round-trips
- **Performance**: Sub-100ms execution for entire unit test suite

**Layer 2: Integration Tests (Rust + OFB Python) - <5s**
- **WireMock Contract Verification**: HTTP endpoints mocked with WireMock for OFB Python integration
- **Cross-Component Workflows**: Full execution lifecycle, pause/resume, retry/skip flows
- **Event Streaming**: Multiple subscribers, concurrent executions
- **Template System**: Instantiation with OFB Python validation
- **Audit Logging**: Persistence and querying with OFB Python storage

**Layer 3: Pre-validation Tests (Rust) - <1ms**
- **Technical Validation Only**: Schema validation, type checking, basic structural constraints
- **No Business Logic**: Pre-validation does NOT include user permissions, workflow authorization, or data persistence
- **Fast Rejection**: Prevent unnecessary HTTP requests to OFB Python layer
- **Examples**: JSON schema validation, DAG cycle detection, required field checks

### Testing Boundary Separation

**Rust Layer Tests**:
- Workflow data model operations
- DAG validation algorithms (cycle detection, topological sort)
- Serialization formats (JSON, MessagePack, Bincode)
- Template instantiation logic
- State machine transitions
- Event streaming and progress tracking
- Performance benchmarks (10,000+ node workflows)

**OFB Python Layer Tests** (via WireMock):
- Authoritative workflow validation with business rules
- User permission checking for workflow operations
- Template marketplace integration
- Audit log persistence and querying
- Workflow execution authorization

### Unit Tests
- Workflow creation and modification
- All node and edge types
- Builder API fluent interface
- Metadata system
- Cycle detection algorithms
- Topological sort correctness
- Dependency resolution
- Serialization round-trips
- Template instantiation
- State machine transitions

### Property Tests (proptest)
- Topological sort respects dependencies
- Cycle detection finds all cycles
- Valid workflows pass validation
- Serialization round-trip preservation
- Template instantiation produces valid workflows

### Integration Tests
- Full execution lifecycle
- Pause/resume flow
- Retry/skip flow
- Event streaming with multiple subscribers
- Audit logging persistence
- Concurrent executions

### Performance Tests (criterion)
- Large workflow operations (10,000+ nodes)
- Serialization benchmarks
- Validation pipeline timing
- Event streaming throughput

---

## 🔐 Error Handling

### Validation Errors
```rust
pub enum ValidationError {
    CycleDetected { path: Vec<NodeId> },
    OrphanNode { node_id: NodeId },
    DisconnectedInput { node_id: NodeId, port: String },
    TypeMismatch { edge_id: EdgeId, expected: DataType, found: DataType },
    MissingRequiredInput { node_id: NodeId, port: String },
    DuplicateNodeId { id: NodeId },
    InvalidEdge { edge_id: EdgeId, reason: String },
}
```

### Serialization Errors
```rust
pub enum SerializeError {
    JsonError(serde_json::Error),
    BinaryError(String),
    CompressionError(String),
    VersionMismatch { expected: SchemaVersion, found: SchemaVersion },
}
```

### Execution Errors
```rust
pub enum ExecutionError {
    InvalidTransition { from: ExecutionState, to: ExecutionState },
    NodeNotFound { node_id: NodeId },
    InvalidCommand { command: String, reason: String },
    TimeoutExceeded { node_id: NodeId, timeout: Duration },
}
```

---

## 📊 Data Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Template   │────▶│ Instantiate  │────▶│   Workflow   │
│   Library    │     │  with Params │     │   Instance   │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                                  ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Validate   │◀────│   Builder    │◀────│   Manual     │
│   Pipeline   │     │     API      │     │   Creation   │
└──────┬───────┘     └──────────────┘     └──────────────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Serialize   │────▶│    Store     │────▶│    Load      │
│  (JSON/Bin)  │     │  (File/DB)   │     │  & Execute   │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                                  ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Execution  │────▶│    Event     │────▶│    Audit     │
│   Engine     │     │   Stream     │     │     Log      │
└──────────────┘     └──────────────┘     └──────────────┘
```

---

## 🔄 State Machine Diagram

```
                    ┌─────────┐
                    │ Pending │
                    └────┬────┘
                         │ Start
                         ▼
              ┌──────────────────────┐
              │       Running        │◀──────────────┐
              └──────────┬───────────┘               │
                         │                           │
         ┌───────────────┼───────────────┐          │
         │               │               │          │
         ▼               ▼               ▼          │
    ┌─────────┐    ┌──────────┐    ┌──────────┐    │
    │ Paused  │    │Completed │    │  Failed  │    │
    └────┬────┘    └──────────┘    └──────────┘    │
         │                                          │
         │ Resume                                   │
         └──────────────────────────────────────────┘

         ┌─────────────────────────────────────────┐
         │                                         │
         │  From Running, Paused, WaitingForInput: │
         │           Cancel → Cancelled            │
         │                                         │
         └─────────────────────────────────────────┘
```

---

## 📝 Key Design Decisions

1. **HashMap for Node Storage**: O(1) lookup critical for large workflows
2. **Kahn's Algorithm for Topo Sort**: Deterministic, handles disconnected components
3. **DFS with Coloring for Cycles**: Standard O(V+E) approach with path tracking
4. **Broadcast Channel for Events**: Tokio broadcast enables multiple subscribers
5. **Trait-based Audit Storage**: Allows in-memory, file, or database backends
6. **Serde for Serialization**: Industry standard, supports JSON and binary formats
7. **Schema Versioning Envelope**: Future-proofs serialization format
