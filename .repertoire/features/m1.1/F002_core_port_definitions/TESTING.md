# F002 - Core Port Definitions - Testing

**Feature ID**: F002  
**Testing Date**: December 29, 2025  
**Testing Architecture**: Three-layer testing with mock-based contract verification  
**Performance Targets**: <100ms unit tests, <1ms mock operations  
**Testing Status**: [x] COMPLETE

---

## Testing Philosophy

**F002 is Infrastructure** because it provides foundational port abstractions that separate domain logic from concrete implementations, enabling the entire H2A2 architecture.

**Test Focus**: Verify that port trait contracts work correctly, mock implementations provide deterministic behavior, and type system enforces proper usage patterns.

**DON'T Test**: Internal implementation details of future concrete adapters, business logic that will use these ports, or performance characteristics of real implementations.

## Feature Type Analysis

**Primary Type**: Infrastructure  
**Rationale**: F002 provides the foundational port abstractions that enable Symphony's H2A2 architecture. These are boundary definitions that separate domain logic from infrastructure concerns.

**What to Test**:
- Port trait contracts and method signatures
- Mock implementation determinism and correctness
- Error handling and propagation across port boundaries
- Type system enforcement and serialization

**What NOT to Test**:
- Concrete adapter implementations (tested in their own features)
- Business logic that uses these ports (tested in domain features)
- Performance of real implementations (benchmarked separately)

## Testing Strategy Integration

### Layer 1: Unit Tests (Rust) - <100ms
**Focus**: Port trait contracts, type system validation, mock behavior verification
- Mock all external dependencies (none for this feature)
- Test every public trait method contract
- Verify error handling and type conversions
- Use rstest for fixtures and parameterized testing

### Layer 2: Integration Tests (Rust + Mock Integration) - <5s
**Focus**: Cross-port interaction patterns, mock coordination, error propagation
- Test mock implementations working together
- Verify event streaming and correlation
- Test error propagation across port boundaries
- Validate serialization/deserialization round-trips

### Layer 3: Pre-validation Tests (Rust) - <1ms
**Focus**: Type validation, format checking, basic constraint verification
- Test domain type validation methods
- Verify identifier generation and uniqueness
- Test serialization format compliance
- Ensure fast rejection of invalid inputs

## Mock vs Real Decision Matrix

| Dependency | Use MOCK | Use REAL | Decision | Rationale |
|------------|----------|----------|----------|-----------|
| sy-commons::SymphonyError | | ✅ | Real | Testing actual error integration |
| UUID generation | | ✅ | Real | Testing actual identifier behavior |
| Serde serialization | | ✅ | Real | Testing actual serialization behavior |
| Async runtime (Tokio) | | ✅ | Real | Testing actual async behavior |
| External services | ✅ | | Mock | No external services in this feature |

## Test Organization

```
tests/
├── unit/                           # Single component tests
│   ├── ports_contract_test.rs      # Port trait contract validation
│   ├── types_validation_test.rs    # Domain type validation tests
│   ├── errors_propagation_test.rs  # Error handling tests
│   └── mocks_behavior_test.rs      # Mock implementation tests
├── factory/                        # Test data generation
│   ├── port_fixtures.rs           # Port test data factory
│   ├── type_generators.rs         # Domain type generators
│   └── error_scenarios.rs         # Error condition generators
├── integration/                    # Component interaction tests
│   ├── mock_coordination_test.rs   # Cross-mock interaction tests
│   ├── event_streaming_test.rs     # Event flow integration tests
│   └── error_boundary_test.rs      # Error propagation integration
├── fixtures/                       # Static test data
│   ├── sample_manifests.toml       # Extension manifest examples
│   ├── workflow_definitions.json   # Workflow test data
│   └── error_scenarios.json        # Error condition test cases
└── mocks/                          # Mock implementations (in src/mocks.rs)
```

### Files to Create:
* [ ] tests/unit/ports_contract_test.rs
* [ ] tests/unit/types_validation_test.rs  
* [ ] tests/unit/errors_propagation_test.rs
* [ ] tests/unit/mocks_behavior_test.rs
* [ ] tests/factory/port_fixtures.rs
* [ ] tests/factory/type_generators.rs
* [ ] tests/integration/mock_coordination_test.rs
* [ ] tests/fixtures/sample_manifests.toml
* [ ] tests/fixtures/workflow_definitions.json

## Testing Boundary Separation

### Rust Layer Testing (This Feature)
**Test Scope**: Port trait contracts, type system, mock implementations, error handling
- Port trait method signatures and contracts
- Domain type validation and serialization
- Mock implementation determinism
- Error type conversion and propagation

### OFB Python Layer Testing (Not This Feature)
**Out of Scope**: Business logic validation, RBAC, data persistence
- Authoritative validation logic (handled by OFB Python team)
- Database operations and data persistence
- Authentication and authorization logic
- Complex business rule validation

## Required Testing Tools

