> Purpose: Define consistent technical patterns for AI-driven implementation across Symphony's development lifecycle
Scope: All feature implementations from F001 onwards
Updated: December 25, 2025
> 

---

## MANDATORY READING REQUIREMENTS

**BEFORE IMPLEMENTING ANY FEATURE, YOU MUST:**

1. ✅ Read this file completely
2. ✅ Read ALL referenced files in this document
3. ✅ Follow ALL patterns defined here
4. ✅ Never duplicate patterns - always refer to commons crate

**FAILURE TO FOLLOW THESE PATTERNS WILL RESULT IN IMPLEMENTATION REJECTION**

---

## Code Quality Standards

### Dependency Management

**RULE**: ALWAYS use workspace dependencies for sy-* packages to ensure consistency and avoid version conflicts.

**MANDATORY PACKAGE DEPENDENCY PATTERN**:
```toml
# In individual sy-* package Cargo.toml - ALWAYS use workspace versions
[dependencies]
# ✅ CORRECT - Use workspace dependencies
serde.workspace = true
tokio.workspace = true
thiserror.workspace = true

# ❌ WRONG - Direct version specification
serde = "1.0"
tokio = "1.35"
thiserror = "2.0.17"

[dev-dependencies]
# ✅ CORRECT - Use workspace dependencies for tests too
criterion.workspace = true
rstest.workspace = true
tokio-test.workspace = true
proptest.workspace = true
```

**MANDATORY PACKAGE METADATA PATTERN**:
```toml
[package]
name = "sy-example"
version.workspace = true          # ✅ Use workspace version
edition.workspace = true          # ✅ Use workspace edition
license.workspace = true          # ✅ Use workspace license
repository.workspace = true       # ✅ Use workspace repository
description = "Package-specific description"
keywords = ["symphony", "specific", "keywords"]
categories = ["development-tools"]

[lints]
workspace = true                  # ✅ Use workspace lints
```

### Rust Implementation Patterns

**MANDATORY**: All Rust code must follow patterns in:
- READ THE FILE {CWD/best_practice.md}
- Follow memory management patterns
- Use proper error handling
- Apply async/concurrency best practices

---

### Error Handling and Debugging

**MANDATORY**: READ THE FILE {CWD/error_handling.md}

**CRITICAL RULES**:
1. ✅ **ALWAYS** use commons crate for error handling
2. ✅ **ALWAYS** use duck!() macro for temporary debugging
3. ✅ **NEVER** use println!, eprintln!, or log::debug! directly
4. ✅ **ALWAYS** add context to errors using .context() or .with_context()
5. ✅ **NEVER** duplicate error handling patterns

**EXAMPLE**:
```rust
// ✅ CORRECT
use commons::error::AppError;
use commons::debug::duck;

fn process_file(path: &str) -> Result<String, AppError> {
    duck!("Processing file: {}", path);
    
    let content = std::fs::read_to_string(path)
        .context("Failed to read configuration file")?;
    
    Ok(content)
}

// ❌ WRONG
fn process_file(path: &str) -> Result<String, std::io::Error> {
    println!("Processing file: {}", path);  // Use duck!() instead
    std::fs::read_to_string(path)           // No context added
}
```

---

### Documentation Style

**MANDATORY**: READ THE FILE {CWD/rust_doc_style_guide.md} and {CWD/rust_doc_before_after.rs}

**CRITICAL RULES**:
1. ✅ **ALL** public items must have /// documentation
2. ✅ **ALL** documentation must include examples
3. ✅ **ALL** functions that can panic must document # Panics
4. ✅ **ALL** functions that return Result must document # Errors
5. ✅ **NEVER** use // comments for public API documentation

---

### Testing Standards

**MANDATORY**: READ THE FILE {CWD/tests_handling.md}

**CRITICAL TESTING RULES**:
1. ✅ **ALWAYS** use TDD approach (Red → Green → Refactor)
2. ✅ **ALWAYS** use `cargo nextest run` (MANDATORY PREFERRED) over `cargo test`
3. ✅ **ALWAYS** escape quotes in feature flags: `\--features "unit,integration"`
4. ✅ **ALWAYS** fix ALL warnings in tests - zero tolerance
5. ✅ **NEVER** skip writing tests before implementation

**JSON Snapshot Testing with insta**:
✅ **Use insta when**: Structured outputs (JSON, YAML, ASTs), stable APIs, config outputs
❌ **Do NOT use insta when**: Dynamic values, core business logic, simple outputs

**BDD Tests (cucumber-rs)**:
- Usually NOT needed - unit and integration tests cover most cases
- Only use when business-level behavior must be validated by non-developers
- If no strong reason exists → do not add BDD tests

**CRITICAL RULES**:
1. ✅ **ALWAYS** follow TDD (Red-Green-Refactor)
2. ✅ **ALWAYS** write tests before implementation
3. ✅ **ALWAYS** use feature flags for test categories
4. ✅ **NEVER** ignore warnings in tests
5. ✅ **ALWAYS** fix ALL warnings before completion

