//! Test utilities and factories for sy-ipc-transport
//!
//! This module provides factory structs for generating test data following the
//! mandatory factory-based testing pattern. ZERO TOLERANCE for hardcoded test data.

#[cfg(any(test, feature = "test-utils"))]
/// Test data factories for sy-ipc-transport
///
/// Provides factory structs for generating test data following the mandatory
/// factory-based testing pattern. All test data must be generated using these
/// factories to ensure consistency and avoid hardcoded values.
pub mod factory {
    use std::path::PathBuf;
    use std::time::Duration;

    /// Factory for generating valid Unix socket paths
    pub struct UnixSocketPathTestFactory;

    impl UnixSocketPathTestFactory {
        /// Generate a valid Unix socket path
        pub fn valid() -> PathBuf {
            let id = sy_commons::testing::safe_generator().next_unique_id();
            PathBuf::from(format!("/tmp/symphony_test_{}.sock", id))
        }
        
        /// Generate an invalid Unix socket path (too long)
        pub fn invalid_too_long() -> PathBuf {
            let long_name = "a".repeat(200); // Exceed typical path limits
            PathBuf::from(format!("/tmp/{}.sock", long_name))
        }
        
        /// Generate an invalid Unix socket path (invalid characters)
        pub fn invalid_chars() -> PathBuf {
            let id = sy_commons::testing::safe_generator().next_unique_id();
            PathBuf::from(format!("/tmp/symphony\0invalid_{}.sock", id))
        }
    }

    /// Factory for generating Named Pipe names (Windows)
    pub struct NamedPipeNameTestFactory;

    impl NamedPipeNameTestFactory {
        /// Generate a valid named pipe name
        pub fn valid() -> String {
            let id = sy_commons::testing::safe_generator().next_unique_id();
            format!(r"\\.\pipe\symphony_test_{}", id)
        }
        
        /// Generate an invalid named pipe name (missing prefix)
        pub fn invalid_no_prefix() -> String {
            let id = sy_commons::testing::safe_generator().next_unique_id();
            format!("symphony_test_{}", id)
        }
        
        /// Generate an invalid named pipe name (invalid characters)
        pub fn invalid_chars() -> String {
            let id = sy_commons::testing::safe_generator().next_unique_id();
            format!(r"\\.\pipe\symphony<>test_{}", id)
        }
    }

    /// Factory for generating process commands for STDIO transport
    pub struct ProcessCommandTestFactory;

    impl ProcessCommandTestFactory {
        /// Generate a valid process command (echo)
        pub fn valid_echo() -> String {
            "echo".to_string()
        }
        
        /// Generate a valid process command with args
        pub fn valid_with_args() -> (String, Vec<String>) {
            ("echo".to_string(), vec!["hello".to_string(), "world".to_string()])
        }
        
        /// Generate an invalid process command (non-existent)
        pub fn invalid_nonexistent() -> String {
            let id = sy_commons::testing::safe_generator().next_unique_id();
            format!("nonexistent_command_{}", id)
        }
        
        /// Generate a valid long-running process command (sleep)
        pub fn valid_long_running() -> (String, Vec<String>) {
            ("sleep".to_string(), vec!["1".to_string()])
        }
    }

    /// Factory for generating timeout durations
    pub struct TimeoutTestFactory;

    impl TimeoutTestFactory {
        /// Generate a valid short timeout
        pub fn valid_short() -> Duration {
            Duration::from_millis(100)
        }
        
        /// Generate a valid medium timeout
        pub fn valid_medium() -> Duration {
            Duration::from_millis(1000)
        }
        
        /// Generate a valid long timeout
        pub fn valid_long() -> Duration {
            Duration::from_secs(5)
        }
        
        /// Generate an invalid zero timeout
        pub fn invalid_zero() -> Duration {
            Duration::from_millis(0)
        }
        
        /// Generate a very short timeout (for testing timeouts)
        pub fn very_short() -> Duration {
            Duration::from_millis(1)
        }
    }

    /// Factory for generating buffer sizes
    pub struct BufferSizeTestFactory;

