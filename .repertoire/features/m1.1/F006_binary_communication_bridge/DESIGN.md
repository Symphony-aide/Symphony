# F006 - Binary Communication Bridge - Design

**Feature ID**: F006  
**Design Date**: December 28, 2025  
**Architecture**: Symphony ↔ XI-editor binary communication bridge  
**Implementation**: JSON-RPC client + event streaming + state synchronization  

---

## System Architecture

### Binary Communication Bridge Overview
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   SYMPHONY ↔ XI-EDITOR COMMUNICATION BRIDGE                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                        SYMPHONY PROCESS                                │ │
│  │                                                                        │ │
│  │   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │ │
│  │   │   XI-editor     │  │   JSON-RPC      │  │   Event         │      │ │
│  │   │   Process       │  │   Client        │  │   Stream        │      │ │
│  │   │   Manager       │  │                 │  │   Handler       │      │ │
│  │   │                 │  │• <1ms latency   │  │                 │      │ │
│  │   │• Subprocess     │  │• Request/resp   │  │• <10ms delivery │      │ │
│  │   │• Health mon     │  │• Correlation    │  │• Event parsing  │      │ │
│  │   │• Auto restart   │  │• Error handling │  │• Real-time      │      │ │
│  │   │• Lifecycle      │  │• Retry logic    │  │• Ordered        │      │ │
│  │   └─────────┬───────┘  └─────────┬───────┘  └─────────┬───────┘      │ │
│  │             │                    │                    │                │ │
│  │             └────────────────────┼────────────────────┘                │ │
│  │                                  │                                     │ │
│  │   ┌─────────────────────────────┴─────────────────────────────────────┐ │
│  │   │                    State Synchronization                          │ │
│  │   │                                                                   │ │
│  │   │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐ │ │
│  │   │  │   Buffer     │ │   File       │ │   Conflict   │ │  Cache   │ │ │
│  │   │  │  Metadata    │ │   System     │ │  Resolution  │ │ Manager  │ │ │
│  │   │  │   Cache      │ │   Watcher    │ │              │ │          │ │ │
│  │   │  │              │ │              │ │              │ │          │ │ │
│  │   │  │• Buffer IDs  │ │• File change │ │• Last-write  │ │• LRU     │ │ │
│  │   │  │• Revisions   │ │• External    │ │  wins        │ │• TTL     │ │ │
│  │   │  │• Cursors     │ │  edits       │ │• User        │ │• Size    │ │ │
│  │   │  │• Selections  │ │• Sync notify │ │  notification│ │  limits  │ │ │
│  │   │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────┘ │ │
│  │   └───────────────────────────────────────────────────────────────────┘ │
│  │                                  │                                     │ │
│  └──────────────────────────────────┼─────────────────────────────────────┘ │
│                                     │                                       │
│                              STDIO Communication                             │
│                                     │                                       │
│  ┌──────────────────────────────────┼─────────────────────────────────────┐ │
│  │                        XI-EDITOR PROCESS                               │ │
│  │                                  │                                      │ │
│  │   ┌─────────────────────────────┴─────────────────────────────────────┐ │
│  │   │                    JSON-RPC Server                                │ │
│  │   │                                                                   │ │
│  │   │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐ │ │
│  │   │  │   Request    │ │   Response   │ │   Event      │ │  Buffer  │ │ │
│  │   │  │  Handler     │ │   Sender     │ │  Emitter     │ │ Manager  │ │ │
│  │   │  │              │ │              │ │              │ │          │ │ │
│  │   │  │• Method      │ │• JSON-RPC    │ │• Buffer      │ │• Rope    │ │ │
│  │   │  │  dispatch    │ │  compliant   │ │  changes     │ │  data    │ │ │
│  │   │  │• Parameter   │ │• Error       │ │• Cursor      │ │• Views   │ │ │
│  │   │  │  validation  │ │  formatting  │ │  moves       │ │• Files   │ │ │
│  │   │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────┘ │ │
│  │   └───────────────────────────────────────────────────────────────────┘ │
│  │                                  │                                      │ │
│  │   ┌─────────────────────────────┴─────────────────────────────────────┐ │
│  │   │                    Text Editing Core                              │ │
│  │   │                                                                   │ │
│  │   │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐ │ │
│  │   │  │    Rope      │ │   Plugin     │ │   Language   │ │  Syntax  │ │ │
│  │   │  │   Engine     │ │   System     │ │   Server     │ │ Highlight│ │ │
│  │   │  │              │ │              │ │              │ │          │ │ │
│  │   │  │• Efficient   │ │• Extensible  │ │• LSP         │ │• TextMate│ │ │
│  │   │  │  text ops    │ │• Safe        │ │  integration │ │  grammars│ │ │
│  │   │  │• Large files │ │• Isolated    │ │• Completion  │ │• Fast    │ │ │
│  │   │  │• Undo/redo   │ │• Configurable│ │• Diagnostics │ │  parsing │ │ │
│  │   │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────┘ │ │
│  │   └───────────────────────────────────────────────────────────────────┘ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Module Design

