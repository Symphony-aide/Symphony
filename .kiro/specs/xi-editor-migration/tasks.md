# Implementation Plan - Xi-Editor Integration

This implementation plan breaks down the xi-editor integration into discrete, actionable coding tasks. Each task builds incrementally on previous work, with checkpoints to ensure tests pass before proceeding.

## Current Implementation Status

**Last Updated:** December 3, 2024

**Status:** ✅ Phase 1 Foundation Complete - Ready for Phase 2

**Current State:**
- ✅ Xi-editor submodule exists at `apps/xi-editor/` with complete source code
- ✅ Scaffold rope crate exists at `apps/backend/rope/` but is **NOT used anywhere** in the codebase
- ✅ `xi_integration` crate created at `apps/backend/xi_integration/`
- ✅ Cargo.toml configured with xi-editor dependencies (xi-rope, xi-core-lib, xi-rpc, xi-trace)
- ✅ Complete module structure created (lib.rs, error.rs, types.rs)
- ✅ Core types implemented (ViewId, EditOperation, BufferMetadata, XiConfig, LineEnding)
- ✅ IPC message types defined (SymphonyIpcRequest, SymphonyIpcResponse, SymphonyUpdateOp)
- ✅ Error types implemented with thiserror
- ✅ Basic XiIntegration struct with file operations (open, close, edit, get_content)
- ✅ Unit tests for basic functionality

**Completed Tasks:**
- **Task 1**: Xi-editor dependencies and workspace structure ✅
- **Task 2.1**: Core data models and type definitions ✅
- **Task 2.2**: IPC message protocol types ✅
- **Task 2.3**: Configuration types ✅
- **Task 3.1**: XiIntegration struct and initialization ✅
- **Task 3.2**: File operations (open, close) ✅
- **Task 3.3**: Basic edit operations ✅
- **Task 3.4**: Content retrieval ✅

**What's Working:**
- Can create XiIntegration instance
- Can open files (existing or new)
- Can perform edit operations (insert, delete, replace)
- Can retrieve buffer content
- Can close views
- Can get buffer metadata (path, dirty state, size)
- Basic error handling with custom error types

**What's Missing:**
- IPC Bridge for message translation (Task 5)
- Buffer Manager for lifecycle management (Task 6)
- Monaco Bridge for frontend synchronization (Task 8)
- Undo/redo integration (Task 11)
- Search and replace (Task 12)
- File save operations (Task 15)
- All property-based tests
- Integration with Symphony's IPC Bus

**Next Steps:**
Continue with Task 5 to implement the IPC Bridge for message translation between Symphony IPC and Xi-RPC.

## Phase 1: Foundation and Core Integration

- [x] 1. Set up xi-editor dependencies and workspace structure ✅ **COMPLETED**
  - ✅ Xi-editor submodule already exists at `apps/xi-editor/`
  - ✅ Created new Rust crate `apps/backend/xi_integration/`
  - ✅ Added xi-editor crates as path dependencies in `xi_integration/Cargo.toml`:
    - `xi-rope` with serde feature
    - `xi-core-lib`
    - `xi-rpc`
    - `xi-trace`
  - ✅ Configured workspace dependencies (serde, tokio, anyhow, tracing, etc.)
  - ✅ Added additional dependencies (thiserror, crossbeam-channel)
  - ✅ Set up basic module structure (lib.rs, error.rs, types.rs)
  - ✅ Configured dev dependencies (tokio-test, tempfile)
  - _Requirements: 1.1, 17.1, 17.3_
  - _Note: Scaffold rope crate exists at `apps/backend/rope/` but is NOT currently used anywhere in the codebase_

- [x] 2. Implement core data models and type definitions ✅ **COMPLETED**
  - [x] 2.1 Define ViewId, EditOperation, and BufferMetadata types ✅
    - ✅ Created type definitions in `types.rs`
    - ✅ Implemented serialization/deserialization with serde
    - ✅ Added comprehensive documentation
    - _Requirements: 2.3, 3.1_
  
  - [x] 2.2 Define IPC message protocol types ✅
    - ✅ Created SymphonyIpcRequest enum with message variants (OpenFile, CloseView, Edit, GetContent, Save, Undo, Redo, Search)
    - ✅ Created SymphonyIpcResponse enum with response variants (ViewOpened, ViewClosed, EditApplied, Content, Saved, etc.)
    - ✅ Created SymphonyUpdateOp enum for incremental updates (Keep, Delete, Insert, Update)
    - ✅ Created SymphonyIpcMessage enum for buffer updates
    - ✅ Implemented message serialization/deserialization
    - _Requirements: 2.4, 2.5, 3.1, 3.2, 3.3_
  
  - [x] 2.3 Define configuration types ✅
    - ✅ Created XiConfig struct with configuration options (tab_size, translate_tabs_to_spaces, word_wrap, auto_indent, etc.)
    - ✅ Implemented Default trait with sensible defaults
    - ✅ Added LineEnding enum (Lf, CrLf, Cr)
    - _Requirements: 14.1, 14.2_

