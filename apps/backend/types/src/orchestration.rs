//! Orchestration and workflow types

use crate::core::{EntityId, Priority, Timestamp};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Workflow ID
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct WorkflowId(pub EntityId);

impl WorkflowId {
    /// Create a new workflow ID
    pub fn new() -> Self {
        Self(EntityId::new())
    }
}

impl Default for WorkflowId {
    fn default() -> Self {
        Self::new()
    }
}

/// Node ID in a workflow DAG
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct NodeId(pub EntityId);

impl NodeId {
    /// Create a new node ID
    pub fn new() -> Self {
        Self(EntityId::new())
    }
}

impl Default for NodeId {
    fn default() -> Self {
        Self::new()
    }
}

/// Orchestration mode
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum OrchestrationMode {
    /// Maestro Mode: RL-driven intelligent orchestration
    Maestro,
    /// Manual Mode: User-driven workflow execution
    Manual,
}

/// Workflow state
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum WorkflowState {
    /// Workflow is being created
    Creating,
    /// Workflow is ready to execute
    Ready,
    /// Workflow is currently executing
    Running,
    /// Workflow is paused
    Paused,
    /// Workflow completed successfully
    Completed,
    /// Workflow failed
    Failed,
    /// Workflow was cancelled
    Cancelled,
}

/// Workflow node type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NodeType {
    /// Start node
    Start,
    /// End node
    End,
    /// Task node (executes an action)
    Task {
        action: String,
        params: HashMap<String, serde_json::Value>,
    },
    /// Decision node (conditional branching)
    Decision {
        condition: String,
    },
    /// Parallel node (execute multiple branches)
    Parallel,
    /// Join node (wait for multiple branches)
    Join,
}

/// Workflow node
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowNode {
    /// Node ID
    pub id: NodeId,
    /// Node type
    pub node_type: NodeType,
    /// Display name
    pub name: String,
    /// Node position (for visual editor)
    pub position: (f32, f32),
    /// Metadata
    pub metadata: HashMap<String, serde_json::Value>,
}

/// Workflow edge (connection between nodes)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowEdge {
    /// Source node
    pub from: NodeId,
    /// Destination node
    pub to: NodeId,
    /// Edge label (for decision branches)
    pub label: Option<String>,
}

/// Workflow definition (Melody)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Workflow {
    /// Workflow ID
    pub id: WorkflowId,
    /// Workflow name
    pub name: String,
    /// Description
    pub description: String,
    /// Nodes
    pub nodes: Vec<WorkflowNode>,
    /// Edges
    pub edges: Vec<WorkflowEdge>,
    /// Orchestration mode
    pub mode: OrchestrationMode,
    /// Priority
    pub priority: Priority,
    /// Created timestamp
    pub created_at: Timestamp,
    /// Updated timestamp
    pub updated_at: Timestamp,
}

/// Workflow execution context
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionContext {
    /// Workflow ID
    pub workflow_id: WorkflowId,
    /// Execution ID (unique per run)
    pub execution_id: EntityId,
    /// Current state
    pub state: WorkflowState,
    /// Current node
    pub current_node: Option<NodeId>,
    /// Variables
    pub variables: HashMap<String, serde_json::Value>,
    /// Start time
    pub started_at: Timestamp,
    /// End time
    pub ended_at: Option<Timestamp>,
}

/// Conductor decision
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConductorDecision {
    /// Next node to execute
    pub next_node: NodeId,
    /// Confidence score (0.0 - 1.0)
    pub confidence: f32,
    /// Reasoning
    pub reasoning: String,
    /// Estimated execution time (seconds)
    pub estimated_time: f32,
}

/// Workflow execution result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionResult {
    /// Execution ID
    pub execution_id: EntityId,
    /// Final state
    pub state: WorkflowState,
    /// Output data
    pub output: HashMap<String, serde_json::Value>,
    /// Error message (if failed)
    pub error: Option<String>,
    /// Execution duration (seconds)
    pub duration: f32,
}
