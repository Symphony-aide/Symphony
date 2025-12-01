/// LSP Manager Extension for Symphony IDE
///
/// Provides multi-language Language Server Protocol support with automatic
/// server management, health monitoring, and auto-restart capabilities.
///
/// # Architecture
///
/// - **LSPExtensionManager**: Coordinates all language servers
/// - **LSPServerProcess**: Manages individual server processes
/// - **HealthMonitor**: Monitors server health and triggers restarts
/// - **ServerConfiguration**: Per-language server configuration
///
/// # Supported Languages
///
/// - TypeScript/JavaScript (typescript-language-server)
/// - Python (pyright)
/// - Rust (rust-analyzer)
/// - Go (gopls)

use std::sync::Arc;
use sveditor_core_api::extensions::base::{Extension, ExtensionInfo};
use sveditor_core_api::extensions::client::ExtensionClient;
use sveditor_core_api::extensions::manager::ExtensionsManager;
use sveditor_core_api::messaging::ClientMessages;
use sveditor_core_api::{ManifestExtension, ManifestInfo, Mutex, State};
use tracing::info;

mod config;
mod language;
mod manager;
mod process;
mod health;
mod error;

pub use config::ServerConfiguration;
pub use language::{detect_language, Language};
pub use manager::{LSPExtensionManager, LSPServerInstance};
pub use process::LSPServerProcess;
pub use health::HealthMonitor;
pub use error::{LSPError, LSPResult};

pub static EXTENSION_NAME: &str = "LSP Manager";

/// LSP Manager Extension
///
/// Main extension struct that integrates with Symphony's extension system.
struct LSPManagerExtension {
    client: ExtensionClient,
    state_id: u8,
}

impl Extension for LSPManagerExtension {
    fn get_info(&self) -> ExtensionInfo {
        ExtensionInfo {
            id: env!("CARGO_PKG_NAME").to_string(),
            name: EXTENSION_NAME.to_string(),
        }
    }

    fn init(&mut self, _state: Arc<Mutex<State>>) {
        info!("LSP Manager Extension initialized");
        
        // Note: Full IPC routing and message handling will be implemented in Phase 3
        // when the frontend LSP client is ready. The infrastructure is in place:
        // - LSPExtensionManager for server lifecycle management
        // - LSPServerProcess for stdio communication with language servers
        // - HealthMonitor for auto-restart with exponential backoff
        // - Comprehensive error handling and logging
        //
        // IPC routing will handle:
        // - LSP requests from frontend (completion, hover, definition, etc.)
        // - Routing to appropriate language server based on file type
        // - Forwarding responses back to frontend via IPC
        // - Publishing diagnostics and other server notifications
    }

    fn unload(&mut self) {
        info!("LSP Manager Extension unloading");
        self.client.unload();
    }

    fn notify(&mut self, message: ClientMessages) {
        let mut client = self.client.clone();
        sveditor_core_api::tokio::spawn(async move {
            client.process_message(&message).await;
        });
    }
}

/// Extension entry point
///
/// Called by Symphony to register the extension.
///
/// # Arguments
///
/// * `extensions` - Extension manager for registration
/// * `client` - Extension client for communication
/// * `state_id` - Unique state identifier
pub fn entry(extensions: &mut ExtensionsManager, client: ExtensionClient, state_id: u8) {
    let plugin = Box::new(LSPManagerExtension { client, state_id });
    let parent_id = env!("CARGO_PKG_NAME");
    extensions.register(parent_id, plugin);
    info!("LSP Manager Extension registered");
}

/// Get extension manifest information
///
/// Returns metadata about the extension for Symphony's extension system.
pub fn get_info() -> ManifestInfo {
    ManifestInfo {
        extension: ManifestExtension {
            id: env!("CARGO_PKG_NAME").to_string(),
            name: EXTENSION_NAME.to_string(),
            author: "Symphony Team".to_string(),
            version: env!("CARGO_PKG_VERSION").to_string(),
            repository: "https://github.com/Symphony-Code-Editor/Symphony-App".to_string(),
            main: None,
        },
    }
}
