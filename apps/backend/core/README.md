# Symphony Core

This crate provides the core functionality of the Symphony backend server. It is responsible for managing the server's state, handling transport protocols, and exposing a JSON-RPC API for clients to interact with.

## Features

- **State Management:** The core crate manages a list of states, where each state represents a unique instance of the editor with its own set of extensions and configurations.
- **Transport Handlers:** It supports different transport handlers, such as HTTP and local handlers, to communicate with clients.
- **JSON-RPC API:** The crate exposes a comprehensive JSON-RPC API that allows clients to perform various operations, including:
    - Retrieving and updating states
    - Reading and writing files
    - Listing directory contents
    - Managing extensions
    - Interacting with language servers and terminal shells
- **Extensibility:** The core is designed to be extensible, allowing developers to add new features and functionality through extensions.

## Usage

To use the Symphony Core, you need to create a `Server` instance and run it. The server requires a configuration and a list of states to be initialized.

```rust
use std::sync::Arc;
use sveditor_core::{
    handlers::HTTPHandler,
    Configuration,
    Server,
};
use sveditor_core_api::{
    extensions::manager::ExtensionsManager,
    messaging::ClientMessages,
    states::{
        StatesList,
        TokenFlags,
        MemoryPersistor,
    },
    State
};
use tokio::sync::{
    mpsc::channel,
    Mutex
};

# tokio_test::block_on(async {
let (server_tx, server_rx) = channel::<ClientMessages>(1);

// A pointer to a StatesList
let states = {
    // A basic State with ID '1' and no extensions
    let sample_state = State::new(1, ExtensionsManager::new(server_tx.clone(), None), Box::new(MemoryPersistor::new()));

    // A StatesList with the previous state
    let states = StatesList::new()
        .with_state(sample_state);

    Arc::new(Mutex::new(states))
};

// Crate a HTTP TransportHandler and a configuration
let http_handler = HTTPHandler::builder().build();

// Create the configuration
let config = Configuration::new(Box::new(http_handler), server_tx, server_rx);

// Create a server
let mut server = Server::new(config, states);

// Run the Server
server.run();
# })
```

## JSON-RPC API

The JSON-RPC API is defined in the `RpcMethods` trait. It provides a set of methods for clients to interact with the server. For more details on the available methods and their parameters, please refer to the `RpcMethods` trait in the source code.
