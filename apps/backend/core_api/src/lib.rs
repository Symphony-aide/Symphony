//! # Symphony Core API
//!
//! This crate provides the foundational API components for the Symphony code editor backend.
//! It defines core data structures, traits, error handling, and messaging protocols used
//! throughout the Symphony ecosystem.
//!
//! ## Architecture Overview
//!
//! The Core API is organized into several key modules:
//!
//! - **Extensions**: Plugin system for extending editor functionality
//! - **Filesystems**: Abstraction layer for different file system implementations
//! - **Language Servers**: Language Server Protocol (LSP) integration
//! - **Messaging**: Client-server communication protocols
//! - **States**: Editor state management and persistence
//! - **Terminal Shells**: Terminal integration and management
//!
//! ## Key Components
//!
//! ### State Management
//! ```rust,no_run
//! use sveditor_core_api::{State, extensions::manager::ExtensionsManager, states::MemoryPersistor};
//! use tokio::sync::mpsc::channel;
//!
//! let (tx, _rx) = channel(1);
//! let extensions = ExtensionsManager::new(tx, None);
//! let persistor = Box::new(MemoryPersistor::new());
//! let state = State::new(1, extensions, persistor);
//! ```
//!
//! ### Error Handling
//! All operations return results using the unified [`Errors`] enum, providing
//! consistent error handling across the entire Symphony backend.

pub mod extensions;
pub mod filesystems;
pub mod language_servers;
pub mod messaging;
pub mod state_persistors;
pub mod states;
pub mod terminal_shells;
pub use extensions::manifest::{Manifest, ManifestErrors, ManifestExtension, ManifestInfo};
pub use extensions::ExtensionErrors;
pub use filesystems::FilesystemErrors;
pub use language_servers::LanguageServer;
pub use serde::{Deserialize, Serialize};
pub use states::State;
pub use tokio::sync::mpsc::Sender;
pub use tokio::sync::Mutex;
pub use {serde, tokio};

/// Global error types used throughout the Symphony backend.
///
/// This enum provides a unified error handling system that covers all major
/// error categories that can occur during Symphony operations.
///
/// # Examples
///
/// ```rust
/// use sveditor_core_api::Errors;
///
/// fn handle_error(error: Errors) {
///     match error {
///         Errors::StateNotFound => println!("Editor state not found"),
///         Errors::Fs(fs_error) => println!("Filesystem error: {:?}", fs_error),
///         Errors::Ext(ext_error) => println!("Extension error: {:?}", ext_error),
///         Errors::BadToken => println!("Invalid authentication token"),
///     }
/// }
/// ```
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
pub enum Errors {
	/// The requested editor state was not found
	StateNotFound,
	/// A filesystem operation failed
	Fs(FilesystemErrors),
	/// An extension operation failed
	Ext(ExtensionErrors),
	/// Authentication token is invalid or expired
	BadToken,
}
