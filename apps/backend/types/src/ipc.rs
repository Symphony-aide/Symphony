//! IPC (Inter-Process Communication) types

use crate::core::{EntityId, ProcessId};
use serde::{Deserialize, Serialize};

/// IPC transport type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TransportType {
    /// Unix domain sockets (Linux/macOS)
    UnixSocket,
    /// Named pipes (Windows)
    NamedPipe,
    /// Shared memory
    SharedMemory,
    /// TCP socket
    Tcp,
    /// WebSocket
    WebSocket,
}

/// IPC message format
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum MessageFormat {
    /// JSON
    Json,
    /// MessagePack (binary)
    MessagePack,
    /// Bincode (binary)
    Bincode,
}

/// IPC endpoint configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IpcEndpoint {
    /// Endpoint ID
    pub id: EntityId,
    /// Transport type
    pub transport: TransportType,
    /// Message format
    pub format: MessageFormat,
    /// Address (path, port, etc.)
    pub address: String,
}

/// IPC connection information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IpcConnection {
    /// Connection ID
    pub id: EntityId,
    /// Local endpoint
    pub local: IpcEndpoint,
    /// Remote endpoint
    pub remote: IpcEndpoint,
    /// Process ID of remote endpoint
    pub remote_pid: ProcessId,
    /// Connection state
    pub state: ConnectionState,
}

/// Connection state
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ConnectionState {
    /// Connecting
    Connecting,
    /// Connected
    Connected,
    /// Disconnecting
    Disconnecting,
    /// Disconnected
    Disconnected,
    /// Error
    Error,
}

/// IPC performance metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IpcMetrics {
    /// Average latency in microseconds
    pub avg_latency_us: f64,
    /// Messages sent
    pub messages_sent: u64,
    /// Messages received
    pub messages_received: u64,
    /// Bytes sent
    pub bytes_sent: u64,
    /// Bytes received
    pub bytes_received: u64,
    /// Error count
    pub errors: u64,
}

impl Default for IpcMetrics {
    fn default() -> Self {
        Self {
            avg_latency_us: 0.0,
            messages_sent: 0,
            messages_received: 0,
            bytes_sent: 0,
            bytes_received: 0,
            errors: 0,
        }
    }
}

/// IPC security context
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityContext {
    /// Process ID
    pub pid: ProcessId,
    /// User ID (Unix)
    pub uid: Option<u32>,
    /// Group ID (Unix)
    pub gid: Option<u32>,
    /// Authentication token
    pub token: Option<String>,
}
