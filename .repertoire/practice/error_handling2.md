# Rust Error Handling: DO's and DON'Ts Guide for Symphony

## General Principles

### ✅ DO: Use `Result<T, E>` for recoverable errors

**Explanation:** Operations that can fail in expected ways (I/O, parsing, network) should return `Result` to allow callers to handle errors gracefully.

**Example:**
```rust
use sy_commons::{error, SymphonyError};

fn read_config(path: &str) -> Result<Config, SymphonyError> {
    let contents = std::fs::read_to_string(path)
        .map_err(|e| SymphonyError::Io { 
            source: e, 
            context: Some(format!("Failed to read config file: {}", path)) 
        })?;
    parse_config(&contents)
}

// Caller can handle the error
match read_config("config.toml") {
    Ok(config) => info!("Loaded config successfully"),
    Err(e) => error!("Failed to load config: {}", e),
}
```

**Why:** This prevents crashes, enables retry logic, and provides clear error information to users.

---

### ❌ DON'T: Use `unwrap()` or `expect()` in production code

**Explanation:** These methods panic when encountering errors, causing your application to crash instead of handling failures gracefully.

**Example:**
```rust
use sy_commons::{warn, SymphonyError};

// ❌ BAD - Will crash if file doesn't exist
let contents = std::fs::read_to_string("data.txt").unwrap();

// ✅ GOOD - Handles error gracefully with Symphony logging
let contents = match std::fs::read_to_string("data.txt") {
    Ok(content) => Some(content),
    Err(e) => {
        warn!("Failed to read file 'data.txt': {}", e);
        None
    }
};
```

**Why:** The 2024 Cloudflare outage was caused by a single `unwrap()` on an empty vector, disrupting services globally for hours.

---

### ✅ DO: Add context when propagating errors

**Explanation:** Wrap errors with additional information (file paths, user IDs, operation details) to make debugging easier using Symphony's error system.

**Example:**
```rust
use sy_commons::{SymphonyError, error};
use std::fs::File;
use std::io::Read;

fn load_user_data(user_id: u64) -> Result<String, SymphonyError> {
    let path = format!("/data/user_{}.json", user_id);
    
    let mut file = File::open(&path)
        .map_err(|e| SymphonyError::Io {
            source: e,
            context: Some(format!("Failed to open user file for user_id: {}", user_id)),
        })?;
    
    let mut contents = String::new();
    file.read_to_string(&mut contents)
        .map_err(|e| SymphonyError::Io {
            source: e,
            context: Some(format!("Failed to read user {} data from: {}", user_id, path)),
        })?;
    
    Ok(contents)
}
```

**Why:** Context-rich errors make debugging production issues significantly faster by showing exactly what operation failed and with what data.

---

### ✅ DO: Use `Option<T>` for values that may be absent without error

**Explanation:** When a value might legitimately not exist (like a missing map key), use `Option` instead of `Result`.

**Example:**
```rust
use sy_commons::{info, duck};
use std::collections::HashMap;

fn get_cache_value(cache: &HashMap<String, String>, key: &str) -> Option<String> {
    cache.get(key).cloned()
}

// Usage
if let Some(value) = get_cache_value(&cache, "user_token") {
    info!("Token found in cache for key: {}", "user_token");
} else {
    duck!("Token not in cache for key: {}, fetching from DB...", "user_token");
}
```

**Why:** `Option` clearly communicates that absence is normal and expected, not an error condition requiring error handling.

---

## Custom Error Types

### ✅ DO: Define custom error types with meaningful variants

**Explanation:** Create enums that represent different error cases in your domain with `thiserror` for automatic trait implementations. Use Symphony's error system as the base.

**Example:**
```rust
use sy_commons::SymphonyError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum DatabaseError {
    #[error("Connection failed: {0}")]
    ConnectionFailed(String),
    
    #[error("Query timeout after {timeout_ms}ms")]
    QueryTimeout { timeout_ms: u64 },
    
    #[error("User {user_id} not found")]
    UserNotFound { user_id: u64 },
    
    #[error("Symphony error: {0}")]
    Symphony(#[from] SymphonyError),
}

fn fetch_user(id: u64) -> Result<User, DatabaseError> {
    // Returns specific error variants
    if id == 0 {
        return Err(DatabaseError::UserNotFound { user_id: id });
    }
    // ...
}
```

