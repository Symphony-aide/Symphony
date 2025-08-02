# Symphony Server

This crate provides a standalone server for Symphony. It uses the `sveditor-core` crate to create an HTTP server that can be used to interact with the Symphony backend.

## Features

- **HTTP Server:** Creates an HTTP server that exposes the Symphony JSON-RPC API.
- **Extension Loading:** Loads the `git-for-symphony` extension by default.

## Usage

To run the server, you can use the following command:

```bash
cargo run
```

This will start the server on `http://localhost:8080`. You can then interact with the server using a JSON-RPC client.
