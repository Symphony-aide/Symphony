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

pub mod jsonrpc;
pub mod message;
pub mod registry;
pub mod schema;
pub mod serialize;
pub mod xi_protocol;

// Re-export main types
pub use jsonrpc::{JsonRpcClient, JsonRpcError, JsonRpcMessage, JsonRpcRequest, JsonRpcResponse};
pub use message::{CorrelationId, MessageEnvelope, MessageMetadata, MessagePriority, MessageType};
pub use registry::MessageRegistry;
pub use schema::{JsonRpcSchema, MessageSchema, SchemaValidator, ValidationError};
pub use serialize::{MessageSerializer, SerializationError, SerializationFormat};
pub use xi_protocol::{TextDelta, ViewUpdate, XiEvent, XiOperation};
