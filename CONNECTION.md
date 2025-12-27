# Symphony Data Architecture: Rust-Python Connection

> **Architecture Decision**: Clean Architecture in Rust + Centralized Validation in Python
> **Date**: December 27, 2025
> **Status**: Architectural Foundation

---

## 🎯 Overview

Symphony implements a **two-layer data architecture** that separates concerns between Rust (orchestration & performance) and Python (validation & persistence). This design eliminates duplication while maintaining clean architectural boundaries.

**Core Principle**: Python API is the **single source of truth** for all validation, RBAC, and data persistence. Rust performs lightweight **pre-validation** to prevent unnecessary HTTP requests, then trusts Python's authoritative validation responses.

---

## 🏗️ Architecture Layers

### Layer 1: Rust Clean Architecture (Orchestration + Pre-validation)
**Purpose**: AI orchestration, workflow coordination, high-performance operations, efficient request filtering
**Responsibility**: Business logic execution, lightweight pre-validation to prevent HTTP waste

### Layer 2: Python API (Validation & Persistence)  
**Purpose**: Data validation, RBAC enforcement, database operations
**Responsibility**: All validation, authorization, and data consistency

---

## ⚡ Pre-validation Strategy (Efficiency Layer)

### Purpose: Prevent Unnecessary HTTP Requests

Rust performs **lightweight pre-validation** before making HTTP requests to Python API. This is purely for efficiency and user experience - not for business rule enforcement.

### Pre-validation Rules

1. **Fast-check Only**: Must complete in microseconds, not milliseconds
2. **No Business Logic**: Only technical/structural validation
3. **No Heavy Computation**: Simple checks (file exists, not empty, basic parsing)
4. **Replaceable**: Can be disabled or modified without affecting core architecture

### Pre-validation Flow Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐    ┌──────────────────┐
│   User Action   │───▶│  Rust Pre-check  │───▶│   HTTP Request      │───▶│  Python API      │
│                 │    │                  │    │   (if passed)       │    │                  │
│ • Create File   │    │ • File exists?   │    │                     │    │ • RBAC Check     │
│ • Save Data     │    │ • Not empty?     │    │ POST /workflows     │    │ • Business Rules │
│ • Install Ext   │    │ • Valid JSON?    │    │ POST /users         │    │ • Data Validation│
│ • Execute Flow  │    │ • Basic format?  │    │ POST /extensions    │    │ • Security Scan  │
└─────────────────┘    └──────────────────┘    └─────────────────────┘    └──────────────────┘
                                │                                                      │
                                ▼                                                      ▼
                       ┌──────────────────┐                              ┌──────────────────┐
                       │  Immediate Error │                              │   Authoritative  │
                       │                  │                              │    Response      │
                       │ • File not found │                              │                  │
                       │ • Empty file     │                              │ • Success + Data │
                       │ • Invalid JSON   │                              │ • Validation Err │
                       │ • Missing fields │                              │ • Permission Err │
                       └──────────────────┘                              └──────────────────┘
```

### Implementation Pattern

```rust
// sy-pre-validation/src/lib.rs
pub trait PreValidator<T> {
    type Error: std::error::Error;
    
    /// Fast technical validation - NO business logic
    fn should_attempt_request(&self, input: &T) -> Result<(), Self::Error>;
}

// Example: Workflow pre-validation
pub struct WorkflowPreValidator;

impl PreValidator<CreateWorkflowRequest> for WorkflowPreValidator {
    type Error = PreValidationError;
    
    fn should_attempt_request(&self, request: &CreateWorkflowRequest) -> Result<(), PreValidationError> {
        // 1. Basic field presence (NOT business validation)
        if request.spec.name.trim().is_empty() {
            return Err(PreValidationError::EmptyName);
        }
        
        if request.spec.steps.is_empty() {
            return Err(PreValidationError::EmptySteps);
        }
        
        // 2. Basic format validation (NOT content validation)
        if request.spec.name.len() > MAX_NAME_LENGTH {
            return Err(PreValidationError::NameTooLong);
        }
        
        if request.spec.steps.len() > MAX_STEPS_COUNT {
            return Err(PreValidationError::TooManySteps);
        }
        
        // 3. Basic JSON serialization check
        serde_json::to_string(request)
            .map_err(|_| PreValidationError::SerializationFailed)?;
        
        Ok(())
    }
}

// Example: Extension manifest pre-validation
pub struct ExtensionPreValidator;

impl PreValidator<PathBuf> for ExtensionPreValidator {
    type Error = PreValidationError;
    
    fn should_attempt_request(&self, manifest_path: &PathBuf) -> Result<(), PreValidationError> {
        // 1. File system checks
        if !manifest_path.exists() {
            return Err(PreValidationError::FileNotFound);
        }
        
        let metadata = std::fs::metadata(manifest_path)?;
        if metadata.len() == 0 {
            return Err(PreValidationError::EmptyFile);
        }
        
        if metadata.len() > MAX_MANIFEST_SIZE {
            return Err(PreValidationError::FileTooLarge);
        }
        
        // 2. Basic JSON structure
        let content = std::fs::read_to_string(manifest_path)?;
        serde_json::from_str::<serde_json::Value>(&content)
            .map_err(|_| PreValidationError::InvalidJson)?;
        
        Ok(())
    }
}

// Example: User data pre-validation
pub struct UserPreValidator;

impl PreValidator<CreateUserRequest> for UserPreValidator {
    type Error = PreValidationError;
    
