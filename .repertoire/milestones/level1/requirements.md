# Level 1 Requirements: Backend-Focused Milestone Decomposition

> **Scope**: Backend-focused decomposition of M1, M5, M4, M3 into actionable sub-milestones
> **Ordering**: M1 → M5 → M4 → M3 (foundational to complex)

**Current Status**: Level 1 decomposition of high-level milestones into 2-4 week sub-milestones  
**Target**: Actionable backend implementation tasks with clear deliverables and success criteria

---

## 🎯 Sub-Milestone Requirements

### M1: Core Infrastructure (3-4 months)
**Goal**: Build the foundational communication and integration systems
**Priority**: Critical
**Status**: * [ ]

**Acceptance Criteria (Gherkin-style ATDD)**:

Scenario: H2A2 Architecture Foundation
  Given Symphony needs clean port-based architecture
  When M1.1 Environment Setup & Port Definitions is complete
  Then port trait definitions exist for all four interfaces
  And mock adapters enable isolated testing
  And development environment supports H2A2 architecture

Scenario: Two-Binary Architecture Implementation
  Given Symphony and XI-editor need process separation
  When M1.2 Two-Binary Architecture Setup is complete
  Then Symphony binary integrates with Tauri frontend
  And XI-editor binary runs as standalone process with JSON-RPC server
  And process lifecycle management handles health monitoring
  And binary synchronization maintains state consistency

Scenario: High-Performance IPC Communication
  Given components need efficient inter-process communication
  When M1.3-M1.5 IPC system is complete
  Then message latency is <0.3ms for standard operations
  And throughput supports 10,000+ messages/second
  And Python-Rust bridge overhead is <0.01ms

**Correctness Properties**:
- Property 1: All port interfaces must have concrete adapter implementations
- Property 2: Binary synchronization must maintain data consistency across processes
- Property 3: IPC communication must meet performance targets under load
- Property 4: Extension SDK must support safe process isolation

**Sub-Milestones**:
- M1.1: Environment Setup & Port Definitions (2 weeks)
- M1.2: Two-Binary Architecture Implementation (3 weeks) `(NEW)`
- M1.3: IPC Protocol & Serialization (3 weeks)
- M1.4: Transport Layer (3 weeks)
- M1.5: Message Bus Core (3 weeks)
- M1.6: Python-Rust Bridge (3 weeks)
- M1.7: Extension SDK Foundation (3 weeks)
- M1.8: Concrete Adapters Implementation (4 weeks) `(NEW)`
- M1.9: Domain Core Orchestration (3 weeks) `(NEW)`
- M1.10: Tauri Integration Layer (3 weeks) `(NEW)`

---

### M5: Visual Orchestration Backend (2-3 months)
**Goal**: Backend support for visual workflow composition
**Priority**: High
**Status**: * [ ]

**Acceptance Criteria (Gherkin-style ATDD)**:

Scenario: Workflow Data Model Implementation
  Given visual workflows need backend representation
  When M5.1 Workflow Data Model is complete
  Then workflow structures support all node types (Instrument, Operator, Control)
  And edge types handle data, control, and conditional flows
  And builder API provides ergonomic workflow construction

Scenario: DAG Validation and Operations
  Given workflows must be valid directed acyclic graphs
  When M5.2 DAG Validation & Operations is complete
  Then cycle detection works for graphs up to 10,000 nodes
  And topological sorting provides deterministic execution order
  And validation catches all invalid graph configurations

Scenario: Workflow Persistence and Templates
  Given workflows need portable storage and reuse
  When M5.3-M5.4 serialization and templates are complete
  Then JSON round-trip preserves all workflow data
  And binary format is 50%+ smaller than JSON
  And template system supports parameterization and instantiation

**Correctness Properties**:
- Property 1: All workflow graphs must be valid DAGs
- Property 2: Serialization must preserve complete workflow state
- Property 3: Template instantiation must validate all parameters
- Property 4: Execution state API must provide real-time updates

**Sub-Milestones**:
- M5.1: Workflow Data Model (2 weeks)
- M5.2: DAG Validation & Operations (2 weeks)
- M5.3: Workflow Serialization (2 weeks)
- M5.4: Template System (2 weeks)
- M5.5: Execution State API (3 weeks)

---

### M4: Extension Ecosystem (4-5 months)
**Goal**: Complete extension system for community and commercial extensions
**Priority**: High
**Status**: * [ ]

**Acceptance Criteria (Gherkin-style ATDD)**:

Scenario: Extension Manifest and Permissions
  Given extensions need comprehensive metadata and security
  When M4.1-M4.2 manifest and permissions are complete
  Then all extension metadata is expressible in manifest
  And dependency resolution handles complex graphs
  And permission system provides fine-grained security controls

Scenario: Process Isolation and Loading
  Given extensions need safe execution environment
  When M4.3-M4.4 isolation and loading are complete
  Then extensions cannot access files outside sandbox
  And memory/CPU limits are enforced within 10%/20% accuracy
  And extensions load within 100ms with dependency resolution

Scenario: Extension Registry and Types
  Given extension ecosystem needs discovery and implementation
  When M4.5-M4.6 registry and types are complete
  Then registry handles 10,000+ extensions with <100ms search
  And all three extension types (Instruments, Operators, Addons) are functional
  And example extensions demonstrate best practices

