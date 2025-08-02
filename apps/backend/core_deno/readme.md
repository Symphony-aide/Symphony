# Symphony Deno Core

This crate provides a Deno runtime for executing Symphony extensions written in TypeScript or JavaScript. It allows developers to write extensions in their preferred language and have them run securely in a sandboxed environment.

## Features

- **Deno Runtime:** Utilizes the Deno runtime to execute extensions, providing a secure and modern environment for running JavaScript and TypeScript code.
- **Extension Support:** Implements the `DenoExtensionSupport` trait, which allows the `ExtensionsManager` to load and manage Deno-based extensions.
- **Event Management:** Includes an `EventsManager` to handle communication between the core and the Deno extensions.

## Usage

To use the Deno core, you need to enable the `deno` feature in the `sveditor-core` crate. Once enabled, you can load Deno extensions using the `load_extension_with_deno` and `load_extensions_with_deno_in_directory` methods on the `ExtensionsManager`.

```rust
use sveditor_core_deno::DenoExtensionSupport;
use sveditor_core_api::extensions::manager::ExtensionsManager;

# async fn load_extensions(mut extensions_manager: ExtensionsManager) {
// Load a single Deno extension
extensions_manager.load_extension_with_deno(
    "/path/to/extension/main.ts",
    manifest_info, // The extension's manifest information
    state_id,
);

// Load all Deno extensions in a directory
extensions_manager.load_extensions_with_deno_in_directory("/path/to/extensions", state_id).await;
# }
```
