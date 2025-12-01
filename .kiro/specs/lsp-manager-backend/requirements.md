# Requirements Document - LSP Manager Backend

## Introduction

This document specifies the requirements for implementing a backend Language Server Protocol (LSP) manager extension in Symphony IDE. The LSP manager is a Rust-based extension that manages the lifecycle of external language server processes, handles communication via stdio, and provides automatic health monitoring and restart capabilities. This backend component serves as the bridge between Symphony's IPC system and external LSP servers.

## Glossary

- **LSP (Language Server Protocol)**: A protocol for communication between code editors and language servers that provide language-specific features
- **Language Server**: An external process that provides language intelligence features (completion, diagnostics, etc.)
- **LSP Manager**: The backend Rust extension that manages language server processes
- **Process Lifecycle**: The complete lifecycle of a language server from spawn to shutdown
- **Health Monitoring**: Continuous monitoring of server process health and responsiveness
- **Auto-Restart**: Automatic restart of crashed servers with exponential backoff
- **IPC (Inter-Process Communication)**: Symphony's communication system between frontend and backend
- **Stdio Communication**: Communication via standard input/output streams
- **JSON-RPC**: Remote procedure call protocol used by LSP
- **Symphony Extension**: A Rust crate that integrates with Symphony's extension system
- **Server Configuration**: Settings that define how to spawn and communicate with a language server

## Requirements

### Requirement 1: Language Detection

**User Story:** As a backend system, I want to detect programming languages from file extensions, so that I can spawn the appropriate language server.

#### Acceptance Criteria

1. WHEN a file path is provided THEN the LSP Manager SHALL determine the programming language from the file extension
2. WHEN the file extension is .ts or .tsx THEN the LSP Manager SHALL identify the language as TypeScript
3. WHEN the file extension is .js, .jsx, .mjs, or .cjs THEN the LSP Manager SHALL identify the language as JavaScript
4. WHEN the file extension is .py, .pyi, or .pyw THEN the LSP Manager SHALL identify the language as Python
5. WHEN the file extension is .rs THEN the LSP Manager SHALL identify the language as Rust
6. WHEN the file extension is .go THEN the LSP Manager SHALL identify the language as Go
7. WHEN the file extension is not supported THEN the LSP Manager SHALL return None

### Requirement 2: Server Configuration Management

**User Story:** As a system administrator, I want to configure language server paths and settings, so that I can customize the LSP servers for my environment.

#### Acceptance Criteria

1. WHEN the LSP Manager initializes THEN the LSP Manager SHALL load default configurations for all supported languages
2. WHEN a custom server configuration is registered THEN the LSP Manager SHALL use the custom configuration instead of the default
3. WHEN a server configuration includes a command THEN the LSP Manager SHALL validate that the command is not empty
4. WHEN a server configuration includes environment variables THEN the LSP Manager SHALL apply them when spawning the process
5. WHEN a server configuration includes a working directory THEN the LSP Manager SHALL set it as the process working directory
6. WHEN a server is disabled in configuration THEN the LSP Manager SHALL not spawn the server process

### Requirement 3: Language Server Process Management

**User Story:** As a backend system, I want to spawn and manage language server processes, so that I can provide LSP features to the frontend.

#### Acceptance Criteria

1. WHEN a language server is requested THEN the LSP Manager SHALL spawn the server process with stdio pipes
2. WHEN spawning a server process THEN the LSP Manager SHALL capture stdin, stdout, and stderr streams
3. WHEN a server process is spawned THEN the LSP Manager SHALL enable kill-on-drop to ensure cleanup
4. WHEN writing to a server THEN the LSP Manager SHALL format messages with Content-Length headers
5. WHEN reading from a server THEN the LSP Manager SHALL parse Content-Length headers and read the message body
6. WHEN a server process exits THEN the LSP Manager SHALL detect the exit and update server status
7. WHEN shutting down a server THEN the LSP Manager SHALL send shutdown and exit messages before killing the process

### Requirement 4: Health Monitoring and Auto-Restart

**User Story:** As a backend system, I want to monitor server health and automatically restart crashed servers, so that LSP features remain available.

#### Acceptance Criteria

1. WHEN a server sends or receives a message THEN the LSP Manager SHALL record a heartbeat timestamp
2. WHEN checking server health THEN the LSP Manager SHALL compare the last heartbeat against the heartbeat interval
3. WHEN a server crashes THEN the LSP Manager SHALL detect the crash and initiate a restart
4. WHEN restarting a server THEN the LSP Manager SHALL use exponential backoff delays (1s, 2s, 4s, 8s, 16s)
5. WHEN a server has been restarted 5 times THEN the LSP Manager SHALL stop attempting restarts and notify the user
6. WHEN a server successfully operates for an extended period THEN the LSP Manager SHALL reset the restart counter
7. WHEN a server is intentionally stopped THEN the LSP Manager SHALL not attempt to restart it

