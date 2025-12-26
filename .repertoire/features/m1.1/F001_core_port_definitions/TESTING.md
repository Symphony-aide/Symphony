# F001: Core Port Definitions - Testing

**Feature**: F001_core_port_definitions  
**Testing Complexity**: Medium  
**Test Categories**: Unit, Property, Integration

---

## Testing Philosophy

F001 is **Infrastructure** because it provides the foundational port interfaces that abstract external dependencies in Symphony's Hexagonal Architecture. The primary testing focus is ensuring the port boundaries work correctly and that mock implementations provide reliable test doubles.

**Test Focus**: Does the boundary work? Error handling? Mock behavior consistency?  
**Don't Test**: Internal implementation details of future adapters

---

## Q1: Feature Type Analysis

**F001 is Infrastructure because:**
- Provides port trait definitions that abstract external systems (Xi-editor, Python Conductor, extensions)
- Establishes boundaries between domain core and external adapters
- Enables dependency injection and testing isolation
- Forms the foundation for Hexagonal Architecture implementation

---

## Q2: What Should I Test?

| Test Category | Test This | DON'T Test This |
|---------------|-----------|-----------------|
| **Infrastructure Tests** | Port trait compilation and bounds | Future adapter implementations |
| **Contract Tests** | Mock implementations fulfill port contracts | Internal mock data structures |
| **Behavior Tests** | Error handling and async behavior | Specific error message formatting |
| **Integration Tests** | Mock adapters work with async runtime | Performance of real adapters |

### Test Level Decisions:
- [x] **Infrastructure Tests** - Port traits compile and satisfy Send + Sync bounds
- [x] **Contract Tests** - Mock implementations correctly implement all port methods
- [x] **Behavior Tests** - Async operations and error handling work correctly
- [x] **Integration Tests** - Mocks integrate properly with tokio runtime

### Test Markers:
- `unit`: Fast, isolated port trait and mock tests
- `integration`: Tests involving async runtime and cross-component interaction
- `property`: Property-based tests for type serialization and mock determinism

---

## Q3: Mock vs Real Dependencies

| Dependency | Use MOCK | Use REAL | Rationale |
|------------|----------|----------|-----------|
| **Tokio Runtime** | ❌ | ✅ | Fast (<1ms), deterministic, testing the dependency itself |
| **Async Trait Macro** | ❌ | ✅ | Compile-time, no side effects, part of the interface |
| **Serde Serialization** | ❌ | ✅ | Fast, deterministic, testing serialization correctness |
| **UUID Generation** | ⚠️ | ✅ | Use real for most tests, mock for deterministic test scenarios |
| **External Systems** | ✅ | ❌ | Not yet implemented, would be slow, non-deterministic |

---

## Q4: Test File Organization

```
tests/
├── unit/                    # Single component tests
│   ├── port_traits_test.rs  # Port trait compilation and bounds
│   ├── domain_types_test.rs # Type serialization and validation
│   ├── error_types_test.rs  # Error construction and conversion
│   └── mock_adapters_test.rs # Mock implementation behavior
├── integration/             # Component interaction tests
│   ├── async_runtime_test.rs # Async port operations with tokio
│   └── mock_integration_test.rs # Mock adapters in realistic scenarios
├── property/                # Property-based tests
│   ├── type_roundtrip_test.rs # Serialization round-trip properties
│   └── mock_determinism_test.rs # Mock behavior consistency
└── fixtures/                # Test data
    ├── sample_manifests.json # Extension manifest examples
    └── test_configs.json    # Model specification examples
```

### Files to Create:
* [x] `tests/unit/port_traits_test.rs` - Port trait compilation tests
* [x] `tests/unit/mock_adapters_test.rs` - Mock implementation tests  
* [x] `tests/integration/async_runtime_test.rs` - Async integration tests
* [x] `tests/property/type_roundtrip_test.rs` - Property-based tests
* [x] `tests/fixtures/sample_data.json` - Test data fixtures

---

## Acceptance Tests (ATDD Format)

### AT1: Port Trait Compilation
```gherkin
Given the four core port traits are defined
When I compile the symphony-core-ports crate
Then all traits should compile without errors
And all traits should satisfy Send + Sync bounds
And all methods should be properly async
```

