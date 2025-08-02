# Symphony Core API

This crate provides the core API for the Symphony backend. It defines the data structures, traits, and errors that are used throughout the Symphony ecosystem.

## Features

- **Data Structures:** Defines the core data structures used in Symphony, such as `State`, `Manifest`, and `FileInfo`.
- **Traits:** Provides traits for implementing new functionality, such as `TransportHandler`, `Filesystem`, and `Extension`.
- **Error Handling:** Defines a unified error handling system with the `Errors` enum.
- **Messaging:** Includes the `ClientMessages` and `ServerMessages` enums for communication between the client and server.

## Usage

This crate is intended to be used as a dependency for other Symphony crates. It provides the necessary building blocks for creating new extensions, transport handlers, and other components for the Symphony ecosystem.
