# Feature Testing: F001 - sy-commons Foundation

**Feature ID**: F001  
**Feature Name**: sy_commons_foundation  
**Testing Date**: December 28, 2025  
**Testing Status**: [ ] Not Started

---

## 🎯 Testing Philosophy

**F001 is Infrastructure** because it provides foundational utilities (error handling, logging, configuration, filesystem operations) that other components depend on.

### What to Test
- **Boundary Works**: Error handling converts external errors correctly
- **Error Handling**: All error paths and edge cases
- **Performance**: Pre-validation meets <1ms requirement
- **Integration**: Components work together correctly

### What NOT to Test
- **Internal Implementation**: How errors are stored internally
- **External Library Behavior**: How tracing or figment work internally
- **Platform-Specific Details**: OS-specific filesystem behavior

---

## 🧪 Test Level Decision

- [x] **Infrastructure Tests** (boundary works)
- [x] **Contract Tests** (API promises held)
- [x] **Behavior Tests** (outcomes correct)
- [x] **Integration Tests** (components interact)
- [x] **Performance Tests** (meets targets)

---

## 🎭 Mock vs Real Decision Matrix

| Dependency | Use MOCK When | Use REAL When | Decision | Rationale |
|------------|---------------|---------------|----------|-----------|
| **std::fs** | Testing error conditions | Testing actual file operations | **REAL** | Need to test actual filesystem behavior |
| **tracing** | Testing log message format | Testing logging integration | **REAL** | Need to verify actual logging output |
| **figment** | Testing config parsing errors | Testing configuration loading | **REAL** | Need to verify actual TOML parsing |
| **directories** | Testing path generation | Testing platform directories | **REAL** | Need actual platform-specific paths |
| **regex** | Testing validation logic | Testing pattern matching | **REAL** | Regex behavior is deterministic |

---

## 📁 Test File Organization

```
src/
├── error.rs              # Co-located unit tests
├── logging.rs            # Co-located unit tests  
├── config.rs             # Co-located unit tests
├── filesystem.rs         # Co-located unit tests
├── prevalidation.rs      # Co-located unit tests
└── debug.rs              # Co-located unit tests

tests/
├── integration_tests.rs  # Cross-component integration tests
├── fixtures/
│   ├── test_files/       # Test files for filesystem tests
│   └── config_files/     # Test configuration files
│       ├── default.toml
│       ├── test.toml
│       ├── production.toml
│       ├── invalid.toml
│       └── empty.toml
└── mocks/
    └── mock_filesystem.rs # Mock filesystem for error injection

benches/
└── prevalidation_bench.rs # Performance benchmarks
```

**Files to Create**:
* [x] src/error.rs (with co-located tests)
* [x] src/logging.rs (with co-located tests)
* [x] src/config.rs (with co-located tests)
* [x] src/filesystem.rs (with co-located tests)
* [x] src/prevalidation.rs (with co-located tests)
* [x] src/debug.rs (with co-located tests)
* [x] tests/integration_tests.rs
* [x] tests/fixtures/config_files/default.toml
* [x] tests/fixtures/config_files/test.toml
* [x] tests/fixtures/config_files/production.toml
* [x] tests/fixtures/config_files/invalid.toml
* [x] benches/prevalidation_bench.rs

---

## 🏗️ Testing Strategy Integration

### Symphony's Three-Layer Testing Architecture

**Layer 1: Unit Tests (Rust) - <100ms**
- Mock external dependencies where appropriate
- Focus on sy-commons logic, algorithms, data structures
- Test every public function, edge cases, error conditions
- Use co-located tests for immediate feedback
- Include property tests for validation rules

**Layer 2: Integration Tests (Rust) - <5s**
- Test cross-component workflows and real system integration
- Validate performance under realistic conditions
- Test actual file operations and configuration loading
- Use real dependencies for integration validation

