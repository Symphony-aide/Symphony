# Symphony Backend Technology Stack

> **Architecture**: Dual Ensemble Architecture (DEA) with Python Conductor + Rust Infrastructure
>
> - **Python Core**: Conductor RL model (PyTorch/TensorFlow)
> - **Rust Infrastructure**: The Pit (5 in-process extensions)
> - **Communication**: PyO3 FFI + IPC Bus
> - **UI Bridge**: Virtual DOM (Rust → React)

## Technology Stack by Layer

### 1. The Conductor (Python Core)

**Language**: Python 3.11+
**Purpose**: AI-powered orchestration engine

```python
# requirements.txt
# AI/ML Frameworks
torch>=2.0.0              # PyTorch for RL model
tensorflow>=2.13.0        # Alternative: TensorFlow
gymnasium>=0.29.0         # RL environment (Function Quest)

# Async Runtime
asyncio                   # Built-in async support
aiohttp>=3.9.0           # Async HTTP client

# Python-Rust Bridge
maturin>=1.4.0           # Build PyO3 extensions

# Utilities
pydantic>=2.0.0          # Data validation
rich>=13.0.0             # Terminal UI
```

### 2. The Pit - Infrastructure as Extensions (IaE)

**Execution Model**: In-Process (PyO3 FFI)
**Performance**: 50-100 nanosecond operations

#### `pit/pool-manager` 🏊
**Tech Stack:**
```toml
[dependencies]
# PyO3 Integration
pyo3 = { version = "0.20", features = ["extension-module"] }
pyo3-asyncio = { version = "0.20", features = ["tokio-runtime"] }

# Async Runtime
tokio = { version = "1.0", features = ["full", "rt-multi-thread"] }

# Performance
parking_lot = "0.12"     # Fast locks
dashmap = "5.5"          # Concurrent HashMap
arc-swap = "1.6"         # Atomic Arc swapping

# Monitoring
sysinfo = "0.29"         # System resource monitoring
```

#### `pit/dag-tracker` 📊
**Tech Stack:**
```toml
[dependencies]
# PyO3 Integration
pyo3 = { version = "0.20", features = ["extension-module"] }

# Graph Processing
petgraph = "0.6"         # Graph algorithms
daggy = "0.8"            # DAG structures

# Async Runtime
tokio = { version = "1.0", features = ["full"] }

# Performance
smallvec = "1.11"        # Stack-allocated vectors
imbl = "2.0"             # Immutable data structures
```

#### `pit/artifact-store` 📦
**Tech Stack:**
```toml
[dependencies]
# PyO3 Integration
pyo3 = { version = "0.20", features = ["extension-module"] }

# Storage
tokio = { version = "1.0", features = ["fs", "io-util"] }
memmap2 = "0.9"          # Memory-mapped files

# Compression
zstd = "0.13"            # Fast compression
flate2 = "1.0"           # Gzip compression

# Indexing & Search
tantivy = "0.21"         # Full-text search

# Versioning
git2 = "0.18"            # Git-like versioning
```

#### `pit/arbitration-engine` ⚖️
**Tech Stack:**
```toml
[dependencies]
# PyO3 Integration
pyo3 = { version = "0.20", features = ["extension-module"] }

# Decision Making
rand = "0.8"             # Random selection
statrs = "0.16"          # Statistical functions

# Performance
parking_lot = "0.12"     # Fast synchronization
atomic = "0.6"           # Atomic operations
```

#### `pit/stale-manager` 🧹
**Tech Stack:**
```toml
[dependencies]
# PyO3 Integration
pyo3 = { version = "0.20", features = ["extension-module"] }

# Storage Management
tokio = { version = "1.0", features = ["fs"] }
walkdir = "2.4"          # Directory traversal

# Cloud Integration
aws-sdk-s3 = "1.0"       # AWS S3 for archival
azure_storage = "0.19"   # Azure Blob storage

# Scheduling
tokio-cron-scheduler = "0.9"  # Scheduled cleanup
```

