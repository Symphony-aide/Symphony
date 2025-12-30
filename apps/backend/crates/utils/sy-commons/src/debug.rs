//! Loud Smart Duck Debugging utilities
//!
//! This module provides the `duck!` macro for temporary, loud debugging output
//! that is only active in debug builds and follows a consistent format for
//! easy searching and removal.

/// Loud Smart Duck Debugging macro
///
/// This macro provides temporary debugging output that:
/// - Only works in debug builds (not in --release)
/// - Uses a consistent `[DUCK DEBUGGING]` prefix for easy searching
/// - Can be easily found and removed with `grep "[DUCK DEBUGGING]"`
/// - Supports format strings like `println!`
///
/// # Examples
///
/// ```rust
/// use sy_commons::debug::duck;
///
/// fn process_user(user_id: u64) {
///     duck!("Processing user with ID: {}", user_id);
///     
///     // ... processing logic ...
///     
///     duck!("User processing completed successfully");
/// }
/// ```
///
/// # Usage Rules
///
/// - ✅ **DO** use for temporary debugging during development
/// - ✅ **DO** remove before committing to production
/// - ✅ **DO** use instead of `println!`, `eprintln!`, or `log::debug!`
/// - ❌ **DON'T** use for permanent logging (use proper logging instead)
/// - ❌ **DON'T** leave in production code
///
/// # Searching and Removal
///
/// To find all duck debugging statements:
/// ```bash
/// grep -r "\[DUCK DEBUGGING\]" .
/// ```
///
/// To remove all duck debugging statements:
/// ```bash
/// grep -r "duck!" . --include="*.rs" | cut -d: -f1 | sort -u
/// ```
#[macro_export]
macro_rules! duck {
    ($($arg:tt)*) => {
        #[cfg(debug_assertions)]
        {
            eprintln!("[DUCK DEBUGGING]: {}", format!($($arg)*));
        }
    };
}

// Re-export the macro for easier access
pub use crate::duck;

#[cfg(test)]
mod tests {
	#[test]
	fn test_duck_macro_compiles() {
		// This test just ensures the macro compiles correctly
		duck!("Test message");
		duck!("Test with format: {}", 42);
		duck!("Test with multiple args: {} and {}", "hello", "world");
	}

	#[test]
	fn test_duck_macro_debug_only() {
		// In debug builds, this should compile and potentially output
		// In release builds, this should compile but do nothing
		duck!("This should only appear in debug builds");

		// The macro should not cause compilation errors in either case
		assert!(true);
	}
}
