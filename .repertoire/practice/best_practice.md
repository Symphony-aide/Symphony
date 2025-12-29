# Rust Best Practices: Quick Reference Guide

## 🚨 MANDATORY: Testing with Nextest

**CRITICAL**: Always use `cargo nextest run` instead of `cargo test` whenever possible.

**Quick Commands**:
- ✅ `cargo nextest run` (PREFERRED)
- ✅ `cargo nextest run \--features "unit,integration"` (with quote escaping)
- ⚠️ `cargo test` (FALLBACK ONLY when nextest unavailable)

---

## Memory Management

### ✅ DO
```rust
// Prefer borrowing over cloning
fn process_data(data: &Vec<String>) { }

// Use Arc for shared ownership across threads
let shared = Arc::new(data);

// Use Cow for conditional ownership
fn process(input: Cow<str>) { }
```

### ❌ DON'T
```rust
// Avoid excessive cloning in loops
for item in items {
    let cloned = item.clone(); // Performance killer
}

// Avoid lifetimes in structs unless necessary
struct BadExample<'a> {
    data: &'a String // Complicates ownership
}
```

---

## Error Handling

### ✅ DO
```rust
// Use ? operator for error propagation
fn read_file() -> Result<String, Error> {
    let content = fs::read_to_string("file.txt")?;
    Ok(content)
}

// Use thiserror for library errors
#[derive(thiserror::Error, Debug)]
enum MyError {
    #[error("IO error: {0}")]
    Io(#[from] io::Error),
}

// Use anyhow for application errors
fn app_logic() -> anyhow::Result<()> {
    do_something().context("Failed to do something")?;
    Ok(())
}
```

### ❌ DON'T
```rust
// Avoid unwrap() in production code
let value = option.unwrap(); // Panics if None!

// Avoid expect() without good reason
let result = result.expect("this should never fail"); // Still panics

// Don't ignore Result types
fs::write("file.txt", data); // Ignores potential errors
```

---

## Collections & Iteration

### ✅ DO
```rust
// Use iterator chains for transformations
let result: Vec<_> = items
    .iter()
    .filter(|x| x.is_valid())
    .map(|x| x.process())
    .collect();

// Use usize for indexing
let index: usize = 5;
let item = vec[index];
```

### ❌ DON'T
```rust
// Avoid manual loops with indexing
for i in 0..vec.len() {
    let item = &vec[i]; // Error-prone, use iter()
}

// Don't use signed integers for indices
let index: i32 = 5; // Can be negative, causes casting issues
```

---

## Async & Concurrency

### ✅ DO
```rust
// Use Tokio for async I/O
#[tokio::main]
async fn main() {
    let result = tokio::fs::read("file.txt").await;
}

// Use Rayon for CPU-bound parallelism
use rayon::prelude::*;
let sum: i32 = data.par_iter().sum();

// Use spawn_blocking for sync operations in async
let result = tokio::task::spawn_blocking(|| {
    // Blocking operation here
}).await?;
```

### ❌ DON'T
```rust
// Don't block in async context
async fn bad_async() {
    std::thread::sleep(Duration::from_secs(1)); // Blocks runtime!
}

// Don't mix Tokio and Rayon without care
async fn dangerous() {
    rayon::scope(|s| {
        tokio::spawn(async {}); // Potential deadlock
    });
}
```

---

## Type System & APIs

### ✅ DO
```rust
// Use traits for extensibility
trait Processor {
    fn process(&self) -> Result<Output>;
}

// Use pattern matching exhaustively
match value {
    Some(x) => handle_some(x),
    None => handle_none(),
}

// Use enums for state machines
enum State {
    Ready,
    Processing { progress: u32 },
    Done { result: String },
}
```

### ❌ DON'T
```rust
// Avoid pull-based callbacks
struct Bad {
    callback: Box<dyn Fn()> // Ownership nightmares
}

// Don't use Hungarian notation
let account_str: String; // Type is already in the signature

// Avoid over-nesting
if condition1 {
    if condition2 {
        if condition3 { } // Extract to functions
    }
}
```

---

## Performance

### ✅ DO
```rust
// Profile before optimizing
// cargo install cargo-flamegraph
// cargo flamegraph

// Use stack allocation when possible
let array = [0; 1024]; // On stack

// Inline hot functions
#[inline]
fn hot_path() { }
```

### ❌ DON'T
```rust
// Don't prematurely optimize
let boxed = Box::new(small_value); // Unnecessary heap allocation

// Avoid allocations in tight loops
for _ in 0..1_000_000 {
    let v = Vec::new(); // Move outside loop
}
```