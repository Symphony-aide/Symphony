//! Error types for CrossPty terminal operations.

use thiserror::Error;

/// Result type alias for CrossPty operations.
pub type PtyResult<T> = Result<T, PtyError>;

/// Comprehensive error types for PTY operations.
///
/// This enum covers all possible error conditions that can occur during
/// PTY creation, management, and I/O operations across platforms.
#[derive(Error, Debug)]
pub enum PtyError {
	/// Failed to create or initialize a PTY.
	#[error("Failed to create PTY: {0}")]
	CreationFailed(String),

	/// Failed to spawn a process in the PTY.
	#[error("Failed to spawn process '{command}': {source}")]
	ProcessSpawnFailed {
		command: String,
		source: std::io::Error,
	},

	/// I/O operation failed on the PTY.
	#[error("PTY I/O error: {0}")]
	IoError(#[from] std::io::Error),

	/// Failed to resize the PTY.
	#[error("Failed to resize PTY to {cols}x{rows}: {reason}")]
	ResizeFailed {
		cols: u16,
		rows: u16,
		reason: String,
	},

	/// Process exited unexpectedly.
	#[error("Process exited with code {0}")]
	ProcessExited(i32),

	/// Process was terminated by a signal.
	#[error("Process terminated by signal {0}")]
	ProcessTerminated(i32),

	/// PTY has been closed and cannot perform operations.
	#[error("PTY has been closed")]
	PtyClosed,

	/// Platform-specific error occurred.
	#[error("Platform error: {0}")]
	PlatformError(String),

	/// Invalid operation or parameter.
	#[error("Invalid operation: {0}")]
	InvalidOperation(String),
}
