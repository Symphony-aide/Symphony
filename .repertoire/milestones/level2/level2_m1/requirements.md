# Level 2 M1 Requirements: Core Infrastructure

> **ATDD Requirements**: Acceptance Test-Driven Development scenarios for M1 Core Infrastructure sub-milestones

**Parent**: Level 1 M1 Core Infrastructure  
**Goal**: Build foundational communication and integration systems for Symphony AIDE layer  
**Architecture**: H2A2 (Harmonic Hexagonal Actor Architecture) + Two-Layer Data Architecture

---

## 📋 Glossary

**Terms and Definitions**:
- **OFB Python**: Out of Boundary Python - refers to Python API components that handle authoritative validation, RBAC, and data persistence outside the Rust boundary
- **Pre-validation**: Lightweight technical validation in Rust to prevent unnecessary HTTP requests (NOT business logic)
- **Authoritative Validation**: Complete validation including RBAC, business rules, and data constraints performed by OFB Python
- **Two-Layer Architecture**: Rust (orchestration + pre-validation) + OFB Python (validation + persistence)
- **H2A2**: Harmonic Hexagonal Actor Architecture - hybrid approach combining Hexagonal Architecture with Actor model
- **Port**: Interface defining what the domain needs (TextEditingPort, PitPort, ExtensionPort, ConductorPort, DataAccessPort)
- **Adapter**: Concrete implementation of a port interface
- **The Pit**: Five infrastructure extensions (Pool Manager, DAG Tracker, Artifact Store, Arbitration Engine, Stale Manager)
- **Two-Binary Architecture**: Symphony and XI-editor as separate executable processes
- **JSON-RPC**: Communication protocol for Symphony ↔ XI-editor interaction
- **STDIO Streaming**: Continuous event stream via stdin/stdout like Server-Sent Events
- **Actor Model**: Process isolation pattern for extension safety
- **PyO3**: Python-Rust FFI bridge for Conductor integration
- **Tauri**: Cross-platform desktop application framework
- **Extension Types**: Instruments (AI), Operators (utilities), Motifs (UI), XI-plugins (text editing)
- **Mock-Based Contract Testing**: Testing approach using mock implementations to verify trait contracts and format validation without external dependencies
- **WireMock Contract Verification**: Integration testing using WireMock to verify HTTP request/response format matches OFB Python API expectations
- **Three-Layer Testing**: Unit tests (mocks), Integration tests (WireMock), Pre-validation tests (performance + logic)

---

## 🎯 High-Level Requirements

### Requirement 1: Hexagonal Architecture Foundation + Data Layer
**Goal**: Establish clean port-based architecture for Symphony AIDE layer with two-layer data architecture

**Acceptance Criteria (Gherkin-style)**:
```gherkin
Scenario: Port interface definition and implementation
  Given the H2A2 architecture specification with two-layer data architecture
  When all five port interfaces are defined (TextEditingPort, PitPort, ExtensionPort, ConductorPort, DataAccessPort)
  Then each port has comprehensive async trait definitions
  And mock implementations enable isolated testing
  And all ports follow H2A2 architecture principles

Scenario: Data access port with pre-validation and testing
  Given Symphony needs efficient data operations
  When DataAccessPort is implemented
  Then pre-validation traits are defined for technical validation only
  And HTTP client abstractions support single-call operations to OFB Python
  And mock implementations enable isolated testing without external dependencies
  And WireMock contract verification ensures HTTP format matches OFB Python API expectations
  And three-layer testing approach provides comprehensive coverage
  And error handling distinguishes pre-validation from authoritative validation failures
  And all business logic validation is delegated to OFB Python

Scenario: Domain core orchestration through ports
  Given all concrete adapters are implemented
  When SymphonyCore orchestrates components
  Then it uses only port interfaces, never direct dependencies
  And business logic remains testable in isolation
  And adapter changes don't affect domain logic
  And data operations follow two-layer architecture pattern
```

