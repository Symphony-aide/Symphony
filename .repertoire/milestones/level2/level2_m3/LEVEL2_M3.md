# M3: The Pit - Infrastructure Extensions - Level 2 Decomposition

> **Parent**: [MILESTONES_LEVEL1.md](../MILESTONES_LEVEL1.md)
> **Duration**: 3-4 months
> **Goal**: Build the five core infrastructure extensions that run in-process

---

## 📋 Overview

M3 implements "The Pit" - Symphony's five infrastructure extensions that form
the unshakable foundation of intelligent orchestration. These run in-process
with the Conductor for microsecond-level performance.

```
M3: The Pit - Infrastructure Extensions
├── M3.1: Pool Manager
│   ├── M3.1.1: Model State Machine
│   ├── M3.1.2: State Transitions
│   ├── M3.1.3: LRU Cache
│   ├── M3.1.4: Predictive Prewarming
│   ├── M3.1.5: Health Monitoring
│   ├── M3.1.6: Graceful Shutdown
│   ├── M3.1.7: Performance Metrics
│   └── M3.1.8: Property Tests
├── M3.2: DAG Tracker
│   ├── M3.2.1: Execution Engine
│   ├── M3.2.2: Node Scheduler
│   ├── M3.2.3: Parallel Execution
│   ├── M3.2.4: Checkpointing
│   ├── M3.2.5: Recovery Strategies
│   ├── M3.2.6: Execution Metrics
│   ├── M3.2.7: Timeout Handling
│   └── M3.2.8: Stress Tests
├── M3.3: Artifact Store
│   ├── M3.3.1: Content-Addressable Storage
│   ├── M3.3.2: Deduplication
│   ├── M3.3.3: Versioning System
│   ├── M3.3.4: Tantivy Search
│   ├── M3.3.5: Quality Scoring
│   ├── M3.3.6: AES-256 Encryption
│   ├── M3.3.7: Relationship Tracking
│   └── M3.3.8: Storage Tests
├── M3.4: Arbitration Engine
│   ├── M3.4.1: Conflict Detection
│   ├── M3.4.2: Resolution Strategies
│   ├── M3.4.3: Priority Routing
│   ├── M3.4.4: Fairness Monitoring
│   ├── M3.4.5: Request Queuing
│   ├── M3.4.6: Audit Log
│   └── M3.4.7: Multi-dimensional Scoring
└── M3.5: Stale Manager
    ├── M3.5.1: Retention Policies
    ├── M3.5.2: Policy Engine
    ├── M3.5.3: Value Scoring
    ├── M3.5.4: Cloud Archival
    ├── M3.5.5: Cleanup Execution
    ├── M3.5.6: Storage Tiers
    └── M3.5.7: Scheduling
```

---

## 🏊 M3.1: Pool Manager - The Resource Maestro

**Crate**: `symphony-pool-manager`
**Duration**: 4 weeks
**Dependencies**: M1.3 (IPC Bus), M4.4 (Extension Loader)


### M3.1.1: Model State Machine (3 days)

**Goal**: Define AI model lifecycle states and transitions

**Deliverables**:
```rust
// src/lifecycle.rs

/// Model lifecycle states
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum ModelState {
    /// Not loaded, no resources allocated
    Cold,
    /// Loading into memory, initializing
    Warming,
    /// Ready for inference, fully loaded
    Hot,
    /// Marked for unload, finishing requests
    Cooling,
    /// Error state, needs recovery
    Failed,
}

/// Model lifecycle tracking
pub struct ModelLifecycle {
    pub model_id: ModelId,
    pub current_state: ModelState,
    pub last_transition: Instant,
    pub transition_count: u64,
    pub failure_count: u32,
    pub last_used: Option<Instant>,
    pub total_invocations: u64,
}

impl ModelLifecycle {
    pub fn new(model_id: ModelId) -> Self;
    
    /// Attempt state transition
    pub fn transition_to(&mut self, new_state: ModelState) -> Result<(), LifecycleError>;
    
    /// Check if transition is valid
    pub fn can_transition_to(&self, target: ModelState) -> bool;
    
    /// Get time in current state
    pub fn time_in_state(&self) -> Duration;
    
    /// Record usage
    pub fn record_usage(&mut self);
    
    /// Record failure
    pub fn record_failure(&mut self);
}

/// Valid state transitions:
/// Cold -> Warming
/// Warming -> Hot | Failed
/// Hot -> Cooling | Failed
/// Cooling -> Cold | Failed
/// Failed -> Cold (recovery)
```

**Tasks**:
- [ ] Define `ModelState` enum with all states
- [ ] Implement `ModelLifecycle` struct
- [ ] Define valid state transitions
- [ ] Add transition validation
- [ ] Implement state timing tracking
- [ ] Add failure count tracking
- [ ] Add usage tracking
- [ ] Write unit tests for all transitions

**Acceptance Criteria**:
- ✅ Invalid transitions rejected
- ✅ State timing accurate to milliseconds
- ✅ Failure recovery works correctly

---

### M3.1.2: State Transitions (3 days)

**Goal**: Implement atomic state transitions with validation

**Deliverables**:
```rust
// src/transitions.rs

/// State transition record
#[derive(Debug, Clone)]
pub struct StateTransition {
    pub from: ModelState,
    pub to: ModelState,
    pub timestamp: Instant,
    pub reason: TransitionReason,
    pub duration: Duration,
    pub metadata: HashMap<String, Value>,
}

/// Reasons for state transitions
#[derive(Debug, Clone)]
pub enum TransitionReason {
    UserRequest,
    AutomaticTimeout,
    HealthCheckFailure,
    ResourcePressure,
    PredictivePrewarm,
    ScheduledCooldown,
    ErrorRecovery,
}

/// State transition manager
pub struct TransitionManager {
    lifecycles: HashMap<ModelId, ModelLifecycle>,
    history: Vec<StateTransition>,
    listeners: Vec<Box<dyn TransitionListener>>,
}

#[async_trait]
pub trait TransitionListener: Send + Sync {
    async fn on_transition(&self, transition: &StateTransition);
}

impl TransitionManager {
    pub fn new() -> Self;
    
    /// Execute state transition
    pub async fn transition(
        &mut self,
        model_id: &ModelId,
        to: ModelState,
        reason: TransitionReason,
    ) -> Result<StateTransition, TransitionError>;
    
    /// Get transition history for model
    pub fn history(&self, model_id: &ModelId) -> Vec<&StateTransition>;
    
    /// Add transition listener
    pub fn add_listener(&mut self, listener: Box<dyn TransitionListener>);
    
    /// Check if model is in stable state
    pub fn is_stable(&self, model_id: &ModelId) -> bool;
}
```

**Tasks**:
- [ ] Define `StateTransition` struct
- [ ] Define `TransitionReason` enum
- [ ] Implement `TransitionManager`
- [ ] Add transition history tracking
- [ ] Implement listener pattern
- [ ] Add concurrent access protection (RwLock)
- [ ] Write concurrency tests

