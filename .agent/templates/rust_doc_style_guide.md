# Rust Documentation Style Guide

A comprehensive guide for consistent, high-quality documentation across your Rust workspace.

---

## Core Principles

### 1. **Always Use `///` for Public Items**
- Use `///` (triple slash) for all public items - these become part of the generated documentation
- Regular `//` comments are ONLY for internal implementation details in private code
- If an item is public, it should be documented - rarely does anyone complain about too much documentation

### 2. **Never Hold Back on Explanations**
- If something needs explanation, explain it thoroughly using `///`
- Good documentation requires writing to a novice perspective, even if you have expertise in the subject
- Don't assume users know what you know - be explicit and clear

### 3. **Module-Level Documentation with `//!`**
- Use `//!` comments for module-level documentation that appears at the top of the module
- Place at the very beginning of the file (usually after `use` statements if documenting `lib.rs`)

---

## Required Documentation Structure

### Standard Order for All Items

Each documented item should follow this structure:

1. **Summary line** (required)
2. **Detailed description** (if needed)
3. **Special sections** (as applicable)
4. **Code examples** (at least one for public APIs)
5. **Additional advanced explanations** (optional)

---

## Summary Lines

### Rules for Summary Lines

The summary line should be the first line before any empty line, and it appears in search results and module overviews

**For modules, structs, traits, enums:**
- Start with a noun, NOT a verb
- Don't repeat the item name in the summary
- Keep it to one line when possible

```rust
/// Configuration options for database connections
pub struct DbConfig { ... }

// ❌ BAD: "Contains configuration options..." (starts with verb)
// ❌ BAD: "DbConfig holds configuration..." (repeats name)
```

**For functions and methods:**
- Start with a third-person singular verb like "Returns", "Creates", "Calculates"
- Don't start with "This method" or "This function"

```rust
/// Creates a new database connection with the given credentials
pub fn connect(url: &str) -> Result<Connection> { ... }

// ❌ BAD: "This function creates..." (starts with "This function")
// ❌ BAD: "Connect to a database..." (imperative form)
```

---

## Special Documentation Sections

Use heading level 1 (single `#`) for these standard sections:

### `# Examples` (Critical)

- Code examples are one of the most effective ways to demonstrate usage and are automatically tested by `cargo test`
- Provide at least one copy-pasteable example for every public item
- Keep examples minimal and self-contained

```rust
/// Parses a configuration file from the given path
///
/// Returns a `Config` struct populated with values from the file.
///
/// # Examples
///
/// ```
/// use my_crate::parse_config;
///
/// let config = parse_config("config.toml")?;
/// assert_eq!(config.port, 8080);
/// ```
pub fn parse_config(path: &str) -> Result<Config> { ... }
```

### `# Errors`

- If your function returns `Result<T, E>`, describe the conditions under which it returns `Err(E)`
- Use doc links to reference specific error types

```rust
/// Reads a file and returns its contents
///
/// # Errors
///
/// Returns [`std::io::Error`] if:
/// - The file doesn't exist
/// - The process lacks read permissions
/// - An I/O error occurs during reading
pub fn read_file(path: &Path) -> Result<String, std::io::Error> { ... }
```

### `# Panics`

- If your function can panic, documenting it is very important - panics are programming errors that kill threads
- Document calls to `.unwrap()`, `debug_assert!`, `panic!`, etc.

```rust
/// Calculates the average of a slice of numbers
///
/// # Panics
///
/// Panics if the slice is empty (division by zero).
pub fn average(numbers: &[f64]) -> f64 {
    numbers.iter().sum::<f64>() / numbers.len() as f64
}
```

### `# Safety`

- If your function is `unsafe`, explain which invariants the caller is responsible for upholding
- Be explicit about what is "unsafe" and specify undefined behavior if applicable

```rust
/// Reads data from a raw pointer without bounds checking
///
/// # Safety
///
/// The caller must ensure:
/// - `ptr` is valid and properly aligned
/// - `ptr` points to `len` consecutive, initialized values
/// - The memory is not mutated during the lifetime `'a`
pub unsafe fn read_raw<'a>(ptr: *const u8, len: usize) -> &'a [u8] { ... }
```

### Other Common Sections

- `# Arguments` - Detailed parameter descriptions (use when not obvious)
- `# Returns` - Detailed return value description
- `# Performance` - Time/space complexity notes
- `# See Also` - Related functions or types

---

## Module-Level Documentation

Module-level documentation should provide a high-level summary of everything in the module

```rust
//! Database connection and query utilities
//!
//! This module provides functionality for:
//! - Establishing database connections
//! - Executing SQL queries safely
//! - Managing connection pools
//!
//! # Examples
//!
//! ```
//! use my_crate::db;
//!
//! let conn = db::connect("postgresql://localhost/mydb")?;
//! let users = conn.query("SELECT * FROM users")?;
//! ```

use std::sync::Arc;
// ... rest of module
```

---

## Code Example Best Practices

### Make Examples Testable

Code blocks marked with `rust` are automatically compiled and tested by rustdoc

```rust
/// ```
/// use my_crate::Config;
///
/// let config = Config::new();
/// assert_eq!(config.timeout, 30);
/// ```
```

### When to Use Special Attributes

- Use `no_run` for examples that compile but shouldn't execute (e.g., network calls)
- Use `ignore` sparingly - only for platform-specific or environment-dependent code
- Use `compile_fail` to demonstrate what doesn't work

```rust
/// ```no_run
/// // This compiles but won't run in tests
/// let server = Server::bind("0.0.0.0:8080")?;
/// server.run().await?;
/// ```

