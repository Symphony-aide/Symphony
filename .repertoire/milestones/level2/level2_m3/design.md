# Level 2 M3 Design: The Pit - Infrastructure Extensions Architecture

> **Technical Architecture**: Detailed design and crate structures for M3 Infrastructure Extensions

**Parent**: Level 1 M3 The Pit  
**Architecture**: In-process Rust extensions with microsecond-level performance  
**Integration**: Direct access from Python Conductor via PyO3 + Two-Layer Data Architecture

---

## 📖 Glossary

| Term | Definition |
|------|------------|
| **OFB Python** | Out of Boundary Python - refers to Python API components that handle authoritative validation, RBAC, and data persistence outside the Rust boundary |
| **Pre-validation** | Lightweight technical validation in Rust to prevent unnecessary HTTP requests (NOT business logic) |
| **Authoritative Validation** | Complete validation including RBAC, business rules, and data constraints performed by OFB Python |
| **Two-Layer Architecture** | Rust (orchestration + pre-validation) + OFB Python (validation + persistence) |
| **The Pit** | Five infrastructure extensions (Pool Manager, DAG Tracker, Artifact Store, Arbitration Engine, Stale Manager) |
| **Pool Manager** | AI model lifecycle and resource allocation component |
| **DAG Tracker** | Workflow dependency mapping and execution component |
| **Artifact Store** | Intelligent data persistence and versioning component |

---

## 🏗️ High-Level Architecture

### The Pit Integration Overview
```
┌─────────────────────────────────────────────────────────────┐
│                    🎩 Conductor (Python)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    🎭 The Pit (Rust)                         │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ Pool Manager │───▶│ DAG Tracker  │───▶│Artifact Store│  │
│  │   (Models)   │    │ (Execution)  │    │  (Storage)   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                   │                   │           │
│         ▼                   ▼                   ▼           │
│  ┌──────────────┐    ┌──────────────┐                      │
│  │ Arbitration  │◀───│Stale Manager │                      │
│  │   Engine     │    │  (Cleanup)   │                      │
│  └──────────────┘    └──────────────┘                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Data Flow**:
1. **Pool Manager** provides models to **DAG Tracker**
2. **DAG Tracker** stores results in **Artifact Store**
3. **Arbitration Engine** manages resource conflicts
4. **Stale Manager** optimizes **Artifact Store** storage

---

## 📦 Crate Structure and Dependencies

### Pool Manager
```
apps/backend/crates/symphony-pool-manager/
├── Cargo.toml                    # lru, tokio, async-trait
├── src/
│   ├── lib.rs                   # Public API exports
│   ├── lifecycle.rs             # Model state machine
│   │   ├── ModelState           # Cold, Warming, Hot, Cooling, Failed
│   │   └── ModelLifecycle       # State tracking and transitions
│   ├── transitions.rs           # State transition management
│   │   ├── StateTransition      # Transition records
│   │   ├── TransitionReason     # Why transitions occur
│   │   └── TransitionManager    # Atomic transition execution
│   ├── cache.rs                 # LRU model cache
│   │   ├── CachedModel          # Cached model entry
│   │   ├── ModelCache           # LRU cache with memory limits
│   │   └── CacheMetrics         # Hit rate, evictions
│   ├── prewarming.rs            # Predictive prewarming
│   │   ├── UsagePattern         # Usage tracking
│   │   ├── UsagePredictor       # Prediction trait
│   │   ├── TimeBasedPredictor   # Time-based predictions
│   │   ├── WorkflowPredictor    # Workflow-based predictions
│   │   └── PrewarmingEngine     # Prediction and prewarming
│   ├── health.rs                # Health monitoring
│   │   ├── HealthStatus         # Healthy, Degraded, Unhealthy
│   │   ├── HealthCheck          # Health check trait
│   │   └── HealthMonitor        # Continuous monitoring
│   ├── shutdown.rs              # Graceful shutdown
│   └── metrics.rs               # Performance metrics
└── tests/
    ├── lifecycle_tests.rs       # State machine tests
    ├── cache_tests.rs           # Cache behavior tests
    └── property_tests.rs        # Property-based tests
