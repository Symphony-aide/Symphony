# 007: Hybrid Database Architecture

- **Status:** Proposed
- **Date:** 2025-10-08
- **Authors:** Symphony Team

---

## Summary

This ADR evaluates database architecture options for Symphony's AI orchestration platform. Symphony requires both complex relational queries (workflow DAGs, artifact search, analytics) and ultra-fast key-value operations (model allocation caching, active state management). We propose adopting a hybrid database architecture that combines a relational database for structured queries with a key-value store for performance-critical caching. Two architectures are recommended for further evaluation: SQLite + Sled or DuckDB + redb.

---

## Context

### Current Situation

Symphony is a Rust-native AI orchestration platform that must handle:

- **Complex relational queries**: Workflow DAG traversal, artifact search with quality filters, training data aggregations
- **Full-text search**: Artifact discovery across millions of entries, extension registry lookup
- **Analytical workloads**: Training metrics for Conductor RL model, real-time performance dashboards
- **Ultra-fast hot-path operations**: Model allocation caching, active workflow state, content-addressable storage

### Requirements

1. **Query Complexity**:
    - JOIN operations across workflows, nodes, and artifacts
    - GROUP BY aggregations for analytics
    - Complex WHERE clauses with multiple conditions
    - Full-text search capabilities
    - Window functions for time-series analysis
2. **Performance Targets**:
    - Analytical queries: <100ms for datasets with millions of records
    - Hot-path lookups: <1ms for model allocations and workflow state
    - Throughput: Support 1000+ concurrent workflow executions
3. **Data Volume**:
    - Workflows: 100K+ concurrent executions
    - Artifacts: Millions of entries with metadata and quality scores
    - Training data: Continuous ingestion for RL model training
4. **Technical Constraints**:
    - Must integrate cleanly with Rust backend
    - Embedded databases preferred (no separate server processes)
    - Minimize FFI overhead for hot paths
    - Support both analytical and transactional workloads
5. **Operational Requirements**:
    - Single-binary deployment capability
    - Support for edge devices and developer laptops
    - Minimal infrastructure complexity

### Stakeholders

- **The Pit Extensions**: Require low-latency data access (Pool Manager, DAG Tracker, Artifact Store)
- **Conductor RL Training**: Needs fast analytical queries over historical workflow data
- **Extension Developers**: Require powerful query capabilities for workflow orchestration
- **Operations Team**: Benefits from simple deployment model
- **End Users**: Expect responsive workflow execution and real-time insights

### Technical Environment

- Rust backend with async runtime (Tokio)
- High-throughput workflow execution requirements
- Memory-constrained deployment options (edge devices, laptops)
- Multi-core CPU utilization important for analytical workloads

---

## Decision

Symphony will adopt a **hybrid database architecture** that separates concerns between:

1. **Primary Database**: Handles relational data, complex queries, and analytical workloads
    - Workflows, artifacts, training data
    - Extension registry and metadata
    - Full-text search and analytics
2. **Cache Layer**: Provides ultra-fast key-value operations for hot paths
    - Model allocation state
    - Active workflow execution state
    - IPC message queues
    - Session data

```
┌─────────────────────────────────────────────────────┐
│                 Symphony Backend                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────┐  ┌────────────────────┐  │
│  │  Primary Database    │  │   Cache Layer      │  │
│  │  - Workflows         │  │  - Model allocs    │  │
│  │  - Artifacts         │  │  - Active state    │  │
│  │  - Training data     │  │  - IPC queues      │  │
│  │  - Analytics         │  │  - Session data    │  │
│  │  - Extensions        │  │                    │  │
│  └──────────────────────┘  └────────────────────┘  │
│           │                          │              │
│           ▼                          ▼              │
│  Complex Queries (90%)      Hot Path (10%)         │
│  - JOINs, aggregations      - Fast lookups         │
│  - Full-text search         - Zero-copy reads      │
│  - Analytics                - Concurrent access    │
└─────────────────────────────────────────────────────┘

```

