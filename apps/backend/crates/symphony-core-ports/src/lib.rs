//! # Symphony Core Ports
//!
//! This crate provides the foundational port trait definitions for Symphony's H2A2
//! (Harmonic Hexagonal Actor Architecture). These ports serve as clean abstractions
//! that separate domain logic from infrastructure concerns, enabling testability,
//! maintainability, and the ability to swap implementations.
//!
//! ## Architecture Overview
//!
//! The port-based architecture follows the Hexagonal Architecture pattern where:
//! - **Domain Core**: Uses only port abstractions (never concrete implementations)
//! - **Port Interfaces**: Define what the domain needs from infrastructure
//! - **Adapters**: Provide concrete implementations of port interfaces
//!
//! ## Core Ports
//!
//! This crate defines five fundamental ports:
//!
//! - [`TextEditingPort`]: Abstraction for XI-editor integration
//! - [`PitPort`]: High-performance interface for infrastructure extensions
//! - [`ExtensionPort`]: Actor-based extension lifecycle management
//! - [`ConductorPort`]: Python Conductor integration bridge
//! - [`DataAccessPort`]: Two-layer data architecture with pre-validation
//!
//! ## Usage Example
//!
//! ```rust
//! use symphony_core_ports::{TextEditingPort, BufferId, Position};
//! use symphony_core_ports::mocks::MockTextEditingAdapter;
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     // Use mock implementation for testing
//!     let text_editor = MockTextEditingAdapter::new();
//!     
//!     // Create a new buffer
//!     let buffer_id = text_editor.create_buffer(None).await?;
//!     
//!     // Insert some text
//!     let position = Position { line: 0, column: 0 };
//!     text_editor.insert_text(buffer_id, position, "Hello, World!").await?;
//!     
//!     // Get the content back
//!     let content = text_editor.get_buffer_content(buffer_id).await?;
//!     duck!("Buffer content: {}", content);
//!     
//!     Ok(())
//! }
//! ```
//!
//! ## Testing Support
//!
//! All ports include comprehensive mock implementations for isolated testing:
//!
//! ```rust
//! use symphony_core_ports::mocks::*;
//!
//! // Mock implementations provide deterministic behavior
//! let mock_text_editing = MockTextEditingAdapter::new();
//! let mock_pit = MockPitAdapter::new();
//! let mock_extensions = MockExtensionAdapter::new();
//! let mock_conductor = MockConductorAdapter::new();
//! let mock_data_access = MockDataAccessAdapter::new();
//! ```

pub mod binary;
pub mod errors;
pub mod mocks;
pub mod ports;
pub mod types;

// Re-export all public types for convenience
pub use errors::*;
pub use ports::*;
pub use types::*;

// Re-export sy-commons types that are commonly used
pub use sy_commons::SymphonyError;

/// Result type alias using SymphonyError
pub type Result<T> = std::result::Result<T, SymphonyError>;
