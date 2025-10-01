---
trigger: model_decision
description: Idiomatic Rust design patterns, anti-patterns to avoid, and common idioms for writing clean, efficient code
---

## Idiomatic Patterns

### Builder Pattern
- Use the builder pattern for structs with many optional fields
- Implement `Default` trait when sensible defaults exist
- Use `TypedBuilder` derive macro for compile-time safety
- Chain builder methods returning `Self`

### Newtype Pattern
- Wrap primitives in newtypes for type safety: `struct UserId(u64);`
- Use newtypes to implement external traits on external types
- Add meaningful methods to newtype wrappers
- Use tuple structs for single-field newtypes

### Type State Pattern
- Encode state in the type system to prevent invalid states
- Use phantom types to track state without runtime cost
- Make invalid states unrepresentable at compile time
- Transition between states by consuming and returning new types

### Strategy Pattern
- Use trait objects (`Box<dyn Trait>`) for runtime polymorphism
- Use generics with trait bounds for compile-time polymorphism
- Prefer trait-based design over inheritance
- Use enums for fixed set of strategies

## Common Idioms

### Use `impl Trait` for Return Types
- Use `impl Trait` for concrete but unnamed return types
- Use `impl Trait` in argument position for generic parameters
- Don't use `impl Trait` in trait method signatures (use associated types)

### Constructor Patterns
- Use `new()` associated function for constructors
- Use `try_new()` or `from_*()` for fallible construction
- Return `Self` from constructors, not concrete type names
- Use `Default::default()` for default construction

### Iterator Patterns
- Implement `Iterator` trait for custom iteration logic
- Use `IntoIterator` for types that can be converted to iterators
- Prefer iterator adapters over manual loops: `.map()`, `.filter()`, `.fold()`
- Use `.collect()` to convert iterators into collections

### Error Handling Patterns
- Use `Result<T, E>` for recoverable errors
- Use custom error types with `thiserror` derive
- Implement `From` for error conversion
- Use `?` operator for error propagation

### Extension Traits
- Use extension traits to add methods to external types
- Name extension traits clearly: `StringExt`, `IteratorExt`
- Import extension traits explicitly where needed

### RAII (Resource Acquisition Is Initialization)
- Use RAII for automatic resource cleanup
- Implement `Drop` trait for custom cleanup logic
- Don't manually call `.drop()` - let it happen automatically
- Use smart pointers (`Box`, `Rc`, `Arc`) for ownership management

## Anti-Patterns to Avoid

### Don't Clone Everything
- Don't clone unnecessarily to avoid borrow checker issues
- Redesign APIs to work with references when possible
- Use `Cow<T>` for conditional ownership

### Don't Overuse `Rc<RefCell<T>>`
- Don't use `Rc<RefCell<T>>` as a crutch for difficult ownership
- Redesign data structures to work with Rust's ownership model
- Use message passing or other patterns instead

### Don't Use Deref for Conversions
- Don't implement `Deref` to emulate inheritance
- Use `Deref` only for smart pointer types
- Use composition and explicit methods instead

### Don't Ignore Errors
- Don't use `.unwrap()` in production code without careful consideration
- Don't use `panic!` for error handling
- Don't ignore `Result` return values

### Don't Fight the Borrow Checker
- Don't add unnecessary `clone()` calls to satisfy borrow checker
- Restructure code to work with Rust's ownership rules
- Use interior mutability patterns when appropriate