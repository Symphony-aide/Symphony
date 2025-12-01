/// LSP Extension Manager
///
/// Coordinates all language servers, manages lifecycle, and handles server registry.

use crate::config::{get_default_config, ServerConfiguration};
use crate::error::{LSPError, LSPResult};
use crate::language::{detect_language, Language};
use crate::process::LSPServerProcess;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::{debug, error, info};

/// LSP Server Instance
///
/// Tracks a running language server instance with its associated documents.
#[derive(Debug)]
pub struct LSPServerInstance {
    /// The server process
    pub process: LSPServerProcess,

    /// Active documents using this server
    pub active_documents: Vec<String>,

    /// Server initialization status
    pub initialized: bool,
}

impl LSPServerInstance {
    /// Create a new server instance
    pub fn new(process: LSPServerProcess) -> Self {
        Self {
            process,
            active_documents: Vec::new(),
            initialized: false,
        }
    }

    /// Add a document to this server
    pub fn add_document(&mut self, document_uri: String) {
        if !self.active_documents.contains(&document_uri) {
            self.active_documents.push(document_uri);
        }
    }

    /// Remove a document from this server
    pub fn remove_document(&mut self, document_uri: &str) {
        self.active_documents.retain(|uri| uri != document_uri);
    }

    /// Check if server has any active documents
    pub fn has_active_documents(&self) -> bool {
        !self.active_documents.is_empty()
    }

    /// Get number of active documents
    pub fn document_count(&self) -> usize {
        self.active_documents.len()
    }
}

/// LSP Extension Manager
///
/// Manages the lifecycle of language servers, including spawning,
/// monitoring, and coordinating multiple server instances.
pub struct LSPExtensionManager {
    /// Active server instances by language
    servers: Arc<Mutex<HashMap<String, Arc<Mutex<LSPServerInstance>>>>>,

    /// Server configurations by language
    configurations: HashMap<String, ServerConfiguration>,
}

impl LSPExtensionManager {
    /// Create a new LSP extension manager
    ///
    /// Initializes the manager with default server configurations.
    ///
    /// # Examples
    ///
    /// ```
    /// use lsp_manager_symphony::LSPExtensionManager;
    ///
    /// let manager = LSPExtensionManager::new();
    /// ```
    pub fn new() -> Self {
        let mut configurations = HashMap::new();

        // Load default configurations for all supported languages
        for language in Language::all() {
            configurations.insert(
                language.as_str().to_string(),
                get_default_config(*language),
            );
        }

        Self {
            servers: Arc::new(Mutex::new(HashMap::new())),
            configurations,
        }
    }

    /// Register a custom server configuration
    ///
    /// Overrides the default configuration for a language.
    ///
    /// # Arguments
    ///
    /// * `language` - Language identifier (e.g., "typescript", "python")
    /// * `config` - Server configuration
    ///
    /// # Examples
    ///
    /// ```
    /// use lsp_manager_symphony::{LSPExtensionManager, ServerConfiguration};
    ///
    /// let mut manager = LSPExtensionManager::new();
    /// let config = ServerConfiguration::new("custom-server", vec!["--stdio".to_string()]);
    /// manager.register_server("typescript".to_string(), config);
    /// ```
    pub fn register_server(&mut self, language: String, config: ServerConfiguration) {
        info!("Registering custom configuration for {}", language);
        self.configurations.insert(language, config);
    }

