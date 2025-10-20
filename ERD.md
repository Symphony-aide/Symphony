# Symphony Entity Relationship Diagram (ERD)

> **Purpose**: This document defines the data model and relationships for Symphony IDE, covering both the editor runtime and the official website/marketplace.

## Legend
- **(S)** = Singleton entity (one instance per system)
- **(W)** = Weak entity (depends on another entity)
- **PK** = Primary Key
- **FK** = Foreign Key

---

## 1. Editor Core: User Interaction & Orchestration

**Description**: This diagram shows how users interact with Symphony's core editor features, including project management, AI orchestration via the Conductor, and the extension ecosystem managed by Orchestra Kit.

```mermaid
%%{init: {
  'theme':'base',
  'themeVariables': {
    'primaryColor':'#f8f9fa',
    'primaryTextColor':'#212529',
    'primaryBorderColor':'#4a90e2',
    'lineColor':'#4a90e2',
    'secondaryColor':'#ffffff',
    'tertiaryColor':'#e8f4f8',
    'background':'#ffffff',
    'mainBkg':'#ffffff',
    'secondBkg':'#f0f7ff',
    'border1':'#4a90e2',
    'border2':'#6fa8dc',
    'fontSize':'13px',
    'fontFamily':'Inter, -apple-system, system-ui, sans-serif'
  }
}}%%
erDiagram
    USER ||--o{ PROJECT : owns
    USER {
        string id PK "Unique user identifier"
        string name "User display name"
        string email "User email address"
        json preferences "Editor preferences and settings"
        datetime created_at "Account creation timestamp"
    }
    
    USER ||--o{ PROMPT : creates
    PROMPT {
        string id PK "Unique prompt identifier"
        string user_id FK "References USER.id"
        string content "Natural language prompt text"
        string context "Project/file context for prompt"
        datetime created_at "Prompt submission timestamp"
    }
    
    PROMPT }|--|| CONDUCTOR : processes
    CONDUCTOR {
        string id PK "Conductor instance ID (singleton per session)"
        json rl_model_state "Reinforcement learning model state"
        json orchestration_strategies "Active orchestration strategies"
        json performance_metrics "Conductor performance metrics"
        json training_data "Training data for RL model"
        json event_router_config "Event routing configuration"
    }
    
    CONDUCTOR ||--o{ MELODY : "generates/uses"
    MELODY {
        string id PK "Unique melody (workflow) identifier"
        string conductor_id FK "References CONDUCTOR.id"
        string project_id FK "References PROJECT.id"
        string name "Melody display name"
        json definition "DAG workflow definition"
        enum creation_source "user_created|conductor_generated"
        json execution_history "Past execution results and metrics"
        datetime created_at "Melody creation timestamp"
    }
    
    PROJECT ||--o{ MELODY : contains
    PROJECT {
        string id PK "Unique project identifier"
        string user_id FK "References USER.id (project owner)"
        string name "Project display name"
        json configuration "Project-specific settings and config"
        datetime created_at "Project creation timestamp"
    }
    
    CONDUCTOR ||--o{ TASK : "dispatches"
    TASK {
        string id PK "Unique task identifier"
        string conductor_id FK "References CONDUCTOR.id"
        string extension_id FK "References EXTENSION.id (target extension)"
        string melody_id FK "References MELODY.id (parent workflow)"
        string task_type "extension_activation|resource_allocation|artifact_processing"
        json task_payload "Task input data and parameters"
        enum task_status "pending|dispatched|executing|completed|failed"
        json execution_context "Runtime context and metadata"
        datetime created_at "Task creation timestamp"
        datetime dispatched_at "Task dispatch timestamp"
        datetime completed_at "Task completion timestamp"
    }
    
    TASK }|--|| ORCHESTRA_KIT : "routes to"
    ORCHESTRA_KIT {
        string id PK "Orchestra Kit instance ID (singleton)"
        string version "Orchestra Kit version (semver)"
        json configuration "Global extension system config"
        json extension_registry "Registry of installed extensions"
        json security_context "Security policies and permissions"
        json performance_state "Resource usage and performance metrics"
        json task_queue "Pending task queue"
    }
    
    ORCHESTRA_KIT ||--o{ EXTENSION : manages
    EXTENSION {
        string id PK "Unique extension identifier"
        string orchestra_kit_id FK "References ORCHESTRA_KIT.id"
        json manifest "Extension manifest (Symphony.toml)"
        json capabilities "Required capabilities/permissions"
        enum extension_type "instrument|operator|motif"
        enum lifecycle_state "installed|loaded|activated|running|paused|error"
        datetime installed_at "Extension installation timestamp"
    }
    
    EXTENSION }|--|| INSTRUMENT : "is a"
    EXTENSION }|--|| OPERATOR : "is a" 
    EXTENSION }|--|| MOTIF : "is a"
    
    INSTRUMENT {
        string extension_id PK,FK "References EXTENSION.id"
        string model_type "AI model type (llm|vision|audio|etc)"
        json model_configuration "Model-specific configuration"
        json performance_metrics "Inference latency, throughput, etc"
    }
    
    OPERATOR {
        string extension_id PK,FK "References EXTENSION.id"
        string operator_type "Operator category (file|git|data|etc)"
        json input_schema "Expected input data schema"
        json output_schema "Output data schema"
    }
    
    MOTIF {
        string extension_id PK,FK "References EXTENSION.id"
        json ui_components "Custom UI components definition"
        json theme_integration "Theme and styling integration"
    }
    
    TASK ||--o{ EVENT : "generates"
    EVENT {
        string id PK "Unique event identifier"
        string task_id FK "References TASK.id"
        string extension_id FK "References EXTENSION.id (event source)"
        string event_type "task_started|artifact_produced|error_occurred|resource_allocated"
        json event_payload "Event-specific data"
        json event_context "Event context and metadata"
        datetime occurred_at "Event occurrence timestamp"
    }
    
    EVENT }|--o{ ARTIFACT : "produces"
    ARTIFACT {
        string id PK "Unique artifact identifier"
        string event_id FK "References EVENT.id (producing event)"
        string extension_id FK "References EXTENSION.id (creator)"
        string melody_id FK "References MELODY.id (parent workflow)"
        string artifact_type "code|documentation|test|config|etc"
        string content_hash "Content-addressable hash (SHA-256)"
        json metadata "Artifact metadata and tags"
        json quality_metrics "Quality scores and metrics"
        datetime created_at "Artifact creation timestamp"
    }
    
    %% THE PIT: In-process high-performance operations
    TASK ||--o{ PIT_OPERATION : "triggers"
    PIT_OPERATION {
        string id PK "Unique Pit operation identifier"
        string task_id FK "References TASK.id"
        string operation_type "pool_allocation|dag_tracking|artifact_storage|arbitration|stale_management"
        json operation_context "Operation-specific context"
        json resource_allocations "Allocated resources (memory, CPU, GPU)"
        datetime performed_at "Operation execution timestamp"
    }
    
    ARTIFACT }|--o{ PIT_OPERATION : "managed via"

    CONDUCTOR ||--o{ PIPELINE_ORCHESTRATION : "coordinates"
    PIPELINE_ORCHESTRATION {
        string id PK "Unique orchestration identifier"
        string conductor_id FK "References CONDUCTOR.id"
        string melody_id FK "References MELODY.id"
        json task_dag "Directed Acyclic Graph of tasks"
        json execution_sequence "Topologically sorted execution order"
        enum orchestration_type "maestro_rl|manual"
    }
```