**Layer 3: Pre-validation Tests (Rust) - <1ms**
- Test pre-validation performance requirements
- Focus on input sanitization, format checking, basic constraints
- Ensure fast validation to prevent unnecessary operations
- Examples: Configuration validation, path validation, rule validation

**Testing Boundary Separation**:
- **sy-commons Layer**: Test utility functions, error handling, configuration parsing
- **External Dependencies**: Trust external libraries (tracing, figment, directories) but test our usage

---

## 📋 Acceptance Test-Driven Development (ATDD)

### AC1: SymphonyError Base Error System
```gherkin
Scenario: Error conversion from std::io::Error
  Given a std::io::Error occurs during file operations
  When the error is converted to SymphonyError
  Then it becomes SymphonyError::Io with proper context
  And the original error is preserved as source
  And the error message is actionable

Scenario: Error context addition
  Given a validation error occurs
  When context is added using ResultContext trait
  Then the error includes field and value information
  And the error message is enhanced with context
  And the error chain is preserved

Scenario: Error categorization
  Given different types of errors occur
  When they are converted to SymphonyError
  Then they are categorized correctly (Validation, Io, Serialization, Configuration, Generic)
  And each category has appropriate fields
  And error messages are consistent within categories
```

### AC2: Professional Logging System
```gherkin
Scenario: Console logging output
  Given logging is configured for console output
  When log messages are written at different levels
  Then messages appear on console with proper formatting
  And colors are applied when enabled
  And log levels are respected

Scenario: File logging with rotation
  Given logging is configured for file output with daily rotation
  When log messages are written over multiple days
  Then log files are created with date suffixes
  And old log files are retained according to max_files setting
  And file rotation occurs at midnight

Scenario: JSON logging for cloud analysis
  Given logging is configured for JSON output
  When structured log messages are written
  Then JSON output contains all required fields
  And spans are included when configured
  And JSON is valid and parseable
```

### AC3: Environment Configuration System
```gherkin
Scenario: Configuration loading from TOML files
  Given configuration files exist for different environments
  When configuration is loaded for "test" environment
  Then default.toml values are loaded first
  And test.toml values override defaults
  And environment variables override file values
  And the resulting configuration is type-safe

Scenario: Configuration validation
  Given an invalid configuration file
  When configuration loading is attempted
  Then a clear error message is provided
  And the error indicates which file and field is invalid
  And the error includes the invalid value

Scenario: Missing configuration file handling
  Given a configuration file is missing
  When configuration loading is attempted
  Then default values are used where available
  And missing required values cause clear errors
  And the error indicates which file is missing
```

### AC4: Safe Filesystem Utilities
```gherkin
Scenario: Safe file reading with error handling
  Given a file exists with readable content
  When the file is read using read_file()
  Then the content is returned correctly
  And the operation completes without errors
  And file handles are properly closed

Scenario: Atomic file writing
  Given content needs to be written to a file
  When write_file() is called
  Then a temporary file is created first
  And content is written to the temporary file
  And the temporary file is renamed to the target
  And the operation is atomic (no partial writes)

Scenario: Directory traversal prevention
  Given a path contains ".." components
  When path validation is performed
  Then the path is rejected with a security error
  And the error message indicates directory traversal attempt
  And no file operations are performed
```

### AC5: Pre-validation Rule Helpers
```gherkin
Scenario: Non-empty validation rule
  Given a NonEmptyRule validator
  When an empty string is validated
  Then validation fails with appropriate error
  And when a non-empty string is validated
  Then validation succeeds

Scenario: Composite rule validation
  Given a CompositeRule with multiple validation rules
  When a value is validated
  Then all rules are applied in order
  And validation fails if any rule fails
  And validation succeeds only if all rules pass

Scenario: Performance requirement validation
  Given any pre-validation rule
  When validation is performed
  Then the operation completes in <1ms
  And performance is measured and logged
  And slow validations trigger warnings
```