### 1. XI-editor Process Management (`src/process.rs`)

#### Subprocess Lifecycle Management
```rust
use tokio::process::{Child, Command};
use tokio::sync::{RwLock, mpsc};
use std::path::PathBuf;

pub struct XiEditorProcessManager {
    process: RwLock<Option<Child>>,
    config: XiEditorConfig,
    health_monitor: HealthMonitor,
    restart_count: AtomicUsize,
    status_sender: mpsc::UnboundedSender<ProcessStatus>,
}

impl XiEditorProcessManager {
    pub fn new(config: XiEditorConfig) -> (Self, mpsc::UnboundedReceiver<ProcessStatus>) {
        let (status_sender, status_receiver) = mpsc::unbounded_channel();
        
        let manager = Self {
            process: RwLock::new(None),
            config,
            health_monitor: HealthMonitor::new(),
            restart_count: AtomicUsize::new(0),
            status_sender,
        };
        
        (manager, status_receiver)
    }
    
    pub async fn start(&self) -> Result<(), ProcessError> {
        let start_time = std::time::Instant::now();
        
        // Build XI-editor command
        let mut command = Command::new(&self.config.xi_editor_path);
        command.args(&self.config.args);
        command.stdin(std::process::Stdio::piped());
        command.stdout(std::process::Stdio::piped());
        command.stderr(std::process::Stdio::piped());
        
        // Set working directory if specified
        if let Some(working_dir) = &self.config.working_directory {
            command.current_dir(working_dir);
        }
        
        // Set environment variables
        for (key, value) in &self.config.environment {
            command.env(key, value);
        }
        
        // Spawn process
        let child = command.spawn()
            .map_err(|e| ProcessError::SpawnFailed(e.to_string()))?;
        
        let startup_time = start_time.elapsed();
        if startup_time > Duration::from_secs(2) {
            tracing::warn!("XI-editor startup took {}ms (target: <2s)", startup_time.as_millis());
        }
        
        // Store process handle
        {
            let mut process = self.process.write().await;
            *process = Some(child);
        }
        
        // Start health monitoring
        self.start_health_monitoring().await;
        
        // Notify status change
        let _ = self.status_sender.send(ProcessStatus::Started);
        
        tracing::info!("XI-editor process started successfully");
        Ok(())
    }
    
    pub async fn stop(&self) -> Result<(), ProcessError> {
        let mut process = self.process.write().await;
        
        if let Some(mut child) = process.take() {
            // Try graceful shutdown first
            if let Some(stdin) = child.stdin.take() {
                drop(stdin); // Close stdin to signal shutdown
            }
            
            // Wait for graceful shutdown with timeout
            match tokio::time::timeout(Duration::from_secs(5), child.wait()).await {
                Ok(Ok(exit_status)) => {
                    tracing::info!("XI-editor exited gracefully: {:?}", exit_status);
                }
                Ok(Err(e)) => {
                    tracing::error!("Error waiting for XI-editor exit: {}", e);
                }
                Err(_) => {
                    // Force kill if graceful shutdown times out
                    tracing::warn!("XI-editor graceful shutdown timed out, force killing");
                    if let Err(e) = child.kill().await {
                        tracing::error!("Failed to kill XI-editor process: {}", e);
                    }
                }
            }
        }
        
        let _ = self.status_sender.send(ProcessStatus::Stopped);
        Ok(())
    }
    
    pub async fn restart(&self) -> Result<(), ProcessError> {
        tracing::info!("Restarting XI-editor process");
        
        let restart_count = self.restart_count.fetch_add(1, Ordering::Relaxed);
        if restart_count > self.config.max_restarts {
            return Err(ProcessError::MaxRestartsExceeded);
        }
        
        // Stop current process
        self.stop().await?;
        
        // Wait a bit before restarting
        tokio::time::sleep(Duration::from_millis(500)).await;
        
        // Start new process
        self.start().await?;
        
        let _ = self.status_sender.send(ProcessStatus::Restarted { count: restart_count + 1 });
        Ok(())
    }
    
    pub async fn is_running(&self) -> bool {
        let process = self.process.read().await;
        
        if let Some(child) = process.as_ref() {
            match child.try_wait() {
                Ok(Some(_)) => false, // Process has exited
                Ok(None) => true,     // Process is still running
                Err(_) => false,      // Error checking status
            }
        } else {
            false
        }
    }
    
    async fn start_health_monitoring(&self) {
        let manager = self.clone();
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(5));
            
            loop {
                interval.tick().await;
                
                if !manager.is_running().await {
                    tracing::error!("XI-editor process died unexpectedly");
                    let _ = manager.status_sender.send(ProcessStatus::Died);
                    
                    // Attempt automatic restart
                    if let Err(e) = manager.restart().await {
                        tracing::error!("Failed to restart XI-editor: {}", e);
                        let _ = manager.status_sender.send(ProcessStatus::RestartFailed(e.to_string()));
                    }
                    
                    break;
                }
            }
        });
    }
}

#[derive(Debug, Clone)]
pub struct XiEditorConfig {
    pub xi_editor_path: PathBuf,
    pub args: Vec<String>,
    pub working_directory: Option<PathBuf>,
    pub environment: HashMap<String, String>,
    pub max_restarts: usize,
    pub startup_timeout: Duration,
}

impl Default for XiEditorConfig {
    fn default() -> Self {
        Self {
            xi_editor_path: PathBuf::from("xi-core"),
            args: vec!["--rpc".to_string()],
            working_directory: None,
            environment: HashMap::new(),
            max_restarts: 5,
            startup_timeout: Duration::from_secs(10),
        }
    }
}

#[derive(Debug, Clone)]
pub enum ProcessStatus {
    Started,
    Stopped,
    Died,
    Restarted { count: usize },
    RestartFailed(String),
}
```
### 2. JSON-RPC Client (`src/jsonrpc_client.rs`)

