# Implementation Plan

## Architecture Note

This implementation uses **Monaco Built-in + Backend LSP** architecture:
- **Monaco Editor**: Built-in syntax highlighting (TextMate grammars) and virtual scrolling
- **Backend LSP**: Extends existing typescript-lsp pattern for all languages  
- **IPC Communication**: Uses Symphony's proven IPC Bus for frontend-backend communication
- **Benefits**: Universal language support, rapid development, production-ready, reuses existing code

This is the simplest and fastest approach - extends what already works.

## Phase 1: Monaco Editor Configuration

- [x] 1. Configure Monaco Editor for Symphony (COMPLETE)
  - ✅ Created `monacoConfig.ts` (376 lines) with comprehensive configuration
  - ✅ Defined 13+ supported languages with Monaco identifiers
  - ✅ Implemented 20+ file extension mappings for language detection
  - ✅ Configured built-in themes (vs-dark, vs-light, hc-black)
  - ✅ Set up default editor options optimized for Symphony
  - ✅ Implemented language-specific settings (Python, JS/TS, Rust, Go)
  - ✅ Created performance configuration for 10,000+ line files
  - ✅ Implemented utility functions: `getLanguageFromFileName()`, `getEditorOptionsForLanguage()`, `verifyMonacoConfiguration()`
  - ✅ Virtual scrolling enabled by default in Monaco
  - ✅ Updated README.md with new API documentation
  - ✅ Updated MONACO_CONFIGURATION.md with implementation details
  - _Requirements: 1.1, 1.3, 1.4, 8.5_

- [ ]* 1.1 Write property test for syntax highlighting
  - **Property 1: Syntax highlighting applies to all supported files**
  - **Validates: Requirements 1.1**

- [ ]* 1.2 Write property test for theme changes
  - **Property 2: Theme changes update all syntax colors**
  - **Validates: Requirements 1.4**

- [x] 1.2 Test Monaco with large files

  - Test with 10,000+ line files
  - Verify virtual scrolling performance
  - Measure syntax highlighting latency (<100ms target)
  - Verify memory usage is acceptable
  - _Requirements: 8.1, 8.2, 8.5_

## Phase 2: LSP Type Definitions

- [x] 2. Core LSP types (COMPLETE)
  - Position, Range, Location types defined
  - SymbolKind enum and SymbolInformation defined
  - DocumentSymbol with hierarchical structure
  - WorkspaceSymbolParams and DocumentSymbolParams
  - _Requirements: 6.1, 10.1_

- [ ] 2.1 Add completion types
  - CompletionItem, CompletionList, CompletionParams
  - CompletionItemKind and CompletionTriggerKind enums
  - _Requirements: 2.1, 2.2_

- [ ] 2.2 Add diagnostic types
  - Diagnostic, DiagnosticSeverity, PublishDiagnosticsParams
  - _Requirements: 3.1, 3.2_

- [ ] 2.3 Add navigation types
  - DefinitionParams, ReferenceParams, LocationLink
  - _Requirements: 4.1, 4.5_

- [ ] 2.4 Add hover types
  - HoverParams, Hover, MarkupContent
  - _Requirements: 5.1, 5.2_

- [ ] 2.5 Add initialization types
  - InitializeParams, ClientCapabilities, ServerCapabilities
  - TextDocumentSyncKind enum
  - _Requirements: 7.1_

- [ ] 2.6 Add JSON-RPC types
  - Message, Request, Response, Notification
  - RequestId, ResponseError, ErrorCodes
  - _Requirements: 7.1_

- [ ] 2.7 Add document sync types
  - DidOpenTextDocumentParams, DidChangeTextDocumentParams, DidCloseTextDocumentParams
  - TextDocumentItem, VersionedTextDocumentIdentifier
  - _Requirements: 7.1_

## Phase 3: Frontend LSP Client

- [ ] 3. Implement JSON-RPC protocol
  - Message serialization (request, notification, response)
  - Content-Length header handling
  - Request ID generation
  - _Requirements: 7.1_

- [ ] 3.1 Implement LSP client core
  - Create LSPClientImpl class
  - Connection management via IPC
  - Request/response tracking with Promises
  - Notification handler registration
  - _Requirements: 7.1_

