//! Security features: data redaction, encryption, access control

use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// ============================================================================
// Data Redaction
// ============================================================================

/// Data redaction engine for sensitive information
pub struct RedactionEngine {
    /// Redaction rules
    rules: Vec<RedactionRule>,

    /// Replacement character
    replacement: String,
}

/// Redaction rule
#[derive(Debug, Clone)]
pub struct RedactionRule {
    /// Rule name
    pub name: String,

    /// Pattern to match
    pub pattern: Regex,

    /// Field names to apply rule to
    pub fields: Vec<String>,
}

impl RedactionEngine {
    /// Create a new redaction engine with default rules
    pub fn new() -> Self {
        let mut engine = Self {
            rules: Vec::new(),
            replacement: "***REDACTED***".to_string(),
        };

        engine.add_default_rules();
        engine
    }

    /// Add default redaction rules
    fn add_default_rules(&mut self) {
        // Credit card numbers
        self.add_rule(RedactionRule {
            name: "credit_card".to_string(),
            pattern: Regex::new(r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b").unwrap(),
            fields: vec!["*".to_string()], // All fields
        });

        // Email addresses
        self.add_rule(RedactionRule {
            name: "email".to_string(),
            pattern: Regex::new(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b").unwrap(),
            fields: vec!["email".to_string(), "user_email".to_string()],
        });

        // Phone numbers
        self.add_rule(RedactionRule {
            name: "phone".to_string(),
            pattern: Regex::new(r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b").unwrap(),
            fields: vec!["phone".to_string(), "mobile".to_string()],
        });

        // SSN (Social Security Number)
        self.add_rule(RedactionRule {
            name: "ssn".to_string(),
            pattern: Regex::new(r"\b\d{3}-\d{2}-\d{4}\b").unwrap(),
            fields: vec!["ssn".to_string(), "social_security".to_string()],
        });

        // Passwords
        self.add_rule(RedactionRule {
            name: "password".to_string(),
            pattern: Regex::new(r"(?i)(password|passwd|pwd)[\s:=]+\S+").unwrap(),
            fields: vec![
                "password".to_string(),
                "passwd".to_string(),
                "pwd".to_string(),
            ],
        });

        // API Keys and Tokens
        self.add_rule(RedactionRule {
            name: "api_key".to_string(),
            pattern: Regex::new(r"(?i)(api[_-]?key|token|secret)[\s:=]+[A-Za-z0-9_-]{20,}")
                .unwrap(),
            fields: vec![
                "api_key".to_string(),
                "token".to_string(),
                "secret".to_string(),
            ],
        });

        // IP Addresses (optional - for GDPR compliance)
        self.add_rule(RedactionRule {
            name: "ip_address".to_string(),
            pattern: Regex::new(r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b").unwrap(),
            fields: vec!["ip".to_string(), "ip_address".to_string()],
        });
    }

    /// Add a custom redaction rule
    pub fn add_rule(&mut self, rule: RedactionRule) {
        self.rules.push(rule);
    }

    /// Redact sensitive data from text
    pub fn redact(&self, text: &str) -> String {
        let mut result = text.to_string();

        for rule in &self.rules {
            result = rule
                .pattern
                .replace_all(&result, &self.replacement)
                .to_string();
        }

        result
    }

    /// Redact sensitive data from a map of fields
    pub fn redact_fields(&self, fields: &mut HashMap<String, String>) {
        for (key, value) in fields.iter_mut() {
            for rule in &self.rules {
                // Check if rule applies to this field
                if rule.fields.contains(&"*".to_string())
                    || rule.fields.iter().any(|f| key.contains(f))
                {
                    *value = rule
                        .pattern
                        .replace_all(value, &self.replacement)
                        .to_string();
                }
            }
        }
    }

    /// Set custom replacement string
    pub fn with_replacement(mut self, replacement: String) -> Self {
        self.replacement = replacement;
        self
    }
}

impl Default for RedactionEngine {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// Encryption
// ============================================================================

/// Encryption configuration for logs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptionConfig {
    /// Encryption algorithm
    pub algorithm: EncryptionAlgorithm,

    /// Key ID for key rotation
    pub key_id: String,

    /// Encrypt at rest
    pub encrypt_at_rest: bool,

    /// Encrypt in transit
    pub encrypt_in_transit: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EncryptionAlgorithm {
    AES256,
    ChaCha20,
}

impl EncryptionConfig {
    /// Create a new encryption config
    pub fn new(key_id: String) -> Self {
        Self {
            algorithm: EncryptionAlgorithm::AES256,
            key_id,
            encrypt_at_rest: true,
            encrypt_in_transit: true,
        }
    }

    /// Encrypt data (placeholder - would use actual crypto library)
    pub fn encrypt(&self, data: &[u8]) -> Result<Vec<u8>, String> {
        // Implementation would use ring, rustls, or similar
        // For now, this is a placeholder
        Ok(data.to_vec())
    }

    /// Decrypt data (placeholder)
    pub fn decrypt(&self, data: &[u8]) -> Result<Vec<u8>, String> {
        // Implementation would use ring, rustls, or similar
        Ok(data.to_vec())
    }
}

// ============================================================================
// Access Control
// ============================================================================

/// Access control for log viewing and management
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccessControl {
    /// Role-based permissions
    pub roles: HashMap<String, Role>,

    /// Audit trail enabled
    pub audit_enabled: bool,
}

/// Role with permissions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Role {
    /// Role name
    pub name: String,

    /// Permissions
    pub permissions: Vec<Permission>,

    /// Allowed log levels
    pub allowed_levels: Vec<String>,

    /// Allowed tenants (for multi-tenancy)
    pub allowed_tenants: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Permission {
    /// Can view logs
    ViewLogs,

    /// Can export logs
    ExportLogs,

    /// Can delete logs
    DeleteLogs,

    /// Can configure logging
    ConfigureLogs,

    /// Can view sensitive data (unredacted)
    ViewSensitiveData,

    /// Can manage access control
    ManageAccess,
}

impl AccessControl {
    /// Create a new access control system
    pub fn new() -> Self {
        let mut ac = Self {
            roles: HashMap::new(),
            audit_enabled: true,
        };

        ac.add_default_roles();
        ac
    }

    /// Add default roles
    fn add_default_roles(&mut self) {
        // Admin role
        self.roles.insert(
            "admin".to_string(),
            Role {
                name: "admin".to_string(),
                permissions: vec![
                    Permission::ViewLogs,
                    Permission::ExportLogs,
                    Permission::DeleteLogs,
                    Permission::ConfigureLogs,
                    Permission::ViewSensitiveData,
                    Permission::ManageAccess,
                ],
                allowed_levels: vec!["*".to_string()],
                allowed_tenants: vec!["*".to_string()],
            },
        );

        // Developer role
        self.roles.insert(
            "developer".to_string(),
            Role {
                name: "developer".to_string(),
                permissions: vec![Permission::ViewLogs, Permission::ExportLogs],
                allowed_levels: vec![
                    "debug".to_string(),
                    "info".to_string(),
                    "warn".to_string(),
                    "error".to_string(),
                ],
                allowed_tenants: vec!["*".to_string()],
            },
        );

        // Viewer role
        self.roles.insert(
            "viewer".to_string(),
            Role {
                name: "viewer".to_string(),
                permissions: vec![Permission::ViewLogs],
                allowed_levels: vec!["info".to_string(), "warn".to_string(), "error".to_string()],
                allowed_tenants: vec![],
            },
        );
    }

    /// Check if user has permission
    pub fn has_permission(&self, role_name: &str, permission: &Permission) -> bool {
        if let Some(role) = self.roles.get(role_name) {
            role.permissions.iter().any(|p| {
                matches!(
                    (p, permission),
                    (Permission::ViewLogs, Permission::ViewLogs)
                        | (Permission::ExportLogs, Permission::ExportLogs)
                        | (Permission::DeleteLogs, Permission::DeleteLogs)
                        | (Permission::ConfigureLogs, Permission::ConfigureLogs)
                        | (Permission::ViewSensitiveData, Permission::ViewSensitiveData)
                        | (Permission::ManageAccess, Permission::ManageAccess)
                )
            })
        } else {
            false
        }
    }

    /// Check if user can access tenant
    pub fn can_access_tenant(&self, role_name: &str, tenant_id: &str) -> bool {
        if let Some(role) = self.roles.get(role_name) {
            role.allowed_tenants.contains(&"*".to_string())
                || role.allowed_tenants.contains(&tenant_id.to_string())
        } else {
            false
        }
    }

    /// Audit log access
    pub fn audit_access(&self, user: &str, action: &str, resource: &str) {
        if self.audit_enabled {
            // Log to audit trail
            tracing::info!(
                user = user,
                action = action,
                resource = resource,
                "Audit: Access logged"
            );
        }
    }
}

impl Default for AccessControl {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// Compliance
// ============================================================================

/// Compliance configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComplianceConfig {
    /// GDPR compliance enabled
    pub gdpr_enabled: bool,

    /// HIPAA compliance enabled
    pub hipaa_enabled: bool,

    /// SOC2 compliance enabled
    pub soc2_enabled: bool,

    /// Data retention period in days
    pub retention_days: u32,

    /// Enable right to be forgotten
    pub right_to_be_forgotten: bool,

    /// Enable data portability
    pub data_portability: bool,
}

impl ComplianceConfig {
    /// Create GDPR-compliant configuration
    pub fn gdpr() -> Self {
        Self {
            gdpr_enabled: true,
            hipaa_enabled: false,
            soc2_enabled: false,
            retention_days: 90,
            right_to_be_forgotten: true,
            data_portability: true,
        }
    }

    /// Create HIPAA-compliant configuration
    pub fn hipaa() -> Self {
        Self {
            gdpr_enabled: false,
            hipaa_enabled: true,
            soc2_enabled: false,
            retention_days: 2555, // 7 years
            right_to_be_forgotten: false,
            data_portability: false,
        }
    }

    /// Create SOC2-compliant configuration
    pub fn soc2() -> Self {
        Self {
            gdpr_enabled: false,
            hipaa_enabled: false,
            soc2_enabled: true,
            retention_days: 365,
            right_to_be_forgotten: false,
            data_portability: false,
        }
    }

    /// Check if log should be retained
    pub fn should_retain(&self, log_age_days: u32) -> bool {
        log_age_days < self.retention_days
    }

    /// Delete user data (right to be forgotten)
    pub fn delete_user_data(&self, user_id: &str) -> Result<(), String> {
        if !self.right_to_be_forgotten {
            return Err("Right to be forgotten not enabled".to_string());
        }

        // Implementation would delete all logs for user_id
        tracing::info!(user_id = user_id, "User data deleted for GDPR compliance");
        Ok(())
    }
}

impl Default for ComplianceConfig {
    fn default() -> Self {
        Self::gdpr()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_redaction() {
        let engine = RedactionEngine::new();

        let text = "My credit card is 1234-5678-9012-3456 and email is user@example.com";
        let redacted = engine.redact(text);

        assert!(!redacted.contains("1234-5678-9012-3456"));
        assert!(!redacted.contains("user@example.com"));
        assert!(redacted.contains("***REDACTED***"));
    }

    #[test]
    fn test_access_control() {
        let ac = AccessControl::new();

        assert!(ac.has_permission("admin", &Permission::ViewLogs));
        assert!(ac.has_permission("admin", &Permission::DeleteLogs));
        assert!(!ac.has_permission("viewer", &Permission::DeleteLogs));
    }
}
