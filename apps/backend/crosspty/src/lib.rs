//! # CrossPty
//!
//! A cross-platform abstraction for creating and managing pseudo-terminals (PTYs).
//! This crate provides a unified interface for PTY operations across Windows and Unix-like systems.
//!
//! ## Features
//!
//! - **Cross-Platform Support**: Works on Windows (using WinPTY) and Unix-like systems
//! - **Async Interface**: All operations are asynchronous using tokio
//! - **Simple API**: Easy-to-use trait-based interface for PTY management
//!
//! ## Platform Support
//!
//! - **Windows**: Uses WinPTY for pseudo-terminal emulation
//! - **Unix/Linux/macOS**: Uses native PTY support
//!
//! ## Quick Start
//!
//! ```rust,no_run
//! use crosspty::Pty;
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     let mut pty = crosspty::platforms::launch_platform_pty(Default::default())?;
//!     
//!     // Write a command to the PTY
//!     pty.write("echo Hello, World!\n").await?;
//!     
//!     // Resize the PTY
//!     pty.resize((80, 24)).await?;
//!     
//!     Ok(())
//! }
//! ```

use async_trait::async_trait;

pub mod platforms;

/// Trait defining the interface for pseudo-terminal operations.
///
/// This trait provides an async interface for interacting with PTYs across different platforms.
/// Implementations handle platform-specific details while providing a consistent API.
///
/// # Examples
///
/// ```rust,no_run
/// use crosspty::Pty;
///
/// async fn interact_with_pty<P: Pty>(pty: &P) -> Result<(), String> {
///     // Send a command
///     pty.write("ls -la\n").await?;
///     
///     // Resize terminal
///     pty.resize((120, 30)).await?;
///     
///     Ok(())
/// }
/// ```
#[async_trait]
pub trait Pty {
    /// Write data to the pseudo-terminal.
    ///
    /// # Arguments
    ///
    /// * `data` - The string data to write to the PTY
    ///
    /// # Returns
    ///
    /// Returns `Ok(())` on success, or an error message on failure.
    ///
    /// # Examples
    ///
    /// ```rust,no_run
    /// # use crosspty::Pty;
    /// # async fn example<P: Pty>(pty: &P) -> Result<(), String> {
    /// pty.write("echo 'Hello, World!'\n").await?;
    /// # Ok(())
    /// # }
    /// ```
    async fn write(&self, data: &str) -> Result<(), String>;

    /// Resize the pseudo-terminal.
    ///
    /// # Arguments
    ///
    /// * `size` - A tuple containing (columns, rows) for the new terminal size
    ///
    /// # Returns
    ///
    /// Returns `Ok(())` on success, or an error message on failure.
    ///
    /// # Examples
    ///
    /// ```rust,no_run
    /// # use crosspty::Pty;
    /// # async fn example<P: Pty>(pty: &P) -> Result<(), String> {
    /// // Resize to 80 columns by 24 rows
    /// pty.resize((80, 24)).await?;
    /// # Ok(())
    /// # }
    /// ```
    async fn resize(&self, size: (i32, i32)) -> Result<(), String>;
}
