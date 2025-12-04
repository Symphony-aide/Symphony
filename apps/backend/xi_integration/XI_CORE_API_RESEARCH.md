# Xi-Core-Lib API Research

## Overview

This document captures research findings on xi-core-lib's Editor and CoreState APIs to inform the refactoring of XiIntegration to properly use xi-core's editor engine.

## Key Findings

### 1. Architecture

Xi-core-lib has a two-level architecture:

- **XiCore**: Top-level coordinator that manages multiple buffers/views
  - Located in `core-lib/src/core.rs`
  - Wraps `CoreState` in an `Arc<Mutex<>>`
  - Handles RPC messages from frontend
  - Manages plugin lifecycle

- **CoreState**: The actual state manager
  - Located in `core-lib/src/tabs.rs` (not shown but referenced)
  - Manages multiple Editor instances (one per buffer)
  - Handles view management and routing

- **Editor**: Per-buffer editing engine
  - Located in `core-lib/src/editor.rs`
  - Contains the Rope text buffer
  - Contains the CRDT Engine for undo/redo
  - Implements all editing operations

### 2. Editor API

The `Editor` struct provides:

#### Construction
```rust
pub fn new() -> Editor
pub fn with_text<T: Into<Rope>>(text: T) -> Editor
```

#### Core Operations
```rust
// Text access
pub(crate) fn get_buffer(&self) -> &Rope

// Editing (internal - called via do_edit)
fn add_delta(&mut self, delta: RopeDelta)
fn commit_delta(&mut self) -> Option<(RopeDelta, Rope, InsertDrift)>

// High-level editing interface
pub(crate) fn do_edit(
    &mut self,
    view: &mut View,
    kill_ring: &mut Rope,
    config: &BufferItems,
    cmd: BufferEvent,
)
```

#### Undo/Redo (Built-in!)
```rust
fn do_undo(&mut self)
fn do_redo(&mut self)
```

#### Search/Replace (Built-in!)
```rust
fn do_replace(&mut self, view: &mut View, replace_all: bool)
// Note: Search is handled by View, not Editor
```

#### State Management
```rust
pub(crate) fn set_pristine(&mut self)
pub(crate) fn is_pristine(&self) -> bool
pub(crate) fn reload(&mut self, text: Rope)
```

#### Plugin Integration
```rust
pub fn apply_plugin_edit(&mut self, edit: PluginEdit)
pub fn increment_revs_in_flight(&mut self)
pub fn dec_revs_in_flight(&mut self)
```

### 3. CRDT Engine

The Editor contains an `Engine` (from xi-rope) that provides:
- Revision tracking with `RevId` and `RevToken`
- Undo/redo through undo groups
- Concurrent edit support via operational transformation
- Delta computation between revisions

Key Engine methods:
```rust
engine.get_head() -> &Rope              // Current text
engine.get_head_rev_id() -> RevId       // Current revision
engine.edit_rev(...)                    // Apply edit with undo group
engine.try_delta_rev_head(token) -> Result<RopeDelta>  // Get delta from revision
engine.undo(undos: BTreeSet<usize>)     // Undo specific groups
engine.gc(undos: &BTreeSet<usize>)      // Garbage collect old revisions
```

### 4. Edit Types

Xi-core has a sophisticated edit type system for undo grouping:

```rust
pub enum EditType {
    Other,          // Always creates new undo group
    InsertChars,    // Groups consecutive character inserts
    InsertNewline,  // Groups consecutive newlines
    Indent,         // Groups indentation changes
    Delete,         // Groups consecutive deletes
    Undo,
    Redo,
    Transpose,      // Always creates new undo group
    Surround,       // Wraps selection with characters
}
```

Edits are grouped based on `EditType` - consecutive edits of the same type are merged into one undo group.

### 5. BufferEvent Enum

Xi-core uses a `BufferEvent` enum for all editing operations:

```rust
pub enum BufferEvent {
    Delete { movement: Movement, kill: bool },
    Backspace,
    Transpose,
    Undo,
    Redo,
    Uppercase,
    Lowercase,
    Capitalize,
    Indent,
    Outdent,
    InsertNewline,
    InsertTab,
    Insert(String),
    Paste(String),
    Yank,
    ReplaceNext,
    ReplaceAll,
    DuplicateLine,
    IncreaseNumber,
    DecreaseNumber,
}
```

This is the high-level interface for editing - much richer than our current `EditOperation` enum.

### 6. View Integration

The `View` struct (in `view.rs`) manages:
- Selection state (cursor positions)
- Find/replace state
- Line breaks and wrapping
- Scroll position
- Style spans for syntax highlighting

Editor and View work together:
- Editor owns the text buffer
- View owns the selection and visual state
- Many operations require both (e.g., `do_edit` takes `&mut View`)

## Current XiIntegration Issues

Our current implementation has these problems:

1. **Direct Rope Usage**: We store `Rope` directly in views, bypassing xi-core's Engine
   ```rust
   struct View {
       rope: Rope,  // ❌ Wrong - no undo/redo support
       // ...
   }
   ```

