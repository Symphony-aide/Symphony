use async_trait::async_trait;
use crosspty::{Pty, PtyBuilder, PtySize};
use sveditor_core_api::extensions::client::ExtensionClient;
use sveditor_core_api::messaging::{ClientMessages, ServerMessages};
use sveditor_core_api::terminal_shells::{
	TerminalShell, TerminalShellBuilder, TerminalShellBuilderInfo,
};
use sveditor_core_api::tokio;
use sveditor_core_api::tokio::sync::mpsc::channel;
use std::sync::Arc;
use tokio::sync::Mutex;

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

		let (_tx, mut rx) = channel::<Vec<u8>>(1);
	
	// Create PTY using PtyBuilder API
	let command = self.command.clone();
	let pty = Arc::new(Mutex::new(None::<Box<dyn Pty>>));
	let pty_clone = pty.clone();
	
	// Spawn PTY creation
	tokio::spawn(async move {
		match PtyBuilder::new()
			.command(command)
			.spawn()
			.await 
		{
			Ok(p) => {
				*pty_clone.lock().await = Some(p);
			}
			Err(e) => {
				eprintln!("Failed to create PTY: {:?}", e);
			}
		}
	});
	
	let shell = Box::new(NativeShell { pty: pty.clone() });

		tokio::spawn(async move {
			loop {
				let data = rx.recv().await.unwrap();
				client
					.send(ClientMessages::ServerMessage(ServerMessages::TerminalShellUpdated {
						data,
						state_id,
						terminal_shell_id: terminal_shell_id.clone(),
					}))
					.await
					.unwrap();
			}
		});

		shell
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