```

### DAG Tracker
```
apps/backend/crates/symphony-dag-tracker/
├── Cargo.toml                    # petgraph, tokio, crossbeam
├── src/
│   ├── lib.rs
│   ├── executor.rs              # Execution engine
│   │   ├── ExecutionEngine      # Core workflow execution
│   │   ├── NodeRunner           # Node execution trait
│   │   ├── InstrumentRunner     # AI model node runner
│   │   ├── OperatorRunner       # Utility node runner
│   │   └── ControlRunner        # Control flow node runner
│   ├── scheduler.rs             # Node scheduling
│   │   ├── NodeScheduler        # Dependency-aware scheduling
│   │   ├── ScheduledNode        # Priority-ordered nodes
│   │   └── SchedulingDecision   # Scheduling results
│   ├── parallel.rs              # Parallel execution
│   │   ├── ParallelExecutor     # Concurrent node execution
│   │   ├── ExecutionTask        # Task representation
│   │   └── WorkerPool           # CPU-bound task workers
│   ├── checkpoint.rs            # Checkpointing
│   │   ├── Checkpoint           # State snapshot
│   │   ├── Checkpointer         # Checkpoint management
│   │   └── CheckpointStorage    # Storage trait
│   ├── recovery.rs              # Recovery strategies
│   │   ├── RecoveryStrategy     # Retry, Fallback, Skip, Fail
│   │   ├── BackoffStrategy      # Constant, Linear, Exponential
│   │   └── RecoveryManager      # Failure handling
│   ├── metrics.rs               # Execution metrics
│   └── timeout.rs               # Timeout handling
└── tests/
    ├── execution_tests.rs       # Workflow execution tests
    ├── parallel_tests.rs        # Concurrency tests
    └── stress_tests.rs          # High-load tests
```

### Artifact Store
```
apps/backend/crates/symphony-artifact-store/
├── Cargo.toml                    # sha2, tantivy, aes-gcm, serde
├── src/
│   ├── lib.rs
│   ├── storage.rs               # Content-addressable storage
│   │   ├── ContentHash          # SHA-256 hash
│   │   ├── ArtifactMetadata     # Artifact metadata
│   │   ├── StorageBackend       # Storage trait
│   │   └── ContentAddressableStore # Main storage
│   ├── dedup.rs                 # Deduplication
│   │   └── DedupStats           # Deduplication statistics
│   ├── versioning.rs            # Version management
│   │   ├── ArtifactVersion      # Version record
│   │   ├── VersionedArtifact    # Versioned artifact
│   │   └── VersionManager       # Version operations
│   ├── search.rs                # Tantivy search
│   │   ├── ArtifactSearchIndex  # Search index
│   │   ├── SearchQuery          # Query structure
│   │   └── SearchResult         # Search results
│   ├── quality.rs               # Quality scoring
│   ├── encryption.rs            # AES-256 encryption
│   └── relationships.rs         # Artifact relationships
└── tests/
    ├── storage_tests.rs         # Storage round-trip tests
    ├── search_tests.rs          # Search functionality tests
    └── property_tests.rs        # Property-based tests
```

### Arbitration Engine
```
apps/backend/crates/symphony-arbitration-engine/
├── Cargo.toml                    # tokio, async-trait
├── src/
│   ├── lib.rs
│   ├── conflicts.rs             # Conflict detection
│   │   ├── ResourceConflict     # Conflict types
│   │   ├── ConflictDetector     # Detection logic
│   │   └── ConflictThresholds   # Detection thresholds
│   ├── resolution.rs            # Resolution strategies
│   │   ├── ResolutionStrategy   # Priority, RoundRobin, etc.
│   │   ├── ResolutionDecision   # Resolution results
│   │   └── ConflictResolver     # Resolution execution
│   ├── routing.rs               # Priority routing
│   │   ├── Priority             # Priority levels
│   │   └── PriorityRouter       # Priority-based routing
│   ├── fairness.rs              # Fairness monitoring
│   │   ├── FairnessMetrics      # Gini coefficient, etc.
│   │   ├── FairnessMonitor      # Fairness tracking
│   │   └── AllocationRecord     # Allocation history
│   ├── queuing.rs               # Request queuing
│   ├── audit.rs                 # Audit logging
│   └── scoring.rs               # Multi-dimensional scoring
└── tests/
    ├── conflict_tests.rs        # Conflict detection tests
    ├── resolution_tests.rs      # Resolution strategy tests
    └── fairness_tests.rs        # Fairness property tests
