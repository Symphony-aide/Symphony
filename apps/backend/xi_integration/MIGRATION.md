# Migration Guide

This guide helps you migrate code when using the `xi-integration` crate as the API evolves.

## Version 0.1.0 → Unreleased

### Enhanced Public API

The crate now explicitly re-exports the `Editor` type from `xi_core_lib`, making it easier to access for advanced use cases.

#### Before

```rust
use xi_integration::xi_core_lib::editor::Editor;

// Or accessing through the full path
let editor: xi_integration::xi_core_lib::editor::Editor = ...;
```

#### After

```rust
use xi_integration::Editor;

// Much cleaner!
let editor: xi_integration::Editor = ...;
```

**Note**: The old import path still works! This is a non-breaking enhancement.

### Undo/Redo Functionality (NEW)

Full undo/redo functionality is now available through the `EditorWrapper`:

#### Basic Usage

```rust
use xi_integration::{XiIntegration, XiConfig, EditOperation};

let mut xi = XiIntegration::new(XiConfig::default())?;
let view_id = xi.open_file("example.txt").await?;

// Make an edit
xi.edit(view_id, EditOperation::Insert {
    position: 0,
    text: "Hello, World!".to_string(),
}).await?;

// Undo the edit
xi.undo(view_id).await?;

// Redo the edit
xi.redo(view_id).await?;
```

#### Advanced Usage with EditorWrapper

```rust
use xi_integration::editor_wrapper::EditorWrapper;
use xi_rope::Rope;

let mut editor = EditorWrapper::with_text("Initial content");

// Make edits
editor.reload(Rope::from("Modified content"));

// Check undo availability
if editor.can_undo() {
    println!("Can undo {} operations", editor.undo_count());
    editor.undo();
}

// Check redo availability
if editor.can_redo() {
    println!("Can redo {} operations", editor.redo_count());
    editor.redo();
}
```

#### History Management

- **Maximum History**: 1000 operations per buffer
- **Automatic Pruning**: Oldest operations removed when limit exceeded
- **Redo Clearing**: New edits clear redo history
- **Dirty State**: Tracked automatically via `can_undo()`

### Internal Changes

The internal implementation now uses `EditorWrapper` which wraps `xi_core_lib::Editor`:

- **Undo/Redo**: Fully functional with 1000 operation history
- **State Tracking**: Automatic dirty state detection
- **Memory Management**: Efficient rope-based storage with automatic pruning
- **CRDT Engine**: Edits tracked for future xi-core integration

If you're using the public API (`XiIntegration`, `IpcBridge`, `BufferManager`), no changes are required - undo/redo just works!

## Best Practices

### Importing Types

**Recommended**: Import specific types you need

```rust
use xi_integration::{
    XiIntegration,
    XiConfig,
    ViewId,
    EditOperation,
    Editor,  // Now directly accessible!
};
```

**Also Valid**: Import the full crate

```rust
use xi_integration;

let xi = xi_integration::XiIntegration::new(xi_integration::XiConfig::default())?;
```

### Error Handling

Always use the `XiResult` type alias for consistency:

```rust
use xi_integration::{XiResult, XiError};

async fn my_function() -> XiResult<String> {
    // Your code here
    Ok("success".to_string())
}
```

### Async Operations

All file operations are async. Make sure to `.await` them:

```rust
// ✅ Correct
let view_id = xi.open_file("example.txt").await?;
let content = xi.get_content(view_id).await?;

// ❌ Wrong - missing .await
let view_id = xi.open_file("example.txt")?;  // Won't compile!
```

## Advanced Usage

### Direct Editor Access

If you need to work with xi-core's `Editor` directly (advanced use case):

```rust
use xi_integration::{Editor, Rope};

// Create an editor with initial content
let editor = Editor::with_text("Hello, World!");

// Note: Most Editor methods are private in xi-core-lib
// Use XiIntegration for standard operations
```

**Warning**: Direct `Editor` usage is an advanced feature. Most users should use `XiIntegration` which provides a higher-level, Symphony-compatible API.

### Custom IPC Integration

If you're building custom IPC integration:

```rust
use xi_integration::{IpcBridge, XiIntegration, XiConfig};
use std::sync::Arc;
use tokio::sync::Mutex;

let xi = Arc::new(Mutex::new(XiIntegration::new(XiConfig::default())?));
let bridge = IpcBridge::new(xi);

// Handle requests
let response = bridge.handle_request(request).await?;
```

## Breaking Changes

### None Yet

Version 0.1.0 → Unreleased contains no breaking changes. All changes are additive or internal improvements.

## Future Breaking Changes

The following changes are planned for future versions:

### Version 0.2.0 (Planned)

- **EditorWrapper Optimization**: Once we have proper API access to Editor's private methods:
  - Replace custom undo/redo stacks with xi-core's built-in CRDT engine
  - Leverage Editor's `do_undo()` and `do_redo()` methods directly
  - Support undo groups for batched operations
  - This is an internal optimization and won't affect the public API

- **Search/Replace API**: New methods for search and replace will be added. This is additive and non-breaking.

- **Save Operations**: Implement save functionality with proper dirty state management.

## Getting Help

If you encounter issues during migration:

1. Check the [README.md](./README.md) for updated examples
2. Review the [CHANGELOG.md](./CHANGELOG.md) for detailed changes
3. Look at the [XI_CORE_API_RESEARCH.md](./XI_CORE_API_RESEARCH.md) for xi-core integration details
4. Open an issue on GitHub with the `xi-integration` label

## Version History

- **Unreleased**: Enhanced public API with explicit `Editor` re-export
- **0.1.0** (2024-12-03): Initial release with core functionality
