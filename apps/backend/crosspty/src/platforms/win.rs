//! Windows ConPTY implementation.
//!
//! This module provides a Windows-specific PTY implementation using the
//! native ConPTY API available in Windows 10 version 1809 and later.

use async_trait::async_trait;
use bytes::{Bytes, BytesMut};
use conpty::Process as ConptyProcess;
use std::io::{Read, Write};
use std::process::Command;
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::task;
use tracing::{debug, error};

use crate::{ExitStatus, Pty, PtyBuilder, PtyError, PtyResult, PtySize};

/// Windows ConPTY implementation.
///
/// Uses native Windows ConPTY for modern console support with full
/// process lifecycle management and bidirectional I/O.
pub struct WindowsPty {
    /// The ConPTY process instance
    process: Arc<Mutex<ConptyProcess>>,
    /// Process ID
    pid: u32,
    /// Current terminal size
    size: Arc<Mutex<PtySize>>,
    /// Output buffer for reading
    output_buffer: Arc<Mutex<BytesMut>>,
}

impl WindowsPty {
    /// Spawn a new Windows ConPTY with the given configuration.
    ///
    /// # Arguments
    ///
    /// * `builder` - PTY configuration
    ///
    /// # Returns
    ///
    /// Returns a boxed `Pty` trait object.
    ///
    /// # Errors
    ///
    /// Returns `PtyError::CreationFailed` if ConPTY creation fails,
    /// or `PtyError::ProcessSpawnFailed` if process spawning fails.
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

        // Spawn output reading task
        {
            let process_clone = Arc::clone(&process);
            let output_buffer_clone = Arc::clone(&output_buffer);
            
            task::spawn_blocking(move || {
                let mut proc = process_clone.blocking_lock();
                if let Ok(mut reader) = proc.output() {
                    let mut buf = vec![0u8; 4096];
                    loop {
                        match reader.read(&mut buf) {
                            Ok(0) => break, // EOF
                            Ok(n) => {
                                let mut buffer = output_buffer_clone.blocking_lock();
                                buffer.extend_from_slice(&buf[..n]);
                            }
                            Err(e) => {
                                error!("Error reading from ConPTY: {}", e);
                                break;
                            }
                        }
                    }
                }
            });
        }

        let pty = Self {
            process,
            pid,
            size: Arc::new(Mutex::new(builder.size)),
            output_buffer,
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

    fn is_alive(&self) -> bool {
        self.process.blocking_lock().is_alive()
    }

    fn exit_status(&self) -> ExitStatus {
        if self.is_alive() {
            ExitStatus::Running
        } else {
            // Process has exited, assume normal exit
            ExitStatus::Exited(0)
        }
    }

    async fn terminate(&mut self) -> PtyResult<()> {
        debug!("Terminating process with PID: {}", self.pid);
        
        let process = Arc::clone(&self.process);
        task::spawn_blocking(move || {
            let mut proc = process.blocking_lock();
            proc.exit(0)
                .map_err(|e| PtyError::PlatformError(format!("Termination failed: {e}")))
        })
        .await
        .map_err(|e| PtyError::IoError(std::io::Error::other(e)))??;

        Ok(())
    }

    async fn kill(&mut self) -> PtyResult<()> {
        // On Windows, kill and terminate are the same with ConPTY
        self.terminate().await
    }
}
