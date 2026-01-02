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

## Source Code Coverage Table

**Purpose:** Ensure every public struct, enum, and function is tested, including error cases and enum variants.

| Source Code | Test Case |
|-------------|-----------|
| symphony_core_ports::TextEditingPort::create_buffer | ports_contract_test::test_create_buffer_success, ports_contract_test::test_create_buffer_with_file |
| symphony_core_ports::TextEditingPort::close_buffer | ports_contract_test::test_close_buffer_success, ports_contract_test::test_close_nonexistent_buffer |
| symphony_core_ports::TextEditingPort::get_buffer_content | ports_contract_test::test_get_buffer_content_success, ports_contract_test::test_get_nonexistent_buffer |
| symphony_core_ports::TextEditingPort::insert_text | ports_contract_test::test_insert_text_success, ports_contract_test::test_insert_text_invalid_position |
| symphony_core_ports::TextEditingPort::delete_text | ports_contract_test::test_delete_text_success, ports_contract_test::test_delete_text_invalid_range |
| symphony_core_ports::TextEditingPort::replace_text | ports_contract_test::test_replace_text_success, ports_contract_test::test_replace_text_invalid_range |
| symphony_core_ports::TextEditingPort::save_buffer | ports_contract_test::test_save_buffer_success, ports_contract_test::test_save_buffer_no_file |
| symphony_core_ports::TextEditingPort::save_buffer_as | ports_contract_test::test_save_buffer_as_success, ports_contract_test::test_save_buffer_as_invalid_path |
| symphony_core_ports::TextEditingPort::reload_buffer | ports_contract_test::test_reload_buffer_success, ports_contract_test::test_reload_buffer_no_file |
| symphony_core_ports::TextEditingPort::create_view | ports_contract_test::test_create_view_success, ports_contract_test::test_create_view_invalid_buffer |
| symphony_core_ports::TextEditingPort::close_view | ports_contract_test::test_close_view_success, ports_contract_test::test_close_nonexistent_view |
| symphony_core_ports::TextEditingPort::set_cursor | ports_contract_test::test_set_cursor_success, ports_contract_test::test_set_cursor_invalid_position |
| symphony_core_ports::TextEditingPort::set_selection | ports_contract_test::test_set_selection_success, ports_contract_test::test_set_selection_invalid_range |
| symphony_core_ports::TextEditingPort::subscribe_to_events | ports_contract_test::test_subscribe_events_success, ports_contract_test::test_subscribe_events_failure |
| symphony_core_ports::PitPort::allocate_model | ports_contract_test::test_allocate_model_success, ports_contract_test::test_allocate_model_insufficient_resources |
| symphony_core_ports::PitPort::deallocate_model | ports_contract_test::test_deallocate_model_success, ports_contract_test::test_deallocate_invalid_handle |
| symphony_core_ports::PitPort::get_model_status | ports_contract_test::test_get_model_status_success, ports_contract_test::test_get_model_status_invalid_handle |
| symphony_core_ports::PitPort::create_workflow | ports_contract_test::test_create_workflow_success, ports_contract_test::test_create_workflow_invalid_definition |
| symphony_core_ports::PitPort::execute_workflow | ports_contract_test::test_execute_workflow_success, ports_contract_test::test_execute_workflow_failure |
| symphony_core_ports::PitPort::get_workflow_status | ports_contract_test::test_get_workflow_status_success, ports_contract_test::test_get_workflow_status_nonexistent |
| symphony_core_ports::PitPort::store_artifact | ports_contract_test::test_store_artifact_success, ports_contract_test::test_store_artifact_failure |
| symphony_core_ports::PitPort::retrieve_artifact | ports_contract_test::test_retrieve_artifact_success, ports_contract_test::test_retrieve_nonexistent_artifact |
| symphony_core_ports::PitPort::delete_artifact | ports_contract_test::test_delete_artifact_success, ports_contract_test::test_delete_nonexistent_artifact |
| symphony_core_ports::PitPort::submit_decision | ports_contract_test::test_submit_decision_success, ports_contract_test::test_submit_decision_failure |
| symphony_core_ports::PitPort::get_policy | ports_contract_test::test_get_policy_success, ports_contract_test::test_get_nonexistent_policy |
| symphony_core_ports::PitPort::mark_stale | ports_contract_test::test_mark_stale_success, ports_contract_test::test_mark_stale_nonexistent |
| symphony_core_ports::PitPort::cleanup_stale | ports_contract_test::test_cleanup_stale_success, ports_contract_test::test_cleanup_stale_failure |
| symphony_core_ports::ExtensionPort::load_extension | ports_contract_test::test_load_extension_success, ports_contract_test::test_load_extension_invalid_manifest |
| symphony_core_ports::ExtensionPort::unload_extension | ports_contract_test::test_unload_extension_success, ports_contract_test::test_unload_nonexistent_extension |
| symphony_core_ports::ExtensionPort::activate_extension | ports_contract_test::test_activate_extension_success, ports_contract_test::test_activate_extension_failure |
| symphony_core_ports::ExtensionPort::deactivate_extension | ports_contract_test::test_deactivate_extension_success, ports_contract_test::test_deactivate_extension_failure |
| symphony_core_ports::ExtensionPort::send_message | ports_contract_test::test_send_message_success, ports_contract_test::test_send_message_failure |
| symphony_core_ports::ExtensionPort::broadcast_message | ports_contract_test::test_broadcast_message_success, ports_contract_test::test_broadcast_message_failure |
| symphony_core_ports::ExtensionPort::list_extensions | ports_contract_test::test_list_extensions_success, ports_contract_test::test_list_extensions_failure |
| symphony_core_ports::ExtensionPort::get_extension_info | ports_contract_test::test_get_extension_info_success, ports_contract_test::test_get_extension_info_nonexistent |
| symphony_core_ports::ExtensionPort::get_extension_health | ports_contract_test::test_get_extension_health_success, ports_contract_test::test_get_extension_health_nonexistent |
| symphony_core_ports::ExtensionPort::restart_extension | ports_contract_test::test_restart_extension_success, ports_contract_test::test_restart_extension_failure |
| symphony_core_ports::ConductorPort::start_conductor | ports_contract_test::test_start_conductor_success, ports_contract_test::test_start_conductor_failure |
| symphony_core_ports::ConductorPort::stop_conductor | ports_contract_test::test_stop_conductor_success, ports_contract_test::test_stop_conductor_failure |
| symphony_core_ports::ConductorPort::get_conductor_status | ports_contract_test::test_get_conductor_status_success, ports_contract_test::test_get_conductor_status_failure |
| symphony_core_ports::ConductorPort::submit_decision | ports_contract_test::test_submit_decision_success, ports_contract_test::test_submit_decision_conductor_down |
| symphony_core_ports::ConductorPort::get_decision_history | ports_contract_test::test_get_decision_history_success, ports_contract_test::test_get_decision_history_failure |
| symphony_core_ports::ConductorPort::update_policy | ports_contract_test::test_update_policy_success, ports_contract_test::test_update_policy_invalid |
| symphony_core_ports::ConductorPort::get_active_policies | ports_contract_test::test_get_active_policies_success, ports_contract_test::test_get_active_policies_failure |
| symphony_core_ports::ConductorPort::submit_feedback | ports_contract_test::test_submit_feedback_success, ports_contract_test::test_submit_feedback_invalid_decision |
| symphony_core_ports::ConductorPort::get_learning_metrics | ports_contract_test::test_get_learning_metrics_success, ports_contract_test::test_get_learning_metrics_failure |
| symphony_core_ports::DataAccessPort::pre_validate_workflow | ports_contract_test::test_pre_validate_workflow_success, ports_contract_test::test_pre_validate_workflow_invalid |
| symphony_core_ports::DataAccessPort::pre_validate_user | ports_contract_test::test_pre_validate_user_success, ports_contract_test::test_pre_validate_user_invalid |
| symphony_core_ports::DataAccessPort::pre_validate_extension | ports_contract_test::test_pre_validate_extension_success, ports_contract_test::test_pre_validate_extension_invalid |
| symphony_core_ports::DataAccessPort::create_workflow | ports_contract_test::test_create_workflow_success, ports_contract_test::test_create_workflow_auth_failure |
| symphony_core_ports::DataAccessPort::get_workflow | ports_contract_test::test_get_workflow_success, ports_contract_test::test_get_workflow_not_found |
| symphony_core_ports::DataAccessPort::update_workflow | ports_contract_test::test_update_workflow_success, ports_contract_test::test_update_workflow_access_denied |
| symphony_core_ports::DataAccessPort::delete_workflow | ports_contract_test::test_delete_workflow_success, ports_contract_test::test_delete_workflow_access_denied |
| symphony_core_ports::DataAccessPort::authenticate_user | ports_contract_test::test_authenticate_user_success, ports_contract_test::test_authenticate_user_invalid_credentials |
| symphony_core_ports::DataAccessPort::authorize_action | ports_contract_test::test_authorize_action_success, ports_contract_test::test_authorize_action_denied |
| symphony_core_ports::DataAccessPort::get_user_permissions | ports_contract_test::test_get_user_permissions_success, ports_contract_test::test_get_user_permissions_not_found |
| symphony_core_ports::DataAccessPort::register_extension | ports_contract_test::test_register_extension_success, ports_contract_test::test_register_extension_invalid_manifest |
| symphony_core_ports::DataAccessPort::get_extension_metadata | ports_contract_test::test_get_extension_metadata_success, ports_contract_test::test_get_extension_metadata_not_found |
| symphony_core_ports::DataAccessPort::update_extension_status | ports_contract_test::test_update_extension_status_success, ports_contract_test::test_update_extension_status_not_found |
| symphony_core_ports::BufferId (struct) | types_validation_test::test_buffer_id_creation, types_validation_test::test_buffer_id_uniqueness |
| symphony_core_ports::ViewId (struct) | types_validation_test::test_view_id_creation, types_validation_test::test_view_id_uniqueness |
| symphony_core_ports::Position (struct) | types_validation_test::test_position_creation, types_validation_test::test_position_serialization |
| symphony_core_ports::Range (struct) | types_validation_test::test_range_creation, types_validation_test::test_range_validation |
| symphony_core_ports::PortError (enum variants) | errors_propagation_test::test_port_error_variants, errors_propagation_test::test_error_conversion |
| symphony_core_ports::mocks::MockTextEditingAdapter | mocks_behavior_test::test_mock_determinism, mocks_behavior_test::test_mock_performance |
| symphony_core_ports::mocks::MockPitAdapter | mocks_behavior_test::test_pit_mock_behavior, mocks_behavior_test::test_pit_mock_error_injection |
| symphony_core_ports::mocks::MockExtensionAdapter | mocks_behavior_test::test_extension_mock_behavior, mocks_behavior_test::test_extension_mock_lifecycle |
| symphony_core_ports::mocks::MockConductorAdapter | mocks_behavior_test::test_conductor_mock_behavior, mocks_behavior_test::test_conductor_mock_decisions |
| symphony_core_ports::mocks::MockDataAccessAdapter | mocks_behavior_test::test_data_access_mock_behavior, mocks_behavior_test::test_data_access_mock_validation |

**Table Rules:**
- **Source Code Column:** Full path/namespace, struct/enum/function name, line range for functions
- **Test Case Column:** Test file name, one or more test case names  
- **Coverage Requirement:** Every public struct, enum, function must have corresponding test cases
- **Error Coverage:** All error cases and enum variants must be tested
- **Update Timing:** Table updated after source code creation (Step 2 in TDD)

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