- [ ] 3.2 Implement initialization
  - initialize() method with capability negotiation
  - initialized notification
  - Store server capabilities
  - _Requirements: 7.1_

- [ ] 3.3 Implement document synchronization
  - didOpen(), didChange(), didClose() methods
  - Document version tracking
  - Debounce didChange (300ms)
  - _Requirements: 7.1, 8.4_

- [ ] 3.4 Implement feature methods
  - completion() and completionResolve()
  - definition() and references()
  - hover()
  - workspaceSymbol() and documentSymbol() (already stubbed)
  - onPublishDiagnostics() handler
  - _Requirements: 2.1, 3.1, 4.1, 4.5, 5.1, 6.1, 10.1_

- [ ]* 3.5 Write unit tests for LSP client
  - Test JSON-RPC serialization
  - Test request/response matching
  - Test notification handling
  - _Requirements: 7.1_

## Phase 4: Backend LSP Manager Extension

- [ ] 4. Create lsp-manager Rust extension
  - Create crate at apps/backend/developed_extensions/lsp-manager/
  - Set up Cargo.toml with dependencies
  - Create extension manifest
  - _Requirements: 7.1_

- [ ] 4.1 Implement language detection
  - File extension to language mapping
  - Support TypeScript, JavaScript, Python, Rust, Go
  - _Requirements: 7.1_

- [ ]* 4.2 Write property test for language detection
  - **Property 21: Language detection spawns correct server**
  - **Validates: Requirements 7.1**

- [ ] 4.2 Implement server configuration
  - ServerConfiguration struct (command, args, env, cwd)
  - Default configs for all supported languages
  - Custom server path support
  - _Requirements: 9.1, 9.3_

- [ ]* 4.3 Write property test for custom paths
  - **Property 26: Custom server paths are used**
  - **Validates: Requirements 9.1**

- [ ] 4.3 Implement process management
  - LSPServerProcess struct
  - Process spawning with stdio
  - Health monitoring
  - Graceful shutdown
  - _Requirements: 7.1, 7.3_

- [ ] 4.4 Implement auto-restart
  - Crash detection
  - Restart with exponential backoff
  - Maximum restart attempts (5)
  - _Requirements: 7.2_

- [ ]* 4.5 Write property test for auto-restart
  - **Property 22: Server crashes trigger automatic restart**
  - **Validates: Requirements 7.2**

- [ ] 4.5 Implement server registry
  - LSPServerInstance tracking
  - Server reuse by language
  - Active document tracking
  - _Requirements: 7.5_

- [ ]* 4.6 Write property test for server reuse
  - **Property 24: Same language reuses server instance**
  - **Validates: Requirements 7.5**

- [ ] 4.6 Implement LSP manager coordinator
  - LSPExtensionManager struct
  - startServer(), stopServer(), stopAllServers()
  - _Requirements: 7.1, 7.3_

- [ ]* 4.7 Write property test for shutdown
  - **Property 23: IDE shutdown stops all servers**
  - **Validates: Requirements 7.3**

- [ ] 4.7 Implement IPC routing
  - Handle LSP requests from frontend
  - Route to appropriate server
  - Forward responses back
  - _Requirements: 7.1_

- [ ] 4.8 Add logging
  - Structured logging for LSP events
  - Debug logging for messages
  - User-facing error notifications
  - _Requirements: 7.4, 9.4_

- [ ]* 4.9 Write property test for logging
  - **Property 28: LSP messages are logged when enabled**
  - **Validates: Requirements 9.4**

## Phase 5: Monaco Completion Provider

- [ ] 5. Implement completion provider
  - Create CompletionProvider class
  - Register with Monaco
  - Map LSP to Monaco format
  - _Requirements: 2.1, 2.2_

- [ ]* 5.1 Write property test for completion display
  - **Property 4: Completion items display with correct metadata**
  - **Validates: Requirements 2.2**

- [ ]* 5.2 Write property test for completion insertion
  - **Property 5: Completion insertion places text at cursor**
  - **Validates: Requirements 2.3**

