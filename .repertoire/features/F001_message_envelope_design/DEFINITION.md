# F001: Message Envelope Design

> **Parent**: Inherited from M1.1.1 (Message Envelope Design)  
> **Status**: [ ] Not Started  
> **Effort**: 2 days  
> **Type**: Infrastructure  

---

## Problem Statement

Symphony's AIDE layer requires a robust message envelope structure for all IPC communication between components. Currently, there is no standardized message format, which prevents the implementation of the IPC protocol and serialization system that forms the foundation of Symphony's communication backbone.

## Solution Approach

Design and implement a comprehensive message envelope structure that includes:
- Unique message identification with UUID generation
- Complete message header with routing and metadata fields
- Message type enumeration for different communication patterns
- Priority levels for message routing and processing
- Generic message envelope that can wrap any payload type
- Builder pattern for ergonomic message construction

## Dependencies Analysis

### External Dependencies

| Library | Purpose | Alternative 1 | Alternative 2 | Alternative 3 | Cross-Platform | Local Env | Cloud Env | Consistency & Stability | Maintained | Ecosystem | Limitation 1 | Limitation 2 | Limitation 3 | Decision | Rationale |
|---------|---------|---------------|---------------|---------------|----------------|-----------|-----------|------------------------|------------|-----------|--------------|--------------|--------------|----------|-----------|
| uuid 1.6.1 | Generate unique message IDs | nanoid | ulid | custom UUID | ✅ All platforms | ✅ Works | ✅ Works | ✅ Deterministic | ✅ Active (2024-11) | High | N/A | N/A | N/A | ✅ Selected | Industry standard, RFC 4122 compliant |
| serde 1.0.193 | Serialization framework | bincode only | manual serialization | N/A | ✅ All platforms | ✅ Works | ✅ Works | ✅ Deterministic | ✅ Active (2024-12) | High | N/A | N/A | N/A | ✅ Selected | De facto standard for Rust serialization |
| chrono 0.4.31 | DateTime handling | std::time::SystemTime | time crate | N/A | ✅ All platforms | ✅ Works | ✅ Works | ✅ Deterministic | ✅ Active (2024-10) | High | Larger binary size | More complex API | N/A | ✅ Selected | Rich timezone support, widely used |

**Notes**:
- ✅ = Works correctly / Yes
- ❌ = Does not work / No / Critical issue
- ⚠️ = Partial support / Works with caveats
- N/A = Not applicable

### Internal Dependencies

**Requires**: None (foundational)  
**Enables**: 
- F002: MessagePack Serialization
- F003: Bincode Serialization  
- F004: Schema Validation
- F005: Message Registry

## Acceptance Criteria

1. **Message Structure Completeness**: All message types (Request, Response, Event, Error, Heartbeat) must be representable in the envelope structure
2. **Builder API Ergonomics**: Message construction using the builder pattern must be intuitive and chainable
3. **Type Safety**: Messages must implement `Clone`, `Debug`, `PartialEq` traits for testing and debugging
4. **UUID Generation**: MessageId must generate unique UUIDs for each message instance
5. **Priority Ordering**: Priority enum must support proper ordering (Critical > High > Normal > Low > Background)
6. **Metadata Support**: Message envelope must support arbitrary metadata as HashMap<String, Value>
7. **Timestamp Precision**: Message timestamps must be accurate to millisecond precision

## Success Metrics

- Message creation latency: <0.001ms (1 microsecond)
- Memory footprint per message: <1KB for typical payloads
- Builder API requires <5 method calls for complete message
- UUID collision probability: <1 in 10^18 (standard UUID v4)
- All acceptance criteria tests pass with 100% success rate

## User Stories

### Story 1: Core Message Creation
**As a** Symphony IPC component  
**I want to** create messages with unique IDs and routing information  
**So that** I can communicate reliably with other components  

**Example**:
```rust
let message = Message::builder()
    .message_type(MessageType::Request)
    .source(EndpointId::new("conductor"))
    .target(EndpointId::new("pool-manager"))
    .payload(request_data)
    .build();
```

### Story 2: Priority-Based Routing
**As a** message router  
**I want to** process messages based on their priority levels  
**So that** critical operations are handled before lower-priority tasks  

**Example**:
```rust
let critical_message = Message::builder()
    .priority(Priority::CRITICAL)
    .message_type(MessageType::Request)
    .payload(shutdown_request)
    .build();
```

### Story 3: Request-Response Correlation
**As a** request sender  
**I want to** correlate responses with my original requests  
**So that** I can match asynchronous responses to the correct request context  

**Example**:
```rust
let request = Message::builder()
    .message_type(MessageType::Request)
    .build();

let response = Message::builder()
    .message_type(MessageType::Response)
    .correlation_id(request.header.id)
    .build();
```

## Timeline

- **Day 1**: Design and implement core message structures (MessageId, MessageHeader, MessageType, Priority)
- **Day 2**: Implement generic Message envelope, builder pattern, and comprehensive unit tests

## Out of Scope

- Message serialization (handled by F002, F003)
- Message validation (handled by F004)
- Message routing logic (handled by message bus components)
- Network transport (handled by transport layer)
- Message persistence (handled by storage components)

## Risk Assessment

**Low Risk**: This is a foundational data structure with no external dependencies beyond standard Rust ecosystem crates. The design is based on well-established messaging patterns.

**Mitigation**: Comprehensive unit tests and property-based testing will ensure correctness and prevent regressions.