//! Windows pseudo-terminal implementation using ConPTY.
//!
//! This module provides Windows-specific PTY functionality using the Console Pseudo-Terminal
//! (ConPTY) API introduced in Windows 10 version 1809 (October 2018 Update).
//!
//! # Overview
//!
//! ConPTY is Microsoft's native solution for pseudo-console support, providing:
//! - Full VT100/ANSI escape sequence support
//! - Bidirectional I/O between host and client applications
//! - Process lifecycle management
//! - Dynamic resize support
//!
//! # Requirements
//!
//! - Windows 10 version 1809 or later
//! - The ConPTY API is available on all modern Windows systems
//!
//! # Implementation Details
//!
//! This implementation uses:
//! - Async I/O with tokio for non-blocking operations
//! - Background threads for output reading to avoid blocking
//! - Atomic flags for thread-safe shutdown signaling
//!
//! # Examples
//!
//! ```no_run
//! use crosspty::PtyBuilder;
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     let mut pty = PtyBuilder::new()
//!         .command("cmd.exe")
//!         .spawn()
//!         .await?;
//!     
//!     pty.write(b"echo Hello from ConPTY\r\n").await?;
//!     let output = pty.read().await?;
//!     
//!     Ok(())
//! }
//! ```

use async_trait::async_trait;
use bytes::{Bytes, BytesMut};
use conpty::Process as ConptyProcess;
use std::io::{Read, Write};
use std::process::Command;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use tokio::sync::Mutex;
use tokio::task;
use tracing::{debug, error};

use crate::{ExitStatus, Pty, PtyBuilder, PtyError, PtyResult, PtySize};

/// Windows ConPTY implementation of the [`Pty`] trait.
///
/// Provides pseudo-terminal functionality on Windows using the native ConPTY API.
/// This struct manages the lifecycle of a ConPTY process including I/O, resizing,
/// and termination.
///
/// # Thread Safety
///
/// This struct uses internal synchronization (`Arc<Mutex>`) to allow safe concurrent
/// access from multiple tasks. The output reading happens on a background thread
/// to avoid blocking the async runtime.
///
/// # Examples
///
/// ```no_run
/// use crosspty::platforms::win::WindowsPty;
/// use crosspty::{PtyBuilder, Pty};
///
/// #[tokio::main]
/// async fn main() -> Result<(), Box<dyn std::error::Error>> {
///     let pty = WindowsPty::spawn(PtyBuilder::new()).await?;
///     Ok(())
/// }
/// ```
pub struct WindowsPty {
    process: Arc<Mutex<ConptyProcess>>,
    pid: u32,
    size: Arc<Mutex<PtySize>>,
    /// Exit status of the process.
    exit_status: Arc<Mutex<ExitStatus>>,
    /// Buffer for storing output from the process.
    output_buffer: Arc<Mutex<BytesMut>>,
    /// Flag indicating whether the process should exit.
    should_exit: Arc<AtomicBool>,
}

