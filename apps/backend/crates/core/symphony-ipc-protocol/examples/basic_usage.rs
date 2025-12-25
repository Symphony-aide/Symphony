//! Basic usage example for Symphony IPC Protocol

use symphony_ipc_protocol::*;
use std::time::Duration;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("Symphony IPC Protocol - Basic Usage Example");
    println!("============================================");
    
    // Example 1: Simple message creation
    println!("\n1. Simple message creation:");
    let simple_message = Message::builder()
        .message_type(MessageType::Request)
        .source(EndpointId::new("client"))
        .target(EndpointId::new("server"))
        .payload("Hello, Server!")
        .build()?;
    
    println!("   Message ID: {}", simple_message.header.id);
    println!("   Type: {}", simple_message.header.message_type);
    println!("   Source: {}", simple_message.header.source);
    println!("   Target: {}", simple_message.header.target);
    println!("   Payload: {}", simple_message.payload);
    
    // Example 2: Complex message with metadata and priority
    println!("\n2. Complex message with metadata:");
    let complex_message = Message::builder()
        .message_type(MessageType::Event)
        .source(EndpointId::new("conductor"))
        .target(EndpointId::new("pool-manager"))
        .priority(Priority::HIGH)
        .ttl(Duration::from_secs(30))
        .payload("System alert: High CPU usage detected")
        .metadata("severity", serde_json::Value::String("warning".to_string()))
        .metadata("cpu_usage", serde_json::Value::Number(serde_json::Number::from(85)))
        .metadata("timestamp", serde_json::Value::Number(serde_json::Number::from(1640995200)))
        .build()?;
    
    println!("   Message ID: {}", complex_message.header.id);
    println!("   Priority: {}", complex_message.header.priority);
    println!("   TTL: {:?}", complex_message.header.ttl);
    println!("   Metadata entries: {}", complex_message.metadata.len());
    for (key, value) in &complex_message.metadata {
        println!("     {}: {}", key, value);
    }
    
    // Example 3: Request-Response correlation
    println!("\n3. Request-Response correlation:");
    let request = Message::builder()
        .message_type(MessageType::Request)
        .source(EndpointId::new("client"))
        .target(EndpointId::new("database"))
        .payload("SELECT * FROM users WHERE active = true")
        .build()?;
    
    let response = Message::builder()
        .message_type(MessageType::Response)
        .source(EndpointId::new("database"))
        .target(EndpointId::new("client"))
        .correlation_id(request.header.id.clone())
        .payload("Query executed successfully: 42 rows returned")
        .build()?;
    
    println!("   Request ID: {}", request.header.id);
    println!("   Response correlation ID: {:?}", response.header.correlation_id);
    println!("   Correlation match: {}", 
        response.header.correlation_id == Some(request.header.id));
    
    // Example 4: Priority ordering
    println!("\n4. Priority ordering:");
    let priorities = vec![
        Priority::BACKGROUND,
        Priority::CRITICAL,
        Priority::LOW,
        Priority::HIGH,
        Priority::NORMAL,
        Priority::custom(500),
    ];
    
    let mut sorted_priorities = priorities.clone();
    sorted_priorities.sort();
    sorted_priorities.reverse(); // Highest priority first
    
    println!("   Original order: {:?}", priorities);
    println!("   Sorted (highest first): {:?}", sorted_priorities);
    
    // Example 5: Serialization round-trip
    println!("\n5. Serialization round-trip:");
    let original = Message::builder()
        .message_type(MessageType::Heartbeat)
        .source(EndpointId::new("monitor"))
        .target(EndpointId::new("health-check"))
        .payload("ping")
        .build()?;
    
    let serialized = original.to_bytes()?;
    let deserialized: Message<String> = Message::from_bytes(&serialized)?;
    
    println!("   Original == Deserialized: {}", original == deserialized);
    println!("   Serialized size: {} bytes", serialized.len());
    
    // Example 6: Message expiration
    println!("\n6. Message expiration:");
    let expiring_message = Message::builder()
        .message_type(MessageType::Event)
        .source(EndpointId::new("timer"))
        .target(EndpointId::new("handler"))
        .ttl(Duration::from_millis(100))
        .payload("This message will expire soon")
        .build()?;
    
    println!("   Message expired initially: {}", expiring_message.is_expired());
    println!("   Message age: {:?}", expiring_message.age());
    
    // Wait a bit and check again
    std::thread::sleep(Duration::from_millis(150));
    println!("   Message expired after 150ms: {}", expiring_message.is_expired());
    println!("   Message age after wait: {:?}", expiring_message.age());
    
    println!("\n✅ All examples completed successfully!");
    Ok(())
}