**Correctness Properties**:
- Property 1: Domain core must never import concrete adapter types
- Property 2: All port methods must be async-first with proper error handling
- Property 3: Mock implementations must provide deterministic behavior for testing
- Property 4: Pre-validation must never contain business logic or RBAC checks
- Property 5: All authoritative validation must be delegated to OFB Python

---

### Requirement 2: Two-Binary Architecture Implementation `(NEW)`
**Goal**: Implement Symphony and XI-editor as separate executable binaries with reliable communication

**Acceptance Criteria (Gherkin-style)**:
```gherkin
Scenario: Binary process lifecycle management
  Given Symphony binary starts up
  When XI-editor binary is spawned as subprocess
  Then XI-editor process starts successfully within 2 seconds
  And health monitoring detects process status within 1 second
  And failed processes restart automatically within 5 seconds

Scenario: Inter-binary communication via JSON-RPC
  Given Symphony and XI-editor binaries are running
  When Symphony sends JSON-RPC request to XI-editor
  Then XI-editor responds within 1ms for text operations
  And request/response correlation works correctly
  And communication failures are detected and handled

Scenario: Binary state synchronization
  Given both binaries are operational
  When file system changes occur
  Then Symphony detects changes and notifies XI-editor via JSON-RPC
  And XI-editor streams buffer updates to Symphony via STDIO
  And state remains consistent between binaries within 10ms
```

**Correctness Properties**:
- Property 1: Process failures must not crash the other binary
- Property 2: State synchronization must maintain consistency under concurrent operations
- Property 3: Communication protocols must handle network partitions gracefully

---

### Requirement 3: IPC Communication Infrastructure
**Goal**: Provide reliable, high-performance inter-process communication

**Acceptance Criteria (Gherkin-style)**:
```gherkin
Scenario: Message serialization and transport
  Given IPC protocol is implemented
  When messages are serialized using MessagePack/Bincode
  Then serialization completes in <0.01ms for typical messages
  And round-trip preserves all data correctly
  And schema validation catches malformed messages

Scenario: Cross-platform transport layer
  Given transport layer is implemented
  When running on Windows, Linux, and macOS
  Then Unix sockets work on Linux/macOS with <0.1ms latency
  And Named pipes work on Windows with <0.2ms latency
  And STDIO transport works for JSON-RPC with <1ms latency

Scenario: Message bus routing and correlation
  Given message bus is operational
  When handling 10,000+ messages per second
  Then routing latency remains <0.1ms average
  And request/response correlation works correctly
  And pub/sub delivers to all subscribers within 1ms
```

**Correctness Properties**:
- Property 1: Message ordering must be preserved within each transport
- Property 2: No message loss under normal operating conditions
- Property 3: Transport failures must be detected within 100ms

---

### Requirement 4: Python-Rust Integration Bridge + Data Layer
**Goal**: Enable seamless integration between Rust backend and Python Conductor + OFB Python data operations

**Acceptance Criteria (Gherkin-style)**:
```gherkin
Scenario: PyO3 FFI bridge performance
  Given Python-Rust bridge is implemented
  When Python Conductor calls Rust functions
  Then FFI call overhead is <0.01ms
  And all primitive types convert correctly
  And async calls work from Python asyncio

Scenario: OFB Python HTTP client integration
  Given Symphony needs data operations through OFB Python
  When HTTP client for OFB Python is implemented
  Then pre-validation occurs before HTTP requests
  And single HTTP calls handle complete operations
  And error responses distinguish validation types (pre-validation vs authoritative)
  And retry logic handles network failures appropriately

Scenario: Conductor subprocess management `(NEW)`
  Given Symphony binary starts
  When Python Conductor is launched as subprocess
  Then Conductor process starts within Symphony binary
  And Conductor has direct access to The Pit components
  And no IPC overhead for Pit operations

Scenario: Cross-language error handling
  Given Python-Rust bridge is active
  When errors occur in either language
  Then errors propagate with full context
  And Python exceptions map to Rust errors correctly
  And error messages are actionable for developers
  And OFB Python validation errors are properly categorized
```