- [x] 3. Implement XiIntegration core module ✅ **COMPLETED**
  - [x] 3.1 Create XiIntegration struct and initialization ✅
    - ✅ Implemented XiIntegration::new() with configuration
    - ✅ Set up internal state management (views HashMap)
    - ✅ Added view ID generation
    - ✅ Added error handling for initialization
    - _Requirements: 2.1, 2.2_
  
  - [x] 3.2 Implement file operations (open, close) ✅
    - ✅ Implemented open_file() with async file loading
    - ✅ Implemented close_view() with proper cleanup
    - ✅ Added file path validation and error handling
    - ✅ Handle non-existent files (create empty buffer)
    - _Requirements: 2.3, 9.1, 11.4_
  
  - [x] 3.3 Implement basic edit operations ✅
    - ✅ Implemented edit() method for insert/delete/replace
    - ✅ Translate EditOperation to xi-rope operations
    - ✅ Apply edits to rope buffers
    - ✅ Mark buffers as dirty after edits
    - _Requirements: 2.4, 3.1, 3.2_
  
  - [x] 3.4 Implement content retrieval ✅
    - ✅ Implemented get_content() to extract rope as string
    - ✅ Added get_metadata() for buffer information
    - ✅ Efficient conversion from rope to string
    - _Requirements: 3.4_

- [x] 4. Checkpoint - Core integration tests





  - [x] 4.1 Run existing unit tests


    - Run `cargo test --package xi-integration` to execute all tests
    - Verify all tests in `lib.rs` pass:
      - `test_create_integration` - XiIntegration initialization
      - `test_open_nonexistent_file` - Opening non-existent files
      - `test_edit_operations` - Basic edit operations and dirty state
    - Verify all tests in `types.rs` pass:
      - `test_view_id_equality` - ViewId comparison
      - `test_edit_operation_serialization` - Serde serialization
      - `test_config_default` - Default configuration
      - `test_line_ending_types` - LineEnding enum
    - Verify all tests in `error.rs` pass:
      - `test_error_display` - Error message formatting
      - `test_config_error` - Configuration error creation
      - `test_protocol_error` - Protocol error creation
      - `test_buffer_corruption_error` - Buffer corruption error
    - _Requirements: 16.1_
  
  - [x] 4.2 Verify test coverage


    - Check that basic functionality is covered by tests
    - Ensure error paths are tested
    - Confirm serialization/deserialization works
    - _Requirements: 16.1_
  
  - [x] 4.3 Document any test failures


    - If any tests fail, document the failure
    - Ask user for guidance on how to proceed
    - Fix any issues before moving to Phase 2
    - _Requirements: 16.1_

**Test Summary for Task 4:**

**Total Tests**: 11 unit tests across 3 modules

**Test Breakdown:**

1. **lib.rs** (3 async tests):
   - `test_create_integration` - Verifies XiIntegration can be created with default config
   - `test_open_nonexistent_file` - Tests opening non-existent file creates empty buffer
   - `test_edit_operations` - Tests insert operation and dirty state tracking

2. **types.rs** (4 tests):
   - `test_view_id_equality` - Tests ViewId equality and inequality
   - `test_edit_operation_serialization` - Tests serde JSON serialization/deserialization
   - `test_config_default` - Tests XiConfig default values
   - `test_line_ending_types` - Tests LineEnding enum equality

3. **error.rs** (4 tests):
   - `test_error_display` - Tests error message formatting
   - `test_config_error` - Tests configuration error creation
   - `test_protocol_error` - Tests protocol error creation
   - `test_buffer_corruption_error` - Tests buffer corruption error creation

**How to Run:**
```bash
cd apps/backend
cargo test --package xi-integration
```

