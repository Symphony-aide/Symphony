# Symphony Backend Packages Reference

**Version**: 0.1.0  
**Last Updated**: 2025-10-09  
**Purpose**: Concise reference for all Symphony backend packages

---

## Part I: Core Foundation

### 1. `core`

**Path**: `apps/backend/core/`  
**Package**: `sveditor-core` v0.1.7

**Why We Need It**: Foundation for the entire backend - provides the server infrastructure that hosts all other components.

**Role**: JSON-RPC server that manages editor states, handles client communication, and serves as the execution host for the Conductor and Pit extensions.

**Responsibilities**:
- Run JSON-RPC server for frontend communication
- Manage multiple editor states
- Handle HTTP and local transport protocols
- Coordinate extension system
- Serve as embedding host for Python Conductor

**Idea & Behavior**: Originally from Graviton fork, being transformed into Symphony's orchestration host. Will embed Python interpreter to run Conductor, initialize Pit extensions in-process, and coordinate all backend operations. Acts as the "stage" where the Conductor performs.

---

### 2. `types`

**Path**: `apps/backend/types/`  
**Package**: `sytypes` v0.1.0

**Why We Need It**: Single source of truth for all data structures - prevents type mismatches and enables compile-time safety across 40+ packages.

**Role**: Central type repository providing shared types, traits, and data structures used by every package in the backend.

**Responsibilities**:
- Define workflow types (WorkflowNode, WorkflowGraph, DAG structures)
- Define artifact types (Artifact, ArtifactMetadata, quality scores)
- Define extension types (ExtensionManifest, PermissionSet)
- Define IPC message types for communication
- Define error types for unified error handling
- Provide serde-compatible types for serialization

**Idea & Behavior**: Zero-cost abstractions - all types compile away with no runtime overhead. Every package depends on this, making it the foundation of type safety. Uses Rust's type system to catch errors at compile time rather than runtime.

---

### 3. `config`

**Path**: `apps/backend/config/`  
**Package**: `syconfig` v0.1.0

**Why We Need It**: Centralized configuration prevents scattered settings and enables runtime reconfiguration without code changes.

**Role**: Configuration management system that loads, validates, and provides access to all Symphony settings.

**Responsibilities**:
- Load configuration from TOML/JSON/YAML files
- Merge environment variables with file config
- Validate configuration against schemas
- Watch for configuration changes (hot reload)
- Provide hierarchical config (CLI > Env > File > Defaults)
- Expose type-safe configuration to all packages

**Idea & Behavior**: Configuration as code - settings are validated at load time, not at use time. Supports multiple sources with clear precedence. Enables operators to tune Symphony without recompilation. Uses JSON schemas for validation.

---

### 4. `core_api`

**Path**: `apps/backend/core_api/`  
**Package**: `sveditor-core-api` v0.1.7

**Why We Need It**: Defines the contract between core and its clients - ensures consistent API across the system.

**Role**: Public API definitions providing traits, types, and interfaces that define how components interact with the core.

**Responsibilities**:
- Define Extension trait for extension system
- Define Persistor trait for state persistence
- Define messaging protocols (client-server communication)
- Provide LSP integration types
- Define file system abstractions

**Idea & Behavior**: API-first design - defines interfaces before implementation. Originally from Graviton, being extended with Symphony-specific APIs. Ensures loose coupling between components through well-defined contracts.

---

## Part II: AIDE Layer - The Pit (Infrastructure as Extensions)

### 5. `extension/layers/aide/pit/core`

**Path**: `apps/backend/extension/layers/aide/pit/core/`  
**Package**: `sy-pit-core` v0.1.0

**Why We Need It**: Shared infrastructure for all 5 Pit extensions - prevents code duplication and ensures consistent behavior.

**Role**: Base library providing common functionality, traits, and utilities for all Pit extensions.

**Responsibilities**:
- Define PitExtension trait (common interface for all Pit extensions)
- Provide PyO3 FFI helpers for Python Conductor integration
- Implement resource tracking (CPU, memory usage)
- Provide unified error handling for Pit
- Coordinate initialization sequence
- Collect performance metrics

**Idea & Behavior**: Template method pattern - defines lifecycle hooks that all Pit extensions implement. Provides FFI utilities to minimize PyO3 boilerplate. All Pit extensions depend on this for consistency.

---

### 6. `extension/layers/aide/pit/pool_manager`

