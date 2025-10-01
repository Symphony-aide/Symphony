---
trigger: glob
description: apps/backend/**/*.rs
globs: apps/backend/**/tests/*.rs
---

## Error Handling Best Practices

### Use Result for Recoverable Errors
- Return `Result<T, E>` for operations that can fail
- Use `Option<T>` for values that may or may not exist
- Don't use `panic!` for expected error conditions
- Use `panic!` only for unrecoverable programmer errors
- Propagate errors with `?` operator

### Custom Error Types
- Define custom error types with `thiserror` derive macro
- Use enums to represent different error variants
- Implement `std::error::Error` trait for error types
- Add context to errors with `#[error("message: {0}")]` attributes
- Group related errors into a single error enum

### Error Propagation
- Use `?` operator for concise error propagation
- Don't use `.unwrap()` or `.expect()` in library code
- Use `.expect("message")` only when you can prove it won't fail
- Use `.context()` from `anyhow` to add error context
- Chain errors to preserve the error stack

### Error Conversion
- Implement `From<OtherError>` for automatic conversion
- Use `?` with different error types via `From` trait
- Use `map_err()` for manual error conversion
- Use `anyhow::Error` for application code with mixed errors
- Use specific error types for library code

### Library vs Application Errors
- Libraries: Use specific error types, don't use `anyhow`
- Applications: Use `anyhow::Error` for convenience
- Libraries: Implement `std::error::Error` and `Display`
- Applications: Focus on error messages for users
- Libraries: Don't lose error information in conversions

## Testing Strategies

### Unit Testing
- Write tests for all public functions
- Test edge cases and boundary conditions
- Use `#[cfg(test)]` module for test-only code
- Place tests in the same file or in `tests` submodule
- Use descriptive test names: `test_user_creation_with_valid_email()`

### Test Organization
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_success_case() {
        // Arrange
        let input = "valid";
        
        // Act
        let result = process(input);
        
        // Assert
        assert!(result.is_ok());
    }

    #[test]
    #[should_panic(expected = "invalid input")]
    fn test_panic_case() {
        process_panicking("");
    }
}
```