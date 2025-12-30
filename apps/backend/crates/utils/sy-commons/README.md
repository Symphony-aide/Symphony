# Symphony Commons

Common utilities and patterns shared across all Symphony crates. This crate provides centralized error handling, debugging utilities, and extension traits following the Open-Closed Principle.

## Features

- **Centralized Error Handling** - Single `SymphonyError` type with context
- **Duck Debugging** - Loud, temporary debugging with consistent format  
- **Extension Traits** - Add functionality without breaking existing APIs

## Usage

Add this to your `Cargo.toml`:

```toml
[dependencies]
sy-commons = { path = "../path/to/sy-commons" }
```

### Error Handling

```rust
use sy_commons::error::{SymphonyError, ResultContext};

fn read_config() -> Result<String, SymphonyError> {
    std::fs::read_to_string("config.toml")
        .context("Failed to read configuration file")
}

fn process_file(path: &str) -> Result<String, SymphonyError> {
    let content = std::fs::read_to_string(path)
        .context("Failed to read input file")?;
    
    let processed = content.to_uppercase();
    
    std::fs::write("output.txt", &processed)
        .with_context(|| format!("Failed to write output to {}", path))?;
    
    Ok(processed)
}
```

### Duck Debugging

```rust
use sy_commons::duck;

fn process_user(user_id: u64) {
    duck!("Processing user with ID: {}", user_id);
    
    // ... processing logic ...
    
    duck!("User processing completed successfully");
}
```

**Rules for Duck Debugging:**
- ✅ Use for temporary debugging during development
- ✅ Remove before committing to production
- ❌ Don't use for permanent logging
- ❌ Don't leave in production code

**Finding and Removing Duck Statements:**
```bash
# Find all duck debugging statements
grep -r "\[DUCK DEBUGGING\]" .

# Find all duck! macro calls
grep -r "duck!" . --include="*.rs"
```

### Extension Traits

```rust
use sy_commons::extensions::{StringValidation, OptionExt};

// String validation
let email = "user@example.com";
assert!(email.is_valid_email());

let uuid = "550e8400-e29b-41d4-a716-446655440000";
assert!(uuid.is_valid_uuid());

// Option extensions
let some_value = Some(42);
let none_value: Option<i32> = None;

assert_eq!(some_value.unwrap_or_default(), 42);
assert_eq!(none_value.unwrap_or_default(), 0);
```

## Architecture

This crate follows the Open-Closed Principle by providing extension traits that add functionality to existing types without modifying them:

```
sy-commons/
├── error.rs          # Centralized error handling
├── debug.rs          # Duck debugging utilities  
├── extensions.rs     # Extension traits
└── lib.rs            # Public API exports
```

## Error Types

The `SymphonyError` enum provides structured error handling:

- `Validation` - Input validation errors
- `Io` - File system and network I/O errors
- `Serialization` - JSON/serde errors
- `Generic` - Any other error type with context

All errors include contextual information to aid in debugging and error reporting.

## Development Guidelines

### Adding New Extensions

When adding new extension traits:

1. ✅ Follow the Open-Closed Principle
2. ✅ Add comprehensive documentation with examples
3. ✅ Include unit tests for all methods
4. ✅ Document why the extension is needed

### Error Handling Patterns

Always use the context helpers:

```rust
// ✅ Good - adds context
let content = std::fs::read_to_string(path)
    .context("Failed to read configuration file")?;

// ❌ Bad - no context
let content = std::fs::read_to_string(path)?;
```

### Duck Debugging Guidelines

- Only use in debug builds (automatically handled by macro)
- Always use the `[DUCK DEBUGGING]` prefix (automatically added)
- Remove before production deployment
- Use for temporary debugging, not permanent logging

## Testing

Run tests with:

```bash
cargo test -p sy-commons
```

All public APIs include comprehensive tests and documentation examples that are automatically tested by rustdoc.

## License

Licensed under either of

- Apache License, Version 2.0
- MIT License

at your option.