**Why:** Typed errors enable callers to handle specific cases differently, improve code documentation, and make error patterns exhaustive and type-safe.

---

### ❌ DON'T: Use string-based errors in libraries

**Explanation:** String errors lose type information and make it impossible for callers to handle specific cases programmatically. Use Symphony's structured error types instead.

**Example:**
```rust
use sy_commons::SymphonyError;

// ❌ BAD - Caller can't distinguish error types
fn process_data(data: &str) -> Result<Value, String> {
    if data.is_empty() {
        return Err("Data is empty".to_string());
    }
    if data.len() > 1000 {
        return Err("Data too large".to_string());
    }
    // ...
}

// ✅ GOOD - Typed errors enable specific handling
#[derive(Debug)]
enum ProcessError {
    EmptyData,
    DataTooLarge { size: usize, max: usize },
}

impl From<ProcessError> for SymphonyError {
    fn from(err: ProcessError) -> Self {
        match err {
            ProcessError::EmptyData => SymphonyError::Validation {
                message: "Input data cannot be empty".to_string(),
                field: Some("data".to_string()),
            },
            ProcessError::DataTooLarge { size, max } => SymphonyError::Validation {
                message: format!("Data size {} exceeds maximum {}", size, max),
                field: Some("data".to_string()),
            },
        }
    }
}

fn process_data(data: &str) -> Result<Value, ProcessError> {
    if data.is_empty() {
        return Err(ProcessError::EmptyData);
    }
    if data.len() > 1000 {
        return Err(ProcessError::DataTooLarge { 
            size: data.len(), 
            max: 1000 
        });
    }
    // ...
}
```

**Why:** Typed errors allow pattern matching, better IDE support, and prevent fragile string parsing in error handlers.

---

## Error Propagation

### ✅ DO: Use the `?` operator for clean error propagation

**Explanation:** The `?` operator automatically propagates errors up the call stack while maintaining readability.

**Example:**
```rust
use std::fs::File;
use std::io::{self, Read};

fn read_username_from_file(path: &str) -> io::Result<String> {
    let mut file = File::open(path)?;
    let mut username = String::new();
    file.read_to_string(&mut username)?;
    Ok(username.trim().to_string())
}
```

**Why:** This replaces verbose `match` statements, reduces boilerplate, and makes the happy path clear while automatically handling errors.

---

### ❌ DON'T: Ignore `Result` or `Option` values

**Explanation:** Silently discarding results can hide critical failures. Use Symphony's logging system to handle errors appropriately.

**Example:**
```rust
use sy_commons::{warn, duck};

// ❌ BAD - Error is silently ignored
let _ = std::fs::remove_file("temp.txt");

// ✅ GOOD - Handle or at least log the error with Symphony logging
if let Err(e) = std::fs::remove_file("temp.txt") {
    warn!("Failed to delete temp file 'temp.txt': {}", e);
}

// ✅ ALSO GOOD - Explicitly acknowledge we don't care with duck debugging
let _ = std::fs::remove_file("temp.txt"); 
duck!("Temp file cleanup is best-effort, ignoring result");
```

**Why:** Silent failures lead to mysterious bugs. If you truly don't care about an error, add a comment or duck debug explaining why.

---

## Panic Guidelines

### ✅ DO: Panic only for programmer errors and invariant violations

**Explanation:** Use panics for bugs in your code logic that should never occur in correct programs.

**Example:**
```rust
struct BoundedVec<T> {
    items: Vec<T>,
    max_size: usize,
}

impl<T> BoundedVec<T> {
    fn push(&mut self, item: T) -> Result<(), &'static str> {
        if self.items.len() >= self.max_size {
            return Err("BoundedVec is full");
        }
        self.items.push(item);
        Ok(())
    }
    
    fn get(&self, index: usize) -> Option<&T> {
        self.items.get(index)
    }
    
    // Internal method where invariant should hold
    fn internal_get(&self, index: usize) -> &T {
        assert!(index < self.items.len(), 
            "Internal invariant violated: index {} >= length {}", 
            index, self.items.len());
        &self.items[index]
    }
}
```

