/// LSP Protocol Type Definitions
///
/// Type definitions for Language Server Protocol messages and data structures.
/// Based on the LSP specification: https://microsoft.github.io/language-server-protocol/

/// Position in a text document expressed as zero-based line and character offset
export interface Position {
  /// Line position in a document (zero-based)
  line: number;
  /// Character offset on a line in a document (zero-based)
  character: number;
}

/// A range in a text document expressed as (zero-based) start and end positions
export interface Range {
  /// The range's start position
  start: Position;
  /// The range's end position
  end: Position;
}

/// Represents a location inside a resource, such as a line inside a text file
export interface Location {
  /// The resource identifier
  uri: string;
  /// The range inside the resource
  range: Range;
}

/// Represents programming constructs like variables, classes, interfaces etc.
/// that appear in a document
export enum SymbolKind {
  File = 1,
  Module = 2,
  Namespace = 3,
  Package = 4,
  Class = 5,
  Method = 6,
  Property = 7,
  Field = 8,
  Constructor = 9,
  Enum = 10,
  Interface = 11,
  Function = 12,
  Variable = 13,
  Constant = 14,
  String = 15,
  Number = 16,
  Boolean = 17,
  Array = 18,
  Object = 19,
  Key = 20,
  Null = 21,
  EnumMember = 22,
  Struct = 23,
  Event = 24,
  Operator = 25,
  TypeParameter = 26,
}

/// Represents information about programming constructs like variables, classes,
/// interfaces etc.
export interface SymbolInformation {
  /// The name of this symbol
  name: string;
  /// The kind of this symbol
  kind: SymbolKind;
  /// Indicates if this symbol is deprecated
  deprecated?: boolean;
  /// The location of this symbol
  location: Location;
  /// The name of the symbol containing this symbol
  containerName?: string;
}

/// The parameters of a workspace symbol request
export interface WorkspaceSymbolParams {
  /// A query string to filter symbols by
  query: string;
}

/// Represents programming constructs like variables, classes, interfaces etc.
/// that appear in a document. Document symbols can be hierarchical and they
/// have two ranges: one that encloses its definition and one that points to its
/// most interesting range, e.g. the range of an identifier.
export interface DocumentSymbol {
  /// The name of this symbol
  name: string;
  /// More detail for this symbol, e.g the signature of a function
  detail?: string;
  /// The kind of this symbol
  kind: SymbolKind;
  /// Indicates if this symbol is deprecated
  deprecated?: boolean;
  /// The range enclosing this symbol not including leading/trailing whitespace
  /// but everything else like comments
  range: Range;
  /// The range that should be selected and revealed when this symbol is being
  /// picked, e.g. the name of a function
  selectionRange: Range;
  /// Children of this symbol, e.g. properties of a class
  children?: DocumentSymbol[];
}

/// Parameters for the document symbol request
export interface DocumentSymbolParams {
  /// The text document
  textDocument: {
    /// The text document's URI
    uri: string;
  };
}

// ============================================================================
// Completion Types (Task 2.1)
// ============================================================================

/// Defines how to interpret the insert text in a completion item
export enum InsertTextFormat {
  /// The primary text to be inserted is treated as a plain string
  PlainText = 1,
  /// The primary text to be inserted is treated as a snippet
  Snippet = 2,
}

/// The kind of a completion entry
export enum CompletionItemKind {
  Text = 1,
  Method = 2,
  Function = 3,
  Constructor = 4,
  Field = 5,
  Variable = 6,
  Class = 7,
  Interface = 8,
  Module = 9,
  Property = 10,
  Unit = 11,
  Value = 12,
  Enum = 13,
  Keyword = 14,
  Snippet = 15,
  Color = 16,
  File = 17,
  Reference = 18,
  Folder = 19,
  EnumMember = 20,
  Constant = 21,
  Struct = 22,
  Event = 23,
  Operator = 24,
  TypeParameter = 25,
}