#### Symphony → XI-editor Communication
```rust
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader, BufWriter};
use tokio::sync::{oneshot, Mutex};
use std::collections::HashMap;

pub struct XiJsonRpcClient {
    stdin: Mutex<BufWriter<tokio::process::ChildStdin>>,
    correlation_map: Arc<Mutex<HashMap<serde_json::Value, oneshot::Sender<JsonRpcResponse>>>>,
    request_timeout: Duration,
    request_counter: AtomicU64,
}

impl XiJsonRpcClient {
    pub fn new(
        stdin: tokio::process::ChildStdin,
        request_timeout: Duration,
    ) -> Self {
        Self {
            stdin: Mutex::new(BufWriter::new(stdin)),
            correlation_map: Arc::new(Mutex::new(HashMap::new())),
            request_timeout,
            request_counter: AtomicU64::new(0),
        }
    }
    
    pub async fn call(&self, method: &str, params: Option<serde_json::Value>) -> Result<serde_json::Value, XiRpcError> {
        let start = std::time::Instant::now();
        
        // Generate unique request ID
        let request_id = self.request_counter.fetch_add(1, Ordering::Relaxed);
        let id = serde_json::Value::Number(serde_json::Number::from(request_id));
        
        // Create JSON-RPC request
        let request = JsonRpcRequest {
            jsonrpc: "2.0".to_string(),
            method: method.to_string(),
            params,
            id: id.clone(),
        };
        
        // Set up response channel
        let (response_tx, response_rx) = oneshot::channel();
        {
            let mut correlation_map = self.correlation_map.lock().await;
            correlation_map.insert(id.clone(), response_tx);
        }
        
        // Send request
        let request_json = serde_json::to_string(&request)
            .map_err(|e| XiRpcError::SerializationFailed(e.to_string()))?;
        
        {
            let mut stdin = self.stdin.lock().await;
            stdin.write_all(request_json.as_bytes()).await
                .map_err(|e| XiRpcError::SendFailed(e.to_string()))?;
            stdin.write_all(b"\n").await
                .map_err(|e| XiRpcError::SendFailed(e.to_string()))?;
            stdin.flush().await
                .map_err(|e| XiRpcError::SendFailed(e.to_string()))?;
        }
        
        // Wait for response with timeout
        let response = tokio::time::timeout(self.request_timeout, response_rx)
            .await
            .map_err(|_| XiRpcError::RequestTimeout)?
            .map_err(|_| XiRpcError::ResponseChannelClosed)?;
        
        let call_time = start.elapsed();
        if call_time > Duration::from_millis(1) {
            tracing::warn!("XI-editor RPC call '{}' took {}ms (target: <1ms)", method, call_time.as_millis());
        }
        
        // Handle response
        match response.error {
            Some(error) => Err(XiRpcError::XiEditorError(error)),
            None => Ok(response.result.unwrap_or(serde_json::Value::Null)),
        }
    }
    
    pub async fn notify(&self, method: &str, params: Option<serde_json::Value>) -> Result<(), XiRpcError> {
        let notification = JsonRpcNotification {
            jsonrpc: "2.0".to_string(),
            method: method.to_string(),
            params,
        };
        
        let notification_json = serde_json::to_string(&notification)
            .map_err(|e| XiRpcError::SerializationFailed(e.to_string()))?;
        
        let mut stdin = self.stdin.lock().await;
        stdin.write_all(notification_json.as_bytes()).await
            .map_err(|e| XiRpcError::SendFailed(e.to_string()))?;
        stdin.write_all(b"\n").await
            .map_err(|e| XiRpcError::SendFailed(e.to_string()))?;
        stdin.flush().await
            .map_err(|e| XiRpcError::SendFailed(e.to_string()))?;
        
        Ok(())
    }
    
    pub async fn handle_response(&self, response: JsonRpcResponse) -> Result<(), XiRpcError> {
        let mut correlation_map = self.correlation_map.lock().await;
        
        if let Some(response_tx) = correlation_map.remove(&response.id) {
            let _ = response_tx.send(response); // Ignore send errors (receiver may have timed out)
        } else {
            tracing::warn!("Received response for unknown request ID: {:?}", response.id);
        }
        
        Ok(())
    }
    
    // XI-editor specific operations
    pub async fn new_view(&self, file_path: Option<&str>) -> Result<String, XiRpcError> {
        let params = file_path.map(|path| serde_json::json!({ "file_path": path }));
        let result = self.call("new_view", params).await?;
        
        result.as_str()
            .ok_or_else(|| XiRpcError::InvalidResponse("Expected string view_id".to_string()))
            .map(|s| s.to_string())
    }
    
    pub async fn close_view(&self, view_id: &str) -> Result<(), XiRpcError> {
        let params = serde_json::json!({ "view_id": view_id });
        self.call("close_view", Some(params)).await?;
        Ok(())
    }
    
    pub async fn edit(&self, view_id: &str, delta: TextDelta) -> Result<(), XiRpcError> {
        let params = serde_json::json!({
            "view_id": view_id,
            "delta": delta
        });
        self.call("edit", Some(params)).await?;
        Ok(())
    }
    
    pub async fn save(&self, view_id: &str, file_path: Option<&str>) -> Result<(), XiRpcError> {
        let mut params = serde_json::json!({ "view_id": view_id });
        if let Some(path) = file_path {
            params["file_path"] = serde_json::Value::String(path.to_string());
        }
        self.call("save", Some(params)).await?;
        Ok(())
    }
    
    pub async fn insert(&self, view_id: &str, chars: &str) -> Result<(), XiRpcError> {
        let params = serde_json::json!({
            "view_id": view_id,
            "chars": chars
        });
        self.call("insert", Some(params)).await?;
        Ok(())
    }
    
    pub async fn click(&self, view_id: &str, line: u64, col: u64) -> Result<(), XiRpcError> {
        let params = serde_json::json!({
            "view_id": view_id,
            "line": line,
            "col": col
        });
        self.call("click", Some(params)).await?;
        Ok(())
    }
}
```