**Acceptance Criteria**:
- ✅ Transitions are atomic and thread-safe
- ✅ History preserved for debugging
- ✅ No race conditions under load

---

### M3.1.3: LRU Cache (4 days)

**Goal**: Efficient caching for hot models with LRU eviction

**Deliverables**:
```rust
// src/cache.rs

use lru::LruCache;
use std::num::NonZeroUsize;

/// Cached model entry
pub struct CachedModel {
    pub model: Box<dyn Model>,
    pub lifecycle: ModelLifecycle,
    pub memory_usage: u64,
    pub last_access: Instant,
    pub access_count: u64,
    pub load_time: Duration,
}

/// Model cache with LRU eviction
pub struct ModelCache {
    cache: LruCache<ModelId, CachedModel>,
    max_memory: u64,
    current_memory: AtomicU64,
    metrics: CacheMetrics,
}

/// Cache metrics
#[derive(Debug, Default)]
pub struct CacheMetrics {
    pub hits: AtomicU64,
    pub misses: AtomicU64,
    pub evictions: AtomicU64,
    pub total_load_time: AtomicU64,
}

impl ModelCache {
    pub fn new(capacity: usize, max_memory: u64) -> Self;
    
    /// Get model from cache
    pub fn get(&mut self, id: &ModelId) -> Option<&mut CachedModel>;
    
    /// Insert model into cache
    pub fn insert(&mut self, id: ModelId, model: CachedModel) -> Result<(), CacheError>;
    
    /// Evict least recently used model
    pub fn evict_lru(&mut self) -> Option<(ModelId, CachedModel)>;
    
    /// Evict models until memory target met
    pub fn evict_to_memory(&mut self, target: u64) -> Vec<(ModelId, CachedModel)>;
    
    /// Get current memory usage
    pub fn memory_usage(&self) -> u64;
    
    /// Get cache hit rate
    pub fn hit_rate(&self) -> f64;
    
    /// Get cache metrics
    pub fn metrics(&self) -> &CacheMetrics;
}
```

**Tasks**:
- [ ] Implement LRU cache with `lru` crate
- [ ] Add memory usage tracking
- [ ] Implement memory-based eviction
- [ ] Add cache metrics (hit rate, evictions)
- [ ] Implement cache warming strategies
- [ ] Add cache persistence (optional)
- [ ] Write performance benchmarks
- [ ] Test with 1000+ models

**Acceptance Criteria**:
- ✅ Cache hit allocation <100μs
- ✅ Memory usage stays within limits
- ✅ LRU eviction works correctly
- ✅ Hit rate >80% under typical load

---

### M3.1.4: Predictive Prewarming (5 days)

**Goal**: Machine learning-based model prewarming

**Deliverables**:
```rust
// src/prewarming.rs

/// Usage pattern for prediction
#[derive(Debug, Clone)]
pub struct UsagePattern {
    pub model_id: ModelId,
    pub timestamp: DateTime<Utc>,
    pub workflow_id: Option<WorkflowId>,
    pub user_id: Option<String>,
    pub duration: Duration,
}

/// Prediction context
pub struct PredictionContext {
    pub current_time: DateTime<Utc>,
    pub active_workflows: Vec<WorkflowId>,
    pub recent_usage: Vec<UsagePattern>,
    pub user_context: Option<UserContext>,
}

/// Usage predictor trait
#[async_trait]
pub trait UsagePredictor: Send + Sync {
    /// Predict next models to be used
    async fn predict(&self, context: &PredictionContext) -> Vec<(ModelId, f64)>;
    
    /// Update predictor with new usage data
    fn update(&mut self, usage: &UsagePattern);
}

/// Time-based predictor
pub struct TimeBasedPredictor {
    patterns: HashMap<ModelId, Vec<UsagePattern>>,
}

/// Workflow-based predictor
pub struct WorkflowPredictor {
    workflow_models: HashMap<WorkflowId, Vec<ModelId>>,
}

/// Prewarming engine
pub struct PrewarmingEngine {
    predictors: Vec<Box<dyn UsagePredictor>>,
    scheduler: PrewarmScheduler,
    cache: Arc<RwLock<ModelCache>>,
}

impl PrewarmingEngine {
    pub fn new(cache: Arc<RwLock<ModelCache>>) -> Self;
    
    /// Predict and prewarm models
    pub async fn predict_and_prewarm(&mut self) -> Result<Vec<ModelId>, PrewarmError>;
    
    /// Record usage for learning
    pub fn record_usage(&mut self, usage: UsagePattern);
    
    /// Get prewarming statistics
    pub fn stats(&self) -> PrewarmingStats;
}

/// Prewarming statistics
#[derive(Debug, Default)]
pub struct PrewarmingStats {
    pub predictions_made: u64,
    pub correct_predictions: u64,
    pub prewarmed_models: u64,
    pub cold_starts_avoided: u64,
}
```

**Tasks**:
- [ ] Define `UsagePattern` struct
- [ ] Implement `UsagePredictor` trait
- [ ] Create time-based predictor
- [ ] Create workflow-based predictor
- [ ] Implement `PrewarmingEngine`
- [ ] Add prediction accuracy metrics
- [ ] Implement adaptive learning
- [ ] Write prediction tests
- [ ] Benchmark prediction performance

**Acceptance Criteria**:
- ✅ Prewarming reduces cold starts by 50%+
- ✅ Prediction accuracy >70%
- ✅ Prediction latency <1ms
- ✅ Adapts to changing usage patterns

---

### M3.1.5: Health Monitoring (3 days)

**Goal**: Continuous health monitoring for all models

**Deliverables**:
```rust
// src/health.rs

/// Health status
#[derive(Debug, Clone)]
pub enum HealthStatus {
    Healthy,
    Degraded { reason: String, since: Instant },
    Unhealthy { error: String, since: Instant },
    Unknown,
}

/// Health check trait
#[async_trait]
pub trait HealthCheck: Send + Sync {
    async fn check(&self, model: &dyn Model) -> HealthStatus;
    fn name(&self) -> &str;
    fn interval(&self) -> Duration;
}

/// Response time health check
pub struct ResponseTimeCheck {
    pub max_latency: Duration,
    pub test_input: Value,
}

/// Memory usage health check
pub struct MemoryUsageCheck {
    pub max_memory: u64,
    pub warning_threshold: f64,
}

/// Error rate health check
pub struct ErrorRateCheck {
    pub max_error_rate: f64,
    pub window: Duration,
}

/// Health monitor
pub struct HealthMonitor {
    checks: Vec<Box<dyn HealthCheck>>,
    results: HashMap<ModelId, Vec<HealthResult>>,
    failure_threshold: u32,
}

/// Health check result
#[derive(Debug, Clone)]
pub struct HealthResult {
    pub check_name: String,
    pub status: HealthStatus,
    pub timestamp: Instant,
    pub duration: Duration,
}

impl HealthMonitor {
    pub fn new(failure_threshold: u32) -> Self;
    
    /// Add health check
    pub fn add_check(&mut self, check: Box<dyn HealthCheck>);
    
    /// Run all health checks for a model
    pub async fn check_model(&mut self, model_id: &ModelId, model: &dyn Model) -> HealthStatus;
    
    /// Get health history
    pub fn history(&self, model_id: &ModelId) -> &[HealthResult];
    
    /// Get overall health status
    pub fn overall_status(&self, model_id: &ModelId) -> HealthStatus;
}
```

