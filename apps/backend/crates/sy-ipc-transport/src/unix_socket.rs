//! Unix domain socket transport implementation
//!
//! High-performance transport for Linux and macOS using Unix domain sockets.
//! Targets <0.1ms latency for small messages with efficient connection pooling.

use crate::traits::{Transport, Connection, TransportConfig, TransportType, PerformanceProfile, ConnectionInfo, TransportListener};
use crate::error::{TransportError, ConfigError};
use async_trait::async_trait;
use std::path::PathBuf;
use std::time::Duration;
use tokio::io::{AsyncRead, AsyncWrite, ReadBuf};
use std::pin::Pin;
use std::task::{Context, Poll};

#[cfg(unix)]
use tokio::net::{UnixStream, UnixListener};
#[cfg(unix)]
use tokio::io::{AsyncReadExt, AsyncWriteExt};

/// Unix socket transport configuration
#[derive(Debug, Clone)]
pub struct UnixSocketConfig {
    /// Path to the Unix socket file
    pub socket_path: PathBuf,
    /// Operation timeout
    pub timeout: Duration,
    /// Buffer size for I/O operations
    pub buffer_size: usize,
}

impl TransportConfig for UnixSocketConfig {
    fn endpoint(&self) -> &str {
        self.socket_path.to_str().unwrap_or("invalid_path")
    }
    
    fn timeout(&self) -> Duration {
        self.timeout
    }
    
    fn validate(&self) -> Result<(), ConfigError> {
        if self.socket_path.to_str().is_none() {
            return Err(ConfigError::InvalidEndpoint {
                message: "Invalid socket path".to_string(),
            });
        }
        
        if self.timeout.is_zero() {
            return Err(ConfigError::InvalidTimeout {
                message: "Timeout cannot be zero".to_string(),
            });
        }
        
        if self.buffer_size == 0 {
            return Err(ConfigError::InvalidParameter {
                message: "Buffer size cannot be zero".to_string(),
            });
        }
        
        Ok(())
    }
}

/// Unix socket connection
#[cfg(unix)]
#[derive(Debug)]
pub struct UnixSocketConnection {
    stream: UnixStream,
    socket_path: PathBuf,
    connection_info: ConnectionInfo,
}

/// Unix socket connection stub for non-Unix platforms
#[cfg(not(unix))]
#[derive(Debug)]
pub struct UnixSocketConnection {
    _phantom: std::marker::PhantomData<()>,
}

#[cfg(unix)]
impl UnixSocketConnection {
    /// Create a new Unix socket connection
    pub fn new(stream: UnixStream, socket_path: PathBuf) -> Self {
        Self {
            stream,
            connection_info: ConnectionInfo {
                transport_type: TransportType::UnixSocket,
                endpoint: socket_path.to_string_lossy().to_string(),
                established_at: chrono::Utc::now(),
                bytes_sent: 0,
                bytes_received: 0,
                last_activity: chrono::Utc::now(),
            },
            socket_path,
        }
    }
}

#[cfg(not(unix))]
impl UnixSocketConnection {
    /// Create a stub connection for non-Unix platforms
    pub fn new(_socket_path: PathBuf) -> Self {
        Self {
            _phantom: std::marker::PhantomData,
        }
    }
}

#[cfg(unix)]
impl AsyncRead for UnixSocketConnection {
    fn poll_read(
        mut self: Pin<&mut Self>,
        cx: &mut Context<'_>,
        buf: &mut ReadBuf<'_>,
    ) -> Poll<std::io::Result<()>> {
        Pin::new(&mut self.stream).poll_read(cx, buf)
    }
}

#[cfg(unix)]
impl AsyncWrite for UnixSocketConnection {
    fn poll_write(
        mut self: Pin<&mut Self>,
        cx: &mut Context<'_>,
        buf: &[u8],
    ) -> Poll<Result<usize, std::io::Error>> {
        Pin::new(&mut self.stream).poll_write(cx, buf)
    }
    
