# F006 - Binary Communication Bridge - Planning

**Feature ID**: F006  
**Planning Date**: December 28, 2025  
**Estimated Effort**: 4 days  
**Implementation Priority**: 5 (After F005)  

---

## Implementation Strategy

### High-Level Approach

Implement comprehensive binary communication bridge connecting Symphony and XI-editor processes. Focus on JSON-RPC client implementation, event streaming, state synchronization, and process lifecycle management to achieve <1ms JSON-RPC latency and <10ms event streaming.

### Technical Decisions

#### XI-editor Integration Strategy
**Decision**: Use existing XI-editor binary as-is with JSON-RPC over STDIO  
**Rationale**: Avoids XI-editor source modifications while leveraging proven text editing engine  
**Alternative Considered**: Fork and modify XI-editor  
**Why Rejected**: Increases maintenance burden and complexity  

#### State Synchronization Approach
**Decision**: Local buffer metadata cache with XI-editor synchronization  
**Rationale**: Reduces XI-editor queries while maintaining consistency  
**Alternative Considered**: Query XI-editor for all state  
**Why Rejected**: Would create performance bottleneck  

#### Process Management Strategy
**Decision**: Symphony manages XI-editor as subprocess with health monitoring  
**Rationale**: Provides control over XI-editor lifecycle and failure recovery  
**Alternative Considered**: External XI-editor process management  
**Why Rejected**: Complicates deployment and error recovery  

## Component Breakdown

### 1. XI-editor Process Management (`src/process.rs`)
**Responsibility**: XI-editor subprocess lifecycle management  
**Key Components**:
- Process spawning and configuration
- Health monitoring and failure detection
- Automatic restart mechanisms
- Process cleanup and resource management

### 2. JSON-RPC Client (`src/jsonrpc_client.rs`)
**Responsibility**: Symphony → XI-editor communication  
**Key Components**:
- JSON-RPC 2.0 compliant client
- Request/response correlation
- XI-editor operation wrappers
- Error handling and retry logic

### 3. Event Streaming (`src/event_stream.rs`)
**Responsibility**: XI-editor → Symphony event processing  
**Key Components**:
- STDIO event parsing and routing
- Event filtering and transformation
- Real-time event delivery
- Event correlation and ordering

### 4. State Synchronization (`src/state_sync.rs`)
**Responsibility**: Buffer and file state coordination  
**Key Components**:
- Buffer metadata cache
- File system change detection
- State synchronization coordinator
- Conflict resolution mechanisms

### 5. XI-editor Adapter (`src/xi_adapter.rs`)
**Responsibility**: TextEditingPort implementation  
**Key Components**:
- Complete TextEditingPort trait implementation
- XI-editor operation mapping
- Error translation and handling
- Performance optimization

## Phase-Specific Dependencies Analysis

### Phase 1: XI-editor Process Management - Dependencies ✅ COMPLETE

| Library | Purpose | Alternative 1 | Alternative 2 | Alternative 3 | Cross-Platform | Local Env | Cloud Env | Consistency & Stability | Maintained | Ecosystem | Limitation 1 | Limitation 2 | Limitation 3 | Decision | Rationale |
|---------|---------|---------------|---------------|---------------|----------------|-----------|-----------|------------------------|------------|-----------|--------------|--------------|--------------|----------|-----------|
| tokio 1.35.1 | Async runtime for process management | async-std | smol | custom | ✅ All platforms | ✅ Works | ✅ Works | ✅ Very stable | ✅ Active (2024-12) | High | Large binary size | Learning curve | N/A | ✅ Selected | Industry standard async runtime |
| tokio::process | Subprocess management | std::process | async-process | nix crate | ✅ All platforms | ✅ Works | ✅ Works | ✅ Very stable | ✅ Active (2024-12) | High | Platform differences | Complex lifecycle | Limited control | ✅ Selected | Best async process management |
| tracing 0.1.40 | Structured logging | log + env_logger | slog | custom | ✅ All platforms | ✅ Works | ✅ Works | ✅ Very stable | ✅ Active (2024-12) | High | Overhead | Complex setup | N/A | ✅ Selected | Structured logging with spans |
| thiserror 1.0.50 | Error handling | anyhow | eyre | custom | ✅ All platforms | ✅ Works | ✅ Works | ✅ Very stable | ✅ Active (2024-11) | High | Compile time | Boilerplate | N/A | ✅ Selected | Ergonomic error types |

