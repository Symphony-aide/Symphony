# Symphony Backend

Symphony's Rust backend built on XI-editor core.

## Architecture

Symphony uses a dual ensemble architecture (DEA):
- **Rust Backend**: High-performance core built on XI-editor
- **Python Conductor**: AI orchestration and reinforcement learning

## Structure

```
apps/backend/
├── crates/
│   ├── core/           # Core editing and RPC
│   │   ├── xi-core-lib/
│   │   ├── xi-rpc/
│   │   └── xi-lsp-lib/
│   ├── plugins/        # Plugin system
│   │   ├── xi-plugin-lib/
│   │   └── xi-syntect-plugin/
│   └── utils/          # Utilities
│       ├── xi-rope/
│       ├── xi-unicode/
│       └── xi-trace/
├── xi-core/
│   ├── python/         # Python bindings
│   └── rust/experimental/  # Experimental features
├── src/                # Symphony main entry point
└── Cargo.toml          # Workspace configuration
```

## Building

```bash
# Build all packages
cargo build

# Build release
cargo build --release

# Run tests
cargo test

# Run Symphony
cargo run
```

## XI-editor Integration

Symphony builds upon [XI-editor](https://github.com/xi-editor/xi-editor)'s excellent foundation:
- **Rope data structure**: Efficient text manipulation
- **JSON-RPC**: Communication protocol
- **Plugin system**: Extensible architecture
- **LSP support**: Language server integration
- **Async-first design**: Non-blocking operations

## License

Apache-2.0