### 3. Event Streaming (`src/event_stream.rs`)

#### XI-editor → Symphony Event Processing
```rust
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::sync::mpsc;

pub struct XiEventStream {
    stdout_reader: BufReader<tokio::process::ChildStdout>,
    event_sender: mpsc::UnboundedSender<XiEvent>,
    rpc_client: Arc<XiJsonRpcClient>,
}

impl XiEventStream {
    pub fn new(
        stdout: tokio::process::ChildStdout,
        rpc_client: Arc<XiJsonRpcClient>,
    ) -> (Self, mpsc::UnboundedReceiver<XiEvent>) {
        let (event_sender, event_receiver) = mpsc::unbounded_channel();
        
        let stream = Self {
            stdout_reader: BufReader::new(stdout),
            event_sender,
            rpc_client,
        };
        
        (stream, event_receiver)
    }
    
    pub async fn start_processing(&mut self) -> Result<(), EventStreamError> {
        let mut line_buffer = String::new();
        
        loop {
            line_buffer.clear();
            
            let start = std::time::Instant::now();
            let bytes_read = self.stdout_reader.read_line(&mut line_buffer).await
                .map_err(|e| EventStreamError::ReadFailed(e.to_string()))?;
            
            if bytes_read == 0 {
                // EOF - XI-editor process has closed stdout
                tracing::info!("XI-editor stdout closed");
                break;
            }
            
            let read_time = start.elapsed();
            if read_time > Duration::from_millis(10) {
                tracing::warn!("XI-editor stdout read took {}ms (target: <10ms)", read_time.as_millis());
            }
            
            // Remove trailing newline
            if line_buffer.ends_with('\n') {
                line_buffer.pop();
                if line_buffer.ends_with('\r') {
                    line_buffer.pop();
                }
            }
            
            // Skip empty lines
            if line_buffer.trim().is_empty() {
                continue;
            }
            
            // Parse JSON message
            match self.parse_message(&line_buffer).await {
                Ok(()) => {}
                Err(e) => {
                    tracing::error!("Failed to parse XI-editor message: {} - Line: {}", e, line_buffer);
                }
            }
        }
        
        Ok(())
    }
    
    async fn parse_message(&self, line: &str) -> Result<(), EventStreamError> {
        let start = std::time::Instant::now();
        
        // Try to parse as JSON-RPC message first
        if let Ok(json_value) = serde_json::from_str::<serde_json::Value>(line) {
            if json_value.get("jsonrpc").is_some() {
                // This is a JSON-RPC response
                if let Ok(response) = serde_json::from_value::<JsonRpcResponse>(json_value) {
                    return self.rpc_client.handle_response(response).await
                        .map_err(|e| EventStreamError::RpcHandlingFailed(e.to_string()));
                }
            } else {
                // This is an XI-editor event
                if let Ok(xi_event) = serde_json::from_value::<XiEvent>(json_value) {
                    let parse_time = start.elapsed();
                    if parse_time > Duration::from_millis(1) {
                        tracing::warn!("XI-editor event parsing took {}ms (target: <1ms)", parse_time.as_millis());
                    }
                    
                    // Send event to subscribers
                    if let Err(_) = self.event_sender.send(xi_event) {
                        tracing::error!("Failed to send XI-editor event - no receivers");
                    }
                    
                    return Ok(());
                }
            }
        }
        
        Err(EventStreamError::InvalidMessage(line.to_string()))
    }
}

#[derive(Debug, Clone)]
pub enum XiEvent {
    Update {
        view_id: String,
        update: ViewUpdate,
        rev: u64,
    },
    ScrollTo {
        view_id: String,
        line: u64,
        col: u64,
    },
    ConfigChanged {
        view_id: String,
        changes: serde_json::Value,
    },
    ThemeChanged {
        name: String,
        theme: serde_json::Value,
    },
    AvailablePlugins {
        view_id: String,
        plugins: Vec<PluginDescription>,
    },
    PluginStarted {
        view_id: String,
        plugin: String,
    },
    PluginStopped {
        view_id: String,
        plugin: String,
        code: i32,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ViewUpdate {
    pub lines: Vec<Line>,
    pub pristine: bool,
    pub cursor: Vec<u64>,
    pub selection: Vec<Selection>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Line {
    pub text: String,
    pub cursor: Vec<u64>,
    pub styles: Vec<StyleSpan>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Selection {
    pub start: u64,
    pub end: u64,
    pub cursor: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StyleSpan {
    pub offset: u64,
    pub len: u64,
    pub style_id: u32,
}
```

