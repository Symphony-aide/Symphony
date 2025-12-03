# Technology Stack & Build System

## Core Technologies

### Frontend Stack
- **React 19.1.0** - UI framework with latest features
- **TypeScript 5.8.3** - Type-safe development
- **Tailwind CSS 3.3.2** - Utility-first styling with animations
- **Vite** - Fast build tool and dev server
- **Jotai 2.12.5** - Atomic state management

### Backend Stack
- **Rust (Edition 2021)** - High-performance systems language
- **Cargo** - Rust package manager and build system
- **XI-editor** - Battle-tested text editing foundation
  - Rope data structure for efficient text manipulation
  - JSON-RPC for frontend-backend communication
  - LSP (Language Server Protocol) support
  - Syntect for syntax highlighting
- **Tokio** - Async runtime (to be added)
- **PyO3** - Python integration for AI Conductor (to be added)
- **Tauri** - Desktop application framework

### Development Tools
- **Monaco Editor** - Code editing capabilities
- **XTerm.js** - Terminal integration
- **Hotkeys.js** - Keyboard shortcuts
- **Storybook 9.0.16** - Component development and documentation

### Package Management
- **pnpm 9.1.2** - Fast, efficient package manager
- **Turbo 2.5.4** - Monorepo build system
- **Jake** - Task automation

### Code Quality
- **ESLint 9.30.1** - Linting with TypeScript support
- **Prettier 3.6.2** - Code formatting with Tailwind plugin
- **Husky** - Git hooks for quality gates
- **Jest 30.0.4** - Testing framework
- **Vitest** - Fast unit testing

## Common Commands

### Development
```bash
pnpm dev              # Start all apps in parallel
pnpm server_dev       # Development server
pnpm desktop          # Desktop app development
```

### Building
```bash
pnpm server_build     # Build server
pnpm build_desktop    # Build desktop app
pnpm sb:build         # Build Storybook
```

### Quality & Testing
```bash
pnpm test             # Run core and web tests
pnpm lint             # Lint and fix code
pnpm format           # Format code with Prettier
pnpm quality          # Run lint + format + quality check
```

### Storybook
```bash
pnpm sb               # Start Storybook dev server
pnpm sb:watch         # Watch mode with Tailwind
```

### Styling
```bash
pnpm tw               # Build Tailwind CSS
pnpm tw:watch         # Watch Tailwind changes
```

### Backend (Rust)
```bash
cd apps/backend
cargo build           # Build all crates
cargo build --release # Build optimized release
cargo run             # Run Symphony backend
cargo test            # Run tests
cargo check           # Fast compile check
cargo clippy          # Lint Rust code
cargo fmt             # Format Rust code
```

## Architecture Notes

- **Monorepo Structure** - Uses pnpm workspaces with Turbo for orchestration
- **Dual Language Stack** - TypeScript (frontend) + Rust (backend)
- **XI-editor Foundation** - Built on proven text editing core instead of from scratch
- **Two-Layer Backend**:
  - **XI-editor layer**: Text editing, RPC, LSP, plugins (implemented)
  - **Symphony AIDE layer**: AI orchestration, workflows (to be built)
- **Type Safety** - Full TypeScript coverage across all packages
- **Component-Driven** - Storybook for isolated component development
- **Quality Gates** - Automated linting, formatting, and testing in CI/CD

## Backend Build Status

✅ **Current Status** (as of Dec 2025):
- XI-editor packages migrated and building successfully
- Rust edition updated to 2021
- Dependencies modernized
- Symphony entry point created (`src/main.rs`)
- Ready for AIDE layer implementation

**Next Steps**:
1. Implement Symphony-specific crates on top of XI foundation
2. Build Python Conductor integration (PyO3)
3. Create AIDE layer packages (orchestration, artifacts, workflows)
4. Integrate with frontend via XI's JSON-RPC