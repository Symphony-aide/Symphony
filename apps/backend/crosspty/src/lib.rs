//! Cross-platform pseudo-terminal (PTY) abstraction for Symphony IDE.
//!
//! This library provides a unified interface for creating and managing pseudo-terminals
//! across different operating systems. On Windows, it uses ConPTY (Windows 10 1809+),
//! and on Unix-like systems (Linux, macOS), it uses POSIX PTY.
//!
//! # Overview
//!
//! A pseudo-terminal (PTY) is a pair of virtual devices that provide bidirectional
//! communication, typically used to run terminal-based applications. This crate abstracts
//! the platform-specific details, providing a consistent async API.
//!
//! # Features
//!
//! - **Cross-platform**: Works on Windows (ConPTY) and Unix (POSIX PTY)
//! - **Async/await**: Built on tokio for non-blocking I/O
//! - **Type-safe**: Strong typing with comprehensive error handling
//! - **Process lifecycle**: Full control over spawned processes
//!
//! # Examples
//!
//! Basic usage:
//!
//! ```no_run
//! use crosspty::{PtyBuilder, PtySize};
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     // Create a new PTY with default shell
//!     let mut pty = PtyBuilder::new()
//!         .size(PtySize::new(80, 24))
//!         .spawn()
//!         .await?;
//!
//!     // Write command
//!     pty.write(b"echo Hello\n").await?;
//!
//!     // Read output
//!     let output = pty.read().await?;
//!     println!("Output: {}", String::from_utf8_lossy(&output));
//!
//!     // Clean up
//!     pty.terminate().await?;
//!     Ok(())
//! }
//! ```

use async_trait::async_trait;
use bytes::Bytes;
use std::collections::HashMap;
use std::path::PathBuf;

pub mod error;
pub mod platforms;

pub use error::{PtyError, PtyResult};

/// Terminal dimensions in character cells.
///
/// Represents the size of a pseudo-terminal window measured in columns (width)
/// and rows (height) of text characters. This is used when creating a PTY or
/// resizing an existing terminal.
///
/// # Examples
///
/// ```
/// use crosspty::PtySize;
///
/// // Create standard 80x24 terminal
/// let size = PtySize::new(80, 24);
/// assert_eq!(size.cols, 80);
/// assert_eq!(size.rows, 24);
///
/// // Create wide terminal
/// let wide = PtySize::new(120, 30);
/// ```
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct PtySize {
	/// Terminal width in character columns
	pub cols: u16,
	/// Terminal height in character rows
	pub rows: u16,
}

impl PtySize {
	/// Creates a new terminal size with the specified dimensions.
	///
	/// # Arguments
	///
	/// * `cols` - Width in character columns (typically 80-120)
	/// * `rows` - Height in character rows (typically 24-50)
	///
	/// # Examples
	///
	/// ```
	/// use crosspty::PtySize;
	///
	/// let size = PtySize::new(80, 24);
	/// assert_eq!(size.cols, 80);
	/// ```
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

/// Exit status of a PTY process.
///
/// Indicates how a process terminated or whether it's still running.
/// This follows Unix conventions where 0 indicates success and non-zero
/// values indicate errors.
///
/// # Examples
///
/// ```
/// use crosspty::ExitStatus;
///
/// let status = ExitStatus::Exited(0);
/// assert_eq!(status, ExitStatus::Exited(0));
/// ```
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ExitStatus {
	/// Process exited normally with the given exit code
	///
	/// Exit code 0 typically indicates success, while non-zero values
	/// indicate various error conditions.
	Exited(i32),
	
	/// Process was terminated by a signal (Unix only)
	///
	/// The value is the signal number that caused termination.
	Signaled(i32),
	
	/// Process is still running
	Running,
}

/// Core trait for pseudo-terminal operations.
///
/// Provides a unified interface for interacting with pseudo-terminals across
/// different platforms. All operations are asynchronous and built on tokio.
///
/// # Examples
///
/// ```no_run
/// use crosspty::{Pty, PtyBuilder, PtySize};
///
/// #[tokio::main]
/// async fn main() -> Result<(), Box<dyn std::error::Error>> {
///     let mut pty = PtyBuilder::new().spawn().await?;
///     
///     // Check if process is running
///     assert!(pty.is_alive().await);
///     
///     // Write and read
///     pty.write(b"ls\n").await?;
///     let output = pty.read().await?;
///     
///     // Clean shutdown
///     pty.terminate().await?;
///     Ok(())
/// }
/// ```
#[async_trait]
pub trait Pty: Send + Sync {
	/// Writes data to the PTY's input stream.
	///
	/// This sends bytes to the pseudo-terminal, which the child process
	/// can read from its standard input.
	///
	/// # Arguments
	///
	/// * `data` - Bytes to write to the terminal
	///
	/// # Errors
	///
	/// Returns [`PtyError::IoError`] if the write operation fails or if the
	/// process has already terminated.
	///
	/// # Examples
	///
	/// ```no_run
	/// # use crosspty::PtyBuilder;
	/// # #[tokio::main]
	/// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
	/// let mut pty = PtyBuilder::new().spawn().await?;
	/// pty.write(b"echo hello\n").await?;
	/// # Ok(())
	/// # }
	/// ```
	async fn write(&mut self, data: &[u8]) -> PtyResult<()>;

