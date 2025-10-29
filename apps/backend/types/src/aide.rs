//! AIDE (AI-First Development Environment) types

use crate::core::{EntityId, Timestamp};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// AI model identifier
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct ModelId(pub String);

impl ModelId {
    /// Create a new model ID
    pub fn new(id: impl Into<String>) -> Self {
        Self(id.into())
    }

    /// Get the inner string
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl From<String> for ModelId {
    fn from(s: String) -> Self {
        Self(s)
    }
}

impl From<&str> for ModelId {
    fn from(s: &str) -> Self {
        Self(s.to_string())
    }
}

/// AI model state in the Pool Manager lifecycle
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ModelState {
    /// Model is not loaded
    Unloaded,
    /// Model is being loaded
    Loading,
    /// Model is warming up (preparing for inference)
    Warming,
    /// Model is ready for inference
    Ready,
    /// Model is actively processing requests
    Active,
    /// Model is being unloaded
    Unloading,
    /// Model encountered an error
    Error,
}

/// AI model information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    /// Model ID
    pub id: ModelId,
    /// Model name
    pub name: String,
    /// Model type (e.g., "llm", "embedding", "vision")
    pub model_type: String,
    /// Model size in bytes
    pub size_bytes: u64,
    /// Current state
    pub state: ModelState,
    /// Memory usage in bytes
    pub memory_usage: u64,
    /// Load timestamp
    pub loaded_at: Option<Timestamp>,
    /// Last used timestamp
    pub last_used_at: Option<Timestamp>,
}

/// Artifact identifier
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct ArtifactId(pub EntityId);

impl ArtifactId {
    /// Create a new artifact ID
    pub fn new() -> Self {
        Self(EntityId::new())
    }
}

impl Default for ArtifactId {
    fn default() -> Self {
        Self::new()
    }
}

/// Artifact type
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ArtifactType {
    /// Code file
    Code,
    /// Documentation
    Documentation,
    /// Test file
    Test,
    /// Configuration
    Configuration,
    /// Data file
    Data,
    /// Model checkpoint
    ModelCheckpoint,
    /// Other
    Other(String),
}

/// Artifact metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Artifact {
    /// Artifact ID
    pub id: ArtifactId,
    /// Artifact type
    pub artifact_type: ArtifactType,
    /// Content hash (for deduplication)
    pub content_hash: String,
    /// Size in bytes
    pub size_bytes: u64,
    /// Quality score (0.0 - 1.0)
    pub quality_score: f32,
    /// Created timestamp
    pub created_at: Timestamp,
    /// Last accessed timestamp
    pub last_accessed_at: Timestamp,
    /// Storage tier
    pub storage_tier: StorageTier,
    /// Tags for search
    pub tags: Vec<String>,
    /// Additional metadata
    pub metadata: HashMap<String, serde_json::Value>,
}

/// Storage tier for artifact lifecycle
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum StorageTier {
    /// Hot storage (1-7 days) - SSD
    Hot,
    /// Warm storage (8-30 days) - HDD
    Warm,
    /// Cold storage (30+ days) - Cloud
    Cold,
    /// Archived (long-term retention)
    Archived,
}

/// DAG (Directed Acyclic Graph) execution state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DagState {
    /// DAG ID
    pub id: EntityId,
    /// Total nodes
    pub total_nodes: usize,
    /// Completed nodes
    pub completed_nodes: usize,
    /// Failed nodes
    pub failed_nodes: usize,
    /// Currently executing nodes
    pub executing_nodes: Vec<EntityId>,
    /// Execution start time
    pub started_at: Timestamp,
    /// Estimated completion time
    pub estimated_completion: Option<Timestamp>,
}

/// Resource allocation request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceRequest {
    /// Request ID
    pub id: EntityId,
    /// Requester ID
    pub requester: EntityId,
    /// Resource type
    pub resource_type: ResourceType,
    /// Amount requested
    pub amount: u64,
    /// Priority
    pub priority: crate::core::Priority,
    /// Timestamp
    pub timestamp: Timestamp,
}

/// Resource type
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ResourceType {
    /// CPU cores
    Cpu,
    /// Memory (bytes)
    Memory,
    /// GPU memory (bytes)
    GpuMemory,
    /// Disk space (bytes)
    Disk,
    /// Network bandwidth (bytes/sec)
    Network,
}

/// Arbitration decision
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArbitrationDecision {
    /// Request ID
    pub request_id: EntityId,
    /// Granted
    pub granted: bool,
    /// Allocated amount (may be less than requested)
    pub allocated_amount: u64,
    /// Reason
    pub reason: String,
}
