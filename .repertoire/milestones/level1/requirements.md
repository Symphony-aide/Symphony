# Level 1 Requirements: Backend-Focused Milestone Decomposition

> **Scope**: Backend-focused decomposition of M1, M5, M4, M3 into actionable sub-milestones
> **Ordering**: M1 → M5 → M4 → M3 (foundational to complex)
> **Architecture**: Two-layer data architecture with Rust pre-validation + OFB Python authoritative validation

**Current Status**: Level 1 decomposition of high-level milestones into 2-4 week sub-milestones  
**Target**: Actionable backend implementation tasks with clear deliverables and success criteria

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
- **FFI**: Foreign Function Interface
- **ATDD**: Acceptance Test-Driven Development
- **The Pit**: Five infrastructure extensions (Pool Manager, DAG Tracker, Artifact Store, Arbitration Engine, Stale Manager)
- **Orchestra Kit**: Extension ecosystem (Instruments, Operators, Addons/Motifs)
- **Mock-Based Contract Testing**: Testing approach using mock implementations to verify trait contracts and format validation without external dependencies
- **WireMock Contract Verification**: Integration testing using WireMock to verify HTTP request/response format matches OFB Python API expectations
- **Three-Layer Testing**: Unit tests (mocks), Integration tests (WireMock), Pre-validation tests (performance + logic)

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

Scenario: Two-Layer Data Architecture Foundation with Testing
  Given Symphony needs efficient data handling with single source of truth
  When M1.1 includes data architecture components
  Then pre-validation traits are defined for technical validation only
  And data access ports delegate to OFB Python for authoritative validation
  And HTTP client abstractions support single-call operations to OFB Python
  And error handling distinguishes pre-validation from authoritative validation failures
  And mock-based contract testing framework is established for trait verification
  And WireMock integration testing framework is prepared for OFB Python API contract verification
  And three-layer testing approach is documented and implemented

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

Scenario: Data Layer Integration
  Given Symphony needs seamless data operations
  When M1.6-M1.8 data layer is complete
  Then pre-validation completes in <1ms for all operations
  And HTTP requests to OFB Python are single calls per operation
  And all RBAC and business rule validation occurs in OFB Python
  And data persistence operations go through OFB Python API exclusively

**Correctness Properties**:
- Property 0: sy-commons must be fully implemented before any other crate development
- Property 1: All port interfaces must have concrete adapter implementations
- Property 2: Binary synchronization must maintain data consistency across processes
- Property 3: IPC communication must meet performance targets under load
- Property 4: Extension SDK must support safe process isolation
- Property 5: Pre-validation must never contain business logic or RBAC checks
- Property 6: All authoritative validation must occur in OFB Python API
- Property 7: HTTP requests to OFB Python must be single calls per operation
- Property 8: Data access patterns must follow two-layer architecture principles
- Property 9: Mock-based contract testing must verify trait compliance without external dependencies
- Property 10: WireMock contract verification must ensure HTTP format matches OFB Python API expectations
- Property 11: Three-layer testing approach must provide comprehensive coverage (Unit/Integration/Pre-validation)
- Property 12: Pre-validation tests must complete in <1ms, unit tests in <100ms, integration tests in <5s
- Property 13: All crates must use sy-commons for shared functionality (errors, logging, config, filesystem)

**Sub-Milestones**:
- M1.0: sy-commons Foundation (2 weeks) - PREREQUISITE for all other development
- M1.1: Environment Setup & Port Definitions (2 weeks) - depends on M1.0
- M1.2: Two-Binary Architecture Implementation (3 weeks) - depends on M1.0
- M1.3: IPC Protocol & Serialization (3 weeks) - depends on M1.0
- M1.4: Transport Layer (3 weeks)
- M1.5: Message Bus Core (3 weeks)
- M1.6: Python-Rust Bridge (3 weeks)
- M1.7: Extension SDK Foundation (3 weeks)
- M1.8: Data Layer Implementation (4 weeks) - pre-validation + HTTP adapters + testing
- M1.9: Concrete Adapters Implementation (4 weeks) - includes data adapters + mock implementations
- M1.10: Domain Core Orchestration (3 weeks)
- M1.11: Tauri Integration Layer (3 weeks)
- M1.12: Testing Infrastructure Implementation (2 weeks) - Three-layer testing setup

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
| M1.8: Data Layer Implementation | 4 weeks | M1.1-M1.7 | * [ ] |
| M1.9: Concrete Adapters | 4 weeks | M1.8 | * [ ] |
| M1.10: Domain Core | 3 weeks | M1.9 | * [ ] |
| M1.11: Tauri Integration | 3 weeks | M1.10 | * [ ] |
| M1.12: Testing Infrastructure | 2 weeks | M1.1, M1.8 | * [ ] |

**Total M1 Duration**: 3-4 months with parallel work opportunities

**Parallel Work Opportunities**:
- Phase 1: M1.1 + M5.1 can run in parallel
- Phase 2: M1.3 + M1.7 + M5.2/M5.3 can run in parallel
- Phase 3: M4.1-M4.3 can overlap with M1.6-M1.8
- Phase 4: M1.12 (Testing) can run in parallel with M1.9-M1.11
- Phase 5: M3.1 + M3.3 can run in parallel
- Phase 6: M3.4 + M3.5 can run in parallel

---

## 🎯 Glossary

- **H2A2**: Harmonic Hexagonal Actor Architecture
- **IPC**: Inter-Process Communication
- **DAG**: Directed Acyclic Graph
- **FFI**: Foreign Function Interface
- **ATDD**: Acceptance Test-Driven Development
- **The Pit**: Five infrastructure extensions (Pool Manager, DAG Tracker, Artifact Store, Arbitration Engine, Stale Manager)
- **Orchestra Kit**: Extension ecosystem (Instruments, Operators, Addons/Motifs)