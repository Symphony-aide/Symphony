# Changelog

All notable changes to the xi-integration crate will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **EditorWrapper**: New wrapper around xi-core's Editor providing undo/redo functionality
  - Maintains separate undo and redo stacks with 1000 operation history limit
  - Provides `undo()`, `redo()`, `can_undo()`, `can_redo()` methods
  - Automatic history pruning when limit exceeded
  - Comprehensive test coverage (12 unit tests)
- Explicit re-export of `Editor` type from `xi_core_lib` for improved API ergonomics
- Comprehensive API research documentation in `XI_CORE_API_RESEARCH.md`
- Refactoring summary documenting the xi-core engine integration
- Undo/redo implementation documentation in `UNDO_REDO_IMPLEMENTATION.md`

### Changed
- **BREAKING (Internal)**: `ViewState` now uses `EditorWrapper` instead of raw `Editor`
  - This is an internal change; public API remains backward compatible
  - Enables full undo/redo functionality with history management
- `XiIntegration::undo()` and `XiIntegration::redo()` now fully functional
  - Return `Ok(())` on success, error if no history available
  - Automatically update buffer state and view
- `XiIntegration::get_metadata()` now tracks dirty state via `can_undo()`
  - Buffer marked dirty when undo history exists
  - Accurate dirty state tracking for save operations
- Edit operations now use `EditorWrapper::reload()` which adds to undo history
- Public exports now include: `pub use xi_core_lib::{self, editor::Editor};`
  - Users can now access `Editor` directly via `xi_integration::Editor`
  - Full `xi_core_lib` crate still accessible via `xi_integration::xi_core_lib`
- Removed `content_cache` workaround - now uses `EditorWrapper::get_buffer()`

### Fixed
- Undo/redo operations now work correctly with proper state restoration
- Dirty state tracking now accurately reflects buffer modification status

## [0.1.0] - 2024-12-03

### Added
- Initial xi-editor integration layer for Symphony IDE
- Core data models: `ViewId`, `EditOperation`, `BufferMetadata`, `XiConfig`
- IPC message protocol types for Symphony-Xi communication
- `XiIntegration` struct wrapping xi-core functionality
- `IpcBridge` for bidirectional protocol translation
- `BufferManager` for buffer lifecycle management
- Comprehensive error types with `thiserror`
- Full test coverage (24 unit tests, 34 doc tests)

### Dependencies
- `xi-rope` - Rope data structure with serde support
- `xi-core-lib` - Editor engine with undo/redo and multi-cursor
- `xi-rpc` - RPC protocol definitions
- `xi-trace` - Performance monitoring
- `serde`, `serde_json` - Serialization
- `tokio` - Async runtime
- `anyhow` - Error handling
- `tracing` - Structured logging
- `thiserror` - Custom error types
- `crossbeam-channel` - Concurrent channels

[Unreleased]: https://github.com/Symphony-Code-Editor/Symphony-App/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Symphony-Code-Editor/Symphony-App/releases/tag/v0.1.0
