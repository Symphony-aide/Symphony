//! Platform-specific PTY implementations.
//!
//! This module provides platform-specific implementations of the PTY trait:
//! - **Windows**: ConPTY-based implementation
//! - **Unix**: POSIX PTY-based implementation

use crate::{Pty, PtyBuilder, PtyResult};

#[cfg(windows)]
pub mod win;

#[cfg(unix)]
pub mod unix;

/// Spawn a PTY with the given configuration.
///
/// This function selects the appropriate platform implementation and
/// creates a new PTY instance.
///
/// # Arguments
///
/// * `builder` - Configuration for the PTY
///
/// # Returns
///
/// Returns a boxed `Pty` trait object on success.
///
/// # Errors
///
/// Returns `PtyError` if PTY creation or process spawning fails.
pub async fn spawn(builder: PtyBuilder) -> PtyResult<Box<dyn Pty>> {
	#[cfg(windows)]
	{
		win::WindowsPty::spawn(builder).await
	}

	#[cfg(unix)]
	{
		unix::UnixPty::spawn(builder).await
	}
}