### 4. State Synchronization (`src/state_sync.rs`)

#### Buffer and File State Coordination
```rust
use notify::{Watcher, RecursiveMode, watcher};
use std::collections::HashMap;
use std::path::PathBuf;

pub struct StateSynchronizer {
    buffer_cache: RwLock<HashMap<String, BufferMetadata>>,
    file_watcher: Option<notify::RecommendedWatcher>,
    xi_client: Arc<XiJsonRpcClient>,
    sync_sender: mpsc::UnboundedSender<SyncEvent>,
}

impl StateSynchronizer {
    pub fn new(xi_client: Arc<XiJsonRpcClient>) -> (Self, mpsc::UnboundedReceiver<SyncEvent>) {
        let (sync_sender, sync_receiver) = mpsc::unbounded_channel();
        
        let synchronizer = Self {
            buffer_cache: RwLock::new(HashMap::new()),
            file_watcher: None,
            xi_client,
            sync_sender,
        };
        
        (synchronizer, sync_receiver)
    }
    
    pub async fn start_file_watching(&mut self, watch_paths: Vec<PathBuf>) -> Result<(), SyncError> {
        let sync_sender = self.sync_sender.clone();
        
        let mut watcher = watcher(Duration::from_secs(1))
            .map_err(|e| SyncError::WatcherCreationFailed(e.to_string()))?;
        
        // Set up file change callback
        watcher.watch_with_initial_scan(move |event| {
            match event {
                Ok(notify::Event { kind: notify::EventKind::Modify(_), paths, .. }) => {
                    for path in paths {
                        let _ = sync_sender.send(SyncEvent::FileChanged { path });
                    }
                }
                Ok(notify::Event { kind: notify::EventKind::Create(_), paths, .. }) => {
                    for path in paths {
                        let _ = sync_sender.send(SyncEvent::FileCreated { path });
                    }
                }
                Ok(notify::Event { kind: notify::EventKind::Remove(_), paths, .. }) => {
                    for path in paths {
                        let _ = sync_sender.send(SyncEvent::FileDeleted { path });
                    }
                }
                Err(e) => {
                    tracing::error!("File watcher error: {}", e);
                }
                _ => {} // Ignore other event types
            }
        });
        
        // Watch specified paths
        for path in watch_paths {
            watcher.watch(&path, RecursiveMode::Recursive)
                .map_err(|e| SyncError::WatchFailed(e.to_string()))?;
        }
        
        self.file_watcher = Some(watcher);
        Ok(())
    }
    
    pub async fn handle_xi_event(&self, event: XiEvent) -> Result<(), SyncError> {
        match event {
            XiEvent::Update { view_id, update, rev } => {
                self.update_buffer_metadata(&view_id, update, rev).await?;
            }
            XiEvent::ScrollTo { view_id, line, col } => {
                self.update_cursor_position(&view_id, line, col).await?;
            }
            _ => {} // Handle other events as needed
        }
        
        Ok(())
    }
    
    pub async fn handle_sync_event(&self, event: SyncEvent) -> Result<(), SyncError> {
        match event {
            SyncEvent::FileChanged { path } => {
                self.handle_external_file_change(path).await?;
            }
            SyncEvent::FileCreated { path } => {
                self.handle_file_creation(path).await?;
            }
            SyncEvent::FileDeleted { path } => {
                self.handle_file_deletion(path).await?;
            }
        }
        
        Ok(())
    }
    
    async fn update_buffer_metadata(&self, view_id: &str, update: ViewUpdate, rev: u64) -> Result<(), SyncError> {
        let start = std::time::Instant::now();
        
        let mut cache = self.buffer_cache.write().await;
        let metadata = cache.entry(view_id.to_string()).or_insert_with(|| BufferMetadata::new(view_id));
        
        metadata.revision = rev;
        metadata.pristine = update.pristine;
        metadata.cursor_positions = update.cursor;
        metadata.selections = update.selection;
        metadata.last_updated = chrono::Utc::now();
        
        let update_time = start.elapsed();
        if update_time > Duration::from_millis(10) {
            tracing::warn!("Buffer metadata update took {}ms (target: <10ms)", update_time.as_millis());
        }
        
        Ok(())
    }
    
    async fn handle_external_file_change(&self, path: PathBuf) -> Result<(), SyncError> {
        tracing::info!("External file change detected: {:?}", path);
        
        // Find buffer associated with this file
        let cache = self.buffer_cache.read().await;
        let mut affected_views = Vec::new();
        
        for (view_id, metadata) in cache.iter() {
            if let Some(file_path) = &metadata.file_path {
                if file_path == &path {
                    affected_views.push(view_id.clone());
                }
            }
        }
        
        drop(cache);
        
        // Notify XI-editor of external changes
        for view_id in affected_views {
            if let Err(e) = self.xi_client.notify("external_file_change", Some(serde_json::json!({
                "view_id": view_id,
                "path": path.to_string_lossy()
            }))).await {
                tracing::error!("Failed to notify XI-editor of external file change: {}", e);
            }
        }
        
        Ok(())
    }
    
    pub async fn get_buffer_info(&self, view_id: &str) -> Option<BufferMetadata> {
        let cache = self.buffer_cache.read().await;
        cache.get(view_id).cloned()
    }
    
    pub async fn is_buffer_dirty(&self, view_id: &str) -> bool {
        let cache = self.buffer_cache.read().await;
        cache.get(view_id)
            .map(|metadata| !metadata.pristine)
            .unwrap_or(false)
    }
}

#[derive(Debug, Clone)]
pub struct BufferMetadata {
    pub view_id: String,
    pub file_path: Option<PathBuf>,
    pub revision: u64,
    pub pristine: bool,
    pub cursor_positions: Vec<u64>,
    pub selections: Vec<Selection>,
    pub last_updated: chrono::DateTime<chrono::Utc>,
}

impl BufferMetadata {
    fn new(view_id: &str) -> Self {
        Self {
            view_id: view_id.to_string(),
            file_path: None,
            revision: 0,
            pristine: true,
            cursor_positions: Vec::new(),
            selections: Vec::new(),
            last_updated: chrono::Utc::now(),
        }
    }
}

#[derive(Debug, Clone)]
pub enum SyncEvent {
    FileChanged { path: PathBuf },
    FileCreated { path: PathBuf },
    FileDeleted { path: PathBuf },
}
```