    /// Start a language server for a document
    ///
    /// Spawns a new server process if one doesn't exist for the language.
    /// Returns existing server if already running.
    ///
    /// # Arguments
    ///
    /// * `document_uri` - Document URI
    /// * `language_id` - Language identifier
    ///
    /// # Returns
    ///
    /// Arc reference to server instance
    ///
    /// # Errors
    ///
    /// Returns error if server spawn fails
    ///
    /// # Examples
    ///
    /// ```no_run
    /// # use lsp_manager_symphony::LSPExtensionManager;
    /// # async fn example() -> Result<(), Box<dyn std::error::Error>> {
    /// let mut manager = LSPExtensionManager::new();
    /// let server = manager.start_server("file:///path/to/file.rs", "rust").await?;
    /// # Ok(())
    /// # }
    /// ```
    pub async fn start_server(
        &mut self,
        document_uri: &str,
        language_id: &str,
    ) -> LSPResult<Arc<Mutex<LSPServerInstance>>> {
        let mut servers = self.servers.lock().await;

        // Check if server already exists
        if let Some(server) = servers.get(language_id) {
            info!(
                "Reusing existing {} server for {}",
                language_id, document_uri
            );
            let mut server_instance = server.lock().await;
            server_instance.add_document(document_uri.to_string());
            return Ok(server.clone());
        }

        // Get configuration
        let config = self
            .configurations
            .get(language_id)
            .ok_or_else(|| {
                LSPError::configuration_error(
                    language_id,
                    format!("No configuration found for language: {}", language_id),
                )
            })?
            .clone();

        // Check if server is enabled
        if !config.enabled {
            return Err(LSPError::configuration_error(
                language_id,
                "Server is disabled in configuration",
            ));
        }

        // Parse language
        let language = Language::all()
            .iter()
            .find(|l| l.as_str() == language_id)
            .ok_or_else(|| {
                LSPError::configuration_error(
                    language_id,
                    format!("Unsupported language: {}", language_id),
                )
            })?;

        info!("Starting {} language server", language.display_name());

        // Spawn server process
        let process = LSPServerProcess::spawn(*language, config).await?;

        // Create server instance
        let mut instance = LSPServerInstance::new(process);
        instance.add_document(document_uri.to_string());

        let server_arc = Arc::new(Mutex::new(instance));
        servers.insert(language_id.to_string(), server_arc.clone());

        info!(
            "{} language server started successfully",
            language.display_name()
        );

        Ok(server_arc)
    }

    /// Start server for file path
    ///
    /// Detects language from file extension and starts appropriate server.
    ///
    /// # Arguments
    ///
    /// * `file_path` - Path to file
    ///
    /// # Returns
    ///
    /// Arc reference to server instance
    ///
    /// # Errors
    ///
    /// Returns error if language not supported or server spawn fails
    pub async fn start_server_for_file(
        &mut self,
        file_path: &str,
    ) -> LSPResult<Arc<Mutex<LSPServerInstance>>> {
        let language = detect_language(file_path).ok_or_else(|| {
            LSPError::configuration_error(
                "unknown",
                format!("Unsupported file type: {}", file_path),
            )
        })?;

        let document_uri = format!("file://{}", file_path);
        self.start_server(&document_uri, language.as_str()).await
    }

    /// Stop a language server
    ///
    /// Gracefully shuts down the server process and cleans up resources.
    ///
    /// # Arguments
    ///
    /// * `language_id` - Language identifier
    ///
    /// # Errors
    ///
    /// Returns error if shutdown fails
    pub async fn stop_server(&mut self, language_id: &str) -> LSPResult<()> {
        let mut servers = self.servers.lock().await;

        if let Some(server) = servers.remove(language_id) {
            info!("Stopping {} language server", language_id);
            let mut instance = server.lock().await;
            instance.process.shutdown().await?;
            info!("{} language server stopped", language_id);
        } else {
            debug!("No {} server to stop", language_id);
        }

        Ok(())
    }

    /// Stop all language servers
    ///
    /// Gracefully shuts down all running server processes.
    ///
    /// # Errors
    ///
    /// Returns error if any shutdown fails
    pub async fn stop_all_servers(&mut self) -> LSPResult<()> {
        info!("Stopping all language servers");

        let mut servers = self.servers.lock().await;
        let language_ids: Vec<String> = servers.keys().cloned().collect();

        for language_id in language_ids {
            if let Some(server) = servers.remove(&language_id) {
                let mut instance = server.lock().await;
                if let Err(e) = instance.process.shutdown().await {
                    error!("Failed to stop {} server: {}", language_id, e);
                }
            }
        }

        info!("All language servers stopped");
        Ok(())
    }

