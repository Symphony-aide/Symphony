# F006 - Binary Communication Bridge - Testing

**Feature ID**: F006  
**Testing Date**: December 28, 2025  
**Testing Architecture**: XI-editor integration testing with process management validation  
**Performance Targets**: <100ms unit tests, <1ms JSON-RPC, <10ms event streaming  

---

## Testing Philosophy

**F006 is Integration** because it integrates Symphony with the XI-editor binary process, bridging two separate applications through JSON-RPC and event streaming.

**Test Focus**: Verify that JSON-RPC communication works correctly, event streaming is reliable, state synchronization maintains consistency, and process management handles failures gracefully.

**DON'T Test**: XI-editor internal functionality, text editing algorithms, or XI-editor plugin system behavior.

## Feature Type Analysis

**Primary Type**: Integration  
**Rationale**: F006 integrates Symphony with XI-editor binary, requiring coordination between two separate processes with different architectures and communication protocols.

**What to Test**:
- JSON-RPC client communication with XI-editor
- Event streaming from XI-editor to Symphony
- State synchronization between processes
- Process lifecycle management and failure recovery
- Performance under realistic text editing scenarios

**What NOT to Test**:
- XI-editor internal text editing logic (XI-editor's responsibility)
- XI-editor plugin functionality (XI-editor's responsibility)
- Transport layer implementation (tested in F004)
- Message protocol implementation (tested in F003)

## Phase-Specific Testing Strategy

### Phase 1: XI-editor Process Management Testing ✅ COMPLETE

#### Unit Tests (`tests/unit/process_manager_test.rs`)
```rust
#[cfg(test)]
mod process_manager_tests {
    use super::*;
    use tokio::time::{timeout, Duration};
    
    #[tokio::test]
    async fn test_process_startup_success() 
    
    #[tokio::test]
    async fn test_health_monitoring() 
    
    #[tokio::test]
    async fn test_automatic_restart() 
```

#### Integration Tests (`tests/integration/process_integration_test.rs`)
```rust
#[tokio::test]
async fn test_real_xi_editor_startup() 
```

### Phase 2: JSON-RPC Client Testing ✅ COMPLETE

#### Unit Tests (`tests/unit/jsonrpc_client_test.rs`)
```rust
#[cfg(test)]
mod jsonrpc_client_tests {
    use super::*;
    use tokio::io::{AsyncWriteExt, duplex};
    
    #[tokio::test]
    async fn test_request_response_correlation() 
    
    #[tokio::test]
    async fn test_xi_editor_operations() 
    
    #[tokio::test]
    async fn test_performance_monitoring()
```

#### Performance Tests (`tests/benchmarks/jsonrpc_bench.rs`)
```rust
use criterion::{black_box, criterion_group, criterion_main, Criterion};

fn benchmark_jsonrpc_latency(c: &mut Criterion) 

criterion_group!(benches, benchmark_jsonrpc_latency);
criterion_main!(benches);
```

### Phase 3: Event Streaming Testing 🔄 IN PROGRESS

#### Unit Tests (`tests/unit/event_stream_test.rs`)
```rust
#[cfg(test)]
mod event_stream_tests 
    
    #[tokio::test]
    async fn test_event_delivery_performance() 
    
    #[tokio::test]
    async fn test_malformed_event_handling() 
```

#### Integration Tests (`tests/integration/event_integration_test.rs`)
```rust
#[tokio::test]
async fn test_real_xi_editor_events() 
```

### Phase 4: State Synchronization Testing 🔄 PENDING

#### Unit Tests (`tests/unit/state_sync_test.rs`)
```rust
#[cfg(test)]
mod state_sync_tests 

    #[tokio::test]
    async fn test_file_change_detection() 
    
    #[tokio::test]
    async fn test_state_consistency() 
```

### Phase 5: XI-editor Adapter Testing 🔄 PENDING

#### Unit Tests (`tests/unit/xi_adapter_test.rs`)
```rust
#[cfg(test)]
mod xi_adapter_tests {
    use super::*;
    
    #[tokio::test]
    async fn test_text_editing_port_implementation() 
    #[tokio::test]
    async fn test_error_translation() 
    
    #[tokio::test]
    async fn test_performance_optimization() 
```

### Phase 6: Integration and Testing 🔄 PENDING

#### End-to-End Tests (`tests/integration/full_system_test.rs`)
```rust
#[tokio::test]
async fn test_complete_bridge_system() 

#[tokio::test]
async fn test_system_reliability() 
```

#### Performance Benchmarks (`tests/benchmarks/full_system_bench.rs`)
```rust
use criterion::{black_box, criterion_group, criterion_main, Criterion};

fn benchmark_end_to_end_performance(c: &mut Criterion) 

criterion_group!(benches, benchmark_end_to_end_performance);
criterion_main!(benches);
```

## Mock vs Real Decision Matrix

| Dependency | Use MOCK | Use REAL | Decision | Rationale |
|------------|----------|----------|----------|-----------|
| XI-editor process | ✅ | ✅ | Both | Mock for unit tests, real for integration |
| JSON-RPC responses | ✅ | ✅ | Both | Mock for fast tests, real for validation |
| File system | | ✅ | Real | Testing actual file operations |
| Process management | ✅ | ✅ | Both | Mock for error scenarios, real for lifecycle |
| Event streaming | ✅ | ✅ | Both | Mock for parsing, real for integration |

## Test Organization

```
tests/
├── unit/                           # Component tests with mocks
│   ├── jsonrpc_client_test.rs     # JSON-RPC client tests
│   ├── event_stream_test.rs       # Event streaming tests
│   ├── state_sync_test.rs         # State synchronization tests
│   ├── process_manager_test.rs    # Process management tests
│   └── xi_adapter_test.rs         # XI-editor adapter tests
├── integration/                    # Real XI-editor tests
│   ├── xi_editor_integration_test.rs # Full XI-editor integration
│   ├── performance_test.rs        # Performance validation
│   ├── failure_recovery_test.rs   # Process failure scenarios
│   └── compatibility_test.rs      # XI-editor version compatibility
├── mocks/                         # Mock implementations
│   ├── mock_xi_editor.rs          # Mock XI-editor process
│   ├── mock_responses.json        # Mock JSON-RPC responses
│   └── mock_events.json           # Mock XI-editor events
├── fixtures/                      # Test data
│   ├── test_files/                # Test text files
│   ├── xi_operations.json         # XI-editor operation examples
│   └── event_samples.json         # Event stream examples
└── benchmarks/                    # Performance benchmarks
    ├── jsonrpc_bench.rs           # JSON-RPC performance
    └── event_stream_bench.rs      # Event streaming performance
```

### Files to Create:
* [ ] tests/unit/jsonrpc_client_test.rs
* [ ] tests/unit/event_stream_test.rs
* [ ] tests/unit/state_sync_test.rs
* [ ] tests/integration/xi_editor_integration_test.rs
* [ ] tests/mocks/mock_xi_editor.rs
* [ ] tests/fixtures/xi_operations.json
* [ ] tests/benchmarks/jsonrpc_bench.rs

## Required Testing Tools

- **tokio::test**: Async test runtime for process and I/O testing
- **tokio::process**: Process management for XI-editor testing
- **criterion 0.5.1**: Performance benchmarking for communication
- **tempfile 3.8.1**: Temporary files for text editing tests
- **serde_json**: JSON-RPC message parsing and validation
- **mockall 0.12.1**: Mock generation for XI-editor process

## Acceptance Tests (ATDD Format)

### JSON-RPC Performance
```gherkin
Scenario: JSON-RPC communication meets performance targets
  Given a running XI-editor process
  When JSON-RPC requests are sent
  Then response latency is <1ms average
  And JSON-RPC 2.0 compliance is maintained
  And error handling works correctly
  And request/response correlation is accurate
```

### Event Streaming Reliability
```gherkin
Scenario: Event streaming delivers updates reliably
  Given XI-editor is generating events
  When events are streamed to Symphony
  Then event delivery time is <10ms average
  And event ordering is preserved
  And no events are lost under normal conditions
  And event parsing handles all XI-editor event types
```

### State Synchronization
```gherkin
Scenario: State synchronization maintains consistency
  Given Symphony and XI-editor are running
  When file or buffer changes occur
  Then state consistency is maintained within 10ms
  And conflict resolution works correctly
  And external file changes are detected
  And buffer metadata cache is accurate
```

### Process Lifecycle Management
```gherkin
Scenario: Process management handles failures gracefully
  Given XI-editor process is managed by Symphony
  When process failures occur
  Then automatic restart completes within 5 seconds
  And state recovery preserves user data
  And health monitoring detects failures quickly
  And resource cleanup prevents leaks
```

## Testing Markers

Tests are organized using markers for easy execution:

- `unit`: Fast component tests with mocks (<100ms total)
- `integration`: Real XI-editor integration tests (<5s total)
- `performance`: Communication performance benchmarks
- `xi_editor`: Tests requiring XI-editor binary
- `process`: Process management and lifecycle tests
- `jsonrpc`: JSON-RPC protocol specific tests
- `events`: Event streaming specific tests
- `state_sync`: State synchronization tests

### XI-editor Integration Requirements

**XI-editor Binary Requirements**:
- XI-editor binary must be available in test environment
- Compatible XI-editor version (tested with specific version)
- Proper XI-editor configuration for testing
- Test isolation to prevent interference

**Test Environment Setup**:
- Temporary directories for XI-editor files
- Isolated XI-editor configuration
- Process cleanup after test completion
- Resource monitoring during tests

**Compatibility Testing**:
- Test with multiple XI-editor versions
- Verify JSON-RPC protocol compatibility
- Test event format compatibility
- Validate performance across versions

---

**Testing Strategy Complete**: Ready for IMPLEMENTATION phase