# Manifest

```toml
# Symphony Extension Manifest Schema v3.0
# Ultimate Extensibility - Generic Primitives for Infinite Extension Possibilities
# Provides LEGO BLOCKS for building ANY functionality: Debugging, SCM, Search, Linting, etc.
# Core Integration: Text Editor, File Tree, Syntax Highlighting, Settings, Terminal, Extension System

# ==============================================================================
# PACKAGE - Extension Identity & Metadata
# ==============================================================================
[package]
name = "string" # Unique identifier (kebab-case, e.g., "rust-debugger")
display_name = "string" # Human-readable name (e.g., "Rust Debugger")
version = "string" # Semantic Versioning (e.g., "1.0.0")
description = "string" # Brief description of extension purpose
author = "string" # Extension author name
publisher = "string" # Publisher organization
license = "string" # SPDX license identifier
homepage = "string" # Extension homepage URL
repository = "string" # Source repository URL
documentation = "string" # Documentation URL
readme = "string" # Path to README file
changelog = "string" # Path to CHANGELOG file
icon = "string" # Extension icon path
banner = "string" # Banner image path
banner_color = "string" # Banner background color (hex)

# Marketplace categorization - open-ended for any extension type
categories = ["string"] # ["languages", "debuggers", "scm", "search", "terminal", "ui", "productivity", "tools", "other"]
keywords = ["string"] # Search keywords
tags = ["string"] # Additional metadata tags
pricing = "string" # "free" | "paid" | "freemium"

# ==============================================================================
# ENGINE & COMPATIBILITY
# ==============================================================================
[engine]
symphony_version = "string" # Compatible Symphony version (e.g., "^1.0.0")
rust_version = "string" # Minimum Rust version if applicable
platform_specific = {} # Platform-specific requirements/overrides

# ==============================================================================
# RUNTIME - Ultimate Flexibility for Any Extension Type
# ==============================================================================
[runtime]
# Extension execution model
type = "string" # "native" | "wasm" | "hybrid" | "service" | "language_server"

# Native extensions (maximum performance, full system access)
[runtime.native]
main = "string" # Primary library path
entry_points = {} # Multiple entry points for different functionalities
symbols = ["string"] # Required export symbols
abi_version = "string" # ABI version compatibility

# WASM extensions (security, portability)
[runtime.wasm]
main = "string" # WASM module path
memory_limit = 0 # Memory limit in MB
execution_timeout = 0 # Max execution time per operation
imported_functions = ["string"] # Host functions this extension needs
exported_functions = ["string"] # Functions this extension provides

# Hybrid extensions (best of both worlds)
[runtime.hybrid]
native_preferred = "string" # Native implementation path
wasm_fallback = "string" # WASM fallback path
selection_criteria = {} # When to use which implementation

# Service extensions (long-running background services)
[runtime.service]
executable = "string" # Service executable path
args = ["string"] # Command line arguments
working_directory = "string" # Working directory
restart_policy = "string" # "always" | "on-failure" | "never"
health_check = {} # Health check configuration

# Language server extensions (LSP, DAP, or custom protocols)
[runtime.language_server]
command = "string" # Language server command
args = ["string"] # Arguments
transport = "string" # "stdio" | "tcp" | "websocket" | "named-pipe"
initialization_options = {} # Server initialization options
custom_protocol = {} # Custom protocol definition

# Universal activation system - supports ANY trigger
activation_events = ["string"] # Comprehensive activation triggers
lazy_loading = true # Performance optimization
background_activation = false # Can activate in background

# ==============================================================================
# CAPABILITIES - Declare What This Extension Can Do
# ==============================================================================
[capabilities]
# System-level capabilities
file_system_access = "string" # "none" | "read" | "write" | "full"
network_access = "string" # "none" | "localhost" | "restricted" | "full"
process_spawning = false # Can spawn external processes
native_module_loading = false # Can load native libraries
system_commands = false # Can execute system commands
environment_modification = false # Can modify environment variables

# Symphony integration capabilities
ui_modification = false # Can modify Symphony's UI
editor_integration = false # Can integrate with text editor
terminal_integration = false # Can integrate with terminal
settings_integration = false # Can add to settings system
menu_integration = false # Can add menu items
keybinding_integration = false # Can define keybindings
theme_integration = false # Can provide themes
language_support = false # Can add language definitions

# Advanced extension capabilities
protocol_handling = false # Can handle custom protocols
event_system_access = false # Can access Symphony's event system
extension_communication = false # Can communicate with other extensions
data_persistence = false # Can persist data
background_processing = false # Can run background tasks
notification_system = false # Can show notifications

# Permission model - fine-grained access control
permissions = ["string"] # Detailed permission list

# ==============================================================================
# API ACCESS - Generic Symphony API Integration
# ==============================================================================
[api_access]
# Core Symphony APIs this extension needs
editor_api = false # Text editor manipulation
file_tree_api = false # File explorer integration  
terminal_api = false # Terminal integration
settings_api = false # Settings system access
extension_api = false # Extension management
theme_api = false # Theme system access
event_api = false # Event system access
ui_api = false # UI manipulation
dialog_api = false # System dialogs
notification_api = false # Notification system

# API access level
access_level = "string" # "minimal" | "standard" | "full" | "system"

# Custom API definitions - extensions can define their own APIs
[api_access.custom_apis]
# Extensions can register APIs that other extensions can use

# API versioning and compatibility
api_version_requirements = {} # Minimum API versions needed

# ==============================================================================
# COMMANDS - Universal Command System
# ==============================================================================
[[commands]]
id = "string" # Unique command identifier
title = "string" # Human-readable title
description = "string" # Command description
category = "string" # Command category (open-ended)
icon = "string" # Command icon
when = "string" # Availability condition (powerful expression system)
enabled_when = "string" # Additional enablement conditions

# Command execution configuration
[commands.execution]
type = "string" # "sync" | "async" | "background" | "streaming"
timeout = 0 # Execution timeout
retry_policy = {} # Retry configuration
error_handling = "string" # Error handling strategy

# Command input/output schema (for validation and UI generation)
[commands.schema]
input = {} # JSON Schema for command input
output = {} # JSON Schema for command output
side_effects = ["string"] # Declared side effects

# ==============================================================================
# CONFIGURATION - Universal Settings Integration
# ==============================================================================
[configuration]
title = "string" # Settings section title
description = "string" # Section description
category = "string" # Settings category
order = 0 # Display order
icon = "string" # Settings section icon

# Dynamic configuration properties - supports ANY setting type
[configuration.properties]

[configuration.properties."string"] # Setting key
type = "string" # Basic types + "custom" for complex types
title = "string" # Human-readable title
description = "string" # Setting description
default = "mixed" # Default value (any type)
scope = "string" # "application" | "window" | "workspace" | "resource" | "language"
category = "string" # Setting category
tags = ["string"] # Setting tags
order = 0 # Display order within category

# Advanced setting configuration
enum = ["mixed"] # Enumeration values (any type)
enum_descriptions = ["string"] # Descriptions for enum values
minimum = 0 # For numeric types
maximum = 100 # For numeric types
multipleOf = 1 # For numeric types
minLength = 0 # For string types
maxLength = 100 # For string types
pattern = "string" # Regex pattern for string validation
format = "string" # String format (e.g., "uri", "email", "color")
items = {} # Schema for array items
properties = {} # Schema for object properties
additionalProperties = false # Allow additional object properties

# Dynamic setting validation
validation_rules = ["string"] # Custom validation rules
dependencies = {} # Setting dependencies
conditional_schema = {} # Schema that changes based on other settings

# Setting UI customization
ui_hint = "string" # UI rendering hint
placeholder = "string" # Input placeholder
help_text = "string" # Additional help text
group = "string" # Setting group for organization

# ==============================================================================
# UI EXTENSIBILITY - Complete UI Customization System
# ==============================================================================
[ui_extensibility]
# UI modification capabilities
can_create_views = false # Can create custom views/panels
can_modify_layout = false # Can modify Symphony's layout
can_add_sidebars = false # Can add sidebar panels
can_create_dialogs = false # Can create custom dialogs
can_modify_status_bar = false # Can modify status bar
can_create_toolbars = false # Can add toolbars
can_customize_menus = false # Can modify menu structure
can_override_themes = false # Can override theme elements

# View system - for creating custom panels, sidebars, etc.
[[ui_views]]
id = "string" # View identifier
title = "string" # View title
description = "string" # View description
type = "string" # "tree" | "webview" | "native" | "custom"
location = "string" # "sidebar" | "panel" | "editor" | "floating" | "custom"
initial_size = {} # Initial dimensions
resizable = true # Can be resized
movable = true # Can be moved
closable = true # Can be closed
icon = "string" # View icon

# View behavior
visibility = "string" # "visible" | "collapsed" | "hidden"
when = "string" # Visibility conditions
focus_behavior = "string" # Focus handling
persistence = "string" # State persistence level

# View content configuration
[ui_views.content]
source = "string" # Content source (file path, URL, etc.)
type = "string" # Content type
parameters = {} # Content parameters
refresh_policy = "string" # Content refresh behavior

# Custom dialogs and modals
[[ui_dialogs]]
id = "string" # Dialog identifier
title = "string" # Dialog title
type = "string" # "modal" | "modeless" | "popup"
size = {} # Dialog dimensions
position = "string" # Dialog positioning
buttons = [] # Dialog buttons configuration
content = {} # Dialog content specification

# Status bar integration
[[ui_status_bar]]
id = "string" # Status bar item identifier
text = "string" # Display text
tooltip = "string" # Tooltip text
command = "string" # Command to execute on click
priority = 0 # Display priority
alignment = "string" # "left" | "right"
when = "string" # Visibility conditions

# Toolbar integration
[[ui_toolbars]]
id = "string" # Toolbar identifier
title = "string" # Toolbar title
location = "string" # Toolbar location
items = [] # Toolbar items configuration

# ==============================================================================
# MENU SYSTEM - Universal Menu Integration
# ==============================================================================
[menus]
# Command palette integration
[[menus.command_palette]]
command = "string"
when = "string"
group = "string"
order = 0

# Context menus - extensible for any context
[[menus.editor_context]]
command = "string"
when = "string"
group = "string"
order = 0
submenu = "string" # Reference to submenu

[[menus.explorer_context]]
command = "string"
when = "string"
group = "string"
order = 0

[[menus.terminal_context]]
command = "string"
when = "string"
group = "string"
order = 0

# Custom menu locations - extensions can define new menu contexts
[[menus.custom]]
location = "string" # Custom menu location identifier
command = "string"
when = "string"
group = "string"
order = 0

# Submenu definitions
[[submenus]]
id = "string"
label = "string"
icon = "string"
group = "string"

# Dynamic menu generation
[[menus.dynamic]]
provider = "string" # Menu provider function
context = "string" # Menu context
refresh_triggers = ["string"] # When to refresh menu

# ==============================================================================
# KEYBINDINGS - Universal Shortcut System
# ==============================================================================
[[keybindings]]
command = "string" # Target command
key = "string" # Primary keybinding
mac = "string" # macOS override
linux = "string" # Linux override
windows = "string" # Windows override
when = "string" # Context conditions
args = {} # Command arguments

# Keybinding sets - for different modes or contexts
[[keybinding_sets]]
id = "string" # Keybinding set identifier
name = "string" # Human-readable name
description = "string" # Set description
activation_conditions = ["string"] # When this set is active
priority = 0 # Set priority for conflicts

# Chorded keybindings (multi-key sequences)
[[chord_keybindings]]
sequence = ["string"] # Key sequence
command = "string" # Final command
when = "string" # Context conditions

# ==============================================================================
# LANGUAGE SYSTEM - Universal Language Support
# ==============================================================================
[[languages]]
id = "string" # Language identifier
display_name = "string" # Display name
description = "string" # Language description
icon = "string" # Language icon
extensions = ["string"] # File extensions
filenames = ["string"] # Specific filenames
filename_patterns = ["string"] # Filename patterns
first_line_match = "string" # First line regex
aliases = ["string"] # Language aliases

# Language configuration - comprehensive editor behavior
[languages.config]
comment_line = "string" # Line comment syntax
comment_block = ["string", "string"] # Block comment syntax
string_delimiters = [["string", "string"]] # String delimiter pairs
brackets = [["string", "string"]] # Bracket pairs
auto_closing_pairs = [["string", "string"]] # Auto-closing pairs
surrounding_pairs = [["string", "string"]] # Surrounding pairs
word_pattern = "string" # Word boundary regex
word_separators = "string" # Word separator characters
line_comment_prefix_whitespace = true # Allow whitespace before line comments

# Indentation rules
[languages.config.indentation]
increase_indent_pattern = "string" # Regex for indent increase
decrease_indent_pattern = "string" # Regex for indent decrease
indent_next_line_pattern = "string" # Regex for next line indent
unindented_line_pattern = "string" # Regex for unindented lines

# Folding rules
[languages.config.folding]
start_pattern = "string" # Fold start regex
end_pattern = "string" # Fold end regex
kind = "string" # Folding kind

# Auto-completion behavior
[languages.config.completion]
trigger_characters = ["string"] # Characters that trigger completion
commit_characters = ["string"] # Characters that commit completion

# ==============================================================================
# GRAMMAR SYSTEM - Syntax Highlighting Engine Integration
# ==============================================================================
[[grammars]]
language = "string" # Target language
scope_name = "string" # TextMate scope name
path = "string" # Grammar file path
file_types = ["string"] # Associated file types
first_line_match = "string" # First line match regex
content_name = "string" # Content scope name

# Advanced grammar features
embedded_languages = {} # Nested language mappings
injections = {} # Grammar injection rules
repository = {} # Named pattern repository
patterns = [] # Root patterns

# Custom tokenization
token_types = {} # Custom token type mappings
semantic_token_scopes = {} # Semantic token scope mappings

# Grammar dependencies
dependencies = ["string"] # Other grammars this depends on
injection_selectors = ["string"] # Where this grammar can be injected

# ==============================================================================
# THEME SYSTEM - Complete Visual Customization
# ==============================================================================
[[color_themes]]
id = "string" # Theme identifier
label = "string" # Display name
description = "string" # Theme description
type = "string" # "light" | "dark" | "high-contrast" | "custom"
path = "string" # Theme definition file
base_theme = "string" # Base theme to extend

# Theme metadata
author = "string" # Theme author
version = "string" # Theme version
tags = ["string"] # Theme tags

# Dynamic theme properties
supports_semantic_highlighting = true # Semantic highlighting support
supports_bracket_matching = true # Bracket matching colors
supports_minimap = true # Minimap colors

# Custom color definitions
[[color_definitions]]
id = "string" # Color identifier
description = "string" # Color description
category = "string" # Color category
defaults = {} # Default colors for different base themes

# Icon themes
[[icon_themes]]
id = "string" # Icon theme identifier
label = "string" # Display name
description = "string" # Theme description
path = "string" # Icon theme file

# Icon definitions
[[icon_definitions]]
icon_path = "string" # Path to icon file
file_extensions = ["string"] # Associated file extensions
file_names = ["string"] # Associated file names
folder_names = ["string"] # Associated folder names
language_ids = ["string"] # Associated language IDs

# ==============================================================================
# EVENT SYSTEM - Universal Event Handling
# ==============================================================================
[event_system]
# Events this extension listens to
subscribes_to = ["string"] # Event names to subscribe to
event_filters = {} # Event filtering rules
event_priority = "string" # Event handling priority

# Events this extension emits
emits_events = ["string"] # Event names this extension can emit
custom_event_schemas = {} # Schemas for custom events

# Event handling configuration
[event_system.handling]
async_handling = true # Handle events asynchronously
batch_processing = false # Process events in batches
error_handling = "string" # How to handle event processing errors
timeout = 0 # Event handling timeout

# Custom event definitions
[[custom_events]]
name = "string" # Event name
description = "string" # Event description
schema = {} # Event data schema
frequency = "string" # Event frequency hint
cancellable = false # Can be cancelled

# ==============================================================================
# PROTOCOL SYSTEM - Custom Protocol Support
# ==============================================================================
[protocols]
# Custom protocol definitions - for LSP, DAP, or completely custom protocols
[[protocols.custom]]
name = "string" # Protocol name
version = "string" # Protocol version
description = "string" # Protocol description
transport = ["string"] # Supported transport methods
bidirectional = true # Bidirectional communication
stateful = true # Stateful protocol

# Message format
[protocols.custom.message_format]
encoding = "string" # Message encoding
serialization = "string" # Serialization format
headers = {} # Message headers
content_type = "string" # Content type

# Protocol lifecycle
[protocols.custom.lifecycle]
initialization = {} # Initialization sequence
capabilities_exchange = true # Supports capabilities exchange
shutdown_sequence = {} # Shutdown sequence
heartbeat = {} # Heartbeat configuration

# Built-in protocol support
[protocols.builtin]
language_server_protocol = false # LSP support
debug_adapter_protocol = false # DAP support
test_adapter_protocol = false # Testing protocol support
custom_protocols = ["string"] # Other protocol identifiers

# ==============================================================================
# PROCESS MANAGEMENT - External Process Integration
# ==============================================================================
[process_management]
# Process spawning capabilities
can_spawn_processes = false # Can spawn external processes
process_lifetime_management = false # Manages process lifecycles
process_communication = false # Communicates with processes

# Process definitions
[[processes]]
id = "string" # Process identifier
name = "string" # Process name
command = "string" # Executable command
args = ["string"] # Command arguments
working_directory = "string" # Working directory
environment = {} # Environment variables

# Process behavior
[processes.behavior]
auto_restart = false # Automatically restart on failure
restart_delay = 0 # Delay before restart (ms)
max_restarts = 0 # Maximum restart attempts
kill_timeout = 0 # Timeout for process termination

# Process communication
[processes.communication]
stdin = true # Provides stdin input
stdout = true # Captures stdout
stderr = true # Captures stderr
ipc = false # Inter-process communication

# ==============================================================================
# DATA PERSISTENCE - Storage System Integration
# ==============================================================================
[data_persistence]
# Storage capabilities
requires_storage = false # Needs persistent storage
storage_scope = "string" # "global" | "workspace" | "user" | "session"
storage_encryption = false # Encrypt stored data

# Storage quotas and limits
max_storage_size = 0 # Maximum storage size (bytes)
storage_cleanup_policy = "string" # Cleanup policy
data_retention_period = 0 # Data retention (days)

# Data types that can be persisted
persistent_data_types = ["string"] # Types of data stored
backup_strategy = "string" # Backup strategy
sync_capability = false # Can sync across devices

# ==============================================================================
# TERMINAL INTEGRATION - Native Terminal Extension
# ==============================================================================
[terminal_integration]
# Terminal interaction capabilities
can_interact_with_terminal = false # Can interact with Symphony's terminal
can_create_terminals = false # Can create new terminal instances
can_modify_terminal_behavior = false # Can modify terminal behavior

# Terminal enhancement features
custom_shells = ["string"] # Custom shell integrations
terminal_themes = ["string"] # Custom terminal themes
terminal_profiles = [] # Terminal profile definitions

# Terminal process integration
[[terminal_processes]]
id = "string" # Process identifier
name = "string" # Display name
shell = "string" # Shell command
args = ["string"] # Shell arguments
env = {} # Environment variables
cwd = "string" # Working directory
icon = "string" # Terminal icon

# Terminal UI customization
[terminal_integration.ui]
can_add_terminal_tabs = false # Can add custom terminal tabs
can_modify_terminal_ui = false # Can modify terminal UI
custom_terminal_actions = [] # Custom terminal actions

# ==============================================================================
# NOTIFICATION SYSTEM - User Communication
# ==============================================================================
[notifications]
# Notification capabilities
can_show_notifications = false # Can display notifications
notification_types = ["string"] # Types of notifications: ["info", "warning", "error", "progress"]
persistent_notifications = false # Can show persistent notifications

# Notification configuration
[[notification_templates]]
id = "string" # Template identifier
type = "string" # Notification type
title = "string" # Notification title
message = "string" # Message template
actions = [] # Available actions
timeout = 0 # Auto-dismiss timeout
priority = "string" # Notification priority

# Progress notifications
[[progress_notifications]]
id = "string" # Progress identifier
title = "string" # Progress title
cancellable = false # Can be cancelled
indeterminate = false # Indeterminate progress
location = "string" # Progress location

# ==============================================================================
# EXTENSION COMMUNICATION - Inter-Extension APIs
# ==============================================================================
[extension_communication]
# Communication capabilities
can_communicate_with_extensions = false # Can communicate with other extensions
provides_apis = false # Provides APIs for other extensions
consumes_apis = false # Consumes APIs from other extensions

# API definitions this extension provides
[[provided_apis]]
id = "string" # API identifier
name = "string" # API name
version = "string" # API version
description = "string" # API description
methods = [] # Available methods
events = [] # Available events
documentation = "string" # API documentation URL

# APIs this extension consumes
[[consumed_apis]]
extension_id = "string" # Source extension identifier
api_id = "string" # API identifier
min_version = "string" # Minimum API version
optional = false # Optional dependency

# Extension messaging
[extension_communication.messaging]
supports_broadcast = false # Supports broadcast messages
supports_direct_messaging = false # Supports direct messages
message_encryption = false # Encrypt messages
message_validation = true # Validate message schemas

# ==============================================================================
# TASK SYSTEM - Generic Task Management
# ==============================================================================
[task_system]
# Task capabilities
provides_tasks = false # Provides task definitions
executes_tasks = false # Can execute tasks
monitors_tasks = false # Monitors task execution

# Task type definitions
[[task_types]]
type = "string" # Task type identifier
name = "string" # Human-readable name
description = "string" # Task description
schema = {} # Task configuration schema
category = "string" # Task category

# Task execution configuration
[task_types.execution]
runner = "string" # Task runner
execution_mode = "string" # "sync" | "async" | "background"
supports_cancellation = true # Can be cancelled
supports_progress = true # Reports progress
timeout = 0 # Execution timeout

# Task output handling
[task_types.output]
captures_output = true # Captures task output
output_format = "string" # Output format
error_detection = [] # Error detection patterns
problem_matchers = ["string"] # Problem matcher identifiers

# ==============================================================================
# PROBLEM SYSTEM - Universal Diagnostic Integration
# ==============================================================================
[problem_system]
# Problem/diagnostic capabilities
provides_diagnostics = false # Provides diagnostic information
consumes_diagnostics = false # Consumes diagnostics from other sources
diagnostic_sources = ["string"] # Diagnostic source identifiers

# Problem matcher definitions - for parsing any tool output
[[problem_matchers]]
name = "string" # Matcher identifier
owner = "string" # Problem owner
source = "string" # Problem source
apply_to = "string" # Application scope
severity_map = {} # Severity mapping

# Problem pattern definitions
[[problem_matchers.patterns]]
regexp = "string" # Regular expression
file_group = 0 # File capture group
line_group = 0 # Line capture group
column_group = 0 # Column capture group
severity_group = 0 # Severity capture group
message_group = 0 # Message capture group
code_group = 0 # Error code capture group
loop = false # Pattern loops

# Background task problem matching
[problem_matchers.background]
active_on_start = true # Active on task start
begins_pattern = "string" # Task start pattern
ends_pattern = "string" # Task end pattern

# Diagnostic providers
[[diagnostic_providers]]
id = "string" # Provider identifier
name = "string" # Provider name
languages = ["string"] # Supported languages
trigger_characters = ["string"] # Trigger characters
resolve_provider = false # Provides resolution

# ==============================================================================
# TESTING INTEGRATION - Universal Test Framework Support
# ==============================================================================
[testing_integration]
# Test capabilities
provides_tests = false # Provides test definitions
executes_tests = false # Can execute tests
discovers_tests = false # Can discover tests

# Test framework integration
[[test_frameworks]]
id = "string" # Framework identifier
name = "string" # Framework name
languages = ["string"] # Supported languages
file_patterns = ["string"] # Test file patterns
discovery_method = "string" # Test discovery method

# Test execution
[test_frameworks.execution]
runner = "string" # Test runner command
parallel_execution = true # Supports parallel execution
coverage_support = true # Supports code coverage
debugging_support = true # Supports test debugging

# Test result handling
[test_frameworks.results]
result_format = "string" # Result format
real_time_results = true # Real-time result updates
result_persistence = true # Persist results

# ==============================================================================
# SEARCH INTEGRATION - Universal Search System
# ==============================================================================
[search_integration]
# Search capabilities
provides_search = false # Provides search functionality
search_scopes = ["string"] # Search scopes: ["files", "symbols", "references", "custom"]
incremental_search = true # Supports incremental search
regex_search = true # Supports regex search

# Search providers
[[search_providers]]
id = "string" # Provider identifier
name = "string" # Provider name
scope = "string" # Search scope
languages = ["string"] # Supported languages
file_types = ["string"] # Supported file types

# Search configuration
[search_providers.config]
case_sensitive = false # Case sensitive by default
whole_word = false # Whole word by default
include_patterns = ["string"] # Default include patterns
exclude_patterns = ["string"] # Default exclude patterns
max_results = 1000 # Maximum result count
timeout = 30000 # Search timeout (ms)

# Custom search backends
[[search_backends]]
id = "string" # Backend identifier
name = "string" # Backend name
command = "string" # Search command
result_parser = "string" # Result parsing method

# ==============================================================================
# DEPENDENCIES - Extension Ecosystem Integration
# ==============================================================================
[dependencies]
# Extension dependencies
extensions = ["string"] # Required extensions with version constraints
optional_extensions = ["string"] # Optional extensions
bundled_extensions = ["string"] # Bundled with this extension

# System dependencies
system_requirements = ["string"] # Required system tools/libraries
platform_requirements = {} # Platform-specific requirements
runtime_dependencies = ["string"] # Runtime dependencies

# Compatibility
conflicts_with = ["string"] # Conflicting extensions
replaces = ["string"] # Extensions this replaces
provides_compatibility = ["string"] # Backward compatibility for

# Version constraints
minimum_symphony_version = "string" # Minimum Symphony version
maximum_symphony_version = "string" # Maximum Symphony version
api_version_requirements = {} # API version requirements

# ==============================================================================
# SECURITY MODEL - Comprehensive Security Framework
# ==============================================================================
[security]
# Security level and sandbox configuration
security_level = "string" # "minimal" | "standard" | "elevated" | "system"
sandbox_enabled = true # Enable sandboxing
trusted_execution = false # Requires trusted execution environment

# Fine-grained permissions
[security.permissions]
file_system = ["string"] # FS permissions: ["read", "write", "execute", "delete"]
network = ["string"] # Network permissions: ["http", "https", "tcp", "udp"]
process = ["string"] # Process permissions: ["spawn", "kill", "communicate"]
system = ["string"] # System permissions: ["env", "registry", "services"]
ui = ["string"] # UI permissions: ["modify", "overlay", "fullscreen"]

# Content security policy
[security.csp]
allow_unsafe_eval = false # Allow unsafe JavaScript eval
allow_unsafe_inline = false # Allow unsafe inline scripts/styles
trusted_domains = ["string"] # Trusted external domains
content_sources = {} # Content source restrictions

# Data access controls
[security.data_access]
user_data_access = false # Can access user data
workspace_data_access = false # Can access workspace data
extension_data_access = false # Can access other extension data
system_data_access = false # Can access system data

# Cryptographic requirements
[security.crypto]
requires_encryption = false # Requires encryption support
key_management = "string" # Key management approach
signature_verification = false # Verify digital signatures

# ==============================================================================
# PERFORMANCE - Optimization and Resource Management
# ==============================================================================
[performance]
# Startup optimization
startup_priority = "string" # "critical" | "high" | "normal" | "low" | "background"
lazy_activation = true # Enable lazy activation
preload_resources = [] # Resources to preload
startup_budget = 100 # Startup time budget (ms)

# Resource limits
[performance.limits]
memory_limit = 0 # Memory limit (MB, 0 = unlimited)
cpu_limit = 0 # CPU limit (%, 0 = unlimited)
file_handle_limit = 0 # File handle limit
network_bandwidth_limit = 0 # Network bandwidth limit (KB/s)
storage_limit = 0 # Storage limit (MB)

# Performance monitoring
[performance.monitoring]
enable_profiling = false # Enable performance profiling
collect_metrics = false # Collect performance metrics
telemetry_enabled = false # Send telemetry data
performance_warnings = true # Show performance warnings

# Resource cleanup
[performance.cleanup]
auto_cleanup = true # Automatic resource cleanup
cleanup_interval = 300000 # Cleanup interval (ms)
memory_threshold = 0.8 # Memory cleanup threshold
idle_timeout = 600000 # Idle timeout for cleanup (ms)

# Optimization hints
[performance.optimization]
cache_strategy = "string" # "none" | "memory" | "disk" | "hybrid"
compression_enabled = true # Enable data compression
batch_operations = true # Batch similar operations
debounce_events = true # Debounce high-frequency events

# ==============================================================================
# LOCALIZATION - Internationalization Support
# ==============================================================================
[localization]
# Language support
default_locale = "string" # Default locale (e.g., "en-US")
supported_locales = ["string"] # Supported locales
fallback_locale = "string" # Fallback locale
locale_detection = "string" # "auto" | "manual" | "system"

# Localization resources
[localization.resources]
bundle_path = "string" # Path to localization bundle
format = "string" # Bundle format: "json" | "po" | "properties" | "yaml"
encoding = "string" # File encoding
namespace = "string" # Translation namespace

# Dynamic localization
[localization.dynamic]
supports_runtime_switching = false # Can switch language at runtime
supports_partial_localization = false # Supports partial translations
supports_pluralization = true # Supports plural forms
supports_context = true # Supports translation context

# Locale-specific overrides
[localization.overrides]
# Per-locale configuration overrides for settings, commands, etc.

# ==============================================================================
# BUILD SYSTEM - Universal Build Configuration
# ==============================================================================
[build]
# Build environment
build_system = "string" # "cargo" | "npm" | "make" | "custom"
source_root = "string" # Source directory
build_root = "string" # Build output directory
intermediate_dir = "string" # Intermediate build files

# Build targets
[build.targets]
primary_target = "string" # Primary build target
additional_targets = ["string"] # Additional targets
cross_compilation = ["string"] # Cross-compilation targets
optimization_level = "string" # Optimization level

# Build configuration
[build.config]
profile = "string" # Build profile
features = ["string"] # Build features
environment_variables = {} # Build environment variables
preprocessor_definitions = {} # Preprocessor definitions

# Build steps
[build.steps]
pre_build = ["string"] # Pre-build commands
build_command = "string" # Main build command
post_build = ["string"] # Post-build commands
clean_command = "string" # Clean command
test_command = "string" # Test command

# Build artifacts
[build.artifacts]
primary_artifact = "string" # Primary build artifact
additional_artifacts = ["string"] # Additional artifacts
artifact_patterns = ["string"] # Artifact file patterns
output_mapping = {} # Artifact output location mapping

# Packaging configuration
[build.packaging]
format = "string" # Package format
compression = "string" # Compression type
include_patterns = ["string"] # Files to include
exclude_patterns = ["string"] # Files to exclude
metadata_files = ["string"] # Metadata files to include

# ==============================================================================
# DISTRIBUTION - Extension Distribution System
# ==============================================================================
[distribution]
# Distribution channels
channels = ["string"] # "marketplace" | "github" | "direct" | "enterprise"
auto_update = false # Supports automatic updates
update_check_interval = 86400 # Update check interval (seconds)

# Marketplace integration
[distribution.marketplace]
marketplace_id = "string" # Marketplace identifier
category_mapping = {} # Category mapping for different marketplaces
featured = false # Request featured placement
pricing_tiers = {} # Pricing tier information

# Release management
[distribution.releases]
release_notes_path = "string" # Path to release notes
automated_releases = false # Automated release process
pre_release_channel = "string" # Pre-release channel name
rollback_capability = true # Supports rollback

# Distribution security
[distribution.security]
code_signing = false # Requires code signing
signature_algorithm = "string" # Signature algorithm
certificate_path = "string" # Certificate file path
verify_downloads = true # Verify download integrity

# ==============================================================================
# TELEMETRY - Analytics and Usage Tracking
# ==============================================================================
[telemetry]
# Telemetry configuration
enabled = false # Telemetry enabled by default
opt_out_available = true # Users can opt out
anonymous_data_only = true # Only anonymous data
retention_period = 90 # Data retention (days)

# Data collection
[telemetry.collection]
usage_metrics = false # Collect usage metrics
performance_metrics = false # Collect performance data
error_reporting = false # Collect error reports
feature_usage = false # Track feature usage
crash_reports = false # Collect crash reports

# Privacy compliance
[telemetry.privacy]
gdpr_compliant = true # GDPR compliance
ccpa_compliant = true # CCPA compliance
data_anonymization = "string" # Anonymization method
user_consent_required = true # Requires user consent

# ==============================================================================
# MONITORING - Health and Diagnostics
# ==============================================================================
[monitoring]
# Health monitoring
health_checks = false # Supports health checks
health_check_interval = 60000 # Health check interval (ms)
health_endpoints = ["string"] # Health check endpoints

# Diagnostic capabilities
[monitoring.diagnostics]
self_diagnostics = false # Self-diagnostic capability
diagnostic_commands = ["string"] # Diagnostic commands
log_collection = false # Can collect logs
trace_collection = false # Can collect traces

# Alerting
[monitoring.alerting]
supports_alerts = false # Supports alerting
alert_levels = ["string"] # Alert severity levels
notification_channels = ["string"] # Alert notification methods

# ==============================================================================
# METADATA - Comprehensive Extension Information
# ==============================================================================
[metadata]
# Lifecycle information
creation_date = "string" # ISO 8601 creation date
last_updated = "string" # ISO 8601 last update
deprecation_date = "string" # ISO 8601 deprecation date (if applicable)
end_of_life_date = "string" # ISO 8601 end-of-life date (if applicable)

# Quality and maturity
stability = "string" # "experimental" | "alpha" | "beta" | "stable" | "mature"
maturity_level = "string" # Extension maturity level
quality_score = 0.0 # Quality score (0.0-10.0)
test_coverage = 0.0 # Test coverage percentage
documentation_completeness = 0.0 # Documentation completeness score

# Community and support
maintainers = ["string"] # Extension maintainers
contributors = ["string"] # Contributors list
community_links = {} # Community resource links
support_channels = ["string"] # Support channel information

# Usage and adoption
download_count = 0 # Total downloads (calculated)
active_installations = 0 # Active installations (calculated)
user_rating = 0.0 # Average user rating (calculated)
review_count = 0 # Number of reviews (calculated)

# Relationships
related_extensions = ["string"] # Related extension IDs
similar_extensions = ["string"] # Similar extension IDs
complementary_extensions = ["string"] # Complementary extensions
competing_extensions = ["string"] # Competing extensions

# Technical information
[metadata.technical]
code_size = 0 # Source code size (bytes)
binary_size = 0 # Binary size (bytes)
dependency_count = 0 # Number of dependencies
api_surface_area = 0 # Number of public APIs
complexity_score = 0.0 # Code complexity score

# Legal and compliance
[metadata.legal]
copyright_holder = "string" # Copyright holder
license_text_path = "string" # Path to license text
third_party_licenses = ["string"] # Third-party license files
compliance_certifications = ["string"] # Compliance certifications
export_restrictions = "string" # Export control restrictions

# ==============================================================================
# ADVANCED FEATURES - Cutting-Edge Capabilities
# ==============================================================================
[advanced_features]
# AI/ML integration
ai_integration = false # Supports AI/ML features
ml_models = ["string"] # ML model identifiers
inference_backends = ["string"] # Supported inference backends
training_capability = false # Can train models

# Cloud integration
cloud_integration = false # Supports cloud services
cloud_providers = ["string"] # Supported cloud providers
cloud_authentication = ["string"] # Authentication methods
cloud_storage = false # Uses cloud storage

# Real-time collaboration
collaboration_features = false # Supports collaboration
real_time_editing = false # Real-time editing support
conflict_resolution = "string" # Conflict resolution strategy
presence_awareness = false # User presence awareness

# Advanced UI capabilities
[advanced_features.ui]
custom_renderers = false # Custom content renderers
webgl_support = false # WebGL support
canvas_rendering = false # Canvas rendering
svg_manipulation = false # SVG manipulation
animation_support = false # Animation support

# Accessibility features
[advanced_features.accessibility]
screen_reader_support = true # Screen reader compatibility
keyboard_navigation = true # Full keyboard navigation
high_contrast_support = true # High contrast theme support
font_scaling = true # Font scaling support
color_blind_support = false # Color blind accessibility

# ==============================================================================
# EXPERIMENTAL FEATURES - Future-Proofing
# ==============================================================================
[experimental_features]
# Experimental capabilities that may become standard
feature_flags = {} # Feature flag definitions
experimental_apis = ["string"] # Experimental API usage
preview_features = ["string"] # Preview feature identifiers
beta_apis = ["string"] # Beta API usage

# Future compatibility
[experimental_features.future_compat]
forward_compatibility = true # Maintains forward compatibility
breaking_change_policy = "string" # Breaking change policy
migration_support = true # Supports migration between versions
legacy_support_duration = "string" # Legacy support timeline

# Research and development
[experimental_features.research]
research_features = ["string"] # Research feature participation
telemetry_for_research = false # Contribute to research telemetry
experimental_consent = "string" # Experimental feature consent model

# ==============================================================================
# EXTENSION HOOKS - Universal Hook System
# ==============================================================================
[extension_hooks]
# Lifecycle hooks
lifecycle_hooks = ["string"] # Extension lifecycle hooks
activation_hooks = ["string"] # Activation event hooks
deactivation_hooks = ["string"] # Deactivation event hooks
update_hooks = ["string"] # Update event hooks

# System hooks
system_hooks = ["string"] # System-level hooks
editor_hooks = ["string"] # Text editor hooks
file_system_hooks = ["string"] # File system hooks
terminal_hooks = ["string"] # Terminal hooks
ui_hooks = ["string"] # UI system hooks

# Custom hook definitions
[[custom_hooks]]
name = "string" # Hook name
description = "string" # Hook description
trigger_conditions = ["string"] # When hook is triggered
data_schema = {} # Hook data schema
async_execution = true # Asynchronous execution
cancellable = false # Can be cancelled

# ==============================================================================
# INTEGRATION POINTS - Third-Party Integration
# ==============================================================================
[integration_points]
# External tool integration
external_tools = ["string"] # External tool identifiers
tool_configuration = {} # Tool-specific configuration
tool_detection = {} # Automatic tool detection rules

# IDE integration
ide_features = ["string"] # IDE feature integrations
editor_integration_level = "string" # Level of editor integration
project_system_integration = false # Project system integration
build_system_integration = ["string"] # Build system integrations

# Platform integration
platform_specific_features = {} # Platform-specific integrations
native_integration = false # Native platform integration
shell_integration = false # Shell integration
desktop_integration = false # Desktop environment integration

# ==============================================================================
# SCHEMA VERSIONING - Future Evolution
# ==============================================================================
[schema_version]
version = "3.0.0" # Manifest schema version
compatible_versions = ["string"] # Compatible schema versions
migration_required = false # Requires migration from older versions
migration_guide = "string" # Migration guide URL

# Schema extensions
[schema_version.extensions]
custom_fields = {} # Custom field definitions
vendor_extensions = {} # Vendor-specific extensions
experimental_fields = {} # Experimental field definitions

# Validation
[schema_version.validation]
strict_validation = true # Strict schema validation
unknown_field_handling = "string" # "error" | "warn" | "ignore"
validation_level = "string" # Validation strictness level
```