### 3. Conductor Integration Layer

#### `conductor/python-bridge`
**Tech Stack:**
```toml
[dependencies]
# PyO3 FFI Bridge
pyo3 = { version = "0.20", features = ["extension-module", "abi3"] }
pyo3-asyncio = { version = "0.20", features = ["tokio-runtime"] }

# Type Conversion
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
pythonize = "0.20"       # Rust → Python
depythonize = "0.20"     # Python → Rust

# Error Handling
anyhow = "1.0"
thiserror = "1.0"
```

**Performance**: ~0.01ms FFI call overhead

#### `conductor/ipc-bus`
**Tech Stack:**
```toml
[dependencies]
# PyO3 Integration (for Conductor access)
pyo3 = { version = "0.20", features = ["extension-module"] }

# IPC Transports
tokio = { version = "1.0", features = ["full", "net"] }

# Unix Sockets (Linux/macOS)
[target.'cfg(unix)'.dependencies]
tokio = { version = "1.0", features = ["net"] }

# Named Pipes (Windows)
[target.'cfg(windows)'.dependencies]
windows = { version = "0.52", features = ["Win32_System_Pipes"] }

# Shared Memory
shared_memory = "0.12"   # High-frequency data

# Serialization
bincode = "1.3"          # Binary serialization
rmp-serde = "1.1"        # MessagePack

# Process Management
sysinfo = "0.29"         # Process monitoring
```

### 4. Core Foundation

#### `core/types`
**Tech Stack:**
```toml
[dependencies]
# Serialization
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# Type Utilities
uuid = { version = "1.0", features = ["v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }

# Schema Validation
schemars = { version = "0.8", features = ["uuid1"] }

# Error Handling
thiserror = "1.0"
```

#### `core/config`
**Tech Stack:**
```toml
[dependencies]
# Configuration Formats
toml = "0.8"
serde_json = "1.0"

# File System
tokio = { version = "1.0", features = ["fs"] }
notify = "6.0"           # File watching

# Schema Validation
jsonschema = "0.17"
```

#### `core/manifest`
**Tech Stack:**
```toml
[dependencies]
# Parsing
toml = "0.8"
serde = { version = "1.0", features = ["derive"] }

# Validation
validator = { version = "0.16", features = ["derive"] }
jsonschema = "0.17"
```

### 5. UI Bridge System

#### `bridge/virtual-dom`
**Tech Stack:**
```toml
[dependencies]
# Serialization
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# UI Component System
indexmap = "2.0"         # Ordered component props
smallvec = "1.11"        # Efficient vectors

# Event System
tokio = { version = "1.0", features = ["sync"] }
crossbeam-channel = "0.5" # Event channels

# Diffing
imbl = "2.0"             # Immutable structures

# Type Safety
typed-builder = "0.18"   # Builder pattern
```

#### `bridge/state-sync`
**Tech Stack:**
```toml
[dependencies]
# State Management
tokio = { version = "1.0", features = ["sync"] }
dashmap = "5.5"          # Concurrent state
arc-swap = "1.6"         # Atomic updates

# Persistence
sqlx = { version = "0.7", features = ["sqlite", "runtime-tokio-rustls"] }
```

### 6. Extension System

#### `extensions/core`
**Tech Stack:**
```toml
[dependencies]
# Extension Traits
async-trait = "0.1"

# Registry
dashmap = "5.5"          # Concurrent registry

# Serialization
serde = { version = "1.0", features = ["derive"] }
```

#### `extensions/loader`
**Tech Stack:**
```toml
[dependencies]
# Dynamic Loading
libloading = "0.8"       # Cross-platform DLL loading
abi_stable = "0.11"      # ABI-stable interfaces

# Hot Reload
notify = "6.0"           # File watching

# Dependency Resolution
pubgrub = "0.2"          # Dependency solver
petgraph = "0.6"         # Dependency graphs
```

