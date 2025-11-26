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
