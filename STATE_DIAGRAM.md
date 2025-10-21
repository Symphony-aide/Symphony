# Symphony IDE - Comprehensive State Diagrams

This document contains state diagrams for all major state machines in the Symphony IDE system, organized by architectural component.

---

## 1. Extension Lifecycle - Chambering State Machine

**Overview**: The Chambering state machine manages the complete lifecycle of extensions from installation through runtime execution. This is a core component of the Orchestra Kit's LifecycleManager.

**Key States**:
- **Installed**: Extension package is on disk, manifest validated
- **Loading**: Extension code is being loaded into memory
- **Loaded**: Extension is in memory but not yet activated
- **Activated**: Extension's `activate()` method has been called successfully
- **Running**: Extension is actively executing tasks
- **Error**: Extension encountered a fatal error
- **Uninstalling**: Extension is being removed from the system

**Transitions**:
- Installation triggers Loading
- Successful load moves to Loaded
- User/system activation moves to Activated
- Task execution moves to Running
- Errors can occur from any state
- Deactivation returns to Loaded
- Uninstallation can occur from Installed, Loaded, or Activated states

```mermaid
stateDiagram-v2
    [*] --> Installed: install(package)
    
    Installed --> Loading: load()
    Loading --> Loaded: success
    Loading --> Error: load_failed
    
    Loaded --> Activated: activate()
    Loaded --> Uninstalling: uninstall()
    Activated --> Running: execute()
    Activated --> Loaded: deactivate()
    Activated --> Uninstalling: uninstall()
    
    Running --> Activated: task_complete
    Running --> Error: execution_error
    
    Error --> Loaded: recover()
    Error --> Uninstalling: uninstall()
    
    Uninstalling --> [*]: cleanup_complete
    
    note right of Installed
        Manifest validated
        Dependencies resolved
        Signature verified
    end note
    
    note right of Activated
        Extension API available
        Resources allocated
        Permissions granted
    end note
    
    note right of Running
        Active task execution
        Resource monitoring
        Performance tracking
    end note
```

---

## 2. Player Extension State Machine (Pool Manager)

**Overview**: The Pool Manager maintains Player extensions (Instruments, Operators, Motifs) in various states to achieve 50-100ns allocation times through predictive pre-warming.

**Key States**:
- **Unloaded**: Extension not in memory
- **Loading**: Extension binary being loaded
- **Warming**: Extension initializing resources (models, caches, etc.)
- **Ready**: Extension warm and cached, ready for instant allocation
- **Active**: Extension currently executing a task
- **Cooling**: Extension idle, preparing for potential unload

**Performance Characteristics**:
- **Unloaded → Ready**: 100-500ms (cold start)
- **Ready → Active**: 50-100ns (cache hit)
- **Predictive Pre-warming**: >80% accuracy

```mermaid
stateDiagram-v2
    [*] --> Unloaded
    
    Unloaded --> Loading: allocate() / predictive_prewarm()
    Loading --> Warming: load_complete
    Warming --> Ready: warm_complete
    
    Ready --> Active: allocate()
    Active --> Ready: deallocate()
    
    Ready --> Cooling: idle_timeout
    Cooling --> Unloaded: evict_from_cache
    Cooling --> Ready: access_detected
    
    Active --> Active: concurrent_task
    
    note right of Unloaded
        Not in memory
        Zero resource usage
    end note
    
    note right of Ready
        Cached in LRU
        50-100ns allocation
        Predictively warmed
    end note
    
    note right of Active
        Executing task
        Resource tracking
        Performance metrics
    end note
    
    note left of Cooling
        Idle timer active
        Candidate for eviction
        Can be reactivated
    end note
```

---

## 3. Melody Execution Workflow State Machine

**Overview**: This state machine tracks the execution lifecycle of a Melody (workflow) from creation through completion, including error handling and checkpointing.

**Key States**:
- **Draft**: Melody being composed in Harmony Board
- **Validating**: DAG validation, cycle detection, type checking
- **Ready**: Validated and ready for execution
- **Queued**: Waiting for Conductor/Pit resources
- **Executing**: Active DAG execution with parallel tasks
- **Paused**: Execution suspended (user request or checkpoint)
- **Completed**: All tasks finished successfully
- **Failed**: Execution failed with errors
- **Cancelled**: User-initiated cancellation

**Execution Modes**:
- **Maestro Mode (RL)**: Conductor generates workflow
- **Manual Mode**: User selects pre-built Melody

