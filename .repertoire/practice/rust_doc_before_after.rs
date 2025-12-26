// ============================================================================
// ❌ BEFORE: Bad Documentation Practices
// ============================================================================

// This module handles user authentication
use std::collections::HashMap;

// User struct
pub struct User {
    pub id: u64,        // user id
    pub name: String,   // the name
    pub email: String,
}

// This function creates a new user
// Takes an id, name and email
// Returns a User
pub fn create_user(id: u64, name: String, email: String) -> User {
    User { id, name, email }
}

/// validate_email checks if email is valid
pub fn validate_email(email: String) -> bool {
    email.contains("@")
}

// Authenticates a user
// TODO: add better docs
pub fn authenticate(username: &str, password: &str) -> Result<User, String> {
    if password.len() < 8 {
        return Err("password too short".to_string());
    }
    // Check database
    unimplemented!()
}

/// Caches users
pub struct UserCache {
    cache: HashMap<u64, User>,
}

impl UserCache {
    // new cache
    pub fn new() -> Self {
        Self {
            cache: HashMap::new(),
        }
    }

    /// Gets a user from cache
    pub fn get(&self, id: u64) -> Option<&User> {
        self.cache.get(&id)
    }

    // insert adds user to cache
    pub fn insert(&mut self, user: User) {
        self.cache.insert(user.id, user);
    }
}


// ============================================================================
// ✅ AFTER: Following Our Documentation Standards
// ============================================================================

//! User authentication and session management
//!
//! This module provides core functionality for:
//! - Creating and validating user accounts
//! - Authenticating users with credentials
//! - Caching user data for performance
//!
//! # Examples
//!
//! ```
//! use my_crate::auth::{User, authenticate, UserCache};
//!
//! // Create and authenticate a user
//! let user = User::new(1, "alice", "alice@example.com");
//! let result = authenticate("alice", "secure_password");
//! 
//! // Cache users for quick lookup
//! let mut cache = UserCache::new();
//! cache.insert(user);
//! ```

use std::collections::HashMap;

/// Represents a user account in the system
///
/// A `User` contains the essential information needed to identify
/// and contact a user. All fields are validated upon creation.
///
/// # Examples
///
/// ```
/// use my_crate::auth::User;
///
/// let user = User::new(42, "alice", "alice@example.com");
/// assert_eq!(user.id(), 42);
/// assert_eq!(user.name(), "alice");
/// ```
#[derive(Debug, Clone)]
pub struct User {
    /// Unique identifier for the user
    id: u64,
    
    /// Display name for the user
    name: String,
    
    /// Email address for contact and authentication
    email: String,
}

impl User {
    /// Creates a new user with the given credentials
    ///
    /// # Arguments
    ///
    /// * `id` - Unique identifier (must be non-zero)
    /// * `name` - Display name (must not be empty)
    /// * `email` - Email address (must contain '@')
    ///
    /// # Panics
    ///
    /// Panics if `id` is 0, `name` is empty, or `email` is invalid.
    ///
    /// # Examples
    ///
    /// ```
    /// use my_crate::auth::User;
    ///
    /// let user = User::new(1, "bob", "bob@example.com");
    /// ```
    ///
    /// ```should_panic
    /// use my_crate::auth::User;
    ///
    /// // This will panic - invalid email
    /// let user = User::new(1, "bob", "invalid-email");
    /// ```
    pub fn new(id: u64, name: impl Into<String>, email: impl Into<String>) -> Self {
        let name = name.into();
        let email = email.into();
        
        assert!(id > 0, "User ID must be non-zero");
        assert!(!name.is_empty(), "Name cannot be empty");
        assert!(email.contains('@'), "Email must contain '@'");
        
        Self { id, name, email }
    }
    
    /// Returns the user's unique identifier
    pub fn id(&self) -> u64 {
        self.id
    }
    
    /// Returns the user's display name
    pub fn name(&self) -> &str {
        &self.name
    }
    
    /// Returns the user's email address
    pub fn email(&self) -> &str {
        &self.email
    }
}