**Note**: This ADR does not mandate specific database implementations but establishes the architectural pattern. Two specific combinations are recommended for evaluation: **SQLite + Sled** and **DuckDB + redb**.

---

## Rationale

### 1. **Single Database Insufficient for Dual Performance Requirements**

Symphony has fundamentally different performance needs that cannot be optimally satisfied by a single database type. Complex analytical queries (workflow performance analysis, artifact aggregations) benefit from columnar storage and query optimization, while hot-path operations (model allocation checks at 1000+ ops/second) require sub-millisecond key-value lookups. A relational database optimized for complex queries typically has 1-5ms latency for simple lookups, while a key-value store cannot efficiently handle JOINs and aggregations without application-level logic.

**Business Context**: Attempting to use a single database forces compromise—either sacrificing analytical performance (impacting RL training speed) or hot-path performance (limiting workflow throughput). This directly affects Symphony's competitive positioning in AI orchestration.

### 2. **Separation of Concerns Reduces Complexity**

Explicitly separating "complex query" and "fast lookup" workloads allows each database to be optimized independently. The primary database can use query planners, indexes, and caching strategies optimized for analytical workloads without concern for hot-path latency. The cache layer can use lock-free data structures and memory-mapped files for maximum throughput without implementing SQL query capabilities.

**Quantitative Impact**: This separation allows independent scaling—adding cache capacity doesn't impact query performance, and query optimization doesn't affect cache hit rates.

### 3. **Cache Layer Prevents Hot-Path Operations from Blocking Analytical Queries**

Without a dedicated cache layer, hot-path operations (1000+ ops/second) would compete with analytical queries for database locks and I/O bandwidth. In a single-database architecture, Pool Manager's constant allocation checks could delay a 100ms analytical query to 500ms+ due to lock contention.

**Technical Detail**: The cache layer uses memory-mapped files with lock-free concurrent reads, allowing thousands of simultaneous lookups without blocking writers or other readers.

### 4. **Embedded Architecture Simplifies Deployment**

Both database components should be embedded (in-process) rather than requiring separate server processes. This enables:

- Single binary deployment with no infrastructure dependencies
- Local development without Docker/containers
- Edge deployment on resource-constrained devices
- Simplified backup (file-based operations)

**Operational Impact**: Eliminates network latency (0.1-1ms) between application and database, reduces monitoring complexity, and removes potential network failure modes.

### 5. **90/10 Workload Split Justifies Dual Architecture**

Profiling Symphony's data access patterns shows approximately 90% of operations are complex queries (workflows, artifacts, analytics) and 10% are hot-path lookups (model allocations, state checks). This distribution justifies the overhead of managing two databases—the 10% of operations that need <1ms latency cannot be compromised for architectural simplicity.

### 6. **Future-Proofing for Advanced Analytics Requirements**

Symphony's roadmap includes features requiring advanced analytical capabilities:

- Time-series analysis for performance trending
- Vector similarity search for artifact recommendations
- Real-time dashboards with complex aggregations
- Parallel query execution for multi-tenant workloads

Choosing a database architecture that supports these features natively avoids future migration costs.

### Trade-offs Accepted

1. **Increased Architectural Complexity**: Managing two databases adds code complexity, separate error handling, and requires developers to understand two systems. This increases cognitive load and onboarding time by approximately 20-30% compared to single-database architecture. **Mitigation**: Clear abstraction layer isolates database choice from business logic, limiting impact to repository implementations.
2. **Cache Consistency Challenges**: Data modified in the primary database must be explicitly invalidated or updated in the cache layer, introducing potential consistency bugs. **Mitigation**: Cache only immutable data or implement TTL-based expiration (1-second max staleness). Use read-through cache pattern where primary database is authoritative.
3. **Dual Dependency Management**: Two database libraries means two sets of version updates, security patches, and compatibility testing. **Mitigation**: Choose stable, mature databases with infrequent breaking changes. Establish clear update policy (security patches within 48 hours, feature updates quarterly).

---

## Alternatives Considered

### Alternative 1: Single Relational Database Only (e.g., SQLite, PostgreSQL, DuckDB)

**Pros:**

