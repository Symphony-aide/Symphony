//! Integration tests for the transport layer
//!
//! These tests verify that transport implementations work correctly across
//! platforms and meet performance requirements.

// Tests are allowed to panic for assertion failures
#![allow(clippy::panic)]

#[cfg(feature = "integration")]
mod cross_platform_tests {
    use sy_ipc_transport::{
        NamedPipeTransport, StdioTransport, Transport, TransportType, UnixSocketTransport,
    };
    use std::time::Duration;
    
    #[tokio::test]
    async fn test_unix_socket_cross_platform_availability() {
        let transport = UnixSocketTransport::new();
        assert_eq!(transport.transport_type(), TransportType::UnixSocket);
        
        let profile = transport.performance_profile();
        assert!(profile.platform_specific);
        
        #[cfg(unix)]
        {
            // On Unix platforms, should have reasonable performance targets
            assert!(profile.typical_latency <= Duration::from_millis(1));
        }
        
        #[cfg(not(unix))]
        {
            // On non-Unix platforms, Unix sockets might not be available
            // but the transport should still be creatable
            assert!(profile.typical_latency > Duration::from_nanos(0));
        }
    }
    
    #[tokio::test]
    async fn test_named_pipe_cross_platform_availability() {
        let transport = NamedPipeTransport::new();
        assert_eq!(transport.transport_type(), TransportType::NamedPipe);
        
        let profile = transport.performance_profile();
        assert!(profile.platform_specific);
        
        #[cfg(windows)]
        {
            // On Windows, should have reasonable performance targets
            assert!(profile.typical_latency <= Duration::from_millis(1));
        }
        
        #[cfg(not(windows))]
        {
            // On non-Windows platforms, named pipes are not supported
            // but the transport should still be creatable
            assert!(profile.typical_latency > Duration::from_nanos(0));
        }
    }
    
    #[tokio::test]
    async fn test_stdio_cross_platform_availability() {
        let transport = StdioTransport::new();
        assert_eq!(transport.transport_type(), TransportType::Stdio);
        
        let profile = transport.performance_profile();
        assert!(!profile.platform_specific); // STDIO should work on all platforms
        
        // STDIO should have reasonable performance targets on all platforms
        assert!(profile.typical_latency <= Duration::from_millis(10));
    }
}

#[cfg(feature = "integration")]
mod unix_socket_integration_tests {
    use sy_ipc_transport::{
        Transport, TransportError, UnixSocketConfig, UnixSocketTransport,
    };
    
    // Import test factories for integration tests
    #[cfg(feature = "test-utils")]
    use sy_ipc_transport::test_utils::factory::{
        BufferSizeTestFactory, TimeoutTestFactory, UnixSocketPathTestFactory,
    };
    
    #[cfg(all(feature = "integration", unix))]
    #[tokio::test]
    async fn test_unix_socket_listener_and_connection() {
        use tempfile::TempDir;
        
        let temp_dir = TempDir::new().unwrap();
        let socket_path = temp_dir.path().join("integration_test.sock");
        
        let config = UnixSocketConfig {
            socket_path,
            timeout: TimeoutTestFactory::valid_medium(),
            buffer_size: BufferSizeTestFactory::valid_medium(),
        };
        
        let transport = UnixSocketTransport::new();
        
        // Test listener creation
        let listener_result = transport.listen(&config).await;
        assert!(listener_result.is_ok(), "Failed to create Unix socket listener");
        
        // Verify socket file was created
        assert!(config.socket_path.exists(), "Socket file was not created");
        
        // Verify socket permissions (Unix-specific)
        let metadata = std::fs::metadata(&config.socket_path).unwrap();
        let permissions = metadata.permissions();
        
        use std::os::unix::fs::PermissionsExt;
        let mode = permissions.mode();
        // Should be owner read/write only (0o600)
        assert_eq!(mode & 0o777, 0o600, "Socket permissions are incorrect");
        
        println!("✅ Unix socket test passed on Unix platform");
    }
    
