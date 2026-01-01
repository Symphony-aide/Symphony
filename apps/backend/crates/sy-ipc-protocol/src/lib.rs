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

#![allow(clippy::cast_possible_truncation)] // Duration casting is acceptable for our use case
#![allow(clippy::missing_const_for_fn)] // Many functions may become async in the future
#![allow(clippy::must_use_candidate)] // Builder pattern methods don't always need must_use
#![allow(clippy::unused_async)] // Async functions prepared for future async operations
#![allow(clippy::use_self)] // Explicit enum names improve readability in match arms
#![allow(clippy::doc_markdown)] // MessagePack is a proper noun, doesn't need backticks
#![allow(clippy::unwrap_used)] // Acceptable in internal protocol code with known invariants
#![allow(clippy::significant_drop_in_scrutinee)] // Acceptable for short-lived locks
#![allow(clippy::uninlined_format_args)] // Format args style is a matter of preference
#![allow(clippy::unnecessary_literal_bound)] // Lifetime bounds may be needed for future changes
#![allow(clippy::similar_names)] // serializer/serialized is clear in context
#![allow(clippy::semicolon_if_nothing_returned)] // Benchmark style preference
#![allow(clippy::redundant_clone)] // May be needed for test isolation
#![allow(clippy::panic)] // Acceptable in tests for assertion failures

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