```

### Stale Manager
```
apps/backend/crates/symphony-stale-manager/
├── Cargo.toml                    # tokio, serde, chrono
├── src/
│   ├── lib.rs
│   ├── retention.rs             # Retention policies
│   │   ├── RetentionPolicy      # Policy definition
│   │   ├── RetentionRule        # Rule types
│   │   └── RetentionDecision    # Keep, Archive, Delete
│   ├── engine.rs                # Policy engine
│   │   ├── PolicyEngine         # Policy evaluation
│   │   └── EvaluationResult     # Evaluation results
│   ├── scoring.rs               # Value scoring
│   │   ├── ValueScore           # Total and component scores
│   │   ├── ValueComponents      # Recency, frequency, etc.
│   │   └── ValueScorer          # Scoring logic
│   ├── archival.rs              # Cloud archival
│   ├── cleanup.rs               # Cleanup execution
│   ├── tiers.rs                 # Storage tiers
│   └── scheduling.rs            # Cleanup scheduling
└── tests/
    ├── retention_tests.rs       # Policy evaluation tests
    ├── scoring_tests.rs         # Value scoring tests
    └── cleanup_tests.rs         # Cleanup execution tests
```

---

## 🔗 Python Bridge Integration

### PitManager PyO3 Interface
```rust
// Python-accessible APIs via PyO3

#[pyclass]
pub struct PitManager {
    pool_manager: Arc<PoolManager>,
    dag_tracker: Arc<DagTracker>,
    artifact_store: Arc<ArtifactStore>,
    arbitration_engine: Arc<ArbitrationEngine>,
    stale_manager: Arc<StaleManager>,
}

#[pymethods]
impl PitManager {
    /// Allocate a model for use
    fn allocate_model(&self, model_id: &str) -> PyResult<ModelHandle>;
    
    /// Execute a workflow
    fn execute_workflow(&self, workflow: PyObject) -> PyResult<ExecutionResult>;
    
    /// Store an artifact
    fn store_artifact(&self, content: &[u8], metadata: PyObject) -> PyResult<String>;
    
    /// Retrieve an artifact
    fn retrieve_artifact(&self, hash: &str) -> PyResult<Option<Vec<u8>>>;
    
    /// Arbitrate resource requests
    fn arbitrate(&self, requests: PyObject) -> PyResult<ArbitrationResult>;
    
    /// Run cleanup
    fn run_cleanup(&self) -> PyResult<CleanupResult>;
}
```

---

## 🎯 Performance Targets

| Component | Metric | Target |
|-----------|--------|--------|
| **Pool Manager** | Model allocation (cache hit) | <100μs |
| **Pool Manager** | Prewarming accuracy | >70% |
| **Pool Manager** | Health check latency | <100ms |
| **DAG Tracker** | Node scheduling | <1ms |
| **DAG Tracker** | Parallel execution | 1000+ concurrent |
| **DAG Tracker** | Checkpoint creation | <100ms |
| **Artifact Store** | Store latency | <5ms |
| **Artifact Store** | Retrieve latency | <2ms |
| **Artifact Store** | Search latency | <100ms |
| **Arbitration** | Conflict resolution | <1ms |
| **Arbitration** | Fairness deviation | <10% |
| **Stale Manager** | Policy evaluation | <10ms per artifact |
| **Stale Manager** | Storage savings | >40% |

---

## 🧪 Testing Strategy

### Unit Tests
- Every public function tested
- Edge cases covered
- Error conditions tested

### Property Tests
- State machine invariants (Pool Manager)
- Cache consistency (Pool Manager)
- DAG properties (DAG Tracker)
- Storage round-trips (Artifact Store)
- Fairness properties (Arbitration)

### Integration Tests
- Cross-component workflows
- Python bridge integration
- Concurrent access patterns

### Stress Tests
- 10,000-node workflows
- 1000+ concurrent model allocations
- High-volume artifact storage
- Sustained load testing

### Benchmarks
- All performance targets benchmarked
- Regression detection in CI
- Memory usage profiling
