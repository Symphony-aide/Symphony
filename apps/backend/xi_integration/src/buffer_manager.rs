//! Buffer Manager for tracking open files and preventing duplicates
//!
//! This module provides the `BufferManager` which tracks which files are currently
//! open and prevents opening the same file multiple times. It acts as a registry
//! of open buffers and manages their lifecycle.
//!
//! # Purpose
//!
//! Without a buffer manager, the same file could be opened multiple times, leading to:
//! - Multiple copies of the same file in memory
//! - Inconsistent state when editing
//! - Wasted resources
//!
//! The `BufferManager` solves this by:
//! - Tracking file path → ViewId mappings
//! - Reusing existing views when a file is already open
//! - Managing buffer metadata and lifecycle
//!
//! # Examples
//!
//! ```rust,no_run
//! use xi_integration::{BufferManager, XiIntegration, XiConfig};
//! use std::sync::Arc;
//! use tokio::sync::Mutex;
//! use std::path::PathBuf;
//!
//! # async fn example() -> Result<(), Box<dyn std::error::Error>> {
//! let xi = Arc::new(Mutex::new(XiIntegration::new(XiConfig::default())?));
//! let mut manager = BufferManager::new(xi);
//!
//! // Open a file
//! let view_id1 = manager.open_buffer(PathBuf::from("file.txt")).await?;
//!
//! // Open the same file again - returns the same ViewId!
//! let view_id2 = manager.open_buffer(PathBuf::from("file.txt")).await?;
//!
//! assert_eq!(view_id1, view_id2);
//! # Ok(())
//! # }
//! ```

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;

use crate::{XiIntegration, XiResult, ViewId, BufferMetadata};

/// Buffer Manager for tracking open files
///
/// The `BufferManager` maintains a registry of open files and prevents
/// opening the same file multiple times. It tracks the mapping between
/// file paths and view IDs, and manages buffer metadata.
///
/// # Thread Safety
///
/// This struct is designed to be used with `&mut self` methods, so it
/// should be wrapped in appropriate synchronization primitives if used
/// across threads.
///
/// # Examples
///
/// ```rust,no_run
/// use xi_integration::{BufferManager, XiIntegration, XiConfig};
/// use std::sync::Arc;
/// use tokio::sync::Mutex;
/// use std::path::PathBuf;
///
/// # async fn example() -> Result<(), Box<dyn std::error::Error>> {
/// let xi = Arc::new(Mutex::new(XiIntegration::new(XiConfig::default())?));
/// let mut manager = BufferManager::new(xi);
///
/// // Open multiple files
/// let view1 = manager.open_buffer("file1.txt".into()).await?;
/// let view2 = manager.open_buffer("file2.txt".into()).await?;
///
/// // Check if a file is open
/// assert!(manager.is_open(&PathBuf::from("file1.txt")));
/// # Ok(())
/// # }
/// ```
pub struct BufferManager {
    /// Map of file paths to view IDs
    ///
    /// This map tracks which files are currently open and their associated view IDs.
    /// When a file is requested to be opened, we first check this map to see if
    /// it's already open.
    path_to_view: HashMap<PathBuf, ViewId>,

    /// Map of view IDs to buffer metadata
    ///
    /// This map stores metadata about each open buffer, including the file path,
    /// dirty state, and size.
    view_metadata: HashMap<ViewId, BufferMetadata>,

    /// Reference to Xi-Core integration
    ///
    /// This is used to perform actual file operations through Xi-Core.
    xi: Arc<Mutex<XiIntegration>>,
}

impl BufferManager {
    /// Create a new Buffer Manager
    ///
    /// Initializes the buffer manager with empty tracking maps and a reference
    /// to the Xi-Core integration.
    ///
    /// # Arguments
    ///
    /// * `xi` - Shared reference to `XiIntegration`
    ///
    /// # Examples
    ///
    /// ```rust,no_run
    /// use xi_integration::{BufferManager, XiIntegration, XiConfig};
    /// use std::sync::Arc;
    /// use tokio::sync::Mutex;
    ///
    /// # fn example() -> Result<(), Box<dyn std::error::Error>> {
    /// let xi = Arc::new(Mutex::new(XiIntegration::new(XiConfig::default())?));
    /// let manager = BufferManager::new(xi);
    /// # Ok(())
    /// # }
    /// ```
    pub fn new(xi: Arc<Mutex<XiIntegration>>) -> Self {
        tracing::info!("Initializing Buffer Manager");
        Self {
            path_to_view: HashMap::new(),
            view_metadata: HashMap::new(),
            xi,
        }
    }

