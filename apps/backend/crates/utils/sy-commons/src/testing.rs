//! Thread-safe testing utilities for factory-based test data generation
//!
//! Provides safety infrastructure that eliminates race conditions and ensures
//! unique, deterministic test data across parallel test execution.

use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::OnceLock;

/// Thread-safe generator for unique test data
///
/// Provides utilities that specific factory structs can use to generate
/// unique, deterministic test data without race conditions.
pub struct SafeGenerator {
	session_id: String,
	counter: AtomicU64,
}

impl SafeGenerator {
	/// Create a new safe generator with unique session ID
	fn new() -> Self {
		let session_id = format!(
			"test_session_{}",
			std::process::id() % 10000 // Keep session ID short but unique per process
		);

		Self {
			session_id,
			counter: AtomicU64::new(1),
		}
	}

	/// Get next unique ID for this test session
	///
	/// Thread-safe, monotonically increasing counter that ensures
	/// each call returns a different value across all threads.
	pub fn next_unique_id(&self) -> u64 {
		self.counter.fetch_add(1, Ordering::SeqCst)
	}

	/// Generate unique string with prefix
	///
	/// Format: "{prefix}_{`session_id`}_{`unique_id`}"
	pub fn unique_string_with_prefix(&self, prefix: &str) -> String {
		let id = self.next_unique_id();
		format!("{}_{}_{}", prefix, self.session_id, id)
	}

	/// Mutate a valid string to create predictable invalid variant
	///
	/// Uses deterministic mutations based on string content to ensure
	/// the same input always produces the same invalid output.
	pub fn mutate_to_invalid(&self, valid: &str) -> String {
		if valid.is_empty() {
			return "invalid".to_string();
		}

		let mut invalid = valid.to_string();

		// Apply deterministic mutations based on content
		if valid.contains('@') {
			// For emails: remove @ symbol
			invalid = invalid.replace('@', "-");
		} else if valid.contains('-') && valid.len() > 10 {
			// For UUIDs: remove last character
			invalid.pop();
		} else if valid.starts_with('{') && valid.ends_with('}') {
			// For JSON: remove closing brace
			invalid.pop();
		} else {
			// Generic: append invalid suffix
			invalid.push_str("_INVALID");
		}

		invalid
	}

	/// Generate number in range (thread-safe)
	///
	/// Uses the internal counter to generate deterministic values
	/// within the specified range.
	pub fn number_in_range(&self, min: u64, max: u64) -> u64 {
		if min >= max {
			return min;
		}

		let id = self.next_unique_id();
		min + (id % (max - min))
	}
}

/// Global safe generator instance
static GENERATOR: OnceLock<SafeGenerator> = OnceLock::new();

/// Get the global safe generator instance
///
/// Thread-safe singleton that provides consistent behavior across
/// all test factories in the current test session.
pub fn safe_generator() -> &'static SafeGenerator {
	GENERATOR.get_or_init(SafeGenerator::new)
}

#[cfg(test)]
mod tests {
	use super::*;

	#[test]
	fn test_unique_ids_are_sequential() {
		let gen = SafeGenerator::new();
		let id1 = gen.next_unique_id();
		let id2 = gen.next_unique_id();
		let id3 = gen.next_unique_id();

		assert_eq!(id1, 1);
		assert_eq!(id2, 2);
		assert_eq!(id3, 3);
	}

	#[test]
	fn test_unique_string_format() {
		let gen = SafeGenerator::new();
		let result = gen.unique_string_with_prefix("test");

		assert!(result.starts_with("test_"));
		assert!(result.contains("test_session_"));
		assert!(result.ends_with("_1")); // First call gets ID 1
	}

	#[test]
	fn test_email_mutation() {
		let gen = SafeGenerator::new();
		let valid_email = "user@domain.com";
		let invalid = gen.mutate_to_invalid(valid_email);

		assert_eq!(invalid, "user-domain.com");
		assert!(!invalid.contains('@'));
	}

	#[test]
	fn test_uuid_mutation() {
		let gen = SafeGenerator::new();
		let valid_uuid = "550e8400-e29b-41d4-a716-446655440000";
		let invalid = gen.mutate_to_invalid(valid_uuid);

		assert_eq!(invalid, "550e8400-e29b-41d4-a716-44665544000");
		assert_ne!(invalid, valid_uuid);
		assert_eq!(invalid.len(), valid_uuid.len() - 1);
	}

	#[test]
	fn test_json_mutation() {
		let gen = SafeGenerator::new();
		let valid_json = r#"{"name": "test"}"#;
		let invalid = gen.mutate_to_invalid(valid_json);

		assert_eq!(invalid, r#"{"name": "test""#);
		assert!(!invalid.ends_with('}'));
	}

	#[test]
	fn test_number_in_range() {
		let gen = SafeGenerator::new();

		for _ in 0..10 {
			let num = gen.number_in_range(1000, 2000);
			assert!(num >= 1000);
			assert!(num < 2000);
		}
	}

	#[test]
	fn test_global_generator_consistency() {
		let gen1 = safe_generator();
		let gen2 = safe_generator();

		// Should be the same instance
		assert!(std::ptr::eq(gen1, gen2));

		let id1 = gen1.next_unique_id();
		let id2 = gen2.next_unique_id();

		// Should be sequential since it's the same instance
		assert_eq!(id2, id1 + 1);
	}
}
