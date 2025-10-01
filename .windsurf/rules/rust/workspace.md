---
trigger: model_decision
description: Cargo workspace management best practices for monorepos, dependency management, and build configuration **/*.rs
---

## Workspace Structure

- Use Cargo workspaces for monorepos with multiple related crates
- Define workspace members in the root [Cargo.toml](cci:7://file:///f:/Projects/GradutionProject/engineering/Symphony/apps/backend/Cargo.toml:0:0-0:0) file
- Place shared dependencies in `[workspace.dependencies]` section
- Use `workspace = true` in member crates to inherit workspace dependencies
- Organize workspace with clear directory structure (e.g., `libs/`, `services/`, `tools/`)

## Dependency Management

- Define shared dependencies once at the workspace level
- Use specific version numbers for external dependencies (e.g., `serde = "1.0.219"`)
- Use path dependencies for local crates: `{ path = "../crate-name" }`
- Don't duplicate dependency definitions across workspace members

## Cargo.toml Best Practices

- Include comprehensive package metadata: name, version, authors, edition, description, repository, homepage, license
- Add meaningful keywords and categories for discoverability
- Include a README.md file and reference it: `readme = "README.md"`
- Use feature flags for optional functionality
- Specify minimum Rust version with `rust-version` if needed

## Build Configuration

- Use workspace-level build profiles for consistency
- Enable LTO (Link Time Optimization) in release profile: `lto = true`
- Use `[profile.dev]` for faster compilation during development

## Version Management

- Use semantic versioning (MAJOR.MINOR.PATCH)
- Keep version numbers synchronized across related workspace members
- Use `0.x.y` versions for pre-1.0 crates under active development
- Document breaking changes in CHANGELOG.md
- Update versions before publishing

## Workspace Commands

- Use `cargo build` at workspace root to build all members
- Use `cargo build -p <package-name>` to build specific package
- Use `cargo test` to run all tests in workspace
- Use `cargo check` for fast compilation checks without codegen
- Use `cargo clean` to remove build artifacts

## Feature Management

- Define features at workspace level when shared across crates
- Use feature flags to make large dependencies optional
- Document feature flags in README or documentation
- Use default features sparingly: `default = []`
- Combine features logically: `full = ["feature1", "feature2"]`
