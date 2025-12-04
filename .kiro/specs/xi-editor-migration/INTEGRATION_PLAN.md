# Xi-Editor Integration Plan

## 🎯 Overview

This document outlines the step-by-step plan for integrating xi-editor into Symphony IDE. The integration leverages xi-editor's existing 85% feature completeness and focuses on building the 15% integration layer needed to connect xi-editor with Symphony's architecture.

---

## 📊 Current State Analysis

### What We Have

#### In Xi-Editor (`apps/xi-editor/rust/`)
```
✅ rope/              - Rope data structure (100% complete)
✅ core-lib/          - Editor engine (100% complete)
✅ rpc/               - JSON-RPC protocol (100% complete)
✅ syntect-plugin/    - Syntax highlighting (100% complete)
✅ plugin-lib/        - Plugin system (100% complete)
✅ lsp-lib/           - LSP library (partial, 40% complete)
```

#### In Symphony Backend (`apps/backend/`)
```
⚠️ rope/              - Scaffold implementation (to be replaced)
✅ developed_extensions/lsp-manager/  - LSP manager (complete)
✅ core/              - Symphony core with IPC Bus
```

#### In Symphony Frontend (`packages/components/`)
```
✅ code-editor/       - Monaco Editor integration
⚠️ EditorPanel.jsx    - Current editor (to be replaced with xi-core bridge)
```

---

## 🔄 Integration Steps

### Phase 1: Foundation Setup (Week 1)
**Goal:** Set up xi-editor as a Symphony extension

**Status:** ✅ **COMPLETED** - Foundation established with xi-core engine integration

#### Step 1.1: Create Xi-Core Integration Crate ✅
**Location:** `apps/backend/xi_integration/`

**What was done:**
```rust
// Created xi-integration crate that wraps xi-core
// Structure:
xi_integration/
├── Cargo.toml          // Dependencies: xi-core-lib, xi-rope, xi-rpc, xi-trace
├── src/
│   ├── lib.rs          // Main integration with Editor
│   ├── types.rs        // Type definitions
│   ├── error.rs        // Error types
│   ├── ipc_bridge.rs   // IPC ↔ xi-RPC translation
│   └── buffer_manager.rs // Buffer lifecycle management
├── README.md           // Comprehensive documentation
├── CHANGELOG.md        // Version history
├── XI_CORE_API_RESEARCH.md  // API research
└── REFACTORING_SUMMARY.md   // Integration summary
```

**Key Achievement:** Now uses `xi_core_lib::Editor` internally, providing access to xi-core's CRDT engine for undo/redo.

**API Enhancement:** Explicitly re-exports `Editor` type for advanced use cases:
```rust
pub use xi_core_lib::{self, editor::Editor};
```

**Status:** ✅ Complete with 24 passing tests

---

#### Step 1.2: Add Xi-Editor Dependencies
**Location:** `apps/backend/Cargo.toml`

**What to do:**
```toml
[workspace]
members = [
    # ... existing members
    "developed_extensions/xi-core-bridge",
]

[dependencies]
xi-core-lib = { path = "../xi-editor/rust/core-lib" }
xi-rope = { path = "../xi-editor/rust/rope" }
xi-rpc = { path = "../xi-editor/rust/rpc" }
```

**Why:** Makes xi-editor crates available to Symphony backend.

**Status:** ❌ New configuration needed

---

#### Step 1.3: Deprecate Scaffold Rope
**Location:** `apps/backend/rope/`

**What to do:**
1. Add deprecation notice to `apps/backend/rope/README.md`
2. Update all imports to use `xi-rope` instead
3. Mark crate as deprecated in `Cargo.toml`

**Why:** Ensures we use xi-editor's battle-tested rope instead of scaffold.

**Status:** ❌ Migration needed

---

### Phase 2: Protocol Translation (Week 2)
**Goal:** Enable communication between Symphony IPC and xi-core

#### Step 2.1: Implement IPC → Xi-RPC Translator
**Location:** `apps/backend/developed_extensions/xi-core-bridge/src/translator.rs`

