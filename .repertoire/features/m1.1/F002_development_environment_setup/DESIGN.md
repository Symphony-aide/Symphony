# F002: Development Environment Setup - Design

**Feature**: F002_development_environment_setup  
**Architecture Pattern**: Development Infrastructure  
**Design Complexity**: Low-Medium

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SYMPHONY DEVELOPMENT ENVIRONMENT                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        LOCAL DEVELOPMENT                                ││
│  │                                                                         ││
│  │   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       ││
│  │   │  Cargo Workspace │  │ Development     │  │   Code Quality  │       ││
│  │   │                 │  │ Tooling         │  │   Tools         │       ││
│  │   │ • symphony-core-│  │                 │  │                 │       ││
│  │   │   ports/        │  │ • rustfmt       │  │ • clippy        │       ││
│  │   │ • Cargo.toml    │  │ • rust-analyzer │  │ • tarpaulin     │       ││
│  │   │ • workspace     │  │ • cargo-watch   │  │ • cargo-audit   │       ││
│  │   │   config        │  │                 │  │                 │       ││
│  │   └─────────────────┘  └─────────────────┘  └─────────────────┘       ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         CI/CD PIPELINE                                  ││
│  │                                                                         ││
│  │   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       ││
│  │   │   Build Stage   │  │   Test Stage    │  │  Quality Stage  │       ││
│  │   │                 │  │                 │  │                 │       ││
│  │   │ • Rust setup    │  │ • Unit tests    │  │ • Clippy lint   │       ││
│  │   │ • Dependencies  │  │ • Integration   │  │ • Format check  │       ││
│  │   │ • Compilation   │  │ • Property tests│  │ • Security scan │       ││
│  │   │ • Multi-version │  │ • Coverage      │  │ • Doc generation│       ││
│  │   └─────────────────┘  └─────────────────┘  └─────────────────┘       ││
│  │                                                                         ││
│  │   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       ││
│  │   │ Deploy Stage    │  │  Notification   │  │   Artifacts     │       ││
│  │   │                 │  │                 │  │                 │       ││
│  │   │ • Documentation │  │ • PR status     │  │ • Coverage      │       ││
│  │   │ • GitHub Pages  │  │ • Slack alerts  │  │ • Docs          │       ││
│  │   │ • Crate publish │  │ • Email reports │  │ • Binaries      │       ││
│  │   └─────────────────┘  └─────────────────┘  └─────────────────┘       ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                      CONFIGURATION MANAGEMENT                           ││
│  │                                                                         ││
│  │   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       ││
│  │   │ Linting Config  │  │ Format Config   │  │ Project Config  │       ││
│  │   │                 │  │                 │  │                 │       ││
│  │   │ • .clippy.toml  │  │ • rustfmt.toml  │  │ • Cargo.toml    │       ││
│  │   │ • Pedantic      │  │ • Line width    │  │ • Dependencies  │       ││
│  │   │ • Nursery       │  │ • Tab spaces    │  │ • Features      │       ││
│  │   │ • Allow list    │  │ • Edition 2021  │  │ • Metadata      │       ││
│  │   └─────────────────┘  └─────────────────┘  └─────────────────┘       ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

## Module Design

### Cargo Workspace Configuration (`apps/backend/Cargo.toml`)

```toml
[workspace]
members = [
    "crates/symphony-core-ports",
    # Future crates will be added here
]
resolver = "2"

[workspace.dependencies]
# Shared dependencies across all crates
async-trait = "0.1.74"
tokio = { version = "1.35.0", features = ["full"] }
thiserror = "1.0.50"
uuid = { version = "1.6.1", features = ["v4", "serde"] }
serde = { version = "1.0.193", features = ["derive"] }
serde_json = "1.0.108"

[workspace.metadata.docs.rs]
all-features = true
rustdoc-args = ["--cfg", "docsrs"]

# Workspace-wide linting configuration
[workspace.lints.rust]
unsafe_code = "forbid"
missing_docs = "warn"

[workspace.lints.clippy]
pedantic = "warn"
nursery = "warn"
# Allow some pedantic lints that are too strict
module_name_repetitions = "allow"
similar_names = "allow"
too_many_lines = "allow"
```