**Phase 1 Cargo.toml Dependencies**:
```toml
[dependencies]
tokio = { version = "1.35.1", features = ["process", "time", "sync", "rt-multi-thread"] }
tracing = "0.1.40"
thiserror = "1.0.50"
```

### Phase 2: JSON-RPC Client - Dependencies ✅ COMPLETE

| Library | Purpose | Alternative 1 | Alternative 2 | Alternative 3 | Cross-Platform | Local Env | Cloud Env | Consistency & Stability | Maintained | Ecosystem | Limitation 1 | Limitation 2 | Limitation 3 | Decision | Rationale |
|---------|---------|---------------|---------------|---------------|----------------|-----------|-----------|------------------------|------------|-----------|--------------|--------------|--------------|----------|-----------|
| serde_json 1.0.108 | JSON-RPC serialization | simd-json | sonic-rs | custom | ✅ All platforms | ✅ Works | ✅ Works | ✅ Very stable | ✅ Active (2024-12) | High | Not fastest | Large messages | Memory usage | ✅ Selected | JSON-RPC standard compliance |
| serde 1.0.193 | Serialization framework | bincode | rmp-serde | custom | ✅ All platforms | ✅ Works | ✅ Works | ✅ Very stable | ✅ Active (2024-12) | High | Derive overhead | Complex types | N/A | ✅ Selected | De facto standard |
| tokio::io | Async I/O for STDIO | async-std::io | futures::io | custom | ✅ All platforms | ✅ Works | ✅ Works | ✅ Very stable | ✅ Active (2024-12) | High | Tokio coupling | Buffer management | N/A | ✅ Selected | Integrated with tokio runtime |
| uuid 1.6.1 | Request ID generation | nanoid | ulid | custom | ✅ All platforms | ✅ Works | ✅ Works | ✅ Very stable | ✅ Active (2024-11) | High | Size overhead | Collision risk | N/A | ✅ Selected | Standard UUID implementation |

**Phase 2 Cargo.toml Dependencies**:
```toml
[dependencies]
serde = { version = "1.0.193", features = ["derive"] }
serde_json = "1.0.108"
uuid = { version = "1.6.1", features = ["v4"] }
tokio = { version = "1.35.1", features = ["io-util", "sync"] }
```

### Phase 3: Event Streaming - Dependencies 🔄 NEXT

| Library | Purpose | Alternative 1 | Alternative 2 | Alternative 3 | Cross-Platform | Local Env | Cloud Env | Consistency & Stability | Maintained | Ecosystem | Limitation 1 | Limitation 2 | Limitation 3 | Decision | Rationale |
|---------|---------|---------------|---------------|---------------|----------------|-----------|-----------|------------------------|------------|-----------|--------------|--------------|--------------|----------|-----------|
| tokio::io::BufReader | Line-by-line STDOUT reading | std::io::BufReader | async-std::BufReader | custom | ✅ All platforms | ✅ Works | ✅ Works | ✅ Very stable | ✅ Active (2024-12) | High | Memory usage | Line length limits | N/A | ✅ Selected | Async buffered reading |
| tokio::sync::mpsc | Event channel communication | crossbeam-channel | flume | async-channel | ✅ All platforms | ✅ Works | ✅ Works | ✅ Very stable | ✅ Active (2024-12) | High | Tokio coupling | Bounded channels | N/A | ✅ Selected | Integrated with tokio |
| dashmap 5.5.3 | Concurrent event routing | std::HashMap + Mutex | parking_lot::RwLock | custom | ✅ All platforms | ✅ Works | ✅ Works | ✅ Stable | ✅ Active (2024-10) | Moderate | Memory overhead | Lock contention | N/A | ✅ Selected | Lock-free concurrent map |
| regex 1.10.2 | Event pattern matching | nom | pest | custom | ✅ All platforms | ✅ Works | ✅ Works | ✅ Very stable | ✅ Active (2024-11) | High | Compile time | Memory usage | Performance | ⚠️ Optional | Only if pattern matching needed |

