use sylogging;

fn main() {
    // Initialize the logging system
    sylogging::init_with_level("info");
    
    // Test the logging functions
    sylogging::log_info("Symphony Logging System initialized");
    sylogging::log_warn("This is a warning message");
    sylogging::log_error("This is an error message");
    sylogging::log_debug("This is a debug message (won't show with 'info' level)");
    
    println!("\n✅ Sylogging package is working!");
}

pub fn hello_logging() {
    println!("Symphony Logging Package");
}