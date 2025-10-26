# Technology Stack & Build System

## Core Architecture Technologies

### Backend: Rust Microkernel System
- **Rust 1.70+** - Systems programming language for performance and safety
- **40+ Rust Crates** - Modular workspace architecture
- **PyO3 Bindings** - Python-Rust integration for Conductor
- **Tokio** - Async runtime for high-performance concurrency
- **Serde** - Serialization framework for data exchange
- **Tauri** - Cross-platform desktop application framework

### Frontend: React Ecosystem
- **React 19.1.0** - Latest UI framework with concurrent features
- **TypeScript 5.8.3** - Type-safe development across all packages
- **Tailwind CSS 3.3.2** - Utility-first styling with animations
- **Vite** - Lightning-fast build tool and dev server
- **Jotai 2.12.5** - Atomic state management for complex UI state

### AI/ML Integration
- **Python 3.8+** - Conductor core and AI model integration
- **Function Quest Game (FQG)** - Reinforcement learning training system
- **PyTorch/TensorFlow** - ML framework support through extensions
- **OpenAI/Anthropic APIs** - External AI model integration
- **Custom Model Support** - Local and cloud-based AI models

### Development Infrastructure
- **Monaco Editor** - VSCode-level code editing capabilities
- **XTerm.js** - Full-featured terminal integration
- **Storybook 9.0.16** - Component development and documentation
- **Hotkeys.js** - Advanced keyboard shortcut management

## Build System Architecture

### Package Management
- **pnpm 9.1.2** - Fast, disk-efficient package manager (REQUIRED)
- **pnpm Workspaces** - Monorepo dependency management
- **Turbo 2.5.4** - Intelligent build system with caching
- **Jake** - Custom task automation for complex workflows

### Rust Build System
- **Cargo Workspace** - 40+ crates with shared dependencies
- **Multiple Build Profiles** - dev, release, release-small, release-with-debug
- **Cargo Make** - Advanced task automation for Rust
- **Cross-compilation** - Windows, macOS, Linux support

### Code Quality & Security
- **ESLint 9.30.1** - Advanced linting with TypeScript support
- **Prettier 3.6.2** - Code formatting with Tailwind plugin
- **Clippy** - Rust linting with strict security rules
- **Cargo Audit** - Security vulnerability scanning
- **Cargo Deny** - License and dependency policy enforcement
- **Husky + lint-staged** - Git hooks for quality gates

### Testing Framework
- **Jest 30.0.4** - JavaScript/TypeScript testing
- **Vitest** - Fast unit testing with Vite integration
- **Cargo Test** - Rust unit and integration testing
- **Tarpaulin** - Rust code coverage analysis
- **Storybook Testing** - Component testing and visual regression

## Development Commands

### Full System Development
```bash
# Start complete development environment
pnpm server_dev       # Build all workspaces + run server in dev mode
pnpm desktop          # Run Tauri desktop app in development
pnpm dev              # Start all apps in parallel development mode

# Core development workflows
pnpm server           # Run core + server (minimal setup)
pnpm server_build     # Build all workspaces except core
pnpm build_desktop    # Build production desktop application
```

### Rust Backend Development
```bash
# In apps/backend/ directory
cargo build --workspace              # Build all Rust crates
cargo test --workspace               # Run all tests
cargo clippy --all-targets          # Lint with strict rules
cargo audit                          # Security vulnerability scan
cargo make pre-commit                # Full quality check pipeline
cargo make ci                        # Complete CI pipeline locally
```

### Frontend Development
```bash
# Component development
pnpm sb                              # Start Storybook dev server
pnpm sb:build                        # Build Storybook for production
pnpm sb:watch                        # Storybook with Tailwind watch mode

# Styling and assets
pnpm tw                              # Build Tailwind CSS
pnpm tw:watch                        # Watch Tailwind changes
```

### Quality Assurance
```bash
# Code quality pipeline
pnpm quality                         # Run lint + format + quality check
pnpm lint                            # Lint and fix code issues
pnpm format                          # Format code with Prettier
pnpm test                            # Run core and web tests
pnpm check-deps                      # Verify dependency consistency
```

## Code Style Standards

### Rust Code Standards
- **Formatting**: rustfmt with tabs (4 spaces width)
- **Linting**: Clippy with pedantic + nursery lints enabled
- **Documentation**: All public APIs must have `///` documentation
- **Error Handling**: Use `thiserror` for custom errors, `anyhow` for applications
- **Safety**: `unsafe` code forbidden except with explicit justification
- **Performance**: Use `parking_lot` over `std::sync`, profile before optimizing

### TypeScript/React Standards
- **Formatting**: Prettier with 120 character line width, tabs for indentation
- **Quotes**: Double quotes for JS/TS, single quotes for JSX
- **Imports**: Absolute imports with path mapping, workspace references
- **Components**: PascalCase filenames, functional components with hooks
- **Testing**: `.test.ts` or `.spec.ts` suffixes, comprehensive coverage

### Documentation Standards
- **Rust**: Use `///` for public APIs, `//!` for module-level docs
- **TypeScript**: JSDoc comments for complex functions and types
- **Architecture**: Comprehensive docs in `/docs` directory
- **Examples**: All public APIs must include working examples

## Extension Development

### Extension Types
- **Instruments (AI/ML)**: Python-based AI model integrations
- **Operators (Utilities)**: Rust-based workflow processing
- **Addons (UI)**: React-based interface enhancements

### Extension SDK
- **Rust SDK**: Core extension development framework
- **Python Bindings**: PyO3-based integration layer
- **TypeScript SDK**: Frontend extension development
- **WASM Support**: WebAssembly for portable extensions

### Security & Sandboxing
- **Permission System**: Granular capability-based security
- **Process Isolation**: Out-of-process extension execution
- **Resource Limits**: Memory and CPU constraints per extension
- **Audit Trail**: Complete logging of extension activities

## Performance Characteristics

### Startup Performance
- **Core Startup**: <1 second (minimal core only)
- **Extension Loading**: Lazy loading on-demand
- **Memory Usage**: <100MB base, scales with active extensions

### Runtime Performance
- **In-Process Operations**: 50-100 nanosecond latency (The Pit)
- **Out-of-Process Communication**: <1ms latency (UFE)
- **AI Model Orchestration**: Intelligent resource pooling and caching
- **File Operations**: Async I/O with intelligent caching

## Deployment & Distribution

### Desktop Application
- **Tauri Framework**: Native performance with web technologies
- **Cross-platform**: Windows, macOS, Linux support
- **Auto-updates**: Seamless background updates
- **Offline Capability**: Core functionality without internet

### Extension Marketplace
- **Global Distribution**: One-click installation worldwide
- **Version Management**: Semantic versioning with rollback support
- **Security Review**: Automated and manual security scanning
- **Analytics**: Usage metrics and performance monitoring