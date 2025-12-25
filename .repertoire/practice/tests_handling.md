### Testing Pattern

```rust
#[cfg(test)]
mod tests {
    use super::*;

    // Unit tests - test individual components (fast, isolated)
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

### How to use these markers with `cargo test`

Add the features to your `Cargo.toml` (optional features, enabled only for testing):

```toml
[features]
# Default runs only fast unit tests
default = []

# Individual test category features
test_unit = []
test_integration = []
test_e2e = []
test_slow = []
test_auth = []
test_users = []
test_services = []
test_repositories = []
test_redis = []
test_ci_cd_issue = []
```

### Running specific categories

- **Run only unit tests** (default, fast):  
  `cargo test`

- **Run integration tests**:  
  `cargo test --features test_integration`

- **Run slow tests**:  
  `cargo test --features test_slow`

- **Run multiple categories** (e.g., unit + auth + redis):  
  `cargo test --features "test_unit test_auth test_redis"`

- **Run all tests** (including slow/e2e/etc.):  
  `cargo test --all-features`

---