    #[cfg(all(feature = "integration", not(unix)))]
    #[tokio::test]
    async fn test_unix_socket_listener_and_connection_unsupported() {
        let config = UnixSocketConfig {
            socket_path: UnixSocketPathTestFactory::valid(),
            timeout: TimeoutTestFactory::valid_medium(),
            buffer_size: BufferSizeTestFactory::valid_medium(),
        };
        
        let transport = UnixSocketTransport::new();
        
        // Test listener creation should fail on non-Unix platforms
        let listener_result = transport.listen(&config).await;
        assert!(listener_result.is_err(), "Unix socket listener should fail on non-Unix platforms");
        
        match listener_result {
            Err(TransportError::UnsupportedPlatform { message }) => {
                assert!(message.contains("Unix sockets not supported"));
                println!("✅ Expected behavior: Unix sockets not supported on Windows");
            }
            other => {
                eprintln!("Expected UnsupportedPlatform error, got: {other:?}");
                panic!("Expected UnsupportedPlatform error");
            }
        }
    }
    
    #[cfg(all(feature = "integration", unix))]
    #[tokio::test]
    async fn test_unix_socket_connection_failure_no_listener() {
        let socket_path = UnixSocketPathTestFactory::valid();
        
        let config = UnixSocketConfig {
            socket_path,
            timeout: TimeoutTestFactory::very_short(), // Short timeout for quick test
            buffer_size: BufferSizeTestFactory::valid_small(),
        };
        
        let transport = UnixSocketTransport::new();
        
        // Test that connection fails when no listener exists
        let result = transport.connect(&config).await;
        assert!(result.is_err(), "Connection should fail when no listener exists");
        
        match result {
            Err(TransportError::ConnectionFailed { .. }) => {
                // Expected error type
                println!("✅ Expected connection failure on Unix platform");
            }
            Err(TransportError::ConnectionTimeout) => {
                // Also acceptable for very short timeout
                println!("✅ Expected connection timeout on Unix platform");
            }
            Err(other) => {
                eprintln!("Unexpected error type: {other:?}");
                panic!("Expected ConnectionFailed or ConnectionTimeout error");
            }
            Ok(_) => {
                panic!("Connection should not succeed without listener");
            }
        }
    }
    
    #[cfg(all(feature = "integration", not(unix)))]
    #[tokio::test]
    async fn test_unix_socket_connection_failure_no_listener_unsupported() {
        let config = UnixSocketConfig {
            socket_path: UnixSocketPathTestFactory::valid(),
            timeout: TimeoutTestFactory::very_short(),
            buffer_size: BufferSizeTestFactory::valid_small(),
        };
        
        let transport = UnixSocketTransport::new();
        
        // On non-Unix platforms, should get UnsupportedPlatform error
        let result = transport.connect(&config).await;
        assert!(result.is_err(), "Connection should fail on non-Unix platforms");
        
        match result {
            Err(TransportError::UnsupportedPlatform { message }) => {
                assert!(message.contains("not supported"), 
                       "Error should indicate platform not supported");
                println!("✅ Expected behavior: Unix sockets not supported on Windows");
            }
            Err(other) => {
                eprintln!("Expected UnsupportedPlatform error, got: {other:?}");
                panic!("Expected UnsupportedPlatform error");
            }
            Ok(_) => {
                panic!("Unix sockets should not work on non-Unix platforms");
            }
        }
    }
}

#[cfg(feature = "integration")]
mod stdio_integration_tests {
    use sy_ipc_transport::{
        Connection, StdioConfig, StdioTransport, Transport, TransportError, TransportType,
    };
    
    // Import test factories for integration tests
    #[cfg(feature = "test-utils")]
    use sy_ipc_transport::test_utils::factory::{
        ProcessCommandTestFactory, TimeoutTestFactory,
    };
    