**Path**: `apps/backend/extension/layers/aide/pit/pool_manager/`  
**Package**: `sy-pit-pool-manager` v0.1.0

**Why We Need It**: AI models are expensive to load (10-50ms) - need intelligent caching and pre-warming to achieve <100ms response times.

**Role**: 🏊 Resource pool manager for AI model lifecycle - handles loading, warming, and unloading of models.

**Responsibilities**:
- Allocate/release model resources (CPU/GPU memory)
- Manage model lifecycle states (Unloaded → Loading → Warming → Ready → Active → Cooldown → Unloading)
- Monitor model health and auto-recover failures
- Predictive pre-warming based on usage patterns (ML-based)
- Enforce resource fairness across competing requests
- Track per-model performance metrics

**Idea & Behavior**: Predictive caching with ML - learns which models are likely needed next and pre-warms them. State machine ensures clean transitions. Fairness algorithms prevent resource starvation. Target: 50-100ns allocation latency for cache hits, >80% prediction accuracy.

---

### 7. `extension/layers/aide/pit/dag_tracker`

**Path**: `apps/backend/extension/layers/aide/pit/dag_tracker/`  
**Package**: `sy-pit-dag-tracker` v0.1.0

**Why We Need It**: Workflows have dependencies - need to execute in correct order, maximize parallelism, and recover from failures.

**Role**: 📊 Workflow dependency tracker managing execution as Directed Acyclic Graphs (DAGs).

**Responsibilities**:
- Build and maintain workflow dependency graphs
- Resolve dependencies via topological sorting
- Execute nodes in parallel where possible
- Identify critical path for optimization
- Checkpoint workflow state for recovery
- Detect cycles to prevent infinite loops
- Monitor execution progress and resource usage

**Idea & Behavior**: Level-based parallel execution - groups nodes into levels where all nodes in a level can run concurrently. Uses Kahn's algorithm for topological sort. Checkpoints enable resume-from-failure. Critical path analysis identifies bottlenecks. Target: support 10,000-node workflows.

---

### 8. `extension/layers/aide/pit/artifact_store`

**Path**: `apps/backend/extension/layers/aide/pit/artifact_store/`  
**Package**: `sy-pit-artifact-store` v0.1.0

**Why We Need It**: Workflows generate artifacts (code, docs, configs) - need efficient storage, versioning, search, and quality assessment.

**Role**: 📦 Artifact storage system with versioning, quality scoring, and full-text search.

**Responsibilities**:
- Store artifacts with compression (Zstd/Gzip)
- Version artifacts (Git-like versioning)
- Score artifact quality automatically
- Index artifacts for full-text search (Tantivy)
- Deduplicate content (content-addressable storage)
- Retrieve artifacts efficiently (cache + disk)
- Track artifact metadata and lineage

**Idea & Behavior**: Content-addressable storage with deduplication - identical content stored once. Quality scorer uses multi-factor analysis (completeness, correctness, consistency, clarity). Tantivy provides fast search. Target: 1-5ms store, 0.5-2ms retrieve (cache hit), 20-40% storage savings from dedup.

---

### 9. `extension/layers/aide/pit/arbitration_engine`

**Path**: `apps/backend/extension/layers/aide/pit/arbitration_engine/`  
**Package**: `sy-pit-arbitration-engine` v0.1.0

**Why We Need It**: Multiple workflows compete for limited resources - need fair allocation to prevent starvation and ensure optimal utilization.

**Role**: ⚖️ Resource conflict resolver ensuring fair distribution of CPU, memory, and models.

**Responsibilities**:
- Resolve competing resource requests
- Enforce fairness policies (fair share, priority-based, lottery)
- Handle priority-based allocation
- Support resource preemption when needed
- Track fairness metrics
- Apply configurable allocation policies

**Idea & Behavior**: Pluggable policy system - supports multiple allocation strategies (fair share, priority, lottery scheduling). Can preempt lower-priority allocations for high-priority work. Tracks fairness metrics to detect and correct imbalances. Ensures no workflow is starved of resources.

---

### 10. `extension/layers/aide/pit/stale_manager`

**Path**: `apps/backend/extension/layers/aide/pit/stale_manager/`  
**Package**: `sy-pit-stale-manager` v0.1.0

**Why We Need It**: Artifacts accumulate over time - need intelligent cleanup to free disk space while preserving valuable training data.

**Role**: 🧹 Data lifecycle manager handling retention, archival, and cleanup.