**Correctness Properties**:
- Property 1: Extension crashes must not affect Symphony core
- Property 2: Permission violations must be blocked and logged
- Property 3: Extension registry must maintain data integrity
- Property 4: All extension types must support defined API contracts

**Sub-Milestones**:
- M4.1: Manifest System (3 weeks)
- M4.2: Permission Framework (3 weeks)
- M4.3: Process Isolation (4 weeks)
- M4.4: Extension Loader (3 weeks)
- M4.5: Registry & Discovery (3 weeks)
- M4.6: Extension Types (4 weeks)

---

### M3: The Pit - Infrastructure Extensions (3-4 months)
**Goal**: Build the five core infrastructure extensions
**Priority**: Critical
**Status**: * [ ]

**Acceptance Criteria (Gherkin-style ATDD)**:

Scenario: Pool Manager Performance
  Given AI models need efficient lifecycle management
  When M3.1 Pool Manager is complete
  Then model allocation achieves <100μs on cache hit
  And predictive prewarming reduces cold starts by 50%+
  And health checks detect failures within 1 second

Scenario: DAG Tracker Scalability
  Given workflows need parallel execution
  When M3.2 DAG Tracker is complete
  Then system handles 10,000-node workflows
  And parallel execution utilizes available cores
  And recovery from checkpoint completes in <1 second

Scenario: Artifact Store Performance
  Given content needs efficient storage and search
  When M3.3 Artifact Store is complete
  Then store latency is <5ms and retrieve latency is <2ms
  And deduplication saves 30%+ storage space
  And full-text search returns results in <100ms

**Correctness Properties**:
- Property 1: Pool Manager cache hits must achieve <100μs allocation
- Property 2: DAG Tracker must handle 10,000+ node workflows without failure
- Property 3: Artifact Store must maintain content-addressable integrity
- Property 4: All Pit extensions must run in-process for performance

**Sub-Milestones**:
- M3.1: Pool Manager (4 weeks)
- M3.2: DAG Tracker (4 weeks)
- M3.3: Artifact Store (4 weeks)
- M3.4: Arbitration Engine (3 weeks)
- M3.5: Stale Manager (3 weeks)

---

## 📊 Success Metrics

### Performance Targets
- **IPC Bus**: Message latency <0.3ms, throughput 10,000+ msg/sec
- **Python Bridge**: FFI overhead <0.01ms
- **Pool Manager**: Allocation <100μs (cache hit)
- **DAG Tracker**: 10,000-node workflow capacity
- **Artifact Store**: <5ms store, <2ms retrieve
- **Extension Loader**: <100ms load time

### Quality Targets
- **Test Coverage**: >80% across all sub-milestones
- **Documentation**: Complete rustdoc for all public APIs
- **Property Tests**: All serialization and state machines
- **Security Tests**: All sandboxing and isolation mechanisms

### Integration Targets
- **Crate Integration**: All crates follow `symphony-*` naming convention
- **API Consistency**: All port interfaces implemented by concrete adapters
- **Performance Integration**: End-to-end latency targets met
- **Security Integration**: Permission system enforced across all components

---

## 🔄 Timeline Summary

| Sub-Milestone | Duration | Dependencies | Status |
|---------------|----------|--------------|--------|
| M1.1: Environment Setup | 2 weeks | - | * [ ] |
| M1.2: Two-Binary Architecture | 3 weeks | M1.1 | * [ ] |
| M1.3: IPC Protocol | 3 weeks | M1.1 | * [ ] |
| M1.4: Transport Layer | 3 weeks | M1.3 | * [ ] |
| M1.5: Message Bus Core | 3 weeks | M1.3, M1.4 | * [ ] |
| M1.6: Python-Rust Bridge | 3 weeks | M1.5 | * [ ] |
| M1.7: Extension SDK | 3 weeks | M1.1 | * [ ] |
| M1.8: Concrete Adapters | 4 weeks | M1.1-M1.7 | * [ ] |
| M1.9: Domain Core | 3 weeks | M1.8 | * [ ] |
| M1.10: Tauri Integration | 3 weeks | M1.9 | * [ ] |

**Total M1 Duration**: 3-4 months with parallel work opportunities

**Parallel Work Opportunities**:
- Phase 1: M1.1 + M5.1 can run in parallel
- Phase 2: M1.3 + M1.7 + M5.2/M5.3 can run in parallel
- Phase 3: M4.1-M4.3 can overlap with M1.6-M1.8
- Phase 4: M3.1 + M3.3 can run in parallel
- Phase 5: M3.4 + M3.5 can run in parallel

---

## 🎯 Glossary

- **H2A2**: Harmonic Hexagonal Actor Architecture
- **IPC**: Inter-Process Communication
- **DAG**: Directed Acyclic Graph
- **FFI**: Foreign Function Interface
- **ATDD**: Acceptance Test-Driven Development
- **The Pit**: Five infrastructure extensions (Pool Manager, DAG Tracker, Artifact Store, Arbitration Engine, Stale Manager)
- **Orchestra Kit**: Extension ecosystem (Instruments, Operators, Addons/Motifs)