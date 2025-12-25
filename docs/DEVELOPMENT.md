# Symphony Backend Development Guide

## Quick Start

### Prerequisites
- Rust stable toolchain (automatically installed via `rust-toolchain.toml`)
- Python 3.8+ (for Conductor integration)
- LLVM/Clang (for faster linking)

### Initial Setup
```bash
# Install required Rust components (done automatically)
rustup show

# Install additional tools
cargo install cargo-make cargo-audit cargo-outdated cargo-deny cargo-tarpaulin

# Build the workspace
cargo build --workspace
```

## Development Workflow

### Using Cargo Aliases (Recommended)
```bash
# Quick check without building
cargo c

# Build with all features
cargo b

# Run tests
cargo t

# Run clippy with strict settings
cargo l

# Format code
cargo f

# Build and open documentation
cargo d
```

### Using Cargo Make Tasks
```bash
# Run pre-commit checks (format, lint, test)
cargo make pre-commit

# Run full CI pipeline
cargo make ci

# Run all quality checks
cargo make quality

# Development workflow
cargo make dev

# Prepare for release
cargo make release-prep
```

## Code Quality Standards

### Formatting
- **Tool**: `rustfmt`
- **Config**: `rustfmt.toml`
- **Command**: `cargo fmt --all`
- **Check**: `cargo fmt --all -- --check`

All code must be formatted before committing. Use tabs for indentation (4 spaces width).

### Linting
- **Tool**: `clippy`
- **Config**: `clippy.toml`
- **Command**: `cargo clippy --all-targets --all-features -- -D warnings`

Clippy warnings are treated as errors in CI. Fix all warnings before committing.

### Testing
- **Command**: `cargo test --all-features --workspace`
- **Coverage**: `cargo tarpaulin --all-features --workspace`

Aim for >80% code coverage. All public APIs must have tests.

### Documentation
- **Command**: `cargo doc --all-features --no-deps --open`

All public items must have documentation. Use `///` for doc comments.

## Build Profiles

### Development (`dev`)
- Fast compilation, debug symbols enabled
- Use for daily development

### Release (`release`)
- Maximum optimization, LTO enabled
- Use for production builds
- Command: `cargo build --release`

### Release with Debug (`release-with-debug`)
- Optimized but with debug symbols
- Use for profiling
- Command: `cargo build --profile release-with-debug`

### Size-Optimized (`release-small`)
- Optimized for binary size
- Use for distribution
- Command: `cargo build --profile release-small`

## Dependency Management

### Adding Dependencies
```bash
# Add to workspace dependencies in root Cargo.toml
# Then reference in package Cargo.toml:
[dependencies]
serde = { workspace = true }
```

### Checking Dependencies
```bash
# Check for security vulnerabilities
cargo audit

# Check for outdated dependencies
cargo outdated

# Check licenses and bans
cargo deny check
```

### Updating Dependencies
```bash
# Update to latest compatible versions
cargo update

# Update specific package
cargo update -p <package-name>
```

## Workspace Structure

```
apps/backend/
├── core/                    # Core JSON-RPC server
├── types/                   # Shared type definitions
├── config/                  # Configuration management
├── core_api/               # Public API traits
├── extension/              # Extension system
│   ├── layers/
│   │   ├── aide/pit/      # In-process AIDE extensions
│   │   └── ide/           # IDE features
│   └── sdk/               # Extension SDK
├── conductor/             # Python integration
├── bootstrap/             # Initialization system
├── ipc_bus/              # IPC communication
├── orchestration/        # Workflow engine
├── kit/                  # Extension ecosystem
└── ...
```

## Best Practices

### Code Style
1. Use meaningful variable and function names
2. Keep functions under 20 lines when possible
3. Prefer composition over inheritance
4. Use early returns to reduce nesting
5. Avoid `unwrap()` and `expect()` in production code

### Error Handling
1. Use `thiserror` for custom error types
2. Use `anyhow` for application errors
3. Propagate errors with `?` operator
4. Provide context with `.context()` or `.with_context()`

### Async Code
1. Use `tokio` for async runtime
2. Use `async-trait` for async traits
3. Avoid blocking calls in async code
4. Use `spawn_blocking` for CPU-intensive work

### Performance
1. Use `parking_lot` instead of `std::sync`
2. Use `dashmap` for concurrent hash maps
3. Profile before optimizing
4. Use `#[inline]` judiciously

### Documentation
1. Document all public APIs
2. Include examples in doc comments
3. Document panics and safety requirements
4. Keep docs up to date with code

## CI/CD Integration

### Pre-commit Checks
```bash
cargo make pre-commit
```

### CI Pipeline
```bash
cargo make ci
```

### Security Checks
```bash
cargo audit
cargo deny check
```

## Troubleshooting

### Slow Compilation
- Use `sccache` or `mold` linker
- Reduce `codegen-units` in release builds
- Use `cargo check` instead of `cargo build` during development

### IDE Issues
- Run `cargo clean` and rebuild
- Check `rust-analyzer` logs
- Ensure all components are installed: `rustup component list`

### Test Failures
- Run with `RUST_BACKTRACE=1` for stack traces
- Use `cargo test -- --nocapture` to see println output
- Run specific test: `cargo test <test_name>`

## Resources

- [Rust Book](https://doc.rust-lang.org/book/)
- [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/)
- [Tokio Tutorial](https://tokio.rs/tokio/tutorial)
- [Clippy Lints](https://rust-lang.github.io/rust-clippy/master/)