**Why:** Panics catch logic errors during development and testing while recoverable errors handle runtime issues gracefully.

---

### ❌ DON'T: Chain multiple `unwrap()` calls

**Explanation:** Multiple unwraps create fragile code where any failure causes a cascade of crashes.

**Example:**
```rust
// ❌ BAD - Multiple panic points
let value = data.get("key").unwrap().parse::<i32>().unwrap();

// ✅ GOOD - Explicit handling with context
let value = data.get("key")
    .ok_or("Missing 'key' field")?
    .parse::<i32>()
    .map_err(|e| format!("Invalid number in 'key': {}", e))?;
```

**Why:** Each `unwrap()` is a potential crash. Proper error handling provides better error messages and recovery options.

---

### ✅ DO: Use `expect()` with descriptive messages when panics are intentional

**Explanation:** When a panic is appropriate, document why with `expect()` to aid debugging.

**Example:**
```rust
// In main() where startup failures should crash
fn main() {
    let config = load_config()
        .expect("Failed to load config.toml - application cannot start");
    
    let db = connect_database(&config.db_url)
        .expect("Database connection required for startup");
    
    // ...
}

// Hardcoded values that should always work
fn parse_internal_config() -> AppConfig {
    let json = r#"{"version": "1.0"}"#;
    serde_json::from_str(json)
        .expect("Internal config JSON is malformed - this is a bug")
}
```

**Why:** Descriptive messages help developers understand what went wrong and why the panic was expected to never happen.

---

## Testing Context

### ✅ DO: Use `unwrap()` and `expect()` freely in tests

**Explanation:** Tests are isolated and should fail fast when assertions don't hold.

**Example:**
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_user_creation() {
        let user = User::new("alice", 30).unwrap();
        assert_eq!(user.name, "alice");
        assert_eq!(user.age, 30);
    }
    
    #[test]
    #[should_panic(expected = "age must be positive")]
    fn test_invalid_age_panics() {
        User::new("bob", -5).unwrap();
    }
}
```

**Why:** Tests are meant to catch bugs quickly. Panicking on unexpected conditions is the correct behavior in test code.

---

### ✅ DO: Test both success and error paths

**Explanation:** Comprehensive testing includes verifying that errors are returned correctly.

**Example:**
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_valid_json() {
        let result = parse_json(r#"{"name": "Alice"}"#);
        assert!(result.is_ok());
    }
    
    #[test]
    fn test_parse_invalid_json_returns_error() {
        let result = parse_json("{invalid}");
        assert!(result.is_err());
        
        match result {
            Err(ParseError::InvalidSyntax { .. }) => { /* Expected */ }
            _ => panic!("Expected InvalidSyntax error"),
        }
    }
    
    #[test]
    fn test_empty_input_returns_error() {
        assert!(matches!(parse_json(""), Err(ParseError::EmptyInput)));
    }
}
```

**Why:** Error paths are often overlooked but are critical for reliability. Testing them ensures your error handling actually works.

---

## Production Systems

### ✅ DO: Register panic hooks for logging before crashes

**Explanation:** Capture panic information in production for debugging while avoiding logging overhead in the normal case. Use Symphony's logging system for structured panic reporting.

**Example:**
```rust
use sy_commons::{error, duck};
use std::panic;

fn setup_panic_handler() {
    panic::set_hook(Box::new(|panic_info| {
        let location = panic_info.location()
            .map(|l| format!("{}:{}:{}", l.file(), l.line(), l.column()))
            .unwrap_or_else(|| "unknown location".to_string());
        
        let message = if let Some(s) = panic_info.payload().downcast_ref::<&str>() {
            s.to_string()
        } else if let Some(s) = panic_info.payload().downcast_ref::<String>() {
            s.clone()
        } else {
            "unknown panic payload".to_string()
        };
        
        // Use Symphony's error logging instead of eprintln!
        error!("PANIC at {}: {}", location, message);
        duck!("Panic hook captured: location={}, message={}", location, message);
        
        // Send to monitoring service
        // send_to_sentry(&location, &message);
    }));
}

fn main() {
    setup_panic_handler();
    // Rest of application
}
```