```mermaid
stateDiagram-v2
    [*] --> Draft : create_melody()

    Draft --> Validating : submit()
    Validating --> Ready : validation_success
    Validating --> Draft : validation_failed

    Ready --> Queued : execute()
    Queued --> Executing : resources_allocated

    Executing --> Paused : pause() / checkpoint()
    Paused --> Executing : resume()
    Paused --> Cancelled : cancel()

    Executing --> Completed : all_tasks_complete
    Executing --> Failed : task_error
    Executing --> Cancelled : cancel()

    Failed --> Ready : retry()
    Completed --> [*]
    Failed --> [*]
    Cancelled --> [*]

    note right of Ready
        DAG validated
        No cycles detected
        Type-safe connections
    end note

    note right of Executing
        Pit orchestration
        Pool Manager allocation
        Artifact generation
        (Includes: TopoSort → Parallel → Store)
    end note
```

---

## 4. Bootstrap System - Phased Initialization State Machine

**Overview**: The Bootstrap system initializes Symphony IDE through five sequential phases with parallel execution within each phase and rollback capability on failure.

**Key Phases**:
1. **Foundation**: Types, Config, Core initialization
2. **IPC**: Message bus, transport, security setup
3. **Pit**: Pool Manager, DAG Tracker, Artifact Store, Arbitration Engine, Stale Manager
4. **Conductor**: Python RL model, PyO3 bindings, orchestration bridge
5. **UI**: Frontend launch, WebSocket connection, health checks

**Performance**:
- **Cold Start**: 500ms-1s
- **Parallel Phase Execution**: 40-60% faster
- **Rollback**: Automatic on any phase failure

```mermaid
stateDiagram-v2
    [*] --> Initializing
    
    Initializing --> Phase1_Foundation: start()
    Phase1_Foundation --> Phase2_IPC: phase1_complete
    Phase2_IPC --> Phase3_Pit: phase2_complete
    Phase3_Pit --> Phase4_Conductor: phase3_complete
    Phase4_Conductor --> Phase5_UI: phase4_complete
    Phase5_UI --> HealthCheck: phase5_complete
    
    HealthCheck --> Ready: all_probes_pass
    HealthCheck --> RollingBack: health_check_failed
    
    Phase1_Foundation --> RollingBack: phase1_failed
    Phase2_IPC --> RollingBack: phase2_failed
    Phase3_Pit --> RollingBack: phase3_failed
    Phase4_Conductor --> RollingBack: phase4_failed
    Phase5_UI --> RollingBack: phase5_failed
    
    RollingBack --> Failed: rollback_complete
    Ready --> [*]: system_running
    Failed --> [*]: shutdown
    
    state Phase1_Foundation {
        [*] --> LoadTypes
        LoadTypes --> LoadConfig
        LoadConfig --> InitCore
        InitCore --> [*]
    }
    
    state Phase3_Pit {
        [*] --> ParallelInit
        ParallelInit --> PoolManager
        ParallelInit --> DagTracker
        ParallelInit --> ArtifactStore
        ParallelInit --> ArbitrationEngine
        ParallelInit --> StaleManager
        PoolManager --> [*]
        DagTracker --> [*]
        ArtifactStore --> [*]
        ArbitrationEngine --> [*]
        StaleManager --> [*]
        
        note right of ParallelInit
            Parallel initialization
            40-60% faster boot
        end note
    }
    
    note right of Ready
        All systems operational
        Health probes passing
        Ready for user interaction
    end note
```

---

## 5. Artifact Lifecycle State Machine (Stale Manager)

**Overview**: The Stale Manager transitions artifacts through storage tiers based on age and access patterns to optimize storage costs and performance.

**Storage Tiers**:
- **SSD (1-7 days)**: Hot storage, fastest access (0.5-2ms retrieval)
- **HDD (8-30 days)**: Warm storage, moderate access (5-20ms retrieval)
- **Cloud (30+ days)**: Cold storage, archival (100-500ms retrieval)
- **Deleted**: Permanently removed after retention period

**Deduplication**: 20-40% storage savings through content-addressable hashing

```mermaid
stateDiagram-v2
    [*] --> SSD_Hot: artifact_created
    
    SSD_Hot --> HDD_Warm: age > 7_days
    HDD_Warm --> Cloud_Cold: age > 30_days
    Cloud_Cold --> Deleted: age > retention_period
    
    HDD_Warm --> SSD_Hot: access_detected
    Cloud_Cold --> HDD_Warm: access_detected
    
    SSD_Hot --> Deleted: manual_delete
    HDD_Warm --> Deleted: manual_delete
    Cloud_Cold --> Deleted: manual_delete
    
    Deleted --> [*]
    
    note right of SSD_Hot
        1-7 days
        0.5-2ms retrieval
        Frequently accessed
        Content-addressable
    end note
    
    note right of HDD_Warm
        8-30 days
        5-20ms retrieval
        Moderate access
        20-40% dedup savings
    end note
    
    note right of Cloud_Cold
        30+ days
        100-500ms retrieval
        Archival storage
        Cost-optimized
    end note
```

