/// LSP Client for Symphony IDE
///
/// Provides typed interface for communicating with Language Server Protocol
/// servers through Symphony's IPC system.

import {
  WorkspaceSymbolParams,
  SymbolInformation,
  DocumentSymbolParams,
  DocumentSymbol,
} from './types.js';

/// LSP Client interface for workspace and document symbol operations
///
/// Handles communication with LSP servers for symbol-related features
/// including workspace symbol search and document outline.
export interface LSPClient {
  /// Request workspace symbols matching a query
  ///
  /// Sends a workspace/symbol request to the LSP server to find symbols
  /// across the entire workspace that match the given query string.
  ///
  /// # Arguments
  /// * `params` - Parameters including the search query
  ///
  /// # Returns
  /// Promise resolving to array of matching symbols
  ///
  /// # Examples
  /// ```typescript
  /// const symbols = await client.workspaceSymbol({
  ///   query: "MyClass"
  /// });
  /// ```
  workspaceSymbol(params: WorkspaceSymbolParams): Promise<SymbolInformation[]>;

  /// Request document symbols for a specific file
  ///
  /// Sends a textDocument/documentSymbol request to get the outline
  /// structure of a document including all symbols and their hierarchy.
  ///
  /// # Arguments
  /// * `params` - Parameters including the document URI
  ///
  /// # Returns
  /// Promise resolving to array of document symbols
  ///
  /// # Examples
  /// ```typescript
  /// const symbols = await client.documentSymbol({
  ///   textDocument: { uri: "file:///path/to/file.ts" }
  /// });
  /// ```
  documentSymbol(params: DocumentSymbolParams): Promise<DocumentSymbol[]>;
}

/// Mock LSP client for development and testing
///
/// Provides a mock implementation of the LSP client interface
/// for use when no real LSP server is available.
export class MockLSPClient implements LSPClient {
  async workspaceSymbol(params: WorkspaceSymbolParams): Promise<SymbolInformation[]> {
    // Mock implementation - returns empty array
    console.log('Mock workspace symbol search:', params.query);
    return [];
  }

  async documentSymbol(params: DocumentSymbolParams): Promise<DocumentSymbol[]> {
    // Mock implementation - returns empty array
    console.log('Mock document symbol request:', params.textDocument.uri);
    return [];
  }
}

/// Fuzzy matching utility for symbol search
///
/// Implements fuzzy string matching for filtering symbol results.
/// Matches if all characters in the query appear in order in the target string.
///
/// # Arguments
/// * `query` - Search query string
/// * `target` - Target string to match against
///
/// # Returns
/// true if query fuzzy matches target
///
/// # Examples
/// ```typescript
/// fuzzyMatch("myclss", "MyClass") // true
/// fuzzyMatch("mc", "MyClass") // true
/// fuzzyMatch("xyz", "MyClass") // false
/// ```
export function fuzzyMatch(query: string, target: string): boolean {
  const lowerQuery = query.toLowerCase();
  const lowerTarget = target.toLowerCase();
  
  let queryIndex = 0;
  let targetIndex = 0;
  
  while (queryIndex < lowerQuery.length && targetIndex < lowerTarget.length) {
    if (lowerQuery[queryIndex] === lowerTarget[targetIndex]) {
      queryIndex++;
    }
    targetIndex++;
  }
  
  return queryIndex === lowerQuery.length;
}

/// Filter symbols using fuzzy matching
///
/// Filters an array of symbols to only include those that fuzzy match
/// the given query string. Matches against symbol name and container name.
///
/// # Arguments
/// * `symbols` - Array of symbols to filter
/// * `query` - Search query string
///
/// # Returns
/// Filtered array of symbols
///
/// # Examples
/// ```typescript
/// const filtered = filterSymbolsByQuery(allSymbols, "myFunc");
/// ```
export function filterSymbolsByQuery(
  symbols: SymbolInformation[],
  query: string
): SymbolInformation[] {
  if (!query) {
    return symbols;
  }
  
  return symbols.filter(symbol => {
    const nameMatch = fuzzyMatch(query, symbol.name);
    const containerMatch = symbol.containerName 
      ? fuzzyMatch(query, symbol.containerName)
      : false;
    
    return nameMatch || containerMatch;
  });
}
