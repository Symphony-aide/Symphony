//! Core transport abstractions and traits
//!
//! Defines the unified interface for all transport implementations, enabling
//! seamless switching between Unix sockets, named pipes, and STDIO transport.

use async_trait::async_trait;
use std::time::Duration;
use tokio::io::{AsyncRead, AsyncWrite};
use crate::error::{TransportError, ConfigError};

/// Transport type identifier
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum TransportType {
    /// Unix domain socket (Linux/macOS)
    UnixSocket,
    /// Windows named pipe
    NamedPipe,
    /// Process stdin/stdout
    Stdio,
}

/// Performance characteristics of a transport
#[derive(Debug, Clone)]
pub struct PerformanceProfile {
    /// Typical latency for small messages
    pub typical_latency: Duration,
    /// Maximum theoretical throughput (bytes per second)
    pub max_throughput: u64,
    /// Connection establishment overhead
    pub connection_overhead: Duration,
    /// Whether this transport is platform-specific
    pub platform_specific: bool,
}

/// Connection metadata and statistics
#[derive(Debug, Clone)]
pub struct ConnectionInfo {
    /// Transport type used for this connection
    pub transport_type: TransportType,
    /// Endpoint address or identifier
    pub endpoint: String,
    /// When the connection was established
    pub established_at: chrono::DateTime<chrono::Utc>,
    /// Total bytes sent through this connection
    pub bytes_sent: u64,
    /// Total bytes received through this connection
    pub bytes_received: u64,
    /// Last activity timestamp
    pub last_activity: chrono::DateTime<chrono::Utc>,
}

/// Transport configuration trait
///
/// All transport configurations must implement this trait to provide
/// common configuration validation and access methods.
pub trait TransportConfig: Clone + Send + Sync {
    /// Get the endpoint address or identifier
    fn endpoint(&self) -> &str;
    
    /// Get the operation timeout
    fn timeout(&self) -> Duration;
    
    /// Validate the configuration
    fn validate(&self) -> Result<(), ConfigError>;
}

/// Connection trait for active transport connections
///
/// Provides async I/O operations with timeout support and health monitoring.
#[async_trait]
pub trait Connection: AsyncRead + AsyncWrite + Send + Sync + Unpin {
    /// Send data with timeout
    ///
    /// # Arguments
    /// * `data` - Data to send
    /// * `timeout` - Maximum time to wait for send completion
    ///
    /// # Returns
    /// Number of bytes sent
    ///
    /// # Errors
    /// Returns `TransportError::SendTimeout` if the operation times out,
    /// or `TransportError::SendFailed` if the send operation fails.
    async fn send_with_timeout(&mut self, data: &[u8], timeout: Duration) -> Result<usize, TransportError>;
    
    /// Receive data with timeout
    ///
    /// # Arguments
    /// * `buffer` - Buffer to receive data into
    /// * `timeout` - Maximum time to wait for data
    ///
    /// # Returns
    /// Number of bytes received
    ///
    /// # Errors
    /// Returns `TransportError::ReceiveTimeout` if the operation times out,
    /// or `TransportError::ReceiveFailed` if the receive operation fails.
    async fn recv_with_timeout(&mut self, buffer: &mut [u8], timeout: Duration) -> Result<usize, TransportError>;
    
    /// Check if the connection is healthy
    ///
    /// # Returns
    /// `true` if the connection is healthy and can be used for I/O operations
    async fn is_healthy(&self) -> bool;
    
    /// Get connection metadata and statistics
    fn connection_info(&self) -> ConnectionInfo;
    
    /// Gracefully close the connection
    ///
    /// # Errors
    /// Returns `TransportError::CloseFailed` if the close operation fails.
    async fn close(&mut self) -> Result<(), TransportError>;
}

/// Transport listener for accepting incoming connections
#[derive(Debug)]
pub struct TransportListener<C: Connection> {
    _phantom: std::marker::PhantomData<C>,
}

impl<C: Connection> TransportListener<C> {
    /// Create a new transport listener
    pub fn new<T>(_listener: T) -> Self {
        Self {
            _phantom: std::marker::PhantomData,
        }
    }
    
    /// Accept an incoming connection
    ///
    /// # Errors
    /// Returns `TransportError` if accepting the connection fails.
    pub fn accept(&mut self) -> Result<C, TransportError> {
        // This is a placeholder implementation
        // Real implementations will be provided by concrete transport types
        Err(TransportError::UnsupportedOperation {
            message: "Accept not implemented for this transport".to_string(),
        })
    }
}

/// Main transport trait for establishing connections
///
/// All transport implementations must implement this trait to provide
/// a unified interface for connection establishment and management.
#[async_trait]
pub trait Transport: Send + Sync {
    /// Connection type produced by this transport
    type Connection: Connection;
    /// Configuration type for this transport
    type Config: TransportConfig;
    
    /// Connect to an endpoint
    ///
    /// # Arguments
    /// * `config` - Transport configuration including endpoint and options
    ///
    /// # Returns
    /// An active connection to the endpoint
    ///
    /// # Errors
    /// Returns `TransportError::ConnectionFailed` if the connection cannot be established,
    /// or `TransportError::ConnectionTimeout` if the connection times out.
    async fn connect(&self, config: &Self::Config) -> Result<Self::Connection, TransportError>;
    
    /// Listen for incoming connections (server mode)
    ///
    /// # Arguments
    /// * `config` - Transport configuration for the listening endpoint
    ///
    /// # Returns
    /// A listener that can accept incoming connections
    ///
    /// # Errors
    /// Returns `TransportError::ListenFailed` if the listener cannot be created.
    async fn listen(&self, config: &Self::Config) -> Result<TransportListener<Self::Connection>, TransportError>;
    
    /// Get the transport type identifier
    fn transport_type(&self) -> TransportType;
    
    /// Get performance characteristics of this transport
    fn performance_profile(&self) -> PerformanceProfile;
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::factory::*;
    use std::time::Duration;
    
    
    
    #[cfg(feature = "unit")]
    #[test]
    fn test_transport_type_equality() {
        assert_eq!(TransportType::UnixSocket, TransportType::UnixSocket);
        assert_ne!(TransportType::UnixSocket, TransportType::NamedPipe);
        assert_ne!(TransportType::NamedPipe, TransportType::Stdio);
    }
    
    #[cfg(feature = "unit")]
    #[test]
    fn test_performance_profile_creation() {
        let profile = PerformanceProfile {
            typical_latency: TimeoutTestFactory::valid_short(),
            max_throughput: 1_000_000,
            connection_overhead: TimeoutTestFactory::very_short(),
            platform_specific: true,
        };
        
        assert_eq!(profile.typical_latency, Duration::from_millis(100));
        assert_eq!(profile.max_throughput, 1_000_000);
        assert!(profile.platform_specific);
    }
    
    #[cfg(feature = "unit")]
    #[test]
    fn test_connection_info_creation() {
        let (endpoint, bytes_sent, bytes_received) = ConnectionInfoTestFactory::unix_socket();
        let now = chrono::Utc::now();
        
        let info = ConnectionInfo {
            transport_type: TransportType::UnixSocket,
            endpoint,
            established_at: now,
            bytes_sent,
            bytes_received,
            last_activity: now,
        };
        
        assert_eq!(info.transport_type, TransportType::UnixSocket);
        assert!(info.endpoint.contains("/tmp/symphony_test_"));
        assert_eq!(info.established_at, now);
    }
}