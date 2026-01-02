//! Test program to verify auto-initializing logging functionality
//!
//! This example demonstrates that the logging macros work without manual initialization.

use sy_commons::{error, info, warn, duck};

fn main() {
    println!("Testing auto-initializing logging...");
    
    // These should all work without any manual initialization
    info!("Application started successfully");
    warn!("This is a warning message: memory usage at {}MB", 1024);
    error!("Database connection failed: {}", "timeout");
    duck!("Temporary debug info: processing user data");
    
    println!("All logging macros executed successfully!");
    
    // Test with environment variable override
    std::env::set_var("SYMPHONY_LOG_LEVEL", "debug");
    info!("This should still work after env var change");
    
    println!("Auto-initialization test completed!");
}