use std::panic;
use tracing::error;

pub fn set_panic_hook() {
    panic::set_hook(Box::new(|info| {
        let location = info.location()
            .map(|l| format!("{}:{}", l.file(), l.line()))
            .unwrap_or_else(|| "unknown location".to_string());
        
        let msg = if let Some(s) = info.payload().downcast_ref::<&str>() {
            s.to_string()
        } else if let Some(s) = info.payload().downcast_ref::<String>() {
            s.clone()
        } else {
            "unknown panic message".to_string()
        };
        
        error!("💥 PANIC at {} => {}", location, msg);
    }));
}
