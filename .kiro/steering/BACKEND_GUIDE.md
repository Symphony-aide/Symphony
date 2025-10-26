# Symphony Backend Development Guide

This guide covers development practices for Symphony's sophisticated Rust-based backend system, including the 40+ crate workspace, microkernel architecture, and extension system.

## Architecture Overview

Symphony's backend implements a **microkernel architecture** with dual execution models:

### The Conductor (Python Core)
- **Location**: `apps/backend/conductor/`
- **Purpose**: AI orchestration engine trained via Function Quest Game (FQG)
- **Integration**: PyO3 bindings for Rust interoperability
- **Responsibilities**: Workflow orchestration, model lifecycle, decision-making

### The Pit (Infrastructure as Extensions - IaE)
Five critical Rust extensions running **in-process** for microsecond performance:
- **Pool Manager**: `apps/backend/extension/layers/aide/pit/pool_manager/`
- **DAG Tracker**: `apps/backend/extension/layers/aide/pit/dag_tracker/`
- **Artifact Store**: `apps/backend/extension/layers/aide/pit/artifact_store/`
- **Arbitration Engine**: `apps/backend/extension/layers/aide/pit/arbitration_engine/`
- **Stale Manager**: `apps/backend/extension/layers/aide/pit/stale_manager/`

### User-Faced Extensions (UFE)
Extensions running **out-of-process** for safety and isolation:
- **Instruments**: AI/ML models (`apps/backend/kit/instruments/`)
- **Operators**: Workflow utilities (`apps/backend/kit/operators/`)
- **Addons**: UI enhancements (`apps/backend/kit/motifs/`)

## Rust Code Standards

### Documentation Requirements

**All public items MUST have `///` documentation:**

```rust
//! Module-level documentation for the entire module
//!
//! This module provides core functionality for Symphony's Pool Manager,
//! handling AI model lifecycle, resource allocation, and performance optimization.
//!
//! # Architecture
//!
//! The Pool Manager operates as part of The Pit (IaE), providing microsecond-level
//! model allocation and deallocation for Symphony's AI orchestration system.
//!
//! # Examples
//!
//! ```
//! use symphony_pool_manager::{PoolManager, ModelSpec};
//!
//! let mut pool = PoolManager::new();
//! let model = pool.allocate_model(ModelSpec::gpt4_turbo())?;
//! ```

use std::sync::Arc;
use tokio::sync::RwLock;
use serde::{Deserialize, Serialize};

/// High-performance AI model pool manager for Symphony's orchestration system
///
/// Manages the complete lifecycle of AI models from cold storage to active execution,
/// optimizing for both performance and cost efficiency. Operates as part of The Pit
/// infrastructure layer with microsecond-level allocation times.
///
/// # Performance Characteristics
///
/// - Model allocation: ~50μs average latency
/// - Memory overhead: <1MB per managed model
/// - Concurrent allocations: Up to 1000/second
///
/// # Examples
///
/// ```
/// use symphony_pool_manager::{PoolManager, ModelSpec, Priority};
///
/// let mut pool = PoolManager::new();
/// 
/// // Allocate a high-priority model
/// let model = pool.allocate_model(
///     ModelSpec::new("gpt-4-turbo", "openai"),
///     Priority::High
/// )?;
///
/// // Use the model...
/// 
/// // Return to pool when done
/// pool.deallocate_model(model)?;
/// ```
#[derive(Debug)]
pub struct PoolManager {
    /// Active model instances mapped by unique identifiers
    active_models: Arc<RwLock<HashMap<ModelId, ModelInstance>>>,
    
    /// Pool configuration and resource limits
    config: PoolConfig,
    
    /// Performance metrics and monitoring
    metrics: Arc<PoolMetrics>,
}

