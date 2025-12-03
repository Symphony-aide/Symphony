# Design Document - Xi-Editor Integration

## Overview

This design document specifies the architecture for integrating xi-editor's proven text editing core into Symphony IDE. The integration leverages xi-editor's existing 85% feature completeness (rope data structure, editor engine, undo/redo, multi-cursor, search/replace, syntax highlighting, and plugin system) and focuses on building a 15% integration layer to connect xi-editor with Symphony's architecture.

### Integration Philosophy

Rather than building a text editor from scratch or migrating code from scaffold implementations, Symphony will use xi-editor's battle-tested code directly. This approach provides:

- **Proven Reliability**: Xi-editor has been used in production environments and has a mature codebase
- **Performance**: Optimized rope data structure and incremental computation algorithms
- **Feature Completeness**: 85% of required functionality already implemented
- **Community Support**: Active development and potential for upstream contributions
- **No Scaffold Migration**: Direct use of xi-editor code eliminates the need to migrate from temporary scaffold implementations in `apps/backend/rope/`

**Design Decision**: We explicitly choose to use xi-editor as a dependency rather than copying or migrating its code. This decision is based on:
1. **Maintenance Burden**: Maintaining a fork would require tracking upstream changes
2. **Code Quality**: Xi-editor's code is production-tested and optimized
3. **Community Benefit**: Using xi-editor directly allows us to contribute improvements upstream
4. **Time to Market**: Eliminates months of reimplementation work

The integration focuses on three key areas:
1. **Direct Integration**: Use xi-editor crates as dependencies in Symphony's Rust workspace (Requirement 17.1, 17.3)
2. **Protocol Translation**: Bridge between xi-RPC and Symphony IPC Bus (Requirement 2.4, 2.5)
3. **Frontend Adaptation**: Connect xi-core to Monaco Editor for visual representation (Requirement 3.5)

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Symphony Frontend (React)                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Monaco Editor Component                    │    │
│  │         (packages/components/code-editor/)             │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────┬───────────────────────────────────┘
                              │ Symphony IPC Bus
                              │ (JSON messages)
┌─────────────────────────────▼───────────────────────────────────┐
│                   Symphony Backend (Rust)                        │
│  ┌────────────────────────────────────────────────────────┐    │
│  │           IPC Translation Layer (New)                   │    │
│  │     - Translates Symphony IPC ↔ Xi-RPC                 │    │
│  │     - Manages buffer lifecycle                          │    │
│  │     - Handles Monaco ↔ Xi-Core synchronization         │    │
│  └────────────────────────┬───────────────────────────────┘    │
│                           │                                      │
│  ┌────────────────────────▼───────────────────────────────┐    │
│  │              Xi-Core Integration Module                 │    │
│  │         (apps/backend/xi_integration/)                  │    │
│  │  ┌──────────────────────────────────────────────┐     │    │
│  │  │         Xi-Editor Components                  │     │    │
│  │  │  - xi-rope (from apps/xi-editor/rust/rope/)  │     │    │
│  │  │  - xi-core-lib (editor engine)               │     │    │
│  │  │  - xi-rpc (protocol definitions)             │     │    │
│  │  │  - xi-trace (performance monitoring)         │     │    │
│  │  └──────────────────────────────────────────────┘     │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Component Layers

#### Layer 1: Xi-Editor Core (Existing - 85%)
Direct usage of xi-editor crates without modification (Requirement 17.1, 17.3):
- **xi-rope**: Rope data structure for efficient text storage (Requirement 1.1)
- **xi-core-lib**: Editor engine with buffer management, undo/redo, multi-cursor (Requirement 2.1, 2.3)
- **xi-rpc**: RPC protocol definitions and message types (Requirement 2.4)
- **xi-trace**: Performance monitoring and profiling (Requirement 12.1, 12.2)
- **syntect**: Syntax highlighting engine (Requirement 5.1)

#### Layer 2: Integration Layer (New - 10%)
New Rust modules to bridge xi-editor with Symphony (Requirement 2.2, 2.5):
- **IPC Translation Layer**: Converts between Symphony IPC and Xi-RPC protocols (Requirement 3.1, 3.2, 3.3)
- **Buffer Manager**: Manages xi-core buffer lifecycle within Symphony (Requirement 2.6)
- **Monaco Bridge**: Synchronizes state between Monaco Editor and xi-core (Requirement 3.5, 3.6)
- **Metrics Adapter**: Extends xi-trace with Symphony-specific metrics (Requirement 12.2, 12.3)
- **Autosave Manager**: Implements periodic autosave functionality (Requirement 9.3)
- **Configuration Manager**: Synchronizes Symphony settings with xi-core (Requirement 14.1, 14.6)
- **Plugin Adapter**: Bridges xi-editor plugins with Symphony extensions (Requirement 4.1, 4.2, 4.6)

#### Layer 3: Frontend Adaptation (Existing + Updates - 5%)
Updates to existing Monaco Editor integration:
- **Editor Component**: Minimal changes to communicate with xi-core backend (Requirement 3.4)
- **Syntax Highlighting**: Receive and apply style spans from xi-core (Requirement 5.2, 5.3)
- **Command Integration**: Wire undo/redo/search commands to xi-core (Requirement 7.2, 7.3, 10.1)

## Components and Interfaces

### 1. Xi-Core Integration Module

**Location**: `apps/backend/xi_integration/`

**Purpose**: Wraps xi-editor components and provides Symphony-compatible API

**Key Components**:

```rust
// apps/backend/xi_integration/src/lib.rs

/// Main integration point for xi-editor within Symphony
pub struct XiIntegration {
    /// Xi-core editor instance
    core: CoreState,
    /// Active buffer views
    views: HashMap<ViewId, View>,
    /// IPC message sender
    ipc_sender: IpcSender,
}

impl XiIntegration {
    /// Initialize xi-core integration
    pub fn new(config: XiConfig) -> Result<Self, XiError> {
        // Initialize xi-core with Symphony configuration
    }
    
    /// Create a new buffer from file path
    pub fn open_file(&mut self, path: &Path) -> Result<ViewId, XiError> {
        // Use xi-core's file loading
    }
    
    /// Apply edit operation to buffer
    pub fn edit(&mut self, view_id: ViewId, edit: EditOperation) -> Result<(), XiError> {
        // Translate to xi-core edit command
    }
    
    /// Get buffer content as string
    pub fn get_content(&self, view_id: ViewId) -> Result<String, XiError> {
        // Extract from xi-rope
    }
}
```

### 2. IPC Translation Layer

**Location**: `apps/backend/xi_integration/src/ipc_bridge.rs`

**Purpose**: Bidirectional translation between Symphony IPC and Xi-RPC

**Message Translation**:

```rust
// Symphony IPC → Xi-RPC
pub struct IpcBridge {
    xi_integration: Arc<Mutex<XiIntegration>>,
}

impl IpcBridge {
    /// Translate Symphony edit command to xi-core edit
    pub fn translate_edit(&self, msg: SymphonyEditMessage) -> XiRpcMessage {
        match msg.operation {
            SymphonyOp::Insert { pos, text } => {
                XiRpcMessage::Edit {
                    view_id: msg.view_id,
                    delta: Delta::simple_edit(
                        Interval::new(pos, pos),
                        Rope::from(text),
                        0
                    )
                }
            }
            SymphonyOp::Delete { start, end } => {
                XiRpcMessage::Edit {
                    view_id: msg.view_id,
                    delta: Delta::simple_edit(
                        Interval::new(start, end),
                        Rope::from(""),
                        0
                    )
                }
            }
        }
    }
    
    /// Translate xi-core update to Symphony IPC format
    pub fn translate_update(&self, update: XiUpdate) -> SymphonyIpcMessage {
        SymphonyIpcMessage::BufferUpdate {
            view_id: update.view_id,
            operations: update.ops.iter().map(|op| {
                match op {
                    UpdateOp::Copy { n, .. } => SymphonyUpdateOp::Keep(*n),
                    UpdateOp::Skip { n } => SymphonyUpdateOp::Delete(*n),
                    UpdateOp::Insert { lines } => SymphonyUpdateOp::Insert {
                        lines: lines.clone()
                    },
                    UpdateOp::Update { n, .. } => SymphonyUpdateOp::Update(*n),
                }
            }).collect(),
            pristine: update.pristine,
        }
    }
}
```

### 3. Buffer Manager

**Location**: `apps/backend/xi_integration/src/buffer_manager.rs`

**Purpose**: Manages buffer lifecycle and state synchronization