### AC6: Duck Debugging Utilities
```gherkin
Scenario: Duck debugging macro in debug builds
  Given duck debugging is enabled in debug build
  When duck!() macro is used
  Then debug output is printed to stderr
  And output includes file name and line number
  And output has [DUCK DEBUGGING] prefix for searchability

Scenario: Duck debugging disabled in release builds
  Given a release build is compiled
  When duck!() macro is used
  Then no debug output is generated
  And there is no runtime performance impact
  And the macro compiles to nothing

Scenario: Duck value debugging
  Given duck_value!() macro is used with an expression
  When the macro is executed in debug build
  Then the expression value is printed
  And the expression is evaluated only once
  And the original value is returned unchanged
```

### AC7: Complete lib.rs Guide
```gherkin
Scenario: API documentation completeness
  Given the lib.rs file is processed by rustdoc
  When documentation is generated
  Then all public APIs have documentation
  And all code examples compile and run
  And usage examples are provided for each component

Scenario: Re-export functionality
  Given sy-commons modules define public APIs
  When lib.rs is imported
  Then all necessary APIs are re-exported
  And users can access functionality without module paths
  And the API surface is clean and intuitive
```

---

## 🧪 Unit Test Suites

### Error Handling Tests (error.rs)
```rust
#[cfg(test)]
mod tests {
    use super::*;
    use std::io;

    #[test]
    fn test_io_error_conversion() {
        let io_error = io::Error::new(io::ErrorKind::NotFound, "File not found");
        let symphony_error: SymphonyError = io_error.into();
        
        match symphony_error {
            SymphonyError::Io { source, context } => {
                assert_eq!(source.kind(), io::ErrorKind::NotFound);
                assert!(context.is_none());
            }
            _ => panic!("Expected Io error variant"),
        }
    }

    #[test]
    fn test_validation_error_with_context() {
        let result: Result<(), io::Error> = Err(io::Error::new(io::ErrorKind::InvalidInput, "Invalid"));
        let error = result.with_field_context("username", "").unwrap_err();
        
        match error {
            SymphonyError::Validation { message, field, value } => {
                assert!(message.contains("Invalid"));
                assert_eq!(field, Some("username".to_string()));
                assert_eq!(value, Some("".to_string()));
            }
            _ => panic!("Expected Validation error variant"),
        }
    }

    #[test]
    fn test_error_display() {
        let error = SymphonyError::Validation {
            message: "Test error".to_string(),
            field: Some("test_field".to_string()),
            value: Some("test_value".to_string()),
        };
        
        let display = format!("{}", error);
        assert!(display.contains("Validation error"));
        assert!(display.contains("Test error"));
    }

    #[test]
    fn test_error_debug() {
        let error = SymphonyError::Generic {
            message: "Test error".to_string(),
            source: None,
        };
        
        let debug = format!("{:?}", error);
        assert!(debug.contains("Generic"));
        assert!(debug.contains("Test error"));
    }
}
```