**What to do:**
```rust
// Translate Symphony IPC messages to xi-core RPC
pub struct IpcToXiTranslator {
    // Maps Symphony edit operations to xi-core edit operations
}

impl IpcToXiTranslator {
    // Symphony: { type: "insert", pos: 10, text: "hello" }
    // Xi-Core: { method: "edit", params: { ... } }
    pub fn translate_edit(&self, ipc_msg: IpcMessage) -> XiRpcRequest;
    
    // Symphony: { type: "delete", start: 5, end: 10 }
    // Xi-Core: { method: "edit", params: { ... } }
    pub fn translate_delete(&self, ipc_msg: IpcMessage) -> XiRpcRequest;
    
    // And so on for all operations...
}
```

**Why:** Symphony and xi-editor speak different protocols - we need a translator.

**Status:** ❌ New implementation needed

---

#### Step 2.2: Implement Xi-RPC → IPC Translator
**Location:** `apps/backend/developed_extensions/xi-core-bridge/src/translator.rs`

**What to do:**
```rust
// Translate xi-core notifications to Symphony IPC
pub struct XiToIpcTranslator {
    // Maps xi-core updates to Symphony IPC messages
}

impl XiToIpcTranslator {
    // Xi-Core: { method: "update", params: { ops: [...] } }
    // Symphony: { type: "content_update", changes: [...] }
    pub fn translate_update(&self, xi_msg: XiRpcNotification) -> IpcMessage;
    
    // Xi-Core: { method: "scroll_to", params: { line: 10 } }
    // Symphony: { type: "scroll", line: 10 }
    pub fn translate_scroll(&self, xi_msg: XiRpcNotification) -> IpcMessage;
}
```

**Why:** Xi-core sends updates back - we need to translate them to Symphony format.

**Status:** ❌ New implementation needed

---

### Phase 3: Buffer Management (Week 3)
**Goal:** Manage xi-core buffers through Symphony

#### Step 3.1: Implement Buffer Manager
**Location:** `apps/backend/developed_extensions/xi-core-bridge/src/buffer_manager.rs`

**What to do:**
```rust
pub struct XiBufferManager {
    xi_core: XiCore,
    buffers: HashMap<BufferId, XiBuffer>,
    views: HashMap<ViewId, XiView>,
}

impl XiBufferManager {
    // Create new buffer when file is opened
    pub async fn open_file(&mut self, path: &Path) -> Result<BufferId>;
    
    // Close buffer when file is closed
    pub async fn close_file(&mut self, buffer_id: BufferId) -> Result<()>;
    
    // Apply edit to buffer
    pub async fn apply_edit(&mut self, buffer_id: BufferId, edit: Edit) -> Result<()>;
    
    // Get buffer content
    pub async fn get_content(&self, buffer_id: BufferId) -> Result<String>;
}
```

**Why:** Symphony needs to manage multiple open files - this handles the lifecycle.

**Status:** ❌ New implementation needed

---

#### Step 3.2: Integrate with Symphony Core
**Location:** `apps/backend/core/src/editor_service.rs`

**What to do:**
```rust
// Replace current editor implementation with xi-core bridge
use xi_core_bridge::XiBufferManager;

pub struct EditorService {
    buffer_manager: XiBufferManager,  // Use xi-core instead of custom impl
    // ... rest of service
}
```

**Why:** Makes Symphony use xi-core as the actual editor engine.

**Status:** ❌ Integration needed

---

### Phase 4: Frontend Bridge (Week 4)
**Goal:** Connect Monaco Editor to xi-core backend

#### Step 4.1: Create Xi-Core Client
**Location:** `packages/components/code-editor/src/xi-core/client.ts`

**What to do:**
```typescript
// Client that talks to xi-core via Symphony IPC
export class XiCoreClient {
  private ipcClient: SymphonyIpcClient;
  
  // Send edit to xi-core
  async sendEdit(bufferId: string, edit: Edit): Promise<void> {
    await this.ipcClient.send('xi_core.edit', { bufferId, edit });
  }
  
  // Listen for updates from xi-core
  onUpdate(callback: (update: Update) => void): void {
    this.ipcClient.on('xi_core.update', callback);
  }
  
  // Request buffer content
  async getContent(bufferId: string): Promise<string> {
    return await this.ipcClient.request('xi_core.get_content', { bufferId });
  }
}
```

