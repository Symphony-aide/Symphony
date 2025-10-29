//! Extension system types

use crate::core::{EntityId, Version};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Extension identifier
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct ExtensionId(pub String);

impl ExtensionId {
    /// Create a new extension ID
    pub fn new(id: impl Into<String>) -> Self {
        Self(id.into())
    }

    /// Get the inner string
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl From<String> for ExtensionId {
    fn from(s: String) -> Self {
        Self(s)
    }
}

impl From<&str> for ExtensionId {
    fn from(s: &str) -> Self {
        Self(s.to_string())
    }
}

impl std::fmt::Display for ExtensionId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

/// Extension types in the Orchestra Kit
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ExtensionType {
    /// AI/ML models as extensions
    Instrument,
    /// Workflow utilities & data processing
    Operator,
    /// UI enhancements & specialized editors
    Motif,
}

/// Extension execution model
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ExecutionModel {
    /// In-process Rust extension (The Pit) - 50-100ns latency
    InProcess,
    /// Out-of-process extension (UFE) - 0.1-0.5ms latency
    OutOfProcess,
}

/// Extension state in the "Chambering" lifecycle
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ExtensionState {
    /// Extension is installed but not loaded
    Installed,
    /// Extension is being loaded
    Loading,
    /// Extension is loaded into memory
    Loaded,
    /// Extension is activated and ready
    Activated,
    /// Extension is currently running
    Running,
    /// Extension encountered an error
    Error,
    /// Extension is being unloaded
    Unloading,
}

/// Extension manifest (Symphony.toml)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtensionManifest {
    /// Extension ID (e.g., "symphony.git")
    pub id: ExtensionId,
    /// Display name
    pub name: String,
    /// Version
    pub version: Version,
    /// Description
    pub description: String,
    /// Author
    pub author: String,
    /// License
    pub license: String,
    /// Extension type
    pub extension_type: ExtensionType,
    /// Execution model
    pub execution_model: ExecutionModel,
    /// Entry point (binary path or module)
    pub entry_point: String,
    /// Dependencies on other extensions
    pub dependencies: HashMap<ExtensionId, Version>,
    /// Required capabilities/permissions
    pub capabilities: Vec<String>,
    /// Activation events
    pub activation_events: Vec<String>,
    /// Configuration schema
    pub config_schema: Option<serde_json::Value>,
    /// Additional metadata
    pub metadata: HashMap<String, serde_json::Value>,
}

impl ExtensionManifest {
    /// Create a new manifest
    pub fn new(
        id: ExtensionId,
        name: String,
        version: Version,
        extension_type: ExtensionType,
    ) -> Self {
        Self {
            id,
            name,
            version,
            description: String::new(),
            author: String::new(),
            license: "MIT".to_string(),
            extension_type,
            execution_model: ExecutionModel::OutOfProcess,
            entry_point: String::new(),
            dependencies: HashMap::new(),
            capabilities: Vec::new(),
            activation_events: Vec::new(),
            config_schema: None,
            metadata: HashMap::new(),
        }
    }
}

/// Extension instance information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtensionInfo {
    /// Extension ID
    pub id: ExtensionId,
    /// Runtime entity ID
    pub entity_id: EntityId,
    /// Manifest
    pub manifest: ExtensionManifest,
    /// Current state
    pub state: ExtensionState,
    /// Installation path
    pub install_path: std::path::PathBuf,
}

/// Extension capability/permission
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum Capability {
    /// File system access
    FileSystem { read: bool, write: bool },
    /// Network access
    Network { domains: Vec<String> },
    /// Process spawning
    Process,
    /// IPC communication
    Ipc,
    /// UI modification
    Ui,
    /// Settings access
    Settings { read: bool, write: bool },
    /// Custom capability
    Custom(String),
}

/// Extension configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtensionConfig {
    /// Extension ID
    pub extension_id: ExtensionId,
    /// Configuration values
    pub config: HashMap<String, serde_json::Value>,
}
