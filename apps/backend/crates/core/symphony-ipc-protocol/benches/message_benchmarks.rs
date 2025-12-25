//! Performance benchmarks for message envelope operations

use criterion::{black_box, criterion_group, criterion_main, Criterion};
use symphony_ipc_protocol::*;
use std::time::Duration;

fn benchmark_message_creation(c: &mut Criterion) {
    c.bench_function("message_creation", |b| {
        b.iter(|| {
            let message = Message::builder()
                .message_type(MessageType::Request)
                .source(EndpointId::new("source"))
                .target(EndpointId::new("target"))
                .payload(black_box("test payload"))
                .build()
                .unwrap();
            black_box(message)
        })
    });
}

fn benchmark_message_id_generation(c: &mut Criterion) {
    c.bench_function("message_id_generation", |b| {
        b.iter(|| {
            let id = MessageId::new();
            black_box(id)
        })
    });
}

fn benchmark_builder_construction(c: &mut Criterion) {
    c.bench_function("builder_construction", |b| {
        b.iter(|| {
            let message = Message::builder()
                .message_type(MessageType::Event)
                .source(EndpointId::new("conductor"))
                .target(EndpointId::new("pool-manager"))
                .priority(Priority::HIGH)
                .ttl(Duration::from_secs(30))
                .payload(black_box("complex payload with metadata"))
                .metadata("request_id", serde_json::Value::String("req-123".to_string()))
                .metadata("timestamp", serde_json::Value::Number(serde_json::Number::from(1234567890)))
                .build()
                .unwrap();
            black_box(message)
        })
    });
}

fn benchmark_message_serialization(c: &mut Criterion) {
    let message = Message::builder()
        .message_type(MessageType::Request)
        .source(EndpointId::new("source"))
        .target(EndpointId::new("target"))
        .payload("test payload for serialization")
        .metadata("key1", serde_json::Value::String("value1".to_string()))
        .metadata("key2", serde_json::Value::Number(serde_json::Number::from(42)))
        .build()
        .unwrap();
    
    c.bench_function("message_serialization", |b| {
        b.iter(|| {
            let bytes = message.to_bytes().unwrap();
            black_box(bytes)
        })
    });
}

fn benchmark_message_deserialization(c: &mut Criterion) {
    let message = Message::builder()
        .message_type(MessageType::Response)
        .source(EndpointId::new("server"))
        .target(EndpointId::new("client"))
        .payload("response payload for deserialization")
        .build()
        .unwrap();
    
    let bytes = message.to_bytes().unwrap();
    
    c.bench_function("message_deserialization", |b| {
        b.iter(|| {
            let deserialized: Message<String> = Message::from_bytes(black_box(&bytes)).unwrap();
            black_box(deserialized)
        })
    });
}

fn benchmark_priority_comparison(c: &mut Criterion) {
    let priorities = vec![
        Priority::BACKGROUND,
        Priority::LOW,
        Priority::NORMAL,
        Priority::HIGH,
        Priority::CRITICAL,
        Priority::custom(50),
        Priority::custom(-50),
    ];
    
    c.bench_function("priority_comparison", |b| {
        b.iter(|| {
            let mut sorted = priorities.clone();
            sorted.sort();
            black_box(sorted)
        })
    });
}

fn benchmark_message_cloning(c: &mut Criterion) {
    let message = Message::builder()
        .message_type(MessageType::Event)
        .source(EndpointId::new("source"))
        .target(EndpointId::new("target"))
        .payload("payload to clone")
        .metadata("meta1", serde_json::Value::String("value1".to_string()))
        .metadata("meta2", serde_json::Value::Bool(true))
        .build()
        .unwrap();
    
    c.bench_function("message_cloning", |b| {
        b.iter(|| {
            let cloned = message.clone();
            black_box(cloned)
        })
    });
}

criterion_group!(
    benches,
    benchmark_message_creation,
    benchmark_message_id_generation,
    benchmark_builder_construction,
    benchmark_message_serialization,
    benchmark_message_deserialization,
    benchmark_priority_comparison,
    benchmark_message_cloning
);

criterion_main!(benches);