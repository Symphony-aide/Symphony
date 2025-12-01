/// LSP server process management
///
/// Manages external language server processes with stdio communication,
/// health monitoring, and graceful shutdown.

use crate::config::ServerConfiguration;
use crate::error::{LSPError, LSPResult};
use crate::health::HealthMonitor;
use crate::language::Language;
use std::process::Stdio;
use tokio::io::{AsyncBufReadExt, AsyncReadExt, AsyncWriteExt, BufReader};
use tokio::process::{Child, ChildStdin, ChildStdout, Command};
use tokio::sync::Mutex;
use std::sync::Arc;
use tracing::{debug, error, info, warn};

/// LSP Server Process
///
/// Manages an external language server process with stdio communication.
#[derive(Debug)]
pub struct LSPServerProcess {
    /// Language this server handles
    language: Language,

    /// Server configuration
    config: ServerConfiguration,

    /// Child process handle
    process: Option<Child>,

    /// Standard input handle
    stdin: Option<ChildStdin>,

    /// Standard output reader
    stdout_reader: Option<BufReader<ChildStdout>>,

    /// Health monitor
    health_monitor: Arc<Mutex<HealthMonitor>>,

    /// Whether the process is intentionally stopped
    stopped: bool,
}

impl LSPServerProcess {
    /// Spawn a new server process
    ///
    /// Creates and starts a new language server process with the given configuration.
    ///
    /// # Arguments
    ///
    /// * `language` - Programming language this server handles
    /// * `config` - Server configuration
    ///
    /// # Returns
    ///
    /// New server process instance
    ///
    /// # Errors
    ///
    /// Returns error if:
    /// - Server executable not found
    /// - Permission denied
    /// - Process spawn fails
    ///
    /// # Examples
    ///
    /// ```no_run
    /// use lsp_manager_symphony::{LSPServerProcess, Language, ServerConfiguration};
    ///
    /// # async fn example() -> Result<(), Box<dyn std::error::Error>> {
    /// let config = ServerConfiguration::new("rust-analyzer", vec![]);
    /// let process = LSPServerProcess::spawn(Language::Rust, config).await?;
    /// # Ok(())
    /// # }
    /// ```
    pub async fn spawn(language: Language, config: ServerConfiguration) -> LSPResult<Self> {
        info!(
            "Spawning {} language server: {} {:?}",
            language.display_name(),
            config.command,
            config.args
        );

        // Build command
        let mut command = Command::new(&config.command);
        command
            .args(&config.args)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .kill_on_drop(true);

        // Set environment variables
        for (key, value) in &config.env {
            command.env(key, value);
        }

        // Set working directory
        if let Some(cwd) = &config.cwd {
            command.current_dir(cwd);
        }

        // Spawn process
        let mut process = command
            .spawn()
            .map_err(|e| {
                error!(
                    "Failed to spawn {} server: {}",
                    language.display_name(),
                    e
                );
                LSPError::spawn_error(language.as_str(), e)
            })?;

        // Get stdio handles
        let stdin = process.stdin.take().ok_or_else(|| {
            LSPError::communication_error(
                language.as_str(),
                "Failed to get stdin handle",
            )
        })?;

        let stdout = process.stdout.take().ok_or_else(|| {
            LSPError::communication_error(
                language.as_str(),
                "Failed to get stdout handle",
            )
        })?;

        let stdout_reader = BufReader::new(stdout);

        info!(
            "{} language server spawned successfully (PID: {:?})",
            language.display_name(),
            process.id()
        );

        Ok(Self {
            language,
            config,
            process: Some(process),
            stdin: Some(stdin),
            stdout_reader: Some(stdout_reader),
            health_monitor: Arc::new(Mutex::new(HealthMonitor::default())),
            stopped: false,
        })
    }