---

## 6. IPC Connection State Machine

**Overview**: Manages inter-process communication connections between Symphony core and extensions/processes with automatic reconnection and health monitoring.

**Key States**:
- **Disconnected**: No active connection
- **Connecting**: Establishing transport (Unix socket/Named pipe)
- **Authenticating**: Process authentication and capability verification
- **Connected**: Active connection, message passing enabled
- **Degraded**: Connection issues, reduced performance
- **Reconnecting**: Attempting to restore connection

**Performance**:
- **Message Latency**: 0.1-0.3ms target
- **Reconnection**: Exponential backoff with max 5 retries
- **Health Checks**: Every 5 seconds

```mermaid
stateDiagram-v2
    [*] --> Disconnected
    
    Disconnected --> Connecting: connect()
    Connecting --> Authenticating: transport_established
    Connecting --> Disconnected: connection_failed
    
    Authenticating --> Connected: auth_success
    Authenticating --> Disconnected: auth_failed
    
    Connected --> Degraded: latency_spike / packet_loss
    Degraded --> Connected: performance_restored
    Degraded --> Reconnecting: health_check_failed
    
    Connected --> Reconnecting: connection_lost
    Reconnecting --> Connecting: retry_attempt
    Reconnecting --> Disconnected: max_retries_exceeded
    
    Connected --> Disconnected: disconnect()
    
    note right of Connected
        0.1-0.3ms latency
        Message passing active
        Rate limiting enforced
        Security validated
    end note
    
    note right of Degraded
        Latency > 1ms
        Packet loss detected
        Auto-recovery attempt
    end note
    
    note left of Reconnecting
        Exponential backoff
        Max 5 retries
        Connection restoration
    end note
```

---

## 7. Conductor Mode State Machine

**Overview**: The Conductor operates in different modes for workflow generation, execution, and reinforcement learning training.

**Key Modes**:
- **Idle**: Waiting for user prompt or training data
- **Analyzing**: Processing user prompt and project context
- **Generating**: Creating Melody DAG using RL model
- **Executing**: Monitoring workflow execution
- **Learning**: Calculating rewards and updating RL policy
- **Training**: Offline batch training on historical data

**RL Components**:
- **Policy Network**: Selects Player extensions and workflow structure
- **Value Function**: Estimates workflow quality
- **Reward Calculation**: Based on execution success, speed, quality

```mermaid
stateDiagram-v2
    [*] --> Idle
    
    Idle --> Analyzing: user_prompt_received
    Idle --> Training: training_mode_enabled
    
    Analyzing --> Generating: context_analyzed
    Generating --> Executing: melody_generated
    
    Executing --> Learning: execution_complete
    Learning --> Idle: policy_updated
    
    Executing --> Idle: execution_failed
    
    Training --> Idle: training_complete
    
    state Generating {
        [*] --> SelectPlayers
        SelectPlayers --> BuildDAG
        BuildDAG --> ValidateWorkflow
        ValidateWorkflow --> [*]
        
        note right of SelectPlayers
            RL policy selection
            Instruments, Operators, Motifs
            Player capability matching
        end note
    }
    
    state Learning {
        [*] --> CalculateReward
        CalculateReward --> UpdatePolicy
        UpdatePolicy --> UpdateValueFunction
        UpdateValueFunction --> [*]
        
        note right of CalculateReward
            Success rate
            Execution time
            Artifact quality
            User feedback
        end note
    }
    
    note right of Executing
        Real-time monitoring
        Progress tracking
        Harmony Board visualization
    end note
```

---

## 8. Extension Installation State Machine

**Overview**: Manages the installation process for extensions from the Marketplace, including dependency resolution, signature verification, and rollback capability.

**Key States**:
- **Browsing**: User browsing Marketplace
- **Downloading**: Fetching extension package
- **Verifying**: Signature and integrity checks
- **ResolvingDeps**: Dependency resolution
- **Installing**: Writing to disk and registering
- **Installed**: Successfully installed
- **RollingBack**: Reverting failed installation
- **Failed**: Installation failed

```mermaid
stateDiagram-v2
    [*] --> Browsing
    
    Browsing --> Downloading: select_extension()
    Downloading --> Verifying: download_complete
    Downloading --> Failed: download_failed
    
    Verifying --> ResolvingDeps: signature_valid
    Verifying --> Failed: signature_invalid
    
    ResolvingDeps --> Installing: dependencies_resolved
    ResolvingDeps --> RollingBack: dependency_conflict
    
    Installing --> Installed: install_success
    Installing --> RollingBack: install_failed
    
    RollingBack --> Failed: rollback_complete
    
    Installed --> [*]
    Failed --> [*]
    
    note right of Verifying
        Signature verification
        Integrity checks
        Malware scanning
    end note
    
    note right of ResolvingDeps
        Semantic versioning
        Conflict detection
        Auto-download deps
    end note
    
    note left of RollingBack
        Cleanup partial install
        Restore previous state
        Detailed error logs
    end note
```