**Phase 3 Cargo.toml Dependencies**:
```toml
[dependencies]
tokio = { version = "1.35.1", features = ["io-util", "sync"] }
dashmap = "5.5.3"
# regex = "1.10.2"  # Optional for pattern matching
```

### Phase 4: State Synchronization - Dependencies 🔄 PENDING

| Library | Purpose | Alternative 1 | Alternative 2 | Alternative 3 | Cross-Platform | Local Env | Cloud Env | Consistency & Stability | Maintained | Ecosystem | Limitation 1 | Limitation 2 | Limitation 3 | Decision | Rationale |
|---------|---------|---------------|---------------|---------------|----------------|-----------|-----------|------------------------|------------|-----------|--------------|--------------|--------------|----------|-----------|
| notify 6.1.1 | File system watching | inotify directly | polling | custom | ✅ All platforms | ✅ Works | ✅ Works | ✅ Stable | ✅ Active (2024-11) | High | Platform differences | Event delays | Resource usage | ✅ Selected | Cross-platform file watching |
| lru 0.12.1 | LRU cache implementation | moka | mini-moka | custom | ✅ All platforms | ✅ Works | ✅ Works | ✅ Stable | ✅ Active (2024-09) | Moderate | No async support | Memory overhead | N/A | ✅ Selected | Simple and efficient |
| chrono 0.4.31 | Timestamp handling | time | std::time | custom | ✅ All platforms | ✅ Works | ✅ Works | ✅ Very stable | ✅ Active (2024-11) | High | Large dependency | Timezone complexity | N/A | ✅ Selected | Comprehensive time handling |
| parking_lot 0.12.1 | High-performance locks | std::sync | tokio::sync | spin | ✅ All platforms | ✅ Works | ✅ Works | ✅ Very stable | ✅ Active (2024-08) | High | Not async-aware | Potential deadlocks | N/A | ✅ Selected | Faster than std locks |

**Phase 4 Cargo.toml Dependencies**:
```toml
[dependencies]
notify = "6.1.1"
lru = "0.12.1"
chrono = { version = "0.4.31", features = ["serde"] }
parking_lot = "0.12.1"
```

### Phase 5: XI-editor Adapter - Dependencies 🔄 PENDING

| Library | Purpose | Alternative 1 | Alternative 2 | Alternative 3 | Cross-Platform | Local Env | Cloud Env | Consistency & Stability | Maintained | Ecosystem | Limitation 1 | Limitation 2 | Limitation 3 | Decision | Rationale |
|---------|---------|---------------|---------------|---------------|----------------|-----------|-----------|------------------------|------------|-----------|--------------|--------------|--------------|----------|-----------|
| async-trait 0.1.74 | Async trait support | manual impl | GATs | custom | ✅ All platforms | ✅ Works | ✅ Works | ✅ Very stable | ✅ Active (2024-10) | High | Proc macro overhead | Boxing futures | N/A | ✅ Selected | Required for async traits |
| once_cell 1.19.0 | Lazy static initialization | lazy_static | std::sync::OnceLock | custom | ✅ All platforms | ✅ Works | ✅ Works | ✅ Very stable | ✅ Active (2024-09) | High | Runtime overhead | Thread safety | N/A | ✅ Selected | Better than lazy_static |
| metrics 0.21.1 | Performance monitoring | prometheus | custom | tracing | ✅ All platforms | ✅ Works | ✅ Works | ✅ Stable | ✅ Active (2024-08) | Moderate | Overhead | Complex setup | N/A | ✅ Selected | Lightweight metrics |
| sy-commons | Symphony common utilities | custom | N/A | N/A | ✅ All platforms | ✅ Works | ✅ Works | ✅ Stable | ✅ Internal | High | Internal dependency | N/A | N/A | ✅ Selected | Symphony integration |