### Logging Tests (logging.rs)
```rust
#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Once;
    use tempfile::TempDir;

    static INIT: Once = Once::new();

    fn init_test_logging() {
        INIT.call_once(|| {
            let config = LoggingConfig {
                level: "debug".to_string(),
                console: ConsoleConfig {
                    enabled: false, // Disable for tests
                    format: ConsoleFormat::Compact,
                    colors: false,
                },
                file: None,
                json: None,
            };
            let _ = init_logging(config);
        });
    }

    #[test]
    fn test_logging_config_creation() {
        let config = LoggingConfig {
            level: "info".to_string(),
            console: ConsoleConfig {
                enabled: true,
                format: ConsoleFormat::Pretty,
                colors: true,
            },
            file: Some(FileConfig {
                enabled: true,
                path: PathBuf::from("test.log"),
                rotation: RotationConfig::Daily,
                max_files: 7,
            }),
            json: None,
        };
        
        assert_eq!(config.level, "info");
        assert!(config.console.enabled);
        assert!(config.file.is_some());
        assert!(config.json.is_none());
    }

    #[test]
    fn test_console_format_serialization() {
        let format = ConsoleFormat::Pretty;
        let serialized = serde_json::to_string(&format).unwrap();
        let deserialized: ConsoleFormat = serde_json::from_str(&serialized).unwrap();
        
        match deserialized {
            ConsoleFormat::Pretty => (),
            _ => panic!("Expected Pretty format"),
        }
    }

    #[tokio::test]
    async fn test_file_logging() {
        let temp_dir = TempDir::new().unwrap();
        let log_path = temp_dir.path().join("test.log");
        
        let config = LoggingConfig {
            level: "debug".to_string(),
            console: ConsoleConfig {
                enabled: false,
                format: ConsoleFormat::Compact,
                colors: false,
            },
            file: Some(FileConfig {
                enabled: true,
                path: log_path.clone(),
                rotation: RotationConfig::Size(1024),
                max_files: 3,
            }),
            json: None,
        };
        
        init_logging(config).unwrap();
        
        info!("Test log message");
        
        // Give logging time to flush
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        
        assert!(log_path.exists());
        let content = std::fs::read_to_string(&log_path).unwrap();
        assert!(content.contains("Test log message"));
    }
}
```

### Configuration Tests (config.rs)
```rust
#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    use std::fs;

    #[derive(Debug, Deserialize, PartialEq)]
    struct TestConfig {
        name: String,
        value: i32,
        enabled: bool,
    }

    impl Config for TestConfig {}

    #[test]
    fn test_config_loading_with_defaults() {
        let temp_dir = TempDir::new().unwrap();
        let config_dir = temp_dir.path().join("config");
        fs::create_dir_all(&config_dir).unwrap();
        
        // Create default.toml
        let default_toml = r#"
            name = "default"
            value = 42
            enabled = true
        "#;
        fs::write(config_dir.join("default.toml"), default_toml).unwrap();
        
        // Create test.toml with override
        let test_toml = r#"
            name = "test"
            value = 100
        "#;
        fs::write(config_dir.join("test.toml"), test_toml).unwrap();
        
        // Change to temp directory for test
        let original_dir = std::env::current_dir().unwrap();
        std::env::set_current_dir(&temp_dir).unwrap();
        
        let config: TestConfig = load_config("test").unwrap();
        
        assert_eq!(config.name, "test"); // Overridden
        assert_eq!(config.value, 100);   // Overridden
        assert_eq!(config.enabled, true); // From default
        
        // Restore original directory
        std::env::set_current_dir(original_dir).unwrap();
    }

    #[test]
    fn test_config_loading_with_env_override() {
        std::env::set_var("SYMPHONY_NAME", "env_override");
        std::env::set_var("SYMPHONY_VALUE", "999");
        
        let temp_dir = TempDir::new().unwrap();
        let config_dir = temp_dir.path().join("config");
        fs::create_dir_all(&config_dir).unwrap();
        
        let default_toml = r#"
            name = "default"
            value = 42
            enabled = true
        "#;
        fs::write(config_dir.join("default.toml"), default_toml).unwrap();
        
        let original_dir = std::env::current_dir().unwrap();
        std::env::set_current_dir(&temp_dir).unwrap();
        
        let config: TestConfig = load_config("default").unwrap();
        
        assert_eq!(config.name, "env_override"); // From environment
        assert_eq!(config.value, 999);           // From environment
        assert_eq!(config.enabled, true);        // From file
        
        std::env::set_current_dir(original_dir).unwrap();
        std::env::remove_var("SYMPHONY_NAME");
        std::env::remove_var("SYMPHONY_VALUE");
    }

    #[test]
    fn test_invalid_config_error() {
        let temp_dir = TempDir::new().unwrap();
        let config_dir = temp_dir.path().join("config");
        fs::create_dir_all(&config_dir).unwrap();
        
        let invalid_toml = r#"
            name = "test"
            value = "not_a_number"  # Invalid type
            enabled = true
        "#;
        fs::write(config_dir.join("default.toml"), invalid_toml).unwrap();
        
        let original_dir = std::env::current_dir().unwrap();
        std::env::set_current_dir(&temp_dir).unwrap();
        
        let result: Result<TestConfig, SymphonyError> = load_config("default");
        
        assert!(result.is_err());
        match result.unwrap_err() {
            SymphonyError::Configuration { message, file } => {
                assert!(message.contains("Failed to load"));
                assert!(file.is_some());
            }
            _ => panic!("Expected Configuration error"),
        }
        
        std::env::set_current_dir(original_dir).unwrap();
    }
}
```