**Responsibilities**:
- Track artifact age and usage patterns
- Apply retention policies (30-day default)
- Archive old artifacts to cloud (S3/Azure Blob)
- Assess training value of artifacts
- Perform scheduled cleanup
- Optimize storage usage intelligently

**Idea & Behavior**: Training-aware lifecycle management - artifacts valuable for training are kept longer. 1-month retention: active (1-7 days local SSD) → archive (8-30 days local HDD) → cloud (30+ days S3/Azure). Scheduled cleanup runs periodically. Assesses training value before deletion.

---

## Part III: IDE Layer Extensions

### 11. `extension/layers/ide/core`

**Path**: `apps/backend/extension/layers/ide/core/`  
**Package**: `sy-ide-core` v0.1.0

**Why We Need It**: Traditional IDE features (file ops, syntax highlighting, LSP) need a home separate from AIDE features.

**Role**: Core IDE functionality providing traditional code editor features.

**Responsibilities**:
- File operations (open, save, close, watch)
- Syntax highlighting integration
- Language Server Protocol (LSP) coordination
- Code navigation (go-to-definition, find references)
- Basic editing operations
- Workspace management

**Idea & Behavior**: Separation of concerns - IDE features separate from AIDE features. Provides familiar VSCode-like functionality. Coordinates with LSP servers for language intelligence. Foundation for traditional editing workflows.

---

### 12. `extension/layers/ide/ui_bridge`

**Path**: `apps/backend/extension/layers/ide/ui_bridge/`  
**Package**: `sy-ide-ui-bridge` v0.1.0

**Why We Need It**: Backend and frontend are separate processes - need efficient communication channel for UI updates.

**Role**: Communication bridge between backend extensions and React frontend.

**Responsibilities**:
- Serialize backend UI updates to JSON
- Send updates to frontend via IPC
- Handle user events from frontend
- Manage bidirectional communication
- Coordinate with Virtual DOM system

**Idea & Behavior**: Event-driven bridge - backend generates UI updates, frontend renders them. Decouples backend logic from frontend rendering. Enables backend extensions to create UI without knowing React.

---

### 13. `extension/layers/ide/virtual_dom`

**Path**: `apps/backend/extension/layers/ide/virtual_dom/`  
**Package**: `sy-ide-virtual-dom` v0.1.0

**Why We Need It**: Rust extensions need to create UI but can't write React - need abstraction layer.

**Role**: Virtual DOM system allowing Rust extensions to generate React UI declaratively.

**Responsibilities**:
- Define VirtualNode tree structure
- Map to Shadcn UI components
- Serialize to JSON for React consumption
- Handle UI events from frontend
- Diff VirtualNode trees for efficient updates
- Provide builder API for UI construction

**Idea & Behavior**: Backend-generated UI - Rust extensions build VirtualNode trees, serialize to JSON, React renders using Shadcn components. Enables extensions to create rich UI without JavaScript. Diffing minimizes update overhead. Target: 1-5ms serialization latency.

---

## Part IV: Extension SDK

### 14. `extension/sdk/core`

**Path**: `apps/backend/extension/sdk/core/`  
**Package**: `sy-sdk-core` v0.1.0

**Why We Need It**: Third-party developers need easy API to build extensions - reduces barrier to entry.

**Role**: Core SDK providing base traits and utilities for extension development.

**Responsibilities**:
- Define Extension trait for all extension types
- Provide manifest builder API
- Offer helper functions for common tasks
- Define extension lifecycle hooks
- Provide error handling utilities
- Document extension development patterns

**Idea & Behavior**: Developer-friendly API - hides complexity, exposes simple interfaces. Follows Rust best practices. Extensive documentation and examples. Makes extension development accessible to Rust developers.

---

### 15. `extension/sdk/testing`

**Path**: `apps/backend/extension/sdk/testing/`  
**Package**: `sy-sdk-testing` v0.1.0

**Why We Need It**: Extensions need testing infrastructure - ensures quality and prevents regressions.

**Role**: Testing utilities and mocking framework for extension development.

**Responsibilities**:
- Provide mock implementations of core services
- Offer test fixtures and helpers
- Enable integration testing
- Provide assertion utilities
- Support property-based testing

**Idea & Behavior**: Test-driven development support - makes it easy to write tests for extensions. Mocks isolate extension from dependencies. Fixtures provide common test scenarios.

---

### 16. `extension/sdk/carets`

**Path**: `apps/backend/extension/sdk/carets/`  
**Package**: `sy-sdk-carets` v0.1.0