    fn poll_flush(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Result<(), std::io::Error>> {
        Pin::new(&mut self.stream).poll_flush(cx)
    }
    
    fn poll_shutdown(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Result<(), std::io::Error>> {
        Pin::new(&mut self.stream).poll_shutdown(cx)
    }
}

#[cfg(not(unix))]
impl AsyncRead for UnixSocketConnection {
    fn poll_read(
        self: Pin<&mut Self>,
        _cx: &mut Context<'_>,
        _buf: &mut ReadBuf<'_>,
    ) -> Poll<std::io::Result<()>> {
        Poll::Ready(Err(std::io::Error::new(
            std::io::ErrorKind::Unsupported,
            "Unix sockets not supported on this platform",
        )))
    }
}

#[cfg(not(unix))]
impl AsyncWrite for UnixSocketConnection {
    fn poll_write(
        self: Pin<&mut Self>,
        _cx: &mut Context<'_>,
        _buf: &[u8],
    ) -> Poll<Result<usize, std::io::Error>> {
        Poll::Ready(Err(std::io::Error::new(
            std::io::ErrorKind::Unsupported,
            "Unix sockets not supported on this platform",
        )))
    }
    
    fn poll_flush(self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<Result<(), std::io::Error>> {
        Poll::Ready(Ok(()))
    }
    
    fn poll_shutdown(self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<Result<(), std::io::Error>> {
        Poll::Ready(Ok(()))
    }
}

#[async_trait]
impl Connection for UnixSocketConnection {
    async fn send_with_timeout(&mut self, data: &[u8], timeout: Duration) -> Result<usize, TransportError> {
        #[cfg(unix)]
        {
            let start = std::time::Instant::now();
            
            tokio::time::timeout(timeout, self.stream.write_all(data))
                .await
                .map_err(|_| TransportError::SendTimeout)?
                .map_err(|e| TransportError::SendFailed { message: e.to_string() })?;
            
            let send_time = start.elapsed();
            if send_time > Duration::from_nanos(100_000) {
                sy_commons::debug::duck!("Unix socket send took {}μs (target: <100μs)", send_time.as_micros());
            }
            
            self.connection_info.bytes_sent += data.len() as u64;
            self.connection_info.last_activity = chrono::Utc::now();
            
            Ok(data.len())
        }
        
        #[cfg(not(unix))]
        {
            let _ = (data, timeout); // Suppress unused parameter warnings
            Err(TransportError::UnsupportedPlatform {
                message: "Unix sockets not supported on this platform".to_string(),
            })
        }
    }
    
    async fn recv_with_timeout(&mut self, buffer: &mut [u8], timeout: Duration) -> Result<usize, TransportError> {
        #[cfg(unix)]
        {
            let start = std::time::Instant::now();
            
            let bytes_received = tokio::time::timeout(timeout, self.stream.read(buffer))
                .await
                .map_err(|_| TransportError::ReceiveTimeout)?
                .map_err(|e| TransportError::ReceiveFailed { message: e.to_string() })?;
            
            let recv_time = start.elapsed();
            if recv_time > Duration::from_nanos(100_000) {
                sy_commons::debug::duck!("Unix socket recv took {}μs (target: <100μs)", recv_time.as_micros());
            }
            
            if bytes_received == 0 {
                return Err(TransportError::ConnectionClosed);
            }
            
            self.connection_info.bytes_received += bytes_received as u64;
            self.connection_info.last_activity = chrono::Utc::now();
            
            Ok(bytes_received)
        }
        
        #[cfg(not(unix))]
        {
            let _ = (buffer, timeout); // Suppress unused parameter warnings
            Err(TransportError::UnsupportedPlatform {
                message: "Unix sockets not supported on this platform".to_string(),
            })
        }
    }
    
    async fn is_healthy(&self) -> bool {
        #[cfg(unix)]
        {
            // Check if socket is still connected by attempting a zero-byte write
            match self.stream.try_write(&[]) {
                Ok(_) => true,
                Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => true,
                Err(_) => false,
            }
        }
        
        #[cfg(not(unix))]
        {
            false
        }
    }
    
    fn connection_info(&self) -> ConnectionInfo {
        #[cfg(unix)]
        {
            self.connection_info.clone()
        }
        
        #[cfg(not(unix))]
        {
            ConnectionInfo {
                transport_type: TransportType::UnixSocket,
                endpoint: "unsupported".to_string(),
                established_at: chrono::Utc::now(),
                bytes_sent: 0,
                bytes_received: 0,
                last_activity: chrono::Utc::now(),
            }
        }
    }
    
    async fn close(&mut self) -> Result<(), TransportError> {
        #[cfg(unix)]
        {
            self.stream.shutdown().await
                .map_err(|e| TransportError::CloseFailed { message: e.to_string() })
        }
        
        #[cfg(not(unix))]
        {
            Ok(())
        }
    }
}

/// Unix socket transport
pub struct UnixSocketTransport {
    performance_profile: PerformanceProfile,
}

impl UnixSocketTransport {
    /// Create a new Unix socket transport
    pub fn new() -> Self {
        Self {
            performance_profile: PerformanceProfile {
                typical_latency: Duration::from_nanos(100_000), // <0.1ms target
                max_throughput: 1_000_000_000, // 1GB/s theoretical
                connection_overhead: Duration::from_micros(50),
                platform_specific: true,
            },
        }
    }
}

impl Default for UnixSocketTransport {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl Transport for UnixSocketTransport {
    type Connection = UnixSocketConnection;
    type Config = UnixSocketConfig;
    
    async fn connect(&self, config: &Self::Config) -> Result<Self::Connection, TransportError> {
        config.validate()?;
        
        #[cfg(unix)]
        {
            let start = std::time::Instant::now();
            
            let stream = tokio::time::timeout(config.timeout(), UnixStream::connect(&config.socket_path))
                .await
                .map_err(|_| TransportError::ConnectionTimeout)?
                .map_err(|e| TransportError::ConnectionFailed { message: e.to_string() })?;
            
            let connection_time = start.elapsed();
            if connection_time > Duration::from_micros(100) {
                sy_commons::debug::duck!("Unix socket connection took {}μs (target: <100μs)", connection_time.as_micros());
            }
            
            Ok(UnixSocketConnection::new(stream, config.socket_path.clone()))
        }
        
        #[cfg(not(unix))]
        {
            Err(TransportError::UnsupportedPlatform {
                message: "Unix sockets not supported on this platform".to_string(),
            })
        }
    }
    
    async fn listen(&self, config: &Self::Config) -> Result<TransportListener<Self::Connection>, TransportError> {
        config.validate()?;
        
        #[cfg(unix)]
        {
            // Remove existing socket file if it exists
            if config.socket_path.exists() {
                std::fs::remove_file(&config.socket_path)
                    .map_err(|e| TransportError::ListenFailed {
                        message: format!("Failed to remove existing socket: {}", e),
                    })?;
            }
            
            let listener = UnixListener::bind(&config.socket_path)
                .map_err(|e| TransportError::ListenFailed { message: e.to_string() })?;
            
            // Set appropriate permissions (owner read/write only)
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                let mut perms = std::fs::metadata(&config.socket_path)
                    .map_err(|e| TransportError::ListenFailed { message: e.to_string() })?
                    .permissions();
                perms.set_mode(0o600);
                std::fs::set_permissions(&config.socket_path, perms)
                    .map_err(|e| TransportError::ListenFailed { message: e.to_string() })?;
            }
            
            Ok(TransportListener::new(listener))
        }
        
        #[cfg(not(unix))]
        {
            Err(TransportError::UnsupportedPlatform {
                message: "Unix sockets not supported on this platform".to_string(),
            })
        }
    }
    
    fn transport_type(&self) -> TransportType {
        TransportType::UnixSocket
    }
    
    fn performance_profile(&self) -> PerformanceProfile {
        self.performance_profile.clone()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::factory::*;
    
    
    
    #[cfg(feature = "unit")]
    #[test]
    fn test_unix_socket_config_validation() {
        // Valid config
        let valid_config = UnixSocketConfig {
            socket_path: UnixSocketPathTestFactory::valid(),
            timeout: TimeoutTestFactory::valid_short(),
            buffer_size: BufferSizeTestFactory::valid_medium(),
        };
        assert!(valid_config.validate().is_ok());
        
        // Invalid timeout
        let invalid_timeout_config = UnixSocketConfig {
            socket_path: UnixSocketPathTestFactory::valid(),
            timeout: TimeoutTestFactory::invalid_zero(),
            buffer_size: BufferSizeTestFactory::valid_medium(),
        };
        assert!(invalid_timeout_config.validate().is_err());
        
        // Invalid buffer size
        let invalid_buffer_config = UnixSocketConfig {
            socket_path: UnixSocketPathTestFactory::valid(),
            timeout: TimeoutTestFactory::valid_short(),
            buffer_size: BufferSizeTestFactory::invalid_zero(),
        };
        assert!(invalid_buffer_config.validate().is_err());
    }
    
    #[cfg(feature = "unit")]
    #[test]
    fn test_unix_socket_transport_creation() {
        let transport = UnixSocketTransport::new();
        assert_eq!(transport.transport_type(), TransportType::UnixSocket);
        
        let profile = transport.performance_profile();
        assert_eq!(profile.typical_latency, Duration::from_nanos(100_000));
        assert!(profile.platform_specific);
    }
    
    #[cfg(feature = "unit")]
    #[test]
    fn test_unix_socket_config_endpoint() {
        let socket_path = UnixSocketPathTestFactory::valid();
        let config = UnixSocketConfig {
            socket_path: socket_path.clone(),
            timeout: TimeoutTestFactory::valid_short(),
            buffer_size: BufferSizeTestFactory::valid_medium(),
        };
        
        assert_eq!(config.endpoint(), socket_path.to_str().unwrap());
        assert_eq!(config.timeout(), Duration::from_millis(100));
    }
    
    #[cfg(all(feature = "integration", unix))]
    #[tokio::test]
    async fn test_unix_socket_connection_lifecycle() {
        use tempfile::TempDir;
        
        let temp_dir = TempDir::new().unwrap();
        let socket_path = temp_dir.path().join("test.sock");
        
        let config = UnixSocketConfig {
            socket_path,
            timeout: TimeoutTestFactory::valid_medium(),
            buffer_size: BufferSizeTestFactory::valid_medium(),
        };
        
        let transport = UnixSocketTransport::new();
        
        // Test that connection fails when no listener
        let result = transport.connect(&config).await;
        assert!(result.is_err());
        
        // Test listener creation
        let listener_result = transport.listen(&config).await;
        assert!(listener_result.is_ok());
    }
    
    #[cfg(all(feature = "integration", not(unix)))]
    #[tokio::test]
    async fn test_unix_socket_connection_lifecycle_unsupported_platform() {
        use tempfile::TempDir;
        
        let temp_dir = TempDir::new().unwrap();
        let socket_path = temp_dir.path().join("test.sock");
        
        let config = UnixSocketConfig {
            socket_path,
            timeout: TimeoutTestFactory::valid_medium(),
            buffer_size: BufferSizeTestFactory::valid_medium(),
        };
        
        let transport = UnixSocketTransport::new();
        
        // On non-Unix platforms, operations should fail with UnsupportedPlatform
        let result = transport.connect(&config).await;
        assert!(result.is_err());
        
        match result {
            Err(TransportError::UnsupportedPlatform { message }) => {
                assert!(message.contains("Unix sockets not supported"));
                println!("✅ Expected behavior: Unix sockets not supported on this platform (Windows)");
            }
            other => {
                panic!("Expected UnsupportedPlatform error, got: {:?}", other);
            }
        }
    }
    
    #[cfg(all(feature = "integration", unix))]
    #[tokio::test]
    async fn test_unix_socket_data_transmission() {
        use tempfile::TempDir;
        
        let temp_dir = TempDir::new().unwrap();
        let socket_path = temp_dir.path().join("test_data.sock");
        
        let config = UnixSocketConfig {
            socket_path,
            timeout: TimeoutTestFactory::valid_medium(),
            buffer_size: BufferSizeTestFactory::valid_medium(),
        };
        
        let transport = UnixSocketTransport::new();
        
        // Start listener in background
        let _listener = transport.listen(&config).await.unwrap();
        
        // Note: Full client-server test would require spawning a server task
        // This is a basic structure test
        let payload = PayloadTestFactory::medium();
        assert!(!payload.is_empty());
    }
    
    #[cfg(all(feature = "integration", not(unix)))]
    #[tokio::test]
    async fn test_unix_socket_data_transmission_unsupported_platform() {
        use tempfile::TempDir;
        
        let temp_dir = TempDir::new().unwrap();
        let socket_path = temp_dir.path().join("test_data.sock");
        
        let config = UnixSocketConfig {
            socket_path,
            timeout: TimeoutTestFactory::valid_medium(),
            buffer_size: BufferSizeTestFactory::valid_medium(),
        };
        
        let transport = UnixSocketTransport::new();
        
        // On non-Unix platforms, listener creation should fail
        let result = transport.listen(&config).await;
        assert!(result.is_err());
        
        match result {
            Err(TransportError::UnsupportedPlatform { message }) => {
                assert!(message.contains("Unix sockets not supported"));
                println!("✅ Expected behavior: Unix sockets not supported on this platform (Windows)");
            }
            other => {
                panic!("Expected UnsupportedPlatform error, got: {:?}", other);
            }
        }
    }
}