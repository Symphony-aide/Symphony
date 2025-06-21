# Symphony Project Build Guide

This document provides instructions for building the Symphony project's backend and frontend components, as well as generating executable files for deployment.

## Project Overview

Symphony is a cross-platform code editor built with:
- **Backend**: Rust 
- **Frontend**: React/TypeScript
- **Desktop Application**: Tauri (Rust-based Electron alternative)

## Prerequisites

Before building the project, ensure you have the following tools installed:

### Required Tools
- **Rust** (stable channel) - [https://www.rust-lang.org/tools/install](https://www.rust-lang.org/tools/install)
- **Node.js** (v18+) - [https://nodejs.org](https://nodejs.org)
- **pnpm** - `npm install -g pnpm`
- **Tauri CLI** - `cargo install tauri-cli --version "^1.2"`
- **Deno** - [https://deno.land/#installation](https://deno.land/#installation)

### OS-Specific Dependencies for Tauri

#### Windows
1. Install [Microsoft Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
2. Install [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)

#### macOS
1. Install Xcode Command Line Tools: `xcode-select --install`

#### Linux
1. Install required packages:
   ```bash
   # Debian/Ubuntu
   sudo apt update
   sudo apt install libwebkit2gtk-4.0-dev build-essential curl wget libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
   
   # Fedora
   sudo dnf install webkit2gtk3-devel openssl-devel curl wget libappindicator-gtk3-devel librsvg2-devel
   ```

## Installing Dependencies

Clone the repository and install all dependencies:

```bash
# Clone the repository
git clone https://github.com/Graviton-Code-Editor/Graviton-App.git
cd Graviton-App
```

### Frontend Dependencies

Install the frontend dependencies using pnpm:

```bash
# Install dependencies
pnpm install
```

> **Note**: If you encounter an error about `@gveditor/languages` not being found, this is because it's a workspace package. Make sure your pnpm-workspace.yaml is properly set up with both 'web' and 'languages' directories. You can also try installing packages individually:
> 
> ```bash
> # Install languages package first
> cd languages
> pnpm install
> cd ..
> 
> # Then install web package
> cd web
> pnpm install
> cd ..
> ```

### Rust Dependencies

For Rust dependencies, they are automatically managed by Cargo. When you build the project, Cargo will download and compile all required dependencies based on the Cargo.toml files.

If you need to manually add a dependency to a specific Rust project:

```bash
# Navigate to the project directory
cd core  # or any other Rust project directory

# Add a dependency
cargo add package_name

# Add a dependency with specific version
cargo add package_name@1.2.3

# Add a dependency with features
cargo add package_name --features feature1,feature2
```

To install all Rust dependencies for the entire workspace at once:

```bash
# From the project root
cargo fetch
```

## Building the Project

### Development Mode

To run the application in development mode:

```bash
# Run the desktop application (frontend + backend)
pnpm run dev_desktop

# Run the server version
pnpm run dev_server
```

### Production Build

To create production builds:

```bash
# Build the desktop application
pnpm run build_desktop
```

This will generate executables in the `desktop/src-tauri/target/release/bundle` directory:
- For Windows: `.msi` installer and `.exe` files
- For macOS: `.dmg` or `.app` files
- For Linux: `.deb`, `.rpm`, or AppImage files depending on your configuration

## Testing

Run automated tests:

```bash
pnpm test
```

## Code Quality Tools

Format and lint code:

```bash
# Format all code
pnpm run format

# Lint all code
pnpm run lint
```

## Project Structure

- **core/**: Rust core engine
- **core_api/**: Shared API for core and extensions
- **core_deno/**: Deno runtime for extensions
- **desktop/**: Tauri desktop application
- **extensions/**: Built-in extensions
- **server/**: Self-hosted browser version
- **web/**: React frontend
- **languages/**: Language translations

## Updated Dependencies

### Frontend (Web) Dependencies

The frontend dependencies have been updated to the latest versions:

```json
{
  "dependencies": {
    "@codemirror/autocomplete": "^6.11.1",
    "@codemirror/commands": "^6.3.3",
    "@codemirror/lang-javascript": "^6.2.1",
    "@codemirror/lang-markdown": "^6.2.3",
    "@codemirror/lang-rust": "^6.0.1",
    "@codemirror/language": "^6.9.3",
    "@codemirror/lint": "^6.4.2",
    "@codemirror/search": "^6.5.5",
    "@codemirror/state": "^6.3.3",
    "@codemirror/view": "^6.22.1",
    "@fontsource/inter": "^5.0.16",
    "@fontsource/jetbrains-mono": "^5.0.18",
    "@gveditor/languages": "*",
    "@lezer/highlight": "^1.2.0",
    "@open-rpc/client-js": "^1.8.1",
    "@tauri-apps/api": "^1.5.3",
    "emittery": "^1.0.1",
    "i18next": "^23.8.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-i18next": "^14.0.1",
    "react-is": "^18.2.0",
    "react-multi-split-pane": "^0.3.3",
    "react-router": "^6.21.3",
    "react-router-dom": "^6.21.3",
    "react-svg": "^16.1.32",
    "react-transition-group": "^4.4.5",
    "react-virtualized-auto-sizer": "^1.0.20",
    "react-window": "^1.8.10",
    "recoil": "^0.7.7",
    "recoil-nexus": "^0.5.0",
    "rollup-plugin-node-polyfills": "^0.2.1",
    "simple-jsonrpc-js": "^1.2.0",
    "styled-components": "^6.1.8",
    "xterm": "^5.3.0",
    "xterm-addon-fit": "^0.8.0"
  },
  "devDependencies": {
    "@testing-library/react": "^14.1.2",
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "@types/react-transition-group": "^4.4.10",
    "@types/react-virtualized": "^9.21.29",
    "@typescript-eslint/eslint-plugin": "^6.19.1",
    "@typescript-eslint/parser": "^6.19.1",
    "@vitejs/plugin-react": "^4.2.1",
    "eslint": "^8.56.0",
    "happy-dom": "^12.10.3",
    "typescript": "^5.3.3",
    "vite": "^5.0.12",
    "vite-plugin-checker": "^0.6.2",
    "vite-tsconfig-paths": "^4.3.1",
    "vitest": "^1.2.1"
  }
}
```

### Backend (Rust) Dependencies

The Rust dependencies have been updated to the latest versions:

```toml
# desktop/src-tauri/Cargo.toml
[dependencies]
serde_json = "1.0.111"
serde = { version = "1.0.195", features = ["derive"] }
tauri = { version = "1.5.4", features = ["dialog-all", "shell-open", "window-close", "window-maximize", "window-minimize", "window-start-dragging", "window-unmaximize", "window-unminimize"] }
tracing = "0.1.40"
tracing-subscriber = {version="0.3.18", features= ["env-filter", "std"] }
anyhow = "1.0.79"

# For Windows
[target.'cfg(windows)'.dependencies]
window-shadows = "0.2.2"

# core/Cargo.toml
[dependencies]
jsonrpc-derive = "18.0.0"
jsonrpc-core = "18.0.0"
jsonrpc-core-client = "18.0.0"
serde = { version = "1.0.195", features = ["derive"] }
tokio = { version = "1.35.1", features = ["sync", "rt"]}
tracing = "0.1.40"
async-trait = "0.1.77"
jsonrpc-http-server = { version = "18.0.0", optional = true}
hyper-tungstenite = { version = "0.11.1", optional = true}
url = { version = "2.5.0", optional = true}
```

## Troubleshooting

If you encounter issues during the build process, try these solutions:

1. **Dependencies not found**: Run `pnpm install` again to ensure all dependencies are properly installed

2. **Workspace package not found**: If you get errors about workspace packages not being found:
   ```bash
   # Check your pnpm-workspace.yaml content
   cat pnpm-workspace.yaml
   
   # It should contain:
   # packages:
   #   - web
   #   - languages
   
   # Try installing packages in the correct order
   cd languages && pnpm install && cd ..
   cd web && pnpm install && cd ..
   ```

3. **Rust compilation errors**: Ensure you're using the stable channel of Rust by running:
   ```bash
   rustup default stable
   ```

4. **Missing Tauri prerequisites**: Verify you've installed all OS-specific dependencies for Tauri

5. **Node/pnpm issues**: Try clearing your cache:
   ```bash
   pnpm store prune
   ```

6. **Rust dependency issues**: Try cleaning and rebuilding:
   ```bash
   cargo clean
   cargo build
   ```

## Deployment

After building the application, you can find the executables in:
- Windows: `desktop/src-tauri/target/release/bundle/msi/`
- macOS: `desktop/src-tauri/target/release/bundle/dmg/`
- Linux: `desktop/src-tauri/target/release/bundle/deb/` (or other formats)

The executable for Windows is located at `desktop/src-tauri/target/release/graviton.exe` 