# F002 - Core Port Definitions - Planning

**Feature ID**: F002  
**Planning Date**: December 28, 2025  
**Estimated Effort**: 2 days  
**Implementation Priority**: 1 (Foundation)  

---

## Implementation Strategy

### High-Level Approach

Implement a comprehensive port-based architecture following H2A2 principles with async-first design. Create a single `symphony-core-ports` crate that serves as the foundation for all Symphony components, providing clean abstractions and enabling isolated testing through mock implementations.

### Technical Decisions

#### Port Design Philosophy
**Decision**: Use async traits with comprehensive error handling  
**Rationale**: Symphony's architecture requires async operations throughout, and proper error propagation is critical for reliability  
**Alternative Considered**: Synchronous traits with manual async wrapping  
**Why Rejected**: Would create inconsistent API surface and complicate error handling  

#### Error Handling Strategy
**Decision**: Use sy-commons::SymphonyError as base error type for all ports  
**Rationale**: Provides consistent error handling across all Symphony components  
**Alternative Considered**: Port-specific error types  
**Why Rejected**: Would fragment error handling and complicate cross-port operations  

#### Mock Implementation Approach
**Decision**: Provide built-in mock implementations using mockall-style patterns  
**Rationale**: Enables fast, deterministic testing without external dependencies  
**Alternative Considered**: External mock generation  
**Why Rejected**: Adds build complexity and external dependencies  

## Component Breakdown

### 1. Port Trait Definitions (`src/ports.rs`)
**Responsibility**: Define all five core port traits with async methods  
**Key Components**:
- TextEditingPort: XI-editor abstraction (buffer operations, file management)
- PitPort: High-performance infrastructure operations (Pool, DAG, Artifact, Arbitration, Stale)
- ExtensionPort: Extension lifecycle and communication
- ConductorPort: Python Conductor integration
- DataAccessPort: Two-layer data architecture with pre-validation

**Implementation Notes**:
- All methods async with Result<T, SymphonyError> return types
- Comprehensive documentation with examples
- Strong typing with domain-specific types

### 2. Domain Type System (`src/types.rs`)
**Responsibility**: Define all domain-specific data structures  
**Key Components**:
- Identifiers: BufferId, ViewId, ModelId, ExtensionId, ProcessId
- Specifications: ModelSpec, ExtensionManifest, WorkflowSpec
- Events: SyncEvent, BufferEvent, ExtensionEvent
- Contexts: DecisionContext, LoadContext, ValidationContext

**Implementation Notes**:
- Derive Serialize, Deserialize for all types
- Use UUID-based identifiers for uniqueness
- Include validation methods where appropriate

### 3. Error Type System (`src/errors.rs`)
**Responsibility**: Comprehensive error handling for all port operations  
**Key Components**:
- PortError: Base error type for all port operations
- Specific errors: ProcessCommunicationFailed, SynchronizationError, ValidationError
- Error context preservation and propagation

**Implementation Notes**:
- Use thiserror for error derivation
- Include actionable error messages
- Preserve error chains for debugging

### 4. Mock Implementations (`src/mocks.rs`)
**Responsibility**: Deterministic mock implementations for testing  
**Key Components**:
- MockTextEditingAdapter: Simulates XI-editor operations
- MockPitAdapter: Simulates high-performance operations
- MockExtensionAdapter: Simulates extension lifecycle
- MockConductorAdapter: Simulates Python integration
- MockDataAccessAdapter: Simulates data operations

**Implementation Notes**:
- Configurable behavior for different test scenarios
- Deterministic responses for reproducible tests
- Error injection capabilities for failure testing

### 5. Binary Communication Types (`src/binary.rs`)
**Responsibility**: Two-binary architecture specific types  
**Key Components**:
- ProcessId and process lifecycle types
- Binary synchronization events
- JSON-RPC message correlation types

**Implementation Notes**:
- Support for Symphony ↔ XI-editor communication
- Process health monitoring types
- State synchronization primitives

## Dependencies Analysis

| Library | Purpose | Alternative 1 | Alternative 2 | Alternative 3 | Cross-Platform | Local Env | Cloud Env | Consistency & Stability | Maintained | Ecosystem | Limitation 1 | Limitation 2 | Limitation 3 | Decision | Rationale |
|---------|---------|---------------|---------------|---------------|----------------|-----------|-----------|------------------------|------------|-----------|--------------|--------------|--------------|----------|-----------|
| async-trait 0.1.77 | Async trait definitions | Manual async wrapping | GATs (Generic Associated Types) | N/A | ✅ All platforms | ✅ Works | ✅ Works | ✅ Stable API | ✅ Active (2024-12) | High | Slight compile overhead | Box allocation for futures | N/A | ✅ Selected | Industry standard for async traits |
| serde 1.0.193 | Serialization framework | bincode only | rmp-serde only | N/A | ✅ All platforms | ✅ Works | ✅ Works | ✅ Very stable | ✅ Active (2024-12) | High | Derive macro complexity | Large dependency tree | N/A | ✅ Selected | Essential for data interchange |
| uuid 1.6.1 | Unique identifier generation | nanoid | ulid | custom u64 | ✅ All platforms | ✅ Works | ✅ Works | ✅ Stable | ✅ Active (2024-11) | High | Larger than simple u64 | String representation overhead | N/A | ✅ Selected | Standard for distributed systems |
| thiserror 1.0.56 | Error handling derive macros | anyhow | manual impl | eyre | ✅ All platforms | ✅ Works | ✅ Works | ✅ Very stable | ✅ Active (2024-12) | High | Compile-time only | No runtime overhead | N/A | ✅ Selected | Best practice for library errors |
| mockall 0.12.1 | Mock generation for testing | manual mocks | mockito | N/A | ✅ All platforms | ✅ Works | ✅ Works | ✅ Stable | ✅ Active (2024-09) | Moderate | Requires trait bounds | Compile-time overhead | Complex generic support | ✅ Selected | Comprehensive mocking framework |

