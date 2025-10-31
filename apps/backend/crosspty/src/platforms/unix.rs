//! Unix PTY implementation.
//!
//! This module provides a Unix-specific PTY implementation using POSIX
//! PTY APIs via the `nix` crate, supporting Linux, macOS, and other
//! Unix-like systems.

use async_trait::async_trait;
use bytes::{Bytes, BytesMut};
use nix::errno::Errno;
use nix::pty::{openpty, OpenptyResult, Winsize};
use nix::sys::signal::{kill, Signal};
use nix::sys::wait::{waitpid, WaitPidFlag, WaitStatus};
use nix::unistd::{close, dup2, execve, fork, setsid, ForkResult, Pid};
use std::env;
use std::ffi::CString;
use std::os::unix::io::{AsRawFd, RawFd};
use std::path::Path;
use std::sync::Arc;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::sync::Mutex;
use tracing::{debug, error, warn};

use crate::{ExitStatus, Pty, PtyBuilder, PtyError, PtyResult, PtySize};

/// Unix PTY implementation using POSIX PTY.
///
/// Provides full process lifecycle management with signal handling,
/// bidirectional I/O, and proper terminal control.
pub struct UnixPty {
	/// Master PTY file descriptor
	master_fd: Arc<Mutex<RawFd>>,
	/// Process ID of the shell
	pid: Pid,
	/// Current terminal size
	size: Arc<Mutex<PtySize>>,
	/// Exit status
	exit_status: Arc<Mutex<ExitStatus>>,
	/// Output buffer for reading
	output_buffer: Arc<Mutex<BytesMut>>,
}

impl UnixPty {
	/// Spawn a new Unix PTY with the given configuration.
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
	/// Returns `PtyError::CreationFailed` if PTY creation fails,
	/// or `PtyError::ProcessSpawnFailed` if process spawning fails.
	pub async fn spawn(builder: PtyBuilder) -> PtyResult<Box<dyn Pty>> {
		debug!(
			"Spawning Unix PTY: command={}, args={:?}, size={:?}",
			builder.command, builder.args, builder.size
		);

		// Create PTY with window size
		let winsize = Winsize {
			ws_row: builder.size.rows,
			ws_col: builder.size.cols,
			ws_xpixel: 0,
			ws_ypixel: 0,
		};

		let OpenptyResult { master, slave } = openpty(Some(&winsize), None)
			.map_err(|e| PtyError::CreationFailed(format!("openpty failed: {e}")))?;

		// Fork process
		match unsafe { fork() } {
			Ok(ForkResult::Parent { child }) => {
				// Parent process
				debug!("Forked child process with PID: {}", child);

				// Close slave FD in parent
				let _ = close(slave);

				// Setup async reading
				let output_buffer = Arc::new(Mutex::new(BytesMut::with_capacity(8192)));
				let output_buffer_clone = Arc::clone(&output_buffer);
				let master_fd_clone = master;

				tokio::spawn(async move {
					let mut file = tokio::fs::File::from_std(unsafe {
						std::fs::File::from_raw_fd(master_fd_clone)
					});
					let mut buf = vec![0u8; 4096];

					loop {
						match file.read(&mut buf).await {
							Ok(0) => break, // EOF
							Ok(n) => {
								let mut buffer = output_buffer_clone.lock().await;
								buffer.extend_from_slice(&buf[..n]);
							},
							Err(e) => {
								error!("Error reading from PTY: {}", e);
								break;
							},
						}
					}
				});

				let pty = Self {
					master_fd: Arc::new(Mutex::new(master)),
					pid: child,
					size: Arc::new(Mutex::new(builder.size)),
					exit_status: Arc::new(Mutex::new(ExitStatus::Running)),
					output_buffer,
				};

				// Spawn status monitoring task
				let pid = child;
				let exit_status = Arc::clone(&pty.exit_status);
				tokio::spawn(async move {
					loop {
						tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
						match waitpid(pid, Some(WaitPidFlag::WNOHANG)) {
							Ok(WaitStatus::Exited(_, code)) => {
								*exit_status.lock().await = ExitStatus::Exited(code);
								debug!("Process {} exited with code {}", pid, code);
								break;
							},
							Ok(WaitStatus::Signaled(_, sig, _)) => {
								*exit_status.lock().await = ExitStatus::Signaled(sig as i32);
								debug!("Process {} terminated by signal {:?}", pid, sig);
								break;
							},
							Ok(WaitStatus::StillAlive) => {
								// Process still running
								continue;
							},
							Ok(_) => continue,
							Err(Errno::ECHILD) => {
								// Process no longer exists
								break;
							},
							Err(e) => {
								error!("waitpid error: {}", e);
								break;
							},
						}
					}
				});

				Ok(Box::new(pty))
			},
			Ok(ForkResult::Child) => {
				// Child process - setup and exec

				// Close master FD in child
				let _ = close(master);

				// Create new session
				setsid().expect("setsid failed");

				// Redirect stdio to slave PTY
				dup2(slave, 0).expect("dup2 stdin failed");
				dup2(slave, 1).expect("dup2 stdout failed");
				dup2(slave, 2).expect("dup2 stderr failed");

				// Close slave if it's not one of the stdio fds
				if slave > 2 {
					let _ = close(slave);
				}

				// Set working directory
				if let Some(cwd) = &builder.working_dir {
					if env::set_current_dir(cwd).is_err() {
						error!("Failed to set working directory");
					}
				}

				// Set environment variables
				for (key, value) in &builder.env {
					env::set_var(key, value);
				}

				// Prepare command and args
				let command = CString::new(builder.command.as_str()).expect("CString failed");
				let mut args_vec: Vec<CString> = vec![command.clone()];
				for arg in &builder.args {
					args_vec.push(CString::new(arg.as_str()).expect("CString failed"));
				}

				// Get current environment
				let env_vars: Vec<CString> = env::vars()
					.filter_map(|(k, v)| CString::new(format!("{}={}", k, v)).ok())
					.collect();

				// Execute command
				execve(&command, &args_vec, &env_vars).expect("execve failed");

				// Should never reach here
				unreachable!();
			},
			Err(e) => {
				let _ = close(master);
				let _ = close(slave);
				Err(PtyError::CreationFailed(format!("fork failed: {e}")))
			},
		}
	}
}

