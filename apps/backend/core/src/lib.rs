//! # Symphony Core
//!
//! This crate provides the core functionality of the Symphony backend server. It manages
//! server state, handles transport protocols, and exposes a JSON-RPC API for client interactions.
//!
//! ## Features
//!
//! - **State Management**: Manages multiple editor states with independent configurations
//! - **Transport Handlers**: Supports HTTP and local transport protocols
//! - **JSON-RPC API**: Comprehensive API for file operations, extensions, and language servers
//! - **Extensibility**: Plugin architecture for adding new functionality
//!
//! ## Quick Start
//!
//! ```rust,no_run
//! use std::sync::Arc;
//! use sveditor_core::{Configuration, Server, handlers::HTTPHandler};
//! use sveditor_core_api::{
//!     extensions::manager::ExtensionsManager,
//!     messaging::ClientMessages,
//!     states::{StatesList, MemoryPersistor},
//!     State
//! };
//! use tokio::sync::{mpsc::channel, Mutex};
//!
//! #[tokio::main]
//! async fn main() {
//!     let (server_tx, server_rx) = channel::<ClientMessages>(1);
//!     
//!     // Create a basic state
//!     let sample_state = State::new(
//!         1, 
//!         ExtensionsManager::new(server_tx.clone(), None), 
//!         Box::new(MemoryPersistor::new())
//!     );
//!     
//!     let states = Arc::new(Mutex::new(
//!         StatesList::new().with_state(sample_state)
//!     ));
//!     
//!     // Configure HTTP handler
//!     let http_handler = HTTPHandler::builder().build();
//!     let config = Configuration::new(Box::new(http_handler), server_tx, server_rx);
//!     
//!     // Start server
//!     let mut server = Server::new(config, states);
//!     server.run().await;
//! }
//! ```

mod configuration;
pub mod handlers;
mod server;

pub use configuration::Configuration;
use sveditor_core_api::states::StatesList;
pub use server::{gen_client, RPCResult, Server};
pub use {jsonrpc_core_client, tokio};