### AT2: Mock Implementation Completeness
```gherkin
Given mock implementations for all four ports
When I call any port method on a mock
Then the method should execute without panicking
And should return appropriate success or error results
And should maintain consistent internal state
```

### AT3: Error Handling Consistency
```gherkin
Given any port method that can fail
When an error condition occurs
Then the method should return a PortError variant
And the error should contain meaningful context
And the error should be serializable for logging
```

### AT4: Async Runtime Integration
```gherkin
Given mock adapters running in tokio runtime
When multiple async operations execute concurrently
Then all operations should complete successfully
And no deadlocks or race conditions should occur
And event subscriptions should work correctly
```

---

## Unit Test Suites

### Suite 1: Port Trait Validation
**Purpose**: Ensure port traits are correctly defined and compilable

```rust
#[cfg(test)]
mod port_trait_tests {
    use super::*;
    
    #[test]
    fn text_editing_port_is_object_safe() {
        // Verify trait can be used as trait object
        let _: Box<dyn TextEditingPort> = Box::new(MockTextEditingAdapter::new());
    }
    
    #[test]
    fn all_ports_are_send_sync() {
        fn assert_send_sync<T: Send + Sync>() {}
        assert_send_sync::<MockTextEditingAdapter>();
        assert_send_sync::<MockPitAdapter>();
        assert_send_sync::<MockExtensionAdapter>();
        assert_send_sync::<MockConductorAdapter>();
    }
}
```

### Suite 2: Mock Adapter Behavior
**Purpose**: Validate mock implementations provide correct test behavior

```rust
#[cfg(test)]
mod mock_adapter_tests {
    use super::*;
    
    #[tokio::test]
    async fn mock_text_editing_insert_and_retrieve() {
        let mock = MockTextEditingAdapter::new();
        let buffer_id = BufferId::new();
        
        // Insert text
        let revision = mock.insert(buffer_id.clone(), 0, "Hello").await.unwrap();
        assert!(revision.0 > 0);
        
        // Retrieve content
        let content = mock.get_content(buffer_id).await.unwrap();
        assert_eq!(content.to_string(), "Hello");
    }
    
    #[tokio::test]
    async fn mock_pit_model_lifecycle() {
        let mock = MockPitAdapter::new();
        let spec = ModelSpec {
            model_id: "test-model".to_string(),
            version: Some("1.0".to_string()),
            config: HashMap::new(),
            resource_limits: ResourceLimits::default(),
        };
        
        // Allocate model
        let handle = mock.allocate_model(spec).await.unwrap();
        
        // Release model
        mock.release_model(handle).await.unwrap();
    }
}
```

### Suite 3: Error Handling
**Purpose**: Verify error types and conversion work correctly

```rust
#[cfg(test)]
mod error_tests {
    use super::*;
    
    #[test]
    fn port_error_construction() {
        let error = PortError::operation_failed("test message");
        assert!(matches!(error, PortError::OperationFailed { .. }));
        assert_eq!(error.to_string(), "Operation failed: test message");
    }
    
    #[test]
    fn port_error_serialization() {
        let error = PortError::not_found("buffer-123");
        let json = serde_json::to_string(&error).unwrap();
        let deserialized: PortError = serde_json::from_str(&json).unwrap();
        assert!(matches!(deserialized, PortError::NotFound { .. }));
    }
}
```

---

## Integration Test Scenarios

### Scenario 1: Async Runtime Integration
**Purpose**: Ensure mocks work correctly in async environment

```rust
#[tokio::test]
async fn concurrent_port_operations() {
    let text_mock = Arc::new(MockTextEditingAdapter::new());
    let pit_mock = Arc::new(MockPitAdapter::new());
    
    let tasks = (0..10).map(|i| {
        let text_mock = text_mock.clone();
        let pit_mock = pit_mock.clone();
        
        tokio::spawn(async move {
            let buffer_id = BufferId::new();
            let model_spec = ModelSpec::default();
            
            // Concurrent operations
            let (text_result, model_result) = tokio::join!(
                text_mock.insert(buffer_id, 0, &format!("text-{}", i)),
                pit_mock.allocate_model(model_spec)
            );
            
            (text_result.unwrap(), model_result.unwrap())
        })
    });
    
    let results = futures::future::join_all(tasks).await;
    assert_eq!(results.len(), 10);
}
```

### Scenario 2: Event Subscription
**Purpose**: Verify event streams work correctly

