# CrossPty - Symphony's Native Terminal Core

[![Rust](https://img.shields.io/badge/rust-1.70%2B-orange.svg)](https://www.rust-lang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A cross-platform pseudo-terminal (PTY) abstraction for Symphony IDE. This is one of Symphony's **6 core built-in features**, providing native shell access with full process lifecycle management.

## 🎯 Overview

CrossPty provides a unified async interface for creating and managing pseudo-terminals across platforms:

- **Windows**: Native ConPTY (Windows 10 version 1809+)
- **Unix/Linux/macOS**: POSIX PTY with full signal support

## ✨ Features

- ✅ **Cross-Platform PTY**: ConPTY for Windows, native PTY for Unix
- ✅ **Full Process Lifecycle**: Spawn, manage, and terminate shell processes
- ✅ **Bidirectional I/O**: Async read/write with proper buffering
- ✅ **Terminal Resize**: Dynamic terminal dimension updates with SIGWINCH
- ✅ **Signal Handling**: Proper SIGTERM/SIGKILL support on Unix
- ✅ **Environment Control**: Pass custom environment variables to shells
- ✅ **Working Directory**: Set process working directory
- ✅ **Async-First**: Built on Tokio for non-blocking operations

## 📦 Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
crosspty = { path = "../crosspty" }
tokio = { version = "1.45", features = ["full"] }
```

## 🚀 Quick Start

```rust
use crosspty::{PtyBuilder, PtySize};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Create a PTY with the default shell
    let mut pty = PtyBuilder::new()
        .size(PtySize::new(80, 24))
        .spawn()
        .await?;

    // Write a command
    pty.write(b"echo Hello, Symphony!\n").await?;

    // Read output
    let output = pty.read().await?;
    println!("Output: {}", String::from_utf8_lossy(&output));

    // Resize the terminal
    pty.resize(PtySize::new(120, 30)).await?;

    // Clean shutdown
    pty.kill().await?;

    Ok(())
}
```

## 📖 Core API

### PtyBuilder

The builder pattern for creating PTY instances:

```rust
let pty = PtyBuilder::new()
    .command("bash")                        // Shell command
    .args(vec!["-l".to_string()])          // Arguments
    .env("TERM", "xterm-256color")         // Environment variables
    .size(PtySize::new(100, 30))           // Terminal size
    .working_dir("/home/user")             // Working directory
    .spawn()                                // Create the PTY
    .await?;
```

### Pty Trait

Core operations on PTY instances:

```rust
pub trait Pty: Send + Sync {
    async fn write(&mut self, data: &[u8]) -> PtyResult<()>;
    async fn read(&mut self) -> PtyResult<Bytes>;
    async fn resize(&mut self, size: PtySize) -> PtyResult<()>;
    
    fn pid(&self) -> Option<u32>;
    fn is_alive(&self) -> bool;
    fn exit_status(&self) -> ExitStatus;
    
    async fn terminate(&mut self) -> PtyResult<()>;
    async fn kill(&mut self) -> PtyResult<()>;
}
```

## 🔧 Platform-Specific Details

### Windows (ConPTY)

- **Requirements**: Windows 10 version 1809 (October 2018 Update) or later
- **Shell Support**: PowerShell, CMD, WSL
- **Implementation**: Uses native ConPTY API via `conpty` crate
- **Performance**: Native Windows console with full ANSI support

### Unix (PTY)

- **Platforms**: Linux, macOS, FreeBSD, other Unix-like systems
- **Shell Support**: bash, zsh, sh, fish, and any Unix shell
- **Implementation**: POSIX PTY via `nix` crate with `openpty`, `fork`, `execve`
- **Signals**: Full support for SIGTERM, SIGKILL, SIGWINCH

## 📋 Examples

### Basic Terminal

```rust
use crosspty::{PtyBuilder, PtySize};

let mut pty = PtyBuilder::new()
    .size(PtySize::new(80, 24))
    .spawn()
    .await?;

pty.write(b"ls -la\n").await?;
tokio::time::sleep(Duration::from_millis(500)).await;

let output = pty.read().await?;
println!("{}", String::from_utf8_lossy(&output));

pty.kill().await?;
```

### Custom Environment

```rust
let mut pty = PtyBuilder::new()
    .env("CUSTOM_VAR", "value")
    .env("PATH", "/usr/local/bin:/usr/bin")
    .working_dir("/home/user/project")
    .spawn()
    .await?;
```

### Process Lifecycle

```rust
let mut pty = PtyBuilder::new().spawn().await?;

// Check if alive
assert!(pty.is_alive());
assert!(pty.pid().is_some());

// Graceful termination (SIGTERM on Unix)
pty.terminate().await?;
tokio::time::sleep(Duration::from_secs(1)).await;

// Forceful kill if still running
if pty.is_alive() {
    pty.kill().await?;
}

// Check exit status
match pty.exit_status() {
    ExitStatus::Exited(code) => println!("Exited with code: {}", code),
    ExitStatus::Signaled(sig) => println!("Killed by signal: {}", sig),
    ExitStatus::Running => println!("Still running"),
}
```

### Multiple PTY Instances

```rust
let mut ptys = Vec::new();

for i in 0..5 {
    let pty = PtyBuilder::new()
        .env("INSTANCE_ID", &i.to_string())
        .spawn()
        .await?;
    ptys.push(pty);
}

// Use all PTYs...

// Clean up
for mut pty in ptys {
    pty.kill().await?;
}
```

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
cargo test

# Run integration tests only
cargo test --test integration_tests

# Run with output
cargo test -- --nocapture
```

## 🎯 Examples

Run the included examples:

```bash
# Basic terminal usage
cargo run --example basic_terminal

# Interactive shell (not fully functional in this demo)
cargo run --example interactive_shell

# Process lifecycle management
cargo run --example process_lifecycle
```

## ⚠️ Platform Compatibility

| Platform | Status | Notes |
|----------|--------|-------|
| Windows 10+ | ✅ Full | ConPTY support |
| Windows 7/8 | ❌ No | ConPTY not available |
| Linux | ✅ Full | POSIX PTY |
| macOS | ✅ Full | POSIX PTY |
| FreeBSD | ✅ Expected | POSIX PTY (untested) |

## 🔐 Safety

This crate uses `unsafe` code in the following areas:

- **Unix**: `fork()`, `execve()`, and raw file descriptor operations (required for PTY)
- **Windows**: None (ConPTY wrapper is safe)

All unsafe code is carefully reviewed and necessary for PTY functionality.

## 🛠️ Architecture

```
crosspty/
├── src/
│   ├── lib.rs              # Public API, PtyBuilder, Pty trait
│   ├── error.rs            # Error types
│   └── platforms/
│       ├── mod.rs          # Platform dispatcher
│       ├── win.rs          # Windows ConPTY implementation
│       └── unix.rs         # Unix POSIX PTY implementation
├── examples/               # Usage examples
└── tests/                  # Integration tests
```

## 📚 Related Crates

- **conpty** (0.7): Windows ConPTY wrapper
- **nix** (0.29): Unix system calls
- **tokio** (1.45): Async runtime
- **bytes** (1.5): Efficient byte buffers

## 🤝 Contributing

This is part of the Symphony IDE project. See the main repository for contribution guidelines.

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Part of Symphony IDE

CrossPty is one of Symphony's 6 core built-in features:
1. Text Editor
2. File Explorer
3. Syntax Highlighting
4. Settings System
5. **Native Terminal** ← You are here
6. Extension System

---

**Made with ❤️ for Symphony IDE**