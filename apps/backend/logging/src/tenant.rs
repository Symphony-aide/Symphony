//! Multi-tenant support with isolation

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, RwLock};

// ============================================================================
// Tenant Management
// ============================================================================

/// Tenant information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tenant {
    /// Tenant ID
    pub id: String,

    /// Tenant name
    pub name: String,

    /// Tenant configuration
    pub config: TenantConfig,

    /// Active status
    pub active: bool,

    /// Created timestamp
    pub created_at: String,
}

/// Tenant-specific configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TenantConfig {
    /// Log level for this tenant
    pub log_level: String,

    /// Maximum log retention days
    pub retention_days: u32,

    /// Storage quota in MB
    pub storage_quota_mb: u64,

    /// Rate limit (logs per second)
    pub rate_limit: u32,

    /// Allowed log sources
    pub allowed_sources: Vec<String>,

    /// Custom metadata
    pub metadata: HashMap<String, String>,
}

impl Tenant {
    /// Create a new tenant
    pub fn new(id: String, name: String) -> Self {
        Self {
            id,
            name,
            config: TenantConfig::default(),
            active: true,
            created_at: chrono::Utc::now().to_rfc3339(),
        }
    }

    /// Check if tenant is within rate limit
    pub fn check_rate_limit(&self, current_rate: u32) -> bool {
        current_rate < self.config.rate_limit
    }

    /// Check if tenant is within storage quota
    pub fn check_storage_quota(&self, current_usage_mb: u64) -> bool {
        current_usage_mb < self.config.storage_quota_mb
    }
}

impl Default for TenantConfig {
    fn default() -> Self {
        Self {
            log_level: "info".to_string(),
            retention_days: 30,
            storage_quota_mb: 1024, // 1GB
            rate_limit: 1000,       // 1000 logs/sec
            allowed_sources: vec!["*".to_string()],
            metadata: HashMap::new(),
        }
    }
}

// ============================================================================
// Tenant Manager
// ============================================================================

/// Tenant manager for multi-tenancy
pub struct TenantManager {
    /// Registered tenants
    tenants: Arc<RwLock<HashMap<String, Tenant>>>,

    /// Default tenant for non-tenant-specific logs
    default_tenant_id: String,
}

impl TenantManager {
    /// Create a new tenant manager
    pub fn new() -> Self {
        let manager = Self {
            tenants: Arc::new(RwLock::new(HashMap::new())),
            default_tenant_id: "default".to_string(),
        };

        // Create default tenant
        manager
            .register_tenant(Tenant::new(
                "default".to_string(),
                "Default Tenant".to_string(),
            ))
            .ok();

        manager
    }

    /// Register a new tenant
    pub fn register_tenant(&self, tenant: Tenant) -> Result<(), String> {
        let mut tenants = self
            .tenants
            .write()
            .map_err(|_| "Failed to acquire write lock".to_string())?;

        if tenants.contains_key(&tenant.id) {
            return Err(format!("Tenant {} already exists", tenant.id));
        }

        tenants.insert(tenant.id.clone(), tenant);
        Ok(())
    }

    /// Get tenant by ID
    pub fn get_tenant(&self, tenant_id: &str) -> Option<Tenant> {
        let tenants = self.tenants.read().ok()?;
        tenants.get(tenant_id).cloned()
    }

    /// Update tenant configuration
    pub fn update_tenant_config(
        &self,
        tenant_id: &str,
        config: TenantConfig,
    ) -> Result<(), String> {
        let mut tenants = self
            .tenants
            .write()
            .map_err(|_| "Failed to acquire write lock".to_string())?;

        if let Some(tenant) = tenants.get_mut(tenant_id) {
            tenant.config = config;
            Ok(())
        } else {
            Err(format!("Tenant {} not found", tenant_id))
        }
    }

    /// Deactivate tenant
    pub fn deactivate_tenant(&self, tenant_id: &str) -> Result<(), String> {
        let mut tenants = self
            .tenants
            .write()
            .map_err(|_| "Failed to acquire write lock".to_string())?;

        if let Some(tenant) = tenants.get_mut(tenant_id) {
            tenant.active = false;
            Ok(())
        } else {
            Err(format!("Tenant {} not found", tenant_id))
        }
    }

    /// List all tenants
    pub fn list_tenants(&self) -> Vec<Tenant> {
        let tenants = self.tenants.read().ok();
        tenants
            .map(|t| t.values().cloned().collect())
            .unwrap_or_default()
    }

    /// Get default tenant ID
    pub fn default_tenant_id(&self) -> &str {
        &self.default_tenant_id
    }