impl PoolManager {
    /// Creates a new pool manager with default configuration
    ///
    /// Initializes the pool with standard resource limits and monitoring.
    /// For custom configuration, use [`PoolManager::with_config`].
    ///
    /// # Examples
    ///
    /// ```
    /// use symphony_pool_manager::PoolManager;
    ///
    /// let pool = PoolManager::new();
    /// assert_eq!(pool.active_count(), 0);
    /// ```
    pub fn new() -> Self {
        Self::with_config(PoolConfig::default())
    }

    /// Allocates an AI model with specified priority
    ///
    /// Attempts to allocate a model instance from the pool, loading from cold
    /// storage if necessary. Uses intelligent pre-warming based on usage patterns.
    ///
    /// # Arguments
    ///
    /// * `spec` - Model specification including provider and version
    /// * `priority` - Allocation priority affecting queue position
    ///
    /// # Returns
    ///
    /// Returns a [`ModelHandle`] for the allocated model instance.
    ///
    /// # Errors
    ///
    /// Returns [`PoolError::ResourceExhausted`] if no capacity is available.
    /// Returns [`PoolError::ModelNotFound`] if the specified model doesn't exist.
    /// Returns [`PoolError::Timeout`] if allocation takes longer than configured limit.
    ///
    /// # Performance
    ///
    /// - Hot allocation (model already loaded): ~50μs
    /// - Cold allocation (model needs loading): ~2-5s depending on model size
    /// - Queue wait time: Variable based on priority and current load
    ///
    /// # Examples
    ///
    /// ```
    /// use symphony_pool_manager::{PoolManager, ModelSpec, Priority};
    ///
    /// let mut pool = PoolManager::new();
    /// 
    /// match pool.allocate_model(ModelSpec::gpt4_turbo(), Priority::High) {
    ///     Ok(handle) => {
    ///         println!("Allocated model: {}", handle.id());
    ///         // Use the model...
    ///     }
    ///     Err(e) => eprintln!("Allocation failed: {}", e),
    /// }
    /// ```
    pub async fn allocate_model(
        &mut self,
        spec: ModelSpec,
        priority: Priority,
    ) -> Result<ModelHandle, PoolError> {
        // Implementation details...
        todo!("Implementation in progress")
    }
}
```

### Error Handling Standards

**Use `thiserror` for custom error types:**

```rust
use thiserror::Error;

/// Errors that can occur during pool operations
#[derive(Error, Debug, Clone, PartialEq, Eq)]
pub enum PoolError {
    /// No available capacity for model allocation
    #[error("Pool capacity exhausted: {available} slots available, {requested} requested")]
    ResourceExhausted { available: usize, requested: usize },
    
    /// Specified model not found in registry
    #[error("Model not found: {model_id} from provider {provider}")]
    ModelNotFound { model_id: String, provider: String },
    
    /// Operation timed out
    #[error("Operation timed out after {timeout_ms}ms")]
    Timeout { timeout_ms: u64 },
    
    /// Configuration error
    #[error("Configuration error: {message}")]
    Configuration { message: String },
    
    /// Internal system error
    #[error("Internal error: {source}")]
    Internal {
        #[from]
        source: Box<dyn std::error::Error + Send + Sync>,
    },
}
```

### Performance-Critical Code Standards

**For The Pit (IaE) components:**

```rust
/// High-performance artifact storage with microsecond access times
///
/// Optimized for Symphony's orchestration workflows with lock-free reads
/// and batched writes. Uses memory-mapped files for large artifacts.
///
/// # Performance Guarantees
///
/// - Read latency: <15μs for cached artifacts
/// - Write latency: <25μs for small artifacts (<1MB)
/// - Throughput: >66,000 operations/second
///
/// # Safety
///
/// This implementation uses `unsafe` code for memory-mapped file access.
/// All unsafe operations are contained within well-tested helper functions.
pub struct ArtifactStore {
    // Lock-free read path using atomic pointers
    index: Arc<AtomicPtr<ArtifactIndex>>,
    
    // Write coordination using parking_lot for performance
    write_lock: parking_lot::Mutex<WriteState>,
    
    // Memory-mapped storage regions
    storage: Arc<MmapStorage>,
}

