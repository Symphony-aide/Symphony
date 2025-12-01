/// Type definitions for Outline View component
///
/// LSP document symbol types for hierarchical outline display

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

/// Document symbol with hierarchical structure
export interface DocumentSymbol {
  name: string;
  detail?: string;
  kind: SymbolKind;
  deprecated?: boolean;
  range: Range;
  selectionRange: Range;
  children?: DocumentSymbol[];
}
