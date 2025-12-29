//! IPC Message Protocol for Symphony AIDE
//!
//! This crate provides a comprehensive inter-process communication protocol supporting:
//! - Multiple serialization formats (MessagePack, Bincode, JSON-RPC)
//! - Message envelope system with correlation and routing
//! - Schema validation for message integrity
//! - XI-editor specific protocol support
//! - Type-safe message registry
//!
//! # Examples
//!
//! ```
//! use sy_ipc_protocol::{MessageEnvelope, MessageType, CorrelationId};
//!
//! let envelope = MessageEnvelope::new(
//!     MessageType::PitOperation,
//!     "test payload".to_string(),
//! );
//! assert!(!envelope.correlation_id.to_string().is_empty());
//! ```

pub mod message;
pub mod serialize;
pub mod jsonrpc;
pub mod xi_protocol;
pub mod schema;
pub mod registry;

// Re-export main types
pub use message::{MessageEnvelope, MessageType, MessageMetadata, MessagePriority, CorrelationId};
pub use serialize::{SerializationFormat, MessageSerializer, SerializationError};
pub use jsonrpc::{JsonRpcMessage, JsonRpcRequest, JsonRpcResponse, JsonRpcError, JsonRpcClient};
pub use xi_protocol::{XiOperation, XiEvent, TextDelta, ViewUpdate};
pub use schema::{MessageSchema, SchemaValidator, ValidationError, JsonRpcSchema};
pub use registry::MessageRegistry;