### Crate Configuration (`apps/backend/crates/symphony-core-ports/Cargo.toml`)

```toml
[package]
name = "symphony-core-ports"
version = "0.1.0"
edition = "2021"
authors = ["Symphony Team <team@symphony.dev>"]
description = "Core port interfaces for Symphony's Hexagonal Architecture"
documentation = "https://docs.rs/symphony-core-ports"
repository = "https://github.com/symphony-org/symphony"
license = "MIT OR Apache-2.0"
keywords = ["symphony", "ports", "hexagonal", "architecture", "async"]
categories = ["development-tools", "asynchronous"]
readme = "README.md"

[dependencies]
# Use workspace dependencies for consistency
async-trait = { workspace = true }
tokio = { workspace = true }
thiserror = { workspace = true }
uuid = { workspace = true }
serde = { workspace = true }

[dev-dependencies]
tokio-test = "0.4.3"
proptest = "1.4.0"
serde_json = { workspace = true }

[features]
default = []
# Feature for enabling additional debugging
debug = []
# Feature for test utilities
test-utils = []

# Metadata for docs.rs
[package.metadata.docs.rs]
all-features = true
rustdoc-args = ["--cfg", "docsrs"]

# Inherit workspace lints
[lints]
workspace = true
```

## Development Tooling Configuration

### Clippy Configuration (`.clippy.toml`)

```toml
# Enable pedantic and nursery lints for high code quality
pedantic = true
nursery = true

# Allow certain pedantic lints that are too restrictive
allow = [
    "module_name_repetitions",  # Port names often repeat module names
    "similar_names",            # Similar parameter names are sometimes appropriate
    "too_many_lines",          # Some files legitimately need many lines
    "missing_errors_doc",      # Error documentation can be inferred
    "missing_panics_doc",      # Panic documentation for infallible code
]

# Deny certain lints that should never be allowed
deny = [
    "unsafe_code",             # No unsafe code without explicit justification
    "unwrap_used",             # Use proper error handling instead
    "expect_used",             # Use proper error handling instead
    "panic",                   # No panics in library code
]

# Set maximum complexity thresholds
cognitive-complexity-threshold = 30
type-complexity-threshold = 250
```

### Rustfmt Configuration (`rustfmt.toml`)

```toml
# Use Rust 2021 edition formatting
edition = "2021"

# Line width and indentation
max_width = 120
tab_spaces = 4
use_small_heuristics = "Default"

# Import formatting
imports_granularity = "Crate"
group_imports = "StdExternalCrate"
reorder_imports = true

# Function and struct formatting
fn_args_layout = "Tall"
brace_style = "SameLineWhere"
control_brace_style = "AlwaysSameLine"

# Comment formatting
comment_width = 100
wrap_comments = true
normalize_comments = true
normalize_doc_attributes = true

# String formatting
format_strings = true
format_macro_matchers = true

# Misc formatting options
remove_nested_parens = true
use_field_init_shorthand = true
use_try_shorthand = true
```

### Tarpaulin Configuration (`.tarpaulin.toml`)

```toml
[tool.tarpaulin.default]
# Coverage configuration
exclude-files = [
    "*/tests/*",
    "*/examples/*",
    "*/benches/*",
]

# Output formats
out = ["Html", "Lcov", "Json"]
output-dir = "target/tarpaulin"

# Coverage thresholds
fail-under = 90.0
ignore-panics = true
ignore-tests = true

# Engine configuration
engine = "llvm"
follow-exec = true
post-args = ["--", "--test-threads", "1"]

[tool.tarpaulin.ci]
# CI-specific configuration
out = ["Lcov"]
fail-under = 85.0  # Slightly lower threshold for CI
timeout = 300      # 5 minute timeout
```

## CI/CD Pipeline Design

### GitHub Actions Workflow (`.github/workflows/rust.yml`)