    impl BufferSizeTestFactory {
        /// Generate a valid small buffer size
        pub fn valid_small() -> usize {
            1024
        }
        
        /// Generate a valid medium buffer size
        pub fn valid_medium() -> usize {
            8192
        }
        
        /// Generate a valid large buffer size
        pub fn valid_large() -> usize {
            65536
        }
        
        /// Generate an invalid zero buffer size
        pub fn invalid_zero() -> usize {
            0
        }
        
        /// Generate a very small buffer size (for testing edge cases)
        pub fn very_small() -> usize {
            1
        }
    }

    /// Factory for generating test data payloads
    pub struct PayloadTestFactory;

    impl PayloadTestFactory {
        /// Generate a small valid payload
        pub fn small() -> Vec<u8> {
            b"hello".to_vec()
        }
        
        /// Generate a medium valid payload
        pub fn medium() -> Vec<u8> {
            let id = sy_commons::testing::safe_generator().next_unique_id();
            format!("test_payload_{}_with_some_content", id).into_bytes()
        }
        
        /// Generate a large valid payload
        pub fn large() -> Vec<u8> {
            let id = sy_commons::testing::safe_generator().next_unique_id();
            let base = format!("large_payload_{}_", id);
            let mut payload = base.into_bytes();
            payload.extend(vec![b'x'; 8192]); // 8KB payload
            payload
        }
        
        /// Generate an empty payload
        pub fn empty() -> Vec<u8> {
            Vec::new()
        }
        
        /// Generate a binary payload with null bytes
        pub fn binary_with_nulls() -> Vec<u8> {
            vec![0x00, 0x01, 0x02, 0x00, 0xFF, 0x00, 0xFE]
        }
        
        /// Generate a UTF-8 payload
        pub fn utf8_text() -> Vec<u8> {
            let id = sy_commons::testing::safe_generator().next_unique_id();
            format!("UTF-8 text with émojis 🚀 and unicode ñ test_{}", id).into_bytes()
        }
    }

    /// Factory for generating endpoint addresses
    pub struct EndpointTestFactory;

    impl EndpointTestFactory {
        /// Generate a valid Unix socket endpoint
        pub fn unix_socket() -> String {
            UnixSocketPathTestFactory::valid().to_string_lossy().to_string()
        }
        
        /// Generate a valid named pipe endpoint
        pub fn named_pipe() -> String {
            NamedPipeNameTestFactory::valid()
        }
        
        /// Generate a valid STDIO endpoint (command)
        pub fn stdio() -> String {
            ProcessCommandTestFactory::valid_echo()
        }
        
        /// Generate an invalid endpoint (empty)
        pub fn invalid_empty() -> String {
            String::new()
        }
    }

    /// Factory for generating connection metadata
    pub struct ConnectionInfoTestFactory;

    impl ConnectionInfoTestFactory {
        /// Generate valid connection info for Unix socket
        pub fn unix_socket() -> (String, u64, u64) {
            let endpoint = EndpointTestFactory::unix_socket();
            let bytes_sent = sy_commons::testing::safe_generator().number_in_range(0, 1000);
            let bytes_received = sy_commons::testing::safe_generator().number_in_range(0, 1000);
            (endpoint, bytes_sent, bytes_received)
        }
        
        /// Generate valid connection info for named pipe
        pub fn named_pipe() -> (String, u64, u64) {
            let endpoint = EndpointTestFactory::named_pipe();
            let bytes_sent = sy_commons::testing::safe_generator().number_in_range(0, 1000);
            let bytes_received = sy_commons::testing::safe_generator().number_in_range(0, 1000);
            (endpoint, bytes_sent, bytes_received)
        }
        
        /// Generate valid connection info for STDIO
        pub fn stdio() -> (String, u64, u64) {
            let endpoint = EndpointTestFactory::stdio();
            let bytes_sent = sy_commons::testing::safe_generator().number_in_range(0, 1000);
            let bytes_received = sy_commons::testing::safe_generator().number_in_range(0, 1000);
            (endpoint, bytes_sent, bytes_received)
        }
    }
}