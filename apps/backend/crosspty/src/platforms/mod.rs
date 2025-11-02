//! Platform-specific pseudo-terminal implementations.
//!
//! This module provides the low-level platform-specific implementations of the
//! [`Pty`] trait. The correct implementation is automatically selected
//! at compile time based on the target platform:
//!
//! - **Windows**: Uses ConPTY (Windows 10 version 1809+) via the `win` module
//! - **Unix**: Uses POSIX PTY APIs via the `unix` module
//!
//! # Platform Support
//!
//! ## Windows (ConPTY)
//!
//! ConPTY provides native pseudo-console support on modern Windows systems.
//! Requires Windows 10 1809 (October 2018 Update) or later.
//!
//! ## Unix (POSIX PTY)
//!
//! Uses standard POSIX PTY APIs available on Linux, macOS, and other Unix-like
//! systems. Provides full terminal control including signal handling.
//!
//! # Examples
//!
//! ```no_run
//! use crosspty::PtyBuilder;
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     // Platform is automatically detected
//!     let pty = PtyBuilder::new().spawn().await?;
//!     Ok(())
//! }
//! ```

use crate::{Pty, PtyBuilder, PtyResult};

#[cfg(windows)]
pub mod win;

#[cfg(unix)]
pub mod unix;

/// Spawns a PTY using the platform-specific implementation.
///
/// This function automatically selects the correct platform implementation
/// (Windows ConPTY or Unix POSIX PTY) at compile time and creates a new
/// pseudo-terminal with the given configuration.
///
/// # Arguments
///
/// * `builder` - Configuration for the PTY
///
/// # Returns
///
/// Returns a boxed [`Pty`] trait object that provides a unified
/// interface regardless of the underlying platform.
///
/// # Errors
///
/// Returns an error if:
/// - [`PtyError::CreationFailed`](crate::PtyError::CreationFailed) - PTY creation fails
/// - [`PtyError::ProcessSpawnFailed`](crate::PtyError::ProcessSpawnFailed) - Process cannot be started
///
/// # Examples
///
/// ```no_run
/// use crosspty::{PtyBuilder, PtySize};
///
/// #[tokio::main]
/// async fn main() -> Result<(), Box<dyn std::error::Error>> {
///     let pty = PtyBuilder::new()
///         .size(PtySize::new(80, 24))
///         .spawn()
///         .await?;
///     Ok(())
/// }
/// ```
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
