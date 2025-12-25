# F002: MessagePack Serialization - Testing

> **Parent**: Inherited from M1.1.2 (MessagePack Serialization)  
> **Status**: [ ] Not Started  
> **Effort**: 3 days  
> **Type**: Infrastructure  

---

## Testing Strategy Overview

Comprehensive testing approach using multiple testing methodologies to ensure MessagePack serialization is robust, performant, and reliable across all use cases.

### Testing Pyramid
```
                    ┌─────────────────┐
                    │  Property Tests │  ◄── Comprehensive edge cases
                    └─────────────────┘
                  ┌───────────────────────┐
                  │  Integration Tests    │  ◄── Real-world scenarios
                  └───────────────────────┘
              ┌─────────────────────────────────┐
              │        Unit Tests               │  ◄── Individual components
              └─────────────────────────────────┘
          ┌─────────────────────────────────────────┐
          │         Performance Tests               │  ◄── Benchmarks & profiling
          └─────────────────────────────────────────┘
```

---

## Unit Tests

### Core Functionality Tests

```rust
// tests/unit/serialize_tests.rs

use symphony_ipc_protocol::{Message, MessageType, Priority, MessagePackSerialize};

#[cfg(test)]
mod serialize_tests {
    use super::*;

    #[test]
    fn test_basic_message_serialization() {
        let message = Message::builder()
            .message_type(MessageType::Request)
            .payload("Hello, World!")
            .build();

        let bytes = message.to_msgpack().expect("Serialization should succeed");
        assert!(!bytes.is_empty());
        assert!(bytes.len() < 1024); // Reasonable size check
    }

    #[test]
    fn test_basic_message_deserialization() {
        let original = Message::builder()
            .message_type(MessageType::Response)
            .priority(Priority::High)
            .payload(42u32)
            .build();

        let bytes = original.to_msgpack().unwrap();
        let decoded: Message<u32> = Message::from_msgpack(&bytes).unwrap();

        assert_eq!(original.header.message_type, decoded.header.message_type);
        assert_eq!(original.header.priority, decoded.header.priority);
        assert_eq!(original.payload, decoded.payload);
    }

    #[test]
    fn test_round_trip_preservation() {
        let original = Message::builder()
            .message_type(MessageType::Event)
            .payload(vec![1, 2, 3, 4, 5])
            .build();

        let bytes = original.to_msgpack().unwrap();
        let decoded: Message<Vec<i32>> = Message::from_msgpack(&bytes).unwrap();

        assert_eq!(original, decoded);
    }

    #[test]
    fn test_empty_payload_serialization() {
        let message = Message::builder()
            .message_type(MessageType::Heartbeat)
            .payload(())
            .build();

        let bytes = message.to_msgpack().unwrap();
        let decoded: Message<()> = Message::from_msgpack(&bytes).unwrap();

        assert_eq!(message, decoded);
    }

    #[test]
    fn test_complex_nested_structures() {
        use std::collections::HashMap;

        let mut metadata = HashMap::new();
        metadata.insert("key1".to_string(), "value1".to_string());
        metadata.insert("key2".to_string(), "value2".to_string());

        let message = Message::builder()
            .message_type(MessageType::Request)
            .payload(metadata.clone())
            .build();

        let bytes = message.to_msgpack().unwrap();
        let decoded: Message<HashMap<String, String>> = Message::from_msgpack(&bytes).unwrap();

        assert_eq!(message.payload, decoded.payload);
    }
}
```

### Error Handling Tests

```rust
// tests/unit/error_tests.rs

#[cfg(test)]
mod error_tests {
    use super::*;
    use symphony_ipc_protocol::{SerializeError, DeserializeError};

    #[test]
    fn test_invalid_msgpack_data() {
        let invalid_bytes = vec![0xFF, 0xFF, 0xFF, 0xFF];
        let result: Result<Message<String>, DeserializeError> = 
            Message::from_msgpack(&invalid_bytes);

        assert!(result.is_err());
        match result.unwrap_err() {
            DeserializeError::Decoding(_) => {}, // Expected
            other => panic!("Expected Decoding error, got: {:?}", other),
        }
    }

    #[test]
    fn test_empty_bytes_deserialization() {
        let empty_bytes = vec![];
        let result: Result<Message<String>, DeserializeError> = 
            Message::from_msgpack(&empty_bytes);

        assert!(result.is_err());
    }

    #[test]
    fn test_truncated_message() {
        let original = Message::builder()
            .message_type(MessageType::Request)
            .payload("test message")
            .build();

        let mut bytes = original.to_msgpack().unwrap();
        bytes.truncate(bytes.len() / 2); // Truncate to simulate corruption

        let result: Result<Message<String>, DeserializeError> = 
            Message::from_msgpack(&bytes);

        assert!(result.is_err());
    }

    #[test]
    fn test_error_message_formatting() {
        let invalid_bytes = vec![0xFF];
        let result: Result<Message<String>, DeserializeError> = 
            Message::from_msgpack(&invalid_bytes);

        let error = result.unwrap_err();
        let error_string = format!("{}", error);
        
        assert!(error_string.contains("MessagePack decoding failed"));
    }
}
```