**Key Relationships**:
- **USER → PROJECT**: One user can own multiple projects
- **USER → PROMPT**: Users create natural language prompts
- **PROMPT → CONDUCTOR**: Conductor processes prompts and orchestrates tasks
- **CONDUCTOR → MELODY**: Conductor generates or uses melodies (workflows)
- **CONDUCTOR → TASK**: Conductor dispatches tasks to extensions
- **ORCHESTRA_KIT → EXTENSION**: Orchestra Kit manages all extensions
- **EXTENSION → {INSTRUMENT, OPERATOR, MOTIF}**: Extensions are specialized into three types
- **TASK → EVENT**: Tasks generate events during execution
- **EVENT → ARTIFACT**: Events produce artifacts (code, docs, etc.)
- **TASK → PIT_OPERATION**: Tasks trigger high-performance Pit operations

---

## 2. Website & Marketplace: User Accounts & Extension Discovery

**Description**: This diagram models the Symphony website, including user accounts, subscriptions, the extension marketplace (Orchestra Kit/Grand Stage), the melody store (Polyphony Store), reviews, and documentation.

```mermaid
%%{init: {
  'theme':'base',
  'themeVariables': {
    'primaryColor':'#f8f9fa',
    'primaryTextColor':'#212529',
    'primaryBorderColor':'#4a90e2',
    'lineColor':'#4a90e2',
    'secondaryColor':'#ffffff',
    'tertiaryColor':'#e8f4f8',
    'background':'#ffffff',
    'mainBkg':'#ffffff',
    'secondBkg':'#f0f7ff',
    'border1':'#4a90e2',
    'border2':'#6fa8dc',
    'fontSize':'13px',
    'fontFamily':'Inter, -apple-system, system-ui, sans-serif'
  }
}}%%
erDiagram
    %% ===== USER & PROFILE =====
    USER {
        string id PK "Unique user identifier"
        string username "Unique username"
        string display_name "Public display name"
        string email "User email address"
        string avatar_url "Profile picture URL"
        string bio "User biography"
        string website "Personal website URL"
        string github_username "GitHub username for integration"
        datetime joined_at "Account creation timestamp"
        datetime last_login "Last login timestamp"
        json social_links "Social media links"
    }
    
    %% ===== SUBSCRIPTION & PAYMENT =====
    SUBSCRIPTION_PLAN {
        string id PK "Unique plan identifier"
        string name "Plan name (Free, Pro, Enterprise)"
        string tier "free|pro|enterprise"
        decimal price "Monthly/yearly price"
        string billing_period "monthly|yearly"
        json features "Feature flags and limits"
    }
    
    USER_SUBSCRIPTION {
        string id PK "Unique subscription identifier"
        string user_id FK "References USER.id"
        string plan_id FK "References SUBSCRIPTION_PLAN.id"
        datetime start_date "Subscription start date"
        datetime end_date "Subscription end date"
        string status "active|cancelled|expired"
        json payment_info "Payment method and history"
    }
    
    %% ===== EXTENSIONS (from Orchestra Kit/Grand Stage) =====
    EXTENSION {
        string id PK "Unique extension identifier"
        string publisher_id FK "References USER.id (publisher)"
        string name "Extension display name"
        string description "Extension description"
        string type "instrument|operator|motif"
        string category "Extension category (ai, git, ui, etc)"
        string icon_url "Extension icon URL"
        string repository_url "Source code repository URL"
        json manifest "Extension manifest (Symphony.toml)"
        integer download_count "Total download count"
        float average_rating "Average user rating (0-5)"
        datetime published_at "Initial publication timestamp"
        datetime last_updated "Last update timestamp"
        string pricing_tier "free|premium|enterprise"
    }
    
    EXTENSION_REVIEW {
        string id PK "Unique review identifier"
        string extension_id FK "References EXTENSION.id"
        string user_id FK "References USER.id (reviewer)"
        integer rating "Rating (1-5 stars)"
        string review_text "Review text content"
        datetime reviewed_at "Review submission timestamp"
        boolean verified_purchase "True if user purchased/installed extension"
    }
    
    %% ===== MELODIES (from Polyphony Store) =====
    MELODY {
        string id PK "Unique melody identifier"
        string creator_id FK "References USER.id (creator)"
        string name "Melody display name"
        string description "Melody description"
        json workflow_definition "DAG workflow definition"
        string[] compatible_extensions "List of compatible extension IDs"
        integer usage_count "Total usage count"
        float average_rating "Average user rating (0-5)"
        datetime created_at "Melody creation timestamp"
        datetime last_updated "Last update timestamp"
        string pricing_tier "free|premium|enterprise"
    }
    
    MELODY_REVIEW {
        string id PK "Unique review identifier"
        string melody_id FK "References MELODY.id"
        string user_id FK "References USER.id (reviewer)"
        integer rating "Rating (1-5 stars)"
        string review_text "Review text content"
        datetime reviewed_at "Review submission timestamp"
        boolean verified_purchase "True if user purchased/used melody"
    }
    
    %% ===== USAGE TRACKING =====
    EXTENSION_USAGE {
        string id PK "Unique usage record identifier"
        string user_id FK "References USER.id"
        string extension_id FK "References EXTENSION.id"
        datetime installed_at "Extension installation timestamp"
        datetime last_used_at "Last usage timestamp"
        integer usage_count "Total usage count"
        string status "installed|uninstalled"
    }
    
    MELODY_USAGE {
        string id PK "Unique usage record identifier"
        string user_id FK "References USER.id"
        string melody_id FK "References MELODY.id"
        datetime installed_at "Melody installation timestamp"
        datetime last_used_at "Last execution timestamp"
        integer execution_count "Total execution count"
        string status "active|archived"
    }
    
    %% ===== DOCUMENTATION =====
    DOCUMENTATION_PAGE {
        string id PK "Unique page identifier"
        string title "Page title"
        string slug "URL slug"
        string content "Markdown content"
        string category "Documentation category"
        integer order "Display order within category"
        datetime created_at "Page creation timestamp"
        datetime updated_at "Last update timestamp"
    }
    
    DOCUMENTATION_FEEDBACK {
        string id PK "Unique feedback identifier"
        string page_id FK "References DOCUMENTATION_PAGE.id"
        boolean was_helpful "True if page was helpful"
        string feedback_text "User feedback text"
        datetime submitted_at "Feedback submission timestamp"
    }
    
    %% ===== RELATIONSHIPS =====
    USER ||--o{ USER_SUBSCRIPTION : has
    USER_SUBSCRIPTION }o--|| SUBSCRIPTION_PLAN : subscribes_to
    USER ||--o{ EXTENSION : publishes
    USER ||--o{ EXTENSION_REVIEW : writes
    EXTENSION ||--o{ EXTENSION_REVIEW : receives
    USER ||--o{ MELODY : creates
    USER ||--o{ MELODY_REVIEW : writes
    MELODY ||--o{ MELODY_REVIEW : receives
    DOCUMENTATION_PAGE ||--o{ DOCUMENTATION_FEEDBACK : receives
    USER ||--o{ EXTENSION_USAGE : tracks
    EXTENSION ||--o{ EXTENSION_USAGE : used_in
    USER ||--o{ MELODY_USAGE : tracks
    MELODY ||--o{ MELODY_USAGE : used_in
```