**Tasks**:
- [ ] Define `HealthStatus` enum
- [ ] Define `HealthCheck` trait
- [ ] Implement built-in health checks
- [ ] Implement `HealthMonitor`
- [ ] Add periodic health monitoring
- [ ] Implement failure threshold logic
- [ ] Add health status caching
- [ ] Write health check tests

**Acceptance Criteria**:
- ✅ Health checks detect failures within 1s
- ✅ False positive rate <5%
- ✅ Health monitoring overhead <1% CPU

---

### M3.1.6-M3.1.8: Shutdown, Metrics, Tests (5 days)

**Tasks**:
- [ ] M3.1.6: Implement graceful model shutdown
  - Drain pending requests
  - Save state if needed
  - Release resources
- [ ] M3.1.7: Implement performance metrics
  - Latency histograms
  - Throughput counters
  - Error rates
- [ ] M3.1.8: Write property tests
  - State machine invariants
  - Cache consistency
  - Concurrent access safety

---

## 📊 M3.2: DAG Tracker - The Execution Engine

**Crate**: `symphony-dag-tracker`
**Duration**: 4 weeks
**Dependencies**: M5.2 (DAG Validation), M3.1 (Pool Manager)


### M3.2.1: Execution Engine (4 days)

**Goal**: Core workflow execution with node runners

**Deliverables**:
```rust
// src/executor.rs

/// Execution engine for workflows
pub struct ExecutionEngine {
    scheduler: NodeScheduler,
    runners: HashMap<NodeType, Box<dyn NodeRunner>>,
    checkpointer: Checkpointer,
    pool_manager: Arc<PoolManager>,
    metrics: ExecutionMetrics,
}

/// Node runner trait
#[async_trait]
pub trait NodeRunner: Send + Sync {
    async fn run(&self, node: &Node, inputs: NodeInputs) -> Result<NodeOutputs, NodeError>;
    fn node_type(&self) -> NodeType;
    fn supports_streaming(&self) -> bool;
}

/// Node inputs
#[derive(Debug, Clone)]
pub struct NodeInputs {
    pub data: HashMap<String, Value>,
    pub context: ExecutionContext,
    pub parameters: HashMap<String, Value>,
}

/// Node outputs
#[derive(Debug, Clone)]
pub struct NodeOutputs {
    pub data: HashMap<String, Value>,
    pub metadata: NodeMetadata,
    pub duration: Duration,
}

/// Instrument node runner
pub struct InstrumentRunner {
    pool_manager: Arc<PoolManager>,
}

/// Operator node runner
pub struct OperatorRunner {
    operators: HashMap<String, Box<dyn Operator>>,
}

/// Control node runner
pub struct ControlRunner;

impl ExecutionEngine {
    pub fn new(pool_manager: Arc<PoolManager>) -> Self;
    
    /// Execute a complete workflow
    pub async fn execute_workflow(&self, workflow: &Workflow) -> Result<WorkflowResult, ExecutionError>;
    
    /// Execute a single node
    pub async fn execute_node(&self, node: &Node, inputs: NodeInputs) -> Result<NodeOutputs, NodeError>;
    
    /// Get execution status
    pub fn status(&self, execution_id: &ExecutionId) -> Option<ExecutionStatus>;
    
    /// Cancel execution
    pub async fn cancel(&self, execution_id: &ExecutionId) -> Result<(), ExecutionError>;
}
```

**Tasks**:
- [ ] Implement `ExecutionEngine` core
- [ ] Define `NodeRunner` trait
- [ ] Implement `InstrumentRunner`
- [ ] Implement `OperatorRunner`
- [ ] Implement `ControlRunner`
- [ ] Add execution context management
- [ ] Implement node input/output handling
- [ ] Write execution tests

**Acceptance Criteria**:
- ✅ Executes simple workflows correctly
- ✅ Node failures handled gracefully
- ✅ Execution status accurate in real-time

---

### M3.2.2: Node Scheduler (3 days)

**Goal**: Intelligent scheduling of workflow nodes

**Deliverables**:
```rust
// src/scheduler.rs

use std::collections::BinaryHeap;

/// Node scheduler
pub struct NodeScheduler {
    ready_queue: BinaryHeap<ScheduledNode>,
    dependency_tracker: DependencyTracker,
    resource_manager: ResourceManager,
}

/// Scheduled node with priority
#[derive(Debug, Clone)]
pub struct ScheduledNode {
    pub node_id: NodeId,
    pub priority: i32,
    pub estimated_duration: Duration,
    pub resource_requirements: ResourceRequirements,
}

impl Ord for ScheduledNode {
    fn cmp(&self, other: &Self) -> Ordering {
        other.priority.cmp(&self.priority) // Higher priority first
    }
}

/// Scheduling decision
#[derive(Debug)]
pub struct SchedulingDecision {
    pub node_id: NodeId,
    pub scheduled_at: Instant,
    pub assigned_resources: ResourceAllocation,
    pub estimated_completion: Instant,
}

impl NodeScheduler {
    pub fn new() -> Self;
    
    /// Initialize scheduler with workflow
    pub fn initialize(&mut self, workflow: &Workflow);
    
    /// Get next node to execute
    pub fn schedule_next(&mut self) -> Option<SchedulingDecision>;
    
    /// Mark node as completed
    pub fn mark_completed(&mut self, node_id: &NodeId, result: &NodeResult);
    
    /// Mark node as failed
    pub fn mark_failed(&mut self, node_id: &NodeId, error: &NodeError);
    
    /// Get all ready nodes
    pub fn ready_nodes(&self) -> Vec<&ScheduledNode>;
    
    /// Get estimated completion time
    pub fn estimated_completion(&self) -> Option<Instant>;
}
```

**Tasks**:
- [ ] Implement dependency-aware scheduling
- [ ] Add priority-based ordering
- [ ] Implement resource-aware scheduling
- [ ] Add load balancing across workers
- [ ] Implement scheduling metrics
- [ ] Write scheduling tests

**Acceptance Criteria**:
- ✅ Respects all dependencies
- ✅ Maximizes parallelism
- ✅ Balances resource usage

---

### M3.2.3: Parallel Execution (4 days)