	/// Reads available output from the PTY.
	///
	/// Returns all data currently available in the output buffer. This is
	/// non-blocking and returns immediately with whatever data is available.
	///
	/// # Returns
	///
	/// A [`Bytes`] buffer containing the output. May be empty if no data
	/// is currently available.
	///
	/// # Errors
	///
	/// Returns [`PtyError::IoError`] if reading fails.
	///
	/// # Examples
	///
	/// ```no_run
	/// # use crosspty::PtyBuilder;
	/// # #[tokio::main]
	/// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
	/// let mut pty = PtyBuilder::new().spawn().await?;
	/// let output = pty.read().await?;
	/// println!("Output: {}", String::from_utf8_lossy(&output));
	/// # Ok(())
	/// # }
	/// ```
	async fn read(&mut self) -> PtyResult<Bytes>;

	/// Resizes the terminal to new dimensions.
	///
	/// Updates the terminal size, which triggers a SIGWINCH signal on Unix
	/// systems, allowing terminal applications to adapt to the new size.
	///
	/// # Arguments
	///
	/// * `size` - New terminal dimensions
	///
	/// # Errors
	///
	/// Returns [`PtyError::ResizeFailed`] if the resize operation fails.
	///
	/// # Examples
	///
	/// ```no_run
	/// # use crosspty::{PtyBuilder, PtySize};
	/// # #[tokio::main]
	/// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
	/// let mut pty = PtyBuilder::new().spawn().await?;
	/// pty.resize(PtySize::new(120, 30)).await?;
	/// # Ok(())
	/// # }
	/// ```
	async fn resize(&mut self, size: PtySize) -> PtyResult<()>;

	/// Returns the process ID of the child process.
	///
	/// # Returns
	///
	/// `Some(pid)` if the process was successfully spawned, `None` otherwise.
	fn pid(&self) -> Option<u32>;

	/// Checks if the process is still running.
	///
	/// # Returns
	///
	/// `true` if the process is running, `false` if it has terminated.
	async fn is_alive(&self) -> bool;

	/// Returns the current exit status of the process.
	///
	/// # Returns
	///
	/// The current [`ExitStatus`] of the process.
	async fn exit_status(&self) -> ExitStatus;

	/// Gracefully terminates the process.
	///
	/// Attempts to terminate the process cleanly, allowing it to perform
	/// cleanup operations. On Unix, this typically sends SIGTERM.
	///
	/// # Errors
	///
	/// Returns [`PtyError::PlatformError`] if termination fails.
	async fn terminate(&mut self) -> PtyResult<()>;

	/// Forcefully kills the process.
	///
	/// Immediately terminates the process without cleanup. On Unix, this
	/// sends SIGKILL. Use [`terminate`](Pty::terminate) for graceful shutdown.
	///
	/// # Errors
	///
	/// Returns [`PtyError::PlatformError`] if the kill operation fails.
	async fn kill(&mut self) -> PtyResult<()>;
}

/// Builder for configuring and spawning PTY instances.
///
/// Provides a fluent interface for creating pseudo-terminals with custom
/// configurations. Call [`spawn`](PtyBuilder::spawn) to create the PTY.
///
/// # Examples
///
/// ```no_run
/// use crosspty::{PtyBuilder, PtySize};
/// use std::path::PathBuf;
///
/// #[tokio::main]
/// async fn main() -> Result<(), Box<dyn std::error::Error>> {
///     let pty = PtyBuilder::new()
///         .command("bash")
///         .args(vec!["-l".to_string()])
///         .env("TERM", "xterm-256color")
///         .size(PtySize::new(120, 30))
///         .working_dir(PathBuf::from("/home/user"))
///         .spawn()
///         .await?;
///     Ok(())
/// }
/// ```
#[derive(Debug, Clone)]
pub struct PtyBuilder {
	/// Command to execute in the PTY
	pub command: String,
	/// Arguments to pass to the command
	pub args: Vec<String>,
	/// Environment variables for the process
	pub env: HashMap<String, String>,
	/// Initial terminal size
	pub size: PtySize,
	/// Working directory for the process
	pub working_dir: Option<PathBuf>,
}

impl PtyBuilder {
	/// Creates a new PTY builder with default settings.
	///
	/// Defaults:
	/// - Command: Platform default shell (cmd.exe on Windows, /bin/sh on Unix)
	/// - Args: Empty
	/// - Env: Inherits current environment
	/// - Size: 80x24
	/// - Working directory: None (uses current directory)
	///
	/// # Examples
	///
	/// ```
	/// use crosspty::PtyBuilder;
	///
	/// let builder = PtyBuilder::new();
	/// ```
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