**Why:** Panic hooks let you log, report to monitoring tools (Sentry, DataDog), and capture backtraces before the process terminates.

---

### ✅ DO: Implement retry logic for transient errors

**Explanation:** Network and database operations can fail temporarily; retrying with backoff improves reliability.

**Example:**
```rust
use std::time::Duration;
use std::thread;

fn fetch_with_retry<T, E, F>(
    mut operation: F,
    max_retries: u32,
) -> Result<T, E>
where
    F: FnMut() -> Result<T, E>,
{
    let mut attempt = 0;
    loop {
        match operation() {
            Ok(result) => return Ok(result),
            Err(e) if attempt >= max_retries => return Err(e),
            Err(_) => {
                attempt += 1;
                let delay = Duration::from_millis(100 * 2_u64.pow(attempt));
                thread::sleep(delay);
            }
        }
    }
}

// Usage
let data = fetch_with_retry(
    || fetch_from_api("https://api.example.com/data"),
    3
)?;
```

**Why:** Transient failures (network glitches, temporary service unavailability) are common in distributed systems. Retries improve success rates.

---

### ❌ DON'T: Use `catch_unwind` as a general error handling mechanism

**Explanation:** `catch_unwind` is for FFI boundaries and isolation, not regular error flow.

**Example:**
```rust
use std::panic::catch_unwind;

// ❌ BAD - Abusing catch_unwind
fn risky_operation(data: &str) -> Result<Value, Box<dyn std::any::Any + Send>> {
    catch_unwind(|| {
        data.parse().unwrap() // Still bad even when caught
    })
}

// ✅ GOOD - Proper error handling
fn risky_operation(data: &str) -> Result<Value, ParseError> {
    data.parse()
        .map_err(|e| ParseError::InvalidFormat(e))
}
```