    /// Write message to server stdin
    ///
    /// Sends a JSON-RPC message to the language server via stdin.
    /// Messages must be formatted with Content-Length header.
    ///
    /// # Arguments
    ///
    /// * `message` - JSON-RPC message content
    ///
    /// # Errors
    ///
    /// Returns error if write fails or stdin is not available
    ///
    /// # Examples
    ///
    /// ```no_run
    /// # use lsp_manager_symphony::LSPServerProcess;
    /// # async fn example(mut process: LSPServerProcess) -> Result<(), Box<dyn std::error::Error>> {
    /// let message = r#"{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}"#;
    /// process.write_message(message).await?;
    /// # Ok(())
    /// # }
    /// ```
    pub async fn write_message(&mut self, message: &str) -> LSPResult<()> {
        let stdin = self.stdin.as_mut().ok_or_else(|| {
            LSPError::communication_error(
                self.language.as_str(),
                "stdin not available",
            )
        })?;

        // Format message with Content-Length header
        let content = format!("Content-Length: {}\r\n\r\n{}", message.len(), message);
        let bytes = content.as_bytes();

        debug!(
            "Sending {} bytes to {} server",
            bytes.len(),
            self.language.display_name()
        );

        stdin
            .write_all(bytes)
            .await
            .map_err(|e| {
                error!(
                    "Failed to write to {} server: {}",
                    self.language.display_name(),
                    e
                );
                LSPError::communication_error(
                    self.language.as_str(),
                    format!("Write failed: {}", e),
                )
            })?;

        stdin.flush().await.map_err(|e| {
            LSPError::communication_error(
                self.language.as_str(),
                format!("Flush failed: {}", e),
            )
        })?;

        // Record heartbeat
        self.health_monitor.lock().await.heartbeat();

        Ok(())
    }

    /// Read message from server stdout
    ///
    /// Reads the next JSON-RPC message from the language server.
    /// Parses Content-Length header and reads the message body.
    ///
    /// # Returns
    ///
    /// The message content, or `None` if stream ended
    ///
    /// # Errors
    ///
    /// Returns error if read fails or message is malformed
    ///
    /// # Examples
    ///
    /// ```no_run
    /// # use lsp_manager_symphony::LSPServerProcess;
    /// # async fn example(mut process: LSPServerProcess) -> Result<(), Box<dyn std::error::Error>> {
    /// if let Some(message) = process.read_message().await? {
    ///     println!("Received: {}", message);
    /// }
    /// # Ok(())
    /// # }
    /// ```
    pub async fn read_message(&mut self) -> LSPResult<Option<String>> {
        let reader = self.stdout_reader.as_mut().ok_or_else(|| {
            LSPError::communication_error(
                self.language.as_str(),
                "stdout not available",
            )
        })?;

        // Read headers
        let mut content_length: Option<usize> = None;
        let mut buffer = String::new();

        loop {
            buffer.clear();
            let bytes_read = reader
                .read_line(&mut buffer)
                .await
                .map_err(|e| {
                    LSPError::communication_error(
                        self.language.as_str(),
                        format!("Failed to read header: {}", e),
                    )
                })?;

            if bytes_read == 0 {
                // Stream ended
                return Ok(None);
            }

            // Check for end of headers
            if buffer == "\r\n" {
                break;
            }

            // Parse Content-Length header
            if let Some(value) = buffer.strip_prefix("Content-Length: ") {
                content_length = value.trim().parse().ok();
            }
        }

        // Read message body
        let size = content_length.ok_or_else(|| {
            LSPError::JsonRpcParseError("Missing Content-Length header".to_string())
        })?;

        debug!(
            "Reading {} bytes from {} server",
            size,
            self.language.display_name()
        );

        let mut message_bytes = vec![0u8; size];
        reader
            .read_exact(&mut message_bytes)
            .await
            .map_err(|e| {
                LSPError::communication_error(
                    self.language.as_str(),
                    format!("Failed to read message body: {}", e),
                )
            })?;

        let message = String::from_utf8(message_bytes).map_err(|e| {
            LSPError::JsonRpcParseError(format!("Invalid UTF-8: {}", e))
        })?;

        // Record heartbeat
        self.health_monitor.lock().await.heartbeat();

        Ok(Some(message))
    }

    /// Check if process is alive
    ///
    /// Returns `true` if the server process is still running.
    ///
    /// # Returns
    ///
    /// `true` if process is running
    pub fn is_alive(&self) -> bool {
        if let Some(process) = &self.process {
            process.id().is_some()
        } else {
            false
        }
    }

    /// Get process ID
    ///
    /// Returns the operating system process ID.
    ///
    /// # Returns
    ///
    /// Process ID or `None` if not running
    pub fn pid(&self) -> Option<u32> {
        self.process.as_ref().and_then(|p| p.id())
    }