impl ArtifactStore {
    /// Retrieves an artifact by ID with lock-free read access
    ///
    /// Uses atomic operations for thread-safe access without locks on the
    /// read path. Falls back to disk if not in memory cache.
    ///
    /// # Performance
    ///
    /// - Memory cache hit: ~15μs
    /// - Disk cache hit: ~100μs
    /// - Cold storage: ~1-10ms depending on size
    ///
    /// # Safety
    ///
    /// This function uses unsafe pointer operations for lock-free access.
    /// Memory safety is guaranteed through epoch-based reclamation.
    pub fn get(&self, id: ArtifactId) -> Option<Arc<Artifact>> {
        // Lock-free implementation using atomic operations
        // SAFETY: Index pointer is managed through epoch-based reclamation
        unsafe {
            let index = self.index.load(Ordering::Acquire);
            if index.is_null() {
                return None;
            }
            (*index).get(id)
        }
    }
}
```

### Extension Development Standards

**For UFE (User-Faced Extensions):**

```rust
//! TypeScript Language Server extension for Symphony
//!
//! Provides intelligent TypeScript support including autocomplete, diagnostics,
//! and refactoring capabilities. Integrates with Symphony's orchestration system
//! for AI-enhanced code suggestions.
//!
//! # Extension Manifest
//!
//! This extension declares the following capabilities:
//! - Language server protocol (LSP) support
//! - File system access (read-only for TypeScript files)
//! - Process spawning (for tsserver)
//!
//! # Examples
//!
//! ```
//! use symphony_typescript_lsp::{TypeScriptLsp, LspConfig};
//!
//! let config = LspConfig::default();
//! let lsp = TypeScriptLsp::new(config)?;
//! lsp.start().await?;
//! ```

use symphony_extension_sdk::{Extension, ExtensionResult, Manifest};
use lsp_types::{InitializeParams, ServerCapabilities};

/// TypeScript Language Server extension for Symphony
///
/// Provides comprehensive TypeScript language support through the Language
/// Server Protocol (LSP). Integrates with Symphony's AI orchestration for
/// enhanced code intelligence.
///
/// # Capabilities
///
/// - Syntax highlighting and error detection
/// - Intelligent autocomplete with AI suggestions
/// - Go-to-definition and find references
/// - Automated refactoring with AI assistance
/// - Real-time diagnostics and quick fixes
///
/// # Resource Usage
///
/// - Memory: ~50-200MB depending on project size
/// - CPU: Low background usage, spikes during analysis
/// - Disk: Temporary files in system temp directory
///
/// # Examples
///
/// ```
/// use symphony_typescript_lsp::{TypeScriptLsp, LspConfig};
///
/// // Create with default configuration
/// let lsp = TypeScriptLsp::new(LspConfig::default())?;
///
/// // Start the language server
/// lsp.start().await?;
///
/// // The extension will now respond to LSP requests from Symphony
/// ```
pub struct TypeScriptLsp {
    /// Language server process handle
    server_process: Option<tokio::process::Child>,
    
    /// Configuration for the language server
    config: LspConfig,
    
    /// Communication channel with Symphony core
    ipc_channel: symphony_ipc::Channel,
}

#[symphony_extension_sdk::extension]
impl Extension for TypeScriptLsp {
    /// Extension manifest declaring capabilities and permissions
    ///
    /// Defines what this extension can do and what resources it needs access to.
    /// Symphony uses this information for security sandboxing and UI generation.
    fn manifest() -> Manifest {
        Manifest::builder()
            .name("TypeScript Language Server")
            .version("1.0.0")
            .description("Intelligent TypeScript support with AI enhancement")
            .author("Symphony Community")
            .capabilities(&[
                "language_server",
                "file_system_read",
                "process_spawn",
                "ai_integration",
            ])
            .file_patterns(&["**/*.ts", "**/*.tsx", "**/tsconfig.json"])
            .build()
    }

