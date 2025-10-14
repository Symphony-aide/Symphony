# Symphony Types Package Design

**Package**: `symphony_types`  
**Purpose**: Zero-dependency foundational types for all Symphony packages  
**Status**: Design Phase

---

## Design Principles

1. **Zero External Dependencies**: Only `std`, `serde`, `uuid`, `chrono` allowed
2. **Zero-Cost Abstractions**: Newtypes compile to underlying primitives
3. **Type Safety First**: Use newtypes to prevent ID confusion (e.g., `ExtensionId` ≠ `WorkflowId`)
4. **Serialization-Ready**: All types derive `Serialize`/`Deserialize` for IPC
5. **Error Ergonomics**: Rich error context, `thiserror` integration

---

## Module Structure

```
types/
├── src/
│   ├── lib.rs                 # Re-exports
│   ├── ids.rs                 # Strongly-typed IDs
│   ├── error.rs               # Error hierarchy
│   ├── result.rs              # Result type aliases
│   ├── time.rs                # Timestamp utilities
│   ├── version.rs             # Semantic versioning
│   ├── resource.rs            # Resource handles
│   ├── capability.rs          # Capability tokens
│   ├── message/
│   │   ├── mod.rs
│   │   ├── envelope.rs        # Message envelopes
│   │   ├── jsonrpc.rs         # JSON-RPC types
│   │   └── ipc.rs             # IPC frame types
│   ├── extension/
│   │   ├── mod.rs
│   │   ├── manifest.rs        # Extension manifest types
│   │   ├── lifecycle.rs       # Lifecycle states
│   │   └── metadata.rs        # Extension metadata
│   ├── workflow/
│   │   ├── mod.rs
│   │   ├── node.rs            # DAG node types
│   │   ├── edge.rs            # DAG edge types
│   │   └── execution.rs       # Execution state
│   ├── artifact/
│   │   ├── mod.rs
│   │   ├── content.rs         # Content addressing
│   │   ├── metadata.rs        # Artifact metadata
│   │   └── quality.rs         # Quality scoring
│   └── traits/
│       ├── mod.rs
│       ├── identifiable.rs    # Common traits
│       ├── serializable.rs
│       └── validatable.rs
└── Cargo.toml
```

---

## Core Type Definitions

### 1. Strongly-Typed IDs (`ids.rs`)

```rust
use serde::{Deserialize, Serialize};
use std::fmt;
use uuid::Uuid;

/// Macro to generate strongly-typed ID newtypes
macro_rules! define_id {
    ($name:ident, $doc:expr) => {
        #[doc = $doc]
        #[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
        #[serde(transparent)]
        pub struct $name(Uuid);

        impl $name {
            pub fn new() -> Self {
                Self(Uuid::new_v4())
            }

            pub fn from_uuid(uuid: Uuid) -> Self {
                Self(uuid)
            }

            pub fn as_uuid(&self) -> &Uuid {
                &self.0
            }

            pub fn into_uuid(self) -> Uuid {
                self.0
            }
        }

        impl Default for $name {
            fn default() -> Self {
                Self::new()
            }
        }

        impl fmt::Display for $name {
            fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
                write!(f, "{}", self.0)
            }
        }

        impl std::str::FromStr for $name {
            type Err = uuid::Error;

            fn from_str(s: &str) -> Result<Self, Self::Err> {
                Ok(Self(Uuid::parse_str(s)?))
            }
        }
    };
}

// Extension System IDs
define_id!(ExtensionId, "Unique identifier for an extension");
define_id!(InstrumentId, "Unique identifier for an AI/ML instrument");
define_id!(OperatorId, "Unique identifier for a workflow operator");
define_id!(MotifId, "Unique identifier for a UI motif");

// Workflow System IDs
define_id!(WorkflowId, "Unique identifier for a workflow/melody");
define_id!(NodeId, "Unique identifier for a DAG node");
define_id!(EdgeId, "Unique identifier for a DAG edge");
define_id!(ExecutionId, "Unique identifier for a workflow execution");

// Artifact System IDs
define_id!(ArtifactId, "Unique identifier for an artifact");
define_id!(ContentHash, "Content-addressable hash identifier");

// Session & Process IDs
define_id!(SessionId, "Unique identifier for a user session");
define_id!(ProcessId, "Unique identifier for an extension process");
define_id!(PoolId, "Unique identifier for a model pool");

// Resource IDs
define_id!(ResourceId, "Unique identifier for a managed resource");
define_id!(CapabilityId, "Unique identifier for a capability token");
```

