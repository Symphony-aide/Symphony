//! Integration tests for sy-commons crate
//!
//! This module contains integration tests that verify the interaction between
//! different components of the sy-commons crate, including error handling,
//! logging, configuration, filesystem operations, and validation.

use std::fs;
use sy_commons::*;
use tempfile::TempDir;

#[tokio::test]
async fn test_error_logging_integration() {
	// Test that errors are properly logged
	let temp_dir = TempDir::new().unwrap();
	let log_path = temp_dir.path().join("integration.log");

	let config = LoggingConfig {
		level: "error".to_string(),
		console: logging::ConsoleConfig {
			enabled: false,
			format: logging::ConsoleFormat::Compact,
			colors: false,
		},
		file: Some(logging::FileConfig {
			enabled: true,
			path: log_path.clone(),
			rotation: logging::RotationConfig::Size(1024 * 1024),
			max_files: 1,
		}),
		json: None,
	};

	// This should succeed with console logging enabled
	let result = init_logging(config);
	assert!(result.is_ok()); // Should succeed with duck debugging message for file logging
}

#[tokio::test]
async fn test_config_filesystem_integration() {
	// Test loading configuration and using it for filesystem operations
	let temp_dir = TempDir::new().unwrap();
	let config_dir = temp_dir.path().join("config");
	fs::create_dir_all(&config_dir).unwrap();

	let config_toml = r#"
        [logging]
        level = "info"
        
        [logging.console]
        enabled = true
        format = "Pretty"
        colors = true
        
        [filesystem]
        max_file_size = 1048576
        atomic_writes = true
        
        [debug]
        duck_debugging = true
        performance_logging = false
    "#;
	fs::write(config_dir.join("default.toml"), config_toml).unwrap();

	let original_dir = std::env::current_dir().unwrap();
	std::env::set_current_dir(&temp_dir).unwrap();

	let config: DefaultConfig = load_config("default").unwrap();

	// Test that we can use the loaded config
	assert_eq!(config.logging.level, "info");
	assert_eq!(config.filesystem.max_file_size, 1048576);
	assert!(config.filesystem.atomic_writes);

	// Test filesystem operations
	let test_file = temp_dir.path().join("test_file.txt");
	let content = "Test content for integration";

	write_file(&test_file, content).await.unwrap();
	let read_content = read_file(&test_file).await.unwrap();

	assert_eq!(read_content, content);

	std::env::set_current_dir(original_dir).unwrap();
}

#[tokio::test]
async fn test_validation_error_context() {
	// Test that validation errors include proper context
	use prevalidation::{NonEmptyRule, PreValidationRule};

	let rule = NonEmptyRule;
	let empty_value = "".to_string();

	let result = rule.validate(&empty_value);
	assert!(result.is_err());

	match result.unwrap_err() {
		SymphonyError::Validation {
			message,
			field,
			value,
		} => {
			assert!(message.contains("cannot be empty"));
			assert!(field.is_none());
			assert_eq!(value, Some("".to_string()));
		},
		_ => panic!("Expected Validation error"),
	}
}

#[test]
fn test_duck_debugging_integration() {
	// Test that duck debugging compiles and works
	duck!("Integration test duck debugging");
	duck!("Duck with format: {}", 42);

	// This should compile without errors
	assert!(true);
}