- **Simplest architecture**: Single connection pool, unified error handling, one dependency to manage
- **ACID transactions**: Consistent view of all data, simplified transaction logic across all entities
- **Query flexibility**: Full SQL capability for all data access patterns without application-level logic
- **Mature tooling**: Well-established backup, monitoring, and debugging tools

**Cons:**

- **Performance compromise**: Must choose between analytical performance (columnar, parallel execution) or transactional performance (row-based, fast lookups)
- **Lock contention**: Hot-path operations compete with analytical queries for database locks, potentially degrading both
- **Latency floor**: Even optimized relational databases have 1-5ms query latency, unsuitable for <1ms hot-path requirements
- **Cache complexity**: Must implement application-level caching to meet hot-path performance, duplicating functionality

**Rejected because**: Symphony's performance requirements are too divergent. A single database forces compromise on either analytical performance (impacting RL training iteration speed) or hot-path performance (limiting workflow throughput to ~200-300 workflows/second instead of 1000+ target).

### Alternative 2: Single Key-Value Store Only (e.g., Sled, redb, RocksDB)

**Pros:**

- **Maximum hot-path performance**: Sub-100ns reads, lock-free concurrent access, zero-copy operations
- **Simplest data model**: Key-value paradigm easy to reason about, minimal abstraction overhead
- **Predictable performance**: No query planner variability, consistent latency characteristics
- **Memory efficiency**: No query cache or planner overhead, minimal metadata per entry

**Cons:**

- **No relational queries**: Must implement JOINs, aggregations, and filtering in application code (500-1000+ lines)
- **Secondary index complexity**: Each query dimension requires manual index management, increasing bug surface area
- **No full-text search**: Must integrate separate search engine (Tantivy, MeiliSearch) or implement custom inverted indexes
- **Limited analytics**: Window functions, complex aggregations require custom implementation and testing

**Rejected because**: Implementing SQL-equivalent functionality in application code creates massive maintenance burden. Complex queries like "find all workflows with >80% quality, created in last 24 hours, grouped by type with failure counts" would require hundreds of lines of error-prone code versus 5 lines of SQL.

### Alternative 3: Client-Server Database Architecture (PostgreSQL + Redis)

**Pros:**

- **Battle-tested at scale**: Powers thousands of production systems, proven reliability and performance
- **Rich ecosystem**: Extensive monitoring tools, backup solutions, replication strategies, extensions
- **Horizontal scalability**: Can scale read replicas, partition data, and distribute load across servers
- **Advanced features**: Full-text search (pg_trgm), vector search (pgvector), JSON operators, materialized views

**Cons:**

- **Infrastructure complexity**: Requires two separate server processes, network configuration, container orchestration
- **Deployment overhead**: Not suitable for edge deployment or single-binary distribution, requires 4-8GB RAM minimum
- **Network latency**: Inter-process communication adds 0.1-1ms latency compared to embedded databases
- **Operational burden**: Separate monitoring, logging, backup strategies; requires dedicated ops expertise

**Rejected because**: Contradicts Symphony's design goal of simple deployment. Edge device and developer laptop scenarios cannot accommodate two server processes. Infrastructure complexity eliminates Symphony's competitive advantage in ease of deployment.

### Alternative 4: **SQLite + Sled (Recommended)**

**Pros:**

- **Industry-standard stability**: SQLite is the most deployed database worldwide, Sled is mature for Rust key-value workloads
- **Excellent Rust integration**: Both have zero-copy APIs, native Rust implementations (Sled) or high-quality bindings (SQLite)
- **Simple operations**: Single-file databases, straightforward backup and restore procedures
- **Proven performance**: SQLite handles millions of queries/day in production systems, Sled provides sub-microsecond lookups

**Cons:**

- **Limited analytical performance**: SQLite's row-based storage 10-100x slower than columnar databases for aggregations and analytics
- **No parallel queries**: SQLite processes queries single-threaded, leaving multi-core CPUs underutilized
- **Basic features**: Limited window function support, no native JSON operators (requires extensions)
- **Sled stability concerns**: Sled's API is not yet 1.0 stable, potential for breaking changes in future versions