**Correctness Properties**:
- Property 1: Type conversions must be bidirectional and lossless
- Property 2: Memory management must prevent leaks across language boundary
- Property 3: Error propagation must preserve stack traces and context
- Property 4: Pre-validation must complete in <1ms for all operations
- Property 5: HTTP requests to OFB Python must be single calls per operation

---

### Requirement 5: Extension System Foundation
**Goal**: Provide secure, isolated extension execution environment

**Acceptance Criteria (Gherkin-style)**:
```gherkin
Scenario: Extension manifest parsing and validation
  Given extension SDK is implemented
  When extension manifests are parsed
  Then parsing completes in <1ms for typical manifests
  And invalid manifests are rejected with clear errors
  And permission violations are detected at declaration time

Scenario: Actor-based process isolation `(NEW)`
  Given extension system is operational
  When extensions are loaded
  Then each extension runs in isolated process
  And extension crashes don't affect Symphony core
  And resource limits are enforced within 10% accuracy

Scenario: Four-tier extension architecture `(NEW)`
  Given all extension types are implemented
  When Instruments, Operators, Motifs, and XI-plugins interact
  Then workflow patterns execute correctly (Motif→Instrument→Operator→XI-editor)
  And XI-editor plugin capabilities are discoverable from Symphony
  And extension interaction latency is <10ms end-to-end
```

**Correctness Properties**:
- Property 1: Extension isolation must prevent unauthorized system access
- Property 2: Extension failures must not propagate to other extensions
- Property 3: Resource limits must be enforced consistently across platforms

---

### Requirement 6: Concrete Adapter Implementation `(NEW)` + Data Layer
**Goal**: Complete H2A2 architecture with working adapters for all ports including data access

**Acceptance Criteria (Gherkin-style)**:
```gherkin
Scenario: XiEditorAdapter JSON-RPC communication
  Given XiEditorAdapter is implemented
  When text editing operations are performed
  Then JSON-RPC latency is <1ms for standard operations
  And buffer state synchronizes with XI-editor correctly
  And XI-editor process failures trigger reconnection

Scenario: PitAdapter direct access performance
  Given PitAdapter is implemented
  When Pit operations are executed
  Then allocation time is 50-100ns for cache hits
  And no IPC overhead for in-process operations
  And performance metrics are available

Scenario: ActorExtensionAdapter process management
  Given ActorExtensionAdapter is implemented
  When extensions are managed
  Then extensions run in isolated processes
  And message passing works reliably
  And crash detection and recovery function correctly

Scenario: PythonConductorAdapter integration
  Given PythonConductorAdapter is implemented
  When Conductor operations are invoked
  Then PyO3 bridge works correctly
  And Conductor has direct Pit access
  And FFI overhead remains <0.01ms

Scenario: DataAccessAdapter with two-layer architecture
  Given DataAccessAdapter is implemented
  When data operations are performed
  Then pre-validation occurs before HTTP requests to OFB Python
  And HTTP client makes single calls per operation
  And authoritative validation responses are properly handled
  And error categorization distinguishes pre-validation from OFB Python errors
  And all RBAC and business rule validation occurs in OFB Python
```

**Correctness Properties**:
- Property 1: All adapters must implement their respective port interfaces completely
- Property 2: Adapter failures must not affect domain core logic
- Property 3: Performance targets must be met under realistic load conditions
- Property 4: Data operations must follow two-layer architecture principles
- Property 5: Pre-validation must never duplicate OFB Python business logic

---

### Requirement 7: Domain Core Orchestration `(NEW)`
**Goal**: Implement Symphony's main orchestration engine coordinating all components

