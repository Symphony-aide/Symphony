//! Serialization abstractions for multiple formats
//!
//! Provides MessagePack, Bincode, and JSON serialization with performance optimization
//! and error handling for Symphony's IPC communication.

use serde::{de::DeserializeOwned, Serialize};
use std::time::Instant;
use sy_commons::{debug::duck, error::SymphonyError};

/// Supported serialization formats
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum SerializationFormat {
	/// MessagePack binary format for cross-language compatibility
	MessagePack,
	/// Bincode binary format for pure Rust performance
	Bincode,
	/// JSON format for human readability and debugging
	Json,
}

/// Serialization errors with format-specific context
#[derive(Debug, thiserror::Error)]
pub enum SerializationError {
	/// MessagePack serialization/deserialization error
	#[error("MessagePack error: {0}")]
	MessagePackError(String),

	/// Bincode serialization/deserialization error
	#[error("Bincode error: {0}")]
	BincodeError(String),

	/// JSON serialization/deserialization error
	#[error("JSON error: {0}")]
	JsonError(String),

	/// Unsupported serialization format
	#[error("Unsupported format: {0:?}")]
	UnsupportedFormat(SerializationFormat),

	/// Performance target violation
	#[error(
		"Performance target violated: {operation} took {duration_ms}ms, expected <{target_ms}ms"
	)]
	PerformanceViolation {
		/// The operation that violated performance targets
		operation: String,
		/// Actual duration in milliseconds
		duration_ms: u64,
		/// Target duration in milliseconds
		target_ms: u64,
	},
}

impl From<SerializationError> for SymphonyError {
	fn from(err: SerializationError) -> Self {
		SymphonyError::Generic {
			message: format!("Serialization error: {}", err),
			source: Some(Box::new(err)),
		}
	}
}

/// Concrete serializer enum that can be used as a trait object alternative
#[derive(Debug)]
pub enum MessageSerializer {
	/// MessagePack serializer
	MessagePack(MessagePackSerializer),
	/// Bincode serializer
	Bincode(BincodeSerializer),
	/// JSON serializer
	Json(JsonSerializer),
}

impl MessageSerializer {
	/// Creates a new MessagePack serializer
	pub fn message_pack() -> Self {
		Self::MessagePack(MessagePackSerializer)
	}

	/// Creates a new Bincode serializer
	pub fn bincode() -> Self {
		Self::Bincode(BincodeSerializer)
	}

	/// Creates a new JSON serializer
	pub fn json() -> Self {
		Self::Json(JsonSerializer)
	}

	/// Serializes a message to bytes
	///
	/// # Arguments
	///
	/// * `message` - Message to serialize
	///
	/// # Errors
	///
	/// Returns `SerializationError` if serialization fails
	pub async fn serialize<T>(&self, message: &T) -> Result<Vec<u8>, SerializationError>
	where
		T: Serialize + Send + Sync,
	{
		match self {
			Self::MessagePack(serializer) => serializer.serialize(message).await,
			Self::Bincode(serializer) => serializer.serialize(message).await,
			Self::Json(serializer) => serializer.serialize(message).await,
		}
	}

	/// Deserializes bytes to a message
	///
	/// # Arguments
	///
	/// * `data` - Bytes to deserialize
	///
	/// # Errors
	///
	/// Returns `SerializationError` if deserialization fails
	pub async fn deserialize<T>(&self, data: &[u8]) -> Result<T, SerializationError>
	where
		T: DeserializeOwned + Send + Sync,
	{
		match self {
			Self::MessagePack(serializer) => serializer.deserialize(data).await,
			Self::Bincode(serializer) => serializer.deserialize(data).await,
			Self::Json(serializer) => serializer.deserialize(data).await,
		}
	}

	/// Returns the serialization format
	pub fn format(&self) -> SerializationFormat {
		match self {
			Self::MessagePack(serializer) => serializer.format(),
			Self::Bincode(serializer) => serializer.format(),
			Self::Json(serializer) => serializer.format(),
		}
	}

	/// Returns the MIME content type
	pub fn content_type(&self) -> &'static str {
		match self {
			Self::MessagePack(serializer) => serializer.content_type(),
			Self::Bincode(serializer) => serializer.content_type(),
			Self::Json(serializer) => serializer.content_type(),
		}
	}
}

/// MessagePack serializer for cross-language binary communication
#[derive(Debug)]
pub struct MessagePackSerializer;

impl MessagePackSerializer {
	/// Serializes a message using MessagePack
	pub async fn serialize<T>(&self, message: &T) -> Result<Vec<u8>, SerializationError>
	where
		T: Serialize + Send + Sync,
	{
		duck!("Serializing message with MessagePack");
		let start = Instant::now();

		let result = rmp_serde::to_vec(message)
			.map_err(|e| SerializationError::MessagePackError(e.to_string()))?;

		let duration = start.elapsed();
		let duration_micros = u64::try_from(duration.as_micros())
			.unwrap_or(u64::MAX); // If duration is too large, use max value

		// Performance target: <0.01ms (10 microseconds) in production
		// Allow more flexibility in debug/test builds
		if duration_micros > 10 && cfg!(not(debug_assertions)) {
			duck!(
				"MessagePack serialization took {}μs (target: <10μs in release)",
				duration_micros
			);
			return Err(SerializationError::PerformanceViolation {
				operation: "MessagePack serialize".to_string(),
				duration_ms: u64::try_from(duration.as_millis()).unwrap_or(u64::MAX),
				target_ms: 0, // <0.01ms
			});
		}

		duck!("MessagePack serialization completed in {}μs", duration_micros);
		Ok(result)
	}

