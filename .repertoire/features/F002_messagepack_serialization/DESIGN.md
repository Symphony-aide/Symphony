# F002: MessagePack Serialization - Design

> **Parent**: Inherited from M1.1.2 (MessagePack Serialization)  
> **Status**: [ ] Not Started  
> **Effort**: 3 days  
> **Type**: Infrastructure  

---

## Architecture Overview

MessagePack serialization provides the binary encoding layer for Symphony's IPC protocol. It sits between the message envelope layer (F001) and the transport layer, converting structured messages to/from compact binary format for efficient network transmission.

```
┌─────────────────────┐
│   Application       │
│   Components        │
└─────────┬───────────┘
          │ Message<T>
┌─────────▼───────────┐
│ F001: Message       │ ◄── Message envelope structures
│ Envelope Design     │
└─────────┬───────────┘
          │ Message<T>
┌─────────▼───────────┐
│ F002: MessagePack   │ ◄── This feature
│ Serialization       │
└─────────┬───────────┘
          │ Vec<u8>
┌─────────▼───────────┐
│   Transport Layer   │
│   (Network/IPC)     │
└─────────────────────┘
```

---

## Core Design Principles

### 1. Trait-Based Interface
Provide a consistent serialization interface that can be implemented by any type:
```rust
pub trait MessagePackSerialize: Serialize + DeserializeOwned {
    fn to_msgpack(&self) -> Result<Vec<u8>, SerializeError>;
    fn from_msgpack(bytes: &[u8]) -> Result<Self, DeserializeError>;
}
```

### 2. Zero-Copy Where Possible
Minimize memory allocations and copying during serialization:
- Use `rmp_serde::to_vec` for direct Vec<u8> output
- Implement streaming interface for large messages
- Reuse buffers where possible

### 3. Comprehensive Error Handling
Provide detailed error information for debugging:
- Distinguish between different failure types
- Include context about what failed and why
- Map rmp-serde errors to domain-specific errors

### 4. Performance Optimization
Target sub-10ms serialization for typical messages:
- Benchmark all operations
- Optimize hot paths
- Consider custom serialization for critical types

---

## Detailed Component Design

### Core Trait Implementation

```rust
// src/serialize.rs

use serde::{Serialize, Deserialize};
use rmp_serde::{Serializer, Deserializer};
use std::io::{Write, Read};

/// Trait for MessagePack serialization
pub trait MessagePackSerialize: Serialize + DeserializeOwned {
    /// Serialize to MessagePack bytes
    fn to_msgpack(&self) -> Result<Vec<u8>, SerializeError> {
        rmp_serde::to_vec_named(self).map_err(SerializeError::from)
    }
    
    /// Deserialize from MessagePack bytes
    fn from_msgpack(bytes: &[u8]) -> Result<Self, DeserializeError> {
        rmp_serde::from_slice(bytes).map_err(DeserializeError::from)
    }
    
    /// Serialize to writer (streaming)
    fn to_msgpack_writer<W: Write>(&self, writer: W) -> Result<(), SerializeError> {
        let mut serializer = Serializer::new(writer).with_struct_map();
        self.serialize(&mut serializer).map_err(SerializeError::from)
    }
    
    /// Deserialize from reader (streaming)
    fn from_msgpack_reader<R: Read>(reader: R) -> Result<Self, DeserializeError> {
        let mut deserializer = Deserializer::new(reader);
        Self::deserialize(&mut deserializer).map_err(DeserializeError::from)
    }
}

/// Blanket implementation for all serde-compatible types
impl<T> MessagePackSerialize for T 
where 
    T: Serialize + DeserializeOwned 
{
    // Default implementations provided above
}
```

### Error Type Design

```rust
// src/error.rs

use thiserror::Error;

/// Serialization errors
#[derive(Debug, Error)]
pub enum SerializeError {
    #[error("MessagePack encoding failed: {0}")]
    Encoding(#[from] rmp_serde::encode::Error),
    
    #[error("I/O error during serialization: {0}")]
    Io(#[from] std::io::Error),
    
    #[error("Message too large: {size} bytes (max: {max_size})")]
    MessageTooLarge { size: usize, max_size: usize },
    
    #[error("Unsupported type for serialization: {type_name}")]
    UnsupportedType { type_name: &'static str },
}

/// Deserialization errors
#[derive(Debug, Error)]
pub enum DeserializeError {
    #[error("MessagePack decoding failed: {0}")]
    Decoding(#[from] rmp_serde::decode::Error),
    
    #[error("I/O error during deserialization: {0}")]
    Io(#[from] std::io::Error),
    
    #[error("Invalid message format: {reason}")]
    InvalidFormat { reason: String },
    
    #[error("Version mismatch: expected {expected}, got {actual}")]
    VersionMismatch { expected: u32, actual: u32 },
}
```

