# Project Structure & Organization

## Monorepo Layout

Symphony uses a **pnpm workspace** monorepo structure with **Turbo** for build orchestration.

### Root Level
```
├── apps/                    # Application packages
├── packages/                # Shared libraries and utilities
├── docs/                    # Architecture and design documentation
├── .storybook/             # Storybook configuration
├── node_modules/           # Dependencies (managed by pnpm)
└── dist/                   # Build outputs
```

## Applications (`apps/`)

### `apps/web/`
- Main web application
- React + TypeScript frontend
- Uses shared packages from `packages/`

### `apps/backend/`
- Server-side application
- API and business logic

### `apps/docs/`
- Documentation site
- Separate from `/docs` folder

## Shared Packages (`packages/`)

### `packages/components/`
- Reusable React components
- Storybook integration
- Component library for the ecosystem

### `packages/ui/`
- UI primitives and design system
- Base components and styling utilities

### `packages/shared/`
- Common utilities and types
- Business logic shared across apps

### `packages/config/`
- Shared configuration files
- ESLint, TypeScript, and build configs

### `packages/tsconfig/`
- TypeScript configuration presets
- Shared tsconfig.json files

## Documentation (`docs/`)

Architecture and design documents:
- `The AIDE.md` - AI-First Development Environment concepts
- `The Conductor.md` - Orchestration system architecture
- `The Symphony.md` - Overall product vision
- Additional design documents

## Configuration Files

### Build & Package Management
- `package.json` - Root package with workspace configuration
- `pnpm-workspace.yaml` - Workspace package definitions
- `turbo.json` - Build pipeline configuration
- `jakefile.js` - Task automation scripts

### Code Quality
- `eslint.config.js` - ESLint configuration
- `.prettierrc` - Prettier formatting rules
- `.editorconfig` - Editor consistency settings
- `jest.config.js` - Testing configuration
- `vitest.workspaces.ts` - Vitest workspace setup

### Development Tools
- `.storybook/` - Component development environment
- `.husky/` - Git hooks for quality gates

## Naming Conventions

### Files & Directories
- **kebab-case** for directories and config files
- **PascalCase** for React components
- **camelCase** for utilities and functions
- **UPPERCASE** for constants and environment variables

### Packages
- Scoped packages use `@symphony/` prefix when published
- Internal workspace references use `workspace:*` protocol

## Import Patterns

### Internal Packages
```typescript
import { Button } from '@symphony/components';
import { config } from '@symphony/shared';
```

### Relative Imports
- Use relative imports within the same package
- Prefer absolute imports for cross-package dependencies

## Build Outputs

### `dist/`
- Compiled applications and packages
- Storybook static builds
- Generated CSS and assets

### Workspace Dependencies
- Each package can depend on other workspace packages
- Turbo handles build order and caching
- Use `workspace:*` in package.json for internal dependencies