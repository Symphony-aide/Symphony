# LSP Manager Extension for Symphony

A comprehensive multi-language Language Server Protocol (LSP) manager that provides intelligent code features for TypeScript, JavaScript, Python, Rust, and Go in Symphony IDE.

## Implementation Status

**Phase 4 Complete**: Backend LSP infrastructure is fully implemented and ready for integration.

- ✅ Multi-language server management (TypeScript, JavaScript, Python, Rust, Go)
- ✅ Process spawning and lifecycle management
- ✅ Health monitoring with auto-restart
- ✅ Configuration system with defaults
- ✅ Comprehensive error handling and logging
- ⏳ IPC routing (Phase 3 - pending frontend LSP client implementation)

## Features

- **🌐 Multi-Language Support**: TypeScript, JavaScript, Python, Rust, Go
- **🚀 Automatic Server Management**: Spawns and manages LSP servers automatically
- **🔄 Auto-Restart**: Automatically restarts crashed servers with exponential backoff
- **⚙️ Configurable**: Custom server paths and settings per language
- **📊 Health Monitoring**: Tracks server health and performance
- **🔌 Server Reuse**: Single server instance per language for efficiency
- **📝 Comprehensive Logging**: Debug logging for LSP communication

## Architecture

### Components

- **LSPExtensionManager**: Coordinates all language servers and manages lifecycle
- **LSPServerProcess**: Manages individual server processes with stdio communication
- **HealthMonitor**: Monitors server health and triggers auto-restart
- **ServerConfiguration**: Configurable server settings per language
- **Language Detection**: Automatic language detection from file extensions

### Communication Flow

```
Symphony Editor ↔ IPC Bus ↔ LSP Manager ↔ Language Servers
                                          ├─ TypeScript Server
                                          ├─ Python Server (pyright)
                                          ├─ Rust Server (rust-analyzer)
                                          └─ Go Server (gopls)
```

## Supported Languages

| Language   | Server              | File Extensions        |
|------------|---------------------|------------------------|
| TypeScript | typescript-language-server | .ts, .tsx       |
| JavaScript | typescript-language-server | .js, .jsx       |
| Python     | pyright             | .py                    |
| Rust       | rust-analyzer       | .rs                    |
| Go         | gopls               | .go                    |

## Installation

This extension is built-in to Symphony and automatically loaded when the editor starts.

**Note**: Full LSP functionality requires Phase 3 (Frontend LSP Client) to be completed. The backend infrastructure is ready and waiting for frontend integration via Symphony's IPC Bus.

### Language Server Prerequisites

Each language requires its respective language server to be installed:

**TypeScript/JavaScript:**
```bash
npm install -g typescript-language-server typescript
```

**Python:**
```bash
npm install -g pyright
# or
pip install pyright
```

**Rust:**
```bash
rustup component add rust-analyzer
```

**Go:**
```bash
go install golang.org/x/tools/gopls@latest
```

## Configuration

Configure custom server paths and settings through Symphony's settings system:

```json
{
  "lsp": {
    "typescript": {
      "enabled": true,
      "serverPath": "/custom/path/to/typescript-language-server",
      "args": ["--stdio"]
    },
    "python": {
      "enabled": true,
      "serverPath": "pyright-langserver",
      "args": ["--stdio"]
    }
  }
}
```

## Features

### Automatic Server Lifecycle

- **Auto-Start**: Servers start automatically when you open a supported file
- **Auto-Restart**: Crashed servers restart automatically (up to 5 attempts)
- **Graceful Shutdown**: All servers shut down cleanly when Symphony closes
- **Server Reuse**: Multiple files of the same language share one server instance

### Error Handling

- **Spawn Failures**: Clear error messages with actionable remediation steps
- **Crash Detection**: Monitors process exit codes and stderr output
- **Exponential Backoff**: 1s, 2s, 4s, 8s, 16s delays between restart attempts
- **Resource Limits**: Monitors memory usage (1GB limit per server)

### Logging

Enable debug logging to troubleshoot LSP communication:

```json
{
  "lsp": {
    "logging": {
      "enabled": true,
      "level": "debug"
    }
  }
}
```

## Development

### Building

Build the extension as part of the Symphony workspace:

```bash
cargo build --package lsp-manager-symphony
```

### Testing

Run the extension tests:

```bash
cargo test --package lsp-manager-symphony
```

### Dependencies

- `sveditor-core-api`: Symphony core API integration
- `tokio`: Async runtime for process management
- `serde`: Serialization for LSP messages
- `tracing`: Structured logging
- `async-trait`: Async trait support
- `anyhow`: Error handling
- `thiserror`: Custom error types
- `bytes`: Byte buffer management

## Troubleshooting

### Server Not Starting

1. Verify the language server is installed and in PATH
2. Check Symphony logs for error messages
3. Try manually running the server command to verify it works
4. Check file permissions on the server executable

### Performance Issues

1. Large projects may take time to initialize
2. Consider excluding unnecessary files in project configuration
3. Monitor memory usage in Symphony's status bar
4. Restart the server manually if it becomes unresponsive

### Connection Errors

1. Check that the server supports stdio communication
2. Verify no other process is using the same server
3. Check for firewall or antivirus interference
4. Review Symphony logs for detailed error information

## Contributing

When contributing to this extension:

1. Follow LSP specification guidelines
2. Ensure all public functions have comprehensive documentation
3. Add tests for new functionality
4. Update this README when adding features
5. Follow Rust best practices and Symphony coding standards

## License

This extension is part of the Symphony project and is licensed under the MIT License.