**Why We Need It**: "Carets" is Symphony's term for extensions - need branded SDK with templates and CLI tools.

**Role**: Complete developer SDK with CLI, templates, and publishing tools (the "Carets SDK").

**Responsibilities**:
- Provide CLI for scaffolding extensions
- Offer templates for Instruments, Operators, Motifs
- Enable hot-reload during development
- Provide publishing tools for marketplace
- Generate boilerplate code
- Validate extension manifests

**Idea & Behavior**: Full development lifecycle support - from `carets new my-extension` to `carets publish`. Templates provide best-practice starting points. Hot-reload speeds development. Publishing tools integrate with Orchestra Kit marketplace.

---

### 17. `extension/sdk/metrics`

**Path**: `apps/backend/extension/sdk/metrics/`  
**Package**: `sy-sdk-metrics` v0.1.0

**Why We Need It**: Extensions need observability - developers must understand performance and behavior.

**Role**: Performance monitoring and metrics collection for extensions.

**Responsibilities**:
- Collect extension performance metrics
- Track resource usage (CPU, memory)
- Measure operation latency
- Export metrics to Prometheus/Grafana
- Provide dashboards for visualization
- Alert on anomalies

**Idea & Behavior**: Built-in observability - extensions automatically instrumented. Metrics exported to standard monitoring tools. Helps developers optimize extensions and diagnose issues.

---

## Part V: Conductor Integration

### 18. `conductor/bindings`

**Path**: `apps/backend/conductor/bindings/`  
**Package**: `sy-conductor-bindings` v0.1.0

**Why We Need It**: Python Conductor needs to call Rust Pit extensions - PyO3 provides FFI bridge.

**Role**: PyO3 bindings exposing Rust Pit extensions to Python Conductor.

**Responsibilities**:
- Export Pit extension functions to Python
- Handle type conversion (Python ↔ Rust)
- Manage error translation
- Enable async/await across FFI boundary
- Provide zero-copy data passing where possible

**Idea & Behavior**: Minimal overhead FFI - PyO3 enables direct function calls from Python to Rust with ~0.01ms overhead. Type conversion handled automatically. Errors translated to Python exceptions. Enables Conductor to use Pit extensions as if they were Python libraries.

---

### 19. `conductor/orchestration_bridge`

**Path**: `apps/backend/conductor/orchestration_bridge/`  
**Package**: `sy-conductor-orchestration-bridge` v0.1.0

**Why We Need It**: Conductor's RL model needs to interface with Symphony's workflow system.

**Role**: Bridge between Python Conductor's RL model and Rust orchestration infrastructure.

**Responsibilities**:
- Translate RL decisions to workflow actions
- Provide workflow state to RL model
- Handle reward signal calculation
- Enable training data collection
- Coordinate with DAG Tracker
- Manage model checkpointing

**Idea & Behavior**: RL integration layer - converts between RL model's action space and Symphony's workflow operations. Collects training data from workflow executions. Enables Conductor to learn from experience.

---

### 20. `conductor/extension_proxy`

**Path**: `apps/backend/conductor/extension_proxy/`  
**Package**: `sy-conductor-extension-proxy` v0.1.0

**Why We Need It**: Conductor needs unified interface to all extensions (Pit + UFE) regardless of execution model.

**Role**: Proxy providing uniform interface to extensions for the Conductor.

**Responsibilities**:
- Abstract in-process vs out-of-process differences
- Route calls to appropriate extensions
- Handle IPC for out-of-process extensions
- Provide synchronous API over async operations
- Cache extension capabilities
- Manage extension discovery

**Idea & Behavior**: Transparency layer - Conductor doesn't know if extension is in-process or out-of-process. Proxy handles routing and communication. Simplifies Conductor logic by hiding distribution complexity.

---

---

## Part VI: Bootstrap System

### 21. `bootstrap/core`

**Path**: `apps/backend/bootstrap/core/`  
**Package**: `sy-bootstrap-core` v0.1.0

**Why We Need It**: Symphony has 40+ packages with complex dependencies - need coordinated startup to avoid initialization failures.

**Role**: Bootstrap manager orchestrating staged initialization of all Symphony components.

**Responsibilities**:
- Coordinate startup sequence across all packages
- Manage dependency order (types → config → IPC → Pit → Conductor)
- Handle initialization failures gracefully
- Provide rollback on startup errors
- Track initialization progress
- Ensure clean shutdown sequence

