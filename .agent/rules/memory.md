---
trigger: always_on
---

## Symphony Backend Architecture Overview

**Architecture**: Two-Layer Architecture - XI-editor foundation + Symphony AIDE layer
**Foundation**: Built on [XI-editor](https://github.com/xi-editor/xi-editor) for text editing capabilities
**Location**: `apps/backend/`
**Status**: ✅ Foundation complete (Dec 2025), AIDE layer in planning

### Architecture Philosophy

Symphony's backend uses a **two-layer architecture**:

1. **XI-editor Foundation Layer** (✅ Implemented)
   - Battle-tested text editing core
   - Rope data structure, JSON-RPC, LSP, plugins
   - Proven, stable, high-performance foundation
   
2. **Symphony AIDE Layer** (🚧 To be built from scratch)
   - AI orchestration, workflow management, intelligent agents
   - Extension system, conductor, artifact management
   - All AI-first features are Symphony-native

### Current Backend Structure

```
apps/backend/
├── crates/                    # XI-editor packages (migrated & integrated)
│   ├── core/                  # Core editing and RPC
│   │   ├── xi-core-lib/      # ✅ Text editing engine with rope
│   │   ├── xi-rpc/           # ✅ JSON-RPC communication
│   │   └── xi-lsp-lib/       # ✅ Language Server Protocol
│   ├── plugins/               # Plugin infrastructure
│   │   ├── xi-plugin-lib/    # ✅ Plugin system
│   │   └── xi-syntect-plugin/ # ✅ Syntax highlighting
│   └── utils/                 # Utilities
│       ├── xi-rope/          # ✅ Rope data structure
│       ├── xi-unicode/       # ✅ Unicode handling
│       └── xi-trace/         # ✅ Logging/tracing
├── xi-core-reference/         # Preserved XI-editor code (reference only)
│   ├── python/               # Python bindings (for reference)
│   └── rust/experimental/    # Experimental features
├── src/
│   └── main.rs               # ✅ Symphony entry point
├── Cargo.toml                # ✅ Workspace configuration
└── ARCHITECTURE.md           # ✅ Detailed architecture docs
```

### What XI-editor Provides (✅ Implemented)

**Text Editing Core**:
- Rope data structure for efficient text manipulation
- Multi-cursor support, selections, editing operations
- Line wrapping, word boundaries, whitespace handling
- Optimized for large files (>100MB)

**Communication Layer**:
- JSON-RPC protocol (perfect for Symphony's architecture!)
- Async-first design, non-blocking operations (<16ms)
- Frontend-backend communication bridge
- Event system for reactive updates

**Plugin System**:
- Extension infrastructure with RPC-based communication
- Plugin lifecycle management (load, activate, deactivate, unload)
- Language-agnostic (plugins can be written in any language)
- Process isolation for out-of-process plugins

**Language Support**:
- LSP (Language Server Protocol) integration
- Syntax highlighting via TextMate grammars (Syntect)
- Foundation for code intelligence (autocomplete, diagnostics)

**Performance**:
- Async operations (all edits complete in <16ms)
- Efficient memory usage with rope structure
- Optimized for responsiveness (60 FPS target)
- Scalable architecture for thousands of files

### What Symphony Will Build (🚧 AIDE Layer - To Be Implemented)

**1. AI Orchestration System**
- **The Conductor**: Intelligent workflow orchestration
  - Agent coordination and management
  - Reinforcement learning for optimization
  - Workflow execution engine

**2. AIDE Features (The Pit)** - In-process Rust extensions
- `symphony-pool-manager`: AI model lifecycle management
  - Model state machine (Unloaded→Loading→Warming→Ready→Active)
  - Predictive pre-warming
  - Model caching (50-100ns allocation target)
  
- `symphony-dag-tracker`: Workflow DAG execution
  - Topological sort and parallel execution
  - State checkpointing
  - 10,000-node workflow support
  
- `symphony-artifact-store`: Content-addressable storage
  - Versioning and quality scoring
  - Tantivy-based search
  - 1-5ms store, 0.5-2ms retrieve targets
  
- `symphony-arbitration-engine`: Resource conflict resolution
  - Fairness policies
  - Priority management
  
- `symphony-stale-manager`: Intelligent lifecycle management
  - 1-7 days SSD → 8-30 days HDD → 30+ days cloud

**3. Extension Ecosystem (Orchestra Kit)**
- **Instruments** (🎻): AI/ML model extensions
- **Operators** (⚙️): Workflow utilities (file ops, git, data transforms)
- **Motifs** (🧩): UI enhancements (themes, components, layouts)
- Marketplace, installer, registry, security sandboxing

**4. Python Conductor Integration**
- PyO3 bindings for Python↔Rust communication (~0.01ms overhead)
- RL model integration (PyTorch/TensorFlow)
- Training data collection and reward calculation

**5. Symphony Infrastructure**
- **IPC Bus**: Inter-process communication (0.1-0.3ms latency target)
  - Binary serialization (MessagePack/bincode)
  - Unix sockets (Linux/macOS), Named pipes (Windows)
  - Process authentication and message validation
  
- **Bootstrap System**: Phased initialization
  - types→config→IPC→Pit→Conductor
  - Rollback on failure, health checking
  
- **Permissions**: Global RBAC, centralized authorization
- **Desktop/Server Apps**: Tauri desktop, HTTP server mode

### Technology Stack

**From XI-editor** (✅ In use):
- Rust (Edition 2021)
- Serde (serialization)
- Crossbeam (concurrency)
- Syntect (syntax highlighting)
- Regex, Notify (file watching)

**Symphony Additions** (📋 Planned):
- Tokio (async runtime) - already in workspace deps
- PyO3 (Python integration)
- Tantivy (full-text search for artifacts)
- Petgraph (graph algorithms for DAGs)
- Tauri (desktop app framework)
- MessagePack/Bincode (binary serialization)

### Build Status

✅ **Completed** (December 2025):
- [x] XI-editor packages migrated to `crates/`
- [x] Rust edition updated to 2021
- [x] Dependencies modernized (notify 6.1, syntect 5.2, etc.)
- [x] Workspace configuration with 8 crates
- [x] Symphony entry point (`src/main.rs`)
- [x] Build system working (`cargo build` successful)
- [x] Documentation created (ARCHITECTURE.md, README.md)

🚧 **Next Steps**:
1. Implement Symphony-specific crates on top of XI foundation
2. Build Python Conductor integration (PyO3)
3. Create AIDE layer packages (orchestration, artifacts, workflows)
4. Integrate with frontend via XI's JSON-RPC

### Performance Targets

**XI-editor Layer** (✅ Achieved):
- Text operations: <16ms (60 FPS)
- Large file handling: Efficient for files >100MB
- Memory usage: Optimized rope structure

**Symphony AIDE Layer** (🎯 Targets):
- Pool Manager: 50-100ns allocation (cache hit), >80% prediction accuracy
- DAG Tracker: 10,000-node workflows, parallel execution
- Artifact Store: 1-5ms store, 0.5-2ms retrieve, 20-40% dedup savings
- IPC Bus: 0.1-0.3ms message latency

### Design Principles

1. **Build on Proven Foundations**: Use XI-editor for text editing instead of reinventing the wheel
2. **Layer Separation**: Clear boundary between XI foundation and Symphony AIDE layer
3. **Performance First**: Maintain XI's sub-16ms operation targets
4. **Extensibility**: Plugin system for community contributions
5. **Type Safety**: Leverage Rust's type system for correctness
6. **Async-First**: Non-blocking operations throughout

-------

Frontend Architecture (apps/web)

Tech Stack
- React (with @vitejs/plugin-react), TypeScript, Vite
- Tailwind CSS via shared config (packages/config)
- ESLint via shared config (packages/config)
- PostCSS via shared config (packages/config)
- Vitest configured with jsdom environment
- Tauri API available (@tauri-apps/api)
- i18next + react-i18next for localization
- Eventing via emittery
- JSON-RPC via @open-rpc/client-js and simple-jsonrpc-js

Structure
- Entry: index.html → src/main.tsx → App.jsx
- Styling: src/index.css (Tailwind layers, CSS variables for theme, Inter & Fira Code fonts)
- Config files: vite.config.js, tsconfig.json (paths alias @/*), tailwind.config.js (re-export), postcss.config.js (re-export), eslint.config.js (re-export)
- Shadcn UI integration: components.json (style=new-york, baseColor=brand, alias components→@/components, utils→@symphony/shared)
- Directories: src/services/, src/state/, src/types/, src/utils/ (scaffolded), dist/ for build outputs

Key Behaviors
- main.tsx applies platform detection (sets <html platform="darwin|linux|win">)
- applyPatches hook run at startup (src/utils/patches)
- Tailwind theme tokens defined in :root and .dark scopes

Notes
- Workspace dependencies reference @symphony/* packages from monorepo
- Uses React 18-style root via createRoot
- Storybook artifacts present (ButtonSizes.stories.tsx)



----

# Symphony IDE

## Core Architecture

### Technology Stack

- **Backend**: Rust (microkernel)
- **Frontend**: React 19.1.0 + Vite
- **Desktop**: Tauri 1.x
- **Styling**: Tailwind CSS 3.3.2
- **Package Manager**: pnpm 9.1.2 (monorepo workspaces) & bun
- **Build Tools**: Jake, Turbo, Cargo, Vite

### Monorepo Structure

```
Symphony/
├── apps/
│   ├── backend/      # Rust workspace (Cargo)
│   ├── web/          # React/TS frontend
│   └── docs/         # Build/dev guides
├── packages/
│   ├── components/   # Reusable React components
│   │   ├── code-editor/
│   │   ├── commands/
│   ├── shared/       # Utilities & services
│   ├── config/       # ESLint, PostCSS configs
│   ├── ui/           # UI library
│   └── tsconfig/     # TS configs
└── docs/             # Conceptual docs

```

## Extension System Philosophy

### Current: Rust-Native Extensions

- All in Rust for perf, safety, type-safe comms.

### Three-Layer Extension Types (Conceptual)

1. **🎻 Instruments**: AI/ML models as extensions
2. **⚙️ Operators**: Workflow utils & data processing
3. **🧩 Addons (Motifs)**: UI enhancements & specialized editors

## Core Concepts & Philosophy

### 1. AI-First Development Environment (AIDE)

- AI agents as primary actors; foundational, not add-on.
- Extensible, learnable system.

### 3. Minimal Core Philosophy

**"Minimal Core, Maximum Potential"**

Only 6 built-ins:

1. **📝 Text Editor**: Clean, fast, multi-cursor
2. **🗂️ File Explorer**: Nav, basic ops
3. **🎨 Syntax Highlighting**: TextMate grammars
4. **⚙️ Settings System**: Prefs, config
5. **💻 Native Terminal**: Shell, process mgmt
6. **🔌 Extension System**: Gateway to all else

**Extensions for rest**: Debugging (DAP), SCM (Git/SVN), LSP, lint/format/test, AI tools.

### 4. Generic Primitives Approach

No hardcoded protocols; provides:

**Protocol Support**:

- Custom defs
- Transports: stdio, TCP, WebSocket
- Formats: JSON, MessagePack, etc.
- Bidirectional comms

**UI Extensibility**:

- Custom views
- Dynamic layout mods
- Sidebars/panels
- Overlays

**Process Management**:

- Spawn external tools
- Flexible comms patterns
- Resource control

## Orchestration System

### Smart Orchestration Components

**🎩 The Conductor**: Intelligent decisions

- Skips unneeded steps for simple projects
- Retries varied approaches
- Balances quality/speed
- Graceful error handling

**🎵 Melodies**: Composable Workflows

- Visual drag-drop composition
- Reusable templates
- Ex: User Idea → Mode 1 [Node 1] → Mode 2 [Node 2] → Mode 3 [Node 3] → ...
- Team-shareable

**🎛️ Harmony Board**: Visual Control

- Real-time workflow viz
- Agent monitoring
- Data flow tracking
- Issue detection/debug
- Progress indicators

### Adaptive Intelligence

- Conductor learns per project
- Pattern recog for optimization
- Improves via Function Quest training
- Personalizes to prefs/coding styles

## Documentation Structure

### Conceptual Docs (docs/)