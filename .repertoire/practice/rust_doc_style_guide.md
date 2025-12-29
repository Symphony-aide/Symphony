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

- Code examples are one of the most effective ways to demonstrate usage and are automatically tested by `cargo test --doc` (note: nextest doesn't support doc tests, so `cargo test --doc` is the correct command for documentation tests)


### `# Errors`

- If your function returns `Result<T, E>`, describe the conditions under which it returns `Err(E)`
- Use doc links to reference specific error types

### `# Panics`

- If your function can panic, documenting it is very important - panics are programming errors that kill threads


### `# Safety`

- If your function is `unsafe`, explain which invariants the caller is responsible for upholding
- Be explicit about what is "unsafe" and specify undefined behavior if applicable

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

* **Headings:** `# H1`, `## H2`, `### H3`, etc.
* **Paragraphs & line breaks:** Blank lines create paragraphs, single line breaks are ignored.
* **Emphasis:** `*italic*`, `_italic_`, `**bold**`, `__bold__`, `~~strikethrough~~`.
* **Inline code:** `` `inline_code` ``.
* **Code blocks:** Fenced with triple backticks (`rust`) or indented four spaces, with Rust code blocks treated as doctests.
* **Lists:** Unordered (`- item`) and ordered (`1. item`) with nested items supported.
* **Blockquotes:** `> This is a quote`.
* **Horizontal rules:** `---` or `***`.
* **Links:** `[text](URL)`.
* **Images:** `![alt](URL)` with relative or absolute paths.
* **Tables:** `| Header | Header |` with `|---|---|` separator rows.
* **Intra-doc links:** ``[`Type`]``, ``[`crate::module::Type`]`` automatically link to API items.
* **Doctests:** Fenced Rust code blocks run as tests, with modifiers like `no_run`, `ignore`, `should_panic`, `compile_fail`.
* **Special section headings:** `# Examples`, `# Panics`, `# Errors`, `# Safety`, etc., recognized semantically.
* **HTML:** Limited inline HTML tags like `<b>`, `<br>`, `<sup>`.
* **Footnotes:** Supported with `[^1]` references and `[^1]: Footnote text`.
* **Escaping:** Backslashes `\*` prevent Markdown formatting.


## What NOT to Document

### Don't Document

1. **Type information already in signatures** - The type system already defines what types a function passes and returns
2. **Obvious implementations** - Don't just restate what the code does
3. **Private implementation details in public docs** - Use regular `//` comments for internal notes