    /// Get language
    ///
    /// Returns the programming language this server handles.
    pub fn language(&self) -> Language {
        self.language
    }

    /// Get health monitor
    ///
    /// Returns a reference to the health monitor for this process.
    pub fn health_monitor(&self) -> Arc<Mutex<HealthMonitor>> {
        self.health_monitor.clone()
    }

    /// Check if server is healthy
    ///
    /// Returns `true` if the server has responded recently.
    pub async fn is_healthy(&self) -> bool {
        self.health_monitor.lock().await.is_healthy()
    }

    /// Kill the server process
    ///
    /// Forcefully terminates the server process.
    ///
    /// # Errors
    ///
    /// Returns error if kill fails
    pub async fn kill(&mut self) -> LSPResult<()> {
        if let Some(mut process) = self.process.take() {
            info!(
                "Killing {} language server (PID: {:?})",
                self.language.display_name(),
                process.id()
            );

            process.kill().await.map_err(|e| {
                error!(
                    "Failed to kill {} server: {}",
                    self.language.display_name(),
                    e
                );
                LSPError::IoError(e)
            })?;

            self.stopped = true;
        }

        Ok(())
    }

    /// Gracefully shutdown the server
    ///
    /// Sends shutdown request and waits for process to exit.
    ///
    /// # Errors
    ///
    /// Returns error if shutdown fails
    pub async fn shutdown(&mut self) -> LSPResult<()> {
        info!(
            "Shutting down {} language server",
            self.language.display_name()
        );

        // Send shutdown request
        let shutdown_request = r#"{"jsonrpc":"2.0","id":999999,"method":"shutdown","params":null}"#;
        if let Err(e) = self.write_message(shutdown_request).await {
            warn!(
                "Failed to send shutdown request to {} server: {}",
                self.language.display_name(),
                e
            );
        }

        // Send exit notification
        let exit_notification = r#"{"jsonrpc":"2.0","method":"exit","params":null}"#;
        if let Err(e) = self.write_message(exit_notification).await {
            warn!(
                "Failed to send exit notification to {} server: {}",
                self.language.display_name(),
                e
            );
        }

        // Wait for process to exit (with timeout)
        if let Some(mut process) = self.process.take() {
            match tokio::time::timeout(
                std::time::Duration::from_secs(5),
                process.wait(),
            )
            .await
            {
                Ok(Ok(status)) => {
                    info!(
                        "{} language server exited with status: {}",
                        self.language.display_name(),
                        status
                    );
                }
                Ok(Err(e)) => {
                    error!(
                        "Error waiting for {} server to exit: {}",
                        self.language.display_name(),
                        e
                    );
                }
                Err(_) => {
                    warn!(
                        "{} language server did not exit within timeout, killing",
                        self.language.display_name()
                    );
                    let _ = process.kill().await;
                }
            }
        }

        self.stopped = true;
        Ok(())
    }

    /// Check if server was intentionally stopped
    pub fn is_stopped(&self) -> bool {
        self.stopped
    }
}

impl Drop for LSPServerProcess {
    fn drop(&mut self) {
        if let Some(mut process) = self.process.take() {
            // Try to kill the process on drop
            let language = self.language.display_name();
            tokio::spawn(async move {
                if let Err(e) = process.kill().await {
                    error!("Failed to kill {} server on drop: {}", language, e);
                }
            });
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // Note: These tests require actual language servers to be installed
    // They are marked as ignored by default

    #[tokio::test]
    #[ignore]
    async fn test_spawn_rust_analyzer() {
        let config = ServerConfiguration::new("rust-analyzer", vec![]);
        let result = LSPServerProcess::spawn(Language::Rust, config).await;
        assert!(result.is_ok());

        let mut process = result.unwrap();
        assert!(process.is_alive());
        assert!(process.pid().is_some());

        process.kill().await.unwrap();
    }

    #[tokio::test]
    #[ignore]
    async fn test_spawn_nonexistent_server() {
        let config = ServerConfiguration::new("nonexistent-server-xyz", vec![]);
        let result = LSPServerProcess::spawn(Language::Rust, config).await;
        assert!(result.is_err());
    }

    #[test]
    fn test_process_language() {
        let config = ServerConfiguration::new("test", vec![]);
        // Can't actually spawn without a real server, but we can test the structure
        assert_eq!(Language::Rust.as_str(), "rust");
    }
}
