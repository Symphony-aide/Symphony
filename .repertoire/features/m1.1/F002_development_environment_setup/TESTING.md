# F002: Development Environment Setup - Testing

**Feature**: F002_development_environment_setup  
**Testing Complexity**: Low-Medium  
**Test Categories**: Infrastructure, Integration, Validation

---

## Testing Philosophy

F002 is **Infrastructure** because it provides the foundational development environment, tooling, and CI/CD pipeline that enables all Symphony backend development. The primary testing focus is ensuring the development infrastructure works correctly and provides reliable automation.

**Test Focus**: Does the development infrastructure work? Are quality gates effective? Does CI/CD pipeline execute reliably?  
**Don't Test**: Internal implementation details of development tools (clippy, rustfmt internals)

---

## Q1: Feature Type Analysis

**F002 is Infrastructure because:**
- Provides foundational development environment and tooling
- Establishes CI/CD pipeline for automated quality gates
- Enables consistent development practices across the team
- Forms the foundation for all Symphony backend development workflows

---

## Q2: What Should I Test?

| Test Category | Test This | DON'T Test This |
|---------------|-----------|-----------------|
| **Infrastructure Tests** | Tooling works correctly, CI/CD pipeline executes | Internal tool algorithms |
| **Contract Tests** | Quality gates enforce standards, builds are reproducible | Tool configuration syntax |
| **Behavior Tests** | Error handling in pipeline, notification systems | Tool-specific error messages |
| **Integration Tests** | Cross-platform compatibility, tool chain integration | Individual tool performance |

### Test Level Decisions:
- [x] **Infrastructure Tests** - Development tools and CI/CD pipeline functionality
- [x] **Contract Tests** - Quality gates and build reproducibility
- [x] **Behavior Tests** - Error handling and notification systems
- [x] **Integration Tests** - Cross-platform and multi-version compatibility

### Test Markers:
- `infrastructure`: Development environment and tooling tests
- `ci_cd`: CI/CD pipeline and automation tests
- `quality`: Code quality and standards enforcement tests
- `cross_platform`: Multi-platform compatibility tests

---

## Q3: Mock vs Real Dependencies

| Dependency | Use MOCK | Use REAL | Rationale |
|------------|----------|----------|-----------|
| **Rust Toolchain** | ❌ | ✅ | Testing the actual toolchain integration |
| **GitHub Actions** | ⚠️ | ✅ | Use real for integration, mock for unit tests |
| **File System** | ❌ | ✅ | Testing actual file operations and permissions |
| **Network (docs.rs, crates.io)** | ✅ | ❌ | External services, slow, non-deterministic |
| **Git Operations** | ❌ | ✅ | Testing actual git workflow integration |

---

## Q4: Test File Organization

```
tests/
├── infrastructure/              # Development infrastructure tests
│   ├── tooling_test.rs         # Clippy, rustfmt, tarpaulin functionality
│   ├── build_system_test.rs    # Cargo workspace and build tests
│   └── documentation_test.rs   # Rustdoc generation tests
├── ci_cd/                      # CI/CD pipeline tests
│   ├── pipeline_test.rs        # GitHub Actions workflow tests
│   ├── quality_gates_test.rs   # Quality enforcement tests
│   └── cross_platform_test.rs  # Multi-platform compatibility
├── integration/                # End-to-end workflow tests
│   ├── developer_workflow_test.rs # Complete development workflow
│   └── release_workflow_test.rs   # Release and deployment workflow
└── fixtures/                   # Test configuration files
    ├── sample_cargo.toml       # Test Cargo configurations
    ├── sample_clippy.toml      # Test clippy configurations
    └── sample_workflows/       # Test GitHub Actions workflows
```

### Files to Create:
* [x] `tests/infrastructure/tooling_test.rs` - Development tooling tests
* [x] `tests/ci_cd/pipeline_test.rs` - CI/CD pipeline tests
* [x] `tests/integration/developer_workflow_test.rs` - End-to-end workflow tests
* [x] `tests/fixtures/sample_configs/` - Test configuration files

---

## Acceptance Tests (ATDD Format)

