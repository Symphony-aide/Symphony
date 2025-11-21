use async_trait::async_trait;
use crosspty::{Pty, PtyBuilder, PtySize};
use sveditor_core_api::extensions::client::ExtensionClient;
use sveditor_core_api::messaging::{ClientMessages, ServerMessages};
use sveditor_core_api::terminal_shells::{
	TerminalShell, TerminalShellBuilder, TerminalShellBuilderInfo,
};
use sveditor_core_api::tokio;
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::time::{sleep, Duration, Instant};

#[allow(dead_code)]
pub struct NativeShellBuilder {
	pub state_id: u8,
	pub client: ExtensionClient,
	pub command: String,
	pub info: TerminalShellBuilderInfo,
}

impl TerminalShellBuilder for NativeShellBuilder {
	fn get_info(&self) -> TerminalShellBuilderInfo {
		self.info.clone()
	}

	fn build(&self, terminal_shell_id: &str) -> Box<dyn TerminalShell + Send + Sync> {
		let client = self.client.clone();
		let terminal_shell_id = terminal_shell_id.to_owned();
		let state_id = self.state_id;
		let command = self.command.clone();

		// Shared handle to the PTY so that NativeShell can write/resize
		let pty = Arc::new(Mutex::new(None::<Box<dyn Pty>>));
		let pty_clone = pty.clone();

		// Spawn PTY process and a reader task that forwards output to the client
		tokio::spawn(async move {
			match PtyBuilder::new().command(command).spawn().await {
				Ok(mut p) => {
					// Store PTY so NativeShell methods can access it
					*pty_clone.lock().await = Some(p);

					// Clone values for the reader loop
					let client = client.clone();
					let terminal_shell_id = terminal_shell_id.clone();
					let pty_reader = pty_clone.clone();

					// Spawn a task to continuously read from PTY and send data to client
					// with buffering for better performance
					tokio::spawn(async move {
						// Performance optimizations:
						// - Buffer output to reduce IPC overhead
						// - Batch sends at ~60fps for smooth rendering
						// - Avoid busy loops with proper async waiting
						let mut output_buffer = Vec::with_capacity(4096);
						let mut last_send = Instant::now();
						const BUFFER_TIMEOUT: Duration = Duration::from_millis(16); // ~60fps
						const MAX_BUFFER_SIZE: usize = 4096; // 4KB buffer
						const READ_TIMEOUT: Duration = Duration::from_millis(10);

						loop {
							let mut guard = pty_reader.lock().await;
							if let Some(ref mut pty) = *guard {
								match pty.read().await {
									Ok(bytes) if !bytes.is_empty() => {
										// Append to buffer
										output_buffer.extend_from_slice(&bytes);
										
										// Send if buffer is full or timeout elapsed
										let should_send = output_buffer.len() >= MAX_BUFFER_SIZE
											|| last_send.elapsed() >= BUFFER_TIMEOUT;
										
										if should_send && !output_buffer.is_empty() {
											let data = output_buffer.clone();
											output_buffer.clear();
											last_send = Instant::now();
											
											// Release lock before sending to avoid blocking PTY operations
											drop(guard);
											
											if let Err(e) = client
												.send(ClientMessages::ServerMessage(
													ServerMessages::TerminalShellUpdated {
														data,
														state_id,
														terminal_shell_id: terminal_shell_id.clone(),
													},
												))
												.await
											{
												eprintln!("Failed to send PTY output: {:?}", e);
												break;
											}
										}
									}
									Ok(_) => {
										// No data available, flush any pending buffer
										if !output_buffer.is_empty() && last_send.elapsed() >= BUFFER_TIMEOUT {
											let data = output_buffer.clone();
											output_buffer.clear();
											last_send = Instant::now();
											
											drop(guard);
											
											if let Err(e) = client
												.send(ClientMessages::ServerMessage(
													ServerMessages::TerminalShellUpdated {
														data,
														state_id,
														terminal_shell_id: terminal_shell_id.clone(),
													},
												))
												.await
											{
												eprintln!("Failed to send PTY output: {:?}", e);
												break;
											}
										} else {
											// No data and no pending buffer, wait before next read
											drop(guard);
											sleep(READ_TIMEOUT).await;
										}
									}
									Err(e) => {
										eprintln!("PTY read error: {:?}", e);
										// Flush any remaining data before exiting
										if !output_buffer.is_empty() {
											let data = output_buffer.clone();
											drop(guard);
											let _ = client
												.send(ClientMessages::ServerMessage(
													ServerMessages::TerminalShellUpdated {
														data,
														state_id,
														terminal_shell_id: terminal_shell_id.clone(),
													},
												))
												.await;
										}
										break;
									}
								}
							} else {
								// PTY not yet available or has been closed
								break;
							}
						}
					});
				}
				Err(e) => {
					eprintln!("Failed to create PTY: {:?}", e);
				}
			}
		});

		Box::new(NativeShell { pty })
	}
}

pub struct NativeShell {
	pty: Arc<Mutex<Option<Box<dyn Pty>>>>,
}

#[async_trait]
impl TerminalShell for NativeShell {
	async fn write(&self, data: String) {
		let mut pty_guard = self.pty.lock().await;
		if let Some(pty) = pty_guard.as_mut() {
			if let Err(e) = pty.write(data.as_bytes()).await {
				eprintln!("Failed to write to PTY: {:?}", e);
			}
		}
	}

	async fn resize(&self, cols: i32, rows: i32) {
		let mut pty_guard = self.pty.lock().await;
		if let Some(pty) = pty_guard.as_mut() {
			let size = PtySize::new(cols as u16, rows as u16);
			if let Err(e) = pty.resize(size).await {
				eprintln!("Failed to resize PTY: {:?}", e);
			}
		}
	}
}
