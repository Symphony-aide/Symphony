//! Basic terminal example - demonstrates fundamental PTY usage.
//!
//! This example shows how to create a PTY, execute commands, and
//! read output in real-time.

use crosspty::{PtyBuilder, PtySize};
use tokio::time::{Duration, sleep};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
	println!("=== CrossPty Basic Terminal Example ===\n");

	// Create a PTY with the default shell
	println!("Creating PTY with default shell...");
	let mut pty = PtyBuilder::new().size(PtySize::new(80, 24)).spawn().await?;

	println!("✓ PTY created successfully");
	println!("  PID: {:?}", pty.pid());
	println!("  Alive: {}", pty.is_alive().await);
	println!();

	// Write a command to the terminal
	#[cfg(windows)]
	let command = "echo Hello from CrossPty!\r\n";
	#[cfg(unix)]
	let command = "echo Hello from CrossPty!\n";

	println!("Executing command: {}", command.trim());
	pty.write(command.as_bytes()).await?;

	// Wait for output
	sleep(Duration::from_millis(500)).await;

	// Read and display output
	let output = pty.read().await?;
	if !output.is_empty() {
		println!("Output received:");
		println!("{}", String::from_utf8_lossy(&output));
	}

	// Resize the terminal
	println!("\nResizing terminal to 120x30...");
	pty.resize(PtySize::new(120, 30)).await?;
	println!("✓ Terminal resized");

	// Execute another command
	#[cfg(windows)]
	let command2 = "echo Terminal size changed!\r\n";
	#[cfg(unix)]
	let command2 = "echo Terminal size changed!\n";

	pty.write(command2.as_bytes()).await?;
	sleep(Duration::from_millis(500)).await;

	let output2 = pty.read().await?;
	if !output2.is_empty() {
		println!("\nSecond command output:");
		println!("{}", String::from_utf8_lossy(&output2));
	}

	// Clean shutdown
	println!("\nTerminating PTY...");
	pty.terminate().await?;

	sleep(Duration::from_secs(1)).await;

	println!("✓ PTY terminated");
	println!("  Exit status: {:?}", pty.exit_status().await);

	Ok(())
}