**Acceptance Criteria (Gherkin-style)**:
```gherkin
Scenario: Complete user workflow orchestration
  Given SymphonyCore is implemented
  When user actions are processed
  Then workflows execute through all four ports correctly
  And state synchronization maintains consistency
  And error handling provides graceful degradation

Scenario: Event streaming coordination
  Given event streaming is implemented
  When events occur in any component
  Then events are delivered in real-time (<10ms)
  And event filtering and routing work correctly
  And streaming failures are handled gracefully

Scenario: Process lifecycle management
  Given process management is implemented
  When processes need management
  Then XI-editor process is managed correctly
  And health monitoring detects failures
  And automatic restart works reliably
```

**Correctness Properties**:
- Property 1: SymphonyCore must coordinate all components through ports only
- Property 2: Event streaming must maintain ordering and delivery guarantees
- Property 3: Process lifecycle management must handle all failure scenarios

---

### Requirement 8: Tauri Integration Layer `(NEW)`
**Goal**: Bridge Symphony backend with Tauri frontend for complete application

**Acceptance Criteria (Gherkin-style)**:
```gherkin
Scenario: Tauri command definitions
  Given Tauri integration is implemented
  When frontend calls backend operations
  Then all Symphony operations are accessible via Tauri commands
  And type safety is maintained across boundary
  And error handling provides clear feedback

Scenario: Frontend-backend synchronization
  Given Tauri integration is active
  When backend state changes
  Then frontend receives updates in real-time
  And state consistency is maintained
  And UI updates reflect backend changes correctly

Scenario: Event streaming to frontend
  Given event streaming is implemented
  When backend events occur
  Then events are streamed to frontend correctly
  And event filtering works as expected
  And streaming performance meets requirements
```

**Correctness Properties**:
- Property 1: All backend operations must be accessible from frontend
- Property 2: Type conversions across Tauri boundary must be safe and complete
- Property 3: Event streaming must not introduce memory leaks or performance degradation

---

### Requirement 9: Data Layer Implementation `(NEW)`
**Goal**: Implement complete two-layer data architecture with pre-validation and OFB Python integration

**Acceptance Criteria (Gherkin-style)**:
```gherkin
Scenario: Pre-validation trait implementation
  Given Symphony needs efficient request filtering
  When pre-validation traits are implemented
  Then technical validation completes in <1ms
  And file existence, format validation, and basic structure checks work correctly
  And business logic validation is never performed in pre-validation layer
  And pre-validation errors provide immediate user feedback

Scenario: HTTP client for OFB Python
  Given Symphony needs data operations through OFB Python
  When HTTP client is implemented
  Then single HTTP calls handle complete operations
  And retry logic handles network failures appropriately
  And timeout handling prevents hanging requests
  And connection pooling optimizes performance

Scenario: Data access use cases
  Given Symphony needs domain-specific data operations
  When data access use cases are implemented
  Then workflow creation follows two-layer pattern (pre-validation + OFB Python)
  And user management delegates all validation to OFB Python
  And project operations use pre-validation for immediate feedback
  And extension operations follow security validation through OFB Python

Scenario: Error handling and categorization
  Given data operations can fail in multiple ways
  When error handling is implemented
  Then pre-validation errors are distinguished from OFB Python errors
  And network errors are handled with appropriate retry logic
  And validation errors from OFB Python are properly categorized (RBAC, business rules, data constraints)
  And error messages provide actionable feedback to users
```

**Correctness Properties**:
- Property 1: Pre-validation must never contain business logic or RBAC checks
- Property 2: All authoritative validation must occur in OFB Python
- Property 3: HTTP requests to OFB Python must be single calls per operation
- Property 4: Error categorization must distinguish validation types
- Property 5: Data operations must follow clean architecture principles
- Property 6: Mock-based contract testing must verify trait compliance without external dependencies
- Property 7: WireMock contract verification must ensure HTTP format matches OFB Python API expectations
- Property 8: Three-layer testing approach must provide comprehensive coverage with performance targets

---

