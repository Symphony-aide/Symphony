# F001: Message Envelope Design - Technical Design

> **Parent**: Inherited from M1.1.1 (Message Envelope Design)  
> **Status**: [ ] Not Started  
> **Updated**: December 25, 2025  

---

## System Architecture

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Message Envelope                         │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │  MessageHeader  │    │         Payload<T>              │ │
│  │                 │    │                                 │ │
│  │ • id            │    │ • Generic type T                │ │
│  │ • correlation   │    │ • Serializable                  │ │
│  │ • type          │    │ • Application data              │ │
│  │ • source        │    │                                 │ │
│  │ • target        │    │                                 │ │
│  │ • timestamp     │    │                                 │ │
│  │ • ttl           │    │                                 │ │
│  │ • priority      │    │                                 │ │
│  │ • version       │    │                                 │ │
│  └─────────────────┘    └─────────────────────────────────┘ │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Metadata HashMap                           │ │
│  │         <String, serde_json::Value>                     │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Module Design

### Core Data Structures

#### MessageId
```rust
/// Unique identifier for messages using UUID v4
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct MessageId(Uuid);

impl MessageId {
    /// Generate a new unique message ID
    pub fn new() -> Self;
    
    /// Create from existing UUID
    pub fn from_uuid(uuid: Uuid) -> Self;
    
    /// Get the underlying UUID
    pub fn as_uuid(&self) -> &Uuid;
    
    /// Convert to string representation
    pub fn to_string(&self) -> String;
    
    /// Parse from string
    pub fn from_str(s: &str) -> Result<Self, MessageError>;
}

impl Default for MessageId {
    fn default() -> Self { Self::new() }
}

impl Display for MessageId {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result;
}

impl FromStr for MessageId {
    type Err = MessageError;
    fn from_str(s: &str) -> Result<Self, Self::Err>;
}
```

#### EndpointId
```rust
/// Identifier for message endpoints
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct EndpointId(String);

impl EndpointId {
    pub fn new(id: impl Into<String>) -> Self;
    pub fn as_str(&self) -> &str;
}

impl Display for EndpointId {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result;
}
```

#### MessageType
```rust
/// Types of messages supported by the protocol
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum MessageType {
    /// Request expecting a response
    Request,
    /// Response to a request
    Response,
    /// One-way event notification
    Event,
    /// Error notification
    Error,
    /// Keep-alive heartbeat
    Heartbeat,
}

impl MessageType {
    /// Check if this message type expects a response
    pub fn expects_response(&self) -> bool;
    
    /// Get human-readable description
    pub fn description(&self) -> &'static str;
}

impl Display for MessageType {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result;
}
```

#### Priority
```rust
/// Message priority for routing and processing order
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
pub struct Priority(pub i32);

impl Priority {
    /// Critical system messages (highest priority)
    pub const CRITICAL: Priority = Priority(1000);
    /// High priority messages
    pub const HIGH: Priority = Priority(100);
    /// Normal priority messages (default)
    pub const NORMAL: Priority = Priority(0);
    /// Low priority messages
    pub const LOW: Priority = Priority(-100);
    /// Background processing messages (lowest priority)
    pub const BACKGROUND: Priority = Priority(-1000);
    
    /// Create custom priority level
    pub fn custom(level: i32) -> Self;
    
    /// Get priority level as integer
    pub fn level(&self) -> i32;
    
    /// Check if this is a system priority level
    pub fn is_system_level(&self) -> bool;
}

impl Default for Priority {
    fn default() -> Self { Self::NORMAL }
}

impl Display for Priority {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result;
}
```

#### ProtocolVersion
```rust
/// Protocol version for compatibility checking
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
pub struct ProtocolVersion {
    pub major: u16,
    pub minor: u16,
}

impl ProtocolVersion {
    /// Current protocol version
    pub const CURRENT: ProtocolVersion = ProtocolVersion { major: 1, minor: 0 };
    
    /// Create new version
    pub fn new(major: u16, minor: u16) -> Self;
    
    /// Check compatibility with another version
    pub fn is_compatible(&self, other: &ProtocolVersion) -> bool;
}

impl Default for ProtocolVersion {
    fn default() -> Self { Self::CURRENT }
}

impl Display for ProtocolVersion {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result;
}
```