- [ ]* 5.3 Write property test for completion filtering
  - **Property 6: Completion filtering matches typed prefix**
  - **Validates: Requirements 2.5**

- [ ] 5.1 Add completion features
  - Item kind icons
  - Snippet support
  - Debouncing (200ms)
  - Request cancellation
  - _Requirements: 2.2, 2.3, 2.5, 8.4_

- [ ]* 5.4 Write property test for debouncing
  - **Property 25: Rapid input is debounced**
  - **Validates: Requirements 8.4**

## Phase 6: Monaco Diagnostic Integration

- [ ] 6. Implement diagnostic handler
  - Handle publishDiagnostics notifications
  - Convert LSP to Monaco markers
  - Update markers on changes
  - _Requirements: 3.1, 3.2_

- [ ]* 6.1 Write property test for diagnostic display
  - **Property 7: Diagnostics appear in editor gutter**
  - **Validates: Requirements 3.1**

- [ ]* 6.2 Write property test for diagnostic updates
  - **Property 9: Diagnostic updates refresh UI markers**
  - **Validates: Requirements 3.4**

- [ ]* 6.3 Write property test for diagnostic tooltips
  - **Property 8: Diagnostic tooltips show full messages**
  - **Validates: Requirements 3.3**

- [ ]* 6.4 Write property test for severity display
  - **Property 10: Highest severity diagnostic shows in gutter**
  - **Validates: Requirements 3.5**

- [ ] 6.1 Add diagnostic features
  - Gutter icons by severity
  - Squiggly underlines
  - Hover tooltips
  - Severity-based display
  - _Requirements: 3.1, 3.3, 3.4, 3.5_

## Phase 7: Monaco Navigation Providers

- [ ] 7. Implement definition provider
  - Create DefinitionProvider
  - Handle single/multiple locations
  - Cross-file navigation
  - _Requirements: 4.1, 4.2, 4.3_

- [ ]* 7.1 Write property test for cross-file navigation
  - **Property 11: Cross-file navigation opens correct location**
  - **Validates: Requirements 4.2**

- [ ]* 7.2 Write property test for multiple definitions
  - **Property 12: Multiple definitions show selection list**
  - **Validates: Requirements 4.3**

- [ ] 7.1 Implement references provider
  - Create ReferenceProvider
  - Display results panel
  - _Requirements: 4.5_

- [ ]* 7.3 Write property test for find references
  - **Property 13: Find references displays all locations**
  - **Validates: Requirements 4.5**

- [ ] 7.2 Add error handling
  - Handle "not found" gracefully
  - Display informative messages
  - _Requirements: 4.4_

## Phase 8: Monaco Hover Provider

- [ ] 8. Implement hover provider
  - Create HoverProvider
  - Handle markdown content
  - Syntax highlight code blocks
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ]* 8.1 Write property test for hover requests
  - **Property 14: Hover requests sent for all symbols**
  - **Validates: Requirements 5.1**

- [ ]* 8.2 Write property test for markdown rendering
  - **Property 15: Markdown in hover renders correctly**
  - **Validates: Requirements 5.3**

- [ ]* 8.3 Write property test for code block highlighting
  - **Property 16: Code blocks in hover are highlighted**
  - **Validates: Requirements 5.4**

- [ ] 8.1 Optimize hover
  - Debounce requests (200ms)
  - Cancel stale requests
  - Cache results
  - _Requirements: 5.2, 8.4_

## Phase 9: Symbol Search Integration

- [x] 9. Symbol search UI (COMPLETE)
  - SymbolSearch component implemented
  - _Requirements: 6.1, 6.3, 6.4_

- [ ] 9.1 Integrate with LSP client
  - Connect to workspaceSymbol()
  - Implement navigation
  - Add fuzzy matching
  - _Requirements: 6.1, 6.2, 6.4, 6.5_

- [ ]* 9.2 Write property test for symbol search
  - **Property 17: Symbol search requests match queries**
  - **Validates: Requirements 6.2**

- [ ]* 9.3 Write property test for symbol display
  - **Property 18: Symbol results display with metadata**
  - **Validates: Requirements 6.3**