### Message Integration

```rust
// src/message_impl.rs

use crate::{Message, MessageHeader, MessageType, Priority};
use super::{MessagePackSerialize, SerializeError, DeserializeError};

// Automatic implementation for Message<T> where T: Serialize + DeserializeOwned
// This works through the blanket implementation

// Custom optimizations for frequently used types
impl MessagePackSerialize for MessageHeader {
    fn to_msgpack(&self) -> Result<Vec<u8>, SerializeError> {
        // Custom optimized serialization for headers
        let mut buf = Vec::with_capacity(128); // Pre-allocate typical header size
        rmp_serde::encode::write_named(&mut buf, self)?;
        Ok(buf)
    }
}

impl MessagePackSerialize for MessageType {
    fn to_msgpack(&self) -> Result<Vec<u8>, SerializeError> {
        // Optimize enum serialization
        let byte = match self {
            MessageType::Request => 0u8,
            MessageType::Response => 1u8,
            MessageType::Event => 2u8,
            MessageType::Error => 3u8,
            MessageType::Heartbeat => 4u8,
        };
        Ok(vec![0x00, byte]) // MessagePack positive fixint
    }
    
    fn from_msgpack(bytes: &[u8]) -> Result<Self, DeserializeError> {
        if bytes.len() != 2 || bytes[0] != 0x00 {
            return Err(DeserializeError::InvalidFormat {
                reason: "Invalid MessageType encoding".to_string()
            });
        }
        
        match bytes[1] {
            0 => Ok(MessageType::Request),
            1 => Ok(MessageType::Response),
            2 => Ok(MessageType::Event),
            3 => Ok(MessageType::Error),
            4 => Ok(MessageType::Heartbeat),
            _ => Err(DeserializeError::InvalidFormat {
                reason: format!("Unknown MessageType: {}", bytes[1])
            })
        }
    }
}
```

### Performance Optimizations

```rust
// src/optimized.rs

/// Optimized serialization for high-frequency messages
pub struct OptimizedSerializer {
    buffer: Vec<u8>,
}

impl OptimizedSerializer {
    pub fn new() -> Self {
        Self {
            buffer: Vec::with_capacity(1024), // Pre-allocate 1KB
        }
    }
    
    pub fn serialize<T: Serialize>(&mut self, value: &T) -> Result<&[u8], SerializeError> {
        self.buffer.clear();
        rmp_serde::encode::write_named(&mut self.buffer, value)?;
        Ok(&self.buffer)
    }
    
    pub fn into_bytes(self) -> Vec<u8> {
        self.buffer
    }
}

/// Buffer pool for reducing allocations
pub struct BufferPool {
    buffers: Vec<Vec<u8>>,
    max_size: usize,
}

impl BufferPool {
    pub fn new(max_size: usize) -> Self {
        Self {
            buffers: Vec::new(),
            max_size,
        }
    }
    
    pub fn get(&mut self) -> Vec<u8> {
        self.buffers.pop().unwrap_or_else(|| Vec::with_capacity(1024))
    }
    
    pub fn return_buffer(&mut self, mut buffer: Vec<u8>) {
        if self.buffers.len() < self.max_size {
            buffer.clear();
            self.buffers.push(buffer);
        }
    }
}
```

---

## API Design

### Public Interface

```rust
// Public API surface
pub use crate::serialize::MessagePackSerialize;
pub use crate::error::{SerializeError, DeserializeError};
pub use crate::optimized::{OptimizedSerializer, BufferPool};

// Convenience functions
pub fn serialize<T: Serialize>(value: &T) -> Result<Vec<u8>, SerializeError> {
    value.to_msgpack()
}

pub fn deserialize<T: DeserializeOwned>(bytes: &[u8]) -> Result<T, DeserializeError> {
    T::from_msgpack(bytes)
}

// Streaming functions
pub fn serialize_to_writer<T: Serialize, W: Write>(
    value: &T, 
    writer: W
) -> Result<(), SerializeError> {
    value.to_msgpack_writer(writer)
}

pub fn deserialize_from_reader<T: DeserializeOwned, R: Read>(
    reader: R
) -> Result<T, DeserializeError> {
    T::from_msgpack_reader(reader)
}
```

### Usage Examples

```rust
// Basic usage
let message = Message::builder()
    .message_type(MessageType::Request)
    .payload("Hello, Symphony!")
    .build();

// Serialize
let bytes = message.to_msgpack()?;

// Deserialize
let decoded: Message<String> = Message::from_msgpack(&bytes)?;

// Optimized usage for high-frequency serialization
let mut serializer = OptimizedSerializer::new();
let bytes = serializer.serialize(&message)?;

// Streaming for large messages
let mut file = File::create("message.msgpack")?;
message.to_msgpack_writer(&mut file)?;
```