**Why:** Frontend needs a client to communicate with xi-core backend.

**Status:** ❌ New implementation needed

---

#### Step 4.2: Update Monaco Integration
**Location:** `packages/components/code-editor/src/EditorPanel.jsx`

**What to do:**
```typescript
// Replace direct Monaco editing with xi-core bridge
import { XiCoreClient } from './xi-core/client';

export const EditorPanel = () => {
  const xiClient = useXiCoreClient();
  
  // When user types in Monaco
  const handleChange = (value: string, event: monaco.editor.IModelContentChangedEvent) => {
    // Convert Monaco change to xi-core edit
    const edit = convertMonacoChangeToXiEdit(event);
    
    // Send to xi-core
    xiClient.sendEdit(currentBufferId, edit);
  };
  
  // When xi-core sends update
  useEffect(() => {
    xiClient.onUpdate((update) => {
      // Apply xi-core update to Monaco
      applyXiUpdateToMonaco(editor, update);
    });
  }, []);
};
```

**Why:** Makes Monaco display what xi-core has, not maintain its own state.

**Status:** ❌ Integration needed

---

### Phase 5: Feature Integration (Week 5-6)
**Goal:** Enable xi-editor features in Symphony

#### Step 5.1: Integrate Syntax Highlighting
**What to do:**
1. Load xi-editor's syntect plugin
2. Configure syntax highlighting themes
3. Send syntax spans from xi-core to Monaco
4. Apply syntax highlighting in Monaco

**Status:** ⚠️ Integration needed (xi-editor has it, just need to wire it up)

---

#### Step 5.2: Integrate Search & Replace
**What to do:**
1. Expose xi-core's find API through IPC
2. Create search UI in frontend
3. Display search results from xi-core
4. Handle replace operations

**Status:** ⚠️ Integration needed (xi-editor has it, just need to wire it up)

---

#### Step 5.3: Integrate Undo/Redo
**What to do:**
1. Map Ctrl+Z/Ctrl+Y to xi-core undo/redo
2. Disable Monaco's built-in undo/redo
3. Use xi-core's undo system exclusively

**Status:** ⚠️ Integration needed (xi-editor has it, just need to wire it up)

---

#### Step 5.4: Add Autosave
**Location:** `apps/backend/developed_extensions/xi-core-bridge/src/autosave.rs`

**What to do:**
```rust
pub struct AutosaveManager {
    interval: Duration,  // 30 seconds
    timer: Timer,
}

impl AutosaveManager {
    pub async fn start(&mut self, buffer_manager: &XiBufferManager) {
        loop {
            tokio::time::sleep(self.interval).await;
            
            // Save all dirty buffers
            for buffer_id in buffer_manager.dirty_buffers() {
                buffer_manager.save(buffer_id).await?;
            }
        }
    }
}
```

**Why:** Xi-editor has file I/O but not autosave timer - we add it.

**Status:** ❌ New feature needed

---

### Phase 6: LSP Integration (Week 7)
**Goal:** Connect LSP to xi-core

#### Step 6.1: Bridge LSP Manager to Xi-Core
**Location:** `apps/backend/developed_extensions/xi-core-bridge/src/lsp_bridge.rs`

**What to do:**
```rust
// Connect Symphony's lsp-manager to xi-core buffers
pub struct LspBridge {
    lsp_manager: LspManager,
    buffer_manager: XiBufferManager,
}

impl LspBridge {
    // When buffer changes, notify LSP
    pub async fn on_buffer_change(&self, buffer_id: BufferId, change: Change) {
        let content = self.buffer_manager.get_content(buffer_id).await?;
        self.lsp_manager.did_change(buffer_id, content).await?;
    }
    
    // When LSP sends diagnostics, forward to frontend
    pub async fn on_diagnostics(&self, diagnostics: Vec<Diagnostic>) {
        // Send via IPC to frontend
    }
}
```