#### MessageHeader
```rust
/// Message header containing routing and metadata information
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct MessageHeader {
    /// Unique message identifier
    pub id: MessageId,
    /// Optional correlation ID for request/response pairing
    pub correlation_id: Option<MessageId>,
    /// Type of message
    pub message_type: MessageType,
    /// Source endpoint identifier
    pub source: EndpointId,
    /// Target endpoint identifier
    pub target: EndpointId,
    /// Message creation timestamp
    pub timestamp: DateTime<Utc>,
    /// Optional time-to-live duration
    pub ttl: Option<Duration>,
    /// Message priority for routing
    pub priority: Priority,
    /// Protocol version
    pub version: ProtocolVersion,
}

impl MessageHeader {
    /// Create new header with required fields
    pub fn new(
        message_type: MessageType,
        source: EndpointId,
        target: EndpointId,
    ) -> Self;
    
    /// Check if message has expired based on TTL
    pub fn is_expired(&self) -> bool;
    
    /// Get message age
    pub fn age(&self) -> Duration;
    
    /// Set correlation ID for request/response pairing
    pub fn with_correlation_id(mut self, id: MessageId) -> Self;
    
    /// Set TTL for message expiration
    pub fn with_ttl(mut self, ttl: Duration) -> Self;
    
    /// Set message priority
    pub fn with_priority(mut self, priority: Priority) -> Self;
}
```

#### Message Envelope
```rust
/// Complete message envelope containing header, payload, and metadata
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Message<T> {
    /// Message header with routing information
    pub header: MessageHeader,
    /// Message payload (generic type)
    pub payload: T,
    /// Optional metadata as key-value pairs
    pub metadata: HashMap<String, Value>,
}

impl<T> Message<T> {
    /// Create new message with header and payload
    pub fn new(header: MessageHeader, payload: T) -> Self;
    
    /// Create message builder
    pub fn builder() -> MessageBuilder<T>;
    
    /// Add metadata entry
    pub fn with_metadata(mut self, key: impl Into<String>, value: Value) -> Self;
    
    /// Get metadata value
    pub fn get_metadata(&self, key: &str) -> Option<&Value>;
    
    /// Check if message has expired
    pub fn is_expired(&self) -> bool;
    
    /// Get message age
    pub fn age(&self) -> Duration;
    
    /// Transform payload type
    pub fn map_payload<U, F>(self, f: F) -> Message<U>
    where
        F: FnOnce(T) -> U;
}

impl<T> Message<T>
where
    T: Serialize + DeserializeOwned,
{
    /// Serialize message to bytes (requires serialization feature)
    pub fn to_bytes(&self) -> Result<Vec<u8>, MessageError>;
    
    /// Deserialize message from bytes (requires serialization feature)
    pub fn from_bytes(bytes: &[u8]) -> Result<Self, MessageError>;
}
```

### Builder Pattern Implementation

#### MessageBuilder
```rust
/// Fluent builder for constructing messages
#[derive(Debug)]
pub struct MessageBuilder<T> {
    message_type: Option<MessageType>,
    source: Option<EndpointId>,
    target: Option<EndpointId>,
    correlation_id: Option<MessageId>,
    ttl: Option<Duration>,
    priority: Priority,
    version: ProtocolVersion,
    payload: Option<T>,
    metadata: HashMap<String, Value>,
}

impl<T> MessageBuilder<T> {
    /// Create new builder
    pub fn new() -> Self;
    
    /// Set message type
    pub fn message_type(mut self, msg_type: MessageType) -> Self;
    
    /// Set source endpoint
    pub fn source(mut self, source: impl Into<EndpointId>) -> Self;
    
    /// Set target endpoint
    pub fn target(mut self, target: impl Into<EndpointId>) -> Self;
    
    /// Set correlation ID
    pub fn correlation_id(mut self, id: MessageId) -> Self;
    
    /// Set TTL
    pub fn ttl(mut self, ttl: Duration) -> Self;
    
    /// Set priority
    pub fn priority(mut self, priority: Priority) -> Self;
    
    /// Set protocol version
    pub fn version(mut self, version: ProtocolVersion) -> Self;
    
    /// Set payload
    pub fn payload(mut self, payload: T) -> Self;
    
    /// Add metadata entry
    pub fn metadata(mut self, key: impl Into<String>, value: Value) -> Self;
    
    /// Build the message
    pub fn build(self) -> Result<Message<T>, MessageError>;
}

impl<T> Default for MessageBuilder<T> {
    fn default() -> Self { Self::new() }
}
```

## Data Flow Diagrams

### Message Creation Flow
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │───▶│ MessageBuilder  │───▶│    Message<T>   │
│                 │    │                 │    │                 │
│ • Payload       │    │ • Validation    │    │ • Header        │
│ • Routing Info  │    │ • Defaults      │    │ • Payload       │
│ • Metadata      │    │ • ID Generation │    │ • Metadata      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Message Processing Flow
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Incoming Bytes │───▶│   Deserialize   │───▶│  Message<T>     │
│                 │    │                 │    │                 │
│ • Raw Data      │    │ • Parse Header  │    │ • Validated     │
│ • Network/IPC   │    │ • Parse Payload │    │ • Typed         │
│                 │    │ • Validate      │    │ • Ready         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Response      │◀───│   Processing    │◀───│   Validation    │
│                 │    │                 │    │                 │
│ • Result        │    │ • Business      │    │ • TTL Check     │
│ • Correlation   │    │   Logic         │    │ • Type Check    │
│ • Metadata      │    │ • Transform     │    │ • Auth Check    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Error Handling Design

