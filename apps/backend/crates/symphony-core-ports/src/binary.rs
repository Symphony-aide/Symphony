//! Two-binary architecture specific types
//!
//! This module defines types specific to Symphony's two-binary architecture
//! where Symphony and XI-editor run as separate processes with synchronized state.

use serde::{Deserialize, Serialize};
use crate::types::*;

/// Binary process state for lifecycle management
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BinaryState {
    /// Process ID
    pub process_id: ProcessId,
    /// Binary type
    pub binary_type: BinaryType,
    /// Current state
    pub state: ProcessState,
    /// Start time
    pub started_at: chrono::DateTime<chrono::Utc>,
    /// Last heartbeat
    pub last_heartbeat: chrono::DateTime<chrono::Utc>,
}

/// Process state for binary lifecycle
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ProcessState {
    /// Process is starting up
    Starting,
    /// Process is running normally
    Running,
    /// Process is stopping
    Stopping,
    /// Process has stopped
    Stopped,
    /// Process has failed
    Failed { exit_code: Option<i32> },
}

/// Health check information for binary processes
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthCheck {
    /// Process being checked
    pub process_id: ProcessId,
    /// Last check time
    pub last_check: chrono::DateTime<chrono::Utc>,
    /// Health status
    pub status: HealthStatus,
    /// Check interval
    pub check_interval: std::time::Duration,
    /// Consecutive failure count
    pub consecutive_failures: u32,
}

/// Binary synchronization message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncMessage {
    /// Source process
    pub from: ProcessId,
    /// Target process
    pub to: ProcessId,
    /// Message type
    pub message_type: String,
    /// Message payload
    pub payload: serde_json::Value,
    /// Timestamp
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

/// Process lifecycle event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProcessLifecycleEvent {
    /// Process started
    Started {
        process_id: ProcessId,
        binary_type: BinaryType,
    },
    /// Process stopped
    Stopped {
        process_id: ProcessId,
        exit_code: Option<i32>,
    },
    /// Process failed
    Failed {
        process_id: ProcessId,
        error: String,
    },
    /// Process restarted
    Restarted {
        process_id: ProcessId,
        previous_exit_code: Option<i32>,
    },
}

/// Binary coordination configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BinaryCoordinationConfig {
    /// Heartbeat interval
    pub heartbeat_interval: std::time::Duration,
    /// Health check timeout
    pub health_check_timeout: std::time::Duration,
    /// Maximum consecutive failures before restart
    pub max_consecutive_failures: u32,
    /// Process restart delay
    pub restart_delay: std::time::Duration,
}