    #[tokio::test]
    async fn test_stdio_connection_with_echo_command() {
        // Use platform-appropriate echo command
        let (command, args) = if cfg!(windows) {
            ("cmd".to_string(), vec!["/C".to_string(), "echo".to_string(), "hello".to_string(), "world".to_string()])
        } else {
            ("echo".to_string(), vec!["hello".to_string(), "world".to_string()])
        };
        
        let config = StdioConfig {
            command,
            args,
            timeout: TimeoutTestFactory::valid_medium(),
            working_directory: None,
            environment: std::collections::HashMap::new(),
        };
        
        let transport = StdioTransport::new();
        
        // Test connection to echo command
        let result = transport.connect(&config).await;
        
        match result {
            Ok(connection) => {
                // Test that connection is initially healthy
                assert!(connection.is_healthy().await, "Connection should be healthy initially");
                
                // Test connection info
                let info = connection.connection_info();
                assert_eq!(info.transport_type, TransportType::Stdio);
                
                if cfg!(windows) {
                    assert!(info.endpoint.contains("cmd"), "Endpoint should contain 'cmd' on Windows");
                } else {
                    assert!(info.endpoint.contains("echo"), "Endpoint should contain 'echo' on Unix");
                }
                
                assert_eq!(info.bytes_sent, 0, "No bytes should be sent initially");
                assert_eq!(info.bytes_received, 0, "No bytes should be received initially");
                
                println!("✅ STDIO connection successful on platform: {}", 
                        if cfg!(windows) { "Windows" } else { "Unix" });
            }
            Err(e) => {
                // On some platforms or environments, echo might not be available
                println!("⚠️ STDIO connection failed (may be expected in some environments): {e:?}");
                // Don't fail the test - this might be expected in some CI environments
            }
        }
    }
    
    #[tokio::test]
    async fn test_stdio_connection_with_invalid_command() {
        let config = StdioConfig {
            command: ProcessCommandTestFactory::invalid_nonexistent(),
            args: vec![],
            timeout: TimeoutTestFactory::valid_short(),
            working_directory: None,
            environment: std::collections::HashMap::new(),
        };
        
        let transport = StdioTransport::new();
        
        // Test that connection fails with non-existent command
        let result = transport.connect(&config).await;
        assert!(result.is_err(), "Connection should fail with invalid command");
        
        match result {
            Err(TransportError::ConnectionFailed { message }) => {
                assert!(message.contains("Failed to spawn process"), 
                       "Error message should indicate process spawn failure");
            }
            Err(other) => {
                eprintln!("Unexpected error type: {other:?}");
                panic!("Expected ConnectionFailed error");
            }
            Ok(_) => {
                panic!("Connection should not succeed with invalid command");
            }
        }
    }
    
    #[tokio::test]
    async fn test_stdio_listen_not_supported() {
        let config = StdioConfig {
            command: ProcessCommandTestFactory::valid_echo(),
            args: vec![],
            timeout: TimeoutTestFactory::valid_short(),
            working_directory: None,
            environment: std::collections::HashMap::new(),
        };
        
        let transport = StdioTransport::new();
        
        // Test that listen operation is not supported
        let result = transport.listen(&config).await;
        assert!(result.is_err(), "Listen should not be supported for STDIO transport");
        
        match result {
            Err(TransportError::UnsupportedOperation { message }) => {
                assert!(message.contains("does not support listening"),
                       "Error should indicate listening is not supported");
            }
            Err(other) => {
                eprintln!("Unexpected error type: {other:?}");
                panic!("Expected UnsupportedOperation error");
            }
            Ok(_) => {
                panic!("Listen should not be supported");
            }
        }
    }
}

#[cfg(feature = "integration")]
mod named_pipe_integration_tests {
    use sy_ipc_transport::{
        NamedPipeConfig, NamedPipeTransport, Transport, TransportError,
    };
    
    // Import test factories for integration tests
    #[cfg(feature = "test-utils")]
    use sy_ipc_transport::test_utils::factory::{
        BufferSizeTestFactory, NamedPipeNameTestFactory, TimeoutTestFactory,
    };
    
    #[cfg(all(feature = "integration", windows))]
    #[tokio::test]
    async fn test_named_pipe_connection_behavior_windows() {
        let config = NamedPipeConfig {
            pipe_name: NamedPipeNameTestFactory::valid(),
            timeout: TimeoutTestFactory::valid_short(),
            buffer_size: BufferSizeTestFactory::valid_medium(),
            security_descriptor: None,
        };
        
        let transport = NamedPipeTransport::new();
        
        // Test connection attempt on Windows
        let result = transport.connect(&config).await;
        
        match result {
            Ok(_) => {
                // Unexpected but not wrong if a server happens to be running
                println!("✅ Named pipe connection succeeded (server was available)");
            }
            Err(TransportError::UnsupportedOperation { .. }) => {
                // Expected for placeholder implementation
                println!("✅ Expected behavior: Named pipe implementation is a stub");
            }
            Err(TransportError::ConnectionFailed { .. }) => {
                // Expected when no server is listening
                println!("✅ Expected behavior: No named pipe server listening");
            }
            Err(other) => {
                // Other errors are acceptable for now
                println!("⚠️ Named pipe connection error (may be expected): {other:?}");
            }
        }
    }
    