**Idea & Behavior**: Phased initialization - starts with foundation (types, config), then infrastructure (IPC, Pit), then orchestration (Conductor), finally applications. Dependency graph ensures correct order. Rollback on failure prevents partial initialization.

---

### 22. `bootstrap/phase_manager`

**Path**: `apps/backend/bootstrap/phase_manager/`  
**Package**: `sy-bootstrap-phase-manager` v0.1.0

**Why We Need It**: Different components need different initialization phases - prevents race conditions and dependency issues.

**Role**: Phase manager dividing startup into distinct stages with clear boundaries.

**Responsibilities**:
- Define initialization phases (Foundation → Infrastructure → Orchestration → Application)
- Enforce phase boundaries
- Track phase completion
- Coordinate parallel initialization within phases
- Handle phase timeouts
- Provide phase status reporting

**Idea & Behavior**: Stage-gate process - each phase must complete before next begins. Within a phase, components can initialize in parallel. Timeouts prevent hanging. Clear phases make debugging easier.

---

### 23. `bootstrap/health_checker`

**Path**: `apps/backend/bootstrap/health_checker/`  
**Package**: `sy-bootstrap-health-checker` v0.1.0

**Why We Need It**: Components can fail silently during startup - need verification before declaring system ready.

**Role**: Health verification system checking all components after initialization.

**Responsibilities**:
- Verify each component is healthy after init
- Run health checks (ping, resource availability, connectivity)
- Detect failed components
- Report health status
- Trigger recovery for unhealthy components
- Provide readiness probe for orchestrators

**Idea & Behavior**: Post-initialization validation - after bootstrap, runs health checks on all components. Fails fast if critical components unhealthy. Provides readiness signal for load balancers/orchestrators.

---

## Part VII: IPC Communication Backbone

### 24. `ipc_bus`

**Path**: `apps/backend/ipc_bus/`  
**Package**: `syipcbus` v0.1.0

**Why We Need It**: Conductor and 100+ extensions need to communicate - need high-performance, reliable message bus.

**Role**: Core IPC bus providing communication backbone between Conductor and all out-of-process extensions.

**Responsibilities**:
- Route messages between processes
- Manage extension process lifecycle
- Handle process registration/discovery
- Monitor process health
- Provide multiple transport options (Unix sockets, named pipes, shared memory)
- Ensure message delivery guarantees

**Idea & Behavior**: Hardcoded Rust crate (not an extension) - too critical to be pluggable. Multi-transport support for flexibility. Process manager tracks all extension processes. Target: 0.1-0.3ms message latency.

---

### 25. `ipc_bus/protocol`

**Path**: `apps/backend/ipc_bus/protocol/`  
**Package**: `syipcbus-protocol` v0.1.0

**Why We Need It**: Binary serialization is 10x faster than JSON - critical for high-throughput IPC.

**Role**: Message serialization protocol for IPC bus.

**Responsibilities**:
- Define message format (header + payload)
- Serialize/deserialize messages (MessagePack or bincode)
- Handle message framing
- Provide versioning for protocol evolution
- Validate message integrity
- Support zero-copy where possible

**Idea & Behavior**: Binary protocol for performance - MessagePack or bincode for compact, fast serialization. Framing prevents message boundary issues. Versioning enables protocol upgrades without breaking compatibility.

---

### 26. `ipc_bus/transport`

**Path**: `apps/backend/ipc_bus/transport/`  
**Package**: `syipcbus-transport` v0.1.0

**Why We Need It**: Different platforms need different IPC mechanisms - Unix sockets (Linux/macOS) vs Named pipes (Windows).

**Role**: Transport layer abstraction supporting multiple IPC mechanisms.

**Responsibilities**:
- Implement Unix domain sockets (Linux/macOS)
- Implement Named pipes (Windows)
- Implement shared memory for high-frequency data
- Provide unified transport API
- Handle connection management
- Support async I/O

**Idea & Behavior**: Platform-specific implementations with common interface. Unix sockets for control messages (0.1-0.3ms), shared memory for high-frequency data (0.01-0.05ms). Async I/O prevents blocking.

---

### 27. `ipc_bus/security`

**Path**: `apps/backend/ipc_bus/security/`  
**Package**: `syipcbus-security` v0.1.0

**Why We Need It**: Malicious extensions could exploit IPC - need authentication and validation.

**Role**: Security layer for IPC bus providing authentication and message validation.

