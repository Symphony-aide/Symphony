# F004 - Transport Layer Implementation - Design

**Feature ID**: F004  
**Design Date**: December 28, 2025  
**Architecture**: Cross-platform transport abstraction with connection pooling  
**Implementation**: Unix sockets + Named pipes + STDIO transport  

---

## System Architecture

### Transport Layer Architecture Overview
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SYMPHONY TRANSPORT LAYER ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                        TRANSPORT ABSTRACTION                           │ │
│  │                                                                        │ │
│  │   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │ │
│  │   │   Transport     │  │  Connection     │  │   Transport     │      │ │
│  │   │     Trait       │  │    Config       │  │     Error       │      │ │
│  │   │                 │  │                 │  │                 │      │ │
│  │   │• async send()   │  │• Endpoint addr  │  │• Unified errors │      │ │
│  │   │• async recv()   │  │• Timeout config │  │• Error context  │      │ │
│  │   │• connect()      │  │• Pool settings  │  │• Recovery hints │      │ │
│  │   │• disconnect()   │  │• Security opts  │  │• Retry logic    │      │ │
│  │   └─────────┬───────┘  └─────────┬───────┘  └─────────┬───────┘      │ │
│  │             │                    │                    │                │ │
│  │             └────────────────────┼────────────────────┘                │ │
│  │                                  │                                     │ │
│  └──────────────────────────────────┼─────────────────────────────────────┘ │
│                                     │                                       │
│  ┌──────────────────────────────────┼─────────────────────────────────────┐ │
│  │                        PLATFORM IMPLEMENTATIONS                        │ │
│  │                                  │                                      │ │
│  │  ┌──────────────┐ ┌─────────────┴─────────────┐ ┌──────────────┐      │ │
│  │  │ Unix Socket  │ │    Named Pipe             │ │ STDIO        │      │ │
│  │  │ Transport    │ │    Transport              │ │ Transport    │      │ │
│  │  │              │ │                           │ │              │      │ │
│  │  │• <0.1ms      │ │• <0.2ms latency          │ │• <1ms        │      │ │
│  │  │• Linux/macOS │ │• Windows only             │ │• Cross-      │      │ │
│  │  │• High perf   │ │• Security descriptors     │ │  platform    │      │ │
│  │  │• Connection  │ │• Connection pooling       │ │• Process     │      │ │
│  │  │  pooling     │ │• Auto-reconnect           │ │  stdin/out   │      │ │
│  │  └──────┬───────┘ └─────────────┬─────────────┘ └──────┬───────┘      │ │
│  │         │                       │                      │                │ │
│  └─────────┼───────────────────────┼──────────────────────┼────────────────┘ │
│            │                       │                      │                  │
│  ┌─────────┼───────────────────────┼──────────────────────┼────────────────┐ │
│  │         │              CONNECTION MANAGEMENT          │                 │ │
│  │         │                       │                      │                 │ │
│  │  ┌──────┴───────┐ ┌─────────────┴─────────────┐ ┌──────┴───────┐        │ │
│  │  │ Connection   │ │    Reconnection           │ │   Health     │        │ │
│  │  │    Pool      │ │     Manager               │ │  Monitor     │        │ │
│  │  │              │ │                           │ │              │        │ │
│  │  │• Per-        │ │• Exponential backoff     │ │• Connection  │        │ │
│  │  │  transport   │ │• Configurable retries    │ │  health      │        │ │
│  │  │• Configurable│ │• Circuit breaker         │ │• Failure     │        │ │
│  │  │  limits      │ │• Failure detection       │ │  detection   │        │ │
│  │  │• Resource    │ │• State recovery          │ │• Metrics     │        │ │
│  │  │  cleanup     │ │• Graceful degradation    │ │  collection  │        │ │
│  │  └──────────────┘ └───────────────────────────┘ └──────────────┘        │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                           INTEGRATION LAYER                             │ │
│  │                                                                         │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │ │
│  │  │   Message    │ │   Message    │ │   Binary     │ │   Future     │  │ │
│  │  │   Protocol   │ │     Bus      │ │    Bridge    │ │ Extensions   │  │ │
│  │  │ Integration  │ │ Integration  │ │ Integration  │ │ Integration  │  │ │
│  │  │              │ │              │ │              │ │              │  │ │
│  │  │• F003 msgs   │ │• F005 routing│ │• F006 XI-ed  │ │• Extension   │  │ │
│  │  │• Serialized  │ │• Pub/sub     │ │• JSON-RPC    │ │  protocols   │  │ │
│  │  │  data        │ │• Correlation │ │• Event       │ │• Custom      │  │ │
│  │  │• Protocol    │ │• Load        │ │  streaming   │ │  transports  │  │ │
│  │  │  compliance  │ │  balancing   │ │• Process mgmt│ │• Security    │  │ │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Module Design