#### Tauri Commands Reference

This feature provides the foundation types that will be used by Tauri commands, but does not directly implement any commands.

**Future Tauri Integration Points**:
- Port trait types will be used in command parameter/return types
- Error types will be serialized across Tauri boundary
- Mock implementations will be used in frontend development mode

## Implementation Phases

### Phase 1: Core Port Traits (Day 1, Morning)
- [ ] Define TextEditingPort with buffer and file operations
- [ ] Define PitPort with high-performance infrastructure operations
- [ ] Define ExtensionPort with lifecycle management
- [ ] Define ConductorPort with Python integration
- [ ] Define DataAccessPort with two-layer architecture

### Phase 2: Domain Type System (Day 1, Afternoon)
- [ ] Implement all identifier types (BufferId, ViewId, etc.)
- [ ] Create specification types (ModelSpec, ExtensionManifest, etc.)
- [ ] Define event types for cross-component communication
- [ ] Add validation methods and serialization support

### Phase 3: Error Handling (Day 2, Morning)
- [ ] Create comprehensive error type hierarchy
- [ ] Implement error context preservation
- [ ] Add actionable error messages
- [ ] Test error propagation across port boundaries

### Phase 4: Mock Implementations (Day 2, Afternoon)
- [ ] Implement mock adapters for all ports
- [ ] Add configurable behavior for testing scenarios
- [ ] Create error injection capabilities
- [ ] Validate mock determinism and performance

## Testing Strategy

### Unit Testing Approach
- **Test Type**: Infrastructure Tests (boundary works)
- **Focus**: Port trait contracts and type system validation
- **Mock Strategy**: Use real mock implementations to test themselves
- **Performance**: <100ms per test suite

### Test Organization
```
tests/
├── unit/
│   ├── ports_test.rs           # Port trait contract tests
│   ├── types_test.rs           # Domain type validation tests
│   ├── errors_test.rs          # Error handling tests
│   └── mocks_test.rs           # Mock implementation tests
├── fixtures/
│   ├── sample_manifests.toml   # Extension manifest examples
│   ├── buffer_states.json      # Buffer state test data
│   └── error_scenarios.json    # Error condition test cases
└── integration/
    └── port_integration_test.rs # Cross-port interaction tests
```

### Testing Markers
- `unit`: Fast isolated tests for port contracts
- `integration`: Cross-port interaction tests
- `mock`: Mock implementation validation tests

## Code Structure

```
apps/backend/crates/symphony-core-ports/
├── Cargo.toml                    # Dependencies: async-trait, serde, uuid, thiserror
├── src/
│   ├── lib.rs                   # Public API exports and documentation
│   ├── ports.rs                 # Five port trait definitions
│   ├── types.rs                 # Domain types and data structures
│   ├── errors.rs                # Comprehensive error types
│   ├── mocks.rs                 # Mock implementations for testing
│   └── binary.rs                # Two-binary architecture types
└── tests/
    ├── unit/                    # Unit tests for each module
    ├── fixtures/                # Test data and scenarios
    └── integration/             # Cross-component tests
```

## Design Decisions Log

### Decision 1: Async-First Port Design
**Context**: Symphony requires async operations throughout  
**Decision**: All port methods return async futures  
**Rationale**: Consistent with Tokio ecosystem and enables non-blocking operations  
**Trade-offs**: Slight performance overhead vs. consistency and scalability  

### Decision 2: Single Error Type Hierarchy
**Context**: Need consistent error handling across ports  
**Decision**: Use sy-commons::SymphonyError as base with port-specific variants  
**Rationale**: Simplifies error handling and enables consistent logging  
**Trade-offs**: Less type safety vs. simpler error propagation  

### Decision 3: Built-in Mock Implementations
**Context**: Need fast, deterministic testing  
**Decision**: Include mock implementations in the same crate  
**Rationale**: Reduces external dependencies and ensures API compatibility  
**Trade-offs**: Larger crate size vs. testing convenience  

---

**Planning Complete**: Ready for DESIGN phase  
**Next Phase**: DESIGN.md - Technical architecture and implementation details