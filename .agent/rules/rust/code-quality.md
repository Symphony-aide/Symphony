---
trigger: model_decision
description: Code quality standards using rustfmt, clippy, and linting to maintain consistent, clean, and idiomatic Rust code
---

## Formatting with rustfmt

- Use `cargo fmt` before every commit
- Configure rustfmt in `rustfmt.toml` or `.rustfmt.toml` if needed
- Accept rustfmt's deterministic formatting - don't fight it
- Use `cargo fmt -- --check` in CI to enforce formatting
- Format on save in your editor/IDE for consistency
- Don't manually override rustfmt output with `#[rustfmt::skip]` unless absolutely necessary

## Linting with Clippy

- Run `cargo clippy` regularly during development
- Address all clippy warnings before committing
- Use `cargo clippy -- -D warnings` in CI to fail on warnings
- Don't disable clippy lints without good reason and documentation
- Use `#[allow(clippy::lint_name)]` sparingly and only when justified
- Configure project-wide clippy settings in `clippy.toml` if needed

## Common Clippy Lints to Follow

- Use `if let` or `match` instead of unwrap when handling `Option`/`Result`
- Use `?` operator for error propagation instead of manual match
- Avoid unnecessary clones and allocations
- Use iterator methods instead of manual loops where appropriate
- Don't use `.expect()` in library code - propagate errors instead
- Use `#[must_use]` attribute for types/functions whose return value should be used

## Code Complexity

- Keep functions under 20 lines when possible
- Limit cyclomatic complexity - refactor complex functions
- Use early returns to reduce nesting
- Extract complex logic into well-named helper functions
- Avoid deeply nested match/if statements
- Use pattern matching to simplify conditional logic

## Code Smells to Avoid

- Don't use boolean function parameters - use enums instead
- Avoid large tuples - use structs with named fields
- Don't ignore return values, especially `Result` types
- Avoid `unsafe` blocks unless absolutely necessary
- Don't use `.unwrap()` or `.expect()` without careful consideration
- Avoid `panic!` in library code - return `Result` instead

## Maintainability

- Write self-documenting code with clear variable names
- Add comments for complex algorithms or non-obvious logic
- Keep modules focused on single responsibility
- Use type aliases to improve readability: `type UserId = u64;`
- Refactor duplicated code into reusable functions
- Remove dead code and unused imports regularly

## Static Analysis

- Use `cargo check` for fast feedback during development
- Run `cargo build --all-features` to check all feature combinations
- Use `cargo tree` to inspect dependency trees
- Use `cargo machete` to find unused dependencies
- Use rust-analyzer in your editor for real-time feedback
- Enable all recommended rust-analyzer checks