### 1. Transport Abstraction (`src/traits.rs`)

#### Core Transport Trait
```rust
use async_trait::async_trait;
use std::time::Duration;
use tokio::io::{AsyncRead, AsyncWrite};

#[async_trait]
pub trait Transport: Send + Sync {
    type Connection: Connection;
    type Config: TransportConfig;
    
    /// Connect to an endpoint
    async fn connect(&self, config: &Self::Config) -> Result<Self::Connection, TransportError>;
    
    /// Listen for incoming connections (server mode)
    async fn listen(&self, config: &Self::Config) -> Result<TransportListener<Self::Connection>, TransportError>;
    
    /// Get transport type identifier
    fn transport_type(&self) -> TransportType;
    
    /// Get performance characteristics
    fn performance_profile(&self) -> PerformanceProfile;
}

#[async_trait]
pub trait Connection: AsyncRead + AsyncWrite + Send + Sync {
    /// Send data with timeout
    async fn send_with_timeout(&mut self, data: &[u8], timeout: Duration) -> Result<usize, TransportError>;
    
    /// Receive data with timeout
    async fn recv_with_timeout(&mut self, buffer: &mut [u8], timeout: Duration) -> Result<usize, TransportError>;
    
    /// Check if connection is healthy
    async fn is_healthy(&self) -> bool;
    
    /// Get connection metadata
    fn connection_info(&self) -> ConnectionInfo;
    
    /// Gracefully close connection
    async fn close(&mut self) -> Result<(), TransportError>;
}

pub trait TransportConfig: Clone + Send + Sync {
    fn endpoint(&self) -> &str;
    fn timeout(&self) -> Duration;
    fn validate(&self) -> Result<(), ConfigError>;
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TransportType {
    UnixSocket,
    NamedPipe,
    Stdio,
}

#[derive(Debug, Clone)]
pub struct PerformanceProfile {
    pub typical_latency: Duration,
    pub max_throughput: u64, // bytes per second
    pub connection_overhead: Duration,
    pub platform_specific: bool,
}

#[derive(Debug, Clone)]
pub struct ConnectionInfo {
    pub transport_type: TransportType,
    pub endpoint: String,
    pub established_at: chrono::DateTime<chrono::Utc>,
    pub bytes_sent: u64,
    pub bytes_received: u64,
    pub last_activity: chrono::DateTime<chrono::Utc>,
}
```

### 2. Unix Socket Implementation (`src/unix_socket.rs`)