---

## Data Format Specification

### MessagePack Encoding Rules

1. **Structs**: Encoded as MessagePack maps with string keys
2. **Enums**: Encoded as single-field maps (variant name → value)
3. **Collections**: Vec<T> → MessagePack array, HashMap<K,V> → MessagePack map
4. **Primitives**: Direct MessagePack encoding (integers, strings, booleans)
5. **Options**: None → MessagePack nil, Some(T) → T encoding

### Binary Format Layout

```
Message<T> Encoding:
┌─────────────────────────────────────────────────────────────┐
│ MessagePack Map (5 fields)                                  │
├─────────────────────────────────────────────────────────────┤
│ "header" → MessageHeader (nested map)                       │
│ "payload" → T (type-specific encoding)                      │
│ "metadata" → HashMap<String, Value> (map)                   │
│ "version" → u32 (positive integer)                          │
│ "checksum" → Option<u64> (nil or positive integer)          │
└─────────────────────────────────────────────────────────────┘
```

### Size Estimates

| Message Type | Typical Size | Max Size |
|--------------|--------------|----------|
| Empty Message | ~50 bytes | ~100 bytes |
| Text Message (100 chars) | ~150 bytes | ~200 bytes |
| Binary Payload (1KB) | ~1.1KB | ~1.2KB |
| Complex Nested | ~500 bytes | ~1KB |

---

## Testing Strategy

### Unit Tests
```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_basic_serialization() {
        let msg = Message::builder()
            .message_type(MessageType::Request)
            .payload("test")
            .build();
            
        let bytes = msg.to_msgpack().unwrap();
        let decoded: Message<String> = Message::from_msgpack(&bytes).unwrap();
        
        assert_eq!(msg, decoded);
    }
    
    #[test]
    fn test_error_handling() {
        let invalid_bytes = vec![0xFF, 0xFF, 0xFF];
        let result: Result<Message<String>, _> = Message::from_msgpack(&invalid_bytes);
        
        assert!(result.is_err());
        match result.unwrap_err() {
            DeserializeError::Decoding(_) => {}, // Expected
            _ => panic!("Wrong error type"),
        }
    }
}
```

### Property Tests
```rust
use proptest::prelude::*;

proptest! {
    #[test]
    fn msgpack_roundtrip_preserves_all_data(
        msg_type in prop::sample::select(vec![
            MessageType::Request, MessageType::Response, 
            MessageType::Event, MessageType::Error, MessageType::Heartbeat
        ]),
        payload in ".*",
        priority in prop::sample::select(vec![
            Priority::Low, Priority::Normal, Priority::High, Priority::Critical
        ])
    ) {
        let msg = Message::builder()
            .message_type(msg_type)
            .priority(priority)
            .payload(payload.clone())
            .build();
            
        let bytes = msg.to_msgpack().unwrap();
        let decoded: Message<String> = Message::from_msgpack(&bytes).unwrap();
        
        prop_assert_eq!(msg.header.message_type, decoded.header.message_type);
        prop_assert_eq!(msg.header.priority, decoded.header.priority);
        prop_assert_eq!(msg.payload, decoded.payload);
    }
}
```

### Performance Tests
```rust
use criterion::{black_box, criterion_group, criterion_main, Criterion};

fn benchmark_serialization(c: &mut Criterion) {
    let msg = Message::builder()
        .message_type(MessageType::Request)
        .payload("benchmark payload")
        .build();
        
    c.bench_function("msgpack_serialize", |b| {
        b.iter(|| black_box(msg.to_msgpack().unwrap()))
    });
    
    let bytes = msg.to_msgpack().unwrap();
    c.bench_function("msgpack_deserialize", |b| {
        b.iter(|| {
            let decoded: Message<String> = black_box(Message::from_msgpack(&bytes).unwrap());
            decoded
        })
    });
}

criterion_group!(benches, benchmark_serialization);
criterion_main!(benches);
```

---

## Integration Points

### With F001 (Message Envelope)
- Requires all message types to have `#[derive(Serialize, Deserialize)]`
- Uses message structures as-is, no modifications needed
- Automatic trait implementation through blanket impl

### With Transport Layer
- Provides `Vec<u8>` output suitable for network transmission
- Streaming interface for large message handling
- Error types compatible with transport error handling

### With Future Features
- **F004 Schema Validation**: Will validate serialized message format
- **F005 Message Registry**: Will store serialized message schemas
- **Compression**: Can be layered on top for additional size reduction

---

*This design provides a robust, performant MessagePack serialization layer that integrates seamlessly with Symphony's message envelope system while maintaining flexibility for future enhancements.*