	/// Deserializes bytes using MessagePack
	pub async fn deserialize<T>(&self, data: &[u8]) -> Result<T, SerializationError>
	where
		T: DeserializeOwned + Send + Sync,
	{
		duck!("Deserializing message with MessagePack");
		let start = Instant::now();

		let result = rmp_serde::from_slice(data)
			.map_err(|e| SerializationError::MessagePackError(e.to_string()))?;

		let duration = start.elapsed();
		let duration_micros = u64::try_from(duration.as_micros())
			.unwrap_or(u64::MAX); // If duration is too large, use max value

		// Performance target: <0.01ms (10 microseconds) in production
		// Allow more flexibility in debug/test builds
		if duration_micros > 10 && cfg!(not(debug_assertions)) {
			duck!(
				"MessagePack deserialization took {}μs (target: <10μs in release)",
				duration_micros
			);
			return Err(SerializationError::PerformanceViolation {
				operation: "MessagePack deserialize".to_string(),
				duration_ms: u64::try_from(duration.as_millis()).unwrap_or(u64::MAX),
				target_ms: 0, // <0.01ms
			});
		}

		duck!("MessagePack deserialization completed in {}μs", duration_micros);
		Ok(result)
	}

	/// Returns the serialization format
	pub fn format(&self) -> SerializationFormat {
		SerializationFormat::MessagePack
	}

	/// Returns the MIME content type
	pub fn content_type(&self) -> &'static str {
		"application/msgpack"
	}
}

/// Bincode serializer for high-performance Rust-to-Rust communication
#[derive(Debug)]
pub struct BincodeSerializer;

impl BincodeSerializer {
	/// Serializes a message using Bincode
	pub async fn serialize<T>(&self, message: &T) -> Result<Vec<u8>, SerializationError>
	where
		T: Serialize + Send + Sync,
	{
		duck!("Serializing message with Bincode");
		let start = Instant::now();

		let config = bincode::config::standard();
		let result = bincode::serde::encode_to_vec(message, config)
			.map_err(|e| SerializationError::BincodeError(e.to_string()))?;

		let duration = start.elapsed();
		let duration_micros = duration.as_micros() as u64;

		// Performance target: <0.01ms (10 microseconds) in production
		// Allow more flexibility in debug/test builds
		if duration_micros > 10 && cfg!(not(debug_assertions)) {
			duck!("Bincode serialization took {}μs (target: <10μs in release)", duration_micros);
			return Err(SerializationError::PerformanceViolation {
				operation: "Bincode serialize".to_string(),
				duration_ms: duration.as_millis() as u64,
				target_ms: 0, // <0.01ms
			});
		}

		duck!("Bincode serialization completed in {}μs", duration_micros);
		Ok(result)
	}

	/// Deserializes bytes using Bincode
	pub async fn deserialize<T>(&self, data: &[u8]) -> Result<T, SerializationError>
	where
		T: DeserializeOwned + Send + Sync,
	{
		duck!("Deserializing message with Bincode");
		let start = Instant::now();

		let config = bincode::config::standard();
		let (result, _len) = bincode::serde::decode_from_slice(data, config)
			.map_err(|e| SerializationError::BincodeError(e.to_string()))?;

		let duration = start.elapsed();
		let duration_micros = duration.as_micros() as u64;

		// Performance target: <0.01ms (10 microseconds) in production
		// Allow more flexibility in debug/test builds
		if duration_micros > 10 && cfg!(not(debug_assertions)) {
			duck!("Bincode deserialization took {}μs (target: <10μs in release)", duration_micros);
			return Err(SerializationError::PerformanceViolation {
				operation: "Bincode deserialize".to_string(),
				duration_ms: duration.as_millis() as u64,
				target_ms: 0, // <0.01ms
			});
		}

		duck!("Bincode deserialization completed in {}μs", duration_micros);
		Ok(result)
	}

	/// Returns the serialization format
	pub fn format(&self) -> SerializationFormat {
		SerializationFormat::Bincode
	}

	/// Returns the MIME content type
	pub fn content_type(&self) -> &'static str {
		"application/octet-stream"
	}
}

/// JSON serializer for human-readable communication and debugging
#[derive(Debug)]
pub struct JsonSerializer;

impl JsonSerializer {
	/// Serializes a message using JSON
	pub async fn serialize<T>(&self, message: &T) -> Result<Vec<u8>, SerializationError>
	where
		T: Serialize + Send + Sync,
	{
		duck!("Serializing message with JSON");
		let start = Instant::now();

		let result = serde_json::to_vec(message)
			.map_err(|e| SerializationError::JsonError(e.to_string()))?;

		let duration = start.elapsed();
		duck!("JSON serialization completed in {}μs", duration.as_micros());
		Ok(result)
	}

	/// Deserializes bytes using JSON
	pub async fn deserialize<T>(&self, data: &[u8]) -> Result<T, SerializationError>
	where
		T: DeserializeOwned + Send + Sync,
	{
		duck!("Deserializing message with JSON");
		let start = Instant::now();

		let result = serde_json::from_slice(data)
			.map_err(|e| SerializationError::JsonError(e.to_string()))?;

		let duration = start.elapsed();
		duck!("JSON deserialization completed in {}μs", duration.as_micros());
		Ok(result)
	}

	/// Returns the serialization format
	pub fn format(&self) -> SerializationFormat {
		SerializationFormat::Json
	}

	/// Returns the MIME content type
	pub fn content_type(&self) -> &'static str {
		"application/json"
	}
}
