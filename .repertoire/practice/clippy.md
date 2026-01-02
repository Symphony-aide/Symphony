# Clippy Best Practices Guide

---

## 📦 Import Management

### ✅ DO - Use Specific Imports

```rust
// CORRECT - Specific imports
use sy_ipc_transport::{
    Connection, StdioConfig, StdioTransport, Transport, TransportError,
};

// CORRECT - Grouped related imports
use std::time::{Duration, Instant};
```

### ❌ DON'T - Use Wildcard Imports

```rust
// WRONG - Wildcard imports (clippy::wildcard_imports)
use sy_ipc_transport::*;
use std::collections::*;
```

### ✅ DO - Platform-Conditional Imports

```rust
// CORRECT - Platform-specific imports
#[cfg(unix)]
use sy_ipc_transport::{UnixSocketConfig, UnixSocketTransport};

#[cfg(feature = "test-utils")]
use sy_ipc_transport::test_utils::factory::{
    BufferSizeTestFactory, TimeoutTestFactory,
};
```

---

## 🎨 String Formatting

### ✅ DO - Use Inline Format Arguments

```rust
// CORRECT - Inline format arguments
println!("Error occurred: {error:?}");
assert!(condition, "Expected value {expected}, got {actual}");
let message = format!("Processing {count} items");
```

### ❌ DON'T - Use Out-of-Line Format Arguments

```rust
// WRONG - Out-of-line arguments (clippy::uninlined_format_args)
println!("Error occurred: {:?}", error);
assert!(condition, "Expected value {}, got {}", expected, actual);
let message = format!("Processing {} items", count);
```

### ✅ DO - Use write! for Buffer Writing

```rust
// CORRECT - Writing to existing buffer
use std::fmt::Write;
let mut buffer = String::new();
write!(&mut buffer, "Hello {name}!").unwrap();
```

---

## 🚨 Error Handling

### ✅ DO - Use Proper Error Handling

```rust
// CORRECT - Proper error handling
let result = risky_operation();
match result {
    Ok(value) => process(value),
    Err(e) => {
        ...
    }
}

// CORRECT - For operations that should succeed
let value = risky_operation()
    .map_err(|e| format!("Critical operation failed: {e}"))?;
```

### ❌ DON'T - Use unwrap() or expect() in Production Code

```rust
// WRONG - unwrap in production (clippy::unwrap_used)
let value = risky_operation().unwrap();

// WRONG - expect in production (clippy::expect_used)
let value = risky_operation().expect("This should never fail");
```

### ✅ DO - Use Appropriate Error Handling for Context

```rust
// CORRECT - In tests, unwrap, panic on setup failure is acceptable with allow attribute
#[cfg(test)]
mod tests {
    #[allow(clippy::unwrap_used)]
    fn test_something() {
        let value = setup_test_data().unwrap();
        assert_eq!(value, expected);
    }
}
```

---

## 🧪 Test Code Patterns

### ❌ DON'T - Use assert!(false, ...)

```rust
// WRONG - Always false assertion (clippy::assertions_on_constants)
assert!(false, "This should not happen");

// CORRECT - Direct panic
panic!("This should not happen");
```

---

## 🏃 Performance Code (Benchmarks)

### ✅ DO - Handle Benchmark Setup Errors Appropriately

```rust
// CORRECT - Benchmark setup can panic
let rt = match tokio::runtime::Runtime::new() {
    Ok(runtime) => runtime,
    Err(_) => panic!("Failed to create runtime for benchmark"),
};
```

---

## 🔧 Code Style

### ✅ DO - Add Semicolons for Consistency

```rust
// CORRECT - Consistent semicolon usage
group.bench_function("test", |b| {
    b.iter(|| {
        black_box(expensive_operation());
    });
});
```

### ❌ DON'T - Omit Semicolons Inconsistently

```rust
// WRONG - Missing semicolon (clippy::semicolon_if_nothing_returned)
group.bench_function("test", |b| {
    b.iter(|| {
        black_box(expensive_operation())  // Missing semicolon
    })
});
```

### ✅ DO - Use Trait Methods Correctly
### and ❌ DON'T - Use Methods Without Importing Traits

```rust
// CORRECT - Import required traits
use sy_ipc_transport::{Connection, TransportConfig};

fn use_connection(conn: &impl Connection) {
    let info = conn.connection_info();  // Method available via trait
}

fn validate_config(config: &impl TransportConfig) {
    config.validate().expect("Config should be valid");  // Method available via trait
}
```



---

## 🏗️ Architecture Patterns

### ✅ DO - Use Conditional Compilation Correctly

```rust
// CORRECT - Platform-specific code
#[cfg(unix)]
fn create_unix_transport() -> UnixSocketTransport {
    UnixSocketTransport::new()
}

#[cfg(not(unix))]
fn create_unix_transport() -> ! {
    panic!("Unix sockets not supported on this platform")
}

// CORRECT - Feature-gated code
#[cfg(feature = "test-utils")]
pub mod test_utils {
    // Test utilities only available when feature is enabled
}
```

### ✅ DO - Handle Platform Differences in Tests

```rust
// CORRECT - Platform-aware testing
#[tokio::test]
async fn test_transport_creation() {
    #[cfg(unix)]
    let _unix_transport = UnixSocketTransport::new();
    
    let _stdio_transport = StdioTransport::new();
    let _named_pipe_transport = NamedPipeTransport::new();
}
```

---

## 📋 File Organization

### ✅ DO - Use Module-Level Documentation

```rust
//! Module documentation explaining purpose
//!
//! This module handles transport layer operations and provides
//! cross-platform abstractions for IPC communication.

// CORRECT - Clear module purpose and usage
```

---

## 🚀 Performance Considerations

### ✅ DO - Use black_box Correctly in Benchmarks

### ✅ DO - Handle Async Code in Benchmarks

```rust
// CORRECT - Async benchmark pattern
fn bench_async_operation(c: &mut Criterion) {
    let rt = tokio::runtime::Runtime::new()
        .expect("Failed to create runtime");
    
    c.bench_function("async_operation", |b| {
        b.iter_custom(|iters| {
            let start = std::time::Instant::now();
            for _ in 0..iters {
                rt.block_on(async {
                    let result = async_operation().await;
                    black_box(result);
                });
            }
            start.elapsed()
        });
    });
}
```

---

**Following this guide will ensure your Rust code passes strict clippy checks and maintains high quality standards throughout the Symphony project.**