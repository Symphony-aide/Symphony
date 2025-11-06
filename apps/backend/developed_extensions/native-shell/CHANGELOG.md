# Changelog - Native Shell Extension

All notable changes to this project will be documented in this file.

## [0.1.1] - 2025-11-03

### Fixed
- ✅ **API Migration**: Migrated from deprecated `crosspty::platforms::new_pty` to `PtyBuilder::new()` API
- ✅ **Type Corrections**: Fixed `write()` method to accept `&[u8]` instead of `&String`
- ✅ **Resize Implementation**: Fixed `resize()` to use `PtySize::new()` instead of raw tuple
- ✅ **Error Handling**: Added proper error handling for PTY operations with Result types
- ✅ **Thread Safety**: Implemented `Arc<Mutex<>>` pattern for safe concurrent PTY access

### Added
- 📦 **WebAssembly Support**: Added conditional compilation for WASM target
  - WASM dependencies: `wasm-bindgen`, `web-sys`
  - Conditional imports for platform-specific code
  - Library type configuration: `["cdylib", "rlib"]`
- 🔧 **Build Scripts**: Added PowerShell build script (`build.ps1`) for easy compilation
- 📚 **Documentation**: Enhanced README with:
  - Architecture details
  - Build instructions for native and WASM
  - Platform support matrix
  - API migration notes

### Changed
- 🔄 **Async PTY Creation**: PTY creation now happens asynchronously in spawned task
- 🛡️ **Cargo.toml**: Updated dependencies to be conditional based on target architecture
  - `sveditor-core-api` and `crosspty` only for native targets
  - WebAssembly dependencies separated

### Technical Details

#### Before (v0.1.0)
```rust
use crosspty::platforms::new_pty;
let pty = new_pty(&self.command, vec![], tx);
self.pty.write(&data).await.unwrap();
self.pty.resize((cols, rows)).await.unwrap();
```

#### After (v0.1.1)
```rust
use crosspty::{Pty, PtyBuilder, PtySize};
let pty = PtyBuilder::new()
    .command(command)
    .spawn()
    .await?;
pty.write(data.as_bytes()).await?;
pty.resize(PtySize::new(cols as u16, rows as u16)).await?;
```

### Build Status
- ✅ Native Build: Success (Windows, Linux, macOS)
- ⚠️ WASM Build: Compilable (limited functionality - PTY features unavailable)

### Platform Compatibility
| Platform | Status | Notes |
|----------|--------|-------|
| Windows (x86_64) | ✅ Tested | PowerShell, CMD supported |
| Linux | ✅ Compatible | bash, sh supported |
| macOS | ✅ Compatible | zsh, bash supported |
| WASM32 | ⚠️ Limited | No-op implementation |

## [0.1.0] - Initial Release

### Features
- Native shell integration for Symphony IDE
- Cross-platform PTY support via crosspty
- PowerShell and CMD support on Windows
- Terminal resize functionality
- Async I/O operations