- **rstest 0.18.2**: Fixtures and parameterized testing
- **tokio::test**: Async test runtime
- **mockall 0.12.1**: Mock generation framework (used in implementation)
- **criterion 0.5.1**: Performance benchmarking
- **proptest 1.4.0**: Property-based testing for type validation
- **serde_json**: JSON serialization testing
- **uuid**: Identifier generation testing

## Acceptance Tests (ATDD Format)

### Port Interface Completeness
```gherkin
Scenario: All port traits are properly defined
  Given the H2A2 architecture specification
  When all five port traits are implemented
  Then TextEditingPort has all buffer and file operations
  And PitPort has all infrastructure operations
  And ExtensionPort has all lifecycle operations
  And ConductorPort has all Python integration operations
  And DataAccessPort has all two-layer operations
  And all methods return async Result types
```

### Mock Implementation Quality
```gherkin
Scenario: Mock implementations provide deterministic behavior
  Given mock implementations for all ports
  When the same operations are performed multiple times
  Then results are identical across runs
  And error injection works consistently
  And state changes are predictable
  And performance is <1ms per operation
```

### Error Handling Correctness
```gherkin
Scenario: Error propagation works across port boundaries
  Given port operations that can fail
  When errors occur in port implementations
  Then errors are properly wrapped in SymphonyError
  And error context is preserved
  And error messages are actionable
  And error chains maintain debugging information
```

### Type System Enforcement
```gherkin
Scenario: Domain types enforce proper usage
  Given domain type definitions
  When types are used incorrectly
  Then compilation fails with clear errors
  And serialization round-trips preserve data
  And identifier uniqueness is maintained
  And validation methods catch invalid data
```

## Unit Test Suites

### 1. Port Contract Tests (`ports_contract_test.rs`)
**Purpose**: Verify all port trait methods have correct signatures and contracts

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use rstest::*;
    
    #[fixture]
    fn mock_text_editing() -> MockTextEditingAdapter {
        MockTextEditingAdapter::new()
    }
    
    #[rstest]
    #[tokio::test]
    async fn test_create_buffer_returns_valid_id(mock_text_editing: MockTextEditingAdapter) {
        let result = mock_text_editing.create_buffer(None).await;
        assert!(result.is_ok());
        let buffer_id = result.unwrap();
        assert_ne!(buffer_id.0, Uuid::nil());
    }
    
    #[rstest]
    #[tokio::test]
    async fn test_get_nonexistent_buffer_returns_error(mock_text_editing: MockTextEditingAdapter) {
        let fake_id = BufferId(Uuid::new_v4());
        let result = mock_text_editing.get_buffer_content(fake_id).await;
        assert!(result.is_err());
    }
}
```

### 2. Type Validation Tests (`types_validation_test.rs`)
**Purpose**: Verify domain types work correctly and enforce constraints

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use proptest::prelude::*;
    
    #[test]
    fn test_buffer_id_uniqueness() {
        let id1 = BufferId(Uuid::new_v4());
        let id2 = BufferId(Uuid::new_v4());
        assert_ne!(id1, id2);
    }
    
    #[test]
    fn test_position_serialization_roundtrip() {
        let pos = Position { line: 42, column: 17 };
        let json = serde_json::to_string(&pos).unwrap();
        let deserialized: Position = serde_json::from_str(&json).unwrap();
        assert_eq!(pos, deserialized);
    }
    
    proptest! {
        #[test]
        fn test_range_validity(
            start_line in 0u32..1000,
            start_col in 0u32..1000,
            end_line in 0u32..1000,
            end_col in 0u32..1000
        ) {
            let start = Position { line: start_line, column: start_col };
            let end = Position { line: end_line, column: end_col };
            let range = Range { start, end };
            
            // Range should serialize and deserialize correctly
            let json = serde_json::to_string(&range).unwrap();
            let deserialized: Range = serde_json::from_str(&json).unwrap();
            prop_assert_eq!(range, deserialized);
        }
    }
}
```

### 3. Error Propagation Tests (`errors_propagation_test.rs`)
**Purpose**: Verify error handling works correctly across all scenarios

```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_port_error_to_symphony_error_conversion() {
        let port_error = PortError::TextEditingFailed {
            message: "Buffer not found".to_string(),
        };
        let symphony_error: SymphonyError = port_error.into();
        
        match symphony_error {
            SymphonyError::PortOperation(msg) => {
                assert!(msg.contains("Text editing operation failed"));
                assert!(msg.contains("Buffer not found"));
            }
            _ => panic!("Expected PortOperation error"),
        }
    }
    
    #[test]
    fn test_error_context_preservation() {
        let original_error = PortError::ProcessCommunicationFailed {
            process_id: ProcessId(Uuid::new_v4()),
            message: "Connection timeout".to_string(),
        };
        
        let error_string = original_error.to_string();
        assert!(error_string.contains("Process communication failed"));
        assert!(error_string.contains("Connection timeout"));
    }
}
```

