# Xi-Editor Integration for Symphony IDE

This crate provides the integration layer between [xi-editor](https://github.com/xi-editor/xi-editor)'s proven text editing core and Symphony IDE's architecture.

## Overview

Rather than building a text editor from scratch or maintaining scaffold implementations, Symphony uses xi-editor's battle-tested code directly. This integration layer:

- **Wraps xi-editor components** (xi-rope, xi-core-lib, xi-rpc, xi-trace)
- **Translates protocols** between Symphony IPC and Xi-RPC
- **Provides Symphony-compatible API** for text editing operations

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Symphony Frontend (React)                  │
│                     Monaco Editor Component                  │
└─────────────────────────┬───────────────────────────────────┘
                          │ Symphony IPC Bus
┌─────────────────────────▼───────────────────────────────────┐
│                   Symphony Backend (Rust)                    │
│  ┌────────────────────────────────────────────────────┐     │
│  │           IPC Translation Layer (Future)            │     │
│  └────────────────────────┬───────────────────────────┘     │
│  ┌────────────────────────▼───────────────────────────┐     │
│  │         Xi-Integration Module (This Crate)          │     │
│  │  ┌──────────────────────────────────────────┐      │     │
│  │  │      Xi-Editor Components (Direct Use)   │      │     │
│  │  │  - xi-rope (rope data structure)         │      │     │
│  │  │  - xi-core-lib (editor engine)           │      │     │
│  │  │  - xi-rpc (protocol definitions)         │      │     │
│  │  │  - xi-trace (performance monitoring)     │      │     │
│  │  └──────────────────────────────────────────┘      │     │
│  └─────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Key Components

### XiIntegration

Main integration point that wraps xi-core functionality:

```rust
use xi_integration::{XiIntegration, XiConfig};

// Initialize xi-core integration
let mut xi = XiIntegration::new(XiConfig::default())?;

// Open a file
let view_id = xi.open_file("example.txt").await?;

// Get file content
let content = xi.get_content(view_id).await?;

// Perform edit
let edit = EditOperation::Insert {
    position: 0,
    text: "Hello, World!".to_string(),
};
xi.edit(view_id, edit).await?;
```

### Error Handling

Comprehensive error types for all operations:

```rust
use xi_integration::{XiError, XiResult};

fn example() -> XiResult<()> {
    // Operations that may fail
    Ok(())
}
```

### Type Definitions

Type-safe definitions for all Symphony-Xi communication:

- `ViewId`: Unique identifier for buffers
- `EditOperation`: Insert, Delete, Replace operations
- `BufferMetadata`: Buffer state information
- `XiConfig`: Configuration settings
- `SymphonyIpcRequest/Response`: IPC message types

## Requirements Satisfied

This integration satisfies the following requirements from the xi-editor migration spec:

- **Requirement 1.1**: Use Xi-Editor's rope implementation directly
- **Requirement 2.1**: Initialize Xi-Core as a Rust module within Symphony's backend
- **Requirement 17.1**: Use Xi-Editor code directly without migrating from scaffold packages
- **Requirement 17.3**: Reference xi-editor as the canonical implementation

## Dependencies

### Xi-Editor Crates (Path Dependencies)

All xi-editor components are used directly from the submodule at `apps/xi-editor/rust/`:

- **`xi-rope`** (with `serde` feature): Rope data structure for efficient text storage
  - Path: `../../xi-editor/rust/rope`
  - Features: Serialization support for IPC communication
- **`xi-core-lib`**: Editor engine with buffer management, undo/redo, multi-cursor
  - Path: `../../xi-editor/rust/core-lib`
- **`xi-rpc`**: RPC protocol definitions and message types
  - Path: `../../xi-editor/rust/rpc`
- **`xi-trace`**: Performance monitoring and profiling
  - Path: `../../xi-editor/rust/trace`

### Symphony Workspace Dependencies

Shared dependencies from Symphony's workspace configuration:

- **`serde`**, **`serde_json`**: Serialization/deserialization for IPC messages
- **`tokio`**: Async runtime for non-blocking operations
- **`anyhow`**: Flexible error handling for application code
- **`tracing`**: Structured logging and diagnostics
- **`async-trait`**: Async trait support
- **`futures`**: Future combinators and utilities

### Additional Dependencies

- **`thiserror`** (1.0): Custom error type definitions with derive macros
- **`crossbeam-channel`** (0.5): High-performance concurrent channels for IPC

### Development Dependencies

- **`tokio-test`** (0.4): Testing utilities for async code
- **`tempfile`** (3.8): Temporary file creation for integration tests

## Development

### Building

```bash
# From workspace root
cd apps/backend
cargo build -p xi-integration

# Or from the crate directory
cd apps/backend/xi_integration
cargo build
```

### Testing

```bash
# Run all tests
cargo test -p xi-integration

# Run tests with output
cargo test -p xi-integration -- --nocapture

# Run specific test
cargo test -p xi-integration test_name
```

### Documentation

```bash
# Generate and open documentation
cargo doc -p xi-integration --open

# Generate documentation with private items
cargo doc -p xi-integration --document-private-items --open
```

### Code Quality

```bash
# Run clippy lints
cargo clippy -p xi-integration --all-targets

# Format code
cargo fmt -p xi-integration

# Check for security vulnerabilities
cargo audit
```

## Future Work

This is the foundation for the complete xi-editor integration. Future phases will add:

1. **IPC Translation Layer**: Bidirectional protocol translation
2. **Buffer Manager**: Buffer lifecycle management
3. **Monaco Bridge**: Frontend synchronization
4. **Plugin Adapter**: Xi-editor plugin integration
5. **Performance Metrics**: Extended monitoring
6. **Autosave Manager**: Periodic saving
7. **Configuration Manager**: Settings synchronization

## License

This crate is part of Symphony IDE and is licensed under the MIT License.

Xi-editor components are licensed under the Apache-2.0 License.