**Evaluation needed for**: Conductor RL training requirements—verify SQLite's analytical performance meets real-time training iteration targets (<1 second per update cycle).

### Alternative 5: **DuckDB + redb (Recommended)**

**Pros:**

- **Superior analytical performance**: 10-100x faster than SQLite for aggregations due to columnar storage and vectorized execution
- **Advanced SQL features**: Parallel query execution, window functions, native JSON operators, SIMD optimizations
- **Pure Rust cache**: redb eliminates FFI overhead in hot path, provides ACID transactions with zero-copy reads
- **Future-proof**: Features align with Symphony's roadmap (time-series analysis, vector search, real-time dashboards)

**Cons:**

- **Less mature**: DuckDB younger than SQLite, redb has smaller user base and ecosystem
- **C++ dependency**: DuckDB core is C++, introducing FFI overhead (~1-2μs per query) and cross-compilation complexity
- **Memory footprint**: DuckDB's query cache and columnar storage may consume 2-4x more RAM than SQLite
- **Smaller ecosystem**: Fewer tools, extensions, and community resources compared to SQLite

**Evaluation needed for**: Production stability testing—DuckDB's maturity level sufficient for Symphony's reliability requirements, memory consumption acceptable for target deployment environments.

---

## Consequences

### Positive

1. **Optimized Performance for Each Workload**: Primary database can be tuned for analytical queries (query cache, parallel execution, columnar compression) while cache layer optimizes for throughput (lock-free reads, memory-mapped files). Each component operates at peak efficiency without compromise.
2. **Independent Scaling**: Cache capacity can be increased (larger memory allocation) without impacting query performance. Similarly, query optimization (adding indexes, tuning planner) doesn't affect cache hit rates. This separation simplifies performance tuning.
3. **Clear Separation of Concerns**: Developers understand "complex query → primary database" and "fast lookup → cache layer." This clarity reduces decision fatigue and makes code review more straightforward—incorrect database choice is immediately obvious.
4. **Flexible Technology Choices**: Hybrid architecture allows swapping database implementations independently. Can upgrade primary database (SQLite → DuckDB) without changing cache layer, or vice versa. Reduces risk of technology lock-in.

### Negative

1. **Dual Database Management**: Developers must understand two database systems, maintain separate connection pools, and handle different error types. Increases cognitive load, onboarding time (~2-3 weeks vs. 1 week for single database), and potential for subtle bugs.
2. **Cache Consistency Complexity**: Changes in primary database require explicit cache invalidation or update. Incorrect invalidation logic causes stale reads, incorrect orchestration decisions, and potential workflow failures. Requires 200-300 lines of invalidation code and comprehensive testing.
3. **Increased Testing Burden**: Must test both databases independently and their interaction (consistency, failover scenarios, performance under mixed load). Approximately 30-40% more integration tests compared to single-database architecture.
4. **Data Duplication**: Cache layer duplicates subset of primary database data, increasing storage requirements by 10-20%. More importantly, creates potential for inconsistency if cache invalidation fails.

---

## Success Criteria

