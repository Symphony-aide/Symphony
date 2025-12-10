# Project Structure & Organization

## Symphony's Complex Architecture

Symphony is an AI-First Development Environment (AIDE) built on a sophisticated microkernel architecture with dual execution models and extensive Rust-based backend systems.

## High-Level Architecture

```
Symphony/
├── apps/                           # Applications Layer
│   ├── backend/                   # Two-Layer Rust Architecture
│   │   ├── crates/               # XI-editor Foundation (✅ Implemented)
│   │   │   ├── core/            # Text editing, RPC, LSP
│   │   │   ├── plugins/         # Plugin system & syntax highlighting
│   │   │   └── utils/           # Rope, Unicode, Tracing
│   │   ├── src/                 # Symphony Entry Point
│   │   │   └── main.rs          # Application bootstrap
│   │   ├── xi-core-reference/   # Reference materials
│   │   └── [Future]             # Symphony AIDE Layer (🚧 Planned)
│   │       ├── ...
│   ├── web/                      # React Frontend Application
│   └── docs/                     # Documentation Site
├── packages/                      # Frontend Component Ecosystem
│   ├── components/               # Specialized IDE Components
│   │   ├── code-editor/         # Monaco Editor Integration
│   │   ├── terminal/            # xterm.js Terminal Component
│   │   ├── file-explorer/       # File System Navigation
│   │   ├── syntax-highlighting/ # Language Support
│   │   └── ...                  # 8+ specialized components
│   ├── ui/                      # Design System (50+ components)
│   ├── shared/                  # Cross-Package Utilities
│   └── config/                  # Shared Build Configuration
└── docs/                        # Architecture Documentation
    ├── The AIDE.md             # AI-First Development Environment
    ├── The Conductor.md        # Orchestration Engine
    ├── The Orchestra Kit.md    # Extension Ecosystem
    └── ...                     # 15+ architectural concepts
```

## Backend Architecture (Two-Layer System)

Symphony's backend is built on a **two-layer architecture** combining the battle-tested XI-editor foundation with Symphony's custom AIDE features.

### Layer 1: XI-editor Foundation (✅ Implemented)

