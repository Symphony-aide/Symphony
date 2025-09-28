# Symphony Deno Core

A Deno runtime integration for Symphony that enables developers to write extensions in TypeScript and JavaScript. This crate provides a secure, sandboxed environment for executing web-based extensions with full access to Symphony's extension API.

## Features

- **🦕 Deno Runtime**: Leverages Deno's secure runtime for TypeScript/JavaScript execution
- **🔒 Sandboxed Environment**: Secure execution with controlled permissions
- **🔌 Extension Support**: Full integration with Symphony's extension system
- **📡 Event Management**: Bidirectional communication between core and Deno extensions
- **⚡ Modern JavaScript**: Support for ES modules, async/await, and modern web APIs
- **🛡️ Security**: Fine-grained permission control for file system and network access

## Status

⚠️ **Currently Disabled**: This crate is temporarily disabled due to V8 compilation issues. It will be re-enabled in a future release.

## Architecture

### Core Components

- **DenoExtensionSupport**: Main trait for Deno extension integration
- **EventsManager**: Handles communication between Rust core and Deno extensions
- **Runtime Management**: Manages Deno runtime lifecycle and permissions
- **Extension Loader**: Loads and initializes TypeScript/JavaScript extensions

### Security Model

Deno extensions run in a sandboxed environment with:
- Controlled file system access
- Network permission management
- Limited system API access
- Isolated execution context

## Usage

### Prerequisites

1. Enable the `deno` feature in `sveditor-core`
2. Ensure Deno runtime is available
3. Configure extension permissions

### Loading Extensions

```rust
use sveditor_core_deno::DenoExtensionSupport;
use sveditor_core_api::extensions::manager::ExtensionsManager;

#[tokio::main]
async fn main() {
    let mut extensions_manager = ExtensionsManager::new(tx, None);
    
    // Load a single Deno extension
    extensions_manager.load_extension_with_deno(
        "/path/to/extension/main.ts",
        manifest_info,
        state_id,
    ).await;
    
    // Load all Deno extensions in a directory
    extensions_manager
        .load_extensions_with_deno_in_directory("/path/to/extensions", state_id)
        .await;
}
```

### Extension Structure

A typical Deno extension structure:

```
my-extension/
├── manifest.json          # Extension metadata
├── main.ts                # Entry point
├── src/
│   ├── extension.ts       # Main extension logic
│   └── utils.ts          # Utility functions
└── README.md             # Extension documentation
```

### Example Extension

```typescript
// main.ts
import { Extension, ExtensionInfo } from "symphony-api";

export class MyExtension implements Extension {
    getInfo(): ExtensionInfo {
        return {
            id: "my-extension",
            name: "My Extension",
        };
    }
    
    init(state: any): void {
        console.log("Extension initialized");
    }
    
    unload(): void {
        console.log("Extension unloaded");
    }
    
    notify(message: any): void {
        console.log("Received message:", message);
    }
}

// Export the extension
export default new MyExtension();
```

## Development

### Building

```bash
# Build the crate
cargo build --package sveditor-core-deno

# Build with features
cargo build --package sveditor-core-deno --features "full"
```

### Testing

```bash
# Run tests
cargo test --package sveditor-core-deno

# Run with Deno runtime tests
cargo test --package sveditor-core-deno --features "deno-runtime"
```

### Dependencies

- `deno_core`: Core Deno runtime functionality
- `deno_runtime`: Full Deno runtime with web APIs
- `sveditor-core-api`: Symphony core API integration
- `tokio`: Async runtime
- `serde`: Serialization for extension communication
- `anyhow`: Error handling

## Extension Development

### API Reference

Extensions have access to Symphony's full API through the global `symphony` object:

```typescript
// File operations
await symphony.fs.readFile("/path/to/file");
await symphony.fs.writeFile("/path/to/file", content);

// State management
const state = await symphony.getState();
await symphony.setState(newState);

// UI interactions
symphony.statusBar.setText("Extension loaded");
symphony.notifications.show("Hello from extension!");
```

### Best Practices

1. **Error Handling**: Always handle errors gracefully
2. **Async Operations**: Use async/await for all I/O operations
3. **Resource Cleanup**: Properly clean up resources in `unload()`
4. **Security**: Request minimal permissions needed
5. **Performance**: Avoid blocking the main thread

## Troubleshooting

### Common Issues

1. **V8 Compilation Errors**: Currently known issue, crate is disabled
2. **Permission Denied**: Check Deno permission configuration
3. **Module Not Found**: Verify extension paths and imports
4. **Runtime Errors**: Check Deno console output for details

### Debugging

Enable debug logging:

```bash
RUST_LOG=debug cargo run
```

## Future Plans

- Re-enable after resolving V8 compilation issues
- Add hot-reload support for development
- Implement extension marketplace integration
- Add TypeScript type definitions for Symphony API

## Contributing

When contributing to this crate:

1. Follow Deno security best practices
2. Add comprehensive tests for new features
3. Update documentation for API changes
4. Consider performance implications

## License

This crate is part of the Symphony project and is licensed under the MIT License.