**Goal**: Execute independent nodes concurrently

**Deliverables**:
```rust
// src/parallel.rs

use tokio::task::JoinSet;

/// Parallel executor
pub struct ParallelExecutor {
    max_concurrency: usize,
    active_tasks: AtomicUsize,
    semaphore: Semaphore,
}

/// Execution task
pub struct ExecutionTask {
    pub node_id: NodeId,
    pub runner: Arc<dyn NodeRunner>,
    pub inputs: NodeInputs,
}

/// Execution result
pub struct ExecutionResult {
    pub node_id: NodeId,
    pub result: Result<NodeOutputs, NodeError>,
    pub duration: Duration,
}

impl ParallelExecutor {
    pub fn new(max_concurrency: usize) -> Self;
    
    /// Execute nodes in parallel
    pub async fn execute_parallel(&self, tasks: Vec<ExecutionTask>) -> Vec<ExecutionResult>;
    
    /// Execute single task
    pub async fn execute_one(&self, task: ExecutionTask) -> ExecutionResult;
    
    /// Get current concurrency
    pub fn current_concurrency(&self) -> usize;
    
    /// Adjust max concurrency
    pub fn set_max_concurrency(&self, max: usize);
}

/// Worker pool for execution
pub struct WorkerPool {
    workers: Vec<Worker>,
    task_queue: crossbeam_channel::Sender<ExecutionTask>,
    result_queue: crossbeam_channel::Receiver<ExecutionResult>,
}

impl WorkerPool {
    pub fn new(num_workers: usize) -> Self;
    pub fn submit(&self, task: ExecutionTask);
    pub fn results(&self) -> impl Iterator<Item = ExecutionResult>;
    pub fn shutdown(&self);
}
```

**Tasks**:
- [ ] Implement `ParallelExecutor` with tokio
- [ ] Add semaphore-based concurrency control
- [ ] Implement `WorkerPool` for CPU-bound tasks
- [ ] Add dynamic concurrency adjustment
- [ ] Implement backpressure handling
- [ ] Write parallel execution tests
- [ ] Benchmark with 1000+ concurrent nodes

**Acceptance Criteria**:
- ✅ Utilizes all available CPU cores
- ✅ Handles 1000+ concurrent nodes
- ✅ Graceful degradation under load

---

### M3.2.4: Checkpointing (3 days)

**Goal**: Periodic state snapshots for recovery

**Deliverables**:
```rust
// src/checkpoint.rs

/// Checkpoint data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Checkpoint {
    pub id: CheckpointId,
    pub execution_id: ExecutionId,
    pub timestamp: DateTime<Utc>,
    pub completed_nodes: Vec<NodeId>,
    pub node_outputs: HashMap<NodeId, NodeOutputs>,
    pub execution_state: ExecutionState,
}

/// Checkpointer
pub struct Checkpointer {
    storage: Box<dyn CheckpointStorage>,
    interval: Duration,
    max_checkpoints: usize,
}

#[async_trait]
pub trait CheckpointStorage: Send + Sync {
    async fn save(&self, checkpoint: &Checkpoint) -> Result<(), CheckpointError>;
    async fn load(&self, id: &CheckpointId) -> Result<Option<Checkpoint>, CheckpointError>;
    async fn latest(&self, execution_id: &ExecutionId) -> Result<Option<Checkpoint>, CheckpointError>;
    async fn list(&self, execution_id: &ExecutionId) -> Result<Vec<CheckpointId>, CheckpointError>;
    async fn delete(&self, id: &CheckpointId) -> Result<(), CheckpointError>;
}

impl Checkpointer {
    pub fn new(storage: Box<dyn CheckpointStorage>, interval: Duration) -> Self;
    
    /// Create checkpoint
    pub async fn checkpoint(&self, state: &ExecutionState) -> Result<Checkpoint, CheckpointError>;
    
    /// Restore from checkpoint
    pub async fn restore(&self, id: &CheckpointId) -> Result<ExecutionState, CheckpointError>;
    
    /// Restore from latest checkpoint
    pub async fn restore_latest(&self, execution_id: &ExecutionId) -> Result<Option<ExecutionState>, CheckpointError>;
    
    /// Cleanup old checkpoints
    pub async fn cleanup(&self, execution_id: &ExecutionId) -> Result<usize, CheckpointError>;
}
```

**Tasks**:
- [ ] Define `Checkpoint` struct
- [ ] Implement `CheckpointStorage` trait
- [ ] Implement file-based storage
- [ ] Add periodic checkpointing
- [ ] Implement checkpoint restoration
- [ ] Add checkpoint cleanup
- [ ] Write checkpoint tests

**Acceptance Criteria**:
- ✅ Checkpoints created reliably
- ✅ Restoration works correctly
- ✅ Cleanup prevents storage bloat

---

### M3.2.5: Recovery Strategies (3 days)

**Goal**: Implement failure recovery strategies

**Deliverables**:
```rust
// src/recovery.rs

/// Recovery strategy
#[derive(Debug, Clone)]
pub enum RecoveryStrategy {
    /// Retry the failed node
    Retry { max_attempts: u32, backoff: BackoffStrategy },
    /// Use fallback node/value
    Fallback { fallback_node: Option<NodeId>, fallback_value: Option<Value> },
    /// Skip the failed node
    Skip { default_output: Option<Value> },
    /// Fail the entire workflow
    Fail,
    /// Restart from checkpoint
    RestartFromCheckpoint,
}

/// Backoff strategy
#[derive(Debug, Clone)]
pub enum BackoffStrategy {
    Constant(Duration),
    Linear { initial: Duration, increment: Duration },
    Exponential { initial: Duration, multiplier: f64, max: Duration },
}

/// Recovery manager
pub struct RecoveryManager {
    strategies: HashMap<NodeId, RecoveryStrategy>,
    default_strategy: RecoveryStrategy,
    checkpointer: Arc<Checkpointer>,
}

impl RecoveryManager {
    pub fn new(checkpointer: Arc<Checkpointer>) -> Self;
    
    /// Handle node failure
    pub async fn handle_failure(
        &self,
        node_id: &NodeId,
        error: &NodeError,
        attempt: u32,
    ) -> RecoveryAction;
    
    /// Set strategy for node
    pub fn set_strategy(&mut self, node_id: NodeId, strategy: RecoveryStrategy);
    
    /// Set default strategy
    pub fn set_default_strategy(&mut self, strategy: RecoveryStrategy);
}

/// Recovery action to take
#[derive(Debug)]
pub enum RecoveryAction {
    Retry { delay: Duration },
    UseFallback { value: Value },
    Skip,
    Fail { error: ExecutionError },
    RestartFromCheckpoint { checkpoint_id: CheckpointId },
}
```

