# LSP Type Definitions

This document describes the Language Server Protocol (LSP) type definitions implemented in Symphony IDE's code-editor component.

## Overview

The `src/lsp/types.ts` file contains comprehensive TypeScript type definitions for the Language Server Protocol, providing type-safe interfaces for all LSP communication between the frontend and backend.

## Type Categories

### Core Types

**Position** - Zero-based line and character offset in a text document
```typescript
interface Position {
  line: number;
  character: number;
}
```

**Range** - Start and end positions in a text document
```typescript
interface Range {
  start: Position;
  end: Position;
}
```

**Location** - Resource identifier and range
```typescript
interface Location {
  uri: string;
  range: Range;
}
```

**SymbolKind** - Enum representing programming constructs (File, Module, Class, Function, Variable, etc.)

**SymbolInformation** - Information about programming constructs
```typescript
interface SymbolInformation {
  name: string;
  kind: SymbolKind;
  deprecated?: boolean;
  location: Location;
  containerName?: string;
}
```

**DocumentSymbol** - Hierarchical symbol information with children
```typescript
interface DocumentSymbol {
  name: string;
  detail?: string;
  kind: SymbolKind;
  deprecated?: boolean;
  range: Range;
  selectionRange: Range;
  children?: DocumentSymbol[];
}
```

### Completion Types (Task 2.1)

**CompletionItemKind** - Enum for completion item types (Text, Method, Function, Constructor, Field, Variable, Class, Interface, etc.)

**CompletionTriggerKind** - How completion was triggered (Invoked, TriggerCharacter, TriggerForIncompleteCompletions)

**InsertTextFormat** - How to interpret insert text (PlainText, Snippet)

**CompletionItem** - A completion suggestion
```typescript
interface CompletionItem {
  label: string;
  kind?: CompletionItemKind;
  detail?: string;
  documentation?: string | MarkupContent;
  insertText?: string;
  insertTextFormat?: InsertTextFormat;
  filterText?: string;
  sortText?: string;
  additionalTextEdits?: TextEdit[];
}
```

**CompletionList** - Collection of completion items
```typescript
interface CompletionList {
  isIncomplete: boolean;
  items: CompletionItem[];
}
```

**CompletionParams** - Parameters for completion request
```typescript
interface CompletionParams {
  textDocument: { uri: string };
  position: Position;
  context?: {
    triggerKind: CompletionTriggerKind;
    triggerCharacter?: string;
  };
}
```

### Diagnostic Types (Task 2.2)

**DiagnosticSeverity** - Enum for diagnostic severity (Error, Warning, Information, Hint)

**Diagnostic** - Error, warning, or hint information
```typescript
interface Diagnostic {
  range: Range;
  severity?: DiagnosticSeverity;
  code?: number | string;
  source?: string;
  message: string;
  tags?: number[];
  relatedInformation?: DiagnosticRelatedInformation[];
}
```

**DiagnosticRelatedInformation** - Related diagnostic information
```typescript
interface DiagnosticRelatedInformation {
  location: Location;
  message: string;
}
```

**PublishDiagnosticsParams** - Parameters for diagnostic notification
```typescript
interface PublishDiagnosticsParams {
  uri: string;
  diagnostics: Diagnostic[];
}
```

### Navigation Types (Task 2.3)

**DefinitionParams** - Parameters for go-to-definition request
```typescript
interface DefinitionParams {
  textDocument: { uri: string };
  position: Position;
}
```

**ReferenceParams** - Parameters for find-references request
```typescript
interface ReferenceParams {
  textDocument: { uri: string };
  position: Position;
  context: {
    includeDeclaration: boolean;
  };
}
```

**LocationLink** - Link between source and target location
```typescript
interface LocationLink {
  originSelectionRange?: Range;
  targetUri: string;
  targetRange: Range;
  targetSelectionRange: Range;
}
```

### Hover Types (Task 2.4)

**MarkupContent** - Formatted content (plaintext or markdown)
```typescript
interface MarkupContent {
  kind: 'plaintext' | 'markdown';
  value: string;
}
```

**Hover** - Hover information result
```typescript
interface Hover {
  contents: MarkupContent | string;
  range?: Range;
}
```

**HoverParams** - Parameters for hover request
```typescript
interface HoverParams {
  textDocument: { uri: string };
  position: Position;
}
```

### Initialization Types (Task 2.5)

**TextDocumentSyncKind** - Enum for document sync mode (None, Full, Incremental)

**WorkspaceFolder** - Workspace folder information
```typescript
interface WorkspaceFolder {
  uri: string;
  name: string;
}
```