### Filesystem Tests (filesystem.rs)
```rust
#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[tokio::test]
    async fn test_read_file_success() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("test.txt");
        let content = "Hello, World!";
        
        std::fs::write(&file_path, content).unwrap();
        
        let result = read_file(&file_path).await.unwrap();
        assert_eq!(result, content);
    }

    #[tokio::test]
    async fn test_read_file_not_found() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("nonexistent.txt");
        
        let result = read_file(&file_path).await;
        assert!(result.is_err());
        
        match result.unwrap_err() {
            SymphonyError::Io { source, context } => {
                assert_eq!(source.kind(), std::io::ErrorKind::NotFound);
                assert!(context.is_some());
                assert!(context.unwrap().contains("Failed to read file"));
            }
            _ => panic!("Expected Io error"),
        }
    }

    #[tokio::test]
    async fn test_write_file_atomic() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("test.txt");
        let content = "Test content";
        
        write_file(&file_path, content).await.unwrap();
        
        assert!(file_path.exists());
        let read_content = std::fs::read_to_string(&file_path).unwrap();
        assert_eq!(read_content, content);
        
        // Verify no temporary file remains
        let temp_path = file_path.with_extension("tmp");
        assert!(!temp_path.exists());
    }

    #[tokio::test]
    async fn test_create_dir_all() {
        let temp_dir = TempDir::new().unwrap();
        let nested_path = temp_dir.path().join("a").join("b").join("c");
        
        create_dir_all(&nested_path).await.unwrap();
        
        assert!(nested_path.exists());
        assert!(nested_path.is_dir());
    }

    #[tokio::test]
    async fn test_file_exists() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("test.txt");
        
        assert!(!file_exists(&file_path).await);
        
        std::fs::write(&file_path, "content").unwrap();
        
        assert!(file_exists(&file_path).await);
    }

    #[test]
    fn test_path_validation_directory_traversal() {
        let path = Path::new("../../../etc/passwd");
        let result = validate_path(path);
        
        assert!(result.is_err());
        match result.unwrap_err() {
            SymphonyError::Validation { message, field, value } => {
                assert!(message.contains("directory traversal"));
                assert_eq!(field, Some("path".to_string()));
                assert!(value.is_some());
            }
            _ => panic!("Expected Validation error"),
        }
    }

    #[test]
    fn test_path_validation_safe_path() {
        let path = Path::new("safe/path/file.txt");
        let result = validate_path(path);
        
        assert!(result.is_ok());
    }

    #[test]
    fn test_get_project_dirs() {
        let dirs = get_project_dirs();
        // This test is platform-dependent, so we just verify it doesn't panic
        // and returns a reasonable result
        if let Some(dirs) = dirs {
            assert!(dirs.config_dir().exists() || !dirs.config_dir().as_os_str().is_empty());
        }
    }
}
```