```yaml
name: Rust CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  CARGO_TERM_COLOR: always
  RUST_BACKTRACE: 1

jobs:
  # Format check job
  format:
    name: Format Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          components: rustfmt
      - name: Check formatting
        run: cargo fmt --all -- --check

  # Linting job
  lint:
    name: Clippy Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          components: clippy
      - uses: Swatinem/rust-cache@v2
      - name: Run clippy
        run: cargo clippy --all-targets --all-features -- -D warnings

  # Security audit job
  audit:
    name: Security Audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: Swatinem/rust-cache@v2
      - name: Install cargo-audit
        run: cargo install cargo-audit
      - name: Run security audit
        run: cargo audit

  # Test matrix job
  test:
    name: Test Suite
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        rust: [stable, beta]
        include:
          - os: ubuntu-latest
            rust: nightly
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@master
        with:
          toolchain: ${{ matrix.rust }}
      - uses: Swatinem/rust-cache@v2
      - name: Run tests
        run: cargo test --all-features --verbose

  # Coverage job (Linux only)
  coverage:
    name: Code Coverage
    runs-on: ubuntu-latest
    needs: [format, lint, test]
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: Swatinem/rust-cache@v2
      - name: Install tarpaulin
        run: cargo install cargo-tarpaulin
      - name: Generate coverage
        run: cargo tarpaulin --config .tarpaulin.toml --workspace
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: target/tarpaulin/lcov.info
          fail_ci_if_error: true

  # Documentation job
  docs:
    name: Documentation
    runs-on: ubuntu-latest
    needs: [format, lint, test]
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: Swatinem/rust-cache@v2
      - name: Build documentation
        run: cargo doc --all-features --no-deps
      - name: Deploy to GitHub Pages
        if: github.ref == 'refs/heads/main'
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: target/doc
```

## Data Structures

### Development Configuration Structure
```rust
// Configuration types for development tooling
pub struct DevelopmentConfig {
    pub clippy: ClippyConfig,
    pub rustfmt: RustfmtConfig,
    pub tarpaulin: TarpaulinConfig,
    pub ci_cd: CiCdConfig,
}

pub struct ClippyConfig {
    pub pedantic: bool,
    pub nursery: bool,
    pub allowed_lints: Vec<String>,
    pub denied_lints: Vec<String>,
}

pub struct RustfmtConfig {
    pub max_width: usize,
    pub tab_spaces: usize,
    pub edition: String,
    pub imports_granularity: String,
}

pub struct TarpaulinConfig {
    pub fail_under: f64,
    pub exclude_files: Vec<String>,
    pub output_formats: Vec<String>,
}

pub struct CiCdConfig {
    pub rust_versions: Vec<String>,
    pub platforms: Vec<String>,
    pub timeout_minutes: u32,
}
```

### Project Metadata Structure
```toml
# Cargo.toml metadata structure
[package.metadata.symphony]
# Symphony-specific metadata
architecture = "hexagonal"
layer = "infrastructure"
stability = "experimental"

[package.metadata.symphony.quality]
# Quality requirements
min_coverage = 90.0
max_complexity = 30
clippy_level = "pedantic"

[package.metadata.symphony.ci]
# CI/CD configuration
required_checks = ["format", "lint", "test", "coverage"]
platforms = ["linux", "windows", "macos"]
rust_versions = ["stable", "beta"]
```

## Error Handling Strategy

### Development Environment Errors
```rust
#[derive(Debug, thiserror::Error)]
pub enum DevelopmentError {
    #[error("Build failed: {message}")]
    BuildFailed { message: String },
    
    #[error("Test failed: {test_name}")]
    TestFailed { test_name: String },
    
    #[error("Linting failed: {violations}")]
    LintingFailed { violations: Vec<String> },
    
    #[error("Coverage below threshold: {actual}% < {required}%")]
    CoverageBelowThreshold { actual: f64, required: f64 },
    
    #[error("Documentation generation failed: {reason}")]
    DocumentationFailed { reason: String },
}
```