### Type-Specific Tests

```rust
// tests/unit/type_tests.rs

#[cfg(test)]
mod type_tests {
    use super::*;

    #[test]
    fn test_all_message_types() {
        let message_types = vec![
            MessageType::Request,
            MessageType::Response,
            MessageType::Event,
            MessageType::Error,
            MessageType::Heartbeat,
        ];

        for msg_type in message_types {
            let message = Message::builder()
                .message_type(msg_type)
                .payload("test")
                .build();

            let bytes = message.to_msgpack().unwrap();
            let decoded: Message<String> = Message::from_msgpack(&bytes).unwrap();

            assert_eq!(message.header.message_type, decoded.header.message_type);
        }
    }

    #[test]
    fn test_all_priority_levels() {
        let priorities = vec![
            Priority::Low,
            Priority::Normal,
            Priority::High,
            Priority::Critical,
        ];

        for priority in priorities {
            let message = Message::builder()
                .message_type(MessageType::Request)
                .priority(priority)
                .payload("test")
                .build();

            let bytes = message.to_msgpack().unwrap();
            let decoded: Message<String> = Message::from_msgpack(&bytes).unwrap();

            assert_eq!(message.header.priority, decoded.header.priority);
        }
    }

    #[test]
    fn test_option_types() {
        let message_with_some = Message::builder()
            .message_type(MessageType::Request)
            .payload(Some("value".to_string()))
            .build();

        let message_with_none = Message::builder()
            .message_type(MessageType::Request)
            .payload(None::<String>)
            .build();

        // Test Some variant
        let bytes = message_with_some.to_msgpack().unwrap();
        let decoded: Message<Option<String>> = Message::from_msgpack(&bytes).unwrap();
        assert_eq!(message_with_some.payload, decoded.payload);

        // Test None variant
        let bytes = message_with_none.to_msgpack().unwrap();
        let decoded: Message<Option<String>> = Message::from_msgpack(&bytes).unwrap();
        assert_eq!(message_with_none.payload, decoded.payload);
    }

    #[test]
    fn test_result_types() {
        let success_message = Message::builder()
            .message_type(MessageType::Response)
            .payload(Ok::<String, String>("success".to_string()))
            .build();

        let error_message = Message::builder()
            .message_type(MessageType::Response)
            .payload(Err::<String, String>("error".to_string()))
            .build();

        // Test Ok variant
        let bytes = success_message.to_msgpack().unwrap();
        let decoded: Message<Result<String, String>> = Message::from_msgpack(&bytes).unwrap();
        assert_eq!(success_message.payload, decoded.payload);

        // Test Err variant
        let bytes = error_message.to_msgpack().unwrap();
        let decoded: Message<Result<String, String>> = Message::from_msgpack(&bytes).unwrap();
        assert_eq!(error_message.payload, decoded.payload);
    }
}
```

---

## Integration Tests

### Real-World Scenarios

