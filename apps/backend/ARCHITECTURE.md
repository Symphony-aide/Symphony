# Symphony Backend Architecture

## Overview

Symphony's backend is built on a **two-layer architecture** that combines the battle-tested XI-editor foundation with Symphony's custom AIDE (AI-First Development Environment) features.

### Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Symphony AIDE Layer                       │
│  (AI Orchestration, Workflows, Agents - Built by Symphony)  │
│                                                              │
│  • The Conductor (orchestration)                            │
│  • Artifact Store (content-addressable storage)             │
│  • DAG Tracker (workflow execution)                         │
│  • Pool Manager (AI model lifecycle)                        │
│  • Extension Ecosystem (Instruments, Operators, Motifs)     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    XI-editor Foundation                      │
│        (Text Editing Core - Proven & Stable)                │
│                                                              │
│  • Rope data structure (efficient text manipulation)        │
│  • JSON-RPC (frontend-backend communication)                │
│  • LSP support (language intelligence)                      │
│  • Plugin system (extensibility)                            │
│  • Syntax highlighting (TextMate grammars via Syntect)      │
└─────────────────────────────────────────────────────────────┘
```

## Current Structure

```
apps/backend/
├── crates/                    # XI-editor packages (migrated & integrated)
│   ├── core/                  # Core editing and RPC
│   │   ├── xi-core-lib/      # ✅ Text editing engine with rope
│   │   ├── xi-rpc/           # ✅ JSON-RPC communication
│   │   └── xi-lsp-lib/       # ✅ Language Server Protocol
│   ├── plugins/               # Plugin infrastructure
│   │   ├── xi-plugin-lib/    # ✅ Plugin system
│   │   └── xi-syntect-plugin/ # ✅ Syntax highlighting
│   └── utils/                 # Utilities
│       ├── xi-rope/          # ✅ Rope data structure
│       ├── xi-unicode/       # ✅ Unicode handling
│       └── xi-trace/         # ✅ Logging/tracing
├── xi-core/                   # Preserved for reference
│   ├── python/               # Python bindings (reference)
│   └── rust/experimental/    # Experimental features
├── src/
│   └── main.rs               # ✅ Symphony entry point
├── Cargo.toml                # ✅ Workspace configuration
└── README.md                 # ✅ Documentation
```

## What XI-editor Provides (✅ Implemented)

### 1. Text Editing Core
- **Rope Data Structure**: Efficient text manipulation for large files
- **Multi-cursor Support**: Multiple simultaneous editing points
- **Selections & Editing**: Rich text selection and modification operations
- **Line Wrapping**: Intelligent line wrapping and word boundaries
- **Whitespace Handling**: Configurable whitespace management

### 2. Communication Layer
- **JSON-RPC Protocol**: Async message-based communication
- **Frontend-Backend Bridge**: Clean separation of concerns
- **Non-blocking Operations**: All edits complete in <16ms
- **Event System**: Reactive updates and notifications

### 3. Plugin System
- **Extension Infrastructure**: RPC-based plugin communication
- **Plugin Lifecycle**: Load, activate, deactivate, unload
- **Language Agnostic**: Plugins can be written in any language
- **Process Isolation**: Out-of-process plugin execution

### 4. Language Support
- **LSP Integration**: Language Server Protocol support
- **Syntax Highlighting**: TextMate grammars via Syntect
- **Code Intelligence**: Foundation for autocomplete, diagnostics, etc.

### 5. Performance
- **Async-First Design**: Non-blocking operations throughout
- **Efficient Memory Usage**: Optimized for large files
- **Fast Rendering**: Sub-16ms update targets
- **Scalable Architecture**: Handles thousands of files

## What Symphony Will Build (🚧 To Be Implemented)

### 1. AI Orchestration System

**The Conductor** - Intelligent workflow orchestration
```rust
crates/symphony-conductor/
├── src/
│   ├── orchestrator.rs      # Main orchestration engine
│   ├── agent_manager.rs     # AI agent coordination
│   ├── workflow_engine.rs   # Workflow execution
│   └── rl_integration.rs    # Reinforcement learning
```

### 2. AIDE Features (The Pit)

**Pool Manager** - AI model lifecycle
```rust
crates/symphony-pool-manager/
├── src/
│   ├── lifecycle.rs         # Model state machine
│   ├── prewarming.rs        # Predictive model loading
│   └── cache.rs             # Model caching
```

**DAG Tracker** - Workflow DAG execution
```rust
crates/symphony-dag-tracker/
├── src/
│   ├── dag.rs               # DAG representation
│   ├── executor.rs          # Parallel execution
│   └── checkpoint.rs        # State checkpointing
```

**Artifact Store** - Content-addressable storage
```rust
crates/symphony-artifact-store/
├── src/
│   ├── storage.rs           # Content-addressable storage
│   ├── versioning.rs        # Artifact versioning
│   ├── search.rs            # Tantivy-based search
│   └── quality.rs           # Quality scoring
```

### 3. Extension Ecosystem (Orchestra Kit)

**Instruments** (🎻) - AI/ML model extensions
**Operators** (⚙️) - Workflow utilities
**Motifs** (🧩) - UI enhancements

```rust
crates/symphony-extensions/
├── instruments/             # AI model extensions
├── operators/               # Workflow utilities
└── motifs/                  # UI enhancements
```

### 4. Python Conductor Integration

```rust
crates/symphony-python-bridge/
├── src/
│   ├── bindings.rs          # PyO3 FFI bindings
│   ├── type_conversion.rs   # Rust ↔ Python types
│   └── conductor_api.rs     # Conductor interface
```

### 5. Infrastructure Services

**IPC Bus** - Inter-process communication
```rust
crates/symphony-ipc/
├── src/
│   ├── bus.rs               # Message bus
│   ├── protocol.rs          # Binary serialization
│   ├── transport.rs         # Unix sockets / Named pipes
│   └── security.rs          # Authentication & validation
```

## Technology Stack

### From XI-editor
- **Rust** - Core language (Edition 2021)
- **Serde** - Serialization/deserialization
- **Crossbeam** - Concurrency primitives
- **Syntect** - Syntax highlighting
- **Regex** - Pattern matching
- **Notify** - File system watching

### Symphony Additions (Planned)
- **Tokio** - Async runtime
- **PyO3** - Python integration
- **Tantivy** - Full-text search
- **Petgraph** - Graph algorithms (for DAGs)
- **Tauri** - Desktop application framework
- **MessagePack/Bincode** - Binary serialization

## Build & Development

### Building
```bash
# Build all crates
cargo build