---

## 9. DAG Task Execution State Machine

**Overview**: Individual task node execution within a Melody's DAG, managed by the DAG Tracker.

**Key States**:
- **Pending**: Task waiting for dependencies
- **Ready**: Dependencies satisfied, ready to execute
- **Allocated**: Player extension allocated from Pool Manager
- **Executing**: Task actively running
- **Storing**: Storing output artifacts
- **Completed**: Task finished successfully
- **Failed**: Task execution failed
- **Retrying**: Attempting retry after failure

**Parallel Execution**: Multiple tasks can execute concurrently if dependencies allow

```mermaid
stateDiagram-v2
    [*] --> Pending
    
    Pending --> Ready: dependencies_complete
    Ready --> Allocated: allocate_player()
    Allocated --> Executing: player_ready
    
    Executing --> Storing: execution_success
    Storing --> Completed: artifact_stored
    
    Executing --> Failed: execution_error
    Failed --> Retrying: retry_policy_active
    Retrying --> Allocated: retry_attempt
    Retrying --> Failed: max_retries_exceeded
    
    Completed --> [*]
    Failed --> [*]
    
    state Executing {
        [*] --> ValidateInputs
        ValidateInputs --> RunPlayer
        RunPlayer --> ValidateOutputs
        ValidateOutputs --> [*]
        
        note right of RunPlayer
            Player extension execution
            Resource monitoring
            Timeout enforcement
        end note
    }
    
    note right of Pending
        Waiting for upstream tasks
        Topologically sorted
        Parallel execution ready
    end note
    
    note right of Storing
        Content-addressable hash
        Quality scoring
        Deduplication check
    end note
```

---

## 10. Harmony Board Canvas State Machine

**Overview**: The visual workflow designer's canvas state for user interaction during Melody creation.

**Key States**:
- **Viewing**: Read-only visualization of existing Melody
- **Editing**: User actively modifying workflow
- **Validating**: Real-time validation of connections
- **Saving**: Persisting changes to Polyphony Store
- **Executing**: Monitoring live execution
- **Debugging**: Inspecting execution state and errors

```mermaid
stateDiagram-v2
    [*] --> Viewing
    
    Viewing --> Editing: edit_mode()
    Editing --> Validating: connection_changed / node_added
    Validating --> Editing: validation_success
    Validating --> Editing: validation_failed
    
    Editing --> Saving: save()
    Saving --> Viewing: save_success
    Saving --> Editing: save_failed
    
    Viewing --> Executing: execute_melody()
    Executing --> Debugging: error_detected / pause()
    Debugging --> Executing: resume()
    Executing --> Viewing: execution_complete
    
    state Editing {
        [*] --> DragDrop
        DragDrop --> ConnectNodes
        ConnectNodes --> ConfigureParams
        ConfigureParams --> [*]
        
        note right of DragDrop
            Player node palette
            Instruments, Operators, Motifs
            Visual composition
        end note
    }
    
    state Executing {
        [*] --> MonitorProgress
        MonitorProgress --> VisualizeDataFlow
        VisualizeDataFlow --> TrackMetrics
        TrackMetrics --> [*]
        
        note right of MonitorProgress
            Real-time updates
            Task completion status
            Performance metrics
        end note
    }
    
    note right of Validating
        Type safety checks
        Cycle detection
        Connection validation
        Real-time feedback
    end note
```

---

## Summary

The Symphony IDE state diagrams cover **10 major state machines** across all architectural layers:

1. **Extension Lifecycle (Chambering)** - Complete extension lifecycle from installation to execution
2. **Player Extension (Pool Manager)** - High-performance state management with 50-100ns allocation
3. **Melody Execution Workflow** - Workflow execution from creation to completion
4. **Bootstrap System** - Phased initialization with rollback capability
5. **Artifact Lifecycle (Stale Manager)** - Storage tier transitions for cost optimization
6. **IPC Connection** - Inter-process communication with auto-reconnection
7. **Conductor Mode** - RL-based workflow generation and learning
8. **Extension Installation** - Marketplace installation with dependency resolution
9. **DAG Task Execution** - Individual task execution within workflows
10. **Harmony Board Canvas** - Visual designer interaction states

Each state machine includes:
- **Clear state definitions** with entry/exit conditions
- **Transition triggers** and events
- **Error handling** and recovery paths
- **Performance characteristics** where applicable
- **Nested states** for complex workflows
- **Detailed notes** explaining key behaviors

These state diagrams provide a complete view of Symphony IDE's dynamic behavior and state management across all system components.
