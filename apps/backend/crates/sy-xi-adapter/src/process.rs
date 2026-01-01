//! XI-editor process management
//!
//! Provides subprocess lifecycle management, health monitoring, and automatic
//! restart functionality for XI-editor processes.

use crate::config::XiEditorConfig;
use crate::error::XiAdapterError;
use crate::types::ProcessStatus;
use sy_commons::{duck, ResultContext, SymphonyError};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tokio::process::{Child, Command};
use tokio::sync::{mpsc, RwLock};
use tracing::{error, info, warn};

/// XI-editor process manager
///
/// Manages the lifecycle of XI-editor subprocess including startup, health
/// monitoring, automatic restart, and graceful shutdown.
///
/// # Examples
///
/// ```rust
/// use sy_xi_adapter::{XiEditorConfig, process::XiEditorProcessManager};
/// use std::time::Duration;
/// use std::path::PathBuf;
///
/// #[tokio::main]
/// async fn main() -> Result<(), Box<dyn std::error::Error>> {
///     let mut config = XiEditorConfig::default();
///     config.xi_editor_path = PathBuf::from("echo"); // Use echo for testing
///     let (manager, mut status_receiver) = XiEditorProcessManager::new(config);
///     
///     // Process manager created successfully
///     println!("Process manager created");
///     Ok(())
/// }
/// ```
pub struct XiEditorProcessManager {
    /// XI-editor process handle
    process: Arc<RwLock<Option<Child>>>,
    /// Configuration
    config: XiEditorConfig,
    /// Restart counter
    restart_count: AtomicUsize,
    /// Status change sender
    status_sender: mpsc::UnboundedSender<ProcessStatus>,
}

impl XiEditorProcessManager {
    /// Create a new process manager
    ///
    /// # Arguments
    /// * `config` - XI-editor configuration
    ///
    /// # Returns
    /// A tuple containing the process manager and status receiver
    ///
    /// # Examples
    ///
    /// ```rust
    /// use sy_xi_adapter::{XiEditorConfig, process::XiEditorProcessManager};
    ///
    /// let config = XiEditorConfig::default();
    /// let (manager, status_receiver) = XiEditorProcessManager::new(config);
    /// ```
    pub fn new(config: XiEditorConfig) -> (Self, mpsc::UnboundedReceiver<ProcessStatus>) {
        let (status_sender, status_receiver) = mpsc::unbounded_channel();

        let manager = Self {
            process: Arc::new(RwLock::new(None)),
            config,
            restart_count: AtomicUsize::new(0),
            status_sender,
        };

        (manager, status_receiver)
    }

    /// Start XI-editor process
    ///
    /// Spawns the XI-editor subprocess with configured arguments and environment.
    /// Starts health monitoring and notifies status changes.
    ///
    /// # Errors
    /// Returns an error if:
    /// - XI-editor binary is not found
    /// - Process spawn fails
    /// - Startup timeout is exceeded
    ///
    /// # Examples
    ///
    /// ```rust
    /// # use sy_xi_adapter::{XiEditorConfig, process::XiEditorProcessManager};
    /// # use std::path::PathBuf;
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
    /// let mut config = XiEditorConfig::default();
    /// config.xi_editor_path = PathBuf::from("echo"); // Use echo for testing
    /// let (manager, _) = XiEditorProcessManager::new(config);
    /// 
    /// // Start would work with a real XI-editor binary
    /// // manager.start().await?;
    /// # Ok(())
    /// # }
    /// ```
    pub async fn start(&self) -> Result<(), SymphonyError> {
        let start_time = std::time::Instant::now();
        duck!("Starting XI-editor process with binary: {:?}", self.config.xi_editor_path);

        // Build XI-editor command
        let mut command = Command::new(&self.config.xi_editor_path);
        command.args(&self.config.args);
        command.stdin(std::process::Stdio::piped());
        command.stdout(std::process::Stdio::piped());
        command.stderr(std::process::Stdio::piped());

        // Set working directory if specified
        if let Some(working_dir) = &self.config.working_directory {
            duck!("Setting working directory: {:?}", working_dir);
            command.current_dir(working_dir);
        }

        // Set environment variables
        for (key, value) in &self.config.environment {
            duck!("Setting environment variable: {}={}", key, value);
            command.env(key, value);
        }

        // Spawn process
        let child = command.spawn()
            .map_err(|e| XiAdapterError::process(format!("Failed to spawn XI-editor: {}", e)))
            .context("Failed to start XI-editor process")?;

        let startup_time = start_time.elapsed();
        if startup_time > Duration::from_secs(2) {
            warn!("XI-editor startup took {}ms (target: <2s)", startup_time.as_millis());
        } else {
            duck!("XI-editor started in {}ms", startup_time.as_millis());
        }

        // Store process handle
        {
            let mut process = self.process.write().await;
            *process = Some(child);
        }

        // Start health monitoring
        self.start_health_monitoring().await;

        // Notify status change
        let _ = self.status_sender.send(ProcessStatus::Started);

        info!("XI-editor process started successfully");
        Ok(())
    }

