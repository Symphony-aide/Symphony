//! Message codecs for serialization

use bytes::Bytes;
use sytypes::{SymphonyError, SymphonyResult, Message};

/// Message codec trait
pub trait Codec: Send + Sync {
    /// Encode a message to bytes
    fn encode(&self, message: &Message) -> SymphonyResult<Bytes>;
    
    /// Decode bytes to a message
    fn decode(&self, data: &[u8]) -> SymphonyResult<Message>;
    
    /// Get codec name
    fn name(&self) -> &str;
}

/// MessagePack codec (binary, efficient)
pub struct MessagePackCodec;

impl Codec for MessagePackCodec {
    fn encode(&self, message: &Message) -> SymphonyResult<Bytes> {
        let bytes = rmp_serde::to_vec(message)
            .map_err(|e| SymphonyError::Serialization(format!("MessagePack encode error: {}", e)))?;
        Ok(Bytes::from(bytes))
    }
    
    fn decode(&self, data: &[u8]) -> SymphonyResult<Message> {
        rmp_serde::from_slice(data)
            .map_err(|e| SymphonyError::Serialization(format!("MessagePack decode error: {}", e)))
    }
    
    fn name(&self) -> &str {
        "messagepack"
    }
}

/// Bincode codec (binary, fast)
pub struct BincodeCodec;

impl Codec for BincodeCodec {
    fn encode(&self, message: &Message) -> SymphonyResult<Bytes> {
        let bytes = bincode::serialize(message)
            .map_err(|e| SymphonyError::Serialization(format!("Bincode encode error: {}", e)))?;
        Ok(Bytes::from(bytes))
    }
    
    fn decode(&self, data: &[u8]) -> SymphonyResult<Message> {
        bincode::deserialize(data)
            .map_err(|e| SymphonyError::Serialization(format!("Bincode decode error: {}", e)))
    }
    
    fn name(&self) -> &str {
        "bincode"
    }
}

/// JSON codec (text, human-readable, debugging)
pub struct JsonCodec;

impl Codec for JsonCodec {
    fn encode(&self, message: &Message) -> SymphonyResult<Bytes> {
        let bytes = serde_json::to_vec(message)
            .map_err(|e| SymphonyError::Serialization(format!("JSON encode error: {}", e)))?;
        Ok(Bytes::from(bytes))
    }
    
    fn decode(&self, data: &[u8]) -> SymphonyResult<Message> {
        serde_json::from_slice(data)
            .map_err(|e| SymphonyError::Serialization(format!("JSON decode error: {}", e)))
    }
    
    fn name(&self) -> &str {
        "json"
    }
}

/// Get codec by name
#[allow(dead_code)]
pub fn get_codec(name: &str) -> Option<Box<dyn Codec>> {
    match name.to_lowercase().as_str() {
        "messagepack" | "msgpack" => Some(Box::new(MessagePackCodec)),
        "bincode" => Some(Box::new(BincodeCodec)),
        "json" => Some(Box::new(JsonCodec)),
        _ => None,
    }
}