### Pre-validation Tests (prevalidation.rs)
```rust
#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Instant;

    #[test]
    fn test_non_empty_rule_success() {
        let rule = NonEmptyRule;
        let value = "not empty".to_string();
        
        let result = rule.validate(&value);
        assert!(result.is_ok());
    }

    #[test]
    fn test_non_empty_rule_failure() {
        let rule = NonEmptyRule;
        let value = "".to_string();
        
        let result = rule.validate(&value);
        assert!(result.is_err());
        
        match result.unwrap_err() {
            SymphonyError::Validation { message, field, value } => {
                assert!(message.contains("cannot be empty"));
                assert!(field.is_none());
                assert_eq!(value, Some("".to_string()));
            }
            _ => panic!("Expected Validation error"),
        }
    }

    #[test]
    fn test_min_length_rule() {
        let rule = MinLengthRule(5);
        
        // Test success
        let valid_value = "12345".to_string();
        assert!(rule.validate(&valid_value).is_ok());
        
        // Test failure
        let invalid_value = "123".to_string();
        let result = rule.validate(&invalid_value);
        assert!(result.is_err());
        
        match result.unwrap_err() {
            SymphonyError::Validation { message, .. } => {
                assert!(message.contains("at least 5 characters"));
            }
            _ => panic!("Expected Validation error"),
        }
    }

    #[test]
    fn test_composite_rule() {
        let rule = CompositeRule::new()
            .add_rule(NonEmptyRule)
            .add_rule(MinLengthRule(3));
        
        // Test success
        let valid_value = "valid".to_string();
        assert!(rule.validate(&valid_value).is_ok());
        
        // Test failure on first rule
        let empty_value = "".to_string();
        let result = rule.validate(&empty_value);
        assert!(result.is_err());
        
        // Test failure on second rule
        let short_value = "ab".to_string();
        let result = rule.validate(&short_value);
        assert!(result.is_err());
    }

    #[test]
    fn test_validate_fast_performance() {
        let rule = NonEmptyRule;
        let value = "test value".to_string();
        
        let start = Instant::now();
        let result = validate_fast(&value, &rule);
        let duration = start.elapsed();
        
        assert!(result.is_ok());
        assert!(duration.as_millis() < 1, "Validation took {}ms, expected <1ms", duration.as_millis());
    }

    #[test]
    fn test_rule_description() {
        let rule = NonEmptyRule;
        assert_eq!(rule.description(), "Value must not be empty");
        
        let rule = MinLengthRule(10);
        assert_eq!(rule.description(), "Value must meet minimum length requirement");
    }

    // Property-based test for validation rules
    #[cfg(feature = "proptest")]
    use proptest::prelude::*;

    #[cfg(feature = "proptest")]
    proptest! {
        #[test]
        fn test_non_empty_rule_property(s in ".*") {
            let rule = NonEmptyRule;
            let result = rule.validate(&s);
            
            if s.is_empty() {
                prop_assert!(result.is_err());
            } else {
                prop_assert!(result.is_ok());
            }
        }

        #[test]
        fn test_min_length_rule_property(s in ".*", min_len in 0usize..20) {
            let rule = MinLengthRule(min_len);
            let result = rule.validate(&s);
            
            if s.len() < min_len {
                prop_assert!(result.is_err());
            } else {
                prop_assert!(result.is_ok());
            }
        }
    }
}
```

### Duck Debugging Tests (debug.rs)
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_duck_debugger_enabled() {
        let debugger = DuckDebugger::new(true);
        
        // This test mainly ensures the debugger doesn't panic
        // Actual output testing would require capturing stderr
        debugger.trace("Test message");
        debugger.log("Test value", &42);
    }

    #[test]
    fn test_duck_debugger_disabled() {
        let debugger = DuckDebugger::new(false);
        
        // This test ensures disabled debugger doesn't panic
        debugger.trace("Test message");
        debugger.log("Test value", &42);
    }

    #[test]
    fn test_duck_macro_compilation() {
        // Test that duck! macro compiles without errors
        duck!("Test message");
        duck!("Test with value: {}", 42);
    }

    #[test]
    fn test_duck_value_macro() {
        let value = 42;
        let result = duck_value!(value);
        
        // In debug builds, this should print and return the value
        // In release builds, this should just return the value
        assert_eq!(result, 42);
    }

    #[test]
    fn test_duck_value_macro_with_expression() {
        let result = duck_value!(2 + 2);
        assert_eq!(result, 4);
    }
}
```

---

## 🔄 Integration Test Scenarios

### Cross-Component Integration Tests
```rust
// tests/integration_tests.rs
use sy_commons::*;
use tempfile::TempDir;
use std::fs;

