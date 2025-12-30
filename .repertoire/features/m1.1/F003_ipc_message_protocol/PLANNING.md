# F003 - IPC Message Protocol - Planning

**Feature ID**: F003  
**Planning Date**: December 28, 2025  
**Estimated Effort**: 3 days  
**Implementation Priority**: 2 (After F002)  

---

## Implementation Strategy

### High-Level Approach

Implement a multi-format message protocol that supports both high-performance binary communication for internal Symphony operations and JSON-RPC for XI-editor integration. Create a unified message envelope system with schema validation and type-safe message routing.

### Technical Decisions

#### Serialization Format Strategy
**Decision**: Support both MessagePack and Bincode for binary, JSON-RPC for XI-editor  
**Rationale**: MessagePack for cross-language compatibility, Bincode for pure Rust performance, JSON-RPC for XI-editor standard compliance  
**Alternative Considered**: Single serialization format  
**Why Rejected**: Different use cases have different performance and compatibility requirements  

#### Message Envelope Design
**Decision**: Lightweight envelope with correlation ID, message type, and minimal metadata  
**Rationale**: Enables reliable routing and correlation while minimizing overhead  
**Alternative Considered**: Rich metadata envelope  
**Why Rejected**: Would add unnecessary overhead for high-performance paths  

#### Schema Validation Approach
**Decision**: Runtime validation with compile-time schema generation  
**Rationale**: Catches errors early while maintaining type safety  
**Alternative Considered**: No validation for performance  
**Why Rejected**: Reliability is critical for distributed system stability  

## Component Breakdown

### 1. Message Envelope System (`src/message.rs`)
**Responsibility**: Core message envelope types and metadata  
**Key Components**:
- MessageEnvelope: Universal message wrapper
- CorrelationId: Request/response correlation
- MessageType: Type-safe message identification
- MessageMetadata: Routing and processing hints

### 2. Serialization Abstractions (`src/serialize.rs`)
**Responsibility**: Multi-format serialization support  
**Key Components**:
- SerializationFormat enum (MessagePack, Bincode, Json)
- MessageSerializer trait for format abstraction
- Performance-optimized serialization paths
- Error handling for serialization failures

### 3. JSON-RPC Implementation (`src/jsonrpc.rs`)
**Responsibility**: JSON-RPC 2.0 compliant messaging for XI-editor  
**Key Components**:
- JsonRpcMessage: Request, response, notification types
- JsonRpcClient: Symphony → XI-editor client
- JsonRpcServer: XI-editor server implementation
- Error handling per JSON-RPC specification

### 4. XI-editor Protocol (`src/xi_protocol.rs`)
**Responsibility**: XI-editor specific message types  
**Key Components**:
- XiOperation: Buffer, file, cursor operations
- XiEvent: XI-editor → Symphony events
- XiRequest/XiResponse: Typed request/response pairs
- Buffer state synchronization messages

### 5. Schema Validation (`src/schema.rs`)
**Responsibility**: Runtime message validation  
**Key Components**:
- MessageSchema: Schema definition system
- SchemaValidator: Runtime validation engine
- ValidationError: Detailed validation failures
- Schema registry for message types

## Dependencies Analysis

| Library | Purpose | Alternative 1 | Alternative 2 | Alternative 3 | Cross-Platform | Local Env | Cloud Env | Consistency & Stability | Maintained | Ecosystem | Limitation 1 | Limitation 2 | Limitation 3 | Decision | Rationale |
|---------|---------|---------------|---------------|---------------|----------------|-----------|-----------|------------------------|------------|-----------|--------------|--------------|--------------|----------|-----------|
| rmp-serde 1.1.2 | MessagePack serialization | bincode only | serde_json only | custom binary | ✅ All platforms | ✅ Works | ✅ Works | ✅ Stable | ✅ Active (2024-11) | High | Slightly larger than bincode | Cross-language overhead | N/A | ✅ Selected | Best cross-language binary format |
| bincode 1.3.3 | High-performance Rust serialization | rmp-serde only | postcard | custom binary | ✅ All platforms | ✅ Works | ✅ Works | ✅ Very stable | ✅ Active (2024-10) | High | Rust-only format | Not human readable | Version compatibility | ✅ Selected | Fastest for pure Rust communication |
| serde_json 1.0.108 | JSON serialization for JSON-RPC | simd-json | sonic-rs | custom JSON | ✅ All platforms | ✅ Works | ✅ Works | ✅ Very stable | ✅ Active (2024-12) | High | Slower than binary | Larger message size | N/A | ✅ Selected | Standard for JSON-RPC compliance |
| uuid 1.6.1 | Correlation ID generation | nanoid | ulid | custom u64 | ✅ All platforms | ✅ Works | ✅ Works | ✅ Stable | ✅ Active (2024-11) | High | 16 bytes vs 8 bytes | String conversion overhead | N/A | ✅ Selected | Standard for distributed correlation |
| proptest 1.4.0 | Property-based testing | quickcheck | arbitrary | manual tests | ✅ All platforms | ✅ Works | ✅ Works | ✅ Stable | ✅ Active (2024-11) | High | Compile time overhead | Complex shrinking | N/A | ✅ Selected | Best for serialization round-trip testing |

