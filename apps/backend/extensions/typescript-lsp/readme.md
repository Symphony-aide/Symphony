# TypeScript/JavaScript LSP Extension for Symphony

A comprehensive Language Server Protocol (LSP) extension for TypeScript and JavaScript that brings advanced code intelligence features to the Symphony code editor.

## Features

- **🚀 Language Server Protocol**: Full LSP implementation for TypeScript and JavaScript
- **💡 IntelliSense**: Advanced code completion with type information
- **🔍 Diagnostics**: Real-time error detection and warnings
- **📍 Go-to-Definition**: Navigate to symbol definitions
- **🔄 Auto-completion**: Context-aware code suggestions
- **⚙️ Manual Control**: Commands for enabling/disabling the language server

## Installation

This extension is built-in to Symphony and automatically loaded when the editor starts. No additional installation is required.

## Usage

### Automatic Activation

The extension automatically activates when you open TypeScript (`.ts`, `.tsx`) or JavaScript (`.js`, `.jsx`) files. The language server will start in the background and begin providing code intelligence features.

### Manual Control

You can manually control the language server using these commands:

- `js_ls.enable`: Enable the TypeScript/JavaScript language server
- `js_ls.disable`: Disable the TypeScript/JavaScript language server

### Supported Features

1. **Code Completion**: Get intelligent suggestions as you type
2. **Error Detection**: See syntax and type errors in real-time
3. **Hover Information**: View type information and documentation on hover
4. **Go-to-Definition**: Navigate to function and variable definitions
5. **Find References**: Locate all references to a symbol

## Configuration

The extension uses the TypeScript Language Server (`tsserver`) which respects your project's TypeScript configuration:

- `tsconfig.json`: TypeScript project configuration
- `jsconfig.json`: JavaScript project configuration
- `package.json`: Project dependencies and settings

## Architecture

### Core Components

- **LSP Client**: Manages communication with the TypeScript language server
- **Process Management**: Handles language server lifecycle
- **Message Handling**: Processes LSP messages and responses
- **Extension Integration**: Integrates with Symphony's extension system

### Communication Flow

```
Symphony Editor ↔ LSP Extension ↔ TypeScript Language Server
```

## Development

### Building

Build the extension as part of the Symphony workspace:

```bash
cargo build --package typescript-lsp-symphony
```

### Testing

Run the extension tests:

```bash
cargo test --package typescript-lsp-symphony
```

### Dependencies

- `interactive_process`: Process management for the language server
- `serde`: Serialization for LSP message handling
- `sveditor-core-api`: Symphony core API integration
- `snailquote`: String escaping utilities
- `bytes`: Byte buffer management
- `tracing`: Logging and diagnostics

## Troubleshooting

### Language Server Not Starting

1. Ensure TypeScript is installed globally or in your project
2. Check that `tsserver` is available in your PATH
3. Verify your project has a valid `tsconfig.json` or `jsconfig.json`

### Performance Issues

1. Large projects may take time to initialize
2. Consider excluding unnecessary files in your TypeScript configuration
3. Use project references for multi-project setups

## Contributing

When contributing to this extension:

1. Follow LSP specification guidelines
2. Ensure all public functions have comprehensive documentation
3. Add tests for new functionality
4. Update this README when adding features

## License

This extension is part of the Symphony project and is licensed under the MIT License.