```rust
pub struct BufferManager {
    /// Map of file paths to view IDs
    path_to_view: HashMap<PathBuf, ViewId>,
    /// Map of view IDs to buffer metadata
    view_metadata: HashMap<ViewId, BufferMetadata>,
    /// Xi-core integration
    xi: Arc<Mutex<XiIntegration>>,
}

impl BufferManager {
    /// Open or reuse existing buffer for file
    pub async fn open_buffer(&mut self, path: PathBuf) -> Result<ViewId, BufferError> {
        if let Some(view_id) = self.path_to_view.get(&path) {
            return Ok(*view_id);
        }
        
        let view_id = self.xi.lock().await.open_file(&path)?;
        self.path_to_view.insert(path.clone(), view_id);
        self.view_metadata.insert(view_id, BufferMetadata {
            path,
            dirty: false,
            last_saved: SystemTime::now(),
        });
        
        Ok(view_id)
    }
    
    /// Close buffer and cleanup resources
    pub async fn close_buffer(&mut self, view_id: ViewId) -> Result<(), BufferError> {
        if let Some(metadata) = self.view_metadata.remove(&view_id) {
            self.path_to_view.remove(&metadata.path);
            self.xi.lock().await.close_view(view_id)?;
        }
        Ok(())
    }
}
```

### 4. Monaco Bridge

**Location**: `apps/backend/xi_integration/src/monaco_bridge.rs`

**Purpose**: Synchronize Monaco Editor state with xi-core

```rust
pub struct MonacoBridge {
    /// Current cursor positions per view
    cursors: HashMap<ViewId, Vec<CursorPosition>>,
    /// Current selections per view
    selections: HashMap<ViewId, Vec<Selection>>,
}

impl MonacoBridge {
    /// Synchronize cursor position from Monaco to xi-core
    pub fn sync_cursor(&mut self, view_id: ViewId, positions: Vec<CursorPosition>) {
        self.cursors.insert(view_id, positions);
        // Update xi-core view state
    }
    
    /// Convert xi-core style spans to Monaco decorations
    pub fn convert_style_spans(&self, spans: Vec<StyleSpan>) -> Vec<MonacoDecoration> {
        spans.iter().map(|span| {
            MonacoDecoration {
                range: MonacoRange {
                    start_line: span.range.start.line,
                    start_column: span.range.start.column,
                    end_line: span.range.end.line,
                    end_column: span.range.end.column,
                },
                options: MonacoDecorationOptions {
                    inline_class_name: format!("token-{}", span.style_id),
                },
            }
        }).collect()
    }
}
```

### 5. Plugin System Adapter

**Location**: `apps/backend/xi_integration/src/plugin_adapter.rs`

**Purpose**: Bridge xi-editor plugins with Symphony's extension system

**Design Rationale**: Xi-editor has a mature plugin system that communicates via RPC. Rather than rewriting plugins, we create an adapter that translates between xi-editor's plugin protocol and Symphony's extension architecture. This allows reuse of existing xi-editor plugins while maintaining Symphony's security and isolation model.

```rust
/// Adapter for xi-editor plugins within Symphony's extension system
pub struct PluginAdapter {
    /// Active plugin instances
    plugins: HashMap<PluginId, PluginInstance>,
    /// Plugin registry
    registry: PluginRegistry,
    /// IPC sender for Symphony extension bus
    extension_bus: ExtensionBusSender,
}

impl PluginAdapter {
    /// Initialize plugin system and load available plugins
    pub fn new(config: PluginConfig) -> Result<Self, PluginError> {
        // Initialize xi-core plugin manager
        // Register with Symphony extension system
    }
    
    /// Load and activate a xi-editor plugin
    pub async fn load_plugin(&mut self, plugin_path: &Path) -> Result<PluginId, PluginError> {
        // Load plugin using xi-core's plugin loader
        // Register with Symphony's extension registry
        // Set up IPC routing
    }
    
    /// Route plugin notification to Symphony IPC Bus
    pub async fn route_notification(&self, plugin_id: PluginId, notification: PluginNotification) {
        // Translate xi-plugin notification to Symphony extension event
        // Send via extension bus
    }
    
    /// Handle plugin crash with isolation
    pub async fn handle_plugin_crash(&mut self, plugin_id: PluginId) -> Result<(), PluginError> {
        // Isolate crashed plugin
        // Log crash details
        // Disable plugin
        // Notify user
        // Continue xi-core operation
    }
}

/// Plugin instance wrapper
struct PluginInstance {
    id: PluginId,
    process: Child,
    rpc_channel: RpcChannel,
    status: PluginStatus,
}

#[derive(Debug, Clone)]
enum PluginStatus {
    Active,
    Crashed,
    Disabled,
}
```

### 6. Configuration Manager

**Location**: `apps/backend/xi_integration/src/config_manager.rs`

**Purpose**: Manage xi-core configuration and synchronize with Symphony settings

**Design Rationale**: Xi-core has its own configuration system, but Symphony needs to control these settings through its unified settings interface. The Configuration Manager acts as a bridge, translating Symphony settings to xi-core configuration and applying changes dynamically without restart.

```rust
/// Manages xi-core configuration synchronized with Symphony settings
pub struct ConfigurationManager {
    /// Current xi-core configuration
    config: XiConfig,
    /// Symphony settings watcher
    settings_watcher: SettingsWatcher,
    /// Active views that need config updates
    views: Vec<ViewId>,
}

impl ConfigurationManager {
    /// Initialize with Symphony settings
    pub fn new(symphony_settings: &SymphonySettings) -> Result<Self, ConfigError> {
        let config = Self::translate_settings(symphony_settings)?;
        Ok(Self {
            config,
            settings_watcher: SettingsWatcher::new(),
            views: Vec::new(),
        })
    }
    
    /// Translate Symphony settings to xi-core configuration
    fn translate_settings(settings: &SymphonySettings) -> Result<XiConfig, ConfigError> {
        Ok(XiConfig {
            tab_size: settings.editor.tab_size,
            translate_tabs_to_spaces: settings.editor.insert_spaces,
            word_wrap: settings.editor.word_wrap,
            auto_indent: settings.editor.auto_indent,
            font_face: settings.editor.font_family.clone(),
            font_size: settings.editor.font_size,
            // ... other settings
        })
    }
    
    /// Apply configuration changes to all active views
    pub async fn apply_config_changes(&mut self, xi: &mut XiIntegration) -> Result<(), ConfigError> {
        for view_id in &self.views {
            xi.update_view_config(*view_id, &self.config).await?;
        }
        Ok(())
    }
    
    /// Watch for Symphony settings changes and apply dynamically
    pub async fn watch_settings(&mut self, xi: Arc<Mutex<XiIntegration>>) {
        while let Some(change) = self.settings_watcher.next_change().await {
            self.config = Self::translate_settings(&change)?;
            let mut xi_lock = xi.lock().await;
            self.apply_config_changes(&mut xi_lock).await?;
        }
    }
}
```

### 7. Autosave Manager

**Location**: `apps/backend/xi_integration/src/autosave_manager.rs`

**Purpose**: Implement periodic autosave functionality on top of xi-core's file I/O

**Design Rationale**: Xi-core provides file I/O primitives but doesn't include autosave timers. The Autosave Manager adds this functionality by tracking dirty buffers and periodically saving them to temporary locations, with configurable intervals and recovery mechanisms.

```rust
/// Manages automatic saving of modified buffers
pub struct AutosaveManager {
    /// Interval between autosaves (default: 30 seconds)
    interval: Duration,
    /// Map of view IDs to autosave state
    autosave_state: HashMap<ViewId, AutosaveState>,
    /// Autosave directory
    autosave_dir: PathBuf,
    /// Timer for periodic saves
    timer: Interval,
}

impl AutosaveManager {
    /// Initialize autosave manager
    pub fn new(config: AutosaveConfig) -> Result<Self, AutosaveError> {
        let autosave_dir = config.autosave_dir.unwrap_or_else(|| {
            std::env::temp_dir().join("symphony_autosave")
        });
        std::fs::create_dir_all(&autosave_dir)?;
        
        Ok(Self {
            interval: Duration::from_secs(config.interval_seconds.unwrap_or(30)),
            autosave_state: HashMap::new(),
            autosave_dir,
            timer: tokio::time::interval(Duration::from_secs(30)),
        })
    }
    
    /// Start autosave loop
    pub async fn run(&mut self, xi: Arc<Mutex<XiIntegration>>) {
        loop {
            self.timer.tick().await;
            self.perform_autosave(&xi).await;
        }
    }
    
    /// Perform autosave for all dirty buffers
    async fn perform_autosave(&mut self, xi: &Arc<Mutex<XiIntegration>>) {
        let xi_lock = xi.lock().await;
        
        for (view_id, state) in &mut self.autosave_state {
            if state.dirty {
                let autosave_path = self.get_autosave_path(&state.original_path);
                
                match xi_lock.save_to_path(*view_id, &autosave_path).await {
                    Ok(_) => {
                        state.last_autosave = SystemTime::now();
                        state.dirty = false;
                    }
                    Err(e) => {
                        eprintln!("Autosave failed for {:?}: {}", state.original_path, e);
                    }
                }
            }
        }
    }
    
    /// Get autosave path for original file
    fn get_autosave_path(&self, original: &Path) -> PathBuf {
        let filename = original.file_name().unwrap().to_string_lossy();
        let autosave_name = format!(".{}.autosave", filename);
        self.autosave_dir.join(autosave_name)
    }
    
    /// Check for autosave recovery on file open
    pub fn check_recovery(&self, path: &Path) -> Option<PathBuf> {
        let autosave_path = self.get_autosave_path(path);
        if autosave_path.exists() {
            Some(autosave_path)
        } else {
            None
        }
    }
}

#[derive(Debug)]
struct AutosaveState {
    original_path: PathBuf,
    dirty: bool,
    last_autosave: SystemTime,
}
```

