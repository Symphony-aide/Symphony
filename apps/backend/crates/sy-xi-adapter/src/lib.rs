//! # XI-editor Adapter for Symphony
//!
//! This crate provides the `XiEditorAdapter` implementation of the `TextEditingPort` trait,
//! enabling Symphony to communicate with XI-editor binary processes through JSON-RPC and
//! event streaming.
//!
//! ## Features
//!
//! - **Process Management**: XI-editor subprocess lifecycle with health monitoring
//! - **JSON-RPC Client**: Symphony → XI-editor communication with <1ms latency target
//! - **Event Streaming**: XI-editor → Symphony real-time events with <10ms delivery
//! - **State Synchronization**: Buffer metadata cache with file system watching
//! - **Error Recovery**: Automatic reconnection and state recovery mechanisms
//!
//! ## Architecture
//!
//! The adapter follows Symphony's H2A2 (Harmonic Hexagonal Actor Architecture) pattern:
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────┐
//! │                    Symphony Domain Core                      │
//! │                 (uses TextEditingPort)                      │
//! └─────────────────────┬───────────────────────────────────────┘
//!                       │
//! ┌─────────────────────┴───────────────────────────────────────┐
//! │                  XiEditorAdapter                            │
//! │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
//! │  │   Process   │ │  JSON-RPC   │ │   Event Streaming   │   │
//! │  │  Manager    │ │   Client    │ │     Handler         │   │
//! │  └─────────────┘ └─────────────┘ └─────────────────────┘   │
//! └─────────────────────┬───────────────────────────────────────┘
//!                       │ STDIO Communication
//! ┌─────────────────────┴───────────────────────────────────────┐
//! │                   XI-editor Process                         │
//! │              (JSON-RPC Server + Text Engine)               │
//! └─────────────────────────────────────────────────────────────┘
//! ```
//!
//! ## Usage Example
//!
//! ```rust
//! use sy_xi_adapter::{XiEditorConfig, jsonrpc_client::XiJsonRpcClient};
//! use std::path::PathBuf;
//! use std::time::Duration;
//! use tokio::io::duplex;
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     // Configure XI-editor
//!     let config = XiEditorConfig {
//!         xi_editor_path: PathBuf::from("xi-core"),
//!         args: vec!["--rpc".to_string()],
//!         ..Default::default()
//!     };
//!     
//!     // Create JSON-RPC client (adapter will be implemented in future phases)
//!     let (stdin, _stdout) = duplex(1024);
//!     let client = XiJsonRpcClient::new(stdin, Duration::from_secs(5));
//!     
//!     // JSON-RPC client is ready for XI-editor communication
//!     println!("XI-editor JSON-RPC client created successfully");
//!     
//!     Ok(())
//! }
//! ```
//!
//! ## Performance Targets
//!
//! - **JSON-RPC Latency**: <1ms average request/response time
//! - **Event Streaming**: <10ms average event delivery time
//! - **State Sync**: <10ms for state consistency after changes
//! - **Process Recovery**: <5 seconds for automatic recovery
//! - **Communication Reliability**: >99.9% successful message delivery
//!
//! ## Error Handling
//!
//! All operations return `Result<T, SymphonyError>` with detailed context:
//!
//! ```rust
//! use sy_xi_adapter::jsonrpc_client::XiJsonRpcClient;
//! use sy_commons::ResultContext;
//! use std::time::Duration;
//! use tokio::io::duplex;
//!
//! async fn example() -> Result<(), sy_commons::SymphonyError> {
//!     let (stdin, _stdout) = duplex(1024);
//!     let client = XiJsonRpcClient::new(stdin, Duration::from_secs(5));
//!     
//!     // JSON-RPC operations will return detailed errors
//!     let result = client.call("test_method", None).await
//!         .context("Failed to call XI-editor method")?;
//!     
//!     Ok(())
//! }
//! ```

pub mod config;
pub mod error;
pub mod jsonrpc_client;
pub mod process;
pub mod types;

// Re-export main types for convenience
pub use config::XiEditorConfig;
pub use error::XiAdapterError;
pub use types::*;

// Re-export commonly used external types
pub use symphony_core_ports::{BufferId, ViewId, Position, Range, TextEditingEvent};
pub use sy_commons::{SymphonyError, ResultContext};

/// Result type alias using `SymphonyError`
pub type Result<T> = std::result::Result<T, SymphonyError>;