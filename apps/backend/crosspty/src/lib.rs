//! # CrossPty - Symphony's Native Terminal Core
//!
//! A cross-platform pseudo-terminal (PTY) abstraction for Symphony IDE.
//! This is one of Symphony's 6 core built-in features, providing native shell access.
//!
//! ## Architecture
//!
//! CrossPty provides a unified async interface for terminal operations across platforms:
//! - **Windows**: Native ConPTY (Windows 10+) for modern console support
//! - **Unix/Linux/macOS**: POSIX PTY with full process control
//!
//! ## Features
//!
//! - ✅ **Cross-Platform**: ConPTY (Windows) and native PTY (Unix)
//! - ✅ **Full Process Lifecycle**: Spawn, manage, and terminate shell processes
//! - ✅ **Bidirectional I/O**: Async read/write with proper buffering
//! - ✅ **Terminal Resize**: Dynamic terminal dimension updates
//! - ✅ **Signal Handling**: Proper SIGTERM/SIGKILL support
//! - ✅ **Environment Control**: Pass custom environment variables
//!
//! ## Quick Start
//!
//! ```rust,no_run
//! use crosspty::{PtyBuilder, PtySize};
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     // Create a PTY with a shell
//!     let mut pty = PtyBuilder::new()
//!         .command("powershell.exe")
//!         .size(PtySize::new(80, 24))
//!         .spawn()
//!         .await?;
//!     
//!     // Write to the terminal
//!     pty.write(b"echo Hello, Symphony!\n").await?;
//!     
//!     // Read output
//!     let output = pty.read().await?;
//!     println!("Output: {}", String::from_utf8_lossy(&output));
//!     
//!     // Resize the terminal
//!     pty.resize(PtySize::new(120, 30)).await?;
//!     
//!     // Clean shutdown
//!     pty.kill().await?;
//!     
//!     Ok(())
//! }
//! ```
//!
//! ## Platform-Specific Notes
//!
//! ### Windows (ConPTY)
//! - Requires Windows 10 version 1809 or later
//! - Uses native ConPTY API for better performance and compatibility
//! - Supports PowerShell, CMD, and WSL shells
//!
//! ### Unix (PTY)
//! - Uses standard POSIX PTY implementation
//! - Supports bash, zsh, sh, and other Unix shells
//! - Full signal handling (SIGTERM, SIGKILL, SIGWINCH)

use async_trait::async_trait;
use bytes::Bytes;
use std::collections::HashMap;
use std::path::PathBuf;

pub mod error;
pub mod platforms;

pub use error::{PtyError, PtyResult};

/// Terminal dimensions (columns × rows).
///
/// Represents the size of a terminal in character cells.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct PtySize {
	/// Number of columns (character width)
	pub cols: u16,
	/// Number of rows (character height)
	pub rows: u16,
}

impl PtySize {
	/// Create a new terminal size.
	///
	/// # Arguments
	///
	/// * `cols` - Number of columns
	/// * `rows` - Number of rows
	#[must_use]
	pub const fn new(cols: u16, rows: u16) -> Self {
		Self { cols, rows }
	}
}

impl Default for PtySize {
	fn default() -> Self {
		Self::new(80, 24)
	}
}

/// Process exit status.
///
/// Represents how a process terminated.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ExitStatus {
	/// Process exited normally with the given code
	Exited(i32),
	/// Process was terminated by a signal
	Signaled(i32),
	/// Process is still running
	Running,
}

/// Core PTY trait for terminal operations.
///
/// This trait defines the interface for interacting with pseudo-terminals
/// across different platforms. All operations are async and non-blocking.
///
/// # Examples
///
/// ```rust,no_run
/// use crosspty::{Pty, PtySize};
///
/// async fn terminal_interaction(pty: &mut dyn Pty) -> Result<(), Box<dyn std::error::Error>> {
///     // Write command
///     pty.write(b"ls -la\n").await?;
///     
///     // Read output
///     let output = pty.read().await?;
///     
///     // Resize terminal
///     pty.resize(PtySize::new(120, 30)).await?;
///     
///     Ok(())
/// }
/// ```
#[async_trait]
pub trait Pty: Send + Sync {
	/// Write data to the pseudo-terminal's input.
	///
	/// Sends data to the running process's stdin. This is non-blocking
	/// and will return once the data is queued for writing.
	///
	/// # Arguments
	///
	/// * `data` - Byte slice to write to the terminal
	///
	/// # Errors
	///
	/// Returns `PtyError::IoError` if the write fails or PTY is closed.
	async fn write(&mut self, data: &[u8]) -> PtyResult<()>;

	/// Read output from the pseudo-terminal.
	///
	/// Reads available data from the process's stdout/stderr. This is non-blocking
	/// and returns immediately with available data, or an empty buffer if none.
	///
	/// # Returns
	///
	/// Returns a `Bytes` buffer containing the output data.
	///
	/// # Errors
	///
	/// Returns `PtyError::IoError` if reading fails or PTY is closed.
	async fn read(&mut self) -> PtyResult<Bytes>;

