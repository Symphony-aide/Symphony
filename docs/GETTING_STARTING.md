# Getting Started with Symphony

This document provides a comprehensive overview of the Symphony project structure, its packages, and how they interact with each other. It is intended for developers who want to contribute to the project or understand its architecture.

## Project Structure

Symphony is a monorepo managed with `pnpm` workspaces. The project is divided into several packages, each with a specific responsibility.

```
.
├── core
│   ├── src
│   │   ├── handlers
│   │   │   ├── http.rs
│   │   │   ├── local.rs
│   │   │   └── mod.rs
│   │   ├── configuration.rs
│   │   ├── lib.rs
│   │   └── server.rs
│   └── Cargo.toml
├── core_api
│   ├── src
│   │   ├── extensions
│   │   │   ├── ...
│   │   ├── filesystems
│   │   │   ├── local.rs
│   │   │   └── mod.rs
│   │   ├── language_servers.rs
│   │   ├── messaging
│   │   │   ├── client.rs
│   │   │   ├── mod.rs
│   │   │   └── server.rs
│   │   ├── state_persistors
│   │   │   ├── ...
│   │   ├── states
│   │   │   ├── ...
│   │   ├── terminal_shells.rs
│   │   └── lib.rs
│   └── Cargo.toml
├── core_deno
│   ├── src
│   │   ├── exts
│   │   ├── events_manager.rs
│   │   ├── symphony.ts
│   │   ├── lib.rs
│   │   └── main_worker.rs
│   └── Cargo.toml
├── crosspty
│   ├── src
│   │   ├── platforms
│   │   │   ├── mod.rs
│   │   │   ├── unix.rs
│   │   │   └── win.rs
│   │   └── lib.rs
│   └── Cargo.toml
├── desktop
│   └── src-tauri
│       ├── src
│       │   ├── build.rs
│       │   ├── main.rs
│       │   └── methods.rs
│       ├── Cargo.toml
│       └── tauri.conf.json
├── docs
│   ├── EXTENSIONS.md
│   └── GUIDE.md
├── extensions
│   ├── git
│   ├── native-shell
│   └── typescript-lsp
├── server
│   ├── src
│   │   └── main.rs
│   └── Cargo.toml
└── web
    ├── public
    ├── src
    │   ├── components
    │   │   └── ...
    │   ├── features
    │   │   └── ...
    │   ├── hooks
    │   │   └── ...
    │   ├── modules
    │   │   └── ...
    │   ├── services
    │   │   └── ...
    │   ├── state
    │   │   └── ...
    │   ├── themes
    │   │   └── ...
    │   ├── types
    │   │   └── ...
    │   ├── utils
    │   │   └── ...
    │   ├── index.css
    │   └── main.tsx
    ├── package.json
    └── vite.config.ts
```

The main packages are:

-   `core`: The central component of the editor, written in Rust.
-   `core_api`: Defines the API for the `core`, also in Rust.
-   `core_deno`: A Deno-based runtime for executing extensions written in JavaScript/TypeScript.
-   `crosspty`: A Rust crate for cross-platform PTY management.
-   `desktop`: The Tauri-based desktop application shell.
-   `web`: The web-based frontend, written in React and TypeScript.
-   `server`: A standalone HTTP server for the `core`.
-   `extensions`: Bundled extensions.
-   `docs`: Project documentation.

## Packages

### `@core`

-   **Location:** `core/`
-   **Language:** Rust
-   **Purpose:** This is the heart of the Symphony editor. It is responsible for managing the application's state, file system operations, extensions, language servers, and terminals. It is designed to be a standalone component that can be used in different environments (desktop, server).
-   **Architecture:** `gveditor-core` is built with `tokio` for asynchronous operations. It exposes a JSON-RPC API for communication with clients. The core is transport-agnostic, meaning it can use different communication protocols (e.g., local in-process, HTTP) through a `TransportHandler` trait.
-   **Interaction:** The `@desktop` and `@server` packages both use this crate to run the editor's core logic. The `@web` frontend communicates with it through its JSON-RPC API.

### `@core_api`

-   **Location:** `core_api/`
-   **Language:** Rust
-   **Purpose:** This crate defines all the data structures, enumerations, and traits that form the public API of `@core`. It ensures type-safe communication between the core and its clients.
-   **Architecture:** It is a separate crate containing all the shared types for things like messaging, state, filesystems, extensions, etc. This separation of concerns allows other components to depend on the API without depending on the core's implementation.
-   **Interaction:** Any component that needs to communicate with the core, such as `@desktop`, `@server`, and `@core_deno`, depends on this crate.