### AT1: Crate Structure and Build System
```gherkin
Given a new Symphony crate needs to be created
When I follow the established crate structure pattern
Then the crate should compile successfully
And all development tools should work correctly
And the CI/CD pipeline should pass
```

### AT2: Code Quality Enforcement
```gherkin
Given code that violates quality standards
When the code is submitted via pull request
Then the CI/CD pipeline should fail
And specific violations should be reported
And the pull request should be blocked from merging
```

### AT3: Cross-Platform Compatibility
```gherkin
Given the development environment configuration
When the CI/CD pipeline runs on different platforms
Then all platforms should build successfully
And all tests should pass consistently
And no platform-specific issues should occur
```

### AT4: Documentation Generation
```gherkin
Given code with proper rustdoc comments
When the documentation build process runs
Then comprehensive documentation should be generated
And the documentation should be published automatically
And all examples should compile and run correctly
```

---

## Infrastructure Test Suites

### Suite 1: Development Tooling Validation
**Purpose**: Ensure all development tools work correctly and enforce standards

```bash
#!/bin/bash
# tests/infrastructure/tooling_validation.sh

set -e

echo "Testing Rust toolchain..."
rustc --version
cargo --version

echo "Testing clippy configuration..."
cargo clippy --version
cargo clippy --all-targets --all-features -- -D warnings

echo "Testing rustfmt configuration..."
rustfmt --version
cargo fmt --all -- --check

echo "Testing tarpaulin installation..."
cargo tarpaulin --version
cargo tarpaulin --config .tarpaulin.toml --workspace --dry-run

echo "Testing cargo-audit..."
cargo audit --version
cargo audit

echo "All development tools validated successfully!"
```

### Suite 2: Build System Validation
**Purpose**: Verify Cargo workspace and build configuration

```rust
// tests/infrastructure/build_system_test.rs
use std::process::Command;
use std::path::Path;

#[test]
fn test_workspace_structure() {
    // Verify workspace Cargo.toml exists and is valid
    assert!(Path::new("apps/backend/Cargo.toml").exists());
    
    // Verify workspace members are correctly configured
    let output = Command::new("cargo")
        .args(&["metadata", "--format-version", "1"])
        .current_dir("apps/backend")
        .output()
        .expect("Failed to run cargo metadata");
    
    assert!(output.status.success());
    
    let metadata: serde_json::Value = serde_json::from_slice(&output.stdout)
        .expect("Failed to parse cargo metadata");
    
    let workspace_members = metadata["workspace_members"].as_array()
        .expect("No workspace members found");
    
    assert!(!workspace_members.is_empty(), "Workspace should have members");
}

#[test]
fn test_crate_compilation() {
    // Test that all crates compile successfully
    let output = Command::new("cargo")
        .args(&["build", "--all-features"])
        .current_dir("apps/backend")
        .output()
        .expect("Failed to run cargo build");
    
    if !output.status.success() {
        panic!("Build failed: {}", String::from_utf8_lossy(&output.stderr));
    }
}

#[test]
fn test_dependency_resolution() {
    // Verify all dependencies resolve correctly
    let output = Command::new("cargo")
        .args(&["tree"])
        .current_dir("apps/backend")
        .output()
        .expect("Failed to run cargo tree");
    
    assert!(output.status.success(), "Dependency tree resolution failed");
}
```

### Suite 3: Quality Gates Validation
**Purpose**: Verify code quality enforcement mechanisms

```rust
// tests/infrastructure/quality_gates_test.rs
use std::process::Command;
use std::fs;
use tempfile::TempDir;

#[test]
fn test_clippy_enforcement() {
    // Create temporary file with clippy violations
    let temp_dir = TempDir::new().unwrap();
    let bad_code = r#"
        pub fn bad_function() {
            let x = 5;
            let y = x.clone(); // Unnecessary clone
            println!("{}", y);
        }
    "#;
    
    fs::write(temp_dir.path().join("bad.rs"), bad_code).unwrap();
    
    // Run clippy and expect it to fail
    let output = Command::new("cargo")
        .args(&["clippy", "--", "-D", "warnings"])
        .current_dir(temp_dir.path())
        .output()
        .expect("Failed to run clippy");
    
    // Should fail due to clippy violations
    assert!(!output.status.success(), "Clippy should catch violations");
}

#[test]
fn test_format_enforcement() {
    // Create temporary file with formatting issues
    let temp_dir = TempDir::new().unwrap();
    let unformatted_code = r#"
        pub fn unformatted_function(   ){
        let x=5;
        println!("{}",x);
        }
    "#;
    
    fs::write(temp_dir.path().join("unformatted.rs"), unformatted_code).unwrap();
    
    // Run format check and expect it to fail
    let output = Command::new("cargo")
        .args(&["fmt", "--", "--check"])
        .current_dir(temp_dir.path())
        .output()
        .expect("Failed to run rustfmt");
    
    // Should fail due to formatting issues
    assert!(!output.status.success(), "Format check should catch violations");
}
```

