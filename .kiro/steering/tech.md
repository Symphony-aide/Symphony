# Technology Stack & Build System

## Core Technologies

### Frontend Stack
- **React 19.1.0** - UI framework with latest features
- **TypeScript 5.8.3** - Type-safe development
- **Tailwind CSS 3.3.2** - Utility-first styling with animations
- **Vite** - Fast build tool and dev server
- **Jotai 2.12.5** - Atomic state management

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

## Architecture Notes

- **Monorepo Structure** - Uses pnpm workspaces with Turbo for orchestration
- **Microkernel Design** - Minimal core with extension-based architecture
- **Type Safety** - Full TypeScript coverage across all packages
- **Component-Driven** - Storybook for isolated component development
- **Quality Gates** - Automated linting, formatting, and testing in CI/CD