**Tasks**:
- [ ] Define `RecoveryStrategy` enum
- [ ] Implement `BackoffStrategy`
- [ ] Implement `RecoveryManager`
- [ ] Add per-node strategy configuration
- [ ] Implement retry logic
- [ ] Implement fallback logic
- [ ] Write recovery tests

**Acceptance Criteria**:
- ✅ Retries work with backoff
- ✅ Fallbacks provide graceful degradation
- ✅ Checkpoint recovery works

---

### M3.2.6-M3.2.8: Metrics, Timeouts, Tests (5 days)

**Tasks**:
- [ ] M3.2.6: Implement execution metrics
  - Node duration histograms
  - Throughput counters
  - Error rates by node type
- [ ] M3.2.7: Implement timeout handling
  - Per-node timeouts
  - Workflow-level timeouts
  - Graceful timeout handling
- [ ] M3.2.8: Write stress tests
  - 10,000-node workflows
  - High concurrency
  - Failure injection

---

## 📦 M3.3: Artifact Store - The Institutional Memory

**Crate**: `symphony-artifact-store`
**Duration**: 4 weeks
**Dependencies**: M1.3 (IPC Bus)


### M3.3.1: Content-Addressable Storage (4 days)

**Goal**: Efficient storage with SHA-256 content addressing

**Deliverables**:
```rust
// src/storage.rs

use sha2::{Sha256, Digest};

/// Content hash (SHA-256)
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct ContentHash(pub [u8; 32]);

impl ContentHash {
    pub fn compute(data: &[u8]) -> Self {
        let mut hasher = Sha256::new();
        hasher.update(data);
        ContentHash(hasher.finalize().into())
    }
    
    pub fn to_hex(&self) -> String;
    pub fn from_hex(s: &str) -> Result<Self, ParseError>;
}

/// Artifact metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArtifactMetadata {
    pub content_type: String,
    pub size: u64,
    pub created_at: DateTime<Utc>,
    pub created_by: Option<String>,
    pub tags: Vec<String>,
    pub custom: HashMap<String, Value>,
}

/// Stored artifact
#[derive(Debug, Clone)]
pub struct Artifact {
    pub hash: ContentHash,
    pub metadata: ArtifactMetadata,
}

/// Content-addressable store
pub struct ContentAddressableStore {
    backend: Box<dyn StorageBackend>,
    index: ArtifactIndex,
    cache: LruCache<ContentHash, Arc<Vec<u8>>>,
}

#[async_trait]
pub trait StorageBackend: Send + Sync {
    async fn put(&self, hash: &ContentHash, data: &[u8]) -> Result<(), StorageError>;
    async fn get(&self, hash: &ContentHash) -> Result<Option<Vec<u8>>, StorageError>;
    async fn exists(&self, hash: &ContentHash) -> Result<bool, StorageError>;
    async fn delete(&self, hash: &ContentHash) -> Result<(), StorageError>;
    async fn size(&self, hash: &ContentHash) -> Result<Option<u64>, StorageError>;
}

impl ContentAddressableStore {
    pub fn new(backend: Box<dyn StorageBackend>) -> Self;
    
    /// Store content and return hash
    pub async fn store(&self, content: &[u8], metadata: ArtifactMetadata) -> Result<ContentHash, StoreError>;
    
    /// Retrieve content by hash
    pub async fn retrieve(&self, hash: &ContentHash) -> Result<Option<Vec<u8>>, StoreError>;
    
    /// Get artifact metadata
    pub async fn metadata(&self, hash: &ContentHash) -> Result<Option<ArtifactMetadata>, StoreError>;
    
    /// Check if content exists
    pub async fn exists(&self, hash: &ContentHash) -> Result<bool, StoreError>;
    
    /// Delete content
    pub async fn delete(&self, hash: &ContentHash) -> Result<(), StoreError>;
}
```

**Tasks**:
- [ ] Implement `ContentHash` with SHA-256
- [ ] Define `ArtifactMetadata` struct
- [ ] Implement `StorageBackend` trait
- [ ] Implement filesystem backend
- [ ] Implement `ContentAddressableStore`
- [ ] Add in-memory cache layer
- [ ] Write storage tests
- [ ] Benchmark storage performance

**Acceptance Criteria**:
- ✅ Store latency <5ms
- ✅ Retrieve latency <2ms
- ✅ Content integrity guaranteed
- ✅ Handles files up to 1GB

---

### M3.3.2: Deduplication (2 days)

**Goal**: Automatic duplicate detection and storage optimization

**Deliverables**:
```rust
// src/dedup.rs

/// Deduplication statistics
#[derive(Debug, Default)]
pub struct DedupStats {
    pub total_stored: u64,
    pub unique_stored: u64,
    pub bytes_saved: u64,
    pub dedup_ratio: f64,
}

impl ContentAddressableStore {
    /// Store with deduplication (returns existing hash if duplicate)
    pub async fn store_dedup(&self, content: &[u8], metadata: ArtifactMetadata) -> Result<(ContentHash, bool), StoreError> {
        let hash = ContentHash::compute(content);
        
        if self.exists(&hash).await? {
            // Content already exists, just update metadata if needed
            return Ok((hash, false)); // false = not newly stored
        }
        
        self.store(content, metadata).await?;
        Ok((hash, true)) // true = newly stored
    }
    
    /// Get deduplication statistics
    pub fn dedup_stats(&self) -> DedupStats;
}
```

**Tasks**:
- [ ] Implement deduplication logic
- [ ] Add dedup statistics tracking
- [ ] Handle metadata merging for duplicates
- [ ] Write dedup tests

**Acceptance Criteria**:
- ✅ Duplicates detected correctly
- ✅ Storage savings tracked
- ✅ No data loss on dedup

---

### M3.3.3: Versioning System (3 days)

**Goal**: Track artifact versions and history

**Deliverables**:
```rust
// src/versioning.rs

/// Artifact version
#[derive(Debug, Clone)]
pub struct ArtifactVersion {
    pub version: u64,
    pub hash: ContentHash,
    pub created_at: DateTime<Utc>,
    pub message: Option<String>,
    pub parent: Option<ContentHash>,
}

/// Versioned artifact
pub struct VersionedArtifact {
    pub id: ArtifactId,
    pub name: String,
    pub current_version: u64,
    pub versions: Vec<ArtifactVersion>,
}

/// Version manager
pub struct VersionManager {
    store: Arc<ContentAddressableStore>,
    versions: HashMap<ArtifactId, VersionedArtifact>,
}

impl VersionManager {
    pub fn new(store: Arc<ContentAddressableStore>) -> Self;
    
    /// Create new version
    pub async fn create_version(
        &mut self,
        artifact_id: &ArtifactId,
        content: &[u8],
        message: Option<String>,
    ) -> Result<ArtifactVersion, VersionError>;
    
    /// Get specific version
    pub async fn get_version(&self, artifact_id: &ArtifactId, version: u64) -> Result<Option<Vec<u8>>, VersionError>;
    
    /// Get latest version
    pub async fn get_latest(&self, artifact_id: &ArtifactId) -> Result<Option<Vec<u8>>, VersionError>;
    
    /// List versions
    pub fn list_versions(&self, artifact_id: &ArtifactId) -> Vec<&ArtifactVersion>;
    
    /// Diff between versions
    pub async fn diff(&self, artifact_id: &ArtifactId, v1: u64, v2: u64) -> Result<Diff, VersionError>;
}
```

