# F002: Development Environment Setup - Planning

**Feature**: F002_development_environment_setup  
**Estimated Effort**: 2 days  
**Complexity**: Low-Medium  
**Risk Level**: Low (well-established tooling)

---

## High-Level Implementation Strategy

This feature establishes the development foundation for Symphony's Rust backend by creating a standardized, automated development environment. The approach focuses on Rust ecosystem best practices, automated quality gates, and developer productivity tools that will scale across all Symphony backend crates.

**Approach**: Start with basic crate structure and tooling, then layer on CI/CD automation and documentation generation. Prioritize developer experience and code quality from the beginning.

## Technical Decisions

### Decision 1: Cargo Workspace Structure
**Chosen**: Single workspace with `symphony-core-ports` as first crate in `apps/backend/crates/`  
**Alternatives Considered**:
- Separate repository for each crate
- Flat crate structure in backend root
- Nested workspace structure

**Rationale**: Workspace approach enables shared dependencies, consistent tooling, and easier cross-crate development while maintaining clear boundaries between crates.

### Decision 2: Linting Configuration
**Chosen**: Clippy with pedantic and nursery lints enabled, custom allow list for acceptable patterns  
**Alternatives Considered**:
- Default clippy lints only
- Custom lint rules via clippy.toml
- Third-party linting tools

**Rationale**: Pedantic lints catch more potential issues and enforce consistent code style. Allow list provides escape hatch for legitimate patterns that trigger false positives.

### Decision 3: CI/CD Platform
**Chosen**: GitHub Actions with matrix builds for multiple Rust versions  
**Alternatives Considered**:
- GitLab CI/CD
- Jenkins
- Azure DevOps
- CircleCI

**Rationale**: GitHub Actions integrates seamlessly with GitHub repository, has excellent Rust ecosystem support, and provides free minutes for open source projects.

### Decision 4: Documentation Hosting
**Chosen**: GitHub Pages with automated deployment from docs.rs integration  
**Alternatives Considered**:
- Self-hosted documentation site
- Netlify/Vercel hosting
- docs.rs only

**Rationale**: GitHub Pages provides free hosting with automatic deployment, while docs.rs ensures documentation is available in the standard Rust ecosystem location.

## Dependencies Analysis

| Dependency | Purpose | Alternative 1 | Alternative 2 | Alternative 3 | Cross-Platform | Local Env | Cloud Env | Consistency & Stability | Maintained | Ecosystem | Limitation 1 | Limitation 2 | Limitation 3 | Decision | Rationale |
|------------|---------|---------------|---------------|---------------|----------------|-----------|-----------|------------------------|------------|-----------|--------------|--------------|--------------|----------|-----------|
| clippy 1.70+ | Rust linting | rust-analyzer | manual review | custom lints | ✅ All platforms | ✅ Works | ✅ Works | ✅ Very stable | ✅ Active (2024-12) | High | Can be overly strict | Some false positives | N/A | ✅ Selected | Standard Rust linting tool |
| rustfmt 1.70+ | Code formatting | prettier-rust | manual formatting | custom formatter | ✅ All platforms | ✅ Works | ✅ Works | ✅ Very stable | ✅ Active (2024-12) | High | Limited configuration | Opinionated formatting | N/A | ✅ Selected | Standard Rust formatter |
| tarpaulin 0.27+ | Code coverage | grcov | llvm-cov | manual testing | ⚠️ Linux/macOS only | ✅ Works | ✅ Works | ✅ Stable | ✅ Active (2024-11) | High | Windows not supported | Slower than alternatives | Can miss some coverage | ✅ Selected | Most mature Rust coverage tool |
| cargo-audit 0.18+ | Security scanning | cargo-deny | manual review | dependabot | ✅ All platforms | ✅ Works | ✅ Works | ✅ Stable | ✅ Active (2024-10) | High | Only checks known CVEs | Can have false positives | N/A | ✅ Selected | Standard security audit tool |
| actions/checkout@v4 | GitHub Actions checkout | actions/checkout@v3 | manual git clone | custom action | ✅ All platforms | N/A | ✅ Works | ✅ Very stable | ✅ Active (2024-12) | High | GitHub Actions only | N/A | N/A | ✅ Selected | Standard GitHub Actions |
| actions-rs/toolchain@v1 | Rust toolchain setup | dtolnay/rust-toolchain | manual setup | custom action | ✅ All platforms | N/A | ✅ Works | ✅ Stable | ⚠️ Maintenance mode | High | No longer actively developed | N/A | N/A | ✅ Selected | Still works, widely used |

**Notes**:
- ✅ = Works correctly / Yes
- ❌ = Does not work / No / Critical issue  
- ⚠️ = Partial support / Works with caveats
- N/A = Not applicable

## Component Breakdown

### Component 1: Crate Structure Setup (`apps/backend/crates/symphony-core-ports/`)
**Responsibility**: Create proper Rust crate structure with Cargo.toml and basic module layout
**Public API**:
```toml
[package]
name = "symphony-core-ports"
version = "0.1.0"
edition = "2021"

[dependencies]
async-trait = "0.1.74"
tokio = { version = "1.35.0", features = ["full"] }
thiserror = "1.0.50"
uuid = { version = "1.6.1", features = ["v4", "serde"] }
serde = { version = "1.0.193", features = ["derive"] }
```
**Dependencies**: None (foundational)
**Estimated Effort**: 0.5 days

### Component 2: Development Tooling Configuration
**Responsibility**: Configure clippy, rustfmt, and tarpaulin with appropriate settings
**Configuration Files**:
```toml
# .clippy.toml
pedantic = true
nursery = true
allow = ["module_name_repetitions", "similar_names"]

# rustfmt.toml  
edition = "2021"
max_width = 120
tab_spaces = 4
```
**Dependencies**: Rust toolchain
**Estimated Effort**: 0.5 days