### Requirement 7: Testing Infrastructure Implementation `(NEW)`
**Goal**: Establish comprehensive testing strategy with mock-based contract testing and OFB Python boundary separation

**Acceptance Criteria (Gherkin-style)**:
```gherkin
Scenario: Three-layer testing architecture
  Given Symphony needs reliable testing with clear boundaries
  When testing infrastructure is implemented
  Then Layer 1 (Unit tests with mocks) completes in <100ms per test suite
  And Layer 2 (Integration tests with WireMock) completes in <5s per test suite
  And Layer 3 (Pre-validation performance tests) validates <1ms requirement
  And test organization follows domain-specific structure

Scenario: Mock-based contract testing
  Given Rust components need isolated testing
  When mock implementations are created
  Then MockWorkflowDataAccess implements WorkflowDataAccess trait correctly
  And MockUserDataAccess provides deterministic test behavior
  And MockExtensionDataAccess supports error injection for testing
  And all mocks enable concurrent access testing

Scenario: WireMock contract verification with OFB Python
  Given HTTP requests must match OFB Python API expectations
  When WireMock contract tests are implemented
  Then request format validation ensures compatibility with OFB Python
  And response format parsing handles all OFB Python response types
  And error response format testing covers all OFB Python error scenarios
  And contract tests verify exactly one HTTP call per operation

Scenario: Pre-validation performance testing
  Given pre-validation must complete in <1ms
  When performance tests are implemented
  Then workflow pre-validation benchmarks meet <1ms requirement
  And user pre-validation benchmarks meet <1ms requirement
  And extension manifest pre-validation benchmarks meet <1ms requirement
  And performance regression detection prevents degradation

Scenario: Test environment configuration
  Given tests need different execution modes
  When test configuration is implemented
  Then SYMPHONY_TEST_MODE=mock enables fast unit testing
  And SYMPHONY_TEST_MODE=wiremock enables contract verification
  And SYMPHONY_TEST_MODE=integration enables OFB Python API testing
  And test configuration supports CI/CD pipeline execution

Scenario: OFB Python boundary testing separation
  Given testing must respect architectural boundaries
  When test scope is defined
  Then Rust layer tests focus on contract compliance and format validation
  And OFB Python business rules are not tested in Rust test suite
  And database operations are not tested in Rust layer
  And authentication/authorization testing is delegated to OFB Python team
```

**Correctness Properties**:
- Property 1: Unit tests must complete in <100ms per test suite
- Property 2: Integration tests must complete in <5s per test suite
- Property 3: Pre-validation tests must validate <1ms performance requirement
- Property 4: Mock implementations must provide deterministic behavior
- Property 5: WireMock tests must verify exact HTTP format compatibility with OFB Python
- Property 6: Test coverage must exceed 90% for business logic and 100% for pre-validation
- Property 7: Testing must maintain clear separation between Rust and OFB Python responsibilities

---

## 📋 Glossary

**Terms and Definitions**:
- **H2A2**: Harmonic Hexagonal Actor Architecture - hybrid approach combining Hexagonal Architecture with Actor model
- **Port**: Interface defining what the domain needs (TextEditingPort, PitPort, ExtensionPort, ConductorPort)
- **Adapter**: Concrete implementation of a port interface
- **The Pit**: Five infrastructure extensions (Pool Manager, DAG Tracker, Artifact Store, Arbitration Engine, Stale Manager)
- **Two-Binary Architecture**: Symphony and XI-editor as separate executable processes
- **JSON-RPC**: Communication protocol for Symphony ↔ XI-editor interaction
- **STDIO Streaming**: Continuous event stream via stdin/stdout like Server-Sent Events
- **Actor Model**: Process isolation pattern for extension safety
- **PyO3**: Python-Rust FFI bridge for Conductor integration
- **Tauri**: Cross-platform desktop application framework
- **Extension Types**: Instruments (AI), Operators (utilities), Motifs (UI), XI-plugins (text editing)