**Key Relationships**:
- **USER → SUBSCRIPTION**: Users subscribe to plans (Free, Pro, Enterprise)
- **USER → EXTENSION**: Users publish extensions to the marketplace
- **USER → MELODY**: Users create and share melodies
- **USER → REVIEWS**: Users write reviews for extensions and melodies
- **USER → USAGE**: System tracks extension and melody usage per user
- **DOCUMENTATION → FEEDBACK**: Users provide feedback on documentation

---

## 3. Unified Model: Complete Symphony Ecosystem

**Description**: This comprehensive diagram combines both the editor runtime and the website/marketplace, showing how all entities relate across the entire Symphony ecosystem.

[Online FlowChart & Diagrams Editor - Mermaid Live Editor](https://mermaid.live/view#pako:eNrVWm1T4zgS_isuX7EwdbAbGGBCqu5DJpjd3PCSSsLMzVWqXIotGw225ZVkmCzkv19LTpxYlp2E4z5cvoDVkqx-uvvpbiUvtkd9bHfsvb0XkhDRsV4miWXtiwcc4_3O_hRxvH-4GvqKGEHTCPP9xUwQpIzEiM16NKIMlvwtaAcXAcpXrcRj_FMUU06OT85OLvQpnynzMSsmnaKLFj4pJkUkwXUyjj2a-KVDqE8xQWAmyLoct4PToF3Ip8h7DBnNEt-wOEYk-fwYGiT5e5eyVvBpTTZV2hwbTptLTqTkPEBt3yskAU3EiPwlkT_-mP4sjV-hmEQzkPQT0ObQOkJpGuEjPuMCx4dW_vcoI_AvSvgRx4wE-3L9fJLM53t7kwSzS4JChuJ817096x_yY92PnKH1izUY3l31rx3r4BueciKwdY1mmH3IJ-VLJraaezD6MLGX9pcfLhhJQov41uBLZTSDoyQoxhWBT3gaoZlrFGJAPaqMoickEHMzVhVNCa2MPeeaVMZDIh6yqVs9mY8EFiTG1g8K7ua7SBhkEeLCjWhIkpXwB6eJxalHUOSCpz7yXDRf4FYGfHT_edQb9gfj_t2tBL77_ca5HZeBXp_jDq67tzuibgRVEMzWFMIexF1kQfh52IBnBIqEbgqORH1N0wAjkTFs0jL3Ebek48G3XR3GBdFVVQT-kuiiwi4cXEO48tEgxImviRZbwiqRcU2_FM1inAiXJAFtsiTEzD-d3nhkHTg-EZQZY2Yx6Q1hU4NC2bbqwMBDAQkzhgShiUF9j4HF1hzarI7zr7FzOwKLgUI3iD1iAYB72Pq7launKVZM31G1NJtGhD_U6keZ94Dhf-Q-ErEVBktGwdxjJC1jsPT9WVpd4AEoIWWz6sEBUCPNMJxSLrGYlcXKCjFKSAAn142DUgThRCD81hyNAI-HmFk-fU4iinzXg_yztjSAQQGMhxkKsSstm4QGyy7BbCKrLJXPftUQEPkyxsu8sBBGoIo38yLsyhAxxRRJQBJFdW615iDu0Pnad77tSARQMuCEgzFrfMAUIktUdbwK8z0R_OwK2NqgUC7VoJxSGmGUWE8yoxIQphn4JxRGG1S-H3V_d96P-mrBaDCHwRO4Jl7ilXHpZZoLGihyA3FY4-8DZ1Smif7taDy8VymuDo2ScgZcYqhSI7ccwnnEKUEN--VUjllAGUSmh90Yw3aeOWvdDZxhd3w3fPMZKbwJATGYjkmSNBMuB1qLkSaimdBl2sm6l5cNObT2WGr3jAA4cUoTyGZ6klMVvascYB05s4VvnOu7y76zXWJQk7_vmBVUiqJ17i8L7cyrl6eM_sDef58tFDLPlD0C_T67Pg5kW1SdYRIUJ41TgBO6JLewDd8y4LbkfD2bvxPjq22lJ3EKFKf7MP6JvUyJHwgXRdLUnDU3_dv4PsYR9Wf_R2S_UPadmd4Mw_vQ_MqIb6X63t3t5X1PEeWi5r1blmty37oK-GYwfj-EgAwgsIR53Gjsxvp3Yq8ptR1nqYhgkZvnH61Aynl9HRVX_YPDUgHYnJ5WNM0QUA3ELCijJw_8JLsUBjkEsMqzoFG_QX_gXPdvHfdu2PvDgXTcfUNftomCzX6b64D4I5w_rKUUjv_McGJoQ8swrlKr2TkL9awv_XHhoP0kYBAVDA4PTavmm8USVy3ZKWUBS_BqbmiqRlbZmoE3wDYz_Q4BEGFEzNyKL1fcxeR1CmiAMmuEadwdfRlZv1jOVyjKVs2rszSHBpGc_s6-sqm0b0wFSklDlaXGoXWX3ZR5kbHZX-fEbfmjJJQXWUh4tT2YrAgi3EA_yg47Iqz0eRu4OWsYAMwFFQTXZPUIUQ8cl9Xr2B2O-1fd3q5q5q_9HzgRYoIEyNNxKGcYF1L_g95yYIEMVPxnhiIZtxUS3zYHDfpjN29CdqfmBmfI25Iyea6SVCE00w3DeSnoQsFBPTXTpNmClTbeL13e9VQfmKtY4piSyB2ogmonLhZERIbbvSgLty8fKrdBy7JJ3djvSguLGrzO3mWNrxzn8nO3tyvPprJP0Ay_rGGfEXcfcJQGWfUaK8DYl1961BXHPJvGRGy-MRw61-r8oz_6g3Lbv5x3D2UcpJpRNi26LW74NuH19eiIvjTcHncsiMVNV8xzenT0-tpwfd6RmsmDTDF3BTWfdZD3ko3HLF_qdiz6XKhV3S1ON262qo87C6-q2c4pekrrYJDf_YFBPzRtr9_TdopLQ77VsnI317GeoUDZdul6b9SRtaz3yOvujze_mWEPkye8yw7lA6jGaPnFjQ7tjcwXUKJbBz3VCSfhb_d8E7iluw7ddg0rdgfV0G3qiJYOs-GFOpaNa7dBsfBMawyZptlGr6Z7wQ4MEm6hib1xrXZbt8PK9du0yrKlKr1l-Vpubo397Px1wTl6E9mRl1Ie5nyFhT6lzosmdogTmZox_y2T6-2NO6wV6Z1VRbr5zY2tIfgzhdxHEgMfLVhyGTcz89ddtXECORj6Wn3TAm7rCxEltmvq1xqYDlolSJH6a8ZQL3HYvvQ6Q7tT2Nb0Vmkm1XpzCzKJ7kIDkmL5m4UaD2pCvchiGmZ5o2JUZtW7WVcRfTaossLo63rEFX7WtMRUmkrqISEUR_pxHFmxA7bdRYHNTV3OfLm11haomIHQqyi53M26UQaNi_qtssW8-dQTO3cJ33oi1cC_pF4m9y4Zq7Y2LQBqrOVWVGsf2iEjvt0RLMOHdoyhk5ePtir3Jra6kZ_Y8pA-DlAWCXnAOSxLUfJvSuPlSnC78MHuBCji8JQXmosfdxRTcKJ-TZMlwu4ct1pnahO782L_hOeTi18_nZyft8_PW6fnHz-1Tw7tGQxfwHC73WqdHp99bLfPTtvzQ_sv9d7Wr59arfbZ8emns5OL4_bZR9gPq2uDm_wXROqHRPP_ADgq1mg)

```mermaid
%%{init: {
  'theme':'base',
  'themeVariables': {
    'primaryColor':'#f8f9fa',
    'primaryTextColor':'#212529',
    'primaryBorderColor':'#4a90e2',
    'lineColor':'#4a90e2',
    'secondaryColor':'#ffffff',
    'tertiaryColor':'#e8f4f8',
    'background':'#ffffff',
    'mainBkg':'#ffffff',
    'secondBkg':'#f0f7ff',
    'border1':'#4a90e2',
    'border2':'#6fa8dc',
    'fontSize':'13px',
    'fontFamily':'Inter, -apple-system, system-ui, sans-serif'
  }
}}%%
erDiagram
    %% ===== USER & PROFILE (Website Layer) =====
    "USER (S)" {
        string id PK
        string username
        string display_name
        string email
        string avatar_url
        string bio
        string website
        string github_username
        datetime joined_at
        datetime last_login
        json social_links
    }
    
    %% ===== SUBSCRIPTION & PAYMENT =====
    "SUBSCRIPTION_PLAN (S)" {
        string id PK
        string name
        string tier
        decimal price
        string billing_period
        json features
    }
    
    "USER_SUBSCRIPTION (W)" {
        string id PK
        string user_id FK
        string plan_id FK
        datetime start_date
        datetime end_date
        string status
        json payment_info
    }
    
    %% ===== PROJECTS (Editor Layer) =====
    "PROJECT (S)" {
        string id PK
        string user_id FK
        string name
        json configuration
        datetime created_at
    }
    
    %% ===== EXTENSIONS (Marketplace + Editor) =====
    "EXTENSION (S)" {
        string id PK
        string publisher_id FK
        string orchestra_kit_id FK
        string name
        string description
        string type
        string category
        string icon_url
        string repository_url
        json manifest
        json capabilities
        integer download_count
        float average_rating
        datetime published_at
        datetime last_updated
        string pricing_tier
        string lifecycle_state
        datetime installed_at
    }
    
    "EXTENSION_REVIEW (W)" {
        string id PK
        string extension_id FK
        string user_id FK
        integer rating
        string review_text
        datetime reviewed_at
        boolean verified_purchase
    }
    
    "EXTENSION_USAGE (W)" {
        string id PK
        string user_id FK
        string extension_id FK
        datetime installed_at
        datetime last_used_at
        integer usage_count
        string status
    }
    
    %% ===== EXTENSION TYPES =====
    "INSTRUMENT (W)" {
        string extension_id PK
        string model_type
        json model_configuration
        json performance_metrics
    }
    
    "OPERATOR (W)" {
        string extension_id PK
        string operator_type
        json input_schema
        json output_schema
    }
    
    "MOTIF (W)" {
        string extension_id PK
        json ui_components
        json theme_integration
    }
    
    %% ===== MELODIES (Marketplace + Editor) =====
    "MELODY (S)" {
        string id PK
        string creator_id FK
        string conductor_id FK
        string project_id FK
        string name
        string description
        json workflow_definition
        json definition
        string compatible_extensions
        integer usage_count
        float average_rating
        datetime created_at
        datetime last_updated
        string pricing_tier
        string creation_source
        json execution_history
    }
    
    "MELODY_REVIEW (W)" {
        string id PK
        string melody_id FK
        string user_id FK
        integer rating
        string review_text
        datetime reviewed_at
        boolean verified_purchase
    }
    
    "MELODY_USAGE (W)" {
        string id PK
        string user_id FK
        string melody_id FK
        datetime installed_at
        datetime last_used_at
        integer execution_count
        string status
    }
    
    %% ===== CONDUCTOR (Editor Orchestration Layer) =====
    "PROMPT (W)" {
        string id PK
        string user_id FK
        string content
        string context
        datetime created_at
    }
    
    "CONDUCTOR (S)" {
        string id PK
        json rl_model_state
        json orchestration_strategies
        json performance_metrics
        json training_data
        json event_router_config
    }
    
    "PIPELINE_ORCHESTRATION (W)" {
        string id PK
        string conductor_id FK
        string melody_id FK
        json task_dag
        json execution_sequence
        string orchestration_type
    }
    
    %% ===== ORCHESTRA KIT (Editor Infrastructure) =====
    "ORCHESTRA_KIT (S)" {
        string id PK
        string version
        json configuration
        json extension_registry
        json security_context
        json performance_state
        json task_queue
    }
    
    %% ===== TASKS & EVENTS (Editor Execution) =====
    "TASK (W)" {
        string id PK
        string conductor_id FK
        string extension_id FK
        string melody_id FK
        string task_type
        json task_payload
        string task_status
        json execution_context
        datetime created_at
        datetime dispatched_at
        datetime completed_at
    }
    
    "EVENT (W)" {
        string id PK
        string task_id FK
        string extension_id FK
        string event_type
        json event_payload
        json event_context
        datetime occurred_at
    }
    
    "ARTIFACT (W)" {
        string id PK
        string event_id FK
        string extension_id FK
        string melody_id FK
        string artifact_type
        string content_hash
        json metadata
        json quality_metrics
        datetime created_at
    }
    
    "PIT_OPERATION (W)" {
        string id PK
        string task_id FK
        string operation_type
        json operation_context
        json resource_allocations
        datetime performed_at
    }
    
    %% ===== DOCUMENTATION =====
    "DOCUMENTATION_PAGE (S)" {
        string id PK
        string title
        string slug
        string content
        string category
        integer order
        datetime created_at
        datetime updated_at
    }
    
    "DOCUMENTATION_FEEDBACK (W)" {
        string id PK
        string page_id FK
        boolean was_helpful
        string feedback_text
        datetime submitted_at
    }
    
    %% ===== RELATIONSHIPS =====
    
    %% User & Subscriptions
    "USER (S)" ||--o{ "USER_SUBSCRIPTION (W)" : has
    "USER_SUBSCRIPTION (W)" }o--|| "SUBSCRIPTION_PLAN (S)" : subscribes_to
    
    %% User & Projects
    "USER (S)" ||--o{ "PROJECT (S)" : owns
    
    %% User & Prompts
    "USER (S)" ||--o{ "PROMPT (W)" : creates
    
    %% User & Extensions (Publishing)
    "USER (S)" ||--o{ "EXTENSION (S)" : publishes
    "USER (S)" ||--o{ "EXTENSION_REVIEW (W)" : writes
    "USER (S)" ||--o{ "EXTENSION_USAGE (W)" : tracks
    "EXTENSION (S)" ||--o{ "EXTENSION_REVIEW (W)" : receives
    "EXTENSION (S)" ||--o{ "EXTENSION_USAGE (W)" : used_in
    
    %% User & Melodies (Creating/Using)
    "USER (S)" ||--o{ "MELODY (S)" : creates
    "USER (S)" ||--o{ "MELODY_REVIEW (W)" : writes
    "USER (S)" ||--o{ "MELODY_USAGE (W)" : tracks
    "MELODY (S)" ||--o{ "MELODY_REVIEW (W)" : receives
    "MELODY (S)" ||--o{ "MELODY_USAGE (W)" : used_in
    
    %% Extension Types
    "EXTENSION (S)" ||--o| "INSTRUMENT (W)" : "is a"
    "EXTENSION (S)" ||--o| "OPERATOR (W)" : "is a"
    "EXTENSION (S)" ||--o| "MOTIF (W)" : "is a"
    
    %% Conductor Orchestration
    "PROMPT (W)" }|--|| "CONDUCTOR (S)" : processes
    "CONDUCTOR (S)" ||--o{ "MELODY (S)" : "generates/uses"
    "CONDUCTOR (S)" ||--o{ "TASK (W)" : dispatches
    "CONDUCTOR (S)" ||--o{ "PIPELINE_ORCHESTRATION (W)" : coordinates
    
    %% Project & Melody
    "PROJECT (S)" ||--o{ "MELODY (S)" : contains
    
    %% Orchestra Kit & Extensions
    "ORCHESTRA_KIT (S)" ||--o{ "EXTENSION (S)" : manages
    
    %% Tasks & Orchestra Kit
    "TASK (W)" }|--|| "ORCHESTRA_KIT (S)" : "routes to"
    
    %% Pipeline Orchestration
    "PIPELINE_ORCHESTRATION (W)" }o--|| "MELODY (S)" : executes
    
    %% Task Execution Flow
    "TASK (W)" ||--o{ "EVENT (W)" : generates
    "TASK (W)" ||--o{ "PIT_OPERATION (W)" : triggers
    
    %% Event & Artifacts
    "EVENT (W)" }|--o{ "ARTIFACT (W)" : produces
    
    %% Artifact Management
    "ARTIFACT (W)" }|--o{ "PIT_OPERATION (W)" : "managed via"
    
    %% Documentation
    "DOCUMENTATION_PAGE (S)" ||--o{ "DOCUMENTATION_FEEDBACK (W)" : receives
```

**Key Insights**:
- **(S)** entities are singletons or shared across the system
- **(W)** entities are weak and depend on other entities
- The model supports both local editor operations and cloud marketplace features
- Extension types (Instrument, Operator, Motif) use table inheritance pattern
- The Pit operations are tracked separately for performance monitoring