**Core Editing and RPC** (`crates/core/`)
- **xi-core-lib/**: Text editing engine with rope data structure
- **xi-rpc/**: JSON-RPC communication protocol
- **xi-lsp-lib/**: Language Server Protocol integration

**Plugin Infrastructure** (`crates/plugins/`)
- **xi-plugin-lib/**: Plugin system and lifecycle management
- **xi-syntect-plugin/**: Syntax highlighting via TextMate grammars

**Utilities** (`crates/utils/`)
- **xi-rope/**: Efficient rope data structure for text manipulation
- **xi-unicode/**: Unicode handling and text processing
- **xi-trace/**: Logging and tracing infrastructure

**Reference Materials** (`xi-core-reference/`)
- Preserved XI-editor source for reference and experimental features

### Layer 2: Symphony AIDE Features (🚧 Planned)

**The Conductor System** (To be implemented)
- **symphony-conductor/**: AI workflow orchestration engine
- **symphony-python-bridge/**: PyO3 bindings for Python integration
- Reinforcement learning integration via Function Quest Game (FQG)

**The Pit (Infrastructure Extensions)** (To be implemented)
- **symphony-pool-manager/**: AI model lifecycle and resource management
- **symphony-dag-tracker/**: Workflow DAG execution and dependency tracking
- **symphony-artifact-store/**: Content-addressable storage with versioning
- **symphony-arbitration-engine/**: Conflict resolution and decision-making
- **symphony-stale-manager/**: Training data curation and cleanup

**Orchestra Kit (Extension Ecosystem)** (To be implemented)
- **symphony-extensions/instruments/**: AI/ML model extensions (🎻)
- **symphony-extensions/operators/**: Workflow utility extensions (⚙️)
- **symphony-extensions/motifs/**: UI enhancement extensions (🧩)
- Extension marketplace, installer, and lifecycle management

**IPC Communication** (To be implemented)
- **symphony-ipc/**: Inter-process communication bus
- Binary serialization protocols (MessagePack/Bincode)
- Unix sockets / Named pipes transport layer
- Security and sandboxing infrastructure

### Current Implementation Status

**✅ Completed (December 2025)**:
- XI-editor packages migrated and integrated
- Rust edition updated to 2021
- Dependencies modernized
- Workspace configuration established
- Symphony entry point created
- Build system operational

**🚧 In Progress**:
- Symphony-specific crates development
- Python Conductor integration
- AIDE layer implementation
- Frontend-backend JSON-RPC integration

**📋 Planned**:
- Extension ecosystem infrastructure
- Workflow orchestration engine
- Artifact management system
- AI model integration layer

## Frontend Architecture

### Main Application (`apps/web/`)
- **src/services/**: Backend communication services
- **src/state/**: Application state management (Jotai)
- **src/types/**: TypeScript type definitions
- **src/utils/**: Utility functions and helpers

### Component Packages (`packages/components/`)
Each component is a separate package with its own build system:
- **code-editor/**: Monaco Editor integration with Symphony
- **terminal/**: xterm.js terminal component with IPC
- **file-explorer/**: File system navigation with virtual file system
- **syntax-highlighting/**: Language-aware syntax highlighting
- **commands/**: Command palette and execution
- **settings/**: Configuration UI components
- **statusbar/**: IDE status bar component
- **outlineview/**: Code outline and navigation

### UI System (`packages/ui/`)
Complete design system with 50+ components:
- Shadcn/ui-based component library
- Tailwind CSS styling system
- Accessibility-compliant components
- Theme system integration

## Execution Models

### In-Process Extensions (The Pit)
Infrastructure extensions run within the Conductor process:
- **Performance**: Microsecond-level operations
- **Integration**: Direct memory access and shared state
- **Components**: Pool Manager, DAG Tracker, Artifact Store, Arbitration Engine, Stale Manager

### Out-of-Process Extensions (UFE)
User-facing extensions run in isolated processes:
- **Safety**: Crash isolation and memory protection
- **Flexibility**: Hot-swap and independent updates
- **Components**: Instruments (AI models), Operators (utilities), Addons (UI)

## Build System Architecture

### Rust Workspace
- **Cargo.toml**: XI-editor crates (8 currently) + Symphony crates (planned)
- **Profile Optimization**: Multiple build profiles (dev, release, release-small)
- **Linting**: Strict Clippy rules and security auditing
- **Testing**: Comprehensive test coverage with Tarpaulin
- **Edition**: Rust 2021 with modern dependency versions

### Frontend Monorepo
- **pnpm Workspaces**: Efficient package management
- **Turborepo**: Parallel build pipeline
- **Jake Tasks**: Custom build orchestration
- **Vite**: Fast development and production builds

## Development Workflow

### Backend Development
1. **XI-editor Foundation**: Work with proven text editing core in `apps/backend/crates/`
2. **Symphony AIDE Layer**: Develop new features on top of XI-editor foundation
3. **Extension Development**: Create new crates for Symphony-specific functionality
4. **Testing**: Comprehensive unit and integration tests with cargo test

### Frontend Development
1. **Component Development**: Work in `packages/components/` with Storybook
2. **Application Development**: Main app in `apps/web/`
3. **UI Development**: Design system in `packages/ui/`
4. **Integration**: Connect frontend to Rust backend via IPC

### Full System Development
1. **Server Mode**: `pnpm server_dev` - Build all + run server
2. **Desktop Mode**: `pnpm desktop` - Run Tauri desktop app
3. **Testing**: `pnpm test` - Run all test suites
4. **Quality**: `pnpm quality` - Lint, format, and validate

## Key Architectural Principles

### Two-Layer Architecture
- **Build on Proven Foundations**: XI-editor provides battle-tested text editing
- **Layer Separation**: Clear boundary between XI and Symphony AIDE layers
- **Incremental Development**: Foundation complete, AIDE features being built on top

### Microkernel Design
- Minimal core with maximum extensibility
- Clear separation between infrastructure and user extensions
- Fault isolation and independent component updates

### AI-First Architecture
- Every component designed for AI collaboration
- Artifact-based communication between agents
- Orchestrated workflows rather than manual tool usage

### Security by Design
- Sandboxed extension execution (planned)
- Granular permission system (planned)
- Secure IPC communication protocols (planned)

### Performance Optimization
- XI-editor's sub-16ms operation targets maintained
- Dual execution models for optimal performance/safety trade-offs (planned)
- Rust for system-level performance
- React for responsive user interfaces