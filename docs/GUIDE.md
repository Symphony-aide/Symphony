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
- **Python** - [https://www.python.org/downloads/](https://www.python.org/downloads/) (v3.6+, required for v8 compilation)

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
git clone https://github.com/Symphony-Code-Editor/Symphony-App.git
cd Symphony-App
```

## Automatic script

run (install_build)[../install_build.py] script and it will install both frontend and backend dependencies

## Manual Installing

#### Frontend Dependencies

Install the frontend dependencies using pnpm:

```bash
# Install dependencies
pnpm install
```

#### Rust Dependencies

To install all Rust dependencies for the entire workspace at once:

```bash
# From the project root
cargo fetch
cargo build
```

#### Tauri-CLI Caret

To install Tauri-cli run:

```bash
cargo install tauri-cli --version "^1"
# or
cargo install tauri-cli --version "1.6.5"
```


#### Nextest For Rust Testing Caret

To install nextest run:

```bash
cargo install --locked cargo-nextest
```

#### Install helper tools for Cargo

To install them run:
```bash
# Cargo-edit to update the manager dependencies and Cargo-watch to keep building app as you editing
cargo install cargo-edit cargo-watch
```

## Known Issues and Workarounds

### v8 Compilation Issues

The project uses the v8 JavaScript engine through the deno_core crate, which can cause compilation issues on some platforms. If you encounter errors related to v8 compilation (like `assertion failed: size_of::<TypeId>() == size_of::<u64>()`), you can try these workarounds:

#### Option 1: Disable the Deno Runtime Component

1. Comment out the core_deno dependency in Cargo.toml:
   ```toml
   [workspace]
   members = [
      "core",
      "core_api",
      # "core_deno",  # Comment this line
      # ...
   ]
   ```

2. Comment out the core_deno dependency in desktop/src-tauri/Cargo.toml:
   ```toml
   [dependencies]
   # ...
   # gveditor-core-deno = { path = "../../core_deno"}  # Comment this line
   # ...
   ```

3. Comment out the DenoExtensionSupport import and any related code in desktop/src-tauri/src/main.rs:
   ```rust
   // use gveditor_core_deno::DenoExtensionSupport;  // Comment this line
   
   // Also comment out any code that uses DenoExtensionSupport or loads Deno extensions
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

#### All Commands

All commands and scripts do exist at (jakefile)[jakefile.js] at the root

### Production Build

To create production builds:

```bash
# Build the desktop application
pnpm run build_desktop
```

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

7. **v8/Deno issues**: See the "Known Issues and Workarounds" section above.

## Deployment

After building the application, you can find the executables in:
- Windows: `desktop/src-tauri/target/release/bundle/msi/`
- macOS: `desktop/src-tauri/target/release/bundle/dmg/`
- Linux: `desktop/src-tauri/target/release/bundle/deb/` (or other formats)

The executable for Windows is located at `desktop/src-tauri/target/release/symphony.exe` 
