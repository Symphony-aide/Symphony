//! Core types used throughout Symphony

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use uuid::Uuid;

/// Unique identifier for Symphony entities
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct EntityId(pub Uuid);

impl EntityId {
    /// Create a new random entity ID
    pub fn new() -> Self {
        Self(Uuid::new_v4())
    }

    /// Create from a UUID
    pub fn from_uuid(uuid: Uuid) -> Self {
        Self(uuid)
    }
}

impl Default for EntityId {
    fn default() -> Self {
        Self::new()
    }
}

impl std::fmt::Display for EntityId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

/// File path wrapper with validation
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct FilePath(PathBuf);

impl FilePath {
    /// Create a new file path
    pub fn new(path: PathBuf) -> Self {
        Self(path)
    }

    /// Get the inner PathBuf
    pub fn as_path(&self) -> &PathBuf {
        &self.0
    }

    /// Convert to string
    pub fn to_string_lossy(&self) -> String {
        self.0.to_string_lossy().to_string()
    }
}

impl From<PathBuf> for FilePath {
    fn from(path: PathBuf) -> Self {
        Self(path)
    }
}

impl From<&str> for FilePath {
    fn from(s: &str) -> Self {
        Self(PathBuf::from(s))
    }
}

/// Timestamp wrapper using chrono
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub struct Timestamp(chrono::DateTime<chrono::Utc>);

impl Timestamp {
    /// Get current timestamp
    pub fn now() -> Self {
        Self(chrono::Utc::now())
    }

    /// Create from Unix timestamp (seconds)
    pub fn from_secs(secs: i64) -> Option<Self> {
        chrono::DateTime::from_timestamp(secs, 0).map(Self)
    }

    /// Get Unix timestamp in seconds
    pub fn as_secs(&self) -> i64 {
        self.0.timestamp()
    }

    /// Get the inner DateTime
    pub fn inner(&self) -> chrono::DateTime<chrono::Utc> {
        self.0
    }
}

impl Default for Timestamp {
    fn default() -> Self {
        Self::now()
    }
}

/// Process ID wrapper
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct ProcessId(pub u32);

impl ProcessId {
    /// Create a new process ID
    pub fn new(id: u32) -> Self {
        Self(id)
    }

    /// Get the inner u32
    pub fn as_u32(&self) -> u32 {
        self.0
    }
}

impl From<u32> for ProcessId {
    fn from(id: u32) -> Self {
        Self(id)
    }
}

/// Version information
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Version {
    pub major: u32,
    pub minor: u32,
    pub patch: u32,
    pub pre_release: Option<String>,
}

impl Version {
    /// Create a new version
    pub fn new(major: u32, minor: u32, patch: u32) -> Self {
        Self {
            major,
            minor,
            patch,
            pre_release: None,
        }
    }

    /// Parse from semver string
    pub fn parse(s: &str) -> Result<Self, String> {
        let parts: Vec<&str> = s.split('.').collect();
        if parts.len() < 3 {
            return Err("Invalid version format".to_string());
        }

        let major = parts[0].parse().map_err(|_| "Invalid major version")?;
        let minor = parts[1].parse().map_err(|_| "Invalid minor version")?;
        let patch = parts[2].parse().map_err(|_| "Invalid patch version")?;

        Ok(Self::new(major, minor, patch))
    }
}

impl std::fmt::Display for Version {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}.{}.{}", self.major, self.minor, self.patch)?;
        if let Some(pre) = &self.pre_release {
            write!(f, "-{}", pre)?;
        }
        Ok(())
    }
}

/// Priority levels for tasks and messages
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize, Default)]
pub enum Priority {
    Low = 0,
    #[default]
    Normal = 1,
    High = 2,
    Critical = 3,
}