	/// Resize the pseudo-terminal dimensions.
	///
	/// Updates the terminal size, which triggers a SIGWINCH signal on Unix
	/// systems, allowing programs to adapt their layout.
	///
	/// # Arguments
	///
	/// * `size` - New terminal dimensions
	///
	/// # Errors
	///
	/// Returns `PtyError::ResizeFailed` if the resize operation fails.
	async fn resize(&mut self, size: PtySize) -> PtyResult<()>;

	/// Get the process ID of the shell running in the PTY.
	///
	/// # Returns
	///
	/// Returns the PID of the spawned process, or `None` if not available.
	fn pid(&self) -> Option<u32>;

	/// Check if the process is still running.
	///
	/// # Returns
	///
	/// Returns `true` if the process is alive, `false` otherwise.
	fn is_alive(&self) -> bool;

	/// Get the exit status of the process.
	///
	/// # Returns
	///
	/// Returns the exit status if the process has terminated, or `Running`.
	fn exit_status(&self) -> ExitStatus;

	/// Gracefully terminate the process.
	///
	/// Sends SIGTERM on Unix or closes the console on Windows.
	/// The process may take time to shut down.
	///
	/// # Errors
	///
	/// Returns `PtyError::PlatformError` if termination fails.
	async fn terminate(&mut self) -> PtyResult<()>;

	/// Forcefully kill the process.
	///
	/// Sends SIGKILL on Unix or terminates the process on Windows.
	/// This is an immediate, forceful shutdown.
	///
	/// # Errors
	///
	/// Returns `PtyError::PlatformError` if the kill operation fails.
	async fn kill(&mut self) -> PtyResult<()>;
}

/// Builder for creating PTY instances with custom configuration.
///
/// Provides a fluent interface for configuring and spawning PTY processes.
///
/// # Examples
///
/// ```rust,no_run
/// use crosspty::{PtyBuilder, PtySize};
///
/// # async fn example() -> Result<(), Box<dyn std::error::Error>> {
/// let pty = PtyBuilder::new()
///     .command("bash")
///     .args(vec!["-l".to_string()])
///     .env("TERM", "xterm-256color")
///     .size(PtySize::new(100, 30))
///     .working_dir("/home/user")
///     .spawn()
///     .await?;
/// # Ok(())
/// # }
/// ```
#[derive(Debug, Clone)]
pub struct PtyBuilder {
	/// Command to execute in the PTY
	pub command: String,
	/// Command-line arguments
	pub args: Vec<String>,
	/// Environment variables
	pub env: HashMap<String, String>,
	/// Terminal size
	pub size: PtySize,
	/// Working directory
	pub working_dir: Option<PathBuf>,
}

impl PtyBuilder {
	/// Create a new `PtyBuilder` with default settings.
	#[must_use]
	pub fn new() -> Self {
		Self {
			command: Self::default_shell(),
			args: Vec::new(),
			env: HashMap::new(),
			size: PtySize::default(),
			working_dir: None,
		}
	}

	/// Set the command to execute.
	#[must_use]
	pub fn command<S: Into<String>>(mut self, cmd: S) -> Self {
		self.command = cmd.into();
		self
	}

	/// Set command-line arguments.
	#[must_use]
	pub fn args(mut self, args: Vec<String>) -> Self {
		self.args = args;
		self
	}

	/// Add a single argument.
	#[must_use]
	pub fn arg<S: Into<String>>(mut self, arg: S) -> Self {
		self.args.push(arg.into());
		self
	}

	/// Set an environment variable.
	#[must_use]
	pub fn env<K: Into<String>, V: Into<String>>(mut self, key: K, value: V) -> Self {
		self.env.insert(key.into(), value.into());
		self
	}

	/// Set the terminal size.
	#[must_use]
	pub fn size(mut self, size: PtySize) -> Self {
		self.size = size;
		self
	}

	/// Set the working directory.
	#[must_use]
	pub fn working_dir<P: Into<PathBuf>>(mut self, dir: P) -> Self {
		self.working_dir = Some(dir.into());
		self
	}

	/// Spawn the PTY with the configured settings.
	///
	/// Creates and starts a new PTY process with the specified configuration.
	///
	/// # Errors
	///
	/// Returns `PtyError::CreationFailed` or `PtyError::ProcessSpawnFailed` on failure.
	pub async fn spawn(self) -> PtyResult<Box<dyn Pty>> {
		platforms::spawn(self).await
	}

	/// Get the default shell for the current platform.
	fn default_shell() -> String {
		#[cfg(windows)]
		{
			std::env::var("COMSPEC").unwrap_or_else(|_| "powershell.exe".to_string())
		}
		#[cfg(unix)]
		{
			std::env::var("SHELL").unwrap_or_else(|_| "/bin/sh".to_string())
		}
	}
}

impl Default for PtyBuilder {
	fn default() -> Self {
		Self::new()
	}
}