**Phase 5 Cargo.toml Dependencies**:
```toml
[dependencies]
async-trait = "0.1.74"
once_cell = "1.19.0"
metrics = "0.21.1"
sy-commons = { path = "../utils/sy-commons" }
```

### Phase 6: Integration and Testing - Dependencies 🔄 PENDING

| Library | Purpose | Alternative 1 | Alternative 2 | Alternative 3 | Cross-Platform | Local Env | Cloud Env | Consistency & Stability | Maintained | Ecosystem | Limitation 1 | Limitation 2 | Limitation 3 | Decision | Rationale |
|---------|---------|---------------|---------------|---------------|----------------|-----------|-----------|------------------------|------------|-----------|--------------|--------------|--------------|----------|-----------|
| criterion 0.5.1 | Performance benchmarking | bencher | divan | custom | ✅ All platforms | ✅ Works | ✅ Works | ✅ Very stable | ✅ Active (2024-11) | High | Large dependency | Slow compilation | N/A | ✅ Selected | Industry standard benchmarking |
| tempfile 3.8.1 | Temporary files for testing | std::env::temp_dir | custom | N/A | ✅ All platforms | ✅ Works | ✅ Works | ✅ Very stable | ✅ Active (2024-09) | High | Cleanup complexity | Platform differences | N/A | ✅ Selected | Reliable temp file handling |
| mockall 0.12.1 | Mock generation for testing | mockito | manual mocks | custom | ✅ All platforms | ✅ Works | ✅ Works | ✅ Stable | ✅ Active (2024-09) | High | Proc macro overhead | Complex setup | N/A | ✅ Selected | Powerful mocking framework |
| tokio-test 0.4.3 | Tokio testing utilities | custom | N/A | N/A | ✅ All platforms | ✅ Works | ✅ Works | ✅ Stable | ✅ Active (2024-08) | Moderate | Limited features | Tokio coupling | N/A | ✅ Selected | Tokio-specific testing |

**Phase 6 Cargo.toml Dependencies**:
```toml
[dev-dependencies]
criterion = { version = "0.5.1", features = ["html_reports"] }
tempfile = "3.8.1"
mockall = "0.12.1"
tokio-test = "0.4.3"
```

## Complete Cargo.toml for F006

```toml
[package]
name = "sy-xi-adapter"
version = "0.1.0"
edition = "2021"

[dependencies]
# Core async runtime and utilities
tokio = { version = "1.35.1", features = [
    "process", "time", "sync", "rt-multi-thread", 
    "io-util", "macros"
] }

# Serialization and JSON-RPC
serde = { version = "1.0.193", features = ["derive"] }
serde_json = "1.0.108"

# Error handling and logging
thiserror = "1.0.50"
tracing = "0.1.40"

# Async traits and utilities
async-trait = "0.1.74"
once_cell = "1.19.0"

# Concurrency and caching
dashmap = "5.5.3"
lru = "0.12.1"
parking_lot = "0.12.1"

# File system and time
notify = "6.1.1"
chrono = { version = "0.4.31", features = ["serde"] }

# Utilities
uuid = { version = "1.6.1", features = ["v4"] }
metrics = "0.21.1"

# Symphony integration
sy-commons = { path = "../utils/sy-commons" }

[dev-dependencies]
# Testing framework
tokio-test = "0.4.3"
tempfile = "3.8.1"
mockall = "0.12.1"

# Benchmarking
criterion = { version = "0.5.1", features = ["html_reports"] }

# Test data generation (from sy-commons)
fake = "2.9.2"

[[bench]]
name = "jsonrpc_bench"
harness = false

[[bench]]
name = "event_stream_bench"
harness = false

[[bench]]
name = "full_system_bench"
harness = false
```

## Alternative Libraries Considered and Rejected