    fn should_attempt_request(&self, request: &CreateUserRequest) -> Result<(), PreValidationError> {
        // 1. Basic field presence
        if request.email.trim().is_empty() {
            return Err(PreValidationError::EmptyEmail);
        }
        
        if request.name.trim().is_empty() {
            return Err(PreValidationError::EmptyName);
        }
        
        // 2. Basic format checks (NOT business validation)
        if request.email.len() > MAX_EMAIL_LENGTH {
            return Err(PreValidationError::EmailTooLong);
        }
        
        if !request.email.contains('@') {
            return Err(PreValidationError::InvalidEmailFormat);
        }
        
        Ok(())
    }
}
```

### What Pre-validation Does NOT Do

- ❌ Check user permissions or RBAC
- ❌ Validate business rules or constraints
- ❌ Perform database lookups or external calls
- ❌ Complex computations or AI processing
- ❌ Security scanning or threat detection
- ❌ Data consistency or referential integrity checks

### What Pre-validation DOES Do

- ✅ File existence and basic accessibility
- ✅ Empty/null input detection
- ✅ Basic format validation (JSON parsing, email contains @)
- ✅ Size limits (file too large, string too long)
- ✅ Required field presence (not business validation)
- ✅ Serialization compatibility

---

## 🔧 Rust Clean Architecture Design

### Core Abstractions (Stable - Never Change)

```rust
// sy-data-contracts/src/lib.rs
pub trait DataStore<T, ID> {
    async fn find_by_id(&self, id: ID) -> Result<Option<T>, DataError>;
    async fn save(&self, entity: T) -> Result<T, DataError>;
    async fn delete(&self, id: ID) -> Result<(), DataError>;
}

pub trait QueryableStore<T, Q> {
    async fn find_by_criteria(&self, query: Q) -> Result<Vec<T>, DataError>;
}

pub trait TransactionalStore {
    async fn execute_transaction<F, R>(&self, operation: F) -> Result<R, DataError>
    where F: FnOnce() -> Result<R, DataError>;
}
```

### Domain-Specific Contracts

```rust
// User domain contract
pub trait UserDataAccess: DataStore<User, UserId> {
    async fn find_by_email(&self, email: &str) -> Result<Option<User>, DataError>;
    async fn get_user_capabilities(&self, user_id: UserId) -> Result<UserCapabilities, DataError>;
}

// Workflow domain contract  
pub trait WorkflowDataAccess: DataStore<Workflow, WorkflowId> {
    async fn find_by_user(&self, user_id: UserId) -> Result<Vec<Workflow>, DataError>;
    async fn create_workflow(&self, request: CreateWorkflowRequest) -> Result<Workflow, DataError>;
}

// Project domain contract
pub trait ProjectDataAccess: DataStore<Project, ProjectId> {
    async fn find_by_owner(&self, owner_id: UserId) -> Result<Vec<Project>, DataError>;
    async fn get_project_constraints(&self, project_id: ProjectId) -> Result<ProjectConstraints, DataError>;
}
```

### Business Rules (Domain Logic Only)

```rust
// sy-business-rules/src/lib.rs
pub trait WorkflowBusinessRules {
    fn calculate_workflow_cost(&self, spec: &WorkflowSpec) -> WorkflowCost;
    fn estimate_execution_time(&self, spec: &WorkflowSpec) -> Duration;
    fn optimize_workflow_steps(&self, spec: &WorkflowSpec) -> OptimizedWorkflowSpec;
}

pub trait UserBusinessRules {
    fn calculate_user_permissions(&self, user: &User) -> UserPermissions;
    fn determine_user_tier(&self, user: &User) -> UserTier;
}

// NOTE: No validation rules here - Python handles all validation
```

### Use Cases (Application Logic)

```rust
// sy-use-cases/src/workflow_use_cases.rs
pub struct CreateWorkflowUseCase<D, R, P> 
where
    D: WorkflowDataAccess,
    R: WorkflowBusinessRules,
    P: PreValidator<CreateWorkflowRequest>,
{
    data_access: D,
    business_rules: R,
    pre_validator: P,
}

impl<D, R, P> CreateWorkflowUseCase<D, R, P> {
    pub async fn execute(&self, request: CreateWorkflowRequest) -> Result<Workflow, UseCaseError> {
        // 1. Pre-validation (fast technical checks)
        self.pre_validator.should_attempt_request(&request)
            .map_err(UseCaseError::PreValidationFailed)?;
        
        // 2. Apply business logic (calculations, optimizations)
        let optimized_spec = self.business_rules.optimize_workflow_steps(&request.spec);
        let estimated_cost = self.business_rules.calculate_workflow_cost(&optimized_spec);
        
        // 3. Delegate to Python API (handles complete validation + persistence)
        let enhanced_request = CreateWorkflowRequest {
            spec: optimized_spec,
            estimated_cost,
            ..request
        };
        
        self.data_access.create_workflow(enhanced_request).await
            .map_err(UseCaseError::from)
    }
}
```

### HTTP Adapters (Implementation Layer)

```rust
// sy-data-adapters/src/http_workflow_adapter.rs
pub struct HttpWorkflowDataAccess {
    client: ApiClient,
    pre_validator: WorkflowPreValidator,
}

impl WorkflowDataAccess for HttpWorkflowDataAccess {
    async fn create_workflow(&self, request: CreateWorkflowRequest) -> Result<Workflow, DataError> {
        // Optional: Additional pre-validation at adapter level
        self.pre_validator.should_attempt_request(&request)
            .map_err(|e| DataError::PreValidationFailed(e.to_string()))?;
        
        // Single HTTP call - Python handles complete validation
        self.client
            .post("/workflows", &request)
            .await
            .map_err(DataError::from)
    }
    
    async fn find_by_user(&self, user_id: UserId) -> Result<Vec<Workflow>, DataError> {
        // No pre-validation needed for simple queries
        self.client
            .get(&format!("/users/{}/workflows", user_id))
            .await
            .map_err(DataError::from)
    }
}

