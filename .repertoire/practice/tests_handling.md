### Testing Pattern - MANDATORY TDD APPROACH

**CRITICAL**: ALL implementations MUST follow Test-Driven Development (TDD):

- **CRITICAL** (default, fast):  
`cargo nextest run` (MANDATORY PREFERRED) or `cargo test` (fallback only) for test runnings

**MANDATORY Quote Escaping**: Always escape quotes in feature flags:
- ✅ CORRECT: `cargo nextest run \--features "unit,integration"`
- ❌ WRONG: `cargo nextest run --features unit,integration`

AND YOU HAVE TO RUN doc-tests too!

1. **RED PHASE**: Write failing tests first
2. **GREEN PHASE**: Write minimal code to make tests pass  
3. **REFACTOR PHASE**: Improve code quality while keeping tests green

**ZERO TOLERANCE**: Skipping TDD or writing implementation before tests is NOT ALLOWED.

---

### RECOMMENDED TESTING TOOLS

**MANDATORY TOOLS FOR RUST TESTING**:

1. **rstest** - For fixtures and parameterization

2. **tokio::test** - For async runtime support

3. **cargo nextest** - Enhanced test runner (MANDATORY PREFERRED with fallback)
   - Faster test execution with better output formatting
   - Improved test discovery and parallel execution
   - Fallback to `cargo test` if nextest is not available
   - **Quote Escaping**: Always use `\--features "unit,integration"` not `--features unit,integration`

4. **insta** - JSON snapshot testing (use judiciously)
   - For structured outputs: JSON, YAML, maps, trees, ASTs
   - For large/deeply nested data hard to test field-by-field
   - For stable APIs and config outputs
   - **Do NOT use for**: dynamic values, core business logic, simple outputs

5. **cucumber-rs** - BDD testing (rarely needed)
   - Usually NOT needed - unit and integration tests cover most cases
   - Only use when business-level behavior must be validated by non-developers
   - If no strong reason exists → do not add BDD tests

**EXAMPLE USAGE**:
```rust
use rstest::*;
use tokio_test;

// Fixture-based testing with rstest
#[fixture]
fn sample_user() -> User {
    User::new("test_user", "test@example.com")
}

// Parameterized testing
#[rstest]
#[case("valid@email.com", true)]
#[case("invalid-email", false)]
#[case("", false)]
fn test_email_validation(#[case] email: &str, #[case] expected: bool) {
    assert_eq!(validate_email(email), expected);
}

// Async testing with tokio::test
#[tokio::test]
async fn test_async_operation() {
    let result = async_function().await;
    assert!(result.is_ok());
}

```

**CARGO.TOML DEPENDENCIES**:
```toml
[dev-dependencies]
rstest = "*"
tokio-test = "*"
```

**TEST EXECUTION COMMANDS**:
```bash
# Preferred: Use cargo nextest (MANDATORY PREFERRED - faster, better output)
cargo nextest run

# Fallback: Use standard cargo test if nextest unavailable (FALLBACK ONLY)
cargo test

# With feature flags (MANDATORY quote escaping):
cargo nextest run \--features "unit,integration"
cargo test \--features "unit,integration"  # fallback only
```

---

### Test Organization with Feature Flags

**MANDATORY**: All tests must be organized with feature flags for selective execution:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    // Unit tests - test individual components (fast, isolated)
    // MANDATORY: These must be written FIRST (RED phase)
    #[cfg(feature = "unit")]
    #[test]
    fn test_component_behavior() {
        // Arrange
        let input = setup_test_data();

        // Act
        let result = component.process(input);

        // Assert
        assert_eq!(result, expected_output);
    }

    // Property tests - test invariants across many inputs
    // MANDATORY: Write these for any function with mathematical properties
    #[cfg(feature = "unit")] // or a separate feature if desired
    mod property_tests {
        use proptest::prelude::*;
        use super::*;

        proptest! {
            #[test]
            fn property_holds_for_all_inputs(input in any::<InputType>()) {
                let result = function_under_test(input);
                prop_assert!(invariant_check(result));
            }
        }
    }

    // Integration tests (slower, full stack)
    #[cfg(feature = "integration")]
    mod integration_tests {
        use super::*;

        #[test]
        fn test_full_stack_integration() {
            // Full system integration test
        }
    }

    // End-to-end tests (browser-based, requires running app)
    #[cfg(feature = "e2e")]
    mod e2e_tests {
        use super::*;

        #[test]
        fn test_end_to_end_flow() {
            // E2E test logic
        }
    }

    // Slow tests
    #[cfg(feature = "slow")]
    mod slow_tests {
        use super::*;

        #[test]
        fn test_something_expensive() {
            // Slow test
        }
    }

    // Authentication tests
    #[cfg(feature = "auth")]
    mod auth_tests {
        use super::*;

        #[test]
        fn test_login_success() {
            // Auth-related test
        }
    }

    // Add similar modules for other categories:
    // users, services, repositories, redis, ci_cd_issue, etc.
}
```

### MANDATORY Cargo.toml Configuration

```toml
[features]
# Default runs only fast unit tests
default = []