- [ ]* 9.4 Write property test for symbol navigation
  - **Property 19: Symbol selection navigates to location**
  - **Validates: Requirements 6.4**

- [ ]* 9.5 Write property test for fuzzy matching
  - **Property 20: Fuzzy matching updates search results**
  - **Validates: Requirements 6.5**

## Phase 10: Outline View Integration

- [x] 10. Outline view UI (COMPLETE)
  - OutlineView component implemented
  - _Requirements: 10.1, 10.2, 10.5_

- [ ] 10.1 Integrate with LSP client
  - Request documentSymbol on file open
  - Update on content changes (debounced 500ms)
  - Implement navigation
  - _Requirements: 10.1, 10.3, 10.4_

- [ ]* 10.2 Write property test for document symbols
  - **Property 29: File open requests document symbols**
  - **Validates: Requirements 10.1**

- [ ]* 10.3 Write property test for hierarchical display
  - **Property 30: Document symbols display hierarchically**
  - **Validates: Requirements 10.2**

- [ ]* 10.4 Write property test for symbol icons
  - **Property 33: Symbol types show correct icons**
  - **Validates: Requirements 10.5**

- [ ]* 10.5 Write property test for outline navigation
  - **Property 31: Outline item click navigates to symbol**
  - **Validates: Requirements 10.3**

- [ ]* 10.6 Write property test for outline updates
  - **Property 32: Content changes update outline**
  - **Validates: Requirements 10.4**

## Phase 11: Configuration and Settings

- [ ] 11. Implement LSP settings UI
  - Server path configuration
  - Enable/disable per language
  - Logging level configuration
  - _Requirements: 9.1, 9.2, 9.4_

- [ ] 11.1 Implement settings persistence
  - Save to Symphony settings
  - Load on startup
  - Apply without restart
  - _Requirements: 9.2_

- [ ]* 11.2 Write property test for settings updates
  - **Property 27: Settings changes apply without restart**
  - **Validates: Requirements 9.2**

- [ ] 11.2 Add settings validation
  - Validate server paths
  - Check executables
  - Clear error messages
  - _Requirements: 9.5_

## Phase 12: Multi-Language Support

- [ ] 12. Configure TypeScript/JavaScript
  - Use existing typescript-lsp or install typescript-language-server
  - Test with TypeScript/JavaScript projects
  - _Requirements: 1.3, 7.1_

- [ ] 12.1 Configure Python
  - Install pyright or python-lsp-server
  - Configure for Python files
  - Test with Python projects
  - _Requirements: 1.3, 7.1_

- [ ] 12.2 Configure Rust
  - Install rust-analyzer
  - Configure for Rust files
  - Test with Rust projects
  - _Requirements: 1.3, 7.1_

- [ ] 12.3 Configure Go
  - Install gopls
  - Configure for Go files
  - Test with Go projects
  - _Requirements: 1.3, 7.1_

- [ ] 12.4 Document setup
  - Installation guide per language
  - Configuration options
  - Troubleshooting guide
  - _Requirements: 1.3, 7.1_

## Phase 13: Error Handling

- [ ] 13. Implement error handling
  - Connection errors
  - Initialization failures
  - Request timeouts
  - User notifications
  - _Requirements: 7.4_

- [ ] 13.1 Add error recovery
  - Automatic reconnection
  - Retry logic
  - Error state UI
  - Fallback to basic Monaco
  - _Requirements: 7.2, 7.4_

- [ ]* 13.2 Write error handling tests
  - Test server crashes
  - Test IPC failures
  - Test initialization failures
  - _Requirements: 7.2, 7.4_

## Phase 14: Final Testing

- [ ] 14. End-to-end testing
  - Test complete workflows
  - Test all LSP features
  - Test with real projects
  - Verify all requirements
  - _Requirements: All_

- [ ] 14.1 Performance testing
  - Test large files (10,000+ lines)
  - Measure latencies
  - Verify memory usage
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 14.2 Documentation
  - Update component docs
  - Add usage examples
  - Document configuration
  - _Requirements: All_

- [ ] 14.3 Final checkpoint
  - Ensure all tests pass
  - Ask user if questions arise
