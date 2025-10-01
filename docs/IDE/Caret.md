# Caret

```python
# Symphony Caret Library v1.0.0
# Comprehensive API specification for Symphony extension development
# This represents all features exposed by Symphony's core to extensions through the Caret library

# ==============================================================================
# CARET API METADATA
# ==============================================================================
[caret_api]
version = "1.0.0"
api_level = 1
compatibility_version = "^1.0.0"
documentation_url = "https://docs.symphony-ide.dev/caret-api"
changelog_url = "https://docs.symphony-ide.dev/caret-api/changelog"

# ==============================================================================
# TEXT EDITOR API - Core editing functionality
# ==============================================================================
[editor_api]
namespace = "symphony.editor"
description = "Text editor manipulation and integration"
stability = "stable"

# Document management
[editor_api.document]
get_active_document = { description = "Get currently active document", returns = "Document" }
get_all_documents = { description = "Get all open documents", returns = "Document[]" }
create_document = { description = "Create new document", params = ["content?: string", "language?: string"], returns = "Document" }
open_document = { description = "Open document from path", params = ["path: string"], returns = "Promise<Document>" }
save_document = { description = "Save document", params = ["document: Document"], returns = "Promise<boolean>" }
close_document = { description = "Close document", params = ["document: Document"], returns = "Promise<boolean>" }

# Text manipulation
[editor_api.text]
get_text = { description = "Get document text", params = ["document: Document"], returns = "string" }
set_text = { description = "Set document text", params = ["document: Document", "text: string"], returns = "void" }
insert_text = { description = "Insert text at position", params = ["document: Document", "position: Position", "text: string"], returns = "void" }
delete_text = { description = "Delete text range", params = ["document: Document", "range: Range"], returns = "void" }
replace_text = { description = "Replace text in range", params = ["document: Document", "range: Range", "text: string"], returns = "void" }

# Cursor and selection
[editor_api.cursor]
get_cursor_position = { description = "Get cursor position", params = ["document: Document"], returns = "Position" }
set_cursor_position = { description = "Set cursor position", params = ["document: Document", "position: Position"], returns = "void" }
get_selection = { description = "Get current selection", params = ["document: Document"], returns = "Range" }
set_selection = { description = "Set selection range", params = ["document: Document", "range: Range"], returns = "void" }
get_multiple_cursors = { description = "Get all cursor positions", params = ["document: Document"], returns = "Position[]" }

# Editor state
[editor_api.state]
get_language = { description = "Get document language", params = ["document: Document"], returns = "string" }
set_language = { description = "Set document language", params = ["document: Document", "language: string"], returns = "void" }
is_modified = { description = "Check if document is modified", params = ["document: Document"], returns = "boolean" }
get_line_count = { description = "Get document line count", params = ["document: Document"], returns = "number" }
get_line_text = { description = "Get line text", params = ["document: Document", "line: number"], returns = "string" }

# Editor events
[editor_api.events]
on_document_open = { description = "Document opened event", callback = "DocumentEventCallback" }
on_document_close = { description = "Document closed event", callback = "DocumentEventCallback" }
on_document_save = { description = "Document saved event", callback = "DocumentEventCallback" }
on_text_change = { description = "Text changed event", callback = "TextChangeEventCallback" }
on_cursor_change = { description = "Cursor position changed", callback = "CursorChangeEventCallback" }
on_selection_change = { description = "Selection changed event", callback = "SelectionChangeEventCallback" }

# ==============================================================================
# FILE SYSTEM API - File and directory operations
# ==============================================================================
[file_system_api]
namespace = "symphony.fs"
description = "File system operations and monitoring"
stability = "stable"

# File operations
[file_system_api.file]
read_file = { description = "Read file contents", params = ["path: string"], returns = "Promise<string>" }
write_file = { description = "Write file contents", params = ["path: string", "content: string"], returns = "Promise<void>" }
append_file = { description = "Append to file", params = ["path: string", "content: string"], returns = "Promise<void>" }
delete_file = { description = "Delete file", params = ["path: string"], returns = "Promise<void>" }
copy_file = { description = "Copy file", params = ["src: string", "dest: string"], returns = "Promise<void>" }
move_file = { description = "Move/rename file", params = ["src: string", "dest: string"], returns = "Promise<void>" }
file_exists = { description = "Check if file exists", params = ["path: string"], returns = "Promise<boolean>" }

# Directory operations
[file_system_api.directory]
read_directory = { description = "Read directory contents", params = ["path: string"], returns = "Promise<DirectoryEntry[]>" }
create_directory = { description = "Create directory", params = ["path: string"], returns = "Promise<void>" }
delete_directory = { description = "Delete directory", params = ["path: string", "recursive?: boolean"], returns = "Promise<void>" }
directory_exists = { description = "Check if directory exists", params = ["path: string"], returns = "Promise<boolean>" }

# File metadata
[file_system_api.metadata]
get_file_stats = { description = "Get file statistics", params = ["path: string"], returns = "Promise<FileStat>" }
get_file_type = { description = "Get file type", params = ["path: string"], returns = "Promise<FileType>" }
get_file_size = { description = "Get file size", params = ["path: string"], returns = "Promise<number>" }
get_modification_time = { description = "Get last modified time", params = ["path: string"], returns = "Promise<Date>" }

# File watching
[file_system_api.watcher]
watch_file = { description = "Watch file for changes", params = ["path: string", "callback: FileWatchCallback"], returns = "FileWatcher" }
watch_directory = { description = "Watch directory for changes", params = ["path: string", "options: WatchOptions", "callback: DirectoryWatchCallback"], returns = "DirectoryWatcher" }
unwatch = { description = "Stop watching file/directory", params = ["watcher: Watcher"], returns = "void" }

# Path utilities
[file_system_api.path]
join_path = { description = "Join path segments", params = ["...segments: string[]"], returns = "string" }
resolve_path = { description = "Resolve absolute path", params = ["path: string"], returns = "string" }
relative_path = { description = "Get relative path", params = ["from: string", "to: string"], returns = "string" }
get_dirname = { description = "Get directory name", params = ["path: string"], returns = "string" }
get_basename = { description = "Get base name", params = ["path: string"], returns = "string" }
get_extension = { description = "Get file extension", params = ["path: string"], returns = "string" }

# ==============================================================================
# FILE TREE API - File explorer integration
# ==============================================================================
[file_tree_api]
namespace = "symphony.filetree"
description = "File tree/explorer integration"
stability = "stable"

# Tree structure
[file_tree_api.tree]
get_root_path = { description = "Get root directory path", returns = "string" }
set_root_path = { description = "Set root directory path", params = ["path: string"], returns = "void" }
get_tree_items = { description = "Get tree items for path", params = ["path: string"], returns = "TreeItem[]" }
refresh_tree = { description = "Refresh file tree", params = ["path?: string"], returns = "void" }
expand_item = { description = "Expand tree item", params = ["path: string"], returns = "void" }
collapse_item = { description = "Collapse tree item", params = ["path: string"], returns = "void" }

# Tree selection
[file_tree_api.selection]
get_selected_items = { description = "Get selected tree items", returns = "TreeItem[]" }
set_selected_items = { description = "Set selected tree items", params = ["items: TreeItem[]"], returns = "void" }
get_focused_item = { description = "Get focused tree item", returns = "TreeItem?" }
set_focused_item = { description = "Set focused tree item", params = ["item: TreeItem"], returns = "void" }

# Tree customization
[file_tree_api.customization]
add_context_menu_item = { description = "Add context menu item", params = ["item: ContextMenuItem"], returns = "void" }
remove_context_menu_item = { description = "Remove context menu item", params = ["id: string"], returns = "void" }
set_item_icon = { description = "Set custom icon for item", params = ["path: string", "icon: Icon"], returns = "void" }
set_item_decoration = { description = "Add decoration to item", params = ["path: string", "decoration: Decoration"], returns = "void" }

# Tree events
[file_tree_api.events]
on_item_select = { description = "Item selection changed", callback = "TreeSelectionCallback" }
on_item_open = { description = "Item opened/double-clicked", callback = "TreeItemCallback" }
on_context_menu = { description = "Context menu requested", callback = "TreeContextMenuCallback" }
on_tree_refresh = { description = "Tree refreshed", callback = "TreeRefreshCallback" }

# ==============================================================================
# UI API - User interface manipulation
# ==============================================================================
[ui_api]
namespace = "symphony.ui"
description = "User interface creation and manipulation"
stability = "stable"

# Panel management
[ui_api.panels]
create_panel = { description = "Create new UI panel", params = ["config: PanelConfig"], returns = "Panel" }
show_panel = { description = "Show panel", params = ["panel: Panel"], returns = "void" }
hide_panel = { description = "Hide panel", params = ["panel: Panel"], returns = "void" }
destroy_panel = { description = "Destroy panel", params = ["panel: Panel"], returns = "void" }
get_active_panel = { description = "Get active panel", returns = "Panel?" }

# Sidebar integration
[ui_api.sidebar]
add_sidebar_item = { description = "Add sidebar item", params = ["item: SidebarItem"], returns = "void" }
remove_sidebar_item = { description = "Remove sidebar item", params = ["id: string"], returns = "void" }
set_sidebar_badge = { description = "Set badge on sidebar item", params = ["id: string", "badge: Badge"], returns = "void" }

# Status bar integration
[ui_api.statusbar]
add_status_item = { description = "Add status bar item", params = ["item: StatusBarItem"], returns = "StatusBarItem" }
update_status_item = { description = "Update status bar item", params = ["item: StatusBarItem", "updates: Partial<StatusBarItem>"], returns = "void" }
remove_status_item = { description = "Remove status bar item", params = ["item: StatusBarItem"], returns = "void" }

# Dialog system
[ui_api.dialogs]
show_message = { description = "Show message dialog", params = ["message: string", "type: MessageType"], returns = "Promise<void>" }
show_question = { description = "Show question dialog", params = ["question: string", "buttons: string[]"], returns = "Promise<string>" }
show_input = { description = "Show input dialog", params = ["prompt: string", "defaultValue?: string"], returns = "Promise<string?>" }
show_file_picker = { description = "Show file picker", params = ["options: FilePickerOptions"], returns = "Promise<string[]>" }
show_save_dialog = { description = "Show save dialog", params = ["options: SaveDialogOptions"], returns = "Promise<string?>" }

# Notification system
[ui_api.notifications]
show_notification = { description = "Show notification", params = ["notification: Notification"], returns = "void" }
show_progress = { description = "Show progress notification", params = ["config: ProgressConfig"], returns = "Progress" }
update_progress = { description = "Update progress", params = ["progress: Progress", "value: number", "message?: string"], returns = "void" }
hide_progress = { description = "Hide progress", params = ["progress: Progress"], returns = "void" }

# Theme system
[ui_api.themes]
get_current_theme = { description = "Get current theme", returns = "Theme" }
get_theme_colors = { description = "Get theme colors", returns = "ThemeColors" }
register_theme_change_listener = { description = "Listen for theme changes", params = ["callback: ThemeChangeCallback"], returns = "void" }

# ==============================================================================
# TERMINAL API - Terminal integration
# ==============================================================================
[terminal_api]
namespace = "symphony.terminal"
description = "Terminal integration and control"
stability = "stable"

# Terminal management
[terminal_api.management]
create_terminal = { description = "Create new terminal", params = ["config: TerminalConfig"], returns = "Terminal" }
get_active_terminal = { description = "Get active terminal", returns = "Terminal?" }
get_all_terminals = { description = "Get all terminals", returns = "Terminal[]" }
destroy_terminal = { description = "Destroy terminal", params = ["terminal: Terminal"], returns = "void" }

# Terminal control
[terminal_api.control]
send_text = { description = "Send text to terminal", params = ["terminal: Terminal", "text: string"], returns = "void" }
send_command = { description = "Send command to terminal", params = ["terminal: Terminal", "command: string"], returns = "void" }
clear_terminal = { description = "Clear terminal", params = ["terminal: Terminal"], returns = "void" }
focus_terminal = { description = "Focus terminal", params = ["terminal: Terminal"], returns = "void" }

# Terminal output
[terminal_api.output]
get_terminal_text = { description = "Get terminal text content", params = ["terminal: Terminal"], returns = "string" }
capture_output = { description = "Capture terminal output", params = ["terminal: Terminal", "callback: OutputCallback"], returns = "OutputCapture" }
stop_capture = { description = "Stop output capture", params = ["capture: OutputCapture"], returns = "void" }

# Terminal events
[terminal_api.events]
on_terminal_create = { description = "Terminal created", callback = "TerminalEventCallback" }
on_terminal_destroy = { description = "Terminal destroyed", callback = "TerminalEventCallback" }
on_terminal_output = { description = "Terminal output received", callback = "TerminalOutputCallback" }
on_terminal_focus = { description = "Terminal focused", callback = "TerminalEventCallback" }

# ==============================================================================
# SETTINGS API - Configuration system integration
# ==============================================================================
[settings_api]
namespace = "symphony.settings"
description = "Settings and configuration management"
stability = "stable"

# Setting values
[settings_api.values]
get_setting = { description = "Get setting value", params = ["key: string", "scope?: SettingScope"], returns = "any" }
set_setting = { description = "Set setting value", params = ["key: string", "value: any", "scope?: SettingScope"], returns = "void" }
has_setting = { description = "Check if setting exists", params = ["key: string", "scope?: SettingScope"], returns = "boolean" }
delete_setting = { description = "Delete setting", params = ["key: string", "scope?: SettingScope"], returns = "void" }

# Setting metadata
[settings_api.metadata]
get_setting_info = { description = "Get setting metadata", params = ["key: string"], returns = "SettingInfo" }
get_all_settings = { description = "Get all settings", params = ["scope?: SettingScope"], returns = "Record<string, any>" }
get_setting_keys = { description = "Get all setting keys", params = ["scope?: SettingScope"], returns = "string[]" }

# Setting events
[settings_api.events]
on_setting_change = { description = "Setting value changed", params = ["key: string", "callback: SettingChangeCallback"], returns = "void" }
on_settings_reset = { description = "Settings reset", callback = "SettingsResetCallback" }

# Configuration schema
[settings_api.schema]
register_setting_schema = { description = "Register setting schema", params = ["schema: SettingSchema"], returns = "void" }
validate_setting = { description = "Validate setting value", params = ["key: string", "value: any"], returns = "ValidationResult" }

# ==============================================================================
# COMMAND API - Command system integration
# ==============================================================================
[command_api]
namespace = "symphony.commands"
description = "Command registration and execution"
stability = "stable"

# Command registration
[command_api.registration]
register_command = { description = "Register new command", params = ["id: string", "handler: CommandHandler"], returns = "void" }
unregister_command = { description = "Unregister command", params = ["id: string"], returns = "void" }
get_command = { description = "Get command info", params = ["id: string"], returns = "CommandInfo?" }
get_all_commands = { description = "Get all registered commands", returns = "CommandInfo[]" }

# Command execution
[command_api.execution]
execute_command = { description = "Execute command", params = ["id: string", "...args: any[]"], returns = "Promise<any>" }
can_execute_command = { description = "Check if command can execute", params = ["id: string"], returns = "boolean" }

# Command palette
[command_api.palette]
add_to_palette = { description = "Add command to palette", params = ["id: string", "config: PaletteConfig"], returns = "void" }
remove_from_palette = { description = "Remove from palette", params = ["id: string"], returns = "void" }

# ==============================================================================
# EVENT API - Event system integration
# ==============================================================================
[event_api]
namespace = "symphony.events"
description = "Event system for inter-component communication"
stability = "stable"

# Event subscription
[event_api.subscription]
subscribe = { description = "Subscribe to event", params = ["event: string", "callback: EventCallback"], returns = "EventSubscription" }
unsubscribe = { description = "Unsubscribe from event", params = ["subscription: EventSubscription"], returns = "void" }
once = { description = "Subscribe to event once", params = ["event: string", "callback: EventCallback"], returns = "void" }

# Event emission
[event_api.emission]
emit = { description = "Emit event", params = ["event: string", "data?: any"], returns = "void" }
emit_async = { description = "Emit event asynchronously", params = ["event: string", "data?: any"], returns = "Promise<void>" }

# Event filtering
[event_api.filtering]
create_filter = { description = "Create event filter", params = ["predicate: EventPredicate"], returns = "EventFilter" }
apply_filter = { description = "Apply filter to subscription", params = ["subscription: EventSubscription", "filter: EventFilter"], returns = "void" }

# ==============================================================================
# SYNTAX API - Syntax highlighting integration
# ==============================================================================
[syntax_api]
namespace = "symphony.syntax"
description = "Syntax highlighting and language support"
stability = "stable"

# Language registration
[syntax_api.languages]
register_language = { description = "Register new language", params = ["config: LanguageConfig"], returns = "void" }
unregister_language = { description = "Unregister language", params = ["id: string"], returns = "void" }
get_language = { description = "Get language config", params = ["id: string"], returns = "LanguageConfig?" }
get_all_languages = { description = "Get all languages", returns = "LanguageConfig[]" }

# Grammar registration
[syntax_api.grammars]
register_grammar = { description = "Register TextMate grammar", params = ["config: GrammarConfig"], returns = "void" }
unregister_grammar = { description = "Unregister grammar", params = ["scopeName: string"], returns = "void" }
get_grammar = { description = "Get grammar config", params = ["scopeName: string"], returns = "GrammarConfig?" }

# Tokenization
[syntax_api.tokenization]
tokenize_line = { description = "Tokenize single line", params = ["text: string", "grammar: string"], returns = "Token[]" }
tokenize_document = { description = "Tokenize entire document", params = ["document: Document"], returns = "TokenizedLine[]" }

# ==============================================================================
# KEYBINDING API - Keyboard shortcut system
# ==============================================================================
[keybinding_api]
namespace = "symphony.keybindings"
description = "Keyboard shortcut registration and management"
stability = "stable"

# Keybinding registration
[keybinding_api.registration]
register_keybinding = { description = "Register keybinding", params = ["binding: KeybindingConfig"], returns = "void" }
unregister_keybinding = { description = "Unregister keybinding", params = ["key: string", "command: string"], returns = "void" }
get_keybinding = { description = "Get keybinding for command", params = ["command: string"], returns = "KeybindingConfig?" }
get_all_keybindings = { description = "Get all keybindings", returns = "KeybindingConfig[]" }

# Keybinding execution
[keybinding_api.execution]
simulate_keybinding = { description = "Simulate key press", params = ["key: string"], returns = "boolean" }
get_conflicting_bindings = { description = "Get conflicting keybindings", params = ["key: string"], returns = "KeybindingConfig[]" }

# ==============================================================================
# MENU API - Context menu and menu bar integration
# ==============================================================================
[menu_api]
namespace = "symphony.menus"
description = "Menu system integration"
stability = "stable"

# Menu creation
[menu_api.creation]
create_menu = { description = "Create new menu", params = ["config: MenuConfig"], returns = "Menu" }
create_context_menu = { description = "Create context menu", params = ["items: MenuItem[]"], returns = "ContextMenu" }
show_context_menu = { description = "Show context menu", params = ["menu: ContextMenu", "position: Point"], returns = "void" }

# Menu items
[menu_api.items]
create_menu_item = { description = "Create menu item", params = ["config: MenuItemConfig"], returns = "MenuItem" }
create_submenu = { description = "Create submenu", params = ["label: string", "items: MenuItem[]"], returns = "MenuItem" }
create_separator = { description = "Create menu separator", returns = "MenuItem" }

# Menu integration
[menu_api.integration]
add_to_editor_context = { description = "Add to editor context menu", params = ["item: MenuItem"], returns = "void" }
add_to_file_context = { description = "Add to file context menu", params = ["item: MenuItem"], returns = "void" }
remove_from_context = { description = "Remove from context menu", params = ["itemId: string"], returns = "void" }

# ==============================================================================
# PROCESS API - External process management
# ==============================================================================
[process_api]
namespace = "symphony.process"
description = "External process spawning and management"
stability = "stable"
security_level = "elevated" # Requires elevated permissions

# Process spawning
[process_api.spawning]
spawn = { description = "Spawn process", params = ["command: string", "args: string[]", "options?: SpawnOptions"], returns = "Promise<Process>" }
spawn_shell = { description = "Spawn shell command", params = ["command: string", "options?: SpawnOptions"], returns = "Promise<Process>" }
exec = { description = "Execute command and wait", params = ["command: string", "options?: ExecOptions"], returns = "Promise<ExecResult>" }

# Process control
[process_api.control]
kill_process = { description = "Kill process", params = ["process: Process", "signal?: string"], returns = "Promise<void>" }
send_signal = { description = "Send signal to process", params = ["process: Process", "signal: string"], returns = "Promise<void>" }
is_running = { description = "Check if process is running", params = ["process: Process"], returns = "boolean" }

# Process communication
[process_api.communication]
write_to_stdin = { description = "Write to process stdin", params = ["process: Process", "data: string"], returns = "void" }
read_stdout = { description = "Read from process stdout", params = ["process: Process"], returns = "Promise<string>" }
read_stderr = { description = "Read from process stderr", params = ["process: Process"], returns = "Promise<string>" }

# Process monitoring
[process_api.monitoring]
on_process_exit = { description = "Process exit event", params = ["process: Process", "callback: ProcessExitCallback"], returns = "void" }
on_stdout_data = { description = "Stdout data event", params = ["process: Process", "callback: ProcessDataCallback"], returns = "void" }
on_stderr_data = { description = "Stderr data event", params = ["process: Process", "callback: ProcessDataCallback"], returns = "void" }

# ==============================================================================
# NETWORK API - Network communication
# ==============================================================================
[network_api]
namespace = "symphony.network"
description = "Network communication capabilities"
stability = "stable"
security_level = "elevated" # Requires network permissions

# HTTP client
[network_api.http]
get = { description = "HTTP GET request", params = ["url: string", "options?: HttpOptions"], returns = "Promise<HttpResponse>" }
post = { description = "HTTP POST request", params = ["url: string", "data?: any", "options?: HttpOptions"], returns = "Promise<HttpResponse>" }
put = { description = "HTTP PUT request", params = ["url: string", "data?: any", "options?: HttpOptions"], returns = "Promise<HttpResponse>" }
delete = { description = "HTTP DELETE request", params = ["url: string", "options?: HttpOptions"], returns = "Promise<HttpResponse>" }
request = { description = "Generic HTTP request", params = ["config: HttpRequestConfig"], returns = "Promise<HttpResponse>" }

# WebSocket client
[network_api.websocket]
create_websocket = { description = "Create WebSocket connection", params = ["url: string", "options?: WebSocketOptions"], returns = "WebSocket" }
send_message = { description = "Send WebSocket message", params = ["ws: WebSocket", "message: string | Buffer"], returns = "void" }
close_websocket = { description = "Close WebSocket connection", params = ["ws: WebSocket"], returns = "void" }

# Network utilities
[network_api.utilities]
is_online = { description = "Check network connectivity", returns = "Promise<boolean>" }
resolve_dns = { description = "Resolve DNS name", params = ["hostname: string"], returns = "Promise<string[]>" }
ping = { description = "Ping host", params = ["host: string"], returns = "Promise<PingResult>" }

# ==============================================================================
# STORAGE API - Data persistence
# ==============================================================================
[storage_api]
namespace = "symphony.storage"
description = "Data persistence and storage"
stability = "stable"

# Key-value storage
[storage_api.keyvalue]
get = { description = "Get stored value", params = ["key: string"], returns = "Promise<any>" }
set = { description = "Set stored value", params = ["key: string", "value: any"], returns = "Promise<void>" }
delete = { description = "Delete stored value", params = ["key: string"], returns = "Promise<void>" }
has = { description = "Check if key exists", params = ["key: string"], returns = "Promise<boolean>" }
keys = { description = "Get all keys", returns = "Promise<string[]>" }
clear = { description = "Clear all storage", returns = "Promise<void>" }

# File-based storage
[storage_api.file]
write_data_file = { description = "Write data to file", params = ["filename: string", "data: any"], returns = "Promise<void>" }
read_data_file = { description = "Read data from file", params = ["filename: string"], returns = "Promise<any>" }
delete_data_file = { description = "Delete data file", params = ["filename: string"], returns = "Promise<void>" }
list_data_files = { description = "List data files", returns = "Promise<string[]>" }

# Storage events
[storage_api.events]
on_storage_change = { description = "Storage value changed", params = ["key: string", "callback: StorageChangeCallback"], returns = "void" }

# ==============================================================================
# DIAGNOSTIC API - Problem reporting and diagnostics
# ==============================================================================
[diagnostic_api]
namespace = "symphony.diagnostics"
description = "Diagnostic and problem reporting system"
stability = "stable"

# Diagnostic collection
[diagnostic_api.collection]
create_diagnostic_collection = { description = "Create diagnostic collection", params = ["name: string"], returns = "DiagnosticCollection" }
set_diagnostics = { description = "Set diagnostics for document", params = ["collection: DiagnosticCollection", "document: Document", "diagnostics: Diagnostic[]"], returns = "void" }
clear_diagnostics = { description = "Clear diagnostics", params = ["collection: DiagnosticCollection", "document?: Document"], returns = "void" }
get_diagnostics = { description = "Get diagnostics for document", params = ["document: Document"], returns = "Diagnostic[]" }

# Diagnostic types
[diagnostic_api.types]
create_diagnostic = { description = "Create diagnostic", params = ["range: Range", "message: string", "severity: DiagnosticSeverity"], returns = "Diagnostic" }
create_related_information = { description = "Create related information", params = ["location: Location", "message: string"], returns = "RelatedInformation" }

# ==============================================================================
# EXTENSION API - Extension system integration
# ==============================================================================
[extension_api]
namespace = "symphony.extensions"
description = "Extension system and inter-extension communication"
stability = "stable"

# Extension information
[extension_api.info]
get_extension_info = { description = "Get extension information", params = ["extensionId: string"], returns = "ExtensionInfo?" }
get_all_extensions = { description = "Get all installed extensions", returns = "ExtensionInfo[]" }
get_active_extensions = { description = "Get active extensions", returns = "ExtensionInfo[]" }

# Extension lifecycle
[extension_api.lifecycle]
activate_extension = { description = "Activate extension", params = ["extensionId: string"], returns = "Promise<void>" }
deactivate_extension = { description = "Deactivate extension", params = ["extensionId: string"], returns = "Promise<void>" }
reload_extension = { description = "Reload extension", params = ["extensionId: string"], returns = "Promise<void>" }

# Inter-extension communication
[extension_api.communication]
send_message = { description = "Send message to extension", params = ["extensionId: string", "message: any"], returns = "Promise<any>" }
broadcast_message = { description = "Broadcast message to all extensions", params = ["message: any"], returns = "Promise<void>" }
register_message_handler = { description = "Register message handler", params = ["handler: MessageHandler"], returns = "void" }

# Extension events
[extension_api.events]
on_extension_activate = { description = "Extension activated", callback = "ExtensionEventCallback" }
on_extension_deactivate = { description = "Extension deactivated", callback = "ExtensionEventCallback" }

# ==============================================================================
# UTILITY API
...
```