    /// Open a buffer or return existing view ID
    ///
    /// If the file is already open, returns the existing view ID.
    /// If the file is not open, opens it and returns a new view ID.
    ///
    /// This prevents opening the same file multiple times and ensures
    /// consistency across the application.
    ///
    /// # Arguments
    ///
    /// * `path` - Path to the file to open
    ///
    /// # Returns
    ///
    /// Returns the `ViewId` for the buffer (either existing or newly created).
    ///
    /// # Errors
    ///
    /// Returns an error if:
    /// - The file cannot be read
    /// - The file contains invalid UTF-8
    ///
    /// # Examples
    ///
    /// ```rust,no_run
    /// # use xi_integration::{BufferManager, XiIntegration, XiConfig};
    /// # use std::sync::Arc;
    /// # use tokio::sync::Mutex;
    /// # use std::path::PathBuf;
    /// # async fn example(manager: &mut BufferManager) -> Result<(), Box<dyn std::error::Error>> {
    /// // Open a file
    /// let view_id = manager.open_buffer(PathBuf::from("example.txt")).await?;
    ///
    /// // Open the same file again - returns the same ViewId
    /// let same_view_id = manager.open_buffer(PathBuf::from("example.txt")).await?;
    /// assert_eq!(view_id, same_view_id);
    /// # Ok(())
    /// # }
    /// ```
    pub async fn open_buffer(&mut self, path: PathBuf) -> XiResult<ViewId> {
        // Check if file is already open
        if let Some(&view_id) = self.path_to_view.get(&path) {
            tracing::info!("File {:?} already open with ViewId {:?}", path, view_id);
            return Ok(view_id);
        }

        // File not open, open it now
        tracing::info!("Opening new file: {:?}", path);
        let view_id = self.xi.lock().await.open_file(&path).await?;

        // Register the file in our tracking maps
        self.path_to_view.insert(path.clone(), view_id);

        // Get and store metadata
        let metadata = self.xi.lock().await.get_metadata(view_id)?;
        self.view_metadata.insert(view_id, metadata);

        Ok(view_id)
    }

    /// Close a buffer and cleanup resources
    ///
    /// Closes the buffer in Xi-Core and removes it from the tracking maps.
    ///
    /// # Arguments
    ///
    /// * `view_id` - The view ID to close
    ///
    /// # Errors
    ///
    /// Returns an error if the view ID is invalid.
    ///
    /// # Examples
    ///
    /// ```rust,no_run
    /// # use xi_integration::{BufferManager, ViewId};
    /// # async fn example(manager: &mut BufferManager, view_id: ViewId) -> Result<(), Box<dyn std::error::Error>> {
    /// manager.close_buffer(view_id).await?;
    /// # Ok(())
    /// # }
    /// ```
    pub async fn close_buffer(&mut self, view_id: ViewId) -> XiResult<()> {
        tracing::info!("Closing buffer {:?}", view_id);

        // Remove from tracking maps
        if let Some(metadata) = self.view_metadata.remove(&view_id) {
            if let Some(path) = metadata.path {
                self.path_to_view.remove(&path);
            }
        }

        // Close in Xi-Core
        self.xi.lock().await.close_view(view_id).await?;

        Ok(())
    }

    /// Check if a file is currently open
    ///
    /// # Arguments
    ///
    /// * `path` - Path to check
    ///
    /// # Returns
    ///
    /// Returns `true` if the file is open, `false` otherwise.
    ///
    /// # Examples
    ///
    /// ```rust,no_run
    /// # use xi_integration::BufferManager;
    /// # use std::path::PathBuf;
    /// # fn example(manager: &BufferManager) {
    /// if manager.is_open(&PathBuf::from("file.txt")) {
    ///     println!("File is open!");
    /// }
    /// # }
    /// ```
    pub fn is_open(&self, path: &PathBuf) -> bool {
        self.path_to_view.contains_key(path)
    }

    /// Get the view ID for an open file
    ///
    /// # Arguments
    ///
    /// * `path` - Path to look up
    ///
    /// # Returns
    ///
    /// Returns `Some(ViewId)` if the file is open, `None` otherwise.
    ///
    /// # Examples
    ///
    /// ```rust,no_run
    /// # use xi_integration::BufferManager;
    /// # use std::path::PathBuf;
    /// # fn example(manager: &BufferManager) {
    /// if let Some(view_id) = manager.get_view_id(&PathBuf::from("file.txt")) {
    ///     println!("File is open with ViewId: {:?}", view_id);
    /// }
    /// # }
    /// ```
    pub fn get_view_id(&self, path: &PathBuf) -> Option<ViewId> {
        self.path_to_view.get(path).copied()
    }

    /// Get metadata for a buffer
    ///
    /// # Arguments
    ///
    /// * `view_id` - The view ID to get metadata for
    ///
    /// # Returns
    ///
    /// Returns a reference to the buffer metadata if the view exists.
    ///
    /// # Examples
    ///
    /// ```rust,no_run
    /// # use xi_integration::{BufferManager, ViewId};
    /// # fn example(manager: &BufferManager, view_id: ViewId) {
    /// if let Some(metadata) = manager.get_metadata(view_id) {
    ///     println!("Buffer size: {} bytes", metadata.size);
    /// }
    /// # }
    /// ```
    pub fn get_metadata(&self, view_id: ViewId) -> Option<&BufferMetadata> {
        self.view_metadata.get(&view_id)
    }