#### `extensions/sandbox`
**Tech Stack:**
```toml
[dependencies]
# Security
ring = "0.17"            # Cryptography

# Sandboxing
[target.'cfg(unix)'.dependencies]
nix = "0.27"             # Unix syscalls

[target.'cfg(windows)'.dependencies]
winapi = { version = "0.3", features = ["processthreadsapi"] }

# Resource Limits
sysinfo = "0.29"         # System monitoring
```

### 7. The Grand Stage - User-Faced Extensions (UFE)

**Execution Model**: Out-of-Process
**Communication**: IPC Bus (Unix sockets/Named pipes)

#### `stage/instruments` 🎻
**Tech Stack:**
```toml
[dependencies]
# AI/ML Integration
reqwest = { version = "0.11", features = ["json", "stream"] }
tokio-tungstenite = "0.20" # WebSocket for streaming

# Model Management
tokio = { version = "1.0", features = ["full"] }

# IPC Communication
ipc-bus = { path = "../../conductor/ipc-bus" }
```

#### `stage/operators` ⚙️
**Tech Stack:**
```toml
[dependencies]
# File Operations
tokio = { version = "1.0", features = ["fs", "process"] }
walkdir = "2.4"
ignore = "0.4"           # .gitignore support

# Data Processing
quick-xml = "0.31"       # XML processing
regex = "1.10"           # Text processing

# Git Operations
git2 = "0.18"

# IPC Communication
ipc-bus = { path = "../../conductor/ipc-bus" }
```

#### `stage/motifs` 🧩
**Tech Stack:**
```toml
[dependencies]
# Virtual DOM
virtual-dom = { path = "../../bridge/virtual-dom" }

# UI Components
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# IPC Communication
ipc-bus = { path = "../../conductor/ipc-bus" }
```

### 8. Orchestra Kit - Marketplace & Extension Management

#### `orchestra-kit/marketplace`
**Tech Stack:**
```toml
[dependencies]
# HTTP Client
reqwest = { version = "0.11", features = ["json"] }

# Package Management
semver = "1.0"           # Semantic versioning

# Compression
flate2 = "1.0"
tar = "0.4"
zip = "0.6"

# Cryptography
sha2 = "0.10"            # Hash verification
ring = "0.17"            # Signature verification

# Dependency Resolution
pubgrub = "0.2"
petgraph = "0.6"
```

#### `orchestra-kit/sdk` (Carets SDK)
**Tech Stack:**
```toml
[dependencies]
# CLI Framework
clap = { version = "4.4", features = ["derive"] }
dialoguer = "0.11"       # Interactive prompts
indicatif = "0.17"       # Progress bars
console = "0.15"         # Terminal styling

# Template Engine
tera = "1.19"

# File Operations
tokio = { version = "1.0", features = ["fs"] }
walkdir = "2.4"

# Hot Reload
notify = "6.0"

# Testing
tokio-test = "0.4"
mockall = "0.12"         # Mocking framework
```

#### `orchestra-kit/registry`
**Tech Stack:**
```toml
[dependencies]
# Database
sqlx = { version = "0.7", features = ["postgres", "runtime-tokio-rustls"] }

# Search
tantivy = "0.21"         # Full-text search

# Versioning
semver = "1.0"

# Serialization
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
```

### 9. Infrastructure

#### `infra/logging`
**Tech Stack:**
```toml
[dependencies]
# Logging Framework
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter", "json"] }
tracing-appender = "0.2"

# Structured Logging
serde_json = "1.0"
chrono = { version = "0.4", features = ["serde"] }
```

#### `infra/metrics`
**Tech Stack:**
```toml
[dependencies]
# Metrics Framework
metrics = "0.21"
metrics-exporter-prometheus = "0.12"

# Performance Profiling
pprof = { version = "0.13", features = ["flamegraph"] }

# System Monitoring
sysinfo = "0.29"
```