    /// Validate tenant access
    pub fn validate_access(&self, tenant_id: &str, source: &str) -> Result<(), String> {
        let tenant = self
            .get_tenant(tenant_id)
            .ok_or_else(|| format!("Tenant {} not found", tenant_id))?;

        if !tenant.active {
            return Err(format!("Tenant {} is not active", tenant_id));
        }

        // Check if source is allowed
        if !tenant.config.allowed_sources.contains(&"*".to_string())
            && !tenant.config.allowed_sources.contains(&source.to_string())
        {
            return Err(format!(
                "Source {} not allowed for tenant {}",
                source, tenant_id
            ));
        }

        Ok(())
    }
}

impl Default for TenantManager {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// Tenant Context
// ============================================================================

/// Tenant context for log entries
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TenantContext {
    /// Tenant ID
    pub tenant_id: String,

    /// Source identifier
    pub source: String,

    /// Additional tenant-specific metadata
    pub metadata: HashMap<String, String>,
}

impl TenantContext {
    /// Create a new tenant context
    pub fn new(tenant_id: String, source: String) -> Self {
        Self {
            tenant_id,
            source,
            metadata: HashMap::new(),
        }
    }

    /// Add metadata
    pub fn with_metadata(mut self, key: String, value: String) -> Self {
        self.metadata.insert(key, value);
        self
    }
}

// ============================================================================
// Tenant Isolation
// ============================================================================

/// Tenant isolation manager
pub struct TenantIsolation {
    /// Tenant manager
    manager: Arc<TenantManager>,

    /// Isolation level
    level: IsolationLevel,
}

#[derive(Debug, Clone, Copy)]
pub enum IsolationLevel {
    /// No isolation (all tenants share resources)
    None,

    /// Logical isolation (separate namespaces)
    Logical,

    /// Physical isolation (separate storage)
    Physical,
}

impl TenantIsolation {
    /// Create a new tenant isolation manager
    pub fn new(manager: Arc<TenantManager>, level: IsolationLevel) -> Self {
        Self { manager, level }
    }

    /// Get tenant manager reference
    pub fn manager(&self) -> &Arc<TenantManager> {
        &self.manager
    }

    /// Get storage path for tenant
    pub fn get_storage_path(&self, tenant_id: &str) -> String {
        match self.level {
            IsolationLevel::None => "logs/shared".to_string(),
            IsolationLevel::Logical => format!("logs/{}", tenant_id),
            IsolationLevel::Physical => format!("logs/tenants/{}/data", tenant_id),
        }
    }

    /// Check if tenant can access resource
    pub fn can_access(&self, tenant_id: &str, resource_tenant_id: &str) -> bool {
        match self.level {
            IsolationLevel::None => true,
            IsolationLevel::Logical | IsolationLevel::Physical => tenant_id == resource_tenant_id,
        }
    }

    /// Get isolation level
    pub fn level(&self) -> IsolationLevel {
        self.level
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tenant_creation() {
        let tenant = Tenant::new("tenant1".to_string(), "Test Tenant".to_string());
        assert_eq!(tenant.id, "tenant1");
        assert!(tenant.active);
    }

    #[test]
    fn test_tenant_manager() {
        let manager = TenantManager::new();

        let tenant = Tenant::new("tenant1".to_string(), "Test Tenant".to_string());
        assert!(manager.register_tenant(tenant).is_ok());

        assert!(manager.get_tenant("tenant1").is_some());
        assert!(manager.get_tenant("nonexistent").is_none());
    }

    #[test]
    fn test_tenant_validation() {
        let manager = TenantManager::new();

        let mut tenant = Tenant::new("tenant1".to_string(), "Test Tenant".to_string());
        tenant.config.allowed_sources = vec!["app1".to_string()];
        manager.register_tenant(tenant).ok();

        assert!(manager.validate_access("tenant1", "app1").is_ok());
        assert!(manager.validate_access("tenant1", "app2").is_err());
    }

    #[test]
    fn test_isolation_paths() {
        let manager = Arc::new(TenantManager::new());

        let isolation_logical = TenantIsolation::new(manager.clone(), IsolationLevel::Logical);
        assert_eq!(
            isolation_logical.get_storage_path("tenant1"),
            "logs/tenant1"
        );

        let isolation_physical = TenantIsolation::new(manager, IsolationLevel::Physical);
        assert_eq!(
            isolation_physical.get_storage_path("tenant1"),
            "logs/tenants/tenant1/data"
        );
    }
}