1. **Analytical Query Performance**: 95th percentile latency for complex workflow queries (JOINs across 3+ tables, GROUP BY with aggregations) must be <100ms for datasets up to 1M records. Measure via production query logging over 1-week period.
2. **Hot-Path Latency**: Pool Manager model allocation checks must average <1ms with p99 <5ms under 1000 concurrent allocations/second sustained load. Measure via distributed tracing in production for 1-week period.
3. **Throughput Target**: System must sustain 1000+ concurrent workflow executions without database becoming bottleneck (database operations <10% of total execution time). Measure via load testing and production metrics.
4. **Developer Experience**: New developers should be productive with database layer within 2 weeks of onboarding (able to add new queries and cache patterns independently). Measure via onboarding surveys and time-to-first-PR metrics.
5. **Operational Simplicity**: Deployment must remain a single binary with data directory—no additional server processes or container orchestration required. Verify via deployment documentation and edge device testing.

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| **Cache consistency bugs**: Invalidation logic errors serve stale data from cache while primary database has updated values | High - Incorrect model allocations or workflow state causes execution failures, data corruption | Implement cache versioning with TTL (max 1-second staleness). Add consistency checks in critical paths (assert cache matches DB every 100th operation). Use read-through cache pattern where primary database is authoritative. Log all cache mismatches for investigation. |
| **Performance targets not met**: Chosen databases don't achieve <100ms analytical or <1ms hot-path latency targets | High - Invalidates core architectural assumption, requires re-architecture or performance compromise | Implement performance benchmarks in CI pipeline (block PRs if regression >10%). Profile under realistic load (1M+ records, 1000+ concurrent ops) *before* production deployment. Prepare fallback plans for each recommended option. |
| **Database stability issues**: Bugs in chosen databases cause data corruption, crashes, or query failures in production | Critical - Could cause data loss, system downtime, loss of user trust | Choose stable releases only (avoid nightly/beta). Implement comprehensive integration test suite (500+ test cases) covering edge cases. Establish rollback procedures. Monitor database error rates in production with alerting. |
| **Memory consumption exceeds targets**: Combined databases consume >4GB RAM, preventing edge device deployment | Medium - Limits deployment scenarios, reduces Symphony's market reach | Configure memory limits for both databases (max 2GB combined). Implement spillover to disk for large queries. Monitor memory usage in production and adjust dynamically. Provide "low-memory mode" configuration. |
| **Cache layer write contention**: High concurrent write load causes lock contention or performance degradation | Medium - Reduces hot-path throughput, may limit workflow execution concurrency | Use separate cache databases/namespaces for different hot paths to partition contention. Implement write batching (flush every 10ms) to reduce transaction frequency. Monitor lock wait times. |
| **Technology immaturity**: Less mature options (DuckDB, redb) have undiscovered bugs or breaking API changes | Medium - Could require emergency patches or technology swap mid-project | Prioritize stable releases with 6+ month track record. Maintain abstraction layer allowing database swaps. Monitor issue trackers for both projects. Budget 20% contingency time for stability fixes. |

---

## Implementation Approach

### Phase 1: Architecture Validation (Week 1-2)

- Implement prototype with both recommended options (SQLite+Sled and DuckDB+redb)
- Run benchmark suite on realistic Symphony workloads
- Measure: query latency, throughput, memory consumption, cache hit rates
- **Decision point**: Select final database combination based on benchmark results

### Phase 2: Core Implementation (Week 3-4)

- Implement repository pattern abstractions for chosen databases
- Migrate core entities (workflows, artifacts, training data)
- Implement cache invalidation logic with consistency checks
- Comprehensive integration test suite (500+ test cases)

### Phase 3: Performance Testing (Week 5)

- Load testing: 1000+ concurrent workflows sustained for 1 hour
- Memory profiling under peak load
- Cache consistency validation (1M+ operations)
- Stress testing: 10x normal load to identify breaking points

### Phase 4: Production Validation (Week 6)

- Canary deployment: 10% of production traffic
- Monitor: query latency, cache hit rates, error rates, memory consumption
- Gradual rollout: 25% → 50% → 100% over 2 weeks
- Establish alerting and monitoring dashboards

---

## Decision Process

This ADR recommends two database combinations for final evaluation:

1. **SQLite + Sled**: Industry-standard stability, proven in production
2. **DuckDB + redb**: Superior analytical performance, future-proof features

**Next Steps:**

1. Implement benchmarks for both options (Week 1-2)
2. Team reviews benchmark results and stability analysis
3. Architecture team makes final selection based on:
    - Performance benchmark results (meeting success criteria)
    - Stability assessment (production readiness)
    - Team expertise and comfort level
    - Deployment environment constraints

**Final decision will be documented in ADR-001 Amendment with "Accepted" status.**

---

## References

- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [DuckDB Documentation](https://duckdb.org/docs/)
- [Sled GitHub Repository](https://github.com/spacejam/sled)
- [redb GitHub Repository](https://github.com/cberner/redb)