### Component 3: GitHub Actions CI/CD Pipeline (`.github/workflows/rust.yml`)
**Responsibility**: Automated testing, linting, formatting, and coverage reporting
**Pipeline Stages**:
1. Checkout code and setup Rust toolchain
2. Run cargo fmt --check
3. Run cargo clippy --all-targets --all-features
4. Run cargo test --all-features
5. Generate coverage report with tarpaulin
6. Build documentation with cargo doc
**Dependencies**: GitHub repository, Rust toolchain
**Estimated Effort**: 0.75 days

### Component 4: Documentation Generation Setup
**Responsibility**: Automated rustdoc generation and publishing
**Configuration**:
```toml
[package.metadata.docs.rs]
all-features = true
rustdoc-args = ["--cfg", "docsrs"]
```
**Dependencies**: docs.rs integration, GitHub Pages
**Estimated Effort**: 0.25 days

## Implementation Phases

### Phase 1: Basic Crate Setup (Day 1 Morning)
- [ ] Create `apps/backend/crates/symphony-core-ports/` directory structure
- [ ] Write Cargo.toml with proper metadata and dependencies
- [ ] Create src/lib.rs with basic module structure
- [ ] Add README.md with crate description
- [ ] Verify initial compilation with `cargo build`

### Phase 2: Development Tooling (Day 1 Afternoon)
- [ ] Configure clippy.toml with pedantic and nursery lints
- [ ] Configure rustfmt.toml with project formatting standards
- [ ] Add cargo-audit for security scanning
- [ ] Add tarpaulin for code coverage
- [ ] Test all tooling commands locally

### Phase 3: CI/CD Pipeline (Day 2 Morning)
- [ ] Create .github/workflows/rust.yml
- [ ] Configure matrix builds for multiple Rust versions
- [ ] Add automated testing, linting, and formatting checks
- [ ] Add coverage reporting with tarpaulin
- [ ] Test pipeline with dummy commit

### Phase 4: Documentation and Guidelines (Day 2 Afternoon)
- [ ] Configure rustdoc generation with all features
- [ ] Set up GitHub Pages deployment for documentation
- [ ] Create DEVELOPMENT.md with comprehensive guidelines
- [ ] Add CONTRIBUTING.md with workflow instructions
- [ ] Validate all documentation builds correctly

## Code Structure

```
apps/backend/crates/symphony-core-ports/
├── Cargo.toml                 # Crate configuration and dependencies
├── README.md                  # Crate description and usage
├── src/
│   ├── lib.rs                # Public API exports and module declarations
│   ├── ports.rs              # Port trait definitions (from F001)
│   ├── types.rs              # Domain types (from F001)
│   ├── errors.rs             # Error types (from F001)
│   └── mocks.rs              # Mock implementations (from F001)
├── tests/                     # Integration tests
├── examples/                  # Usage examples
└── docs/                      # Additional documentation

.github/workflows/
├── rust.yml                   # Main CI/CD pipeline
└── docs.yml                   # Documentation deployment

Configuration Files:
├── .clippy.toml              # Clippy linting configuration
├── rustfmt.toml              # Code formatting configuration
├── DEVELOPMENT.md            # Development guidelines
└── CONTRIBUTING.md           # Contribution workflow
```

## Testing Strategy

### Development Environment Tests
- **Tooling Verification**: All development tools (clippy, rustfmt, tarpaulin) execute without errors
- **Build System Tests**: Cargo build, test, and doc commands work correctly
- **CI/CD Validation**: GitHub Actions pipeline completes successfully

### Quality Gates
- **Linting**: Zero clippy warnings with pedantic lints
- **Formatting**: Code passes rustfmt --check
- **Security**: No known vulnerabilities in cargo audit
- **Documentation**: All public APIs documented

### Integration Tests
- **Cross-Platform**: CI/CD runs on Linux, macOS, and Windows
- **Multiple Rust Versions**: Test against stable, beta, and nightly
- **Dependency Updates**: Automated testing of dependency updates

## Documentation Requirements

- [ ] **README.md**: Crate overview, installation, and basic usage
- [ ] **DEVELOPMENT.md**: Comprehensive development setup and workflow
- [ ] **CONTRIBUTING.md**: Contribution guidelines and pull request process
- [ ] **Rustdoc**: All public APIs documented with examples
- [ ] **CI/CD Documentation**: Pipeline configuration and troubleshooting

## Performance Considerations

### Build Performance
- **Incremental Compilation**: Enabled by default in development
- **Dependency Caching**: CI/CD caches dependencies between runs
- **Parallel Builds**: Utilize all available CPU cores

### CI/CD Performance
- **Matrix Strategy**: Parallel builds for different configurations
- **Artifact Caching**: Cache build artifacts and dependencies
- **Conditional Execution**: Skip unnecessary steps based on changes

### Developer Experience
- **Fast Feedback**: Local tooling provides immediate feedback
- **IDE Integration**: Configuration works with rust-analyzer and IDEs
- **Documentation Access**: Easy access to generated documentation

## Risk Mitigation

### Risk: CI/CD Pipeline Failures
**Mitigation**: Comprehensive local testing before CI/CD setup, gradual pipeline complexity increase

### Risk: Tooling Configuration Conflicts
**Mitigation**: Use standard configurations, test with multiple developers, document any custom settings

### Risk: Documentation Generation Issues
**Mitigation**: Test documentation generation locally, use standard rustdoc features, validate links and examples

### Risk: Cross-Platform Compatibility
**Mitigation**: Test on multiple platforms, use GitHub Actions matrix builds, avoid platform-specific dependencies