**Responsibilities**:
- Authenticate extension processes
- Validate message integrity
- Enforce permission checks
- Prevent message tampering
- Rate limit messages
- Audit security events

**Idea & Behavior**: Defense in depth - multiple security layers. Process authentication prevents impersonation. Message validation prevents malformed messages. Rate limiting prevents DoS attacks.

---

## Part VIII: Orchestration Engine

### 28. `orchestration/core`

**Path**: `apps/backend/orchestration/core/`  
**Package**: `sy-orchestration-core` v0.1.0

**Why We Need It**: Workflows need execution engine separate from Conductor - enables non-RL orchestration modes.

**Role**: Workflow execution engine that can run workflows with or without Conductor.

**Responsibilities**:
- Execute workflows defined as DAGs
- Coordinate with DAG Tracker
- Allocate resources via Pool Manager
- Store results via Artifact Store
- Support manual and automated orchestration
- Provide execution monitoring

**Idea & Behavior**: Flexible orchestration - supports Conductor-driven (RL-based) and manual workflows. Delegates to Pit extensions for actual work. Enables "Maestro Mode" (full AI) and "Manual Mode" (user-driven).

---

### 29. `orchestration/melody_engine`

**Path**: `apps/backend/orchestration/melody_engine/`  
**Package**: `sy-orchestration-melody-engine` v0.1.0

**Why We Need It**: "Melodies" are Symphony's term for reusable workflows - need engine to compose and execute them.

**Role**: Melody composition and execution engine for visual workflow designer (n8n-style).

**Responsibilities**:
- Load melody definitions (workflow templates)
- Compose melodies from nodes
- Validate melody structure
- Execute melodies
- Support melody marketplace
- Enable drag-and-drop workflow composition

**Idea & Behavior**: Visual workflow system - users compose workflows by connecting nodes. Melodies are reusable templates. Marketplace enables sharing. Integrates with Harmony Board (visual designer).

---

## Part IX: Orchestra Kit (Extension Ecosystem)

### 30. `kit/core`

**Path**: `apps/backend/kit/core/`  
**Package**: `sy-kit-core` v0.1.0

**Why We Need It**: Extension ecosystem needs foundation - common infrastructure for all Kit components.

**Role**: Core infrastructure for Orchestra Kit (extension marketplace and management).

**Responsibilities**:
- Define extension types (Instruments, Operators, Motifs)
- Provide base extension traits
- Coordinate Kit components
- Manage extension metadata
- Handle extension discovery
- Provide Kit-wide utilities

**Idea & Behavior**: Foundation for extension ecosystem - all Kit components depend on this. Defines three extension types matching Symphony's metaphor (Instruments = AI models, Operators = workflows, Motifs = UI).

---

### 31. `kit/harmony_board`

**Path**: `apps/backend/kit/harmony_board/`  
**Package**: `sy-kit-harmony-board` v0.1.0

**Why We Need It**: Visual workflow designer makes Symphony accessible to non-programmers.

**Role**: Visual workflow designer ("Harmony Board") - Symphony's version of n8n/Zapier.

**Responsibilities**:
- Provide visual workflow editor
- Enable drag-and-drop node composition
- Visualize workflow execution in real-time
- Show data flow between nodes
- Highlight active nodes during execution
- Provide debugging tools

**Idea & Behavior**: Real-time visualization - shows workflow execution as it happens. Drag-and-drop makes workflow creation intuitive. Debugging tools help diagnose issues. Integrates with Melody Engine.

---

### 32. `kit/instruments`

**Path**: `apps/backend/kit/instruments/`  
**Package**: `sy-kit-instruments` v0.1.0

**Why We Need It**: AI/ML models are first-class extensions - need standardized interface.

**Role**: 🎻 Instrument extension type - AI/ML models as extensions.

**Responsibilities**:
- Define Instrument trait
- Provide base implementation
- Handle model loading/unloading
- Manage model inference
- Support streaming responses
- Integrate with Pool Manager

**Idea & Behavior**: AI models as extensions - code generators, analyzers, refactoring tools all implement Instrument trait. Pool Manager handles resource allocation. Streaming enables real-time output.

---

### 33. `kit/operators`

**Path**: `apps/backend/kit/operators/`  
**Package**: `sy-kit-operators` v0.1.0

**Why We Need It**: Workflow utilities (file ops, git ops, data transforms) need standardized interface.

**Role**: ⚙️ Operator extension type - workflow utilities and data processing.