**Tasks**:
- [ ] Define `ArtifactVersion` struct
- [ ] Implement `VersionManager`
- [ ] Add version creation
- [ ] Implement version retrieval
- [ ] Add version diffing
- [ ] Write versioning tests

**Acceptance Criteria**:
- ✅ Versions tracked correctly
- ✅ History preserved
- ✅ Diff works for text artifacts

---

### M3.3.4: Tantivy Search (4 days)

**Goal**: Full-text search integration

**Deliverables**:
```rust
// src/search.rs

use tantivy::{Index, IndexWriter, IndexReader};

/// Search index
pub struct ArtifactSearchIndex {
    index: Index,
    writer: IndexWriter,
    reader: IndexReader,
}

/// Search query
#[derive(Debug, Clone)]
pub struct SearchQuery {
    pub text: Option<String>,
    pub tags: Vec<String>,
    pub content_type: Option<String>,
    pub created_after: Option<DateTime<Utc>>,
    pub created_before: Option<DateTime<Utc>>,
    pub limit: usize,
    pub offset: usize,
}

/// Search result
#[derive(Debug, Clone)]
pub struct SearchResult {
    pub hash: ContentHash,
    pub score: f32,
    pub highlights: Vec<String>,
    pub metadata: ArtifactMetadata,
}

impl ArtifactSearchIndex {
    pub fn new(index_path: &Path) -> Result<Self, SearchError>;
    
    /// Index an artifact
    pub fn index_artifact(&mut self, hash: &ContentHash, content: &[u8], metadata: &ArtifactMetadata) -> Result<(), SearchError>;
    
    /// Search artifacts
    pub fn search(&self, query: &SearchQuery) -> Result<Vec<SearchResult>, SearchError>;
    
    /// Remove from index
    pub fn remove(&mut self, hash: &ContentHash) -> Result<(), SearchError>;
    
    /// Commit pending changes
    pub fn commit(&mut self) -> Result<(), SearchError>;
}
```

**Tasks**:
- [ ] Set up Tantivy index
- [ ] Define index schema
- [ ] Implement artifact indexing
- [ ] Implement search queries
- [ ] Add highlighting
- [ ] Add faceted search
- [ ] Write search tests
- [ ] Benchmark search performance

**Acceptance Criteria**:
- ✅ Search returns results in <100ms
- ✅ Full-text search works
- ✅ Filtering by metadata works

---

### M3.3.5-M3.3.8: Quality, Encryption, Relationships, Tests (7 days)

**Tasks**:
- [ ] M3.3.5: Implement quality scoring
  - Structure validation
  - Semantic analysis
  - Utility scoring based on usage
- [ ] M3.3.6: Implement AES-256 encryption
  - Encryption at rest
  - Key management
  - Transparent encryption/decryption
- [ ] M3.3.7: Implement relationship tracking
  - Parent-child relationships
  - Derivation tracking
  - Dependency graphs
- [ ] M3.3.8: Write storage property tests
  - Round-trip consistency
  - Concurrent access safety
  - Encryption correctness

---

## ⚖️ M3.4: Arbitration Engine - The Wise Judge

**Crate**: `symphony-arbitration-engine`
**Duration**: 3 weeks
**Dependencies**: M3.1 (Pool Manager), M3.3 (Artifact Store)


### M3.4.1: Conflict Detection (2 days)

**Goal**: Detect resource conflicts between requests

**Deliverables**:
```rust
// src/conflicts.rs

/// Resource conflict types
#[derive(Debug, Clone)]
pub enum ResourceConflict {
    /// Multiple requests want the same model
    ModelContention {
        model_id: ModelId,
        requesters: Vec<RequestId>,
    },
    /// Not enough memory for all requests
    MemoryPressure {
        available: u64,
        requested: u64,
        requests: Vec<RequestId>,
    },
    /// CPU saturation
    CpuSaturation {
        utilization: f64,
        threshold: f64,
        requests: Vec<RequestId>,
    },
    /// Cost limit exceeded
    CostLimit {
        current: f64,
        limit: f64,
        requests: Vec<RequestId>,
    },
}

/// Conflict detector
pub struct ConflictDetector {
    resource_tracker: ResourceTracker,
    thresholds: ConflictThresholds,
}

/// Conflict thresholds
#[derive(Debug, Clone)]
pub struct ConflictThresholds {
    pub memory_threshold: f64,  // 0.0-1.0
    pub cpu_threshold: f64,
    pub cost_threshold: Option<f64>,
}

impl ConflictDetector {
    pub fn new(thresholds: ConflictThresholds) -> Self;
    
    /// Detect conflicts for pending requests
    pub fn detect(&self, requests: &[ResourceRequest]) -> Vec<ResourceConflict>;
    
    /// Check if request would cause conflict
    pub fn would_conflict(&self, request: &ResourceRequest) -> Option<ResourceConflict>;
    
    /// Update resource state
    pub fn update_resources(&mut self, update: ResourceUpdate);
}
```

**Tasks**:
- [ ] Define `ResourceConflict` enum
- [ ] Implement `ConflictDetector`
- [ ] Add model contention detection
- [ ] Add memory pressure detection
- [ ] Add CPU saturation detection
- [ ] Add cost limit detection
- [ ] Write conflict detection tests

**Acceptance Criteria**:
- ✅ All conflict types detected
- ✅ Detection latency <1ms
- ✅ No false negatives

---

### M3.4.2: Resolution Strategies (3 days)

**Goal**: Implement conflict resolution strategies

**Deliverables**:
```rust
// src/resolution.rs

/// Resolution strategy
#[derive(Debug, Clone)]
pub enum ResolutionStrategy {
    /// Highest priority wins
    Priority,
    /// Fair rotation
    RoundRobin,
    /// Find win-win solutions
    Collaborative,
    /// First-come-first-served
    Queue,
    /// Weighted random selection
    WeightedRandom,
}

/// Resolution decision
#[derive(Debug, Clone)]
pub struct ResolutionDecision {
    pub granted: Vec<RequestId>,
    pub denied: Vec<(RequestId, DenialReason)>,
    pub deferred: Vec<(RequestId, Duration)>,
    pub strategy_used: ResolutionStrategy,
    pub rationale: String,
}

/// Denial reason
#[derive(Debug, Clone)]
pub enum DenialReason {
    LowerPriority,
    ResourceUnavailable,
    CostExceeded,
    RateLimited,
    PolicyViolation,
}

/// Conflict resolver
pub struct ConflictResolver {
    strategies: HashMap<ConflictType, ResolutionStrategy>,
    default_strategy: ResolutionStrategy,
}

impl ConflictResolver {
    pub fn new(default_strategy: ResolutionStrategy) -> Self;
    
    /// Resolve a conflict
    pub fn resolve(&self, conflict: &ResourceConflict, requests: &[ResourceRequest]) -> ResolutionDecision;
    
    /// Set strategy for conflict type
    pub fn set_strategy(&mut self, conflict_type: ConflictType, strategy: ResolutionStrategy);
}
```