2. **No Undo/Redo**: We don't have access to the CRDT Engine's undo system

3. **No Search**: We don't have xi-core's search functionality

4. **Manual Delta Application**: We manually apply edits to Rope instead of using Editor

5. **No Edit Type Tracking**: We don't track edit types for intelligent undo grouping

## Recommended Refactoring Approach

### Option 1: Wrap Editor Directly (Recommended)

Store an `Editor` instance per view:

```rust
struct View {
    editor: Editor,           // ✅ Full xi-core functionality
    view_state: xi_core::View, // ✅ Selection, find, etc.
    path: PathBuf,
    dirty: bool,
}
```

**Pros:**
- Direct access to all Editor functionality
- Undo/redo works immediately
- Search/replace works immediately
- Proper edit type tracking
- Can use xi-core's plugin system

**Cons:**
- Need to also manage xi-core's View struct
- More complex integration

### Option 2: Wrap CoreState (Alternative)

Use xi-core's full CoreState:

```rust
struct XiIntegration {
    core_state: CoreState,  // ✅ Full xi-core with multi-buffer support
    // ...
}
```

**Pros:**
- Complete xi-core functionality
- Multi-buffer management built-in
- Plugin system integration
- Proper RPC protocol support

**Cons:**
- More invasive refactoring
- Need to understand CoreState's internal structure
- May require changes to IPC bridge

### Option 3: Hybrid Approach (Recommended for Phase 1)

Keep current structure but use Editor internally:

```rust
struct View {
    editor: Editor,      // ✅ Use Editor for text operations
    path: PathBuf,
    dirty: bool,
    // Remove: rope field
}

impl XiIntegration {
    pub async fn edit(&mut self, view_id: ViewId, operation: EditOperation) -> Result<(), XiError> {
        let view = self.views.get_mut(&view_id)?;
        
        // Convert EditOperation to BufferEvent
        let buffer_event = self.translate_edit_operation(operation);
        
        // Use Editor's do_edit (need View struct too)
        let mut xi_view = xi_core::View::new(view_id);
        view.editor.do_edit(&mut xi_view, &mut Rope::new(), &config, buffer_event);
        
        // Commit the delta
        if let Some((delta, _, _)) = view.editor.commit_delta() {
            // Update view state
        }
        
        Ok(())
    }
    
    pub async fn undo(&mut self, view_id: ViewId) -> Result<(), XiError> {
        let view = self.views.get_mut(&view_id)?;
        view.editor.do_undo();  // ✅ Undo works!
        view.editor.commit_delta();
        Ok(())
    }
}
```

**Pros:**
- Minimal changes to existing API
- Undo/redo works immediately
- Can add search/replace easily
- Backward compatible with existing tests

**Cons:**
- Need to manage xi-core's View separately
- Some duplication of state

## Implementation Plan

### Phase 1: Replace Rope with Editor (Task 7.5.2)

1. Update `View` struct to use `Editor` instead of `Rope`
2. Update `open_file()` to create `Editor::with_text()`
3. Update `edit()` to use `Editor::do_edit()` or `add_delta()`
4. Update `get_content()` to use `editor.get_buffer()`
5. Update `close_view()` to properly cleanup Editor

### Phase 2: Add Undo/Redo (Task 11)

1. Implement `undo()` method calling `editor.do_undo()`
2. Implement `redo()` method calling `editor.do_redo()`
3. Update IPC bridge to handle undo/redo messages

### Phase 3: Add Search/Replace (Task 12)

1. Create xi-core View instances
2. Implement `search()` using View's find functionality
3. Implement `replace()` using `editor.do_replace()`

## Key Insights

1. **Editor is the core**: The `Editor` struct is what we should be using, not raw `Rope`

2. **Engine provides undo/redo**: The CRDT `Engine` inside Editor handles all undo/redo automatically

3. **View is required**: Many operations need both Editor and View - we'll need to manage View instances

4. **BufferEvent is the interface**: We should translate our `EditOperation` to `BufferEvent` for proper edit type tracking

5. **Commit pattern**: Xi-core uses `add_delta()` + `commit_delta()` pattern for batching edits

6. **Revision tracking**: The Engine tracks revisions with tokens, enabling plugin integration and concurrent edits

## Next Steps

1. ✅ Complete this research document
2. Refactor `View` struct to use `Editor`
3. Update all methods to use Editor API
4. Verify existing tests still pass
5. Add tests for undo/redo functionality

## References

- `apps/xi-editor/rust/core-lib/src/editor.rs` - Editor implementation
- `apps/xi-editor/rust/core-lib/src/core.rs` - XiCore and CoreState
- `apps/xi-editor/rust/core-lib/src/view.rs` - View implementation
- `apps/xi-editor/rust/rope/src/engine.rs` - CRDT Engine
- `.kiro/specs/xi-editor-migration/design.md` - Integration design document
