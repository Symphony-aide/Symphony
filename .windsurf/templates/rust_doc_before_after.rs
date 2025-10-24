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

/// Validates an email address format
///
/// Performs basic validation by checking for the presence of an '@' symbol
/// and ensuring the email has content before and after it.
///
/// # Note
///
/// This is a simplified validation. For production use, consider using
/// a dedicated email validation crate that implements RFC 5322.
///
/// # Examples
///
/// ```
/// use my_crate::auth::validate_email;
///
/// assert!(validate_email("user@example.com"));
/// assert!(validate_email("test+tag@domain.co.uk"));
/// assert!(!validate_email("invalid-email"));
/// assert!(!validate_email("@example.com"));
/// assert!(!validate_email("user@"));
/// ```
pub fn validate_email(email: &str) -> bool {
    if let Some(at_pos) = email.find('@') {
        at_pos > 0 && at_pos < email.len() - 1
    } else {
        false
    }
}

/// Authentication error types
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum AuthError {
    /// Password does not meet minimum requirements
    WeakPassword,
    
    /// User credentials are invalid
    InvalidCredentials,
    
    /// Database connection or query failed
    DatabaseError(String),
}

impl std::fmt::Display for AuthError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AuthError::WeakPassword => write!(f, "Password must be at least 8 characters"),
            AuthError::InvalidCredentials => write!(f, "Invalid username or password"),
            AuthError::DatabaseError(msg) => write!(f, "Database error: {}", msg),
        }
    }
}

impl std::error::Error for AuthError {}

/// Authenticates a user with the provided credentials
///
/// Verifies the username and password against the user database,
/// returning the authenticated user on success.
///
/// # Arguments
///
/// * `username` - The username or email to authenticate
/// * `password` - The plaintext password (hashed internally)
///
/// # Returns
///
/// Returns the authenticated [`User`] if credentials are valid.
///
/// # Errors
///
/// Returns an error in the following cases:
/// - [`AuthError::WeakPassword`] - Password is less than 8 characters
/// - [`AuthError::InvalidCredentials`] - Username/password don't match
/// - [`AuthError::DatabaseError`] - Database query failed
///
/// # Security
///
/// Passwords should be transmitted over secure connections only.
/// This function assumes the password has already been validated
/// on the client side for basic requirements.
///
/// # Examples
///
/// ```no_run
/// use my_crate::auth::{authenticate, AuthError};
///
/// match authenticate("alice", "secure_password123") {
///     Ok(user) => println!("Welcome, {}!", user.name()),
///     Err(AuthError::WeakPassword) => println!("Password too short"),
///     Err(AuthError::InvalidCredentials) => println!("Login failed"),
///     Err(e) => println!("Error: {}", e),
/// }
/// ```
pub fn authenticate(username: &str, password: &str) -> Result<User, AuthError> {
    // Enforce minimum password length
    if password.len() < 8 {
        return Err(AuthError::WeakPassword);
    }
    
    // In a real implementation, this would:
    // 1. Hash the password with a salt
    // 2. Query the database for the username
    // 3. Compare hashed passwords using constant-time comparison
    // 4. Return the user record if successful
    
    // Placeholder for actual database lookup
    unimplemented!("Database authentication not yet implemented")
}

/// In-memory cache for user data
///
/// Provides fast lookups for frequently accessed user information
/// without hitting the database on every request.
///
/// # Performance
///
/// Uses a [`HashMap`] for O(1) average-case lookups by user ID.
/// The cache is not thread-safe; wrap in a [`Mutex`] or [`RwLock`]
/// for concurrent access.
///
/// # Examples
///
/// ```
/// use my_crate::auth::{User, UserCache};
///
/// let mut cache = UserCache::new();
///
/// // Add users to cache
/// let user1 = User::new(1, "alice", "alice@example.com");
/// let user2 = User::new(2, "bob", "bob@example.com");
/// cache.insert(user1.clone());
/// cache.insert(user2);
///
/// // Fast lookup by ID
/// if let Some(user) = cache.get(1) {
///     println!("Found: {}", user.name());
/// }
/// ```
///
/// [`Mutex`]: std::sync::Mutex
/// [`RwLock`]: std::sync::RwLock
pub struct UserCache {
    // Internal storage - use regular comment for private fields
    cache: HashMap<u64, User>,
}

impl UserCache {
    /// Creates an empty user cache
    ///
    /// # Examples
    ///
    /// ```
    /// use my_crate::auth::UserCache;
    ///
    /// let cache = UserCache::new();
    /// assert_eq!(cache.len(), 0);
    /// ```
    pub fn new() -> Self {
        Self {
            cache: HashMap::new(),
        }
    }
    
