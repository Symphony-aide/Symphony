//! # Git Extension for Symphony
//!
//! This extension provides Git integration for the Symphony code editor, enabling users to
//! perform Git operations directly from the editor interface.
//!
//! ## Features
//!
//! - **Repository Detection**: Automatically detects Git repositories
//! - **Branch Information**: Displays current branch in the status bar
//! - **File Status**: Shows Git status for files (modified, staged, untracked, etc.)
//! - **Real-time Updates**: Updates Git information as you navigate through directories
//!
//! ## Architecture
//!
//! The extension uses the `git2` crate for Git operations and integrates with Symphony's
//! extension system through the `Extension` trait. It communicates with the client through
//! message passing and updates the status bar with repository information.

use std::sync::Arc;

use git2::{Error, Repository, StatusOptions};
use sveditor_core_api::extensions::base::{Extension, ExtensionInfo};
use sveditor_core_api::extensions::client::ExtensionClient;
use sveditor_core_api::extensions::manager::ExtensionsManager;
use sveditor_core_api::extensions::modules::statusbar_item::StatusBarItem;
use sveditor_core_api::messaging::{ClientMessages, NotifyExtension, ServerMessages};
use sveditor_core_api::tokio::sync::mpsc::{channel, Receiver, Sender};
use sveditor_core_api::{tokio, ManifestExtension, ManifestInfo, Mutex, Serialize, State};

mod types;

use types::{FileState, FromExtension, ToExtension};

/// The display name of this extension
static EXTENSION_NAME: &str = "Git";

/// Sends a message from the extension to the client.
///
/// This helper function serializes the message and sends it through the extension client.
///
/// # Arguments
///
/// * `client` - The extension client for communication
/// * `state_id` - The ID of the editor state
/// * `extension_id` - The ID of this extension
/// * `message` - The message to send (must be serializable)
async fn send_message_to_client(
    client: &ExtensionClient,
    state_id: u8,
    extension_id: String,
    message: impl Serialize,
) {
    let message = serde_json::to_string(&message).unwrap();
    client
        .send(ClientMessages::ServerMessage(
            ServerMessages::MessageFromExtension {
                state_id,
                extension_id,
                message,
            },
        ))
        .await
        .ok();
}

/// Main Git extension implementation.
///
/// This struct manages Git operations and communication with the Symphony client.
/// It handles repository detection, branch information, and file status updates.
struct GitExtension {
    /// Message receiver for handling client messages
    rx: Option<Receiver<ClientMessages>>,
    /// Message sender for internal communication
    tx: Sender<ClientMessages>,
    /// Status bar item for displaying Git information
    status_bar_item: StatusBarItem,
    /// Client for communicating with the Symphony frontend
    client: ExtensionClient,
}

impl GitExtension {
    /// Gets the current branch name for a Git repository.
    ///
    /// # Arguments
    ///
    /// * `path` - The file system path to check for a Git repository
    ///
    /// # Returns
    ///
    /// Returns `Ok(Some(branch_name))` if a repository is found and has a current branch,
    /// `Ok(None)` if no branch is found, or an `Error` if the operation fails.
    ///
    /// # Examples
    ///
    /// ```rust,no_run
    /// # use git_for_symphony::GitExtension;
    /// let branch = GitExtension::get_repo_branch("/path/to/repo".to_string());
    /// match branch {
    ///     Ok(Some(name)) => println!("Current branch: {}", name),
    ///     Ok(None) => println!("No current branch"),
    ///     Err(e) => println!("Error: {}", e),
    /// }
    /// ```
    pub fn get_repo_branch(path: String) -> Result<Option<String>, Error> {
        let repo = Repository::discover(path);
        let repo = repo?;
        let head = repo.head()?;
        Ok(head.shorthand().map(|v| v.to_string()))
    }

    /// Gets the Git status for all files in a repository.
    ///
    /// This method discovers the Git repository from the given path and returns
    /// the status of all files that have changes (modified, staged, untracked, etc.).
    ///
    /// # Arguments
    ///
    /// * `path` - The file system path within a Git repository
    ///
    /// # Returns
    ///
    /// Returns a vector of `FileState` objects representing the Git status of files,
    /// or an `Error` if the operation fails.
    ///
    /// # Examples
    ///
    /// ```rust,no_run
    /// # use git_for_symphony::GitExtension;
    /// let status = GitExtension::get_repo_status("/path/to/repo".to_string());
    /// match status {
    ///     Ok(files) => {
    ///         for file in files {
    ///             println!("File: {}, Status: {}", file.path, file.status);
    ///         }
    ///     }
    ///     Err(e) => println!("Error getting status: {}", e),
    /// }
    /// ```
    pub fn get_repo_status(path: String) -> Result<Vec<FileState>, Error> {
        let repo = Repository::discover(path);
        let repo = repo?;
        let mut files = Vec::new();
        for file in repo
            .statuses(Some(&mut StatusOptions::new()))
            .unwrap()
            .iter()
        {
            let status = file.status();
            if let Some(path) = file.path() {
                files.push(FileState {
                    path: path.to_string(),
                    status: status.bits(),
                });
            }
        }

        Ok(files)
    }

