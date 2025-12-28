# F007 - Python Bridge Foundation - Testing

**Feature ID**: F007  
**Testing Date**: December 28, 2025  
**Testing Architecture**: Cross-language integration testing with FFI performance validation  
**Performance Targets**: <100ms unit tests, <0.01ms FFI calls, 100% type conversion accuracy  

---

## Testing Philosophy

**F007 is Integration** because it integrates Rust backend components with Python-based AI systems through FFI, requiring coordination between two different programming languages and runtimes.

**Test Focus**: Verify that FFI calls work correctly and efficiently, type conversions are accurate and lossless, async integration functions properly, and subprocess management is reliable.

**DON'T Test**: Python Conductor implementation (separate feature), AI model logic (Python's responsibility), or Pit component functionality (tested separately).

## Feature Type Analysis

**Primary Type**: Integration  
**Rationale**: F007 integrates Rust and Python through FFI, requiring coordination between different language runtimes, type systems, and execution models.

**What to Test**:
- FFI call performance and correctness
- Bidirectional type conversion accuracy
- Async integration between Rust and Python
- Subprocess management and lifecycle
- Memory safety across language boundary

**What NOT to Test**:
- Python Conductor AI logic (Python team's responsibility)
- Pit component internal functionality (tested in Pit features)
- Python standard library behavior (Python's responsibility)
- PyO3 framework internals (PyO3 team's responsibility)

## Testing Strategy Integration

### Layer 1: Unit Tests (Rust + Python) - <100ms
**Focus**: FFI bindings, type conversions, error handling
- Test FFI function calls with various parameter types
- Verify type conversion accuracy and error handling
- Test async integration with simple scenarios
- Use real Python interpreter with test scripts

### Layer 2: Integration Tests (Cross-Language) - <5s
**Focus**: Complex scenarios, subprocess management, performance validation
- Test subprocess lifecycle management
- Verify async integration under load
- Test memory safety and resource cleanup
- Validate performance targets with realistic workloads

### Layer 3: Pre-validation Tests (Performance) - <1ms
**Focus**: FFI performance, type conversion speed, memory usage
- Test FFI call overhead meets <0.01ms target
- Verify type conversion performance
- Test memory usage and leak detection
- Ensure performance regression detection

## Mock vs Real Decision Matrix

| Dependency | Use MOCK | Use REAL | Decision | Rationale |
|------------|----------|----------|----------|-----------|
| Python interpreter | | ✅ | Real | Testing actual Python integration |
| PyO3 FFI calls | | ✅ | Real | Testing actual FFI performance |
| Type conversions | | ✅ | Real | Testing actual conversion accuracy |
| Async runtime | | ✅ | Real | Testing actual async integration |
| Process management | ✅ | ✅ | Both | Mock for error scenarios, real for lifecycle |

## Test Organization

```
tests/
├── unit/                           # Component tests
│   ├── ffi_bindings_test.rs       # FFI binding tests
│   ├── type_conversion_test.rs    # Type conversion tests
│   ├── async_integration_test.rs  # Async bridge tests
│   ├── error_handling_test.rs     # Cross-language error tests
│   └── subprocess_test.rs         # Process management tests
├── integration/                    # Cross-language tests
│   ├── cross_language_test.rs     # End-to-end integration tests
│   ├── performance_test.rs        # Performance validation tests
│   ├── memory_safety_test.rs      # Memory safety validation
│   └── subprocess_lifecycle_test.rs # Process lifecycle tests
├── python/                        # Python test modules
│   ├── symphony_bridge.py         # Python interface module
│   ├── test_bridge.py             # Python-side tests
│   ├── test_types.py              # Type conversion tests
│   └── test_async.py              # Async integration tests
├── benchmarks/                    # Performance benchmarks
│   ├── ffi_bench.rs               # FFI call performance
│   ├── type_conversion_bench.rs   # Type conversion performance
│   └── memory_bench.rs            # Memory usage benchmarks
├── fixtures/                      # Test data
│   ├── test_data.json             # Test data for conversions
│   ├── python_modules/            # Test Python modules
│   └── async_scenarios.json       # Async test scenarios
└── property/                      # Property-based tests
    └── type_conversion_properties.rs # Type conversion correctness
```

### Files to Create:
* [ ] tests/unit/ffi_bindings_test.rs
* [ ] tests/unit/type_conversion_test.rs
* [ ] tests/unit/async_integration_test.rs
* [ ] tests/integration/cross_language_test.rs
* [ ] tests/python/symphony_bridge.py
* [ ] tests/python/test_bridge.py
* [ ] tests/benchmarks/ffi_bench.rs
* [ ] tests/fixtures/test_data.json

## Required Testing Tools

- **pyo3 0.20.0**: Python-Rust FFI framework for testing
- **pyo3-asyncio 0.20.0**: Async integration testing
- **tokio::test**: Async test runtime
- **criterion 0.5.1**: Performance benchmarking for FFI calls
- **proptest 1.4.0**: Property-based testing for type conversions
- **tempfile 3.8.1**: Temporary files for subprocess testing

## Acceptance Tests (ATDD Format)

### FFI Performance
```gherkin
Scenario: FFI calls meet performance targets
  Given Python-Rust FFI bindings are established
  When function calls are made across the language boundary
  Then FFI call overhead is <0.01ms average
  And type conversion is lossless for all supported types
  And memory safety is maintained across calls
  And error propagation works correctly
```

### Type Conversion System
```gherkin
Scenario: Type conversions are accurate and complete
  Given various Rust and Python data types
  When types are converted bidirectionally
  Then conversion accuracy is 100% for supported types
  And round-trip conversions preserve all data
  And conversion errors are handled gracefully
  And performance is acceptable for all type sizes
```

### Async Integration
```gherkin
Scenario: Async integration works correctly
  Given Python asyncio and Rust async/await
  When async operations are performed across languages
  Then Python coroutines integrate with Rust futures
  And cancellation works correctly across boundary
  And error propagation preserves async context
  And performance overhead is minimal
```

### Subprocess Management
```gherkin
Scenario: Python subprocess management is reliable
  Given Python Conductor subprocess requirements
  When subprocess lifecycle is managed
  Then subprocess starts within Symphony binary
  And health monitoring detects subprocess issues
  And restart mechanisms work correctly
  And resource cleanup prevents leaks
```

## Testing Markers

Tests are organized using markers for easy execution:

- `unit`: Fast FFI and conversion tests (<100ms total)
- `integration`: Cross-language integration tests (<5s total)
- `performance`: FFI and conversion performance benchmarks
- `python`: Tests requiring Python interpreter
- `async`: Async integration specific tests
- `subprocess`: Process management tests
- `memory`: Memory safety and leak detection tests
- `property`: Property-based type conversion tests

### Python Environment Requirements

**Python Version Support**:
- Python 3.8+ (minimum supported version)
- Test with multiple Python versions (3.8, 3.9, 3.10, 3.11, 3.12)
- Virtual environment isolation for testing
- Python package dependencies managed

**Test Environment Setup**:
- Python interpreter available in test environment
- Required Python packages installed
- Virtual environment for test isolation
- Python path configuration for test modules

**Cross-Language Testing**:
- Rust test runner executes Python test scripts
- Python test scripts validate Rust FFI behavior
- Shared test data between Rust and Python tests
- Coordinated error reporting across languages

### Memory Safety Validation

**Memory Leak Detection**:
- Monitor memory usage during FFI calls
- Detect Python object reference leaks
- Validate Rust memory cleanup
- Test long-running scenarios for leaks

**Safety Validation**:
- Test with invalid Python objects
- Verify error handling doesn't crash
- Test concurrent access scenarios
- Validate thread safety across boundary

---

**Testing Strategy Complete**: Ready for IMPLEMENTATION phase