**Why:** LSP needs to know about buffer changes from xi-core.

**Status:** ❌ Integration needed

---

### Phase 7: Testing & Optimization (Week 8)
**Goal:** Ensure everything works correctly

#### Step 7.1: Write Integration Tests
**What to do:**
1. Test IPC ↔ xi-RPC translation
2. Test buffer operations (open, edit, close)
3. Test undo/redo
4. Test search/replace
5. Test LSP integration

**Status:** ❌ Tests needed

---

#### Step 7.2: Performance Testing
**What to do:**
1. Test with large files (10MB+)
2. Measure edit latency (<16ms target)
3. Profile memory usage
4. Optimize hot paths

**Status:** ❌ Testing needed

---

#### Step 7.3: Remove Scaffold Code
**What to do:**
1. Delete `apps/backend/rope/` (replaced by xi-rope)
2. Remove old editor implementation
3. Clean up unused dependencies

**Status:** ❌ Cleanup needed

---

## 📋 Summary of Work

### New Code to Write (15%)
1. **Xi-Core Bridge Extension** - Main integration layer
2. **Protocol Translators** - IPC ↔ xi-RPC translation
3. **Buffer Manager** - Buffer lifecycle management
4. **Frontend Client** - TypeScript client for xi-core
5. **Monaco Integration** - Connect Monaco to xi-core
6. **Autosave Manager** - Periodic save timer
7. **LSP Bridge** - Connect LSP to xi-core
8. **Tests** - Integration and performance tests

### Existing Code to Use (85%)
1. **Xi-Rope** - Use directly from `apps/xi-editor/rust/rope/`
2. **Xi-Core** - Use directly from `apps/xi-editor/rust/core-lib/`
3. **Xi-RPC** - Use directly from `apps/xi-editor/rust/rpc/`
4. **Syntect Plugin** - Use directly from `apps/xi-editor/rust/syntect-plugin/`
5. **LSP Manager** - Already exists in `apps/backend/developed_extensions/lsp-manager/`
6. **Monaco Editor** - Already exists in `packages/components/code-editor/`

---

## 🎯 Key Decisions

### What We're NOT Building
❌ Rope data structure (use xi-rope)
❌ Editor engine (use xi-core)
❌ Undo/redo system (use xi-core's)
❌ Search/replace (use xi-core's)
❌ Syntax highlighting (use syntect-plugin)
❌ Plugin system (use xi-editor's)

### What We ARE Building
✅ IPC ↔ xi-RPC translation layer
✅ Buffer management wrapper
✅ Frontend client for xi-core
✅ Monaco ↔ xi-core bridge
✅ Autosave timer
✅ LSP integration bridge
✅ Integration tests

---

## 📊 Effort Estimation

| Phase | Effort | Status |
|-------|--------|--------|
| Phase 1: Foundation | 1 week | ❌ Not started |
| Phase 2: Protocol Translation | 1 week | ❌ Not started |
| Phase 3: Buffer Management | 1 week | ❌ Not started |
| Phase 4: Frontend Bridge | 1 week | ❌ Not started |
| Phase 5: Feature Integration | 2 weeks | ❌ Not started |
| Phase 6: LSP Integration | 1 week | ❌ Not started |
| Phase 7: Testing & Optimization | 1 week | ❌ Not started |
| **Total** | **8 weeks** | **0% complete** |

---

## 🚀 Next Steps

1. **Review this plan** - Make sure everyone agrees on the approach
2. **Start Phase 1** - Create xi-core-bridge extension crate
3. **Set up dependencies** - Add xi-editor crates to Symphony workspace
4. **Begin protocol translation** - Start building the IPC ↔ xi-RPC translator

---

## 📝 Notes

- **85% of the work is already done** by xi-editor
- **15% is integration work** to connect xi-editor to Symphony
- **No need to build editor from scratch** - just wrap and integrate
- **Focus on the bridge layer** - that's where the value is