    /// Handles messages from the side panel UI.
    ///
    /// This method processes requests from the Symphony client for Git information,
    /// such as loading file states or branch information.
    ///
    /// # Arguments
    ///
    /// * `client` - The extension client for sending responses
    /// * `state_id` - The ID of the editor state
    /// * `extension_id` - The ID of this extension
    /// * `message` - The message received from the client
    pub async fn handle_side_panel_messages(
        client: &ExtensionClient,
        state_id: u8,
        extension_id: String,
        message: ToExtension,
    ) {
        match message {
            ToExtension::LoadFilesStates { path } => {
                // Get the current files states
                let files_states = Self::get_repo_status(path.clone());

                // Default message is Repo not found
                let mut message = FromExtension::RepoNotFound { path: path.clone() };

                // Answer with the file states
                if let Ok(files_states) = files_states {
                    message = FromExtension::FilesState { path, files_states };
                }

                // Send the message
                send_message_to_client(client, state_id, extension_id, message).await;
            }
            ToExtension::LoadBranch { path } => {
                // Get the current branch
                let branch = Self::get_repo_branch(path.clone());

                // Default message is Repo not found
                let mut message = FromExtension::RepoNotFound { path: path.clone() };

                // Answer with the found branch
                if let Ok(Some(branch)) = branch {
                    message = FromExtension::Branch { path, name: branch };
                }

                // Send the message
                send_message_to_client(client, state_id, extension_id, message).await;
            }
        }
    }
}

impl Extension for GitExtension {
    fn get_info(&self) -> ExtensionInfo {
        ExtensionInfo {
            id: env!("CARGO_PKG_NAME").to_string(),
            name: EXTENSION_NAME.to_string(),
        }
    }

    fn init(&mut self, _state: Arc<Mutex<State>>) {
        let receiver = self.rx.take();
        let client = self.client.clone();

        if let Some(mut receiver) = receiver {
            let mut status_bar_item = self.status_bar_item.clone();

            tokio::spawn(async move {
                loop {
                    if let Some(message) = receiver.recv().await {
                        match message {
                            ClientMessages::ListDir(_, fs_name, path, _) => {
                                // Only react when using the local file system
                                if fs_name == "local" {
                                    let branch = Self::get_repo_branch(path);
                                    if let Ok(Some(branch)) = branch {
                                        status_bar_item.set_label(&branch).await;
                                    }
                                }
                            }
                            ClientMessages::NotifyExtension(
                                NotifyExtension::ExtensionMessage {
                                    content,
                                    state_id,
                                    extension_id,
                                },
                            ) => {
                                let message: Result<ToExtension, serde_json::Error> =
                                    serde_json::from_str(&content);
                                if let Ok(message) = message {
                                    Self::handle_side_panel_messages(
                                        &client,
                                        state_id,
                                        extension_id,
                                        message,
                                    )
                                    .await;
                                }
                            }
                            _ => {}
                        }
                    }
                }
            });
        }
    }

    fn unload(&mut self) {}

    fn notify(&mut self, message: ClientMessages) {
        let tx = self.tx.clone();
        tokio::spawn(async move {
            tx.send(message).await.unwrap();
        });
    }
}

pub fn entry(extensions: &mut ExtensionsManager, client: ExtensionClient, state_id: u8) {
    let (tx, rx) = channel::<ClientMessages>(1);
    let status_bar_item = StatusBarItem::new(client.clone(), state_id, "");

    let plugin = Box::new(GitExtension {
        rx: Some(rx),
        tx,
        status_bar_item,
        client,
    });
    let parent_id = env!("CARGO_PKG_NAME");
    extensions.register(parent_id, plugin);
}

pub fn get_info() -> ManifestInfo {
    ManifestInfo {
        extension: ManifestExtension {
            id: env!("CARGO_PKG_NAME").to_string(),
            name: EXTENSION_NAME.to_string(),
            author: "Marc Espín".to_string(),
            version: env!("CARGO_PKG_VERSION").to_string(),
            repository: "https://github.com/Symphony-Code-Editor/Symphony-App".to_string(),
            main: None,
        },
    }
}