**Tasks**:
- [ ] Define `ResolutionStrategy` enum
- [ ] Implement priority-based resolution
- [ ] Implement round-robin resolution
- [ ] Implement collaborative resolution
- [ ] Implement queue-based resolution
- [ ] Add strategy selection logic
- [ ] Write resolution tests

**Acceptance Criteria**:
- ✅ All strategies work correctly
- ✅ Resolution is deterministic
- ✅ Rationale is clear

---

### M3.4.3: Priority Routing (2 days)

**Goal**: Route requests based on priority

**Deliverables**:
```rust
// src/routing.rs

/// Request priority
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub struct Priority(pub i32);

impl Priority {
    pub const CRITICAL: Priority = Priority(1000);
    pub const HIGH: Priority = Priority(100);
    pub const NORMAL: Priority = Priority(0);
    pub const LOW: Priority = Priority(-100);
    pub const BACKGROUND: Priority = Priority(-1000);
}

/// Priority router
pub struct PriorityRouter {
    queues: HashMap<Priority, VecDeque<ResourceRequest>>,
}

impl PriorityRouter {
    pub fn new() -> Self;
    
    /// Add request to appropriate queue
    pub fn enqueue(&mut self, request: ResourceRequest);
    
    /// Get next request by priority
    pub fn dequeue(&mut self) -> Option<ResourceRequest>;
    
    /// Peek at next request
    pub fn peek(&self) -> Option<&ResourceRequest>;
    
    /// Get queue lengths by priority
    pub fn queue_lengths(&self) -> HashMap<Priority, usize>;
}
```

**Tasks**:
- [ ] Define `Priority` struct
- [ ] Implement `PriorityRouter`
- [ ] Add priority queue management
- [ ] Implement priority boosting for starved requests
- [ ] Write routing tests

**Acceptance Criteria**:
- ✅ Higher priority served first
- ✅ No starvation of low priority
- ✅ Routing is efficient

---

### M3.4.4: Fairness Monitoring (2 days)

**Goal**: Monitor and ensure fair resource distribution

**Deliverables**:
```rust
// src/fairness.rs

/// Fairness metrics
#[derive(Debug, Clone)]
pub struct FairnessMetrics {
    pub gini_coefficient: f64,
    pub max_wait_time: Duration,
    pub avg_wait_time: Duration,
    pub requests_by_user: HashMap<String, u64>,
    pub resources_by_user: HashMap<String, u64>,
}

/// Fairness monitor
pub struct FairnessMonitor {
    window: Duration,
    history: Vec<AllocationRecord>,
    thresholds: FairnessThresholds,
}

/// Allocation record
#[derive(Debug, Clone)]
pub struct AllocationRecord {
    pub request_id: RequestId,
    pub user_id: String,
    pub resources_allocated: u64,
    pub wait_time: Duration,
    pub timestamp: Instant,
}

impl FairnessMonitor {
    pub fn new(window: Duration, thresholds: FairnessThresholds) -> Self;
    
    /// Record an allocation
    pub fn record(&mut self, record: AllocationRecord);
    
    /// Get current fairness metrics
    pub fn metrics(&self) -> FairnessMetrics;
    
    /// Check if allocation would be fair
    pub fn is_fair(&self, user_id: &str, resources: u64) -> bool;
    
    /// Get fairness correction factor
    pub fn correction_factor(&self, user_id: &str) -> f64;
}
```

**Tasks**:
- [ ] Define `FairnessMetrics` struct
- [ ] Implement `FairnessMonitor`
- [ ] Calculate Gini coefficient
- [ ] Track per-user allocations
- [ ] Implement fairness correction
- [ ] Write fairness tests

**Acceptance Criteria**:
- ✅ Fairness deviation <10% over time
- ✅ Metrics accurate
- ✅ Correction prevents abuse

---

### M3.4.5-M3.4.7: Queuing, Audit, Scoring (5 days)

**Tasks**:
- [ ] M3.4.5: Implement request queuing
  - Wait time estimation
  - Queue position tracking
  - Timeout handling
- [ ] M3.4.6: Implement audit log
  - All decisions logged
  - Rationale captured
  - Queryable history
- [ ] M3.4.7: Implement multi-dimensional scoring
  - Business value
  - User impact
  - Cost efficiency
  - Learning value

---

## 🧹 M3.5: Stale Manager - The Lifecycle Guardian

**Crate**: `symphony-stale-manager`
**Duration**: 3 weeks
**Dependencies**: M3.3 (Artifact Store)


### M3.5.1: Retention Policies (2 days)

**Goal**: Define artifact retention policies

**Deliverables**:
```rust
// src/retention.rs

/// Retention policy
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RetentionPolicy {
    pub name: String,
    pub rules: Vec<RetentionRule>,
    pub priority: u8,
    pub enabled: bool,
}

/// Retention rule
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RetentionRule {
    /// Keep for maximum age
    MaxAge { duration: Duration },
    /// Keep minimum access count
    MinAccessCount { count: u64 },
    /// Keep minimum quality score
    MinQualityScore { score: f64 },
    /// Preserve training data
    PreserveTrainingData { preserve: bool },
    /// Maximum total size
    MaxTotalSize { bytes: u64 },
    /// Keep tagged artifacts
    KeepTagged { tags: Vec<String> },
}

/// Retention evaluation result
#[derive(Debug, Clone)]
pub enum RetentionDecision {
    Keep { reason: String },
    Archive { reason: String },
    Delete { reason: String },
}

impl RetentionPolicy {
    pub fn evaluate(&self, artifact: &Artifact, stats: &ArtifactStats) -> RetentionDecision;
}
```

**Tasks**:
- [ ] Define `RetentionPolicy` struct
- [ ] Define `RetentionRule` enum
- [ ] Implement policy evaluation
- [ ] Add policy serialization
- [ ] Write policy tests

**Acceptance Criteria**:
- ✅ All rule types work
- ✅ Policies are composable
- ✅ Evaluation is fast

---

### M3.5.2: Policy Engine (3 days)

**Goal**: Evaluate policies against artifacts