#### High-Performance Unix Domain Sockets
```rust
use tokio::net::{UnixStream, UnixListener};
use std::path::PathBuf;

pub struct UnixSocketTransport {
    performance_profile: PerformanceProfile,
}

impl UnixSocketTransport {
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

#[async_trait]
impl Transport for UnixSocketTransport {
    type Connection = UnixSocketConnection;
    type Config = UnixSocketConfig;
    
    async fn connect(&self, config: &Self::Config) -> Result<Self::Connection, TransportError> {
        let start = std::time::Instant::now();
        
        let stream = tokio::time::timeout(config.timeout(), UnixStream::connect(&config.socket_path))
            .await
            .map_err(|_| TransportError::ConnectionTimeout)?
            .map_err(|e| TransportError::ConnectionFailed(e.to_string()))?;
        
        let connection_time = start.elapsed();
        if connection_time > Duration::from_micros(100) {
            tracing::warn!("Unix socket connection took {}μs (target: <100μs)", connection_time.as_micros());
        }
        
        Ok(UnixSocketConnection::new(stream, config.socket_path.clone()))
    }
    
    async fn listen(&self, config: &Self::Config) -> Result<TransportListener<Self::Connection>, TransportError> {
        // Remove existing socket file if it exists
        if config.socket_path.exists() {
            std::fs::remove_file(&config.socket_path)
                .map_err(|e| TransportError::ListenFailed(format!("Failed to remove existing socket: {}", e)))?;
        }
        
        let listener = UnixListener::bind(&config.socket_path)
            .map_err(|e| TransportError::ListenFailed(e.to_string()))?;
        
        // Set appropriate permissions
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let mut perms = std::fs::metadata(&config.socket_path)
                .map_err(|e| TransportError::ListenFailed(e.to_string()))?
                .permissions();
            perms.set_mode(0o600); // Owner read/write only
            std::fs::set_permissions(&config.socket_path, perms)
                .map_err(|e| TransportError::ListenFailed(e.to_string()))?;
        }
        
        Ok(TransportListener::new(listener))
    }
    
    fn transport_type(&self) -> TransportType {
        TransportType::UnixSocket
    }
    
    fn performance_profile(&self) -> PerformanceProfile {
        self.performance_profile.clone()
    }
}

pub struct UnixSocketConnection {
    stream: UnixStream,
    socket_path: PathBuf,
    connection_info: ConnectionInfo,
}

impl UnixSocketConnection {
    fn new(stream: UnixStream, socket_path: PathBuf) -> Self {
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

#[async_trait]
impl Connection for UnixSocketConnection {
    async fn send_with_timeout(&mut self, data: &[u8], timeout: Duration) -> Result<usize, TransportError> {
        let start = std::time::Instant::now();
        
        let bytes_sent = tokio::time::timeout(timeout, self.stream.write_all(data))
            .await
            .map_err(|_| TransportError::SendTimeout)?
            .map_err(|e| TransportError::SendFailed(e.to_string()))?;
        
        let send_time = start.elapsed();
        if send_time > Duration::from_nanos(100_000) {
            tracing::warn!("Unix socket send took {}μs (target: <100μs)", send_time.as_micros());
        }
        
        self.connection_info.bytes_sent += data.len() as u64;
        self.connection_info.last_activity = chrono::Utc::now();
        
        Ok(data.len())
    }
    
    async fn recv_with_timeout(&mut self, buffer: &mut [u8], timeout: Duration) -> Result<usize, TransportError> {
        let start = std::time::Instant::now();
        
        let bytes_received = tokio::time::timeout(timeout, self.stream.read(buffer))
            .await
            .map_err(|_| TransportError::ReceiveTimeout)?
            .map_err(|e| TransportError::ReceiveFailed(e.to_string()))?;
        
        let recv_time = start.elapsed();
        if recv_time > Duration::from_nanos(100_000) {
            tracing::warn!("Unix socket recv took {}μs (target: <100μs)", recv_time.as_micros());
        }
        
        self.connection_info.bytes_received += bytes_received as u64;
        self.connection_info.last_activity = chrono::Utc::now();
        
        Ok(bytes_received)
    }
    
    async fn is_healthy(&self) -> bool {
        // Check if socket is still connected by attempting a zero-byte write
        match self.stream.try_write(&[]) {
            Ok(_) => true,
            Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => true,
            Err(_) => false,
        }
    }
    
    fn connection_info(&self) -> ConnectionInfo {
        self.connection_info.clone()
    }
    
    async fn close(&mut self) -> Result<(), TransportError> {
        self.stream.shutdown().await
            .map_err(|e| TransportError::CloseFailed(e.to_string()))
    }
}

#[derive(Debug, Clone)]
pub struct UnixSocketConfig {
    pub socket_path: PathBuf,
    pub timeout: Duration,
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
            return Err(ConfigError::InvalidEndpoint("Invalid socket path".to_string()));
        }
        
        if self.timeout.is_zero() {
            return Err(ConfigError::InvalidTimeout("Timeout cannot be zero".to_string()));
        }
        
        if self.buffer_size == 0 {
            return Err(ConfigError::InvalidParameter("Buffer size cannot be zero".to_string()));
        }
        
        Ok(())
    }
}
```

### 3. Named Pipe Implementation (`src/named_pipe.rs`)