---

## CI/CD Pipeline Test Suites

### Suite 1: Pipeline Execution Validation
**Purpose**: Verify GitHub Actions pipeline executes correctly

```yaml
# tests/fixtures/test_workflow.yml
name: Test Workflow

on:
  workflow_dispatch:

jobs:
  test-pipeline:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          components: rustfmt, clippy
      - name: Test format check
        run: cargo fmt --all -- --check
      - name: Test clippy
        run: cargo clippy --all-targets --all-features -- -D warnings
      - name: Test build
        run: cargo build --all-features
      - name: Test run
        run: cargo test --all-features
```

### Suite 2: Cross-Platform Compatibility
**Purpose**: Verify development environment works across platforms

```rust
// tests/ci_cd/cross_platform_test.rs
use std::process::Command;

#[cfg(target_os = "linux")]
#[test]
fn test_linux_compatibility() {
    verify_platform_compatibility("linux");
}

#[cfg(target_os = "windows")]
#[test]
fn test_windows_compatibility() {
    verify_platform_compatibility("windows");
}

#[cfg(target_os = "macos")]
#[test]
fn test_macos_compatibility() {
    verify_platform_compatibility("macos");
}

fn verify_platform_compatibility(platform: &str) {
    println!("Testing platform compatibility for: {}", platform);
    
    // Test basic Rust toolchain
    let output = Command::new("rustc")
        .args(&["--version"])
        .output()
        .expect("Failed to run rustc");
    assert!(output.status.success());
    
    // Test cargo functionality
    let output = Command::new("cargo")
        .args(&["--version"])
        .output()
        .expect("Failed to run cargo");
    assert!(output.status.success());
    
    // Test build process
    let output = Command::new("cargo")
        .args(&["check"])
        .current_dir("apps/backend")
        .output()
        .expect("Failed to run cargo check");
    assert!(output.status.success());
}
```

---

## Integration Test Scenarios

### Scenario 1: Complete Developer Workflow
**Purpose**: Test the entire development workflow from setup to deployment