---

### 2. Error Hierarchy (`error.rs`)

```rust
use thiserror::Error;
use std::fmt;

/// Top-level Symphony error type
#[derive(Error, Debug)]
pub enum SymphonyError {
    // Foundation errors
    #[error("Configuration error: {0}")]
    Config(String),

    #[error("Initialization error: {0}")]
    Initialization(String),

    // Extension errors
    #[error("Extension error: {source}")]
    Extension {
        #[from]
        source: ExtensionError,
    },

    // Workflow errors
    #[error("Workflow error: {source}")]
    Workflow {
        #[from]
        source: WorkflowError,
    },

    // IPC errors
    #[error("IPC error: {source}")]
    Ipc {
        #[from]
        source: IpcError,
    },

    // Artifact errors
    #[error("Artifact error: {source}")]
    Artifact {
        #[from]
        source: ArtifactError,
    },

    // Resource errors
    #[error("Resource error: {source}")]
    Resource {
        #[from]
        source: ResourceError,
    },

    // Permission errors
    #[error("Permission denied: {0}")]
    PermissionDenied(String),

    // IO errors
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    // Serialization errors
    #[error("Serialization error: {0}")]
    Serialization(String),

    // Timeout errors
    #[error("Operation timed out: {0}")]
    Timeout(String),

    // Generic errors
    #[error("Internal error: {0}")]
    Internal(String),

    #[error("{0}")]
    Other(String),
}

/// Extension-specific errors
#[derive(Error, Debug)]
pub enum ExtensionError {
    #[error("Extension not found: {id}")]
    NotFound { id: String },

    #[error("Extension already loaded: {id}")]
    AlreadyLoaded { id: String },

    #[error("Invalid manifest: {reason}")]
    InvalidManifest { reason: String },

    #[error("Dependency resolution failed: {reason}")]
    DependencyResolution { reason: String },

    #[error("Lifecycle transition invalid: {from} -> {to}")]
    InvalidLifecycleTransition { from: String, to: String },

    #[error("Extension crashed: {id}, reason: {reason}")]
    Crashed { id: String, reason: String },

    #[error("Capability not granted: {capability}")]
    CapabilityDenied { capability: String },
}

/// Workflow-specific errors
#[derive(Error, Debug)]
pub enum WorkflowError {
    #[error("Workflow not found: {id}")]
    NotFound { id: String },

    #[error("Cyclic dependency detected in DAG")]
    CyclicDependency,

    #[error("Node not found: {node_id}")]
    NodeNotFound { node_id: String },

    #[error("Execution failed at node {node_id}: {reason}")]
    ExecutionFailed { node_id: String, reason: String },

    #[error("Invalid workflow definition: {reason}")]
    InvalidDefinition { reason: String },

    #[error("Workflow already running: {id}")]
    AlreadyRunning { id: String },
}

/// IPC-specific errors
#[derive(Error, Debug)]
pub enum IpcError {
    #[error("Connection failed: {reason}")]
    ConnectionFailed { reason: String },

    #[error("Message serialization failed: {reason}")]
    SerializationFailed { reason: String },

    #[error("Message deserialization failed: {reason}")]
    DeserializationFailed { reason: String },

    #[error("Transport error: {reason}")]
    Transport { reason: String },

    #[error("Authentication failed: {reason}")]
    AuthenticationFailed { reason: String },

    #[error("Rate limit exceeded")]
    RateLimitExceeded,

    #[error("Invalid message format")]
    InvalidMessageFormat,
}

/// Artifact-specific errors
#[derive(Error, Debug)]
pub enum ArtifactError {
    #[error("Artifact not found: {id}")]
    NotFound { id: String },

    #[error("Storage error: {reason}")]
    Storage { reason: String },

    #[error("Content hash mismatch: expected {expected}, got {actual}")]
    HashMismatch { expected: String, actual: String },

    #[error("Artifact already exists: {id}")]
    AlreadyExists { id: String },

    #[error("Invalid artifact metadata: {reason}")]
    InvalidMetadata { reason: String },
}

/// Resource management errors
#[derive(Error, Debug)]
pub enum ResourceError {
    #[error("Resource exhausted: {resource_type}")]
    Exhausted { resource_type: String },

    #[error("Resource not found: {id}")]
    NotFound { id: String },

    #[error("Resource locked by: {holder}")]
    Locked { holder: String },

    #[error("Resource allocation failed: {reason}")]
    AllocationFailed { reason: String },
}

// Implement conversion from common error types
impl From<serde_json::Error> for SymphonyError {
    fn from(err: serde_json::Error) -> Self {
        SymphonyError::Serialization(err.to_string())
    }
}

impl From<uuid::Error> for SymphonyError {
    fn from(err: uuid::Error) -> Self {
        SymphonyError::Other(format!("UUID error: {}", err))
    }
}
```