**Deliverables**:
```rust
// src/engine.rs

/// Policy engine
pub struct PolicyEngine {
    policies: Vec<RetentionPolicy>,
    artifact_store: Arc<ArtifactStore>,
}

/// Evaluation result
#[derive(Debug)]
pub struct EvaluationResult {
    pub artifact_hash: ContentHash,
    pub decision: RetentionDecision,
    pub matching_policies: Vec<String>,
    pub evaluated_at: DateTime<Utc>,
}

impl PolicyEngine {
    pub fn new(artifact_store: Arc<ArtifactStore>) -> Self;
    
    /// Add policy
    pub fn add_policy(&mut self, policy: RetentionPolicy);
    
    /// Remove policy
    pub fn remove_policy(&mut self, name: &str);
    
    /// Evaluate single artifact
    pub async fn evaluate(&self, hash: &ContentHash) -> Result<EvaluationResult, PolicyError>;
    
    /// Evaluate all artifacts
    pub async fn evaluate_all(&self) -> Result<Vec<EvaluationResult>, PolicyError>;
    
    /// Get artifacts to delete
    pub async fn get_deletable(&self) -> Result<Vec<ContentHash>, PolicyError>;
    
    /// Get artifacts to archive
    pub async fn get_archivable(&self) -> Result<Vec<ContentHash>, PolicyError>;
}
```

**Tasks**:
- [ ] Implement `PolicyEngine`
- [ ] Add policy management
- [ ] Implement batch evaluation
- [ ] Add evaluation caching
- [ ] Write engine tests

**Acceptance Criteria**:
- ✅ Policies evaluated correctly
- ✅ Batch evaluation is efficient
- ✅ Results are consistent

---

### M3.5.3: Value Scoring (2 days)

**Goal**: Score artifact value for retention decisions

**Deliverables**:
```rust
// src/scoring.rs

/// Artifact value score
#[derive(Debug, Clone)]
pub struct ValueScore {
    pub total: f64,
    pub components: ValueComponents,
}

/// Score components
#[derive(Debug, Clone)]
pub struct ValueComponents {
    pub recency: f64,      // How recently used
    pub frequency: f64,    // How often used
    pub quality: f64,      // Quality score
    pub training: f64,     // Training value
    pub uniqueness: f64,   // How unique/rare
}

/// Value scorer
pub struct ValueScorer {
    weights: ValueWeights,
}

/// Scoring weights
#[derive(Debug, Clone)]
pub struct ValueWeights {
    pub recency: f64,
    pub frequency: f64,
    pub quality: f64,
    pub training: f64,
    pub uniqueness: f64,
}

impl ValueScorer {
    pub fn new(weights: ValueWeights) -> Self;
    
    /// Score an artifact
    pub fn score(&self, artifact: &Artifact, stats: &ArtifactStats) -> ValueScore;
    
    /// Rank artifacts by value
    pub fn rank(&self, artifacts: &[(&Artifact, &ArtifactStats)]) -> Vec<(ContentHash, ValueScore)>;
}
```

**Tasks**:
- [ ] Define `ValueScore` struct
- [ ] Implement `ValueScorer`
- [ ] Add configurable weights
- [ ] Implement ranking
- [ ] Write scoring tests

**Acceptance Criteria**:
- ✅ Scores reflect actual value
- ✅ Weights are configurable
- ✅ Ranking is consistent

---

### M3.5.4-M3.5.7: Archival, Cleanup, Tiers, Scheduling (7 days)

**Tasks**:
- [ ] M3.5.4: Implement cloud archival
  - S3-compatible storage
  - Compression before upload
  - Retrieval on demand
- [ ] M3.5.5: Implement cleanup execution
  - Safe deletion with confirmation
  - Batch deletion
  - Rollback support
- [ ] M3.5.6: Implement storage tiers
  - Hot (local SSD)
  - Warm (local HDD)
  - Cold (cloud archive)
  - Automatic tier migration
- [ ] M3.5.7: Implement scheduling
  - Configurable cleanup schedule
  - Off-peak execution
  - Progress tracking

---

## 📊 M3 Summary

| Sub-Milestone | Tasks | Duration | Status |
|---------------|-------|----------|--------|
| M3.1.1 Model State Machine | 8 | 3 days | 📋 |
| M3.1.2 State Transitions | 7 | 3 days | 📋 |
| M3.1.3 LRU Cache | 8 | 4 days | 📋 |
| M3.1.4 Predictive Prewarming | 9 | 5 days | 📋 |
| M3.1.5 Health Monitoring | 8 | 3 days | 📋 |
| M3.1.6-8 Shutdown/Metrics/Tests | 6 | 5 days | 📋 |
| M3.2.1 Execution Engine | 8 | 4 days | 📋 |
| M3.2.2 Node Scheduler | 6 | 3 days | 📋 |
| M3.2.3 Parallel Execution | 7 | 4 days | 📋 |
| M3.2.4 Checkpointing | 7 | 3 days | 📋 |
| M3.2.5 Recovery Strategies | 7 | 3 days | 📋 |
| M3.2.6-8 Metrics/Timeouts/Tests | 6 | 5 days | 📋 |
| M3.3.1 Content-Addressable Storage | 8 | 4 days | 📋 |
| M3.3.2 Deduplication | 4 | 2 days | 📋 |
| M3.3.3 Versioning System | 6 | 3 days | 📋 |
| M3.3.4 Tantivy Search | 8 | 4 days | 📋 |
| M3.3.5-8 Quality/Encryption/etc | 8 | 7 days | 📋 |
| M3.4.1 Conflict Detection | 7 | 2 days | 📋 |
| M3.4.2 Resolution Strategies | 7 | 3 days | 📋 |
| M3.4.3 Priority Routing | 5 | 2 days | 📋 |
| M3.4.4 Fairness Monitoring | 6 | 2 days | 📋 |
| M3.4.5-7 Queuing/Audit/Scoring | 6 | 5 days | 📋 |
| M3.5.1 Retention Policies | 5 | 2 days | 📋 |
| M3.5.2 Policy Engine | 5 | 3 days | 📋 |
| M3.5.3 Value Scoring | 5 | 2 days | 📋 |
| M3.5.4-7 Archival/Cleanup/etc | 8 | 7 days | 📋 |

**Total Tasks**: ~170 detailed tasks
**Total Duration**: 18 weeks (with parallelization: ~12 weeks)

---

## 🔗 Integration Points

**Note**: See `design.md` for The Pit ↔ Conductor Bridge architecture and PitManager PyO3 interface details.

---

## 🎯 Performance Targets

**Note**: See `design.md` for complete performance targets table.

---

## 🧪 Testing Strategy

**Note**: See `design.md` for complete testing strategy (unit tests, property tests, integration tests, stress tests, benchmarks).

---

**Status**: Level 2 Decomposition Complete
**Next Step**: Begin implementation with M1.1.1 (Message Envelope Design)
**Total Project**: ~640 detailed tasks across 4 milestones

---

**Previous**: [MILESTONE_LEVEL2_M4.md](./MILESTONE_LEVEL2_M4.md)