#[async_trait]
impl Pty for UnixPty {
	async fn write(&mut self, data: &[u8]) -> PtyResult<()> {
		let master_fd = *self.master_fd.lock().await;
		let mut file = tokio::fs::File::from_std(unsafe { std::fs::File::from_raw_fd(master_fd) });
		file.write_all(data).await?;
		file.flush().await?;
		// Prevent the file from closing the FD
		std::mem::forget(file);
		Ok(())
	}

	async fn read(&mut self) -> PtyResult<Bytes> {
		let mut buffer = self.output_buffer.lock().await;
		let data = buffer.split().freeze();
		Ok(data)
	}

	async fn resize(&mut self, size: PtySize) -> PtyResult<()> {
		debug!("Resizing PTY to {}x{}", size.cols, size.rows);

		let master_fd = *self.master_fd.lock().await;
		let winsize = Winsize {
			ws_row: size.rows,
			ws_col: size.cols,
			ws_xpixel: 0,
			ws_ypixel: 0,
		};

		unsafe {
			let result = libc::ioctl(master_fd, libc::TIOCSWINSZ, &winsize);
			if result != 0 {
				return Err(PtyError::ResizeFailed {
					cols: size.cols,
					rows: size.rows,
					source: "ioctl TIOCSWINSZ failed".to_string(),
				});
			}
		}

		// Send SIGWINCH to notify process of size change
		let _ = kill(self.pid, Signal::SIGWINCH);

		*self.size.lock().await = size;
		Ok(())
	}

	fn pid(&self) -> Option<u32> {
		Some(self.pid.as_raw() as u32)
	}

	fn is_alive(&self) -> bool {
		matches!(*self.exit_status.blocking_lock(), ExitStatus::Running)
	}

	fn exit_status(&self) -> ExitStatus {
		*self.exit_status.blocking_lock()
	}

	async fn terminate(&mut self) -> PtyResult<()> {
		debug!("Sending SIGTERM to process {}", self.pid);

		kill(self.pid, Signal::SIGTERM)
			.map_err(|e| PtyError::PlatformError(format!("Failed to send SIGTERM: {e}")))?;

		// Wait a bit for graceful shutdown
		tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

		Ok(())
	}

	async fn kill(&mut self) -> PtyResult<()> {
		debug!("Sending SIGKILL to process {}", self.pid);

		kill(self.pid, Signal::SIGKILL)
			.map_err(|e| PtyError::PlatformError(format!("Failed to send SIGKILL: {e}")))?;

		Ok(())
	}
}

impl Drop for UnixPty {
	fn drop(&mut self) {
		if let Ok(master_fd) = self.master_fd.try_lock() {
			let _ = close(*master_fd);
		}
	}
}
