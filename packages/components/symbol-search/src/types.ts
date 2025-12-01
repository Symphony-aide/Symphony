/// Type definitions for Symbol Search component
///
/// Re-exports LSP types needed for symbol search functionality

/// Position in a text document
export interface Position {
  line: number;
  character: number;
}

/// Range in a text document
export interface Range {
  start: Position;
  end: Position;
}

/// Location in a resource
export interface Location {
  uri: string;
  range: Range;
}

/// Symbol kinds from LSP specification
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

/// Symbol information from LSP
export interface SymbolInformation {
  name: string;
  kind: SymbolKind;
  deprecated?: boolean;
  location: Location;
  containerName?: string;
}
