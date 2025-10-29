//! Configuration file watcher for hot-reload

use notify::{Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use std::path::PathBuf;
use sytypes::{SymphonyError, SymphonyResult};
use tokio::sync::mpsc;

/// Configuration change event
#[derive(Debug, Clone)]
pub struct ConfigChangeEvent {
    /// Path that changed
    pub path: PathBuf,
    /// Event kind
    pub kind: ConfigChangeKind,
}

/// Configuration change kind
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ConfigChangeKind {
    /// File was modified
    Modified,
    /// File was created
    Created,
    /// File was deleted
    Deleted,
}

/// Configuration file watcher
pub struct ConfigWatcher {
    _watcher: RecommendedWatcher,
    receiver: mpsc::UnboundedReceiver<ConfigChangeEvent>,
}

impl ConfigWatcher {
    /// Create a new config watcher
    pub async fn new(path: PathBuf) -> SymphonyResult<Self> {
        let (tx, rx) = mpsc::unbounded_channel();

        let mut watcher = notify::recommended_watcher(move |res: Result<Event, notify::Error>| {
            match res {
                Ok(event) => {
                    let kind = match event.kind {
                        EventKind::Modify(_) => ConfigChangeKind::Modified,
                        EventKind::Create(_) => ConfigChangeKind::Created,
                        EventKind::Remove(_) => ConfigChangeKind::Deleted,
                        _ => return,
                    };

                    for path in event.paths {
                        let _ = tx.send(ConfigChangeEvent { path, kind });
                    }
                }
                Err(e) => {
                    tracing::error!("Watch error: {:?}", e);
                }
            }
        })
        .map_err(|e| SymphonyError::Config(format!("Failed to create watcher: {}", e)))?;

        watcher
            .watch(&path, RecursiveMode::NonRecursive)
            .map_err(|e| SymphonyError::Config(format!("Failed to watch path: {}", e)))?;

        tracing::info!("Watching configuration file: {:?}", path);

        Ok(Self {
            _watcher: watcher,
            receiver: rx,
        })
    }

    /// Receive next change event
    pub async fn recv(&mut self) -> Option<ConfigChangeEvent> {
        self.receiver.recv().await
    }

    /// Try to receive change event without blocking
    pub fn try_recv(&mut self) -> Option<ConfigChangeEvent> {
        self.receiver.try_recv().ok()
    }
}
