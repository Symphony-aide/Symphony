members = [
    # Core Foundation
    "core",
    "types",
    "config",
	"core_api",
	
	"extension/layers/aide/pit/core",
	"extension/layers/aide/pit/pool_manager",
    "extension/layers/aide/pit/dag_tracker",
    "extension/layers/aide/pit/artifact_store",
    "extension/layers/aide/pit/arbitration_engine",
    "extension/layers/aide/pit/stale_manager",
	"extension/layers/ide/core",
	"extension/layers/ide/ui_bridge",                   
	"extension/layers/ide/virtual_dom", # Virtual DOM implementation
	
	"extension/sdk/core",
    "extension/sdk/testing",         # Test utilities (NEW)
	"extension/sdk/carets",          # Developer SDK (mentioned in docs)
	"extension/sdk/metrics",            # Performance monitoring

	
	# === CONDUCTOR INTEGRATION === (NEW)
    "conductor/bindings",             # PyO3 bindings
    "conductor/orchestration_bridge", # RL model bridge
    "conductor/extension_proxy",      # Extension interface for Conductor

	
	"bootstrap/core",                    # Bootstrap manager
	"bootstrap/phase_manager",           # Staged initialization  
	"bootstrap/health_checker",          # Component health verification
	   
    # IPC Communication Backbone
    "ipc_bus",                    # Hardcoded Rust IPC layer, Links between Condcutor and Backend with Out-of-Process Mechanism
	"ipc_bus/protocol",              # Message serialization (NEW)
    "ipc_bus/transport",             # Unix sockets, named pipes (NEW)
    "ipc_bus/security",              # Message validation (NEW)
	
	# === ORCHESTRATION ENGINE === (NEW)
    "orchestration/core",             # Workflow execution
    "orchestration/melody_engine",    # Melody composition & execution
	
	# Orchestra Kit - Extension Management
	"kit/core",
	"kit/harmony_board",
    "kit/instruments",      # AI/ML models
    "kit/operators",        # Workflow utilities
    "kit/motifs",           # UI addons
	"kit/marketplace",       
	"kit/installer",
	
	"kit/lifecycle",        # Chambering flow implementation
    "kit/registry",         # Extension discovery & registration
    "kit/security",         # Sandboxing & permissions
    "kit/manifest",         # Manifest processing

    "kit/marketplace",
    "kit/installer",
    
    # Infrastructure
    "permissions",
    "logging",
    "hooks",
    
    # Applications
    "desktop",
    "server",
	"terminal", # pty
]
