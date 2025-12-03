# Xi-Editor Integration Architecture

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                            │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Monaco Editor                             │  │
│  │  - Display text                                              │  │
│  │  - Handle user input                                         │  │
│  │  - Render syntax highlighting                                │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              ↕                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Xi-Core Client (NEW)                            │  │
│  │  - Send edits to backend                                     │  │
│  │  - Receive updates from xi-core                              │  │
│  │  - Translate Monaco events ↔ xi-core protocol                │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              ↕
                    Symphony IPC Bus
                              ↕
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND (Rust)                                   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │          Xi-Core Bridge Extension (NEW)                      │  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │  IPC ↔ Xi-RPC Translator (NEW)                        │ │  │
│  │  │  - Translate Symphony IPC → xi-core RPC                │ │  │
│  │  │  - Translate xi-core RPC → Symphony IPC                │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │  Buffer Manager (NEW)                                  │ │  │
│  │  │  - Manage buffer lifecycle                             │ │  │
│  │  │  - Track open files                                    │ │  │
│  │  │  - Handle buffer operations                            │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │  Autosave Manager (NEW)                                │ │  │
│  │  │  - Periodic save timer                                 │ │  │
│  │  │  - Save dirty buffers                                  │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              ↕                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Xi-Editor Core (EXISTING ✅)                    │  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │  Xi-Core (xi-core-lib) ✅                             │ │  │
│  │  │  - Editor engine                                       │ │  │
│  │  │  - Buffer management                                   │ │  │
│  │  │  - Undo/redo system                                    │ │  │
│  │  │  - Multi-cursor support                                │ │  │
│  │  │  - Search & replace                                    │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │  Xi-Rope (xi-rope) ✅                                 │ │  │
│  │  │  - Rope data structure                                 │ │  │
│  │  │  - Copy-on-write semantics                             │ │  │
│  │  │  - Efficient large file handling                       │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │  Syntect Plugin (syntect-plugin) ✅                   │ │  │
│  │  │  - Syntax highlighting                                 │ │  │
│  │  │  - 100+ languages                                      │ │  │
│  │  │  - Theme support                                       │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │  Xi-RPC (xi-rpc) ✅                                   │ │  │
│  │  │  - JSON-RPC protocol                                   │ │  │
│  │  │  - Request/response handling                           │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              ↕                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │          LSP Manager (EXISTING ✅)                           │  │
│  │  - Manage language servers                                   │  │
│  │  - Handle LSP protocol                                       │  │
│  │  - Send diagnostics to frontend                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Examples

### Example 1: User Types in Editor

```
1. User types "hello" in Monaco
   ↓
2. Monaco fires onChange event
   ↓
3. Xi-Core Client converts to edit:
   { type: "insert", pos: 10, text: "hello" }
   ↓
4. Send via Symphony IPC Bus
   ↓
5. Xi-Core Bridge receives IPC message
   ↓
6. Translator converts to xi-RPC:
   { method: "edit", params: { ... } }
   ↓
7. Xi-Core processes edit
   - Updates rope
   - Generates undo entry
   - Computes syntax highlighting
   ↓
8. Xi-Core sends update notification
   ↓
9. Translator converts to Symphony IPC
   ↓
10. Frontend receives update
    ↓
11. Monaco applies update
    (if needed - usually no-op since user already typed)
```

---

### Example 2: Undo Operation

```
1. User presses Ctrl+Z
   ↓
2. Xi-Core Client sends undo command
   ↓
3. Symphony IPC Bus
   ↓
4. Xi-Core Bridge receives command
   ↓
5. Translator converts to xi-RPC:
   { method: "undo" }
   ↓
6. Xi-Core processes undo
   - Restores previous rope state
   - Updates view
   ↓
7. Xi-Core sends update with full content
   ↓
8. Translator converts to Symphony IPC
   ↓
9. Frontend receives update
   ↓
10. Monaco replaces content with undone version
```

---

### Example 3: Search Operation

```
1. User enters search query "function"
   ↓
2. Xi-Core Client sends find command
   ↓
3. Symphony IPC Bus
   ↓
4. Xi-Core Bridge receives command
   ↓
5. Translator converts to xi-RPC:
   { method: "find", params: { query: "function", case_sensitive: false } }
   ↓
6. Xi-Core searches rope
   - Uses regex engine
   - Finds all matches
   ↓
7. Xi-Core sends find results
   ↓
8. Translator converts to Symphony IPC
   ↓
9. Frontend receives results
   ↓
10. Monaco highlights all matches
```

---

### Example 4: LSP Diagnostics

```
1. User saves file
   ↓
2. Xi-Core saves to disk
   ↓
3. LSP Manager detects file change
   ↓
4. LSP Manager sends file to language server
   ↓
5. Language server analyzes code
   ↓
6. Language server sends diagnostics
   ↓
7. LSP Manager receives diagnostics
   ↓
8. LSP Manager sends via Symphony IPC
   ↓
9. Frontend receives diagnostics
   ↓
10. Monaco displays error markers
```

---

## 📦 Component Breakdown

### NEW Components (15% of work)

#### 1. Xi-Core Bridge Extension
**Location:** `apps/backend/developed_extensions/xi-core-bridge/`
**Purpose:** Main integration layer between Symphony and xi-editor
**Size:** ~2000 lines of Rust

**Files:**
```
xi-core-bridge/
├── Cargo.toml
├── src/
│   ├── lib.rs              (200 lines) - Extension entry point
│   ├── bridge.rs           (400 lines) - Xi-Core wrapper
│   ├── translator.rs       (600 lines) - Protocol translation
│   ├── buffer_manager.rs   (400 lines) - Buffer lifecycle
│   ├── autosave.rs         (200 lines) - Autosave timer
│   └── lsp_bridge.rs       (200 lines) - LSP integration
```

