# Symphony Extensions

This directory contains the built-in extensions for Symphony. Each extension is a separate crate that provides additional functionality to the editor.

## Available Extensions

### Language Intelligence

- **LSP Manager:** Multi-language Language Server Protocol manager providing intelligent code features for TypeScript, JavaScript, Python, Rust, and Go. Includes automatic server lifecycle management, health monitoring, auto-restart with exponential backoff, and comprehensive error handling. **Status: Phase 4 Complete** - Backend infrastructure ready for Phase 3 frontend integration.

- **TypeScript LSP:** Implements the Language Server Protocol for TypeScript/JavaScript, providing features like code completion, diagnostics, and go-to-definition. Uses typescript-language-server via stdio communication.

### Development Tools

- **Git:** Provides Git integration for Symphony, allowing users to perform Git operations directly from the editor.

- **Native Shell:** Provides a native shell for executing commands within Symphony.

## Extension Architecture

Symphony extensions follow the microkernel architecture pattern:

- **Extension Trait:** All extensions implement the `Extension` trait from `sveditor-core-api`
- **IPC Communication:** Extensions communicate with the frontend via Symphony's IPC Bus
- **Lifecycle Management:** Extensions are loaded, initialized, and unloaded by the Orchestra Kit
- **State Management:** Extensions can access and modify Symphony's global state
- **Message Handling:** Extensions receive and process messages through the `notify()` method

## Developing Extensions

Each extension is a Rust crate with:

1. **Cargo.toml:** Package manifest with dependencies on `sveditor-core-api`
2. **src/lib.rs:** Extension entry point implementing the `Extension` trait
3. **README.md:** User-facing documentation
4. **Tests:** Unit and integration tests

See individual extension directories for detailed documentation and examples.