---

### 3. Result Type Aliases (`result.rs`)

```rust
use crate::error::*;

/// Standard Result type for Symphony operations
pub type SymphonyResult<T> = Result<T, SymphonyError>;

/// Extension-specific Result type
pub type ExtensionResult<T> = Result<T, ExtensionError>;

/// Workflow-specific Result type
pub type WorkflowResult<T> = Result<T, WorkflowError>;

/// IPC-specific Result type
pub type IpcResult<T> = Result<T, IpcError>;

/// Artifact-specific Result type
pub type ArtifactResult<T> = Result<T, ArtifactError>;

/// Resource-specific Result type
pub type ResourceResult<T> = Result<T, ResourceError>;
```

---

### 4. Timestamp Utilities (`time.rs`)

```rust
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::time::Duration;

/// Timestamp wrapper with Symphony-specific utilities
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(transparent)]
pub struct Timestamp(DateTime<Utc>);

impl Timestamp {
    pub fn now() -> Self {
        Self(Utc::now())
    }

    pub fn from_datetime(dt: DateTime<Utc>) -> Self {
        Self(dt)
    }

    pub fn as_datetime(&self) -> &DateTime<Utc> {
        &self.0
    }

    pub fn elapsed(&self) -> Duration {
        let now = Utc::now();
        (now - self.0)
            .to_std()
            .unwrap_or(Duration::from_secs(0))
    }

    pub fn is_older_than(&self, duration: Duration) -> bool {
        self.elapsed() > duration
    }

    pub fn unix_timestamp(&self) -> i64 {
        self.0.timestamp()
    }

    pub fn unix_timestamp_millis(&self) -> i64 {
        self.0.timestamp_millis()
    }
}

impl Default for Timestamp {
    fn default() -> Self {
        Self::now()
    }
}

/// Time-to-live wrapper
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct Ttl {
    created_at: Timestamp,
    duration: Duration,
}

impl Ttl {
    pub fn new(duration: Duration) -> Self {
        Self {
            created_at: Timestamp::now(),
            duration,
        }
    }

    pub fn is_expired(&self) -> bool {
        self.created_at.elapsed() > self.duration
    }

    pub fn remaining(&self) -> Option<Duration> {
        self.duration.checked_sub(self.created_at.elapsed())
    }
}
```

---

### 5. Semantic Versioning (`version.rs`)