```rust
#[tokio::test]
async fn extension_event_subscription() {
    let mock = MockExtensionAdapter::new();
    let extension_id = ExtensionId("test-extension".to_string());
    
    // Subscribe to events
    let mut events = mock.events(extension_id.clone());
    
    // Load extension (should trigger event)
    let manifest = ExtensionManifest::default();
    mock.load(manifest).await.unwrap();
    
    // Verify event received
    let event = tokio::time::timeout(Duration::from_millis(100), events.recv()).await;
    assert!(matches!(event, Ok(Ok(ExtensionEvent::Loaded))));
}
```

---

## Property-Based Tests

### Property 1: Type Serialization Round-Trip
```rust
use proptest::prelude::*;

proptest! {
    #[test]
    fn buffer_id_roundtrip(uuid in any::<uuid::Uuid>()) {
        let buffer_id = BufferId(uuid);
        let json = serde_json::to_string(&buffer_id).unwrap();
        let deserialized: BufferId = serde_json::from_str(&json).unwrap();
        prop_assert_eq!(buffer_id, deserialized);
    }
    
    #[test]
    fn extension_manifest_roundtrip(
        id in "[a-z-]{3,20}",
        name in "[A-Za-z ]{5,30}",
        version in any::<(u64, u64, u64)>()
    ) {
        let manifest = ExtensionManifest {
            id,
            name,
            version: semver::Version::new(version.0, version.1, version.2),
            extension_type: ExtensionType::Instrument,
            permissions: vec![],
            dependencies: vec![],
        };
        
        let json = serde_json::to_string(&manifest).unwrap();
        let deserialized: ExtensionManifest = serde_json::from_str(&json).unwrap();
        prop_assert_eq!(manifest.id, deserialized.id);
        prop_assert_eq!(manifest.version, deserialized.version);
    }
}
```

### Property 2: Mock Determinism
```rust
proptest! {
    #[test]
    fn mock_operations_are_deterministic(
        operations in prop::collection::vec(any::<u32>(), 1..100)
    ) {
        let rt = tokio::runtime::Runtime::new().unwrap();
        
        // Run same operations twice
        let result1 = rt.block_on(async {
            let mock = MockTextEditingAdapter::new();
            let buffer_id = BufferId::new();
            
            for op in &operations {
                let _ = mock.insert(buffer_id.clone(), 0, &op.to_string()).await;
            }
            
            mock.get_content(buffer_id).await.unwrap().to_string()
        });
        
        let result2 = rt.block_on(async {
            let mock = MockTextEditingAdapter::new();
            let buffer_id = BufferId::new();
            
            for op in &operations {
                let _ = mock.insert(buffer_id.clone(), 0, &op.to_string()).await;
            }
            
            mock.get_content(buffer_id).await.unwrap().to_string()
        });
        
        prop_assert_eq!(result1, result2);
    }
}
```

---

## Test Execution Plan

### Pre-Implementation
- [ ] Set up test framework dependencies (tokio-test, proptest)
- [ ] Create test file structure
- [ ] Write failing tests for port traits (TDD approach)

### During Implementation
- [ ] Run unit tests after each port trait definition
- [ ] Implement mock adapters to make tests pass
- [ ] Add integration tests as async functionality is added
- [ ] Run property tests to verify type correctness

### Post-Implementation
- [ ] Full test suite execution (target: <5 seconds)
- [ ] Code coverage analysis (target: >90%)
- [ ] Performance benchmarks for mock operations
- [ ] Documentation review of test examples

### Continuous Integration
- [ ] All tests must pass before merge
- [ ] Property tests run with 1000+ iterations
- [ ] Test execution time monitoring
- [ ] Coverage regression detection

---

## Performance Test Considerations

### Mock Performance Targets
- **Insert/Delete Operations**: <1μs per operation
- **Model Allocation**: <10μs per allocation
- **Event Subscription**: <100μs setup time
- **Concurrent Operations**: Linear scaling up to 100 concurrent tasks

### Memory Usage
- **Mock State**: <1MB per mock adapter
- **Event Buffers**: <10KB per subscription
- **Test Isolation**: No memory leaks between tests

### Test Suite Performance
- **Unit Tests**: <2 seconds total
- **Integration Tests**: <3 seconds total  
- **Property Tests**: <10 seconds total
- **Full Suite**: <15 seconds total