## Performance Considerations

### Communication Performance
- **JSON-RPC Latency**: Target <1ms for standard operations through optimized serialization
- **Event Streaming**: Target <10ms delivery through efficient parsing and routing
- **State Sync**: Target <10ms consistency through local caching and batch updates
- **Process Management**: Target <5s recovery through health monitoring and restart logic

### Memory Management
- **Buffer Caching**: LRU cache with configurable size limits and TTL
- **Event Buffering**: Bounded channels to prevent memory growth
- **Connection Pooling**: Reuse connections where possible
- **Resource Cleanup**: Automatic cleanup of expired state and connections

### Error Handling Strategy

### Error Categories
1. **Process Errors**: XI-editor startup failures, crashes, communication loss
2. **RPC Errors**: JSON-RPC protocol violations, timeout, serialization failures
3. **Sync Errors**: State inconsistency, file watcher failures, conflict resolution
4. **System Errors**: Resource exhaustion, permission issues, configuration errors

### Recovery Mechanisms
- **Automatic Restart**: Exponential backoff restart with configurable limits
- **State Recovery**: Preserve user data during process failures
- **Graceful Degradation**: Continue operation with reduced functionality
- **Health Monitoring**: Proactive failure detection and isolation

---

**Design Complete**: Ready for TESTING phase