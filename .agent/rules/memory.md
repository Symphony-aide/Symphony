---
trigger: always_on
---

## Symphony Backend Architecture Overview

**Total Packages**: 46 Rust packages organized in 11 categories
**Architecture**: Dual Ensemble Architecture (DEA) with Python Conductor + Rust infrastructure
**Location**: `apps/backend/`

### Core Architecture Layers

**1. Foundation Layer (4 packages)**
- `core`: JSON-RPC server, orchestration host (Graviton fork → Symphony transformation)
- `types`: Central type repository, zero-cost abstractions, shared across all 46 packages
- `config`: Configuration management (TOML/JSON/YAML), hot-reload, hierarchical merging
- `core_api`: Public API traits (Extension, Persistor, messaging protocols)

**2. AIDE Layer - The Pit (6 packages)** - In-process Rust extensions (50-100ns latency)
- `extension/layers/aide/pit/core`: Base infrastructure for all Pit extensions, PyO3 FFI helpers
- `extension/layers/aide/pit/pool_manager`: AI model lifecycle (Unloaded→Loading→Warming→Ready→Active), predictive pre-warming
- `extension/layers/aide/pit/dag_tracker`: Workflow DAG execution, topological sort, parallel execution, checkpointing
- `extension/layers/aide/pit/artifact_store`: Content-addressable storage, versioning, quality scoring, Tantivy search
- `extension/layers/aide/pit/arbitration_engine`: Resource conflict resolution, fairness policies
- `extension/layers/aide/pit/stale_manager`: Lifecycle management (1-7 days SSD → 8-30 days HDD → 30+ days cloud)

**3. IDE Layer (3 packages)**
- `extension/layers/ide/core`: Traditional IDE features (file ops, LSP, syntax highlighting)
- `extension/layers/ide/ui_bridge`: Backend-frontend communication bridge
- `extension/layers/ide/virtual_dom`: Rust→React UI generation, VirtualNode trees, Shadcn mapping

**4. Extension SDK (4 packages)**
- `extension/sdk/core`: Base Extension trait, manifest builder
- `extension/sdk/testing`: Mocks, fixtures, integration testing
- `extension/sdk/carets`: CLI tools (`carets new`, `carets publish`), templates, hot-reload
- `extension/sdk/metrics`: Performance monitoring, Prometheus/Grafana export

**5. Conductor Integration (3 packages)** - Python↔Rust bridge
- `conductor/bindings`: PyO3 FFI bindings, type conversion, ~0.01ms overhead
- `conductor/orchestration_bridge`: RL model↔workflow system, reward calculation, training data
- `conductor/extension_proxy`: Unified interface hiding in-process vs out-of-process differences

**6. Bootstrap System (3 packages)**
- `bootstrap/core`: Phased initialization (types→config→IPC→Pit→Conductor), rollback on failure
- `bootstrap/phase_manager`: Stage-gate process, parallel init within phases
- `bootstrap/health_checker`: Post-init validation, readiness probes

**7. IPC Communication Backbone (4 packages)** - Hardcoded Rust (not extension)
- `ipc_bus`: Core message bus, process lifecycle, 0.1-0.3ms latency target
- `ipc_bus/protocol`: Binary serialization (MessagePack/bincode), message framing
- `ipc_bus/transport`: Unix sockets (Linux/macOS), Named pipes (Windows), shared memory
- `ipc_bus/security`: Process authentication, message validation, rate limiting

**8. Orchestration Engine (2 packages)**
- `orchestration/core`: Workflow execution (Maestro Mode=RL, Manual Mode=user-driven)
- `orchestration/melody_engine`: Visual workflow composer (n8n-style), reusable templates

**9. Orchestra Kit - Extension Ecosystem (11 packages)**
- `kit/core`: Extension types (Instruments=AI, Operators=workflows, Motifs=UI)
- `kit/harmony_board`: Visual workflow designer, real-time execution visualization
- `kit/instruments`: AI/ML model extensions (🎻)
- `kit/operators`: Workflow utilities (⚙️ file ops, git, data transforms)
- `kit/motifs`: UI/UX addons (🧩 themes, components, layouts)
- `kit/marketplace`: Extension discovery, browsing, ratings
- `kit/installer`: Dependency resolution, signature verification, rollback
- `kit/lifecycle`: "Chambering" state machine (Installed→Loaded→Activated→Running)
- `kit/registry`: Central extension registry, semantic versioning
- `kit/security`: Sandboxing, capability-based permissions, resource limits
- `kit/manifest`: Symphony.toml parser/validator

**10. Infrastructure Services (3 packages)**
- `permissions`: Global RBAC, centralized authorization, audit trail
- `logging`: Structured logging (JSON), distributed tracing, spans/events
- `hooks`: Desktop integration (notifications, file associations, symphony:// protocol)

**11. Applications (3 packages)**
- `desktop`: Tauri app (native window + webview), cross-platform
- `server`: HTTP server mode, WebSocket, multi-client, remote development
- `terminal`: Cross-platform PTY (ConPTY/PTY), xterm.js integration

### Key Architectural Decisions

**Execution Models**:
- **In-Process (The Pit)**: 5 Rust extensions, 50-100ns latency, 1M+ ops/sec
- **Out-of-Process (UFE)**: User extensions, 0.1-0.5ms latency, isolated processes
- **Python Conductor**: RL orchestration, 0.5-2ms latency, embedded via PyO3

**Performance Targets**:
- Pool Manager: 50-100ns allocation (cache hit), >80% prediction accuracy
- DAG Tracker: 10,000-node workflows, parallel execution
- Artifact Store: 1-5ms store, 0.5-2ms retrieve, 20-40% dedup savings
- IPC Bus: 0.1-0.3ms message latency
- Virtual DOM: 1-5ms serialization

**Technology Stack**:
- Rust: All infrastructure (Tokio async, petgraph, Tantivy, PyO3)
- Python: Conductor (PyTorch/TensorFlow for RL)
- Tauri: Desktop app
- React + Shadcn: Frontend UI

### Current Implementation Status
All 46 packages scaffolded as dummy packages. Only `core` and `core_api` have real implementation (Graviton fork). Ready for phased implementation starting with foundation layer (types, config, IPC).

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