    /// Initializes the extension with Symphony's runtime
    ///
    /// Called when Symphony loads the extension. Performs initial setup
    /// but doesn't start the language server until explicitly requested.
    ///
    /// # Arguments
    ///
    /// * `context` - Extension runtime context from Symphony
    ///
    /// # Errors
    ///
    /// Returns [`ExtensionError::InitializationFailed`] if setup fails.
    async fn initialize(
        &mut self,
        context: symphony_extension_sdk::Context,
    ) -> ExtensionResult<()> {
        self.ipc_channel = context.ipc_channel();
        
        // Validate TypeScript installation
        self.validate_typescript_installation().await?;
        
        // Register with Symphony's language server manager
        context.register_language_server("typescript", self).await?;
        
        Ok(())
    }
}
```

## Build System Standards

### Cargo.toml Structure

**Workspace-level dependencies:**

```toml
[workspace.dependencies]
# Core dependencies shared across all crates
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1.35", features = ["full"] }
anyhow = "1.0"
thiserror = "1.0"
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter", "json"] }

# Performance-critical dependencies
parking_lot = "0.12"
dashmap = "5.5"
crossbeam = "0.8"

# Symphony-specific dependencies
symphony-types = { path = "types" }
symphony-config = { path = "config" }
symphony-ipc = { path = "ipc_bus" }
```

**Individual crate dependencies:**

```toml
[package]
name = "symphony-pool-manager"
version = "0.1.0"
edition = "2021"
authors = ["Symphony Team"]
description = "High-performance AI model pool manager for Symphony orchestration"
license = "MIT"
repository = "https://github.com/Symphony-Code-Editor/Symphony-App"

[dependencies]
# Use workspace dependencies
serde = { workspace = true }
tokio = { workspace = true, features = ["sync", "process"] }
thiserror = { workspace = true }
tracing = { workspace = true }

# Crate-specific dependencies
uuid = { version = "1.6", features = ["v4", "serde"] }
```

### Performance Profiles

**Development profile for fast iteration:**

```toml
[profile.dev]
opt-level = 0
debug = true
debug-assertions = true
overflow-checks = true
lto = false
panic = "unwind"
incremental = true
codegen-units = 256
```

**Release profile for production:**

```toml
[profile.release]
opt-level = 3
debug = false
debug-assertions = false
overflow-checks = false
lto = "fat"
panic = "abort"
incremental = false
codegen-units = 1
strip = true
```

## Testing Standards

### Unit Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use tokio_test;

    #[tokio::test]
    async fn test_pool_allocation_success() {
        let mut pool = PoolManager::new();
        let spec = ModelSpec::new("test-model", "test-provider");
        
        let result = pool.allocate_model(spec, Priority::Normal).await;
        
        assert!(result.is_ok());
        let handle = result.unwrap();
        assert_eq!(handle.model_id(), "test-model");
        assert_eq!(pool.active_count(), 1);
    }

    #[tokio::test]
    async fn test_pool_exhaustion() {
        let config = PoolConfig::builder()
            .max_models(1)
            .build();
        let mut pool = PoolManager::with_config(config);
        
        // Allocate first model - should succeed
        let _handle1 = pool.allocate_model(
            ModelSpec::new("model1", "provider"),
            Priority::Normal
        ).await.unwrap();
        
        // Allocate second model - should fail
        let result = pool.allocate_model(
            ModelSpec::new("model2", "provider"),
            Priority::Normal
        ).await;
        
        assert!(matches!(result, Err(PoolError::ResourceExhausted { .. })));
    }
}
```

### Integration Tests

```rust
// tests/integration_test.rs
use symphony_pool_manager::{PoolManager, ModelSpec, Priority};
use symphony_test_utils::{TestRuntime, MockModelProvider};

#[tokio::test]
async fn test_full_model_lifecycle() {
    let _runtime = TestRuntime::new();
    let provider = MockModelProvider::new();
    
    let mut pool = PoolManager::with_provider(Box::new(provider));
    
    // Test allocation
    let handle = pool.allocate_model(
        ModelSpec::gpt4_turbo(),
        Priority::High
    ).await.expect("Failed to allocate model");
    
    // Test usage
    let response = handle.generate("Hello, world!").await
        .expect("Failed to generate response");
    assert!(!response.is_empty());
    
    // Test deallocation
    pool.deallocate_model(handle).await
        .expect("Failed to deallocate model");
    
    assert_eq!(pool.active_count(), 0);
}
```

