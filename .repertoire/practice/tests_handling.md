### Testing Pattern - MANDATORY TDD APPROACH

**CRITICAL**: ALL implementations MUST follow Test-Driven Development (TDD):

1. **RED PHASE**: Write failing tests first
2. **GREEN PHASE**: Write minimal code to make tests pass  
3. **REFACTOR PHASE**: Improve code quality while keeping tests green

**ZERO TOLERANCE**: Skipping TDD or writing implementation before tests is NOT ALLOWED.

---

### RECOMMENDED TESTING TOOLS

**MANDATORY TOOLS FOR RUST TESTING**:

1. **rstest** - For fixtures and parameterization

2. **tokio::test** - For async runtime support

3. **cargo nextest** - Enhanced test runner (with fallback)
   - Faster test execution with better output formatting
   - Improved test discovery and parallel execution
   - Fallback to `cargo test` if nextest is not available

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
# Preferred: Use cargo nextest (faster, better output)
cargo nextest run

# Fallback: Use standard cargo test if nextest unavailable
cargo test
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
    #[cfg(feature = "test_unit")]
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
    #[cfg(feature = "test_unit")] // or a separate feature if desired
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
    #[cfg(feature = "test_integration")]
    mod integration_tests {
        use super::*;

        #[test]
        fn test_full_stack_integration() {
            // Full system integration test
        }
    }

    // End-to-end tests (browser-based, requires running app)
    #[cfg(feature = "test_e2e")]
    mod e2e_tests {
        use super::*;

        #[test]
        fn test_end_to_end_flow() {
            // E2E test logic
        }
    }

    // Slow tests
    #[cfg(feature = "test_slow")]
    mod slow_tests {
        use super::*;

        #[test]
        fn test_something_expensive() {
            // Slow test
        }
    }

    // Authentication tests
    #[cfg(feature = "test_auth")]
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
  `cargo nextest run` or `cargo test` (fallback)

- **Run multiple categories** (e.g., unit + auth + redis) 
  `cargo nextest run --features "test_unit test_auth test_redis"` or `cargo test --features "test_unit test_auth test_redis"` (fallback)

- **Run all tests** (including slow/e2e/etc.):  
  `cargo nextest run --all-features` or `cargo test --all-features` (fallback)

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

### WARNING HANDLING IN TESTS

**ZERO TOLERANCE**: Test warnings are NOT ALLOWED.
