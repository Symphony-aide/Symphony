//! # Symphony IPC Protocol
//!
//! Message envelope design for Symphony's IPC communication system.
//! 
//! This crate provides the foundational message structures that enable reliable
//! communication between Symphony's components through a standardized envelope format.
//!
//! ## Core Components
//!
//! - [`MessageId`]: Unique identifier for messages using UUID v4
//! - [`MessageHeader`]: Routing and metadata information
//! - [`MessageType`]: Enumeration of supported message types
//! - [`Priority`]: Message priority levels for routing
//! - [`Message`]: Generic message envelope containing header and payload
//! - [`MessageBuilder`]: Fluent API for constructing messages
//!
//! ## Example Usage
//!
//! ```rust
//! use symphony_ipc_protocol::*;
//!
//! let message = Message::builder()
//!     .message_type(MessageType::Request)
//!     .source(EndpointId::new("conductor"))
//!     .target(EndpointId::new("pool-manager"))
//!     .payload("Hello, World!")
//!     .build()
//!     .expect("Failed to build message");
//! ```

pub mod message;
pub mod builder;
pub mod error;

// Re-export main types for convenience
pub use message::{
    Message, MessageHeader, MessageId, MessageType, Priority, ProtocolVersion, EndpointId,
};
pub use builder::MessageBuilder;
pub use error::MessageError;