/// How a completion was triggered
export enum CompletionTriggerKind {
  /// Completion was triggered by typing an identifier
  Invoked = 1,
  /// Completion was triggered by a trigger character
  TriggerCharacter = 2,
  /// Completion was re-triggered as the current completion list is incomplete
  TriggerForIncompleteCompletions = 3,
}

/// A completion item represents a text snippet that is proposed to complete text
export interface CompletionItem {
  /// The label of this completion item
  label: string;
  /// The kind of this completion item
  kind?: CompletionItemKind;
  /// A human-readable string with additional information
  detail?: string;
  /// A human-readable string that represents a doc-comment
  documentation?: string | MarkupContent;
  /// A string that should be inserted into a document when selecting this completion
  insertText?: string;
  /// The format of the insert text
  insertTextFormat?: InsertTextFormat;
  /// A string that should be used when filtering a set of completion items
  filterText?: string;
  /// A string that should be used when comparing this item with other items
  sortText?: string;
  /// Additional text edits that are applied when selecting this completion
  additionalTextEdits?: TextEdit[];
}

/// Represents a collection of completion items
export interface CompletionList {
  /// This list is not complete
  isIncomplete: boolean;
  /// The completion items
  items: CompletionItem[];
}

/// Completion parameters
export interface CompletionParams {
  /// The text document
  textDocument: {
    uri: string;
  };
  /// The position inside the text document
  position: Position;
  /// The completion context
  context?: {
    /// How the completion was triggered
    triggerKind: CompletionTriggerKind;
    /// The trigger character (if triggered by a character)
    triggerCharacter?: string;
  };
}

// ============================================================================
// Diagnostic Types (Task 2.2)
// ============================================================================

/// The diagnostic's severity
export enum DiagnosticSeverity {
  /// Reports an error
  Error = 1,
  /// Reports a warning
  Warning = 2,
  /// Reports an information
  Information = 3,
  /// Reports a hint
  Hint = 4,
}

/// Represents a diagnostic, such as a compiler error or warning
export interface Diagnostic {
  /// The range at which the message applies
  range: Range;
  /// The diagnostic's severity
  severity?: DiagnosticSeverity;
  /// The diagnostic's code
  code?: number | string;
  /// A human-readable string describing the source of this diagnostic
  source?: string;
  /// The diagnostic's message
  message: string;
  /// Additional metadata about the diagnostic
  tags?: number[];
  /// An array of related diagnostic information
  relatedInformation?: DiagnosticRelatedInformation[];
}

/// Represents a related message and source code location for a diagnostic
export interface DiagnosticRelatedInformation {
  /// The location of this related diagnostic information
  location: Location;
  /// The message of this related diagnostic information
  message: string;
}

/// Parameters for the publishDiagnostics notification
export interface PublishDiagnosticsParams {
  /// The URI for which diagnostic information is reported
  uri: string;
  /// An array of diagnostic information items
  diagnostics: Diagnostic[];
}

// ============================================================================
// Navigation Types (Task 2.3)
// ============================================================================

/// Parameters for the definition request
export interface DefinitionParams {
  /// The text document
  textDocument: {
    uri: string;
  };
  /// The position inside the text document
  position: Position;
}

/// Parameters for the references request
export interface ReferenceParams {
  /// The text document
  textDocument: {
    uri: string;
  };
  /// The position inside the text document
  position: Position;
  /// Include the declaration of the current symbol
  context: {
    includeDeclaration: boolean;
  };
}

/// Represents a link between a source and a target location
export interface LocationLink {
  /// Span of the origin of this link
  originSelectionRange?: Range;
  /// The target resource identifier of this link
  targetUri: string;
  /// The full target range of this link
  targetRange: Range;
  /// The range that should be selected and revealed when this link is being followed
  targetSelectionRange: Range;
}

// ============================================================================
// Hover Types (Task 2.4)
// ============================================================================

/// The result of a hover request
export interface Hover {
  /// The hover's content
  contents: MarkupContent | string;
  /// An optional range
  range?: Range;
}

/// Parameters for the hover request
export interface HoverParams {
  /// The text document
  textDocument: {
    uri: string;
  };
  /// The position inside the text document
  position: Position;
}