```rust
use serde::{Deserialize, Serialize};
use std::fmt;
use std::str::FromStr;

/// Semantic version (major.minor.patch)
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub struct Version {
    pub major: u32,
    pub minor: u32,
    pub patch: u32,
}

impl Version {
    pub fn new(major: u32, minor: u32, patch: u32) -> Self {
        Self {
            major,
            minor,
            patch,
        }
    }

    pub fn is_compatible_with(&self, other: &Version) -> bool {
        // Major version must match, minor/patch can be >=
        self.major == other.major && self >= other
    }

    pub fn bump_major(&mut self) {
        self.major += 1;
        self.minor = 0;
        self.patch = 0;
    }

    pub fn bump_minor(&mut self) {
        self.minor += 1;
        self.patch = 0;
    }

    pub fn bump_patch(&mut self) {
        self.patch += 1;
    }
}

impl fmt::Display for Version {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}.{}.{}", self.major, self.minor, self.patch)
    }
}

impl FromStr for Version {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let parts: Vec<&str> = s.split('.').collect();
        if parts.len() != 3 {
            return Err(format!("Invalid version format: {}", s));
        }

        let major = parts[0]
            .parse()
            .map_err(|_| format!("Invalid major version: {}", parts[0]))?;
        let minor = parts[1]
            .parse()
            .map_err(|_| format!("Invalid minor version: {}", parts[1]))?;
        let patch = parts[2]
            .parse()
            .map_err(|_| format!("Invalid patch version: {}", parts[2]))?;

        Ok(Version::new(major, minor, patch))
    }
}

/// Version requirement for dependency resolution
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum VersionRequirement {
    Exact(Version),
    GreaterOrEqual(Version),
    Compatible(Version), // Same major, >= minor.patch
    Range { min: Version, max: Version },
}

impl VersionRequirement {
    pub fn is_satisfied_by(&self, version: &Version) -> bool {
        match self {
            VersionRequirement::Exact(v) => version == v,
            VersionRequirement::GreaterOrEqual(v) => version >= v,
            VersionRequirement::Compatible(v) => version.is_compatible_with(v),
            VersionRequirement::Range { min, max } => version >= min && version <= max,
        }
    }
}
```

---

### 6. Resource Handles (`resource.rs`)

```rust
use crate::ids::ResourceId;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

/// Resource handle with reference counting
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceHandle {
    pub id: ResourceId,
    pub resource_type: ResourceType,
    #[serde(skip)]
    pub metadata: Arc<ResourceMetadata>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ResourceType {
    Memory,
    Cpu,
    Gpu,
    Disk,
    Network,
    FileHandle,
    Custom(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceMetadata {
    pub allocated_at: crate::time::Timestamp,
    pub size: u64,
    pub owner: String,
    pub tags: Vec<String>,
}

impl ResourceHandle {
    pub fn new(id: ResourceId, resource_type: ResourceType, metadata: ResourceMetadata) -> Self {
        Self {
            id,
            resource_type,
            metadata: Arc::new(metadata),
        }
    }
}
```

---

### 7. Capability Tokens (`capability.rs`)

```rust
use crate::ids::CapabilityId;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;

/// Capability-based security token
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CapabilityToken {
    pub id: CapabilityId,
    pub capabilities: HashSet<Capability>,
    pub granted_at: crate::time::Timestamp,
    pub expires_at: Option<crate::time::Timestamp>,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum Capability {
    // File system
    FileRead,
    FileWrite,
    FileExecute,

    // Network
    NetworkAccess,
    NetworkBind,

    // Process
    ProcessSpawn,
    ProcessKill,

    // Extension
    ExtensionLoad,
    ExtensionUnload,

    // Workflow
    WorkflowExecute,
    WorkflowModify,

    // Artifact
    ArtifactRead,
    ArtifactWrite,

    // System
    SystemConfig,
    SystemShutdown,

    // Custom
    Custom(String),
}

impl CapabilityToken {
    pub fn has_capability(&self, cap: &Capability) -> bool {
        self.capabilities.contains(cap)
    }

    pub fn is_expired(&self) -> bool {
        if let Some(expires_at) = &self.expires_at {
            expires_at < &crate::time::Timestamp::now()
        } else {
            false
        }
    }

    pub fn is_valid(&self) -> bool {
        !self.is_expired()
    }
}
```

---

### 8. Message Envelopes (`message/envelope.rs`)

