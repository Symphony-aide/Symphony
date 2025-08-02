# CrossPty

This crate provides a cross-platform abstraction for creating and managing pseudo-terminals (PTYs). It allows you to create PTYs on both Windows and Unix-like systems, providing a unified interface for interacting with them.

## Features

- **Cross-Platform:** Supports both Windows and Unix-like systems.
- **PTY Management:** Provides a simple API for creating, writing to, and resizing PTYs.

## Usage

To use CrossPty, you need to create a `Pty` instance and then use its methods to interact with the PTY.

```rust
use crosspty::Pty;

# async fn create_pty() {
let mut pty = crosspty::platforms::launch_platform_pty(Default::default()).unwrap();

pty.write("echo Hello, world!\n").await.unwrap();

let output = pty.reader.readLine().await.unwrap();

assert_eq!(output, "Hello, world!");
# }
```

```