/// Describes the content type that a client supports in various result literals
export interface MarkupContent {
  /// The type of the Markup
  kind: 'plaintext' | 'markdown';
  /// The content itself
  value: string;
}

// ============================================================================
// Initialization Types (Task 2.5)
// ============================================================================

/// Defines how the host (editor) should sync document changes to the language server
export enum TextDocumentSyncKind {
  /// Documents should not be synced at all
  None = 0,
  /// Documents are synced by always sending the full content
  Full = 1,
  /// Documents are synced by sending the full content on open
  Incremental = 2,
}

/// The initialize parameters
export interface InitializeParams {
  /// The process Id of the parent process that started the server
  processId: number | null;
  /// Information about the client
  clientInfo?: {
    /// The name of the client as defined by the client
    name: string;
    /// The client's version as defined by the client
    version?: string;
  };
  /// The rootPath of the workspace (deprecated in favor of rootUri)
  rootPath?: string | null;
  /// The rootUri of the workspace
  rootUri: string | null;
  /// User provided initialization options
  initializationOptions?: any;
  /// The capabilities provided by the client
  capabilities: ClientCapabilities;
  /// The initial trace setting
  trace?: 'off' | 'messages' | 'verbose';
  /// The workspace folders configured in the client
  workspaceFolders?: WorkspaceFolder[] | null;
}

/// A workspace folder
export interface WorkspaceFolder {
  /// The associated URI for this workspace folder
  uri: string;
  /// The name of the workspace folder
  name: string;
}

/// Client capabilities
export interface ClientCapabilities {
  /// Workspace specific client capabilities
  workspace?: {
    /// The client supports applying batch edits
    applyEdit?: boolean;
    /// Capabilities specific to `WorkspaceEdit`s
    workspaceEdit?: {
      /// The client supports versioned document changes
      documentChanges?: boolean;
    };
    /// Capabilities specific to the `workspace/symbol` request
    symbol?: {
      /// Specific capabilities for the `SymbolKind`
      symbolKind?: {
        /// The symbol kind values the client supports
        valueSet?: SymbolKind[];
      };
    };
  };
  /// Text document specific client capabilities
  textDocument?: TextDocumentClientCapabilities;
}

/// Text document specific client capabilities
export interface TextDocumentClientCapabilities {
  /// Capabilities specific to the `textDocument/completion` request
  completion?: {
    /// The client supports the following `CompletionItem` specific capabilities
    completionItem?: {
      /// Client supports snippets as insert text
      snippetSupport?: boolean;
      /// Client supports commit characters on a completion item
      commitCharactersSupport?: boolean;
      /// Client supports the following content formats for the documentation property
      documentationFormat?: ('plaintext' | 'markdown')[];
    };
    /// The client supports the following `CompletionItemKind` values
    completionItemKind?: {
      /// The completion item kind values the client supports
      valueSet?: CompletionItemKind[];
    };
  };
  /// Capabilities specific to the `textDocument/hover` request
  hover?: {
    /// Client supports the following content formats for the content property
    contentFormat?: ('plaintext' | 'markdown')[];
  };
  /// Capabilities specific to the `textDocument/definition` request
  definition?: {
    /// The client supports additional metadata in the form of definition links
    linkSupport?: boolean;
  };
}

/// Server capabilities
export interface ServerCapabilities {
  /// Defines how text documents are synced
  textDocumentSync?: TextDocumentSyncKind | TextDocumentSyncOptions;
  /// The server provides completion support
  completionProvider?: CompletionOptions;
  /// The server provides hover support
  hoverProvider?: boolean;
  /// The server provides goto definition support
  definitionProvider?: boolean;
  /// The server provides find references support
  referencesProvider?: boolean;
  /// The server provides document symbol support
  documentSymbolProvider?: boolean;
  /// The server provides workspace symbol support
  workspaceSymbolProvider?: boolean;
}