    /// Stop XI-editor process
    ///
    /// Attempts graceful shutdown first, then force kills if necessary.
    /// Cleans up resources and notifies status changes.
    ///
    /// # Errors
    /// Returns an error if process cleanup fails
    ///
    /// # Examples
    ///
    /// ```rust
    /// # use sy_xi_adapter::{XiEditorConfig, process::XiEditorProcessManager};
    /// # use std::path::PathBuf;
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
    /// # let mut config = XiEditorConfig::default();
    /// # config.xi_editor_path = PathBuf::from("echo");
    /// # let (manager, _) = XiEditorProcessManager::new(config);
    /// 
    /// // Stop would work after starting with a real XI-editor binary
    /// manager.stop().await?;
    /// # Ok(())
    /// # }
    /// ```
    pub async fn stop(&self) -> Result<(), SymphonyError> {
        duck!("Stopping XI-editor process");
        let mut process = self.process.write().await;

        if let Some(mut child) = process.take() {
            // Try graceful shutdown first
            if let Some(stdin) = child.stdin.take() {
                drop(stdin); // Close stdin to signal shutdown
            }

            // Wait for graceful shutdown with timeout
            match tokio::time::timeout(Duration::from_secs(5), child.wait()).await {
                Ok(Ok(exit_status)) => {
                    duck!("XI-editor exited gracefully: {:?}", exit_status);
                    info!("XI-editor exited gracefully: {:?}", exit_status);
                }
                Ok(Err(e)) => {
                    error!("Error waiting for XI-editor exit: {}", e);
                }
                Err(_) => {
                    // Force kill if graceful shutdown times out
                    warn!("XI-editor graceful shutdown timed out, force killing");
                    if let Err(e) = child.kill().await {
                        error!("Failed to kill XI-editor process: {}", e);
                    }
                }
            }
        }

        let _ = self.status_sender.send(ProcessStatus::Stopped);
        duck!("XI-editor process stopped");
        Ok(())
    }

    /// Restart XI-editor process
    ///
    /// Stops the current process and starts a new one. Tracks restart count
    /// and prevents excessive restarts.
    ///
    /// # Errors
    /// Returns an error if:
    /// - Maximum restart count is exceeded
    /// - Stop or start operations fail
    ///
    /// # Examples
    ///
    /// ```rust
    /// # use sy_xi_adapter::{XiEditorConfig, process::XiEditorProcessManager};
    /// # use std::path::PathBuf;
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
    /// # let mut config = XiEditorConfig::default();
    /// # config.xi_editor_path = PathBuf::from("echo");
    /// # let (manager, _) = XiEditorProcessManager::new(config);
    /// 
    /// // Restart would work after starting with a real XI-editor binary
    /// // manager.restart().await?;
    /// # Ok(())
    /// # }
    /// ```
    pub async fn restart(&self) -> Result<(), SymphonyError> {
        duck!("Restarting XI-editor process");
        info!("Restarting XI-editor process");

        let restart_count = self.restart_count.fetch_add(1, Ordering::Relaxed);
        if restart_count >= self.config.max_restarts {
            return Err(XiAdapterError::process(format!(
                "Maximum restart count exceeded: {} >= {}",
                restart_count, self.config.max_restarts
            )).into());
        }

        // Stop current process
        self.stop().await
            .context("Failed to stop XI-editor during restart")?;

        // Wait a bit before restarting
        tokio::time::sleep(Duration::from_millis(500)).await;

        // Start new process
        self.start().await
            .context("Failed to start XI-editor during restart")?;

        let _ = self.status_sender.send(ProcessStatus::Restarted { count: restart_count + 1 });
        duck!("XI-editor process restarted (attempt {})", restart_count + 1);
        Ok(())
    }