#### Windows Named Pipe Transport
```rust
#[cfg(windows)]
use tokio::net::windows::named_pipe::{NamedPipeServer, NamedPipeClient};

#[cfg(windows)]
pub struct NamedPipeTransport {
    performance_profile: PerformanceProfile,
}

#[cfg(windows)]
impl NamedPipeTransport {
    pub fn new() -> Self {
        Self {
            performance_profile: PerformanceProfile {
                typical_latency: Duration::from_nanos(200_000), // <0.2ms target
                max_throughput: 500_000_000, // 500MB/s typical
                connection_overhead: Duration::from_micros(100),
                platform_specific: true,
            },
        }
    }
}

#[cfg(windows)]
#[async_trait]
impl Transport for NamedPipeTransport {
    type Connection = NamedPipeConnection;
    type Config = NamedPipeConfig;
    
    async fn connect(&self, config: &Self::Config) -> Result<Self::Connection, TransportError> {
        let start = std::time::Instant::now();
        
        let client = tokio::time::timeout(
            config.timeout(),
            NamedPipeClient::connect(&config.pipe_name)
        )
        .await
        .map_err(|_| TransportError::ConnectionTimeout)?
        .map_err(|e| TransportError::ConnectionFailed(e.to_string()))?;
        
        let connection_time = start.elapsed();
        if connection_time > Duration::from_micros(200) {
            tracing::warn!("Named pipe connection took {}μs (target: <200μs)", connection_time.as_micros());
        }
        
        Ok(NamedPipeConnection::new(client, config.pipe_name.clone()))
    }
    
    async fn listen(&self, config: &Self::Config) -> Result<TransportListener<Self::Connection>, TransportError> {
        let server = NamedPipeServer::create(&config.pipe_name)
            .map_err(|e| TransportError::ListenFailed(e.to_string()))?;
        
        Ok(TransportListener::new(server))
    }
    
    fn transport_type(&self) -> TransportType {
        TransportType::NamedPipe
    }
    
    fn performance_profile(&self) -> PerformanceProfile {
        self.performance_profile.clone()
    }
}

#[cfg(windows)]
#[derive(Debug, Clone)]
pub struct NamedPipeConfig {
    pub pipe_name: String,
    pub timeout: Duration,
    pub buffer_size: usize,
    pub security_descriptor: Option<String>,
}

#[cfg(windows)]
impl TransportConfig for NamedPipeConfig {
    fn endpoint(&self) -> &str {
        &self.pipe_name
    }
    
    fn timeout(&self) -> Duration {
        self.timeout
    }
    
    fn validate(&self) -> Result<(), ConfigError> {
        if !self.pipe_name.starts_with(r"\\.\pipe\") {
            return Err(ConfigError::InvalidEndpoint("Named pipe must start with '\\\\.\\pipe\\'".to_string()));
        }
        
        if self.timeout.is_zero() {
            return Err(ConfigError::InvalidTimeout("Timeout cannot be zero".to_string()));
        }
        
        Ok(())
    }
}

// Non-Windows platforms get stub implementations
#[cfg(not(windows))]
pub struct NamedPipeTransport;

#[cfg(not(windows))]
impl NamedPipeTransport {
    pub fn new() -> Self {
        Self
    }
}

#[cfg(not(windows))]
#[async_trait]
impl Transport for NamedPipeTransport {
    type Connection = StubConnection;
    type Config = StubConfig;
    
    async fn connect(&self, _config: &Self::Config) -> Result<Self::Connection, TransportError> {
        Err(TransportError::UnsupportedPlatform("Named pipes not supported on this platform".to_string()))
    }
    
    async fn listen(&self, _config: &Self::Config) -> Result<TransportListener<Self::Connection>, TransportError> {
        Err(TransportError::UnsupportedPlatform("Named pipes not supported on this platform".to_string()))
    }
    
    fn transport_type(&self) -> TransportType {
        TransportType::NamedPipe
    }
    
    fn performance_profile(&self) -> PerformanceProfile {
        PerformanceProfile {
            typical_latency: Duration::from_millis(1000),
            max_throughput: 0,
            connection_overhead: Duration::from_millis(1000),
            platform_specific: true,
        }
    }
}
```

### 4. STDIO Transport (`src/stdio.rs`)

