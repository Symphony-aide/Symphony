//! Test program to verify configuration loading and auto-initializing logging
//!
//! This example demonstrates configuration loading from TOML files and environment variables.

use sy_commons::{error, info, warn, duck};
use sy_commons::config::{load_config, DefaultConfig};

fn main() {
    println!("Testing configuration loading and auto-initializing logging...");
    
    // Test 1: Auto-initialization with built-in defaults
    println!("\n=== Test 1: Auto-initialization ===");
    info!("This uses auto-initialization with built-in defaults");
    
    // Test 2: Manual configuration loading
    println!("\n=== Test 2: Manual configuration loading ===");
    
    // Try to load configuration manually
    match load_config::<DefaultConfig>("development") {
        Ok(config) => {
            println!("✅ Successfully loaded configuration:");
            println!("   - Log level: {}", config.logging.level);
            println!("   - Console enabled: {}", config.logging.console.enabled);
            println!("   - Console colors: {}", config.logging.console.colors);
            println!("   - File logging: {}", config.logging.file.is_some());
            println!("   - JSON logging: {}", config.logging.json.is_some());
            println!("   - Duck debugging: {}", config.debug.duck_debugging);
            println!("   - Performance logging: {}", config.debug.performance_logging);
            
            // Initialize logging with loaded config
            if let Err(e) = sy_commons::logging::init_logging(&config.logging) {
                println!("⚠️  Failed to initialize logging with config: {}", e);
            } else {
                println!("✅ Logging initialized with loaded configuration");
            }
        }
        Err(e) => {
            println!("⚠️  Failed to load configuration: {}", e);
            println!("   This is expected if config files don't exist");
        }
    }
    
    // Test 3: Logging with different levels
    println!("\n=== Test 3: Different log levels ===");
    error!("This is an error message");
    warn!("This is a warning message");
    info!("This is an info message");
    duck!("This is a duck debugging message");
    
    // Test 4: Environment variable demonstration
    println!("\n=== Test 4: Environment variables ===");
    println!("Set SYMPHONY_ENV=development to use development.toml");
    println!("Set SYMPHONY_LOGGING_LEVEL=debug to override log level");
    
    if let Ok(env) = std::env::var("SYMPHONY_ENV") {
        println!("Current SYMPHONY_ENV: {}", env);
    } else {
        println!("SYMPHONY_ENV not set (using default: development)");
    }
    
    println!("\nConfiguration test completed!");
}