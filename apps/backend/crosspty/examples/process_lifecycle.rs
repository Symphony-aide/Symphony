//! Process lifecycle example - demonstrates process management.
//!
//! This example shows how to spawn, monitor, and terminate
//! PTY processes with proper lifecycle handling.

use crosspty::{ExitStatus, PtyBuilder};
use tokio::time::{Duration, sleep};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("=== CrossPty Process Lifecycle Example ===\n");

    // Example 1: Normal execution and exit
    println!("1. Normal process execution:");
    demo_normal_execution().await?;
    println!();

    // Example 2: Graceful termination
    println!("2. Graceful termination (SIGTERM):");
    demo_graceful_termination().await?;
    println!();

    // Example 3: Forceful kill
    println!("3. Forceful kill (SIGKILL):");
    demo_forceful_kill().await?;
    println!();

    // Example 4: Process monitoring
    println!("4. Process status monitoring:");
    demo_process_monitoring().await?;

    println!("\n=== All examples completed ===");
    Ok(())
}

async fn demo_normal_execution() -> Result<(), Box<dyn std::error::Error>> {
    // Spawn a short-lived command
    #[cfg(windows)]
    let pty = PtyBuilder::new()
        .command("cmd.exe")
        .args(vec!["/C".to_string(), "echo".to_string(), "Done".to_string()])
        .spawn()
        .await?;

    #[cfg(unix)]
    let pty = PtyBuilder::new()
        .command("sh")
        .args(vec!["-c".to_string(), "echo Done && exit".to_string()])
        .spawn()
        .await?;

    println!("  Spawned process (PID: {:?})", pty.pid());

	// Wait for process to complete
	for i in 0..10 {
		sleep(Duration::from_millis(200)).await;
		if !pty.is_alive().await {
			println!("  Process exited after {} checks", i + 1);
			break;
		}
	}

	let status = pty.exit_status().await;
	println!("  Exit status: {:?}", status);

	if let ExitStatus::Exited(code) = status {
		println!("  ✓ Process exited normally with code {}", code);
	}

	Ok(())
}

async fn demo_graceful_termination() -> Result<(), Box<dyn std::error::Error>> {
	// Spawn a long-running process
	let mut pty = PtyBuilder::new().command(get_shell()).spawn().await?;

	println!("  Spawned process (PID: {:?})", pty.pid());
	assert!(pty.is_alive().await);

	// Send termination signal
	println!("  Sending termination signal...");
	pty.terminate().await?;

	// Wait and check status
	sleep(Duration::from_secs(1)).await;

	let status = pty.exit_status().await;
	println!("  Exit status: {:?}", status);
	println!("  Alive: {}", pty.is_alive().await);

	Ok(())
}

async fn demo_forceful_kill() -> Result<(), Box<dyn std::error::Error>> {
	// Spawn a process
	let mut pty = PtyBuilder::new().command(get_shell()).spawn().await?;

	println!("  Spawned process (PID: {:?})", pty.pid());

	// Kill forcefully
	println!("  Sending kill signal...");
	pty.kill().await?;

	// Process should die quickly
	sleep(Duration::from_millis(300)).await;

	let status = pty.exit_status().await;
	println!("  Exit status: {:?}", status);
	println!("  ✓ Process killed");

	Ok(())
}

async fn demo_process_monitoring() -> Result<(), Box<dyn std::error::Error>> {
	let mut pty = PtyBuilder::new().command(get_shell()).spawn().await?;

	let pid = pty.pid().unwrap();
	println!("  Monitoring process PID: {}", pid);

	// Monitor for 3 seconds
	for i in 0..6 {
		sleep(Duration::from_millis(500)).await;
		let alive = pty.is_alive().await;
		let status = pty.exit_status().await;
		println!("  [{}] Alive: {}, Status: {:?}", i, alive, status);
	}

	// Cleanup
	println!("  Terminating monitored process...");
	pty.kill().await?;
	println!("  ✓ Monitoring complete");

	Ok(())
}

#[cfg(windows)]
fn get_shell() -> String {
	"cmd.exe".to_string()
}

#[cfg(unix)]
fn get_shell() -> String {
	"/bin/sh".to_string()
}
