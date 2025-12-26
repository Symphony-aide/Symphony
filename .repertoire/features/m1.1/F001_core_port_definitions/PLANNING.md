# F001: Core Port Definitions - Planning

**Feature**: F001_core_port_definitions  
**Estimated Effort**: 3 days  
**Complexity**: Medium  
**Risk Level**: Medium (foundational decisions)

---

## High-Level Implementation Strategy

This feature establishes the Hexagonal Architecture foundation by defining the four core port traits that will abstract all external dependencies. The implementation follows a trait-first approach where we define the interfaces before any concrete implementations, ensuring clean separation of concerns.

**Approach**: Define async traits with comprehensive error handling, create mock implementations for testing, and provide extensive documentation to guide future adapter implementations.

## Technical Decisions

### Decision 1: Async Trait Design
**Chosen**: Use `#[async_trait]` macro for all port methods  
**Alternatives Considered**:
- Sync traits with blocking operations
- Generic associated types (GATs) for async
- Manual Future implementations

**Rationale**: `#[async_trait]` provides the cleanest API for consumers while maintaining compatibility with tokio ecosystem. GATs are not yet stable, and sync traits would block the entire runtime.

### Decision 2: Error Handling Strategy
**Chosen**: Result<T, PortError> for all fallible operations  
**Alternatives Considered**:
- Panicking on errors
- Custom error types per port
- Generic error parameter

**Rationale**: Consistent error handling across all ports simplifies error propagation. Custom error types would create unnecessary complexity at the port level.

### Decision 3: Mock Implementation Approach
**Chosen**: In-memory HashMap-based mocks with configurable behavior  
**Alternatives Considered**:
- File-based persistence for mocks
- Network-based mock services
- Procedural macro-generated mocks

**Rationale**: In-memory mocks are fast, deterministic, and sufficient for unit testing. More complex mocking can be added later if needed.

## Dependencies Analysis

| Dependency | Purpose | Alternative 1 | Alternative 2 | Alternative 3 | Cross-Platform | Local Env | Cloud Env | Consistency & Stability | Maintained | Ecosystem | Limitation 1 | Limitation 2 | Limitation 3 | Decision | Rationale |
|------------|---------|---------------|---------------|---------------|----------------|-----------|-----------|------------------------|------------|-----------|--------------|--------------|--------------|----------|-----------|
| async-trait 0.1.74 | Async methods in traits | Manual Future impl | GATs (unstable) | Sync traits | ✅ All platforms | ✅ Works | ✅ Works | ✅ Stable API | ✅ Active (2024-10) | High | Slight runtime overhead | Requires proc macro | N/A | ✅ Selected | Industry standard for async traits |
| tokio 1.35.0 | Async runtime primitives | async-std | smol | manual futures | ✅ All platforms | ✅ Works | ✅ Works | ✅ Very stable | ✅ Active (2024-12) | High | Large dependency tree | N/A | N/A | ✅ Selected | De facto standard for async Rust |
| thiserror 1.0.50 | Error derive macros | anyhow | manual impl | snafu | ✅ All platforms | ✅ Works | ✅ Works | ✅ Stable | ✅ Active (2024-11) | High | Compile-time only | N/A | N/A | ✅ Selected | Clean error definitions |
| uuid 1.6.1 | Unique identifiers | nanoid | ulid | manual strings | ✅ All platforms | ✅ Works | ✅ Works | ✅ RFC standard | ✅ Active (2024-10) | High | Slightly larger than alternatives | N/A | N/A | ✅ Selected | Standard UUID implementation |

**Notes**:
- ✅ = Works correctly / Yes
- ❌ = Does not work / No / Critical issue  
- ⚠️ = Partial support / Works with caveats
- N/A = Not applicable

## Component Breakdown

### Component 1: Port Trait Definitions (`src/ports.rs`)
**Responsibility**: Define the four core async traits with method signatures
**Public API**:
```rust
pub trait TextEditingPort: Send + Sync
pub trait PitPort: Send + Sync  
pub trait ExtensionPort: Send + Sync
pub trait ConductorPort: Send + Sync
```
**Dependencies**: async-trait, tokio
**Estimated Effort**: 1.5 days