## Development Workflow

### Daily Development Commands

```bash
# In apps/backend/ directory

# Quick development cycle
cargo check --workspace          # Fast syntax/type checking
cargo clippy --workspace         # Linting with fixes
cargo test --workspace           # Run all tests
cargo fmt --all                  # Format code

# Full quality check
cargo make pre-commit            # Complete pre-commit pipeline
cargo make ci                    # Full CI pipeline locally

# Performance testing
cargo bench                      # Run benchmarks
cargo flamegraph --bin server    # Profile with flamegraph
```

### Extension Development

```bash
# Create new extension
cargo new --lib extensions/my-extension
cd extensions/my-extension

# Add to workspace Cargo.toml
# [workspace]
# members = [..., "extensions/my-extension"]

# Develop with hot reload
cargo watch -x "check --package my-extension"

# Test extension in isolation
cargo test --package my-extension

# Build for distribution
cargo build --release --package my-extension
```

## Security Standards

### Input Validation

```rust
use symphony_types::{ModelId, ValidationError};

/// Validates a model identifier for security and format compliance
///
/// Ensures the model ID contains only safe characters and follows
/// Symphony's naming conventions to prevent injection attacks.
///
/// # Security
///
/// This function prevents:
/// - Path traversal attacks (../, ..\)
/// - Command injection (shell metacharacters)
/// - SQL injection (quotes, semicolons)
/// - Script injection (angle brackets, quotes)
///
/// # Examples
///
/// ```
/// use symphony_pool_manager::validate_model_id;
///
/// assert!(validate_model_id("gpt-4-turbo").is_ok());
/// assert!(validate_model_id("../../../etc/passwd").is_err());
/// assert!(validate_model_id("model; rm -rf /").is_err());
/// ```
pub fn validate_model_id(id: &str) -> Result<ModelId, ValidationError> {
    // Check length limits
    if id.is_empty() || id.len() > 128 {
        return Err(ValidationError::InvalidLength);
    }
    
    // Check for dangerous characters
    const FORBIDDEN_CHARS: &[char] = &[
        '/', '\\', '..', ';', '&', '|', '`', '$', 
        '<', '>', '"', '\'', '\n', '\r', '\0'
    ];
    
    if id.chars().any(|c| FORBIDDEN_CHARS.contains(&c)) {
        return Err(ValidationError::ForbiddenCharacters);
    }
    
    // Ensure it matches expected pattern
    if !id.chars().all(|c| c.is_alphanumeric() || c == '-' || c == '_') {
        return Err(ValidationError::InvalidFormat);
    }
    
    Ok(ModelId::new(id))
}
```

### Resource Limits

```rust
/// Resource limits for extension execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceLimits {
    /// Maximum memory usage in bytes
    pub max_memory: u64,
    
    /// Maximum CPU time in milliseconds
    pub max_cpu_time: u64,
    
    /// Maximum number of file handles
    pub max_file_handles: u32,
    
    /// Maximum network connections
    pub max_network_connections: u32,
    
    /// Execution timeout in seconds
    pub timeout_seconds: u64,
}

impl Default for ResourceLimits {
    fn default() -> Self {
        Self {
            max_memory: 128 * 1024 * 1024,      // 128MB
            max_cpu_time: 30_000,               // 30 seconds
            max_file_handles: 100,
            max_network_connections: 10,
            timeout_seconds: 60,
        }
    }
}
```

## Monitoring and Observability

### Structured Logging

### Use our logging inside apps/backend/logging

This guide ensures that all Symphony backend development follows consistent, high-quality standards while maintaining the performance and security requirements of the sophisticated microkernel architecture.