#### Process STDIO Communication
```rust
use tokio::process::{Child, Command};
use tokio::io::{BufReader, BufWriter, AsyncBufReadExt, AsyncWriteExt};

pub struct StdioTransport {
    performance_profile: PerformanceProfile,
}

impl StdioTransport {
    pub fn new() -> Self {
        Self {
            performance_profile: PerformanceProfile {
                typical_latency: Duration::from_millis(1), // <1ms target
                max_throughput: 10_000_000, // 10MB/s typical for process I/O
                connection_overhead: Duration::from_millis(100), // Process startup
                platform_specific: false,
            },
        }
    }
}

#[async_trait]
impl Transport for StdioTransport {
    type Connection = StdioConnection;
    type Config = StdioConfig;
    
    async fn connect(&self, config: &Self::Config) -> Result<Self::Connection, TransportError> {
        let start = std::time::Instant::now();
        
        let mut command = Command::new(&config.command);
        command.args(&config.args);
        command.stdin(std::process::Stdio::piped());
        command.stdout(std::process::Stdio::piped());
        command.stderr(std::process::Stdio::piped());
        
        let child = command.spawn()
            .map_err(|e| TransportError::ConnectionFailed(format!("Failed to spawn process: {}", e)))?;
        
        let connection_time = start.elapsed();
        if connection_time > Duration::from_millis(1) {
            tracing::warn!("STDIO process spawn took {}ms (target: <1ms)", connection_time.as_millis());
        }
        
        Ok(StdioConnection::new(child, config.clone()))
    }
    
    async fn listen(&self, _config: &Self::Config) -> Result<TransportListener<Self::Connection>, TransportError> {
        Err(TransportError::UnsupportedOperation("STDIO transport does not support listening".to_string()))
    }
    
    fn transport_type(&self) -> TransportType {
        TransportType::Stdio
    }
    
    fn performance_profile(&self) -> PerformanceProfile {
        self.performance_profile.clone()
    }
}

pub struct StdioConnection {
    child: Child,
    stdin: BufWriter<tokio::process::ChildStdin>,
    stdout: BufReader<tokio::process::ChildStdout>,
    connection_info: ConnectionInfo,
    line_buffer: String,
}

impl StdioConnection {
    fn new(mut child: Child, config: StdioConfig) -> Self {
        let stdin = BufWriter::new(child.stdin.take().unwrap());
        let stdout = BufReader::new(child.stdout.take().unwrap());
        
        Self {
            child,
            stdin,
            stdout,
            connection_info: ConnectionInfo {
                transport_type: TransportType::Stdio,
                endpoint: format!("{} {}", config.command, config.args.join(" ")),
                established_at: chrono::Utc::now(),
                bytes_sent: 0,
                bytes_received: 0,
                last_activity: chrono::Utc::now(),
            },
            line_buffer: String::new(),
        }
    }
    
    /// Send a line-delimited message (for JSON-RPC)
    pub async fn send_line(&mut self, line: &str) -> Result<(), TransportError> {
        let start = std::time::Instant::now();
        
        self.stdin.write_all(line.as_bytes()).await
            .map_err(|e| TransportError::SendFailed(e.to_string()))?;
        self.stdin.write_all(b"\n").await
            .map_err(|e| TransportError::SendFailed(e.to_string()))?;
        self.stdin.flush().await
            .map_err(|e| TransportError::SendFailed(e.to_string()))?;
        
        let send_time = start.elapsed();
        if send_time > Duration::from_millis(1) {
            tracing::warn!("STDIO send took {}ms (target: <1ms)", send_time.as_millis());
        }
        
        self.connection_info.bytes_sent += line.len() as u64 + 1;
        self.connection_info.last_activity = chrono::Utc::now();
        
        Ok(())
    }
    
    /// Receive a line-delimited message (for JSON-RPC)
    pub async fn recv_line(&mut self) -> Result<String, TransportError> {
        let start = std::time::Instant::now();
        
        self.line_buffer.clear();
        let bytes_read = self.stdout.read_line(&mut self.line_buffer).await
            .map_err(|e| TransportError::ReceiveFailed(e.to_string()))?;
        
        if bytes_read == 0 {
            return Err(TransportError::ConnectionClosed);
        }
        
        let recv_time = start.elapsed();
        if recv_time > Duration::from_millis(1) {
            tracing::warn!("STDIO recv took {}ms (target: <1ms)", recv_time.as_millis());
        }
        
        // Remove trailing newline
        if self.line_buffer.ends_with('\n') {
            self.line_buffer.pop();
            if self.line_buffer.ends_with('\r') {
                self.line_buffer.pop();
            }
        }
        
        self.connection_info.bytes_received += bytes_read as u64;
        self.connection_info.last_activity = chrono::Utc::now();
        
        Ok(self.line_buffer.clone())
    }
    
    /// Check if the child process is still running
    pub fn is_process_running(&mut self) -> bool {
        match self.child.try_wait() {
            Ok(Some(_)) => false, // Process has exited
            Ok(None) => true,     // Process is still running
            Err(_) => false,      // Error checking status
        }
    }
}

#[async_trait]
impl Connection for StdioConnection {
    async fn send_with_timeout(&mut self, data: &[u8], timeout: Duration) -> Result<usize, TransportError> {
        let line = std::str::from_utf8(data)
            .map_err(|e| TransportError::SendFailed(format!("Invalid UTF-8: {}", e)))?;
        
        tokio::time::timeout(timeout, self.send_line(line))
            .await
            .map_err(|_| TransportError::SendTimeout)?
            .map(|_| data.len())
    }
    
    async fn recv_with_timeout(&mut self, buffer: &mut [u8], timeout: Duration) -> Result<usize, TransportError> {
        let line = tokio::time::timeout(timeout, self.recv_line())
            .await
            .map_err(|_| TransportError::ReceiveTimeout)??;
        
        let bytes = line.as_bytes();
        if bytes.len() > buffer.len() {
            return Err(TransportError::BufferTooSmall);
        }
        
        buffer[..bytes.len()].copy_from_slice(bytes);
        Ok(bytes.len())
    }
    
    async fn is_healthy(&self) -> bool {
        // Check if process is still running
        match self.child.try_wait() {
            Ok(Some(_)) => false, // Process has exited
            Ok(None) => true,     // Process is still running
            Err(_) => false,      // Error checking status
        }
    }
    
    fn connection_info(&self) -> ConnectionInfo {
        self.connection_info.clone()
    }
    
    async fn close(&mut self) -> Result<(), TransportError> {
        // Close stdin to signal the process to exit
        drop(self.stdin);
        
        // Wait for process to exit gracefully
        match tokio::time::timeout(Duration::from_secs(5), self.child.wait()).await {
            Ok(Ok(_)) => Ok(()),
            Ok(Err(e)) => Err(TransportError::CloseFailed(e.to_string())),
            Err(_) => {
                // Force kill if graceful shutdown times out
                self.child.kill().await
                    .map_err(|e| TransportError::CloseFailed(e.to_string()))?;
                Ok(())
            }
        }
    }
}

#[derive(Debug, Clone)]
pub struct StdioConfig {
    pub command: String,
    pub args: Vec<String>,
    pub timeout: Duration,
    pub working_directory: Option<PathBuf>,
    pub environment: HashMap<String, String>,
}

impl TransportConfig for StdioConfig {
    fn endpoint(&self) -> &str {
        &self.command
    }
    
    fn timeout(&self) -> Duration {
        self.timeout
    }
    
    fn validate(&self) -> Result<(), ConfigError> {
        if self.command.is_empty() {
            return Err(ConfigError::InvalidEndpoint("Command cannot be empty".to_string()));
        }
        
        if self.timeout.is_zero() {
            return Err(ConfigError::InvalidTimeout("Timeout cannot be zero".to_string()));
        }
        
        Ok(())
    }
}
```

## Performance Considerations

### Latency Optimization
- **Zero-Copy Operations**: Use `tokio::io::copy` and similar zero-copy operations where possible
- **Buffer Reuse**: Reuse buffers to reduce allocations
- **Async I/O**: All operations use async I/O to avoid blocking
- **Connection Pooling**: Reuse connections to amortize connection overhead

### Memory Management
- **Connection Pooling**: Limit memory usage with configurable pool sizes
- **Buffer Management**: Use fixed-size buffers with overflow handling
- **Resource Cleanup**: Automatic cleanup of connections and file descriptors
- **Leak Detection**: Monitor for resource leaks in development

### Error Handling Strategy

### Error Categories
1. **Connection Errors**: Failed to establish or maintain connections
2. **I/O Errors**: Data transmission failures
3. **Timeout Errors**: Operations exceeding configured timeouts
4. **Platform Errors**: Platform-specific transport failures

### Recovery Mechanisms
- **Automatic Reconnection**: Exponential backoff with configurable limits
- **Circuit Breaker**: Prevent cascade failures
- **Graceful Degradation**: Continue with reduced functionality
- **Health Monitoring**: Proactive failure detection

---

**Design Complete**: Ready for TESTING phase