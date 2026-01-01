//! High-performance message bus with pattern-based routing, correlation, and pub/sub for Symphony AIDE
//!
//! This crate provides the core message bus functionality for Symphony's distributed architecture,
//! enabling reliable, high-performance communication routing across all Symphony components.
//!
//! # Features
//!
//! - **Pattern-Based Routing**: Intelligent message routing based on message types and patterns
//! - **Request/Response Correlation**: Reliable correlation of requests with responses using correlation IDs
//! - **Publish/Subscribe**: Topic-based messaging for event distribution
//! - **Endpoint Management**: Dynamic registration and discovery of message endpoints
//! - **Health Monitoring**: Bus and endpoint health monitoring with failure detection
//! - **Message Batching**: Throughput optimization through intelligent message batching
//!
//! # Performance Targets
//!
//! - <0.1ms average routing latency
//! - >10,000 messages per second sustained throughput
//! - <1ms delivery time to all subscribers
//! - <100ms failure detection time
//! - <0.01% message loss rate under normal conditions
//!
//! # Examples
//!
//! ```rust
//! use sy_ipc_bus::{MessageBus, BusConfig};
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     let config = BusConfig::default();
//!     let bus = MessageBus::new(config);
//!     
//!     // Register a route
//!     bus.register_route("user.*", "user-service", 100).await?;
//!     
//!     // Route a message
//!     // let message = MessageEnvelope::new(MessageType::PitOperation, payload);
//!     // bus.route_message(message).await?;
//!     
//!     Ok(())
//! }
//! ```

pub mod bus;
pub mod router;
pub mod correlation;
pub mod pubsub;
pub mod health;
pub mod error;

// Re-export main types
pub use bus::{MessageBus, BusConfig};
pub use router::{PatternRouter, Route};
pub use correlation::{CorrelationManager, CorrelationId};
pub use pubsub::{PubSubManager, EventReceiver};
pub use health::{HealthMonitor, HealthConfig};
pub use error::{BusError, RouterError, CorrelationError, PubSubError, HealthError};

// Re-export protocol types for convenience
pub use sy_ipc_protocol::{MessageType};

/// Type alias for message envelope with byte payload
pub type MessageEnvelope = sy_ipc_protocol::MessageEnvelope<Vec<u8>>;