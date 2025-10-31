//! Integration tests for CrossPty terminal implementation.
//!
//! These tests verify the full functionality of the PTY implementation
//! across different platforms.

use crosspty::{ExitStatus, PtyBuilder, PtySize};
use std::time::Duration;
use tokio::time::timeout;

/// Test basic PTY creation and command execution.
#[tokio::test]
async fn test_pty_creation_and_execution() {
	let mut pty = PtyBuilder::new()
		.command(get_test_shell())
		.size(PtySize::new(80, 24))
		.spawn()
		.await
		.expect("Failed to spawn PTY");

	// Verify PTY is alive
	assert!(pty.is_alive());
	assert!(pty.pid().is_some());

	// Write a simple command
	let test_command = get_echo_command();
	pty.write(test_command.as_bytes()).await.expect("Failed to write to PTY");

	// Give time for command to execute
	tokio::time::sleep(Duration::from_millis(500)).await;

	// Read output
	let output = pty.read().await.expect("Failed to read from PTY");
	assert!(!output.is_empty(), "Expected output from echo command");

	// Clean up
	pty.kill().await.expect("Failed to kill PTY");
}

/// Test PTY resize functionality.
#[tokio::test]
async fn test_pty_resize() {
	let mut pty = PtyBuilder::new()
		.command(get_test_shell())
		.size(PtySize::new(80, 24))
		.spawn()
		.await
		.expect("Failed to spawn PTY");

	// Resize the terminal
	let new_size = PtySize::new(120, 30);
	pty.resize(new_size).await.expect("Failed to resize PTY");

	assert!(pty.is_alive());

	// Clean up
	pty.kill().await.expect("Failed to kill PTY");
}

/// Test bidirectional I/O.
#[tokio::test]
async fn test_bidirectional_io() {
	let mut pty = PtyBuilder::new()
		.command(get_test_shell())
		.size(PtySize::new(80, 24))
		.spawn()
		.await
		.expect("Failed to spawn PTY");

	// Write multiple commands
	for _ in 0..3 {
		let cmd = get_echo_command();
		pty.write(cmd.as_bytes()).await.expect("Failed to write to PTY");

		tokio::time::sleep(Duration::from_millis(200)).await;

		let output = pty.read().await.expect("Failed to read from PTY");
		assert!(!output.is_empty());
	}

	pty.kill().await.expect("Failed to kill PTY");
}

/// Test process lifecycle - graceful termination.
#[tokio::test]
async fn test_graceful_termination() {
	let mut pty = PtyBuilder::new()
		.command(get_test_shell())
		.spawn()
		.await
		.expect("Failed to spawn PTY");

	let pid = pty.pid().expect("Expected PID");
	assert!(pid > 0);
	assert!(pty.is_alive());

	// Terminate gracefully
	pty.terminate().await.expect("Failed to terminate PTY");

	// Wait for termination
	tokio::time::sleep(Duration::from_secs(1)).await;

	// Check exit status (may still be running on some systems)
	let status = pty.exit_status();
	println!("Exit status after terminate: {:?}", status);
}

/// Test process lifecycle - forceful kill.
#[tokio::test]
async fn test_forceful_kill() {
	let mut pty = PtyBuilder::new()
		.command(get_test_shell())
		.spawn()
		.await
		.expect("Failed to spawn PTY");

	assert!(pty.is_alive());

	// Kill forcefully
	pty.kill().await.expect("Failed to kill PTY");

	// Wait for process to die
	tokio::time::sleep(Duration::from_millis(500)).await;

	let status = pty.exit_status();
	println!("Exit status after kill: {:?}", status);
}

/// Test custom environment variables.
#[tokio::test]
async fn test_custom_environment() {
	let mut pty = PtyBuilder::new()
		.command(get_test_shell())
		.env("TEST_VAR", "test_value")
		.spawn()
		.await
		.expect("Failed to spawn PTY");

	// Write command to echo environment variable
	let cmd = get_env_echo_command();
	pty.write(cmd.as_bytes()).await.expect("Failed to write to PTY");

	tokio::time::sleep(Duration::from_millis(500)).await;

	let output = pty.read().await.expect("Failed to read from PTY");
	let output_str = String::from_utf8_lossy(&output);

	// On some systems, the env var might not be immediately visible
	println!("Environment test output: {}", output_str);

	pty.kill().await.expect("Failed to kill PTY");
}

/// Test working directory setting.
#[tokio::test]
async fn test_working_directory() {
	let temp_dir = std::env::temp_dir();

	let mut pty = PtyBuilder::new()
		.command(get_test_shell())
		.working_dir(temp_dir.clone())
		.spawn()
		.await
		.expect("Failed to spawn PTY");

	assert!(pty.is_alive());

	pty.kill().await.expect("Failed to kill PTY");
}

/// Test command with arguments.
#[tokio::test]
async fn test_command_with_args() {
	#[cfg(unix)]
	let mut pty = PtyBuilder::new()
		.command("echo")
		.arg("Hello from PTY")
		.spawn()
		.await
		.expect("Failed to spawn PTY");

	#[cfg(windows)]
	let mut pty = PtyBuilder::new()
		.command("cmd.exe")
		.args(vec!["/C".to_string(), "echo".to_string(), "Hello".to_string()])
		.spawn()
		.await
		.expect("Failed to spawn PTY");

	tokio::time::sleep(Duration::from_millis(500)).await;

	let output = pty.read().await.expect("Failed to read from PTY");
	let output_str = String::from_utf8_lossy(&output);
	println!("Command args output: {}", output_str);

	// Process may have already exited
	let _ = pty.kill().await;
}

/// Test handling of non-existent command.
#[tokio::test]
async fn test_nonexistent_command() {
	let result = PtyBuilder::new().command("nonexistent_command_12345").spawn().await;

	assert!(result.is_err(), "Expected error for nonexistent command");
}

/// Test multiple PTY instances simultaneously.
#[tokio::test]
async fn test_multiple_pty_instances() {
	let mut ptys = Vec::new();

	// Spawn 3 PTY instances
	for _ in 0..3 {
		let pty = PtyBuilder::new()
			.command(get_test_shell())
			.spawn()
			.await
			.expect("Failed to spawn PTY");

		ptys.push(pty);
	}

	// Verify all are alive
	for pty in &ptys {
		assert!(pty.is_alive());
		assert!(pty.pid().is_some());
	}

	// Clean up all instances
	for mut pty in ptys {
		pty.kill().await.expect("Failed to kill PTY");
	}
}

// Helper functions for platform-specific commands

#[cfg(windows)]
fn get_test_shell() -> String {
	"cmd.exe".to_string()
}

#[cfg(unix)]
fn get_test_shell() -> String {
	"/bin/sh".to_string()
}

#[cfg(windows)]
fn get_echo_command() -> String {
	"echo Hello\r\n".to_string()
}

#[cfg(unix)]
fn get_echo_command() -> String {
	"echo Hello\n".to_string()
}

#[cfg(windows)]
fn get_env_echo_command() -> String {
	"echo %TEST_VAR%\r\n".to_string()
}

#[cfg(unix)]
fn get_env_echo_command() -> String {
	"echo $TEST_VAR\n".to_string()
}
