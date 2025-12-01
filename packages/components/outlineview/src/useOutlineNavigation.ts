/// Outline Navigation Hook
///
/// Provides utilities for navigating to symbols in the editor
/// and updating the outline when content changes.

import { useCallback, useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { outlineAtom } from './outlineAtom';
import { DocumentSymbol, Position } from './types';

/// Props for the outline navigation hook
export interface UseOutlineNavigationProps {
  /// Monaco editor instance
  editor: any; // monaco.editor.IStandaloneCodeEditor
  /// LSP client for requesting document symbols
  lspClient?: {
    documentSymbol: (params: { textDocument: { uri: string } }) => Promise<DocumentSymbol[]>;
  };
  /// Current document URI
  documentUri?: string;
}

/// Hook for outline navigation and updates
///
/// Provides functions for navigating to symbols and automatically
/// updating the outline when the document content changes.
///
/// # Features
///
/// - Navigate to symbol location in editor
/// - Automatically request document symbols
/// - Update outline on content changes
/// - Debounced updates for performance
///
/// # Examples
///
/// ```tsx
/// const { navigateToSymbol, refreshOutline } = useOutlineNavigation({
///   editor: editorRef.current,
///   lspClient: lspClient,
///   documentUri: currentFileUri,
/// });
///
/// // Use in OutlineView
/// <OutlineView onSelectItem={navigateToSymbol} />
/// ```
///
/// # Requirements
///
/// Validates requirements:
/// - 10.3: Navigate to symbol on click
/// - 10.4: Update outline on content changes
export function useOutlineNavigation({
  editor,
  lspClient,
  documentUri,
}: UseOutlineNavigationProps) {
  const setOutline = useSetAtom(outlineAtom);

  /// Navigate to a symbol's location in the editor
  ///
  /// Moves the cursor to the symbol's selection range and reveals
  /// the position in the viewport.
  ///
  /// # Arguments
  /// * `symbol` - The document symbol to navigate to
  const navigateToSymbol = useCallback(
    (symbol: DocumentSymbol) => {
      if (!editor) return;

      const position = symbol.selectionRange.start;
      
      // Convert to Monaco position (1-based line numbers)
      const monacoPosition = {
        lineNumber: position.line + 1,
        column: position.character + 1,
      };

      // Set cursor position
      editor.setPosition(monacoPosition);
      
      // Reveal the position in the center of the viewport
      editor.revealPositionInCenter(monacoPosition);
      
      // Focus the editor
      editor.focus();
    },
    [editor]
  );

  /// Request document symbols from LSP server
  ///
  /// Fetches the current document's symbol outline from the LSP
  /// server and updates the outline atom.
  const refreshOutline = useCallback(async () => {
    if (!lspClient || !documentUri) {
      setOutline([]);
      return;
    }

    try {
      const symbols = await lspClient.documentSymbol({
        textDocument: { uri: documentUri },
      });
      setOutline(symbols);
    } catch (error) {
      console.error('Failed to fetch document symbols:', error);
      setOutline([]);
    }
  }, [lspClient, documentUri, setOutline]);

  /// Automatically refresh outline when document changes
  useEffect(() => {
    if (!editor || !lspClient || !documentUri) return;

    // Initial load
    refreshOutline();

    // Listen for content changes
    const disposable = editor.onDidChangeModelContent(() => {
      // Debounce the refresh to avoid excessive requests
      const timeoutId = setTimeout(() => {
        refreshOutline();
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
    });

    return () => {
      disposable?.dispose();
    };
  }, [editor, lspClient, documentUri, refreshOutline]);

  return {
    navigateToSymbol,
    refreshOutline,
  };
}