/// Completion options
export interface CompletionOptions {
  /// The server provides support to resolve additional information for a completion item
  resolveProvider?: boolean;
  /// The characters that trigger completion automatically
  triggerCharacters?: string[];
}

/// Text document sync options
export interface TextDocumentSyncOptions {
  /// Open and close notifications are sent to the server
  openClose?: boolean;
  /// Change notifications are sent to the server
  change?: TextDocumentSyncKind;
  /// Will save notifications are sent to the server
  willSave?: boolean;
  /// Will save wait until requests are sent to the server
  willSaveWaitUntil?: boolean;
  /// Save notifications are sent to the server
  save?: {
    /// The client is supposed to include the content on save
    includeText?: boolean;
  };
}

/// The result returned from an initialize request
export interface InitializeResult {
  /// The capabilities the language server provides
  capabilities: ServerCapabilities;
  /// Information about the server
  serverInfo?: {
    /// The name of the server as defined by the server
    name: string;
    /// The server's version as defined by the server
    version?: string;
  };
}

// ============================================================================
// JSON-RPC Types (Task 2.6)
// ============================================================================

/// A request id can be a string or number
export type RequestId = string | number;

/// A JSON-RPC request message
export interface RequestMessage {
  /// The JSON-RPC version (always "2.0")
  jsonrpc: '2.0';
  /// The request id
  id: RequestId;
  /// The method to be invoked
  method: string;
  /// The method's params
  params?: any;
}

/// A JSON-RPC response message
export interface ResponseMessage {
  /// The JSON-RPC version (always "2.0")
  jsonrpc: '2.0';
  /// The request id
  id: RequestId | null;
  /// The result of a request (only present if successful)
  result?: any;
  /// The error object in case a request fails (only present if failed)
  error?: ResponseError;
}

/// A JSON-RPC notification message
export interface NotificationMessage {
  /// The JSON-RPC version (always "2.0")
  jsonrpc: '2.0';
  /// The method to be invoked
  method: string;
  /// The notification's params
  params?: any;
}

/// A JSON-RPC message (can be request, response, or notification)
export type Message = RequestMessage | ResponseMessage | NotificationMessage;

/// An error object returned in a response
export interface ResponseError {
  /// A number indicating the error type that occurred
  code: number;
  /// A string providing a short description of the error
  message: string;
  /// Additional information about the error
  data?: any;
}

/// Predefined error codes
export enum ErrorCodes {
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
  ServerNotInitialized = -32002,
  UnknownErrorCode = -32001,
  RequestCancelled = -32800,
  ContentModified = -32801,
}

// ============================================================================
// Document Sync Types (Task 2.7)
// ============================================================================

/// An item to transfer a text document from the client to the server
export interface TextDocumentItem {
  /// The text document's URI
  uri: string;
  /// The text document's language identifier
  languageId: string;
  /// The version number of this document
  version: number;
  /// The content of the opened text document
  text: string;
}

/// Parameters for the didOpen notification
export interface DidOpenTextDocumentParams {
  /// The document that was opened
  textDocument: TextDocumentItem;
}

/// An event describing a change to a text document
export interface TextDocumentContentChangeEvent {
  /// The range of the document that changed
  range?: Range;
  /// The length of the range that got replaced (deprecated)
  rangeLength?: number;
  /// The new text of the range/document
  text: string;
}

/// Parameters for the didChange notification
export interface DidChangeTextDocumentParams {
  /// The document that did change
  textDocument: VersionedTextDocumentIdentifier;
  /// The actual content changes
  contentChanges: TextDocumentContentChangeEvent[];
}

/// Parameters for the didClose notification
export interface DidCloseTextDocumentParams {
  /// The document that was closed
  textDocument: {
    /// The text document's URI
    uri: string;
  };
}

/// A versioned text document identifier
export interface VersionedTextDocumentIdentifier {
  /// The text document's URI
  uri: string;
  /// The version number of this document
  version: number;
}

/// A text edit applicable to a text document
export interface TextEdit {
  /// The range of the text document to be manipulated
  range: Range;
  /// The string to be inserted
  newText: string;
}