### 8. Performance Metrics Collector

**Location**: `apps/backend/xi_integration/src/metrics_collector.rs`

**Purpose**: Extend xi-trace with Symphony-specific performance metrics

**Design Rationale**: Xi-trace provides basic performance monitoring, but Symphony needs additional metrics for its orchestration system and AI features. The Metrics Collector wraps xi-trace and adds Symphony-specific measurements while maintaining compatibility with xi-core's existing instrumentation.

```rust
/// Collects and reports performance metrics for xi-core integration
pub struct MetricsCollector {
    /// Xi-trace integration
    trace: XiTrace,
    /// Symphony metrics reporter
    symphony_metrics: SymphonyMetrics,
    /// Operation timing histogram
    operation_timings: HashMap<OperationType, Histogram>,
    /// Memory usage tracker
    memory_tracker: MemoryTracker,
}

impl MetricsCollector {
    /// Record edit operation timing
    pub fn record_edit_operation(&mut self, duration: Duration, op_type: OperationType) {
        // Record in xi-trace
        self.trace.record_operation("edit", duration);
        
        // Record in Symphony metrics
        self.symphony_metrics.record_timing("xi_core.edit", duration);
        
        // Update histogram
        self.operation_timings
            .entry(op_type)
            .or_insert_with(Histogram::new)
            .record(duration.as_micros() as u64);
        
        // Check performance threshold
        if duration.as_millis() > 16 {
            self.symphony_metrics.log_warning(format!(
                "Edit operation exceeded 16ms threshold: {:?}",
                duration
            ));
        }
    }
    
    /// Get performance statistics
    pub fn get_statistics(&self) -> PerformanceStats {
        PerformanceStats {
            edit_latency_p50: self.get_percentile(OperationType::Edit, 50),
            edit_latency_p95: self.get_percentile(OperationType::Edit, 95),
            edit_latency_p99: self.get_percentile(OperationType::Edit, 99),
            memory_usage: self.memory_tracker.current_usage(),
            operation_count: self.get_total_operations(),
        }
    }
    
    /// Monitor memory usage and trigger cleanup if needed
    pub async fn monitor_memory(&mut self, xi: &mut XiIntegration) {
        let usage = self.memory_tracker.current_usage();
        let threshold = self.memory_tracker.threshold();
        
        if usage > threshold {
            // Trigger undo history pruning
            xi.prune_undo_history().await;
            
            self.symphony_metrics.log_info(format!(
                "Memory threshold exceeded ({}MB > {}MB), pruned undo history",
                usage / 1_000_000,
                threshold / 1_000_000
            ));
        }
    }
}

#[derive(Debug, Clone, Copy, Hash, Eq, PartialEq)]
enum OperationType {
    Edit,
    Save,
    Load,
    Search,
    Undo,
    Redo,
}
```

### 9. Collaborative Editing Foundation

**Location**: `apps/backend/xi_integration/src/collab_foundation.rs`

**Purpose**: Provide foundation for future collaborative editing features

**Design Rationale**: While full collaborative editing is a future enhancement, the foundation must be built now to avoid costly refactoring later. This includes operation IDs, operational transformation support, and CRDT-compatible data structures. Xi-core already has some CRDT support that we can leverage.

```rust
/// Foundation for collaborative editing features
pub struct CollaborativeFoundation {
    /// Operation ID generator
    op_id_generator: OperationIdGenerator,
    /// Operation log for all edits
    operation_log: OperationLog,
    /// Operational transformation engine
    ot_engine: OTEngine,
}

impl CollaborativeFoundation {
    /// Generate unique operation ID for tracking
    pub fn generate_operation_id(&mut self) -> OperationId {
        self.op_id_generator.next()
    }
    
    /// Log operation for collaborative history
    pub fn log_operation(&mut self, op_id: OperationId, operation: EditOperation, view_id: ViewId) {
        self.operation_log.append(LogEntry {
            op_id,
            operation,
            view_id,
            timestamp: SystemTime::now(),
            applied: true,
        });
    }
    
    /// Apply operational transformation for concurrent edits
    pub fn transform_operations(
        &self,
        local_op: EditOperation,
        remote_op: EditOperation,
    ) -> (EditOperation, EditOperation) {
        self.ot_engine.transform(local_op, remote_op)
    }
    
    /// Merge remote operation with local state
    pub async fn merge_remote_operation(
        &mut self,
        remote_op: RemoteOperation,
        xi: &mut XiIntegration,
    ) -> Result<(), CollabError> {
        // Transform against concurrent local operations
        let transformed = self.transform_against_local(remote_op);
        
        // Apply to buffer
        xi.apply_operation(transformed.view_id, transformed.operation).await?;
        
        // Log in operation history
        self.log_operation(transformed.op_id, transformed.operation, transformed.view_id);
        
        Ok(())
    }
    
    /// Get complete operation history for synchronization
    pub fn get_operation_history(&self, since: OperationId) -> Vec<LogEntry> {
        self.operation_log.get_since(since)
    }
}

/// Unique identifier for operations in collaborative context
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct OperationId {
    /// Client/session identifier
    client_id: u64,
    /// Sequence number within client
    sequence: u64,
}

/// Operation log entry for collaborative history
#[derive(Debug, Clone)]
struct LogEntry {
    op_id: OperationId,
    operation: EditOperation,
    view_id: ViewId,
    timestamp: SystemTime,
    applied: bool,
}
```

### 10. Crash Recovery Manager

**Location**: `apps/backend/xi_integration/src/crash_recovery.rs`

**Purpose**: Handle Xi-Core crashes and restore state from autosave

**Design Rationale**: While xi-core is stable, crashes can occur due to memory issues, plugin failures, or unexpected edge cases. The Crash Recovery Manager monitors xi-core health, detects crashes, and orchestrates recovery by restarting xi-core and restoring buffers from autosave.

```rust
/// Manages crash detection and recovery for xi-core
pub struct CrashRecoveryManager {
    /// Health check interval
    health_check_interval: Duration,
    /// Autosave manager for recovery
    autosave: Arc<Mutex<AutosaveManager>>,
    /// Last known good state
    last_good_state: Option<SystemState>,
    /// Crash counter for diagnostics
    crash_count: u32,
}

impl CrashRecoveryManager {
    /// Monitor xi-core health and detect crashes
    pub async fn monitor_health(&mut self, xi: Arc<Mutex<XiIntegration>>) {
        let mut interval = tokio::time::interval(self.health_check_interval);
        
        loop {
            interval.tick().await;
            
            match self.check_health(&xi).await {
                Ok(_) => {
                    // Update last good state
                    self.last_good_state = Some(self.capture_state(&xi).await);
                }
                Err(HealthCheckError::Unresponsive) => {
                    self.handle_crash(xi.clone()).await;
                }
                Err(e) => {
                    eprintln!("Health check error: {}", e);
                }
            }
        }
    }
    
    /// Handle xi-core crash and attempt recovery
    async fn handle_crash(&mut self, xi: Arc<Mutex<XiIntegration>>) {
        self.crash_count += 1;
        
        eprintln!("Xi-Core crash detected (crash #{})! Attempting recovery...", self.crash_count);
        
        // Log crash details
        self.log_crash_details().await;
        
        // Restart xi-core
        match self.restart_xi_core(xi.clone()).await {
            Ok(_) => {
                eprintln!("Xi-Core restarted successfully");
                
                // Restore buffers from autosave
                self.restore_buffers(xi).await;
            }
            Err(e) => {
                eprintln!("Failed to restart Xi-Core: {}", e);
                // Notify user of unrecoverable error
            }
        }
    }
    
    /// Restart xi-core instance
    async fn restart_xi_core(&self, xi: Arc<Mutex<XiIntegration>>) -> Result<(), RecoveryError> {
        let mut xi_lock = xi.lock().await;
        
        // Shutdown crashed instance
        drop(xi_lock);
        
        // Create new instance
        let new_xi = XiIntegration::new(XiConfig::default())?;
        
        // Replace in Arc
        *xi.lock().await = new_xi;
        
        Ok(())
    }
    
    /// Restore all buffers from autosave
    async fn restore_buffers(&self, xi: Arc<Mutex<XiIntegration>>) {
        let autosave = self.autosave.lock().await;
        
        if let Some(state) = &self.last_good_state {
            for (path, view_id) in &state.open_files {
                if let Some(autosave_path) = autosave.check_recovery(path) {
                    let mut xi_lock = xi.lock().await;
                    
                    match xi_lock.open_file(&autosave_path).await {
                        Ok(new_view_id) => {
                            eprintln!("Restored buffer from autosave: {:?}", path);
                        }
                        Err(e) => {
                            eprintln!("Failed to restore buffer {:?}: {}", path, e);
                        }
                    }
                }
            }
        }
    }
}

#[derive(Debug, Clone)]
struct SystemState {
    open_files: Vec<(PathBuf, ViewId)>,
    timestamp: SystemTime,
}
```