### CI/CD Pipeline Error Handling
- **Build Failures**: Fail fast with clear error messages
- **Test Failures**: Report specific test failures with context
- **Coverage Failures**: Show coverage delta and missing areas
- **Lint Failures**: List specific violations with fix suggestions

## Performance Considerations

### Build Performance Optimization
```toml
# Cargo.toml optimizations
[profile.dev]
# Fast compilation for development
opt-level = 0
debug = true
incremental = true

[profile.release]
# Optimized for production
opt-level = 3
debug = false
lto = true
codegen-units = 1

[profile.test]
# Balanced for testing
opt-level = 1
debug = true
```

### CI/CD Performance Optimization
- **Dependency Caching**: Cache Cargo dependencies between runs
- **Incremental Builds**: Use incremental compilation where possible
- **Parallel Execution**: Run independent jobs in parallel
- **Artifact Reuse**: Share build artifacts between jobs

### Developer Experience Optimization
- **Fast Feedback**: Local tools provide immediate feedback
- **IDE Integration**: Configuration works with rust-analyzer
- **Hot Reloading**: cargo-watch for automatic rebuilds
- **Quick Commands**: Makefile or just commands for common tasks

## Testing Strategy

### Development Environment Testing
```bash
# Local testing commands
cargo build                    # Basic compilation test
cargo test                     # Run all tests
cargo clippy                   # Linting check
cargo fmt --check             # Format check
cargo audit                   # Security audit
cargo doc                     # Documentation generation
```

### CI/CD Pipeline Testing
- **Pipeline Validation**: Test pipeline changes in feature branches
- **Matrix Testing**: Verify across multiple Rust versions and platforms
- **Performance Testing**: Monitor pipeline execution time
- **Failure Testing**: Verify proper error handling and reporting

### Quality Gate Testing
- **Coverage Thresholds**: Ensure minimum coverage requirements
- **Lint Compliance**: Zero warnings with pedantic lints
- **Format Compliance**: Consistent code formatting
- **Security Compliance**: No known vulnerabilities

## Documentation Generation

### Rustdoc Configuration
```rust
// src/lib.rs - Documentation configuration
#![cfg_attr(docsrs, feature(doc_cfg))]
#![warn(missing_docs)]
#![warn(rustdoc::missing_crate_level_docs)]

//! # Symphony Core Ports
//! 
//! This crate provides the core port interfaces for Symphony's Hexagonal Architecture.
//! 
//! ## Architecture
//! 
//! The ports defined in this crate abstract external dependencies and enable clean
//! separation between domain logic and concrete implementations.
//! 
//! ## Usage
//! 
//! ```rust
//! use symphony_core_ports::{TextEditingPort, MockTextEditingAdapter};
//! 
//! #[tokio::main]
//! async fn main() {
//!     let adapter = MockTextEditingAdapter::new();
//!     // Use the adapter through the port interface
//! }
//! ```
```

### Documentation Structure
```
docs/
├── architecture/              # Architecture documentation
│   ├── hexagonal.md          # Hexagonal architecture overview
│   ├── ports.md              # Port design principles
│   └── adapters.md           # Adapter implementation guide
├── development/              # Development documentation
│   ├── setup.md              # Development environment setup
│   ├── workflow.md           # Development workflow
│   ├── testing.md            # Testing guidelines
│   └── ci-cd.md              # CI/CD pipeline documentation
└── api/                      # Generated API documentation
    └── index.html            # Rustdoc generated docs
```

## Integration Points

### IDE Integration
- **rust-analyzer**: Language server configuration
- **VS Code**: Workspace settings and extensions
- **IntelliJ**: Rust plugin configuration
- **Vim/Neovim**: Rust tooling integration

### External Tool Integration
- **GitHub**: Repository integration and webhooks
- **Codecov**: Coverage reporting integration
- **docs.rs**: Documentation hosting integration
- **crates.io**: Package publishing integration

### Development Workflow Integration
- **Git Hooks**: Pre-commit hooks for formatting and linting
- **Branch Protection**: Required status checks for merging
- **Automated Releases**: Version bumping and changelog generation
- **Dependency Updates**: Automated dependency update PRs