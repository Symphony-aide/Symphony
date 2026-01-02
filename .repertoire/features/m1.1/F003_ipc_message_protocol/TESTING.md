# F003 - IPC Message Protocol - Testing

**Feature ID**: F003  
**Testing Date**: December 28, 2025  
**Testing Architecture**: Three-layer testing with property-based serialization verification  
**Performance Targets**: <100ms unit tests, <0.01ms serialization, <1ms JSON-RPC  

---

## Testing Philosophy

**F003 is Infrastructure** because it provides foundational message protocol abstractions that enable reliable communication across all Symphony components.

**Test Focus**: Verify that serialization formats work correctly, message envelopes preserve data integrity, JSON-RPC compliance is maintained, and performance targets are met.

**DON'T Test**: Transport layer implementation details, message routing logic, or business logic that uses these protocols.

## Source Code Coverage Table

**Purpose:** Ensure every public struct, enum, and function is tested, including error cases and enum variants.

| Source Code | Test Case |
|-------------|-----------|
| sy_ipc_protocol::MessageEnvelope::new | message_envelope_test::test_envelope_creation |
| sy_ipc_protocol::MessageType (enum variants) | message_envelope_test::test_message_type_variants |
| sy_ipc_protocol::MessagePriority (enum variants) | message_envelope_test::test_priority_variants |
| sy_ipc_protocol::CorrelationId::new | message_envelope_test::test_correlation_id_generation |
| sy_ipc_protocol::MessageMetadata | message_envelope_test::test_metadata_handling |
| sy_ipc_protocol::JsonRpcRequest::new | jsonrpc_compliance_test::test_request_creation |
| sy_ipc_protocol::JsonRpcResponse::success | jsonrpc_compliance_test::test_success_response |
| sy_ipc_protocol::JsonRpcResponse::error | jsonrpc_compliance_test::test_error_response |
| sy_ipc_protocol::JsonRpcError (enum variants) | jsonrpc_compliance_test::test_error_variants |
| sy_ipc_protocol::JsonRpcClient::send_request | jsonrpc_compliance_test::test_client_request |
| sy_ipc_protocol::MessageSerializer::serialize | serialization_test::test_serialize_all_formats |
| sy_ipc_protocol::MessageSerializer::deserialize | serialization_test::test_deserialize_all_formats |
| sy_ipc_protocol::SerializationFormat (enum variants) | serialization_test::test_format_variants |
| sy_ipc_protocol::SerializationError (enum variants) | serialization_test::test_serialization_errors |
| sy_ipc_protocol::SchemaValidator::validate | schema_validation_test::test_schema_validation |
| sy_ipc_protocol::ValidationError (enum variants) | schema_validation_test::test_validation_errors |
| sy_ipc_protocol::MessageRegistry::register | registry_test::test_message_registration |
| sy_ipc_protocol::XiOperation (enum variants) | xi_protocol_test::test_xi_operation_variants |
| sy_ipc_protocol::XiEvent (enum variants) | xi_protocol_test::test_xi_event_variants |
| sy_ipc_protocol::TextDelta::apply | xi_protocol_test::test_text_delta_operations |
| sy_ipc_protocol::ViewUpdate::new | xi_protocol_test::test_view_update_creation |

**Table Rules:**
- **Source Code Column:** Full path/namespace, struct/enum/function name, line range for functions
- **Test Case Column:** Test file name, one or more test case names  
- **Coverage Requirement:** Every public struct, enum, function must have corresponding test cases
- **Error Coverage:** All error cases and enum variants must be tested
- **Update Timing:** Table updated after source code creation (Step 2 in TDD)

## Feature Type Analysis

**Primary Type**: Infrastructure  
**Rationale**: F003 provides the foundational message protocol that enables all inter-process communication in Symphony's distributed architecture.

**What to Test**:
- Serialization round-trip accuracy for all formats
- Message envelope integrity and correlation
- JSON-RPC 2.0 specification compliance
- Schema validation effectiveness
- Performance characteristics under load

**What NOT to Test**:
- Transport layer delivery mechanisms (tested in F004)
- Message routing and correlation (tested in F005)
- Business logic using these protocols (tested in domain features)

## Testing Strategy Integration

### Layer 1: Unit Tests (Rust) - <100ms
**Focus**: Serialization accuracy, message envelope integrity, schema validation
- Test all serialization formats (MessagePack, Bincode, JSON-RPC)
- Verify message envelope correlation and metadata
- Test schema validation with valid and invalid messages
- Use proptest for property-based serialization testing

