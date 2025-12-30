//! Pre-validation rule helpers for Symphony
//!
//! This module provides lightweight technical validation utilities with
//! performance optimization (<1ms requirement).

use crate::error::SymphonyError;

/// Trait for pre-validation rules
///
/// # Examples
///
/// ```rust
/// use sy_commons::prevalidation::{PreValidationRule, NonEmptyRule};
///
/// let rule = NonEmptyRule;
/// let value = "not empty".to_string();
/// assert!(rule.validate(&value).is_ok());
/// ```
pub trait PreValidationRule<T> {
	/// The error type returned when validation fails
	type Error;

	/// Validate the value, returning Ok(()) if valid
	fn validate(&self, value: &T) -> Result<(), Self::Error>;

	/// Get a description of this rule
	fn description(&self) -> &str;
}

/// Rule that validates non-empty strings
pub struct NonEmptyRule;

impl PreValidationRule<String> for NonEmptyRule {
	type Error = SymphonyError;

	fn validate(&self, value: &String) -> Result<(), Self::Error> {
		if value.is_empty() {
			Err(SymphonyError::Validation {
				message: "Value cannot be empty".to_string(),
				field: None,
				value: Some(value.clone()),
			})
		} else {
			Ok(())
		}
	}

	fn description(&self) -> &'static str {
		"Value must not be empty"
	}
}

/// Rule that validates minimum string length
pub struct MinLengthRule(pub usize);

impl PreValidationRule<String> for MinLengthRule {
	type Error = SymphonyError;

	fn validate(&self, value: &String) -> Result<(), Self::Error> {
		if value.len() < self.0 {
			Err(SymphonyError::Validation {
				message: format!("Value must be at least {} characters", self.0),
				field: None,
				value: Some(value.clone()),
			})
		} else {
			Ok(())
		}
	}

	fn description(&self) -> &'static str {
		"Value must meet minimum length requirement"
	}
}

/// Rule that validates maximum string length
pub struct MaxLengthRule(pub usize);

impl PreValidationRule<String> for MaxLengthRule {
	type Error = SymphonyError;

	fn validate(&self, value: &String) -> Result<(), Self::Error> {
		if value.len() > self.0 {
			Err(SymphonyError::Validation {
				message: format!("Value must be at most {} characters", self.0),
				field: None,
				value: Some(value.clone()),
			})
		} else {
			Ok(())
		}
	}

	fn description(&self) -> &'static str {
		"Value must meet maximum length requirement"
	}
}

/// Rule composition for complex validation
pub struct CompositeRule<T> {
	rules: Vec<Box<dyn PreValidationRule<T, Error = SymphonyError>>>,
}

impl<T> CompositeRule<T> {
	/// Create a new empty composite rule
	#[must_use]
	pub fn new() -> Self {
		Self { rules: Vec::new() }
	}

	/// Add a validation rule to this composite rule
	pub fn add_rule<R>(mut self, rule: R) -> Self
	where
		R: PreValidationRule<T, Error = SymphonyError> + 'static,
	{
		self.rules.push(Box::new(rule));
		self
	}
}

impl<T> Default for CompositeRule<T> {
	fn default() -> Self {
		Self::new()
	}
}

impl<T> PreValidationRule<T> for CompositeRule<T> {
	type Error = SymphonyError;

	fn validate(&self, value: &T) -> Result<(), Self::Error> {
		for rule in &self.rules {
			rule.validate(value)?;
		}
		Ok(())
	}

	fn description(&self) -> &'static str {
		"Composite validation rule"
	}
}

/// Performance-optimized validation helper
///
/// # Examples
///
/// ```rust
/// use sy_commons::prevalidation::{validate_fast, NonEmptyRule};
///
/// let rule = NonEmptyRule;
/// let value = "test value".to_string();
/// assert!(validate_fast(&value, &rule).is_ok());
/// ```
pub fn validate_fast<T, R>(value: &T, rule: &R) -> Result<(), SymphonyError>
where
	R: PreValidationRule<T, Error = SymphonyError>,
{
	let start = std::time::Instant::now();
	let result = rule.validate(value);
	let duration = start.elapsed();

	// Ensure validation completes in <1ms
	if duration.as_millis() > 1 {
		crate::duck!("Validation took {}ms, exceeding 1ms target", duration.as_millis());
	}

	result
}

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
		let value = String::new();

		let result = rule.validate(&value);
		assert!(result.is_err());

		match result.unwrap_err() {
			SymphonyError::Validation {
				message,
				field,
				value,
			} => {
				assert!(message.contains("cannot be empty"));
				assert!(field.is_none());
				assert_eq!(value, Some(String::new()));
			},
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
			},
			_ => panic!("Expected Validation error"),
		}
	}

	#[test]
	fn test_max_length_rule() {
		let rule = MaxLengthRule(5);

		// Test success
		let valid_value = "123".to_string();
		assert!(rule.validate(&valid_value).is_ok());

		// Test failure
		let invalid_value = "123456".to_string();
		let result = rule.validate(&invalid_value);
		assert!(result.is_err());

		match result.unwrap_err() {
			SymphonyError::Validation { message, .. } => {
				assert!(message.contains("at most 5 characters"));
			},
			_ => panic!("Expected Validation error"),
		}
	}

	#[test]
	fn test_composite_rule() {
		let rule = CompositeRule::new().add_rule(NonEmptyRule).add_rule(MinLengthRule(3));

		// Test success
		let valid_value = "valid".to_string();
		assert!(rule.validate(&valid_value).is_ok());

		// Test failure on first rule
		let empty_value = String::new();
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
		assert!(
			duration.as_millis() < 1,
			"Validation took {}ms, expected <1ms",
			duration.as_millis()
		);
	}

	#[test]
	fn test_rule_description() {
		let rule = NonEmptyRule;
		assert_eq!(rule.description(), "Value must not be empty");

		let rule = MinLengthRule(10);
		assert_eq!(rule.description(), "Value must meet minimum length requirement");

		let rule = MaxLengthRule(50);
		assert_eq!(rule.description(), "Value must meet maximum length requirement");
	}

	// Property-based test for validation rules
	#[cfg(feature = "unit")]
	mod property_tests {
		use super::*;
		use proptest::prelude::*;

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
}