### 4. Mock Behavior Tests (`mocks_behavior_test.rs`)
**Purpose**: Verify mock implementations provide deterministic, testable behavior

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Instant;
    
    #[tokio::test]
    async fn test_mock_determinism() {
        let mock = MockTextEditingAdapter::new();
        
        // Perform same operation multiple times
        let results: Vec<_> = (0..10)
            .map(|_| mock.create_buffer(None))
            .collect::<futures::stream::FuturesUnordered<_>>()
            .collect::<Vec<_>>()
            .await;
        
        // All should succeed
        assert!(results.iter().all(|r| r.is_ok()));
        
        // All IDs should be unique
        let ids: std::collections::HashSet<_> = results
            .into_iter()
            .map(|r| r.unwrap())
            .collect();
        assert_eq!(ids.len(), 10);
    }
    
    #[tokio::test]
    async fn test_mock_performance() {
        let mock = MockTextEditingAdapter::new();
        
        let start = Instant::now();
        let _ = mock.create_buffer(None).await.unwrap();
        let duration = start.elapsed();
        
        // Mock operations should be very fast
        assert!(duration.as_millis() < 1, "Mock operation took {}ms", duration.as_millis());
    }
    
    #[tokio::test]
    async fn test_mock_error_injection() {
        let mock = MockTextEditingAdapter::new();
        mock.simulate_error("buffer_not_found");
        
        let fake_id = BufferId(Uuid::new_v4());
        let result = mock.get_buffer_content(fake_id).await;
        
        assert!(result.is_err());
        let error = result.unwrap_err();
        assert!(error.to_string().contains("Buffer not found"));
    }
}
```

## Integration Test Scenarios

### 1. Mock Coordination Tests
**Purpose**: Verify multiple mocks work together correctly

```rust
#[tokio::test]
async fn test_cross_port_workflow() {
    let text_editing = MockTextEditingAdapter::new();
    let pit = MockPitAdapter::new();
    let extensions = MockExtensionAdapter::new();
    
    // Simulate a workflow that uses multiple ports
    let buffer_id = text_editing.create_buffer(None).await.unwrap();
    let workflow_id = pit.create_workflow(sample_workflow()).await.unwrap();
    let extension_id = extensions.load_extension(sample_manifest()).await.unwrap();
    
    // Verify all operations succeeded and IDs are valid
    assert_ne!(buffer_id.0, Uuid::nil());
    assert_ne!(workflow_id.0, Uuid::nil());
    assert_ne!(extension_id.0, Uuid::nil());
}
```

### 2. Event Streaming Tests
**Purpose**: Verify event streaming works across port boundaries

```rust
#[tokio::test]
async fn test_event_streaming_integration() {
    let mock = MockTextEditingAdapter::new();
    let mut event_stream = mock.subscribe_to_events().await.unwrap();
    
    // Perform operations that should generate events
    let buffer_id = mock.create_buffer(Some(PathBuf::from("test.txt"))).await.unwrap();
    mock.insert_text(buffer_id, Position { line: 0, column: 0 }, "Hello").await.unwrap();
    
    // Verify events are received
    let event1 = event_stream.next().await.unwrap();
    let event2 = event_stream.next().await.unwrap();
    
    match event1 {
        TextEditingEvent::BufferCreated { buffer_id: id, .. } => assert_eq!(id, buffer_id),
        _ => panic!("Expected BufferCreated event"),
    }
    
    match event2 {
        TextEditingEvent::BufferModified { buffer_id: id, .. } => assert_eq!(id, buffer_id),
        _ => panic!("Expected BufferModified event"),
    }
}
```

## Test Execution Plan

### Pre-Implementation Testing
- [ ] Set up test infrastructure and dependencies
- [ ] Create test fixtures and sample data
- [ ] Implement test factories for data generation
- [ ] Validate test organization and structure

### During Implementation Testing
- [ ] Write unit tests alongside each port trait implementation
- [ ] Test mock implementations as they are created
- [ ] Verify error handling for each error type
- [ ] Run integration tests after each major component

### Post-Implementation Testing
- [ ] Run complete test suite and verify coverage
- [ ] Performance benchmark all mock operations
- [ ] Validate error propagation end-to-end
- [ ] Test serialization round-trips for all types

### Testing Markers

Tests are organized using markers for easy execution:

- `unit`: Fast isolated tests for port contracts (<100ms total)
- `integration`: Cross-port interaction tests (<5s total)
- `mock`: Mock implementation validation tests
- `performance`: Performance validation tests (<1ms per operation)
- `serialization`: Serialization/deserialization tests
- `error_handling`: Error propagation and handling tests

### Performance Testing Requirements

- **Unit Tests**: Complete in <100ms total
- **Integration Tests**: Complete in <5s total  
- **Mock Operations**: Execute in <1ms per call
- **Memory Usage**: Mock storage should not exceed 10MB during tests
- **Error Handling**: Error creation and propagation <0.1ms

---

**Testing Strategy Complete**: Ready for IMPLEMENTATION phase  
**Next Phase**: IMPLEMENTATION.md - Implementation progress tracking template