### Error Types
```rust
/// Errors that can occur during message operations
#[derive(Debug, thiserror::Error)]
pub enum MessageError {
    #[error("Invalid message type: {0}")]
    InvalidMessageType(String),
    
    #[error("Missing required field: {0}")]
    MissingField(&'static str),
    
    #[error("Invalid endpoint ID: {0}")]
    InvalidEndpointId(String),
    
    #[error("Invalid priority value: {0}")]
    InvalidPriority(i32),
    
    #[error("Message has expired (TTL exceeded)")]
    TtlExpired,
    
    #[error("Invalid protocol version: {major}.{minor}")]
    InvalidProtocolVersion { major: u16, minor: u16 },
    
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
    
    #[error("UUID parsing error: {0}")]
    UuidParse(#[from] uuid::Error),
    
    #[error("Invalid metadata key: {0}")]
    InvalidMetadataKey(String),
}

impl MessageError {
    /// Check if error is recoverable
    pub fn is_recoverable(&self) -> bool;
    
    /// Get error category for metrics
    pub fn category(&self) -> &'static str;
}
```

## Performance Characteristics

### Memory Layout
- MessageHeader: ~128 bytes (fixed size)
- MessageId: 16 bytes (UUID)
- EndpointId: Variable (String length + 24 bytes overhead)
- Priority: 4 bytes (i32)
- Metadata: Variable (HashMap overhead + entries)

### Time Complexity
- Message creation: O(1)
- Builder validation: O(n) where n = number of metadata entries
- Serialization: O(n) where n = payload size
- Deserialization: O(n) where n = message size

### Optimization Strategies
1. **String Interning**: Cache common endpoint IDs
2. **Metadata Pooling**: Reuse HashMap allocations
3. **Builder Reuse**: Pool builder instances
4. **Lazy Validation**: Defer expensive checks until build()

## Database Schema (if applicable)

Not applicable - this is an in-memory data structure.

## Security Considerations

### Message Integrity
- UUIDs provide collision resistance (2^122 possible values)
- Timestamps prevent replay attacks when combined with TTL
- Protocol versioning prevents compatibility attacks

### Information Disclosure
- Endpoint IDs should not contain sensitive information
- Metadata should be sanitized before logging
- Correlation IDs should not be predictable

### Denial of Service Prevention
- TTL prevents message accumulation
- Priority system prevents low-priority flooding
- Metadata size limits prevent memory exhaustion

## Integration Points

### Upstream Dependencies
- **uuid**: UUID generation and parsing
- **serde**: Serialization framework
- **chrono**: DateTime handling

### Downstream Consumers
- **IPC Transport Layer**: Uses Message<T> for communication
- **Message Bus**: Routes messages based on header information
- **Serialization Layer**: Converts messages to/from bytes
- **Validation Layer**: Validates message structure and content

### API Contracts
```rust
// Required traits for payload types
pub trait MessagePayload: Serialize + DeserializeOwned + Send + Sync {}

// Automatic implementation for qualifying types
impl<T> MessagePayload for T 
where 
    T: Serialize + DeserializeOwned + Send + Sync 
{}
```

## Testing Strategy

### Unit Test Coverage
- MessageId uniqueness and parsing
- MessageType behavior and serialization
- Priority ordering and comparison
- MessageHeader creation and validation
- Message envelope construction
- Builder pattern validation
- Error handling scenarios

### Property-Based Tests
```rust
proptest! {
    #[test]
    fn message_id_uniqueness(count in 1..10000usize) {
        let ids: HashSet<MessageId> = (0..count)
            .map(|_| MessageId::new())
            .collect();
        prop_assert_eq!(ids.len(), count);
    }
    
    #[test]
    fn priority_ordering(p1 in any::<i32>(), p2 in any::<i32>()) {
        let priority1 = Priority::custom(p1);
        let priority2 = Priority::custom(p2);
        prop_assert_eq!(priority1.cmp(&priority2), p1.cmp(&p2));
    }
    
    #[test]
    fn message_roundtrip(msg in arb_message()) {
        let bytes = msg.to_bytes().unwrap();
        let decoded = Message::from_bytes(&bytes).unwrap();
        prop_assert_eq!(msg, decoded);
    }
}
```

### Integration Tests
- End-to-end message creation and processing
- Serialization compatibility across versions
- Builder pattern edge cases
- Performance benchmarks