### `@core_deno`

-   **Location:** `core_deno/`
-   **Language:** Rust, TypeScript
-   **Purpose:** Provides a Deno-based runtime for executing extensions written in JavaScript or TypeScript. This allows for web-based extensions that are isolated from the main application process.
-   **Architecture:** It uses `deno_runtime` to create a new JavaScript runtime for each extension in a separate thread. A TypeScript file, `symphony.ts`, defines the `Symphony` namespace, which is the API provided to extensions for interacting with the core. Communication between the Deno runtime and the Rust core is handled through Deno's `op` mechanism.
-   **Interaction:** The `@desktop` package can use this crate to load and run Deno-based extensions. (Note: this is currently disabled in the desktop app).

### `@crosspty`

-   **Location:** `crosspty/`
-   **Language:** Rust
-   **Purpose:** A small utility crate that provides a cross-platform API for creating and managing pseudoterminals (PTYs). This is essential for the integrated terminal feature.
-   **Architecture:** It uses conditional compilation to provide separate implementations for Windows (using `winpty-rs`) and Unix-like systems. It exposes a simple `Pty` trait.
-   **Interaction:** The `@core` uses this crate to create and manage terminal shells.

### `@desktop`

-   **Location:** `desktop/`
-   **Language:** Rust, TypeScript (in `@web`)
-   **Purpose:** The Tauri-based desktop application shell for the Symphony editor. It provides the native window, menus, and integration with the operating system.
-   **Architecture:** It's a Tauri application where the backend is written in Rust (`desktop/src-tauri`) and the frontend is the `@web` package. The Rust backend initializes and runs the `gveditor-core` in-process (`local_client`), loads extensions, and communicates with the frontend via message passing and Tauri's `invoke` handlers.
-   **How to Edit:** To modify the desktop-specific Rust code, edit the files in `desktop/src-tauri/src`. To change the frontend, see the `@web` package. To run in development mode, use `pnpm run --filter web dev` and in another terminal `cd desktop/src-tauri && cargo tauri dev`.

### `@web`

-   **Location:** `web/`
-   **Language:** TypeScript, React
-   **Purpose:** The web-based frontend for the Symphony editor. It provides the entire user interface, including the editor, terminal, side panels, tabs, etc.
-   **Architecture:** A modern React application built with Vite. It uses Recoil for state management, styled-components for styling, and CodeMirror 6 for the text editor. It communicates with the backend (either the Tauri backend or a remote server) via JSON-RPC and the Tauri API.
-   **Directory Structure:**
    -   `src/components`: Basic, reusable UI components.
    -   `src/features`: High-level features of the UI (e.g., tab container, status bar).
    -   `src/hooks`: Custom React hooks that encapsulate application logic.
    -   `src/modules`: Implementations for specific types of features (e.g., different kinds of tabs like text editor, terminal).
    -   `src/services`: Communication with the backend.
    -   `src/state`: Recoil state definitions.
-   **How to Edit:** This is where you will make changes to the UI. Run `pnpm install` in the root and then `pnpm run --filter web dev` to start the development server.

### `@server`

-   **Location:** `server/`
-   **Language:** Rust
-   **Purpose:** A standalone server for the Symphony core. It allows the editor to be accessed remotely from a web browser.
-   **Architecture:** A Rust application that hosts the `gveditor-core` and exposes its API over HTTP. It uses the `HTTPHandler` from the core.
-   **How to Edit:** To make changes to the server, edit the files in `server/src`. To run the server, use `cd server && cargo run`.

### `@extensions`

-   **Location:** `extensions/`
-   **Language:** Rust
-   **Purpose:** This directory contains the source code for the extensions that are bundled with Symphony, such as Git integration, TypeScript LSP, and a native shell.
-   **Architecture:** Each extension is a Rust crate that implements the `Extension` trait from `@core_api`. They are loaded by the `@desktop` or `@server` packages.
-   **How to Edit:** To modify an extension, edit the corresponding crate in this directory.

## How to Contribute

1.  **Fork and clone the repository.**
2.  **Install dependencies:** Run `pnpm install` at the root of the project.
3.  **Frontend Development:** To work on the frontend, run `pnpm run --filter web dev`. This will start a Vite development server for the `@web` package.
4.  **Desktop Development:** To work on the desktop app, you'll need to have Rust and Tauri set up. Then, run `pnpm run --filter web dev` in one terminal, and `cd desktop/src-tauri && cargo tauri dev` in another.
5.  **Submit a pull request:** Once you've made your changes, submit a pull request with a clear description of your work.

We hope this guide helps you get started with Symphony! 