## Data Models

### Core Data Structures

#### 1. View Identifier
```rust
/// Unique identifier for a buffer view
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct ViewId(pub u64);
```

#### 2. Edit Operation
```rust
/// Represents a text editing operation
#[derive(Debug, Clone)]
pub enum EditOperation {
    /// Insert text at position
    Insert {
        position: usize,
        text: String,
    },
    /// Delete text range
    Delete {
        start: usize,
        end: usize,
    },
    /// Replace text range
    Replace {
        start: usize,
        end: usize,
        text: String,
    },
}
```

#### 3. Buffer Metadata
```rust
/// Metadata about an open buffer
#[derive(Debug, Clone)]
pub struct BufferMetadata {
    /// File path
    pub path: PathBuf,
    /// Whether buffer has unsaved changes
    pub dirty: bool,
    /// Last save timestamp
    pub last_saved: SystemTime,
    /// Detected language
    pub language: Option<String>,
    /// Line ending style
    pub line_ending: LineEnding,
    /// File encoding
    pub encoding: Encoding,
}
```

#### 4. Update Operation
```rust
/// Incremental update operation from xi-core
#[derive(Debug, Clone)]
pub enum UpdateOp {
    /// Keep n lines unchanged
    Keep(usize),
    /// Delete n lines
    Delete(usize),
    /// Insert new lines
    Insert { lines: Vec<String> },
    /// Update n lines (style changes only)
    Update(usize),
}
```

#### 5. Style Span
```rust
/// Syntax highlighting style span
#[derive(Debug, Clone)]
pub struct StyleSpan {
    /// Text range
    pub range: Range,
    /// Style identifier
    pub style_id: u32,
    /// Foreground color
    pub fg_color: Option<Color>,
    /// Font style (bold, italic, etc.)
    pub font_style: FontStyle,
}
```

#### 6. Cursor and Selection
```rust
/// Cursor position in buffer
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct CursorPosition {
    /// Line number (0-indexed)
    pub line: usize,
    /// Column number (0-indexed)
    pub column: usize,
    /// Byte offset in buffer
    pub offset: usize,
}

/// Text selection range
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Selection {
    /// Selection start (anchor)
    pub start: CursorPosition,
    /// Selection end (active cursor)
    pub end: CursorPosition,
    /// Selection direction
    pub direction: SelectionDirection,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SelectionDirection {
    Forward,
    Backward,
}
```

#### 7. Line Ending and Encoding
```rust
/// Line ending style
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum LineEnding {
    /// Unix-style (LF)
    Lf,
    /// Windows-style (CRLF)
    CrLf,
    /// Classic Mac (CR)
    Cr,
}

/// Text encoding
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum Encoding {
    Utf8,
    Utf8Bom,
    Utf16Le,
    Utf16Be,
    /// Other encoding with name
    Other(String),
}
```

#### 8. Configuration Types
```rust
/// Xi-core configuration
#[derive(Debug, Clone)]
pub struct XiConfig {
    /// Tab size in spaces
    pub tab_size: usize,
    /// Convert tabs to spaces
    pub translate_tabs_to_spaces: bool,
    /// Enable word wrap
    pub word_wrap: bool,
    /// Enable auto-indent
    pub auto_indent: bool,
    /// Font face
    pub font_face: String,
    /// Font size
    pub font_size: f32,
    /// Scroll past end of document
    pub scroll_past_end: bool,
    /// Use tab stops
    pub use_tab_stops: bool,
    /// Word wrap column
    pub word_wrap_column: Option<usize>,
}

impl Default for XiConfig {
    fn default() -> Self {
        Self {
            tab_size: 4,
            translate_tabs_to_spaces: true,
            word_wrap: false,
            auto_indent: true,
            font_face: "monospace".to_string(),
            font_size: 14.0,
            scroll_past_end: true,
            use_tab_stops: true,
            word_wrap_column: None,
        }
    }
}
```

### Message Protocols

#### Symphony IPC Messages
```rust
/// Messages sent from frontend to backend
#[derive(Debug, Serialize, Deserialize)]
pub enum SymphonyIpcRequest {
    /// Open file and create buffer
    OpenFile { path: PathBuf },
    /// Apply edit to buffer
    Edit { view_id: ViewId, operation: EditOperation },
    /// Save buffer to disk
    Save { view_id: ViewId },
    /// Save buffer to specific path
    SaveAs { view_id: ViewId, path: PathBuf },
    /// Close buffer
    Close { view_id: ViewId },
    /// Search in buffer
    Search { view_id: ViewId, query: SearchQuery },
    /// Replace text in buffer
    Replace { view_id: ViewId, query: SearchQuery, replacement: String },
    /// Replace all matches in buffer
    ReplaceAll { view_id: ViewId, query: SearchQuery, replacement: String },
    /// Undo last operation
    Undo { view_id: ViewId },
    /// Redo last undone operation
    Redo { view_id: ViewId },
    /// Update cursor position
    UpdateCursor { view_id: ViewId, positions: Vec<CursorPosition> },
    /// Update selection
    UpdateSelection { view_id: ViewId, selections: Vec<Selection> },
    /// Request full buffer content
    GetContent { view_id: ViewId },
    /// Update configuration
    UpdateConfig { config: EditorConfig },
}

/// Messages sent from backend to frontend
#[derive(Debug, Serialize, Deserialize)]
pub enum SymphonyIpcResponse {
    /// Buffer opened successfully
    BufferOpened { 
        view_id: ViewId, 
        content: String,
        language: Option<String>,
        line_ending: LineEnding,
        encoding: Encoding,
    },
    /// Incremental buffer update
    BufferUpdate { 
        view_id: ViewId, 
        operations: Vec<UpdateOp>,
        pristine: bool,
    },
    /// Syntax highlighting update
    StyleUpdate { 
        view_id: ViewId, 
        spans: Vec<StyleSpan>,
        revision: u64,
    },
    /// Search results
    SearchResults { 
        view_id: ViewId, 
        matches: Vec<SearchMatch>,
        total_count: usize,
    },
    /// File saved successfully
    FileSaved { 
        view_id: ViewId,
        path: PathBuf,
    },
    /// Buffer content response
    BufferContent {
        view_id: ViewId,
        content: String,
    },
    /// Configuration updated
    ConfigUpdated,
    /// Error occurred
    Error { 
        message: String,
        error_type: ErrorType,
        view_id: Option<ViewId>,
    },
}

/// Search query parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchQuery {
    /// Search pattern
    pub pattern: String,
    /// Use regex matching
    pub regex: bool,
    /// Case-sensitive search
    pub case_sensitive: bool,
    /// Match whole words only
    pub whole_word: bool,
}

/// Search match result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchMatch {
    /// Start position in buffer
    pub start: usize,
    /// End position in buffer
    pub end: usize,
    /// Line number
    pub line: usize,
    /// Column number
    pub column: usize,
    /// Matched text
    pub text: String,
}

/// Editor configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EditorConfig {
    pub tab_size: usize,
    pub insert_spaces: bool,
    pub word_wrap: bool,
    pub auto_indent: bool,
    pub trim_trailing_whitespace: bool,
    pub font_family: String,
    pub font_size: f32,
}

/// Error type classification
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ErrorType {
    FileSystem,
    Buffer,
    Protocol,
    Configuration,
    Unknown,
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Rope operations preserve text integrity
*For any* sequence of insert and delete operations on a rope, converting the rope to a string and back should produce an equivalent rope structure.

**Validates: Requirements 1.3, 1.4**

### Property 2: Edit operation round-trip consistency
*For any* edit operation translated from Symphony IPC to Xi-RPC and applied to a buffer, querying the buffer content should reflect the exact change specified in the original operation.

**Validates: Requirements 3.1, 3.2, 3.4**

### Property 3: Incremental updates are complete
*For any* buffer state and sequence of edit operations, applying the incremental update operations should produce the same final state as applying all edits directly.

**Validates: Requirements 6.1, 6.2, 6.5**

### Property 4: Undo-redo inverse relationship
*For any* buffer state and edit operation, performing undo then redo should return the buffer to the exact same state as after the original edit.

**Validates: Requirements 7.2, 7.3**

### Property 5: Multi-cursor consistency
*For any* buffer with multiple cursors, applying the same text insertion at all cursor positions should result in the text appearing at each position without cursor position corruption.

**Validates: Requirements 8.1, 8.2, 8.5**

### Property 6: File I/O round-trip preservation
*For any* file content loaded into a buffer, saving the buffer without modifications should produce a byte-identical file.

**Validates: Requirements 9.1, 9.2, 11.2**

### Property 7: Search result accuracy
*For any* search query and buffer content, all returned search matches should actually match the query, and no matching text should be omitted.

**Validates: Requirements 10.1, 10.2, 10.3**

### Property 8: Line ending preservation
*For any* file with a specific line ending style (LF, CRLF, CR), loading and saving without explicit conversion should preserve the original line ending style.

**Validates: Requirements 11.1, 11.2**

### Property 9: Concurrent edit safety
*For any* two concurrent edit operations on different parts of a buffer, applying them in either order should produce the same final buffer state.

**Validates: Requirements 13.2, 13.3, 13.6**

### Property 10: Style span coverage
*For any* buffer with syntax highlighting enabled, the union of all style spans should cover the entire buffer content without gaps or overlaps.

**Validates: Requirements 5.2, 5.3**

### Property 11: Configuration changes apply without restart
*For any* configuration change (tab size, word wrap, auto-indent), applying the change to xi-core should immediately affect all open buffers without requiring Symphony restart.

**Validates: Requirements 14.2, 14.3, 14.4, 14.6**

### Property 12: Autosave interval consistency
*For any* buffer with unsaved changes, when autosave is enabled with a 30-second interval, the buffer should be automatically saved within 30-35 seconds of the last modification.

**Validates: Requirements 9.3**

### Property 13: External file change detection
*For any* file that is modified externally while open in Symphony, xi-core should detect the change and notify the user within 1 second of the modification.

**Validates: Requirements 9.5**

### Property 14: Memory usage bounds
*For any* buffer containing text of size N bytes, the total memory usage (including rope structure and undo history) should not exceed 2N bytes plus a constant overhead.

**Validates: Requirements 1.6, 12.4**

### Property 15: Replace-all atomicity
*For any* buffer and search query with multiple matches, executing replace-all should either replace all matches in a single undoable operation, or fail without modifying the buffer.

**Validates: Requirements 10.6**

### Property 16: Encoding round-trip preservation
*For any* file with a specific encoding (UTF-8, UTF-16LE, UTF-16BE), loading the file and saving it without modifications should preserve the exact byte sequence including BOM markers.

**Validates: Requirements 11.4, 11.6**

### Property 17: Plugin crash isolation
*For any* xi-editor plugin that crashes, the crash should not affect xi-core's operation or cause data loss in any open buffers.

**Validates: Requirements 4.6, 15.3**

### Property 18: Operation ID uniqueness
*For any* sequence of edit operations across multiple buffers, each operation should receive a unique Operation ID that can be used for tracking and collaborative editing.

**Validates: Requirements 13.1, 13.4**

## Error Handling

### Error Categories

#### 1. File System Errors
```rust
#[derive(Debug, thiserror::Error)]
pub enum FileSystemError {
    #[error("File not found: {path}")]
    FileNotFound { path: PathBuf },
    
