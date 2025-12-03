---
trigger: model_decision
description: Essential Rust utility crates and tools for developer productivity, testing, debugging, and common functionality
---

## Serialization & Deserialization

### serde (1.0+)
- Use serde for serialization
- Derive `Serialize` and `Deserialize` on types
- Use with `serde_json` for JSON, [toml](cci:7://file:///f:/Projects/GradutionProject/engineering/Symphony/apps/backend/Cargo.toml:0:0-0:0) for TOML, `bincode` for binary
- Use `#[serde(rename = "")]` for field name mapping
- Use `#[serde(skip)]` to exclude fields

## Async Runtime

### tokio (1.0+)
- Use `tokio = { version = "1", features = ["full"] }` for full async runtime
- Use `#[tokio::main]` macro for async main function
- Use `tokio::spawn` for concurrent tasks
- Use `tokio::select!` for racing multiple futures
- Use `tokio::time` for timeouts and delays

### async-std
- Alternative async runtime to tokio
- More similar to stdlib API design
- Use `async-std = { version = "1", features = ["attributes"] }`

## Error Handling

### thiserror (1.0+)
- Use for library error types
- Derive `Error` trait automatically
- Use `#[error("message")]` for error messages
- Supports error source with `#[from]` attribute

### anyhow (1.0+)
- Use for application error handling
- Provides `anyhow::Error` for any error type
- Use `.context()` to add error context
- Don't use in library code

## Logging & Tracing

### tracing (0.1+)
- Use for structured logging and tracing
- More powerful than `log` crate
- Use `#[instrument]` for automatic span creation
- Use `info!`, `warn!`, `error!` macros

### tracing-subscriber
- Configure tracing output
- Use `tracing_subscriber::fmt::init()` for simple setup
- Filter logs by level and target


## Date & Time

### chrono (0.4+)
- Comprehensive date and time handling
- Use `DateTime<Utc>` for timestamps
- Parse and format dates

### time (0.3+)
- Modern alternative to chrono
- More type-safe API
- Smaller compile times

## Random

### rand (0.8+)
- Random number generation
- Use `rand::thread_rng()` for thread-local RNG
- Use `rand::Rng` trait for random values

## String & Text

### regex (1.0+)
- Regular expression matching
- Compile patterns once: `Regex::new()`
- Use `lazy_static` or `once_cell` for static patterns

### uuid (1.0+)
- Generate and parse UUIDs
- Use `Uuid::new_v4()` for random UUIDs

## Data Structures

### hashbrown
- Fast hash map implementation
- Used by std::collections::HashMap
- Use directly for more control

### dashmap
- Concurrent hash map
- Lock-free reads
- Use for shared mutable state across threads

### im
- Immutable data structures
- Persistent collections
- Use for functional programming patterns

## Concurrency

### crossbeam
- Advanced concurrency primitives
- Channel implementation
- Scoped threads

### rayon
- Data parallelism library
- Use `.par_iter()` for parallel iteration
- Automatic work stealing

## Utility Crates

### itertools
- Extended iterator methods
- Use for advanced iteration patterns
- `chunks`, `combinations`, `join`, etc.

### lazy_static / once_cell
- Lazy initialization of static values
- Use `lazy_static!` macro
- `once_cell::sync::Lazy` for newer projects

### derivative
- Custom derive for traits
- More control than standard derives