//! Error types for PTY operations.
//!
//! This module defines all possible errors that can occur when working with
//! pseudo-terminals, providing detailed context for debugging and error handling.

use thiserror::Error;

/// Result type alias for PTY operations.
///
/// This is a convenience type that uses [`PtyError`] as the error type.
///
/// # Examples
///
/// ```
/// use crosspty::{PtyResult, PtyError};
///
/// fn example() -> PtyResult<()> {
///     // Your code here
///     Ok(())
/// }
/// ```
pub type PtyResult<T> = Result<T, PtyError>;
/// Errors that can occur during PTY operations.
///
/// This enum represents all possible error conditions when creating, managing,
/// or interacting with pseudo-terminals. Each variant provides specific context
/// about what went wrong.
///
/// # Examples
///
/// ```
/// use crosspty::{PtyError, PtyBuilder};
///
/// # #[tokio::main]
/// # async fn main() {
/// match PtyBuilder::new().command("nonexistent").spawn().await {
///     Ok(pty) => println!("PTY created"),
///     Err(PtyError::CreationFailed(msg)) => eprintln!("Creation failed: {}", msg),
///     Err(e) => eprintln!("Other error: {}", e),
/// }
/// # }
/// ```
#[derive(Error, Debug)]
pub enum PtyError {
	/// PTY creation failed.
	///
	/// This error occurs when the underlying platform fails to create a new
	/// pseudo-terminal. Common causes include:
	/// - Insufficient system resources
	/// - Permission issues
	/// - Platform-specific limitations reached
	#[error("Failed to create PTY: {0}")]
	CreationFailed(String),

	/// Process failed to spawn.
	///
	/// This error occurs when the specified command cannot be executed.
	/// Common causes include:
	/// - Command not found in PATH
	/// - Insufficient permissions to execute
	/// - Invalid command syntax
	#[error("Failed to spawn process '{command}': {source}")]
	ProcessSpawnFailed {
		/// The command that failed to spawn
		command: String,
		/// The underlying I/O error
		source: std::io::Error,
	},

	/// General I/O error.
	///
	/// Wraps standard I/O errors that occur during PTY operations such as
	/// reading, writing, or pipe operations. This is automatically converted
	/// from [`std::io::Error`] using the `From` trait.
	#[error("PTY I/O error: {0}")]
	IoError(#[from] std::io::Error),

	/// Terminal resize operation failed.
	///
	/// This error occurs when attempting to change the terminal dimensions.
	/// The PTY may continue to work with its previous size.
	#[error("Failed to resize PTY to {cols}x{rows}: {reason}")]
	ResizeFailed {
		/// Attempted width in columns
		cols: u16,
		/// Attempted height in rows
		rows: u16,
		/// Detailed reason for failure
		reason: String,
	},

	/// Process terminated with an exit code.
	///
	/// The child process has exited. Exit code 0 typically indicates success,
	/// while non-zero values indicate errors. This is not necessarily a failure
	/// condition, but indicates the process is no longer running.
	#[error("Process exited with code {0}")]
	ProcessExited(i32),

	/// Process was killed by a signal (Unix only).
	///
	/// The process was terminated by a signal rather than exiting normally.
	/// The value is the signal number (e.g., 9 for SIGKILL, 15 for SIGTERM).
	#[error("Process terminated by signal {0}")]
	ProcessTerminated(i32),

	/// PTY has been closed and is no longer usable.
	///
	/// Attempting to perform operations on a closed PTY will result in this error.
	/// Once closed, a new PTY must be created for further operations.
	#[error("PTY has been closed")]
	PtyClosed,

	/// Platform-specific error.
	///
	/// An error specific to the underlying platform (Windows ConPTY or Unix PTY).
	/// Contains platform-specific error details.
	#[error("Platform error: {0}")]
	PlatformError(String),

	/// Invalid operation attempted.
	///
	/// The requested operation is not valid in the current state or with
	/// the given parameters. The message provides details about what was invalid.
	#[error("Invalid operation: {0}")]
	InvalidOperation(String),
}