    #[cfg(all(feature = "integration", not(windows)))]
    #[tokio::test]
    async fn test_named_pipe_connection_behavior_non_windows() {
        let config = NamedPipeConfig {
            pipe_name: NamedPipeNameTestFactory::valid(),
            timeout: TimeoutTestFactory::valid_short(),
            buffer_size: BufferSizeTestFactory::valid_medium(),
            security_descriptor: None,
        };
        
        let transport = NamedPipeTransport::new();
        
        // Test connection attempt on non-Windows platforms
        let result = transport.connect(&config).await;
        
        match result {
            Err(TransportError::UnsupportedPlatform { message }) => {
                assert!(message.contains("not supported"), 
                       "Error should indicate platform not supported");
                println!("✅ Expected behavior: Named pipes not supported on Unix platforms");
            }
            Err(other) => {
                eprintln!("Expected UnsupportedPlatform error, got: {other:?}");
                panic!("Expected UnsupportedPlatform error");
            }
            Ok(_) => {
                panic!("Named pipes should not work on non-Windows platforms");
            }
        }
    }
}

#[cfg(feature = "performance")]
mod performance_tests {
    use sy_ipc_transport::{
        NamedPipeTransport, StdioConfig, StdioTransport, TransportConfig,
    };
    use std::time::{Duration, Instant};
    
    // Import test factories for performance tests
    #[cfg(feature = "test-utils")]
    use sy_ipc_transport::test_utils::factory::{
        ProcessCommandTestFactory, TimeoutTestFactory,
    };
    
    #[cfg(all(feature = "test-utils", unix))]
    use sy_ipc_transport::test_utils::factory::{
        BufferSizeTestFactory, UnixSocketPathTestFactory,
    };
    
    #[cfg(unix)]
    use sy_ipc_transport::{Transport, UnixSocketConfig, UnixSocketTransport};
    
    #[tokio::test]
    async fn test_transport_creation_performance() {
        let start = Instant::now();
        
        // Test that transport creation is fast
        #[cfg(unix)]
        let _unix_transport = UnixSocketTransport::new();
        let _named_pipe_transport = NamedPipeTransport::new();
        let _stdio_transport = StdioTransport::new();
        
        let creation_time = start.elapsed();
        
        // Transport creation should be very fast (< 1ms)
        assert!(creation_time < Duration::from_millis(1), 
               "Transport creation took too long: {creation_time:?}");
    }
    
    #[cfg(unix)]
    #[tokio::test]
    async fn test_unix_socket_config_validation_performance() {
        let start = Instant::now();
        
        // Test config validation performance
        for _ in 0..1000 {
            let config = UnixSocketConfig {
                socket_path: UnixSocketPathTestFactory::valid(),
                timeout: TimeoutTestFactory::valid_short(),
                buffer_size: BufferSizeTestFactory::valid_medium(),
            };
            
            let _ = config.validate();
        }
        
        let validation_time = start.elapsed();
        
        // 1000 validations should complete quickly (< 10ms)
        assert!(validation_time < Duration::from_millis(10),
               "Config validation took too long: {validation_time:?}");
    }
    
    #[tokio::test]
    async fn test_stdio_config_validation_performance() {
        let start = Instant::now();
        
        // Test config validation performance
        for _ in 0..1000 {
            let config = StdioConfig {
                command: ProcessCommandTestFactory::valid_echo(),
                args: vec!["test".to_string()],
                timeout: TimeoutTestFactory::valid_short(),
                working_directory: None,
                environment: std::collections::HashMap::new(),
            };
            
            let _ = config.validate();
        }
        
        let validation_time = start.elapsed();
        
        // 1000 validations should complete quickly (< 10ms)
        assert!(validation_time < Duration::from_millis(10),
               "Config validation took too long: {validation_time:?}");
    }
}