impl DataStore<Workflow, WorkflowId> for HttpWorkflowDataAccess {
    async fn find_by_id(&self, id: WorkflowId) -> Result<Option<Workflow>, DataError> {
        // No pre-validation needed for ID-based queries
        self.client
            .get(&format!("/workflows/{}", id))
            .await
            .map_err(DataError::from)
    }
    
    // NOTE: save() and delete() not implemented - use domain-specific methods
    async fn save(&self, _workflow: Workflow) -> Result<Workflow, DataError> {
        Err(DataError::OperationNotSupported("Use create_workflow() instead"))
    }
}
```

---

## 🐍 Python API Layer (Validation & Persistence)

### Complete Validation Responsibility

```python
# Python handles ALL validation types:
# 1. RBAC validation (authorization)
# 2. Business rule validation (domain correctness)  
# 3. Data constraint validation (referential integrity)
# 4. Input format validation (request structure)

@app.post("/workflows")
async def create_workflow(
    request: CreateWorkflowRequest,
    current_user: User = Depends(get_current_user)
):
    # 1. RBAC Validation
    if not rbac.can_user_create_workflow(current_user, request.project_id):
        raise HTTPException(403, "Insufficient permissions to create workflow")
    
    if not rbac.can_user_access_project(current_user, request.project_id):
        raise HTTPException(403, "No access to specified project")
    
    # 2. Business Rule Validation
    if not business_rules.validate_workflow_spec(request.spec):
        raise HTTPException(400, "Invalid workflow specification")
    
    if business_rules.exceeds_user_limits(current_user, request.spec):
        raise HTTPException(422, "Workflow exceeds user tier limits")
    
    # 3. Data Constraint Validation
    project = await db.get_project(request.project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    
    if not data_validator.is_workflow_compatible_with_project(request.spec, project):
        raise HTTPException(422, "Workflow incompatible with project configuration")
    
    # 4. Input Format Validation (handled by Pydantic automatically)
    
    # 5. Create and persist
    workflow = Workflow.create(
        spec=request.spec,
        user_id=current_user.id,
        project_id=request.project_id,
        estimated_cost=request.estimated_cost
    )
    
    await db.save(workflow)
    await audit_log.record_workflow_creation(current_user, workflow)
    
    return workflow
```

### RBAC Implementation

```python
# rbac/workflow_permissions.py
class WorkflowRBAC:
    def can_user_create_workflow(self, user: User, project_id: str) -> bool:
        # Role-based check
        if not user.has_role("developer"):
            return False
        
        # Resource-based check
        if not user.can_access_project(project_id):
            return False
        
        # Tier-based check
        if user.tier == "free" and user.workflow_count >= FREE_TIER_LIMIT:
            return False
        
        return True
    
    def can_user_execute_workflow(self, user: User, workflow_id: str) -> bool:
        workflow = db.get_workflow(workflow_id)
        if not workflow:
            return False
        
        # Owner can always execute
        if workflow.owner_id == user.id:
            return True
        
        # Project collaborators can execute if workflow is shared
        if workflow.is_shared and user.can_access_project(workflow.project_id):
            return True
        
        return False
```

### Business Rules Implementation

```python
# business_rules/workflow_rules.py
class WorkflowBusinessRules:
    def validate_workflow_spec(self, spec: WorkflowSpec) -> bool:
        # Structural validation
        if not spec.name or len(spec.name.strip()) == 0:
            return False
        
        if not spec.steps or len(spec.steps) == 0:
            return False
        
        # Complexity validation
        if len(spec.steps) > MAX_WORKFLOW_STEPS:
            return False
        
        # Step dependency validation
        if not self._validate_step_dependencies(spec.steps):
            return False
        
        return True
    
    def exceeds_user_limits(self, user: User, spec: WorkflowSpec) -> bool:
        if user.tier == "free":
            return (
                len(spec.steps) > FREE_TIER_MAX_STEPS or
                spec.estimated_duration > FREE_TIER_MAX_DURATION
            )
        
        if user.tier == "pro":
            return (
                len(spec.steps) > PRO_TIER_MAX_STEPS or
                spec.estimated_duration > PRO_TIER_MAX_DURATION
            )
        
        return False  # Enterprise tier has no limits
```

---

## 🔄 HTTP Communication Patterns

### Request/Response Flow

```
User Action → Rust Pre-validation → HTTP Request → Python API → Database
                     ↓                    ↓              ↓
            Fast Technical Check    Business Logic   Complete Validation
                     ↓                    ↓              ↓
            Immediate Feedback ←── Workflow Optimization ←── Validated Result
```

**Detailed Flow:**

```
┌─────────────────┐
│   User Action   │
│                 │
│ • Create Flow   │
│ • Install Ext   │
│ • Save Project  │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Rust Pre-check  │ ◄─── Fast (microseconds)
│                 │
│ • File exists?  │
│ • Not empty?    │
│ • Valid JSON/TOML?   │
│ • Basic format? │
└─────────┬───────┘
          │
          ▼ (if passed)
┌─────────────────┐
│ Business Logic  │ ◄─── Rust Domain Logic
│                 │
│ • Optimize      │
│ • Calculate     │
│ • Transform     │
│ • Enhance       │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│  HTTP Request   │ ◄─── Single Call
│                 │
│ POST /workflows │
│ POST /users     │
│ POST /projects  │
│ POST /extensions│
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   Python API    │ ◄─── Authoritative Validation
│                 │
│ • RBAC Check    │
│ • Business Rules│
│ • Data Validation│
│ • Security Scan │
│ • Persistence   │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│    Database     │
│                 │
│ • Save Data     │
│ • Update State  │
│ • Log Audit     │
│ • Return Result │
└─────────────────┘
```

### API Client Implementation

```rust
// sy-data-adapters/src/api_client.rs
pub struct ApiClient {
    client: reqwest::Client,
    base_url: String,
    timeout: Duration,
}

impl ApiClient {
    pub async fn post<B, T>(&self, endpoint: &str, body: &B) -> Result<T, ApiError>
    where
        B: Serialize,
        T: DeserializeOwned,
    {
        let url = format!("{}{}", self.base_url, endpoint);
        
        let response = self.client
            .post(&url)
            .json(body)
            .timeout(self.timeout)
            .send()
            .await?;
        
        match response.status() {
            StatusCode::OK | StatusCode::CREATED => {
                let result = response.json::<T>().await?;
                Ok(result)
            }
            StatusCode::BAD_REQUEST => {
                let error = response.json::<ValidationError>().await?;
                Err(ApiError::ValidationFailed(error))
            }
            StatusCode::FORBIDDEN => {
                let error = response.json::<AuthorizationError>().await?;
                Err(ApiError::AuthorizationFailed(error))
            }
            StatusCode::NOT_FOUND => {
                Err(ApiError::ResourceNotFound)
            }
            status => {
                let error_text = response.text().await.unwrap_or_default();
                Err(ApiError::ServerError { status, message: error_text })
            }
        }
    }
    
    pub async fn get<T>(&self, endpoint: &str) -> Result<T, ApiError>
    where T: DeserializeOwned
    {
        let url = format!("{}{}", self.base_url, endpoint);
        
        let response = self.client
            .get(&url)
            .timeout(self.timeout)
            .send()
            .await?;
        
        self.handle_response(response).await
    }
}
```

### Error Handling Strategy

```rust
// sy-data-adapters/src/error.rs
#[derive(Debug, thiserror::Error)]
pub enum ApiError {
    #[error("Pre-validation failed: {0}")]
    PreValidationFailed(String),
    
    #[error("Validation failed: {0}")]
    ValidationFailed(ValidationError),
    
    #[error("Authorization failed: {0}")]
    AuthorizationFailed(AuthorizationError),
    
    #[error("Resource not found")]
    ResourceNotFound,
    
    #[error("Server error ({status}): {message}")]
    ServerError { status: StatusCode, message: String },
    
    #[error("Network error: {0}")]
    NetworkError(#[from] reqwest::Error),
    
    #[error("Serialization error: {0}")]
    SerializationError(#[from] serde_json::Error),
}

impl From<ApiError> for DataError {
    fn from(api_error: ApiError) -> Self {
        match api_error {
            ApiError::PreValidationFailed(err) => DataError::PreValidationFailed(err),
            ApiError::ValidationFailed(err) => DataError::ValidationFailed(err.message),
            ApiError::AuthorizationFailed(err) => DataError::AuthorizationFailed(err.message),
            ApiError::ResourceNotFound => DataError::NotFound,
            ApiError::ServerError { message, .. } => DataError::ServerError(message),
            ApiError::NetworkError(err) => DataError::NetworkError(err.to_string()),
            ApiError::SerializationError(err) => DataError::SerializationError(err.to_string()),
        }
    }
}
```

---

## 🔧 Configuration & Dependency Injection

### Environment-Based Configuration

```rust
// sy-configuration/src/lib.rs
#[derive(Debug, Clone)]
pub enum DataSourceConfig {
    Http { 
        base_url: String, 
        timeout: Duration,
        retry_attempts: u32,
    },
    LocalDb { 
        database_url: String 
    },
    Mock,
}

impl DataSourceConfig {
    pub fn from_env() -> Self {
        match std::env::var("SYMPHONY_DATA_SOURCE").as_deref() {
            Ok("http") => Self::Http {
                base_url: std::env::var("PYTHON_API_URL")
                    .unwrap_or_else(|_| "http://localhost:8000".to_string()),
                timeout: Duration::from_secs(
                    std::env::var("API_TIMEOUT_SECONDS")
                        .unwrap_or_else(|_| "30".to_string())
                        .parse()
                        .unwrap_or(30)
                ),
                retry_attempts: 3,
            },
            Ok("local") => Self::LocalDb {
                database_url: std::env::var("DATABASE_URL")
                    .unwrap_or_else(|_| "sqlite:symphony.db".to_string()),
            },
            _ => Self::Mock,
        }
    }
}
```

### Service Assembly

```rust
// sy-configuration/src/factory.rs
pub struct DataAccessFactory;

impl DataAccessFactory {
    pub fn create_user_data_access(config: &DataSourceConfig) -> Box<dyn UserDataAccess> {
        match config {
            DataSourceConfig::Http { base_url, timeout, retry_attempts } => {
                let client = ApiClient::new(base_url.clone(), *timeout, *retry_attempts);
                Box::new(HttpUserDataAccess::new(client))
            }
            DataSourceConfig::LocalDb { database_url } => {
                // Future: Direct database access for optimization
                todo!("Local database access not yet implemented")
            }
            DataSourceConfig::Mock => {
                Box::new(MockUserDataAccess::new())
            }
        }
    }
    
    pub fn create_workflow_data_access(config: &DataSourceConfig) -> Box<dyn WorkflowDataAccess> {
        match config {
            DataSourceConfig::Http { base_url, timeout, retry_attempts } => {
                let client = ApiClient::new(base_url.clone(), *timeout, *retry_attempts);
                Box::new(HttpWorkflowDataAccess::new(client))
            }
            DataSourceConfig::LocalDb { database_url } => {
                todo!("Local database access not yet implemented")
            }
            DataSourceConfig::Mock => {
                Box::new(MockWorkflowDataAccess::new())
            }
        }
    }
}
```

---

## 🎭 Symphony Integration Examples

### AI Conductor Usage

```rust
// sy-conductor/src/workflow_conductor.rs
pub struct WorkflowConductor {
    create_workflow_use_case: CreateWorkflowUseCase<Box<dyn WorkflowDataAccess>, DefaultWorkflowBusinessRules>,
    user_data_access: Box<dyn UserDataAccess>,
}

impl WorkflowConductor {
    pub async fn process_user_request(&self, request: UserRequest) -> Result<ConductorResponse, ConductorError> {
        // 1. Get user capabilities (Python validates user exists)
        let user_capabilities = self.user_data_access
            .get_user_capabilities(request.user_id)
            .await?;
        
        // 2. Generate AI workflow suggestion
        let workflow_spec = self.ai_model
            .generate_workflow(request.prompt, user_capabilities)
            .await?;
        
        // 3. Create workflow (Python validates everything)
        let workflow = self.create_workflow_use_case
            .execute(CreateWorkflowRequest {
                spec: workflow_spec,
                user_id: request.user_id,
                project_id: request.project_id,
            })
            .await?;
        
        Ok(ConductorResponse::WorkflowCreated(workflow))
    }
}
```

### The Pit Integration

```rust
// sy-pit/src/pool_manager.rs
pub struct PoolManager {
    workflow_data_access: Box<dyn WorkflowDataAccess>,
}

impl PoolManager {
    pub async fn allocate_model_for_workflow(&self, workflow_id: WorkflowId) -> Result<ModelHandle, PoolError> {
        // Get workflow details (Python already validated it exists)
        let workflow = self.workflow_data_access
            .find_by_id(workflow_id)
            .await?
            .ok_or(PoolError::WorkflowNotFound)?;
        
        // Allocate model based on workflow requirements
        let model_spec = ModelSpec::from_workflow(&workflow);
        self.allocate_model(model_spec).await
    }
}
```

---

## 🚀 Benefits of This Architecture

### 1. **No Duplication + Efficient Filtering**
- **Single source of truth**: Python handles ALL meaningful validation
- **Clear boundaries**: Rust = orchestration + pre-filtering, Python = validation + persistence
- **No synchronization**: Business rules exist in one place only
- **Reduced HTTP waste**: Pre-validation prevents unnecessary network requests

### 2. **Clean Architecture Compliance**
- **Stable abstractions**: Core traits never change
- **Dependency inversion**: Rust depends on abstractions, not implementations
- **Open-closed principle**: Add new implementations without changing existing code

### 3. **Performance Optimized + User Experience**
- **Single HTTP calls**: No redundant validation requests
- **Efficient caching**: Python can cache at database/ORM level
- **Fast orchestration**: Rust focuses on coordination, not validation
- **Immediate feedback**: Pre-validation provides instant error messages for obvious problems

### 4. **Security by Design**
- **Centralized enforcement**: Impossible to bypass Python validation
- **Complete context**: Python sees full request context for RBAC
- **Audit trail**: All validation decisions logged in one place

### 5. **Maintainable & Scalable**
- **Independent evolution**: Change business rules without touching Rust
- **Team separation**: Rust team focuses on AI, Python team on data
- **Future-proof**: Easy to add local database, caching, or hybrid approaches

---

## 🔮 Future Enhancements

### Local Database Optimization
```rust
// Future: Direct database access for read-heavy operations
pub struct HybridWorkflowDataAccess {
    local_db: SqliteWorkflowDataAccess,    // Fast reads
    python_api: HttpWorkflowDataAccess,    // Validated writes
}

impl WorkflowDataAccess for HybridWorkflowDataAccess {
    async fn find_by_id(&self, id: WorkflowId) -> Result<Option<Workflow>, DataError> {
        // Fast local read
        self.local_db.find_by_id(id).await
    }
    
    async fn create_workflow(&self, request: CreateWorkflowRequest) -> Result<Workflow, DataError> {
        // Validated write through Python API
        let workflow = self.python_api.create_workflow(request).await?;
        
        // Sync to local database
        self.local_db.save(workflow.clone()).await?;
        
        Ok(workflow)
    }
}
```

### Caching Layer
```rust
// Future: Intelligent caching for frequently accessed data
pub struct CachedUserDataAccess<T: UserDataAccess> {
    inner: T,
    cache: Arc<RwLock<HashMap<UserId, (User, Instant)>>>,
    ttl: Duration,
}
```

---

## 🧪 Testing Strategy

### Philosophy: Mock-Based Contract & Format Testing

Symphony's Rust data layer testing focuses on **contract verification** and **format validation** using mock implementations. The Python API layer has its own testing strategy (outside our boundary) and is treated as an external service with defined contracts.

### Testing Scope & Boundaries

**What We Test (Rust Layer)**:
- ✅ **Contract Compliance**: Rust implementations follow trait contracts correctly
- ✅ **Format Validation**: Request/response serialization works as expected
- ✅ **Pre-validation Logic**: Fast technical checks work correctly
- ✅ **Business Logic**: Rust domain calculations and transformations
- ✅ **Error Handling**: Proper error propagation and conversion
- ✅ **Integration Contracts**: HTTP requests match expected Python API format

**What We DON'T Test (Python Boundary)**:
- ❌ **Python Business Rules**: RBAC, validation logic, database constraints
- ❌ **Python API Implementation**: Handled by Python team's test suite
- ❌ **Database Operations**: Python layer responsibility
- ❌ **Authentication/Authorization**: Python API handles all security

### Testing Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           RUST TESTING STRATEGY                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                         PRODUCTION CODE                                 │ │
│  │                                                                        │ │
│  │   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │ │
│  │   │  Use Cases      │  │ Business Rules  │  │ Pre-Validators  │      │ │
│  │   │                 │  │                 │  │                 │      │ │
│  │   └────────┬────────┘  └────────┬────────┘  └────────┬────────┘      │ │
│  │            │                    │                    │                │ │
│  │            └────────────────────┼────────────────────┘                │ │
│  │                                 │                                     │ │
│  └─────────────────────────────────┼─────────────────────────────────────┘ │
│                                    │                                       │
│  ┌─────────────────────────────────┼─────────────────────────────────────┐ │
│  │                    TRAIT INTERFACES (CONTRACTS)                        │ │
│  │                                 │                                      │ │
│  │   ┌─────────────┐  ┌───────────┴───────────┐  ┌─────────────┐        │ │
│  │   │UserDataAccess│  │  WorkflowDataAccess   │  │ProjectData- │        │ │
│  │   │             │  │                       │  │   Access    │        │ │
│  │   └──────┬──────┘  └───────────┬───────────┘  └──────┬──────┘        │ │
│  │          │                     │                     │                │ │
│  └──────────┼─────────────────────┼─────────────────────┼────────────────┘ │
│             │                     │                     │                  │
│  ┌──────────┼─────────────────────┼─────────────────────┼────────────────┐ │
│  │          │         TEST IMPLEMENTATIONS                                │ │
│  │          │                     │                     │                 │ │
│  │   ┌──────┴──────┐  ┌───────────┴───────────┐  ┌──────┴──────┐        │ │
│  │   │    MOCK     │  │      WIREMOCK         │  │   CONTRACT  │        │ │
│  │   │(Unit Tests) │  │ (Integration Tests)   │  │    TESTS    │        │ │
│  │   │             │  │                       │  │             │        │ │
│  │   └─────────────┘  └───────────────────────┘  └─────────────┘        │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Three-Layer Testing Approach

#### 1. **Unit Tests: Mock-Based Contract Testing**

**Purpose**: Verify Rust business logic and contract compliance without external dependencies.

```rust
// sy-data-adapters/src/mock_adapters.rs
pub struct MockUserDataAccess {
    users: Arc<RwLock<HashMap<UserId, User>>>,
    capabilities: Arc<RwLock<HashMap<UserId, UserCapabilities>>>,
    force_error: Option<DataError>,
}

impl MockUserDataAccess {
    pub fn new() -> Self {
        Self {
            users: Arc::new(RwLock::new(HashMap::new())),
            capabilities: Arc::new(RwLock::new(HashMap::new())),
            force_error: None,
        }
    }
    
    pub fn with_test_user(user: User, capabilities: UserCapabilities) -> Self {
        let mock = Self::new();
        mock.users.write().unwrap().insert(user.id.clone(), user);
        mock.capabilities.write().unwrap().insert(user.id.clone(), capabilities);
        mock
    }
    
    pub fn with_error(error: DataError) -> Self {
        Self {
            users: Arc::new(RwLock::new(HashMap::new())),
            capabilities: Arc::new(RwLock::new(HashMap::new())),
            force_error: Some(error),
        }
    }
}

impl UserDataAccess for MockUserDataAccess {
    async fn find_by_email(&self, email: &str) -> Result<Option<User>, DataError> {
        if let Some(error) = &self.force_error {
            return Err(error.clone());
        }
        
        let users = self.users.read().unwrap();
        Ok(users.values().find(|u| u.email == email).cloned())
    }
    
    async fn get_user_capabilities(&self, user_id: UserId) -> Result<UserCapabilities, DataError> {
        if let Some(error) = &self.force_error {
            return Err(error.clone());
        }
        
        let capabilities = self.capabilities.read().unwrap();
        capabilities.get(&user_id).cloned().ok_or(DataError::NotFound)
    }
}

// Unit test example
#[tokio::test]
async fn test_create_workflow_use_case_success() {
    // Arrange
    let mock_workflow_access = MockWorkflowDataAccess::new();
    let mock_user_access = MockUserDataAccess::with_test_user(
        User {
            id: UserId::new("user-123"),
            email: "test@example.com".to_string(),
            name: "Test User".to_string(),
            tier: UserTier::Pro,
        },
        UserCapabilities {
            can_create_workflows: true,
            max_workflow_steps: 100,
        }
    );
    
    let business_rules = DefaultWorkflowBusinessRules::new();
    let pre_validator = WorkflowPreValidator::new();
    
    let use_case = CreateWorkflowUseCase::new(
        mock_workflow_access,
        business_rules,
        pre_validator,
    );
    
    let request = CreateWorkflowRequest {
        spec: WorkflowSpec {
            name: "Test Workflow".to_string(),
            steps: vec![
                WorkflowStep::new("step1", "echo hello"),
                WorkflowStep::new("step2", "echo world"),
            ],
        },
        user_id: UserId::new("user-123"),
        project_id: ProjectId::new("project-456"),
    };
    
    // Act
    let result = use_case.execute(request).await;
    
    // Assert
    assert!(result.is_ok());
    let workflow = result.unwrap();
    assert_eq!(workflow.spec.name, "Test Workflow");
    assert_eq!(workflow.spec.steps.len(), 2);
}
```

#### 2. **Integration Tests: WireMock Contract Verification**

**Purpose**: Verify HTTP request/response format matches Python API expectations.

```rust
// sy-integration-tests/tests/api_contract_tests.rs
use wiremock::{MockServer, Mock, ResponseTemplate};
use wiremock::matchers::{method, path, body_json};

#[tokio::test]
async fn test_create_workflow_http_contract() {
    // Arrange - Start WireMock server
    let mock_server = MockServer::start().await;
    
    // Define expected contract (matches Python API specification)
    let expected_request = serde_json::json!({
        "spec": {
            "name": "Contract Test Workflow",
            "steps": [
                {"name": "step1", "command": "echo test"}
            ]
        },
        "user_id": "user-123",
        "project_id": "project-456",
        "estimated_cost": {
            "compute_units": 10,
            "estimated_duration_ms": 5000
        }
    });
    
    let expected_response = serde_json::json!({
        "id": "workflow-789",
        "spec": {
            "name": "Contract Test Workflow",
            "steps": [
                {"name": "step1", "command": "echo test"}
            ]
        },
        "user_id": "user-123",
        "project_id": "project-456",
        "created_at": "2025-12-27T10:00:00Z",
        "status": "created"
    });
    
    // Mock Python API response
    Mock::given(method("POST"))
        .and(path("/workflows"))
        .and(body_json(&expected_request))
        .respond_with(ResponseTemplate::new(201).set_body_json(&expected_response))
        .expect(1) // Verify exactly one call
        .mount(&mock_server)
        .await;
    
    // Configure HTTP adapter to use WireMock
    let config = DataSourceConfig::Http {
        base_url: mock_server.uri(),
        timeout: Duration::from_secs(5),
        retry_attempts: 1,
    };
    
    let workflow_access = DataAccessFactory::create_workflow_data_access(&config);
    
    // Act - Execute request
    let result = workflow_access.create_workflow(CreateWorkflowRequest {
        spec: WorkflowSpec {
            name: "Contract Test Workflow".to_string(),
            steps: vec![WorkflowStep::new("step1", "echo test")],
        },
        user_id: UserId::new("user-123"),
        project_id: ProjectId::new("project-456"),
        estimated_cost: WorkflowCost {
            compute_units: 10,
            estimated_duration_ms: 5000,
        },
    }).await;
    
    // Assert - Verify contract compliance
    assert!(result.is_ok());
    let workflow = result.unwrap();
    assert_eq!(workflow.id, WorkflowId::new("workflow-789"));
    assert_eq!(workflow.spec.name, "Contract Test Workflow");
    
    // WireMock automatically verifies the request format matched exactly
}

#[tokio::test]
async fn test_python_api_error_format_contract() {
    let mock_server = MockServer::start().await;
    
    // Test Python API error response format
    Mock::given(method("POST"))
        .and(path("/workflows"))
        .respond_with(ResponseTemplate::new(400).set_body_json(serde_json::json!({
            "error": "validation_failed",
            "message": "Workflow name already exists in project",
            "details": {
                "field": "spec.name",
                "code": "DUPLICATE_NAME"
            }
        })))
        .mount(&mock_server)
        .await;
    
    let config = DataSourceConfig::Http {
        base_url: mock_server.uri(),
        timeout: Duration::from_secs(5),
        retry_attempts: 1,
    };
    
    let workflow_access = DataAccessFactory::create_workflow_data_access(&config);
    
    let result = workflow_access.create_workflow(CreateWorkflowRequest {
        spec: WorkflowSpec {
            name: "Duplicate Workflow".to_string(),
            steps: vec![WorkflowStep::new("step1", "echo hello")],
        },
        user_id: UserId::new("user-123"),
        project_id: ProjectId::new("project-456"),
    }).await;
    
    // Verify error format matches expectations
    assert!(result.is_err());
    match result.unwrap_err() {
        DataError::ValidationFailed(msg) => {
            assert!(msg.contains("Workflow name already exists"));
        },
        other => panic!("Expected ValidationFailed, got {:?}", other),
    }
}
```

#### 3. **Pre-validation Tests: Fast Technical Validation**

**Purpose**: Verify pre-validation logic works correctly and performs within time limits.

```rust
// sy-data-adapters/tests/pre_validation_tests.rs
#[test]
fn test_workflow_pre_validation_success() {
    let validator = WorkflowPreValidator::new();
    
    let request = CreateWorkflowRequest {
        spec: WorkflowSpec {
            name: "Valid Workflow".to_string(),
            steps: vec![WorkflowStep::new("step1", "echo hello")],
        },
        user_id: UserId::new("user-123"),
        project_id: ProjectId::new("project-456"),
    };
    
    let result = validator.should_attempt_request(&request);
    assert!(result.is_ok());
}

#[test]
fn test_workflow_pre_validation_empty_name() {
    let validator = WorkflowPreValidator::new();
    
    let request = CreateWorkflowRequest {
        spec: WorkflowSpec {
            name: "".to_string(), // Empty name should fail
            steps: vec![WorkflowStep::new("step1", "echo hello")],
        },
        user_id: UserId::new("user-123"),
        project_id: ProjectId::new("project-456"),
    };
    
    let result = validator.should_attempt_request(&request);
    assert!(result.is_err());
    assert!(matches!(result.unwrap_err(), PreValidationError::EmptyName));
}

#[test]
fn test_pre_validation_performance_requirement() {
    let validator = WorkflowPreValidator::new();
    
    let request = CreateWorkflowRequest {
        spec: WorkflowSpec {
            name: "Performance Test Workflow".to_string(),
            steps: vec![WorkflowStep::new("step1", "echo hello")],
        },
        user_id: UserId::new("user-123"),
        project_id: ProjectId::new("project-456"),
    };
    
    // Measure performance - must be <1ms
    let start = std::time::Instant::now();
    let result = validator.should_attempt_request(&request);
    let duration = start.elapsed();
    
    assert!(result.is_ok());
    assert!(duration < std::time::Duration::from_millis(1), 
           "Pre-validation took {:?}, should be <1ms", duration);
}

#[test]
fn test_extension_manifest_pre_validation() {
    let validator = ExtensionPreValidator::new();
    
    // Create temporary test file
    let temp_dir = tempfile::tempdir().unwrap();
    let manifest_path = temp_dir.path().join("manifest.json");
    
    std::fs::write(&manifest_path, r#"{
        "name": "test-extension",
        "version": "1.0.0",
        "type": "instrument"
    }"#).unwrap();
    
    let result = validator.should_attempt_request(&manifest_path);
    assert!(result.is_ok());
}

#[test]
fn test_extension_manifest_pre_validation_file_not_found() {
    let validator = ExtensionPreValidator::new();
    
    let non_existent_path = PathBuf::from("/non/existent/manifest.json");
    
    let result = validator.should_attempt_request(&non_existent_path);
    assert!(result.is_err());
    assert!(matches!(result.unwrap_err(), PreValidationError::FileNotFound));
}
```

### Environment-Based Test Configuration

```rust
// sy-configuration/src/test_config.rs
impl DataSourceConfig {
    pub fn for_testing() -> Self {
        match std::env::var("SYMPHONY_TEST_MODE").as_deref() {
            Ok("mock") => Self::Mock,
            Ok("wiremock") => Self::Http {
                base_url: "http://localhost:8080".to_string(), // WireMock server
                timeout: Duration::from_secs(5),
                retry_attempts: 1,
            },
            Ok("integration") => Self::Http {
                base_url: std::env::var("TEST_PYTHON_API_URL")
                    .unwrap_or_else(|_| "http://localhost:8000".to_string()),
                timeout: Duration::from_secs(10),
                retry_attempts: 1,
            },
            _ => Self::Mock, // Default for unit tests
        }
    }
}
```

### Test Organization & Execution

```
sy-data-layer/
├── sy-use-cases/
│   └── tests/
│       ├── workflow_use_cases_test.rs    # Business logic tests with mocks
│       ├── user_use_cases_test.rs        # User domain business logic
│       └── project_use_cases_test.rs     # Project domain business logic
├── sy-data-adapters/
│   └── tests/
│       ├── http_adapter_tests.rs         # HTTP adapter unit tests
│       ├── mock_adapter_tests.rs         # Mock implementation tests
│       └── pre_validation_tests.rs       # Pre-validation performance & logic
└── sy-integration-tests/
    └── tests/
        ├── api_contract_tests.rs          # WireMock contract verification
        ├── error_handling_tests.rs        # Error format contract tests
        └── serialization_tests.rs         # Request/response format tests
```

### Running Tests

```bash
# Unit tests (fast, mock-based)
SYMPHONY_TEST_MODE=mock cargo test

# Integration tests (WireMock contract verification)
SYMPHONY_TEST_MODE=wiremock cargo test --features integration-tests

# Contract tests (verify API compatibility)
SYMPHONY_TEST_MODE=wiremock cargo test api_contract_tests --features integration-tests

# Performance tests (pre-validation benchmarks)
cargo test pre_validation_performance --release

# Full test suite
cargo test --all-features
```

### Test Quality Assurance

**Reliability Measures**:
- ✅ **Deterministic**: All tests use controlled mock data or WireMock responses
- ✅ **Isolated**: Each test gets fresh mock instances, no shared state
- ✅ **Fast**: Unit tests complete in <100ms, integration tests in <5s
- ✅ **Consistent**: Same inputs always produce same outputs

**Coverage Requirements**:
- ✅ **Business Logic**: 90%+ coverage for use cases and business rules
- ✅ **Pre-validation**: 100% coverage for all validation paths
- ✅ **Error Handling**: All error types and conversion paths tested
- ✅ **Contract Compliance**: All HTTP endpoints and formats verified

**Python API Boundary**:
- ✅ **Clear Separation**: We test request format, not Python business logic
- ✅ **Contract Focus**: Verify our requests match Python API expectations
- ✅ **Error Format**: Test error response parsing, not error generation logic
- ✅ **No Duplication**: Don't test what Python team already tests

### Benefits of This Testing Strategy

1. **Fast Feedback**: Unit tests with mocks provide immediate feedback
2. **Contract Safety**: WireMock ensures HTTP format compatibility
3. **Clear Boundaries**: We test Rust logic, Python team tests Python logic
4. **Reliable**: Deterministic tests with no external dependencies
5. **Maintainable**: Simple mock implementations, easy to update
6. **Performance Focused**: Pre-validation tests ensure <1ms requirement

This testing approach ensures Symphony's Rust data layer is reliable, maintainable, and properly integrated with the Python API while respecting clear architectural boundaries.

---

## 📋 Implementation Checklist

### Phase 1: Core Abstractions
- [ ] Define stable trait interfaces (`DataStore`, `UserDataAccess`, etc.)
- [ ] Implement error types and conversion (including pre-validation errors)
- [ ] Create configuration system
- [ ] Build dependency injection factory
- [ ] Design pre-validation trait and common implementations

### Phase 2: Pre-validation Layer
- [ ] Implement `PreValidator` trait for all domains
- [ ] Create domain-specific pre-validators (User, Workflow, Extension, Project)
- [ ] Add pre-validation error types and handling
- [ ] Build performance benchmarks for pre-validation (must be <1ms)
- [ ] Create configuration to enable/disable pre-validation

### Phase 3: HTTP Integration
- [ ] Implement `ApiClient` with proper error handling
- [ ] Create HTTP adapters for each domain (with pre-validation integration)
- [ ] Add retry logic and timeout handling
- [ ] Implement comprehensive logging (including pre-validation metrics)

### Phase 4: Python API
- [ ] Build complete validation pipeline
- [ ] Implement RBAC system
- [ ] Add business rule validation
- [ ] Create audit logging

### Phase 5: Use Cases
- [ ] Implement domain-specific use cases (with pre-validation integration)
- [ ] Add business rule services
- [ ] Create service assembly logic
- [ ] Build integration tests (including pre-validation scenarios)

### Phase 6: Symphony Integration
- [ ] Integrate with AI Conductor
- [ ] Connect to The Pit components
- [ ] Add performance monitoring (pre-validation + HTTP metrics)
- [ ] Implement production configuration

---

**This architecture provides Symphony with a robust, scalable, and maintainable data layer that separates concerns appropriately while eliminating duplication and maintaining clean architectural boundaries. The pre-validation layer adds efficiency and improved user experience without compromising the core principle of centralized validation in Python.**