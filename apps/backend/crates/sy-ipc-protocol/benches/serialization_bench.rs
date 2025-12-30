//! Performance benchmarks for serialization formats
//!
//! Validates that serialization meets performance targets:
//! - MessagePack/Bincode: <0.01ms (10 microseconds)
//! - JSON-RPC: <1ms (1000 microseconds)

use criterion::{black_box, criterion_group, criterion_main, BenchmarkId, Criterion};
use sy_commons::debug::duck;
use sy_ipc_protocol::{MessageEnvelope, MessageType, SerializationFormat};

fn create_sample_envelope() -> MessageEnvelope<String> {
	MessageEnvelope::new(
		MessageType::PitOperation,
		"benchmark payload with some reasonable length to simulate real usage".to_string(),
	)
}

fn benchmark_messagepack_serialization(c: &mut Criterion) {
	duck!("Benchmarking MessagePack serialization");

	let rt = tokio::runtime::Runtime::new().unwrap();
	let envelope = create_sample_envelope();
	let serializer = sy_ipc_protocol::serialize::MessagePackSerializer;

	c.bench_function("messagepack_serialize", |b| {
		b.iter(|| {
			rt.block_on(async {
				let result = serializer.serialize(black_box(&envelope)).await;
				black_box(result)
			})
		})
	});

	// Benchmark deserialization too
	let serialized = rt.block_on(async { serializer.serialize(&envelope).await.unwrap() });

	c.bench_function("messagepack_deserialize", |b| {
		b.iter(|| {
			rt.block_on(async {
				let result: Result<MessageEnvelope<String>, _> =
					serializer.deserialize(black_box(&serialized)).await;
				black_box(result)
			})
		})
	});
}

fn benchmark_bincode_serialization(c: &mut Criterion) {
	duck!("Benchmarking Bincode serialization");

	let rt = tokio::runtime::Runtime::new().unwrap();
	let envelope = create_sample_envelope();
	let serializer = sy_ipc_protocol::serialize::BincodeSerializer;

	c.bench_function("bincode_serialize", |b| {
		b.iter(|| {
			rt.block_on(async {
				let result = serializer.serialize(black_box(&envelope)).await;
				black_box(result)
			})
		})
	});

	let serialized = rt.block_on(async { serializer.serialize(&envelope).await.unwrap() });

	c.bench_function("bincode_deserialize", |b| {
		b.iter(|| {
			rt.block_on(async {
				let result: Result<MessageEnvelope<String>, _> =
					serializer.deserialize(black_box(&serialized)).await;
				black_box(result)
			})
		})
	});
}

fn benchmark_json_serialization(c: &mut Criterion) {
	duck!("Benchmarking JSON serialization");

	let rt = tokio::runtime::Runtime::new().unwrap();
	let envelope = create_sample_envelope();
	let serializer = sy_ipc_protocol::serialize::JsonSerializer;

	c.bench_function("json_serialize", |b| {
		b.iter(|| {
			rt.block_on(async {
				let result = serializer.serialize(black_box(&envelope)).await;
				black_box(result)
			})
		})
	});

	let serialized = rt.block_on(async { serializer.serialize(&envelope).await.unwrap() });

	c.bench_function("json_deserialize", |b| {
		b.iter(|| {
			rt.block_on(async {
				let result: Result<MessageEnvelope<String>, _> =
					serializer.deserialize(black_box(&serialized)).await;
				black_box(result)
			})
		})
	});
}

fn benchmark_all_formats(c: &mut Criterion) {
	duck!("Benchmarking all serialization formats");

	let rt = tokio::runtime::Runtime::new().unwrap();
	let envelope = create_sample_envelope();

	let formats = vec![
		("MessagePack", SerializationFormat::MessagePack),
		("Bincode", SerializationFormat::Bincode),
		("JSON", SerializationFormat::Json),
	];

	let mut group = c.benchmark_group("serialization_comparison");

	for (name, format) in formats {
		let serializer = match format {
			SerializationFormat::MessagePack => sy_ipc_protocol::MessageSerializer::message_pack(),
			SerializationFormat::Bincode => sy_ipc_protocol::MessageSerializer::bincode(),
			SerializationFormat::Json => sy_ipc_protocol::MessageSerializer::json(),
		};

		group.bench_with_input(BenchmarkId::new("serialize", name), &format, |b, _| {
			b.iter(|| {
				rt.block_on(async {
					let result = serializer.serialize(black_box(&envelope)).await;
					black_box(result)
				})
			})
		});
	}

	group.finish();
}

criterion_group!(
	benches,
	benchmark_messagepack_serialization,
	benchmark_bincode_serialization,
	benchmark_json_serialization,
	benchmark_all_formats
);
criterion_main!(benches);