    /// Get a list of all open files
    ///
    /// # Returns
    ///
    /// Returns a vector of all currently open file paths.
    ///
    /// # Examples
    ///
    /// ```rust,no_run
    /// # use xi_integration::BufferManager;
    /// # fn example(manager: &BufferManager) {
    /// let open_files = manager.list_open_files();
    /// println!("Open files: {:?}", open_files);
    /// # }
    /// ```
    pub fn list_open_files(&self) -> Vec<PathBuf> {
        self.path_to_view.keys().cloned().collect()
    }

    /// Get the number of open buffers
    ///
    /// # Returns
    ///
    /// Returns the count of currently open buffers.
    ///
    /// # Examples
    ///
    /// ```rust,no_run
    /// # use xi_integration::BufferManager;
    /// # fn example(manager: &BufferManager) {
    /// println!("Number of open buffers: {}", manager.buffer_count());
    /// # }
    /// ```
    pub fn buffer_count(&self) -> usize {
        self.path_to_view.len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::XiConfig;

    #[tokio::test]
    async fn test_buffer_manager_creation() {
        let xi = Arc::new(Mutex::new(XiIntegration::new(XiConfig::default()).unwrap()));
        let _manager = BufferManager::new(xi);
        // If we get here, creation succeeded
    }

    #[tokio::test]
    async fn test_buffer_manager_open_once() {
        let xi = Arc::new(Mutex::new(XiIntegration::new(XiConfig::default()).unwrap()));
        let mut manager = BufferManager::new(xi);

        let path = PathBuf::from("test.txt");

        // Open file first time
        let view_id1 = manager.open_buffer(path.clone()).await.unwrap();

        // Open same file second time
        let view_id2 = manager.open_buffer(path.clone()).await.unwrap();

        // Should be the same ViewId
        assert_eq!(view_id1, view_id2);
    }

    #[tokio::test]
    async fn test_buffer_manager_multiple_files() {
        let xi = Arc::new(Mutex::new(XiIntegration::new(XiConfig::default()).unwrap()));
        let mut manager = BufferManager::new(xi);

        // Open different files
        let view_id1 = manager.open_buffer("file1.txt".into()).await.unwrap();
        let view_id2 = manager.open_buffer("file2.txt".into()).await.unwrap();
        let view_id3 = manager.open_buffer("file3.txt".into()).await.unwrap();

        // Should be different ViewIds
        assert_ne!(view_id1, view_id2);
        assert_ne!(view_id2, view_id3);
        assert_ne!(view_id1, view_id3);

        // Check count
        assert_eq!(manager.buffer_count(), 3);

        // Check list
        let open_files = manager.list_open_files();
        assert_eq!(open_files.len(), 3);
    }

    #[tokio::test]
    async fn test_buffer_manager_close() {
        let xi = Arc::new(Mutex::new(XiIntegration::new(XiConfig::default()).unwrap()));
        let mut manager = BufferManager::new(xi);

        let path = PathBuf::from("test.txt");

        // Open file
        let view_id = manager.open_buffer(path.clone()).await.unwrap();
        assert!(manager.is_open(&path));
        assert_eq!(manager.buffer_count(), 1);

        // Close file
        manager.close_buffer(view_id).await.unwrap();
        assert!(!manager.is_open(&path));
        assert_eq!(manager.buffer_count(), 0);
    }

    #[tokio::test]
    async fn test_buffer_manager_is_open() {
        let xi = Arc::new(Mutex::new(XiIntegration::new(XiConfig::default()).unwrap()));
        let mut manager = BufferManager::new(xi);

        let path = PathBuf::from("test.txt");

        // File not open initially
        assert!(!manager.is_open(&path));

        // Open file
        manager.open_buffer(path.clone()).await.unwrap();

        // File should be open now
        assert!(manager.is_open(&path));
    }

    #[tokio::test]
    async fn test_buffer_manager_get_view_id() {
        let xi = Arc::new(Mutex::new(XiIntegration::new(XiConfig::default()).unwrap()));
        let mut manager = BufferManager::new(xi);

        let path = PathBuf::from("test.txt");

        // No view ID initially
        assert!(manager.get_view_id(&path).is_none());

        // Open file
        let view_id = manager.open_buffer(path.clone()).await.unwrap();

        // Should get the same view ID
        assert_eq!(manager.get_view_id(&path), Some(view_id));
    }

    #[tokio::test]
    async fn test_buffer_manager_get_metadata() {
        let xi = Arc::new(Mutex::new(XiIntegration::new(XiConfig::default()).unwrap()));
        let mut manager = BufferManager::new(xi);

        // Open file
        let view_id = manager.open_buffer("test.txt".into()).await.unwrap();

        // Get metadata
        let metadata = manager.get_metadata(view_id);
        assert!(metadata.is_some());

        let metadata = metadata.unwrap();
        assert_eq!(metadata.path, Some(PathBuf::from("test.txt")));
    }
}