```rust
// tests/integration/real_world_tests.rs

#[cfg(test)]
mod integration_tests {
    use super::*;
    use std::collections::HashMap;
    use serde::{Serialize, Deserialize};

    #[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
    struct ComplexPayload {
        id: u64,
        name: String,
        tags: Vec<String>,
        metadata: HashMap<String, serde_json::Value>,
        nested: NestedData,
    }

    #[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
    struct NestedData {
        timestamp: u64,
        values: Vec<f64>,
        flags: HashMap<String, bool>,
    }

    #[test]
    fn test_complex_real_world_message() {
        let mut metadata = HashMap::new();
        metadata.insert("version".to_string(), serde_json::Value::String("1.0".to_string()));
        metadata.insert("count".to_string(), serde_json::Value::Number(42.into()));

        let mut flags = HashMap::new();
        flags.insert("enabled".to_string(), true);
        flags.insert("debug".to_string(), false);

        let payload = ComplexPayload {
            id: 12345,
            name: "Test Payload".to_string(),
            tags: vec!["tag1".to_string(), "tag2".to_string(), "tag3".to_string()],
            metadata,
            nested: NestedData {
                timestamp: 1640995200, // 2022-01-01 00:00:00 UTC
                values: vec![1.1, 2.2, 3.3, 4.4, 5.5],
                flags,
            },
        };

        let message = Message::builder()
            .message_type(MessageType::Request)
            .priority(Priority::High)
            .payload(payload.clone())
            .build();

        let bytes = message.to_msgpack().unwrap();
        let decoded: Message<ComplexPayload> = Message::from_msgpack(&bytes).unwrap();

        assert_eq!(message.payload, decoded.payload);
        assert_eq!(message.header.message_type, decoded.header.message_type);
        assert_eq!(message.header.priority, decoded.header.priority);
    }

    #[test]
    fn test_large_payload_handling() {
        // Create a large payload (1MB of data)
        let large_data: Vec<u8> = (0..1_048_576).map(|i| (i % 256) as u8).collect();
        
        let message = Message::builder()
            .message_type(MessageType::Event)
            .payload(large_data.clone())
            .build();

        let bytes = message.to_msgpack().unwrap();
        let decoded: Message<Vec<u8>> = Message::from_msgpack(&bytes).unwrap();

        assert_eq!(message.payload, decoded.payload);
        assert_eq!(message.payload.len(), 1_048_576);
    }

    #[test]
    fn test_unicode_string_handling() {
        let unicode_strings = vec![
            "Hello, 世界!".to_string(),
            "🚀 Symphony AIDE 🎵".to_string(),
            "Ελληνικά".to_string(),
            "العربية".to_string(),
            "हिन्दी".to_string(),
        ];

        for unicode_string in unicode_strings {
            let message = Message::builder()
                .message_type(MessageType::Request)
                .payload(unicode_string.clone())
                .build();

            let bytes = message.to_msgpack().unwrap();
            let decoded: Message<String> = Message::from_msgpack(&bytes).unwrap();

            assert_eq!(message.payload, decoded.payload);
        }
    }
}
```

### Cross-Platform Tests

```rust
// tests/integration/cross_platform_tests.rs

#[cfg(test)]
mod cross_platform_tests {
    use super::*;

    #[test]
    fn test_endianness_independence() {
        let numbers = vec![
            0u64,
            1u64,
            255u64,
            256u64,
            65535u64,
            65536u64,
            u32::MAX as u64,
            u64::MAX,
        ];

        for number in numbers {
            let message = Message::builder()
                .message_type(MessageType::Request)
                .payload(number)
                .build();

            let bytes = message.to_msgpack().unwrap();
            let decoded: Message<u64> = Message::from_msgpack(&bytes).unwrap();

            assert_eq!(message.payload, decoded.payload);
        }
    }

    #[test]
    fn test_floating_point_precision() {
        let floats = vec![
            0.0f64,
            1.0f64,
            -1.0f64,
            std::f64::consts::PI,
            std::f64::consts::E,
            f64::MIN,
            f64::MAX,
            f64::EPSILON,
        ];

        for float_val in floats {
            let message = Message::builder()
                .message_type(MessageType::Request)
                .payload(float_val)
                .build();

            let bytes = message.to_msgpack().unwrap();
            let decoded: Message<f64> = Message::from_msgpack(&bytes).unwrap();

            assert_eq!(message.payload, decoded.payload);
        }
    }
}
```

---

## Property Tests

### Comprehensive Edge Case Testing

