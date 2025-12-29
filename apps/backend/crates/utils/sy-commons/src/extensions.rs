//! Extension traits for adding functionality to existing types
//!
//! This module provides extension traits that add new methods to existing types
//! without modifying their original definitions, following the Open-Closed Principle.

/// Extension trait for String validation operations
///
/// Adds common validation methods to String and &str types without
/// modifying the original String implementation.
///
/// # Examples
///
/// ```rust
/// use sy_commons::extensions::StringValidation;
///
/// let email = "user@example.com".to_string();
/// assert!(email.is_valid_email());
///
/// let not_email = "invalid-email".to_string();
/// assert!(!not_email.is_valid_email());
/// ```
pub trait StringValidation {
    /// Checks if the string is a valid email address
    ///
    /// This is a basic validation that checks for the presence of '@' and '.'
    /// For production use, consider using a proper email validation library.
    ///
    /// # Examples
    ///
    /// ```rust
    /// use sy_commons::extensions::StringValidation;
    ///
    /// assert!("user@example.com".is_valid_email());
    /// assert!(!"invalid-email".is_valid_email());
    /// assert!(!"@example.com".is_valid_email());
    /// assert!(!"user@".is_valid_email());
    /// ```
    fn is_valid_email(&self) -> bool;
    
    /// Checks if the string is a valid UUID format
    ///
    /// Validates that the string matches the standard UUID format:
    /// xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    ///
    /// # Examples
    ///
    /// ```rust
    /// use sy_commons::extensions::StringValidation;
    ///
    /// assert!("550e8400-e29b-41d4-a716-446655440000".is_valid_uuid());
    /// assert!(!"invalid-uuid".is_valid_uuid());
    /// assert!(!"550e8400-e29b-41d4-a716".is_valid_uuid()); // Too short
    /// ```
    fn is_valid_uuid(&self) -> bool;
}

impl StringValidation for String {
    fn is_valid_email(&self) -> bool {
        self.as_str().is_valid_email()
    }
    
    fn is_valid_uuid(&self) -> bool {
        self.as_str().is_valid_uuid()
    }
}

impl StringValidation for &str {
    fn is_valid_email(&self) -> bool {
        // Basic email validation - contains @ and at least one dot after @
        if let Some(at_pos) = self.find('@') {
            let after_at = &self[at_pos + 1..];
            !after_at.is_empty() && after_at.contains('.') && at_pos > 0
        } else {
            false
        }
    }
    
    fn is_valid_uuid(&self) -> bool {
        // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 characters)
        if self.len() != 36 {
            return false;
        }
        
        let parts: Vec<&str> = self.split('-').collect();
        if parts.len() != 5 {
            return false;
        }
        
        // Check part lengths: 8-4-4-4-12
        let expected_lengths = [8, 4, 4, 4, 12];
        for (i, part) in parts.iter().enumerate() {
            if part.len() != expected_lengths[i] {
                return false;
            }
            
            // Check that all characters are hexadecimal
            if !part.chars().all(|c| c.is_ascii_hexdigit()) {
                return false;
            }
        }
        
        true
    }
}

/// Extension trait for Option types to provide additional utility methods
///
/// # Examples
///
/// ```rust
/// use sy_commons::extensions::OptionExt;
///
/// let some_value = Some(42);
/// let none_value: Option<i32> = None;
///
/// assert_eq!(some_value.unwrap_or_default(), 42);
/// assert_eq!(none_value.unwrap_or_default(), 0);
/// ```
pub trait OptionExt<T> {
    /// Returns the contained value or a default value for the type
    ///
    /// This is similar to `unwrap_or_default()` but works with any type
    /// that implements `Default`.
    fn unwrap_or_default(self) -> T where T: Default;
}

impl<T> OptionExt<T> for Option<T> {
    fn unwrap_or_default(self) -> T where T: Default {
        Self::unwrap_or_default(self)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_string_email_validation() {
        // Valid emails
        assert!("user@example.com".is_valid_email());
        assert!("test.email@domain.co.uk".is_valid_email());
        assert!("user+tag@example.org".is_valid_email());
        
        // Invalid emails
        assert!(!"invalid-email".is_valid_email());
        assert!(!"@example.com".is_valid_email());
        assert!(!"user@".is_valid_email());
        assert!(!"user@domain".is_valid_email()); // No dot after @
        assert!("".is_valid_email() == false);
    }

    #[test]
    fn test_string_uuid_validation() {
        // Valid UUIDs
        assert!("550e8400-e29b-41d4-a716-446655440000".is_valid_uuid());
        assert!("00000000-0000-0000-0000-000000000000".is_valid_uuid());
        assert!("ffffffff-ffff-ffff-ffff-ffffffffffff".is_valid_uuid());
        
        // Invalid UUIDs
        assert!(!"invalid-uuid".is_valid_uuid());
        assert!(!"550e8400-e29b-41d4-a716".is_valid_uuid()); // Too short
        assert!(!"550e8400-e29b-41d4-a716-446655440000-extra".is_valid_uuid()); // Too long
        assert!(!"550e8400-e29b-41d4-a716-44665544000g".is_valid_uuid()); // Invalid hex
        assert!(!"550e8400e29b41d4a716446655440000".is_valid_uuid()); // No dashes
        assert!("".is_valid_uuid() == false);
    }

    #[test]
    fn test_option_ext() {
        let some_value = Some(42);
        let none_value: Option<i32> = None;
        
        assert_eq!(some_value.unwrap_or_default(), 42);
        assert_eq!(none_value.unwrap_or_default(), 0);
        
        let some_string = Some("hello".to_string());
        let none_string: Option<String> = None;
        
        assert_eq!(some_string.unwrap_or_default(), "hello");
        assert_eq!(none_string.unwrap_or_default(), String::new());
    }
}