#[tokio::test]
async fn test_error_logging_integration() {
    // Test that errors are properly logged
    let temp_dir = TempDir::new().unwrap();
    let log_path = temp_dir.path().join("integration.log");
    
    let config = LoggingConfig {
        level: "error".to_string(),
        console: ConsoleConfig {
            enabled: false,
            format: ConsoleFormat::Compact,
            colors: false,
        },
        file: Some(FileConfig {
            enabled: true,
            path: log_path.clone(),
            rotation: RotationConfig::Size(1024 * 1024),
            max_files: 1,
        }),
        json: None,
    };
    
    init_logging(config).unwrap();
    
    // Generate an error and log it
    let error = SymphonyError::Validation {
        message: "Integration test error".to_string(),
        field: Some("test_field".to_string()),
        value: Some("test_value".to_string()),
    };
    
    error!("Test error: {}", error);
    
    // Give logging time to flush
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    // Verify error was logged
    assert!(log_path.exists());
    let log_content = fs::read_to_string(&log_path).unwrap();
    assert!(log_content.contains("Integration test error"));
    assert!(log_content.contains("test_field"));
}

#[tokio::test]
async fn test_config_filesystem_integration() {
    // Test loading configuration and using it for filesystem operations
    let temp_dir = TempDir::new().unwrap();
    let config_dir = temp_dir.path().join("config");
    fs::create_dir_all(&config_dir).unwrap();
    
    let config_toml = r#"
        [filesystem]
        max_file_size = 1024
        atomic_writes = true
        
        [logging]
        level = "info"
        
        [logging.console]
        enabled = false
        format = "compact"
        colors = false
    "#;
    fs::write(config_dir.join("default.toml"), config_toml).unwrap();
    
    let original_dir = std::env::current_dir().unwrap();
    std::env::set_current_dir(&temp_dir).unwrap();
    
    let config: DefaultConfig = load_config("default").unwrap();
    
    assert_eq!(config.filesystem.max_file_size, 1024);
    assert!(config.filesystem.atomic_writes);
    
    // Test filesystem operation with config
    let test_file = temp_dir.path().join("test.txt");
    let content = "x".repeat(512); // Within limit
    
    write_file(&test_file, &content).await.unwrap();
    let read_content = read_file(&test_file).await.unwrap();
    assert_eq!(read_content, content);
    
    std::env::set_current_dir(original_dir).unwrap();
}

#[test]
fn test_validation_error_context_integration() {
    // Test that validation errors work with context
    let rule = CompositeRule::new()
        .add_rule(NonEmptyRule)
        .add_rule(MinLengthRule(5));
    
    let invalid_value = "".to_string();
    let result = rule.validate(&invalid_value)
        .with_field_context("username", &invalid_value);
    
    assert!(result.is_err());
    match result.unwrap_err() {
        SymphonyError::Validation { message, field, value } => {
            assert!(message.contains("cannot be empty"));
            assert_eq!(field, Some("username".to_string()));
            assert_eq!(value, Some("".to_string()));
        }
        _ => panic!("Expected Validation error"),
    }
}
```

---

## ⚡ Performance Test Execution Plan

### Pre-Implementation Performance Tests
```rust
// benches/prevalidation_bench.rs
use criterion::{black_box, criterion_group, criterion_main, Criterion};
use sy_commons::prevalidation::*;

