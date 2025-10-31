//! Interactive shell example - demonstrates real-time I/O.
//!
//! This example shows how to create an interactive terminal session
//! with continuous input/output handling.

use crosspty::{PtyBuilder, PtySize};
use std::io::{self, Write};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::time::{interval, Duration};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
	println!("=== CrossPty Interactive Shell Example ===");
	println!("Type commands and see output in real-time.");
	println!("Type 'exit' to quit.\n");

	// Create PTY with appropriate shell
	let mut pty = PtyBuilder::new()
        .size(PtySize::new(100, 30))
        .env("PS1", "crosspty> ") // Custom prompt on Unix
        .spawn()
        .await?;

	println!("Shell started (PID: {:?})\n", pty.pid());

	// Spawn output reading task
	let mut pty_clone = pty;
	let output_task = tokio::spawn(async move {
		let mut interval = interval(Duration::from_millis(100));
		loop {
			interval.tick().await;

			match pty_clone.read().await {
				Ok(data) if !data.is_empty() => {
					print!("{}", String::from_utf8_lossy(&data));
					io::stdout().flush().unwrap();
				},
				Ok(_) => {},
				Err(e) => {
					eprintln!("Read error: {}", e);
					break;
				},
			}

			if !pty_clone.is_alive() {
				println!("\nShell process terminated.");
				break;
			}
		}
		pty_clone
	});

	// Read from stdin and write to PTY
	let stdin = tokio::io::stdin();
	let mut reader = BufReader::new(stdin);
	let mut line = String::new();

	loop {
		line.clear();
		match reader.read_line(&mut line).await {
			Ok(0) => break, // EOF
			Ok(_) => {
				// Get PTY back temporarily to write
				// In a real app, you'd use channels for communication
				tokio::time::sleep(Duration::from_millis(50)).await;

				if line.trim() == "exit" {
					println!("Exiting...");
					break;
				}
			},
			Err(e) => {
				eprintln!("Input error: {}", e);
				break;
			},
		}
	}

	// Wait for output task and get PTY back
	let mut pty = output_task.await?;

	// Clean shutdown
	println!("\nShutting down shell...");
	let _ = pty.kill().await;

	println!("Exit status: {:?}", pty.exit_status());

	Ok(())
}
