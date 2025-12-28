# F005 - Message Bus Core - Testing

**Feature ID**: F005  
**Testing Date**: December 28, 2025  
**Testing Architecture**: High-performance message routing testing with load validation  
**Performance Targets**: <100ms unit tests, <0.1ms routing, >10,000 msg/sec throughput  

---

## Testing Philosophy

**F005 is Infrastructure** because it provides foundational message routing, correlation, and pub/sub capabilities that enable all inter-component communication in Symphony.

**Test Focus**: Verify that message routing is accurate and fast, request/response correlation is reliable, pub/sub delivery works correctly, and performance targets are met under load.

**DON'T Test**: Transport layer implementation (tested in F004), message serialization (tested in F003), or business logic using the bus.

## Feature Type Analysis

**Primary Type**: Infrastructure  
**Rationale**: F005 provides the foundational message bus that enables reliable, high-performance communication routing across all Symphony components.

**What to Test**:
- Message routing accuracy and performance
- Request/response correlation reliability
- Publish/subscribe event delivery
- Health monitoring and failure detection
- Performance under high message volume

**What NOT to Test**:
- Transport layer delivery mechanisms (tested in F004)
- Message serialization formats (tested in F003)
- Business logic using message bus (tested in domain features)

## Testing Strategy Integration

### Layer 1: Unit Tests (Rust) - <100ms
**Focus**: Message routing correctness, correlation accuracy, pub/sub delivery
- Test pattern-based routing with various message types
- Verify request/response correlation with timeouts
- Test pub/sub subscriber management and delivery
- Use real message bus with synthetic messages

### Layer 2: Integration Tests (High-Load) - <5s
**Focus**: Performance validation, concurrent access, failure scenarios
- Test message bus under high concurrent load
- Verify performance targets (routing latency, throughput)
- Test failure scenarios and recovery mechanisms
- Validate health monitoring and circuit breaker

### Layer 3: Pre-validation Tests (Performance) - <1ms
**Focus**: Routing performance, correlation speed, pub/sub latency
- Test routing latency meets <0.1ms target
- Verify correlation lookup performance
- Test pub/sub delivery latency
- Ensure performance regression detection

## Mock vs Real Decision Matrix

| Dependency | Use MOCK | Use REAL | Decision | Rationale |
|------------|----------|----------|----------|-----------|
| Message routing | | ✅ | Real | Testing actual routing performance |
| Correlation storage | | ✅ | Real | Testing actual correlation behavior |
| Pub/sub channels | | ✅ | Real | Testing actual event delivery |
| Pattern matching | | ✅ | Real | Testing actual pattern compilation |
| Health monitoring | | ✅ | Real | Testing actual failure detection |

## Test Organization

```
tests/
├── unit/                           # Single component tests
│   ├── bus_core_test.rs           # Core message bus tests
│   ├── router_test.rs             # Pattern-based routing tests
│   ├── correlation_test.rs        # Request/response correlation tests
│   ├── pubsub_test.rs             # Publish/subscribe tests
│   └── health_monitor_test.rs     # Health monitoring tests
├── integration/                    # System integration tests
│   ├── end_to_end_test.rs         # Complete message flow tests
│   ├── concurrent_access_test.rs  # Concurrent message handling
│   └── failure_recovery_test.rs   # Failure scenario testing
├── load/                          # High-volume testing
│   ├── throughput_test.rs         # Message throughput testing
│   ├── latency_test.rs            # Routing latency testing
│   └── stress_test.rs             # System stress testing
├── benchmarks/                    # Performance benchmarks
│   ├── routing_bench.rs           # Routing performance benchmarks
│   └── correlation_bench.rs      # Correlation performance benchmarks
├── fixtures/                      # Test data
│   ├── routing_patterns.json      # Route pattern test cases
│   ├── message_samples.json       # Test message examples
│   └── load_test_data.json        # High-volume test data
└── property/                      # Property-based tests
    └── routing_properties.rs      # Routing correctness properties
```

### Files to Create:
* [ ] tests/unit/bus_core_test.rs
* [ ] tests/unit/router_test.rs
* [ ] tests/unit/correlation_test.rs
* [ ] tests/unit/pubsub_test.rs
* [ ] tests/load/throughput_test.rs
* [ ] tests/benchmarks/routing_bench.rs
* [ ] tests/fixtures/routing_patterns.json

## Required Testing Tools

- **tokio::test**: Async test runtime for message bus testing
- **criterion 0.5.1**: Performance benchmarking for routing/throughput
- **proptest 1.4.0**: Property-based testing for routing correctness
- **dashmap**: Concurrent data structures for test scenarios
- **tokio::sync**: Async synchronization primitives for testing

## Acceptance Tests (ATDD Format)

### Message Routing Performance
```gherkin
Scenario: Message routing meets performance targets
  Given a message bus with registered routes
  When messages are routed through the bus
  Then routing latency is <0.1ms average
  And throughput exceeds 10,000 messages per second
  And routing accuracy is 100% for valid patterns
  And invalid routes are rejected with clear errors
```

### Request/Response Correlation
```gherkin
Scenario: Request/response correlation is reliable
  Given pending requests with correlation IDs
  When responses are received
  Then responses are matched to correct requests
  And correlation accuracy is 100%
  And timeout handling works correctly
  And orphaned correlations are cleaned up
```

### Publish/Subscribe System
```gherkin
Scenario: Pub/sub delivers events reliably
  Given subscribers registered for topics
  When events are published to topics
  Then all matching subscribers receive events
  And delivery time is <1ms to all subscribers
  And pattern matching works correctly
  And subscriber management is efficient
```

### Health Monitoring
```gherkin
Scenario: Health monitoring detects failures quickly
  Given a running message bus with endpoints
  When endpoint failures occur
  Then failures are detected within 100ms
  And circuit breaker prevents cascade failures
  And health recovery is automatic
  And metrics are collected accurately
```

## Testing Markers

Tests are organized using markers for easy execution:

- `unit`: Fast message bus component tests (<100ms total)
- `integration`: End-to-end message flow tests (<5s total)
- `performance`: Routing and throughput benchmarks
- `load`: High-volume stress testing (>10,000 msg/sec)
- `pubsub`: Publish/subscribe specific tests
- `correlation`: Request/response correlation tests
- `health`: Health monitoring and failure detection tests

### Performance Testing Requirements

**Routing Performance**:
- <0.1ms average routing latency
- >10,000 messages/second sustained throughput
- <1ms 99th percentile routing latency
- Linear scaling with route count

**Correlation Performance**:
- <0.01ms correlation lookup time
- >100,000 concurrent correlations supported
- <1ms timeout cleanup processing
- Memory usage bounded under load

**Pub/Sub Performance**:
- <1ms delivery to all subscribers
- >1,000 subscribers per topic supported
- <0.1ms pattern matching time
- Efficient subscriber management

---

**Testing Strategy Complete**: Ready for IMPLEMENTATION phase