```rust
// tests/integration/developer_workflow_test.rs
use std::process::Command;
use std::fs;
use tempfile::TempDir;

#[test]
fn test_complete_developer_workflow() {
    let temp_dir = TempDir::new().unwrap();
    
    // Step 1: Clone and setup (simulated)
    setup_test_environment(&temp_dir);
    
    // Step 2: Make code changes
    let new_code = r#"
        /// A test function for the workflow
        pub fn test_function() -> i32 {
            42
        }
        
        #[cfg(test)]
        mod tests {
            use super::*;
            
            #[test]
            fn test_function_works() {
                assert_eq!(test_function(), 42);
            }
        }
    "#;
    
    fs::write(temp_dir.path().join("src/lib.rs"), new_code).unwrap();
    
    // Step 3: Run local development commands
    run_development_commands(&temp_dir);
    
    // Step 4: Verify CI/CD would pass
    verify_ci_cd_compatibility(&temp_dir);
}

fn setup_test_environment(temp_dir: &TempDir) {
    // Create basic Cargo.toml
    let cargo_toml = r#"
        [package]
        name = "test-crate"
        version = "0.1.0"
        edition = "2021"
        
        [dependencies]
    "#;
    
    fs::write(temp_dir.path().join("Cargo.toml"), cargo_toml).unwrap();
    fs::create_dir_all(temp_dir.path().join("src")).unwrap();
}

fn run_development_commands(temp_dir: &TempDir) {
    // Test format
    let output = Command::new("cargo")
        .args(&["fmt"])
        .current_dir(temp_dir.path())
        .output()
        .expect("Failed to run cargo fmt");
    assert!(output.status.success());
    
    // Test clippy
    let output = Command::new("cargo")
        .args(&["clippy"])
        .current_dir(temp_dir.path())
        .output()
        .expect("Failed to run cargo clippy");
    assert!(output.status.success());
    
    // Test build
    let output = Command::new("cargo")
        .args(&["build"])
        .current_dir(temp_dir.path())
        .output()
        .expect("Failed to run cargo build");
    assert!(output.status.success());
    
    // Test run
    let output = Command::new("cargo")
        .args(&["test"])
        .current_dir(temp_dir.path())
        .output()
        .expect("Failed to run cargo test");
    assert!(output.status.success());
}

fn verify_ci_cd_compatibility(temp_dir: &TempDir) {
    // Verify format check passes
    let output = Command::new("cargo")
        .args(&["fmt", "--", "--check"])
        .current_dir(temp_dir.path())
        .output()
        .expect("Failed to run format check");
    assert!(output.status.success(), "Format check should pass");
    
    // Verify clippy passes with warnings as errors
    let output = Command::new("cargo")
        .args(&["clippy", "--", "-D", "warnings"])
        .current_dir(temp_dir.path())
        .output()
        .expect("Failed to run clippy check");
    assert!(output.status.success(), "Clippy check should pass");
}
```

### Scenario 2: Documentation Generation Workflow
**Purpose**: Test complete documentation generation and publishing

```rust
// tests/integration/documentation_workflow_test.rs
use std::process::Command;
use std::path::Path;

#[test]
fn test_documentation_generation() {
    // Generate documentation
    let output = Command::new("cargo")
        .args(&["doc", "--all-features", "--no-deps"])
        .current_dir("apps/backend")
        .output()
        .expect("Failed to generate documentation");
    
    assert!(output.status.success(), "Documentation generation should succeed");
    
    // Verify documentation files exist
    assert!(Path::new("apps/backend/target/doc").exists());
    
    // Verify main crate documentation exists
    assert!(Path::new("apps/backend/target/doc/symphony_core_ports").exists());
    
    // Verify index.html exists
    assert!(Path::new("apps/backend/target/doc/symphony_core_ports/index.html").exists());
}

#[test]
fn test_documentation_examples() {
    // Test that all documentation examples compile
    let output = Command::new("cargo")
        .args(&["test", "--doc"])
        .current_dir("apps/backend")
        .output()
        .expect("Failed to test documentation examples");
    
    assert!(output.status.success(), "Documentation examples should compile and run");
}
```

---

## Performance Test Considerations

### Build Performance Targets
- **Initial Build**: <30 seconds for clean build
- **Incremental Build**: <5 seconds for small changes
- **CI/CD Pipeline**: <5 minutes total execution time
- **Documentation Generation**: <2 minutes

### Quality Gate Performance
- **Clippy Analysis**: <10 seconds
- **Format Check**: <2 seconds
- **Security Audit**: <30 seconds
- **Test Execution**: <10 seconds

### Developer Experience Metrics
- **Setup Time**: <5 minutes for new developer
- **Feedback Loop**: <30 seconds for local development
- **CI/CD Feedback**: <5 minutes for pull request
- **Documentation Update**: <2 minutes after code change

---

## Test Execution Plan

### Pre-Implementation Testing
- [ ] Verify Rust toolchain installation and configuration
- [ ] Test development tool availability and versions
- [ ] Validate GitHub Actions runner compatibility

### During Implementation Testing
- [ ] Test each configuration file as it's created
- [ ] Verify tooling integration at each step
- [ ] Test CI/CD pipeline incrementally

### Post-Implementation Testing
- [ ] Full end-to-end workflow testing
- [ ] Cross-platform compatibility validation
- [ ] Performance benchmark establishment
- [ ] Documentation generation verification

### Continuous Validation
- [ ] Daily CI/CD pipeline health checks
- [ ] Weekly dependency update testing
- [ ] Monthly cross-platform compatibility verification
- [ ] Quarterly tooling version update testing