/// ```compile_fail
/// // This example shows what doesn't compile
/// let x: u32 = "not a number"; // Type error
/// ```
```

---

## Formatting Guidelines

### Use Markdown Features

Rustdoc supports Markdown for formatting - use headings, lists, code, etc.

```rust
/// Processes data with various options
///
/// Supports the following operations:
/// - **Filtering**: Remove unwanted entries
/// - **Mapping**: Transform values
/// - **Sorting**: Order by specified field
///
/// Use `Option::None` to skip a step.
```

### Code References

Use backticks for inline code and proper linking:

```rust
/// Converts a `String` to [`Cow<str>`](std::borrow::Cow)
///
/// See also [`to_uppercase`](String::to_uppercase) for case conversion
```

### Line Length

- Keep documentation lines under 100-120 characters
- This improves readability in side-by-side diffs

---

## What NOT to Document

### Don't Document

1. **Type information already in signatures** - The type system already defines what types a function passes and returns
2. **Obvious implementations** - Don't just restate what the code does
3. **Private implementation details in public docs** - Use regular `//` comments for internal notes

```rust
// ❌ BAD: Redundant with signature
/// Takes a String and returns a String
pub fn process(input: String) -> String { ... }

// ✅ GOOD: Explains behavior and purpose
/// Normalizes whitespace by replacing all sequences of whitespace
/// characters with a single space
pub fn process(input: String) -> String { ... }
```

---

## File Organization Template

Here's a recommended template for a typical Rust file:

```rust
//! Module-level documentation here
//!
//! Explain the module's purpose, main types, and how they work together.
//!
//! # Examples
//!
//! ```
//! // Module-level example showing typical usage
//! ```

// Standard library imports
use std::collections::HashMap;
use std::sync::Arc;

// External crate imports
use serde::{Deserialize, Serialize};

// Internal imports
use crate::error::Error;

// Private constants (with // comments if needed)
const DEFAULT_TIMEOUT: u64 = 30;

/// Public struct with full documentation
///
/// Detailed description of what this represents and when to use it.
///
/// # Examples
///
/// ```
/// use my_crate::Config;
///
/// let config = Config::default();
/// ```
#[derive(Debug, Clone)]
pub struct Config {
    /// Port number for the server
    ///
    /// Defaults to 8080 if not specified.
    pub port: u16,
    
    /// Connection timeout in seconds
    pub timeout: u64,
}

impl Config {
    /// Creates a new configuration with default values
    ///
    /// # Examples
    ///
    /// ```
    /// use my_crate::Config;
    ///
    /// let config = Config::new();
    /// assert_eq!(config.port, 8080);
    /// ```
    pub fn new() -> Self {
        Self {
            port: 8080,
            timeout: DEFAULT_TIMEOUT,
        }
    }
    
    // Private helper method - use // for internal notes
    fn validate(&self) -> bool {
        // Check if port is in valid range
        self.port > 0
    }
}

// Private functions use // comments
// This is only called internally
fn internal_helper() {
    // Implementation details here
}

/// Public function with full documentation
///
/// # Arguments
///
/// * `input` - The string to process
/// * `options` - Configuration options
///
/// # Returns
///
/// Returns the processed string with applied transformations.
///
/// # Errors
///
/// Returns [`Error::InvalidInput`] if the input contains invalid characters.
///
/// # Examples
///
/// ```
/// use my_crate::{process, Config};
///
/// let result = process("hello", &Config::new())?;
/// assert_eq!(result, "HELLO");
/// ```
pub fn process(input: &str, options: &Config) -> Result<String, Error> {
    // Implementation here
    Ok(input.to_uppercase())
}

#[cfg(test)]
mod tests {
    use super::*;
    
    // Tests use // comments since they're not public API
    #[test]
    fn test_config_creation() {
        let config = Config::new();
        assert_eq!(config.port, 8080);
    }
}
```

---

## Checklist for Every File

Before committing, verify:

- [ ] All public items have `///` documentation
- [ ] Each public item has a clear summary line
- [ ] Functions starting with verbs, structs/modules with nouns
- [ ] At least one `# Examples` section for public APIs
- [ ] `# Errors` section for functions returning `Result`
- [ ] `# Panics` section for functions that can panic
- [ ] `# Safety` section for unsafe functions
- [ ] Code examples compile and pass `cargo test`
- [ ] Private/internal code uses `//` comments, not `///`
- [ ] Module has `//!` documentation at the top
- [ ] No placeholder or TODO documentation in public APIs

---

## Testing Documentation

Run `cargo test` to verify all documentation examples compile and run correctly

```bash
# Test all documentation examples
cargo test --doc

# Build and open documentation
cargo doc --open

# Test everything including doctests
cargo test
```

---

## Additional Resources

- [The rustdoc Book](https://doc.rust-lang.org/rustdoc/)
- [RFC 1574: API Documentation Conventions](https://rust-lang.github.io/rfcs/1574-more-api-documentation-conventions.html)
- [The Rust Book: Documentation](https://doc.rust-lang.org/book/ch14-02-publishing-to-crates-io.html#making-useful-documentation-comments)
