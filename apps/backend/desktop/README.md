# Symphony Desktop

This crate contains the desktop client for Symphony, built using the Tauri framework. It provides a graphical user interface for interacting with the Symphony backend.

## Features

- **Tauri Framework:** Built with Tauri, which allows for the creation of cross-platform desktop applications using web technologies.
- **Local Communication:** Communicates with the Symphony core using a local transport handler, ensuring a fast and efficient connection.
- **Webview Interface:** Uses a webview to render the user interface, allowing for a flexible and customizable user experience.

## Usage

To run the Symphony Desktop application, you can use the following command:

```bash
cargo tauri dev
```

This will build and run the application in development mode. To build a production version, you can use the following command:

```bash
cargo tauri build
```