### Layer 2: Integration Tests (Rust + Protocol Integration) - <5s
**Focus**: Cross-format compatibility, JSON-RPC compliance, XI-editor protocol
- Test serialization format interoperability
- Verify JSON-RPC 2.0 specification compliance
- Test XI-editor protocol message types
- Validate error handling across protocol boundaries

### Layer 3: Pre-validation Tests (Rust) - <1ms
**Focus**: Message format validation, schema compliance, performance validation
- Test message format validation speed
- Verify schema validation performance
- Test serialization performance targets
- Ensure fast rejection of malformed messages

## Mock vs Real Decision Matrix

| Dependency | Use MOCK | Use REAL | Decision | Rationale |
|------------|----------|----------|----------|-----------|
| MessagePack serialization | | ✅ | Real | Testing actual serialization behavior |
| Bincode serialization | | ✅ | Real | Testing actual serialization behavior |
| JSON serialization | | ✅ | Real | Testing actual JSON-RPC compliance |
| UUID generation | | ✅ | Real | Testing actual correlation ID behavior |
| Schema validation | | ✅ | Real | Testing actual validation logic |

## Test Organization

```
tests/
├── unit/                           # Single component tests
│   ├── message_envelope_test.rs    # Message envelope and correlation tests
│   ├── serialization_test.rs      # Multi-format serialization tests
│   ├── jsonrpc_compliance_test.rs  # JSON-RPC 2.0 compliance tests
│   ├── xi_protocol_test.rs         # XI-editor protocol tests
│   └── schema_validation_test.rs   # Schema validation tests
├── property/                       # Property-based tests
│   ├── serialization_roundtrip.rs # Round-trip property tests
│   └── message_integrity.rs       # Message integrity properties
├── integration/                    # Component interaction tests
│   ├── format_interop_test.rs     # Cross-format compatibility tests
│   └── protocol_integration_test.rs # End-to-end protocol tests
├── fixtures/                       # Static test data
│   ├── sample_messages.json       # Valid message examples
│   ├── xi_operations.json         # XI-editor operation examples
│   ├── invalid_messages.json      # Schema validation test cases
│   └── jsonrpc_examples.json      # JSON-RPC compliance examples
└── benchmarks/                     # Performance tests
    ├── serialization_bench.rs     # Serialization performance
    └── validation_bench.rs        # Schema validation performance
```

### Files to Create:
* [ ] tests/unit/message_envelope_test.rs
* [ ] tests/unit/serialization_test.rs
* [ ] tests/unit/jsonrpc_compliance_test.rs
* [ ] tests/property/serialization_roundtrip.rs
* [ ] tests/benchmarks/serialization_bench.rs
* [ ] tests/fixtures/sample_messages.json
* [ ] tests/fixtures/jsonrpc_examples.json

## Required Testing Tools

- **proptest 1.4.0**: Property-based testing for serialization round-trips
- **criterion 0.5.1**: Performance benchmarking for serialization
- **serde_json**: JSON serialization testing
- **rmp-serde**: MessagePack serialization testing
- **bincode**: Binary serialization testing
- **tokio::test**: Async test runtime

## Acceptance Tests (ATDD Format)

### Message Envelope System
```gherkin
Scenario: Message envelopes preserve correlation and metadata
  Given a message envelope with correlation ID and metadata
  When the envelope is serialized and deserialized
  Then correlation ID is preserved exactly
  And metadata is preserved exactly
  And message type information is maintained
  And serialization completes in <0.01ms
```

### Binary Serialization Performance
```gherkin
Scenario: Binary serialization meets performance targets
  Given typical Symphony messages
  When messages are serialized using MessagePack and Bincode
  Then MessagePack serialization completes in <0.01ms
  And Bincode serialization completes in <0.01ms
  And round-trip preserves all data exactly
  And serialized size is optimized for each format
```

### JSON-RPC Compliance
```gherkin
Scenario: JSON-RPC implementation is fully compliant
  Given JSON-RPC 2.0 specification requirements
  When JSON-RPC messages are created and processed
  Then all required fields are present and correct
  And error responses follow specification format
  And request/response correlation works correctly
  And latency is <1ms for typical operations
```

## Testing Markers

Tests are organized using markers for easy execution:

- `unit`: Fast serialization and protocol tests (<100ms total)
- `integration`: Cross-format and protocol integration tests (<5s total)
- `property`: Property-based round-trip testing
- `performance`: Serialization and validation performance tests
- `jsonrpc`: JSON-RPC 2.0 compliance testing
- `xi_protocol`: XI-editor protocol specific tests

---

**Testing Strategy Complete**: Ready for IMPLEMENTATION phase