```rust
// tests/property/msgpack_properties.rs

use proptest::prelude::*;

proptest! {
    #[test]
    fn msgpack_roundtrip_preserves_strings(s in ".*") {
        let message = Message::builder()
            .message_type(MessageType::Request)
            .payload(s.clone())
            .build();

        let bytes = message.to_msgpack().unwrap();
        let decoded: Message<String> = Message::from_msgpack(&bytes).unwrap();

        prop_assert_eq!(message.payload, decoded.payload);
    }

    #[test]
    fn msgpack_roundtrip_preserves_integers(n in any::<i64>()) {
        let message = Message::builder()
            .message_type(MessageType::Request)
            .payload(n)
            .build();

        let bytes = message.to_msgpack().unwrap();
        let decoded: Message<i64> = Message::from_msgpack(&bytes).unwrap();

        prop_assert_eq!(message.payload, decoded.payload);
    }

    #[test]
    fn msgpack_roundtrip_preserves_vectors(vec in prop::collection::vec(any::<u32>(), 0..1000)) {
        let message = Message::builder()
            .message_type(MessageType::Event)
            .payload(vec.clone())
            .build();

        let bytes = message.to_msgpack().unwrap();
        let decoded: Message<Vec<u32>> = Message::from_msgpack(&bytes).unwrap();

        prop_assert_eq!(message.payload, decoded.payload);
    }

    #[test]
    fn msgpack_roundtrip_preserves_hashmaps(
        map in prop::collection::hash_map(".*", any::<i32>(), 0..100)
    ) {
        let message = Message::builder()
            .message_type(MessageType::Request)
            .payload(map.clone())
            .build();

        let bytes = message.to_msgpack().unwrap();
        let decoded: Message<HashMap<String, i32>> = Message::from_msgpack(&bytes).unwrap();

        prop_assert_eq!(message.payload, decoded.payload);
    }

    #[test]
    fn msgpack_handles_all_message_types(
        msg_type in prop::sample::select(vec![
            MessageType::Request,
            MessageType::Response,
            MessageType::Event,
            MessageType::Error,
            MessageType::Heartbeat,
        ]),
        payload in ".*"
    ) {
        let message = Message::builder()
            .message_type(msg_type)
            .payload(payload.clone())
            .build();

        let bytes = message.to_msgpack().unwrap();
        let decoded: Message<String> = Message::from_msgpack(&bytes).unwrap();

        prop_assert_eq!(message.header.message_type, decoded.header.message_type);
        prop_assert_eq!(message.payload, decoded.payload);
    }

    #[test]
    fn msgpack_serialization_is_deterministic(s in ".*") {
        let message = Message::builder()
            .message_type(MessageType::Request)
            .payload(s)
            .build();

        let bytes1 = message.to_msgpack().unwrap();
        let bytes2 = message.to_msgpack().unwrap();

        prop_assert_eq!(bytes1, bytes2);
    }
}
```

---

## Performance Tests

### Benchmarking Suite

```rust
// benches/msgpack_benchmarks.rs

use criterion::{black_box, criterion_group, criterion_main, Criterion, BenchmarkId};
use symphony_ipc_protocol::{Message, MessageType, MessagePackSerialize};
use std::collections::HashMap;

fn benchmark_serialization_by_size(c: &mut Criterion) {
    let mut group = c.benchmark_group("msgpack_serialization");
    
    for size in [10, 100, 1000, 10000].iter() {
        let payload: String = "x".repeat(*size);
        let message = Message::builder()
            .message_type(MessageType::Request)
            .payload(payload)
            .build();

        group.bench_with_input(
            BenchmarkId::new("serialize", size),
            size,
            |b, _| {
                b.iter(|| black_box(message.to_msgpack().unwrap()))
            },
        );

        let bytes = message.to_msgpack().unwrap();
        group.bench_with_input(
            BenchmarkId::new("deserialize", size),
            size,
            |b, _| {
                b.iter(|| {
                    let decoded: Message<String> = black_box(Message::from_msgpack(&bytes).unwrap());
                    decoded
                })
            },
        );
    }
    
    group.finish();
}

fn benchmark_different_types(c: &mut Criterion) {
    let mut group = c.benchmark_group("msgpack_types");

    // String payload
    let string_msg = Message::builder()
        .message_type(MessageType::Request)
        .payload("Hello, World!".to_string())
        .build();

    group.bench_function("string_serialize", |b| {
        b.iter(|| black_box(string_msg.to_msgpack().unwrap()))
    });

    // Integer payload
    let int_msg = Message::builder()
        .message_type(MessageType::Request)
        .payload(42i64)
        .build();

    group.bench_function("integer_serialize", |b| {
        b.iter(|| black_box(int_msg.to_msgpack().unwrap()))
    });

    // Vector payload
    let vec_msg = Message::builder()
        .message_type(MessageType::Request)
        .payload(vec![1, 2, 3, 4, 5])
        .build();

    group.bench_function("vector_serialize", |b| {
        b.iter(|| black_box(vec_msg.to_msgpack().unwrap()))
    });

    // HashMap payload
    let mut map = HashMap::new();
    map.insert("key1".to_string(), "value1".to_string());
    map.insert("key2".to_string(), "value2".to_string());
    
    let map_msg = Message::builder()
        .message_type(MessageType::Request)
        .payload(map)
        .build();

    group.bench_function("hashmap_serialize", |b| {
        b.iter(|| black_box(map_msg.to_msgpack().unwrap()))
    });

    group.finish();
}

criterion_group!(benches, benchmark_serialization_by_size, benchmark_different_types);
criterion_main!(benches);
```

