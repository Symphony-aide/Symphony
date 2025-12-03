---
trigger: glob
globs: apps/backend/**/*.rs
---

## Type System Best Practices

### Leverage Strong Typing
- Use Rust's type system to prevent bugs at compile time
- Make illegal states unrepresentable with proper type design
- Use newtypes to add semantic meaning: `struct Meters(f64);`
- Use enums to represent finite state machines
- Avoid using `Any` trait or `dyn Trait` unless absolutely necessary

### Use Specific Types
- Don't use overly generic types - be as specific as possible
- Use `&str` instead of `String` for function parameters when you don't need ownership
- Use `&[T]` instead of `&Vec<T>` for slice parameters
- Use `NonZeroU32` and similar types when zero is invalid
- Use `std::num::NonNull<T>` instead of raw pointers when possible

### Type Aliases for Clarity
- Use type aliases for complex types: `type Result<T> = std::result::Result<T, MyError>;`
- Use `newtype` pattern for domain-specific types
- Document type aliases with meaningful names
- Use associated types in traits for flexibility

### Phantom Types
- Use phantom types to encode compile-time information
- Use `PhantomData<T>` to indicate ownership or variance
- Leverage phantom types for zero-cost abstractions

## Security Best Practices

### Minimize Unsafe Code
- Avoid `unsafe` blocks unless absolutely necessary for FFI or performance
- Isolate `unsafe` code in small, well-documented functions
- Document all safety invariants and preconditions for `unsafe` code
- Review all `unsafe` code thoroughly in code reviews
- Use safe abstractions around `unsafe` code

### Input Validation
- Validate and sanitize all external input thoroughly
- Use parsing types (`FromStr`, `TryFrom`) for validated construction
- Check bounds before array/slice access
- Validate input before passing to `unsafe` functions
- Use builder pattern with validation for complex construction

### Memory Safety
- Use Rust's ownership system - don't fight it
- Avoid buffer overflows with bounds checking
- Use `.get()` instead of indexing for fallible access
- Don't use `.unwrap()` on user-controlled input
- Use smart pointers (`Box`, `Rc`, `Arc`) for heap management

### Dependency Security
- Audit dependencies with `cargo audit` regularly
- Keep dependencies up-to-date for security patches
- Use `cargo-deny` to enforce license and security policies
- Review dependency trees with `cargo tree`
- Minimize external dependencies

### Cryptography
- Use audited cryptography crates: `ring`, `rustls`, `sodiumoxide`
- Don't implement cryptographic algorithms yourself
- Use secure random number generation: `rand::thread_rng()`
- Never hardcode secrets or keys
- Use proper key derivation functions (KDFs)

### Prevent Common Vulnerabilities

#### Integer Overflow
- Use checked arithmetic: `.checked_add()`, `.checked_sub()`, etc.
- Use saturating arithmetic: `.saturating_add()` when appropriate
- Use wrapping arithmetic explicitly: `.wrapping_add()` when intended
- Enable overflow checks in release builds for critical code

#### Race Conditions
- Use `Mutex<T>` or `RwLock<T>` for shared mutable state
- Use `Arc<T>` for thread-safe reference counting
- Prefer message passing with channels over shared state
- Use atomic types from `std::sync::atomic` for lock-free operations

#### Injection Attacks
- Use parameterized queries for SQL to prevent SQL injection
- Sanitize user input before using in commands or templates
- Escape output appropriately for the context (HTML, SQL, shell, etc.)
- Use type-safe query builders instead of string concatenation

## Built-In Security Mitigations

### Use Rust's Safety Features
- Enable all safety checks - don't disable them
- Use Address Space Layout Randomization (ASLR) - enabled by default
- Use stack canaries for buffer overflow detection
- Enable Control Flow Integrity (CFI) where available
- Use position-independent executables (PIE)

## Unsafe Code Guidelines

### When to Use Unsafe
- Only use `unsafe` for FFI (Foreign Function Interface)
- Use `unsafe` for low-level optimizations after profiling
- Use `unsafe` for implementing safe abstractions
- Never use `unsafe` to "fix" borrow checker issues

### Unsafe Best Practices
- Keep `unsafe` blocks minimal and well-scoped
- Document all safety invariants and preconditions
- Encapsulate `unsafe` in safe wrapper functions
- Test `unsafe` code thoroughly, including edge cases
- Use tools like Miri to detect undefined behavior
- Have multiple reviewers for all `unsafe` code

### FFI Safety
- Use `repr(C)` for types crossing FFI boundaries
- Validate all data coming from C/C++ code
- Don't pass Rust types with Drop to C without care
- Use `std::ffi::CString` and `CStr` for C strings
- Be explicit about memory ownership across FFI boundaries