fn bench_non_empty_validation(c: &mut Criterion) {
    let rule = NonEmptyRule;
    let valid_value = "test value".to_string();
    let invalid_value = "".to_string();
    
    c.bench_function("non_empty_valid", |b| {
        b.iter(|| rule.validate(black_box(&valid_value)))
    });
    
    c.bench_function("non_empty_invalid", |b| {
        b.iter(|| rule.validate(black_box(&invalid_value)))
    });
}

fn bench_min_length_validation(c: &mut Criterion) {
    let rule = MinLengthRule(10);
    let valid_value = "this is a long enough string".to_string();
    let invalid_value = "short".to_string();
    
    c.bench_function("min_length_valid", |b| {
        b.iter(|| rule.validate(black_box(&valid_value)))
    });
    
    c.bench_function("min_length_invalid", |b| {
        b.iter(|| rule.validate(black_box(&invalid_value)))
    });
}

fn bench_composite_validation(c: &mut Criterion) {
    let rule = CompositeRule::new()
        .add_rule(NonEmptyRule)
        .add_rule(MinLengthRule(5))
        .add_rule(MaxLengthRule(100));
    
    let valid_value = "valid test value".to_string();
    
    c.bench_function("composite_validation", |b| {
        b.iter(|| rule.validate(black_box(&valid_value)))
    });
}

fn bench_validate_fast(c: &mut Criterion) {
    let rule = NonEmptyRule;
    let value = "test value".to_string();
    
    c.bench_function("validate_fast", |b| {
        b.iter(|| validate_fast(black_box(&value), black_box(&rule)))
    });
}

criterion_group!(
    benches,
    bench_non_empty_validation,
    bench_min_length_validation,
    bench_composite_validation,
    bench_validate_fast
);
criterion_main!(benches);
```

### Performance Targets Validation
- **Pre-validation**: <1ms for all validation rules
- **Error creation**: <0.01ms for error instantiation
- **Configuration loading**: <10ms for typical configuration
- **File operations**: <5ms for small files (<1KB)
- **Logging overhead**: <0.1ms per log message

---

## 📊 Test Execution Plan

### Pre-Implementation Phase
- [ ] Set up test infrastructure and fixtures
- [ ] Create test configuration files
- [ ] Set up performance benchmarking
- [ ] Create integration test scenarios

### During Implementation Phase
- [ ] Run unit tests for each component as implemented
- [ ] Validate performance benchmarks meet targets
- [ ] Run integration tests for component interactions
- [ ] Test error handling paths

### Post-Implementation Phase
- [ ] Run complete test suite
- [ ] Validate all acceptance criteria
- [ ] Performance regression testing
- [ ] Documentation example testing
- [ ] Final integration validation

### Continuous Integration
- [ ] All tests pass on multiple platforms (Windows, Linux, macOS)
- [ ] Performance benchmarks meet targets
- [ ] Code coverage meets 100% for public APIs
- [ ] Documentation tests pass
- [ ] Clippy lints pass with pedantic settings

---

## 🎯 Test Markers and Organization

### Test Markers
```rust
// Unit tests (fast, isolated)
#[cfg(test)]
mod unit_tests {
    // Tests marked as "unit"
}

// Integration tests (slower, full stack)
#[cfg(test)]
mod integration_tests {
    // Tests marked as "integration"
}

// Performance tests (benchmarks)
#[cfg(test)]
mod performance_tests {
    // Tests marked as "performance"
}

// Slow tests (>100ms)
#[cfg(test)]
mod slow_tests {
    // Tests marked as "slow"
}
```

### Test Execution Commands
```bash
# Run all tests
cargo test

# Run only unit tests
cargo test unit_tests

# Run only integration tests
cargo test integration_tests

# Run performance benchmarks
cargo bench

# Run with coverage
cargo tarpaulin --out Html

# Run slow tests
cargo test slow_tests -- --ignored
```

This comprehensive testing strategy ensures sy-commons meets all requirements for error handling, logging, configuration, filesystem operations, pre-validation, and debugging utilities while maintaining high performance and reliability standards.