**Expected Output:**
```
running 11 tests
test error::tests::test_buffer_corruption_error ... ok
test error::tests::test_config_error ... ok
test error::tests::test_error_display ... ok
test error::tests::test_protocol_error ... ok
test tests::test_create_integration ... ok
test tests::test_edit_operations ... ok
test tests::test_open_nonexistent_file ... ok
test types::tests::test_config_default ... ok
test types::tests::test_edit_operation_serialization ... ok
test types::tests::test_line_ending_types ... ok
test types::tests::test_view_id_equality ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

**What's Being Validated:**
- ✅ Core functionality works (initialization, file ops, edits)
- ✅ Type system is correct (serialization, equality)
- ✅ Error handling is comprehensive
- ✅ Default configurations are sensible
- ✅ No compilation errors
- ✅ No runtime panics

## Phase 2: IPC Translation Layer

- [ ] 5. Implement IPC Bridge for message translation
  - [ ] 5.1 Create IpcBridge struct and initialization
    - Set up IpcBridge with reference to XiIntegration
    - Initialize message routing infrastructure
    - Configure bidirectional translation
    - _Requirements: 2.5, 3.1_
  
  - [ ] 5.2 Implement Symphony → Xi-RPC translation
    - Implement translate_edit() for edit operations
    - Implement translate_search() for search queries
    - Implement translate_save() for save operations
    - Handle all SymphonyIpcRequest message types
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [ ] 5.3 Implement Xi-RPC → Symphony translation
    - Implement translate_update() for buffer updates
    - Implement translate_style_update() for syntax highlighting
    - Implement translate_search_results() for search responses
    - Handle all xi-core notification types
    - _Requirements: 3.3, 5.2, 6.2_
  
  - [ ]* 5.4 Write property test for IPC translation
    - **Property 2: Edit operation round-trip consistency**
    - **Validates: Requirements 3.1, 3.2, 3.4**
    - Generate random edit operations
    - Translate Symphony → Xi-RPC → apply → query
    - Verify buffer reflects exact change

- [ ] 6. Implement Buffer Manager
  - [ ] 6.1 Create BufferManager struct
    - Set up path-to-view and view-to-metadata mappings
    - Initialize with reference to XiIntegration
    - Add buffer lifecycle tracking
    - _Requirements: 2.6_
  
  - [ ] 6.2 Implement buffer lifecycle management
    - Implement open_buffer() with deduplication
    - Implement close_buffer() with cleanup
    - Track buffer metadata (path, dirty state, timestamps)
    - Handle buffer reuse for already-open files
    - _Requirements: 2.3, 2.6_
  
  - [ ]* 6.3 Write unit tests for buffer management
    - Test buffer open/close lifecycle
    - Test multiple buffers simultaneously
    - Test buffer reuse logic
    - Test cleanup and memory management
    - _Requirements: 2.6_

- [ ] 7. Checkpoint - IPC translation tests
  - Ensure all tests pass, ask the user if questions arise.
- ✅ **Tests**: Make sure everything works correctly

**After Phase 2, you'll have:**
- A working bridge between Symphony IPC and Xi-Core
- Smart file management that prevents duplicate opens
- All the infrastructure needed for Phase 3 (Frontend Integration)

## Phase 3: Frontend Integration

- [ ] 8. Implement Monaco Bridge
  - [ ] 8.1 Create MonacoBridge struct
    - Set up cursor and selection state tracking
    - Initialize style span conversion logic
    - _Requirements: 3.5, 3.6_
  
  - [ ] 8.2 Implement cursor and selection synchronization
    - Implement sync_cursor() for cursor position updates
    - Implement sync_selection() for selection updates
    - Handle multi-cursor state synchronization
    - _Requirements: 3.5, 8.1_
  
  - [ ] 8.3 Implement style span conversion
    - Implement convert_style_spans() for Monaco decorations
    - Map xi-core style IDs to Monaco CSS classes
    - Handle style span updates efficiently
    - _Requirements: 5.2, 5.3_
  
  - [ ]* 8.4 Write property test for style span coverage
    - **Property 10: Style span coverage**
    - **Validates: Requirements 5.2, 5.3**
    - Generate random buffer content
    - Apply syntax highlighting
    - Verify all text is covered by style spans

- [ ] 9. Update Monaco Editor component
  - [ ] 9.1 Modify EditorPanel to use xi-core backend
    - Update EditorPanel to send edits via IPC Bridge
    - Receive and apply incremental updates from xi-core
    - Handle buffer opened/closed events
    - _Requirements: 3.4, 6.1_
  
  - [ ] 9.2 Integrate syntax highlighting updates
    - Receive style spans from xi-core
    - Apply Monaco decorations for syntax highlighting
    - Handle incremental style updates
    - _Requirements: 5.2, 5.3, 5.4_
  
  - [ ] 9.3 Wire command integration
    - Connect undo/redo commands to xi-core
    - Connect search/replace commands to xi-core
    - Handle command responses and errors
    - _Requirements: 7.2, 7.3, 10.1_

- [ ] 10. Checkpoint - Frontend integration tests
  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: Advanced Features

- [ ] 11. Implement undo/redo system integration
  - [ ] 11.1 Wire undo/redo operations
    - Implement undo() method calling xi-core
    - Implement redo() method calling xi-core
    - Handle undo/redo responses and state updates
    - _Requirements: 7.2, 7.3_
  
  - [ ] 11.2 Implement undo history management
    - Configure undo history limits (1000 operations)
    - Implement history pruning for memory management
    - Track dirty state based on undo position
    - _Requirements: 7.5, 7.6_
  
  - [ ]* 11.3 Write property test for undo/redo
    - **Property 4: Undo-redo inverse relationship**
    - **Validates: Requirements 7.2, 7.3**
    - Generate random edit sequences
    - Apply edits, undo, then redo
    - Verify buffer returns to exact state

- [ ] 12. Implement search and replace functionality
  - [ ] 12.1 Implement search operations
    - Implement search() with regex support
    - Handle case-sensitive and whole-word options
    - Return search results incrementally
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  
  - [ ] 12.2 Implement replace operations
    - Implement replace() for single match
    - Implement replace_all() for all matches
    - Make replace-all a single undoable operation
    - _Requirements: 10.5, 10.6_
  
  - [ ]* 12.3 Write property test for search accuracy
    - **Property 7: Search result accuracy**
    - **Validates: Requirements 10.1, 10.2, 10.3**
    - Generate random text and search patterns
    - Verify all matches are found
    - Verify no false positives
  
  - [ ]* 12.4 Write property test for replace-all atomicity
    - **Property 15: Replace-all atomicity**
    - **Validates: Requirements 10.6**
    - Generate random text with multiple matches
    - Execute replace-all
    - Verify single undo restores original

- [ ] 13. Implement multi-cursor support
  - [ ] 13.1 Wire multi-cursor operations
    - Handle multiple cursor positions from Monaco
    - Apply edits at all cursor positions
    - Synchronize cursor positions after edits
    - _Requirements: 8.1, 8.2, 8.5_
  
  - [ ] 13.2 Implement selection merging
    - Detect and merge overlapping selections
    - Handle cursor position adjustments after edits
    - _Requirements: 8.4, 8.5_
  
  - [ ]* 13.3 Write property test for multi-cursor consistency
    - **Property 5: Multi-cursor consistency**
    - **Validates: Requirements 8.1, 8.2, 8.5**
    - Generate random cursor positions
    - Apply same text at all positions
    - Verify text appears at each position

- [ ] 14. Checkpoint - Advanced features tests
  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: File I/O and Persistence

- [ ] 15. Implement file save operations
  - [ ] 15.1 Implement save functionality
    - Implement save() using xi-core's async file I/O
    - Implement save_as() for save to different path
    - Handle save errors with retry logic
    - Update dirty state after successful save
    - _Requirements: 9.2, 9.4, 7.6_
  
  - [ ] 15.2 Implement line ending and encoding handling
    - Detect line ending style on file open
    - Preserve line ending style on save
    - Handle encoding detection and conversion
    - _Requirements: 11.1, 11.2, 11.4_
  
  - [ ]* 15.3 Write property test for file I/O round-trip
    - **Property 6: File I/O round-trip preservation**
    - **Validates: Requirements 9.1, 9.2, 11.2**
    - Generate random file content
    - Load, save without modifications
    - Verify byte-identical output
  
  - [ ]* 15.4 Write property test for line ending preservation
    - **Property 8: Line ending preservation**
    - **Validates: Requirements 11.1, 11.2**
    - Generate files with different line endings
    - Load and save without conversion
    - Verify line endings preserved
  
  - [ ]* 15.5 Write property test for encoding preservation
    - **Property 16: Encoding round-trip preservation**
    - **Validates: Requirements 11.4, 11.6**
    - Generate files with different encodings
    - Load and save without modifications
    - Verify byte-identical including BOM

- [ ] 16. Implement Autosave Manager
  - [ ] 16.1 Create AutosaveManager struct
    - Set up autosave interval timer (30 seconds)
    - Initialize autosave directory
    - Track autosave state per buffer
    - _Requirements: 9.3_
  
  - [ ] 16.2 Implement autosave functionality
    - Implement run() loop for periodic saves
    - Implement perform_autosave() for dirty buffers
    - Generate autosave file paths
    - Handle autosave errors gracefully
    - _Requirements: 9.3_
  
  - [ ] 16.3 Implement autosave recovery
    - Implement check_recovery() to find autosave files
    - Prompt user for recovery on file open
    - Clean up autosave files after successful save
    - _Requirements: 15.6_
  
  - [ ]* 16.4 Write property test for autosave interval
    - **Property 12: Autosave interval consistency**
    - **Validates: Requirements 9.3**
    - Make buffer dirty
    - Wait for autosave interval
    - Verify file saved within 30-35 seconds

- [ ] 17. Implement external file change detection
  - [ ] 17.1 Set up file watching
    - Use xi-core's existing file watching with notify crate
    - Detect external file modifications
    - Notify user of external changes
    - _Requirements: 9.5_
  
  - [ ]* 17.2 Write property test for change detection
    - **Property 13: External file change detection**
    - **Validates: Requirements 9.5**
    - Open file in xi-core
    - Modify file externally
    - Verify notification within 1 second

- [ ] 18. Checkpoint - File I/O tests
  - Ensure all tests pass, ask the user if questions arise.

## Phase 6: Configuration and Customization

- [ ] 19. Implement Configuration Manager
  - [ ] 19.1 Create ConfigurationManager struct
    - Set up configuration state
    - Initialize settings watcher
    - Track active views for config updates
    - _Requirements: 14.1_
  
  - [ ] 19.2 Implement settings translation
    - Implement translate_settings() Symphony → Xi-Core
    - Map all configuration options (tab size, word wrap, etc.)
    - Handle configuration validation
    - _Requirements: 14.2, 14.3, 14.4, 14.5_
  
  - [ ] 19.3 Implement dynamic configuration updates
    - Implement apply_config_changes() to all views
    - Implement watch_settings() for live updates
    - Apply changes without restart
    - _Requirements: 14.6_
  
  - [ ]* 19.4 Write property test for configuration changes
    - **Property 11: Configuration changes apply without restart**
    - **Validates: Requirements 14.2, 14.3, 14.4, 14.6**
    - Open multiple buffers
    - Change configuration (tab size, word wrap)
    - Verify all buffers reflect changes immediately

- [ ] 20. Checkpoint - Configuration tests
  - Ensure all tests pass, ask the user if questions arise.

## Phase 7: Plugin System Integration

- [ ] 21. Implement Plugin Adapter
  - [ ] 21.1 Create PluginAdapter struct
    - Set up plugin registry and instance tracking
    - Initialize extension bus integration
    - Configure plugin IPC routing
    - _Requirements: 4.1, 4.2_
  
  - [ ] 21.2 Implement plugin loading
    - Implement load_plugin() using xi-core's plugin loader
    - Register plugins with Symphony extension system
    - Set up IPC routing for plugin messages
    - _Requirements: 4.2, 4.3_
  
  - [ ] 21.3 Implement plugin notification routing
    - Implement route_notification() to Symphony IPC Bus
    - Translate xi-plugin notifications to Symphony events
    - Handle plugin requests for edit operations
    - _Requirements: 4.3, 4.4_
  
  - [ ] 21.4 Implement plugin crash handling
    - Implement handle_plugin_crash() with isolation
    - Log crash details and disable plugin
    - Ensure xi-core continues operating
    - Notify user of plugin failure
    - _Requirements: 4.6, 15.3_
  
  - [ ]* 21.5 Write property test for plugin crash isolation
    - **Property 17: Plugin crash isolation**
    - **Validates: Requirements 4.6, 15.3**
    - Load plugin and simulate crash
    - Verify xi-core continues operating
    - Verify no data loss in buffers

- [ ] 22. Checkpoint - Plugin system tests
  - Ensure all tests pass, ask the user if questions arise.

## Phase 8: Performance and Metrics

- [ ] 23. Implement Performance Metrics Collector
  - [ ] 23.1 Create MetricsCollector struct
    - Set up xi-trace integration
    - Initialize Symphony metrics reporter
    - Create operation timing histograms
    - Set up memory usage tracker
    - _Requirements: 12.1, 12.2_
  
  - [ ] 23.2 Implement operation timing
    - Implement record_edit_operation() with timing
    - Track latency percentiles (p50, p95, p99)
    - Log performance warnings for slow operations
    - _Requirements: 12.1, 12.3_
  
  - [ ] 23.3 Implement memory monitoring
    - Implement monitor_memory() with threshold checking
    - Trigger undo history pruning when needed
    - Track memory usage over time
    - _Requirements: 12.4_
  
  - [ ] 23.4 Implement statistics reporting
    - Implement get_statistics() for performance data
    - Expose metrics to Symphony orchestration system
    - _Requirements: 12.2_

- [ ] 24. Implement incremental update optimization
  - [ ] 24.1 Optimize update generation
    - Use xi-core's incremental computation
    - Generate delta updates instead of full content
    - Batch rapid updates to reduce IPC overhead
    - _Requirements: 6.1, 6.2, 6.4_
  
  - [ ] 24.2 Optimize syntax highlighting updates
    - Compute highlighting only for visible regions
    - Send only changed style spans
    - _Requirements: 5.3, 6.3_
  
  - [ ]* 24.3 Write property test for incremental updates
    - **Property 3: Incremental updates are complete**
    - **Validates: Requirements 6.1, 6.2, 6.5**
    - Generate random edit sequence
    - Apply incremental updates
    - Verify final state matches direct application

- [ ] 25. Write performance benchmarks
  - [ ] 25.1 Create file loading benchmarks
    - Benchmark 1MB, 10MB, 50MB, 100MB files
    - Verify <100ms for 10MB files
    - _Requirements: 1.2, 12.6_
  
  - [ ] 25.2 Create edit latency benchmarks
    - Benchmark single-character edits
    - Verify p95 latency <16ms
    - _Requirements: 6.6, 12.6_
  
  - [ ] 25.3 Create throughput benchmarks
    - Benchmark rapid edit sequences
    - Verify >10,000 edits/second
    - _Requirements: 12.6_
  
  - [ ] 25.4 Create memory usage benchmarks
    - Benchmark memory usage for various file sizes
    - Verify <2x file size
    - _Requirements: 1.6_
  
  - [ ]* 25.5 Write property test for memory bounds
    - **Property 14: Memory usage bounds**
    - **Validates: Requirements 1.6, 12.4**
    - Generate random text of size N
    - Create rope and track memory
    - Verify memory ≤ 2N + constant

- [ ] 26. Checkpoint - Performance tests
  - Ensure all tests pass, ask the user if questions arise.

## Phase 9: Collaborative Editing Foundation

- [ ] 27. Implement Collaborative Foundation
  - [ ] 27.1 Create CollaborativeFoundation struct
    - Set up operation ID generator
    - Initialize operation log
    - Configure operational transformation engine
    - _Requirements: 13.1_
  
  - [ ] 27.2 Implement operation tracking
    - Implement generate_operation_id() with unique IDs
    - Implement log_operation() for edit history
    - Track operation metadata (timestamp, view, etc.)
    - _Requirements: 13.1, 13.4_
  
  - [ ] 27.3 Implement operational transformation
    - Implement transform_operations() for concurrent edits
    - Implement merge_remote_operation() for remote edits
    - Ensure deterministic conflict resolution
    - _Requirements: 13.2, 13.3, 13.6_
  
  - [ ] 27.4 Implement operation history
    - Implement get_operation_history() for synchronization
    - Support querying history from specific operation ID
    - _Requirements: 13.4_
  
  - [ ]* 27.5 Write property test for concurrent edit safety
    - **Property 9: Concurrent edit safety**
    - **Validates: Requirements 13.2, 13.3, 13.6**
    - Generate two random edits on different regions
    - Apply in both orders
    - Verify same final state
  
  - [ ]* 27.6 Write property test for operation ID uniqueness
    - **Property 18: Operation ID uniqueness**
    - **Validates: Requirements 13.1, 13.4**
    - Generate many operations across buffers
    - Verify all operation IDs are unique

- [ ] 28. Checkpoint - Collaborative foundation tests
  - Ensure all tests pass, ask the user if questions arise.

## Phase 10: Error Handling and Recovery

- [ ] 29. Implement comprehensive error handling
  - [ ] 29.1 Define error types
    - Create FileSystemError enum
    - Create BufferError enum
    - Create ProtocolError enum
    - Implement error conversion and display
    - _Requirements: 15.1, 15.5_
  
  - [ ] 29.2 Implement error recovery mechanisms
    - Implement retry logic with exponential backoff
    - Implement state resynchronization
    - Handle invalid operations gracefully
    - _Requirements: 9.4, 15.1, 15.2_
  
  - [ ] 29.3 Implement buffer corruption recovery
    - Detect buffer corruption
    - Attempt recovery from last known good state
    - Fall back to autosave if needed
    - _Requirements: 15.2_

- [ ] 30. Implement Crash Recovery Manager
  - [ ] 30.1 Create CrashRecoveryManager struct
    - Set up health check monitoring
    - Initialize autosave integration
    - Track last known good state
    - _Requirements: 15.6_
  
  - [ ] 30.2 Implement health monitoring
    - Implement monitor_health() with periodic checks
    - Detect unresponsive xi-core
    - Log crash details
    - _Requirements: 15.6_
  
  - [ ] 30.3 Implement crash recovery
    - Implement handle_crash() with restart logic
    - Implement restart_xi_core() to create new instance
    - Implement restore_buffers() from autosave
    - _Requirements: 15.6_
  
  - [ ]* 30.4 Write integration test for crash recovery
    - Simulate xi-core crash
    - Verify automatic restart
    - Verify buffer restoration from autosave
    - _Requirements: 15.6_

- [ ] 31. Checkpoint - Error handling tests
  - Ensure all tests pass, ask the user if questions arise.

## Phase 11: Migration and Cleanup

- [ ] 32. Migrate from scaffold implementation
  - [ ] 32.1 Audit scaffold usage
    - Search for all imports of `apps/backend/rope/`
    - Document all dependent modules
    - Create migration checklist
    - _Requirements: 17.2, 17.4_
  
  - [ ] 32.2 Create compatibility layer
    - Create temporary type aliases in `xi_integration/src/compat.rs`
    - Implement adapter functions for API differences
    - Mark all compatibility code with deprecation warnings
    - _Requirements: 17.4_
  
  - [ ] 32.3 Update imports incrementally
    - Update leaf modules first (no dependencies)
    - Progress to core modules
    - Update tests alongside implementation
    - Verify functionality at each step
    - _Requirements: 17.4_
  
  - [ ] 32.4 Remove scaffold code
    - Delete `apps/backend/rope/` directory
    - Remove compatibility layer
    - Update Cargo.toml to remove scaffold dependencies
    - Verify no remaining references
    - _Requirements: 1.7, 17.2, 17.5_

- [ ] 33. Checkpoint - Migration complete
  - Ensure all tests pass, ask the user if questions arise.

## Phase 12: Documentation and Polish

- [ ] 34. Write comprehensive documentation
  - [ ] 34.1 Write architecture documentation
    - Create ARCHITECTURE.md with system overview
    - Document component interactions
    - Include data flow diagrams
    - Explain design decisions
    - _Requirements: 18.1_
  
  - [ ] 34.2 Write API documentation
    - Create API.md with public interface reference
    - Document all public methods with examples
    - Include error handling patterns
    - Add configuration options reference
    - _Requirements: 18.2_
  
  - [ ] 34.3 Write integration guide
    - Create INTEGRATION_GUIDE.md with step-by-step instructions
    - Include common integration patterns
    - Document troubleshooting steps
    - _Requirements: 18.4_
  
  - [ ] 34.4 Write debugging guide
    - Create DEBUGGING.md with diagnostic tools
    - Document logging configuration
    - Include common error scenarios
    - Add profiling instructions
    - _Requirements: 18.3_
  
  - [ ] 34.5 Write performance tuning guide
    - Create PERFORMANCE.md with optimization techniques
    - Document performance characteristics
    - Include benchmark results
    - Add configuration tuning guide
    - _Requirements: 18.6_
  
  - [ ] 34.6 Create example programs
    - Write basic_editing.rs example
    - Write multi_buffer.rs example
    - Write search_replace.rs example
    - Write undo_redo.rs example
    - Write syntax_highlighting.rs example
    - _Requirements: 18.4_
  
  - [ ] 34.7 Write changelog
    - Create CHANGELOG.md with version history
    - Document breaking changes with migration guides
    - List new features and improvements
    - _Requirements: 18.5_

- [ ] 35. Add comprehensive Rust doc comments
  - [ ] 35.1 Document public API
    - Add /// doc comments to all public functions
    - Include examples in doc comments
    - Document error conditions
    - Add performance notes
    - _Requirements: 18.2_
  
  - [ ] 35.2 Document modules
    - Add //! module-level documentation
    - Explain module purpose and architecture
    - Include usage examples
    - _Requirements: 18.1_

- [ ] 36. Final checkpoint - All tests passing
  - Run complete test suite (unit, property, integration, benchmarks)
  - Verify all 18 correctness properties pass
  - Verify all performance benchmarks meet thresholds
  - Verify documentation builds without errors
  - Ensure all tests pass, ask the user if questions arise.

## Summary

This implementation plan consists of 36 top-level tasks organized into 12 phases:

1. **Foundation** (Tasks 1-4): Set up dependencies, data models, and core integration
2. **IPC Translation** (Tasks 5-7): Implement bidirectional protocol translation
3. **Frontend Integration** (Tasks 8-10): Connect Monaco Editor to xi-core
4. **Advanced Features** (Tasks 11-14): Undo/redo, search/replace, multi-cursor
5. **File I/O** (Tasks 15-18): Save operations, autosave, file watching
6. **Configuration** (Tasks 19-20): Dynamic configuration management
7. **Plugin System** (Tasks 21-22): Plugin adapter and crash isolation
8. **Performance** (Tasks 23-26): Metrics collection and optimization
9. **Collaborative Foundation** (Tasks 27-28): Operation tracking and transformation
10. **Error Handling** (Tasks 29-31): Comprehensive error recovery
11. **Migration** (Tasks 32-33): Remove scaffold implementations
12. **Documentation** (Tasks 34-36): Complete documentation and polish

**Total Tasks**: 36 main tasks with 89 sub-tasks
**Property-Based Tests**: 18 tests (one per correctness property)
**Optional Tasks**: 27 sub-tasks marked with "*" (primarily tests and documentation)
**Estimated Timeline**: 8 weeks with 1-2 developers

### Implementation Status

**Completed**: 3 tasks (8.3%)
- Task 1: Xi-editor dependencies and workspace structure ✅
- Task 2: Core data models and type definitions ✅
- Task 3: XiIntegration core module ✅

**In Progress**: 0 tasks
**Not Started**: 33 tasks (91.7%)

### Key Milestones

- **Milestone 1** (Tasks 1-4): Core integration functional - can open files and perform basic edits
- **Milestone 2** (Tasks 5-10): Frontend integration complete - Monaco Editor connected to xi-core
- **Milestone 3** (Tasks 11-18): Full editing features - undo/redo, search/replace, file I/O
- **Milestone 4** (Tasks 19-26): Production-ready - configuration, plugins, performance optimization
- **Milestone 5** (Tasks 27-31): Advanced features - collaborative foundation, error recovery
- **Milestone 6** (Tasks 32-36): Complete - migration finished, fully documented

### Critical Path

The following tasks are on the critical path and must be completed in order:
1. Task 1: Workspace setup (enables all other work)
2. Tasks 2-3: Core data models and XiIntegration (foundation for everything)
3. Task 5: IPC Bridge (enables frontend communication)
4. Task 8: Monaco Bridge (enables UI integration)
5. Task 32: Migration from scaffold (removes technical debt)

### Testing Strategy

- **Unit Tests**: Co-located with implementation, run on every commit
- **Property Tests**: 18 tests validating correctness properties, 100 iterations each
- **Integration Tests**: End-to-end workflows, run on every pull request
- **Benchmarks**: Performance validation against requirements (10MB < 100ms, p95 < 16ms, etc.)

Each task is designed to be independently testable and builds incrementally on previous work. Checkpoints ensure tests pass before proceeding to the next phase.

### Notes for Implementation

1. **Xi-editor is already available**: The submodule at `apps/xi-editor/` contains all xi-editor source code
2. **No scaffold migration needed**: The `apps/backend/rope/` crate is not used anywhere, so no code migration is required
3. **Direct integration approach**: We use xi-editor crates as dependencies, not by copying code
4. **Incremental development**: Each phase builds on the previous, with working software at each checkpoint
5. **Property-based testing**: All 18 correctness properties must be validated with property tests
6. **Optional tasks**: Tasks marked with "*" are optional and can be skipped for faster MVP delivery