### Requirement 5: Server Registry and Reuse

**User Story:** As a backend system, I want to reuse language server instances across multiple files, so that I can optimize resource usage.

#### Acceptance Criteria

1. WHEN a language server is requested for a language THEN the LSP Manager SHALL check if a server already exists for that language
2. WHEN a server already exists for a language THEN the LSP Manager SHALL reuse the existing server instance
3. WHEN a document is opened THEN the LSP Manager SHALL add the document URI to the server's active document list
4. WHEN a document is closed THEN the LSP Manager SHALL remove the document URI from the server's active document list
5. WHEN a server has no active documents THEN the LSP Manager SHALL keep the server running for potential reuse
6. WHEN the LSP Manager shuts down THEN the LSP Manager SHALL stop all running language servers

### Requirement 6: Error Handling and Logging

**User Story:** As a system administrator, I want comprehensive error handling and logging, so that I can diagnose and troubleshoot LSP issues.

#### Acceptance Criteria

1. WHEN a server fails to spawn THEN the LSP Manager SHALL log the error with the command and error details
2. WHEN a server crashes THEN the LSP Manager SHALL log the exit code and stderr output
3. WHEN a communication error occurs THEN the LSP Manager SHALL log the error and continue operation
4. WHEN an error occurs THEN the LSP Manager SHALL provide a user-friendly error message with remediation steps
5. WHEN logging is enabled THEN the LSP Manager SHALL log all LSP message sizes and operations at debug level
6. WHEN a server is spawned THEN the LSP Manager SHALL log the process ID and language
7. WHEN a server is stopped THEN the LSP Manager SHALL log the shutdown status

### Requirement 7: IPC Integration

**User Story:** As a backend extension, I want to integrate with Symphony's IPC system, so that I can communicate with the frontend.

#### Acceptance Criteria

1. WHEN the extension initializes THEN the LSP Manager SHALL register with Symphony's extension system
2. WHEN the extension receives a message THEN the LSP Manager SHALL process the message asynchronously
3. WHEN the extension is unloaded THEN the LSP Manager SHALL clean up all resources and stop all servers
4. WHEN a server sends a notification THEN the LSP Manager SHALL forward it to the frontend via IPC
5. WHEN the frontend sends a request THEN the LSP Manager SHALL route it to the appropriate language server

### Requirement 8: Performance and Resource Management

**User Story:** As a backend system, I want to manage resources efficiently, so that the LSP manager doesn't consume excessive memory or CPU.

#### Acceptance Criteria

1. WHEN multiple files of the same language are open THEN the LSP Manager SHALL use a single server instance
2. WHEN reading messages THEN the LSP Manager SHALL use buffered I/O to minimize system calls
3. WHEN a server exceeds 1GB memory usage THEN the LSP Manager SHALL log a warning
4. WHEN spawning processes THEN the LSP Manager SHALL use async I/O to avoid blocking
5. WHEN a server is idle THEN the LSP Manager SHALL not consume CPU resources

### Requirement 9: Configuration Validation

**User Story:** As a system administrator, I want configuration validation, so that I can catch errors before attempting to spawn servers.

#### Acceptance Criteria

1. WHEN a server configuration is provided THEN the LSP Manager SHALL validate that the command is not empty
2. WHEN a server path is absolute THEN the LSP Manager SHALL verify the file exists
3. WHEN a working directory is specified THEN the LSP Manager SHALL verify it exists and is a directory
4. WHEN configuration validation fails THEN the LSP Manager SHALL return a clear error message
5. WHEN a server executable is not found THEN the LSP Manager SHALL provide installation instructions

### Requirement 10: Graceful Shutdown

**User Story:** As a backend system, I want to gracefully shutdown all servers, so that no processes are left running when Symphony closes.

#### Acceptance Criteria

1. WHEN Symphony is closing THEN the LSP Manager SHALL send shutdown requests to all running servers
2. WHEN a server doesn't respond to shutdown within 5 seconds THEN the LSP Manager SHALL forcefully kill the process
3. WHEN all servers are stopped THEN the LSP Manager SHALL complete the shutdown process
4. WHEN a server is being shut down THEN the LSP Manager SHALL wait for the process to exit
5. WHEN the extension is dropped THEN the LSP Manager SHALL ensure all child processes are terminated
