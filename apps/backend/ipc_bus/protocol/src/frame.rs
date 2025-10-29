//! Message framing for IPC protocol

use bytes::{Bytes, BytesMut, BufMut};
use sytypes::{SymphonyError, SymphonyResult};

/// Frame type
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum FrameType {
    /// Data frame
    Data = 0x01,
    /// Ping frame (keepalive)
    Ping = 0x02,
    /// Pong frame (keepalive response)
    Pong = 0x03,
    /// Close frame
    Close = 0x04,
}

impl FrameType {
    /// Convert from u8
    pub fn from_u8(value: u8) -> SymphonyResult<Self> {
        match value {
            0x01 => Ok(FrameType::Data),
            0x02 => Ok(FrameType::Ping),
            0x03 => Ok(FrameType::Pong),
            0x04 => Ok(FrameType::Close),
            _ => Err(SymphonyError::Ipc(format!("Invalid frame type: {}", value))),
        }
    }
}

/// Frame header
#[derive(Debug, Clone)]
pub struct FrameHeader {
    /// Protocol version
    pub version: u8,
    /// Frame type
    pub frame_type: FrameType,
    /// Payload length
    pub length: u32,
}

impl FrameHeader {
    /// Header size in bytes (version + type + length)
    pub const SIZE: usize = 1 + 1 + 4;
    
    /// Create a new frame header
    pub fn new(frame_type: FrameType, length: u32) -> Self {
        Self {
            version: crate::PROTOCOL_VERSION,
            frame_type,
            length,
        }
    }
    
    /// Serialize header to bytes
    pub fn to_bytes(&self) -> [u8; Self::SIZE] {
        let mut buf = [0u8; Self::SIZE];
        buf[0] = self.version;
        buf[1] = self.frame_type as u8;
        buf[2..6].copy_from_slice(&self.length.to_be_bytes());
        buf
    }
    
    /// Deserialize header from bytes
    pub fn from_bytes(data: &[u8]) -> SymphonyResult<Self> {
        if data.len() < Self::SIZE {
            return Err(SymphonyError::Ipc("Incomplete frame header".to_string()));
        }
        
        let version = data[0];
        if version != crate::PROTOCOL_VERSION {
            return Err(SymphonyError::Ipc(format!(
                "Unsupported protocol version: {}",
                version
            )));
        }
        
        let frame_type = FrameType::from_u8(data[1])?;
        let length = u32::from_be_bytes([data[2], data[3], data[4], data[5]]);
        
        Ok(Self {
            version,
            frame_type,
            length,
        })
    }
}

/// Message frame
#[derive(Debug, Clone)]
pub struct Frame {
    /// Frame header
    pub header: FrameHeader,
    /// Frame payload
    pub payload: Bytes,
}

impl Frame {
    /// Create a new frame
    pub fn new(frame_type: FrameType, payload: Bytes) -> Self {
        let header = FrameHeader::new(frame_type, payload.len() as u32);
        Self { header, payload }
    }
    
    /// Create a ping frame
    pub fn ping() -> Self {
        Self::new(FrameType::Ping, Bytes::new())
    }
    
    /// Create a pong frame
    pub fn pong() -> Self {
        Self::new(FrameType::Pong, Bytes::new())
    }
    
    /// Create a close frame
    pub fn close() -> Self {
        Self::new(FrameType::Close, Bytes::new())
    }
    
    /// Serialize frame to bytes
    pub fn to_bytes(&self) -> Bytes {
        let mut buf = BytesMut::with_capacity(FrameHeader::SIZE + self.payload.len());
        buf.put_slice(&self.header.to_bytes());
        buf.put_slice(&self.payload);
        buf.freeze()
    }
    
    /// Deserialize frame from bytes
    pub fn from_bytes(data: &[u8]) -> SymphonyResult<Self> {
        let header = FrameHeader::from_bytes(data)?;
        
        let total_size = FrameHeader::SIZE + header.length as usize;
        if data.len() < total_size {
            return Err(SymphonyError::Ipc("Incomplete frame".to_string()));
        }
        
        let payload = Bytes::copy_from_slice(&data[FrameHeader::SIZE..total_size]);
        
        Ok(Self { header, payload })
    }
    
    /// Get total frame size
    pub fn size(&self) -> usize {
        FrameHeader::SIZE + self.payload.len()
    }
}
