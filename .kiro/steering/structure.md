# Project Structure & Organization

## Symphony's Complex Architecture

Symphony is an AI-First Development Environment (AIDE) built on a sophisticated microkernel architecture with dual execution models and extensive Rust-based backend systems.

## High-Level Architecture

```
Symphony/
├── apps/                           # Applications Layer
│   ├── backend/                   # Rust Microkernel System (40+ crates)
│   │   ├── core/                  # JSON-RPC Core Server
│   │   ├── conductor/             # Python Integration & Orchestration
│   │   ├── extension/             # Extension System Architecture
│   │   ├── ipc_bus/              # Inter-Process Communication
│   │   ├── kit/                  # Orchestra Kit (Extension Ecosystem)
│   │   ├── orchestration/        # Workflow Engine
│   │   ├── bootstrap/            # System Initialization
│   │   └── ...                   # 20+ specialized subsystems
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

## Backend Architecture (Rust Workspace)

### Core Foundation
- **core/**: JSON-RPC server with HTTP/WebSocket support
- **types/**: Shared type definitions across all crates
- **config/**: Configuration management system
- **core_api/**: Public API traits and interfaces

### The Conductor System
- **conductor/bindings/**: PyO3 Python integration bindings
- **conductor/orchestration_bridge/**: Bridge between Python and Rust
- **conductor/extension_proxy/**: Extension communication proxy

### Extension Architecture
- **extension/layers/aide/pit/**: In-Process AIDE extensions (5 crates)
  - **core/**: AIDE pit core functionality
  - **pool_manager/**: Resource pool management
  - **dag_tracker/**: Dependency graph tracking
  - **artifact_store/**: Artifact storage and retrieval
  - **arbitration_engine/**: Conflict resolution
  - **stale_manager/**: Cleanup and lifecycle management
- **extension/layers/ide/**: IDE-specific extensions (3 crates)
  - **core/**: IDE layer core
  - **ui_bridge/**: UI integration bridge
  - **virtual_dom/**: Virtual DOM implementation
- **extension/sdk/**: Extension SDK (4 crates)
  - **core/**: SDK core functionality
  - **testing/**: Testing framework for extensions
  - **carets/**: Cursor and selection management
  - **metrics/**: Performance and usage metrics

### IPC Communication Backbone
- **ipc_bus/**: Main IPC coordination
- **ipc_bus/protocol/**: Communication protocol definitions
- **ipc_bus/transport/**: Transport layer implementation
- **ipc_bus/security/**: Security and sandboxing

### Orchestra Kit (Extension Ecosystem)
- **kit/core/**: Orchestra Kit core functionality
- **kit/harmony_board/**: Visual workflow composer
- **kit/instruments/**: AI/ML model extensions
- **kit/operators/**: Workflow utility extensions
- **kit/motifs/**: UI enhancement extensions (Addons)
- **kit/marketplace/**: Extension marketplace
- **kit/installer/**: Extension installation system
- **kit/lifecycle/**: Extension lifecycle management
- **kit/registry/**: Extension registry and discovery
- **kit/security/**: Extension security and sandboxing
- **kit/manifest/**: Extension manifest system

### Orchestration Engine
- **orchestration/core/**: Workflow orchestration core
- **orchestration/melody_engine/**: Visual workflow engine

### System Infrastructure
- **bootstrap/**: System initialization (3 crates)
  - **core/**: Bootstrap core
  - **phase_manager/**: Initialization phase management
  - **health_checker/**: System health monitoring
- **permissions/**: Permission and security management
- **logging/**: Structured logging system
- **hooks/**: Event hook system
- **terminal/**: Terminal integration
- **crosspty/**: Cross-platform PTY implementation

### Applications
- **server/**: Main web server application
- **desktop/**: Tauri desktop application
- **desktop/src-tauri/**: Tauri-specific configuration

### Developed Extensions (Examples)
- **developed_extensions/git/**: Git integration extension
- **developed_extensions/typescript-lsp/**: TypeScript language server
- **developed_extensions/native-shell/**: Native shell integration

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
- **Cargo.toml**: 40+ member crates with shared dependencies
- **Profile Optimization**: Multiple build profiles (dev, release, release-small)
- **Linting**: Strict Clippy rules and security auditing
- **Testing**: Comprehensive test coverage with Tarpaulin

### Frontend Monorepo
- **pnpm Workspaces**: Efficient package management
- **Turborepo**: Parallel build pipeline
- **Jake Tasks**: Custom build orchestration
- **Vite**: Fast development and production builds

## Development Workflow

### Backend Development
1. **Rust Development**: Work in `apps/backend/` with cargo commands
2. **Extension Development**: Create new crates in appropriate subsystems
3. **IPC Development**: Use `ipc_bus/` for communication protocols
4. **Testing**: Comprehensive unit and integration tests

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

### Microkernel Design
- Minimal core with maximum extensibility
- Clear separation between infrastructure and user extensions
- Fault isolation and independent component updates

### AI-First Architecture
- Every component designed for AI collaboration
- Artifact-based communication between agents
- Orchestrated workflows rather than manual tool usage

### Security by Design
- Sandboxed extension execution
- Granular permission system
- Secure IPC communication protocols

### Performance Optimization
- Dual execution models for optimal performance/safety trade-offs
- Rust for system-level performance
- React for responsive user interfaces