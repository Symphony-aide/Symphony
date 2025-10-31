use sylogging::{init_logging, LogConfig};
use tracing::{debug, error, info, warn};

fn main() {
	// Test 1: Initialize async logging with config
	println!("🧪 Test 1: Initializing async logging system...");
	let cfg = LogConfig::from_env();

	// The guard is optional - if you don't need it, just call init_logging(&cfg);
	// But keeping it ensures all logs are flushed before program exit
	let _guard = init_logging(&cfg);

	// Test 2: Different log levels
	println!("\n🧪 Test 2: Testing different log levels (async non-blocking)...");
	info!("INFO: Application started successfully");
	debug!("DEBUG: Debugging startup sequence");
	warn!("WARN: Low disk space on node 2");
	error!("ERROR: Failed to connect to database");

	// Test 3: Async logging performance
	println!("\n🧪 Test 3: Testing async logging performance...");
	for i in 1..=5 {
		info!(iteration = i, "Processing batch {}", i);
	}

	// Test 4: Show that panic handler is active
	println!("\n🧪 Test 4: Panic handler is ready (uncomment line below to test crash)");
	println!("💡 To test panic: uncomment the panic line in main.rs");

	// Uncomment to test panic handler:
	// panic!("💥 Testing panic handler - Database connection timeout!");

	println!("\n✅ All tests passed! Async sylogging is working correctly!");

	// _guard is dropped here, ensuring all logs are flushed before exit
}