### High-Performance JSON Libraries (Rejected for Phase 2)
- **simd-json 0.13.4**: 2-3x faster than serde_json but requires unsafe code and has platform limitations
- **sonic-rs 0.3.2**: Very fast but immature ecosystem and potential stability issues
- **Decision**: Stick with serde_json for stability and ecosystem compatibility

### Alternative Async Runtimes (Rejected for All Phases)
- **async-std 1.12.0**: Good alternative but smaller ecosystem than tokio
- **smol 2.0.0**: Lightweight but limited features for complex process management
- **Decision**: Tokio provides the most comprehensive async ecosystem

### Alternative Caching Solutions (Rejected for Phase 4)
- **moka 0.12.1**: More features but higher complexity and memory usage
- **mini-moka 0.10.2**: Lighter but lacks some LRU features we need
- **Decision**: Simple lru crate meets our needs with minimal overhead

### Alternative File Watching (Rejected for Phase 4)
- **Direct inotify/kqueue**: Platform-specific, complex cross-platform support
- **Polling-based**: Simple but inefficient and high latency
- **Decision**: notify crate provides best cross-platform abstraction

#### Tauri Commands Reference

This feature implements Tauri commands for XI-editor integration:

| Tauri Command | Location | Description |
|---------------|----------|-------------|
| create_buffer | src-tauri/src/commands/text_editing.rs | Creates new buffer in XI-editor |
| insert_text | src-tauri/src/commands/text_editing.rs | Inserts text at cursor position |
| save_buffer | src-tauri/src/commands/text_editing.rs | Saves buffer to file |
| get_buffer_content | src-tauri/src/commands/text_editing.rs | Retrieves current buffer content |

## Implementation Phases

### Phase 1: XI-editor Process Management (Day 1, Morning) ✅ COMPLETE
**Objective**: Establish reliable XI-editor subprocess management with health monitoring and automatic recovery.

**Technical Approach**:
- Use `tokio::process::Command` for async subprocess management
- Implement health monitoring with 5-second intervals
- Create automatic restart with exponential backoff (max 5 restarts)
- Handle graceful shutdown with 5-second timeout before force kill

**Key Components**:
- `XiEditorProcessManager` struct with process lifecycle management
- `XiEditorConfig` for process configuration and environment setup
- `ProcessStatus` enum for status tracking and event notification
- Health monitoring task with automatic failure detection

**Deliverables**:
- [x] `src/process.rs` - Process management implementation
- [x] Process spawning with configurable arguments and environment
- [x] Health monitoring with automatic restart on failure
- [x] Graceful shutdown with timeout and force kill fallback
- [x] Status notification system for process events

**Testing Strategy**:
- Unit tests with mock process behavior
- Integration tests with real XI-editor binary
- Failure scenario testing (process crashes, hangs)
- Performance testing for startup and restart times

### Phase 2: JSON-RPC Client (Day 1, Afternoon) ✅ COMPLETE
**Objective**: Implement high-performance JSON-RPC client for Symphony → XI-editor communication with <1ms latency.

**Technical Approach**:
- Use `serde_json` for JSON-RPC 2.0 compliant serialization
- Implement request/response correlation with unique IDs
- Create async communication with timeout handling
- Wrap XI-editor operations in type-safe methods

**Key Components**:
- `XiJsonRpcClient` struct with async JSON-RPC communication
- Request correlation map for matching responses to requests
- XI-editor operation wrappers (new_view, edit, save, insert, click)
- Error handling with retry logic and timeout management

**Deliverables**:
- [x] `src/jsonrpc_client.rs` - JSON-RPC client implementation
- [x] Request/response correlation with atomic ID generation
- [x] XI-editor operation wrappers with type safety
- [x] Error handling and timeout management
- [x] Performance monitoring with latency warnings

**Testing Strategy**:
- Unit tests with mock XI-editor responses
- JSON-RPC protocol compliance testing
- Performance testing for <1ms latency target
- Error scenario testing (timeouts, invalid responses)