    /// Creates a cache with a specified initial capacity
    ///
    /// Pre-allocating capacity can improve performance when you know
    /// approximately how many users will be cached.
    ///
    /// # Examples
    ///
    /// ```
    /// use my_crate::auth::UserCache;
    ///
    /// let cache = UserCache::with_capacity(1000);
    /// ```
    pub fn with_capacity(capacity: usize) -> Self {
        Self {
            cache: HashMap::with_capacity(capacity),
        }
    }

    /// Retrieves a user from the cache by ID
    ///
    /// Returns `None` if the user is not in the cache.
    ///
    /// # Examples
    ///
    /// ```
    /// use my_crate::auth::{User, UserCache};
    ///
    /// let mut cache = UserCache::new();
    /// let user = User::new(1, "alice", "alice@example.com");
    /// cache.insert(user);
    ///
    /// assert!(cache.get(1).is_some());
    /// assert!(cache.get(999).is_none());
    /// ```
    pub fn get(&self, id: u64) -> Option<&User> {
        self.cache.get(&id)
    }

    /// Inserts a user into the cache
    ///
    /// If a user with the same ID already exists, it is replaced
    /// and the old value is returned.
    ///
    /// # Examples
    ///
    /// ```
    /// use my_crate::auth::{User, UserCache};
    ///
    /// let mut cache = UserCache::new();
    /// let user = User::new(1, "alice", "alice@example.com");
    /// 
    /// assert!(cache.insert(user).is_none());
    /// 
    /// // Inserting again returns the old value
    /// let updated = User::new(1, "alice_updated", "alice@example.com");
    /// assert!(cache.insert(updated).is_some());
    /// ```
    pub fn insert(&mut self, user: User) -> Option<User> {
        self.cache.insert(user.id, user)
    }
    
    /// Removes a user from the cache by ID
    ///
    /// Returns the removed user if it was present.
    ///
    /// # Examples
    ///
    /// ```
    /// use my_crate::auth::{User, UserCache};
    ///
    /// let mut cache = UserCache::new();
    /// let user = User::new(1, "alice", "alice@example.com");
    /// cache.insert(user);
    ///
    /// assert!(cache.remove(1).is_some());
    /// assert!(cache.remove(1).is_none());
    /// ```
    pub fn remove(&mut self, id: u64) -> Option<User> {
        self.cache.remove(&id)
    }
    
    /// Returns the number of users in the cache
    ///
    /// # Examples
    ///
    /// ```
    /// use my_crate::auth::{User, UserCache};
    ///
    /// let mut cache = UserCache::new();
    /// assert_eq!(cache.len(), 0);
    ///
    /// cache.insert(User::new(1, "alice", "alice@example.com"));
    /// assert_eq!(cache.len(), 1);
    /// ```
    pub fn len(&self) -> usize {
        self.cache.len()
    }
    
    /// Returns `true` if the cache contains no users
    ///
    /// # Examples
    ///
    /// ```
    /// use my_crate::auth::UserCache;
    ///
    /// let cache = UserCache::new();
    /// assert!(cache.is_empty());
    /// ```
    pub fn is_empty(&self) -> bool {
        self.cache.is_empty()
    }
    
    /// Clears the cache, removing all users
    ///
    /// # Examples
    ///
    /// ```
    /// use my_crate::auth::{User, UserCache};
    ///
    /// let mut cache = UserCache::new();
    /// cache.insert(User::new(1, "alice", "alice@example.com"));
    /// 
    /// cache.clear();
    /// assert!(cache.is_empty());
    /// ```
    pub fn clear(&mut self) {
        self.cache.clear();
    }
}

// Implement Default trait for UserCache
impl Default for UserCache {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // Tests use regular comments since they're not public API
    
    #[test]
    fn test_user_creation() {
        let user = User::new(1, "test", "test@example.com");
        assert_eq!(user.id(), 1);
        assert_eq!(user.name(), "test");
    }

    #[test]
    #[should_panic(expected = "User ID must be non-zero")]
    fn test_user_zero_id_panics() {
        User::new(0, "test", "test@example.com");
    }

    #[test]
    fn test_email_validation() {
        assert!(validate_email("user@example.com"));
        assert!(!validate_email("invalid"));
        assert!(!validate_email("@example.com"));
    }

    #[test]
    fn test_cache_operations() {
        let mut cache = UserCache::new();
        let user = User::new(1, "alice", "alice@example.com");
        
        assert!(cache.is_empty());
        cache.insert(user.clone());
        assert_eq!(cache.len(), 1);
        assert!(cache.get(1).is_some());
        assert!(cache.remove(1).is_some());
        assert!(cache.is_empty());
    }
}
