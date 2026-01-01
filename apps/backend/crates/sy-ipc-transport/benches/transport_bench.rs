//! Performance benchmarks for transport layer
//!
//! Measures transport performance characteristics to ensure they meet
//! the specified latency targets.

use criterion::{black_box, criterion_group, criterion_main, Criterion, BenchmarkId};
use sy_ipc_transport::*;
use std::time::Duration;
use tempfile::TempDir;

fn bench_transport_creation(c: &mut Criterion) {
    let mut group = c.benchmark_group("transport_creation");
    
    group.bench_function("unix_socket", |b| {
        b.iter(|| {
            black_box(UnixSocketTransport::new())
        })
    });
    
    group.bench_function("named_pipe", |b| {
        b.iter(|| {
            black_box(NamedPipeTransport::new())
        })
    });
    
    group.bench_function("stdio", |b| {
        b.iter(|| {
            black_box(StdioTransport::new())
        })
    });
    
    group.finish();
}

fn bench_config_validation(c: &mut Criterion) {
    let mut group = c.benchmark_group("config_validation");
    
    // Unix socket config validation
    let unix_config = UnixSocketConfig {
        socket_path: "/tmp/benchmark.sock".into(),
        timeout: Duration::from_millis(100),
        buffer_size: 8192,
    };
    
    group.bench_function("unix_socket_config", |b| {
        b.iter(|| {
            black_box(unix_config.validate()).unwrap()
        })
    });
    
    // Named pipe config validation
    let named_pipe_config = NamedPipeConfig {
        pipe_name: r"\\.\pipe\benchmark".to_string(),
        timeout: Duration::from_millis(100),
        buffer_size: 8192,
        security_descriptor: None,
    };
    
    group.bench_function("named_pipe_config", |b| {
        b.iter(|| {
            black_box(named_pipe_config.validate()).unwrap()
        })
    });
    
    // STDIO config validation
    let stdio_config = StdioConfig {
        command: "echo".to_string(),
        args: vec!["hello".to_string()],
        timeout: Duration::from_millis(100),
        working_directory: None,
        environment: std::collections::HashMap::new(),
    };
    
    group.bench_function("stdio_config", |b| {
        b.iter(|| {
            black_box(stdio_config.validate()).unwrap()
        })
    });
    
    group.finish();
}

fn bench_performance_profile_access(c: &mut Criterion) {
    let mut group = c.benchmark_group("performance_profile");
    
    let unix_transport = UnixSocketTransport::new();
    let named_pipe_transport = NamedPipeTransport::new();
    let stdio_transport = StdioTransport::new();
    
    group.bench_function("unix_socket_profile", |b| {
        b.iter(|| {
            black_box(unix_transport.performance_profile())
        })
    });
    
    group.bench_function("named_pipe_profile", |b| {
        b.iter(|| {
            black_box(named_pipe_transport.performance_profile())
        })
    });
    
    group.bench_function("stdio_profile", |b| {
        b.iter(|| {
            black_box(stdio_transport.performance_profile())
        })
    });
    
    group.finish();
}

#[cfg(unix)]
fn bench_unix_socket_operations(c: &mut Criterion) {
    let rt = tokio::runtime::Runtime::new().unwrap();
    let mut group = c.benchmark_group("unix_socket_operations");
    
    // Set up temporary directory for benchmarks
    let temp_dir = TempDir::new().unwrap();
    
    group.bench_function("listener_creation", |b| {
        b.to_async(&rt).iter(|| async {
            let socket_path = temp_dir.path().join(format!("bench_{}.sock", rand::random::<u32>()));
            let config = UnixSocketConfig {
                socket_path,
                timeout: Duration::from_millis(100),
                buffer_size: 8192,
            };
            
            let transport = UnixSocketTransport::new();
            let result = transport.listen(&config).await;
            black_box(result)
        })
    });
    
    group.finish();
}

fn bench_stdio_operations(c: &mut Criterion) {
    let rt = tokio::runtime::Runtime::new().unwrap();
    let mut group = c.benchmark_group("stdio_operations");
    
    group.bench_function("echo_connection", |b| {
        b.to_async(&rt).iter(|| async {
            let config = StdioConfig {
                command: "echo".to_string(),
                args: vec!["benchmark".to_string()],
                timeout: Duration::from_millis(1000),
                working_directory: None,
                environment: std::collections::HashMap::new(),
            };
            
            let transport = StdioTransport::new();
            let result = transport.connect(&config).await;
            
            // Clean up connection if successful
            if let Ok(mut connection) = result {
                let _ = connection.close().await;
                black_box(())
            } else {
                black_box(result)
            }
        })
    });
    
    group.finish();
}

fn bench_error_creation(c: &mut Criterion) {
    let mut group = c.benchmark_group("error_creation");
    
    group.bench_function("transport_error", |b| {
        b.iter(|| {
            black_box(TransportError::ConnectionFailed {
                message: "Benchmark error".to_string(),
            })
        })
    });
    
    group.bench_function("config_error", |b| {
        b.iter(|| {
            black_box(ConfigError::InvalidEndpoint {
                message: "Benchmark error".to_string(),
            })
        })
    });
    
    group.finish();
}

criterion_group!(
    benches,
    bench_transport_creation,
    bench_config_validation,
    bench_performance_profile_access,
    bench_stdio_operations,
    bench_error_creation
);

#[cfg(unix)]
criterion_group!(
    unix_benches,
    bench_unix_socket_operations
);

#[cfg(unix)]
criterion_main!(benches, unix_benches);

#[cfg(not(unix))]
criterion_main!(benches);