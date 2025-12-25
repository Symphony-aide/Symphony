# F001: Message Envelope Design - Planning

> **Parent**: Inherited from M1.1.1 (Message Envelope Design)  
> **Status**: [ ] Not Started  
> **Updated**: December 25, 2025  

---

## High-Level Implementation Strategy

This feature implements the foundational message envelope structure for Symphony's IPC communication system. The approach follows a bottom-up design pattern, starting with core data structures and building up to the complete message envelope with builder pattern for ergonomic construction.

## Technical Decision Rationale

### Architecture Decision: Generic Message Envelope
**Decision**: Use a generic `Message<T>` structure where T represents the payload type  
**Rationale**: Provides type safety while maintaining flexibility for different payload types across Symphony's components  
**Alternatives Considered**: 
- Trait-based approach with `dyn MessagePayload` - rejected due to performance overhead
- Enum-based payload - rejected due to lack of extensibility

### UUID Generation Strategy
**Decision**: Use UUID v4 (random) for MessageId generation  
**Rationale**: Provides cryptographically strong uniqueness without coordination between components  
**Alternatives Considered**:
- Sequential IDs - rejected due to coordination requirements
- UUID v1 (timestamp-based) - rejected due to MAC address privacy concerns

### Priority System Design
**Decision**: Integer-based priority with predefined constants  
**Rationale**: Allows for fine-grained priority control while providing common defaults  
**Implementation**: `Priority(i32)` with constants for common levels

## Component Breakdown

### Core Components

1. **MessageId** (`src/message/id.rs`)
   - Wraps UUID v4 for unique message identification
   - Provides Display and FromStr implementations
   - Ensures thread-safe generation

2. **MessageHeader** (`src/message/header.rs`)
   - Contains all routing and metadata information
   - Includes timestamp, TTL, priority, and version fields
   - Implements serialization traits

3. **MessageType** (`src/message/types.rs`)
   - Enum defining all supported message types
   - Extensible design for future message types
   - Clear semantic meaning for each type

4. **Priority** (`src/message/priority.rs`)
   - Ordered priority levels for message processing
   - Predefined constants for common use cases
   - Supports custom priority values

5. **Message Envelope** (`src/message/envelope.rs`)
   - Generic container for header + payload
   - Metadata support via HashMap
   - Builder pattern implementation

6. **Builder Pattern** (`src/message/builder.rs`)
   - Fluent API for message construction
   - Validation during build process
   - Default value application

### Module Structure
```
src/
├── message/
│   ├── mod.rs           # Public API exports
│   ├── id.rs            # MessageId implementation
│   ├── header.rs        # MessageHeader implementation
│   ├── types.rs         # MessageType enum
│   ├── priority.rs      # Priority implementation
│   ├── envelope.rs      # Generic Message<T>
│   └── builder.rs       # Builder pattern
├── lib.rs               # Crate root
└── error.rs             # Error types
```

## Dependency Analysis

### External Dependencies
- **uuid 1.6.1**: UUID generation and parsing
- **serde 1.0.193**: Serialization framework support
- **chrono 0.4.31**: DateTime handling with timezone support

### Internal Dependencies
**None** - This is a foundational component

### Dependency Justification
All external dependencies are mature, widely-used crates in the Rust ecosystem with excellent maintenance records and broad platform support.

## Implementation Phases

### Phase 1: Core Data Structures (Day 1, Morning)
- Implement `MessageId` with UUID generation
- Implement `MessageType` enum with all variants
- Implement `Priority` with ordering and constants
- Basic unit tests for each component

### Phase 2: Message Header (Day 1, Afternoon)
- Implement `MessageHeader` with all fields
- Add timestamp generation and TTL support
- Implement serialization traits
- Header validation logic

### Phase 3: Message Envelope (Day 2, Morning)
- Implement generic `Message<T>` structure
- Add metadata support
- Implement Clone, Debug, PartialEq traits
- Basic envelope tests

### Phase 4: Builder Pattern (Day 2, Afternoon)
- Implement fluent builder API
- Add validation during build
- Default value application
- Comprehensive integration tests

## Error Handling Strategy

### Error Types
```rust
#[derive(Debug, thiserror::Error)]
pub enum MessageError {
    #[error("Invalid message type: {0}")]
    InvalidMessageType(String),
    
    #[error("Missing required field: {0}")]
    MissingField(String),
    
    #[error("Invalid priority value: {0}")]
    InvalidPriority(i32),
    
    #[error("TTL expired")]
    TtlExpired,
}
```

### Error Handling Principles
- Use `thiserror` for structured error types
- Provide clear, actionable error messages
- Fail fast on invalid configurations
- Graceful degradation where possible

## Performance Considerations

### Memory Optimization
- Use `Box<str>` instead of `String` for immutable fields
- Minimize header size through efficient field packing
- Lazy initialization of optional fields

### CPU Optimization
- Cache UUID generation for high-frequency scenarios
- Optimize builder pattern to minimize allocations
- Use const generics where applicable

### Benchmarking Targets
- Message creation: <1μs
- Builder construction: <5μs
- Memory per message: <1KB

## Testing Strategy

### Unit Tests
- Each component tested in isolation
- Edge cases and error conditions
- Property-based testing for UUID uniqueness

### Integration Tests
- End-to-end message creation workflows
- Builder pattern validation
- Serialization round-trips

### Property Tests
```rust
proptest! {
    #[test]
    fn message_id_uniqueness(count in 1..10000usize) {
        let ids: HashSet<MessageId> = (0..count)
            .map(|_| MessageId::new())
            .collect();
        prop_assert_eq!(ids.len(), count);
    }
}
```

## Documentation Requirements

### API Documentation
- Comprehensive rustdoc for all public APIs
- Usage examples for common patterns
- Performance characteristics documentation

### Integration Examples
```rust
// Basic message creation
let message = Message::builder()
    .message_type(MessageType::Request)
    .source(EndpointId::new("conductor"))
    .target(EndpointId::new("pool-manager"))
    .payload(request_data)
    .build()?;

// Priority message
let urgent = Message::builder()
    .priority(Priority::CRITICAL)
    .message_type(MessageType::Event)
    .payload(system_alert)
    .build()?;
```

## Risk Mitigation

### Technical Risks
1. **UUID Collision**: Mitigated by using cryptographically strong UUID v4
2. **Memory Leaks**: Mitigated by comprehensive Drop implementations
3. **Serialization Issues**: Mitigated by extensive round-trip testing

### Integration Risks
3. **Thread Safety**: Mitigated by Send/Sync trait implementations

## Success Criteria

- [ ] Property tests pass with 10,0+ iterations
- [ ] Benchmarks meet performance targets
- [ ] API documentation complete with examples
- [ ] Integration tests demonstrate real-world usage patterns