# Individual test category features
unit = []
integration = []
e2e = [] # Based on Project and Business [e.g. HTML Generation] Type
slow = []
auth = [] # Based on Project and Business [e.g. Backend Service] Type
users = [] # Based on Project and Business [e.g. Backend Service] Type
services = [] # Based on Project and Business [e.g. Backend Service] Type
repositories = [] # Based on Project and Business [e.g. Backend Service] Type
redis = []
ci_cd_issue = [] # Do not include until explicitly mentioned by the user

[dev-dependencies]
# MANDATORY testing tools
rstest = "0.18"           # Fixtures and parameterization
tokio-test = "0.4"        # Async runtime support
proptest = "1.4"          # Property-based testing
```

### Running specific categories

- **Run only unit tests** (default, fast):  
  `cargo nextest run` (MANDATORY PREFERRED) or `cargo test` (fallback only)

- **Run multiple categories** (e.g., unit + auth + redis) 
  `cargo nextest run \--features "unit auth test_redis"` or `cargo test \--features "unit auth test_redis"` (fallback only)

- **Run all tests** (including slow/e2e/etc.):  
  `cargo nextest run \--all-features` or `cargo test \--all-features` (fallback only)

---

### TDD Workflow - STEP BY STEP

**PHASE 1: RED (Write Failing Tests)**

1. ✅ Read feature requirements completely
2. ✅ Write acceptance tests that FAIL (no implementation exists)
3. ✅ Write unit tests for each function that FAIL
4. ✅ Write property tests for mathematical functions that FAIL
5. ✅ Verify tests fail for the RIGHT REASONS (not compilation errors)
6. ✅ Commit failing tests

**PHASE 2: GREEN (Make Tests Pass)**

1. ✅ Write MINIMAL implementation to make tests pass
2. ✅ Create stubs with todo!() for unimplemented dependencies
3. ✅ Use duck!() macro for temporary debugging
4. ✅ Run tests frequently - aim for all green
5. ✅ Don't worry about code quality yet - just make it work
6. ✅ Commit working implementation

**PHASE 3: REFACTOR (Improve Quality)**

1. ✅ Fix ALL warnings (including test warnings)
2. ✅ Improve code structure and readability
3. ✅ Add proper documentation with examples
4. ✅ Extract common patterns to commons crate
5. ✅ Run tests after each refactor - keep them green
6. ✅ Commit clean, refactored code

---

## Test Types Overview

| Test Type | Name | Needed (%) | Why this value | Covered somewhere else |
|-----------|------|------------|----------------|------------------------|
| Unit Tests | `#[test]` | 80% | Core logic, fast, reliable, easy to maintain | |
| Integration Tests | `tests/` | 60% | Ensure components work together | Unit tests |
| Snapshot Tests | `insta` | 30% | Large structured outputs, stable APIs | Integration tests |
| BDD Tests | `cucumber-rs` | 5% | Business-level behavior only | Unit / Integration |
| Property Tests | `proptest` | 10% | Edge cases, invariants | Unit tests |

**Notes**: Percentages are guidelines, not strict rules. Avoid duplication if test type is already satisfied elsewhere.

### JSON Snapshot Testing Guidelines

✅ **Use insta when**:
- Structured outputs: JSON, YAML, maps, trees, ASTs
- Large/deeply nested data hard to test field-by-field
- Stable APIs: Public or semi-public API responses
- Config outputs: Configuration files, logs, GraphQL responses

❌ **Do NOT use insta when**:
- Dynamic values: timestamps, UUIDs, random IDs
- Core business logic: money calculations, permissions, rules
- Simple outputs: `assert_eq!(result, 42)` is sufficient
- Highly volatile data: Frequently changing structures

### BDD Testing Guidelines

BDD tests are usually NOT needed because unit and integration tests already cover most cases.

Only use BDD if there is a strong reason, such as:
- Business-level behavior must be validated
- Features are defined by non-developers
- Cross-system flows need human-readable scenarios

If no strong reason exists → do not add BDD tests.

---

### WARNING HANDLING IN TESTS

**ZERO TOLERANCE**: Test warnings are NOT ALLOWED.

**QUALITY GATES - DETAILED COMMANDS**:
- ✅ **Unit/Integration Tests**: `cargo nextest run` (MANDATORY PREFERRED) - Must show "0 failed" and no warnings in output
- ✅ **Documentation Tests**: `cargo test \--doc` - Must show "0 failed" and no "warning:" lines
- ✅ **Benchmarks**: `cargo bench` - If benchmarks exist, outliers must be <15% (e.g., "Found 6 outliers among 100 measurements (6.00%)" is OK, >15% is NOT)
- ✅ **On Test Failure**: First run `cargo nextest run \--failed` to rerun only failed tests, then fix and rerun all

**MANDATORY Quote Escaping Examples**:
- ✅ CORRECT: `cargo nextest run \--manifest-path apps/backend/crates/sy-ipc-protocol/Cargo.toml \--features "unit,jsonrpc"`
- ❌ WRONG: `cargo nextest run --manifest-path apps/backend/crates/sy-ipc-protocol/Cargo.toml --features unit,jsonrpc`
