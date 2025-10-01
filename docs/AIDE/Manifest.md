# Manifest

```toml
# Symphony AIDE Extension Manifest Schema v1.0
# AI-First Development Environment - Orchestra Kit Extensions
# For Instruments (AI Models), Operators (Utilities), and Addons (UI Extensions)

# ==============================================================================
# PACKAGE - Extension Identity
# ==============================================================================
[package]
name = "string" # Unique identifier (e.g., "rust-code-generator")
display_name = "string" # Human-readable name (e.g., "Rust Code Generator")
version = "string" # Semantic versioning (e.g., "1.0.0")
description = "string" # Brief description of extension purpose
author = "string" # Extension author/creator
publisher = "string" # Publisher organization (e.g., "symphony-community")
license = "string" # SPDX license identifier (e.g., "MIT")
homepage = "string" # Extension homepage URL
repository = "string" # Source repository URL
documentation = "string" # Documentation URL
readme = "string" # Path to README file
changelog = "string" # Path to changelog file

# Orchestra Kit categorization
categories = ["string"] # ["instruments", "operators", "addons", "melodies"]
keywords = ["string"] # Search keywords
tags = ["string"] # Additional metadata tags

# ==============================================================================
# SYMPHONY ENGINE COMPATIBILITY
# ==============================================================================
[engine]
symphony_version = "string" # Compatible Symphony version (e.g., "^1.0.0")
orchestra_kit_version = "string" # Required Orchestra Kit version
conductor_compatibility = "string" # Conductor model compatibility level

# ==============================================================================
# EXTENSION TYPE - Core Classification
# ==============================================================================
[extension_type]
# Primary type: "instrument" | "operator" | "addon" | "melody"
type = "string"

# Sub-classifications for better organization
[extension_type.instrument] # Only for instrument extensions
model_type = "string" # "llm" | "vision" | "audio" | "multimodal" | "specialized"
intelligence_level = "string" # "basic" | "advanced" | "expert" | "maestro"
processing_domain = ["string"] # ["text", "code", "images", "data", "planning"]

[extension_type.operator] # Only for operator extensions
utility_type = "string" # "data_processing" | "file_operations" | "flow_control" | "validation"
execution_context = "string" # "sync" | "async" | "stream" | "batch"

[extension_type.addon] # Only for addon extensions
ui_type = "string" # "panel" | "editor" | "viewer" | "dashboard" | "inspector"
integration_level = "string" # "standalone" | "integrated" | "embedded"

[extension_type.melody] # Only for melody extensions
workflow_complexity = "string" # "simple" | "intermediate" | "complex" | "enterprise"
domain_focus = ["string"] # ["web_dev", "data_science", "mobile", "embedded"]

# ==============================================================================
# CONDUCTOR INTEGRATION
# ==============================================================================
[conductor]
# How this extension integrates with the Conductor
orchestrable = true # Can the Conductor manage this extension
priority_level = "string" # "low" | "normal" | "high" | "critical"
execution_mode = "string" # "automatic" | "manual" | "hybrid"

# Conductor decision-making support
[conductor.activation_conditions]
triggers = ["string"] # Conditions that should activate this extension
dependencies = ["string"] # Extensions that must run before this one
conflicts = ["string"] # Extensions that cannot run with this one
context_requirements = ["string"] # Required context for activation

[conductor.orchestration_hints]
optimal_position = "string" # "early" | "middle" | "late" | "flexible"
parallel_compatible = true # Can run in parallel with other extensions
resource_intensive = false # Requires special resource management
failure_critical = false # Should the melody fail if this fails

# ==============================================================================
# FUNCTION QUEST COMPATIBILITY
# ==============================================================================
[function_quest]
# Integration with Function Quest training system
trainable = true # Can be used in Function Quest scenarios
function_signature = "string" # How this appears as a function in FQ
test_scenarios = ["string"] # Paths to FQ test scenarios
difficulty_level = "string" # "beginner" | "intermediate" | "advanced" | "expert"

# Function Quest metadata
[function_quest.gameplay]
function_name = "string" # Name when used as a function (e.g., "generate_code")
input_types = ["string"] # Expected input types in FQ
output_types = ["string"] # Expected output types in FQ
side_effects = ["string"] # Any side effects the function has
deterministic = true # Always same output for same input

# ==============================================================================
# ARTIFACTS SYSTEM
# ==============================================================================
[artifacts]
# Input artifacts this extension can consume
accepts = ["string"] # Artifact types (e.g., ["enhanced_prompt", "plan_json"])

# Output artifacts this extension produces
produces = ["string"] # Artifact types (e.g., ["source_code", "documentation"])

# Artifact schemas for validation
[artifacts.input_schemas]
# JSON Schema definitions for input artifacts

[artifacts.output_schemas]
# JSON Schema definitions for output artifacts

# Artifact flow configuration
[artifacts.flow]
required_inputs = ["string"] # Mandatory input artifacts
optional_inputs = ["string"] # Optional input artifacts
guaranteed_outputs = ["string"] # Always produces these artifacts
conditional_outputs = ["string"] # May produce these artifacts

# ==============================================================================
# RUNTIME CONFIGURATION
# ==============================================================================
[runtime]
execution_type = "string" # "native" | "wasm" | "api" | "hybrid"
sandbox_level = "string" # "strict" | "moderate" | "minimal" | "none"

# Resource requirements and limits
[runtime.resources]
memory_limit = 0 # Memory limit in MB
cpu_limit = 0 # CPU usage limit percentage
execution_timeout = 0 # Maximum execution time in seconds
network_required = false # Requires network access
gpu_acceleration = false # Can use GPU acceleration

# Runtime environment
[runtime.environment]
required_env_vars = ["string"] # Required environment variables
python_version = "string" # If Python-based
node_version = "string" # If Node.js-based
system_dependencies = ["string"] # Required system packages

# ==============================================================================
# MODEL CONFIGURATION (For Instruments)
# ==============================================================================
[model] # Only for instrument extensions
# Model provider configuration
provider = "string" # "openai" | "anthropic" | "local" | "custom" | "huggingface"
model_name = "string" # Model identifier
api_version = "string" # API version if applicable

# Model capabilities
[model.capabilities]
max_tokens = 0 # Maximum token limit
supports_streaming = false # Supports streaming responses
supports_function_calling = false # Supports function/tool calling
supports_vision = false # Can process images
supports_audio = false # Can process audio
context_window = 0 # Context window size

# Model configuration schema
[model.config_schema]
# JSON Schema for model configuration parameters
type = "object"
properties = {}
required = []

# Cost and billing (if applicable)
[model.billing]
cost_per_request = 0.0 # Cost per API call
cost_per_token = 0.0 # Cost per token
billing_model = "string" # "per_request" | "per_token" | "subscription"
free_tier_available = false # Has free usage tier

# ==============================================================================
# UI CONFIGURATION (For Addons)
# ==============================================================================
[ui] # Only for addon extensions
# UI component type and configuration
component_type = "string" # "react" | "vue" | "svelte" | "vanilla"
entry_point = "string" # Main UI file path

# UI integration points
[ui.integration]
panel_locations = ["string"] # Where UI can be displayed
menu_contributions = ["string"] # Menu items this addon adds
toolbar_contributions = ["string"] # Toolbar buttons
status_bar_contributions = ["string"] # Status bar items

# UI theming and styling
[ui.styling]
supports_themes = true # Adapts to Symphony themes
custom_css = "string" # Path to custom CSS file
icon_set = "string" # Path to icon definitions

# UI state management
[ui.state]
persistent_state = false # Maintains state between sessions
shared_state = false # Shares state with other extensions
state_schema = {} # JSON Schema for state structure

# ==============================================================================
# WORKFLOW CONFIGURATION (For Melodies)
# ==============================================================================
[workflow] # Only for melody extensions
# Workflow definition
workflow_file = "string" # Path to workflow definition file
workflow_format = "string" # "yaml" | "json" | "toml"

# Workflow metadata
[workflow.metadata]
complexity_score = 0 # Workflow complexity (1-10)
estimated_duration = "string" # Estimated execution time
required_skills = ["string"] # User skills needed
automation_level = "string" # "fully_automated" | "semi_automated" | "guided"

# Workflow customization
[workflow.customization]
configurable_steps = ["string"] # Steps that can be customized
parameter_schema = {} # JSON Schema for workflow parameters
preset_configurations = ["string"] # Available preset configurations

# ==============================================================================
# HARMONY BOARD INTEGRATION
# ==============================================================================
[harmony_board]
# Visual representation on the Harmony Board
node_category = "string" # Visual category for grouping
node_color = "string" # Hex color for the node
node_icon = "string" # Icon identifier or path
node_description = "string" # Tooltip description

# Node behavior
[harmony_board.node]
input_ports = [] # Input port definitions
output_ports = [] # Output port definitions
configurable_properties = [] # Properties that can be edited
visual_feedback = ["string"] # Types of visual feedback provided

# Node execution
[harmony_board.execution]
shows_progress = true # Displays execution progress
provides_logs = true # Provides execution logs
supports_debugging = false # Supports step-through debugging
can_be_paused = false # Can pause during execution

# ==============================================================================
# EXTENSION DEPENDENCIES
# ==============================================================================
[dependencies]
# Other extensions this one depends on
required_extensions = ["string"] # Must have these extensions
optional_extensions = ["string"] # Works better with these extensions
suggested_extensions = ["string"] # Recommended companion extensions

# System dependencies
system_requirements = ["string"] # Required system tools/libraries
platform_support = ["string"] # Supported platforms

# Version constraints
extension_constraints = {} # Version requirements for other extensions
symphony_constraints = "string" # Symphony version constraints

# ==============================================================================
# CONFIGURATION SCHEMA
# ==============================================================================
[configuration]
# User-configurable settings
has_settings = true # Has user-configurable settings
settings_ui = "string" # "auto" | "custom" | "none"
settings_schema = {} # JSON Schema for settings

# Configuration categories
[configuration.categories]
# Organized settings categories for better UX

[configuration.presets]
# Predefined configuration presets
default = {} # Default configuration
beginner = {} # Beginner-friendly settings  
advanced = {} # Advanced user settings
performance = {} # Performance-optimized settings

# ==============================================================================
# SECURITY & PERMISSIONS
# ==============================================================================
[security]
# Permission model
permissions = ["string"] # Required permissions
sandbox_escape = false # Can escape sandbox (dangerous)
network_access = ["string"] # Allowed network destinations
file_system_access = "string" # "none" | "read" | "write" | "full"

# Security classifications
[security.classification]
trust_level = "string" # "trusted" | "community" | "unverified"
data_handling = "string" # "none" | "temporary" | "persistent"
privacy_impact = "string" # "none" | "low" | "medium" | "high"

# Content security
[security.content]
validates_inputs = true # Validates all inputs
sanitizes_outputs = true # Sanitizes all outputs
encryption_required = false # Requires encrypted communication

# ==============================================================================
# TESTING & VALIDATION
# ==============================================================================
[testing]
# Test configuration
has_tests = true # Includes test suite
test_runner = "string" # Test framework used
test_coverage_target = 0 # Target coverage percentage

# Test scenarios
[testing.scenarios]
unit_tests = ["string"] # Unit test files
integration_tests = ["string"] # Integration test files
e2e_tests = ["string"] # End-to-end test files
function_quest_tests = ["string"] # Function Quest scenario tests

# Validation
[testing.validation]
input_validation = true # Validates inputs
output_validation = true # Validates outputs
performance_benchmarks = ["string"] # Performance test files

# ==============================================================================
# MONITORING & ANALYTICS
# ==============================================================================
[monitoring]
# Performance monitoring
performance_tracking = true # Tracks performance metrics
error_reporting = true # Reports errors for debugging
usage_analytics = false # Collects usage statistics

# Telemetry configuration
[monitoring.telemetry]
opt_out_available = true # Users can disable telemetry
privacy_compliant = true # GDPR/privacy law compliant
data_retention_days = 0 # How long data is kept

# Health checks
[monitoring.health]
provides_health_check = true # Has health check endpoint
monitoring_endpoints = ["string"] # Additional monitoring endpoints
alerting_thresholds = {} # When to alert about issues

# ==============================================================================
# MARKETPLACE INTEGRATION
# ==============================================================================
[marketplace]
# Distribution and discovery
pricing_model = "string" # "free" | "paid" | "freemium" | "subscription"
price = 0.0 # Price if paid extension
currency = "string" # Currency for pricing

# Marketplace metadata
[marketplace.metadata]
short_description = "string" # Brief marketplace description
long_description = "string" # Detailed marketplace description
screenshots = ["string"] # Paths to screenshot files
demo_video = "string" # Demo video URL
feature_highlights = ["string"] # Key features to highlight

# Support and maintenance
[marketplace.support]
support_url = "string" # Support/help URL
documentation_url = "string" # Documentation URL
community_url = "string" # Community forum/chat URL
issue_tracker = "string" # Issue tracking URL

# ==============================================================================
# VERSIONING & UPDATES
# ==============================================================================
[versioning]
# Version management
update_strategy = "string" # "automatic" | "manual" | "notify"
breaking_changes = false # Contains breaking changes
migration_required = false # Requires data migration

# Backward compatibility
[versioning.compatibility]
min_supported_version = "string" # Minimum supported Symphony version
deprecation_warnings = ["string"] # Features being deprecated
removed_features = ["string"] # Features removed in this version

# Update metadata
[versioning.changelog]
new_features = ["string"] # New features in this version
improvements = ["string"] # Improvements made
bug_fixes = ["string"] # Bugs fixed
known_issues = ["string"] # Known issues in this version

# ==============================================================================
# DEVELOPMENT METADATA
# ==============================================================================
[development]
# Development information
development_stage = "string" # "alpha" | "beta" | "stable" | "deprecated"
first_release_date = "string" # ISO 8601 date
last_updated = "string" # ISO 8601 date
maintenance_status = "string" # "active" | "maintenance" | "deprecated"

# Quality metrics
[development.quality]
code_coverage = 0 # Test code coverage percentage
documentation_coverage = 0 # Documentation coverage percentage
user_rating = 0.0 # Average user rating
download_count = 0 # Total downloads

# Community engagement
[development.community]
contributors = ["string"] # List of contributors
maintainers = ["string"] # Current maintainers
sponsors = ["string"] # Sponsors/backers
acknowledgments = ["string"] # Special acknowledgments
```