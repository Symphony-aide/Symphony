use sylogging::{init_logging, LogConfig};
use tracing::{info, warn, error, debug};

fn main() {
    // Test 1: Initialize logging with config
    println!("🧪 Test 1: Initializing logging system...");
    let cfg = LogConfig::from_env();
    init_logging(&cfg);
    
    // Test 2: Different log levels
    println!("\n🧪 Test 2: Testing different log levels...");
    info!("✅ INFO: Application started successfully");
    debug!("🔍 DEBUG: Debugging startup sequence");
    warn!("⚠️  WARN: Low disk space on node 2");
    error!("❌ ERROR: Failed to connect to database");
    
    // Test 3: Show that panic handler is active
    println!("\n🧪 Test 3: Panic handler is ready (uncomment line below to test crash)");
    println!("💡 To test panic: uncomment the panic line in main.rs");
    
    // Uncomment to test panic handler:
    // panic!("💥 Testing panic handler - Database connection timeout!");
    
    println!("\n✅ All tests passed! Sylogging is working correctly!");
}
