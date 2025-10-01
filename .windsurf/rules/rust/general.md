---
trigger: glob
globs: apps/backend/**/*.rs
---

## Code Organization

- Use modules to organize related functionality logically
- Keep functions focused and under 20 lines when possible
- Use descriptive names for types, functions, and variables following snake_case for functions/variables and PascalCase for types
- Place related types, traits, and implementations in the same module
- Use `mod.rs` or single-file modules depending on complexity

## Naming Conventions

- Use `snake_case` for function names, variable names, and module names
- Use `PascalCase` for type names, trait names, and enum variants
- Use `SCREAMING_SNAKE_CASE` for constants and statics
- Use descriptive names that convey intent, not implementation details
- Avoid abbreviations unless they're widely recognized in the domain

## Documentation

- Use `///` for public API documentation with examples
- Use `//!` for module-level documentation at the top of files
- Include `# Examples` sections in function documentation
- Document all public functions, structs, enums, and traits
- Add `# Panics` and `# Errors` sections where applicable
- Keep documentation up-to-date with code changes

## Performance

- Use iterators instead of explicit loops when possible
- Prefer `&str` over `String` for function parameters
- Use `&[T]` over `&Vec<T>` for function parameters
- Avoid unnecessary cloning with `.clone()` - prefer borrowing
- Use `Cow<str>` when you need conditional ownership
- Profile before optimizing - don't prematurely optimize

## Memory and Ownership

- Follow the "don't fight the borrow checker" principle - work with ownership
- Use references (`&T`, `&mut T`) instead of owned values when possible
- Avoid unnecessary `Rc<RefCell<T>>` - redesign if needed frequently
- Use `Box<T>` for heap allocation only when necessary
- Leverage move semantics for large data structures