    #[error("Permission denied: {path}")]
    PermissionDenied { path: PathBuf },
    
    #[error("I/O error: {0}")]
    IoError(#[from] std::io::Error),
}
```

**Handling Strategy**:
- Retry with exponential backoff for transient errors
- Notify user for permission errors
- Attempt recovery from autosave for corruption

#### 2. Buffer Errors
```rust
#[derive(Debug, thiserror::Error)]
pub enum BufferError {
    #[error("Invalid view ID: {0}")]
    InvalidViewId(ViewId),
    
    #[error("Buffer is read-only")]
    ReadOnly,
    
    #[error("Edit operation out of bounds")]
    OutOfBounds,
}
```

**Handling Strategy**:
- Reject invalid operations with clear error messages
- Log errors for debugging
- Maintain buffer consistency by rolling back failed operations

#### 3. Protocol Errors
```rust
#[derive(Debug, thiserror::Error)]
pub enum ProtocolError {
    #[error("Failed to serialize message: {0}")]
    SerializationError(String),
    
    #[error("Unknown message type: {0}")]
    UnknownMessageType(String),
    
    #[error("IPC communication failed: {0}")]
    IpcError(String),
}
```

**Handling Strategy**:
- Log protocol errors with full context
- Attempt to resynchronize state
- Fallback to full buffer refresh if incremental updates fail

### Recovery Mechanisms

#### Autosave Recovery
```rust
impl XiIntegration {
    /// Attempt to recover buffer from autosave
    pub async fn recover_from_autosave(&mut self, path: &Path) -> Result<ViewId, XiError> {
        let autosave_path = self.get_autosave_path(path);
        
        if autosave_path.exists() {
            // Load from autosave
            let view_id = self.open_file(&autosave_path)?;
            
            // Prompt user to recover
            self.notify_recovery_available(path, view_id);
            
            Ok(view_id)
        } else {
            Err(XiError::NoAutosaveAvailable)
        }
    }
}
```

#### State Resynchronization
```rust
impl IpcBridge {
    /// Force full state resync between Monaco and xi-core
    pub async fn resync_state(&mut self, view_id: ViewId) -> Result<(), ProtocolError> {
        // Get complete buffer state from xi-core
        let content = self.xi_integration.lock().await.get_content(view_id)?;
        let style_spans = self.xi_integration.lock().await.get_style_spans(view_id)?;
        
        // Send full update to frontend
        self.send_full_update(view_id, content, style_spans).await?;
        
        Ok(())
    }
}
```

## Testing Strategy

**Design Rationale**: Comprehensive testing is critical for ensuring the reliability and correctness of the xi-editor integration. We employ a multi-layered testing strategy that combines unit tests for specific functionality, property-based tests for universal correctness properties, integration tests for end-to-end workflows, and performance benchmarks for non-functional requirements. This approach ensures both functional correctness and performance characteristics are validated (Requirement 16).

### Test Organization

Tests are organized by type and scope:
- **Unit Tests**: `apps/backend/xi_integration/src/*/tests.rs` - Co-located with implementation
- **Property Tests**: `apps/backend/xi_integration/tests/properties/` - Organized by property number
- **Integration Tests**: `apps/backend/xi_integration/tests/integration/` - End-to-end workflows
- **Benchmarks**: `apps/backend/xi_integration/benches/` - Performance validation

### Unit Testing

Unit tests will cover specific functionality and edge cases (Requirement 16.1):

- **Rope Operations**: Test insert, delete, slice operations on xi-rope
  - Empty rope operations
  - Boundary conditions (start, end of rope)
  - Large text operations (> 1MB)
  - Unicode handling (multi-byte characters, emoji)
- **Message Translation**: Verify correct translation between IPC formats (Requirement 16.4)
  - All message types (edit, save, search, etc.)
  - Error message translation
  - Edge cases (empty strings, special characters)
- **Buffer Management**: Test buffer lifecycle (open, edit, save, close)
  - Multiple buffers simultaneously
  - Buffer reuse and cleanup
  - Memory leak detection
- **Error Handling**: Verify proper error propagation and recovery
  - File system errors (permission denied, not found)
  - Invalid operations (out of bounds edits)
  - Protocol errors (malformed messages)

Example unit test:
```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_edit_translation() {
        let bridge = IpcBridge::new();
        let symphony_edit = SymphonyEditMessage {
            view_id: ViewId(1),
            operation: SymphonyOp::Insert {
                pos: 10,
                text: "hello".to_string(),
            },
        };
        
        let xi_msg = bridge.translate_edit(symphony_edit);
        
        // Verify translation correctness
        assert!(matches!(xi_msg, XiRpcMessage::Edit { .. }));
    }
    
    #[test]
    fn test_rope_unicode_handling() {
        let rope = Rope::from("Hello 👋 World 🌍");
        
        // Test that emoji are handled correctly
        assert_eq!(rope.len(), 19); // Byte length
        
        // Test slicing doesn't break multi-byte characters
        let slice = rope.slice(0..8);
        assert_eq!(slice.to_string(), "Hello 👋");
    }
    
    #[test]
    fn test_buffer_lifecycle() {
        let mut manager = BufferManager::new();
        let path = PathBuf::from("test.txt");
        
        // Open buffer
        let view_id = manager.open_buffer(path.clone()).await.unwrap();
        assert!(manager.is_open(view_id));
        
        // Close buffer
        manager.close_buffer(view_id).await.unwrap();
        assert!(!manager.is_open(view_id));
        
        // Verify cleanup
        assert_eq!(manager.buffer_count(), 0);
    }
}
```

### Test Coverage Requirements

- **Minimum Coverage**: 80% line coverage for all integration code (Requirement 16.1)
- **Critical Path Coverage**: 100% coverage for error handling and recovery paths
- **Property Coverage**: All 18 correctness properties must have corresponding property tests
- **Integration Coverage**: All IPC message types must have integration tests

### Continuous Integration

All tests run automatically in CI:
1. Unit tests run on every commit
2. Property tests run on every pull request (100 iterations each)
3. Integration tests run on every pull request
4. Performance benchmarks run nightly and on release branches
5. Coverage reports generated and tracked over time

### Property-Based Testing

Property-based tests will verify universal properties across many inputs using the **proptest** crate for Rust:

- Each property test will run a minimum of 100 iterations (Requirement 16.2)
- Tests will use random input generation to explore edge cases
- Each test will be tagged with the corresponding correctness property from the design document using the format: `**Feature: xi-editor-migration, Property {number}: {property_text}**`
- Property tests will focus on core logic without mocking to ensure real-world correctness
- Smart generators will be written to constrain inputs to valid ranges (e.g., positions within buffer bounds)

**Testing Framework**: proptest 1.4+ for Rust property-based testing

Example property test:
```rust
use proptest::prelude::*;

proptest! {
    #![proptest_config(ProptestConfig::with_cases(100))]
    
    #[test]
    /// **Feature: xi-editor-migration, Property 2: Edit operation round-trip consistency**
    /// 
    /// Validates: Requirements 3.1, 3.2, 3.4
    fn prop_edit_roundtrip(
        initial_text in "\\PC{0,1000}",
        pos in 0usize..1000,
        insert_text in "\\PC{0,100}"
    ) {
        let mut rope = Rope::from(initial_text.clone());
        let pos = pos.min(rope.len());
        
        // Apply insert operation
        rope = rope.edit(Interval::new(pos, pos), insert_text.clone());
        
        // Verify the text was inserted correctly
        let result = rope.to_string();
        let expected = format!(
            "{}{}{}",
            &initial_text[..pos],
            insert_text,
            &initial_text[pos..]
        );
        
        prop_assert_eq!(result, expected);
    }
    
    #[test]
    /// **Feature: xi-editor-migration, Property 6: File I/O round-trip preservation**
    /// 
    /// Validates: Requirements 9.1, 9.2, 11.2
    fn prop_file_io_roundtrip(
        content in "\\PC{0,10000}",
        line_ending in prop_oneof![
            Just(LineEnding::Lf),
            Just(LineEnding::CrLf),
            Just(LineEnding::Cr)
        ]
    ) {
        let temp_file = create_temp_file_with_content(&content, line_ending);
        
        // Load file into buffer
        let view_id = xi.open_file(&temp_file).await?;
        
        // Save without modifications
        xi.save(view_id).await?;
        
        // Read file and verify byte-identical
        let saved_content = std::fs::read(&temp_file)?;
        let original_content = content_with_line_ending(&content, line_ending);
        
        prop_assert_eq!(saved_content, original_content);
    }
    
    #[test]
    /// **Feature: xi-editor-migration, Property 14: Memory usage bounds**
    /// 
    /// Validates: Requirements 1.6, 12.4
    fn prop_memory_usage_bounds(
        text in "\\PC{1000,100000}"
    ) {
        let rope = Rope::from(text.clone());
        let text_size = text.len();
        
        // Measure rope memory usage
        let rope_size = std::mem::size_of_val(&rope) + rope.memory_usage();
        
        // Verify memory usage is within bounds (2x + constant overhead)
        let max_allowed = text_size * 2 + 1024; // 1KB constant overhead
        prop_assert!(rope_size <= max_allowed, 
            "Memory usage {} exceeds bound {} for text size {}", 
            rope_size, max_allowed, text_size);
    }
}
```

**Property Test Coverage**: Each of the 18 correctness properties defined in this document will have at least one corresponding property-based test. Tests will be organized by property number for easy traceability.

### Integration Testing

Integration tests will verify end-to-end workflows (Requirement 16.4):

- **File Lifecycle**: Open file → Edit → Save → Verify file contents
- **Concurrent Operations**: Multiple concurrent edits on same buffer (Requirement 16.6)
- **Undo/Redo Sequences**: Complex undo/redo patterns with multiple operations
- **Search and Replace**: Full search/replace workflows including regex patterns
- **Syntax Highlighting**: Highlighting updates after edits
- **IPC Round-trip**: Message translation correctness across Symphony IPC ↔ Xi-RPC boundary
- **Plugin Integration**: Plugin loading, communication, and crash isolation
- **Autosave Recovery**: Crash recovery from autosaved files
- **Configuration Changes**: Dynamic configuration updates without restart

Example integration test:
```rust
#[tokio::test]
async fn test_complete_editing_workflow() {
    // Initialize xi-core integration
    let mut xi = XiIntegration::new(XiConfig::default()).await.unwrap();
    let temp_file = create_temp_file("initial content");
    
    // Open file
    let view_id = xi.open_file(&temp_file).await.unwrap();
    
    // Make multiple edits
    xi.edit(view_id, EditOperation::Insert {
        position: 0,
        text: "// Header\n".to_string(),
    }).await.unwrap();
    
    xi.edit(view_id, EditOperation::Insert {
        position: 100,
        text: "\n// Footer".to_string(),
    }).await.unwrap();
    
    // Undo one edit
    xi.undo(view_id).await.unwrap();
    
    // Save file
    xi.save(view_id).await.unwrap();
    
    // Verify file contents
    let saved_content = std::fs::read_to_string(&temp_file).unwrap();
    assert!(saved_content.starts_with("// Header\n"));
    assert!(!saved_content.contains("// Footer"));
}
```

### Performance Testing

Benchmarks will verify performance requirements (Requirement 16.3, 16.5):

- **File Loading**: 10MB+ files load in < 100ms (Requirement 1.2)
- **Edit Latency**: 95th percentile < 16ms (Requirement 6.6)
- **Memory Usage**: < 2x file size (Requirement 1.6)
- **Throughput**: > 10,000 single-character edits/second (Requirement 12.6)
- **Large File Handling**: 100MB+ files maintain performance thresholds (Requirement 16.5)
- **Search Performance**: 10MB+ file search returns results incrementally (Requirement 10.7)

**Benchmarking Framework**: criterion 0.5+ for statistical benchmarking

Example benchmark:
```rust
use criterion::{black_box, criterion_group, criterion_main, Criterion, BenchmarkId};

fn bench_large_file_edit(c: &mut Criterion) {
    let large_text = "x".repeat(10_000_000); // 10MB file
    let mut rope = Rope::from(large_text);
    
    c.bench_function("edit_10mb_file", |b| {
        b.iter(|| {
            rope = rope.edit(
                Interval::new(5_000_000, 5_000_000),
                black_box("inserted text")
            );
        });
    });
}

fn bench_file_loading(c: &mut Criterion) {
    let mut group = c.benchmark_group("file_loading");
    
    for size_mb in [1, 10, 50, 100].iter() {
        let content = "x".repeat(size_mb * 1_000_000);
        let temp_file = create_temp_file_with_content(&content);
        
        group.bench_with_input(
            BenchmarkId::from_parameter(format!("{}MB", size_mb)),
            &temp_file,
            |b, file| {
                b.iter(|| {
                    let mut xi = XiIntegration::new(XiConfig::default()).unwrap();
                    xi.open_file(file).await.unwrap()
                });
            }
        );
    }
    
    group.finish();
}

fn bench_edit_throughput(c: &mut Criterion) {
    let mut rope = Rope::from("initial content");
    
    c.bench_function("single_char_edits_per_second", |b| {
        let mut pos = 0;
        b.iter(|| {
            rope = rope.edit(
                Interval::new(pos, pos),
                black_box("x")
            );
            pos += 1;
            if pos > 10000 {
                pos = 0;
                rope = Rope::from("initial content");
            }
        });
    });
}

criterion_group!(benches, bench_large_file_edit, bench_file_loading, bench_edit_throughput);
criterion_main!(benches);
```

**Performance Regression Testing**: Benchmarks will be run in CI to detect performance regressions. Any benchmark that regresses by more than 10% will fail the build.

## Performance Considerations

### Memory Optimization

- **Copy-on-Write**: Xi-rope uses COW semantics to minimize memory copies
- **Shared Nodes**: Rope nodes are reference-counted and shared between versions
- **Undo History Pruning**: Limit undo history to 1000 operations, prune older entries

### Latency Optimization

- **Incremental Updates**: Only send changed lines to frontend
- **Batching**: Batch rapid edit operations to reduce IPC overhead
- **Async I/O**: All file operations use async I/O to avoid blocking
- **Lazy Syntax Highlighting**: Compute highlighting only for visible regions

### Throughput Optimization

- **Parallel Processing**: Use Tokio for concurrent buffer operations
- **Lock-Free Structures**: Minimize lock contention in hot paths
- **Zero-Copy**: Use references and slices to avoid unnecessary copies

## Concurrency and Thread Safety

**Design Rationale**: Xi-core operations must be thread-safe to support concurrent edits from multiple sources (user input, AI agents, plugins). We use Rust's type system and async runtime to ensure safety while maintaining performance.

### Thread Safety Guarantees

- **Buffer Access**: All buffer operations protected by `Arc<Mutex<>>` or `Arc<RwLock<>>`
- **Concurrent Edits**: Operational transformation ensures consistency (Requirement 13.2, 13.3)
- **Plugin Isolation**: Each plugin runs in separate process, cannot corrupt shared state (Requirement 4.6)
- **Async Operations**: All I/O operations use Tokio async runtime to avoid blocking

### Concurrency Model

```rust
/// Thread-safe xi-core integration
pub struct XiIntegration {
    /// Core state protected by async mutex
    core: Arc<Mutex<CoreState>>,
    /// View state with read-write lock for concurrent reads
    views: Arc<RwLock<HashMap<ViewId, View>>>,
    /// IPC sender is clone-able for multi-threaded access
    ipc_sender: IpcSender,
}

impl XiIntegration {
    /// Apply edit with proper locking
    pub async fn edit(&self, view_id: ViewId, operation: EditOperation) -> Result<(), XiError> {
        // Acquire write lock only for the duration of the edit
        let mut core = self.core.lock().await;
        core.apply_edit(view_id, operation)?;
        
        // Release lock before sending IPC message
        drop(core);
        
        // Send update notification (non-blocking)
        self.ipc_sender.send_update(view_id).await?;
        
        Ok(())
    }
}
```

### Concurrent Edit Handling

When multiple edits arrive concurrently:
1. **Serialize at Buffer Level**: Each buffer processes edits sequentially
2. **Parallel Across Buffers**: Different buffers can be edited in parallel
3. **Operational Transformation**: Conflicting edits are transformed to maintain consistency (Requirement 13.2)

### Testing Concurrent Operations

Concurrent operation tests verify thread safety (Requirement 16.6):

```rust
#[tokio::test(flavor = "multi_thread", worker_threads = 4)]
async fn test_concurrent_edits() {
    let xi = Arc::new(XiIntegration::new(XiConfig::default()).await.unwrap());
    let view_id = xi.open_file(Path::new("test.txt")).await.unwrap();
    
    // Spawn 100 concurrent edit tasks
    let mut handles = vec![];
    for i in 0..100 {
        let xi_clone = xi.clone();
        let handle = tokio::spawn(async move {
            xi_clone.edit(view_id, EditOperation::Insert {
                position: i * 10,
                text: format!("edit_{}", i),
            }).await
        });
        handles.push(handle);
    }
    
    // Wait for all edits to complete
    for handle in handles {
        handle.await.unwrap().unwrap();
    }
    
    // Verify buffer consistency
    let content = xi.get_content(view_id).await.unwrap();
    assert!(content.contains("edit_0"));
    assert!(content.contains("edit_99"));
}
```

## Security Considerations

### Input Validation

- Validate all file paths to prevent directory traversal attacks
- Sanitize edit operations to prevent buffer overflow
- Limit maximum file size to prevent memory exhaustion (default: 100MB, configurable)
- Validate edit positions are within buffer bounds (Requirement 15.5)

### Sandboxing

- Run xi-core in isolated process if needed for additional security
- Limit file system access to workspace directories
- Validate all IPC messages before processing (Requirement 15.5)
- Plugin processes run with restricted permissions (Requirement 4.6)

## Deployment Strategy

### Phase 1: Core Integration (Week 1-2)
- Add xi-editor crates as dependencies
- Implement basic IPC translation layer
- Create buffer manager with open/close/edit operations

### Phase 2: Feature Parity (Week 3-4)
- Implement undo/redo integration
- Add search and replace functionality
- Integrate syntax highlighting

### Phase 3: Optimization (Week 5-6)
- Implement incremental updates
- Add performance monitoring
- Optimize memory usage

### Phase 4: Polish (Week 7-8)
- Add autosave functionality
- Implement error recovery
- Complete documentation

## Dependencies

### Rust Crates

```toml
[dependencies]
# Xi-editor core components
xi-rope = { path = "../xi-editor/rust/rope" }
xi-core-lib = { path = "../xi-editor/rust/core-lib" }
xi-rpc = { path = "../xi-editor/rust/rpc" }
xi-trace = { path = "../xi-editor/rust/trace" }

# Async runtime
tokio = { version = "1.35", features = ["full"] }

# Serialization
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# Error handling
thiserror = "1.0"
anyhow = "1.0"

# Testing
proptest = "1.4"
criterion = "0.5"
```

### Frontend Dependencies

```json
{
  "dependencies": {
    "@monaco-editor/react": "^4.7.0",
    "react": "^19.1.0"
  }
}
```

## Migration from Scaffold Implementation

### Deprecation Strategy

**Design Rationale**: Symphony currently has scaffold implementations in `apps/backend/rope/` that were created for prototyping. Rather than migrating code from these scaffolds, we will directly integrate xi-editor's production-ready implementations and deprecate the scaffolds. This approach avoids technical debt and ensures we use battle-tested code.

### Deprecation Plan

1. **Audit Phase**: Identify all references to `apps/backend/rope/` across the codebase
   - Search for imports: `use rope::*`, `use crate::rope::*`
   - Find direct usages in Symphony's core and extensions
   - Document all dependent modules

2. **Compatibility Layer**: Create temporary wrappers to ease transition
   - Provide type aliases for common rope types
   - Implement adapter functions for API differences
   - Mark all compatibility code with deprecation warnings

3. **Incremental Migration**: Update imports module by module
   - Start with leaf modules (no dependencies)
   - Progress to core modules
   - Update tests alongside implementation code
   - Verify functionality at each step

4. **Scaffold Removal**: Delete scaffold code after complete migration
   - Remove `apps/backend/rope/` directory
   - Remove compatibility layer
   - Update documentation to reference xi-rope
   - Verify no remaining references

### Compatibility Shims

```rust
// apps/backend/xi_integration/src/compat.rs
// Temporary compatibility layer for migration period

pub use xi_rope::Rope as XiRope;

#[deprecated(note = "Use xi_rope::Rope directly from xi-editor integration")]
pub type Rope = XiRope;

#[deprecated(note = "Use xi_rope::RopeSlice directly")]
pub type RopeSlice<'a> = xi_rope::RopeSlice<'a>;

/// Compatibility wrapper for old rope API
#[deprecated(note = "Migrate to xi_rope API")]
pub mod legacy {
    use super::*;
    
    /// Old API: create rope from string
    pub fn rope_from_str(s: &str) -> Rope {
        Rope::from(s)
    }
    
    /// Old API: get rope length
    pub fn rope_len(rope: &Rope) -> usize {
        rope.len()
    }
}
```

### Migration Checklist

- [ ] Audit all usages of `apps/backend/rope/`
- [ ] Create compatibility layer in `xi_integration/src/compat.rs`
- [ ] Update imports in leaf modules
- [ ] Update imports in core modules
- [ ] Update all tests
- [ ] Verify performance benchmarks
- [ ] Remove compatibility layer
- [ ] Delete `apps/backend/rope/` directory
- [ ] Update architecture documentation

## Documentation and Developer Experience

**Design Rationale**: Comprehensive documentation is critical for successful integration and future maintenance. We provide multiple documentation layers targeting different audiences: architecture docs for system understanding, API docs for extension developers, and troubleshooting guides for debugging.

### Documentation Structure

#### 1. Architecture Documentation

**Location**: `.kiro/specs/xi-editor-migration/ARCHITECTURE.md`

**Content**:
- High-level integration overview
- Component interaction diagrams
- Data flow between Symphony and xi-core
- Design decisions and rationales
- Performance characteristics
- Security model

#### 2. API Documentation

**Location**: `apps/backend/xi_integration/docs/API.md`

**Content**:
- Public API reference for XiIntegration
- IPC message protocol specification
- Buffer management API
- Configuration options
- Error handling patterns
- Code examples for common operations

**Rust Doc Comments**:
```rust
/// Xi-Core Integration Module
///
/// This module provides Symphony's integration with xi-editor's core
/// text editing engine. It wraps xi-editor components and exposes a
/// Symphony-compatible API.
///
/// # Architecture
///
/// The integration consists of several layers:
/// - **XiIntegration**: Main entry point for xi-core functionality
/// - **IpcBridge**: Protocol translation between Symphony IPC and Xi-RPC
/// - **BufferManager**: Buffer lifecycle management
/// - **MonacoBridge**: Frontend synchronization
///
/// # Examples
///
/// ```rust
/// use xi_integration::{XiIntegration, XiConfig};
///
/// // Initialize xi-core integration
/// let mut xi = XiIntegration::new(XiConfig::default())?;
///
/// // Open a file
/// let view_id = xi.open_file(Path::new("src/main.rs")).await?;
///
/// // Apply an edit
/// xi.edit(view_id, EditOperation::Insert {
///     position: 0,
///     text: "// New comment\n".to_string(),
/// }).await?;
///
/// // Save the file
/// xi.save(view_id).await?;
/// ```
///
/// # Performance
///
/// - File loading: < 100ms for 10MB files
/// - Edit latency: < 16ms for 95th percentile
/// - Memory usage: < 2x file size
///
/// # Error Handling
///
/// All operations return `Result` types with detailed error information.
/// See [`XiError`] for error categories and recovery strategies.
pub struct XiIntegration {
    // ...
}
```

#### 3. Integration Guide

**Location**: `apps/backend/xi_integration/docs/INTEGRATION_GUIDE.md`

**Content**:
- Step-by-step integration instructions
- Configuration examples
- Common integration patterns
- Troubleshooting common issues
- Migration from scaffold implementations

#### 4. Debugging and Diagnostics

**Location**: `apps/backend/xi_integration/docs/DEBUGGING.md`

**Content**:
- Logging configuration
- Performance profiling tools
- Common error scenarios and solutions
- Debug build instructions
- Trace analysis guide

**Logging Infrastructure**:
```rust
/// Diagnostic logging for xi-core integration
pub struct DiagnosticLogger {
    /// Log level configuration
    level: LogLevel,
    /// Log output destination
    output: LogOutput,
}

impl DiagnosticLogger {
    /// Log edit operation with timing
    pub fn log_edit_operation(&self, view_id: ViewId, operation: &EditOperation, duration: Duration) {
        if self.level >= LogLevel::Debug {
            log::debug!(
                "Edit operation on view {}: {:?} completed in {:?}",
                view_id.0,
                operation,
                duration
            );
        }
    }
    
    /// Log IPC message translation
    pub fn log_ipc_translation(&self, direction: Direction, message: &str) {
        if self.level >= LogLevel::Trace {
            log::trace!("IPC {} translation: {}", direction, message);
        }
    }
    
    /// Log performance warning
    pub fn log_performance_warning(&self, operation: &str, duration: Duration, threshold: Duration) {
        log::warn!(
            "Performance warning: {} took {:?} (threshold: {:?})",
            operation,
            duration,
            threshold
        );
    }
}
```

#### 5. Examples and Tutorials

**Location**: `apps/backend/xi_integration/examples/`

**Examples**:
- `basic_editing.rs`: Simple file open, edit, save workflow
- `multi_buffer.rs`: Managing multiple open files
- `search_replace.rs`: Search and replace operations
- `undo_redo.rs`: Undo/redo functionality
- `syntax_highlighting.rs`: Syntax highlighting integration
- `performance_monitoring.rs`: Using metrics and profiling

#### 6. Breaking Changes Documentation

**Location**: `apps/backend/xi_integration/CHANGELOG.md`

**Content**:
- Version history
- Breaking changes with migration guides
- New features and improvements
- Bug fixes and performance improvements
- Deprecation notices

**Format**:
```markdown
# Changelog

## [0.2.0] - 2024-XX-XX

### Breaking Changes
- Removed scaffold rope implementation in favor of xi-rope
  - **Migration**: Update imports from `use rope::*` to `use xi_rope::*`
  - **Compatibility**: Temporary shims available in `xi_integration::compat`

### Added
- Plugin system adapter for xi-editor plugins
- Autosave manager with configurable intervals
- Crash recovery with automatic buffer restoration

### Fixed
- Memory leak in undo history pruning
- Race condition in concurrent edit operations
```

#### 7. Performance Tuning Guide

**Location**: `apps/backend/xi_integration/docs/PERFORMANCE.md`

**Content**:
- Performance characteristics and benchmarks
- Optimization techniques
- Memory usage patterns
- Profiling instructions
- Configuration tuning for different workloads

### Developer Onboarding

**Onboarding Checklist** (Requirement 18.4):
1. Read ARCHITECTURE.md for system overview (Requirement 18.1)
2. Review API.md for public interfaces (Requirement 18.2)
3. Run example programs in `examples/` (Requirement 18.4)
4. Read INTEGRATION_GUIDE.md for integration patterns
5. Set up debugging environment using DEBUGGING.md (Requirement 18.3)
6. Review test suite for usage patterns
7. Read PERFORMANCE.md for optimization guidelines (Requirement 18.6)

**Time to Productivity**: New developers should be able to make their first contribution within 2 hours of starting the onboarding process.

**Quick Start Example**:
```rust
// examples/quick_start.rs
//! Quick start example for xi-core integration
//!
//! This example demonstrates the basic workflow:
//! 1. Initialize xi-core
//! 2. Open a file
//! 3. Make an edit
//! 4. Save the file

use xi_integration::{XiIntegration, XiConfig, EditOperation};
use std::path::Path;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize xi-core with default configuration
    let mut xi = XiIntegration::new(XiConfig::default())?;
    
    // Open a file
    let view_id = xi.open_file(Path::new("example.txt")).await?;
    println!("Opened file with view ID: {:?}", view_id);
    
    // Make an edit
    xi.edit(view_id, EditOperation::Insert {
        position: 0,
        text: "Hello from xi-core!\n".to_string(),
    }).await?;
    println!("Applied edit");
    
    // Save the file
    xi.save(view_id).await?;
    println!("Saved file");
    
    Ok(())
}
```

## Requirements Traceability

This section maps each requirement to the design components that address it:

| Requirement | Design Component | Validation Method |
|-------------|------------------|-------------------|
| 1.1 - Use xi-rope | Layer 1: Xi-Editor Core | Unit tests, Property 1 |
| 1.2 - Load 10MB in <100ms | Performance Optimization | Benchmark tests |
| 1.3 - Copy-on-write | Xi-rope (existing) | Property 1 |
| 1.4 - Auto-rebalance | Xi-rope (existing) | Property 1 |
| 1.5 - Undo/redo support | Xi-core-lib (existing) | Property 4 |
| 1.6 - Memory <2x size | Memory Optimization | Property 14, Benchmarks |
| 1.7 - Deprecate scaffold | Migration Strategy | Code audit |
| 2.1 - Initialize xi-core | XiIntegration component | Integration tests |
| 2.2 - Expose via IPC | IPC Translation Layer | Integration tests |
| 2.3 - Create buffers | Buffer Manager | Unit tests |
| 2.4 - Translate to xi-core | IpcBridge.translate_edit | Property 2, Unit tests |
| 2.5 - Translate from xi-core | IpcBridge.translate_update | Property 3, Unit tests |
| 2.6 - Multiple buffers | Buffer Manager | Integration tests |
| 3.1-3.6 - Edit translation | IPC Translation Layer | Property 2, Integration tests |
| 4.1-4.6 - Plugin system | Plugin Adapter | Property 17, Integration tests |
| 5.1-5.6 - Syntax highlighting | Syntect integration | Property 10, Integration tests |
| 6.1-6.6 - Incremental updates | IPC Translation Layer | Property 3, Benchmarks |
| 7.1-7.6 - Undo/redo | Xi-core-lib (existing) | Property 4, Integration tests |
| 8.1-8.6 - Multi-cursor | Xi-core-lib (existing) | Property 5, Integration tests |
| 9.1-9.6 - File I/O | Xi-core-lib + Autosave Manager | Property 6, 12, 13 |
| 10.1-10.7 - Search/replace | Xi-core-lib (existing) | Property 7, 15, Integration tests |
| 11.1-11.6 - Line endings | Xi-core-lib (existing) | Property 8, 16, Unit tests |
| 12.1-12.6 - Performance metrics | Metrics Collector | Benchmarks, Integration tests |
| 13.1-13.6 - Collaborative foundation | Collaborative Foundation | Property 9, 18, Integration tests |
| 14.1-14.6 - Configuration | Configuration Manager | Property 11, Integration tests |
| 15.1-15.6 - Error handling | Error Handling section | Unit tests, Integration tests |
| 16.1-16.6 - Testing | Testing Strategy section | All test types |
| 17.1-17.6 - Direct integration | Architecture, Migration Strategy | Code audit |
| 18.1-18.6 - Documentation | Documentation section | Documentation review |

**Coverage Verification**: All 18 requirements with 106 acceptance criteria are addressed by the design. Each requirement has corresponding design components, implementation strategies, and validation methods.

## Future Enhancements

### Collaborative Editing (Requirement 13 - Full Implementation)
- Extend xi-core's CRDT support for real-time collaboration
- Implement operational transformation for conflict resolution
- Add presence indicators for multiple users
- Synchronize cursor positions across clients
- Network protocol for remote edit synchronization

### LSP Integration (Beyond Current Scope)
- Connect Symphony's existing lsp-manager to xi-core
- Provide diagnostics and code actions through xi-core
- Integrate autocomplete with xi-core's buffer state
- Support semantic tokens for enhanced highlighting

### Advanced Features (Beyond Current Scope)
- Semantic syntax highlighting using LSP
- Code folding based on syntax tree
- Minimap visualization
- Diff view for file changes
- Split view and multiple panes
- Vim/Emacs keybinding emulation

**Note**: These enhancements are not part of the initial integration scope but represent natural evolution paths for the xi-editor integration.