---

#### 2. Xi-Core Client (Frontend)
**Location:** `packages/components/code-editor/src/xi-core/`
**Purpose:** Frontend client for xi-core
**Size:** ~800 lines of TypeScript

**Files:**
```
xi-core/
├── client.ts               (300 lines) - Main client
├── translator.ts           (200 lines) - Event translation
├── types.ts                (100 lines) - Type definitions
└── hooks.ts                (200 lines) - React hooks
```

---

#### 3. Monaco Integration Updates
**Location:** `packages/components/code-editor/src/`
**Purpose:** Connect Monaco to xi-core
**Size:** ~400 lines of TypeScript (modifications)

**Files:**
```
EditorPanel.jsx             (modify ~200 lines)
monacoConfig.ts             (modify ~100 lines)
monacoInitializer.ts        (modify ~100 lines)
```

---

### EXISTING Components (85% of work - already done!)

#### 1. Xi-Rope
**Location:** `apps/xi-editor/rust/rope/`
**Status:** ✅ Complete, battle-tested
**Size:** ~3000 lines of Rust
**Use:** Direct dependency, no modifications needed

---

#### 2. Xi-Core
**Location:** `apps/xi-editor/rust/core-lib/`
**Status:** ✅ Complete, battle-tested
**Size:** ~15000 lines of Rust
**Use:** Direct dependency, no modifications needed

---

#### 3. Xi-RPC
**Location:** `apps/xi-editor/rust/rpc/`
**Status:** ✅ Complete, battle-tested
**Size:** ~1000 lines of Rust
**Use:** Direct dependency, no modifications needed

---

#### 4. Syntect Plugin
**Location:** `apps/xi-editor/rust/syntect-plugin/`
**Status:** ✅ Complete, battle-tested
**Size:** ~2000 lines of Rust
**Use:** Load as plugin, no modifications needed

---

#### 5. LSP Manager
**Location:** `apps/backend/developed_extensions/lsp-manager/`
**Status:** ✅ Complete, already implemented
**Size:** ~3000 lines of Rust
**Use:** Connect to xi-core via bridge

---

## 🎯 Key Integration Points

### 1. Protocol Translation
**Challenge:** Symphony IPC ≠ Xi-RPC
**Solution:** Translator layer that converts between protocols

**Example:**
```rust
// Symphony IPC message
{
  "type": "edit",
  "buffer_id": "abc123",
  "operation": {
    "type": "insert",
    "position": 10,
    "text": "hello"
  }
}

// Translates to Xi-RPC
{
  "method": "edit",
  "params": {
    "view_id": "abc123",
    "delta": {
      "ops": [
        { "op": "copy", "n": 10 },
        { "op": "insert", "chars": "hello" }
      ]
    }
  }
}
```

---

### 2. Buffer Lifecycle
**Challenge:** Symphony manages files, xi-core manages buffers
**Solution:** Buffer manager that maps files to xi-core buffers

**Mapping:**
```
Symphony File ID → Xi-Core Buffer ID → Xi-Core View ID
"file://path/to/file.ts" → buffer_123 → view_456
```

---

### 3. State Synchronization
**Challenge:** Monaco has state, xi-core has state
**Solution:** Xi-core is source of truth, Monaco is display only

**Rule:**
- ✅ Xi-core owns the text content
- ✅ Monaco displays what xi-core says
- ❌ Monaco does NOT maintain its own undo/redo
- ❌ Monaco does NOT maintain its own edit history

---

## 📊 Complexity Analysis

### Low Complexity (Easy)
- ✅ Adding xi-editor dependencies
- ✅ Creating extension crate structure
- ✅ Deprecating scaffold rope
- ✅ Loading syntect plugin

### Medium Complexity (Moderate)
- ⚠️ Protocol translation (well-defined, just tedious)
- ⚠️ Buffer manager (straightforward mapping)
- ⚠️ Frontend client (standard IPC client)
- ⚠️ Autosave timer (simple periodic task)

### High Complexity (Challenging)
- 🔴 Monaco integration (need to disable Monaco's built-in features)
- 🔴 State synchronization (ensure Monaco and xi-core stay in sync)
- 🔴 LSP bridge (coordinate between LSP and xi-core)

---

## 🚀 Success Criteria

### Phase 1 Success
- [ ] Xi-core-bridge extension compiles
- [ ] Xi-editor dependencies resolve
- [ ] Scaffold rope deprecated

### Phase 2 Success
- [ ] Can send edit from frontend to xi-core
- [ ] Can receive update from xi-core to frontend
- [ ] Protocol translation works both ways

### Phase 3 Success
- [ ] Can open file in xi-core
- [ ] Can edit file through xi-core
- [ ] Can close file in xi-core

### Phase 4 Success
- [ ] Monaco displays xi-core content
- [ ] User edits go through xi-core
- [ ] Monaco updates when xi-core changes

### Phase 5 Success
- [ ] Syntax highlighting works
- [ ] Search/replace works
- [ ] Undo/redo works
- [ ] Autosave works

### Phase 6 Success
- [ ] LSP diagnostics appear in editor
- [ ] LSP completions work
- [ ] LSP hover works

### Phase 7 Success
- [ ] All tests pass
- [ ] Performance meets targets (<16ms edits)
- [ ] Scaffold code removed

---

## 📝 Summary

**What we're building:** A thin integration layer (15% of code)
**What we're using:** Xi-editor's battle-tested components (85% of code)
**Time estimate:** 8 weeks
**Risk level:** Low (most code already exists and works)
**Benefit:** Production-ready editor with minimal development effort