**ClientCapabilities** - Client capability declaration
```typescript
interface ClientCapabilities {
  workspace?: {
    applyEdit?: boolean;
    workspaceEdit?: { documentChanges?: boolean };
    symbol?: { symbolKind?: { valueSet?: SymbolKind[] } };
  };
  textDocument?: TextDocumentClientCapabilities;
}
```

**ServerCapabilities** - Server capability declaration
```typescript
interface ServerCapabilities {
  textDocumentSync?: TextDocumentSyncKind | TextDocumentSyncOptions;
  completionProvider?: CompletionOptions;
  hoverProvider?: boolean;
  definitionProvider?: boolean;
  referencesProvider?: boolean;
  documentSymbolProvider?: boolean;
  workspaceSymbolProvider?: boolean;
}
```

**InitializeParams** - Parameters for initialize request
```typescript
interface InitializeParams {
  processId: number | null;
  clientInfo?: { name: string; version?: string };
  rootPath?: string | null;
  rootUri: string | null;
  initializationOptions?: any;
  capabilities: ClientCapabilities;
  trace?: 'off' | 'messages' | 'verbose';
  workspaceFolders?: WorkspaceFolder[] | null;
}
```

**InitializeResult** - Result from initialize request
```typescript
interface InitializeResult {
  capabilities: ServerCapabilities;
  serverInfo?: { name: string; version?: string };
}
```

### JSON-RPC Types (Task 2.6)

**RequestId** - Request identifier (string or number)

**RequestMessage** - JSON-RPC request
```typescript
interface RequestMessage {
  jsonrpc: '2.0';
  id: RequestId;
  method: string;
  params?: any;
}
```

**ResponseMessage** - JSON-RPC response
```typescript
interface ResponseMessage {
  jsonrpc: '2.0';
  id: RequestId | null;
  result?: any;
  error?: ResponseError;
}
```

**NotificationMessage** - JSON-RPC notification
```typescript
interface NotificationMessage {
  jsonrpc: '2.0';
  method: string;
  params?: any;
}
```

**Message** - Union type for all message types

**ResponseError** - Error object in response
```typescript
interface ResponseError {
  code: number;
  message: string;
  data?: any;
}
```

**ErrorCodes** - Enum for predefined error codes (ParseError, InvalidRequest, MethodNotFound, etc.)

### Document Sync Types (Task 2.7)

**TextDocumentItem** - Text document transfer object
```typescript
interface TextDocumentItem {
  uri: string;
  languageId: string;
  version: number;
  text: string;
}
```

**DidOpenTextDocumentParams** - Parameters for didOpen notification
```typescript
interface DidOpenTextDocumentParams {
  textDocument: TextDocumentItem;
}
```

**TextDocumentContentChangeEvent** - Document change event
```typescript
interface TextDocumentContentChangeEvent {
  range?: Range;
  rangeLength?: number;
  text: string;
}
```

**DidChangeTextDocumentParams** - Parameters for didChange notification
```typescript
interface DidChangeTextDocumentParams {
  textDocument: VersionedTextDocumentIdentifier;
  contentChanges: TextDocumentContentChangeEvent[];
}
```

**DidCloseTextDocumentParams** - Parameters for didClose notification
```typescript
interface DidCloseTextDocumentParams {
  textDocument: { uri: string };
}
```

**VersionedTextDocumentIdentifier** - Versioned document identifier
```typescript
interface VersionedTextDocumentIdentifier {
  uri: string;
  version: number;
}
```

**TextEdit** - Text edit operation
```typescript
interface TextEdit {
  range: Range;
  newText: string;
}
```

## Usage

Import types from the LSP types module:

```typescript
import {
  Position,
  Range,
  CompletionItem,
  CompletionParams,
  Diagnostic,
  Hover,
  InitializeParams,
  RequestMessage,
  DidOpenTextDocumentParams,
} from './lsp/types';
```

## Requirements Satisfied

- **2.1**: Completion types for code completion features
- **2.2**: Diagnostic types for error and warning display
- **2.3**: Navigation types for go-to-definition and find-references
- **2.4**: Hover types for documentation tooltips
- **2.5**: Initialization types for LSP handshake
- **2.6**: JSON-RPC types for protocol communication
- **2.7**: Document sync types for file synchronization
- **6.1**: Symbol types for workspace and document symbols
- **10.1**: Document symbol types for outline view

## Next Steps

Phase 3 will implement the LSP client using these type definitions to communicate with language servers via Symphony's IPC Bus.

## References

- [LSP Specification](https://microsoft.github.io/language-server-protocol/)
- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification)
