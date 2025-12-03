# Design Document - LSP Manager Backend

## Overview

This design document specifies the architecture for implementing a backend Language Server Protocol (LSP) manager extension in Symphony IDE. The LSP manager is a Rust-based extension that manages external language server processes, handles stdio communication, provides health monitoring with auto-restart capabilities, and integrates with Symphony's IPC system.

The implementation focuses exclusively on backend concerns: process management, health monitoring, configuration, error handling, and IPC integration. Frontend concerns (Monaco integration, UI providers, etc.) are handled separately.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Symphony Frontend                        │
│                  (TypeScript/React)                         │
└─────────────────────────────────────────────────────────────┘
                            ↕ IPC Bus
┌─────────────────────────────────────────────────────────────┐
│              LSP Manager Extension (Rust)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  LSPExtensionManager                                 │  │
│  │  - Server registry (HashMap<Language, Server>)       │  │
│  │  - Configuration management                          │  │
│  │  - Lifecycle coordination                            │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  LSPServerInstance                                   │  │
│  │  - Process handle                                    │  │
│  │  - Active documents tracking                         │  │
│  │  - Initialization status                             │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  LSPServerProcess                                    │  │
│  │  - Process spawning (tokio::process)                 │  │
│  │  - Stdio communication                               │  │
│  │  - Message reading/writing                           │  │
│  │  - Health monitoring integration                     │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  HealthMonitor                                       │  │
│  │  - Heartbeat tracking                                │  │
│  │  - Restart counter                                   │  │
│  │  - Exponential backoff calculation                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕ stdio
┌─────────────────────────────────────────────────────────────┐
│              Language Servers (External Processes)          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  TypeScript  │  │    Python    │  │     Rust     │     │
│  │   (tsserver) │  │   (pyright)  │  │(rust-analyzer)│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. **Extension Registration**: LSP Manager registers with Symphony's extension system
2. **IPC Message**: Frontend sends request via IPC (e.g., "start server for file.rs")
3. **Language Detection**: Manager detects language from file extension
4. **Server Lookup**: Manager checks if server already exists for language
5. **Server Spawn** (if needed): Manager spawns new language server process
6. **Document Tracking**: Manager adds document to server's active list
7. **Message Routing**: Manager routes LSP requests to appropriate server
8. **Health Monitoring**: Manager tracks heartbeats and server health
9. **Auto-Restart** (if crash): Manager restarts server with exponential backoff
10. **Graceful Shutdown**: Manager stops all servers when Symphony closes

## Components and Interfaces

### 1. Language Detection Module

**File**: `src/language.rs`

**Responsibilities**:
- Map file extensions to programming languages
- Provide language metadata (display names, identifiers)
- Support multiple extensions per language

**Key Types**:

```rust
/// Supported programming languages
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Language {
    TypeScript,
    JavaScript,
    Python,
    Rust,
    Go,
}

impl Language {
    /// Get language identifier string
    pub fn as_str(&self) -> &'static str;
    
    /// Get display name for UI
    pub fn display_name(&self) -> &'static str;
    
    /// Get all supported languages
    pub fn all() -> &'static [Language];
}

/// Detect language from file path
///
/// # Arguments
/// * `file_path` - Path to file
///
/// # Returns
/// Detected language or None if unsupported
pub fn detect_language(file_path: &str) -> Option<Language>;

/// Get