**Responsibilities**:
- Define Operator trait
- Provide base implementation
- Support file operations
- Support git operations
- Support data transformations
- Enable operator chaining

**Idea & Behavior**: Composable workflow utilities - operators can be chained together. Examples: read file → transform → write file. Git integration, data processing, external tool execution.

---

### 34. `kit/motifs`

**Path**: `apps/backend/kit/motifs/`  
**Package**: `sy-kit-motifs` v0.1.0

**Why We Need It**: UI customization (themes, components, layouts) needs standardized interface.

**Role**: 🧩 Motif extension type - UI/UX addons and visual enhancements.

**Responsibilities**:
- Define Motif trait
- Provide base implementation
- Support custom themes
- Support custom components
- Support layout modifications
- Integrate with Virtual DOM

**Idea & Behavior**: UI as extensions - themes, custom components, layout modifications all implement Motif trait. Uses Virtual DOM to generate React UI. Enables visual customization without forking.

---

### 35. `kit/marketplace`

**Path**: `apps/backend/kit/marketplace/`  
**Package**: `sy-kit-marketplace` v0.1.0

**Why We Need It**: Extension discovery and distribution - users need easy way to find and install extensions.

**Role**: Extension marketplace for discovering, browsing, and installing extensions.

**Responsibilities**:
- Browse available extensions
- Search extensions by category/tags
- Display extension details and ratings
- Handle extension downloads
- Verify extension signatures
- Track installed extensions

**Idea & Behavior**: App store for extensions - browse, search, install. Security verification prevents malicious extensions. Ratings and reviews guide users. Integrates with installer for seamless installation.

---

### 36. `kit/installer`

**Path**: `apps/backend/kit/installer/`  
**Package**: `sy-kit-installer` v0.1.0

**Why We Need It**: Extension installation is complex (dependencies, permissions, validation) - need automated installer.

**Role**: Extension installer handling download, dependency resolution, and installation.

**Responsibilities**:
- Download extensions from marketplace
- Resolve dependencies
- Verify signatures and checksums
- Install extensions to correct location
- Handle version conflicts
- Provide rollback on failure

**Idea & Behavior**: Package manager for extensions - like npm/cargo for Symphony extensions. Dependency resolution prevents conflicts. Signature verification ensures security. Rollback prevents broken installations.

---

### 37. `kit/lifecycle`

**Path**: `apps/backend/kit/lifecycle/`  
**Package**: `sy-kit-lifecycle` v0.1.0

**Why We Need It**: Extensions have complex lifecycle (install → load → activate → deactivate → unload → uninstall) - need state machine.

**Role**: Extension lifecycle manager implementing "Chambering" flow.

**Responsibilities**:
- Manage extension states (Installed → Loaded → Activated → Running)
- Handle state transitions
- Coordinate with IPC bus for process management
- Enable hot-swapping
- Support lazy loading
- Track extension health

**Idea & Behavior**: State machine for extensions - "Chambering" refers to loading extension into memory (like chambering a round). Lazy loading saves memory. Hot-swapping enables updates without restart.

---

### 38. `kit/registry`

**Path**: `apps/backend/kit/registry/`  
**Package**: `sy-kit-registry` v0.1.0

**Why We Need It**: Need central registry of all extensions (installed and available) - enables discovery and version management.

**Role**: Extension registry tracking all extensions and their metadata.

**Responsibilities**:
- Register installed extensions
- Track extension versions
- Provide extension discovery
- Handle extension metadata
- Support semantic versioning
- Enable extension search

**Idea & Behavior**: Central registry - single source of truth for extensions. Semantic versioning enables compatibility checks. Metadata enables rich search and filtering.

---

### 39. `kit/security`

**Path**: `apps/backend/kit/security/`  
**Package**: `sy-kit-security` v0.1.0

**Why We Need It**: Extensions run user code - need sandboxing and permission system to prevent malicious behavior.

**Role**: Security sandbox and permission system for extensions.

**Responsibilities**:
- Define permission model (filesystem, network, memory, CPU)
- Enforce permission checks
- Sandbox extension execution
- Limit resource usage
- Audit security events
- Provide capability-based security

**Idea & Behavior**: Defense in depth - multiple security layers. Capability-based permissions (extensions request specific capabilities). Resource limits prevent DoS. Sandboxing isolates extensions.

---

### 40. `kit/manifest`

**Path**: `apps/backend/kit/manifest/`  
**Package**: `sy-kit-manifest` v0.1.0