**EXAMPLE**:
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[cfg(feature = "unit")]
    #[test]
    fn test_user_creation() {
        // Arrange
        let name = "Alice";
        let email = "alice@example.com";

        // Act
        let user = User::new(1, name, email);

        // Assert
        assert_eq!(user.name(), name);
        assert_eq!(user.email(), email);
    }
}
```

---

### Stub Implementation for Dependencies

**NEW MANDATORY RULE**: When implementing a feature that depends on unimplemented components:

1. ✅ **ALWAYS** create stubs with todo!() statements
2. ✅ **ALWAYS** document what the stub should do
3. ✅ **ALWAYS** reference the future task that will implement it

**EXAMPLE**:
```rust
/// Validates user credentials against the authentication service
/// 
/// # TODO
/// This is a stub implementation. Will be implemented in F025_auth_service
pub fn validate_credentials(username: &str, password: &str) -> Result<bool, AppError> {
    duck!("Stub: validating credentials for user: {}", username);
    todo!("Implement in F025_auth_service - validate against auth database")
}
```

---

### Commons Crate Extension

**MANDATORY RULE**: It is ALWAYS OK to extend the commons crate as long as you follow OCP (Open-Closed Principle):

1. ✅ **ALWAYS** add new functionality without breaking existing code
2. ✅ **ALWAYS** use extension traits for adding methods to existing types
3. ✅ **ALWAYS** document why the extension is needed
4. ✅ **NEVER** modify existing public APIs

**EXAMPLE**:
```rust
// In commons/src/extensions.rs
/// Extension trait for adding validation to String types
pub trait StringValidation {
    /// Validates that the string is a valid email address
    fn is_valid_email(&self) -> bool;
}

impl StringValidation for String {
    fn is_valid_email(&self) -> bool {
        self.contains('@') && self.contains('.')
    }
}
```

---

### Naming patterns

**MANDATORY RULES**:

- Symphony crates should have the prefix `sy`, but not the full name `symphony`
    - ✅ DO: `sy-ipc-protocol`
    - ❌ DONT: `symphony-ipc-protocol`

- APPError should be named SymphonyError
    - ✅ DO: `SymphonyError`
    - ❌ DONT: `AppError` (except in commons crate)

---

### Dependency Compatibility Issues

**BINCODE V2 BREAKING CHANGES**: 

Bincode v2 has breaking API changes from v1. **MANDATORY** patterns for bincode v2:

```rust
// ✅ CORRECT - Bincode v2 API
let config = bincode::config::standard();
let result = bincode::serde::encode_to_vec(message, config)?;
let (result, _len) = bincode::serde::decode_from_slice(data, config)?;

// ❌ WRONG - Bincode v1 API (no longer works)
let result = bincode::serialize(message)?;
let result = bincode::deserialize(data)?;
```

**MANDATORY Cargo.toml setup**:
```toml
bincode = { version = "2.0", features = ["serde"] }  # serde feature required
```

**KEY BREAKING CHANGES**:
1. ✅ Free functions `serialize()`/`deserialize()` removed → use `encode_to_vec()`/`decode_from_slice()`
2. ✅ Must use `Configuration` object (e.g., `bincode::config::standard()`)
3. ✅ Must enable `serde` feature for serde integration
4. ✅ `decode_from_slice()` returns tuple `(T, usize)` not just `T`

**REFERENCE**: See `.repertoire/practice/bincode-caret-breaking-compatability.md` for complete migration guide.

---

## WARNING HANDLING

**ZERO TOLERANCE POLICY**: 

1. ❌ **NO WARNINGS ALLOWED** - All warnings must be fixed
2. ❌ **NO EXCEPTIONS** - Even test warnings must be fixed
3. ❌ **NO IGNORING** - Don't use #[allow(warnings)] without justification
4. ✅ **FIX IMMEDIATELY** - Address warnings as soon as they appear

**COMMON WARNING FIXES**:
```rust
// ❌ Unused import warning
use std::collections::HashMap;  // Remove if not used

// ✅ Fix by removing or using
// use std::collections::HashMap;  // Removed

// ❌ Unused variable warning
let unused_var = 42;

// ✅ Fix with underscore prefix
let _unused_var = 42;  // Or remove entirely

// ❌ Dead code warning
fn unused_function() {}

// ✅ Fix by removing or using #[cfg(test)]
#[cfg(test)]
fn test_helper_function() {}
```

---

## QUALITY GATES - MANDATORY CHECKS

**BEFORE FEATURE COMPLETION - ALL MUST PASS**:
1. ✅ **Unit/Integration Tests**: `cargo nextest run` (MANDATORY PREFERRED) - ZERO warnings, ZERO failures
2. ✅ **Benchmarks**: `cargo bench` - Less than 15% outliers (if benchmark exists in crate)
3. ✅ **Documentation Tests**: `cargo test \--doc` - ZERO warnings, ZERO failures
4. ✅ **Code Quality**: `cargo clippy \--all-targets \--all-features` - ZERO warnings
5. ✅ **Documentation Generation**: `cargo doc \--no-deps` - Must pass and generate docs

**ON TEST FAILURES - RERUN STRATEGY**:
- ✅ **First**: Run failed tests only: `cargo nextest run \--failed`
- ✅ **If nextest unavailable**: Use `cargo test` with specific test names

**MANDATORY Quote Escaping**: Always escape quotes in commands:
- ✅ CORRECT: `cargo nextest run \--features "unit,integration"`
- ❌ WRONG: `cargo nextest run --features unit,integration`

**MANDATORY CARGO.TOML FEATURES - COPY EXACTLY**:
```toml
[features]
# Default runs only fast unit tests
default = []
# Individual test category features
unit = []
integration = []
e2e = [] # Based on Project and Business [e.g. HTML Generation] Type
... // And so

```

**MANDATORY DEBUGGING AND UTILITIES**:
- ✅ **ALWAYS** use `sy-commons` crate utilities (error handling, logging, config, filesystem, validation)
- ✅ **ALWAYS** use `duck!("message")` macro for debugging (even in suspicious error-prone locations)
- ✅ **NEVER** miss documentation warnings like:
  - `missing documentation for the crate` - Add `//!` crate-level docs
  - `missing documentation for a struct field` - Add `/// Field description` above each field
  - `missing documentation for a function` - Add `/// Function description` above functions