# Build release (optimized)
cargo build --release

# Fast compile check
cargo check
```

### Running
```bash
# Run Symphony backend
cargo run

# Run with logging
RUST_LOG=debug cargo run
```

### Testing
```bash
# Run all tests
cargo test

# Run specific crate tests
cargo test -p xi-core-lib
```

### Code Quality
```bash
# Lint with Clippy
cargo clippy

# Format code
cargo fmt

# Fix lints automatically
cargo fix
```

## Migration Status

✅ **Completed** (December 2025):
- [x] XI-editor packages migrated to `crates/`
- [x] Rust edition updated to 2021
- [x] Dependencies modernized
- [x] Workspace configuration created
- [x] Symphony entry point (`src/main.rs`)
- [x] Build system working
- [x] Documentation created

🚧 **In Progress**:
- [ ] Symphony-specific crates
- [ ] Python Conductor integration
- [ ] AIDE layer implementation
- [ ] Frontend-backend JSON-RPC integration

📋 **Planned**:
- [ ] Extension ecosystem
- [ ] Workflow engine
- [ ] Artifact management
- [ ] AI model integration

## Performance Targets

### XI-editor Layer (Achieved)
- ✅ Text operations: <16ms (60 FPS)
- ✅ Large file handling: Efficient for files >100MB
- ✅ Memory usage: Optimized rope structure

### Symphony AIDE Layer (Targets)
- Pool Manager: 50-100ns allocation (cache hit)
- DAG Tracker: 10,000-node workflows
- Artifact Store: 1-5ms store, 0.5-2ms retrieve
- IPC Bus: 0.1-0.3ms message latency

## Communication Patterns

### Frontend ↔ Backend
```
Frontend (React/TS)
    ↕ JSON-RPC (via XI-editor)
Backend (Rust)
```

### Backend ↔ Python Conductor
```
Rust Backend
    ↕ PyO3 FFI (~0.01ms overhead)
Python Conductor (RL/AI)
```

### Backend ↔ Extensions
```
Symphony Core
    ↕ IPC Bus (0.1-0.3ms)
Extensions (In-process or Out-of-process)
```

## Design Principles

1. **Build on Proven Foundations**: Use XI-editor for text editing instead of reinventing
2. **Layer Separation**: Clear boundary between XI and Symphony layers
3. **Performance First**: Maintain XI's sub-16ms operation targets
4. **Extensibility**: Plugin system for community contributions
5. **Type Safety**: Leverage Rust's type system for correctness
6. **Async-First**: Non-blocking operations throughout

## References

- [XI-editor Documentation](https://xi-editor.io/docs.html)
- [XI-editor GitHub](https://github.com/xi-editor/xi-editor)
- [Rope Data Structure](https://xi-editor.io/docs/rope_science_00.html)
- [Symphony Documentation](../../docs/)

---

**Last Updated**: December 2025  
**Status**: Foundation Complete, AIDE Layer In Planning