```rust
use crate::ids::{ProcessId, SessionId};
use crate::time::Timestamp;
use serde::{Deserialize, Serialize};

/// Generic message envelope for IPC
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageEnvelope<T> {
    pub id: uuid::Uuid,
    pub timestamp: Timestamp,
    pub sender: ProcessId,
    pub receiver: Option<ProcessId>,
    pub session_id: Option<SessionId>,
    pub payload: T,
    pub metadata: MessageMetadata,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageMetadata {
    pub priority: MessagePriority,
    pub ttl: Option<std::time::Duration>,
    pub reply_to: Option<uuid::Uuid>,
    pub correlation_id: Option<uuid::Uuid>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub enum MessagePriority {
    Low = 0,
    Normal = 1,
    High = 2,
    Critical = 3,
}

impl Default for MessageMetadata {
    fn default() -> Self {
        Self {
            priority: MessagePriority::Normal,
            ttl: None,
            reply_to: None,
            correlation_id: None,
        }
    }
}
```

---

### 9. JSON-RPC Types (`message/jsonrpc.rs`)

```rust
use serde::{Deserialize, Serialize};
use serde_json::Value;

/// JSON-RPC 2.0 Request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonRpcRequest {
    pub jsonrpc: String, // Always "2.0"
    pub method: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub params: Option<Value>,
    pub id: RequestId,
}

/// JSON-RPC 2.0 Response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonRpcResponse {
    pub jsonrpc: String, // Always "2.0"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<JsonRpcError>,
    pub id: RequestId,
}

/// JSON-RPC Error
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonRpcError {
    pub code: i32,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<Value>,
}

/// Request ID (can be string, number, or null)
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(untagged)]
pub enum RequestId {
    String(String),
    Number(i64),
    Null,
}

impl JsonRpcRequest {
    pub fn new(method: impl Into<String>, params: Option<Value>, id: RequestId) -> Self {
        Self {
            jsonrpc: "2.0".to_string(),
            method: method.into(),
            params,
            id,
        }
    }
}

impl JsonRpcResponse {
    pub fn success(result: Value, id: RequestId) -> Self {
        Self {
            jsonrpc: "2.0".to_string(),
            result: Some(result),
            error: None,
            id,
        }
    }

    pub fn error(error: JsonRpcError, id: RequestId) -> Self {
        Self {
            jsonrpc: "2.0".to_string(),
            result: None,
            error: Some(error),
            id,
        }
    }
}

// Standard JSON-RPC error codes
pub mod error_codes {
    pub const PARSE_ERROR: i32 = -32700;
    pub const INVALID_REQUEST: i32 = -32600;
    pub const METHOD_NOT_FOUND: i32 = -32601;
    pub const INVALID_PARAMS: i32 = -32602;
    pub const INTERNAL_ERROR: i32 = -32603;
}
```

---

### 10. Extension Lifecycle (`extension/lifecycle.rs`)

```rust
use serde::{Deserialize, Serialize};

/// Extension lifecycle states ("Chambering")
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ExtensionLifecycle {
    /// Extension is installed but not loaded
    Installed,
    /// Extension is being loaded into memory
    Loading,
    /// Extension is loaded and initialized
    Loaded,
    /// Extension is activated and ready to use
    Activated,
    /// Extension is currently running/executing
    Running,
    /// Extension is paused
    Paused,
    /// Extension is being deactivated
    Deactivating,
    /// Extension is being unloaded from memory
    Unloading,
    /// Extension encountered an error
    Error,
}

impl ExtensionLifecycle {
    pub fn can_transition_to(&self, next: &ExtensionLifecycle) -> bool {
        use ExtensionLifecycle::*;
        matches!(
            (self, next),
            (Installed, Loading)
                | (Loading, Loaded)
                | (Loading, Error)
                | (Loaded, Activated)
                | (Loaded, Unloading)
                | (Activated, Running)
                | (Activated, Deactivating)
                | (Running, Paused)
                | (Running, Deactivating)
                | (Running, Error)
                | (Paused, Running)
                | (Paused, Deactivating)
                | (Deactivating, Loaded)
                | (Unloading, Installed)
                | (Error, Unloading)
        )
    }

    pub fn is_active(&self) -> bool {
        matches!(
            self,
            ExtensionLifecycle::Activated
                | ExtensionLifecycle::Running
                | ExtensionLifecycle::Paused
        )
    }

    pub fn is_terminal(&self) -> bool {
        matches!(self, ExtensionLifecycle::Installed | ExtensionLifecycle::Error)
    }
}
```

