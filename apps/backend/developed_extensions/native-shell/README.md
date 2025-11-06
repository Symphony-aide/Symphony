# Native Shell Extension for Symphony

This extension provides a native shell for executing commands within the Symphony editor. It uses the `crosspty` crate to create and manage pseudo-terminals (PTY), ensuring a consistent terminal experience across different platforms.

## Features

- **Native Shell:** Provides a native shell (PowerShell/CMD on Windows, bash/sh on Unix)
- **Cross-Platform:** Uses the `crosspty` crate with platform-specific PTY implementations
- **Async Operations:** Built on tokio for non-blocking I/O
- **Dynamic Sizing:** Support for terminal resize operations
- **WebAssembly Ready:** Prepared for WASM compilation with conditional features

## Architecture

### PTY Management
- Uses `PtyBuilder` API from crosspty
- Asynchronous PTY creation with `Arc<Mutex<>>` for thread-safe access
- Error handling with proper fallbacks

### API Updates (v0.1.0)
- ✅ Migrated from legacy `new_pty()` to `PtyBuilder::new()`
- ✅ Fixed type mismatches: `write()` now uses `&[u8]`, `resize()` uses `PtySize`
- ✅ Added proper error handling with Result types

## Building

### Native Build (Windows/Linux/macOS)
```bash
# Debug build
cargo build --package native-shell-symphony

# Release build
cargo build --package native-shell-symphony --release
```

### WebAssembly Build (Experimental)
```bash
# Install WASM target (one-time setup)
rustup target add wasm32-unknown-unknown

# Build for WASM
cargo build --package native-shell-symphony --target wasm32-unknown-unknown
```

**Note:** This extension requires native OS features (PTY, process spawning) that are not available in WebAssembly. The WASM build is provided for compatibility but will have limited/no-op functionality.

## Usage

To use this extension, open a new terminal in Symphony. The extension will automatically create a native shell based on your platform:
- **Windows:** PowerShell or Command Prompt
- **Linux/macOS:** Default shell from `$SHELL` environment variable

## Dependencies

- `crosspty` - Cross-platform PTY abstraction
- `sveditor-core-api` - Symphony IDE core API
- `tokio` - Async runtime
- `async-trait` - Async trait support

## Platform Support

| Platform | Shell | Status |
|----------|-------|--------|
| Windows  | PowerShell, CMD | ✅ Fully Supported |
| Linux    | bash, sh | ✅ Fully Supported |
| macOS    | bash, sh, zsh | ✅ Fully Supported |
| WebAssembly | N/A | ⚠️ No-op (PTY not available) |