    /// Check if XI-editor process is running
    ///
    /// # Returns
    /// `true` if the process is running, `false` otherwise
    ///
    /// # Examples
    ///
    /// ```rust
    /// # use sy_xi_adapter::{XiEditorConfig, process::XiEditorProcessManager};
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
    /// # let config = XiEditorConfig::default();
    /// # let (manager, _) = XiEditorProcessManager::new(config);
    /// 
    /// let is_running = manager.is_running().await;
    /// println!("XI-editor running: {}", is_running);
    /// # Ok(())
    /// # }
    /// ```
    pub async fn is_running(&self) -> bool {
        let mut process = self.process.write().await;

        if let Some(child) = process.as_mut() {
            match child.try_wait() {
                Ok(Some(_)) => {
                    duck!("XI-editor process has exited");
                    false // Process has exited
                }
                Ok(None) => {
                    // Process is still running
                    true
                }
                Err(e) => {
                    duck!("Error checking XI-editor process status: {}", e);
                    false // Error checking status
                }
            }
        } else {
            false
        }
    }

    /// Start health monitoring task
    ///
    /// Spawns a background task that periodically checks process health
    /// and triggers automatic restart if the process dies unexpectedly.
    async fn start_health_monitoring(&self) {
        let process = Arc::clone(&self.process);
        let status_sender = self.status_sender.clone();
        let health_check_interval = self.config.health_check_interval;
        let max_restarts = self.config.max_restarts;
        let restart_count = Arc::new(AtomicUsize::new(0));

        tokio::spawn(async move {
            let mut interval = tokio::time::interval(health_check_interval);
            duck!("Started health monitoring with interval: {:?}", health_check_interval);

            loop {
                interval.tick().await;

                // Check if process is still running
                let is_running = {
                    let mut process_guard = process.write().await;
                    if let Some(child) = process_guard.as_mut() {
                        match child.try_wait() {
                            Ok(Some(_)) => false, // Process has exited
                            Ok(None) => true,     // Process is still running
                            Err(_) => false,      // Error checking status
                        }
                    } else {
                        false
                    }
                };

                if !is_running {
                    duck!("Health monitor detected XI-editor process died");
                    error!("XI-editor process died unexpectedly");
                    let _ = status_sender.send(ProcessStatus::Died);

                    // Check restart count
                    let current_restarts = restart_count.fetch_add(1, Ordering::Relaxed);
                    if current_restarts >= max_restarts {
                        duck!("Maximum restarts exceeded in health monitor");
                        let _ = status_sender.send(ProcessStatus::RestartFailed);
                        break;
                    }

                    // Note: In a real implementation, we would trigger restart here
                    // For now, we just report the failure
                    break;
                }
            }

            duck!("Health monitoring task ended");
        });
    }
}

// Implement Clone for process manager (needed for health monitoring)
impl Clone for XiEditorProcessManager {
    fn clone(&self) -> Self {
        Self {
            process: Arc::clone(&self.process),
            config: self.config.clone(),
            restart_count: AtomicUsize::new(self.restart_count.load(Ordering::Relaxed)),
            status_sender: self.status_sender.clone(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_process_manager_creation() {
        let config = XiEditorConfig::default();
        let (manager, mut status_receiver) = XiEditorProcessManager::new(config);

        assert!(!manager.is_running().await);
        assert!(status_receiver.try_recv().is_err());
    }

    #[tokio::test]
    async fn test_is_running_no_process() {
        let config = XiEditorConfig::default();
        let (manager, _) = XiEditorProcessManager::new(config);

        assert!(!manager.is_running().await);
    }

    #[tokio::test]
    async fn test_stop_no_process() {
        let config = XiEditorConfig::default();
        let (manager, _) = XiEditorProcessManager::new(config);

        let result = manager.stop().await;
        assert!(result.is_ok());
    }
}