#### Tauri Commands Reference

This feature provides message protocol foundations that will be used by Tauri commands:

**Future Tauri Integration Points**:
- Message serialization for frontend-backend communication
- JSON-RPC client for XI-editor integration from frontend
- Error message formatting for user display

## Implementation Phases

### Phase 1: Message Envelope System (Day 1, Morning)
- [ ] Define MessageEnvelope with correlation and routing
- [ ] Implement CorrelationId generation and management
- [ ] Create MessageType enum for type-safe routing
- [ ] Add MessageMetadata for processing hints

### Phase 2: Binary Serialization (Day 1, Afternoon)
- [ ] Implement MessagePack serialization support
- [ ] Implement Bincode serialization support
- [ ] Create SerializationFormat abstraction
- [ ] Add performance benchmarks and optimization

### Phase 3: JSON-RPC Implementation (Day 2, Morning)
- [ ] Implement JSON-RPC 2.0 message types
- [ ] Create JsonRpcClient for Symphony → XI-editor
- [ ] Add JsonRpcServer for XI-editor integration
- [ ] Implement error handling per JSON-RPC spec

### Phase 4: XI-editor Protocol (Day 2, Afternoon)
- [ ] Define XiOperation message types
- [ ] Create XiEvent types for XI-editor → Symphony
- [ ] Implement buffer state synchronization messages
- [ ] Add XI-editor specific error handling

### Phase 5: Schema Validation (Day 3, Morning)
- [ ] Create schema definition system
- [ ] Implement runtime validation engine
- [ ] Add schema registry for message types
- [ ] Create detailed validation error reporting

### Phase 6: Integration and Testing (Day 3, Afternoon)
- [ ] Integrate all components into unified protocol
- [ ] Add comprehensive test suite
- [ ] Performance benchmark all serialization paths
- [ ] Validate JSON-RPC compliance

## Testing Strategy

### Unit Testing Approach
- **Test Type**: Infrastructure Tests (serialization works correctly)
- **Focus**: Serialization round-trips, schema validation, JSON-RPC compliance
- **Mock Strategy**: Use real serialization with synthetic data
- **Performance**: <100ms per test suite

### Test Organization
```
tests/
├── unit/
│   ├── message_test.rs         # Message envelope tests
│   ├── serialize_test.rs       # Serialization format tests
│   ├── jsonrpc_test.rs         # JSON-RPC compliance tests
│   ├── xi_protocol_test.rs     # XI-editor protocol tests
│   └── schema_test.rs          # Schema validation tests
├── fixtures/
│   ├── sample_messages.json    # Test message examples
│   ├── xi_operations.json      # XI-editor operation examples
│   └── invalid_messages.json   # Validation failure test cases
├── integration/
│   └── protocol_integration_test.rs # End-to-end protocol tests
└── property/
    └── serialization_properties.rs # Property-based round-trip tests
```

### Testing Markers
- `unit`: Fast serialization and validation tests
- `integration`: Cross-component protocol tests
- `performance`: Serialization performance benchmarks
- `property`: Property-based round-trip testing
- `jsonrpc`: JSON-RPC compliance testing

---

**Planning Complete**: Ready for DESIGN phase  
**Next Phase**: DESIGN.md - Technical architecture and implementation details