**Why:** `catch_unwind` is unreliable (doesn't work with `panic=abort`), adds overhead, and masks real bugs. Use `Result` for expected errors.

---

## Library vs Application Code

### ✅ DO: Always return `Result` in library code

**Explanation:** Libraries should never panic on user input; let calling code decide how to handle errors.

**Example:**
```rust
// Library crate
pub enum ValidationError {
    TooShort { min: usize, actual: usize },
    InvalidCharacters,
}

pub fn validate_username(username: &str) -> Result<(), ValidationError> {
    if username.len() < 3 {
        return Err(ValidationError::TooShort {
            min: 3,
            actual: username.len(),
        });
    }
    
    if !username.chars().all(|c| c.is_alphanumeric() || c == '_') {
        return Err(ValidationError::InvalidCharacters);
    }
    
    Ok(())
}
```

**Why:** Library panics crash the entire application without giving callers a chance to recover or provide user feedback.

---

### ✅ DO: Convert library errors to user-friendly messages in applications

**Explanation:** Applications handle errors at boundaries, converting technical errors to user-appropriate messages using Symphony's logging system.

**Example:**
```rust
// Application code
use sy_commons::{info, error};
use my_lib::{validate_username, ValidationError};

fn handle_user_registration(username: &str) {
    match validate_username(username) {
        Ok(()) => {
            info!("Username validation successful for: {}", username);
        }
        Err(ValidationError::TooShort { min, actual }) => {
            error!("Username validation failed - too short: need {} chars, got {}", min, actual);
            // Show user-friendly message to UI
            show_user_message(&format!(
                "Username too short. Need at least {} characters, got {}.", 
                min, actual
            ));
        }
        Err(ValidationError::InvalidCharacters) => {
            error!("Username validation failed - invalid characters: {}", username);
            // Show user-friendly message to UI
            show_user_message("Username can only contain letters, numbers, and underscores.");
        }
    }
}
```

**Why:** Applications bridge the gap between technical error details and user-facing messaging, improving user experience.

---

## Logging and Observability

### ✅ DO: Use structured logging with context

**Explanation:** Include relevant context in logs to make debugging production issues easier. Symphony provides auto-initializing structured logging.

**Example:**
```rust
use sy_commons::{error, info, duck};

// Symphony's logging macros provide structured logging automatically
fn process_payment(user_id: u64, amount: f64) -> Result<PaymentId, PaymentError> {
    info!("Processing payment for user_id: {}, amount: ${:.2}", user_id, amount);
    
    let result = charge_card(user_id, amount);
    
    match result {
        Ok(payment_id) => {
            info!("Payment successful - payment_id: {:?}, user_id: {}, amount: ${:.2}", 
                payment_id, user_id, amount);
            Ok(payment_id)
        }
        Err(e) => {
            error!("Payment failed - error: {:?}, user_id: {}, amount: ${:.2}", 
                e, user_id, amount);
            duck!("Payment failure details: user={}, amount={}, error={:?}", 
                user_id, amount, e);
            Err(e)
        }
    }
}
```

**Why:** Structured logs with context make it easy to filter, search, and correlate events in production systems using tools like ELK, DataDog, or Honeycomb.

---

### ✅ DO: Use Symphony's error system for application errors with context

**Explanation:** Symphony provides `SymphonyError` with automatic context support and structured logging integration.

**Example:**
```rust
use sy_commons::{SymphonyError, ResultContext, info, error};

fn load_config() -> Result<Config, SymphonyError> {
    let path = "config.toml";
    let contents = std::fs::read_to_string(path)
        .context(&format!("Failed to read config file '{}'", path))?;
    
    let config: Config = toml::from_str(&contents)
        .map_err(|e| SymphonyError::Configuration {
            message: format!("Failed to parse config file: {}", e),
            file: Some(std::path::PathBuf::from(path)),
        })?;
    
    info!("Configuration loaded successfully from: {}", path);
    Ok(config)
}

fn main() -> Result<(), SymphonyError> {
    match load_config() {
        Ok(config) => {
            info!("Application starting with loaded config");
            Ok(())
        }
        Err(e) => {
            error!("Failed to start application: {}", e);
            Err(e)
        }
    }
}
```

**Why:** Symphony's error system integrates with the logging framework, provides structured error context, and maintains consistency across the codebase.

---

## Panic Strategies

### ✅ DO: Use `panic = "unwind"` for better debuggability

**Explanation:** Unwinding allows destructors to run, resources to be cleaned up, and panics to be caught for recovery.

**Example:**
```toml
# Cargo.toml
[profile.release]
panic = "unwind"
```

**Why:** Unwinding enables `Drop` implementations to run, allows `catch_unwind` for FFI isolation, and provides better debugging with stack traces. This is the default and recommended for most applications.

---

### ✅ DO: Use `panic = "abort"` for embedded or size-critical systems

**Explanation:** Aborting reduces binary size by 10-20% and eliminates unwinding overhead.

**Example:**
```toml
# Cargo.toml for embedded system
[profile.release]
panic = "abort"
opt-level = "z"  # Optimize for size
```

**Why:** In embedded systems with limited memory or where panics should immediately halt the system, abort is appropriate. Also useful for performance-critical production services where panic is considered fatal anyway.

---

## CI/CD Integration

### ✅ DO: Enforce Clippy lints in continuous integration

**Explanation:** Catch error handling issues before they reach production by running Clippy in your CI pipeline.

**Example:**
```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  clippy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
          components: clippy
      - name: Run Clippy
        run: cargo clippy -- -D warnings -D clippy::unwrap_used -D clippy::expect_used
```

**Why:** Automated checks prevent panic-prone code from being merged, enforcing team standards consistently.

---

### ✅ DO: Audit for `unwrap()` and `expect()` in production code

**Explanation:** Create custom CI checks to flag any unwrap/expect usage outside of test code.

**Example:**
```bash
#!/bin/bash
# scripts/check_unwraps.sh

# Find unwrap/expect in non-test source files
if git grep -n "\.unwrap()" -- "src/**/*.rs" ":(exclude)**/tests/**" ":(exclude)**/*test*.rs"; then
    echo "ERROR: Found .unwrap() in production code"
    exit 1
fi

if git grep -n "\.expect(" -- "src/**/*.rs" ":(exclude)**/tests/**" ":(exclude)**/*test*.rs"; then
    echo "ERROR: Found .expect() in production code"
    exit 1
fi

echo "✓ No unwrap/expect found in production code"
```

**Why:** Automated enforcement prevents the error handling practices that caused incidents like the Cloudflare outage.

---

## Enterprise Best Practices

### ✅ DO: Implement error stacking with trace IDs for distributed systems

**Explanation:** In microservices, propagate trace IDs through error chains for end-to-end debugging.

**Example:**
```rust
use uuid::Uuid;

#[derive(Debug)]
struct AppError {
    trace_id: Uuid,
    context: Vec<String>,
    source: Box<dyn std::error::Error>,
}

impl AppError {
    fn new(source: impl std::error::Error + 'static) -> Self {
        Self {
            trace_id: Uuid::new_v4(),
            context: Vec::new(),
            source: Box::new(source),
        }
    }
    
    fn with_context(mut self, ctx: String) -> Self {
        self.context.push(ctx);
        self
    }
}

fn service_a() -> Result<(), AppError> {
    service_b()
        .map_err(|e| e.with_context("Service A: Failed to call Service B".into()))?;
    Ok(())
}
```

**Why:** Trace IDs let you correlate logs across services, and context stacking shows the full error propagation path.

---

### ✅ DO: Create organization-wide error handling guidelines

**Explanation:** Document error handling standards for consistency across teams and codebases.

**Example:**
```markdown
# Team Error Handling Guidelines

## Production Code
- Never use `unwrap()` or `expect()` outside of `main()` startup
- All library functions must return `Result`
- Use `thiserror` for custom error types
- Include trace IDs in all errors

## Testing
- `unwrap()` and `expect()` are acceptable
- Test all error variants
- Use `#[should_panic]` for invariant checks

## CI Requirements
- Clippy must pass with `-D warnings`
- No panics allowed in PR diffs (except tests)
- Error coverage must be >80%
```

**Why:** Clear guidelines prevent inconsistencies, reduce code review friction, and establish a reliability culture.

---

## Summary Checklist

### Quick Reference for Code Reviews

**🔍 Questions to ask:**
- Does this code handle all possible error cases?
- Are errors propagated with sufficient context using Symphony's error system?
- Could this panic in production? If so, is it intentional and documented?
- Are error types appropriate for the code's role (library vs application)?
- Can users understand and act on these error messages?
- Are all error paths tested?
- Is Symphony's logging system used consistently for error reporting?

**✅ Must have:**
- `Result` or `Option` for all fallible operations
- Custom error types with `thiserror` or Symphony's `SymphonyError`
- Context added when propagating errors using `ResultContext`
- Symphony logging (`error!`, `warn!`, `info!`, `duck!`) for error conditions
- Tests covering both happy and error paths
- Structured error information with relevant context

**❌ Must not have:**
- `unwrap()` or `expect()` in production code paths
- Panics for recoverable errors
- String-based errors in libraries (use `SymphonyError` instead)
- Ignored `Result` values without justification
- `eprintln!` or `println!` for error reporting (use Symphony logging)
- Errors without context or trace information

### Symphony-Specific Error Handling Guidelines

**✅ Symphony Best Practices:**
- Use `sy_commons::{error, warn, info, duck}` for all logging
- Leverage `SymphonyError` for consistent error types across the codebase
- Use `ResultContext` trait for adding context to errors
- Implement `From` traits to convert custom errors to `SymphonyError`
- Use `duck!()` for temporary debugging instead of `debug!()` macro
- Configure logging through TOML files and environment variables
- Test error paths with Symphony's logging system

**🔧 Configuration:**
- Set up logging configuration in `config/default.toml`
- Use environment-specific overrides in `config/{env}.toml`
- Override settings with `SYMPHONY_*` environment variables
- Enable file and JSON logging for production environments
- Use `duck_debugging = true` in development configurations