impl WindowsPty {
    /// Spawns a new ConPTY process with the given configuration.
    ///
    /// Creates a new Windows pseudo-console and starts the specified command within it.
    /// The function sets up background tasks for output reading and process monitoring.
    ///
    /// # Arguments
    ///
    /// * `builder` - PTY configuration including command, args, environment, and size
    ///
    /// # Returns
    ///
    /// Returns a boxed [`Pty`] trait object on success.
    ///
    /// # Errors
    ///
    /// Returns an error if:
    /// - [`PtyError::CreationFailed`] - ConPTY creation fails
    /// - [`PtyError::ProcessSpawnFailed`] - Process cannot be started
    ///
    /// # Examples
    ///
    /// ```no_run
    /// use crosspty::platforms::win::WindowsPty;
    /// use crosspty::PtyBuilder;
    ///
    /// #[tokio::main]
    /// async fn main() -> Result<(), Box<dyn std::error::Error>> {
    ///     let pty = WindowsPty::spawn(PtyBuilder::new()).await?;
    ///     Ok(())
    /// }
    /// ```
    pub async fn spawn(builder: PtyBuilder) -> PtyResult<Box<dyn Pty>> {
        debug!(
            "Spawning Windows ConPTY: command={}, args={:?}, size={:?}",
            builder.command, builder.args, builder.size
        );

        // Build command
        let mut cmd = Command::new(&builder.command);
        cmd.args(&builder.args);

        // Set environment variables
        for (key, value) in &builder.env {
            cmd.env(key, value);
        }

        // Set working directory
        if let Some(cwd) = &builder.working_dir {
            cmd.current_dir(cwd);
        }

        // Spawn the process using conpty
        let process = task::spawn_blocking(move || {
            ConptyProcess::spawn(cmd)
                .map_err(|e| PtyError::CreationFailed(format!("ConPTY spawn failed: {e}")))
        })
        .await
        .map_err(|e| PtyError::CreationFailed(format!("Task join error: {e}")))??;

        let pid = process.pid();
        debug!("Process spawned with PID: {}", pid);

        let process = Arc::new(Mutex::new(process));
        let output_buffer = Arc::new(Mutex::new(BytesMut::with_capacity(8192)));
        let exit_status = Arc::new(Mutex::new(ExitStatus::Running));
        let should_exit = Arc::new(AtomicBool::new(false));

        // Spawn output reading task
        {
            let process_clone = Arc::clone(&process);
            let output_buffer_clone = Arc::clone(&output_buffer);
            let should_exit_clone = Arc::clone(&should_exit);
            
            task::spawn_blocking(move || {
                // Get reader once at the start
                let mut reader = {
                    let mut proc = process_clone.blocking_lock();
                    match proc.output() {
                        Ok(r) => r,
                        Err(e) => {
                            error!("Failed to get output reader: {}", e);
                            return;
                        }
                    }
                };
                
                let mut temp_buf = vec![0u8; 4096];
                
                loop {
                    // Check exit flag (no lock needed!)
                    if should_exit_clone.load(Ordering::Relaxed) {
                        break;
                    }
                    
                    // Small sleep to avoid busy-waiting and allow flag check
                    std::thread::sleep(std::time::Duration::from_millis(20));
                    
                    // Read WITHOUT holding the process lock
                    match reader.read(&mut temp_buf) {
                        Ok(n) if n > 0 => {
                            let mut buffer = output_buffer_clone.blocking_lock();
                            buffer.extend_from_slice(&temp_buf[..n]);
                        }
                        Ok(_) => {
                            // No data, sleep briefly
                            std::thread::sleep(std::time::Duration::from_millis(10));
                        }
                        Err(e) => {
                            error!("Error reading from ConPTY: {}", e);
                            break;
                        }
                    }
                }
            });
        }

        // Spawn status monitoring task
        {
            let process_clone = Arc::clone(&process);
            let exit_status_clone = Arc::clone(&exit_status);
            
            task::spawn_blocking(move || {
                loop {
                    std::thread::sleep(std::time::Duration::from_millis(100));
                    let proc = process_clone.blocking_lock();
                    if !proc.is_alive() {
                        *exit_status_clone.blocking_lock() = ExitStatus::Exited(0);
                        break;
                    }
                }
            });
        }

        let pty = Self {
            process,
            pid,
            size: Arc::new(Mutex::new(builder.size)),
            exit_status,
            output_buffer,
            should_exit,
        };

        Ok(Box::new(pty))
    }
}

#[async_trait]
impl Pty for WindowsPty {
    async fn write(&mut self, data: &[u8]) -> PtyResult<()> {
        let process = Arc::clone(&self.process);
        let data = data.to_vec();
        
        task::spawn_blocking(move || {
            let mut proc = process.blocking_lock();
            if let Ok(mut writer) = proc.input() {
                writer.write_all(&data)?;
                writer.flush()?;
            }
            Ok::<(), std::io::Error>(())
        })
        .await
        .map_err(|e| PtyError::IoError(std::io::Error::other(e)))??;
        
        Ok(())
    }

    async fn read(&mut self) -> PtyResult<Bytes> {
        let mut buffer = self.output_buffer.lock().await;
        let data = buffer.split().freeze();
        Ok(data)
    }

    async fn resize(&mut self, size: PtySize) -> PtyResult<()> {
        debug!("Resizing ConPTY to {}x{}", size.cols, size.rows);

        let process = Arc::clone(&self.process);
        let cols = size.cols as i16;
        let rows = size.rows as i16;
        
        task::spawn_blocking(move || {
            let mut proc = process.blocking_lock();
            proc.resize(cols, rows)
                .map_err(|e| PtyError::ResizeFailed {
                    cols: cols as u16,
                    rows: rows as u16,
                    reason: e.to_string(),
                })
        })
        .await
        .map_err(|e| PtyError::IoError(std::io::Error::other(e)))??;

        *self.size.lock().await = size;
        Ok(())
    }

    fn pid(&self) -> Option<u32> {
        Some(self.pid)
    }

    async fn is_alive(&self) -> bool {
        matches!(*self.exit_status.lock().await, ExitStatus::Running)
    }

    async fn exit_status(&self) -> ExitStatus {
        *self.exit_status.lock().await
    }

    async fn terminate(&mut self) -> PtyResult<()> {
        debug!("Terminating process with PID: {}", self.pid);
        
        // Signal reading loop to exit FIRST
        self.should_exit.store(true, Ordering::Relaxed);
        
        let process = Arc::clone(&self.process);
        task::spawn_blocking(move || {
            let mut proc = process.blocking_lock();
            proc.exit(0)
                .map_err(|e| PtyError::PlatformError(format!("Termination failed: {e}")))
        })
        .await
        .map_err(|e| PtyError::IoError(std::io::Error::other(e)))??;

        // Update exit status
        *self.exit_status.lock().await = ExitStatus::Exited(0);
        Ok(())
    }

    async fn kill(&mut self) -> PtyResult<()> {
        // On Windows, kill and terminate are the same with ConPTY
        self.terminate().await
    }
}
