# Xi-Editor Features Documentation

**Project Status:** Discontinued (as of README)  
**Last Updated:** 2025-11-30

This document catalogs all implemented and partially implemented features in the Xi-editor project.

---

## Table of Contents
1. [Core Editing Features](#core-editing-features)
2. [Selection and Navigation](#selection-and-navigation)
3. [Find and Replace](#find-and-replace)
4. [File Operations](#file-operations)
5. [Configuration System](#configuration-system)
6. [Plugin System](#plugin-system)
7. [Syntax Highlighting](#syntax-highlighting)
8. [Language Server Protocol (LSP)](#language-server-protocol-lsp)
9. [Undo/Redo System](#undoredo-system)
10. [Multi-Cursor Support](#multi-cursor-support)
11. [Text Transformations](#text-transformations)
12. [Recording/Macros](#recordingmacros)
13. [Theming](#theming)
14. [Experimental Features](#experimental-features)
15. [Platform-Specific Features](#platform-specific-features)

---

## Legend
- ✅ **Fully Implemented** - Feature is complete and working
- 🟡 **Partially Implemented** - Feature exists but has limitations
- 🔴 **Not Implemented** - Feature is planned but not implemented
- 🧪 **Experimental** - Feature is experimental or behind a feature flag

---

## Core Editing Features

### Basic Text Editing
| Feature | Status | Notes |
|---------|--------|-------|
| Insert text | ✅ | Full Unicode support |
| Delete forward/backward | ✅ | Character-level deletion |
| Delete word forward/backward | ✅ | Word-aware deletion |
| Delete to end of paragraph | ✅ | |
| Delete to beginning of line | ✅ | |
| Insert newline | ✅ | Respects line endings |
| Insert tab | ✅ | Configurable tab behavior |
| Paste | ✅ | Multi-line paste support |
| Copy | ✅ | Returns selection contents |
| Cut | ✅ | Returns selection contents |
| Duplicate line | ✅ | |
| Transpose characters | ✅ | |
| Yank (kill ring) | ✅ | Emacs-style yank |

### Line Endings
| Feature | Status | Notes |
|---------|--------|-------|
| LF (Unix) | ✅ | |
| CRLF (Windows) | ✅ | |
| CR (Classic Mac) | ✅ | |
| Auto-detection | ✅ | Detects on file load |
| Preservation on save | ✅ | Maintains original line endings |
| Configurable per-buffer | ✅ | |

### Whitespace Handling
| Feature | Status | Notes |
|---------|--------|-------|
| Tab size configuration | ✅ | Default: 4 spaces |
| Translate tabs to spaces | ✅ | Configurable |
| Use tab stops | ✅ | |
| Auto-detect whitespace | ✅ | Detects tabs vs spaces |
| Save with newline | ✅ | Adds newline at EOF |

### Text Rendering
| Feature | Status | Notes |
|---------|--------|-------|
| Unicode support | ✅ | Full UTF-8 support |
| Word wrapping | ✅ | Configurable wrap width |
| Soft breaks | ✅ | Visual line breaks |
| Font configuration | ✅ | Font face and size |
| Scroll past end | ✅ | Configurable |

---

## Selection and Navigation

### Cursor Movement
| Feature | Status | Notes |
|---------|--------|-------|
| Move up/down | ✅ | |
| Move left/right | ✅ | Also: backward/forward |
| Move word left/right | ✅ | Word boundary aware |
| Move to beginning of paragraph | ✅ | |
| Move to end of paragraph | ✅ | |
| Move to left end of line | ✅ | |
| Move to right end of line | ✅ | |
| Move to beginning of document | ✅ | |
| Move to end of document | ✅ | |
| Scroll page up/down | ✅ | |
| Page up/down | ✅ | |
| Goto line | ✅ | Jump to specific line number |

### Selection Modification
| Feature | Status | Notes |
|---------|--------|-------|
| All movement + modify selection | ✅ | Shift+movement commands |
| Select all | ✅ | |
| Collapse selections | ✅ | Reduce to single cursor |
| Add selection above | ✅ | Multi-cursor |
| Add selection below | ✅ | Multi-cursor |
| Selection into lines | ✅ | Split selection by lines |

### Gesture Support
| Feature | Status | Notes |
|---------|--------|-------|
| Point select | ✅ | Click to position cursor |
| Word select | ✅ | Double-click |
| Line select | ✅ | Triple-click |
| Multi-select | ✅ | Ctrl/Cmd+click |
| Range select | ✅ | Click and drag |
| Select extend | ✅ | Shift+click |
| Drag | ✅ | Mouse drag selection |

### Selection Granularity
| Feature | Status | Notes |
|---------|--------|-------|
| Point (character) | ✅ | |
| Word | ✅ | |
| Line | ✅ | |

---

## Find and Replace

### Find Features
| Feature | Status | Notes |
|---------|--------|-------|
| Basic find | ✅ | Search for text |
| Case sensitive search | ✅ | Configurable |
| Regex search | ✅ | Full regex support |
| Whole word search | ✅ | |
| Find next | ✅ | With wrap around |
| Find previous | ✅ | With wrap around |
| Find all | ✅ | Select all matches |
| Multi-query find | ✅ | Multiple simultaneous searches |
| Incremental find | ✅ | Batched for large files (500KB chunks) |
| Highlight find results | ✅ | Configurable visibility |
| Selection for find | ✅ | Use selection as search query |

### Replace Features
| Feature | Status | Notes |
|---------|--------|-------|
| Replace | ✅ | Set replacement string |
| Replace next | ✅ | Replace current match |
| Replace all | ✅ | Replace all matches |
| Selection for replace | ✅ | Use selection as replacement |
| Preserve case | 🟡 | Defined but not fully implemented |

### Find Modifiers
| Feature | Status | Notes |
|---------|--------|-------|
| Modify selection: None | ✅ | Don't change selection |
| Modify selection: Set | ✅ | Replace selection with match |
| Modify selection: Add | ✅ | Add match to selection |
| Modify selection: Add removing current | ✅ | Multi-cursor workflow |

---

## File Operations

### Basic File I/O
| Feature | Status | Notes |
|---------|--------|-------|
| New view (empty buffer) | ✅ | |
| Open file | ✅ | Load from path |
| Save file | ✅ | Async save operation |
| Close view | ✅ | |
| Autosave | ✅ | Background save with snapshots |
| Pristine state tracking | ✅ | Unsaved changes indicator |

### File Watching
| Feature | Status | Notes |
|---------|--------|-------|
| Detect external changes | ✅ | Using `notify` crate |
| Auto-reload on change | 🟡 | Detection works, reload partial |
| File system events | ✅ | Create, modify, delete, rename |

### File Metadata
| Feature | Status | Notes |
|---------|--------|-------|
| Line ending detection | ✅ | |
| Language detection | ✅ | Based on file extension |
| Encoding | ✅ | UTF-8 only |

---

## Configuration System

### Configuration Domains
| Feature | Status | Notes |
|---------|--------|-------|
| General config | ✅ | Global preferences |
| Language-specific config | ✅ | Per-language settings |
| User overrides | ✅ | Per-view overrides |
| System overrides | ✅ | Internal use only |

### Configuration Sources
| Feature | Status | Notes |
|---------|--------|-------|
| Base config (defaults) | ✅ | Hardcoded defaults |
| Platform overrides | ✅ | Windows-specific settings |
| User config files | ✅ | `~/.config/xi/preferences.xiconfig` |
| Language config files | ✅ | Per-language `.xiconfig` files |
| Runtime modifications | ✅ | Via RPC |

### Configurable Settings
| Feature | Status | Notes |
|---------|--------|-------|
| Tab size | ✅ | Default: 4 |
| Translate tabs to spaces | ✅ | Default: false |
| Use tab stops | ✅ | |
| Font face | ✅ | |
| Font size | ✅ | Default: 14 |
| Auto indent | ✅ | |
| Scroll past end | ✅ | |
| Wrap width | ✅ | Default: 0 (no wrap) |
| Word wrap | ✅ | |
| Autodetect whitespace | ✅ | |
| Surrounding pairs | ✅ | Auto-closing brackets |
| Save with newline | ✅ | |
| Line ending | ✅ | LF, CRLF, CR |

---

## Plugin System

### Plugin Architecture
| Feature | Status | Notes |
|---------|--------|-------|
| Process-based plugins | ✅ | Separate process per plugin |
| JSON-RPC communication | ✅ | stdin/stdout |
| Plugin discovery | ✅ | Manifest-based |
| Plugin lifecycle | ✅ | Initialize, update, shutdown |
| Plugin isolation | ✅ | Crash-proof |

### Plugin Types
| Feature | Status | Notes |
|---------|--------|-------|
| Global plugins | ✅ | Single instance for all buffers |
| Per-buffer plugins | ✅ | Instance per buffer |
| One-shot plugins | ✅ | Run and exit |

### Plugin Capabilities
| Feature | Status | Notes |
|---------|--------|-------|
| Buffer read access | ✅ | Snapshot-based |
| Buffer write access | ✅ | Delta-based edits |
| Syntax highlighting | ✅ | Style spans |
| Annotations | ✅ | Arbitrary data spans |
| Status bar items | ✅ | Add/update/remove |
| Alerts | ✅ | Display messages |
| Hover information | ✅ | LSP-style hover |
| Custom commands | ✅ | Plugin-defined commands |

### Plugin RPC
| Feature | Status | Notes |
|---------|--------|-------|
| Get data (by offset) | ✅ | UTF-8 or line-based |
| Line count | ✅ | |
| Get selections | ✅ | |
| Update notifications | ✅ | Delta-based |
| Did save | ✅ | File save notification |
| Did close | ✅ | View close notification |
| Language changed | ✅ | |
| Tracing control | ✅ | Enable/disable tracing |

### Built-in Plugins
| Plugin | Status | Notes |
|--------|--------|-------|
| Syntect (syntax highlighting) | ✅ | Uses Sublime Text definitions |
| LSP (language servers) | ✅ | Rust, TypeScript, etc. |
| Sample plugin | ✅ | Example/template |

---

## Syntax Highlighting

### Syntect Plugin
| Feature | Status | Notes |
|---------|--------|-------|
| Sublime Text syntax definitions | ✅ | `.sublime-syntax` format |
| Incremental highlighting | ✅ | State-based caching |
| Scope-based styling | ✅ | |
| Language detection | ✅ | By file extension |
| Manual language selection | ✅ | Override auto-detection |

### Supported Languages (via Syntect)
| Language | Status | Notes |
|----------|--------|-------|
| Rust | ✅ | |
| JavaScript/TypeScript | ✅ | |
| Python | ✅ | |
| C/C++ | ✅ | |
| Java | ✅ | |
| Go | ✅ | |
| HTML/CSS | ✅ | |
| Markdown | ✅ | |
| JSON | ✅ | |
| YAML | ✅ | |
| TOML | ✅ | |
| Plain Text | ✅ | Fallback |
| Many others | ✅ | Via Sublime Text packages |

---

## Language Server Protocol (LSP)

### LSP Support
| Feature | Status | Notes |
|---------|--------|-------|
| LSP client implementation | ✅ | Full LSP protocol |
| Multiple language servers | ✅ | Per-language configuration |
| Workspace support | ✅ | Multi-file projects |
| Single file support | ✅ | |

### LSP Features
| Feature | Status | Notes |
|---------|--------|-------|
| Hover information | ✅ | Type info, documentation |
| Diagnostics | 🟡 | Received but display partial |
| Completion | 🟡 | Backend support, UI partial |
| Go to definition | 🟡 | Backend support, UI partial |
| Find references | 🟡 | Backend support, UI partial |

### Supported Language Servers
| Language Server | Status | Notes |
|-----------------|--------|-------|
| Rust Analyzer (RLS) | ✅ | |
| TypeScript Server | ✅ | |
| Python Language Server | ✅ | |
| Others | ✅ | Configurable |

---

## Undo/Redo System

### CRDT-Based Undo
| Feature | Status | Notes |
|---------|--------|-------|
| Undo | ✅ | Full CRDT implementation |
| Redo | ✅ | |
| Undo groups | ✅ | Logical operation grouping |
| Revision tracking | ✅ | Every edit creates a revision |
| Garbage collection | ✅ | Old revisions cleaned up (max 20) |
| Operational transformation | ✅ | Concurrent edit reconciliation |

### Advanced Undo Features
| Feature | Status | Notes |
|---------|--------|-------|
| Plugin edit reconciliation | ✅ | Merges plugin edits with user edits |
| Collaborative editing support | 🟡 | Infrastructure exists, not fully implemented |
| Revision snapshots | ✅ | For async operations |
| Delta transformations | ✅ | |

---

## Multi-Cursor Support

### Multi-Cursor Features
| Feature | Status | Notes |
|---------|--------|-------|
| Multiple cursors | ✅ | Unlimited cursors |
| Add cursor above | ✅ | |
| Add cursor below | ✅ | |
| Multi-select (Ctrl/Cmd+click) | ✅ | |
| Split selection into lines | ✅ | |
| Collapse to single cursor | ✅ | |
| Multi-cursor editing | ✅ | All edit operations work |
| Multi-cursor paste | ✅ | Line-aware paste |

---

## Text Transformations

### Case Transformations
| Feature | Status | Notes |
|---------|--------|-------|
| Uppercase | ✅ | |
| Lowercase | ✅ | |
| Capitalize | ✅ | |

### Indentation
| Feature | Status | Notes |
|---------|--------|-------|
| Indent | ✅ | Increase indentation |
| Outdent | ✅ | Decrease indentation |
| Reindent | ✅ | Auto-indent |
| Auto-indent on newline | ✅ | Configurable |

### Number Transformations
| Feature | Status | Notes |
|---------|--------|-------|
| Increase number | ✅ | Increment number at cursor |
| Decrease number | ✅ | Decrement number at cursor |

### Other Transformations
| Feature | Status | Notes |
|---------|--------|-------|
| Toggle comment | 🟡 | Debug command, partial |
| Surrounding pairs | ✅ | Auto-closing brackets |

---

## Recording/Macros

### Recording Features
| Feature | Status | Notes |
|---------|--------|-------|
| Toggle recording | ✅ | Start/stop recording |
| Named recordings | ✅ | Multiple named macros |
| Play recording | ✅ | Execute recorded events |
| Clear recording | ✅ | Delete recording |
| Force undo group | ✅ | Treat playback as single undo |

---

## Theming

### Theme Support
| Feature | Status | Notes |
|---------|--------|-------|
| Theme loading | ✅ | Syntect themes |
| Theme switching | ✅ | Runtime theme change |
| Available themes list | ✅ | |
| Theme changed notification | ✅ | |
| Custom themes | ✅ | User-provided themes |
| Theme directory | ✅ | `~/.config/xi/themes/` |

### Style System
| Feature | Status | Notes |
|---------|--------|-------|
| Foreground color | ✅ | 32-bit ARGB |
| Background color | ✅ | 32-bit ARGB |
| Font weight | ✅ | 100-900 |
| Italic | ✅ | |
| Underline | ✅ | |
| Style spans | ✅ | Efficient encoding |

---

## Experimental Features

### Fuchsia Integration
| Feature | Status | Notes |
|---------|--------|-------|
| Ledger sync | 🧪 | Behind `ledger` feature flag |
| Conflict resolution | 🧪 | CRDT-based merging |
| Distributed state | 🧪 | Cross-device sync |

### Debug Commands
| Feature | Status | Notes |
|---------|--------|-------|
| Debug rewrap | 🧪 | Force line rewrap |
| Debug wrap width | 🧪 | Show wrap calculations |
| Debug print spans | 🧪 | Print style spans |
| Debug toggle comment | 🧪 | Comment toggling |
| Debug get contents | 🧪 | Return buffer contents |

### Tracing
| Feature | Status | Notes |
|---------|--------|-------|
| Performance tracing | ✅ | Using `xi-trace` |
| Trace enable/disable | ✅ | Runtime control |
| Trace collection | ✅ | Gather from all peers |
| Trace save | ✅ | Save to file |

---

## Platform-Specific Features

### Windows
| Feature | Status | Notes |
|---------|--------|-------|
| Platform config overrides | ✅ | `windows.toml` |
| DirectWrite text rendering | 🟡 | Frontend-dependent |
| CRLF line endings | ✅ | Default on Windows |

### macOS
| Feature | Status | Notes |
|---------|--------|-------|
| Core Text rendering | 🟡 | Frontend-dependent |
| Cocoa integration | 🟡 | xi-mac frontend |
| LF line endings | ✅ | Default on Unix |

### Linux
| Feature | Status | Notes |
|---------|--------|-------|
| GTK+ frontends | 🟡 | Third-party |
| Terminal frontend | ✅ | xi-term |
| LF line endings | ✅ | Default on Unix |

---

## Performance Features

### Rope Data Structure
| Feature | Status | Notes |
|---------|--------|-------|
| O(log n) insertions | ✅ | B-tree based |
| O(log n) deletions | ✅ | |
| O(log n) substring | ✅ | |
| Copy-on-write | ✅ | Efficient snapshots |
| Large file support | ✅ | Tested with multi-MB files |
| Chunked storage | ✅ | ~1KB chunks |

### Incremental Rendering
| Feature | Status | Notes |
|---------|--------|-------|
| Delta-based updates | ✅ | Only changed lines sent |
| Client-side caching | ✅ | Frontend caches lines |
| Scroll window tracking | ✅ | Proactive updates |
| Minimal invalidation | ✅ | |

### Async Operations
| Feature | Status | Notes |
|---------|--------|-------|
| Async file I/O | ✅ | Non-blocking |
| Async plugin execution | ✅ | Separate threads |
| Async autosave | ✅ | Background snapshots |
| 16ms frame budget | ✅ | Target for all operations |

---

## View Management

### View Features
| Feature | Status | Notes |
|---------|--------|-------|
| Multiple views per buffer | ✅ | Share same buffer |
| View-specific state | ✅ | Selection, scroll, etc. |
| View size tracking | ✅ | For word wrap |
| Scroll position | ✅ | |
| Visible region tracking | ✅ | |
| Pending render flag | ✅ | Coalesce updates |

---

## Annotations System

### Annotation Types
| Feature | Status | Notes |
|---------|--------|-------|
| Selections | ✅ | Cursor positions |
| Find highlights | ✅ | Search results |
| Diagnostics | ✅ | LSP diagnostics |
| Custom annotations | ✅ | Plugin-defined |

### Annotation Features
| Feature | Status | Notes |
|---------|--------|-------|
| Range-based | ✅ | Start/end positions |
| Typed annotations | ✅ | Different types |
| Payload support | ✅ | Arbitrary JSON data |
| Efficient storage | ✅ | Span-based |

---

## Known Limitations

### Not Implemented
- ❌ Collaborative editing (infrastructure exists)
- ❌ Version control integration
- ❌ Debugger integration
- ❌ Interactive merging
- ❌ Source code navigation (beyond LSP)
- ❌ Package manager
- ❌ Built-in terminal
- ❌ Split views/panes
- ❌ Minimap
- ❌ Bracket matching visualization
- ❌ Code folding
- ❌ Snippets
- ❌ Auto-completion UI (backend exists)
- ❌ Diagnostic display UI (backend exists)

### Partial Implementations
- 🟡 LSP features (backend complete, UI partial)
- 🟡 File watching (detection works, reload partial)
- 🟡 Replace preserve case (defined but not implemented)
- 🟡 Auto-indent (basic implementation)
- 🟡 Comment toggling (debug command only)

---

## Feature Flags

### Cargo Features
| Flag | Purpose | Status |
|------|---------|--------|
| `ledger` | Fuchsia Ledger sync | 🧪 Experimental |
| `notify` | File watching | ✅ Default |
| `default` | Standard features | ✅ |

---

## Configuration File Formats

### Supported Formats
| Format | Purpose | Status |
|--------|---------|--------|
| TOML | User config files | ✅ |
| JSON | Internal representation | ✅ |
| Sublime Text syntax | Syntax definitions | ✅ |

---

## Summary Statistics

### Feature Completion
- **Fully Implemented**: ~150+ features
- **Partially Implemented**: ~10 features
- **Experimental**: ~5 features
- **Not Implemented**: ~15 planned features

### Code Statistics
- **Core Library**: ~30 modules
- **Rope Library**: ~14 modules
- **Plugin System**: 4 modules
- **RPC System**: Full JSON-RPC 2.0 implementation

---

## Future Considerations

While the project is discontinued, the following were planned or discussed:

1. **Collaborative Editing**: Full OT/CRDT implementation
2. **Better LSP Integration**: Complete UI for all LSP features
3. **Code Folding**: Syntax-aware folding
4. **Split Views**: Multiple panes
5. **Integrated Terminal**: Built-in terminal emulator
6. **Git Integration**: Native VCS support
7. **Snippet System**: Code templates
8. **Better Auto-indent**: Language-aware indentation
9. **Bracket Matching**: Visual bracket highlighting
10. **Minimap**: Code overview

---

## References

- **Frontend Protocol**: See `docs/docs/frontend-protocol.md`
- **Plugin Protocol**: See `docs/docs/plugin.md`
- **RPC Definitions**: See `rust/core-lib/src/rpc.rs`
- **Config System**: See `rust/core-lib/src/config.rs`
- **Edit Commands**: See `EditNotification` and `EditRequest` enums

---

**Note**: This document reflects the state of the xi-editor project as of its discontinuation. For a spiritual successor with similar goals, see the [Lapce editor](https://github.com/lapce/lapce).

**Last Updated**: 2025-11-30  
**For**: Xi-Editor Graduation Project Study