	/// Sets the command to execute in the PTY.
	///
	/// # Examples
	///
	/// ```
	/// use crosspty::PtyBuilder;
	///
	/// let builder = PtyBuilder::new().command("bash");
	/// ```
	#[must_use]
	pub fn command<S: Into<String>>(mut self, cmd: S) -> Self {
		self.command = cmd.into();
		self
	}

	/// Sets the arguments to pass to the command.
	///
	/// # Examples
	///
	/// ```
	/// use crosspty::PtyBuilder;
	///
	/// let builder = PtyBuilder::new()
	///     .command("bash")
	///     .args(vec!["-l".to_string(), "-c".to_string()]);
	/// ```
	#[must_use]
	pub fn args(mut self, args: Vec<String>) -> Self {
		self.args = args;
		self
	}

	/// Adds a single argument to the command.
	///
	/// # Examples
	///
	/// ```
	/// use crosspty::PtyBuilder;
	///
	/// let builder = PtyBuilder::new()
	///     .command("bash")
	///     .arg("-l")
	///     .arg("-c");
	/// ```
	#[must_use]
	pub fn arg<S: Into<String>>(mut self, arg: S) -> Self {
		self.args.push(arg.into());
		self
	}

	/// Sets an environment variable for the process.
	///
	/// # Examples
	///
	/// ```
	/// use crosspty::PtyBuilder;
	///
	/// let builder = PtyBuilder::new()
	///     .env("TERM", "xterm-256color")
	///     .env("LANG", "en_US.UTF-8");
	/// ```
	#[must_use]
	pub fn env<K: Into<String>, V: Into<String>>(mut self, key: K, value: V) -> Self {
		self.env.insert(key.into(), value.into());
		self
	}

	/// Sets the initial terminal size.
	///
	/// # Examples
	///
	/// ```
	/// use crosspty::{PtyBuilder, PtySize};
	///
	/// let builder = PtyBuilder::new().size(PtySize::new(120, 30));
	/// ```
	#[must_use]
	pub fn size(mut self, size: PtySize) -> Self {
		self.size = size;
		self
	}

	/// Sets the working directory for the process.
	///
	/// # Examples
	///
	/// ```
	/// use crosspty::PtyBuilder;
	/// use std::path::PathBuf;
	///
	/// let builder = PtyBuilder::new()
	///     .working_dir(PathBuf::from("/home/user"));
	/// ```
	#[must_use]
	pub fn working_dir<P: Into<PathBuf>>(mut self, dir: P) -> Self {
		self.working_dir = Some(dir.into());
		self
	}

	/// Spawns the PTY with the configured settings.
	///
	/// Creates a new pseudo-terminal and starts the process. The returned
	/// [`Pty`] trait object provides methods for interacting with the terminal.
	///
	/// # Returns
	///
	/// A boxed [`Pty`] trait object on success.
	///
	/// # Errors
	///
	/// Returns an error if:
	/// - [`PtyError::CreationFailed`] - PTY creation fails
	/// - [`PtyError::ProcessSpawnFailed`] - Process cannot be started
	///
	/// # Examples
	///
	/// ```no_run
	/// use crosspty::PtyBuilder;
	///
	/// #[tokio::main]
	/// async fn main() -> Result<(), Box<dyn std::error::Error>> {
	///     let pty = PtyBuilder::new().spawn().await?;
	///     Ok(())
	/// }
	/// ```
	pub async fn spawn(self) -> PtyResult<Box<dyn Pty>> {
		platforms::spawn(self).await
	}

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