### Component 2: Domain Types (`src/types.rs`)
**Responsibility**: Define core types used across all ports (BufferId, ModelSpec, etc.), usually they will be implemented in the caret 'commons'
**Public API**:
```rust
pub struct BufferId(pub Uuid);
pub struct ModelSpec { ... }
pub struct ExtensionManifest { ... }
```
**Dependencies**: uuid, serde
**Estimated Effort**: 0.5 days

### Component 3: Error Definitions (`src/errors.rs`)
**Responsibility**: Define PortError enum and error conversion traits
**Public API**:
```rust
pub enum PortError { ... }
impl From<T> for PortError
```
**Dependencies**: thiserror
**Estimated Effort**: 0.5 days

### Component 4: Mock Implementations (`src/mocks.rs`)
**Responsibility**: Provide testable mock implementations of all ports
**Public API**:
```rust
pub struct MockTextEditingAdapter;
pub struct MockPitAdapter;
pub struct MockExtensionAdapter;
pub struct MockConductorAdapter;
```
**Dependencies**: tokio, async-trait
**Estimated Effort**: 0.5 days

## Implementation Phases

### Phase 1: Core Trait Definitions (Day 1)
- [ ] Set up crate structure with Cargo.toml
- [ ] Define TextEditingPort trait with buffer operations
- [ ] Define PitPort trait with model and DAG operations
- [ ] Add basic error types
- [ ] Ensure compilation success

### Phase 2: Extension and Conductor Ports (Day 2)  
- [ ] Define ExtensionPort trait with lifecycle methods
- [ ] Define ConductorPort trait with AI orchestration methods
- [ ] Complete domain type definitions
- [ ] Add comprehensive rustdoc documentation
- [ ] Write usage examples in documentation

### Phase 3: Mock Implementations and Testing (Day 3)
- [ ] Implement MockTextEditingAdapter with in-memory buffers
- [ ] Implement MockPitAdapter with simulated operations
- [ ] Implement MockExtensionAdapter with lifecycle tracking
- [ ] Implement MockConductorAdapter with decision simulation
- [ ] Write comprehensive port interface tests
- [ ] Validate all acceptance criteria

## Code Structure

```
symphony-core-ports/
├── Cargo.toml
├── src/
│   ├── lib.rs          # Public API exports
│   ├── ports.rs        # Core port trait definitions
│   ├── types.rs        # Domain types and structures
│   ├── errors.rs       # Error types and conversions
│   └── mocks.rs        # Mock implementations for testing
└── tests/
    ├── port_tests.rs   # Port interface tests
    └── mock_tests.rs   # Mock implementation tests
```

## Testing Strategy

### Unit Tests
- Port trait compilation tests
- Mock implementation behavior tests  
- Error conversion tests
- Type serialization tests (where applicable)

### Integration Tests
- Mock adapter integration with async runtime
- Cross-port interaction scenarios
- Error propagation through port boundaries

### Property Tests
- Mock determinism across multiple runs
- Error handling consistency
- Type round-trip properties (for serializable types)

## Documentation Requirements

- [ ] Rustdoc for all public traits and methods
- [ ] Usage examples for each port
- [ ] Architecture decision documentation
- [ ] Mock usage patterns for testing
- [ ] Error handling best practices

## Performance Considerations

- **Trait Object Overhead**: Acceptable 1-2ns vtable dispatch cost
- **Async Overhead**: ~10-50ns per async call, acceptable for port abstraction
- **Mock Performance**: In-memory operations should be <1μs
- **Compilation Time**: Keep proc macro usage minimal to maintain fast builds

## Risk Mitigation

### Risk: Poor Port Interface Design
**Mitigation**: Follow H2A2 architecture principles, review against domain requirements, get team feedback before implementation

### Risk: Mock Complexity
**Mitigation**: Keep mocks simple and focused on testing scenarios, avoid implementing full functionality

### Risk: Breaking Changes
**Mitigation**: Design ports to be extensible, use semantic versioning, document stability guarantees