#### `infra/hooks`
**Tech Stack:**
```toml
[dependencies]
# Desktop Integration
tauri-api = "1.5"        # Tauri system APIs
notify-rust = "4.10"     # Desktop notifications

# Web Integration
oauth2 = "4.4"           # OAuth
jsonwebtoken = "9.2"     # JWT

# System
dirs = "5.0"
open = "5.0"             # Open URLs/files
```

### 10. Applications

#### `apps/desktop` (Tauri)
**Tech Stack:**
```toml
[dependencies]
# Tauri Framework
tauri = { version = "1.5", features = [
    "api-all",
    "dialog-all",
    "shell-open",
    "window-all",
    "fs-all",
    "process-all"
] }

# Conductor Bridge
python-bridge = { path = "../../conductor/python-bridge" }
ipc-bus = { path = "../../conductor/ipc-bus" }

# State Management
tokio = { version = "1.0", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }

# Platform-specific
[target.'cfg(windows)'.dependencies]
window-shadows = "0.2"

[build-dependencies]
tauri-build = "1.5"
```

#### `apps/server`
**Tech Stack:**
```toml
[dependencies]
# Web Framework
axum = "0.7"             # Async web framework
tower = "0.4"
tower-http = { version = "0.5", features = ["cors", "trace"] }

# WebSocket
axum-tungstenite = "0.2"

# Authentication
jsonwebtoken = "9.2"
argon2 = "0.5"           # Password hashing

# Conductor Bridge
python-bridge = { path = "../../conductor/python-bridge" }
ipc-bus = { path = "../../conductor/ipc-bus" }
```


## Performance Optimizations

### Compilation Flags
```toml
[profile.release]
lto = "fat"             # Full link-time optimization
codegen-units = 1       # Single codegen unit
panic = "abort"         # Smaller binary
strip = true            # Strip debug symbols
opt-level = 3           # Maximum optimization

# The Pit - Ultra-optimized
[profile.release.package."pool-manager"]
opt-level = 3
lto = "fat"

[profile.release.package."dag-tracker"]
opt-level = 3
lto = "fat"

[profile.dev]
opt-level = 1           # Some optimization
debug = true
```

### Feature Flags
```toml
[features]
default = ["desktop"]
desktop = ["tauri", "python-bridge"]
server = ["axum", "python-bridge"]
in-process-pit = ["pyo3", "pyo3-asyncio"]  # The Pit extensions
out-of-process-ufe = ["ipc-bus"]           # UFE extensions
virtual-dom = ["serde_json"]               # UI bridge
marketplace = ["reqwest", "semver"]
```

## Architecture Performance Summary

| Component | Language | Execution | Latency | Throughput |
|-----------|----------|-----------|---------|------------|
| **Conductor** | Python | RL Model | 0.5-2ms | 10K ops/sec |
| **The Pit** | Rust | In-Process | 50-100ns | 1M+ ops/sec |
| **IPC Bus** | Rust | FFI Bridge | 0.01-0.05ms | 100K ops/sec |
| **UFE Extensions** | Rust | Out-of-Process | 0.1-0.5ms | 10K-100K ops/sec |
| **Virtual DOM** | Rust → JSON | Serialization | 1-5ms | 5K ops/sec |

## Key Technology Decisions

1. **Python Conductor**: Leverage AI/ML ecosystem (PyTorch, TensorFlow)
2. **Rust Infrastructure**: Performance-critical operations (The Pit)
3. **PyO3 Bridge**: Zero-copy FFI between Python and Rust
4. **IPC Bus**: Process isolation for user extensions
5. **Virtual DOM**: Backend-generated UI for React frontend

This technology stack provides:
- **AI-First Architecture** with Python RL orchestration
- **Extreme Performance** through Rust infrastructure (nanosecond operations)
- **Strategic Isolation** via dual execution models
- **Modern UI Bridge** with Virtual DOM system
- **Extensible Ecosystem** through Orchestra Kit