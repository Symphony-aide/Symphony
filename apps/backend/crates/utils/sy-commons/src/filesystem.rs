//! Safe filesystem utilities for Symphony
//!
//! This module provides safe filesystem operations with proper error handling,
//! atomic writes, and security validation.

use std::path::Path;
use directories::ProjectDirs;
use crate::error::SymphonyError;

/// Safe file reading with error handling
///
/// # Examples
///
/// ```rust
/// use sy_commons::filesystem::read_file;
///
/// async fn example() -> Result<(), Box<dyn std::error::Error>> {
///     // This would work with an actual file:
///     // let content = read_file("config.toml").await?;
///     // println!("Config: {}", content);
///     Ok(())
/// }
/// ```
pub async fn read_file<P: AsRef<Path>>(path: P) -> Result<String, SymphonyError> {
    let path = path.as_ref();
    validate_path(path)?;
    
    tokio::fs::read_to_string(path)
        .await
        .map_err(|e| SymphonyError::Io {
            source: e,
            context: Some(format!("Failed to read file: {}", path.display())),
        })
}

/// Safe file writing with atomic operations
///
/// # Examples
///
/// ```rust
/// use sy_commons::filesystem::write_file;
///
/// async fn example() -> Result<(), Box<dyn std::error::Error>> {
///     // This would write to an actual file:
///     // write_file("output.txt", "Hello, World!").await?;
///     Ok(())
/// }
/// ```
pub async fn write_file<P: AsRef<Path>>(path: P, content: &str) -> Result<(), SymphonyError> {
    let path = path.as_ref();
    validate_path(path)?;
    
    // Create parent directories if they don't exist
    if let Some(parent) = path.parent() {
        create_dir_all(parent).await?;
    }
    
    // Atomic write using temporary file
    let temp_path = path.with_extension("tmp");
    
    tokio::fs::write(&temp_path, content)
        .await
        .map_err(|e| SymphonyError::Io {
            source: e,
            context: Some(format!("Failed to write temp file: {}", temp_path.display())),
        })?;
    
    tokio::fs::rename(&temp_path, path)
        .await
        .map_err(|e| SymphonyError::Io {
            source: e,
            context: Some(format!("Failed to rename temp file to: {}", path.display())),
        })?;
    
    Ok(())
}

/// Create directory and all parent directories
///
/// # Examples
///
/// ```rust
/// use sy_commons::filesystem::create_dir_all;
///
/// async fn example() -> Result<(), Box<dyn std::error::Error>> {
///     // This would create actual directories:
///     // create_dir_all("path/to/nested/directory").await?;
///     Ok(())
/// }
/// ```
pub async fn create_dir_all<P: AsRef<Path>>(path: P) -> Result<(), SymphonyError> {
    let path = path.as_ref();
    validate_path(path)?;
    
    tokio::fs::create_dir_all(path)
        .await
        .map_err(|e| SymphonyError::Io {
            source: e,
            context: Some(format!("Failed to create directory: {}", path.display())),
        })
}

/// Check if file exists
///
/// # Examples
///
/// ```rust
/// use sy_commons::filesystem::file_exists;
///
/// async fn example() {
///     // This would check an actual file:
///     // if file_exists("config.toml").await {
///     //     println!("Config file exists");
///     // }
/// }
/// ```
pub async fn file_exists<P: AsRef<Path>>(path: P) -> bool {
    path.as_ref().exists()
}

/// Get platform-specific directories
///
/// # Examples
///
/// ```rust
/// use sy_commons::filesystem::get_project_dirs;
///
/// if let Some(dirs) = get_project_dirs() {
///     println!("Config dir: {:?}", dirs.config_dir());
/// }
/// ```
#[must_use] 
pub fn get_project_dirs() -> Option<ProjectDirs> {
    ProjectDirs::from("com", "Symphony", "Symphony")
}

/// Validate path for security (prevent directory traversal)
fn validate_path<P: AsRef<Path>>(path: P) -> Result<(), SymphonyError> {
    let path = path.as_ref();
    
    // Check for directory traversal attempts
    if path.components().any(|c| matches!(c, std::path::Component::ParentDir)) {
        return Err(SymphonyError::Validation {
            message: "Path contains directory traversal".to_string(),
            field: Some("path".to_string()),
            value: Some(path.display().to_string()),
        });
    }
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[tokio::test]
    async fn test_read_file_success() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("test.txt");
        let content = "Hello, World!";
        
        std::fs::write(&file_path, content).unwrap();
        
        let result = read_file(&file_path).await.unwrap();
        assert_eq!(result, content);
    }

    #[tokio::test]
    async fn test_read_file_not_found() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("nonexistent.txt");
        
        let result = read_file(&file_path).await;
        assert!(result.is_err());
        
        match result.unwrap_err() {
            SymphonyError::Io { source, context } => {
                assert_eq!(source.kind(), std::io::ErrorKind::NotFound);
                assert!(context.is_some());
                assert!(context.unwrap().contains("Failed to read file"));
            }
            _ => panic!("Expected Io error"),
        }
    }

    #[tokio::test]
    async fn test_write_file_atomic() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("test.txt");
        let content = "Test content";
        
        write_file(&file_path, content).await.unwrap();
        
        assert!(file_path.exists());
        let read_content = std::fs::read_to_string(&file_path).unwrap();
        assert_eq!(read_content, content);
        
        // Verify no temporary file remains
        let temp_path = file_path.with_extension("tmp");
        assert!(!temp_path.exists());
    }

    #[tokio::test]
    async fn test_create_dir_all() {
        let temp_dir = TempDir::new().unwrap();
        let nested_path = temp_dir.path().join("a").join("b").join("c");
        
        create_dir_all(&nested_path).await.unwrap();
        
        assert!(nested_path.exists());
        assert!(nested_path.is_dir());
    }

    #[tokio::test]
    async fn test_file_exists() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("test.txt");
        
        assert!(!file_exists(&file_path).await);
        
        std::fs::write(&file_path, "content").unwrap();
        
        assert!(file_exists(&file_path).await);
    }

    #[test]
    fn test_path_validation_directory_traversal() {
        let path = Path::new("../../../etc/passwd");
        let result = validate_path(path);
        
        assert!(result.is_err());
        match result.unwrap_err() {
            SymphonyError::Validation { message, field, value } => {
                assert!(message.contains("directory traversal"));
                assert_eq!(field, Some("path".to_string()));
                assert!(value.is_some());
            }
            _ => panic!("Expected Validation error"),
        }
    }

    #[test]
    fn test_path_validation_safe_path() {
        let path = Path::new("safe/path/file.txt");
        let result = validate_path(path);
        
        assert!(result.is_ok());
    }

    #[test]
    fn test_get_project_dirs() {
        let dirs = get_project_dirs();
        // This test is platform-dependent, so we just verify it doesn't panic
        // and returns a reasonable result
        if let Some(dirs) = dirs {
            assert!(dirs.config_dir().exists() || !dirs.config_dir().as_os_str().is_empty());
        }
    }
}