### Phase 3: Event Streaming (Day 2, Morning) 🔄 NEXT
**Objective**: Implement reliable XI-editor → Symphony event streaming with <10ms delivery time and ordered processing.

**Technical Approach**:
- Parse STDOUT from XI-editor process line-by-line
- Distinguish between JSON-RPC responses and XI-editor events
- Route events to appropriate Symphony components
- Maintain event ordering and handle parsing errors gracefully

**Key Components**:
- `XiEventStream` struct for STDOUT processing
- Event parsing with JSON deserialization
- Event routing to Symphony message bus
- Error handling for malformed messages

**Deliverables**:
- [ ] `src/event_stream.rs` - Event streaming implementation
- [ ] STDOUT line-by-line parsing with async I/O
- [ ] Event type discrimination (JSON-RPC vs XI events)
- [ ] Event routing to Symphony components
- [ ] Performance monitoring for <10ms delivery target

**Testing Strategy**:
- Unit tests with mock XI-editor event streams
- Event parsing validation for all XI-editor event types
- Performance testing for delivery time targets
- Error handling testing for malformed events

### Phase 4: State Synchronization (Day 2, Afternoon) 🔄 PENDING
**Objective**: Implement buffer and file state synchronization between Symphony and XI-editor with <10ms consistency.

**Technical Approach**:
- Maintain local buffer metadata cache for performance
- Use `notify` crate for file system change detection
- Implement conflict resolution with last-write-wins strategy
- Synchronize state changes bidirectionally

**Key Components**:
- `StateSynchronizer` struct for state coordination
- Buffer metadata cache with LRU eviction
- File system watcher for external changes
- Conflict resolution mechanisms

**Deliverables**:
- [ ] `src/state_sync.rs` - State synchronization implementation
- [ ] Buffer metadata cache with performance optimization
- [ ] File system change detection and notification
- [ ] Bidirectional state synchronization
- [ ] Conflict resolution with user notification

**Testing Strategy**:
- Unit tests with mock file system events
- State consistency validation under concurrent changes
- Performance testing for synchronization speed
- Conflict resolution scenario testing

### Phase 5: XI-editor Adapter (Day 3, Morning) 🔄 PENDING
**Objective**: Implement complete TextEditingPort trait to integrate XI-editor with Symphony's H2A2 architecture.

**Technical Approach**:
- Implement all TextEditingPort trait methods
- Map Symphony operations to XI-editor JSON-RPC calls
- Translate errors between Symphony and XI-editor formats
- Optimize performance for frequent operations

**Key Components**:
- `XiEditorAdapter` struct implementing TextEditingPort
- Operation mapping from Symphony to XI-editor
- Error translation and handling
- Performance optimization for hot paths

**Deliverables**:
- [ ] `src/xi_adapter.rs` - TextEditingPort implementation
- [ ] Complete trait method implementation
- [ ] Error translation system
- [ ] Performance optimization for common operations
- [ ] Integration with Symphony's port system

**Testing Strategy**:
- Unit tests for all TextEditingPort methods
- Integration testing with Symphony core
- Performance testing for operation latency
- Error handling validation

### Phase 6: Integration and Testing (Day 3, Afternoon) 🔄 PENDING
**Objective**: Integrate all components and validate complete system functionality with comprehensive testing.

**Technical Approach**:
- Integrate all bridge components into cohesive system
- Implement comprehensive test suite covering all scenarios
- Performance benchmark entire communication pipeline
- Validate XI-editor compatibility across versions

**Key Components**:
- Complete system integration
- End-to-end test suite
- Performance benchmarking
- Compatibility validation

**Deliverables**:
- [ ] Complete system integration
- [ ] Comprehensive test suite (unit + integration)
- [ ] Performance benchmarks and validation
- [ ] XI-editor compatibility testing
- [ ] Documentation and deployment guides

**Testing Strategy**:
- End-to-end integration testing
- Performance validation against all targets
- Stress testing under high load
- Compatibility testing with XI-editor versions

---

**Planning Complete**: Ready for DESIGN phase