### Memory Usage Tests

```rust
// tests/performance/memory_tests.rs

#[cfg(test)]
mod memory_tests {
    use super::*;
    use std::alloc::{GlobalAlloc, Layout, System};
    use std::sync::atomic::{AtomicUsize, Ordering};

    struct TrackingAllocator;

    static ALLOCATED: AtomicUsize = AtomicUsize::new(0);

    unsafe impl GlobalAlloc for TrackingAllocator {
        unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
            let ret = System.alloc(layout);
            if !ret.is_null() {
                ALLOCATED.fetch_add(layout.size(), Ordering::SeqCst);
            }
            ret
        }

        unsafe fn dealloc(&self, ptr: *mut u8, layout: Layout) {
            System.dealloc(ptr, layout);
            ALLOCATED.fetch_sub(layout.size(), Ordering::SeqCst);
        }
    }

    #[global_allocator]
    static GLOBAL: TrackingAllocator = TrackingAllocator;

    #[test]
    fn test_memory_usage_bounds() {
        let initial_memory = ALLOCATED.load(Ordering::SeqCst);

        let message = Message::builder()
            .message_type(MessageType::Request)
            .payload("test payload".to_string())
            .build();

        let bytes = message.to_msgpack().unwrap();
        let peak_memory = ALLOCATED.load(Ordering::SeqCst);

        let _decoded: Message<String> = Message::from_msgpack(&bytes).unwrap();
        let final_memory = ALLOCATED.load(Ordering::SeqCst);

        let peak_usage = peak_memory - initial_memory;
        let final_usage = final_memory - initial_memory;

        // Memory usage should be reasonable
        assert!(peak_usage < 1024, "Peak memory usage too high: {} bytes", peak_usage);
        assert!(final_usage < 512, "Final memory usage too high: {} bytes", final_usage);
    }
}
```

---

## Test Execution Plan

### Continuous Integration

```yaml
# .github/workflows/msgpack_tests.yml
name: MessagePack Serialization Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        rust: [stable, beta, nightly]

    steps:
    - uses: actions/checkout@v2
    - uses: actions-rs/toolchain@v1
      with:
        toolchain: ${{ matrix.rust }}
        override: true

    - name: Run unit tests
      run: cargo test --package symphony-ipc-protocol --lib

    - name: Run integration tests
      run: cargo test --package symphony-ipc-protocol --test integration

    - name: Run property tests
      run: cargo test --package symphony-ipc-protocol --test property

    - name: Run benchmarks
      run: cargo bench --package symphony-ipc-protocol
```

### Local Testing Commands

```bash
# Run all tests
cargo test --package symphony-ipc-protocol

# Run with coverage
cargo tarpaulin --package symphony-ipc-protocol --out Html

# Run property tests with more iterations
PROPTEST_CASES=10000 cargo test --package symphony-ipc-protocol property

# Run benchmarks
cargo bench --package symphony-ipc-protocol

# Run memory tests
cargo test --package symphony-ipc-protocol memory_tests --release

# Run tests with different feature flags
cargo test --package symphony-ipc-protocol --no-default-features
cargo test --package symphony-ipc-protocol --all-features
```

---

## Success Criteria

### Test Coverage Requirements
- [ ] **Unit Test Coverage**: ≥95% line coverage
- [ ] **Integration Test Coverage**: All user stories covered
- [ ] **Property Test Coverage**: 1000+ iterations pass
- [ ] **Error Path Coverage**: All error conditions tested

### Performance Requirements
- [ ] **Serialization Speed**: <0.01ms for messages ≤1KB
- [ ] **Deserialization Speed**: <0.01ms for messages ≤1KB
- [ ] **Memory Usage**: <10% overhead during serialization
- [ ] **Binary Size**: 20-40% smaller than JSON equivalent

### Quality Requirements
- [ ] **Cross-Platform**: Tests pass on Windows, macOS, Linux
- [ ] **Rust Versions**: Tests pass on stable, beta, nightly
- [ ] **No Panics**: No panics on any valid or invalid input
- [ ] **Deterministic**: Same input always produces same output

---

*This comprehensive testing strategy ensures MessagePack serialization is robust, performant, and reliable across all Symphony use cases.*