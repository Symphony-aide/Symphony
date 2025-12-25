# Symphony IPC Protocol

> **Status**: ✅ Production Ready (BIF Approved)  
> **Version**: 1.0  
> **Crate**: `symphony-ipc-protocol`  
> **Last Updated**: December 25, 2025

---

## Overview

The Symphony IPC Protocol provides the foundational message structures that enable reliable communication between Symphony's components through a standardized envelope format. This protocol serves as the backbone for all inter-process communication within Symphony's AI-First Development Environment.

## Core Architecture

### Message Envelope Design

Symphony uses a generic `Message<T>` structure that provides type safety while maintaining flexibility for different payload types across Symphony's components:

```rust
pub struct Message<T> {
    pub header: MessageHeader,
    pub payload: T,
    pub metadata: HashMap<String, serde_json::Value>,
}
```

### Key Components

1. **MessageId**: UUID v4-based unique message identification
2. **MessageHeader**: Routing and metadata information
3. **MessageType**: Enumeration of supported message types
4. **Priority**: Ordered message processing levels
5. **Message Envelope**: Generic container for header + payload
6. **Builder Pattern**: Fluent API for message construction

## Message Types

The protocol supports five core message types:

| Type | Description | Expects Response |
|------|-------------|------------------|
| `Request` | Request expecting a response | ✅ Yes |
| `Response` | Response to a request | ❌ No |
| `Event` | One-way event notification | ❌ No |
| `Error` | Error notification | ❌ No |
| `Heartbeat` | Keep-alive heartbeat | ❌ No |

## Priority System

Messages are processed according to priority levels:

| Priority | Level | Use Case |
|----------|-------|----------|
| `CRITICAL` | 1000 | System emergencies, shutdown signals |
| `HIGH` | 100 | User interactions, urgent operations |
| `NORMAL` | 0 | Standard operations (default) |
| `LOW` | -100 | Background tasks, cleanup |
| `BACKGROUND` | -1000 | Maintenance, optimization |

Custom priority levels are supported via `Priority::custom(level)`.

## Usage Examples

### Basic Message Creation

```rust
use symphony_ipc_protocol::*;

let message = Message::builder()
    .message_type(MessageType::Request)
    .source(EndpointId::new("conductor"))
    .target(EndpointId::new("pool-manager"))
    .payload("Hello, World!")
    .build()?;
```

### Priority Message

```rust
let urgent = Message::builder()
    .priority(Priority::CRITICAL)
    .message_type(MessageType::Event)
    .source(EndpointId::new("system"))
    .target(EndpointId::new("all"))
    .payload(SystemAlert::Shutdown)
    .build()?;
```

### Request/Response Pairing

```rust
// Request
let request = Message::builder()
    .message_type(MessageType::Request)
    .source(EndpointId::new("client"))
    .target(EndpointId::new("server"))
    .payload(GetUserRequest { id: 123 })
    .build()?;

// Response (using correlation ID)
let response = Message::builder()
    .message_type(MessageType::Response)
    .source(EndpointId::new("server"))
    .target(EndpointId::new("client"))
    .correlation_id(request.header.id)
    .payload(GetUserResponse { user: user_data })
    .build()?;
```

### TTL and Metadata

```rust
use std::time::Duration;

let message = Message::builder()
    .message_type(MessageType::Event)
    .source(EndpointId::new("sensor"))
    .target(EndpointId::new("processor"))
    .ttl(Duration::from_secs(30))  // Expire after 30 seconds
    .metadata("sensor_type", serde_json::Value::String("temperature".to_string()))
    .metadata("location", serde_json::Value::String("server_room".to_string()))
    .payload(TemperatureReading { celsius: 23.5 })
    .build()?;
```

## Serialization

The protocol currently supports JSON serialization with plans for binary formats:

```rust
// Serialize to bytes
let bytes = message.to_bytes()?;

// Deserialize from bytes
let message: Message<MyPayload> = Message::from_bytes(&bytes)?;
```

## Error Handling

Comprehensive error handling with categorization:

```rust
pub enum MessageError {
    InvalidMessageType(String),
    MissingField(&'static str),
    InvalidEndpointId(String),
    InvalidPriority(i32),
    TtlExpired,
    InvalidProtocolVersion { major: u16, minor: u16 },
    Serialization(serde_json::Error),
    UuidParse(uuid::Error),
    InvalidMetadataKey(String),
}
```

Each error provides:
- **Recoverability**: `is_recoverable()` method
- **Categorization**: `category()` for metrics and logging
- **Context**: Detailed error messages with relevant data

## Performance Characteristics

Based on benchmarks and BIF evaluation:

| Operation | Performance | Notes |
|-----------|-------------|-------|
| Message creation | <1μs | UUID generation overhead |
| Builder construction | <5μs | HashMap pre-allocation |
| Memory per message | <1KB | Efficient structure |
| UUID generation | ~100ns | Cryptographically strong |
| JSON serialization | Acceptable | Main performance consideration |

## Protocol Versioning

The protocol uses semantic versioning with compatibility checking:

```rust
pub struct ProtocolVersion {
    pub major: u16,
    pub minor: u16,
}

impl ProtocolVersion {
    pub const CURRENT: ProtocolVersion = ProtocolVersion { major: 1, minor: 0 };
    
    pub fn is_compatible(&self, other: &ProtocolVersion) -> bool {
        self.major == other.major  // Compatible if major versions match
    }
}
```

## Integration Points

### With XI-editor Foundation
- Builds on XI-editor's JSON-RPC communication patterns
- Maintains sub-16ms operation targets
- Leverages existing async infrastructure

### With Future Symphony Components
- **The Conductor**: Python orchestration engine communication
- **The Pit**: Infrastructure extension messaging
- **Orchestra Kit**: Extension ecosystem communication
- **Transport Layer**: Unix sockets, Named pipes integration

## Quality Assurance

### BIF Evaluation Results
- **Feature Completeness**: 100% (11/11 features complete)
- **Code Quality**: Excellent (91% Excellent+ ratings)
- **Documentation**: Excellent (comprehensive rustdoc)
- **Reliability**: High (robust error handling)
- **Performance**: Good (efficient implementation)
- **Integration**: Full (highly extensible design)
- **Maintenance**: High (clean, minimal dependencies)
- **Production Readiness**: ✅ **APPROVED**

### Test Coverage
- **Unit Tests**: All components tested in isolation
- **Acceptance Tests**: End-to-end message workflows
- **Property Tests**: UUID uniqueness, serialization round-trips
- **Benchmarks**: Performance regression detection

## Future Enhancements

### Planned Features (Upcoming)
1. **Binary Serialization** (F002, F003)
   - MessagePack for performance
   - Bincode for minimal overhead
2. **Schema Validation** (F004)
   - Payload validation against schemas
   - Version compatibility checking
3. **Message Registry** (F005)
   - Centralized message type management
   - Runtime schema discovery

### Long-term Roadmap
- Message compression for large payloads
- Message pooling for high-throughput scenarios
- Advanced routing and load balancing
- Distributed message tracing

## Dependencies

### External Dependencies
- **uuid 1.6.1**: UUID generation and parsing
- **serde 1.0.193**: Serialization framework
- **chrono 0.4.31**: DateTime handling with timezone support
- **thiserror 1.0**: Structured error types

### Development Dependencies
- **proptest 1.4**: Property-based testing
- **tokio-test 0.4**: Async test utilities

All dependencies are mature, widely-used crates with excellent maintenance records and broad platform support.

## API Reference

For complete API documentation, see the generated rustdoc:

```bash
cargo doc --open -p symphony-ipc-protocol
```

## Contributing

The IPC protocol is foundational to Symphony's architecture. Changes should:

1. Maintain backward compatibility
2. Include comprehensive tests
3. Update documentation
4. Pass BIF evaluation
5. Consider performance implications

---

**This protocol serves as the foundation for all Symphony component communication, enabling the AI-First Development Environment's distributed architecture.**