---

### 11. Common Traits (`traits/identifiable.rs`)

```rust
use uuid::Uuid;

/// Trait for types that have a unique identifier
pub trait Identifiable {
    type Id;

    fn id(&self) -> &Self::Id;
}

/// Trait for types that can be validated
pub trait Validatable {
    type Error;

    fn validate(&self) -> Result<(), Self::Error>;
}

/// Trait for types that have a version
pub trait Versioned {
    fn version(&self) -> &crate::version::Version;
}

/// Trait for types that have timestamps
pub trait Timestamped {
    fn created_at(&self) -> &crate::time::Timestamp;
    fn updated_at(&self) -> Option<&crate::time::Timestamp>;
}

/// Trait for types that can be serialized to/from bytes
pub trait ByteSerializable: Sized {
    type Error;

    fn to_bytes(&self) -> Result<Vec<u8>, Self::Error>;
    fn from_bytes(bytes: &[u8]) -> Result<Self, Self::Error>;
}
```

---

## Cargo.toml

```toml
[package]
name = "symphony_types"
version = "0.1.0"
edition = "2021"
authors = ["Symphony Team"]
description = "Foundational types for Symphony IDE"
license = "MIT OR Apache-2.0"

[dependencies]
# Serialization
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# IDs and time
uuid = { version = "1.6", features = ["v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }

# Error handling
thiserror = "1.0"

[dev-dependencies]
# Testing utilities will be added as needed
```

---

## Testing Strategy

### Unit Tests
- ID generation and uniqueness
- Error conversion chains
- Version comparison and compatibility
- Timestamp calculations
- Lifecycle state transitions
- Capability validation

### Property Tests (with `proptest`)
- ID serialization round-trips
- Version ordering properties
- Timestamp monotonicity
- Message envelope integrity

### Integration Tests
- Cross-module type compatibility
- Serialization format stability
- Error propagation chains

---

## Migration Path

### Phase 1: Core Types (Week 1)
- IDs, errors, results, timestamps, versions
- Basic traits

### Phase 2: Messaging (Week 2)
- Message envelopes
- JSON-RPC types
- IPC frame types

### Phase 3: Domain Types (Week 3)
- Extension types
- Workflow types
- Artifact types

### Phase 4: Advanced Features (Week 4)
- Resource handles
- Capability tokens
- Advanced validation

---

## Open Questions

1. **Serialization Format**: MessagePack vs bincode for IPC?
   - **Recommendation**: Support both, make it configurable

2. **ID Generation**: UUID v4 vs v7 (timestamp-based)?
   - **Recommendation**: Start with v4, consider v7 for sortable IDs later

3. **Error Context**: Include stack traces in errors?
   - **Recommendation**: Use `anyhow` for internal errors, `thiserror` for public APIs

4. **Async Support**: Should Result types be `Send + Sync`?
   - **Recommendation**: Yes, all types should be thread-safe

---

## Dependencies on Other Packages

**Zero dependencies** - This package is the foundation.

## Packages That Will Depend on This

All 45 other packages will depend on `symphony_types`.

---

## Performance Considerations

- Newtypes have zero runtime cost (compile to underlying type)
- `Arc` used sparingly, only for large metadata
- Serialization formats chosen for speed (bincode) and compatibility (JSON)
- Error types designed for zero-cost when not used (no allocations in happy path)

---

## Security Considerations

- Capability tokens prevent privilege escalation
- Resource handles prevent resource leaks
- Type safety prevents ID confusion attacks
- Validation traits enforce invariants at type level

---

## Next Steps After Implementation

1. Update `logging` to use `SymphonyError` and `SymphonyResult`
2. Implement `config` using typed config structs from `types`
3. Build `ipc_bus` using message envelopes and IPC types
4. Gradually migrate all packages to use canonical types

---

**Status**: Ready for implementation  
**Estimated Effort**: 2-3 weeks (4 phases)  
**Priority**: Critical (blocks all other packages)