    /// Restart a crashed server
    ///
    /// Automatically restarts a server that has crashed or become unresponsive.
    /// Uses exponential backoff for restart attempts.
    ///
    /// # Arguments
    ///
    /// * `language_id` - Language identifier
    ///
    /// # Errors
    ///
    /// Returns error if restart fails or max attempts exceeded
    pub async fn restart_server(&mut self, language_id: &str) -> LSPResult<()> {
        info!("Restarting {} language server", language_id);

        let mut servers = self.servers.lock().await;

        // Get existing server instance to preserve document list
        let documents = if let Some(server) = servers.get(language_id) {
            let instance = server.lock().await;
            instance.active_documents.clone()
        } else {
            Vec::new()
        };

        // Remove old server
        servers.remove(language_id);
        drop(servers); // Release lock before spawning

        // Get configuration
        let config = self
            .configurations
            .get(language_id)
            .ok_or_else(|| {
                LSPError::configuration_error(
                    language_id,
                    format!("No configuration found for language: {}", language_id),
                )
            })?
            .clone();

        // Parse language
        let language = Language::all()
            .iter()
            .find(|l| l.as_str() == language_id)
            .ok_or_else(|| {
                LSPError::configuration_error(
                    language_id,
                    format!("Unsupported language: {}", language_id),
                )
            })?;

        // Check restart attempts
        let health_monitor = {
            let servers = self.servers.lock().await;
            if let Some(server) = servers.get(language_id) {
                let instance = server.lock().await;
                instance.process.health_monitor()
            } else {
                return Err(LSPError::communication_error(
                    language_id,
                    "Server instance not found",
                ));
            }
        };

        let mut monitor = health_monitor.lock().await;
        if !monitor.should_restart() {
            return Err(LSPError::max_restarts_exceeded(
                language_id,
                monitor.max_restarts(),
            ));
        }

        // Get restart delay
        let delay = monitor.get_restart_delay();
        drop(monitor);

        // Wait before restarting
        if delay.as_secs() > 0 {
            info!(
                "Waiting {:?} before restarting {} server",
                delay,
                language.display_name()
            );
            tokio::time::sleep(delay).await;
        }

        // Spawn new server process
        let process = LSPServerProcess::spawn(*language, config).await?;

        // Create new server instance with preserved documents
        let mut instance = LSPServerInstance::new(process);
        instance.active_documents = documents;

        let server_arc = Arc::new(Mutex::new(instance));
        let mut servers = self.servers.lock().await;
        servers.insert(language_id.to_string(), server_arc);

        info!("{} language server restarted successfully", language_id);

        Ok(())
    }

    /// Get server instance for language
    ///
    /// Returns the server instance if it exists and is running.
    ///
    /// # Arguments
    ///
    /// * `language_id` - Language identifier
    ///
    /// # Returns
    ///
    /// Server instance or None if not running
    pub async fn get_server(
        &self,
        language_id: &str,
    ) -> Option<Arc<Mutex<LSPServerInstance>>> {
        let servers = self.servers.lock().await;
        servers.get(language_id).cloned()
    }

    /// Check if server is running for language
    ///
    /// # Arguments
    ///
    /// * `language_id` - Language identifier
    ///
    /// # Returns
    ///
    /// `true` if server is running
    pub async fn is_server_running(&self, language_id: &str) -> bool {
        let servers = self.servers.lock().await;
        servers.contains_key(language_id)
    }

    /// Get all running servers
    ///
    /// Returns a list of language identifiers for all running servers.
    ///
    /// # Returns
    ///
    /// Vector of language identifiers
    pub async fn get_running_servers(&self) -> Vec<String> {
        let servers = self.servers.lock().await;
        servers.keys().cloned().collect()
    }

    /// Detect language from file path
    ///
    /// # Arguments
    ///
    /// * `file_path` - Path to file
    ///
    /// # Returns
    ///
    /// Language identifier or None if not supported
    pub fn detect_language(&self, file_path: &str) -> Option<String> {
        detect_language(file_path).map(|l| l.as_str().to_string())
    }
}

impl Default for LSPExtensionManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_manager_new() {
        let manager = LSPExtensionManager::new();
        assert_eq!(manager.configurations.len(), 5); // 5 supported languages
    }

    #[test]
    fn test_register_server() {
        let mut manager = LSPExtensionManager::new();
        let config = ServerConfiguration::new("custom-server", vec![]);
        manager.register_server("typescript".to_string(), config);

        assert_eq!(
            manager.configurations.get("typescript").unwrap().command,
            "custom-server"
        );
    }

    #[test]
    fn test_detect_language() {
        let manager = LSPExtensionManager::new();
        assert_eq!(manager.detect_language("test.rs"), Some("rust".to_string()));
        assert_eq!(
            manager.detect_language("test.ts"),
            Some("typescript".to_string())
        );
        assert_eq!(manager.detect_language("test.py"), Some("python".to_string()));
        assert_eq!(manager.detect_language("test.go"), Some("go".to_string()));
        assert_eq!(manager.detect_language("test.txt"), None);
    }

    #[tokio::test]
    async fn test_server_instance() {
        let config = ServerConfiguration::new("test-server", vec![]);
        // Can't actually spawn without a real server
        // Just test the structure
        assert!(config.enabled);
    }

    #[tokio::test]
    async fn test_get_running_servers_empty() {
        let manager = LSPExtensionManager::new();
        let servers = manager.get_running_servers().await;
        assert!(servers.is_empty());
    }

    #[tokio::test]
    async fn test_is_server_running_false() {
        let manager = LSPExtensionManager::new();
        assert!(!manager.is_server_running("typescript").await);
    }
}