**Why We Need It**: Extensions need metadata (name, version, permissions, dependencies) - manifest provides this.

**Role**: Extension manifest parser and validator.

**Responsibilities**:
- Parse Symphony.toml manifests
- Validate manifest schema
- Extract extension metadata
- Verify required fields
- Support manifest versioning
- Provide manifest builder API

**Idea & Behavior**: Manifest-driven extensions - Symphony.toml defines extension metadata. Schema validation prevents malformed manifests. Versioning enables manifest evolution.

---

## Part X: Infrastructure Services

### 41. `permissions`

**Path**: `apps/backend/permissions/`  
**Package**: `sy-permissions` v0.1.0

**Why We Need It**: Global permission system for all components - ensures consistent security policy.

**Role**: System-wide permission management.

**Responsibilities**:
- Define global permission model
- Enforce permissions across all components
- Provide permission checking API
- Support role-based access control (RBAC)
- Audit permission checks
- Handle permission inheritance

**Idea & Behavior**: Centralized authorization - all permission checks go through this. RBAC enables flexible policies. Audit trail for compliance.

---

### 42. `logging`

**Path**: `apps/backend/logging/`  
**Package**: `sy-logging` v0.1.0

**Why We Need It**: 40+ packages generating logs - need centralized, structured logging for debugging and monitoring.

**Role**: Centralized logging and tracing infrastructure.

**Responsibilities**:
- Collect logs from all packages
- Provide structured logging (JSON)
- Support multiple log levels
- Export to files and external systems
- Enable distributed tracing
- Provide log aggregation

**Idea & Behavior**: Structured logging with tracing - uses tracing crate for spans and events. JSON output for machine parsing. Distributed tracing tracks requests across components.

---

### 43. `hooks`

**Path**: `apps/backend/hooks/`  
**Package**: `sy-hooks` v0.1.0

**Why We Need It**: Desktop app needs OS integration (notifications, file associations, protocol handlers) - hooks provide this.

**Role**: Desktop integration hooks for OS-level features.

**Responsibilities**:
- Handle desktop notifications
- Register file associations
- Register protocol handlers (symphony://)
- Integrate with system tray
- Handle deep links
- Provide OS-specific integrations

**Idea & Behavior**: Platform-specific integrations - uses Tauri APIs for desktop features. Enables "Open with Symphony" and symphony:// URLs. System tray for background operation.

---

## Part XI: Applications

### 44. `desktop`

**Path**: `apps/backend/desktop/`  
**Package**: `sy-desktop` v0.1.0

**Why We Need It**: Primary deployment target - most users run Symphony as desktop app.

**Role**: Tauri desktop application wrapping Symphony backend and React frontend.

**Responsibilities**:
- Embed Symphony backend (core + Conductor + Pit)
- Host React frontend in webview
- Provide native window management
- Handle OS integration
- Manage application lifecycle
- Provide Tauri commands for frontend

**Idea & Behavior**: Native desktop app - Tauri provides native window with embedded webview. Backend runs in-process. Smaller than Electron, better performance. Cross-platform (Windows, macOS, Linux).

---

### 45. `server`

**Path**: `apps/backend/server/`  
**Package**: `sy-server` v0.1.0

**Why We Need It**: Remote development and team collaboration - server mode enables Symphony as backend service.

**Role**: HTTP server mode for remote Symphony access.

**Responsibilities**:
- Run Symphony as HTTP server
- Provide WebSocket for real-time updates
- Handle authentication
- Support multiple concurrent clients
- Provide REST API
- Enable remote development

**Idea & Behavior**: Optional server mode - same backend as desktop, different frontend delivery. WebSocket for real-time collaboration. Authentication for security. Enables cloud-hosted Symphony.

---

### 46. `terminal`

**Path**: `apps/backend/terminal/`  
**Package**: `sy-terminal` v0.1.0

**Why We Need It**: Integrated terminal is essential IDE feature - need cross-platform PTY support.

**Role**: Cross-platform terminal/PTY integration.

**Responsibilities**:
- Provide pseudo-terminal (PTY) support
- Handle shell process spawning
- Support Windows (ConPTY) and Unix (PTY)
- Integrate with xterm.js frontend
- Handle terminal resizing
- Support multiple terminal instances

**Idea & Behavior**: Cross-platform terminal - uses crosspty for platform abstraction. Spawns native shell (PowerShell/bash/zsh). xterm.js frontend for rendering. Multiple terminals supported.

---

**[Complete - All 46 packages documented]**
