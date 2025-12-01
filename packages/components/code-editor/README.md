# @symphony/code-editor

A comprehensive code editor package built with Monaco Editor and React, providing a full-featured IDE experience with file management, syntax highlighting, and layout management.

## Overview

This package provides the main code editor components for the Symphony application, featuring a flexible layout system with Monaco Editor integration, file management, and various editor panels.

## Exported Components

### `Editor`
The main editor component that orchestrates the entire IDE experience with a flexible layout system.

**Features:**
- Monaco Editor integration with syntax highlighting
- Flexible layout management using FlexLayout
- File management and tab system
- Settings modal integration
- Terminal integration
- Outline view support
- Auto-save functionality
- Keyboard shortcuts support

**Usage:**
```tsx
import { Editor } from "@symphony/code-editor";

<Editor
  files={files}
  activeFileName={activeFileName}
  onFileChange={handleFileChange}
  onSave={handleSave}
/>
```

### `EditorPanel`
A panel component that wraps the Monaco Editor with additional functionality.

**Features:**
- Monaco Editor instance management
- File content editing
- Syntax highlighting
- Code completion
- Error highlighting

### `FilesProvider`
A context provider for managing file state across the editor components.

**Features:**
- File state management
- Context-based file operations
- Centralized file data handling

### `monacoOptions`
Configuration object containing default Monaco Editor options.

**Features:**
- Pre-configured editor settings
- Theme configurations
- Language support settings
- Editor behavior options

## Installation

```bash
# Using pnpm
pnpm install @symphony/code-editor
```

## Usage

```tsx
import { Editor, EditorPanel, FilesProvider, monacoOptions } from "@symphony/code-editor";

// Basic editor setup
const App = () => (
  <FilesProvider>
    <Editor
      files={files}
      activeFileName={activeFileName}
      onFileChange={handleFileChange}
    />
  </FilesProvider>
);

// Custom Monaco options
const customOptions = {
  ...monacoOptions,
  theme: 'vs-dark',
  fontSize: 14
};
```

## LSP Integration

The code-editor package includes comprehensive Language Server Protocol (LSP) type definitions for intelligent code features:

### LSP Type Definitions (`src/lsp/types.ts`)

Complete TypeScript type definitions for LSP protocol including:

- **Core Types**: Position, Range, Location, SymbolKind, SymbolInformation
- **Completion**: CompletionItem, CompletionList, CompletionParams, CompletionItemKind
- **Diagnostics**: Diagnostic, DiagnosticSeverity, PublishDiagnosticsParams
- **Navigation**: DefinitionParams, ReferenceParams, LocationLink
- **Hover**: Hover, HoverParams, MarkupContent
- **Initialization**: InitializeParams, ClientCapabilities, ServerCapabilities
- **JSON-RPC**: RequestMessage, ResponseMessage, NotificationMessage, ErrorCodes
- **Document Sync**: DidOpenTextDocumentParams, DidChangeTextDocumentParams, TextDocumentItem

These types provide the foundation for implementing LSP client functionality in Symphony IDE.

## Dependencies

- React
- Monaco Editor
- FlexLayout React
- Jotai (state management)
- Lodash
- Hotkeys-js
- Use-undo