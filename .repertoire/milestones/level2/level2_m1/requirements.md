# Level 2 M1 Requirements: Core Infrastructure

> **ATDD Requirements**: Acceptance Test-Driven Development scenarios for M1 Core Infrastructure sub-milestones

**Parent**: Level 1 M1 Core Infrastructure  
**Goal**: Build foundational communication and integration systems for Symphony AIDE layer  
**Architecture**: H2A2 (Harmonic Hexagonal Actor Architecture)

---

## 🎯 High-Level Requirements

### Requirement 1: Hexagonal Architecture Foundation
**Goal**: Establish clean port-based architecture for Symphony AIDE layer

**Acceptance Criteria (Gherkin-style)**:
```gherkin
Scenario: Port interface definition and implementation
  Given the H2A2 architecture specification
  When all four port interfaces are defined (TextEditingPort, PitPort, ExtensionPort, ConductorPort)
  Then each port has comprehensive async trait definitions
  And mock implementations enable isolated testing
  And all ports follow H2A2 architecture principles

Scenario: Domain core orchestration through ports
  Given all concrete adapters are implemented
  When SymphonyCore orchestrates components
  Then it uses only port interfaces, never direct dependencies
  And business logic remains testable in isolation
  And adapter changes don't affect domain logic
```

**Correctness Properties**:
- Property 1: Domain core must never import concrete adapter types
- Property 2: All port methods must be async-first with proper error handling
- Property 3: Mock implementations must provide deterministic behavior for testing

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

### Requirement 4: Python-Rust Integration Bridge
**Goal**: Enable seamless integration between Rust backend and Python Conductor

**Acceptance Criteria (Gherkin-style)**:
```gherkin
Scenario: PyO3 FFI bridge performance
  Given Python-Rust bridge is implemented
  When Python Conductor calls Rust functions
  Then FFI call overhead is <0.01ms
  And all primitive types convert correctly
  And async calls work from Python asyncio

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
```

**Correctness Properties**:
- Property 1: Type conversions must be bidirectional and lossless
- Property 2: Memory management must prevent leaks across language boundary
- Property 3: Error propagation must preserve stack traces and context

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

### Requirement 6: Concrete Adapter Implementation `(NEW)`
**Goal**: Complete H2A2 architecture with working adapters for all ports

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
```

**Correctness Properties**:
- Property 1: All adapters must implement their respective port interfaces completely
- Property 2: Adapter failures must not affect domain core logic
- Property 3: Performance targets must be met under realistic load conditions

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